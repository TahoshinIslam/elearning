'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import RoleGuard from '@/components/RoleGuard';
import SiteNav from '@/components/SiteNav';
import { sectionsForSession } from '@/lib/rbac';
import AnnouncementComposer from '@/components/AnnouncementComposer';
import CouponsTab from '@/components/owner/CouponsTab';
import ReportsTab from '@/components/owner/ReportsTab';
import ReviewsTab from '@/components/owner/ReviewsTab';
import BlogTab from '@/components/owner/BlogTab';
import MessagesTab from '@/components/owner/MessagesTab';
import EnrollmentsTab from '@/components/owner/EnrollmentsTab';
import HomepageTab from '@/components/owner/HomepageTab';
import PathsTab from '@/components/owner/PathsTab';
import AffiliatesTab from '@/components/owner/AffiliatesTab';
import CategoriesTab from '@/components/owner/CategoriesTab';
import UsersTab from '@/components/owner/UsersTab';
import PaymentsTab from '@/components/owner/PaymentsTab';
import SettingsTab from '@/components/owner/SettingsTab';
import DashboardTab from '@/components/owner/DashboardTab';
import BatchesTab from '@/components/owner/BatchesTab';
import CoursesTab from '@/components/owner/CoursesTab';
import TeachersTab from '@/components/owner/TeachersTab';
import StudentsTab from '@/components/owner/StudentsTab';
import FeesTab from '@/components/owner/FeesTab';
// merged teacher/mentor sections
import TeacherClasses from '@/components/teacher/TeacherClasses';
import TeacherAttendance from '@/components/teacher/TeacherAttendance';
import TeacherSubmissions from '@/components/teacher/TeacherSubmissions';
import TeacherQuizzes from '@/components/teacher/TeacherQuizzes';

// Merged owner + teacher + mentor dashboard. Each entry is one sidebar section;
// the sidebar shows only the sections the signed-in user is allowed to open.
const SECTION_META = {
  dash:        { label: 'dash',        Comp: DashboardTab },
  courses:     { label: 'courses',     Comp: CoursesTab },
  categories:  { label: 'categories',  Comp: CategoriesTab },
  paths:       { label: 'paths',       Comp: PathsTab },
  batches:     { label: 'batches',     Comp: BatchesTab },
  students:    { label: 'students',    Comp: StudentsTab },
  teachers:    { label: 'teachers',    Comp: TeachersTab },
  enroll:      { label: 'enroll',      Comp: EnrollmentsTab },
  classes:     { label: 'tClasses',    Comp: TeacherClasses },
  attendance:  { label: 'tAttendance', Comp: TeacherAttendance },
  submissions: { label: 'tSubmissions',Comp: TeacherSubmissions },
  quizzes:     { label: 'tQuizzes',    Comp: TeacherQuizzes },
  fees:        { label: 'fees',        Comp: FeesTab },
  payments:    { label: 'payments',    Comp: PaymentsTab },
  coupons:     { label: 'coupons',     Comp: CouponsTab },
  affiliates:  { label: 'affiliates',  Comp: AffiliatesTab },
  reviews:     { label: 'reviews',     Comp: ReviewsTab },
  blog:        { label: 'blog',        Comp: BlogTab },
  homepage:    { label: 'homepage',    Comp: HomepageTab },
  messages:    { label: 'messages',    Comp: MessagesTab },
  reports:     { label: 'reports',     Comp: ReportsTab },
  users:       { label: 'users',       Comp: UsersTab },
  announce:    { label: 'announce',    Comp: AnnouncementComposer },
  settings:    { label: 'settings',    Comp: SettingsTab }
};

function DashboardInner() {
  const { t, centerDisplay, slug, auth } = useApp();
  const sections = sectionsForSession(auth);
  const [tab, setTab] = useState(sections[0] || 'dash');
  const [navOpen, setNavOpen] = useState(false);

  // if the granted sections change (or first paint) keep the active tab valid
  const active = sections.includes(tab) ? tab : sections[0];
  const Comp = active ? (SECTION_META[active]?.Comp || (() => null)) : null;
  const isStaff = auth?.role === 'teacher';
  const pick = (k) => { setTab(k); setNavOpen(false); };

  return (
    <>
    <SiteNav />
    <div className="shell">
      {/* sidebar (slide-in drawer on small screens) */}
      <aside className={`sidebar ${navOpen ? 'open' : ''}`}>
        <div className="hide-mobile" style={{ padding: '6px 12px 16px' }}>
          <div style={{ fontWeight: 700, fontSize: 15.5, lineHeight: 1.3 }}>{centerDisplay}</div>
          <div className="mono" style={{ fontSize: 11, color: 'var(--faint)' }}>
            {isStaff ? `${auth?.name} · ${t.roleTeacher}` : `${slug}.leolearning.app`}
          </div>
        </div>

        {sections.map((k) => (
          <button key={k} className={`side-tab ${active === k ? 'active' : ''}`} onClick={() => pick(k)}>
            {t[SECTION_META[k]?.label] || k}
          </button>
        ))}

        {!isStaff && (
          <div className="hide-mobile" style={{ marginTop: 'auto', background: 'var(--brand-wash)', borderRadius: 12, padding: '12px 14px' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#9a3412' }}>{t.planChip}</div>
            <div style={{ fontSize: 11.5, color: '#b45309', lineHeight: 1.5 }}>{t.planNote}</div>
          </div>
        )}
      </aside>

      {/* backdrop closes the drawer */}
      <div className={`sidebar-backdrop ${navOpen ? 'show' : ''}`} onClick={() => setNavOpen(false)} />

      {/* main */}
      <main className="dash-main">
        <button className="drawer-toggle" onClick={() => setNavOpen(true)}>☰ {t.menu}</button>
        {Comp
          ? <Comp onGoTab={setTab} />
          : <div className="panel" style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>{t.noSectionAccess}</div>}
      </main>
    </div>
    </>
  );
}

export default function DashboardPage() {
  return <RoleGuard allow={['owner', 'superadmin', 'teacher']}><DashboardInner /></RoleGuard>;
}
