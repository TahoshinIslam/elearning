import { NextResponse } from 'next/server';
import { errResponse } from '@/lib/repo';
import { validateCoupon } from '@/lib/couponRepo';
import { requireUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// POST /api/coupons/validate  { code, amount }  → { discount, finalAmount } or error
// Preview only — no redemption happens here.
export async function POST(request) {
  try {
    const session = await requireUser();
    const { code, amount } = await request.json();
    return NextResponse.json(await validateCoupon(code, amount, session));
  } catch (e) { return errResponse(e); }
}
