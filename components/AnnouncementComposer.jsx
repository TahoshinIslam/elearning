'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';

// Shared announcement composer for teacher/owner/superadmin. Fans a message
// out to every student in the sender's tenant (all students for superadmin).
export default function AnnouncementComposer() {
  const { t, api, showToast } = useApp();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);

  const send = async () => {
    if (!title.trim()) { showToast(t.announceEmpty); return; }
    setBusy(true);
    try {
      const { sent } = await api.announce(title.trim(), body.trim());
      showToast(`${t.announceSent} · ${sent}`);
      setTitle(''); setBody('');
    } catch { showToast(t.errGeneric); } finally { setBusy(false); }
  };

  return (
    <div className="anim-in">
      <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>{t.announceTitle}</div>
      <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 18 }}>{t.announceNote}</div>
      <div className="panel" style={{ padding: 24, maxWidth: 560 }}>
        <label className="label">{t.announceTitlePh}</label>
        <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} style={{ marginBottom: 14 }} />
        <label className="label">{t.announceBodyPh}</label>
        <textarea className="input" value={body} onChange={(e) => setBody(e.target.value)} rows={4} style={{ marginBottom: 18, resize: 'vertical' }} />
        <button className="btn-primary" style={{ borderRadius: 0 }} disabled={busy} onClick={send}>
          {busy ? '…' : `📢 ${t.announceSend}`}
        </button>
      </div>
    </div>
  );
}
