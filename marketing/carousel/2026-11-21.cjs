// Midday carousel 2026-11-21: you paid GST/HST on business costs — claim it back as input tax credits (Canadian money mistake #15).
// Source (checked 2026-11-21): CRA 'Input tax credits' https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/gst-hst-businesses/calculate-prepare-report/input-tax-credit.html
// (registrants recover GST/HST paid on purchases/expenses for commercial activities as ITCs on line 106; must be a registrant in the period;
// documentary evidence by amount: under $100 / $100–$499.99 / $500+; most registrants: claim by the due date of the return for the last reporting period ending within four years; 2 years for some).
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
// STYLE=light|dark (from `python3 marketing/video/pin_style.py <date> carousel`); output dir = argv[2] or site/src/media
const STYLE = process.env.STYLE || 'light', OUTDIR = process.argv[2] || path.join(__dirname, '../../site/src/media');
const ROOT = path.join(__dirname, '../..');
const W=1080,H=1350, D='2026-11-21';
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
`${brand}<div class="small bz" style="margin-top:150px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;font-size:34px">Canadian money mistake #15</div>
<div class="big" style="font-size:136px;margin-top:30px">You paid GST. <span class="bz">Did you claim it?</span></div>
<div class="small" style="margin-top:50px">If you're GST/HST registered, swipe →</div>${foot(1)}`,
`${brand}<div class="big" style="font-size:84px;margin-top:90px">It's called an <span class="hl">input tax credit</span></div>
<div class="card" style="margin-top:50px;font-size:42px">Registered for GST/HST? The GST/HST you pay on purchases and expenses for your business can come back to you as <b>ITCs</b>.</div>
<div class="small" style="margin-top:44px;color:#102a22;font-size:42px">You claim them on <b>line 106</b> of your GST/HST return. You must be registered in that reporting period.</div>${foot(2)}`,
`${brand}<div class="big" style="font-size:80px;margin-top:80px">No receipt, <span class="bz">no claim</span></div>
<div class="small" style="margin-top:24px;color:#102a22;font-size:38px">What it must show, by sale total:</div>
<div class="card" style="margin-top:30px;font-size:36px"><ul>
<li><b>Under $100</b><br>Supplier's name · date · total paid</li>
<li><b>$100 – $499.99</b><br>+ GST/HST charged · supplier's GST/HST number</li>
<li><b>$500 or more</b><br>+ your name · what you bought · payment terms</li></ul></div>${foot(3)}`,
`${brand}<div class="big" style="font-size:84px;margin-top:90px">Missed some? <span class="bz">You may still have time</span></div>
<div class="card" style="margin-top:50px;font-size:40px">Most registrants can claim an ITC up to the due date of the return for the last reporting period that ends within <b>4 years</b>.</div>
<div class="small" style="margin-top:40px;font-size:38px">Some large businesses and financial institutions get only 2 years.</div>${foot(4)}`,
`${brand}<div class="big" style="font-size:88px;margin-top:110px">Do you claim <span class="bz">your ITCs?</span></div>
<div class="small" style="margin-top:40px;color:#102a22;font-size:46px">Reply yes or no. Save this for tax time.</div>
<div style="margin-top:70px"><span class="pill">Follow for a daily Canadian money tip</span></div>
<div class="small" style="margin-top:40px;color:#102a22">Log every expense: Bookkeeping &amp; GST/HST Tracker — link in bio</div>${foot(5)}`];
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:W,height:H}});
for(let i=0;i<slides.length;i++){await p.setContent(`<style>${CSS}</style><div class="wrap">${slides[i]}</div>`);
const ov=await p.evaluate(()=>{const w=document.querySelector('.wrap');return w.scrollHeight>w.clientHeight});
await p.screenshot({path:path.join(OUTDIR, `${D}-post-${i+1}.jpg`),type:'jpeg',quality:90});console.log(i+1,'overflow',ov);}
await b.close();})();
