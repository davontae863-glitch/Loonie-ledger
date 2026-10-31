// Static site builder. No dependencies: `node build.mjs` writes ./dist
// Products and settings come from src/products.json and src/site.json.
import { readFileSync, writeFileSync, mkdirSync, rmSync, copyFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const site = JSON.parse(readFileSync(join(root, 'src/site.json'), 'utf8'));
const products = JSON.parse(readFileSync(join(root, 'src/products.json'), 'utf8'));
const out = join(root, 'dist');

const warnings = [];
if (!site.contactEmail) warnings.push('site.json: contactEmail is empty (required before launch)');
if (!site.ownerName) warnings.push('site.json: ownerName is empty (required before launch)');

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const cad = (c) => `$${(c / 100).toFixed(c % 100 ? 2 : 0)}`;
const isBuyable = (p) => p.status === 'live' && /^https:\/\/payhip\.com\//.test(p.payhip_url);

const coin = `<svg class="brand-coin" viewBox="0 0 40 40" aria-hidden="true"><polygon points="${
  Array.from({ length: 11 }, (_, i) => {
    const a = (Math.PI * 2 * i) / 11 - Math.PI / 2;
    return `${(20 + 18 * Math.cos(a)).toFixed(2)},${(20 + 18 * Math.sin(a)).toFixed(2)}`;
  }).join(' ')
}" fill="#9a6b14"/><path d="M15 12v16h11" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const nav = [
  ['/', 'Home'], ['/products/', 'Tools'], ['/gst-threshold-checker/', 'GST checker'], ['/faq/', 'FAQ'], ['/about/', 'About'], ['/contact/', 'Contact'],
];

function page({ path, title, description, body, noindex = false }) {
  const fullTitle = path === '/' ? `${site.name} — ${site.tagline}` : `${title} — ${site.name}`;
  return `<!doctype html>
<html lang="en-CA">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(fullTitle)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${site.baseUrl}${path}">
<meta property="og:title" content="${esc(fullTitle)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:type" content="website">
${noindex ? '<meta name="robots" content="noindex">' : ''}
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Schibsted+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/style.css">
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header class="site-head"><div class="wrap">
  <a class="brand" href="/">${coin}<span>${esc(site.name)}</span></a>
  <nav class="nav" aria-label="Main">${nav.map(([h, l]) => `<a href="${h}"${h === path ? ' aria-current="page"' : ''}>${l}</a>`).join('')}</nav>
</div></header>
<main id="main"><div class="wrap">
${body}
</div></main>
<footer class="site-foot"><div class="wrap"><div class="cols">
  <div><strong>${esc(site.name)}</strong><p class="small">${esc(site.tagline)} Spreadsheet tools for Canadian sole proprietors and households. Not affiliated with the Canada Revenue Agency. Our tools organize records; they are not tax, accounting or legal advice.</p></div>
  <div><ul><li><a href="/products/">All tools</a></li><li><a href="/gst-threshold-checker/">GST/HST threshold checker</a></li><li><a href="/faq/">FAQ</a></li><li><a href="/delivery/">Delivery</a></li></ul></div>
  <div><ul><li><a href="/refunds/">Refund policy</a></li><li><a href="/privacy/">Privacy policy</a></li><li><a href="/terms/">Terms of use</a></li><li><a href="/contact/">Contact</a></li></ul></div>
</div></div></footer>
</body>
</html>`;
}

function write(path, html) {
  const file = join(out, path, path.endsWith('.html') ? '' : 'index.html');
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, html);
}

// ---------- GST checker (used on home and its own page) ----------
const checker = (id) => `
<section class="sheet" aria-labelledby="${id}-title">
  <div class="sheet-title"><span id="${id}-title" style="color:var(--ink);font-weight:600;font-size:1rem">GST/HST small-supplier check</span><span>Your taxable sales, CAD</span></div>
  <table class="cells" data-checker>
    <tbody>
      ${['Most recent quarter', 'Quarter before', 'Two quarters back', 'Three quarters back'].map((q, i) => `
      <tr><th scope="row"><label for="${id}-q${i}">${q}</label></th>
      <td><input class="cell-input" id="${id}-q${i}" inputmode="decimal" autocomplete="off" value="${[6200, 7400, 8100, 5900][i]}"></td></tr>`).join('')}
      <tr class="total"><th scope="row">Last four quarters</th><td data-total>$27,600</td></tr>
    </tbody>
  </table>
  <div class="meter" data-meter aria-hidden="true"><i style="width:92%"></i></div>
  <p class="verdict ok" data-verdict role="status">Under the $30,000 threshold, with $2,400 to go.</p>
  <p class="sheet-foot">Under CRA rules you stop being a small supplier when taxable sales pass $30,000 in a single calendar quarter or over four consecutive quarters. Check the CRA's "When to register" page for your situation.</p>
</section>`;

const checkerScript = `<script>
document.querySelectorAll('[data-checker]').forEach(function (t) {
  var sheet = t.closest('.sheet'), inputs = t.querySelectorAll('input'), LIMIT = 30000;
  var fmt = function (n) { return '$' + Math.round(n).toLocaleString('en-CA'); };
  function update() {
    var vals = Array.prototype.map.call(inputs, function (i) { var v = parseFloat(String(i.value).replace(/[$,\\s]/g, '')); return isFinite(v) && v > 0 ? v : 0; });
    var total = vals.reduce(function (a, b) { return a + b; }, 0);
    var single = vals.some(function (v) { return v > LIMIT; });
    var over = single || total > LIMIT;
    sheet.querySelector('[data-total]').textContent = fmt(total);
    var m = sheet.querySelector('[data-meter]'); m.firstElementChild.style.width = Math.min(100, total / LIMIT * 100) + '%'; m.classList.toggle('over', over);
    var v = sheet.querySelector('[data-verdict]');
    v.className = 'verdict ' + (over ? 'over' : 'ok');
    v.textContent = single ? 'One quarter is over $30,000, so you are no longer a small supplier.'
      : over ? 'Over $30,000 across four quarters, so you are no longer a small supplier.'
      : 'Under the $30,000 threshold, with ' + fmt(LIMIT - total) + ' to go.';
  }
  inputs.forEach(function (i) { i.addEventListener('input', update); });
});
</script>`;

// ---------- Pages ----------
const wave1 = products.filter((p) => p.launch_wave === 1);
const productRows = (list) => `<ul class="ledger">${list.map((p) => `
  <li><a class="row" href="/products/${p.slug}/">
    <span class="row-name">${esc(p.name)}${isBuyable(p) ? '' : '<span class="status">Coming soon</span>'}</span>
    <span class="row-desc">${esc(p.short)}</span>
    <span class="row-price">${cad(p.price_cents)}</span>
  </a></li>`).join('')}</ul>`;

write('/', page({
  path: '/', title: 'Home',
  description: 'Bookkeeping, GST/HST and registered-account spreadsheets built for Canadian sole proprietors and households.',
  body: `
<section class="hero">
  <div>
    <h1>Bookkeeping that already speaks Canadian.</h1>
    <p class="lede">Spreadsheets organized the way the CRA asks for things: T2125 expense lines, every province's sales tax, and the $30,000 GST/HST threshold tracked for you.</p>
    <div class="actions"><a class="btn" href="/products/">See the tools</a><a class="btn secondary" href="/gst-threshold-checker/">Check your GST status</a></div>
    <p class="small muted" style="margin-top:20px">One-time price. Google Sheets and Excel. No subscription.</p>
  </div>
  ${checker('home')}
</section>
<h2>The tools</h2>
${productRows(products)}
<h2>Why these exist</h2>
<p>Most templates online are built for the US: 401(k)s, sales tax by state, and no idea what a T2125 is. If you run a small business in Canada, you end up rebuilding them yourself. These are built for Canada from the first row, and they're updated every January when rates and limits change.</p>
${checkerScript}`,
}));

write('/gst-threshold-checker/', page({
  path: '/gst-threshold-checker/', title: 'GST/HST small-supplier threshold checker',
  description: 'Free calculator: enter your last four quarters of sales to see whether you are over the $30,000 GST/HST small-supplier threshold.',
  body: `
<h1>Do I need to register for GST/HST?</h1>
<p class="lede">Enter your taxable sales for each of the last four calendar quarters. Nothing you type leaves this page.</p>
<div style="max-width:36rem;margin-top:24px">${checker('tool')}</div>
<div class="prose">
<h2>How the threshold works</h2>
<p>You're a small supplier, and don't have to register, while your worldwide taxable sales stay at $30,000 or less in any single calendar quarter and over the last four consecutive calendar quarters. Once you pass it, you have to register and start charging GST/HST.</p>
<p>The rules have details this checker doesn't cover, such as which sales count as taxable and when registration takes effect. Read the CRA's "When to register for and start charging the GST/HST" page, or ask an accountant, before you decide.</p>
<p>Want this tracked automatically every month? The <a href="/products/sole-proprietor-bookkeeping-tracker/">Bookkeeping &amp; GST/HST Tracker</a> keeps a running four-quarter total as you log income.</p>
</div>
${checkerScript}`,
}));

write('/products/', page({
  path: '/products/', title: 'Tools',
  description: 'All Loonie Ledger spreadsheet tools for Canadian sole proprietors and households.',
  body: `<h1>Tools</h1><p class="lede">Each one is a one-time purchase that works in Google Sheets or Excel.</p>${productRows(products)}`,
}));

for (const p of products) {
  const buy = isBuyable(p)
    ? `<a class="btn" href="${esc(p.payhip_url)}">Buy for ${cad(p.price_cents)}</a>`
    : `<a class="btn" aria-disabled="true" role="link" tabindex="0">Coming soon</a>`;
  write(`/products/${p.slug}/`, page({
    path: `/products/${p.slug}/`, title: p.name, description: p.short,
    body: `
<p class="small"><a href="/products/">All tools</a></p>
<h1>${esc(p.name)}</h1>
<p class="lede">${esc(p.short)}</p>
<div class="product">
  <div>
    <h2>Who it's for</h2><p>${esc(p.for)}</p>
    <h2>The problem it solves</h2><p>${esc(p.problem)}</p>
    <h2>What's inside</h2>
    <section class="sheet"><table class="cells stack"><tbody>
      ${p.inside.map(([a, b]) => `<tr><th scope="row" style="color:var(--ink);font-weight:600">${esc(a)}</th><td style="text-align:left;color:var(--ink-soft)">${esc(b)}</td></tr>`).join('')}
    </tbody></table></section>
    <h2>Questions</h2>
    <dl class="faq">${p.faq.map(([q, a]) => `<dt>${esc(q)}</dt><dd>${esc(a)}</dd>`).join('')}</dl>
  </div>
  <aside>
    <div class="sheet buy-box" style="padding:20px">
      <p class="price">${cad(p.price_cents)} <span class="small muted" style="font-weight:400">CAD</span></p>
      <p class="small muted">One-time purchase</p>
      ${buy}
      ${isBuyable(p) ? '' : '<p class="small muted" style="margin-top:12px">This tool is being finished and isn\'t on sale yet.</p>'}
      <ul class="facts">
        <li>${esc(p.formats)}</li>
        <li>Delivered by email right after payment</li>
        <li>Free January update for rates and limits</li>
        <li><a href="/refunds/">Refund policy</a></li>
      </ul>
    </div>
  </aside>
</div>`,
  }));
}

const contact = site.contactEmail
  ? `<a href="mailto:${esc(site.contactEmail)}">${esc(site.contactEmail)}</a>`
  : '<strong>[contact email to be added before launch]</strong>';
const owner = site.ownerName ? esc(site.ownerName) : '[owner name to be added before launch]';

const prose = (path, title, description, html) => write(path, page({ path, title, description, body: `<div class="prose"><h1>${esc(title)}</h1>${html}</div>` }));

prose('/about/', 'About', 'Who makes Loonie Ledger and why.', `
<p class="lede">Loonie Ledger is a small Canadian business, run by ${owner} in ${esc(site.province)}, that makes spreadsheet tools for people managing their own money and small businesses.</p>
<p>We started because nearly every bookkeeping and budget template online assumes you live in the US. Canadian sole proprietors deal with different forms, different sales taxes and different savings accounts, so we build for those first.</p>
<h2>What we promise</h2>
<ul>
<li>Rates and limits come from CRA sources, are dated in each file, and are updated every January.</li>
<li>Tools never guess your personal numbers, such as contribution room; you enter what CRA shows you.</li>
<li>We say plainly what a tool does and doesn't do. None of it is tax advice.</li>
</ul>`);

prose('/contact/', 'Contact', 'How to reach Loonie Ledger.', `
<p class="lede">Send us a message below, or email ${contact}. We reply within two business days.</p>
<p class="note" id="sent" hidden style="border-left-color:var(--ok)">Thanks, your message is in. We'll reply by email within two business days.</p>
<p class="note" id="err" hidden></p>
<form class="sheet contact-form" method="post" action="/api/support">
  <label for="c-name">Your name <span class="muted">(optional)</span></label>
  <input id="c-name" name="name" autocomplete="name" maxlength="80">
  <label for="c-email">Email to reply to</label>
  <input id="c-email" name="email" type="email" autocomplete="email" required>
  <label for="c-order">Email you bought with <span class="muted">(if different)</span></label>
  <input id="c-order" name="order_email" type="email">
  <label for="c-msg">Message</label>
  <textarea id="c-msg" name="message" rows="6" required minlength="10" maxlength="4000"></textarea>
  <div class="hp" aria-hidden="true"><label for="c-web">Leave this empty</label><input id="c-web" name="website" tabindex="-1" autocomplete="off"></div>
  <button class="btn" type="submit">Send message</button>
  <p class="small muted" style="margin:0">Please don't include card numbers, your SIN or banking details. We keep messages for up to 12 months after we close them; see our <a href="/privacy/">privacy policy</a>.</p>
</form>
<script>
(function(){var q=new URLSearchParams(location.search);
if(q.get('sent')){document.getElementById('sent').hidden=false;document.querySelector('.contact-form').hidden=true;}
if(q.get('error')){var e=document.getElementById('err');e.textContent=q.get('error');e.hidden=false;}})();
</script>`);

prose('/faq/', 'FAQ', 'Answers to common questions about Loonie Ledger tools.', `<dl class="faq">
<dt>What do I actually get?</dt><dd>A Google Sheets copy link and an Excel (.xlsx) file, plus a one-page setup guide. They arrive by email right after payment.</dd>
<dt>Do I need Excel?</dt><dd>No. A free Google account is enough to use the Google Sheets version, on a computer or phone.</dd>
<dt>Is this tax advice?</dt><dd>No. The tools organize your records using CRA categories. For advice about your situation, talk to an accountant or the CRA.</dd>
<dt>Are you affiliated with the CRA?</dt><dd>No.</dd>
<dt>Do prices include tax?</dt><dd>Prices are in Canadian dollars. If we become registered for GST/HST, tax will be shown at checkout.</dd>
<dt>Will it work in Quebec?</dt><dd>Yes. The tax presets include GST plus QST.</dd>
<dt>What if the file doesn't work for me?</dt><dd>Email us and we'll fix it. If we can't, see the <a href="/refunds/">refund policy</a>.</dd>
<dt>Do I get updates?</dt><dd>Yes. Each January's update to rates and limits is free for anyone who bought the tool.</dd>
</dl>`);

prose('/delivery/', 'Delivery', 'How Loonie Ledger tools are delivered.', `
<p class="lede">Every tool is a digital download. Nothing is shipped.</p>
<ul>
<li>After payment, our checkout provider (Payhip) emails you a download link right away, and shows it on the confirmation page.</li>
<li>If the email hasn't arrived within 15 minutes, check your spam folder, then <a href="/contact/">contact us</a> with the email you bought with.</li>
<li>Google Sheets versions open as "Make a copy", so the copy is yours to edit.</li>
</ul>`);

const draftNote = `<div class="note"><p>Draft for the owner's review, last updated ${esc(site.policiesUpdated)}. This is a plain-language policy, not legal advice; it should be reviewed before the store takes payments.</p></div>`;

prose('/refunds/', 'Refund policy', 'Refund policy for Loonie Ledger digital products.', `${draftNote}
<p>Because our tools are digital files you keep as soon as they're delivered, here's how refunds work:</p>
<ul>
<li><strong>If a file doesn't work</strong> (won't open, formulas broken) and we can't fix it within 7 days of you telling us, we refund you in full.</li>
<li><strong>If you bought the wrong tool or bought twice</strong>, contact us within 14 days of purchase and we'll refund or swap it.</li>
<li>Outside those cases we don't usually refund digital downloads, but email us and we'll look at every request.</li>
</ul>
<p>Refunds go back to your original payment method through our checkout provider. Your bank may take 5 to 10 business days to show it.</p>
<p>To ask for a refund, email ${contact} with your order email and the tool's name.</p>`);

prose('/privacy/', 'Privacy policy', 'How Loonie Ledger collects and uses personal information.', `${draftNote}
<p>We follow Canada's Personal Information Protection and Electronic Documents Act (PIPEDA). This policy explains what we collect and why.</p>
<h2>What we collect</h2>
<ul>
<li><strong>When you buy:</strong> your name, email address and purchase details are collected by our checkout provider, Payhip, and card payments are processed by Stripe or PayPal. We never see or store your full card number.</li>
<li><strong>In our own records:</strong> order amounts, which tool you bought, and a one-way scrambled version of your email address, used to match support requests and prevent double-counting. We don't keep your name or address in our systems.</li>
<li><strong>When you contact us:</strong> your name (optional), email address and message. We keep these to answer you and delete them 12 months after we close your request.</li>
<li><strong>On this website:</strong> our host (Cloudflare) processes standard technical data, such as IP addresses, to deliver pages and protect the site. The GST checker runs in your browser; what you type isn't sent anywhere.</li>
</ul>
<h2>How we use it</h2>
<ul>
<li>To deliver your purchase, provide support and handle refunds.</li>
<li>To send product update emails, only if you agreed to them at checkout. You can unsubscribe any time.</li>
<li>To keep accurate business and tax records.</li>
</ul>
<p>We don't sell personal information.</p>
<h2>Service providers</h2>
<p>Payhip (checkout and delivery), Stripe and PayPal (payments), Cloudflare (website hosting and our order records) and Google (if you use the Sheets version). Some store data outside Canada, including in the United States.</p>
<h2>Your rights</h2>
<p>You can ask what personal information we hold about you, ask us to correct it, or withdraw consent to marketing, by emailing ${contact}. If you're not satisfied with our answer, you can contact the Office of the Privacy Commissioner of Canada.</p>`);

prose('/terms/', 'Terms of use', 'Terms for using Loonie Ledger tools and website.', `${draftNote}
<h2>Your licence</h2>
<p>When you buy a tool, you get a personal licence to use it for your own household or business. Please don't resell, share or publish the files or links.</p>
<h2>No advice</h2>
<p>Our tools help you organize records. They aren't tax, accounting, legal or financial advice, and we're not affiliated with the Canada Revenue Agency. Rates and limits in each file are dated; check them against current CRA information before relying on them. You're responsible for your own tax filings.</p>
<h2>Accuracy</h2>
<p>We work hard to keep the tools correct and fix reported errors quickly. To the extent the law allows, our total liability for any claim about a tool is limited to the price you paid for it.</p>
<h2>Changes</h2>
<p>We may update these terms; the date at the top shows the latest version. The terms in effect when you bought apply to that purchase.</p>
<h2>Contact</h2>
<p>${contact}. These terms are governed by the laws of ${esc(site.province)} and the federal laws of Canada that apply there.</p>`);

write('/404.html', page({ path: '/404.html', title: 'Page not found', description: 'Page not found.', noindex: true,
  body: `<h1>That page isn't here.</h1><p class="lede">It may have moved. Try the <a href="/products/">list of tools</a> or the <a href="/">home page</a>.</p>` }));

// ---------- Assets, sitemap, robots ----------
copyFileSync(join(root, 'src/style.css'), join(out, 'style.css'));
writeFileSync(join(out, 'favicon.svg'), coin.replace('class="brand-coin" ', 'xmlns="http://www.w3.org/2000/svg" '));
const paths = ['/', '/products/', '/gst-threshold-checker/', '/faq/', '/about/', '/contact/', '/delivery/', '/refunds/', '/privacy/', '/terms/', ...products.map((p) => `/products/${p.slug}/`)];
writeFileSync(join(out, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map((p) => `<url><loc>${site.baseUrl}${p}</loc></url>`).join('')}</urlset>\n`);
writeFileSync(join(out, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${site.baseUrl}/sitemap.xml\n`);
writeFileSync(join(out, '_headers'), `/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  X-Frame-Options: DENY\n  Permissions-Policy: camera=(), microphone=(), geolocation=()\n`);

console.log(`Built ${paths.length + 1} pages into dist/`);
for (const w of warnings) console.warn('WARNING:', w);
