// Daily evening Reel, 2026-11-13: "Your 2025 receipts? Keep them until 2031." (CRA 6-year record-keeping rule), music only.
// Canadian money mistake #8 (same mistake as the 2026-11-13 midday carousel). STYLE=light|dark (pin_style.py 2026-11-13 video -> light).
// Usage: STYLE=light node marketing/video/daily/2026-11-13.cjs <out.mp4> [preview-dir]
// Facts re-checked on canada.ca 2026-11-13 (evening):
//  - CRA "Where to keep your records, for how long and how to request the permission to destroy them early" (modified 2026-08-03):
//    keep records six years from the end of the last tax year they relate to; late-filed return -> six years from the date you file it;
//    destroying early needs written permission from the CRA (Form T137 or a letter to your tax services office).
//  - CRA "Business records" (modified 2026-08-31): minimum six years from the end of the last tax year to which they relate;
//    original documents include sales invoices, receipts, bank deposit slips, contracts.
// "2025 -> Dec 31, 2031" is our arithmetic for a calendar tax year filed on time; on screen it says "at least".
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






const row = (label, o) => `<div class="row" style="${st(o, 20)}"><span>${label}</span><b class="grn" style="opacity:${o}">✓</b></div>`;

const scenes = [
  ['hook', 3.0, hookScene(['Your 2025 receipts?', 'Keep them until', '<b class="h">2031.</b>'], 'Canadian money mistake #8')],
  ['toss', 1.8, (t) => { const fall = ease(t / 0.7); const s = fin(t, 0.75, 0.2);
    return `${brand}
    <div style="position:absolute;left:0;right:0;top:${380 + 360 * fall}px;text-align:center;font-size:200px;transform:rotate(${-18 * fall}deg)">🧾</div>
    <div style="position:absolute;left:0;right:0;top:1130px;text-align:center;font-size:260px">🗑️</div>
    <div style="position:absolute;left:0;right:0;top:640px;text-align:center;opacity:${s};transform:rotate(-10deg) scale(${1.6 - 0.6 * s})">
      <span style="display:inline-block;border:12px solid #b3261e;color:#b3261e;border-radius:28px;padding:10px 50px;font-size:140px;font-weight:800;letter-spacing:.02em;background:rgba(255,255,255,.85)">NOT YET</span></div>`; }],
  ['rule', 1.8, (t) => `${brand}
    <div class="cap" style="top:420px;${st(fin(t, 0, 0.25))}"><span class="tag" style="font-size:40px">CRA's rule</span></div>
    <div class="cap" style="top:600px;font-size:110px;${st(fin(t, 0.1, 0.3))}">Keep records</div>
    <div class="cap" style="top:740px;font-size:200px;line-height:1;${st(fin(t, 0.3, 0.3))}"><span class="bz">6 years</span></div>
    <div class="cap" style="top:1060px;font-size:56px;${st(fin(t, 0.7, 0.3))}">from the end of the tax year<br>they relate to</div>`],
  ['years', 1.8, (t) => { const y = 2025 + Math.min(6, Math.floor(clamp((t - 0.35) / 1.1) * 6.999));
    return `${brand}
    <div class="cap" style="top:380px;font-size:72px;${st(fin(t, 0, 0.25))}">2025 tax year ends <span class="bz">Dec 31</span></div>
    <div class="card" style="top:620px;left:240px;right:240px;${st(fin(t, 0.1, 0.3), 50)}">
      <div class="head" style="justify-content:center;font-size:40px">DEC 31</div>
      <div style="text-align:center;font-size:220px;font-weight:800;padding:30px 0;color:${y === 2031 ? '#9a6b14' : '#102a22'}">${y}</div>
    </div>
    <div class="cap" style="top:1240px;font-size:60px;${st(fin(t, 0.6, 0.3))}">+ ${y - 2025} year${y - 2025 === 1 ? '' : 's'}</div>
    <div class="small" style="top:1420px;text-align:center;font-size:36px;${st(fin(t, 1.3))}">At least — calendar-year filers, filed on time</div>`; }],
  ['late', 1.8, (t) => `${brand}
    <div style="position:absolute;left:0;right:0;top:420px;text-align:center;font-size:180px;${st(fin(t, 0, 0.25))}">⏰</div>
    <div class="big" style="top:720px;font-size:110px;text-align:center;${st(fin(t, 0.15, 0.3))}">Filed late?</div>
    <div class="cap" style="top:920px;font-size:76px;${st(fin(t, 0.5, 0.3))}"><span class="bz">6 years</span> from the day<br>you filed</div>`],
  ['permission', 1.6, (t) => `${brand}
    <div style="position:absolute;left:0;right:0;top:420px;text-align:center;font-size:180px;${st(fin(t, 0, 0.25))}">🔒</div>
    <div class="big" style="top:720px;font-size:100px;text-align:center;${st(fin(t, 0.15, 0.3))}">Tossing them early?</div>
    <div class="cap" style="top:920px;font-size:68px;${st(fin(t, 0.45, 0.3))}">Needs CRA's <span class="bz">written OK</span></div>
    <div class="small" style="top:1100px;text-align:center;font-size:40px;${st(fin(t, 0.7))}">Form T137</div>`],
  ['keep', 1.8, (t) => `${brand}
    <div class="big" style="top:330px;font-size:92px;text-align:center;${st(fin(t, 0.0, 0.25))}">📁 Keep <span class="hl">all of it</span></div>
    <div class="card" style="top:580px;${st(fin(t, 0.1, 0.3), 50)}">
      <div class="head"><span>BUSINESS RECORDS</span><span>6 YRS</span></div>
      ${row('Sales invoices', fin(t, 0.3, 0.25))}${row('Receipts', fin(t, 0.6, 0.25))}${row('Bank deposit slips', fin(t, 0.9, 0.25))}${row('Contracts', fin(t, 1.2, 0.25))}
    </div>`],
  ['end', 1.8, (t) => `${brand}
    <div class="big" style="top:440px;font-size:100px;${st(fin(t, 0.0, 0.25))}">Log every expense by <span class="bz">T2125 line.</span></div>
    <div class="small" style="top:900px;font-size:50px;color:#102a22;${st(fin(t, 0.25))}">The <b>Bookkeeping &amp; GST/HST Tracker</b></div>
    <div style="position:absolute;left:72px;top:1160px;${st(fin(t, 0.4))}"><span class="pill">Get it at Loonie Ledger</span></div>
    <div class="small" style="top:1540px;font-size:32px;${st(fin(t, 0.55))}">Not tax advice. Check CRA for your situation.</div>`],
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
