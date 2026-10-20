import { NextResponse } from 'next/server';

// Private areas: never indexed, never cached by a shared cache.
const PRIVATE_PAGES = ['/learn', '/student', '/owner', '/superadmin', '/checkout', '/account', '/login', '/register', '/forgot', '/reset', '/dev'];

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const res = NextResponse.next();

  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set('X-Frame-Options', 'SAMEORIGIN');
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  // API responses carry per-user data: no shared caching anywhere. The
  // storage routes set their own policy (private for signed media, public
  // immutable for thumbnails).
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/storage/')) {
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
