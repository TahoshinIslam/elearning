import SiteNav from '@/components/SiteNav';
import { ResetForm } from '@/components/auth/AuthForms';

export const metadata = { title: 'Choose a new password', robots: { index: false } };
export default function ResetPage({ searchParams }) {
  const token = typeof searchParams?.token === 'string' ? searchParams.token.slice(0, 128) : '';
  return (<><SiteNav /><ResetForm token={token} /></>);
}
