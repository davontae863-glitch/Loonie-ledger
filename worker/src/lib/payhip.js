// Payhip webhook handling.
// Payhip signs each webhook with signature = sha256_hex(API key) (help.payhip.com/article/115-webhooks).
// That value never changes, so we ALSO require a secret token in the webhook URL path
// and treat every event as untrusted until it passes both checks.

import { toCents } from './money.js';

export async function sha256Hex(text) {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Constant-time string comparison. */
export function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const len = Math.max(a.length, b.length);
  let diff = a.length ^ b.length;
  for (let i = 0; i < len; i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}

export async function verifyPayhipSignature(payload, apiKey) {
  if (!apiKey || !payload || typeof payload.signature !== 'string') return false;
  const expected = await sha256Hex(apiKey);
  return safeEqual(payload.signature.toLowerCase(), expected);
}

function toIsoDate(value) {
  if (value === undefined || value === null || value === '') return new Date().toISOString();
  const n = Number(value);
  const d = Number.isFinite(n) ? new Date(n < 1e12 ? n * 1000 : n) : new Date(value);
  if (Number.isNaN(d.getTime())) throw new Error(`Bad date: ${value}`);
  return d.toISOString();
}

/** Turn a Payhip `paid` payload into our order + items. Throws on malformed input. */
export async function parsePaid(payload, { isTest }) {
  if (!payload.id) throw new Error('Missing transaction id');
  const items = Array.isArray(payload.items) ? payload.items : [];
  if (items.length === 0) throw new Error('Order has no items');
  return {
    order: {
      id: String(payload.id),
      source: 'payhip',
      status: 'paid',
      currency: String(payload.currency || 'CAD').toUpperCase(),
      gross_cents: toCents(payload.price),
      payhip_fee_cents: toCents(payload.payhip_fee),
      processor_fee_cents: toCents(payload.stripe_fee),
      // Payhip's docs show only a `vat_applied` flag, not an amount. Recorded as 0 until a real
      // payload confirms the field; reconcile against Payhip's monthly export.
      tax_cents: 0,
      refunded_cents: 0,
      payment_type: payload.payment_type ? String(payload.payment_type) : null,
      customer_email_hash: payload.email ? await sha256Hex(String(payload.email).trim().toLowerCase()) : null,
      is_test: isTest ? 1 : 0,
      ordered_at: toIsoDate(payload.date),
    },
    items: items.map((it) => ({
      payhip_product_id: it.product_id ? String(it.product_id) : null,
      product_name: String(it.product_name || 'Unknown product'),
      quantity: Math.max(1, parseInt(it.quantity || 1, 10)),
    })),
  };
}

export function parseRefund(payload) {
  if (!payload.id) throw new Error('Missing transaction id');
  return {
    id: String(payload.id),
    amount_refunded_cents: toCents(payload.amount_refunded),
    refunded_at: toIsoDate(payload.date_refunded),
  };
}

/** Accept JSON or form-encoded bodies. */
export async function readBody(request) {
  const type = request.headers.get('content-type') || '';
  if (type.includes('application/json')) return request.json();
  if (type.includes('form')) {
    const form = await request.formData();
    const obj = {};
    for (const [k, v] of form.entries()) obj[k] = v;
    if (typeof obj.items === 'string') {
      try { obj.items = JSON.parse(obj.items); } catch { /* leave as is */ }
    }
    return obj;
  }
  const text = await request.text();
  return JSON.parse(text);
}
