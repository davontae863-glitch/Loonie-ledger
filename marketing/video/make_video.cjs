// Renders a faceless 1080x1920 short: the GST/HST "four quarters" rule, with a real demo of the site's checker.
// Usage: node make_video.cjs <outdir> [preview]
// Needs the built site served at http://localhost:8765 (python3 -m http.server 8765 in site/dist).
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const OUT = path.resolve(process.argv[2] || '.');
const PREVIEW = process.argv[3] === 'preview';
const W = 1080, H = 1920, FPS = 30;
const coin = fs.readFileSync(path.join(__dirname, '../../site/dist/favicon.svg'), 'utf8');

const CSS = `*{box-sizing:border-box;margin:0}html,body{width:${W}px;height:${H}px;overflow:hidden}
body{background:#f5f9f6;font-family:Inter,sans-serif;color:#102a22;position:relative}
body:before{content:"";position:absolute;inset:0;background-image:linear-gradient(#e3eee7 2px,transparent 2px);background-size:100% 64px;opacity:.6}
.brand{position:absolute;left:72px;top:110px;display:flex;align-items:center;gap:18px;font-weight:700;font-size:40px}
.brand svg{width:64px;height:64px}
.big{position:absolute;left:72px;right:72px;font-family:"Inter Display",Inter,sans-serif;font-weight:800;letter-spacing:-.03em;line-height:1.05}
.cap{position:absolute;left:60px;right:60px;text-align:center;font-weight:800;font-size:64px;line-height:1.12;letter-spacing:-.02em}
.hl{background:#1d5a45;color:#fff;padding:0 .18em;border-radius:.12em;box-decoration-break:clone;-webkit-box-decoration-break:clone}
.bz{color:#9a6b14}
.small{position:absolute;left:72px;right:72px;font-size:34px;color:#46605a;line-height:1.4}
.bars{position:absolute;left:110px;right:110px;bottom:560px;height:560px;display:flex;align-items:flex-end;gap:44px}
.bar{flex:1;background:#1d5a45;border-radius:22px 22px 8px 8px;position:relative}
.bar b{position:absolute;top:-78px;left:0;right:0;text-align:center;font-size:44px}
.bar i{position:absolute;bottom:-70px;left:0;right:0;text-align:center;font-style:normal;font-size:34px;color:#46605a}
.bracket{position:absolute;left:110px;right:110px;bottom:1210px;border:6px solid #9a6b14;border-bottom:none;height:44px;border-radius:14px 14px 0 0}
.shot{position:absolute;left:50%;transform:translateX(-50%);border-radius:28px;box-shadow:0 40px 80px -30px rgba(16,42,34,.35)}
.pill{display:inline-block;background:#fff;border:3px solid #9dbcaa;border-radius:999px;padding:18px 34px;font-size:40px;font-weight:700;color:#1d5a45}`;

const ease = (x) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);
const fadeIn = (t, start, dur = 0.35) => ease((t - start) / dur);
const style = (o, dy = 40) => `opacity:${o};transform:translateY(${(1 - o) * dy}px)`;

// ---------- scene builders: return HTML for time t (seconds into the scene) ----------
function hook(t) {  // README "Hooks: beat the 3-second skip": full hook on frame 1, dark background, motion from 0.0 s
  const z = 1 + 0.06 * ease(t / 0.6), bar = ease(t / 0.5);
  return `<div style="position:absolute;inset:0;background:#102a22"></div>
  <div style="position:absolute;left:60px;right:60px;top:380px;height:1000px;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;transform:scale(${z})">
    <div style="font-family:'Inter Display',Inter,sans-serif;font-weight:800;letter-spacing:-.03em;line-height:1.05;font-size:128px;color:#fff">
      <div>You can hit the GST limit</div><div style="color:#e0b25a">without making $30K.</div></div>
    <div style="margin-top:44px;height:14px;width:${560 * bar}px;background:#9a6b14;border-radius:7px"></div>
  </div>`;
}
function rule(t) {
  const q = [['6,000', 'Q4'], ['7,000', 'Q1'], ['8,000', 'Q2'], ['10,000', 'Q3']];
  const max = 10000;
  const vals = [6000, 7000, 8000, 10000];
  const head = fadeIn(t, 0.05), sub = fadeIn(t, 0.7), br = fadeIn(t, 3.0), tot = fadeIn(t, 3.3);
  return `<div class="brand">${coin}Loonie Ledger</div>
  <div class="cap" style="top:300px;${style(head)}">It's not January to December.</div>
  <div class="cap" style="top:470px;font-size:56px;color:#46605a;${style(sub)}">CRA counts <span class="hl">any 4 quarters in a row</span></div>
  <div class="cap" style="top:1500px;font-size:66px;${style(tot, 20)}"><span class="bz">$31,000</span> together<br>= over $30,000</div>
  <div class="bars">${vals.map((v, i) => { const g = ease((t - 1.0 - i * 0.35) / 0.6); return `<div class="bar" style="height:${(v / max) * 100 * g}%;opacity:${g > 0 ? 1 : 0}"><b style="opacity:${g}">$${q[i][0]}</b><i>${q[i][1]}</i></div>`; }).join('')}</div>`;
}
function endcard(t) {
  const a = fadeIn(t, 0.05), b = fadeIn(t, 0.6), c = fadeIn(t, 1.2);
  return `<div class="brand">${coin}Loonie Ledger</div>
  <div class="big" style="top:560px;font-size:112px;${style(a)}">Check yours <span class="bz">free.</span></div>
  <div class="small" style="top:860px;font-size:48px;color:#102a22;${style(b)}">Type your last four quarters into the free GST/HST checker.</div>
  <div style="position:absolute;left:72px;top:1120px;${style(b)}"><span class="pill">Free at Loonie Ledger</span></div>
  <div class="small" style="top:1600px;font-size:32px;${style(c)}">Not tax advice. Check CRA's "When to register" page for your situation.</div>`;
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const frame = await browser.newPage({ viewport: { width: W, height: H } });
  const site = await browser.newPage({ viewport: { width: 420, height: 1000 }, deviceScaleFactor: 2.4 });

  const setFrame = async (inner) => frame.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>${CSS}</style></head><body>${inner}</body></html>`);
  const grab = async () => frame.screenshot({ type: 'jpeg', quality: 92 });

  // Encodes a list of {jpg, n} (frame buffer held for n frames) into one scene file.
  async function encode(name, frames) {
    const tmp = path.join(OUT, `${name}.part.mp4`), fin = path.join(OUT, `${name}.mp4`);
    const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
      '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-pix_fmt', 'yuv420p', '-r', String(FPS), tmp]);
    const done = new Promise((res, rej) => ff.on('close', (c) => (c === 0 ? res() : rej(new Error(name + ' ffmpeg ' + c)))));
    for (const { jpg, n } of frames) for (let i = 0; i < n; i++) if (!ff.stdin.write(jpg)) await new Promise((r) => ff.stdin.once('drain', r));
    ff.stdin.end(); await done; fs.renameSync(tmp, fin); return fin;
  }
  async function animated(name, fn, seconds, previewAt) {
    if (PREVIEW) { for (const s of previewAt) { await setFrame(fn(s)); await frame.screenshot({ path: path.join(OUT, `${name}-${s}.png`) }); } return; }
    const frames = [];
    for (let f = 0; f < seconds * FPS; f++) { await setFrame(fn(f / FPS)); frames.push({ jpg: await grab(), n: 1 }); }
    return encode(name, frames);
  }

  const files = [];
  files.push(await animated('s1-hook', hook, 3.0, [0, 2.9]));
  files.push(await animated('s2-rule', rule, 5.2, [5.1]));

  // ---------- Scene 3: real checker demo ----------
  await site.goto('http://localhost:8765/gst-threshold-checker/');
  await site.addStyleTag({ content: 'body,*{font-family:Inter,sans-serif !important}' });
  await site.evaluate(() => { for (const el of document.querySelectorAll('.sheet p, .sheet div')) if (/^Under CRA rules/.test(el.textContent.trim())) el.style.display = 'none'; });
  const sheet = site.locator('#tool-q0').locator('xpath=ancestor::section[contains(@class,"sheet")]');
  const shotHTML = (jpg, top, bottom) => `<div class="brand">${coin}Loonie Ledger</div>
    <div class="cap" style="top:250px;font-size:58px">${top}</div>
    <img class="shot" style="top:420px;width:880px" src="data:image/jpeg;base64,${jpg.toString('base64')}">
    <div class="cap" style="top:1600px;font-size:50px;color:#46605a">${bottom}</div>`;
  const s3 = [];
  const state = async (top, bottom, n) => {
    const jpg = await sheet.screenshot({ type: 'jpeg', quality: 92 });
    await setFrame(shotHTML(jpg, top, bottom));
    s3.push({ jpg: await grab(), n });
  };
  const TOP1 = 'Each quarter looks small…', BOT = 'The free checker on our site';
  for (const id of ['#tool-q0', '#tool-q1', '#tool-q2', '#tool-q3']) await site.fill(id, '');
  await state(TOP1, BOT, 18);
  const vals = [['#tool-q0', '10000'], ['#tool-q1', '8000'], ['#tool-q2', '7000'], ['#tool-q3', '6000']];
  for (const [id, v] of vals) {
    await site.focus(id);
    for (const ch of v) { await site.type(id, ch); await state(TOP1, BOT, 4); }
    await state(TOP1, BOT, 8);
  }
  await site.locator('body').click({ position: { x: 5, y: 5 } });
  await state('Together: <span class="bz">$31,000.</span><br>That’s over.', BOT, 90);
  if (PREVIEW) { await frame.screenshot({ path: path.join(OUT, 's3-demo-end.png') }); }
  else files.push(await encode('s3-demo', s3));

  files.push(await animated('s4-end', endcard, 4.2, [4.1]));
  await browser.close();
  if (PREVIEW) return;

  const list = path.join(OUT, 'list.txt');
  fs.writeFileSync(list, files.map((f) => `file '${f}'`).join('\n'));
  const final = path.join(OUT, 'loonie-ledger-gst-four-quarters.mp4');
  await new Promise((res, rej) => spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list,
    '-f', 'lavfi', '-t', '30', '-i', 'anullsrc=r=44100:cl=stereo', '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-shortest', '-movflags', '+faststart', final])
    .on('close', (c) => (c === 0 ? res() : rej(new Error('concat ' + c)))));
  await new Promise((res, rej) => spawn(path.join(__dirname, 'add_outro.sh'), [final, final], { stdio: 'inherit' })
      .on('close', (c) => (c === 0 ? res() : rej(new Error('add_outro ' + c)))));
    await new Promise((res, rej) => spawn(path.join(__dirname, 'add_music.sh'), [final, final], { stdio: 'inherit' })
      .on('close', (c) => (c === 0 ? res() : rej(new Error('add_music ' + c)))));
    console.log('wrote', final);
}
main().catch((e) => { console.error(e); process.exit(1); });
