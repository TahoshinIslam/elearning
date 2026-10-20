// ============================================================
// Course/lesson entitlement — the single place that decides whether a
// session may see a lesson's protected content (video, captions, resources)
// or a course's private learning data. Every route that hands out content
// goes through here; hiding a button in the UI is never the check.
//
//   - public preview: lesson is_free AND its course is published
//   - course manager: owner/superadmin, or the teacher assigned as the
//     course's instructor (courses.instructor_id = session.teacherId)
//   - student: an ACTIVE enrollment in the lesson's course (a refunded /
//     cancelled enrollment no longer grants access)
// ============================================================

import { q } from '@/lib/mysql';
import { HttpError } from '@/lib/repo';

export async function getLessonContext(lessonId) {
  const id = Number(lessonId);
  if (!Number.isInteger(id) || id <= 0) return null;
  const rows = await q(
    `SELECT l.id, l.title, l.summary, l.type, l.is_free, l.duration, l.duration_seconds, l.module_id,
            m.course_id, m.title AS module_title,
            c.slug AS course_slug, c.title AS course_title, c.published AS course_published, c.instructor_id
     FROM lessons l
     JOIN modules m ON m.id = l.module_id
     JOIN courses c ON c.id = m.course_id
     WHERE l.id = ?`,
    [id]
  );
  return rows[0] || null;
}

export async function getCourseContext(courseId) {
  const id = Number(courseId);
  if (!Number.isInteger(id) || id <= 0) return null;
  const rows = await q('SELECT id, slug, title, published, instructor_id FROM courses WHERE id = ?', [id]);
  return rows[0] || null;
}

// course: { instructor_id } (from getLessonContext / getCourseContext)
export function isCourseManager(session, course) {
  if (!session || !course) return false;
  if (session.role === 'owner' || session.role === 'superadmin') return true;
  if (session.role === 'teacher' && session.teacherId) return Number(course.instructor_id) === Number(session.teacherId);
  return false;
}

export async function hasActiveEnrollment(studentId, courseId) {
  if (!studentId || !courseId) return false;
  const rows = await q(
    "SELECT id FROM enrollments WHERE student_id = ? AND course_id = ? AND status = 'active' LIMIT 1",
    [studentId, courseId]
  );
  return rows.length > 0;
}

// → { allowed, via: 'preview'|'manager'|'enrollment'|null, reason }
export async function lessonAccess(session, ctx) {
  if (!ctx) return { allowed: false, via: null, reason: 'lesson_not_found' };
  if (isCourseManager(session, { instructor_id: ctx.instructor_id })) return { allowed: true, via: 'manager' };
  if (session?.studentId && await hasActiveEnrollment(session.studentId, ctx.course_id)) return { allowed: true, via: 'enrollment' };
  if (ctx.is_free && ctx.course_published) return { allowed: true, via: 'preview' };
  return { allowed: false, via: null, reason: session ? 'not_enrolled' : 'auth_required' };
}

// Throwing variant for route handlers.
export async function assertLessonAccess(session, lessonId) {
  const ctx = await getLessonContext(lessonId);
  if (!ctx) throw new HttpError(404, { error: 'lesson_not_found' });
  const access = await lessonAccess(session, ctx);
  if (!access.allowed) throw new HttpError(access.reason === 'auth_required' ? 401 : 403, { error: access.reason });
  return { ctx, access };
}

// Learner-only data (progress, notes, completion) — a preview viewer has no
// learning record. Staff managers may open the player to review content.
export async function assertCourseLearner(session, courseId) {
  if (!session) throw new HttpError(401, { error: 'auth_required' });
  const course = await getCourseContext(courseId);
  if (!course) throw new HttpError(404, { error: 'course_not_found' });
  if (isCourseManager(session, course)) return { course, via: 'manager' };
  if (session.studentId && await hasActiveEnrollment(session.studentId, course.id)) return { course, via: 'enrollment' };
  throw new HttpError(403, { error: 'not_enrolled' });
}

// Throws unless the session may manage (edit) the given course.
export async function assertCourseManager(session, courseId) {
  if (!session) throw new HttpError(401, { error: 'auth_required' });
  const course = await getCourseContext(courseId);
  if (!course) throw new HttpError(404, { error: 'course_not_found' });
  if (!isCourseManager(session, course)) throw new HttpError(403, { error: 'forbidden' });
  return course;
}
