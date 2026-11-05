import { NextResponse } from 'next/server';
import { errResponse, HttpError } from '@/lib/repo';
import { getQuizResults, getQuizItemStats, quizCourse } from '@/lib/quizRepo';
import { assertTeachesCourse } from '@/lib/access';
import { requireStaffSection } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/quizzes/results?lessonId=  → every student's attempt (teacher/owner)
export async function GET(request) {
  try {
    const session = await requireStaffSection('quizzes', 'view');
    const lessonId = Number(request.nextUrl.searchParams.get('lessonId'));
    if (!lessonId) throw new HttpError(400, { error: 'lessonId_required' });
    const course = await quizCourse(lessonId);
    if (!course) throw new HttpError(404, { error: 'quiz_not_found' });
    await assertTeachesCourse(session, course.id);
    if (request.nextUrl.searchParams.get('items') === '1') return NextResponse.json(await getQuizItemStats(lessonId));
    return NextResponse.json(await getQuizResults(lessonId));
  } catch (e) { return errResponse(e); }
}
