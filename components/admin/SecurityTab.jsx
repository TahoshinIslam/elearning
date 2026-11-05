'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import Icon from '@/components/Icon';
import { useAdminData, send } from '@/components/owner/useAdminData';
import { num } from '@/lib/copy';

const L = {
  bn: {
    intro: 'সিকিউরিটি শিল্ড প্রতিটি রিকোয়েস্ট পরীক্ষা করে: রেট লিমিট, স্ক্যানার / ইনজেকশন চেষ্টা, অন্য সাইট থেকে লেখার চেষ্টা। সন্দেহজনক কাজের পয়েন্ট জমে ১০ হলে IP স্বয়ংক্রিয়ভাবে ব্লক হয় — বারবার হলে ১৫ মিনিট → ১ ঘণ্টা → ২৪ ঘণ্টা → ৭ দিন।',
    active: 'সক্রিয় ব্লক', b24: '২৪ ঘণ্টায় নতুন ব্লক', auto7: '৭ দিনে স্বয়ংক্রিয় ব্লক', failed: '২৪ ঘণ্টায় ভুল লগইন',
    blockNew: 'ম্যানুয়ালি ব্লক করুন', target: 'কাকে', ip: 'IP ঠিকানা', email: 'অ্যাকাউন্টের ইমেইল', duration: 'কতক্ষণ', reason: 'কারণ', block: 'ব্লক করুন',
    durations: { 60: '১ ঘণ্টা', 1440: '২৪ ঘণ্টা', 10080: '৭ দিন', 0: 'আনব্লক না করা পর্যন্ত' },
    blocked: 'ব্লক তালিকা', who: 'IP / অ্যাকাউন্ট', why: 'কারণ', until: 'পর্যন্ত', src: 'উৎস', forever: 'আনব্লক না করা পর্যন্ত', auto: 'স্বয়ংক্রিয়', manual: 'ম্যানুয়াল', unblock: 'আনব্লক করুন', none: 'এখন কোনো ব্লক নেই।',
    watch: 'নজরে আছে (পয়েন্ট জমছে)', events: 'সাম্প্রতিক নিরাপত্তা ঘটনা', limits: 'রেট লিমিট (প্রতি IP, প্রতি মিনিট)', bad: { invalid_ip: 'সঠিক IP দিন', user_not_found: 'এই ইমেইলে কোনো অ্যাকাউন্ট নেই', cannot_block_self: 'নিজেকে ব্লক করা যাবে না', target_required: 'IP বা ইমেইল দিন' }
  },
  en: {
    intro: 'The security shield checks every request: rate limits, scanner / injection probes and cross-site writes. Suspicious activity earns points; at 10 the IP is blocked automatically — repeat offenders for 15 min → 1 h → 24 h → 7 days.',
    active: 'Active blocks', b24: 'New blocks (24 h)', auto7: 'Automatic blocks (7 days)', failed: 'Failed logins (24 h)',
    blockNew: 'Block manually', target: 'Who', ip: 'IP address', email: 'Account email', duration: 'For how long', reason: 'Reason', block: 'Block',
    durations: { 60: '1 hour', 1440: '24 hours', 10080: '7 days', 0: 'Until lifted' },
    blocked: 'Block list', who: 'IP / account', why: 'Reason', until: 'Until', src: 'Source', forever: 'Until lifted', auto: 'Automatic', manual: 'Manual', unblock: 'Unblock', none: 'Nothing is blocked right now.',
    watch: 'Watch list (points building up)', events: 'Recent security events', limits: 'Rate limits (per IP, per minute)', bad: { invalid_ip: 'Enter a valid IP', user_not_found: 'No account with that email', cannot_block_self: 'You can’t block yourself', target_required: 'Enter an IP or an email' }
  }
};

const when = (v, lang) => (v ? new Date(String(v).replace(' ', 'T')).toLocaleString(lang === 'en' ? 'en-GB' : 'bn-BD', { dateStyle: 'medium', timeStyle: 'short' }) : null);

// Admin → Security (owner / superadmin only).
export default function SecurityTab() {
  const { lang } = useApp();
  const l = L[lang === 'en' ? 'en' : 'bn'];
  const q = useAdminData('/api/admin/security');
  const [f, setF] = useState({ kind: 'ip', ip: '', email: '', minutes: 1440, reason: '' });
  const [err, setErr] = useState('');
  const d = q.data;

  const submit = async (e) => {
    e.preventDefault();
    if (!e.currentTarget.reportValidity()) return;
    setErr('');
    try {
      q.setData(await send('/api/admin/security', 'POST', { ip: f.kind === 'ip' ? f.ip : undefined, email: f.kind === 'email' ? f.email : undefined, minutes: f.minutes, reason: f.reason }));
      setF({ ...f, ip: '', email: '', reason: '' });
    } catch (x) { setErr(l.bad[x.message] || x.message); }
  };

  if (q.loading && !d) return <div className="kpi-grid">{[0, 1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: 96 }} />)}</div>;
  if (q.error) return <div className="surface state"><p>{String(q.error)}</p><button type="button" className="btn btn-secondary" onClick={q.reload}><Icon name="refresh" size={16} /></button></div>;

  return (
    <div className="stack" style={{ '--gap': '22px' }}>
      <p className="notice notice-info"><Icon name="shield" size={18} />{l.intro}</p>
      <div className="kpi-grid">
        <div className="kpi"><span className="kpi-label">{l.active}</span><span className="kpi-value">{num(lang, d.stats.activeBlocks)}</span></div>
        <div className="kpi"><span className="kpi-label">{l.b24}</span><span className="kpi-value">{num(lang, d.stats.blocks24)}</span></div>
        <div className="kpi"><span className="kpi-label">{l.auto7}</span><span className="kpi-value">{num(lang, d.stats.auto7)}</span></div>
        <div className="kpi"><span className="kpi-label">{l.failed}</span><span className="kpi-value">{num(lang, d.stats.failedLogins24)}</span></div>
      </div>

      <form className="surface surface-pad stack" onSubmit={submit} noValidate>
        <h2 className="h4"><Icon name="lock" size={18} /> {l.blockNew}</h2>
        <div className="segmented" role="radiogroup" aria-label={l.target}>
          <button type="button" aria-pressed={f.kind === 'ip'} data-confirm="off" onClick={() => setF({ ...f, kind: 'ip' })}>{l.ip}</button>
          <button type="button" aria-pressed={f.kind === 'email'} data-confirm="off" onClick={() => setF({ ...f, kind: 'email' })}>{l.email}</button>
        </div>
        <div className="form-grid">
          {f.kind === 'ip'
            ? <div className="field"><label htmlFor="sb-ip" className="req">{l.ip}</label><input id="sb-ip" className="input" required pattern="(\d{1,3}\.){3}\d{1,3}|[0-9a-fA-F:]{2,39}" placeholder="203.0.113.7" value={f.ip} onChange={(e) => setF({ ...f, ip: e.target.value })} /></div>
            : <div className="field"><label htmlFor="sb-email" className="req">{l.email}</label><input id="sb-email" className="input" type="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>}
          <div className="field"><label htmlFor="sb-dur">{l.duration}</label>
            <select id="sb-dur" className="select" value={f.minutes} onChange={(e) => setF({ ...f, minutes: Number(e.target.value) })}>
              {Object.entries(l.durations).map(([m, t]) => <option key={m} value={m}>{t}</option>)}
            </select></div>
          <div className="field"><label htmlFor="sb-reason">{l.reason}</label><input id="sb-reason" className="input" maxLength={200} value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })} /></div>
        </div>
        {err && <p className="field-error" role="alert">{err}</p>}
        <div><button type="submit" className="btn btn-danger" data-confirm={`${l.block}: ${f.kind === 'ip' ? f.ip : f.email}`}><Icon name="lock" size={16} />{l.block}</button></div>
      </form>

      <section className="stack" style={{ '--gap': '10px' }}>
        <h2 className="h4">{l.blocked}</h2>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>{l.who}</th><th>{l.why}</th><th>{l.src}</th><th>{l.until}</th><th /></tr></thead>
            <tbody>
              {!d.blocks.length ? <tr><td colSpan={5} className="muted">{l.none}</td></tr> : d.blocks.map((b) => (
                <tr key={b.id}>
                  <td className="strong">{b.ip ? <code>{b.ip}</code> : b.email || `#${b.userId}`}</td>
                  <td>{b.reason}{b.strikes > 1 && <span className="badge badge-danger" style={{ marginLeft: 6 }}>×{num(lang, b.strikes)}</span>}</td>
                  <td><span className={`badge ${b.source === 'auto' ? 'badge-warning' : 'badge-info'}`}>{l[b.source]}</span></td>
                  <td className="tabular">{when(b.until, lang) || l.forever}</td>
                  <td><button type="button" className="btn btn-secondary btn-sm" data-confirm="off" onClick={async () => q.setData(await send('/api/admin/security', 'DELETE', { id: b.id }))}><Icon name="check" size={14} />{l.unblock}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="panel-grid">
        <section className="surface surface-pad stack">
          <h2 className="h4">{l.watch}</h2>
          {!d.watch.length ? <p className="muted small">—</p> : (
            <ol className="barlist">{d.watch.map((w) => (
              <li key={w.ip} style={{ '--w': `${Math.min(100, (w.score / d.threshold) * 100)}%`, '--c': w.score >= d.threshold * 0.7 ? 'var(--c-pink)' : 'var(--c-yellow)' }}>
                <span className="barlist-bar" aria-hidden="true" /><span className="barlist-label"><code>{w.ip}</code></span><strong className="barlist-val tabular">{num(lang, w.score)}/{num(lang, d.threshold)}</strong>
              </li>))}
            </ol>
          )}
          <h3 className="h5" style={{ marginTop: 10 }}>{l.limits}</h3>
          <ul className="cluster" style={{ listStyle: 'none', padding: 0, margin: 0, '--gap': '6px' }}>
            {Object.entries(d.limits).map(([k, v]) => <li key={k} className="badge">{k}: {num(lang, v.limit)}</li>)}
          </ul>
        </section>
        <section className="surface stack" style={{ '--gap': 0 }}>
          <div className="surface-head"><h2 className="h4">{l.events}</h2></div>
          <ol className="activity is-compact">
            {d.recent.map((r, i) => (
              <li key={i} className="activity-item">
                <span className="activity-icon" style={{ background: r.action.includes('unblock') ? 'var(--c-lime)' : r.action.includes('block') ? 'var(--c-pink)' : 'var(--c-yellow)' }} aria-hidden="true"><Icon name={r.action.includes('login') ? 'lock' : 'shield'} size={15} /></span>
                <div className="activity-body"><p className="activity-text">{r.action.replace(/_/g, ' ')} · {r.targetType} {r.targetId}</p><p className="activity-meta">{r.detail}{r.detail ? ' · ' : ''}{when(r.at, lang)}</p></div>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}
