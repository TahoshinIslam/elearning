import { NextResponse } from 'next/server';
import { errResponse } from '@/lib/repo';
import { requireUser } from '@/lib/auth';
import { parseBody, schemas } from '@/lib/validate';
import { startAvatarUpload, confirmAvatar, removeAvatar } from '@/lib/avatarRepo';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// POST   { contentType, size, fileName } → signed upload URL for a new photo
// PUT    { key }                         → confirm the upload, make it the avatar
// DELETE                                 → remove the photo
export async function POST(request) {
  try {
    const me = await requireUser();
    return NextResponse.json(await startAvatarUpload(me.id, await parseBody(request, schemas.avatarStart)));
  } catch (e) { return errResponse(e); }
}

export async function PUT(request) {
  try {
    const me = await requireUser();
    const { key } = await parseBody(request, schemas.avatarConfirm);
    return NextResponse.json(await confirmAvatar(me.id, key));
  } catch (e) { return errResponse(e); }
}

export async function DELETE() {
  try {
    const me = await requireUser();
    return NextResponse.json(await removeAvatar(me.id));
  } catch (e) { return errResponse(e); }
}
