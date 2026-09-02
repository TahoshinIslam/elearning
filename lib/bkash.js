// ============================================================
// bKash Tokenized Checkout adapter (server-only).
//
// IMPORTANT — verify against your actual bKash PGW merchant documentation
// before going live. bKash issues the exact endpoint paths and field names
// per merchant onboarding, and they have changed across API versions; the
// paths below match the commonly published Tokenized Checkout (Checkout URL)
// v1.2.0-beta contract, but this file was written without live sandbox
// access to bKash's servers. Treat BKASH_PATHS below as the one place to
// correct if your merchant docs differ — nothing else in the app needs to
// change.
//
// Trust model: unlike a signed-webhook gateway (e.g. Stripe), bKash's
// checkout flow verifies a payment by the MERCHANT SERVER calling back into
// bKash's API with merchant credentials (grantToken → executePayment) rather
// than bKash calling out to us with a signature. That server-to-server call
// is the actual verification step — see finalizeBkashCallback() in
// lib/orderRepo.js, which never trusts the redirect query params alone.
// ============================================================

import { logger } from '@/lib/logger';

const BKASH_PATHS = {
  grantToken: '/tokenized/checkout/token/grant',
  refreshToken: '/tokenized/checkout/token/refresh',
  createPayment: '/tokenized/checkout/create',
  executePayment: '/tokenized/checkout/execute',
  queryPayment: '/tokenized/checkout/payment/status'
};

function config() {
  const baseUrl = process.env.BKASH_BASE_URL;
  const appKey = process.env.BKASH_APP_KEY;
  const appSecret = process.env.BKASH_APP_SECRET;
  const username = process.env.BKASH_USERNAME;
  const password = process.env.BKASH_PASSWORD;
  if (!baseUrl || !appKey || !appSecret || !username || !password) {
    throw new Error(
      'bKash is not configured. Set BKASH_BASE_URL, BKASH_APP_KEY, BKASH_APP_SECRET, ' +
      'BKASH_USERNAME and BKASH_PASSWORD (see .env.example) — these come from your bKash ' +
      'merchant onboarding, sandbox or live.'
    );
  }
  return { baseUrl, appKey, appSecret, username, password };
}

// Token cache — a grant is valid for a while; avoid re-granting on every call.
const g = globalThis;
if (!g.__LEO_BKASH_TOKEN__) g.__LEO_BKASH_TOKEN__ = { token: null, expiresAt: 0 };

async function bkashFetch(path, { method = 'POST', headers = {}, body } = {}) {
  const { baseUrl } = config();
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...headers },
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || data?.statusCode > 0) {
    logger.error('bkash_api_error', { path, httpStatus: res.status, statusCode: data?.statusCode, message: data?.statusMessage });
    throw new Error(`bKash ${path} failed: ${data?.statusMessage || res.status}`);
  }
  return data;
}

async function grantToken() {
  const cache = g.__LEO_BKASH_TOKEN__;
  if (cache.token && Date.now() < cache.expiresAt) return cache.token;

  const { appKey, appSecret, username, password } = config();
  const data = await bkashFetch(BKASH_PATHS.grantToken, {
    headers: { username, password },
    body: { app_key: appKey, app_secret: appSecret }
  });
  cache.token = data.id_token;
  // Refresh a little before actual expiry to avoid a request racing an expired token.
  cache.expiresAt = Date.now() + (Number(data.expires_in) || 3300) * 1000 - 60_000;
  return cache.token;
}

// Creates a payment on bKash's side and returns the URL to redirect the
// browser to. `merchantInvoiceNumber` should be this app's order id.
export async function createPayment({ amount, orderId, callbackURL, payerReference }) {
  const { appKey } = config();
  const token = await grantToken();
  const data = await bkashFetch(BKASH_PATHS.createPayment, {
    headers: { Authorization: token, 'X-App-Key': appKey },
    body: {
      mode: '0011',
      payerReference: payerReference || String(orderId),
      callbackURL,
      amount: String(amount),
      currency: 'BDT',
      intent: 'sale',
      merchantInvoiceNumber: `LEO-ORDER-${orderId}`
    }
  });
  return { paymentID: data.paymentID, bkashURL: data.bkashURL };
}

// The real verification step: ask bKash directly whether this paymentID
// actually completed, rather than trusting the callback's query params.
export async function executePayment(paymentID) {
  const { appKey } = config();
  const token = await grantToken();
  const data = await bkashFetch(`${BKASH_PATHS.executePayment}/${encodeURIComponent(paymentID)}`, {
    headers: { Authorization: token, 'X-App-Key': appKey }
  });
  return {
    paymentID: data.paymentID,
    trxID: data.trxID,
    transactionStatus: data.transactionStatus, // expected 'Completed' on success
    amount: data.amount,
    currency: data.currency,
    raw: data
  };
}

export async function queryPayment(paymentID) {
  const { appKey } = config();
  const token = await grantToken();
  return bkashFetch(`${BKASH_PATHS.queryPayment}/${encodeURIComponent(paymentID)}`, {
    method: 'GET',
    headers: { Authorization: token, 'X-App-Key': appKey }
  });
}
