import { NextResponse } from 'next/server';
import { requireStaffSection } from '@/lib/auth';
import { errResponse } from '@/lib/repo';
import { getAnalytics, analyticsCsv } from '@/lib/analyticsRepo';

export const dynamic = 'force-dynamic';

// GET /api/admin/analytics?days=7|30|90|365[&format=csv] — analytics:view
export async function GET(request) {
  try {
    await requireStaffSection('analytics', 'view');
    const sp = request.nextUrl.searchParams;
    const data = await getAnalytics({ days: Number(sp.get('days')) || 30 });
    if (sp.get('format') === 'csv') {
      return new NextResponse(analyticsCsv(data), {
        headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="analytics-${data.days}d.csv"` }
      });
    }
    return NextResponse.json(data);
  } catch (e) { return errResponse(e); }
}
