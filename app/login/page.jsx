import { redirect } from 'next/navigation';
import SiteNav from '@/components/SiteNav';
import { LoginForm } from '@/components/auth/AuthForms';
import { currentSession } from '@/lib/auth';
import { safeReturnTo } from '@/lib/safeRedirect';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Log in', robots: { index: false } };

export default function LoginPage({ searchParams }) {
  const returnTo = safeReturnTo(searchParams?.returnTo, '');
  if (currentSession()) redirect(returnTo || '/student');
  // Demo quick-login is a development convenience only.
  return (<><SiteNav /><LoginForm returnTo={returnTo} showDemo={process.env.NODE_ENV !== 'production'} /></>);
}
