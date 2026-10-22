'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Icon from '@/components/Icon';
import { copy } from '@/lib/copy';
import { useShellNav } from '@/components/ui/useShellNav';
import SidebarSiteLinks from '@/components/ui/SidebarSiteLinks';

const NAV_KEY = 'leo_student_nav_collapsed';

// Student workspace: full-width content beside a sidebar that collapses to
// icons on desktop (remembered per browser) and becomes a drawer on mobile.
export default function StudentShell({ lang, view, name, children }) {
  const c = copy(lang);
  const { open, close, sidebarRef } = useShellNav();
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => { try { setCollapsed(localStorage.getItem(NAV_KEY) === '1'); } catch { /* ignore */ } }, []);
  const toggleCollapsed = () => setCollapsed((v) => { try { localStorage.setItem(NAV_KEY, v ? '0' : '1'); } catch { /* ignore */ } return !v; });
  const primary = [['learning', 'book', c.myLearning], ['orders', 'receipt', c.orders], ['certificates', 'award', c.certificates], ['wishlist', 'heart', c.wishlist]];
  const more = [['live', 'video', c.liveClasses], ['career', 'briefcase', c.career], ['referral', 'gift', c.referral], ['account', 'settings', c.account]];
  const item = ([k, icon, label]) => (
    <Link key={k} href={k === 'learning' ? '/student' : `/student?view=${k}`} className={`side-tab ${view === k ? 'active' : ''}`} aria-current={view === k ? 'page' : undefined}
      onClick={close} title={collapsed ? label : undefined} aria-label={collapsed ? label : undefined}>
      <Icon name={icon} size={18} /><span className="side-text">{label}</span>
    </Link>
  );
  return (
    <div className="shell" data-collapsed={collapsed}>
      <aside ref={sidebarRef} className={`sidebar ${open ? 'open' : ''}`} aria-label={c.myLearning}>
        <div className="side-head">
          <span className="avatar-btn" aria-hidden="true">{String(name || '?').charAt(0).toUpperCase()}</span>
          <div className="side-head-text" style={{ minWidth: 0 }}><div className="strong clamp-2" style={{ fontSize: 15 }}>{name}</div></div>
        </div>
        <nav className="side-nav" aria-label={c.myLearning}>
          <div className="side-group">{primary.map(item)}</div>
          <div className="side-group">
            <div className="side-label">{c.more}</div>
            {more.map(item)}
          </div>
          <SidebarSiteLinks onNavigate={close} />
        </nav>
        <button type="button" className="side-tab side-collapse" onClick={toggleCollapsed} aria-pressed={collapsed}>
          <Icon name={collapsed ? 'chevronRight' : 'chevronLeft'} size={18} /><span className="side-text">{lang === 'en' ? 'Collapse menu' : 'মেনু ছোট করুন'}</span>
        </button>
      </aside>
      <div className={`sidebar-backdrop ${open ? 'show' : ''}`} onClick={close} aria-hidden="true" />
      <main id="main" className="dash-main">
        {children}
      </main>
    </div>
  );
}
