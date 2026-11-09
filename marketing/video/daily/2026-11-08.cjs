// Daily evening Reel, 2026-11-08: "Over $100? Your invoice needs this number." (what a Canadian invoice must show), voiced (Aspen).
// Canadian money mistake #3 (same mistake as the 2026-11-08 midday carousel). STYLE=light|dark (pin_style.py 2026-11-08 video -> light).
// Usage: STYLE=light node marketing/video/daily/2026-11-08.cjs <out.mp4> [preview-dir]
// Facts re-checked on canada.ca 2026-11-08 (CRA "Input tax credits", date modified 2026-10-14):
//  - Under $100: supplier's business/trading name, invoice date, total amount paid or payable.
//  - $100-$499.99: plus the GST/HST charged (or that the total includes it), status of each supply if mixed, supplier's GST/HST registration number.
//  - $500 or more: plus buyer's name, brief description, terms of payment.
//    https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/gst-hst-businesses/calculate-prepare-report/input-tax-credit.html
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const OUTFILE = path.resolve(process.argv[2] || 'render.mp4');
const PREVIEW = process.argv[3];
const W = 1080, H = 1920, FPS = 30;
const coin = fs.readFileSync(path.join(__dirname, '../../../site/dist/favicon.svg'), 'utf8');
const STYLE = process.env.STYLE || 'light';
const CSS = `*{box-sizing:border-box;margin:0}html,body{width:${W}px;height:${H}px;overflow:hidden}
body{background:#f5f9f6;font-family:Inter,sans-serif;color:#102a22;position:relative;font-feature-settings:"tnum" 1}
body:before{content:"";position:absolute;inset:0;background-image:linear-gradient(#e3eee7 2px,transparent 2px);background-size:100% 64px;opacity:.6}
.brand{position:absolute;left:72px;top:110px;display:flex;align-items:center;gap:18px;font-weight:700;font-size:40px}
.brand svg{width:64px;height:64px}
.big{position:absolute;left:72px;right:72px;font-family:"Inter Display",Inter,sans-serif;font-weight:800;letter-spacing:-.03em;line-height:1.05}
.cap{position:absolute;left:60px;right:60px;text-align:center;font-weight:800;font-size:64px;line-height:1.12;letter-spacing:-.02em}
.small{position:absolute;left:72px;right:72px;font-size:40px;color:#46605a;line-height:1.4}
.hl{background:#1d5a45;color:#fff;padding:0 .18em;border-radius:.12em;box-decoration-break:clone;-webkit-box-decoration-break:clone}
.bz{color:#9a6b14}.red{color:#b3261e}.grn{color:#1f7a4d}
.card{position:absolute;left:80px;right:80px;background:#fff;border:3px solid #cfe0d6;border-radius:32px;box-shadow:0 40px 80px -30px rgba(16,42,34,.35);overflow:hidden}
.row{display:flex;justify-content:space-between;align-items:center;padding:30px 40px;border-bottom:2px solid #e1ece5;font-size:42px}
.row:last-child{border-bottom:none}
.head{background:#1d5a45;color:#fff;font-weight:700;font-size:34px;padding:24px 40px;display:flex;justify-content:space-between}
.pill{display:inline-block;background:#fff;border:3px solid #9dbcaa;border-radius:999px;padding:18px 34px;font-size:40px;font-weight:700;color:#1d5a45}
.tag{display:inline-block;font-size:30px;font-weight:700;padding:8px 18px;border-radius:12px;background:#dcebe2;color:#1d5a45}
.quote{position:absolute;left:90px;right:90px;border-left:12px solid #9a6b14;padding:10px 0 10px 44px;font-size:56px;font-weight:700;line-height:1.25}` + (STYLE === 'dark' ? fs.readFileSync(path.join(__dirname, '../video-dark.css'), 'utf8') : '');

const clamp = (x) => Math.min(1, Math.max(0, x));
const ease = (x) => 1 - Math.pow(1 - clamp(x), 3);
const fin = (t, s, d = 0.35) => ease((t - s) / d);
const st = (o, dy = 40) => `opacity:${o};transform:translateY(${(1 - o) * dy}px)`;
const brand = `<div class="brand">${coin}Loonie Ledger</div>`;
const money = (n) => (n < 0 ? '−' : '') + '$' + Math.abs(n).toLocaleString('en-CA');



// hookScene() from batch.cjs, plus a small series kicker above the hook and inline highlight via <b class="h">.
function hookScene(lines, kicker) {
  return (t) => {
    const z = 1 + 0.06 * ease(t / 0.6), bar = ease(t / 0.5);
    const D = STYLE === 'dark', bg = D ? '#102a22' : '#f5f9f6', ink = D ? '#fff' : '#102a22', hi = D ? '#e0b25a' : '#9a6b14', sub2 = D ? '#cfe7da' : '#46605a', barc = D ? '#9a6b14' : '#1d5a45';
    return `<div style="position:absolute;inset:0;background:${bg}"></div>
    <div style="position:absolute;left:60px;right:60px;top:380px;height:1000px;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;transform:scale(${z});transform-origin:50% 50%">
      ${kicker ? `<div style="margin-bottom:48px;font-size:40px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:${sub2}">${kicker}</div>` : ''}
      <div style="font-family:'Inter Display',Inter,sans-serif;font-weight:800;letter-spacing:-.03em;line-height:1.05;font-size:128px;color:${ink}">
        ${lines.map((txt) => `<div>${txt.replace(/<b class="h">/g, `<b style="color:${hi}">`)}</div>`).join('')}
      </div>
      <div style="margin-top:44px;height:14px;width:${560 * bar}px;background:${barc};border-radius:7px"></div>
    </div>`;
  };
}


const tiers = [
  [0.0, 'Under $100', 'Your name · date · total'],
  [2.2, '$100 – $499.99', '+ GST/HST number + tax charged'],
  [4.4, '$500 or more', '+ client name · description · terms'],
];

const scenes = [
  ['hook', 3.0, hookScene(['Over <b class="h">$100?</b>', 'Your invoice', 'needs this number.'], 'Canadian money mistake #3')],
  ['number', 2.0, (t) => `${brand}
    <div class="cap" style="top:380px;${st(fin(t, 0.0, 0.25))}">Your invoice</div>
    <div class="card" style="top:560px;${st(fin(t, 0.0, 0.35), 80)}">
      <div class="head"><span>INVOICE #0042</span><span>Nov 8</span></div>
      <div class="row"><span>Design work</span><b>$400.00</b></div>
      <div class="row" style="background:#fdf3dc"><span style="font-weight:700">GST/HST #</span><span class="bz" style="font-weight:800">_____________</span></div>
      <div class="row"><span>GST 5%</span><b>$20.00</b></div>
    </div>
    <div class="big" style="top:1260px;font-size:88px;text-align:center;${st(fin(t, 0.5))}">Your <span class="hl">GST/HST number</span></div>`],
  ['itc', 2.2, (t) => `${brand}
    <div class="cap" style="top:520px;font-size:60px;color:#46605a;${st(fin(t, 0.0, 0.25))}">If you charge GST/HST:</div>
    <div class="big" style="top:700px;font-size:96px;text-align:center;${st(fin(t, 0.3))}">business clients need it to claim their <span class="bz">input tax credits.</span></div>`],
  ['tiers', 6.6, (t) => `${brand}
    <div class="big" style="top:260px;font-size:84px;text-align:center;${st(fin(t, 0.0, 0.25))}">What CRA looks for</div>
    <div class="cap" style="top:380px;font-size:44px;color:#46605a;${st(fin(t, 0.1, 0.25))}">by invoice total</div>
    ${tiers.map(([s, amt, what], i) => { const o = fin(t, s, 0.3); const on = t >= s && t < s + 2.2;
      return `<div class="card" style="top:${560 + i * 330}px;${st(o, 40)};${on ? 'border-color:#9a6b14;' : ''}">
        <div style="padding:34px 44px"><div class="bz" style="font-size:64px;font-weight:800">${amt}</div>
        <div style="margin-top:12px;font-size:46px;font-weight:700">${what}</div></div></div>`; }).join('')}`],
  ['check', 1.9, (t) => { const o = fin(t, 0.2, 0.3);
    return `${brand}
    <div class="card" style="top:560px">
      <div class="row" style="padding:44px 40px;font-size:52px;background:${o > 0.5 ? '#e5f3ea' : '#fdf3dc'}"><span style="font-weight:700;white-space:nowrap">GST/HST #</span><span class="${o > 0.5 ? 'grn' : 'bz'}" style="font-weight:800;white-space:nowrap;font-size:46px">${o > 0.5 ? '123456789 RT0001 ✓' : '_____________'}</span></div>
    </div>
    <div class="big" style="top:900px;font-size:92px;text-align:center;${st(fin(t, 0.0, 0.25))}">One missing line can <span class="hl">hold up</span> their claim.</div>`; }],
  ['end', 2.3, (t) => `${brand}
    <div class="big" style="top:500px;font-size:100px;${st(fin(t, 0.0, 0.25))}">Every line, <span class="bz">every invoice.</span></div>
    <div class="small" style="top:930px;font-size:50px;color:#102a22;${st(fin(t, 0.3))}">The <b>Freelancer Invoice Generator</b> fills them in for you.</div>
    <div style="position:absolute;left:72px;top:1140px;${st(fin(t, 0.5))}"><span class="pill">Get it at Loonie Ledger</span></div>
    <div class="small" style="top:1560px;font-size:32px;${st(fin(t, 0.7))}">Not tax advice. Check CRA for your situation.</div>`],
];

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: W, height: H } });
  const set = (inner) => page.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>${CSS}</style></head><body>${inner}</body></html>`);
  if (PREVIEW) {
    fs.mkdirSync(PREVIEW, { recursive: true });
    for (const [n, secs, fn] of scenes) for (const tt of [0, secs / 2, secs - 0.05]) {
      await set(fn(tt)); await page.screenshot({ path: path.join(PREVIEW, `${n}-${tt.toFixed(1)}.png`) });
    }
    await browser.close(); return;
  }
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-pix_fmt', 'yuv420p', '-r', String(FPS), '-movflags', '+faststart', OUTFILE]);
  const done = new Promise((res, rej) => ff.on('close', (c) => (c === 0 ? res() : rej(new Error('ffmpeg ' + c)))));
  for (const [, secs, fn] of scenes) {
    const n = Math.round(secs * FPS);
    for (let f = 0; f < n; f++) {
      const t = f / FPS, fade = clamp((secs - t) / 0.25);
      await set(`<div style="position:absolute;inset:0;opacity:${fade}">${fn(t)}</div>`);
      const buf = await page.screenshot({ type: 'jpeg', quality: 92 });
      if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    }
  }
  ff.stdin.end(); await done; await browser.close();
  console.log('wrote', OUTFILE);
}
main().catch((e) => { console.error(e); process.exit(1); });
