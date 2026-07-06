'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';

const inputStyle = {
  border: '1px solid var(--field-line)',
  background: 'var(--field)',
  borderRadius: 8,
  padding: '8px 11px',
  fontSize: 13.5,
  fontFamily: 'inherit'
};

export default function TeacherSubmissions() {
  const { t, courses, submissions, api, showToast } = useApp();
  const [drafts, setDrafts] = useState({}); // { [submissionId]: { marks, feedback } }

  // resolve an assignment lesson's title + its course title
  const lessonInfo = (lessonId) => {
    for (const c of courses) {
      for (const m of c.modules) {
        const l = m.lessons.find((x) => x.id === lessonId);
        if (l) return { lessonTitle: l.title, courseTitle: c.title };
      }
    }
    return { lessonTitle: '—', courseTitle: '—' };
  };

  const toGrade = submissions.filter((s) => s.status === 'submitted');
  const graded = submissions.filter((s) => s.status === 'graded');

  const setDraft = (id, patch) => setDrafts((d) => ({ ...d, [id]: { ...d[id], ...patch } }));

  const grade = async (s) => {
    const d = drafts[s.id] || {};
    const marks = d.marks === '' || d.marks == null ? null : Number(d.marks);
    await api.gradeSubmission(s.id, marks, d.feedback || '');
    showToast(t.subGradedToast);
  };

  return (
    <div className="anim-in">
      <h2 style={{ margin: '0 0 20px', fontSize: 24, fontWeight: 700 }}>{t.tSubmissions}</h2>

      {/* awaiting grading */}
      <div style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--ink-soft)', marginBottom: 12 }}>
        {t.subToGrade} · {toGrade.length}
      </div>
      {toGrade.length === 0 ? (
        <div className="card" style={{ padding: 22, textAlign: 'center', color: 'var(--faint)', fontSize: 13.5, marginBottom: 26 }}>{t.subNone}</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 26 }}>
          {toGrade.map((s) => {
            const info = lessonInfo(s.lessonId);
            const d = drafts[s.id] || {};
            return (
              <div key={s.id} className="card" style={{ padding: 18 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{info.lessonTitle}</div>
                    <div style={{ fontSize: 12.5, color: 'var(--faint)', marginTop: 2 }}>
                      {info.courseTitle} · {t.subStudent}: <span style={{ fontWeight: 600, color: 'var(--ink-soft)' }}>{s.studentName}</span>
                    </div>
                  </div>
                  <span className="chip chip-orange" style={{ flex: 'none' }}>{t.subSubmittedOn}: {s.submittedAt}</span>
                </div>

                {s.content && (
                  <div style={{ marginTop: 10, fontSize: 13, color: 'var(--ink-soft)', background: 'var(--paper)', borderRadius: 10, padding: '10px 12px', lineHeight: 1.6 }}>
                    {s.content}
                  </div>
                )}

                <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                  <div style={{ width: 130 }}>
                    <label className="label" style={{ fontSize: 12, marginBottom: 4, display: 'block' }}>{t.subMarks} (/{s.maxMarks})</label>
                    <input
                      type="number" min={0} max={s.maxMarks}
                      value={d.marks ?? ''}
                      onChange={(e) => setDraft(s.id, { marks: e.target.value })}
                      style={{ ...inputStyle, width: '100%' }}
                    />
                  </div>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <label className="label" style={{ fontSize: 12, marginBottom: 4, display: 'block' }}>{t.subFeedback}</label>
                    <input
                      value={d.feedback ?? ''}
                      onChange={(e) => setDraft(s.id, { feedback: e.target.value })}
                      style={{ ...inputStyle, width: '100%' }}
                    />
                  </div>
                  <button className="btn-primary" onClick={() => grade(s)}>{t.subGrade}</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* graded */}
      {graded.length > 0 && (
        <>
          <div style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--ink-soft)', marginBottom: 12 }}>
            {t.subGraded} · {graded.length}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {graded.map((s) => {
              const info = lessonInfo(s.lessonId);
              return (
                <div key={s.id} className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{info.lessonTitle}</div>
                    <div style={{ fontSize: 12, color: 'var(--faint)', marginTop: 2 }}>{s.studentName} · {info.courseTitle}</div>
                    {s.feedback && <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 4 }}>“{s.feedback}”</div>}
                  </div>
                  <span className="chip chip-green" style={{ flex: 'none' }}>{s.marks}/{s.maxMarks}</span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
