// Daily evening Reel, 2026-11-21 (weekly-review day, no draft; batch-1 videos all used): "Side hustle? This form is yours." — Tax-season prep #4.
// Music only (day-of-year 325, odd). STYLE=light|dark (pin_style.py 2026-11-21 video -> light).
// Usage: STYLE=light node marketing/video/daily/2026-11-21.cjs <out.mp4> [preview-dir]
// Facts checked on canada.ca 2026-11-21:
//  - "Form T2125, Statement of Business or Professional Activities"; "To report business or professional income and expenses, we encourage you to use Form T2125."
//    (canada.ca/en/revenue-agency/services/tax/businesses/topics/sole-proprietorships-partnerships/report-business-income-expenses.html)
//  - "If you are a sole proprietor, fill in ... Form T2125"; "File your completed Form T2125 ... with your income tax return.";
//    "You have to fill in a separate form for each business you operate." (canada.ca/.../publications/t4002/t4002-4.html)
// Product claim from site/src/products.json (Bookkeeping & GST/HST Tracker: income/expense logs tagged by T2125 line, year-end totals by line).
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
const panel = D ? '#16382d' : '#fff', edge = D ? '#2a5a48' : '#cfe0d6', mute = D ? '#a9c7b8' : '#46605a', gold = D ? '#e0b25a' : '#9a6b14', grn = D ? '#7fd1a4' : '#1f7a4d', red = D ? '#ff8a80' : '#b3261e';
const box = (inner, o, extra = '') => `<div style="${st(o, 40)};background:${panel};border:3px solid ${edge};border-radius:28px;padding:34px 40px;${extra}">${inner}</div>`;
// A paper "form" graphic
const form = (t, z = 1) => `<div style="position:absolute;left:190px;right:190px;top:620px;height:820px;background:${panel};border:3px solid ${edge};border-radius:24px;box-shadow:0 40px 80px -30px rgba(16,42,34,.35);padding:50px;transform:scale(${z});transform-origin:50% 30%">
  <div style="font-size:34px;font-weight:700;color:${mute}">Business form</div>
  <div style="font-size:120px;font-weight:800;letter-spacing:-.03em;margin-top:20px;color:${gold}">T2125</div>
  ${[0, 1, 2, 3, 4, 5].map((i) => `<div style="height:22px;margin-top:${i ? 30 : 40}px;width:${[90, 70, 84, 60, 78, 50][i] * fin(t, 0.2 + i * 0.12, 0.3)}%;background:${D ? '#2a5a48' : '#dcebe2'};border-radius:11px"></div>`).join('')}
</div>`;
const scenes = [
  ['hook', 3.0, hookScene(['Side hustle?', 'This form is', '<b class="h">yours.</b>'], 'Tax-season prep #4')],
  ['form', 1.8, (t) => `${brand}<div class="cap" style="top:330px;font-size:84px;${st(fin(t, 0.05, 0.3), 30)}">Form <span class="bz">T2125</span></div>
    <div class="small" style="top:450px;text-align:center;font-size:40px;${st(fin(t, 0.3, 0.3), 20)}">Statement of Business or Professional Activities</div>${form(t, 1.06 - 0.06 * ease(t / 1.2))}`],
  ['who', 1.8, (t) => `${brand}<div class="cap" style="top:420px;font-size:84px">Who fills it in?</div>
    <div style="position:absolute;left:100px;right:100px;top:700px;display:flex;flex-direction:column;gap:34px">
      ${box(`<div style="font-size:64px;font-weight:800"><span style="color:${grn}">✓</span> Sole proprietors</div><div style="font-size:38px;color:${mute};margin-top:10px">Freelancers, side hustles, gigs</div>`, fin(t, 0.15, 0.3))}
      ${box(`<div style="font-size:52px;font-weight:800"><span style="color:${grn}">✓</span> Self-employed commission sales</div>`, fin(t, 0.75, 0.3))}
    </div>`],
  ['what', 1.8, (t) => { const n = Math.round(4200 * ease((t - 0.2) / 0.9));
    return `${brand}<div class="cap" style="top:420px;font-size:84px">What goes on it?</div>
    <div style="position:absolute;left:100px;right:100px;top:700px;display:flex;flex-direction:column;gap:34px">
      ${box(`<div style="display:flex;justify-content:space-between;font-size:66px;font-weight:800"><span>Business income</span><span style="color:${grn}">↑</span></div>`, fin(t, 0.1, 0.3))}
      ${box(`<div style="display:flex;justify-content:space-between;font-size:66px;font-weight:800"><span>Business expenses</span><span style="color:${red}">↓</span></div>`, fin(t, 0.7, 0.3))}
    </div>`; }],
  ['file', 1.8, (t) => { const y = 260 * (1 - ease((t - 0.3) / 0.7));
    return `${brand}<div class="cap" style="top:420px;font-size:80px">Filed <span class="hl">with</span> your income tax return</div>
    <div style="position:absolute;left:250px;top:820px;width:580px;height:620px;background:${panel};border:3px solid ${edge};border-radius:24px;padding:40px;font-size:46px;font-weight:800">Your tax return</div>
    <div style="position:absolute;left:330px;top:${980 - y}px;width:580px;height:420px;background:${panel};border:4px solid ${gold};border-radius:24px;padding:40px;box-shadow:0 30px 60px -25px rgba(16,42,34,.4);opacity:${fin(t, 0.1, 0.25)}"><div style="font-size:86px;font-weight:800;color:${gold}">T2125</div><div style="font-size:36px;color:${mute};margin-top:10px">attached</div></div>`; }],
  ['each', 1.8, (t) => `${brand}<div class="cap" style="top:420px;font-size:84px;${st(fin(t, 0.0, 0.25), 30)}">Two businesses?</div>
    <div class="cap bz" style="top:540px;font-size:100px;${st(fin(t, 0.5, 0.25), 30)}">Two forms.</div>
    <div style="position:absolute;left:120px;right:120px;top:800px;display:flex;gap:40px">
      ${['Design work', 'Etsy shop'].map((b, i) => `<div style="flex:1;${st(fin(t, 0.2 + i * 0.4, 0.3), 60)};background:${panel};border:3px solid ${edge};border-radius:24px;padding:36px;height:460px"><div style="font-size:70px;font-weight:800;color:${gold}">T2125</div><div style="font-size:40px;font-weight:700;margin-top:24px">${b}</div>${[0,1,2].map((k)=>`<div style="height:18px;margin-top:28px;width:${[85,65,75][k]}%;background:${D ? '#2a5a48' : '#dcebe2'};border-radius:9px"></div>`).join('')}</div>`).join('')}
    </div>
    <div class="small" style="top:1330px;text-align:center;font-size:40px;${st(fin(t, 1.0, 0.3), 20)}">A separate form for <b>each</b> business</div>`],
  ['track', 1.8, (t) => { const rows = [['Client invoice', '+$850', grn], ['Phone (business share)', '−$45', red], ['Printer ink', '−$38', red], ['Client invoice', '+$600', grn]];
    return `${brand}<div class="cap" style="top:400px;font-size:80px">Log it <span class="bz">all year</span></div>
    <div class="card" style="top:620px"><div class="head"><span>📒 INCOME & EXPENSES</span><span>CAD</span></div>
      ${rows.map(([a, b, c], i) => `<div class="row" style="font-size:46px;${st(fin(t, 0.1 + i * 0.3, 0.25), 30)}"><b>${a}</b><span style="color:${c};font-weight:800">${b}</span></div>`).join('')}
    </div>`; }],
  ['end', 1.8, (t) => `${brand}
    <div class="big" style="top:440px;font-size:100px;${st(fin(t, 0.0, 0.2))}">Every expense, tagged <span class="bz">by T2125 line.</span></div>
    <div class="small" style="top:900px;font-size:50px;${st(fin(t, 0.2))}">Bookkeeping &amp; <b>GST/HST Tracker</b></div>
    <div style="position:absolute;left:72px;top:1120px;${st(fin(t, 0.35))}"><span class="pill">Get it at Loonie Ledger</span></div>
    <div class="small" style="top:1500px;font-size:32px;${st(fin(t, 0.5))}">General info. Not tax advice.</div>`],
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
