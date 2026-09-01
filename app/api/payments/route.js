import { NextResponse } from 'next/server';
import { requireRole, requireUser } from '@/lib/auth';
import { getPayments, recordPayment, refundPayment, errResponse } from '@/lib/repo';
import { validateCoupon, redeemCoupon } from '@/lib/couponRepo';
import { recordAffiliateSale } from '@/lib/affiliateRepo';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try { return NextResponse.json(await getPayments(request.nextUrl.searchParams)); } catch (e) { return errResponse(e); }
}
export async function POST(request) {
  try {
    const session = requireUser();
    const body = await request.json();
    // Apply a coupon authoritatively server-side (never trust a client-sent discount).
    if (body.couponCode) {
      const { finalAmount } = await validateCoupon(body.couponCode, body.amount, session);
      body.amount = finalAmount;
      await redeemCoupon(body.couponCode);
    }
    const result = await recordPayment(body);
    // credit an affiliate commission if the purchase carried an affiliate code
    if (body.affiliateCode) {
      await recordAffiliateSale(body.affiliateCode, body.amount, body.courseId);
    }
    return NextResponse.json(result, { status: 201 });
  } catch (e) { return errResponse(e); }
}
export async function PATCH(request) {
  try { requireRole('owner','superadmin'); return NextResponse.json(await refundPayment(await request.json())); } catch (e) { return errResponse(e); }
}
