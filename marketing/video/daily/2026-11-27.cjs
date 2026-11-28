// Daily evening Reel, 2026-11-27: "Snapped the receipt? Don't toss it yet." — Canadian money mistake #19.
// Music only (day-of-year 331, odd). STYLE=light|dark (pin_style.py 2026-11-27 video -> light).
// Usage: STYLE=light node marketing/video/daily/2026-11-27.cjs <out.mp4> [preview-dir]
// Facts re-checked on canada.ca 2026-11-27 evening: CRA "Acceptable format, imaging paper documents and backing up electronic files"
// (modified 2026-08-03): "Generally, you must keep originals of your paper documents."; images made to CGSB standards "become the
// permanent records"; image must be an accurate reproduction, give the same information, details not obscured by resolution,
// tonality or hue; electronic records kept "in an electronic readable format, even if you have paper printouts"; "You should make
// backup copies". Receipt amounts are a labelled example (5% GST).
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


const receipt = (w = 300, blur = 0, dim = 1) => `<div style="width:${w}px;background:#fff;border:3px solid #cfd8d2;border-radius:10px 10px 0 0;padding:${w * 0.09}px;box-shadow:0 30px 60px -25px rgba(0,0,0,.4);filter:blur(${blur}px) brightness(${dim});font-family:monospace;color:#102a22;font-size:${w * 0.075}px;line-height:1.5;text-align:left">
  <div style="font-weight:800;text-align:center;font-size:${w * 0.09}px">RECEIPT</div><div style="border-top:2px dashed #9aa;margin:8px 0"></div>
  <div style="display:flex;justify-content:space-between"><span>Printer ink</span><span>$54.00</span></div>
  <div style="display:flex;justify-content:space-between"><span>GST 5%</span><span>$2.70</span></div>
  <div style="border-top:2px dashed #9aa;margin:8px 0"></div><div style="display:flex;justify-content:space-between;font-weight:800"><span>TOTAL</span><span>$56.70</span></div>
  <div style="margin-top:10px;font-size:${w * 0.055}px;color:#557">Nov 27 · Example</div></div>`;
const phone = (inner, s = 1) => `<div style="width:${360 * s}px;height:${640 * s}px;border-radius:${56 * s}px;background:#0b1f19;border:${10 * s}px solid #24453a;display:flex;align-items:center;justify-content:center;overflow:hidden;box-shadow:0 40px 80px -30px rgba(0,0,0,.5)">${inner}</div>`;
const mark = (ok, o, sz = 150) => `<div style="width:${sz}px;height:${sz}px;border-radius:50%;background:${ok ? '#1f7a4d' : red};color:#fff;display:flex;align-items:center;justify-content:center;font-size:${sz * 0.6}px;font-weight:900;opacity:${o};transform:scale(${0.4 + 0.6 * o})">${ok ? '✓' : '✕'}</div>`;
const fileIcon = (label, o = 1, x = 0) => `<div style="width:220px;height:280px;background:${panel};border:5px solid ${edge};border-radius:18px 60px 18px 18px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;opacity:${o};transform:translateX(${x}px)"><div style="font-size:90px">📄</div><div style="font-size:34px;font-weight:800;color:${ink}">${label}</div></div>`;

const scenes = [
  ['hook', 3.0, (t) => { const fl = Math.max(0, 1 - Math.abs(t - 1.0) / 0.25);
    return hookScene(['Snapped the receipt?', '<b class="h">Don\'t toss it</b> yet.'], 'Canadian money mistake #19')(t) +
      `<div style="position:absolute;left:0;right:0;top:1330px;display:flex;justify-content:center;gap:50px;align-items:center;font-size:120px"><span style="transform:rotate(${-8 + 16 * ease(t / 0.6)}deg);display:inline-block">📸</span><span>🧾</span></div>
      <div style="position:absolute;inset:0;background:#fff;opacity:${0.55 * fl};pointer-events:none"></div>`; }],
  ['paper', 1.6, (t) => { const d = ease(t / 0.45);
    return `${brand}${cap(t, 'CRA: generally keep the <span class="bz">paper original</span>')}
    <div style="position:absolute;left:0;right:0;top:${700 - 300 * (1 - d)}px;display:flex;justify-content:center;opacity:${d}">${receipt(460)}</div>
    <div style="position:absolute;left:0;right:0;top:1330px;text-align:center;${st(fin(t, 0.6, 0.25), 20)}"><span class="tag" style="font-size:44px;padding:14px 30px;background:${gold};color:#102a22">Keep the paper</span></div>`; }],
  ['cgsb', 1.6, (t) => { const s = ease(t / 0.45);
    return `${brand}${cap(t, 'A photo replaces it <span class="bz">only if</span> imaged to the CGSB standard', 360)}
    <div style="position:absolute;left:0;right:0;top:700px;display:flex;justify-content:center;align-items:center;gap:60px">
      <div>${receipt(330)}</div>
      <div style="transform:translateX(${(1 - s) * 300}px);opacity:${s}">${phone(receipt(250), 0.95)}</div>
    </div>
    <div class="small" style="top:1430px;text-align:center;font-size:36px;${st(fin(t, 0.7, 0.25), 20)}">CGSB = Canadian General Standards Board</div>`; }],
  ['accurate', 1.6, (t) => `${brand}${cap(t, '<span class="grn">✓</span> Whole receipt, accurate copy')}
    <div style="position:absolute;left:0;right:0;top:640px;display:flex;justify-content:center">${phone(receipt(280), 1.05)}</div>
    <div style="position:absolute;left:0;right:0;top:1100px;display:flex;justify-content:center;margin-left:330px">${mark(true, fin(t, 0.3, 0.25))}</div>
    <div class="small" style="top:1400px;text-align:center;font-size:38px;font-weight:700;${st(fin(t, 0.6, 0.25), 20)}">Same info as the paper</div>`],
  ['blurry', 1.6, (t) => { const sharp = t > 0.8, sh = sharp ? 0 : Math.sin(t * 60) * 12 * (1 - t / 0.8);
    return `${brand}${cap(t, 'Blurry or too dark? <span class="bz">Retake it</span>')}
    <div style="position:absolute;left:0;right:0;top:640px;display:flex;justify-content:center;transform:translateX(${sh}px)">${phone(sharp ? receipt(280) : receipt(280, 7, 0.45), 1.05)}</div>
    <div style="position:absolute;left:0;right:0;top:1100px;display:flex;justify-content:center;margin-left:330px">${sharp ? mark(true, fin(t, 0.85, 0.2)) : mark(false, fin(t, 0.2, 0.2))}</div>`; }],
  ['email', 1.8, (t) => { const a = fin(t, 0.35, 0.3);
    return `${brand}${cap(t, 'Emailed receipt? <span class="bz">Keep the digital file</span>', 360)}
    <div style="position:absolute;left:0;right:0;top:720px;display:flex;justify-content:center;align-items:center;gap:40px">
      <div style="font-size:200px">📧</div>
      <div style="font-size:110px;font-weight:800;color:${gold};opacity:${a}">→</div>
      ${fileIcon('PDF', fin(t, 0.6, 0.25))}
    </div>
    <div class="big" style="top:1220px;text-align:center;font-size:72px;${st(fin(t, 0.95, 0.25), 20)}">— even if you <span class="bz">print it</span></div>`; }],
  ['backup', 1.8, (t) => { const m = ease((t - 0.3) / 0.8);
    return `${brand}${cap(t, '<span class="bz">Back up</span> your files')}
    <div style="position:absolute;left:0;right:0;top:700px;height:320px;display:flex;justify-content:center;align-items:center;gap:200px;position:absolute">
      ${fileIcon('Receipts')}
      ${fileIcon('Backup', fin(t, 1.0, 0.25))}
    </div>
    <div style="position:absolute;top:790px;left:${380 + 260 * m}px;font-size:90px;opacity:${t > 0.3 && t < 1.25 ? 1 : 0}">📄</div>
    <div class="small" style="top:1150px;text-align:center;font-size:38px;font-weight:700;${st(fin(t, 1.1, 0.25), 20)}">CRA says you should keep backups</div>`; }],
  ['end', 2.0, (t) => `${brand}
    <div class="big" style="top:440px;font-size:100px;${st(fin(t, 0.0, 0.2))}">Then log every expense <span class="bz">by T2125 line</span></div>
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
