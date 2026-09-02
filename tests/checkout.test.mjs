// Phase 3 — integration tests for the real order/payment flow.
// bKash itself is stubbed (vi.mock) since there's no live sandbox access from
// here — everything else (price authority, coupon math, the DB writes, and
// critically the idempotency guard) runs against the real database, same as
// the rest of this test suite.

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { q } from '@/lib/mysql';
import { createUser } from '@/lib/authRepo';

vi.mock('@/lib/bkash', () => ({
  createPayment: vi.fn(),
  executePayment: vi.fn()
}));
const { createPayment, executePayment } = await import('@/lib/bkash');
const { createOrder, finalizeBkashCallback } = await import('@/lib/orderRepo');

const RUN_ID = Date.now();
let studentId, session, paidCourseId, freeCourseId, couponId;

beforeAll(async () => {
  const user = await createUser({ name: 'Checkout Tester', email: `phase3-test-${RUN_ID}@example.test`, password: 'testpass123' });
  studentId = user.student_id;
  session = { studentId, tenantId: null, role: 'student' };

  const paid = await q(
    `INSERT INTO courses (title, slug, published, price, old_price, rating, rating_count, language)
     VALUES (?,?,1,1000,0,0,0,'English')`,
    [`Phase 3 Paid Course ${RUN_ID}`, `phase3-paid-${RUN_ID}`]
  );
  paidCourseId = paid.insertId;

  const free = await q(
    `INSERT INTO courses (title, slug, published, price, old_price, rating, rating_count, language)
     VALUES (?,?,1,0,0,0,0,'English')`,
    [`Phase 3 Free Course ${RUN_ID}`, `phase3-free-${RUN_ID}`]
  );
  freeCourseId = free.insertId;

  const coupon = await q(
    "INSERT INTO coupons (code, type, value, is_active) VALUES (?, 'percent', 10, 1)",
    [`P3TEST${RUN_ID}`]
  );
  couponId = coupon.insertId;
});

afterAll(async () => {
  await q('DELETE FROM payment_events WHERE order_id IN (SELECT id FROM orders WHERE student_id = ?)', [studentId]);
  await q('DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE student_id = ?)', [studentId]);
  await q('DELETE FROM orders WHERE student_id = ?', [studentId]);
  await q('DELETE FROM enrollments WHERE student_id = ?', [studentId]);
  if (couponId) await q('DELETE FROM coupons WHERE id = ?', [couponId]);
  if (paidCourseId) await q('DELETE FROM courses WHERE id = ?', [paidCourseId]);
  if (freeCourseId) await q('DELETE FROM courses WHERE id = ?', [freeCourseId]);
  // users before students: users.student_id is ON DELETE SET NULL, so
  // deleting the student first would orphan (not remove) the user row.
  if (studentId) await q('DELETE FROM users WHERE student_id = ?', [studentId]);
  if (studentId) await q('DELETE FROM students WHERE id = ?', [studentId]);
});

describe('server-authoritative pricing', () => {
  it('ignores a client-sent amount and charges the DB price', async () => {
    createPayment.mockResolvedValueOnce({ paymentID: `PAY-${RUN_ID}-A`, bkashURL: 'https://sandbox.bka.sh/pay/A' });

    const result = await createOrder(session, { courseId: paidCourseId, amount: 1 }); // client tries to pay ৳1
    expect(result.order.amount).toBe(1000); // the real course price, not the client's number
    expect(result.bkashURL).toBe('https://sandbox.bka.sh/pay/A');

    const [row] = await q('SELECT status, amount FROM orders WHERE id = ?', [result.order.id]);
    expect(row.status).toBe('pending');
    expect(row.amount).toBe(1000);
  });

  it('applies a coupon server-side, never trusting a client-sent discount', async () => {
    createPayment.mockResolvedValueOnce({ paymentID: `PAY-${RUN_ID}-B`, bkashURL: 'https://sandbox.bka.sh/pay/B' });

    const result = await createOrder(session, { courseId: paidCourseId, couponCode: `p3test${RUN_ID}` });
    expect(result.order.amount).toBe(900); // 1000 - 10%
  });
});

describe('free orders', () => {
  it('enrolls immediately with no gateway involved, and refuses a repeat purchase', async () => {
    const result = await createOrder(session, { courseId: freeCourseId });
    expect(result.paid).toBe(true);
    expect(createPayment).not.toHaveBeenCalledWith(expect.objectContaining({ amount: 0 }));

    const [enr] = await q('SELECT batch_id, status FROM enrollments WHERE student_id = ? AND course_id = ?', [studentId, freeCourseId]);
    expect(enr.status).toBe('active');
    expect(enr.batch_id).toBeNull();

    await expect(createOrder(session, { courseId: freeCourseId })).rejects.toMatchObject({ status: 409 });
  });
});

describe('paid checkout: bKash create → verified callback → enrollment', () => {
  it('never enrolls before the callback verifies payment, then enrolls exactly once even if the callback fires twice', async () => {
    const paymentID = `PAY-${RUN_ID}-C`;
    createPayment.mockResolvedValueOnce({ paymentID, bkashURL: `https://sandbox.bka.sh/pay/${paymentID}` });

    const created = await createOrder(session, { courseId: paidCourseId });
    expect(created.bkashURL).toBeTruthy();

    // not enrolled yet — payment hasn't been verified
    const [before] = await q('SELECT id FROM enrollments WHERE student_id = ? AND course_id = ?', [studentId, paidCourseId]);
    expect(before).toBeUndefined();

    executePayment.mockResolvedValue({
      paymentID, trxID: `TRX-${RUN_ID}`, transactionStatus: 'Completed', amount: '1000', raw: { paymentID, trxID: `TRX-${RUN_ID}` }
    });

    const first = await finalizeBkashCallback({ paymentID, status: 'success' });
    expect(first.order.status).toBe('paid');
    expect(first.alreadyProcessed).toBeFalsy();

    const [enrolledOnce] = await q(
      'SELECT COUNT(*) AS c FROM enrollments WHERE student_id = ? AND course_id = ?', [studentId, paidCourseId]
    );
    expect(enrolledOnce.c).toBe(1);

    // duplicate callback — bKash retry, or the user hitting back/forward
    const second = await finalizeBkashCallback({ paymentID, status: 'success' });
    expect(second.alreadyProcessed).toBe(true);
    expect(executePayment).toHaveBeenCalledTimes(1); // never re-verified, let alone re-enrolled

    const [enrolledStill] = await q(
      'SELECT COUNT(*) AS c FROM enrollments WHERE student_id = ? AND course_id = ?', [studentId, paidCourseId]
    );
    expect(enrolledStill.c).toBe(1); // still exactly one row, not two
  });

  it('fails the order instead of granting access when bKash reports a different amount than what was charged', async () => {
    const paymentID = `PAY-${RUN_ID}-D`;
    createPayment.mockResolvedValueOnce({ paymentID, bkashURL: `https://sandbox.bka.sh/pay/${paymentID}` });

    // second paid course fixture so this doesn't collide with the enrollment created above
    const other = await q(
      `INSERT INTO courses (title, slug, published, price, old_price, rating, rating_count, language)
       VALUES (?,?,1,1000,0,0,0,'English')`,
      [`Phase 3 Mismatch Course ${RUN_ID}`, `phase3-mismatch-${RUN_ID}`]
    );
    const otherCourseId = other.insertId;

    await createOrder(session, { courseId: otherCourseId });
    executePayment.mockResolvedValueOnce({
      paymentID, trxID: `TRX-MISMATCH-${RUN_ID}`, transactionStatus: 'Completed', amount: '1', raw: {}
    });

    const result = await finalizeBkashCallback({ paymentID, status: 'success' });
    expect(result.failed).toBe(true);

    const [enr] = await q('SELECT id FROM enrollments WHERE student_id = ? AND course_id = ?', [studentId, otherCourseId]);
    expect(enr).toBeUndefined(); // never enrolled

    await q('DELETE FROM order_items WHERE course_id = ?', [otherCourseId]);
    await q('DELETE FROM orders WHERE student_id = ? AND amount = 1000 AND gateway_payment_id = ?', [studentId, paymentID]);
    await q('DELETE FROM courses WHERE id = ?', [otherCourseId]);
  });
});
