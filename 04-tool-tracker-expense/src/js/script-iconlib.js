// ── YOUR ICON LIBRARY ──
// Add new filenames here whenever you add a new PNG to your icons/ folder
const icons = [
  { file:'rice.png',      label:'Rice',              cat:'food'     },
  { file:'kape.png',      label:'Kape',              cat:'food'     },
  { file:'agahan.png',    label:'Agahan',            cat:'food'     },
  { file:'miryenda.png',  label:'Meryenda',          cat:'food'     },
  { file:'ulam.png',      label:'Ulam',              cat:'food'     },
  { file:'baon.png',      label:'Baon',              cat:'food'     },
  { file:'egg.png',       label:'Egg',               cat:'food'     },
  { file:'delata.png',    label:'Delata',            cat:'food'     },
  { file:'fastfooddelivery.png', label:'Delivery',   cat:'food'     },
  { file:'groceries.png', label:'Groceries',         cat:'food'     },
  { file:'tubig.png',     label:'Tubig',             cat:'home'     },
  { file:'gas.png',       label:'Gas',               cat:'home'     },
  { file:'bills.png',     label:'Bills',             cat:'bills'    },
  { file:'lazada.png',    label:'Lazada',            cat:'bills'    },
  { file:'shopee.png',    label:'Shopee',            cat:'bills'    },
  { file:'gamot.png',     label:'Gamot',             cat:'personal' },
  { file:'school.png',    label:'School',            cat:'other'    },
  { file:'edit.png',      label:'Edit',              cat:'other'    },
  { file:'default.png',   label:'Default',           cat:'other'    },
];

const catColor = {
  food:    '#ff6b9d',
  home:    '#30d158',
  personal:'#bf5af2',
  bills:   '#ff9500',
  other:   '#888',
};

let filtered = [...icons];

function render(list){
  const grid = document.getElementById('bentoGrid');
  const empty = document.getElementById('emptyMsg');
  document.getElementById('iconCount').textContent = icons.length;

  if(!list.length){
    grid.innerHTML='';
    empty.style.display='block';
    return;
  }
  empty.style.display='none';

  grid.innerHTML = list.map((ic, i) => `
    <div class="bento-card" onclick="copyFilename('${ic.file}', this)"
         style="animation-delay:${i*0.03}s" data-file="${ic.file}" data-label="${ic.label.toLowerCase()}">
      <div class="cat-badge" style="background:${catColor[ic.cat]||'#888'}"></div>
      <div class="copy-flash">Copied!</div>
      <div class="bento-img-wrap">
        <img src="icons/${ic.file}" alt="${ic.label}"
          onerror="this.style.display='none';this.parentElement.innerHTML='<span class=fallback-emoji>📦</span>'"
        />
      </div>
      <div class="bento-name">${ic.label}</div>
      <div class="bento-filename">${ic.file}</div>
    </div>
  `).join('');
}

function filterIcons(val){
  const q = val.trim().toLowerCase();
  filtered = q ? icons.filter(ic =>
    ic.file.toLowerCase().includes(q) ||
    ic.label.toLowerCase().includes(q) ||
    ic.cat.toLowerCase().includes(q)
  ) : [...icons];
  render(filtered);
}

function copyFilename(filename, card){
  navigator.clipboard.writeText(filename).catch(()=>{
    // fallback for browsers without clipboard API
    const ta = document.createElement('textarea');
    ta.value = filename;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  });
  card.classList.add('copied');
  setTimeout(()=>card.classList.remove('copied'), 1400);
}

// boot
render(icons);
