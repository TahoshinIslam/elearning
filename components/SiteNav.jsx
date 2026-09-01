'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import CourseMenu from '@/components/CourseMenu';
import { catLabel } from '@/lib/catalog';
import Icon from '@/components/Icon';
import NotificationBell from '@/components/NotificationBell';
import CartDrawer from '@/components/CartDrawer';

const ROLE_ROUTE = {
  student: '/student',
  teacher: '/owner',
  owner: '/owner',
  superadmin: '/superadmin'
};

export default function SiteNav() {
  const { t, lang, toggleLang, auth, logout, showToast, courses, cartCount, setCartOpen } = useApp();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [coursesOpen, setCoursesOpen] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const [searchFocus, setSearchFocus] = useState(false);

  // live (ajax-style) course filter — matches title / instructor / category as you type
  const searchResults = useMemo(() => {
    const term = searchQ.trim().toLowerCase();
    if (!term) return [];
    return (courses || [])
      .filter((c) => c.published && (
        (c.title || '').toLowerCase().includes(term) ||
        (c.instructor || '').toLowerCase().includes(term) ||
        (c.category || '').toLowerCase().includes(term)
      ))
      .slice(0, 6);
  }, [courses, searchQ]);

  const doSearch = (e) => {
    e.preventDefault();
    setSearchFocus(false);
    router.push(searchQ.trim() ? `/courses?q=${encodeURIComponent(searchQ.trim())}` : '/courses');
  };
  const openResult = (c) => { setSearchQ(''); setSearchFocus(false); router.push(`/course/${c.slug}`); };

  const loggedIn = !!auth;
  const dashRoute = (auth && ROLE_ROUTE[auth.role]) || '/login';
  const initial = auth?.name?.[0] || 'U';
  // staff (teacher/owner/superadmin) manage the platform — hide the course-shopping
  // marketing chrome and show a clean admin header instead.
  const isStaff = auth && ['teacher', 'owner', 'superadmin'].includes(auth.role);
  const roleLabel = auth && ({ teacher: t.roleTeacher, owner: t.roleOwner, superadmin: t.roleSuper, student: t.roleStudent }[auth.role] || '');

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
    <>
    <CartDrawer />
    <header
      className="site-nav"
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

      {/* staff (dashboard) header shows a role label instead of the marketplace chrome */}
      {isStaff && (
        <span className="hide-mobile" style={{ fontSize: 13, fontWeight: 700, color: 'var(--muted)', borderLeft: '1.5px solid var(--line)', paddingLeft: 14 }}>
          {roleLabel}
        </span>
      )}

      {/* live course search — marketplace only */}
      {!isStaff && (
        <div className="ai-search hide-mobile" style={{ flex: 1, maxWidth: 320, position: 'relative' }}>
          <form onSubmit={doSearch} className="ai-search-inner">
            <button type="submit" aria-label="search" style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--brand)', padding: 0, display: 'grid', placeItems: 'center' }}><Icon name="search" size={16} /></button>
            <input
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              onFocus={() => setSearchFocus(true)}
              onBlur={() => setTimeout(() => setSearchFocus(false), 150)}
              placeholder={t.navSearch}
              style={{ border: 'none', outline: 'none', background: 'none', fontSize: 13.5, width: '100%', color: 'var(--ink)' }}
            />
            {searchQ && (
              <button type="button" aria-label={t.cartClose} onMouseDown={() => setSearchQ('')} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--muted)', padding: 0, display: 'grid', placeItems: 'center' }}><Icon name="x" size={15} /></button>
            )}
          </form>

          {searchFocus && searchQ.trim() && (
            <div className="card" style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0, padding: 6, boxShadow: 'var(--shadow-pop)', zIndex: 70, maxHeight: 360, overflowY: 'auto' }}>
              {searchResults.length === 0 ? (
                <div style={{ padding: '18px 14px', textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>{t.searchNoResults}</div>
              ) : (
                <>
                  {searchResults.map((c) => (
                    <button key={c.id} type="button" onMouseDown={() => openResult(c)}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left', border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: '9px 10px', borderRadius: 8 }}>
                      <span className="placeholder-art" style={{ width: 42, height: 32, flex: 'none', borderRadius: 6, fontSize: 8 }}>{c.thumb || 'course'}</span>
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ display: 'block', fontWeight: 700, fontSize: 13, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title}</span>
                        <span style={{ display: 'block', fontSize: 11.5, color: 'var(--faint)' }}>{c.instructor || catLabel(t, c.category)} · {c.price === 0 ? t.cdFree : `৳${c.price}`}</span>
                      </span>
                    </button>
                  ))}
                  <button type="button" onMouseDown={doSearch}
                    style={{ display: 'block', width: '100%', textAlign: 'center', border: 'none', borderTop: '1px solid var(--line-soft)', background: 'none', cursor: 'pointer', fontFamily: 'inherit', color: 'var(--brand-deep)', fontWeight: 700, fontSize: 12.5, padding: '10px' }}>
                    {t.searchAllResults} →
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* nav links — marketplace only */}
      {!isStaff && (
        <nav className="hide-tablet" style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <button
            onClick={() => showToast(lang === 'bn' ? 'স্পেশাল অফার (ডেমো)' : 'Special offer (demo)')}
            style={{ display: 'flex', alignItems: 'center', gap: 7, border: 'none', cursor: 'pointer', fontFamily: 'inherit', background: '#4A2C1A', color: '#fff', borderRadius: 9, padding: '8px 14px', fontSize: 13.5, fontWeight: 700, whiteSpace: 'nowrap' }}
          >
            <Icon name="gift" size={15} /> {t.navSpecial}
          </button>
          {navLink(t.navJobs, t.navNew)}
          {navLink(t.navFree)}
          <Link href="/paths" style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--ink)', textDecoration: 'none', padding: '6px 4px', whiteSpace: 'nowrap' }}>{t.paths}</Link>
          <Link href="/blog" style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--ink)', textDecoration: 'none', padding: '6px 4px', whiteSpace: 'nowrap' }}>{t.blog}</Link>
          {navLink(t.navDownload + ' ⌄')}
        </nav>
      )}

      {/* right cluster */}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 14 }}>
        {!isStaff && (
          <button onClick={() => setCartOpen(true)} aria-label={t.navCart}
            style={{ position: 'relative', border: '1.5px solid var(--line)', background: '#fff', color: 'var(--ink)', borderRadius: 99, width: 36, height: 36, cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
            <Icon name="cart" size={18} />
            {cartCount > 0 && (
              <span style={{ position: 'absolute', top: -5, right: -5, background: 'var(--brand)', color: '#fff', borderRadius: 99, minWidth: 17, height: 17, fontSize: 10.5, fontWeight: 800, display: 'grid', placeItems: 'center', padding: '0 4px' }}>
                {cartCount > 9 ? '9+' : cartCount}
              </span>
            )}
          </button>
        )}
        {loggedIn && <NotificationBell />}

        {!isStaff && (
          <button
            className="hide-mobile"
            onClick={() => setCoursesOpen((o) => !o)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, border: `1.5px solid ${coursesOpen ? 'var(--coal)' : 'var(--line)'}`, background: coursesOpen ? 'var(--coal)' : '#fff', cursor: 'pointer', fontFamily: 'inherit', borderRadius: 10, padding: '9px 14px', fontSize: 13.5, fontWeight: 700, color: coursesOpen ? '#fff' : 'var(--ink)', whiteSpace: 'nowrap' }}
          >
            {t.navAllCourses}
            <span style={{ display: 'inline-flex', transition: 'transform .18s', transform: coursesOpen ? 'rotate(180deg)' : 'none' }}><Icon name="chevronDown" size={14} /></span>
          </button>
        )}

        {!loggedIn ? (
          <>
            {/* guests have no account menu — keep a compact language toggle */}
            <button onClick={toggleLang} aria-label={t.language} title={t.language}
              style={{ border: '1.5px solid var(--line)', background: '#fff', color: 'var(--ink)', borderRadius: 99, height: 36, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, padding: '0 12px', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 700 }}>
              <Icon name="globe" size={15} /> {lang === 'bn' ? 'EN' : 'বাং'}
            </button>
            <Link
              href="/login"
              style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', background: 'var(--brand)', color: '#fff', borderRadius: 11, padding: '10px 18px', fontSize: 14, fontWeight: 800, whiteSpace: 'nowrap' }}
            >
              {t.loginSignup} →
            </Link>
          </>
        ) : (
          <>
            <Link
              className="hide-mobile"
              href={dashRoute}
              style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', background: 'var(--coal)', color: '#fff', borderRadius: 11, padding: '10px 18px', fontSize: 14, fontWeight: 800, whiteSpace: 'nowrap' }}
            >
              <Icon name="grid" size={15} /> {t.navDashboard}
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
                  {/* language toggle lives in the account menu */}
                  <button
                    onClick={toggleLang}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', textAlign: 'left', border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit', color: 'var(--ink)', fontSize: 13.5, fontWeight: 600, padding: '10px 12px', borderRadius: 8 }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Icon name="globe" size={15} /> {t.language}</span>
                    <span style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--brand-deep)' }}>{lang === 'bn' ? 'বাংলা' : 'EN'}</span>
                  </button>
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
    </>
  );
}
