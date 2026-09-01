import { NextResponse } from 'next/server';
import { errResponse } from '@/lib/repo';
import { createQuizLesson } from '@/lib/quizRepo';
import { requireStaffSection } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// POST /api/quizzes/lesson  { courseId, moduleId?, title }
// Creates a new quiz-type lesson so teachers can add a fresh quiz to a course/batch.
export async function POST(request) {
  try {
    requireStaffSection('quizzes');
    return NextResponse.json(await createQuizLesson(await request.json()), { status: 201 });
  } catch (e) { return errResponse(e); }
}
