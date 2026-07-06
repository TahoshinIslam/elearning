import { NextResponse } from 'next/server';
import { getTenants, toggleTenant, errResponse } from '@/lib/repo';

export const dynamic = 'force-dynamic';

export async function GET() {
  try { return NextResponse.json(await getTenants()); } catch (e) { return errResponse(e); }
}
export async function PATCH(request) {
  try { return NextResponse.json(await toggleTenant(await request.json())); } catch (e) { return errResponse(e); }
}
