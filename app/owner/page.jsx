'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import DashboardTab from '@/components/owner/DashboardTab';
import BatchesTab from '@/components/owner/BatchesTab';
import CoursesTab from '@/components/owner/CoursesTab';
import TeachersTab from '@/components/owner/TeachersTab';
import StudentsTab from '@/components/owner/StudentsTab';
import FeesTab from '@/components/owner/FeesTab';

const TABS = ['dash', 'batches', 'courses', 'teachers', 'students', 'fees'];

export default function OwnerPage() {
  const { t, centerDisplay, slug } = useApp();
  const [tab, setTab] = useState('dash');

  return (
    <div className="shell">
      {/* sidebar */}
      <aside className="sidebar">
        <div className="hide-mobile" style={{ padding: '6px 12px 16px' }}>
          <div style={{ fontWeight: 700, fontSize: 15.5, lineHeight: 1.3 }}>{centerDisplay}</div>
          <div className="mono" style={{ fontSize: 11, color: 'var(--faint)' }}>{slug}.leolearning.app</div>
        </div>

        {TABS.map((k) => (
          <button key={k} className={`side-tab ${tab === k ? 'active' : ''}`} onClick={() => setTab(k)}>
            {t[k]}
          </button>
        ))}

        <div className="hide-mobile" style={{ marginTop: 'auto', background: 'var(--brand-wash)', borderRadius: 12, padding: '12px 14px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#9a3412' }}>{t.planChip}</div>
          <div style={{ fontSize: 11.5, color: '#b45309', lineHeight: 1.5 }}>{t.planNote}</div>
        </div>
      </aside>

      {/* main */}
      <main style={{ flex: 1, minWidth: 0, padding: '28px 32px 80px' }}>
        {tab === 'dash' && <DashboardTab />}
        {tab === 'batches' && <BatchesTab />}
        {tab === 'courses' && <CoursesTab />}
        {tab === 'teachers' && <TeachersTab />}
        {tab === 'students' && <StudentsTab />}
        {tab === 'fees' && <FeesTab />}
      </main>
    </div>
  );
}
