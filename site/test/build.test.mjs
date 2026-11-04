// Storefront rules: nothing can be bought unless it's live AND has a real Payhip link.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const site = join(dirname(fileURLToPath(import.meta.url)), '..');
const base = JSON.parse(readFileSync(join(site, 'src/products.json'), 'utf8'));
function build(products) {
  const dir = mkdtempSync(join(tmpdir(), 'll-'));
  const pf = join(dir, 'products.json'); writeFileSync(pf, JSON.stringify(products));
  execFileSync('node', [join(site, 'build.mjs')], { env: { ...process.env, PRODUCTS_FILE: pf, OUT_DIR: join(dir, 'dist') }, stdio: 'pipe' });
  return (p) => readFileSync(join(dir, 'dist', p), 'utf8');
}

test('current catalog: live products link to payhip.com; everything else is "Coming soon" with no checkout link', () => {
  const read = build(base);
  for (const p of base) {
    const html = read(`products/${p.slug}/index.html`);
    if (p.status === 'live') {
      assert.match(p.payhip_url, /^https:\/\/payhip\.com\//);
      assert.ok(html.includes(`href="${p.payhip_url}"`), p.slug);
      assert.doesNotMatch(html, /Coming soon/);
    } else {
      assert.match(html, /Coming soon/);
      assert.doesNotMatch(html, /payhip\.com/);
    }
  }
});

test('a product goes on sale only when live AND linked to payhip.com', () => {
  const [a, b, c] = base;
  const read = build([
    { ...a, status: 'live', payhip_url: 'https://payhip.com/b/AbC12' },
    { ...b, status: 'live', payhip_url: 'https://evil.example/pay' },
    { ...c, status: 'pending_approval', payhip_url: 'https://payhip.com/b/XyZ' },
    ...base.slice(3),
  ]);
  assert.match(read(`products/${a.slug}/index.html`), /href="https:\/\/payhip\.com\/b\/AbC12">Buy for \$24/);
  assert.doesNotMatch(read(`products/${b.slug}/index.html`), /evil\.example/);
  assert.doesNotMatch(read(`products/${c.slug}/index.html`), /payhip\.com/);
});

test('every page has a title, description, and the legal links in the footer', () => {
  const read = build(base);
  for (const p of ['index.html', 'products/index.html', 'contact/index.html', 'privacy/index.html', 'terms/index.html', 'refunds/index.html', 'faq/index.html', 'delivery/index.html', 'about/index.html', 'gst-threshold-checker/index.html', '404.html']) {
    const html = read(p);
    assert.match(html, /<title>[^<]+<\/title>/, p);
    assert.match(html, /name="description"/, p);
    for (const l of ['/refunds/', '/privacy/', '/terms/', '/contact/']) assert.ok(html.includes(`href="${l}"`), `${p} links ${l}`);
  }
  assert.ok(!read('contact/index.html').includes('[contact email'), 'contact email filled in');
  assert.ok(!read('about/index.html').includes('[owner name'), 'owner name filled in');
});

test('membership: shows a monthly price, stays "Coming soon" until it has a Payhip link, then says "Join"', () => {
  const m = base.find((p) => p.billing);
  assert.ok(m, 'catalog has a membership');
  let read = build(base);
  let html = read(`products/${m.slug}/index.html`);
  assert.match(html, /\$5 <span/);
  assert.match(html, /per month, or \$39 per year/);
  assert.match(read('products/index.html'), /\$5\/mo/);
  if (m.status !== 'live') assert.match(html, /Coming soon/);
  read = build(base.map((p) => (p === m ? { ...p, status: 'live', payhip_url: 'https://payhip.com/b/Memb1' } : p)));
  html = read(`products/${m.slug}/index.html`);
  assert.match(html, /href="https:\/\/payhip\.com\/b\/Memb1">Join for \$5\/month/);
  assert.doesNotMatch(html, /One-time purchase/);
});
