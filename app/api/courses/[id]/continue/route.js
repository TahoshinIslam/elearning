import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { errResponse } from '@/lib/repo';
import { getCourseProgress } from '@/lib/videoRepo';

export const dynamic = 'force-dynamic';

// Powers the learning player's "resume" behavior and curriculum sidebar
// progress — every video lesson in the course plus this student's saved
// position on each, and which lesson to land on.
export async function GET(request, { params }) {
  try {
    const session = requireUser();
    const result = await getCourseProgress(session, Number(params.id));
    return NextResponse.json(result);
  } catch (e) { return errResponse(e); }
}
