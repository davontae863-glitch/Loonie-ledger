// Midday carousel 2026-11-24: self-employed? Your year ends in 37 days — the year-end summary by T2125 line (Tax-season prep #6).
// Facts re-checked 2026-11-24 via canada.ca search results (WebFetch was unavailable to this unattended run):
// CRA "Fiscal period" — "Self-employed individuals generally have to use a December 31 year-end."
//   https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/sole-proprietorships-partnerships/fiscal-period.html
// CRA "Expenses section of form T2125" — lines 8521 Advertising, 8810 Office expenses, 9220 Utilities, 9369 Net income (loss) before adjustments
//   https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/sole-proprietorships-partnerships/report-business-income-expenses/completing-form-t2125/expenses-section-form-t2125.html
// "2027 Tax deadlines for Canadian businesses and self-employed individuals" — file by June 15, 2027; pay balance by April 30, 2027
//   https://www.canada.ca/en/services/taxes/resources-for-small-and-medium-businesses/2026-tax-deadlines-canadian-businesses-self-employed-individuals.html
// All dollar amounts are a labelled example.
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
// STYLE=light|dark (from `python3 marketing/video/pin_style.py <date> carousel`); output dir = argv[2] or site/src/media
const STYLE = process.env.STYLE || 'light', OUTDIR = process.argv[2] || path.join(__dirname, '../../site/src/media');
const ROOT = path.join(__dirname, '../..');
const W=1080,H=1350, D='2026-11-24';
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
`${brand}<div class="small bz" style="margin-top:150px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;font-size:34px">Tax-season prep #6</div>
<div class="big" style="font-size:120px;margin-top:30px"><span style="white-space:nowrap">Self-employed?</span> Your year ends in <span class="bz">37 days</span></div>
<div class="small" style="margin-top:50px">What to do before then, swipe →</div>${foot(1)}`,
`${brand}<div class="big" style="font-size:88px;margin-top:90px">Usually <span class="hl">December 31</span></div>
<div style="display:flex;justify-content:center;margin-top:60px"><div class="cal"><div>DEC</div><div>31</div></div></div>
<div class="card" style="margin-top:60px;font-size:42px">CRA: self-employed individuals <b>generally</b> have to use a December 31 year-end.</div>
<div class="small" style="margin-top:40px;font-size:38px">Some eligible people can use another fiscal period.</div>${foot(2)}`,
`${brand}<div class="big" style="font-size:84px;margin-top:90px">A year of receipts → <span class="bz">one total per T2125 line</span></div>
<div class="card" style="margin-top:50px;font-size:42px"><ul>
<li class="row"><span><b>8521</b> Advertising</span><b>−$620</b></li>
<li class="row"><span><b>8810</b> Office expenses</span><b>−$340</b></li>
<li class="row"><span><b>9220</b> Utilities</span><b>−$480</b></li></ul></div>
<div class="small" style="margin-top:30px;font-size:34px">Example only, not real numbers.</div>${foot(3)}`,
`${brand}<div class="big" style="font-size:84px;margin-top:90px">Then <span class="bz">subtract</span></div>
<div class="card" style="margin-top:44px;font-size:44px"><ul>
<li class="row"><span>Sales for the year</span><b>$18,400</b></li>
<li class="row"><span>Total expenses</span><b>−$1,440</b></li>
<li class="row"><span><b>Net income</b> (line 9369)</span><b class="bz">$16,960</b></li></ul></div>
<div class="small" style="margin-top:20px;font-size:32px">Example only.</div>
<div class="card" style="margin-top:36px;font-size:40px">2026 return: <b>file by June 15, 2027</b> — but <b>pay any balance by April 30, 2027</b>.</div>${foot(4)}`,
`${brand}<div class="big" style="font-size:84px;margin-top:110px">Monthly or <span class="bz">all at once?</span></div>
<div class="small" style="margin-top:40px;color:#102a22;font-size:46px">How do you total your books? Comment below. Save this for tax time.</div>
<div style="margin-top:70px"><span class="pill">Follow for a daily Canadian money tip</span></div>
<div class="small" style="margin-top:40px;color:#102a22">Totals by T2125 line, built in: Bookkeeping &amp; GST/HST Tracker — link in bio</div>${foot(5)}`];
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:W,height:H}});
for(let i=0;i<slides.length;i++){await p.setContent(`<style>${CSS}</style><div class="wrap">${slides[i]}</div>`);
const ov=await p.evaluate(()=>{const w=document.querySelector('.wrap');return w.scrollHeight>w.clientHeight});
await p.screenshot({path:path.join(OUTDIR, `${D}-post-${i+1}.jpg`),type:'jpeg',quality:90});console.log(i+1,'overflow',ov);}
await b.close();})();
