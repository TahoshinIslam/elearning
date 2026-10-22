import { NextResponse } from 'next/server';
import { requireUser, requireStaffSection, scopeToCaller } from '@/lib/auth';
import { HttpError } from '@/lib/repo';
import { assertLessonAccess } from '@/lib/access';
import { markLessonDone } from '@/lib/videoRepo';
import { getSubmissions, submitAssignment, gradeSubmission, errResponse } from '@/lib/repo';
import { notifyStudent } from '@/lib/notifRepo';

export const dynamic = 'force-dynamic';

// Own submissions for a student; staff need the 'submissions' section.
export async function GET(request) {
  try { const { sp } = scopeToCaller(request.nextUrl.searchParams, 'submissions'); return NextResponse.json(await getSubmissions(sp)); } catch (e) { return errResponse(e); }
}
// A student submits only as themselves, only for an assignment lesson of a
// course they're actively enrolled in.
export async function POST(request) {
  try {
    const session = requireUser();
    if (!session.studentId) throw new HttpError(403, { error: 'not_a_student' });
    const body = await request.json();
    const { ctx } = await assertLessonAccess(session, body.lessonId);
    if (ctx.type !== 'assignment') throw new HttpError(400, { error: 'not_an_assignment' });
    const list = await submitAssignment({ ...body, lessonId: ctx.id, courseId: ctx.course_id, studentId: session.studentId, studentName: session.name });
    await markLessonDone(session.studentId, ctx.id, 'assignment');
    return NextResponse.json(list.filter((s) => s.studentId === session.studentId), { status: 201 });
  } catch (e) { return errResponse(e); }
}
export async function PATCH(request) {
  try {
    requireStaffSection('submissions');
    const body = await request.json();
    const list = await gradeSubmission(body);
    // notify the graded student (best-effort; ignore if they have no user account)
    const graded = list.find((s) => s.id === body.id);
    if (graded) {
      await notifyStudent(graded.studentId, {
        title: 'অ্যাসাইনমেন্ট গ্রেড হয়েছে',
        body: `আপনি পেয়েছেন ${graded.marks ?? 0}/${graded.maxMarks ?? 20}`,
        kind: 'grade'
      });
    }
    return NextResponse.json(list);
  } catch (e) { return errResponse(e); }
}
