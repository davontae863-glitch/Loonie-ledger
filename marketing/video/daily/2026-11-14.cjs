// Daily evening Reel, 2026-11-14 (weekly-review day, no draft; all batch-1 videos used): "Stop mixing business and personal money."
// Canadian money mistake #10 (calendar day 25 theme). Voiced (Aspen). STYLE=light|dark (pin_style.py 2026-11-14 video -> light).
// Usage: STYLE=light node marketing/video/daily/2026-11-14.cjs <out.mp4> [preview-dir]
// Facts re-checked on canada.ca 2026-11-14 (evening):
//  - CRA "Business records" (sole proprietorships, modified 2026-08-31): "You are required by law to keep records of all your
//    transactions." / "Always get receipts or other vouchers when you buy something for your business."
//    https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/sole-proprietorships-partnerships/business-records.html
//  - CRA "What are records, who has to keep them..." (modified 2025-06-17): "if your records do not support your claims, they could be disallowed."
//    https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/keeping-records/what-records-who-keep-them.html
// A separate business account is NOT a CRA rule — shown on screen as "Our tip". Statement rows are illustrative.
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


const line = (label, amt, o, extra = '') => `<div class="row" style="${st(o, 30)};${extra}"><span>${label}</span><b>${amt}</b></div>`;
const step = (n, txt, o) => `<div class="row" style="${st(o, 30)};justify-content:flex-start;gap:30px;font-size:46px"><b class="bz" style="font-size:64px;width:60px">${n}</b><span>${txt}</span></div>`;

const scenes = [
  ['hook', 3.0, hookScene(['Stop mixing', '<b class="h">business</b> and', 'personal money'], 'Canadian money mistake #10')],
  ['mess', 2.2, (t) => `${brand}
    <div class="big" style="top:300px;font-size:88px;text-align:center;${st(fin(t, 0.0, 0.25))}">One account = <span class="hl">guessing</span> at tax time</div>
    <div class="card" style="top:620px">
      <div class="head"><span>BANK STATEMENT</span><span>Example</span></div>
      ${line('Groceries', '$84.20', fin(t, 0.1, 0.25))}
      ${line('Printer ink', `<span class="bz">$46.99 ?</span>`, fin(t, 0.4, 0.25))}
      ${line('Streaming', '$18.99', fin(t, 0.7, 0.25))}
      ${line('Gas', `<span class="bz">$61.50 ?</span>`, fin(t, 1.0, 0.25))}
      ${line('Phone bill', `<span class="bz">$75.00 ?</span>`, fin(t, 1.3, 0.25))}
    </div>
    <div class="cap" style="top:1440px;font-size:64px;${st(fin(t, 1.5, 0.3), 20)}">Business or personal? <span class="bz">🤔</span></div>`],
  ['law', 2.8, (t) => `${brand}
    <div class="small" style="top:420px;text-align:center;font-size:44px;font-weight:700;${st(fin(t, 0.0, 0.25))}">CRA says:</div>
    <div class="quote" style="top:560px;font-size:76px;${st(fin(t, 0.15, 0.3), 50)}">Keep records of <span class="hl">all</span> your transactions.</div>
    <div class="cap" style="top:1060px;font-size:200px;line-height:1;opacity:${fin(t, 1.2, 0.3)};transform:scale(${1 + 0.15 * (1 - fin(t, 1.2, 0.3))})">⚖️</div>
    <div class="small" style="top:1330px;text-align:center;font-size:44px;${st(fin(t, 1.4, 0.3), 20)}">It's required by law</div>
    <div class="small" style="top:1500px;text-align:center;font-size:30px">Source: canada.ca · Business records</div>`],
  ['risk', 2.0, (t) => { const x = fin(t, 0.4, 0.3);
    return `${brand}
    <div class="big" style="top:420px;font-size:100px;text-align:center;${st(fin(t, 0.0, 0.25))}">No proof?</div>
    <div class="card" style="top:700px;border-color:#b3261e;${st(fin(t, 0.1, 0.3), 50)}">
      <div class="row" style="font-size:50px;padding:44px 40px"><span>Expense claim</span><b class="red">${x > 0.5 ? 'Disallowed' : '$46.99'}</b></div></div>
    <div class="cap red" style="top:1040px;font-size:80px;opacity:${x};transform:scale(${1 + 0.2 * (1 - x)})">Claims could be disallowed</div>
    <div class="small" style="top:1500px;text-align:center;font-size:30px">If records don't support them · canada.ca</div>`; }],
  ['fix', 3.6, (t) => `${brand}
    <div class="big" style="top:320px;font-size:96px;text-align:center;${st(fin(t, 0.0, 0.25))}">The <span class="hl">fix</span></div>
    <div style="position:absolute;left:0;right:0;top:500px;text-align:center;${st(fin(t, 0.1, 0.25))}"><span class="tag">Our tip</span></div>
    <div class="card" style="top:640px">
      ${step('1', 'A separate business account', fin(t, 0.2, 0.3))}
      ${step('2', 'Business money in &amp; out only there', fin(t, 1.0, 0.3))}
      ${step('3', 'A receipt for every purchase', fin(t, 1.8, 0.3))}
    </div>
    <div class="cap grn" style="top:1320px;font-size:72px;${st(fin(t, 2.6, 0.3), 20)}">✓ Tax time sorted</div>`],
  ['end', 2.2, (t) => `${brand}
    <div class="big" style="top:460px;font-size:100px;${st(fin(t, 0.0, 0.25))}">Every expense, <span class="bz">tagged &amp; totalled.</span></div>
    <div class="small" style="top:900px;font-size:50px;color:#102a22;${st(fin(t, 0.3))}">The <b>Bookkeeping &amp; GST/HST Tracker</b> keeps it sorted.</div>
    <div style="position:absolute;left:72px;top:1180px;${st(fin(t, 0.5))}"><span class="pill">Get it at Loonie Ledger</span></div>
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
