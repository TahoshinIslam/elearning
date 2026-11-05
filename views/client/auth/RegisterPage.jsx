import { redirect } from 'next/navigation';
import SiteNav from '@/components/SiteNav';
import { RegisterForm } from '@/components/auth/AuthForms';
import { currentSession } from '@/lib/auth';
import { safeReturnTo } from '@/lib/safeRedirect';

export const metadata = { title: 'Sign up', robots: { index: false } };

export default async function RegisterPage({ searchParams }) {
  const returnTo = safeReturnTo(searchParams?.returnTo, '');
  if (await currentSession()) redirect(returnTo || '/student');
  const ref = typeof searchParams?.ref === 'string' ? searchParams.ref.slice(0, 32) : '';
  return (<><SiteNav /><RegisterForm returnTo={returnTo} referral={ref} /></>);
}
