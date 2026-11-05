import Link from 'next/link';
import { redirect } from 'next/navigation';
import SiteNav from '@/components/SiteNav';
import Icon from '@/components/Icon';
import ResultActions from '@/components/checkout/ResultActions';
import { currentSession } from '@/lib/auth';
import { getOrderForViewer } from '@/lib/orderRepo';
import { getCopy } from '@/lib/lang';
import { taka, dateLabel } from '@/lib/copy';

export const metadata = { title: 'Payment status', robots: { index: false } };

const LOOK = {
  paid: { icon: 'checkCircle', bg: 'var(--success-tint)', fg: 'var(--success)' },
  pending: { icon: 'clock', bg: 'var(--warning-tint)', fg: 'var(--warning)' },
  failed: { icon: 'alert', bg: 'var(--danger-tint)', fg: 'var(--danger)' },
  cancelled: { icon: 'x', bg: 'var(--surface-2)', fg: 'var(--muted)' },
  refunded: { icon: 'receipt', bg: 'var(--surface-2)', fg: 'var(--muted)' },
  error: { icon: 'alert', bg: 'var(--danger-tint)', fg: 'var(--danger)' }
};

// The status shown here is read from the server for the signed-in buyer's
// own order — never from the URL. Nothing on this page grants access.
export default async function CheckoutResultPage({ searchParams }) {
  const { lang, c } = getCopy();
  const session = await currentSession();
  const orderId = parseInt(searchParams?.order, 10);
  if (!session) redirect(`/login?returnTo=${encodeURIComponent(`/checkout/result${orderId ? `?order=${orderId}` : ''}`)}`);

  let order = null;
  if (orderId) {
    try { order = await getOrderForViewer(session, orderId); } catch { order = null; }
  }
  const status = order ? order.status : 'error';
  const look = LOOK[status] || LOOK.error;

  return (
    <>
      <SiteNav />
      <main id="main" className="container section" style={{ maxWidth: 640 }}>
        <div className="surface surface-pad stack" style={{ '--gap': '18px', textAlign: 'center', padding: '36px 24px' }}>
          <span className="status-mark" style={{ background: look.bg, color: look.fg }} aria-hidden="true"><Icon name={look.icon} size={30} /></span>
          <div className="stack" style={{ '--gap': '8px' }}>
            <h1 className="h2" role="status">{c[`res_${status}_t`]}</h1>
            <p className="muted">{c[`res_${status}_d`]}</p>
          </div>
          {order && (
            <dl className="kv" style={{ textAlign: 'left', borderTop: '1px solid var(--border)', paddingTop: 16 }}>
              <div><dt>{c.orderNo}</dt><dd className="tabular">#{order.id}</dd></div>
              {order.items.map((it) => <div key={it.courseId}><dt>{it.title}</dt><dd className="tabular">{it.unitPrice ? taka(lang, it.unitPrice) : c.free}</dd></div>)}
              {order.discount > 0 && <div><dt>{c.discount}</dt><dd className="tabular">−{taka(lang, order.discount)}</dd></div>}
              <div><dt>{c.total}</dt><dd className="tabular">{order.amount ? taka(lang, order.amount) : c.free}</dd></div>
              {order.paidAt && <div><dt>{c.paidAt}</dt><dd>{dateLabel(lang, order.paidAt)}</dd></div>}
              {order.gatewayTrxId && <div><dt>{c.trx}</dt><dd className="mono">{order.gatewayTrxId}</dd></div>}
            </dl>
          )}
          <ResultActions lang={lang} order={order ? { id: order.id, status: order.status, gateway: order.gateway, items: order.items } : null} />
        </div>
        <p className="small muted" style={{ textAlign: 'center', marginTop: 16 }}><Link href="/student?view=orders" className="link">{c.viewOrders}</Link></p>
      </main>
    </>
  );
}
