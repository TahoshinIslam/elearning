// ============================================================
// S3-compatible object storage adapter (server-only). Works unchanged for
// either AWS S3 or Cloudflare R2 — R2 speaks the S3 API, so pointing
// STORAGE_ENDPOINT at R2's account endpoint is the only difference.
//
// Videos are never served from a public bucket URL. Every playback URL is
// freshly presigned (short expiry) after a server-side entitlement check —
// see lib/videoRepo.js getPlaybackInfo(). Upload URLs are presigned too, so
// large video files go straight from the instructor's browser to the
// bucket and never pass through this app's own server.
// ============================================================

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const UPLOAD_URL_TTL_SECONDS = 15 * 60;   // instructor has 15 min to complete the upload
const PLAYBACK_URL_TTL_SECONDS = 60 * 60; // signed playback link is valid for 1 hour

function config() {
  const provider = process.env.STORAGE_PROVIDER === 'r2' ? 'r2' : 's3';
  const bucket = process.env.STORAGE_BUCKET;
  const region = process.env.STORAGE_REGION || 'auto';
  const endpoint = process.env.STORAGE_ENDPOINT || undefined; // required for R2, blank for AWS S3
  const accessKeyId = process.env.STORAGE_ACCESS_KEY_ID;
  const secretAccessKey = process.env.STORAGE_SECRET_ACCESS_KEY;
  if (!bucket || !accessKeyId || !secretAccessKey || (provider === 'r2' && !endpoint)) {
    throw new Error(
      'Object storage is not configured. Set STORAGE_PROVIDER, STORAGE_BUCKET, STORAGE_REGION, ' +
      'STORAGE_ACCESS_KEY_ID, STORAGE_SECRET_ACCESS_KEY (+ STORAGE_ENDPOINT for R2) — see .env.example.'
    );
  }
  return { provider, bucket, region, endpoint, accessKeyId, secretAccessKey };
}

const g = globalThis;
function client() {
  if (!g.__LEO_S3__) {
    const { region, endpoint, accessKeyId, secretAccessKey } = config();
    g.__LEO_S3__ = new S3Client({
      region,
      endpoint,
      forcePathStyle: !!endpoint, // R2/most S3-compatible endpoints need path-style addressing
      credentials: { accessKeyId, secretAccessKey }
    });
  }
  return g.__LEO_S3__;
}

export function currentProvider() {
  return config().provider;
}

// Build a stable, collision-resistant object key for a lesson's video.
export function videoKey({ courseId, lessonId, fileName }) {
  const ext = (fileName || '').split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'mp4';
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return `videos/${courseId}/${lessonId}/${unique}.${ext}`;
}

// Course thumbnails live under a separate `thumbnails/` prefix so the
// bucket policy can grant that one prefix public-read while `videos/` stays
// private — see lib/repo.js thumbnailUrl(), which builds a plain public URL
// for these keys instead of a presigned one.
export function imageKey({ courseId, fileName }) {
  const ext = (fileName || '').split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return `thumbnails/${courseId}/${unique}.${ext}`;
}

export async function getPresignedUploadUrl({ key, contentType }) {
  const { bucket } = config();
  const command = new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType || 'application/octet-stream' });
  const url = await getSignedUrl(client(), command, { expiresIn: UPLOAD_URL_TTL_SECONDS });
  return { url, expiresIn: UPLOAD_URL_TTL_SECONDS };
}

export async function getPresignedPlaybackUrl({ key }) {
  const { bucket } = config();
  const command = new GetObjectCommand({ Bucket: bucket, Key: key });
  const url = await getSignedUrl(client(), command, { expiresIn: PLAYBACK_URL_TTL_SECONDS });
  return { url, expiresIn: PLAYBACK_URL_TTL_SECONDS };
}

export async function deleteObject({ key }) {
  const { bucket } = config();
  await client().send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}
