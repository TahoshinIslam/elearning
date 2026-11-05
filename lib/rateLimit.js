// Fixed-window rate limiter for sensitive endpoints (login, signup, password
// reset, checkout, progress saves). In-process memory: it protects a single
// server instance and resets on restart. A multi-instance deployment should
// back this with a shared store (Redis/Upstash) — same call sites.
import { headers } from 'next/headers';
import { HttpError } from '@/lib/repo';

const g = globalThis;
if (!g.__LEO_RL__) g.__LEO_RL__ = new Map();
const buckets = g.__LEO_RL__;

export async function clientIp() {
  try {
    const h = await headers();
    // A header named by TRUSTED_IP_HEADER (e.g. cf-connecting-ip, x-real-ip)
    // is set by your own proxy. Otherwise use the RIGHT-most X-Forwarded-For
    // entry — the one our nearest proxy appended — because everything to its
    // left is whatever the client chose to send (spoofable).
    const trusted = process.env.TRUSTED_IP_HEADER && h.get(process.env.TRUSTED_IP_HEADER);
    if (trusted) return trusted.trim();
    const xff = (h.get('x-forwarded-for') || '').split(',').map((x) => x.trim()).filter(Boolean);
    return xff[xff.length - 1] || h.get('x-real-ip') || 'local';
  } catch {
    return 'local';
  }
}

// Throws 429 once `limit` hits happen within `windowMs` for this key.
export function rateLimit(key, { limit, windowMs }) {
  const now = Date.now();
  let b = buckets.get(key);
  if (!b || now >= b.reset) {
    b = { count: 0, reset: now + windowMs };
    buckets.set(key, b);
  }
  b.count += 1;
  if (buckets.size > 50_000) {
    for (const [k, v] of buckets) if (now >= v.reset) buckets.delete(k);
  }
  if (b.count > limit) {
    throw new HttpError(429, { error: 'rate_limited', retryAfter: Math.ceil((b.reset - now) / 1000) });
  }
}

export const LIMITS = {
  login: { limit: 10, windowMs: 10 * 60_000 },
  register: { limit: 5, windowMs: 60 * 60_000 },
  forgot: { limit: 5, windowMs: 60 * 60_000 },
  reset: { limit: 10, windowMs: 60 * 60_000 },
  order: { limit: 20, windowMs: 10 * 60_000 },
  progress: { limit: 240, windowMs: 10 * 60_000 },
  playback: { limit: 120, windowMs: 10 * 60_000 },
  upload: { limit: 60, windowMs: 10 * 60_000 },
  review: { limit: 10, windowMs: 60 * 60_000 },
  reconcile: { limit: 12, windowMs: 10 * 60_000 }
};
