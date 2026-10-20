'use client';

import { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';
import Icon from '@/components/Icon';
import DataTable from '@/components/ui/DataTable';
import { taka, num, dateLabel } from '@/lib/copy';

export default function PaymentsTab() {
  const { t, lang, payments, api, showToast } = useApp();
  const bn = lang === 'bn';
  const en = !bn;

  // real marketplace orders — the actual checkout ledger
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState(null);
  const load = () => api.getOrders().then((d) => { setOrders(d); setError(null); }).catch(() => setError(true));
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const refundOrder = async (o) => {
    if (!window.confirm(bn ? 'রিফান্ড করলে এই অর্ডারের সব কোর্স এক্সেস বাতিল হয়ে যাবে। নিশ্চিত?' : 'Refunding this order will revoke access to every course it granted. Continue?')) return;
    try {
      await api.refundOrder(o.id);
      showToast(bn ? 'রিফান্ড করা হয়েছে, এনরোলমেন্ট বাতিল করা হয়েছে' : 'Refunded — enrollment access revoked', 'success');
      load();
    } catch { showToast(t.errGeneric, 'error'); }
  };

  // Ask bKash for the real status of an unsettled order (or all of them).
  const [checking, setChecking] = useState(null);
  const reconcileOrder = async (o) => {
    setChecking(o.id);
    try {
      const res = await fetch(`/api/orders/${o.id}/reconcile`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast(bn ? `অর্ডার #${o.id}: ${data.order.status}` : `Order #${o.id}: ${data.order.status}`, 'info');
      load();
    } catch { showToast(t.errGeneric, 'error'); } finally { setChecking(null); }
  };
  const reconcileAll = async () => {
    setChecking('all');
    try {
      const res = await fetch('/api/orders/reconcile', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast(bn ? `${num(lang, data.checked)}টি অপেক্ষমাণ অর্ডার যাচাই করা হয়েছে` : `Re-verified ${data.checked} pending order(s)`, 'info');
      load();
    } catch { showToast(t.errGeneric, 'error'); } finally { setChecking(null); }
  };

  const refund = async (p) => {
    try { await api.refundPayment(p.id); showToast(t.payRefunded, 'success'); }
    catch { showToast(t.errGeneric, 'error'); }
  };

  const STATUS = {
    paid: ['badge-success', bn ? 'পরিশোধিত' : 'Paid'],
    pending: ['badge-warning', bn ? 'অপেক্ষমাণ' : 'Pending'],
    failed: ['badge-danger', bn ? 'ব্যর্থ' : 'Failed'],
    cancelled: ['', bn ? 'বাতিল' : 'Cancelled'],
    refunded: ['badge-info', bn ? 'রিফান্ডেড' : 'Refunded']
  };
  const list = orders || [];
  const paid = list.filter((o) => o.status === 'paid');

  return (
    <div className="stack" style={{ '--gap': '28px' }}>
      <div className="stat-tiles">
        <div className="surface stat-tile"><div className="v">{taka(lang, paid.reduce((a, o) => a + o.amount, 0))}</div><div className="l">{bn ? 'পরিশোধিত অর্ডারের মোট' : 'Total of paid orders'}</div></div>
        <div className="surface stat-tile"><div className="v">{num(lang, paid.length)}</div><div className="l">{bn ? 'পরিশোধিত অর্ডার' : 'Paid orders'}</div></div>
        <div className="surface stat-tile"><div className="v">{num(lang, list.filter((o) => o.status === 'pending').length)}</div><div className="l">{bn ? 'অপেক্ষমাণ' : 'Pending'}</div></div>
        <div className="surface stat-tile"><div className="v">{num(lang, list.filter((o) => o.failureReason === 'duplicate_purchase_refund_due').length)}</div><div className="l">{bn ? 'ডুপ্লিকেট — রিফান্ড প্রাপ্য' : 'Duplicates — refund due'}</div></div>
      </div>

      <section aria-labelledby="orders-h" className="stack" style={{ '--gap': '10px' }}>
        <h2 id="orders-h" className="h3">{bn ? 'মার্কেটপ্লেস অর্ডার' : 'Marketplace orders'}</h2>
        <p className="small muted">{bn ? 'কোর্স চেকআউট থেকে আসা প্রকৃত লেনদেন — bKash-এর মাধ্যমে বা ফ্রি কোর্সে তাৎক্ষণিক এনরোলমেন্ট। রিফান্ডের টাকা bKash মার্চেন্ট প্যানেল থেকে ফেরত দিতে হবে; এখানে রিফান্ড করলে অ্যাক্সেস বন্ধ হয়।' : 'Real transactions from course checkout — via bKash, or instant enrollment for free courses. Refund the money from the bKash merchant panel; refunding here records it and revokes access.'}</p>
        <DataTable lang={lang} caption={bn ? 'অর্ডার' : 'Orders'} rows={list} loading={orders === null && !error} error={error} onRetry={load}
          searchText={(o) => `#${o.id} ${o.studentName || ''} ${o.items.map((i) => i.courseTitle).join(' ')} ${o.gatewayTrxId || ''}`}
          filters={[{ key: 'status', label: bn ? 'অবস্থা' : 'Status', options: Object.entries(STATUS).map(([value, [, label]]) => ({ value, label })), test: (o, v) => o.status === v }]}
          initialSort={{ key: 'id', dir: 'desc' }}
          toolbar={<button type="button" className="btn btn-secondary btn-sm" onClick={reconcileAll} disabled={checking === 'all'}>{checking === 'all' ? <span className="spinner" aria-hidden="true" /> : <Icon name="refresh" size={15} />}{bn ? 'অপেক্ষমাণ অর্ডার যাচাই' : 'Re-verify pending orders'}</button>}
          columns={[
            { key: 'id', label: '#', nowrap: true, render: (o) => <span className="mono small">#{o.id}</span> },
            { key: 'studentName', label: bn ? 'শিক্ষার্থী' : 'Student', render: (o) => <span className="strong">{o.studentName || `#${o.studentId}`}</span> },
            { key: 'items', label: bn ? 'কোর্স' : 'Course(s)', sortable: false, render: (o) => <span className="small">{o.items.map((it) => it.courseTitle).join(', ') || '—'}</span> },
            { key: 'amount', label: bn ? 'পরিমাণ' : 'Amount', align: 'right', render: (o) => <span className="strong tabular">{taka(lang, o.amount)}</span> },
            { key: 'gateway', label: bn ? 'গেটওয়ে' : 'Gateway', render: (o) => <span className="xsmall muted">{o.gateway === 'none' ? (bn ? 'ফ্রি' : 'Free') : 'bKash'}{o.gatewayTrxId ? ` · ${o.gatewayTrxId}` : ''}</span> },
            { key: 'status', label: bn ? 'অবস্থা' : 'Status', render: (o) => (<>
              <span className={`badge ${STATUS[o.status]?.[0] || ''}`}>{STATUS[o.status]?.[1] || o.status}</span>
              {o.failureReason === 'duplicate_purchase_refund_due' && <div className="badge badge-danger" style={{ marginTop: 4 }}>{bn ? 'ডুপ্লিকেট — রিফান্ড প্রাপ্য' : 'Duplicate — refund due'}</div>}
            </>) },
            { key: 'createdAt', label: bn ? 'তারিখ' : 'Date', render: (o) => <span className="small muted nowrap">{dateLabel(lang, o.createdAt)}</span> }
          ]}
          rowActions={(o) => (<>
            {o.status === 'pending' && o.gateway === 'bkash' && (
              <button type="button" onClick={() => reconcileOrder(o)} className="btn btn-secondary btn-sm" disabled={checking === o.id}>
                {checking === o.id && <span className="spinner" aria-hidden="true" />}{bn ? 'যাচাই' : 'Check'}
              </button>
            )}
            {o.status === 'paid' && <button type="button" onClick={() => refundOrder(o)} className="btn btn-danger btn-sm">{bn ? 'রিফান্ড' : 'Refund'}</button>}
          </>)}
        />
      </section>

      {/* legacy manual fee ledger (owner Fees tab "mark paid" entries) */}
      <section aria-labelledby="manual-h" className="stack" style={{ '--gap': '10px' }}>
        <h2 id="manual-h" className="h3">{bn ? 'ম্যানুয়াল পেমেন্ট এন্ট্রি' : 'Manually recorded payments'}</h2>
        <p className="small muted">{bn ? 'ফিস ট্যাব থেকে ম্যানুয়ালি রেকর্ড করা ব্যাচ ফি — মার্কেটপ্লেস চেকআউট থেকে নয়।' : 'Batch fees recorded manually from the Fees tab — not from marketplace checkout.'}</p>
        <DataTable lang={lang} caption={bn ? 'ম্যানুয়াল পেমেন্ট' : 'Manual payments'} rows={payments}
          searchText={(p) => `${p.invoiceNo} ${p.studentName}`} initialSort={{ key: 'id', dir: 'desc' }}
          columns={[
            { key: 'invoiceNo', label: t.payInvoice, render: (p) => <span className="mono small">{p.invoiceNo}</span> },
            { key: 'studentName', label: t.payStudent },
            { key: 'amount', label: t.payAmount, align: 'right', render: (p) => <span className="tabular">{taka(lang, p.amount)}</span> },
            { key: 'method', label: t.payMethod, render: (p) => <span className="xsmall muted">{p.method}</span> },
            { key: 'status', label: t.payStatus, render: (p) => <span className={`badge ${p.status === 'refunded' ? '' : 'badge-success'}`}>{p.status === 'refunded' ? t.payRefunded : t.paySuccess}</span> }
          ]}
          rowActions={(p) => (p.status !== 'refunded' ? <button type="button" onClick={() => refund(p)} className="btn btn-danger btn-sm">{t.payRefund}</button> : null)}
        />
      </section>
    </div>
  );
}
