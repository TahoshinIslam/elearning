import { NextResponse } from 'next/server';
import { currentSession, requireUser } from '@/lib/auth';
import { errResponse } from '@/lib/repo';
import { getPlaybackInfo, confirmUpload, removeVideo } from '@/lib/videoRepo';
import { rateLimit, clientIp, LIMITS } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

// Playback authorization. Deliberately callable without a session — a
// public preview lesson must play for a visitor — but getPlaybackInfo()
// (lib/access.js) re-derives entitlement on every call: preview only for
// is_free lessons of published courses, otherwise an active enrollment or
// course-manager role. The returned URL is short-lived and signed.
export async function GET(request, { params }) {
  try {
    const session = currentSession();
    rateLimit(`playback:${session?.id || clientIp()}`, LIMITS.playback);
    return NextResponse.json(await getPlaybackInfo(session, Number(params.id)));
  } catch (e) { return errResponse(e); }
}

// Course manager confirms an upload finished (after PUTting the file to the
// signed upload URL from /upload-url). The object's existence is verified.
export async function POST(request, { params }) {
  try {
    const session = requireUser();
    const body = await request.json();
    return NextResponse.json(await confirmUpload(session, Number(params.id), body));
  } catch (e) { return errResponse(e); }
}

export async function DELETE(request, { params }) {
  try {
    const session = requireUser();
    return NextResponse.json(await removeVideo(session, Number(params.id)));
  } catch (e) { return errResponse(e); }
}
