// Browser-side helpers for signed uploads (S3/R2 presigned PUT or the local
// provider's /api/storage/upload/<token>). XHR so we can report progress.
// `signal` (an AbortSignal) cancels an in-flight upload.
export function putFile(url, file, contentType, onProgress, signal) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    if (signal) {
      if (signal.aborted) return reject(Object.assign(new Error('upload_cancelled'), { cancelled: true }));
      signal.addEventListener('abort', () => xhr.abort(), { once: true });
    }
    xhr.onabort = () => reject(Object.assign(new Error('upload_cancelled'), { cancelled: true }));
    xhr.open('PUT', url);
    xhr.setRequestHeader('Content-Type', contentType);
    xhr.upload.onprogress = (e) => { if (e.lengthComputable) onProgress?.(Math.round((e.loaded / e.total) * 100)); };
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`upload_http_${xhr.status}`)));
    xhr.onerror = () => reject(new Error('upload_network'));
    xhr.send(file);
  });
}

// Duration in whole seconds, or null. MediaRecorder WebM files report
// Infinity until the browser is forced to scan to the end.
export function readDuration(file) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const v = document.createElement('video');
    let done = false;
    const finish = (d) => { if (done) return; done = true; URL.revokeObjectURL(url); resolve(Number.isFinite(d) && d > 0 ? Math.round(d) : null); };
    v.preload = 'metadata';
    v.muted = true;
    v.onloadedmetadata = () => {
      if (Number.isFinite(v.duration)) return finish(v.duration);
      v.ondurationchange = () => { if (Number.isFinite(v.duration)) finish(v.duration); };
      v.currentTime = Number.MAX_SAFE_INTEGER;
    };
    v.onerror = () => finish(null);
    setTimeout(() => finish(null), 15000);
    v.src = url;
  });
}

export async function api(url, { method = 'GET', body } = {}) {
  const res = await fetch(url, { method, headers: body ? { 'Content-Type': 'application/json' } : undefined, body: body ? JSON.stringify(body) : undefined, cache: 'no-store' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error || `http_${res.status}`), { status: res.status, data });
  return data;
}

export const fmtBytes = (b) => (!b ? '' : b > 1073741824 ? `${(b / 1073741824).toFixed(1)} GB` : b > 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);
