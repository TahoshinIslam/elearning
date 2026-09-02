// Phase 4 — integration tests for video entitlement + progress. Object
// storage is stubbed (vi.mock), same reasoning as the bKash stub in
// tests/checkout.test.mjs: no live bucket credentials from here, but every
// DB-backed rule (who can watch what, and whether progress can be forged)
// runs for real.

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { q } from '@/lib/mysql';
import { createUser } from '@/lib/authRepo';

vi.mock('@/lib/storage', () => ({
  getPresignedUploadUrl: vi.fn(async ({ key }) => ({ url: `https://bucket.example/upload/${key}`, expiresIn: 900 })),
  getPresignedPlaybackUrl: vi.fn(async ({ key }) => ({ url: `https://bucket.example/play/${key}`, expiresIn: 3600 })),
  deleteObject: vi.fn(async () => {}),
  videoKey: ({ courseId, lessonId }) => `videos/${courseId}/${lessonId}/test.mp4`,
  currentProvider: () => 's3'
}));
const { getPlaybackInfo, saveProgress, getCourseProgress, requestUploadUrl, confirmUpload } = await import('@/lib/videoRepo');

const RUN_ID = Date.now();
let enrolledStudentId, outsiderStudentId, enrolledUserId, outsiderUserId;
let courseId, paidLessonId, freeLessonId;
const DURATION = 600; // 10 minutes

beforeAll(async () => {
  const enrolledUser = await createUser({ name: 'Enrolled Viewer', email: `phase4-enrolled-${RUN_ID}@example.test`, password: 'testpass123' });
  enrolledUserId = enrolledUser.id;
  enrolledStudentId = enrolledUser.student_id;

  const outsiderUser = await createUser({ name: 'Outsider Viewer', email: `phase4-outsider-${RUN_ID}@example.test`, password: 'testpass123' });
  outsiderUserId = outsiderUser.id;
  outsiderStudentId = outsiderUser.student_id;

  const course = await q(
    `INSERT INTO courses (title, slug, published, price, old_price, rating, rating_count, language)
     VALUES (?,?,1,1000,0,0,0,'English')`,
    [`Phase 4 Video Course ${RUN_ID}`, `phase4-video-${RUN_ID}`]
  );
  courseId = course.insertId;

  const mod = await q('INSERT INTO modules (course_id, title, position) VALUES (?,?,0)', [courseId, 'Module 1']);
  const moduleId = mod.insertId;

  const paidLesson = await q(
    "INSERT INTO lessons (module_id, title, type, duration, is_free, position) VALUES (?,?,'video','10 min',0,0)",
    [moduleId, 'Paid Lesson']
  );
  paidLessonId = paidLesson.insertId;

  const freeLesson = await q(
    "INSERT INTO lessons (module_id, title, type, duration, is_free, position) VALUES (?,?,'video','5 min',1,1)",
    [moduleId, 'Free Preview Lesson']
  );
  freeLessonId = freeLesson.insertId;

  for (const [lessonId, key] of [[paidLessonId, `videos/${courseId}/${paidLessonId}/seed.mp4`], [freeLessonId, `videos/${courseId}/${freeLessonId}/seed.mp4`]]) {
    await q(
      "INSERT INTO video_assets (lesson_id, provider, storage_key, duration_seconds, status) VALUES (?,'s3',?,?,'ready')",
      [lessonId, key, DURATION]
    );
  }

  await q('INSERT INTO enrollments (student_id, batch_id, course_id, enrolled_at, status) VALUES (?,NULL,?,CURDATE(),?)',
    [enrolledStudentId, courseId, 'active']);
});

afterAll(async () => {
  await q('DELETE FROM lesson_progress WHERE student_id IN (?,?)', [enrolledStudentId, outsiderStudentId]);
  await q('DELETE FROM enrollments WHERE course_id = ?', [courseId]);
  await q('DELETE FROM video_assets WHERE lesson_id IN (?,?)', [paidLessonId, freeLessonId]);
  await q('DELETE FROM courses WHERE id = ?', [courseId]); // cascades modules + lessons
  await q('DELETE FROM users WHERE id IN (?,?)', [enrolledUserId, outsiderUserId]);
  await q('DELETE FROM students WHERE id IN (?,?)', [enrolledStudentId, outsiderStudentId]);
});

describe('server-side playback entitlement', () => {
  it('lets an enrolled student play a paid lesson', async () => {
    const info = await getPlaybackInfo({ studentId: enrolledStudentId, role: 'student' }, paidLessonId);
    expect(info.url).toContain('/play/');
    expect(info.durationSeconds).toBe(DURATION);
  });

  it('refuses a non-enrolled student a paid lesson', async () => {
    await expect(getPlaybackInfo({ studentId: outsiderStudentId, role: 'student' }, paidLessonId))
      .rejects.toMatchObject({ status: 403, body: { error: 'not_enrolled' } });
  });

  it('refuses a guest (no session) a paid lesson', async () => {
    await expect(getPlaybackInfo(null, paidLessonId)).rejects.toMatchObject({ status: 403 });
  });

  it('lets a guest watch a free-preview lesson with no account at all', async () => {
    const info = await getPlaybackInfo(null, freeLessonId);
    expect(info.url).toContain('/play/');
    expect(info.watchedSeconds).toBe(0); // no progress tracked for a guest
  });

  it('lets staff preview any lesson for content review, enrolled or not', async () => {
    const info = await getPlaybackInfo({ role: 'owner' }, paidLessonId);
    expect(info.url).toContain('/play/');
  });
});

describe('progress cannot be forged', () => {
  it('clamps a wildly over-reported watchedSeconds to the real video duration', async () => {
    const result = await saveProgress({ studentId: enrolledStudentId, role: 'student' }, paidLessonId, { watchedSeconds: 999999 });
    expect(result.watchedSeconds).toBe(DURATION); // never beyond the real duration
    expect(result.completed).toBe(true); // clamped value still crosses the 90% threshold

    const [row] = await q('SELECT watched_seconds, completed FROM lesson_progress WHERE student_id = ? AND lesson_id = ?', [enrolledStudentId, paidLessonId]);
    expect(row.watched_seconds).toBe(DURATION);
    expect(row.completed).toBe(1);
  });

  it('does not derive completed from a small watchedSeconds even if the client claims completion', async () => {
    const result = await saveProgress({ studentId: enrolledStudentId, role: 'student' }, freeLessonId, { watchedSeconds: 10, completed: true });
    expect(result.completed).toBe(false); // server ignores body.completed entirely
  });

  it('refuses to record progress for a student who was never enrolled', async () => {
    await expect(saveProgress({ studentId: outsiderStudentId, role: 'student' }, paidLessonId, { watchedSeconds: 100 }))
      .rejects.toMatchObject({ status: 403 });
  });

  it('completion is sticky, but the resume position always reflects the latest report (including a rewind)', async () => {
    // already completed from the earlier test; now the student rewinds to review something
    const result = await saveProgress({ studentId: enrolledStudentId, role: 'student' }, paidLessonId, { watchedSeconds: 120 });
    expect(result.completed).toBe(true);   // still complete — never un-completes
    expect(result.watchedSeconds).toBe(120); // but resume goes to the actual last position
  });
});

describe('course-level progress + resume', () => {
  it('reports per-lesson progress and picks the most recently touched lesson to resume', async () => {
    const progress = await getCourseProgress({ studentId: enrolledStudentId, role: 'student' }, courseId);
    expect(progress.lessons).toHaveLength(2);
    expect(progress.resumeLessonId).toBe(paidLessonId); // most recently saved above
    const paid = progress.lessons.find((l) => l.id === paidLessonId);
    expect(paid.completed).toBe(true);
    expect(paid.watchedSeconds).toBe(120);
  });

  it('refuses course progress for a student who never enrolled', async () => {
    await expect(getCourseProgress({ studentId: outsiderStudentId, role: 'student' }, courseId))
      .rejects.toMatchObject({ status: 403 });
  });
});

describe('instructor upload flow', () => {
  it('creates a pending video asset on upload-url request, then marks it ready on confirm', async () => {
    const mod = await q('INSERT INTO modules (course_id, title, position) VALUES (?,?,1)', [courseId, 'Module 2']);
    const lesson = await q(
      "INSERT INTO lessons (module_id, title, type, is_free, position) VALUES (?,?,'video',0,0)",
      [mod.insertId, 'New Upload Lesson']
    );
    const lessonId = lesson.insertId;

    const { uploadUrl, key } = await requestUploadUrl({ lessonId, fileName: 'lecture.mp4', contentType: 'video/mp4' });
    expect(uploadUrl).toContain(key);

    const [pending] = await q('SELECT status FROM video_assets WHERE lesson_id = ?', [lessonId]);
    expect(pending.status).toBe('pending');

    await confirmUpload({ lessonId, key, durationSeconds: 300 });
    const [ready] = await q('SELECT status, duration_seconds FROM video_assets WHERE lesson_id = ?', [lessonId]);
    expect(ready.status).toBe('ready');
    expect(ready.duration_seconds).toBe(300);
  });
});
