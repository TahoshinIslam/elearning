// Phase 7 — integration tests for order refund + enrollment revocation,
// the self-privilege-escalation fix, and the persisted audit log.

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { q } from '@/lib/mysql';
import { createUser } from '@/lib/authRepo';

import { installBkashSimulator, customer, paymentIdFrom } from './helpers/bkashSim.mjs';
const sim = installBkashSimulator();
const { createOrder, finalizeBkashCallback, getOrders, refundOrder } = await import('@/lib/orderRepo');
const { setUserRole, setUserStatus } = await import('@/lib/authRepo');
const { getAuditLog } = await import('@/lib/auditLog');

const RUN_ID = Date.now();
let studentId, studentUserId, courseId, ownerUserId, superadminUserId;

beforeAll(async () => {
  const buyer = await createUser({ name: 'Refund Tester', email: `phase7-buyer-${RUN_ID}@example.test`, password: 'testpass123' });
  studentId = buyer.student_id; studentUserId = buyer.id;

  const course = await q(
    `INSERT INTO courses (title, slug, published, price, old_price, rating, rating_count, language, level, description) VALUES (?,?,1,500,0,0,0,'English','Beginner','x')`,
    [`Phase 7 Course ${RUN_ID}`, `phase7-${RUN_ID}`]
  );
  courseId = course.insertId;

  const [owner] = await q("SELECT id FROM users WHERE role='owner' LIMIT 1");
  const [superadmin] = await q("SELECT id FROM users WHERE role='superadmin' LIMIT 1");
  ownerUserId = owner.id; superadminUserId = superadmin.id;
});

afterAll(async () => {
  // clean the audit trail this run left behind before removing what it points at
  const orderIds = (await q('SELECT id FROM orders WHERE student_id = ?', [studentId])).map((r) => r.id);
  if (orderIds.length) await q(`DELETE FROM audit_log WHERE target_type = 'order' AND target_id IN (${orderIds.map(() => '?').join(',')})`, orderIds);
  await q("DELETE FROM audit_log WHERE target_type = 'user' AND target_id = ?", [String(studentUserId)]);

  await q('DELETE FROM payment_events WHERE order_id IN (SELECT id FROM orders WHERE student_id = ?)', [studentId]);
  await q('DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE student_id = ?)', [studentId]);
  await q('DELETE FROM orders WHERE student_id = ?', [studentId]);
  await q('DELETE FROM enrollments WHERE student_id = ?', [studentId]);
  await q('DELETE FROM courses WHERE id = ?', [courseId]);
  await q('DELETE FROM users WHERE id = ?', [studentUserId]);
  sim.restore();
  await q('DELETE FROM students WHERE id = ?', [studentId]);
});

async function buyAndPay(session) {
  const created = await createOrder(session, { courseId });
  const result = await finalizeBkashCallback(customer(paymentIdFrom(created.bkashURL), 'pay'));
  return result.order;
}

describe('refunding a real order revokes access, and re-purchase reactivates it', () => {
  it('cancels the enrollment on refund, then a genuine re-purchase reactivates the same row (not a duplicate)', async () => {
    const session = { studentId, role: 'student' };
    const order = await buyAndPay(session, 'A');
    expect(order.status).toBe('paid');

    const [activeRow] = await q('SELECT status FROM enrollments WHERE student_id = ? AND course_id = ?', [studentId, courseId]);
    expect(activeRow.status).toBe('active');

    const staffSession = { id: ownerUserId, role: 'owner' };
    await refundOrder(staffSession, order.id);

    const [cancelledRow] = await q('SELECT status FROM enrollments WHERE student_id = ? AND course_id = ?', [studentId, courseId]);
    expect(cancelledRow.status).toBe('cancelled');
    const [orderRow] = await q('SELECT status FROM orders WHERE id = ?', [order.id]);
    expect(orderRow.status).toBe('refunded');

    // re-purchase after refund must not be blocked
    const second = await buyAndPay(session, 'B');
    expect(second.status).toBe('paid');

    const [reactivated] = await q('SELECT status FROM enrollments WHERE student_id = ? AND course_id = ?', [studentId, courseId]);
    expect(reactivated.status).toBe('active');

    const [countRow] = await q('SELECT COUNT(*) AS c FROM enrollments WHERE student_id = ? AND course_id = ?', [studentId, courseId]);
    expect(countRow.c).toBe(1); // reactivated the same row, never duplicated
  });

  it('refuses to refund an order twice', async () => {
    const [order] = await q("SELECT id FROM orders WHERE student_id = ? AND status='paid'", [studentId]);
    const staffSession = { id: ownerUserId, role: 'owner' };
    await refundOrder(staffSession, order.id);
    await expect(refundOrder(staffSession, order.id)).rejects.toMatchObject({ status: 400, body: { error: 'order_not_refundable' } });
  });

  it('lists orders with student name and course title', async () => {
    const orders = await getOrders();
    const mine = orders.filter((o) => o.studentId === studentId);
    expect(mine.length).toBeGreaterThan(0);
    expect(mine[0].studentName).toBe('Refund Tester');
    expect(mine[0].items[0].courseTitle).toContain('Phase 7 Course');
  });
});

describe('user management self-privilege-escalation guard', () => {
  it('refuses to let a user change their own role', async () => {
    const ownerSession = { id: ownerUserId, role: 'owner' };
    await expect(setUserRole(ownerSession, { id: ownerUserId, role: 'superadmin' }))
      .rejects.toMatchObject({ status: 403, body: { error: 'cannot_change_own_role' } });
  });

  it('refuses to let an owner grant superadmin to someone else, and logs the blocked attempt', async () => {
    const ownerSession = { id: ownerUserId, role: 'owner' };
    await expect(setUserRole(ownerSession, { id: studentUserId, role: 'superadmin' }))
      .rejects.toMatchObject({ status: 403, body: { error: 'forbidden' } });

    const log = await getAuditLog({ action: 'role_change_blocked' });
    expect(log.some((e) => e.targetId === String(studentUserId))).toBe(true);
  });

  it("lets superadmin change another account's role, and records it in the audit log", async () => {
    const superSession = { id: superadminUserId, role: 'superadmin' };
    await setUserRole(superSession, { id: studentUserId, role: 'teacher' });
    const [row] = await q('SELECT role FROM users WHERE id = ?', [studentUserId]);
    expect(row.role).toBe('teacher');
    await q("UPDATE users SET role='student' WHERE id=?", [studentUserId]); // restore

    const log = await getAuditLog({ action: 'role_changed' });
    expect(log.some((e) => e.targetId === String(studentUserId))).toBe(true);
  });

  it('refuses to let a user disable their own account', async () => {
    const ownerSession = { id: ownerUserId, role: 'owner' };
    await expect(setUserStatus(ownerSession, { id: ownerUserId, status: 'disabled' }))
      .rejects.toMatchObject({ status: 403, body: { error: 'cannot_disable_self' } });
  });
});
