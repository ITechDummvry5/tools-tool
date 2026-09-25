// <!-- ══════════════ MODULE MANAGER JS ══════════════ -->
/* ─── Storage key ─── */
const MM_KEY = 'usermanual_modules_v1';

/* ─── Default icons available in picker ─── */
const MM_ICONS = [
  'ti-folder','ti-database','ti-users','ti-settings','ti-chart-bar',
  'ti-book','ti-calendar','ti-clipboard','ti-school','ti-layout-grid',
  'ti-code','ti-lock','ti-bell','ti-file','ti-message-circle',
  'ti-shield','ti-tools','ti-star','ti-flag','ti-stack',        // ← ti-tool→ti-tools, ti-file-text→ti-file, ti-message→ti-message-circle, ti-layers→ti-stack
  'ti-credit-card','ti-briefcase','ti-home','ti-map','ti-cpu',
  'ti-package','ti-report','ti-list-check','ti-user-check','ti-sitemap','ti-wallet','ti-device-laptop','ti-books','ti-apps','ti-building-bank','ti-analyze'
];

const SUB_ICONS = [
  'ti-file','ti-list','ti-pencil','ti-eye','ti-circle-plus',    // ← ti-edit→ti-pencil, ti-plus-circle→ti-circle-plus
  'ti-search','ti-filter','ti-download','ti-upload','ti-trash',
  'ti-check','ti-alert-circle','ti-info-circle','ti-link','ti-history',
  'ti-chart-pie','ti-table','ti-settings','ti-user','ti-users',
  'ti-mail','ti-bell','ti-key','ti-lock','ti-clipboard-list','ti-cash','ti-coins','ti-message-dots','ti-file-type-xls','ti-user-shield','ti-server', 'ti-wand','ti-lock-dollar'
];

/* ─── State ─── */
let mmModules = [];       // [{id, key, label, icon, subs:[{id,key,label,icon}]}]
let mmActiveIdx = null;   // index in mmModules
let mmEditingSubId = null;// sub id being edited
let mmPickedIcon = '';
let mmPickedSubIcon = '';

/* ─── Persist ─── */
function mmLoad() {
  try { mmModules = JSON.parse(localStorage.getItem(MM_KEY)) || []; } catch { mmModules = []; }
}
function mmSave() {
  localStorage.setItem(MM_KEY, JSON.stringify(mmModules));
}

/* ─── Unique id ─── */
function mmUid() { return '_' + Math.random().toString(36).slice(2,9); }

/* ─── Render sidebar from data ─── */
function mmRenderSidebar() {
  const container = document.getElementById('snav-modules');
  if (!container) return;
  container.innerHTML = '';
  mmModules.forEach(mod => {
    const group = document.createElement('div');
    group.className = 'mod-group';
    // Header button
    const hdr = document.createElement('button');
    hdr.className = 'mod-header';
    hdr.innerHTML = `<i class="ti ${mod.icon||'ti-folder'} mi"></i>${mod.label}<i class="ti ti-chevron-down ch"></i>`;
    hdr.onclick = function() {
      this.classList.toggle('open');
      const items = this.nextElementSibling;
      items.classList.toggle('open');
    };
    group.appendChild(hdr);
    // Items container
    const itemsDiv = document.createElement('div');
    itemsDiv.className = 'mod-items';
    (mod.subs || []).forEach(sub => {
      const btn = document.createElement('button');
      btn.className = 'sub-item';
      btn.setAttribute('data-subkey', sub.key);
      btn.innerHTML = `<i class="ti ${sub.icon||'ti-file'}"></i>${sub.label}`;
      btn.onclick = function() {
        document.querySelectorAll('.sub-item').forEach(b=>b.classList.remove('active'));
        this.classList.add('active');
        if(typeof filterSub === 'function') filterSub(sub.key, sub.label, mod.label, this);
      };
      itemsDiv.appendChild(btn);
    });
    group.appendChild(itemsDiv);
    container.appendChild(group);
  });
}

/* ─── Open / Close ─── */
function openModuleManager() {
  mmLoad();
  mmActiveIdx = null;
  mmRenderMMLeft();
  mmShowEmpty();
  document.getElementById('mm-overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeModuleManager() {
  document.getElementById('mm-overlay').classList.remove('open');
  document.body.style.overflow = '';
}
function mmOverlayClick(e) {
  if (e.target === document.getElementById('mm-overlay')) closeModuleManager();
}

/* ─── Left panel ─── */
function mmRenderMMLeft() {
  const list = document.getElementById('mm-module-list');
  list.innerHTML = '';
  mmModules.forEach((mod, idx) => {
    const btn = document.createElement('button');
    btn.className = 'mm-mod-item' + (idx === mmActiveIdx ? ' active' : '');
    btn.innerHTML = `<i class="ti ${mod.icon||'ti-folder'} mi"></i><span style="flex:1;text-align:left;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${mod.label}</span><i class="ti ti-grip-vertical mm-mod-drag"></i>`;
    btn.onclick = () => mmSelectModule(idx);
    list.appendChild(btn);
  });
}

/* ─── Select a module to edit ─── */
function mmSelectModule(idx) {
  mmActiveIdx = idx;
  mmRenderMMLeft();
  const mod = mmModules[idx];
  // Populate fields
  document.getElementById('mm-mod-name').value = mod.label || '';
  document.getElementById('mm-mod-key').value = mod.key || '';
  mmPickedIcon = mod.icon || MM_ICONS[0];
  mmRenderIconPicker('mm-icon-picker', MM_ICONS, mmPickedIcon, (ic)=>{ mmPickedIcon = ic; });
  // Render subs
  mmRenderSubList();
  mmCancelSub();
  // Show editor
  document.getElementById('mm-empty-state').style.display = 'none';
  const editor = document.getElementById('mm-editor');
  editor.style.display = 'flex';
  document.getElementById('mm-right-foot').style.display = 'flex';
}

/* ─── Empty state ─── */
function mmShowEmpty() {
  document.getElementById('mm-empty-state').style.display = 'flex';
  document.getElementById('mm-editor').style.display = 'none';
  document.getElementById('mm-right-foot').style.display = 'none';
}

/* ─── Icon picker renderer ─── */
function mmRenderIconPicker(containerId, icons, selected, onSelect) {
  const wrap = document.getElementById(containerId);
  wrap.innerHTML = '';
  icons.forEach(ic => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'mm-icon-opt' + (ic === selected ? ' sel' : '');
    btn.title = ic.replace('ti-','');
    btn.innerHTML = `<i class="ti ${ic}"></i>`;
    btn.onclick = () => {
      wrap.querySelectorAll('.mm-icon-opt').forEach(b=>b.classList.remove('sel'));
      btn.classList.add('sel');
      onSelect(ic);
    };
    wrap.appendChild(btn);
  });
}

/* ─── Sub list renderer ─── */
function mmRenderSubList() {
  const mod = mmModules[mmActiveIdx];
  const list = document.getElementById('mm-sub-list');
  list.innerHTML = '';
  (mod.subs || []).forEach(sub => {
    const row = document.createElement('div');
    row.className = 'mm-sub-row';
    row.innerHTML = `
      <div class="mm-sub-row-icon"><i class="ti ${sub.icon||'ti-file'}"></i></div>
      <span class="mm-sub-row-label">${sub.label}</span>
      <span class="mm-sub-row-key">${sub.key}</span>
      <button class="mm-sub-edit-btn" title="Edit" onclick="mmEditSub('${sub.id}')"><i class="ti ti-pencil"></i></button>
      <button class="mm-sub-del-btn" title="Delete" onclick="mmDeleteSub('${sub.id}')"><i class="ti ti-trash"></i></button>
    `;
    list.appendChild(row);
  });
}

/* ─── Add Module ─── */
function mmAddModule() {
  const newMod = {
    id: mmUid(),
    key: 'module-' + (mmModules.length + 1),
    label: 'New Module',
    icon: MM_ICONS[0],
    subs: []
  };
  mmModules.push(newMod);
  mmActiveIdx = mmModules.length - 1;
  mmRenderMMLeft();
  mmSelectModule(mmActiveIdx);
  // Focus name input
  setTimeout(() => {
    const inp = document.getElementById('mm-mod-name');
    inp.focus(); inp.select();
  }, 50);
}

/* ─── Save module (name/key/icon update) ─── */
function mmSaveModule() {
  if (mmActiveIdx === null) return;
  const nameVal = document.getElementById('mm-mod-name').value.trim();
  const keyVal = document.getElementById('mm-mod-key').value.trim().replace(/\s+/g,'_');
  if (!nameVal) { alert('Module name is required.'); return; }
  if (!keyVal)  { alert('Module key is required.'); return; }
  mmModules[mmActiveIdx].label = nameVal;
  mmModules[mmActiveIdx].key   = keyVal;
  mmModules[mmActiveIdx].icon  = mmPickedIcon;
  mmSave();
  mmRenderMMLeft();
  mmRenderSidebar();
  mmShowToast('Module saved!');
}

/* ─── Delete module ─── */
function mmDeleteModule() {
  if (mmActiveIdx === null) return;
  const mod = mmModules[mmActiveIdx];
  if (!confirm(`Delete module "${mod.label}" and all its submodules?`)) return;
  mmModules.splice(mmActiveIdx, 1);
  mmActiveIdx = null;
  mmSave();
  mmRenderMMLeft();
  mmShowEmpty();
  mmRenderSidebar();
  mmShowToast('Module deleted.');
}

/* ─── Show sub add form ─── */
function mmShowSubForm(subId) {
  mmEditingSubId = subId || null;
  const form = document.getElementById('mm-sub-form');
  const addBtn = document.getElementById('mm-add-sub-btn');
  form.classList.add('open');
  addBtn.style.display = 'none';
  if (subId) {
    const sub = mmModules[mmActiveIdx].subs.find(s=>s.id===subId);
    document.getElementById('mm-sub-label').value = sub.label;
    document.getElementById('mm-sub-key').value = sub.key;
    mmPickedSubIcon = sub.icon || SUB_ICONS[0];
  } else {
    document.getElementById('mm-sub-label').value = '';
    document.getElementById('mm-sub-key').value = '';
    mmPickedSubIcon = SUB_ICONS[0];
  }
  mmRenderIconPicker('mm-sub-icon-picker', SUB_ICONS, mmPickedSubIcon, (ic)=>{ mmPickedSubIcon = ic; });
  setTimeout(()=>document.getElementById('mm-sub-label').focus(), 50);
}
function mmCancelSub() {
  document.getElementById('mm-sub-form').classList.remove('open');
  document.getElementById('mm-add-sub-btn').style.display = 'flex';
  mmEditingSubId = null;
}
function mmEditSub(subId) { mmShowSubForm(subId); }
function mmDeleteSub(subId) {
  const mod = mmModules[mmActiveIdx];
  const sub = mod.subs.find(s=>s.id===subId);
  if (!confirm(`Delete submodule "${sub.label}"?`)) return;
  mod.subs = mod.subs.filter(s=>s.id!==subId);
  mmSave();
  mmRenderSubList();
  mmRenderSidebar();
}
function mmSaveSub() {
  const label = document.getElementById('mm-sub-label').value.trim();
  const key   = document.getElementById('mm-sub-key').value.trim().replace(/\s+/g,'-');
  if (!label) { alert('Submodule label is required.'); return; }
  if (!key)   { alert('Submodule key is required.'); return; }
  const mod = mmModules[mmActiveIdx];
  if (mmEditingSubId) {
    const sub = mod.subs.find(s=>s.id===mmEditingSubId);
    sub.label = label; sub.key = key; sub.icon = mmPickedSubIcon;
  } else {
    mod.subs.push({ id: mmUid(), key, label, icon: mmPickedSubIcon });
  }
  mmSave();
  mmRenderSubList();
  mmRenderSidebar();
  mmCancelSub();
  mmShowToast(mmEditingSubId ? 'Submodule updated.' : 'Submodule added.');
}

/* ─── Toast helper ─── */
function mmShowToast(msg) {
  const toast = document.getElementById('toast');
  const toastMsg = document.getElementById('toastMsg');
  if (toast && toastMsg) {
    toastMsg.textContent = msg;
    toast.classList.add('show');
    setTimeout(()=>toast.classList.remove('show'), 2200);
  }
}

/* ─── Auto-fill key from name ─── */
document.addEventListener('DOMContentLoaded', () => {
  const nameInp = document.getElementById('mm-mod-name');
  const keyInp  = document.getElementById('mm-mod-key');
  if (nameInp && keyInp) {
    nameInp.addEventListener('input', () => {
      if (!keyInp.dataset.manual) {
        keyInp.value = nameInp.value.toLowerCase().trim().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'');
      }
    });
    keyInp.addEventListener('input', () => { keyInp.dataset.manual = '1'; });
  }
  const subLabel = document.getElementById('mm-sub-label');
  const subKey   = document.getElementById('mm-sub-key');
  if (subLabel && subKey) {
    subLabel.addEventListener('input', () => {
      if (!subKey.dataset.manual) {
        subKey.value = subLabel.value.toLowerCase().trim().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'');
      }
    });
    subKey.addEventListener('input', () => { subKey.dataset.manual = '1'; });
  }
  // Keyboard shortcut: Escape to close
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && document.getElementById('mm-overlay').classList.contains('open')) {
      closeModuleManager();
    }
  });
  // Init sidebar from saved data
  mmLoad();
  mmRenderSidebar();
});

/* ── Mobile sidebar helpers ── */
function openSidebar() {
  const sb = document.getElementById('sidebar');
  const ov = document.getElementById('sidebar-overlay');
  sb.classList.add('open');
  ov.style.display = 'block';
  requestAnimationFrame(() => ov.classList.add('active'));
  document.body.style.overflow = 'hidden';
}
function closeSidebar() {
  const sb = document.getElementById('sidebar');
  const ov = document.getElementById('sidebar-overlay');
  sb.classList.remove('open');
  ov.classList.remove('active');
  document.body.style.overflow = '';
  setTimeout(() => { if (!ov.classList.contains('active')) ov.style.display = 'none'; }, 300);
}
/* Auto-close sidebar on mobile after nav item selection */
function closeSidebarOnMobile() {
  if (window.innerWidth <= 768) closeSidebar();
}

/* Patch sub-item clicks to close sidebar on mobile */
const _origFilterSub = window.filterSub;
window.filterSub = function(subKey, label, badge, el) {
  _origFilterSub(subKey, label, badge, el);
  closeSidebarOnMobile();
};

/* Close sidebar on Escape key */
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    const sb = document.getElementById('sidebar');
    if (sb.classList.contains('open')) { closeSidebar(); return; }
  }
});

/* Close sidebar if viewport resizes to desktop */
window.addEventListener('resize', function() {
  if (window.innerWidth > 768) closeSidebar();
});