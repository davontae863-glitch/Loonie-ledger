-- Phase 5: reports, alerts, support tickets with contact details, marketing click tracking.

CREATE TABLE IF NOT EXISTS reports (
  kind          TEXT NOT NULL CHECK (kind IN ('daily','weekly','monthly')),
  period_start  TEXT NOT NULL,
  period_end    TEXT NOT NULL,
  json          TEXT NOT NULL,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (kind, period_start)
);

CREATE TABLE IF NOT EXISTS alerts (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  dedupe_key    TEXT UNIQUE,                -- prevents the same alert firing twice
  level         TEXT NOT NULL CHECK (level IN ('info','warning','urgent')),
  title         TEXT NOT NULL,
  detail        TEXT,
  status        TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','dismissed')),
  pushed        INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Support tickets now hold what's needed to reply. Deleted 12 months after closing.
ALTER TABLE support_tickets ADD COLUMN customer_name TEXT;
ALTER TABLE support_tickets ADD COLUMN customer_email TEXT;
ALTER TABLE support_tickets ADD COLUMN message TEXT;
ALTER TABLE support_tickets ADD COLUMN draft_reply TEXT;
ALTER TABLE support_tickets ADD COLUMN closed_at TEXT;
ALTER TABLE support_tickets ADD COLUMN ip_hash TEXT;

CREATE TABLE IF NOT EXISTS link_clicks (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  campaign      TEXT NOT NULL,
  target        TEXT NOT NULL,
  clicked_on    TEXT NOT NULL DEFAULT (date('now'))
);
CREATE INDEX IF NOT EXISTS idx_clicks_campaign ON link_clicks(campaign, clicked_on);
