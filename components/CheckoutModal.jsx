'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';

const COUPON_ERR = {
  coupon_invalid: 'couponInvalid', coupon_expired: 'couponExpired',
  coupon_exhausted: 'couponExhausted', coupon_wrong_center: 'couponInvalid'
};

// Free courses enroll instantly (server creates a $0 paid order). Paid
// courses redirect the browser to bKash's own hosted checkout page — there
// is no in-app "enter your PIN" step; the actual payment happens on bKash's
// servers, and access is only granted after the bKash callback verifies it
// (see app/api/payments/bkash/callback/route.js). onConfirm(...) is only
// called for the free/instant path — a paid purchase navigates away.
export default function CheckoutModal({ course, batch, t, onClose, onConfirm, affiliateCode }) {
  const { api, showToast } = useApp();
  const free = course.price === 0;
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

  const buy = async () => {
    setBusy(true);
    try {
      const result = await api.createOrder({
        courseId: course.id,
        ...(applied?.code ? { couponCode: applied.code } : {}),
        ...(affiliateCode ? { affiliateCode } : {})
      });
      if (result.paid) {
        await onConfirm();
        return;
      }
      if (result.bkashURL) {
        window.location.href = result.bkashURL; // real redirect to bKash's hosted checkout
        return;
      }
      setBusy(false);
    } catch (e) {
      setBusy(false);
      showToast(e?.data?.error === 'already_enrolled' ? t.cdEnrolledChip : t.errGeneric, 'error');
    }
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
          <button aria-label="Close" onClick={onClose} disabled={busy} style={{ border: 'none', background: 'var(--line-softer)', borderRadius: 8, width: 30, height: 30, fontSize: 14 }}>✕</button>
        </div>

        {/* order summary */}
        <div style={{ background: 'var(--paper)', borderRadius: 12, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--faint)', letterSpacing: '.04em' }}>{t.orderSummary}</div>
          <Row label={course.title} value={batch?.name || ''} />
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
        {!free && (
          <div style={{ marginBottom: 18 }}>
            {applied ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--green-chip-bg)', color: 'var(--green-chip-fg)', borderRadius: 10, padding: '9px 12px', fontSize: 13 }}>
                <span>🎟 {t.couponApplied}: <b>{applied.code}</b></span>
                <button onClick={removeCoupon} disabled={busy} style={{ border: 'none', background: 'none', color: 'inherit', fontWeight: 700, cursor: 'pointer', fontSize: 12.5 }}>{t.couponRemove}</button>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder={t.couponCode} disabled={busy}
                    style={{ flex: 1, padding: '10px 12px', border: '1.5px solid var(--line)', borderRadius: 10, fontSize: 13.5, fontFamily: 'inherit', textTransform: 'uppercase' }} />
                  <button onClick={applyCoupon} disabled={busy} style={{ border: '1.5px solid var(--brand)', background: 'var(--brand-wash)', color: 'var(--brand-deep)', borderRadius: 10, padding: '0 16px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13.5 }}>
                    {t.couponApply}
                  </button>
                </div>
                {couponErr && <div style={{ color: '#c92a2a', fontSize: 12.5, marginTop: 6 }}>{couponErr}</div>}
              </>
            )}
          </div>
        )}

        {free ? (
          <>
            <div style={{ fontSize: 13, color: 'var(--green-chip-fg)', background: 'var(--green-chip-bg)', borderRadius: 10, padding: '10px 12px', lineHeight: 1.55, marginBottom: 16 }}>
              🎁 {t.freeEnrollNote}
            </div>
            <button className="btn btn-primary-lg" disabled={busy} onClick={buy} style={{ width: '100%' }}>
              {t.cdEnrollFree}
            </button>
          </>
        ) : (
          <button
            onClick={buy}
            disabled={busy}
            style={{ width: '100%', border: 'none', background: 'var(--bkash)', color: '#fff', borderRadius: 12, padding: 14, fontSize: 15.5, fontWeight: 700, fontFamily: 'inherit', opacity: busy ? 0.75 : 1 }}
          >
            {busy ? '…' : `${t.payWithBkash} · ৳${price}`}
          </button>
        )}
      </div>
    </div>
  );
}
