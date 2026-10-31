// Live smoke test, run by GitHub Actions right after each deploy.
// Read-only except one honeypot contact submission (stores nothing) and one tracked click (campaign "ci-smoke").
const BASE = process.env.BASE_URL || 'https://shop.loonieledger.workers.dev';
const products = JSON.parse((await import('node:fs')).readFileSync(new URL('../site/src/products.json', import.meta.url), 'utf8'));
let failed = 0;
const check = (ok, name) => { console.log(`${ok ? "PASS" : "FAIL"}  ${name}`); if (!ok) { failed++; console.log(`::error title=Live check failed::${name}`); } };
const get = (p, init = {}) => fetch(BASE + p, { redirect: 'manual', ...init });

for (const p of ['/', '/products/', '/gst-threshold-checker/', '/faq/', '/about/', '/contact/', '/delivery/', '/refunds/', '/privacy/', '/terms/', ...products.map((x) => `/products/${x.slug}/`)]) {
  const r = await get(p);
  const body = r.status === 200 ? await r.text() : '';
  check(r.status === 200 && body.includes('Loonie Ledger'), `page ${p}`);
}
for (const x of products.filter((x) => x.status !== 'live')) {
  const body = await (await get(`/products/${x.slug}/`)).text();
  check(!body.includes('payhip.com') && body.includes('Coming soon'), `not on sale yet: ${x.slug}`);
}
check((await get('/this-page-does-not-exist')).status === 404, 'unknown page returns 404');

const h = await (await get('/api/health')).json();
check(h.ok === true, `health ok (mode: ${h.mode})`);

const o = await get('/owner');
check(o.status === 200 && /connect-src 'self'/.test(o.headers.get('content-security-policy') || ''), 'dashboard page served with strict CSP');
for (const p of ['/api/owner/summary', '/api/owner/tickets', '/api/owner/alerts']) {
  check((await get(p)).status === 401, `${p} refuses without login`);
}
check((await get('/api/webhooks/payhip/not-the-real-token-123456', { method: 'POST', body: '{}', headers: { 'content-type': 'application/json' } })).status === 404, 'webhook hidden behind secret path');

const s = await get('/api/support', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
  body: 'email=ci%40example.com&message=Automated+smoke+test+message&website=bot' });
check(s.status === 303 && /sent=1/.test(s.headers.get('location') || ''), 'contact form accepts posts; honeypot stores nothing');

const g = await get('/go/ci-smoke?to=' + encodeURIComponent('//evil.example'));
check(g.status === 302 && new URL(g.headers.get('location')).host === new URL(BASE).host, 'tracked links never redirect off-site');

console.log(failed ? `\n${failed} check(s) failed` : '\nAll live checks passed');
console.log(`::notice title=Live checks::${failed ? failed + ' failed' : 'all passed'}`);
process.exit(failed ? 1 : 0);
