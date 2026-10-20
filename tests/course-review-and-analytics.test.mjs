// Phase 6 — integration tests for publish validation, the draft/pending
// review/published workflow, and the real course-performance report.

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { q } from '@/lib/mysql';
import { courseOp } from '@/lib/repo';
import { submitForReview, approveReview, rejectReview, getPendingReviews } from '@/lib/courseReviewRepo';
import { getReport } from '@/lib/reportRepo';
import { createUser } from '@/lib/authRepo';

const RUN_ID = Date.now();
let emptyCourseId, realCourseId, moduleId, lessonId, studentId, userId, orderId;

beforeAll(async () => {
  const empty = await q(
    `INSERT INTO courses (title, slug, published, price, old_price, rating, rating_count, language) VALUES (?,?,0,500,0,0,0,'English')`,
    [`Phase 6 Empty Course ${RUN_ID}`, `phase6-empty-${RUN_ID}`]
  );
  emptyCourseId = empty.insertId;

  const real = await q(
    `INSERT INTO courses (title, slug, published, price, old_price, rating, rating_count, language, level, description)
     VALUES (?,?,0,750,0,0,0,'English','Beginner','A real, complete course description.')`,
    [`Phase 6 Real Course ${RUN_ID}`, `phase6-real-${RUN_ID}`]
  );
  realCourseId = real.insertId;
  const mod = await q('INSERT INTO modules (course_id, title, position) VALUES (?,?,0)', [realCourseId, 'Module 1']);
  moduleId = mod.insertId;
  const lesson = await q("INSERT INTO lessons (module_id, title, type, is_free, position) VALUES (?,?,'video',1,0)", [moduleId, 'Lesson 1']);
  lessonId = lesson.insertId;
  await q("INSERT INTO video_assets (lesson_id, provider, storage_key, duration_seconds, status) VALUES (?,'local',?,60,'ready')", [lessonId, `videos/${realCourseId}/${lessonId}/x.mp4`]);

  const user = await createUser({ name: 'Phase 6 Buyer', email: `phase6-test-${RUN_ID}@example.test`, password: 'testpass123' });
  userId = user.id; studentId = user.student_id;
});

afterAll(async () => {
  await q("DELETE FROM audit_log WHERE target_type = 'course' AND target_id IN (?, ?)", [String(emptyCourseId), String(realCourseId)]);
  if (orderId) { await q('DELETE FROM order_items WHERE order_id = ?', [orderId]); await q('DELETE FROM orders WHERE id = ?', [orderId]); }
  await q('DELETE FROM lesson_progress WHERE student_id = ?', [studentId]);
  await q('DELETE FROM enrollments WHERE student_id = ?', [studentId]);
  await q('DELETE FROM courses WHERE id IN (?,?)', [emptyCourseId, realCourseId]); // cascades module/lesson
  await q('DELETE FROM users WHERE id = ?', [userId]);
  await q('DELETE FROM students WHERE id = ?', [studentId]);
});

describe('publish validation', () => {
  it('refuses to publish a course with no lessons', async () => {
    await expect(courseOp({ op: 'publish', courseId: emptyCourseId }))
      .rejects.toMatchObject({ status: 400, body: { error: 'incomplete_course', missing: expect.arrayContaining(['lessons']) } });
  });

  it('publishes a genuinely complete course and syncs review_status', async () => {
    await courseOp({ op: 'publish', courseId: realCourseId });
    const [row] = await q('SELECT published, review_status FROM courses WHERE id = ?', [realCourseId]);
    expect(row.published).toBe(1);
    expect(row.review_status).toBe('published');

    // unpublishing always works (no validation needed to take something down) and resets to draft
    await courseOp({ op: 'publish', courseId: realCourseId });
    const [after] = await q('SELECT published, review_status FROM courses WHERE id = ?', [realCourseId]);
    expect(after.published).toBe(0);
    expect(after.review_status).toBe('draft');
  });
});

describe('draft → pending_review → published workflow', () => {
  const ownerSession = { role: 'owner' };
  const superadminSession = { role: 'superadmin' };

  it('moves through the whole workflow with a rejection round-trip', async () => {
    await submitForReview(ownerSession, realCourseId);
    let [row] = await q('SELECT review_status FROM courses WHERE id = ?', [realCourseId]);
    expect(row.review_status).toBe('pending_review');

    const queue = await getPendingReviews();
    expect(queue.some((c) => c.id === realCourseId)).toBe(true);

    await rejectReview(superadminSession, realCourseId, 'Needs a better thumbnail');
    [row] = await q('SELECT published, review_status, review_note FROM courses WHERE id = ?', [realCourseId]);
    expect(row.published).toBe(0);
    expect(row.review_status).toBe('draft');
    expect(row.review_note).toBe('Needs a better thumbnail');

    const queueAfterReject = await getPendingReviews();
    expect(queueAfterReject.some((c) => c.id === realCourseId)).toBe(false);

    await submitForReview(ownerSession, realCourseId);
    await approveReview(superadminSession, realCourseId);
    [row] = await q('SELECT published, review_status, review_note FROM courses WHERE id = ?', [realCourseId]);
    expect(row.published).toBe(1);
    expect(row.review_status).toBe('published');
    expect(row.review_note).toBeNull();
  });

  it('refuses to submit an incomplete course for review', async () => {
    await expect(submitForReview(ownerSession, emptyCourseId)).rejects.toMatchObject({ status: 400, body: { error: 'incomplete_course' } });
  });
});

describe('real course-performance report', () => {
  it('computes revenue, enrollment and completion from real orders/enrollments/progress', async () => {
    const order = await q("INSERT INTO orders (student_id, status, amount, currency, gateway) VALUES (?, 'paid', 750, 'BDT', 'none')", [studentId]);
    orderId = order.insertId;
    await q('INSERT INTO order_items (order_id, course_id, unit_price) VALUES (?,?,750)', [orderId, realCourseId]);
    await q('INSERT INTO enrollments (student_id, batch_id, course_id, enrolled_at, status) VALUES (?,NULL,?,CURDATE(),?)', [studentId, realCourseId, 'active']);
    await q(
      "INSERT INTO lesson_progress (student_id, lesson_id, watched_seconds, duration_seconds, completed, completed_at) VALUES (?,?,100,100,1,NOW())",
      [studentId, lessonId]
    );

    const report = await getReport('courses');
    const row = report.rows.find((r) => r.id === realCourseId);
    expect(row).toBeTruthy();
    expect(row.revenue).toBe(750);
    expect(row.enrolled).toBe(1);
    expect(row.completion).toBe('100%'); // 1 completed lesson / (1 video lesson * 1 enrolled student)
    expect(report.summary.revenue).toBeGreaterThanOrEqual(750);
  });
});
