import { NextResponse } from 'next/server';
import { requireUser, requireStaffSection } from '@/lib/auth';
import { getSubmissions, submitAssignment, gradeSubmission, errResponse } from '@/lib/repo';
import { notifyStudent } from '@/lib/notifRepo';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try { return NextResponse.json(await getSubmissions(request.nextUrl.searchParams)); } catch (e) { return errResponse(e); }
}
export async function POST(request) {
  try { requireUser(); return NextResponse.json(await submitAssignment(await request.json()), { status: 201 }); } catch (e) { return errResponse(e); }
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
