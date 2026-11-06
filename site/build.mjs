// Static site builder. No dependencies: `node build.mjs` writes ./dist
// Products and settings come from src/products.json and src/site.json.
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync, rmSync, copyFileSync, existsSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const site = JSON.parse(readFileSync(join(root, 'src/site.json'), 'utf8'));
const products = JSON.parse(readFileSync(process.env.PRODUCTS_FILE || join(root, 'src/products.json'), 'utf8'));
const out = process.env.OUT_DIR || join(root, 'dist');

const warnings = [];
if (!site.contactEmail) warnings.push('site.json: contactEmail is empty (required before launch)');
if (!site.ownerName) warnings.push('site.json: ownerName is empty (required before launch)');

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const cad = (c) => `$${(c / 100).toFixed(c % 100 ? 2 : 0)}`;
// Memberships (billing.interval) show "$5/mo"; everything else is a one-time price.
const priceShort = (p) => p.billing ? `${cad(p.price_cents)}/mo` : cad(p.price_cents);
const isPayhip = (u) => /^https:\/\/payhip\.com\//.test(u || '');
const isBuyable = (p) => p.status === 'live' && isPayhip(p.payhip_url);
// Responsive cover: small WebP for phones and cards, large WebP for wide screens, JPG for old browsers.
const hasCover = (slug) => existsSync(join(root, `src/img/${slug}.jpg`));
const pic = (slug, { sizes, alt = '', cls = '', eager = false }) => {
  const webp = existsSync(join(root, `src/img/${slug}-600.webp`));
  return `<picture>${webp ? `<source type="image/webp" srcset="/img/${slug}-600.webp 600w, /img/${slug}-1200.webp 1200w" sizes="${sizes}">` : ''}<img${cls ? ` class="${cls}"` : ''} src="/img/${slug}.jpg" width="1200" height="900" alt="${esc(alt)}" decoding="async" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'}></picture>`;
};
// Membership plans: first tap picks a plan (it turns green), second tap on the same plan goes to checkout.
// Without JavaScript the plans are ordinary checkout links.
const planPicker = (p) => {
  const plans = [['Monthly', '', p.payhip_url, cad(p.price_cents), 'month']];
  if (isPayhip(p.payhip_url_yearly)) plans.push(['Yearly', `Save ${cad(p.price_cents * 12 - p.billing.yearly_cents)}`, p.payhip_url_yearly, cad(p.billing.yearly_cents), 'year']);
  return `<div class="plans" data-plans>${plans.map(([name, tag, url, price, per]) => `
    <a class="plan" href="${esc(url)}" data-price="${price}" data-per="per ${per}">
      <span class="plan-top"><span class="plan-name">${name}</span>${tag ? `<span class="plan-tag">${tag}</span>` : ''}</span>
      <span class="plan-price">${price}<small>/${per}</small></span>
      <span class="plan-go" aria-hidden="true">Tap again to check out →</span>
    </a>`).join('')}</div>
  <p class="plan-help small muted" aria-live="polite" data-plan-help>Pick a plan, then tap it again to check out.</p>
  <script>(function(){var w=document.querySelector('[data-plans]');if(!w)return;var help=document.querySelector('[data-plan-help]'),pr=document.querySelector('.buy-box .price'),sub=pr&&pr.nextElementSibling;
  w.addEventListener('click',function(e){var a=e.target.closest('.plan');if(!a)return;if(a.classList.contains('is-picked'))return;e.preventDefault();
  w.querySelectorAll('.plan').forEach(function(x){x.classList.toggle('is-picked',x===a);x.setAttribute('aria-current',x===a?'true':'false');});
  var name=a.querySelector('.plan-name').textContent;help.textContent=name+' plan selected. Tap it again to check out.';
  if(pr){pr.firstChild.nodeValue=a.dataset.price+' ';sub.textContent=a.dataset.per+'. Cancel any time.';}});})();</script>`;
};
// Stylesheet gets a content hash so browsers can cache it for a year and still get changes right away.
const cssVersion = createHash('sha256').update(readFileSync(join(root, 'src/style.css'))).digest('hex').slice(0, 10);

const coin = `<svg class="brand-coin" viewBox="0 0 40 40" aria-hidden="true"><polygon points="${
  Array.from({ length: 11 }, (_, i) => {
    const a = (Math.PI * 2 * i) / 11 - Math.PI / 2;
    return `${(20 + 18 * Math.cos(a)).toFixed(2)},${(20 + 18 * Math.sin(a)).toFixed(2)}`;
  }).join(' ')
}" fill="#9a6b14"/><path d="M15 12v16h11" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const nav = [
  ['/', 'Home'], ['/products/', 'Tools'], ['/gst-threshold-checker/', 'GST checker'], ['/faq/', 'FAQ'], ['/about/', 'About'], ['/contact/', 'Contact'],
];

// Social links + the follow promise (owner request 2026-11-06: site visitors are the warmest followers).
const socialBand = () => (site.social && site.social.length) ? `<div class="follow"><p><strong>${esc(site.followPromise || 'Follow along')}</strong> — follow Loonie Ledger:</p><ul>${site.social.map(([l, u]) => `<li><a href="${esc(u)}" rel="noopener" target="_blank">${esc(l)}</a></li>`).join('')}</ul></div>` : '';
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
<link rel="icon" href="/favicon.ico" sizes="48x48">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<meta name="theme-color" content="#1d5a45">
<meta property="og:image" content="${site.baseUrl}/og-image.jpg">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta property="og:site_name" content="${esc(site.name)}">
<meta property="og:url" content="${site.baseUrl}${path}">
<meta name="twitter:card" content="summary_large_image">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="/style.css?v=${cssVersion}">
<link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Schibsted+Grotesk:wght@400;500;600;700&display=optional" onload="this.onload=null;this.rel='stylesheet'">
<noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Schibsted+Grotesk:wght@400;500;600;700&display=optional"></noscript>
<script type="speculationrules">{"prefetch":[{"where":{"and":[{"href_matches":"/*"},{"not":{"href_matches":["/go/*","/api/*","/owner","/owner/*"]}}]},"eagerness":"moderate"}],"prerender":[{"where":{"and":[{"href_matches":"/*"},{"not":{"href_matches":["/go/*","/api/*","/owner","/owner/*","/contact/*"]}}]},"eagerness":"moderate"}]}</script>
<script>
/* Back/forward swipes slide the other way, like iOS. */
addEventListener('pagereveal', function (e) {
  try { if (e.viewTransition && navigation.activation && navigation.activation.navigationType === 'traverse') {
    var from = navigation.activation.from, to = navigation.activation.entry;
    if (from && to && to.index < from.index) e.viewTransition.types.add('back');
  } } catch (_) {}
});
</script>
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header class="site-head"><div class="wrap">
  <a class="brand" href="/">${coin}<span>${esc(site.name)}</span></a>
  <nav class="nav" aria-label="Main">${nav.map(([h, l]) => `<a href="${h}"${h === path ? ' aria-current="page"' : ''}>${l}</a>`).join('')}</nav>
</div></header>
<script>(function(){var n=document.querySelector('.nav'),a=n&&n.querySelector('[aria-current]');if(a&&n.scrollWidth>n.clientWidth)n.scrollLeft=a.offsetLeft-(n.clientWidth-a.offsetWidth)/2;})();</script>
<main id="main"><div class="wrap">
${body}
</div></main>
<footer class="site-foot"><div class="wrap">${socialBand()}<div class="cols">
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
  <p class="cells-note">Example numbers — replace them with yours.</p>
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
  <li><a class="row${hasCover(p.slug) ? ' has-thumb' : ''}" href="/products/${p.slug}/">
    ${hasCover(p.slug) ? `<span class="row-thumb">${pic(p.slug, { sizes: '120px' })}</span>` : ''}
    <span class="row-name">${esc(p.name)}${isBuyable(p) ? '' : '<span class="status">Coming soon</span>'}</span>
    <span class="row-desc">${esc(p.short)}</span>
    <span class="row-price">${priceShort(p)}</span>
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
    <p class="small muted" style="margin-top:20px">One-time prices, or every tool for $5 a month. Google Sheets and Excel.</p>
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
${(() => { const t = products.find((p) => p.slug === 'sole-proprietor-bookkeeping-tracker'); return t ? `<aside class="next-step sheet"><p class="feature-kicker" style="color:var(--bronze)">Next step</p><p><strong>Track this automatically, every month.</strong> The ${esc(t.name)} keeps a running four-quarter total as you log income, and warns you before you reach $30,000.</p><a class="btn" href="/products/${t.slug}/">See the tracker — ${priceShort(t)}</a></aside>` : ''; })()}
<div class="prose">
<h2>How the threshold works</h2>
<p>You're a small supplier, and don't have to register, while your worldwide taxable sales stay at $30,000 or less in any single calendar quarter and over the last four consecutive calendar quarters. Once you pass it, you have to register and start charging GST/HST.</p>
<p>One big exception: if you drive a taxi or for a rideshare app, you have to register from your first fare, even under $30,000.</p>
<p>The rules have details this checker doesn't cover, such as which sales count as taxable and when registration takes effect. Read the CRA's "When to register for and start charging the GST/HST" page, or ask an accountant, before you decide.</p>
<p>Want this tracked automatically every month? The <a href="/products/sole-proprietor-bookkeeping-tracker/">Bookkeeping &amp; GST/HST Tracker</a> keeps a running four-quarter total as you log income.</p>
</div>
${checkerScript}`,
}));

const bySlug = Object.fromEntries(products.map((p) => [p.slug, p]));
const card = (p, badge = '') => `
  <li class="card">
    <a href="/products/${p.slug}/">
      ${hasCover(p.slug) ? pic(p.slug, { sizes: '(min-width: 1100px) 520px, (min-width: 640px) 46vw, 92vw' }) : ''}
      <span class="card-body">
        ${badge ? `<span class="badge">${badge}</span>` : ''}
        <span class="card-name">${esc(p.name)}${isBuyable(p) ? '' : '<span class="status">Coming soon</span>'}</span>
        <span class="card-desc">${esc(p.short)}</span>
        <span class="card-foot"><span class="card-price">${priceShort(p)}</span><span class="card-go">See what's inside <span aria-hidden="true">→</span></span></span>
      </span>
    </a>
  </li>`;
const group = (title, sub, slugs, badges = {}) => {
  const list = slugs.map((s) => bySlug[s]).filter(Boolean);
  return list.length ? `<section class="shelf"><h2>${title}</h2><p class="muted">${sub}</p><ul class="cards">${list.map((p) => card(p, badges[p.slug])).join('')}</ul></section>` : '';
};
const member = products.find((p) => p.billing);
const grouped = new Set(['sole-proprietor-bookkeeping-tracker', 'freelancer-invoice-generator', 'tfsa-rrsp-fhsa-room-tracker', 'canadian-household-budget', 'complete-bundle', member && member.slug]);
const others = products.filter((p) => !grouped.has(p.slug));

write('/products/', page({
  path: '/products/', title: 'Tools',
  description: 'All Loonie Ledger spreadsheet tools for Canadian sole proprietors and households.',
  body: `
<header class="tools-head">
  <h1>Tools</h1>
  <p class="lede">Spreadsheets built around how the CRA does things. Buy one tool once, or get all of them with the membership.</p>
  <ul class="chips"><li>Google Sheets &amp; Excel</li><li>Made for Canada</li><li>Updated every January</li></ul>
</header>
${member ? `
<a class="feature" href="/products/${member.slug}/">
  <span class="feature-coin" aria-hidden="true">${coin}</span>
  <span class="feature-text">
    <span class="feature-kicker">${isBuyable(member) ? 'New' : 'Coming soon'} · ${esc(member.name)}</span>
    <span class="feature-title">Every tool, kept current every year.</span>
    <span class="feature-sub">All five tools, every January update and new tools as we release them. Cancel any time.</span>
  </span>
  <span class="feature-price"><strong>${cad(member.price_cents)}</strong>/month<br><span>or ${cad(member.billing.yearly_cents)}/year</span></span>
</a>` : ''}
${group('For your business', 'Freelancers, contractors and side hustles that file a T2125.', ['sole-proprietor-bookkeeping-tracker', 'freelancer-invoice-generator'])}
${group('For your household', 'Registered accounts and the monthly budget.', ['tfsa-rrsp-fhsa-room-tracker', 'canadian-household-budget'])}
${group('Everything at once', 'A one-time price for all of it.', ['complete-bundle'], { 'complete-bundle': 'Best value: $39 instead of $65' })}
${others.length ? `<section class="shelf"><h2>More tools</h2><ul class="cards">${others.map((p) => card(p)).join('')}</ul></section>` : ''}
<aside class="free-tool sheet">
  <div><p class="feature-kicker" style="color:var(--bronze)">Free tool</p><h2>Do you need to register for GST/HST?</h2><p class="muted">Type in your last four quarters of sales and see where you stand against the $30,000 small-supplier threshold. Nothing you type leaves the page.</p></div>
  <a class="btn" href="/gst-threshold-checker/">Try the free checker</a>
</aside>`,
}));

// Short demo videos on product pages (owner request 2026-11-06). Files live in src/media; poster = first frame.
const productVideo = { 'sole-proprietor-bookkeeping-tracker': 'loonie-ledger-sort-these-expenses-voiced', 'freelancer-invoice-generator': 'loonie-ledger-same-invoice-four-tax-lines', 'tfsa-rrsp-fhsa-room-tracker': 'loonie-ledger-tfsa-withdrawal-trap-voiced', 'complete-bundle': 'loonie-ledger-gst-four-quarters' };
const videoBlock = (slug) => { const v = productVideo[slug]; if (!v || !existsSync(join(root, `src/media/${v}.mp4`))) return '';
  return `<h2>See it in 20 seconds</h2><div class="demo-video"><video controls playsinline preload="none" width="1080" height="1920"${existsSync(join(root, `src/media/${v}-poster.jpg`)) ? ` poster="/media/${v}-poster.jpg"` : ''}><source src="/media/${v}.mp4" type="video/mp4"></video></div>`; };
for (const p of products) {
  const buy = isBuyable(p)
    ? (p.billing
      ? planPicker(p)
      : `<a class="btn" href="${esc(p.payhip_url)}">Buy for ${cad(p.price_cents)}</a>`)
    : `<a class="btn" aria-disabled="true" role="link" tabindex="0">Coming soon</a>`;
  write(`/products/${p.slug}/`, page({
    path: `/products/${p.slug}/`, title: p.name, description: p.short,
    body: `
<p class="small"><a href="/products/">All tools</a></p>
<h1>${esc(p.name)}</h1>
<p class="lede">${esc(p.short)}</p>
${hasCover(p.slug) ? pic(p.slug, { sizes: '(min-width: 920px) 880px, 92vw', alt: `${p.name}: preview of the spreadsheet with example data`, cls: 'cover', eager: true }) : ''}
<div class="product">
  <div>
    <h2>Who it's for</h2><p>${esc(p.for)}</p>
    <h2>The problem it solves</h2><p>${esc(p.problem)}</p>
    ${videoBlock(p.slug)}
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
      <p class="small muted">${p.billing ? `per month, or ${cad(p.billing.yearly_cents)} per year. Cancel any time.` : 'One-time purchase'}</p>
      ${buy}
      ${isBuyable(p) ? '' : `<p class="small muted" style="margin-top:12px">${p.billing ? 'Memberships open soon.' : 'This tool is being finished and isn\'t on sale yet.'}</p>`}
      <ul class="facts">
        <li>${esc(p.formats)}</li>
        <li>Delivered by email right after payment</li>
        <li>${p.billing ? 'Every January update included while you\'re a member' : 'Free January update for rates and limits'}</li>
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
<dt>What do I actually get?</dt><dd>A Google Sheets copy link and an Excel (.xlsx) file. Each one opens on a Start Here tab that walks you through setup in about five minutes. They arrive by email right after payment.</dd>
<dt>Do I need Excel?</dt><dd>No. A free Google account is enough to use the Google Sheets version, on a computer or phone.</dd>
<dt>Is this tax advice?</dt><dd>No. The tools organize your records using CRA categories. For advice about your situation, talk to an accountant or the CRA.</dd>
<dt>Are you affiliated with the CRA?</dt><dd>No.</dd>
<dt>Do prices include tax?</dt><dd>Prices are in Canadian dollars before tax. Our checkout provider, Payhip, adds any GST/HST that applies where you live and sends it to the government, as the law requires of online marketplaces. You'll see it at checkout before you pay.</dd>
<dt>Will it work in Quebec?</dt><dd>Yes. The tax presets include GST plus QST.</dd>
<dt>What if the file doesn't work for me?</dt><dd>Email us and we'll fix it. If we can't, see the <a href="/refunds/">refund policy</a>.</dd>
<dt>Do I get updates?</dt><dd>Yes. Each January's update to rates and limits is free for anyone who bought the tool.</dd>
<dt>Is there a subscription?</dt><dd>Optional. The <a href="/products/all-access-membership/">All-Access Membership</a> ($5 a month or $39 a year) includes every tool, every January update and any new tools we release while you're a member. Cancel any time. Buying tools one at a time is still a one-time price.</dd>
</dl>`);

prose('/delivery/', 'Delivery', 'How Loonie Ledger tools are delivered.', `
<p class="lede">Every tool is a digital download. Nothing is shipped.</p>
<ul>
<li>After payment, our checkout provider (Payhip) emails you a download link right away, and shows it on the confirmation page.</li>
<li>If the email hasn't arrived within 15 minutes, check your spam folder, then <a href="/contact/">contact us</a> with the email you bought with.</li>
<li>Google Sheets versions open as "Make a copy", so the copy is yours to edit.</li>
</ul>`);

const draftNote = `<p class="small muted">Last updated ${esc(site.policiesUpdated)}.</p>`;

prose('/refunds/', 'Refund policy', 'Refund policy for Loonie Ledger digital products.', `${draftNote}
<p>Because our tools are digital files you keep as soon as they're delivered, here's how refunds work:</p>
<ul>
<li><strong>If a file doesn't work</strong> (won't open, formulas broken) and we can't fix it within 7 days of you telling us, we refund you in full.</li>
<li><strong>If you bought the wrong tool or bought twice</strong>, contact us within 14 days of purchase and we'll refund or swap it.</li>
<li>Outside those cases we don't usually refund digital downloads, but email us and we'll look at every request.</li>
<li><strong>Memberships</strong> can be cancelled any time from your Payhip customer account (Settings, then Subscriptions) or by emailing us. Cancelling stops future payments. We don't refund the current month or year already paid, except in the cases above, and files you've already downloaded stay yours.</li>
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
<h2>Memberships</h2>
<p>The All-Access Membership renews automatically each month or year, at the price you signed up at, until you cancel. You can cancel any time; payments stop and you lose access to member downloads, but you keep files you've already downloaded under the licence above. If a payment fails, our checkout provider retries it and emails you before the membership ends.</p>
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
// Social videos, hosted here so Instagram/Facebook can fetch them by URL when we publish through their APIs.
mkdirSync(join(out, 'media'), { recursive: true });
if (existsSync(join(root, 'src/media'))) for (const f of readdirSync(join(root, 'src/media'))) copyFileSync(join(root, 'src/media', f), join(out, 'media', f));
// Icons for browsers, phones' home screens, and link previews (YouTube, Facebook, iMessage use these, not the SVG).
for (const f of readdirSync(join(root, 'src/icons'))) copyFileSync(join(root, 'src/icons', f), join(out, f));
writeFileSync(join(out, 'site.webmanifest'), JSON.stringify({ name: site.name, short_name: site.name, start_url: '/', display: 'standalone', background_color: '#f5f9f6', theme_color: '#1d5a45',
  icons: [{ src: '/icon-192.png', sizes: '192x192', type: 'image/png' }, { src: '/icon-512.png', sizes: '512x512', type: 'image/png' }] }));
mkdirSync(join(out, 'img'), { recursive: true });
for (const f of readdirSync(join(root, 'src/img'))) copyFileSync(join(root, 'src/img', f), join(out, 'img', f));
writeFileSync(join(out, 'favicon.svg'), coin.replace('class="brand-coin" ', 'xmlns="http://www.w3.org/2000/svg" '));
const paths = ['/', '/products/', '/gst-threshold-checker/', '/faq/', '/about/', '/contact/', '/delivery/', '/refunds/', '/privacy/', '/terms/', ...products.map((p) => `/products/${p.slug}/`)];
writeFileSync(join(out, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map((p) => `<url><loc>${site.baseUrl}${p}</loc></url>`).join('')}</urlset>\n`);
writeFileSync(join(out, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${site.baseUrl}/sitemap.xml\n`);
writeFileSync(join(out, '_headers'), `/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  X-Frame-Options: DENY\n  Permissions-Policy: camera=(), microphone=(), geolocation=()\n
/style.css\n  Cache-Control: public, max-age=31536000, immutable\n
/img/*\n  Cache-Control: public, max-age=86400, stale-while-revalidate=604800\n
/favicon.svg\n  Cache-Control: public, max-age=86400, stale-while-revalidate=604800\n
/favicon.ico\n  Cache-Control: public, max-age=86400, stale-while-revalidate=604800\n`);

console.log(`Built ${paths.length + 1} pages into dist/`);
for (const w of warnings) console.warn('WARNING:', w);
