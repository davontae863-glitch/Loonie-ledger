// Renders the Loonie Ledger outro that ends every video: outro.mp4 (1080x1920, 30 fps, 2.8 s) with a coin "ding" (ding.wav).
// Usage: node make_outro.cjs   (writes next to this file; run `node site/build.mjs` first for the coin logo)
const { chromium } = require('playwright');
const { spawnSync, spawn } = require('child_process');
const fs = require('fs'), path = require('path');
const W = 1080, H = 1920, FPS = 30, SECS = 2.8, DIR = __dirname;
const coin = fs.readFileSync(path.join(DIR, '../../../site/dist/favicon.svg'), 'utf8');
const clamp = (x) => Math.min(1, Math.max(0, x)), ease = (x) => 1 - Math.pow(1 - clamp(x), 3);
const back = (x) => { x = clamp(x); const c = 1.9; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
const CSS = `*{box-sizing:border-box;margin:0}html,body{width:${W}px;height:${H}px;overflow:hidden}
body{background:#1d5a45;font-family:Inter,sans-serif;color:#fff;position:relative}
body:before{content:"";position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.07) 2px,transparent 2px);background-size:100% 64px}
.c{position:absolute;left:0;right:0;text-align:center}
.coin{position:absolute;left:50%;top:560px;width:300px;height:300px;margin-left:-150px}
.coin svg{width:100%;height:100%;filter:drop-shadow(0 30px 40px rgba(0,0,0,.35))}
.name{top:930px;font-family:"Inter Display",Inter,sans-serif;font-weight:800;font-size:128px;letter-spacing:-.03em}
.tag{top:1100px;font-size:50px;color:#cfe7da;font-weight:500}
.pill{top:1290px}.pill span{display:inline-block;background:#9a6b14;color:#fff;border-radius:999px;padding:24px 48px;font-size:44px;font-weight:700}
.shine{position:absolute;inset:0;background:radial-gradient(circle at 50% 710px,rgba(255,255,255,.18),transparent 45%)}`;
const frame = (t) => {
  const s = back(t / 0.5), rot = (1 - ease(t / 0.6)) * 540, glow = clamp(1 - Math.abs(t - 0.55) / 0.35);
  const a = ease((t - 0.45) / 0.35), b = ease((t - 0.8) / 0.35), c = ease((t - 1.1) / 0.35);
  const st = (o) => `opacity:${o};transform:translateY(${(1 - o) * 40}px)`;
  return `<div class="shine" style="opacity:${glow}"></div>
  <div class="coin" style="transform:scale(${s}) rotateY(${rot}deg)">${coin}</div>
  <div class="c name" style="${st(a)}">Loonie Ledger</div>
  <div class="c tag" style="${st(b)}">Canadian money, made simple.</div>
  <div class="c pill" style="${st(c)}"><span>Follow for a daily Canadian money tip</span></div>`;
};
(async () => {
  const browser = await chromium.launch(); const page = await browser.newPage({ viewport: { width: W, height: H } });
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-i', path.join(DIR, 'ding.wav'), '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-pix_fmt', 'yuv420p', '-r', String(FPS),
    '-c:a', 'aac', '-ar', '44100', '-ac', '2', '-af', `apad=whole_dur=${SECS}`, '-t', String(SECS), path.join(DIR, 'outro.mp4')]);
  const done = new Promise((res, rej) => ff.on('close', (c) => (c === 0 ? res() : rej(new Error('ffmpeg ' + c)))));
  for (let f = 0; f < SECS * FPS; f++) {
    await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>${CSS}</style></head><body>${frame(f / FPS)}</body></html>`);
    const jpg = await page.screenshot({ type: 'jpeg', quality: 92 });
    if (f === Math.round(2.5 * FPS)) fs.writeFileSync(path.join(DIR, 'outro-preview.jpg'), jpg);
    if (!ff.stdin.write(jpg)) await new Promise((r) => ff.stdin.once('drain', r));
  }
  ff.stdin.end(); await done; await browser.close(); console.log('wrote outro.mp4');
})();
