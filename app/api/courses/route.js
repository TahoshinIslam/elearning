import { NextResponse } from 'next/server';
import { currentSession, isStaff, requireStaffSection } from '@/lib/auth';
import { getCourses, addCourse, courseOp, errResponse } from '@/lib/repo';
import { listPublishedCourses, parseCatalogQuery, getCatalogFacets } from '@/lib/catalogRepo';

export const dynamic = 'force-dynamic';

// Staff (teacher/owner/superadmin) get the full course list, drafts
// included (edits stay owner/superadmin-only below). Everyone else gets the public catalog: published courses only,
// paginated, filterable (?q=&category=&level=&language=&price=&sort=&page=).
export async function GET(request) {
  try {
    const session = await currentSession();
    const sp = request.nextUrl.searchParams;
    if (isStaff(session) && sp.get('scope') !== 'public') return NextResponse.json(await getCourses());
    const result = await listPublishedCourses(parseCatalogQuery(sp), sp.get('all') === '1' ? { pageSize: 200 } : undefined);
    if (sp.get('facets') === '1') result.facets = await getCatalogFacets();
    return NextResponse.json(result);
  } catch (e) { return errResponse(e); }
}
export async function POST(request) {
  try { const session = await requireStaffSection('courses', 'manage'); return NextResponse.json(await addCourse(await request.json(), session), { status: 201 }); } catch (e) { return errResponse(e); }
}
export async function PATCH(request) {
  try { const session = await requireStaffSection('courses', 'manage'); return NextResponse.json(await courseOp(await request.json(), session)); } catch (e) { return errResponse(e); }
}
