// Owner dashboard, served by the worker at /owner (same origin as the API, so no CORS).
// The page itself holds no data; every number is fetched from /api/owner/*, which requires
// Cloudflare Access or the owner token.
export const DASHBOARD_HTML = `<!doctype html>
<html lang="en-CA">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Owner dashboard — Loonie Ledger</title>
<style>
:root{--paper:#f5f9f6;--sheet:#fff;--ink:#102a22;--soft:#46605a;--rule:#cfe0d6;--strong:#9dbcaa;--spruce:#1d5a45;--bronze:#9a6b14;--ok:#1f7a4d;--warn:#a14a1a}
*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font:16px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif;font-feature-settings:"tnum" 1}
.wrap{max-width:56rem;margin:0 auto;padding:16px}
h1{font-size:1.5rem;margin:8px 0 4px}h2{font-size:1.1rem;margin:28px 0 8px}
.muted{color:var(--soft)}.small{font-size:.9rem}
.banner{border-left:3px solid var(--bronze);background:var(--sheet);padding:10px 14px;margin:12px 0}
.sheet{background:var(--sheet);border:1px solid var(--strong);border-radius:10px;overflow:hidden}
table{width:100%;border-collapse:collapse}th,td{padding:10px 14px;border-bottom:1px solid var(--rule);text-align:left}
td{text-align:right}tr:last-child th,tr:last-child td{border-bottom:0}
tr.key th,tr.key td{font-weight:700;font-size:1.05rem}
.big{display:grid;grid-template-columns:repeat(auto-fit,minmax(10rem,1fr));gap:12px}
.big div{background:var(--sheet);border:1px solid var(--strong);border-radius:10px;padding:14px}
.big b{display:block;font-size:1.5rem;letter-spacing:-.01em}
.neg{color:var(--warn)}
select,input,button{font:inherit;padding:9px 12px;border-radius:6px;border:1px solid var(--strong);background:#fff;color:var(--ink)}
button{background:var(--spruce);border-color:var(--spruce);color:#fff;font-weight:600;cursor:pointer}
button.secondary{background:#fff;color:var(--spruce)}
form{display:grid;gap:8px;padding:14px}label{font-size:.9rem;color:var(--soft)}
.row{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
:focus-visible{outline:3px solid #2a6ff0;outline-offset:2px}
#msg{min-height:1.5em}
</style>
</head>
<body><div class="wrap">
<h1>Loonie Ledger</h1>
<p class="muted small">Owner dashboard. Figures come only from recorded orders, payouts and expenses.</p>

<div id="login" hidden class="sheet" style="padding:14px">
  <p>Sign in with your owner token. It's kept in this browser tab only and cleared when you close it.</p>
  <form id="loginForm" style="padding:0"><label for="tok">Owner token</label><input id="tok" type="password" autocomplete="off" required minlength="32"><button>Sign in</button></form>
</div>

<div id="app" hidden>
  <div id="modeBanner" class="banner" hidden>Test mode: orders are recorded but left out of every figure below until you approve going live.</div>
  <div class="row"><label for="period">Period</label>
    <select id="period"><option value="today">Today</option><option value="month" selected>This month</option><option value="lastmonth">Last month</option><option value="all">All time</option></select>
    <button class="secondary" id="refresh" type="button">Refresh</button></div>

  <h2>Money</h2>
  <div class="big">
    <div><span class="muted small">Net operating profit</span><b id="k_net">–</b></div>
    <div><span class="muted small">Cash in the bank</span><b id="k_cash">–</b></div>
    <div><span class="muted small">Waiting to be paid out</span><b id="k_pending">–</b></div>
    <div><span class="muted small">Orders</span><b id="k_orders">–</b></div>
  </div>
  <p class="small muted">Cash in the bank counts only payouts you've recorded as arrived. Money still showing in Payhip, Stripe or PayPal is "waiting to be paid out" and isn't spendable yet.</p>

  <h2>Profit breakdown</h2>
  <div class="sheet"><table><tbody id="breakdown"></tbody></table></div>

  <h2>Approvals waiting for you</h2>
  <div class="sheet" id="approvals"><p style="padding:14px;margin:0" class="muted">Loading…</p></div>

  <h2>System health</h2>
  <div class="sheet"><table><tbody id="health"></tbody></table></div>

  <h2>Record a payout that reached your bank</h2>
  <div class="sheet"><form id="payoutForm">
    <label for="p_proc">From</label><select id="p_proc"><option value="stripe">Stripe</option><option value="paypal">PayPal</option></select>
    <label for="p_date">Date it arrived</label><input id="p_date" type="date" required>
    <label for="p_amt">Amount (CAD)</label><input id="p_amt" inputmode="decimal" required placeholder="0.00">
    <button>Record payout</button></form></div>

  <h2>Record a business expense</h2>
  <div class="sheet"><form id="expenseForm">
    <label for="e_cat">Category</label><select id="e_cat"><option>software</option><option>domain</option><option>marketing</option><option>professional fees</option><option>other</option></select>
    <label for="e_desc">What it was for</label><input id="e_desc" required maxlength="200">
    <label for="e_date">Date paid</label><input id="e_date" type="date" required>
    <label for="e_amt">Amount (CAD)</label><input id="e_amt" inputmode="decimal" required placeholder="0.00">
    <button>Record expense</button></form></div>

  <p id="msg" role="status"></p>
  <p><button class="secondary" id="signout" type="button">Sign out</button></p>
</div>
</div>
<script>
(function(){
  var token = sessionStorage.getItem('ll_owner_token') || '';
  var $ = function(id){ return document.getElementById(id); };
  var cad = function(c){ var n=(c||0)/100; return (n<0?'-':'')+'$'+Math.abs(n).toLocaleString('en-CA',{minimumFractionDigits:2,maximumFractionDigits:2}); };
  var esc = function(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); };
  function api(path, opts){
    opts = opts || {}; opts.headers = Object.assign({'content-type':'application/json'}, opts.headers||{});
    if (token) opts.headers.authorization = 'Bearer ' + token;
    opts.credentials = 'same-origin';
    return fetch(path, opts).then(function(r){ if (r.status === 401) { throw new Error('unauthorized'); } return r.json(); });
  }
  function range(){
    var p=$('period').value, n=new Date(), y=n.getFullYear(), m=n.getMonth(), from, to=new Date(n.getTime()+86400000);
    if(p==='today'){ from=new Date(y,m,n.getDate()); }
    else if(p==='month'){ from=new Date(y,m,1); }
    else if(p==='lastmonth'){ from=new Date(y,m-1,1); to=new Date(y,m,1); }
    else { from=new Date(2000,0,1); }
    return '?from='+encodeURIComponent(from.toISOString())+'&to='+encodeURIComponent(to.toISOString());
  }
  function setBig(id, c){ var el=$(id); el.textContent=cad(c); el.classList.toggle('neg', c<0); }
  function load(){
    $('msg').textContent='';
    Promise.all([api('/api/owner/summary'+range()), api('/api/owner/health'), api('/api/owner/approvals')]).then(function(res){
      var s=res[0], h=res[1], a=res[2];
      $('login').hidden=true; $('app').hidden=false;
      $('modeBanner').hidden = h.mode === 'live';
      setBig('k_net', s.net_operating_profit_cents); setBig('k_cash', s.available_cash_cents); setBig('k_pending', s.pending_payouts_cents);
      $('k_orders').textContent = s.order_count;
      var rows=[['Revenue (excluding tax collected)',s.gross_revenue_cents],['Payhip fees',-s.platform_fees_cents],['Card and PayPal fees',-s.processor_fees_cents],['Refunds',-s.refunds_cents],['Product costs',-s.production_costs_cents],['Contribution profit',s.contribution_profit_cents,1],['Business expenses',-s.operating_expenses_cents],['Net operating profit',s.net_operating_profit_cents,1]];
      $('breakdown').innerHTML = rows.map(function(r){ return '<tr'+(r[2]?' class="key"':'')+'><th>'+r[0]+'</th><td class="'+(r[1]<0?'neg':'')+'">'+cad(r[1])+'</td></tr>'; }).join('')
        + '<tr><th>Average order value</th><td>'+cad(s.average_order_value_cents)+'</td></tr>'
        + '<tr><th>Disputes</th><td class="'+(s.disputes?'neg':'')+'">'+s.disputes+'</td></tr>'
        + (s.test_orders_excluded ? '<tr><th>Test orders not counted</th><td>'+s.test_orders_excluded+'</td></tr>' : '');
      var ap=a.approvals||[];
      $('approvals').innerHTML = ap.length ? '<table><tbody>'+ap.map(function(x){ return '<tr><th>'+esc(x.summary)+'<br><span class="small muted">'+esc(x.kind)+' · '+esc(x.created_at)+'</span></th><td><div class="row" style="justify-content:flex-end"><button data-id="'+x.id+'" data-s="approved">Approve</button><button class="secondary" data-id="'+x.id+'" data-s="rejected">Reject</button></div></td></tr>'; }).join('')+'</tbody></table>'
        : '<p style="padding:14px;margin:0" class="muted">Nothing needs your approval.</p>';
      var last=(h.last_jobs||[])[0];
      $('health').innerHTML = '<tr><th>Database</th><td>'+(h.db==='ok'?'Working':'<span class="neg">Not reachable</span>')+'</td></tr>'
        + '<tr><th>Store mode</th><td>'+(h.mode==='live'?'Live':'Test')+'</td></tr>'
        + '<tr><th>Last background job</th><td>'+(last?esc(last.job)+' '+(last.ok?'ok':'<span class="neg">failed</span>')+'<br><span class="small muted">'+esc(last.ran_at)+' UTC</span>':'None yet')+'</td></tr>'
        + '<tr><th>Order problems, last 24 h</th><td class="'+(h.webhook_errors_24h?'neg':'')+'">'+h.webhook_errors_24h+'</td></tr>';
    }).catch(function(e){
      if (e.message==='unauthorized'){ token=''; sessionStorage.removeItem('ll_owner_token'); $('app').hidden=true; $('login').hidden=false; }
      else { $('msg').textContent='Couldn\\'t load the dashboard. Check your connection and tap Refresh.'; }
    });
  }
  function cents(v){ var n=parseFloat(String(v).replace(/[$,\\s]/g,'')); return isFinite(n)&&n>0?Math.round(n*100):0; }
  $('loginForm').addEventListener('submit', function(e){ e.preventDefault(); token=$('tok').value.trim(); sessionStorage.setItem('ll_owner_token', token); load(); });
  $('period').addEventListener('change', load); $('refresh').addEventListener('click', load);
  $('signout').addEventListener('click', function(){ sessionStorage.removeItem('ll_owner_token'); location.reload(); });
  $('approvals').addEventListener('click', function(e){ var b=e.target.closest('button[data-id]'); if(!b) return;
    api('/api/owner/approvals/'+b.dataset.id,{method:'POST',body:JSON.stringify({status:b.dataset.s})}).then(function(){ $('msg').textContent=b.dataset.s==='approved'?'Approved.':'Rejected.'; load(); }); });
  $('payoutForm').addEventListener('submit', function(e){ e.preventDefault(); var c=cents($('p_amt').value); if(!c){ $('msg').textContent='Enter the payout amount, for example 42.50.'; return; }
    api('/api/owner/payouts',{method:'POST',body:JSON.stringify({processor:$('p_proc').value,arrived_on:$('p_date').value,amount_cents:c})}).then(function(r){ $('msg').textContent=r.ok?'Payout recorded.':r.error; e.target.reset(); load(); }); });
  $('expenseForm').addEventListener('submit', function(e){ e.preventDefault(); var c=cents($('e_amt').value); if(!c){ $('msg').textContent='Enter the expense amount, for example 18.99.'; return; }
    api('/api/owner/expenses',{method:'POST',body:JSON.stringify({category:$('e_cat').value,description:$('e_desc').value,paid_on:$('e_date').value,amount_cents:c})}).then(function(r){ $('msg').textContent=r.ok?'Expense recorded.':r.error; e.target.reset(); load(); }); });
  load();
})();
</script>
</body></html>`;
