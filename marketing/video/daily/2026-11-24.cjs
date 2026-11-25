// Daily evening Reel, 2026-11-24: "Self-employed? Your year ends in 37 days." — Tax-season prep #6 (year-end summary by T2125 line).
// Voiced (Aspen). STYLE=light|dark (pin_style.py 2026-11-24 video -> dark).
// Usage: STYLE=dark node marketing/video/daily/2026-11-24.cjs <out.mp4> [preview-dir]
// Facts re-checked on canada.ca 2026-11-24 (evening):
//  - CRA "Fiscal period" (modified 2026-08-31): "Self-employed individuals generally have to use a December 31 year-end."
//  - CRA "Expenses section of form T2125" (modified 2026-08-31): Line 8521 Advertising, 8810 Office expenses, 9220 Utilities,
//    9369 Net income (loss) before adjustments.
//  - "2027 Tax deadlines for Canadian businesses and self-employed individuals" (modified 2026-10-16): self-employed filing
//    deadline June 15, 2027; payment deadline April 30, 2027 for balances owing.
//  All dollar amounts are a labelled example.
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
const src = `<div class="small" style="top:1600px;text-align:center;font-size:30px;color:${mute}">Source: canada.ca · Fiscal period · Form T2125</div>`;
const exTag = (t, s = 0, top = 300) => `<div style="position:absolute;right:90px;top:${top}px;opacity:${fin(t, s, 0.25)}"><span style="display:inline-block;background:${chipbg};border:3px solid ${edge};color:${ink};font-size:34px;font-weight:700;padding:10px 22px;border-radius:14px">Example</span></div>`;
const LINES = [['8521', 'Advertising', 620], ['8810', 'Office expenses', 340], ['9220', 'Utilities', 480]];
const RECEIPTS = ['Facebook ad', 'Printer ink', 'Internet bill', 'Google ad', 'Paper &amp; pens', 'Phone bill', 'Flyers', 'Postage', 'Hydro', 'Business cards', 'Shipping labels', 'Instagram ad', 'Toner', 'Phone bill', 'Domain'];
const AMTS = [45, 38, 80, 60, 22, 55, 90, 14, 70, 35, 18, 50, 41, 55, 25];

const scenes = [
  ['hook', 3.0, hookScene(['Self-employed?', 'Your year ends', 'in <b class="h">37 days.</b>'], 'Tax-season prep #6')],
  ['dec31', 1.8, (t) => {
    const flip = ease(t / 0.5), c = clamp((t - 0.6) / 0.7);
    return `${brand}
    <div style="position:absolute;left:290px;right:290px;top:480px;height:560px;background:${panel};border:4px solid ${edge};border-radius:40px;overflow:hidden;transform:perspective(1200px) rotateX(${(1 - flip) * 80}deg);transform-origin:50% 0">
      <div style="height:150px;background:${gold};color:#102a22;font-size:70px;font-weight:800;display:flex;align-items:center;justify-content:center">DEC</div>
      <div style="font-size:280px;font-weight:800;text-align:center;color:${ink};line-height:1.35">31</div>
    </div>
    <svg style="position:absolute;left:230px;top:420px" width="620" height="680" viewBox="0 0 620 680"><ellipse cx="310" cy="340" rx="290" ry="320" fill="none" stroke="${gold}" stroke-width="14" stroke-linecap="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="${1 - c}" transform="rotate(-80 310 340)"/></svg>
    <div class="big" style="top:1180px;text-align:center;font-size:104px;${st(fin(t, 0.4, 0.3), 30)}">Usually <span class="bz">December 31</span></div>${src}`;
  }],
  ['receipts', 1.8, (t) => {
    const y = -t * 900;
    return `${brand}
    <div class="cap" style="top:330px;font-size:64px;${st(fin(t, 0, 0.25), 20)}">A year of receipts…</div>
    <div style="position:absolute;left:110px;right:110px;top:480px;height:1060px;overflow:hidden;border-radius:28px;border:3px solid ${edge};background:${panel}">
      <div style="transform:translateY(${y}px)">${[...RECEIPTS, ...RECEIPTS, ...RECEIPTS].map((r, i) => `<div style="display:flex;justify-content:space-between;padding:26px 40px;border-bottom:2px solid ${edge};font-size:44px;font-weight:600;color:${ink}"><span>🧾 ${r}</span><span style="color:${mute}">${money(AMTS[i % AMTS.length])}</span></div>`).join('')}</div>
    </div>`;
  }],
  ['lines', 2.0, (t) => `${brand}
    <div class="cap" style="top:330px;font-size:60px;${st(fin(t, 0, 0.25), 20)}">…one total per <span class="bz">T2125 line</span></div>
    ${LINES.map(([n, name, a], i) => { const o = fin(t, 0.15 + i * 0.45, 0.3);
      return `<div style="position:absolute;left:90px;right:90px;top:${540 + i * 260}px;height:220px;background:${panel};border:3px solid ${edge};border-radius:30px;display:flex;align-items:center;justify-content:space-between;padding:0 44px;opacity:${o};transform:scale(${0.85 + 0.15 * o})">
        <div><div style="font-size:40px;font-weight:800;color:${gold}">Line ${n}</div><div style="font-size:56px;font-weight:800;color:${ink}">${name}</div></div>
        <div style="font-size:64px;font-weight:800;color:${ink}">${money(-a)}</div></div>`; }).join('')}
    ${exTag(t, 0.1, 1340)}${src}`],
  ['equation', 1.8, (t) => `${brand}
    <div class="cap" style="top:420px;font-size:60px;${st(fin(t, 0, 0.25), 20)}">Sales minus those totals</div>
    <div style="position:absolute;left:90px;right:90px;top:620px;background:${panel};border:3px solid ${edge};border-radius:32px;padding:50px">
      <div style="display:flex;justify-content:space-between;font-size:60px;font-weight:800;color:${ink};${st(fin(t, 0.1, 0.3), 20)}"><span>Sales</span><span>$18,400</span></div>
      <div style="display:flex;justify-content:space-between;font-size:60px;font-weight:800;color:${ink};margin-top:40px;${st(fin(t, 0.6, 0.3), 20)}"><span>− Expenses</span><span class="bz">−$1,440</span></div>
      <div style="height:8px;background:${gold};border-radius:4px;margin-top:40px;width:${100 * fin(t, 1.0, 0.4)}%"></div>
    </div>
    ${exTag(t, 0.1)}${src}`],
  ['result', 1.8, (t) => {
    const v = Math.round(16960 * ease(t / 0.9) / 10) * 10;
    return `${brand}
    <div class="cap" style="top:420px;font-size:60px">= your net income</div>
    <div class="big" style="top:640px;text-align:center;font-size:200px;color:${gold}">${money(v)}</div>
    <div style="position:absolute;left:0;right:0;top:960px;text-align:center;${st(fin(t, 0.7, 0.3), 20)}"><span class="pill">Line 9369</span></div>
    <div class="small" style="top:1160px;text-align:center;font-size:40px;color:${mute};${st(fin(t, 0.9, 0.3), 20)}">Net income (loss) before adjustments</div>
    ${exTag(t, 0)}${src}`;
  }],
  ['dates', 2.0, (t) => {
    const card = (top, s, label, date) => { const o = fin(t, s, 0.3);
      return `<div style="position:absolute;left:110px;right:110px;top:${top}px;background:${panel};border:4px solid ${gold};border-radius:32px;padding:40px 50px;opacity:${o};transform:translateX(${(1 - o) * 120}px)">
        <div style="font-size:44px;font-weight:700;color:${mute}">${label}</div><div style="font-size:84px;font-weight:800;color:${ink}">${date}</div></div>`; };
    return `${brand}
    <div class="cap" style="top:380px;font-size:60px;${st(fin(t, 0, 0.25), 20)}">Your 2026 return</div>
    ${card(560, 0.15, '📄 File by', 'June 15, 2027')}${card(900, 0.8, '💵 Pay any balance by', 'April 30, 2027')}
    <div class="small" style="top:1600px;text-align:center;font-size:30px;color:${mute}">Source: canada.ca · 2027 tax deadlines, self-employed</div>`;
  }],
  ['end', 2.0, (t) => `${brand}
    <div class="big" style="top:440px;font-size:100px;${st(fin(t, 0.0, 0.2))}">Totals by <span class="bz">T2125 line</span>, built in</div>
    <div class="small" style="top:860px;font-size:54px;font-weight:700;color:${ink};${st(fin(t, 0.2))}">Bookkeeping &amp; GST/HST Tracker</div>
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
