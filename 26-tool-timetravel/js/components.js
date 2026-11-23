/* Chrono shared components
   <site-nav> and <site-footer> are rendered here, once, for every page.
   Edit NAV or TOOLS below and index.html and app.html change together.
   Each page only needs:  <body data-page="home|app">  <site-nav></site-nav> ... <site-footer></site-footer>  */
(function () {
  'use strict';
  var root = document.documentElement;
  root.classList.add('js');

  /* ---------- Content: the one place to edit links ---------- */
  var PAGES = { home: 'index.html', app: 'app.html' };
  var NAV = [
    { label: 'About',    section: 'about' },
    { label: 'Features', section: 'features' },
    { label: 'Process',  section: 'process' },
    { label: 'FAQ',      section: 'faq' },
    { label: 'App',      href: PAGES.app, page: 'app' }
  ];
  var TOOLS = [
    { label: 'New subject',        href: PAGES.app + '?do=newsubj',   act: 'newsubj' },
    { label: 'How it works',       href: PAGES.app + '?do=help',      act: 'help' },
    { label: 'Report',             href: PAGES.app + '?do=report',    act: 'report' },
    { label: 'Keyboard shortcuts', href: PAGES.app + '?do=shortcuts', tools: true },
    { label: 'Export data',        href: PAGES.app + '?do=export',    act: 'export' },
    { label: 'Import a file',      href: PAGES.app + '?do=import',    act: 'import' }
  ];
  /* App-page actions live in the nav itself, so there is only one bar. */
  var ACTIONS = [
    { act: 'help',    icon: 'help',     label: 'How it works' },
    { act: 'report',  icon: 'report',   label: 'Report' },
    { act: 'export',  icon: 'download', label: 'Export' },
    { act: 'import',  icon: 'upload',   label: 'Import' },
    { act: 'newsubj', icon: 'plus',     label: 'New subject' }
  ];
  var STORE_KEY = 'chrono_ptm_v1';
  var SPRITE = "<svg id=\"chrono-sprite\" width=\"0\" height=\"0\" style=\"position:absolute\" aria-hidden=\"true\" focusable=\"false\">\n <symbol id=\"i-expand\" viewBox=\"0 0 24 24\"><path d=\"M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5\"/></symbol>\n <symbol id=\"i-shrink\" viewBox=\"0 0 24 24\"><path d=\"M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5\"/></symbol>\n <symbol id=\"i-plus\" viewBox=\"0 0 24 24\"><path d=\"M12 5v14M5 12h14\"/></symbol>\n <symbol id=\"i-check\" viewBox=\"0 0 24 24\"><path d=\"M20 6 9 17l-5-5\"/></symbol>\n <symbol id=\"i-download\" viewBox=\"0 0 24 24\"><path d=\"M12 3v12m0 0-4-4m4 4 4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2\"/></symbol>\n <symbol id=\"i-upload\" viewBox=\"0 0 24 24\"><path d=\"M12 15V3m0 0L8 7m4-4 4 4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2\"/></symbol>\n <symbol id=\"i-help\" viewBox=\"0 0 24 24\"><circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7M12 17h.01\"/></symbol>\n <symbol id=\"i-trash\" viewBox=\"0 0 24 24\"><path d=\"M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3\"/></symbol>\n <symbol id=\"i-x\" viewBox=\"0 0 24 24\"><path d=\"M6 6l12 12M18 6 6 18\"/></symbol>\n <symbol id=\"i-chart\" viewBox=\"0 0 24 24\"><path d=\"M3 3v18h18\"/><path d=\"m7 15 4-4 3 3 5-6\"/></symbol>\n <symbol id=\"i-wand\" viewBox=\"0 0 24 24\"><path d=\"M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z\"/><path d=\"M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z\"/></symbol>\n <symbol id=\"i-travel\" viewBox=\"0 0 24 24\"><path d=\"M3 12a9 9 0 1 0 3-6.7L3 8\"/><path d=\"M3 3v5h5\"/><path d=\"M12 8v4l3 2\"/></symbol>\n <symbol id=\"i-calendar\" viewBox=\"0 0 24 24\"><rect x=\"3\" y=\"5\" width=\"18\" height=\"16\" rx=\"2\"/><path d=\"M3 10h18M8 3v4M16 3v4\"/></symbol>\n <symbol id=\"i-branch\" viewBox=\"0 0 24 24\"><circle cx=\"6\" cy=\"5\" r=\"2\"/><circle cx=\"6\" cy=\"19\" r=\"2\"/><circle cx=\"18\" cy=\"8\" r=\"2\"/><path d=\"M6 7v10M18 10v1a4 4 0 0 1-4 4H8\"/></symbol>\n <symbol id=\"i-bookmark\" viewBox=\"0 0 24 24\"><path d=\"M6 3h12v18l-6-4-6 4z\"/></symbol>\n <symbol id=\"i-pen\" viewBox=\"0 0 24 24\"><path d=\"M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z\"/></symbol>\n <symbol id=\"i-up\" viewBox=\"0 0 24 24\"><path d=\"M12 19V5M5 12l7-7 7 7\"/></symbol>\n <symbol id=\"i-down\" viewBox=\"0 0 24 24\"><path d=\"M12 5v14M19 12l-7 7-7-7\"/></symbol>\n <symbol id=\"i-report\" viewBox=\"0 0 24 24\"><path d=\"M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z\"/><path d=\"M14 3v5h5M9 13h6M9 17h6\"/></symbol>\n <symbol id=\"i-printer\" viewBox=\"0 0 24 24\"><path d=\"M6 9V3h12v6\"/><rect x=\"3\" y=\"9\" width=\"18\" height=\"9\" rx=\"2\"/><path d=\"M7 14h10v7H7z\"/></symbol>\n <symbol id=\"i-table\" viewBox=\"0 0 24 24\"><rect x=\"3\" y=\"4\" width=\"18\" height=\"16\" rx=\"2\"/><path d=\"M3 10h18M3 15h18M9 4v16\"/></symbol>\n<symbol id=\"i-keyboard\" viewBox=\"0 0 24 24\"><rect x=\"2\" y=\"5\" width=\"20\" height=\"14\" rx=\"2.5\"/><path d=\"M6 9.5h.01M10 9.5h.01M14 9.5h.01M18 9.5h.01M7.5 14.5h9\"/></symbol>\n <symbol id=\"i-arrow\" viewBox=\"0 0 24 24\"><path d=\"M5 12h14M13 6l6 6-6 6\"/></symbol>\n</svg>";

  /* ---------- Helpers ---------- */
  function page() { return (document.body && document.body.dataset.page) || 'home'; }
  function href(i) { return i.section ? (page() === 'home' ? '#' : PAGES.home + '#') + i.section : i.href; }
  function ic(n) { return '<svg class="ic" aria-hidden="true" focusable="false"><use href="#i-' + n + '"/></svg>'; }
  function ensureSprite() {
    if (!document.getElementById('chrono-sprite') && document.body) document.body.insertAdjacentHTML('afterbegin', SPRITE);
  }
  function savedStatus() {
    try {
      var j = JSON.parse(localStorage.getItem(STORE_KEY) || 'null'), n = j && j.subjects ? j.subjects.length : 0;
      return n + ' subject' + (n === 1 ? '' : 's') + '. Saved in this browser only.';
    } catch (e) { return 'Saved in this browser only.'; }
  }

  /* Images are optional: if one is missing, hide it and let the gradient and icon show. */
  document.addEventListener('error', function (e) {
    var t = e.target; if (t && t.tagName === 'IMG') t.hidden = true;
  }, true);

  /* Favicon drawn on a canvas, so there is no image file to ship. */
  function favicon() {
    try {
      var c = document.createElement('canvas'); c.width = c.height = 64;
      var g = c.getContext('2d');
      g.fillStyle = '#e50000'; g.beginPath(); g.arc(32, 32, 32, 0, 7); g.fill();
      g.strokeStyle = '#fff'; g.lineWidth = 5; g.lineCap = 'round'; g.lineJoin = 'round';
      g.beginPath(); g.moveTo(32, 15); g.lineTo(32, 32); g.lineTo(44, 39); g.stroke();
      var u = c.toDataURL('image/png');
      ['fav', 'fav2'].forEach(function (id) { var l = document.getElementById(id); if (l) l.href = u; });
    } catch (e) {}
  }
  favicon();

  /* ---------- <site-nav> ---------- */
  class SiteNav extends HTMLElement {
    connectedCallback() {
      if (this.dataset.ready) return;
      this.dataset.ready = '1';
      ensureSprite();
      var p = page(), always = p !== 'home';          /* the landing hero is red, so its nav starts clear */
      var links = NAV.map(function (i) {
        return '<a href="' + href(i) + '"' + (i.page && i.page === p ? ' aria-current="page"' : '') + '>' + i.label + '</a>';
      }).join('');
      var right = p === 'app'
        ? '<div class="l-actions">' + ACTIONS.map(function (a) {
            return '<button type="button" class="ibtn sm" data-act="' + a.act + '" aria-label="' + a.label + '" title="' + a.label + '">' + ic(a.icon) + '<span class="lb">' + a.label + '</span></button>';
          }).join('') + '</div>'
        : '<a class="btn l-cta" href="' + PAGES.app + '?do=newsubj" data-act="newsubj">Start a subject</a>';
      this.innerHTML =
        '<header class="l-nav' + (always ? ' solid' : '') + '" id="lnav"><div class="l-nav-in">' +
          '<a class="l-logo" href="' + PAGES.home + '" aria-label="Chrono home">Chrono</a>' +
          '<nav class="l-links" id="lnavlinks" aria-label="Main">' + links + '</nav>' +
          right +
          '<button type="button" class="l-burger" aria-label="Menu" aria-expanded="false" aria-controls="lnavlinks"><span></span><span></span><span></span></button>' +
        '</div></header>';

      var nav = this.querySelector('.l-nav'), burger = this.querySelector('.l-burger');
      function paint() { nav.classList.toggle('solid', always || window.scrollY > 40 || nav.classList.contains('open')); }
      function setOpen(o) { nav.classList.toggle('open', o); burger.setAttribute('aria-expanded', String(o)); paint(); }
      paint();
      window.addEventListener('scroll', paint, { passive: true });
      burger.addEventListener('click', function () { setOpen(!nav.classList.contains('open')); });
      nav.addEventListener('click', function (e) { if (e.target.closest('.l-links a, .l-cta')) setOpen(false); });
      document.addEventListener('click', function (e) { if (!nav.contains(e.target)) setOpen(false); });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && nav.classList.contains('open')) { setOpen(false); burger.focus(); }
      });
    }
  }

  /* ---------- <site-footer> ---------- */
  class SiteFooter extends HTMLElement {
    connectedCallback() {
      if (this.dataset.ready) return;
      this.dataset.ready = '1';
      ensureSprite();
      var inApp = page() === 'app';
      var nav = [{ label: 'Home', href: PAGES.home }].concat(NAV).map(function (i) {
        return '<li><a class="flink" href="' + href(i) + '">' + i.label + '</a></li>';
      }).join('');
      var tools = TOOLS.map(function (t) {
        return '<li><a class="flink" href="' + t.href + '"' + (t.act ? ' data-act="' + t.act + '"' : '') + (t.tools ? ' data-tools="open"' : '') + '>' + t.label + '</a></li>';
      }).join('');
      /* Restore and erase only make sense where the data lives, so they show in the app only. */
      if (inApp) {
        tools += '<li><button type="button" class="flink" id="rstb" data-act="restore" hidden>Restore last backup</button></li>' +
                 '<li><button type="button" class="flink" id="rst" data-act="reset">Erase all data</button></li>';
      }
      this.innerHTML =
        '<footer class="foot light" id="foot">' +
          '<div class="fwrap">' +
            '<div class="f-top">' +
              '<div class="f-cta">' +
                '<p class="f-lead">Want to look back, plan ahead, and see how far you have come? Start a subject and let\u2019s track it together.</p>' +
                '<div class="f-person"><span class="f-av" aria-hidden="true">C</span><span><b>Chrono</b><small>Personal Time Machine</small></span></div>' +
              '</div>' +
              '<div class="f-loop">' +
                '<h3>Keep It Safe</h3>' +
                '<p class="f-cap">Your data stays in this browser. Download a backup now and then, or load one back in.</p>' +
                '<div class="f-btns">' +
                  '<a class="f-pill" href="' + PAGES.app + '?do=export" data-act="export">Export backup <span class="go">' + ic('arrow') + '</span></a>' +
                  '<a class="f-pill" href="' + PAGES.app + '?do=import" data-act="import">Import <span class="go">' + ic('arrow') + '</span></a>' +
                '</div>' +
              '</div>' +
            '</div>' +
            '<div class="f-mid">' +
              '<div class="f-contact">' +
                '<p class="f-k">Storage:</p><p class="f-v">This browser only</p>' +
                '<p class="f-k">Status:</p><p class="f-big"><span id="save-status">' + savedStatus() + '</span></p>' +
              '</div>' +
              '<div class="f-cols">' +
                '<div><p class="f-h">Navigation</p><ul>' + nav + '</ul></div>' +
                '<div><p class="f-h">Tools</p><ul>' + tools + '</ul></div>' +
              '</div>' +
            '</div>' +
          '</div>' +
          '<hr class="f-line">' +
          '<div class="fwm"><div class="wm"><span class="wordmark" aria-hidden="true">CHRONO</span>' +
            '<div class="tile">' + ic('travel') + '<img src="bg.png" alt=""></div></div></div>' +
        '</footer>';
    }
  }

  customElements.define('site-nav', SiteNav);
  customElements.define('site-footer', SiteFooter);
})();
