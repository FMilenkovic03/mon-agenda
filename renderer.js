const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const DAYS_SHORT = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];
const today = new Date();

let currentYear = today.getFullYear();
let currentMonth = today.getMonth();
let selectedDay = today.getDate();
let selectedType = 'task';
let editingId = null;
let events = [];
let currentView = 'month';
let refDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

// ── INIT ──────────────────────────────────────
async function init() {
  events = await window.agenda.loadEvents();
  bindEvents();
  render();
}

// ── EVENT LISTENERS ───────────────────────────
function bindEvents() {
  // Navigation
  document.getElementById('btnPrev').addEventListener('click', navigatePrev);
  document.getElementById('btnNext').addEventListener('click', navigateNext);
  document.getElementById('btnMiniPrev').addEventListener('click', navigatePrev);
  document.getElementById('btnMiniNext').addEventListener('click', navigateNext);

  // Vues
  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.addEventListener('click', () => setView(btn.dataset.view));
  });

  // Nouveau
  document.getElementById('btnNew').addEventListener('click', () => openModal());

  // Modal
  document.getElementById('btnModalClose').addEventListener('click', closeModal);
  document.getElementById('btnCancel').addEventListener('click', closeModal);
  document.getElementById('btnSave').addEventListener('click', saveEvent);
  document.getElementById('btnDelete').addEventListener('click', deleteEvent);

  // Fermer en cliquant l'overlay
  document.getElementById('modalOverlay').addEventListener('click', (e) => {
    if (e.target.id === 'modalOverlay') closeModal();
  });

  // Type selector
  document.querySelectorAll('.type-opt').forEach(btn => {
    btn.addEventListener('click', () => selectType(btn.dataset.type));
  });
}

// ── NAVIGATION ────────────────────────────────
function setView(v) {
  currentView = v;
  if (v === 'week' || v === 'day') {
    refDate = new Date(currentYear, currentMonth, selectedDay);
  }
  document.querySelectorAll('.view-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.view === v);
  });
  render();
}

function navigatePrev() {
  if (currentView === 'month') {
    currentMonth--;
    if (currentMonth < 0) { currentMonth = 11; currentYear--; }
  } else if (currentView === 'week') {
    refDate = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate() - 7);
  } else {
    refDate = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate() - 1);
  }
  render();
}

function navigateNext() {
  if (currentView === 'month') {
    currentMonth++;
    if (currentMonth > 11) { currentMonth = 0; currentYear++; }
  } else if (currentView === 'week') {
    refDate = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate() + 7);
  } else {
    refDate = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate() + 1);
  }
  render();
}

// ── RENDER PRINCIPAL ──────────────────────────
function render() {
  updateLabel();
  renderMiniCalendar();
  renderUpcoming();
  const area = document.getElementById('calendarArea');
  area.innerHTML = '';
  if (currentView === 'month') renderMonth(area);
  else renderWeek(area, currentView === 'week' ? 7 : 1);
}

function updateLabel() {
  let label = '';
  if (currentView === 'month') {
    label = `${MONTHS[currentMonth]} ${currentYear}`;
  } else if (currentView === 'week') {
    const mon = getMondayOf(refDate);
    const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
    label = mon.getMonth() === sun.getMonth()
      ? `${mon.getDate()} – ${sun.getDate()} ${MONTHS[mon.getMonth()]} ${mon.getFullYear()}`
      : `${mon.getDate()} ${MONTHS[mon.getMonth()].slice(0,3)} – ${sun.getDate()} ${MONTHS[sun.getMonth()].slice(0,3)} ${sun.getFullYear()}`;
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
    h.textContent = d;
    headers.appendChild(h);
  });
  area.appendChild(headers);

  const grid = document.createElement('div');
  grid.className = 'cal-grid';

  getMonthCells(currentYear, currentMonth).forEach(c => {
    const cell = document.createElement('div');
    cell.className = 'cal-cell';
    if (c.other) cell.classList.add('other-month');
    if (c.dateStr === dateToStr(today)) cell.classList.add('today');
    if (!c.other && c.day === selectedDay && c.month === currentMonth) cell.classList.add('selected');

    const num = document.createElement('div');
    num.className = 'cell-num';
    num.textContent = c.day;
    cell.appendChild(num);

    events.filter(e => e.date === c.dateStr).slice(0, 3).forEach(ev => {
      const el = document.createElement('div');
      el.className = `cal-event type-${ev.type}`;
      el.textContent = (ev.time ? ev.time + ' ' : '') + ev.title; // textContent = sûr
      el.addEventListener('click', e => { e.stopPropagation(); openModal(null, ev); });
      cell.appendChild(el);
    });

    cell.addEventListener('click', () => {
      if (!c.other) { selectedDay = c.day; render(); }
      openModal(c.dateStr);
    });

    grid.appendChild(cell);
  });
  area.appendChild(grid);
}

// ── VUE SEMAINE / JOUR ────────────────────────
function renderWeek(area, numDays) {
  const HOUR_H = 52;
  const startDate = numDays === 1 ? new Date(refDate) : getMondayOf(refDate);
  const days = Array.from({length: numDays}, (_, i) => {
    const d = new Date(startDate); d.setDate(startDate.getDate() + i); return d;
  });
  const colClass = numDays === 7 ? 'cols-7' : 'cols-1';

  // Header jours
  const header = document.createElement('div');
  header.className = `week-header ${colClass}`;
  const spacer = document.createElement('div');
  spacer.className = 'week-header-spacer';
  header.appendChild(spacer);

  days.forEach(d => {
    const dh = document.createElement('div');
    dh.className = 'week-day-header';
    if (dateToStr(d) === dateToStr(today)) dh.classList.add('is-today');

    const dayName = document.createElement('div');
    dayName.className = 'week-day-name';
    dayName.textContent = DAYS_SHORT[(d.getDay()+6)%7];

    const dayNum = document.createElement('div');
    dayNum.className = 'week-day-num';
    dayNum.textContent = d.getDate();

    dh.appendChild(dayName);
    dh.appendChild(dayNum);

    // Events sans heure
    events.filter(e => e.date === dateToStr(d) && !e.time).forEach(ev => {
      const el = document.createElement('div');
      el.className = `allday-event type-${ev.type}`;
      el.textContent = ev.title; // textContent = sûr
      el.addEventListener('click', e => { e.stopPropagation(); openModal(null, ev); });
      dh.appendChild(el);
    });

    dh.addEventListener('click', () => { refDate = new Date(d); setView('day'); });
    header.appendChild(dh);
  });
  area.appendChild(header);

  // Body
  const body = document.createElement('div');
  body.className = 'week-body';

  // Colonne heures
  const timeCol = document.createElement('div');
  timeCol.className = 'week-time-col';
  const timeInner = document.createElement('div');
  timeInner.className = 'week-time-inner';
  for (let h = 0; h < 24; h++) {
    const label = document.createElement('div');
    label.className = 'time-slot-label';
    label.textContent = h === 0 ? '' : `${String(h).padStart(2,'0')}:00`;
    timeInner.appendChild(label);
  }
  timeCol.appendChild(timeInner);
  body.appendChild(timeCol);

  // Colonnes jours
  const colsWrapper = document.createElement('div');
  colsWrapper.className = 'week-cols-wrapper';
  const colsScroll = document.createElement('div');
  colsScroll.className = `week-cols-scroll ${colClass}`;

  days.forEach(d => {
    const col = document.createElement('div');
    col.className = 'week-col';
    col.style.minHeight = (HOUR_H * 24) + 'px';

    for (let h = 0; h < 24; h++) {
      const line = document.createElement('div');
      line.className = 'hour-line'; line.style.top = (h * HOUR_H) + 'px';
      col.appendChild(line);
      const half = document.createElement('div');
      half.className = 'hour-line half'; half.style.top = (h * HOUR_H) + 'px';
      col.appendChild(half);
    }

    col.addEventListener('click', (e) => {
      if (e.target !== col) return;
      const rect = col.getBoundingClientRect();
      const y = e.clientY - rect.top + colsScroll.scrollTop;
      const hour = Math.floor(y / HOUR_H);
      const min = (y % HOUR_H) < 26 ? '00' : '30';
      openModal(dateToStr(d), null, `${String(Math.min(hour,23)).padStart(2,'0')}:${min}`);
    });

    events.filter(e => e.date === dateToStr(d) && e.time).forEach(ev => {
      const [h, m] = ev.time.split(':').map(Number);
      const top = h * HOUR_H + (m / 60) * HOUR_H;
      const el = document.createElement('div');
      el.className = `week-event type-${ev.type}`;
      el.style.top = top + 'px';
      el.style.height = HOUR_H + 'px';

      const title = document.createElement('div');
      title.className = 'week-event-title';
      title.textContent = ev.title; // textContent = sûr

      const time = document.createElement('div');
      time.className = 'week-event-time';
      time.textContent = ev.time; // textContent = sûr

      el.appendChild(title);
      el.appendChild(time);
      el.addEventListener('click', e => { e.stopPropagation(); openModal(null, ev); });
      col.appendChild(el);
    });

    if (dateToStr(d) === dateToStr(today)) {
      const nowLine = document.createElement('div');
      nowLine.className = 'now-line';
      nowLine.style.top = (today.getHours() * HOUR_H + (today.getMinutes() / 60) * HOUR_H) + 'px';
      col.appendChild(nowLine);
    }

    colsScroll.appendChild(col);
  });

  colsWrapper.appendChild(colsScroll);
  body.appendChild(colsWrapper);
  area.appendChild(body);

  // Sync scroll
  colsScroll.addEventListener('scroll', () => {
    timeInner.style.transform = `translateY(-${colsScroll.scrollTop}px)`;
  });

  setTimeout(() => {
    colsScroll.scrollTop = Math.max(0, today.getHours() * HOUR_H - 120);
  }, 50);
}

// ── HELPERS ───────────────────────────────────
function fmtDate(y, m, d) {
  const date = new Date(y, m, d);
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}

function dateToStr(date) {
  return fmtDate(date.getFullYear(), date.getMonth(), date.getDate());
}

function getMondayOf(date) {
  const d = new Date(date);
  const dow = d.getDay();
  d.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1));
  return d;
}

function getMonthCells(year, month) {
  const firstDay = new Date(year, month, 1);
  let startDow = firstDay.getDay();
  startDow = startDow === 0 ? 6 : startDow - 1;
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

function renderMiniCalendar() {
  const grid = document.getElementById('miniGrid');
  grid.innerHTML = '';
  ['L','M','M','J','V','S','D'].forEach(d => {
    const el = document.createElement('div');
    el.className = 'mini-wday';
    el.textContent = d;
    grid.appendChild(el);
  });
  getMonthCells(currentYear, currentMonth).slice(0, 35).forEach(c => {
    const el = document.createElement('div');
    el.className = 'mini-d';
    el.textContent = c.day;
    if (c.other) el.style.opacity = '0.2';
    if (c.dateStr === dateToStr(today)) el.classList.add('today');
    if (!c.other && c.day === selectedDay && c.month === currentMonth) el.classList.add('selected');
    if (events.some(e => e.date === c.dateStr)) el.classList.add('has-event');
    el.addEventListener('click', () => {
      if (!c.other) {
        selectedDay = c.day;
        refDate = new Date(c.year, c.month, c.day);
        render();
      }
    });
    grid.appendChild(el);
  });
}

function renderUpcoming() {
  const list = document.getElementById('upcomingList');
  list.innerHTML = '';
  const todayStr = dateToStr(today);
  const tomorrowStr = fmtDate(today.getFullYear(), today.getMonth(), today.getDate()+1);
  const upcoming = events
    .filter(e => e.date >= todayStr)
    .sort((a,b) => a.date.localeCompare(b.date) || (a.time||'').localeCompare(b.time||''))
    .slice(0, 6);

  if (!upcoming.length) {
    const empty = document.createElement('div');
    empty.style.cssText = 'color:var(--muted);font-size:12px;text-align:center;padding:16px 0';
    empty.textContent = 'Aucun événement à venir';
    list.appendChild(empty);
    return;
  }

  upcoming.forEach(ev => {
    const el = document.createElement('div');
    el.className = `upcoming-item type-${ev.type}`;

    const d = new Date(ev.date + 'T00:00:00');
    const label = ev.date === todayStr ? "Aujourd'hui"
      : ev.date === tomorrowStr ? 'Demain'
      : `${d.getDate()} ${MONTHS[d.getMonth()].slice(0,3)}`;

    const titleEl = document.createElement('div');
    titleEl.className = 'ev-title';
    titleEl.textContent = ev.title; // textContent = sûr

    const timeEl = document.createElement('div');
    timeEl.className = 'ev-time';
    timeEl.textContent = label + (ev.time ? ' · ' + ev.time : ''); // textContent = sûr

    el.appendChild(titleEl);
    el.appendChild(timeEl);
    el.addEventListener('click', () => openModal(null, ev));
    list.appendChild(el);
  });
}

// ── MODAL ─────────────────────────────────────
function openModal(dateStr = null, existingEvent = null, timeStr = '') {
  editingId = existingEvent ? existingEvent.id : null;
  document.getElementById('modalTitle').textContent = existingEvent ? 'Modifier' : 'Nouvel événement';
  document.getElementById('evDate').value = existingEvent ? existingEvent.date : (dateStr || fmtDate(currentYear, currentMonth, selectedDay));
  document.getElementById('evTitle').value = existingEvent ? existingEvent.title : '';
  document.getElementById('evTime').value = existingEvent ? existingEvent.time : timeStr;
  document.getElementById('evNote').value = existingEvent ? (existingEvent.note || '') : '';
  document.getElementById('evReminder').value = existingEvent ? existingEvent.reminder : '';
  selectType(existingEvent ? existingEvent.type : 'task');
  document.getElementById('btnDelete').style.display = existingEvent ? 'flex' : 'none';
  document.getElementById('modalOverlay').classList.add('open');
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
  ['evTitle','evTime','evNote'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('evReminder').value = '';
  selectType('task');
}

function selectType(type) {
  selectedType = type;
  document.querySelectorAll('.type-opt').forEach(btn => {
    btn.className = 'type-opt';
    if (btn.dataset.type === type) btn.classList.add(`active-${type}`);
  });
}

async function saveEvent() {
  const title = document.getElementById('evTitle').value.trim();
  if (!title) { document.getElementById('evTitle').focus(); return; }
  const ev = {
    id: editingId || Date.now(),
    title,
    type: selectedType,
    date: document.getElementById('evDate').value,
    time: document.getElementById('evTime').value,
    note: document.getElementById('evNote').value,
    reminder: document.getElementById('evReminder').value,
    _notified: false
  };
  events = editingId ? events.map(e => e.id === editingId ? ev : e) : [...events, ev];
  await window.agenda.saveEvents(events);
  closeModal();
  render();
  showToast({ ...ev, _saved: true });
}

async function deleteEvent() {
  if (!editingId) return;
  events = events.filter(e => e.id !== editingId);
  await window.agenda.saveEvents(events);
  closeModal();
  render();
  showToast({ title: 'Événement supprimé', type: 'task', _saved: true });
}

// ── TOAST ─────────────────────────────────────
function showToast(ev, isReminder = false) {
  const icons = { task:'✓', event:'◆', reminder:'⏰' };
  document.getElementById('toastIcon').textContent = isReminder ? '🔔' : icons[ev.type] || '📅';
  document.getElementById('toastMsg').textContent = isReminder
    ? `Rappel : ${ev.title}${ev.time ? ' à ' + ev.time : ''}`
    : ev._saved ? `"${ev.title}" enregistré !` : `${ev.title}${ev.time ? ' · ' + ev.time : ''}`;
  const toast = document.getElementById('toast');
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3500);
}

// ── START ──────────────────────────────────────
init();