'use client';

import { useState, useEffect, useMemo } from 'react';
import { useApp } from '@/context/AppContext';

const inputStyle = {
  border: '1px solid var(--field-line)',
  background: 'var(--field)',
  borderRadius: 8,
  padding: '9px 12px',
  fontSize: 14,
  fontFamily: 'inherit'
};

const TODAY = '2026-07-06';

export default function TeacherAttendance() {
  const { t, batches, students, enrollments, attendance, api, showToast } = useApp();

  const [batchId, setBatchId] = useState(batches[0]?.id ?? null);
  const [date, setDate] = useState(TODAY);
  const [title, setTitle] = useState('');
  const [present, setPresent] = useState({}); // { [studentId]: bool }

  // roster = students enrolled in the selected batch
  const roster = useMemo(() => {
    const ids = enrollments.filter((e) => e.batchId === batchId).map((e) => e.studentId);
    return students.filter((s) => ids.includes(s.id));
  }, [enrollments, students, batchId]);

  // prefill present/title from any existing records for this batch+date
  useEffect(() => {
    const existing = attendance.filter((a) => a.batchId === batchId && a.date === date);
    const map = {};
    roster.forEach((s) => {
      const row = existing.find((a) => a.studentId === s.id);
      map[s.id] = row ? row.present : true; // default present
    });
    setPresent(map);
    setTitle(existing[0]?.title || '');
  }, [batchId, date, attendance, roster]);

  const toggle = (sid) => setPresent((p) => ({ ...p, [sid]: !p[sid] }));
  const markAll = () => setPresent(Object.fromEntries(roster.map((s) => [s.id, true])));

  const save = async () => {
    await api.saveAttendance({
      batchId,
      date,
      title: title.trim(),
      records: roster.map((s) => ({ studentId: s.id, present: !!present[s.id] }))
    });
    showToast(t.attSaved);
  };

  const presentCount = roster.filter((s) => present[s.id]).length;

  return (
    <div className="anim-in">
      <h2 style={{ margin: '0 0 20px', fontSize: 24, fontWeight: 700 }}>{t.tAttendance}</h2>

      {/* controls */}
      <div className="card" style={{ padding: 18, marginBottom: 18 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 180 }}>
            <label className="label" style={{ fontSize: 12.5, marginBottom: 5, display: 'block' }}>{t.attBatch}</label>
            <select style={{ ...inputStyle, width: '100%' }} value={batchId ?? ''} onChange={(e) => setBatchId(Number(e.target.value))}>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
          <div style={{ width: 160 }}>
            <label className="label" style={{ fontSize: 12.5, marginBottom: 5, display: 'block' }}>{t.attDate}</label>
            <input type="date" style={{ ...inputStyle, width: '100%' }} value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div style={{ flex: 2, minWidth: 200 }}>
            <label className="label" style={{ fontSize: 12.5, marginBottom: 5, display: 'block' }}>{t.attTopic}</label>
            <input style={{ ...inputStyle, width: '100%' }} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="—" />
          </div>
        </div>
      </div>

      {/* roster */}
      {roster.length === 0 ? (
        <div className="card" style={{ padding: 24, textAlign: 'center', color: 'var(--faint)', fontSize: 13.5 }}>{t.attNoRoster}</div>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
            <div style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 600 }}>{t.present}: {presentCount}/{roster.length}</div>
            <button className="btn-ghost-sm" onClick={markAll}>{t.attMarkAll}</button>
          </div>
          <div className="card" style={{ overflow: 'hidden', marginBottom: 18 }}>
            {roster.map((s) => (
              <div key={s.id} className="row-line" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 18px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{s.name}</div>
                  <div className="mono" style={{ fontSize: 12, color: 'var(--faint)' }}>{s.phone}</div>
                </div>
                <button
                  onClick={() => toggle(s.id)}
                  className={`chip ${present[s.id] ? 'chip-green' : 'chip-red'}`}
                  style={{ cursor: 'pointer', border: 'none', fontFamily: 'inherit', padding: '6px 16px' }}
                >
                  {present[s.id] ? t.present : t.absent}
                </button>
              </div>
            ))}
          </div>
          <button className="btn-primary" onClick={save}>{t.attSave}</button>
        </>
      )}
    </div>
  );
}
