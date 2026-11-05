import Link from 'next/link';
import SiteNav from '@/components/SiteNav';
import SiteFooter from '@/components/site/SiteFooter';
import Icon from '@/components/Icon';
import { getCopy } from '@/lib/lang';

export const metadata = { title: 'Page not found', robots: { index: false } };

// Site-wide 404 (unknown URLs and notFound() calls without a closer boundary).
export default function NotFound() {
  const { lang } = getCopy();
  const en = lang === 'en';
  return (
    <>
      <SiteNav />
      <main id="main" className="container section">
        <div className="surface state">
          <div className="state-icon"><Icon name="compass" size={24} /></div>
          <p className="eyebrow"><span className="sticker sticker-pink">404</span></p>
          <h1 className="h2">{en ? 'This page doesn’t exist' : 'পেজটি খুঁজে পাওয়া যায়নি'}</h1>
          <p>{en ? 'The link may be old or mistyped.' : 'লিংকটি পুরোনো বা ভুল হতে পারে।'}</p>
          <div className="cluster" style={{ justifyContent: 'center' }}>
            <Link href="/" className="btn btn-secondary">{en ? 'Home' : 'হোম'}</Link>
            <Link href="/courses" className="btn btn-primary">{en ? 'Browse courses' : 'সব কোর্স দেখুন'}<Icon name="arrowRight" size={16} /></Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
