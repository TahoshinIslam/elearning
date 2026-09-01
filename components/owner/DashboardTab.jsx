'use client';

import { useApp } from '@/context/AppContext';

const fmt = (n) => '৳' + n.toLocaleString('en-IN');

export default function DashboardTab() {
  const { t, students, batches, courses } = useApp();

  // one-time purchase model: a student is either a buyer (paid) or not — no dues
  const buyers = students.filter((s) => s.paid);
  const revenue = buyers.reduce((a, s) => a + s.amount, 0);
  const totalStudents = 56 + (students.length - 5);

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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(170px,100%),1fr))', gap: 14, marginBottom: 26 }}>
        <div style={{ background: 'var(--coal)', color: '#fff', borderRadius: 16, padding: '18px 20px' }}>
          <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,.6)', fontWeight: 600 }}>{t.statStudents}</div>
          <div className="display" style={{ fontSize: 34, marginTop: 4 }}>{totalStudents}</div>
        </div>
        {stat(t.statCourses, courses.length)}
        {stat(t.statBatches, batches.length)}
        {stat(t.statRevenue, fmt(revenue), 'var(--green)')}
      </div>

      {/* recent course buyers */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #efeae0', fontWeight: 700, fontSize: 15.5 }}>
          {t.recentBuyers}
        </div>
        {buyers.length === 0 ? (
          <div style={{ padding: 20, textAlign: 'center', color: 'var(--faint)', fontSize: 13 }}>{t.noBuyersYet}</div>
        ) : buyers.map((s) => (
          <div key={s.id} className="row-line" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 20px' }}>
            <div className="avatar" style={{ width: 36, height: 36, background: 'var(--line-softer)', fontSize: 14, color: 'var(--muted)' }}>
              {s.name[0]}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 14.5 }}>{s.name}</div>
              <div style={{ fontSize: 12, color: 'var(--faint)' }}>{s.batch}</div>
            </div>
            <div className="display" style={{ fontWeight: 800, fontSize: 15, color: 'var(--green)' }}>
              ৳{s.amount.toLocaleString('en-IN')}
            </div>
            <span className="chip chip-green">✓ {t.paid}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
