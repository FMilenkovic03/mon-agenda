const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const DAYS_SHORT = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];
const today = new Date();

let currentYear = today.getFullYear();
let currentMonth = today.getMonth();
let selectedDay = today.getDate();
let selectedType = 'task';
let selectedColor = '';
let selectedEmoji = '';
let selectedMode = 'once'; // 'once' | 'multiday' | 'repeat'
let editingId = null;
let events = [];
let categories = [];
let editingCatId = null;
let strictMonth = false;
let currentTheme = 'mocha';
let currentView = 'month';
let refDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
let searchQuery = '';
let emojiTarget = 'event';
let selectedCatEmoji = '';
let activeFilter = null;

const EMOJI_CATS = [
  { label:'⭐', name:'Favoris', emojis:['⭐','🔥','💡','✅','❗','❓','📌','🎯','🏆','💎','🚀','💫','⚡','🌟','✨','🎉'] },
  { label:'😊', name:'Visages', emojis:['😊','😄','😎','🤔','😴','🥳','😤','🤩','😍','🥰','😂','😢','😡','🤗','😇','🙏'] },
  { label:'💼', name:'Travail', emojis:['💼','📊','📈','📉','💹','🖥️','📝','📋','📁','📂','✉️','📞','🖨️','⌨️','🖱️','📎'] },
  { label:'🏠', name:'Maison', emojis:['🏠','🛋️','🛏️','🚿','🍳','🧹','🪴','🔑','🪟','🚪','💡','🧺','🛒','🪣','🔧','🧰'] },
  { label:'🏃', name:'Sport', emojis:['🏃','🚴','⚽','🏀','🎾','🏊','🧘','🏋️','🤸','⛷️','🎿','🏄','🤾','🥊','🎱','🏓'] },
  { label:'🍕', name:'Nourriture', emojis:['🍕','🍔','🍣','🍜','🥗','🍰','☕','🍺','🥂','🍷','🧃','🍱','🥘','🍝','🫕','🧁'] },
  { label:'✈️', name:'Voyage', emojis:['✈️','🚂','🚗','🛳️','🏖️','🏔️','🗺️','🧳','🏨','⛺','🎡','🗼','🗽','🎠','🌍','🌴'] },
  { label:'🎵', name:'Loisirs', emojis:['🎵','🎸','🎮','🎬','📚','🎨','📷','🎭','🎲','🧩','🎰','🃏','🎤','🎧','🎹','🎺'] },
  { label:'💊', name:'Santé', emojis:['💊','🏥','🩺','💉','🩹','🧬','🫀','🧠','👁️','🦷','🩻','🧪','🔬','🩼','🦽','💪'] },
  { label:'👨‍👩‍👧', name:'Famille', emojis:['👨‍👩‍👧','👶','🧒','👦','👧','👩','👨','👴','👵','💑','👫','🐶','🐱','🐠','🌹','💐'] },
];

// ── INIT ──────────────────────────────────────
async function init() {
  const data = await window.agenda.loadEvents();
  if (Array.isArray(data)) {
    events = data; categories = []; strictMonth = false;
  } else {
    events = data.events || [];
    categories = data.categories || [];
    strictMonth = data.strictMonth || false;
    currentTheme = data.theme || 'mocha';
  }
  bindEvents();
  applyTheme(currentTheme);
  buildEmojiPicker();
  renderCategoryList();
  updateToggle();
  populateCategorySelect();
  render();
}

async function saveAll() {
  await window.agenda.saveEvents({ events, categories, strictMonth, theme: currentTheme });
}

// ── THEME ─────────────────────────────────────
function applyTheme(theme) {
  currentTheme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  document.querySelectorAll('.theme-swatch').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.theme === theme);
  });
}

// ── EMOJI PICKER ──────────────────────────────
function buildEmojiPicker() {
  const tabs = document.getElementById('emojiTabs');
  tabs.innerHTML = '';
  EMOJI_CATS.forEach((cat, i) => {
    const tab = document.createElement('button');
    tab.className = 'emoji-tab' + (i === 0 ? ' active' : '');
    tab.textContent = cat.label; tab.title = cat.name;
    tab.addEventListener('click', () => {
      tabs.querySelectorAll('.emoji-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      renderEmojiGrid(cat.emojis);
    });
    tabs.appendChild(tab);
  });
  renderEmojiGrid(EMOJI_CATS[0].emojis);
}

function renderEmojiGrid(emojis) {
  const grid = document.getElementById('emojiGrid');
  grid.innerHTML = '';
  emojis.forEach(em => {
    const btn = document.createElement('button');
    btn.className = 'emoji-btn'; btn.textContent = em;
    btn.addEventListener('click', () => pickEmoji(em));
    grid.appendChild(btn);
  });
}

function pickEmoji(em) {
  if (emojiTarget === 'event') {
    selectedEmoji = em;
    document.getElementById('emojiPreview').textContent = em;
    document.getElementById('emojiTrigger').classList.add('has-emoji');
    document.getElementById('emojiClear').classList.add('visible');
  } else {
    selectedCatEmoji = em;
    document.getElementById('catEmojiPreview').textContent = em;
    document.getElementById('catEmojiTrigger').classList.add('has-emoji');
    document.getElementById('catEmojiClear').classList.add('visible');
  }
  closeEmojiPicker();
}

function openEmojiPicker(trigger, target) {
  emojiTarget = target;
  const picker = document.getElementById('emojiPicker');
  picker.classList.add('open');
  const rect = trigger.getBoundingClientRect();
  const pickerH = 280;
  const top = rect.bottom + 6 + pickerH > window.innerHeight ? rect.top - pickerH - 6 : rect.bottom + 6;
  picker.style.top = top + 'px';
  picker.style.left = Math.min(rect.left, window.innerWidth - 290) + 'px';
}

function closeEmojiPicker() {
  document.getElementById('emojiPicker').classList.remove('open');
}

// ── BIND EVENTS ───────────────────────────────
function bindEvents() {
  document.getElementById('btnPrev').addEventListener('click', navigatePrev);
  document.getElementById('btnNext').addEventListener('click', navigateNext);
  document.getElementById('btnMiniPrev').addEventListener('click', navigatePrev);
  document.getElementById('btnMiniNext').addEventListener('click', navigateNext);

  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.addEventListener('click', () => setView(btn.dataset.view));
  });

  document.getElementById('btnNew').addEventListener('click', () => openModal());
  document.getElementById('btnModalClose').addEventListener('click', closeModal);
  document.getElementById('btnCancel').addEventListener('click', closeModal);
  document.getElementById('btnSave').addEventListener('click', saveEvent);
  document.getElementById('btnDelete').addEventListener('click', deleteEvent);
  document.getElementById('modalOverlay').addEventListener('click', e => { if (e.target.id === 'modalOverlay') closeModal(); });

  // Onglets modal
  document.querySelectorAll('.modal-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.modal-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
    });
  });

  // Mode selector (ponctuel / multi-jours / répétition)
  document.querySelectorAll('.mode-opt').forEach(btn => {
    btn.addEventListener('click', () => selectMode(btn.dataset.mode));
  });

  document.querySelectorAll('.type-opt').forEach(btn => btn.addEventListener('click', () => selectType(btn.dataset.type)));
  document.querySelectorAll('.color-opt').forEach(btn => btn.addEventListener('click', () => selectColor(btn.dataset.color)));

  // Emoji event
  document.getElementById('emojiTrigger').addEventListener('click', e => { e.stopPropagation(); openEmojiPicker(e.currentTarget, 'event'); });
  document.getElementById('emojiClear').addEventListener('click', () => {
    selectedEmoji = '';
    document.getElementById('emojiPreview').textContent = '＋';
    document.getElementById('emojiTrigger').classList.remove('has-emoji');
    document.getElementById('emojiClear').classList.remove('visible');
  });

  // Emoji cat
  document.getElementById('catEmojiTrigger').addEventListener('click', e => { e.stopPropagation(); openEmojiPicker(e.currentTarget, 'cat'); });
  document.getElementById('catEmojiClear').addEventListener('click', () => {
    selectedCatEmoji = '';
    document.getElementById('catEmojiPreview').textContent = '＋';
    document.getElementById('catEmojiTrigger').classList.remove('has-emoji');
    document.getElementById('catEmojiClear').classList.remove('visible');
  });

  // Fermer picker / search
  document.addEventListener('click', e => {
    if (!e.target.closest('#emojiPicker') && !e.target.closest('.emoji-trigger')) closeEmojiPicker();
    if (!e.target.closest('.search-wrapper')) document.getElementById('searchResults').classList.remove('open');
  });

  // Messages depuis le menu natif Electron
  window.agenda.onMessage('import-data', (data) => {
    if (Array.isArray(data)) { events = data; categories = []; strictMonth = false; }
    else { events = data.events || []; categories = data.categories || []; strictMonth = data.strictMonth || false; if (data.theme) { currentTheme = data.theme; applyTheme(currentTheme); } }
    renderCategoryList(); updateToggle(); populateCategorySelect(); render();
    showToast({ title: `Import réussi — ${events.length} événement(s)`, type: 'task', emoji: '⬆', _saved: true });
  });
  window.agenda.onMessage('toast', (ev) => showToast({ ...ev, _saved: true }));
  window.agenda.onMessage('request-ical-export', () => exportICal());
  window.agenda.onMessage('set-view', (v) => setView(v));
  window.agenda.onMessage('go-today', () => goToToday());
  window.agenda.onMessage('set-theme', (theme) => { applyTheme(theme); saveAll(); });

  // Accordion
  document.getElementById('accordionCatHeader').addEventListener('click', e => {
    if (e.target.id === 'btnAddCat' || e.target.closest('#btnAddCat')) return;
    document.getElementById('accordionCat').classList.toggle('open');
  });

  // Filtre "Tous"
  document.getElementById('catFilterAll').addEventListener('click', () => {
    activeFilter = null; renderCategoryList(); renderFilterBadge(); render();
  });

  // Bouton Aujourd'hui
  document.getElementById('btnToday').addEventListener('click', goToToday);

  // Raccourcis clavier
  document.getElementById('btnShortcuts').addEventListener('click', (e) => {
    e.stopPropagation();
    document.getElementById('shortcutsHint').classList.toggle('open');
  });
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#shortcutsHint') && !e.target.closest('#btnShortcuts')) {
      document.getElementById('shortcutsHint').classList.remove('open');
    }
  });
  document.addEventListener('keydown', handleKeyboard);

  // Toggle strict
  document.getElementById('toggleStrict').addEventListener('click', () => {
    strictMonth = !strictMonth; updateToggle(); saveAll(); render();
  });

  // Catégories
  document.getElementById('btnAddCat').addEventListener('click', e => { e.stopPropagation(); openCatModal(); });
  document.getElementById('btnCatModalClose').addEventListener('click', closeCatModal);
  document.getElementById('btnCatCancel').addEventListener('click', closeCatModal);
  document.getElementById('btnCatSave').addEventListener('click', saveCat);
  document.getElementById('btnCatDelete').addEventListener('click', deleteCat);
  document.getElementById('catModalOverlay').addEventListener('click', e => { if (e.target.id === 'catModalOverlay') closeCatModal(); });

  // Search
  const searchInput = document.getElementById('searchInput');
  const searchClear = document.getElementById('searchClear');
  searchInput.addEventListener('input', e => {
    searchQuery = e.target.value.trim();
    searchClear.classList.toggle('visible', searchQuery.length > 0);
    if (searchQuery.length > 0) { renderSearchResults(searchQuery); document.getElementById('searchResults').classList.add('open'); }
    else document.getElementById('searchResults').classList.remove('open');
  });
  searchClear.addEventListener('click', () => {
    searchInput.value = ''; searchQuery = '';
    searchClear.classList.remove('visible');
    document.getElementById('searchResults').classList.remove('open');
  });
}

function updateToggle() {
  document.getElementById('toggleStrict').classList.toggle('on', strictMonth);
}

// ── MODE SELECTOR ─────────────────────────────
function selectMode(mode) {
  selectedMode = mode;
  document.querySelectorAll('.mode-opt').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === mode);
  });
  document.querySelectorAll('.mode-panel').forEach(p => p.classList.remove('active'));
  if (mode !== 'once') {
    document.getElementById('panel-' + mode).classList.add('active');
  }
}

// ── FILTER BADGE ──────────────────────────────
function renderFilterBadge() {
  let badge = document.getElementById('filterBadge');
  if (!badge) {
    badge = document.createElement('div');
    badge.className = 'filter-badge'; badge.id = 'filterBadge';
    const label = document.createElement('span'); label.id = 'filterBadgeLabel';
    const clear = document.createElement('button');
    clear.className = 'filter-badge-clear'; clear.textContent = '×';
    clear.addEventListener('click', () => { activeFilter = null; renderCategoryList(); renderFilterBadge(); render(); });
    badge.appendChild(label); badge.appendChild(clear);
    document.querySelector('.upcoming').parentNode.insertBefore(badge, document.querySelector('.upcoming'));
  }
  if (activeFilter) {
    const cat = categories.find(c => c.id === activeFilter);
    document.getElementById('filterBadgeLabel').textContent = (cat?.emoji ? cat.emoji + ' ' : '') + (cat?.name || '');
    badge.classList.add('visible');
  } else {
    badge.classList.remove('visible');
  }
}

// ── NAVIGATION ────────────────────────────────
function setView(v) {
  currentView = v;
  if (v === 'week' || v === 'day') refDate = new Date(currentYear, currentMonth, selectedDay);
  document.querySelectorAll('.view-btn').forEach(b => b.classList.toggle('active', b.dataset.view === v));
  render();
}

function navigatePrev() {
  if (currentView === 'month') { currentMonth--; if (currentMonth < 0) { currentMonth = 11; currentYear--; } }
  else if (currentView === 'week') refDate = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate() - 7);
  else if (currentView === 'agenda') refDate = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate() - 14);
  else refDate = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate() - 1);
  render();
}

function navigateNext() {
  if (currentView === 'month') { currentMonth++; if (currentMonth > 11) { currentMonth = 0; currentYear++; } }
  else if (currentView === 'week') refDate = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate() + 7);
  else if (currentView === 'agenda') refDate = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate() + 14);
  else refDate = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate() + 1);
  render();
}

// ── TODAY ─────────────────────────────────────
function goToToday() {
  currentYear = today.getFullYear();
  currentMonth = today.getMonth();
  selectedDay = today.getDate();
  refDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  render();
}

// ── EXPAND EVENTS ─────────────────────────────
function expandEvents(evList, fromDate, toDate) {
  const result = [];
  const from = dateToStr(fromDate);
  const to = dateToStr(toDate);

  evList.forEach(ev => {
    // Événement ponctuel ou multi-jours (pas de repeat)
    if (!ev.repeat) {
      if (ev.date >= from && ev.date <= to) result.push(ev);
      return;
    }
    // Événement récurrent
    const hardEnd = (ev.repeatEnd && ev.repeatEnd < to) ? ev.repeatEnd : to;
    if (ev.date > hardEnd) return;

    let current = new Date(ev.date + 'T12:00:00');
    // Sauter jusqu'à la plage visible
    while (dateToStr(current) < from) {
      switch (ev.repeat) {
        case 'daily':   current.setDate(current.getDate() + 1); break;
        case 'weekly':  current.setDate(current.getDate() + 7); break;
        case 'monthly': current.setMonth(current.getMonth() + 1); break;
        case 'yearly':  current.setFullYear(current.getFullYear() + 1); break;
        default: return;
      }
    }
    // Collecter les occurrences
    while (true) {
      const dateStr = dateToStr(current);
      if (dateStr > hardEnd || dateStr > to) break;
      result.push({ ...ev, date: dateStr, _recurring: true, _originalId: ev.id });
      switch (ev.repeat) {
        case 'daily':   current.setDate(current.getDate() + 1); break;
        case 'weekly':  current.setDate(current.getDate() + 7); break;
        case 'monthly': current.setMonth(current.getMonth() + 1); break;
        case 'yearly':  current.setFullYear(current.getFullYear() + 1); break;
        default: current.setFullYear(current.getFullYear() + 100);
      }
    }
  });
  return result;
}

function getVisibleEventsRange(fromDate, toDate) {
  let evs = expandEvents(events, fromDate, toDate);
  if (activeFilter) evs = evs.filter(e => e.category === activeFilter);
  return evs;
}

// ── RENDER ────────────────────────────────────
function render() {
  updateLabel();
  renderMiniCalendar();
  renderUpcoming();
  const area = document.getElementById('calendarArea');
  area.innerHTML = '';
  if (currentView === 'month') renderMonth(area);
  else if (currentView === 'agenda') renderAgenda(area);
  else renderWeek(area, currentView === 'week' ? 7 : 1);
}

function updateLabel() {
  let label = '';
  if (currentView === 'month') label = `${MONTHS[currentMonth]} ${currentYear}`;
  else if (currentView === 'week') {
    const mon = getMondayOf(refDate);
    const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
    label = mon.getMonth() === sun.getMonth()
      ? `${mon.getDate()} – ${sun.getDate()} ${MONTHS[mon.getMonth()]} ${mon.getFullYear()}`
      : `${mon.getDate()} ${MONTHS[mon.getMonth()].slice(0,3)} – ${sun.getDate()} ${MONTHS[sun.getMonth()].slice(0,3)} ${sun.getFullYear()}`;
  } else if (currentView === 'agenda') {
    const agendaEnd = new Date(refDate); agendaEnd.setDate(refDate.getDate() + 13);
    label = `${refDate.getDate()} ${MONTHS[refDate.getMonth()].slice(0,3)} – ${agendaEnd.getDate()} ${MONTHS[agendaEnd.getMonth()].slice(0,3)} ${agendaEnd.getFullYear()}`;
  } else {
    label = `${refDate.getDate()} ${MONTHS[refDate.getMonth()]} ${refDate.getFullYear()}`;
  }
  document.getElementById('monthLabel').textContent = label;
  document.getElementById('miniMonthLabel').textContent = `${MONTHS[currentMonth].slice(0,3)} ${currentYear}`;
}

// ── VUE MOIS ──────────────────────────────────
function renderMonth(area) {
  const headers = document.createElement('div');
  headers.className = 'day-headers';
  ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'].forEach((d, i) => {
    const h = document.createElement('div');
    h.className = 'day-header' + (i >= 5 ? ' weekend' : '');
    h.textContent = d; headers.appendChild(h);
  });
  area.appendChild(headers);

  const cells = strictMonth ? getStrictMonthCells(currentYear, currentMonth) : getMonthCells(currentYear, currentMonth);
  const firstCell = new Date(currentYear, currentMonth, 1);
  const lastCell = strictMonth ? new Date(currentYear, currentMonth + 1, 0) : new Date(currentYear, currentMonth + 1, 6);

  // expandEvents pour les récurrents + multi-jours séparément
  const recurringEvs = expandEvents(events.filter(e => e.repeat), firstCell, lastCell);
  const normalEvs = events.filter(e => !e.repeat && e.date >= dateToStr(firstCell) && e.date <= dateToStr(lastCell));
  let allEvs = [...normalEvs, ...recurringEvs];
  if (activeFilter) allEvs = allEvs.filter(e => e.category === activeFilter);

  // Multi-jours : calculer la map UNE SEULE FOIS à partir des événements non-récurrents avec dateEnd
  const multiDayEvs = events.filter(e => e.dateEnd && e.dateEnd > e.date);
  const multiDayMap = buildMultiDayMap(activeFilter ? multiDayEvs.filter(e => e.category === activeFilter) : multiDayEvs, cells);

  const grid = document.createElement('div');
  grid.className = 'cal-grid';
  if (strictMonth) {
    const rows = Math.ceil(cells.length / 7);
    grid.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
  }

  cells.forEach(c => {
    const cell = document.createElement('div');
    cell.className = 'cal-cell';
    if (c.empty) { cell.style.cursor = 'default'; cell.style.opacity = '0'; grid.appendChild(cell); return; }
    if (c.other) cell.classList.add('other-month');
    if (c.dateStr === dateToStr(today)) cell.classList.add('today');
    if (!c.other && c.day === selectedDay && c.month === currentMonth) cell.classList.add('selected');

    const num = document.createElement('div');
    num.className = 'cell-num'; num.textContent = c.day; cell.appendChild(num);

    // Événements normaux du jour (sans dateEnd, sans repeat)
    allEvs.filter(e => e.date === c.dateStr && !e.dateEnd).slice(0, 3).forEach(ev => cell.appendChild(makeEventChip(ev, 'cal-event')));

    // Événements multi-jours
    (multiDayMap[c.dateStr] || []).forEach(({ ev, isStart, isEnd }) => {
      const cls = 'cal-event multiday' + (isStart ? ' multiday-start' : '') + (isEnd ? ' multiday-end' : '');
      cell.appendChild(makeEventChip(ev, cls));
    });

    cell.addEventListener('click', () => {
      if (!c.other) { selectedDay = c.day; render(); }
      openModal(c.dateStr);
    });
    grid.appendChild(cell);
  });
  area.appendChild(grid);
}

// buildMultiDayMap : calcule une seule fois, sans répétition
function buildMultiDayMap(multiDayEvs, cells) {
  const map = {};
  const cellDates = new Set(cells.filter(c => !c.empty).map(c => c.dateStr));

  multiDayEvs.forEach(ev => {
    let current = new Date(ev.date + 'T00:00:00');
    const end = new Date(ev.dateEnd + 'T00:00:00');
    while (current <= end) {
      const ds = dateToStr(current);
      if (cellDates.has(ds)) {
        if (!map[ds]) map[ds] = [];
        // Éviter les doublons si la même entrée est déjà là
        if (!map[ds].some(entry => entry.ev.id === ev.id && entry.ev.date === ev.date)) {
          map[ds].push({ ev, isStart: ds === ev.date, isEnd: ds === ev.dateEnd });
        }
      }
      current.setDate(current.getDate() + 1);
    }
  });
  return map;
}


// ── VUE AGENDA ────────────────────────────────
function renderAgenda(area) {
  const agendaDiv = document.createElement('div');
  agendaDiv.className = 'agenda-view';

  const startDate = new Date(refDate);
  const endDate = new Date(refDate); endDate.setDate(refDate.getDate() + 13);
  const evs = getVisibleEventsRange(startDate, endDate)
    .sort((a,b) => a.date.localeCompare(b.date) || (a.time||'').localeCompare(b.time||''));

  if (!evs.length) {
    const empty = document.createElement('div');
    empty.className = 'agenda-empty';
    empty.textContent = 'Aucun événement sur cette période';
    agendaDiv.appendChild(empty);
    area.appendChild(agendaDiv);
    return;
  }

  // Grouper par date
  const groups = {};
  evs.forEach(ev => {
    if (!groups[ev.date]) groups[ev.date] = [];
    groups[ev.date].push(ev);
  });

  const todayStr = dateToStr(today);
  Object.keys(groups).sort().forEach(dateStr => {
    const d = new Date(dateStr + 'T00:00:00');
    const group = document.createElement('div');
    group.className = 'agenda-day-group' + (dateStr === todayStr ? ' is-today' : '');

    const hdr = document.createElement('div'); hdr.className = 'agenda-day-header';
    const num = document.createElement('div'); num.className = 'agenda-day-num'; num.textContent = d.getDate();
    const info = document.createElement('div'); info.className = 'agenda-day-info';
    const name = document.createElement('div'); name.className = 'agenda-day-name';
    name.textContent = ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'][d.getDay()];
    const month = document.createElement('div'); month.className = 'agenda-day-month';
    month.textContent = MONTHS[d.getMonth()] + ' ' + d.getFullYear();
    info.appendChild(name); info.appendChild(month);
    hdr.appendChild(num); hdr.appendChild(info);
    group.appendChild(hdr);

    const divider = document.createElement('div'); divider.className = 'agenda-day-divider';
    group.appendChild(divider);

    groups[dateStr].forEach(ev => {
      const evDiv = document.createElement('div');
      evDiv.className = 'agenda-event type-' + ev.type;
      const evColor = getEvColor(ev);
      if (evColor) { evDiv.style.borderLeftColor = evColor; }

      const timeDiv = document.createElement('div'); timeDiv.className = 'agenda-event-time';
      timeDiv.textContent = ev.time || 'Toute la journée';

      const body = document.createElement('div'); body.className = 'agenda-event-body';
      const titleDiv = document.createElement('div'); titleDiv.className = 'agenda-event-title';
      titleDiv.textContent = (ev.emoji ? ev.emoji + ' ' : '') + ev.title;

      const meta = document.createElement('div'); meta.className = 'agenda-event-meta';
      const parts = [];
      if (ev._recurring) parts.push('🔁 Récurrent');
      if (ev.dateEnd) parts.push('→ ' + ev.dateEnd);
      const cat = ev.category ? categories.find(c => c.id === ev.category) : null;
      if (cat) parts.push((cat.emoji ? cat.emoji + ' ' : '') + cat.name);
      if (ev.note) parts.push(ev.note.slice(0, 40) + (ev.note.length > 40 ? '…' : ''));
      meta.textContent = parts.join(' · ');

      body.appendChild(titleDiv);
      if (parts.length) body.appendChild(meta);
      evDiv.appendChild(timeDiv); evDiv.appendChild(body);
      evDiv.addEventListener('click', () => openModal(null, getOriginalEvent(ev)));
      group.appendChild(evDiv);
    });

    agendaDiv.appendChild(group);
  });

  area.appendChild(agendaDiv);
}

// ── CHEVAUCHEMENT ─────────────────────────────
// Calcule les colonnes pour les events qui se chevauchent
function computeOverlapColumns(dayEvs) {
  // Trier par heure de début
  const sorted = [...dayEvs].sort((a,b) => (a.time||'').localeCompare(b.time||''));
  const columns = []; // chaque colonne = tableau d'events

  sorted.forEach(ev => {
    const [h, m] = (ev.time||'00:00').split(':').map(Number);
    const startMin = h * 60 + m;
    const endMin = startMin + 60; // durée par défaut 1h

    // Trouver la première colonne où l'event ne chevauche pas
    let placed = false;
    for (let col = 0; col < columns.length; col++) {
      const last = columns[col][columns[col].length - 1];
      const [lh, lm] = (last.time||'00:00').split(':').map(Number);
      const lastEnd = lh * 60 + lm + 60;
      if (startMin >= lastEnd) {
        columns[col].push(ev);
        ev._col = col;
        placed = true;
        break;
      }
    }
    if (!placed) {
      ev._col = columns.length;
      columns.push([ev]);
    }
  });

  // Calculer le nombre total de colonnes pour chaque event
  sorted.forEach(ev => {
    const [h, m] = (ev.time||'00:00').split(':').map(Number);
    const startMin = h * 60 + m;
    const endMin = startMin + 60;
    let maxCol = ev._col;
    sorted.forEach(other => {
      if (other === ev) return;
      const [oh, om] = (other.time||'00:00').split(':').map(Number);
      const otherStart = oh * 60 + om;
      const otherEnd = otherStart + 60;
      if (startMin < otherEnd && endMin > otherStart) {
        maxCol = Math.max(maxCol, other._col || 0);
      }
    });
    ev._totalCols = maxCol + 1;
  });

  return sorted;
}

// ── VUE SEMAINE / JOUR ────────────────────────
function renderWeek(area, numDays) {
  const HOUR_H = 52;
  const startDate = numDays === 1 ? new Date(refDate) : getMondayOf(refDate);
  const endDate = new Date(startDate); endDate.setDate(startDate.getDate() + numDays - 1);
  const days = Array.from({length: numDays}, (_, i) => { const d = new Date(startDate); d.setDate(startDate.getDate() + i); return d; });
  const colClass = numDays === 7 ? 'cols-7' : 'cols-1';
  const visibleEvs = getVisibleEventsRange(startDate, endDate);

  const header = document.createElement('div');
  header.className = `week-header ${colClass}`;
  header.appendChild(Object.assign(document.createElement('div'), { className: 'week-header-spacer' }));

  days.forEach(d => {
    const dh = document.createElement('div'); dh.className = 'week-day-header';
    if (dateToStr(d) === dateToStr(today)) dh.classList.add('is-today');
    const dayName = document.createElement('div'); dayName.className = 'week-day-name'; dayName.textContent = DAYS_SHORT[(d.getDay()+6)%7];
    const dayNum = document.createElement('div'); dayNum.className = 'week-day-num'; dayNum.textContent = d.getDate();
    dh.appendChild(dayName); dh.appendChild(dayNum);
    visibleEvs.filter(e => e.date === dateToStr(d) && !e.time).forEach(ev => {
      const el = makeEventChip(ev, 'allday-event');
      el.addEventListener('click', e => { e.stopPropagation(); openModal(null, getOriginalEvent(ev)); });
      dh.appendChild(el);
    });
    dh.addEventListener('click', () => { refDate = new Date(d); setView('day'); });
    header.appendChild(dh);
  });
  area.appendChild(header);

  const body = document.createElement('div'); body.className = 'week-body';
  const timeCol = document.createElement('div'); timeCol.className = 'week-time-col';
  const timeInner = document.createElement('div'); timeInner.className = 'week-time-inner';
  for (let h = 0; h < 24; h++) {
    const label = document.createElement('div'); label.className = 'time-slot-label';
    label.textContent = h === 0 ? '' : `${String(h).padStart(2,'0')}:00`;
    timeInner.appendChild(label);
  }
  timeCol.appendChild(timeInner); body.appendChild(timeCol);

  const colsWrapper = document.createElement('div'); colsWrapper.className = 'week-cols-wrapper';
  const colsScroll = document.createElement('div'); colsScroll.className = `week-cols-scroll ${colClass}`;

  days.forEach(d => {
    const col = document.createElement('div'); col.className = 'week-col'; col.style.minHeight = (HOUR_H * 24) + 'px';
    for (let h = 0; h < 24; h++) {
      const line = document.createElement('div'); line.className = 'hour-line'; line.style.top = (h * HOUR_H) + 'px'; col.appendChild(line);
      const half = document.createElement('div'); half.className = 'hour-line half'; half.style.top = (h * HOUR_H) + 'px'; col.appendChild(half);
    }
    col.addEventListener('click', e => {
      if (e.target !== col) return;
      const rect = col.getBoundingClientRect();
      const y = e.clientY - rect.top + colsScroll.scrollTop;
      const hour = Math.floor(y / HOUR_H);
      const min = (y % HOUR_H) < 26 ? '00' : '30';
      openModal(dateToStr(d), null, `${String(Math.min(hour,23)).padStart(2,'0')}:${min}`);
    });
    const timedEvs = visibleEvs.filter(e => e.date === dateToStr(d) && e.time);
    const withCols = computeOverlapColumns(timedEvs);
    withCols.forEach(ev => {
      const [h, m] = ev.time.split(':').map(Number);
      const top = h * HOUR_H + (m / 60) * HOUR_H;
      const totalCols = ev._totalCols || 1;
      const col_idx = ev._col || 0;
      const width = 100 / totalCols;
      const el = document.createElement('div'); el.className = `week-event type-${ev.type}`;
      el.style.top = top + 'px';
      el.style.height = HOUR_H + 'px';
      el.style.left = (col_idx * width) + '%';
      el.style.right = ((totalCols - col_idx - 1) * width) + '%';
      el.style.width = 'auto';
      const evColor = getEvColor(ev);
      if (evColor) { el.style.background = hexToRgba(evColor, 0.22); el.style.color = evColor; el.style.borderLeftColor = evColor; }
      const title = document.createElement('div'); title.className = 'week-event-title';
      title.textContent = (ev.emoji ? ev.emoji + ' ' : '') + ev.title;
      const time = document.createElement('div'); time.className = 'week-event-time'; time.textContent = ev.time;
      el.appendChild(title); el.appendChild(time);
      el.addEventListener('click', e => { e.stopPropagation(); openModal(null, getOriginalEvent(ev)); });
      col.appendChild(el);
    });
    if (dateToStr(d) === dateToStr(today)) {
      const nowLine = document.createElement('div'); nowLine.className = 'now-line';
      nowLine.style.top = (today.getHours() * HOUR_H + (today.getMinutes() / 60) * HOUR_H) + 'px';
      col.appendChild(nowLine);
    }
    colsScroll.appendChild(col);
  });

  colsWrapper.appendChild(colsScroll); body.appendChild(colsWrapper); area.appendChild(body);
  colsScroll.addEventListener('scroll', () => { timeInner.style.transform = `translateY(-${colsScroll.scrollTop}px)`; });
  setTimeout(() => { colsScroll.scrollTop = Math.max(0, today.getHours() * HOUR_H - 120); }, 50);
}

// ── CHIP ──────────────────────────────────────
function makeEventChip(ev, className) {
  const el = document.createElement('div'); el.className = className;
  el.textContent = (ev.emoji ? ev.emoji + ' ' : '') + (ev.time && className.includes('cal-event') && !className.includes('multiday') ? ev.time + ' ' : '') + ev.title;
  if (ev._recurring) el.title = '🔁 Récurrent';
  const evColor = getEvColor(ev);
  if (evColor) { el.style.background = hexToRgba(evColor, 0.2); el.style.color = evColor; }
  el.addEventListener('click', e => { e.stopPropagation(); openModal(null, getOriginalEvent(ev)); });
  return el;
}

function getOriginalEvent(ev) {
  if (ev._recurring) return events.find(e => e.id === ev._originalId) || ev;
  return ev;
}

function getEvColor(ev) {
  if (ev.color) return ev.color;
  if (ev.category) { const cat = categories.find(c => c.id === ev.category); if (cat) return cat.color; }
  return null;
}

// ── CATEGORIES ────────────────────────────────
function renderCategoryList() {
  const list = document.getElementById('catList');
  list.innerHTML = '';
  document.getElementById('catFilterAll').classList.toggle('active', activeFilter === null);

  if (!categories.length) {
    const empty = document.createElement('div');
    empty.style.cssText = 'color:var(--muted);font-size:11px;padding:4px 6px';
    empty.textContent = 'Aucune catégorie'; list.appendChild(empty); return;
  }

  categories.forEach(cat => {
    const item = document.createElement('div');
    item.className = 'cat-item' + (activeFilter === cat.id ? ' active' : '');
    const dot = document.createElement('div'); dot.className = 'cat-dot'; dot.style.background = cat.color;
    const name = document.createElement('div'); name.className = 'cat-name'; name.textContent = cat.name;
    const edit = document.createElement('button'); edit.className = 'cat-edit'; edit.textContent = '✎'; edit.title = 'Modifier';
    item.appendChild(dot);
    if (cat.emoji) { const em = document.createElement('span'); em.className = 'cat-emoji'; em.textContent = cat.emoji; item.appendChild(em); }
    item.appendChild(name); item.appendChild(edit);
    edit.addEventListener('click', e => { e.stopPropagation(); openCatModal(cat); });
    item.addEventListener('click', () => {
      activeFilter = activeFilter === cat.id ? null : cat.id;
      renderCategoryList(); renderFilterBadge(); render();
    });
    list.appendChild(item);
  });
}

function populateCategorySelect() {
  const sel = document.getElementById('evCategory');
  const current = sel.value;
  sel.innerHTML = '<option value="">Aucune</option>';
  categories.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat.id;
    opt.textContent = (cat.emoji ? cat.emoji + ' ' : '') + cat.name;
    sel.appendChild(opt);
  });
  sel.value = current;
}

function openCatModal(cat = null) {
  editingCatId = cat ? cat.id : null;
  document.getElementById('catModalTitle').textContent = cat ? 'Modifier la catégorie' : 'Nouvelle catégorie';
  document.getElementById('catName').value = cat ? cat.name : '';
  document.getElementById('catColor').value = cat ? cat.color : '#7c6af5';
  document.getElementById('btnCatDelete').style.display = cat ? 'flex' : 'none';
  selectedCatEmoji = cat ? (cat.emoji || '') : '';
  document.getElementById('catEmojiPreview').textContent = selectedCatEmoji || '＋';
  document.getElementById('catEmojiTrigger').classList.toggle('has-emoji', !!selectedCatEmoji);
  document.getElementById('catEmojiClear').classList.toggle('visible', !!selectedCatEmoji);
  document.getElementById('catModalOverlay').classList.add('open');
}

function closeCatModal() { document.getElementById('catModalOverlay').classList.remove('open'); }

async function saveCat() {
  const name = document.getElementById('catName').value.trim();
  if (!name) { document.getElementById('catName').focus(); return; }
  const cat = { id: editingCatId || Date.now(), name, emoji: selectedCatEmoji, color: document.getElementById('catColor').value };
  categories = editingCatId ? categories.map(c => c.id === editingCatId ? cat : c) : [...categories, cat];
  await saveAll(); closeCatModal(); renderCategoryList(); populateCategorySelect(); render();
}

async function deleteCat() {
  if (!editingCatId) return;
  categories = categories.filter(c => c.id !== editingCatId);
  events = events.map(e => e.category === editingCatId ? { ...e, category: null } : e);
  if (activeFilter === editingCatId) { activeFilter = null; renderFilterBadge(); }
  await saveAll(); closeCatModal(); renderCategoryList(); populateCategorySelect(); render();
}

// ── SEARCH ────────────────────────────────────
function renderSearchResults(query) {
  const results = document.getElementById('searchResults');
  results.innerHTML = '';
  const q = query.toLowerCase();
  const matches = events.filter(ev => ev.title.toLowerCase().includes(q) || (ev.note && ev.note.toLowerCase().includes(q))).slice(0, 10);
  const header = document.createElement('div'); header.className = 'search-header';
  header.textContent = `${matches.length} résultat${matches.length !== 1 ? 's' : ''}`;
  results.appendChild(header);
  if (!matches.length) {
    const empty = document.createElement('div'); empty.className = 'search-empty'; empty.textContent = 'Aucun événement trouvé';
    results.appendChild(empty); return;
  }
  matches.forEach(ev => {
    const item = document.createElement('div'); item.className = 'search-item';
    const dot = document.createElement('div'); dot.className = 'search-dot'; dot.style.background = getEvColor(ev) || getTypeColor(ev.type);
    const info = document.createElement('div'); info.className = 'search-item-info';
    const title = document.createElement('div'); title.className = 'search-item-title'; title.textContent = (ev.emoji ? ev.emoji + ' ' : '') + ev.title;
    const meta = document.createElement('div'); meta.className = 'search-item-meta';
    const d = new Date(ev.date + 'T00:00:00');
    meta.textContent = `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}${ev.time ? ' · ' + ev.time : ''}`;
    info.appendChild(title); info.appendChild(meta); item.appendChild(dot); item.appendChild(info);
    item.addEventListener('click', () => {
      document.getElementById('searchResults').classList.remove('open');
      document.getElementById('searchInput').value = '';
      document.getElementById('searchClear').classList.remove('visible');
      const d = new Date(ev.date + 'T00:00:00');
      currentMonth = d.getMonth(); currentYear = d.getFullYear(); selectedDay = d.getDate(); refDate = new Date(d);
      setView('month'); openModal(null, ev);
    });
    results.appendChild(item);
  });
}

function getTypeColor(type) { return { task:'#3ecfaa', event:'#7c6af5', reminder:'#f07070' }[type] || '#9d99b8'; }

// ── HELPERS ───────────────────────────────────
function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
  return `rgba(${r},${g},${b},${alpha})`;
}
function fmtDate(y, m, d) {
  const date = new Date(y, m, d);
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}
function dateToStr(date) { return fmtDate(date.getFullYear(), date.getMonth(), date.getDate()); }
function getMondayOf(date) {
  const d = new Date(date); const dow = d.getDay();
  d.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1)); return d;
}
function getMonthCells(year, month) {
  const firstDay = new Date(year, month, 1);
  let startDow = firstDay.getDay(); startDow = startDow === 0 ? 6 : startDow - 1;
  const daysInMonth = new Date(year, month+1, 0).getDate();
  const daysInPrev = new Date(year, month, 0).getDate();
  const cells = [];
  for (let i = 0; i < 42; i++) {
    let day, m, y, other = false;
    if (i < startDow) { day = daysInPrev - startDow + i + 1; m = month-1; y = year; other = true; }
    else if (i - startDow < daysInMonth) { day = i - startDow + 1; m = month; y = year; }
    else { day = i - startDow - daysInMonth + 1; m = month+1; y = year; other = true; }
    cells.push({ day, month: m, year: y, other, dateStr: fmtDate(y, m, day) });
  }
  return cells;
}
function getStrictMonthCells(year, month) {
  const daysInMonth = new Date(year, month+1, 0).getDate();
  const firstDay = new Date(year, month, 1);
  let startDow = firstDay.getDay(); startDow = startDow === 0 ? 6 : startDow - 1;
  const cells = [];
  for (let i = 0; i < startDow; i++) cells.push({ day: null, month, year, other: true, empty: true, dateStr: '' });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, month, year, other: false, dateStr: fmtDate(year, month, d) });
  return cells;
}
function renderMiniCalendar() {
  const grid = document.getElementById('miniGrid'); grid.innerHTML = '';
  ['L','M','M','J','V','S','D'].forEach(d => { const el = document.createElement('div'); el.className = 'mini-wday'; el.textContent = d; grid.appendChild(el); });
  getMonthCells(currentYear, currentMonth).slice(0, 35).forEach(c => {
    const el = document.createElement('div'); el.className = 'mini-d'; el.textContent = c.day;
    if (c.other) el.style.opacity = '0.2';
    if (c.dateStr === dateToStr(today)) el.classList.add('today');
    if (!c.other && c.day === selectedDay && c.month === currentMonth) el.classList.add('selected');
    if (events.some(e => e.date === c.dateStr)) el.classList.add('has-event');
    el.addEventListener('click', () => { if (!c.other) { selectedDay = c.day; refDate = new Date(c.year, c.month, c.day); render(); } });
    grid.appendChild(el);
  });
}
function renderUpcoming() {
  const list = document.getElementById('upcomingList'); list.innerHTML = '';
  const todayStr = dateToStr(today);
  const tomorrowStr = fmtDate(today.getFullYear(), today.getMonth(), today.getDate()+1);
  const futureDate = new Date(today); futureDate.setDate(today.getDate() + 60);
  const upcoming = getVisibleEventsRange(today, futureDate)
    .filter(e => e.date >= todayStr)
    .sort((a,b) => a.date.localeCompare(b.date) || (a.time||'').localeCompare(b.time||'')).slice(0, 6);
  if (!upcoming.length) {
    const empty = document.createElement('div'); empty.style.cssText = 'color:var(--muted);font-size:12px;text-align:center;padding:16px 0'; empty.textContent = 'Aucun événement à venir'; list.appendChild(empty); return;
  }
  upcoming.forEach(ev => {
    const el = document.createElement('div'); el.className = `upcoming-item type-${ev.type}`;
    const evColor = getEvColor(ev); if (evColor) el.style.borderLeftColor = evColor;
    const d = new Date(ev.date + 'T00:00:00');
    const label = ev.date === todayStr ? "Aujourd'hui" : ev.date === tomorrowStr ? 'Demain' : `${d.getDate()} ${MONTHS[d.getMonth()].slice(0,3)}`;
    const titleEl = document.createElement('div'); titleEl.className = 'ev-title';
    titleEl.textContent = (ev.emoji ? ev.emoji + ' ' : '') + ev.title + (ev._recurring ? ' 🔁' : '');
    const timeEl = document.createElement('div'); timeEl.className = 'ev-time'; timeEl.textContent = label + (ev.time ? ' · ' + ev.time : '');
    el.appendChild(titleEl); el.appendChild(timeEl);
    el.addEventListener('click', () => openModal(null, getOriginalEvent(ev)));
    list.appendChild(el);
  });
}

// ── MODAL ─────────────────────────────────────
function openModal(dateStr = null, existingEvent = null, timeStr = '') {
  editingId = existingEvent ? existingEvent.id : null;
  document.getElementById('modalTitle').textContent = existingEvent ? 'Modifier' : 'Nouvel événement';
  document.getElementById('evDate').value = existingEvent ? existingEvent.date : (dateStr || fmtDate(currentYear, currentMonth, selectedDay));
  document.getElementById('evTitle').value = existingEvent ? existingEvent.title : '';
  document.getElementById('evTime').value = existingEvent ? (existingEvent.time || '') : timeStr;
  document.getElementById('evNote').value = existingEvent ? (existingEvent.note || '') : '';
  document.getElementById('evReminder').value = existingEvent ? (existingEvent.reminder || '') : '';
  document.getElementById('evCategory').value = existingEvent ? (existingEvent.category || '') : '';
  selectType(existingEvent ? existingEvent.type : 'task');
  selectColor(existingEvent ? (existingEvent.color || '') : '');
  selectedEmoji = existingEvent ? (existingEvent.emoji || '') : '';
  document.getElementById('emojiPreview').textContent = selectedEmoji || '＋';
  document.getElementById('emojiTrigger').classList.toggle('has-emoji', !!selectedEmoji);
  document.getElementById('emojiClear').classList.toggle('visible', !!selectedEmoji);

  // Déterminer le mode
  let mode = 'once';
  if (existingEvent?.dateEnd) mode = 'multiday';
  else if (existingEvent?.repeat) mode = 'repeat';
  selectMode(mode);

  if (existingEvent?.dateEnd) document.getElementById('evDateEnd').value = existingEvent.dateEnd;
  else document.getElementById('evDateEnd').value = '';
  if (existingEvent?.repeat) {
    document.getElementById('evRepeat').value = existingEvent.repeat;
    document.getElementById('evRepeatEnd').value = existingEvent.repeatEnd || '';
  } else {
    document.getElementById('evRepeat').value = 'daily';
    document.getElementById('evRepeatEnd').value = '';
  }

  document.getElementById('btnDelete').style.display = existingEvent ? 'flex' : 'none';
  // Revenir au premier onglet
  document.querySelectorAll('.modal-tab').forEach((t,i) => t.classList.toggle('active', i === 0));
  document.querySelectorAll('.tab-panel').forEach((p,i) => p.classList.toggle('active', i === 0));
  document.getElementById('modalOverlay').classList.add('open');
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
  ['evTitle','evTime','evNote','evDateEnd','evRepeatEnd'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('evReminder').value = '';
  document.getElementById('evCategory').value = '';
  selectedEmoji = '';
  document.getElementById('emojiPreview').textContent = '＋';
  document.getElementById('emojiTrigger').classList.remove('has-emoji');
  document.getElementById('emojiClear').classList.remove('visible');
  selectType('task'); selectColor(''); selectMode('once');
}

function selectType(type) {
  selectedType = type;
  document.querySelectorAll('.type-opt').forEach(btn => { btn.className = 'type-opt'; if (btn.dataset.type === type) btn.classList.add(`active-${type}`); });
}

function selectColor(color) {
  selectedColor = color;
  document.querySelectorAll('.color-opt').forEach(btn => {
    btn.classList.toggle('selected', btn.dataset.color === color);
    if (btn.dataset.color && btn.dataset.color !== '') btn.style.background = btn.dataset.color;
  });
}

async function saveEvent() {
  const title = document.getElementById('evTitle').value.trim();
  if (!title) {
    document.querySelectorAll('.modal-tab').forEach((t,i) => t.classList.toggle('active', i === 0));
    document.querySelectorAll('.tab-panel').forEach((p,i) => p.classList.toggle('active', i === 0));
    document.getElementById('evTitle').focus(); return;
  }

  // Validation date fin > date début (mode multiday)
  if (selectedMode === 'multiday') {
    const dateStart = document.getElementById('evDate').value;
    const dateEnd = document.getElementById('evDateEnd').value;
    const errEl = document.getElementById('dateEndError');
    if (dateEnd && dateEnd <= dateStart) {
      document.querySelectorAll('.modal-tab').forEach((t,i) => t.classList.toggle('active', i === 1));
      document.querySelectorAll('.tab-panel').forEach((p,i) => p.classList.toggle('active', i === 1));
      document.getElementById('evDateEnd').classList.add('error');
      if (errEl) { errEl.textContent = 'La date de fin doit être après la date de début.'; errEl.classList.add('visible'); }
      return;
    }
    if (errEl) { errEl.classList.remove('visible'); }
    document.getElementById('evDateEnd').classList.remove('error');
  }

  // Validation repeatEnd > date début (mode repeat)
  if (selectedMode === 'repeat') {
    const dateStart = document.getElementById('evDate').value;
    const repeatEnd = document.getElementById('evRepeatEnd').value;
    const errEl = document.getElementById('repeatEndError');
    if (repeatEnd && repeatEnd <= dateStart) {
      document.querySelectorAll('.modal-tab').forEach((t,i) => t.classList.toggle('active', i === 1));
      document.querySelectorAll('.tab-panel').forEach((p,i) => p.classList.toggle('active', i === 1));
      document.getElementById('evRepeatEnd').classList.add('error');
      if (errEl) { errEl.textContent = "La date d'arrêt doit être après la date de début."; errEl.classList.add('visible'); }
      return;
    }
    if (errEl) { errEl.classList.remove('visible'); }
    document.getElementById('evRepeatEnd').classList.remove('error');
  }
  const ev = {
    id: editingId || Date.now(), title, type: selectedType, color: selectedColor, emoji: selectedEmoji,
    category: document.getElementById('evCategory').value || null,
    date: document.getElementById('evDate').value,
    time: document.getElementById('evTime').value,
    note: document.getElementById('evNote').value,
    reminder: document.getElementById('evReminder').value,
    // Mode mutuellement exclusif
    dateEnd: selectedMode === 'multiday' ? (document.getElementById('evDateEnd').value || null) : null,
    repeat: selectedMode === 'repeat' ? document.getElementById('evRepeat').value : null,
    repeatEnd: selectedMode === 'repeat' ? (document.getElementById('evRepeatEnd').value || null) : null,
    _notified: false
  };
  events = editingId ? events.map(e => e.id === editingId ? ev : e) : [...events, ev];
  await saveAll(); closeModal(); render(); showToast({ ...ev, _saved: true });
}

async function deleteEvent() {
  if (!editingId) return;
  events = events.filter(e => e.id !== editingId);
  await saveAll(); closeModal(); render();
  showToast({ title: 'Événement supprimé', type: 'task', _saved: true });
}

// ── KEYBOARD SHORTCUTS ───────────────────────
function handleKeyboard(e) {
  const tag = document.activeElement.tagName.toLowerCase();
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
  const modalOpen = document.getElementById('modalOverlay').classList.contains('open');
  const catModalOpen = document.getElementById('catModalOverlay').classList.contains('open');
  if (e.key === 'Escape') {
    if (modalOpen) closeModal();
    if (catModalOpen) closeCatModal();
    document.getElementById('shortcutsHint').classList.remove('open');
    document.getElementById('searchResults').classList.remove('open');
    return;
  }
  if (modalOpen || catModalOpen) return;
  switch (e.key.toLowerCase()) {
    case 'n': openModal(); break;
    case 't': goToToday(); break;
    case 'm': setView('month'); break;
    case 'w': setView('week'); break;
    case 'd': setView('day'); break;
    case 'a': setView('agenda'); break;
    case 'arrowleft': navigatePrev(); break;
    case 'arrowright': navigateNext(); break;
  }
}


// ── EXPORT / IMPORT ───────────────────────────
async function exportJSON() {
  const result = await window.agenda.exportJSON({ events, categories, strictMonth, theme: currentTheme });
  if (result.success) showToast({ title: 'Export JSON réussi !', type: 'task', emoji: '⬇', _saved: true });
  else if (result.error) showToast({ title: 'Erreur export', type: 'reminder', emoji: '❌', _saved: true });
}

async function importJSON() {
  const result = await window.agenda.importJSON();
  if (!result.success) return;
  const data = result.data;
  if (!data) return;
  // Support ancien format tableau
  if (Array.isArray(data)) {
    events = data; categories = []; strictMonth = false;
  } else {
    events = data.events || [];
    categories = data.categories || [];
    strictMonth = data.strictMonth || false;
    if (data.theme) { currentTheme = data.theme; applyTheme(currentTheme); }
  }
  await saveAll();
  renderCategoryList();
  updateToggle();
  populateCategorySelect();
  render();
  showToast({ title: `Import réussi — ${events.length} événement(s)`, type: 'task', emoji: '⬆', _saved: true });
}

async function exportICal() {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Mon Agenda//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];

  events.forEach(ev => {
    const uid = ev.id + '@mon-agenda';
    const dtstart = ev.time
      ? ev.date.replace(/-/g,'') + 'T' + ev.time.replace(':','') + '00'
      : ev.date.replace(/-/g,'');
    const dtend = ev.dateEnd
      ? ev.dateEnd.replace(/-/g,'')
      : (ev.time
          ? ev.date.replace(/-/g,'') + 'T' + ev.time.replace(':','') + '00'
          : ev.date.replace(/-/g,''));
    const summary = (ev.emoji ? ev.emoji + ' ' : '') + ev.title;
    const created = new Date(typeof ev.id === 'number' ? ev.id : Date.now())
      .toISOString().replace(/[-:]/g,'').slice(0,15) + 'Z';

    lines.push('BEGIN:VEVENT');
    lines.push('UID:' + uid);
    lines.push('SUMMARY:' + escapeIcal(summary));
    if (ev.time) {
      lines.push('DTSTART:' + dtstart);
      lines.push('DTEND:' + dtend);
    } else {
      lines.push('DTSTART;VALUE=DATE:' + dtstart);
      lines.push('DTEND;VALUE=DATE:' + dtend);
    }
    if (ev.note) lines.push('DESCRIPTION:' + escapeIcal(ev.note));
    lines.push('DTSTAMP:' + created);
    if (ev.repeat) {
      const freqMap = { daily:'DAILY', weekly:'WEEKLY', monthly:'MONTHLY', yearly:'YEARLY' };
      let rrule = 'RRULE:FREQ=' + freqMap[ev.repeat];
      if (ev.repeatEnd) rrule += ';UNTIL=' + ev.repeatEnd.replace(/-/g,'');
      lines.push(rrule);
    }
    lines.push('END:VEVENT');
  });

  lines.push('END:VCALENDAR');
  const icalStr = lines.join('\r\n');

  const result = await window.agenda.exportICal(icalStr);
  if (result.success) showToast({ title: 'Export iCal réussi !', type: 'task', emoji: '📅', _saved: true });
  else if (result.error) showToast({ title: 'Erreur export', type: 'reminder', emoji: '❌', _saved: true });
}

function escapeIcal(str) {
  return str.replace(/\\\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

function showToast(ev, isReminder = false) {
  const icons = { task:'✓', event:'◆', reminder:'⏰' };
  document.getElementById('toastIcon').textContent = ev.emoji || (isReminder ? '🔔' : icons[ev.type] || '📅');
  document.getElementById('toastMsg').textContent = isReminder
    ? `Rappel : ${ev.title}${ev.time ? ' à ' + ev.time : ''}`
    : ev._saved ? `"${ev.title}" enregistré !` : `${ev.title}${ev.time ? ' · ' + ev.time : ''}`;
  const toast = document.getElementById('toast');
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3500);
}

init();