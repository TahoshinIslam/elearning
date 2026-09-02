import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { errResponse } from '@/lib/repo';
import { saveProgress } from '@/lib/videoRepo';

export const dynamic = 'force-dynamic';

// Saves watch position. `completed` is never taken from the client — see
// lib/videoRepo.js saveProgress(), which recomputes it server-side from
// watchedSeconds vs. the video's real duration.
export async function POST(request, { params }) {
  try {
    const session = requireUser();
    const body = await request.json();
    const result = await saveProgress(session, Number(params.id), body);
    return NextResponse.json(result);
  } catch (e) { return errResponse(e); }
}
