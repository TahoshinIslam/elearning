'use client';

import { useApp } from '@/context/AppContext';

export default function RecordingsTab() {
  const { t, showToast, enrollments, liveClasses, batches, auth } = useApp();
  const STUDENT_ID = auth?.studentId;

  // recordings the student can watch = ended live classes (with an uploaded recording)
  // in the batches this student is enrolled in
  const myBatchIds = new Set(enrollments.filter((e) => e.studentId === STUDENT_ID).map((e) => e.batchId));
  const recorded = liveClasses.filter((c) => myBatchIds.has(c.batchId) && c.status === 'ended' && c.recordingUrl);

  // group by batch (like a course playlist)
  const groups = [];
  for (const c of recorded) {
    let g = groups.find((x) => x.batchId === c.batchId);
    if (!g) { g = { batchId: c.batchId, name: batches.find((b) => b.id === c.batchId)?.name || '—', rows: [] }; groups.push(g); }
    g.rows.push(c);
  }

  const watch = (c) => {
    showToast(t.playRec);
    window.open(c.recordingUrl, '_blank', 'noopener');
  };

  return (
    <div className="anim-in">
      <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 18 }}>{t.sRecordings}</div>

      {groups.length === 0 && (
        <div className="card" style={{ padding: '28px', textAlign: 'center', color: 'var(--faint)', fontSize: 14 }}>
          {t.lcNoRecordings}
        </div>
      )}

      {groups.map((m) => (
        <div key={m.batchId} className="card" style={{ overflow: 'hidden', marginBottom: 18 }}>
          <div style={{ padding: '14px 20px', fontWeight: 700, fontSize: 15, borderBottom: '1.5px solid var(--line)' }}>
            {m.name} <span style={{ fontSize: 12.5, color: 'var(--faint)', fontWeight: 600 }}>· {m.rows.length}</span>
          </div>
          {m.rows.map((r) => (
            <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', borderTop: '1px solid var(--line-softer)', flexWrap: 'wrap' }}>
              <span style={{ color: 'var(--green)', fontSize: 18, lineHeight: 1 }}>✓</span>
              <div style={{ flex: 1, minWidth: 180 }}>
                <div style={{ fontWeight: 600, fontSize: 13.5, lineHeight: 1.5 }}>{r.title}</div>
                <div style={{ fontSize: 11.5, color: 'var(--faint)' }}>{r.classDate}{r.startTime ? ` · ${r.startTime}` : ''}</div>
              </div>
              <button className="btn-ghost-sm" onClick={() => watch(r)}>▶ {t.watch}</button>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
