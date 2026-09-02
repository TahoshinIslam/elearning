import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { errResponse } from '@/lib/repo';
import { getMyLearning } from '@/lib/learningRepo';

export const dynamic = 'force-dynamic';

// Real per-course learning progress for the signed-in student — powers the
// My Learning page (continue-learning, progress %, resume, certificates).
// Always the caller's own data; there is no studentId param to spoof.
export async function GET() {
  try {
    const session = requireUser();
    return NextResponse.json(await getMyLearning(session));
  } catch (e) { return errResponse(e); }
}
