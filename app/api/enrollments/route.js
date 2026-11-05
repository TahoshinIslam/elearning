import { NextResponse } from 'next/server';
import { currentSession, requireStaffSection } from '@/lib/auth';
import { getEnrollments, enroll, unenroll, errResponse } from '@/lib/repo';

export const dynamic = 'force-dynamic';

// A guest gets an empty list (never anyone's real data — this is what
// actually closes the original leak, not refusing the request outright: an
// error response here would make every guest-facing, enrollment-aware page
// unable to load at all). A student may only ever read their own
// enrollments; staff may read everyone's (used by the owner Enrollments tab).
export async function GET(request) {
  try {
    const session = await currentSession();
    if (!session) return NextResponse.json([]);
    const sp = new URLSearchParams(request.nextUrl.searchParams);
    if (session.role === 'student') sp.set('studentId', String(session.studentId ?? 0));
    return NextResponse.json(await getEnrollments(sp));
  } catch (e) { return errResponse(e); }
}

// Manual/batch enrollment is a staff action (owner Enrollments tab). Real
// marketplace enrollment now only ever happens as a side effect of a paid
// order — see POST /api/orders + lib/orderRepo.js. This used to accept
// await requireUser() (any signed-in role) with a client-supplied studentId and
// batchId and no payment check at all — a free-enrollment bypass.
export async function POST(request) {
  try { await requireStaffSection('enroll', 'manage'); return NextResponse.json(await enroll(await request.json()), { status: 201 }); }
  catch (e) { return errResponse(e); }
}
export async function DELETE(request) {
  try { await requireStaffSection('enroll', 'manage'); return NextResponse.json(await unenroll(await request.json())); }
  catch (e) { return errResponse(e); }
}
