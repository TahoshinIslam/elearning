import { NextResponse } from 'next/server';
import { requireUser, requireRole } from '@/lib/auth';
import { errResponse } from '@/lib/repo';
import { createOrder, getOrders } from '@/lib/orderRepo';

export const dynamic = 'force-dynamic';

// The only entry point that can create a marketplace order. Price is always
// computed server-side from `courses` (see lib/orderRepo.js) — the client
// only ever names which course(s) it wants, never an amount.
export async function POST(request) {
  try {
    const session = requireUser();
    const body = await request.json();
    const result = await createOrder(session, body);
    return NextResponse.json(result, { status: 201 });
  } catch (e) {
    return errResponse(e);
  }
}

// Staff-only order/transaction monitoring — the real marketplace ledger.
export async function GET() {
  try {
    requireRole('owner', 'superadmin');
    return NextResponse.json(await getOrders());
  } catch (e) {
    return errResponse(e);
  }
}
