// ============================================================
// Course review submission + moderation.
// Students submit reviews as 'pending'; admins approve / hide / feature them.
// Public course pages (getCourses) only ever surface 'approved' rows.
// ============================================================

import { q } from '@/lib/mysql';
import { HttpError } from '@/lib/repo';

// Who may review: a verified purchaser (paid order line > 0 with an active
// enrollment), or an active enrollee of a free course (nothing to buy).
export async function reviewEligibility(studentId, courseId) {
  if (!studentId || !courseId) return { eligible: false, verifiedPurchase: false };
  const [c] = await q('SELECT price FROM courses WHERE id = ?', [courseId]);
  if (!c) return { eligible: false, verifiedPurchase: false };
  const [enr] = await q("SELECT id FROM enrollments WHERE student_id = ? AND course_id = ? AND status = 'active' LIMIT 1", [studentId, courseId]);
  if (!enr) return { eligible: false, verifiedPurchase: false };
  const [paid] = await q(
    `SELECT o.id FROM orders o JOIN order_items oi ON oi.order_id = o.id
     WHERE o.student_id = ? AND oi.course_id = ? AND o.status = 'paid' AND oi.unit_price > 0 LIMIT 1`, [studentId, courseId]);
  return { eligible: !!paid || Number(c.price) === 0, verifiedPurchase: !!paid };
}

export async function getMyReview(studentId, courseId) {
  const [r] = await q('SELECT id, rating, text, status, verified_purchase, created_at, updated_at FROM course_reviews WHERE course_id = ? AND student_id = ?', [courseId, studentId]);
  return r ? { id: r.id, rating: r.rating, text: r.text || '', status: r.status, verifiedPurchase: !!r.verified_purchase, updatedAt: r.updated_at || r.created_at } : null;
}

// One review per student per course; editing replaces it and sends it back
// to moderation (status 'pending') so published reviews stay checked.
export async function submitReview(session, body) {
  const courseId = Number(body.courseId);
  const rating = Number(body.rating);
  const text = String(body.text || '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, ' ').trim().slice(0, 2000);
  if (!courseId) throw new HttpError(400, { error: 'course_required' });
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new HttpError(400, { error: 'rating_required' });
  const studentId = session.studentId;
  const { eligible, verifiedPurchase } = await reviewEligibility(studentId, courseId);
  if (!eligible) throw new HttpError(403, { error: 'not_eligible' });
  await q(
    `INSERT INTO course_reviews (course_id, name, rating, text, status, student_id, verified_purchase) VALUES (?,?,?,?,'pending',?,?)
     ON DUPLICATE KEY UPDATE rating = VALUES(rating), text = VALUES(text), status = 'pending', verified_purchase = VALUES(verified_purchase), updated_at = NOW()`,
    [courseId, session.name || 'শিক্ষার্থী', rating, text || null, studentId, verifiedPurchase ? 1 : 0]
  );
  return getMyReview(studentId, courseId);
}

// Admin: all reviews with course title, newest first.
export async function getReviewsForModeration() {
  return q(
    `SELECT r.id, r.course_id AS courseId, c.title AS courseTitle, r.name, r.rating, r.text,
            r.status, r.featured, r.created_at AS createdAt
     FROM course_reviews r LEFT JOIN courses c ON r.course_id = c.id
     ORDER BY (r.status='pending') DESC, r.id DESC`
  ).then((rows) => rows.map((r) => ({ ...r, featured: !!r.featured })));
}

export async function setReviewStatus(body) {
  const status = ['pending', 'approved', 'hidden'].includes(body.status) ? body.status : null;
  if (!status || !body.id) throw new HttpError(400, { error: 'invalid_request' });
  await q('UPDATE course_reviews SET status = ? WHERE id = ?', [status, body.id]);
  return getReviewsForModeration();
}

export async function setReviewFeatured(body) {
  if (!body.id) throw new HttpError(400, { error: 'invalid_request' });
  // featuring implies it must be visible → approve it too
  await q('UPDATE course_reviews SET featured = ?, status = IF(? = 1, "approved", status) WHERE id = ?',
    [body.featured ? 1 : 0, body.featured ? 1 : 0, body.id]);
  return getReviewsForModeration();
}
