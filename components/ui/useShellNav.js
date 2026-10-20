'use client';

import { useEffect, useRef, useState } from 'react';

export const SIDEBAR_OPEN_EVENT = 'leo:sidebar-open';

// Dashboard sidebars (admin, student) are the page's only menu on small
// screens: the site header's hamburger opens them (see SiteHeader) instead
// of a second, separate "Menu" button. Escape closes; focus moves into the
// sidebar on open and back to the opener on close.
export function useShellNav() {
  const [open, setOpen] = useState(false);
  const sidebarRef = useRef(null);
  const opener = useRef(null);

  useEffect(() => {
    const onOpen = () => { opener.current = document.activeElement; setOpen(true); };
    window.addEventListener(SIDEBAR_OPEN_EVENT, onOpen);
    return () => window.removeEventListener(SIDEBAR_OPEN_EVENT, onOpen);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    sidebarRef.current?.querySelector('a, button')?.focus({ preventScroll: true });
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      if (opener.current && document.contains(opener.current)) opener.current.focus({ preventScroll: true });
    };
  }, [open]);

  return { open, close: () => setOpen(false), sidebarRef };
}
