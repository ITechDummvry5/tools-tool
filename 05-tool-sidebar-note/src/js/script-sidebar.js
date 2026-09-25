'use strict';

const $  = id  => document.getElementById(id);
const $$ = sel => document.querySelectorAll(sel);

/* ── MODULES — loaded live from Module Manager localStorage ── */
/*
 * MODS is no longer hardcoded. It is read from the same localStorage key
 * that the Module Manager (sidebar.html) writes to: 'usermanual_modules_v1'.
 * If nothing has been saved yet we fall back to an empty array so the app
 * still starts cleanly.  Every function that used to reference the old frozen
 * MODS constant now calls getMODS() so they always get the latest data.
 */
const MM_STORAGE_KEY = 'usermanual_modules_v1';

function getMODS() {
  try {
    const raw = localStorage.getItem(MM_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch(e) {
    console.warn('Could not read modules from localStorage:', e);
    return [];
  }
}

/* Thin compatibility shim so any remaining MODS references still work.
   Re-evaluated each time it is accessed via the getter. */
const MODS = new Proxy([], {
  get(_, prop) {
    const live = getMODS();
    if (prop === 'length')    return live.length;
    if (prop === 'forEach')   return live.forEach.bind(live);
    if (prop === 'map')       return live.map.bind(live);
    if (prop === 'find')      return live.find.bind(live);
    if (prop === 'filter')    return live.filter.bind(live);
    if (prop === 'flat')      return live.flat.bind(live);
    if (prop === Symbol.iterator) return live[Symbol.iterator].bind(live);
    if (typeof prop === 'string' && !isNaN(prop)) return live[+prop];
    return live[prop];
  }
});

/* ── Build TM & moduleSubKeys ─────────────────────────────── */
const TM = {};
const moduleSubKeys = {};
MODS.forEach(m => {
  TM[m.key] = {label: m.label, badge: m.badge, isParent: true};
  moduleSubKeys[m.key] = new Set();
  m.subs.forEach(s => {
    TM[s.key] = {label: m.label + ' › ' + s.label, badge: m.badge, parent: m.key};
    moduleSubKeys[m.key].add(s.key);
  });
});

const TAG_COLORS = Object.freeze([
  {bg:'#dbeafe',color:'#1e40af',dot:'#3b82f6'},
  {bg:'#dcfce7',color:'#166534',dot:'#22c55e'},
  {bg:'#fef9c3',color:'#854d0e',dot:'#eab308'},
  {bg:'#fce7f3',color:'#9d174d',dot:'#ec4899'},
  {bg:'#ede9fe',color:'#5b21b6',dot:'#8b5cf6'},
  {bg:'#ffedd5',color:'#9a3412',dot:'#f97316'},
  {bg:'#e0f2fe',color:'#0c4a6e',dot:'#0ea5e9'},
  {bg:'#f0fdf4',color:'#14532d',dot:'#4ade80'},
]);

const _emptySet = Object.freeze(new Set());

let activeFilter    = 'all';
let noteConnections = {};
let notes           = [];
let noteMap         = new Map();
let nextId          = 1;
let currentView     = 'grid';
let isDark          = false;
let connEditingId   = null;
let modalImgData    = null;
let modalTags       = [];
let selectedTagColor = 0;
let currentUserName = 'Admin';
let noteHistory     = {};
let tagIndex        = new Map();

/* ── Multi-image queue (modal) ─────────────────────────────── */
let _modalImgQueue  = [];   // [{dataUrl, name}]
let _modalActiveIdx = 0;    // which thumbnail is currently selected

const moduleCountCache = new Map();

function _rebuildModuleCountCache() {
  moduleCountCache.clear();
  for (const n of notes) {
    moduleCountCache.set(n.module, (moduleCountCache.get(n.module) || 0) + 1);
  }
}
function _incModuleCount(subKey) {
  moduleCountCache.set(subKey, (moduleCountCache.get(subKey) || 0) + 1);
}
function _decModuleCount(subKey) {
  const c = (moduleCountCache.get(subKey) || 1) - 1;
  if (c <= 0) moduleCountCache.delete(subKey);
  else moduleCountCache.set(subKey, c);
}

const DOM = {};
function cacheDom() {
  DOM.ptitle       = $('ptitle');
  DOM.pbadge       = $('pbadge');
  DOM.sinput       = $('sinput');
  DOM.sortSel      = $('sort-sel');
  DOM.filterTag    = $('filter-tag');
  DOM.filterImg    = $('filter-img');
  DOM.scnt         = $('scnt');
  DOM.ngrid        = $('ngrid');
  DOM.progBar      = $('prog-bar');
  DOM.progLabel    = $('prog-label');
  DOM.progFill     = $('prog-fill');
  DOM.progPct      = $('prog-pct');
  DOM.toast        = $('toast');
  DOM.toastMsg     = $('toastMsg');
  DOM.storageLabel = $('storage-label');
  DOM.darkIcon     = $('dark-icon');
  DOM.darkToggleBtn= $('dark-toggle-btn');
  DOM.vbtnGrid     = $('vbtn-grid');
  DOM.vbtnList     = $('vbtn-list');
  DOM.starredBtn   = $('starred-btn');
  DOM.bugBtn       = $('bug-btn');
  DOM.userNameDisp = $('user-name-disp');
}

/* ── Indexes ─────────────────────────────────────────────── */
function rebuildIndexes() {
  noteMap.clear(); tagIndex.clear();
  notes.forEach(n => {
    noteMap.set(n.id, n);
    (n.tags || []).forEach(t => {
      if (!tagIndex.has(t)) tagIndex.set(t, new Set());
      tagIndex.get(t).add(n.id);
    });
  });
  _rebuildModuleCountCache();
}
function addToIndexes(note) {
  noteMap.set(note.id, note);
  (note.tags || []).forEach(t => {
    if (!tagIndex.has(t)) tagIndex.set(t, new Set());
    tagIndex.get(t).add(note.id);
  });
  _incModuleCount(note.module);
}
function removeFromIndexes(note) {
  noteMap.delete(note.id);
  (note.tags || []).forEach(t => {
    tagIndex.get(t)?.delete(note.id);
    if (tagIndex.get(t)?.size === 0) tagIndex.delete(t);
  });
  _decModuleCount(note.module);
}
function updateIndexesForNote(oldNote, newNote) {
  (oldNote.tags || []).forEach(t => {
    tagIndex.get(t)?.delete(oldNote.id);
    if (tagIndex.get(t)?.size === 0) tagIndex.delete(t);
  });
  (newNote.tags || []).forEach(t => {
    if (!tagIndex.has(t)) tagIndex.set(t, new Set());
    tagIndex.get(t).add(newNote.id);
  });
  noteMap.set(newNote.id, newNote);
  if (oldNote.module !== newNote.module) {
    _decModuleCount(oldNote.module);
    _incModuleCount(newNote.module);
  }
}

/* ── Storage ─────────────────────────────────────────────── */
let _savedByteSize = 0;

const LS_KEY = 'usermanual2026_admin_v1';
let _saveTimer = null;
function saveToStorage(immediate = false) {
  if (immediate) { _doSave(); return; }
  clearTimeout(_saveTimer); _saveTimer = setTimeout(_doSave, 300);
}
function _doSave() {
  try {
    const connObj = {};
    for (const [k, v] of Object.entries(noteConnections)) connObj[k] = [...v];
    const payload = JSON.stringify({
      version:'admin-v1', notes, connections: connObj,
      nextId, isDark, currentUserName, noteHistory
    });
    localStorage.setItem(LS_KEY, payload);
    _savedByteSize = new Blob([payload]).size;
    _updateStoragePill();
  } catch(e) { console.warn('Save failed:', e); }
}
function loadFromStorage() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return false;
    _savedByteSize = new Blob([raw]).size;
    const data = JSON.parse(raw);
    if (data.notes && Array.isArray(data.notes)) {
      notes  = data.notes;
      nextId = data.nextId || (Math.max(...notes.map(n => n.id || 0), 0) + 1);
    }
    noteConnections = {};
    if (data.connections) {
      for (const [k, v] of Object.entries(data.connections))
        noteConnections[parseInt(k)] = new Set(v.map(Number));
    }
    noteHistory     = data.noteHistory || {};
    currentUserName = data.currentUserName || 'Admin';
    if (data.isDark) { isDark = true; document.body.classList.add('dark'); }
    return true;
  } catch(e) { return false; }
}
function _updateStoragePill() {
  if (!_savedByteSize) { DOM.storageLabel.textContent = 'No saved data'; return; }
  const kb = (_savedByteSize / 1024).toFixed(1);
  DOM.storageLabel.textContent = `Saved · ${notes.length} notes · ${kb} KB`;
}
function clearStorage() {
  if (!confirm('Delete ALL saved notes and settings?')) return;
  localStorage.removeItem(LS_KEY);
  notes = []; noteConnections = {}; nextId = 1; isDark = false; noteHistory = {};
  noteMap.clear(); tagIndex.clear(); moduleCountCache.clear(); _savedByteSize = 0;
  document.body.classList.remove('dark');
  renderNotes(); _updateStoragePill(); renderTagFilter();
  showToast('Saved data cleared.');
}

function recordHistory(note, changeDesc) {
  if (!noteHistory[note.id]) noteHistory[note.id] = [];
  noteHistory[note.id].unshift({
    ts: Date.now(), desc: changeDesc || 'Edited', author: currentUserName,
    snapshot: {title: note.title, desc: note.desc, fn: note.fn, link: note.link || '', module: note.module, tags: note.tags ? [...note.tags] : []},
  });
  if (noteHistory[note.id].length > 2) noteHistory[note.id].length = 2;
}

function promptUserName() {
  const n = prompt('Enter your display name:', currentUserName);
  if (n && n.trim()) {
    currentUserName = n.trim();
    DOM.userNameDisp.textContent = '👤 ' + currentUserName;
    saveToStorage();
  }
}
function toggleDark() {
  isDark = !isDark;
  document.body.classList.toggle('dark', isDark);
  DOM.darkIcon.className = isDark ? 'ti ti-sun' : 'ti ti-moon';
  DOM.darkToggleBtn.title = isDark ? 'Switch to light mode' : 'Switch to dark mode';
  saveToStorage();
}

/* ── Sidebar ─────────────────────────────────────────────── */
function buildSidebar() {
  const nav = $('snav-modules');
  const parts = [];
  MODS.forEach(m => {
    parts.push(`<div class="mod-group"><button class="mod-header" onclick="toggleMod('${m.key}',this)"><i class="ti ${m.icon} mi"></i>${m.label}<i class="ti ti-chevron-down ch"></i></button><div class="mod-items" id="mi-${m.key}">`);
    let lastGroup = null;
    m.subs.forEach(s => {
      if (s.group && s.group !== lastGroup) {
        lastGroup = s.group;
        parts.push(`<div class="sub-group-header"><i class="ti ${s.groupIcon||'ti-point'}"></i>${s.group}</div>`);
      }
      const cnt = moduleCountCache.get(s.key) || 0;
      parts.push(`<button class="sub-item" id="si-${s.key}" onclick="filterSub('${s.key}','${m.label} › ${s.label}','${m.badge}',this)"><i class="ti ${s.icon}"></i>${s.label}${cnt ? `<span class="sub-badge">${cnt}</span>` : ''}</button>`);
    });
    parts.push(`</div></div>`);
  });
  nav.innerHTML = parts.join('');
}

function refreshSidebarCounts() {
  MODS.forEach(m => m.subs.forEach(s => {
    const el = $('si-' + s.key); if (!el) return;
    const cnt = moduleCountCache.get(s.key) || 0;
    let badge = el.querySelector('.sub-badge');
    if (cnt) {
      if (!badge) { badge = document.createElement('span'); badge.className = 'sub-badge'; el.appendChild(badge); }
      badge.textContent = cnt;
    } else if (badge) { badge.remove(); }
  }));
}

function _clearSidebarActive() {
  $$('.mod-header').forEach(b => b.classList.remove('open'));
  $$('.mod-items').forEach(d => d.classList.remove('open'));
  $$('.sub-item').forEach(b => b.classList.remove('active'));
  DOM.starredBtn.classList.remove('active');
  DOM.bugBtn.classList.remove('active');
}
function filterAll(el) {
  activeFilter = 'all'; _clearSidebarActive(); el.classList.add('open');
  DOM.ptitle.textContent = 'All Notes'; DOM.pbadge.textContent = 'Manual';
  _invalidateRenderCache(); renderNotes();
}
function filterStarred(el) {
  activeFilter = 'starred'; _clearSidebarActive(); el.classList.add('active');
  DOM.ptitle.textContent = 'Starred Notes'; DOM.pbadge.textContent = 'Starred';
  _invalidateRenderCache(); renderNotes();
}
function filterBugs(el) {
  activeFilter = 'bugs'; _clearSidebarActive(); el.classList.add('active');
  DOM.ptitle.textContent = 'Bug Reports'; DOM.pbadge.textContent = 'Bugs';
  _invalidateRenderCache(); renderNotes();
}
function toggleMod(key, el) {
  const items = $('mi-' + key); const wasOpen = items.classList.contains('open');
  _clearSidebarActive();
  if (!wasOpen) { items.classList.add('open'); el.classList.add('open'); }
}
function filterSub(subKey, label, badge, el) {
  activeFilter = subKey;
  $$('.sub-item').forEach(b => b.classList.remove('active'));
  DOM.starredBtn.classList.remove('active');
  DOM.bugBtn.classList.remove('active');
  el.classList.add('active');
  DOM.ptitle.textContent = label; DOM.pbadge.textContent = badge;
  DOM.sinput.value = '';
  _invalidateRenderCache(); renderNotes();
}

function getFiltered() {
  const q = DOM.sinput.value.toLowerCase();
  const imgF = DOM.filterImg.value;
  const tagF = DOM.filterTag.value;
  let base;
  if (activeFilter === 'starred') { base = notes.filter(n => n.starred); }
  else if (activeFilter === 'bugs') { base = notes.filter(n => n.hasBug); }
  else if (activeFilter !== 'all') {
    const subSet = moduleSubKeys[activeFilter];
    base = subSet ? notes.filter(n => subSet.has(n.module)) : notes.filter(n => n.module === activeFilter);
  } else { base = notes; }
  if (tagF) { const ids = tagIndex.get(tagF); if (!ids || ids.size === 0) return []; base = base.filter(n => ids.has(n.id)); }
  if (imgF === 'with')    base = base.filter(n => n.img);
  if (imgF === 'without') base = base.filter(n => !n.img);
  if (q) base = base.filter(n => (n.title + n.desc + n.fn + (n.link||'') + (n.tags || []).join(' ')).toLowerCase().includes(q));
  return base;
}
function getSorted(arr) {
  const s = DOM.sortSel.value;
  return [...arr].sort((a, b) => {
    switch (s) {
      case 'date-asc':    return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      case 'title-asc':   return a.title.localeCompare(b.title);
      case 'title-desc':  return b.title.localeCompare(a.title);
      case 'connections': return ((noteConnections[b.id] || _emptySet).size) - ((noteConnections[a.id] || _emptySet).size);
      default:            return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    }
  });
}

function updateProgress() {
  if (activeFilter === 'all' || activeFilter === 'starred') {
    let total = 0, covered = 0;
    MODS.forEach(m => {
      total += m.subs.length;
      m.subs.forEach(s => { if (moduleCountCache.has(s.key)) covered++; });
    });
    const pct = total ? Math.round(covered / total * 100) : 0;
    DOM.progLabel.textContent = `Documentation coverage: ${covered}/${total} sub-pages`;
    DOM.progFill.style.width = pct + '%'; DOM.progPct.textContent = pct + '%';
    DOM.progBar.style.display = 'flex';
  } else {
    const mod = MODS.find(m => m.key === activeFilter);
    if (mod) {
      const total = mod.subs.length;
      const covered = mod.subs.filter(s => moduleCountCache.has(s.key)).length;
      const pct = total ? Math.round(covered / total * 100) : 0;
      DOM.progLabel.textContent = `${mod.label} coverage: ${covered}/${total}`;
      DOM.progFill.style.width = pct + '%'; DOM.progPct.textContent = pct + '%';
      DOM.progBar.style.display = 'flex';
    } else { DOM.progBar.style.display = 'none'; }
  }
}

function setView(v) {
  currentView = v;
  DOM.vbtnGrid.classList.toggle('active', v === 'grid');
  DOM.vbtnList.classList.toggle('active', v === 'list');
  DOM.ngrid.className = v === 'grid' ? 'notes-grid' : 'notes-list';
  _invalidateRenderCache(); renderNotes();
}

function renderTagFilter() {
  const cur = DOM.filterTag.value;
  const parts = ['<option value="">All tags</option>'];
  tagIndex.forEach((_, t) => { parts.push(`<option value="${esc(t)}"${t === cur ? ' selected' : ''}>${esc(t)}</option>`); });
  DOM.filterTag.innerHTML = parts.join('');
}

/* ── Render cache ─────────────────────────────────────────── */
let _renderCacheKey  = null;
let _renderCacheData = null;

function _getRenderCacheKey() {
  return [
    activeFilter,
    DOM.sinput.value,
    DOM.sortSel.value,
    DOM.filterTag.value,
    DOM.filterImg.value,
    currentView,
    notes.length,
    JSON.stringify(Object.keys(noteConnections).map(k => (noteConnections[k]||_emptySet).size)),
  ].join('|');
}
function _invalidateRenderCache() { _renderCacheKey = null; _renderCacheData = null; }

let _searchTimer = null;
function debouncedRender() { clearTimeout(_searchTimer); _searchTimer = setTimeout(renderNotes, 150); }
function esc(s) { return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function getConnectedNotes(id) {
  return [...(noteConnections[id] || _emptySet)].map(cid => noteMap.get(cid)).filter(Boolean);
}

function initGridDelegation() {
  DOM.ngrid.addEventListener('click', e => {
    const btn = e.target.closest('[data-action]'); if (!btn) return;
    const id = parseInt(btn.dataset.id); const act = btn.dataset.action;
    if (act === 'star')      toggleStar(id);
    else if (act === 'bug')  toggleBug(id);
    else if (act === 'conn') openConnModal(id);
    else if (act === 'hist') openHistoryModal(id);
    else if (act === 'edit') openModal(id);
    else if (act === 'del')  deleteNote(id);
    else if (act === 'img')  triggerImgPick(id);
    else if (act === 'rimg') removeImg(id);
  });
}

function renderNotes() {
  const cacheKey = _getRenderCacheKey();
  let filtered;
  if (cacheKey === _renderCacheKey && _renderCacheData) {
    filtered = _renderCacheData;
  } else {
    filtered = getSorted(getFiltered());
    _renderCacheKey  = cacheKey;
    _renderCacheData = filtered;
  }

  DOM.scnt.textContent = filtered.length + ' note' + (filtered.length !== 1 ? 's' : '');
  updateProgress();

  if (!filtered.length) {
    DOM.ngrid.innerHTML = '<div class="empty-state"><i class="ti ti-notes"></i><div style="font-size:14px;font-weight:500;margin-bottom:4px;color:var(--primary)">No notes yet</div><div style="font-size:12px;color:var(--primary-icon)">Click <strong>+ Add Note</strong> to get started.</div></div>';
    return;
  }
  const parts = [];
  if (currentView === 'list') {
    filtered.forEach(n => {
      const tm = TM[n.module] || {badge:'—'};
      const imgEl = n.img ? `<img class="list-item-img" src="${n.img}" alt="">` : `<div class="list-item-img placeholder"><i class="ti ti-photo"></i></div>`;
      parts.push(`<div class="list-item" id="nc-${n.id}">${imgEl}<div class="list-item-body"><div class="list-item-title">${esc(n.title)}${n.starred?' ⭐':''}</div><div class="list-item-desc">${esc(n.desc)}</div></div><div class="list-item-meta"><span class="list-item-tag">${tm.badge}</span><span class="list-item-date">${n.date||''}</span><button class="icon-btn" data-action="edit" data-id="${n.id}"><i class="ti ti-edit"></i></button><button class="icon-btn" data-action="del" data-id="${n.id}"><i class="ti ti-trash"></i></button></div></div>`);
    });
  } else {
    filtered.forEach(n => {
      const tm = TM[n.module] || {badge:'—'};
      const imgSection = n.img
        ? `<div class="note-img-wrap"><img src="${n.img}" alt=""><button class="img-remove-btn" data-action="rimg" data-id="${n.id}"><i class="ti ti-x"></i></button></div>`
        : `<div class="note-img-wrap"><button class="note-img-placeholder" data-action="img" data-id="${n.id}"><i class="ti ti-photo"></i><span>Click to add image</span></button></div>`;
      const connected = getConnectedNotes(n.id);
      const connChips = connected.map(cn => `<span class="note-conn-chip"><i class="ti ti-arrow-right"></i>${esc(cn.title.slice(0,16))}</span>`).join('');
      const tagsHtml  = (n.tags||[]).map(t => {
        const c = TAG_COLORS[n.tagColors?.[t]||0]||TAG_COLORS[0];
        return `<span class="tag-chip" style="background:${c.bg};color:${c.color}">${esc(t)}</span>`;
      }).join('');
      const authorStr = n.author ? `<span class="note-author"><i class="ti ti-user" style="font-size:10px"></i>${esc(n.author)}</span>` : '';

      const linkHtml = n.link
        ? `<div style="margin-top:4px"><a href="${esc(n.link)}" target="_blank" rel="noopener" style="font-size:10px;color:#1a7a3a;word-break:break-all;display:inline-flex;align-items:center;gap:3px;text-decoration:none;"><i class="ti ti-external-link" style="font-size:11px;flex-shrink:0"></i>${esc(n.link)}</a></div>`
        : '';

      parts.push(`<div class="note-card${n.starred?' starred-card':''}${n.hasBug?' bug-card':''}" id="nc-${n.id}">${imgSection}<div class="note-body"><div class="note-header-row"><span class="note-tag">${tm.badge}</span><button class="star-btn${n.starred?' starred':''}" data-action="star" data-id="${n.id}"><i class="ti ti-star${n.starred?'-filled':''}"></i></button><button class="bug-btn${n.hasBug?' has-bug':''}" data-action="bug" data-id="${n.id}" title="Mark as bug"><i class="ti ti-bug${n.hasBug?'-filled':''}"></i></button></div><div class="note-title">${esc(n.title)}</div><div class="note-desc">${esc(n.desc)}</div><div class="note-fn"><strong>Bug Report</strong>${esc(n.fn)}${linkHtml}</div>${tagsHtml?`<div class="note-tags-row">${tagsHtml}</div>`:''}<div class="note-conn-bar">${connChips}<button class="note-conn-add" data-action="conn" data-id="${n.id}"><i class="ti ti-plus"></i>${connected.length?'Edit':'Add'} connections</button></div><div class="note-meta"><div style="display:flex;flex-direction:column;gap:1px">${authorStr}<span class="note-date"><i class="ti ti-calendar" style="font-size:10px;vertical-align:-1px;margin-right:2px"></i>${n.date||''}</span></div><div class="note-actions"><button class="icon-btn" data-action="hist" data-id="${n.id}"><i class="ti ti-history"></i></button><button class="icon-btn" data-action="edit" data-id="${n.id}"><i class="ti ti-edit"></i></button><button class="icon-btn" data-action="del" data-id="${n.id}"><i class="ti ti-trash"></i></button></div></div></div></div>`);
    });
  }
  DOM.ngrid.innerHTML = parts.join('');
}

function toggleStar(id) {
  const n = noteMap.get(id); if (!n) return;
  n.starred = !n.starred;
  _invalidateRenderCache();

  const card = $('nc-' + id);
  if (card && currentView === 'grid') {
    card.classList.toggle('starred-card', n.starred);
    const btn = card.querySelector(`[data-action="star"][data-id="${id}"]`);
    if (btn) {
      btn.classList.toggle('starred', n.starred);
      const icon = btn.querySelector('i');
      if (icon) icon.className = 'ti ti-star' + (n.starred ? '-filled' : '');
    }
    if (activeFilter === 'starred' && !n.starred) renderNotes();
  } else {
    renderNotes();
  }
  saveToStorage();
}

function toggleBug(id) {
  const n = noteMap.get(id); if (!n) return;
  n.hasBug = !n.hasBug;
  _invalidateRenderCache();

  const card = $('nc-' + id);
  if (card && currentView === 'grid') {
    card.classList.toggle('bug-card', n.hasBug);
    const btn = card.querySelector(`.bug-btn[data-id="${id}"]`);
    if (btn) {
      btn.classList.toggle('has-bug', n.hasBug);
      const icon = btn.querySelector('i');
      if (icon) icon.className = 'ti ti-bug' + (n.hasBug ? '-filled' : '');
    }
    if (activeFilter === 'bugs' && !n.hasBug) renderNotes();
  } else {
    renderNotes();
  }
  saveToStorage();
}

function openConnModal(noteId) {
  connEditingId = noteId;
  const note = noteMap.get(noteId); const current = noteConnections[noteId] || _emptySet;
  $('conn-modal-title').textContent = `Connect: "${note.title.slice(0,28)}"`;
  const body = $('conn-modal-body');
  const parts = [`<div class="conn-modal-sub">Select notes to connect:</div>`];
  notes.forEach(n => {
    if (n.id === noteId) { parts.push(`<div class="conn-note-row self"><div class="conn-note-cb"></div><div class="conn-note-label">${esc(n.title)}</div><div class="conn-note-badge">(this note)</div></div>`); return; }
    const checked = current.has(n.id);
    parts.push(`<div class="conn-note-row${checked?' checked':''}" data-nid="${n.id}" onclick="toggleConnRow(this)"><div class="conn-note-cb">${checked?'✓':''}</div><div class="conn-note-label">${esc(n.title)}</div><div class="conn-note-badge">${(TM[n.module]||{badge:'—'}).badge}</div></div>`);
  });
  body.innerHTML = parts.join('');
  $('conn-modal-overlay').classList.add('open');
}
function toggleConnRow(el) { el.classList.toggle('checked'); el.querySelector('.conn-note-cb').textContent = el.classList.contains('checked') ? '✓' : ''; }
function saveConnections() {
  const checked = [...$$('#conn-modal-body .conn-note-row.checked')].map(el => parseInt(el.dataset.nid));
  noteConnections[connEditingId] = new Set(checked);
  _invalidateRenderCache();
  closeConnModal(); renderNotes(); saveToStorage();
}
function closeConnModal() { $('conn-modal-overlay').classList.remove('open'); connEditingId = null; }

const _fileInputs = new Map();
function triggerImgPick(id) {
  let inp = _fileInputs.get(id);
  if (!inp) {
    inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*'; inp.style.display = 'none';
    inp.onchange = e => {
      const f = e.target.files[0]; if (!f) return;
      const r = new FileReader();
      r.onload = ev => {
        const n = noteMap.get(id);
        if (n) { n.img = ev.target.result; _invalidateRenderCache(); renderNotes(); saveToStorage(); }
      };
      r.readAsDataURL(f);
    };
    document.body.appendChild(inp); _fileInputs.set(id, inp);
  }
  inp.click();
}
function removeImg(id) {
  const n = noteMap.get(id);
  if (n) { n.img = null; _invalidateRenderCache(); renderNotes(); saveToStorage(); }
}

function getModOpts(sel) {
  return MODS.map(m => `<optgroup label="${m.label}">${m.subs.map(s=>`<option value="${s.key}"${s.key===sel?' selected':''}>${s.label}</option>`).join('')}</optgroup>`).join('');
}
let _modalTagColors = {};
function buildTagsUI(container, tags, colors) {
  modalTags = [...tags]; _modalTagColors = {...colors}; _renderTagChips(container);
}
function _renderTagChips(container) {
  const chipsWrap = container.querySelector('.chips-area');
  chipsWrap.innerHTML = modalTags.map(t => {
    const ci = _modalTagColors[t] !== undefined ? _modalTagColors[t] : selectedTagColor;
    const c = TAG_COLORS[ci]||TAG_COLORS[0];
    return `<span class="tag-chip" style="background:${c.bg};color:${c.color}" data-tag="${esc(t)}">${esc(t)}<button onclick="_removeModalTag('${esc(t)}',this.closest('.tags-input-wrap'))" title="Remove">×</button></span>`;
  }).join('');
}
function _removeModalTag(tag, wrap) { modalTags = modalTags.filter(t => t !== tag); delete _modalTagColors[tag]; _renderTagChips(wrap); }

/* ════════════════════════════════════════════════════════════
   MODAL IMAGE QUEUE — multi-select + paste support
════════════════════════════════════════════════════════════ */

/**
 * Reads a File object → base64 dataURL, returns a Promise.
 */
function _fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload  = e => resolve(e.target.result);
    r.onerror = () => reject(new Error('Read failed'));
    r.readAsDataURL(file);
  });
}

/**
 * Adds one or more File objects to the queue and re-renders the zone.
 */
async function _enqueueFiles(files) {
  for (const f of files) {
    if (!f.type.startsWith('image/')) continue;
    try {
      const dataUrl = await _fileToDataUrl(f);
      _modalImgQueue.push({ dataUrl, name: f.name || 'image' });
    } catch(e) { console.warn('Could not read image:', e); }
  }
  if (_modalImgQueue.length > 0) {
    _modalActiveIdx = _modalImgQueue.length - 1; // jump to newest
    modalImgData    = _modalImgQueue[_modalActiveIdx].dataUrl;
  }
  _renderImgZone();
}

/**
 * Selects an image from the queue by index.
 */
function _selectQueueImg(idx) {
  _modalActiveIdx = idx;
  modalImgData    = _modalImgQueue[idx].dataUrl;
  _renderImgZone();
}

/**
 * Removes one image from the queue by index.
 */
function _removeQueueImg(idx, e) {
  e.stopPropagation();
  _modalImgQueue.splice(idx, 1);
  if (_modalImgQueue.length === 0) {
    modalImgData    = null;
    _modalActiveIdx = 0;
  } else {
    _modalActiveIdx = Math.min(_modalActiveIdx, _modalImgQueue.length - 1);
    modalImgData    = _modalImgQueue[_modalActiveIdx].dataUrl;
  }
  _renderImgZone();
}

/**
 * Re-draws everything inside #miz based on _modalImgQueue.
 */
function _renderImgZone() {
  const zone = $('miz'); if (!zone) return;
  const hasImgs = _modalImgQueue.length > 0;

  // ── main preview ──
  let preview = zone.querySelector('.miz-preview');
  if (!preview) {
    preview = document.createElement('img');
    preview.className = 'miz-preview';
    preview.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;border-radius:8px;pointer-events:none';
    zone.insertBefore(preview, zone.firstChild);
  }
  preview.src   = hasImgs ? _modalImgQueue[_modalActiveIdx].dataUrl : '';
  preview.style.display = hasImgs ? 'block' : 'none';

  // ── placeholder text / icon ──
  const icon = $('miz-icon'), txt = $('miz-txt');
  if (icon) icon.style.display = hasImgs ? 'none' : '';
  if (txt)  txt.style.display  = hasImgs ? 'none' : '';

  // ── paste hint ──
  let hint = zone.querySelector('.miz-paste-hint');
  if (!hint) {
    hint = document.createElement('div');
    hint.className = 'miz-paste-hint';
    hint.style.cssText = 'position:absolute;top:6px;left:8px;font-size:9px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:rgba(255,255,255,0.85);background:rgba(0,0,0,0.45);padding:2px 7px;border-radius:10px;pointer-events:none;backdrop-filter:blur(4px)';
    hint.textContent = 'Ctrl+V to paste';
    zone.appendChild(hint);
  }
  hint.style.display = hasImgs ? 'none' : '';

  // ── thumbnail strip ──
  let strip = zone.querySelector('.miz-strip');
  if (!strip) {
    strip = document.createElement('div');
    strip.className = 'miz-strip';
    strip.style.cssText = 'position:absolute;bottom:0;left:0;right:0;display:flex;gap:4px;padding:6px;background:linear-gradient(transparent,rgba(0,0,0,0.55));border-radius:0 0 8px 8px;overflow-x:auto;scrollbar-width:none';
    zone.appendChild(strip);
  }

  if (_modalImgQueue.length <= 1) {
    strip.style.display = 'none';
  } else {
    strip.style.display = 'flex';
    strip.innerHTML = _modalImgQueue.map((img, i) => `
      <div class="miz-thumb${i === _modalActiveIdx ? ' miz-thumb-active' : ''}"
           onclick="_selectQueueImg(${i})"
           style="position:relative;flex-shrink:0;width:44px;height:44px;border-radius:5px;overflow:hidden;cursor:pointer;border:2px solid ${i === _modalActiveIdx ? '#4fc87a' : 'rgba(255,255,255,0.3)'};transition:border-color .12s">
        <img src="${img.dataUrl}" style="width:100%;height:100%;object-fit:cover;display:block;pointer-events:none">
        <button onclick="_removeQueueImg(${i}, event)"
                style="position:absolute;top:1px;right:1px;width:16px;height:16px;border-radius:50%;border:none;background:rgba(0,0,0,0.7);color:#fff;font-size:9px;cursor:pointer;display:flex;align-items:center;justify-content:center;line-height:1;padding:0">×</button>
      </div>`).join('');
  }

  // ── count badge ──
  let badge = zone.querySelector('.miz-count');
  if (!badge) {
    badge = document.createElement('div');
    badge.className = 'miz-count';
    badge.style.cssText = 'position:absolute;top:6px;right:8px;font-size:9px;font-weight:700;background:rgba(26,122,58,0.9);color:#fff;padding:2px 7px;border-radius:10px;pointer-events:none';
    zone.appendChild(badge);
  }
  badge.style.display = _modalImgQueue.length > 1 ? '' : 'none';
  badge.textContent   = `${_modalActiveIdx + 1} / ${_modalImgQueue.length}`;
}

/**
 * Sets up paste listener scoped to the modal overlay.
 * Returns a cleanup function to call when modal closes.
 */
function _initModalPaste(overlayEl) {
  function onPaste(e) {
    // Only fire when the modal is in the DOM and we're on step 1
    if (!document.contains(overlayEl)) return;
    if (_modalStep !== 1) return;
    const items = e.clipboardData?.items;
    if (!items) return;
    const imageFiles = [];
    for (const item of items) {
      if (item.kind === 'file' && item.type.startsWith('image/')) {
        const f = item.getAsFile();
        if (f) imageFiles.push(f);
      }
    }
    if (imageFiles.length > 0) {
      e.preventDefault();
      _enqueueFiles(imageFiles);
      // Flash the zone briefly to confirm paste was received
      const zone = $('miz');
      if (zone) {
        zone.style.transition = 'box-shadow .15s';
        zone.style.boxShadow  = '0 0 0 3px #4fc87a';
        setTimeout(() => { if (zone) zone.style.boxShadow = ''; }, 600);
      }
    }
  }
  document.addEventListener('paste', onPaste);
  return () => document.removeEventListener('paste', onPaste);
}

/* ── TWO-STEP MODAL ──────────────────────────────────────── */
/* Step 1 = Documentation note  |  Step 2 = Issue / Bug Report */

let _modalStep = 1; // 1 or 2

/* Cached Step-1 values — populated in _goToStep2() so they survive DOM replacement */
let _s1title = '';
let _s1desc  = '';
let _s1mod   = '';
let _s1link  = '';

/* Issue-report image queue (separate from doc-note queue) */
let _issueImgQueue  = [];
let _issueActiveIdx = 0;

function _fileToDataUrlIssue(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload  = e => resolve(e.target.result);
    r.onerror = () => reject(new Error('Read failed'));
    r.readAsDataURL(file);
  });
}

async function _enqueueIssueFiles(files) {
  for (const f of files) {
    if (!f.type.startsWith('image/')) continue;
    try {
      const dataUrl = await _fileToDataUrlIssue(f);
      _issueImgQueue.push({ dataUrl, name: f.name || 'image' });
    } catch(e) { console.warn('Could not read issue image:', e); }
  }
  if (_issueImgQueue.length > 0) {
    _issueActiveIdx = _issueImgQueue.length - 1;
  }
  _renderIssueImgZone();
}

function _selectIssueQueueImg(idx) {
  _issueActiveIdx = idx;
  _renderIssueImgZone();
}

function _removeIssueQueueImg(idx, e) {
  e.stopPropagation();
  _issueImgQueue.splice(idx, 1);
  if (_issueImgQueue.length === 0) {
    _issueActiveIdx = 0;
  } else {
    _issueActiveIdx = Math.min(_issueActiveIdx, _issueImgQueue.length - 1);
  }
  _renderIssueImgZone();
}

function _renderIssueImgZone() {
  const zone = $('issue-iz'); if (!zone) return;
  const hasImgs = _issueImgQueue.length > 0;

  let preview = zone.querySelector('.miz-preview');
  if (!preview) {
    preview = document.createElement('img');
    preview.className = 'miz-preview';
    preview.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;border-radius:8px;pointer-events:none';
    zone.insertBefore(preview, zone.firstChild);
  }
  preview.src   = hasImgs ? _issueImgQueue[_issueActiveIdx].dataUrl : '';
  preview.style.display = hasImgs ? 'block' : 'none';

  const icon = $('issue-iz-icon'), txt = $('issue-iz-txt');
  if (icon) icon.style.display = hasImgs ? 'none' : '';
  if (txt)  txt.style.display  = hasImgs ? 'none' : '';

  let hint = zone.querySelector('.miz-paste-hint');
  if (!hint) {
    hint = document.createElement('div');
    hint.className = 'miz-paste-hint';
    hint.style.cssText = 'position:absolute;top:6px;left:8px;font-size:9px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:rgba(255,255,255,0.85);background:rgba(0,0,0,0.45);padding:2px 7px;border-radius:10px;pointer-events:none;backdrop-filter:blur(4px)';
    hint.textContent = 'Ctrl+V to paste';
    zone.appendChild(hint);
  }
  hint.style.display = hasImgs ? 'none' : '';

  let strip = zone.querySelector('.miz-strip');
  if (!strip) {
    strip = document.createElement('div');
    strip.className = 'miz-strip';
    strip.style.cssText = 'position:absolute;bottom:0;left:0;right:0;display:flex;gap:4px;padding:6px;background:linear-gradient(transparent,rgba(0,0,0,0.55));border-radius:0 0 8px 8px;overflow-x:auto;scrollbar-width:none';
    zone.appendChild(strip);
  }
  if (_issueImgQueue.length <= 1) {
    strip.style.display = 'none';
  } else {
    strip.style.display = 'flex';
    strip.innerHTML = _issueImgQueue.map((img, i) => `
      <div class="miz-thumb${i === _issueActiveIdx ? ' miz-thumb-active' : ''}"
           onclick="_selectIssueQueueImg(${i})"
           style="position:relative;flex-shrink:0;width:44px;height:44px;border-radius:5px;overflow:hidden;cursor:pointer;border:2px solid ${i === _issueActiveIdx ? '#4fc87a' : 'rgba(255,255,255,0.3)'};transition:border-color .12s">
        <img src="${img.dataUrl}" style="width:100%;height:100%;object-fit:cover;display:block;pointer-events:none">
        <button onclick="_removeIssueQueueImg(${i}, event)"
                style="position:absolute;top:1px;right:1px;width:16px;height:16px;border-radius:50%;border:none;background:rgba(0,0,0,0.7);color:#fff;font-size:9px;cursor:pointer;display:flex;align-items:center;justify-content:center;line-height:1;padding:0">×</button>
      </div>`).join('');
  }

  let badge = zone.querySelector('.miz-count');
  if (!badge) {
    badge = document.createElement('div');
    badge.className = 'miz-count';
    badge.style.cssText = 'position:absolute;top:6px;right:8px;font-size:9px;font-weight:700;background:rgba(26,122,58,0.9);color:#fff;padding:2px 7px;border-radius:10px;pointer-events:none';
    zone.appendChild(badge);
  }
  badge.style.display = _issueImgQueue.length > 1 ? '' : 'none';
  badge.textContent   = `${_issueActiveIdx + 1} / ${_issueImgQueue.length}`;
}

function issueImgChange(inp) {
  if (!inp.files || inp.files.length === 0) return;
  _enqueueIssueFiles(Array.from(inp.files));
  inp.value = '';
}

function _initIssuePaste(overlayEl) {
  function onPaste(e) {
    if (!document.contains(overlayEl)) return;
    if (_modalStep !== 2) return;
    const items = e.clipboardData?.items;
    if (!items) return;
    const imageFiles = [];
    for (const item of items) {
      if (item.kind === 'file' && item.type.startsWith('image/')) {
        const f = item.getAsFile();
        if (f) imageFiles.push(f);
      }
    }
    if (imageFiles.length > 0) {
      e.preventDefault();
      _enqueueIssueFiles(imageFiles);
      const zone = $('issue-iz');
      if (zone) {
        zone.style.transition = 'box-shadow .15s';
        zone.style.boxShadow  = '0 0 0 3px #4fc87a';
        setTimeout(() => { if (zone) zone.style.boxShadow = ''; }, 600);
      }
    }
  }
  document.addEventListener('paste', onPaste);
  return () => document.removeEventListener('paste', onPaste);
}

function _stepIndicator(step) {
  return `
  <div style="display:flex;align-items:center;gap:0;margin-bottom:4px">
    <div style="display:flex;align-items:center;gap:6px">
      <div style="width:26px;height:26px;border-radius:50%;background:${step===1?'#1a7a3a':'#4fc87a'};color:#fff;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0">
        ${step>1?'<i class="ti ti-check" style="font-size:11px"></i>':'1'}
      </div>
      <span style="font-size:11px;font-weight:${step===1?'700':'500'};color:${step===1?'var(--primary-heading)':'#4fc87a'}">Documentation</span>
    </div>
    <div style="flex:1;height:2px;background:${step>1?'#4fc87a':'var(--border)'};margin:0 10px;border-radius:2px"></div>
    <div style="display:flex;align-items:center;gap:6px">
      <div style="width:26px;height:26px;border-radius:50%;background:${step===2?'#c0392b':'var(--border)'};color:${step===2?'#fff':'var(--primary-icon)'};font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0">2</div>
      <span style="font-size:11px;font-weight:${step===2?'700':'400'};color:${step===2?'var(--primary-heading)':'var(--primary-icon)'}">Issue Report</span>
    </div>
  </div>`;
}

function _renderStep1HTML(n) {
  return `
  <div class="modal-body" id="step1-body" style="display:grid;grid-template-columns:1fr 1fr;gap:20px;padding:0 20px 20px">
    <!-- LEFT COLUMN -->
    <div style="display:flex;flex-direction:column;gap:14px">
      <div class="form-row">
        <label class="form-label">Module / Sub-page</label>
        <select id="m-mod">${getModOpts(n ? n.module : 'dashboard')}</select>
      </div>
      <div class="form-row">
        <label class="form-label">Title <span style="color:#e74c3c">*</span></label>
        <input type="text" id="m-title" value="${n ? esc(n.title) : ''}" placeholder="Feature / page title">
      </div>
      <div class="form-row">
        <label class="form-label">Description <span style="color:#e74c3c">*</span></label>
        <textarea id="m-desc" placeholder="What does this page / feature do?">${n ? esc(n.desc) : ''}</textarea>
      </div>
      <div class="form-row">
        <label class="form-label">URL / Link</label>
        <input type="url" id="m-link" value="${n ? esc(n.link || '') : ''}" placeholder="https://example.com/page">
      </div>
      <div class="form-row">
        <label class="form-label">Custom Tags</label>
        <div class="tags-input-wrap" id="tags-wrap" onclick="this.querySelector('.tag-real-input').focus()">
          <div class="chips-area" style="display:flex;flex-wrap:wrap;gap:4px;align-items:center"></div>
          <input class="tag-real-input" placeholder="Type tag + Enter" style="border:none;background:none;outline:none;font-family:'DM Sans',sans-serif;font-size:12px;color:var(--primary-heading);min-width:80px;flex:1">
        </div>
        <div class="tag-colors" id="tag-color-picker">${TAG_COLORS.map((c,i) => `<div class="tag-color-dot${i===0?' sel':''}" style="background:${c.dot}" data-ci="${i}" onclick="selectTagColor(${i},this)"></div>`).join('')}</div>
      </div>
    </div>
    <!-- RIGHT COLUMN: Screenshot -->
    <div style="display:flex;flex-direction:column;gap:14px">
      <div class="form-row" style="flex:1">
        <label class="form-label" style="display:flex;align-items:center;justify-content:space-between">
          <span>Screenshot / Image</span>
          <span style="font-size:10px;color:var(--primary-icon);font-weight:400;text-transform:none;letter-spacing:0">Click · multi-select · or paste (Ctrl+V)</span>
        </label>
        <div class="img-upload-zone" id="miz" style="flex:1;min-height:220px;aspect-ratio:unset;position:relative;overflow:hidden">
          <i class="ti ti-upload" id="miz-icon"></i>
          <span id="miz-txt">Click or paste screenshots here</span>
          <input type="file" accept="image/*" multiple style="position:absolute;inset:0;opacity:0;cursor:pointer;width:100%;height:100%;z-index:2" onchange="modalImgChange(this)">
        </div>
      </div>
    </div>
  </div>`;
}

function _renderStep2HTML(n) {
  const br = n && n.bugReport ? n.bugReport : {};
  const SEVER = ['Critical','High','Medium','Low'];
  const PRIOR = ['Urgent','High','Normal','Low'];
  const severOpts = SEVER.map(s => `<option value="${s}"${br.severity===s?' selected':''}>${s}</option>`).join('');
  const priorOpts = PRIOR.map(p => `<option value="${p}"${br.priority===p?' selected':''}>${p}</option>`).join('');
  const modOpts    = MODS.map(m => `<option value="${m.key}"${br.brModule===m.key?' selected':''}>${m.label}</option>`).join('');
  const selectedMod = br.brModule || '';
  const subModOpts  = MODS
    .filter(m => !selectedMod || m.key === selectedMod)
    .flatMap(m => m.subs.map(s => `<option value="${s.key}"${br.brSubmodule===s.key?' selected':''}>${s.label}</option>`))
    .join('');
  const assignees = ['— Unassigned —','QA Team','Developer','Project Manager','Support'];
  const assignOpts = assignees.map(a => `<option value="${a}"${br.assignTo===a?' selected':''}>${a}</option>`).join('');

  return `
  <div class="modal-body" id="step2-body" style="display:grid;grid-template-columns:1fr 1fr;gap:20px;padding:0 20px 20px;max-height:60vh;overflow-y:auto">
    <!-- LEFT COLUMN -->
    <div style="display:flex;flex-direction:column;gap:12px">
      <div class="form-row">
        <label class="form-label" style="display:flex;align-items:center;gap:5px">
          <i class="ti ti-link" style="font-size:12px;color:#e74c3c"></i>Problem URL / Link <span style="color:#e74c3c">*</span>
        </label>
        <input type="url" id="br-url" value="${br.url ? esc(br.url) : ''}" placeholder="https://example.com/broken-page">
      </div>
      <div class="form-row">
        <label class="form-label">Issue Title <span style="color:#e74c3c">*</span></label>
        <input type="text" id="br-title" value="${br.title ? esc(br.title) : ''}" placeholder="Short summary of the issue">
      </div>
      <div class="form-row">
        <label class="form-label">Problem Report <span style="color:#e74c3c">*</span></label>
        <textarea id="br-report" style="min-height:72px" placeholder="Describe the problem in detail…">${br.report ? esc(br.report) : ''}</textarea>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div class="form-row">
          <label class="form-label">Severity <span style="color:#e74c3c">*</span></label>
          <select id="br-severity">${severOpts}</select>
        </div>
        <div class="form-row">
          <label class="form-label">Priority <span style="color:#e74c3c">*</span></label>
          <select id="br-priority">${priorOpts}</select>
        </div>
      </div>
      <div class="form-row">
        <label class="form-label">Module <span style="font-weight:400;color:var(--primary-icon)">(optional)</span></label>
        <select id="br-module" onchange="_onBrModuleChange(this.value)"><option value="">— Select Module —</option>${modOpts}</select>
      </div>
      <div class="form-row">
        <label class="form-label">Submodule <span style="font-weight:400;color:var(--primary-icon)">(optional)</span></label>
        <select id="br-submodule"><option value="">— Select Submodule —</option>${subModOpts}</select>
      </div>
      <div class="form-row">
        <label class="form-label">Assign To</label>
        <select id="br-assign">${assignOpts}</select>
      </div>
    </div>
    <!-- RIGHT COLUMN -->
    <div style="display:flex;flex-direction:column;gap:12px">
      <div class="form-row">
        <label class="form-label">Steps to Reproduce</label>
        <textarea id="br-steps" style="min-height:90px" placeholder="1. Go to…&#10;2. Click on…&#10;3. Observe that…">${br.steps ? esc(br.steps) : ''}</textarea>
      </div>
      <div class="form-row">
        <label class="form-label">Expected Result <span style="color:#e74c3c">*</span></label>
        <textarea id="br-expected" style="min-height:60px" placeholder="What should happen?">${br.expected ? esc(br.expected) : ''}</textarea>
      </div>
      <div class="form-row">
        <label class="form-label">Actual Result <span style="color:#e74c3c">*</span></label>
        <textarea id="br-actual" style="min-height:60px" placeholder="What actually happened?">${br.actual ? esc(br.actual) : ''}</textarea>
      </div>
      <div class="form-row" style="flex:1">
        <label class="form-label" style="display:flex;align-items:center;justify-content:space-between">
          <span>Screenshots &amp; Attachments</span>
          <span style="font-size:10px;color:var(--primary-icon);font-weight:400;text-transform:none;letter-spacing:0">Click · upload · or Ctrl+V</span>
        </label>
        <div class="img-upload-zone" id="issue-iz" style="min-height:140px;aspect-ratio:unset;position:relative;overflow:hidden">
          <i class="ti ti-screenshot" id="issue-iz-icon"></i>
          <span id="issue-iz-txt">Click, upload or paste screenshots</span>
          <input type="file" accept="image/*" multiple style="position:absolute;inset:0;opacity:0;cursor:pointer;width:100%;height:100%;z-index:2" onchange="issueImgChange(this)">
        </div>
      </div>
    </div>
  </div>`;
}

function _onBrModuleChange(modKey) {
  const subSel = $('br-submodule');
  if (!subSel) return;
  const allMods = getMODS();
  const subs = modKey
    ? (allMods.find(m => m.key === modKey)?.subs || [])
    : allMods.flatMap(m => m.subs);
  subSel.innerHTML = '<option value="">— Select Submodule —</option>' +
    subs.map(s => `<option value="${s.key}">${s.label}</option>`).join('');
}

/* ── openModal ────────────────────────────────────────────── */
function openModal(id) {
  const n = id ? noteMap.get(id) : null;
  modalImgData    = n ? n.img : null;
  modalTags       = n && n.tags ? [...n.tags] : [];
  _modalTagColors = n && n.tagColors ? {...n.tagColors} : {};
  selectedTagColor = 0;
  _modalStep      = 1;

  // Reset doc-note image queue
  _modalImgQueue  = [];
  _modalActiveIdx = 0;
  if (modalImgData) {
    _modalImgQueue.push({ dataUrl: modalImgData, name: 'existing' });
  }

  // Reset issue image queue
  _issueImgQueue  = [];
  _issueActiveIdx = 0;
  if (n && n.bugReport && n.bugReport.imgs) {
    n.bugReport.imgs.forEach(img => _issueImgQueue.push({ dataUrl: img, name: 'existing' }));
    if (_issueImgQueue.length) _issueActiveIdx = 0;
  }

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'mov';

  overlay.innerHTML = `<div class="modal-box" style="width:960px;max-width:96vw">
    <div class="modal-head">
      <span class="modal-head-title"><i class="ti ti-notes" style="font-size:16px"></i>${n ? 'Edit Note' : 'Add Note'}</span>
      <button class="modal-close" onclick="closeModal()"><i class="ti ti-x"></i></button>
    </div>
    <div id="modal-step-indicator" style="padding:14px 20px 0">
      ${_stepIndicator(1)}
    </div>
    <div id="modal-step-content">
      ${_renderStep1HTML(n)}
    </div>
    <div class="modal-foot" id="modal-foot">
      <div style="font-size:11px;color:var(--primary-icon)">Step 1 of 2 — Documentation</div>
      <div class="modal-foot-right">
        <button class="btn-cancel" onclick="closeModal()">Cancel</button>
        <button class="btn-save" onclick="_goToStep2()">Next: Issue Report <i class="ti ti-arrow-right" style="font-size:12px;margin-left:4px"></i></button>
      </div>
    </div>
  </div>`;

  overlay.dataset.editId = id || 0;
  $('app').appendChild(overlay);
  buildTagsUI($('tags-wrap'), modalTags, _modalTagColors);
  _renderImgZone();

  const cleanupPaste = _initModalPaste(overlay);
  const cleanupIssuePaste = _initIssuePaste(overlay);
  overlay._cleanupPaste = () => { cleanupPaste(); cleanupIssuePaste(); };

  const tagInp = overlay.querySelector('.tag-real-input');
  tagInp.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const v = tagInp.value.trim().replace(/,/g,'');
      if (v && !modalTags.includes(v)) {
        modalTags.push(v);
        _modalTagColors[v] = selectedTagColor;
        _renderTagChips($('tags-wrap'));
        tagInp.value = '';
      }
    }
  });
}

function _goToStep2() {
  // Validate step 1 required fields
  const title = $('m-title').value.trim();
  const desc  = $('m-desc').value.trim();
  if (!title) { alert('Please fill in the Title field (required).'); $('m-title').focus(); return; }
  if (!desc)  { alert('Please fill in the Description field (required).'); $('m-desc').focus(); return; }

  // Cache step-1 values BEFORE the DOM is replaced
  _s1title = title;
  _s1desc  = desc;
  _s1mod   = $('m-mod')  ? $('m-mod').value         : '';
  _s1link  = $('m-link') ? $('m-link').value.trim()  : '';

  _modalStep = 2;
  const n = null; // we only need bugReport data for edit — handled at render time

  // Grab existing bugReport from edited note if any
  const movEl = $('mov');
  const editId = movEl ? parseInt(movEl.dataset.editId || '0') : 0;
  const editNote = editId ? noteMap.get(editId) : null;

  $('modal-step-indicator').innerHTML = _stepIndicator(2);
  $('modal-step-content').innerHTML   = _renderStep2HTML(editNote);
  $('modal-foot').innerHTML = `
    <div style="font-size:11px;color:var(--primary-icon)">Step 2 of 2 — Issue Report</div>
    <div class="modal-foot-right">
      <button class="btn-cancel" onclick="_goToStep1()"><i class="ti ti-arrow-left" style="font-size:12px;margin-right:4px"></i>Back</button>
      <button class="btn-save" onclick="saveNote(${editId})">${editId ? 'Save Changes' : 'Submit'}</button>
    </div>`;

  // Render issue image zone (pre-populate if editing)
  _renderIssueImgZone();
}

function _goToStep1() {
  _modalStep = 1;
  const movEl = $('mov');
  const editId = movEl ? parseInt(movEl.dataset.editId || '0') : 0;
  const editNote = editId ? noteMap.get(editId) : null;

  $('modal-step-indicator').innerHTML = _stepIndicator(1);
  $('modal-step-content').innerHTML   = _renderStep1HTML(editNote);
  $('modal-foot').innerHTML = `
    <div style="font-size:11px;color:var(--primary-icon)">Step 1 of 2 — Documentation</div>
    <div class="modal-foot-right">
      <button class="btn-cancel" onclick="closeModal()">Cancel</button>
      <button class="btn-save" onclick="_goToStep2()">Next: Issue Report <i class="ti ti-arrow-right" style="font-size:12px;margin-left:4px"></i></button>
    </div>`;

  buildTagsUI($('tags-wrap'), modalTags, _modalTagColors);
  _renderImgZone();

  const tagInp = $('mov').querySelector('.tag-real-input');
  if (tagInp) {
    tagInp.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ',') {
        e.preventDefault();
        const v = tagInp.value.trim().replace(/,/g,'');
        if (v && !modalTags.includes(v)) {
          modalTags.push(v);
          _modalTagColors[v] = selectedTagColor;
          _renderTagChips($('tags-wrap'));
          tagInp.value = '';
        }
      }
    });
  }
}

function selectTagColor(ci, el) {
  selectedTagColor = ci;
  $$('#mov .tag-color-dot').forEach(d => d.classList.remove('sel'));
  el.classList.add('sel');
}

/**
 * Called by the file <input multiple> — enqueues all selected files.
 */
function modalImgChange(inp) {
  if (!inp.files || inp.files.length === 0) return;
  _enqueueFiles(Array.from(inp.files));
  inp.value = ''; // reset so same files can be re-selected
}

function closeModal() {
  const o = $('mov');
  if (o) {
    if (typeof o._cleanupPaste === 'function') o._cleanupPaste();
    o.remove();
  }
  modalImgData    = null;
  _modalImgQueue  = [];
  _modalActiveIdx = 0;
  _issueImgQueue  = [];
  _issueActiveIdx = 0;
  _modalStep      = 1;
  _s1title = ''; _s1desc = ''; _s1mod = ''; _s1link = '';
}

function saveNote(id) {
  // ── Step 1 fields ──
  const s1title = $('m-title');
  const s1desc  = $('m-desc');
  const s1mod   = $('m-mod');
  const s1link  = $('m-link');

  // Read from DOM if step-1 is still visible; otherwise use the cached _s1* values
  const existingNote = id ? noteMap.get(id) : null;
  const title = s1title ? s1title.value.trim() : (_s1title || (existingNote ? existingNote.title : ''));
  const desc  = s1desc  ? s1desc.value.trim()  : (_s1desc  || (existingNote ? existingNote.desc  : ''));
  const mod   = s1mod   ? s1mod.value           : (_s1mod   || (existingNote ? existingNote.module : 'dashboard'));
  const link  = s1link  ? s1link.value.trim()   : (_s1link  || (existingNote ? existingNote.link || '' : ''));

  if (!title) { alert('Please fill in the Title field (required).'); return; }

  // ── Step 2 fields (issue report) ──
  const brUrl      = $('br-url')       ? $('br-url').value.trim()       : '';
  const brTitle    = $('br-title')     ? $('br-title').value.trim()      : '';
  const brReport   = $('br-report')    ? $('br-report').value.trim()     : '';
  const brSeverity = $('br-severity')  ? $('br-severity').value          : 'Medium';
  const brPriority = $('br-priority')  ? $('br-priority').value          : 'Normal';
  const brModule   = $('br-module')    ? $('br-module').value            : '';
  const brSub      = $('br-submodule') ? $('br-submodule').value         : '';
  const brAssign   = $('br-assign')    ? $('br-assign').value            : '';
  const brSteps    = $('br-steps')     ? $('br-steps').value.trim()      : '';
  const brExpected = $('br-expected')  ? $('br-expected').value.trim()   : '';
  const brActual   = $('br-actual')    ? $('br-actual').value.trim()     : '';

  if (_modalStep === 2) {
    if (!brUrl)      { alert('Please fill in the Problem URL / Link (required).'); $('br-url') && $('br-url').focus(); return; }
    if (!brTitle)    { alert('Please fill in the Issue Title (required).'); $('br-title') && $('br-title').focus(); return; }
    if (!brReport)   { alert('Please fill in the Problem Report (required).'); $('br-report') && $('br-report').focus(); return; }
    if (!brExpected) { alert('Please fill in the Expected Result (required).'); $('br-expected') && $('br-expected').focus(); return; }
    if (!brActual)   { alert('Please fill in the Actual Result (required).'); $('br-actual') && $('br-actual').focus(); return; }
  }

  const fn = brReport; // keep backward compat

  // ── Images ──
  const finalImg = _modalImgQueue.length > 0
    ? _modalImgQueue[_modalActiveIdx].dataUrl
    : null;

  const issueImgs = _issueImgQueue.map(i => i.dataUrl);

  const bugReport = _modalStep === 2 ? {
    url: brUrl, title: brTitle, report: brReport,
    severity: brSeverity, priority: brPriority,
    brModule: brModule, brSubmodule: brSub,
    assignTo: brAssign, steps: brSteps,
    expected: brExpected, actual: brActual,
    imgs: issueImgs,
    submittedAt: new Date().toISOString(),
    submittedBy: currentUserName,
  } : (existingNote ? existingNote.bugReport || null : null);

  if (id) {
    const n = noteMap.get(id);
    recordHistory(n, 'Edited');
    const oldSnap = {...n, tags: n.tags ? [...n.tags] : []};
    n.title     = title;
    n.desc      = desc;
    n.fn        = fn;
    n.link      = link;
    n.module    = mod;
    n.img       = finalImg;
    n.tags      = modalTags;
    n.tagColors = {..._modalTagColors};
    n.author    = currentUserName;
    if (bugReport) n.bugReport = bugReport;
    n.hasBug    = !!bugReport && !!bugReport.title;
    updateIndexesForNote(oldSnap, n);
  } else {
    const ts = new Date().toISOString();
    const newNote = {
      id: nextId++,
      module: mod,
      title,
      desc,
      fn,
      link,
      date: new Date().toLocaleDateString('en-US', {month:'short', day:'numeric', year:'numeric'}),
      createdAt: ts,
      img: finalImg,
      tags: modalTags,
      tagColors: {..._modalTagColors},
      author: currentUserName,
      starred: false,
      hasBug: !!bugReport && !!bugReport.title,
      bugReport: bugReport || null,
    };
    notes.unshift(newNote);
    addToIndexes(newNote);
  }
  _invalidateRenderCache();
  closeModal();
  renderNotes();
  refreshSidebarCounts();
  renderTagFilter();
  saveToStorage();
  showToast(id ? 'Note updated!' : 'Note added!');
}

function deleteNote(id) {
  if (!confirm('Delete this note?')) return;
  const n = noteMap.get(id); if (n) removeFromIndexes(n);
  notes = notes.filter(x => x.id !== id);
  delete noteConnections[id];
  delete noteHistory[id];
  for (const s of Object.values(noteConnections)) s.delete(id);
  const inp = _fileInputs.get(id);
  if (inp) { inp.remove(); _fileInputs.delete(id); }
  _invalidateRenderCache();
  renderNotes(); refreshSidebarCounts(); renderTagFilter(); saveToStorage(true);
}

function openHistoryModal(id) {
  const n = noteMap.get(id); const hist = noteHistory[id] || [];
  const overlay = document.createElement('div'); overlay.className = 'modal-overlay'; overlay.id = 'hmov';
  overlay.innerHTML = `<div class="modal-box">
    <div class="modal-head"><span class="modal-head-title"><i class="ti ti-history" style="font-size:16px"></i>Revision History</span><button class="modal-close" onclick="$('hmov').remove()"><i class="ti ti-x"></i></button></div>
    <div class="modal-body" style="display:flex;flex-direction:column;gap:14px">
      <div style="font-size:12px;color:var(--primary-icon);margin-bottom:8px">Note: <strong style="color:var(--primary-heading)">${esc(n.title)}</strong></div>
      ${!hist.length ? `<div style="text-align:center;padding:20px;color:var(--primary-icon);font-size:13px"><i class="ti ti-history" style="font-size:28px;display:block;margin-bottom:8px;opacity:.5"></i>No edit history yet</div>` : ''}
      <div class="history-list">${hist.map((h,i) => `<div class="history-item"><div class="history-dot"></div><div class="history-meta"><div class="history-time">${new Date(h.ts).toLocaleString()} · ${esc(h.author||'Unknown')}</div><div class="history-summary">${esc(h.desc)}: "${esc((h.snapshot.title||'').slice(0,40))}"</div></div><button class="history-restore" onclick="restoreHistory(${id},${i})">Restore</button></div>`).join('')}</div>
    </div>
    <div class="modal-foot"><div></div><div class="modal-foot-right"><button class="btn-cancel" onclick="$('hmov').remove()">Close</button></div></div>
  </div>`;
  $('app').appendChild(overlay);
}
function restoreHistory(noteId, histIdx) {
  if (!confirm('Restore this version?')) return;
  const n = noteMap.get(noteId); const snap = noteHistory[noteId][histIdx].snapshot;
  recordHistory(n, 'Before restore');
  n.title  = snap.title;
  n.desc   = snap.desc;
  n.fn     = snap.fn;
  n.link   = snap.link || '';
  n.module = snap.module || n.module;
  n.tags   = snap.tags || [];
  updateIndexesForNote(n, n);
  $('hmov').remove();
  _invalidateRenderCache();
  renderNotes();
  saveToStorage();
  showToast('Version restored!');
}

function exportData() {
  const connObj = {};
  for (const [k, v] of Object.entries(noteConnections)) connObj[k] = [...v];
  const blob = new Blob([JSON.stringify({version:'admin-v1', exported: new Date().toISOString(), notes, connections: connObj, noteHistory}, null, 2)], {type:'application/json'});
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = 'usermanual2026_admin_' + new Date().toISOString().slice(0,10) + '.json';
  a.click();
  requestAnimationFrame(() => URL.revokeObjectURL(a.href));
  showToast('Notes exported!');
}
function importData(inp) {
  const f = inp.files[0]; if (!f) return;
  const r = new FileReader();
  r.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      if (!data.notes || !Array.isArray(data.notes)) throw new Error('Invalid');
      if (!confirm(`Import ${data.notes.length} note(s)? This will REPLACE current notes.`)) { inp.value = ''; return; }
      notes = data.notes;
      nextId = Math.max(...notes.map(n => n.id || 0), 0) + 1;
      noteConnections = {};
      if (data.connections) {
        for (const [k, v] of Object.entries(data.connections))
          noteConnections[parseInt(k)] = new Set(v.map(Number));
      }
      noteHistory = data.noteHistory || {};
      rebuildIndexes();
      _invalidateRenderCache();
      renderNotes(); refreshSidebarCounts(); renderTagFilter(); saveToStorage(true);
      showToast(`${data.notes.length} notes imported!`);
    } catch(err) { alert('Could not read file.'); }
    inp.value = '';
  };
  r.readAsText(f);
}

/* ── Flowchart ───────────────────────────────────────────── */
function _safeJson(obj) {
  return JSON.stringify(obj).replace(/<\/script>/gi, '<\\/script>');
}

function generateFlowchart() {
  if (!notes.length) { showToast('No notes to generate flowchart from.'); return; }
  const CONN_COLORS = ['#4f7ef8','#e84d7c','#3ab86a','#f07830','#8b5cf6','#2cc4b0','#f0b86a','#e84d4d','#4db8e8','#b06af0'];
  const groups = {};
  notes.forEach(n => { const badge = (TM[n.module]||{badge:'—'}).badge; if (!groups[badge]) groups[badge] = []; groups[badge].push(n); });
  const fnNodes = {}; let colX = 60;
  Object.keys(groups).forEach(badge => {
    let rowY = 60;
    groups[badge].forEach(n => { fnNodes[n.id] = {id: String(n.id), x: colX, y: rowY, title: n.title, desc: n.desc}; rowY += 200; });
    colX += 270;
  });
  const fnConns = []; let cIdx = 1;
  for (const [fromId, toSet] of Object.entries(noteConnections)) {
    for (const toId of toSet) {
      if (fnNodes[fromId] && fnNodes[toId]) fnConns.push({id: 'c' + cIdx++, from: String(fromId), to: String(toId), color: CONN_COLORS[(cIdx-2) % CONN_COLORS.length]});
    }
  }
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>FlowNotes</title><style>*{box-sizing:border-box;margin:0;padding:0}body{background:#001f0f;color:#e2e4f0;font-family:system-ui,sans-serif;overflow:hidden;height:100vh}#bar{padding:10px 16px;background:#002b15;border-bottom:1px solid #1a5a30;display:flex;align-items:center;gap:10px;font-size:13px}#bar strong{color:#4fc87a}#cvswrap{position:relative;width:100%;height:calc(100vh - 44px);overflow:hidden}#cvs{position:absolute;top:0;left:0;transform-origin:0 0}#svgl{position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none}#svgl svg{position:absolute;top:0;left:0;overflow:visible}.node{position:absolute;background:#002b15;border:1.5px solid #1a5a30;border-radius:10px;width:200px;cursor:grab;padding:12px;transition:box-shadow .15s}.node:hover{box-shadow:0 4px 20px rgba(0,0,0,0.5)}.node h4{font-size:12px;font-weight:600;color:#e2e4f0;margin-bottom:4px}.node p{font-size:10px;color:#6b9b7a;line-height:1.5}.node-top{height:3px;border-radius:2px;margin-bottom:8px;background:#1a7a3a}</style></head>
<body><div id="bar"><strong>FlowNotes</strong> — Admin Portal Flowchart<span style="margin-left:10px;font-size:11px;color:#4a7a5a">Drag · Scroll to zoom · Double-click line to delete</span></div>
<div id="cvswrap"><div id="cvs"></div><div id="svgl"><svg id="svg" xmlns="http://www.w3.org/2000/svg"></svg></div></div>
<script>
const nodes=${_safeJson(fnNodes)};const conns=${_safeJson(fnConns)};
let px=40,py=40,zoom=0.9;let panning=false,panStart={x:0,y:0};let dragging=null,dragOff={x:0,y:0};
const wrap=document.getElementById('cvswrap');const cvs=document.getElementById('cvs');const svg=document.getElementById('svg');
function applyT(){cvs.style.transform='translate('+px+'px,'+py+'px) scale('+zoom+')';renderSVG();}
function nodeCenter(id){const n=nodes[id];if(!n)return null;return{x:(n.x+100)*zoom+px,y:(n.y+60)*zoom+py};}
function renderAll(){Object.values(nodes).forEach(n=>{let el=document.getElementById('n'+n.id);if(!el){el=document.createElement('div');el.id='n'+n.id;el.className='node';cvs.appendChild(el);}el.style.left=n.x+'px';el.style.top=n.y+'px';el.innerHTML='<div class="node-top"></div><h4>'+n.title+'</h4><p>'+n.desc+'</p>';});}
function renderSVG(){const W=wrap.clientWidth,H=wrap.clientHeight;svg.setAttribute('width',W);svg.setAttribute('height',H);svg.setAttribute('viewBox','0 0 '+W+' '+H);svg.innerHTML='';const defs=document.createElementNS('http://www.w3.org/2000/svg','defs');conns.forEach(c=>{const m=document.createElementNS('http://www.w3.org/2000/svg','marker');m.setAttribute('id','m'+c.id);m.setAttribute('viewBox','0 0 10 10');m.setAttribute('refX','9');m.setAttribute('refY','5');m.setAttribute('markerWidth','6');m.setAttribute('markerHeight','6');m.setAttribute('orient','auto-start-reverse');const p=document.createElementNS('http://www.w3.org/2000/svg','path');p.setAttribute('d','M1,1 L9,5 L1,9 Z');p.setAttribute('fill',c.color);m.appendChild(p);defs.appendChild(m);});svg.appendChild(defs);conns.forEach(c=>{const a=nodeCenter(c.from),b=nodeCenter(c.to);if(!a||!b)return;const dx=b.x-a.x,dy=b.y-a.y;const cx1=a.x+dx*.5,cy1=a.y+dy*.5;const d='M '+a.x+' '+a.y+' C '+cx1+' '+a.y+', '+cx1+' '+b.y+', '+b.x+' '+b.y;const hit=document.createElementNS('http://www.w3.org/2000/svg','path');hit.setAttribute('d',d);hit.setAttribute('fill','none');hit.setAttribute('stroke','transparent');hit.setAttribute('stroke-width','16');hit.style.pointerEvents='stroke';hit.style.cursor='pointer';hit.addEventListener('dblclick',()=>{const i=conns.findIndex(x=>x.id===c.id);if(i>-1){conns.splice(i,1);renderSVG();}});svg.appendChild(hit);const line=document.createElementNS('http://www.w3.org/2000/svg','path');line.setAttribute('d',d);line.setAttribute('fill','none');line.setAttribute('stroke',c.color);line.setAttribute('stroke-width','2');line.setAttribute('stroke-linecap','round');line.setAttribute('marker-end','url(#m'+c.id+')');line.style.pointerEvents='none';svg.appendChild(line);});}
wrap.addEventListener('mousedown',e=>{const nodeEl=e.target.closest('.node');if(nodeEl){const id=nodeEl.id.slice(1);dragging=id;const n=nodes[id];dragOff={x:(e.clientX-px)/zoom-n.x,y:(e.clientY-py)/zoom-n.y};nodeEl.style.cursor='grabbing';return;}panning=true;panStart={x:e.clientX-px,y:e.clientY-py};wrap.style.cursor='grabbing';});
window.addEventListener('mousemove',e=>{if(dragging){const n=nodes[dragging];n.x=(e.clientX-px)/zoom-dragOff.x;n.y=(e.clientY-py)/zoom-dragOff.y;const el=document.getElementById('n'+dragging);if(el){el.style.left=n.x+'px';el.style.top=n.y+'px';}renderSVG();}else if(panning){px=e.clientX-panStart.x;py=e.clientY-panStart.y;applyT();}});
window.addEventListener('mouseup',()=>{if(dragging){document.getElementById('n'+dragging).style.cursor='grab';dragging=null;}if(panning){panning=false;wrap.style.cursor='default';}});
wrap.addEventListener('wheel',e=>{e.preventDefault();const nz=Math.max(.15,Math.min(3,zoom-e.deltaY*.001));const r=wrap.getBoundingClientRect();const mx=e.clientX-r.left,my=e.clientY-r.top;px=mx-(mx-px)*(nz/zoom);py=my-(my-py)*(nz/zoom);zoom=nz;applyT();},{passive:false});
renderAll();applyT();
<\/script></body></html>`;
  const blob = new Blob([html], {type:'text/html'});
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
  setTimeout(() => URL.revokeObjectURL(url), 30000);
  showToast('Flowchart opened in new tab!');
}

let _toastTimer = null;
function showToast(msg) {
  DOM.toastMsg.textContent = msg;
  DOM.toast.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => DOM.toast.classList.remove('show'), 2800);
}

document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); DOM.sinput.focus(); }
  if (e.key === 'Escape') {
    const mov = $('mov'), hmov = $('hmov');
    if (mov) { closeModal(); return; }
    if (hmov) { hmov.remove(); return; }
    if ($('conn-modal-overlay').classList.contains('open')) closeConnModal();
  }
});

/* ── Init ── */
cacheDom();
loadFromStorage();
rebuildIndexes();
buildSidebar();
refreshSidebarCounts();
initGridDelegation();
DOM.userNameDisp.textContent = '👤 ' + currentUserName;
if (isDark) { DOM.darkIcon.className = 'ti ti-sun'; DOM.darkToggleBtn.title = 'Switch to light mode'; }
renderNotes();
renderTagFilter();
_updateStoragePill();