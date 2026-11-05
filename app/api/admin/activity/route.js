import { NextResponse } from 'next/server';
import { requireStaffSection } from '@/lib/auth';
import { errResponse } from '@/lib/repo';
import { getRecentActivity, ACTIVITY_TYPES } from '@/lib/activityRepo';

export const dynamic = 'force-dynamic';

// GET /api/admin/activity?types=order,signup&limit=50&days=30 — activity:view
export async function GET(request) {
  try {
    await requireStaffSection('activity', 'view');
    const sp = request.nextUrl.searchParams;
    const types = (sp.get('types') || '').split(',').filter((x) => ACTIVITY_TYPES.includes(x));
    return NextResponse.json(await getRecentActivity({ types, limit: sp.get('limit'), days: sp.get('days') }));
  } catch (e) { return errResponse(e); }
}
