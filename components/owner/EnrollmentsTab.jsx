'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';

const fieldStyle = {
  border: '1px solid var(--field-line)', background: '#fff', borderRadius: 8,
  padding: '9px 11px', fontSize: 13.5, fontFamily: 'inherit', width: '100%'
};

export default function EnrollmentsTab() {
  const { t, enrollments, students, batches, api, showToast } = useApp();
  const [studentId, setStudentId] = useState('');
  const [batchId, setBatchId] = useState('');
  const [busy, setBusy] = useState(false);

  const studentName = (id) => students.find((s) => s.id === id)?.name || `#${id}`;
  const batchName = (id) => batches.find((b) => b.id === id)?.name || `#${id}`;

  const doEnroll = async () => {
    if (!studentId || !batchId) { showToast(t.enrollPick); return; }
    setBusy(true);
    try {
      await api.enroll(Number(studentId), Number(batchId));
      showToast(t.enrollDone);
      setStudentId(''); setBatchId('');
    } catch (e) {
      showToast(e?.data?.error === 'Already enrolled' ? t.enrollDone : t.errGeneric);
    } finally { setBusy(false); }
  };

  const cancel = async (id) => {
    try { await api.unenroll(id); showToast(t.enrollCancelled); } catch { showToast(t.errGeneric); }
  };

  return (
    <div className="anim-in">
      <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 18 }}>{t.enroll}</div>

      {/* manual enroll */}
      <div className="panel" style={{ padding: 20, marginBottom: 22 }}>
        <div style={{ fontWeight: 700, marginBottom: 14 }}>{t.enrollManual}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 12, alignItems: 'end' }}>
          <div>
            <label className="label">{t.enrollStudentL}</label>
            <select value={studentId} onChange={(e) => setStudentId(e.target.value)} style={fieldStyle}>
              <option value="">— {t.enrollPick} —</option>
              {students.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">{t.enrollBatchL}</label>
            <select value={batchId} onChange={(e) => setBatchId(e.target.value)} style={fieldStyle}>
              <option value="">— {t.enrollPick} —</option>
              {batches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <button className="btn-primary" style={{ borderRadius: 10, height: 38 }} disabled={busy} onClick={doEnroll}>＋ {t.enrollAdd}</button>
        </div>
      </div>

      {/* list */}
      {enrollments.length === 0 ? (
        <div className="panel" style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>{t.enrollNone}</div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1.4fr 1fr auto', gap: 10, padding: '12px 18px', fontSize: 12, fontWeight: 700, color: 'var(--faint)', borderBottom: '1.5px solid var(--line)' }}>
            <div>{t.enrollStudentL}</div><div>{t.enrollBatchL}</div><div>{t.enrollActive}</div><div />
          </div>
          {enrollments.map((e) => (
            <div key={e.id} className="row-line" style={{ display: 'grid', gridTemplateColumns: '1.4fr 1.4fr 1fr auto', gap: 10, padding: '13px 18px', alignItems: 'center', fontSize: 13.5 }}>
              <div style={{ fontWeight: 600 }}>{studentName(e.studentId)}</div>
              <div>{batchName(e.batchId)}</div>
              <div><span className={`chip ${e.status === 'active' ? 'chip-green' : ''}`} style={{ border: e.status === 'active' ? 'none' : '1.5px solid var(--line)' }}>{e.status === 'active' ? t.enrollActive : t.enrollCancelled}</span></div>
              <button onClick={() => cancel(e.id)} className="chip" style={{ cursor: 'pointer', border: '1.5px solid var(--line)', color: 'var(--danger,#c92a2a)' }}>{t.enrollCancel}</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
