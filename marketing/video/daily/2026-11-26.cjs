// Daily evening Reel, 2026-11-26: "Do you charge GST? Type 4 numbers." — Tax-season prep #7 (free GST/HST checker demo).
// Voiced (Aspen, day-of-year 330 even). STYLE=light|dark (pin_style.py 2026-11-26 video -> light).
// Usage: STYLE=light node marketing/video/daily/2026-11-26.cjs <out.mp4> [preview-dir]
// Facts re-checked 2026-11-26 evening via canada.ca exact-phrase search (WebFetch blocked this run): CRA "When to register for and
// start charging the GST/HST" — "You exceed the $30,000 threshold in a single calendar quarter" / over the previous four consecutive
// calendar quarters; small suppliers "do not have to register". Numbers and verdict text are the checker's own built-in example
// (site/build.mjs: 6200/7400/8100/5900, "Under the $30,000 threshold, with $2,400 to go.",
// "One quarter is over $30,000, so you are no longer a small supplier.").
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

const lock = `<svg viewBox="0 0 24 24" width="150" height="150" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>`;
const green = D ? '#7fd8a6' : '#1f7a4d';

// The checker sheet: four quarter rows that fill in, a total row and the verdict.
const Q = ['Latest quarter', 'Quarter before', '2 quarters back', '3 quarters back'];
function sheet({ vals, typed = [1, 1, 1, 1], total = null, hiRow = -1, top = 560 }) {
  const rows = Q.map((l, i) => {
    const o = typed[i], v = vals[i], show = o > 0 ? money(v) : '';
    const bg = i === hiRow ? (D ? '#5a2a26' : '#fde8e6') : 'transparent';
    return `<div style="display:flex;justify-content:space-between;align-items:center;padding:26px 40px;border-top:2px solid ${edge};font-size:44px;font-weight:700;color:${ink};background:${bg}">
      <span style="color:${mute};font-size:38px">${l}</span>
      <span style="min-width:300px;text-align:right;padding:10px 22px;border:3px solid ${o > 0 && o < 1 ? gold : edge};border-radius:16px;background:${D ? '#0b1f19' : '#f5f9f6'};color:${i === hiRow ? red : ink};opacity:${o > 0 ? 1 : .55}">${show || '&nbsp;'}</span></div>`;
  }).join('');
  const tot = total === null ? '' : `<div style="display:flex;justify-content:space-between;align-items:center;padding:30px 40px;border-top:3px solid ${edge};background:${chipbg};font-size:50px;font-weight:800;color:${ink}"><span>Last four quarters</span><span>${money(total)}</span></div>`;
  return `<div style="position:absolute;left:80px;right:80px;top:${top}px;background:${panel};border:4px solid ${edge};border-radius:36px;box-shadow:0 40px 80px -30px rgba(0,0,0,.35);overflow:hidden">
    <div style="background:${D ? '#0b1f19' : '#1d5a45'};color:#fff;font-weight:800;font-size:36px;padding:24px 40px;display:flex;justify-content:space-between;letter-spacing:.03em"><span>🧮 GST/HST CHECKER</span><span style="font-size:30px;font-weight:700;opacity:.85">Example numbers</span></div>${rows}${tot}</div>`;
}
const EX = [6200, 7400, 8100, 5900];
const verdict = (txt, col, o, top = 1420) => `<div style="position:absolute;left:80px;right:80px;top:${top}px;text-align:center;font-size:54px;font-weight:800;line-height:1.2;color:${col};${st(o, 30)};transform:scale(${0.9 + 0.1 * o})">${txt}</div>`;

const scenes = [
  ['hook', 3.0, hookScene(['Do you charge', 'GST? Type', '<b class="h">4 numbers.</b>'], 'Tax-season prep #7')],
  ['q1', 1.6, (t) => `${brand}${cap(t, 'Your sales, last <span class="bz">four quarters</span>')}
    ${sheet({ vals: EX, typed: [fin(t, 0.2, 0.6), 0, 0, 0] })}`],
  ['q23', 1.6, (t) => `${brand}${cap(t, 'One number per quarter')}
    ${sheet({ vals: EX, typed: [1, fin(t, 0.1, 0.45), fin(t, 0.7, 0.45), 0] })}`],
  ['total', 1.6, (t) => { const tot = Math.round(27600 * ease((t - 0.55) / 0.7));
    return `${brand}${cap(t, 'It adds them up')}
    ${sheet({ vals: EX, typed: [1, 1, 1, fin(t, 0.05, 0.4)], total: t > 0.45 ? tot : null })}`; }],
  ['under', 1.8, (t) => { const p = ease((t - 0.1) / 0.8) * 0.92;
    return `${brand}${cap(t, 'Under <span class="bz">$30,000</span>? You’ve got room')}
    <div style="position:absolute;left:100px;right:100px;top:640px;font-size:150px;font-weight:800;text-align:center;color:${ink}">${money(27600)}</div>
    <div style="position:absolute;left:100px;right:100px;top:880px;height:70px;border-radius:35px;background:${chipbg};overflow:hidden"><div style="height:100%;width:${p * 100}%;background:${green};border-radius:35px"></div></div>
    <div style="position:absolute;left:100px;right:100px;top:975px;display:flex;justify-content:space-between;font-size:34px;font-weight:700;color:${mute}"><span>$0</span><span>$30,000</span></div>
    ${verdict('✓ Under the $30,000 threshold,<br>with $2,400 to go.', green, fin(t, 0.8, 0.3), 1120)}
    <div class="small" style="top:1400px;text-align:center;font-size:36px;font-weight:700">Example numbers</div>`; }],
  ['over', 1.8, (t) => { const s = t > 0.35;
    return `${brand}${cap(t, 'Over in <span style="color:${red}">one quarter</span>? That counts too')}
    ${sheet({ vals: [6200, 7400, s ? 31000 : 8100, 5900], hiRow: s ? 2 : -1, total: s ? 50500 : 27600, top: 600 })}
    ${verdict('One quarter is over $30,000, so you are no longer a small supplier.', red, fin(t, 0.6, 0.3), 1480)}`; }],
  ['private', 2.0, (t) => `${brand}
    <div style="position:absolute;left:0;right:0;top:560px;display:flex;justify-content:center;color:${gold};transform:scale(${0.7 + 0.3 * fin(t, 0, 0.4)})">${lock}</div>
    <div class="big" style="top:820px;text-align:center;font-size:104px;${st(fin(t, 0.25, 0.3))}">Nothing you type<br><span class="bz">leaves the page</span></div>
    <div class="small" style="top:1200px;text-align:center;font-size:40px;${st(fin(t, 0.8, 0.3), 20)}">CRA: small suppliers don’t have to register</div>`],
  ['end', 2.2, (t) => `${brand}
    <div class="big" style="top:440px;font-size:108px;${st(fin(t, 0.0, 0.2))}">Free <span class="bz">GST/HST checker</span></div>
    <div class="small" style="top:760px;font-size:50px;font-weight:700;color:${ink};${st(fin(t, 0.2))}">Type your last four quarters. Get your answer.</div>
    <div style="position:absolute;left:72px;top:1040px;${st(fin(t, 0.35))}"><span class="pill">Free at Loonie Ledger</span></div>
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
