import { redirect } from 'next/navigation';
import { currentSession } from '@/lib/auth';
import { ROLE_HOME } from '@/lib/rbac';

export const metadata = { robots: { index: false, follow: false } };

// Admin console gate (/owner): runs on the server before any admin code is sent. Only
// staff (teacher / owner / superadmin) get past; everyone else is sent to log
// in or to their own home. The API routes enforce the same rules again.
const STAFF = ['teacher', 'owner', 'superadmin'];

export default async function AdminLayout({ children }) {
  const session = await currentSession();
  if (!session) redirect('/login?returnTo=/owner');
  if (!STAFF.includes(session.role)) redirect(ROLE_HOME[session.role] || '/');
  return children;
}
