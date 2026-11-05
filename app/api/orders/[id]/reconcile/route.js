import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { errResponse } from '@/lib/repo';
import { reconcileOrder } from '@/lib/orderRepo';
import { rateLimit, LIMITS } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

// "Check payment status": asks bKash directly about this order. Owner of the
// order or staff only; repeatable and idempotent.
export async function POST(request, { params }) {
  try {
    const session = await requireUser();
    rateLimit(`reconcile:${session.id}`, LIMITS.reconcile);
    return NextResponse.json(await reconcileOrder(session, Number(params.id)));
  } catch (e) { return errResponse(e); }
}
