import { NextResponse } from 'next/server';

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

export function proxy(request) {
  const { pathname } = request.nextUrl;
  const isApi = pathname.startsWith('/api/');
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
