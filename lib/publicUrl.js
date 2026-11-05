// Public URL for an object under the thumbnails/ prefix (course covers,
// campaign art, avatars). Kept apart from lib/storage so light modules
// (the session loader) can use it without pulling in the S3 SDK.
export function publicThumbnailUrl(key) {
  if (!key || !String(key).startsWith('thumbnails/')) return null;
  if (process.env.STORAGE_PROVIDER === 'local') return `/api/storage/public/${key}`;
  const base = process.env.STORAGE_PUBLIC_BASE_URL;
  return base ? `${base.replace(/\/$/, '')}/${key}` : null;
}
