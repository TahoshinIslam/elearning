import { NextResponse } from 'next/server';
import { errResponse } from '@/lib/repo';
import { getSettings, saveSettings } from '@/lib/settingsRepo';
import { requireStaffSection } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET is public (maintenance banner + SEO need it); PATCH is admin-only.
export async function GET() {
  try { return NextResponse.json(await getSettings()); } catch (e) { return errResponse(e); }
}
export async function PATCH(request) {
  try { await requireStaffSection('settings', 'manage'); return NextResponse.json(await saveSettings(await request.json())); }
  catch (e) { return errResponse(e); }
}
