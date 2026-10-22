import Link from 'next/link';
import CourseCard from '@/components/ui/CourseCard';
import Icon from '@/components/Icon';
import { copy } from '@/lib/copy';

export default function WishlistView({ lang, courses }) {
  const c = copy(lang);
  return (
    <div className="stack" style={{ '--gap': '20px' }}>
      <div className="page-head" style={{ marginBottom: 0 }}><div><h1>{c.wishlist}</h1></div></div>
      {courses.length ? (
        <div className="grid-cards">{courses.map((course) => <CourseCard key={course.id} course={course} lang={lang} />)}</div>
      ) : (
        <div className="surface state"><div className="state-icon"><Icon name="heart" size={24} /></div><p>{lang === 'en' ? 'Courses you save will appear here.' : 'পছন্দের কোর্স এখানে দেখা যাবে।'}</p><Link href="/courses" className="btn btn-secondary">{c.browseCourses}</Link></div>
      )}
    </div>
  );
}
