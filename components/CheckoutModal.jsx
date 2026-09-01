'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';

const COUPON_ERR = {
  coupon_invalid: 'couponInvalid', coupon_expired: 'couponExpired',
  coupon_exhausted: 'couponExhausted', coupon_wrong_center: 'couponInvalid'
};

// Free courses skip payment (single confirm). Paid courses go pay → pin → success → complete.
// onConfirm(couponCode) actually creates the enrollment (passed by the course page).
export default function CheckoutModal({ course, batch, t, onClose, onConfirm }) {
  const { api } = useApp();
  const free = course.price === 0;
  const [step, setStep] = useState(free ? 'confirm' : 'pay');
  const [pin, setPin] = useState('');
  const [busy, setBusy] = useState(false);

  // coupon state
  const [code, setCode] = useState('');
  const [applied, setApplied] = useState(null); // { code, discount, finalAmount }
  const [couponErr, setCouponErr] = useState('');
  const price = applied ? applied.finalAmount : course.price;

  const applyCoupon = async () => {
    if (!code.trim()) return;
    setCouponErr('');
    try {
      const r = await api.validateCoupon(code.trim(), course.price);
      setApplied({ code: code.trim().toUpperCase(), discount: r.discount, finalAmount: r.finalAmount });
    } catch (e) {
      setApplied(null);
      setCouponErr(t[COUPON_ERR[e?.data?.error]] || t.couponInvalid);
    }
  };
  const removeCoupon = () => { setApplied(null); setCode(''); setCouponErr(''); };

  const finish = async () => {
    setBusy(true);
    try { await onConfirm(applied?.code); } finally { setBusy(false); }
  };

  const Row = ({ label, value, strong }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 14 }}>
      <span style={{ color: 'var(--muted)' }}>{label}</span>
      <span style={{ fontWeight: strong ? 800 : 600 }}>{value}</span>
    </div>
  );

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(22,19,15,.55)', zIndex: 90, display: 'grid', placeItems: 'center', padding: 20 }}
      onClick={(e) => { if (e.target === e.currentTarget && !busy) onClose(); }}
    >
      <div style={{ background: '#fff', borderRadius: 20, width: 'min(430px,100%)', padding: 26, animation: 'leoIn .2s ease' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{t.checkoutTitle}</div>
          <button aria-label="Close" onClick={onClose} style={{ border: 'none', background: 'var(--line-softer)', borderRadius: 8, width: 30, height: 30, fontSize: 14 }}>✕</button>
        </div>

        {/* order summary (always shown) */}
        <div style={{ background: 'var(--paper)', borderRadius: 12, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--faint)', letterSpacing: '.04em' }}>{t.orderSummary}</div>
          <Row label={course.title} value={batch.name} />
          <div style={{ borderTop: '1px dashed var(--line)', margin: '4px 0' }} />
          {applied ? (
            <>
              <Row label={t.coursePrice} value={`৳${course.price}`} />
              <Row label={`${t.couponDiscount} · ${applied.code}`} value={`− ৳${applied.discount}`} />
              <div style={{ borderTop: '1px dashed var(--line)', margin: '4px 0' }} />
              <Row label={t.coursePrice} value={`৳${price}`} strong />
            </>
          ) : (
            <Row label={t.coursePrice} value={free ? t.cdFree : `৳${course.price}`} strong />
          )}
        </div>

        {/* coupon (paid courses only) */}
        {!free && step !== 'success' && (
          <div style={{ marginBottom: 18 }}>
            {applied ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--green-chip-bg)', color: 'var(--green-chip-fg)', borderRadius: 10, padding: '9px 12px', fontSize: 13 }}>
                <span>🎟 {t.couponApplied}: <b>{applied.code}</b></span>
                <button onClick={removeCoupon} style={{ border: 'none', background: 'none', color: 'inherit', fontWeight: 700, cursor: 'pointer', fontSize: 12.5 }}>{t.couponRemove}</button>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder={t.couponCode}
                    style={{ flex: 1, padding: '10px 12px', border: '1.5px solid var(--line)', borderRadius: 10, fontSize: 13.5, fontFamily: 'inherit', textTransform: 'uppercase' }} />
                  <button onClick={applyCoupon} style={{ border: '1.5px solid var(--brand)', background: 'var(--brand-wash)', color: 'var(--brand-deep)', borderRadius: 10, padding: '0 16px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13.5 }}>
                    {t.couponApply}
                  </button>
                </div>
                {couponErr && <div style={{ color: '#c92a2a', fontSize: 12.5, marginTop: 6 }}>{couponErr}</div>}
              </>
            )}
          </div>
        )}

        {/* FREE flow */}
        {free && (
          <>
            <div style={{ fontSize: 13, color: 'var(--green-chip-fg)', background: 'var(--green-chip-bg)', borderRadius: 10, padding: '10px 12px', lineHeight: 1.55, marginBottom: 16 }}>
              🎁 {t.freeEnrollNote}
            </div>
            <button className="btn btn-primary-lg" disabled={busy} onClick={finish} style={{ width: '100%' }}>
              {t.cdEnrollFree}
            </button>
          </>
        )}

        {/* PAID flow */}
        {!free && step === 'pay' && (
          <button
            onClick={() => setStep('pin')}
            style={{ width: '100%', border: 'none', background: 'var(--bkash)', color: '#fff', borderRadius: 12, padding: 14, fontSize: 15.5, fontWeight: 700, fontFamily: 'inherit' }}
          >
            {t.payWithBkash} · ৳{price}
          </button>
        )}

        {!free && step === 'pin' && (
          <>
            <div style={{ fontSize: 13.5, color: 'var(--muted)', marginBottom: 12 }}>{t.pinNote}</div>
            <input
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="• • • • •"
              inputMode="numeric"
              style={{ width: '100%', padding: 14, border: '1.5px solid var(--bkash)', borderRadius: 12, fontSize: 22, letterSpacing: '.4em', textAlign: 'center', outline: 'none', marginBottom: 16 }}
            />
            <button
              onClick={() => setStep('success')}
              style={{ width: '100%', border: 'none', background: 'var(--bkash)', color: '#fff', borderRadius: 12, padding: 14, fontSize: 15.5, fontWeight: 700, fontFamily: 'inherit' }}
            >
              {t.confirm}
            </button>
          </>
        )}

        {!free && step === 'success' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 54, height: 54, borderRadius: '50%', background: 'var(--green-chip-bg)', color: '#16a34a', display: 'grid', placeItems: 'center', fontSize: 24, margin: '4px auto 12px' }}>✓</div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>{t.paySuccess}</div>
            <div className="mono" style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>TrxID: 9GK4A2LX07</div>
            <button className="btn btn-primary-lg" disabled={busy} onClick={finish} style={{ width: '100%', marginTop: 18 }}>
              {t.completeEnroll}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
