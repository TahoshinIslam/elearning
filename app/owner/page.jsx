'use client';

import { Suspense, useEffect, useState } from 'react';
import { useShellNav } from '@/components/ui/useShellNav';
import SidebarSiteLinks from '@/components/ui/SidebarSiteLinks';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import RoleGuard from '@/components/RoleGuard';
import SiteNav from '@/components/SiteNav';
import Icon from '@/components/Icon';
import { sectionsForSession } from '@/lib/rbac';
import { ADMIN_GROUPS, sectionText } from '@/components/owner/adminNav';
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
import ClassLevelsTab from '@/components/owner/ClassLevelsTab';
import UsersTab from '@/components/owner/UsersTab';
import PaymentsTab from '@/components/owner/PaymentsTab';
import OffersTab from '@/components/owner/OffersTab';
import CampaignsTab from '@/components/owner/CampaignsTab';
import SettingsTab from '@/components/owner/SettingsTab';
import DashboardTab from '@/components/owner/DashboardTab';
import BatchesTab from '@/components/owner/BatchesTab';
import CoursesTab from '@/components/owner/CoursesTab';
import TeachersTab from '@/components/owner/TeachersTab';
import StudentsTab from '@/components/owner/StudentsTab';
import FeesTab from '@/components/owner/FeesTab';
import TeacherClasses from '@/components/teacher/TeacherClasses';
import TeacherAttendance from '@/components/teacher/TeacherAttendance';
import TeacherSubmissions from '@/components/teacher/TeacherSubmissions';
import TeacherQuizzes from '@/components/teacher/TeacherQuizzes';

const COMPONENTS = {
  dash: DashboardTab, courses: CoursesTab, categories: CategoriesTab, levels: ClassLevelsTab, paths: PathsTab,
  batches: BatchesTab, students: StudentsTab, teachers: TeachersTab, enroll: EnrollmentsTab,
  classes: TeacherClasses, attendance: TeacherAttendance, submissions: TeacherSubmissions, quizzes: TeacherQuizzes,
  fees: FeesTab, payments: PaymentsTab, offers: OffersTab, coupons: CouponsTab, campaigns: CampaignsTab, affiliates: AffiliatesTab,
  reviews: ReviewsTab, blog: BlogTab, homepage: HomepageTab, messages: MessagesTab, reports: ReportsTab,
  users: UsersTab, announce: AnnouncementComposer, settings: SettingsTab
};
const NAV_KEY = 'leo_admin_nav_collapsed';

// Owner / staff workspace. The section lives in the URL (?section=) so it
// is linkable and survives refresh and back/forward. The sidebar collapses
// to icons on desktop and becomes a drawer on small screens.
function AdminWorkspace() {
  const { lang, auth, t } = useApp();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const allowed = sectionsForSession(auth);
  const requested = params.get('section');
  const active = allowed.includes(requested) ? requested : allowed[0];
  const { open: navOpen, close: closeNav, sidebarRef } = useShellNav();
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => { try { setCollapsed(localStorage.getItem(NAV_KEY) === '1'); } catch { /* ignore */ } }, []);
  const toggleCollapsed = () => setCollapsed((v) => { try { localStorage.setItem(NAV_KEY, v ? '0' : '1'); } catch { /* ignore */ } return !v; });
  const go = (k) => { closeNav(); router.push(`${pathname}?section=${k}`, { scroll: false }); window.scrollTo({ top: 0 }); };
  const en = lang === 'en';
  const Comp = active ? COMPONENTS[active] : null;
  const head = active ? sectionText(active, lang) : null;
  const group = ADMIN_GROUPS.find((g) => g.items.includes(active));
  const isTeacher = auth?.role === 'teacher';

  return (
    <>
      <SiteNav />
      <div className="shell" data-collapsed={collapsed}>
        <aside ref={sidebarRef} className={`sidebar ${navOpen ? 'open' : ''}`} aria-label={en ? 'Admin navigation' : 'অ্যাডমিন নেভিগেশন'}>
          <div className="side-head">
            <span className="avatar-btn" aria-hidden="true">{String(auth?.name || 'L').charAt(0).toUpperCase()}</span>
            <div className="side-head-text">
              <div className="strong" style={{ fontSize: 15 }}>{en ? 'Admin' : 'অ্যাডমিন'}</div>
              <div className="xsmall muted">{auth?.name} · {isTeacher ? t.roleTeacher : auth?.role === 'superadmin' ? 'Superadmin' : (en ? 'Owner' : 'মালিক')}</div>
            </div>
          </div>
          <nav className="side-nav">
            {ADMIN_GROUPS.map((g) => {
              const items = g.items.filter((k) => allowed.includes(k));
              if (!items.length) return null;
              return (
                <div key={g.key} className="side-group">
                  <div className="side-label">{en ? g.en : g.bn}</div>
                  {items.map((k) => {
                    const st = sectionText(k, lang);
                    return (
                      <button key={k} type="button" className={`side-tab ${active === k ? 'active' : ''}`} aria-current={active === k ? 'page' : undefined}
                        onClick={() => go(k)} title={collapsed ? st.label : undefined} aria-label={collapsed ? st.label : undefined}>
                        <Icon name={st.icon} size={18} /><span className="side-text">{st.label}</span>
                      </button>
                    );
                  })}
                </div>
              );
            })}
            <SidebarSiteLinks onNavigate={closeNav} />
          </nav>
          <button type="button" className="side-tab side-collapse" onClick={toggleCollapsed} aria-pressed={collapsed}>
            <Icon name={collapsed ? 'chevronRight' : 'chevronLeft'} size={18} /><span className="side-text">{en ? 'Collapse menu' : 'মেনু ছোট করুন'}</span>
          </button>
        </aside>
        <div className={`sidebar-backdrop ${navOpen ? 'show' : ''}`} onClick={closeNav} aria-hidden="true" />

        <main id="main" className="dash-main">
          <header className="ws-head">
            {head && (
              <>
                <nav aria-label="Breadcrumb">
                  <ol className="breadcrumbs">
                    <li>{en ? 'Admin' : 'অ্যাডমিন'}</li>
                    {group && group.key !== 'overview' && <li>{en ? group.en : group.bn}</li>}
                    <li aria-current="page">{head.label}</li>
                  </ol>
                </nav>
                <h1 className="ws-title">{head.label}</h1>
                {head.desc && <p className="ws-desc">{head.desc}</p>}
              </>
            )}
          </header>
          {Comp ? <Comp onGoTab={go} /> : <div className="surface state"><p>{t.noSectionAccess}</p></div>}
        </main>
      </div>
    </>
  );
}

export default function AdminPage() {
  return (
    <RoleGuard allow={['owner', 'superadmin', 'teacher']}>
      <Suspense fallback={null}><AdminWorkspace /></Suspense>
    </RoleGuard>
  );
}
