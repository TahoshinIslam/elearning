import { NextResponse } from 'next/server';
import { currentSession, requireUser } from '@/lib/auth';
import { errResponse } from '@/lib/repo';
import { listResources, listResourcesForStaff, addLinkResource, requestResourceUpload, confirmResourceUpload, deleteResource } from '@/lib/resourceRepo';
import { rateLimit, LIMITS } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

// GET → resources the viewer may use (lesson access re-checked);
//       ?manage=1 → staff view including pending uploads.
export async function GET(request, { params }) {
  try {
    const id = Number(params.id);
    if (request.nextUrl.searchParams.get('manage') === '1') return NextResponse.json(await listResourcesForStaff(requireUser(), id));
    return NextResponse.json(await listResources(currentSession(), id));
  } catch (e) { return errResponse(e); }
}

// POST { kind:'link', title, url } | { kind:'file', title, fileName, contentType, size } (course managers)
export async function POST(request, { params }) {
  try {
    const session = requireUser();
    rateLimit(`upload:${session.id}`, LIMITS.upload);
    const body = await request.json();
    const id = Number(params.id);
    if (body.kind === 'link') return NextResponse.json(await addLinkResource(session, id, body), { status: 201 });
    return NextResponse.json(await requestResourceUpload(session, id, body), { status: 201 });
  } catch (e) { return errResponse(e); }
}

// PATCH { resourceId } → confirm a file upload completed
export async function PATCH(request, { params }) {
  try {
    const body = await request.json();
    return NextResponse.json(await confirmResourceUpload(requireUser(), Number(params.id), body.resourceId));
  } catch (e) { return errResponse(e); }
}

export async function DELETE(request, { params }) {
  try {
    const body = await request.json();
    return NextResponse.json(await deleteResource(requireUser(), Number(params.id), body.resourceId));
  } catch (e) { return errResponse(e); }
}
