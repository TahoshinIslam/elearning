import { redirect } from 'next/navigation';
import { currentSession } from '@/lib/auth';
import { ROLE_HOME } from '@/lib/rbac';

export const metadata = { robots: { index: false, follow: false } };

// Platform console: superadmin only, checked on the server.
export default async function SuperadminLayout({ children }) {
  const session = await currentSession();
  if (!session) redirect('/login?returnTo=/superadmin');
  if (session.role !== 'superadmin') redirect(ROLE_HOME[session.role] || '/');
  return children;
}
