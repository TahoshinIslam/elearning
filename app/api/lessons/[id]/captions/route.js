import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { errResponse } from '@/lib/repo';
import { requestCaptionUpload, confirmCaption, deleteCaption } from '@/lib/videoRepo';

export const dynamic = 'force-dynamic';

// POST { lang, label } → signed upload URL for a .vtt file
// PATCH { key, lang, label } → confirm; DELETE { captionId }
export async function POST(request, props) {
  const params = await props.params;
  try { return NextResponse.json(await requestCaptionUpload(await requireUser(), Number(params.id), await request.json())); }
  catch (e) { return errResponse(e); }
}
export async function PATCH(request, props) {
  const params = await props.params;
  try { return NextResponse.json(await confirmCaption(await requireUser(), Number(params.id), await request.json())); }
  catch (e) { return errResponse(e); }
}
export async function DELETE(request, props) {
  const params = await props.params;
  try { const body = await request.json(); return NextResponse.json(await deleteCaption(await requireUser(), Number(params.id), Number(body.captionId))); }
  catch (e) { return errResponse(e); }
}
