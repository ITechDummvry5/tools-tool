 // ── state ──
  let color   = '#4a9eff';
  let color2  = '#0a0f1e';
  let name    = 'Glacier Blue';
  let blend   = 'color';
  let opacity = 0.28;
  let applyTo = 'image';
  let effectType = 'solid';
  let imgSrc  = '/images/man.png';

  const tint    = document.getElementById('hpTint');
  const heroImg = document.getElementById('heroImg');
  const cardImg = document.getElementById('cardImg');
  const preview = document.getElementById('heroPreview');
  const root    = document.documentElement;

  // ── palette ──
  const palette = [
    {h:'#4a9eff',n:'Glacier Blue'},{h:'#6ab4ff',n:'Arctic Sky'},
    {h:'#ff4466',n:'Ember Red'},{h:'#ff8c42',n:'Flame'},
    {h:'#ffd700',n:'Solar Gold'},{h:'#00e5a0',n:'Teal Strike'},
    {h:'#a78bfa',n:'Deep Violet'},{h:'#f472b6',n:'Neon Rose'},
    {h:'#e2e8f0',n:'Snow White'},{h:'#1a2a50',n:'Midnight'},
  ];

  const swGrid = document.getElementById('swGrid');
  palette.forEach((c,i) => {
    const d = document.createElement('div');
    d.className = 'sw' + (i===0?' active':'');
    d.style.background = c.h;
    d.title = c.n;
    d.addEventListener('click', () => pickColor(c.h, c.n, d));
    swGrid.appendChild(d);
  });

  function pickColor(h, n, el) {
    color = h; name = n || h.toUpperCase();
    applyAll();
    document.querySelectorAll('.sw').forEach(s => s.classList.remove('active'));
    if (el) el.classList.add('active');
    document.getElementById('cpInput').value = h;
    document.getElementById('cpFill').style.background = h;
    document.getElementById('cpHex').textContent = h.toUpperCase();
    updateInfo();
  }

  function applyAll() {
    root.style.setProperty('--tint-color', color);
    root.style.setProperty('--tint-opacity', opacity);
    root.style.setProperty('--tint-blend', blend);
    root.style.setProperty('--apply-target', applyTo);

    // Gradient mode: force container, use two colors, hide image tint
    if (effectType === 'gradient') {
      tint.style.opacity = '0';
      preview.style.background = `linear-gradient(135deg, ${color} 0%, ${color2} 100%)`;
      preview.style.opacity = opacity + 0.5;
      preview.style.mixBlendMode = blend;
      preview.classList.add('container');
    } 
    // Solid mode: respect applyTo setting
    else if (effectType === 'solid') {
      if (applyTo === 'image') {
        tint.style.background = color;
        tint.style.opacity = opacity;
        tint.style.mixBlendMode = blend;
        preview.style.background = '';
        preview.style.opacity = '';
        preview.style.mixBlendMode = '';
        preview.classList.remove('container', 'section');
      } else if (applyTo === 'container') {
        tint.style.opacity = '0';
        preview.style.background = color;
        preview.style.opacity = opacity;
        preview.style.mixBlendMode = blend;
        preview.classList.remove('section');
        preview.classList.add('container');
      } else if (applyTo === 'section') {
        tint.style.opacity = '0';
        preview.style.background = color;
        preview.style.opacity = '1';
        preview.style.mixBlendMode = blend;
        preview.classList.remove('container');
        preview.classList.add('section');
      }
    }
  }

  function updateInfo() {
    document.getElementById('cdSwatch').style.background = color;
    document.getElementById('cdName').textContent  = name;
    document.getElementById('cdHex').textContent   = color.toUpperCase();
    document.getElementById('dEffect').textContent = effectType.charAt(0).toUpperCase()+effectType.slice(1);
    document.getElementById('dBlend').textContent  = blend.charAt(0).toUpperCase()+blend.slice(1);
    document.getElementById('dIntensity').textContent = Math.round(opacity*100)+'%';
    document.getElementById('dApplyTo').textContent = applyTo.charAt(0).toUpperCase()+applyTo.slice(1);
  }

  // custom picker
  const cpInput = document.getElementById('cpInput');
  const cpFill  = document.getElementById('cpFill');
  cpFill.style.background = cpInput.value;
  cpInput.addEventListener('input', () => {
    document.querySelectorAll('.sw').forEach(s=>s.classList.remove('active'));
    pickColor(cpInput.value, cpInput.value.toUpperCase(), null);
  });

  // second color picker (gradient mode)
  const cpInput2 = document.getElementById('cpInput2');
  const cpFill2  = document.getElementById('cpFill2');
  const color2Row = document.getElementById('color2Row');
  cpFill2.style.background = cpInput2.value;
  cpInput2.addEventListener('input', () => {
    color2 = cpInput2.value;
    document.getElementById('cpHex2').textContent = cpInput2.value.toUpperCase();
    cpFill2.style.background = color2;
    applyAll();
  });

  // opacity slider
  const opSlider = document.getElementById('opSlider');
  opSlider.addEventListener('input', () => {
    const p = parseInt(opSlider.value);
    opacity = p/100;
    opSlider.style.setProperty('--pct', p);
    document.getElementById('opVal').textContent = p+'%';
    document.getElementById('dIntensity').textContent = p+'%';
    applyAll();
  });

  // blend
  document.getElementById('blendGrid').addEventListener('click', e => {
    const b = e.target.closest('.bln'); if (!b) return;
    document.querySelectorAll('.bln').forEach(x=>x.classList.remove('active'));
    b.classList.add('active');
    blend = b.dataset.b;
    document.getElementById('dBlend').textContent = b.textContent;
    applyAll();
  });

  // apply to
  document.getElementById('applyGrid').addEventListener('click', e => {
    const a = e.target.closest('.apply-btn'); if (!a) return;
    document.querySelectorAll('.apply-btn').forEach(x=>x.classList.remove('active'));
    a.classList.add('active');
    applyTo = a.dataset.t;
    document.getElementById('dApplyTo').textContent = a.textContent;
    applyAll();
  });

  // effect type - show/hide second color picker
  const effectBtns = document.querySelectorAll('.effect-btn');
  effectBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      effectBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      effectType = btn.dataset.e;
      
      // Show second color picker only in gradient mode
      if (effectType === 'gradient') {
        color2Row.style.display = 'flex';
      } else {
        color2Row.style.display = 'none';
      }
      
      updateInfo();
      applyAll();
    });
  });

  // ── IMAGE UPLOAD ──
  const fileIn   = document.getElementById('fileIn');
  const upZone   = document.getElementById('upZone');
  const thumbWrap = document.getElementById('thumbWrap');
  const thumbImg  = document.getElementById('thumbImg');

  fileIn.addEventListener('change', e => { if(e.target.files[0]) loadImg(e.target.files[0]); });

  upZone.addEventListener('dragover', e => { e.preventDefault(); upZone.classList.add('over'); });
  upZone.addEventListener('dragleave', () => upZone.classList.remove('over'));
  upZone.addEventListener('drop', e => {
    e.preventDefault(); upZone.classList.remove('over');
    const f = e.dataTransfer.files[0];
    if (f && f.type.startsWith('image/')) loadImg(f);
  });

  function loadImg(file) {
    const url = URL.createObjectURL(file);
    imgSrc = url;
    heroImg.src = url;
    heroImg.style.opacity = '1';
    cardImg.src = url;
    cardImg.style.opacity = '1';
    thumbImg.src = url;
    thumbWrap.style.display = 'block';
    const short = file.name.length > 14 ? file.name.slice(0,12)+'…' : file.name;
    document.getElementById('dImg').textContent = short;
  }

  document.getElementById('thumbRm').addEventListener('click', () => {
    heroImg.src = '/images/man.png';
    heroImg.style.opacity = '1';
    cardImg.src = '/images/man.png';
    thumbImg.src = '';
    thumbWrap.style.display = 'none';
    fileIn.value = '';
    imgSrc = '/images/man.png';
    document.getElementById('dImg').textContent = 'Default';
  });

  // ── RESET ──
  function resetAll() {
    pickColor('#4a9eff','Glacier Blue', swGrid.children[0]);
    opSlider.value = 28; opSlider.style.setProperty('--pct',28);
    opacity = 0.28;
    document.getElementById('opVal').textContent = '28%';
    blend = 'color';
    applyTo = 'image';
    effectType = 'solid';
    color2 = '#0a0f1e';
    cpInput2.value = color2;
    cpFill2.style.background = color2;
    document.getElementById('cpHex2').textContent = color2.toUpperCase();
    color2Row.style.display = 'none';
    document.querySelectorAll('.bln').forEach(b=>b.classList.remove('active'));
    document.querySelector('[data-b="color"]').classList.add('active');
    document.querySelectorAll('.apply-btn').forEach(b=>b.classList.remove('active'));
    document.querySelector('[data-t="image"]').classList.add('active');
    document.querySelectorAll('.effect-btn').forEach(b=>b.classList.remove('active'));
    document.querySelector('[data-e="solid"]').classList.add('active');
    applyAll(); updateInfo();
  }

  // ── COPY CSS ──
  function copyCSS() {
    let css = `/* VYRE – Gear Tint */\n--tint-color: ${color};\n--tint-opacity: ${opacity};\nmix-blend-mode: ${blend};\n--effect-type: ${effectType};`;
    
    if (effectType === 'gradient') {
      css += `\n\n/* Gradient Background */\nbackground: linear-gradient(135deg, ${color} 0%, ${color2} 100%);\nopacity: ${(opacity + 0.5).toFixed(2)};`;
    }
    
    navigator.clipboard.writeText(css).then(() => {
      const btn = document.getElementById('expBtn');
      const orig = btn.innerHTML;
      btn.innerHTML = '✓ Copied!'; btn.style.color='#00e5a0';
      setTimeout(()=>{ btn.innerHTML=orig; btn.style.color=''; }, 1800);
    });
  }

  // init
  applyAll(); updateInfo();
  cpFill.style.background = cpInput.value;
