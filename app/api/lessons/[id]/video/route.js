import { NextResponse } from 'next/server';
import { currentSession, requireRole } from '@/lib/auth';
import { errResponse } from '@/lib/repo';
import { getPlaybackInfo, confirmUpload } from '@/lib/videoRepo';

export const dynamic = 'force-dynamic';

// A free-preview lesson must be watchable by a guest, so this deliberately
// does NOT require a session — but getPlaybackInfo() still re-derives
// entitlement itself (free lesson, staff, or a real enrollment) before ever
// returning a signed URL. This is the server-side check the audit asked for.
export async function GET(request, { params }) {
  try {
    const session = currentSession();
    const info = await getPlaybackInfo(session, Number(params.id));
    return NextResponse.json(info);
  } catch (e) { return errResponse(e); }
}

// Instructor/owner confirms an upload completed (after PUTting the file
// straight to storage via the presigned URL from /upload-url).
export async function POST(request, { params }) {
  try {
    requireRole('owner', 'superadmin');
    const body = await request.json();
    const result = await confirmUpload({ lessonId: Number(params.id), key: body.key, durationSeconds: body.durationSeconds });
    return NextResponse.json(result);
  } catch (e) { return errResponse(e); }
}
