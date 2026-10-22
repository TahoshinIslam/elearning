import Link from 'next/link';
import { notFound } from 'next/navigation';
import SiteNav from '@/components/SiteNav';
import SiteFooter from '@/components/site/SiteFooter';
import CourseCard from '@/components/ui/CourseCard';
import Icon from '@/components/Icon';
import { getPublicPaths, getOwnedCourseIds } from '@/lib/catalogRepo';
import { currentSession } from '@/lib/auth';
import { getCopy } from '@/lib/lang';
import { num, taka, duration } from '@/lib/copy';
import { categoryLabel } from '@/lib/categoryLabel';
import { abs } from '@/lib/seo';

export const dynamic = 'force-dynamic';

async function findPath(slug) { return (await getPublicPaths()).find((p) => p.slug === slug) || null; }

export async function generateMetadata({ params }) {
  const path = await findPath(params.slug);
  if (!path) return { robots: { index: false } };
  return { title: path.title, description: path.description.slice(0, 180), alternates: { canonical: abs(`/paths/${path.slug}`) } };
}

export default async function PathPage({ params }) {
  const { lang, c } = getCopy();
  const path = await findPath(params.slug);
  if (!path) notFound();
  const owned = await getOwnedCourseIds(currentSession());
  const first = path.courses[0];
  return (
    <>
      <SiteNav />
      <main id="main">
        <section className="paths-hero">
          <div className="container-wide">
            <nav aria-label="Breadcrumb"><Link href="/paths" className="link small">← {c.allPaths}</Link></nav>
            <h1 className="h1" style={{ marginTop: 10 }}>{path.title}</h1>
            {path.description && <p className="lead" style={{ maxWidth: 760 }}>{path.description}</p>}
            <p className="small muted" style={{ maxWidth: 760 }}>{c.pathsWhat}</p>
            <div className="path-card-meta" style={{ marginTop: 12 }}>
              <span><Icon name="compass" size={15} />{c.pathSteps(path.courses.length)}</span>
              {path.lessonCount > 0 && <span><Icon name="list" size={15} />{c.lessonsN(path.lessonCount)}</span>}
              {path.durationSeconds > 0 && <span><Icon name="clock" size={15} />{duration(lang, path.durationSeconds)}</span>}
              {path.courses.length > 0 && <span><Icon name="receipt" size={15} />{c.pathTotal}: {path.price ? taka(lang, path.price) : c.free}</span>}
            </div>
            {first && <div style={{ marginTop: 18 }}><Link href={`/course/${first.slug}`} className="btn btn-primary btn-lg">{c.pathStart}<Icon name="arrowRight" size={18} /></Link></div>}
          </div>
        </section>
        <section className="home-section">
          <div className="container-wide">
            {path.courses.length ? (
              <ol className="path-timeline">
                {path.courses.map((course, i) => (
                  <li key={course.id}>
                    <span className="path-timeline-n" aria-hidden="true">{num(lang, i + 1)}</span>
                    <div className="path-timeline-body">
                      <p className="eyebrow">{c.pathStep(i + 1)}</p>
                      <ul className="course-grid" data-n="1"><li><CourseCard course={course} lang={lang} owned={owned.has(course.id)} categoryLabel={categoryLabel(lang, course.category, course.categoryName)} /></li></ul>
                    </div>
                  </li>
                ))}
              </ol>
            ) : <div className="surface state"><p>{c.pathEmptySteps}</p></div>}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
