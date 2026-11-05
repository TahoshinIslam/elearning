import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { errResponse } from '@/lib/repo';
import { requestUploadUrl, reportUploadFailure } from '@/lib/videoRepo';
import { rateLimit, LIMITS } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

// Course managers only (owner/superadmin, or the course's own instructor) —
// enforced in lib/videoRepo.js via lib/access.js. Validates type and size
// before minting a signed upload URL.
export async function POST(request, { params }) {
  try {
    const session = await requireUser();
    rateLimit(`upload:${session.id}`, LIMITS.upload);
    const body = await request.json();
    if (body.failed) return NextResponse.json(await reportUploadFailure(session, Number(params.id), body.reason));
    return NextResponse.json(await requestUploadUrl(session, Number(params.id), body));
  } catch (e) { return errResponse(e); }
}
