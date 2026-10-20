import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { errResponse } from '@/lib/repo';
import { getAdminOverview } from '@/lib/adminOverview';

export const dynamic = 'force-dynamic';

export async function GET() {
  try { requireRole('owner', 'superadmin'); return NextResponse.json(await getAdminOverview()); } catch (e) { return errResponse(e); }
}
