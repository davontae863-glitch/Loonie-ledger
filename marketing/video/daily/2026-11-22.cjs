// Daily evening Reel, 2026-11-22: "Selling online? The platform tells CRA." — Tax-season prep #5.
// Voiced (Aspen). STYLE=light|dark (pin_style.py 2026-11-22 video -> dark).
// Usage: STYLE=dark node marketing/video/daily/2026-11-22.cjs <out.mp4> [preview-dir]
// Facts re-checked on canada.ca 2026-11-22 (evening):
//  - CRA "Reporting Rules for Digital Platforms" (modified 2025-08-01): relevant activities = sale of goods; relevant services
//    (rental of real or immovable property, personal service, rental of a means of transport, prescribed service).
//  - CRA "What information is shared" (modified 2024-12-09): name, primary address, TIN (SIN or business number), consideration and
//    fees by calendar quarter; operators give you a copy by January 31; CRA may assess $500 for each failure to provide your TIN.
//  - CRA "Who is affected" (modified 2024-11-12): excluded seller = less than 30 relevant activities for the sale of goods and total
//    consideration not over $2,800.
//  - CRA "Peer-to-peer" (modified 2025-01-31): report all peer-to-peer income as self-employment income (Form T2125); generally
//    register for GST/HST if more than $30,000 over four calendar quarters.
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
const panel = D ? '#16382d' : '#fff', edge = D ? '#2a5a48' : '#cfe0d6', mute = D ? '#a9c7b8' : '#46605a', gold = D ? '#e0b25a' : '#9a6b14', ink = D ? '#fff' : '#102a22', chipbg = D ? '#24503f' : '#dcebe2';
const src = `<div class="small" style="top:1600px;text-align:center;font-size:30px;color:${mute}">Source: canada.ca · Reporting Rules for Digital Platforms</div>`;
const chip = (txt, extra = '') => `<div style="display:inline-block;background:${chipbg};border:3px solid ${edge};border-radius:22px;padding:18px 30px;font-size:44px;font-weight:700;color:${ink};white-space:nowrap;${extra}">${txt}</div>`;
const CHIPS = ['🛍️ Sell goods', '🏠 Rent a place', '🚗 Rideshare &amp; delivery', '🧰 Gig services'];
const chipCol = (t, startAt, shrink = 0) => CHIPS.map((c, i) => {
  const o = startAt === null ? 1 : fin(t, startAt + i * 0.3, 0.25);
  return `<div style="position:absolute;left:0;right:0;top:${560 + i * 150 - shrink * i * 40}px;text-align:center;opacity:${o};transform:scale(${(0.7 + 0.3 * o) * (1 - 0.25 * shrink)})">${chip(c)}</div>`;
}).join('');
const ROWS = ['Name', 'Address', 'SIN or business number', 'Sales by quarter', 'Platform fees'];

const scenes = [
  ['hook', 3.0, hookScene(['Selling online?', 'The platform', '<b class="h">tells CRA.</b>'], 'Tax-season prep #5')],
  ['chips', 1.8, (t) => `${brand}
    <div class="cap" style="top:380px;font-size:60px;${st(fin(t, 0, 0.25), 20)}">You earn through an app or site</div>
    ${chipCol(t, 0.1)}${src}`],
  ['cra', 1.8, (t) => {
    const a = ease(t / 0.6), arr = fin(t, 0.5, 0.4), box = fin(t, 0.8, 0.3);
    return `${brand}
    <div class="cap" style="top:380px;font-size:60px;${st(fin(t, 0, 0.25), 20)}">Platforms report sellers to CRA</div>
    <div style="position:absolute;left:0;right:0;top:0;transform:translateY(${-60 * a}px)">${chipCol(t, null, a)}</div>
    <div style="position:absolute;left:530px;top:1060px;width:20px;height:${180 * arr}px;background:${gold};border-radius:10px"></div>
    <div style="position:absolute;left:490px;top:${1060 + 180 * arr - 10}px;width:0;height:0;border-left:50px solid transparent;border-right:50px solid transparent;border-top:56px solid ${gold};opacity:${arr}"></div>
    <div style="position:absolute;left:290px;right:290px;top:1320px;height:170px;background:${panel};border:5px solid ${gold};border-radius:30px;display:flex;align-items:center;justify-content:center;font-size:90px;font-weight:800;color:${ink};opacity:${box};transform:scale(${0.8 + 0.2 * box})">CRA</div>
    <div class="small" style="top:1520px;text-align:center;font-size:44px;font-weight:700;color:${ink};${st(fin(t, 1.1, 0.25), 20)}">Every year</div>`;
  }],
  ['report', 2.0, (t) => `${brand}
    <div class="cap" style="top:380px;font-size:60px;${st(fin(t, 0, 0.25), 20)}">What's in the report</div>
    <div style="position:absolute;left:90px;right:90px;top:540px;background:${panel};border:3px solid ${edge};border-radius:32px;overflow:hidden">
      <div style="background:${D ? '#0b1f19' : '#1d5a45'};color:#fff;font-weight:700;font-size:36px;padding:26px 40px">📄 Seller report · CRA</div>
      ${ROWS.map((r, i) => { const o = fin(t, 0.15 + i * 0.28, 0.22);
        return `<div style="display:flex;align-items:center;gap:26px;padding:30px 40px;border-top:2px solid ${edge};font-size:48px;font-weight:700;color:${ink};opacity:${o};transform:translateX(${(1 - o) * 40}px)"><span style="color:${gold}">✓</span>${r}</div>`; }).join('')}
    </div>${src}`],
  ['jan31', 1.8, (t) => {
    const flip = ease(t / 0.5), o = fin(t, 0.45, 0.3);
    return `${brand}
    <div style="position:absolute;left:290px;right:290px;top:520px;height:560px;background:${panel};border:4px solid ${edge};border-radius:40px;overflow:hidden;transform:perspective(1200px) rotateX(${(1 - flip) * 80}deg);transform-origin:50% 0">
      <div style="height:150px;background:${gold};color:#102a22;font-size:70px;font-weight:800;display:flex;align-items:center;justify-content:center">JAN</div>
      <div style="font-size:280px;font-weight:800;text-align:center;color:${ink};line-height:1.35">31</div>
    </div>
    <div class="big" style="top:1180px;text-align:center;font-size:110px;${st(o, 30)}">You get <span class="bz">a copy</span></div>
    <div class="small" style="top:1360px;text-align:center;font-size:40px;color:${mute};${st(fin(t, 0.9, 0.25), 20)}">of what the platform reported</div>${src}`;
  }],
  ['small', 2.0, (t) => {
    const s = fin(t, 1.0, 0.2);
    return `${brand}
    <div class="cap" style="top:380px;font-size:60px;${st(fin(t, 0, 0.25), 20)}">Small sellers of goods</div>
    <div style="position:absolute;left:90px;right:90px;top:560px;background:${panel};border:3px solid ${edge};border-radius:32px;padding:50px 50px;${st(fin(t, 0.1, 0.3), 30)}">
      <div style="font-size:56px;font-weight:800;color:${ink};line-height:1.25">Under <span class="bz">30</span> sales of goods</div>
      <div style="font-size:44px;font-weight:700;color:${mute};margin:22px 0">and</div>
      <div style="font-size:56px;font-weight:800;color:${ink};line-height:1.25;opacity:${fin(t, 0.5, 0.25)}"><span class="bz">$2,800</span> or less</div>
    </div>
    <div style="position:absolute;left:0;right:0;top:1180px;text-align:center;opacity:${s};transform:scale(${1 + 0.4 * (1 - s)})"><span style="display:inline-block;border:6px solid ${gold};color:${gold};border-radius:18px;padding:12px 36px;font-size:70px;font-weight:800">→ Not reported</span></div>${src}`;
  }],
  ['still', 1.8, (t) => {
    const s = fin(t, 0.35, 0.2);
    return `${brand}
    <div class="cap" style="top:380px;font-size:60px;${st(fin(t, 0, 0.25), 20)}">Reported or not…</div>
    <div style="position:absolute;left:90px;right:90px;top:620px;height:560px;background:${panel};border:3px solid ${edge};border-radius:32px;display:flex;align-items:center;justify-content:center"></div>
    <div style="position:absolute;left:110px;right:110px;top:720px;text-align:center;transform:rotate(-5deg) scale(${1 + 0.6 * (1 - s)});opacity:${s}">
      <div style="display:inline-block;border:8px solid ${gold};border-radius:24px;padding:28px 40px;font-size:76px;font-weight:800;line-height:1.15;color:${gold}">Business income still goes on your return</div></div>
    <div class="small" style="top:1260px;text-align:center;font-size:42px;color:${mute};${st(fin(t, 1.0, 0.25), 20)}">Self-employment income · Form T2125</div>${src}`;
  }],
  ['end', 2.0, (t) => `${brand}
    <div class="big" style="top:440px;font-size:100px;${st(fin(t, 0.0, 0.2))}">Over <span class="bz">$30,000</span> in 4 quarters?</div>
    <div class="small" style="top:860px;font-size:54px;font-weight:700;color:${ink};${st(fin(t, 0.2))}">Check if you need to register for GST/HST</div>
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
