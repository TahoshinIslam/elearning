'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { ROLE_HOME } from '@/lib/rbac';

// Wraps a dashboard page and enforces that the signed-in user holds one of the
// allowed roles. Redirects to /login (with a returnTo) when unauthenticated, or
// to the user's own home when they're logged in but lack access.
export default function RoleGuard({ allow, children }) {
  const { auth, authReady, t } = useApp();
  const router = useRouter();
  const pathname = usePathname();
  const roles = Array.isArray(allow) ? allow : [allow];
  const ok = auth && roles.includes(auth.role);

  useEffect(() => {
    if (!authReady) return;
    if (!auth) {
      router.replace(`/login?returnTo=${encodeURIComponent(pathname)}`);
    } else if (!roles.includes(auth.role)) {
      router.replace(ROLE_HOME[auth.role] || '/');
    }
  }, [authReady, auth, roles, router, pathname]);

  // Until we know the session (or while redirecting) show a light placeholder,
  // so protected content never flashes for the wrong user.
  if (!authReady || !ok) {
    return (
      <div style={{ minHeight: 'calc(100vh - 51px)', display: 'grid', placeItems: 'center', color: 'var(--muted)' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spin" style={{
            width: 26, height: 26, margin: '0 auto 12px', borderRadius: '50%',
            border: '3px solid var(--line)', borderTopColor: 'var(--brand)'
          }} />
          {(t && t.checkingAccess) || 'অ্যাক্সেস যাচাই করা হচ্ছে…'}
        </div>
      </div>
    );
  }
  return children;
}
