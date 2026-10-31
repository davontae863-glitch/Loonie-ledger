// Renders product cover images (1600x1200 PNG) from data.json. Usage: node render.mjs
import { readFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
const here = new URL('.', import.meta.url).pathname;
const d = JSON.parse(readFileSync(here + 'data.json', 'utf8'));
const coin = readFileSync(here + '../../site/dist/favicon.svg', 'utf8');
const $ = (n) => '$' + Number(n).toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const $0 = (n) => '$' + Number(n).toLocaleString('en-CA', { maximumFractionDigits: 0 });
const pct = (n) => { const v = Math.round(n * 1000) / 10; return (Number.isInteger(v) ? v : v.toFixed(1)) + '%'; };

const css = `
*{box-sizing:border-box;margin:0}
body{width:1600px;height:1200px;background:#f5f9f6;font-family:Inter,sans-serif;color:#102a22;overflow:hidden;position:relative}
body:before{content:"";position:absolute;inset:0;background-image:linear-gradient(#e3eee7 1px,transparent 1px);background-size:100% 40px;opacity:.7}
.wrap{position:relative;display:grid;grid-template-columns:560px 1fr;gap:56px;padding:0 80px 120px;height:100%;align-items:center}
.brandbar{position:absolute;left:80px;top:72px}
.brand{display:flex;align-items:center;gap:14px;font-weight:700;font-size:28px;letter-spacing:-.01em}
.brand svg{width:46px;height:46px}
h1{font-family:"Inter Display",Inter,sans-serif;font-size:66px;line-height:1.04;letter-spacing:-.03em;font-weight:800;margin:0 0 28px}
.lede{font-size:27px;line-height:1.4;color:#46605a;margin-bottom:40px}
ul{list-style:none;padding:0;display:grid;gap:18px}
li{font-size:25px;line-height:1.3;padding-left:42px;position:relative}
li:before{content:"";position:absolute;left:0;top:6px;width:24px;height:24px;border-radius:6px;background:#1d5a45;
  -webkit-mask:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Crect width='24' height='24' rx='6'/%3E%3C/svg%3E")}
li:after{content:"";position:absolute;left:7px;top:11px;width:10px;height:6px;border-left:3px solid #fff;border-bottom:3px solid #fff;transform:rotate(-45deg)}
.foot{position:absolute;left:80px;bottom:72px;display:flex;gap:14px}
.chip{font-size:21px;font-weight:600;padding:10px 18px;border-radius:999px;background:#fff;border:1.5px solid #9dbcaa;color:#1d5a45}
.chip.b{border-color:#d9c08f;color:#7a5410;background:#fffaf0}
.sheet{background:#fff;border:1.5px solid #cfe0d6;border-radius:14px;box-shadow:0 30px 60px -20px rgba(16,42,34,.28),0 2px 0 #cfe0d6;overflow:hidden;margin-top:0}
.tabs{display:flex;gap:2px;background:#eef4f0;padding:12px 16px 0;border-bottom:1.5px solid #cfe0d6}
.tab{font-size:17px;padding:9px 16px;border-radius:8px 8px 0 0;color:#46605a}
.tab.on{background:#fff;color:#102a22;font-weight:600;border:1.5px solid #cfe0d6;border-bottom-color:#fff;margin-bottom:-1.5px}
.body{padding:28px 30px 32px}
.st{font-size:26px;font-weight:700;margin-bottom:18px;letter-spacing:-.01em}
table{width:100%;border-collapse:collapse;font-size:20px;font-feature-settings:"tnum" 1}
.kv{font-feature-settings:"tnum" 1}
th{background:#1d5a45;color:#fff;font-weight:600;text-align:left;padding:11px 12px;font-size:16px}
td{padding:11px 12px;border-bottom:1px solid #e1ece5}
td.n,th.n{text-align:right}
td.c{background:#eef4f0}
tr.t td{font-weight:700;background:#dcebe2;border-bottom:none}
.neg{color:#9c0006}.pos{color:#1f7a4d}
.ex{position:absolute;right:80px;bottom:30px;font-size:16px;color:#46605a;font-style:italic}
.bar{height:22px;border-radius:11px;background:#e1ece5;overflow:hidden;margin:10px 0 6px}
.bar i{display:block;height:100%;background:#1d5a45;border-radius:11px}
.kv{display:flex;justify-content:space-between;font-size:19px;color:#46605a}
.pill{display:inline-block;font-size:15px;font-weight:700;padding:4px 10px;border-radius:999px;background:#dcf0e3;color:#1f7a4d}
.pill.w{background:#fdf0dc;color:#8a5a0a}
`;

function page({ title, lede, bullets, chips, sheet, tabs, active }) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body><div class="brandbar"><div class="brand">${coin}Loonie Ledger</div></div><div class="wrap">
  <div><h1>${title}</h1><p class="lede">${lede}</p>
  <ul>${bullets.map((b) => `<li>${b}</li>`).join('')}</ul></div>
  <div class="sheet">${tabs ? `<div class="tabs">${tabs.map((t) => `<span class="tab${t === active ? ' on' : ''}">${t}</span>`).join('')}</div>` : ''}<div class="body">${sheet}</div></div>
  </div><div class="foot">${chips.map(([t, b]) => `<span class="chip${b ? ' b' : ''}">${t}</span>`).join('')}</div>
  <div class="ex">Example data shown</div></body></html>`;
}
const fmtChips = [['Excel (.xlsx)'], ['Works in Google Sheets'], ['Made for Canada', true]];

const covers = {};
{
  const b = d.bookkeeping;
  const q = b.threshold.slice(2, 6); const four = q.reduce((s, [, v]) => s + v, 0);
  covers['bookkeeping'] = page({
    title: 'Bookkeeping & GST/HST Tracker', lede: 'For sole proprietors who file a T2125.',
    bullets: ['Expenses sorted by T2125 line', 'GST/HST worked out by province', '$30,000 small-supplier tracker', 'Year-end summary for your return'],
    chips: fmtChips, tabs: ['Settings', 'Income', 'Expenses', 'GST Threshold', 'Year-End Summary'], active: 'Income',
    sheet: `<div class="st">Income</div><table><tr><th>Date</th><th>Client</th><th>Prov.</th><th class="n">Sale</th><th class="n">Rate</th><th class="n">GST/HST</th></tr>
      ${b.rows.map(([dt, c, p, a, r, t]) => `<tr><td>${dt}</td><td>${c}</td><td>${p}</td><td class="n">${$(a)}</td><td class="n c">${pct(r)}</td><td class="n c">${$(t)}</td></tr>`).join('')}</table>
      <div style="margin-top:28px"><div class="kv"><span><b style="color:#102a22">Last four quarters</b> (small-supplier test)</span><span><b style="color:#102a22">${$0(four)}</b> of $30,000</span></div>
      <div class="bar"><i style="width:${Math.min(100, four / 300)}%"></i></div><div class="kv"><span>${$0(30000 - four)} to go before you must register</span></div></div>`,
  });
}
{
  const v = d.invoice;
  covers['invoice'] = page({
    title: 'Freelancer Invoice Generator', lede: 'Professional invoices with the right Canadian sales tax.',
    bullets: ['GST, HST or GST + QST presets', 'Small-supplier mode with no tax line', 'Automatic numbering and due dates', 'Register shows paid and overdue'],
    chips: fmtChips,
    sheet: `<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:26px">
      <div style="font-size:18px;line-height:1.45;color:#46605a"><div style="font-size:24px;font-weight:700;color:#102a22">${v.from[0]}</div>${v.from[1]}<br>${v.from[2]}<br>${v.gst}</div>
      <div style="text-align:right"><div style="font-size:34px;font-weight:800;letter-spacing:.06em;color:#1d5a45">INVOICE</div>
      <div style="font-size:18px;line-height:1.6;color:#46605a">No. <b style="color:#102a22">${v.number}</b><br>Date ${v.date}<br>Due ${v.due}</div></div></div>
      <div style="font-size:15px;font-weight:700;color:#1d5a45;letter-spacing:.06em;text-transform:uppercase">Bill to</div>
      <div style="font-size:20px;margin:4px 0 22px">${v.bill_to}</div>
      <table><tr><th>Description</th><th class="n">Qty</th><th class="n">Price</th><th class="n">Amount</th></tr>
      ${v.lines.map(([a, q, p, t]) => `<tr><td>${a}</td><td class="n">${q}</td><td class="n">${$(p)}</td><td class="n">${$(t)}</td></tr>`).join('')}
      <tr><td></td><td></td><td class="n">Subtotal</td><td class="n">${$(v.subtotal)}</td></tr>
      <tr><td></td><td></td><td class="n">${v.tax[0]}</td><td class="n c">${$(v.tax[1])}</td></tr>
      <tr class="t"><td></td><td></td><td class="n">Total (CAD)</td><td class="n">${$(v.total)}</td></tr></table>`,
  });
}
{
  const r = d.room.rows;
  covers['room'] = page({
    title: 'TFSA / RRSP / FHSA Room Tracker', lede: 'See what you’ve used against the room CRA gives you.',
    bullets: ['Uses the figures from CRA My Account', 'Logs deposits, withdrawals, transfers', 'Turns red before you over-contribute', '2026 limits checked against CRA'],
    chips: fmtChips, tabs: ['My Room', 'Log', 'Limits'], active: 'My Room',
    sheet: `<div class="st">At a glance — 2026</div>
      ${r.map(([a, room, left, st]) => { const used = room - left; return `<div style="padding:18px 0;border-bottom:1px solid #e1ece5">
        <div class="kv"><span style="font-size:24px;font-weight:700;color:#102a22">${a}</span><span class="pill${left < 500 ? ' w' : ''}">${left === 0 ? 'Full' : st}</span></div>
        <div class="bar"><i style="width:${(used / room) * 100}%;${left < 500 ? 'background:#9a6b14' : ''}"></i></div>
        <div class="kv"><span>Used ${$0(used)} of ${$0(room)}</span><span><b style="color:#102a22">${$0(left)}</b> left</span></div></div>`; }).join('')}
      <p style="font-size:16px;color:#46605a;margin-top:18px">Room figures are typed in from CRA. The tracker never guesses them.</p>`,
  });
}
{
  const r = d.budget.rows;
  const cell = (v, neg) => v === null || v === undefined ? '' : `<span class="${neg ? (v < 0 ? 'neg' : v > 0 ? 'pos' : '') : ''}">${v < 0 ? '−' + $(-v) : $(v)}</span>`;
  covers['budget'] = page({
    title: 'Canadian Household Budget', lede: 'A monthly plan in Canadian dollars.',
    bullets: ['Lines for CCB and the GST/HST credit', 'TFSA, RRSP, FHSA and RESP savings', 'Plan vs actual, month and year', 'Easy to share with a partner'],
    chips: fmtChips, tabs: ['Plan', 'Log', 'Month View', 'Year View'], active: 'Month View',
    sheet: `<div class="st">June — plan vs actual</div><table><tr><th>Category</th><th class="n">Plan</th><th class="n">Actual</th><th class="n">Difference</th></tr>
      ${r.map(([c, p, a, df]) => `<tr${c === 'Left over' || c === 'Total income' ? ' class="t"' : ''}><td>${c}</td><td class="n">${$(p)}</td><td class="n c">${$(a)}</td><td class="n c">${cell(df, true)}</td></tr>`).join('')}</table>`,
  });
}
covers['bundle'] = page({
  title: 'The Complete Bundle', lede: 'Business and household money in order, in one download.',
  bullets: ['All four tools plus a bonus log', '$39 instead of $65', 'Free yearly rate and limit updates', 'Excel files that work in Google Sheets'],
  chips: fmtChips,
  sheet: `<div class="st">What’s inside</div>${[
    ['Bookkeeping & GST/HST Tracker', 'T2125 lines, sales tax, year-end summary'],
    ['Freelancer Invoice Generator', 'GST/HST presets, numbering, overdue view'],
    ['TFSA / RRSP / FHSA Room Tracker', 'Room left in each account'],
    ['Canadian Household Budget', 'Monthly plan, CAD, registered savings'],
    ['Vehicle & Home-Office Log', 'Bundle bonus: business km and home office'],
  ].map(([a, b], i) => `<div style="display:flex;gap:18px;align-items:center;padding:17px 0;${i < 4 ? 'border-bottom:1px solid #e1ece5' : ''}">
     <div style="width:52px;height:52px;border-radius:12px;background:${i === 4 ? '#fffaf0;border:1.5px solid #d9c08f' : '#eef4f0;border:1.5px solid #cfe0d6'};display:grid;place-items:center;font-weight:800;font-size:22px;color:${i === 4 ? '#7a5410' : '#1d5a45'}">${i + 1}</div>
     <div><div style="font-size:22px;font-weight:700">${a}</div><div style="font-size:18px;color:#46605a">${b}</div></div></div>`).join('')}`,
}).replace('<div class="ex">Example data shown</div>', '');

mkdirSync(here + 'out', { recursive: true });
const browser = await chromium.launch();
const pg = await browser.newPage({ viewport: { width: 1600, height: 1200 } });
for (const [k, html] of Object.entries(covers)) {
  await pg.setContent(html, { waitUntil: 'load' });
  await pg.screenshot({ path: `${here}out/${k}.png` });
  console.log('wrote', k);
}
await browser.close();
