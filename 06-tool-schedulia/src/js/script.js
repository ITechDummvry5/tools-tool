/* index.js - Unified Application logic for Student Scheduler */

// ============================================================================
// 1. DATABASE SERVICE (IndexedDB)
// ============================================================================

const DB_NAME = 'student_scheduler_db';
const DB_VERSION = 2;
let dbInstance = null;

function openDB() {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error('Database error:', event.target.error);
      reject(event.target.error);
    };

    request.onsuccess = (event) => {
      dbInstance = event.target.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Semester Store
      if (!db.objectStoreNames.contains('semesters')) {
        const semesterStore = db.createObjectStore('semesters', { keyPath: 'id' });
        semesterStore.createIndex('active', 'active', { unique: false });
      }

      // Subject Store
      if (!db.objectStoreNames.contains('subjects')) {
        const subjectStore = db.createObjectStore('subjects', { keyPath: 'id' });
        subjectStore.createIndex('semesterId', 'semesterId', { unique: false });
        subjectStore.createIndex('day', 'day', { unique: false });
      }

      // Master Data Stores: Rooms, Instructors, Sections, Subject Catalog
      if (!db.objectStoreNames.contains('rooms')) {
        db.createObjectStore('rooms', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('instructors')) {
        db.createObjectStore('instructors', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('sections')) {
        db.createObjectStore('sections', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('subjectCatalog')) {
        db.createObjectStore('subjectCatalog', { keyPath: 'id' });
      }
    };
  });
}

async function getSemesters() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('semesters', 'readonly');
    const store = transaction.objectStore('semesters');
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveSemester(semester) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('semesters', 'readwrite');
    const store = transaction.objectStore('semesters');
    const request = store.put(semester);

    request.onsuccess = () => resolve(semester);
    request.onerror = () => reject(request.error);
  });
}

async function deleteSemester(id) {
  const db = await openDB();
  // First, delete all subjects in that semester
  const subjects = await getSubjects(id);
  const deleteSubjectPromises = subjects.map(s => deleteSubject(s.id));
  await Promise.all(deleteSubjectPromises);

  return new Promise((resolve, reject) => {
    const transaction = db.transaction('semesters', 'readwrite');
    const store = transaction.objectStore('semesters');
    const request = store.delete(id);

    request.onsuccess = () => resolve(id);
    request.onerror = () => reject(request.error);
  });
}

async function getSubjects(semesterId = null) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('subjects', 'readonly');
    const store = transaction.objectStore('subjects');
    let request;

    if (semesterId) {
      const index = store.index('semesterId');
      request = index.getAll(IDBKeyRange.only(semesterId));
    } else {
      request = store.getAll();
    }

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveSubject(subject) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('subjects', 'readwrite');
    const store = transaction.objectStore('subjects');
    const request = store.put(subject);

    request.onsuccess = () => resolve(subject);
    request.onerror = () => reject(request.error);
  });
}

async function deleteSubject(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('subjects', 'readwrite');
    const store = transaction.objectStore('subjects');
    const request = store.delete(id);

    request.onsuccess = () => resolve(id);
    request.onerror = () => reject(request.error);
  });
}

async function clearAllData() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['semesters', 'subjects', 'rooms', 'instructors', 'sections', 'subjectCatalog'], 'readwrite');
    transaction.objectStore('semesters').clear();
    transaction.objectStore('subjects').clear();
    transaction.objectStore('rooms').clear();
    transaction.objectStore('instructors').clear();
    transaction.objectStore('sections').clear();
    transaction.objectStore('subjectCatalog').clear();

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

// ----------------------------------------------------------------------
// Generic Master Data CRUD (used by Room / Instructor / Section / Subject
// Management pages so the Add Subject/Schedule form can pull dropdowns)
// ----------------------------------------------------------------------

async function getMasterList(storeName) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveMasterItem(storeName, item) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(item);

    request.onsuccess = () => resolve(item);
    request.onerror = () => reject(request.error);
  });
}

async function deleteMasterItem(storeName, id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(id);

    request.onsuccess = () => resolve(id);
    request.onerror = () => reject(request.error);
  });
}

async function clearMasterStore(storeName) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    transaction.objectStore(storeName).clear();

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

// ============================================================================
// 2. STATE HISTORY (Undo/Redo)
// ============================================================================

class HistoryManager {
  constructor(maxSize = 50) {
    this.maxSize = maxSize;
    this.clear();
  }

  clear() {
    this.stack = [];
    this.currentIndex = -1;
  }

  pushState(subjects) {
    const state = JSON.parse(JSON.stringify(subjects));
    if (this.currentIndex < this.stack.length - 1) {
      this.stack = this.stack.slice(0, this.currentIndex + 1);
    }
    this.stack.push(state);
    if (this.stack.length > this.maxSize) {
      this.stack.shift();
    } else {
      this.currentIndex++;
    }
  }

  canUndo() {
    return this.currentIndex > 0;
  }

  canRedo() {
    return this.currentIndex < this.stack.length - 1;
  }

  undo() {
    if (!this.canUndo()) return null;
    this.currentIndex--;
    return JSON.parse(JSON.stringify(this.stack[this.currentIndex]));
  }

  redo() {
    if (!this.canRedo()) return null;
    this.currentIndex++;
    return JSON.parse(JSON.stringify(this.stack[this.currentIndex]));
  }
}

const history = new HistoryManager();

// ============================================================================
// 3. SCHEDULER ENGINE & ALGORITHMS
// ============================================================================

function timeToMins(timeStr) {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

function minsToTime(mins) {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function format12Hour(mins) {
  const h24 = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  const period = h24 >= 12 ? 'PM' : 'AM';
  let h12 = h24 % 12;
  if (h12 === 0) h12 = 12;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
}

function getTopPercentage(startTimeStr, gridStartMins, gridEndMins) {
  const startMins = timeToMins(startTimeStr);
  const totalDuration = gridEndMins - gridStartMins;
  if (totalDuration <= 0) return 0;
  return Math.max(0, Math.min(100, ((startMins - gridStartMins) / totalDuration) * 100));
}

function getHeightPercentage(startTimeStr, endTimeStr, gridStartMins, gridEndMins) {
  const startMins = timeToMins(startTimeStr);
  const endMins = timeToMins(endTimeStr);
  const totalDuration = gridEndMins - gridStartMins;
  if (totalDuration <= 0) return 0;
  const duration = endMins - startMins;
  return Math.max(1, Math.min(100, (duration / totalDuration) * 100));
}

function checkConflicts(subject, subjectsList) {
  const sStart = timeToMins(subject.startTime);
  const sEnd = timeToMins(subject.endTime);

  return subjectsList.filter(s => {
    if (s.id === subject.id) return false;
    if (s.day !== subject.day || s.semesterId !== subject.semesterId) return false;

    const otherStart = timeToMins(s.startTime);
    const otherEnd = timeToMins(s.endTime);

    return sStart < otherEnd && sEnd > otherStart;
  });
}

function calculateLayoutProperties(daySubjects) {
  const sorted = [...daySubjects].sort((a, b) => {
    const aStart = timeToMins(a.startTime);
    const bStart = timeToMins(b.startTime);
    if (aStart !== bStart) return aStart - bStart;
    return timeToMins(a.endTime) - timeToMins(b.endTime);
  });

  const columnEnds = [];
  const eventPositions = sorted.map(subject => {
    const start = timeToMins(subject.startTime);
    const end = timeToMins(subject.endTime);

    let assignedColumn = -1;
    for (let c = 0; c < columnEnds.length; c++) {
      if (columnEnds[c] <= start) {
        columnEnds[c] = end;
        assignedColumn = c;
        break;
      }
    }

    if (assignedColumn === -1) {
      columnEnds.push(end);
      assignedColumn = columnEnds.length - 1;
    }

    return {
      subject,
      column: assignedColumn,
      width: 100,
      left: 0,
      totalColumns: 1
    };
  });

  const clusters = [];
  for (const item of eventPositions) {
    const itemStart = timeToMins(item.subject.startTime);
    const itemEnd = timeToMins(item.subject.endTime);

    let foundCluster = null;
    for (const cluster of clusters) {
      const overlaps = cluster.some(cItem => {
        const cStart = timeToMins(cItem.subject.startTime);
        const cEnd = timeToMins(cItem.subject.endTime);
        return itemStart < cEnd && itemEnd > cStart;
      });

      if (overlaps) {
        foundCluster = cluster;
        break;
      }
    }

    if (foundCluster) {
      foundCluster.push(item);
    } else {
      clusters.push([item]);
    }
  }

  for (const cluster of clusters) {
    const maxColInCluster = Math.max(...cluster.map(i => i.column)) + 1;
    for (const item of cluster) {
      item.totalColumns = maxColInCluster;
      item.width = 100 / maxColInCluster;
      item.left = item.column * item.width;
    }
  }

  return eventPositions;
}

function suggestColors(nameStr) {
  if (!nameStr) return { bg: '#e1f5fe', text: '#01579b', border: '#81d4fa' };

  let hash = 0;
  for (let i = 0; i < nameStr.length; i++) {
    hash = nameStr.charCodeAt(i) + ((hash << 5) - hash);
  }

  const palettes = [
    { bg: '#e8f5e9', text: '#1b5e20', border: '#a5d6a7' }, // Green
    { bg: '#e3f2fd', text: '#0d47a1', border: '#90caf9' }, // Blue
    { bg: '#f3e5f5', text: '#4a148c', border: '#ce93d8' }, // Purple
    { bg: '#fff3e0', text: '#e65100', border: '#ffcc80' }, // Orange
    { bg: '#fce4ec', text: '#880e4f', border: '#f48fb1' }, // Pink
    { bg: '#efebe9', text: '#4e342e', border: '#bcaaa4' }, // Brown
    { bg: '#e0f2f1', text: '#004d40', border: '#80cbc4' }, // Teal
    { bg: '#fffde7', text: '#f57f17', border: '#fff59d' }, // Yellow
    { bg: '#f9fbe7', text: '#827717', border: '#e6ee9c' }, // Lime
    { bg: '#e0f7fa', text: '#006064', border: '#80deea' }  // Cyan
  ];

  const index = Math.abs(hash) % palettes.length;
  return palettes[index];
}

// ============================================================================
// 4. EXPORT ENGINE
// ============================================================================

async function exportJSON(activeSemesterId) {
  const semesters = await getSemesters();
  const subjects = await getSubjects();
  const rooms = await getMasterList('rooms');
  const instructors = await getMasterList('instructors');
  const sections = await getMasterList('sections');
  const subjectCatalog = await getMasterList('subjectCatalog');
  
  const settingsKeys = [
    'theme', 'layoutStyle', 'sidebarStyle', 'accentColor', 
    'gridStart', 'gridEnd', 'gridInterval', 'visibleDays', 'fontSize'
  ];
  const settings = {};
  settingsKeys.forEach(k => {
    const val = localStorage.getItem(k);
    if (val !== null) settings[k] = val;
  });

  const exportData = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    semesters,
    subjects,
    rooms,
    instructors,
    sections,
    subjectCatalog,
    settings,
    activeSemesterId
  };

  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `student_schedule_backup_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

async function importJSON(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (data.version !== '1.0' || !data.semesters || !data.subjects) {
          throw new Error('Invalid backup file format.');
        }

        await clearAllData();

        for (const sem of data.semesters) {
          await saveSemester(sem);
        }

        for (const sub of data.subjects) {
          await saveSubject(sub);
        }

        if (Array.isArray(data.rooms)) {
          for (const r of data.rooms) await saveMasterItem('rooms', r);
        }
        if (Array.isArray(data.instructors)) {
          for (const i of data.instructors) await saveMasterItem('instructors', i);
        }
        if (Array.isArray(data.sections)) {
          for (const s of data.sections) await saveMasterItem('sections', s);
        }
        if (Array.isArray(data.subjectCatalog)) {
          for (const sc of data.subjectCatalog) await saveMasterItem('subjectCatalog', sc);
        }

        if (data.settings) {
          Object.keys(data.settings).forEach(key => {
            localStorage.setItem(key, data.settings[key]);
          });
        }
        
        if (data.activeSemesterId) {
          localStorage.setItem('activeSemesterId', data.activeSemesterId);
        }

        resolve(data);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.readAsText(file);
  });
}

async function exportExcel(semesterName, semesterId) {
  if (typeof XLSX === 'undefined') {
    throw new Error('SheetJS library is not loaded.');
  }

  const subjects = await getSubjects(semesterId);
  const formattedData = subjects.map(s => ({
    'Subject Name': s.name,
    'Instructor': s.instructor || '',
    'Room': s.room || '',
    'Section': s.section || '',
    'Day': s.day,
    'Start Time': s.startTime,
    'End Time': s.endTime,
    'Notes': s.notes || ''
  }));

  const ws = XLSX.utils.json_to_sheet(formattedData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Schedule List');

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const gridRows = [];
  const subjectsByDay = {};
  days.forEach(d => { subjectsByDay[d] = subjects.filter(s => s.day === d); });

  const gridHeaders = ['Time Slot', ...days];
  gridRows.push(gridHeaders);

  for (let hour = 8; hour <= 21; hour++) {
    const timeSlotStr = `${hour % 12 === 0 ? 12 : hour % 12}:00 ${hour >= 12 ? 'PM' : 'AM'}`;
    const row = [timeSlotStr];
    
    days.forEach(day => {
      const dayClasses = subjectsByDay[day].filter(s => {
        const sMins = parseInt(s.startTime.split(':')[0], 10);
        return sMins === hour;
      });
      
      if (dayClasses.length > 0) {
        row.push(dayClasses.map(c => `${c.name} (${c.startTime}-${c.endTime}) [${c.room || 'N/A'}]`).join('\n'));
      } else {
        row.push('');
      }
    });
    gridRows.push(row);
  }

  const visualWs = XLSX.utils.aoa_to_sheet(gridRows);
  XLSX.utils.book_append_sheet(wb, visualWs, 'Visual Calendar View');

  const cleanName = semesterName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  XLSX.writeFile(wb, `${cleanName}_schedule.xlsx`);
}

async function exportPNG(elementId, semesterName) {
  if (typeof html2canvas === 'undefined') {
    throw new Error('html2canvas library is not loaded.');
  }

  const element = document.getElementById(elementId);
  if (!element) throw new Error('Target element not found.');

  const originalMaxHeight = element.style.maxHeight;
  const originalOverflow = element.style.overflow;
  element.style.maxHeight = 'none';
  element.style.overflow = 'visible';

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: getComputedStyle(document.body).getPropertyValue('--bg-color').trim(),
      logging: false
    });

    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    const cleanName = semesterName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    a.href = url;
    a.download = `${cleanName}_schedule.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } finally {
    element.style.maxHeight = originalMaxHeight;
    element.style.overflow = originalOverflow;
  }
}

async function exportPDF(elementId, semesterName) {
  if (typeof html2pdf === 'undefined') {
    throw new Error('html2pdf.js library is not loaded.');
  }

  const element = document.getElementById(elementId);
  if (!element) throw new Error('Target element not found.');

  const cleanName = semesterName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const opt = {
    margin: 10,
    filename: `${cleanName}_schedule.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
  };

  const originalMaxHeight = element.style.maxHeight;
  const originalOverflow = element.style.overflow;
  element.style.maxHeight = 'none';
  element.style.overflow = 'visible';

  try {
    await html2pdf().from(element).set(opt).save();
  } finally {
    element.style.maxHeight = originalMaxHeight;
    element.style.overflow = originalOverflow;
  }
}

// ============================================================================
// 5. UI CONTROLLER & VIEW COORDINATOR
// ============================================================================

let currentSemesterId = null;
let currentSemesterName = 'Default Semester';
let activeSubjects = [];
let editingSubjectId = null;

// Master Data: Rooms, Instructors, Sections, Subject Catalog
const MASTER_TYPES = {
  room: { store: 'rooms', label: 'Room', placeholder: 'e.g. Room 204', detailLabel: 'Capacity / Notes' },
  instructor: { store: 'instructors', label: 'Instructor', placeholder: 'e.g. Professor Smith', detailLabel: 'Department / Email' },
  section: { store: 'sections', label: 'Section', placeholder: 'e.g. Section A', detailLabel: 'Adviser / Strand' },
  subject: { store: 'subjectCatalog', label: 'Subject', placeholder: 'e.g. Calculus I', detailLabel: 'Units / Code' }
};
let masterData = { room: [], instructor: [], section: [], subject: [] };
let editingMasterType = null;
let editingMasterId = null;

let uploadedImages = {
  subject: null,
  instructor: null,
  logo: null
};

let activeImageSlot = 'subject';
let searchQuery = '';
let filterInstructor = '';
let filterRoom = '';

function showToast(message, icon = 'ti-info-circle') {
  const toast = document.getElementById('toastNotification');
  if (!toast) return;
  toast.innerHTML = `<i class="ti ${icon}"></i><span>${message}</span>`;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

// ----------------------------------------------------------------------
// Custom Confirm / Prompt Dialogs (replace native browser popups)
// ----------------------------------------------------------------------

function confirmDialog({ title = 'Are you sure?', message = '', okLabel = 'Confirm', cancelLabel = 'Cancel', danger = true } = {}) {
  return new Promise((resolve) => {
    const backdrop = document.getElementById('confirmBackdrop');
    const icon = document.getElementById('confirmIcon');
    const titleEl = document.getElementById('confirmTitle');
    const messageEl = document.getElementById('confirmMessage');
    const inputWrapper = document.getElementById('confirmInputWrapper');
    const okBtn = document.getElementById('confirmOkBtn');
    const cancelBtn = document.getElementById('confirmCancelBtn');
    if (!backdrop) { resolve(window.confirm(message)); return; }

    titleEl.textContent = title;
    messageEl.textContent = message;
    inputWrapper.style.display = 'none';
    icon.className = `confirm-icon${danger ? '' : ' info-style'}`;
    icon.innerHTML = `<i class="ti ${danger ? 'ti-alert-triangle' : 'ti-info-circle'}"></i>`;
    okBtn.textContent = okLabel;
    okBtn.className = `btn ${danger ? 'btn-danger' : 'btn-primary'}`;
    cancelBtn.textContent = cancelLabel;

    const cleanup = (result) => {
      backdrop.classList.remove('show');
      okBtn.removeEventListener('click', onOk);
      cancelBtn.removeEventListener('click', onCancel);
      backdrop.removeEventListener('mousedown', onBackdropClick);
      document.removeEventListener('keydown', onKeydown);
      resolve(result);
    };

    const onOk = () => cleanup(true);
    const onCancel = () => cleanup(false);
    const onBackdropClick = (e) => { if (e.target === backdrop) cleanup(false); };
    const onKeydown = (e) => {
      if (e.key === 'Escape') cleanup(false);
      if (e.key === 'Enter') cleanup(true);
    };

    okBtn.addEventListener('click', onOk);
    cancelBtn.addEventListener('click', onCancel);
    backdrop.addEventListener('mousedown', onBackdropClick);
    document.addEventListener('keydown', onKeydown);

    backdrop.classList.add('show');
  });
}

function promptDialog({ title = 'Enter a value', message = '', placeholder = '', defaultValue = '', okLabel = 'Save', cancelLabel = 'Cancel' } = {}) {
  return new Promise((resolve) => {
    const backdrop = document.getElementById('confirmBackdrop');
    const icon = document.getElementById('confirmIcon');
    const titleEl = document.getElementById('confirmTitle');
    const messageEl = document.getElementById('confirmMessage');
    const inputWrapper = document.getElementById('confirmInputWrapper');
    const inputField = document.getElementById('confirmInputField');
    const okBtn = document.getElementById('confirmOkBtn');
    const cancelBtn = document.getElementById('confirmCancelBtn');
    if (!backdrop) { resolve(window.prompt(message)); return; }

    titleEl.textContent = title;
    messageEl.textContent = message;
    messageEl.style.display = message ? 'block' : 'none';
    icon.className = 'confirm-icon info-style';
    icon.innerHTML = `<i class="ti ti-edit"></i>`;
    inputWrapper.style.display = 'block';
    inputField.value = defaultValue;
    inputField.placeholder = placeholder;
    okBtn.textContent = okLabel;
    okBtn.className = 'btn btn-primary';
    cancelBtn.textContent = cancelLabel;

    const cleanup = (result) => {
      backdrop.classList.remove('show');
      inputWrapper.style.display = 'none';
      messageEl.style.display = 'block';
      okBtn.removeEventListener('click', onOk);
      cancelBtn.removeEventListener('click', onCancel);
      backdrop.removeEventListener('mousedown', onBackdropClick);
      inputField.removeEventListener('keydown', onInputKeydown);
      resolve(result);
    };

    const onOk = () => cleanup(inputField.value.trim() || null);
    const onCancel = () => cleanup(null);
    const onBackdropClick = (e) => { if (e.target === backdrop) cleanup(null); };
    const onInputKeydown = (e) => {
      if (e.key === 'Enter') { e.preventDefault(); onOk(); }
      if (e.key === 'Escape') cleanup(null);
    };

    okBtn.addEventListener('click', onOk);
    cancelBtn.addEventListener('click', onCancel);
    backdrop.addEventListener('mousedown', onBackdropClick);
    inputField.addEventListener('keydown', onInputKeydown);

    backdrop.classList.add('show');
    setTimeout(() => inputField.focus(), 50);
  });
}

// Initialize and setup DOM listeners
async function initUI() {
  setupNavigation();
  setupTheme();
  setupSettingsListeners();
  setupSubjectModal();
  setupSemesterManager();
  setupMasterItemModal();
  setupHistoryControls();
  setupKeyboardShortcuts();
  setupSearchAndFilters();

  await loadMasterData();
  await loadSemesterData();
  renderAll();
}

function setupNavigation() {
  const sidebarItems = document.querySelectorAll('.sidebar-item');
  const pages = document.querySelectorAll('.page');

  sidebarItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const targetPageId = item.getAttribute('data-target');
      
      sidebarItems.forEach(i => i.classList.remove('active'));
      pages.forEach(p => p.classList.remove('active'));

      item.classList.add('active');
      const targetPage = document.getElementById(targetPageId);
      if (targetPage) {
        targetPage.classList.add('active');
      }

      document.querySelector('.sidebar')?.classList.remove('show-mobile');
      document.getElementById('sidebarOverlay')?.classList.remove('active');
      document.body.style.overflow = '';

      if (targetPageId === 'dashboard-page') {
        renderDashboard();
      } else if (targetPageId === 'subjects-page') {
        renderSubjectsList();
      } else if (targetPageId === 'room-page') {
        renderMasterListPage('room');
      } else if (targetPageId === 'instructor-page') {
        renderMasterListPage('instructor');
      } else if (targetPageId === 'section-page') {
        renderMasterListPage('section');
      } else if (targetPageId === 'subjectcatalog-page') {
        renderMasterListPage('subject');
      }
    });
  });

  const toggleBtn = document.getElementById('sidebarToggle');
  const sidebar   = document.querySelector('.sidebar');
  const overlay   = document.getElementById('sidebarOverlay');

  function openSidebar() {
    sidebar?.classList.add('show-mobile');
    overlay?.classList.add('active');
    document.body.style.overflow = 'hidden'; // prevent body scroll while drawer is open
  }

  function closeSidebar() {
    sidebar?.classList.remove('show-mobile');
    overlay?.classList.remove('active');
    document.body.style.overflow = '';
  }

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      sidebar?.classList.contains('show-mobile') ? closeSidebar() : openSidebar();
    });
  }

  // Tap overlay to close
  overlay?.addEventListener('click', closeSidebar);

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sidebar?.classList.contains('show-mobile')) closeSidebar();
  });
}

function setupTheme() {
  const savedTheme = localStorage.getItem('theme') || 'auto';
  setTheme(savedTheme);

  const layout = localStorage.getItem('layoutStyle') || 'comfortable';
  setLayoutStyle(layout);

  const sidebar = localStorage.getItem('sidebarStyle') || 'icons-text';
  setSidebarStyle(sidebar);

  const fontScale = localStorage.getItem('fontSize') || '1';
  setFontScale(fontScale);

  const glassMode = localStorage.getItem('glassMode') === 'true';
  setGlassMode(glassMode);

  const accentColor = localStorage.getItem('accentColor') || '#ff9800';
  setAccentColor(accentColor);
}

function setTheme(theme) {
  const root = document.documentElement;
  localStorage.setItem('theme', theme);
  
  const themeSelect = document.getElementById('themeSelect');
  if (themeSelect) themeSelect.value = theme;

  if (theme === 'auto') {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.setAttribute('data-theme', isDark ? 'dark' : 'light');
  } else {
    root.setAttribute('data-theme', theme);
  }
}

function setLayoutStyle(layout) {
  document.body.classList.remove('layout-dense', 'layout-compact', 'layout-comfortable');
  document.body.classList.add(`layout-${layout}`);
  localStorage.setItem('layoutStyle', layout);
  
  const select = document.getElementById('layoutSelect');
  if (select) select.value = layout;
}

function setSidebarStyle(style) {
  const sidebar = document.querySelector('.sidebar');
  if (!sidebar) return;
  sidebar.classList.remove('icons-only', 'icons-text', 'hidden-sidebar');
  
  if (style === 'icons-only') {
    sidebar.classList.add('icons-only');
  } else if (style === 'hidden') {
    sidebar.classList.add('hidden-sidebar');
  }
  localStorage.setItem('sidebarStyle', style);
  
  const select = document.getElementById('sidebarSelect');
  if (select) select.value = style;
}

function setFontScale(scale) {
  document.documentElement.style.setProperty('--font-scale', scale);
  localStorage.setItem('fontSize', scale);
  
  const select = document.getElementById('fontSizeSelect');
  if (select) select.value = scale;
}

function setGlassMode(enabled) {
  if (enabled) {
    document.body.classList.add('glass-mode');
  } else {
    document.body.classList.remove('glass-mode');
  }
  localStorage.setItem('glassMode', enabled);
  
  const toggle = document.getElementById('glassModeToggle');
  if (toggle) toggle.checked = enabled;
}

function setAccentColor(color) {
  document.documentElement.style.setProperty('--accent-color', color);
  
  let secondaryColor = '#ff007f';
  if (color === '#21d4fd') secondaryColor = '#b721ff';
  else if (color === '#17ad37') secondaryColor = '#98ec2d';
  else if (color === '#ff9800') secondaryColor = '#f44336';
  else if (color === '#141727') secondaryColor = '#3a416f';
  else if (color === '#627594') secondaryColor = '#a3b1c6';
  else if (color === '#ff0000') secondaryColor = '#bd0561';

  const gradient = `linear-gradient(310deg, ${color} 0%, ${secondaryColor} 100%)`;
  document.documentElement.style.setProperty('--accent-gradient', gradient);
  localStorage.setItem('accentColor', color);

  document.querySelectorAll('.accent-swatch').forEach(sw => {
    if (sw.getAttribute('data-color') === color) {
      sw.classList.add('active');
    } else {
      sw.classList.remove('active');
    }
  });
}

function setupSettingsListeners() {
  document.getElementById('themeSelect')?.addEventListener('change', (e) => setTheme(e.target.value));
  document.getElementById('layoutSelect')?.addEventListener('change', (e) => setLayoutStyle(e.target.value));
  document.getElementById('sidebarSelect')?.addEventListener('change', (e) => setSidebarStyle(e.target.value));
  document.getElementById('fontSizeSelect')?.addEventListener('change', (e) => setFontScale(e.target.value));
  document.getElementById('glassModeToggle')?.addEventListener('change', (e) => setGlassMode(e.target.checked));

  document.querySelectorAll('.accent-swatch').forEach(swatch => {
    swatch.addEventListener('click', () => {
      const color = swatch.getAttribute('data-color');
      setAccentColor(color);
    });
  });

  const gridStart = document.getElementById('gridStartSelect');
  const gridEnd = document.getElementById('gridEndSelect');
  const gridInterval = document.getElementById('gridIntervalSelect');

  gridStart.value = localStorage.getItem('gridStart') || '08:00';
  gridEnd.value = localStorage.getItem('gridEnd') || '22:00';
  gridInterval.value = localStorage.getItem('gridInterval') || '60';

  const onGridConfigChange = () => {
    if (timeToMins(gridStart.value) >= timeToMins(gridEnd.value)) {
      showToast('Start time must be before end time!', 'ti-alert-triangle');
      return;
    }
    localStorage.setItem('gridStart', gridStart.value);
    localStorage.setItem('gridEnd', gridEnd.value);
    localStorage.setItem('gridInterval', gridInterval.value);
    renderSchedulerGrid();
    renderDashboard();
  };

  gridStart?.addEventListener('change', onGridConfigChange);
  gridEnd?.addEventListener('change', onGridConfigChange);
  gridInterval?.addEventListener('change', onGridConfigChange);

  const defaultDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
  let visibleDays = JSON.parse(localStorage.getItem('visibleDays')) || defaultDays;

  const dayChecks = document.querySelectorAll('.day-visible-check');
  dayChecks.forEach(cb => {
    const day = cb.getAttribute('data-day');
    cb.checked = visibleDays.includes(day);
    cb.addEventListener('change', () => {
      const activeDays = Array.from(dayChecks).filter(c => c.checked).map(c => c.getAttribute('data-day'));
      if (activeDays.length === 0) {
        showToast('At least one day must be visible!', 'ti-alert-triangle');
        cb.checked = true;
        return;
      }
      localStorage.setItem('visibleDays', JSON.stringify(activeDays));
      renderSchedulerGrid();
      renderDashboard();
    });
  });

  document.getElementById('exportJsonBtn')?.addEventListener('click', () => exportJSON(currentSemesterId));
  document.getElementById('importJsonFile')?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const data = await importJSON(file);
      showToast('Data imported successfully!', 'ti-circle-check');
      window.location.reload();
    } catch (err) {
      showToast(`Import failed: ${err.message}`, 'ti-alert-triangle');
    }
  });

  document.getElementById('keyboardHelpBtn')?.addEventListener('click', () => {
    openModal('keyboardHelpModal');
  });

  document.getElementById('deleteManagementBtn')?.addEventListener('click', async () => {
    const select = document.getElementById('deleteManagementSelect');
    const value = select.value;
    const labels = {
      instructor: 'Instructors',
      room: 'Rooms',
      section: 'Sections',
      subject: 'Subjects',
      all: 'ALL Management Data (Instructors, Rooms, Sections, Subjects)'
    };

    const confirmed = await confirmDialog({
      title: 'Delete Management Data?',
      message: `Permanently delete ${labels[value]}? Existing schedules keep their saved text, but the quick-select dropdown will be empty until you re-add entries. This cannot be undone.`,
      okLabel: 'Delete'
    });
    if (!confirmed) {
      return;
    }

    if (value === 'all') {
      for (const type of Object.keys(MASTER_TYPES)) {
        await clearMasterStore(MASTER_TYPES[type].store);
      }
    } else {
      await clearMasterStore(MASTER_TYPES[value].store);
    }

    await loadMasterData();
    renderMasterListPage('room');
    renderMasterListPage('instructor');
    renderMasterListPage('section');
    renderMasterListPage('subject');

    showToast(`${labels[value]} deleted!`, 'ti-trash');
  });

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (localStorage.getItem('theme') === 'auto') {
      setTheme('auto');
    }
  });
}

function openModal(id) {
  const backdrop = document.getElementById('modalBackdrop');
  const targetModal = document.getElementById(id);
  if (!backdrop || !targetModal) return;

  backdrop.querySelectorAll('.modal-container').forEach(m => m.style.display = 'none');
  targetModal.style.display = 'flex';
  backdrop.classList.add('show');
}

function closeModal() {
  const backdrop = document.getElementById('modalBackdrop');
  if (backdrop) {
    backdrop.classList.remove('show');
  }
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});
document.getElementById('modalBackdrop')?.addEventListener('click', (e) => {
  if (e.target.id === 'modalBackdrop') closeModal();
});
document.querySelectorAll('.modal-close-btn').forEach(btn => {
  btn.addEventListener('click', closeModal);
});

function setupSubjectModal() {
  const nameInput = document.getElementById('subjectNameInput');
  const bgInput = document.getElementById('subjectBgInput');
  const textInput = document.getElementById('subjectTextInput');
  const borderInput = document.getElementById('subjectBorderInput');

  document.getElementById('suggestColorsBtn')?.addEventListener('click', () => {
    const name = nameInput.value.trim();
    if (!name) {
      showToast('Enter subject name first!', 'ti-alert-triangle');
      return;
    }
    const colors = suggestColors(name);
    bgInput.value = colors.bg;
    textInput.value = colors.text;
    borderInput.value = colors.border;
  });

  const uploadTabs = document.querySelectorAll('.upload-slot-tab');
  uploadTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      uploadTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      activeImageSlot = tab.getAttribute('data-slot');
    });
  });

  const dropArea = document.getElementById('imageDragArea');
  
  dropArea?.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropArea.classList.add('drag-over');
  });

  dropArea?.addEventListener('dragleave', () => {
    dropArea.classList.remove('drag-over');
  });

  dropArea?.addEventListener('drop', (e) => {
    e.preventDefault();
    dropArea.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleUploadedFile(file);
    } else {
      showToast('Dropped file must be an image!', 'ti-alert-triangle');
    }
  });

  dropArea?.addEventListener('click', () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.onchange = (e) => {
      const file = e.target.files[0];
      if (file) handleUploadedFile(file);
    };
    fileInput.click();
  });

  window.addEventListener('paste', (e) => {
    const modal = document.getElementById('subjectModal');
    if (modal && modal.style.display !== 'none') {
      const items = (e.clipboardData || e.originalEvent.clipboardData).items;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') === 0) {
          const blob = items[i].getAsFile();
          handleUploadedFile(blob);
          showToast(`Image pasted from clipboard into ${activeImageSlot}!`, 'ti-photo');
        }
      }
    }
  });

  const form = document.getElementById('subjectForm');
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const subjectData = {
      id: editingSubjectId || crypto.randomUUID(),
      semesterId: currentSemesterId,
      name: nameInput.value.trim(),
      instructor: document.getElementById('subjectInstructorInput').value.trim(),
      room: document.getElementById('subjectRoomInput').value.trim(),
      section: document.getElementById('subjectSectionInput').value.trim(),
      notes: document.getElementById('subjectNotesInput').value.trim(),
      day: document.getElementById('subjectDaySelect').value,
      startTime: document.getElementById('subjectStartInput').value,
      endTime: document.getElementById('subjectEndInput').value,
      colorBg: bgInput.value,
      colorText: textInput.value,
      colorBorder: borderInput.value,
      images: { ...uploadedImages }
    };

    if (timeToMins(subjectData.startTime) >= timeToMins(subjectData.endTime)) {
      showToast('Class start time must be before end time!', 'ti-alert-triangle');
      return;
    }

    const conflicts = checkConflicts(subjectData, activeSubjects);
    if (conflicts.length > 0) {
      const banner = document.getElementById('modalConflictBanner');
      if (banner) {
        banner.innerHTML = `<i class="ti ti-alert-triangle"></i><span>Conflicts detected with: ${conflicts.map(c => c.name).join(', ')}</span>`;
        banner.style.display = 'flex';
      }
    }

    await saveSubject(subjectData);
    
    activeSubjects = await getSubjects(currentSemesterId);
    history.pushState(activeSubjects);
    
    showToast(editingSubjectId ? 'Subject updated!' : 'Subject added!', 'ti-circle-check');
    closeModal();
    renderAll();
  });

  document.getElementById('copyToDayBtn')?.addEventListener('click', async () => {
    if (!editingSubjectId) return;
    const targetDay = document.getElementById('copyToDaySelect').value;
    const subject = activeSubjects.find(s => s.id === editingSubjectId);
    if (!subject) return;

    const copied = {
      ...subject,
      id: crypto.randomUUID(),
      day: targetDay
    };

    const conflicts = checkConflicts(copied, activeSubjects);
    if (conflicts.length > 0) {
      showToast(`Conflict: copied class overlaps with ${conflicts.map(c => c.name).join(', ')}`, 'ti-alert-triangle');
    }

    await saveSubject(copied);
    activeSubjects = await getSubjects(currentSemesterId);
    history.pushState(activeSubjects);
    showToast(`Class copied to ${targetDay}!`, 'ti-copy');
    closeModal();
    renderAll();
  });

  document.getElementById('duplicateClassBtn')?.addEventListener('click', async () => {
    if (!editingSubjectId) return;
    const subject = activeSubjects.find(s => s.id === editingSubjectId);
    if (!subject) return;

    const duplicated = {
      ...subject,
      id: crypto.randomUUID(),
      name: `${subject.name} (Copy)`
    };

    const conflicts = checkConflicts(duplicated, activeSubjects);
    if (conflicts.length > 0) {
      showToast(`Conflict: duplicated class overlaps with ${conflicts.map(c => c.name).join(', ')}`, 'ti-alert-triangle');
    }

    await saveSubject(duplicated);
    activeSubjects = await getSubjects(currentSemesterId);
    history.pushState(activeSubjects);
    showToast(`Class duplicated!`, 'ti-copy');
    closeModal();
    renderAll();
  });
}

function handleUploadedFile(file) {
  if (file.size > 2 * 1024 * 1024) {
    showToast('Image file must be under 2MB!', 'ti-alert-triangle');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    uploadedImages[activeImageSlot] = e.target.result;
    renderUploadedPreviews();
    showToast(`Uploaded ${activeImageSlot} photo!`, 'ti-photo');
  };
  reader.readAsDataURL(file);
}

function renderUploadedPreviews() {
  const container = document.getElementById('imagePreviewsContainer');
  if (!container) return;
  container.innerHTML = '';

  Object.keys(uploadedImages).forEach(slot => {
    const dataUrl = uploadedImages[slot];
    if (!dataUrl) return;

    const div = document.createElement('div');
    div.className = 'image-preview-card';
    div.innerHTML = `
      <img src="${dataUrl}" alt="${slot}">
      <div class="remove-img-btn" data-slot="${slot}"><i class="ti ti-x"></i></div>
      <div style="font-size:8px; text-align:center; padding-top:2px; color:var(--text-muted); text-transform:capitalize;">${slot}</div>
    `;

    div.querySelector('.remove-img-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      uploadedImages[slot] = null;
      renderUploadedPreviews();
    });

    container.appendChild(div);
  });
}

function openEditSubjectModal(subject) {
  editingSubjectId = subject.id;
  
  document.getElementById('modalTitle').textContent = 'Edit Subject';
  populateSubjectDropdowns({
    name: subject.name,
    instructor: subject.instructor || '',
    room: subject.room || '',
    section: subject.section || ''
  });
  document.getElementById('subjectNotesInput').value = subject.notes || '';
  document.getElementById('subjectDaySelect').value = subject.day;
  document.getElementById('subjectStartInput').value = subject.startTime;
  document.getElementById('subjectEndInput').value = subject.endTime;
  document.getElementById('subjectBgInput').value = subject.colorBg;
  document.getElementById('subjectTextInput').value = subject.colorText;
  document.getElementById('subjectBorderInput').value = subject.colorBorder;

  uploadedImages = subject.images
    ? { subject: subject.images.subject || null, instructor: subject.images.instructor || null, logo: subject.images.logo || null }
    : { subject: null, instructor: null, logo: null };
  renderUploadedPreviews();

  const banner = document.getElementById('modalConflictBanner');
  if (banner) banner.style.display = 'none';

  const dupSection = document.getElementById('modalActionDuplication');
  if (dupSection) dupSection.style.display = 'block';

  const deleteBtn = document.getElementById('deleteSubjectBtn');
  if (deleteBtn) {
    deleteBtn.style.display = 'inline-flex';
    deleteBtn.onclick = async () => {
      const confirmed = await confirmDialog({
        title: 'Delete Subject?',
        message: `Are you sure you want to delete "${subject.name}"? This cannot be undone.`,
        okLabel: 'Delete'
      });
      if (confirmed) {
        await deleteSubject(subject.id);
        activeSubjects = await getSubjects(currentSemesterId);
        history.pushState(activeSubjects);
        showToast('Subject deleted!', 'ti-trash');
        closeModal();
        renderAll();
      }
    };
  }

  openModal('subjectModal');
}

function openAddSubjectModal(defaultDay = 'monday', defaultTime = '09:00') {
  editingSubjectId = null;

  document.getElementById('modalTitle').textContent = 'Add Subject';
  document.getElementById('subjectForm').reset();
  populateSubjectDropdowns({});

  if (masterData.subject.length === 0 || masterData.instructor.length === 0 || masterData.room.length === 0) {
  showToast('<b>Tip:</b> Add rooms, instructors & subjects for faster dropdowns.', 'ti-info-circle');
  }
  
  document.getElementById('subjectDaySelect').value = defaultDay;
  document.getElementById('subjectStartInput').value = defaultTime;
  
  const startMins = timeToMins(defaultTime);
  document.getElementById('subjectEndInput').value = minsToTime(startMins + 60);

  document.getElementById('subjectBgInput').value = '#e3f2fd';
  document.getElementById('subjectTextInput').value = '#0d47a1';
  document.getElementById('subjectBorderInput').value = '#90caf9';

  uploadedImages = { subject: null, instructor: null, logo: null };
  renderUploadedPreviews();

  const banner = document.getElementById('modalConflictBanner');
  if (banner) banner.style.display = 'none';

  const dupSection = document.getElementById('modalActionDuplication');
  if (dupSection) dupSection.style.display = 'none';

  const deleteBtn = document.getElementById('deleteSubjectBtn');
  if (deleteBtn) deleteBtn.style.display = 'none';

  openModal('subjectModal');
}

function setupSemesterManager() {
  const addBtn = document.getElementById('addSemesterBtn');
  const semList = document.getElementById('semestersListContainer');

  addBtn?.addEventListener('click', async () => {
    const name = await promptDialog({
      title: 'Create Semester',
      message: 'Give this semester or school year a name.',
      placeholder: 'e.g. Fall 2026',
      okLabel: 'Create'
    });
    if (!name) return;

    const newSem = {
      id: crypto.randomUUID(),
      name: name.trim(),
      active: false
    };

    await saveSemester(newSem);
    showToast('Semester created!', 'ti-circle-check');
    await loadSemesterData();
    renderSemesterPage();
    updateSemesterDropdowns();
  });
}

async function loadSemesterData() {
  const semesters = await getSemesters();
  
  if (semesters.length === 0) {
    const defaultSem = {
      id: crypto.randomUUID(),
      name: 'Fall 2026',
      active: true
    };
    await saveSemester(defaultSem);
    currentSemesterId = defaultSem.id;
    currentSemesterName = defaultSem.name;
  } else {
    const active = semesters.find(s => s.active);
    if (active) {
      currentSemesterId = active.id;
      currentSemesterName = active.name;
    } else {
      currentSemesterId = semesters[0].id;
      currentSemesterName = semesters[0].name;
      semesters[0].active = true;
      await saveSemester(semesters[0]);
    }
  }

  activeSubjects = await getSubjects(currentSemesterId);
  
  if (history.stack.length === 0) {
    history.pushState(activeSubjects);
  }

  updateSemesterDropdowns();
}

function updateSemesterDropdowns() {
  getSemesters().then(sems => {
    const navSelect = document.getElementById('navSemesterSelect');
    if (navSelect) {
      navSelect.innerHTML = sems.map(s => `
        <option value="${s.id}" ${s.id === currentSemesterId ? 'selected' : ''}>${s.name}</option>
      `).join('');
      
      const newSelect = navSelect.cloneNode(true);
      navSelect.parentNode.replaceChild(newSelect, navSelect);
      newSelect.addEventListener('change', async (e) => {
        const selectedId = e.target.value;
        const activeSems = await getSemesters();
        for (const s of activeSems) {
          s.active = (s.id === selectedId);
          await saveSemester(s);
        }

        await loadSemesterData();
        history.clear();
        history.pushState(activeSubjects);
        showToast(`Switched to ${currentSemesterName}`, 'ti-calendar');
        renderAll();
      });
    }
  });
}

function renderSemesterPage() {
  const container = document.getElementById('semestersListContainer');
  if (!container) return;

  getSemesters().then(sems => {
    container.innerHTML = sems.map(s => `
      <div class="semester-list-card ${s.active ? 'active' : ''}" data-id="${s.id}">
        <div class="semester-info-block">
          <h4>${s.name}</h4>
          <span>${s.active ? 'Active Schedule' : 'Inactive'}</span>
        </div>
        <div>
          <button class="btn-delete-gradient delete-sem-btn" data-id="${s.id}" ${s.active && sems.length === 1 ? 'disabled' : ''}>Delete</button>
        </div>
      </div>
    `).join('');

    // Clicking the card itself (excluding the delete button) activates that semester
    container.querySelectorAll('.semester-list-card').forEach(card => {
      card.addEventListener('click', async (e) => {
        if (e.target.closest('.delete-sem-btn')) return;

        const id = card.getAttribute('data-id');
        const list = await getSemesters();
        const target = list.find(s => s.id === id);
        
        if (target && target.active) return;

        for (const s of list) {
          s.active = (s.id === id);
          await saveSemester(s);
        }

        await loadSemesterData();
        history.clear();
        history.pushState(activeSubjects);
        showToast(`Activated ${currentSemesterName}`, 'ti-circle-check');
        renderAll();
      });
    });

    // Delete handler
    container.querySelectorAll('.delete-sem-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation(); // prevent card click trigger
        const id = btn.getAttribute('data-id');
        const confirmed = await confirmDialog({
          title: 'Delete Semester?',
          message: 'Deleting this semester will permanently delete ALL classes in it. This cannot be undone.',
          okLabel: 'Delete'
        });
        if (confirmed) {
          await deleteSemester(id);
          showToast('Semester deleted!', 'ti-trash');
          await loadSemesterData();
          renderAll();
        }
      });
    });
  });
}

async function loadMasterData() {
  for (const type of Object.keys(MASTER_TYPES)) {
    masterData[type] = await getMasterList(MASTER_TYPES[type].store);
  }
}

function renderMasterListPage(type) {
  const cfg = MASTER_TYPES[type];
  const container = document.getElementById(`${type === 'subject' ? 'subjectcatalog' : type}ListContainer`);
  if (!container) return;

  const list = [...masterData[type]].sort((a, b) => a.name.localeCompare(b.name));

  if (list.length === 0) {
    container.innerHTML = `
      <div class="card" style="text-align:center; padding:3rem; color:var(--text-muted);">
        <i class="ti ti-mood-empty" style="font-size:2.5rem; display:block; margin-bottom:0.5rem;"></i>
        No ${cfg.label.toLowerCase()}s added yet. Click "Add ${cfg.label}" to create one.
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="card" style="padding:0; overflow-x:auto;">
      <table style="width:100%; border-collapse:collapse; text-align:left;">
        <thead>
          <tr style="background-color:var(--bg-color); border-bottom:1px solid var(--border-color); font-size:0.75rem; text-transform:uppercase; font-weight:800; color:var(--text-muted);">
            <th style="padding:1rem;">${cfg.label} Name</th>
            <th style="padding:1rem;">${cfg.detailLabel}</th>
            <th style="padding:1rem; text-align:right;">Actions</th>
          </tr>
        </thead>
        <tbody>
          ${list.map(item => `
            <tr style="border-bottom: 1px solid var(--border-color);">
              <td style="padding:1rem;"><strong style="color:var(--text-main);">${item.name}</strong></td>
              <td style="padding:1rem; color:var(--text-muted);">${item.detail || '-'}</td>
              <td style="padding:1rem; text-align:right;">
                <button class="btn btn-secondary btn-sm edit-master-btn" data-type="${type}" data-id="${item.id}"><i class="ti ti-edit"></i> Edit</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;

  container.querySelectorAll('.edit-master-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const item = masterData[type].find(i => i.id === id);
      if (item) openMasterItemModal(type, item);
    });
  });
}

function openMasterItemModal(type, item = null) {
  const cfg = MASTER_TYPES[type];
  editingMasterType = type;
  editingMasterId = item ? item.id : null;

  document.getElementById('masterItemModalTitle').textContent = item ? `Edit ${cfg.label}` : `Add ${cfg.label}`;
  document.getElementById('masterItemNameLabel').textContent = `${cfg.label} Name *`;
  document.getElementById('masterItemDetailLabel').textContent = cfg.detailLabel;

  const nameInput = document.getElementById('masterItemNameInput');
  const detailInput = document.getElementById('masterItemDetailInput');
  nameInput.placeholder = cfg.placeholder;
  nameInput.value = item ? item.name : '';
  detailInput.value = item ? (item.detail || '') : '';

  const deleteBtn = document.getElementById('deleteMasterItemBtn');
  if (deleteBtn) {
    deleteBtn.style.display = item ? 'inline-flex' : 'none';
    deleteBtn.onclick = async () => {
      const confirmed = await confirmDialog({
        title: `Delete ${cfg.label}?`,
        message: `Delete this ${cfg.label.toLowerCase()}? Existing schedules will keep their saved value.`,
        okLabel: 'Delete'
      });
      if (confirmed) {
        await deleteMasterItem(cfg.store, item.id);
        await loadMasterData();
        renderMasterListPage(type);
        showToast(`${cfg.label} deleted!`, 'ti-trash');
        closeModal();
      }
    };
  }

  openModal('masterItemModal');
}

function setupMasterItemModal() {
  const form = document.getElementById('masterItemForm');
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const cfg = MASTER_TYPES[editingMasterType];
    if (!cfg) return;

    const name = document.getElementById('masterItemNameInput').value.trim();
    if (!name) return;

    const itemData = {
      id: editingMasterId || crypto.randomUUID(),
      name,
      detail: document.getElementById('masterItemDetailInput').value.trim()
    };

    await saveMasterItem(cfg.store, itemData);
    await loadMasterData();
    renderMasterListPage(editingMasterType);

    showToast(`${cfg.label} ${editingMasterId ? 'updated' : 'added'}!`, 'ti-circle-check');
    closeModal();
  });

  document.querySelectorAll('.trigger-add-room').forEach(el => el.addEventListener('click', () => openMasterItemModal('room')));
  document.querySelectorAll('.trigger-add-instructor').forEach(el => el.addEventListener('click', () => openMasterItemModal('instructor')));
  document.querySelectorAll('.trigger-add-section').forEach(el => el.addEventListener('click', () => openMasterItemModal('section')));
  document.querySelectorAll('.trigger-add-subjectcatalog').forEach(el => el.addEventListener('click', () => openMasterItemModal('subject')));
}

function fillSelectOptions(selectEl, values, currentValue, placeholder) {
  if (!selectEl) return;
  const uniqueValues = [...new Set(values)];
  if (currentValue && !uniqueValues.includes(currentValue)) {
    uniqueValues.push(currentValue); // keep legacy/custom values intact when editing
  }
  selectEl.innerHTML = `<option value="">${placeholder}</option>` +
    uniqueValues.map(v => `<option value="${v.replace(/"/g, '&quot;')}" ${v === currentValue ? 'selected' : ''}>${v}</option>`).join('');
}

function populateSubjectDropdowns(currentValues = {}) {
  fillSelectOptions(document.getElementById('subjectNameInput'), masterData.subject.map(i => i.name), currentValues.name, 'Select a subject...');
  fillSelectOptions(document.getElementById('subjectInstructorInput'), masterData.instructor.map(i => i.name), currentValues.instructor, 'Select an instructor...');
  fillSelectOptions(document.getElementById('subjectRoomInput'), masterData.room.map(i => i.name), currentValues.room, 'Select a room...');
  fillSelectOptions(document.getElementById('subjectSectionInput'), masterData.section.map(i => i.name), currentValues.section, 'Select a section...');
}

function setupHistoryControls() {
  document.getElementById('undoBtn')?.addEventListener('click', () => {
    triggerUndo();
  });
  document.getElementById('redoBtn')?.addEventListener('click', () => {
    triggerRedo();
  });
}

async function triggerUndo() {
  if (history.canUndo()) {
    const prevState = history.undo();
    if (prevState) {
      activeSubjects = prevState;
      await replaceCurrentSemesterSubjects(activeSubjects);
      showToast('Action undone!', 'ti-back-up');
      renderAll();
    }
  } else {
    showToast('Nothing to undo', 'ti-alert-triangle');
  }
}

async function triggerRedo() {
  if (history.canRedo()) {
    const nextState = history.redo();
    if (nextState) {
      activeSubjects = nextState;
      await replaceCurrentSemesterSubjects(activeSubjects);
      showToast('Action redone!', 'ti-corner-up-right-double');
      renderAll();
    }
  } else {
    showToast('Nothing to redo', 'ti-alert-triangle');
  }
}

async function replaceCurrentSemesterSubjects(subjects) {
  const dbSubjects = await getSubjects(currentSemesterId);
  for (const s of dbSubjects) {
    await deleteSubject(s.id);
  }
  for (const s of subjects) {
    await saveSubject(s);
  }
}

function setupSearchAndFilters() {
  const searchBar = document.getElementById('searchBar');
  if (searchBar) {
    searchBar.addEventListener('input', (e) => {
      searchQuery = e.target.value.toLowerCase().trim();
      renderAllFiltered();
    });
  }

  document.getElementById('filterInstructorSelect')?.addEventListener('change', (e) => {
    filterInstructor = e.target.value;
    renderSubjectsList();
  });
  document.getElementById('filterRoomSelect')?.addEventListener('change', (e) => {
    filterRoom = e.target.value;
    renderSubjectsList();
  });

  document.getElementById('exportPdfBtn')?.addEventListener('click', () => {
    exportPDF('schedulerGridContainer', currentSemesterName).catch(err => showToast(`PDF error: ${err.message}`, 'ti-alert-triangle'));
  });
  document.getElementById('exportPngBtn')?.addEventListener('click', () => {
    exportPNG('schedulerGridContainer', currentSemesterName).catch(err => showToast(`PNG error: ${err.message}`, 'ti-alert-triangle'));
  });
  document.getElementById('exportExcelBtn')?.addEventListener('click', () => {
    exportExcel(currentSemesterName, currentSemesterId).catch(err => showToast(`Excel error: ${err.message}`, 'ti-alert-triangle'));
  });
}

function getFilteredSubjects() {
  return activeSubjects.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery) ||
                          (s.instructor && s.instructor.toLowerCase().includes(searchQuery)) ||
                          (s.room && s.room.toLowerCase().includes(searchQuery)) ||
                          (s.section && s.section.toLowerCase().includes(searchQuery)) ||
                          (s.notes && s.notes.toLowerCase().includes(searchQuery));

    const matchesInstructor = !filterInstructor || s.instructor === filterInstructor;
    const matchesRoom = !filterRoom || s.room === filterRoom;

    return matchesSearch && matchesInstructor && matchesRoom;
  });
}

function renderAllFiltered() {
  renderSchedulerGrid();
  if (document.getElementById('subjects-page').classList.contains('active')) {
    renderSubjectsList();
  }
}

function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'z') {
      e.preventDefault();
      triggerUndo();
    }
    if (e.ctrlKey && e.key === 'y') {
      e.preventDefault();
      triggerRedo();
    }
    if (e.ctrlKey && e.key === 'n') {
      e.preventDefault();
      openAddSubjectModal();
    }
    if (e.ctrlKey && e.key === 'p') {
      e.preventDefault();
      window.print();
    }
  });
}

function renderAll() {
  renderDashboard();
  renderSchedulerGrid();
  renderSubjectsList();
  renderSemesterPage();
  renderMasterListPage('room');
  renderMasterListPage('instructor');
  renderMasterListPage('section');
  renderMasterListPage('subject');
}

function renderDashboard() {
  const statsTotalSubjects = document.getElementById('statsTotalSubjects');
  const statsTotalHours = document.getElementById('statsTotalHours');
  const statsFreeHours = document.getElementById('statsFreeHours');
  const statsLongestClass = document.getElementById('statsLongestClass');
  const todayClassesContainer = document.getElementById('todayClassesContainer');

  if (!statsTotalSubjects) return;

  statsTotalSubjects.textContent = activeSubjects.length;

  let totalMins = 0;
  let maxDuration = 0;
  let longestClass = 'None';

  activeSubjects.forEach(s => {
    const duration = timeToMins(s.endTime) - timeToMins(s.startTime);
    totalMins += duration;
    if (duration > maxDuration) {
      maxDuration = duration;
      longestClass = `${s.name} (${Math.round(duration/60*10)/10}h)`;
    }
  });

  const hours = Math.round((totalMins / 60) * 10) / 10;
  statsTotalHours.textContent = `${hours} hrs`;
  statsLongestClass.textContent = longestClass;

  const gridStart = localStorage.getItem('gridStart') || '08:00';
  const gridEnd = localStorage.getItem('gridEnd') || '22:00';
  const gridMins = timeToMins(gridEnd) - timeToMins(gridStart);
  
  const defaultDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
  const visibleDays = JSON.parse(localStorage.getItem('visibleDays')) || defaultDays;
  
  const totalGridMins = visibleDays.length * gridMins;
  const freeMins = Math.max(0, totalGridMins - totalMins);
  statsFreeHours.textContent = `${Math.round((freeMins / 60) * 10) / 10} hrs`;

  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const currentDayIndex = new Date().getDay();
  const currentDayName = days[currentDayIndex];

  const todayClasses = activeSubjects.filter(s => s.day.toLowerCase() === currentDayName)
    .sort((a, b) => timeToMins(a.startTime) - timeToMins(b.startTime));

  if (!todayClassesContainer) return;
  
  if (todayClasses.length === 0) {
    todayClassesContainer.innerHTML = `
      <div style="text-align:center; padding: 2rem; color:var(--text-muted);">
        <i class="ti ti-confetti" style="font-size:2.5rem; display:block; margin-bottom:0.5rem; color:var(--accent-color);"></i>
        <strong>No classes scheduled for today!</strong> Enjoy your free time.
      </div>
    `;
  } else {
    todayClassesContainer.innerHTML = todayClasses.map(s => {
      const isOngoing = isClassOngoing(s.startTime, s.endTime, currentDayIndex);
      return `
        <div class="today-class-item" style="display:flex; align-items:center; justify-content:space-between; padding: 0.75rem 1rem; border-radius: 0.75rem; background-color: var(--bg-color); border-left: 4px solid ${s.colorBorder}; margin-bottom: 8px;">
          <div>
            <strong style="font-size:0.875rem; color:var(--text-main);">${s.name}</strong>
            <div style="font-size:0.75rem; color:var(--text-muted);">
              <i class="ti ti-clock"></i> ${format12Hour(timeToMins(s.startTime))} - ${format12Hour(timeToMins(s.endTime))}
              ${s.room ? ` | <i class="ti ti-map-pin"></i> ${s.room}` : ''}
            </div>
          </div>
          ${isOngoing ? `<span class="badge" style="background:var(--gradient-success); color:white; font-size:10px; font-weight:700; padding:2px 6px; border-radius:10px;">Ongoing</span>` : ''}
        </div>
      `;
    }).join('');
  }
}

function isClassOngoing(start, end, dayIndex) {
  const now = new Date();
  const currentDay = now.getDay();
  if (currentDay !== dayIndex) return false;

  const currentMins = now.getHours() * 60 + now.getMinutes();
  return currentMins >= timeToMins(start) && currentMins < timeToMins(end);
}

function renderSchedulerGrid() {
  const container = document.getElementById('schedulerGridContainer');
  if (!container) return;

  const gridStart = localStorage.getItem('gridStart') || '08:00';
  const gridEnd = localStorage.getItem('gridEnd') || '22:00';
  const gridInterval = parseInt(localStorage.getItem('gridInterval') || '60', 10);
  
  const defaultDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
  const visibleDays = JSON.parse(localStorage.getItem('visibleDays')) || defaultDays;

  const startMins = timeToMins(gridStart);
  const endMins = timeToMins(gridEnd);
  const totalMins = endMins - startMins;

  container.innerHTML = '';

  const rowCount = totalMins / gridInterval;
  container.style.setProperty('--row-count', rowCount);

  const headerDiv = document.createElement('div');
  headerDiv.className = 'scheduler-header';
  
  const ruleHeader = document.createElement('div');
  ruleHeader.className = 'time-ruler-header';
  headerDiv.appendChild(ruleHeader);

  const dayHeaders = document.createElement('div');
  dayHeaders.className = 'day-headers-wrapper';

  visibleDays.forEach(day => {
    const dh = document.createElement('div');
    dh.className = 'day-header';
    dh.textContent = day;
    
    dh.innerHTML = `
      <span>${day}</span>
      <button class="btn btn-primary btn-sm add-quick-class" data-day="${day}" style="position:absolute; right:4px; top:50%; transform:translateY(-50%); padding:2px 6px; font-size:10px; display:none;"><i class="ti ti-plus"></i></button>
    `;

    dh.addEventListener('mouseenter', () => {
      dh.querySelector('.add-quick-class').style.display = 'inline-flex';
    });
    dh.addEventListener('mouseleave', () => {
      dh.querySelector('.add-quick-class').style.display = 'none';
    });
    
    dh.querySelector('.add-quick-class').addEventListener('click', (e) => {
      e.stopPropagation();
      openAddSubjectModal(day, gridStart);
    });

    dayHeaders.appendChild(dh);
  });
  headerDiv.appendChild(dayHeaders);
  container.appendChild(headerDiv);

  const bodyDiv = document.createElement('div');
  bodyDiv.className = 'scheduler-body';

  const timeRuler = document.createElement('div');
  timeRuler.className = 'time-ruler';

  for (let mins = startMins; mins <= endMins; mins += gridInterval) {
    const marker = document.createElement('div');
    marker.className = 'time-marker';
    marker.textContent = format12Hour(mins);
    timeRuler.appendChild(marker);
  }
  bodyDiv.appendChild(timeRuler);

  const colsWrapper = document.createElement('div');
  colsWrapper.className = 'columns-wrapper';

  const filteredSubjects = getFilteredSubjects();

  visibleDays.forEach(day => {
    const col = document.createElement('div');
    col.className = 'day-column';
    col.setAttribute('data-day', day);

    const daySubjects = filteredSubjects.filter(s => s.day.toLowerCase() === day.toLowerCase());
    const positionedSubjects = calculateLayoutProperties(daySubjects);

    positionedSubjects.forEach(item => {
      const card = createEventCard(item, startMins, endMins);
      col.appendChild(card);
    });

    setupColumnDropListeners(col, startMins, endMins);
    colsWrapper.appendChild(col);
  });

  bodyDiv.appendChild(colsWrapper);
  container.appendChild(bodyDiv);
}

function createEventCard(item, gridStartMins, gridEndMins) {
  const { subject, width, left } = item;
  const card = document.createElement('div');
  
  card.className = 'event-card';
  card.setAttribute('data-id', subject.id);
  card.draggable = true;

  const startMins = timeToMins(subject.startTime);
  const endMins = timeToMins(subject.endTime);
  const duration = endMins - startMins;
  const totalGridDuration = gridEndMins - gridStartMins;

  const topPct = ((startMins - gridStartMins) / totalGridDuration) * 100;
  const heightPct = (duration / totalGridDuration) * 100;

  card.style.top = `${topPct}%`;
  card.style.height = `${heightPct}%`;
  card.style.width = `calc(${width}% - 4px)`;
  card.style.left = `calc(${left}% + 2px)`;

  card.style.backgroundColor = subject.colorBg || '#e3f2fd';
  card.style.color = subject.colorText || '#0d47a1';
  card.style.borderLeftColor = subject.colorBorder || '#90caf9';

  const isCompact = localStorage.getItem('layoutStyle') === 'dense';
  if (isCompact) {
    card.classList.add('minimal');
  }

  card.innerHTML = `
    <div class="event-title">${subject.name}</div>
    <div class="event-info"><i class="ti ti-clock"></i> ${format12Hour(startMins)}-${format12Hour(endMins)}</div>
    ${subject.room ? `<div class="event-info"><i class="ti ti-map-pin"></i> ${subject.room}</div>` : ''}
    ${subject.instructor ? `<div class="event-info"><i class="ti ti-user"></i> ${subject.instructor}</div>` : ''}
    <div class="resize-handle"></div>
  `;

  if (subject.images && subject.images.logo) {
    const logoEl = document.createElement('img');
    logoEl.src = subject.images.logo;
    logoEl.style = 'width: 14px; height: 14px; border-radius: 50%; position: absolute; right: 6px; top: 6px; object-fit: cover;';
    card.appendChild(logoEl);
  }

  card.addEventListener('click', () => {
    openEditSubjectModal(subject);
  });

  card.addEventListener('dragstart', (e) => {
    card.classList.add('dragging');
    e.dataTransfer.setData('text/plain', subject.id);
    e.dataTransfer.effectAllowed = 'move';
    
    const ghost = document.createElement('div');
    ghost.style.display = 'none';
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, 0, 0);
  });

  card.addEventListener('dragend', () => {
    card.classList.remove('dragging');
  });

  setupResizeHandleListeners(card, subject, gridStartMins, gridEndMins);

  return card;
}

function setupResizeHandleListeners(card, subject, gridStartMins, gridEndMins) {
  const resizeHandle = card.querySelector('.resize-handle');
  if (!resizeHandle) return;

  resizeHandle.addEventListener('mousedown', (e) => {
    e.stopPropagation();
    e.preventDefault();

    const column = card.parentElement;
    const colRect = column.getBoundingClientRect();
    const snapMins = parseInt(localStorage.getItem('gridInterval') || '60', 10) === 60 ? 15 : 5;
    const totalDuration = gridEndMins - gridStartMins;

    const onMouseMove = (moveEvent) => {
      const relativeY = moveEvent.clientY - colRect.top;
      const exactMins = gridStartMins + (relativeY / colRect.height) * totalDuration;
      
      let newEndMins = Math.round(exactMins / snapMins) * snapMins;
      newEndMins = Math.max(timeToMins(subject.startTime) + 5, Math.min(gridEndMins, newEndMins));

      const newEndStr = minsToTime(newEndMins);
      
      const dur = newEndMins - timeToMins(subject.startTime);
      const heightPct = (dur / totalDuration) * 100;
      card.style.height = `${heightPct}%`;
      card.querySelector('.event-info').innerHTML = `<i class="ti ti-clock"></i> ${format12Hour(timeToMins(subject.startTime))}-${format12Hour(newEndMins)}`;
      
      subject.tempNewEndTime = newEndStr;
    };

    const onMouseUp = async () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);

      if (subject.tempNewEndTime && subject.tempNewEndTime !== subject.endTime) {
        const updated = { ...subject, endTime: subject.tempNewEndTime };
        delete updated.tempNewEndTime;
        
        await saveSubject(updated);
        activeSubjects = await getSubjects(currentSemesterId);
        history.pushState(activeSubjects);
        showToast('Block resized!', 'ti-arrows-vertical');
        renderAll();
      }
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  });
}

function setupColumnDropListeners(col, gridStartMins, gridEndMins) {
  col.addEventListener('dragover', (e) => {
    e.preventDefault();
    col.classList.add('drag-over');
  });

  col.addEventListener('dragleave', () => {
    col.classList.remove('drag-over');
  });

  col.addEventListener('drop', async (e) => {
    e.preventDefault();
    col.classList.remove('drag-over');

    const subjectId = e.dataTransfer.getData('text/plain');
    const subject = activeSubjects.find(s => s.id === subjectId);
    if (!subject) return;

    const colRect = col.getBoundingClientRect();
    const relativeY = e.clientY - colRect.top;
    
    const snapMins = parseInt(localStorage.getItem('gridInterval') || '60', 10) === 60 ? 15 : 5;
    const totalDuration = gridEndMins - gridStartMins;
    const duration = timeToMins(subject.endTime) - timeToMins(subject.startTime);

    let newStartMins = gridStartMins + (relativeY / colRect.height) * totalDuration;
    newStartMins = Math.round(newStartMins / snapMins) * snapMins;
    
    newStartMins = Math.max(gridStartMins, Math.min(gridEndMins - duration, newStartMins));
    const newEndMins = newStartMins + duration;

    const newDay = col.getAttribute('data-day');
    const newStartStr = minsToTime(newStartMins);
    const newEndStr = minsToTime(newEndMins);

    if (subject.day.toLowerCase() !== newDay.toLowerCase() || subject.startTime !== newStartStr) {
      const updated = {
        ...subject,
        day: newDay,
        startTime: newStartStr,
        endTime: newEndStr
      };

      const overlaps = checkConflicts(updated, activeSubjects);
      if (overlaps.length > 0) {
        showToast(`Warning: overlaps with ${overlaps.map(o => o.name).join(', ')}`, 'ti-alert-triangle');
      }

      await saveSubject(updated);
      activeSubjects = await getSubjects(currentSemesterId);
      history.pushState(activeSubjects);
      showToast(`Moved to ${newDay} ${format12Hour(newStartMins)}`, 'ti-arrows-move');
      renderAll();
    }
  });
}

function renderSubjectsList() {
  const container = document.getElementById('subjectsTableBody');
  if (!container) return;

  const filtered = getFilteredSubjects();

  const instructors = [...new Set(activeSubjects.map(s => s.instructor).filter(Boolean))];
  const rooms = [...new Set(activeSubjects.map(s => s.room).filter(Boolean))];

  const instructorSelect = document.getElementById('filterInstructorSelect');
  if (instructorSelect) {
    const curVal = instructorSelect.value;
    instructorSelect.innerHTML = '<option value="">All Instructors</option>' + 
      instructors.map(ins => `<option value="${ins}" ${ins === curVal ? 'selected' : ''}>${ins}</option>`).join('');
  }

  const roomSelect = document.getElementById('filterRoomSelect');
  if (roomSelect) {
    const curVal = roomSelect.value;
    roomSelect.innerHTML = '<option value="">All Rooms</option>' + 
      rooms.map(rm => `<option value="${rm}" ${rm === curVal ? 'selected' : ''}>${rm}</option>`).join('');
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <tr>
        <td colspan="6" style="text-align:center; padding: 3rem; color:var(--text-muted);">
          <i class="ti ti-mood-empty" style="font-size:2.5rem; display:block; margin-bottom:0.5rem;"></i>
          No subjects found.
        </td>
      </tr>
    `;
    return;
  }

  container.innerHTML = filtered.map(s => `
    <tr style="border-bottom: 1px solid var(--border-color);">
      <td style="padding:1rem;">
        <div style="display:flex; align-items:center; gap:10px;">
          ${s.images && s.images.logo ? `<img src="${s.images.logo}" style="width:30px; height:30px; border-radius:50%; object-fit:cover;">` : `<div style="width:30px; height:30px; border-radius:50%; background-color:${s.colorBg}; border:1px solid ${s.colorBorder}; display:flex; align-items:center; justify-content:center; color:${s.colorText}; font-weight:800; font-size:12px;">${s.name.slice(0,2).toUpperCase()}</div>`}
          <div>
            <strong style="color:var(--text-main);">${s.name}</strong>
            ${s.section ? `<span style="font-size:0.75rem; color:var(--text-muted); margin-left:5px;">Sec ${s.section}</span>` : ''}
          </div>
        </div>
      </td>
      <td style="padding:1rem; color:var(--text-muted);">${s.instructor || '-'}</td>
      <td style="padding:1rem; color:var(--text-muted);">${s.room || '-'}</td>
      <td style="padding:1rem; color:var(--text-muted); text-transform:capitalize;">${s.day}</td>
      <td style="padding:1rem; color:var(--text-muted);">${format12Hour(timeToMins(s.startTime))} - ${format12Hour(timeToMins(s.endTime))}</td>
      <td style="padding:1rem; text-align:right;">
        <button class="btn btn-secondary btn-sm edit-subject-row-btn" data-id="${s.id}"><i class="ti ti-edit"></i> Edit</button>
      </td>
    </tr>
  `).join('');

  container.querySelectorAll('.edit-subject-row-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const subject = activeSubjects.find(s => s.id === id);
      if (subject) openEditSubjectModal(subject);
    });
  });
}

// ============================================================================
// 6. MAIN COORDINATOR & BOOTSTRAP
// ============================================================================

document.addEventListener('DOMContentLoaded', async () => {
  try {
    await openDB();
    await initUI();

    document.querySelectorAll('.trigger-add-subject').forEach(el => {
      el.addEventListener('click', () => {
        openAddSubjectModal();
      });
    });

    document.getElementById('quickExportBtn')?.addEventListener('click', () => {
      const pdfBtn = document.getElementById('exportPdfBtn');
      if (pdfBtn) {
        pdfBtn.click();
      } else {
        showToast('Export button not loaded.', 'ti-alert-triangle');
      }
    });

    document.getElementById('quickImportBtn')?.addEventListener('click', () => {
      document.getElementById('importJsonFile')?.click();
    });

    document.getElementById('quickDuplicateBtn')?.addEventListener('click', () => {
      showToast('Open any class card and click "Copy to Day" or "Duplicate" to clone it.', 'ti-info-circle');
    });

    console.log('Schedulia app successfully booted up in single JS script.');
  } catch (err) {
    console.error('Initialization Error:', err);
    showToast('Failed to initialize Schedulia.', 'ti-alert-triangle');
  }
});
