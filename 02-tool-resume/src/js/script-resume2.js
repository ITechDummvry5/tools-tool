// FIX 1: Back to Editor — window.open(_blank) creates a new tab with no history.
// window.close() closes the tab; if blocked by browser, fall back to index.html.
function goBack(){
  window.close();
  setTimeout(()=>{ window.location.href='index.html'; }, 300);
}

const ic = (path, size=11) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;
const PHONE_IC = ic('<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>');
const EMAIL_IC = ic('<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>');
const WEB_IC   = ic('<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>');
const PIN_IC   = ic('<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>');
const STAR_IC  = ic('<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',10);
const LINK_IC  = ic('<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',10);

const PLAT_IC = {
  linkedin: ic('<path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/>'),
  github:   ic('<path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>'),
  portfolio: WEB_IC,
  behance:  ic('<path d="M2 9h8a4 4 0 0 1 0 8H2V9z"/><circle cx="6" cy="6" r="4"/><path d="M14 9h8"/><path d="M18 5v4"/><rect x="14" y="13" width="8" height="4" rx="2"/>'),
  dribbble: ic('<circle cx="12" cy="12" r="10"/><path d="M8.56 2.75c4.37 6.03 6.02 9.42 8.03 17.72m2.54-15.38c-3.72 4.35-8.94 5.66-16.88 5.85m19.5 1.9c-3.5-.93-6.63-.82-8.94 0-2.58.92-5.01 2.86-7.44 6.32"/>'),
  facebook: ic('<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>'),
  twitter:  ic('<path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/>'),
  instagram:ic('<rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>'),
  youtube:  ic('<path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"/>'),
  other:    WEB_IC
};

function esc(s){ return (s||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function pillClass(v){ v=+v; if(v>=88) return 'expert'; if(v>=70) return 'good'; return ''; }
function lvlLabel(v){ v=+v; if(v>=90) return 'Native'; if(v>=75) return 'Fluent'; if(v>=55) return 'Intermediate'; return 'Basic'; }
function fmtDate(s){ if(!s) return ''; const [y,m,d]=s.split('-'); return new Date(+y,+m-1,+d).toLocaleDateString('en-US',{month:'short',year:'numeric'}); }
function hide(id){ const el=document.getElementById(id); if(el) el.style.display='none'; }

window.addEventListener('DOMContentLoaded',()=>{
  let d;
  try{ d=JSON.parse(localStorage.getItem('resumeData')||'null'); }catch(e){}
  if(!d){ document.body.innerHTML='<p style="color:#333;text-align:center;margin-top:100px;font-family:sans-serif">No resume data found. Please go back and fill the form.</p>'; return; }

  // Apply theme
  if(d.themeColor){
    document.documentElement.style.setProperty('--accent', d.themeColor);
    document.documentElement.style.setProperty('--accent-dim', d.themeColor+'22');
  }

  // FIX 2: Font Family — load AND apply to document.body so it actually takes effect
  if(d.themeFont){
    const link=document.createElement('link');
    link.rel='stylesheet';
    link.href=`https://fonts.googleapis.com/css2?family=${d.themeFont.replace(/ /g,'+')}:wght@300;400;500;600;700&display=swap`;
    document.head.appendChild(link);
    // Actually apply it — this was missing before
    document.body.style.fontFamily = `'${d.themeFont}', sans-serif`;
  }

  // Header
  const fn=d.firstName||'', ln=d.lastName||'';
  document.getElementById('hb-name').innerHTML=fn?`${fn} <em>${ln}</em>`:ln;
  document.getElementById('hb-title').textContent=d.jobTitle||'';
  if(d.profile) document.getElementById('hb-profile').textContent=d.profile; else document.getElementById('hb-profile').style.display='none';
  if(d.objective){ const o=document.getElementById('hb-objective'); o.textContent=d.objective; o.style.display='block'; }

  // Photo
  const pw=document.getElementById('hb-photo-wrap');
  if(d.photo){ pw.innerHTML=`<img class="hb-photo" src="${d.photo}" alt="">`; }
  else{ pw.innerHTML=`<div class="hb-photo-placeholder">${ic('<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',34)}</div>`; }

  // Contact strip
  const contacts=[];
  if(d.phone1) contacts.push({ic:PHONE_IC,val:d.phone1});
  if(d.phone2) contacts.push({ic:PHONE_IC,val:d.phone2});
  if(d.email)  contacts.push({ic:EMAIL_IC,val:`<a href="mailto:${d.email}">${d.email}</a>`});
  if(d.website)contacts.push({ic:WEB_IC,val:`<a href="${d.website.startsWith('http')?d.website:'https://'+d.website}" target="_blank">${d.website}</a>`});
  if(d.address)contacts.push({ic:PIN_IC,val:d.address});
  const cs=document.getElementById('contact-strip');
  if(contacts.length) cs.innerHTML=contacts.map(c=>`<div class="cs-item">${c.ic}<span>${c.val}</span></div>`).join('');
  else cs.style.display='none';

  // Personal
  const pRows=[];
  if(d.gender)      pRows.push(['Gender',d.gender]);
  if(d.civilStatus) pRows.push(['Civil Status',d.civilStatus]);
  if(d.age)         pRows.push(['Age',d.age]);
  if(d.birthPlace)  pRows.push(['Birth Place',d.birthPlace]);
  if(d.religion)    pRows.push(['Religion',d.religion]);
  const pDiv=document.getElementById('sb2-personal');
  if(pRows.length) pDiv.innerHTML=pRows.map(([l,v])=>`<div class="p-row2"><span class="p-lbl2">${l}</span><span class="p-val2">${v}</span></div>`).join('');
  else hide('sb2-personal-sec');

  // Social
  const socials=(d.social||[]).filter(s=>s.url);
  if(socials.length){
    document.getElementById('sb2-social').innerHTML=socials.map(s=>`
      <div class="soc-pill">${PLAT_IC[s.platform]||WEB_IC}<a href="${s.url.startsWith('http')?s.url:'https://'+s.url}" target="_blank">${s.url.replace(/^https?:\/\//,'').replace(/\/$/,'')}</a></div>`).join('');
  } else hide('sb2-social-sec');

  // Software skills
  const soft=(d.software||[]).filter(s=>s.name);
  if(soft.length) document.getElementById('sb2-soft').innerHTML=soft.map(s=>`<span class="skill-pill ${pillClass(s.level)}">${s.name}</span>`).join('');
  else hide('sb2-soft-sec');

  // Interpersonal
  const inter=(d.interpersonal||[]).filter(s=>s.name);
  if(inter.length) document.getElementById('sb2-inter').innerHTML=inter.map(s=>`<span class="skill-pill ${pillClass(s.level)}">${s.name}</span>`).join('');
  else hide('sb2-inter-sec');

  // Languages
  const langs=(d.languages||[]).filter(l=>l.name);
  if(langs.length){
    document.getElementById('sb2-langs').innerHTML=langs.map(l=>`
      <div class="lang-row2">
        <span class="lang-nm2">${l.name}</span>
        <div class="lang-bar"><div class="lang-bar-fill" style="width:${l.level}%"></div></div>
        <span class="lang-lv">${lvlLabel(l.level)}</span>
      </div>`).join('');
  } else hide('sb2-lang-sec');

  // Hobbies
  if(d.hobbies && d.hobbies.trim()){
    const items = d.hobbies.split(/[,\n]+/).map(s=>s.trim()).filter(Boolean);
    document.getElementById('sb2-hobbies').innerHTML=items.map(h=>`<span class="hobby-tag">${h}</span>`).join('');
  } else hide('sb2-hobby-sec');

  // Work
  const work=(d.work||[]).filter(w=>w.title||w.desc);
  if(work.length){
    document.getElementById('main-work').innerHTML=work.map(w=>`
      <div class="exp-item">
        <div class="exp-title">${esc(w.title||'')}</div>
        ${w.company?`<div class="exp-sub">${esc(w.company)}</div>`:''}
        ${w.year?`<div class="exp-meta"><span>${esc(w.year)}</span></div>`:''}
        <div class="exp-desc">${esc(w.desc||'')}</div>
      </div>`).join('');
  } else hide('main-work-sec');

  // Education
  const edu=(d.education||[]).filter(e=>e.degree||e.inst);
  if(edu.length){
    document.getElementById('main-edu').innerHTML=edu.map(e=>`
      <div class="exp-item">
        <div class="exp-title">${esc(e.degree||'')}</div>
        <div class="exp-meta">${e.inst?`<span>${esc(e.inst)}</span>`:''}${e.year?`<span>${esc(e.year)}</span>`:''}</div>
        ${e.desc?`<div class="exp-desc">${esc(e.desc)}</div>`:''}
      </div>`).join('');
  } else hide('main-edu-sec');

  // Projects
  const projs=(d.projects||[]).filter(p=>p.title);
  if(projs.length){
    document.getElementById('main-proj').innerHTML=projs.map(p=>`
      <div class="proj-item">
        <div class="proj-title-t">${esc(p.title)}</div>
        ${p.tech?`<div class="proj-tech-t">${esc(p.tech)}</div>`:''}
        ${p.desc?`<div class="proj-desc-t">${esc(p.desc)}</div>`:''}
        ${p.link?`<div class="proj-link-t">${LINK_IC} <a href="${p.link.startsWith('http')?esc(p.link):'https://'+esc(p.link)}" target="_blank">${esc(p.link)}</a></div>`:''}
      </div>`).join('');
  } else hide('main-proj-sec');

  // Certifications
  const certs=(d.certifications||[]).filter(c=>c.title);
  if(certs.length){
    document.getElementById('main-certs').innerHTML=certs.map(c=>`
      <div class="cert-row">
        ${c.img?`<img class="cert-thumb" src="${esc(c.img)}" alt="">`:`<div class="cert-thumb-ph">${ic('<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>',16)}</div>`}
        <div class="cert-body">
          <div class="cert-name">${esc(c.title)}</div>
          ${c.desc?`<div class="cert-desc-t">${esc(c.desc)}</div>`:''}
          ${(c.start||c.end)?`<div class="cert-dates-t">${fmtDate(c.start)}${c.start&&c.end?' – ':''}${fmtDate(c.end)}</div>`:''}
        </div>
      </div>`).join('');
  } else hide('main-cert-sec');

  // Awards
  const awards=(d.awards||[]).filter(a=>a.name);
  if(awards.length){
    document.getElementById('main-awards').innerHTML=awards.map(a=>`
      <div class="award-item">
        <div class="award-icon">${STAR_IC}</div>
        <div class="award-body">
          <div class="award-nm">${esc(a.name)}</div>
          <div class="award-meta">${[a.org,a.year].filter(Boolean).map(esc).join(' · ')}</div>
          ${a.desc?`<div class="award-desc-t">${esc(a.desc)}</div>`:''}
        </div>
      </div>`).join('');
  } else hide('main-award-sec');

  // Trainings
  const trains=(d.trainings||[]).filter(t=>t.title);
  if(trains.length){
    document.getElementById('main-trains').innerHTML=trains.map(t=>`
      <div class="train-row">
        <div class="train-dot"></div>
        <div class="train-body">
          <div class="train-title-t">${esc(t.title)}</div>
          <div class="train-meta">${[t.org, t.date?fmtDate(t.date):''].filter(Boolean).map(esc).join(' · ')}</div>
          ${t.desc?`<div class="exp-desc">${esc(t.desc)}</div>`:''}
        </div>
      </div>`).join('');
  } else hide('main-train-sec');

  // References
  const refs=(d.references||[]).filter(r=>r.name);
  if(refs.length){
    document.getElementById('main-refs').innerHTML=refs.map(r=>`
      <div class="ref-card">
        <div class="ref-nm">${esc(r.name)}</div>
        ${r.bio?`<div class="ref-bi">${esc(r.bio)}</div>`:''}
        ${r.phone?`<div class="ref-det">${PHONE_IC}${esc(r.phone)}</div>`:''}
        ${r.email?`<div class="ref-det">${EMAIL_IC}${esc(r.email)}</div>`:''}
        ${r.addr?`<div class="ref-det">${PIN_IC}${esc(r.addr)}</div>`:''}
      </div>`).join('');
  } else hide('main-ref-sec');
});
