'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';

const fieldStyle = {
  border: '1px solid var(--field-line)',
  background: '#fff',
  borderRadius: 8,
  padding: '10px 12px',
  fontSize: 14,
  fontFamily: 'inherit',
  width: '100%'
};

export default function BatchesTab() {
  const { t, lang, batches, teachers, courses, addBatch, setBatchCourse, showToast } = useApp();
  const bn = lang === 'bn';

  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [courseId, setCourseId] = useState('');
  const [fee, setFee] = useState('');
  const [time, setTime] = useState('');

  const courseTitle = (id) => courses.find((c) => c.id === id)?.title || null;

  const teacherNames = (batchName) => {
    const names = teachers.filter((x) => x.batches.includes(batchName)).map((x) => x.name);
    return names.length ? names.join(', ') : bn ? 'অ্যাসাইন হয়নি' : 'Not assigned';
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      showToast(bn ? 'ব্যাচের নাম লিখুন' : 'Enter a batch name');
      return;
    }
    await addBatch({
      name: name.trim(),
      courseId: courseId ? Number(courseId) : null,
      fee: fee.trim() || undefined,
      time: time.trim() || undefined
    });
    setName(''); setCourseId(''); setFee(''); setTime(''); setShowAdd(false);
    showToast(bn ? 'নতুন ব্যাচ তৈরি হয়েছে ✓' : 'New batch created ✓');
  };

  const handleRelink = async (batch, value) => {
    await setBatchCourse(batch.id, value ? Number(value) : null);
    showToast(bn ? 'কোর্স আপডেট হয়েছে' : 'Course updated');
  };

  return (
    <div className="anim-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>{t.batches}</h2>
        <button className="btn-primary" onClick={() => setShowAdd((v) => !v)}>+ {t.addBatch}</button>
      </div>

      {showAdd && (
        <div style={{ background: '#fff9f3', border: '1.5px solid #f2b28a', borderRadius: 14, padding: '18px 20px', marginBottom: 18 }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ flex: 2, minWidth: 200 }}>
              <label className="label" style={{ fontSize: 12.5, marginBottom: 5 }}>{t.batchName}</label>
              <input style={fieldStyle} value={name} onChange={(e) => setName(e.target.value)} placeholder={bn ? 'যেমন: HSC কেমিস্ট্রি — ব্যাচ ১' : 'e.g. HSC Chemistry — Batch 1'} />
            </div>
            <div style={{ flex: 2, minWidth: 200 }}>
              <label className="label" style={{ fontSize: 12.5, marginBottom: 5 }}>{t.courseLabel}</label>
              <select style={fieldStyle} value={courseId} onChange={(e) => setCourseId(e.target.value)}>
                <option value="">{t.selectCourse}</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>
            <div style={{ flex: 1, minWidth: 120 }}>
              <label className="label" style={{ fontSize: 12.5, marginBottom: 5 }}>{t.courseFee}</label>
              <input style={fieldStyle} value={fee} onChange={(e) => setFee(e.target.value)} placeholder="1,500" />
            </div>
            <div style={{ flex: 2, minWidth: 180 }}>
              <label className="label" style={{ fontSize: 12.5, marginBottom: 5 }}>{t.schedule}</label>
              <input style={fieldStyle} value={time} onChange={(e) => setTime(e.target.value)} placeholder={bn ? 'রবি-মঙ্গল · সন্ধ্যা ৬টা' : 'Sun-Tue · 6 PM'} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
            <button className="btn-dark" onClick={handleCreate}>{t.createBatch}</button>
            <button onClick={() => setShowAdd(false)} style={{ border: 'none', background: 'none', color: 'var(--muted)', fontSize: 13, fontWeight: 600, padding: '11px 6px' }}>{t.cancel}</button>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(280px,100%),1fr))', gap: 16 }}>
        {batches.map((b) => {
          const linked = courseTitle(b.courseId);
          return (
            <div key={b.id} className="card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ fontWeight: 700, fontSize: 16, lineHeight: 1.35 }}>{b.name}</div>
                <span className="chip chip-green" style={{ flex: 'none' }}>{t.running}</span>
              </div>

              {/* course link */}
              <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span className={`chip ${linked ? 'chip-orange' : 'chip-stone'}`} style={{ flex: 'none' }}>
                  {linked ? `${t.courseLabel}: ${linked}` : t.noCourse}
                </span>
              </div>
              <select
                value={b.courseId ?? ''}
                onChange={(e) => handleRelink(b, e.target.value)}
                style={{ ...fieldStyle, marginTop: 8, padding: '7px 10px', fontSize: 12.5 }}
              >
                <option value="">{t.noCourse}</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>

              <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 12 }}>{b.time}</div>
              <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 3 }}>
                {t.teacherLabel}: <span style={{ fontWeight: 600, color: 'var(--ink-soft)' }}>{teacherNames(b.name)}</span>
              </div>
              <div style={{ display: 'flex', gap: 20, marginTop: 16, paddingTop: 14, borderTop: '1px dashed var(--line)' }}>
                <div>
                  <div style={{ fontSize: 11.5, color: 'var(--faint)', fontWeight: 600 }}>{t.students}</div>
                  <div className="display" style={{ fontWeight: 800, fontSize: 18 }}>{b.students}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11.5, color: 'var(--faint)', fontWeight: 600 }}>{t.courseFee}</div>
                  <div className="display" style={{ fontWeight: 800, fontSize: 18 }}>৳{b.fee}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
