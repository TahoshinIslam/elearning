import { NextResponse } from 'next/server';
import { errResponse } from '@/lib/repo';
import { listPublished, adminListPosts, adminGetPost, createPost, updatePost, deletePost } from '@/lib/blogRepo';
import { requireStaffSection } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/blog?page=&category=&tag=&q=        → published articles (public, paginated)
// GET /api/blog?all=1&page=&status=&q=         → every article (staff: blog:view)
// GET /api/blog?id=12                          → one article for the editor (staff)
export async function GET(request) {
  try {
    const sp = request.nextUrl.searchParams;
    if (sp.get('id')) { await requireStaffSection('blog', 'view'); return NextResponse.json(await adminGetPost(sp.get('id'))); }
    if (sp.get('all') === '1') {
      await requireStaffSection('blog', 'view');
      return NextResponse.json(await adminListPosts({ page: sp.get('page'), status: sp.get('status') || '', q: (sp.get('q') || '').slice(0, 100) }));
    }
    return NextResponse.json(await listPublished({ page: Number(sp.get('page')) || 1, category: sp.get('category') || '', tag: sp.get('tag') || '', q: (sp.get('q') || '').slice(0, 100) }));
  } catch (e) { return errResponse(e); }
}

export async function POST(request) {
  try { await requireStaffSection('blog', 'manage'); return NextResponse.json(await createPost(await request.json()), { status: 201 }); }
  catch (e) { return errResponse(e); }
}
export async function PATCH(request) {
  try { await requireStaffSection('blog', 'manage'); return NextResponse.json(await updatePost(await request.json())); }
  catch (e) { return errResponse(e); }
}
export async function DELETE(request) {
  try { await requireStaffSection('blog', 'manage'); return NextResponse.json(await deletePost(await request.json())); }
  catch (e) { return errResponse(e); }
}
