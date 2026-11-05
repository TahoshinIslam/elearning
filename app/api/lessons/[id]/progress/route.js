import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { errResponse } from '@/lib/repo';
import { saveProgress } from '@/lib/videoRepo';
import { rateLimit, LIMITS } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

// Saves watch progress for the signed-in student's own record only (there
// is no studentId parameter). Completion is derived server-side from the
// played ranges — see lib/videoRepo.js saveProgress / lib/watchRanges.js.
export async function POST(request, { params }) {
  try {
    const session = await requireUser();
    rateLimit(`progress:${session.id}`, LIMITS.progress);
    // sendBeacon posts text/plain; parse the body ourselves either way.
    const body = JSON.parse((await request.text()) || '{}');
    return NextResponse.json(await saveProgress(session, Number(params.id), body));
  } catch (e) { return errResponse(e); }
}
