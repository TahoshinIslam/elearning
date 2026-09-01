import { NextResponse } from 'next/server';
import { errResponse } from '@/lib/repo';
import { getPublishedPosts, getAllPosts, createPost, updatePost, deletePost } from '@/lib/blogRepo';
import { requireRole, currentSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/blog        → published posts (public)
// GET /api/blog?all=1  → every post (admin only)
export async function GET(request) {
  try {
    if (request.nextUrl.searchParams.get('all') === '1') {
      const s = currentSession();
      if (!s || !['owner', 'superadmin'].includes(s.role)) return NextResponse.json(await getPublishedPosts());
      return NextResponse.json(await getAllPosts());
    }
    return NextResponse.json(await getPublishedPosts());
  } catch (e) { return errResponse(e); }
}

export async function POST(request) {
  try { requireRole('owner', 'superadmin'); return NextResponse.json(await createPost(await request.json()), { status: 201 }); }
  catch (e) { return errResponse(e); }
}
export async function PATCH(request) {
  try { requireRole('owner', 'superadmin'); return NextResponse.json(await updatePost(await request.json())); }
  catch (e) { return errResponse(e); }
}
export async function DELETE(request) {
  try { requireRole('owner', 'superadmin'); return NextResponse.json(await deletePost(await request.json())); }
  catch (e) { return errResponse(e); }
}
