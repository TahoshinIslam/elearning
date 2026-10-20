// Serving helpers for the local storage provider (lib/storage.js). Streams a
// file from the private storage root with HTTP Range support so <video> can
// seek without downloading the whole file. Server-only.
import fs from 'node:fs';
import path from 'node:path';
import { Readable } from 'node:stream';

const TYPES = {
  mp4: 'video/mp4', m4v: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime',
  vtt: 'text/vtt; charset=utf-8', pdf: 'application/pdf', zip: 'application/zip',
  txt: 'text/plain; charset=utf-8', csv: 'text/csv; charset=utf-8',
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
};

export function contentTypeFor(file, hint) {
  if (hint && /^[\w.+-]+\/[\w.+-]+/.test(hint)) return hint;
  return TYPES[path.extname(file).slice(1).toLowerCase()] || 'application/octet-stream';
}

// → Response. `headers` are merged in (cache policy, disposition, ...).
export async function streamFile(request, file, { contentType, headers = {} } = {}) {
  let st;
  try {
    st = await fs.promises.stat(file);
    if (!st.isFile()) throw new Error('not_file');
  } catch {
    return new Response('Not found', { status: 404 });
  }
  const size = st.size;
  const base = {
    'Content-Type': contentTypeFor(file, contentType),
    'Accept-Ranges': 'bytes',
    'X-Content-Type-Options': 'nosniff',
    ...headers
  };

  const range = request.headers.get('range');
  if (range) {
    const m = /^bytes=(\d*)-(\d*)$/.exec(range.trim());
    if (!m || (m[1] === '' && m[2] === '')) {
      return new Response(null, { status: 416, headers: { ...base, 'Content-Range': `bytes */${size}` } });
    }
    let start, end;
    if (m[1] === '') { // suffix range: last N bytes
      start = Math.max(size - Number(m[2]), 0);
      end = size - 1;
    } else {
      start = Number(m[1]);
      end = m[2] === '' ? size - 1 : Math.min(Number(m[2]), size - 1);
    }
    if (start >= size || start > end) {
      return new Response(null, { status: 416, headers: { ...base, 'Content-Range': `bytes */${size}` } });
    }
    const stream = Readable.toWeb(fs.createReadStream(file, { start, end }));
    return new Response(stream, {
      status: 206,
      headers: { ...base, 'Content-Range': `bytes ${start}-${end}/${size}`, 'Content-Length': String(end - start + 1) }
    });
  }
  const stream = Readable.toWeb(fs.createReadStream(file));
  return new Response(stream, { status: 200, headers: { ...base, 'Content-Length': String(size) } });
}
