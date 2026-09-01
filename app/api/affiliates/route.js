import { NextResponse } from 'next/server';
import { errResponse } from '@/lib/repo';
import { getAffiliates, createAffiliate, setAffiliateActive, deleteAffiliate } from '@/lib/affiliateRepo';
import { requireRole } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Affiliate management is admin-only (owner/superadmin).
export async function GET() {
  try { requireRole('owner', 'superadmin'); return NextResponse.json(await getAffiliates()); }
  catch (e) { return errResponse(e); }
}
export async function POST(request) {
  try { requireRole('owner', 'superadmin'); return NextResponse.json(await createAffiliate(await request.json()), { status: 201 }); }
  catch (e) { return errResponse(e); }
}
export async function PATCH(request) {
  try { requireRole('owner', 'superadmin'); return NextResponse.json(await setAffiliateActive(await request.json())); }
  catch (e) { return errResponse(e); }
}
export async function DELETE(request) {
  try { requireRole('owner', 'superadmin'); return NextResponse.json(await deleteAffiliate(await request.json())); }
  catch (e) { return errResponse(e); }
}
