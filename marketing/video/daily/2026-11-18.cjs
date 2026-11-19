// Daily evening Reel, 2026-11-18: "Your TFSA room on CRA? It's last year's." — Canadian money mistake #12.
// Voiced (Aspen). STYLE=light|dark (pin_style.py 2026-11-18 video -> dark).
// Usage: STYLE=dark node marketing/video/daily/2026-11-18.cjs <out.mp4> [preview-dir]
// Facts re-checked on canada.ca 2026-11-18 (evening):
//  - CRA "Calculate your TFSA contribution room" (modified 2026-02-20): CRA-account TFSA info updated once per year in the spring,
//    with the previous year's transactions; institutions report at the end of February of the following year; use your own records;
//    over your room -> taxed on the excess. https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/tax-free-savings-account/contributing/calculate-room.html
//  - CRA "If you owe tax on excess TFSA amounts" (modified 2025-10-14): 1% per month on the highest excess each month it remains.
//  - CRA "Where can you find your RRSP deduction limit" (modified 2026-01-05): RRSP Deduction Limit Statement on latest notice of assessment.
//  - CRA "Participating in your FHSAs" (modified 2026-09-17): participation room on latest notice of assessment; CRA account -> View FHSA details.
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
const D = STYLE === 'dark';
const panel = D ? '#16382d' : '#fff', edge = D ? '#2a5a48' : '#cfe0d6', mute = D ? '#a9c7b8' : '#46605a', gold = D ? '#e0b25a' : '#9a6b14';
const src = `<div class="small" style="top:1560px;text-align:center;font-size:30px">Source: canada.ca · TFSA, RRSP &amp; FHSA room</div>`;
const chip = (txt, o, extra = '') => `<div style="display:inline-block;background:${panel};border:3px solid ${edge};border-radius:24px;padding:22px 34px;font-size:44px;font-weight:700;${extra};opacity:${o}">${txt}</div>`;

const scenes = [
  ['hook', 3.0, hookScene(['Your TFSA room', 'on CRA?', `It's <b class="h">last year's.</b>`], 'Canadian money mistake #12')],
  ['spring', 1.8, (t) => { const flip = fin(t, 0.15, 0.5);
    return `${brand}
    <div style="position:absolute;left:340px;top:400px;width:400px;height:440px;background:${panel};border:4px solid ${edge};border-radius:36px;overflow:hidden;text-align:center;transform:perspective(900px) rotateX(${(1 - flip) * 70}deg);transform-origin:50% 0">
      <div style="background:${gold};color:#102a22;font-size:44px;font-weight:800;padding:24px 0">CRA update</div>
      <div style="font-size:150px;margin-top:40px">🌷</div><div style="font-size:52px;font-weight:800">Spring</div></div>
    <div class="cap" style="top:960px;font-size:84px;${st(fin(t, 0.5, 0.3), 30)}">CRA updates it <span class="hl">once a year</span></div>${src}`; }],
  ['banks', 1.8, (t) => { const x = 140 + 560 * ease((t - 0.3) / 0.8);
    return `${brand}
    <div class="cap" style="top:420px;font-size:72px;${st(fin(t, 0, 0.25), 30)}">Banks report <span class="bz">last year's</span> deposits</div>
    <div style="position:absolute;left:100px;top:760px;font-size:150px">🏦</div>
    <div style="position:absolute;right:100px;top:760px;width:220px;height:170px;border-radius:24px;background:${panel};border:3px solid ${edge};display:flex;align-items:center;justify-content:center;font-size:56px;font-weight:800">CRA</div>
    <div style="position:absolute;left:${x}px;top:800px;font-size:90px;opacity:${fin(t, 0.2, 0.2) * (1 - fin(t, 1.15, 0.2))}">📄</div>
    <div class="cap" style="top:1060px;font-size:56px;opacity:${fin(t, 0.9, 0.2)};transform:rotate(-4deg) scale(${1 + 0.3 * (1 - fin(t, 0.9, 0.25))})"><span style="border:6px solid ${gold};color:${gold};border-radius:16px;padding:8px 26px">End of February</span></div>${src}`; }],
  ['bounce', 1.8, (t) => { const p = t < 0.9 ? ease(t / 0.9) : 1 - 0.35 * Math.sin(Math.min(1, (t - 0.9) / 0.4) * Math.PI / 2);
    return `${brand}
    <div class="small" style="top:420px;text-align:center;font-size:44px;font-weight:700">Room on your CRA account</div>
    <div style="position:absolute;left:560px;right:100px;top:560px;height:150px;border-radius:30px;background:${D ? '#1d5a45' : '#1d5a45'};color:#fff;display:flex;align-items:center;justify-content:center;font-size:48px;font-weight:800">Last year</div>
    <div style="position:absolute;left:${60 + 340 * p}px;top:575px">${chip('This year +', 1, `color:${gold}`)}</div>
    <div class="cap red" style="top:900px;font-size:110px;${st(fin(t, 1.0, 0.25), 30)}">Not in there</div>${src}`; }],
  ['overflow', 1.8, (t) => { const w = 100 * ease(t / 0.9) + 22 * fin(t, 0.6, 0.6);
    return `${brand}
    <div class="cap" style="top:420px;font-size:80px">Go over your room?</div>
    <div style="position:absolute;left:100px;width:800px;top:700px;height:110px;border:5px solid ${edge};border-radius:24px"></div>
    <div style="position:absolute;left:105px;top:705px;height:100px;width:${Math.min(w, 100) * 7.9}px;background:#1d5a45;border-radius:18px"></div>
    <div style="position:absolute;left:${105 + 790}px;top:705px;height:100px;width:${Math.max(0, w - 100) * 7.9}px;background:#b3261e;border-radius:0 18px 18px 0"></div>
    <div class="small" style="top:830px;text-align:center;font-size:32px">Your room</div>
    <div class="cap red" style="top:980px;font-size:96px;opacity:${fin(t, 1.0, 0.2)};transform:scale(${1 + 0.4 * (1 - fin(t, 1.0, 0.25))})">+1% a month</div>
    <div class="small" style="top:1140px;text-align:center;font-size:40px;${st(fin(t, 1.2, 0.25), 20)}">on the TFSA excess</div>${src}`; }],
  ['where', 2.4, (t) => `${brand}
    <div class="cap" style="top:400px;font-size:76px;${st(fin(t, 0, 0.25), 30)}">RRSP &amp; FHSA room?</div>
    <div class="card" style="top:620px">
      <div class="row" style="font-size:50px;padding:50px 40px;${st(fin(t, 0.2, 0.25), 30)}"><b>RRSP</b><span class="bz" style="text-align:right">Notice of<br>assessment</span></div>
      <div class="row" style="font-size:50px;padding:50px 40px;${st(fin(t, 0.7, 0.25), 30)}"><b>FHSA</b><span class="bz" style="text-align:right">Assessment or<br>CRA account</span></div>
    </div>${src}`],
  ['records', 1.8, (t) => `${brand}
    <div class="card" style="top:400px;${st(fin(t, 0, 0.25), 60)}">
      <div class="head"><span>📒 MY DEPOSITS · THIS YEAR</span></div>
      ${['January', 'April', 'August'].map((m, i) => line(m, `<span class="grn">✓</span>`, fin(t, 0.25 + i * 0.25, 0.2))).join('')}
    </div>
    <div class="quote" style="top:1030px;${st(fin(t, 0.9, 0.3), 20)}">CRA: your own records are <span class="bz">more reliable</span></div>${src}`],
  ['end', 1.8, (t) => `${brand}
    <div class="big" style="top:440px;font-size:100px;${st(fin(t, 0.0, 0.2))}">Track all three rooms <span class="bz">in one sheet.</span></div>
    <div class="small" style="top:900px;font-size:50px;${st(fin(t, 0.2))}">TFSA/RRSP/FHSA <b>Room Tracker</b></div>
    <div style="position:absolute;left:72px;top:1120px;${st(fin(t, 0.35))}"><span class="pill">Get it at Loonie Ledger</span></div>
    <div class="small" style="top:1500px;font-size:32px;${st(fin(t, 0.5))}">Not tax advice. Check CRA for your situation.</div>`],
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
