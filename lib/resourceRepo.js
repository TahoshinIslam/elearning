// ============================================================
// Lesson resources — downloadable files (private storage, signed short-lived
// download URLs) and external links. Listing and downloading both re-check
// lesson access; a resource on a free-preview lesson is downloadable by
// anyone who may watch that preview, everything else needs enrollment.
// ============================================================

import { q } from '@/lib/mysql';
import { HttpError } from '@/lib/repo';
import { logger } from '@/lib/logger';
import { assertLessonAccess, getLessonContext, isCourseManager } from '@/lib/access';
import { getPresignedUploadUrl, getPresignedDownloadUrl, statObject, deleteObject, resourceKey, storageConfigured, ALLOWED_TYPES, MAX_UPLOAD_BYTES } from '@/lib/storage';

function mapResource(r) {
  return {
    id: r.id, title: r.title, kind: r.kind, contentType: r.content_type, sizeBytes: r.size_bytes,
    // External links are shown as-is; a file's key is never sent to the browser.
    url: r.kind === 'link' ? r.url : null, status: r.status, position: r.position
  };
}

// Only http(s) links, no credentials in the URL, sane length.
export function sanitizeLink(raw) {
  let u;
  try { u = new URL(String(raw || '').trim()); } catch { return null; }
  if (!['http:', 'https:'].includes(u.protocol) || u.username || u.password) return null;
  const s = u.toString();
  return s.length <= 500 ? s : null;
}

const cleanTitle = (t) => String(t || '').replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, 180);

export async function listResources(session, lessonId) {
  const { ctx } = await assertLessonAccess(session, lessonId);
  const rows = await q("SELECT * FROM lesson_resources WHERE lesson_id = ? AND status = 'ready' ORDER BY position, id", [ctx.id]);
  return rows.map(mapResource);
}

export async function getResourceDownload(session, resourceId) {
  const [r] = await q('SELECT * FROM lesson_resources WHERE id = ?', [Number(resourceId)]);
  if (!r || r.status !== 'ready') throw new HttpError(404, { error: 'resource_not_found' });
  await assertLessonAccess(session, r.lesson_id);
  if (r.kind === 'link') return { url: r.url, external: true };
  const name = `${cleanTitle(r.title) || 'resource'}${r.storage_key.includes('.') ? '.' + r.storage_key.split('.').pop() : ''}`;
  return { ...(await getPresignedDownloadUrl({ key: r.storage_key, fileName: name, contentType: r.content_type })), external: false };
}

// ---------- staff ----------
async function managedLesson(session, lessonId) {
  const ctx = await getLessonContext(lessonId);
  if (!ctx) throw new HttpError(404, { error: 'lesson_not_found' });
  if (!isCourseManager(session, { instructor_id: ctx.instructor_id })) throw new HttpError(403, { error: 'forbidden' });
  return ctx;
}

export async function listResourcesForStaff(session, lessonId) {
  const ctx = await managedLesson(session, lessonId);
  const rows = await q('SELECT * FROM lesson_resources WHERE lesson_id = ? ORDER BY position, id', [ctx.id]);
  return rows.map(mapResource);
}

export async function addLinkResource(session, lessonId, { title, url }) {
  const ctx = await managedLesson(session, lessonId);
  const link = sanitizeLink(url);
  if (!link) throw new HttpError(400, { error: 'invalid_url' });
  const t = cleanTitle(title);
  if (!t) throw new HttpError(400, { error: 'title_required' });
  const [{ p }] = await q('SELECT COALESCE(MAX(position),0)+1 AS p FROM lesson_resources WHERE lesson_id = ?', [ctx.id]);
  await q("INSERT INTO lesson_resources (lesson_id, title, kind, url, status, position) VALUES (?,?, 'link', ?, 'ready', ?)", [ctx.id, t, link, p]);
  return listResourcesForStaff(session, lessonId);
}

export async function requestResourceUpload(session, lessonId, { title, fileName, contentType, size }) {
  const ctx = await managedLesson(session, lessonId);
  if (!storageConfigured()) throw new HttpError(503, { error: 'storage_not_configured' });
  const type = String(contentType || '').toLowerCase();
  if (!ALLOWED_TYPES.file.includes(type)) throw new HttpError(415, { error: 'unsupported_file_type' });
  if (Number(size) > MAX_UPLOAD_BYTES.file) throw new HttpError(413, { error: 'file_too_large' });
  const t = cleanTitle(title || fileName);
  if (!t) throw new HttpError(400, { error: 'title_required' });
  const key = resourceKey({ courseId: ctx.course_id, lessonId: ctx.id, fileName });
  const [{ p }] = await q('SELECT COALESCE(MAX(position),0)+1 AS p FROM lesson_resources WHERE lesson_id = ?', [ctx.id]);
  const res = await q(
    "INSERT INTO lesson_resources (lesson_id, title, kind, storage_key, content_type, status, position) VALUES (?,?,'file',?,?,'pending',?)",
    [ctx.id, t, key, type, p]
  );
  const { url, method, expiresIn } = await getPresignedUploadUrl({ key, contentType: type, maxBytes: MAX_UPLOAD_BYTES.file });
  return { resourceId: res.insertId, uploadUrl: url, method, expiresIn };
}

export async function confirmResourceUpload(session, lessonId, resourceId) {
  const ctx = await managedLesson(session, lessonId);
  const [r] = await q("SELECT * FROM lesson_resources WHERE id = ? AND lesson_id = ? AND kind = 'file'", [Number(resourceId), ctx.id]);
  if (!r) throw new HttpError(404, { error: 'resource_not_found' });
  const stat = await statObject({ key: r.storage_key });
  if (!stat.exists) {
    logger.warn('resource_confirm_missing_object', { resourceId: r.id });
    throw new HttpError(409, { error: 'upload_not_found' });
  }
  await q("UPDATE lesson_resources SET status = 'ready', size_bytes = ? WHERE id = ?", [stat.size, r.id]);
  return listResourcesForStaff(session, lessonId);
}

export async function deleteResource(session, lessonId, resourceId) {
  const ctx = await managedLesson(session, lessonId);
  const [r] = await q('SELECT * FROM lesson_resources WHERE id = ? AND lesson_id = ?', [Number(resourceId), ctx.id]);
  if (r) {
    await q('DELETE FROM lesson_resources WHERE id = ?', [r.id]);
    if (r.storage_key) await deleteObject({ key: r.storage_key }).catch(() => {});
  }
  return listResourcesForStaff(session, lessonId);
}
