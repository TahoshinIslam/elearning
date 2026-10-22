// ============================================================
// Orders / checkout. The ONLY path that creates a marketplace enrollment.
//
//  - Price, currency, discount and total are computed here from `courses`
//    and `coupons` — the client only names course ids.
//  - order_items keep a price + title snapshot.
//  - Paid access is granted only by fulfillOrder(), which runs after
//    bKash's own server confirmed the payment (execute or status query) for
//    the exact amount we stored. A callback URL, success page, or client
//    flag never grants access.
//  - Idempotent at every step: a repeated checkout submit reuses the same
//    pending order + bKash payment; a repeated/forged callback can't create
//    a second enrollment; fulfilment locks the order row (SELECT … FOR
//    UPDATE) so concurrent callbacks serialize.
//  - Interrupted fulfilment (callback never arrived, network failure after
//    the customer paid) is recovered by reconcileOrder(), which asks bKash.
// ============================================================

import { q, withTransaction } from '@/lib/mysql';
import { HttpError, enrollCourseFromOrder } from '@/lib/repo';
import { validateCoupon, redeemCoupon } from '@/lib/couponRepo';
import { recordAffiliateSale } from '@/lib/affiliateRepo';
import { createPayment, executePayment, queryPayment, bkashConfigured } from '@/lib/bkash';
import { getActiveOffers, priceWithOffers } from '@/lib/pricing';
import { logger } from '@/lib/logger';
import { recordAudit } from '@/lib/auditLog';

const PENDING_REUSE_MINUTES = 20; // a bKash payment URL stays usable well within this
const IDEMPOTENCY_RE = /^[A-Za-z0-9_-]{8,64}$/;

function mapOrder(r) {
  return {
    id: r.id, studentId: r.student_id, status: r.status,
    subtotal: r.subtotal ?? r.amount, discount: r.discount ?? 0, amount: r.amount, currency: r.currency,
    couponCode: r.coupon_code, affiliateCode: r.affiliate_code, gateway: r.gateway,
    gatewayPaymentId: r.gateway_payment_id, gatewayTrxId: r.gateway_trx_id,
    failureReason: r.failure_reason || null,
    createdAt: r.created_at, updatedAt: r.updated_at, paidAt: r.paid_at || null, refundedAt: r.refunded_at || null
  };
}

async function itemsFor(orderIds) {
  if (!orderIds.length) return {};
  const rows = await q(
    `SELECT oi.order_id, oi.course_id, oi.unit_price, COALESCE(oi.title_snapshot, c.title) AS title, c.slug
     FROM order_items oi LEFT JOIN courses c ON c.id = oi.course_id
     WHERE oi.order_id IN (${orderIds.map(() => '?').join(',')}) ORDER BY oi.id`,
    orderIds
  );
  const by = {};
  for (const it of rows) (by[it.order_id] = by[it.order_id] || []).push({ courseId: it.course_id, title: it.title, slug: it.slug, unitPrice: it.unit_price });
  return by;
}

async function logEvent(orderId, eventType, { paymentID = null, trxID = null, status = null, raw = null } = {}, { upsert = false } = {}) {
  const sql = `INSERT INTO payment_events (order_id, gateway, event_type, gateway_payment_id, gateway_trx_id, status, raw_payload)
               VALUES (?,?,?,?,?,?,?)` + (upsert ? ' ON DUPLICATE KEY UPDATE status = VALUES(status), gateway_trx_id = VALUES(gateway_trx_id), raw_payload = VALUES(raw_payload), created_at = NOW()' : '');
  return q(sql, [orderId, 'bkash', eventType, paymentID, trxID, status, raw ? JSON.stringify(raw).slice(0, 8000) : null]);
}

// ---------- reads ----------
export async function getOrder(id) {
  const [row] = await q('SELECT * FROM orders WHERE id = ?', [id]);
  return row ? mapOrder(row) : null;
}

// A student sees only their own order; staff see any.
export async function getOrderForViewer(session, orderId) {
  if (!session) throw new HttpError(401, { error: 'auth_required' });
  const [row] = await q('SELECT * FROM orders WHERE id = ?', [Number(orderId)]);
  const staff = session.role === 'owner' || session.role === 'superadmin';
  if (!row || (!staff && row.student_id !== session.studentId)) throw new HttpError(404, { error: 'order_not_found' });
  const items = await itemsFor([row.id]);
  return { ...mapOrder(row), items: items[row.id] || [] };
}

export async function getOrdersForStudent(session) {
  if (!session?.studentId) throw new HttpError(403, { error: 'no_student_profile' });
  const rows = await q('SELECT * FROM orders WHERE student_id = ? ORDER BY id DESC LIMIT 200', [session.studentId]);
  const items = await itemsFor(rows.map((r) => r.id));
  return rows.map((r) => ({ ...mapOrder(r), items: items[r.id] || [] }));
}

// Staff ledger.
export async function getOrders() {
  const orders = await q(
    `SELECT o.*, s.name AS student_name
     FROM orders o LEFT JOIN students s ON s.id = o.student_id
     ORDER BY o.id DESC LIMIT 500`
  );
  const items = await itemsFor(orders.map((o) => o.id));
  return orders.map((o) => ({
    ...mapOrder(o),
    studentName: o.student_name,
    items: (items[o.id] || []).map((it) => ({ courseId: it.courseId, courseTitle: it.title, unitPrice: it.unitPrice }))
  }));
}

// Latest still-open order for a course (powers "payment pending" on the course page).
export async function getPendingOrderForCourse(studentId, courseId) {
  if (!studentId) return null;
  const [row] = await q(
    `SELECT o.* FROM orders o JOIN order_items oi ON oi.order_id = o.id
     WHERE o.student_id = ? AND oi.course_id = ? AND o.status = 'pending'
       AND o.created_at > NOW() - INTERVAL 1 DAY
     ORDER BY o.id DESC LIMIT 1`,
    [studentId, courseId]
  );
  return row ? mapOrder(row) : null;
}

// ---------- pricing (shared by the checkout page preview and createOrder) ----------
export async function priceCourses(session, courseIds, couponCode) {
  const ids = [...new Set((courseIds || []).map(Number).filter((n) => Number.isInteger(n) && n > 0))];
  if (!ids.length) throw new HttpError(400, { error: 'no_items' });
  if (ids.length > 20) throw new HttpError(400, { error: 'too_many_items' });
  const courses = await q(
    `SELECT c.id, c.title, c.slug, c.price, c.published, c.category, cl.slug AS class_slug
     FROM courses c LEFT JOIN class_levels cl ON cl.id = c.class_id WHERE c.id IN (${ids.map(() => '?').join(',')})`, ids);
  if (courses.length !== ids.length) throw new HttpError(404, { error: 'course_not_found' });
  const unavailable = courses.filter((c) => !c.published).map((c) => c.id);
  if (unavailable.length) throw new HttpError(400, { error: 'course_not_available', courseIds: unavailable });

  if (session?.studentId) {
    const owned = await q(
      `SELECT course_id FROM enrollments WHERE student_id = ? AND status = 'active' AND course_id IN (${ids.map(() => '?').join(',')})`,
      [session.studentId, ...ids]
    );
    if (owned.length) throw new HttpError(409, { error: 'already_enrolled', courseIds: owned.map((r) => r.course_id) });
  }

  // Automatic offers first (same rule as every displayed price), then an
  // optional coupon on the offered total.
  const offers = await getActiveOffers();
  const items = ids.map((id) => courses.find((c) => c.id === id)).map((c) => {
    const p = priceWithOffers({ id: c.id, price: c.price, category: c.category, classSlug: c.class_slug }, offers);
    return { courseId: c.id, title: c.title, slug: c.slug, listPrice: p.listPrice, unitPrice: p.price, offer: p.offer };
  });
  const subtotal = items.reduce((sum, i) => sum + i.listPrice, 0);
  const offered = items.reduce((sum, i) => sum + i.unitPrice, 0);
  let coupon = null;
  let amount = offered;
  if (couponCode && String(couponCode).trim() && offered > 0) {
    const result = await validateCoupon(couponCode, offered, session);
    coupon = result.code;
    amount = Math.max(0, Math.round(result.finalAmount));
  }
  return {
    items, subtotal, offerDiscount: subtotal - offered, couponDiscount: offered - amount,
    discount: subtotal - amount, amount, currency: 'BDT', couponCode: coupon
  };
}

// ---------- create ----------
// body: { courseId } | { courseIds: [] } | { items: [{courseId}] }, couponCode?, affiliateCode?, idempotencyKey?
export async function createOrder(session, body = {}) {
  const studentId = session?.studentId;
  if (!studentId) throw new HttpError(403, { error: 'no_student_profile' });

  const requested = Array.isArray(body.courseIds) ? body.courseIds
    : Array.isArray(body.items) ? body.items.map((i) => i?.courseId)
    : body.courseId ? [body.courseId] : [];
  const idemKey = typeof body.idempotencyKey === 'string' && IDEMPOTENCY_RE.test(body.idempotencyKey) ? body.idempotencyKey : null;

  // 1. Same submit seen before (double click / retry) → same order.
  if (idemKey) {
    const [prior] = await q('SELECT * FROM orders WHERE student_id = ? AND idempotency_key = ?', [studentId, idemKey]);
    if (prior) return orderResponse(prior);
  }

  const priced = await priceCourses(session, requested, body.couponCode);
  const courseIds = priced.items.map((i) => i.courseId);
  const affiliateCode = body.affiliateCode && /^[A-Za-z0-9_-]{2,64}$/.test(String(body.affiliateCode).trim())
    ? String(body.affiliateCode).trim().toUpperCase() : null;

  // 2. An identical purchase already waiting on bKash → resume it instead of
  //    opening a second payment the customer could also complete.
  if (priced.amount > 0) {
    const candidates = await q(
      `SELECT o.* FROM orders o
       WHERE o.student_id = ? AND o.status = 'pending' AND o.gateway_url IS NOT NULL AND o.amount = ?
         AND (o.coupon_code <=> ?) AND o.created_at > NOW() - INTERVAL ${PENDING_REUSE_MINUTES} MINUTE
       ORDER BY o.id DESC LIMIT 5`,
      [studentId, priced.amount, priced.couponCode]
    );
    const itemMap = await itemsFor(candidates.map((c) => c.id));
    const key = courseIds.slice().sort().join(',');
    const same = candidates.find((c) => (itemMap[c.id] || []).map((i) => i.courseId).sort().join(',') === key);
    if (same) return orderResponse(same, { reused: true });
    if (!bkashConfigured()) throw new HttpError(503, { error: 'payments_unavailable' });
  }

  let orderId;
  try {
    orderId = await withTransaction(async (tx) => {
      const res = await tx(
        `INSERT INTO orders (student_id, idempotency_key, status, subtotal, discount, amount, currency, coupon_code, affiliate_code, gateway)
         VALUES (?,?,?,?,?,?,?,?,?,?)`,
        [studentId, idemKey, 'pending', priced.subtotal, priced.discount, priced.amount, priced.currency,
         priced.couponCode, affiliateCode, priced.amount === 0 ? 'none' : 'bkash']
      );
      for (const it of priced.items) {
        await tx('INSERT INTO order_items (order_id, course_id, unit_price, list_price, offer_id, title_snapshot) VALUES (?,?,?,?,?,?)',
          [res.insertId, it.courseId, it.unitPrice, it.listPrice, it.offer?.id ?? null, it.title]);
      }
      return res.insertId;
    });
  } catch (e) {
    // Two identical submits racing: the loser hits the idempotency unique key.
    if (e.code === 'ER_DUP_ENTRY' && idemKey) {
      const [prior] = await q('SELECT * FROM orders WHERE student_id = ? AND idempotency_key = ?', [studentId, idemKey]);
      if (prior) return orderResponse(prior);
    }
    throw e;
  }

  if (priced.amount === 0) {
    await fulfillOrder(orderId, { trxID: null, gatewayAmount: 0, source: 'free' });
    const [row] = await q('SELECT * FROM orders WHERE id = ?', [orderId]);
    return orderResponse(row);
  }

  const callbackURL = `${(process.env.APP_BASE_URL || '').replace(/\/$/, '')}/api/payments/bkash/callback`;
  let created;
  try {
    created = await createPayment({ amount: priced.amount, orderId, callbackURL, payerReference: String(studentId) });
  } catch (e) {
    await q("UPDATE orders SET status = 'failed', failure_reason = 'gateway_create_failed' WHERE id = ?", [orderId]);
    logger.error('order_gateway_create_failed', { orderId, message: e.message });
    throw new HttpError(502, { error: 'gateway_unavailable' });
  }
  await q('UPDATE orders SET gateway_payment_id = ?, gateway_url = ? WHERE id = ?', [created.paymentID, created.bkashURL, orderId]);
  await logEvent(orderId, 'create', { paymentID: created.paymentID, status: 'initiated' });
  logger.info('order_created', { orderId, studentId, amount: priced.amount, items: courseIds.length });
  const [row] = await q('SELECT * FROM orders WHERE id = ?', [orderId]);
  return orderResponse(row);
}

function orderResponse(row, extra = {}) {
  const order = mapOrder(row);
  if (row.status === 'paid') return { order, paid: true, ...extra };
  if (row.status === 'pending' && row.gateway_url) return { order, bkashURL: row.gateway_url, ...extra };
  return { order, ...extra };
}

// ---------- fulfilment (the one place access is granted) ----------
// Transactional: order → paid and every enrollment commit together, or not
// at all. Re-entrant: a second call for an already-paid order is a no-op.
export async function fulfillOrder(orderId, { trxID, gatewayAmount, source }) {
  const outcome = await withTransaction(async (tx) => {
    const [order] = await tx('SELECT * FROM orders WHERE id = ? FOR UPDATE', [orderId]);
    if (!order) throw new HttpError(404, { error: 'order_not_found' });
    if (order.status === 'paid') return { alreadyProcessed: true, order };
    if (order.status === 'refunded') return { refused: 'refunded', order };
    if (Number(gatewayAmount) !== Number(order.amount)) {
      await tx("UPDATE orders SET status = 'failed', failure_reason = 'amount_mismatch' WHERE id = ?", [orderId]);
      return { refused: 'amount_mismatch', order };
    }
    const items = await tx('SELECT course_id FROM order_items WHERE order_id = ?', [orderId]);
    const already = await tx(
      `SELECT course_id FROM enrollments WHERE student_id = ? AND status = 'active' AND course_id IN (${items.map(() => '?').join(',') || 'NULL'})`,
      [order.student_id, ...items.map((i) => i.course_id)]
    );
    const dup = already.length > 0;
    await tx(
      "UPDATE orders SET status = 'paid', gateway_trx_id = COALESCE(?, gateway_trx_id), paid_at = NOW(), failure_reason = ? WHERE id = ?",
      [trxID, dup ? 'duplicate_purchase_refund_due' : null, orderId]
    );
    for (const item of items) {
      await enrollCourseFromOrder(tx, { studentId: order.student_id, courseId: item.course_id, orderId });
    }
    return { fulfilled: true, duplicate: dup, order };
  });

  if (outcome.refused === 'amount_mismatch') {
    logger.error('order_amount_mismatch', { orderId, expected: outcome.order.amount, gatewayAmount });
  }
  if (outcome.fulfilled) {
    logger.info('order_fulfilled', { orderId, source, studentId: outcome.order.student_id });
    if (outcome.duplicate) {
      // The customer paid twice for something they already own (e.g. two
      // tabs). Access is unchanged; flag for staff to refund.
      logger.warn('order_duplicate_purchase', { orderId });
      await recordAudit({ action: 'duplicate_purchase', targetType: 'order', targetId: orderId, detail: 'paid for an already-owned course; refund due' });
    }
    if (outcome.order.coupon_code) {
      await redeemCoupon(outcome.order.coupon_code).catch((e) => logger.error('coupon_redeem_failed', { orderId, message: e.message }));
    }
    if (outcome.order.affiliate_code) {
      const items = await q('SELECT course_id, unit_price FROM order_items WHERE order_id = ?', [orderId]);
      for (const it of items) {
        await recordAffiliateSale(outcome.order.affiliate_code, it.unit_price, it.course_id)
          .catch((e) => logger.error('affiliate_credit_failed', { orderId, message: e.message }));
      }
    }
  }
  const [fresh] = await q('SELECT * FROM orders WHERE id = ?', [orderId]);
  const { order: _raw, ...rest } = outcome;
  return { order: mapOrder(fresh), ...rest };
}

// ---------- bKash callback ----------
// The callback's query params are client-controlled (the browser carried
// them back). `status=success` only means "go verify"; failure/cancel only
// ever moves a still-pending order and never touches a paid one.
export async function finalizeBkashCallback({ paymentID, status }) {
  if (!paymentID || typeof paymentID !== 'string' || paymentID.length > 64) throw new HttpError(400, { error: 'missing_payment_id' });
  const [order] = await q('SELECT * FROM orders WHERE gateway_payment_id = ?', [paymentID]);
  if (!order) throw new HttpError(404, { error: 'order_not_found' });
  if (order.status === 'paid' || order.status === 'refunded') return { order: mapOrder(order), alreadyProcessed: true };

  if (status !== 'success') {
    const next = status === 'cancel' ? 'cancelled' : 'failed';
    await q("UPDATE orders SET status = ?, failure_reason = ? WHERE id = ? AND status = 'pending'", [next, `callback_${String(status || 'unknown').slice(0, 20)}`, order.id]);
    await logEvent(order.id, 'callback_failed', { paymentID, status: String(status || '').slice(0, 30) }, { upsert: true });
    const [fresh] = await q('SELECT * FROM orders WHERE id = ?', [order.id]);
    return { order: mapOrder(fresh), failed: true };
  }

  // Verify with bKash. execute() completes the authorized payment; if it
  // fails (already executed by a duplicate callback, network drop), fall
  // back to a status query so a real payment is never lost.
  let verified;
  try {
    verified = await executePayment(paymentID);
    try {
      await logEvent(order.id, 'execute', { paymentID, trxID: verified.trxID, status: verified.transactionStatus, raw: verified.raw });
    } catch (e) {
      if (e.code !== 'ER_DUP_ENTRY') throw e; // duplicate execute event: fulfilOrder below is still a no-op
    }
  } catch (e) {
    logger.warn('bkash_execute_failed_querying', { orderId: order.id, message: e.message });
    try {
      verified = await queryPayment(paymentID);
      await logEvent(order.id, 'query', { paymentID, trxID: verified.trxID, status: verified.transactionStatus, raw: verified.raw }, { upsert: true });
    } catch (e2) {
      logger.error('bkash_verification_unavailable', { orderId: order.id, message: e2.message });
      return { order: mapOrder(order), pendingVerification: true };
    }
  }
  return applyVerifiedStatus(order, verified);
}

async function applyVerifiedStatus(order, verified) {
  if (verified.transactionStatus === 'Completed') {
    return fulfillOrder(order.id, { trxID: verified.trxID, gatewayAmount: Number(verified.amount), source: 'bkash' });
  }
  const terminal = { Failed: 'failed', Cancelled: 'cancelled', Expired: 'failed' }[verified.transactionStatus];
  if (terminal) {
    await q("UPDATE orders SET status = ?, failure_reason = ? WHERE id = ? AND status IN ('pending','cancelled','failed')",
      [terminal, `gateway_${verified.transactionStatus.toLowerCase()}`, order.id]);
  }
  const [fresh] = await q('SELECT * FROM orders WHERE id = ?', [order.id]);
  return { order: mapOrder(fresh), failed: !!terminal, pendingVerification: !terminal };
}

// ---------- reconciliation ----------
// Ask bKash for the truth about an order that isn't settled yet. Safe to run
// any number of times. Students may reconcile their own order; staff any.
export async function reconcileOrder(session, orderId) {
  const [order] = await q('SELECT * FROM orders WHERE id = ?', [Number(orderId)]);
  const staff = session && (session.role === 'owner' || session.role === 'superadmin');
  if (!order || (!staff && order.student_id !== session?.studentId)) throw new HttpError(404, { error: 'order_not_found' });
  if (order.status === 'paid' || order.status === 'refunded' || !order.gateway_payment_id) return { order: mapOrder(order), unchanged: true };
  let verified;
  try {
    verified = await queryPayment(order.gateway_payment_id);
  } catch (e) {
    logger.warn('reconcile_query_failed', { orderId: order.id, message: e.message });
    throw new HttpError(502, { error: 'gateway_unavailable' });
  }
  await logEvent(order.id, 'reconcile', { paymentID: order.gateway_payment_id, trxID: verified.trxID, status: verified.transactionStatus, raw: verified.raw }, { upsert: true });
  logger.info('order_reconciled', { orderId: order.id, gatewayStatus: verified.transactionStatus, by: session?.role || 'system' });
  return applyVerifiedStatus(order, verified);
}

// Staff: reconcile every bKash order still pending after a few minutes.
export async function reconcileStalePending(session, { olderThanMinutes = 3 } = {}) {
  const rows = await q(
    `SELECT id FROM orders WHERE status = 'pending' AND gateway = 'bkash' AND gateway_payment_id IS NOT NULL
       AND created_at < NOW() - INTERVAL ? MINUTE ORDER BY id LIMIT 50`,
    [Math.max(1, Number(olderThanMinutes) || 3)]
  );
  const results = [];
  for (const r of rows) {
    try {
      const out = await reconcileOrder(session, r.id);
      results.push({ id: r.id, status: out.order.status });
    } catch (e) {
      results.push({ id: r.id, error: e.body?.error || e.message });
    }
  }
  return { checked: rows.length, results };
}

// ---------- refunds ----------
// Records a refund and revokes the access it granted (enrollments set to
// 'cancelled', never deleted). The money itself is returned through the
// bKash merchant panel — this app does not call bKash's refund API.
export async function refundOrder(session, orderId, { reason } = {}) {
  const outcome = await withTransaction(async (tx) => {
    const [order] = await tx('SELECT * FROM orders WHERE id = ? FOR UPDATE', [orderId]);
    if (!order) throw new HttpError(404, { error: 'order_not_found' });
    if (order.status !== 'paid') throw new HttpError(400, { error: 'order_not_refundable' });
    const items = await tx('SELECT course_id FROM order_items WHERE order_id = ?', [orderId]);
    await tx("UPDATE orders SET status = 'refunded', refunded_at = NOW() WHERE id = ?", [orderId]);
    for (const item of items) {
      // Only revoke access this order granted — a duplicate order's refund
      // must not take away the course the customer bought in another order.
      await tx(
        "UPDATE enrollments SET status = 'cancelled' WHERE student_id = ? AND course_id = ? AND (order_id = ? OR order_id IS NULL) AND batch_id IS NULL",
        [order.student_id, item.course_id, orderId]
      );
    }
    return { order, items };
  });
  await logEvent(orderId, 'refund', { paymentID: outcome.order.gateway_payment_id, trxID: outcome.order.gateway_trx_id, status: 'refunded', raw: reason ? { reason: String(reason).slice(0, 200) } : null }, { upsert: true }).catch(() => {});
  await recordAudit({
    session, action: 'order_refunded', targetType: 'order', targetId: orderId,
    detail: `student=${outcome.order.student_id} amount=${outcome.order.amount} courses=${outcome.items.map((i) => i.course_id).join(',')}`
  });
  const [fresh] = await q('SELECT * FROM orders WHERE id = ?', [orderId]);
  return mapOrder(fresh);
}
