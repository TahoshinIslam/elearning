// ============================================================
// "My Learning" overlay data: per enrolled course, how much of its real
// video curriculum this student has actually watched, where to resume, and
// whether a certificate has been issued. Course/module/lesson shape itself
// is already fetched elsewhere (GET /api/courses) — this only adds the
// progress-specific numbers that live in lesson_progress/certificates, in a
// constant number of queries regardless of how many courses the student is in.
// ============================================================

import { q } from '@/lib/mysql';
import { HttpError } from '@/lib/repo';

export async function getMyLearning(session) {
  if (!session?.studentId) throw new HttpError(400, { error: 'no_student_profile' });
  const studentId = session.studentId;

  const enrollments = await q(
    "SELECT DISTINCT course_id FROM enrollments WHERE student_id = ? AND status = 'active' AND course_id IS NOT NULL",
    [studentId]
  );
  if (!enrollments.length) return [];
  const courseIds = enrollments.map((e) => e.course_id);
  const inCourses = courseIds.map(() => '?').join(',');

  const videoLessons = await q(
    `SELECT l.id AS lesson_id, m.course_id
     FROM lessons l JOIN modules m ON m.id = l.module_id
     WHERE m.course_id IN (${inCourses}) AND l.type = 'video'
     ORDER BY m.position, m.id, l.position, l.id`,
    courseIds
  );
  const courseOfLesson = Object.fromEntries(videoLessons.map((l) => [l.lesson_id, l.course_id]));

  const progressRows = videoLessons.length
    ? await q(
        `SELECT lesson_id, completed, last_activity_at FROM lesson_progress
         WHERE student_id = ? AND lesson_id IN (${videoLessons.map(() => '?').join(',')})`,
        [studentId, ...videoLessons.map((l) => l.lesson_id)]
      )
    : [];

  const certRows = await q(
    `SELECT course_id, cert_no FROM certificates WHERE student_id = ? AND course_id IN (${inCourses})`,
    [studentId, ...courseIds]
  );
  const certByCourse = Object.fromEntries(certRows.map((r) => [r.course_id, r.cert_no]));

  const stats = {};
  for (const cid of courseIds) stats[cid] = { total: 0, completed: 0 };
  for (const l of videoLessons) stats[l.course_id].total++;

  let mostRecentByCourse = {};
  let firstVideoLessonByCourse = {};
  for (const l of videoLessons) {
    if (!(l.course_id in firstVideoLessonByCourse)) firstVideoLessonByCourse[l.course_id] = l.lesson_id;
  }
  for (const p of progressRows) {
    const cid = courseOfLesson[p.lesson_id];
    if (p.completed) stats[cid].completed++;
    const existing = mostRecentByCourse[cid];
    if (!existing || new Date(p.last_activity_at) > new Date(existing.lastActivityAt)) {
      mostRecentByCourse[cid] = { lessonId: p.lesson_id, lastActivityAt: p.last_activity_at };
    }
  }

  return courseIds.map((cid) => {
    const { total, completed } = stats[cid];
    const recent = mostRecentByCourse[cid];
    return {
      courseId: cid,
      videoLessonCount: total,
      videoCompletedCount: completed,
      completionPct: total ? Math.round((completed / total) * 100) : null, // null = no video content to measure
      resumeLessonId: recent?.lessonId ?? firstVideoLessonByCourse[cid] ?? null,
      lastActivityAt: recent?.lastActivityAt ?? null,
      certified: !!certByCourse[cid],
      certNo: certByCourse[cid] || null
    };
  });
}
