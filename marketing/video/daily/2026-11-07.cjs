// Daily evening Reel, 2026-11-07: "June 15 isn't your pay deadline" (self-employed filing vs payment deadline), music only.
// Tax-season prep #1. STYLE=light|dark (pin_style.py 2026-11-07 video -> light).
// Usage: STYLE=light node marketing/video/daily/2026-11-07.cjs <out.mp4> [preview-dir]
// Facts re-checked on canada.ca 2026-11-07:
//  - "Deadline for Filing Income Tax and Benefit Returns: June 15, 2027" (self-employed or spouse/common-law partner self-employed);
//    "Payment Deadline: April 30, 2027, for balances owing." (modified 2026-10-16)
//    https://www.canada.ca/en/services/taxes/resources-for-small-and-medium-businesses/2026-tax-deadlines-canadian-businesses-self-employed-individuals.html
//  - "Pay your balance owing on or before April 30 to avoid interest and penalties." (modified 2026-09-17)
//    https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/important-dates-individuals.html
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

const scenes = [
  ['hook', 3.0, hookScene(['<b class="h">June 15</b>', "isn't your", 'pay deadline'], 'Self-employed? · Tax-season prep #1')],
  ['file', 2.6, (t) => `${brand}
    <div class="cap" style="top:560px;${st(fin(t, 0.0, 0.2))}">Self-employed? <b>File</b> by</div>
    <div class="big" style="top:740px;text-align:center;font-size:150px;${st(fin(t, 0.2, 0.3))}"><span class="bz">June 15</span></div>
    <div class="small" style="top:960px;text-align:center;font-size:46px;${st(fin(t, 0.9))}">2027 · for your 2026 return</div>
    <div class="small" style="top:1140px;text-align:center;font-size:40px;${st(fin(t, 1.5))}">(Also if your spouse or partner is self-employed.)</div>`],
  ['pay', 2.6, (t) => `${brand}
    <div class="cap" style="top:560px;${st(fin(t, 0.0, 0.2))}">But tax you owe is due</div>
    <div class="big" style="top:740px;text-align:center;font-size:150px;${st(fin(t, 0.2, 0.3))}"><span class="red">April 30</span></div>
    <div class="small" style="top:960px;text-align:center;font-size:46px;${st(fin(t, 0.9))}">2027 · same as everyone else</div>`],
  ['timeline', 2.8, (t) => `${brand}
    <div class="big" style="top:300px;font-size:88px;text-align:center;${st(fin(t, 0.0, 0.25))}">Two dates. <span class="hl">Two jobs.</span></div>
    <div class="card" style="top:640px">
      <div class="row" style="padding:40px;font-size:52px;${st(fin(t, 0.4, 0.3), 30)}"><span style="font-weight:700">April 30</span><b class="red">Pay</b></div>
      <div class="row" style="padding:40px;font-size:52px;${st(fin(t, 1.0, 0.3), 30)}"><span style="font-weight:700">June 15</span><b class="grn">File</b></div>
    </div>
    <div class="cap" style="top:1180px;font-size:54px;${st(fin(t, 1.7), 20)}">Pay by April 30 to avoid<br><span class="bz">interest and penalties.</span></div>`],
  ['tip', 2.2, (t) => `${brand}
    <div class="cap" style="top:520px;${st(fin(t, 0.0, 0.25))}">So you need your number</div>
    <div class="big" style="top:720px;font-size:110px;text-align:center;${st(fin(t, 0.3))}"><span class="hl">before</span> April.</div>`],
  ['end', 2.6, (t) => `${brand}
    <div class="big" style="top:500px;font-size:100px;${st(fin(t, 0.0, 0.25))}">Know what you <span class="bz">owe</span> early.</div>
    <div class="small" style="top:930px;font-size:50px;color:#102a22;${st(fin(t, 0.3))}">The <b>Bookkeeping &amp; GST/HST Tracker</b> keeps your year in one place.</div>
    <div style="position:absolute;left:72px;top:1200px;${st(fin(t, 0.5))}"><span class="pill">Get it at Loonie Ledger</span></div>
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
