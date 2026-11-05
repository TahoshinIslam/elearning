'use client';

import { Suspense, useEffect, useState } from 'react';
import { useShellNav } from '@/components/ui/useShellNav';
import SidebarSiteLinks from '@/components/ui/SidebarSiteLinks';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import RoleGuard from '@/components/RoleGuard';
import SiteNav from '@/components/SiteNav';
import Icon from '@/components/Icon';
import { sectionsForSession, levelFor } from '@/lib/rbac';
import { ADMIN_GROUPS, sectionText } from '@/components/owner/adminNav';
import dynamic from 'next/dynamic';
import ActionFeedback from '@/components/admin/ActionFeedback';

// Each section is its own chunk: opening the console doesn't download all 30 screens.
const load = (fn) => dynamic(fn, { loading: () => <div className="stack">{[0, 1, 2].map((i) => <div key={i} className="skeleton" style={{ height: 64 }} />)}</div> });
const AnnouncementComposer = load(() => import('@/components/AnnouncementComposer'));
const CouponsTab = load(() => import('@/components/owner/CouponsTab'));
const ReportsTab = load(() => import('@/components/owner/ReportsTab'));
const ReviewsTab = load(() => import('@/components/owner/ReviewsTab'));
const BlogTab = load(() => import('@/components/owner/BlogTab'));
const MessagesTab = load(() => import('@/components/owner/MessagesTab'));
const EnrollmentsTab = load(() => import('@/components/owner/EnrollmentsTab'));
const HomepageTab = load(() => import('@/components/owner/HomepageTab'));
const PathsTab = load(() => import('@/components/owner/PathsTab'));
const AffiliatesTab = load(() => import('@/components/owner/AffiliatesTab'));
const CategoriesTab = load(() => import('@/components/owner/CategoriesTab'));
const ClassLevelsTab = load(() => import('@/components/owner/ClassLevelsTab'));
const UsersTab = load(() => import('@/components/owner/UsersTab'));
const PaymentsTab = load(() => import('@/components/owner/PaymentsTab'));
const OffersTab = load(() => import('@/components/owner/OffersTab'));
const CampaignsTab = load(() => import('@/components/owner/CampaignsTab'));
const SettingsTab = load(() => import('@/components/owner/SettingsTab'));
const DashboardTab = load(() => import('@/components/owner/DashboardTab'));
const BatchesTab = load(() => import('@/components/owner/BatchesTab'));
const CoursesTab = load(() => import('@/components/owner/CoursesTab'));
const TeachersTab = load(() => import('@/components/owner/TeachersTab'));
const StudentsTab = load(() => import('@/components/owner/StudentsTab'));
const FeesTab = load(() => import('@/components/owner/FeesTab'));
const TeacherClasses = load(() => import('@/components/teacher/TeacherClasses'));
const TeacherAttendance = load(() => import('@/components/teacher/TeacherAttendance'));
const TeacherSubmissions = load(() => import('@/components/teacher/TeacherSubmissions'));
const TeacherQuizzes = load(() => import('@/components/teacher/TeacherQuizzes'));
const AnalyticsTab = load(() => import('@/components/admin/AnalyticsTab'));
const ActivityTab = load(() => import('@/components/admin/ActivityTab'));
const AccessTab = load(() => import('@/components/admin/AccessTab'));
const SecurityTab = load(() => import('@/components/admin/SecurityTab'));
const ProfileTab = load(() => import('@/components/student/views/AccountView'));

const COMPONENTS = {
  dash: DashboardTab, analytics: AnalyticsTab, activity: ActivityTab, access: AccessTab, security: SecurityTab, courses: CoursesTab, categories: CategoriesTab, levels: ClassLevelsTab, paths: PathsTab,
  batches: BatchesTab, students: StudentsTab, teachers: TeachersTab, enroll: EnrollmentsTab,
  classes: TeacherClasses, attendance: TeacherAttendance, submissions: TeacherSubmissions, quizzes: TeacherQuizzes,
  fees: FeesTab, payments: PaymentsTab, offers: OffersTab, coupons: CouponsTab, campaigns: CampaignsTab, affiliates: AffiliatesTab,
  reviews: ReviewsTab, blog: BlogTab, homepage: HomepageTab, messages: MessagesTab, reports: ReportsTab,
  users: UsersTab, announce: AnnouncementComposer, settings: SettingsTab, profile: ProfileTab
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
  // every staff account can edit its own photo and password
  const allowed = [...sectionsForSession(auth), 'profile'];
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
  const roleLabel = { teacher: t.roleTeacher, staff: en ? 'Staff' : 'স্টাফ', superadmin: 'Superadmin', owner: en ? 'Owner' : 'মালিক' }[auth?.role] || '';
  const viewOnly = active && levelFor(auth, active) === 'view';

  return (
    <>
      <SiteNav />
      <div className="shell" data-collapsed={collapsed}>
        <aside ref={sidebarRef} className={`sidebar ${navOpen ? 'open' : ''}`} aria-label={en ? 'Admin navigation' : 'অ্যাডমিন নেভিগেশন'}>
          <div className="side-head">
            <span className="avatar-btn" aria-hidden="true">{auth?.avatarUrl ? <img src={auth.avatarUrl} alt="" /> : String(auth?.name || 'L').charAt(0).toUpperCase()}</span>
            <div className="side-head-text">
              <div className="strong" style={{ fontSize: 15 }}>{en ? 'Admin' : 'অ্যাডমিন'}</div>
              <div className="xsmall muted">{auth?.name} · {roleLabel}</div>
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
                        {levelFor(auth, k) === 'view' && <Icon name="eye" size={14} className="side-text" style={{ marginLeft: 'auto', opacity: 0.7 }} label={en ? 'View only' : 'শুধু দেখা'} />}
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
          {viewOnly && <div className="notice notice-warn view-only-note" role="note"><Icon name="eye" size={18} />{en ? 'View-only access: you can look, but changes will be refused. Ask an owner for Manage access.' : 'শুধু দেখার অনুমতি: দেখতে পারবেন, কিন্তু পরিবর্তন করা যাবে না। পরিবর্তনের অনুমতির জন্য মালিকের সাথে যোগাযোগ করুন।'}</div>}
          {Comp ? <Comp onGoTab={go} readOnly={viewOnly} /> : <div className="surface state"><p>{t.noSectionAccess}</p></div>}
        </main>
      </div>
    </>
  );
}

export default function AdminPage() {
  return (
    <RoleGuard allow={['owner', 'superadmin', 'teacher', 'staff']}>
      <ActionFeedback>
        <Suspense fallback={null}><AdminWorkspace /></Suspense>
      </ActionFeedback>
    </RoleGuard>
  );
}
