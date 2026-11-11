// Daily evening Reel, 2026-11-10: "Your home office can't create a loss." (CRA business-use-of-home rules, self-employed), voiced (Aspen).
// Canadian money mistake #5 (same mistake as the 2026-11-10 midday carousel). STYLE=light|dark (pin_style.py 2026-11-10 video -> dark).
// Usage: STYLE=dark node marketing/video/daily/2026-11-10.cjs <out.mp4> [preview-dir]
// Facts re-checked on canada.ca 2026-11-10 (CRA "Business-use-of-home expenses", Form T2125 guide, date modified 2026-08-31):
//  - Deductible if the workspace is your principal place of business, or used only to earn business income and on a regular
//    and ongoing basis to meet clients, customers or patients.
//  - Business part on a reasonable basis, such as workspace area / total home area.
//  - You cannot use these expenses to increase or create a business loss; unused amounts can be used in the next fiscal period.
//  - Claimed on Form T2125, line 9945.
//    https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/sole-proprietorships-partnerships/report-business-income-expenses/completing-form-t2125/business-use-home-expenses.html
// The 150/1,500 sq ft and $2,000/$2,500 figures are illustrative examples (labelled "Example" on screen).
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




const tick = (o) => `<div class="grn" style="font-size:80px;font-weight:800;opacity:${o}">✓</div>`;

const scenes = [
  ['hook', 3.0, hookScene(['Your home office', '<b class="h">can\'t create</b>', '<b class="h">a loss.</b>'], 'Canadian money mistake #5')],
  ['qualify', 7.0, (t) => `${brand}
    <div class="big" style="top:300px;font-size:92px;text-align:center;${st(fin(t, 0.0, 0.25))}">🏠 First: <span class="hl">does it qualify?</span></div>
    <div class="card" style="top:600px;${st(fin(t, 1.6, 0.3), 50)}">
      <div style="padding:40px 44px;display:flex;gap:30px;align-items:center">${tick(fin(t, 1.8, 0.3))}
      <div style="font-size:60px;font-weight:800">Your <span class="bz">main place</span> of business</div></div></div>
    <div class="cap" style="top:930px;font-size:56px;color:#46605a;${st(fin(t, 3.1, 0.25), 20)}">— or —</div>
    <div class="card" style="top:1060px;${st(fin(t, 3.3, 0.3), 50)}">
      <div style="padding:40px 44px;display:flex;gap:30px;align-items:center">${tick(fin(t, 3.5, 0.3))}
      <div style="font-size:54px;font-weight:800;line-height:1.15">Used <span class="bz">only for business</span> + meeting clients regularly</div></div></div>
    <div class="small" style="top:1500px;text-align:center;font-size:34px;${st(fin(t, 5.2))}">Self-employed rules · Form T2125</div>`],
  ['floor', 2.4, (t) => { const k = ease((t - 0.5) / 0.9); const pct = Math.round(10 * k);
    return `${brand}
    <div class="big" style="top:280px;font-size:84px;text-align:center;${st(fin(t, 0.0, 0.25))}">Claim the <span class="hl">business part</span></div>
    <div style="position:absolute;left:140px;right:140px;top:560px;display:grid;grid-template-columns:repeat(5,1fr);gap:16px;${st(fin(t, 0.15, 0.3), 40)}">
      ${Array.from({ length: 10 }, (_, i) => `<div style="height:150px;border-radius:18px;${i === 0 ? `background:#e0b25a;color:#102a22;transform:scale(${1 + 0.08 * fin(t, 0.4, 0.3)})` : 'background:#16382d;border:3px solid #2a5a48'};display:flex;align-items:center;justify-content:center;font-size:30px;font-weight:800">${i === 0 ? 'Office' : ''}</div>`).join('')}
    </div>
    <div class="cap" style="top:1010px;font-size:58px;${st(fin(t, 0.4))}">150 ÷ 1,500 sq ft</div>
    <div class="cap" style="top:1110px;font-size:200px;line-height:1"><span class="bz">${pct}%</span></div>
    <div class="small" style="top:1400px;text-align:center;font-size:36px;${st(fin(t, 0.9))}">of heat, power, insurance… · Example</div>`; }],
  ['loss', 3.6, (t) => { const b = fin(t, 1.0, 0.4), m = fin(t, 2.4, 0.5);
    return `${brand}
    <div class="big" style="top:260px;font-size:88px;text-align:center;${st(fin(t, 0.0, 0.25))}">Stops at <span class="hl">$0</span></div>
    <div class="card" style="top:500px;${st(fin(t, 0.1, 0.3), 60)}">
      <div class="head"><span>EXAMPLE · T2125</span><span>2026</span></div>
      <div class="row"><span>Business income</span><b>$2,000</b></div>
      <div class="row"><span>Home office costs</span><b class="red">−$2,500</b></div>
      <div class="row" style="${st(fin(t, 0.7), 20)}"><span>You deduct now</span><b>−$2,000</b></div>
      <div class="row" style="${st(fin(t, 0.9), 20)}"><span style="font-weight:700">Net business income</span><b class="grn">$0 · no loss</b></div>
    </div>
    <div style="position:absolute;left:${340 - 0 * m}px;top:${1290 + 120 * m}px;opacity:${b};transform:scale(${1 + 0.15 * (1 - b)})"><span class="pill" style="font-size:52px">$500 left over</span></div>
    <div style="position:absolute;left:180px;right:180px;top:1380px;height:150px;border:4px dashed #e0b25a;border-radius:28px;opacity:${fin(t, 2.2, 0.3)};display:flex;align-items:flex-end;justify-content:center;padding-bottom:6px"></div>
    <div class="cap" style="top:1580px;font-size:56px;${st(fin(t, 2.6, 0.3), 20)}">→ carries forward to <span class="bz">next year</span></div>`; }],
  ['end', 2.0, (t) => `${brand}
    <div class="big" style="top:480px;font-size:100px;${st(fin(t, 0.0, 0.25))}">Track home costs <span class="bz">all year.</span></div>
    <div class="small" style="top:900px;font-size:50px;color:#102a22;${st(fin(t, 0.3))}">The <b>Bookkeeping &amp; GST/HST Tracker</b> keeps them together.</div>
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
