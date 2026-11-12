// Daily evening Reel, 2026-11-11: "Claiming your car? Log every business trip." (CRA motor vehicle records, self-employed), music only.
// Canadian money mistake #6 (same mistake as the 2026-11-11 midday carousel). STYLE=light|dark (pin_style.py 2026-11-11 video -> dark).
// Usage: STYLE=dark node marketing/video/daily/2026-11-11.cjs <out.mp4> [preview-dir]
// Facts re-checked on canada.ca 2026-11-11 (evening):
//  - CRA "Motor vehicle records" (modified 2026-08-31): best evidence is a logbook for the entire year; each business trip: date,
//    destination, purpose, km; odometer at start and end of the fiscal period; after a base year, a 3-month sample logbook if within 10%.
//  - CRA "Motor vehicle expenses" (modified 2026-08-17): mixed use -> only the business portion; example
//    (27,000 business km / 30,000 total km) x $7,000 = $6,300.
// The odometer readings (41,250) are illustrative and labelled "example" on screen.
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
const odo = (n) => `<span style="display:inline-block;background:#0b1f19;border:3px solid #2a5a48;border-radius:16px;padding:6px 22px;font-family:monospace;letter-spacing:.08em;color:#e0b25a">${String(Math.round(n)).padStart(6, '0')}</span>`;

const scenes = [
  ['hook', 3.0, hookScene(['Claiming your car?', '<b class="h">Log every</b>', '<b class="h">business trip.</b>'], 'Canadian money mistake #6')],
  ['part', 1.8, (t) => { const x = ease(t / 1.6);
    return `${brand}
    <div style="position:absolute;top:520px;left:${60 + 720 * x}px;font-size:220px;transform:scaleX(-1)">🚗</div>
    <div style="position:absolute;left:0;right:0;top:770px;height:8px;background:repeating-linear-gradient(90deg,#e0b25a 0 60px,transparent 60px 120px);opacity:.6"></div>
    <div class="big" style="top:930px;font-size:100px;text-align:center;${st(fin(t, 0.2, 0.3))}">You can only claim the <span class="hl">business part.</span></div>
    <div class="small" style="top:1420px;text-align:center;font-size:36px;${st(fin(t, 0.6))}">Self-employed rules · Form T2125</div>`; }],
  ['km', 1.8, (t) => { const k = ease((t - 0.1) / 1.1);
    return `${brand}
    <div class="cap" style="top:330px;${st(fin(t, 0, 0.25))}"><span class="tag" style="font-size:40px">CRA's example</span></div>
    <div class="card" style="top:520px;${st(fin(t, 0.05, 0.3), 50)}">
      <div class="row" style="padding:44px 40px;font-size:52px"><span>Business km</span><b style="font-size:60px">${odo(27000 * k)}</b></div>
      <div class="row" style="padding:44px 40px;font-size:52px"><span>Total km</span><b style="font-size:60px">${odo(30000 * k)}</b></div>
    </div>
    <div class="cap" style="top:1060px;font-size:92px;${st(fin(t, 1.0, 0.3))}">27,000 <span class="bz">÷</span> 30,000</div>
    <div class="cap" style="top:1200px;font-size:72px;${st(fin(t, 1.2, 0.3))}">= <span class="bz">90%</span> business use</div>`; }],
  ['calc', 1.8, (t) => { const k = ease((t - 0.6) / 0.9);
    return `${brand}
    <div class="cap" style="top:330px;${st(fin(t, 0, 0.25))}"><span class="tag" style="font-size:40px">CRA's example</span></div>
    <div class="cap" style="top:540px;font-size:96px;${st(fin(t, 0.0, 0.3))}">90% <span class="bz">×</span> $7,000</div>
    <div class="cap" style="top:680px;font-size:48px;${st(fin(t, 0.2, 0.3))}">in car costs</div>
    <div class="cap" style="top:880px;font-size:190px;line-height:1;${st(fin(t, 0.5, 0.25))}">= <span class="bz">${money(Math.round(6300 * k / 10) * 10)}</span></div>
    <div class="cap" style="top:1130px;font-size:72px;${st(fin(t, 1.0, 0.3))}">deductible</div>
    <div class="small" style="top:1380px;text-align:center;font-size:34px;${st(fin(t, 1.1))}">Fuel, insurance, repairs, licence &amp; registration…</div>`; }],
  ['log', 1.8, (t) => `${brand}
    <div class="big" style="top:300px;font-size:92px;text-align:center;${st(fin(t, 0.0, 0.25))}">📒 Log <span class="hl">every trip</span></div>
    <div class="card" style="top:560px;${st(fin(t, 0.1, 0.3), 50)}">
      <div class="head"><span>KILOMETRE LOG</span><span>EACH TRIP</span></div>
      ${row('Date', fin(t, 0.3, 0.25))}${row('Destination', fin(t, 0.6, 0.25))}${row('Purpose', fin(t, 0.9, 0.25))}${row('Kilometres', fin(t, 1.2, 0.25))}
    </div>`],
  ['odo', 1.6, (t) => `${brand}
    <div class="cap" style="top:420px;font-size:80px;${st(fin(t, 0.0, 0.25))}">+ your <span class="bz">odometer</span></div>
    <div class="card" style="top:640px;${st(fin(t, 0.15, 0.3), 50)}">
      <div class="row" style="padding:44px 40px;font-size:52px;${st(fin(t, 0.3, 0.25), 20)}"><span>Jan 1</span><b style="font-size:60px">${odo(41250)}</b></div>
      <div class="row" style="padding:44px 40px;font-size:52px;${st(fin(t, 0.6, 0.25), 20)}"><span>Dec 31</span><b style="font-size:60px">${odo(41250 + 30000 * ease((t - 0.6) / 0.8))}</b></div>
    </div>
    <div class="cap" style="top:1180px;font-size:60px;${st(fin(t, 0.8, 0.3))}">at the start and end of the year</div>
    <div class="small" style="top:1420px;text-align:center;font-size:32px;${st(fin(t, 1.0))}">Readings shown are an example</div>`],
  ['sample', 1.8, (t) => { const f = fin(t, 0.5, 0.5); const n = Math.round(12 - 9 * f);
    return `${brand}
    <div class="cap" style="top:330px;font-size:64px;${st(fin(t, 0.0, 0.25))}">After one full year of logs…</div>
    <div style="position:absolute;left:0;right:0;top:520px;display:flex;justify-content:center;gap:60px;align-items:center">
      <div style="width:300px;height:340px;border-radius:32px;background:#16382d;border:4px solid #2a5a48;display:flex;flex-direction:column;align-items:center;justify-content:center">
        <div style="font-size:160px;font-weight:800;line-height:1;color:#e0b25a">${n}</div><div style="font-size:44px;font-weight:700">months</div></div>
    </div>
    <div class="cap" style="top:940px;font-size:66px;${st(fin(t, 0.9, 0.3))}">a <span class="bz">3-month sample</span> log can work</div>
    <div class="cap" style="top:1180px;font-size:48px;${st(fin(t, 1.1, 0.3))}">if it stays within <span class="bz">10%</span> of that year</div>`; }],
  ['end', 1.8, (t) => `${brand}
    <div class="big" style="top:440px;font-size:100px;${st(fin(t, 0.0, 0.25))}">Log trips, see your <span class="bz">business-use %.</span></div>
    <div class="small" style="top:900px;font-size:50px;color:#102a22;${st(fin(t, 0.25))}">The <b>Complete Bundle</b> includes a vehicle log.</div>
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
