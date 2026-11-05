import Link from 'next/link';
import { redirect } from 'next/navigation';
import SiteNav from '@/components/SiteNav';
import Icon from '@/components/Icon';
import CheckoutForm from '@/components/checkout/CheckoutForm';
import { currentSession } from '@/lib/auth';
import { getCopy } from '@/lib/lang';
import { q } from '@/lib/mysql';
import { publicThumbnailUrl } from '@/lib/storage';
import { bkashConfigured } from '@/lib/bkash';
import { priceCourses } from '@/lib/orderRepo';

export const metadata = { title: 'Checkout', robots: { index: false } };

// Direct-purchase checkout (also used by the cart). Prices shown here are
// read from the database; the final amount is computed again by POST
// /api/orders. Guests are sent to log in and brought straight back.
export default async function CheckoutPage(props) {
  const searchParams = await props.searchParams;
  const { lang, c } = await getCopy();
  const raw = String(searchParams?.courses || searchParams?.course || '');
  const ids = [...new Set(raw.split(',').map((x) => parseInt(x, 10)).filter((n) => Number.isInteger(n) && n > 0))].slice(0, 20);
  const session = await currentSession();
  if (!session) redirect(`/login?returnTo=${encodeURIComponent(`/checkout?courses=${ids.join(',')}`)}`);

  const rows = ids.length
    ? await q(`SELECT id, slug, title, price, published, instructor, category, thumbnail_key FROM courses WHERE id IN (${ids.map(() => '?').join(',')})`, ids)
    : [];
  const owned = session.studentId && ids.length
    ? new Set((await q(`SELECT course_id FROM enrollments WHERE student_id = ? AND status = 'active' AND course_id IN (${ids.map(() => '?').join(',')})`, [session.studentId, ...ids])).map((r) => r.course_id))
    : new Set();
  const items = ids.map((id) => rows.find((r) => r.id === id)).filter(Boolean).map((r) => ({
    id: r.id, slug: r.slug, title: r.title, price: Number(r.price), instructor: r.instructor, category: r.category,
    thumbnailUrl: publicThumbnailUrl(r.thumbnail_key),
    issue: !r.published ? 'unavailable' : owned.has(r.id) ? 'owned' : null
  }));
  // Same server quote that order creation uses — offers included — so the
  // price shown here is the price charged.
  let payable = items.filter((i) => !i.issue);
  let initialQuote = null;
  if (payable.length && session.studentId) {
    initialQuote = await priceCourses(session, payable.map((i) => i.id)).catch(() => null);
    if (initialQuote) {
      payable = payable.map((i) => {
        const line = initialQuote.items.find((x) => x.courseId === i.id);
        return line ? { ...i, price: line.unitPrice, listPrice: line.listPrice, offer: line.offer } : i;
      });
    }
  }
  const shown = items.map((i) => payable.find((p) => p.id === i.id) || i);

  return (
    <>
      <SiteNav />
      <main id="main" className="container section-tight" style={{ maxWidth: 1080 }}>
        <h1 className="h1" style={{ margin: '12px 0 24px' }}>{c.checkoutTitle}</h1>
        {session.role !== 'student' || !session.studentId ? (
          <div className="surface state"><div className="state-icon"><Icon name="user" size={24} /></div><p>{c.notStudentNote}</p><Link href="/courses" className="btn btn-secondary">{c.browseCourses}</Link></div>
        ) : !items.length ? (
          <div className="surface state"><div className="state-icon"><Icon name="cart" size={24} /></div><p>{c.emptyCheckout}</p><Link href="/courses" className="btn btn-primary">{c.browseCourses}</Link></div>
        ) : (
          <CheckoutForm lang={lang} items={shown} payable={payable} initialQuote={initialQuote} paymentsAvailable={bkashConfigured()} />
        )}
      </main>
    </>
  );
}
