// Compact HMAC-signed, expiring tokens for this app's own storage routes
// (local provider uploads/playback/downloads). Server-only.
import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';

function secret() {
  const s = process.env.STORAGE_SIGNING_SECRET || process.env.AUTH_SECRET;
  if (!s && process.env.NODE_ENV === 'production') {
    throw new Error('STORAGE_SIGNING_SECRET (or AUTH_SECRET) must be set in production');
  }
  return s || 'leo-dev-storage-secret';
}

const sign = (body) => createHmac('sha256', secret()).update(`storage:${body}`).digest('base64url');

export function signToken(payload, ttlSeconds) {
  const body = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + ttlSeconds * 1000 })).toString('base64url');
  return `${body}.${sign(body)}`;
}

// → payload or null (bad signature / expired / malformed)
export function verifyToken(token) {
  if (typeof token !== 'string' || token.length > 4096) return null;
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;
  const a = Buffer.from(sig);
  const b = Buffer.from(sign(body));
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
    if (!payload.exp || Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}
