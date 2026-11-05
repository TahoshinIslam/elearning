import { NextResponse } from 'next/server';
import { inspectRequest, isCrossSiteWrite, hit, LIMITS as SHIELD, activeBlock, report, syncBlocks, ipFromHeaders } from '@/lib/shield';

// Private areas: never indexed, never cached by a shared cache.
const PRIVATE_PAGES = ['/learn', '/student', '/owner', '/superadmin', '/checkout', '/account', '/login', '/register', '/forgot', '/reset', '/dev'];

// Anonymous first-party visitor id (26 chars, Crockford-style alphabet) for
// lib/trackingRepo.js. Not personal data on its own; HttpOnly, 1 year.
const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
function newVisitorId() {
  const bytes = crypto.getRandomValues(new Uint8Array(26));
  return Array.from(bytes, (b) => ALPHABET[b % 32]).join('');
}

// Content-Security-Policy. Scripts must carry this request's nonce (Next.js
// reads it from the request header and stamps its own scripts); no inline
// event handlers, no eval in production, no plugins, no framing by others.
// Storage / payment hosts come from env so S3, R2 and bKash keep working.
function contentSecurityPolicy(nonce) {
  const dev = process.env.NODE_ENV !== 'production';
  const extraConnect = [process.env.STORAGE_PUBLIC_URL, process.env.S3_ENDPOINT, process.env.R2_ENDPOINT]
    .filter(Boolean).map((u) => { try { return new URL(u).origin; } catch { return null; } }).filter(Boolean);
  const storage = ['https://*.r2.cloudflarestorage.com', 'https://*.amazonaws.com', ...extraConnect].join(' ');
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${dev ? " 'unsafe-eval'" : ''}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: blob: ${storage} https:`,
    `media-src 'self' blob: ${storage}`,
    "font-src 'self' data:",
    `connect-src 'self' ${storage} https://*.bka.sh${dev ? ' ws: wss:' : ''}`,
    'frame-src https://*.bka.sh https://www.youtube-nocookie.com',
    "form-action 'self' https://*.bka.sh",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "object-src 'none'",
    ...(dev ? [] : ['upgrade-insecure-requests'])
  ].join('; ');
}

const MAX_API_BODY = 1024 * 1024; // 1 MB JSON; file bytes go to signed upload URLs
const AUTH_PATHS = /^\/api\/auth\/(login|register|forgot|reset|otp)/;

function deny(isApi, status, error, extra = {}, retryAfter) {
  const headers = { 'Cache-Control': 'no-store', ...(retryAfter ? { 'Retry-After': String(retryAfter) } : {}) };
  if (isApi) return NextResponse.json({ error, ...extra }, { status, headers });
  const until = extra.until ? new Date(extra.until).toUTCString() : null;
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${status === 429 ? 'Slow down' : 'Access blocked'}</title></head>
<body style="margin:0;min-height:100vh;display:grid;place-items:center;background:#FBF8F1;font-family:system-ui,sans-serif;color:#0A0A0A">
<main style="max-width:520px;margin:24px;padding:32px;background:#fff;border:3px solid #0A0A0A;box-shadow:8px 8px 0 #0A0A0A;text-align:center">
<div style="display:inline-block;padding:4px 12px;border:3px solid #0A0A0A;background:${status === 429 ? '#FFD84D' : '#FF7AA2'};font-weight:800;font-size:28px;transform:rotate(-3deg)">${status}</div>
<h1 style="text-transform:uppercase;margin:18px 0 8px">${status === 429 ? 'Too many requests' : 'Access temporarily blocked'}</h1>
<p style="margin:0 0 6px">${status === 429 ? 'Please wait a moment and try again.' : 'Unusual activity from your network was detected and blocked to protect the site.'}</p>
<p style="margin:0;color:#4E4A43">${status === 429 ? 'অনেক বেশি অনুরোধ — একটু পরে আবার চেষ্টা করুন।' : 'অস্বাভাবিক কার্যকলাপের কারণে সাময়িকভাবে ব্লক করা হয়েছে।'}${until ? `<br><small>Until ${until}</small>` : ''}</p>
</main></body></html>`;
  return new NextResponse(html, { status, headers: { ...headers, 'Content-Type': 'text/html; charset=utf-8' } });
}

export async function proxy(request) {
  const { pathname, search } = request.nextUrl;
  const isApi = pathname.startsWith('/api/');
  const method = request.method.toUpperCase();

  // ---- security shield (lib/shield.js) ----
  await syncBlocks();
  const ip = ipFromHeaders(request.headers);
  const blocked = activeBlock(ip);
  if (blocked) return deny(isApi, 403, 'blocked', { until: blocked.until }, blocked.until ? Math.ceil((blocked.until - Date.now()) / 1000) : undefined);

  const sig = inspectRequest(pathname, search);
  if (sig) {
    const b = report(ip, sig.kind, sig.points);
    return b ? deny(isApi, 403, 'blocked', { until: b.until }) : deny(isApi, 404, 'not_found');
  }
  if (isApi && isCrossSiteWrite(method, request.headers.get('origin'), request.headers.get('host'))) {
    report(ip, 'cross_site_write', 4);
    return deny(true, 403, 'cross_site_request');
  }
  if (isApi && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) && !pathname.startsWith('/api/storage/')) {
    const len = Number(request.headers.get('content-length') || 0);
    if (len > MAX_API_BODY) { report(ip, 'oversized_body', 2); return deny(true, 413, 'payload_too_large'); }
    const ct = (request.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
    if (len > 0 && ct && ct !== 'application/json' && ct !== 'text/plain') return deny(true, 415, 'unsupported_media_type');
  }
  const bucket = isApi ? (AUTH_PATHS.test(pathname) ? 'auth' : ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) ? 'write' : 'api') : 'page';
  if (!(isApi && pathname === '/api/track')) {
    const rl = hit(`${bucket}:${ip}`, SHIELD[bucket]);
    if (!rl.ok) {
      if (rl.count === SHIELD[bucket].limit + 1 || rl.count % 25 === 0) report(ip, `rate_limit_${bucket}`, 3);
      return deny(isApi, 429, 'rate_limited', { retryAfter: rl.retryAfter }, rl.retryAfter);
    }
  }

  const nonce = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(16))));
  const csp = contentSecurityPolicy(nonce);

  // hand the nonce to the app (Next applies it to its scripts; layouts can
  // read x-nonce for their own inline scripts)
  const requestHeaders = new Headers(request.headers);
  requestHeaders.delete('x-middleware-subrequest'); // never trust this from clients
  if (!isApi) {
    requestHeaders.set('x-pathname', pathname);
    requestHeaders.set('x-nonce', nonce);
    requestHeaders.set('Content-Security-Policy', csp);
  }
  const res = NextResponse.next({ request: { headers: requestHeaders } });

  if (!isApi && !request.cookies.get('leo_vid')) {
    res.cookies.set('leo_vid', newVisitorId(), {
      httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 365 * 24 * 3600
    });
  }

  if (!isApi) res.headers.set('Content-Security-Policy', csp);
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  res.headers.set('Cross-Origin-Resource-Policy', 'same-site');
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(self), usb=(), interest-cohort=()');
  if (process.env.NODE_ENV === 'production') {
    res.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  }

  // API responses carry per-user data: no shared caching anywhere. The
  // storage routes set their own policy (private for signed media, public
  // immutable for thumbnails).
  if (isApi && !pathname.startsWith('/api/storage/')) {
    res.headers.set('Cache-Control', 'private, no-store');
  }
  if (PRIVATE_PAGES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    res.headers.set('X-Robots-Tag', 'noindex, nofollow');
    res.headers.set('Cache-Control', 'private, no-store');
  }
  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon.svg|robots.txt|sitemap.xml).*)']
};
