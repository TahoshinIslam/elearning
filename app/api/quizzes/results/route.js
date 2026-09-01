import { NextResponse } from 'next/server';
import { errResponse, HttpError } from '@/lib/repo';
import { getQuizResults } from '@/lib/quizRepo';
import { requireStaffSection } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/quizzes/results?lessonId=  → every student's attempt (teacher/owner)
export async function GET(request) {
  try {
    requireStaffSection('quizzes');
    const lessonId = Number(request.nextUrl.searchParams.get('lessonId'));
    if (!lessonId) throw new HttpError(400, { error: 'lessonId_required' });
    return NextResponse.json(await getQuizResults(lessonId));
  } catch (e) { return errResponse(e); }
}
