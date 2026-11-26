// Daily evening Reel, 2026-11-25: "That $1,300 HST? Not your money." — Canadian money mistake #17.
// Music only (day-of-year 329, odd). STYLE=light|dark (pin_style.py 2026-11-25 video -> light).
// Usage: STYLE=light node marketing/video/daily/2026-11-25.cjs <out.mp4> [preview-dir]
// Facts re-checked on canada.ca 2026-11-25 evening: CRA "Information on deemed trust" (2024-04-10): "As a business that collects
// GST/HST, you hold in trust the GST/HST amounts you collect from your customers."; "You cannot use deemed trust amounts as cash flow.";
// "You can deduct input tax credits from the GST/HST you collected or billed in the period." CRA GST/HST calculator: Ontario HST 13%.
// All dollar amounts are a labelled example.
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
const panel = D ? '#16382d' : '#fff', edge = D ? '#2a5a48' : '#cfe0d6', mute = D ? '#a9c7b8' : '#46605a', gold = D ? '#e0b25a' : '#9a6b14', ink = D ? '#fff' : '#102a22', red = D ? '#ff8a80' : '#b3261e', chipbg = D ? '#24503f' : '#dcebe2';
const cap = (t, txt, top = 380) => `<div class="cap" style="top:${top}px;font-size:${txt.length > 34 ? 60 : 66}px;${st(fin(t, 0, 0.25), 20)}">${txt}</div>`;

// Bank-balance style bar: total width split into fee + locked HST chunk.
const row = (l, r, o = 1, opt = '') => `<div style="display:flex;justify-content:space-between;align-items:center;padding:30px 44px;border-top:2px solid ${edge};font-size:52px;font-weight:700;color:${ink};opacity:${o};transform:translateX(${(1 - o) * 40}px);${opt}">${l}<span>${r}</span></div>`;
const invoice = (inner) => `<div style="position:absolute;left:110px;right:110px;top:620px;background:${panel};border:4px solid ${edge};border-radius:36px;box-shadow:0 40px 80px -30px rgba(0,0,0,.45);overflow:hidden">
  <div style="background:${D ? '#0b1f19' : '#1d5a45'};color:#fff;font-weight:800;font-size:40px;padding:26px 44px;display:flex;justify-content:space-between;letter-spacing:.04em"><span>🧾 INVOICE</span><span style="font-size:30px;font-weight:700;opacity:.85">Example · Ontario</span></div>${inner}</div>`;
const lock = `<svg viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>`;

const scenes = [
  ['hook', 3.0, hookScene(['That <b class="h">$1,300</b>', 'HST?', 'Not your money.'], 'Canadian money mistake #17')],
  ['fee', 1.6, (t) => `${brand}${cap(t, 'You invoice a client')}
    ${invoice(row('Your fee', money(10000), fin(t, 0.25, 0.25)))}
    <div class="small" style="top:1250px;text-align:center;font-size:40px;font-weight:700;${st(fin(t, 0.7, 0.25), 20)}">Example only · you're GST/HST registered</div>`],
  ['hst', 1.6, (t) => { const n = Math.round(1300 * ease((t - 0.2) / 0.6)), tot = 10000 + n;
    return `${brand}${cap(t, 'Add <span class="bz">13% HST</span>')}
    ${invoice(row('Your fee', money(10000)) + row(`<span style="color:${gold}">+ HST 13%</span>`, `<span style="color:${gold}">${money(n)}</span>`, fin(t, 0.05, 0.2)) +
      row('<b>Client pays</b>', `<b>${money(tot)}</b>`, fin(t, 0.6, 0.25), `background:${chipbg};font-size:60px`))}`; }],
  ['trust', 1.6, (t) => { const p = ease((t - 0.35) / 0.45), o = fin(t, 0.9, 0.25);
    return `${brand}${cap(t, 'In your account: <span class="bz">$11,300</span>')}
    <div style="position:absolute;left:110px;right:110px;top:640px;height:220px;display:flex;gap:${p * 40}px">
      <div style="flex:10000;background:${D ? '#2a5a48' : '#1d5a45'};border-radius:28px;color:#fff;font-size:56px;font-weight:800;display:flex;align-items:center;justify-content:center">$10,000</div>
      <div style="flex:1300;min-width:240px;background:${gold};border-radius:28px;color:#102a22;font-size:44px;font-weight:800;display:flex;flex-direction:column;align-items:center;justify-content:center;transform:translateY(${p * 260}px)">${p > 0.5 ? lock : ''}<span>$1,300</span></div>
    </div>
    <div class="big" style="top:1260px;text-align:center;font-size:96px;${st(o, 30)}">Held in trust<br><span class="bz">for CRA</span></div>`; }],
  ['notcash', 1.6, (t) => { const x = fin(t, 0.3, 0.2);
    return `${brand}${cap(t, 'CRA says: <span class="bz">not cash flow</span>')}
    <div style="position:absolute;left:0;right:0;top:640px;display:flex;justify-content:center;gap:60px;font-size:200px">
      <span style="position:relative">☕<span style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:${red};font-weight:900;opacity:${x};transform:scale(${1 + 0.6 * (1 - x)})">✕</span></span>
      <span style="position:relative">💻<span style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:${red};font-weight:900;opacity:${fin(t, 0.5, 0.2)};transform:scale(${1 + 0.6 * (1 - fin(t, 0.5, 0.2))})">✕</span></span>
    </div>
    <div class="big" style="top:1150px;text-align:center;font-size:100px;color:${red};${st(fin(t, 0.8, 0.25), 20)}">Don't spend it.</div>`; }],
  ['period', 1.8, (t) => `${brand}${cap(t, 'Each reporting period')}
    <div style="position:absolute;left:110px;right:110px;top:600px;background:${panel};border:4px solid ${edge};border-radius:36px;overflow:hidden">
      ${row('GST/HST collected', `<span style="color:${gold}">${money(1300)}</span>`, fin(t, 0.1, 0.2))}
      ${row('− Input tax credits', 'your GST paid', fin(t, 0.4, 0.2), 'font-size:46px')}
    </div>
    <div style="position:absolute;left:0;right:0;top:1040px;text-align:center;font-size:120px;font-weight:800;color:${gold};opacity:${fin(t, 0.8, 0.2)}">↓</div>
    <div style="position:absolute;left:0;right:0;top:1220px;text-align:center;${st(fin(t, 1.0, 0.25), 30)}"><span style="display:inline-block;background:${D ? '#e0b25a' : '#1d5a45'};color:${D ? '#102a22' : '#fff'};border-radius:30px;padding:30px 60px;font-size:72px;font-weight:800">Send the rest to CRA</span></div>`],
  ['tip', 1.8, (t) => { const rows = [['Nov 3', '$2,000', '$260'], ['Nov 12', '$10,000', '$1,300'], ['Nov 20', '$800', '$104']];
    return `${brand}${cap(t, 'Log the GST/HST on <span class="bz">every sale</span>')}
    <div style="position:absolute;left:70px;right:70px;top:620px;background:${panel};border:3px solid ${edge};border-radius:32px;overflow:hidden;font-size:42px">
      <div style="display:grid;grid-template-columns:1fr 1.2fr 1.4fr;background:${D ? '#0b1f19' : '#1d5a45'};color:#fff;font-weight:700;font-size:32px;padding:24px 36px"><span>Date</span><span>Sale</span><span style="color:${D ? '#e0b25a' : '#f3d79a'}">GST/HST charged</span></div>
      ${rows.map(([d, s, g], i) => { const o = fin(t, 0.15 + i * 0.3, 0.2);
        return `<div style="display:grid;grid-template-columns:1fr 1.2fr 1.4fr;padding:28px 36px;border-top:2px solid ${edge};font-weight:700;color:${ink}"><span>${d}</span><span>${s}</span><span style="color:${gold};opacity:${o};transform:translateX(${(1 - o) * 30}px);display:inline-block">${g}</span></div>`; }).join('')}
    </div>
    <div class="small" style="top:1260px;text-align:center;font-size:36px;${st(fin(t, 1.1, 0.25), 20)}">Example numbers · Ontario 13% HST</div>`; }],
  ['end', 2.0, (t) => `${brand}
    <div class="big" style="top:440px;font-size:104px;${st(fin(t, 0.0, 0.2))}">GST/HST charged, <span class="bz">logged per sale</span></div>
    <div class="small" style="top:860px;font-size:52px;font-weight:700;color:${ink};${st(fin(t, 0.2))}">Bookkeeping & GST/HST Tracker</div>
    <div style="position:absolute;left:72px;top:1080px;${st(fin(t, 0.35))}"><span class="pill">Get it at Loonie Ledger</span></div>
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
