'use client';

import { useApp } from '@/context/AppContext';

const fmt = (n) => '৳' + n.toLocaleString('en-IN');

export default function FeesTab() {
  const { t, lang, students, markStudentPaid, payModel, setPayModel, payments, api, showToast } = useApp();
  const bn = lang === 'bn';

  const collected = students.filter((s) => s.paid).reduce((a, s) => a + s.amount, 0);
  const due = students.filter((s) => !s.paid).reduce((a, s) => a + s.amount, 0);
  const commission = Math.round(collected * 0.025);

  const revenue = payments.filter((p) => p.status === 'success').reduce((a, p) => a + p.amount, 0);
  const typeLabel = (ty) => (ty === 'fee' ? t.payTypeFee : t.payTypeEnroll);

  const handleMarkPaid = async (s) => {
    await markStudentPaid(s.id);
    // Payment Service: persist a transaction for the fee
    try { await api.recordPayment({ studentId: s.id, studentName: s.name, amount: s.amount, method: 'bkash', type: 'fee' }); } catch { /* ignore */ }
    showToast(bn ? 'পেমেন্ট রেকর্ড হয়েছে ✓' : 'Payment recorded ✓');
  };

  const refund = async (p) => {
    await api.refundPayment(p.id);
    showToast(t.payRefundedToast);
  };

  const pill = (on) => ({
    border: 'none',
    borderRadius: 99,
    padding: '7px 15px',
    fontSize: 12.5,
    fontWeight: 700,
    fontFamily: 'inherit',
    background: on ? 'var(--coal)' : 'none',
    color: on ? '#fff' : 'var(--muted)',
    transition: 'all .15s ease'
  });

  const bigStat = (label, value, color) => (
    <div>
      <div style={{ fontSize: 12.5, color: 'var(--muted)', fontWeight: 600 }}>{label}</div>
      <div className="display" style={{ fontSize: 28, color }}>{value}</div>
    </div>
  );

  return (
    <div className="anim-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>{t.fees}</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: '1.5px solid var(--line)', borderRadius: 99, padding: '5px 6px' }}>
          <button style={pill(payModel === 'A')} onClick={() => setPayModel('A')}>{t.modelA}</button>
          <button style={pill(payModel === 'B')} onClick={() => setPayModel('B')}>{t.modelB}</button>
        </div>
      </div>

      <div className="card" style={{ padding: 20, marginBottom: 18 }}>
        <div style={{ display: 'flex', gap: 34, flexWrap: 'wrap' }}>
          {bigStat(t.collected, fmt(collected), 'var(--green)')}
          {bigStat(t.pending, fmt(due), 'var(--brand)')}
          {payModel === 'B' && (
            <>
              {bigStat(t.commission, fmt(commission), '#7c3aed')}
              {bigStat(t.netPayout, fmt(collected - commission))}
            </>
          )}
        </div>
        <div style={{ marginTop: 14, fontSize: 13, color: 'var(--muted)', background: 'var(--paper)', borderRadius: 10, padding: '10px 14px', lineHeight: 1.6 }}>
          {payModel === 'A' ? t.feeNoteA : t.feeNoteB}
        </div>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        {students.map((s) => (
          <div key={s.id} className="row-line" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 20px' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 14.5 }}>{s.name}</div>
              <div style={{ fontSize: 12, color: 'var(--faint)' }}>{s.batch}</div>
            </div>
            <div className="display" style={{ fontWeight: 800, fontSize: 15 }}>৳{s.amount.toLocaleString('en-IN')}</div>
            {s.paid ? (
              <span className="chip chip-green">✓ {t.paid}</span>
            ) : (
              <button className="btn-dark" style={{ borderRadius: 9, padding: '8px 16px', fontSize: 12.5 }} onClick={() => handleMarkPaid(s)}>
                {t.markPaid}
              </button>
            )}
          </div>
        ))}
      </div>

      {/* transactions ledger (Payment Service) */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '26px 0 12px', flexWrap: 'wrap', gap: 8 }}>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{t.payTransactions}</h3>
        <div style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 600 }}>
          {t.payRevenue}: <span className="display" style={{ fontSize: 18, color: 'var(--green)' }}>{fmt(revenue)}</span>
        </div>
      </div>
      <div className="card" style={{ overflow: 'hidden' }}>
        <div className="table-head-dark" style={{ display: 'grid', gridTemplateColumns: '1.7fr 1fr 1.1fr 1fr 1.1fr', gap: 10, padding: '12px 20px' }}>
          <div>{t.thName}</div><div>{t.payType}</div><div>{t.payInvoice}</div><div>{t.payAmountCol}</div><div>{t.thStatus}</div>
        </div>
        {payments.length === 0 ? (
          <div style={{ padding: 20, textAlign: 'center', color: 'var(--faint)', fontSize: 13 }}>{t.payNone}</div>
        ) : payments.map((p) => (
          <div key={p.id} className="row-line" style={{ display: 'grid', gridTemplateColumns: '1.7fr 1fr 1.1fr 1fr 1.1fr', gap: 10, padding: '12px 20px', alignItems: 'center', fontSize: 13.5 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 600 }}>{p.studentName}</div>
              <div className="mono" style={{ fontSize: 11, color: 'var(--faint)' }}>{p.trxId} · {p.createdAt}</div>
            </div>
            <div style={{ color: 'var(--muted)' }}>{typeLabel(p.type)}</div>
            <div className="mono" style={{ fontSize: 12, color: 'var(--muted)' }}>{p.invoiceNo}</div>
            <div className="display" style={{ fontWeight: 800 }}>{fmt(p.amount)}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              {p.status === 'success' ? (
                <>
                  <span className="chip chip-green">{t.payStatusSuccess}</span>
                  <button className="btn-ghost-sm" onClick={() => refund(p)}>{t.payRefundBtn}</button>
                </>
              ) : (
                <span className="chip chip-red">{t.payStatusRefunded}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
