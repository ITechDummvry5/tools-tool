// ═══════════════════════════════════
//  STATE
// ═══════════════════════════════════
let products = [];
let budget = 0;
let dailyLimit = 0;
let currentFilter = 'all';
let editingId = null;
let deletedProduct = null;
let groupByCategory = false;
let currentWeekKey = todayWeekKey();
let weekHistory = {}; // {weekKey: {products, budget}}
let toastTimer = null;

const catEmoji = {food:'🍚',home:'🧺',personal:'🧴',bills:'🧾',other:'📦'};
const catLabel  = {food:'Food',home:'Home',personal:'Personal',bills:'Bills',other:'Other'};

const iconLibrary = [
  'rice.png','kape.png','agahan.png','miryenda.png','ulam.png',
  'baon.png','bills.png','lazada.png','shopee.png','groceries.png',
  'tubig.png','egg.png','fastfooddelivery.png','gamot.png',
  'delata.png','gas.png','school.png','default.png'
];

// ═══════════════════════════════════
//  WEEK KEY
// ═══════════════════════════════════
function todayWeekKey(){
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day===0?-6:1);
  const monday = new Date(d.setDate(diff));
  return monday.toISOString().slice(0,10);
}
function weekLabel(key){
  const d = new Date(key+'T00:00:00');
  const end = new Date(d); end.setDate(end.getDate()+6);
  const fmt = dt => dt.toLocaleDateString('en-PH',{month:'short',day:'numeric'});
  return fmt(d)+' – '+fmt(end);
}

// ═══════════════════════════════════
//  ICON SEARCH
// ═══════════════════════════════════
function iconSearch(val){
  const suggestions=document.getElementById('iconSuggestions');
  const q=val.trim().toLowerCase();
  if(!q){suggestions.style.display='none';document.getElementById('imgPreviewWrap').style.display='none';return;}
  const matches=iconLibrary.filter(f=>f.toLowerCase().includes(q));
  if(!matches.length){suggestions.style.display='none';return;}
  suggestions.innerHTML=matches.map(f=>`
    <div onclick="selectIcon('${f}')" style="display:flex;align-items:center;gap:12px;padding:10px 14px;cursor:pointer;transition:background 0.15s;" onmouseover="this.style.background='#2c2c2e'" onmouseout="this.style.background='transparent'">
      <img src="icons/${f}" style="width:32px;height:32px;object-fit:contain;" onerror="this.style.opacity=0.2"/>
      <span style="font-size:13px;color:#fff;">${f}</span>
    </div>`).join('');
  suggestions.style.display='block';
}
function selectIcon(filename){
  document.getElementById('iconFile').value=filename;
  document.getElementById('iconSuggestions').style.display='none';
  const wrap=document.getElementById('imgPreviewWrap');
  const img=document.getElementById('imgPreview');
  img.src='icons/'+filename;
  img.onload=()=>{wrap.style.display='block';};
  img.onerror=()=>{wrap.style.display='none';};
}
document.addEventListener('click',e=>{
  if(!e.target.closest('#iconFile')&&!e.target.closest('#iconSuggestions')){
    const s=document.getElementById('iconSuggestions');
    if(s) s.style.display='none';
  }
});

// ═══════════════════════════════════
//  THEME
// ═══════════════════════════════════
function setTheme(mode){
  document.body.classList.toggle('light',mode==='light');
  document.getElementById('btnDark').classList.toggle('active',mode==='dark');
  document.getElementById('btnLight').classList.toggle('active',mode==='light');
  localStorage.setItem('mom_theme',mode);
}

// ═══════════════════════════════════
//  PERSIST / LOAD
// ═══════════════════════════════════
function persist(){
  try{
    weekHistory[currentWeekKey]={products:[...products],budget};
    localStorage.setItem('mom_weekHistory',JSON.stringify(weekHistory));
    localStorage.setItem('mom_currentWeek',currentWeekKey);
    localStorage.setItem('mom_dailyLimit',JSON.stringify(dailyLimit));
  }catch(e){}
}
function loadData(){
  try{
    const wh=localStorage.getItem('mom_weekHistory');
    const cw=localStorage.getItem('mom_currentWeek');
    const dl=localStorage.getItem('mom_dailyLimit');
    if(wh) weekHistory=JSON.parse(wh);
    if(cw) currentWeekKey=cw;
    if(dl) dailyLimit=JSON.parse(dl);
    // Migrate old data
    const oldP=localStorage.getItem('mom_products');
    const oldB=localStorage.getItem('mom_budget');
    if(oldP&&!wh){
      weekHistory[currentWeekKey]={products:JSON.parse(oldP),budget:JSON.parse(oldB)||0};
      localStorage.removeItem('mom_products');
      localStorage.removeItem('mom_budget');
    }
    loadWeek(currentWeekKey);
  }catch(e){loadWeek(currentWeekKey);}
}
function loadWeek(key){
  currentWeekKey=key;
  if(weekHistory[key]){
    products=[...weekHistory[key].products];
    budget=weekHistory[key].budget||0;
  } else {
    products=[];budget=0;
    weekHistory[key]={products:[],budget:0};
  }
}

// ═══════════════════════════════════
//  WEEK TABS
// ═══════════════════════════════════
function renderWeekTabs(){
  const container=document.getElementById('weekTabs');
  container.innerHTML='';
  const keys=Object.keys(weekHistory).sort().reverse();
  // Always show current week
  if(!keys.includes(todayWeekKey())) keys.unshift(todayWeekKey());
  keys.forEach(key=>{
    const btn=document.createElement('button');
    btn.className='week-tab'+(key===currentWeekKey?' active':'');
    btn.textContent=weekLabel(key);
    btn.onclick=()=>switchWeek(key);
    container.appendChild(btn);
  });
  const newBtn=document.createElement('button');
  newBtn.className='week-tab-new';
  newBtn.textContent='+ New week';
  newBtn.onclick=newWeek;
  container.appendChild(newBtn);
}
function switchWeek(key){
  persist();
  loadWeek(key);
  if(budget>0) document.getElementById('budgetInput').value=budget;
  else document.getElementById('budgetInput').value='';
  document.getElementById('weekLabel').textContent='Purchases – '+weekLabel(key);
  renderWeekTabs();renderRow();updateStats();updateBudgetBar();updateBreakdown();updateCallouts();drawSparkline();updateRecentAndStarred();
}
function newWeek(){
  persist();
  const newKey=todayWeekKey();
  if(!weekHistory[newKey]) weekHistory[newKey]={products:[],budget};
  switchWeek(newKey);
}

// ═══════════════════════════════════
//  MODAL
// ═══════════════════════════════════
function openModal(){document.getElementById('overlay').classList.add('open');}
function closeModal(){document.getElementById('overlay').classList.remove('open');resetForm();}
function resetForm(){
  ['productName','quantity','price','note','iconFile','priceMin','priceMax'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('category').value='food';
  document.getElementById('imgPreviewWrap').style.display='none';
  editingId=null;
  document.getElementById('modalTitle').textContent='Add product expense';
  document.getElementById('saveBtn').textContent='Save product';
}
function openEdit(id,e){
  e.stopPropagation();
  const p=products.find(x=>x.id===id);
  if(!p) return;
  editingId=id;
  document.getElementById('productName').value=p.name;
  document.getElementById('quantity').value=p.qty;
  document.getElementById('price').value=p.price;
  document.getElementById('category').value=p.cat;
  document.getElementById('note').value=p.note||'';
  document.getElementById('priceMin').value=p.priceMin||'';
  document.getElementById('priceMax').value=p.priceMax||'';
  if(p.imgURL){
    const filename=p.imgURL.replace('icons/','');
    document.getElementById('iconFile').value=filename;
    const wrap=document.getElementById('imgPreviewWrap');
    const img=document.getElementById('imgPreview');
    img.src=p.imgURL;
    img.onload=()=>{wrap.style.display='block';};
    img.onerror=()=>{wrap.style.display='none';};
  }
  document.getElementById('modalTitle').textContent='Edit product';
  document.getElementById('saveBtn').textContent='Update product';
  document.getElementById('overlay').classList.add('open');
}

// ═══════════════════════════════════
//  SAVE
// ═══════════════════════════════════
function saveProduct(){
  const name=document.getElementById('productName').value.trim();
  const qty=Number(document.getElementById('quantity').value)||1;
  const price=Number(document.getElementById('price').value)||0;
  const cat=document.getElementById('category').value;
  const note=document.getElementById('note').value;
  const iconFile=document.getElementById('iconFile').value.trim();
  const priceMin=Number(document.getElementById('priceMin').value)||null;
  const priceMax=Number(document.getElementById('priceMax').value)||null;
  if(!name) return;
  const imgURL=iconFile?'icons/'+iconFile:'';
  if(editingId){
    const idx=products.findIndex(x=>x.id===editingId);
    if(idx>-1) products[idx]={...products[idx],name,qty,price,cat,note,imgURL,priceMin,priceMax};
  } else {
    products.push({id:Date.now(),name,qty,price,cat,note,imgURL,checked:false,starred:false,priceMin,priceMax,addedAt:Date.now()});
    showToast('✅ Added "'+name+'"');
  }
  persist();renderRow();updateStats();updateBudgetBar();updateBreakdown();updateCallouts();drawSparkline();updateRecentAndStarred();closeModal();
}

// ═══════════════════════════════════
//  QUICK ADD FROM RECENT
// ═══════════════════════════════════
function updateRecentAndStarred(){
  // Recent: last 5 unique names from all weeks
  const allNames=[];
  Object.values(weekHistory).forEach(w=>{(w.products||[]).forEach(p=>{if(!allNames.find(x=>x.name===p.name)) allNames.push(p);});});
  const recent=allNames.slice(-8).reverse();
  const recentSec=document.getElementById('recentSection');
  const chipsEl=document.getElementById('recentChips');
  if(recent.length>0){
    recentSec.style.display='block';
    chipsEl.innerHTML=recent.map(p=>`
      <button class="recent-chip" onclick="quickAdd(${JSON.stringify({name:p.name,cat:p.cat,price:p.price,imgURL:p.imgURL||''}).replace(/"/g,'&quot;')})">
        ${catEmoji[p.cat]||'🛒'} ${p.name} <span style="color:var(--green);margin-left:4px;">₱${p.price}</span>
      </button>`).join('');
  } else { recentSec.style.display='none'; }

  // Starred
  const starred=products.filter(p=>p.starred);
  const starredSec=document.getElementById('starredSection');
  const starredRow=document.getElementById('starredRow');
  if(starred.length>0){
    starredSec.style.display='block';
    starredRow.innerHTML=starred.map(p=>`
      <button class="starred-chip" onclick="duplicateProduct(${p.id},null)">
        ⭐ ${p.name} · ₱${(p.qty*p.price).toFixed(0)}
      </button>`).join('');
  } else { starredSec.style.display='none'; }
}
function quickAdd(data){
  products.push({id:Date.now(),name:data.name,qty:1,price:data.price,cat:data.cat,note:'',imgURL:data.imgURL||'',checked:false,starred:false,addedAt:Date.now()});
  persist();renderRow();updateStats();updateBudgetBar();updateBreakdown();updateCallouts();drawSparkline();updateRecentAndStarred();
  showToast('✅ Quick-added "'+data.name+'"');
}

// ═══════════════════════════════════
//  RENDER
// ═══════════════════════════════════
function getSortedFiltered(){
  let list = currentFilter==='all' ? [...products] : products.filter(p=>p.cat===currentFilter);
  const q = (document.getElementById('searchBar')||{value:''}).value.trim().toLowerCase();
  if(q) list=list.filter(p=>p.name.toLowerCase().includes(q)||(p.note||'').toLowerCase().includes(q));
  const sort=(document.getElementById('sortSelect')||{value:'added'}).value;
  if(sort==='price-asc') list.sort((a,b)=>a.price-b.price);
  else if(sort==='price-desc') list.sort((a,b)=>b.price-a.price);
  else if(sort==='cat') list.sort((a,b)=>a.cat.localeCompare(b.cat));
  else list.sort((a,b)=>(a.addedAt||a.id)-(b.addedAt||b.id));
  return list;
}
function renderRow(){
  const row=document.getElementById('iconRow');
  row.innerHTML='';
  const filtered=getSortedFiltered();
  if(!filtered.length){
    const d=document.createElement('div');
    d.className='empty-state';d.id='emptyState';
    d.textContent=products.length===0?'No products yet — tap "Add Product" below to get started.':'No items match.';
    row.appendChild(d);return;
  }
  filtered.forEach(p=>{
    const item=document.createElement('div');
    item.className='icon-item'+(p.checked?' checked':'')+(p.starred?' starred':'');
    item.dataset.id=p.id;
    const imgHTML=p.imgURL
      ?`<img src="${p.imgURL}" alt="${p.name}" style="width:100%;height:100%;object-fit:contain;padding:8px;" onerror="this.style.display='none'"/>`
      :`<span style="font-size:32px">${catEmoji[p.cat]||'🛒'}</span>`;
    const priceRangeHTML=(p.priceMin||p.priceMax)
      ?`<div class="price-range">₱${p.priceMin||'?'}–₱${p.priceMax||'?'}</div>`:'';
    item.innerHTML=`
      <div class="icon-check-overlay">✓</div>
      <div class="star-badge" style="${p.starred?'display:flex':'display:none'}">⭐</div>
      <div class="icon-actions">
        <button class="btn-check" onclick="toggleCheck(${p.id},event)" title="Check off">✓</button>
        <button class="btn-dup" onclick="duplicateProduct(${p.id},event)" title="Duplicate">⊕</button>
        <button class="btn-star" onclick="toggleStar(${p.id},event)" title="Star">${p.starred?'★':'☆'}</button>
        <button class="btn-del" onclick="deleteProduct(${p.id},event)" title="Delete">✕</button>
      </div>
      <div class="icon-img">${imgHTML}</div>
      <div style="display:flex;justify-content:center;margin-bottom:6px;">
        <button onclick="openEdit(${p.id},event)" title="Edit product" style="background:none;border:none;cursor:pointer;width:28px;height:28px;padding:0;display:flex;align-items:center;justify-content:center;opacity:0.6;transition:opacity 0.2s,transform 0.15s;" onmouseover="this.style.opacity=1;this.style.transform='scale(1.15)'" onmouseout="this.style.opacity=0.6;this.style.transform='scale(1)'">
          <img src="icons/edit.png" style="width:22px;height:22px;object-fit:contain;" onerror="this.textContent='✏️';this.style.fontSize='18px'"/>
        </button>
      </div>
      <div class="icon-name">${p.name}</div>
      <div class="icon-sub">${p.qty} pcs</div>
      <div class="icon-price">₱${(p.qty*p.price).toFixed(2)}</div>
      ${priceRangeHTML}
      <div style="text-align:center"><span class="icon-cat cat-${p.cat}">${catLabel[p.cat]}</span></div>`;
    row.appendChild(item);
  });
}

// ═══════════════════════════════════
//  ACTIONS
// ═══════════════════════════════════
function toggleCheck(id,e){
  e.stopPropagation();
  const p=products.find(x=>x.id===id);if(p)p.checked=!p.checked;
  persist();renderRow();updateStats();
}
function toggleStar(id,e){
  e.stopPropagation();
  const p=products.find(x=>x.id===id);if(p)p.starred=!p.starred;
  persist();renderRow();updateRecentAndStarred();
  showToast(p.starred?'⭐ Starred "'+p.name+'"':'Unstarred "'+p.name+'"');
}
function duplicateProduct(id,e){
  if(e) e.stopPropagation();
  const p=products.find(x=>x.id===id);
  if(!p) return;
  const copy={...p,id:Date.now(),checked:false,addedAt:Date.now()};
  products.push(copy);
  persist();renderRow();updateStats();updateBudgetBar();updateBreakdown();updateCallouts();
  showToast('⊕ Duplicated "'+p.name+'"');
}
function deleteProduct(id,e){
  if(e) e.stopPropagation();
  const p=products.find(x=>x.id===id);
  deletedProduct={product:p,idx:products.indexOf(p)};
  products=products.filter(x=>x.id!==id);
  persist();renderRow();updateStats();updateBudgetBar();updateBreakdown();updateCallouts();drawSparkline();updateRecentAndStarred();
  showToast('🗑 Deleted "'+p.name+'"',true);
}
function undoDelete(){
  if(!deletedProduct) return;
  products.splice(deletedProduct.idx,0,deletedProduct.product);
  deletedProduct=null;
  persist();renderRow();updateStats();updateBudgetBar();updateBreakdown();updateCallouts();drawSparkline();updateRecentAndStarred();
  hideToast();
}
function clearAll(){
  if(!confirm('Clear all products for this week?')) return;
  products=[];
  persist();renderRow();updateStats();updateBudgetBar();updateBreakdown();updateCallouts();drawSparkline();updateRecentAndStarred();
}
function checkAll(){products.forEach(p=>p.checked=true);persist();renderRow();updateStats();}
function uncheckAll(){products.forEach(p=>p.checked=false);persist();renderRow();updateStats();}
function filterCat(cat,btn){
  currentFilter=cat;
  document.querySelectorAll('.filter-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');renderRow();
}

// ═══════════════════════════════════
//  STATS
// ═══════════════════════════════════
function updateStats(){
  const total=products.reduce((s,p)=>s+p.qty*p.price,0);
  const checked=products.filter(p=>p.checked).length;
  document.getElementById('statTotal').textContent='₱'+total.toFixed(2);
  document.getElementById('statCount').textContent=products.length;
  document.getElementById('statChecked').textContent=checked;
  if(budget>0){
    const left=budget-total;
    const el=document.getElementById('statLeft');
    el.textContent='₱'+Math.abs(left).toFixed(2)+(left<0?' over':'');
    el.className='stat-value '+(left<0?'red':left<budget*0.2?'amber':'green');
  } else {
    document.getElementById('statLeft').textContent='—';
    document.getElementById('statLeft').className='stat-value';
  }
if (dailyLimit > 0) {
  const todaySpend = products
    .filter(p => {
      const d = new Date(p.addedAt || 0);
      const today = new Date();
      return d.toDateString() === today.toDateString();
    })
    .reduce((s, p) => s + p.qty * p.price, 0);

  const remaining = dailyLimit - todaySpend;

  // Split into two
  document.getElementById('dailySpent').textContent =
    `Daily: ₱${todaySpend.toFixed(2)} spent`;

  document.getElementById('dailyRemaining').textContent =
    `₱${Math.abs(remaining).toFixed(2)} ${remaining < 0 ? 'OVER' : 'left'}`;

  // Color only applies to remaining
  document.getElementById('dailyRemaining').style.color =
    remaining < 0
      ? 'var(--red)'
      : remaining < dailyLimit * 0.2
      ? 'var(--amber)'
      : 'var(--green)';
}
  // Budget alert at 80%
  if(budget>0){
    const pct=(total/budget)*100;
    if(pct>=80&&pct<100) showToast('⚠️ 80% of budget used!');
  }
}
function updateCallouts(){
  if(!products.length){
    document.getElementById('calloutCheap').textContent='—';
    document.getElementById('calloutExp').textContent='—';
    return;
  }
  const byUnit=products.map(p=>({name:p.name,price:p.price}));
  byUnit.sort((a,b)=>a.price-b.price);
  document.getElementById('calloutCheap').textContent=byUnit[0].name+' (₱'+byUnit[0].price+')';
  document.getElementById('calloutExp').textContent=byUnit[byUnit.length-1].name+' (₱'+byUnit[byUnit.length-1].price+')';
}

// ═══════════════════════════════════
//  BUDGET
// ═══════════════════════════════════
function setBudget(){budget=Number(document.getElementById('budgetInput').value)||0;persist();updateBudgetBar();updateStats();}
function resetBudget(){budget=0;document.getElementById('budgetInput').value='';persist();updateBudgetBar();updateStats();}
function addBudget(){const extra=Number(prompt('Add extra budget amount (₱):'));if(!extra||extra<=0)return;budget+=extra;document.getElementById('budgetInput').value=budget;persist();updateBudgetBar();updateStats();}
function updateBudgetBar(){
  const total=products.reduce((s,p)=>s+p.qty*p.price,0);
  const fill=document.getElementById('budgetFill');
  const pct=document.getElementById('budgetPct');
  if(!budget){fill.style.width='0%';pct.textContent='—';return;}
  const p=Math.min((total/budget)*100,100);
  fill.style.width=p+'%';
  fill.className='budget-fill'+(p>=100?' over':p>=80?' warn':'');
  pct.textContent=Math.round(p)+'% used';
}
function setDailyLimit(){
  dailyLimit=Number(document.getElementById('dailyLimitInput').value)||0;
  persist();updateStats();
  showToast('Daily limit set to ₱'+dailyLimit);
}

// ═══════════════════════════════════
//  BREAKDOWN
// ═══════════════════════════════════
function updateBreakdown(){
  const total=products.reduce((s,p)=>s+p.qty*p.price,0)||1;
  const cats={food:0,home:0,personal:0,bills:0,other:0};
  products.forEach(p=>{cats[p.cat]+=(p.qty*p.price);});
  ['food','home','personal','bills','other'].forEach(c=>{
    const pct=(cats[c]/total)*100;
    const key=c.charAt(0).toUpperCase()+c.slice(1);
    document.getElementById('bar'+key).style.width=pct+'%';
    document.getElementById('amt'+key).textContent='₱'+cats[c].toFixed(0);
  });
}

// ═══════════════════════════════════
//  SPARKLINE
// ═══════════════════════════════════
function drawSparkline(){
  const canvas=document.getElementById('sparkCanvas');
  if(!canvas) return;
  const dpr=window.devicePixelRatio||1;
  const W=canvas.offsetWidth||canvas.parentElement.offsetWidth||600;
  const H=60;
  canvas.width=W*dpr; canvas.height=H*dpr;
  canvas.style.width=W+'px'; canvas.style.height=H+'px';
  const ctx=canvas.getContext('2d');
  ctx.scale(dpr,dpr);

  // Collect weekly totals: last 8 weeks
  const keys=Object.keys(weekHistory).sort();
  const vals=keys.map(k=>(weekHistory[k].products||[]).reduce((s,p)=>s+p.qty*p.price,0));
  if(vals.length<2){ctx.clearRect(0,0,W,H);return;}
  const max=Math.max(...vals)||1;
  const pts=vals.map((v,i)=>({x:(i/(vals.length-1))*(W-20)+10,y:H-10-(v/max)*(H-20)}));

  ctx.clearRect(0,0,W,H);
  // Fill
  const grad=ctx.createLinearGradient(0,0,0,H);
  grad.addColorStop(0,'rgba(41,151,255,0.28)');
  grad.addColorStop(1,'rgba(41,151,255,0)');
  ctx.beginPath();
  ctx.moveTo(pts[0].x,H);
  pts.forEach(p=>ctx.lineTo(p.x,p.y));
  ctx.lineTo(pts[pts.length-1].x,H);
  ctx.closePath();
  ctx.fillStyle=grad;ctx.fill();
  // Line
  ctx.beginPath();
  pts.forEach((p,i)=>i===0?ctx.moveTo(p.x,p.y):ctx.lineTo(p.x,p.y));
  ctx.strokeStyle='#2997ff';ctx.lineWidth=2;ctx.lineJoin='round';ctx.stroke();
  // Dots
  pts.forEach((p,i)=>{
    ctx.beginPath();ctx.arc(p.x,p.y,3,0,Math.PI*2);
    ctx.fillStyle=i===pts.length-1?'#2997ff':'rgba(41,151,255,0.5)';ctx.fill();
  });
  // Labels
  ctx.font='10px DM Sans,sans-serif';ctx.fillStyle='rgba(255,255,255,0.4)';ctx.textAlign='center';
  keys.forEach((k,i)=>{
    const p=pts[i];
    const label=k.slice(5); // MM-DD
    ctx.fillText(label,p.x,H-1);
  });
}

// ═══════════════════════════════════
//  RECEIPT
// ═══════════════════════════════════
function toggleReceipt(){
  const el=document.getElementById('receiptPreview');
  if(el.style.display==='none'||!el.style.display){buildReceipt();el.style.display='block';}
  else el.style.display='none';
}
function buildReceipt(){
  const total=products.reduce((s,p)=>s+p.qty*p.price,0);
  const store=document.getElementById('storeNameInput').value;
  const loc=document.getElementById('storeLocInput').value;
  document.getElementById('receiptMeta').textContent=
    'Generated: '+new Date().toLocaleDateString('en-PH',{weekday:'long',year:'numeric',month:'long',day:'numeric'})
    +(store?' · '+store:'')+(loc?' · '+loc:'');

  let html='';
  if(groupByCategory){
    document.getElementById('groupBtn').style.background='rgba(41,151,255,0.15)';
    document.getElementById('groupBtn').style.color='var(--blue)';
    const cats={food:[],home:[],personal:[],bills:[],other:[]};
    products.forEach(p=>cats[p.cat].push(p));
    Object.entries(cats).forEach(([cat,items])=>{
      if(!items.length) return;
      const catTotal=items.reduce((s,p)=>s+p.qty*p.price,0);
      html+=`<div class="receipt-cat-group"><div class="receipt-cat-label">${catEmoji[cat]} ${catLabel[cat]} — ₱${catTotal.toFixed(2)}</div>
        <table><thead><tr><th>Item</th><th>Qty</th><th>Subtotal</th></tr></thead><tbody>
        ${items.map(p=>`<tr><td>${p.name}</td><td>${p.qty}</td><td>₱${(p.qty*p.price).toFixed(2)}</td></tr>`).join('')}
        </tbody></table></div>`;
    });
  } else {
    document.getElementById('groupBtn').style.background='';
    document.getElementById('groupBtn').style.color='';
    html=`<table><thead><tr><th>Item</th><th>Qty</th><th>Category</th><th>Subtotal</th></tr></thead>
      <tbody>${products.map(p=>`<tr><td>${p.name}</td><td>${p.qty}</td><td>${catLabel[p.cat]}</td><td>₱${(p.qty*p.price).toFixed(2)}</td></tr>`).join('')}</tbody></table>`;
  }
  html+=`<div class="receipt-total"><span>Total</span><span>₱${total.toFixed(2)}</span></div>`;
  document.getElementById('receiptContent').innerHTML=html;
}
function printReceipt(){buildReceipt();document.getElementById('receiptPreview').style.display='block';window.print();}

// ═══════════════════════════════════
//  EXPORT / IMPORT
// ═══════════════════════════════════
function exportJSON(){
  const data={week:currentWeekKey,budget,products};
  download('mom_expenses_'+currentWeekKey+'.json',JSON.stringify(data,null,2),'application/json');
}
function download(filename,content,type){
  const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([content],{type}));
  a.download=filename;a.click();
}
function openImport(){document.getElementById('importModal').classList.add('open');}
function closeImport(){document.getElementById('importModal').classList.remove('open');}
function doImport(){
  try{
    const text=document.getElementById('importText').value.trim();
    let parsed=JSON.parse(text);
    if(Array.isArray(parsed)){products=[...parsed];}
    else if(parsed.products){products=[...parsed.products];if(parsed.budget) budget=parsed.budget;}
    else throw new Error('Unknown format');
    persist();renderRow();updateStats();updateBudgetBar();updateBreakdown();updateCallouts();drawSparkline();updateRecentAndStarred();
    closeImport();showToast('✅ Import successful!');
  }catch(e){alert('Import failed: '+e.message);}
}

// ═══════════════════════════════════
//  TOAST
// ═══════════════════════════════════
function showToast(msg, withUndo=false){
  clearTimeout(toastTimer);
  document.getElementById('toastMsg').textContent=msg;
  const undoBtn=document.getElementById('toastUndoBtn');
  undoBtn.style.display=withUndo?'inline':'none';
  document.getElementById('toast').classList.add('show');
  toastTimer=setTimeout(hideToast,3200);
}
function hideToast(){document.getElementById('toast').classList.remove('show');}

// ═══════════════════════════════════
//  SCROLL
// ═══════════════════════════════════
function scrollLeft(){document.getElementById('iconRow').scrollBy({left:-260,behavior:'smooth'});}
function scrollRight(){document.getElementById('iconRow').scrollBy({left:260,behavior:'smooth'});}

// ── OVERLAY CLOSE ──
document.getElementById('overlay').addEventListener('click',function(e){if(e.target===this)closeModal();});
document.getElementById('importModal').addEventListener('click',function(e){if(e.target===this)closeImport();});

// ═══════════════════════════════════
//  BOOT
// ═══════════════════════════════════
if(localStorage.getItem('mom_seen')){
  document.getElementById('dedication').style.display='none';
} else {
  localStorage.setItem('mom_seen','1');
  setTimeout(()=>{document.getElementById('dedication').style.display='none';},4400);
}

loadData();
const savedTheme=localStorage.getItem('mom_theme')||'dark';
setTheme(savedTheme);
if(budget>0) document.getElementById('budgetInput').value=budget;
if(dailyLimit>0) document.getElementById('dailyLimitInput').value=dailyLimit;

renderWeekTabs();
document.getElementById('weekLabel').textContent='Purchases – '+weekLabel(currentWeekKey);
renderRow();updateStats();updateBudgetBar();updateBreakdown();updateCallouts();updateRecentAndStarred();

// Draw sparkline after layout
setTimeout(drawSparkline,100);
window.addEventListener('resize',drawSparkline);
