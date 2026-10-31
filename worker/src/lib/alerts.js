// Alerts: stored in D1, shown on the dashboard, optionally pushed to the owner's phone via ntfy.
// ntfy (ntfy.sh) is free and needs no account: the owner installs the app and subscribes to a
// long random topic name, stored as the NTFY_TOPIC secret. No customer data is ever pushed.

export async function raiseAlert(env, { key, level = 'warning', title, detail = null }) {
  const res = await env.DB.prepare(
    'INSERT OR IGNORE INTO alerts (dedupe_key, level, title, detail) VALUES (?, ?, ?, ?)'
  ).bind(key, level, title, detail).run();
  return res.meta.changes === 1;
}

export async function pushPendingAlerts(env, fetchImpl = fetch) {
  const pending = (await env.DB.prepare(
    "SELECT id, level, title FROM alerts WHERE pushed = 0 AND status = 'open' AND level != 'info' ORDER BY id LIMIT 10"
  ).all()).results;
  if (!pending.length) return 0;
  if (!env.NTFY_TOPIC || env.NTFY_TOPIC.length < 20) return 0; // push not set up; dashboard still shows them
  let sent = 0;
  for (const a of pending) {
    try {
      const r = await fetchImpl(`https://ntfy.sh/${encodeURIComponent(env.NTFY_TOPIC)}`, {
        method: 'POST',
        headers: { Title: 'Loonie Ledger', Priority: a.level === 'urgent' ? 'high' : 'default', Tags: a.level === 'urgent' ? 'rotating_light' : 'bell' },
        body: a.title,
      });
      if (r.ok) {
        await env.DB.prepare('UPDATE alerts SET pushed = 1 WHERE id = ?').bind(a.id).run();
        sent++;
      }
    } catch { /* retried on the next run */ }
  }
  return sent;
}

/** Checks run every hour. Each alert has a dedupe key so it fires once per day/event. */
export async function runAlertRules(env, now = new Date()) {
  const day = now.toISOString().slice(0, 10);
  const raised = [];
  const one = async (sql, ...b) => (await env.DB.prepare(sql).bind(...b).first()) || {};

  const wh = await one("SELECT COUNT(*) AS n FROM webhook_events WHERE outcome IN ('error','rejected') AND received_at >= datetime('now','-1 hour')");
  if (wh.n > 0 && await raiseAlert(env, { key: `webhook-errors:${now.toISOString().slice(0, 13)}`, level: 'warning',
    title: `${wh.n} order notification(s) failed in the last hour`, detail: 'Check System health. Compare with Payhip sales before trusting today\'s figures.' })) raised.push('webhook');

  const jobs = await one("SELECT COUNT(*) AS n FROM job_runs WHERE ok = 0 AND ran_at >= datetime('now','-1 day')");
  if (jobs.n > 0 && await raiseAlert(env, { key: `job-failures:${day}`, level: 'warning',
    title: `${jobs.n} background job(s) failed today` })) raised.push('jobs');

  const tickets = await one("SELECT COUNT(*) AS n FROM support_tickets WHERE escalate = 1 AND status = 'open'");
  if (tickets.n > 0 && await raiseAlert(env, { key: `escalated-tickets:${day}`, level: 'urgent',
    title: `${tickets.n} customer message(s) need your personal reply` })) raised.push('tickets');

  const rate = await one(
    "SELECT COUNT(*) AS n, SUM(CASE WHEN refunded_cents > 0 THEN 1 ELSE 0 END) AS r FROM orders WHERE is_test = 0 AND ordered_at >= ?",
    new Date(now.getTime() - 30 * 86400000).toISOString());
  if (rate.n >= 10 && rate.r / rate.n > 0.1 && await raiseAlert(env, { key: `refund-rate:${day.slice(0, 7)}`, level: 'warning',
    title: `Refund rate is ${Math.round((rate.r / rate.n) * 100)}% over the last 30 days`, detail: 'Above the 3% the financial model assumes. Look at which product and why.' })) raised.push('refund-rate');

  return raised;
}
