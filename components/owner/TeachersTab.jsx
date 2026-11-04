'use client';

import { useApp } from '@/context/AppContext';

const COLORS = ['#E8590C', '#1D4ED8', '#0E9F6E', '#7C3AED'];

export default function TeachersTab() {
  const { t, lang, teachers, batches, courses, payments, addTeacher, assignTeacher, removeTeacherBatch, showToast } = useApp();
  const batchNames = batches.map((b) => b.name);

  // earnings = successful payments for courses this instructor teaches (by id or name)
  const earningsFor = (tc) => {
    const courseIds = new Set(courses.filter((c) => c.instructorId === tc.id || c.instructor === tc.name).map((c) => c.id));
    return payments.filter((p) => p.status === 'success' && courseIds.has(p.courseId)).reduce((a, p) => a + Number(p.amount), 0);
  };

  const handleAdd = async () => {
    await addTeacher();
    showToast(lang === 'bn' ? 'নতুন শিক্ষক যোগ হয়েছে ✓' : 'Teacher added ✓');
  };

  const handleAssign = async (teacher, batchName) => {
    if (!batchName) return;
    await assignTeacher(teacher.id, batchName);
    showToast(
      lang === 'bn' ? `${teacher.name} — "${batchName}" ব্যাচে অ্যাসাইন হয়েছে ✓` : `${teacher.name} assigned to "${batchName}" ✓`
    );
  };

  const handleRemove = async (teacher, batchName) => {
    await removeTeacherBatch(teacher.id, batchName);
    showToast(
      lang === 'bn' ? `"${batchName}" থেকে ${teacher.name}-কে সরানো হয়েছে` : `${teacher.name} removed from "${batchName}"`
    );
  };

  return (
    <div className="anim-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>{t.teachers}</h2>
        <button className="btn-primary" onClick={handleAdd}>+ {t.addTeacher}</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(300px,100%),1fr))', gap: 16 }}>
        {teachers.map((tc, i) => {
          const c = COLORS[i % COLORS.length];
          const assignable = batchNames.filter((bn) => !tc.batches.includes(bn));
          return (
            <div key={tc.id} className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="avatar" style={{ width: 42, height: 42, background: c + '22', color: c, fontSize: 16 }}>
                  {tc.name[0]}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 15.5 }}>{tc.name}</div>
                  <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>
                    {tc.subject} · <span className="mono" style={{ fontSize: 11.5 }}>{tc.phone}</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 10.5, color: 'var(--faint)', fontWeight: 700 }}>{t.instrEarnings}</div>
                  <div className="display" style={{ fontSize: 16, color: 'var(--green)' }}>৳{earningsFor(tc).toLocaleString('en-IN')}</div>
                </div>
              </div>

              <div>
                <div style={{ fontSize: 11.5, color: 'var(--faint)', fontWeight: 700, marginBottom: 6 }}>{t.assignedBatches}</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {tc.batches.map((bn) => (
                    <span
                      key={bn}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        fontSize: 11.5,
                        fontWeight: 700,
                        background: 'var(--line-softer)',
                        color: 'var(--ink-soft)',
                        borderRadius: 0,
                        padding: '4px 6px 4px 11px'
                      }}
                    >
                      {bn}
                      <button
                        aria-label={`Remove from ${bn}`}
                        onClick={() => handleRemove(tc, bn)}
                        style={{
                          border: 'none',
                          background: 'var(--line)',
                          color: 'var(--ink-soft)',
                          borderRadius: '50%',
                          width: 16,
                          height: 16,
                          fontSize: 9,
                          display: 'grid',
                          placeItems: 'center',
                          padding: 0
                        }}
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                  {tc.batches.length === 0 && (
                    <span style={{ fontSize: 12, color: 'var(--faint)' }}>{t.noBatchYet}</span>
                  )}
                </div>
              </div>

              <select
                value=""
                onChange={(e) => handleAssign(tc, e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1.5px solid var(--field-line)',
                  borderRadius: 0,
                  fontSize: 13.5,
                  background: 'var(--field)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  color: 'var(--ink-soft)'
                }}
              >
                <option value="">+ {t.assignToBatch}</option>
                {assignable.map((bn) => (
                  <option key={bn} value={bn}>{bn}</option>
                ))}
              </select>
            </div>
          );
        })}
      </div>
    </div>
  );
}
