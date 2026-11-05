'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import Icon from '@/components/Icon';
import BrandMark from '@/components/ui/BrandMark';
import Drawer from '@/components/ui/Drawer';
import { SIDEBAR_OPEN_EVENT } from '@/components/ui/useShellNav';
import { DOCK_SEARCH_EVENT, DOCK_MENU_EVENT } from '@/components/site/MobileDock';
import { usePresence } from '@/components/ui/motion';
import CartDrawer from '@/components/CartDrawer';
import NotificationBell from '@/components/NotificationBell';
import { copy } from '@/lib/copy';
import { ROLE_HOME } from '@/lib/rbac';

function SearchForm({ c, id, autoFocus = false, onDone }) {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [value, setValue] = useState(pathname === '/courses' ? params.get('q') || '' : '');
  useEffect(() => { if (pathname === '/courses') setValue(params.get('q') || ''); }, [params, pathname]);
  // Plain GET form: works without JavaScript; with JS it navigates client-side.
  return (
    <form role="search" action="/courses" method="get" onSubmit={(e) => {
      e.preventDefault();
      const q = value.trim();
      router.push(q ? `/courses?q=${encodeURIComponent(q)}` : '/courses');
      onDone?.();
    }}>
      <label htmlFor={id} className="sr-only">{c.search}</label>
      <div className="input-group">
        <Icon name="search" size={17} />
        <input id={id} name="q" type="search" className="input" placeholder={c.searchPlaceholder} value={value} onChange={(e) => setValue(e.target.value)} autoFocus={autoFocus} enterKeyHint="search" autoComplete="off" />
      </div>
    </form>
  );
}

function AccountMenu({ auth, c, onLogout }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const btnRef = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') { setOpen(false); btnRef.current?.focus(); } };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    ref.current?.querySelector('[role="menuitem"]')?.focus();
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey); };
  }, [open]);
  const onMenuKey = (e) => {
    const items = [...ref.current.querySelectorAll('[role="menuitem"]')];
    const i = items.indexOf(document.activeElement);
    if (e.key === 'ArrowDown') { e.preventDefault(); items[(i + 1) % items.length]?.focus(); }
    if (e.key === 'ArrowUp') { e.preventDefault(); items[(i - 1 + items.length) % items.length]?.focus(); }
  };
  const isStudent = auth.role === 'student';
  const menu = usePresence(open, 120);
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button ref={btnRef} type="button" className="avatar-btn" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)} aria-label={`${c.account}: ${auth.name}`}>
        {auth.avatarUrl ? <img src={auth.avatarUrl} alt="" width={38} height={38} /> : String(auth.name || '?').trim().charAt(0).toUpperCase()}
      </button>
      {menu.mounted && (
        <div className="menu" role="menu" data-state={menu.state} onAnimationEnd={menu.onAnimationEnd} {...(menu.state === 'closing' ? { inert: '' } : {})}
          style={{ right: 0, top: 'calc(100% + 8px)' }} onKeyDown={onMenuKey}>
          <div className="menu-label">{c.signedInAs}</div>
          <div style={{ padding: '0 10px 8px' }}>
            <div className="strong" style={{ fontSize: 14.5 }}>{auth.name}</div>
            <div className="xsmall muted" style={{ wordBreak: 'break-all' }}>{auth.email}</div>
          </div>
          <div className="menu-sep" />
          {isStudent ? (
            <>
              <Link role="menuitem" className="menu-item" href="/student" onClick={() => setOpen(false)}><Icon name="book" size={17} />{c.myLearning}</Link>
              <Link role="menuitem" className="menu-item" href="/student?view=orders" onClick={() => setOpen(false)}><Icon name="receipt" size={17} />{c.orders}</Link>
              <Link role="menuitem" className="menu-item" href="/student?view=account" onClick={() => setOpen(false)}><Icon name="settings" size={17} />{c.account}</Link>
            </>
          ) : (
            <Link role="menuitem" className="menu-item" href={ROLE_HOME[auth.role] || '/'} onClick={() => setOpen(false)}><Icon name="grid" size={17} />{c.dashboard}</Link>
          )}
          <div className="menu-sep" />
          <button role="menuitem" type="button" className="menu-item" onClick={() => { setOpen(false); onLogout(); }}><Icon name="logout" size={17} />{c.logout}</button>
        </div>
      )}
    </div>
  );
}

export default function SiteHeader() {
  const { lang, toggleLang, auth, authReady, logout, cartCount, setCartOpen, showToast } = useApp();
  const c = copy(lang);
  const pathname = usePathname();
  const router = useRouter();
  const [navOpen, setNavOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  // the mobile dock's Search / Menu buttons open the same overlays
  useEffect(() => {
    const openSearch = () => setSearchOpen(true);
    const openMenu = () => { if (document.querySelector('.shell > .sidebar')) window.dispatchEvent(new Event(SIDEBAR_OPEN_EVENT)); else setNavOpen(true); };
    window.addEventListener(DOCK_SEARCH_EVENT, openSearch);
    window.addEventListener(DOCK_MENU_EVENT, openMenu);
    return () => { window.removeEventListener(DOCK_SEARCH_EVENT, openSearch); window.removeEventListener(DOCK_MENU_EVENT, openMenu); };
  }, []);
  const returnTo = pathname && !['/login', '/register'].includes(pathname) ? `?returnTo=${encodeURIComponent(pathname)}` : '';
  const doLogout = async () => {
    await logout();
    showToast(lang === 'en' ? 'You are signed out' : 'আপনি লগআউট করেছেন', 'info');
    router.push('/'); router.refresh();
  };
  const homeFor = auth ? (auth.role === 'student' ? '/student' : ROLE_HOME[auth.role] || '/') : null;

  const links = [
    { href: '/courses', label: c.navCourses },
    { href: '/paths', label: c.navPaths },
    { href: '/blog', label: c.navBlog }
  ];

  return (
    <header className="site-header">
      <div className="container site-header-inner">
        <button type="button" className="btn btn-ghost btn-icon mobile-only" aria-label={c.menu} aria-expanded={navOpen}
          onClick={() => { if (document.querySelector('.shell > .sidebar')) window.dispatchEvent(new Event(SIDEBAR_OPEN_EVENT)); else setNavOpen(true); }}>
          <Icon name="menu" size={22} />
        </button>
        <Link href="/" className="brand" aria-label="Leo Learning — home">
          <BrandMark />
          <span className="brand-word">Leo <span className="sticker">Learning</span></span>
        </Link>
        <nav className="nav-links" aria-label="Primary">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="nav-link" aria-current={pathname === l.href || pathname?.startsWith(`${l.href}/`) ? 'page' : undefined}>{l.label}</Link>
          ))}
        </nav>
        <div className="header-search">
          <Suspense fallback={null}><SearchForm c={c} id="site-search" /></Suspense>
        </div>
        <div className="header-actions">
          <button type="button" className="btn btn-ghost btn-icon mobile-only" onClick={() => setSearchOpen(true)} aria-label={c.search}>
            <Icon name="search" size={20} />
          </button>
          <button type="button" className="btn btn-ghost btn-sm desktop-only" onClick={toggleLang} aria-label={c.langSwitchLabel} lang={lang === 'bn' ? 'en' : 'bn'}>
            <Icon name="globe" size={16} />{c.langSwitch}
          </button>
          {cartCount > 0 && (
            <button type="button" className="btn btn-ghost btn-icon" style={{ position: 'relative' }} onClick={() => setCartOpen(true)} aria-label={`${c.cart} (${cartCount})`}>
              <Icon name="cart" size={20} /><span className="icon-badge" aria-hidden="true">{cartCount}</span>
            </button>
          )}
          {!authReady ? <span style={{ width: 120 }} aria-hidden="true" /> : auth ? (
            <>
              <Link href={homeFor} className="btn btn-ghost btn-sm desktop-only">{auth.role === 'student' ? c.myLearning : c.dashboard}</Link>
              <NotificationBell />
              <AccountMenu auth={auth} c={c} onLogout={doLogout} />
            </>
          ) : (
            <>
              <Link href={`/login${returnTo}`} className="btn btn-ghost btn-sm">{c.login}</Link>
              <Link href={`/register${returnTo}`} className="btn btn-primary btn-sm desktop-only">{c.signup}</Link>
            </>
          )}
        </div>
      </div>

      <Drawer open={navOpen} onClose={() => setNavOpen(false)} title="Leo Learning" side="left" closeLabel={c.close}>
        <div className="stack" style={{ '--gap': '16px' }}>
          <Suspense fallback={null}><SearchForm c={c} id="drawer-search" onDone={() => setNavOpen(false)} /></Suspense>
          <nav className="drawer-nav" aria-label="Mobile">
            <Link href="/" onClick={() => setNavOpen(false)}><Icon name="home" size={19} />{c.home}</Link>
            {links.map((l) => <Link key={l.href} href={l.href} onClick={() => setNavOpen(false)}><Icon name={l.href === '/courses' ? 'layers' : l.href === '/paths' ? 'compass' : 'file'} size={19} />{l.label}</Link>)}
            {auth && <Link href={homeFor} onClick={() => setNavOpen(false)}><Icon name="book" size={19} />{auth.role === 'student' ? c.myLearning : c.dashboard}</Link>}
            {auth?.role === 'student' && <Link href="/student?view=orders" onClick={() => setNavOpen(false)}><Icon name="receipt" size={19} />{c.orders}</Link>}
            <button type="button" onClick={() => { toggleLang(); setNavOpen(false); }} lang={lang === 'bn' ? 'en' : 'bn'}><Icon name="globe" size={19} />{c.langSwitch}</button>
          </nav>
          <hr style={{ margin: 0 }} />
          {auth ? (
            <button type="button" className="btn btn-secondary btn-block" onClick={() => { setNavOpen(false); doLogout(); }}><Icon name="logout" size={17} />{c.logout}</button>
          ) : (
            <div className="stack" style={{ '--gap': '10px' }}>
              <Link href={`/register${returnTo}`} className="btn btn-primary btn-block" onClick={() => setNavOpen(false)}>{c.signup}</Link>
              <Link href={`/login${returnTo}`} className="btn btn-secondary btn-block" onClick={() => setNavOpen(false)}>{c.login}</Link>
            </div>
          )}
        </div>
      </Drawer>
      <Drawer open={searchOpen} onClose={() => setSearchOpen(false)} title={c.search} closeLabel={c.close} initialFocus="#mobile-search">
        <Suspense fallback={null}><SearchForm c={c} id="mobile-search" autoFocus onDone={() => setSearchOpen(false)} /></Suspense>
      </Drawer>
      <CartDrawer />
    </header>
  );
}
