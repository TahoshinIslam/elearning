import { NextResponse } from 'next/server';
import { errResponse, HttpError } from '@/lib/repo';
import { submitAttempt } from '@/lib/quizRepo';
import { requireUser } from '@/lib/auth';
import { assertLessonAccess } from '@/lib/access';
import { markLessonDone } from '@/lib/videoRepo';

export const dynamic = 'force-dynamic';

// POST /api/quizzes/attempt  { lessonId, answers:{questionId:optionId} }
// The student is taken from the session — never trusted from the body.
export async function POST(request) {
  try {
    const session = requireUser();
    if (!session.studentId) throw new HttpError(403, { error: 'not_a_student' });
    const body = await request.json();
    const { ctx } = await assertLessonAccess(session, body.lessonId);
    if (ctx.type !== 'quiz') throw new HttpError(400, { error: 'not_a_quiz' });
    const result = await submitAttempt({
      lessonId: body.lessonId,
      answers: body.answers,
      studentId: session.studentId,
      studentName: session.name
    });
    await markLessonDone(session.studentId, ctx.id, 'quiz');
    return NextResponse.json(result, { status: 201 });
  } catch (e) { return errResponse(e); }
}
