'use client';

import { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';

export default function ReferralTab() {
  const { t, api, showToast } = useApp();
  const [data, setData] = useState({ code: '', count: 0, referred: [] });

  useEffect(() => { api.getReferral().then(setData).catch(() => {}); }, []);

  const link = typeof window !== 'undefined' && data.code ? `${window.location.origin}/register?ref=${data.code}` : '';
  const copy = async (text) => { try { await navigator.clipboard.writeText(text); showToast(t.referralCopied); } catch { /* ignore */ } };

  return (
    <div className="anim-in">
      <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>{t.referralTitle}</div>
      <div style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 20 }}>{t.referralSub}</div>

      <div className="panel" style={{ padding: 24, maxWidth: 520, marginBottom: 20 }}>
        <label className="label">{t.referralYourCode}</label>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <input className="input mono" readOnly value={data.code} style={{ fontWeight: 700, letterSpacing: '.08em' }} />
          <button className="btn-primary" style={{ borderRadius: 10 }} onClick={() => copy(data.code)}>{t.referralCopy}</button>
        </div>
        <label className="label">{t.referralLink}</label>
        <div style={{ display: 'flex', gap: 8 }}>
          <input className="input" readOnly value={link} style={{ fontSize: 12.5 }} />
          <button className="btn-dark" style={{ borderRadius: 10 }} onClick={() => copy(link)}>{t.referralCopy}</button>
        </div>
      </div>

      <div className="card" style={{ padding: 20, maxWidth: 520 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 12 }}>
          <div className="display" style={{ fontSize: 34, color: 'var(--brand)' }}>{data.count}</div>
          <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--muted)' }}>{t.referralCount}</div>
        </div>
        {data.referred.length === 0 ? (
          <div style={{ fontSize: 13, color: 'var(--faint)' }}>{t.referralNone}</div>
        ) : (
          <div style={{ display: 'grid', gap: 8 }}>
            {data.referred.map((r, i) => (
              <div key={i} className="row-line" style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: 13.5 }}>
                <span style={{ fontWeight: 600 }}>🎉 {r.name}</span>
                <span style={{ color: 'var(--faint)', fontSize: 12 }}>{String(r.createdAt).slice(0, 10)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
