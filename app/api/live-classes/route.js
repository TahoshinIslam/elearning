import { NextResponse } from 'next/server';
import { requireStaffSection, currentSession, isStaff } from '@/lib/auth';
import { q } from '@/lib/mysql';
import { getLiveClasses, scheduleClass, updateLiveClass, errResponse } from '@/lib/repo';

export const dynamic = 'force-dynamic';

// Staff see the full schedule. A student sees only classes for batches they're
// actively enrolled in, WITHOUT the meeting URL — that is released only by
// the access-checked /api/live-classes/[id]/join. Guests get nothing.
export async function GET(request) {
  try {
    const session = await currentSession();
    if (!session) return NextResponse.json([]);
    if (isStaff(session)) return NextResponse.json(await getLiveClasses(request.nextUrl.searchParams));
    if (!session.studentId) return NextResponse.json([]);
    const rows = await q("SELECT DISTINCT batch_id FROM enrollments WHERE student_id = ? AND status = 'active' AND batch_id IS NOT NULL", [session.studentId]);
    const batches = new Set(rows.map((r) => r.batch_id));
    const all = await getLiveClasses(request.nextUrl.searchParams);
    return NextResponse.json(all.filter((c) => batches.has(c.batchId)).map(({ zoomUrl, ...rest }) => ({ ...rest, hasMeetingLink: !!zoomUrl })));
  } catch (e) { return errResponse(e); }
}
export async function POST(request) {
  try { await requireStaffSection('classes', 'manage'); return NextResponse.json(await scheduleClass(await request.json()), { status: 201 }); } catch (e) { return errResponse(e); }
}
export async function PATCH(request) {
  try { await requireStaffSection('classes', 'manage'); return NextResponse.json(await updateLiveClass(await request.json())); } catch (e) { return errResponse(e); }
}
