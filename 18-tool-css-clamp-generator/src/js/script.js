
(() => {
  const $ = id => document.getElementById(id);
  const f = { prop:$('prop'), minS:$('minS'), maxS:$('maxS'), minV:$('minV'), maxV:$('maxV'), root:$('root') };
  const code = $('code'), sample = $('sample'), vw = $('vw'), graph = $('graph');
  let unit = 'rem', last = '';

  const r = n => +n.toFixed(4);
  const num = el => parseFloat(el.value);

  function calc() {
    const minS = num(f.minS), maxS = num(f.maxS), minV = num(f.minV), maxV = num(f.maxV), root = num(f.root);
    if ([minS, maxS, minV, maxV, root].some(isNaN)) throw new Error('Fill in every field with a number.');
    if (maxV <= minV) throw new Error('Max screen must be larger than min screen.');
    const slope = (maxS - minS) / (maxV - minV);
    const inter = minS - slope * minV;
    return { minS, maxS, minV, maxV, root, slope, inter };
  }

  function build(c) {
    const lo = Math.min(c.minS, c.maxS), hi = Math.max(c.minS, c.maxS);
    if (unit === 'rem') {
      const a = r(c.inter / c.root), b = r(c.slope * 100);
      const pref = `${a}rem ${b < 0 ? '-' : '+'} ${Math.abs(b)}vw`;
      return `clamp(${r(lo / c.root)}rem, ${pref}, ${r(hi / c.root)}rem)`;
    }
    const a = r(c.inter), b = r(c.slope * 100);
    return `clamp(${r(lo)}px, ${a}px ${b < 0 ? '-' : '+'} ${Math.abs(b)}vw, ${r(hi)}px)`;
  }

  const at = (c, w) => {
    const lo = Math.min(c.minS, c.maxS), hi = Math.max(c.minS, c.maxS);
    return Math.min(hi, Math.max(lo, c.inter + c.slope * w));
  };

  function drawGraph(c) {
    const W = 400, H = 70, xMax = 1920;
    const lo = Math.min(c.minS, c.maxS), hi = Math.max(c.minS, c.maxS), span = hi - lo || 1;
    const pts = [];
    for (let w = 0; w <= xMax; w += 40) {
      const y = H - 10 - ((at(c, w) - lo) / span) * (H - 20);
      pts.push(`${(w / xMax * W).toFixed(1)},${y.toFixed(1)}`);
    }
    const cx = vw.value / xMax * W, cy = H - 10 - ((at(c, +vw.value) - lo) / span) * (H - 20);
    graph.innerHTML =
      `<defs><linearGradient id="lg" x1="0" x2="1"><stop offset="0" stop-color="#b9a6ff"/><stop offset=".4" stop-color="#8ecbff"/><stop offset=".75" stop-color="#ffa8c8"/><stop offset="1" stop-color="#ffd58a"/></linearGradient></defs>` +
      `<polyline points="${pts.join(' ')}" fill="none" stroke="url(#lg)" stroke-width="3" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>` +
      `<line x1="${cx}" x2="${cx}" y1="0" y2="${H}" stroke="#6b58ee" stroke-opacity=".35" vector-effect="non-scaling-stroke"/>` +
      `<circle cx="${cx}" cy="${cy}" r="4" fill="#6b58ee"/>`;
  }

  function update() {
    try {
      const c = calc();
      last = build(c);
      code.textContent = `${f.prop.value}: ${last};`;
      const v = at(c, +vw.value);
      sample.style.fontSize = Math.max(8, Math.min(v, 120)) + 'px';
      $('readout').textContent = `${vw.value}px screen → ${r(v)}px`;
      $('formula').textContent = `slope ${r(c.slope * 100)}vw · intercept ${r(c.inter)}px`;
      drawGraph(c);
      setStatus('Ready');
    } catch (e) {
      last = '';
      code.textContent = '—';
      setStatus(e.message, true);
    }
  }

  function setStatus(m, err) {
    $('status').textContent = m;
    $('status').classList.toggle('err', !!err);
  }

  function setUnit(u) {
    unit = u;
    $('uRem').classList.toggle('on', u === 'rem');
    $('uPx').classList.toggle('on', u === 'px');
    $('uRem').setAttribute('aria-selected', u === 'rem');
    $('uPx').setAttribute('aria-selected', u === 'px');
    update();
  }

  Object.values(f).forEach(el => el.addEventListener('input', update));
  vw.addEventListener('input', update);
  $('uRem').onclick = () => setUnit('rem');
  $('uPx').onclick = () => setUnit('px');
  $('copy').onclick = async () => {
    if (!last) return setStatus('Nothing to copy', true);
    const text = code.textContent;
    try { await navigator.clipboard.writeText(text); }
    catch { const t = document.createElement('textarea'); t.value = text; document.body.appendChild(t); t.select(); document.execCommand('copy'); t.remove(); }
    setStatus('Copied to clipboard');
  };
  update();
})();
