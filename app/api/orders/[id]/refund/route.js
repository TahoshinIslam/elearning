import { NextResponse } from 'next/server';
import { requireStaffSection } from '@/lib/auth';
import { errResponse } from '@/lib/repo';
import { refundOrder } from '@/lib/orderRepo';

export const dynamic = 'force-dynamic';

// Records a refund and revokes the access this order granted (see
// lib/orderRepo.js refundOrder). The money is returned via the bKash
// merchant panel.
export async function POST(request, props) {
  const params = await props.params;
  try {
    const session = await requireStaffSection('payments', 'manage');
    const body = await request.json().catch(() => ({}));
    const result = await refundOrder(session, Number(params.id), { reason: body.reason });
    return NextResponse.json(result);
  } catch (e) { return errResponse(e); }
}
