# Accounts and keys the owner must provide

Claude never creates accounts, enters banking or identity details, or accepts terms on your behalf.
Nothing below is connected yet.

| # | Account | Cost | What it's for | Key/secret produced | Where the secret goes |
|---|---|---|---|---|---|
| 1 | GitHub | Free | Stores the code, runs tests, deploys, backups | — | — |
| 2 | Cloudflare | Free | Hosts the store, worker, database | Account ID; API token (Workers + D1 edit) | GitHub repo secrets `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN` |
| 3 | Stripe (Canada) | Free; fees per sale | Card payments behind Payhip | — (connected inside Payhip) | — |
| 4 | Payhip | Free plan | Checkout, file delivery, receipts | API key (Settings → Developer) | Worker secret `PAYHIP_API_KEY` |
| 5 | Google | Free | Building/sharing Sheets products, business email | — | — |
| 6 | Pinterest business, TikTok, Instagram, YouTube | Free | Organic marketing | Added in Phase 5 if APIs allow | — |
| 7 | Domain name | ~$15–25/yr, **needs approval** | Custom web address | — | — |

Secrets generated during deployment (random, 32+ characters, never shared in chat):

| Secret | Purpose |
|---|---|
| `WEBHOOK_PATH_TOKEN` | Hidden part of the Payhip webhook URL |
| `OWNER_API_TOKEN` | Lets the owner dashboard read your data |
| `OWNER_EMAIL` | Your email, used by Cloudflare Access to let only you in |
