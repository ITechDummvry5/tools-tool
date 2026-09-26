/* ===================== CONFIG ===================== */

const API_CONFIG = {
  deepseek: { name: 'DeepSeek', baseURL: 'https://api.deepseek.com/v1', chat: '/chat/completions', models: '/models' },
  ollama:  { name: 'Ollama Cloud', baseURL: 'https://api.x.ai/v1', chat: '/chat/completions', models: '/models' },
  grok:    { name: 'Grok', baseURL: 'https://api.x.ai/v1', chat: '/chat/completions', models: '/models' },
  openai:  { name: 'OpenAI', baseURL: 'https://api.openai.com/v1', chat: '/chat/completions', models: '/models' }
};

const PROVIDERS = Object.keys(API_CONFIG);

const MODEL_MAP = {
  deepseek: 'deepseek-chat',
  ollama: 'ollama-beta',
  grok: 'grok-beta',
  openai: 'gpt-4.1-mini'
};

const LOCAL_OLLAMA = {
  baseURL: 'http://localhost:11434/api/chat',
  model: 'llama3:latest'
};

/* ===================== DOM CACHE ===================== */

const DOM = {
  globalStatus: document.getElementById('globalStatus'),
  statusText: document.getElementById('statusText'),
  searchInput: document.getElementById('searchInput'),
  aiProvider: document.getElementById('aiProvider'),
  resultsArea: document.getElementById('resultsArea'),
  loading: document.getElementById('loading'),
  resultsSection: document.getElementById('resultsSection'),
  searchSection: document.getElementById('searchSection'),
  keyInputs: {}
};

PROVIDERS.forEach(p => {
  DOM.keyInputs[p] = document.getElementById(p + 'Key');
});

/* ===================== HELPERS ===================== */

const hasInternet = () => navigator.onLine;

const escapeHTML = str =>
  String(str || '').replace(/[&<>"']/g, m => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'
  }[m]));

/* fetch with timeout + optional abort signal */
async function fetchWithTimeout(url, options = {}, timeout = 15000, signal) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const res = await fetch(url, {
      ...options,
      signal: signal || controller.signal
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  } finally {
    clearTimeout(id);
  }
}

/* ===================== STATUS UI ===================== */

const STATUS_MAP = {
  connected: ['status-dot connected', 'Connected ✓', '#FFD700'],
  saved: ['status-dot', 'Configured', '#ffa500'],
  error: ['status-dot', 'Failed', '#ff4444'],
  default: ['status-dot', 'Not configured', '#ccc']
};

function updateApiStatus(provider, status, message = '') {
  const dot = document.getElementById(provider + 'Status');
  const text = document.getElementById(provider + 'StatusText');
  if (!dot || !text) return;

  const [cls, label, color] = STATUS_MAP[status] || STATUS_MAP.default;
  dot.className = cls;
  text.textContent = message || label;
  text.style.color = color;
}

/* ===================== API CHECK ===================== */

async function testApiConnection(provider) {
  const key = DOM.keyInputs[provider].value.trim();
  const cfg = API_CONFIG[provider];

  if (!key) {
    updateApiStatus(provider, 'error', 'No key');
    return false;
  }

  if (!hasInternet()) {
    updateApiStatus(provider, 'error', 'Offline');
    return false;
  }

  try {
    await fetchWithTimeout(cfg.baseURL + cfg.models, {
      headers: { Authorization: `Bearer ${key}` }
    });
    updateApiStatus(provider, 'connected');
    return true;
  } catch {
    updateApiStatus(provider, 'error', 'Invalid key');
    return false;
  }
}

/* ===================== QUERY ===================== */

async function queryCloud(provider, query, key, signal) {
  const cfg = API_CONFIG[provider];

  const data = await fetchWithTimeout(
    cfg.baseURL + cfg.chat,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: MODEL_MAP[provider],
        messages: [{ role: 'user', content: query }],
        max_tokens: 1000,
        temperature: 0.7
      })
    },
    15000,
    signal
  );

  return data.choices?.[0]?.message?.content || 'No response';
}

async function queryLocal(query, signal) {
  const data = await fetchWithTimeout(
    LOCAL_OLLAMA.baseURL,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: LOCAL_OLLAMA.model,
        messages: [{ role: 'user', content: query }],
        stream: false
      })
    },
    15000,
    signal
  );

  return data.message?.content || 'No response';
}

/* ===================== SEARCH ===================== */

let searchController = null;

function renderResult(name, text) {
  return `
    <div class="response-card">
      <div class="provider-badge">${name}</div>
      <div class="response-content">${escapeHTML(text)}</div>
    </div>`;
}

async function performSearch() {
  const query = DOM.searchInput.value.trim();
  if (!query) return alert('Enter search query');

  if (searchController) searchController.abort();
  searchController = new AbortController();

  DOM.loading.classList.add('active');
  DOM.resultsSection.classList.remove('active');
  DOM.resultsArea.innerHTML = '';

  try {
    const provider = DOM.aiProvider.value;

    if (provider === 'llama-local') {
      const text = await queryLocal(query, searchController.signal);
      DOM.resultsArea.innerHTML = renderResult('🦙 LLaMA Local', text);
    } else {
      if (!hasInternet()) throw new Error('No internet connection');

      const providers = provider === 'compare' ? PROVIDERS : [provider];

      const tasks = providers.map(p => {
        const key = DOM.keyInputs[p].value.trim();
        if (!key) return Promise.reject(new Error(`${API_CONFIG[p].name} not configured`));
        return queryCloud(p, query, key, searchController.signal)
          .then(text => ({ p, text }));
      });

      const results = await Promise.allSettled(tasks);

      DOM.resultsArea.innerHTML = results.map(r =>
        r.status === 'fulfilled'
          ? renderResult(API_CONFIG[r.value.p].name, r.value.text)
          : `<div class="error">${escapeHTML(r.reason.message)}</div>`
      ).join('');
    }
  } catch (err) {
    if (err.name !== 'AbortError') {
      DOM.resultsArea.innerHTML = `<div class="error">${escapeHTML(err.message)}</div>`;
    }
  }

  DOM.loading.classList.remove('active');
  DOM.resultsSection.classList.add('active');
}

/* ===================== STORAGE ===================== */

function loadApiKeys() {
  PROVIDERS.forEach(p => {
    const key = localStorage.getItem(p + '_api_key');
    if (key) {
      DOM.keyInputs[p].value = key;
      updateApiStatus(p, 'saved');
    }
  });
}

document.getElementById('saveConfigBtn').onclick = () => {
  PROVIDERS.forEach(p => {
    const key = DOM.keyInputs[p].value.trim();
    if (key) {
      localStorage.setItem(p + '_api_key', key);
      updateApiStatus(p, 'saved');
    }
  });
  alert('API keys saved');
};

/* ===================== BUTTONS ===================== */

document.getElementById('testApisBtn').onclick = async () => {
  const results = await Promise.all(PROVIDERS.map(testApiConnection));
  const ok = results.filter(Boolean).length;

  DOM.searchSection.classList.toggle('active', ok > 0);
  DOM.globalStatus.classList.toggle('connected', ok > 0);
  DOM.statusText.textContent = ok
    ? `APP: ${ok}/${PROVIDERS.length} APIs connected`
    : 'APP: No APIs connected';
};

document.getElementById('llamaLocalBtn').onclick = () => {
  DOM.searchSection.classList.add('active');
  DOM.aiProvider.value = 'llama-local';
  DOM.globalStatus.classList.add('connected');
  DOM.statusText.textContent = 'APP: Using LLaMA Local (Offline)';
};

document.getElementById('searchBtn').onclick = performSearch;

/* ===================== ONLINE / OFFLINE ===================== */

window.addEventListener('online', () => {
  DOM.statusText.textContent = 'Connected';
  DOM.globalStatus.classList.add('connected');
});

window.addEventListener('offline', () => {
  DOM.statusText.textContent = 'No Internet';
  DOM.globalStatus.classList.remove('connected');
});

/* ===================== INIT ===================== */

loadApiKeys();
