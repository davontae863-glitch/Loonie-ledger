// Midday carousel 2026-11-14: RRSP room comes from last year's earned income (Canadian money mistake #9).
// Sources (checked 2026-11-14): canada.ca 'How contributions affect your RRSP deduction limit', 'MP, DB, RRSP, DPSP, ALDA, TFSA limits, YMPE', 'Questions and answers about contributing to an RRSP'.
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
// STYLE=light|dark (from `python3 marketing/video/pin_style.py <date> carousel`); output dir = argv[2] or site/src/media
const STYLE = process.env.STYLE || 'light', OUTDIR = process.argv[2] || path.join(__dirname, '../../site/src/media');
const ROOT = path.join(__dirname, '../..');
const W=1080,H=1350, D='2026-11-14';
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
`${brand}<div class="small bz" style="margin-top:150px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;font-size:34px">Canadian money mistake #9</div>
<div class="big" style="font-size:136px;margin-top:30px">Your RRSP room comes from <span class="bz">last year.</span></div>
<div class="small" style="margin-top:50px">Not this year's paycheque. Swipe →</div>${foot(1)}`,
`${brand}<div class="big" style="font-size:84px;margin-top:90px">New room = <span class="hl">18%</span></div>
<div class="small" style="margin-top:36px;color:#102a22;font-size:42px">Each year you get 18% of your <b>previous year's</b> earned income — up to the yearly max.</div>
<div style="display:flex;align-items:center;gap:36px;margin-top:60px">
<div class="cal"><div>EARNED</div><div style="font-size:72px;padding:20px 0">2025</div></div>
<div class="big bz" style="font-size:64px">→ room for →</div>
<div class="cal"><div>RRSP</div><div style="font-size:72px;padding:20px 0">2026</div></div></div>
<div class="small" style="margin-top:44px;font-size:34px">2026 max: $33,810. Unused room carries forward.</div>${foot(2)}`,
`${brand}<div class="big" style="font-size:84px;margin-top:90px">Quick <span class="bz">example</span></div>
<div class="card" style="margin-top:50px;font-size:40px"><ul>
<li>Earned income in 2025: <b>$50,000</b></li>
<li>× 18% = <b>$9,000</b> of new 2026 room</li>
<li>+ unused room from past years</li>
<li>− pension adjustment (if you have a work pension)</li></ul></div>
<div class="small" style="margin-top:36px;font-size:34px">Simplified — CRA's full formula has a few more pieces.</div>${foot(3)}`,
`${brand}<div class="big" style="font-size:84px;margin-top:90px">Check before <span class="bz">you deposit</span></div>
<div class="card" style="margin-top:50px;font-size:38px"><ul>
<li><b>Your exact limit:</b><br>the RRSP Deduction Limit Statement on your notice of assessment, or your CRA account.</li>
<li><b>Over by more than $2,000?</b><br>1% tax per month on the excess.</li></ul></div>${foot(4)}`,
`${brand}<div class="big" style="font-size:92px;margin-top:120px">Last year's income. <span class="bz">This year's room.</span></div>
<div class="small" style="margin-top:44px;color:#102a22;font-size:46px">Did you know this? Reply yes or no. Save this for tax time.</div>
<div style="margin-top:70px"><span class="pill">Follow for a daily Canadian money tip</span></div>
<div class="small" style="margin-top:40px;color:#102a22">TFSA/RRSP/FHSA Room Tracker — link in bio</div>${foot(5)}`];
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:W,height:H}});
for(let i=0;i<slides.length;i++){await p.setContent(`<style>${CSS}</style><div class="wrap">${slides[i]}</div>`);
const ov=await p.evaluate(()=>{const w=document.querySelector('.wrap');return w.scrollHeight>w.clientHeight});
await p.screenshot({path:path.join(OUTDIR, `${D}-post-${i+1}.jpg`),type:'jpeg',quality:90});console.log(i+1,'overflow',ov);}
await b.close();})();
