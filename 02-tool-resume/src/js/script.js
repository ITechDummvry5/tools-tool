let tpl = 1;
let photo = null;
let saveTimer = null;
let themeColor = '#c9a96e';
let themeFont = 'Playfair Display';

const XBTN = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
const xsvg = id => `<button type="button" class="btn-rm" onclick="rmItem(this,'${id}')">${XBTN}</button>`;

function toggleAcc(header){
  const body = header.nextElementSibling;
  const chevron = header.querySelector('.acc-chevron');
  const isOpen = body.classList.contains('open');
  body.classList.toggle('open', !isOpen);
  chevron.classList.toggle('open', !isOpen);
}

function toggleMode(){
  const light = document.body.classList.toggle('light');
  document.getElementById('modeToggle').textContent = light ? 'Dark Mode' : 'Light Mode';
  scheduleSave();
}

function setColor(el){
  themeColor = el.dataset.color;
  document.querySelectorAll('.swatch').forEach(s=>s.classList.remove('active'));
  el.classList.add('active');
  document.documentElement.style.setProperty('--accent', themeColor);
  document.documentElement.style.setProperty('--accent-dim', themeColor+'22');
  scheduleSave();
}

function setFont(el){
  themeFont = el.dataset.font;
  document.querySelectorAll('.font-opt').forEach(f=>f.classList.remove('active'));
  el.classList.add('active');
  const existingLink = document.getElementById('dynamic-font-link');
  if(existingLink) existingLink.remove();
  const l = document.createElement('link');
  l.id = 'dynamic-font-link';
  l.rel = 'stylesheet';
  l.href = `https://fonts.googleapis.com/css2?family=${themeFont.replace(/ /g,'+')}:wght@300;400;500;600;700&display=swap`;
  document.head.appendChild(l);
  document.body.style.fontFamily = `'${themeFont}', sans-serif`;
  scheduleSave();
}

function selTpl(n){
  tpl = n;
  ['card1','card2'].forEach((id,i)=>{
    const c = document.getElementById(id);
    c.classList.toggle('active', n===i+1);
    c.querySelector('.t-badge').textContent = n===i+1 ? 'Selected' : 'Select';
  });
  scheduleSave();
}

function prevPhoto(inp){
  if(!inp.files[0]) return;
  if(inp.files[0].size > 2*1024*1024){ alert('Photo must be under 2MB.'); return; }
  const r = new FileReader();
  r.onload = e => {
    photo = e.target.result;
    const img = document.getElementById('photo-preview');
    img.src = photo; img.style.display = 'block';
    document.getElementById('ph-icon').style.display = 'none';
    document.getElementById('ph-hint').style.display = 'none';
    scheduleSave();
  };
  r.readAsDataURL(inp.files[0]);
}

function triggerCertImg(drop){ drop.querySelector('.cert-img-input').click(); }

function prevCertImg(inp){
  if(!inp.files[0]) return;
  const r = new FileReader();
  r.onload = e => {
    const drop = inp.closest('.cert-img-drop');
    const prev = drop.querySelector('.cert-preview');
    prev.src = e.target.result; prev.style.display = 'block';
    drop.querySelector('svg').style.display = 'none';
    drop.querySelector('.ph-hint').style.display = 'none';
    scheduleSave();
  };
  r.readAsDataURL(inp.files[0]);
}

function rmItem(btn, id){
  const row = btn.closest('.item-row') || btn.closest('.skill-row') || btn.closest('.social-row');
  const l = document.getElementById(id);
  if(l.children.length > 1){ row.remove(); scheduleSave(); }
}

function addEdu(){
  const l=document.getElementById('eduList'), d=document.createElement('div');
  d.className='item-row';
  d.innerHTML=`<div class="fields"><input type="text" placeholder="Degree Name" class="edu-degree"><input type="text" placeholder="Year (e.g. 2010–2014)" class="edu-year"><input type="text" placeholder="Institution" class="edu-inst s2"><textarea placeholder="Description..." class="edu-desc s2" style="min-height:52px"></textarea></div>${xsvg('eduList')}`;
  l.appendChild(d); attachListeners(d);
}

function addWork(){
  const l=document.getElementById('workList'), d=document.createElement('div');
  d.className='item-row';
  d.innerHTML=`<div class="fields"><input type="text" placeholder="Job Title" class="work-title"><input type="text" placeholder="Company" class="work-company"><input type="text" placeholder="Years (e.g. 2019–2022)" class="work-year s2"><textarea placeholder="Key responsibilities..." class="work-desc s2" style="min-height:52px"></textarea></div>${xsvg('workList')}`;
  l.appendChild(d); attachListeners(d);
}

function addProj(){
  const l=document.getElementById('projList'), d=document.createElement('div');
  d.className='item-row';
  d.innerHTML=`<div class="proj-fields"><input type="text" placeholder="Project Title" class="proj-title s2"><input type="text" placeholder="Technologies Used" class="proj-tech s2"><textarea placeholder="Brief description..." class="proj-desc s2" style="min-height:52px"></textarea><input type="text" placeholder="Project Link (optional)" class="proj-link s2"></div>${xsvg('projList')}`;
  l.appendChild(d); attachListeners(d);
}

function addCert(){
  const l=document.getElementById('certList'), d=document.createElement('div');
  d.className='item-row';
  d.innerHTML=`<div class="cert-fields"><div class="cert-img-drop s2" onclick="triggerCertImg(this)"><input type="file" accept="image/*" class="cert-img-input" onchange="prevCertImg(this)" style="display:none"><img class="cert-preview" alt="" style="display:none"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#555" stroke-width="1.4" stroke-linecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg><span class="ph-hint">Click to upload certificate image</span></div><input type="text" placeholder="Certificate Title" class="cert-title s2"><textarea placeholder="Short description..." class="cert-desc s2" style="min-height:48px"></textarea><div style="display:flex;flex-direction:column;gap:4px"><label style="margin-bottom:3px">Date Start</label><input type="date" class="cert-start"></div><div style="display:flex;flex-direction:column;gap:4px"><label style="margin-bottom:3px">Date End / Expiry</label><input type="date" class="cert-end"></div></div>${xsvg('certList')}`;
  l.appendChild(d); attachListeners(d);
}

function addAward(){
  const l=document.getElementById('awardList'), d=document.createElement('div');
  d.className='item-row';
  d.innerHTML=`<div class="fields"><input type="text" placeholder="Award / Achievement Name" class="award-name s2"><input type="text" placeholder="Year" class="award-year"><input type="text" placeholder="Issued by / Organization" class="award-org"><textarea placeholder="Brief description..." class="award-desc s2" style="min-height:48px"></textarea></div>${xsvg('awardList')}`;
  l.appendChild(d); attachListeners(d);
}

function addTraining(){
  const l=document.getElementById('trainingList'), d=document.createElement('div');
  d.className='item-row';
  d.innerHTML=`<div class="fields"><input type="text" placeholder="Seminar / Training Title" class="train-title s2"><input type="text" placeholder="Organizer / Institution" class="train-org"><input type="date" class="train-date"><textarea placeholder="Notes (optional)..." class="train-desc s2" style="min-height:44px"></textarea></div>${xsvg('trainingList')}`;
  l.appendChild(d); attachListeners(d);
}

function addSkill(lid){
  const l=document.getElementById(lid), d=document.createElement('div');
  d.className='skill-row';
  const isLang=lid==='langList';
  d.innerHTML=`<input type="text" placeholder="Skill name" class="sk-name"><select class="sk-level">${isLang?'<option value="100">Native</option><option value="80" selected>Fluent</option><option value="60">Intermediate</option><option value="40">Basic</option>':'<option value="90">Expert</option><option value="75" selected>Good</option><option value="55">Basic</option><option value="40">Learning</option>'}</select>${xsvg(lid)}`;
  l.appendChild(d); attachListeners(d);
}

function addSocial(){
  const l=document.getElementById('socialList'), d=document.createElement('div');
  d.className='social-row';
  d.innerHTML=`<select class="soc-platform"><option value="linkedin">LinkedIn</option><option value="github">GitHub</option><option value="portfolio">Portfolio</option><option value="behance">Behance</option><option value="dribbble">Dribbble</option><option value="facebook">Facebook</option><option value="twitter">Twitter/X</option><option value="instagram">Instagram</option><option value="youtube">YouTube</option><option value="other">Other</option></select><input type="text" placeholder="https://..." class="soc-url">${xsvg('socialList')}`;
  l.appendChild(d); attachListeners(d);
}

function addRef(){
  const l=document.getElementById('refList'), d=document.createElement('div');
  d.className='item-row';
  d.innerHTML=`<div class="fields"><input type="text" placeholder="Full Name" class="ref-name s2"><input type="text" placeholder="Title / Bio" class="ref-bio"><input type="tel" placeholder="Phone" class="ref-phone"><input type="email" placeholder="Email" class="ref-email"><input type="text" placeholder="Address" class="ref-addr s2"></div>${xsvg('refList')}`;
  l.appendChild(d); attachListeners(d);
}

function validateField(el){
  const empty = !el.value.trim();
  el.classList.toggle('error', empty);
  const err = document.getElementById('err-'+el.id);
  if(err) err.classList.toggle('show', empty);
  return !empty;
}
function validateEmail(el){
  const val = el.value.trim();
  const empty = val === '';
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  const showErr = empty || !valid;
  el.classList.toggle('error', showErr);
  const err = document.getElementById('err-email');
  if(err) err.classList.toggle('show', showErr);
  return valid && !empty;
}
function validateAll(){
  let ok = true;
  ['firstName','lastName','jobTitle'].forEach(id=>{
    const el = document.getElementById(id);
    if(!validateField(el)) ok = false;
  });
  return ok;
}

function updateProgress(){
  const fields = ['firstName','lastName','jobTitle','email','phone1','profile','address'];
  let filled = 0;
  fields.forEach(id=>{ if(document.getElementById(id)?.value.trim()) filled++; });
  if(document.querySelector('.edu-degree')?.value) filled++;
  if(document.querySelector('.work-title')?.value) filled++;
  if(document.querySelector('.sk-name')?.value) filled++;
  const pct = Math.min(100, Math.round((filled / (fields.length+3))*100));
  document.getElementById('progressBar').style.width = pct+'%';
  document.getElementById('progressPct').textContent = pct+'%';
}

function attachListeners(root){
  root.querySelectorAll('input,textarea,select').forEach(el=>{
    el.addEventListener('input', scheduleSave);
    el.addEventListener('change', scheduleSave);
  });
}

function scheduleSave(){
  clearTimeout(saveTimer);
  updateProgress();
  const ind = document.getElementById('saveIndicator');
  ind.textContent = '● Saving…'; ind.className = 'save-indicator';
  saveTimer = setTimeout(()=>{
    saveToStorage();
    ind.textContent = '● Saved'; ind.className = 'save-indicator saved';
    setTimeout(()=>{ ind.textContent = '● Auto-saved'; }, 1800);
  }, 600);
}

function collect(){
  const certRows = [...document.querySelectorAll('#certList .item-row')];
  const certData = certRows.map(r=>{
    const imgEl = r.querySelector('.cert-preview');
    return { img:(imgEl&&imgEl.style.display!=='none'&&imgEl.src)?imgEl.src:'', title:r.querySelector('.cert-title')?.value||'', desc:r.querySelector('.cert-desc')?.value||'', start:r.querySelector('.cert-start')?.value||'', end:r.querySelector('.cert-end')?.value||'' };
  });
  return {
    tpl, themeColor, themeFont,
    lightMode: document.body.classList.contains('light'),
    firstName:  document.getElementById('firstName').value,
    lastName:   document.getElementById('lastName').value,
    jobTitle:   document.getElementById('jobTitle').value,
    profile:    document.getElementById('profile').value,
    objective:  document.getElementById('objective').value,
    gender:     document.getElementById('gender').value,
    civilStatus:document.getElementById('civilStatus').value,
    age:        document.getElementById('age').value,
    birthPlace: document.getElementById('birthPlace').value,
    religion:   document.getElementById('religion').value,
    phone1:     document.getElementById('phone1').value,
    phone2:     document.getElementById('phone2').value,
    email:      document.getElementById('email').value,
    website:    document.getElementById('website').value,
    address:    document.getElementById('address').value,
    hobbies:    document.getElementById('hobbies').value,
    photo,
    social: [...document.querySelectorAll('#socialList .social-row')].map(r=>({ platform:r.querySelector('.soc-platform')?.value||'', url:r.querySelector('.soc-url')?.value||'' })),
    education: [...document.querySelectorAll('#eduList .item-row')].map(r=>({ degree:r.querySelector('.edu-degree')?.value||'', year:r.querySelector('.edu-year')?.value||'', inst:r.querySelector('.edu-inst')?.value||'', desc:r.querySelector('.edu-desc')?.value||'' })),
    work: [...document.querySelectorAll('#workList .item-row')].map(r=>({ title:r.querySelector('.work-title')?.value||'', company:r.querySelector('.work-company')?.value||'', year:r.querySelector('.work-year')?.value||'', desc:r.querySelector('.work-desc')?.value||'' })),
    projects: [...document.querySelectorAll('#projList .item-row')].map(r=>({ title:r.querySelector('.proj-title')?.value||'', tech:r.querySelector('.proj-tech')?.value||'', desc:r.querySelector('.proj-desc')?.value||'', link:r.querySelector('.proj-link')?.value||'' })),
    certifications: certData,
    awards: [...document.querySelectorAll('#awardList .item-row')].map(r=>({ name:r.querySelector('.award-name')?.value||'', year:r.querySelector('.award-year')?.value||'', org:r.querySelector('.award-org')?.value||'', desc:r.querySelector('.award-desc')?.value||'' })),
    trainings: [...document.querySelectorAll('#trainingList .item-row')].map(r=>({ title:r.querySelector('.train-title')?.value||'', org:r.querySelector('.train-org')?.value||'', date:r.querySelector('.train-date')?.value||'', desc:r.querySelector('.train-desc')?.value||'' })),
    software: [...document.querySelectorAll('#softList .skill-row')].map(r=>({ name:r.querySelector('.sk-name')?.value||'', level:r.querySelector('.sk-level')?.value||'75' })),
    interpersonal: [...document.querySelectorAll('#interList .skill-row')].map(r=>({ name:r.querySelector('.sk-name')?.value||'', level:r.querySelector('.sk-level')?.value||'75' })),
    languages: [...document.querySelectorAll('#langList .skill-row')].map(r=>({ name:r.querySelector('.sk-name')?.value||'', level:r.querySelector('.sk-level')?.value||'75' })),
    references: [...document.querySelectorAll('#refList .item-row')].map(r=>({ name:r.querySelector('.ref-name')?.value||'', bio:r.querySelector('.ref-bio')?.value||'', phone:r.querySelector('.ref-phone')?.value||'', email:r.querySelector('.ref-email')?.value||'', addr:r.querySelector('.ref-addr')?.value||'' }))
  };
}

function saveToStorage(){
  try{ localStorage.setItem('resumeData', JSON.stringify(collect())); }catch(e){}
}

function downloadJSON(){
  const data = collect();
  const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'resume-data.json';
  a.click();
}

function loadJSON(inp){
  if(!inp.files[0]) return;
  const r = new FileReader();
  r.onload = e => {
    try{
      const d = JSON.parse(e.target.result);
      localStorage.setItem('resumeData', JSON.stringify(d));
      restoreFromStorage(d);
      alert('Resume data loaded!');
    }catch(err){ alert('Invalid JSON file.'); }
  };
  r.readAsText(inp.files[0]);
  inp.value='';
}

function esc(s){ return (s||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function restoreFromStorage(d){
  if(!d){
    try{ d = JSON.parse(localStorage.getItem('resumeData')||'null'); }catch(e){}
    if(!d) return;
  }

  if(d.tpl) selTpl(d.tpl);
  if(d.lightMode) document.body.classList.add('light'), document.getElementById('modeToggle').textContent='Dark Mode';

  if(d.themeColor){
    themeColor = d.themeColor;
    document.documentElement.style.setProperty('--accent', themeColor);
    document.documentElement.style.setProperty('--accent-dim', themeColor+'22');
    document.querySelectorAll('.swatch').forEach(s=>{s.classList.remove('active'); if(s.dataset.color===themeColor) s.classList.add('active');});
  }
  if(d.themeFont){
    themeFont = d.themeFont;
    document.querySelectorAll('.font-opt').forEach(f=>{f.classList.remove('active'); if(f.dataset.font===themeFont) f.classList.add('active');});
    const l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = `https://fonts.googleapis.com/css2?family=${themeFont.replace(/ /g,'+')}:wght@300;400;500;600;700&display=swap`;
    document.head.appendChild(l);
    document.body.style.fontFamily = `'${themeFont}', sans-serif`;
  }

  const simpleIds = ['firstName','lastName','jobTitle','profile','objective','gender','civilStatus','age','birthPlace','religion','phone1','phone2','email','website','address','hobbies'];
  simpleIds.forEach(id=>{ const el=document.getElementById(id); if(el&&d[id]) el.value=d[id]; });

  if(d.photo){
    photo = d.photo;
    const img=document.getElementById('photo-preview');
    img.src=photo; img.style.display='block';
    document.getElementById('ph-icon').style.display='none';
    document.getElementById('ph-hint').style.display='none';
  }

  restoreList('socialList', d.social, r=>`<div class="social-row"><select class="soc-platform"><option value="linkedin"${r.platform==='linkedin'?' selected':''}>LinkedIn</option><option value="github"${r.platform==='github'?' selected':''}>GitHub</option><option value="portfolio"${r.platform==='portfolio'?' selected':''}>Portfolio</option><option value="behance"${r.platform==='behance'?' selected':''}>Behance</option><option value="dribbble"${r.platform==='dribbble'?' selected':''}>Dribbble</option><option value="facebook"${r.platform==='facebook'?' selected':''}>Facebook</option><option value="twitter"${r.platform==='twitter'?' selected':''}>Twitter/X</option><option value="instagram"${r.platform==='instagram'?' selected':''}>Instagram</option><option value="youtube"${r.platform==='youtube'?' selected':''}>YouTube</option><option value="other"${r.platform==='other'?' selected':''}>Other</option></select><input type="text" placeholder="https://..." class="soc-url" value="${esc(r.url)}">${xsvg('socialList')}</div>`);

  restoreList('eduList', d.education, e=>`<div class="item-row"><div class="fields"><input type="text" placeholder="Degree Name" class="edu-degree" value="${esc(e.degree)}"><input type="text" placeholder="Year" class="edu-year" value="${esc(e.year)}"><input type="text" placeholder="Institution" class="edu-inst s2" value="${esc(e.inst)}"><textarea placeholder="Description..." class="edu-desc s2" style="min-height:52px">${esc(e.desc)}</textarea></div>${xsvg('eduList')}</div>`);

  restoreList('workList', d.work, w=>`<div class="item-row"><div class="fields"><input type="text" placeholder="Job Title" class="work-title" value="${esc(w.title)}"><input type="text" placeholder="Company" class="work-company" value="${esc(w.company||'')}"><input type="text" placeholder="Years" class="work-year s2" value="${esc(w.year)}"><textarea placeholder="Description..." class="work-desc s2" style="min-height:52px">${esc(w.desc)}</textarea></div>${xsvg('workList')}</div>`);

  restoreList('projList', d.projects, p=>`<div class="item-row"><div class="proj-fields"><input type="text" placeholder="Project Title" class="proj-title s2" value="${esc(p.title)}"><input type="text" placeholder="Technologies Used" class="proj-tech s2" value="${esc(p.tech)}"><textarea placeholder="Description..." class="proj-desc s2" style="min-height:52px">${esc(p.desc)}</textarea><input type="text" placeholder="Project Link" class="proj-link s2" value="${esc(p.link)}"></div>${xsvg('projList')}</div>`);

  if(d.certifications && d.certifications.length){
    const certList = document.getElementById('certList');
    certList.innerHTML='';
    d.certifications.forEach(c=>{
      const div=document.createElement('div');
      div.className='item-row';
      div.innerHTML=`<div class="cert-fields"><div class="cert-img-drop s2" onclick="triggerCertImg(this)"><input type="file" accept="image/*" class="cert-img-input" onchange="prevCertImg(this)" style="display:none"><img class="cert-preview" alt="" ${c.img?`src="${c.img}" style="display:block"`:'style="display:none"'}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#555" stroke-width="1.4" stroke-linecap="round" ${c.img?'style="display:none"':''}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg><span class="ph-hint" ${c.img?'style="display:none"':''}>Click to upload certificate image</span></div><input type="text" placeholder="Certificate Title" class="cert-title s2" value="${esc(c.title)}"><textarea placeholder="Short description..." class="cert-desc s2" style="min-height:48px">${esc(c.desc)}</textarea><div style="display:flex;flex-direction:column;gap:4px"><label style="margin-bottom:3px">Date Start</label><input type="date" class="cert-start" value="${esc(c.start)}"></div><div style="display:flex;flex-direction:column;gap:4px"><label style="margin-bottom:3px">Date End / Expiry</label><input type="date" class="cert-end" value="${esc(c.end)}"></div></div>${xsvg('certList')}`;
      certList.appendChild(div); attachListeners(div);
    });
  }

  restoreList('awardList', d.awards, a=>`<div class="item-row"><div class="fields"><input type="text" placeholder="Award Name" class="award-name s2" value="${esc(a.name)}"><input type="text" placeholder="Year" class="award-year" value="${esc(a.year)}"><input type="text" placeholder="Issued by" class="award-org" value="${esc(a.org)}"><textarea placeholder="Description..." class="award-desc s2" style="min-height:48px">${esc(a.desc)}</textarea></div>${xsvg('awardList')}</div>`);

  restoreList('trainingList', d.trainings, t=>`<div class="item-row"><div class="fields"><input type="text" placeholder="Training Title" class="train-title s2" value="${esc(t.title)}"><input type="text" placeholder="Organizer" class="train-org" value="${esc(t.org)}"><input type="date" class="train-date" value="${esc(t.date)}"><textarea placeholder="Notes..." class="train-desc s2" style="min-height:44px">${esc(t.desc)}</textarea></div>${xsvg('trainingList')}</div>`);

  restoreSkillList('softList', d.software, false);
  restoreSkillList('interList', d.interpersonal, false);
  restoreSkillList('langList', d.languages, true);

  restoreList('refList', d.references, r=>`<div class="item-row"><div class="fields"><input type="text" placeholder="Full Name" class="ref-name s2" value="${esc(r.name)}"><input type="text" placeholder="Title / Bio" class="ref-bio" value="${esc(r.bio)}"><input type="tel" placeholder="Phone" class="ref-phone" value="${esc(r.phone)}"><input type="email" placeholder="Email" class="ref-email" value="${esc(r.email)}"><input type="text" placeholder="Address" class="ref-addr s2" value="${esc(r.addr)}"></div>${xsvg('refList')}</div>`);

  updateProgress();
}

function restoreList(listId, items, tplFn){
  if(!items || !items.length) return;
  const list = document.getElementById(listId);
  list.innerHTML = '';
  items.forEach(item=>{
    const tmp = document.createElement('div');
    tmp.innerHTML = tplFn(item);
    const el = tmp.firstElementChild;
    list.appendChild(el); attachListeners(el);
  });
}

function restoreSkillList(listId, items, isLang){
  if(!items || !items.length) return;
  const list = document.getElementById(listId);
  list.innerHTML = '';
  items.forEach(s=>{
    const d = document.createElement('div');
    d.className = 'skill-row';
    const opts = isLang
      ? `<option value="100"${s.level=='100'?' selected':''}>Native</option><option value="80"${s.level=='80'?' selected':''}>Fluent</option><option value="60"${s.level=='60'?' selected':''}>Intermediate</option><option value="40"${s.level=='40'?' selected':''}>Basic</option>`
      : `<option value="90"${s.level=='90'?' selected':''}>Expert</option><option value="75"${s.level=='75'?' selected':''}>Good</option><option value="55"${s.level=='55'?' selected':''}>Basic</option><option value="40"${s.level=='40'?' selected':''}>Learning</option>`;
    d.innerHTML = `<input type="text" placeholder="Skill name" class="sk-name" value="${esc(s.name)}"><select class="sk-level">${opts}</select>${xsvg(listId)}`;
    list.appendChild(d); attachListeners(d);
  });
}

function generate(e){
  e.preventDefault();
  const banner = document.getElementById('val-banner');
  if(!validateAll()){
    banner.classList.add('show');
    banner.scrollIntoView({behavior:'smooth', block:'center'});
    return;
  }
  banner.classList.remove('show');
  saveToStorage();
  const url = tpl===1 ? 'Resume_1.html' : 'Resume_2.html';
  // On mobile, window.open is often blocked; navigate in same tab instead
  const isMobile = window.innerWidth <= 768;
  if(isMobile){
    window.location.href = url;
  } else {
    const w = window.open(url, '_blank');
    if(!w) window.location.href = url; // fallback if popup blocked
  }
}

function clearData(){
  if(!confirm('Clear all saved data and reset the form?')) return;
  localStorage.removeItem('resumeData');
  location.reload();
}

document.addEventListener('DOMContentLoaded', ()=>{
  attachListeners(document.getElementById('rForm'));
  restoreFromStorage();
  updateProgress();
});
