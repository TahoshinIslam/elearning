import { NextResponse } from 'next/server';
import { joinLiveClass, errResponse, HttpError } from '@/lib/repo';
import { requireUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/live-classes/{id}/join  → server access check → { url } or error.
// The student is taken from the authenticated session, never a query param,
// so a student can't probe another student's enrollment.
export async function GET(request, props) {
  const params = await props.params;
  try {
    const session = await requireUser();
    const studentId = session.studentId;
    if (!studentId) throw new HttpError(403, { error: 'not_a_student' });
    const data = await joinLiveClass(Number(params.id), Number(studentId));
    return NextResponse.json(data);
  } catch (e) { return errResponse(e); }
}
