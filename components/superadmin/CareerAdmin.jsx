'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { APP_STATUSES, statusLabel, jobTypeLabel } from '@/lib/career';

const dk = {
  border: '1px solid rgba(255,255,255,.18)',
  background: 'rgba(255,255,255,.08)',
  color: '#fff',
  borderRadius: 8,
  padding: '9px 11px',
  fontSize: 13.5,
  fontFamily: 'inherit'
};
const panel = { background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 16 };
const faint = 'rgba(255,255,255,.5)';

export default function CareerAdmin() {
  const { t, jobs, applications, api, showToast } = useApp();
  const [f, setF] = useState({ title: '', company: '', location: '', type: 'full-time', salary: '', skills: '' });

  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));
  const applicantCount = (jobId) => applications.filter((a) => a.jobId === jobId).length;
  const jobTitle = (jobId) => jobs.find((j) => j.id === jobId)?.title || '—';

  const post = async () => {
    if (!f.title.trim()) { showToast(t.jobTitle); return; }
    await api.postJob(f);
    setF({ title: '', company: '', location: '', type: 'full-time', salary: '', skills: '' });
    showToast(t.jobPostedToast);
  };

  return (
    <div style={{ marginTop: 30 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 16 }}>
        <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{t.careerPortal}</h3>
        <span style={{ fontSize: 12.5, color: faint }}>{t.manageJobs}</span>
      </div>

      {/* post job */}
      <div style={{ ...panel, padding: 18, marginBottom: 18 }}>
        <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 12 }}>{t.postJob}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(150px,100%),1fr))', gap: 10 }}>
          <input style={dk} placeholder={t.jobTitle} value={f.title} onChange={(e) => set('title', e.target.value)} />
          <input style={dk} placeholder={t.company} value={f.company} onChange={(e) => set('company', e.target.value)} />
          <input style={dk} placeholder={t.jobLocation} value={f.location} onChange={(e) => set('location', e.target.value)} />
          <select style={dk} value={f.type} onChange={(e) => set('type', e.target.value)}>
            <option value="full-time">{t.jobFull}</option>
            <option value="part-time">{t.jobPart}</option>
            <option value="internship">{t.jobIntern}</option>
          </select>
          <input style={dk} placeholder={t.jobSalary} value={f.salary} onChange={(e) => set('salary', e.target.value)} />
          <input style={dk} placeholder={t.skillsPh} value={f.skills} onChange={(e) => set('skills', e.target.value)} />
        </div>
        <button
          onClick={post}
          style={{ marginTop: 12, border: 'none', background: '#ff8a3d', color: 'var(--coal)', borderRadius: 9, padding: '9px 18px', fontSize: 13, fontWeight: 700, fontFamily: 'inherit' }}
        >
          + {t.postJob}
        </button>
      </div>

      {/* jobs list */}
      <div style={{ ...panel, overflow: 'hidden', marginBottom: 18 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.4fr 1fr 1fr', gap: 10, padding: '12px 18px', fontSize: 12, fontWeight: 700, color: faint, borderBottom: '1px solid rgba(255,255,255,.1)' }}>
          <div>{t.jobTitle}</div><div>{t.company}</div><div>{t.applicants}</div><div>{t.thStatus}</div>
        </div>
        {jobs.map((j) => (
          <div key={j.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1.4fr 1fr 1fr', gap: 10, padding: '13px 18px', alignItems: 'center', fontSize: 13.5, borderBottom: '1px solid rgba(255,255,255,.07)' }}>
            <div style={{ fontWeight: 600 }}>{j.title}</div>
            <div style={{ color: faint }}>{j.company}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>{applicantCount(j.id)}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, borderRadius: 99, padding: '3px 10px', background: j.open ? 'rgba(14,159,110,.22)' : 'rgba(220,38,38,.25)', color: j.open ? '#4ade80' : '#fca5a5' }}>
                {j.open ? t.jobOpen : t.jobClosed}
              </span>
              <button
                onClick={() => api.toggleJob(j.id)}
                style={{ border: '1px solid rgba(255,255,255,.25)', background: 'none', color: 'rgba(255,255,255,.8)', borderRadius: 8, padding: '4px 10px', fontSize: 11.5, fontWeight: 600, fontFamily: 'inherit' }}
              >
                {j.open ? t.jobClosed : t.jobOpen}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* applications */}
      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>{t.applications}</div>
      <div style={{ ...panel, overflow: 'hidden' }}>
        {applications.length === 0 ? (
          <div style={{ padding: 20, textAlign: 'center', color: faint, fontSize: 13 }}>{t.noApplications}</div>
        ) : applications.map((a) => (
          <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 18px', borderBottom: '1px solid rgba(255,255,255,.07)', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 160 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{a.studentName}</div>
              <div style={{ fontSize: 12, color: faint }}>{jobTitle(a.jobId)} · {a.appliedAt}</div>
            </div>
            <select
              style={{ ...dk, padding: '7px 10px' }}
              value={a.status}
              onChange={async (e) => { await api.setApplicationStatus(a.id, e.target.value); showToast(t.statusUpdatedToast); }}
            >
              {APP_STATUSES.map((s) => <option key={s} value={s}>{statusLabel(t, s)}</option>)}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}
