import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { errResponse } from '@/lib/repo';
import { getOrderForViewer } from '@/lib/orderRepo';

export const dynamic = 'force-dynamic';

// The buyer (or staff) reads one order. Another student's id → 404.
export async function GET(request, props) {
  const params = await props.params;
  try { return NextResponse.json(await getOrderForViewer(await requireUser(), Number(params.id))); }
  catch (e) { return errResponse(e); }
}
