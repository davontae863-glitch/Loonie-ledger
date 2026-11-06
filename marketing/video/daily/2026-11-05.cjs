// Daily evening Reel, 2026-11-05: "5 things to do before January 1" (December bookkeeping checklist), music only.
// Usage: node marketing/video/daily/2026-11-05.cjs <out.mp4> [preview-dir]
// Style copied from marketing/video/batch.cjs. Facts re-checked on canada.ca 2026-11-05:
//  - "Self-employed individuals generally have to use a December 31 year-end." (Fiscal period, modified 2026-08-31)
//    https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/sole-proprietorships-partnerships/fiscal-period.html
//  - $30,000 small-supplier threshold: a single calendar quarter, or the last four consecutive calendar quarters.
//    https://www.canada.ca/en/revenue-agency/services/forms-publications/publications/2-2/small-suppliers.html
//  - "Record the odometer reading of each vehicle at the start and end of the fiscal period." (modified 2026-08-17)
//    https://www.canada.ca/en/revenue-agency/services/tax/businesses/small-businesses-self-employed-income/business-income-tax-reporting/business-expenses/motor-vehicle-expenses.html
//  - Keep deposit slips and bank statements; with no receipt, note the seller, amount, date and details. (modified 2026-08-31)
//    https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/sole-proprietorships-partnerships/business-records.html
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const OUTFILE = path.resolve(process.argv[2] || 'render.mp4');
const PREVIEW = process.argv[3];
const W = 1080, H = 1920, FPS = 30;
const coin = fs.readFileSync(path.join(__dirname, '../../../site/dist/favicon.svg'), 'utf8');

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
.quote{position:absolute;left:90px;right:90px;border-left:12px solid #9a6b14;padding:10px 0 10px 44px;font-size:56px;font-weight:700;line-height:1.25}`;

const clamp = (x) => Math.min(1, Math.max(0, x));
const ease = (x) => 1 - Math.pow(1 - clamp(x), 3);
const fin = (t, s, d = 0.35) => ease((t - s) / d);
const st = (o, dy = 40) => `opacity:${o};transform:translateY(${(1 - o) * dy}px)`;
const brand = `<div class="brand">${coin}Loonie Ledger</div>`;
const money = (n) => (n < 0 ? '−' : '') + '$' + Math.abs(n).toLocaleString('en-CA');


const tasks = [
  ['Add up sales by quarter', 'Over $30,000 in one quarter, or four in a row? GST/HST registration kicks in.'],
  ['Odometer reading on Dec 31', 'Drive for work? CRA wants a reading at the start and end of the year.'],
  ['Match bank statements', 'Check your deposits against your income log.'],
  ['No receipt? Write it down', 'Who you paid, what for, when, and how much.'],
  ['Chase unpaid invoices', 'List who still owes you and follow up.'],
];
const PER = 2.6, T0 = 0.5;

const scenes = [
  ['hook', 3.6, (t) => `${brand}
    <div class="big" style="top:520px;font-size:122px"><div>Self-employed in Canada?</div>
    <div style="margin-top:30px" class="bz">5 things to do before Jan 1.</div></div>
    <div class="small" style="top:1250px;${st(fin(t, 1.2))}">Your December bookkeeping checklist 👇</div>`],
  ['yearend', 4.4, (t) => `${brand}
    <div class="card" style="top:380px;left:300px;right:300px;text-align:center;${st(fin(t, 0.05))}">
      <div class="head" style="justify-content:center;font-size:52px;padding:26px">DEC</div>
      <div style="font-size:250px;font-weight:800;line-height:1.1;padding:20px 0 30px;letter-spacing:-.04em">31</div></div>
    <div class="big" style="top:1000px;font-size:80px;text-align:center;${st(fin(t, 0.5))}">Most self-employed<br>people have a<br><span class="hl" style="white-space:nowrap">Dec 31 year-end.</span></div>
    <div class="small" style="top:1480px;text-align:center;font-size:48px;color:#102a22;${st(fin(t, 1.6))}">So December is <b class="bz">clean-up month.</b></div>`],
  ['list', T0 + PER * tasks.length + 0.9, (t) => {
    const cur = Math.max(0, Math.min(tasks.length - 1, Math.floor((t - T0) / PER)));
    return `${brand}
    <div class="cap" style="top:250px;${st(fin(t, 0.05))}">Before Jan 1:</div>
    <div class="card" style="top:400px;${st(fin(t, 0.1))}">
      ${tasks.map(([name], i) => {
        const on = fin(t, T0 + i * PER, 0.3);
        const active = t >= T0 + i * PER && i === cur;
        return `<div class="row" style="padding:34px 40px;${active ? 'background:#eef4f0;' : ''}">
          <span style="display:flex;align-items:center;gap:28px;font-weight:${active ? 800 : 600}">
            <span style="width:72px;height:72px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:38px;font-weight:800;border:4px solid #1d5a45;background:${on > 0.5 ? '#1d5a45' : '#fff'};color:${on > 0.5 ? '#fff' : '#1d5a45'}">${on > 0.5 ? '✓' : i + 1}</span>${name}</span></div>`;
      }).join('')}
    </div>
    <div class="cap" style="top:1470px;font-size:50px;color:#46605a;${st(fin(t, T0 + cur * PER, 0.3), 20)}">${t >= T0 ? `<b class="bz">${cur + 1}.</b> ${tasks[cur][1]}` : ''}</div>`;
  }],
  ['end', 4.4, (t) => `${brand}
    <div class="big" style="top:500px;font-size:100px;${st(fin(t, 0.05))}">Start with #1: <span class="bz">your sales by quarter.</span></div>
    <div class="small" style="top:930px;font-size:50px;color:#102a22;${st(fin(t, 0.6))}">The free <b>GST/HST threshold checker</b> does the math.</div>
    <div style="position:absolute;left:72px;top:1140px;${st(fin(t, 0.9))}"><span class="pill">Free at Loonie Ledger</span></div>
    <div class="small" style="top:1560px;font-size:32px;${st(fin(t, 1.3))}">Not tax advice. Check CRA for your situation.</div>`],
];

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: W, height: H } });
  const set = (inner) => page.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>${CSS}</style></head><body>${inner}</body></html>`);
  if (PREVIEW) {
    fs.mkdirSync(PREVIEW, { recursive: true });
    for (const [n, secs, fn] of scenes) for (const tt of [0, secs / 2, secs - 0.3]) {
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
if (process.argv[2] !== '--pin') main().catch((e) => { console.error(e); process.exit(1); });

// Pinterest pin (1000x1500): node marketing/video/daily/2026-11-05.cjs --pin <out.png>
if (process.argv[2] === '--pin') {
  (async () => {
    const items = ['Total your sales by quarter', 'Odometer reading on Dec 31', 'Match bank statements', 'No receipt? Write it down', 'Chase unpaid invoices'];
    const html = `<!doctype html><html><head><meta charset="utf-8"><style>*{box-sizing:border-box;margin:0}
body{width:1000px;height:1500px;background:#f5f9f6;font-family:Inter,sans-serif;color:#102a22;position:relative;overflow:hidden}
body:before{content:"";position:absolute;inset:0;background-image:linear-gradient(#e3eee7 2px,transparent 2px);background-size:100% 56px;opacity:.6}
.b{position:absolute;left:70px;top:80px;display:flex;gap:16px;align-items:center;font-weight:700;font-size:36px}.b svg{width:56px;height:56px}
.cal{position:absolute;right:70px;top:60px;width:150px;border-radius:18px;overflow:hidden;background:#fff;border:3px solid #cfe0d6;text-align:center}
.cal div:first-child{background:#1d5a45;color:#fff;font-weight:700;font-size:28px;padding:6px}.cal div:last-child{font-size:70px;font-weight:800;line-height:1.2}
h1{position:absolute;left:70px;right:70px;top:250px;font-family:"Inter Display",Inter;font-size:96px;line-height:1.04;letter-spacing:-.03em;font-weight:800}
.card{position:absolute;left:70px;right:70px;top:690px;background:#fff;border:3px solid #cfe0d6;border-radius:28px;overflow:hidden;box-shadow:0 30px 60px -30px rgba(16,42,34,.35)}
.r{display:flex;align-items:center;gap:24px;padding:20px 34px;border-bottom:2px solid #e1ece5;font-size:38px;font-weight:600}.r:last-child{border-bottom:none}
.r i{font-style:normal;width:56px;height:56px;border-radius:50%;background:#1d5a45;color:#fff;display:inline-flex;align-items:center;justify-content:center;font-size:30px;font-weight:800;flex:none}
.n{position:absolute;left:70px;right:70px;bottom:200px;font-size:28px;color:#46605a}
.f{position:absolute;left:70px;right:70px;bottom:80px;display:flex;justify-content:space-between;align-items:center;font-size:32px}
.f b{white-space:nowrap;background:#1d5a45;color:#fff;padding:18px 30px;border-radius:999px}${require('fs').readFileSync(require('path').join(__dirname, '../pin-dark.css'), 'utf8')}</style></head><body>
<div class="b">${coin}Loonie Ledger</div><div class="cal"><div>DEC</div><div>31</div></div>
<h1>December bookkeeping checklist: <span class="hi">5 things before Jan 1</span></h1>
<div class="card">${items.map((x, i) => `<div class="r"><i>${i + 1}</i>${x}</div>`).join('')}</div>
<div class="n">For Canadian sole proprietors. Not tax advice — check CRA for your situation.</div>
<div class="f"><span class="mut">Start with #1</span><b>Free GST/HST checker →</b></div></body></html>`;
    const browser = await chromium.launch();
    const p = await browser.newPage({ viewport: { width: 1000, height: 1500 } });
    await p.setContent(html); await p.screenshot({ path: process.argv[3] }); await browser.close();
  })();
}
