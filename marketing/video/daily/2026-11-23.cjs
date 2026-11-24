// Daily evening Reel, 2026-11-23: "Stop numbering invoices 1, 2, 3." — Canadian money mistake #16.
// Music only (day-of-year 327, odd). STYLE=light|dark (pin_style.py 2026-11-23 video -> dark).
// Usage: STYLE=dark node marketing/video/daily/2026-11-23.cjs <out.mp4> [preview-dir]
// The year-first numbering is our tip, not a CRA rule. Only tax fact used (captions): CRA "GST/HST records to keep"
// (page details 2025-06-16, re-checked 2026-11-23 evening): "Sales and purchase invoices"; "Usually, you must keep your
// records for 6 years from the end of the year to which they relate."
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
// An invoice card centred on screen; num is the number text (HTML ok).
const inv = (num, { top = 640, extra = '', o = 1, sc = 1, rot = 0 } = {}) => `<div style="position:absolute;left:190px;right:190px;top:${top}px;height:620px;background:${panel};border:4px solid ${edge};border-radius:36px;box-shadow:0 40px 80px -30px rgba(0,0,0,.45);opacity:${o};transform:rotate(${rot}deg) scale(${sc});overflow:hidden">
  <div style="background:${D ? '#0b1f19' : '#1d5a45'};color:#fff;font-weight:800;font-size:44px;padding:28px 44px;letter-spacing:.06em">🧾 INVOICE</div>
  <div style="padding:40px 44px 0;font-size:36px;font-weight:700;color:${mute}">Invoice #</div>
  <div style="padding:6px 44px 0;font-size:118px;font-weight:800;color:${ink};letter-spacing:-.02em;white-space:nowrap">${num}</div>
  <div style="margin:44px 44px 0;height:22px;width:70%;background:${chipbg};border-radius:11px"></div>
  <div style="margin:22px 44px 0;height:22px;width:50%;background:${chipbg};border-radius:11px"></div>${extra}</div>`;
const PILE = [['1', -14, 160, 560], ['2', 8, 520, 600], ['3', -4, 300, 900], ['1', 12, 600, 1020], ['2', -10, 120, 1180]];
const NUMS = ['2026-001', '2026-002', '2026-003'];
const REG = ['2026-001', '2026-002', '2026-003', null, '2026-005', '2026-006'];

const scenes = [
  ['hook', 3.0, hookScene(['Stop numbering', 'invoices', '<b class="h">1, 2, 3.</b>'], 'Canadian money mistake #16')],
  ['pile', 1.6, (t) => `${brand}${cap(t, 'Two years of invoices…')}
    ${PILE.map(([n, r, x, y], i) => { const o = fin(t, i * 0.12, 0.22);
      return `<div style="position:absolute;left:${x}px;top:${y}px;width:360px;height:250px;background:${panel};border:4px solid ${edge};border-radius:28px;box-shadow:0 30px 60px -25px rgba(0,0,0,.5);transform:rotate(${r}deg) scale(${0.6 + 0.4 * o});opacity:${o};display:flex;flex-direction:column;justify-content:center;padding-left:40px">
        <div style="font-size:30px;font-weight:700;color:${mute}">Invoice #</div><div style="font-size:120px;font-weight:800;color:${ink};line-height:1">${n}</div></div>`; }).join('')}
    <div style="position:absolute;left:0;right:0;top:1500px;text-align:center;opacity:${fin(t, 0.75, 0.2)};transform:scale(${1 + 0.4 * (1 - fin(t, 0.75, 0.2))})"><span style="display:inline-block;border:6px solid ${red};color:${red};border-radius:18px;padding:12px 40px;font-size:80px;font-weight:800">Which year?</span></div>`],
  ['year', 1.6, (t) => { const s = fin(t, 0.35, 0.22);
    return `${brand}${cap(t, 'Put the <span class="bz">year</span> first')}
    ${inv(`<span style="color:${gold};display:inline-block;opacity:${s};transform:scale(${1 + 0.8 * (1 - s)})">2026-</span>001`)}
    <div class="small" style="top:1360px;text-align:center;font-size:44px;font-weight:700;color:${mute};${st(fin(t, 0.8, 0.25), 20)}">year · dash · number</div>`; }],
  ['count', 1.6, (t) => { const i = Math.min(2, Math.floor(t / 0.5)), p = fin(t - i * 0.5, 0, 0.18);
    return `${brand}${cap(t, 'Then count up')}
    ${inv(`<span style="color:${gold}">2026-</span><span style="display:inline-block;opacity:${i === 0 ? 1 : p};transform:translateY(${i === 0 ? 0 : (1 - p) * 50}px)">${NUMS[i].slice(5)}</span>`)}
    <div style="position:absolute;left:0;right:0;top:1360px;text-align:center;font-size:52px;font-weight:800;color:${ink}">${NUMS.map((n, k) => `<span style="opacity:${k <= i ? 1 : 0.25}">${n}</span>`).join(` <span style="color:${gold}">→</span> `).replace(/2026-/g, '')}</div>`; }],
  ['newyear', 1.6, (t) => { const flip = ease(t / 0.45), o = fin(t, 0.5, 0.25);
    return `${brand}${cap(t, 'New year? Start at <span class="bz">001</span>')}
    <div style="position:absolute;left:340px;right:340px;top:520px;height:400px;background:${panel};border:4px solid ${edge};border-radius:36px;overflow:hidden;transform:perspective(1200px) rotateX(${(1 - flip) * 80}deg);transform-origin:50% 0">
      <div style="height:120px;background:${gold};color:#102a22;font-size:60px;font-weight:800;display:flex;align-items:center;justify-content:center">JAN</div>
      <div style="font-size:140px;font-weight:800;text-align:center;color:${ink};line-height:2">2027</div></div>
    <div style="position:absolute;left:0;right:0;top:1000px;text-align:center;${st(o, 40)}"><span style="display:inline-block;background:${panel};border:5px solid ${gold};border-radius:30px;padding:30px 60px;font-size:130px;font-weight:800;color:${ink}"><span style="color:${gold}">2027-</span>001</span></div>`; }],
  ['void', 1.6, (t) => { const s = fin(t, 0.3, 0.2);
    return `${brand}${cap(t, 'Voided? <span class="bz">Keep the number.</span>')}
    ${inv(`<span style="color:${gold}">2026-</span>003`, { extra: `<div style="position:absolute;left:0;right:0;top:250px;text-align:center;opacity:${s};transform:rotate(-12deg) scale(${1 + 0.7 * (1 - s)})"><span style="display:inline-block;border:10px solid ${red};color:${red};border-radius:20px;padding:6px 44px;font-size:150px;font-weight:900;letter-spacing:.08em;background:${D ? 'rgba(16,42,34,.85)' : 'rgba(255,255,255,.85)'}">VOID</span></div>` })}
    <div class="big" style="top:1330px;text-align:center;font-size:84px;color:${red};${st(fin(t, 0.75, 0.25), 20)}">Don't reuse it.</div>`; }],
  ['register', 2.0, (t) => { const g = 0.5 + 0.5 * Math.sin(t * 9);
    return `${brand}${cap(t, 'Sorted by date.<br><span class="bz">Gaps jump out.</span>')}
    <div style="position:absolute;left:150px;right:150px;top:540px;background:${panel};border:3px solid ${edge};border-radius:32px;overflow:hidden">
      <div style="background:${D ? '#0b1f19' : '#1d5a45'};color:#fff;font-weight:700;font-size:36px;padding:24px 40px">Invoice register</div>
      ${REG.map((n, i) => { const o = fin(t, 0.1 + i * 0.12, 0.2);
        return n ? `<div style="padding:26px 44px;border-top:2px solid ${edge};font-size:60px;font-weight:800;color:${ink};opacity:${o};transform:translateX(${(1 - o) * 40}px)"><span style="color:${gold}">2026-</span>${n.slice(5)}</div>`
          : `<div style="padding:26px 44px;border-top:2px solid ${edge};font-size:52px;font-weight:800;color:${red};opacity:${o};background:${D ? `rgba(255,138,128,${0.12 + 0.18 * g})` : `rgba(179,38,30,${0.06 + 0.12 * g})`}">2026-004 missing?</div>`; }).join('')}
    </div>`; }],
  ['end', 2.0, (t) => `${brand}
    <div class="big" style="top:440px;font-size:110px;${st(fin(t, 0.0, 0.2))}">Every invoice <span class="bz">auto-numbered</span></div>
    <div class="small" style="top:860px;font-size:54px;font-weight:700;color:${ink};${st(fin(t, 0.2))}">Freelancer Invoice Generator</div>
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
