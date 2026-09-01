// ============================================================
// Course review submission + moderation.
// Students submit reviews as 'pending'; admins approve / hide / feature them.
// Public course pages (getCourses) only ever surface 'approved' rows.
// ============================================================

import { q } from '@/lib/mysql';
import { HttpError } from '@/lib/repo';

// Student submits a review for a course (one per student per course).
export async function submitReview(session, body) {
  const courseId = Number(body.courseId);
  const rating = Math.max(1, Math.min(5, Number(body.rating) || 5));
  const text = String(body.text || '').trim();
  if (!courseId) throw new HttpError(400, { error: 'course_required' });
  if (!text) throw new HttpError(400, { error: 'text_required' });

  const studentId = session.studentId || null;
  if (studentId) {
    const dup = await q('SELECT id FROM course_reviews WHERE course_id = ? AND student_id = ? LIMIT 1', [courseId, studentId]);
    if (dup[0]) {
      await q("UPDATE course_reviews SET rating = ?, text = ?, status = 'pending' WHERE id = ?", [rating, text, dup[0].id]);
      return { ok: true, updated: true };
    }
  }
  await q("INSERT INTO course_reviews (course_id, name, rating, text, status, student_id) VALUES (?,?,?,?,'pending',?)",
    [courseId, session.name || 'শিক্ষার্থী', rating, text, studentId]);
  return { ok: true };
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
