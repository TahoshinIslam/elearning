import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { errResponse } from '@/lib/repo';
import { priceCourses } from '@/lib/orderRepo';

export const dynamic = 'force-dynamic';

// Checkout preview: the same server pricing createOrder uses (coupon,
// already-owned and availability checks included). Nothing is stored.
export async function POST(request) {
  try {
    const session = await requireUser();
    const body = await request.json();
    return NextResponse.json(await priceCourses(session, body.courseIds, body.couponCode));
  } catch (e) { return errResponse(e); }
}
