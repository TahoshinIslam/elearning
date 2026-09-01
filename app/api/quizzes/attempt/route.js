import { NextResponse } from 'next/server';
import { errResponse, HttpError } from '@/lib/repo';
import { submitAttempt } from '@/lib/quizRepo';
import { requireUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// POST /api/quizzes/attempt  { lessonId, answers:{questionId:optionId} }
// The student is taken from the session — never trusted from the body.
export async function POST(request) {
  try {
    const session = requireUser();
    if (!session.studentId) throw new HttpError(403, { error: 'not_a_student' });
    const body = await request.json();
    const result = await submitAttempt({
      lessonId: body.lessonId,
      answers: body.answers,
      studentId: session.studentId,
      studentName: session.name
    });
    return NextResponse.json(result, { status: 201 });
  } catch (e) { return errResponse(e); }
}
