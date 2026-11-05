import { NextResponse } from 'next/server';
import { attributeOrder, visitorIdFromCookies } from '@/lib/trackingRepo';
import { requireUser, requireStaffSection } from '@/lib/auth';
import { errResponse } from '@/lib/repo';
import { createOrder, getOrders, getOrdersForStudent } from '@/lib/orderRepo';
import { rateLimit, LIMITS } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

// Create (or idempotently resume) an order. The client names course ids and
// an idempotency key; price, discount and total are computed server-side.
export async function POST(request) {
  try {
    const session = await requireUser();
    rateLimit(`order:${session.id}`, LIMITS.order);
    const result = await createOrder(session, await request.json());
    // revenue attribution: which source / ad campaign this purchase came from
    if (result?.order?.id) await attributeOrder(result.order.id, (await visitorIdFromCookies())).catch(() => {});
    return NextResponse.json(result, { status: 201 });
  } catch (e) {
    return errResponse(e);
  }
}

// ?mine=1 → the signed-in student's own purchase history.
// otherwise → staff ledger (owner/superadmin).
export async function GET(request) {
  try {
    if (request.nextUrl.searchParams.get('mine') === '1') return NextResponse.json(await getOrdersForStudent(await requireUser()));
    await requireStaffSection('payments', 'view');
    return NextResponse.json(await getOrders());
  } catch (e) {
    return errResponse(e);
  }
}
