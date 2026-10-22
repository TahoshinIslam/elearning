import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { errResponse } from '@/lib/repo';
import { requestCaptionUpload, confirmCaption, deleteCaption } from '@/lib/videoRepo';

export const dynamic = 'force-dynamic';

// POST { lang, label } → signed upload URL for a .vtt file
// PATCH { key, lang, label } → confirm; DELETE { captionId }
export async function POST(request, { params }) {
  try { return NextResponse.json(await requestCaptionUpload(requireUser(), Number(params.id), await request.json())); }
  catch (e) { return errResponse(e); }
}
export async function PATCH(request, { params }) {
  try { return NextResponse.json(await confirmCaption(requireUser(), Number(params.id), await request.json())); }
  catch (e) { return errResponse(e); }
}
export async function DELETE(request, { params }) {
  try { const body = await request.json(); return NextResponse.json(await deleteCaption(requireUser(), Number(params.id), Number(body.captionId))); }
  catch (e) { return errResponse(e); }
}
