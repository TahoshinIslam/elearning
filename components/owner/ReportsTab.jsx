'use client';

import { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';

const TYPES = [
  { key: 'courses', label: 'reportCourses' },
  { key: 'sales', label: 'reportSales' },
  { key: 'students', label: 'reportStudents' },
  { key: 'attendance', label: 'reportAttendance' }
];

export default function ReportsTab() {
  const { t, api } = useApp();
  const [type, setType] = useState('courses');
  const [data, setData] = useState({ columns: [], rows: [], summary: {} });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.getReport(type).then((d) => setData(d)).finally(() => setLoading(false));
  }, [type]);

  const money = (n) => '৳' + Number(n || 0).toLocaleString('en-IN');
  const s = data.summary || {};

  const cards = {
    courses: [[t.reportRevenue, money(s.revenue), 'var(--green)'], [t.reportEnrolled, s.enrolled ?? 0], [t.reportPublished, s.published ?? 0, 'var(--brand)']],
    sales: [[t.reportRevenue, money(s.revenue), 'var(--green)'], [t.reportRefunded, money(s.refunded), 'var(--brand)'], [t.reportTransactions, s.transactions ?? 0]],
    students: [[t.reportTotal, s.students ?? 0], [t.reportPaid, s.paid ?? 0, 'var(--green)']],
    attendance: [[t.reportStudents, s.students ?? 0]]
  }[type] || [];

  return (
    <div className="anim-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 18 }}>
        <div style={{ fontSize: 22, fontWeight: 700 }}>{t.reports}</div>
        <a href={`/api/reports/export?type=${type}`} className="btn-dark" style={{ borderRadius: 10, fontSize: 13.5, textDecoration: 'none', padding: '9px 16px' }}>
          {t.reportExport}
        </a>
      </div>

      {/* type switch */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 18, flexWrap: 'wrap' }}>
        {TYPES.map((x) => (
          <button key={x.key} onClick={() => setType(x.key)} className={`chip ${type === x.key ? 'chip-orange' : ''}`}
            style={{ cursor: 'pointer', border: type === x.key ? 'none' : '1.5px solid var(--line)' }}>
            {t[x.label]}
          </button>
        ))}
      </div>

      {/* summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(160px,100%),1fr))', gap: 14, marginBottom: 20 }}>
        {cards.map(([label, value, color], i) => (
          <div key={i} className="card" style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: 12.5, color: 'var(--muted)', fontWeight: 600 }}>{label}</div>
            <div className="display" style={{ fontSize: 30, marginTop: 4, color: color || 'var(--ink)' }}>{value}</div>
          </div>
        ))}
      </div>

      {/* table */}
      {loading ? (
        <div className="panel" style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>…</div>
      ) : data.rows.length === 0 ? (
        <div className="panel" style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>{t.reportEmpty}</div>
      ) : (
        <div className="card" style={{ overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
            <thead>
              <tr>
                {data.columns.map((c) => (
                  <th key={c.key} style={{ textAlign: 'left', padding: '12px 16px', fontSize: 12, fontWeight: 700, color: 'var(--faint)', borderBottom: '1.5px solid var(--line)', whiteSpace: 'nowrap' }}>{c.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.rows.map((r, i) => (
                <tr key={i} className="row-line">
                  {data.columns.map((c) => (
                    <td key={c.key} style={{ padding: '11px 16px', borderBottom: '1px solid var(--line)', whiteSpace: 'nowrap' }}>
                      {c.key === 'amount' || c.key === 'revenue' ? money(r[c.key]) : String(r[c.key] ?? '—')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
