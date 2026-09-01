'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import SiteNav from '@/components/SiteNav';

export default function ContactPage() {
  const { t, api, showToast, centerDisplay, slug } = useApp();
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.message.trim()) { showToast(t.contactNeed); return; }
    setBusy(true);
    try {
      await api.sendContact(form);
      setSent(true);
      showToast(t.contactSent);
    } catch { showToast(t.errGeneric); } finally { setBusy(false); }
  };

  return (
    <>
      <SiteNav />
      <div className="anim-in" style={{ maxWidth: 620, margin: '0 auto', padding: '30px 20px 90px' }}>
        <h1 style={{ fontSize: 'clamp(26px,4vw,34px)', fontWeight: 700, margin: '0 0 8px' }}>{t.contactHead}</h1>
        <p style={{ fontSize: 15.5, color: 'var(--muted)', margin: '0 0 24px' }}>{t.contactIntro}</p>

        {sent ? (
          <div className="panel" style={{ padding: 32, textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>✅</div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>{t.contactSent}</div>
          </div>
        ) : (
          <form onSubmit={submit} className="panel" style={{ padding: 26 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div><label className="label">{t.contactName}</label><input className="input" value={form.name} onChange={set('name')} required /></div>
              <div><label className="label">{t.contactEmail}</label><input className="input" type="email" value={form.email} onChange={set('email')} /></div>
            </div>
            <label className="label" style={{ marginTop: 12 }}>{t.contactSubject}</label>
            <input className="input" value={form.subject} onChange={set('subject')} />
            <label className="label" style={{ marginTop: 12 }}>{t.contactMessage}</label>
            <textarea className="input" rows={5} value={form.message} onChange={set('message')} style={{ resize: 'vertical' }} required />
            <button type="submit" className="btn btn-primary-lg" style={{ marginTop: 18 }} disabled={busy}>
              {busy ? '…' : `${t.contactSend} →`}
            </button>
          </form>
        )}

        <div style={{ marginTop: 22, display: 'flex', gap: 24, flexWrap: 'wrap', fontSize: 13.5, color: 'var(--muted)' }}>
          <div>📞 01712-334455</div>
          <div className="mono" style={{ fontSize: 12.5 }}>{slug}@leolearning.app</div>
        </div>
      </div>
    </>
  );
}
