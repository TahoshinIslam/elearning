import { currentProvider, localPathForKey } from '@/lib/storage';
import { streamFile } from '@/lib/localMedia';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Local-provider public assets — course thumbnails only. Every other prefix
// (videos/, resources/, captions/) is private and only reachable through a
// signed /api/storage/object/<token> URL.
export async function GET(request, { params }) {
  if (currentProvider() !== 'local') return new Response('Not found', { status: 404 });
  const key = (params.key || []).join('/');
  if (!key.startsWith('thumbnails/')) return new Response('Not found', { status: 404 });
  let file;
  try { file = localPathForKey(key); } catch { return new Response('Not found', { status: 404 }); }
  // Keys are unique per upload, so the content behind one never changes.
  return streamFile(request, file, { headers: { 'Cache-Control': 'public, max-age=31536000, immutable' } });
}
