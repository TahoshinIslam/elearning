import { NextResponse } from 'next/server';
import { errResponse } from '@/lib/repo';
import { getHomepage, saveSection } from '@/lib/homepageRepo';
import { requireRole } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET → public (the landing page reads this to overlay CMS content).
export async function GET() {
  try { return NextResponse.json(await getHomepage()); } catch (e) { return errResponse(e); }
}

// PATCH → owner/superadmin save a section  { section, data }.
export async function PATCH(request) {
  try {
    requireRole('owner', 'superadmin');
    return NextResponse.json(await saveSection(await request.json()));
  } catch (e) { return errResponse(e); }
}
