import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { errResponse } from '@/lib/repo';
import { requestCampaignImageUpload, confirmCampaignImage } from '@/lib/campaignRepo';

export const dynamic = 'force-dynamic';

export async function POST(request, { params }) {
  try { requireRole('owner', 'superadmin'); return NextResponse.json(await requestCampaignImageUpload(params.id, await request.json())); } catch (e) { return errResponse(e); }
}
export async function PATCH(request, { params }) {
  try { requireRole('owner', 'superadmin'); const b = await request.json(); return NextResponse.json(await confirmCampaignImage(params.id, b.key)); } catch (e) { return errResponse(e); }
}
