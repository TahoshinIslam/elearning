import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { errResponse } from '@/lib/repo';
import { getAuditLog } from '@/lib/auditLog';

export const dynamic = 'force-dynamic';

// Platform-wide security/audit trail — superadmin only.
export async function GET(request) {
  try {
    requireRole('superadmin');
    const action = request.nextUrl.searchParams.get('action') || undefined;
    return NextResponse.json(await getAuditLog({ action }));
  } catch (e) { return errResponse(e); }
}
