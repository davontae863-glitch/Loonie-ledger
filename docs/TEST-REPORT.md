# Phase 6 test report (2026-10-31)

## Automated (run on every push; deploy is blocked if any fail)
- 34 worker tests: webhook signature and secret path, forged/malformed payloads, duplicate deliveries, database outage + retry, partial/full/over-refunds, out-of-order refunds, test-mode exclusion, cash vs pending, owner auth, support classification (16 messages), contact form spam/rate limits, tracked-link safety, alerts and push, scheduled reports.
- 3 storefront tests: nothing is buyable unless `live` AND linked to payhip.com; every page has title, description and legal links.
- Live smoke test after each deploy, using real browser headers: all pages, health, dashboard, owner-API protection, hidden webhook, contact form, redirect safety.

## Spreadsheet products
- Both files recalculate with zero formula errors; hand-checked scenarios (provincial GST/HST/QST, unregistered expenses, meals 50%, business-use %, threshold crossings, home-office loss limit, all six invoice presets). `products/test_products.py` holds the scripted scenarios.

## Live end-to-end with Payhip + Stripe
| Step | Result |
|---|---|
| $0 coupon checkout | Delivered download; Payhip sent no webhook (expected: Payhip only notifies on charges) |
| $0.74 real purchase | Delivered download (webhook address was still wrong at that time, so not recorded) |
| Webhook address self-check | Green after token reset |
| Refund of $0.74 in Stripe | Payhip notified the store; signature verified; logged as "refund for unknown order" (correct, since the sale predated the fix) |

## Bugs found and fixed during testing
1. Browser visits to /owner, the contact form and tracked links hit the 404 page (Cloudflare served assets first). Fixed with `run_worker_first`; smoke test now uses browser headers.
2. Dashboard sign-in failed silently. Now explains why.
3. Refund alerts could show the wrong amount on repeat or over-refunds. Now capped and de-duplicated.
4. Webhook tokens with symbols were rejected. Now accepted.

## Open before launch
- Payhip is charging 5% GST at checkout; turn off unless registered for GST/HST.
- Stripe shows "Action required".
- Optional: one more real purchase to see "paid: stored" end to end.
- Optional: lengthen WEBHOOK_PATH_TOKEN (currently 10 characters) and update Payhip to match.
