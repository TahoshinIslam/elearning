'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Icon from '@/components/Icon';
import { copy, taka, dateLabel } from '@/lib/copy';

const STATUS = { paid: 'badge-success', pending: 'badge-warning', failed: 'badge-danger', cancelled: '', refunded: 'badge-info' };

export default function OrdersView({ lang, orders }) {
  const c = copy(lang);
  const router = useRouter();
  const [busy, setBusy] = useState(null);
  const [msg, setMsg] = useState(null);
  const check = async (id) => {
    setBusy(id); setMsg(null);
    try {
      const res = await fetch(`/api/orders/${id}/reconcile`, { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error);
      setMsg({ id, t: c[`res_${data.order.status}_t`] || c.st_pending });
      router.refresh();
    } catch (e) { setMsg({ id, t: c[`err_${e.message}`] || c.err_generic, err: true }); } finally { setBusy(null); }
  };
  return (
    <div className="stack" style={{ '--gap': '20px' }}>
      <div className="page-head" style={{ marginBottom: 0 }}><div><h1>{c.ordersTitle}</h1></div></div>
      {!orders.length ? (
        <div className="surface state"><div className="state-icon"><Icon name="receipt" size={24} /></div><p>{c.ordersEmpty}</p><Link href="/courses" className="btn btn-secondary">{c.browseCourses}</Link></div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <caption className="sr-only">{c.ordersTitle}</caption>
            <thead><tr><th scope="col">{c.orderNo}</th><th scope="col">{c.date}</th><th scope="col">{c.items}</th><th scope="col">{c.amount}</th><th scope="col">{c.status}</th><th scope="col"><span className="sr-only">{c.checkAgain}</span></th></tr></thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td className="tabular nowrap"><Link className="link" href={`/checkout/result?order=${o.id}`}>#{o.id}</Link></td>
                  <td className="nowrap small">{dateLabel(lang, o.createdAt)}</td>
                  <td style={{ minWidth: 200 }}>{o.items.map((it) => <div key={it.courseId}><Link href={`/course/${it.slug}`}>{it.title}</Link></div>)}</td>
                  <td className="tabular nowrap">{o.amount ? taka(lang, o.amount) : c.free}{o.discount > 0 && <div className="xsmall muted">−{taka(lang, o.discount)} ({o.couponCode})</div>}</td>
                  <td><span className={`badge ${STATUS[o.status] || ''}`}>{c[`st_${o.status}`] || o.status}</span>{o.gatewayTrxId && <div className="xsmall muted mono">{o.gatewayTrxId}</div>}</td>
                  <td className="nowrap">
                    {o.status === 'pending' && o.gateway === 'bkash' && (
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => check(o.id)} disabled={busy === o.id}>{busy === o.id ? <span className="spinner" aria-hidden="true" /> : <Icon name="refresh" size={14} />}{c.checkAgain}</button>
                    )}
                    {msg?.id === o.id && <div className={`xsmall ${msg.err ? 'field-error' : 'muted'}`} role="status">{msg.t}</div>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
