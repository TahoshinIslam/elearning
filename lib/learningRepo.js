// ============================================================
// Learner-side read models: the course player outline and "My Learning".
//
// One completion rule everywhere: course completion = unique completed
// lessons / lessons in the course. A lesson is completed by watching ≥90%
// of its video (lib/watchRanges.js), submitting its quiz or assignment, or
// — for reading lessons — the learner's explicit "mark complete".
// ============================================================

import { q } from '@/lib/mysql';
import { HttpError } from '@/lib/repo';
import { isCourseManager, hasActiveEnrollment } from '@/lib/access';
import { resumePosition } from '@/lib/watchRanges';
import { publicThumbnailUrl } from '@/lib/storage';

const inList = (arr) => arr.map(() => '?').join(',');

// Pick where "Continue" should land: the last opened lesson unless it's
// done (then the next unfinished one after it), else the first unfinished
// lesson, else the first lesson.
export function pickResumeLesson(orderedLessonIds, completedSet, lastLessonId) {
  if (!orderedLessonIds.length) return null;
  const idx = lastLessonId ? orderedLessonIds.indexOf(Number(lastLessonId)) : -1;
  if (idx >= 0) {
    if (!completedSet.has(orderedLessonIds[idx])) return orderedLessonIds[idx];
    const after = orderedLessonIds.slice(idx + 1).find((id) => !completedSet.has(id));
    if (after) return after;
  }
  return orderedLessonIds.find((id) => !completedSet.has(id)) ?? orderedLessonIds[0];
}

async function lessonsForCourses(courseIds) {
  if (!courseIds.length) return [];
  return q(
    `SELECT l.id, l.title, l.summary, l.type, l.duration, l.duration_seconds, l.is_free, l.position,
            m.id AS module_id, m.title AS module_title, m.position AS module_position, m.course_id,
            va.status AS video_status, va.duration_seconds AS video_duration
     FROM lessons l
     JOIN modules m ON m.id = l.module_id
     LEFT JOIN video_assets va ON va.lesson_id = l.id
     WHERE m.course_id IN (${inList(courseIds)})
     ORDER BY m.course_id, m.position, m.id, l.position, l.id`,
    courseIds
  );
}

// Course player outline: every lesson with this learner's state.
export async function getLearnerCourse(session, slug) {
  if (!session) throw new HttpError(401, { error: 'auth_required' });
  const [course] = await q(
    `SELECT c.id, c.slug, c.title, c.published, c.instructor, c.instructor_id, c.thumb, c.thumbnail_key, c.completion_threshold
     FROM courses c WHERE c.slug = ?`, [String(slug || '')]
  );
  if (!course) throw new HttpError(404, { error: 'course_not_found' });

  const manager = isCourseManager(session, course);
  const enrolled = session.studentId ? await hasActiveEnrollment(session.studentId, course.id) : false;
  if (!manager && !enrolled) throw new HttpError(403, { error: 'not_enrolled', slug: course.slug });

  const lessons = await lessonsForCourses([course.id]);
  const ids = lessons.map((l) => l.id);
  const progress = enrolled && ids.length
    ? await q(`SELECT lesson_id, completed, position_seconds, covered_seconds, completion_source FROM lesson_progress
               WHERE student_id = ? AND lesson_id IN (${inList(ids)})`, [session.studentId, ...ids])
    : [];
  const byLesson = Object.fromEntries(progress.map((p) => [p.lesson_id, p]));
  const resources = ids.length
    ? await q(`SELECT lesson_id, COUNT(*) AS n FROM lesson_resources WHERE status = 'ready' AND lesson_id IN (${inList(ids)}) GROUP BY lesson_id`, ids)
    : [];
  const resCount = Object.fromEntries(resources.map((r) => [r.lesson_id, Number(r.n)]));
  const [enrollment] = enrolled
    ? await q("SELECT last_lesson_id FROM enrollments WHERE student_id = ? AND course_id = ? AND status = 'active' LIMIT 1", [session.studentId, course.id])
    : [];

  const modules = [];
  for (const l of lessons) {
    let m = modules[modules.length - 1];
    if (!m || m.id !== l.module_id) { m = { id: l.module_id, title: l.module_title, lessons: [] }; modules.push(m); }
    const p = byLesson[l.id];
    const duration = l.video_duration || l.duration_seconds || null;
    m.lessons.push({
      id: l.id, title: l.title, summary: l.summary || null, type: l.type, free: !!l.is_free,
      durationSeconds: duration, durationLabel: duration ? null : (l.duration && l.duration !== '—' ? l.duration : null),
      videoReady: l.type === 'video' ? l.video_status === 'ready' : null,
      completed: !!p?.completed,
      completionSource: p?.completion_source || null,
      resumeAt: p ? resumePosition(p.position_seconds, duration) : 0,
      resources: resCount[l.id] || 0
    });
  }
  const completedSet = new Set(progress.filter((p) => p.completed).map((p) => p.lesson_id));
  const completedCount = ids.filter((id) => completedSet.has(id)).length;

  return {
    course: {
      id: course.id, slug: course.slug, title: course.title, published: !!course.published,
      instructor: course.instructor, thumb: course.thumb, thumbnailUrl: publicThumbnailUrl(course.thumbnail_key)
    },
    viewer: manager && !enrolled ? 'manager' : 'learner',
    modules,
    lessonCount: ids.length,
    completedCount,
    completionPct: ids.length ? Math.round((completedCount / ids.length) * 100) : null,
    resumeLessonId: pickResumeLesson(ids, completedSet, enrollment?.last_lesson_id)
  };
}

// "My Learning": every course this student actively owns, with real progress.
export async function getMyLearning(session) {
  if (!session?.studentId) throw new HttpError(403, { error: 'no_student_profile' });
  const studentId = session.studentId;

  const enrollments = await q(
    `SELECT e.course_id, MAX(e.enrolled_at) AS enrolled_at, MAX(e.last_lesson_id) AS last_lesson_id, MAX(e.last_accessed_at) AS last_accessed_at,
            c.title, c.slug, c.thumb, c.thumbnail_key, c.instructor, c.category, c.published, c.completion_threshold
     FROM enrollments e JOIN courses c ON c.id = e.course_id
     WHERE e.student_id = ? AND e.status = 'active' AND e.course_id IS NOT NULL
     GROUP BY e.course_id, c.title, c.slug, c.thumb, c.thumbnail_key, c.instructor, c.category, c.published, c.completion_threshold`,
    [studentId]
  );
  if (!enrollments.length) return [];
  const courseIds = enrollments.map((e) => e.course_id);
  const lessons = await lessonsForCourses(courseIds);
  const lessonIds = lessons.map((l) => l.id);
  const progressRows = lessonIds.length
    ? await q(`SELECT lesson_id, completed, last_activity_at FROM lesson_progress WHERE student_id = ? AND lesson_id IN (${inList(lessonIds)})`,
      [studentId, ...lessonIds])
    : [];
  const progressByLesson = Object.fromEntries(progressRows.map((p) => [p.lesson_id, p]));
  const certRows = await q(`SELECT course_id, cert_no FROM certificates WHERE student_id = ? AND course_id IN (${inList(courseIds)})`, [studentId, ...courseIds]);
  const certByCourse = Object.fromEntries(certRows.map((r) => [r.course_id, r.cert_no]));

  const lessonsByCourse = {};
  for (const l of lessons) (lessonsByCourse[l.course_id] = lessonsByCourse[l.course_id] || []).push(l);

  return enrollments.map((e) => {
    const list = lessonsByCourse[e.course_id] || [];
    const ids = list.map((l) => l.id);
    const completedSet = new Set(ids.filter((id) => progressByLesson[id]?.completed));
    const touched = ids.map((id) => progressByLesson[id]).filter((p) => p?.last_activity_at);
    const lastActivity = [e.last_accessed_at, ...touched.map((p) => p.last_activity_at)].filter(Boolean).sort().pop() || null;
    const resumeLessonId = pickResumeLesson(ids, completedSet, e.last_lesson_id);
    const resume = list.find((l) => l.id === resumeLessonId);
    return {
      courseId: e.course_id,
      title: e.title,
      slug: e.slug,
      thumb: e.thumb,
      thumbnailUrl: publicThumbnailUrl(e.thumbnail_key),
      instructor: e.instructor,
      category: e.category,
      enrolledAt: e.enrolled_at,
      lessonCount: ids.length,
      completedCount: completedSet.size,
      completionPct: ids.length ? Math.round((completedSet.size / ids.length) * 100) : null, // null = nothing to measure yet
      status: !ids.length ? 'empty' : completedSet.size === ids.length ? 'completed' : completedSet.size || touched.length ? 'in_progress' : 'not_started',
      resumeLessonId,
      resumeLessonTitle: resume?.title || null,
      lastActivityAt: lastActivity,
      certificateThreshold: e.completion_threshold ?? 80,
      certified: !!certByCourse[e.course_id],
      certNo: certByCourse[e.course_id] || null
    };
  }).sort((a, b) => String(b.lastActivityAt || b.enrolledAt || '').localeCompare(String(a.lastActivityAt || a.enrolledAt || '')));
}

// Lesson-based completion % for one student in one course (certificates).
export async function lessonCompletionPct(studentId, courseId) {
  const [row] = await q(
    `SELECT COUNT(*) AS total, SUM(COALESCE(lp.completed, 0)) AS done
     FROM lessons l JOIN modules m ON m.id = l.module_id
     LEFT JOIN lesson_progress lp ON lp.lesson_id = l.id AND lp.student_id = ?
     WHERE m.course_id = ?`,
    [studentId, courseId]
  );
  const total = Number(row?.total) || 0;
  return total ? Math.round((Number(row.done) / total) * 100) : null;
}
