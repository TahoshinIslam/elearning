import Link from 'next/link';
import { notFound } from 'next/navigation';
import SiteNav from '@/components/SiteNav';
import SiteFooter from '@/components/site/SiteFooter';
import CourseCard from '@/components/ui/CourseCard';
import Icon from '@/components/Icon';
import { getPublicCampaign } from '@/lib/campaignRepo';
import { listPublishedCourses, getOwnedCourseIds } from '@/lib/catalogRepo';
import { currentSession } from '@/lib/auth';
import { getCopy } from '@/lib/lang';
import { num, dateLabel } from '@/lib/copy';
import { categoryLabel } from '@/lib/categoryLabel';
import { abs } from '@/lib/seo';


export async function generateMetadata({ params }) {
  const camp = await getPublicCampaign(params.slug);
  if (!camp) return { robots: { index: false } };
  return { title: camp.title, description: (camp.body || '').slice(0, 180), alternates: { canonical: abs(`/campaign/${camp.slug}`) } };
}

// Courses an offer applies to, priced by the same rule checkout uses.
async function offerCourses(offer) {
  if (!offer) return [];
  const base = { sort: 'popular', page: 1 };
  if (offer.scope === 'subject') return (await listPublishedCourses({ ...base, category: offer.scopeValue }, { pageSize: 24 })).items;
  if (offer.scope === 'class') return (await listPublishedCourses({ ...base, class: offer.scopeValue }, { pageSize: 24 })).items;
  const all = (await listPublishedCourses(base, { pageSize: 200 })).items;
  if (offer.scope === 'course') return all.filter((c) => String(c.id) === String(offer.scopeValue));
  return all.filter((c) => c.listPrice > 0).slice(0, 24);
}

export default async function CampaignPage({ params }) {
  const { lang, c } = getCopy();
  const camp = await getPublicCampaign(params.slug);
  if (!camp) notFound();
  const session = await currentSession();
  const [courses, owned] = await Promise.all([offerCourses(camp.offer), getOwnedCourseIds(session)]);
  const off = camp.offer ? (camp.offer.type === 'percent' ? `${num(lang, camp.offer.value)}%` : `৳${num(lang, camp.offer.value)}`) : null;

  return (
    <>
      <SiteNav />
      <main id="main">
        <section className="container promo-section">
          <div className="promo">
            <div className="promo-track">
              <div className="promo-slide is-active">
                <div className="promo-copy" style={{ paddingBottom: 40 }}>
                  {off && <span className="badge badge-brand promo-offer">{c.offerSave(off)}</span>}
                  <h1 className="promo-title">{camp.title}</h1>
                  {camp.body && <p className="promo-body">{camp.body}</p>}
                  {camp.offer?.endsAt && <p className="small promo-valid">{c.validUntil(dateLabel(lang, camp.offer.endsAt))}</p>}
                </div>
                <div className="promo-art">
                  {camp.imageUrl ? <img src={camp.imageUrl} alt={camp.imageAlt || ''} /> : <span className="promo-art-fallback" aria-hidden="true"><Icon name="gift" size={56} /></span>}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section" aria-labelledby="camp-courses">
          <div className="container">
            {camp.offerExpired && (
              <div className="notice notice-warn" role="status" style={{ marginBottom: 20 }}><Icon name="clock" size={18} /><div><strong>{c.offerExpiredT}</strong><br />{c.offerExpiredD}</div></div>
            )}
            {courses.length > 0 && (<>
              <div className="section-head"><h2 id="camp-courses" className="h2">{c.campaignCourses}</h2></div>
              <div className="grid-cards">
                {courses.map((course) => <CourseCard key={course.id} course={course} lang={lang} owned={owned.has(course.id)} categoryLabel={categoryLabel(lang, course.category, course.categoryName)} />)}
              </div>
            </>)}
            {!courses.length && <p><Link href="/courses" className="btn btn-primary">{c.heroBrowse}</Link></p>}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
