import { NextResponse } from 'next/server';
import { currentSession } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { rateLimit, clientIp } from '@/lib/rateLimit';
import { errResponse } from '@/lib/repo';

export const dynamic = 'force-dynamic';

// Client-reported playback failures → structured server log (no URLs or
// tokens are accepted or logged, only the media error code and context).
export async function POST(request, { params }) {
  try {
    const session = currentSession();
    rateLimit(`playback-error:${session?.id || clientIp()}`, { limit: 30, windowMs: 10 * 60_000 });
    const body = await request.json().catch(() => ({}));
    logger.warn('video_playback_error', {
      lessonId: Number(params.id),
      userId: session?.id ?? null,
      code: Number.isInteger(body.code) ? body.code : null,
      phase: typeof body.phase === 'string' ? body.phase.slice(0, 32) : null,
      retries: Number.isInteger(body.retries) ? body.retries : null
    });
    return NextResponse.json({ ok: true });
  } catch (e) { return errResponse(e); }
}
