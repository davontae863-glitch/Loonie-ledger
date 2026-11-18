// Midday carousel 2026-11-18: the TFSA room in your CRA account is last year's number (Canadian money mistake #12).
// Sources (checked 2026-11-18): canada.ca 'Calculate your TFSA contribution room', 'If you owe tax on excess TFSA amounts',
// 'Where can you find your RRSP deduction limit', 'Participating in your FHSAs', RRSP 'Excess Contributions'.
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
// STYLE=light|dark (from `python3 marketing/video/pin_style.py <date> carousel`); output dir = argv[2] or site/src/media
const STYLE = process.env.STYLE || 'light', OUTDIR = process.argv[2] || path.join(__dirname, '../../site/src/media');
const ROOT = path.join(__dirname, '../..');
const W=1080,H=1350, D='2026-11-18';
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
`${brand}<div class="small bz" style="margin-top:150px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;font-size:34px">Canadian money mistake #12</div>
<div class="big" style="font-size:136px;margin-top:30px">Your TFSA room on CRA? <span class="bz">It's last year's.</span></div>
<div class="small" style="margin-top:50px">Check this before you deposit. Swipe →</div>${foot(1)}`,
`${brand}<div class="big" style="font-size:84px;margin-top:90px">Updated <span class="hl">once a year</span></div>
<div class="small" style="margin-top:36px;color:#102a22;font-size:42px">CRA updates the TFSA info in your account once a year, in the spring.</div>
<div style="display:flex;align-items:center;gap:36px;margin-top:60px">
<div class="cal"><div>BANKS</div><div style="font-size:60px;padding:24px 0">FEB</div></div>
<div class="big bz" style="font-size:56px">report last year →</div>
<div class="cal" style="width:260px"><div>CRA</div><div style="font-size:56px;padding:26px 0">SPRING</div></div></div>
<div class="small" style="margin-top:44px;font-size:36px">So anything you put in <b>this year</b> isn't in that number.</div>${foot(2)}`,
`${brand}<div class="big" style="font-size:84px;margin-top:90px">Go over? <span class="bz">1% a month</span></div>
<div class="card" style="margin-top:50px;font-size:40px"><ul>
<li><b>TFSA:</b> excess taxed 1% a month, on the highest excess each month it stays</li>
<li><b>FHSA:</b> also 1% a month on the highest excess</li>
<li><b>RRSP:</b> 1% a month on excess more than $2,000 over your limit</li>
<li><b>CRA says:</b> use your own records to work out your room before you contribute</li></ul></div>${foot(3)}`,
`${brand}<div class="big" style="font-size:84px;margin-top:90px">Where CRA shows <span class="bz">your room</span></div>
<div class="card" style="margin-top:50px;font-size:38px"><ul>
<li><b>TFSA:</b> CRA account → Savings and pension plans</li>
<li><b>RRSP:</b> notice of assessment, or your CRA account</li>
<li><b>FHSA:</b> notice of assessment (in most cases), or your CRA account</li>
<li><b>This year's deposits:</b> your own records</li></ul></div>${foot(4)}`,
`${brand}<div class="big" style="font-size:92px;margin-top:120px">CRA's number is last year. <span class="bz">Your list is today.</span></div>
<div class="small" style="margin-top:44px;color:#102a22;font-size:46px">Did you know this? Reply yes or no. Save this for tax time.</div>
<div style="margin-top:70px"><span class="pill">Follow for a daily Canadian money tip</span></div>
<div class="small" style="margin-top:40px;color:#102a22">TFSA/RRSP/FHSA Room Tracker — link in bio</div>${foot(5)}`];
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:W,height:H}});
for(let i=0;i<slides.length;i++){await p.setContent(`<style>${CSS}</style><div class="wrap">${slides[i]}</div>`);
const ov=await p.evaluate(()=>{const w=document.querySelector('.wrap');return w.scrollHeight>w.clientHeight});
await p.screenshot({path:path.join(OUTDIR, `${D}-post-${i+1}.jpg`),type:'jpeg',quality:90});console.log(i+1,'overflow',ov);}
await b.close();})();
