'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import Icon from '@/components/Icon';
import { copy, taka } from '@/lib/copy';

// CTA states come from the server (getViewerCourseState); this only renders
// them and performs the follow-up action. Nothing here grants access.
export function PurchaseActions({ course, state, lang, compact = false }) {
  const c = copy(lang);
  const router = useRouter();
  const { addToCart, isInCart, setCartOpen, showToast } = useApp();
  const [checking, setChecking] = useState(false);
  const checkout = `/checkout?courses=${course.id}`;
  const learn = `/learn/${course.slug}`;
  const size = compact ? '' : 'btn-lg';

  if (state.status === 'enrolled') {
    return (
      <div className="stack" style={{ '--gap': '10px' }}>
        {!compact && <p className="small row" style={{ color: 'var(--success)', '--gap': '6px' }}><Icon name="checkCircle" size={16} />{c.youOwn}</p>}
        <Link href={learn} className={`btn btn-primary btn-block ${size}`}>{state.started ? c.continueLearning : c.startLearning}<Icon name="arrowRight" size={18} /></Link>
      </div>
    );
  }
  if (state.status === 'staff') {
    return (
      <div className="stack" style={{ '--gap': '10px' }}>
        {!compact && <p className="small muted">{c.staffView}</p>}
        <Link href={learn} className={`btn btn-dark btn-block ${size}`}>{c.openPlayer}</Link>
        {!compact && <Link href="/owner" className="btn btn-secondary btn-block">{c.manageCourse}</Link>}
      </div>
    );
  }
  if (state.status === 'not_student') {
    return <p className="small muted">{c.notStudentNote}</p>;
  }
  if (state.status === 'pending') {
    const recheck = async () => {
      setChecking(true);
      try {
        const res = await fetch(`/api/orders/${state.orderId}/reconcile`, { method: 'POST' });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error);
        if (data.order?.status === 'paid') showToast(c.res_paid_t, 'success');
        else if (data.order?.status !== 'pending') showToast(c[`res_${data.order?.status}_t`] || c.err_generic, 'info');
        else showToast(c.res_pending_t, 'info');
        router.refresh();
      } catch (e) {
        showToast(c[`err_${e.message}`] || c.err_generic, 'error');
      } finally { setChecking(false); }
    };
    return (
      <div className="stack" style={{ '--gap': '10px' }}>
        <div className="notice notice-warn" role="status"><Icon name="clock" size={18} /><div><strong>{c.pendingT}</strong><br />{c.pendingD}</div></div>
        <button type="button" className={`btn btn-primary btn-block ${size}`} onClick={recheck} disabled={checking} aria-busy={checking}>
          {checking ? <span className="spinner" aria-hidden="true" /> : <Icon name="refresh" size={17} />}{c.checkPayment}
        </button>
        <Link href={checkout} className="btn btn-secondary btn-block">{c.tryAgain}</Link>
      </div>
    );
  }
  // guest or available
  const free = !course.price;
  const inCart = isInCart(course.id);
  return (
    <div className="stack" style={{ '--gap': '10px' }}>
      <Link href={checkout} className={`btn btn-primary btn-block ${size}`}>{free ? c.enrollFree : c.buyNow}</Link>
      {!free && !compact && (
        inCart
          ? <button type="button" className="btn btn-secondary btn-block" onClick={() => setCartOpen(true)}><Icon name="cart" size={17} />{c.inCart}</button>
          : <button type="button" className="btn btn-secondary btn-block" onClick={() => addToCart({ id: course.id, title: course.title, price: course.price, slug: course.slug, instructor: course.instructor })}><Icon name="cartPlus" size={17} />{c.addToCart}</button>
      )}
    </div>
  );
}

export function MobileBuyBar({ course, state, lang }) {
  const c = copy(lang);
  // Only shown once the purchase card has scrolled out of view, so the
  // same action never appears twice on screen.
  const [show, setShow] = useState(false);
  useEffect(() => {
    const card = document.querySelector('.buy-card');
    if (!card || !('IntersectionObserver' in window)) { setShow(true); return undefined; }
    const io = new IntersectionObserver(([e]) => setShow(!e.isIntersecting && e.boundingClientRect.top < 0), { threshold: 0 });
    io.observe(card);
    return () => io.disconnect();
  }, []);
  if (!show) return null;
  return (
    <div className="mobile-buy-bar" role="region" aria-label={c.buyNow}>
      <div className="grow">
        <div className="strong clamp-2" style={{ fontSize: 14, lineHeight: 1.3 }}>{course.title}</div>
        {state.status !== 'enrolled' && state.status !== 'staff' && <div className="price" style={{ fontSize: 17 }}>{course.price ? taka(lang, course.price) : c.free}</div>}
      </div>
      <div style={{ width: 170, flex: 'none' }}><PurchaseActions course={course} state={state} lang={lang} compact /></div>
    </div>
  );
}
