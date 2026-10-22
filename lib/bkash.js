// ============================================================
// bKash Tokenized Checkout adapter (server-only).
//
// Endpoints follow the published Tokenized Checkout v1.2.0-beta contract:
//   POST {base}/tokenized/checkout/token/grant      headers username/password, body {app_key, app_secret}
//   POST {base}/tokenized/checkout/create           body {mode:'0011', payerReference, callbackURL, amount, currency, intent, merchantInvoiceNumber}
//   POST {base}/tokenized/checkout/execute          body {paymentID}
//   POST {base}/tokenized/checkout/payment/status   body {paymentID}
// where {base} is e.g. https://tokenized.sandbox.bka.sh/v1.2.0-beta (sandbox)
// or the live base URL bKash issues at merchant onboarding. This was written
// without live sandbox credentials — verify paths/fields against your
// merchant documentation before going live (BKASH_PATHS is the one place to
// change).
//
// Trust model: bKash's redirect to our callback is NOT proof of payment.
// The merchant server verifies by calling execute/status itself with
// merchant credentials (lib/orderRepo.js), and compares amount + status.
//
// Development: BKASH_SIMULATOR=true (never honoured in production) points
// this adapter at this app's own /api/dev/bkash emulator so the full
// create → hosted page → callback → server-side execute flow runs locally.
// ============================================================

import { logger } from '@/lib/logger';

const BKASH_PATHS = {
  grantToken: '/tokenized/checkout/token/grant',
  createPayment: '/tokenized/checkout/create',
  executePayment: '/tokenized/checkout/execute',
  queryPayment: '/tokenized/checkout/payment/status'
};

export function simulatorEnabled() {
  return process.env.BKASH_SIMULATOR === 'true' && process.env.NODE_ENV !== 'production';
}

export function bkashConfigured() {
  if (simulatorEnabled()) return true;
  const { BKASH_BASE_URL, BKASH_APP_KEY, BKASH_APP_SECRET, BKASH_USERNAME, BKASH_PASSWORD } = process.env;
  return !!(BKASH_BASE_URL && BKASH_APP_KEY && BKASH_APP_SECRET && BKASH_USERNAME && BKASH_PASSWORD);
}

function config() {
  if (simulatorEnabled()) {
    const base = (process.env.APP_BASE_URL || 'http://localhost:3100').replace(/\/$/, '');
    return { baseUrl: `${base}/api/dev/bkash`, appKey: 'simulator', appSecret: 'simulator', username: 'simulator', password: 'simulator' };
  }
  const baseUrl = process.env.BKASH_BASE_URL;
  const appKey = process.env.BKASH_APP_KEY;
  const appSecret = process.env.BKASH_APP_SECRET;
  const username = process.env.BKASH_USERNAME;
  const password = process.env.BKASH_PASSWORD;
  if (!baseUrl || !appKey || !appSecret || !username || !password) {
    throw new Error(
      'bKash is not configured. Set BKASH_BASE_URL, BKASH_APP_KEY, BKASH_APP_SECRET, ' +
      'BKASH_USERNAME and BKASH_PASSWORD (see .env.example).'
    );
  }
  return { baseUrl: baseUrl.replace(/\/$/, ''), appKey, appSecret, username, password };
}

const g = globalThis;
if (!g.__LEO_BKASH_TOKEN__) g.__LEO_BKASH_TOKEN__ = { token: null, expiresAt: 0, base: null };

export class BkashError extends Error {
  constructor(message, { statusCode, httpStatus } = {}) { super(message); this.statusCode = statusCode; this.httpStatus = httpStatus; }
}

async function bkashFetch(path, { headers = {}, body } = {}) {
  const { baseUrl } = config();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20_000);
  let res;
  try {
    res = await fetch(`${baseUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...headers },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
      cache: 'no-store'
    });
  } catch (e) {
    logger.error('bkash_network_error', { path, message: e.message });
    throw new BkashError(`bKash ${path} unreachable`);
  } finally {
    clearTimeout(timer);
  }
  const data = await res.json().catch(() => null);
  const code = data?.statusCode != null ? String(data.statusCode) : null;
  if (!res.ok || (code && code !== '0000')) {
    // Never log credentials/tokens — only the path and bKash's status fields.
    logger.error('bkash_api_error', { path, httpStatus: res.status, statusCode: code, message: data?.statusMessage || data?.errorMessage });
    throw new BkashError(`bKash ${path} failed: ${data?.statusMessage || data?.errorMessage || res.status}`, { statusCode: code, httpStatus: res.status });
  }
  return data;
}

async function grantToken() {
  const cache = g.__LEO_BKASH_TOKEN__;
  const { appKey, appSecret, username, password, baseUrl } = config();
  if (cache.token && cache.base === baseUrl && Date.now() < cache.expiresAt) return cache.token;
  const data = await bkashFetch(BKASH_PATHS.grantToken, {
    headers: { username, password },
    body: { app_key: appKey, app_secret: appSecret }
  });
  cache.token = data.id_token;
  cache.base = baseUrl;
  cache.expiresAt = Date.now() + (Number(data.expires_in) || 3300) * 1000 - 60_000;
  return cache.token;
}

async function authHeaders() {
  const { appKey } = config();
  return { Authorization: await grantToken(), 'X-App-Key': appKey };
}

// Creates a payment on bKash's side → { paymentID, bkashURL }.
export async function createPayment({ amount, orderId, callbackURL, payerReference }) {
  const data = await bkashFetch(BKASH_PATHS.createPayment, {
    headers: await authHeaders(),
    body: {
      mode: '0011',
      payerReference: payerReference || String(orderId),
      callbackURL,
      amount: Number(amount).toFixed(2),
      currency: 'BDT',
      intent: 'sale',
      merchantInvoiceNumber: `LEO-ORDER-${orderId}`
    }
  });
  if (!data?.paymentID || !data?.bkashURL) throw new BkashError('bKash create returned no paymentID/bkashURL');
  return { paymentID: data.paymentID, bkashURL: data.bkashURL };
}

const shape = (data) => ({
  paymentID: data.paymentID,
  trxID: data.trxID || null,
  transactionStatus: data.transactionStatus, // 'Completed' on success
  amount: data.amount,
  currency: data.currency,
  merchantInvoiceNumber: data.merchantInvoiceNumber || null,
  raw: data
});

// Server-to-server verification: completes the payment the customer
// authorized on bKash's page and returns bKash's own view of it.
export async function executePayment(paymentID) {
  return shape(await bkashFetch(BKASH_PATHS.executePayment, { headers: await authHeaders(), body: { paymentID } }));
}

// Read-only status lookup (reconciliation after an interrupted callback).
export async function queryPayment(paymentID) {
  return shape(await bkashFetch(BKASH_PATHS.queryPayment, { headers: await authHeaders(), body: { paymentID } }));
}
