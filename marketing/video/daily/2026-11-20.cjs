// Daily evening Reel, 2026-11-20: "Your new desk? Not an office expense." — Canadian money mistake #14.
// Voiced (Aspen). STYLE=light|dark (pin_style.py 2026-11-20 video -> dark).
// Usage: STYLE=dark node marketing/video/daily/2026-11-20.cjs <out.mp4> [preview-dir]
// Facts re-checked on canada.ca 2026-11-20 (evening):
//  - CRA "Line 8810 – Office expenses" (modified 2026-08-31): small items such as pens, pencils, paper clips, stationery, stamps;
//    calculators, filing cabinets, chairs, desks "are capital items".
//  - CRA "Line 9220 – Utilities" (modified 2026-08-31): percentage of airtime for a cellphone used to earn business income; not the home phone's basic monthly rate.
//  - CRA "Line 8523 – Meals and entertainment" (modified 2026-08-31): max 50% of the lesser of the amount incurred or a reasonable amount.
//  - CRA "Line 9936 – CCA" (modified 2026-08-31): can't deduct the cost of depreciable property in the year; deduct it over several years.
//  - CRA T4002 Chapter 3 (modified 2026-04-16): line 8521 Advertising; content requirements "do not apply if you advertise on foreign websites".
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
const panel = D ? '#16382d' : '#fff', edge = D ? '#2a5a48' : '#cfe0d6', mute = D ? '#a9c7b8' : '#46605a', gold = D ? '#e0b25a' : '#9a6b14', ink = D ? '#fff' : '#102a22';
const src = `<div class="small" style="top:1560px;text-align:center;font-size:30px">Source: canada.ca · Form T2125 expense lines</div>`;
const chip = (txt, extra = '') => `<div style="display:inline-block;background:${D ? '#24503f' : '#dcebe2'};border:3px solid ${edge};border-radius:22px;padding:16px 28px;font-size:40px;font-weight:700;color:${ink};white-space:nowrap;${extra}">${txt}</div>`;

// T2125 slot board: [line, label, chip text]
const SLOTS = [['8521', 'Advertising', 'Online ad'], ['8810', 'Office expenses', 'Pens &amp; stamps'], ['9220', 'Phone &amp; utilities', 'Cell airtime'], ['8523', 'Meals', 'Client lunch']];
const TOP = 560, SH = 170;
function board(filled, active, p, extra = {}) {
  return SLOTS.map(([n, lab, c], i) => {
    const y = TOP + i * SH, on = i < filled || (i === active && p >= 1);
    const glow = i === active ? `box-shadow:0 0 0 ${6 * (1 - Math.abs(2 * Math.min(1, p) - 1))}px ${gold}` : '';
    return `<div style="position:absolute;left:70px;right:70px;top:${y}px;height:${SH - 24}px;background:${panel};border:3px solid ${edge};border-radius:26px;display:flex;align-items:center;padding:0 30px;gap:24px;${glow}">
      <div style="font-size:52px;font-weight:800;color:${gold};width:150px">${n}</div>
      <div style="font-size:36px;font-weight:600;color:${mute};flex:1">${lab}</div>
      ${on ? chip(c) : ''}${on && extra[i] ? extra[i] : ''}</div>`;
  }).join('');
}
function sortScene(i, voiceCap, tag) {
  return (t) => {
    const p = ease((t - 0.15) / 0.7), y0 = 1360, y1 = TOP + i * SH + 30;
    const stamp = i === 3 ? { 3: `<div style="position:absolute;right:40px;top:-30px;transform:rotate(-8deg) scale(${1 + 0.5 * (1 - fin(t, 0.95, 0.25))});opacity:${fin(t, 0.95, 0.2)};border:6px solid ${gold};color:${gold};background:${panel};border-radius:14px;padding:2px 18px;font-size:46px;font-weight:800">50%</div>` } : {};
    const tg = i === 2 ? { 2: `<div style="position:absolute;right:40px;top:-26px;opacity:${fin(t, 0.95, 0.2)}"><span class="tag">business share</span></div>` } : {};
    const fly = p < 1 ? `<div style="position:absolute;left:${300 + 280 * p}px;top:${y0 + (y1 - y0) * p}px;transform:scale(${1.25 - 0.25 * p}) rotate(${(1 - p) * -6}deg)">${chip(SLOTS[i][2], `box-shadow:0 20px 40px rgba(0,0,0,.3)`)}</div>` : '';
    return `${brand}
    <div class="cap" style="top:380px;font-size:60px;${st(fin(t, 0, 0.25), 20)}">${voiceCap}</div>
    ${board(i, i, p, { ...stamp })}${fly}
    ${tag ? `<div class="small" style="top:1300px;text-align:center;font-size:40px;${st(fin(t, 1.0, 0.25), 20)}">${tag}</div>` : ''}${src}`;
  };
}

const PILE = ['Online ad', 'Pens &amp; stamps', 'Cell airtime', 'Client lunch', 'Desk 🪑'];
const scenes = [
  ['hook', 3.0, hookScene(['Your new desk?', '<b class="h">Not an office</b>', '<b class="h">expense.</b>'], 'Canadian money mistake #14')],
  ['pile', 1.8, (t) => `${brand}
    <div class="big" style="top:400px;text-align:center;font-size:120px;${st(fin(t, 0, 0.25), 30)}">Sort these <span class="bz">5</span></div>
    ${PILE.map((c, i) => { const o = fin(t, 0.2 + i * 0.18, 0.25); const x = [120, 560, 160, 540, 330][i], y = [760, 820, 990, 1060, 1230][i], r = [-6, 5, 4, -5, -2][i];
      return `<div style="position:absolute;left:${x}px;top:${y - (1 - o) * 260}px;opacity:${o};transform:rotate(${r}deg)">${chip(c, 'font-size:46px;padding:22px 34px')}</div>`; }).join('')}
    <div class="small" style="top:1420px;text-align:center;font-size:40px;${st(fin(t, 1.1, 0.25), 20)}">Which T2125 line?</div>`],
  ['ad', 1.8, sortScene(0, 'Online ad → <span class="bz">8521</span>')],
  ['office', 1.8, sortScene(1, 'Pens, paper, stamps → <span class="bz">8810</span>')],
  ['cell', 1.8, sortScene(2, 'Cell airtime → <span class="bz">9220</span>', 'Only the business share')],
  ['meals', 1.8, sortScene(3, 'Client lunch → <span class="bz">8523</span>', 'Usually only 50% counts')],
  ['desk', 2.4, (t) => {
    const a = ease(t / 0.55), b = t < 0.55 ? 0 : ease((t - 0.55) / 0.6);
    const x = 360 + 120 * a - 360 * b, y = 1500 - (1500 - (TOP + SH + 30)) * a + b * (1345 - (TOP + SH + 30));
    const shake = t > 0.5 && t < 0.75 ? Math.sin(t * 90) * 10 : 0;
    return `${brand}
    <div class="cap" style="top:380px;font-size:60px">Desk → <span class="red" style="opacity:${fin(t, 0.45, 0.15)}">not 8810</span></div>
    ${board(4, 1, 0)}
    <div style="position:absolute;left:${x + shake}px;top:${y}px;transform:rotate(${b * 8 - 4}deg)">${chip('Desk 🪑', `border-color:${b > 0 ? gold : edge};box-shadow:0 20px 40px rgba(0,0,0,.3)`)}</div>
    <div style="position:absolute;left:70px;right:70px;top:1300px;height:170px;border:4px dashed ${gold};border-radius:26px;display:flex;align-items:center;justify-content:flex-end;padding-right:36px;font-size:44px;font-weight:800;color:${gold};opacity:${fin(t, 0.6, 0.3)}">Capital item · CCA (9936)</div>
    <div class="small" style="top:1530px;text-align:center;font-size:46px;font-weight:700;color:${ink};${st(fin(t, 1.3, 0.3), 20)}">Claim it over several years</div>`; }],
  ['end', 2.4, (t) => `${brand}
    <div class="big" style="top:440px;font-size:100px;${st(fin(t, 0.0, 0.2))}">Every expense tagged with its <span class="bz">T2125 line.</span></div>
    <div class="small" style="top:1000px;font-size:50px;${st(fin(t, 0.2))}">Bookkeeping &amp; GST/HST <b>Tracker</b></div>
    <div style="position:absolute;left:72px;top:1180px;${st(fin(t, 0.35))}"><span class="pill">Get it at Loonie Ledger</span></div>
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
