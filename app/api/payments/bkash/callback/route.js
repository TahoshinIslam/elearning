import { NextResponse } from 'next/server';
import { finalizeBkashCallback } from '@/lib/orderRepo';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

// bKash redirects the customer's browser here with ?paymentID=&status=.
// Those params are client-controlled, so "success" is only a prompt to
// verify: finalizeBkashCallback() asks bKash's server (execute → status
// query fallback) and only then grants access. The result page re-reads
// the order from the server; nothing in its URL is trusted.
export async function GET(request) {
  const paymentID = request.nextUrl.searchParams.get('paymentID');
  const status = request.nextUrl.searchParams.get('status');
  const base = process.env.APP_BASE_URL ? process.env.APP_BASE_URL.replace(/\/$/, '') : request.nextUrl.origin;
  const resultUrl = new URL('/checkout/result', base);

  try {
    const { order } = await finalizeBkashCallback({ paymentID, status });
    resultUrl.searchParams.set('order', String(order.id));
  } catch (e) {
    logger.error('bkash_callback_failed', { status, message: e?.message });
    resultUrl.searchParams.set('error', 'verification');
  }
  return NextResponse.redirect(resultUrl, { status: 303 });
}
