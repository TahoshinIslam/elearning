import { NextResponse } from 'next/server';
import { errResponse, HttpError } from '@/lib/repo';
import { getPostBySlug, countView } from '@/lib/blogRepo';
import { currentSession } from '@/lib/auth';
import { canAccess } from '@/lib/rbac';

export const dynamic = 'force-dynamic';

// GET  /api/blog/{slug} → one article (drafts/scheduled only for blog staff)
// POST /api/blog/{slug} → count one view (sent once per browser session)
export async function GET(_request, props) {
  try {
    const { slug } = await props.params;
    const s = await currentSession();
    const post = await getPostBySlug(slug, { includeDrafts: !!s && canAccess(s, 'blog', 'view') });
    if (!post) throw new HttpError(404, { error: 'not_found' });
    return NextResponse.json(post);
  } catch (e) { return errResponse(e); }
}

export async function POST(_request, props) {
  try { const { slug } = await props.params; await countView(slug); return NextResponse.json({ ok: true }); }
  catch (e) { return errResponse(e); }
}
