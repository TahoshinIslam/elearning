'use client';

import { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';

const CREATE_ERR = { code_taken: 'couponCodeTaken', invalid_code: 'couponInvalid', invalid_value: 'couponInvalid' };
const fieldStyle = {
  border: '1px solid var(--field-line)', background: '#fff', borderRadius: 8,
  padding: '9px 11px', fontSize: 13.5, fontFamily: 'inherit', width: '100%'
};
const blank = { code: '', type: 'percent', value: '', expiresAt: '', usageLimit: '' };

export default function CouponsTab() {
  const { t, api, showToast } = useApp();
  const [coupons, setCoupons] = useState([]);
  const [f, setF] = useState(blank);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));

  const load = () => api.getCoupons().then(setCoupons).catch(() => {});
  useEffect(() => { load(); }, []);

  const create = async () => {
    setErr('');
    setBusy(true);
    try {
      await api.createCoupon({
        code: f.code, type: f.type, value: Number(f.value),
        expiresAt: f.expiresAt || null, usageLimit: f.usageLimit ? Number(f.usageLimit) : null
      });
      showToast(t.couponCreated);
      setF(blank);
      load();
    } catch (e) {
      setErr(t[CREATE_ERR[e?.data?.error]] || t.couponInvalid);
    } finally { setBusy(false); }
  };

  const toggle = async (c) => setCoupons(await api.toggleCoupon(c.id, !c.isActive));
  const remove = async (c) => setCoupons(await api.deleteCoupon(c.id));

  return (
    <div className="anim-in">
      <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 18 }}>{t.couponMgmt}</div>

      {/* create form */}
      <div className="panel" style={{ padding: 20, marginBottom: 22 }}>
        <div style={{ fontWeight: 700, marginBottom: 14 }}>{t.couponNew}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(140px,100%),1fr))', gap: 12, alignItems: 'end' }}>
          <div>
            <label className="label">{t.couponCode}</label>
            <input value={f.code} onChange={(e) => setF((s) => ({ ...s, code: e.target.value.toUpperCase() }))} placeholder="SAVE20" style={{ ...fieldStyle, textTransform: 'uppercase' }} />
          </div>
          <div>
            <label className="label">{t.couponType}</label>
            <select value={f.type} onChange={set('type')} style={fieldStyle}>
              <option value="percent">{t.couponPercent}</option>
              <option value="fixed">{t.couponFixed}</option>
            </select>
          </div>
          <div>
            <label className="label">{t.couponValue}</label>
            <input type="number" value={f.value} onChange={set('value')} placeholder={f.type === 'percent' ? '20' : '500'} style={fieldStyle} />
          </div>
          <div>
            <label className="label">{t.couponExpiry}</label>
            <input type="date" value={f.expiresAt} onChange={set('expiresAt')} style={fieldStyle} />
          </div>
          <div>
            <label className="label">{t.couponLimit}</label>
            <input type="number" value={f.usageLimit} onChange={set('usageLimit')} placeholder={t.couponUnlimited} style={fieldStyle} />
          </div>
          <button className="btn-primary" style={{ borderRadius: 10, height: 38 }} disabled={busy} onClick={create}>{t.couponCreate}</button>
        </div>
        {err && <div style={{ color: '#c92a2a', fontSize: 12.5, marginTop: 10 }}>{err}</div>}
      </div>

      {/* list */}
      {coupons.length === 0 ? (
        <div className="panel" style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>{t.couponNoCoupons}</div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr 1fr 1fr 1fr auto', gap: 10, padding: '12px 18px', fontSize: 12, fontWeight: 700, color: 'var(--faint)', borderBottom: '1.5px solid var(--line)' }}>
            <div>{t.couponCode}</div><div>{t.couponDiscount}</div><div>{t.couponExpiry}</div><div>{t.couponUsed}</div><div>{t.couponScope}</div><div />
          </div>
          {coupons.map((c) => (
            <div key={c.id} className="row-line" style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr 1fr 1fr 1fr auto', gap: 10, padding: '13px 18px', alignItems: 'center', fontSize: 13.5 }}>
              <div className="mono" style={{ fontWeight: 700 }}>{c.code}</div>
              <div>{c.type === 'percent' ? `${c.value}%` : `৳${c.value}`}</div>
              <div style={{ color: 'var(--muted)' }}>{c.expiresAt || '—'}</div>
              <div>{c.usedCount}{c.usageLimit != null ? ` / ${c.usageLimit}` : ''}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>{c.tenantId == null ? t.couponGlobal : '—'}</div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button onClick={() => toggle(c)} className={`chip ${c.isActive ? 'chip-green' : ''}`} style={{ cursor: 'pointer', border: c.isActive ? 'none' : '1.5px solid var(--line)' }}>
                  {c.isActive ? t.couponActive : t.couponInactive}
                </button>
                <button onClick={() => remove(c)} title={t.couponDelete} style={{ border: 'none', background: 'none', color: 'var(--faint)', cursor: 'pointer', fontSize: 16 }}>🗑</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
