import { NextResponse } from 'next/server';
import { errResponse } from '@/lib/repo';
import { createQuizLesson } from '@/lib/quizRepo';
import { requireStaffSection } from '@/lib/auth';
import { assertTeachesCourse } from '@/lib/access';

export const dynamic = 'force-dynamic';

// POST /api/quizzes/lesson  { courseId, moduleId?, title }
// Creates a new quiz-type lesson so teachers can add a fresh quiz to a course/batch.
export async function POST(request) {
  try {
    const session = await requireStaffSection('quizzes', 'manage');
    const body = await request.json();
    if (body.courseId) await assertTeachesCourse(session, Number(body.courseId));
    return NextResponse.json(await createQuizLesson(body), { status: 201 });
  } catch (e) { return errResponse(e); }
}
