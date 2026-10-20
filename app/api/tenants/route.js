import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { getTenants, toggleTenant, errResponse } from '@/lib/repo';

export const dynamic = 'force-dynamic';

// Tenant list includes revenue figures — platform superadmin (and center owners) only.
export async function GET() {
  try { requireRole('owner', 'superadmin'); return NextResponse.json(await getTenants()); } catch (e) { return errResponse(e); }
}
export async function PATCH(request) {
  try { requireRole('superadmin'); return NextResponse.json(await toggleTenant(await request.json())); } catch (e) { return errResponse(e); }
}
