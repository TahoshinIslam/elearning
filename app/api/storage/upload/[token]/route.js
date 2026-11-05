import fs from 'node:fs';
import path from 'node:path';
import { verifyToken } from '@/lib/signedUrl';
import { currentProvider, localPathForKey } from '@/lib/storage';
import { logger } from '@/lib/logger';
import { fileTypeFromFile } from 'file-type';

// Text formats (captions, csv, txt) have no signature; everything else must
// sniff as the declared type (Office files are zip containers; .mov sniffs
// as video/quicktime).
const TEXTUAL = /^(text\/|application\/json)/;
const ALIASES = {
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['application/zip', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['application/zip', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['application/zip', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  'application/zip': ['application/zip', 'application/x-zip-compressed'],
  'video/mp4': ['video/mp4', 'video/x-m4v', 'video/quicktime'],
  'video/quicktime': ['video/quicktime', 'video/mp4']
};
async function contentMatches(path, declared) {
  if (!declared || declared === 'application/octet-stream' || TEXTUAL.test(declared)) return true;
  const sniff = await fileTypeFromFile(path).catch(() => null);
  if (!sniff) return false;
  return (ALIASES[declared] || [declared]).includes(sniff.mime);
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Local-provider upload target — the equivalent of an S3 presigned PUT. The
// token (minted by a staff-only route) pins the exact object key, the
// declared content type and a byte ceiling; the body is streamed to a temp
// file and only renamed into place once fully received.
export async function PUT(request, props) {
  const params = await props.params;
  if (currentProvider() !== 'local') return new Response('Not found', { status: 404 });
  const payload = verifyToken(params.token);
  if (!payload || payload.op !== 'put' || !payload.k) return Response.json({ error: 'upload_link_expired' }, { status: 403 });

  const declared = (request.headers.get('content-type') || '').split(';')[0].trim();
  if (payload.ct && declared && declared !== payload.ct) {
    return Response.json({ error: 'content_type_mismatch' }, { status: 415 });
  }
  const max = Number(payload.max) || 0;
  const len = Number(request.headers.get('content-length') || 0);
  if (max && len > max) return Response.json({ error: 'file_too_large' }, { status: 413 });
  if (!request.body) return Response.json({ error: 'empty_body' }, { status: 400 });

  let file;
  try { file = localPathForKey(payload.k); } catch { return Response.json({ error: 'invalid_key' }, { status: 400 }); }
  await fs.promises.mkdir(path.dirname(file), { recursive: true });
  const tmp = `${file}.part-${process.pid}-${Date.now()}`;

  let written = 0;
  const out = fs.createWriteStream(tmp);
  try {
    const reader = request.body.getReader();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      written += value.byteLength;
      if (max && written > max) throw Object.assign(new Error('file_too_large'), { status: 413 });
      if (!out.write(value)) await new Promise((r) => out.once('drain', r));
    }
    await new Promise((resolve, reject) => out.end((err) => (err ? reject(err) : resolve())));
    if (!written) throw Object.assign(new Error('empty_body'), { status: 400 });
    // The declared Content-Type is only a claim: check the file's real
    // signature (magic bytes) before it goes live.
    if (!(await contentMatches(tmp, payload.ct))) throw Object.assign(new Error('content_mismatch'), { status: 415 });
    await fs.promises.rename(tmp, file);
  } catch (e) {
    out.destroy();
    await fs.promises.rm(tmp, { force: true });
    logger.warn('local_upload_failed', { key: payload.k, message: e.message });
    return Response.json({ error: e.status ? e.message : 'upload_failed' }, { status: e.status || 500 });
  }
  return Response.json({ ok: true, size: written });
}
