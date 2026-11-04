'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';

const TODAY = '2026-07-06';

const fieldStyle = {
  border: '1px solid var(--field-line)', background: '#fff', borderRadius: 0,
  padding: '9px 11px', fontSize: 13.5, fontFamily: 'inherit', width: '100%'
};

export default function TeacherClasses() {
  const { t, batches, liveClasses, api, showToast, auth } = useApp();
  const INSTRUCTOR_ID = auth?.teacherId;
  const [showForm, setShowForm] = useState(false);
  const [f, setF] = useState({ title: '', batchId: batches[0]?.id ?? '', classDate: TODAY, startTime: '', endTime: '', zoomUrl: '' });
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));

  const mine = liveClasses.filter((c) => c.instructorId === INSTRUCTOR_ID);
  const today = mine.filter((c) => c.status === 'live' || (c.status === 'scheduled' && c.classDate === TODAY));
  const upcoming = mine.filter((c) => c.status === 'scheduled' && c.classDate > TODAY);
  const past = mine.filter((c) => c.status === 'ended');

  const start = async (c) => {
    await api.startClass(c.id);
    showToast(t.lcStartedToast);
    if (c.zoomUrl) window.open(c.zoomUrl, '_blank', 'noopener');
  };
  const end = async (c) => { await api.endClass(c.id); showToast(t.lcEndedToast); };
  const upload = async (c, url) => {
    const link = (url || '').trim();
    if (!/^https?:\/\/.+/i.test(link)) { showToast(t.lcRecUrlInvalid); return; }
    await api.setRecording(c.id, link);
    showToast(t.lcRecUploaded);
  };

  const schedule = async () => {
    if (!f.title.trim()) { showToast(t.lcTitle); return; }
    const batch = batches.find((b) => b.id === Number(f.batchId));
    await api.scheduleClass({
      courseId: batch?.courseId ?? null, batchId: Number(f.batchId), instructorId: INSTRUCTOR_ID,
      title: f.title.trim(), classDate: f.classDate, startTime: f.startTime, endTime: f.endTime, zoomUrl: f.zoomUrl.trim()
    });
    setF({ title: '', batchId: batches[0]?.id ?? '', classDate: TODAY, startTime: '', endTime: '', zoomUrl: '' });
    setShowForm(false);
    showToast(t.lcScheduledToast);
  };

  // paste a recording link for an ended class (teacher/admin uploads to storage, then pastes the URL)
  const RecUpload = ({ c }) => {
    const [open, setOpen] = useState(false);
    const [url, setUrl] = useState('');
    if (!open) return <button className="btn-ghost-sm" onClick={() => setOpen(true)}>⬆ {t.lcUploadRec}</button>;
    return (
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          autoFocus
          style={{ ...fieldStyle, width: 240 }}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder={t.lcRecUrlPh}
        />
        <button className="btn-dark" style={{ borderRadius: 0, padding: '9px 14px' }} onClick={() => upload(c, url)}>{t.lcRecUrlSave}</button>
      </div>
    );
  };

  const Card = ({ c }) => {
    const batch = batches.find((b) => b.id === c.batchId);
    return (
      <div className="card" style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <div style={{ minWidth: 96 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--brand-deep)' }}>{c.classDate === TODAY ? t.lcToday.split(' ')[0] : c.classDate}</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-soft)' }}>{c.startTime}</div>
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
            {c.status === 'live' && <span className="live-badge"><span className="live-dot" />{t.lcLive}</span>}
            <span style={{ fontWeight: 700, fontSize: 15 }}>{c.title}</span>
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--faint)' }}>{batch?.name}</div>
        </div>
        {c.status === 'scheduled' && (
          <button className="btn btn-primary" onClick={() => start(c)}>▶ {t.lcStart}</button>
        )}
        {c.status === 'live' && (
          <button className="btn-dark" style={{ borderRadius: 0, padding: '9px 16px' }} onClick={() => end(c)}>{t.lcEnd}</button>
        )}
        {c.status === 'ended' && (
          c.recordingUrl
            ? <a className="chip chip-green" href={c.recordingUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>✓ {t.lcWatchRec}</a>
            : <RecUpload c={c} />
        )}
      </div>
    );
  };

  const Section = ({ label, list }) => (
    <div style={{ marginBottom: 22 }}>
      <div style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--ink-soft)', marginBottom: 10 }}>{label} · {list.length}</div>
      {list.length === 0
        ? <div className="card" style={{ padding: 16, textAlign: 'center', color: 'var(--faint)', fontSize: 13 }}>{t.lcNoClasses}</div>
        : <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{list.map((c) => <Card key={c.id} c={c} />)}</div>}
    </div>
  );

  return (
    <div className="anim-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>{t.tClasses}</h2>
        <button className="btn-primary" onClick={() => setShowForm((v) => !v)}>+ {t.lcScheduleNew}</button>
      </div>

      {showForm && (
        <div style={{ background: '#fff9f3', border: '1.5px solid #f2b28a', borderRadius: 0, padding: '18px 20px', marginBottom: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(150px,100%),1fr))', gap: 12 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="label" style={{ fontSize: 12.5, marginBottom: 5 }}>{t.lcTitle}</label>
              <input style={fieldStyle} value={f.title} onChange={(e) => set('title', e.target.value)} />
            </div>
            <div>
              <label className="label" style={{ fontSize: 12.5, marginBottom: 5 }}>{t.attBatch}</label>
              <select style={fieldStyle} value={f.batchId} onChange={(e) => set('batchId', e.target.value)}>
                {batches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label" style={{ fontSize: 12.5, marginBottom: 5 }}>{t.lcDate}</label>
              <input type="date" style={fieldStyle} value={f.classDate} onChange={(e) => set('classDate', e.target.value)} />
            </div>
            <div>
              <label className="label" style={{ fontSize: 12.5, marginBottom: 5 }}>{t.lcStartT}</label>
              <input style={fieldStyle} value={f.startTime} onChange={(e) => set('startTime', e.target.value)} placeholder="সন্ধ্যা ৭:০০" />
            </div>
            <div>
              <label className="label" style={{ fontSize: 12.5, marginBottom: 5 }}>{t.lcEndT}</label>
              <input style={fieldStyle} value={f.endTime} onChange={(e) => set('endTime', e.target.value)} placeholder="রাত ৯:০০" />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="label" style={{ fontSize: 12.5, marginBottom: 5 }}>{t.lcZoom}</label>
              <input style={fieldStyle} value={f.zoomUrl} onChange={(e) => set('zoomUrl', e.target.value)} placeholder="https://zoom.us/j/…" />
            </div>
          </div>
          <button className="btn-dark" style={{ marginTop: 14 }} onClick={schedule}>{t.lcScheduleBtn}</button>
        </div>
      )}

      <Section label={t.lcToday} list={today} />
      <Section label={t.lcUpcoming} list={upcoming} />
      <Section label={t.lcPast} list={past} />
    </div>
  );
}
