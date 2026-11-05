import { NextResponse } from 'next/server';
import { errResponse, HttpError } from '@/lib/repo';
import { getQuizForStudent, getQuizForEdit, saveQuiz, quizCourse } from '@/lib/quizRepo';
import { requireUser, requireStaffSection } from '@/lib/auth';
import { assertLessonAccess, assertTeachesCourse } from '@/lib/access';

export const dynamic = 'force-dynamic';

async function assertQuizEditor(lessonId, level) {
  const session = await requireStaffSection('quizzes', level);
  const course = await quizCourse(lessonId);
  if (!course) throw new HttpError(404, { error: 'quiz_not_found' });
  await assertTeachesCourse(session, course.id);
  return session;
}

// GET /api/quizzes?lessonId=&mode=take|edit
//  - take: student view (answers withheld per the quiz's reveal rule)
//  - edit: quiz editor (quizzes:view; teachers only for their own courses)
export async function GET(request) {
  try {
    const sp = request.nextUrl.searchParams;
    const lessonId = Number(sp.get('lessonId'));
    if (!lessonId) throw new HttpError(400, { error: 'lessonId_required' });
    if (sp.get('mode') === 'edit') {
      await assertQuizEditor(lessonId, 'view');
      return NextResponse.json(await getQuizForEdit(lessonId));
    }
    const session = await requireUser();
    await assertLessonAccess(session, lessonId);
    return NextResponse.json(await getQuizForStudent(lessonId, session.studentId || 0));
  } catch (e) { return errResponse(e); }
}

// POST /api/quizzes { lessonId, settings, questions:[{question, type, points, explanation, acceptedAnswers, options:[{text,isCorrect}]}] }
export async function POST(request) {
  try {
    const body = await request.json();
    await assertQuizEditor(Number(body.lessonId), 'manage');
    return NextResponse.json(await saveQuiz(body), { status: 201 });
  } catch (e) { return errResponse(e); }
}
