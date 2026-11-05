import { NextResponse } from 'next/server';
import { errResponse } from '@/lib/repo';
import { requireStaffSection } from '@/lib/auth';
import { listSections, listPublicSections, createSection, updateSection, deleteSection, moveSection } from '@/lib/sectionRepo';

export const dynamic = 'force-dynamic';

// GET           → enabled sections (public)
// GET ?all=1    → every section with course counts (staff: sections:view)
// POST/PATCH/DELETE → staff with sections:manage
export async function GET(request) {
  try {
    if (new URL(request.url).searchParams.get('all')) { await requireStaffSection('sections', 'view'); return NextResponse.json(await listSections()); }
    return NextResponse.json(await listPublicSections());
  } catch (e) { return errResponse(e); }
}

export async function POST(request) {
  try { await requireStaffSection('sections', 'manage'); return NextResponse.json(await createSection(await request.json()), { status: 201 }); }
  catch (e) { return errResponse(e); }
}

export async function PATCH(request) {
  try {
    await requireStaffSection('sections', 'manage');
    const body = await request.json();
    return NextResponse.json(body.move ? await moveSection(body.id, body.move) : await updateSection(body));
  } catch (e) { return errResponse(e); }
}

export async function DELETE(request) {
  try { await requireStaffSection('sections', 'manage'); return NextResponse.json(await deleteSection((await request.json()).id)); }
  catch (e) { return errResponse(e); }
}
