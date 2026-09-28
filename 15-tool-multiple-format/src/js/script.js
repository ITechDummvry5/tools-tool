const $=id=>document.getElementById(id);
const inp=$('in'),out=$('out'),empty=$('empty'),st=$('st');
let lang='json',indent=2,sort=false,mode='pretty',result='',typing=null;
const texts={json:'',css:'',js:'',html:''};
const SAMPLES={
 json:JSON.stringify({name:"Meridian",version:"2.4.1",released:true,tags:["fast","private"],author:{name:"Ada Lovelace",active:null},metrics:{uptime:99.98,latency_ms:[12,18,9.5]}}),
 css:':root{--gold:#c9a24b}body{margin:0;font:16px/1.5 system-ui}.card{display:grid;gap:12px;padding:24px;border-radius:16px;background:linear-gradient(#111,#000)}.card:hover{transform:translateY(-4px)}@media(max-width:600px){.card{padding:16px}}',
 js:'const users=[{name:"Ada",age:36},{name:"Linus",age:54}];function greet(u){return `Hello, ${u.name}!`}users.filter(u=>u.age>40).forEach(u=>console.log(greet(u)));async function load(url){try{const r=await fetch(url);return await r.json()}catch(e){console.error(e)}}',
 html:'<!DOCTYPE html><html lang="en"><head><title>Hello</title></head><body><div class="card"><h2>Hello</h2><p>Paste <b>any</b> markup.</p><ul><li>One</li><li>Two</li></ul><a href="#" class="btn">Go</a></div></body></html>'
};
const HOLD={json:'Paste JSON here',css:'Paste CSS here',js:'Paste JavaScript here',html:'Paste HTML here'};
const EXT={json:'.json',css:'.css',js:'.js',html:'.html'};
const esc=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const W=(c,t)=>`<span class="${c}">${t}</span>`;
const HL={
 json:s=>esc(s).replace(/("(?:\\.|[^"\\])*")(\s*:)?|\b(true|false|null)\b|-?\d+\.?\d*(?:[eE][+-]?\d+)?/g,(m,str,c,lit)=>str?(c?W('k',str)+c:W('s',str)):lit?W('l',m):W('n',m)),
 css:s=>esc(s).replace(/(\/\*[\s\S]*?\*\/)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|(@[\w-]+)|(#[0-9a-fA-F]{3,8}\b)|((?<![\w#-])-?\d*\.?\d+(?:px|em|rem|%|vh|vw|vmin|vmax|ms|s|deg|fr)?(?![\w-]))|(-{0,2}[a-zA-Z][\w-]*)(?=\s*:)/g,(m,c,str,at,hex,num,prop)=>c?W('c',c):str?W('s',str):at?W('l',at):hex||num?W('n',m):W('k',prop)),
 js:s=>esc(s).replace(/(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|("(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'|`(?:\\.|[^`\\])*`)|\b(const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|new|class|extends|import|export|from|default|async|await|try|catch|finally|throw|typeof|instanceof|in|of|this|super|yield|delete|void)\b|\b(true|false|null|undefined|NaN)\b|((?<![\w$])\d[\d_.]*(?:e[+-]?\d+)?\b)|\b([A-Za-z_$][\w$]*)(?=\s*\()/g,(m,c,str,kw,lit,num,fn)=>c?W('c',c):str?W('s',str):kw||lit?W('l',m):num?W('n',m):W('k',fn)),
 html:s=>esc(s).replace(/(&lt;!--[\s\S]*?--&gt;)|(&lt;!DOCTYPE[^&]*&gt;)|(&lt;\/?[\w:-]+)((?:"[^"]*"|'[^']*'|[^"'&]|&(?!gt;))*?)(\/?&gt;)/gi,(m,c,dt,open,attrs,close)=>c||dt?W('c',m):W('l',open)+attrs.replace(/([\w:@.-]+)(=)?("[^"]*"|'[^']*')?/g,(x,n,eq,v)=>W('k',n)+(eq||'')+(v?W('s',v):''))+W('l',close))
};
const sortKeys=v=>Array.isArray(v)?v.map(sortKeys):v&&typeof v==='object'?Object.keys(v).sort().reduce((o,k)=>(o[k]=sortKeys(v[k]),o),{}):v;
function measure(v){let keys=0,d=0;(function w(x,l){d=Math.max(d,l);if(Array.isArray(x))x.forEach(i=>w(i,l+1));else if(x&&typeof x==='object'){const k=Object.keys(x);keys+=k.length;k.forEach(i=>w(x[i],l+1));}})(v,0);return{keys,d}}
const fmtB=n=>n<1024?n+' B':(n/1024).toFixed(1)+' KB';
const fmtP=n=>(n>0?'+':'')+n+'%';
const bytes=t=>new Blob([t]).size;
const keep=(t,re,fn)=>{const a=[];const x=t.replace(re,m=>{a.push(m);return '\u0001'+(a.length-1)+'\u0001'});return fn(x).replace(/\u0001(\d+)\u0001/g,(_,i)=>a[i])};
const MIN={
 css:t=>keep(t,/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g,x=>x.replace(/\/\*[\s\S]*?\*\//g,'').replace(/\s+/g,' ').replace(/\s*([{};,>~])\s*/g,'$1').replace(/:\s+/g,':').replace(/;}/g,'}').trim()),
 html:t=>keep(t,/<(pre|textarea|script|style)[\s\S]*?<\/\1>/gi,x=>x.replace(/<!--[\s\S]*?-->/g,'').replace(/>\s*[\r\n]\s*</g,'><').replace(/[ \t]{2,}/g,' ').trim())
};
function lintCSS(t){
  const pos=i=>{const p=t.slice(0,i).split('\n');return{line:p.length,col:p[p.length-1].length+1}};
  const fail=(i,m)=>{throw Object.assign(new Error(m),pos(i))};
  let c='',i=0;const n=t.length;
  while(i<n){const ch=t[i];
    if(ch==='/'&&t[i+1]==='*'){const e=t.indexOf('*/',i+2);if(e<0)fail(i,'Comment is never closed. Add */ to end it.');c+=t.slice(i,e+2).replace(/[^\n]/g,' ');i=e+2}
    else if(ch==='"'||ch==="'"){let j=i+1;while(j<n&&t[j]!==ch&&t[j]!=='\n'){if(t[j]==='\\')j++;j++}
      if(j>=n||t[j]!==ch)fail(i,'String is never closed. Add a matching '+ch+'.');c+=t.slice(i,j+1).replace(/[^\n]/g,' ');i=j+1}
    else{c+=ch;i++}}
  const st=[],pair={'}':'{',')':'(',']':'['},close={'{':'}','(':')','[':']'};
  for(let k=0;k<c.length;k++){const ch=c[k];
    if(ch in close)st.push({ch,k});
    else if(ch in pair){const top=st.pop();if(!top)fail(k,`Unexpected "${ch}" with no matching "${pair[ch]}".`);if(top.ch!==pair[ch])fail(k,`Expected "${close[top.ch]}" to close the "${top.ch}" from line ${pos(top.k).line}, found "${ch}".`)}}
  if(st.length){const top=st[st.length-1];fail(top.k,`"${top.ch}" is never closed. Add "${close[top.ch]}".`)}
  const re=/\{([^{}]*)\}/g;let m;
  while((m=re.exec(c))){let off=m.index+1;
    for(const seg of m[1].split(';')){const body=seg.replace(/\([^)]*\)/g,x=>' '.repeat(x.length)),s=body.trim();
      if(s){const at=off+body.search(/\S/);
        if(!s.includes(':'))fail(at,`Missing ":" in "${s.slice(0,40)}". Each declaration needs a property and a value.`);
        if(/^[^:]+:[^:]*?\s[a-zA-Z-][\w-]*\s*:/.test(s))fail(at,`Missing ";" between declarations in "${s.slice(0,40)}".`)}
      off+=seg.length+1}}
}
function lintJS(t){
  if(window.acorn){
    const o={ecmaVersion:'latest',allowHashBang:true,allowReturnOutsideFunction:true,allowAwaitOutsideFunction:true};
    try{acorn.parse(t,{...o,sourceType:'script'})}
    catch(e1){try{acorn.parse(t,{...o,sourceType:'module'})}catch(e2){throw Object.assign(new Error(e1.message.replace(/\s*\(\d+:\d+\)$/,'')),{line:e1.loc.line,col:e1.loc.column+1})}}
    return;
  }
  try{new Function(t)}catch(e){if(e instanceof SyntaxError)throw e}
}
function lintHTML(t){
  const pos=i=>{const p=t.slice(0,i).split('\n');return{line:p.length,col:p[p.length-1].length+1}};
  const fail=(i,m)=>{throw Object.assign(new Error(m),pos(i))};
  const VOID=new Set('area base br col embed hr img input link meta param source track wbr'.split(' '));
  const OPT=new Set('li p td th tr thead tbody tfoot option optgroup dt dd colgroup html head body'.split(' '));
  const AUTO={li:['li'],p:['p'],dt:['dt','dd'],dd:['dt','dd'],td:['td','th'],th:['td','th'],tr:['td','th','tr'],option:['option']};
  const RAW=new Set(['script','style','textarea','title']);
  const low=t.toLowerCase(),st=[];
  const re=/<!--[\s\S]*?-->|<!--|<![^>]*>|<(\/?)([a-zA-Z][\w:-]*)((?:"[^"]*"|'[^']*'|[^"'>])*)>|<\/?[a-zA-Z][\w:-]*/g;
  let m;
  while((m=re.exec(t))){
    const s=m[0];
    if(s==='<!--')fail(m.index,'Comment is never closed. Add --> to end it.');
    if(s[1]==='!')continue;
    if(m[2]===undefined)fail(m.index,`Tag ${s} is broken. Check for a missing ">" or an unclosed quote in its attributes.`);
    const name=m[2].toLowerCase();
    if(m[1]){
      if(VOID.has(name))continue;
      let k=st.length-1;while(k>=0&&st[k].name!==name)k--;
      if(k<0)fail(m.index,`Closing </${name}> has no matching opening tag.`);
      for(let j=st.length-1;j>k;j--)if(!OPT.has(st[j].name))fail(m.index,`Expected </${st[j].name}> (opened on line ${pos(st[j].i).line}) before </${name}>.`);
      st.length=k;
    }else{
      if(AUTO[name])while(st.length&&AUTO[name].includes(st[st.length-1].name))st.pop();
      if(VOID.has(name)||/\/\s*$/.test(m[3]))continue;
      if(RAW.has(name)){const e=low.indexOf('</'+name,re.lastIndex);if(e<0)fail(m.index,`<${name}> is never closed.`);re.lastIndex=low.indexOf('>',e)+1||t.length;continue}
      st.push({name,i:m.index});
    }
  }
  const bad=st.filter(x=>!OPT.has(x.name)).pop();
  if(bad)fail(bad.i,`<${bad.name}> is never closed. Add </${bad.name}>.`);
}
const LINT={css:lintCSS,js:lintJS,html:lintHTML};
function gotoErr(line,col){const ls=inp.value.split('\n');let off=0;for(let i=0;i<line-1;i++)off+=ls[i].length+1;off+=col-1;inp.focus();inp.setSelectionRange(off,Math.min(off+1,inp.value.length));const lh=parseFloat(getComputedStyle(inp).lineHeight)||23;inp.scrollTop=Math.max(0,(line-3)*lh)}
function locate(t,msg){let m=msg.match(/line (\d+) column (\d+)/i);if(m)return{line:+m[1],col:+m[2]};m=msg.match(/position (\d+)/i);if(m){const p=t.slice(0,+m[1]).split('\n');return{line:p.length,col:p[p.length-1].length+1}}return null}
function convert(t){
  if(mode==='min') return MIN[lang](t);
  const fn={css:window.css_beautify,js:window.js_beautify,html:window.html_beautify}[lang];
  if(typeof fn!=='function') throw new Error('The formatter library failed to load. Check your connection and reload the page.');
  const tab=indent==='tab';
  return fn(t,{indent_size:tab?1:indent,indent_char:tab?'\t':' ',indent_with_tabs:tab,preserve_newlines:true,max_preserve_newlines:2,wrap_line_length:lang==='html'?110:0});
}
function tween(el,to,fmt=String){const from=+el.dataset.v||0;el.dataset.v=to;const t0=performance.now();cancelAnimationFrame(el.r);
  (function s(t){const p=Math.min(1,(t-t0)/380),e=1-Math.pow(1-p,3);el.textContent=fmt(Math.round(from+(to-from)*e));if(p<1)el.r=requestAnimationFrame(s)})(t0)}
function setState(cls,txt){st.className='stat status '+cls;$('state').textContent=txt}
function labels(){const j=lang==='json';$('l3').textContent=j?'Keys':'Input';$('l4').textContent=j?'Depth':'Change'}
function render(){
  const t=inp.value;$('modeLabel').textContent=mode==='pretty'?'Formatted':'Minified';out.dataset.l=lang;labels();
  if(!t.trim()){out.innerHTML='';result='';empty.style.display='grid';setState('','Waiting');
    tween($('vSize'),0,fmtB);tween($('vKeys'),0,lang==='json'?String:fmtB);tween($('vDepth'),0,lang==='json'?String:fmtP);tween($('vLines'),0);return}
  empty.style.display='none';
  try{
    let v;
    if(lang==='json'){v=JSON.parse(t);if(sort)v=sortKeys(v);result=mode==='min'?JSON.stringify(v):JSON.stringify(v,null,indent==='tab'?'\t':indent)}
    else{LINT[lang](t);result=convert(t)}
    out.innerHTML=HL[lang](result);setState('ok',lang==='json'?'Valid':'No errors');
    const b=bytes(result);tween($('vSize'),b,fmtB);tween($('vLines'),result.split('\n').length);
    if(lang==='json'){const m=measure(v);tween($('vKeys'),m.keys);tween($('vDepth'),m.d)}
    else{const i=bytes(t);tween($('vKeys'),i,fmtB);tween($('vDepth'),Math.round((b-i)/i*100),fmtP)}
  }catch(e){
    if(typing){setState('','Typing…');return}
    result='';
    const p=e.line?{line:e.line,col:e.col}:lang==='json'?locate(t,e.message):null;
    const title=({json:'Invalid JSON',css:'CSS error',js:'JavaScript error',html:'HTML error'})[lang]+(p?` at line ${p.line}, column ${p.col}`:'');
    let ctx='';
    if(p){const L=(t.split('\n')[p.line-1]||'').replace(/\t/g,' '),s=Math.max(0,p.col-40),pre=String(p.line).length+3;
      ctx=`<div class="ctx">${p.line} │ ${esc(L.slice(s,s+100))}\n${' '.repeat(pre+Math.max(0,p.col-1-s))}^</div><button class="pill goto" onclick="gotoErr(${p.line},${p.col})">Show in input</button>`}
    out.innerHTML=`<div class="err"><b>${title}</b>${esc(e.message)}${ctx}</div>`;
    setState('bad',p?'Error, line '+p.line:'Error');
  }
}
function stopTyping(){if(typing){clearInterval(typing);typing=null}}
function typeSample(){const s=SAMPLES[lang];let i=0;inp.value='';stopTyping();
  typing=setInterval(()=>{i+=3;inp.value=s.slice(0,i);render();if(i>=s.length)stopTyping()},22)}
inp.addEventListener('input',()=>{stopTyping();render()});inp.addEventListener('focus',stopTyping);
function thumb(){document.querySelectorAll('.seg').forEach(seg=>{const b=seg.querySelector('[aria-pressed="true"]'),th=seg.querySelector('.thumb');if(b&&th){th.style.width=b.offsetWidth+'px';th.style.transform=`translateX(${b.offsetLeft}px)`}})}
function press(btns,b){btns.forEach(x=>x.setAttribute('aria-pressed',x===b?'true':'false'))}
const langBtns=[...document.querySelectorAll('#langSeg button')];
function setLang(l){
  stopTyping();texts[lang]=inp.value;lang=l;press(langBtns,langBtns.find(b=>b.dataset.l===l));
  inp.value=texts[l];inp.placeholder=HOLD[l];$('dropHint').textContent='Drop a '+EXT[l]+' file here';
  $('sort').hidden=l!=='json';$('min').disabled=l==='js';$('min').title=l==='js'?'JavaScript minify is not available':'';
  if(l==='js'&&mode==='min'){mode='pretty';$('min').setAttribute('aria-pressed','false')}
  thumb();render();
}
langBtns.forEach(b=>b.onclick=()=>setLang(b.dataset.l));
const indBtns=[...document.querySelectorAll('#seg button')];
indBtns.forEach(b=>b.onclick=()=>{press(indBtns,b);indent=b.dataset.i==='tab'?'tab':+b.dataset.i;mode='pretty';$('min').setAttribute('aria-pressed','false');thumb();render()});
$('sort').onclick=e=>{sort=!sort;e.currentTarget.setAttribute('aria-pressed',sort);render()};
$('min').onclick=e=>{mode=mode==='min'?'pretty':'min';e.currentTarget.setAttribute('aria-pressed',mode==='min');render()};
$('sample').onclick=typeSample;
$('clear').onclick=()=>{stopTyping();inp.value='';render();inp.focus()};
$('copy').onclick=async e=>{const b=e.currentTarget;if(!result){b.textContent='Nothing yet';setTimeout(()=>b.textContent='Copy',1400);return}
  try{await navigator.clipboard.writeText(result)}catch(_){const t=document.createElement('textarea');t.value=result;document.body.appendChild(t);t.select();document.execCommand('copy');t.remove()}
  b.textContent='Copied ✓';b.classList.add('done');setTimeout(()=>{b.textContent='Copy';b.classList.remove('done')},1600)};
const drop=$('drop');
['dragenter','dragover'].forEach(n=>drop.addEventListener(n,e=>{e.preventDefault();drop.classList.add('drag')}));
['dragleave','drop'].forEach(n=>drop.addEventListener(n,e=>{e.preventDefault();drop.classList.remove('drag')}));
drop.addEventListener('drop',e=>{const f=e.dataTransfer.files[0];if(!f)return;stopTyping();
  const ext=(f.name.split('.').pop()||'').toLowerCase(),m={json:'json',css:'css',js:'js',mjs:'js',html:'html',htm:'html'}[ext];
  if(m&&m!==lang)setLang(m);f.text().then(t=>{inp.value=t;render()})});
const card=$('card'),reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;
function onScroll(){if(reduce)return;const r=card.getBoundingClientRect(),vh=innerHeight;
  const p=Math.min(1,Math.max(0,1-(r.top-vh*.12)/(vh*.75)));
  card.style.transform=`scale(${.92+.08*p}) translateY(${30*(1-p)}px)`;card.style.opacity=.6+.4*p}
addEventListener('scroll',onScroll,{passive:true});addEventListener('resize',()=>{thumb();onScroll()});
document.querySelectorAll('.tile').forEach(t=>{new IntersectionObserver((es,o)=>{if(es[0].isIntersecting){t.classList.add('in');o.disconnect()}},{threshold:.25}).observe(t)});
render();onScroll();(document.fonts?document.fonts.ready:Promise.resolve()).then(thumb);thumb();
setTimeout(()=>{if(!inp.value&&!typing)typeSample()},900);
