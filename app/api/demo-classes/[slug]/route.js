import { NextResponse } from 'next/server';
import { errResponse, HttpError } from '@/lib/repo';
import { getDemoClassBySlug } from '@/lib/demoClassRepo';
import { currentSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/demo-classes/{slug}  → detail (+ registration state for the signed-in user)
export async function GET(request, props) {
  const params = await props.params;
  try {
    const session = await currentSession();
    const dc = await getDemoClassBySlug(params.slug, session?.id);
    if (!dc) throw new HttpError(404, { error: 'not_found' });
    return NextResponse.json(dc);
  } catch (e) { return errResponse(e); }
}
