// Routes the REAL bKash adapter (lib/bkash.js) to the in-process simulator
// (lib/bkashSimulator.js) by intercepting fetch for /api/dev/bkash/*. So
// these tests exercise the actual create → customer authorizes → callback →
// server-side execute/status verification path, with no module mocks.
import { simGrant, simCreate, simExecute, simStatus, simDecide, simGetPayment } from '@/lib/bkashSimulator';

const ROUTES = {
  'tokenized/checkout/token/grant': (h, b) => simGrant(h, b),
  'tokenized/checkout/create': (h, b) => simCreate(h, b, 'http://app.test'),
  'tokenized/checkout/execute': (h, b) => simExecute(h, b),
  'tokenized/checkout/payment/status': (h, b) => simStatus(h, b)
};

export function installBkashSimulator() {
  process.env.BKASH_SIMULATOR = 'true';
  process.env.APP_BASE_URL = 'http://app.test';
  const realFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, init = {}) => {
    const m = String(url).match(/\/api\/dev\/bkash\/(.+)$/);
    if (!m || !ROUTES[m[1]]) return realFetch(url, init);
    const body = init.body ? JSON.parse(init.body) : {};
    calls.push({ path: m[1], body });
    const out = ROUTES[m[1]](new Headers(init.headers), body);
    return new Response(JSON.stringify(out), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };
  return { calls, restore: () => { globalThis.fetch = realFetch; } };
}

// The customer acts on bKash's hosted page → the callback query bKash would send.
export function customer(paymentID, action) {
  const url = new URL(simGetPayment(paymentID) ? simDecide(paymentID, action) : 'http://x/');
  return { paymentID: url.searchParams.get('paymentID'), status: url.searchParams.get('status') };
}

export const paymentIdFrom = (bkashURL) => new URL(bkashURL).searchParams.get('paymentID');
