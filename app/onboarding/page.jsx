'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { SWATCH_COLORS } from '@/lib/i18n';

export default function OnboardingPage() {
  const router = useRouter();
  const {
    t, lang,
    centerName, setCenterName, slug,
    brandColor, setBrandColor,
    payModel, setPayModel
  } = useApp();

  const [step, setStep] = useState(1);
  const [batchName, setBatchName] = useState('HSC ফিজিক্স — ব্যাচ ৩');
  const [batchFee, setBatchFee] = useState('1500');
  const [batchTime, setBatchTime] = useState('শনি-সোম-বুধ · সন্ধ্যা ৭টা');

  const next = () => setStep((s) => Math.min(4, s + 1));
  const back = () => setStep((s) => Math.max(1, s - 1));

  const stepLabel = lang === 'bn' ? `ধাপ ${step}/৪` : `STEP ${step}/4`;

  const dotStyle = (n) => ({
    width: 26,
    height: 6,
    borderRadius: 99,
    background: step >= n ? 'var(--brand)' : 'var(--line)',
    transition: 'background .2s ease'
  });

  const optionStyle = (selected) => ({
    textAlign: 'left',
    borderRadius: 14,
    padding: '18px 20px',
    fontFamily: 'inherit',
    background: '#fff',
    border: selected ? '2.5px solid var(--brand)' : '1.5px solid var(--field-line)',
    boxShadow: selected ? '0 0 0 4px var(--brand-tint)' : 'none',
    transition: 'border-color .15s ease, box-shadow .15s ease'
  });

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '48px 20px 80px' }} className="anim-in">
      {/* step indicator */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13, letterSpacing: '.08em', color: 'var(--brand)' }}>
          {stepLabel}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {[1, 2, 3, 4].map((n) => (
            <div key={n} style={dotStyle(n)} />
          ))}
        </div>
      </div>

      {/* step 1 — center name & brand */}
      {step === 1 && (
        <div className="panel" style={{ padding: 32 }}>
          <h1 style={{ margin: '0 0 6px', fontSize: 30, lineHeight: 1.2, fontWeight: 700 }}>{t.w1T}</h1>
          <p style={{ margin: '0 0 26px', color: 'var(--muted)', fontSize: 15 }}>{t.w1S}</p>

          <label className="label" htmlFor="centerName">{t.centerName}</label>
          <input
            id="centerName"
            className="input"
            value={centerName}
            onChange={(e) => setCenterName(e.target.value)}
            placeholder={t.centerPh}
          />

          <div
            style={{
              marginTop: 14,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'var(--brand-wash)',
              border: '1px dashed #f2b28a',
              borderRadius: 10,
              padding: '10px 14px',
              flexWrap: 'wrap'
            }}
          >
            <span style={{ fontSize: 12.5, color: '#9a3412', fontWeight: 600 }}>{t.subdomain}</span>
            <span className="mono" style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--brand)' }}>
              {slug}.leolearning.app
            </span>
          </div>

          <label className="label" style={{ margin: '22px 0 8px' }}>{t.brandColor}</label>
          <div style={{ display: 'flex', gap: 10 }}>
            {SWATCH_COLORS.map((c) => (
              <button
                key={c}
                aria-label={`Brand color ${c}`}
                onClick={() => setBrandColor(c)}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  background: c,
                  border: `3px solid ${brandColor === c ? 'var(--coal)' : 'transparent'}`,
                  transition: 'border-color .15s ease'
                }}
              />
            ))}
          </div>

          <button className="btn-primary" onClick={next} style={{ marginTop: 28, width: '100%', padding: 14, borderRadius: 12, fontSize: 16 }}>
            {t.next} →
          </button>
        </div>
      )}

      {/* step 2 — first batch */}
      {step === 2 && (
        <div className="panel" style={{ padding: 32 }}>
          <h1 style={{ margin: '0 0 6px', fontSize: 30, lineHeight: 1.2, fontWeight: 700 }}>{t.w2T}</h1>
          <p style={{ margin: '0 0 26px', color: 'var(--muted)', fontSize: 15 }}>{t.w2S}</p>

          <label className="label" htmlFor="batchName">{t.batchName}</label>
          <input id="batchName" className="input" value={batchName} onChange={(e) => setBatchName(e.target.value)} />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 16 }}>
            <div>
              <label className="label" htmlFor="batchFee">{t.monthlyFee}</label>
              <input id="batchFee" className="input" value={batchFee} onChange={(e) => setBatchFee(e.target.value)} />
            </div>
            <div>
              <label className="label" htmlFor="batchTime">{t.schedule}</label>
              <input id="batchTime" className="input" value={batchTime} onChange={(e) => setBatchTime(e.target.value)} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 28 }}>
            <button className="btn-outline" onClick={back} style={{ padding: '14px 22px', borderRadius: 12, fontSize: 15 }}>
              ← {t.back}
            </button>
            <button className="btn-primary" onClick={next} style={{ flex: 1, padding: 14, borderRadius: 12, fontSize: 16 }}>
              {t.next} →
            </button>
          </div>
        </div>
      )}

      {/* step 3 — payment model */}
      {step === 3 && (
        <div className="panel" style={{ padding: 32 }}>
          <h1 style={{ margin: '0 0 6px', fontSize: 30, lineHeight: 1.2, fontWeight: 700 }}>{t.w3T}</h1>
          <p style={{ margin: '0 0 26px', color: 'var(--muted)', fontSize: 15 }}>{t.w3S}</p>

          <div style={{ display: 'grid', gap: 14 }}>
            <button onClick={() => setPayModel('A')} style={optionStyle(payModel === 'A')}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <span style={{ fontSize: 16, fontWeight: 700 }}>{t.optA}</span>
                <span className="chip chip-green">{t.simple}</span>
              </div>
              <div style={{ fontSize: 13.5, color: 'var(--muted)', lineHeight: 1.55 }}>{t.optAD}</div>
            </button>

            <button onClick={() => setPayModel('B')} style={optionStyle(payModel === 'B')}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <span style={{ fontSize: 16, fontWeight: 700 }}>{t.optB}</span>
                <span className="chip chip-violet">{t.scalable}</span>
              </div>
              <div style={{ fontSize: 13.5, color: 'var(--muted)', lineHeight: 1.55 }}>{t.optBD}</div>
            </button>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 28 }}>
            <button className="btn-outline" onClick={back} style={{ padding: '14px 22px', borderRadius: 12, fontSize: 15 }}>
              ← {t.back}
            </button>
            <button className="btn-primary" onClick={next} style={{ flex: 1, padding: 14, borderRadius: 12, fontSize: 16 }}>
              {t.next} →
            </button>
          </div>
        </div>
      )}

      {/* step 4 — done */}
      {step === 4 && (
        <div className="panel" style={{ padding: '44px 32px', textAlign: 'center' }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'var(--green-chip-bg)',
              color: '#16a34a',
              display: 'grid',
              placeItems: 'center',
              fontSize: 30,
              margin: '0 auto 18px'
            }}
          >
            ✓
          </div>
          <h1 style={{ margin: '0 0 8px', fontSize: 30, fontWeight: 700 }}>{t.w4T}</h1>
          <p style={{ margin: '0 auto 10px', color: 'var(--muted)', fontSize: 15, maxWidth: 400 }}>{t.w4S}</p>
          <div className="mono" style={{ fontSize: 14, fontWeight: 700, color: 'var(--brand)', marginBottom: 26 }}>
            {slug}.leolearning.app
          </div>
          <button className="btn-dark" onClick={() => router.push('/owner')} style={{ padding: '14px 34px', borderRadius: 12, fontSize: 16 }}>
            {t.goDash} →
          </button>
        </div>
      )}
    </div>
  );
}
