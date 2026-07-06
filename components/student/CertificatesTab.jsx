'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { courseCompletion, CERT_THRESHOLD } from '@/lib/progress';

const STUDENT_ID = 1;
const STUDENT_NAME = 'তানভীর আহমেদ';

export default function CertificatesTab() {
  const { t, showToast, centerDisplay, courses: allCourses, enrollments, submissions, attendance, certificates, api } = useApp();
  const [viewing, setViewing] = useState(null); // certificate object

  const rows = enrollments
    .filter((e) => e.studentId === STUDENT_ID)
    .map((e) => {
      const course = allCourses.find((c) => c.id === (e.courseId ?? null));
      const { completion } = courseCompletion(STUDENT_ID, course, { enrollments, submissions, attendance });
      const cert = certificates.find((c) => c.studentId === STUDENT_ID && c.courseId === course?.id);
      return { course, completion, eligible: completion >= CERT_THRESHOLD, cert };
    })
    .filter((r) => r.course);

  const generate = async (courseId) => {
    try {
      await api.issueCertificate(STUDENT_ID, courseId, STUDENT_NAME);
      showToast(t.certGenerated);
    } catch {
      showToast(t.certErr);
    }
  };

  return (
    <div className="anim-in">
      <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 18 }}>{t.sCertificates}</div>

      {rows.length === 0 ? (
        <div className="card" style={{ padding: 28, textAlign: 'center', color: 'var(--faint)' }}>{t.certNoneEnrolled}</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 16 }}>
          {rows.map(({ course, completion, eligible, cert }) => (
            <div key={course.id} className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                <div style={{ fontWeight: 700, fontSize: 15.5, lineHeight: 1.4 }}>{course.title}</div>
                <span className={`chip ${cert ? 'chip-green' : eligible ? 'chip-orange' : 'chip-stone'}`} style={{ flex: 'none' }}>
                  {cert ? '🎓 ✓' : `${completion}%`}
                </span>
              </div>

              {/* progress toward threshold */}
              <div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${completion}%`, background: eligible ? 'var(--green)' : 'var(--brand)' }} />
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--faint)', marginTop: 5, fontWeight: 600 }}>
                  {completion}% / {CERT_THRESHOLD}% · {t.completion}
                </div>
              </div>

              {cert ? (
                <button className="btn-primary" onClick={() => setViewing(cert)}>🎓 {t.certView}</button>
              ) : eligible ? (
                <>
                  <div style={{ fontSize: 12, color: 'var(--green-chip-fg)', fontWeight: 600 }}>{t.certEligibleNote}</div>
                  <button className="btn-primary" onClick={() => generate(course.id)}>{t.certGenerate}</button>
                </>
              ) : (
                <div style={{ fontSize: 12.5, color: 'var(--faint)', display: 'flex', alignItems: 'center', gap: 6 }}>🔒 {t.certLocked}</div>
              )}
            </div>
          ))}
        </div>
      )}

      {viewing && (
        <CertificateModal cert={viewing} center={centerDisplay} t={t} onClose={() => setViewing(null)} onDownload={() => showToast(t.certDownloaded)} />
      )}
    </div>
  );
}

function CertificateModal({ cert, center, t, onClose, onDownload }) {
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(22,19,15,.6)', zIndex: 90, display: 'grid', placeItems: 'center', padding: 20 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ width: 'min(560px,100%)', animation: 'leoIn .2s ease' }}>
        {/* the certificate */}
        <div
          style={{
            background: 'linear-gradient(180deg,#FFFDFB,#FFF6EE)',
            border: '3px double var(--brand)',
            borderRadius: 14,
            padding: '34px 32px',
            textAlign: 'center',
            boxShadow: 'var(--shadow-pop)'
          }}
        >
          <div style={{ fontSize: 30 }}>🎓</div>
          <div className="display" style={{ fontSize: 22, letterSpacing: '.04em', color: 'var(--brand-deep)', marginTop: 6 }}>
            {t.certHeading}
          </div>
          <div style={{ width: 54, height: 3, background: 'var(--brand)', margin: '14px auto', borderRadius: 2 }} />
          <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>{t.certBody1}</div>
          <div style={{ fontSize: 24, fontWeight: 800, margin: '8px 0', color: 'var(--coal)' }}>{cert.studentName}</div>
          <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>{t.certBody2}</div>
          <div style={{ fontSize: 17, fontWeight: 700, margin: '8px 0 4px' }}>{cert.courseTitle}</div>
          <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 10 }}>{t.certAwarded}: <b>{center}</b></div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 22, marginTop: 16, flexWrap: 'wrap' }}>
            <div><div style={{ fontSize: 10.5, color: 'var(--faint)', fontWeight: 600 }}>{t.certNo}</div><div className="mono" style={{ fontSize: 12.5, fontWeight: 700 }}>{cert.certNo}</div></div>
            <div><div style={{ fontSize: 10.5, color: 'var(--faint)', fontWeight: 600 }}>{t.certDate}</div><div className="mono" style={{ fontSize: 12.5, fontWeight: 700 }}>{cert.issuedAt}</div></div>
            <div><div style={{ fontSize: 10.5, color: 'var(--faint)', fontWeight: 600 }}>{t.completion}</div><div className="mono" style={{ fontSize: 12.5, fontWeight: 700 }}>{cert.completion}%</div></div>
          </div>
        </div>
        {/* actions */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 16 }}>
          <button className="btn-dark" onClick={onDownload} style={{ borderRadius: 10, padding: '11px 24px' }}>⬇ {t.certDownload}</button>
          <button className="btn-ghost-sm" onClick={onClose} style={{ padding: '11px 20px' }}>{t.done}</button>
        </div>
      </div>
    </div>
  );
}
