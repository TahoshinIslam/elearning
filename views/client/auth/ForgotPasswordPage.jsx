import SiteNav from '@/components/SiteNav';
import { ForgotForm } from '@/components/auth/AuthForms';

export const metadata = { title: 'Reset password', robots: { index: false } };
export default function ForgotPage() { return (<><SiteNav /><ForgotForm /></>); }
