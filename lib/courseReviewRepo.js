// ============================================================
// Course publishing workflow: draft → pending_review → published.
// `published` (the flag every marketplace/enrollment query already reads)
// stays in sync with `review_status`, updated together in one statement so
// the two can never drift apart.
// ============================================================

import { q } from '@/lib/mysql';
import { HttpError, assertCourseComplete } from '@/lib/repo';
import { recordAudit } from '@/lib/auditLog';

export async function submitForReview(session, courseId) {
  await assertCourseComplete(courseId); // same completeness bar as a direct publish
  const r = await q("UPDATE courses SET review_status = 'pending_review' WHERE id = ?", [courseId]);
  if (!r.affectedRows) throw new HttpError(404, { error: 'course_not_found' });
  await recordAudit({ session, action: 'course_submitted_for_review', targetType: 'course', targetId: courseId });
  return { ok: true, reviewStatus: 'pending_review' };
}

export async function approveReview(session, courseId) {
  await assertCourseComplete(courseId);
  const r = await q("UPDATE courses SET published = 1, review_status = 'published', review_note = NULL WHERE id = ?", [courseId]);
  if (!r.affectedRows) throw new HttpError(404, { error: 'course_not_found' });
  await recordAudit({ session, action: 'course_approved', targetType: 'course', targetId: courseId });
  return { ok: true, reviewStatus: 'published' };
}

export async function rejectReview(session, courseId, note) {
  const cleanNote = note ? String(note).trim().slice(0, 2000) : null;
  const r = await q(
    "UPDATE courses SET published = 0, review_status = 'draft', review_note = ? WHERE id = ?",
    [cleanNote, courseId]
  );
  if (!r.affectedRows) throw new HttpError(404, { error: 'course_not_found' });
  await recordAudit({ session, action: 'course_rejected', targetType: 'course', targetId: courseId, detail: cleanNote });
  return { ok: true, reviewStatus: 'draft' };
}

export async function getPendingReviews() {
  return q(
    `SELECT id, title, slug, instructor, price, updated_at AS updatedAt
     FROM courses WHERE review_status = 'pending_review' ORDER BY updated_at`
  );
}
