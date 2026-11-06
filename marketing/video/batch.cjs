// Renders three faceless 1080x1920 shorts for TikTok / Reels / Facebook / X, plus a Pinterest pin and mockup.
// Usage: node batch.cjs <outdir> [preview]
// Facts used (checked on canada.ca 2026-10-31):
//  - TFSA: "The amount you withdraw will only be added back as available contribution room on January 1 of the next calendar year."
//    https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/tax-free-savings-account/withdraw.html
//  - GST/HST rates by place of supply (5% GST; ON 13%; NS 14% since 2025-04-01); services: generally the recipient's province.
//    https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/gst-hst-businesses/charge-collect-place-supply.html
//  - T2125 lines 8521, 8523 (50% max), 8811, 8860, 9220. https://www.canada.ca/en/revenue-agency/services/forms-publications/publications/t4002/t4002-5.html
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const OUT = path.resolve(process.argv[2] || '.');
const PREVIEW = process.argv[3] === 'preview';
const W = 1080, H = 1920, FPS = 30;
const coin = fs.readFileSync(path.join(__dirname, '../../site/dist/favicon.svg'), 'utf8');

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


// Hook scene for NEW videos (README "Hooks: beat the 3-second skip"): full hook readable on frame 1, dark spruce
// background that stands out in the feed, no brand bar for the first 3 s, motion from 0.0 s (punch-in zoom +
// bronze bar sweep). lines: [['text', 'bz'|''], ...] — keep it to ~7 words in total.
function hookScene(lines, sub) {
  return (t) => {
    const z = 1 + 0.06 * ease(t / 0.6), bar = ease(t / 0.5);
    return `<div style="position:absolute;inset:0;background:#102a22"></div>
    <div style="position:absolute;left:60px;right:60px;top:380px;height:1000px;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;transform:scale(${z});transform-origin:50% 50%">
      <div style="font-family:'Inter Display',Inter,sans-serif;font-weight:800;letter-spacing:-.03em;line-height:1.05;font-size:128px;color:#fff">
        ${lines.map(([txt, c]) => `<div style="${c === 'bz' ? 'color:#e0b25a' : ''}">${txt}</div>`).join('')}
      </div>
      <div style="margin-top:44px;height:14px;width:${560 * bar}px;background:#9a6b14;border-radius:7px"></div>
      ${sub ? `<div style="margin-top:36px;font-size:52px;color:#cfe7da;font-weight:600">${sub}</div>` : ''}
    </div>`;
  };
}

function endcard(product, line) {
  return (t) => `${brand}
  <div class="big" style="top:520px;font-size:100px;${st(fin(t, 0.05))}">${line}</div>
  <div class="small" style="top:930px;font-size:50px;color:#102a22;${st(fin(t, 0.6))}">The <b>${product}</b> does it for you.</div>
  <div style="position:absolute;left:72px;top:1140px;${st(fin(t, 0.9))}"><span class="pill">Get it at Loonie Ledger</span></div>
  <div class="small" style="top:1560px;font-size:32px;${st(fin(t, 1.3))}">Not tax advice. Check CRA for your situation.</div>`;
}

// ---------------- Video 1: TFSA withdrawal trap ----------------
const v1 = [
  ['hook', 3.0, hookScene([['Took money out of your TFSA?', ''], ["Don't put it back yet.", 'bz']])],
  ['ledger', 10.5, (t) => {
    const steps = [
      ['Jan', 'Room available', null, 7000],
      ['Mar', 'Put in', 5000, 2000],
      ['Jun', 'Took out', -2000, 2000],
      ['Sep', 'Put it back', 3000, -1000],
    ];
    const shown = steps.filter((_, i) => t > 1.2 + i * 1.9);
    const cur = shown.length ? shown[shown.length - 1][3] : 7000;
    const note = t > 1.2 + 2 * 1.9 + 0.6 && t < 1.2 + 3 * 1.9 ? `<div class="cap" style="top:1500px;font-size:48px;color:#46605a;${st(fin(t, 1.2 + 2 * 1.9 + 0.6))}">Taking $2,000 out does <u>not</u> give the room back this year.</div>` : '';
    const over = t > 1.2 + 3 * 1.9 + 0.5 ? `<div class="cap red" style="top:1480px;font-size:66px;${st(fin(t, 1.2 + 3 * 1.9 + 0.5))}">Over by $1,000.<br><span style="font-size:46px;color:#46605a">CRA taxes over-contributions.</span></div>` : '';
    return `${brand}
    <div class="cap" style="top:270px;${st(fin(t, 0.05))}">Example: $7,000 of room</div>
    <div class="card" style="top:430px;${st(fin(t, 0.4))}">
      <div class="head"><span>2026</span><span>Room left</span></div>
      ${shown.map(([m, l, a, r], i) => `<div class="row" style="${st(fin(t, 1.2 + i * 1.9), 20)}"><span><b>${m}</b> &nbsp;${l}${a === null ? '' : ` <span style="color:#46605a">${a > 0 ? '+' : '−'}${money(Math.abs(a))}</span>`}</span><b class="${r < 0 ? 'red' : ''}">${money(r)}</b></div>`).join('')}
    </div>
    <div style="position:absolute;right:120px;top:${430 + 92 + shown.length * 112 + 40}px;font-size:34px;color:#46605a;opacity:${shown.length ? 1 : 0}">Room left now: <b class="${cur < 0 ? 'red' : ''}" style="font-size:44px">${money(cur)}</b></div>
    ${note}${over}`;
  }],
  ['rule', 4.4, (t) => `${brand}
    <div class="cap" style="top:420px;${st(fin(t, 0.05))}">The rule</div>
    <div class="quote" style="top:620px;${st(fin(t, 0.4))}">“The amount you withdraw will only be added back … on January 1 of the next calendar year.”</div>
    <div class="small" style="top:1180px;left:150px;${st(fin(t, 0.9))}">— Canada Revenue Agency</div>`],
  ['end', 4.2, endcard('TFSA / RRSP / FHSA Room Tracker', 'Track your room <span class="bz">before</span> you deposit.')],
];

// ---------------- Video 2: same invoice, four tax lines ----------------
const prov = [
  ['Client in Alberta', 'GST (5%)', 50, 1050],
  ['Client in Ontario', 'HST (13%)', 130, 1130],
  ['Client in Nova Scotia', 'HST (14%)', 140, 1140],
  ['Not registered yet (small supplier)', null, 0, 1000],
];
const v2 = [
  ['hook', 3.0, hookScene([['Same $1,000 invoice.', ''], ['4 different totals.', 'bz']])],
  ['invoice', 10.4, (t) => {
    const i = Math.min(3, Math.floor(Math.max(0, t - 0.6) / 2.45));
    const [who, tax, amt, total] = prov[i];
    const k = fin(t, 0.6 + i * 2.45, 0.3);
    return `${brand}
    <div class="cap" style="top:260px;font-size:58px;${st(k, 16)}">${who}</div>
    <div class="card" style="top:470px;${st(fin(t, 0.05))}">
      <div style="display:flex;justify-content:space-between;padding:40px 44px 20px"><b style="font-size:46px">Your Business</b><b style="font-size:46px;letter-spacing:.08em;color:#1d5a45">INVOICE</b></div>
      <div class="head" style="margin-top:20px"><span>Description</span><span>Amount</span></div>
      <div class="row"><span>Design work</span><span>$1,000.00</span></div>
      <div class="row"><span style="color:#46605a">Subtotal</span><span>$1,000.00</span></div>
      <div class="row" style="background:#eef4f0;${tax ? '' : 'color:#9aa9a3'}"><span>${tax || 'No GST/HST line'}</span><b style="opacity:${k}">${tax ? '$' + amt.toFixed(2) : '—'}</b></div>
      <div class="row" style="background:#dcebe2;font-weight:800;font-size:50px"><span>Total</span><span style="opacity:${k}">$${total.toLocaleString('en-CA', { minimumFractionDigits: 2 })}</span></div>
    </div>
    <div class="cap" style="top:1500px;font-size:44px;color:#46605a">${['GST only in Alberta', 'Ontario is an HST province', 'Nova Scotia HST is 14% since April 2025', 'Not registered? You don\u2019t charge GST/HST'][i]}</div>`;
  }],
  ['rule', 4.4, (t) => `${brand}
    <div class="cap" style="top:480px;${st(fin(t, 0.05))}">The rule of thumb</div>
    <div class="big" style="top:700px;font-size:84px;text-align:center;${st(fin(t, 0.4))}">For services, the rate usually follows <span class="hl">where your client is.</span></div>
    <div class="small" style="top:1260px;text-align:center;${st(fin(t, 0.9))}">CRA calls it the “place of supply.”</div>`],
  ['end', 4.2, endcard('Freelancer Invoice Generator', 'Pick the province. <span class="bz">The tax line fills in.</span>')],
];

// ---------------- Video 3: sort these expenses ----------------
const items = [
  ['Business phone bill', '9220', 'Utilities', 'Business share only'],
  ['Lunch with a client', '8523', 'Meals & entertainment', '50% only'],
  ['Printer paper and ink', '8811', 'Office stationery & supplies', ''],
  ['Your accountant’s fee', '8860', 'Professional fees', ''],
  ['Flyers for your business', '8521', 'Advertising', ''],
];
const v3 = [
  ['hook', 3.0, hookScene([['Self-employed?', ''], ['Sort these 5 expenses.', 'bz']], 'Guess before it flips 👇')],
  ['sort', 13.2, (t) => {
    const per = 2.5;
    return `${brand}
    <div class="cap" style="top:250px;font-size:56px">Guess before it flips 👇</div>
    ${items.map(([e, line, name, note], i) => {
      const a = fin(t, 0.2 + i * per, 0.3), r = fin(t, 0.2 + i * per + 1.2, 0.3);
      return `<div class="card" style="top:${400 + i * 236}px;height:210px;padding:30px 40px;${st(a, 20)}">
        <div style="font-size:44px;font-weight:700">${e}</div>
        <div style="margin-top:14px;font-size:34px;opacity:${r}"><span class="tag">Line ${line}</span> &nbsp;${name}${note ? ` · <b class="bz">${note}</b>` : ''}</div></div>`;
    }).join('')}`;
  }],
  ['end', 4.2, endcard('Bookkeeping & GST/HST Tracker', 'Every expense, <span class="bz">tagged to its line.</span>')],
];

const videos = { 'tfsa-withdrawal-trap': v1, 'same-invoice-four-tax-lines': v2, 'sort-these-expenses': v3 };

// ---------------- Pinterest pin + mockup ----------------
const PIN = `<!doctype html><html><head><meta charset="utf-8"><style>*{box-sizing:border-box;margin:0}
body{width:1000px;height:1500px;background:#f5f9f6;font-family:Inter,sans-serif;color:#102a22;position:relative;overflow:hidden}
body:before{content:"";position:absolute;inset:0;background-image:linear-gradient(#e3eee7 2px,transparent 2px);background-size:100% 56px;opacity:.6}
.b{position:absolute;left:70px;top:80px;display:flex;gap:16px;align-items:center;font-weight:700;font-size:36px}.b svg{width:56px;height:56px}
h1{position:absolute;left:70px;right:70px;top:250px;font-family:"Inter Display",Inter;font-size:126px;line-height:1.02;letter-spacing:-.03em;font-weight:800}
.s{position:absolute;left:70px;right:70px;top:720px;font-size:40px;color:#46605a;line-height:1.35}
.bar{position:absolute;left:70px;right:70px;top:960px;height:44px;border-radius:22px;background:#dcebe2}.bar i{display:block;height:100%;width:92%;background:#1d5a45;border-radius:22px}
.k{position:absolute;left:70px;right:70px;top:1030px;display:flex;justify-content:space-between;font-size:40px;font-weight:700}
.f{position:absolute;left:70px;right:70px;bottom:90px;display:flex;justify-content:space-between;align-items:center;font-size:34px}
.f b{white-space:nowrap;background:#1d5a45;color:#fff;padding:18px 30px;border-radius:999px}${process.env.PIN_STYLE === 'light' ? '.hi{color:#9a6b14}.mut{color:#46605a}' : require('fs').readFileSync(require('path').join(__dirname, 'pin-dark.css'), 'utf8')}</style></head><body>
<div class="b">${coin}Loonie Ledger</div>
<h1>Do I need to register for <span class="hi">GST/HST?</span></h1>
<div class="s">The $30,000 small-supplier rule counts any single quarter, or any four quarters in a row.</div>
<div class="bar"><i></i></div><div class="k"><span>$27,600</span><span class="mut">of $30,000</span></div>
<div class="f"><span class="mut">Canadian side hustles &amp; freelancers</span><b>Free checker →</b></div></body></html>`;

function mockup(pinB64) {
  const tiles = [[360, '#e7dccb'], [470, '#d6e4ec'], [300, '#efe3e6'], [420, '#dfe8d6'], [380, '#e9e4f2']];
  return `<!doctype html><html><head><meta charset="utf-8"><style>*{box-sizing:border-box;margin:0}
  body{width:1800px;height:1500px;background:#eceeed;font-family:Inter,sans-serif;color:#111;display:flex;gap:90px;justify-content:center;align-items:center;position:relative}
  .lbl{position:absolute;top:44px;left:0;right:0;text-align:center;font-size:30px;color:#555;font-weight:600}
  .phone{width:620px;height:1280px;background:#fff;border-radius:70px;border:18px solid #1c1c1c;overflow:hidden;position:relative;box-shadow:0 40px 80px -30px rgba(0,0,0,.4)}
  .top{height:120px;display:flex;align-items:flex-end;justify-content:center;padding-bottom:18px;font-weight:700;font-size:26px;color:#333}
  .search{margin:6px 22px 18px;height:64px;border-radius:32px;background:#efefef;display:flex;align-items:center;padding:0 26px;color:#777;font-size:24px}
  .grid{columns:2;column-gap:14px;padding:0 16px}.grid div{break-inside:avoid;border-radius:22px;margin-bottom:14px}
  .grid img{width:100%;border-radius:22px;display:block;box-shadow:0 0 0 5px #1d5a45}
  .t{font-size:20px;font-weight:600;margin:8px 4px 0;line-height:1.25}
  .close{background:#f3f3f3;padding:24px 0 10px}.close img{width:78%;display:block;margin:0 auto;border-radius:24px}
  .meta{padding:26px 30px}.meta h2{font-size:34px;line-height:1.2;margin-bottom:12px}.meta p{font-size:22px;color:#444;line-height:1.4}
  .row{display:flex;justify-content:space-between;align-items:center;padding:0 30px}
  .visit{background:#e9e9e9;border-radius:999px;padding:18px 34px;font-weight:700;font-size:24px}.save{background:#333;color:#fff;border-radius:999px;padding:18px 34px;font-weight:700;font-size:24px}
  .dom{font-size:22px;color:#333;font-weight:600;padding:18px 30px 0}</style></head><body>
  <div class="lbl">Mockup — how the pin could look in a feed (left) and when tapped (right)</div>
  <div class="phone"><div class="top">Search results</div><div class="search">🔍&nbsp; gst registration canada</div>
    <div class="grid">
      <div style="height:${tiles[0][0]}px;background:${tiles[0][1]}"></div>
      <div><img src="data:image/png;base64,${pinB64}"><div class="t">Do I need to register for GST/HST?</div></div>
      <div style="height:${tiles[1][0]}px;background:${tiles[1][1]}"></div>
      <div style="height:${tiles[2][0]}px;background:${tiles[2][1]}"></div>
      <div style="height:${tiles[3][0]}px;background:${tiles[3][1]}"></div>
    </div></div>
  <div class="phone"><div class="close"><img src="data:image/png;base64,${pinB64}"></div>
    <div class="dom">shop.loonieledger.workers.dev</div>
    <div class="meta"><h2>Do you need to register for GST/HST? The $30,000 rule</h2>
    <p>Freelancing or running a side hustle in Canada? Check where you stand against the $30,000 small-supplier limit with the free checker. Not tax advice.</p></div>
    <div class="row"><span class="visit">Visit site</span><span class="save">Save</span></div></div>
  </body></html>`;
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: W, height: H } });
  const set = (inner) => page.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>${CSS}</style></head><body>${inner}</body></html>`);

  async function encode(file, frames) {
    const tmp = file.replace(/\.mp4$/, '.part.mp4');
    const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
      '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-pix_fmt', 'yuv420p', '-r', String(FPS), tmp]);
    const done = new Promise((res, rej) => ff.on('close', (c) => (c === 0 ? res() : rej(new Error('ffmpeg ' + c)))));
    for (const f of frames) if (!ff.stdin.write(f)) await new Promise((r) => ff.stdin.once('drain', r));
    ff.stdin.end(); await done; fs.renameSync(tmp, file);
  }

  for (const [name, scenes] of Object.entries(videos)) {
    const files = [];
    for (const [sname, secs, fn] of scenes) {
      if (PREVIEW) { await set(fn(0)); await page.screenshot({ path: path.join(OUT, `${name}-${sname}-t0.png`) }); await set(fn(secs - 0.1)); await page.screenshot({ path: path.join(OUT, `${name}-${sname}.png`) }); continue; }
      const frames = [];
      const n = Math.round(secs * FPS);
      for (let f = 0; f < n; f++) {
        const t = f / FPS, fade = clamp((secs - t) / 0.25);
        await set(`<div style="position:absolute;inset:0;opacity:${fade}">${fn(t)}</div>`);
        frames.push(await page.screenshot({ type: 'jpeg', quality: 92 }));
      }
      const file = path.join(OUT, `${name}-${sname}.mp4`); await encode(file, frames); files.push(file);
    }
    if (PREVIEW) continue;
    const list = path.join(OUT, `${name}.txt`);
    fs.writeFileSync(list, files.map((f) => `file '${f}'`).join('\n'));
    const final = path.join(OUT, `loonie-ledger-${name}.mp4`);
    await new Promise((res, rej) => spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list,
      '-f', 'lavfi', '-t', '40', '-i', 'anullsrc=r=44100:cl=stereo', '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-shortest', '-movflags', '+faststart', final])
      .on('close', (c) => (c === 0 ? res() : rej(new Error('concat ' + c)))));
    await new Promise((res, rej) => spawn(path.join(__dirname, 'add_outro.sh'), [final, final], { stdio: 'inherit' })
      .on('close', (c) => (c === 0 ? res() : rej(new Error('add_outro ' + c)))));
    await new Promise((res, rej) => spawn(path.join(__dirname, 'add_music.sh'), [final, final], { stdio: 'inherit' })
      .on('close', (c) => (c === 0 ? res() : rej(new Error('add_music ' + c)))));
    console.log('wrote', final);
  }

  // Pinterest
  const pin = await browser.newPage({ viewport: { width: 1000, height: 1500 } });
  await pin.setContent(PIN); const pinPath = path.join(OUT, 'pinterest-pin-gst-register.png'); await pin.screenshot({ path: pinPath });
  const mk = await browser.newPage({ viewport: { width: 1800, height: 1500 } });
  await mk.setContent(mockup(fs.readFileSync(pinPath).toString('base64'))); await mk.screenshot({ path: path.join(OUT, 'pinterest-mockup.png') });
  console.log('wrote pinterest');
  await browser.close();
}
// `node batch.cjs <outdir> pin` renders only the Pinterest pin
if (process.argv[3] === 'pin') (async () => { fs.mkdirSync(OUT, { recursive: true }); const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1000, height: 1500 } });
  await p.setContent(PIN); await p.screenshot({ path: path.join(OUT, 'pinterest-pin-gst-register.png') }); await b.close(); console.log('wrote pin'); })();
else main().catch((e) => { console.error(e); process.exit(1); });
