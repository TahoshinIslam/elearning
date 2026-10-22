import { verifyToken } from '@/lib/signedUrl';
import { currentProvider, localPathForKey } from '@/lib/storage';
import { streamFile } from '@/lib/localMedia';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Local-provider playback/download. The token was minted only after a
// server-side entitlement check (lib/access.js) and expires in minutes; a
// copied URL stops working on its own. Private + no-store so no shared
// cache ever holds paid content.
export async function GET(request, { params }) {
  if (currentProvider() !== 'local') return new Response('Not found', { status: 404 });
  const payload = verifyToken(params.token);
  if (!payload || payload.op !== 'get' || !payload.k) return new Response('Link expired', { status: 403 });
  let file;
  try { file = localPathForKey(payload.k); } catch { return new Response('Not found', { status: 404 }); }
  const headers = { 'Cache-Control': 'private, no-store', 'Referrer-Policy': 'no-referrer' };
  if (payload.dl) headers['Content-Disposition'] = `attachment; filename*=UTF-8''${encodeURIComponent(payload.dl)}`;
  return streamFile(request, file, { contentType: payload.ct, headers });
}
