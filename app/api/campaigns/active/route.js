import { NextResponse } from 'next/server';
import { currentSession } from '@/lib/auth';
import { errResponse } from '@/lib/repo';
import { getActiveCampaigns } from '@/lib/campaignRepo';
import { getVisitor, visitorIdFromCookies } from '@/lib/trackingRepo';

export const dynamic = 'force-dynamic';

// Live popups/slides for a page and the current viewer (audience-filtered).
export async function GET(request) {
  try {
    const sp = request.nextUrl.searchParams;
    const kind = sp.get('kind') === 'slide' ? 'slide' : 'popup';
    const page = ['home', 'catalog', 'course', 'any'].includes(sp.get('page')) ? sp.get('page') : 'home';
    const visitor = await getVisitor((await visitorIdFromCookies())).catch(() => null);
    return NextResponse.json(await getActiveCampaigns({ kind, page, session: await currentSession(), visitor }));
  } catch (e) { return errResponse(e); }
}
