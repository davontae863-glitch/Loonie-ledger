# Security guide

## Secrets
- All secrets live in Cloudflare (Worker secrets) or GitHub (Actions secrets). None are in the code, chat, or `wrangler.toml`.
- `.dev.vars` (local testing) is git-ignored and holds fake values only.
- Rotate `OWNER_API_TOKEN`, `WEBHOOK_PATH_TOKEN` and the Cloudflare API token every 6 months, or immediately if one may have leaked. Updating the webhook token also means updating the URL in Payhip.
- The Cloudflare API token is scoped to Workers and D1 only.

## Webhooks
- Payhip's signature is a fixed SHA-256 of your API key, so on its own it would let anyone who saw one payload forge others. We add a secret URL token, reject anything failing either check, compare in constant time, and log rejections.
- Duplicate deliveries are ignored (transaction id is the primary key).
- Refunds for unknown orders are logged and flagged, never invented.

## Owner access
- `/api/owner/*` needs Cloudflare Access (email one-time code, only `OWNER_EMAIL`) or the 32+ character owner token.
- Public `/api/health` returns only `ok` and the store mode.

## Customer data
- The database stores order amounts, product names and a one-way hash of the buyer's email — no names, addresses or payment details. Payhip and Stripe hold those.
- Privacy policy (Phase 4) will describe this, in line with PIPEDA.

## Money safety
- No code path can send money, issue refunds, or change payment settings. Refunds happen in Payhip by the owner.
- Expenses can only be recorded by the authenticated owner.
- Test-mode orders never count toward reported profit.

## Backups and monitoring
- Weekly D1 export to a private GitHub Actions artifact (kept 90 days).
- Hourly heartbeat and daily report are logged in `job_runs`; failures show in `/api/owner/health`.

## If something looks wrong
1. Rotate the affected secret.
2. Check `webhook_events` for rejected or error entries.
3. Compare our order totals with Payhip's sales export before trusting any report.
