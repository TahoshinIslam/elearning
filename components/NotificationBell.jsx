'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useApp } from '@/context/AppContext';
import Icon from '@/components/Icon';
import { usePresence } from '@/components/ui/motion';

const KIND_ICON = { announcement: 'megaphone', grade: 'edit', class: 'video', payment: 'card', system: 'bell' };

// Bell + dropdown for in-app notifications. Polls every 30s while mounted.
export default function NotificationBell() {
  const { t, auth, api } = useApp();
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const load = useCallback(() => {
    if (!auth) return;
    api.getNotifications().then(setItems).catch(() => {});
  }, [auth, api]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (!auth) return;
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, [auth, load]);

  // close on outside click
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const panel = usePresence(open, 120);
  if (!auth) return null;
  const unread = items.filter((n) => !n.isRead).length;

  const openPanel = () => { setOpen((o) => !o); if (!open) load(); };
  const markAll = async () => setItems(await api.markNotifications({ all: true }));
  const markOne = async (id) => setItems(await api.markNotifications({ id }));

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button type="button" onClick={openPanel} aria-label={t.notifications} aria-expanded={open} className="btn btn-ghost btn-icon" style={{ position: 'relative', borderRadius: 99 }}>
        <Icon name="bell" size={18} />
        {unread > 0 && (
          <span style={{ position: 'absolute', top: -5, right: -5, background: 'var(--brand)', color: '#fff', borderRadius: 99, minWidth: 17, height: 17, fontSize: 10.5, fontWeight: 700, display: 'grid', placeItems: 'center', padding: '0 4px' }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {panel.mounted && (
        <div className="notif-dropdown" data-state={panel.state} onAnimationEnd={panel.onAnimationEnd} {...(panel.state === 'closing' ? { inert: '' } : {})} style={{
          background: 'var(--paper, #fff)', color: 'var(--ink, #1a1a1a)', borderRadius: 12,
          boxShadow: '0 12px 40px rgba(0,0,0,.28)', border: '1px solid var(--line)', zIndex: 90
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderBottom: '1.5px solid var(--line)', position: 'sticky', top: 0, background: 'var(--paper,#fff)' }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{t.notifications}</div>
            {unread > 0 && <button onClick={markAll} style={{ border: 'none', background: 'none', color: 'var(--brand-deep)', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>{t.notifMarkAll}</button>}
          </div>

          {items.length === 0 ? (
            <div style={{ padding: 30, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>{t.notifEmpty}</div>
          ) : items.map((n) => (
            <div key={n.id} onClick={() => !n.isRead && markOne(n.id)}
              style={{ display: 'flex', gap: 10, padding: '11px 14px', borderBottom: '1px solid var(--line)', cursor: n.isRead ? 'default' : 'pointer', background: n.isRead ? 'transparent' : 'var(--brand-wash)' }}>
              <div style={{ color: 'var(--brand-deep)', marginTop: 1 }}><Icon name={KIND_ICON[n.kind] || 'bell'} size={16} /></div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 13.5, lineHeight: 1.3 }}>{n.title}</div>
                {n.body && <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 2 }}>{n.body}</div>}
                <div style={{ fontSize: 11, color: 'var(--faint)', marginTop: 3 }}>{String(n.createdAt).replace('T', ' ').slice(0, 16)}</div>
              </div>
              {!n.isRead && <span style={{ width: 8, height: 8, borderRadius: 99, background: 'var(--brand)', marginTop: 5 }} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
