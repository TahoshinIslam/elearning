'use client';

import { useState } from 'react';
import Icon from '@/components/Icon';

const WALLETS = [
  { id: 'bkash', name: 'bKash', color: '#E2136E', live: true },
  { id: 'nagad', name: 'Nagad', color: '#F7941D', live: false },
  { id: 'rocket', name: 'Rocket', color: '#8C3494', live: false },
  { id: 'upay', name: 'Upay', color: '#00A0E3', live: false }
];

const T = {
  bn: {
    mobile: 'মোবাইল ব্যাংকিং', card: 'কার্ড', demo: 'ডেমো', live: 'চালু',
    walletNo: (w) => `${w} অ্যাকাউন্ট নম্বর`, walletHint: '০১ দিয়ে শুরু ১১ অঙ্কের নম্বর', walletRedirect: 'পেমেন্ট সম্পন্ন করতে bKash-এর নিরাপদ পেজে নিয়ে যাওয়া হবে।',
    cardNo: 'কার্ড নম্বর', cardName: 'কার্ডে থাকা নাম', expiry: 'মেয়াদ (MM/YY)', cvc: 'CVC',
    badNumber: 'কার্ড নম্বর সঠিক নয়', badName: 'কার্ডের নাম লিখুন', badExpiry: 'মেয়াদ সঠিক নয় বা শেষ', badCvc: 'CVC সঠিক নয়', badWallet: 'সঠিক মোবাইল নম্বর দিন (01XXXXXXXXX)',
    demoNote: 'ডেমো: এই পদ্ধতি এখনো যুক্ত হয়নি — কোনো টাকা কাটা হবে না।', secure: 'কার্ডের তথ্য আমাদের সার্ভারে যায় না বা সংরক্ষণ হয় না।'
  },
  en: {
    mobile: 'Mobile banking', card: 'Card', demo: 'Demo', live: 'Live',
    walletNo: (w) => `${w} account number`, walletHint: '11 digits starting with 01', walletRedirect: 'You’ll be taken to bKash’s secure page to approve the payment.',
    cardNo: 'Card number', cardName: 'Name on card', expiry: 'Expiry (MM/YY)', cvc: 'CVC',
    badNumber: 'That card number isn’t valid', badName: 'Enter the name on the card', badExpiry: 'Invalid or expired date', badCvc: 'Invalid CVC', badWallet: 'Enter a valid mobile number (01XXXXXXXXX)',
    demoNote: 'Demo: this method isn’t connected yet — no money will be taken.', secure: 'Card details never reach or stay on our servers.'
  }
};

export function cardBrand(num) {
  const n = num.replace(/\D/g, '');
  if (/^4/.test(n)) return 'visa';
  if (/^(5[1-5]|2(2[2-9]|[3-6]\d|7[01]|720))/.test(n)) return 'mastercard';
  if (/^3[47]/.test(n)) return 'amex';
  return null;
}
export function luhn(num) {
  const n = num.replace(/\D/g, '');
  if (n.length < 12 || n.length > 19) return false;
  let sum = 0;
  for (let i = 0; i < n.length; i++) {
    let d = Number(n[n.length - 1 - i]);
    if (i % 2) { d *= 2; if (d > 9) d -= 9; }
    sum += d;
  }
  return sum % 10 === 0;
}
const fmtCard = (v, brand) => {
  const d = v.replace(/\D/g, '').slice(0, brand === 'amex' ? 15 : 19);
  return brand === 'amex' ? d.replace(/^(\d{0,4})(\d{0,6})(\d{0,5}).*/, (_, a, b, c) => [a, b, c].filter(Boolean).join(' ')) : d.replace(/(\d{4})(?=\d)/g, '$1 ');
};
const validExpiry = (v) => {
  const m = /^(\d{2})\/(\d{2})$/.exec(v);
  if (!m) return false;
  const mo = Number(m[1]);
  const yr = 2000 + Number(m[2]);
  if (mo < 1 || mo > 12) return false;
  const now = new Date();
  return yr > now.getFullYear() || (yr === now.getFullYear() && mo >= now.getMonth() + 1);
};
export const validBdMobile = (v) => /^01[3-9]\d{8}$/.test(v.replace(/[\s-]/g, ''));

// Validate the current method; returns { ok, errors }.
export function validatePayment(p) {
  const errors = {};
  if (p.tab === 'card') {
    const brand = cardBrand(p.card.number);
    if (!luhn(p.card.number) || !brand) errors.number = true;
    if (p.card.name.trim().length < 2) errors.name = true;
    if (!validExpiry(p.card.expiry)) errors.expiry = true;
    if (!new RegExp(`^\\d{${brand === 'amex' ? 4 : 3}}$`).test(p.card.cvc)) errors.cvc = true;
  } else if (p.wallet !== 'bkash' && !validBdMobile(p.walletNumber)) errors.wallet = true;
  return { ok: !Object.keys(errors).length, errors };
}

export const isLiveMethod = (p) => p.tab === 'mobile' && p.wallet === 'bkash';

// Payment method picker: mobile wallets (bKash live; Nagad / Rocket / Upay
// demo) and cards (demo). Card data stays in the browser — when a card
// gateway is connected it should be its hosted fields, never our server.
export default function PaymentMethods({ value, onChange, errors = {}, lang = 'bn' }) {
  const t = T[lang === 'en' ? 'en' : 'bn'];
  const set = (patch) => onChange({ ...value, ...patch });
  const setCard = (patch) => onChange({ ...value, card: { ...value.card, ...patch } });
  const brand = cardBrand(value.card.number);
  const wallet = WALLETS.find((w) => w.id === value.wallet) || WALLETS[0];
  const [flip, setFlip] = useState(false);

  return (
    <div className="pay">
      <div className="auth-tabs" role="tablist" aria-label={t.mobile}>
        <button type="button" role="tab" aria-selected={value.tab === 'mobile'} onClick={() => set({ tab: 'mobile' })}><Icon name="phone" size={16} />{t.mobile}</button>
        <button type="button" role="tab" aria-selected={value.tab === 'card'} onClick={() => set({ tab: 'card' })}><Icon name="card" size={16} />{t.card}</button>
      </div>

      {value.tab === 'mobile' ? (
        <div className="stack" style={{ '--gap': '14px' }}>
          <div className="pay-wallets" role="radiogroup" aria-label={t.mobile}>
            {WALLETS.map((w) => (
              <label key={w.id} className={`pay-wallet ${value.wallet === w.id ? 'is-on' : ''}`} style={{ '--w': w.color }}>
                <input type="radio" name="wallet" value={w.id} checked={value.wallet === w.id} onChange={() => set({ wallet: w.id })} />
                <span className="pay-wallet-logo">{w.name}</span>
                <span className={`badge ${w.live ? 'badge-success' : ''}`}>{w.live ? t.live : t.demo}</span>
              </label>
            ))}
          </div>
          {wallet.live ? (
            <div className="notice notice-info"><Icon name="shield" size={18} />{t.walletRedirect}</div>
          ) : (
            <div className="field">
              <label htmlFor="pay-wallet-no" className="req">{t.walletNo(wallet.name)}</label>
              <input id="pay-wallet-no" className="input tabular" inputMode="numeric" autoComplete="tel-national" placeholder="01XXXXXXXXX" maxLength={14}
                value={value.walletNumber} onChange={(e) => set({ walletNumber: e.target.value.replace(/[^\d\s-]/g, '') })} aria-invalid={!!errors.wallet} aria-describedby="pay-wallet-help" />
              <span id="pay-wallet-help" className={errors.wallet ? 'field-error' : 'help'}>{errors.wallet ? t.badWallet : t.walletHint}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="pay-card-grid">
          <div className={`pay-card-face ${flip ? 'is-flipped' : ''} brand-${brand || 'none'}`} aria-hidden="true">
            <div className="pay-card-front">
              <div className="row between"><span className="pay-chip" /><span className="pay-brand">{brand ? brand.toUpperCase() : 'CARD'}</span></div>
              <div className="pay-number tabular">{fmtCard(value.card.number, brand) || '•••• •••• •••• ••••'}</div>
              <div className="row between"><span>{value.card.name || 'YOUR NAME'}</span><span className="tabular">{value.card.expiry || 'MM/YY'}</span></div>
            </div>
            <div className="pay-card-back"><div className="pay-strip" /><div className="pay-cvc tabular">{value.card.cvc || 'CVC'}</div></div>
          </div>
          <div className="stack" style={{ '--gap': '12px' }}>
            <div className="field">
              <label htmlFor="pay-cc" className="req">{t.cardNo}</label>
              <input id="pay-cc" className="input tabular" inputMode="numeric" autoComplete="cc-number" placeholder="4242 4242 4242 4242"
                value={fmtCard(value.card.number, brand)} onChange={(e) => setCard({ number: e.target.value })} aria-invalid={!!errors.number} />
              {errors.number && <span className="field-error">{t.badNumber}</span>}
            </div>
            <div className="field">
              <label htmlFor="pay-name" className="req">{t.cardName}</label>
              <input id="pay-name" className="input" autoComplete="cc-name" value={value.card.name} onChange={(e) => setCard({ name: e.target.value.toUpperCase().slice(0, 40) })} aria-invalid={!!errors.name} />
              {errors.name && <span className="field-error">{t.badName}</span>}
            </div>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="pay-exp" className="req">{t.expiry}</label>
                <input id="pay-exp" className="input tabular" inputMode="numeric" autoComplete="cc-exp" placeholder="MM/YY" maxLength={5}
                  value={value.card.expiry} onChange={(e) => { const d = e.target.value.replace(/\D/g, '').slice(0, 4); setCard({ expiry: d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d }); }} aria-invalid={!!errors.expiry} />
                {errors.expiry && <span className="field-error">{t.badExpiry}</span>}
              </div>
              <div className="field">
                <label htmlFor="pay-cvc" className="req">{t.cvc}</label>
                <input id="pay-cvc" className="input tabular" inputMode="numeric" autoComplete="cc-csc" maxLength={brand === 'amex' ? 4 : 3}
                  value={value.card.cvc} onFocus={() => setFlip(true)} onBlur={() => setFlip(false)} onChange={(e) => setCard({ cvc: e.target.value.replace(/\D/g, '') })} aria-invalid={!!errors.cvc} />
                {errors.cvc && <span className="field-error">{t.badCvc}</span>}
              </div>
            </div>
            <p className="xsmall muted row" style={{ '--gap': '6px' }}><Icon name="lock" size={13} />{t.secure}</p>
          </div>
        </div>
      )}
      {!isLiveMethod(value) && <div className="notice notice-warn"><Icon name="info" size={18} />{t.demoNote}</div>}
    </div>
  );
}
