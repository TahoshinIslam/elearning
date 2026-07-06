'use client';

import { useApp } from '@/context/AppContext';

const fmt = (n) => '৳' + n.toLocaleString('en-IN');

export default function DashboardTab() {
  const { t, lang, students, batches, showToast } = useApp();

  const unpaid = students.filter((s) => !s.paid);
  const collected = students.filter((s) => s.paid).reduce((a, s) => a + s.amount, 0);
  const due = unpaid.reduce((a, s) => a + s.amount, 0);
  const totalStudents = 56 + (students.length - 5);

  const remindOne = (name) =>
    showToast(lang === 'bn' ? `${name}-কে SMS রিমাইন্ডার পাঠানো হয়েছে` : `SMS reminder sent to ${name}`);
  const remindAll = () =>
    showToast(lang === 'bn' ? `${unpaid.length} জনকে SMS রিমাইন্ডার পাঠানো হয়েছে` : `SMS reminders sent to ${unpaid.length} students`);

  const stat = (label, value, valueColor) => (
    <div className="card" style={{ padding: '18px 20px' }}>
      <div style={{ fontSize: 12.5, color: 'var(--muted)', fontWeight: 600 }}>{label}</div>
      <div className="display" style={{ fontSize: 34, marginTop: 4, color: valueColor }}>{value}</div>
    </div>
  );

  return (
    <div className="anim-in">
      <h2 style={{ margin: '0 0 20px', fontSize: 24, fontWeight: 700 }}>{t.dash}</h2>

      {/* stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 14, marginBottom: 26 }}>
        <div style={{ background: 'var(--coal)', color: '#fff', borderRadius: 16, padding: '18px 20px' }}>
          <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,.6)', fontWeight: 600 }}>{t.statStudents}</div>
          <div className="display" style={{ fontSize: 34, marginTop: 4 }}>{totalStudents}</div>
        </div>
        {stat(t.statBatches, batches.length)}
        {stat(t.statCollected, fmt(collected), 'var(--green)')}
        {stat(t.statDue, fmt(due), 'var(--brand)')}
      </div>

      {/* dues alert list */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #efeae0' }}>
          <div style={{ fontWeight: 700, fontSize: 15.5 }}>⚠ {t.dueAlert}</div>
          <button
            onClick={remindAll}
            style={{ border: 'none', background: 'var(--brand-wash)', color: 'var(--brand-deep)', borderRadius: 99, padding: '7px 16px', fontSize: 12.5, fontWeight: 700 }}
          >
            {t.remindAll}
          </button>
        </div>
        {unpaid.map((s) => (
          <div key={s.id} className="row-line" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 20px' }}>
            <div className="avatar" style={{ width: 36, height: 36, background: 'var(--line-softer)', fontSize: 14, color: 'var(--muted)' }}>
              {s.name[0]}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 14.5 }}>{s.name}</div>
              <div style={{ fontSize: 12, color: 'var(--faint)' }}>{s.batch}</div>
            </div>
            <div className="display" style={{ fontWeight: 800, fontSize: 15, color: 'var(--brand)' }}>
              ৳{s.amount.toLocaleString('en-IN')}
            </div>
            <button className="btn-ghost-sm" onClick={() => remindOne(s.name)}>{t.remind}</button>
          </div>
        ))}
      </div>
    </div>
  );
}
