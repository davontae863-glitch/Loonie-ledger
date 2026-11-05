// Builds the owner's daily "posting kit" page: video + cover + TikTok/YouTube captions + Pinterest pin, with copy buttons.
// Usage: node marketing/kit/make_kit.mjs kit.json   -> writes site/src/media/kit-<date>.html (unlisted, noindex)
// kit.json: { "date": "YYYY-MM-DD", "topic": "...", "video": "<date>.mp4", "cover": "<date>-cover.jpg",
//   "tiktok_caption": "...", "youtube_title": "...", "youtube_caption": "...",
//   "pin": { "image": "<date>-pin.jpg", "title": "...", "description": "...", "link": "https://...", "board": "..." } }
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const k = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const field = (label, text) => `<div class="f"><div class="l">${label}<button onclick="cp(this)">Copy</button></div><pre>${esc(text)}</pre></div>`;
const html = `<!doctype html><html lang="en-CA"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<title>Posting kit ${esc(k.date)} — Loonie Ledger</title><style>
body{margin:0;background:#f5f9f6;color:#102a22;font:16px/1.5 system-ui,-apple-system,sans-serif}main{max-width:640px;margin:0 auto;padding:20px 16px 60px}
h1{font-size:1.5rem;margin:0 0 4px}h2{font-size:1.15rem;margin:28px 0 10px;padding-top:16px;border-top:2px solid #cfe0d6}.m{color:#46605a}
.f{background:#fff;border:1px solid #cfe0d6;border-radius:10px;padding:10px 12px;margin:10px 0}.l{display:flex;justify-content:space-between;align-items:center;font-weight:600;font-size:.9rem;color:#1d5a45}
pre{white-space:pre-wrap;word-break:break-word;font:inherit;margin:6px 0 0}button{font:inherit;font-size:.85rem;font-weight:600;border:1px solid #1d5a45;background:#1d5a45;color:#fff;border-radius:99px;padding:4px 12px}
.dl{display:inline-block;margin:6px 8px 0 0;padding:10px 16px;border-radius:8px;background:#1d5a45;color:#fff;text-decoration:none;font-weight:600}.dl.s{background:#fff;color:#1d5a45;border:1px solid #1d5a45}
img,video{max-width:100%;border-radius:10px;border:1px solid #cfe0d6;display:block;margin-top:8px}.row{display:flex;gap:10px}.row>*{flex:1;min-width:0;width:0}
</style></head><body><main>
<h1>Posting kit · ${esc(k.date)}</h1><p class="m">${esc(k.topic)}. Instagram and Facebook are already posted automatically. These are for TikTok, YouTube Shorts and Pinterest.</p>
<h2>1. TikTok + YouTube Short</h2>
<div class="row"><video src="/media/${esc(k.video)}" controls playsinline preload="metadata" poster="/media/${esc(k.cover)}"></video><img src="/media/${esc(k.cover)}" alt="Cover"></div>
<a class="dl" href="/media/${esc(k.video)}" download>Download video</a><a class="dl s" href="/media/${esc(k.cover)}" download>Download cover</a>
${field('TikTok caption', k.tiktok_caption)}${field('YouTube title', k.youtube_title)}${field('YouTube description', k.youtube_caption)}
<p class="m">TikTok: pick the cover frame ~1.5 s in and add a quiet trending sound. YouTube: category Education, not made for kids.</p>
<h2>2. Pinterest pin</h2><img src="/media/${esc(k.pin.image)}" alt="Pin image"><a class="dl" href="/media/${esc(k.pin.image)}" download>Download pin</a>
${field('Title', k.pin.title)}${field('Description', k.pin.description)}${field('Link', k.pin.link)}${field('Board', k.pin.board)}
<p class="m">Schedule both for 5:37 PM Mountain. Not tax advice is already in every caption.</p>
</main><script>function cp(b){var t=b.parentNode.nextElementSibling.textContent;navigator.clipboard.writeText(t).then(function(){b.textContent='Copied';setTimeout(function(){b.textContent='Copy'},1500)})}</script></body></html>`;
const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const out = join(root, 'site/src/media', `kit-${k.date}.html`);
writeFileSync(out, html);
console.log('wrote', out);
