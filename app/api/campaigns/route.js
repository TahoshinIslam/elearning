import { NextResponse } from 'next/server';
import { requireStaffSection } from '@/lib/auth';
import { errResponse } from '@/lib/repo';
import { listCampaigns, saveCampaign, campaignAction } from '@/lib/campaignRepo';

export const dynamic = 'force-dynamic';

export async function GET() {
  try { await requireStaffSection('campaigns', 'view'); return NextResponse.json(await listCampaigns()); } catch (e) { return errResponse(e); }
}
export async function POST(request) {
  try { const s = await requireStaffSection('campaigns', 'manage'); return NextResponse.json(await saveCampaign(s, await request.json())); } catch (e) { return errResponse(e); }
}
// PATCH { id, action: publish|unpublish|enable|disable|delete|move, dir? }
export async function PATCH(request) {
  try { const s = await requireStaffSection('campaigns', 'manage'); return NextResponse.json(await campaignAction(s, await request.json())); } catch (e) { return errResponse(e); }
}
