'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Icon from '@/components/Icon';
import { copy } from '@/lib/copy';

export default function ResultActions({ lang, order }) {
  const c = copy(lang);
  const router = useRouter();
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState(null);
  const auto = useRef(false);

  const recheck = async () => {
    setChecking(true); setError(null);
    try {
      const res = await fetch(`/api/orders/${order.id}/reconcile`, { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'generic');
      router.refresh();
    } catch (e) {
      setError(c[`err_${e.message}`] || c.err_generic);
    } finally { setChecking(false); }
  };

  // A pending bKash order is re-verified once automatically (the callback
  // may have been interrupted); after that the learner can retry by hand.
  useEffect(() => {
    if (order?.status === 'pending' && order.gateway === 'bkash' && !auto.current) { auto.current = true; recheck(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order?.status]);

  if (!order) return <div className="cluster" style={{ justifyContent: 'center' }}><Link href="/student?view=orders" className="btn btn-primary">{c.viewOrders}</Link></div>;
  const first = order.items[0];
  return (
    <div className="stack" style={{ '--gap': '10px' }}>
      {error && <div className="notice notice-danger" role="alert"><Icon name="alert" size={18} />{error}</div>}
      <div className="cluster" style={{ justifyContent: 'center' }}>
        {order.status === 'paid' && first && <Link href={`/learn/${first.slug}`} className="btn btn-primary btn-lg">{c.startLearning}<Icon name="arrowRight" size={18} /></Link>}
        {order.status === 'paid' && <Link href="/student" className="btn btn-secondary btn-lg">{c.goMyLearning}</Link>}
        {order.status === 'pending' && order.gateway === 'bkash' && (
          <button type="button" className="btn btn-primary btn-lg" onClick={recheck} disabled={checking} aria-busy={checking}>
            {checking ? <span className="spinner" aria-hidden="true" /> : <Icon name="refresh" size={17} />}{c.checkAgain}
          </button>
        )}
        {['failed', 'cancelled'].includes(order.status) && first && <Link href={`/checkout?courses=${order.items.map((i) => i.courseId).join(',')}`} className="btn btn-primary btn-lg">{c.tryAgain}</Link>}
        {['failed', 'cancelled', 'refunded', 'pending'].includes(order.status) && first && <Link href={`/course/${first.slug}`} className="btn btn-secondary btn-lg">{c.goToCourse}</Link>}
      </div>
    </div>
  );
}
