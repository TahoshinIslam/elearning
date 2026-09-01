'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import RoleGuard from '@/components/RoleGuard';
import SiteNav from '@/components/SiteNav';
import ClassesTab from '@/components/student/ClassesTab';
import CoursesTab from '@/components/student/CoursesTab';
import QuizzesTab from '@/components/student/QuizzesTab';
import WishlistTab from '@/components/student/WishlistTab';
import ReferralTab from '@/components/student/ReferralTab';
import RecordingsTab from '@/components/student/RecordingsTab';
import ResourcesTab from '@/components/student/ResourcesTab';
import ProfileTab from '@/components/student/ProfileTab';
import CertificatesTab from '@/components/student/CertificatesTab';
import CareerTab from '@/components/student/CareerTab';
import PayModal from '@/components/student/PayModal';

const TABS = [
  { key: 'classes', label: 'sClasses' },
  { key: 'courses', label: 'myCourses' },
  { key: 'quizzes', label: 'sQuizzes' },
  { key: 'wishlist', label: 'wishlist' },
  { key: 'recordings', label: 'sRecordings' },
  { key: 'resources', label: 'sResources' },
  { key: 'certificates', label: 'sCertificates' },
  { key: 'career', label: 'career' },
  { key: 'referral', label: 'referral' },
  { key: 'profile', label: 'sProfile' }
];

function StudentPageInner() {
  const { t, auth, enrollments, batches } = useApp();
  const [tab, setTab] = useState('classes');
  const [payOpen, setPayOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);

  const studentName = auth?.name || t.roleStudent;
  // batch label from the student's first active enrollment (else role)
  const firstEnrollment = enrollments.find((e) => e.studentId === auth?.studentId);
  const batchLabel = batches.find((b) => b.id === firstEnrollment?.batchId)?.name || t.roleStudent;
  const pick = (k) => { setTab(k); setNavOpen(false); };

  return (
    <>
    <SiteNav />
    <div className="shell">
      {/* sidebar (slide-in drawer on small screens) */}
      <aside className={`sidebar ${navOpen ? 'open' : ''}`}>
        <div className="hide-mobile" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 12px 16px' }}>
          <div className="avatar" style={{ width: 38, height: 38, background: 'var(--brand)', color: '#fff', fontSize: 15 }}>{studentName[0]}</div>
          <div style={{ lineHeight: 1.25, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{studentName}</div>
            <div style={{ fontSize: 10.5, color: 'var(--faint)' }}>{batchLabel}</div>
          </div>
        </div>

        {TABS.map(({ key, label }) => (
          <button key={key} className={`side-tab ${tab === key ? 'active' : ''}`} onClick={() => pick(key)}>
            {t[label]}
          </button>
        ))}
      </aside>

      {/* backdrop closes the drawer */}
      <div className={`sidebar-backdrop ${navOpen ? 'show' : ''}`} onClick={() => setNavOpen(false)} />

      {/* main */}
      <main className="dash-main">
        <div style={{ maxWidth: 1040, margin: '0 auto' }}>
          <button className="drawer-toggle" onClick={() => setNavOpen(true)}>☰ {t.menu}</button>
          {tab === 'classes' && <ClassesTab onOpenPay={() => setPayOpen(true)} />}
          {tab === 'courses' && <CoursesTab />}
          {tab === 'quizzes' && <QuizzesTab />}
          {tab === 'wishlist' && <WishlistTab />}
          {tab === 'recordings' && <RecordingsTab />}
          {tab === 'resources' && <ResourcesTab />}
          {tab === 'certificates' && <CertificatesTab />}
          {tab === 'career' && <CareerTab />}
          {tab === 'referral' && <ReferralTab />}
          {tab === 'profile' && <ProfileTab />}
        </div>
      </main>

      {payOpen && <PayModal onClose={() => setPayOpen(false)} />}
    </div>
    </>
  );
}

export default function StudentPage() {
  return <RoleGuard allow="student"><StudentPageInner /></RoleGuard>;
}
