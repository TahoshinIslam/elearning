'use client';

import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import Icon from '@/components/Icon';
import { useAdminData } from '@/components/owner/useAdminData';
import { taka, num, dateLabel } from '@/lib/copy';
import { ActivityList } from '@/components/admin/ActivityTab';
import { canAccess } from '@/lib/rbac';

// Overview of real activity only (lib/adminOverview.js) — no seeded or
// estimated numbers.
export default function DashboardTab() {
  const { lang, auth } = useApp();
  const en = lang === 'en';
  const { data: d, loading, error, reload } = useAdminData('/api/admin/overview');
  const seeActivity = canAccess(auth, 'activity', 'view');
  const act = useAdminData(seeActivity ? '/api/admin/activity?limit=8&days=14' : '/api/auth/me');

  if (loading) return <div className="stat-tiles">{[0, 1, 2, 3].map((i) => <div key={i} className="surface stat-tile"><div className="skeleton" style={{ height: 30, width: '50%' }} /><div className="skeleton" style={{ height: 12, width: '70%', marginTop: 10 }} /></div>)}</div>;
  if (error || !d) return <div className="state surface" role="alert"><p>{en ? 'Couldn’t load the overview.' : 'ওভারভিউ লোড করা যায়নি।'}</p><button type="button" className="btn btn-secondary btn-sm" onClick={reload}><Icon name="refresh" size={14} />{en ? 'Try again' : 'আবার চেষ্টা করুন'}</button></div>;

  const section = (key) => `/owner?section=${key}`;
  const attention = [
    d.sales.pending > 0 && { href: section('payments'), tone: 'badge-warning', n: d.sales.pending, label: en ? 'bKash orders awaiting confirmation' : 'নিশ্চিতকরণের অপেক্ষায় bKash অর্ডার' },
    d.sales.duplicates > 0 && { href: section('payments'), tone: 'badge-danger', n: d.sales.duplicates, label: en ? 'Duplicate payments to refund' : 'ফেরতযোগ্য ডুপ্লিকেট পেমেন্ট' },
    d.pendingReviews > 0 && { href: section('reviews'), tone: 'badge-info', n: d.pendingReviews, label: en ? 'Reviews awaiting approval' : 'অনুমোদনের অপেক্ষায় রিভিউ' },
    d.courses.inReview > 0 && { href: section('courses'), tone: 'badge-info', n: d.courses.inReview, label: en ? 'Courses submitted for review' : 'রিভিউয়ের জন্য জমা দেওয়া কোর্স' }
  ].filter(Boolean);

  return (
    <div className="stack" style={{ '--gap': '24px' }}>
      <div className="stat-tiles">
        <div className="surface stat-tile"><div className="v">{taka(lang, d.sales.revenue30)}</div><div className="l">{en ? 'Revenue, last 30 days' : 'গত ৩০ দিনের আয়'}</div><div className="xsmall muted">{num(lang, d.sales.paid30)} {en ? 'paid orders' : 'পরিশোধিত অর্ডার'}</div></div>
        <div className="surface stat-tile"><div className="v">{num(lang, d.students.total)}</div><div className="l">{en ? 'Students' : 'শিক্ষার্থী'}</div><div className="xsmall muted">+{num(lang, d.students.new30)} {en ? 'in 30 days' : '৩০ দিনে'}</div></div>
        <div className="surface stat-tile"><div className="v">{num(lang, d.students.active7)}</div><div className="l">{en ? 'Active learners, 7 days' : '৭ দিনে সক্রিয় শিক্ষার্থী'}</div><div className="xsmall muted">{num(lang, d.lessonsCompleted7)} {en ? 'lessons completed' : 'পাঠ সম্পন্ন'}</div></div>
        <div className="surface stat-tile"><div className="v">{num(lang, d.courses.published)}</div><div className="l">{en ? 'Published courses' : 'প্রকাশিত কোর্স'}</div><div className="xsmall muted">{num(lang, d.courses.drafts)} {en ? 'drafts' : 'খসড়া'} · {num(lang, d.courses.upcoming)} {en ? 'upcoming' : 'আসন্ন'}</div></div>
      </div>

      <div className="ws-grid">
        <section className="surface" aria-labelledby="dash-recent">
          <div className="surface-head"><h2 id="dash-recent" className="h4">{en ? 'Recent paid orders' : 'সাম্প্রতিক পরিশোধিত অর্ডার'}</h2><Link href={section('payments')} className="btn btn-ghost btn-sm">{en ? 'All orders' : 'সব অর্ডার'}</Link></div>
          {!d.recentOrders.length ? <div className="state"><p>{en ? 'No paid orders yet.' : 'এখনও কোনো পরিশোধিত অর্ডার নেই।'}</p></div> : (
            <ul className="dash-list">
              {d.recentOrders.map((o) => (
                <li key={o.id}>
                  <div style={{ minWidth: 0 }}><div className="strong">{o.student || `#${o.id}`}</div><div className="xsmall muted clamp-1">{o.courses}</div></div>
                  <div style={{ textAlign: 'right' }}><div className="strong tabular">{taka(lang, o.amount)}</div><div className="xsmall muted nowrap">{dateLabel(lang, o.paidAt)}</div></div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="stack" style={{ '--gap': '24px' }}>
          <section className="surface" aria-labelledby="dash-attn">
            <div className="surface-head"><h2 id="dash-attn" className="h4">{en ? 'Needs attention' : 'মনোযোগ দরকার'}</h2></div>
            {!attention.length ? <div className="state"><Icon name="checkCircle" size={20} /><p>{en ? 'Nothing waiting.' : 'অপেক্ষমাণ কিছু নেই।'}</p></div> : (
              <ul className="dash-list">
                {attention.map((a) => <li key={a.label}><Link href={a.href} className="row grow" style={{ '--gap': '10px', color: 'inherit' }}><span className={`badge ${a.tone} tabular`}>{num(lang, a.n)}</span><span className="grow">{a.label}</span><Icon name="chevronRight" size={16} /></Link></li>)}
              </ul>
            )}
          </section>

          <section className="surface" aria-labelledby="dash-top">
            <div className="surface-head"><h2 id="dash-top" className="h4">{en ? 'Top courses, 30 days' : 'গত ৩০ দিনের শীর্ষ কোর্স'}</h2></div>
            {!d.topCourses.length ? <div className="state"><p>{en ? 'No sales in the last 30 days.' : 'গত ৩০ দিনে কোনো বিক্রি নেই।'}</p></div> : (
              <ol className="dash-list">
                {d.topCourses.map((c) => (
                  <li key={c.id}>
                    <div style={{ minWidth: 0 }}><div className="strong clamp-1">{c.title}</div><div className="xsmall muted">{num(lang, c.buyers)} {en ? 'buyers' : 'ক্রেতা'}</div></div>
                    <div className="strong tabular">{taka(lang, c.revenue)}</div>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>
      </div>
      {seeActivity && (
        <section className="surface" aria-labelledby="dash-act">
          <div className="surface-head"><h2 id="dash-act" className="h4">{en ? 'Recent activity' : 'সাম্প্রতিক কার্যক্রম'}</h2><a href="/owner?section=activity" className="btn btn-ghost btn-sm">{en ? 'See all' : 'সব দেখুন'}<Icon name="arrowRight" size={14} /></a></div>
          {act.loading && !act.data ? <div className="stack surface-pad">{[0, 1, 2].map((i) => <div key={i} className="skeleton" style={{ height: 40 }} />)}</div>
            : Array.isArray(act.data) ? <ActivityList items={act.data} lang={lang} compact /> : null}
        </section>
      )}
      <p className="xsmall muted">{en ? 'All-time paid revenue: ' : 'মোট পরিশোধিত আয়: '}<span className="tabular">{taka(lang, d.sales.revenue)}</span> · {num(lang, d.sales.paid)} {en ? 'paid orders' : 'পরিশোধিত অর্ডার'}</p>
    </div>
  );
}
