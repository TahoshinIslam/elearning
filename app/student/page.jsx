import { redirect } from 'next/navigation';
import SiteNav from '@/components/SiteNav';
import StudentShell from '@/components/student/views/StudentShell';
import MyLearning from '@/components/student/views/MyLearning';
import OrdersView from '@/components/student/views/OrdersView';
import CertificatesView from '@/components/student/views/CertificatesView';
import WishlistView from '@/components/student/views/WishlistView';
import AccountView from '@/components/student/views/AccountView';
import LiveClassesView from '@/components/student/views/LiveClassesView';
import CareerTab from '@/components/student/CareerTab';
import ReferralTab from '@/components/student/ReferralTab';
import { currentSession } from '@/lib/auth';
import { ROLE_HOME } from '@/lib/rbac';
import { getMyLearning } from '@/lib/learningRepo';
import { getOrdersForStudent } from '@/lib/orderRepo';
import { getWishlist } from '@/lib/wishlistRepo';
import { listPublishedCourses } from '@/lib/catalogRepo';
import { getCertificates } from '@/lib/repo';
import { getLang } from '@/lib/lang';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'My learning', robots: { index: false } };

const VIEWS = ['learning', 'orders', 'certificates', 'wishlist', 'live', 'career', 'referral', 'account'];

// "My Learning" and the student account area. Every number shown is read
// from the database for the signed-in student only.
export default async function StudentPage({ searchParams }) {
  const session = currentSession();
  if (!session) redirect('/login?returnTo=/student');
  if (session.role !== 'student' || !session.studentId) redirect(ROLE_HOME[session.role] || '/');
  const lang = getLang();
  const view = VIEWS.includes(searchParams?.view) ? searchParams.view : 'learning';

  let body = null;
  if (view === 'learning') body = <MyLearning lang={lang} courses={await getMyLearning(session)} />;
  else if (view === 'orders') body = <OrdersView lang={lang} orders={await getOrdersForStudent(session)} />;
  else if (view === 'certificates') {
    const [courses, certs] = await Promise.all([getMyLearning(session), getCertificates(new URLSearchParams({ studentId: String(session.studentId) }))]);
    body = <CertificatesView lang={lang} courses={courses} certificates={certs} />;
  } else if (view === 'wishlist') {
    const ids = await getWishlist(session.studentId);
    const all = ids.length ? (await listPublishedCourses({ sort: 'relevance', page: 1 }, { pageSize: 200 })).items : [];
    body = <WishlistView lang={lang} courses={ids.map((id) => all.find((c) => c.id === id)).filter(Boolean)} />;
  } else if (view === 'live') body = <LiveClassesView lang={lang} />;
  else if (view === 'career') body = <CareerTab />;
  else if (view === 'referral') body = <ReferralTab />;
  else body = <AccountView lang={lang} user={{ name: session.name, email: session.email }} />;

  return (
    <>
      <SiteNav />
      <StudentShell lang={lang} view={view} name={session.name}>{body}</StudentShell>
    </>
  );
}
