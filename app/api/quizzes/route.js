import { NextResponse } from 'next/server';
import { errResponse, HttpError } from '@/lib/repo';
import { getQuizForStudent, getQuizForEdit, saveQuiz } from '@/lib/quizRepo';
import { requireUser, requireStaffSection } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/quizzes?lessonId=&mode=take|edit
//  - take: student view (no correct answers) + this student's attempt
//  - edit: teacher/owner view (with correct answers)
export async function GET(request) {
  try {
    const sp = request.nextUrl.searchParams;
    const lessonId = Number(sp.get('lessonId'));
    if (!lessonId) throw new HttpError(400, { error: 'lessonId_required' });
    if (sp.get('mode') === 'edit') {
      requireStaffSection('quizzes');
      return NextResponse.json(await getQuizForEdit(lessonId));
    }
    const session = requireUser();
    return NextResponse.json(await getQuizForStudent(lessonId, session.studentId || 0));
  } catch (e) { return errResponse(e); }
}

// POST /api/quizzes  { lessonId, questions:[{question, options:[{text,isCorrect}]}] }
export async function POST(request) {
  try {
    requireStaffSection('quizzes');
    return NextResponse.json(await saveQuiz(await request.json()), { status: 201 });
  } catch (e) { return errResponse(e); }
}
