import { NextResponse } from 'next/server';
import { errResponse } from '@/lib/repo';
import { getReport } from '@/lib/reportRepo';
import { requireStaffSection } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/reports?type=sales|students|attendance  → { columns, rows, summary }
export async function GET(request) {
  try {
    await requireStaffSection('reports', 'view');
    const type = request.nextUrl.searchParams.get('type') || 'sales';
    return NextResponse.json(await getReport(type));
  } catch (e) { return errResponse(e); }
}
