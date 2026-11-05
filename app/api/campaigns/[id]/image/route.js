import { NextResponse } from 'next/server';
import { requireStaffSection } from '@/lib/auth';
import { errResponse } from '@/lib/repo';
import { requestCampaignImageUpload, confirmCampaignImage } from '@/lib/campaignRepo';

export const dynamic = 'force-dynamic';

export async function POST(request, props) {
  const params = await props.params;
  try { await requireStaffSection('campaigns', 'manage'); return NextResponse.json(await requestCampaignImageUpload(params.id, await request.json())); } catch (e) { return errResponse(e); }
}
export async function PATCH(request, props) {
  const params = await props.params;
  try { await requireStaffSection('campaigns', 'manage'); const b = await request.json(); return NextResponse.json(await confirmCampaignImage(params.id, b.key)); } catch (e) { return errResponse(e); }
}
