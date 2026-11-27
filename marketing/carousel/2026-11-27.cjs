// Midday carousel 2026-11-27: Snapped the receipt? Don't toss it yet (Canadian money mistake #18).
// Facts re-checked 2026-11-27 via canada.ca exact-phrase search results (direct fetch unavailable to this unattended run):
// CRA "Acceptable format, imaging paper documents and backing up electronic files" —
//   "Generally, you must keep originals of your paper documents."; "You can use electronic imaging software to keep images of paper records.";
//   image must be "an accurate reproduction", give the same information, "significant details of the image are not obscured because of
//   limitations in resolution, tonality or hue"; imaged to CGSB standards -> images become the permanent records;
//   "If you have any doubt about destroying any paper records, get legal advice first."; electronic records: keep them
//   "in an electronic readable format, even if you have paper printouts"; you should make backup copies (recommendation).
//   https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/keeping-records/acceptable-format-imaging-paper-documents-backing-electronic-files.html
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
// STYLE=light|dark (from `python3 marketing/video/pin_style.py <date> carousel`); output dir = argv[2] or site/src/media
const STYLE = process.env.STYLE || 'light', OUTDIR = process.argv[2] || path.join(__dirname, '../../site/src/media');
const ROOT = path.join(__dirname, '../..');
const W=1080,H=1350, D='2026-11-27';
const coin = fs.readFileSync(ROOT+'/site/dist/favicon.svg','utf8');
const CSS = `*{box-sizing:border-box;margin:0}html,body{width:${W}px;height:${H}px;overflow:hidden}
body{background:#f5f9f6;font-family:Inter,sans-serif;color:#102a22;position:relative}
body:before{content:"";position:absolute;inset:0;background-image:linear-gradient(#e3eee7 2px,transparent 2px);background-size:100% 64px;opacity:.6}
.wrap{position:absolute;inset:0;padding:90px 80px;display:flex;flex-direction:column}
.brand{display:flex;align-items:center;gap:16px;font-weight:700;font-size:36px}.brand svg{width:56px;height:56px}
.big{font-weight:800;letter-spacing:-.03em;line-height:1.05}
.num{flex-shrink:0;display:inline-flex;align-items:center;justify-content:center;width:96px;height:96px;border-radius:50%;background:#1d5a45;color:#fff;font-weight:800;font-size:52px}
.small{font-size:38px;color:#46605a;line-height:1.4}
.bz{color:#9a6b14}.hl{background:#1d5a45;color:#fff;padding:0 .18em;border-radius:.12em}
.card{background:#fff;border:3px solid #cfe0d6;border-radius:28px;box-shadow:0 30px 60px -30px rgba(16,42,34,.35);padding:34px 40px;font-size:38px;line-height:1.4}
.pill{display:inline-block;background:#1d5a45;border-radius:999px;padding:22px 44px;font-size:44px;font-weight:700;color:#fff}
.foot{margin-top:auto;font-size:28px;color:#46605a;display:flex;justify-content:space-between}
.cal{width:200px;border-radius:22px;overflow:hidden;border:3px solid #cfe0d6;background:#fff;text-align:center}
.cal div:first-child{background:#9a6b14;color:#fff;font-weight:800;font-size:38px;padding:8px}.cal div:last-child{font-size:96px;font-weight:800;padding:6px 0 10px}
ul{list-style:none;padding:0}li{padding:14px 0;border-bottom:2px solid #e1ece5}li:last-child{border:none}
.strike{text-decoration:line-through;text-decoration-color:#b3261e;text-decoration-thickness:6px;color:#7d8f88}
.row{display:flex;justify-content:space-between;gap:20px}
.step{background:#fff;border:3px solid #cfe0d6;border-radius:22px;padding:18px 0;font-weight:800;font-size:40px;text-align:center}
.mini{height:64px;border-radius:12px;border:3px solid #cfe0d6;background:#fff;font-size:26px;font-weight:700;display:flex;align-items:center;justify-content:center;color:#46605a}`
  + (STYLE === 'dark' ? fs.readFileSync(path.join(__dirname, 'carousel-dark.css'), 'utf8') : '');
const brand=`<div class="brand">${coin}Loonie Ledger</div>`;
const foot=(n)=>`<div class="foot"><span>Not tax advice — check CRA for your situation.</span><span>${n}/5</span></div>`;
const slides=[
`${brand}<div class="small bz" style="margin-top:150px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;font-size:34px">Canadian money mistake #18</div>
<div class="big" style="font-size:132px;margin-top:30px">Snapped the receipt? <span class="bz">Don't toss it</span> yet.</div>
<div class="small" style="margin-top:50px">Why, swipe →</div>${foot(1)}`,
`${brand}<div class="big" style="font-size:88px;margin-top:90px">CRA: keep the <span class="hl">paper</span></div>
<div class="card" style="margin-top:56px;font-size:46px;font-weight:700">“Generally, you must keep <span class="bz">originals</span> of your paper documents.”</div>
<div class="card" style="margin-top:36px;font-size:42px">A photo can help you stay organized: CRA lets you keep images of paper records too.</div>${foot(2)}`,
`${brand}<div class="big" style="font-size:88px;margin-top:90px">When can the paper <span class="bz">go?</span></div>
<div class="card" style="margin-top:56px;font-size:42px">Only if it was imaged to the <b>CGSB national standard</b>. Then the images become the permanent records.</div>
<div class="card" style="margin-top:36px;font-size:42px">Not sure? CRA says <b>get legal advice first</b> before destroying paper records.</div>${foot(3)}`,
`${brand}<div class="big" style="font-size:84px;margin-top:90px">A <span class="bz">good</span> receipt image</div>
<div class="card" style="margin-top:50px;font-size:40px"><ul>
<li>✓ An accurate copy of the receipt</li>
<li>✓ Shows the same info as the paper</li>
<li>✓ Not blurry, faded or too dark</li>
<li>✓ Emailed receipt? Keep the digital file, even if you print it</li>
<li>✓ Back up your files</li></ul></div>${foot(4)}`,
`${brand}<div class="big" style="font-size:84px;margin-top:110px">Did you <span class="bz">know this?</span></div>
<div class="small" style="margin-top:40px;color:#102a22;font-size:46px">Reply yes or no below. Save this for tax time.</div>
<div style="margin-top:70px"><span class="pill">Follow for a daily Canadian money tip</span></div>
<div class="small" style="margin-top:40px;color:#102a22">Then log every expense by T2125 line: Bookkeeping &amp; GST/HST Tracker — link in bio</div>${foot(5)}`];
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:W,height:H}});
for(let i=0;i<slides.length;i++){await p.setContent(`<style>${CSS}</style><div class="wrap">${slides[i]}</div>`);
const ov=await p.evaluate(()=>{const w=document.querySelector('.wrap');return w.scrollHeight>w.clientHeight});
await p.screenshot({path:path.join(OUTDIR, `${D}-post-${i+1}.jpg`),type:'jpeg',quality:90});console.log(i+1,'overflow',ov);}
await b.close();})();
