// Daily evening Reel, 2026-11-06: "Charging 13% HST to every client?" (GST vs HST by province), voiced (Aspen).
// Canadian money mistake #1 (same mistake as the 2026-11-06 midday carousel). STYLE=light|dark (pin_style.py 2026-11-06 video -> light).
// Usage: STYLE=light node marketing/video/daily/2026-11-06.cjs <out.mp4> [preview-dir]
// Facts re-checked on canada.ca 2026-11-06:
//  - Rates: ON 13% HST; NS 14% HST (on or after April 1, 2025); NB, NL, PE 15% HST; AB, BC, MB, NT, NU, QC, SK, YT 5% GST.
//    https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/gst-hst-businesses/charge-collect-which-rate/calculator.html
//  - Services: "The place of supply is the province of the recipient's address" when obtained in the ordinary course of business (modified 2026-07-15).
//    https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/gst-hst-businesses/charge-collect-place-supply.html
//  - PST: separate provincial tax; canada.ca refers PST questions to each province.
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

const rows = [
  [1.4, 'Ontario', '13%'],
  [2.8, 'Nova Scotia', '14%'],
  [4.2, 'New Brunswick', '15%'],
  [4.2, 'Newfoundland and Labrador', '15%'],
  [4.2, 'Prince Edward Island', '15%'],
];

const scenes = [
  ['hook', 3.0, hookScene(['Charging', '<b class="h">13% HST</b>', 'to every client?'], 'Canadian money mistake #1')],
  ['provinces', 6.6, (t) => `${brand}
    <div class="big" style="top:250px;font-size:96px;text-align:center;${st(fin(t, 0.0, 0.25))}">Only <span class="hl">5 provinces</span><br>charge HST.</div>
    <div class="card" style="top:620px">
      <div class="head"><span>Province</span><span>HST</span></div>
      ${rows.map(([s, name, r]) => { const o = fin(t, s, 0.3); const on = t >= s && t < s + 1.5;
        return `<div class="row" style="padding:34px 40px;font-size:48px;${st(o, 30)};${on ? 'background:#eef4f0;' : ''}"><span style="font-weight:700">${name}</span><b class="bz" style="font-size:60px">${r}</b></div>`; }).join('')}
    </div>
    <div class="cap" style="top:1500px;font-size:48px;color:#46605a;${st(fin(t, 4.8), 20)}">Nova Scotia dropped to 14% on April 1, 2025.</div>`],
  ['gst', 2.0, (t) => { const n = Math.min(5, Math.round(5 * ease(t / 0.8)));
    return `${brand}
    <div class="cap" style="top:430px;${st(fin(t, 0.0, 0.2))}">Everywhere else:</div>
    <div class="big" style="top:620px;text-align:center;font-size:400px;line-height:1" ><span class="bz">${n}%</span></div>
    <div class="cap" style="top:1110px;font-size:96px">GST</div>
    <div class="small" style="top:1330px;text-align:center;font-size:40px;${st(fin(t, 0.5))}">AB · BC · MB · QC · SK · YT · NT · NU</div>`; }],
  ['services', 2.2, (t) => `${brand}
    <div class="cap" style="top:480px;${st(fin(t, 0.0, 0.25))}">Selling a service?</div>
    <div class="big" style="top:700px;font-size:88px;text-align:center;${st(fin(t, 0.3))}">Your <span class="hl">client's address</span> usually sets the rate.</div>`],
  ['pst', 1.8, (t) => `${brand}
    <div class="big" style="top:640px;font-size:96px;text-align:center;${st(fin(t, 0.0, 0.25))}"><span class="bz">PST</span> & Quebec's <span class="bz">QST</span></div>
    <div class="cap" style="top:800px;font-size:64px;${st(fin(t, 0.35))}">are separate provincial taxes.</div>`],
  ['end', 2.4, (t) => `${brand}
    <div class="big" style="top:500px;font-size:100px;${st(fin(t, 0.0, 0.25))}">Keep every <span class="bz">tax line</span> right.</div>
    <div class="small" style="top:930px;font-size:50px;color:#102a22;${st(fin(t, 0.3))}">The <b>Freelancer Invoice Generator</b> does it for you.</div>
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
