// Daily evening Reel, 2026-11-19: "Your budget template thinks you're American." — Canadian money mistake #13.
// Music only (day-of-year 323, odd). STYLE=light|dark (pin_style.py 2026-11-19 video -> dark).
// Usage: STYLE=dark node marketing/video/daily/2026-11-19.cjs <out.mp4> [preview-dir]
// Facts (2026-11-19 evening): the canada.ca page text couldn't be fetched this run, so the account "jobs" stay at what each
// account's official canada.ca page title says: Tax-Free Savings Account, Registered Retirement Savings Plan,
// First Home Savings Account, Registered Education Savings Plans ("saving for your child's education"). No rates, limits or rules.
// Product claims from site/src/products.json (Canadian Household Budget: CAD monthly plan, TFSA/RRSP/FHSA/RESP + emergency fund lines, 12 months side by side).
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

const D = STYLE === 'dark';
const panel = D ? '#16382d' : '#fff', edge = D ? '#2a5a48' : '#cfe0d6', mute = D ? '#a9c7b8' : '#46605a', gold = D ? '#e0b25a' : '#9a6b14', red = D ? '#ff8a80' : '#b3261e';
const row = (label, right, o, extra = '') => `<div class="row" style="font-size:54px;padding:34px 44px;${st(o, 30)};${extra}"><b>${label}</b><span>${right}</span></div>`;
const usRows = ['401(k)', 'Roth IRA', '529 plan'];
const caRows = [['TFSA', 'Tax-free savings'], ['RRSP', 'Retirement'], ['FHSA', 'Your first home'], ['RESP', "A child's education"]];
const strike = (p) => `<div style="position:absolute;left:30px;top:50%;height:8px;width:${p * 92}%;background:${red};border-radius:4px"></div>`;
const usCard = (t, strikeAt) => `<div class="card" style="top:620px;${strikeAt != null ? '' : st(fin(t, 0, 0.3), 80)}">
  <div class="head"><span>💵 SAVINGS LINES</span><span>USD</span></div>
  ${usRows.map((r, i) => `<div style="position:relative">${row(r, '$ —', 1, strikeAt != null && fin(t, strikeAt + i * 0.45, 0.25) > 0 ? `color:${mute}` : '')}${strikeAt != null ? strike(fin(t, strikeAt + i * 0.45, 0.25)) : ''}</div>`).join('')}
</div>`;
const caCard = (t, nShow, jobsFrom, jobsTo) => `<div class="card" style="top:520px">
  <div class="head"><span>🍁 SAVINGS LINES</span><span>CAD</span></div>
  ${caRows.map(([a, j], i) => { const o = nShow == null ? 1 : fin(t, 0.15 + i * 0.4, 0.25); const jo = i < jobsFrom ? 1 : i < jobsTo ? fin(t, 0.2 + (i - jobsFrom) * 0.6, 0.3) : 0;
    return row(`<span style="color:${gold}">✓</span> ${a}`, `<span class="bz" style="opacity:${jo};display:inline-block;transform:translateX(${(1 - jo) * 60}px)">${j}</span>`, o); }).join('')}
</div>`;

const scenes = [
  ['hook', 3.0, hookScene(['Your budget', 'template thinks', `you're <b class="h">American.</b>`], 'Canadian money mistake #13')],
  ['spot', 1.8, (t) => `${brand}<div class="cap" style="top:400px;font-size:84px;${st(fin(t, 0.1, 0.3), 30)}">Spot the problem?</div>${usCard(t, null)}`],
  ['strike', 1.8, (t) => `${brand}<div class="cap red" style="top:400px;font-size:96px;${st(fin(t, 1.2, 0.25), 30)}">US accounts</div>${usCard(t, 0.1)}`],
  ['canada', 1.8, (t) => `${brand}<div class="cap" style="top:330px;font-size:76px">Use <span class="hl">Canadian</span> lines</div>${caCard(t, true, 0, 0)}`],
  ['jobs1', 1.8, (t) => `${brand}<div class="cap" style="top:330px;font-size:76px">Give each a job</div>${caCard(t, null, 0, 2)}`],
  ['jobs2', 1.8, (t) => `${brand}<div class="cap" style="top:330px;font-size:76px">Give each a job</div>${caCard(t, null, 2, 4)}`],
  ['month', 1.8, (t) => { const steps = ['Income', 'Bills', 'Spending', 'Savings'];
    return `${brand}<div class="cap" style="top:400px;font-size:76px">Plan the month in order</div>
    <div style="position:absolute;left:120px;right:120px;top:640px;display:flex;flex-direction:column;gap:26px;align-items:center">
      ${steps.map((s, i) => `<div style="${st(fin(t, 0.1 + i * 0.3, 0.25), 30)};width:100%;text-align:center;background:${panel};border:3px solid ${edge};border-radius:24px;padding:26px 0;font-size:58px;font-weight:800">${i ? '↓ ' : ''}${s}</div>`).join('')}
    </div>
    <div style="position:absolute;right:90px;top:1460px;opacity:${fin(t, 1.3, 0.2)};transform:rotate(-8deg) scale(${1 + 0.4 * (1 - fin(t, 1.3, 0.25))})"><span style="border:6px solid ${gold};color:${gold};border-radius:16px;padding:8px 26px;font-size:64px;font-weight:800">CAD</span></div>`; }],
  ['year', 1.8, (t) => { const z = 1.25 - 0.25 * ease(t / 0.8); const m = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${brand}<div class="cap" style="top:400px;font-size:80px;${st(fin(t, 0.4, 0.3), 30)}">Then compare <span class="bz">the whole year</span></div>
    <div style="position:absolute;left:90px;right:90px;top:680px;display:grid;grid-template-columns:repeat(4,1fr);gap:20px;transform:scale(${z});transform-origin:50% 0">
      ${m.map((x, i) => { const h = [62, 70, 55, 80, 66, 74, 58, 77, 69, 63, 72, 81][i];
        return `<div style="background:${panel};border:3px solid ${edge};border-radius:20px;height:230px;padding:16px;position:relative;opacity:${fin(t, i * 0.06, 0.2)}"><div style="font-size:34px;font-weight:700">${x}</div><div style="position:absolute;left:16px;right:16px;bottom:16px;height:${h * 1.6}px;background:${D ? '#1d5a45' : '#dcebe2'};border-radius:10px"></div><div style="position:absolute;left:16px;right:16px;bottom:16px;height:${h * 0.5}px;background:${gold};border-radius:10px"></div></div>`; }).join('')}
    </div>`; }],
  ['end', 1.8, (t) => `${brand}
    <div class="big" style="top:440px;font-size:100px;${st(fin(t, 0.0, 0.2))}">A monthly budget <span class="bz">built for Canada.</span></div>
    <div class="small" style="top:900px;font-size:50px;${st(fin(t, 0.2))}">Canadian <b>Household Budget</b></div>
    <div style="position:absolute;left:72px;top:1120px;${st(fin(t, 0.35))}"><span class="pill">Get it at Loonie Ledger</span></div>
    <div class="small" style="top:1500px;font-size:32px;${st(fin(t, 0.5))}">General info. Not tax advice.</div>`],
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
