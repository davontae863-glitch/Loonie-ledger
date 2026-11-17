// Daily evening Reel, 2026-11-16: "$30,000 in one quarter? Charge GST now." — Canadian money mistake #11.
// Voiced (Aspen). STYLE=light|dark (pin_style.py 2026-11-16 video -> light).
// Usage: STYLE=light node marketing/video/daily/2026-11-16.cjs <out.mp4> [preview-dir]
// Facts re-checked on canada.ca 2026-11-16 (evening):
//  - CRA "When to register for and start charging the GST/HST" (modified 2026-06-16): exceed $30,000 in a single calendar quarter ->
//    no longer a small supplier, charge GST/HST on the supply that made you exceed $30,000; register within 29 days of the effective date.
//    Exceed over four consecutive quarters but not in one -> no longer a small supplier at the end of the month following that quarter.
//    Example: consulting business, Q1 $2,000, Q2 $10,000, Q3 $38,000.
//    https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/gst-hst-businesses/when-register-charge.html
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
const tile = (q, amt, o, gold) => `<div style="flex:1;background:#fff;border:3px solid ${gold ? '#9a6b14' : '#cfe0d6'};border-radius:28px;padding:30px 10px;text-align:center;${st(o, 40)}">
  <div style="font-size:34px;font-weight:700;color:#46605a">${q}</div><div style="font-size:54px;font-weight:800;margin-top:10px" class="${gold ? 'bz' : ''}">${amt}</div></div>`;
const src = `<div class="small" style="top:1560px;text-align:center;font-size:30px">Source: canada.ca · When to register for GST/HST</div>`;

const scenes = [
  ['hook', 3.0, hookScene(['$30,000 in', 'one quarter?', '<b class="h">Charge GST</b>', '<b class="h">now.</b>'], 'Canadian money mistake #11')],
  ['example', 1.8, (t) => `${brand}
    <div style="position:absolute;left:0;right:0;top:400px;text-align:center;${st(fin(t, 0, 0.2))}"><span class="tag">CRA's example</span></div>
    <div class="big" style="top:520px;font-size:84px;text-align:center;${st(fin(t, 0.05, 0.25))}">A new consulting business</div>
    <div style="position:absolute;left:80px;right:80px;top:820px;display:flex;gap:26px">
      ${tile('Q1', '$2,000', fin(t, 0.2, 0.25))}${tile('Q2', '$10,000', fin(t, 0.5, 0.25))}${tile('Q3', '$38,000', fin(t, 0.8, 0.25), true)}
    </div>${src}`],
  ['cross', 1.8, (t) => { const v = Math.round(38000 * ease(t / 1.1)), over = v > 30000;
    return `${brand}
    <div class="small" style="top:420px;text-align:center;font-size:48px;font-weight:700">Q3 sales</div>
    <div class="cap ${over ? 'bz' : ''}" style="top:520px;font-size:200px;line-height:1">${money(v)}</div>
    <div style="position:absolute;left:140px;right:140px;top:820px;height:40px;background:#e1ece5;border-radius:20px;overflow:hidden"><div style="height:100%;width:${Math.min(100, v / 380)}%;background:${over ? '#9a6b14' : '#1d5a45'}"></div></div>
    <div style="position:absolute;left:${140 + 800 * 30 / 38 - 3}px;top:800px;width:6px;height:80px;background:#102a22"></div>
    <div class="small" style="top:900px;left:${140 + 800 * 30 / 38 - 120}px;right:auto;width:240px;text-align:center;font-size:32px;font-weight:700">$30,000</div>
    <div class="cap" style="top:1120px;font-size:72px;opacity:${fin(t, 1.0, 0.25)};transform:rotate(${over ? -4 * fin(t, 1.0, 0.3) : 0}deg)"><span style="text-decoration:line-through;text-decoration-color:#b3261e;text-decoration-thickness:8px">Small supplier</span></div>
    <div class="cap red" style="top:1260px;font-size:56px;${st(fin(t, 1.2, 0.25), 20)}">Not anymore</div>`; }],
  ['invoice', 1.8, (t) => `${brand}
    <div class="card" style="top:380px;${st(fin(t, 0, 0.3), 80)}">
      <div class="head"><span>INVOICE</span><span>Q3 sale</span></div>
      ${line('The sale that passed $30,000', '', 1)}
      ${line('<b class="bz">+ GST/HST</b>', '<span class="bz">✓ added</span>', fin(t, 0.5, 0.25), 'background:#fbf3e2')}
    </div>
    <div class="cap" style="top:1000px;font-size:76px;${st(fin(t, 0.7, 0.3), 30)}">Charge it on the sale that <span class="hl">took you over</span></div>${src}`],
  ['register', 1.8, (t) => `${brand}
    <div class="cap" style="top:420px;font-size:220px;line-height:1;opacity:${fin(t, 0, 0.2)};transform:scale(${1 + 0.2 * (1 - fin(t, 0, 0.3))})">⏳</div>
    <div class="cap" style="top:760px;font-size:96px;${st(fin(t, 0.2, 0.3), 30)}">Register within<br><span class="bz">29 days</span></div>
    <div class="small" style="top:1140px;text-align:center;font-size:40px;${st(fin(t, 0.6, 0.3), 20)}">of your effective date of registration</div>${src}`],
  ['split', 1.8, (t) => `${brand}
    <div class="card" style="top:400px">
      <div class="row" style="font-size:50px;padding:50px 40px;${st(fin(t, 0, 0.25), 30)}"><span>Over in <b>one</b> quarter</span><b class="bz">Right away</b></div>
      <div class="row" style="font-size:50px;padding:50px 40px;${st(fin(t, 0.6, 0.25), 30)}"><span>Over across <b>4</b> quarters</span><b class="grn" style="text-align:right">End of<br>next month</b></div>
    </div>
    <div class="cap" style="top:1100px;font-size:64px;${st(fin(t, 1.1, 0.3), 20)}">Two different rules</div>${src}`],
  ['add', 1.8, (t) => { const vals = [6000, 8000, 7500, 9000]; let run = 0;
    return `${brand}
    <div class="big" style="top:400px;font-size:96px;text-align:center">Add up <span class="hl">every</span> quarter</div>
    <div style="position:absolute;left:100px;right:100px;top:720px;height:90px;background:#e1ece5;border-radius:45px;overflow:hidden;display:flex">
      ${vals.map((v, i) => { const w = v / 30000 * 100 * fin(t, 0.2 + i * 0.3, 0.3); run += v * fin(t, 0.2 + i * 0.3, 0.3); return `<div style="width:${w}%;height:100%;background:${['#1d5a45', '#2f7a5e', '#4a9a7b', '#9a6b14'][i]}"></div>`; }).join('')}
    </div>
    <div class="cap" style="top:860px;font-size:110px">${money(Math.round(run / 10) * 10)} <span style="font-size:60px;color:#46605a">/ $30,000</span></div>
    <div class="small" style="top:1080px;text-align:center;font-size:36px">Illustration</div>`; }],
  ['end', 1.8, (t) => `${brand}
    <div class="big" style="top:440px;font-size:100px;${st(fin(t, 0.0, 0.2))}">Check your quarters <span class="bz">free.</span></div>
    <div class="small" style="top:860px;font-size:50px;color:#102a22;${st(fin(t, 0.2))}">Try the <b>free GST/HST checker</b>.</div>
    <div style="position:absolute;left:72px;top:1120px;${st(fin(t, 0.35))}"><span class="pill">Free at Loonie Ledger</span></div>
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
