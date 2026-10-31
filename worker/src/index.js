// Loonie Ledger operations worker (Cloudflare Workers + D1).
// Handles: Payhip webhooks, owner API, health check, scheduled jobs.

import { verifyPayhipSignature, parsePaid, parseRefund, readBody, safeEqual } from './lib/payhip.js';
import { summarize, formatCad } from './lib/money.js';
import { ownerIdentity } from './lib/auth.js';
import { DASHBOARD_HTML } from './dashboard.js';
import { raiseAlert, runAlertRules, pushPendingAlerts } from './lib/alerts.js';
import { classify, draftReply, validateContact } from './lib/support.js';
import { sha256Hex } from './lib/payhip.js';

const JSON_HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff',
};

const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });

async function logWebhook(env, eventType, externalId, outcome, detail) {
  try {
    await env.DB.prepare(
      'INSERT INTO webhook_events (source, event_type, external_id, outcome, detail) VALUES (?, ?, ?, ?, ?)'
    ).bind('payhip', eventType, externalId, outcome, detail ? String(detail).slice(0, 500) : null).run();
  } catch (e) {
    console.error('webhook log failed', e);
  }
}

async function logJob(env, job, ok, detail) {
  try {
    await env.DB.prepare('INSERT INTO job_runs (job, ok, detail) VALUES (?, ?, ?)')
      .bind(job, ok ? 1 : 0, detail ? String(detail).slice(0, 1000) : null).run();
  } catch (e) {
    console.error('job log failed', e);
  }
}

// ---------- Payhip webhook ----------
async function handlePayhipWebhook(request, env, pathToken) {
  if (!env.WEBHOOK_PATH_TOKEN || !safeEqual(pathToken, env.WEBHOOK_PATH_TOKEN)) {
    // Logged (without the token) so a mistyped webhook address shows up on the dashboard.
    if (!pathToken.startsWith('not-the-real-token')) { // the live smoke test's probe isn't a real problem
      await logWebhook(env, 'unknown', null, 'rejected', env.WEBHOOK_PATH_TOKEN ? 'wrong webhook address' : 'WEBHOOK_PATH_TOKEN secret missing');
    }
    return json({ error: 'not found' }, 404); // don't reveal the endpoint exists
  }
  let payload;
  try {
    payload = await readBody(request);
  } catch {
    await logWebhook(env, 'unknown', null, 'rejected', 'unparseable body');
    return json({ error: 'bad request' }, 400);
  }
  const type = String(payload.type || 'unknown');
  const externalId = payload.id ? String(payload.id) : null;

  if (!(await verifyPayhipSignature(payload, env.PAYHIP_API_KEY))) {
    await logWebhook(env, type, externalId, 'rejected', 'bad signature');
    return json({ error: 'unauthorized' }, 401);
  }

  try {
    if (type === 'paid') {
      const isTest = env.STORE_MODE !== 'live';
      const { order, items } = await parsePaid(payload, { isTest });
      // Idempotent: the Payhip transaction id is the primary key, so a retried webhook can't double-count.
      const res = await env.DB.prepare(
        `INSERT OR IGNORE INTO orders (id, source, status, currency, gross_cents, payhip_fee_cents,
          processor_fee_cents, tax_cents, refunded_cents, payment_type, customer_email_hash, is_test, ordered_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(order.id, order.source, order.status, order.currency, order.gross_cents, order.payhip_fee_cents,
        order.processor_fee_cents, order.tax_cents, order.refunded_cents, order.payment_type,
        order.customer_email_hash, order.is_test, order.ordered_at).run();

      if (res.meta.changes === 0) {
        await logWebhook(env, type, externalId, 'duplicate');
        return json({ ok: true, duplicate: true });
      }
      const stmts = items.map((it) => env.DB.prepare(
        'INSERT OR IGNORE INTO order_items (order_id, payhip_product_id, product_name, quantity) VALUES (?, ?, ?, ?)'
      ).bind(order.id, it.payhip_product_id, it.product_name, it.quantity));
      if (stmts.length) await env.DB.batch(stmts);
      await logWebhook(env, type, externalId, 'stored');
      return json({ ok: true });
    }

    if (type === 'refunded') {
      const r = parseRefund(payload);
      const existing = await env.DB.prepare('SELECT gross_cents, refunded_cents FROM orders WHERE id = ?').bind(r.id).first();
      if (!existing) {
        await logWebhook(env, type, externalId, 'error', 'refund for unknown order');
        // 200 so Payhip doesn't retry forever; flagged for the owner via the health check.
        return json({ ok: false, error: 'unknown order' });
      }
      // Payhip reports the total refunded so far; never record more than the sale amount.
      const refunded = Math.min(Math.max(0, r.amount_refunded_cents), existing.gross_cents);
      if (refunded <= existing.refunded_cents) {
        await logWebhook(env, type, externalId, 'duplicate', 'refund amount unchanged');
        return json({ ok: true, duplicate: true });
      }
      const status = refunded >= existing.gross_cents ? 'refunded' : 'partially_refunded';
      await env.DB.prepare('UPDATE orders SET refunded_cents = ?, status = ? WHERE id = ?').bind(refunded, status, r.id).run();
      await logWebhook(env, type, externalId, 'stored', status);
      await raiseAlert(env, { key: `refund:${r.id}:${refunded}`, level: 'warning',
        title: `Refund recorded: ${formatCad(refunded - existing.refunded_cents)} (order total refunded ${formatCad(refunded)})`, detail: `Order ${r.id}. Note the reason in the experiments log if it points to a product problem.` });
      return json({ ok: true });
    }

    await logWebhook(env, type, externalId, 'ignored');
    return json({ ok: true, ignored: type });
  } catch (e) {
    await logWebhook(env, type, externalId, 'error', e.message);
    return json({ error: 'processing failed' }, 500); // 5xx lets Payhip retry
  }
}

// ---------- Financial summary from real records ----------
async function buildSummary(env, from, to) {
  const orders = (await env.DB.prepare(
    'SELECT * FROM orders WHERE ordered_at >= ? AND ordered_at < ?'
  ).bind(from, to).all()).results;
  const payouts = (await env.DB.prepare(
    'SELECT amount_cents FROM payouts WHERE arrived_on >= ? AND arrived_on < ?'
  ).bind(from.slice(0, 10), to.slice(0, 10)).all()).results;
  const expenses = (await env.DB.prepare(
    'SELECT amount_cents FROM expenses WHERE paid_on >= ? AND paid_on < ?'
  ).bind(from.slice(0, 10), to.slice(0, 10)).all()).results;
  return { from, to, ...summarize({ orders, payouts, expenses }) };
}

function rangeFromQuery(url) {
  const now = new Date();
  const from = url.searchParams.get('from') || new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
  const to = url.searchParams.get('to') || new Date(now.getTime() + 86400000).toISOString();
  return { from, to };
}

// ---------- Owner API ----------
async function handleOwner(request, env, url, owner) {
  const path = url.pathname.replace(/^\/api\/owner/, '');

  if (request.method === 'GET' && path === '/summary') {
    const { from, to } = rangeFromQuery(url);
    return json(await buildSummary(env, from, to));
  }

  if (request.method === 'GET' && path === '/approvals') {
    const rows = (await env.DB.prepare(
      "SELECT * FROM approvals WHERE status = 'pending' ORDER BY created_at"
    ).all()).results;
    return json({ approvals: rows });
  }

  const m = path.match(/^\/approvals\/(\d+)$/);
  if (request.method === 'POST' && m) {
    const body = await request.json();
    if (!['approved', 'rejected'].includes(body.status)) return json({ error: 'status must be approved or rejected' }, 400);
    const res = await env.DB.prepare(
      "UPDATE approvals SET status = ?, decided_by = ?, decided_at = datetime('now') WHERE id = ? AND status = 'pending'"
    ).bind(body.status, owner, Number(m[1])).run();
    return json({ ok: res.meta.changes === 1 });
  }

  if (request.method === 'POST' && path === '/payouts') {
    const b = await request.json();
    const cents = Number(b.amount_cents);
    if (!Number.isInteger(cents) || cents <= 0 || !b.arrived_on || !b.processor) {
      return json({ error: 'need processor, arrived_on (YYYY-MM-DD), amount_cents (integer)' }, 400);
    }
    await env.DB.prepare('INSERT INTO payouts (processor, amount_cents, arrived_on, reference) VALUES (?, ?, ?, ?)')
      .bind(String(b.processor), cents, String(b.arrived_on), b.reference ? String(b.reference) : null).run();
    return json({ ok: true });
  }

  if (request.method === 'POST' && path === '/expenses') {
    const b = await request.json();
    const cents = Number(b.amount_cents);
    if (!Number.isInteger(cents) || cents <= 0 || !b.paid_on || !b.category || !b.description) {
      return json({ error: 'need category, description, paid_on, amount_cents (integer)' }, 400);
    }
    // Recorded as approved by the authenticated owner; the AI never records spending on its own.
    await env.DB.prepare('INSERT INTO expenses (category, description, amount_cents, paid_on, approved_by) VALUES (?, ?, ?, ?, ?)')
      .bind(String(b.category), String(b.description), cents, String(b.paid_on), owner).run();
    return json({ ok: true });
  }

  if (request.method === 'GET' && path === '/alerts') {
    const rows = (await env.DB.prepare(
      "SELECT id, level, title, detail, created_at FROM alerts WHERE status = 'open' ORDER BY CASE level WHEN 'urgent' THEN 0 WHEN 'warning' THEN 1 ELSE 2 END, id DESC LIMIT 50"
    ).all()).results;
    return json({ alerts: rows });
  }
  const da = path.match(/^\/alerts\/(\d+)\/dismiss$/);
  if (request.method === 'POST' && da) {
    await env.DB.prepare("UPDATE alerts SET status = 'dismissed' WHERE id = ?").bind(Number(da[1])).run();
    return json({ ok: true });
  }

  if (request.method === 'GET' && path === '/tickets') {
    const rows = (await env.DB.prepare(
      "SELECT id, category, escalate, status, summary, customer_name, customer_email, message, draft_reply, created_at FROM support_tickets WHERE status != 'closed' ORDER BY escalate DESC, id DESC LIMIT 50"
    ).all()).results;
    return json({ tickets: rows });
  }
  const tk = path.match(/^\/tickets\/(\d+)$/);
  if (request.method === 'POST' && tk) {
    const b = await request.json();
    if (!['open', 'waiting', 'closed'].includes(b.status)) return json({ error: 'status must be open, waiting or closed' }, 400);
    await env.DB.prepare("UPDATE support_tickets SET status = ?, closed_at = CASE WHEN ? = 'closed' THEN datetime('now') ELSE NULL END WHERE id = ?")
      .bind(b.status, b.status, Number(tk[1])).run();
    return json({ ok: true });
  }

  if (request.method === 'GET' && path === '/reports') {
    const kind = ['daily', 'weekly', 'monthly'].includes(url.searchParams.get('kind')) ? url.searchParams.get('kind') : 'daily';
    const rows = (await env.DB.prepare('SELECT kind, period_start, period_end, json FROM reports WHERE kind = ? ORDER BY period_start DESC LIMIT 12')
      .bind(kind).all()).results.map((r) => ({ ...r, json: JSON.parse(r.json) }));
    return json({ reports: rows });
  }

  if (request.method === 'GET' && path === '/clicks') {
    const rows = (await env.DB.prepare(
      "SELECT campaign, target, COUNT(*) AS clicks FROM link_clicks WHERE clicked_on >= date('now','-30 days') AND campaign NOT LIKE 'ci-%' GROUP BY campaign, target ORDER BY clicks DESC LIMIT 50"
    ).all()).results;
    return json({ clicks: rows });
  }

  if (request.method === 'GET' && path === '/health') {
    return json(await healthReport(env));
  }

  return json({ error: 'not found' }, 404);
}

// ---------- Health ----------
async function healthReport(env) {
  const report = { db: 'unknown', mode: env.STORE_MODE || 'test', last_jobs: [], webhook_errors_24h: 0 };
  try {
    await env.DB.prepare('SELECT 1').first();
    report.db = 'ok';
    report.last_jobs = (await env.DB.prepare(
      'SELECT job, ok, ran_at FROM job_runs ORDER BY id DESC LIMIT 5'
    ).all()).results;
    const errs = await env.DB.prepare(
      "SELECT COUNT(*) AS n FROM webhook_events WHERE outcome IN ('error','rejected') AND received_at >= datetime('now','-1 day')"
    ).first();
    report.webhook_errors_24h = errs ? errs.n : 0;
    report.last_webhook = await env.DB.prepare('SELECT event_type, outcome, detail, received_at FROM webhook_events ORDER BY id DESC LIMIT 1').first();
    report.secrets = { payhip_api_key: !!env.PAYHIP_API_KEY, webhook_path_token: !!env.WEBHOOK_PATH_TOKEN, owner_api_token: !!env.OWNER_API_TOKEN };
  } catch (e) {
    report.db = 'error';
  }
  return report;
}

// ---------- Scheduled jobs ----------
const DAY = 86400000;

async function saveReport(env, kind, start, end) {
  const summary = await buildSummary(env, start.toISOString(), end.toISOString());
  await env.DB.prepare('INSERT OR REPLACE INTO reports (kind, period_start, period_end, json) VALUES (?, ?, ?, ?)')
    .bind(kind, start.toISOString().slice(0, 10), end.toISOString().slice(0, 10), JSON.stringify(summary)).run();
  return `${kind} ${start.toISOString().slice(0, 10)}: ${summary.order_count} orders, net ${formatCad(summary.net_operating_profit_cents)}`;
}

/** Daily at 13:00 UTC: yesterday's report; Mondays also last week's; the 1st also last month's; then cleanup. */
async function dailyJobs(env, now = new Date()) {
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const out = [await saveReport(env, 'daily', new Date(today.getTime() - DAY), today)];
  if (today.getUTCDay() === 1) out.push(await saveReport(env, 'weekly', new Date(today.getTime() - 7 * DAY), today));
  if (today.getUTCDate() === 1) out.push(await saveReport(env, 'monthly', new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 1, 1)), today));
  // Retention: closed support tickets after 12 months, raw webhook logs after 6 months, click logs after ~13 months.
  await env.DB.batch([
    env.DB.prepare("DELETE FROM support_tickets WHERE status = 'closed' AND closed_at < datetime('now','-365 days')"),
    env.DB.prepare("DELETE FROM webhook_events WHERE received_at < datetime('now','-180 days')"),
    env.DB.prepare("DELETE FROM link_clicks WHERE clicked_on < date('now','-400 days')"),
    env.DB.prepare("DELETE FROM job_runs WHERE ran_at < datetime('now','-90 days')"),
  ]);
  return out.join('; ');
}

async function hourlyJobs(env) {
  const h = await healthReport(env);
  if (h.db !== 'ok') throw new Error('database unreachable');
  const raised = await runAlertRules(env);
  const pushed = await pushPendingAlerts(env);
  return `db ok; alerts raised: ${raised.join(',') || 'none'}; pushed: ${pushed}`;
}

// ---------- Customer support form ----------
async function handleSupport(request, env) {
  const isForm = (request.headers.get('content-type') || '').includes('form');
  const reply = (ok, message, status = 200) => isForm
    ? Response.redirect(new URL(ok ? '/contact/?sent=1' : `/contact/?error=${encodeURIComponent(message)}`, request.url).toString(), 303)
    : json(ok ? { ok: true } : { error: message }, status);

  let input;
  try { input = await readBody(request); } catch { return reply(false, 'Something went wrong reading your message. Please try again.', 400); }
  const v = validateContact(input);
  if (v.spam) return reply(true); // look successful to bots, store nothing
  if (!v.ok) return reply(false, v.error, 400);

  const ip = request.headers.get('cf-connecting-ip') || 'unknown';
  const ipHash = await sha256Hex(`${ip}:${env.WEBHOOK_PATH_TOKEN || 'salt'}`);
  const recent = await env.DB.prepare("SELECT COUNT(*) AS n FROM support_tickets WHERE ip_hash = ? AND created_at >= datetime('now','-1 hour')").bind(ipHash).first();
  if (recent && recent.n >= 5) return reply(false, 'You\'ve sent several messages in the last hour. We\'ll reply to those first.', 429);

  const { name, email, message, orderEmail } = v.value;
  const { category, escalate } = classify(message);
  const draft = draftReply({ category, name, escalate });
  const summary = message.replace(/\s+/g, ' ').slice(0, 120);
  const res = await env.DB.prepare(
    `INSERT INTO support_tickets (category, escalate, status, summary, customer_name, customer_email, message, draft_reply, ip_hash, order_id)
     VALUES (?, ?, 'open', ?, ?, ?, ?, ?, ?, ?)`
  ).bind(category, escalate ? 1 : 0, summary, name || null, email, message, draft, ipHash, orderEmail ? `email:${orderEmail}` : null).run();
  await raiseAlert(env, {
    key: `ticket:${res.meta.last_row_id ?? summary}`, level: escalate ? 'urgent' : 'info',
    title: escalate ? `Customer message needs your personal reply (${category})` : `New customer message (${category})`,
  });
  return reply(true);
}

// ---------- Tracked marketing links ----------
async function handleGo(request, env, url, campaign) {
  const to = url.searchParams.get('to') || '/';
  // Internal paths only, so this can never be used to redirect people to other sites.
  const safe = /^\/[A-Za-z0-9/_-]*$/.test(to) && !to.startsWith('//') ? to : '/';
  await env.DB.prepare('INSERT INTO link_clicks (campaign, target) VALUES (?, ?)').bind(campaign, safe).run();
  return Response.redirect(new URL(safe, request.url).toString(), 302);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    try {
      if (url.pathname === '/owner' || url.pathname === '/owner/') {
        return new Response(DASHBOARD_HTML, { headers: {
          'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'x-frame-options': 'DENY',
          'x-content-type-options': 'nosniff', 'referrer-policy': 'no-referrer',
          'content-security-policy': "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; form-action 'none'; frame-ancestors 'none'",
        } });
      }
      if (url.pathname === '/api/health') {
        const h = await healthReport(env);
        return json({ ok: h.db === 'ok', mode: h.mode }); // public: no business data
      }
      if (url.pathname === '/api/support' && request.method === 'POST') return handleSupport(request, env);
      const go = url.pathname.match(/^\/go\/([a-z0-9-]{2,60})$/);
      if (go && request.method === 'GET') return handleGo(request, env, url, go[1]);
      const wh = url.pathname.match(/^\/api\/webhooks\/payhip\/([A-Za-z0-9_-]{16,128})$/);
      if (wh && request.method === 'POST') return handlePayhipWebhook(request, env, wh[1]);

      if (url.pathname.startsWith('/api/owner/')) {
        const owner = ownerIdentity(request, env);
        if (!owner) return json({ error: 'unauthorized' }, 401);
        return handleOwner(request, env, url, owner);
      }
      // Everything else is the storefront (static files built from /site).
      if (!url.pathname.startsWith('/api/') && env.ASSETS) return env.ASSETS.fetch(request);
      return json({ error: 'not found' }, 404);
    } catch (e) {
      console.error('unhandled', e);
      return json({ error: 'server error' }, 500);
    }
  },

  async scheduled(event, env, ctx) {
    const jobs = event.cron === env.DAILY_CRON ? [['daily_jobs', dailyJobs]] : [['hourly_jobs', hourlyJobs]];
    for (const [name, fn] of jobs) {
      ctx.waitUntil((async () => {
        try {
          await logJob(env, name, true, await fn(env));
        } catch (e) {
          await logJob(env, name, false, e.message);
        }
      })());
    }
  },
};

// Exported for tests.
export { buildSummary, healthReport, dailyJobs };
