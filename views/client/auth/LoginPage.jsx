import { redirect } from 'next/navigation';
import SiteNav from '@/components/SiteNav';
import { LoginForm } from '@/components/auth/AuthForms';
import { currentSession } from '@/lib/auth';
import { safeReturnTo } from '@/lib/safeRedirect';

export const metadata = { title: 'Log in', robots: { index: false } };

export default async function LoginPage(props) {
  const searchParams = await props.searchParams;
  const returnTo = safeReturnTo(searchParams?.returnTo, '');
  if (await currentSession()) redirect(returnTo || '/student');
  // Demo quick-login is a development convenience only.
  return (<><SiteNav /><LoginForm returnTo={returnTo} showDemo={process.env.NODE_ENV !== 'production'} /></>);
}
