'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Dialog from '@/components/ui/Dialog';
import Icon from '@/components/Icon';
import { copy, num, dateLabel } from '@/lib/copy';

const seenKey = (p) => `leo_popup_${p.id}_${String(p.updatedAt || '').replace(/\D/g, '').slice(0, 14)}`;
const BLOCKED = /^\/(learn|checkout|login|register|forgot|reset|owner|superadmin|student|dev)(\/|$)/;

// One promotional popup per visit at most, and each campaign at most once
// per its frequency window (default 24h) per browser. Dismissal timing is a
// per-browser convenience, so localStorage is the right store. Never shown
// on learning, checkout, auth or dashboard pages.
export default function PromoPopup({ page, lang }) {
  const c = copy(lang);
  const pathname = usePathname();
  const [popup, setPopup] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (BLOCKED.test(pathname || '')) return undefined;
    let live = true, timer;
    fetch(`/api/campaigns/active?kind=popup&page=${page}`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : []))
      .then((list) => {
        if (!live || !Array.isArray(list)) return;
        const now = Date.now();
        const due = list.find((p) => {
          try { const t = Number(localStorage.getItem(seenKey(p))); return !t || now - t > (p.frequencyHours || 24) * 3600_000; } catch { return false; }
        });
        if (!due) return;
        setPopup(due);
        timer = setTimeout(() => { if (live) setOpen(true); }, 1200);
      })
      .catch(() => {});
    return () => { live = false; clearTimeout(timer); };
  }, [page, pathname]);

  const remember = () => { if (popup) try { localStorage.setItem(seenKey(popup), String(Date.now())); } catch { /* ignore */ } };
  const close = () => { remember(); setOpen(false); };
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
          <Link href={popup.href} className="btn btn-primary promo-pop-cta" onClick={() => { remember(); setOpen(false); }}>{popup.ctaLabel}<Icon name="arrowRight" size={16} /></Link>
          <button type="button" className="btn btn-ghost" onClick={close}>{c.closePopup}</button>
        </div>
      </div>
    </Dialog>
  );
}
