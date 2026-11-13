// Daily evening Reel, 2026-11-12: "Don't charge QST on the GST." (GST + QST on one Quebec invoice), voiced (Aspen).
// Canadian money mistake #7 (same mistake as the 2026-11-12 midday carousel). STYLE=light|dark (pin_style.py 2026-11-12 video -> light).
// Usage: STYLE=light node marketing/video/daily/2026-11-12.cjs <out.mp4> [preview-dir]
// Facts re-checked on canada.ca 2026-11-12 (evening):
//  - CRA "GST/HST calculator (and rates)": Quebec 5% GST, 9.975% provincial rate.
//    https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/gst-hst-businesses/charge-collect-which-rate/calculator.html
//  - CRA "GST/HST and QST information for financial institutions" (modified 2026-10-06): the QST is a provincial tax separate
//    from the GST/HST and "is calculated on the sale price for goods and services, without the GST."
//    https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/gst-hst-businesses/charge-collect-which-rate/financial-institutions.html
// The $1,000 / $50.00 / $99.75 / $1,149.75 and the wrong $104.74 (9.975% x $1,050) are illustrative arithmetic ("Example" on screen).
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
const cnt = (t, s, v) => '$' + (v * ease((t - s) / 0.6)).toFixed(2);

const scenes = [
  ['hook', 3.0, hookScene(["Don't charge QST", '<b class="h">on the GST.</b>'], 'Canadian money mistake #7')],
  ['rates', 1.8, (t) => `${brand}
    <div class="big" style="top:420px;font-size:100px;text-align:center;${st(fin(t, 0.0, 0.25))}">Quebec has <span class="hl">two</span> sales taxes</div>
    <div style="position:absolute;left:0;right:0;top:860px;display:flex;justify-content:center;gap:40px">
      <div class="card" style="position:static;width:440px;padding:50px 20px;text-align:center;${st(fin(t, 0.3, 0.3), 60)}"><div class="bz" style="font-size:120px;font-weight:800">5%</div><div style="font-size:52px;font-weight:800">GST</div><div style="font-size:30px;color:#46605a">federal</div></div>
      <div class="card" style="position:static;width:440px;padding:50px 20px;text-align:center;${st(fin(t, 0.7, 0.3), 60)}"><div class="bz" style="font-size:120px;font-weight:800">9.975%</div><div style="font-size:52px;font-weight:800">QST</div><div style="font-size:30px;color:#46605a">Quebec</div></div>
    </div>`],
  ['invoice', 5.4, (t) => `${brand}
    <div class="big" style="top:260px;font-size:84px;text-align:center;${st(fin(t, 0.0, 0.25))}">Both on <span class="hl">your fee</span></div>
    <div class="card" style="top:480px;${st(fin(t, 0.0, 0.3), 60)}">
      <div class="head"><span>EXAMPLE INVOICE</span><span>Quebec client</span></div>
      ${line('Your fee', '$1,000.00', 1, t < 1.8 ? 'background:#fdf3dc' : '')}
      ${line('GST 5% <span style="font-size:32px;color:#46605a">on $1,000</span>', `<span class="bz">${cnt(t, 1.9, 50)}</span>`, fin(t, 1.8, 0.3), t >= 1.8 && t < 3.6 ? 'background:#fdf3dc' : '')}
      ${line('QST 9.975% <span style="font-size:32px;color:#46605a">on $1,000</span>', `<span class="bz">${cnt(t, 3.7, 99.75)}</span>`, fin(t, 3.6, 0.3), t >= 3.6 ? 'background:#fdf3dc' : '')}
    </div>
    <div class="cap" style="top:1180px;font-size:200px;line-height:1;opacity:${t < 1.8 ? 1 : 0}"><span class="bz">$1,000</span></div>
    <div class="cap" style="top:1240px;font-size:60px;${st(fin(t, 3.9, 0.3), 20)}">↑ QST is on the <span class="bz">$1,000</span>, too</div>`],
  ['wrong', 1.8, (t) => { const x = fin(t, 0.5, 0.3);
    return `${brand}
    <div class="big" style="top:400px;font-size:96px;text-align:center;${st(fin(t, 0.0, 0.25))}">Not on fee <span class="hl">+ GST</span></div>
    <div class="card" style="top:760px;border-color:#b3261e;${st(fin(t, 0.1, 0.3), 50)}">
      <div class="row" style="font-size:52px;padding:44px 40px;position:relative"><span>QST on $1,050</span><b class="red">$104.74</b>
      <div style="position:absolute;left:30px;top:50%;height:8px;width:${x * 880}px;background:#b3261e;border-radius:4px"></div></div></div>
    <div class="cap red" style="top:1060px;font-size:130px;opacity:${x};transform:scale(${1 + 0.2 * (1 - x)})">✗ Wrong</div>`; }],
  ['total', 1.6, (t) => `${brand}
    <div class="big" style="top:360px;font-size:88px;text-align:center;${st(fin(t, 0.0, 0.25))}">Each tax on <span class="hl">its own line</span></div>
    <div class="card" style="top:640px">
      ${line('Fee', '$1,000.00', 1)}${line('GST 5%', '$50.00', 1)}${line('QST 9.975%', '$99.75', 1)}
      <div class="row" style="font-size:56px;font-weight:800;background:#fdf3dc"><span>Total</span><span class="bz">$${(1149.75 * ease(t / 0.8)).toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
    </div>
    <div class="small" style="top:1420px;text-align:center;font-size:34px">Example · QST is run by Revenu Québec</div>`],
  ['end', 2.0, (t) => `${brand}
    <div class="big" style="top:480px;font-size:100px;${st(fin(t, 0.0, 0.25))}">GST + QST preset <span class="bz">built in.</span></div>
    <div class="small" style="top:900px;font-size:50px;color:#102a22;${st(fin(t, 0.3))}">The <b>Freelancer Invoice Generator</b> does it for you.</div>
    <div style="position:absolute;left:72px;top:1180px;${st(fin(t, 0.5))}"><span class="pill">Get it at Loonie Ledger</span></div>
    <div class="small" style="top:1560px;font-size:32px;${st(fin(t, 0.7))}">Not tax advice. Check CRA and Revenu Québec for your situation.</div>`],
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
