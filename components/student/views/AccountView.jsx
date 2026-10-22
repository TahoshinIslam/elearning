'use client';

import { useState } from 'react';
import Icon from '@/components/Icon';
import { copy } from '@/lib/copy';
import { useFlash } from '@/components/ui/motion';

export default function AccountView({ lang, user }) {
  const c = copy(lang);
  const [pw, setPw] = useState({ old: '', neu: '' });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [savedFlash, flashSaved] = useFlash();
  const submit = async (e) => {
    e.preventDefault();
    if (pw.neu.length < 8) { setMsg({ err: true, t: c.err_weak_password }); return; }
    setBusy(true); setMsg(null);
    try {
      const res = await fetch('/api/auth/change-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ oldPassword: pw.old, newPassword: pw.neu }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error);
      setPw({ old: '', neu: '' }); setMsg({ t: c.passwordChanged }); flashSaved();
    } catch (err) { setMsg({ err: true, t: c[`err_${err.message}`] || c.err_generic }); } finally { setBusy(false); }
  };
  return (
    <div className="stack" style={{ '--gap': '20px' }}>
      <div className="page-head" style={{ marginBottom: 0 }}><div><h1>{c.accountTitle}</h1></div></div>
      <div className="ws-split">
      <form className="surface surface-pad stack" onSubmit={submit} aria-labelledby="pw-h" noValidate>
        <h2 id="pw-h" className="h4">{c.changePassword}</h2>
        <div className="field"><label htmlFor="pw-old">{c.currentPassword}</label><input id="pw-old" type="password" className="input" autoComplete="current-password" value={pw.old} onChange={(e) => setPw({ ...pw, old: e.target.value })} /></div>
        <div className="field"><label htmlFor="pw-new">{c.newPassword}</label><input id="pw-new" type="password" className="input" autoComplete="new-password" value={pw.neu} onChange={(e) => setPw({ ...pw, neu: e.target.value })} aria-describedby="pw-hint" /><p id="pw-hint" className="help">{c.pwHint}</p></div>
        {msg && <div className={`notice ${msg.err ? 'notice-danger' : 'notice-success'}`} role={msg.err ? 'alert' : 'status'}><Icon name={msg.err ? 'alert' : 'checkCircle'} size={18} />{msg.t}</div>}
        <div><button type="submit" className={`btn btn-primary ${savedFlash ? 'is-success' : ''}`} disabled={busy || (!savedFlash && (!pw.old || !pw.neu))} aria-busy={busy}>
          {busy ? <span className="spinner" aria-hidden="true" /> : savedFlash ? <Icon name="check" size={16} /> : null}{savedFlash ? c.passwordChanged : c.savePassword}
        </button></div>
      </form>
      <section className="surface surface-pad stack" aria-labelledby="profile-h">
        <h2 id="profile-h" className="h4">{c.profile}</h2>
        <dl className="kv"><div><dt>{c.name}</dt><dd>{user.name}</dd></div><div><dt>{c.email}</dt><dd style={{ wordBreak: 'break-all' }}>{user.email}</dd></div></dl>
      </section>
      </div>
    </div>
  );
}
