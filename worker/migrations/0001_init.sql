-- Loonie Ledger core schema (Cloudflare D1 / SQLite)
-- All money is stored as integer cents (CAD unless noted) to avoid rounding errors.

CREATE TABLE IF NOT EXISTS products (
  id            TEXT PRIMARY KEY,          -- our slug, e.g. 'bookkeeping-tracker'
  payhip_id     TEXT UNIQUE,               -- Payhip product_id / permalink key
  name          TEXT NOT NULL,
  price_cents   INTEGER NOT NULL CHECK (price_cents >= 0),
  production_cost_cents INTEGER NOT NULL DEFAULT 0,
  status        TEXT NOT NULL DEFAULT 'draft'
                CHECK (status IN ('draft','testing','pending_approval','live','retired')),
  approved_by   TEXT,                      -- owner email that approved going live
  approved_at   TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS orders (
  id              TEXT PRIMARY KEY,        -- Payhip transaction id (idempotency key)
  source          TEXT NOT NULL DEFAULT 'payhip',
  status          TEXT NOT NULL CHECK (status IN ('paid','partially_refunded','refunded','disputed')),
  currency        TEXT NOT NULL,
  gross_cents     INTEGER NOT NULL,
  payhip_fee_cents INTEGER NOT NULL DEFAULT 0,
  processor_fee_cents INTEGER NOT NULL DEFAULT 0,
  tax_cents       INTEGER NOT NULL DEFAULT 0,  -- VAT/GST collected by platform, not our revenue
  refunded_cents  INTEGER NOT NULL DEFAULT 0,
  payment_type    TEXT,
  customer_email_hash TEXT,                -- SHA-256 of lowercased email; raw email stays in Payhip
  is_test         INTEGER NOT NULL DEFAULT 0,
  ordered_at      TEXT NOT NULL,
  received_at     TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_orders_ordered_at ON orders(ordered_at);

CREATE TABLE IF NOT EXISTS order_items (
  order_id      TEXT NOT NULL REFERENCES orders(id),
  payhip_product_id TEXT,
  product_name  TEXT NOT NULL,
  quantity      INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (order_id, payhip_product_id, product_name)
);

-- Cash actually paid out to the bank (entered from bank/processor statements).
CREATE TABLE IF NOT EXISTS payouts (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  processor     TEXT NOT NULL,             -- 'stripe' | 'paypal'
  amount_cents  INTEGER NOT NULL,
  arrived_on    TEXT NOT NULL,             -- date funds reached the bank
  reference     TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS expenses (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  category      TEXT NOT NULL,             -- e.g. 'domain', 'software', 'marketing'
  description   TEXT NOT NULL,
  amount_cents  INTEGER NOT NULL,
  paid_on       TEXT NOT NULL,
  approved_by   TEXT NOT NULL,             -- every expense needs owner approval
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Requests that need the owner's approval (Level 2 actions).
CREATE TABLE IF NOT EXISTS approvals (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  kind          TEXT NOT NULL,             -- 'publish_product','refund','expense','policy_change',...
  summary       TEXT NOT NULL,
  payload_json  TEXT,
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  decided_by    TEXT,
  decided_at    TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Business decision history (required by the brief).
CREATE TABLE IF NOT EXISTS decisions (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  decided_on    TEXT NOT NULL,
  decision      TEXT NOT NULL,
  reason        TEXT NOT NULL,
  decided_by    TEXT NOT NULL
);

-- Experiments, including failed ones, so nothing is blindly repeated.
CREATE TABLE IF NOT EXISTS experiments (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  what_tested   TEXT NOT NULL,
  why           TEXT NOT NULL,
  started_on    TEXT NOT NULL,
  ended_on      TEXT,
  result        TEXT,
  likely_cause  TEXT,
  change_next   TEXT,
  outcome       TEXT CHECK (outcome IN ('running','succeeded','failed','inconclusive')) DEFAULT 'running'
);

CREATE TABLE IF NOT EXISTS content_posts (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  channel       TEXT NOT NULL,             -- 'pinterest','tiktok','instagram','youtube','blog'
  title         TEXT NOT NULL,
  url           TEXT,
  utm_campaign  TEXT,
  status        TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','scheduled','posted')),
  posted_at     TEXT,
  clicks        INTEGER DEFAULT 0,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS support_tickets (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id      TEXT,
  category      TEXT NOT NULL,             -- 'download','refund','product','dispute','legal','other'
  escalate      INTEGER NOT NULL DEFAULT 0,
  status        TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','waiting','closed')),
  summary       TEXT NOT NULL,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Raw webhook log for audit / replay (PII-minimised).
CREATE TABLE IF NOT EXISTS webhook_events (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  source        TEXT NOT NULL,
  event_type    TEXT NOT NULL,
  external_id   TEXT,
  outcome       TEXT NOT NULL,             -- 'stored','duplicate','rejected','error'
  detail        TEXT,
  received_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

-- System health / job runs.
CREATE TABLE IF NOT EXISTS job_runs (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  job           TEXT NOT NULL,
  ok            INTEGER NOT NULL,
  detail        TEXT,
  ran_at        TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Daily financial snapshots written by the cron job.
CREATE TABLE IF NOT EXISTS daily_reports (
  report_date   TEXT PRIMARY KEY,
  json          TEXT NOT NULL,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
