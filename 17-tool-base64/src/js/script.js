
(() => {
  const $ = id => document.getElementById(id);
  const input = $('input'), output = $('output'), statusEl = $('status'), statsEl = $('stats');
  const urlSafe = $('urlSafe');
  let mode = 'encode';

  const enc = text => {
    const bytes = new TextEncoder().encode(text);
    let bin = '';
    bytes.forEach(b => bin += String.fromCharCode(b));
    return btoa(bin);
  };
  const dec = b64 => {
    const bin = atob(b64);
    const bytes = Uint8Array.from(bin, c => c.charCodeAt(0));
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  };
  const toUrlSafe = s => s.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const fromUrlSafe = s => {
    s = s.replace(/-/g, '+').replace(/_/g, '/').replace(/\s+/g, '');
    return s + '='.repeat((4 - (s.length % 4)) % 4);
  };

  function setStatus(msg, err) {
    statusEl.textContent = msg;
    statusEl.classList.toggle('err', !!err);
  }

  function run() {
    const v = input.value;
    if (!v) { output.value = ''; setStatus('Ready'); return stats(); }
    try {
      if (mode === 'encode') {
        const r = enc(v);
        output.value = urlSafe.checked ? toUrlSafe(r) : r;
      } else {
        output.value = dec(fromUrlSafe(v.trim()));
      }
      setStatus(mode === 'encode' ? 'Encoded' : 'Decoded');
    } catch {
      output.value = '';
      setStatus('Not valid Base64. Check for missing or extra characters.', true);
    }
    stats();
  }

  function stats() {
    statsEl.textContent = `${input.value.length} chars in · ${output.value.length} chars out`;
  }

  function setMode(m) {
    mode = m;
    const e = m === 'encode';
    $('modeEnc').classList.toggle('on', e);
    $('modeDec').classList.toggle('on', !e);
    $('modeEnc').setAttribute('aria-selected', e);
    $('modeDec').setAttribute('aria-selected', !e);
    $('inLabel').textContent = e ? 'Text' : 'Base64';
    $('outLabel').textContent = e ? 'Base64' : 'Text';
    input.placeholder = e ? 'Type or paste text here' : 'Paste Base64 here';
    run();
  }

  $('modeEnc').onclick = () => setMode('encode');
  $('modeDec').onclick = () => setMode('decode');
  urlSafe.onchange = run;
  input.oninput = run;

  $('clear').onclick = () => { input.value = ''; run(); input.focus(); };
  $('sample').onclick = () => {
    input.value = mode === 'encode' ? 'Hello, Base64! こんにちは 🌸' : 'SGVsbG8sIEJhc2U2NCE=';
    run();
  };
  $('swap').onclick = () => {
    if (!output.value) return;
    input.value = output.value;
    setMode(mode === 'encode' ? 'decode' : 'encode');
  };
  $('copy').onclick = async () => {
    if (!output.value) return setStatus('Nothing to copy', true);
    try {
      await navigator.clipboard.writeText(output.value);
    } catch {
      output.select(); document.execCommand('copy');
    }
    setStatus('Copied to clipboard');
  };
})();
