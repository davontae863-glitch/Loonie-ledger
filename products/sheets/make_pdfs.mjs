// One-page PDF per product with the Google Sheets "make a copy" link. Usage: node make_pdfs.mjs
import { readFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
const here = new URL('.', import.meta.url).pathname;
const L = JSON.parse(readFileSync(here + 'links.json', 'utf8'));
const coin = readFileSync(here + '../../site/dist/favicon.svg', 'utf8');
const url = (id) => `https://docs.google.com/spreadsheets/d/${id}/copy`;
const css = `@page{size:Letter;margin:0}*{box-sizing:border-box;margin:0}body{font-family:Inter,sans-serif;color:#102a22;padding:64px 72px;background:#fff}
.brand{display:flex;align-items:center;gap:12px;font-weight:700;font-size:20px}.brand svg{width:34px;height:34px}
h1{font-size:34px;letter-spacing:-.02em;margin:40px 0 10px;line-height:1.15}.lede{font-size:16px;color:#46605a;margin-bottom:28px;line-height:1.5}
.card{border:1.5px solid #cfe0d6;border-radius:12px;padding:20px 22px;margin-bottom:16px;background:#f5f9f6}
.card h2{font-size:18px;margin-bottom:10px}.btn{display:inline-block;background:#1d5a45;color:#fff;text-decoration:none;font-weight:700;font-size:16px;padding:12px 20px;border-radius:8px}
.raw{font-size:11px;color:#46605a;margin-top:10px;word-break:break-all}.raw a{color:#46605a}
ol{padding-left:22px;font-size:15px;line-height:1.6;margin:8px 0 24px}h3{font-size:17px;margin:26px 0 4px}
p.s{font-size:13px;color:#46605a;line-height:1.5;margin-top:6px}`;
function doc(title, items) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body>
  <div class="brand">${coin}Loonie Ledger</div>
  <h1>${title}<br>Google Sheets version</h1>
  <p class="lede">Prefer Google Sheets to Excel? Use the link below to get your own copy, saved to your Google Drive. The Excel file in your download is the same tool.</p>
  ${items.map(([n, id]) => `<div class="card"><h2>${n}</h2><a class="btn" href="${url(id)}">Make my copy</a><div class="raw">Or paste this into your browser: <a href="${url(id)}">${url(id)}</a></div></div>`).join('')}
  <h3>How it works</h3>
  <ol><li>Sign in to your Google account.</li><li>Tap <b>Make my copy</b>, then <b>Make a copy</b>.</li><li>Your copy opens and is saved in your Google Drive. Rename it if you like.</li><li>Open the <b>Start Here</b> tab and follow the steps.</li></ol>
  <p class="s">Your copy is private to you. Nobody else can see it, including us. On a phone, the Google Sheets app works best.</p>
  <p class="s">Problems? Email loonieledgerservices@gmail.com with your order number.</p>
  <p class="s">For your own use only. Please don't share this link or the file.</p></body></html>`;
}
const jobs = [];
for (const [k, [n, id]] of Object.entries(L)) if (id && k !== 'vehicle') jobs.push([`Loonie-Ledger-${n.replace(/[^A-Za-z0-9]+/g, '-').replace(/-+$/, '')}-Google-Sheets.pdf`, doc(n, [[n, id]])]);
if (Object.values(L).every(([, id]) => id)) jobs.push(['Loonie-Ledger-Complete-Bundle-Google-Sheets.pdf', doc('Complete Bundle', Object.values(L))]);
mkdirSync(here + 'out', { recursive: true });
const b = await chromium.launch(); const pg = await b.newPage();
for (const [f, html] of jobs) { await pg.setContent(html, { waitUntil: 'load' }); await pg.pdf({ path: here + 'out/' + f, format: 'Letter', printBackground: true }); console.log('wrote', f); }
await b.close();
