// Daily evening Reel, 2026-11-09: "Not registered? Don't charge GST." (CRA small supplier test), music only.
// Canadian money mistake #4 (same mistake as the 2026-11-09 midday carousel). STYLE=light|dark (pin_style.py 2026-11-09 video -> dark).
// Usage: STYLE=dark node marketing/video/daily/2026-11-09.cjs <out.mp4> [preview-dir]
// Facts re-checked on canada.ca 2026-11-09 (CRA RC4022 "General Information for GST/HST Registrants", date modified 2026-01-07):
//  - Small supplier: revenue (with associates') from worldwide taxable supplies of $30,000 or less in a single calendar quarter
//    and over the last four consecutive calendar quarters.
//  - If you don't register you do not charge GST/HST (other than certain real property supplies); you can't claim ITCs.
//  - Registered (incl. voluntarily): charge and remit GST/HST; may claim ITCs.
//    https://www.canada.ca/en/revenue-agency/services/forms-publications/publications/rc4022/general-information-gst-hst-registrants.html
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



const checks = [
  [1.6, '$30,000 or less', 'in one calendar quarter'],
  [3.4, '…and $30,000 or less', 'over the last 4 quarters'],
];

const scenes = [
  ['hook', 3.0, hookScene(['Not registered?', '<b class="h">Don\'t charge</b>', 'GST.'], 'Canadian money mistake #4')],
  ['invoice', 1.8, (t) => { const k = fin(t, 0.6, 0.35);
    return `${brand}
    <div class="card" style="top:420px;${st(fin(t, 0.0, 0.3), 80)}">
      <div class="head"><span>INVOICE #0007</span><span>Nov 9</span></div>
      <div class="row"><span>Logo design</span><b>$800.00</b></div>
      <div class="row" style="position:relative"><span style="opacity:${1 - 0.5 * k}">+ GST 5%</span><b style="opacity:${1 - 0.5 * k}">$40.00</b>
        <div style="position:absolute;left:30px;top:50%;height:10px;width:${(1080 - 220) * k}px;background:#e0b25a;border-radius:5px"></div></div>
      <div class="row"><span style="font-weight:700">Total</span><b>${k > 0.5 ? '$800.00' : '$840.00'}</b></div>
    </div>
    <div class="big" style="top:1080px;font-size:84px;text-align:center;${st(fin(t, 0.4))}">No GST/HST number = <span class="bz">no GST/HST on the bill.</span></div>
    <div class="small" style="top:1400px;text-align:center;font-size:34px;${st(fin(t, 0.8))}">(Generally — a few exceptions apply.)</div>`; }],
  ['checks', 6.6, (t) => `${brand}
    <div class="big" style="top:300px;font-size:88px;text-align:center;${st(fin(t, 0.0, 0.25))}">You're a <span class="hl">small supplier</span> if…</div>
    ${checks.map(([s, a, b], i) => { const o = fin(t, s, 0.3); const n = Math.round(30000 * ease((t - s) / 0.7));
      return `<div class="card" style="top:${620 + i * 330}px;${st(o, 40)}">
        <div style="padding:34px 44px;display:flex;gap:30px;align-items:center"><div class="grn" style="font-size:80px;font-weight:800">✓</div>
        <div><div class="bz" style="font-size:62px;font-weight:800">${a.replace('$30,000', money(Math.max(0, n)))}</div>
        <div style="margin-top:8px;font-size:44px;font-weight:700">${b}</div></div></div></div>`; }).join('')}
    <div class="cap" style="top:1330px;font-size:54px;${st(fin(t, 5.0, 0.3))}">Your associates' sales <span class="bz">count too.</span></div>`],
  ['voluntary', 2.0, (t) => `${brand}
    <div class="big" style="top:380px;font-size:92px;text-align:center;${st(fin(t, 0.0, 0.25))}">Register voluntarily?</div>
    <div class="card" style="top:700px;${st(fin(t, 0.3), 60)}">
      <div class="row" style="padding:40px;font-size:50px"><span>→ Then you <b>must charge it</b></span></div>
      <div class="row" style="padding:40px;font-size:50px;${st(fin(t, 0.8), 20)}"><span>→ You can claim <b class="bz">input tax credits</b></span></div>
    </div>`],
  ['end', 2.2, (t) => `${brand}
    <div class="big" style="top:480px;font-size:100px;${st(fin(t, 0.0, 0.25))}">Check your <span class="bz">last 4 quarters.</span></div>
    <div class="small" style="top:900px;font-size:50px;color:#102a22;${st(fin(t, 0.3))}">The <b>GST/HST threshold checker</b> does the math.</div>
    <div style="position:absolute;left:72px;top:1120px;${st(fin(t, 0.5))}"><span class="pill">Free at Loonie Ledger</span></div>
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
