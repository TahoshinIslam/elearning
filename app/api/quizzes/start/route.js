import { NextResponse } from 'next/server';
import { errResponse, HttpError } from '@/lib/repo';
import { startQuiz } from '@/lib/quizRepo';
import { requireUser } from '@/lib/auth';
import { assertLessonAccess } from '@/lib/access';

export const dynamic = 'force-dynamic';

// POST /api/quizzes/start { lessonId } → starts the clock of a timed quiz
// (idempotent: resuming returns the remaining seconds, it never resets).
export async function POST(request) {
  try {
    const session = await requireUser();
    if (!session.studentId) throw new HttpError(403, { error: 'not_a_student' });
    const { lessonId } = await request.json();
    const { ctx } = await assertLessonAccess(session, lessonId);
    if (ctx.type !== 'quiz') throw new HttpError(400, { error: 'not_a_quiz' });
    return NextResponse.json(await startQuiz(ctx.id, session.studentId));
  } catch (e) { return errResponse(e); }
}
