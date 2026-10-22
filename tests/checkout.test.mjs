// Checkout → payment verification → enrollment, against the real database
// and the REAL bKash adapter (routed to the in-process simulator — see
// tests/helpers/bkashSim.mjs). Journeys covered:
//   5. trusted test-mode payment confirmation creates exactly one enrollment
//   6. duplicate / invalid / forged payment events never grant extra or
//      unauthorized access; repeat submits never open a second payment

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { q } from '@/lib/mysql';
import { installBkashSimulator, customer, paymentIdFrom } from './helpers/bkashSim.mjs';
import { fixtures } from './helpers/fixtures.mjs';
import { createOrder, finalizeBkashCallback, reconcileOrder, getOrderForViewer, getOrdersForStudent, priceCourses } from '@/lib/orderRepo';
import { simGetPayment } from '@/lib/bkashSimulator';

const fx = fixtures('checkout');
let sim, buyer, other, paid, free, draft, couponId;

const activeEnrollments = async (studentId, courseId) =>
  (await q("SELECT COUNT(*) AS n FROM enrollments WHERE student_id = ? AND course_id = ? AND status = 'active'", [studentId, courseId]))[0].n;

beforeAll(async () => {
  sim = installBkashSimulator();
  buyer = await fx.student('Buyer');
  other = await fx.student('Other');
  paid = await fx.course({ price: 1000 });
  free = await fx.course({ price: 0 });
  draft = await fx.course({ price: 500, published: false });
  const c = await q("INSERT INTO coupons (code, type, value, is_active) VALUES (?, 'percent', 10, 1)", [`T${Date.now()}`.slice(0, 20)]);
  couponId = c.insertId;
});

afterAll(async () => {
  sim.restore();
  await q('DELETE FROM coupons WHERE id = ?', [couponId]);
  await fx.cleanup();
});

describe('server-authoritative pricing', () => {
  it('charges the database price, ignoring any client-sent amount', async () => {
    const quote = await priceCourses(buyer.session, [paid.courseId]);
    expect(quote).toMatchObject({ subtotal: 1000, discount: 0, amount: 1000, currency: 'BDT' });
    const result = await createOrder(other.session, { courseId: paid.courseId, amount: 1, idempotencyKey: `idem-${fx.RUN}-a` });
    expect(result.order.amount).toBe(1000);
    const [item] = await q('SELECT unit_price, title_snapshot FROM order_items WHERE order_id = ?', [result.order.id]);
    expect(item.unit_price).toBe(1000);
    expect(item.title_snapshot).toBeTruthy();
    expect(simGetPayment(paymentIdFrom(result.bkashURL)).amount).toBe('1000.00');
  });

  it('applies a coupon server-side and snapshots subtotal/discount', async () => {
    const [{ code }] = await q('SELECT code FROM coupons WHERE id = ?', [couponId]);
    const quote = await priceCourses(buyer.session, [paid.courseId], code.toLowerCase());
    expect(quote).toMatchObject({ subtotal: 1000, discount: 100, amount: 900 });
  });

  it('refuses unpublished courses', async () => {
    await expect(createOrder(buyer.session, { courseId: draft.courseId })).rejects.toMatchObject({ status: 400, body: { error: 'course_not_available' } });
  });
});

describe('free courses', () => {
  it('enrolls immediately with no gateway, and refuses a repeat purchase', async () => {
    const result = await createOrder(buyer.session, { courseId: free.courseId });
    expect(result.paid).toBe(true);
    expect(await activeEnrollments(buyer.studentId, free.courseId)).toBe(1);
    await expect(createOrder(buyer.session, { courseId: free.courseId })).rejects.toMatchObject({ status: 409, body: { error: 'already_enrolled' } });
  });
});

describe('paid checkout through the bKash verification path', () => {
  let order, paymentID;

  it('a double-click / retry returns the same order and the same bKash payment', async () => {
    const key = `idem-${fx.RUN}-b`;
    const first = await createOrder(buyer.session, { courseId: paid.courseId, idempotencyKey: key });
    const again = await createOrder(buyer.session, { courseId: paid.courseId, idempotencyKey: key });
    expect(again.order.id).toBe(first.order.id);
    expect(again.bkashURL).toBe(first.bkashURL);
    // a fresh submit for the identical purchase resumes the pending payment instead of opening a second one
    const fresh = await createOrder(buyer.session, { courseId: paid.courseId, idempotencyKey: `idem-${fx.RUN}-c` });
    expect(fresh.order.id).toBe(first.order.id);
    expect(fresh.reused).toBe(true);
    order = first.order;
    paymentID = paymentIdFrom(first.bkashURL);
  });

  it('a forged success callback (customer never authorized) grants nothing', async () => {
    const result = await finalizeBkashCallback({ paymentID, status: 'success' });
    expect(result.order.status).toBe('pending');
    expect(await activeEnrollments(buyer.studentId, paid.courseId)).toBe(0);
  });

  it('a forged cancel does not stop the real payment from being honoured', async () => {
    await finalizeBkashCallback({ paymentID, status: 'cancel' });
    const [row] = await q('SELECT status FROM orders WHERE id = ?', [order.id]);
    expect(row.status).toBe('cancelled');
    // …the customer then genuinely pays on bKash's page:
    const cb = customer(paymentID, 'pay');
    const result = await finalizeBkashCallback(cb);
    expect(result.order.status).toBe('paid');
    expect(result.order.gatewayTrxId).toMatch(/^SIMTRX/);
    expect(await activeEnrollments(buyer.studentId, paid.courseId)).toBe(1);
    const [enr] = await q('SELECT order_id FROM enrollments WHERE student_id = ? AND course_id = ?', [buyer.studentId, paid.courseId]);
    expect(enr.order_id).toBe(order.id);
  });

  it('a repeated callback is a no-op: still one enrollment, still one execute', async () => {
    const executesBefore = sim.calls.filter((c) => c.path.endsWith('/execute')).length;
    const again = await finalizeBkashCallback({ paymentID, status: 'success' });
    expect(again.alreadyProcessed).toBe(true);
    expect(sim.calls.filter((c) => c.path.endsWith('/execute')).length).toBe(executesBefore);
    expect(await activeEnrollments(buyer.studentId, paid.courseId)).toBe(1);
  });

  it('a late failure/cancel callback never revokes a paid order', async () => {
    await finalizeBkashCallback({ paymentID, status: 'failure' });
    const [row] = await q('SELECT status FROM orders WHERE id = ?', [order.id]);
    expect(row.status).toBe('paid');
  });

  it('an owner cannot buy the same course again', async () => {
    await expect(createOrder(buyer.session, { courseId: paid.courseId })).rejects.toMatchObject({ status: 409, body: { error: 'already_enrolled' } });
  });

  it('an unknown paymentID is rejected', async () => {
    await expect(finalizeBkashCallback({ paymentID: 'SIM-NOT-REAL', status: 'success' })).rejects.toMatchObject({ status: 404 });
  });
});

describe('amount mismatch and cancellation', () => {
  it('fails the order instead of granting access when bKash confirms a different amount', async () => {
    const c = await fx.course({ price: 700 });
    const s = await fx.student('Mismatch');
    const created = await createOrder(s.session, { courseId: c.courseId });
    const pid = paymentIdFrom(created.bkashURL);
    // tamper with what the "gateway" recorded
    globalThis.__LEO_BKASH_SIM__.get(pid).amount = '7.00';
    const result = await finalizeBkashCallback(customer(pid, 'pay'));
    expect(result.order.status).toBe('failed');
    expect(result.order.failureReason).toBe('amount_mismatch');
    expect(await activeEnrollments(s.studentId, c.courseId)).toBe(0);
  });

  it('a real cancel leaves the order cancelled and the course purchasable', async () => {
    const c = await fx.course({ price: 300 });
    const s = await fx.student('Canceller');
    const created = await createOrder(s.session, { courseId: c.courseId });
    const result = await finalizeBkashCallback(customer(paymentIdFrom(created.bkashURL), 'cancel'));
    expect(result.order.status).toBe('cancelled');
    expect(await activeEnrollments(s.studentId, c.courseId)).toBe(0);
    const retry = await createOrder(s.session, { courseId: c.courseId });
    expect(retry.order.id).not.toBe(created.order.id);
  });
});

describe('interrupted fulfilment is recovered by reconciliation', () => {
  it('a payment whose callback never arrived is fulfilled once by reconcile, and only once', async () => {
    const c = await fx.course({ price: 450 });
    const s = await fx.student('Lost callback');
    const created = await createOrder(s.session, { courseId: c.courseId });
    const pid = paymentIdFrom(created.bkashURL);
    // customer authorizes and bKash completes it, but our callback is lost:
    customer(pid, 'pay');
    globalThis.__LEO_BKASH_SIM__.get(pid).status = 'Completed';
    globalThis.__LEO_BKASH_SIM__.get(pid).trxID = 'SIMTRX-LOST';

    // another student can't reconcile (or even see) this order
    await expect(reconcileOrder(other.session, created.order.id)).rejects.toMatchObject({ status: 404 });

    const out = await reconcileOrder(s.session, created.order.id);
    expect(out.order.status).toBe('paid');
    const again = await reconcileOrder(s.session, created.order.id);
    expect(again.unchanged).toBe(true);
    expect(await activeEnrollments(s.studentId, c.courseId)).toBe(1);
  });
});

describe('order privacy', () => {
  it('a student reads only their own orders', async () => {
    const mine = await getOrdersForStudent(buyer.session);
    expect(mine.length).toBeGreaterThan(0);
    expect(mine.every((o) => o.studentId === buyer.studentId)).toBe(true);
    await expect(getOrderForViewer(other.session, mine[0].id)).rejects.toMatchObject({ status: 404 });
    const own = await getOrderForViewer(buyer.session, mine[0].id);
    expect(own.items.length).toBeGreaterThan(0);
  });
});
