/* Chrono app logic. Everything is stored in this browser only. */

const $=s=>document.querySelector(s),DAY=864e5,ts=s=>Date.parse(s);
/* iso never throws: an impossible or absurdly far date gives an empty string */
const iso=t=>{const d=new Date(t),y=d.getUTCFullYear();return isNaN(y)||y<0||y>9999?'':d.toISOString().slice(0,10)};
const localToday=()=>iso(Date.now()-new Date().getTimezoneOffset()*6e4);
let today=localToday();const off=n=>iso(ts(today)+n*DAY);
const SMOOTH=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth';
const COLORS=['#e50000','#2563eb','#f59e0b','#10b981','#a855f7','#6b7280'];
const uid=()=>{try{const a=new Uint32Array(2);crypto.getRandomValues(a);return a[0].toString(36)+a[1].toString(36)}catch(e){return Math.random().toString(36).slice(2,12)}};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
/* Two decimals normally, more for tiny values (0.0004 stays 0.0004). No "-0" or "+0". */
const dpOf=a=>a===0||a>=1?2:Math.min(8,2+Math.ceil(-Math.log10(a)));
const rnd=n=>{const d=dpOf(Math.abs(n));return Math.round(Math.abs(n)*10**d)/10**d};
const fmt=n=>{const r=rnd(n),d=dpOf(Math.abs(n));return(n<0&&r!==0?'−':'')+r.toLocaleString(undefined,{maximumFractionDigits:d})};
const sgn=n=>(n>0&&rnd(n)!==0?'+':'')+fmt(n);
/* Money reads symbol first: -110 $ becomes −$110, 2,000 ₱ becomes ₱2,000. */
const CURRE=/([+−-]?)(\d[\d,]*(?:\.\d+)?) ?(₱|\$|€|£|¥|₹)(?![\w])/g;
const cf=h=>String(h).replace(CURRE,(m,sg,n,c)=>sg+c+n);
const when=d=>d===today?'today':d;
const DATE=/^\d{4}-\d{2}-\d{2}$/;
const BIG=1e12,MIN_DATE='2000-01-01';
/* A real calendar date, not before 2000 and not more than 15 years ahead */
const okDate=d=>DATE.test(d||'')&&!isNaN(ts(d))&&iso(ts(d))===d&&d>=MIN_DATE&&d<=off(5475);
const plain=h=>String(h).replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&amp;/g,'&');
/* Finish dates: never more than 100 years out, and never an invalid date */
const MAXD=36500,afterDays=(a,n)=>isFinite(n)&&n>=0&&n<=MAXD?iso(ts(a)+Math.ceil(n)*DAY):'';
const cp=x=>Math.min(100,Math.max(0,Math.round(x)));
const ic=n=>`<svg class="ic" aria-hidden="true" focusable="false"><use href="#i-${n}"/></svg>`;

/* Categories decide which statistics a subject shows. Order matches PRESETS (custom has no presets). */
const CATS={
 money:{l:'Money',d:'Savings, debt, budget',stats:['total','rate','left','proj']},
 trading:{l:'Trading',d:'Trades, profits, losses',stats:['wl','avg','total'],t:'Wins and losses'},
 learning:{l:'Learning',d:'Study, reading, courses',stats:['total','cons','avg','eta']},
 watching:{l:'Watching',d:'Series, movies, episodes',stats:['total','rate','eta']},
 health:{l:'Health & fitness',d:'Exercise, distance, habits',stats:['cons','pr','avg']},
 work:{l:'Work & projects',d:'Tasks, productivity, goals',stats:['total','rate','eta']},
 habits:{l:'Home & habits',d:'Streaks and routines',stats:['streak','cons']},
 custom:{l:'Custom',d:'Track something else',stats:[]}
};
const CAT_KEYS=Object.keys(CATS);
const CATIMG=k=>'cat-'+k+'.png';
const STATLBL={total:'total logged',rate:'pace per day',left:'amount left to goal',proj:'30-day projection',wl:'win rate, wins, losses, best and worst',avg:'average per entry',pr:'personal best',cons:'consistency',streak:'current and longest streak',eta:'finish estimate'};
/* Example placeholders per category: n=name, g=goal, u=unit, s=starting value */
const PH={
 money:{n:'Emergency fund',g:'10000',u:'₱ or $',s:'0'},
 trading:{n:'Trading account',g:'5000',u:'$ or pips',s:'1000'},
 learning:{n:'Study hours',g:'60',u:'hours',s:'0'},
 watching:{n:'Watching One Piece',g:'1000',u:'episodes',s:'0'},
 health:{n:'Running distance',g:'100',u:'km',s:'0'},
 work:{n:'Project tasks',g:'40',u:'tasks',s:'0'},
 habits:{n:'Habit streak',g:'30',u:'days',s:'0'},
 custom:{n:'Anything you want to count',g:'100',u:'optional',s:'0'}
};
const setPH=(p)=>{$('#gn').placeholder=p.n;$('#gt').placeholder=p.g;$('#gu').placeholder=p.u;$('#gs').placeholder=p.s};
const CUSTOM_OPTS=['wl','total','avg','cons','streak','eta'];
const catOf=s=>CATS[s.cat]?s.cat:(s.stats?'trading':'custom');
/* Money (no unit, Money or Trading category) is stored in whole cents: rounded on entry and summed as integers. */
const cents=x=>Math.round(x*100);
const CUR=/^(₱|\$|€|£|¥|₹|php|usd|eur|gbp|jpy|inr|peso|pesos|dollar|dollars|euro|euros)$/i;
const isMoney=s=>(!s.unit||CUR.test(String(s.unit).trim()))&&(catOf(s)==='money'||catOf(s)==='trading');
const statIds=s=>{const c=catOf(s);return c==='custom'?(Array.isArray(s.sel)?s.sel:(s.stats?['wl']:[])):CATS[c].stats};

/* Common topics: [name, starting value, target, unit, optional 1 = show wins and losses]. Picking one only fills the form; everything stays editable. */
const PRESETS=[
 ['Money',[['Savings',0,1000,''],['Emergency fund',0,10000,''],['Pay off a debt',5000,0,'']]],
 ['Trading',[['Trading account',1000,5000,'',1],['Trading profit this month',0,500,'',1],['Crypto portfolio',1000,3000,'',1],['Trades taken',0,100,'trades'],['Winning trades',0,50,'wins']]],
 ['Learning',[['Study hours',0,60,'hours'],['Reading a book',0,300,'pages'],['Books this year',0,12,'books'],['Learning a language',0,1000,'words'],['Online course',0,40,'lessons']]],
 ['Watching',[['Watching a series',0,100,'episodes'],['Watching movies',0,20,'movies'],['Watching One Piece',0,1000,'episodes']]],
 ['Health',[['Workout sessions',0,50,'sessions'],['Running distance',0,100,'km'],['Steps',0,100000,'steps'],['Lose weight',80,70,'kg'],['Drink water',0,100,'glasses'],['Meditation',0,300,'minutes']]],
 ['Work and projects',[['Project tasks',0,40,'tasks'],['Writing',0,20000,'words'],['Job applications',0,30,'applications'],['Side project hours',0,100,'hours']]],
 ['Home and habits',[['Habit streak',0,30,'days'],['Decluttering',0,100,'items'],['Cooking at home',0,20,'meals']]]
];

/* Data starts empty. Each subject owns its plans and entries:
   subject = {id,name,start,target,unit,tls:[{id,name,color,parent,forkAt,hypo}],decs:[{id,tl,date,title,note,amount}]}
   (tls are "plans", decs are "entries" in the interface.) The target can be above or below the start. */
const KEY='chrono_ptm_v1',LEGACY='ptm2';
const SCHEMA=4,BAK=KEY+'_bak',BAKT=KEY+'_baktime',EXPK=KEY+'_lastexport',BAKGAP=36e5;
const lsGet=k=>{try{return localStorage.getItem(k)}catch(e){return null}};
const lsSet=(k,v)=>{try{localStorage.setItem(k,v);return true}catch(e){return false}};
const lsDel=k=>{try{localStorage.removeItem(k)}catch(e){}};
const readJ=k=>{try{return JSON.parse(lsGet(k))}catch(e){return null}};
const valid=o=>o&&Array.isArray(o.subjects);
const DOK=d=>DATE.test(d||'')&&iso(ts(d))===d&&d>='2000-01-01'&&d<='2100-12-31';
let repaired=0;
/* Clean anything loaded from storage, a backup or another tab, so one damaged item cannot break the page. */
function normState(o){
 const out={subjects:[],v:SCHEMA},seen=new Set();let bad=0;
 (valid(o)?o.subjects:[]).forEach(s=>{
  if(!s||typeof s.name!=='string'||!Array.isArray(s.tls)||s.target===''||s.target===null||!isFinite(+s.target)||Math.abs(+s.target)>BIG){bad++;return}
  const ids=new Set(),tls=[];
  s.tls.forEach(x=>{if(!x||typeof x.id!=='string'||!x.id||ids.has(x.id)||typeof x.name!=='string'){bad++;return}ids.add(x.id);tls.push(x)});
  if(!tls.length){bad++;return}
  const byId=Object.create(null);tls.forEach(x=>byId[x.id]=x);
  tls.forEach((x,i)=>{
   if(x.parent!==undefined){
    let ok=typeof x.parent==='string'&&!!byId[x.parent]&&x.parent!==x.id&&DOK(x.forkAt);
    if(ok){let c=byId[x.parent],k=0;for(;c&&k<60;c=byId[c.parent],k++){if(c.id===x.id){ok=false;break}}if(k>=60)ok=false}
    if(!ok){delete x.parent;delete x.forkAt}}
   if(typeof x.color!=='string'||!/^#[0-9a-f]{3,8}$/i.test(x.color))x.color=COLORS[i%COLORS.length];
   if(x.desc!==undefined&&typeof x.desc!=='string')delete x.desc});
  const decs=[];
  (Array.isArray(s.decs)?s.decs:[]).forEach(d=>{
   if(!d||!ids.has(d.tl)||!DOK(d.date)||d.amount===''||d.amount===null||!isFinite(+d.amount)||Math.abs(+d.amount)>BIG){bad++;return}
   d.amount=+d.amount;if(typeof d.id!=='string'||!d.id)d.id=uid();if(typeof d.title!=='string')d.title='Logged';if(typeof d.note!=='string')d.note='';
   if(d.hist!==undefined)d.hist=Array.isArray(d.hist)?d.hist.filter(h=>h&&isFinite(+h.amount)).map(h=>({at:String(h.at||''),date:String(h.date||''),amount:+h.amount,note:String(h.note||'')})):undefined;
   decs.push(d)});
  s.decs=decs;s.tls=tls;
  if(typeof s.id!=='string'||!s.id||seen.has(s.id))s.id=uid();seen.add(s.id);
  s.target=+s.target;s.start=isFinite(+s.start)&&s.start!==''&&s.start!==null?+s.start:0;
  if(typeof s.unit!=='string')s.unit='';
  if(!CATS[s.cat])s.cat=s.stats?'trading':'custom';
  s.sel=Array.isArray(s.sel)?s.sel.filter(k=>STATLBL[k]):[];
  out.subjects.push(s)});
 repaired=bad;return out;
}
let S,recovered=false,migrated=false;
{const raw=lsGet(KEY);let o=readJ(KEY);
 if(!valid(o)){
  const l=readJ(LEGACY);
  if(raw===null&&valid(l)){o=l;migrated=true;const lb=lsGet(LEGACY+'_bak');if(lb&&lsGet(BAK)===null)lsSet(BAK,lb)}
  else{const b=readJ(BAK);if(valid(b)&&b.subjects.length){o=b;recovered=true}}
 }
 S=normState(valid(o)?o:{subjects:[]});}
const U={},X={cds:null,cdt:null,rst:0,help:S.subjects.length===0};
const subj=id=>S.subjects.find(x=>x.id===id);
const st=s=>U[s.id]||(U[s.id]={tl:s.tls[0].id,asof:today,tab:'history',all:false,addOpen:false,w:{per:10,ev:1,len:30,sp:1,from:''},M:{},ext:[]});
const tlOf=(s,id)=>s.tls.find(t=>t.id===id);
const startOf=s=>+s.start||0;
const prog=(s,v)=>(v-startOf(s))/((s.target-startOf(s))||1)*100;
const reached=(s,v)=>s.target>=startOf(s)?v>=s.target:v<=s.target;
const toward=(s,a)=>a*(s.target-startOf(s))>0;

function range(s){const ds=s.decs.map(d=>d.date).concat(today,s.tls.map(t=>t.forkAt||today),(U[s.id]&&U[s.id].ext)||[],s.begin&&okDate(s.begin)?[s.begin]:[]);const lo=ds.reduce((a,b)=>a<b?a:b);let mx=ds.reduce((a,b)=>a>b?a:b);
 /* With an end date the timeline stops there. Without one, it shows at least two weeks ahead. */
 if(s.end&&okDate(s.end)){if(s.end>mx)mx=s.end}else if(mx<off(14))mx=off(14);return[lo,mx]}
function eff(s,id,a){const t=tlOf(s,id);let o=[];if(t.parent)o=eff(s,t.parent,t.forkAt<a?t.forkAt:a);return o.concat(s.decs.filter(d=>d.tl===id&&d.date<=a))}
const val=(s,id,a)=>{const e=eff(s,id,a);return isMoney(s)?(cents(startOf(s))+e.reduce((n,d)=>n+cents(d.amount),0))/100:Math.round((startOf(s)+e.reduce((n,d)=>n+d.amount,0))*1e9)/1e9};
/* Pace is always measured from the first real entry of the selected plan up to the day being viewed. */
const firstDay=(s,id,a)=>{let m=null;eff(s,id,a).forEach(d=>{if(d.amount!==0&&(m===null||d.date<m))m=d.date});return m||a};
const daysSoFar=s=>{const u=st(s);return Math.max(1,(ts(u.asof)-ts(firstDay(s,u.tl,u.asof)))/DAY+1)};
const meter=(v,s,c)=>`<div class="meter"><i style="width:${Math.max(0,Math.min(100,prog(s,v)))}%;background:${c}"></i><b style="left:25%"></b><b style="left:50%"></b><b style="left:75%"></b></div>`;
function ring(p,c){const r=34,C=2*Math.PI*r,o=C*(1-Math.min(100,p)/100);
 return`<svg class="ring" viewBox="0 0 80 80" role="img" aria-label="${p}% of the way"><circle cx="40" cy="40" r="${r}" fill="none" style="stroke:var(--line)" stroke-width="7"/><circle cx="40" cy="40" r="${r}" fill="none" style="stroke:${c}" stroke-width="7" stroke-linecap="round" stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${o.toFixed(1)}" transform="rotate(-90 40 40)"/><text x="40" y="46" text-anchor="middle">${p}%</text></svg>`}
const etaText=(s,v)=>{
 if(reached(s,v))return'You have reached the goal.';
 const mv=(v-startOf(s))/daysSoFar(s);
 if(mv*(s.target-startOf(s))<=0)return'No progress toward the goal yet.';
 const d=afterDays(st(s).asof,(s.target-v)/mv);return d?`At this pace you reach it around ${d}.`:'At this pace it would take more than 100 years.';
};
const un=s=>s.unit?' '+esc(s.unit):'';
const opts=(s,sel)=>s.tls.map(t=>`<option value="${t.id}" ${t.id===sel?'selected':''}>${esc(t.name)}</option>`).join('');
const pick=(cur,list)=>list.map(([v,l])=>`<option value="${v}" ${+cur===v?'selected':''}>${l}</option>`).join('');

/* ---------- Left side: the number and the one daily action ---------- */
function railTop(s){
 const u=st(s),t=tlOf(s,u.tl),v=val(s,t.id,u.asof),p=Math.min(100,cp(prog(s,v)));
 const tt=u.asof!==today?`<p class="tt">${ic('travel')}<span>Time travel: viewing <b>${u.asof}</b></span><button class="link" data-act="today" data-id="${s.id}">${ic('calendar')}<span>Back to today</span></button></p>`:'';
 return`<p class="tag">[ ${esc(CATS[catOf(s)].l)} ]</p><div class="rail-head"><h2 class="name">${esc(s.name)}</h2>${ring(p,s.tls.length>1?t.color:'var(--accent)')}</div>${tt}<div class="big ${fmt(v).length>=11?'l3':fmt(v).length>=8?'l2':''}"><b class="num">${fmt(v)}</b><span>${s.target>=startOf(s)?'of ':'down to '}${fmt(s.target)}${un(s)}</span></div>
 <p class="say">${s.tls.length>1?`On <b>${esc(t.name)}</b> you`:'You'} are ${p}% of the way. ${etaText(s,v)}</p>
 <div class="quick"><label for="ql-${s.id}">Did something today?</label><div class="pill"><input id="ql-${s.id}" class="keep" data-quick="${s.id}" type="number" step="any" placeholder="Amount" aria-label="Amount to log for today"><button class="sm" data-act="quick" data-id="${s.id}">${ic('check')}<span>Log today</span></button></div></div>`;
}
function railBot(s){return`<button class="link" data-act="delsubj" data-id="${s.id}">${ic('trash')}<span>${X.cds===s.id?'Click again to remove':'Remove this subject'}</span></button>`}

/* ---------- Right side: plan picker and tabs ---------- */
function tabsPart(s){
 const u=st(s);
 const plans=s.tls.length>1?`<div class="plans"><span class="mut">Plan</span>${s.tls.map(t=>`<button class="pathbtn ${t.id===u.tl?'on':''}" data-sel="${t.id}" data-s="${s.id}" aria-pressed="${t.id===u.tl}"><span class="chip" style="background:${t.color}"></span>${esc(t.name)}</button>`).join('')}${(tlOf(s,u.tl)||{}).desc?`<span class="mut" style="flex-basis:100%">${esc(tlOf(s,u.tl).desc)}</span>`:''}</div>`:'';
 const tabs=[['history','History','chart'],['whatif','What if?','wand'],['travel','Time travel','travel']].map(([k,l,i])=>`<button class="tab ${u.tab===k?'on':''}" id="tab-${s.id}-${k}" data-act="tab" data-id="${s.id}" data-t="${k}" role="tab" aria-selected="${u.tab===k}" aria-controls="panel-${s.id}" tabindex="${u.tab===k?0:-1}">${ic(i)}<span>${l}</span></button>`).join('');
 return plans+`<div class="tabs" role="tablist" aria-label="${esc(s.name)} views">${tabs}</div>`;
}

function chart(s){
 const u=st(s),[lo,hi]=range(s),n=Math.round((ts(hi)-ts(lo))/DAY)||1,W=640,H=230,L=68,R=12,T=16,B=28;
 const stp=Math.max(1,Math.ceil(n/400));
 const ser=s.tls.map(t=>{const by={},p=[];let top=-Infinity,bot=Infinity;eff(s,t.id,hi).forEach(z=>by[z.date]=(by[z.date]||0)+z.amount);let run=startOf(s);for(let i=0;i<=n;i++){run+=by[iso(ts(lo)+i*DAY)]||0;if(run>top)top=run;if(run<bot)bot=run;if(i%stp===0||i===n)p.push([i,run])}return{t,p,top,bot}});
 const mx=Math.max(startOf(s),s.target,...ser.map(z=>z.top)),mn=Math.min(startOf(s),s.target,...ser.map(z=>z.bot));
 const x=i=>L+i/n*(W-L-R),y=v=>T+(1-(v-mn)/((mx-mn)||1))*(H-T-B),ax=Math.round((ts(u.asof)-ts(lo))/DAY);
 let o=`<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="${esc(s.name)} over time" style="min-width:440px">`;
 o+=`<line x1="${L}" x2="${W-R}" y1="${y(s.target)}" y2="${y(s.target)}" stroke="var(--mute)" stroke-dasharray="5 4"/><text class="mut" x="${L+4}" y="${y(s.target)-6}">goal ${fmt(s.target)}</text>`;
 o+=`<text class="mut" x="${L-8}" y="${y(mn)+4}" text-anchor="end">${fmt(mn)}</text><text class="mut" x="${L-8}" y="${y(mx)+4}" text-anchor="end">${fmt(mx)}</text><text class="mut" x="${L}" y="${H-7}">${lo}</text><text class="mut" x="${W-R}" y="${H-7}" text-anchor="end">${hi}</text>`;
 const dk=S.subjects.indexOf(s)%2===1,lt=h=>/^#[0-9a-f]{6}$/i.test(h)?'#'+[1,3,5].map(i=>Math.round(parseInt(h.substr(i,2),16)*.45+255*.55).toString(16).padStart(2,'0')).join(''):h,mx_=x(ax),right=mx_>W/2,ly=s.target>=startOf(s)?H-B-8:T+14;
 o+=`<defs><clipPath id="cl-${s.id}"><rect x="0" y="0" width="${mx_}" height="${H}"/></clipPath><clipPath id="cr-${s.id}"><rect x="${mx_}" y="0" width="${W}" height="${H}"/></clipPath></defs>`;
 o+=`<line x1="${mx_}" x2="${mx_}" y1="${T}" y2="${H-B}" stroke="var(--ink)" stroke-width="1.5" stroke-dasharray="4 4" opacity=".6"/><text x="${mx_+(right?-6:6)}" y="${ly}" text-anchor="${right?'end':'start'}" style="font-weight:700">${u.asof===today?'Today':u.asof}</text>`;
 ser.forEach(({t,p},k)=>{const dy=(k-(ser.length-1)/2)*2,pts=p.map(([i,v],k)=>k?x(i)+','+y(p[k-1][1])+' '+x(i)+','+y(v):x(i)+','+y(v)).join(' ');
  const mk=d=>`<polyline fill="none" stroke="${dk?lt(t.color):t.color}" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round" ${d||(t.hypo?'stroke-dasharray="6 5"':'')} transform="translate(0,${dy})" points="${pts}"/>`;
  o+=`<g opacity="${t.id===u.tl?1:.55}"><g clip-path="url(#cl-${s.id})">${mk()}</g><g clip-path="url(#cr-${s.id})" opacity=".45">${mk('stroke-dasharray="2 7"')}</g></g>`});
 return o+'</svg>';
}

/* ---------- What if ---------- */
const MONTH=365.25/12,YEAR=365.25;
const EVERY=[[1/24,'hour'],[1,'day'],[7,'week'],[MONTH,'month'],[YEAR,'year']],SPAN=[[1/24,'hours'],[1,'days'],[7,'weeks'],[MONTH,'months'],[YEAR,'years']];
const nameOf=(list,v,d)=>(list.find(x=>x[0]===+v)||[0,d])[1];
const spanName=w=>{const n=nameOf(SPAN,w.sp,'days');return +w.len===1?n.replace(/s$/,''):n};
const spanDays=w=>Math.max(1,Math.round(w.len*w.sp));
function wiFrom(s){const u=st(s),w=u.w,p=tlOf(s,w.tl);let f=w.from||u.asof;if(p&&p.forkAt&&f<p.forkAt)f=p.forkAt;return f}
/* Only call it "profit" or "amount" when the subject really is money (no unit like hours or trades) */
const wiNoun=s=>s.unit&&!isMoney(s)?'':(catOf(s)==='trading'?'profit':'amount');
const cap=t=>t.charAt(0).toUpperCase()+t.slice(1);
const wiLabel=(s,w)=>(wiNoun(s)?wiNoun(s)+' of ':'')+fmt(w.per)+un(s)+' per '+nameOf(EVERY,w.ev,'day')+' for '+w.len+' '+spanName(w);
function wiResult(s){
 const u=st(s),w=u.w;if(!tlOf(s,w.tl))w.tl=u.tl;
 const from=wiFrom(s),base=val(s,w.tl,from),total=w.len*w.sp,add=w.per*(total/w.ev),plan=base+add,perDay=w.per/w.ev,dir=s.target-startOf(s);
 const mv=(base-startOf(s))/Math.max(1,(ts(from)-ts(firstDay(s,w.tl,from)))/DAY+1),keep=base+mv*total,end=iso(ts(from)+spanDays(w)*DAY);
 if(!end||!okDate(end))return'<p class="answer">That goes too far ahead.</p><p>What if can look up to 15 years from today. Try a shorter time or an earlier start.</p>';
 const left=reached(s,plan)?0:Math.abs(s.target-plan);
 let hit;
 if(reached(s,base))hit='The goal is already met by then.';
 else if(perDay*dir>0){const d=Math.ceil((s.target-base)/perDay),dt=afterDays(from,d);hit=dt?`At this rate you would reach the goal in ${d} days, around ${dt}.`:'At this rate it would take more than 100 years to reach the goal.'}
 else hit='This moves you away from the goal.';
 return`<p class="answer">${cap(wiLabel(s,w))} gets you to ${fmt(plan)}${un(s)} by ${end}.</p><p>That is ${Math.round(prog(s,plan))}% of your goal, with ${fmt(left)}${un(s)} to go. It starts from ${fmt(base)}${un(s)} on ${when(from)}. If you keep your current pace instead, you would end at ${fmt(keep)}${un(s)}. ${hit}</p><button class="outline" data-act="wisave" data-id="${s.id}">${ic('bookmark')}<span>Save as a plan to compare</span></button>`;
}

/* ---------- Tab contents ---------- */
function trendOf(s,es,to){
 const t0=ts(to),sumR=(a,b)=>es.filter(d=>{const k=(t0-ts(d.date))/DAY;return k>=a&&k<=b}).reduce((n,d)=>n+d.amount,0);
 const r=sumR(0,6),p=sumR(7,13);if(!r&&!p)return null;
 const dir=Math.sign(s.target-startOf(s))||1,df=(r-p)*dir;
 return{r,p,dir:df>0?'up':df<0?'down':'flat'};
}
/* Returns [label, value, cls] cells for the statistics this subject's category calls for. */
function analytics(s,es,to,v){
 es=es.filter(d=>d.amount!==0);if(!es.length)return[];
 const u=un(s),dir=Math.sign(s.target-startOf(s))||1,am=es.map(d=>d.amount),sum=am.reduce((a,b)=>a+b,0);
 const dates=[...new Set(es.map(d=>d.date))].sort(),span=Math.max(1,Math.round((ts(to)-ts(dates[0]))/DAY)+1),pace=sum/span;
 const cl=a=>a===0?'':toward(s,a)?'pos':'neg';
 const best=am.reduce((a,b)=>a*dir>=b*dir?a:b),worst=am.reduce((a,b)=>a*dir<=b*dir?a:b);
 let run=1,longest=1;for(let i=1;i<dates.length;i++){run=(ts(dates[i])-ts(dates[i-1]))/DAY===1?run+1:1;if(run>longest)longest=run}
 const cur=(ts(to)-ts(dates[dates.length-1]))/DAY<=1?run:0,wins=es.filter(d=>toward(s,d.amount)).length;
 const C={
  total:[['Total logged',sgn(sum)+u,cl(sum)]],
  rate:[['Pace per day',sgn(pace)+u,cl(pace)]],
  left:[['Left to goal',reached(s,v)?'Done':fmt(Math.abs(s.target-v))+u,'']],
  proj:[['In 30 days',fmt(v+pace*30)+u,'']],
  wl:[['Win rate',Math.round(wins/es.length*100)+'%',''],['Wins',wins,'pos'],['Losses',es.length-wins,'neg'],['Best',sgn(best)+u,cl(best)],['Worst',sgn(worst)+u,cl(worst)]],
  avg:[['Average per entry',sgn(sum/es.length)+u,cl(sum)]],
  pr:[['Personal best',sgn(best)+u,cl(best)]],
  cons:[['Consistency',Math.round(dates.length/span*100)+'%','']],
  streak:[['Current streak',cur+(cur===1?' day':' days'),''],['Longest streak',longest+(longest===1?' day':' days'),'']],
  eta:[['Finish estimate',reached(s,v)?'Reached':pace*dir>0?(afterDays(to,(s.target-v)/pace)||'Over 100 years'):'No estimate','']]
 };
 return[].concat(...statIds(s).map(k=>C[k]||[]));
}
function statsHTML(s,t,u){
 const ids=statIds(s);if(!ids.length)return'';
 const c=CATS[catOf(s)],h=`<h3 class="mini">${c.t||'Your numbers'}</h3>`,es=eff(s,t.id,u.asof).filter(d=>d.amount!==0);
 if(!es.length)return h+`<p class="intro">Log a few entries and your ${ids.map(k=>STATLBL[k]).join(', ')} will show up here.</p>`;
 return h+`<div class="stats">${analytics(s,es,u.asof,val(s,t.id,u.asof)).map(([l,x,k])=>`<div class="stat"><span>${l}</span><b class="${k}">${x}</b></div>`).join('')}</div>`;
}
/* Forecast: pace, finish date, trend and the pace needed. Estimates only. */
function forecastHTML(s){
 const u=st(s),t=tlOf(s,u.tl),to=u.asof,all=eff(s,t.id,to).filter(d=>d.amount!==0),v=val(s,t.id,to),un_=un(s),h='<h3 class="mini fc">Where you are heading</h3>';
 if(all.length<2)return h+'<p class="intro">Log at least two entries and Chrono will estimate your pace, trend and finish date. These are estimates, not guarantees.</p>';
 const pace=(v-startOf(s))/daysSoFar(s),dir=s.target-startOf(s),tr=trendOf(s,all,to),done=reached(s,v);
 const finish=done?'Reached':pace*dir>0?(afterDays(to,(s.target-v)/pace)||'Over 100 years'):'No estimate';
 const trT=!tr?'Not enough recent entries to tell.':tr.dir==='up'?`Improving. The last 7 days (${sgn(tr.r)}${un_}) beat the 7 before (${sgn(tr.p)}${un_}).`:tr.dir==='down'?`Declining. The last 7 days (${sgn(tr.r)}${un_}) are weaker than the 7 before (${sgn(tr.p)}${un_}).`:'Steady compared with the previous 7 days.';
 return h+`<div class="stats"><div class="stat"><span>Current pace</span><b>${sgn(pace)}${un_}/day</b></div><div class="stat"><span>Finish if pace holds</span><b>${finish}</b></div>${done?'':`<div class="stat"><span>Needed for 30 days</span><b>${fmt(Math.abs(s.target-v)/30)}${un_}/day</b></div>`}</div><p class="intro" style="margin-top:12px">Trend: ${trT} Forecasts are estimates, not guarantees.</p>`;
}
function histBody(s){
 const u=st(s),t=tlOf(s,u.tl),all=s.decs.filter(d=>d.tl===t.id).sort((a,b)=>b.date.localeCompare(a.date)),mine=u.all?all:all.slice(0,6);
 const dd=t.forkAt&&today<t.forkAt?t.forkAt:today;
 return`<div class="scroll">${chart(s)}</div>${s.tls.length>1?`<div class="legend">${s.tls.map(x=>`<span><span class="chip" style="background:${x.color}"></span>${esc(x.name)}</span>`).join('')}</div>`:''}
 ${statsHTML(s,t,u)}
 <h3 class="mini">Your entries${s.tls.length>1?' on '+esc(t.name):''}</h3>${t.parent&&tlOf(s,t.parent)?`<p class="small mut" style="margin:-4px 0 8px">Entries before ${t.forkAt} come from ${esc(tlOf(s,t.parent).name)}.</p>`:''}
 <ul class="log">${mine.map(d=>{const c=d.amount===0?'':toward(s,d.amount)?'pos':'neg';if(u.edit===d.id)return`<li><div class="form" style="margin:0;width:100%"><input id="ed-d-${s.id}" class="keep" type="date" value="${d.date}" aria-label="Date"><input id="ed-a-${s.id}" class="keep" type="number" step="any" value="${d.amount}" aria-label="Amount"><input id="ed-n-${s.id}" class="grow keep" value="${d.title==='Logged'||d.title==='Daily log'?'':esc(d.title)}" placeholder="Note (optional)" aria-label="Note"><button data-act="saveedit" data-id="${s.id}" data-d="${d.id}">${ic('check')}<span>Save</span></button><button class="outline" data-act="canceledit" data-id="${s.id}">Cancel</button></div></li>`;
 return`<li class="${d.date>u.asof?'later':''}"><span class="ei ${c}">${ic(d.amount===0?'check':d.amount<0?'down':'up')}</span><div class="ec"><span class="fx ${c}">${sgn(d.amount)}${un(s)}</span><span class="mut small">${d.date}${d.date>today?', planned':''}</span>${d.hist&&d.hist.length?`<span class="mut small" title="${esc(d.hist.map(h=>'Was '+sgn(h.amount)+' on '+h.date+' (changed '+h.at+')').join('; '))}"> · edited</span>`:''}${d.title&&d.title!=='Logged'&&d.title!=='Daily log'?`<br><span>${esc(d.title)}</span>`:''}${d.note?` <span class="mut small">${esc(d.note)}</span>`:''}</div><button class="icon" data-act="editdec" data-id="${s.id}" data-d="${d.id}" aria-label="Edit this entry" title="Edit this entry">${ic('pen')}</button><button class="icon" data-act="deldec" data-id="${s.id}" data-d="${d.id}" aria-label="Remove this entry" title="Remove this entry">${ic('trash')}</button></li>`}).join('')||'<li class="empty">Nothing logged yet. Type an amount on the left and press Log today.</li>'}</ul>
 ${all.length>6?`<button class="link" data-act="showall" data-id="${s.id}"><span>${u.all?'Show fewer':'Show all '+all.length}</span></button>`:''}
 <p style="margin-top:18px"><button class="outline sm" data-act="toggleadd" data-id="${s.id}">${ic(u.addOpen?'x':'plus')}<span>${u.addOpen?'Close':'Add an entry for another day'}</span></button></p>
 ${u.addOpen?`<div class="form"><input id="dd-${s.id}" type="date" value="${dd}" aria-label="Date"><input id="dv-${s.id}" class="keep" type="number" step="any" placeholder="Amount" aria-label="Amount"><input id="dt-${s.id}" class="keep grow" placeholder="Note (optional)" aria-label="Note"><button data-act="add" data-id="${s.id}">${ic('plus')}<span>Add entry</span></button></div><p class="small mut" style="margin-top:6px">Pick any date, past or planned. Use a minus amount to go the other way.</p>`:''}`;
}
function wiBody(s){
 const u=st(s),w=u.w;if(!tlOf(s,w.tl))w.tl=u.tl;
 return`<p class="intro">See where a habit would take you before you start. Nothing here changes your real entries.</p>
 <div class="wi-grid">
  ${s.tls.length>1?`<label class="wf"><span>Plan</span><select data-wi="tl" data-s="${s.id}">${opts(s,w.tl)}</select></label>`:''}
  <label class="wf"><span>Plan name (optional)</span><input class="keep" id="wn-${s.id}" maxlength="60" placeholder="e.g. Binge weekends"></label>
  <label class="wf"><span>Starting on</span><input type="date" data-wi="from" data-s="${s.id}" value="${wiFrom(s)}"></label>
  <label class="wf"><span>${wiNoun(s)?cap(wiNoun(s)):'How much'}${s.unit?' ('+esc(s.unit)+')':''}</span><input type="number" step="any" data-wi="per" data-s="${s.id}" value="${w.per}"></label>
  <label class="wf"><span>Per</span><select data-wi="ev" data-s="${s.id}">${pick(w.ev,EVERY)}</select></label>
  <div class="wf" role="group" aria-label="For how long"><span>For how long</span><div class="pair"><input type="number" min="1" step="any" data-wi="len" data-s="${s.id}" value="${w.len}" aria-label="How long"><select data-wi="sp" data-s="${s.id}" aria-label="Time unit">${pick(w.sp,SPAN)}</select></div></div>
 </div>
 <div class="result" id="wir-${s.id}">${wiResult(s)}</div>${forecastHTML(s)}`;
}
function travelBody(s){
 const u=st(s),t=tlOf(s,u.tl),v=val(s,t.id,u.asof),canDel=s.tls.length>1&&!s.tls.some(x=>x.parent===t.id),delKey=s.id+'|'+t.id;
 const rows=s.tls.length>1?`<h3 class="mini">Compare your plans on ${when(u.asof)}</h3>`+s.tls.map(p=>{const pv=val(s,p.id,u.asof),pc=prog(s,pv);
  return`<div class="prow ${p.id===u.tl?'on':''}" data-sel="${p.id}" data-s="${s.id}" role="button" tabindex="0" aria-pressed="${p.id===u.tl}"><div class="prow-top"><span class="pname"><span class="chip" style="background:${p.color}"></span>${esc(p.name)}</span><span><b>${fmt(pv)}${un(s)}</b> <span class="mut small">${cp(pc)}% of the way</span></span></div>${p.desc?`<div class="mut small" style="margin-left:20px">${esc(p.desc)}</div>`:''}${meter(pv,s,p.color)}</div>`}).join(''):'';
 return`<p class="answer">${u.asof===today?'Today':'On '+u.asof}, ${s.tls.length>1?esc(t.name)+' is':'you are'} at ${fmt(v)}${un(s)} (${cp(prog(s,v))}% of your goal).</p>
 <p class="intro" style="margin-top:8px">${u.asof>today?'This is a future day, so it counts the entries you planned.':u.asof<today?'This is how things stood on that day.':'Drag the slider or pick a date above to see any past or future day.'}</p>
 ${rows}
 <h3 class="mini">Try a different plan from ${when(u.asof)}</h3>
 <p class="intro" style="margin-bottom:12px">A plan is a separate version of your log, so you can compare choices side by side.</p>
 <div class="branch"><input id="bn-${s.id}" class="keep" placeholder="Name the new plan (optional)" aria-label="Name for the new plan"><button data-act="branch" data-id="${s.id}">${ic('branch')}<span>Start new plan</span></button>${canDel?`<button class="link" data-act="deltl" data-id="${s.id}" data-t="${t.id}">${ic('trash')}<span>${X.cdt===delKey?'Click again to delete':'Delete '+esc(t.name)}</span></button>`:''}</div>`;
}
/* Coach: one short, category-specific note under the numbers. Estimates only. */
function coach(s){
 const u=st(s),t=tlOf(s,u.tl),to=u.asof,es=eff(s,t.id,to).filter(d=>d.amount!==0),v=val(s,t.id,to),c=catOf(s),un_=un(s);
 const box=(chip,k,a,b)=>`<div class="coach"><div class="co-h"><b>Coach</b>${chip?`<span class="co-chip ${k}">${chip}</span>`:''}</div><p>${a}</p>${b?`<p class="co-s">${b}</p>`:''}</div>`;
 if(reached(s,v))return box('Goal reached','ahead','You reached your goal. Add a new subject to keep the momentum going.','');
 const dir=Math.sign(s.target-startOf(s))||1,rem=Math.abs(s.target-v),endOk=s.end&&okDate(s.end)&&s.end>to;
 const left=endOk?Math.max(1,Math.round((ts(s.end)-ts(to))/DAY)):30,need=rem/left,when=endOk?'by '+s.end:'in 30 days';
 const rec=es.filter(d=>(ts(to)-ts(d.date))/DAY<7),p7=rec.reduce((a,d)=>a+d.amount,0)/7*dir,days7=new Set(rec.map(d=>d.date)).size;
 let chip=!es.length?'':p7>=need*1.05?['Ahead','ahead']:p7>=need*.9?['On track','ok']:['Behind','behind'];
 const over=s.end&&okDate(s.end)&&s.end<=to,need_=`${over?'Your end date has passed. ':''}To finish ${when} you need about ${fmt(need)}${un_} a day.`;
 let a=need_,b='';
 if(!es.length){a='Log your first entry and Chrono will start coaching you. '+need_}
 else if(c==='money'){a=`Save about ${fmt(need)}${un_} a day (${fmt(need*7)}${un_} a week) to finish ${when}.`;b='Tip: move your saving to payday so it happens first.'}
 else if(c==='trading'){const w=es.filter(d=>toward(s,d.amount)),l=es.filter(d=>!toward(s,d.amount)),avg=x=>x.length?Math.abs(x.reduce((n,d)=>n+d.amount,0)/x.length):0;
  let streak=0;for(let i=es.length-1;i>=0&&!toward(s,es[i].amount);i--)streak++;
  a=`Average win ${fmt(avg(w))}${un_} against average loss ${fmt(avg(l))}${un_}.`;
  b=streak>=3?`${streak} losses in a row. Consider pausing and reviewing your last trades.`:avg(l)>avg(w)&&w.length?'Your losses are bigger than your wins. Try smaller losses before chasing bigger wins.':'Tip: write down why you took each trade, not only the result.'}
 else if(c==='learning'){a=`You studied on ${days7} of the last 7 days. ${need_}`;b=days7>=5?'Great rhythm. Keep sessions short and regular.':'Tip: pick a fixed time. Short daily sessions beat one long one.'}
 else if(c==='watching'){a=need_;b=p7>0?`At your recent pace (${fmt(p7)}${un_}/day) you would finish in about ${Math.ceil(rem/p7)} days.`:'Tip: queue the next episode before you stop for the day.'}
 else if(c==='health'){a=`You logged ${days7} of the last 7 days. You need about ${fmt(need*7)}${un_} a week to finish ${when}.`;b='Small steady steps beat big jumps. Rest days count.'}
 else if(c==='work'){a=`${fmt(rem)}${un_} left. ${need_}`;b='Tip: pick your next three items and finish one before anything else.'}
 else if(c==='habits'){const ds=[...new Set(es.map(d=>d.date))].sort();let run=0;if(ds.length&&(ts(to)-ts(ds[ds.length-1]))/DAY<=1){run=1;for(let i=ds.length-1;i>0&&(ts(ds[i])-ts(ds[i-1]))/DAY===1;i--)run++}
  const today_=ds.includes(to);a=today_?`Streak safe today. You are on ${run} ${run===1?'day':'days'}.`:run?`Log today to keep your ${run}-day streak alive.`:'No active streak. Log today to start a new one.';b='Tip: attach the habit to something you already do every day.'}
 else{b='Tip: log a little every day so the estimate stays accurate.'}
 if(over&&es.length){chip=['Overdue','behind'];if(!a.startsWith('Your end'))a='Your end date has passed. '+a}
 return box(chip[0]||'',chip[1]||'',a,b);
}
function body(s){const u=st(s);return u.tab==='whatif'?wiBody(s):u.tab==='travel'?travelBody(s):coach(s)+histBody(s)}

/* The time travel slider lives in the band shell and is never replaced, so dragging it stays smooth. */
function shell(s,i){
 return`<section class="band ${i%2?'dark':'light'}" id="b-${s.id}" aria-label="${esc(s.name)}"><div class="wrap cols"><aside class="rail"><div data-part="top"></div><div data-part="bot"></div></aside>
 <div><div data-part="tabs"></div>
 <div class="travelbar" hidden><label for="sl-${s.id}" class="small mut">Drag to travel</label><input id="sl-${s.id}" data-sl="${s.id}" type="range" min="0" max="0" value="0"><output for="sl-${s.id}"></output><div class="jump"><label for="gd-${s.id}" class="small mut">Or jump to a date</label><input id="gd-${s.id}" data-goto="${s.id}" type="date" aria-label="Jump to a past or future date"><button class="outline sm" data-act="today" data-id="${s.id}">${ic('calendar')}<span>Today</span></button></div></div>
 <div data-part="body" role="tabpanel" id="panel-${s.id}" tabindex="0"></div></div></div></section>`;
}
function refresh(s,noSave){
 try{refreshInner(s)}catch(err){console.error(err);
  const el=document.getElementById('b-'+s.id);
  if(el){try{el.querySelector('[data-part=bot]').innerHTML=railBot(s)}catch(e2){}
   const bd=el.querySelector('[data-part=body]');if(bd)bd.innerHTML='<p class="empty">This subject could not be shown because some of its data looks damaged. Use Export to keep a copy, then remove this subject on the left.</p>'}}
 if(!noSave)saveSoon();
}
function refreshInner(s){
 const el=document.getElementById('b-'+s.id);if(!el)return;
 const u=st(s),[lo,hi]=range(s);if(u.asof<lo)u.asof=lo;if(u.asof>hi)u.asof=hi;if(!tlOf(s,u.tl))u.tl=s.tls[0].id;
 const keep={};el.querySelectorAll('.keep').forEach(i=>keep[i.id]=i.value);
 el.querySelector('[data-part=top]').innerHTML=cf(railTop(s));
 el.querySelector('[data-part=bot]').innerHTML=cf(railBot(s));
 el.querySelector('[data-part=tabs]').innerHTML=tabsPart(s);
 el.querySelector('[data-part=body]').innerHTML=cf(body(s));
 el.querySelector('.travelbar').hidden=u.tab!=='travel';
 const rl=el.querySelector('.travelbar>label');if(rl)rl.textContent='Drag to travel ('+lo+' to '+hi+')';
 const sl=el.querySelector('[data-sl]');sl.max=Math.round((ts(hi)-ts(lo))/DAY);sl.value=Math.round((ts(u.asof)-ts(lo))/DAY);
 el.querySelector('output').textContent=u.asof===today?'Today':u.asof;
 el.querySelector('[data-goto]').value=u.asof;
 for(const id in keep){const f=document.getElementById(id);if(f)f.value=keep[id]}
 el.querySelector('[data-part=body]').setAttribute('aria-labelledby','tab-'+s.id+'-'+u.tab);
}

/* ---------- Page ---------- */
function helpBand(){
 return`<section class="band dark help" id="b-help" aria-label="How it works"><div class="wrap">
 <p class="tag">[ How it works ]</p>
 <h1>Track anything. See where you’ll be.</h1>
 <p class="lead">Pick something you want to count, log your progress, and travel in time to see where you stood, or where a new habit could take you.</p>
 <ol class="steps">
  <li><span class="stepic">${ic('plus')}</span><b>1. Add a subject</b><span class="t">Pick a kind of thing, like Money or Learning, and set a goal. Chrono shows the statistics that fit.</span></li>
  <li><span class="stepic">${ic('pen')}</span><b>2. Log your progress</b><span class="t">Each day, type what you did and press Log today.</span></li>
  <li><span class="stepic">${ic('travel')}</span><b>3. Look back or ahead</b><span class="t">Open Time travel to see any past or future day.</span></li>
  <li><span class="stepic">${ic('wand')}</span><b>4. Test an idea</b><span class="t">Open What if? to see where, for example, 10 a day for 30 days would take you.</span></li>
 </ol>
 <p class="term"><b>What is a plan?</b> A plan is one version of your log. Every subject starts with one. Saving a What if creates a second plan, so you can compare them side by side in Time travel.</p>
 <p style="margin-top:28px"><button class="outline sm" data-act="help">${ic(S.subjects.length?'x':'check')}<span>${S.subjects.length?'Close this guide':'Got it'}</span></button></p>
 </div></section>`;
}
function addBand(){
 const dark=S.subjects.length%2===1;
 return`<section class="band ${dark?'dark':'light'} addband" id="new-subject" aria-label="Add a subject"><div class="wrap">
 <div class="addhead"><div class="ah-l"><p class="tag">[ New subject ]</p><h2 class="h2">Add a subject</h2></div>
 <p class="ah-r">A subject is anything you want to count, like savings, study hours or episodes watched.</p></div>
 <div class="fields">
  <div class="field wide"><span>1. What kind of thing is it?</span><small>This decides which statistics Chrono shows you.</small><div class="cats">${Object.entries(CATS).map(([k,c])=>`<button type="button" class="catcard" data-cat="${k}" aria-pressed="false"><img class="em" src="${CATIMG(k)}" alt="" onerror="this.hidden=true"><b>${c.l}</b><span>${c.d}</span></button>`).join('')}</div><p class="catinfo" id="catinfo" aria-live="polite"></p></div>
 </div>
 <div class="principles"><div class="pr-l"><p class="tag">[ Your goal ]</p><h3>Name it and set a goal</h3><p>Tell Chrono what you want to count and where you want to end up.</p><label class="field wide" id="gtwrap" hidden><span>Pick a topic to fill this in (optional)</span><select id="gtopic" aria-label="Common topics"></select></label><details class="more"><summary>More options</summary><div class="fields"><label class="field"><span>Starting at</span><input id="gs" class="keep" type="number" step="any" placeholder="0"><small>Leave empty to start at 0. To count down, like weight or a debt, start higher than your goal.</small></label><label class="field"><span>Start date</span><input id="gb" class="keep" type="date"><small>Optional. The day you began. Leave empty to start from your first entry.</small></label><label class="field"><span>End date</span><input id="ge" class="keep" type="date"><small>Optional. The day you want to reach your goal. Leave empty and the timeline scales on its own.</small></label></div></details></div>
 <div class="pr-r">
  <div class="field wide" id="gcwrap" hidden><span>Which statistics do you want?</span><div class="cks">${CUSTOM_OPTS.map(k=>`<label><input type="checkbox" class="gc" value="${k}" ${k==='avg'||k==='cons'?'checked':''}>${STATLBL[k][0].toUpperCase()+STATLBL[k].slice(1)}</label>`).join('')}</div></div>
  <label class="field"><span>2. What do you want to track?</span><input id="gn" class="keep" placeholder="Watching One Piece"></label>
  <label class="field"><span>3. What is your goal?</span><input id="gt" class="keep" type="number" step="any" placeholder="1000"></label>
  <label class="field"><span>What are you counting?</span><input id="gu" class="keep" placeholder="episodes"><small>Optional. Shown next to your numbers.</small></label>
 <p style="margin-top:30px"><button data-act="addsubj">${ic('plus')}<span>Add subject</span></button></p>
 </div></div>
 </div></section>`;
}
/* One view at a time, so the page never scrolls: a subject, the add form, or the guide */
function setView(){
 const ids=S.subjects.map(x=>x.id);let v=X.view;
 if(v!=='new'&&!ids.includes(v))v=ids[0]||'new';
 X.view=v;const cur=X.help?'b-help':v==='new'?'new-subject':'b-'+v;
 document.querySelectorAll('#board>.band').forEach(b=>b.classList.toggle('cur',b.id===cur));
 $('#board').scrollTop=0;
 $('#switch').innerHTML=S.subjects.map((x,i)=>`<button class="vchip ${!X.help&&v===x.id?'on':''}" data-act="view" data-id="${x.id}"><i style="background:${x.tls[0].color}"></i><span>${esc(x.name)}</span></button>`).join('')+`<button class="vchip add ${!X.help&&v==='new'?'on':''}" data-act="view" data-id="new">${ic('plus')}<span>New subject</span></button>`;
}
function build(){
 X.cat=null;
 $('#board').innerHTML=(X.help?helpBand():'')+S.subjects.map(shell).join('')+addBand();
 X.typed=false;
 S.subjects.forEach(s=>refresh(s,true));
 document.documentElement.style.setProperty('--hh',$('#lnav').offsetHeight+'px');
 setView();
 save();
}
let saveT=0,pending=false,warnedFull=false;
function saveSoon(){pending=true;clearTimeout(saveT);saveT=setTimeout(save,250)}
function flushSave(){if(pending)save()}
function backupLabel(){const t=+lsGet(BAKT);return t&&lsGet(BAK)?'Restore backup from '+new Date(t).toLocaleString([],{dateStyle:'medium',timeStyle:'short'}):'Restore last backup'}
function setStatus(ok){
 const n=S.subjects.length,last=lsGet(EXPK),el=$('#save-status');if(!el)return;
 el.textContent=ok===false?'Not saved. Your browser blocked storage or it is full. Export your data now.':n+' subject'+(n===1?'':'s')+'. Saved in this browser only. Last export: '+(last||'never')+'.';
}
function save(){
 pending=false;clearTimeout(saveT);
 const r=$('#rst span');if(r)r.textContent='Erase all data';X.rst=0;X.rsb=0;
 let cur;try{cur=JSON.stringify(S)}catch(e){setStatus(false);return}
 let ok=true;const prev=lsGet(KEY);
 if(prev!==cur){
  /* Keep a backup of the state before this change: at most once an hour, or straight away when a lot of data disappears. */
  if(prev&&(!lsGet(BAK)||Date.now()-(+lsGet(BAKT)||0)>BAKGAP||cur.length<prev.length*.8)){
   try{const pj=JSON.parse(prev);if(valid(pj)&&pj.subjects.length){lsSet(BAK,prev);lsSet(BAKT,String(Date.now()))}}catch(e){}}
  ok=lsSet(KEY,cur);
  if(!ok){lsDel(BAK);lsDel(BAKT);ok=lsSet(KEY,cur)} /* storage full: give up the backup to make room */
 }
 if(ok&&lsGet(KEY)===cur&&lsGet(LEGACY)!==null){lsDel(LEGACY);lsDel(LEGACY+'_bak')}
 const rb=$('#rstb');if(rb){rb.hidden=!lsGet(BAK);const sp=rb.querySelector('span');if(sp)sp.textContent=backupLabel()}
 setStatus(ok);
 if(!ok&&!warnedFull){warnedFull=true;toast('Your changes could not be saved. Export your data now so nothing is lost.')}
}
function quickLog(id){
 rollDay();
 const s=subj(id);if(!s)return;const inp=$('#ql-'+id),v=+inp.value;
 if(inp.value===''||!isFinite(v)||Math.abs(v)>BIG){inp.focus();toast('Enter a number below one trillion.');return}
 const u=st(s),p=tlOf(s,u.tl);let date=today;if(p.forkAt&&date<p.forkAt)date=p.forkAt;
 s.decs.push({id:uid(),tl:p.id,date,title:'Logged',note:'',amount:isMoney(s)?cents(v)/100:v});
 inp.value='';if(u.asof<date)u.asof=date;refresh(s);toast('Logged '+sgn(v)+plain(un(s))+(date===today?' for today.':' on '+date+' (this plan starts then).'));
}
function updInfo(){
 const k=X.cat,i=$('#catinfo');if(!i)return;if(!k){i.textContent='';return}
 const ids=k==='custom'?[...document.querySelectorAll('.gc:checked')].map(c=>c.value):CATS[k].stats;
 i.textContent=ids.length?'History and reports will show: '+ids.map(x=>STATLBL[x]).join(', ')+'.':'No extra statistics. Tick some above if you want them.';
}
function pickCat(k){
 X.cat=k;document.querySelectorAll('.catcard').forEach(b=>{const on=b.dataset.cat===k;b.classList.toggle('on',on);b.setAttribute('aria-pressed',on)});
 const gi=CAT_KEYS.indexOf(k),custom=k==='custom';
 $('#gtwrap').hidden=custom;$('#gcwrap').hidden=!custom;
 $('#gtopic').innerHTML='<option value="">Choose a topic (optional)</option>'+(custom?'':PRESETS[gi][1].map((p,i)=>`<option value="${gi}-${i}">${esc(p[0])}${p[3]?' ('+esc(p[3])+')':''}</option>`).join(''));
 if(!X.typed)['gn','gs','gt','gu','ge','gb'].forEach(i=>{const e=$('#'+i);if(e)e.value=''});setPH(PH[k]);updInfo();
}
function addSubject(){
 const n=$('#gn').value.trim(),tv=$('#gt').value,v=+tv,sv=$('#gs').value===''?0:+$('#gs').value;
 if(!n){toast('Give your subject a name first.');$('#gn').focus();return}
 if(tv===''||!isFinite(v)||!isFinite(sv)||Math.abs(v)>BIG||Math.abs(sv)>BIG){toast('Enter a goal number.');$('#gt').focus();return}
 if(v===sv){toast('Your goal must be different from where you start.');$('#gt').focus();return}
 const bv=$('#gb').value;if(bv&&(!okDate(bv)||bv>today||(!!$('#ge').value&&bv>=$('#ge').value))){toast('Pick a start date that is today or earlier, and before the end date.');const dm=document.querySelector('.addband .more');if(dm)dm.open=true;$('#gb').focus();return}
 const ev=$('#ge').value;if(ev&&(!okDate(ev)||ev<=today)){toast('Pick an end date after today, within 15 years.');const dm=document.querySelector('.addband .more');if(dm)dm.open=true;$('#ge').focus();return}
 const ns={id:uid(),name:n.slice(0,120),start:sv,target:v,unit:$('#gu').value.trim().slice(0,30),cat:X.cat||'custom',sel:(!X.cat||X.cat==='custom')?[...document.querySelectorAll('.gc:checked')].map(c=>c.value):[],stats:false,tls:[{id:uid(),name:'My plan',color:COLORS[0]}],decs:[]};
 if(ev)ns.end=ev;if(bv)ns.begin=bv;
 S.subjects.push(ns);X.help=false;X.cat=null;X.view=ns.id;build();
 toast('Added. Type today’s amount on the left and press Log today.');
}

/* ---------- Events ---------- */
const raf={};
document.addEventListener('input',e=>{const t=e.target;
 if(t.dataset&&t.dataset.sl){const s=subj(t.dataset.sl);if(!s)return;U[s.id].asof=iso(ts(range(s)[0])+t.value*DAY);
  if(!raf[s.id])raf[s.id]=requestAnimationFrame(()=>{raf[s.id]=0;if(subj(s.id))refresh(s,true)})}
 if(['gn','gt','gu','gs','ge','gb'].includes(t.id))X.typed=true});
document.addEventListener('change',e=>{const t=e.target;
 if(['rs','rpd','rf','rt'].includes(t.id)){renderReport();return}
 if(t.classList.contains('gc')){updInfo();return}
 if(t.id==='gtopic'){const v=t.value;X.typed=false;
  if(v==='custom'||v===''){['gn','gs','gt','gu'].forEach(k=>$('#'+k).value='');}
  else{const[g,i]=v.split('-').map(Number),p=PRESETS[g][1][i];setPH({n:p[0],g:String(p[2]),u:p[3]||PH[CAT_KEYS[g]].u,s:String(p[1])});$('#gn').value=p[0];$('#gs').value=p[1]===0?'':p[1];$('#gt').value=p[2];$('#gu').value=p[3];const dm=document.querySelector('.addband .more');if(dm)dm.open=p[1]!==0}
  return}
 if(t.dataset.goto){const s=subj(t.dataset.goto);if(s&&okDate(t.value)){const u=st(s);u.asof=t.value;u.ext.push(t.value);refresh(s,true)}else if(s){toast('Pick a real date between 2000 and 15 years from now.');t.value=st(s).asof}return}
 if(t.dataset.wi){const s=subj(t.dataset.s);if(!s)return;const k=t.dataset.wi,w=st(s).w;
  if(k==='from'&&t.value&&!okDate(t.value)){toast('Pick a real date between 2000 and 15 years from now.');t.value=wiFrom(s);return}
  w[k]=['per','len','ev','sp'].includes(k)?(+t.value||0):t.value;
  if(w.len<=0)w.len=1;if(!w.ev)w.ev=1;if(!w.sp)w.sp=1;
  if(Math.abs(w.per)>BIG){w.per=0;t.value=0;toast('Enter a number below one trillion.')}
  const maxLen=Math.max(1,Math.floor(5475/w.sp));
  if(w.len>maxLen){w.len=maxLen;const li=document.querySelector('[data-wi="len"][data-s="'+s.id+'"]');if(li)li.value=w.len;toast('What if looks at most 15 years ahead.')}
  const box=document.getElementById('wir-'+s.id);if(box)box.innerHTML=wiResult(s)}});
document.addEventListener('keydown',e=>{
 if(e.key==='Escape'&&!$('#report').hidden){closeReport();return}
 if((e.key==='Enter'||e.key===' ')&&e.target.matches('[data-sel][tabindex]')){e.preventDefault();e.target.click()}
 if(e.key==='Enter'&&e.target.dataset&&e.target.dataset.quick){e.preventDefault();quickLog(e.target.dataset.quick)}
 if(e.key==='Enter'&&['gn','gt','gu','gs'].includes(e.target.id)){e.preventDefault();addSubject()}
 if(e.key==='Enter'&&/^(dv|dt|dd)-/.test(e.target.id||'')){e.preventDefault();const bt=document.querySelector('[data-act="add"][data-id="'+e.target.id.slice(3)+'"]');if(bt)bt.click()}
 if(e.target.matches&&e.target.matches('button.tab')&&['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){
  const tb=[...e.target.parentElement.querySelectorAll('button.tab')],i=tb.indexOf(e.target),j=e.key==='Home'?0:e.key==='End'?tb.length-1:(i+(e.key==='ArrowRight'?1:-1)+tb.length)%tb.length,nid=tb[j].id;
  e.preventDefault();tb[j].click();setTimeout(()=>{const n=document.getElementById(nid);if(n)n.focus()},0)}});
window.addEventListener('resize',()=>document.documentElement.style.setProperty('--hh',$('#lnav').offsetHeight+'px'));

/* Text size: five levels, remembered in this browser. */
const TS_LEVELS=[['Small',.9],['Default',1],['Medium',1.12],['Large',1.25],['Extra large',1.4]];
function setTS(i,keep){i=Math.max(0,Math.min(4,i|0));document.documentElement.style.setProperty('--fs',TS_LEVELS[i][1]);document.documentElement.style.setProperty('--fsd',1+(TS_LEVELS[i][1]-1)*.4);
 if(!keep)lsSet('chrono_ptm_ts',String(i));
 document.querySelectorAll('.tsopt').forEach(b=>b.setAttribute('aria-pressed',+b.dataset.ts===i))}
(function(){const m=$('#tsmenu');if(!m)return;
 m.innerHTML=TS_LEVELS.map((l,i)=>`<button type="button" class="tsopt" data-ts="${i}" aria-pressed="false"><b style="font-size:${12+i*3}px">A</b><span>${l[0]}</span></button>`).join('');
 const v=lsGet('chrono_ptm_ts');setTS(v===null||v===''||isNaN(+v)?1:+v,true)})();
function tsMenu(open){const m=$('#tsmenu'),b=$('#tsbtn');m.hidden=!open;b.setAttribute('aria-expanded',open)}
document.addEventListener('click',e=>{
 if(e.target.closest('#tsbtn')){tsMenu($('#tsmenu').hidden);return}
 const o=e.target.closest('.tsopt');if(o){setTS(+o.dataset.ts);return}
 if(!e.target.closest('#tsmenu'))tsMenu(false)});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('#tsmenu').hidden){tsMenu(false);$('#tsbtn').focus();e.stopImmediatePropagation()}},true);
/* Full screen for the work area: the whole page goes full screen where the browser allows it, and the work area fills it. */
function setFS(on){
 document.body.classList.toggle('fs',on);
 const b=$('#fsbtn');if(b){b.setAttribute('aria-pressed',on);b.setAttribute('aria-label',on?'Exit full screen':'Full screen');b.dataset.tip=on?'Exit full screen (Esc)':'Full screen';
  b.querySelector('use').setAttribute('href',on?'#i-shrink':'#i-expand')}
 try{if(on&&!document.fullscreenElement&&document.documentElement.requestFullscreen)document.documentElement.requestFullscreen().catch(()=>{});
  else if(!on&&document.fullscreenElement&&document.exitFullscreen)document.exitFullscreen().catch(()=>{})}catch(e){}
}
document.addEventListener('fullscreenchange',()=>{if(!document.fullscreenElement&&document.body.classList.contains('fs'))setFS(false)});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.body.classList.contains('fs')&&$('#report').hidden)setFS(false)});
document.addEventListener('click',e=>{
 const t=e.target,b=t.closest('[data-act]'),sel=t.closest('[data-sel]'),cc=t.closest('[data-cat]');
 if(cc){pickCat(cc.dataset.cat);return}
 if(b){const a=b.dataset.act,id=b.dataset.id,s=id&&subj(id);
  if(a!=='delsubj')X.cds=null;if(a!=='deltl')X.cdt=null;
  if(a==='report')return openReport();
  if(a==='rclose')return closeReport();
  if(a==='rprint')return window.print();
  if(a==='rhtml')return repDownload('html');
  if(a==='rcsv')return repDownload('csv');
  if(a==='export')return doExport();
  if(a==='import')return $('#imp').click();
  if(a==='view'){if(X.help){X.help=false;X.view=id;build()}else{X.view=id;setView()}return}
  if(a==='fs')return setFS(!document.body.classList.contains('fs'));
  if(a==='help'){X.help=!X.help;build();return}
  if(a==='newsubj'){if(X.help){X.help=false;X.view='new';build()}else{X.view='new';setView()}setTimeout(()=>{const g=$('#gtopic');if(g)g.focus({preventScroll:true})},80);return}
  if(a==='restore'){const bk=readJ(BAK);if(!valid(bk)||!bk.subjects.length){toast('There is no backup to restore.');return}
   if(!X.rsb){X.rsb=1;(b.querySelector('span')||b).textContent='Click again to replace what you have now';return}
   X.rsb=0;const curJ=JSON.stringify(S);S=normState(bk);for(const k in U)delete U[k];X.help=false;lsSet(BAK,curJ);lsSet(BAKT,String(Date.now()));build();toast('Backup restored. What you had before is now the backup, so you can switch back.');return}
  if(a==='reset'){if(!X.rst){X.rst=1;(b.querySelector('span')||b).textContent='Click again to erase everything for good';return}
   const old=S;S={subjects:[],v:SCHEMA};for(const k in U)delete U[k];X.help=true;
   [KEY,BAK,BAKT,EXPK,LEGACY,LEGACY+'_bak'].forEach(lsDel);build();
   return toast('Everything was erased from this browser, including the backup.',()=>{S=old;X.help=false;build()})}
  if(a==='addsubj')return addSubject();
  if(a==='delsubj'){if(X.cds!==id){X.cds=id;return refresh(s)}const gone=s,gi=S.subjects.indexOf(s);S.subjects=S.subjects.filter(x=>x.id!==id);delete U[id];X.cds=null;build();return toast('Subject removed.',()=>{S.subjects.splice(Math.min(gi,S.subjects.length),0,gone);build()})}
  if(a==='quick')return quickLog(id);
  if(!s)return;const u=st(s);
  if(a==='tab')u.tab=b.dataset.t;
  else if(a==='today')u.asof=today;
  else if(a==='showall')u.all=!u.all;
  else if(a==='toggleadd')u.addOpen=!u.addOpen;
  else if(a==='branch'){const p=tlOf(s,u.tl),nm=$('#bn-'+id).value.trim(),n={id:uid(),name:nm||'Plan from '+u.asof,color:COLORS[s.tls.length%COLORS.length],parent:p.id,forkAt:u.asof<(p.forkAt||'')?p.forkAt:u.asof};s.tls.push(n);u.tl=n.id;$('#bn-'+id).value='';u.tab='history';toast('Started “'+n.name+'”. Add entries to it, and compare plans in Time travel.')}
  else if(a==='add'){const p=tlOf(s,u.tl),am=$('#dv-'+id);if(am.value===''||!isFinite(+am.value)||Math.abs(+am.value)>BIG){am.focus();toast('Enter a number below one trillion.');return}
   if(!okDate($('#dd-'+id).value||today)){toast('Pick a real date between 2000 and 15 years from now.');return}
   let date=$('#dd-'+id).value||today;if(p.forkAt&&date<p.forkAt){date=p.forkAt;toast('This plan starts on '+date+', so the entry was placed on that day.')}
   s.decs.push({id:uid(),tl:p.id,date,title:$('#dt-'+id).value.trim().slice(0,200)||'Logged',note:'',amount:isMoney(s)?cents(+am.value)/100:+am.value});
   ['dt-','dv-'].forEach(k=>{$('#'+k+id).value=''})}
  else if(a==='editdec'){document.querySelectorAll('#b-'+id+' [id^="ed-"]').forEach(i=>i.remove());u.edit=b.dataset.d}
  else if(a==='canceledit')u.edit=null;
  else if(a==='saveedit'){const d=s.decs.find(x=>x.id===b.dataset.d),p=tlOf(s,d.tl),nv=$('#ed-a-'+id).value;let nd=$('#ed-d-'+id).value;
   if(nv===''||!isFinite(+nv)||Math.abs(+nv)>BIG){toast('Enter a number below one trillion.');return}
   if(!okDate(nd)){toast('Pick a real date between 2000 and 15 years from now.');return}
   if(p.forkAt&&nd<p.forkAt)nd=p.forkAt;
   const kids=s.tls.some(c=>c.parent===d.tl&&(d.date<=c.forkAt||nd<=c.forkAt));
   (d.hist=d.hist||[]).push({at:today,date:d.date,amount:d.amount,note:d.title==='Logged'?'':d.title});if(d.hist.length>20)d.hist.shift();
   d.date=nd;d.amount=isMoney(s)?cents(+nv)/100:+nv;d.title=$('#ed-n-'+id).value.trim().slice(0,200)||'Logged';u.edit=null;toast('Entry updated. The old value is kept in its edit history.'+(kids?' Plans branched from this one will change too.':''))}
  else if(a==='deldec'){const dd=s.decs.find(x=>x.id===b.dataset.d),ix=s.decs.indexOf(dd);s.decs=s.decs.filter(x=>x.id!==dd.id);const kids=s.tls.some(c=>c.parent===dd.tl&&dd.date<=c.forkAt);toast('Entry removed.'+(kids?' Plans branched from this one will change too.':''),()=>{s.decs.splice(Math.min(ix,s.decs.length),0,dd);refresh(s)})}
  else if(a==='deltl'){const tid=b.dataset.t,key=id+'|'+tid;if(X.cdt!==key){X.cdt=key;return refresh(s)}
   const rem=s.decs.filter(d=>d.tl===tid),tl=tlOf(s,tid),ti=s.tls.indexOf(tl);
   s.decs=s.decs.filter(d=>d.tl!==tid);s.tls=s.tls.filter(x=>x.id!==tid);u.tl=s.tls[0].id;X.cdt=null;
   toast('Plan deleted.',()=>{s.tls.splice(Math.min(ti,s.tls.length),0,tl);s.decs.push(...rem);refresh(s)})}
  else if(a==='wisave'){const w=u.w,from=wiFrom(s),total=w.len*w.sp,label=plain(wiLabel(s,w)),end=iso(ts(from)+spanDays(w)*DAY),n={id:uid(),name:($('#wn-'+id).value.trim().slice(0,60)||'What if #'+(s.tls.filter(x=>x.hypo).length+1)),desc:label,color:COLORS[s.tls.length%COLORS.length],parent:w.tl,forkAt:from,hypo:true};
   if(!end||!okDate(end)||!okDate(from)){toast('That goes too far ahead. What if can look up to 15 years from today.');return}
   s.tls.push(n);{const sum=w.per*(total/w.ev),days=spanDays(w),step=days>366?7:1;let prev=0;for(let d=step;;d+=step){if(d>=days)d=days;s.decs.push({id:uid(),tl:n.id,date:iso(ts(from)+d*DAY),title:label,note:'Hypothetical',amount:isMoney(s)?(Math.round(sum*100*d/days)-Math.round(sum*100*prev/days))/100:sum*(d-prev)/days});prev=d;if(d===days)break}}
   $('#wn-'+id).value='';w.from='';u.asof=end;u.ext.push(end);u.tl=n.id;u.tab='travel';toast('Saved as a new plan. Compare it with your other plan below.')}
  return refresh(s)}
 if(sel){const s=subj(sel.dataset.s);if(s){st(s).tl=sel.dataset.sel;refresh(s)}}
});

/* ---------- Report ---------- */
const REPORT_CSS=`
.rp,.rp *{-webkit-print-color-adjust:exact;print-color-adjust:exact;box-sizing:border-box}
.rp{font:15px/1.55 Inter,system-ui,-apple-system,"Segoe UI",sans-serif;font-weight:500;color:#111;background:#fff}
.rp h1,.rp h2,.rp h3,.rp p{margin:0}
.rp-kicker{font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#666}
.rp h1{font-size:36px;font-weight:800;letter-spacing:-.035em;line-height:1.1;margin-top:6px}
.rp-date{color:#555;margin-top:6px}
.rp-sub{margin-top:36px;padding-top:24px;border-top:2px solid #111}
.rp-sub h2{font-size:24px;font-weight:800;letter-spacing:-.025em;break-after:avoid}
.rp-say{margin-top:8px;color:#333;max-width:46em}
.rp h3{font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#666;margin:26px 0 6px;break-after:avoid}
.rp-track{height:10px;border-radius:5px;background:#e6e6e6;margin-top:14px;overflow:hidden}
.rp-track i{display:block;height:100%;background:#ff6740;border-radius:5px}
.rp-kv{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:16px 20px;margin-top:18px}
.rp-kv span{display:block;font-size:12px;color:#666;font-weight:700;text-transform:uppercase;letter-spacing:.05em}
.rp-kv b{font-size:21px;font-weight:800;letter-spacing:-.02em}
.rp table{width:100%;border-collapse:collapse;font-size:14px;margin-top:6px}
.rp th{text-align:left;color:#666;font-weight:700;font-size:12px;text-transform:uppercase;letter-spacing:.05em;padding:8px 10px 8px 0;border-bottom:1px solid #bbb}
.rp td{padding:8px 10px 8px 0;border-bottom:1px solid #eee;vertical-align:top}
.rp tr{break-inside:avoid}
.rp .num{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
.rp .up{color:#13803f}.rp .dn{color:#c4264d}
.rp ul{margin:6px 0 0;padding-left:20px}.rp li{margin-top:5px}
.rp-note{font-size:13px;color:#666;margin-top:8px}
.rp svg{max-width:100%;height:auto;break-inside:avoid}
.rp-foot{margin-top:40px;font-size:13px;color:#777}
body.rp-doc{margin:0;background:#f2f2f2;padding:32px 16px}
.rp-doc .rp{max-width:820px;margin:0 auto;padding:48px;border-radius:16px}
@page{margin:14mm}
@media print{body.rp-doc{background:#fff;padding:0}.rp-doc .rp{padding:0;border-radius:0;max-width:none}}
`;
(function(){const el=document.createElement('style');el.textContent=REPORT_CSS;(document.head||document.body).appendChild(el)})();

function repData(s,from,to){
 const u=st(s),t=tlOf(s,u.tl),vNow=val(s,t.id,to),vStart=val(s,t.id,iso(ts(from)-DAY));
 const es=eff(s,t.id,to).filter(d=>d.date>=from).sort((a,b)=>a.date.localeCompare(b.date));
 const days=Math.max(1,Math.round((ts(to)-ts(from))/DAY)+1),change=vNow-vStart,pace=change/days,dir=s.target-startOf(s);
 let eta=null,far=false;if(!reached(s,vNow)&&pace*dir>0){eta=afterDays(to,(s.target-vNow)/pace)||null;far=!eta}
 return{t,vNow,vStart,es,days,change,pace,eta,far,pct:prog(s,vNow),done:reached(s,vNow)};
}
function repChart(s,d,from,to){
 const n=Math.round((ts(to)-ts(from))/DAY),step=Math.max(1,Math.ceil(n/300)),by={};
 d.es.forEach(e=>by[e.date]=(by[e.date]||0)+e.amount);
 const pts=[];let run=d.vStart;
 for(let k=0;k<=n;k++){run+=by[iso(ts(from)+k*DAY)]||0;if(k%step===0||k===n)pts.push([k,run])}
 const W=640,H=220,L=58,R=16,T=14,B=30,all=pts.map(q=>q[1]).concat(startOf(s),s.target),mx=Math.max(...all),mn=Math.min(...all);
 const x=k=>L+(n?k/n:0)*(W-L-R),y=v=>T+(1-(v-mn)/((mx-mn)||1))*(H-T-B),tx='style="fill:#555;font-size:12px"';
 const last=pts[pts.length-1];
 return`<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="${esc(s.name)} over the period"><line x1="${L}" x2="${W-R}" y1="${y(s.target)}" y2="${y(s.target)}" stroke="#888" stroke-dasharray="5 4"/><text ${tx} x="${L+4}" y="${y(s.target)-6}">goal ${fmt(s.target)}</text><text ${tx} x="${L-8}" y="${y(mn)+4}" text-anchor="end">${fmt(mn)}</text><text ${tx} x="${L-8}" y="${y(mx)+4}" text-anchor="end">${fmt(mx)}</text><text ${tx} x="${L}" y="${H-8}">${from}</text><text ${tx} x="${W-R}" y="${H-8}" text-anchor="end">${to}</text><polyline fill="none" stroke="#ff6740" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round" points="${pts.map(q=>x(q[0])+','+y(q[1])).join(' ')}"/><circle cx="${x(last[0])}" cy="${y(last[1])}" r="5" fill="#ff6740"/></svg>`;
}
function insights(s,d,to){
 const u=un(s),L=[],dir=Math.sign(s.target-startOf(s))||1,by={};
 d.es.forEach(e=>by[e.date]=(by[e.date]||0)+e.amount);
 const ks=Object.keys(by);
 L.push(`Current performance: ${fmt(d.vNow)}${u}, which is ${cp(d.pct)}% of the way to ${fmt(s.target)}${u}.`);
 L.push(`Change in this period: ${sgn(d.change)}${u}, about ${sgn(d.pace)}${u} per day.`);
 if(ks.length>1){const b=ks.reduce((a,c)=>by[a]*dir>=by[c]*dir?a:c),w=ks.reduce((a,c)=>by[a]*dir<=by[c]*dir?a:c);L.push(`Best and worst days: ${b} was the strongest (${sgn(by[b])}${u}) and ${w} was the weakest (${sgn(by[w])}${u}).`)}
 L.push(d.done?'The goal has been reached.':d.eta?`Estimated completion: around ${d.eta} if this pace holds. This is an estimate, not a guarantee.`:d.far?'At this pace the goal is more than 100 years away.':'No completion date can be estimated yet, because the pace is not moving toward the goal.');
 const tr=trendOf(s,eff(s,d.t.id,to).filter(e=>e.amount!==0),to);
 if(tr&&tr.dir==='down')L.push(`Possible problem: the last 7 days (${sgn(tr.r)}${u}) are weaker than the 7 before (${sgn(tr.p)}${u}).`);
 if(tr&&tr.dir==='up')L.push(`Good sign: the last 7 days (${sgn(tr.r)}${u}) beat the 7 before (${sgn(tr.p)}${u}).`);
 if(!d.done&&d.pace*(s.target-startOf(s))>0){const e2=afterDays(to,(s.target-d.vNow)/(d.pace*1.2));if(e2)L.push(`To improve: a pace 20% higher would bring the finish forward to about ${e2}.`)}
 else if(!d.done)L.push('To improve: log some progress toward the goal so a finish date can be estimated.');
 return L;
}
function repSection(s,from,to){
 const d=repData(s,from,to),u=un(s),cl=a=>a===0?'':toward(s,a)?'up':'dn',an=analytics(s,d.es,to,d.vNow);
 const say=`Between ${from} and ${to}, ${esc(s.name)}${s.tls.length>1?' (plan: '+esc(d.t.name)+')':''} moved from ${fmt(d.vStart)}${u} to ${fmt(d.vNow)}${u}, a change of ${sgn(d.change)}${u}, about ${sgn(d.pace)}${u} per day. `+(d.done?'The goal has been reached.':d.eta?`At that pace the goal of ${fmt(s.target)}${u} would be reached around ${d.eta}.`:d.far?'At that pace the goal is more than 100 years away.':'There was no progress toward the goal in this period, so no finish date can be estimated.');
 const shown=d.es.length>400?d.es.slice(-400):d.es;
 const kv=(l,v,c)=>`<div><span>${l}</span><b class="${c||''}">${v}</b></div>`;
 return`<section class="rp-sub"><h2>${esc(s.name)}</h2><p class="rp-say">${d.t.hypo?'<b>Hypothetical plan, not actual records.</b> ':''}${say}</p>
 <div class="rp-track"><i style="width:${Math.max(0,Math.min(100,d.pct))}%"></i></div>
 <div class="rp-kv">${kv('Now',fmt(d.vNow)+u)}${kv('Goal',fmt(s.target)+u)}${kv('Progress',cp(d.pct)+'%')}${kv('Change',sgn(d.change)+u,cl(d.change))}${kv('Per day in period',sgn(d.pace)+u,cl(d.pace))}${kv('Entries',d.es.length)}${kv('Finish around',d.done?'Reached':d.eta||(d.far?'Over 100 years':'No estimate'))}</div>
 ${an.length?`<h3>${CATS[catOf(s)].t||'Key statistics'}</h3><div class="rp-kv">${an.map(([l,x,c])=>kv(l,x,c==='pos'?'up':c==='neg'?'dn':'')).join('')}</div>`:''}
 <h3>What this means</h3><ul>${insights(s,d,to).map(x=>`<li>${x}</li>`).join('')}</ul>
 <h3>Over time</h3>${repChart(s,d,from,to)}
 <h3>Entries</h3>${shown.length?`<table><thead><tr><th>Date</th><th class="num">Amount</th><th>Note</th></tr></thead><tbody>${shown.map(e=>`<tr><td>${e.date}${e.date>today?' (planned)':''}</td><td class="num ${cl(e.amount)}">${sgn(e.amount)}${u}</td><td>${esc([e.title!=='Logged'&&e.title!=='Daily log'?e.title:'',e.note].filter(Boolean).join(' - '))}</td></tr>`).join('')}</tbody></table>${d.es.length>400?`<p class="rp-note">Showing the latest 400 of ${d.es.length} entries. The CSV file has all of them.</p>`:''}`:'<p class="rp-note">No entries in this period.</p>'}
 ${s.tls.length>1?`<h3>Plans compared on ${to}</h3><table><thead><tr><th>Plan</th><th class="num">Value</th><th class="num">Progress</th></tr></thead><tbody>${s.tls.map(p=>{const v=val(s,p.id,to);return`<tr><td>${esc(p.name)}${p.hypo?' (what if)':''}</td><td class="num">${fmt(v)}${u}</td><td class="num">${cp(prog(s,v))}%</td></tr>`}).join('')}</tbody></table>`:''}
 </section>`;
}
function reportHTML(subs,from,to){return cf(reportHTML0(subs,from,to))}
function reportHTML0(subs,from,to){
 const sum=subs.length>1?`<h3 style="margin-top:30px">Summary</h3><table><thead><tr><th>Subject</th><th class="num">Now</th><th class="num">Goal</th><th class="num">Progress</th><th class="num">Change</th></tr></thead><tbody>${subs.map(s=>{const d=repData(s,from,to),u=un(s);return`<tr><td>${esc(s.name)}${d.t.hypo?' (what if)':''}</td><td class="num">${fmt(d.vNow)}${u}</td><td class="num">${fmt(s.target)}${u}</td><td class="num">${cp(d.pct)}%</td><td class="num ${d.change===0?'':toward(s,d.change)?'up':'dn'}">${sgn(d.change)}${u}</td></tr>`}).join('')}</tbody></table>`:'';
 return`<header><div class="rp-kicker">Chrono, Personal Time Machine</div><h1>Progress report</h1><p class="rp-date">${from} to ${to}${to>today?' (includes planned entries)':''}. Generated ${today}.</p>${subs.some(s=>s.tls.length>1)?'<p class="rp-note">Subjects with several plans show the plan that is selected on screen.</p>':''}</header>${sum}${subs.map(s=>repSection(s,from,to)).join('')}<p class="rp-foot">Generated with Personal Time Machine.</p>`;
}
function repScope(){const v=$('#rs').value;return v==='all'||!subj(v)?S.subjects:[subj(v)]}
function repRange(subs){
 const p=$('#rpd').value;let from,to=today;
 if(p==='custom'){const f=$('#rf').value,t2=$('#rt').value;from=okDate(f)?f:off(-29);to=okDate(t2)?t2:today;if(from>to){const x=from;from=to;to=x}$('#rf').value=from;$('#rt').value=to}
 else if(p==='all'){const ds=[].concat(...subs.map(s=>s.decs.map(d=>d.date)).filter(a=>a.length)).filter(d=>d<=today);from=ds.length?ds.reduce((a,b)=>a<b?a:b):today}
 else from=off(-((+p||30)-1));
 return[from,to];
}
function renderReport(){
 const subs=repScope(),[from,to]=repRange(subs);
 $('#rcustom').hidden=$('#rpd').value!=='custom';
 $('#rp-body').innerHTML=reportHTML(subs,from,to);
}
const setInert=on=>document.querySelectorAll('body>header,body>main,body>footer,body>.lp,body>section').forEach(e=>{e.inert=on});
function openReport(){
 if(!S.subjects.length){toast('Add a subject first, then you can generate a report.');return}
 $('#rs').innerHTML='<option value="all">All subjects</option>'+S.subjects.map(s=>`<option value="${s.id}">${esc(s.name)}</option>`).join('');
 $('#rs').value='all';$('#rpd').value='30';$('#rf').value=off(-29);$('#rt').value=today;
 $('#report').hidden=false;document.body.classList.add('rp-open');document.body.style.overflow='hidden';setInert(true);
 renderReport();$('#rp-close').focus();
}
function closeReport(){
 $('#report').hidden=true;document.body.classList.remove('rp-open');document.body.style.overflow='';setInert(false);
 const b=document.querySelector('[data-act=report]');if(b)b.focus();
}
function download(name,type,text){
 const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type}));a.download=name;document.body.appendChild(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}
function repCSV(subs,from,to){
 const q=v=>'"'+String(v).replace(/"/g,'""')+'"',T=v=>/^[=+\-@\t\r]/.test(String(v))?"'"+v:v,rows=[['Subject','Plan','Date','Amount','Unit','Note','Total after','Type']];
 subs.forEach(s=>{const d=repData(s,from,to);let run=d.vStart;
  d.es.forEach(e=>{run+=e.amount;rows.push([T(s.name),T(d.t.name),e.date,isMoney(s)?e.amount.toFixed(2):e.amount,T(s.unit||''),T([e.title!=='Logged'&&e.title!=='Daily log'?e.title:'',e.note].filter(Boolean).join(' - ')),isMoney(s)?(Math.round(run*100)/100).toFixed(2):Math.round(run*1e6)/1e6,d.t.hypo?'Hypothetical':'Actual'])})});
 return{text:'\ufeff'+rows.map(r=>r.map(q).join(',')).join('\r\n'),count:rows.length-1};
}
function repDownload(kind){
 const subs=repScope(),[from,to]=repRange(subs);
 if(kind==='csv'){const c=repCSV(subs,from,to);if(!c.count){toast('There are no entries in this period to put in a CSV.');return}
  download('entries-'+from+'-to-'+to+'.csv','text/csv;charset=utf-8',c.text);toast('Downloaded '+c.count+' entr'+(c.count===1?'y':'ies')+' as CSV.');return}
 const html='<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Progress report '+from+' to '+to+'</title><style>'+REPORT_CSS+'</style></head><body class="rp-doc"><article class="rp">'+reportHTML(subs,from,to)+'</article></body></html>';
 download('progress-report-'+from+'-to-'+to+'.html','text/html;charset=utf-8',html);toast('Report downloaded. Open it in any browser.');
}

/* ---------- Export and import ---------- */
function toast(msg,undo){const t=$('#toast');t.textContent=cf(msg);t.style.pointerEvents=undo?'auto':'';
 if(undo){const b=document.createElement('button');b.className='sm';b.style.cssText='margin-left:12px;background:#000;color:#fff;min-height:30px;padding:2px 14px';b.textContent='Undo';b.onclick=()=>{t.classList.remove('on');t.style.pointerEvents='';undo()};t.appendChild(b)}
 t.classList.add('on');clearTimeout(toast.h);toast.h=setTimeout(()=>{t.classList.remove('on');t.style.pointerEvents=''},undo?9000:4500)}
function doExport(){
 if(!S.subjects.length){toast('Nothing to export yet. Add a subject first.');return}
 const blob=new Blob([JSON.stringify({app:'personal-time-machine',version:SCHEMA,exported:today,subjects:S.subjects},null,2)],{type:'application/json'});
 const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='personal-time-machine-'+today+'.json';document.body.appendChild(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(a.href),1000);lsSet(EXPK,today);setStatus(true);toast('Exported '+S.subjects.length+' subject'+(S.subjects.length===1?'':'s')+'.');
}
const fp=s=>[s.name,s.start,s.target,s.unit,s.decs.length,s.tls.length,Math.round(s.decs.reduce((a,d)=>a+d.amount,0)*100)].join('|');
function cleanSubject(raw){
 if(!raw||typeof raw.name!=='string'||!isFinite(+raw.target)||raw.target===''||raw.target===null||!Array.isArray(raw.tls))return null;
 const start=isFinite(+raw.start)?+raw.start:0;if(+raw.target===start||Math.abs(+raw.target)>BIG||Math.abs(start)>BIG)return null;
 const tls=[],idmap={},rawOf={};
 raw.tls.forEach(t=>{if(!t||!t.id||typeof t.name!=='string'||idmap[t.id])return;
  const n={id:uid(),name:t.name.slice(0,120),color:COLORS[tls.length%COLORS.length]};
  if(t.hypo)n.hypo=true;if(typeof t.desc==='string')n.desc=t.desc.slice(0,200);
  idmap[t.id]=n.id;rawOf[n.id]=t;tls.push(n)});
 if(!tls.length)return null;
 const byId={};tls.forEach(n=>byId[n.id]=n);
 tls.forEach(n=>{const t=rawOf[n.id],pid=idmap[t.parent];if(!pid||pid===n.id||!okDate(t.forkAt))return;
  for(let c=byId[pid],k=0;c;c=byId[c.parent],k++){if(c.id===n.id||k>50)return}
  n.parent=pid;n.forkAt=t.forkAt});
 tls.sort((x,y)=>(x.parent?1:0)-(y.parent?1:0));
 const decs=(Array.isArray(raw.decs)?raw.decs:[]).filter(d=>d&&idmap[d.tl]&&okDate(d.date)&&Math.abs(+d.amount)<=BIG&&typeof d.title==='string'&&isFinite(+d.amount))
  .slice(0,20000).map(d=>{const fa=byId[idmap[d.tl]].forkAt;return{id:uid(),tl:idmap[d.tl],date:fa&&d.date<fa?fa:d.date,title:d.title.slice(0,200),note:typeof d.note==='string'?d.note.slice(0,300):'',amount:+d.amount,hist:Array.isArray(d.hist)?d.hist.slice(-20).filter(h=>h&&isFinite(+h.amount)&&okDate(h.date)).map(h=>({at:okDate(h.at)?h.at:today,date:h.date,amount:+h.amount,note:typeof h.note==='string'?h.note.slice(0,200):''})):undefined}});
 const ns={id:uid(),name:raw.name.slice(0,120),start,target:+raw.target,unit:typeof raw.unit==='string'?raw.unit.slice(0,30):'',stats:!!raw.stats,cat:CATS[raw.cat]?raw.cat:(raw.stats?'trading':'custom'),sel:Array.isArray(raw.sel)?raw.sel.filter(k=>STATLBL[k]):[],tls,decs};
 if(okDate(raw.end))ns.end=raw.end;if(okDate(raw.begin))ns.begin=raw.begin;
 if(isMoney(ns)){ns.start=cents(ns.start)/100;ns.target=cents(ns.target)/100;ns.decs.forEach(d=>d.amount=cents(d.amount)/100)}
 return ns;
}
$('#imp').addEventListener('change',e=>{
 const f=e.target.files[0];if(!f)return;const r=new FileReader();
 r.onload=()=>{try{const d=JSON.parse(r.result),list=Array.isArray(d)?d:d.subjects;if(!Array.isArray(list))throw 0;
   const all=list.map(cleanSubject).filter(Boolean);if(!all.length)throw 0;
   const have=new Set(S.subjects.map(fp)),ok=all.filter(x=>{const k=fp(x);if(have.has(k))return false;have.add(k);return true}),skipped=all.length-ok.length;
   if(!ok.length){toast('Nothing new to import. '+(skipped===1?'That subject is':'Those '+skipped+' subjects are')+' already here.');e.target.value='';return}
   S.subjects.push(...ok);X.help=false;build();toast('Imported '+ok.length+' subject'+(ok.length===1?'':'s')+(skipped?' and skipped '+skipped+' that '+(skipped===1?'was':'were')+' already here':'')+'. They were added to what you already have.')}
  catch(err){toast('That file could not be imported. Choose a file exported from this page.')}
  e.target.value=''};
 r.readAsText(f);
});
function rollDay(){
 const n=localToday();if(n===today)return false;
 const old=today;today=n;S.subjects.forEach(s=>{const u=U[s.id];if(u&&u.asof===old)u.asof=today});
 S.subjects.forEach(s=>refresh(s));toast('A new day has started.');return true;
}
setInterval(rollDay,60000);
document.addEventListener('visibilitychange',()=>{if(document.hidden)flushSave();else rollDay()});
window.addEventListener('focus',rollDay);
window.addEventListener('pagehide',flushSave);
/* Another tab changed the data: pick it up instead of overwriting it later */
window.addEventListener('storage',e=>{
 if(e.storageArea!==localStorage||e.key!==KEY)return;
 const o=e.newValue===null?{subjects:[]}:readJ(KEY);if(!valid(o))return;
 if(e.newValue!==null&&e.newValue===JSON.stringify(S))return;
 S=normState(o);build();toast('Updated with changes made in another tab.');
});
window.addEventListener('error',()=>toast('Something went wrong. Your saved data is untouched. Try reloading the page.'));
window.addEventListener('unhandledrejection',()=>toast('Something went wrong. Your saved data is untouched. Try reloading the page.'));

/* ---------- Auraz look: favicon PNG, online PNG slot, animated red wave ---------- */
(function(){const c=$('#wave'),x=c.getContext('2d'),still=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;let w=0,h=0,t=0;
 const fit=()=>{const d=Math.min(2,window.devicePixelRatio||1);w=c.clientWidth;h=c.clientHeight;c.width=w*d;c.height=h*d;x.setTransform(d,0,0,d,0,0);draw()};
 function draw(){x.clearRect(0,0,w,h);const rows=34,cols=Math.max(30,Math.round(w/9));
  for(let r=0;r<rows;r++){const k=r/(rows-1),z=Math.pow(k,1.7),y0=h*(.4+.52*z),amp=6+48*z;
   x.fillStyle='rgba(255,'+Math.round(30+40*z)+','+Math.round(30+30*z)+','+(.12+.88*z).toFixed(2)+')';
   for(let i=0;i<=cols;i++){const u=i/cols,v=Math.sin(u*9+t*.9+k*5)*.6+Math.sin(u*17-t*.6+k*9)*.4,y=y0-v*amp*(1-.35*Math.abs(u-.5)*2);
    x.beginPath();x.arc(u*w,y,.5+1.9*z,0,6.283);x.fill()}}}
 function loop(){if(!document.hidden){t+=.016;draw()}requestAnimationFrame(loop)}
 window.addEventListener('resize',fit);fit();if(!still)requestAnimationFrame(loop)})();
build();
try{if(navigator.storage&&navigator.storage.persist)navigator.storage.persist()}catch(e){}
{const last=lsGet(EXPK);
 if(recovered)toast('Your saved data could not be read, so the last backup was restored.');
 else if(repaired)toast(repaired+' damaged item'+(repaired===1?' was':'s were')+' skipped while loading your data.');
 else if(S.subjects.length&&(!last||(ts(today)-ts(last))/DAY>30))toast('Tip: press Export now and then to keep a copy of your data.')}
/* Tools badge: keyboard shortcuts panel, and the shortcuts themselves. */
(function(){
 const badge=document.getElementById('toolsbtn'),panel=document.getElementById('toolspanel'),list=document.getElementById('tpbody');
 if(!badge||!panel||!list)return;
 const up=()=>{if(window.openApp)window.openApp()};
 const press=sel=>()=>{const el=document.querySelector(sel);if(el)el.click()};
 const chips=()=>[...document.querySelectorAll('#switch .vchip:not(.add)')];
 const step=d=>()=>{const c=chips();if(!c.length)return;let i=c.findIndex(x=>x.classList.contains('on'));i=i<0?(d>0?0:c.length-1):(i+d+c.length)%c.length;c[i].click()};
 function tools(open,back){
  panel.hidden=!open;badge.setAttribute('aria-expanded',open);
  if(open){const f=panel.querySelector('button.tp-r')||document.getElementById('tpx');if(f)f.focus()}
  else if(back)badge.focus()}
 const SC=[
  ['Go to',[['[','Previous subject',step(-1)],[']','Next subject',step(1)]]],
  ['Do',[
   ['n','New subject',press('#lnav [data-act="newsubj"]')],
   ['r','Make a report',press('#lnav [data-act="report"]')],
   ['e','Export your data',press('#lnav [data-act="export"]')],
   ['i','Import a file',press('#lnav [data-act="import"]')],
   ['h','How it works',press('#lnav [data-act="help"]')]]],
  ['View',[
   ['f','Full screen',press('#fsbtn')],
   ['t','Text size',press('#tsbtn')],
   ['b','Back to the site',()=>{location.href='index.html'}],
   ['?','Open or close this panel',null],
   ['Esc','Close a panel, report or full screen',null]]]];
 const fns={};
 list.innerHTML=SC.map(g=>'<p class="tp-g">'+g[0]+'</p>'+g[1].map(r=>{
  const k='<kbd>'+(r[0].length===1?r[0].toUpperCase():r[0])+'</kbd>';
  if(r[2]){fns[r[0]]=r[2];return '<button type="button" class="tp-r" data-k="'+r[0]+'"><span>'+r[1]+'</span>'+k+'</button>'}
  return '<div class="tp-r"><span>'+r[1]+'</span>'+k+'</div>'}).join('')).join('');
 const typing=t=>t&&(t.isContentEditable||/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
 document.addEventListener('keydown',e=>{
  if(e.defaultPrevented||e.ctrlKey||e.metaKey||e.altKey||e.repeat||typing(e.target))return;
  const rp=document.getElementById('report');if(rp&&!rp.hidden)return;
  const k=e.key.length===1?e.key.toLowerCase():e.key;
  if(k==='?'){e.preventDefault();tools(panel.hidden);return}
  const fn=fns[k];if(!fn)return;
  e.preventDefault();if(!panel.hidden)tools(false);
  if('nh[]ft'.indexOf(k)>-1)up();
  fn()});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!panel.hidden){tools(false,true);e.stopImmediatePropagation()}},true);
 panel.addEventListener('keydown',e=>{
  if(e.key!=='ArrowDown'&&e.key!=='ArrowUp')return;
  const b=[...panel.querySelectorAll('button')],i=b.indexOf(document.activeElement);
  e.preventDefault();b[(i+(e.key==='ArrowDown'?1:-1)+b.length)%b.length].focus()});
 document.addEventListener('click',e=>{
  const t=e.target;
  if(t.closest('#toolsbtn')){tools(panel.hidden);return}
  if(t.closest('#tpx')){tools(false,true);return}
  if(t.closest('[data-tools]')){tools(true);return}
  const r=t.closest('.tp-r[data-k]');
  if(r){const fn=fns[r.dataset.k];tools(false);if('nh[]ft'.indexOf(r.dataset.k)>-1)up();setTimeout(fn,0);return}
  if(t.closest('[data-go="home"]')){e.preventDefault();if(window.backToSite)window.backToSite();return}
  if(t.closest('[data-go="top"]')){window.scrollTo({top:0,behavior:'smooth'});return}
  if(t.closest('[data-go="app"]')){e.preventDefault();up();return}
  if(t.closest('[data-act="help"],[data-act="newsubj"]')&&!t.closest('#app'))up();
  if(!panel.hidden&&!t.closest('#toolspanel'))tools(false)});
})();
/* Shared nav and footer links: inside the app they act in place; from other pages they arrive as app.html?do=... */
document.addEventListener('click',e=>{
 const a=e.target.closest&&e.target.closest('a[data-act],a[data-tools]');if(!a)return;
 e.preventDefault();
 if(a.closest('#lnav,#foot')){const app=document.getElementById('app');if(app)app.scrollIntoView({behavior:'smooth',block:'start'})}
},true);
(function(){
 const q=new URLSearchParams(location.search),d=q.get('do');if(!d)return;
 setTimeout(()=>{
  const press=sel=>{const el=document.querySelector(sel);if(el)el.click()};
  if(d==='newsubj'){press('#lnav [data-act="newsubj"]');
   const n=(q.get('name')||'').trim().slice(0,80);
   if(n)setTimeout(()=>{const g=$('#gn');if(g){g.value=n;g.dispatchEvent(new Event('input',{bubbles:true}));g.focus({preventScroll:true})}},200)}
  else if(d==='help'){if(!document.querySelector('#b-help.cur'))press('#lnav [data-act="help"]')}
  else if(d==='report')press('#lnav [data-act="report"]');
  else if(d==='export')press('#lnav [data-act="export"]');
  else if(d==='shortcuts')press('#toolsbtn');
  else if(d==='import')toast('Press Import in the toolbar to choose a backup file.');
  try{history.replaceState(null,'',location.pathname)}catch(e){}
 },150);
})();

/* Footer panel: opens over the app from the Footer button. Closes on Esc, outside click, or after a link is used. */
(function(){
 const b=document.getElementById('footbtn'),B=document.body;if(!b)return;
 const set=o=>{B.classList.toggle('foot-open',o);b.setAttribute('aria-expanded',String(o));const s=o?'Hide footer':'Show footer',l=b.querySelector('span');if(l)l.textContent=s;b.setAttribute('aria-label',s);b.title=s};
 b.addEventListener('click',()=>set(!B.classList.contains('foot-open')));
 document.addEventListener('click',e=>{
  if(!B.classList.contains('foot-open'))return;const t=e.target;
  if(t.closest('#footbtn'))return;
  if(t.closest('#foot')){if(t.closest('#foot a[data-act],#foot a[data-tools]'))set(false);return}
  set(false)});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&B.classList.contains('foot-open'))set(false)});
})();

