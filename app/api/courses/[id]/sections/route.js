import { NextResponse } from 'next/server';
import { errResponse } from '@/lib/repo';
import { requireStaffSection } from '@/lib/auth';
import { getCourseSectionIds, setCourseSections } from '@/lib/sectionRepo';

export const dynamic = 'force-dynamic';

// Which home/catalog sections a course belongs to (course editor).
export async function GET(_request, props) {
  try { await requireStaffSection('courses', 'view'); const { id } = await props.params; return NextResponse.json({ sectionIds: await getCourseSectionIds(id) }); }
  catch (e) { return errResponse(e); }
}

export async function PUT(request, props) {
  try {
    await requireStaffSection('courses', 'manage');
    const { id } = await props.params;
    const { sectionIds } = await request.json();
    if (!Array.isArray(sectionIds)) return NextResponse.json({ error: 'section_ids_required' }, { status: 400 });
    return NextResponse.json({ sectionIds: await setCourseSections(id, sectionIds) });
  } catch (e) { return errResponse(e); }
}
