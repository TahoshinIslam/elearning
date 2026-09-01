'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';

export default function ProfileTab() {
  const { t, centerDisplay, showToast, payments, auth, api } = useApp();
  const STUDENT_ID = auth?.studentId;
  const [name, setName] = useState(auth?.name || '');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState(auth?.email || '');
  const [pw, setPw] = useState({ old: '', neu: '' });
  const [pwBusy, setPwBusy] = useState(false);

  const myPayments = payments.filter((p) => p.studentId === STUDENT_ID);
  const typeLabel = (ty) => (ty === 'fee' ? t.payTypeFee : t.payTypeEnroll);

  const changePassword = async () => {
    if (!pw.old || pw.neu.length < 6) { showToast(t.errWeakPassword); return; }
    setPwBusy(true);
    try { await api.changePassword(pw.old, pw.neu); setPw({ old: '', neu: '' }); showToast(t.pwChanged); }
    catch (e) { showToast(e?.data?.error === 'wrong_password' ? t.pwWrong : t.errGeneric); }
    finally { setPwBusy(false); }
  };

  return (
    <div className="anim-in">
      <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 18 }}>{t.sProfile}</div>
      <div className="panel" style={{ padding: 28, maxWidth: 520 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <div className="avatar" style={{ width: 60, height: 60, background: 'var(--brand)', color: '#fff', fontSize: 24 }}>{(name || '?')[0]}</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 17 }}>{name}</div>
            <div style={{ fontSize: 13, color: 'var(--muted)' }}>HSC ফিজিক্স — ব্যাচ ৩ · {centerDisplay}</div>
          </div>
        </div>

        <label className="label" htmlFor="pName">{t.fullName}</label>
        <input id="pName" className="input" style={{ fontSize: 15, marginBottom: 16 }} value={name} onChange={(e) => setName(e.target.value)} />

        <label className="label" htmlFor="pPhone">{t.phoneLabel}</label>
        <input id="pPhone" className="input" style={{ fontSize: 15, marginBottom: 16 }} value={phone} onChange={(e) => setPhone(e.target.value)} />

        <label className="label" htmlFor="pEmail">{t.emailLabel}</label>
        <input id="pEmail" className="input" style={{ fontSize: 15, marginBottom: 24 }} value={email} onChange={(e) => setEmail(e.target.value)} />

        <button className="btn-primary" style={{ width: '100%', padding: 14, borderRadius: 12, fontSize: 15.5 }} onClick={() => showToast(t.profileSaved)}>
          {t.update} ✓
        </button>
      </div>

      {/* change password */}
      <div className="panel" style={{ padding: 24, maxWidth: 520, marginTop: 26 }}>
        <h3 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 14px' }}>🔒 {t.changePw}</h3>
        <label className="label">{t.oldPw}</label>
        <input className="input" type="password" value={pw.old} onChange={(e) => setPw({ ...pw, old: e.target.value })} style={{ marginBottom: 12 }} />
        <label className="label">{t.newPw}</label>
        <input className="input" type="password" value={pw.neu} onChange={(e) => setPw({ ...pw, neu: e.target.value })} style={{ marginBottom: 18 }} />
        <button className="btn-primary" style={{ borderRadius: 10 }} disabled={pwBusy} onClick={changePassword}>{pwBusy ? '…' : t.pwSave}</button>
      </div>

      {/* payment history */}
      <div style={{ maxWidth: 520, marginTop: 26 }}>
        <h3 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 12px' }}>{t.payHistory}</h3>
        {myPayments.length === 0 ? (
          <div className="card" style={{ padding: 20, textAlign: 'center', color: 'var(--faint)', fontSize: 13.5 }}>{t.payNone}</div>
        ) : (
          <div className="card" style={{ overflow: 'hidden' }}>
            {myPayments.map((p) => (
              <div key={p.id} className="row-line" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 18px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{typeLabel(p.type)} · ৳{p.amount.toLocaleString('en-IN')}</div>
                  <div className="mono" style={{ fontSize: 11, color: 'var(--faint)' }}>{p.invoiceNo} · {p.createdAt}</div>
                </div>
                <span className={`chip ${p.status === 'refunded' ? 'chip-red' : 'chip-green'}`}>
                  {p.status === 'refunded' ? t.payStatusRefunded : t.payStatusSuccess}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
