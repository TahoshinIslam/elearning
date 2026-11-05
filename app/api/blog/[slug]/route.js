import { NextResponse } from 'next/server';
import { errResponse, HttpError } from '@/lib/repo';
import { getPostBySlug } from '@/lib/blogRepo';
import { currentSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/blog/{slug} → a single post (drafts visible to admins only)
export async function GET(request, props) {
  const params = await props.params;
  try {
    const s = await currentSession();
    const includeDrafts = !!s && ['owner', 'superadmin'].includes(s.role);
    const post = await getPostBySlug(params.slug, { includeDrafts });
    if (!post) throw new HttpError(404, { error: 'not_found' });
    return NextResponse.json(post);
  } catch (e) { return errResponse(e); }
}
