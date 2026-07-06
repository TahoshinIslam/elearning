'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import CourseMenu from '@/components/CourseMenu';

const ROLE_ROUTE = {
  student: '/student',
  teacher: '/teacher',
  parent: '/parent',
  owner: '/owner',
  superadmin: '/superadmin'
};

export default function SiteNav() {
  const { t, lang, toggleLang, auth, logout, showToast, courses } = useApp();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [coursesOpen, setCoursesOpen] = useState(false);
  const [searchQ, setSearchQ] = useState('');

  const doSearch = (e) => {
    e.preventDefault();
    router.push(searchQ.trim() ? `/courses?q=${encodeURIComponent(searchQ.trim())}` : '/courses');
  };

  const loggedIn = !!auth;
  const dashRoute = (auth && ROLE_ROUTE[auth.role]) || '/login';
  const initial = auth?.name?.[0] || 'U';

  const doLogout = () => {
    logout();
    setMenuOpen(false);
    showToast(lang === 'bn' ? 'লগআউট হয়েছে' : 'Signed out');
    router.push('/landing');
  };

  const navLink = (label, badge) => (
    <button
      onClick={() => showToast(lang === 'bn' ? 'ডেমো লিংক' : 'Demo link')}
      style={{
        position: 'relative', border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit',
        fontSize: 14.5, fontWeight: 600, color: 'var(--ink)', padding: '6px 4px', whiteSpace: 'nowrap'
      }}
    >
      {label}
      {badge && (
        <span
          style={{
            position: 'absolute', top: -6, right: -20, fontSize: 8.5, fontWeight: 800, color: '#fff',
            background: '#DC2626', borderRadius: 99, padding: '1px 5px', letterSpacing: '.04em'
          }}
        >
          {badge}
        </span>
      )}
    </button>
  );

  return (
    <header
      style={{
        position: 'sticky', top: 0, zIndex: 50, background: '#fff',
        borderBottom: '1.5px solid var(--line)', padding: '10px 20px',
        display: 'flex', alignItems: 'center', gap: 18
      }}
    >
      {/* logo */}
      <Link href="/landing" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: 'var(--ink)', flex: 'none' }}>
        <div style={{ width: 32, height: 32, borderRadius: 9, background: 'var(--brand)', color: '#fff', display: 'grid', placeItems: 'center', fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 17 }}>L</div>
        <span className="display hide-tablet" style={{ fontSize: 19, letterSpacing: '.01em' }}>LEO</span>
      </Link>

      {/* search — AI animated gradient border */}
      <div className="ai-search hide-mobile" style={{ flex: 1, maxWidth: 300 }}>
        <form onSubmit={doSearch} className="ai-search-inner">
          <button type="submit" aria-label="search" style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--brand)', fontSize: 14, padding: 0 }}>⌕</button>
          <input
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            placeholder={t.navSearch}
            style={{ border: 'none', outline: 'none', background: 'none', fontSize: 13.5, width: '100%', color: 'var(--ink)' }}
          />
        </form>
      </div>

      {/* nav links */}
      <nav className="hide-tablet" style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <button
          onClick={() => showToast(lang === 'bn' ? 'স্পেশাল অফার (ডেমো)' : 'Special offer (demo)')}
          style={{ display: 'flex', alignItems: 'center', gap: 7, border: 'none', cursor: 'pointer', fontFamily: 'inherit', background: '#4A2C1A', color: '#fff', borderRadius: 9, padding: '8px 14px', fontSize: 13.5, fontWeight: 700, whiteSpace: 'nowrap' }}
        >
          🎁 {t.navSpecial}
        </button>
        {navLink(t.navJobs, t.navNew)}
        {navLink(t.navFree)}
        {navLink(t.navDownload + ' ⌄')}
      </nav>

      {/* right cluster */}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 14 }}>
        {loggedIn && (
          <button
            onClick={() => showToast(lang === 'bn' ? '৩টি নতুন নোটিফিকেশন' : '3 new notifications')}
            aria-label="notifications"
            style={{ position: 'relative', border: 'none', background: 'none', cursor: 'pointer', fontSize: 18, padding: 2 }}
          >
            🔔
            <span style={{ position: 'absolute', top: -4, right: -8, fontSize: 9, fontWeight: 800, color: '#fff', background: '#DC2626', borderRadius: 99, padding: '1px 5px' }}>3</span>
          </button>
        )}

        <button
          onClick={toggleLang}
          style={{ display: 'flex', alignItems: 'center', gap: 6, border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13.5, fontWeight: 700, color: 'var(--ink)' }}
        >
          <span style={{ fontSize: 14 }}>{lang === 'bn' ? '🇬🇧' : '🇧🇩'}</span>
          {lang === 'bn' ? 'EN' : 'বাং'}
        </button>

        <button
          className="hide-mobile"
          onClick={() => setCoursesOpen((o) => !o)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, border: `1.5px solid ${coursesOpen ? 'var(--coal)' : 'var(--line)'}`, background: coursesOpen ? 'var(--coal)' : '#fff', cursor: 'pointer', fontFamily: 'inherit', borderRadius: 10, padding: '9px 14px', fontSize: 13.5, fontWeight: 700, color: coursesOpen ? '#fff' : 'var(--ink)', whiteSpace: 'nowrap' }}
        >
          {t.navAllCourses}
          <span style={{ display: 'inline-block', transition: 'transform .18s', transform: coursesOpen ? 'rotate(180deg)' : 'none', fontSize: 11 }}>⌄</span>
        </button>

        {!loggedIn ? (
          <Link
            href="/login"
            style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', background: 'var(--brand)', color: '#fff', borderRadius: 11, padding: '10px 18px', fontSize: 14, fontWeight: 800, whiteSpace: 'nowrap' }}
          >
            {t.loginSignup} →
          </Link>
        ) : (
          <>
            <Link
              href={dashRoute}
              style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', background: 'var(--coal)', color: '#fff', borderRadius: 11, padding: '10px 18px', fontSize: 14, fontWeight: 800, whiteSpace: 'nowrap' }}
            >
              {t.navDashboard} ▦
            </Link>

            {/* avatar + menu */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setMenuOpen((o) => !o)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1.5px solid var(--line)', background: '#fff', cursor: 'pointer', borderRadius: 99, padding: '4px 10px 4px 4px' }}
              >
                <span className="avatar" style={{ width: 30, height: 30, background: 'var(--brand)', color: '#fff', fontSize: 13 }}>{initial}</span>
                <span style={{ display: 'flex', flexDirection: 'column', gap: 3 }} aria-hidden>
                  <span style={{ width: 16, height: 2, background: 'var(--ink)', borderRadius: 2 }} />
                  <span style={{ width: 16, height: 2, background: 'var(--ink)', borderRadius: 2 }} />
                  <span style={{ width: 16, height: 2, background: 'var(--ink)', borderRadius: 2 }} />
                </span>
              </button>

              {menuOpen && (
                <div
                  className="card"
                  style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: 200, padding: 8, boxShadow: 'var(--shadow-pop)', zIndex: 60 }}
                >
                  <div style={{ padding: '8px 12px 10px', borderBottom: '1px solid var(--line-soft)' }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{auth.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--faint)', textTransform: 'capitalize' }}>{auth.role}</div>
                  </div>
                  <Link
                    href={dashRoute}
                    onClick={() => setMenuOpen(false)}
                    style={{ display: 'block', textDecoration: 'none', color: 'var(--ink)', fontSize: 13.5, fontWeight: 600, padding: '10px 12px', borderRadius: 8 }}
                  >
                    {t.navDashboard}
                  </Link>
                  <button
                    onClick={doLogout}
                    style={{ width: '100%', textAlign: 'left', border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit', color: '#B91C1C', fontSize: 13.5, fontWeight: 700, padding: '10px 12px', borderRadius: 8 }}
                  >
                    {t.logout}
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* mega-dropdown: All Courses */}
      {coursesOpen && (
        <>
          <div
            onClick={() => setCoursesOpen(false)}
            style={{ position: 'fixed', inset: 0, top: 0, background: 'rgba(22,19,15,.28)', zIndex: 40 }}
          />
          <div
            className="anim-in"
            style={{
              position: 'absolute', top: 'calc(100% + 8px)', left: 20, right: 20, zIndex: 55,
              background: '#fff', border: '1.5px solid var(--line)', borderRadius: 18,
              boxShadow: 'var(--shadow-pop)', padding: 24, maxWidth: 1160, margin: '0 auto'
            }}
          >
            <CourseMenu
              t={t}
              lang={lang}
              courses={courses}
              variant="dropdown"
              onNavigate={(path) => router.push(path)}
              onClose={() => setCoursesOpen(false)}
            />
          </div>
        </>
      )}
    </header>
  );
}
