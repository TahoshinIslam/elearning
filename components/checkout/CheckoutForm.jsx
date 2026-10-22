'use client';

import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import Icon from '@/components/Icon';
import CourseCover from '@/components/ui/CourseCover';
import { copy, taka, num } from '@/lib/copy';

const newKey = () => `ck-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

export default function CheckoutForm({ lang, items, payable, initialQuote, paymentsAvailable }) {
  const c = copy(lang);
  const router = useRouter();
  const { removeFromCart } = useApp();
  const subtotal = useMemo(() => payable.reduce((s, i) => s + i.price, 0), [payable]);
  const [code, setCode] = useState('');
  const [quote, setQuote] = useState(initialQuote || null); // server quote (offers + optional coupon)
  const [couponError, setCouponError] = useState(null);
  const [applying, setApplying] = useState(false);
  const [agree, setAgree] = useState(false);
  const [agreeError, setAgreeError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  // One idempotency key per checkout attempt: a double click or retry
  // returns the same order instead of opening a second bKash payment.
  const keyRef = useRef(newKey());
  const total = quote ? quote.amount : subtotal;
  const free = total === 0;
  const ids = payable.map((i) => i.id);

  const applyCoupon = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;
    setApplying(true); setCouponError(null);
    try {
      const res = await fetch('/api/orders/quote', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ courseIds: ids, couponCode: code.trim() }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setQuote(data);
      keyRef.current = newKey();
    } catch (err) {
      setQuote(initialQuote || null);
      setCouponError(c[`err_${err.message}`] || c.err_coupon_invalid);
    } finally { setApplying(false); }
  };

  const submit = async () => {
    if (!agree) { setAgreeError(true); document.getElementById('agree')?.focus(); return; }
    setBusy(true); setError(null);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseIds: ids, couponCode: quote?.couponCode || undefined, idempotencyKey: keyRef.current })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'generic');
      ids.forEach((id) => removeFromCart(id));
      if (data.bkashURL) { window.location.assign(data.bkashURL); return; }
      router.push(`/checkout/result?order=${data.order.id}`);
    } catch (err) {
      setError(err.message === 'Failed to fetch' ? c.err_network : (c[`err_${err.message}`] || c.err_generic));
      setBusy(false);
    }
  };

  return (
    <div className="checkout-grid">
      <section className="stack" aria-labelledby="items-h" style={{ '--gap': '16px' }}>
        <h2 id="items-h" className="h3">{c.orderSummary}</h2>
        <ul className="surface" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {items.map((item, i) => (
            <li key={item.id} className="row" style={{ padding: 16, borderTop: i ? '1px solid var(--border)' : 0, alignItems: 'flex-start', opacity: item.issue ? 0.6 : 1 }}>
              <div style={{ width: 120, flex: 'none' }}><CourseCover id={item.id} title={item.title} category={item.category} thumbnailUrl={item.thumbnailUrl} size="sm" /></div>
              <div className="grow stack" style={{ '--gap': '4px' }}>
                <Link href={`/course/${item.slug}`} className="strong" style={{ lineHeight: 1.35 }}>{item.title}</Link>
                {item.instructor && <span className="small muted">{item.instructor}</span>}
                {item.issue === 'owned' && <span className="badge badge-success" style={{ alignSelf: 'flex-start' }}><Icon name="check" size={13} />{c.err_already_enrolled}</span>}
                {item.issue === 'unavailable' && <span className="badge badge-warning" style={{ alignSelf: 'flex-start' }}>{c.unavailableT}</span>}
              </div>
              <span className="stack" style={{ '--gap': '2px', alignItems: 'flex-end', textAlign: 'right' }}>
                <span className="strong tabular">{item.issue ? '—' : item.price ? taka(lang, item.price) : c.free}</span>
                {!item.issue && item.offer && item.listPrice > item.price && <s className="small muted tabular"><span className="sr-only">{c.listPriceSr}</span>{taka(lang, item.listPrice)}</s>}
                {!item.issue && item.offer && <span className="badge badge-brand">{c.offerSave(item.offer.type === 'percent' ? `${num(lang, item.offer.value)}%` : taka(lang, item.offer.value))}</span>}
              </span>
            </li>
          ))}
        </ul>
        {!free && payable.length > 0 && (
          <div className="surface surface-pad stack" style={{ '--gap': '12px' }}>
            <h3 className="h4">{c.payWith}</h3>
            <div className="row" style={{ padding: 12, border: '1px solid var(--brand)', borderRadius: 'var(--r-md)', background: 'var(--brand-tint)' }}>
              <span className="badge" style={{ background: 'var(--bkash)', color: '#fff' }}>bKash</span>
              <span className="small" style={{ color: 'var(--ink-2)' }}>{c.bkashNote}</span>
            </div>
            {!paymentsAvailable && <div className="notice notice-warn" role="alert"><Icon name="alert" size={18} />{c.err_payments_unavailable}</div>}
          </div>
        )}
      </section>

      <aside className="surface surface-pad stack" aria-labelledby="total-h" style={{ '--gap': '14px', position: 'sticky', top: 'calc(var(--header-h) + 16px)' }}>
        <h2 id="total-h" className="h4">{c.total}</h2>
        <div className="summary-line"><span className="muted">{c.subtotal}</span><span className="tabular">{taka(lang, quote ? quote.subtotal : subtotal)}</span></div>
        {quote?.offerDiscount > 0 && <div className="summary-line" style={{ color: 'var(--success)' }}><span>{c.offerDiscount}</span><span className="tabular">−{taka(lang, quote.offerDiscount)}</span></div>}
        {quote?.couponDiscount > 0 && <div className="summary-line" style={{ color: 'var(--success)' }}><span>{c.discount} ({quote.couponCode})</span><span className="tabular">−{taka(lang, quote.couponDiscount)}</span></div>}
        <div className="divider" />
        <div className="summary-line"><span className="strong">{c.total}</span><span className="summary-total tabular">{free ? c.free : taka(lang, total)}</span></div>

        {subtotal > 0 && (
          <form onSubmit={applyCoupon} className="field" noValidate>
            <label htmlFor="coupon">{c.coupon}</label>
            {quote?.couponCode ? (
              <div className="row between">
                <span className="badge badge-success"><Icon name="check" size={13} />{c.couponApplied(quote.couponCode)}</span>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setQuote(initialQuote || null); setCode(''); keyRef.current = newKey(); }}>{c.removeCoupon}</button>
              </div>
            ) : (
              <div className="row" style={{ '--gap': '8px' }}>
                <input id="coupon" className="input" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} autoComplete="off" aria-invalid={!!couponError} aria-describedby={couponError ? 'coupon-err' : undefined} style={{ textTransform: 'uppercase' }} />
                <button type="submit" className="btn btn-secondary" disabled={applying || !code.trim()}>{applying && <span className="spinner" aria-hidden="true" />}{c.applyCoupon}</button>
              </div>
            )}
            {couponError && <p id="coupon-err" className="field-error" role="alert">{couponError}</p>}
          </form>
        )}

        <label className="check" htmlFor="agree">
          <input id="agree" type="checkbox" checked={agree} onChange={(e) => { setAgree(e.target.checked); setAgreeError(false); }} aria-invalid={agreeError} aria-describedby={agreeError ? 'agree-err' : undefined} />
          <span className="small">{c.agreeTerms} <Link href="/terms" className="link" target="_blank">{c.terms}</Link></span>
        </label>
        {agreeError && <p id="agree-err" className="field-error" role="alert">{c.required}</p>}

        {error && <div className="notice notice-danger" role="alert"><Icon name="alert" size={18} />{error}</div>}
        <button type="button" className={`btn btn-lg btn-block ${free ? 'btn-primary' : 'btn-bkash'}`} onClick={submit}
          disabled={busy || !payable.length || (!free && !paymentsAvailable)} aria-busy={busy}>
          {busy && <span className="spinner" aria-hidden="true" />}
          {busy ? (free ? c.processing : c.redirecting) : free ? c.confirmFree : c.payBkash(num(lang, total))}
        </button>
        <p className="xsmall muted row" style={{ alignItems: 'flex-start', '--gap': '6px' }}><Icon name="shield" size={14} style={{ marginTop: 2 }} />{c.accessNote}</p>
      </aside>
    </div>
  );
}
