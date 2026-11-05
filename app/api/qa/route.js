import { NextResponse } from 'next/server';
import { errResponse, HttpError } from '@/lib/repo';
import { getThread, askQuestion } from '@/lib/qaRepo';
import { requireUser, currentSession } from '@/lib/auth';
import { assertLessonAccess } from '@/lib/access';

export const dynamic = 'force-dynamic';

// GET /api/qa?lessonId=  → the lesson's Q&A thread (public read)
export async function GET(request) {
  try {
    const lessonId = Number(request.nextUrl.searchParams.get('lessonId'));
    if (!lessonId) throw new HttpError(400, { error: 'lessonId_required' });
    // Same rule as the lesson content: preview lessons are public, the rest
    // need enrollment (or course-manager access).
    await assertLessonAccess(await currentSession(), lessonId);
    return NextResponse.json(await getThread(lessonId));
  } catch (e) { return errResponse(e); }
}

// POST /api/qa  { lessonId, body }  → ask a question (any signed-in user)
export async function POST(request) {
  try {
    const session = await requireUser();
    const body = await request.json();
    await assertLessonAccess(session, body.lessonId);
    return NextResponse.json(await askQuestion(session, body), { status: 201 });
  } catch (e) { return errResponse(e); }
}
