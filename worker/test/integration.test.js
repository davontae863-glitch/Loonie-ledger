// End-to-end tests of the worker against a real SQLite database (Node's built-in sqlite),
// wrapped to behave like Cloudflare D1. Simulates orders, duplicates, refunds, bad signatures.
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, readdirSync } from 'node:fs';
import worker from '../src/index.js';
import { sha256Hex } from '../src/lib/payhip.js';

function d1(db) {
  const stmt = (sql, params = []) => ({
    bind: (...p) => stmt(sql, p),
    run: async () => { const r = db.prepare(sql).run(...params); return { meta: { changes: Number(r.changes), last_row_id: Number(r.lastInsertRowid) } }; },
    first: async () => db.prepare(sql).get(...params) ?? null,
    all: async () => ({ results: db.prepare(sql).all(...params) }),
  });
  return { prepare: (sql) => stmt(sql), batch: async (stmts) => Promise.all(stmts.map((s) => s.run())) };
}

const TOKEN = 'webhooktoken_abcdefghijklmnop';
const OWNER = 'o'.repeat(40);
let env;

before(() => {
  const db = new DatabaseSync(':memory:');
  for (const f of readdirSync(new URL('../migrations/', import.meta.url)).filter((f) => f.endsWith('.sql')).sort()) {
    db.exec(readFileSync(new URL('../migrations/' + f, import.meta.url), 'utf8'));
  }
  env = { DB: d1(db), PAYHIP_API_KEY: 'test-key', WEBHOOK_PATH_TOKEN: TOKEN, OWNER_API_TOKEN: OWNER,
    OWNER_EMAIL: 'owner@example.com', STORE_MODE: 'live', DAILY_CRON: '0 13 * * *' };
});

const post = async (path, body) => worker.fetch(new Request('https://x' + path, {
  method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }), env);
const owner = async (path, init = {}) => worker.fetch(new Request('https://x' + path, {
  ...init, headers: { authorization: 'Bearer ' + OWNER, 'content-type': 'application/json' } }), env);

const paid = async (id, price, extra = {}) => ({
  type: 'paid', id, email: 'buyer@example.com', currency: 'CAD', price,
  payhip_fee: Math.round(price * 0.05), stripe_fee: Math.round(price * 0.029 + 30),
  date: new Date().toISOString(), signature: await sha256Hex('test-key'),
  items: [{ product_id: 'p1', product_name: 'Bookkeeping Tracker', quantity: 1 }], ...extra,
});

test('rejects wrong path token and bad signature', async () => {
  assert.equal((await post('/api/webhooks/payhip/wrongtoken_abcdefghijk', await paid('T0', 2400))).status, 404);
  assert.equal((await post(`/api/webhooks/payhip/${TOKEN}`, { ...(await paid('T0', 2400)), signature: 'bad' })).status, 401);
});

test('stores a paid order once even if the webhook is retried', async () => {
  const body = await paid('T1', 2400);
  assert.equal((await post(`/api/webhooks/payhip/${TOKEN}`, body)).status, 200);
  const dup = await (await post(`/api/webhooks/payhip/${TOKEN}`, body)).json();
  assert.equal(dup.duplicate, true);
  const s = await (await owner('/api/owner/summary')).json();
  assert.equal(s.order_count, 1);
  assert.equal(s.gross_revenue_cents, 2400);
});

test('refund updates the order and profit', async () => {
  await post(`/api/webhooks/payhip/${TOKEN}`, await paid('T2', 3900));
  const r = await post(`/api/webhooks/payhip/${TOKEN}`, { ...(await paid('T2', 3900)), type: 'refunded', amount_refunded: 3900, date_refunded: new Date().toISOString() });
  assert.equal(r.status, 200);
  const s = await (await owner('/api/owner/summary')).json();
  assert.equal(s.order_count, 2);
  assert.equal(s.refunds_cents, 3900);
  // T1: 2400-120-100 = 2180; T2: 3900-195-143-3900 = -338
  assert.equal(s.contribution_profit_cents, 2180 - 338);
});

test('refund for unknown order is logged, not crashed', async () => {
  const r = await (await post(`/api/webhooks/payhip/${TOKEN}`, { ...(await paid('NOPE', 100)), type: 'refunded', amount_refunded: 100 })).json();
  assert.equal(r.ok, false);
  const h = await (await owner('/api/owner/health')).json();
  assert.ok(h.webhook_errors_24h >= 1);
});

test('available cash only counts real payouts', async () => {
  let s = await (await owner('/api/owner/summary')).json();
  assert.equal(s.available_cash_cents, 0);
  const today = new Date().toISOString().slice(0, 10);
  await owner('/api/owner/payouts', { method: 'POST', body: JSON.stringify({ processor: 'stripe', arrived_on: today, amount_cents: 1500 }) });
  s = await (await owner('/api/owner/summary')).json();
  assert.equal(s.available_cash_cents, 1500);
});

test('owner API requires auth; public health has no business data', async () => {
  const r = await worker.fetch(new Request('https://x/api/owner/summary'), env);
  assert.equal(r.status, 401);
  const h = await (await worker.fetch(new Request('https://x/api/health'), env)).json();
  assert.deepEqual(Object.keys(h).sort(), ['mode', 'ok']);
});

test('test-mode orders are excluded from finances', async () => {
  env.STORE_MODE = 'test';
  await post(`/api/webhooks/payhip/${TOKEN}`, await paid('T3', 9900));
  const s = await (await owner('/api/owner/summary')).json();
  assert.equal(s.test_orders_excluded, 1);
  assert.equal(s.order_count, 2);
  env.STORE_MODE = 'live';
});

test('owner dashboard page is served without data and with a strict CSP', async () => {
  const r = await worker.fetch(new Request('https://x/owner'), env);
  assert.equal(r.status, 200);
  assert.match(r.headers.get('content-security-policy'), /connect-src 'self'/);
  const html = await r.text();
  assert.match(html, /Owner dashboard/);
  assert.doesNotMatch(html, /buyer@example\.com|T1|T2/);
});

test('scheduled jobs log runs', async () => {
  const waits = [];
  await worker.scheduled({ cron: '0 * * * *' }, env, { waitUntil: (p) => waits.push(p) });
  await worker.scheduled({ cron: '0 13 * * *' }, env, { waitUntil: (p) => waits.push(p) });
  await Promise.all(waits);
  const h = await (await owner('/api/owner/health')).json();
  assert.equal(h.last_jobs.length, 2);
  assert.ok(h.last_jobs.every((j) => j.ok === 1));
});
