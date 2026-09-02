// ============================================================
// Course publishing workflow: draft → pending_review → published.
// `published` (the flag every marketplace/enrollment query already reads)
// stays in sync with `review_status`, updated together in one statement so
// the two can never drift apart.
// ============================================================

import { q } from '@/lib/mysql';
import { HttpError, assertCourseComplete } from '@/lib/repo';

export async function submitForReview(courseId) {
  await assertCourseComplete(courseId); // same completeness bar as a direct publish
  const r = await q("UPDATE courses SET review_status = 'pending_review' WHERE id = ?", [courseId]);
  if (!r.affectedRows) throw new HttpError(404, { error: 'course_not_found' });
  return { ok: true, reviewStatus: 'pending_review' };
}

export async function approveReview(courseId) {
  await assertCourseComplete(courseId);
  const r = await q("UPDATE courses SET published = 1, review_status = 'published', review_note = NULL WHERE id = ?", [courseId]);
  if (!r.affectedRows) throw new HttpError(404, { error: 'course_not_found' });
  return { ok: true, reviewStatus: 'published' };
}

export async function rejectReview(courseId, note) {
  const r = await q(
    "UPDATE courses SET published = 0, review_status = 'draft', review_note = ? WHERE id = ?",
    [note ? String(note).trim().slice(0, 2000) : null, courseId]
  );
  if (!r.affectedRows) throw new HttpError(404, { error: 'course_not_found' });
  return { ok: true, reviewStatus: 'draft' };
}

export async function getPendingReviews() {
  return q(
    `SELECT id, title, slug, instructor, price, updated_at AS updatedAt
     FROM courses WHERE review_status = 'pending_review' ORDER BY updated_at`
  );
}
