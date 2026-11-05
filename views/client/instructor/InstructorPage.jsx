import { notFound } from 'next/navigation';
import SiteNav from '@/components/SiteNav';
import SiteFooter from '@/components/site/SiteFooter';
import CourseCard from '@/components/ui/CourseCard';
import { getPublicInstructor, getOwnedCourseIds } from '@/lib/catalogRepo';
import { currentSession } from '@/lib/auth';
import { getCopy } from '@/lib/lang';
import { categoryLabel } from '@/lib/categoryLabel';
import { abs } from '@/lib/seo';


export async function generateMetadata(props) {
  const params = await props.params;
  const t = await getPublicInstructor(params.id, { withCourses: false });
  if (!t) return { robots: { index: false } };
  return { title: t.name, description: (t.bio || t.title || '').slice(0, 160), alternates: { canonical: abs(`/instructor/${t.id}`) } };
}

// Public instructor profile: no contact details, no seed rating numbers —
// only published courses and real learner counts.
export default async function InstructorPage(props) {
  const params = await props.params;
  const { lang, c } = await getCopy();
  const t = await getPublicInstructor(params.id);
  if (!t) notFound();
  const owned = await getOwnedCourseIds(await currentSession());
  return (
    <>
      <SiteNav />
      <main id="main" className="container section-tight" style={{ paddingTop: 32 }}>
        <section className="surface surface-pad instructor-card" style={{ flexWrap: 'wrap' }}>
          <span className="instructor-avatar" style={{ width: 88, height: 88, fontSize: 34 }} aria-hidden="true">{t.name.charAt(0)}</span>
          <div className="stack grow" style={{ '--gap': '8px', minWidth: 240 }}>
            <span className="eyebrow">{c.instructor}</span>
            <h1 className="h1">{t.name}</h1>
            {t.title && <p className="lead">{t.title}</p>}
            <p className="small muted">{c.coursesN(t.courseCount)}{t.learnerCount > 0 ? ` · ${c.studentsN(t.learnerCount)}` : ''}</p>
            {t.expertise.length > 0 && <div className="cluster" style={{ '--gap': '6px' }}>{t.expertise.map((e) => <span key={e} className="badge">{e}</span>)}</div>}
            {t.bio && <p className="prose" style={{ marginTop: 6, maxWidth: 760 }}>{t.bio}</p>}
          </div>
        </section>
        <section className="section-tight" aria-labelledby="ic-h">
          <h2 id="ic-h" className="h2" style={{ marginBottom: 18 }}>{c.navCourses}</h2>
          {t.courses.length ? (
            <div className="grid-cards">{t.courses.map((course) => <CourseCard key={course.id} course={course} lang={lang} owned={owned.has(course.id)} categoryLabel={categoryLabel(lang, course.category, course.categoryName)} />)}</div>
          ) : <p className="muted">{c.noResultsT}</p>}
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
