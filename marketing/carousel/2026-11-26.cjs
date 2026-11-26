// Midday carousel 2026-11-26: Do you charge GST? Type 4 numbers — free GST/HST checker demo (Tax-season prep #7).
// Facts re-checked 2026-11-26 on canada.ca (page fetched, date modified 2026-06-16):
// CRA "When to register for and start charging the GST/HST" — "You exceed the $30,000 threshold in a single calendar quarter."
//   → "You are no longer a small supplier…"; over four consecutive calendar quarters → no longer a small supplier;
//   small suppliers: "You do not have to register." / "You may choose to register voluntarily…"
//   https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/gst-hst-businesses/when-register-charge.html
// Dollar amounts are the checker's own built-in example values (site/build.mjs), labelled "Example numbers".
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
// STYLE=light|dark (from `python3 marketing/video/pin_style.py <date> carousel`); output dir = argv[2] or site/src/media
const STYLE = process.env.STYLE || 'light', OUTDIR = process.argv[2] || path.join(__dirname, '../../site/src/media');
const ROOT = path.join(__dirname, '../..');
const W=1080,H=1350, D='2026-11-26';
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
.mini{height:64px;border-radius:12px;border:3px solid #cfe0d6;background:#fff;font-size:26px;font-weight:700;display:flex;align-items:center;justify-content:center;color:#46605a}
.q{flex:1;text-align:center;padding:26px 10px}.q b{display:block;font-size:52px}.q span{font-size:28px;color:#46605a}
.meter{height:40px;border-radius:999px;background:#e1ece5;overflow:hidden;margin-top:30px}.meter div{height:100%;width:92%;background:#1d5a45}`
  + (STYLE === 'dark' ? fs.readFileSync(path.join(__dirname, 'carousel-dark.css'), 'utf8') + '.q span{color:#cfe7da}.meter{background:#2a5a48}.meter div{background:#e0b25a}' : '');
const brand=`<div class="brand">${coin}Loonie Ledger</div>`;
const foot=(n)=>`<div class="foot"><span>Not tax advice — check CRA for your situation.</span><span>${n}/5</span></div>`;
const slides=[
`${brand}<div class="small bz" style="margin-top:150px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;font-size:34px">Tax-season prep #7</div>
<div class="big" style="font-size:140px;margin-top:30px">Do you charge GST? Type <span class="bz">4 numbers.</span></div>
<div class="small" style="margin-top:50px">See how, swipe →</div>${foot(1)}`,
`${brand}<div class="big" style="font-size:84px;margin-top:90px">One number per <span class="bz">quarter</span></div>
<div class="small" style="margin-top:30px;font-size:40px">Your taxable sales for each of your last four calendar quarters.</div>
<div class="row" style="margin-top:50px;gap:18px">
<div class="card q"><b>$6,200</b><span>Latest</span></div><div class="card q"><b>$7,400</b><span>Before</span></div></div>
<div class="row" style="margin-top:18px;gap:18px">
<div class="card q"><b>$8,100</b><span>2 back</span></div><div class="card q"><b>$5,900</b><span>3 back</span></div></div>
<div class="small" style="margin-top:36px;font-size:34px">Example numbers, not a real business.</div>${foot(2)}`,
`${brand}<div class="big" style="font-size:88px;margin-top:90px">It adds them <span class="bz">up</span></div>
<div class="card" style="margin-top:50px;font-size:44px"><ul>
<li class="row"><span>Last four quarters</span><b class="bz">$27,600</b></li>
<li class="row"><span>Small-supplier threshold</span><b>$30,000</b></li></ul>
<div class="meter"><div></div></div></div>
<div class="card" style="margin-top:40px;font-size:46px;font-weight:700">“Under the $30,000 threshold, with <span class="bz">$2,400</span> to go.”</div>
<div class="small" style="margin-top:30px;font-size:34px">Example numbers.</div>${foot(3)}`,
`${brand}<div class="big" style="font-size:84px;margin-top:90px">Over in <span class="hl">one</span> quarter? That counts too.</div>
<div class="card" style="margin-top:50px;font-size:40px">CRA: exceed $30,000 in a single calendar quarter, or over four consecutive quarters, and you're no longer a small supplier.</div>
<div class="card" style="margin-top:30px;font-size:40px">Under it? CRA says you don't have to register (you can choose to).</div>
<div class="small" style="margin-top:30px;font-size:34px">The checker doesn't decide which sales count — check CRA too.</div>${foot(4)}`,
`${brand}<div class="big" style="font-size:84px;margin-top:110px">Under or over — <span class="bz">what did yours say?</span></div>
<div class="small" style="margin-top:40px;color:#102a22;font-size:46px">Comment below. Send this to someone with a side hustle.</div>
<div style="margin-top:70px"><span class="pill">Follow for a daily Canadian money tip</span></div>
<div class="small" style="margin-top:40px;color:#102a22">Free GST/HST checker — link in bio. Nothing you type leaves the page.</div>${foot(5)}`];
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:W,height:H}});
for(let i=0;i<slides.length;i++){await p.setContent(`<style>${CSS}</style><div class="wrap">${slides[i]}</div>`);
const ov=await p.evaluate(()=>{const w=document.querySelector('.wrap');return w.scrollHeight>w.clientHeight});
await p.screenshot({path:path.join(OUTDIR, `${D}-post-${i+1}.jpg`),type:'jpeg',quality:90});console.log(i+1,'overflow',ov);}
await b.close();})();
