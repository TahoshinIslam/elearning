'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import Icon from '@/components/Icon';

const HIDE_ON = /^\/(learn|owner|superadmin|checkout|dev)(\/|$)/;
export const DOCK_SEARCH_EVENT = 'leo:dock-search';
export const DOCK_MENU_EVENT = 'leo:dock-menu';

// Floating dock for phones. The active item rides in a raised bubble; when
// another item is chosen the bubble sinks into the bar, slides across and
// pops up under the new icon (≈ 0.55 s), like the reference animation.
// Hides while scrolling down, returns when scrolling up.
export default function MobileDock() {
  const { lang, auth, cartCount } = useApp();
  const pathname = usePathname() || '/';
  const en = lang === 'en';
  const learnHref = auth ? (auth.role === 'student' ? '/student' : '/owner') : '/login';
  const items = [
    { key: 'home', href: '/', icon: 'home', label: en ? 'Home' : 'হোম', match: (p) => p === '/' },
    { key: 'courses', href: '/courses', icon: 'book', label: en ? 'Courses' : 'কোর্স', match: (p) => p.startsWith('/course') || p.startsWith('/paths') },
    { key: 'search', icon: 'search', label: en ? 'Search' : 'খুঁজুন', event: DOCK_SEARCH_EVENT, match: () => false },
    { key: 'me', href: learnHref, icon: auth ? 'cap' : 'user', label: auth ? (en ? 'Learning' : 'আমার শেখা') : (en ? 'Login' : 'লগইন'), match: (p) => /^\/(student|login|register)/.test(p), badge: cartCount || 0 },
    { key: 'menu', icon: 'menu', label: en ? 'Menu' : 'মেনু', event: DOCK_MENU_EVENT, match: () => false }
  ];
  const routeIndex = Math.max(0, items.findIndex((x) => x.match(pathname)));
  const [active, setActive] = useState(routeIndex);
  const [phase, setPhase] = useState('up'); // up | sink | slide
  const [hidden, setHidden] = useState(false);
  const timers = useRef([]);
  const shown = useRef(routeIndex);

  const moveTo = (i) => {
    if (i === shown.current) return;
    timers.current.forEach(clearTimeout);
    shown.current = i;
    setPhase('sink');
    timers.current = [
      setTimeout(() => { setActive(i); setPhase('slide'); }, 160),
      setTimeout(() => setPhase('up'), 160 + 260)
    ];
  };

  useLayoutEffect(() => { moveTo(routeIndex); /* follow navigation (back/forward too) */ // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeIndex]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      if (Math.abs(y - last) < 8) return;
      setHidden(y > last && y > 120);
      last = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (HIDE_ON.test(pathname)) return null;

  const bubbleItem = items[active];
  return (
    <nav className={`mdock ${hidden ? 'is-hidden' : ''}`} aria-label={en ? 'Quick navigation' : 'দ্রুত নেভিগেশন'} style={{ '--n': items.length, '--i': active }}>
      <span className="mdock-bar" aria-hidden="true" />
      <span className={`mdock-bubble is-${phase}`} aria-hidden="true">
        <Icon name={bubbleItem.icon} size={22} />
      </span>
      <ul className="mdock-list">
        {items.map((it, i) => {
          const on = i === active;
          const inner = (
            <>
              <span className={`mdock-icon ${on && phase !== 'sink' ? 'is-lifted' : ''}`}><Icon name={it.icon} size={22} /></span>
              <span className="mdock-label">{it.label}</span>
              {it.badge > 0 && <span className="mdock-badge">{it.badge}</span>}
            </>
          );
          return (
            <li key={it.key}>
              {it.href ? (
                <Link href={it.href} className="mdock-item" aria-current={on && it.match(pathname) ? 'page' : undefined} onClick={() => moveTo(i)}>{inner}</Link>
              ) : (
                <button type="button" className="mdock-item" data-confirm="off" onClick={() => { moveTo(i); window.dispatchEvent(new Event(it.event)); setTimeout(() => moveTo(routeIndex), 900); }}>{inner}</button>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
