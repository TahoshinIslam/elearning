import { NextResponse } from 'next/server';
import { recordEvent, visitorIdFromCookies, linkVisitorToUser, EVENT_TYPES } from '@/lib/trackingRepo';
import { currentSession } from '@/lib/auth';
import { rateLimit } from '@/lib/rateLimit';
import { siteUrl } from '@/lib/seo';

export const dynamic = 'force-dynamic';

// POST /api/track — first-party analytics beacon (navigator.sendBeacon).
// Body: { type, path, referrer, utmSource, utmMedium, utmCampaign, gclid, fbclid, device, refId, category }
// The visitor comes from the HttpOnly leo_vid cookie, never from the body.
// Always answers 204 so a tracking hiccup can never break a page.
export async function POST(request) {
  try {
    const vid = await visitorIdFromCookies();
    if (!vid) return new NextResponse(null, { status: 204 });
    rateLimit(`track:${vid}`, { limit: 400, windowMs: 10 * 60_000 });
    const body = await request.json().catch(() => ({}));
    if (!EVENT_TYPES.includes(body.type) || ['signup', 'purchase', 'login'].includes(body.type)) return new NextResponse(null, { status: 204 });
    let siteHost = '';
    try { siteHost = new URL(siteUrl()).hostname; } catch { /* ignore */ }
    await recordEvent(vid, { ...body, siteHost: request.nextUrl.hostname || siteHost });
    const session = await currentSession();
    if (session?.id) await linkVisitorToUser(vid, session.id);
  } catch { /* swallow: analytics must never fail a request */ }
  return new NextResponse(null, { status: 204 });
}
