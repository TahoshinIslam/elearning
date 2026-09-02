import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { getPayments, recordPayment, refundPayment, errResponse } from '@/lib/repo';

export const dynamic = 'force-dynamic';

// This endpoint is for staff-recorded transactions only (owner FeesTab
// manually marking a batch fee as paid, etc). Real marketplace checkout goes
// through POST /api/orders + the bKash callback (lib/orderRepo.js), which is
// the only path allowed to compute a price or create an enrollment. This
// route used to accept requireUser() (any signed-in role) with a
// client-supplied amount and studentId — that was a critical price-forgery
// and impersonation hole, closed by restricting it to staff.
export async function GET(request) {
  try { requireRole('owner', 'teacher', 'superadmin'); return NextResponse.json(await getPayments(request.nextUrl.searchParams)); }
  catch (e) { return errResponse(e); }
}
export async function POST(request) {
  try {
    requireRole('owner', 'teacher', 'superadmin');
    const result = await recordPayment(await request.json());
    return NextResponse.json(result, { status: 201 });
  } catch (e) { return errResponse(e); }
}
export async function PATCH(request) {
  try { requireRole('owner', 'superadmin'); return NextResponse.json(await refundPayment(await request.json())); }
  catch (e) { return errResponse(e); }
}
