import { NextResponse } from 'next/server';
import { requireRole, requireUser, scopeToCaller } from '@/lib/auth';
import { getApplications, applyJob, setApplicationStatus, errResponse, HttpError } from '@/lib/repo';

export const dynamic = 'force-dynamic';

// Own applications for a student; staff see all.
export async function GET(request) {
  try { const { sp } = await scopeToCaller(request.nextUrl.searchParams); return NextResponse.json(await getApplications(sp)); } catch (e) { return errResponse(e); }
}
// Applies as the signed-in student only (never a body-supplied studentId).
export async function POST(request) {
  try {
    const session = await requireUser();
    if (!session.studentId) throw new HttpError(403, { error: 'not_a_student' });
    const body = await request.json();
    const list = await applyJob({ jobId: body.jobId, studentId: session.studentId, studentName: session.name });
    return NextResponse.json(list.filter((a) => a.studentId === session.studentId), { status: 201 });
  } catch (e) { return errResponse(e); }
}
export async function PATCH(request) {
  try { await requireRole('owner','superadmin'); return NextResponse.json(await setApplicationStatus(await request.json())); } catch (e) { return errResponse(e); }
}
