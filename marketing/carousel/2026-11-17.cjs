// Midday carousel 2026-11-17: TFSA vs RRSP vs FHSA — when you get the tax break (Tax-season prep #3).
// Sources (checked 2026-11-17 on canada.ca): 'What is a TFSA' (mod. 2026-09-17); 'MP, DB, RRSP, DPSP, ALDA, TFSA limits, YMPE and the YAMPE' (mod. 2026-10-28);
// T4040 (mod. 2026-01-23); 'Tax deductions for FHSA contributions' (mod. 2026-04-15); 'Participating in your FHSAs' (mod. 2026-09-17); 'Withdrawals from your FHSAs' (mod. 2026-02-10).
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
// STYLE=light|dark (from `python3 marketing/video/pin_style.py <date> carousel`); output dir = argv[2] or site/src/media
const STYLE = process.env.STYLE || 'light', OUTDIR = process.argv[2] || path.join(__dirname, '../../site/src/media');
const ROOT = path.join(__dirname, '../..');
const W=1080,H=1350, D='2026-11-17';
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
ul{list-style:none;padding:0}.grid{display:grid;grid-template-columns:1fr 1fr;gap:28px;margin-top:50px}.grid .card{padding:30px 34px}.lab{font-size:30px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;opacity:.75}.val{font-size:54px;font-weight:800;margin-top:10px;line-height:1.1}.tick{color:#2f9e6e}.x{opacity:.6}li{padding:14px 0;border-bottom:2px solid #e1ece5}li:last-child{border:none}`
  + (STYLE === 'dark' ? fs.readFileSync(path.join(__dirname, 'carousel-dark.css'), 'utf8') : '');
const brand=`<div class="brand">${coin}Loonie Ledger</div>`;
const foot=(n)=>`<div class="foot"><span>Not tax advice — check CRA for your situation.</span><span>${n}/5</span></div>`;
const acct=(name,goal,inV,inC,outV,outC,note)=>`${brand}<div class="big" style="font-size:120px;margin-top:80px">${name}</div>
<div class="small" style="margin-top:14px;font-size:40px">${goal}</div>
<div class="grid"><div class="card"><div class="lab">Going in</div><div class="val ${inC}">${inV}</div></div>
<div class="card"><div class="lab">Coming out</div><div class="val ${outC}">${outV}</div></div></div>
<div class="small" style="margin-top:44px;font-size:38px">${note}</div>`;
const slides=[
`${brand}<div class="small bz" style="margin-top:150px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;font-size:34px">Tax-season prep #3</div>
<div class="big" style="font-size:132px;margin-top:30px">3 accounts. <span class="bz">Only 1</span> gets both tax breaks.</div>
<div class="small" style="margin-top:50px">TFSA · RRSP · FHSA. Swipe →</div>${foot(1)}`,
acct('TFSA','Any goal, any time','No deduction','x','Tax-free ✓','bz','Money in it and what it earns are generally tax-free, even when you withdraw. 2026 dollar limit: <b>$7,000</b>.')+foot(2),
acct('RRSP','For retirement','Deduction ✓','bz','Taxed','x','Deductible up to your limit, but you generally pay tax when you take it out. 2026 dollar limit: <b>$33,810</b>.')+foot(3),
acct('FHSA','For your first home','Deduction ✓','bz','Tax-free ✓','bz','<b class="bz">Both.</b> Tax-free only for a qualifying withdrawal to buy your first home. $8,000 of room the year you open your first one; $40,000 lifetime.')+foot(4),
`${brand}<div class="big" style="font-size:92px;margin-top:110px">Which one do <span class="bz">you</span> have?</div>
<div class="small" style="margin-top:40px;color:#102a22;font-size:46px">Comment TFSA, RRSP or FHSA. Save this for tax time.</div>
<div style="margin-top:70px"><span class="pill">Follow for a daily Canadian money tip</span></div>
<div class="small" style="margin-top:40px;color:#102a22">TFSA/RRSP/FHSA Room Tracker — link in bio</div>${foot(5)}`];
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:W,height:H}});
for(let i=0;i<slides.length;i++){await p.setContent(`<style>${CSS}</style><div class="wrap">${slides[i]}</div>`);
const ov=await p.evaluate(()=>{const w=document.querySelector('.wrap');return w.scrollHeight>w.clientHeight});
await p.screenshot({path:path.join(OUTDIR, `${D}-post-${i+1}.jpg`),type:'jpeg',quality:90});console.log(i+1,'overflow',ov);}
await b.close();})();
