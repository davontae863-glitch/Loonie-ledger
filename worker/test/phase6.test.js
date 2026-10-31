// Phase 6: failure scenarios. Every test simulates something that will happen in real life.
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, readdirSync } from 'node:fs';
import worker from '../src/index.js';
import { sha256Hex } from '../src/lib/payhip.js';
import { classify } from '../src/lib/support.js';

let db, env;
function d1(db, { failWrites = false } = {}) {
  const stmt = (sql, params = []) => ({
    bind: (...p) => stmt(sql, p),
    run: async () => {
      if (failWrites && /^\s*INSERT OR IGNORE INTO orders/i.test(sql)) throw new Error('D1 unavailable');
      const r = db.prepare(sql).run(...params); return { meta: { changes: Number(r.changes), last_row_id: Number(r.lastInsertRowid) } };
    },
    first: async () => db.prepare(sql).get(...params) ?? null,
    all: async () => ({ results: db.prepare(sql).all(...params) }),
  });
  return { prepare: (sql) => stmt(sql), batch: async (s) => Promise.all(s.map((x) => x.run())) };
}
const TOKEN = 'webhooktoken_abcdefghijklmnop';
beforeEach(() => {
  db = new DatabaseSync(':memory:');
  for (const f of readdirSync(new URL('../migrations/', import.meta.url)).filter((f) => f.endsWith('.sql')).sort()) {
    db.exec(readFileSync(new URL('../migrations/' + f, import.meta.url), 'utf8'));
  }
  env = { DB: d1(db), PAYHIP_API_KEY: 'test-key', WEBHOOK_PATH_TOKEN: TOKEN, OWNER_API_TOKEN: 'o'.repeat(40), OWNER_EMAIL: 'o@x.com', STORE_MODE: 'live', DAILY_CRON: '0 13 * * *' };
});
const hook = (body, e = env) => worker.fetch(new Request(`https://x/api/webhooks/payhip/${TOKEN}`, {
  method: 'POST', headers: { 'content-type': 'application/json' }, body: typeof body === 'string' ? body : JSON.stringify(body) }), e);
const sig = () => sha256Hex('test-key');
const paid = async (id, price, extra = {}) => ({ type: 'paid', id, currency: 'CAD', price, payhip_fee: Math.round(price * 0.05),
  stripe_fee: Math.round(price * 0.029 + 30), date: new Date().toISOString(), signature: await sig(),
  items: [{ product_id: 'p1', product_name: 'Bookkeeping Tracker', quantity: 1 }], ...extra });
const summary = async () => (await worker.fetch(new Request('https://x/api/owner/summary', { headers: { authorization: 'Bearer ' + 'o'.repeat(40) } }), env)).json();
const orderCount = () => db.prepare('SELECT COUNT(*) n FROM orders').get().n;

test('failed or abandoned payment: no "paid" event means nothing is recorded or fulfilled', async () => {
  for (const type of ['payment.failed', 'checkout.abandoned', 'subscription.created']) {
    const r = await (await hook({ ...(await paid('F1', 2400)), type })).json();
    assert.equal(r.ignored, type);
  }
  assert.equal(orderCount(), 0);
  assert.equal((await summary()).gross_revenue_cents, 0);
});

test('forged order with a guessed signature is rejected and logged', async () => {
  const r = await hook({ ...(await paid('X1', 9900)), signature: await sha256Hex('wrong-key') });
  assert.equal(r.status, 401);
  assert.equal(orderCount(), 0);
  assert.equal(db.prepare("SELECT outcome FROM webhook_events").get().outcome, 'rejected');
});

test('malformed payloads: bad JSON 400, no items 500 (Payhip retries), never stored', async () => {
  assert.equal((await hook('{not json')).status, 400);
  assert.equal((await hook({ type: 'paid', id: 'M1', price: 100, signature: await sig(), items: [] })).status, 500);
  assert.equal((await hook({ type: 'paid', price: 100, signature: await sig(), items: [{}] })).status, 500);
  assert.equal(orderCount(), 0);
});

test('database outage: returns 5xx so Payhip retries, then the retry succeeds once', async () => {
  const down = { ...env, DB: d1(db, { failWrites: true }) };
  assert.equal((await hook(await paid('D1', 2400), down)).status, 500);
  assert.equal(orderCount(), 0);
  assert.equal((await hook(await paid('D1', 2400))).status, 200);
  assert.equal((await hook(await paid('D1', 2400))).status, 200); // duplicate retry
  assert.equal(orderCount(), 1);
});

test('partial refund, then full refund, then an over-refund is capped at the sale amount', async () => {
  await hook(await paid('R1', 3900));
  await hook({ ...(await paid('R1', 3900)), type: 'refunded', amount_refunded: 1500 });
  let o = db.prepare("SELECT status, refunded_cents FROM orders WHERE id='R1'").get();
  assert.deepEqual({ ...o }, { status: 'partially_refunded', refunded_cents: 1500 });
  await hook({ ...(await paid('R1', 3900)), type: 'refunded', amount_refunded: 3900 });
  o = db.prepare("SELECT status, refunded_cents FROM orders WHERE id='R1'").get();
  assert.deepEqual({ ...o }, { status: 'refunded', refunded_cents: 3900 });
  await hook({ ...(await paid('R1', 3900)), type: 'refunded', amount_refunded: 99999 });
  assert.equal(db.prepare("SELECT refunded_cents FROM orders WHERE id='R1'").get().refunded_cents, 3900);
  const s = await summary();
  assert.equal(s.refunds_cents, 3900);
  assert.ok(s.contribution_profit_cents < 0, 'a fully refunded sale still cost us the fees');
  const alerts = db.prepare("SELECT COUNT(*) n FROM alerts WHERE dedupe_key LIKE 'refund:R1:%'").get().n;
  assert.equal(alerts, 2, 'one alert per distinct refund amount, none for the capped repeat beyond 3900');
});

test('refund arriving before its sale (out-of-order delivery) is flagged, not invented', async () => {
  const r = await (await hook({ ...(await paid('O1', 2400)), type: 'refunded', amount_refunded: 2400 })).json();
  assert.equal(r.ok, false);
  assert.equal(orderCount(), 0);
  assert.equal(db.prepare("SELECT outcome FROM webhook_events ORDER BY id DESC").get().outcome, 'error');
});

test('test mode: a real-looking purchase before launch never counts as revenue', async () => {
  env.STORE_MODE = 'test';
  await hook(await paid('T1', 3900));
  const s = await summary();
  assert.equal(s.order_count, 0);
  assert.equal(s.test_orders_excluded, 1);
});

test('money never counted as spendable until a payout is recorded', async () => {
  await hook(await paid('C1', 2400));
  let s = await summary();
  assert.equal(s.available_cash_cents, 0);
  assert.equal(s.pending_payouts_cents, 2400 - 120 - 100);
});

test('owner-only actions refuse a missing, wrong or short token', async () => {
  for (const h of [{}, { authorization: 'Bearer wrong' }, { authorization: 'Bearer ' + 'o'.repeat(39) }]) {
    for (const [m, p] of [['GET', '/api/owner/summary'], ['POST', '/api/owner/expenses'], ['POST', '/api/owner/payouts'], ['GET', '/api/owner/tickets']]) {
      const r = await worker.fetch(new Request('https://x' + p, { method: m, headers: h, body: m === 'POST' ? '{}' : undefined }), env);
      assert.equal(r.status, 401, `${m} ${p}`);
    }
  }
});

test('support message matrix: 16 realistic messages sorted and escalated correctly', () => {
  const cases = [
    ['Hi, I paid but never got the download email', 'download', false],
    ['The link in my email says expired', 'download', false],
    ['I bought the bundle twice by accident, can I get a refund?', 'refund', false],
    ['Wrong product, I meant to buy the invoice one. Swap please?', 'refund', false],
    ['I want my money back, I bought this 3 months ago', 'refund', true],
    ['Refund please, I used it all year and didn\'t like it', 'refund', true],
    ['My bank shows a charge I didn\'t authorize', 'dispute', true],
    ['I have filed a chargeback', 'dispute', true],
    ['I will report you to the Better Business Bureau', 'legal', true],
    ['My lawyer will be in touch', 'legal', true],
    ['Please delete my data from your systems', 'privacy', true],
    ['How do I change the province to Quebec?', 'product', false],
    ['Does the tracker work in Excel on Mac?', 'product', false],
    ['What T2125 line do I use for software subscriptions?', 'product', false],
    ['Love the site, any plans for a payroll tool?', 'other', false],
    ['Do you offer a student discount?', 'other', false],
  ];
  for (const [msg, cat, esc] of cases) assert.deepEqual(classify(msg), { category: cat, escalate: esc }, msg);
});
