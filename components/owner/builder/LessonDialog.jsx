'use client';

import { useCallback, useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';
import Icon from '@/components/Icon';
import Dialog from '@/components/ui/Dialog';
import { S, errText } from '@/components/owner/builder/strings';
import { api as http, putFile, readDuration, fmtBytes } from '@/components/owner/builder/upload';
import FileDropzone from '@/components/ui/FileDropzone';
import { clock } from '@/lib/copy';
import { useFlash } from '@/components/ui/motion';

const TYPES = ['video', 'pdf', 'quiz', 'assignment'];

export default function LessonDialog({ course, lesson, onClose }) {
  const { lang, api, showToast } = useApp();
  const s = S(lang);
  const [form, setForm] = useState({ title: lesson.title, summary: lesson.summary || '', type: lesson.type, free: lesson.free });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [savedFlash, flashSaved] = useFlash();
  const dirty = form.title !== lesson.title || form.summary !== (lesson.summary || '') || form.type !== lesson.type || form.free !== lesson.free;

  const save = async (e) => {
    e?.preventDefault();
    if (!form.title.trim()) { setError(s.ck_title); return; }
    setBusy(true); setError(null);
    try {
      await api.courseOp({ courseId: course.id, op: 'updateLesson', lessonId: lesson.id, title: form.title, summary: form.summary, free: form.free, ...(form.type !== lesson.type ? { type: form.type } : {}) });
      flashSaved();
    } catch (err) { setError(errText(s, err)); } finally { setBusy(false); }
  };
  const move = async (targetModuleId) => {
    try { await api.courseOp({ courseId: course.id, op: 'moveLessonToModule', lessonId: lesson.id, targetModuleId: Number(targetModuleId) }); showToast(s.saved, 'success'); }
    catch (err) { showToast(errText(s, err), 'error'); }
  };
  const del = async () => {
    if (!window.confirm(s.confirmDeleteLesson)) return;
    try { await api.courseOp({ courseId: course.id, op: 'deleteLesson', lessonId: lesson.id }); showToast(s.saved, 'success'); onClose(); }
    catch (err) { setError(errText(s, err)); }
  };

  return (
    <Dialog open onClose={onClose} title={s.editLesson} description={lesson.title} wide closeLabel={s.close}>
      <div className="stack" style={{ '--gap': '22px' }}>
        <form className="stack" onSubmit={save} noValidate>
          <div className="field"><label htmlFor="l-title">{s.lessonTitle}</label><input id="l-title" className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} maxLength={191} /></div>
          <div className="field"><label htmlFor="l-sum">{s.lessonSummary}</label><textarea id="l-sum" className="textarea" rows={3} value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} maxLength={2000} /></div>
          <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(min(200px, 100%), 1fr))' }}>
            <div className="field"><label htmlFor="l-type">{s.lessonType}</label>
              <select id="l-type" className="select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>{TYPES.map((t) => <option key={t} value={t}>{s[`type_${t}`]}</option>)}</select>
            </div>
            <div className="field"><label htmlFor="l-move">{s.moveTo}</label>
              <select id="l-move" className="select" value={lesson.moduleId} onChange={(e) => move(e.target.value)}>{course.modules.map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}</select>
            </div>
          </div>
          <label className="check"><input type="checkbox" checked={form.free} onChange={(e) => setForm({ ...form, free: e.target.checked })} /><span>{s.preview}<br /><span className="help">{s.previewHelp}</span></span></label>
          {error && <div className="notice notice-danger" role="alert"><Icon name="alert" size={18} />{error}</div>}
          <div className="row between" style={{ flexWrap: 'wrap' }}>
            <button type="submit" className={`btn btn-primary ${savedFlash && !dirty ? 'is-success' : ''}`} disabled={busy || (!dirty && !savedFlash)} aria-busy={busy}>
              {busy ? <span className="spinner" aria-hidden="true" /> : savedFlash && !dirty ? <Icon name="check" size={16} /> : null}{savedFlash && !dirty ? s.saved : s.save}
            </button>
            <button type="button" className="btn btn-danger btn-sm" onClick={del}><Icon name="trash" size={14} />{s.deleteLesson}</button>
          </div>
        </form>
        {lesson.type === 'video' && <VideoSection lesson={lesson} s={s} />}
        <ResourcesSection lessonId={lesson.id} s={s} />
      </div>
    </Dialog>
  );
}

function VideoSection({ lesson, s }) {
  const { api, showToast, lang } = useApp();
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);
  const [cap, setCap] = useState({ lang: 'bn', label: 'বাংলা' });

  const load = useCallback(() => http(`/api/lessons/${lesson.id}/video/status`).then(setStatus).catch((e) => setError(errText(s, e))), [lesson.id, s]);
  useEffect(() => { load(); }, [load]);

  // FileDropzone drives the queue and progress; this does the 3-step upload.
  const uploadVideo = async (file, { onProgress, signal }) => {
    setError(null);
    try {
      const durationSeconds = await readDuration(file);
      const up = await http(`/api/lessons/${lesson.id}/video/upload-url`, { method: 'POST', body: { fileName: file.name, contentType: file.type || 'video/mp4', size: file.size } });
      await putFile(up.uploadUrl, file, file.type || 'video/mp4', onProgress, signal);
      onProgress('verify');
      await http(`/api/lessons/${lesson.id}/video`, { method: 'POST', body: { key: up.key, durationSeconds } });
      showToast(s.v_ready, 'success');
      api.refetchCourses();
    } catch (err) {
      if (!err.cancelled) http(`/api/lessons/${lesson.id}/video/upload-url`, { method: 'POST', body: { failed: true, reason: err.message } }).catch(() => {});
      throw Object.assign(new Error(err.cancelled ? err.message : errText(s, err)), { cancelled: err.cancelled });
    } finally { load(); }
  };
  const removeVideo = async () => {
    try { await http(`/api/lessons/${lesson.id}/video`, { method: 'DELETE' }); api.refetchCourses(); load(); }
    catch (err) { setError(errText(s, err)); }
  };
  const uploadCaption = async (file, { onProgress, signal }) => {
    try {
      const up = await http(`/api/lessons/${lesson.id}/captions`, { method: 'POST', body: cap });
      await putFile(up.uploadUrl, file, 'text/vtt', onProgress, signal);
      setStatus(await http(`/api/lessons/${lesson.id}/captions`, { method: 'PATCH', body: { key: up.key, lang: up.lang, label: up.label } }));
      showToast(s.saved, 'success');
    } catch (err) { throw Object.assign(new Error(err.cancelled ? err.message : errText(s, err)), { cancelled: err.cancelled }); }
  };

  const badge = { ready: 'badge-success', pending: 'badge-warning', failed: 'badge-danger', missing: 'badge-danger' }[status?.status] || '';
  return (
    <section className="surface surface-pad stack" aria-labelledby="vid-h">
      <div className="row between" style={{ flexWrap: 'wrap' }}>
        <h3 id="vid-h" className="h4">{s.video}</h3>
        {status && <span className={`badge ${badge}`}>{s[`v_${status.status}`]}{status.durationSeconds ? ` · ${clock(status.durationSeconds)}` : ''}{status.sizeBytes ? ` · ${fmtBytes(status.sizeBytes)}` : ''}</span>}
      </div>
      {status && !status.storageConfigured && <div className="notice notice-warn"><Icon name="alert" size={18} />{s.e_storage_not_configured}</div>}
      {status?.error && status.status !== 'ready' && <p className="field-error">{status.error}</p>}
      <FileDropzone
        accept="video/mp4,video/webm,video/quicktime" maxBytes={4 * 1024 * 1024 * 1024} lang={lang}
        title={status?.status === 'ready' ? s.replace : s.uploadVideo} hint={s.videoTypes}
        disabled={!!status && !status.storageConfigured} upload={uploadVideo}
      />
      {status?.status === 'ready' && <div><button type="button" className="btn btn-ghost btn-sm" onClick={removeVideo}><Icon name="trash" size={14} />{s.removeVideo}</button></div>}
      {status?.status === 'ready' && (
        <div className="stack" style={{ '--gap': '8px', borderTop: '1px solid var(--border)', paddingTop: 14 }}>
          <span className="label" style={{ margin: 0 }}>{s.captions}</span>
          {status.captions.map((c) => <div key={c.id} className="row small" style={{ '--gap': '8px' }}><Icon name="captions" size={15} />{c.label} ({c.lang})</div>)}
          <div className="row" style={{ flexWrap: 'wrap', '--gap': '8px' }}>
            <label className="sr-only" htmlFor="cap-lang">{s.captionLang}</label>
            <input id="cap-lang" className="input" style={{ width: 90, minHeight: 36 }} value={cap.lang} onChange={(e) => setCap({ ...cap, lang: e.target.value })} placeholder="bn" />
            <label className="sr-only" htmlFor="cap-label">{s.captionLabel}</label>
            <input id="cap-label" className="input" style={{ width: 140, minHeight: 36 }} value={cap.label} onChange={(e) => setCap({ ...cap, label: e.target.value })} placeholder={s.captionLabel} />
          </div>
          <FileDropzone accept=".vtt,text/vtt" maxBytes={2 * 1024 * 1024} lang={lang} compact title={s.uploadCaption} upload={uploadCaption} />
        </div>
      )}
      {error && <div className="notice notice-danger" role="alert"><Icon name="alert" size={18} />{error}</div>}
    </section>
  );
}

function ResourcesSection({ lessonId, s }) {
  const { api, lang } = useApp();
  const [items, setItems] = useState(null);
  const [link, setLink] = useState({ title: '', url: '' });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const load = useCallback(() => http(`/api/lessons/${lessonId}/resources?manage=1`).then(setItems).catch((e) => setError(errText(s, e))), [lessonId, s]);
  useEffect(() => { load(); }, [load]);
  const after = (list) => { setItems(list); api.refetchCourses(); };

  const addLink = async (e) => {
    e.preventDefault(); setError(null); setBusy(true);
    try { after(await http(`/api/lessons/${lessonId}/resources`, { method: 'POST', body: { kind: 'link', ...link } })); setLink({ title: '', url: '' }); }
    catch (err) { setError(errText(s, err)); } finally { setBusy(false); }
  };
  const uploadResource = async (file, { onProgress, signal }) => {
    try {
      const up = await http(`/api/lessons/${lessonId}/resources`, { method: 'POST', body: { kind: 'file', title: file.name.replace(/\.[^.]+$/, ''), fileName: file.name, contentType: file.type, size: file.size } });
      await putFile(up.uploadUrl, file, file.type, onProgress, signal);
      after(await http(`/api/lessons/${lessonId}/resources`, { method: 'PATCH', body: { resourceId: up.resourceId } }));
    } catch (err) { load(); throw Object.assign(new Error(err.cancelled ? err.message : errText(s, err)), { cancelled: err.cancelled }); }
  };
  const remove = async (id) => {
    try { after(await http(`/api/lessons/${lessonId}/resources`, { method: 'DELETE', body: { resourceId: id } })); } catch (err) { setError(errText(s, err)); }
  };

  return (
    <section className="surface surface-pad stack" aria-labelledby="res-h">
      <h3 id="res-h" className="h4">{s.resources}</h3>
      {items == null ? <div className="skeleton" style={{ height: 40 }} /> : !items.length ? <p className="small muted">{s.noResources}</p> : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 6 }}>
          {items.map((r) => (
            <li key={r.id} className="row small" style={{ '--gap': '8px' }}>
              <Icon name={r.kind === 'link' ? 'link' : 'file'} size={15} />
              <span className="grow">{r.title} {r.status === 'pending' && <span className="badge badge-warning">{s.v_pending}</span>} <span className="muted">{fmtBytes(r.sizeBytes)}</span></span>
              <button type="button" className="btn btn-ghost btn-icon btn-sm" onClick={() => remove(r.id)} aria-label={`${s.remove}: ${r.title}`}><Icon name="trash" size={14} /></button>
            </li>
          ))}
        </ul>
      )}
      <form className="row" style={{ flexWrap: 'wrap', '--gap': '8px' }} onSubmit={addLink}>
        <label className="sr-only" htmlFor={`rt-${lessonId}`}>{s.linkTitle}</label>
        <input id={`rt-${lessonId}`} className="input" style={{ flex: '1 1 160px', minHeight: 38 }} placeholder={s.linkTitle} value={link.title} onChange={(e) => setLink({ ...link, title: e.target.value })} />
        <label className="sr-only" htmlFor={`ru-${lessonId}`}>{s.linkUrl}</label>
        <input id={`ru-${lessonId}`} className="input" type="url" style={{ flex: '2 1 220px', minHeight: 38 }} placeholder={s.linkUrl} value={link.url} onChange={(e) => setLink({ ...link, url: e.target.value })} />
        <button type="submit" className="btn btn-secondary btn-sm" disabled={busy || !link.title.trim() || !link.url.trim()}><Icon name="link" size={14} />{s.addLink}</button>
      </form>
      <FileDropzone
        multiple lang={lang} upload={uploadResource} maxBytes={200 * 1024 * 1024}
        accept=".pdf,.zip,.txt,.csv,.docx,.pptx,.xlsx,image/jpeg,image/png,image/webp"
        title={s.uploadFile} hint="PDF, ZIP, TXT, CSV, DOCX, PPTX, XLSX, JPG, PNG, WebP · ≤ 200 MB"
      />
      {error && <div className="notice notice-danger" role="alert"><Icon name="alert" size={18} />{error}</div>}
    </section>
  );
}
