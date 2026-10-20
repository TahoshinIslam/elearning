import { NextResponse } from 'next/server';
import { currentSession } from '@/lib/auth';
import { errResponse } from '@/lib/repo';
import { getActiveCampaigns } from '@/lib/campaignRepo';

export const dynamic = 'force-dynamic';

// Live popups/slides for a page and the current viewer (audience-filtered).
export async function GET(request) {
  try {
    const sp = request.nextUrl.searchParams;
    const kind = sp.get('kind') === 'slide' ? 'slide' : 'popup';
    const page = ['home', 'catalog', 'course'].includes(sp.get('page')) ? sp.get('page') : 'home';
    return NextResponse.json(await getActiveCampaigns({ kind, page, session: currentSession() }));
  } catch (e) { return errResponse(e); }
}
