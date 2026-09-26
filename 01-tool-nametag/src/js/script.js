
/* ── STATE ── */
let S = {
  fn:'Maria', ln:'Santos', role:'Software Engineer',
  org:'ResumeCraft Inc.', event:'Annual Summit 2026',
  email:'', phone:'', web:'',
  photoSrc:null, logoSrc:null, bgSrc:null,
  bgOverlay: false,
  surnameColor:'#c9a96e', barColor:'#2980b9', bodyColor:'#ffffff',
  nameSize:26, size:'standard', style:'minimal'
};

/* ── SIZE CONFIG ──
   wIn/hIn are the PHYSICAL dimensions used for @page.
   For portrait badges: wIn is short side, hIn is long side.
   For conference (landscape): hIn is short side, wIn is long side.
*/
const SIZES = {
  small:      {w:110, barH:30, wIn:'1in',   hIn:'3in',   lanyard:false, photo:false, label:'Small — 1″ × 3″',        landscape:false},
  standard:   {w:168, barH:42, wIn:'1.5in', hIn:'3in',   lanyard:true,  photo:false, label:'Standard — 1.5″ × 3″',   landscape:false},
  event:      {w:220, barH:48, wIn:'2in',   hIn:'3.5in', lanyard:true,  photo:true,  label:'Event — 2″ × 3.5″',      landscape:false},
  conference: {w:370, barH:52, wIn:'4in',   hIn:'3in',   lanyard:true,  photo:true,  label:'Conference — 4″ × 3″',   landscape:true},
};

/* ── SIZE ── */
function pickSize(el){
  qs('.size-card.on').classList.remove('on');
  el.classList.add('on');
  S.size = el.dataset.size;
  applySize(); render();
}

function applySize(){
  const cfg = SIZES[S.size];
  const badge = id('badge');
  badge.style.width = cfg.w + 'px';
  id('badge-bar').style.height = cfg.barH + 'px';
  id('lanyard').style.display = cfg.lanyard ? 'flex' : 'none';
  id('size-pill').textContent = cfg.label;
  const maxN = S.size==='small'?20:S.size==='standard'?24:S.size==='event'?28:34;
  if(S.nameSize > maxN){ S.nameSize=maxN; id('name-size').value=maxN; id('size-val').textContent=maxN+'px'; }
  id('name-size').max = maxN;
  const photoField = id('photo-field');
  const hint = id('photo-hint');
  if(cfg.photo){
    photoField.classList.remove('field-disabled');
    hint.style.display='none';
  } else {
    photoField.classList.add('field-disabled');
    hint.style.display='block';
    if(S.photoSrc){ S.photoSrc=null; id('inp-photo').value=''; id('prev-photo').src=''; id('zone-photo').classList.remove('has-img'); }
  }
  const orgRow = id('badge').querySelector('.badge-org');
  orgRow.style.display = S.size==='small'?'none':'flex';
}

/* ── STYLE ── */
function pickStyle(el){
  qs('.style-card.on').classList.remove('on');
  el.classList.add('on');
  S.style = el.dataset.style;
  const badge = id('badge');
  badge.classList.remove('s-classic','s-sharp');
  if(S.style !== 'minimal') badge.classList.add(S.style);
}

/* ── NAME SIZE ── */
function updateSize(inp){
  S.nameSize = +inp.value;
  id('size-val').textContent = S.nameSize+'px';
  id('badge-fn').style.fontSize = S.nameSize+'px';
  id('badge-ln').style.fontSize  = S.nameSize+'px';
}

/* ── SWATCHES ── */
function pickSw(el, type){
  qsa('#sw-'+type+' .sw').forEach(s=>s.classList.remove('on'));
  el.classList.add('on');
  S[type+'Color'] = el.dataset.c;
  render();
}
function customSw(inp, type){
  S[type+'Color'] = inp.value;
  qsa('#sw-'+type+' .sw').forEach(s=>s.classList.remove('on'));
  render();
}

/* ── IMAGES ── */
function loadImg(inp, type){
  const f = inp.files[0]; if(!f) return;
  if(f.size > 4*1024*1024){ toast('File too large — max 4MB'); return; }
  const r = new FileReader();
  r.onload = e => {
    S[type+'Src'] = e.target.result;
    id('prev-'+type).src = e.target.result;
    id('zone-'+type).classList.add('has-img');
    if(type === 'bg'){
      id('overlay-row').style.display = 'flex';
    }
    render();
  };
  r.readAsDataURL(f);
}
function clearImg(evt, type){
  evt.stopPropagation();
  S[type+'Src'] = null;
  id('inp-'+type).value = '';
  id('prev-'+type).src = '';
  id('zone-'+type).classList.remove('has-img');
  if(type === 'bg'){
    id('overlay-row').style.display = 'none';
    id('overlay-toggle').checked = false;
    S.bgOverlay = false;
  }
  render();
}

/* ── OVERLAY TOGGLE ── */
function toggleOverlay(inp){
  S.bgOverlay = inp.checked;
  const bgEl = id('badge-bg');
  bgEl.classList.toggle('with-overlay', S.bgOverlay);
}

/* ── RENDER ── */
function render(){
  const cfg = SIZES[S.size];
  S.fn    = id('fn').value    || '';
  S.ln    = id('ln').value    || '';
  S.role  = id('role').value  || '';
  S.org   = id('org').value   || '';
  S.event = id('event').value || '';
  S.email = id('email').value || '';
  S.phone = id('phone').value || '';
  S.web   = id('web').value   || '';

  id('badge-fn').textContent = S.fn;
  id('badge-ln').textContent = S.ln;
  id('badge-ln').style.color  = S.surnameColor;
  id('badge-fn').style.fontSize = S.nameSize+'px';
  id('badge-ln').style.fontSize  = S.nameSize+'px';

  const roleFz = cfg.w<130?'7px':cfg.w<200?'8px':'8.5px';
  id('badge-role').textContent = S.role.toUpperCase();
  id('badge-role').style.fontSize = roleFz;

  id('badge-org-name').textContent = S.org;
  id('badge-org-name').style.fontSize = cfg.w<200?'8px':'9px';

  id('badge-bar').style.background = S.barColor;
  id('badge-bar-txt').textContent = S.event;
  id('badge-bar-txt').style.fontSize = cfg.w<130?'7px':cfg.w>300?'10px':'8.5px';
  id('badge').style.setProperty('--badge-bar-color', S.barColor);

  const bgEl = id('badge-bg');
  if(S.bgSrc){
    bgEl.style.backgroundImage = `url(${S.bgSrc})`;
    bgEl.classList.add('show');
    bgEl.classList.toggle('with-overlay', S.bgOverlay);
    id('badge').style.background = '';
  } else {
    bgEl.classList.remove('show','with-overlay');
    id('badge').style.background = S.bodyColor;
  }

  // dark body → light text (only when no bg)
  const dark = !S.bgSrc && isDark(S.bodyColor);
  id('badge-fn').style.color   = dark?'#f0ece3':'#1c1c1c';
  id('badge-role').style.color = dark?'#bbb':'#aaa';
  id('badge-org-name').style.color = dark?'#ccc':'#999';
  id('badge-divider').style.background = dark?'rgba(255,255,255,.15)':'#ede9e3';
  qsa('.badge-hole').forEach(h=>h.style.background=dark?'rgba(255,255,255,.2)':'#e4e0da');

  const logoWrap = id('badge-logo-wrap');
  const logoImg  = id('badge-logo-img');
  if(S.logoSrc && S.size!=='small'){
    logoImg.src=S.logoSrc; logoImg.style.display='block';
    logoWrap.querySelector('i').style.display='none';
  } else {
    logoImg.style.display='none';
    logoWrap.querySelector('i').style.display='';
  }

  const photoEl  = id('badge-photo');
  const photoImg = id('badge-photo-img');
  const pSize    = cfg.w<200?'48px':'56px';
  if(S.photoSrc && cfg.photo){
    photoImg.src=S.photoSrc;
    photoEl.style.width=pSize; photoEl.style.height=pSize;
    photoEl.style.boxShadow=`0 0 0 2.5px ${S.barColor}`;
    photoEl.classList.add('show');
  } else {
    photoEl.classList.remove('show');
  }

  const contacts=[];
  if(S.email && cfg.w>=150) contacts.push({i:'ti-mail',  v:S.email});
  if(S.phone && cfg.w>=150) contacts.push({i:'ti-phone', v:S.phone});
  if(S.web   && cfg.w>=150) contacts.push({i:'ti-world', v:S.web});
  const cWrap   = id('badge-contacts');
  const divider = id('badge-divider');
  if(contacts.length){
    const fz = cfg.w<220?'7.5px':'8.5px';
    cWrap.innerHTML = contacts.map(c=>
      `<div class="badge-contact-row" style="font-size:${fz}">
        <i class="ti ${c.i}" style="color:${S.surnameColor}"></i>
        <span style="color:${dark?'#ccc':'#888'}">${esc(c.v)}</span>
       </div>`
    ).join('');
    cWrap.style.padding = cfg.w<220?'6px 12px 10px':'8px 16px 12px';
    divider.style.display='block';
  } else {
    cWrap.innerHTML='';
    divider.style.display='none';
  }

  id('badge-qr-wrap').classList.toggle('show', !!S.web && S.size==='conference');
}

/* ── PRINT ──
   Strategy: inject a <style id="dyn-print"> that sets @page to the exact
   physical badge size (portrait or landscape) AND sets the cloned badge's
   width/height to 100vw/100vh so it fills the page exactly.
   Browsers honour @page size when printing to PDF or physical printers.
*/
function printBadge(){
  const cfg = SIZES[S.size];
  const wrap = id('print-wrap');
  wrap.innerHTML = '';

  // Clone the live badge
  const clone = id('badge').cloneNode(true);
  clone.style.cssText = `
    box-shadow:none!important;
    border-radius:${S.style==='s-sharp'?'0':'10px'};
    position:fixed;
    top:0;left:0;
    width:100vw!important;
    height:100vh!important;
    overflow:hidden;
  `;
  wrap.appendChild(clone);
  wrap.style.display = 'block';

  // Build @page rule with exact physical dimensions
  const sid = 'dyn-page';
  let s = document.getElementById(sid);
  if(!s){ s=document.createElement('style'); s.id=sid; document.head.appendChild(s); }

  // Portrait: width × height; Landscape conference: width=4in, height=3in
  const pw = cfg.landscape ? cfg.wIn : cfg.wIn;
  const ph = cfg.landscape ? cfg.hIn : cfg.hIn;
  const orient = cfg.landscape ? 'landscape' : 'portrait';

  s.textContent = `
    @media print {
      @page {
        size: ${pw} ${ph};
        margin: 0;
      }
      #print-wrap .badge {
        width: 100vw !important;
        height: 100vh !important;
        border-radius: ${S.style==='s-sharp'?'0':'0'} !important;
      }
    }
  `;

  window.print();
  setTimeout(()=>{ wrap.innerHTML=''; wrap.style.display='none'; }, 1400);
}

/* ── DOWNLOAD PNG ── */
function downloadPNG(){
  if(typeof html2canvas==='undefined'){ toast('Library loading…'); return; }
  html2canvas(id('badge'),{scale:3,backgroundColor:null,useCORS:true,allowTaint:true,logging:false})
  .then(c=>{
    const a=document.createElement('a');
    a.download=`${S.fn||'name'}-${S.ln||'tag'}-badge.png`.toLowerCase().replace(/\s+/g,'-');
    a.href=c.toDataURL('image/png');
    a.click();
    toast('Badge downloaded!');
  });
}

/* ── RESET ── */
function resetAll(){
  if(!confirm('Reset everything?')) return;
  id('fn').value='Maria'; id('ln').value='Santos'; id('role').value='Software Engineer';
  id('org').value='ResumeCraft Inc.'; id('event').value='Annual Summit 2026';
  ['email','phone','web'].forEach(k=>id(k).value='');
  S={fn:'Maria',ln:'Santos',role:'Software Engineer',org:'ResumeCraft Inc.',event:'Annual Summit 2026',
     email:'',phone:'',web:'',photoSrc:null,logoSrc:null,bgSrc:null,bgOverlay:false,
     surnameColor:'#c9a96e',barColor:'#2980b9',bodyColor:'#ffffff',nameSize:26,size:'standard',style:'minimal'};
  ['photo','logo','bg'].forEach(t=>{id('zone-'+t).classList.remove('has-img');id('prev-'+t).src='';try{id('inp-'+t).value=''}catch(e){}});
  id('overlay-row').style.display='none';
  id('overlay-toggle').checked=false;
  id('name-size').value=26; id('size-val').textContent='26px';
  qsa('.size-card.on').forEach(e=>e.classList.remove('on')); qs('[data-size="standard"]').classList.add('on');
  qsa('.style-card.on').forEach(e=>e.classList.remove('on')); qs('[data-style="minimal"]').classList.add('on');
  id('badge').classList.remove('s-classic','s-sharp');
  ['body','surname','bar'].forEach(t=>{
    qsa('#sw-'+t+' .sw').forEach(s=>s.classList.remove('on'));
  });
  qsa('#sw-body .sw')[0].classList.add('on');
  qsa('#sw-surname .sw')[0].classList.add('on');
  qsa('#sw-bar .sw')[2].classList.add('on');
  applySize(); render();
}

/* ── UTILS ── */
function id(x){ return document.getElementById(x) }
function qs(x){ return document.querySelector(x) }
function qsa(x){ return document.querySelectorAll(x) }
function esc(s){ return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') }
function isDark(hex){
  const c=hex.replace('#','');
  if(c.length<6) return false;
  const r=parseInt(c.slice(0,2),16),g=parseInt(c.slice(2,4),16),b=parseInt(c.slice(4,6),16);
  return (r*299+g*587+b*114)/1000<128;
}
let _tt;
function toast(msg){ const t=id('toast'); id('toast-msg').textContent=msg; t.classList.add('show'); clearTimeout(_tt); _tt=setTimeout(()=>t.classList.remove('show'),2600); }

/* ── INIT ── */
applySize(); render();
document.addEventListener('keydown',e=>{
  if((e.ctrlKey||e.metaKey)&&e.key==='p'){ e.preventDefault(); printBadge(); }
  if((e.ctrlKey||e.metaKey)&&e.key==='s'){ e.preventDefault(); downloadPNG(); }
});
