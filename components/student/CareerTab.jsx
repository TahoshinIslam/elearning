'use client';

import { useApp } from '@/context/AppContext';
import { statusLabel, statusChip, jobTypeLabel } from '@/lib/career';

const STUDENT_ID = 1;
const STUDENT_NAME = 'তানভীর আহমেদ';

export default function CareerTab() {
  const { t, jobs, applications, api, showToast } = useApp();

  const openJobs = jobs.filter((j) => j.open);
  const myApps = applications.filter((a) => a.studentId === STUDENT_ID);
  const appForJob = (jobId) => myApps.find((a) => a.jobId === jobId);
  const jobTitle = (jobId) => jobs.find((j) => j.id === jobId)?.title || '—';

  const apply = async (jobId) => {
    try {
      await api.applyJob(jobId, STUDENT_ID, STUDENT_NAME);
      showToast(t.appliedToast);
    } catch {
      showToast(t.certErr); // generic failure
    }
  };

  return (
    <div className="anim-in">
      <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>{t.careerPortal}</div>

      {/* open jobs */}
      {openJobs.length === 0 ? (
        <div className="card" style={{ padding: 26, textAlign: 'center', color: 'var(--faint)', marginTop: 16 }}>{t.noJobs}</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 16, marginTop: 16 }}>
          {openJobs.map((j) => {
            const app = appForJob(j.id);
            return (
              <div key={j.id} className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16, lineHeight: 1.35 }}>{j.title}</div>
                  <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 3 }}>{j.company} · {j.location}</div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <span className="tag chip-stone">{jobTypeLabel(t, j.type)}</span>
                  {j.skills.map((s) => <span key={s} className="tag chip-orange">{s}</span>)}
                </div>
                <div style={{ fontSize: 13, color: 'var(--ink-soft)', fontWeight: 600 }}>{t.jobSalary}: ৳{j.salary}</div>
                <div style={{ marginTop: 'auto', paddingTop: 6 }}>
                  {app ? (
                    <span className={`chip ${statusChip(app.status)}`}>{statusLabel(t, app.status)}</span>
                  ) : (
                    <button className="btn-primary" style={{ width: '100%' }} onClick={() => apply(j.id)}>{t.jobApply}</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* my applications */}
      <div style={{ fontSize: 18, fontWeight: 700, margin: '30px 0 14px' }}>{t.myApplications}</div>
      {myApps.length === 0 ? (
        <div className="card" style={{ padding: 20, textAlign: 'center', color: 'var(--faint)', fontSize: 13.5 }}>{t.noApplications}</div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          {myApps.map((a) => (
            <div key={a.id} className="row-line" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 18px' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{jobTitle(a.jobId)}</div>
                <div style={{ fontSize: 11.5, color: 'var(--faint)' }}>{a.appliedAt}</div>
              </div>
              <span className={`chip ${statusChip(a.status)}`}>{statusLabel(t, a.status)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
