import { NextResponse } from 'next/server';
import { requireStaffSection } from '@/lib/auth';
import { errResponse } from '@/lib/repo';
import { getTrafficReport } from '@/lib/trackingRepo';

export const dynamic = 'force-dynamic';

// GET /api/admin/traffic?days= — visitors, sources, ad campaigns, popups (analytics:view)
export async function GET(request) {
  try {
    await requireStaffSection('analytics', 'view');
    return NextResponse.json(await getTrafficReport({ days: Number(request.nextUrl.searchParams.get('days')) || 30 }));
  } catch (e) { return errResponse(e); }
}
