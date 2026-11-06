// Infographic Pinterest pins (1000x1500) — owner request 2026-11-06 ("make my Pinterest look like this", an infographic
// tax-tips board). Our own layout/colours: two-tone headline, one worked example, icon flow with arrows, checklist,
// footer bar with the brand + "general info, not tax advice". White or green (STYLE from marketing/video/pin_style.py).
// Usage: node marketing/pins/make_pin.cjs spec.json out.jpg   (STYLE=light|dark env, default light)
// spec: { "kicker": "GST/HST", "title": ["Do I need to", "register?"], "titleHi": 1, "lead": "...",
//   "blocks": [ {"type":"flow","steps":[{"icon":"calendar","big":"$10,000","label":"Q1"}, ...],"result":{"icon":"alert","big":"$31,000","label":"Over $30,000 → register"}},
//               {"type":"example","rows":[["Q1","$10,000"],...],"total":["Total","$31,000"]},
//               {"type":"checks","items":["...","..."]},
//               {"type":"note","icon":"info","text":"..."} ],
//   "cta": "Free GST/HST checker", "source": "CRA, 2026", "art": "quarters" }   (art = an SVG in marketing/pins/art/, our own drawings)
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const spec = JSON.parse(fs.readFileSync(process.argv[2], 'utf8')), out = process.argv[3];
const D = (process.env.STYLE || 'light') === 'dark';
const C = D ? { bg: '#102a22', ink: '#ffffff', hi: '#e0b25a', mut: '#a9c7b8', card: '#16382d', line: '#2a5a48', acc: '#e0b25a', accInk: '#102a22', foot: '#0b1f19', footInk: '#cfe7da', soft: '#1d4537' }
              : { bg: '#ffffff', ink: '#102a22', hi: '#1d5a45', mut: '#46605a', card: '#f5f9f6', line: '#cfe0d6', acc: '#1d5a45', accInk: '#ffffff', foot: '#102a22', footInk: '#cfe7da', soft: '#e7f1eb' };
const root = path.join(__dirname, '../..');
const coin = fs.readFileSync(path.join(root, 'site/dist/favicon.svg'), 'utf8');
const I = { // simple line icons (own drawings), stroke = currentColor
  calendar: '<rect x="4" y="6" width="24" height="22" rx="3"/><path d="M4 12h24M10 3v6M22 3v6"/>',
  coins: '<ellipse cx="16" cy="9" rx="10" ry="4"/><path d="M6 9v6c0 2.2 4.5 4 10 4s10-1.8 10-4V9M6 15v6c0 2.2 4.5 4 10 4s10-1.8 10-4v-6"/>',
  alert: '<path d="M16 4 29 27H3z"/><path d="M16 12v7M16 23v.5"/>',
  check: '<circle cx="16" cy="16" r="12"/><path d="m10 16 4 4 8-9"/>',
  car: '<path d="M5 20l3-8h16l3 8v5H5z"/><circle cx="10" cy="25" r="2.5"/><circle cx="22" cy="25" r="2.5"/>',
  receipt: '<path d="M8 3h16v26l-4-2-4 2-4-2-4 2z"/><path d="M12 10h8M12 15h8M12 20h5"/>',
  bank: '<path d="M4 12 16 5l12 7z"/><path d="M7 13v10M13 13v10M19 13v10M25 13v10M4 27h24"/>',
  invoice: '<rect x="6" y="3" width="20" height="26" rx="2"/><path d="M10 9h12M10 14h12M10 19h7M19 23h3"/>',
  piggy: '<path d="M6 17c0-6 5-9 11-9s10 3 10 8c0 3-2 5-4 6v4h-4v-3h-5v3H10v-4c-2-1-4-3-4-5z"/><path d="M21 13h.5"/>',
  info: '<circle cx="16" cy="16" r="12"/><path d="M16 14v8M16 10v.5"/>',
  calculator: '<rect x="7" y="3" width="18" height="26" rx="3"/><path d="M11 8h10v5H11zM11 18h.5M16 18h.5M21 18h.5M11 23h.5M16 23h.5M21 23h.5"/>',
};
const icon = (n, size = 56, col = C.acc) => `<svg viewBox="0 0 32 32" width="${size}" height="${size}" fill="none" stroke="${col}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${I[n] || I.info}</svg>`;
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const blocks = (spec.blocks || []).map((b) => {
  if (b.type === 'flow') return `<div class="flow">${b.steps.map((s, i) => `${i ? '<div class="arr">→</div>' : ''}<div class="step">${icon(s.icon, 48)}<b>${esc(s.big)}</b><span>${esc(s.label)}</span></div>`).join('')}</div>
    ${b.result ? `<div class="down">↓</div><div class="result">${icon(b.result.icon || 'alert', 60, C.accInk)}<div><b>${esc(b.result.big)}</b><span>${esc(b.result.label)}</span></div></div>` : ''}`;
  if (b.type === 'example') return `<div class="ex">${b.title ? `<div class="exh">${esc(b.title)}</div>` : ''}${b.rows.map(([k, v]) => `<div class="exr"><span>${esc(k)}</span><b>${esc(v)}</b></div>`).join('')}${b.total ? `<div class="exr tot"><span>${esc(b.total[0])}</span><b>${esc(b.total[1])}</b></div>` : ''}</div>`;
  if (b.type === 'checks') return `<div class="checks">${b.items.map((x) => `<div>${icon(b.icon || 'check', 40)}<span>${esc(x)}</span></div>`).join('')}</div>`;
  if (b.type === 'note') return `<div class="note">${icon(b.icon || 'info', 44)}<span>${esc(b.text)}</span></div>`;
  return '';
}).join('');
const title = spec.title.map((t, i) => `<div style="color:${i === (spec.titleHi ?? spec.title.length - 1) ? C.hi : C.ink}">${esc(t)}</div>`).join('');
const html = `<!doctype html><html><head><meta charset="utf-8"><style>*{box-sizing:border-box;margin:0}
body{width:1000px;height:1500px;background:${C.bg};color:${C.ink};font-family:Inter,sans-serif;position:relative;overflow:hidden;display:flex;flex-direction:column}
.top{display:flex;justify-content:space-between;align-items:center;padding:56px 64px 0}
.brand{display:flex;align-items:center;gap:14px;font-weight:800;font-size:30px;letter-spacing:.02em}.brand svg{width:54px;height:54px}
.kicker{font-size:24px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:${C.accInk};background:${C.acc};padding:8px 18px;border-radius:999px}
h1{padding:26px 64px 0;font-family:"Inter Display",Inter,sans-serif;font-weight:800;font-size:${spec.titleSize || 92}px;line-height:1.02;letter-spacing:-.03em}
.lead{padding:16px 64px 0;font-size:29px;line-height:1.4;color:${C.mut}}
.body{flex:1;display:flex;flex-direction:column;justify-content:center;gap:20px;padding:18px 64px}
.flow{display:flex;align-items:stretch;gap:10px}.arr{align-self:center;font-size:40px;color:${C.mut}}
.step{flex:1;background:${C.card};border:3px solid ${C.line};border-radius:22px;padding:20px 8px;display:flex;flex-direction:column;align-items:center;gap:8px;text-align:center}
.step b{font-size:32px;letter-spacing:-.01em}.step span{font-size:23px;color:${C.mut};font-weight:600}
.down{text-align:center;font-size:44px;color:${C.mut};line-height:1}
.result{display:flex;align-items:center;gap:24px;background:${C.acc};color:${C.accInk};border-radius:24px;padding:24px 34px}
.result b{display:block;font-size:52px;letter-spacing:-.02em}.result span{font-size:28px;font-weight:600}
.ex{background:${C.card};border:3px solid ${C.line};border-radius:24px;overflow:hidden}
.exh{background:${C.soft};padding:16px 30px;font-size:24px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:${C.hi}}
.exr{display:flex;justify-content:space-between;padding:16px 30px;font-size:31px;border-top:2px solid ${C.line}}.exr:first-of-type{border-top:none}
.exr.tot{background:${C.soft};font-weight:800}.exr.tot b{color:${C.hi}}
.checks{display:flex;flex-direction:column;gap:16px}.checks div{display:flex;align-items:center;gap:20px;font-size:32px;font-weight:600}
.note{display:flex;gap:20px;align-items:center;background:${C.soft};border-radius:20px;padding:20px 26px;font-size:27px;line-height:1.35}.note svg{flex:none}
.cta{margin:0 64px 26px;display:flex;align-items:center;justify-content:space-between;border:3px solid ${C.acc};border-radius:999px;padding:16px 18px 16px 34px;font-size:30px;font-weight:700}
.cta b{background:${C.acc};color:${C.accInk};padding:12px 26px;border-radius:999px;white-space:nowrap}
.foot{background:${C.foot};color:${C.footInk};padding:24px 64px;font-size:22px;line-height:1.45;display:flex;justify-content:space-between;gap:24px}
.foot b{color:#fff}
.art{display:flex;justify-content:center;padding:18px 64px 0}.art svg{height:230px;width:auto;display:block}
</style></head><body>
<div class="top"><div class="brand">${coin}LOONIE LEDGER</div>${spec.kicker ? `<div class="kicker">${esc(spec.kicker)}</div>` : ''}</div>
<h1>${title}</h1>${spec.lead ? `<div class="lead">${esc(spec.lead)}</div>` : ''}${spec.art ? `<div class="art">${fs.readFileSync(path.join(__dirname, 'art', spec.art + '.svg'), 'utf8')}</div>` : ''}
<div class="body">${blocks}</div>
<div class="cta"><span>${esc(spec.ctaLead || 'Check yours in seconds')}</span><b>${esc(spec.cta || 'Free GST/HST checker')} →</b></div>
<div class="foot"><span><b>shop.loonieledger.workers.dev</b><br>Spreadsheet tools for Canadian money</span><span style="text-align:right">General info${spec.source ? ' · ' + esc(spec.source) : ''}<br>Not tax advice — check CRA for your situation.</span></div>
</body></html>`;
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1000, height: 1500 } });
  await p.setContent(html);
  const sh = await p.evaluate(() => document.body.scrollHeight), over = sh > 1500;
  await p.screenshot({ path: out, type: out.endsWith('.png') ? 'png' : 'jpeg', ...(out.endsWith('.png') ? {} : { quality: 92 }) });
  await b.close(); console.log(over ? 'WARNING: content overflows 1500px by ' + (sh - 1500) + 'px — shorten it' : 'ok', out);
})();
