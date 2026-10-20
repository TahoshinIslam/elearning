import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { errResponse } from '@/lib/repo';
import { reconcileStalePending } from '@/lib/orderRepo';

export const dynamic = 'force-dynamic';

// Staff: re-verify every bKash order still pending after a few minutes
// (callbacks that never arrived, fulfilment interrupted mid-way).
export async function POST() {
  try { return NextResponse.json(await reconcileStalePending(requireRole('owner', 'superadmin'))); }
  catch (e) { return errResponse(e); }
}
