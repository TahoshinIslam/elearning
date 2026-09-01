// ============================================================
// Student wishlist data-access. Returns the set of saved course ids;
// the client maps those against the courses it already has.
// ============================================================

import { q } from '@/lib/mysql';
import { HttpError } from '@/lib/repo';

export async function getWishlist(studentId) {
  if (!studentId) return [];
  const rows = await q('SELECT course_id FROM wishlist WHERE student_id = ? ORDER BY id DESC', [studentId]);
  return rows.map((r) => r.course_id);
}

export async function addWishlist(studentId, courseId) {
  if (!studentId) throw new HttpError(403, { error: 'not_a_student' });
  if (!courseId) throw new HttpError(400, { error: 'course_required' });
  // idempotent — ignore a duplicate save
  await q('INSERT IGNORE INTO wishlist (student_id, course_id) VALUES (?,?)', [studentId, Number(courseId)]);
  return getWishlist(studentId);
}

export async function removeWishlist(studentId, courseId) {
  if (!studentId) throw new HttpError(403, { error: 'not_a_student' });
  await q('DELETE FROM wishlist WHERE student_id = ? AND course_id = ?', [studentId, Number(courseId)]);
  return getWishlist(studentId);
}
