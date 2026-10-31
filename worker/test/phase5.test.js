// Phase 5: support form, tracked links, alerts, push, reports.
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, readdirSync } from 'node:fs';
import worker, { dailyJobs } from '../src/index.js';
import { classify, draftReply, validateContact } from '../src/lib/support.js';
import { pushPendingAlerts, raiseAlert } from '../src/lib/alerts.js';

let db, env;
function d1(db) {
  const stmt = (sql, params = []) => ({
    bind: (...p) => stmt(sql, p),
    run: async () => { const r = db.prepare(sql).run(...params); return { meta: { changes: Number(r.changes), last_row_id: Number(r.lastInsertRowid) } }; },
    first: async () => db.prepare(sql).get(...params) ?? null,
    all: async () => ({ results: db.prepare(sql).all(...params) }),
  });
  return { prepare: (sql) => stmt(sql), batch: async (s) => Promise.all(s.map((x) => x.run())) };
}
before(() => {
  db = new DatabaseSync(':memory:');
  for (const f of readdirSync(new URL('../migrations/', import.meta.url)).filter((f) => f.endsWith('.sql')).sort()) {
    db.exec(readFileSync(new URL('../migrations/' + f, import.meta.url), 'utf8'));
  }
  env = { DB: d1(db), OWNER_API_TOKEN: 'o'.repeat(40), OWNER_EMAIL: 'o@x.com', STORE_MODE: 'live', DAILY_CRON: '0 13 * * *', WEBHOOK_PATH_TOKEN: 'w'.repeat(30) };
});
const owner = async (path) => (await worker.fetch(new Request('https://x' + path, { headers: { authorization: 'Bearer ' + 'o'.repeat(40) } }), env)).json();
const support = (body, ip = '1.1.1.1') => worker.fetch(new Request('https://x/api/support', {
  method: 'POST', headers: { 'content-type': 'application/json', 'cf-connecting-ip': ip }, body: JSON.stringify(body) }), env);

test('classifier escalates disputes, legal, privacy and out-of-policy refunds', () => {
  assert.deepEqual(classify('I filed a chargeback with my bank'), { category: 'dispute', escalate: true });
  assert.equal(classify('I will contact a lawyer').escalate, true);
  assert.equal(classify('Please delete my data').escalate, true);
  assert.deepEqual(classify('I was charged twice, can I get a refund?'), { category: 'refund', escalate: false });
  assert.equal(classify('I want a refund, I bought it 3 months ago and didn\'t like it').escalate, true);
  assert.equal(classify("I never received the download link").category, 'download');
  assert.equal(draftReply({ category: 'dispute', escalate: true }), null);
  assert.match(draftReply({ category: 'download', name: 'Sam Lee' }), /^Hi Sam,/);
});

test('contact validation: honeypot, bad email, card numbers removed', () => {
  assert.equal(validateContact({ email: 'a@b.ca', message: 'hello there friend', website: 'x' }).spam, true);
  assert.match(validateContact({ email: 'nope', message: 'hello there friend' }).error, /valid email/);
  const v = validateContact({ email: 'A@B.ca', message: 'My card 4111 1111 1111 1111 was charged' });
  assert.equal(v.value.email, 'a@b.ca');
  assert.doesNotMatch(v.value.message, /4111/);
});

test('support form creates a ticket with a draft; escalations raise an urgent alert', async () => {
  assert.equal((await support({ name: 'Sam', email: 'sam@example.com', message: "I didn't receive my download email" })).status, 200);
  assert.equal((await support({ email: 'x@example.com', message: 'I opened a dispute with my bank about this charge' }, '2.2.2.2')).status, 200);
  const { tickets } = await owner('/api/owner/tickets');
  assert.equal(tickets.length, 2);
  assert.equal(tickets[0].escalate, 1);           // escalated first
  assert.equal(tickets[0].draft_reply, null);     // owner writes escalated replies personally
  assert.match(tickets[1].draft_reply, /spam or promotions/);
  const { alerts } = await owner('/api/owner/alerts');
  assert.ok(alerts.some((a) => a.level === 'urgent'));
});

test('support form: spam stored nowhere; rate limited per visitor; form posts redirect', async () => {
  await support({ email: 'b@example.com', message: 'buy cheap stuff now', website: 'http://spam' }, '3.3.3.3');
  assert.equal(db.prepare("SELECT COUNT(*) n FROM support_tickets WHERE customer_email='b@example.com'").get().n, 0);
  for (let i = 0; i < 5; i++) await support({ email: 'c@example.com', message: 'question number ' + i + ' about gst' }, '4.4.4.4');
  assert.equal((await support({ email: 'c@example.com', message: 'one more question about gst' }, '4.4.4.4')).status, 429);
  const r = await worker.fetch(new Request('https://x/api/support', { method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded', 'cf-connecting-ip': '5.5.5.5' },
    body: 'email=d%40example.com&message=How+do+I+pick+my+province%3F' }), env);
  assert.equal(r.status, 303);
  assert.match(r.headers.get('location'), /\/contact\/\?sent=1$/);
});

test('tracked links count clicks and never redirect off-site', async () => {
  const r = await worker.fetch(new Request('https://x/go/pin-gst-01?to=/gst-threshold-checker/'), env);
  assert.equal(r.status, 302);
  assert.equal(r.headers.get('location'), 'https://x/gst-threshold-checker/');
  for (const evil of ['//evil.com', 'https://evil.com', '/a?b=https://evil.com']) {
    const e = await worker.fetch(new Request('https://x/go/pin-gst-01?to=' + encodeURIComponent(evil)), env);
    assert.equal(e.headers.get('location'), 'https://x/');
  }
  const { clicks } = await owner('/api/owner/clicks');
  assert.equal(clicks.find((c) => c.target === '/gst-threshold-checker/').clicks, 1);
});

test('alerts dedupe and push via ntfy only when configured; no customer data in pushes', async () => {
  assert.equal(await raiseAlert(env, { key: 'k1', level: 'warning', title: 'Test alert' }), true);
  assert.equal(await raiseAlert(env, { key: 'k1', level: 'warning', title: 'Test alert' }), false);
  assert.equal(await pushPendingAlerts(env), 0); // no topic set
  const sent = [];
  const fakeFetch = async (url, init) => { sent.push({ url, body: init.body }); return { ok: true }; };
  const n = await pushPendingAlerts({ ...env, NTFY_TOPIC: 'loonie-' + 'z'.repeat(20) }, fakeFetch);
  assert.ok(n >= 1);
  assert.ok(sent.every((s) => s.url.startsWith('https://ntfy.sh/') && !/@/.test(s.body)));
  assert.equal(await pushPendingAlerts({ ...env, NTFY_TOPIC: 'loonie-' + 'z'.repeat(20) }, fakeFetch), 0); // already pushed
});

test('daily jobs write weekly reports on Mondays and monthly on the 1st', async () => {
  await dailyJobs(env, new Date('2026-12-01T13:00:00Z')); // a Tuesday and the 1st
  await dailyJobs(env, new Date('2026-12-07T13:00:00Z')); // a Monday
  const kinds = db.prepare('SELECT kind, period_start FROM reports ORDER BY kind, period_start').all().map((r) => `${r.kind}:${r.period_start}`);
  assert.ok(kinds.includes('daily:2026-11-30'));
  assert.ok(kinds.includes('monthly:2026-11-01'));
  assert.ok(kinds.includes('weekly:2026-11-30'));
  assert.ok(!kinds.some((k) => k.startsWith('weekly:2026-11-24')));
});
