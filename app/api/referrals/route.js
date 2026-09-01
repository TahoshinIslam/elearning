import { NextResponse } from 'next/server';
import { errResponse } from '@/lib/repo';
import { getMyReferral } from '@/lib/referralRepo';
import { requireUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/referrals → the signed-in user's referral code + who they've referred
export async function GET() {
  try {
    const session = requireUser();
    return NextResponse.json(await getMyReferral(session.id));
  } catch (e) { return errResponse(e); }
}
