const COLORS={
  blue:'#2563b0',pink:'#c0335a',green:'#1a7a4a',orange:'#c05a10',
  purple:'#5a2da0',teal:'#0f7070',gray:'#3a3f5c',cyan:'#0a6080',red:'#8b1a1a'
};
const ACCENT_COLORS=[
  {k:'blue',v:'#4f7ef8'},{k:'pink',v:'#e84d7c'},{k:'green',v:'#3ab86a'},
  {k:'orange',v:'#f07830'},{k:'purple',v:'#8b5cf6'},{k:'teal',v:'#2cc4b0'},
  {k:'gray',v:'#888faa'},{k:'cyan',v:'#22b8d4'},{k:'red',v:'#e84d4d'}
];
const CONN_COLORS=['#4f7ef8','#e84d7c','#3ab86a','#f07830','#8b5cf6','#2cc4b0','#f0b86a','#e84d4d','#4db8e8','#b06af0'];

const CARD_TYPES=[
  {id:'hero',    name:'Hero Banner',    desc:'Full-width header with image preview',    hasUrl:false,hasPrice:false},
  {id:'label',   name:'Section Label',  desc:'Bold colored label for category headers', hasUrl:false,hasPrice:false},
  {id:'page',    name:'Page Card',      desc:'Page mockup with header strip & lines',   hasUrl:false,hasPrice:false},
  {id:'action',  name:'Action Card',    desc:'Form rows with a submit button',          hasUrl:false,hasPrice:false},
  {id:'ext',     name:'External Link',  desc:'Compact URL card with arrow button',      hasUrl:true, hasPrice:false},
  {id:'media',   name:'Media / Gallery',desc:'Grid of image thumbnails + caption',      hasUrl:false,hasPrice:false},
  {id:'form',    name:'Form Card',      desc:'Multi-field contact/data form',           hasUrl:false,hasPrice:false},
  {id:'data',    name:'Data Card',      desc:'Stats, charts, analytics & CRUD records', hasUrl:false,hasPrice:false},
  {id:'payment', name:'Payment Card',   desc:'Pricing, checkout, billing & plans',      hasUrl:false,hasPrice:true},
];

let nodes={}, conns=[], nid=1, cid=1;
let px=80,py=60,zoom=1;
let panning=false,panStart={x:0,y:0};
let dragging=null,dragOff={x:0,y:0};
let selNode=null;
let pendingPos={x:200,y:100};
let selType='hero',selColor='blue';
let panelOpen=true;
let newConnColor=CONN_COLORS[0];

const wrap=document.getElementById('wrap');
const cvs=document.getElementById('cvs');
const svg=document.getElementById('svg');
const gc=document.getElementById('grid');
const modalBg=document.getElementById('modal-bg');
const cardGrid=document.getElementById('card-grid');
const colorRow=document.getElementById('color-row');
const fTitle=document.getElementById('f-title');
const fDesc=document.getElementById('f-desc');
const fUrl=document.getElementById('f-url');
const fUrlRow=document.getElementById('f-url-row');
const fPrice=document.getElementById('f-price');
const fPriceRow=document.getElementById('f-price-row');
const connPanel=document.getElementById('conn-panel');
const cpBody=document.getElementById('cp-body');
const cpEmpty=document.getElementById('cp-empty');
const cpFromSel=document.getElementById('cp-from-sel');

// ---- GRID ----
function drawGrid(){
  const w=wrap.clientWidth,h=wrap.clientHeight;
  gc.width=w;gc.height=h;
  const c=gc.getContext('2d');
  c.clearRect(0,0,w,h);
  const step=30*zoom,ox=px%step,oy=py%step;
  c.strokeStyle='rgba(255,255,255,0.04)';c.lineWidth=1;
  for(let x=ox;x<w;x+=step){c.beginPath();c.moveTo(x,0);c.lineTo(x,h);c.stroke();}
  for(let y=oy;y<h;y+=step){c.beginPath();c.moveTo(0,y);c.lineTo(w,y);c.stroke();}
}
function applyT(){
  cvs.style.transform=`translate(${px}px,${py}px) scale(${zoom})`;
  document.getElementById('zoom-lbl').textContent=Math.round(zoom*100)+'%';
  drawGrid();renderSVG();
}
function nodeCenter(id){
  const n=nodes[id];if(!n)return null;
  const el=document.getElementById('n'+id);
  const w=el?el.offsetWidth:170,h=el?el.offsetHeight:120;
  return{x:(n.x+w/2)*zoom+px,y:(n.y+h/2)*zoom+py};
}

// ---- CARD BUILDERS ----
function esc(s){return(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;')}

function buildCard(n){
  const col=n.color||'blue';
  const hex=COLORS[col]||'#2563b0';
  const acHex=ACCENT_COLORS.find(a=>a.k===col)?.v||'#4f7ef8';
  const title=n.title||'Untitled';
  const desc=n.desc||'Description';

  if(n.type==='hero'){
    return`<div class="c-hero" style="border-top:3px solid ${acHex}">
      <div class="c-head">
        <div class="c-head-title">${esc(title)}</div>
        <div class="c-badge">HOME</div>
      </div>
      <div class="c-body">
        <div class="c-img" style="background:${hex}22"><span style="font-size:18px;opacity:.4">🖼</span></div>
        <div class="c-title-text" contenteditable data-id="${n.id}" data-field="title">${esc(title)}</div>
        <div class="c-desc" contenteditable data-id="${n.id}" data-field="desc">${esc(desc)}</div>
      </div>
    </div>`;
  }
  if(n.type==='label'){
    return`<div class="c-label" style="background:${hex}">
      <div class="c-label-text" contenteditable data-id="${n.id}" data-field="title">${esc(title)}</div>
    </div>`;
  }
  if(n.type==='page'){
    return`<div class="c-page" style="border-top:3px solid ${acHex}">
      <div class="c-page-head"><div class="c-page-title" contenteditable data-id="${n.id}" data-field="title">${esc(title)}</div></div>
      <div class="c-page-body">
        <div class="c-page-img" style="background:${hex}"></div>
        <div class="c-page-line" style="width:90%;background:${acHex}55"></div>
        <div class="c-page-line" style="width:70%"></div>
        <div class="c-page-line" style="width:80%"></div>
        <div style="font-size:9px;color:var(--text3);margin-top:4px;line-height:1.4" contenteditable data-id="${n.id}" data-field="desc">${esc(desc)}</div>
      </div>
      <div class="c-page-footer">
        <div style="height:12px;background:${acHex};border-radius:3px;width:60px;display:inline-flex;align-items:center;justify-content:center"><span style="font-size:7px;color:#fff;font-weight:700">→</span></div>
      </div>
    </div>`;
  }
  if(n.type==='action'){
    return`<div class="c-action" style="border-top:3px solid ${acHex}">
      <div class="c-action-head">
        <div class="c-action-icon" style="background:${acHex}22"><span style="font-size:11px">⚡</span></div>
        <div class="c-action-title" contenteditable data-id="${n.id}" data-field="title">${esc(title)}</div>
      </div>
      <div class="c-action-body">
        ${[0,1,2].map(()=>`<div class="c-action-row"><div class="c-action-input"></div><div class="c-action-x"></div></div>`).join('')}
      </div>
      <div class="c-action-btn" style="background:${acHex}" contenteditable data-id="${n.id}" data-field="desc">${esc(desc||'Submit')}</div>
    </div>`;
  }
  if(n.type==='ext'){
    const url=n.url||'www.example.com';
    return`<div class="c-ext" style="border-top:3px solid ${acHex}">
      <div class="c-ext-label" contenteditable data-id="${n.id}" data-field="title">${esc(title)}</div>
      <div class="c-ext-row">
        <span class="c-ext-url" contenteditable data-id="${n.id}" data-field="url">${esc(url)}</span>
        <div class="c-ext-arrow" style="background:${acHex}">→</div>
      </div>
    </div>`;
  }
  if(n.type==='media'){
    const cells=[hex+'cc',acHex+'88',hex+'99',acHex+'66','#3a3f5c',hex+'aa'];
    return`<div class="c-media" style="border-top:3px solid ${acHex}">
      <div class="c-media-head"><div class="c-media-title" contenteditable data-id="${n.id}" data-field="title">${esc(title)}</div></div>
      <div class="c-media-grid">${cells.map(c=>`<div class="c-media-cell" style="background:${c}"></div>`).join('')}</div>
      <div class="c-media-lines">
        <div class="c-media-line" style="background:${acHex}55;width:80%"></div>
        <div class="c-media-line" style="background:var(--bg3);width:60%"></div>
        <div style="font-size:9px;color:var(--text3);margin-top:3px" contenteditable data-id="${n.id}" data-field="desc">${esc(desc)}</div>
      </div>
    </div>`;
  }
  if(n.type==='form'){
    return`<div class="c-form" style="border-top:3px solid ${acHex}">
      <div class="c-form-head"><div class="c-form-title" contenteditable data-id="${n.id}" data-field="title">${esc(title)}</div></div>
      <div class="c-form-body">
        ${['Name','Email','Message'].map((l,i)=>`
          <div class="c-form-field">
            <div class="c-form-lbl">${l}</div>
            <div class="c-form-inp${i===2?' tall':''}"></div>
          </div>`).join('')}
      </div>
      <div class="c-form-submit" style="background:${acHex}" contenteditable data-id="${n.id}" data-field="desc">${esc(desc||'Send Message')}</div>
    </div>`;
  }
  if(n.type==='data'){
    const rows=[
      {label:'Sessions',pct:78,val:'78%'},
      {label:'Bounce',pct:42,val:'42%'},
      {label:'Conv.',pct:61,val:'61%'},
    ];
    return`<div class="c-data" style="border-top:3px solid ${acHex}">
      <div class="c-data-head">
        <div class="c-data-title" contenteditable data-id="${n.id}" data-field="title">${esc(title)}</div>
        <div class="c-data-tag" style="background:${acHex}22;color:${acHex}">LIVE</div>
      </div>
      <div class="c-data-stats">
        <div class="c-data-stat"><div class="c-data-stat-val" style="color:${acHex}">2.4k</div><div class="c-data-stat-lbl">Records</div></div>
        <div class="c-data-stat"><div class="c-data-stat-val" style="color:#3ab86a">↑12%</div><div class="c-data-stat-lbl">Growth</div></div>
      </div>
      <div class="c-data-rows">
        ${rows.map(r=>`<div class="c-data-row">
          <div class="c-data-row-label">${r.label}</div>
          <div class="c-data-row-bar"><div class="c-data-row-fill" style="width:${r.pct}%;background:${acHex}88"></div></div>
          <div class="c-data-row-val">${r.val}</div>
        </div>`).join('')}
      </div>
      <div class="c-data-footer">
        <div class="c-data-badge" style="background:${acHex}22;color:${acHex}">CRUD</div>
        <div class="c-data-badge" style="background:#3ab86a22;color:#3ab86a">Charts</div>
        <div style="margin-left:auto;font-size:8px;color:var(--text3)">Updated now</div>
      </div>
    </div>`;
  }
  if(n.type==='payment'){
    const price=n.price||'$29';
    return`<div class="c-pay" style="border-top:3px solid ${acHex}">
      <div class="c-pay-head">
        <div class="c-pay-title" contenteditable data-id="${n.id}" data-field="title">${esc(title)}</div>
        <div class="c-pay-icon">💳</div>
      </div>
      <div class="c-pay-amount">
        <div class="c-pay-price" style="color:${acHex}" contenteditable data-id="${n.id}" data-field="price">${esc(price)}</div>
        <div class="c-pay-per">per month · billed annually</div>
      </div>
      <div class="c-pay-features">
        ${['Unlimited access','Priority support','Custom domain'].map(f=>`
          <div class="c-pay-feat">
            <div class="c-pay-check" style="background:${acHex}">✓</div>
            <span>${f}</span>
          </div>`).join('')}
      </div>
      <div class="c-pay-btn" style="background:${acHex}" contenteditable data-id="${n.id}" data-field="desc">${esc(desc||'Get Started')}</div>
      <div class="c-pay-card-row">
        <div class="c-pay-card">VISA</div>
        <div class="c-pay-card">MC</div>
        <div class="c-pay-card">AMEX</div>
        <div style="flex:1"></div>
        <div style="font-size:8px;color:var(--text3)">🔒 Secure</div>
      </div>
    </div>`;
  }
  return`<div style="width:160px;padding:12px;background:var(--bg2);border:1px solid var(--border);border-radius:var(--radius)"><div style="font-size:12px;font-weight:600">${esc(title)}</div></div>`;
}

// ---- RENDER NODE ----
function renderNode(n){
  let el=document.getElementById('n'+n.id);
  const isNew=!el;
  if(isNew){el=document.createElement('div');el.id='n'+n.id;el.className='node';cvs.appendChild(el);}
  el.style.left=n.x+'px';el.style.top=n.y+'px';
  el.innerHTML=buildCard(n)+`<div class="del-btn" data-del="${n.id}">✕</div>`;
  if(isNew){el.style.opacity='0';el.style.transform='scale(.85)';requestAnimationFrame(()=>{el.style.transition='opacity .2s,transform .2s';el.style.opacity='1';el.style.transform='scale(1)';setTimeout(()=>el.style.transition='',250)});}
}
function renderAll(){Object.values(nodes).forEach(renderNode);}

// ---- SVG ----
function renderSVG(){
  const W=wrap.clientWidth,H=wrap.clientHeight;
  svg.setAttribute('width',W);svg.setAttribute('height',H);
  svg.setAttribute('viewBox',`0 0 ${W} ${H}`);
  svg.innerHTML='';
  const defs=document.createElementNS('http://www.w3.org/2000/svg','defs');
  conns.forEach(c=>{
    const m=document.createElementNS('http://www.w3.org/2000/svg','marker');
    m.setAttribute('id','m'+c.id);m.setAttribute('viewBox','0 0 10 10');
    m.setAttribute('refX','9');m.setAttribute('refY','5');
    m.setAttribute('markerWidth','7');m.setAttribute('markerHeight','7');
    m.setAttribute('orient','auto-start-reverse');
    const p=document.createElementNS('http://www.w3.org/2000/svg','path');
    p.setAttribute('d','M1,1 L9,5 L1,9 Z');p.setAttribute('fill',c.color);
    m.appendChild(p);defs.appendChild(m);
  });
  svg.appendChild(defs);
  conns.forEach(c=>{
    const a=nodeCenter(c.from),b=nodeCenter(c.to);
    if(!a||!b)return;
    const dx=b.x-a.x,dy=b.y-a.y;
    const cx1=a.x+dx*0.5-dy*0.05,cy1=a.y+dy*0.5+dx*0.05;
    const cx2=b.x-dx*0.15,cy2=b.y-dy*0.15;
    const d=`M ${a.x} ${a.y} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${b.x} ${b.y}`;
    const hit=document.createElementNS('http://www.w3.org/2000/svg','path');
    hit.setAttribute('d',d);hit.setAttribute('fill','none');
    hit.setAttribute('stroke','transparent');hit.setAttribute('stroke-width','18');
    hit.style.pointerEvents='stroke';hit.style.cursor='pointer';
    hit.addEventListener('dblclick',()=>{conns=conns.filter(x=>x.id!==c.id);renderSVG();renderConnPanel();});
    svg.appendChild(hit);
    const line=document.createElementNS('http://www.w3.org/2000/svg','path');
    line.setAttribute('d',d);line.setAttribute('fill','none');
    line.setAttribute('stroke',c.color);line.setAttribute('stroke-width','2');
    line.setAttribute('stroke-linecap','round');line.setAttribute('marker-end','url(#m'+c.id+')');
    line.style.pointerEvents='none';svg.appendChild(line);
    if(c.label){
      const mx=(a.x+b.x)/2,my=(a.y+b.y)/2;
      // Check if a reverse connection with a label also exists — if so, offset perpendicularly
      const hasReverse=conns.some(r=>r.id!==c.id&&r.from===c.to&&r.to===c.from&&r.label);
      const dx=b.x-a.x, dy=b.y-a.y;
      const len=Math.sqrt(dx*dx+dy*dy)||1;
      // perpendicular unit vector
      const nx=-dy/len, ny=dx/len;
      const offset=hasReverse?14:0;
      const lx=mx+nx*offset, ly=my+ny*offset;
      const lw=Math.min(c.label.length*6+16,90);
      const bg=document.createElementNS('http://www.w3.org/2000/svg','rect');
      bg.setAttribute('x',lx-lw/2);bg.setAttribute('y',ly-9);
      bg.setAttribute('width',lw);bg.setAttribute('height',18);
      bg.setAttribute('rx','6');bg.setAttribute('fill','#1e2130');
      bg.setAttribute('stroke',c.color);bg.setAttribute('stroke-width','1.5');
      bg.style.pointerEvents='none';
      const txt=document.createElementNS('http://www.w3.org/2000/svg','text');
      txt.setAttribute('x',lx);txt.setAttribute('y',ly+5);
      txt.setAttribute('text-anchor','middle');txt.setAttribute('fill',c.color);
      txt.setAttribute('font-size','9');txt.setAttribute('font-family','Inter,sans-serif');
      txt.setAttribute('font-weight','600');
      txt.textContent=c.label.length>14?c.label.slice(0,14)+'…':c.label;
      txt.style.pointerEvents='none';
      svg.appendChild(bg);svg.appendChild(txt);
    }
  });
}

// ---- CONNECTIONS PANEL ----
const cpToSection=document.getElementById('cp-to-section');
const cpToList=document.getElementById('cp-to-list');
const cpAddLabelInp=document.getElementById('cp-add-label-inp');
const cpAddBtn=document.getElementById('cp-add-btn');
const cpConnDots=document.getElementById('cp-conn-dots');

// checked set of "to" node ids
let checkedTo=new Set();

function buildNewConnDots(){
  cpConnDots.innerHTML=CONN_COLORS.map(col=>
    `<div class="cpn-dot${col===newConnColor?' sel':''}" style="background:${col}" data-col="${col}"></div>`
  ).join('');
  cpConnDots.querySelectorAll('.cpn-dot').forEach(d=>{
    d.addEventListener('click',e=>{
      newConnColor=e.target.dataset.col;
      cpConnDots.querySelectorAll('.cpn-dot').forEach(x=>x.classList.remove('sel'));
      e.target.classList.add('sel');
    });
  });
}

function populateFromSelect(){
  const cur=cpFromSel.value;
  cpFromSel.innerHTML='<option value="">Choose a card…</option>';
  Object.values(nodes).forEach(n=>{
    const o=document.createElement('option');
    o.value=n.id;
    o.textContent=(n.title||'Untitled');
    if(n.id===cur)o.selected=true;
    cpFromSel.appendChild(o);
  });
}

function buildToList(){
  const fromId=cpFromSel.value;
  cpToList.innerHTML='';
  checkedTo.clear();

  if(!fromId){cpToSection.style.display='none';cpAddBtn.disabled=true;return;}
  cpToSection.style.display='block';

  const otherNodes=Object.values(nodes).filter(n=>n.id!==fromId);
  if(otherNodes.length===0){
    cpToList.innerHTML='<div style="font-size:11px;color:var(--text3);padding:4px 0">No other cards yet.</div>';
    cpAddBtn.disabled=true;return;
  }

  otherNodes.forEach(n=>{
    const alreadyConn=conns.some(c=>c.from===fromId&&c.to===n.id);
    const item=document.createElement('div');
    item.className='cp-to-item'+(alreadyConn?' disabled-row':'');
    item.dataset.nid=n.id;
    const typeLabel=CARD_TYPES.find(t=>t.id===n.type)?.name||n.type;
    item.innerHTML=`
      <div class="cp-to-cb">${alreadyConn?'✓':''}</div>
      <div class="cp-to-name">${esc(n.title||'Untitled')}</div>
      <div class="cp-to-type">${typeLabel}</div>
      ${alreadyConn?'<div class="cp-to-already">linked</div>':''}`;
    if(!alreadyConn){
      item.addEventListener('click',()=>{
        if(checkedTo.has(n.id)){
          checkedTo.delete(n.id);
          item.classList.remove('checked');
          item.querySelector('.cp-to-cb').textContent='';
        } else {
          checkedTo.add(n.id);
          item.classList.add('checked');
          item.querySelector('.cp-to-cb').textContent='✓';
        }
        cpAddBtn.disabled=checkedTo.size===0;
      });
    }
    cpToList.appendChild(item);
  });
  cpAddBtn.disabled=true;
}

cpFromSel.addEventListener('change',()=>{
  checkedTo.clear();
  buildToList();
});

cpAddBtn.addEventListener('click',()=>{
  const f=cpFromSel.value;
  if(!f||checkedTo.size===0)return;
  const label=cpAddLabelInp.value.trim();
  checkedTo.forEach(toId=>{
    if(conns.some(c=>c.from===f&&c.to===toId))return;
    conns.push({id:'c'+cid++,from:f,to:toId,color:newConnColor,label});
    // advance color per connection
    const idx=(CONN_COLORS.indexOf(newConnColor)+1)%CONN_COLORS.length;
    newConnColor=CONN_COLORS[idx];
  });
  cpAddLabelInp.value='';
  buildNewConnDots();
  renderSVG();
  renderConnPanel(); // rebuilds everything incl. to-list
});

function renderConnPanel(){
  populateFromSelect();
  buildToList();

  // clear body
  cpBody.innerHTML='';
  if(conns.length===0){
    const e=document.createElement('div');
    e.id='cp-empty';
    e.innerHTML=`<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="5" cy="12" r="2"/><circle cx="19" cy="12" r="2"/><line x1="7" y1="12" x2="17" y2="12"/></svg><span>No connections yet.<br>Choose a "From" card above.</span>`;
    cpBody.appendChild(e);
    return;
  }

  const hdr=document.createElement('div');
  hdr.className='cp-section-title';
  hdr.textContent=`${conns.length} Connection${conns.length!==1?'s':''}`;
  cpBody.appendChild(hdr);

  conns.forEach(c=>{
    const fn=nodes[c.from],tn=nodes[c.to];
    if(!fn||!tn)return;
    const item=document.createElement('div');
    item.className='cp-conn-item';
    item.innerHTML=`
      <button class="cp-del-btn" data-cid="${c.id}" title="Remove">✕</button>
      <div class="cp-conn-route">
        <div class="cp-from" title="${esc(fn.title||'?')}">${esc((fn.title||'Untitled').slice(0,14))}</div>
        <div class="cp-arrow">→</div>
        <div class="cp-to" title="${esc(tn.title||'?')}">${esc((tn.title||'Untitled').slice(0,14))}</div>
      </div>
      <div class="cp-label-row">
        <label>Label</label>
        <input class="cp-label-inp" data-cid="${c.id}" placeholder="e.g. links to…" value="${esc(c.label||'')}">
      </div>
      <div class="cp-color-row">
        <label>Color</label>
        <div class="cp-dots">
          ${CONN_COLORS.map(col=>`<div class="cp-dot${col===c.color?' sel':''}" style="background:${col}" data-cid="${c.id}" data-col="${col}"></div>`).join('')}
        </div>
      </div>`;
    cpBody.appendChild(item);
  });

  cpBody.querySelectorAll('.cp-label-inp').forEach(inp=>{
    inp.addEventListener('input',e=>{
      const conn=conns.find(c=>c.id===e.target.dataset.cid);
      if(conn){conn.label=e.target.value;renderSVG();}
    });
  });
  cpBody.querySelectorAll('.cp-dot').forEach(dot=>{
    dot.addEventListener('click',e=>{
      const conn=conns.find(c=>c.id===e.target.dataset.cid);
      if(conn){conn.color=e.target.dataset.col;renderSVG();renderConnPanel();}
    });
  });
  cpBody.querySelectorAll('.cp-del-btn').forEach(btn=>{
    btn.addEventListener('click',e=>{
      conns=conns.filter(c=>c.id!==e.currentTarget.dataset.cid);
      renderSVG();renderConnPanel();
    });
  });
}

function openPanel(){panelOpen=true;connPanel.classList.add('open');}
function closePanel(){panelOpen=false;connPanel.classList.remove('open');}

document.getElementById('btn-cv').addEventListener('click',()=>panelOpen?closePanel():openPanel());
document.getElementById('cp-close').addEventListener('click',closePanel);

// ---- CANVAS EVENTS ----
wrap.addEventListener('mousedown',e=>{
  const delEl=e.target.closest('[data-del]');
  if(delEl){deleteNode(delEl.dataset.del);return;}
  const nodeEl=e.target.closest('.node');
  if(nodeEl&&!e.target.isContentEditable){
    const id=nodeEl.id.slice(1);
    dragging=id;selNode=id;
    document.querySelectorAll('.node.sel').forEach(x=>x.classList.remove('sel'));
    nodeEl.classList.add('sel');
    const n=nodes[id];
    dragOff={x:(e.clientX-px)/zoom-n.x,y:(e.clientY-py)/zoom-n.y};
    nodeEl.classList.add('dragging');e.preventDefault();return;
  }
  if(e.target===cvs||e.target===svg||e.target===gc||e.target===wrap||e.target.id==='svg-layer'){
    panning=true;panStart={x:e.clientX-px,y:e.clientY-py};wrap.style.cursor='grabbing';
    document.querySelectorAll('.node.sel').forEach(x=>x.classList.remove('sel'));
    selNode=null;
  }
});
window.addEventListener('mousemove',e=>{
  if(dragging){
    const n=nodes[dragging];
    n.x=(e.clientX-px)/zoom-dragOff.x;
    n.y=(e.clientY-py)/zoom-dragOff.y;
    const el=document.getElementById('n'+dragging);
    if(el){el.style.left=n.x+'px';el.style.top=n.y+'px';}
    renderSVG();
  } else if(panning){
    px=e.clientX-panStart.x;py=e.clientY-panStart.y;applyT();
  }
});
window.addEventListener('mouseup',()=>{
  if(dragging){document.getElementById('n'+dragging)?.classList.remove('dragging');dragging=null;}
  if(panning){panning=false;wrap.style.cursor='default';}
});
wrap.addEventListener('wheel',e=>{
  e.preventDefault();
  const dz=-e.deltaY*.001;
  const nz=Math.max(.2,Math.min(3,zoom+dz));
  const r=wrap.getBoundingClientRect();
  const mx=e.clientX-r.left,my=e.clientY-r.top;
  px=mx-(mx-px)*(nz/zoom);py=my-(my-py)*(nz/zoom);
  zoom=nz;applyT();
},{passive:false});

cvs.addEventListener('input',e=>{
  const t=e.target;
  if(t.dataset.id&&t.dataset.field){
    const n=nodes[t.dataset.id];
    if(n){
      n[t.dataset.field]=t.innerText;
      if(t.dataset.field==='title'){renderSVG();if(panelOpen)renderConnPanel();}
    }
  }
});

function deleteNode(id){
  conns=conns.filter(c=>c.from!==id&&c.to!==id);
  delete nodes[id];
  const el=document.getElementById('n'+id);
  if(el){el.style.transition='opacity .15s,transform .15s';el.style.opacity='0';el.style.transform='scale(.85)';setTimeout(()=>el.remove(),200);}
  renderSVG();if(panelOpen)renderConnPanel();
}

// ---- TOOLBAR ----
document.getElementById('btn-zi').addEventListener('click',()=>{zoom=Math.min(3,zoom+.15);applyT();});
document.getElementById('btn-zo').addEventListener('click',()=>{zoom=Math.max(.2,zoom-.15);applyT();});
document.getElementById('btn-rst').addEventListener('click',()=>{zoom=1;px=80;py=60;applyT();});
document.getElementById('btn-clear').addEventListener('click',()=>{
  if(confirm('Clear everything?')){
    nodes={};conns=[];
    cvs.querySelectorAll('.node').forEach(e=>e.remove());
    renderSVG();if(panelOpen)renderConnPanel();
  }
});
window.addEventListener('keydown',e=>{
  if((e.key==='Delete'||e.key==='Backspace')&&selNode&&document.activeElement.tagName==='BODY'){deleteNode(selNode);selNode=null;}
});

// ---- MODAL ----
function buildModal(){
  cardGrid.innerHTML=CARD_TYPES.map(t=>`
    <div class="card-opt ${t.id===selType?'sel':''}" data-type="${t.id}">
      <div class="card-opt-preview">${miniPreview(t.id)}</div>
      <div class="card-opt-name">${t.name}</div>
      <div class="card-opt-desc">${t.desc}</div>
    </div>`).join('');
  colorRow.innerHTML=ACCENT_COLORS.map(a=>`<div class="clr-opt ${a.k===selColor?'sel':''}" style="background:${a.v}" data-col="${a.k}" title="${a.k}"></div>`).join('');
  const t=CARD_TYPES.find(x=>x.id===selType);
  fUrlRow.style.display=t?.hasUrl?'flex':'none';
  fPriceRow.style.display=t?.hasPrice?'flex':'none';
}

function miniPreview(type){
  const ac=ACCENT_COLORS.find(a=>a.k===selColor)?.v||'#4f7ef8';
  const hx=COLORS[selColor]||'#2563b0';
  if(type==='hero')return`<div style="width:90px;background:${hx};border-radius:5px;overflow:hidden"><div style="background:${hx}88;padding:3px 5px;font-size:6px;color:#aac;font-weight:700">HERO</div><div style="padding:4px 5px"><div style="height:18px;background:${hx}55;border-radius:3px;margin-bottom:3px"></div><div style="height:3px;background:${ac}55;border-radius:2px;margin-bottom:2px;width:80%"></div></div></div>`;
  if(type==='label')return`<div style="background:${hx};border-radius:5px;padding:10px 16px;font-size:9px;font-weight:700;color:#fff;letter-spacing:.5px">LABEL</div>`;
  if(type==='page')return`<div style="width:80px;background:#252838;border-radius:5px;overflow:hidden;border-top:2px solid ${ac}"><div style="padding:3px 5px;font-size:6px;color:#888;border-bottom:1px solid #333">PAGE</div><div style="padding:4px 5px"><div style="height:18px;background:${hx};border-radius:2px;margin-bottom:3px"></div>${[80,60,70].map(w=>`<div style="height:3px;background:#333;border-radius:2px;margin-bottom:2px;width:${w}%"></div>`).join('')}</div></div>`;
  if(type==='action')return`<div style="width:80px;background:#252838;border-radius:5px;overflow:hidden;border-top:2px solid ${ac}"><div style="padding:3px 5px;font-size:6px;color:#888">ACTION</div><div style="padding:3px 5px;display:flex;flex-direction:column;gap:2px">${[0,1,2].map(()=>`<div style="height:7px;background:#333;border-radius:2px"></div>`).join('')}</div><div style="height:9px;background:${ac};margin:2px 5px 5px;border-radius:3px"></div></div>`;
  if(type==='ext')return`<div style="width:90px;background:#252838;border-radius:5px;padding:6px 8px;border-top:2px solid ${ac}"><div style="font-size:6px;color:#555;margin-bottom:3px">LINK</div><div style="display:flex;align-items:center;gap:3px;background:#1e2130;border-radius:3px;padding:3px 4px"><div style="flex:1;height:5px;background:#333;border-radius:2px"></div><div style="width:10px;height:10px;background:${ac};border-radius:2px;font-size:6px;color:#fff;display:flex;align-items:center;justify-content:center">→</div></div></div>`;
  if(type==='media')return`<div style="width:80px;background:#252838;border-radius:5px;overflow:hidden;border-top:2px solid ${ac}"><div style="padding:3px 5px;font-size:6px;color:#888;border-bottom:1px solid #333">GALLERY</div><div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:2px;padding:4px 5px">${[hx+'cc',ac+'88',hx+'99',ac+'55','#3a3f5c',hx+'aa'].map(x=>`<div style="height:14px;background:${x};border-radius:2px"></div>`).join('')}</div></div>`;
  if(type==='form')return`<div style="width:80px;background:#252838;border-radius:5px;overflow:hidden;border-top:2px solid ${ac}"><div style="padding:3px 5px;font-size:6px;color:#888;border-bottom:1px solid #333">FORM</div><div style="padding:4px 5px;display:flex;flex-direction:column;gap:3px">${['','',''].map(()=>`<div style="height:8px;background:#333;border-radius:2px"></div>`).join('')}</div><div style="height:9px;background:${ac};margin:2px 5px 5px;border-radius:3px"></div></div>`;
  if(type==='data')return`<div style="width:90px;background:#252838;border-radius:5px;overflow:hidden;border-top:2px solid ${ac}"><div style="padding:3px 5px;font-size:6px;color:#888;border-bottom:1px solid #333;display:flex;justify-content:space-between"><span>DATA</span><span style="color:${ac}">LIVE</span></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:3px;padding:3px 5px"><div style="background:#2d3147;border-radius:3px;padding:2px 3px;height:16px"></div><div style="background:#2d3147;border-radius:3px;padding:2px 3px;height:16px"></div></div><div style="padding:2px 5px 4px;display:flex;flex-direction:column;gap:2px">${[75,45,60].map(p=>`<div style="height:3px;background:#333;border-radius:2px;overflow:hidden"><div style="width:${p}%;height:100%;background:${ac}88"></div></div>`).join('')}</div></div>`;
  if(type==='payment')return`<div style="width:80px;background:#252838;border-radius:5px;overflow:hidden;border-top:2px solid ${ac}"><div style="padding:3px 5px;font-size:6px;color:#888;border-bottom:1px solid #333">PAYMENT</div><div style="padding:3px 5px"><div style="font-size:12px;font-weight:700;color:${ac}">$29</div><div style="font-size:6px;color:#555">/mo</div></div><div style="padding:2px 5px;display:flex;flex-direction:column;gap:2px">${[0,1].map(()=>`<div style="display:flex;align-items:center;gap:2px"><div style="width:6px;height:6px;border-radius:50%;background:${ac}"></div><div style="flex:1;height:3px;background:#333;border-radius:2px"></div></div>`).join('')}</div><div style="height:9px;background:${ac};margin:3px 5px 5px;border-radius:3px"></div></div>`;
  return`<div style="width:60px;height:40px;background:#333;border-radius:5px"></div>`;
}

cardGrid.addEventListener('click',e=>{
  const opt=e.target.closest('.card-opt');
  if(opt){
    selType=opt.dataset.type;
    document.querySelectorAll('.card-opt').forEach(x=>x.classList.remove('sel'));
    opt.classList.add('sel');buildModal();
  }
});
colorRow.addEventListener('click',e=>{
  const dot=e.target.closest('.clr-opt');
  if(dot){
    selColor=dot.dataset.col;
    document.querySelectorAll('.clr-opt').forEach(x=>x.classList.remove('sel'));
    dot.classList.add('sel');buildModal();
  }
});

document.getElementById('btn-add').addEventListener('click',()=>{
  const cx=(wrap.clientWidth/2-px)/zoom;
  const cy=(wrap.clientHeight/3-py)/zoom;
  pendingPos={x:cx+(Math.random()-.5)*60,y:cy+(Math.random()-.5)*40};
  fTitle.value='';fDesc.value='';fUrl.value='';fPrice.value='';
  buildModal();modalBg.classList.add('open');
  setTimeout(()=>fTitle.focus(),100);
});
document.getElementById('modal-cancel').addEventListener('click',()=>modalBg.classList.remove('open'));
modalBg.addEventListener('click',e=>{if(e.target===modalBg)modalBg.classList.remove('open');});
document.getElementById('modal-ok').addEventListener('click',()=>{
  const id=''+nid++;
  nodes[id]={
    id,type:selType,color:selColor,
    x:pendingPos.x,y:pendingPos.y,
    title:fTitle.value||CARD_TYPES.find(t=>t.id===selType)?.name||'Card',
    desc:fDesc.value||'',
    url:fUrl.value||'',
    price:fPrice.value||'$29'
  };
  renderNode(nodes[id]);
  renderSVG();
  modalBg.classList.remove('open');
  if(panelOpen)renderConnPanel();
});
fTitle.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();document.getElementById('modal-ok').click();}});

// ---- RESIZE ----
new ResizeObserver(()=>{drawGrid();renderSVG();}).observe(wrap);

// ---- INIT ----
buildNewConnDots();
applyT();

(function seed(){
  nodes['1']={id:'1',type:'hero',color:'blue',x:100,y:60,title:'Home',desc:'Main landing page'};
  nodes['2']={id:'2',type:'label',color:'pink',x:80,y:280,title:'News',desc:''};
  nodes['3']={id:'3',type:'label',color:'blue',x:280,y:280,title:'Products',desc:''};
  nodes['4']={id:'4',type:'label',color:'green',x:510,y:280,title:'Projects',desc:''};
  nodes['5']={id:'5',type:'page',color:'pink',x:60,y:430,title:'Company News',desc:'Latest updates'};
  nodes['6']={id:'6',type:'page',color:'blue',x:260,y:430,title:'Shop',desc:'Browse items'};
  nodes['7']={id:'7',type:'media',color:'green',x:490,y:430,title:'Our Projects',desc:'Portfolio gallery'};
  nodes['8']={id:'8',type:'action',color:'pink',x:60,y:620,title:'Newsletter',desc:'Subscribe'};
  nodes['9']={id:'9',type:'payment',color:'blue',x:260,y:570,title:'Pro Plan',desc:'Get Started',price:'$29'};
  nodes['10']={id:'10',type:'form',color:'green',x:490,y:620,title:'Contact Form',desc:'Send Message'};
  nodes['11']={id:'11',type:'data',color:'purple',x:720,y:280,title:'Analytics',desc:''};
  nodes['12']={id:'12',type:'ext',color:'teal',x:720,y:490,title:'External Link',desc:'',url:'www.docs.site'};
  renderAll();
  conns=[
    {id:'c1',from:'1',to:'2',color:'#e84d7c',label:'news'},
    {id:'c2',from:'1',to:'3',color:'#4f7ef8',label:'products'},
    {id:'c3',from:'1',to:'4',color:'#3ab86a',label:'projects'},
    {id:'c4',from:'2',to:'5',color:'#e84d7c',label:''},
    {id:'c5',from:'3',to:'6',color:'#4f7ef8',label:''},
    {id:'c6',from:'4',to:'7',color:'#3ab86a',label:''},
    {id:'c7',from:'5',to:'8',color:'#e84d7c',label:''},
    {id:'c8',from:'6',to:'9',color:'#4f7ef8',label:'checkout'},
    {id:'c9',from:'7',to:'10',color:'#3ab86a',label:''},
    {id:'c10',from:'4',to:'11',color:'#8b5cf6',label:'data'},
    {id:'c11',from:'11',to:'12',color:'#2cc4b0',label:'docs'},
  ];
  cid=12;nid=13;
  renderSVG();
  openPanel();
  renderConnPanel();
})();
