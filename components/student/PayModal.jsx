'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';

export default function PayModal({ onClose }) {
  const { t, payModel, setStudentPaid } = useApp();
  const [step, setStep] = useState(1);
  const [pin, setPin] = useState('');

  const done = () => {
    setStudentPaid(true);
    onClose();
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(22,19,15,.55)', zIndex: 80, display: 'grid', placeItems: 'center', padding: 20 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: '#fff', borderRadius: 20, width: 'min(420px,100%)', padding: 28, animation: 'leoIn .2s ease' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{t.payTitle}</div>
          <button
            aria-label="Close"
            onClick={onClose}
            style={{ border: 'none', background: 'var(--line-softer)', borderRadius: 8, width: 30, height: 30, fontSize: 14 }}
          >
            ✕
          </button>
        </div>

        {step === 1 && (
          <>
            <div style={{ fontSize: 13.5, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 18 }}>
              {payModel === 'A' ? t.payNoteA : t.payNoteB}
            </div>
            <div style={{ background: 'var(--paper)', borderRadius: 12, padding: '16px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{t.payAmount}</div>
              <div className="display" style={{ fontSize: 24 }}>৳1,500</div>
            </div>
            <button
              onClick={() => setStep(2)}
              style={{ width: '100%', border: 'none', background: 'var(--bkash)', color: '#fff', borderRadius: 12, padding: 14, fontSize: 15.5, fontWeight: 700 }}
            >
              bKash {t.payNow}
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <div style={{ fontSize: 13.5, color: 'var(--muted)', marginBottom: 14 }}>{t.pinNote}</div>
            <input
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="• • • • •"
              inputMode="numeric"
              style={{ width: '100%', padding: 14, border: '1.5px solid var(--bkash)', borderRadius: 12, fontSize: 22, letterSpacing: '.4em', textAlign: 'center', outline: 'none', marginBottom: 16 }}
            />
            <button
              onClick={() => setStep(3)}
              style={{ width: '100%', border: 'none', background: 'var(--bkash)', color: '#fff', borderRadius: 12, padding: 14, fontSize: 15.5, fontWeight: 700 }}
            >
              {t.confirm}
            </button>
          </>
        )}

        {step === 3 && (
          <div style={{ textAlign: 'center', padding: '14px 0 6px' }}>
            <div style={{ width: 58, height: 58, borderRadius: '50%', background: 'var(--green-chip-bg)', color: '#16a34a', display: 'grid', placeItems: 'center', fontSize: 26, margin: '0 auto 14px' }}>
              ✓
            </div>
            <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>{t.paySuccess}</div>
            <div className="mono" style={{ fontSize: 12.5, color: 'var(--muted)' }}>TrxID: 9GK4A2LX07</div>
            <button className="btn-dark" onClick={done} style={{ marginTop: 20, padding: '12px 28px', borderRadius: 11 }}>
              {t.done}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
