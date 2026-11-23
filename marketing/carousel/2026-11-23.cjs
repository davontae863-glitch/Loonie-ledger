// Midday carousel 2026-11-23: stop numbering invoices 1, 2, 3 — put the year first (Canadian money mistake #16).
// The numbering format is our tip, not a CRA rule. Only tax fact used (checked 2026-11-23): CRA 'GST/HST records to keep' (modified 2025-06-16)
// https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/gst-hst-businesses/calculate-prepare-report/gst-hst-records-keep.html
// — records to keep include "Sales and purchase invoices"; "Usually, you must keep your records for 6 years from the end of the year to which they relate."
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
// STYLE=light|dark (from `python3 marketing/video/pin_style.py <date> carousel`); output dir = argv[2] or site/src/media
const STYLE = process.env.STYLE || 'light', OUTDIR = process.argv[2] || path.join(__dirname, '../../site/src/media');
const ROOT = path.join(__dirname, '../..');
const W=1080,H=1350, D='2026-11-23';
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
`${brand}<div class="small bz" style="margin-top:150px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;font-size:34px">Canadian money mistake #16</div>
<div class="big" style="font-size:136px;margin-top:30px">Stop numbering invoices <span class="bz">1, 2, 3</span></div>
<div class="small" style="margin-top:50px">Do this instead, swipe →</div>${foot(1)}`,
`${brand}<div class="big" style="font-size:88px;margin-top:90px">Put the <span class="hl">year</span> first</div>
<div class="card" style="margin-top:50px;font-size:48px;font-weight:800;text-align:center"><ul>
<li><span class="bz">2026-</span>001</li><li><span class="bz">2026-</span>002</li><li><span class="bz">2026-</span>003</li></ul></div>
<div class="small" style="margin-top:44px;color:#102a22;font-size:42px">Every number stays unique, invoices sort in date order, and a missing one is easy to spot.</div>${foot(2)}`,
`${brand}<div class="big" style="font-size:84px;margin-top:90px">New year? <span class="bz">Start at 001</span></div>
<div class="card" style="margin-top:40px;font-size:46px;font-weight:800;text-align:center">2026-047 → <span class="bz">2027-001</span></div>
<div class="big" style="font-size:72px;margin-top:80px">Voided one? <span class="bz">Keep the number</span></div>
<div class="card" style="margin-top:40px;font-size:46px;font-weight:800;text-align:center">2026-003 · <span style="color:#b3261e">VOID</span></div>
<div class="small" style="margin-top:30px;font-size:38px">Mark it VOID. Don't reuse it.</div>${foot(3)}`,
`${brand}<div class="big" style="font-size:84px;margin-top:90px">Why it matters <span class="bz">at tax time</span></div>
<div class="card" style="margin-top:50px;font-size:42px">CRA lists <b>sales and purchase invoices</b> among the GST/HST records to keep.</div>
<div class="card" style="margin-top:30px;font-size:42px">Usually for <b>6 years</b> from the end of the year they relate to.</div>
<div class="small" style="margin-top:40px;font-size:38px">Clean numbers make old invoices easy to find.</div>${foot(4)}`,
`${brand}<div class="big" style="font-size:88px;margin-top:110px">How do you <span class="bz">number yours?</span></div>
<div class="small" style="margin-top:40px;color:#102a22;font-size:46px">Comment below. Save this for tax time.</div>
<div style="margin-top:70px"><span class="pill">Follow for a daily Canadian money tip</span></div>
<div class="small" style="margin-top:40px;color:#102a22">Every invoice auto-numbered: Freelancer Invoice Generator — link in bio</div>${foot(5)}`];
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:W,height:H}});
for(let i=0;i<slides.length;i++){await p.setContent(`<style>${CSS}</style><div class="wrap">${slides[i]}</div>`);
const ov=await p.evaluate(()=>{const w=document.querySelector('.wrap');return w.scrollHeight>w.clientHeight});
await p.screenshot({path:path.join(OUTDIR, `${D}-post-${i+1}.jpg`),type:'jpeg',quality:90});console.log(i+1,'overflow',ov);}
await b.close();})();
