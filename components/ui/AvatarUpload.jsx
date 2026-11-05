'use client';

import { useEffect, useId, useRef, useState } from 'react';
import Icon from '@/components/Icon';
import { useApp } from '@/context/AppContext';
import { putFile, api, fmtBytes } from '@/components/owner/builder/upload';

const TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX = 5 * 1024 * 1024;
const SIZE = 512; // stored as a 512 × 512 WebP

const T = {
  bn: {
    title: 'প্রোফাইল ছবি', sub: 'বর্গাকার করে কেটে নেওয়া হবে — মাঝখানের অংশ থাকবে।', rules: 'JPG, PNG, WEBP · সর্বোচ্চ ৫ MB',
    select: 'ছবি বাছুন', change: 'ছবি বদলান', cancel: 'বাতিল', remove: 'ছবি সরান', drop: 'ছেড়ে দিন',
    uploading: 'আপলোড হচ্ছে', done: 'প্রোফাইল ছবি আপডেট হয়েছে', removed: 'প্রোফাইল ছবি সরানো হয়েছে', failed: 'আপলোড হয়নি',
    errs: { type: 'শুধু JPG, PNG বা WEBP ছবি দেওয়া যাবে।', size: 'ছবিটি ৫ MB-এর বেশি।', read: 'ছবিটি পড়া যাচ্ছে না — ফাইলটি নষ্ট হতে পারে।', storage_not_configured: 'স্টোরেজ সেট করা নেই — অ্যাডমিনকে জানান।', content_mismatch: 'ফাইলটি আসলে ছবি নয়।', generic: 'নেটওয়ার্ক সমস্যা — আবার চেষ্টা করুন।' },
    original: 'মূল ফাইল', willSave: 'সংরক্ষণ হবে'
  },
  en: {
    title: 'Profile photo', sub: 'Cropped to a square from the centre.', rules: 'JPG, PNG, WEBP · up to 5 MB',
    select: 'Select image', change: 'Change photo', cancel: 'Cancel', remove: 'Remove photo', drop: 'Drop it',
    uploading: 'Uploading', done: 'Profile photo updated', removed: 'Profile photo removed', failed: 'Upload failed',
    errs: { type: 'Only JPG, PNG or WEBP images.', size: 'The image is larger than 5 MB.', read: 'Couldn’t read this image — the file may be damaged.', storage_not_configured: 'Storage isn’t configured — tell an admin.', content_mismatch: 'That file isn’t really an image.', generic: 'Network problem — try again.' },
    original: 'Original', willSave: 'Saved as'
  }
};

// Centre-crop to a square and re-encode as WebP (smaller, strips EXIF/GPS).
async function toSquareWebp(file) {
  const bmp = await createImageBitmap(file);
  const s = Math.min(bmp.width, bmp.height);
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = Math.min(SIZE, s);
  canvas.getContext('2d').drawImage(bmp, (bmp.width - s) / 2, (bmp.height - s) / 2, s, s, 0, 0, canvas.width, canvas.height);
  const dims = { w: bmp.width, h: bmp.height };
  bmp.close?.();
  const blob = await new Promise((r) => canvas.toBlob(r, 'image/webp', 0.9));
  return { blob: blob?.type === 'image/webp' ? blob : await new Promise((r) => canvas.toBlob(r, 'image/jpeg', 0.9)), dims };
}

// Upload / change / remove the signed-in user's photo: square frame whose
// border fills as a progress ring, percent sticker, file details and a
// clear error card. Updates the header avatar straight away.
export default function AvatarUpload() {
  const { lang, auth, patchAuth, showToast } = useApp();
  const t = T[lang === 'en' ? 'en' : 'bn'];
  const id = useId();
  const input = useRef(null);
  const abort = useRef(null);
  const [state, setState] = useState('idle'); // idle | uploading | done | error
  const [pct, setPct] = useState(0);
  const [file, setFile] = useState(null); // { name, size, type, w, h, out, preview }
  const [err, setErr] = useState(null);
  const [over, setOver] = useState(false);
  useEffect(() => () => { if (file?.preview) URL.revokeObjectURL(file.preview); }, [file]);

  const take = async (f) => {
    if (!f || state === 'uploading') return;
    setErr(null);
    if (!TYPES.includes(f.type)) { setErr({ name: f.name, msg: t.errs.type }); setState('error'); return; }
    if (f.size > MAX) { setErr({ name: f.name, msg: t.errs.size, size: f.size }); setState('error'); return; }
    let blob, dims;
    try { ({ blob, dims } = await toSquareWebp(f)); } catch { setErr({ name: f.name, msg: t.errs.read }); setState('error'); return; }
    const info = { name: f.name, size: f.size, type: f.type.split('/')[1].toUpperCase(), w: dims.w, h: dims.h, out: blob.size, outType: blob.type.split('/')[1].toUpperCase(), preview: URL.createObjectURL(blob) };
    setFile(info); setPct(0); setState('uploading');
    const ctrl = new AbortController(); abort.current = ctrl;
    try {
      const up = await api('/api/me/avatar', { method: 'POST', body: { contentType: blob.type, size: blob.size, fileName: `avatar.${blob.type === 'image/webp' ? 'webp' : 'jpg'}` } });
      await putFile(up.uploadUrl, blob, blob.type, setPct, ctrl.signal);
      const done = await api('/api/me/avatar', { method: 'PUT', body: { key: up.key } });
      patchAuth({ avatarUrl: done.avatarUrl });
      setPct(100); setState('done'); showToast(t.done, 'success');
    } catch (e) {
      if (e.cancelled) { setState('idle'); setFile(null); return; }
      const code = e.data?.error || (String(e.message).includes('415') ? 'content_mismatch' : e.message);
      setErr({ name: f.name, msg: t.errs[code] || t.errs.generic, size: f.size }); setState('error');
    } finally { abort.current = null; }
  };

  const remove = async () => {
    try { await api('/api/me/avatar', { method: 'DELETE' }); patchAuth({ avatarUrl: null }); setFile(null); setState('idle'); showToast(t.removed, 'success'); }
    catch { showToast(t.errs.generic, 'error'); }
  };

  const shown = file?.preview && state !== 'error' ? file.preview : auth?.avatarUrl;
  const initial = String(auth?.name || '?').trim().charAt(0).toUpperCase();
  const busy = state === 'uploading';

  return (
    <section className="surface surface-pad avup" aria-labelledby={`${id}-h`}>
      <div className="avup-main">
        <label htmlFor={`${id}-in`} className={`avup-frame is-${state} ${over ? 'is-over' : ''}`} style={{ '--p': `${busy ? pct : state === 'done' ? 100 : 0}%` }}
          onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)}
          onDrop={(e) => { e.preventDefault(); setOver(false); take(e.dataTransfer.files?.[0]); }}>
          <span className="avup-ring" aria-hidden="true" />
          <span className="avup-pic">
            {shown ? <img src={shown} alt="" /> : <span className="avup-initial" aria-hidden="true">{initial}</span>}
            <span className="avup-hover" aria-hidden="true"><Icon name={over ? 'upload' : 'camera'} size={26} />{over ? t.drop : null}</span>
          </span>
          {busy && <span className="avup-pct tabular" role="status">{pct}%</span>}
          {state === 'done' && <span className="avup-pct is-ok" aria-hidden="true"><Icon name="check" size={16} /></span>}
          <input ref={input} id={`${id}-in`} type="file" accept={TYPES.join(',')} className="sr-only" disabled={busy} onChange={(e) => { take(e.target.files?.[0]); e.target.value = ''; }} />
        </label>
        <div className="avup-copy">
          <h2 id={`${id}-h`} className="h4">{t.title}</h2>
          <p className="small muted">{t.sub}</p>
          <ul className="avup-chips" aria-label={t.rules}>{['JPG', 'PNG', 'WEBP', '≤ 5 MB'].map((x) => <li key={x}>{x}</li>)}</ul>
          <div className="cluster" style={{ '--gap': '8px' }}>
            {busy
              ? <button type="button" className="btn btn-secondary" data-confirm="off" onClick={() => abort.current?.abort()}><Icon name="x" size={16} />{t.cancel}</button>
              : <button type="button" className="btn btn-primary" data-confirm="off" onClick={() => input.current?.click()}><Icon name="image" size={16} />{auth?.avatarUrl ? t.change : t.select}</button>}
            {!busy && auth?.avatarUrl && <button type="button" className="btn btn-ghost" data-confirm={t.remove + '?'} onClick={remove}><Icon name="trash" size={16} />{t.remove}</button>}
          </div>
        </div>
      </div>

      {file && state !== 'error' && (
        <div className={`avup-file is-${state}`}>
          <span className="avup-file-icon" aria-hidden="true"><Icon name="image" size={20} /></span>
          <div className="avup-file-body">
            <p className="strong avup-file-name">{file.name}</p>
            <p className="xsmall muted tabular">{t.original}: {file.type} · {fmtBytes(file.size)} · {file.w}×{file.h} → {t.willSave}: {file.outType} · {fmtBytes(file.out)}</p>
            <div className="avup-bar" aria-hidden="true"><span style={{ width: `${state === 'done' ? 100 : pct}%` }} /></div>
          </div>
          <span className={`badge ${state === 'done' ? 'badge-success' : 'badge-info'}`}>{state === 'done' ? <Icon name="check" size={13} /> : `${t.uploading} ${pct}%`}</span>
        </div>
      )}
      {state === 'error' && err && (
        <div className="avup-file is-error" role="alert">
          <span className="avup-file-icon" aria-hidden="true"><Icon name="alert" size={20} /></span>
          <div className="avup-file-body">
            <p className="strong avup-file-name">{err.name}</p>
            <p className="xsmall">{t.failed}: {err.msg}{err.size ? ` (${fmtBytes(err.size)})` : ''}</p>
          </div>
          <button type="button" className="btn btn-ghost btn-sm btn-icon" data-confirm="off" aria-label={t.cancel} onClick={() => { setErr(null); setState('idle'); }}><Icon name="x" size={15} /></button>
        </div>
      )}
    </section>
  );
}
