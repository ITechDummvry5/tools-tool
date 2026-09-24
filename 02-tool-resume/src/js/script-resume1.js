// FIX 1: Back to Editor — window.open(_blank) creates a new tab with no history.
// window.close() closes the tab; if blocked by browser, fall back to index.html.
function goBack(){
  window.close();
  setTimeout(()=>{ window.location.href='index.html'; }, 300);
}

const ic = (path, size=12) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;
const PHONE_IC = ic('<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>');
const EMAIL_IC = ic('<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>');
const WEB_IC   = ic('<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>');
const PIN_IC   = ic('<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>');
const STAR_IC  = ic('<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',10);
const LINK_IC  = ic('<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',10);

const PLAT_IC = {
  linkedin: ic('<path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/>'),
  github:   ic('<path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>'),
  portfolio: WEB_IC, behance: WEB_IC, dribbble: WEB_IC,
  facebook: ic('<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>'),
  twitter:  ic('<path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/>'),
  instagram: ic('<rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>'),
  youtube:  ic('<path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"/>'),
  other: WEB_IC
};

function esc(s){ return (s||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function lvlLabel(v){ v=+v; if(v>=88) return 'Expert'; if(v>=70) return 'Good'; if(v>=50) return 'Basic'; return 'Learning'; }
function langDots(v){ v=+v; const f=Math.round(v/20); return Array.from({length:5},(_,i)=>`<div class="dot${i<f?' on':''}"></div>`).join(''); }
function fmtDate(s){ if(!s) return ''; const [y,m,d]=s.split('-'); return new Date(+y,+m-1,+d).toLocaleDateString('en-US',{month:'short',year:'numeric'}); }
function hide(id){ const el=document.getElementById(id); if(el) el.style.display='none'; }

window.addEventListener('DOMContentLoaded',()=>{
  let d;
  try{ d=JSON.parse(localStorage.getItem('resumeData')||'null'); }catch(e){}
  if(!d){ document.body.innerHTML='<p style="color:#fff;text-align:center;margin-top:100px;font-family:sans-serif">No resume data found. Please go back and fill the form.</p>'; return; }

  // Apply theme color
  if(d.themeColor){
    document.documentElement.style.setProperty('--accent', d.themeColor);
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

  // Photo
  const pc=document.getElementById('sbPhotoContainer');
  if(d.photo) pc.innerHTML=`<img class="sb-photo" src="${d.photo}" alt="">`;
  else pc.innerHTML=`<div class="sb-photo-placeholder">${ic('<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',42)}</div>`;

  document.getElementById('sb-fname').textContent=d.firstName||'';
  document.getElementById('sb-lname').textContent=d.lastName||'';
  document.getElementById('sb-job').textContent=d.jobTitle||'';

  // Contact
  const contacts=[];
  if(d.phone1) contacts.push({ic:PHONE_IC,val:d.phone1});
  if(d.phone2) contacts.push({ic:PHONE_IC,val:d.phone2});
  if(d.email)  contacts.push({ic:EMAIL_IC,val:`<a href="mailto:${d.email}" style="color:inherit">${d.email}</a>`});
  if(d.website)contacts.push({ic:WEB_IC,val:`<a href="${d.website.startsWith('http')?d.website:'https://'+d.website}" target="_blank" style="color:inherit">${d.website}</a>`});
  if(d.address)contacts.push({ic:PIN_IC,val:d.address});
  const cDiv=document.getElementById('sb-contacts');
  if(contacts.length) cDiv.innerHTML=contacts.map(c=>`<div class="contact-row">${c.ic}<div class="contact-val">${c.val}</div></div>`).join('');
  else hide('sb-contact-sec');

  // Social
  const socials=(d.social||[]).filter(s=>s.url);
  if(socials.length){
    document.getElementById('sb-socials').innerHTML=socials.map(s=>`
      <div class="soc-row">${PLAT_IC[s.platform]||WEB_IC}<div class="soc-val"><a href="${s.url.startsWith('http')?s.url:'https://'+s.url}" target="_blank" style="color:inherit">${s.url.replace(/^https?:\/\//,'').replace(/\/$/,'')}</a></div></div>`).join('');
  } else hide('sb-social-sec');

  // Personal
  const pRows=[];
  if(d.gender)      pRows.push(['Gender',d.gender]);
  if(d.civilStatus) pRows.push(['Civil Status',d.civilStatus]);
  if(d.age)         pRows.push(['Age',d.age]);
  if(d.birthPlace)  pRows.push(['Birth Place',d.birthPlace]);
  if(d.religion)    pRows.push(['Religion',d.religion]);
  const pDiv=document.getElementById('sb-personal');
  if(pRows.length) pDiv.innerHTML=pRows.map(([l,v])=>`<div class="p-row"><span class="p-lbl">${l}</span><span class="p-val">${v}</span></div>`).join('');
  else hide('sb-personal-sec');

  // Skills
  const soft=(d.software||[]).filter(s=>s.name);
  if(soft.length) document.getElementById('sb-soft-skills').innerHTML=soft.map(s=>`<div class="skill-item"><div class="skill-name">${s.name}<span>${lvlLabel(s.level)}</span></div><div class="bar-track"><div class="bar-fill" style="width:${s.level}%"></div></div></div>`).join('');
  else hide('sb-soft-sec');

  const inter=(d.interpersonal||[]).filter(s=>s.name);
  if(inter.length) document.getElementById('sb-inter-skills').innerHTML=inter.map(s=>`<div class="skill-item"><div class="skill-name">${s.name}<span>${lvlLabel(s.level)}</span></div><div class="bar-track"><div class="bar-fill" style="width:${s.level}%"></div></div></div>`).join('');
  else hide('sb-inter-sec');

  // Languages
  const langs=(d.languages||[]).filter(l=>l.name);
  if(langs.length) document.getElementById('sb-languages').innerHTML=langs.map(l=>`<div class="lang-item"><span class="lang-name">${l.name}</span><div class="lang-dots">${langDots(l.level)}</div></div>`).join('');
  else hide('sb-lang-sec');

  // Hobbies
  if(d.hobbies && d.hobbies.trim()){
    const items=d.hobbies.split(/[,\n]+/).map(s=>s.trim()).filter(Boolean);
    document.getElementById('sb-hobbies').innerHTML=items.map(h=>`<span class="hobby-pill-sb">${h}</span>`).join('');
  } else hide('sb-hobby-sec');

  // Profile + Objective
  if(d.profile) document.getElementById('main-profile').textContent=d.profile;
  else hide('main-profile-sec');
  if(d.objective){
    document.getElementById('main-objective').textContent=d.objective;
    document.getElementById('main-objective-sec').style.display='block';
  }

  // Work
  const work=(d.work||[]).filter(w=>w.title||w.desc);
  if(work.length){
    document.getElementById('main-work').innerHTML=work.map(w=>`
      <div class="timeline-item">
        <div class="tl-year">${esc(w.year||'')}</div>
        <div class="tl-right">
          <div class="tl-title">${esc(w.title||'')}</div>
          ${w.company?`<div class="tl-company">${esc(w.company)}</div>`:''}
          <div class="tl-desc">${esc(w.desc||'')}</div>
        </div>
      </div>`).join('');
  } else hide('main-work-sec');

  // Education
  const edu=(d.education||[]).filter(e=>e.degree||e.inst);
  if(edu.length){
    document.getElementById('main-edu').innerHTML=edu.map(e=>`
      <div class="timeline-item">
        <div class="tl-year">${esc(e.year||'')}</div>
        <div class="tl-right">
          <div class="tl-title">${esc(e.degree||'')}</div>
          <div class="tl-sub">${esc(e.inst||'')}</div>
          <div class="tl-desc">${esc(e.desc||'')}</div>
        </div>
      </div>`).join('');
  } else hide('main-edu-sec');

  // Projects
  const projs=(d.projects||[]).filter(p=>p.title);
  if(projs.length){
    document.getElementById('main-projs').innerHTML=projs.map(p=>`
      <div class="proj-card">
        <div class="proj-card-title">${esc(p.title)}</div>
        ${p.tech?`<div class="proj-card-tech">${esc(p.tech)}</div>`:''}
        ${p.desc?`<div class="proj-card-desc">${esc(p.desc)}</div>`:''}
        ${p.link?`<div class="proj-card-link">${LINK_IC} <a href="${p.link.startsWith('http')?esc(p.link):'https://'+esc(p.link)}" target="_blank" style="color:inherit">${esc(p.link)}</a></div>`:''}
      </div>`).join('');
  } else hide('main-proj-sec');

  // Certifications
  const certs=(d.certifications||[]).filter(c=>c.title);
  if(certs.length){
    document.getElementById('main-certs').innerHTML=certs.map(c=>`
      <div class="cert-card">
        ${c.img?`<img class="cert-img" src="${esc(c.img)}" alt="">`:`<div class="cert-img-placeholder">${ic('<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>',20)}</div>`}
        <div class="cert-body">
          <div class="cert-title-txt">${esc(c.title)}</div>
          ${c.desc?`<div class="cert-desc-txt">${esc(c.desc)}</div>`:''}
          ${(c.start||c.end)?`<div class="cert-dates">${fmtDate(c.start)}${c.start&&c.end?' – ':''}${fmtDate(c.end)}</div>`:''}
        </div>
      </div>`).join('');
  } else hide('main-cert-sec');

  // Awards
  const awards=(d.awards||[]).filter(a=>a.name);
  if(awards.length){
    document.getElementById('main-awards').innerHTML=awards.map(a=>`
      <div class="award-item">
        <div class="award-badge">${STAR_IC}</div>
        <div>
          <div class="award-name-t">${esc(a.name)}</div>
          <div class="award-meta-t">${[a.org,a.year].filter(Boolean).map(esc).join(' · ')}</div>
          ${a.desc?`<div class="award-desc-t">${esc(a.desc)}</div>`:''}
        </div>
      </div>`).join('');
  } else hide('main-award-sec');

  // Trainings
  const trains=(d.trainings||[]).filter(t=>t.title);
  if(trains.length){
    document.getElementById('main-trains').innerHTML=trains.map(t=>`
      <div class="train-item">
        <div class="train-date-col">${t.date?fmtDate(t.date):''}</div>
        <div class="train-right">
          <div class="train-title-t">${esc(t.title)}</div>
          ${t.org?`<div class="train-org-t">${esc(t.org)}</div>`:''}
          ${t.desc?`<div class="tl-desc" style="margin-top:2px">${esc(t.desc)}</div>`:''}
        </div>
      </div>`).join('');
  } else hide('main-train-sec');

  // References
  const refs=(d.references||[]).filter(r=>r.name);
  if(refs.length){
    document.getElementById('main-refs').innerHTML=refs.map(r=>`
      <div class="ref-card">
        <div class="ref-name">${esc(r.name)}</div>
        ${r.bio?`<div class="ref-bio">${esc(r.bio)}</div>`:''}
        ${r.phone?`<div class="ref-detail">${PHONE_IC}${esc(r.phone)}</div>`:''}
        ${r.email?`<div class="ref-detail">${EMAIL_IC}${esc(r.email)}</div>`:''}
        ${r.addr?`<div class="ref-detail">${PIN_IC}${esc(r.addr)}</div>`:''}
      </div>`).join('');
  } else hide('main-ref-sec');
});
