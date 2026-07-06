'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import TeacherOverview from '@/components/teacher/TeacherOverview';
import TeacherRoutine from '@/components/teacher/TeacherRoutine';
import TeacherTasks from '@/components/teacher/TeacherTasks';
import TeacherClasses from '@/components/teacher/TeacherClasses';
import TeacherSubmissions from '@/components/teacher/TeacherSubmissions';
import TeacherAttendance from '@/components/teacher/TeacherAttendance';

const TABS = [
  { key: 'overview', label: 'tOverview' },
  { key: 'routine', label: 'tRoutine' },
  { key: 'tasks', label: 'tTasks' },
  { key: 'submissions', label: 'tSubmissions' },
  { key: 'attendance', label: 'tAttendance' },
  { key: 'classes', label: 'tClasses' }
];

export default function TeacherPage() {
  const { t, centerDisplay, auth } = useApp();
  const [tab, setTab] = useState('overview');
  const teacherName = auth?.role === 'teacher' && auth.name ? auth.name : 'আবরার হায়দার';

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="hide-mobile" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 12px 16px' }}>
          <div className="avatar" style={{ width: 38, height: 38, background: 'var(--brand)', color: '#fff', fontSize: 15 }}>
            {teacherName[0]}
          </div>
          <div style={{ lineHeight: 1.25, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{teacherName}</div>
            <div style={{ fontSize: 10.5, color: 'var(--faint)' }}>{t.roleTeacher} · {centerDisplay}</div>
          </div>
        </div>

        {TABS.map(({ key, label }) => (
          <button key={key} className={`side-tab ${tab === key ? 'active' : ''}`} onClick={() => setTab(key)}>
            {t[label]}
          </button>
        ))}
      </aside>

      <main style={{ flex: 1, minWidth: 0, padding: '28px 32px 80px' }}>
        {tab === 'overview' && <TeacherOverview onGoTab={setTab} />}
        {tab === 'routine' && <TeacherRoutine />}
        {tab === 'tasks' && <TeacherTasks />}
        {tab === 'submissions' && <TeacherSubmissions />}
        {tab === 'attendance' && <TeacherAttendance />}
        {tab === 'classes' && <TeacherClasses />}
      </main>
    </div>
  );
}
