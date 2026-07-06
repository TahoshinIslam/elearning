'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import ClassesTab from '@/components/student/ClassesTab';
import CoursesTab from '@/components/student/CoursesTab';
import RecordingsTab from '@/components/student/RecordingsTab';
import ResourcesTab from '@/components/student/ResourcesTab';
import ProfileTab from '@/components/student/ProfileTab';
import CertificatesTab from '@/components/student/CertificatesTab';
import CareerTab from '@/components/student/CareerTab';
import PayModal from '@/components/student/PayModal';

const TABS = [
  { key: 'classes', label: 'sClasses' },
  { key: 'courses', label: 'myCourses' },
  { key: 'recordings', label: 'sRecordings' },
  { key: 'resources', label: 'sResources' },
  { key: 'certificates', label: 'sCertificates' },
  { key: 'career', label: 'career' },
  { key: 'profile', label: 'sProfile' }
];

export default function StudentPage() {
  const { t } = useApp();
  const [tab, setTab] = useState('classes');
  const [payOpen, setPayOpen] = useState(false);

  return (
    <div className="shell">
      {/* sidebar */}
      <aside className="sidebar">
        <div className="hide-mobile" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 12px 16px' }}>
          <div className="avatar" style={{ width: 38, height: 38, background: 'var(--brand)', color: '#fff', fontSize: 15 }}>তা</div>
          <div style={{ lineHeight: 1.25, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>তানভীর আহমেদ</div>
            <div style={{ fontSize: 10.5, color: 'var(--faint)' }}>HSC ফিজিক্স — ব্যাচ ৩</div>
          </div>
        </div>

        {TABS.map(({ key, label }) => (
          <button key={key} className={`side-tab ${tab === key ? 'active' : ''}`} onClick={() => setTab(key)}>
            {t[label]}
          </button>
        ))}
      </aside>

      {/* main */}
      <main style={{ flex: 1, minWidth: 0, padding: '36px 40px 100px' }}>
        <div style={{ maxWidth: 1040, margin: '0 auto' }}>
          {tab === 'classes' && <ClassesTab onOpenPay={() => setPayOpen(true)} />}
          {tab === 'courses' && <CoursesTab />}
          {tab === 'recordings' && <RecordingsTab />}
          {tab === 'resources' && <ResourcesTab />}
          {tab === 'certificates' && <CertificatesTab />}
          {tab === 'career' && <CareerTab />}
          {tab === 'profile' && <ProfileTab />}
        </div>
      </main>

      {payOpen && <PayModal onClose={() => setPayOpen(false)} />}
    </div>
  );
}
