/**
 * custom-select.js
 * ------------------------------------------------------------------
 * Replaces the native OS-rendered <select> dropdown list with a fully
 * themed popup panel, without touching any of the app's existing logic.
 *
 * How it works:
 *  - Every <select class="form-control"> is wrapped in a `.cs-wrapper`.
 *  - The real <select> stays in the DOM (so document.getElementById(...).value,
 *    .addEventListener('change', ...), fillSelectOptions(), etc. all keep
 *    working exactly as before) but becomes invisible (opacity: 0) and
 *    non-interactive (pointer-events: none).
 *  - A `.cs-trigger` div shows the current value and a `.cs-panel` div
 *    (appended to <body>, position: fixed) renders the option list using
 *    our own CSS, instead of the browser/OS native popup.
 *  - Picking an option writes back to the real <select>.value and fires a
 *    native 'change' event, so all existing app behavior is unaffected.
 *  - A couple of observers keep the custom UI in sync even when the app
 *    sets `select.value = x` directly, rebuilds the option list
 *    (fillSelectOptions), or replaces the select node outright (the
 *    semester dropdown does this to strip old listeners).
 * ------------------------------------------------------------------
 */
(function () {
  'use strict';

  const NATIVE_VALUE = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value');

  let activeInstance = null;

  function closeActive() {
    if (activeInstance) {
      activeInstance.close();
      activeInstance = null;
    }
  }

  document.addEventListener('mousedown', (e) => {
    if (!activeInstance) return;
    if (activeInstance.wrapper.contains(e.target) || activeInstance.panel.contains(e.target)) return;
    closeActive();
  });

  document.addEventListener('keydown', (e) => {
    if (!activeInstance) return;
    if (e.key === 'Escape') {
      const trig = activeInstance.trigger;
      closeActive();
      trig.focus();
    }
  });

  window.addEventListener('resize', () => { if (activeInstance) activeInstance.reposition(); });
  window.addEventListener('scroll', () => { if (activeInstance) activeInstance.reposition(); }, true);

  const WRAPPER_PROPS = ['width', 'minWidth', 'maxWidth', 'flex', 'flexGrow', 'flexShrink', 'flexBasis',
    'margin', 'marginTop', 'marginBottom', 'marginLeft', 'marginRight'];
  const TRIGGER_PROPS = ['height', 'padding', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
    'borderRadius', 'fontWeight', 'fontSize', 'cursor', 'textAlign'];

  function labelFor(selectEl) {
    const opt = selectEl.options[selectEl.selectedIndex];
    if (!opt) return { text: '', placeholder: true };
    return { text: opt.textContent, placeholder: opt.value === '' };
  }

  function enhance(initialSelectEl) {
    if (initialSelectEl.dataset.csEnhanced) return;
    initialSelectEl.dataset.csEnhanced = '1';

    let selectEl = initialSelectEl;

    const wrapper = document.createElement('div');
    wrapper.className = 'cs-wrapper';
    WRAPPER_PROPS.forEach((p) => { if (selectEl.style[p]) wrapper.style[p] = selectEl.style[p]; });

    const trigger = document.createElement('div');
    trigger.className = 'cs-trigger';
    trigger.tabIndex = 0;
    trigger.setAttribute('role', 'combobox');
    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.setAttribute('aria-expanded', 'false');
    TRIGGER_PROPS.forEach((p) => { if (selectEl.style[p]) trigger.style[p] = selectEl.style[p]; });

    const panel = document.createElement('div');
    panel.className = 'cs-panel';
    panel.setAttribute('role', 'listbox');

    selectEl.classList.add('cs-native-select');
    selectEl.tabIndex = -1;

    selectEl.parentNode.insertBefore(wrapper, selectEl);
    wrapper.appendChild(selectEl);
    wrapper.appendChild(trigger);
    document.body.appendChild(panel);

    let highlighted = -1;

    function renderTrigger() {
      const { text, placeholder } = labelFor(selectEl);
      trigger.textContent = text || '\u00A0';
      trigger.classList.toggle('placeholder', placeholder);
      trigger.classList.toggle('disabled', selectEl.disabled);
      trigger.setAttribute('aria-disabled', String(selectEl.disabled));
    }

    function renderPanel() {
      panel.innerHTML = '';
      const opts = Array.from(selectEl.options);
      if (!opts.length) {
        const empty = document.createElement('div');
        empty.className = 'cs-panel-empty';
        empty.textContent = 'No options';
        panel.appendChild(empty);
        return;
      }
      opts.forEach((opt, i) => {
        const row = document.createElement('div');
        row.className = 'cs-option';
        row.setAttribute('role', 'option');
        row.dataset.index = String(i);
        row.textContent = opt.textContent;
        if (opt.value === '') row.classList.add('placeholder');
        if (opt.disabled) row.classList.add('disabled');
        if (i === selectEl.selectedIndex) {
          row.classList.add('selected');
          row.setAttribute('aria-selected', 'true');
        }
        row.addEventListener('mousedown', (e) => {
          e.preventDefault();
          if (opt.disabled) return;
          pick(i);
        });
        panel.appendChild(row);
      });
    }

    function pick(index) {
      const opt = selectEl.options[index];
      if (!opt || opt.disabled) return;
      NATIVE_VALUE.set.call(selectEl, opt.value);
      renderTrigger();
      selectEl.dispatchEvent(new Event('change', { bubbles: true }));
      close();
      trigger.focus();
    }

    function reposition() {
      const r = trigger.getBoundingClientRect();
      const panelHeight = panel.offsetHeight;
      const spaceBelow = window.innerHeight - r.bottom;
      panel.style.left = r.left + 'px';
      panel.style.width = r.width + 'px';
      if (spaceBelow < panelHeight + 8 && r.top > panelHeight) {
        panel.style.top = (r.top - panelHeight - 6) + 'px';
      } else {
        panel.style.top = (r.bottom + 6) + 'px';
      }
    }

    function highlight(index) {
      const rows = panel.querySelectorAll('.cs-option');
      rows.forEach((r) => r.classList.remove('highlighted'));
      const row = panel.querySelector('.cs-option[data-index="' + index + '"]');
      if (row) {
        row.classList.add('highlighted');
        row.scrollIntoView({ block: 'nearest' });
      }
      highlighted = index;
    }

    function moveHighlight(delta) {
      const opts = Array.from(selectEl.options);
      if (!opts.length) return;
      let i = highlighted;
      for (let step = 0; step < opts.length; step++) {
        i = (i + delta + opts.length) % opts.length;
        if (!opts[i].disabled) { highlight(i); return; }
      }
    }

    function open() {
      if (selectEl.disabled) return;
      closeActive();
      renderPanel();
      panel.classList.add('open');
      wrapper.classList.add('open');
      trigger.setAttribute('aria-expanded', 'true');
      reposition();
      highlight(selectEl.selectedIndex);
      activeInstance = controller;
    }

    function close() {
      panel.classList.remove('open');
      wrapper.classList.remove('open');
      trigger.setAttribute('aria-expanded', 'false');
      if (activeInstance === controller) activeInstance = null;
    }

    trigger.addEventListener('click', () => {
      if (wrapper.classList.contains('open')) close(); else open();
    });

    trigger.addEventListener('keydown', (e) => {
      const isOpen = wrapper.classList.contains('open');
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (!isOpen) open(); else moveHighlight(1);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (!isOpen) open(); else moveHighlight(-1);
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (isOpen) pick(highlighted); else open();
      } else if (e.key === 'Tab') {
        close();
      }
    });

    function bindSelect(el) {
      el.addEventListener('change', renderTrigger);

      const optionsObserver = new MutationObserver(() => {
        renderTrigger();
        if (wrapper.classList.contains('open')) renderPanel();
      });
      optionsObserver.observe(el, { childList: true });

      Object.defineProperty(el, 'value', {
        configurable: true,
        get() { return NATIVE_VALUE.get.call(el); },
        set(v) {
          NATIVE_VALUE.set.call(el, v);
          renderTrigger();
        },
      });
    }

    // Some app code clones+replaces a select node outright (to strip old
    // listeners). Detect that and rebind to the new node transparently.
    const parentObserver = new MutationObserver(() => {
      if (wrapper.contains(selectEl)) return;
      const replacement = wrapper.querySelector('select');
      if (replacement && replacement !== selectEl) {
        replacement.classList.add('cs-native-select');
        replacement.tabIndex = -1;
        selectEl = replacement;
        bindSelect(selectEl);
        renderTrigger();
        if (wrapper.classList.contains('open')) renderPanel();
      }
    });
    parentObserver.observe(wrapper, { childList: true });

    bindSelect(selectEl);
    renderTrigger();

    const controller = { wrapper, panel, trigger, open, close, reposition };
    return controller;
  }

  function init() {
    document.querySelectorAll('select.form-control').forEach(enhance);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
