import { NextResponse } from 'next/server';
import { finalizeBkashCallback } from '@/lib/orderRepo';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

// bKash redirects the customer's browser here after they complete, cancel,
// or fail the payment on bKash's hosted page, with ?paymentID=&status=.
// Those query params are client-controlled (the browser round-tripped
// through bKash, but a request to this URL could in principle be forged) —
// so "status=success" here is only ever a hint to go check. The actual
// verification is finalizeBkashCallback() calling bKash's own server back
// via executePayment(); nothing is marked paid without that.
export async function GET(request) {
  const paymentID = request.nextUrl.searchParams.get('paymentID');
  const status = request.nextUrl.searchParams.get('status');
  const resultUrl = new URL('/checkout/result', request.url);

  try {
    const { order } = await finalizeBkashCallback({ paymentID, status });
    resultUrl.searchParams.set('order', String(order.id));
    resultUrl.searchParams.set('status', order.status);
  } catch (e) {
    logger.error('bkash_callback_failed', { paymentID, status, message: e?.message });
    resultUrl.searchParams.set('status', 'error');
  }

  return NextResponse.redirect(resultUrl);
}
