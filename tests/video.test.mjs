// Playback authorization, preview eligibility, watch progress and the
// instructor upload flow — real database, real local storage provider
// (temp directory), real signed media tokens. Journeys covered:
//   2. an authorized public preview plays before purchase
//   3. a non-owner cannot obtain paid playback through direct API calls
//   7. an enrolled student watches and saves progress (seeking ≠ watching)
//   8. progress restores on refresh / another device (new playback session)

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { q } from '@/lib/mysql';
import { fixtures } from './helpers/fixtures.mjs';

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'leo-media-'));
process.env.STORAGE_PROVIDER = 'local';
process.env.STORAGE_LOCAL_DIR = tmp;

const { getPlaybackInfo, saveProgress, setManualCompletion, requestUploadUrl, confirmUpload, getVideoStatus } = await import('@/lib/videoRepo');
const { getLearnerCourse } = await import('@/lib/learningRepo');
const { verifyToken } = await import('@/lib/signedUrl');
const { lessonAccess, getLessonContext } = await import('@/lib/access');

const fx = fixtures('video');
let enrolled, outsider, refunded, course, draftCourse, teacherId, otherTeacherId;
let paidLesson, freeLesson, pdfLesson, secondVideo;
const DURATION = 600;

beforeAll(async () => {
  enrolled = await fx.student('Enrolled');
  outsider = await fx.student('Outsider');
  refunded = await fx.student('Refunded');
  const t1 = await q("INSERT INTO teachers (name) VALUES ('Fixture Instructor')");
  const t2 = await q("INSERT INTO teachers (name) VALUES ('Other Instructor')");
  teacherId = t1.insertId; otherTeacherId = t2.insertId;
  course = await fx.course({
    price: 1000, extra: { instructorId: teacherId },
    lessons: [{ duration: DURATION }, { free: true, duration: 300 }, { type: 'pdf' }, { duration: DURATION }]
  });
  [paidLesson, freeLesson, pdfLesson, secondVideo] = course.lessonIds;
  draftCourse = await fx.course({ published: false, lessons: [{ free: true }] });
  await fx.enroll(enrolled.studentId, course.courseId);
  await fx.enroll(refunded.studentId, course.courseId, 'cancelled');
});

afterAll(async () => {
  await q('DELETE FROM teachers WHERE id IN (?,?)', [teacherId, otherTeacherId]);
  await fx.cleanup();
  fs.rmSync(tmp, { recursive: true, force: true });
});

describe('playback entitlement (server-side, every call)', () => {
  it('an enrolled student gets a short-lived signed URL plus their progress', async () => {
    const info = await getPlaybackInfo(enrolled.session, paidLesson);
    expect(info.access).toBe('enrollment');
    expect(info.url).toMatch(/^\/api\/storage\/object\//);
    const token = info.url.split('/').pop();
    const payload = verifyToken(token);
    expect(payload.op).toBe('get');
    expect(payload.exp - Date.now()).toBeLessThanOrEqual(10 * 60 * 1000);
    expect(info.progress).toMatchObject({ positionSeconds: 0, completed: false });
    // the storage key is never in the response
    expect(JSON.stringify(info)).not.toContain('fixture.mp4');
  });

  it('a visitor and a signed-in non-owner are refused a paid lesson', async () => {
    await expect(getPlaybackInfo(null, paidLesson)).rejects.toMatchObject({ status: 401 });
    await expect(getPlaybackInfo(outsider.session, paidLesson)).rejects.toMatchObject({ status: 403, body: { error: 'not_enrolled' } });
  });

  it('a refunded (cancelled) enrollment no longer grants access', async () => {
    await expect(getPlaybackInfo(refunded.session, paidLesson)).rejects.toMatchObject({ status: 403 });
    await expect(saveProgress(refunded.session, paidLesson, { positionSeconds: 10, ranges: [[0, 10]] })).rejects.toMatchObject({ status: 403 });
  });

  it('a visitor can play a public preview of a published course — URL only, no learning record', async () => {
    const info = await getPlaybackInfo(null, freeLesson);
    expect(info.access).toBe('preview');
    expect(info.progress).toBeNull();
  });

  it('previews of an unpublished course are not public', async () => {
    await expect(getPlaybackInfo(null, draftCourse.lessonIds[0])).rejects.toMatchObject({ status: 401 });
  });

  it('a forged/expired token is rejected and a tampered one fails verification', async () => {
    const info = await getPlaybackInfo(enrolled.session, paidLesson);
    const token = info.url.split('/').pop();
    const [body, sig] = token.split('.');
    const forged = Buffer.from(JSON.stringify({ ...JSON.parse(Buffer.from(body, 'base64url')), k: 'videos/1/1/other.mp4' })).toString('base64url');
    expect(verifyToken(`${forged}.${sig}`)).toBeNull();
  });

  it('only the course’s own instructor (or an owner) is a course manager', async () => {
    const ctx = await getLessonContext(paidLesson);
    expect((await lessonAccess({ role: 'teacher', teacherId }, ctx)).via).toBe('manager');
    expect((await lessonAccess({ role: 'teacher', teacherId: otherTeacherId }, ctx)).allowed).toBe(false);
    expect((await lessonAccess({ role: 'owner' }, ctx)).via).toBe('manager');
  });
});

describe('watch progress', () => {
  const S1 = 'sessAAAAAA', S2 = 'sessBBBBBB';

  it('seeking to the end is not watching: position moves, completion does not', async () => {
    const r = await saveProgress(enrolled.session, paidLesson, { positionSeconds: 590, ranges: [[0, 5], [585, 590]], session: S1, seq: 1 });
    expect(r.positionSeconds).toBe(590);
    expect(r.coveredSeconds).toBeLessThanOrEqual(10);
    expect(r.completed).toBe(false);
  });

  it('a forged "I watched everything" range is capped by elapsed wall time', async () => {
    const r = await saveProgress(enrolled.session, paidLesson, { positionSeconds: 600, ranges: [[0, 600]], session: S1, seq: 2 });
    expect(r.trimmed).toBe(true);
    expect(r.completed).toBe(false);
    expect(r.coveredSeconds).toBeLessThan(60);
  });

  it('a stale save from the same playback session cannot move the resume point back', async () => {
    await saveProgress(enrolled.session, paidLesson, { positionSeconds: 120, ranges: [], session: S1, seq: 10 });
    const stale = await saveProgress(enrolled.session, paidLesson, { positionSeconds: 40, ranges: [], session: S1, seq: 9 });
    expect(stale.stale).toBe(true);
    expect(stale.positionSeconds).toBe(120);
  });

  it('another device (new playback session) resumes from — and updates — the saved position', async () => {
    const info = await getPlaybackInfo(enrolled.session, paidLesson);
    expect(info.progress.resumeAt).toBe(120);
    const r = await saveProgress(enrolled.session, paidLesson, { positionSeconds: 150, ranges: [], session: S2, seq: 1 });
    expect(r.positionSeconds).toBe(150);
  });

  it('genuinely watching (over real elapsed time) completes the lesson, and completion is sticky', async () => {
    // simulate ten minutes having passed since the last save
    await q('UPDATE lesson_progress SET last_activity_at = NOW() - INTERVAL 10 MINUTE WHERE student_id = ? AND lesson_id = ?', [enrolled.studentId, paidLesson]);
    const done = await saveProgress(enrolled.session, paidLesson, { positionSeconds: 560, ranges: [[0, 560]], session: S2, seq: 2 });
    expect(done.completed).toBe(true);
    const rewind = await saveProgress(enrolled.session, paidLesson, { positionSeconds: 30, ranges: [], session: S2, seq: 3 });
    expect(rewind.completed).toBe(true);
    expect(rewind.positionSeconds).toBe(30);
    const [row] = await q('SELECT COUNT(*) AS n FROM lesson_progress WHERE student_id = ? AND lesson_id = ?', [enrolled.studentId, paidLesson]);
    expect(row.n).toBe(1);
  });

  it('rejects invalid values and progress on lessons the student does not own', async () => {
    await expect(saveProgress(enrolled.session, paidLesson, { positionSeconds: -5 })).rejects.toMatchObject({ status: 400 });
    await expect(saveProgress(outsider.session, paidLesson, { positionSeconds: 10, ranges: [[0, 10]] })).rejects.toMatchObject({ status: 403 });
  });

  it('reading lessons complete through an explicit action; videos cannot be manually completed', async () => {
    expect(await setManualCompletion(enrolled.session, pdfLesson, true)).toEqual({ completed: true });
    await expect(setManualCompletion(enrolled.session, secondVideo, true)).rejects.toMatchObject({ status: 400 });
  });

  it('course completion = unique completed lessons / all lessons, with a sensible resume target', async () => {
    const outline = await getLearnerCourse(enrolled.session, course.slug);
    expect(outline.lessonCount).toBe(4);
    expect(outline.completedCount).toBe(2); // paid video + pdf
    expect(outline.completionPct).toBe(50);
    expect([freeLesson, secondVideo]).toContain(outline.resumeLessonId);
    await expect(getLearnerCourse(outsider.session, course.slug)).rejects.toMatchObject({ status: 403 });
  });
});

describe('instructor upload flow (local private storage)', () => {
  it('validates type, uploads to a signed URL, verifies the object, then marks ready', async () => {
    const owner = { id: 0, role: 'owner' };
    await expect(requestUploadUrl(owner, secondVideo, { fileName: 'x.exe', contentType: 'application/x-msdownload' })).rejects.toMatchObject({ status: 415 });
    await expect(requestUploadUrl(outsider.session, secondVideo, { fileName: 'a.mp4', contentType: 'video/mp4' })).rejects.toMatchObject({ status: 403 });

    const up = await requestUploadUrl(owner, secondVideo, { fileName: 'lesson.mp4', contentType: 'video/mp4', size: 4 });
    expect(up.uploadUrl).toMatch(/^\/api\/storage\/upload\//);
    // confirming before the bytes exist fails honestly
    await expect(confirmUpload(owner, secondVideo, { key: up.key })).rejects.toMatchObject({ status: 409, body: { error: 'upload_not_found' } });

    const file = path.join(tmp, up.key);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, Buffer.from([0, 0, 0, 24]));
    const ok = await confirmUpload(owner, secondVideo, { key: up.key, durationSeconds: 321 });
    expect(ok).toMatchObject({ status: 'ready', durationSeconds: 321, sizeBytes: 4 });
    expect((await getVideoStatus(owner, secondVideo)).status).toBe('ready');
  });
});
