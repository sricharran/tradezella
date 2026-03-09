let trades=[],eqC=null,wlC=null,setupC=null,radarC=null,rptDowC=null,rptDailyC=null;
let hmYear=new Date().getFullYear(),hmMonth=new Date().getMonth();
let dayNotes={},playbook=[];
const MONTHS=['January','February','March','April','May','June','July','August','September','October','November','December'];

// ── BOOT
window.onload=()=>{
  setGreeting();
  document.getElementById('f-date').value=new Date().toISOString().split('T')[0];
  trades=JSON.parse(localStorage.getItem('tl_t')||'[]');
  dayNotes=JSON.parse(localStorage.getItem('tl_dn')||'{}');
  playbook=JSON.parse(localStorage.getItem('tl_pb')||'[]');
  const tok=localStorage.getItem('tl_tok'),gid=localStorage.getItem('tl_gid');
  if(tok)document.getElementById('stok').value=tok;
  if(gid)document.getElementById('sgid').value=gid;
  if(tok&&gid)gstat(true);
  document.getElementById('pin').addEventListener('keydown',e=>{if(e.key==='Enter')unlock();});
  // set dj date to today
  document.getElementById('dj-date').value=new Date().toISOString().split('T')[0];
  setTimeout(()=>document.getElementById('pin').focus(),150);
};

// ── GREETING
function setGreeting(){
  const h=new Date().getHours();
  let g='Good morning!';
  if(h>=12&&h<17)g='Good afternoon!';
  else if(h>=17)g='Good evening!';
  document.getElementById('greeting').textContent=g;
  const d=new Date();
  document.getElementById('ddate').textContent=d.toLocaleDateString('en-IN',{weekday:'long',year:'numeric',month:'long',day:'numeric'});
}

// ── AUTH
function unlock(){
  const v=document.getElementById('pin').value;
  const s=localStorage.getItem('tl_p')||'trade123';
  if(v===s){
    document.getElementById('lock').style.display='none';
    document.getElementById('app').style.display='block';
    rd();rj();
  } else {
    const i=document.getElementById('pin');
    i.classList.add('bad');
    document.getElementById('lerr').style.display='block';
    setTimeout(()=>i.classList.remove('bad'),380);
    i.value='';i.focus();
  }
}

function chgPass(){
  const np=document.getElementById('snp').value,cp=document.getElementById('scp').value;
  if(!np)return toast('Enter a new password');
  if(np!==cp)return toast('Passwords do not match');
  localStorage.setItem('tl_p',np);
  document.getElementById('snp').value='';document.getElementById('scp').value='';
  toast('✓ Password updated');
}

// ── NAV
function go(id,btn){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('on'));
  document.querySelectorAll('.ni').forEach(b=>b.classList.remove('on'));
  document.getElementById('pg-'+id).classList.add('on');
  if(btn)btn.classList.add('on');
  if(id==='dashboard')rd();
  if(id==='journal')rj();
  if(id==='analytics'){renderHeatmap();renderSetupBars();renderMonthTable();renderSetupChart();renderPsychAnalytics();}
  if(id==='dailyjournal')loadDayNote();
  if(id==='playbook')renderPlaybook();
  if(id==='reports'){initReports();renderReports();}
}

// ── MODAL
function openAdd(){
  document.getElementById('mtitle').textContent='New Trade';
  document.getElementById('eid').value='';
  ['f-sym','f-en','f-ex','f-qty','f-pnl','f-rr','f-str','f-les','f-emo','f-chart'].forEach(x=>document.getElementById(x).value='');
  document.getElementById('f-setup').value='';
  document.getElementById('f-date').value=new Date().toISOString().split('T')[0];
  document.getElementById('iprev').style.display='none';
  document.querySelectorAll('.eb').forEach(b=>b.classList.remove('on'));
  ['setup','sizing','sl','structure'].forEach(k=>setQ(k,false));
  updateQPreview();
  openM('tm');
}

function openEdit(id){
  const t=trades.find(x=>x.id===id);if(!t)return;
  document.getElementById('mtitle').textContent='Edit Trade';
  document.getElementById('eid').value=id;
  document.getElementById('f-sym').value=t.symbol;
  document.getElementById('f-date').value=t.date;
  document.getElementById('f-en').value=t.entry;
  document.getElementById('f-ex').value=t.exit;
  document.getElementById('f-qty').value=t.qty;
  document.getElementById('f-pnl').value=t.pnl;
  document.getElementById('f-setup').value=t.setup||'';
  document.getElementById('f-rr').value=t.rr||'';
  document.getElementById('f-str').value=t.strategy||'';
  document.getElementById('f-les').value=t.lessons||'';
  document.getElementById('f-emo').value=t.emotion||'';
  document.getElementById('f-chart').value=t.chart||'';
  document.querySelectorAll('.eb').forEach(b=>b.classList.toggle('on',!!(t.emotion&&b.textContent.trim().includes(t.emotion))));
  const p=document.getElementById('iprev');
  if(t.chart){p.src=t.chart;p.style.display='block';}else p.style.display='none';
  ['setup','sizing','sl','structure'].forEach(k=>setQ(k,!!(t.q&&t.q[k])));
  updateQPreview();
  openM('tm');
}

function openM(id){document.getElementById(id).classList.add('open');}
function closeM(id){document.getElementById(id).classList.remove('open');}
document.addEventListener('DOMContentLoaded',()=>{
  document.querySelectorAll('.ov').forEach(o=>o.addEventListener('click',e=>{if(e.target===o)o.classList.remove('open');}));
});

function emo(btn,val){
  document.querySelectorAll('#tm .eb').forEach(b=>b.classList.remove('on'));
  btn.classList.add('on');document.getElementById('f-emo').value=val;
}

function imgUp(e){
  const f=e.target.files[0];if(!f)return;
  const r=new FileReader();
  r.onload=ev=>{document.getElementById('f-chart').value=ev.target.result;const p=document.getElementById('iprev');p.src=ev.target.result;p.style.display='block';};
  r.readAsDataURL(f);
}

// ── SAVE TRADE
function saveTr(){
  const sym=document.getElementById('f-sym').value.trim().toUpperCase();
  if(!sym)return toast('⚠ Symbol required');
  const en=parseFloat(document.getElementById('f-en').value)||0;
  const ex=parseFloat(document.getElementById('f-ex').value)||0;
  const qty=parseFloat(document.getElementById('f-qty').value)||0;
  const pv=document.getElementById('f-pnl').value;
  const pnl=pv!==''?parseFloat(pv):parseFloat(((ex-en)*qty).toFixed(2));
  const t={
    id:document.getElementById('eid').value||Date.now().toString(),
    symbol:sym,date:document.getElementById('f-date').value,
    entry:en,exit:ex,qty,pnl,
    setup:document.getElementById('f-setup').value,
    rr:document.getElementById('f-rr').value,
    emotion:document.getElementById('f-emo').value,
    strategy:document.getElementById('f-str').value,
    lessons:document.getElementById('f-les').value,
    chart:document.getElementById('f-chart').value,
    q:{
      setup:parseInt(document.getElementById('f-q-setup').value)||0,
      sizing:parseInt(document.getElementById('f-q-sizing').value)||0,
      sl:parseInt(document.getElementById('f-q-sl').value)||0,
      structure:parseInt(document.getElementById('f-q-structure').value)||0,
      scored:!!(document.getElementById('f-q-setup').value||document.getElementById('f-q-sizing').value||document.getElementById('f-q-sl').value||document.getElementById('f-q-structure').value)
    }
  };
  const eid=document.getElementById('eid').value;
  if(eid){const i=trades.findIndex(x=>x.id===eid);trades[i]=t;}else trades.push(t);
  persist();closeM('tm');rd();rj();toast(`✓ ${sym} saved`);
}

function del(id,e){
  e.stopPropagation();
  if(!confirm('Delete this trade?'))return;
  trades=trades.filter(t=>t.id!==id);persist();rd();rj();toast('Deleted');
}

function persist(){localStorage.setItem('tl_t',JSON.stringify(trades));sync();}

// ── JOURNAL
function rj(){
  let list=[...trades];
  const s=document.getElementById('fs')?.value.toLowerCase();
  if(s)list=list.filter(t=>t.symbol.toLowerCase().includes(s));
  const r=document.getElementById('fr')?.value;
  if(r==='win')list=list.filter(t=>t.pnl>0);
  else if(r==='loss')list=list.filter(t=>t.pnl<0);
  const st=document.getElementById('fst')?.value;
  if(st)list=list.filter(t=>t.setup===st);
  const so=document.getElementById('fso')?.value||'dd';
  list.sort((a,b)=>{
    if(so==='dd')return new Date(b.date)-new Date(a.date);
    if(so==='da')return new Date(a.date)-new Date(b.date);
    if(so==='pd')return b.pnl-a.pnl;
    if(so==='pa')return a.pnl-b.pnl;
  });
  document.getElementById('tcnt').textContent=trades.length;
  const body=document.getElementById('tbody');
  if(!list.length){body.innerHTML='<div class="empty"><div class="empty-i">◧</div><div class="empty-t">No trades found</div></div>';return;}
  body.innerHTML=list.map(t=>{
    const cls=t.pnl>0?'pos':t.pnl<0?'neg':'';
    const rc=t.pnl>0?'win':t.pnl<0?'loss':'';
    const ps=`${t.pnl>=0?'+':''}₹${Math.abs(t.pnl).toLocaleString('en-IN',{minimumFractionDigits:2})}`;
    return `<div class="tr ${rc}" onclick="od('${t.id}')">
      <div class="td mo">${t.date}</div><div class="td sy">${t.symbol}</div>
      <div class="td"><span class="chip">${t.setup||'—'}</span></div>
      <div class="td mo">₹${t.entry.toLocaleString('en-IN')}</div>
      <div class="td mo">₹${t.exit.toLocaleString('en-IN')}</div>
      <div class="td mo">${t.qty}</div>
      <div class="td ${cls}">${ps}</div>
      <div class="td">${qBadgeHTML(t)}</div>
      <div class="td"><div class="ra">
        <button class="rb" onclick="openEdit('${t.id}');event.stopPropagation()">✏</button>
        <button class="rb dl" onclick="del('${t.id}',event)">✕</button>
      </div></div>
    </div>`;
  }).join('');
}

function od(id){
  const t=trades.find(x=>x.id===id);if(!t)return;
  const pc=t.pnl>=0?'pos':'neg';
  const ps=`${t.pnl>=0?'+':''}₹${Math.abs(t.pnl).toLocaleString('en-IN',{minimumFractionDigits:2})}`;
  document.getElementById('dtitle').textContent=`${t.symbol} · ${t.date}`;
  document.getElementById('dbody').innerHTML=`
    ${qVerdictHTML(t)}
    <div class="dkvg">
      <div class="dkv"><div class="dkl">Entry</div><div class="dkv2">₹${t.entry.toLocaleString('en-IN')}</div></div>
      <div class="dkv"><div class="dkl">Exit</div><div class="dkv2">₹${t.exit.toLocaleString('en-IN')}</div></div>
      <div class="dkv"><div class="dkl">Quantity</div><div class="dkv2">${t.qty} shares</div></div>
      <div class="dkv"><div class="dkl">P&L</div><div class="dkv2 ${pc}">${ps}</div></div>
      <div class="dkv"><div class="dkl">Setup</div><div class="dkv2">${t.setup||'—'}</div></div>
      <div class="dkv"><div class="dkl">R:R</div><div class="dkv2">${t.rr||'—'}</div></div>
    </div>
    ${t.emotion?`<div class="ds"><div class="dsl">Emotional State</div><div class="dst">${t.emotion}</div></div>`:''}
    ${t.strategy?`<div class="ds"><div class="dsl">Strategy Notes</div><div class="dst">${t.strategy}</div></div>`:''}
    ${t.lessons?`<div class="ds"><div class="dsl">Lessons Learned</div><div class="dst">${t.lessons}</div></div>`:''}
    ${t.chart?`<div class="ds"><div class="dsl">Chart</div><img src="${t.chart}" style="max-width:100%;border-radius:12px;margin-top:8px;border:1px solid var(--border)"></div>`:''}`;
  openM('dm');
}

// ── DASHBOARD
function rd(){
  if(!trades.length){resetD();eqChart([],[]);wlChart(0,0);renderRadar();renderRecentTrades();updateGauges(0,0,0,0);if(ndpC)ndpC.destroy();return;}
  const sorted=[...trades].sort((a,b)=>new Date(a.date)-new Date(b.date));
  const total=trades.reduce((s,t)=>s+t.pnl,0);
  const wins=trades.filter(t=>t.pnl>0),losses=trades.filter(t=>t.pnl<0);
  const wr=(wins.length/trades.length*100).toFixed(1);
  const gp=wins.reduce((s,t)=>s+t.pnl,0);
  const gl=Math.abs(losses.reduce((s,t)=>s+t.pnl,0));
  const pf=gl>0?(gp/gl).toFixed(2):gp>0?'∞':'0.00';
  const rrt=trades.filter(t=>t.rr&&t.rr.includes(':'));
  let avgRR='—';
  if(rrt.length){const vs=rrt.map(t=>{const p=t.rr.split(':');return parseFloat(p[1])/parseFloat(p[0]);}).filter(x=>!isNaN(x));if(vs.length)avgRR='1:'+(vs.reduce((a,b)=>a+b,0)/vs.length).toFixed(2);}
  const pe=document.getElementById('s-pnl');
  const sg=total>=0?'+':'';
  pe.textContent=`${sg}₹${Math.abs(total).toLocaleString('en-IN',{minimumFractionDigits:2})}`;
  pe.className='sc-val '+(total>=0?'pos':'neg');
  document.getElementById('s-psub').textContent=`${trades.length} trades logged`;
  document.getElementById('s-wr').textContent=`${wr}%`;
  document.getElementById('s-wsub').textContent=`${wins.length}W · ${losses.length}L`;
  document.getElementById('s-pf').textContent=pf;
  document.getElementById('s-rr').textContent=avgRR;
  let run=0;
  const labels=sorted.map(t=>t.date);
  const eq=sorted.map(t=>{run+=t.pnl;return parseFloat(run.toFixed(2));});
  const eb=document.getElementById('eq-big');
  eb.textContent=`${sg}₹${Math.abs(total).toLocaleString('en-IN',{minimumFractionDigits:2})}`;
  eb.style.color=total>=0?'var(--green)':'var(--red)';
  eqChart(labels,eq);wlChart(wins.length,losses.length);renderRadar();ndpChart();
  // Gauge values
  const wrNum=parseFloat(wr);
  const pfNum=gl>0?(gp/gl):gp>0?5:0;
  const pfPct=Math.min(pfNum/3*100,100); // PF of 3 = 100%
  const rrPct=(()=>{const rrt2=trades.filter(t=>t.rr&&t.rr.includes(':'));if(!rrt2.length)return 0;const vs2=rrt2.map(t=>{const p=t.rr.split(':');return parseFloat(p[1])/parseFloat(p[0]);}).filter(x=>!isNaN(x));if(!vs2.length)return 0;const avgR=vs2.reduce((a,b)=>a+b,0)/vs2.length;return Math.min(avgR/3*100,100);})();
  const totalPct=total>0?Math.min(total/100000*100,100):0; // 1L as benchmark
  updateGauges(wrNum,pfPct,rrPct,totalPct);
  let mw=0,ml=0,wc=0,lc=0;
  sorted.forEach(t=>{if(t.pnl>0){wc++;lc=0;mw=Math.max(mw,wc);}else if(t.pnl<0){lc++;wc=0;ml=Math.max(ml,lc);}else{wc=0;lc=0;}});
  const last=sorted[sorted.length-1];
  const cur=last.pnl>0?wc:last.pnl<0?-lc:0;
  document.getElementById('st-w').textContent=mw;
  document.getElementById('st-l').textContent=ml;
  const ce=document.getElementById('st-c');ce.textContent=Math.abs(cur);ce.className='str-n '+(cur>0?'g':cur<0?'r':'n');
  const byp=[...trades].sort((a,b)=>b.pnl-a.pnl);
  const show=[byp[0],byp[byp.length-1]].filter(Boolean);
  document.getElementById('bwlist').innerHTML=show.map(t=>{
    const c=t.pnl>=0?'var(--green)':'var(--red)';
    const ps=`${t.pnl>=0?'+':''}₹${Math.abs(t.pnl).toLocaleString('en-IN',{minimumFractionDigits:2})}`;
    return `<div class="bw"><div><div class="bw-sym">${t.symbol}</div><div class="bw-meta">${t.date} · ${t.setup||'—'}</div></div><div class="bw-pnl" style="color:${c}">${ps}</div></div>`;
  }).join('');
  renderRecentTrades();
  renderEmoPnL();
  renderSplit();
}

function resetD(){
  document.getElementById('s-pnl').textContent='₹0';document.getElementById('s-pnl').className='sc-val purple';
  document.getElementById('s-psub').textContent='0 trades logged';
  document.getElementById('s-wr').textContent='0%';document.getElementById('s-wsub').textContent='0W · 0L';
  document.getElementById('s-pf').textContent='0.00';document.getElementById('s-rr').textContent='—';
  document.getElementById('st-w').textContent='0';document.getElementById('st-l').textContent='0';document.getElementById('st-c').textContent='0';
  document.getElementById('bwlist').innerHTML='<div class="bw"><div class="bw-sym" style="color:var(--text3);font-size:13px">No trades yet</div></div>';
  document.getElementById('emo-pnl-rows').innerHTML='<div class="otrade-empty">No emotions logged yet.</div>';
  document.getElementById('split-banner').innerHTML='Score your trades to see how much rule violations are costing you.';
  document.getElementById('recent-body').innerHTML='<div class="otrade-empty">No trades yet</div>';
}

// ── TRADELOG SCORE (RADAR)
function renderRadar(){
  const ctx=document.getElementById('radar-c').getContext('2d');
  if(radarC)radarC.destroy();
  const emptyData={labels:['Win Rate','Avg W/L','Profit Factor','Discipline','Consistency'],datasets:[{data:[0,0,0,0,0],backgroundColor:'rgba(124,92,252,0.08)',borderColor:'rgba(124,92,252,0.25)',borderWidth:2,pointBackgroundColor:'rgba(124,92,252,0.3)',pointRadius:3}]};
  const radarOpts={responsive:true,plugins:{legend:{display:false},tooltip:{backgroundColor:'#fff',borderColor:'rgba(0,0,0,0.1)',borderWidth:1,bodyColor:'#101828',callbacks:{label:c=>Math.round(c.parsed.r)+'/100'}}},scales:{r:{min:0,max:100,ticks:{display:false},grid:{color:'rgba(0,0,0,0.07)'},angleLines:{color:'rgba(0,0,0,0.07)'},pointLabels:{font:{family:'Plus Jakarta Sans',size:11,weight:'600'},color:'#475467'}}}};
  if(!trades.length){
    document.getElementById('tls-badge').textContent='—';
    document.getElementById('tls-sub').textContent='Log trades to see your score';
    radarC=new Chart(ctx,{type:'radar',data:emptyData,options:radarOpts});return;
  }
  const wins=trades.filter(t=>t.pnl>0),losses=trades.filter(t=>t.pnl<0);
  const wr=wins.length/trades.length*100;
  const avgW=wins.length?wins.reduce((s,t)=>s+t.pnl,0)/wins.length:0;
  const avgL=losses.length?Math.abs(losses.reduce((s,t)=>s+t.pnl,0)/losses.length):1;
  const wlScore=Math.min((avgW/(avgL||1))*25,100);
  const gp=wins.reduce((s,t)=>s+t.pnl,0);
  const gl=Math.abs(losses.reduce((s,t)=>s+t.pnl,0));
  const pf=gl>0?gp/gl:gp>0?5:0;
  const pfScore=Math.min(pf*20,100);
  const scored=trades.filter(t=>t.q&&t.q.scored);
  const disc=scored.length?(scored.filter(t=>qScore(t)>=3).length/scored.length*100):50;
  const dayMap={};trades.forEach(t=>{dayMap[t.date]=(dayMap[t.date]||0)+t.pnl;});
  const dv=Object.values(dayMap);
  const meanD=dv.reduce((a,b)=>a+b,0)/(dv.length||1);
  const stdD=Math.sqrt(dv.reduce((s,v)=>s+(v-meanD)**2,0)/(dv.length||1))||1;
  const cons=Math.max(0,Math.min(100,100-Math.abs(stdD/Math.max(Math.abs(meanD),1))*10));
  const vals=[wr,wlScore,pfScore,disc,cons];
  const overall=Math.round(vals.reduce((a,b)=>a+b,0)/vals.length);
  const badge=document.getElementById('tls-badge');
  badge.textContent=overall;
  badge.style.color=overall>=70?'var(--green)':overall>=50?'var(--purple)':'var(--red)';
  document.getElementById('tls-sub').textContent=overall>=80?'Excellent process 🏆':overall>=60?'Good discipline ✅':overall>=40?'Room to improve ⚠️':'Needs attention ❌';
  radarC=new Chart(ctx,{type:'radar',data:{labels:['Win Rate','Avg W/L','Profit Factor','Discipline','Consistency'],datasets:[{data:vals,backgroundColor:'rgba(124,92,252,0.12)',borderColor:'rgba(124,92,252,0.7)',borderWidth:2,pointBackgroundColor:'#7c5cfc',pointRadius:4}]},options:radarOpts});
}

// ── RECENT TRADES
function renderRecentTrades(){
  const body=document.getElementById('recent-body');
  if(!trades.length){body.innerHTML='<div class="otrade-empty">No trades yet</div>';return;}
  const recent=[...trades].sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,6);
  body.innerHTML=recent.map(t=>{
    const cls=t.pnl>0?'pos':t.pnl<0?'neg':'';
    const ps=`${t.pnl>=0?'+':''}₹${Math.abs(t.pnl).toLocaleString('en-IN',{minimumFractionDigits:0})}`;
    return `<div class="recent-row" onclick="od('${t.id}')">
      <div class="recent-sym">${t.symbol}</div>
      <div class="recent-date">${t.date}</div>
      <div><span class="chip">${t.setup||'—'}</span></div>
      <div class="td ${cls}" style="font-family:var(--mono);font-size:12px;font-weight:700">${ps}</div>
      <div>${qBadgeHTML(t)}</div>
    </div>`;
  }).join('');
}

// ── CHARTS
function eqChart(labels,data){
  const ctx=document.getElementById('eq-c').getContext('2d');
  if(eqC)eqC.destroy();
  const last=data[data.length-1]||0;
  const col=last>=0?'#12b76a':'#f04438';
  eqC=new Chart(ctx,{type:'line',data:{labels,datasets:[{data,borderColor:col,backgroundColor:col+'18',borderWidth:2,fill:true,tension:0.38,pointRadius:data.length<30?3:0,pointBackgroundColor:col,pointBorderWidth:0}]},options:{responsive:true,plugins:{legend:{display:false},tooltip:{backgroundColor:'#ffffff',borderColor:'rgba(0,0,0,0.08)',borderWidth:1,titleColor:'#667085',bodyColor:'#101828',titleFont:{family:'DM Mono',size:10},bodyFont:{family:'DM Mono',size:12},callbacks:{label:c=>'₹'+c.parsed.y.toLocaleString('en-IN')}}},scales:{x:{ticks:{color:'#667085',font:{family:'DM Mono',size:10},maxTicksLimit:8},grid:{color:'rgba(0,0,0,0.05)'},border:{color:'rgba(0,0,0,0.08)'}},y:{ticks:{color:'#667085',font:{family:'DM Mono',size:10},callback:v=>'₹'+v.toLocaleString('en-IN')},grid:{color:'rgba(0,0,0,0.05)'},border:{color:'rgba(0,0,0,0.08)'}}}}}); 
}

function wlChart(w,l){
  const ctx=document.getElementById('wl-c').getContext('2d');
  if(wlC)wlC.destroy();
  wlC=new Chart(ctx,{type:'doughnut',data:{labels:['Wins','Losses'],datasets:[{data:w||l?[w,l]:[1,1],backgroundColor:w||l?['#12b76a','#f04438']:['#e4e6f0','#e4e6f0'],borderWidth:0,hoverOffset:6}]},options:{responsive:true,cutout:'72%',plugins:{legend:{position:'bottom',labels:{color:'#667085',font:{family:'DM Mono',size:11},padding:18,boxWidth:10,boxHeight:10}},tooltip:{backgroundColor:'#ffffff',borderColor:'rgba(0,0,0,0.08)',borderWidth:1,bodyColor:'#101828',bodyFont:{family:'DM Mono',size:12}}}}});
}

// ── HEATMAP
function hmPrev(){if(hmMonth===0){hmMonth=11;hmYear--;}else hmMonth--;renderHeatmap();}
function hmNext(){if(hmMonth===11){hmMonth=0;hmYear++;}else hmMonth++;renderHeatmap();}
function renderHeatmap(){
  document.getElementById('hm-label').textContent=`${MONTHS[hmMonth]} ${hmYear}`;
  const cal=document.getElementById('hm-cal');
  const dayMap={};
  trades.forEach(t=>{const d=new Date(t.date);if(d.getFullYear()===hmYear&&d.getMonth()===hmMonth){const k=d.getDate();dayMap[k]=(dayMap[k]||0)+t.pnl;}});
  const vals=Object.values(dayMap).map(Math.abs);
  const maxAbs=vals.length?Math.max(...vals):1;
  const firstDay=new Date(hmYear,hmMonth,1).getDay();
  const daysInMonth=new Date(hmYear,hmMonth+1,0).getDate();
  let html='';
  for(let i=0;i<firstDay;i++)html+=`<div class="hm-day empty"></div>`;
  for(let d=1;d<=daysInMonth;d++){
    const pnl=dayMap[d];
    if(pnl===undefined){html+=`<div class="hm-day nodata"><div class="dn">${d}</div></div>`;continue;}
    const ratio=Math.abs(pnl)/maxAbs;
    let cls=pnl>0?(ratio>0.6?'win-lg':ratio>0.3?'win-md':'win-sm'):(ratio>0.6?'loss-lg':ratio>0.3?'loss-md':'loss-sm');
    const ps=`${pnl>=0?'+':''}₹${Math.abs(pnl).toLocaleString('en-IN',{maximumFractionDigits:0})}`;
    html+=`<div class="hm-day ${cls}" title="${ps}"><div class="dn">${d}</div><div class="dp">${ps}</div></div>`;
  }
  cal.innerHTML=html;
}

// ── SETUP BARS
function renderSetupBars(){
  const map={};
  trades.forEach(t=>{if(!t.setup)return;if(!map[t.setup])map[t.setup]={pnl:0,count:0,wins:0};map[t.setup].pnl+=t.pnl;map[t.setup].count++;if(t.pnl>0)map[t.setup].wins++;});
  const entries=Object.entries(map).sort((a,b)=>b[1].pnl-a[1].pnl);
  const el=document.getElementById('setup-bars');
  if(!entries.length){el.innerHTML='<div class="empty"><div class="empty-i">◫</div><div class="empty-t">No trades yet</div></div>';return;}
  const maxAbs=Math.max(...entries.map(e=>Math.abs(e[1].pnl)));
  el.innerHTML=entries.map(([name,d])=>{
    const pct=maxAbs>0?(Math.abs(d.pnl)/maxAbs)*100:0;
    const cls=d.pnl>=0?'pos':'neg';
    const ps=`${d.pnl>=0?'+':''}₹${Math.abs(d.pnl).toLocaleString('en-IN',{maximumFractionDigits:0})}`;
    const wr=Math.round(d.wins/d.count*100);
    return `<div class="setup-bar-row"><div class="sbn">${name}</div><div class="sb-track"><div class="sb-fill ${cls}" style="width:${Math.max(pct,8)}%">${ps}</div></div><div class="sb-meta">${d.count}T · ${wr}%W</div></div>`;
  }).join('');
}

// ── MONTHLY TABLE
function renderMonthTable(){
  const map={};
  trades.forEach(t=>{const m=t.date.slice(0,7);if(!map[m])map[m]={pnl:0,count:0,wins:0};map[m].pnl+=t.pnl;map[m].count++;if(t.pnl>0)map[m].wins++;});
  const rows=Object.entries(map).sort((a,b)=>b[0].localeCompare(a[0]));
  const body=document.getElementById('month-body');
  if(!rows.length){body.innerHTML='<tr><td colspan="5" style="color:var(--text3);padding:20px 12px;font-size:12px">No data</td></tr>';return;}
  body.innerHTML=rows.map(([m,d])=>{
    const ps=`${d.pnl>=0?'+':''}₹${Math.abs(d.pnl).toLocaleString('en-IN',{maximumFractionDigits:0})}`;
    const cls=d.pnl>=0?'pos':'neg';
    return `<tr><td class="sym-col">${m}</td><td>${d.count}</td><td>${d.wins}</td><td class="${cls}">${ps}</td><td>${Math.round(d.wins/d.count*100)}%</td></tr>`;
  }).join('');
}

// ── SETUP CHART
function renderSetupChart(){
  const map={};
  trades.forEach(t=>{if(!t.setup)return;if(!map[t.setup])map[t.setup]=0;map[t.setup]+=t.pnl;});
  const entries=Object.entries(map).sort((a,b)=>b[1]-a[1]);
  const ctx=document.getElementById('setup-chart').getContext('2d');
  if(setupC)setupC.destroy();
  if(!entries.length)return;
  setupC=new Chart(ctx,{type:'bar',data:{labels:entries.map(e=>e[0]),datasets:[{data:entries.map(e=>e[1]),backgroundColor:entries.map(e=>e[1]>=0?'rgba(18,183,106,0.18)':'rgba(240,68,56,0.18)'),borderColor:entries.map(e=>e[1]>=0?'#12b76a':'#f04438'),borderWidth:2,borderRadius:8}]},options:{responsive:true,plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>`₹${c.parsed.y.toLocaleString('en-IN')}`}}},scales:{x:{ticks:{color:'#667085',font:{family:'DM Mono',size:11}},grid:{display:false}},y:{ticks:{color:'#667085',font:{family:'DM Mono',size:10},callback:v=>'₹'+v.toLocaleString('en-IN')},grid:{color:'rgba(0,0,0,0.05)'}}}}});
}

// ── PSYCHOLOGY
function renderPsychAnalytics(){
  const scored=trades.filter(t=>t.q&&t.q.scored);
  if(!scored.length){
    document.getElementById('ps-avg').textContent='—';document.getElementById('ps-good').textContent='0';document.getElementById('ps-bad').textContent='0';document.getElementById('ps-pct').textContent='0%';
    document.getElementById('psych-insights').innerHTML='Log trades with quality scores to see your psychology insights.';return;
  }
  const scores=scored.map(t=>qScore(t));
  const avg=(scores.reduce((a,b)=>a+b,0)/scores.length).toFixed(1);
  const good=scored.filter(t=>qScore(t)>=3).length;
  const bad=scored.filter(t=>qScore(t)<3).length;
  const pct=Math.round((good/scored.length)*100);
  document.getElementById('ps-avg').textContent=avg+'/4';document.getElementById('ps-avg').className='psych-num '+(parseFloat(avg)>=3?'g':parseFloat(avg)>=2?'gold':'r');
  document.getElementById('ps-good').textContent=good;document.getElementById('ps-bad').textContent=bad;
  document.getElementById('ps-pct').textContent=pct+'%';document.getElementById('ps-pct').className='psych-num '+(pct>=75?'g':pct>=50?'gold':'r');
  const ck=['setup','sizing','sl','structure'],cn=['Setup Rules','Position Sizing','Stop-Loss','A+ Structure'];
  const cp=ck.map(k=>Math.round((scored.filter(t=>t.q[k]).length/scored.length)*100));
  const goodLoss=trades.filter(t=>qScore(t)>=3&&t.pnl<0).length;
  const badWin=trades.filter(t=>qScore(t)<3&&t.q&&t.q.scored&&t.pnl>0).length;
  const weakest=cn[cp.indexOf(Math.min(...cp))],strongest=cn[cp.indexOf(Math.max(...cp))];
  let html=`<span class="insight-good">✓ Process adherence: ${pct}%</span> · ${good} good, ${bad} bad out of ${scored.length} scored<br><strong>Strongest:</strong> ${strongest} (${Math.max(...cp)}%) &nbsp;<strong>Weakest:</strong> <span class="insight-bad">${weakest} (${Math.min(...cp)}%)</span><br>`;
  if(goodLoss>0)html+=`<span class="insight-good">📊 ${goodLoss} good trade${goodLoss>1?'s':''} that lost</span> — process was right, outcome was unlucky.<br>`;
  if(badWin>0)html+=`<span class="insight-bad">⚠ ${badWin} bad trade${badWin>1?'s':''} that won</span> — don't let this reinforce bad habits.<br>`;
  if(pct<50)html+=`<span class="insight-bad">⚠ Process adherence below 50%. Focus on rules before P&L.</span>`;
  else if(pct>=80)html+=`<span class="insight-good">🏆 Excellent discipline. Keep trusting the process.</span>`;
  document.getElementById('psych-insights').innerHTML=html;
}

// ── EMOTION vs P&L
function renderEmoPnL(){
  const EMOJIS={'Confident':'😊','Disciplined':'🎯','Nervous':'😰','FOMO':'😤','Revenge':'😡','Neutral':'😐'};
  const map={};
  trades.filter(t=>t.emotion).forEach(t=>{if(!map[t.emotion])map[t.emotion]={pnl:0,count:0};map[t.emotion].pnl+=t.pnl;map[t.emotion].count++;});
  const entries=Object.entries(map).sort((a,b)=>b[1].pnl-a[1].pnl);
  if(!entries.length){document.getElementById('emo-pnl-rows').innerHTML='<div class="otrade-empty">No emotions logged yet.</div>';document.getElementById('emo-best-tag').textContent='—';return;}
  const maxAbs=Math.max(...entries.map(e=>Math.abs(e[1].pnl)));
  const best=entries[0];
  const bt=document.getElementById('emo-best-tag');bt.textContent=`Best: ${best[0]}`;bt.className=best[1].pnl>=0?'ins-tag ok':'ins-tag warn';
  document.getElementById('emo-pnl-rows').innerHTML=entries.map(([emo,d])=>{
    const pct=maxAbs>0?(Math.abs(d.pnl)/maxAbs)*100:0;
    const cls=d.pnl>=0?'pos':'neg';
    const ps=`${d.pnl>=0?'+':''}₹${Math.abs(d.pnl).toLocaleString('en-IN',{minimumFractionDigits:0})}`;
    return `<div class="emo-row"><div class="emo-icon">${EMOJIS[emo]||'•'}</div><div class="emo-name">${emo}</div><div class="emo-bar-wrap"><div class="emo-bar-fill ${cls}" style="width:${Math.max(pct,8)}%">${ps}</div></div><div class="emo-trades">${d.count}T</div></div>`;
  }).join('');
}

// ── GOOD vs BAD SPLIT
function renderSplit(){
  const scored=trades.filter(t=>t.q&&t.q.scored);
  if(!scored.length){
    document.getElementById('split-good-pnl').textContent='₹0';document.getElementById('split-bad-pnl').textContent='₹0';
    document.getElementById('split-good-sub').textContent='0 trades';document.getElementById('split-bad-sub').textContent='0 trades';
    document.getElementById('split-banner').innerHTML='Score your trades to see how much rule violations are costing you.';
    document.getElementById('split-tag').textContent='Rules Cost';document.getElementById('split-tag').className='ins-tag neutral';return;
  }
  const good=scored.filter(t=>qScore(t)>=3),bad=scored.filter(t=>qScore(t)<3);
  const goodPnl=good.reduce((s,t)=>s+t.pnl,0),badPnl=bad.reduce((s,t)=>s+t.pnl,0);
  const fmt=v=>`${v>=0?'+':''}₹${Math.abs(v).toLocaleString('en-IN',{minimumFractionDigits:0})}`;
  document.getElementById('split-good-pnl').textContent=fmt(goodPnl);document.getElementById('split-bad-pnl').textContent=fmt(badPnl);
  document.getElementById('split-good-sub').textContent=`${good.length} trades · avg ${good.length?fmt(goodPnl/good.length):'₹0'}`;
  document.getElementById('split-bad-sub').textContent=`${bad.length} trades · avg ${bad.length?fmt(badPnl/bad.length):'₹0'}`;
  const tag=document.getElementById('split-tag'),banner=document.getElementById('split-banner');
  if(bad.length===0){tag.textContent='100% Disciplined ✓';tag.className='ins-tag ok';banner.innerHTML='<strong>Perfect process.</strong> All scored trades followed ≥3/4 rules.';}
  else if(badPnl<0){const cost=Math.abs(badPnl);tag.textContent=`Violations cost ₹${cost.toLocaleString('en-IN',{maximumFractionDigits:0})}`;tag.className='ins-tag warn';banner.innerHTML=`Rule violations cost you <strong>₹${cost.toLocaleString('en-IN',{minimumFractionDigits:0})}</strong> across ${bad.length} bad trade${bad.length>1?'s':''}.`;}
  else{tag.textContent='Bad trades profitable?';tag.className='ins-tag warn';banner.innerHTML=`Bad trades made money — but don't be fooled. Profitable rule-breaking reinforces bad habits.`;}
}

// ── QUALITY SCORE
function toggleQ(key){const cur=document.getElementById('f-q-'+key).value==='1';setQ(key,!cur);updateQPreview();}
function setQ(key,val){document.getElementById('f-q-'+key).value=val?'1':'0';const el=document.getElementById('qc-'+key),box=document.getElementById('qcb-'+key);if(val){el.classList.add('checked');box.textContent='✓';}else{el.classList.remove('checked');box.textContent='';}}
function updateQPreview(){const keys=['setup','sizing','sl','structure'];const score=keys.reduce((s,k)=>s+(document.getElementById('f-q-'+k).value==='1'?1:0),0);const el=document.getElementById('qs-preview');el.textContent=`${score}/4`;el.className='quality-score-preview s'+score;}
function qScore(t){if(!t.q||!t.q.scored)return -1;return(t.q.setup||0)+(t.q.sizing||0)+(t.q.sl||0)+(t.q.structure||0);}
function qBadgeHTML(t){const s=qScore(t);if(s<0)return '<span class="qbadge qnone">—</span>';const labels={4:'A+ PROCESS',3:'GOOD',2:'MIXED',1:'POOR',0:'BROKE RULES'};return `<span class="qbadge q${s}">${labels[s]}</span>`;}
function qVerdictHTML(t){
  const s=qScore(t);
  if(s<0)return '<div class="verdict unscored"><div class="verdict-icon">📋</div><div class="verdict-body"><div class="verdict-title">Not Scored</div><div class="verdict-sub">Edit this trade to add a quality score.</div></div></div>';
  const checks=['Followed Setup','Position Sizing','Respected SL','A+ Structure'],keys=['setup','sizing','sl','structure'];
  const checkHTML=keys.map((k,i)=>`<span class="vc ${t.q[k]?'pass':'fail'}">${t.q[k]?'✓':'✗'} ${checks[i]}</span>`).join('');
  let cls,icon,title,sub;
  if(s===4){cls='good';icon='🏆';title='Perfect Execution';sub='All 4 rules followed. This is a good trade regardless of outcome.';}
  else if(s===3){cls='good';icon='✅';title='Good Trade';sub='Strong process. One rule missed — review which one and why.';}
  else if(s===2){cls='partial';icon='⚠️';title='Mixed Execution';sub='Half the rules followed. Consistency is critical for long-term edge.';}
  else if(s===1){cls='bad';icon='❌';title='Poor Execution';sub='Almost all rules broken. Bad trade even if it won.';}
  else{cls='bad';icon='🚫';title='Broke All Rules';sub='Zero process followed. If this won, it was luck — not skill.';}
  return `<div class="verdict ${cls}"><div class="verdict-icon">${icon}</div><div class="verdict-body"><div class="verdict-title">${title}</div><div class="verdict-sub">${sub}</div><div class="verdict-checks">${checkHTML}</div></div><div class="verdict-score">${s}/4</div></div>`;
}

// ── DAILY JOURNAL
function djPrev(){const d=new Date(document.getElementById('dj-date').value||new Date());d.setDate(d.getDate()-1);document.getElementById('dj-date').value=d.toISOString().split('T')[0];loadDayNote();}
function djNext(){const d=new Date(document.getElementById('dj-date').value||new Date());d.setDate(d.getDate()+1);document.getElementById('dj-date').value=d.toISOString().split('T')[0];loadDayNote();}
function djMood(btn,val){document.querySelectorAll('.dj-mood-row .eb').forEach(b=>b.classList.remove('on'));btn.classList.add('on');document.getElementById('dj-mood').value=val;}
function loadDayNote(){
  const date=document.getElementById('dj-date').value;
  document.getElementById('dj-label-date').textContent=date;
  const note=dayNotes[date]||{};
  document.getElementById('dj-note').value=note.text||'';
  document.getElementById('dj-mood').value=note.mood||'';
  document.querySelectorAll('.dj-mood-row .eb').forEach(b=>b.classList.toggle('on',b.textContent.trim()===note.mood));
  const dayTrades=trades.filter(t=>t.date===date);
  const dayPnl=dayTrades.reduce((s,t)=>s+t.pnl,0);
  const dayWins=dayTrades.filter(t=>t.pnl>0).length;
  const statEl=document.getElementById('dj-stats');
  if(dayTrades.length){
    const pc=dayPnl>=0?'pos':'neg';
    const ps=`${dayPnl>=0?'+':''}₹${Math.abs(dayPnl).toLocaleString('en-IN',{minimumFractionDigits:0})}`;
    statEl.innerHTML=`<div class="dj-stat"><div class="dj-stat-val ${pc}">${ps}</div><div class="dj-stat-lbl">Day P&L</div></div><div class="dj-stat"><div class="dj-stat-val neu">${dayTrades.length}</div><div class="dj-stat-lbl">Trades</div></div><div class="dj-stat"><div class="dj-stat-val pos">${dayWins}</div><div class="dj-stat-lbl">Wins</div></div><div class="dj-stat"><div class="dj-stat-val neg">${dayTrades.length-dayWins}</div><div class="dj-stat-lbl">Losses</div></div>`;
  } else {
    statEl.innerHTML='<div class="dj-stat" style="grid-column:1/-1"><div class="dj-stat-val neu" style="font-size:14px">No trades</div><div class="dj-stat-lbl">this day</div></div>';
  }
  document.getElementById('dj-trades').innerHTML=dayTrades.length?dayTrades.map(t=>{const c=t.pnl>=0?'var(--green)':'var(--red)';const ps=`${t.pnl>=0?'+':''}₹${Math.abs(t.pnl).toLocaleString('en-IN',{minimumFractionDigits:0})}`;return `<div class="dj-trade-item"><div><div style="font-weight:700;font-size:14px">${t.symbol}</div><div style="font-size:11px;color:var(--text3)">${t.setup||'—'}</div></div><div style="font-weight:700;color:${c};font-family:var(--mono);font-size:13px">${ps}</div></div>`;}).join(''):'<div style="font-size:12px;color:var(--text3);text-align:center;padding:20px">No trades this day</div>';
  const pastDates=Object.keys(dayNotes).filter(d=>d!==date&&dayNotes[d].text).sort((a,b)=>new Date(b)-new Date(a)).slice(0,4);
  document.getElementById('dj-past').innerHTML=pastDates.length?'<div style="font-size:12px;font-weight:700;color:var(--text2);margin-bottom:10px;text-transform:uppercase;letter-spacing:0.5px">Previous Notes</div>'+pastDates.map(d=>{const n=dayNotes[d];return `<div class="dj-note-card"><div class="dj-note-date">${d}</div>${n.mood?`<div class="dj-note-mood">${n.mood}</div>`:''}<div class="dj-note-text">${(n.text||'').slice(0,160)}${(n.text||'').length>160?'…':''}</div></div>`;}).join(''):'';
}
function saveDayNote(){
  const date=document.getElementById('dj-date').value;if(!date)return toast('Select a date first');
  dayNotes[date]={text:document.getElementById('dj-note').value.trim(),mood:document.getElementById('dj-mood').value,ts:Date.now()};
  localStorage.setItem('tl_dn',JSON.stringify(dayNotes));
  toast('✓ Note saved for '+date);loadDayNote();
}

// ── PLAYBOOK
function openPlaybookModal(id){
  document.getElementById('pb-modal-title').textContent=id?'Edit Setup':'New Setup';
  document.getElementById('pb-eid').value=id||'';
  if(id){const p=playbook.find(x=>x.id===id)||{};document.getElementById('pb-name').value=p.name||'';document.getElementById('pb-market').value=p.market||'';document.getElementById('pb-entry').value=p.entry||'';document.getElementById('pb-exit').value=p.exit||'';document.getElementById('pb-ind').value=p.ind||'';document.getElementById('pb-notes').value=p.notes||'';document.getElementById('pb-chart').value=p.chart||'';const pi=document.getElementById('pb-iprev');if(p.chart){pi.src=p.chart;pi.style.display='block';}else pi.style.display='none';}
  else{['pb-name','pb-entry','pb-exit','pb-ind','pb-notes','pb-chart'].forEach(x=>document.getElementById(x).value='');document.getElementById('pb-market').value='';document.getElementById('pb-iprev').style.display='none';}
  openM('pbm');
}
function pbImgUp(e){const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>{document.getElementById('pb-chart').value=ev.target.result;const p=document.getElementById('pb-iprev');p.src=ev.target.result;p.style.display='block';};r.readAsDataURL(f);}
function savePlaybook(){
  const name=document.getElementById('pb-name').value.trim();if(!name)return toast('Setup name required');
  const p={id:document.getElementById('pb-eid').value||Date.now().toString(),name,market:document.getElementById('pb-market').value,entry:document.getElementById('pb-entry').value,exit:document.getElementById('pb-exit').value,ind:document.getElementById('pb-ind').value,notes:document.getElementById('pb-notes').value,chart:document.getElementById('pb-chart').value,created:Date.now()};
  const eid=document.getElementById('pb-eid').value;
  if(eid){const i=playbook.findIndex(x=>x.id===eid);playbook[i]=p;}else playbook.push(p);
  localStorage.setItem('tl_pb',JSON.stringify(playbook));
  renderPlaybook();closeM('pbm');toast(`✓ "${name}" saved to Playbook`);
}
function delPlaybook(id,e){e.stopPropagation();if(!confirm('Delete this setup?'))return;playbook=playbook.filter(p=>p.id!==id);localStorage.setItem('tl_pb',JSON.stringify(playbook));renderPlaybook();toast('Setup deleted');}
function renderPlaybook(){
  const grid=document.getElementById('pb-grid');
  if(!playbook.length){grid.innerHTML='<div class="pb-empty"><div class="empty-i">📋</div><div class="empty-t">No setups documented yet.<br>Add your first setup to build your playbook.</div></div>';return;}
  grid.innerHTML=playbook.map(p=>{
    const st=trades.filter(t=>t.setup&&t.setup.toLowerCase()===p.name.toLowerCase());
    const sw=st.filter(t=>t.pnl>0),sp=st.reduce((s,t)=>s+t.pnl,0);
    const strip=st.length?`<div class="pb-stats-strip"><div class="pb-stat">${st.length} trades</div><div class="pb-stat">WR: <span>${Math.round(sw.length/st.length*100)}%</span></div><div class="pb-stat">P&L: <span style="color:${sp>=0?'var(--green)':'var(--red)'}">${sp>=0?'+':''}₹${Math.abs(sp).toLocaleString('en-IN',{maximumFractionDigits:0})}</span></div></div>`:'';
    return `<div class="pb-card"><div class="pb-card-header"><div class="pb-card-name">${p.name}</div>${p.market?`<div class="pb-market-badge">${p.market}</div>`:''}</div>${p.entry?`<div class="pb-section"><div class="pb-section-lbl">Entry Rules</div><div class="pb-section-val">${p.entry}</div></div>`:''} ${p.exit?`<div class="pb-section"><div class="pb-section-lbl">Exit Rules</div><div class="pb-section-val">${p.exit}</div></div>`:''} ${p.ind?`<div class="pb-section"><div class="pb-section-lbl">Indicators</div><div class="pb-section-val">${p.ind}</div></div>`:''} ${p.chart?`<img src="${p.chart}" class="pb-chart-thumb">`:''}${strip}<div class="pb-actions"><button class="rb" onclick="openPlaybookModal('${p.id}')">✏ Edit</button><button class="rb dl" onclick="delPlaybook('${p.id}',event)">✕ Delete</button></div></div>`;
  }).join('');
}

// ── REPORTS
function initReports(){
  const today=new Date().toISOString().split('T')[0];
  const ms=new Date(new Date().getFullYear(),new Date().getMonth(),1).toISOString().split('T')[0];
  if(!document.getElementById('rpt-from').value)document.getElementById('rpt-from').value=ms;
  if(!document.getElementById('rpt-to').value)document.getElementById('rpt-to').value=today;
}
function clearRptFilter(){document.getElementById('rpt-from').value='';document.getElementById('rpt-to').value='';document.getElementById('rpt-setup').value='';renderReports();}
function renderReports(){
  let list=[...trades];
  const from=document.getElementById('rpt-from').value,to=document.getElementById('rpt-to').value,setup=document.getElementById('rpt-setup').value;
  if(from)list=list.filter(t=>t.date>=from);if(to)list=list.filter(t=>t.date<=to);if(setup)list=list.filter(t=>t.setup===setup);
  list.sort((a,b)=>new Date(b.date)-new Date(a.date));
  const statsEl=document.getElementById('rpt-stats');
  if(!list.length){statsEl.innerHTML='<div class="rpt-card" style="grid-column:1/-1"><div style="color:var(--text3);text-align:center;padding:20px;font-size:13px">No trades match this filter.</div></div>';document.getElementById('rpt-tbody').innerHTML='<div class="otrade-empty">No trades</div>';if(rptDowC)rptDowC.destroy();if(rptDailyC)rptDailyC.destroy();return;}
  const wins=list.filter(t=>t.pnl>0),losses=list.filter(t=>t.pnl<0);
  const total=list.reduce((s,t)=>s+t.pnl,0),wr=Math.round(wins.length/list.length*100);
  const gp=wins.reduce((s,t)=>s+t.pnl,0),gl=Math.abs(losses.reduce((s,t)=>s+t.pnl,0));
  const pf=gl>0?(gp/gl).toFixed(2):gp>0?'∞':'0.00';
  const avgW=wins.length?(gp/wins.length):0,avgL=losses.length?(gl/losses.length):0;
  const fmt=v=>`${v>=0?'+':''}₹${Math.abs(v).toLocaleString('en-IN',{maximumFractionDigits:0})}`;
  const pc=total>=0?'pos':'neg';
  statsEl.innerHTML=`<div class="rpt-card"><div class="rpt-card-val ${pc}">${fmt(total)}</div><div class="rpt-card-lbl">Net P&L</div></div><div class="rpt-card"><div class="rpt-card-val purple">${wr}%</div><div class="rpt-card-lbl">Win Rate (${wins.length}W / ${losses.length}L)</div></div><div class="rpt-card"><div class="rpt-card-val">${pf}</div><div class="rpt-card-lbl">Profit Factor</div></div><div class="rpt-card"><div class="rpt-card-val pos">${fmt(avgW)}</div><div class="rpt-card-lbl">Avg Win</div></div><div class="rpt-card"><div class="rpt-card-val neg">-₹${Math.abs(avgL).toLocaleString('en-IN',{maximumFractionDigits:0})}</div><div class="rpt-card-lbl">Avg Loss</div></div>`;
  const dowL=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],dowD=Array(7).fill(0);
  list.forEach(t=>{dowD[new Date(t.date).getDay()]+=t.pnl;});
  const dCtx1=document.getElementById('rpt-dow-c').getContext('2d');
  if(rptDowC)rptDowC.destroy();
  rptDowC=new Chart(dCtx1,{type:'bar',data:{labels:dowL,datasets:[{data:dowD,backgroundColor:dowD.map(v=>v>=0?'rgba(18,183,106,0.18)':'rgba(240,68,56,0.18)'),borderColor:dowD.map(v=>v>=0?'#12b76a':'#f04438'),borderWidth:2,borderRadius:6}]},options:{responsive:true,plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>fmt(c.parsed.y)}}},scales:{x:{ticks:{color:'#667085',font:{family:'DM Mono',size:10}},grid:{display:false}},y:{ticks:{color:'#667085',font:{family:'DM Mono',size:10},callback:v=>fmt(v)},grid:{color:'rgba(0,0,0,0.05)'}}}}});
  const dayMap={};list.forEach(t=>{dayMap[t.date]=(dayMap[t.date]||0)+t.pnl;});
  const days=Object.keys(dayMap).sort().slice(-30),dayVals=days.map(d=>dayMap[d]);
  const dCtx2=document.getElementById('rpt-daily-c').getContext('2d');
  if(rptDailyC)rptDailyC.destroy();
  rptDailyC=new Chart(dCtx2,{type:'bar',data:{labels:days,datasets:[{data:dayVals,backgroundColor:dayVals.map(v=>v>=0?'rgba(18,183,106,0.18)':'rgba(240,68,56,0.18)'),borderColor:dayVals.map(v=>v>=0?'#12b76a':'#f04438'),borderWidth:2,borderRadius:4}]},options:{responsive:true,plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>fmt(c.parsed.y)}}},scales:{x:{ticks:{color:'#667085',font:{family:'DM Mono',size:9},maxTicksLimit:10},grid:{display:false}},y:{ticks:{color:'#667085',font:{family:'DM Mono',size:10},callback:v=>fmt(v)},grid:{color:'rgba(0,0,0,0.05)'}}}}});
  document.getElementById('rpt-tbody').innerHTML=list.map(t=>{
    const cls=t.pnl>0?'pos':t.pnl<0?'neg':'';
    const ps=`${t.pnl>=0?'+':''}₹${Math.abs(t.pnl).toLocaleString('en-IN',{minimumFractionDigits:0})}`;
    return `<div class="tr" style="grid-template-columns:110px 120px 140px 100px 100px 120px 110px" onclick="od('${t.id}')"><div class="td mo">${t.date}</div><div class="td sy">${t.symbol}</div><div class="td"><span class="chip">${t.setup||'—'}</span></div><div class="td mo">₹${t.entry.toLocaleString('en-IN')}</div><div class="td mo">₹${t.exit.toLocaleString('en-IN')}</div><div class="td ${cls}" style="font-family:var(--mono);font-weight:700">${ps}</div><div class="td">${qBadgeHTML(t)}</div></div>`;
  }).join('');
}

// ── CALCULATORS
function cr1(){
  const cap=parseFloat(document.getElementById('c1c').value)||0;
  const rp=parseFloat(document.getElementById('c1r').value)||0;
  const en=parseFloat(document.getElementById('c1e').value)||0;
  const sl=parseFloat(document.getElementById('c1s').value)||0;
  if(!cap||!rp||!en||!sl)return toast('Fill all fields');
  const risk=cap*rp/100;
  const pps=Math.abs(en-sl);
  if(!pps)return toast('Entry and SL cannot be same');
  const qty=Math.floor(risk/pps);
  const el=document.getElementById('res1');el.style.display='block';
  document.getElementById('r1v').textContent=qty;
  document.getElementById('r1s').textContent=`Risk: ₹${(qty*pps).toLocaleString('en-IN',{maximumFractionDigits:0})} · Capital deployed: ₹${(qty*en).toLocaleString('en-IN',{maximumFractionDigits:0})}`;
}
function cr2(){
  const en=parseFloat(document.getElementById('c2e').value)||0;
  const sl=parseFloat(document.getElementById('c2s').value)||0;
  const tg=parseFloat(document.getElementById('c2t').value)||0;
  const qty=parseFloat(document.getElementById('c2q').value)||0;
  if(!en||!sl||!tg||!qty)return toast('Fill all fields');
  const risk=Math.abs(en-sl)*qty,reward=Math.abs(tg-en)*qty;
  const rr=(reward/risk).toFixed(2);
  const el=document.getElementById('res2');el.style.display='block';
  document.getElementById('r2v').textContent=`1 : ${rr}`;
  document.getElementById('r2s').textContent=`Risk: ₹${risk.toLocaleString('en-IN',{maximumFractionDigits:0})} · Reward: ₹${reward.toLocaleString('en-IN',{maximumFractionDigits:0})}`;
}

// ── GITHUB GIST SYNC
async function gstat(auto){
  const tok=localStorage.getItem('tl_tok'),gid=localStorage.getItem('tl_gid');
  if(!tok||!gid)return;
  try{
    const r=await fetch(`https://api.github.com/gists/${gid}`,{headers:{'Authorization':`token ${tok}`,'Accept':'application/vnd.github.v3+json'}});
    if(!r.ok)throw new Error();
    if(auto){const d=await r.json();const f=Object.values(d.files||{}).find(f=>f.filename==='tradelog.json');if(f?.content){const remote=JSON.parse(f.content);if(remote.length>trades.length){trades=remote;persist();rd();rj();toast('↓ Trades synced from Gist');}}}
    document.getElementById('gdot').classList.add('on');document.getElementById('gtxt').textContent='Connected';
  }catch{document.getElementById('gdot').classList.remove('on');document.getElementById('gtxt').textContent='Connection failed';}
}
function saveGist(){
  const tok=document.getElementById('stok').value.trim(),gid=document.getElementById('sgid').value.trim();
  if(!tok||!gid)return toast('Enter both token and Gist ID');
  localStorage.setItem('tl_tok',tok);localStorage.setItem('tl_gid',gid);gstat(false);toast('✓ Saved — testing connection...');
}
async function sync(){
  const tok=localStorage.getItem('tl_tok'),gid=localStorage.getItem('tl_gid');
  if(!tok||!gid)return;
  try{await fetch(`https://api.github.com/gists/${gid}`,{method:'PATCH',headers:{'Authorization':`token ${tok}`,'Content-Type':'application/json'},body:JSON.stringify({files:{'tradelog.json':{content:JSON.stringify(trades)}}})});}catch{}
}

// ── EXPORT JSON
function expJSON(){
  const a=document.createElement('a');
  a.href='data:application/json,'+encodeURIComponent(JSON.stringify(trades,null,2));
  a.download='tradelog.json';a.click();
}

// ── EXPORT PDF
function exportPDF(){
  const {jsPDF}=window.jspdf;
  const doc=new jsPDF({orientation:'portrait',unit:'mm',format:'a4'});
  const W=210,M=18;let y=M;
  const fmt=v=>`${v>=0?'+':'-'}Rs.${Math.abs(v).toLocaleString('en-IN',{minimumFractionDigits:2})}`;
  doc.setFillColor(124,92,252);doc.rect(0,0,W,38,'F');
  doc.setTextColor(255,255,255);doc.setFont('helvetica','bold');doc.setFontSize(22);doc.text('TradeLog — Performance Report',M,20);
  doc.setFontSize(10);doc.setFont('helvetica','normal');doc.text(new Date().toLocaleDateString('en-IN',{weekday:'long',year:'numeric',month:'long',day:'numeric'}),M,30);
  y=50;
  if(trades.length){
    const wins=trades.filter(t=>t.pnl>0),losses=trades.filter(t=>t.pnl<0);
    const total=trades.reduce((s,t)=>s+t.pnl,0);
    const wr=(wins.length/trades.length*100).toFixed(1);
    const gp=wins.reduce((s,t)=>s+t.pnl,0),gl=Math.abs(losses.reduce((s,t)=>s+t.pnl,0));
    const pf=gl>0?(gp/gl).toFixed(2):'∞';
    doc.setTextColor(50,50,80);doc.setFont('helvetica','bold');doc.setFontSize(13);doc.text('Summary',M,y);y+=8;
    const stats=[['Total P&L',fmt(total)],['Total Trades',trades.length],['Win Rate',wr+'%'],['Wins/Losses',`${wins.length} / ${losses.length}`],['Profit Factor',pf],['Avg Win',wins.length?fmt(gp/wins.length):'—'],['Avg Loss',losses.length?fmt(-gl/losses.length):'—']];
    stats.forEach(([k,v])=>{doc.setFont('helvetica','normal');doc.setFontSize(10);doc.setTextColor(100,100,130);doc.text(k,M,y);doc.setFont('helvetica','bold');doc.setTextColor(20,20,40);doc.text(String(v),M+55,y);y+=7;});
    y+=8;doc.setFont('helvetica','bold');doc.setFontSize(13);doc.setTextColor(50,50,80);doc.text('Trades',M,y);y+=8;
    const cols=['Date','Symbol','Setup','P&L','Quality'];const cw=[28,28,38,28,24];
    doc.setFillColor(240,241,246);doc.rect(M,y-5,W-M*2,8,'F');
    doc.setFont('helvetica','bold');doc.setFontSize(9);doc.setTextColor(80,80,120);
    let cx=M;cols.forEach((c,i)=>{doc.text(c,cx,y);cx+=cw[i];});y+=6;
    const sorted=[...trades].sort((a,b)=>new Date(b.date)-new Date(a.date));
    sorted.forEach(t=>{
      if(y>270){doc.addPage();y=M;}
      doc.setFont('helvetica','normal');doc.setFontSize(8);
      const c=t.pnl>=0?[18,183,106]:[240,68,56];
      const row=[t.date,t.symbol,t.setup||'—',fmt(t.pnl),qScore(t)>=0?`${qScore(t)}/4`:'—'];
      cx=M;row.forEach((v,i)=>{if(i===3)doc.setTextColor(...c);else doc.setTextColor(40,40,60);doc.text(String(v),cx,y);cx+=cw[i];});
      y+=6;doc.setDrawColor(230,230,240);doc.line(M,y-2,W-M,y-2);
    });
  }
  doc.save('tradelog-report.pdf');
}

// ── CLEAR + PASSWORD
function clr(){if(!confirm('This will delete ALL trades. Are you sure?'))return;trades=[];persist();rd();rj();toast('All data cleared');}
function chgPass(){const np=document.getElementById('snp').value,cp=document.getElementById('scp').value;if(!np)return toast('Enter a new password');if(np!==cp)return toast('Passwords do not match');localStorage.setItem('tl_p',np);document.getElementById('snp').value='';document.getElementById('scp').value='';toast('✓ Password updated');}

// ── TOAST
let _tt;
function toast(msg){const el=document.getElementById('toast');el.textContent=msg;el.style.display='block';clearTimeout(_tt);_tt=setTimeout(()=>el.style.display='none',2800);}

// ── GAUGE MINI-CHARTS on stat cards
let gaugeCharts={};
function drawGauge(id,pct,color){
  const canvas=document.getElementById(id);
  if(!canvas)return;
  if(gaugeCharts[id])gaugeCharts[id].destroy();
  const clamp=Math.min(Math.max(pct,0),100);
  gaugeCharts[id]=new Chart(canvas.getContext('2d'),{
    type:'doughnut',
    data:{
      datasets:[{
        data:[clamp,100-clamp],
        backgroundColor:[color,color.replace(')',',0.1)').replace('rgb','rgba')],
        borderWidth:0,
        circumference:180,
        rotation:-90,
        borderRadius:4
      }]
    },
    options:{responsive:false,cutout:'68%',plugins:{legend:{display:false},tooltip:{enabled:false}}}
  });
}

function updateGauges(wrPct,pfPct,rrPct,totalPct){
  // WR gauge — green
  drawGauge('g-wr',wrPct,'rgb(18,183,106)');
  document.getElementById('gv-wr').textContent=Math.round(wrPct)+'%';
  // PF gauge — blue
  drawGauge('g-pf',pfPct,'rgb(46,144,250)');
  document.getElementById('gv-pf').textContent=Math.round(pfPct)+'%';
  // RR gauge — amber
  drawGauge('g-rr',rrPct,'rgb(247,144,9)');
  document.getElementById('gv-rr').textContent=Math.round(rrPct)+'%';
  // P&L gauge — purple (positive = % full of target, e.g. vs 100k goal)
  drawGauge('g-pnl',totalPct,'rgb(124,92,252)');
  document.getElementById('gv-pnl').textContent=Math.round(totalPct)+'%';
}

// ── NET DAILY P&L CHART
let ndpC=null;
function ndpChart(){
  const ctx=document.getElementById('ndp-c');
  if(!ctx)return;
  if(ndpC)ndpC.destroy();
  // build daily P&L map
  const dayMap={};
  trades.forEach(t=>{dayMap[t.date]=(dayMap[t.date]||0)+t.pnl;});
  const days=Object.keys(dayMap).sort().slice(-30);
  const vals=days.map(d=>parseFloat(dayMap[d].toFixed(2)));
  const fmt=v=>`${v>=0?'+':''}₹${Math.abs(v).toLocaleString('en-IN',{maximumFractionDigits:0})}`;
  ndpC=new Chart(ctx.getContext('2d'),{
    type:'bar',
    data:{
      labels:days,
      datasets:[{
        data:vals,
        backgroundColor:vals.map(v=>v>=0?'rgba(18,183,106,0.20)':'rgba(240,68,56,0.18)'),
        borderColor:vals.map(v=>v>=0?'#12b76a':'#f04438'),
        borderWidth:1.5,
        borderRadius:5,
        borderSkipped:false
      }]
    },
    options:{
      responsive:true,
      plugins:{
        legend:{display:false},
        tooltip:{
          backgroundColor:'#ffffff',borderColor:'rgba(0,0,0,0.08)',borderWidth:1,
          bodyColor:'#101828',bodyFont:{family:'DM Mono',size:12},
          titleColor:'#667085',titleFont:{family:'DM Mono',size:10},
          callbacks:{label:c=>fmt(c.parsed.y)}
        }
      },
      scales:{
        x:{ticks:{color:'#98a2b3',font:{family:'DM Mono',size:9},maxTicksLimit:12,maxRotation:0},grid:{display:false},border:{display:false}},
        y:{ticks:{color:'#98a2b3',font:{family:'DM Mono',size:10},callback:v=>fmt(v)},grid:{color:'rgba(0,0,0,0.04)'},border:{display:false}}
      }
    }
  });
}
