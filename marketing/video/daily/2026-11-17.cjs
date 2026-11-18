// Daily evening Reel, 2026-11-17: "3 accounts. Only 1 gets both tax breaks." — Tax-season prep #3 (TFSA vs RRSP vs FHSA).
// Music only (day-of-year 321, odd). STYLE=light|dark (pin_style.py 2026-11-17 video -> light).
// Usage: STYLE=light node marketing/video/daily/2026-11-17.cjs <out.mp4> [preview-dir]
// Facts re-checked on canada.ca 2026-11-17 (evening):
//  - CRA "What is a TFSA": contributions not tax deductible; contributions and income generally tax-free, even when withdrawn; withdraw any time, any reason.
//  - CRA "MP, DB, RRSP, DPSP, ALDA, TFSA limits...": 2026 TFSA dollar limit $7,000; 2026 RRSP dollar limit $33,810.
//  - CRA "Registered Retirement Savings Plan (RRSP)": deductible contributions reduce your tax; you generally pay tax when you receive payments from the plan.
//  - CRA "First Home Savings Account (FHSA)": contributions generally deductible; $8,000 participation room in the year you open your first FHSA.
//  - CRA "Withdrawals and transfers out of your FHSAs": a qualifying withdrawal does not need to be included in income (all conditions must be met).
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



const src = `<div class="small" style="top:1600px;text-align:center;font-size:30px">Source: canada.ca · CRA</div>`;
const ACC = [
  ['TFSA', 'Any goal, any time', ['No deduction', 0], ['Tax-free', 1]],
  ['RRSP', 'For retirement', ['Deduction', 1], ['Taxed', 0]],
  ['FHSA', 'First home', ['Deduction', 1], ['Tax-free', 1]],
];
// table(rowsShown 0..1 each, fill 0..1 each, gold FHSA 0..1)
function table(show, fill, gold = 0) {
  const cell = (c, o) => `<div style="flex:1;text-align:center;font-size:40px;font-weight:700;opacity:${o};transform:scale(${0.8 + 0.2 * o});color:${c[1] ? '#1f7a4d' : '#7a8c86'}">${c[1] ? '✓ ' : ''}${c[0]}</div>`;
  return `<div class="card" style="top:430px">
    <div class="head" style="font-size:34px"><span style="width:250px"></span><span style="flex:1;text-align:center">Going in</span><span style="flex:1;text-align:center">Coming out</span></div>
    ${ACC.map((a, i) => { const g = i === 2 ? gold : 0;
      return `<div class="row" style="${st(show[i], 30)};padding:40px 30px 40px 40px;${g ? `background:rgba(224,178,90,${0.28 * g});` : ''}">
      <div style="width:250px"><div style="font-size:54px;font-weight:800" class="${g > 0.5 ? 'bz' : ''}">${a[0]}</div><div style="font-size:26px;color:#46605a;margin-top:4px">${a[1]}</div></div>
      ${cell(a[2], fin(fill[i], 0, 0.3))}${cell(a[3], fin(fill[i], 0.35, 0.3))}</div>`; }).join('')}
  </div>`;
}
const chip = (txt, o) => `<div style="${st(o, 30)};margin:0 0 30px"><span class="pill" style="font-size:46px;padding:22px 40px">${txt}</span></div>`;

const scenes = [
  ['hook', 3.0, hookScene(['3 accounts.', '<b class="h">Only 1</b> gets', 'both tax', 'breaks.'], 'Tax-season prep #3')],
  ['setup', 1.8, (t) => `${brand}${table([fin(t, 0.1, 0.3), fin(t, 0.35, 0.3), fin(t, 0.6, 0.3)], [-9, -9, -9])}
    <div class="cap" style="top:1180px;font-size:72px;${st(fin(t, 0.9, 0.3), 20)}">Tax break <span class="bz">in</span> or <span class="bz">out</span>?</div>`],
  ['tfsa', 1.8, (t) => `${brand}${table([1, 1, 1], [t, -9, -9])}
    <div class="cap" style="top:1180px;font-size:68px;${st(fin(t, 0.8, 0.3), 20)}">TFSA: tax-free out,<br><span class="bz">any goal, any time</span></div>${src}`],
  ['rrsp', 1.8, (t) => `${brand}${table([1, 1, 1], [9, t, -9])}
    <div class="cap" style="top:1180px;font-size:68px;${st(fin(t, 0.8, 0.3), 20)}">RRSP: deduction in,<br><span class="bz">taxed out</span></div>${src}`],
  ['fhsa', 1.8, (t) => `${brand}${table([1, 1, 1], [9, 9, t], fin(t, 0.8, 0.4))}
    <div class="cap" style="top:1180px;font-size:110px;${st(fin(t, 0.9, 0.3), 20)}">FHSA: <span class="hl">both</span></div>${src}`],
  ['condition', 1.8, (t) => `${brand}
    <div class="cap" style="top:420px;font-size:220px;line-height:1;opacity:${fin(t, 0, 0.2)};transform:scale(${1 + 0.2 * (1 - fin(t, 0, 0.3))})">🏡</div>
    <div class="cap" style="top:760px;font-size:90px;${st(fin(t, 0.15, 0.3), 30)}">Tax-free when you buy your <span class="bz">first home</span></div>
    <div class="small" style="top:1160px;text-align:center;font-size:38px;${st(fin(t, 0.6, 0.3), 20)}">A qualifying withdrawal — CRA's conditions apply.<br>Other FHSA withdrawals are taxed.</div>${src}`],
  ['limits', 1.8, (t) => `${brand}
    <div class="big" style="top:420px;font-size:110px;text-align:center;${st(fin(t, 0, 0.25))}">2026 limits</div>
    <div style="position:absolute;left:0;right:0;top:700px;text-align:center">
      ${chip('TFSA <b class="bz">$7,000</b>', fin(t, 0.2, 0.25))}${chip('RRSP up to <b class="bz">$33,810</b>', fin(t, 0.55, 0.25))}${chip('FHSA <b class="bz">$8,000</b>', fin(t, 0.9, 0.25))}
    </div>
    <div class="small" style="top:1230px;text-align:center;font-size:32px;${st(fin(t, 1.1, 0.25), 20)}">RRSP: generally 18% of last year's earned income up to the max, plus unused room.<br>FHSA: $8,000 in the year you open your first one.</div>${src}`],
  ['end', 1.8, (t) => `${brand}
    <div class="big" style="top:440px;font-size:100px;${st(fin(t, 0.0, 0.2))}">Track all three rooms <span class="bz">in one sheet.</span></div>
    <div class="small" style="top:900px;font-size:50px;color:#102a22;${st(fin(t, 0.2))}">The <b>TFSA/RRSP/FHSA Room Tracker</b>.</div>
    <div style="position:absolute;left:72px;top:1120px;${st(fin(t, 0.35))}"><span class="pill">Get it at Loonie Ledger</span></div>
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
