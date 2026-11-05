'use client';

import { useId, useRef, useState } from 'react';
import Icon from '@/components/Icon';
import { fmtBytes } from '@/components/owner/builder/upload';

const T = {
  bn: {
    drop: 'ফাইল এখানে টেনে এনে ছাড়ুন', dropMany: 'ফাইলগুলো এখানে টেনে এনে ছাড়ুন', or: 'অথবা', choose: 'কম্পিউটার থেকে বেছে নিন', dropNow: 'ছেড়ে দিন — আপলোড শুরু হবে',
    badType: 'এই ধরনের ফাইল নেওয়া হয় না', tooBig: (m) => `ফাইলটি ${m}-এর বেশি`, queued: 'অপেক্ষায়', uploading: 'আপলোড হচ্ছে', verifying: 'যাচাই হচ্ছে…',
    done: 'সম্পন্ন', failed: 'ব্যর্থ', cancelled: 'বাতিল', cancel: 'বাতিল', retry: 'আবার চেষ্টা', clear: 'তালিকা মুছুন', remove: 'সরান', onlyOne: 'একবারে একটি ফাইল'
  },
  en: {
    drop: 'Drag a file here', dropMany: 'Drag files here', or: 'or', choose: 'choose from your computer', dropNow: 'Drop to upload',
    badType: 'This file type isn’t accepted', tooBig: (m) => `Larger than ${m}`, queued: 'Queued', uploading: 'Uploading', verifying: 'Verifying…',
    done: 'Done', failed: 'Failed', cancelled: 'Cancelled', cancel: 'Cancel', retry: 'Retry', clear: 'Clear list', remove: 'Remove', onlyOne: 'One file at a time'
  }
};

// Does `file` match an <input accept> list (".pdf", "image/*", "video/mp4")?
export function acceptsFile(accept, file) {
  if (!accept) return true;
  const name = file.name.toLowerCase();
  const type = (file.type || '').toLowerCase();
  return accept.split(',').map((x) => x.trim().toLowerCase()).filter(Boolean).some((rule) => {
    if (rule.startsWith('.')) return name.endsWith(rule);
    if (rule.endsWith('/*')) return type.startsWith(rule.slice(0, -1));
    return type === rule;
  });
}

let seq = 0;

// Drag-and-drop uploader with a visible queue. Files are validated on the way
// in (type + size, the server re-checks both), then uploaded one at a time by
// the caller's `upload(file, { onProgress, signal })`, which may report a
// number (0–100) or 'verify'. Each row can be cancelled, retried or removed.
// Keyboard: the zone is a button (Enter/Space opens the picker).
export default function FileDropzone({
  accept, multiple = false, maxBytes, upload, onComplete, disabled = false,
  lang = 'bn', title, hint, compact = false
}) {
  const t = T[lang === 'en' ? 'en' : 'bn'];
  const inputId = useId();
  const inputRef = useRef(null);
  const [over, setOver] = useState(false);
  const [items, setItems] = useState([]);
  const running = useRef(false);
  const queue = useRef([]);
  const controllers = useRef(new Map());

  const patch = (id, p) => setItems((list) => list.map((x) => (x.id === id ? { ...x, ...p } : x)));

  const pump = async () => {
    if (running.current) return;
    running.current = true;
    const results = [];
    while (queue.current.length) {
      const item = queue.current.shift();
      const ctrl = new AbortController();
      controllers.current.set(item.id, ctrl);
      patch(item.id, { status: 'uploading', progress: 0, error: null });
      try {
        const out = await upload(item.file, {
          signal: ctrl.signal,
          onProgress: (pr) => patch(item.id, pr === 'verify' ? { status: 'verifying', progress: 100 } : { progress: pr })
        });
        patch(item.id, { status: 'done', progress: 100 });
        results.push(out);
      } catch (e) {
        patch(item.id, e?.cancelled ? { status: 'cancelled' } : { status: 'failed', error: e?.message || t.failed });
      } finally {
        controllers.current.delete(item.id);
      }
    }
    running.current = false;
    if (results.length) onComplete?.(results);
  };

  const add = (fileList) => {
    if (disabled) return;
    let files = Array.from(fileList || []);
    if (!files.length) return;
    if (!multiple) files = files.slice(0, 1);
    const next = files.map((file) => {
      const id = ++seq;
      let error = null;
      if (!acceptsFile(accept, file)) error = t.badType;
      else if (maxBytes && file.size > maxBytes) error = t.tooBig(fmtBytes(maxBytes));
      return { id, file, name: file.name, size: file.size, progress: 0, status: error ? 'failed' : 'queued', error, rejected: !!error };
    });
    setItems((list) => [...(multiple ? list.filter((x) => x.status !== 'done') : []), ...next]);
    queue.current.push(...next.filter((x) => !x.rejected));
    pump();
  };

  const retry = (item) => { patch(item.id, { status: 'queued', error: null, progress: 0 }); queue.current.push(item); pump(); };
  const cancel = (item) => {
    const c = controllers.current.get(item.id);
    if (c) c.abort();
    else { queue.current = queue.current.filter((x) => x.id !== item.id); patch(item.id, { status: 'cancelled' }); }
  };
  const remove = (item) => setItems((list) => list.filter((x) => x.id !== item.id));

  const open = () => { if (!disabled) inputRef.current?.click(); };
  const statusText = (x) => ({ queued: t.queued, uploading: `${t.uploading} ${x.progress}%`, verifying: t.verifying, done: t.done, cancelled: t.cancelled, failed: x.error || t.failed })[x.status];

  return (
    <div className={`fdz ${compact ? 'fdz-compact' : ''}`}>
      <input ref={inputRef} id={inputId} type="file" className="sr-only" accept={accept} multiple={multiple} disabled={disabled} tabIndex={-1}
        onChange={(e) => { add(e.target.files); e.target.value = ''; }} />
      <div
        role="button" tabIndex={disabled ? -1 : 0} aria-disabled={disabled || undefined}
        aria-describedby={hint ? `${inputId}-hint` : undefined}
        className={`fdz-zone ${over ? 'is-over' : ''} ${disabled ? 'is-disabled' : ''}`}
        onClick={open}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } }}
        onDragEnter={(e) => { e.preventDefault(); if (!disabled) setOver(true); }}
        onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = disabled ? 'none' : 'copy'; }}
        onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setOver(false); }}
        onDrop={(e) => { e.preventDefault(); setOver(false); add(e.dataTransfer.files); }}
      >
        <span className="fdz-icon" aria-hidden="true"><Icon name="upload" size={compact ? 18 : 24} /></span>
        <span className="fdz-text">
          <strong>{over ? t.dropNow : (title || (multiple ? t.dropMany : t.drop))}</strong>
          {!compact && <span className="fdz-or">{t.or} <u>{t.choose}</u></span>}
        </span>
      </div>
      {hint && <p id={`${inputId}-hint`} className="help fdz-hint">{hint}{!multiple ? ` · ${t.onlyOne}` : ''}</p>}
      {items.length > 0 && (
        <ul className="fdz-list" aria-live="polite">
          {items.map((x) => (
            <li key={x.id} className={`fdz-item is-${x.status}`}>
              <Icon name={x.status === 'done' ? 'checkCircle' : x.status === 'failed' ? 'alert' : 'file'} size={16} />
              <div className="fdz-meta">
                <div className="fdz-name"><span className="clamp-1">{x.name}</span><span className="muted">{fmtBytes(x.size)}</span></div>
                {(x.status === 'uploading' || x.status === 'verifying') && <div className="progress progress-sm"><span style={{ width: `${x.progress}%` }} /></div>}
                <div className={`fdz-status ${x.status === 'failed' ? 'field-error' : 'muted'}`}>{statusText(x)}</div>
              </div>
              <div className="fdz-actions">
                {(x.status === 'uploading' || x.status === 'queued') && <button type="button" className="btn btn-ghost btn-sm" onClick={() => cancel(x)}>{t.cancel}</button>}
                {(x.status === 'failed' || x.status === 'cancelled') && !x.rejected && <button type="button" className="btn btn-secondary btn-sm" onClick={() => retry(x)}>{t.retry}</button>}
                {!['uploading', 'verifying', 'queued'].includes(x.status) && <button type="button" className="btn btn-ghost btn-icon btn-sm" onClick={() => remove(x)} aria-label={`${t.remove}: ${x.name}`}><Icon name="x" size={14} /></button>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
