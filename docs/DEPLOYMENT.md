# Deployment guide

Written so most steps work from a phone browser. Steps marked 💻 are easier on a computer.

## 1. GitHub
1. Create a free GitHub account and a **private** repository named `loonie-ledger`.
2. Tell Claude the repository name; Claude pushes the code to it.

## 2. Cloudflare
1. Create a free Cloudflare account.
2. **Database:** Workers & Pages → D1 → Create database → name `loonie-ledger`. Copy the database ID and give it to Claude (it's not a secret); Claude puts it in `worker/wrangler.toml`.
3. **API token:** My Profile → API Tokens → Create token → template "Edit Cloudflare Workers", add permission **D1: Edit**. Copy it once.
4. **Account ID:** shown on the Workers & Pages overview page.

## 3. Connect GitHub to Cloudflare
1. In the GitHub repo: Settings → Secrets and variables → Actions → add `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`.
2. Push to `main` (Claude does this). The "Test and deploy" workflow runs tests, creates the tables, and deploys the worker.

## 4. Worker secrets
Cloudflare → Workers & Pages → `shop` → Settings → Variables and Secrets → add as **Secret** (encrypted):
`PAYHIP_API_KEY`, `WEBHOOK_PATH_TOKEN`, `OWNER_API_TOKEN`, `OWNER_EMAIL`.
Generate the two tokens with a password manager's generator (32+ characters, letters and numbers).

## 5. Storefront
Nothing to set up. The store pages are built from `site/` and served by the same worker at **https://shop.loonieledger.workers.dev**; the owner dashboard is at **/owner**.
After the first deploy of the `shop` worker, delete the old `loonie-ledger-ops` worker in Cloudflare (Workers & Pages → it → Settings → Delete) so its hourly job doesn't run twice.

## 6. Payhip
1. Create the Payhip account, connect Stripe (and PayPal if wanted). Keep products **unpublished** until Phase 7 approval.
2. Settings → Developer → Webhooks → add
   `https://shop.loonieledger.workers.dev/api/webhooks/payhip/<WEBHOOK_PATH_TOKEN>`
   for **paid** and **refunded**.
3. Make one test purchase with a 100%-off coupon; check `/api/owner/health` shows no webhook errors.

## 7. Lock down the owner area (free)
Cloudflare Zero Trust → Access → Applications → add a self-hosted app for `shop.loonieledger.workers.dev/owner` and `/api/owner/*` with a policy allowing only `OWNER_EMAIL`. You'll sign in with a one-time code sent to your email.

## 8. Go live (Phase 7 only, after your approval)
Change `STORE_MODE` in `worker/wrangler.toml` from `test` to `live`, push, and publish products in Payhip.

## Checks after any deploy
- `https://…workers.dev/api/health` returns `{"ok":true,...}`
- GitHub Actions run is green
- Hourly heartbeat appears in `/api/owner/health` → `last_jobs`
