'use client';

import { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';

const CREATE_ERR = { code_taken: 'affCodeTaken', invalid_code: 'affCodeTaken', invalid_pct: 'affCommission', name_required: 'affName' };
const fieldStyle = {
  border: '1px solid var(--field-line)', background: '#fff', borderRadius: 0,
  padding: '9px 11px', fontSize: 13.5, fontFamily: 'inherit', width: '100%'
};
const blank = { name: '', code: '', commissionPct: '10' };

export default function AffiliatesTab() {
  const { t, api, showToast } = useApp();
  const [affs, setAffs] = useState([]);
  const [f, setF] = useState(blank);
  const [err, setErr] = useState('');

  const load = () => api.getAffiliates().then(setAffs).catch(() => {});
  useEffect(() => { load(); }, []);

  const money = (n) => '৳' + Number(n || 0).toLocaleString('en-IN');

  const create = async () => {
    setErr('');
    try {
      setAffs(await api.createAffiliate({ name: f.name, code: f.code, commissionPct: Number(f.commissionPct) }));
      setF(blank); showToast(t.affCreated);
    } catch (e) { setErr(t[CREATE_ERR[e?.data?.error]] || t.errGeneric); }
  };
  const toggle = async (a) => setAffs(await api.toggleAffiliate(a.id, !a.isActive));
  const remove = async (a) => setAffs(await api.deleteAffiliate(a.id));
  const copyLink = async (code) => {
    try { await navigator.clipboard.writeText(`${window.location.origin}/landing?aff=${code}`); showToast(t.referralCopied); } catch { /* ignore */ }
  };

  return (
    <div className="anim-in">
      <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 18 }}>{t.affMgmt}</div>

      <div className="panel" style={{ padding: 20, marginBottom: 22 }}>
        <div style={{ fontWeight: 700, marginBottom: 14 }}>{t.affNew}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr auto', gap: 12, alignItems: 'end' }}>
          <div><label className="label">{t.affName}</label><input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} style={fieldStyle} /></div>
          <div><label className="label">{t.affCode}</label><input value={f.code} onChange={(e) => setF({ ...f, code: e.target.value.toUpperCase() })} placeholder="BLOG15" style={{ ...fieldStyle, textTransform: 'uppercase' }} /></div>
          <div><label className="label">{t.affCommission}</label><input type="number" value={f.commissionPct} onChange={(e) => setF({ ...f, commissionPct: e.target.value })} style={fieldStyle} /></div>
          <button className="btn-primary" style={{ borderRadius: 0, height: 38 }} onClick={create}>＋ {t.affCreate}</button>
        </div>
        {err && <div style={{ color: '#c92a2a', fontSize: 12.5, marginTop: 10 }}>{err}</div>}
      </div>

      {affs.length === 0 ? (
        <div className="panel" style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>{t.affNone}</div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr .8fr 1fr .8fr auto', gap: 10, padding: '12px 18px', fontSize: 12, fontWeight: 700, color: 'var(--faint)', borderBottom: '1.5px solid var(--line)' }}>
            <div>{t.affName}</div><div>{t.affCode}</div><div>{t.affCommission}</div><div>{t.affEarnings}</div><div>{t.affSales}</div><div />
          </div>
          {affs.map((a) => (
            <div key={a.id} className="row-line" style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr .8fr 1fr .8fr auto', gap: 10, padding: '13px 18px', alignItems: 'center', fontSize: 13.5 }}>
              <div style={{ fontWeight: 600 }}>{a.name}</div>
              <button className="mono" onClick={() => copyLink(a.code)} title={t.affLink} style={{ border: 'none', background: 'none', cursor: 'pointer', fontWeight: 700, color: 'var(--brand-deep)', textAlign: 'left' }}>{a.code} 🔗</button>
              <div>{a.commissionPct}%</div>
              <div className="display" style={{ fontSize: 14 }}>{money(a.earnings)}</div>
              <div>{a.sales}</div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button onClick={() => toggle(a)} className={`chip ${a.isActive ? 'chip-green' : ''}`} style={{ cursor: 'pointer', border: a.isActive ? 'none' : '1.5px solid var(--line)' }}>{a.isActive ? t.affActive : t.affInactive}</button>
                <button onClick={() => remove(a)} title={t.affDelete} style={{ border: 'none', background: 'none', color: 'var(--faint)', cursor: 'pointer', fontSize: 16 }}>🗑</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
