import { NextResponse } from 'next/server';
import { currentSession } from '@/lib/auth';
import { errResponse } from '@/lib/repo';
import { getResourceDownload } from '@/lib/resourceRepo';

export const dynamic = 'force-dynamic';

// Access-checked download: returns a short-lived signed URL (never the
// storage key). ?redirect=1 sends the browser straight to it.
export async function GET(request, { params }) {
  try {
    const result = await getResourceDownload(currentSession(), Number(params.id));
    if (request.nextUrl.searchParams.get('redirect') === '1') return NextResponse.redirect(new URL(result.url, request.url));
    return NextResponse.json(result);
  } catch (e) { return errResponse(e); }
}
