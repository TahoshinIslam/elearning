import { NextResponse } from 'next/server';
import { errResponse, HttpError } from '@/lib/repo';
import { requireStaffSection } from '@/lib/auth';
import { getPresignedUploadUrl, statObject, storageConfigured, publicThumbnailUrl, MAX_UPLOAD_BYTES, ALLOWED_TYPES } from '@/lib/storage';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// POST { contentType, size, fileName } → signed upload URL for an article cover
// PUT  { key }                         → confirm it exists → { key, url }
export async function POST(request) {
  try {
    await requireStaffSection('blog', 'manage');
    if (!storageConfigured()) throw new HttpError(503, { error: 'storage_not_configured' });
    const { contentType, size, fileName } = await request.json();
    if (!ALLOWED_TYPES.image.includes(contentType)) throw new HttpError(415, { error: 'unsupported_type' });
    if (!(Number(size) > 0) || Number(size) > MAX_UPLOAD_BYTES.image) throw new HttpError(413, { error: 'file_too_large' });
    const ext = (String(fileName || '').split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 5) || 'jpg';
    const key = `thumbnails/blog/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { url, method } = await getPresignedUploadUrl({ key, contentType, maxBytes: MAX_UPLOAD_BYTES.image });
    return NextResponse.json({ uploadUrl: url, method, key });
  } catch (e) { return errResponse(e); }
}

export async function PUT(request) {
  try {
    await requireStaffSection('blog', 'manage');
    const { key } = await request.json();
    if (typeof key !== 'string' || !/^thumbnails\/blog\/[\w.-]+$/.test(key)) throw new HttpError(400, { error: 'invalid_key' });
    if (!(await statObject({ key })).exists) throw new HttpError(409, { error: 'upload_not_found' });
    return NextResponse.json({ key, url: publicThumbnailUrl(key) });
  } catch (e) { return errResponse(e); }
}
