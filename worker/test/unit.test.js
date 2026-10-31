import { test } from 'node:test';
import assert from 'node:assert/strict';
import { summarize, orderContribution, toCents, formatCad } from '../src/lib/money.js';
import { sha256Hex, verifyPayhipSignature, parsePaid, parseRefund, safeEqual } from '../src/lib/payhip.js';
import { ownerIdentity } from '../src/lib/auth.js';

test('cents and formatting', () => {
  assert.equal(toCents('2400'), 2400);
  assert.equal(toCents(null), 0);
  assert.throws(() => toCents('abc'));
  assert.equal(formatCad(123456), '$1,234.56');
  assert.equal(formatCad(-5), '-$0.05');
});

test('order contribution matches the financial model', () => {
  // $24 bookkeeping tracker: Payhip 5% = 120, Stripe 2.9% + 30 = 99.6 -> 100
  const c = orderContribution({ gross_cents: 2400, payhip_fee_cents: 120, processor_fee_cents: 100, refunded_cents: 0 });
  assert.equal(c, 2180);
});

test('summary separates pending payouts from available cash and excludes test orders', () => {
  const orders = [
    { gross_cents: 2400, payhip_fee_cents: 120, processor_fee_cents: 100, refunded_cents: 0, is_test: 0, status: 'paid' },
    { gross_cents: 3900, payhip_fee_cents: 195, processor_fee_cents: 143, refunded_cents: 3900, is_test: 0, status: 'refunded' },
    { gross_cents: 9999, payhip_fee_cents: 0, processor_fee_cents: 0, refunded_cents: 0, is_test: 1, status: 'paid' },
  ];
  const s = summarize({ orders, payouts: [{ amount_cents: 1000 }], expenses: [{ amount_cents: 300 }] });
  assert.equal(s.order_count, 2);
  assert.equal(s.test_orders_excluded, 1);
  assert.equal(s.gross_revenue_cents, 6300);
  assert.equal(s.contribution_profit_cents, 6300 - 315 - 243 - 3900);
  assert.equal(s.net_operating_profit_cents, s.contribution_profit_cents - 300);
  assert.equal(s.available_cash_cents, 700);
  assert.equal(s.pending_payouts_cents, s.contribution_profit_cents - 1000);
});

test('signature verification', async () => {
  const key = 'abc123';
  const sig = await sha256Hex(key);
  assert.equal(await verifyPayhipSignature({ signature: sig }, key), true);
  assert.equal(await verifyPayhipSignature({ signature: sig.toUpperCase() }, key), true);
  assert.equal(await verifyPayhipSignature({ signature: 'nope' }, key), false);
  assert.equal(await verifyPayhipSignature({}, key), false);
  assert.equal(await verifyPayhipSignature({ signature: sig }, ''), false);
  assert.equal(safeEqual('a', 'ab'), false);
});

test('parse paid and refund payloads', async () => {
  const { order, items } = await parsePaid({
    id: 'TX1', email: 'Buyer@Example.com ', currency: 'cad', price: 2400, payhip_fee: 120, stripe_fee: 100,
    date: 1764000000, items: [{ product_id: 'p1', product_name: 'Tracker', quantity: '1' }],
  }, { isTest: true });
  assert.equal(order.currency, 'CAD');
  assert.equal(order.is_test, 1);
  assert.equal(order.customer_email_hash, await sha256Hex('buyer@example.com'));
  assert.ok(!('email' in order), 'raw email must not be stored');
  assert.equal(items[0].quantity, 1);
  await assert.rejects(parsePaid({ id: 'X', items: [] }, { isTest: false }));
  assert.equal(parseRefund({ id: 'TX1', amount_refunded: 2400, date_refunded: 1764000100 }).amount_refunded_cents, 2400);
});

test('owner auth', () => {
  const env = { OWNER_EMAIL: 'Owner@x.com', OWNER_API_TOKEN: 'x'.repeat(40) };
  const req = (h) => new Request('https://a/api/owner/summary', { headers: h });
  assert.equal(ownerIdentity(req({ authorization: 'Bearer ' + 'x'.repeat(40) }), env), 'owner@x.com');
  assert.equal(ownerIdentity(req({ authorization: 'Bearer wrong' }), env), null);
  assert.equal(ownerIdentity(req({ 'cf-access-authenticated-user-email': 'owner@x.com' }), env), 'owner@x.com');
  assert.equal(ownerIdentity(req({ 'cf-access-authenticated-user-email': 'evil@x.com' }), env), null);
  assert.equal(ownerIdentity(req({ authorization: 'Bearer short' }), { OWNER_API_TOKEN: 'short' }), null);
});
