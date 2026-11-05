// ============================================================
// Object storage adapter (server-only). Three providers behind one API:
//
//   s3 / r2  — S3-compatible bucket. Upload and playback URLs are presigned
//              by the AWS SDK (R2 speaks the S3 API; STORAGE_ENDPOINT is the
//              only difference).
//   local    — files on this server's disk under STORAGE_LOCAL_DIR (never
//              inside /public). Upload and playback URLs are this app's own
//              /api/storage/* routes carrying an HMAC-signed, expiring token
//              (lib/signedUrl.js), so the same "short-lived authorized URL"
//              model applies. Suited to development and single-server
//              self-hosting; use s3/r2 for multi-instance production.
//
// Videos and lesson files are never served from a public URL. Every
// playback/download URL is minted per request after a server-side
// entitlement check (lib/access.js). Only the `thumbnails/` prefix is public.
// ============================================================

import 'server-only';
import fs from 'node:fs';
import path from 'node:path';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { signToken } from '@/lib/signedUrl';

const UPLOAD_URL_TTL_SECONDS = 15 * 60;   // an instructor has 15 min to start the upload
const PLAYBACK_URL_TTL_SECONDS = 10 * 60; // the player renews before expiry (see VideoPlayer)
const DOWNLOAD_URL_TTL_SECONDS = 5 * 60;

export const MAX_UPLOAD_BYTES = {
  video: 4 * 1024 * 1024 * 1024, // 4 GB
  image: 8 * 1024 * 1024,
  file: 200 * 1024 * 1024,
  caption: 2 * 1024 * 1024
};

export const ALLOWED_TYPES = {
  video: ['video/mp4', 'video/webm', 'video/quicktime', 'application/vnd.apple.mpegurl'],
  image: ['image/jpeg', 'image/png', 'image/webp'],
  caption: ['text/vtt'],
  file: [
    'application/pdf', 'application/zip', 'text/plain', 'text/csv',
    'image/jpeg', 'image/png', 'image/webp',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
};

export function currentProvider() {
  const p = process.env.STORAGE_PROVIDER;
  return p === 'r2' ? 'r2' : p === 'local' ? 'local' : 's3';
}

// Is any provider actually usable? Lets the UI show an honest
// "storage not configured" state instead of a generic 500.
export function storageConfigured() {
  if (currentProvider() === 'local') return true;
  const { STORAGE_BUCKET, STORAGE_ACCESS_KEY_ID, STORAGE_SECRET_ACCESS_KEY, STORAGE_ENDPOINT } = process.env;
  if (!STORAGE_BUCKET || !STORAGE_ACCESS_KEY_ID || !STORAGE_SECRET_ACCESS_KEY) return false;
  return currentProvider() !== 'r2' || !!STORAGE_ENDPOINT;
}

function s3config() {
  const provider = currentProvider();
  const bucket = process.env.STORAGE_BUCKET;
  const region = process.env.STORAGE_REGION || 'auto';
  const endpoint = process.env.STORAGE_ENDPOINT || undefined;
  const accessKeyId = process.env.STORAGE_ACCESS_KEY_ID;
  const secretAccessKey = process.env.STORAGE_SECRET_ACCESS_KEY;
  if (!bucket || !accessKeyId || !secretAccessKey || (provider === 'r2' && !endpoint)) {
    throw new Error(
      'Object storage is not configured. Set STORAGE_PROVIDER, STORAGE_BUCKET, STORAGE_REGION, ' +
      'STORAGE_ACCESS_KEY_ID, STORAGE_SECRET_ACCESS_KEY (+ STORAGE_ENDPOINT for R2), or ' +
      'STORAGE_PROVIDER=local for on-disk storage — see .env.example.'
    );
  }
  return { provider, bucket, region, endpoint, accessKeyId, secretAccessKey };
}

const g = globalThis;
function client() {
  if (!g.__LEO_S3__) {
    const { region, endpoint, accessKeyId, secretAccessKey } = s3config();
    g.__LEO_S3__ = new S3Client({
      region,
      endpoint,
      forcePathStyle: !!endpoint,
      credentials: { accessKeyId, secretAccessKey }
    });
  }
  return g.__LEO_S3__;
}

// ---------- local provider ----------
export function localRoot() {
  return path.resolve(process.env.STORAGE_LOCAL_DIR || path.join(process.cwd(), 'storage', 'private'));
}

// Resolve a storage key to an absolute path, refusing anything that would
// escape the storage root (keys are server-generated, but never trust that).
export function localPathForKey(key) {
  if (typeof key !== 'string' || !/^[a-z]+\/[A-Za-z0-9/_.-]+$/.test(key) || key.includes('..')) {
    throw new Error('invalid_storage_key');
  }
  const root = localRoot();
  const full = path.resolve(root, key);
  if (!full.startsWith(root + path.sep)) throw new Error('invalid_storage_key');
  return full;
}

function appUrl(p) {
  // Relative URLs keep local media on the same origin as the page.
  return p;
}

// ---------- keys ----------
function ext(fileName, fallback) {
  const e = (fileName || '').split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '');
  return e && e.length <= 5 ? e : fallback;
}
const unique = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export function videoKey({ courseId, lessonId, fileName }) {
  return `videos/${Number(courseId)}/${Number(lessonId)}/${unique()}.${ext(fileName, 'mp4')}`;
}
export function imageKey({ courseId, fileName }) {
  return `thumbnails/${Number(courseId)}/${unique()}.${ext(fileName, 'jpg')}`;
}
export function resourceKey({ courseId, lessonId, fileName }) {
  return `resources/${Number(courseId)}/${Number(lessonId)}/${unique()}.${ext(fileName, 'bin')}`;
}
export function captionKey({ courseId, lessonId, lang }) {
  return `captions/${Number(courseId)}/${Number(lessonId)}/${String(lang).replace(/[^a-z-]/gi, '').slice(0, 12) || 'xx'}-${unique()}.vtt`;
}

// ---------- signed URLs ----------
export async function getPresignedUploadUrl({ key, contentType, maxBytes }) {
  if (currentProvider() === 'local') {
    const token = signToken({ k: key, op: 'put', ct: contentType || 'application/octet-stream', max: maxBytes || MAX_UPLOAD_BYTES.file }, UPLOAD_URL_TTL_SECONDS);
    return { url: appUrl(`/api/storage/upload/${token}`), expiresIn: UPLOAD_URL_TTL_SECONDS, method: 'PUT' };
  }
  const { bucket } = s3config();
  const command = new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType || 'application/octet-stream' });
  const url = await getSignedUrl(client(), command, { expiresIn: UPLOAD_URL_TTL_SECONDS });
  return { url, expiresIn: UPLOAD_URL_TTL_SECONDS, method: 'PUT' };
}

export async function getPresignedPlaybackUrl({ key, contentType }) {
  if (currentProvider() === 'local') {
    const token = signToken({ k: key, op: 'get', ct: contentType || null }, PLAYBACK_URL_TTL_SECONDS);
    return { url: appUrl(`/api/storage/object/${token}`), expiresIn: PLAYBACK_URL_TTL_SECONDS };
  }
  const { bucket } = s3config();
  const command = new GetObjectCommand({ Bucket: bucket, Key: key });
  const url = await getSignedUrl(client(), command, { expiresIn: PLAYBACK_URL_TTL_SECONDS });
  return { url, expiresIn: PLAYBACK_URL_TTL_SECONDS };
}

export async function getPresignedDownloadUrl({ key, fileName, contentType }) {
  const safeName = String(fileName || 'download').replace(/[^\w.\- ()ঀ-৿]/g, '_').slice(0, 120);
  if (currentProvider() === 'local') {
    const token = signToken({ k: key, op: 'get', ct: contentType || null, dl: safeName }, DOWNLOAD_URL_TTL_SECONDS);
    return { url: appUrl(`/api/storage/object/${token}`), expiresIn: DOWNLOAD_URL_TTL_SECONDS };
  }
  const { bucket } = s3config();
  const command = new GetObjectCommand({
    Bucket: bucket, Key: key,
    ResponseContentDisposition: `attachment; filename="${safeName}"`
  });
  const url = await getSignedUrl(client(), command, { expiresIn: DOWNLOAD_URL_TTL_SECONDS });
  return { url, expiresIn: DOWNLOAD_URL_TTL_SECONDS };
}

// Public thumbnail URL (only the thumbnails/ prefix is ever public).
export function publicThumbnailUrl(key) {
  if (!key || !String(key).startsWith('thumbnails/')) return null;
  if (currentProvider() === 'local') return `/api/storage/public/${key}`;
  const base = process.env.STORAGE_PUBLIC_BASE_URL;
  return base ? `${base.replace(/\/$/, '')}/${key}` : null;
}

// Confirm an uploaded object really exists before marking an asset ready.
// → { exists, size }
export async function statObject({ key }) {
  if (currentProvider() === 'local') {
    try {
      const st = await fs.promises.stat(localPathForKey(key));
      return { exists: st.isFile(), size: st.size };
    } catch {
      return { exists: false, size: 0 };
    }
  }
  try {
    const { bucket } = s3config();
    const head = await client().send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return { exists: true, size: Number(head.ContentLength) || 0 };
  } catch {
    return { exists: false, size: 0 };
  }
}

export async function deleteObject({ key }) {
  if (currentProvider() === 'local') {
    await fs.promises.rm(localPathForKey(key), { force: true });
    return;
  }
  const { bucket } = s3config();
  await client().send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}
