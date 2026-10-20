import Link from 'next/link';
import SiteNav from '@/components/SiteNav';
import Icon from '@/components/Icon';
import { getCopy } from '@/lib/lang';

// Honest "unavailable" state for unknown, withdrawn or unpublished courses.
export default function CourseNotFound() {
  const { c } = getCopy();
  return (
    <>
      <SiteNav />
      <main id="main" className="container section">
        <div className="surface state">
          <div className="state-icon"><Icon name="book" size={24} /></div>
          <h1 className="h3">{c.unavailableT}</h1>
          <p>{c.unavailableD}</p>
          <Link href="/courses" className="btn btn-primary">{c.browseCourses}</Link>
        </div>
      </main>
    </>
  );
}
