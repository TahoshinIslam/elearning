'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Dialog from '@/components/ui/Dialog';
import Icon from '@/components/Icon';
import { track } from '@/components/Tracker';
import { copy, num, dateLabel } from '@/lib/copy';

const seenKey = (p) => `leo_popup_${p.id}_${String(p.updatedAt || '').replace(/\D/g, '').slice(0, 14)}`;
const BLOCKED = /^\/(learn|checkout|login|register|forgot|reset|owner|superadmin|student|dev)(\/|$)/;
const pageOf = (path) => (path === '/' ? 'home' : path === '/courses' ? 'catalog' : path.startsWith('/course/') ? 'course' : 'any');

// Wait for the campaign's trigger. Returns a cleanup function.
function onTrigger(p, fire) {
  const v = Number(p.triggerValue) || 0;
  if (p.triggerType === 'scroll') {
    const check = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (max <= 0 || (window.scrollY / max) * 100 >= v) { window.removeEventListener('scroll', check); fire(); }
    };
    window.addEventListener('scroll', check, { passive: true });
    check();
    return () => window.removeEventListener('scroll', check);
  }
  if (p.triggerType === 'exit') {
    // desktop: pointer leaves through the top edge; touch screens: after 20s
    const leave = (e) => { if (e.clientY <= 0) fire(); };
    const coarse = window.matchMedia('(pointer: coarse)').matches;
    const t = coarse ? setTimeout(fire, 20000) : null;
    if (!coarse) document.addEventListener('mouseout', leave);
    return () => { document.removeEventListener('mouseout', leave); clearTimeout(t); };
  }
  if (p.triggerType === 'pageviews') {
    let pv = 0;
    try { pv = Number(sessionStorage.getItem('leo_pv') || 0); } catch { /* ignore */ }
    if (pv >= Math.max(1, v)) { const t = setTimeout(fire, 800); return () => clearTimeout(t); }
    return () => {};
  }
  const t = setTimeout(fire, Math.max(0, v) * 1000);
  return () => clearTimeout(t);
}

// Smart campaign popup for the whole public site. The server already picked
// the campaigns this visitor qualifies for (audience: new / returning / from
// an ad campaign / interested in a subject …). The browser waits for the
// campaign's trigger, shows at most one popup per visit, respects each
// campaign's frequency cap, and reports impressions, clicks and dismissals
// so the admin can see which campaign converts.
export default function PromoPopup({ lang }) {
  const c = copy(lang);
  const pathname = usePathname() || '/';
  const [popup, setPopup] = useState(null);
  const [open, setOpen] = useState(false);
  const shownThisVisit = useRef(false);

  useEffect(() => {
    if (BLOCKED.test(pathname) || shownThisVisit.current) return undefined;
    try { if (sessionStorage.getItem('leo_popup_shown')) return undefined; } catch { /* ignore */ }
    let live = true;
    let stop = () => {};
    fetch(`/api/campaigns/active?kind=popup&page=${pageOf(pathname)}`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : []))
      .then((list) => {
        if (!live || !Array.isArray(list)) return;
        const now = Date.now();
        const due = list.find((p) => {
          try { const t = Number(localStorage.getItem(seenKey(p))); return !t || now - t > (p.frequencyHours || 24) * 3600_000; } catch { return false; }
        });
        if (!due) return;
        stop = onTrigger(due, () => {
          if (!live || shownThisVisit.current) return;
          shownThisVisit.current = true;
          try { sessionStorage.setItem('leo_popup_shown', '1'); localStorage.setItem(seenKey(due), String(Date.now())); } catch { /* ignore */ }
          setPopup(due);
          setOpen(true);
          track('popup_impression', { refId: String(due.id) });
        });
      })
      .catch(() => {});
    return () => { live = false; stop(); };
  }, [pathname]);

  const close = () => { if (popup) track('popup_dismiss', { refId: String(popup.id) }); setOpen(false); };
  if (!popup) return null;
  const off = popup.offer ? (popup.offer.type === 'percent' ? `${num(lang, popup.offer.value)}%` : `৳${num(lang, popup.offer.value)}`) : null;

  return (
    <Dialog open={open} onClose={close} title={popup.title} closeLabel={c.closePopup} initialFocus=".promo-pop-cta">
      <div className="promo-pop stack" style={{ '--gap': '14px' }}>
        {popup.imageUrl && <img className="promo-pop-img" src={popup.imageUrl} alt={popup.imageAlt || ''} />}
        {off && <span className="badge badge-brand" style={{ alignSelf: 'flex-start', fontSize: 14 }}>{c.offerSave(off)}</span>}
        {popup.body && <p style={{ color: 'var(--ink-2)', lineHeight: 'var(--lh-read)' }}>{popup.body}</p>}
        {popup.offer?.endsAt && <p className="small muted row" style={{ '--gap': '6px' }}><Icon name="clock" size={14} />{c.validUntil(dateLabel(lang, popup.offer.endsAt))}</p>}
        <div className="row" style={{ '--gap': '8px', flexWrap: 'wrap' }}>
          <Link href={popup.href} className="btn btn-primary promo-pop-cta" onClick={() => { track('popup_click', { refId: String(popup.id) }); setOpen(false); }}>{popup.ctaLabel}<Icon name="arrowRight" size={16} /></Link>
          <button type="button" className="btn btn-ghost" onClick={close}>{c.closePopup}</button>
        </div>
      </div>
    </Dialog>
  );
}
