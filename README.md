# Loonie Ledger

Spreadsheet tools for Canadians, sold online with as little manual work as possible.
This repository holds the store, the operations worker (orders, finances, health), and every guide.

**Status:** LIVE since 2026-10-31. https://shop.loonieledger.workers.dev — Bookkeeping & GST/HST Tracker and Invoice Generator on sale; Room Tracker, Household Budget and Complete Bundle built and waiting for owner approval.

## How it fits together

```
Customer ──> Storefront (static pages from /site, served by the worker) ──> Payhip checkout (payment + file delivery)
                                                          │
                                                          │ webhook: paid / refunded
                                                          ▼
                                   Ops worker (Cloudflare Worker, /worker) ──> D1 database
                                    │  • records orders once (idempotent)
                                    │  • hourly health check, daily financial report (cron)
                                    ▼
                         Owner dashboard at /owner + owner API — protected by Cloudflare Access or a token
GitHub Actions: runs tests and deploys on every push to main; weekly database backup.
```

| Piece | Service | Cost | Free-tier limit that matters |
|---|---|---|---|
| Storefront | Cloudflare Workers static assets | $0 | Static asset requests are free and unlimited |
| Checkout, delivery, receipts | Payhip Free | 5% per sale + Stripe fees | — |
| Ops worker + cron | Cloudflare Workers Free | $0 | 100k requests/day, 10 ms CPU per run, 5 cron triggers |
| Database | Cloudflare D1 Free | $0 | 5 GB, 5M rows read/day, 100k rows written/day |
| Code, CI, backups | GitHub Free | $0 | Actions minutes on private repos are limited but ample for this |

Why D1 instead of Supabase: Supabase's free tier pauses after 7 days of low activity; D1 doesn't pause.

## Folders

- `site/` — storefront: `src/products.json` (catalog), `src/site.json` (settings), `build.mjs` builds `dist/`
- `worker/` — operations worker, database migrations, tests
- `docs/` — architecture, deployment, security, accounts, decision log
- `.github/workflows/` — test + deploy, weekly backup

## Run the tests

```
cd worker
npm test
```

34 worker tests cover signature checks, duplicate webhooks, refunds, test-mode exclusion, owner auth,
the cash-vs-pending split, and the scheduled jobs. They use Node's built-in SQLite, so no accounts are needed.

## Rules built into the code

- Money is stored as integer cents; tax collected for governments is not counted as revenue.
- Orders are keyed by Payhip transaction id, so a retried webhook can't double-count a sale.
- Until the owner sets `STORE_MODE=live`, every order is flagged as a test and excluded from finances.
- "Available cash" only counts payouts that reached the bank; processor balances are shown as pending.
- Expenses can only be recorded through the owner-authenticated API.
- Customer emails are stored only as a one-way hash; full details stay in Payhip.

See `docs/DEPLOYMENT.md` to go live and `docs/ACCOUNTS.md` for what the owner must set up.
