'use client';

import { useApp } from '@/context/AppContext';

export default function PaymentsTab() {
  const { t, payments, api, showToast } = useApp();
  const money = (n) => '৳' + Number(n || 0).toLocaleString('en-IN');

  const refund = async (p) => {
    try { await api.refundPayment(p.id); showToast(t.payRefunded); }
    catch { showToast(t.errGeneric); }
  };

  const rows = [...payments].sort((a, b) => b.id - a.id);

  return (
    <div className="anim-in">
      <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 18 }}>{t.payAdmin}</div>

      {rows.length === 0 ? (
        <div className="panel" style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>{t.payNone}</div>
      ) : (
        <div className="card" style={{ overflow: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.4fr 1fr .9fr 1fr auto', gap: 10, padding: '12px 18px', fontSize: 12, fontWeight: 700, color: 'var(--faint)', borderBottom: '1.5px solid var(--line)' }}>
            <div>{t.payInvoice}</div><div>{t.payStudent}</div><div>{t.payAmount}</div><div>{t.payMethod}</div><div>{t.payStatus}</div><div />
          </div>
          {rows.map((p) => (
            <div key={p.id} className="row-line" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.4fr 1fr .9fr 1fr auto', gap: 10, padding: '13px 18px', alignItems: 'center', fontSize: 13.5 }}>
              <div className="mono" style={{ fontSize: 11.5 }}>{p.invoiceNo}</div>
              <div style={{ fontWeight: 600 }}>{p.studentName}</div>
              <div className="display" style={{ fontSize: 14 }}>{money(p.amount)}</div>
              <div style={{ textTransform: 'uppercase', fontSize: 11.5, color: 'var(--muted)' }}>{p.method}</div>
              <div><span className={`chip ${p.status === 'refunded' ? '' : 'chip-green'}`} style={{ border: p.status === 'refunded' ? '1.5px solid var(--line)' : 'none' }}>{p.status === 'refunded' ? t.payRefunded : t.paySuccess}</span></div>
              <div>
                {p.status !== 'refunded' && (
                  <button onClick={() => refund(p)} className="chip" style={{ cursor: 'pointer', border: '1.5px solid var(--line)', color: 'var(--danger,#c92a2a)' }}>{t.payRefund}</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
