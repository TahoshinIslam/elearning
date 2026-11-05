import 'server-only';
import { q } from '@/lib/mysql';
import { HttpError } from '@/lib/repo';
import { avatarKey, getPresignedUploadUrl, statObject, deleteObject, publicThumbnailUrl, storageConfigured, MAX_UPLOAD_BYTES } from '@/lib/storage';
import { logger } from '@/lib/logger';

// Profile photos: signed direct upload → confirm → swap the user's avatar_key
// and delete the previous object. Each user can only touch keys under their
// own thumbnails/avatars/<id>/ prefix.
const prefix = (userId) => `thumbnails/avatars/${Number(userId)}/`;

export async function startAvatarUpload(userId, { contentType, size, fileName }) {
  if (!storageConfigured()) throw new HttpError(503, { error: 'storage_not_configured' });
  if (size > MAX_UPLOAD_BYTES.avatar) throw new HttpError(413, { error: 'file_too_large' });
  const key = avatarKey({ userId, fileName });
  const { url, method, expiresIn } = await getPresignedUploadUrl({ key, contentType, maxBytes: MAX_UPLOAD_BYTES.avatar });
  return { uploadUrl: url, method, expiresIn, key };
}

export async function confirmAvatar(userId, key) {
  if (!key.startsWith(prefix(userId)) || key.includes('..')) throw new HttpError(409, { error: 'upload_mismatch' });
  const st = await statObject({ key });
  if (!st.exists) throw new HttpError(409, { error: 'upload_not_found' });
  if (st.size > MAX_UPLOAD_BYTES.avatar) {
    await deleteObject({ key }).catch(() => {});
    throw new HttpError(413, { error: 'file_too_large' });
  }
  const [row] = await q('SELECT avatar_key FROM users WHERE id = ?', [userId]);
  await q('UPDATE users SET avatar_key = ? WHERE id = ?', [key, userId]);
  if (row?.avatar_key && row.avatar_key !== key) {
    deleteObject({ key: row.avatar_key }).catch((e) => logger.warn('avatar_cleanup_failed', { key: row.avatar_key, message: e.message }));
  }
  return { avatarUrl: publicThumbnailUrl(key) };
}

export async function removeAvatar(userId) {
  const [row] = await q('SELECT avatar_key FROM users WHERE id = ?', [userId]);
  await q('UPDATE users SET avatar_key = NULL WHERE id = ?', [userId]);
  if (row?.avatar_key) await deleteObject({ key: row.avatar_key }).catch(() => {});
  return { avatarUrl: null };
}
