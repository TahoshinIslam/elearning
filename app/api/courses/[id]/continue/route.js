import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { errResponse, HttpError } from '@/lib/repo';
import { getCourseContext } from '@/lib/access';
import { getLearnerCourse } from '@/lib/learningRepo';

export const dynamic = 'force-dynamic';

// Kept for existing links/clients: resolves the course by id and returns the
// same learner outline as GET /api/learn/[slug] (with resumeLessonId).
export async function GET(request, { params }) {
  try {
    const session = requireUser();
    const course = await getCourseContext(Number(params.id));
    if (!course) throw new HttpError(404, { error: 'course_not_found' });
    return NextResponse.json(await getLearnerCourse(session, course.slug));
  } catch (e) { return errResponse(e); }
}
