import { NextResponse } from 'next/server';
import { errResponse } from '@/lib/repo';
import { getCoupons, createCoupon, setCouponActive, deleteCoupon } from '@/lib/couponRepo';
import { requireStaffSection } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Admin-only coupon management (owner scoped to tenant; superadmin global).
export async function GET() {
  try {
    const session = await requireStaffSection('coupons', 'view');
    return NextResponse.json(await getCoupons(session));
  } catch (e) { return errResponse(e); }
}
export async function POST(request) {
  try {
    const session = await requireStaffSection('coupons', 'manage');
    return NextResponse.json(await createCoupon(session, await request.json()), { status: 201 });
  } catch (e) { return errResponse(e); }
}
export async function PATCH(request) {
  try {
    const session = await requireStaffSection('coupons', 'manage');
    return NextResponse.json(await setCouponActive(session, await request.json()));
  } catch (e) { return errResponse(e); }
}
export async function DELETE(request) {
  try {
    const session = await requireStaffSection('coupons', 'manage');
    return NextResponse.json(await deleteCoupon(session, await request.json()));
  } catch (e) { return errResponse(e); }
}
