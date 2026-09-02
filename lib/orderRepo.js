// ============================================================
// Order/checkout data-access. This is the ONLY path that may create a
// marketplace enrollment — price is always read from `courses` server-side
// (never trusted from the client), and payment success is only ever
// established by finalizeBkashCallback() calling bKash's own server back,
// never by trusting a client-reported "payment succeeded".
// ============================================================

import { q, withTransaction } from '@/lib/mysql';
import { HttpError, enrollCourseFromOrder } from '@/lib/repo';
import { validateCoupon, redeemCoupon } from '@/lib/couponRepo';
import { recordAffiliateSale } from '@/lib/affiliateRepo';
import { createPayment, executePayment } from '@/lib/bkash';
import { logger } from '@/lib/logger';
import { recordAudit } from '@/lib/auditLog';

function mapOrder(r) {
  return {
    id: r.id, studentId: r.student_id, status: r.status, amount: r.amount, currency: r.currency,
    couponCode: r.coupon_code, affiliateCode: r.affiliate_code, gateway: r.gateway,
    gatewayPaymentId: r.gateway_payment_id, gatewayTrxId: r.gateway_trx_id,
    createdAt: r.created_at, updatedAt: r.updated_at
  };
}

// Best-effort: credit an affiliate's commission per course line item once an
// order is confirmed paid. Invalid/inactive codes are silently ignored by
// recordAffiliateSale itself — never blocks the purchase.
async function creditAffiliate(affiliateCode, orderId) {
  if (!affiliateCode) return;
  const items = await q('SELECT course_id, unit_price FROM order_items WHERE order_id = ?', [orderId]);
  for (const item of items) {
    await recordAffiliateSale(affiliateCode, item.unit_price, item.course_id)
      .catch((e) => logger.error('affiliate_credit_failed', { orderId, affiliateCode, message: e.message }));
  }
}

async function coursesById(ids) {
  if (!ids.length) return [];
  const rows = await q(`SELECT id, price, published FROM courses WHERE id IN (${ids.map(() => '?').join(',')})`, ids);
  return rows;
}

export async function getOrder(id) {
  const [row] = await q('SELECT * FROM orders WHERE id = ?', [id]);
  return row ? mapOrder(row) : null;
}

// Staff-facing order/transaction monitoring — the real marketplace ledger
// (orders/order_items from Phase 3), distinct from the legacy manual
// batch-fee `payments` table the owner Fees tab still uses.
export async function getOrders() {
  const orders = await q(
    `SELECT o.*, s.name AS student_name
     FROM orders o LEFT JOIN students s ON s.id = o.student_id
     ORDER BY o.id DESC LIMIT 500`
  );
  if (!orders.length) return [];
  const items = await q(
    `SELECT oi.order_id, oi.course_id, oi.unit_price, c.title AS course_title
     FROM order_items oi LEFT JOIN courses c ON c.id = oi.course_id
     WHERE oi.order_id IN (${orders.map(() => '?').join(',')})`,
    orders.map((o) => o.id)
  );
  const itemsByOrder = {};
  for (const it of items) (itemsByOrder[it.order_id] = itemsByOrder[it.order_id] || []).push(it);

  return orders.map((o) => ({
    ...mapOrder(o),
    studentName: o.student_name,
    items: (itemsByOrder[o.id] || []).map((it) => ({ courseId: it.course_id, courseTitle: it.course_title, unitPrice: it.unit_price }))
  }));
}

// Refunding a real order also revokes the enrollment(s) it granted — the
// audit's original finding was that refund/cancellation never affected
// access at all. Marks enrollments 'cancelled' (not deleted) so the history
// stays intact.
export async function refundOrder(session, orderId) {
  const [order] = await q('SELECT * FROM orders WHERE id = ?', [orderId]);
  if (!order) throw new HttpError(404, { error: 'order_not_found' });
  if (order.status !== 'paid') throw new HttpError(400, { error: 'order_not_refundable' });

  const items = await q('SELECT course_id FROM order_items WHERE order_id = ?', [orderId]);

  await withTransaction(async (tx) => {
    await tx("UPDATE orders SET status = 'refunded' WHERE id = ?", [orderId]);
    for (const item of items) {
      await tx("UPDATE enrollments SET status = 'cancelled' WHERE student_id = ? AND course_id = ?", [order.student_id, item.course_id]);
    }
  });

  await recordAudit({
    session, action: 'order_refunded', targetType: 'order', targetId: orderId,
    detail: `student=${order.student_id} amount=${order.amount} courses=${items.map((i) => i.course_id).join(',')}`
  });

  const [fresh] = await q('SELECT * FROM orders WHERE id = ?', [orderId]);
  return mapOrder(fresh);
}

// body: { courseId } for a single purchase, or { items: [{courseId}], couponCode? } for a cart.
export async function createOrder(session, body) {
  const studentId = session.studentId;
  if (!studentId) throw new HttpError(400, { error: 'no_student_profile' });

  const requested = Array.isArray(body.items)
    ? body.items.map((i) => Number(i.courseId)).filter(Boolean)
    : body.courseId ? [Number(body.courseId)] : [];
  const courseIds = [...new Set(requested)];
  if (!courseIds.length) throw new HttpError(400, { error: 'no_items' });

  const courses = await coursesById(courseIds);
  if (courses.length !== courseIds.length) throw new HttpError(404, { error: 'course_not_found' });
  if (courses.some((c) => !c.published)) throw new HttpError(400, { error: 'course_not_published' });

  // A cancelled (refunded) enrollment doesn't block re-purchasing — only an
  // active one does. enrollCourseFromOrder() reactivates the cancelled row
  // rather than inserting a fresh one when this order completes.
  const already = await q(
    `SELECT course_id FROM enrollments WHERE student_id = ? AND status = 'active' AND course_id IN (${courseIds.map(() => '?').join(',')})`,
    [studentId, ...courseIds]
  );
  if (already.length) throw new HttpError(409, { error: 'already_enrolled', courseIds: already.map((r) => r.course_id) });

  // Authoritative price: sum of the DB's own course.price. The client never
  // supplies or influences this number.
  const rawTotal = courses.reduce((sum, c) => sum + c.price, 0);

  let couponCode = null;
  let amount = rawTotal;
  if (body.couponCode) {
    const result = await validateCoupon(body.couponCode, rawTotal, session);
    couponCode = result.code;
    amount = result.finalAmount;
  }
  const affiliateCode = body.affiliateCode ? String(body.affiliateCode).trim().toUpperCase() : null;

  const orderId = await withTransaction(async (tx) => {
    const orderRes = await tx(
      'INSERT INTO orders (student_id, status, amount, currency, coupon_code, affiliate_code, gateway) VALUES (?,?,?,?,?,?,?)',
      [studentId, 'pending', amount, 'BDT', couponCode, affiliateCode, amount === 0 ? 'none' : 'bkash']
    );
    const id = orderRes.insertId;
    for (const c of courses) {
      await tx('INSERT INTO order_items (order_id, course_id, unit_price) VALUES (?,?,?)', [id, c.id, c.price]);
    }
    return id;
  });

  if (amount === 0) {
    return finalizeFreeOrder(orderId, { studentId, courseIds, couponCode, affiliateCode });
  }

  const callbackURL = `${process.env.APP_BASE_URL || ''}/api/payments/bkash/callback`;
  let created;
  try {
    created = await createPayment({ amount, orderId, callbackURL, payerReference: String(studentId) });
  } catch (e) {
    await q("UPDATE orders SET status = 'failed' WHERE id = ?", [orderId]);
    logger.error('order_gateway_create_failed', { orderId, message: e.message });
    throw new HttpError(502, { error: 'gateway_unavailable' });
  }

  await q('UPDATE orders SET gateway_payment_id = ? WHERE id = ?', [created.paymentID, orderId]);
  await q(
    'INSERT INTO payment_events (order_id, gateway, event_type, gateway_payment_id, status, raw_payload) VALUES (?,?,?,?,?,?)',
    [orderId, 'bkash', 'create', created.paymentID, 'initiated', JSON.stringify(created)]
  );

  return { order: { id: orderId, status: 'pending', amount }, bkashURL: created.bkashURL };
}

async function finalizeFreeOrder(orderId, { studentId, courseIds, couponCode, affiliateCode }) {
  await withTransaction(async (tx) => {
    await tx("UPDATE orders SET status = 'paid' WHERE id = ?", [orderId]);
    for (const courseId of courseIds) {
      await enrollCourseFromOrder(tx, { studentId, courseId });
    }
  });
  if (couponCode) {
    await redeemCoupon(couponCode).catch((e) => logger.error('coupon_redeem_failed', { couponCode, message: e.message }));
  }
  await creditAffiliate(affiliateCode, orderId);
  return { order: { id: orderId, status: 'paid', amount: 0 }, paid: true };
}

// Called from the bKash redirect/callback route. Never trusts the redirect's
// query params for success — always re-verifies with bKash's own server
// (executePayment) before marking anything paid, and is safe to call more
// than once for the same paymentID (see the payment_events unique constraint).
export async function finalizeBkashCallback({ paymentID, status }) {
  if (!paymentID) throw new HttpError(400, { error: 'missing_payment_id' });

  const [order] = await q('SELECT * FROM orders WHERE gateway_payment_id = ?', [paymentID]);
  if (!order) throw new HttpError(404, { error: 'order_not_found' });

  if (order.status === 'paid') {
    return { order: mapOrder(order), alreadyProcessed: true };
  }

  if (status !== 'success') {
    const nextStatus = status === 'cancel' ? 'cancelled' : 'failed';
    await q('UPDATE orders SET status = ? WHERE id = ?', [nextStatus, order.id]);
    try {
      await q(
        'INSERT INTO payment_events (order_id, gateway, event_type, gateway_payment_id, status) VALUES (?,?,?,?,?)',
        [order.id, 'bkash', 'callback_failed', paymentID, status]
      );
    } catch (e) { if (e.code !== 'ER_DUP_ENTRY') throw e; }
    return { order: mapOrder({ ...order, status: nextStatus }), failed: true };
  }

  // The real verification: ask bKash's own server, never trust the redirect alone.
  const executed = await executePayment(paymentID);

  // Idempotency guard. A duplicate 'execute' callback for this paymentID
  // (double redirect, retried webhook, user hitting back+forward) hits this
  // UNIQUE(gateway_payment_id, event_type) constraint and is caught below
  // instead of ever reaching the enrollment step a second time.
  try {
    await q(
      `INSERT INTO payment_events (order_id, gateway, event_type, gateway_payment_id, gateway_trx_id, status, raw_payload)
       VALUES (?,?,?,?,?,?,?)`,
      [order.id, 'bkash', 'execute', paymentID, executed.trxID || null, executed.transactionStatus || null, JSON.stringify(executed.raw)]
    );
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') {
      const [fresh] = await q('SELECT * FROM orders WHERE id = ?', [order.id]);
      return { order: mapOrder(fresh), alreadyProcessed: true };
    }
    throw e;
  }

  if (executed.transactionStatus !== 'Completed') {
    await q("UPDATE orders SET status = 'failed' WHERE id = ?", [order.id]);
    return { order: mapOrder({ ...order, status: 'failed' }), failed: true };
  }

  // Never trust an amount the client or the redirect implied — only what
  // bKash's own server confirms, compared against what we computed and
  // stored at order-creation time.
  if (Number(executed.amount) !== Number(order.amount)) {
    logger.error('order_amount_mismatch', { orderId: order.id, expected: order.amount, gatewayAmount: executed.amount });
    await q("UPDATE orders SET status = 'failed' WHERE id = ?", [order.id]);
    return { order: mapOrder({ ...order, status: 'failed' }), failed: true };
  }

  const items = await q('SELECT course_id FROM order_items WHERE order_id = ?', [order.id]);

  await withTransaction(async (tx) => {
    await tx("UPDATE orders SET status = 'paid', gateway_trx_id = ? WHERE id = ?", [executed.trxID, order.id]);
    for (const item of items) {
      await enrollCourseFromOrder(tx, { studentId: order.student_id, courseId: item.course_id });
    }
  });

  if (order.coupon_code) {
    await redeemCoupon(order.coupon_code).catch((e) => logger.error('coupon_redeem_failed', { couponCode: order.coupon_code, message: e.message }));
  }
  await creditAffiliate(order.affiliate_code, order.id);

  const [finalOrder] = await q('SELECT * FROM orders WHERE id = ?', [order.id]);
  return { order: mapOrder(finalOrder) };
}
