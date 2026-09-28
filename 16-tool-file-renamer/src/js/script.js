
const $=id=>document.getElementById(id);
let items=[],scope='files',res=[];
const IMG=/^(png|jpe?g|gif|webp|avif|bmp|svg|ico)$/i;
const esc=s=>s.replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

function add(file,dir){
  const i=file.name.lastIndexOf('.');
  const ext=i>0?file.name.slice(i+1):'';
  const it={file,dir,base:i>0?file.name.slice(0,i):file.name,ext};
  if(IMG.test(ext))it.url=URL.createObjectURL(file);
  items.push(it);
}
async function walk(e,parent){
  if(e.isFile){const f=await new Promise(r=>e.file(r));add(f,parent);}
  else{const p=parent+e.name+'/';const rd=e.createReader();let all=[];
    while(true){const b=await new Promise(r=>rd.readEntries(r));if(!b.length)break;all.push(...b);}
    for(const c of all)await walk(c,p);}
}
const drop=$('drop');
['dragenter','dragover'].forEach(t=>document.addEventListener(t,e=>{e.preventDefault();drop.classList.add('on')}));
['dragleave','drop'].forEach(t=>document.addEventListener(t,e=>{e.preventDefault();drop.classList.remove('on')}));
document.addEventListener('drop',async e=>{
  const its=[...e.dataTransfer.items].map(i=>i.webkitGetAsEntry&&i.webkitGetAsEntry()).filter(Boolean);
  if(its.length)for(const en of its)await walk(en,'');
  else for(const f of e.dataTransfer.files)add(f,'');
  run();
});
drop.onclick=()=>$('fi').click();
$('pf').onclick=()=>$('fi').click();$('pd').onclick=()=>$('di').click();
$('fi').onchange=e=>{[...e.target.files].forEach(f=>add(f,''));e.target.value='';run()};
$('di').onchange=e=>{[...e.target.files].forEach(f=>{const p=f.webkitRelativePath.split('/');p.pop();add(f,p.join('/')+(p.length?'/':''))});e.target.value='';run()};
$('clr').onclick=()=>{items.forEach(i=>i.url&&URL.revokeObjectURL(i.url));items=[];run()};
document.querySelectorAll('#scope button').forEach(b=>b.onclick=()=>{scope=b.dataset.v;document.querySelectorAll('#scope button').forEach(x=>x.classList.toggle('a',x===b));run()});
document.querySelectorAll('.ctl input,.ctl select').forEach(el=>el.addEventListener('input',run));
$('theme').onclick=()=>{const r=document.documentElement;const dark=r.dataset.theme?r.dataset.theme==='dark':matchMedia('(prefers-color-scheme:dark)').matches;r.dataset.theme=dark?'light':'dark'};

function words(s){return s.replace(/([a-z0-9])([A-Z])/g,'$1 $2').split(/[\s_\-.]+/).filter(Boolean)}
function casing(s,m){
  if(m==='lower')return s.toLowerCase();
  if(m==='upper')return s.toUpperCase();
  if(m==='title')return s.toLowerCase().replace(/(^|[\s_\-])(\w)/g,(a,b,c)=>b+c.toUpperCase());
  if(m==='kebab')return words(s).join('-').toLowerCase();
  if(m==='snake')return words(s).join('_').toLowerCase();
  if(m==='camel')return words(s).map((w,i)=>i?w[0].toUpperCase()+w.slice(1).toLowerCase():w.toLowerCase()).join('');
  return s;
}
function core(s){
  const f=$('find').value;
  if(f){try{s=$('rx').checked?s.replace(new RegExp(f,'g'),$('rep').value):s.split(f).join($('rep').value)}catch(e){}}
  const sp=$('sp').value;
  if(sp)s=s.replace(/\s+/g,sp===' '?'':sp);
  if($('strip').checked)s=s.replace(/[^\w\s.\-]/g,'');
  s=casing(s,$('case').value);
  return $('pre').value+s+$('suf').value;
}
function pathOf(it,idx){
  const doF=scope!=='folders',doD=scope!=='files';
  const dir=it.dir.split('/').filter(Boolean).map(d=>doD?core(d):d).join('/');
  let base=it.base,ext=it.ext;
  if(doF){
    base=core(base);
    if($('num').checked){
      const n=String(+$('start').value+idx).padStart(+$('pad').value||1,'0'),p=$('npos').value;
      base=p==='only'?n:p==='pre'?n+'_'+base:base+'_'+n;
    }
    const em=$('ext').value;
    if(em==='lower')ext=ext.toLowerCase();
    if(em==='set'&&$('extv').value)ext=$('extv').value.replace(/^\./,'');
  }
  return (dir?dir+'/':'')+(base||'unnamed')+(ext?'.'+ext:'');
}
function run(){
  const seen={};
  res=items.map((it,i)=>{const n=pathOf(it,i);seen[n]=(seen[n]||0)+1;return{it,old:it.dir+it.file.name,neu:n}});
  let changed=0,dup=0;
  const html=res.slice(0,400).map(r=>{
    const same=r.old===r.neu,bad=seen[r.neu]>1;
    const th=r.it.url?`<img class="th" src="${r.it.url}" alt="">`:`<div class="th">${esc((r.it.ext||'file').slice(0,4).toUpperCase())}</div>`;
    return `<div class="it">${th}<div><div class="o">${esc(r.old)}</div><div class="n${same?' same':''}${bad?' bad':''}">${esc(r.neu)}${bad?'<span class="tag">CONFLICT</span>':''}</div></div></div>`}).join('');
  res.forEach(r=>{if(r.old!==r.neu)changed++;if(seen[r.neu]>1)dup++});
  $('list').innerHTML=items.length?html+(res.length>400?`<div class="empty" style="padding:16px">+ ${res.length-400} more (all included in export)</div>`:''):'<div class="empty">Drop something to preview the new names.</div>';
  $('stat').innerHTML=items.length?`<b>${items.length}</b> items · <b>${changed}</b> will change`:'No items yet';
  $('warn').textContent=dup?`${dup} name conflicts — resolve before exporting`:'';
  const ok=items.length&&!dup;
  ['zip','sh','cp'].forEach(id=>$(id).disabled=!ok);
}
function save(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),4000)}
$('zip').onclick=async()=>{
  if(typeof JSZip==='undefined')return alert('ZIP library failed to load.');
  const z=new JSZip();res.forEach(r=>z.file(r.neu,r.it.file));
  $('zip').textContent='Building…';
  save(await z.generateAsync({type:'blob'}),'renamed.zip');$('zip').textContent='Download renamed ZIP';
};
const q=s=>"'"+s.replace(/'/g,"'\\''")+"'";
$('sh').onclick=()=>{
  const L=['#!/bin/sh','# Run from the folder that contains the original items','set -e'];
  const dirs=new Set();
  res.forEach(r=>{if(r.old!==r.neu){const d=r.neu.split('/').slice(0,-1).join('/');if(d&&!dirs.has(d)){dirs.add(d);L.push('mkdir -p '+q('renamed/'+d))}}});
  res.forEach(r=>{if(r.old!==r.neu)L.push('cp '+q(r.old)+' '+q('renamed/'+r.neu))});
  L.push('echo "Done — see ./renamed"');
  save(new Blob([L.join('\n')+'\n'],{type:'text/plain'}),'rename.sh');
};
$('cp').onclick=async()=>{
  const t=res.map(r=>r.old+'\t'+r.neu).join('\n');
  try{await navigator.clipboard.writeText(t);$('cp').textContent='Copied ✓'}catch(e){$('cp').textContent='Copy failed'}
  setTimeout(()=>$('cp').textContent='Copy mapping',1500);
};
run();
