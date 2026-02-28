let trades=[],eqC=null,wlC=null,setupC=null;
let hmYear=new Date().getFullYear(),hmMonth=new Date().getMonth();
const MONTHS=['JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE','JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER'];

// ── BOOT
window.onload=()=>{
  const d=new Date();
  document.getElementById('ddate').textContent=d.toLocaleDateString('en-IN',{weekday:'long',year:'numeric',month:'long',day:'numeric'}).toUpperCase();
  document.getElementById('f-date').value=d.toISOString().split('T')[0];
  trades=JSON.parse(localStorage.getItem('tl_t')||'[]');
  const tok=localStorage.getItem('tl_tok'),gid=localStorage.getItem('tl_gid');
  if(tok)document.getElementById('stok').value=tok;
  if(gid)document.getElementById('sgid').value=gid;
  if(tok&&gid)gstat(true);
  document.getElementById('pin').addEventListener('keydown',e=>{if(e.key==='Enter')unlock();});
  setTimeout(()=>document.getElementById('pin').focus(),150);
};

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
  btn.classList.add('on');
  if(id==='dashboard')rd();
  if(id==='journal')rj();
  if(id==='analytics'){renderHeatmap();renderSetupBars();renderMonthTable();renderSetupChart();renderPsychAnalytics();}
}

// ── MODAL
function openAdd(){
  document.getElementById('mtitle').textContent='NEW TRADE';
  document.getElementById('eid').value='';
  ['f-sym','f-en','f-ex','f-qty','f-pnl','f-rr','f-str','f-les','f-emo','f-chart'].forEach(x=>document.getElementById(x).value='');
  document.getElementById('f-setup').value='';
  document.getElementById('f-date').value=new Date().toISOString().split('T')[0];
  document.getElementById('iprev').style.display='none';
  document.querySelectorAll('.eb').forEach(b=>b.classList.remove('on'));
  // reset quality
  ['setup','sizing','sl','structure'].forEach(k=>setQ(k,false));
  updateQPreview();
  openM('tm');
}

function openEdit(id){
  const t=trades.find(x=>x.id===id);if(!t)return;
  document.getElementById('mtitle').textContent='EDIT TRADE';
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
  // restore quality
  ['setup','sizing','sl','structure'].forEach(k=>setQ(k,!!(t.q&&t.q[k])));
  updateQPreview();
  openM('tm');
}

function openM(id){document.getElementById(id).classList.add('open');}
function closeM(id){document.getElementById(id).classList.remove('open');}
document.querySelectorAll('.ov').forEach(o=>o.addEventListener('click',e=>{if(e.target===o)o.classList.remove('open');}));

function emo(btn,val){
  document.querySelectorAll('.eb').forEach(b=>b.classList.remove('on'));
  btn.classList.add('on');document.getElementById('f-emo').value=val;
}

function imgUp(e){
  const f=e.target.files[0];if(!f)return;
  const r=new FileReader();
  r.onload=ev=>{
    document.getElementById('f-chart').value=ev.target.result;
    const p=document.getElementById('iprev');p.src=ev.target.result;p.style.display='block';
  };
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
      scored: !!(document.getElementById('f-q-setup').value || document.getElementById('f-q-sizing').value || document.getElementById('f-q-sl').value || document.getElementById('f-q-structure').value)
    }
  };
  const eid=document.getElementById('eid').value;
  if(eid){const i=trades.findIndex(x=>x.id===eid);trades[i]=t;}
  else trades.push(t);
  persist();closeM('tm');rd();rj();toast(`✓ ${sym} saved`);
}

function del(id,e){
  e.stopPropagation();
  if(!confirm('Delete this trade?'))return;
  trades=trades.filter(t=>t.id!==id);persist();rd();rj();toast('Deleted');
}

function persist(){
  localStorage.setItem('tl_t',JSON.stringify(trades));
  sync();
}

// ── JOURNAL RENDER
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
  if(!list.length){
    body.innerHTML='<div class="empty"><div class="empty-i">◧</div><div class="empty-t">No trades found — start logging</div></div>';
    return;
  }
  body.innerHTML=list.map(t=>{
    const cls=t.pnl>0?'pos':t.pnl<0?'neg':'';
    const rc=t.pnl>0?'win':t.pnl<0?'loss':'';
    const ps=`${t.pnl>=0?'+':''}₹${Math.abs(t.pnl).toLocaleString('en-IN',{minimumFractionDigits:2})}`;
    return `<div class="tr ${rc}" onclick="od('${t.id}')">
      <div class="td mo">${t.date}</div>
      <div class="td sy">${t.symbol}</div>
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
    ${t.chart?`<div class="ds"><div class="dsl">Chart</div><img src="${t.chart}" style="max-width:100%;border-radius:12px;margin-top:8px;border:1px solid rgba(255,255,255,0.08)"></div>`:''}
  `;
  openM('dm');
}

// ── DASHBOARD
function rd(){
  if(!trades.length){resetD();eqChart([],[]);wlChart(0,0);return;}
  const sorted=[...trades].sort((a,b)=>new Date(a.date)-new Date(b.date));
  const total=trades.reduce((s,t)=>s+t.pnl,0);
  const wins=trades.filter(t=>t.pnl>0),losses=trades.filter(t=>t.pnl<0);
  const wr=(wins.length/trades.length*100).toFixed(1);
  const gp=wins.reduce((s,t)=>s+t.pnl,0);
  const gl=Math.abs(losses.reduce((s,t)=>s+t.pnl,0));
  const pf=gl>0?(gp/gl).toFixed(2):gp>0?'∞':'0.00';
  const rrt=trades.filter(t=>t.rr&&t.rr.includes(':'));
  let avgRR='—';
  if(rrt.length){
    const vs=rrt.map(t=>{const p=t.rr.split(':');return parseFloat(p[1])/parseFloat(p[0]);}).filter(x=>!isNaN(x));
    if(vs.length)avgRR='1:'+(vs.reduce((a,b)=>a+b,0)/vs.length).toFixed(2);
  }
  const pe=document.getElementById('s-pnl');
  const sg=total>=0?'+':'';
  pe.textContent=`${sg}₹${Math.abs(total).toLocaleString('en-IN',{minimumFractionDigits:2})}`;
  pe.className='sc-val '+(total>=0?'pos':'neg');
  document.getElementById('s-psub').textContent=`${trades.length} TRADES LOGGED`;
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
  eqChart(labels,eq);wlChart(wins.length,losses.length);

  let mw=0,ml=0,wc=0,lc=0;
  sorted.forEach(t=>{
    if(t.pnl>0){wc++;lc=0;mw=Math.max(mw,wc);}
    else if(t.pnl<0){lc++;wc=0;ml=Math.max(ml,lc);}
    else{wc=0;lc=0;}
  });
  const last=sorted[sorted.length-1];
  const cur=last.pnl>0?wc:last.pnl<0?-lc:0;
  document.getElementById('st-w').textContent=mw;
  document.getElementById('st-l').textContent=ml;
  const ce=document.getElementById('st-c');
  ce.textContent=Math.abs(cur);
  ce.className='str-n '+(cur>0?'g':cur<0?'r':'n');

  const byp=[...trades].sort((a,b)=>b.pnl-a.pnl);
  const show=[byp[0],byp[byp.length-1]].filter(Boolean);
  document.getElementById('bwlist').innerHTML=show.map(t=>{
    const c=t.pnl>=0?'var(--green)':'var(--red)';
    const ps=`${t.pnl>=0?'+':''}₹${Math.abs(t.pnl).toLocaleString('en-IN',{minimumFractionDigits:2})}`;
    return `<div class="bw"><div><div class="bw-sym">${t.symbol}</div><div class="bw-meta">${t.date} · ${t.setup||'—'}</div></div><div class="bw-pnl" style="color:${c}">${ps}</div></div>`;
  }).join('');

  renderEmoPnL();
  renderSplit();
}

function resetD(){
  document.getElementById('s-pnl').textContent='₹0';
  document.getElementById('s-pnl').className='sc-val gold';
  document.getElementById('s-psub').textContent='0 TRADES LOGGED';
  document.getElementById('s-wr').textContent='0%';document.getElementById('s-wsub').textContent='0W · 0L';
  document.getElementById('s-pf').textContent='0.00';document.getElementById('s-rr').textContent='—';
  document.getElementById('st-w').textContent='0';document.getElementById('st-l').textContent='0';document.getElementById('st-c').textContent='0';
  document.getElementById('bwlist').innerHTML='<div class="bw"><div class="bw-sym" style="color:var(--text3);font-size:13px;font-family:var(--mono)">No trades yet</div></div>';
  document.getElementById('emo-pnl-rows').innerHTML='<div class="otrade-empty">No emotions logged yet.</div>';
  document.getElementById('split-banner').innerHTML='Score your trades to see how much rule violations are costing you.';
}

function eqChart(labels,data){
  const ctx=document.getElementById('eq-c').getContext('2d');
  if(eqC)eqC.destroy();
  const last=data[data.length-1]||0;
  const col=last>=0?'#00e87a':'#ff4d6a';
  eqC=new Chart(ctx,{
    type:'line',
    data:{labels,datasets:[{data,borderColor:col,backgroundColor:col+'12',borderWidth:2,fill:true,tension:0.38,pointRadius:data.length<30?3:0,pointBackgroundColor:col,pointBorderWidth:0}]},
    options:{responsive:true,plugins:{legend:{display:false},tooltip:{backgroundColor:'#1e1e2e',borderColor:'rgba(255,255,255,.15)',borderWidth:1,titleColor:'#a8a8c8',bodyColor:'#f0f0f8',titleFont:{family:'JetBrains Mono',size:10},bodyFont:{family:'JetBrains Mono',size:12},callbacks:{label:c=>'₹'+c.parsed.y.toLocaleString('en-IN')}}},
    scales:{x:{ticks:{color:'#a8a8c8',font:{family:'JetBrains Mono',size:10},maxTicksLimit:8},grid:{color:'rgba(255,255,255,.07)'},border:{color:'rgba(255,255,255,.10)'}},y:{ticks:{color:'#a8a8c8',font:{family:'JetBrains Mono',size:10},callback:v=>'₹'+v.toLocaleString('en-IN')},grid:{color:'rgba(255,255,255,.07)'},border:{color:'rgba(255,255,255,.10)'}}}
  }});
}

function wlChart(w,l){
  const ctx=document.getElementById('wl-c').getContext('2d');
  if(wlC)wlC.destroy();
  wlC=new Chart(ctx,{
    type:'doughnut',
    data:{labels:['Wins','Losses'],datasets:[{data:w||l?[w,l]:[1,1],backgroundColor:w||l?['#00e87a','#ff4d6a']:['#1f1f30','#1f1f30'],borderWidth:0,hoverOffset:6}]},
    options:{responsive:true,cutout:'72%',plugins:{legend:{position:'bottom',labels:{color:'#a8a8c8',font:{family:'JetBrains Mono',size:11},padding:18,boxWidth:10,boxHeight:10}},tooltip:{backgroundColor:'#1e1e2e',borderColor:'rgba(255,255,255,.15)',borderWidth:1,bodyColor:'#f0f0f8',bodyFont:{family:'JetBrains Mono',size:12}}}}
  });
}

// ── HEATMAP
function hmPrev(){if(hmMonth===0){hmMonth=11;hmYear--;}else hmMonth--;renderHeatmap();}
function hmNext(){if(hmMonth===11){hmMonth=0;hmYear++;}else hmMonth++;renderHeatmap();}

function renderHeatmap(){
  document.getElementById('hm-label').textContent=`${MONTHS[hmMonth]} ${hmYear}`;
  const cal=document.getElementById('hm-cal');

  // Build daily PNL map for this month
  const dayMap={};
  trades.forEach(t=>{
    const d=new Date(t.date);
    if(d.getFullYear()===hmYear&&d.getMonth()===hmMonth){
      const k=d.getDate();
      dayMap[k]=(dayMap[k]||0)+t.pnl;
    }
  });

  // Max abs for intensity scaling
  const vals=Object.values(dayMap).map(Math.abs);
  const maxAbs=vals.length?Math.max(...vals):1;

  const firstDay=new Date(hmYear,hmMonth,1).getDay();
  const daysInMonth=new Date(hmYear,hmMonth+1,0).getDate();

  let html='';
  for(let i=0;i<firstDay;i++) html+=`<div class="hm-day empty"></div>`;
  for(let d=1;d<=daysInMonth;d++){
    const pnl=dayMap[d];
    let cls='nodata',dpHtml='';
    if(pnl!==undefined){
      const ratio=Math.abs(pnl)/maxAbs;
      const intensity=ratio>0.66?'lg':ratio>0.33?'md':'sm';
      cls=pnl>=0?`win-${intensity}`:`loss-${intensity}`;
      const ps=`${pnl>=0?'+':''}${Math.abs(pnl)<1000?'₹'+Math.abs(pnl).toFixed(0):'₹'+(Math.abs(pnl)/1000).toFixed(1)+'k'}`;
      dpHtml=`<span class="dp">${ps}</span>`;
    }
    html+=`<div class="hm-day ${cls}" title="Day ${d}${pnl!==undefined?' · ₹'+pnl.toLocaleString('en-IN'):''}"><span class="dn">${d}</span>${dpHtml}</div>`;
  }
  cal.innerHTML=html;
}

// ── SETUP BARS
function renderSetupBars(){
  const map={};
  trades.forEach(t=>{
    const k=t.setup||'Untagged';
    if(!map[k])map[k]={pnl:0,count:0,wins:0};
    map[k].pnl+=t.pnl;
    map[k].count++;
    if(t.pnl>0)map[k].wins++;
  });

  const entries=Object.entries(map).sort((a,b)=>b[1].pnl-a[1].pnl);
  if(!entries.length){
    document.getElementById('setup-bars').innerHTML='<div class="empty"><div class="empty-i">◫</div><div class="empty-t">No trades yet</div></div>';
    return;
  }

  const maxAbs=Math.max(...entries.map(e=>Math.abs(e[1].pnl)));
  document.getElementById('setup-bars').innerHTML=entries.map(([name,d])=>{
    const pct=maxAbs>0?(Math.abs(d.pnl)/maxAbs)*100:0;
    const cls=d.pnl>=0?'pos':'neg';
    const ps=`${d.pnl>=0?'+':''}₹${Math.abs(d.pnl).toLocaleString('en-IN',{minimumFractionDigits:0})}`;
    const wr=((d.wins/d.count)*100).toFixed(0);
    return `<div class="setup-bar-row">
      <div class="sbn">${name}</div>
      <div class="sb-track"><div class="sb-fill ${cls}" style="width:${pct}%">${ps}</div></div>
      <div class="sb-meta">${d.count}T · ${wr}%W</div>
    </div>`;
  }).join('');
}

// ── SETUP CHART
function renderSetupChart(){
  const map={};
  trades.forEach(t=>{
    const k=t.setup||'Untagged';
    map[k]=(map[k]||0)+t.pnl;
  });
  const keys=Object.keys(map);
  const vals=Object.values(map);
  const ctx=document.getElementById('setup-chart').getContext('2d');
  if(setupC)setupC.destroy();
  if(!keys.length)return;
  setupC=new Chart(ctx,{
    type:'bar',
    data:{
      labels:keys,
      datasets:[{
        data:vals,
        backgroundColor:vals.map(v=>v>=0?'rgba(0,232,122,0.25)':'rgba(255,77,106,0.25)'),
        borderColor:vals.map(v=>v>=0?'#00e87a':'#ff4d6a'),
        borderWidth:1,
        borderRadius:6,
      }]
    },
    options:{
      responsive:true,
      plugins:{legend:{display:false},tooltip:{backgroundColor:'#1a1a28',borderColor:'rgba(255,255,255,.08)',borderWidth:1,bodyColor:'#f0f0f8',bodyFont:{family:'JetBrains Mono',size:11},callbacks:{label:c=>'P&L: ₹'+c.parsed.y.toLocaleString('en-IN')}}},
      scales:{
        x:{ticks:{color:'#a8a8c8',font:{family:'JetBrains Mono',size:10}},grid:{color:'rgba(255,255,255,.07)'},border:{color:'rgba(255,255,255,.10)'}},
        y:{ticks:{color:'#a8a8c8',font:{family:'JetBrains Mono',size:10},callback:v=>'₹'+v.toLocaleString('en-IN')},grid:{color:'rgba(255,255,255,.07)'},border:{color:'rgba(255,255,255,.10)'}}
      }
    }
  });
}

// ── MONTHLY TABLE
function renderMonthTable(){
  const map={};
  trades.forEach(t=>{
    const d=new Date(t.date);
    const k=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    if(!map[k])map[k]={trades:0,wins:0,pnl:0,label:`${MONTHS[d.getMonth()].slice(0,3)} ${d.getFullYear()}`};
    map[k].trades++;
    if(t.pnl>0)map[k].wins++;
    map[k].pnl+=t.pnl;
  });
  const rows=Object.entries(map).sort((a,b)=>b[0].localeCompare(a[0]));
  if(!rows.length){
    document.getElementById('month-body').innerHTML='<tr><td colspan="5" style="color:var(--text3);font-family:var(--mono);font-size:11px;padding:20px 12px">No data yet</td></tr>';
    return;
  }
  document.getElementById('month-body').innerHTML=rows.map(([,d])=>{
    const cls=d.pnl>=0?'pos':'neg';
    const ps=`${d.pnl>=0?'+':''}₹${Math.abs(d.pnl).toLocaleString('en-IN',{minimumFractionDigits:2})}`;
    const wr=((d.wins/d.trades)*100).toFixed(0);
    return `<tr><td class="sym-col">${d.label}</td><td>${d.trades}</td><td>${d.wins}</td><td class="${cls}">${ps}</td><td>${wr}%</td></tr>`;
  }).join('');
}

// ── CALCULATORS
function cr1(){
  const cap=parseFloat(document.getElementById('c1c').value);
  const rp=parseFloat(document.getElementById('c1r').value);
  const en=parseFloat(document.getElementById('c1e').value);
  const sl=parseFloat(document.getElementById('c1s').value);
  if(!cap||!rp||!en||!sl)return toast('⚠ Fill all fields');
  if(en<=sl)return toast('⚠ Entry must be above SL');
  const ra=(cap*rp)/100,rps=en-sl,qty=Math.floor(ra/rps);
  const inv=(qty*en).toLocaleString('en-IN',{minimumFractionDigits:2});
  const mxl=(qty*rps).toLocaleString('en-IN',{minimumFractionDigits:2});
  document.getElementById('r1v').textContent=qty;
  document.getElementById('r1s').textContent=`Max loss ₹${mxl}  ·  Investment ₹${inv}`;
  document.getElementById('res1').style.display='block';
}

function cr2(){
  const en=parseFloat(document.getElementById('c2e').value);
  const sl=parseFloat(document.getElementById('c2s').value);
  const tg=parseFloat(document.getElementById('c2t').value);
  const qty=parseFloat(document.getElementById('c2q').value);
  if(!en||!sl||!tg||!qty)return toast('⚠ Fill all fields');
  const risk=Math.abs(en-sl),rw=Math.abs(tg-en);
  const rr=(rw/risk).toFixed(2);
  const mxl=(risk*qty).toLocaleString('en-IN',{minimumFractionDigits:2});
  const mxg=(rw*qty).toLocaleString('en-IN',{minimumFractionDigits:2});
  document.getElementById('r2v').textContent=`1 : ${rr}`;
  document.getElementById('r2s').textContent=`Max loss ₹${mxl}  ·  Max gain ₹${mxg}`;
  document.getElementById('res2').style.display='block';
}

// ── PDF EXPORT
function exportPDF(){
  if(!trades.length)return toast('⚠ No trades to export');
  toast('Generating PDF...');

  const {jsPDF}=window.jspdf;
  const doc=new jsPDF({orientation:'portrait',unit:'mm',format:'a4'});
  const W=210,margin=16;
  let y=margin;

  // Header
  doc.setFillColor(6,6,8);
  doc.rect(0,0,W,40,'F');
  doc.setFont('helvetica','bold');
  doc.setFontSize(26);
  doc.setTextColor(201,168,76);
  doc.text('TRADELOG',margin,22);
  doc.setFontSize(9);
  doc.setFont('helvetica','normal');
  doc.setTextColor(120,120,160);
  doc.text('PERSONAL TRADING JOURNAL · INR · STOCKS',margin,30);
  doc.setFontSize(9);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}`,W-margin,30,{align:'right'});
  y=50;

  // Stats summary
  const total=trades.reduce((s,t)=>s+t.pnl,0);
  const wins=trades.filter(t=>t.pnl>0);
  const losses=trades.filter(t=>t.pnl<0);
  const wr=(wins.length/trades.length*100).toFixed(1);
  const gp=wins.reduce((s,t)=>s+t.pnl,0);
  const gl=Math.abs(losses.reduce((s,t)=>s+t.pnl,0));
  const pf=gl>0?(gp/gl).toFixed(2):gp>0?'∞':'0.00';

  const stats=[
    {label:'Total P&L',value:`${total>=0?'+':''}Rs.${Math.abs(total).toLocaleString('en-IN',{minimumFractionDigits:2})}`},
    {label:'Win Rate',value:`${wr}%`},
    {label:'Total Trades',value:trades.length},
    {label:'Profit Factor',value:pf},
    {label:'Wins',value:wins.length},
    {label:'Losses',value:losses.length},
  ];

  doc.setFillColor(20,20,32);
  doc.roundedRect(margin,y,W-margin*2,28,3,3,'F');
  doc.setFont('helvetica','bold');
  doc.setFontSize(7);
  doc.setTextColor(60,60,90);
  const colW=(W-margin*2)/stats.length;
  stats.forEach((s,i)=>{
    const x=margin+i*colW+colW/2;
    doc.text(s.label.toUpperCase(),x,y+9,{align:'center'});
    doc.setFontSize(13);
    doc.setTextColor(240,240,248);
    doc.text(String(s.value),x,y+21,{align:'center'});
    doc.setFontSize(7);
    doc.setTextColor(60,60,90);
  });
  y+=36;

  // Section: Trades
  doc.setFont('helvetica','bold');
  doc.setFontSize(9);
  doc.setTextColor(60,60,90);
  doc.text('ALL TRADES',margin,y);
  y+=6;

  // Table header
  const cols=[{t:'Date',w:22},{t:'Symbol',w:22},{t:'Setup',w:30},{t:'Entry',w:20},{t:'Exit',w:20},{t:'Qty',w:14},{t:'P&L',w:28},{t:'R:R',w:16}];
  doc.setFillColor(15,15,21);
  doc.rect(margin,y,W-margin*2,7,'F');
  doc.setFont('helvetica','bold');
  doc.setFontSize(7);
  doc.setTextColor(120,120,160);
  let cx=margin+2;
  cols.forEach(c=>{doc.text(c.t,cx,y+5);cx+=c.w;});
  y+=9;

  // Table rows
  const sorted=[...trades].sort((a,b)=>new Date(b.date)-new Date(a.date));
  doc.setFont('helvetica','normal');
  doc.setFontSize(7.5);
  sorted.forEach((t,idx)=>{
    if(y>270){doc.addPage();y=16;}
    if(idx%2===0){doc.setFillColor(18,18,28);doc.rect(margin,y-3,W-margin*2,7,'F');}
    const pnlPos=t.pnl>=0;
    const ps=`${t.pnl>=0?'+':''}Rs.${Math.abs(t.pnl).toLocaleString('en-IN',{minimumFractionDigits:2})}`;
    const row=[t.date,t.symbol,t.setup||'—',`Rs.${t.entry}`,`Rs.${t.exit}`,String(t.qty),ps,t.rr||'—'];
    cx=margin+2;
    row.forEach((cell,ci)=>{
      if(ci===6){doc.setTextColor(pnlPos?0:220,pnlPos?200:50,pnlPos?100:80);}
      else doc.setTextColor(200,200,220);
      doc.text(String(cell),cx,y+2);
      cx+=cols[ci].w;
    });
    y+=7;
  });

  // Section: Setup Performance
  y+=8;
  if(y>250){doc.addPage();y=16;}
  doc.setFont('helvetica','bold');
  doc.setFontSize(9);
  doc.setTextColor(60,60,90);
  doc.text('SETUP PERFORMANCE',margin,y);
  y+=6;

  const smap={};
  trades.forEach(t=>{
    const k=t.setup||'Untagged';
    if(!smap[k])smap[k]={pnl:0,count:0,wins:0};
    smap[k].pnl+=t.pnl;smap[k].count++;
    if(t.pnl>0)smap[k].wins++;
  });
  Object.entries(smap).sort((a,b)=>b[1].pnl-a[1].pnl).forEach(([name,d])=>{
    if(y>270){doc.addPage();y=16;}
    const ps=`${d.pnl>=0?'+':''}Rs.${Math.abs(d.pnl).toLocaleString('en-IN',{minimumFractionDigits:2})}`;
    const wr=((d.wins/d.count)*100).toFixed(0);
    doc.setFillColor(20,20,32);
    doc.rect(margin,y-3,W-margin*2,8,'F');
    doc.setFont('helvetica','bold');doc.setFontSize(8);doc.setTextColor(200,200,220);
    doc.text(name,margin+3,y+2);
    doc.setFont('helvetica','normal');doc.setFontSize(8);
    doc.setTextColor(d.pnl>=0?0:220,d.pnl>=0?200:50,d.pnl>=0?100:80);
    doc.text(ps,margin+80,y+2);
    doc.setTextColor(120,120,160);
    doc.text(`${d.count} trades · ${wr}% win`,margin+120,y+2);
    y+=10;
  });

  // Footer
  const pages=doc.getNumberOfPages();
  for(let p=1;p<=pages;p++){
    doc.setPage(p);
    doc.setFillColor(20,20,32);
    doc.rect(0,287,W,10,'F');
    doc.setFont('helvetica','normal');doc.setFontSize(7);doc.setTextColor(60,60,90);
    doc.text('TRADELOG · PERSONAL TRADING JOURNAL',margin,293);
    doc.text(`Page ${p} of ${pages}`,W-margin,293,{align:'right'});
  }

  doc.save(`tradelog-report-${new Date().toISOString().split('T')[0]}.pdf`);
  toast('✓ PDF exported');
}

// ── GIST SYNC
async function saveGist(){
  const tok=document.getElementById('stok').value.trim();
  const gid=document.getElementById('sgid').value.trim();
  if(!tok||!gid)return toast('⚠ Enter both fields');
  localStorage.setItem('tl_tok',tok);localStorage.setItem('tl_gid',gid);
  toast('Testing connection...');
  try{
    const r=await fetch(`https://api.github.com/gists/${gid}`,{headers:{Authorization:`token ${tok}`,Accept:'application/vnd.github.v3+json'}});
    if(r.ok){
      gstat(true);toast('✓ Connected to GitHub Gist');
      const d=await r.json(),f=d.files['tradelog.json'];
      if(f&&f.content){const ld=JSON.parse(f.content);if(ld.trades&&ld.trades.length>trades.length){trades=ld.trades;localStorage.setItem('tl_t',JSON.stringify(trades));rd();rj();toast('↓ Trades synced');}}
    }else{gstat(false);toast('✕ Connection failed');}
  }catch{gstat(false);toast('✕ Network error');}
}

function gstat(ok){
  document.getElementById('gdot').className='gdot'+(ok?' on':'');
  document.getElementById('gtxt').textContent=ok?'Connected to GitHub Gist':'Not connected';
}

async function sync(){
  const tok=localStorage.getItem('tl_tok'),gid=localStorage.getItem('tl_gid');
  if(!tok||!gid)return;
  try{await fetch(`https://api.github.com/gists/${gid}`,{method:'PATCH',headers:{Authorization:`token ${tok}`,Accept:'application/vnd.github.v3+json','Content-Type':'application/json'},body:JSON.stringify({files:{'tradelog.json':{content:JSON.stringify({trades,updatedAt:new Date().toISOString()})}}})});}catch{}
}

function expJSON(){
  const b=new Blob([JSON.stringify({trades,exportedAt:new Date().toISOString()},null,2)],{type:'application/json'});
  const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=`tradelog-${new Date().toISOString().split('T')[0]}.json`;a.click();
}

function clr(){
  if(!confirm('Delete ALL trade data? Irreversible.'))return;
  trades=[];localStorage.removeItem('tl_t');rd();rj();toast('All data cleared');
}

// ── EMOTION vs P&L
function renderEmoPnL(){
  const EMOJIS={'Confident':'😊','Disciplined':'🎯','Nervous':'😰','FOMO':'😤','Revenge':'😡','Neutral':'😐'};
  const map={};
  trades.filter(t=>t.emotion).forEach(t=>{
    if(!map[t.emotion])map[t.emotion]={pnl:0,count:0};
    map[t.emotion].pnl+=t.pnl;
    map[t.emotion].count++;
  });
  const entries=Object.entries(map).sort((a,b)=>b[1].pnl-a[1].pnl);
  if(!entries.length){
    document.getElementById('emo-pnl-rows').innerHTML='<div class="otrade-empty">No emotions logged yet.<br>Add emotional state when logging trades.</div>';
    document.getElementById('emo-best-tag').textContent='—';
    return;
  }
  const maxAbs=Math.max(...entries.map(e=>Math.abs(e[1].pnl)));
  const best=entries[0];
  const bestTag=document.getElementById('emo-best-tag');
  bestTag.textContent=`BEST: ${best[0].toUpperCase()}`;
  bestTag.className=best[1].pnl>=0?'ins-tag ok':'ins-tag warn';

  document.getElementById('emo-pnl-rows').innerHTML=entries.map(([emo,d])=>{
    const pct=maxAbs>0?(Math.abs(d.pnl)/maxAbs)*100:0;
    const cls=d.pnl>=0?'pos':'neg';
    const ps=`${d.pnl>=0?'+':''}₹${Math.abs(d.pnl).toLocaleString('en-IN',{minimumFractionDigits:0})}`;
    const icon=EMOJIS[emo]||'•';
    return `<div class="emo-row">
      <div class="emo-icon">${icon}</div>
      <div class="emo-name">${emo}</div>
      <div class="emo-bar-wrap"><div class="emo-bar-fill ${cls}" style="width:${Math.max(pct,8)}%">${ps}</div></div>
      <div class="emo-trades">${d.count}T</div>
    </div>`;
  }).join('');
}

// ── GOOD vs BAD TRADE P&L SPLIT
function renderSplit(){
  const scored=trades.filter(t=>t.q&&t.q.scored);
  if(!scored.length){
    document.getElementById('split-good-pnl').textContent='₹0';
    document.getElementById('split-bad-pnl').textContent='₹0';
    document.getElementById('split-good-sub').textContent='0 trades scored';
    document.getElementById('split-bad-sub').textContent='0 trades scored';
    document.getElementById('split-banner').innerHTML='Score your trades to see how much rule violations are costing you.';
    document.getElementById('split-tag').textContent='RULES COST';
    document.getElementById('split-tag').className='ins-tag neutral';
    return;
  }

  const good=scored.filter(t=>qScore(t)>=3);
  const bad=scored.filter(t=>qScore(t)<3);
  const goodPnl=good.reduce((s,t)=>s+t.pnl,0);
  const badPnl=bad.reduce((s,t)=>s+t.pnl,0);

  const fmt=v=>`${v>=0?'+':''}₹${Math.abs(v).toLocaleString('en-IN',{minimumFractionDigits:0})}`;
  document.getElementById('split-good-pnl').textContent=fmt(goodPnl);
  document.getElementById('split-bad-pnl').textContent=fmt(badPnl);
  document.getElementById('split-good-sub').textContent=`${good.length} trades · avg ${good.length?fmt(goodPnl/good.length):'₹0'} per trade`;
  document.getElementById('split-bad-sub').textContent=`${bad.length} trades · avg ${bad.length?fmt(badPnl/bad.length):'₹0'} per trade`;

  const tag=document.getElementById('split-tag');
  const banner=document.getElementById('split-banner');

  if(bad.length===0){
    tag.textContent='100% DISCIPLINED ✓'; tag.className='ins-tag ok';
    banner.innerHTML='<strong>Perfect process.</strong> All scored trades followed ≥3/4 rules. Keep it up.';
  } else if(badPnl<0){
    const cost=Math.abs(badPnl);
    tag.textContent=`VIOLATIONS COST ₹${cost.toLocaleString('en-IN',{maximumFractionDigits:0})}`; tag.className='ins-tag warn';
    banner.innerHTML=`Rule violations cost you <strong>₹${cost.toLocaleString('en-IN',{minimumFractionDigits:0})}</strong> in losses across ${bad.length} bad trade${bad.length>1?'s':''}. If you had skipped them, your P&L would be higher.`;
  } else {
    tag.textContent='BAD TRADES PROFITABLE?'; tag.className='ins-tag warn';
    banner.innerHTML=`Bad trades made <strong style="color:var(--red)">₹${Math.abs(badPnl).toLocaleString('en-IN',{minimumFractionDigits:0})}</strong> — but don't be fooled. Profitable rule-breaking reinforces bad habits and will hurt you long term.`;
  }
}
function toggleQ(key){
  const cur=document.getElementById('f-q-'+key).value==='1';
  setQ(key,!cur);
  updateQPreview();
}

function setQ(key,val){
  document.getElementById('f-q-'+key).value=val?'1':'0';
  const el=document.getElementById('qc-'+key);
  const box=document.getElementById('qcb-'+key);
  if(val){el.classList.add('checked');box.textContent='✓';}
  else{el.classList.remove('checked');box.textContent='';}
}

function updateQPreview(){
  const keys=['setup','sizing','sl','structure'];
  const score=keys.reduce((s,k)=>s+(document.getElementById('f-q-'+k).value==='1'?1:0),0);
  const el=document.getElementById('qs-preview');
  el.textContent=`${score}/4`;
  el.className='quality-score-preview s'+score;
}

function qScore(t){
  if(!t.q||!t.q.scored) return -1;
  return (t.q.setup||0)+(t.q.sizing||0)+(t.q.sl||0)+(t.q.structure||0);
}

function qBadgeHTML(t){
  const s=qScore(t);
  if(s<0) return '<span class="qbadge qnone">—</span>';
  const labels={4:'A+ PROCESS',3:'GOOD',2:'MIXED',1:'POOR',0:'BROKE RULES'};
  const cls='q'+s;
  return `<span class="qbadge ${cls}">${labels[s]}</span>`;
}

function qVerdictHTML(t){
  const s=qScore(t);
  if(s<0) return '<div class="verdict unscored"><div class="verdict-icon">📋</div><div class="verdict-body"><div class="verdict-title">NOT SCORED</div><div class="verdict-sub">Edit this trade to add a quality score.</div></div></div>';
  const checks=['Followed Setup','Position Sizing','Respected SL','A+ Structure'];
  const keys=['setup','sizing','sl','structure'];
  const checkHTML=keys.map((k,i)=>{
    const pass=t.q[k];
    return `<span class="vc ${pass?'pass':'fail'}">${pass?'✓':'✗'} ${checks[i]}</span>`;
  }).join('');
  let cls,icon,title,sub;
  if(s===4){cls='good';icon='🏆';title='PERFECT EXECUTION';sub='You followed all 4 rules. This is a good trade regardless of outcome.';}
  else if(s===3){cls='good';icon='✅';title='GOOD TRADE';sub='Strong process. One rule missed — review which one and why.';}
  else if(s===2){cls='partial';icon='⚠️';title='MIXED EXECUTION';sub='Half the rules followed. Consistency here is critical for long-term edge.';}
  else if(s===1){cls='bad';icon='❌';title='POOR EXECUTION';sub='Almost all rules broken. This is a bad trade even if it won.';}
  else{cls='bad';icon='🚫';title='BROKE ALL RULES';sub='Zero process followed. If this won, it was luck — not skill.';}
  return `<div class="verdict ${cls}">
    <div class="verdict-icon">${icon}</div>
    <div class="verdict-body">
      <div class="verdict-title">${title}</div>
      <div class="verdict-sub">${sub}</div>
      <div class="verdict-checks">${checkHTML}</div>
    </div>
    <div class="verdict-score">${s}/4</div>
  </div>`;
}

// ── PSYCHOLOGY ANALYTICS
function renderPsychAnalytics(){
  const scored=trades.filter(t=>t.q&&t.q.scored);
  if(!scored.length){
    document.getElementById('ps-avg').textContent='—';
    document.getElementById('ps-good').textContent='0';
    document.getElementById('ps-bad').textContent='0';
    document.getElementById('ps-pct').textContent='0%';
    document.getElementById('psych-insights').innerHTML='Log trades with quality scores to see your psychology insights.';
    return;
  }
  const scores=scored.map(t=>qScore(t));
  const avg=(scores.reduce((a,b)=>a+b,0)/scores.length).toFixed(1);
  const good=scored.filter(t=>qScore(t)>=3).length;
  const bad=scored.filter(t=>qScore(t)<3).length;
  const pct=Math.round((good/scored.length)*100);
  document.getElementById('ps-avg').textContent=avg+'/4';
  document.getElementById('ps-avg').className='psych-num '+(parseFloat(avg)>=3?'g':parseFloat(avg)>=2?'gold':'r');
  document.getElementById('ps-good').textContent=good;
  document.getElementById('ps-bad').textContent=bad;
  document.getElementById('ps-pct').textContent=pct+'%';
  document.getElementById('ps-pct').className='psych-num '+(pct>=75?'g':pct>=50?'gold':'r');

  // Per-check adherence
  const checkKeys=['setup','sizing','sl','structure'];
  const checkNames=['Setup Rules','Position Sizing','Stop-Loss','A+ Structure'];
  const checkPct=checkKeys.map(k=>Math.round((scored.filter(t=>t.q[k]).length/scored.length)*100));

  // Good trade that lost vs Bad trade that won
  const goodLoss=trades.filter(t=>qScore(t)>=3&&t.pnl<0).length;
  const badWin=trades.filter(t=>qScore(t)<3&&t.q&&t.q.scored&&t.pnl>0).length;

  const weakest=checkNames[checkPct.indexOf(Math.min(...checkPct))];
  const strongest=checkNames[checkPct.indexOf(Math.max(...checkPct))];

  let html=`
    <span class="insight-good">✓ Process adherence: ${pct}%</span> &nbsp;·&nbsp; ${good} good trades, ${bad} bad trades out of ${scored.length} scored<br>
    <strong>Strongest rule:</strong> ${strongest} (${Math.max(...checkPct)}%) &nbsp;&nbsp;
    <strong>Weakest rule:</strong> <span class="insight-bad">${weakest} (${Math.min(...checkPct)}%)</span><br>
  `;
  if(goodLoss>0) html+=`<span class="insight-good">📊 ${goodLoss} good trade${goodLoss>1?'s':''} that lost</span> — process was right, outcome was unlucky. Stay the course.<br>`;
  if(badWin>0) html+=`<span class="insight-bad">⚠ ${badWin} bad trade${badWin>1?'s':''} that won</span> — do not let this reinforce bad habits.<br>`;
  if(pct<50) html+=`<span class="insight-bad">⚠ Your process adherence is below 50%. Focus on rules before focusing on P&amp;L.</span>`;
  else if(pct>=80) html+=`<span class="insight-good">🏆 Excellent discipline. Keep trusting the process.</span>`;

  document.getElementById('psych-insights').innerHTML=html;
}

let _tt;
function toast(msg){
  const el=document.getElementById('toast');el.textContent=msg;el.style.display='block';
  clearTimeout(_tt);_tt=setTimeout(()=>el.style.display='none',2800);
}
