import { notFound } from 'next/navigation';
import { simulatorEnabled } from '@/lib/bkash';
import { simGetPayment } from '@/lib/bkashSimulator';
import SimulatorActions from './SimulatorActions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'bKash simulator (development)', robots: { index: false } };

// DEVELOPMENT ONLY hosted payment page for the local bKash simulator.
export default function SimulatorPage({ searchParams }) {
  if (!simulatorEnabled()) notFound();
  const payment = simGetPayment(String(searchParams.paymentID || ''));
  return (
    <main className="container" style={{ maxWidth: 460, padding: '48px 16px' }}>
      <div className="notice notice-warn" role="note" style={{ marginBottom: 20 }}>
        <div><strong>Development simulator.</strong> No money moves. This page stands in for bKash&rsquo;s hosted checkout and only
        exists when <code>BKASH_SIMULATOR=true</code> outside production.</div>
      </div>
      {!payment ? (
        <div className="surface" style={{ padding: 24 }}>Unknown or expired payment.</div>
      ) : (
        <div className="surface" style={{ padding: 24 }}>
          <div className="eyebrow">bKash (simulated)</div>
          <h1 className="h3" style={{ margin: '6px 0 14px' }}>Authorize payment</h1>
          <dl className="kv">
            <div><dt>Amount</dt><dd>৳{payment.amount} {payment.currency}</dd></div>
            <div><dt>Invoice</dt><dd>{payment.merchantInvoiceNumber}</dd></div>
            <div><dt>Payment ID</dt><dd className="mono">{payment.paymentID}</dd></div>
            <div><dt>Status</dt><dd>{payment.transactionStatus}</dd></div>
          </dl>
          <SimulatorActions paymentID={payment.paymentID} disabled={payment.transactionStatus !== 'Initiated'} />
        </div>
      )}
    </main>
  );
}
