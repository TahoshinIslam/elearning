import { NextResponse } from 'next/server';
import { errResponse } from '@/lib/repo';
import { getReport, toCSV } from '@/lib/reportRepo';
import { requireRole } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/reports/export?type=sales  → downloadable CSV
export async function GET(request) {
  try {
    requireRole('owner', 'superadmin');
    const type = request.nextUrl.searchParams.get('type') || 'sales';
    const report = await getReport(type);
    const csv = toCSV(report);
    const date = new Date().toISOString().slice(0, 10);
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="leo-${type}-${date}.csv"`
      }
    });
  } catch (e) { return errResponse(e); }
}
