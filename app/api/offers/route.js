import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { errResponse } from '@/lib/repo';
import { listOffers, saveOffer, setOfferActive } from '@/lib/offerRepo';

export const dynamic = 'force-dynamic';

export async function GET() {
  try { requireRole('owner', 'superadmin'); return NextResponse.json(await listOffers()); } catch (e) { return errResponse(e); }
}
// POST { id?, name, type, value, scope, scopeValue, startsAt, endsAt }
export async function POST(request) {
  try { const s = requireRole('owner', 'superadmin'); return NextResponse.json(await saveOffer(s, await request.json())); } catch (e) { return errResponse(e); }
}
// PATCH { id, isActive }
export async function PATCH(request) {
  try { const s = requireRole('owner', 'superadmin'); return NextResponse.json(await setOfferActive(s, await request.json())); } catch (e) { return errResponse(e); }
}
