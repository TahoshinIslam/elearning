// ============================================================
// Lesson video: playback authorization, watch progress, and the instructor
// upload flow. The only path that hands out a playback URL — always after
// lib/access.js has re-derived entitlement from the session + DB.
// ============================================================

import { q, withTransaction } from '@/lib/mysql';
import { HttpError } from '@/lib/repo';
import { logger } from '@/lib/logger';
import { assertLessonAccess, assertCourseManager, getLessonContext, hasActiveEnrollment, isCourseManager } from '@/lib/access';
import {
  getPresignedUploadUrl, getPresignedPlaybackUrl, statObject, deleteObject,
  videoKey, captionKey, currentProvider, storageConfigured, ALLOWED_TYPES, MAX_UPLOAD_BYTES
} from '@/lib/storage';
import { mergeWithAllowance, gainAllowance, coverage, isComplete, resumePosition, normalizeRanges } from '@/lib/watchRanges';

const MAX_DURATION_SECONDS = 24 * 3600;

function parseRanges(text) {
  if (!text) return [];
  try { return JSON.parse(text); } catch { return []; }
}

function progressView(row, durationSeconds) {
  if (!row) return { positionSeconds: 0, coveredSeconds: 0, completed: false, resumeAt: 0 };
  return {
    positionSeconds: row.position_seconds || 0,
    coveredSeconds: row.covered_seconds || 0,
    completed: !!row.completed,
    resumeAt: resumePosition(row.position_seconds, durationSeconds)
  };
}

// GET playback info → signed URL (+ captions) and, for an enrolled
// student, their saved progress. A preview viewer gets the URL only.
export async function getPlaybackInfo(session, lessonId) {
  const { ctx, access } = await assertLessonAccess(session, lessonId);
  if (ctx.type !== 'video') throw new HttpError(400, { error: 'not_a_video_lesson' });

  const [asset] = await q('SELECT * FROM video_assets WHERE lesson_id = ?', [ctx.id]);
  if (!asset || asset.status !== 'ready') {
    throw new HttpError(404, { error: 'video_not_ready', status: asset?.status || 'missing' });
  }

  let url, expiresIn;
  try {
    ({ url, expiresIn } = await getPresignedPlaybackUrl({ key: asset.storage_key, contentType: asset.content_type }));
  } catch (e) {
    logger.error('playback_url_failed', { lessonId: ctx.id, provider: asset.provider, message: e.message });
    throw new HttpError(503, { error: 'storage_unavailable' });
  }

  const captionRows = await q('SELECT lang, label, storage_key FROM lesson_captions WHERE lesson_id = ? ORDER BY id', [ctx.id]);
  const captions = [];
  for (const c of captionRows) {
    const signed = await getPresignedPlaybackUrl({ key: c.storage_key, contentType: 'text/vtt' });
    captions.push({ lang: c.lang, label: c.label, url: signed.url });
  }

  let progress = null;
  if (access.via === 'enrollment') {
    // Touch the row: last_activity_at is the anchor the next progress save
    // measures elapsed wall time from (see saveProgress' gain allowance).
    await q(
      `INSERT INTO lesson_progress (student_id, lesson_id) VALUES (?,?)
       ON DUPLICATE KEY UPDATE last_activity_at = NOW()`,
      [session.studentId, ctx.id]
    );
    const [row] = await q('SELECT * FROM lesson_progress WHERE student_id = ? AND lesson_id = ?', [session.studentId, ctx.id]);
    progress = progressView(row, asset.duration_seconds);
  }

  return {
    url, expiresIn,
    durationSeconds: asset.duration_seconds,
    captions,
    progress,
    access: access.via,
    lesson: { id: ctx.id, title: ctx.title, courseId: ctx.course_id, free: !!ctx.is_free }
  };
}

// Save watch progress. Body: { positionSeconds, ranges: [[s,e],...],
// session, seq, durationSeconds? }. `completed` is never accepted from the
// client — it's derived from the merged played ranges vs. the real duration.
export async function saveProgress(session, lessonId, body = {}) {
  if (!session?.studentId) throw new HttpError(403, { error: 'no_student_profile' });
  const ctx = await getLessonContext(lessonId);
  if (!ctx) throw new HttpError(404, { error: 'lesson_not_found' });
  if (ctx.type !== 'video') throw new HttpError(400, { error: 'not_a_video_lesson' });
  if (!(await hasActiveEnrollment(session.studentId, ctx.course_id))) throw new HttpError(403, { error: 'not_enrolled' });

  const position = Number(body.positionSeconds);
  if (!Number.isFinite(position) || position < 0 || position > MAX_DURATION_SECONDS) throw new HttpError(400, { error: 'invalid_position' });
  const playSession = typeof body.session === 'string' && /^[A-Za-z0-9_-]{6,40}$/.test(body.session) ? body.session : null;
  const seq = Number.isSafeInteger(Number(body.seq)) && Number(body.seq) >= 0 ? Number(body.seq) : 0;

  const [asset] = await q('SELECT duration_seconds FROM video_assets WHERE lesson_id = ?', [ctx.id]);
  let duration = asset?.duration_seconds || null;
  const reported = Number(body.durationSeconds);
  if (!duration && Number.isFinite(reported) && reported > 0 && reported <= MAX_DURATION_SECONDS) {
    // First learner to load metadata teaches us the real duration; it's
    // only ever written once (NULL → value), never overwritten by a client.
    duration = Math.round(reported);
    await q('UPDATE video_assets SET duration_seconds = ? WHERE lesson_id = ? AND duration_seconds IS NULL', [duration, ctx.id]);
    const [fresh] = await q('SELECT duration_seconds FROM video_assets WHERE lesson_id = ?', [ctx.id]);
    duration = fresh?.duration_seconds || duration;
  }

  const result = await withTransaction(async (tx) => {
    await tx('INSERT IGNORE INTO lesson_progress (student_id, lesson_id) VALUES (?,?)', [session.studentId, ctx.id]);
    const [row] = await tx(
      `SELECT *, TIMESTAMPDIFF(SECOND, last_activity_at, NOW()) AS elapsed
       FROM lesson_progress WHERE student_id = ? AND lesson_id = ? FOR UPDATE`,
      [session.studentId, ctx.id]
    );

    const stored = normalizeRanges(parseRanges(row.watched_ranges), duration);
    const { ranges, trimmed } = mergeWithAllowance(stored, body.ranges, gainAllowance(Number(row.elapsed)), duration);
    const covered = Math.round(coverage(ranges));
    const nowComplete = !!row.completed || isComplete(covered, duration);

    // Position: newer save from the same playback session, or any save
    // from a different session (another tab/device), wins.
    const sameSession = playSession && row.position_session === playSession;
    const acceptPosition = !sameSession || seq > Number(row.position_client_ms || 0);
    const newPosition = acceptPosition ? Math.round(duration ? Math.min(position, duration) : position) : row.position_seconds;

    await tx(
      `UPDATE lesson_progress SET
         watched_ranges = ?, covered_seconds = ?,
         position_seconds = ?, watched_seconds = ?,
         position_session = ?, position_client_ms = ?,
         duration_seconds = COALESCE(?, duration_seconds),
         completed_at = IF(completed = 0 AND ? = 1, NOW(), completed_at),
         completion_source = IF(completed = 0 AND ? = 1, 'watch', completion_source),
         completed = ?,
         last_activity_at = NOW()
       WHERE id = ?`,
      // (MySQL applies SET assignments left to right, so completed_at and
      // completion_source must read the OLD `completed` before it changes.)
      [
        JSON.stringify(ranges), covered,
        newPosition, newPosition,
        acceptPosition ? playSession : row.position_session, acceptPosition ? seq : row.position_client_ms,
        duration, nowComplete ? 1 : 0, nowComplete ? 1 : 0, nowComplete ? 1 : 0, row.id
      ]
    );
    await tx(
      "UPDATE enrollments SET last_lesson_id = ?, last_accessed_at = NOW() WHERE student_id = ? AND course_id = ? AND status = 'active'",
      [ctx.id, session.studentId, ctx.course_id]
    );
    return { positionSeconds: newPosition, coveredSeconds: covered, completed: nowComplete, durationSeconds: duration, trimmed, stale: !acceptPosition };
  });
  return result;
}

// Explicit, accessible completion for lessons without watch tracking
// (reading/PDF lessons). Quizzes and assignments complete through their
// own submissions; videos through actually watching.
const MANUAL_TYPES = ['pdf'];
export async function setManualCompletion(session, lessonId, completed) {
  if (!session?.studentId) throw new HttpError(403, { error: 'no_student_profile' });
  const ctx = await getLessonContext(lessonId);
  if (!ctx) throw new HttpError(404, { error: 'lesson_not_found' });
  if (!MANUAL_TYPES.includes(ctx.type)) throw new HttpError(400, { error: 'completion_is_automatic' });
  if (!(await hasActiveEnrollment(session.studentId, ctx.course_id))) throw new HttpError(403, { error: 'not_enrolled' });

  if (completed) {
    await q(
      `INSERT INTO lesson_progress (student_id, lesson_id, completed, completed_at, completion_source) VALUES (?,?,1,NOW(),'manual')
       ON DUPLICATE KEY UPDATE completed_at = IF(completed = 0, NOW(), completed_at), completion_source = IF(completed = 0, 'manual', completion_source), completed = 1, last_activity_at = NOW()`,
      [session.studentId, ctx.id]
    );
  } else {
    // Only a manual completion can be undone manually.
    await q(
      "UPDATE lesson_progress SET completed = 0, completed_at = NULL, completion_source = NULL WHERE student_id = ? AND lesson_id = ? AND completion_source = 'manual'",
      [session.studentId, ctx.id]
    );
  }
  await q(
    "UPDATE enrollments SET last_lesson_id = ?, last_accessed_at = NOW() WHERE student_id = ? AND course_id = ? AND status = 'active'",
    [ctx.id, session.studentId, ctx.course_id]
  );
  const [row] = await q('SELECT completed FROM lesson_progress WHERE student_id = ? AND lesson_id = ?', [session.studentId, ctx.id]);
  return { completed: !!row?.completed };
}

// Record that a quiz/assignment lesson was done (called by those flows).
export async function markLessonDone(studentId, lessonId, source) {
  if (!studentId || !lessonId) return;
  await q(
    `INSERT INTO lesson_progress (student_id, lesson_id, completed, completed_at, completion_source) VALUES (?,?,1,NOW(),?)
     ON DUPLICATE KEY UPDATE completed_at = IF(completed = 0, NOW(), completed_at), completion_source = IF(completed = 0, VALUES(completion_source), completion_source), completed = 1`,
    [studentId, lessonId, source]
  ).catch((e) => logger.error('mark_lesson_done_failed', { studentId, lessonId, message: e.message }));
}

// Remember the lesson a learner opened (resume target) without a progress save.
export async function touchLesson(session, ctx) {
  if (!session?.studentId || !ctx) return;
  await q(
    "UPDATE enrollments SET last_lesson_id = ?, last_accessed_at = NOW() WHERE student_id = ? AND course_id = ? AND status = 'active'",
    [ctx.id, session.studentId, ctx.course_id]
  );
}

// ---------- instructor upload flow ----------
export async function requestUploadUrl(session, lessonId, { fileName, contentType, size } = {}) {
  const ctx = await getLessonContext(lessonId);
  if (!ctx) throw new HttpError(404, { error: 'lesson_not_found' });
  if (!isCourseManager(session, { instructor_id: ctx.instructor_id })) throw new HttpError(403, { error: 'forbidden' });
  if (ctx.type !== 'video') throw new HttpError(400, { error: 'not_a_video_lesson' });
  if (!storageConfigured()) throw new HttpError(503, { error: 'storage_not_configured' });
  const type = String(contentType || '').toLowerCase();
  if (!ALLOWED_TYPES.video.includes(type)) throw new HttpError(415, { error: 'unsupported_video_type', allowed: ALLOWED_TYPES.video });
  if (Number(size) > MAX_UPLOAD_BYTES.video) throw new HttpError(413, { error: 'file_too_large' });

  const key = videoKey({ courseId: ctx.course_id, lessonId: ctx.id, fileName });
  const { url, expiresIn, method } = await getPresignedUploadUrl({ key, contentType: type, maxBytes: MAX_UPLOAD_BYTES.video });

  // The previous ready video (if any) keeps playing until the new upload is
  // confirmed — the key only switches over in confirmUpload.
  const [existing] = await q('SELECT status FROM video_assets WHERE lesson_id = ?', [ctx.id]);
  if (!existing) {
    await q(
      "INSERT INTO video_assets (lesson_id, provider, storage_key, content_type, status) VALUES (?,?,?,?,'pending')",
      [ctx.id, currentProvider(), key, type]
    );
  }
  return { uploadUrl: url, method, expiresIn, key };
}

export async function confirmUpload(session, lessonId, { key, durationSeconds } = {}) {
  const ctx = await getLessonContext(lessonId);
  if (!ctx) throw new HttpError(404, { error: 'lesson_not_found' });
  if (!isCourseManager(session, { instructor_id: ctx.instructor_id })) throw new HttpError(403, { error: 'forbidden' });
  const expectedPrefix = `videos/${ctx.course_id}/${ctx.id}/`;
  if (typeof key !== 'string' || !key.startsWith(expectedPrefix)) throw new HttpError(409, { error: 'upload_mismatch' });

  const stat = await statObject({ key });
  if (!stat.exists || !stat.size) {
    await q("UPDATE video_assets SET status = 'failed', error_message = 'upload_not_found' WHERE lesson_id = ? AND status <> 'ready'", [ctx.id]);
    logger.warn('video_confirm_missing_object', { lessonId: ctx.id, key });
    throw new HttpError(409, { error: 'upload_not_found' });
  }
  const dur = Number(durationSeconds) > 0 && Number(durationSeconds) <= MAX_DURATION_SECONDS ? Math.round(Number(durationSeconds)) : null;
  const [old] = await q('SELECT storage_key FROM video_assets WHERE lesson_id = ?', [ctx.id]);
  const ext = key.split('.').pop();
  const contentType = { mp4: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime', m3u8: 'application/vnd.apple.mpegurl' }[ext] || null;

  await q(
    `INSERT INTO video_assets (lesson_id, provider, storage_key, content_type, size_bytes, duration_seconds, status)
     VALUES (?,?,?,?,?,?,'ready')
     ON DUPLICATE KEY UPDATE provider = VALUES(provider), storage_key = VALUES(storage_key), content_type = VALUES(content_type),
       size_bytes = VALUES(size_bytes), duration_seconds = VALUES(duration_seconds), status = 'ready', error_message = NULL`,
    [ctx.id, currentProvider(), key, contentType, stat.size, dur]
  );
  if (dur) await q('UPDATE lessons SET duration_seconds = ? WHERE id = ?', [dur, ctx.id]);
  if (old?.storage_key && old.storage_key !== key) {
    await deleteObject({ key: old.storage_key }).catch((e) => logger.warn('old_video_delete_failed', { lessonId: ctx.id, message: e.message }));
  }
  return { ok: true, status: 'ready', durationSeconds: dur, sizeBytes: stat.size };
}

export async function reportUploadFailure(session, lessonId, reason) {
  const ctx = await getLessonContext(lessonId);
  if (!ctx) throw new HttpError(404, { error: 'lesson_not_found' });
  if (!isCourseManager(session, { instructor_id: ctx.instructor_id })) throw new HttpError(403, { error: 'forbidden' });
  await q("UPDATE video_assets SET status = 'failed', error_message = ? WHERE lesson_id = ? AND status <> 'ready'",
    [String(reason || 'upload_failed').slice(0, 250), ctx.id]);
  return { ok: true };
}

export async function removeVideo(session, lessonId) {
  const ctx = await getLessonContext(lessonId);
  if (!ctx) throw new HttpError(404, { error: 'lesson_not_found' });
  if (!isCourseManager(session, { instructor_id: ctx.instructor_id })) throw new HttpError(403, { error: 'forbidden' });
  const [asset] = await q('SELECT storage_key FROM video_assets WHERE lesson_id = ?', [ctx.id]);
  if (!asset) return { ok: true };
  if (ctx.course_published) {
    // A live course must not suddenly reference a missing video.
    throw new HttpError(409, { error: 'unpublish_first' });
  }
  await q('DELETE FROM video_assets WHERE lesson_id = ?', [ctx.id]);
  await deleteObject({ key: asset.storage_key }).catch((e) => logger.warn('video_delete_failed', { lessonId: ctx.id, message: e.message }));
  return { ok: true };
}

// Staff view of one lesson's media status (admin course builder).
export async function getVideoStatus(session, lessonId) {
  const ctx = await getLessonContext(lessonId);
  if (!ctx) throw new HttpError(404, { error: 'lesson_not_found' });
  if (!isCourseManager(session, { instructor_id: ctx.instructor_id })) throw new HttpError(403, { error: 'forbidden' });
  const [asset] = await q('SELECT status, duration_seconds, size_bytes, error_message, updated_at FROM video_assets WHERE lesson_id = ?', [ctx.id]);
  const captions = await q('SELECT id, lang, label FROM lesson_captions WHERE lesson_id = ? ORDER BY id', [ctx.id]);
  return {
    status: asset?.status || 'missing', durationSeconds: asset?.duration_seconds ?? null, sizeBytes: asset?.size_bytes ?? null,
    error: asset?.error_message || null, updatedAt: asset?.updated_at || null, captions, storageConfigured: storageConfigured()
  };
}

// ---------- captions (WebVTT) ----------
export async function requestCaptionUpload(session, lessonId, { lang, label }) {
  const ctx = await getLessonContext(lessonId);
  if (!ctx) throw new HttpError(404, { error: 'lesson_not_found' });
  if (!isCourseManager(session, { instructor_id: ctx.instructor_id })) throw new HttpError(403, { error: 'forbidden' });
  if (ctx.type !== 'video') throw new HttpError(400, { error: 'not_a_video_lesson' });
  const code = String(lang || '').trim().toLowerCase();
  if (!/^[a-z]{2,3}(-[a-z0-9]{2,8})?$/.test(code)) throw new HttpError(400, { error: 'invalid_lang' });
  const key = captionKey({ courseId: ctx.course_id, lessonId: ctx.id, lang: code });
  const { url, method, expiresIn } = await getPresignedUploadUrl({ key, contentType: 'text/vtt', maxBytes: MAX_UPLOAD_BYTES.caption });
  return { uploadUrl: url, method, expiresIn, key, lang: code, label: String(label || code).trim().slice(0, 60) };
}

export async function confirmCaption(session, lessonId, { key, lang, label }) {
  const ctx = await getLessonContext(lessonId);
  if (!ctx) throw new HttpError(404, { error: 'lesson_not_found' });
  if (!isCourseManager(session, { instructor_id: ctx.instructor_id })) throw new HttpError(403, { error: 'forbidden' });
  if (typeof key !== 'string' || !key.startsWith(`captions/${ctx.course_id}/${ctx.id}/`)) throw new HttpError(409, { error: 'upload_mismatch' });
  const stat = await statObject({ key });
  if (!stat.exists) throw new HttpError(409, { error: 'upload_not_found' });
  const code = String(lang || '').trim().toLowerCase();
  const [old] = await q('SELECT storage_key FROM lesson_captions WHERE lesson_id = ? AND lang = ?', [ctx.id, code]);
  await q(
    `INSERT INTO lesson_captions (lesson_id, lang, label, storage_key) VALUES (?,?,?,?)
     ON DUPLICATE KEY UPDATE label = VALUES(label), storage_key = VALUES(storage_key)`,
    [ctx.id, code, String(label || code).slice(0, 60), key]
  );
  if (old?.storage_key && old.storage_key !== key) await deleteObject({ key: old.storage_key }).catch(() => {});
  return getVideoStatus(session, lessonId);
}

export async function deleteCaption(session, lessonId, captionId) {
  const ctx = await getLessonContext(lessonId);
  if (!ctx) throw new HttpError(404, { error: 'lesson_not_found' });
  if (!isCourseManager(session, { instructor_id: ctx.instructor_id })) throw new HttpError(403, { error: 'forbidden' });
  const [row] = await q('SELECT storage_key FROM lesson_captions WHERE id = ? AND lesson_id = ?', [captionId, ctx.id]);
  if (row) {
    await q('DELETE FROM lesson_captions WHERE id = ?', [captionId]);
    await deleteObject({ key: row.storage_key }).catch(() => {});
  }
  return getVideoStatus(session, lessonId);
}

export { assertCourseManager };
