// Loonie Ledger operations worker (Cloudflare Workers + D1).
// Handles: Payhip webhooks, owner API, health check, scheduled jobs.

import { verifyPayhipSignature, parsePaid, parseRefund, readBody, safeEqual } from './lib/payhip.js';
import { summarize, formatCad } from './lib/money.js';
import { ownerIdentity } from './lib/auth.js';
import { DASHBOARD_HTML } from './dashboard.js';

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
      const existing = await env.DB.prepare('SELECT gross_cents FROM orders WHERE id = ?').bind(r.id).first();
      if (!existing) {
        await logWebhook(env, type, externalId, 'error', 'refund for unknown order');
        // 200 so Payhip doesn't retry forever; flagged for the owner via the health check.
        return json({ ok: false, error: 'unknown order' });
      }
      const status = r.amount_refunded_cents >= existing.gross_cents ? 'refunded' : 'partially_refunded';
      await env.DB.prepare('UPDATE orders SET refunded_cents = ?, status = ? WHERE id = ?')
        .bind(Math.min(r.amount_refunded_cents, existing.gross_cents), status, r.id).run();
      await logWebhook(env, type, externalId, 'stored', status);
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
  } catch (e) {
    report.db = 'error';
  }
  return report;
}

// ---------- Scheduled jobs ----------
async function dailyReport(env) {
  const end = new Date();
  end.setUTCHours(0, 0, 0, 0);
  const start = new Date(end.getTime() - 86400000);
  const summary = await buildSummary(env, start.toISOString(), end.toISOString());
  const date = start.toISOString().slice(0, 10);
  await env.DB.prepare('INSERT OR REPLACE INTO daily_reports (report_date, json) VALUES (?, ?)')
    .bind(date, JSON.stringify(summary)).run();
  return `report ${date}: ${summary.order_count} orders, net ${formatCad(summary.net_operating_profit_cents)}`;
}

async function heartbeat(env) {
  const h = await healthReport(env);
  if (h.db !== 'ok') throw new Error('database unreachable');
  return `db ok, webhook errors 24h: ${h.webhook_errors_24h}`;
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
    const jobs = event.cron === env.DAILY_CRON ? [['daily_report', dailyReport]] : [['heartbeat', heartbeat]];
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
export { buildSummary, healthReport };
