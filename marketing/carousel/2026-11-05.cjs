// Midday carousel example (2026-11-05, December bookkeeping checklist). Copy this for new carousels.
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
// STYLE=light|dark (from `python3 marketing/video/pin_style.py <date> carousel`); output dir = argv[2] or site/src/media
const STYLE = process.env.STYLE || 'light', OUTDIR = process.argv[2] || path.join(__dirname, '../../site/src/media');
const ROOT = path.join(__dirname, '../..');
const W=1080,H=1350, D='2026-11-05';
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
ul{list-style:none;padding:0}li{padding:14px 0;border-bottom:2px solid #e1ece5}li:last-child{border:none}`
  + (STYLE === 'dark' ? fs.readFileSync(path.join(__dirname, 'carousel-dark.css'), 'utf8') : '');
const brand=`<div class="brand">${coin}Loonie Ledger</div>`;
const foot=(n)=>`<div class="foot"><span>Not tax advice — check CRA for your situation.</span><span>${n}/5</span></div>`;
const slides=[
`${brand}<div style="margin-top:110px" class="cal"><div>DEC</div><div>31</div></div>
<div class="big" style="font-size:118px;margin-top:60px">December bookkeeping checklist</div>
<div class="big bz" style="font-size:72px;margin-top:34px">5 things before Jan 1</div>
<div class="small" style="margin-top:40px">For Canadian sole proprietors. Swipe →</div>${foot(1)}`,
`${brand}<div style="margin-top:90px;display:flex;align-items:center;gap:28px"><span class="num">1</span><span class="big" style="font-size:74px">Total your sales by quarter</span></div>
<div class="small" style="margin-top:50px;color:#102a22;font-size:44px">Compare them with the <b>$30,000</b> GST/HST small-supplier threshold.</div>
<div class="card" style="margin-top:50px"><ul><li>Over $30,000 in <b>one calendar quarter</b>, or</li><li>over $30,000 across the <b>last four quarters</b> together</li></ul></div>
<div class="small" style="margin-top:36px">Either way, you're no longer a small supplier.</div>${foot(2)}`,
`${brand}<div style="margin-top:90px;display:flex;align-items:center;gap:28px"><span class="num">2</span><span class="big" style="font-size:74px">Write down your odometer</span></div>
<div class="small" style="margin-top:50px;color:#102a22;font-size:44px">Drive for work? CRA asks for each vehicle's reading at the <b>start and end</b> of the fiscal period.</div>
<div class="card" style="margin-top:50px;text-align:center"><div class="small">Odometer · Dec 31</div><div class="big" style="font-size:110px;letter-spacing:.06em;margin-top:6px">0 4 8 2 1 7</div><div class="small" style="font-size:28px">example reading</div></div>
<div class="small" style="margin-top:36px">For a Dec 31 year-end, that's December 31.</div>${foot(3)}`,
`${brand}<div class="big" style="font-size:74px;margin-top:90px">Then tidy the rest</div>
<div style="margin-top:50px;display:flex;flex-direction:column;gap:30px">
<div class="card" style="display:flex;gap:26px;align-items:center"><span class="num">3</span><span>Match bank statements and deposit slips to your income log</span></div>
<div class="card" style="display:flex;gap:26px;align-items:center"><span class="num">4</span><span>No receipt? Write down the seller's name and address, amount, date and what you bought</span></div>
<div class="card" style="display:flex;gap:26px;align-items:center"><span class="num">5</span><span>List who still owes you and follow up on unpaid invoices</span></div></div>${foot(4)}`,
`${brand}<div class="big" style="font-size:96px;margin-top:130px">Start with <span class="hl">step 1</span>.</div>
<div class="small" style="margin-top:50px;color:#102a22;font-size:48px">Type in your quarterly sales and the <b>free GST/HST threshold checker</b> shows where you stand.</div>
<div style="margin-top:70px"><span class="pill">Link in bio</span></div>
<div class="small" style="margin-top:50px">Self-employed individuals generally have to use a December 31 year-end.</div>${foot(5)}`];
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:W,height:H}});
for(let i=0;i<slides.length;i++){await p.setContent(`<style>${CSS}</style><div class="wrap">${slides[i]}</div>`);
const ov=await p.evaluate(()=>{const w=document.querySelector('.wrap');return w.scrollHeight>w.clientHeight});
await p.screenshot({path:path.join(OUTDIR, `${D}-post-${i+1}.jpg`),type:'jpeg',quality:90});console.log(i+1,'overflow',ov);}
await b.close();})();
