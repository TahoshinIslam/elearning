// ============================================================
// Video entitlement, playback URLs, and lesson progress. This is the only
// path that hands out a playback URL — it always re-checks enrollment
// server-side first (or that the lesson is a free preview), matching the
// audit's explicit requirement: "server-side enrollment checks before
// playback authorization."
// ============================================================

import { q } from '@/lib/mysql';
import { HttpError } from '@/lib/repo';
import { getPresignedUploadUrl, getPresignedPlaybackUrl, videoKey, currentProvider } from '@/lib/storage';

const COMPLETION_RATIO = 0.9; // watched >=90% of the video counts as complete

async function lessonWithCourse(lessonId) {
  const rows = await q(
    `SELECT l.id, l.title, l.type, l.is_free, m.course_id
     FROM lessons l JOIN modules m ON m.id = l.module_id
     WHERE l.id = ?`,
    [lessonId]
  );
  return rows[0] || null;
}

// Staff (course managers) may always view/manage lesson video for review
// purposes; a student needs a real enrollment unless the lesson is free.
const STAFF_ROLES = ['owner', 'teacher', 'superadmin'];

async function canView(session, lesson) {
  if (lesson.is_free) return true;
  if (session && STAFF_ROLES.includes(session.role)) return true;
  if (!session?.studentId) return false;
  const rows = await q(
    'SELECT id FROM enrollments WHERE student_id = ? AND course_id = ? LIMIT 1',
    [session.studentId, lesson.course_id]
  );
  return rows.length > 0;
}

// GET playback info: the signed URL (only if the video is ready) plus this
// student's saved progress, if any. Never trust the client's idea of what
// it's entitled to — always re-derived from `session` + the DB here.
export async function getPlaybackInfo(session, lessonId) {
  const lesson = await lessonWithCourse(lessonId);
  if (!lesson) throw new HttpError(404, { error: 'lesson_not_found' });
  if (lesson.type !== 'video') throw new HttpError(400, { error: 'not_a_video_lesson' });
  if (!(await canView(session, lesson))) throw new HttpError(403, { error: 'not_enrolled' });

  const [asset] = await q('SELECT * FROM video_assets WHERE lesson_id = ?', [lessonId]);
  if (!asset || asset.status !== 'ready') {
    throw new HttpError(404, { error: 'video_not_ready', status: asset?.status || 'missing' });
  }

  const { url, expiresIn } = await getPresignedPlaybackUrl({ key: asset.storage_key });

  let watchedSeconds = 0, completed = false;
  if (session?.studentId) {
    const [progress] = await q(
      'SELECT watched_seconds, completed FROM lesson_progress WHERE student_id = ? AND lesson_id = ?',
      [session.studentId, lessonId]
    );
    if (progress) { watchedSeconds = progress.watched_seconds; completed = !!progress.completed; }
  }

  return {
    url, expiresIn, watchedSeconds, completed,
    durationSeconds: asset.duration_seconds,
    lesson: { id: lesson.id, title: lesson.title, courseId: lesson.course_id, free: !!lesson.is_free }
  };
}

// Save watch position. Server-derived `completed`, never a client-sent
// boolean — a client can report any watchedSeconds it likes, but completion
// is always recomputed here from watchedSeconds/durationSeconds, and
// watchedSeconds itself is clamped to a sane range so a forged huge number
// can't fake instant completion of an untouched video.
export async function saveProgress(session, lessonId, body) {
  if (!session?.studentId) throw new HttpError(400, { error: 'no_student_profile' });
  const lesson = await lessonWithCourse(lessonId);
  if (!lesson) throw new HttpError(404, { error: 'lesson_not_found' });
  if (!(await canView(session, lesson))) throw new HttpError(403, { error: 'not_enrolled' });

  const [asset] = await q('SELECT duration_seconds FROM video_assets WHERE lesson_id = ?', [lessonId]);
  const knownDuration = asset?.duration_seconds || Number(body.durationSeconds) || null;

  let watchedSeconds = Math.max(0, Math.floor(Number(body.watchedSeconds) || 0));
  if (knownDuration) watchedSeconds = Math.min(watchedSeconds, knownDuration);
  const completed = knownDuration ? watchedSeconds >= knownDuration * COMPLETION_RATIO : false;

  // watched_seconds always reflects the LATEST reported position (so resume
  // lands where the student actually left off, including after rewinding to
  // review something) — but `completed` is sticky: once true, a later
  // rewind never un-completes the lesson.
  await q(
    `INSERT INTO lesson_progress (student_id, lesson_id, watched_seconds, duration_seconds, completed, completed_at)
     VALUES (?,?,?,?,?, IF(?,NOW(),NULL))
     ON DUPLICATE KEY UPDATE
       watched_seconds = VALUES(watched_seconds),
       duration_seconds = COALESCE(VALUES(duration_seconds), duration_seconds),
       completed = completed OR VALUES(completed),
       completed_at = IF(completed = 0 AND VALUES(completed) = 1, NOW(), completed_at)`,
    [session.studentId, lessonId, watchedSeconds, knownDuration, completed ? 1 : 0, completed ? 1 : 0]
  );

  // If this was the first time we learned the real duration, backfill it
  // onto the video asset (client reports it once metadata loads).
  if (!asset?.duration_seconds && body.durationSeconds) {
    await q('UPDATE video_assets SET duration_seconds = ? WHERE lesson_id = ? AND duration_seconds IS NULL',
      [Math.floor(Number(body.durationSeconds)), lessonId]);
  }

  // Return what's actually stored, not just this call's locally-computed
  // flag — `completed` is sticky in the DB (see the UPDATE above), so a
  // later low watchedSeconds must still report completed:true if it already
  // was.
  const [stored] = await q('SELECT watched_seconds, completed FROM lesson_progress WHERE student_id = ? AND lesson_id = ?',
    [session.studentId, lessonId]);
  return { watchedSeconds: stored.watched_seconds, completed: !!stored.completed };
}

// Per-course progress for the learning player's curriculum sidebar / "resume"
// logic: every video lesson in the course, this student's progress on each,
// and which lesson to land on (most recently touched, else the first one).
export async function getCourseProgress(session, courseId) {
  if (!session?.studentId) throw new HttpError(400, { error: 'no_student_profile' });
  const enrolled = await q('SELECT id FROM enrollments WHERE student_id = ? AND course_id = ? LIMIT 1', [session.studentId, courseId]);
  if (!enrolled.length && !STAFF_ROLES.includes(session.role)) throw new HttpError(403, { error: 'not_enrolled' });

  const lessons = await q(
    `SELECT l.id, l.title, l.module_id, l.position, l.is_free, m.title AS module_title, m.position AS module_position
     FROM lessons l JOIN modules m ON m.id = l.module_id
     WHERE m.course_id = ? AND l.type = 'video'
     ORDER BY m.position, m.id, l.position, l.id`,
    [courseId]
  );
  const progressRows = await q(
    `SELECT lesson_id, watched_seconds, completed, last_activity_at
     FROM lesson_progress WHERE student_id = ? AND lesson_id IN (${lessons.length ? lessons.map(() => '?').join(',') : 'NULL'})`,
    [session.studentId, ...lessons.map((l) => l.id)]
  );
  const byLesson = Object.fromEntries(progressRows.map((r) => [r.lesson_id, r]));

  const withProgress = lessons.map((l) => ({
    id: l.id, title: l.title, moduleTitle: l.module_title, free: !!l.is_free,
    watchedSeconds: byLesson[l.id]?.watched_seconds || 0,
    completed: !!byLesson[l.id]?.completed,
    lastActivityAt: byLesson[l.id]?.last_activity_at || null
  }));

  const mostRecent = progressRows.slice().sort((a, b) => new Date(b.last_activity_at) - new Date(a.last_activity_at))[0];
  const resumeLessonId = mostRecent?.lesson_id
    || withProgress.find((l) => !l.completed)?.id
    || withProgress[0]?.id
    || null;

  const total = withProgress.length;
  const completedCount = withProgress.filter((l) => l.completed).length;

  return {
    lessons: withProgress,
    resumeLessonId,
    completion: total ? Math.round((completedCount / total) * 100) : 0
  };
}

// ---------- instructor upload flow (staff only, enforced by the route) ----------
export async function requestUploadUrl({ lessonId, fileName, contentType }) {
  const lesson = await lessonWithCourse(lessonId);
  if (!lesson) throw new HttpError(404, { error: 'lesson_not_found' });
  if (lesson.type !== 'video') throw new HttpError(400, { error: 'not_a_video_lesson' });

  const key = videoKey({ courseId: lesson.course_id, lessonId, fileName });
  const { url, expiresIn } = await getPresignedUploadUrl({ key, contentType });

  await q(
    `INSERT INTO video_assets (lesson_id, provider, storage_key, status) VALUES (?,?,?, 'pending')
     ON DUPLICATE KEY UPDATE provider = VALUES(provider), storage_key = VALUES(storage_key), status = 'pending', duration_seconds = NULL`,
    [lessonId, currentProvider(), key]
  );

  return { uploadUrl: url, expiresIn, key };
}

export async function confirmUpload({ lessonId, key, durationSeconds }) {
  const [asset] = await q('SELECT id, storage_key FROM video_assets WHERE lesson_id = ?', [lessonId]);
  if (!asset || asset.storage_key !== key) throw new HttpError(409, { error: 'upload_mismatch' });
  await q('UPDATE video_assets SET status = ?, duration_seconds = ? WHERE lesson_id = ?',
    ['ready', durationSeconds ? Math.floor(Number(durationSeconds)) : null, lessonId]);
  return { ok: true };
}
