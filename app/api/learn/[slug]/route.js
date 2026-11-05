import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { errResponse } from '@/lib/repo';
import { getLearnerCourse } from '@/lib/learningRepo';

export const dynamic = 'force-dynamic';

// Course player outline for the signed-in learner (or the course's manager).
export async function GET(request, { params }) {
  try { return NextResponse.json(await getLearnerCourse(await requireUser(), params.slug)); }
  catch (e) { return errResponse(e); }
}
