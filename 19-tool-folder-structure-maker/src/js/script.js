
const $=s=>document.querySelector(s);
const F=(n,c)=>({n,d:1,c:c||[]}), A=n=>({n,d:0,c:[]});
const TYPES=['html','css','js','md','txt','py','json'];
let root=F('my-project',[F('src',[A('main.js')]),A('README.md')]);

const clean=n=>(n.trim()||'unnamed').replace(/[\\/:*?"<>|]/g,'-');
const ext=n=>{const m=n.match(/\.([a-z0-9]+)$/i);return m?m[1].toLowerCase():''};
const base=n=>clean(n).replace(/\.[a-z0-9]+$/i,'');
function tpl(n){
  const b=base(n);
  switch(ext(n)){
    case 'html':return '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="utf-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1">\n  <title>'+b+'</title>\n  <link rel="icon" href="favicon.ico">\n</head>\n<body>\n  <h1>'+b+'</h1>\n</body>\n</html>';
    case 'css':return '* { box-sizing: border-box; }\nbody {\n  margin: 0;\n  font-family: -apple-system, "Helvetica Neue", sans-serif;\n}';
    case 'js':return '// '+b+'\nconsole.log("Hello from '+b+'");';
    case 'md':return '# '+b+'\n\nWrite your notes here.';
    case 'txt':return b;
    case 'py':return '# '+b+'\ndef main():\n    print("Hello from '+b+'")\n\n\nif __name__ == "__main__":\n    main()';
    case 'json':return '{\n  "name": "'+b+'"\n}';
    default:return '';
  }
}
function walk(n,p,dirs,files){
  const q=[...p,clean(n.n)];
  if(n.d){dirs.push(q);n.c.forEach(k=>walk(k,q,dirs,files))}else files.push([q,tpl(n.n)]);
}
function collect(){const d=[],f=[];walk(root,[],d,f);return[d,f]}
function ascii(n,pre,last,top){
  const nm=clean(n.n)+(n.d?'/':'');
  let s=top?nm+'\n':pre+(last?'└── ':'├── ')+nm+'\n';
  const np=top?'':pre+(last?'    ':'│   ');
  n.c.forEach((k,i)=>s+=ascii(k,np,i===n.c.length-1,false));
  return s;
}
function out(){
  const[d,f]=collect();
  $('#o1').textContent=ascii(root,'',true,true);
  $('#o2').textContent='mkdir -p '+d.map(p=>'"'+p.join('/')+'"').join(' ')+'\n'+
    f.map(([p,c])=>'cat > "'+p.join('/')+"\" <<'__END__'\n"+c+'\n__END__').join('\n');
  $('#o3').textContent=d.map(p=>'New-Item -ItemType Directory -Force -Path "'+p.join('\\')+'" | Out-Null').join('\n')+'\n'+
    f.map(([p,c])=>'Set-Content -Path "'+p.join('\\')+"\" -Value @'\n"+c+"\n'@").join('\n');
}
function el(t,txt,cls,fn){const e=document.createElement(t);if(txt)e.textContent=txt;if(cls)e.className=cls;if(fn)e.onclick=fn;return e}
function row(node,parent){
  const w=document.createElement('div'),r=el('div','','row');
  const i=document.createElement('input');i.value=node.n;i.setAttribute('aria-label',(node.d?'Folder':'File')+' name');
  i.oninput=()=>{node.n=i.value;out()};
  i.onchange=render;
  r.append(i);
  if(node.d){
    r.append(el('button','+ Folder','',()=>{node.c.push(F('new-folder'));render()}));
    r.append(el('button','+ File','',()=>{node.c.push(A('index.html'));render()}));
  }else{
    const s=document.createElement('select');s.setAttribute('aria-label','File type');
    [...TYPES,'other'].forEach(t=>{const o=document.createElement('option');o.value=o.textContent=t;s.append(o)});
    s.value=TYPES.includes(ext(node.n))?ext(node.n):'other';
    s.onchange=()=>{if(s.value!=='other'){node.n=node.n.replace(/\.[a-z0-9]+$/i,'')+'.'+s.value;render()}};
    r.append(s);
  }
  if(parent)r.append(el('button','Remove','x',()=>{parent.c=parent.c.filter(k=>k!==node);render()}));
  w.append(r);
  if(node.c.length){const k=el('div','','kids');node.c.forEach(c=>k.append(row(c,node)));w.append(k)}
  return w;
}
function render(){const t=$('#tree');t.innerHTML='';t.append(row(root,null));out()}
$('#rs').onclick=()=>{root=F('my-project');render()};
$('#ex').onclick=()=>{root=F('my-website',[A('index.html'),F('css',[A('style.css')]),F('js',[A('app.js')]),F('assets'),A('README.md')]);render()};
$('#ex2').onclick=()=>{root=F('my-app',[A('main.py'),F('utils',[A('helpers.py')]),A('config.json'),A('notes.txt'),A('README.md')]);render()};
document.querySelectorAll('[data-c]').forEach(b=>b.onclick=async()=>{
  const el2=$('#'+b.dataset.c),old=b.textContent;
  try{await navigator.clipboard.writeText(el2.textContent);b.textContent='Copied'}
  catch(e){const r=document.createRange();r.selectNodeContents(el2);getSelection().removeAllRanges();getSelection().addRange(r);b.textContent='Selected. Press Ctrl+C'}
  setTimeout(()=>b.textContent=old,1600);
});
render();