// Midday carousel 2026-11-10: your home office can't create a business loss — CRA business-use-of-home rules for the self-employed (Canadian money mistake #5).
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
// STYLE=light|dark (from `python3 marketing/video/pin_style.py <date> carousel`); output dir = argv[2] or site/src/media
const STYLE = process.env.STYLE || 'light', OUTDIR = process.argv[2] || path.join(__dirname, '../../site/src/media');
const ROOT = path.join(__dirname, '../..');
const W=1080,H=1350, D='2026-11-10';
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
const row=(a,b)=>`<li style="display:flex;justify-content:space-between;gap:30px"><span>${a}</span><b style="text-align:right">${b}</b></li>`;
const slides=[
`${brand}<div class="small bz" style="margin-top:150px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;font-size:34px">Canadian money mistake #5</div>
<div class="big" style="font-size:140px;margin-top:30px">Your home office <span class="bz">can't create a loss.</span></div>
<div class="small" style="margin-top:50px">CRA's home office rules for the self-employed. Swipe →</div>${foot(1)}`,
`${brand}<div class="big" style="font-size:84px;margin-top:90px">First: does your space <span class="hl">qualify?</span></div>
<div class="card" style="margin-top:56px;font-size:40px"><ul>
<li>✓ It's your <b>principal place of business</b></li>
<li style="text-align:center;color:#46605a">— or —</li>
<li>✓ Used <b>only</b> to earn business income <b>and</b> regularly to meet clients or customers</li></ul></div>
<div class="small" style="margin-top:40px;color:#102a22;font-size:38px">This is for the self-employed (Form T2125). Employees use different rules.</div>${foot(2)}`,
`${brand}<div class="big" style="font-size:80px;margin-top:80px">Claim the <span class="bz">business part</span></div>
<div class="small" style="margin-top:30px;color:#102a22;font-size:40px">On a reasonable basis, like your workspace's share of the floor space.</div>
<div class="card" style="margin-top:40px;font-size:40px"><ul>
${row('Workspace','150 sq ft')}${row('Whole home','1,500 sq ft')}${row('Business part','<span class="bz">10%</span>')}</ul></div>
<div class="small" style="margin-top:30px;font-size:34px">Of costs like heat, electricity, home insurance, cleaning supplies, plus part of property taxes and mortgage interest. Example numbers.</div>${foot(3)}`,
`${brand}<div class="big" style="font-size:84px;margin-top:90px">The catch: <span class="bz">no loss</span></div>
<div class="small" style="margin-top:40px;color:#102a22;font-size:44px">Home office expenses <b>can't create or increase</b> a business loss.</div>
<div class="card" style="margin-top:50px;font-size:40px">What you can't use this year <b>carries forward</b> to next year (if you still qualify).</div>
<div class="small" style="margin-top:36px;font-size:36px">Claimed on Form T2125, line 9945.</div>${foot(4)}`,
`${brand}<div class="big" style="font-size:92px;margin-top:120px">Track your <span class="bz">home costs</span> all year</div>
<div class="small" style="margin-top:44px;color:#102a22;font-size:46px">Did you know this? Save this for tax time.</div>
<div style="margin-top:70px"><span class="pill">Follow for a daily Canadian money tip</span></div>
<div class="small" style="margin-top:40px;color:#102a22">Bookkeeping & GST/HST Tracker — link in bio</div>${foot(5)}`];
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:W,height:H}});
for(let i=0;i<slides.length;i++){await p.setContent(`<style>${CSS}</style><div class="wrap">${slides[i]}</div>`);
const ov=await p.evaluate(()=>{const w=document.querySelector('.wrap');return w.scrollHeight>w.clientHeight});
await p.screenshot({path:path.join(OUTDIR, `${D}-post-${i+1}.jpg`),type:'jpeg',quality:90});console.log(i+1,'overflow',ov);}
await b.close();})();
