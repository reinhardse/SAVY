const SRC = {instagram: 'Instagram', youtube: 'YouTube', telegram: 'Telegram', tiktok: 'TikTok', litres: 'Литрес', kinopoisk: 'Кинопоиск', web: 'Сайт'};
// «сегодня» и смена дня — по Москве, на любом устройстве: все даты приложения считаются по московскому времени
const MSK_TZ = 'Europe/Moscow';
const nowMsk = () => {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {timeZone: MSK_TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23'}).formatToParts(new Date()).map(x => [x.type, x.value]));
  return new Date(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
};
const TYPE = {video: 'Видео', article: 'Статья', book: 'Книга', place: 'Место', product: 'Товар', image: 'Изображение', note: 'Заметка', other: 'Материал'};
const SV = 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"';
const NAV = [
  ['home', 'Главная', `<svg ${SV}><path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/></svg>`],
  ['inbox', 'Входящие', `<svg ${SV}><path d="M3 13l2.5-7.5A2 2 0 0 1 7.4 4h9.2a2 2 0 0 1 1.9 1.5L21 13"/><path d="M3 13v5a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5h-5l-1.5 2.5h-5L8 13z"/></svg>`],
  ['all', 'Все', `<svg ${SV}><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></svg>`],
];
// стили стандартных категорий
const COL = {
  watch:  {bg: '#e9eafb', tc: '#3b3f9a', c1: '#6c7bff', c2: '#a3adff'},
  read:   {bg: '#e7f3ec', tc: '#2f6446', c1: '#3fa975', c2: '#8ad6ae'},
  ideas:  {bg: '#f8ebe0', tc: '#7a4f2e', c1: '#f08a3c', c2: '#f9c58f'},
  places: {bg: '#ece7f7', tc: '#5a4680', c1: '#8b6fe0', c2: '#c4b3f5'},
  buy:    {bg: '#fbe7f1', tc: '#8a3462', c1: '#e8609c', c2: '#f7a9cc'},
};
// стили новых категорий: выбираются по коду, цвет не меняется
const PAL = [
  {bg: '#fbeeee', tc: '#8a3b3b', c1: '#e46b6b', c2: '#f6b3b3'},
  {bg: '#e4f1fb', tc: '#2c5a7d', c1: '#4aa3dc', c2: '#a6d4f2'},
  {bg: '#fbf4d9', tc: '#7a6418', c1: '#e2b324', c2: '#f5df8f'},
  {bg: '#eeeff2', tc: '#3d3f45', c1: '#7d828c', c2: '#c5c9d1'},
];
const DEF_COVER = {c1: '#8e99ad', c2: '#c9d0dc'};
const ICONS = {
  watch: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M10 9l5 3-5 3z" fill="currentColor"/></svg>',
  read: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M2 5h7a3 3 0 0 1 3 3v12a2 2 0 0 0-2-2H2z"/><path d="M22 5h-7a3 3 0 0 0-3 3v12a2 2 0 0 1 2-2h8z"/></svg>',
  ideas: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/></svg>',
  places: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 21s-7-6.2-7-11.2A7 7 0 0 1 19 9.8C19 14.8 12 21 12 21z"/><circle cx="12" cy="10" r="2.6"/></svg>',
  buy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 7h14l-1.2 12.2a1 1 0 0 1-1 .8H7.2a1 1 0 0 1-1-.8z"/><path d="M9 7a3 3 0 0 1 6 0"/></svg>',
};
const LOUPE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/></svg>';
const BACK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="M11 6l-6 6 6 6"/></svg>';
const LIST_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>';
const TILES_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="4" y="4" width="6.5" height="6.5" rx="1.8"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.8"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.8"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.8"/></svg>';
const XICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';
const HOME_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/></svg>';
const INBOX_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 13l2.5-7.5A2 2 0 0 1 7.4 4h9.2a2 2 0 0 1 1.9 1.5L21 13"/><path d="M3 13v5a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5h-5l-1.5 2.5h-5L8 13z"/></svg>';
const FOLDER_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>';
const INBOX_STYLE = {bg: '#e7edff', tc: '#2f4bb0'};
const ALL_STYLE = {bg: '#fbf1c4', tc: '#7a5b00'};
const APP_ICON_SAVE = '<svg viewBox="0 0 24 24" fill="#ff385c"><path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4.5L5 21V4a1 1 0 0 1 1-1z"/></svg>';
const KB_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><rect x="3" y="4" width="5" height="16" rx="1.5"/><rect x="10" y="4" width="5" height="10" rx="1.5"/><rect x="17" y="4" width="4" height="13" rx="1.5"/></svg>';
const PLUS_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>';
const FULL_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h16M8 8l-4 4 4 4M16 8l4 4-4 4"/></svg>';
const RESTORE_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/></svg>';
const isFull = bid => { try { return localStorage.getItem('kb_full_' + bid) === '1'; } catch { return false; } };
const setFull = (bid, v) => { try { localStorage.setItem('kb_full_' + bid, v ? '1' : '0'); } catch {} };
const PEN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/></svg>';
// глаз: серый по умолчанию, пастельная зелёная галочка, когда материал проработан
const EYE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="5"/><path d="M7 12c1.5-2.5 3.2-3.8 5-3.8s3.5 1.3 5 3.8c-1.5 2.5-3.2 3.8-5 3.8S8.5 14.5 7 12z"/><circle cx="12" cy="12" r="1.7"/></svg>';
const EYE_ON = '<svg viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="5" fill="#dcf2e5" stroke="#3fa975" stroke-width="1.8"/><path d="M7.5 12.5l3 3 6-6.5" stroke="#3fa975" stroke-width="2.2"/></svg>';

const EYE_C = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/></svg>';
const CHECK_C = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const eyeChip = (done, attrs) => `<span class="tagbadge eyechip ${done ? 'on' : ''}" ${attrs} title="Прочитано">${done ? CHECK_C : EYE_C}</span>`;

let cats = [], q = '', pollLeft = 0, listParams = {}, searchTimer = null, openSearch = false;
// вид списка: строки или плитки; выбор запоминается в браузере
let viewMode = (() => { try { return localStorage.getItem('save_view') === 'tiles' ? 'tiles' : 'list'; } catch { return 'list'; } })();
let lastItems = [], lastEmpty = '';

const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const hostOf = u => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return u; } };

function styleOf(slug) {
  if (COL[slug]) return COL[slug];
  const h = [...String(slug)].reduce((a, c) => a + c.charCodeAt(0), 0);
  return PAL[h % PAL.length];
}

// Название: если сайт его не отдал, строим понятное из ссылки
function titleOf(i) {
  if (i.title) return i.title;
  let u; try { u = new URL(i.url); } catch { return i.url; }
  if (i.source === 'instagram') {
    const m = u.pathname.match(/\/(reel|p|tv)\/([^/]+)/);
    return m ? `${m[1] === 'reel' ? 'Reel' : m[1] === 'tv' ? 'IGTV' : 'Публикация'} ${m[2]} · Instagram` : 'Публикация в Instagram';
  }
  if (i.source === 'youtube') return 'Видео на YouTube';
  if (i.source === 'kinopoisk') return 'Фильм на Кинопоиске';
  if (i.source === 'litres') {
    // адрес вида /book/автор/название-ID/: берём название из адреса, без номера книги
    const parts = u.pathname.split('/').filter(Boolean);
    const slug = (parts[2] || parts[1] || '').replace(/-\d+$/, '').replace(/[-_]+/g, ' ').trim();
    if (slug) return slug.charAt(0).toUpperCase() + slug.slice(1) + ' · Литрес';
    return 'Книга на Литрес';
  }
  const last = decodeURIComponent(u.pathname.split('/').filter(Boolean).pop() || '');
  const words = last.replace(/[-_]+/g, ' ').replace(/\.\w{2,5}$/, '').trim();
  return words ? `${words} · ${hostOf(i.url)}` : hostOf(i.url);
}

// Обложка: настоящая картинка, а если её нет, сгенерированная из названия
function coverHtml(i, cls) {
  if (i.thumb) return `<img class="${cls}" src="${esc(i.thumb)}" loading="lazy" alt="">`;
  const st = i.category ? styleOf(i.category) : DEF_COVER;
  return `<div class="${cls} cover-gen" style="--c1:${st.c1};--c2:${st.c2}"><span>${esc(titleOf(i))}</span></div>`;
}

async function api(path, opt = {}) {
  const r = await fetch('/api' + path, {
    credentials: 'same-origin', method: opt.method || 'GET',
    headers: {'Content-Type': 'application/json'},
    body: opt.body ? JSON.stringify(opt.body) : undefined,
  });
  if (r.status === 401) { showLogin(); throw new Error('401'); }
  if (!r.ok) { let m = 'Ошибка'; try { m = (await r.json()).detail || m; } catch {} throw new Error(m); }
  return r.json();
}

/* ---------- вход ---------- */
function showLogin() {
  setHubButton(false);
  $('#sheet-root').innerHTML = '';
  $('#app').classList.remove('kfull'); // ширина меняется в ту же секунду, что и страница — без промежуточного скачка
  $('#app').innerHTML = `<form class="login" id="lf"><div class="brand logo">СЕЙВ</div>
    <input class="in-text" type="password" id="pw" placeholder="Пароль" autofocus>
    <div class="err" id="le"></div><button class="btn pri">Войти</button></form>`;
  $('#lf').onsubmit = async e => {
    e.preventDefault();
    try { await api('/login', {method: 'POST', body: {password: $('#pw').value}}); await start(); }
    catch (err) { $('#le').textContent = err.message === '401' ? 'Неверный пароль' : err.message; }
  };
}

/* ---------- каркас ---------- */
// боковое меню убрано: разделы открываются плитками на главной
function nav() { return ''; }

function pasteHtml() {
  return `<div class="paste"><input id="paste" placeholder="Вставить ссылку" inputmode="url" autocapitalize="off"><button class="paste-go" id="pastego" aria-label="Добавить"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg></button></div>`;
}

function bindPaste() {
  const inp = $('#paste');
  if (!inp) return;
  const go = async () => {
    const url = inp.value.trim();
    if (!url) return;
    inp.value = ''; inp.disabled = true; inp.placeholder = 'Добавляю…';
    sheet('<div class="sheet-loading"><div class="spin"></div><div>Добавляю ссылку</div></div>');
    try {
      const r = await api('/items', {method: 'POST', body: {url}});
      pollLeft = 6;
      if (!r.created) alert('Эта ссылка уже в библиотеке');
      await openItem(r.item.id);
    } catch (err) { closeSheet(); alert(err.message); }
    finally { inp.disabled = false; inp.placeholder = 'Вставить ссылку'; }
  };
  inp.onpaste = () => setTimeout(go, 0);
  const goBtn = $('#pastego');
  if (goBtn) goBtn.onclick = go;
  inp.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); go(); } };
}


// ===== входящие: строка добавления и перенос в Сейв или на доску =====
let inDest = {kind: 'inbox', name: 'Входящие'};
const inboxAddHtml = () => `<div class="inadd"><input id="inTxt" placeholder="Вставить ссылку или написать задачу" autocapitalize="off"><button class="inchip" id="inDestBtn">${esc(inDest.name)} ▾</button><button class="paste-go" id="inGo" aria-label="Добавить"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg></button></div>`;
let inPop = null;
const closeInPop = () => { if (inPop) { inPop.remove(); inPop = null; } document.removeEventListener('mousedown', inPopOut, true); };
const inPopOut = e => { if (inPop && !inPop.contains(e.target) && !e.target.closest('#inDestBtn, [data-mvitem]')) closeInPop(); };
// окно выбора места: «Входящие», категории Сейва, доски с колонками
async function openInPop(anchor, onPick) {
  closeInPop();
  const [cs, bs] = await Promise.all([api('/categories').catch(() => []), api('/boards').catch(() => [])]);
  const work = bs.filter(b => (b.status || 'work') === 'work');
  const details = await Promise.all(work.map(b => api('/boards/' + b.id).catch(() => null)));
  const r = anchor.getBoundingClientRect();
  const pop = document.createElement('div');
  pop.className = 'inpop';
  pop.innerHTML = `<button class="pi" data-k="inbox" data-name="Входящие">Входящие</button>`
    + (cs.length ? `<div class="sec">Сейв</div>` + cs.map(c => `<button class="pi" data-k="cat" data-slug="${esc(c.slug)}" data-name="${esc(c.name)}">${esc(c.name)}</button>`).join('') : '')
    + (work.length ? `<div class="sec">Доски</div>` + work.map((b, i) => `<div class="pb">${esc(b.name)}</div>` + ((details[i] && details[i].columns) || []).map(col => `<button class="pi sub" data-k="col" data-col="${col.id}" data-name="${esc(b.name)} · ${esc(col.name)}">${esc(col.name)}</button>`).join('')).join('') : '');
  document.body.appendChild(pop);
  pop.style.top = (r.bottom + 6) + 'px';
  pop.style.left = Math.max(8, Math.min(r.left, window.innerWidth - pop.offsetWidth - 8)) + 'px';
  pop.onclick = e => {
    const b = e.target.closest('.pi');
    if (!b) return;
    const d = {kind: b.dataset.k, name: b.dataset.name, slug: b.dataset.slug, col: b.dataset.col};
    closeInPop();
    onPick(d);
  };
  inPop = pop;
  setTimeout(() => document.addEventListener('mousedown', inPopOut, true), 0);
}
const looksLikeLink = s => /^https?:\/\//i.test(s) || /^[^\s]+\.[^\s]{2,}/.test(s);
async function inboxSend() {
  const inp = $('#inTxt');
  const txt = inp.value.trim();
  if (!txt) return;
  try {
    if (inDest.kind === 'col') {
      await api('/columns/' + inDest.col + '/cards', {method: 'POST', body: {title: txt}});
    } else {
      if (!looksLikeLink(txt)) { alert('Пока в Сейв и во входящие сохраняются только ссылки. Текст можно отправить на доску.'); return; }
      const body = {url: txt};
      if (inDest.kind === 'cat') body.category = inDest.slug;
      const r = await api('/items', {method: 'POST', body});
      if (!r.created) alert('Эта ссылка уже в библиотеке');
    }
    inp.value = '';
    loadList();
  } catch (err) { alert(err.message); }
}
async function inboxMove(id, d) {
  try {
    if (d.kind === 'col') {
      const it = lastItems.find(x => x.id === id) || {};
      await api('/columns/' + d.col + '/cards', {method: 'POST', body: {title: it.title || it.url || 'Без названия'}});
      await api('/items/' + id, {method: 'PATCH', body: {status: 'archived'}});
    } else if (d.kind === 'cat') {
      await api('/items/' + id, {method: 'PATCH', body: {category: d.slug}});
    }
    loadList();
  } catch (err) { alert(err.message); }
}
function bindInbox() {
  const btn = $('#inDestBtn');
  if (btn) btn.onclick = () => openInPop(btn, d => { inDest = d; const b = $('#inDestBtn'); if (b) b.textContent = d.name + ' ▾'; });
  const go = $('#inGo');
  if (go) go.onclick = inboxSend;
  const inp = $('#inTxt');
  if (inp) inp.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); inboxSend(); } };
  const list = $('#list');
  if (list) list.onclick = e => {
    const mv = e.target.closest('[data-mvitem]');
    if (!mv) return;
    e.stopPropagation();
    const id = +mv.dataset.mvitem;
    openInPop(mv, d => inboxMove(id, d));
  };
}

// строка материала: обложка, название, источник и карандаш, теги под ними; справа глаз и крестик
function row(i) {
  const wait = i.meta_state === 'pending' ? ' · собираю данные…' : '';
  const cat = cats.find(c => c.slug === i.category);
  const meta = [SRC[i.source], cat ? cat.name : 'Без категории'].join(' · ') + wait;
  const eye = eyeChip(i.done, `data-done="${i.id}"`);
  // описание: первые 130 символов (для фильмов и книг — 200), дальше «…» — нажатие открывает карточку, чтобы дочитать
  const d = (i.description || '').replace(/\s+/g, ' ').trim();
  const LIMIT = viewMode === 'tiles' ? 60 : ['kinopoisk', 'litres'].includes(i.source) ? 200 : 130;
  // обрезаем по целому слову; последнее слово и «…» держатся вместе, чтобы многоточие не уезжало на новую строку
  let body = esc(d);
  if (d.length > LIMIT) {
    const part = d.slice(0, LIMIT);
    const sp = part.lastIndexOf(' ');
    const head = sp > 0 ? part.slice(0, sp) : part;
    const tail = sp > 0 ? part.slice(sp + 1) : '';
    body = `${esc(head)} <span class="nw">${esc(tail)}<button class="more-d" data-id="${i.id}" aria-label="Дочитать">…</button></span>`;
  }
  const desc = d ? `<div class="rdesc">${body}</div>` : '';
  const tags = `${desc}<div class="tagline">${eye}${i.tags.map(t => `<span class="tagbadge">#${esc(t)}</span>`).join('')}</div>`;
  return `<div class="row" data-url="${esc(i.url)}">${coverHtml(i, 'thumb')}<div class="mid"><div class="t">${esc(titleOf(i))}</div><div class="m"><span>${esc(meta)}</span><button class="rb pen" data-id="${i.id}" aria-label="Открыть карточку">${PEN}</button></div>${tags}</div>${listParams && listParams.inbox ? `<button class="inmove" data-mvitem="${i.id}">Перенести</button>` : ''}<button class="rb del" data-id="${i.id}" aria-label="Удалить">${XICON}</button></div>`;
}

// перерисовываем список только если что-то изменилось, иначе клик теряется между опросами
function paint(el, html) {
  if (el.dataset.h === html) return;
  if ($('#ov') && el.dataset.h !== undefined) return; // окно открыто: список обновится после закрытия
  el.innerHTML = html;
  el.dataset.h = html;
  bindRows();
}

const viewIcon = () => viewMode === 'tiles' ? TILES_ICON : LIST_ICON; // значок показывает текущий вид
const viewBtn = () => `<button class="iconbtn" id="vbtn" aria-label="Вид списка" title="${viewMode === 'tiles' ? 'Строки' : 'Плитки'}">${viewIcon()}</button>`;

function paintList(el, items, empty) {
  lastItems = items; lastEmpty = empty;
  el.classList.toggle('grid', viewMode === 'tiles');
  paint(el, items.length ? items.map(row).join('') : empty);
}

function toggleView() {
  viewMode = viewMode === 'tiles' ? 'list' : 'tiles';
  try { localStorage.setItem('save_view', viewMode); } catch {}
  const b = $('#vbtn');
  if (b) { b.innerHTML = viewIcon(); b.title = viewMode === 'tiles' ? 'Строки' : 'Плитки'; }
  const el = $('#list');
  if (!el) return;
  delete el.dataset.h;
  paintList(el, lastItems, lastEmpty);
}

// только внутри страницы: кнопки открытой карточки обслуживает своя логика
function bindRows() {
  const app = $('#app');
  app.querySelectorAll('.row').forEach(el => el.onclick = e => {
    if (e.target.closest('.rb, .eyechip, .more-d, .inmove')) return;
    window.open(el.dataset.url, '_blank', 'noopener');
  });
  app.querySelectorAll('.rb.pen, .more-d').forEach(b => b.onclick = e => { e.stopPropagation(); openItem(+b.dataset.id); });
  app.querySelectorAll('.eyechip').forEach(b => b.onclick = async e => {
    e.stopPropagation();
    const on = !b.classList.contains('on');
    await api('/items/' + b.dataset.done, {method: 'PATCH', body: {done: on}});
    route();
  });
  app.querySelectorAll('.rb.del').forEach(b => b.onclick = async e => {
    e.stopPropagation();
    if (!confirm('Удалить материал?')) return;
    await api('/items/' + b.dataset.id, {method: 'DELETE'});
    route();
  });
}

/* ---------- главная ---------- */
async function home() {
  const [me, items, tags, conf, inbox] = await Promise.all([api('/me'), api('/items?limit=15'), api('/tags'), api('/settings'), api('/inbox/stats')]);
  cats = me.categories;
  const homeEmpty = '<div class="empty">Пока пусто. Вставьте ссылку выше.</div>';
  lastItems = items; lastEmpty = homeEmpty;
  const listHtml = items.length ? items.map(row).join('') : homeEmpty;
  const tile = (go, st, icon, count, label) => `<button class="tile" style="--c:${st.bg};--tc:${st.tc}" data-go="${go}"><div class="ic">${icon}</div><div class="tf"><div class="n">${count}</div><div class="l">${esc(label)}</div></div></button>`;
  const catTiles = me.categories.map(c => tile('#/cat/' + c.slug, styleOf(c.slug), ICONS[c.slug] || FOLDER_ICON, c.count, c.name)).join('');
  // порядок: «Входящие», «Все», затем категории в порядке создания (новые — в конце)
  const tilesHtml = tile('#/all', ALL_STYLE, TILES_ICON, me.total, 'Все') + catTiles;
  $('#app').classList.remove('kfull'); // ширина меняется в ту же секунду, что и страница — без промежуточного скачка
  $('#app').innerHTML = `<div class="titlerow"><div class="brand logo" id="brandgo" style="cursor:pointer" title="Приложения">СЕЙВ</div>
      <div class="tr-actions"><button class="iconbtn" id="hsbtn" aria-label="Поиск">${LOUPE}</button></div></div>
    ${pasteHtml()}
    ${tags.length ? `<div class="tags home-tags">${tags.map(t => `<span class="tagchip" data-alltag="${esc(t.name)}">#${esc(t.name)}</span>`).join('')}</div>` : ''}
    <div class="tiles">${tilesHtml}</div>
    <div class="sechead"><h2>Последние сохранения</h2>${viewBtn()}</div>
    <div class="list${viewMode === 'tiles' ? ' grid' : ''}" id="list">${listHtml}</div>
    <div class="home-foot"><button class="linkbtn" id="kpset">${conf.kp_token_set ? 'Ключ Кинопоиска добавлен ✓ · изменить' : 'Добавить ключ Кинопоиска'}</button></div>`;
  document.querySelectorAll('[data-go]').forEach(t => t.onclick = () => { location.hash = t.dataset.go; });
  document.querySelectorAll('[data-alltag]').forEach(t => t.onclick = () => { location.hash = '#/tag/' + encodeURIComponent(t.dataset.alltag); });
  $('#kpset').onclick = () => openKpKey(conf.kp_token_set);
  $('#brandgo').onclick = () => { location.hash = '#/hub'; };
  $('#vbtn').onclick = toggleView;
  $('#hsbtn').onclick = () => { openSearch = true; if (location.hash === '#/all') route(); else location.hash = '#/all'; };
  bindPaste(); bindRows(); $('#list').dataset.h = listHtml;
  schedulePoll(items, homeList);
}

// на главной обновляем только список последних, без перерисовки всей страницы
async function homeList() {
  const items = await api('/items?limit=15');
  const el = $('#list');
  if (!el) return;
  paintList(el, items, '<div class="empty">Пока пусто. Вставьте ссылку выше.</div>');
  schedulePoll(items, homeList);
}

/* ---------- списки ---------- */
async function listView(title, params, active, withTags = false) {
  listParams = params;
  const wantSearch = openSearch; openSearch = false;
  $('#app').classList.remove('kfull'); // ширина меняется в ту же секунду, что и страница — без промежуточного скачка
  $('#app').innerHTML = `<div class="titlerow"><div class="brand">${esc(title)}</div>
      <div class="tr-actions">
      <button class="iconbtn" id="hbtn" aria-label="Главная">${HOME_ICON}</button>
      ${viewBtn()}<button class="iconbtn" id="sbtn" aria-label="Поиск">${LOUPE}</button></div></div>
    ${params.category || params.inbox ? '<div class="catsub" id="csub"></div>' : ''}
    ${active === 'inbox' ? inboxAddHtml() : ''}
    <input class="search" id="q" placeholder="Поиск" style="display:${q || wantSearch ? 'block' : 'none'}" value="${esc(q)}">
    ${withTags ? '<div class="tags" id="tags"></div>' : ''}
    <div class="list${viewMode === 'tiles' ? ' grid' : ''}" id="list"></div>${nav(active)}`;
  if (active === 'inbox') bindInbox(); else bindPaste();
  $('#vbtn').onclick = toggleView;
  // «Входящие» — отдельный раздел: кнопка «домой» ведёт на главную хаба, а не в Сейв
  $('#hbtn').onclick = () => { location.hash = active === 'inbox' ? '#/hub' : '#/home'; };
  if (wantSearch) setTimeout(() => $('#q').focus(), 0);
  $('#sbtn').onclick = () => {
    const box = $('#q');
    if (box.style.display === 'none') { box.style.display = 'block'; box.focus(); }
    else { box.style.display = 'none'; if (q) { q = ''; box.value = ''; loadList(); } }
  };
  $('#q').oninput = e => { q = e.target.value; clearTimeout(searchTimer); searchTimer = setTimeout(loadList, 250); };
  if (withTags) await loadTags();
  pollLeft = 6;
  await loadList();
}

// Теги раздела с количеством и значок глаза с количеством прочитанного
function plural(n) {
  const a = n % 10, b = n % 100;
  if (a === 1 && b !== 11) return 'материал';
  if (a >= 2 && a <= 4 && (b < 12 || b > 14)) return 'материала';
  return 'материалов';
}

// Теги: «Все» появляется, когда тег есть; выбранный тег чёрный и фильтрует список.
// В прочитанном (глаз) теги те же, но только у прочитанных материалов
async function loadTags() {
  const el = $('#tags');
  if (!el) return;
  const cat = listParams.category;
  const inbox = !!listParams.inbox;
  const hasEye = !!cat || inbox;  // у категории и у входящих есть глаз (прочитанное)
  const doneOn = hasEye && listParams.status === 'done';
  const qs = new URLSearchParams();
  if (cat) { qs.set('category', cat); qs.set('all_status', '1'); }
  if (inbox) { qs.set('inbox', '1'); qs.set('all_status', '1'); }
  const [st, t] = await Promise.all([
    cat ? api('/categories/' + encodeURIComponent(cat) + '/stats') : inbox ? api('/inbox/stats') : Promise.resolve(null),
    api('/tags?' + qs),
  ]);
  if (st) { const sub = $('#csub'); if (sub) sub.textContent = `${st.count} ${plural(st.count)}`; }
  // «Все», теги и глаз работают одинаково: выбран один, остальные всегда видны
  const chips = [`<span class="tagchip ${!doneOn && !listParams.tag ? 'on' : ''}" data-all="1">Все</span>`];
  chips.push(...t.map(x => `<span class="tagchip ${!doneOn && listParams.tag === x.name ? 'on' : ''}" data-tag="${esc(x.name)}">#${esc(x.name)}<i class="cnt">${x.count}</i></span>`));
  if (hasEye) chips.push(`<span class="tagchip donechip ${doneOn ? 'on' : ''}" data-eye="1" title="Прочитано">${doneOn ? EYE_ON : EYE}<i class="cnt">${st.done}</i></span>`);
  el.innerHTML = chips.join('');
  el.querySelectorAll('[data-all]').forEach(b => b.onclick = () => { delete listParams.tag; delete listParams.status; loadTags(); loadList(); });
  el.querySelectorAll('[data-tag]').forEach(b => b.onclick = () => {
    const name = b.dataset.tag;
    if (!doneOn && listParams.tag === name) delete listParams.tag;
    else { listParams.tag = name; delete listParams.status; }
    loadTags(); loadList();
  });
  el.querySelectorAll('[data-eye]').forEach(b => b.onclick = () => {
    if (doneOn) delete listParams.status;
    else { listParams.status = 'done'; delete listParams.tag; }
    loadTags(); loadList();
  });
}

async function loadList() {
  const p = new URLSearchParams({...listParams, limit: 200});
  if (q) p.set('q', q);
  const items = await api('/items?' + p);
  const el = $('#list');
  if (!el) return;
  const empty = q ? 'Ничего не найдено' : listParams.status === 'done' ? 'Тут пусто' : 'Здесь пока пусто';
  paintList(el, items, `<div class="empty">${empty}</div>`);
  schedulePoll(items, loadList);
}

function schedulePoll(items, fn) {
  if (items.some(i => i.meta_state === 'pending') && pollLeft-- > 0) setTimeout(fn || route, 2500);
}

// название вкладки браузера: раздел, а на доске и в воронке — их название (задаётся при открытии)
function tabTitle(t) { document.title = t; }

async function route() {
  const [view, ...rest] = (location.hash.slice(2) || 'hub').split('/');
  const arg = decodeURIComponent(rest.join('/'));
  pollLeft = view === 'home' ? 6 : pollLeft;
  const tabs = {hub: 'Хаб', kanban: 'Доски', calendar: 'Календарь', crm: 'CRM', home: 'Сейф'};
  tabTitle(tabs[view] || 'Сейф');
  if (view === 'hub') return hub();
  if (view === 'kanban') return boards();
  if (view === 'calendar') return calendarPage();
  if (view === 'crm') return crmRoute(rest);
  if (view === 'board') return board(+arg);
  const map = {inbox: ['Входящие', {inbox: 1}], all: ['Все материалы', {}]};
  if (view === 'cat') {
    const c = cats.find(x => x.slug === arg);
    tabTitle(c ? c.name : 'Категория');
    return listView(c ? c.name : 'Категория', {category: arg}, 'all', true);
  }
  if (view === 'tag') { tabTitle('#' + arg); return listView('#' + arg, {tag: arg}, 'all'); }
  if (map[view]) { tabTitle(map[view][0]); return listView(map[view][0], map[view][1], view, view === 'all' || view === 'inbox'); }
  return home();
}

/* ---------- карточка материала: окно по центру ---------- */
let beforeClose = null; // сохранение перед закрытием окна (текст карточки)
async function closeSheet() {
  if (beforeClose) { const f = beforeClose; beforeClose = null; await f(); }
  $('#sheet-root').innerHTML = ''; route();
}

function sheet(html, cls = '') {
  beforeClose = null;
  let ov = $('#ov');
  if (!ov) {
    $('#sheet-root').innerHTML = `<div class="overlay" id="ov"><div class="sheet"></div></div>`;
    ov = $('#ov');
    ov.onclick = e => { if (e.target.id === 'ov') closeSheet(); };
  }
  ov.onclick = e => { if (e.target.id === 'ov') closeSheet(); }; // каждое окно сбрасывает прежний обработчик
  const box = ov.querySelector('.sheet');
  box.className = 'sheet ' + cls;
  box.innerHTML = html;
  // содержимое плавно проявляется, окно и его фон не перерисовываются
  box.classList.remove('swap'); void box.offsetWidth; box.classList.add('swap');
}

function autosize(el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; }

// состояние, с которым карточка сравнивается: то, что сохранено на сервере
function snapshot(it) {
  return {title: titleOf(it), description: it.description || '', category: it.category || null, tags: [...it.tags].sort(), done: !!it.done};
}

async function openItem(id) {
  let it = await api('/items/' + id);
  let allTagNames = (await api('/tags?all_status=1')).map(t => t.name);
  let base = snapshot(it);
  let draft = JSON.parse(JSON.stringify(base));
  const clone = o => JSON.parse(JSON.stringify(o));
  const isDirty = () => JSON.stringify(draft) !== JSON.stringify(base);

  const saveBtn = () => {
    const b = $('#sv');
    if (!b) return;
    const d = isDirty();
    b.className = 'savebtn ' + (d ? 'dirty' : 'saved');
    b.textContent = d ? 'Сохранить' : 'Сохранено';
    b.disabled = !d;
  };

  // категории: перерисовываются только свой блок, окно и прокрутка не трогаются
  const renderCats = () => {
    const box = $('#catbox');
    if (!box) return;
    box.innerHTML = cats.map(c => `<span class="chip ${draft.category === c.slug ? 'on' : ''}" data-cat="${esc(c.slug)}">${esc(c.name)}<i class="x" data-del="${esc(c.slug)}" title="Удалить категорию">×</i></span>`).join('')
      + `<span class="chip ${!draft.category ? 'on' : ''}" data-cat="">Без категории</span><span class="chip add" id="addcat">+ категория</span>`;
    box.querySelectorAll('[data-cat]').forEach(el => el.onclick = async e => {
      if (e.target.dataset.del) {
        const slug = e.target.dataset.del;
        if (!confirm('Удалить категорию? Материалы останутся без категории.')) return;
        await api('/categories/' + slug, {method: 'DELETE'});
        cats = await api('/categories');
        if (draft.category === slug) draft.category = null;
        if (base.category === slug) base.category = null;
      } else {
        draft.category = el.dataset.cat || null;
      }
      renderCats(); renderTags(); saveBtn();
    });
    $('#addcat').onclick = () => {
      $('#addcat').outerHTML = '<input class="chip-in" id="newcat" placeholder="Название категории">';
      const inp = $('#newcat'); inp.focus();
      inp.onkeydown = async e => {
        if (e.key === 'Escape') { renderCats(); return; }
        if (e.key !== 'Enter') return;
        const name = inp.value.trim();
        if (!name) return;
        const c = await api('/categories', {method: 'POST', body: {name}});
        cats = await api('/categories');
        draft.category = c.slug;
        renderCats(); renderTags(); saveBtn();
      };
      inp.onblur = () => { if (!inp.value.trim()) renderCats(); };
    };
  };

  // теги: глаз, все теги библиотеки (выбранные подсвечены) и «+ тег»
  const renderTags = () => {
    const box = $('#tagsbox');
    if (!box) return;
    const names = [...new Set([...allTagNames, ...draft.tags])].sort();
    box.innerHTML = eyeChip(draft.done, 'id="ceye"')
      + names.map(n => `<span class="tagbadge ${draft.tags.includes(n) ? '' : 'off'}" data-tt="${esc(n)}">#${esc(n)}</span>`).join('')
      + '<span class="tagbadge add" id="addtag">+ тег</span>';
    $('#ceye').onclick = () => { draft.done = !draft.done; renderTags(); saveBtn(); };
    box.querySelectorAll('[data-tt]').forEach(el => el.onclick = () => {
      const n = el.dataset.tt;
      draft.tags = draft.tags.includes(n) ? draft.tags.filter(t => t !== n) : [...draft.tags, n].sort();
      renderTags(); saveBtn();
    });
    $('#addtag').onclick = () => {
      $('#addtag').outerHTML = '<input class="chip-in" id="newtag" placeholder="Тег">';
      const inp = $('#newtag'); inp.focus();
      inp.onkeydown = e => {
        if (e.key === 'Escape') { renderTags(); return; }
        if (e.key !== 'Enter') return;
        const name = inp.value.trim().toLowerCase();
        if (!name) return;
        if (!allTagNames.includes(name)) allTagNames.push(name);
        draft.tags = [...new Set([...draft.tags, name])].sort();
        renderTags(); saveBtn();
      };
      inp.onblur = () => { if (!inp.value.trim()) renderTags(); };
    };
  };

  // окно собирается один раз; дальше меняются только блоки внутри него
  const build = () => {
    const meta = [SRC[it.source], TYPE[it.content_type]].filter(Boolean).join(' · ');
    const refreshBtn = it.thumb && it.title && it.meta_state === 'ok' && (!['kinopoisk', 'litres'].includes(it.source) || it.description) ? '' : '<button class="linkbtn" id="rf">Обновить данные</button>';
    sheet(`<button class="sheet-x" id="sx" aria-label="Закрыть">${XICON}</button>${coverHtml(it, 'cover')}
      <div class="sheet-body">
      <textarea class="title-in auto" id="ti" rows="1" maxlength="100" placeholder="Название">${esc(draft.title)}</textarea>
      <div class="metarow"><div class="meta-line">${esc(meta)}</div></div>
      <textarea class="desc-in auto" id="de" rows="1" placeholder="Описание">${esc(draft.description)}</textarea>
      ${it.meta_state === 'failed' ? '<p class="hint">Сайт не отдал название и картинку, поэтому они составлены из ссылки. Их можно поправить.</p>' : ''}
      ${refreshBtn}
      <div class="lbl">Категория</div>
      <div class="chips" id="catbox"></div>
      <div class="lbl">Теги</div>
      <div class="chips tagsbox" id="tagsbox"></div>
      <div class="btnrow">
        <div class="left">
          <a class="btn pri" href="${esc(it.url)}" target="_blank" rel="noopener">Смотреть</a>
          <button class="btn bad" id="dl">Удалить</button></div>
        <button class="savebtn" id="sv"></button>
      </div></div>`);
    $('#ov').querySelectorAll('textarea.auto').forEach(autosize);
    renderCats(); renderTags(); saveBtn();

    $('#sx').onclick = closeSheet;
    $('#ti').oninput = e => { draft.title = e.target.value.slice(0, 100); autosize(e.target); saveBtn(); };
    $('#de').oninput = e => { draft.description = e.target.value; autosize(e.target); saveBtn(); };

    $('#sv').onclick = async () => {
      if (!isDirty()) return;
      it = await api('/items/' + id, {method: 'PATCH', body: {
        title: draft.title.trim() || null,
        description: draft.description,
        category: draft.category,
        tags: draft.tags,
        done: draft.done,
      }});
      base = snapshot(it);
      draft = clone(base);
      // на месте: окно и прокрутка остаются, выбранные теги и категория тоже
      renderCats(); renderTags(); saveBtn();
    };

    $('#dl').onclick = async () => {
      if (!confirm('Удалить материал?')) return;
      await api('/items/' + id, {method: 'DELETE'});
      closeSheet();
    };

    // перезапрос данных у сайта: ждём, пока сервер соберёт название и обложку
    if ($('#rf')) $('#rf').onclick = async () => {
      const b = $('#rf'); b.textContent = 'Загружаю…'; b.disabled = true;
      try {
        await api('/items/' + id + '/refresh', {method: 'POST'});
        let f = it;
        for (let n = 0; n < 15; n++) {
          await new Promise(r => setTimeout(r, 2000));
          if (!$('#ov')) return;
          f = await api('/items/' + id);
          if (f.meta_state !== 'pending') break;
        }
        it = f;
        if (JSON.stringify(draft) === JSON.stringify(base)) { base = snapshot(it); draft = clone(base); }
      } catch (e) { alert(e.message); }
      if ($('#ov')) build();
    };
  };

  build();
}

/* ---------- ключ Кинопоиска: вводится здесь, без терминала ---------- */
function openKpKey(isSet) {
  sheet(`<button class="sheet-x" id="sx" aria-label="Закрыть">${XICON}</button>
    <div class="sheet-body kp-body">
      <div class="kp-title">Ключ Кинопоиска</div>
      <p class="kp-note">Нужен, чтобы подтягивать название, обложку и описание фильмов. Бесплатный ключ выдаёт Telegram-бот @kinopoiskdev_bot: нажмите «Старт» и скопируйте ключ сюда.</p>
      <input class="in-text" id="kpkey" placeholder="${isSet ? 'Новый ключ (старый заменится)' : 'Вставьте ключ'}" autocomplete="off" autocapitalize="off" spellcheck="false">
      <div class="err" id="kperr"></div>
      <div class="btnrow"><div class="left"></div><button class="savebtn dirty" id="kpsave">Сохранить</button></div>
    </div>`);
  $('#sx').onclick = closeSheet;
  $('#kpkey').focus();
  $('#kpsave').onclick = async () => {
    const token = $('#kpkey').value.trim();
    if (!token) return;
    const b = $('#kpsave'); b.disabled = true; b.textContent = 'Сохраняю…';
    try { await api('/settings/kp-token', {method: 'POST', body: {token}}); closeSheet(); }
    catch (e) { $('#kperr').textContent = e.message; b.disabled = false; b.textContent = 'Сохранить'; }
  };
}

/* ---------- кнопка «Хаб» и окно приложений ---------- */
const GRID_ICON = '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="6" cy="6" r="2"/><circle cx="12" cy="6" r="2"/><circle cx="18" cy="6" r="2"/><circle cx="6" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="18" cy="12" r="2"/><circle cx="6" cy="18" r="2"/><circle cx="12" cy="18" r="2"/><circle cx="18" cy="18" r="2"/></svg>';

// панель у кнопки хаба: три приложения и каждый проект (доска); закрывается кликом мимо или Esc
let hubMenu = null;
const closeHubMenu = () => { if (hubMenu) { hubMenu.remove(); hubMenu = null; } };
const openHubMenu = async () => {
  if (hubMenu) { closeHubMenu(); return; }
  const btn = $('#hubbtn');
  // в меню справа — только доски в работе; на паузе и в архиве не показываются
  const boards = (await api('/boards').catch(() => [])).filter(b => (b.status || 'work') === 'work');
  const gc = await api('/gcal/status').catch(() => ({configured: false, connected: false}));
  if (hubMenu) return;
  const app = (go, icon, label) => `<button class="hm-app" data-go="${go}"><span class="hm-ic">${icon}</span><span class="hm-lb">${esc(label)}</span></button>`;
  const m = document.createElement('div');
  m.className = 'hubmenu';
  const appImg = n => `<img class="hm-img" src="/static/ico/app-${n}.png?v=1" alt="" draggable="false">`;
  m.innerHTML = `<div class="hm-grid">${app('#/hub', GRID_ICON, 'Хаб')}${app('#/calendar', appImg('calendar'), 'Календарь')}${app('#/home', appImg('safe'), 'Сейв')}${app('#/kanban', appImg('boards'), 'Доски')}${app('#/crm', appImg('crm'), 'CRM')}</div>`
    + (boards.length ? `<div class="hm-head">Проекты</div><div class="hm-grid">${boards.map(b => app('#/board/' + b.id, KB_ICON, b.name)).join('')}</div>` : '');
  const gcTxt = !gc.configured ? 'Google Календарь · не настроен' : gc.connected ? 'Google Календарь · подключён, отключить' : 'Подключить Google Календарь';
  m.innerHTML += `<div class="hm-foot"><button class="hm-gc" id="hmgc">${gcTxt}</button></div>`;
  document.body.appendChild(m);
  const r = btn.getBoundingClientRect();
  m.style.top = (r.bottom + 8) + 'px';
  m.style.right = Math.max(8, window.innerWidth - r.right) + 'px';
  hubMenu = m;
  m.querySelectorAll('[data-go]').forEach(t => t.onclick = () => { closeHubMenu(); location.hash = t.dataset.go; });
  m.querySelector('#hmgc').onclick = async () => {
    if (!gc.configured) { alert('Google Календарь пока не настроен на сервере'); return; }
    if (gc.connected) {
      if (!confirm('Отключить Google Календарь? Уже созданные события останутся в календаре.')) return;
      try { await api('/gcal/disconnect', {method: 'POST'}); } catch (e) { alert(e.message); return; }
      closeHubMenu(); openHubMenu();
      return;
    }
    try { const r = await api('/gcal/connect'); location.href = r.url; }
    catch (e) { alert(e.message); }
  };
};

function ensureHubButton() {
  if ($('#hubbtn')) return;
  const b = document.createElement('button');
  b.id = 'hubbtn';
  b.className = 'hubbtn';
  b.setAttribute('aria-label', 'Хаб');
  b.title = 'Хаб';
  b.innerHTML = GRID_ICON;
  b.onclick = e => { e.stopPropagation(); openHubMenu(); };
  document.body.appendChild(b);
  document.addEventListener('mousedown', e => { if (hubMenu && !hubMenu.contains(e.target) && !b.contains(e.target)) closeHubMenu(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeHubMenu(); });
}

function setHubButton(show) {
  ensureHubButton();
  $('#hubbtn').style.display = show ? '' : 'none';
}

function openHub() {
  sheet(`<button class="sheet-x" id="sx" aria-label="Закрыть">${XICON}</button>
    <div class="sheet-body hub-body">
      <div class="kp-title">Хаб</div>
      <button class="hubrow" data-go="#/home"><span class="hubic">${APP_ICON_SAVE}</span><span class="hubtxt"><b>Сейв</b><i>Закладки</i></span></button>
      <button class="hubrow" data-go="#/crm"><span class="hubic">${CRM_ICO.funnel}</span><span class="hubtxt"><b>CRM</b><i>Воронка и контакты</i></span></button>
      <button class="hubrow" data-go="#/kanban"><span class="hubic">${KB_ICON}</span><span class="hubtxt"><b>Доски</b><i>Доски и задачи</i></span></button>
    </div>`, 'hub-sheet');
  $('#sx').onclick = closeSheet;
  document.querySelectorAll('.hubrow').forEach(r => r.onclick = () => {
    $('#sheet-root').innerHTML = '';
    location.hash = r.dataset.go;
  });
}

/* ---------- хаб приложений ---------- */
// главная: разделы с шевроном и ряды плиток, как на главной Яндекс ID
// объёмные значки для хаба в духе Яндекс (градиенты и блики, без обводки)
const CAL_ILL = '<svg viewBox="0 0 96 96"><defs><linearGradient id="ilCal" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#e9ebf2"/></linearGradient><linearGradient id="ilCalR" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff7373"/><stop offset="1" stop-color="#e03e3e"/></linearGradient></defs><rect x="14" y="20" width="68" height="62" rx="14" fill="url(#ilCal)" stroke="#dfe2ea"/><path d="M14 42V34a14 14 0 0 1 14-14h40a14 14 0 0 1 14 14v8z" fill="url(#ilCalR)"/><rect x="30" y="12" width="7" height="16" rx="3.5" fill="#2b2b33"/><rect x="59" y="12" width="7" height="16" rx="3.5" fill="#2b2b33"/><g fill="#e6e8ef"><rect x="24" y="52" width="10" height="7" rx="2.5"/><rect x="43" y="52" width="10" height="7" rx="2.5"/><rect x="62" y="52" width="10" height="7" rx="2.5"/><rect x="24" y="63" width="10" height="7" rx="2.5"/><rect x="62" y="63" width="10" height="7" rx="2.5"/></g><circle cx="48" cy="67" r="6" fill="#ffc83d"/></svg>';
const BOARD_ILL = '<svg viewBox="0 0 96 96"><defs><linearGradient id="ilBrd" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8f7cf7"/><stop offset="1" stop-color="#4a74f0"/></linearGradient></defs><rect x="10" y="14" width="76" height="68" rx="18" fill="url(#ilBrd)"/><g fill="#fff" fill-opacity=".22"><rect x="19" y="24" width="18" height="50" rx="6"/><rect x="39" y="24" width="18" height="50" rx="6"/><rect x="59" y="24" width="18" height="50" rx="6"/></g><rect x="22" y="30" width="12" height="11" rx="3" fill="#fff"/><rect x="22" y="45" width="12" height="11" rx="3" fill="#fff"/><rect x="42" y="30" width="12" height="11" rx="3" fill="#ffc83d"/><rect x="62" y="30" width="12" height="11" rx="3" fill="#ff8fb1"/><rect x="62" y="45" width="12" height="11" rx="3" fill="#fff"/></svg>';
const SAFE_ILL = '<svg viewBox="0 0 96 96"><defs><linearGradient id="ilSafe" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9aa2b2"/><stop offset="1" stop-color="#4b5364"/></linearGradient></defs><rect x="12" y="14" width="72" height="68" rx="14" fill="url(#ilSafe)"/><rect x="19" y="21" width="58" height="54" rx="10" fill="none" stroke="#fff" stroke-opacity=".28" stroke-width="2"/><circle cx="46" cy="48" r="16" fill="#d5dae4"/><circle cx="46" cy="48" r="10" fill="#8e97a8"/><circle cx="46" cy="48" r="3.5" fill="#fff"/><rect x="72" y="40" width="6" height="16" rx="3" fill="#2a2f3a"/></svg>';
const CRM_ILL = '<svg viewBox="0 0 96 96"><defs><linearGradient id="ilCrm" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9d7bff"/><stop offset="1" stop-color="#5b3fd0"/></linearGradient></defs><rect x="10" y="14" width="76" height="68" rx="18" fill="url(#ilCrm)"/><path d="M22 28h30l-11 13v12l-8 4V41z" fill="#fff"/><path d="M26 31h22" stroke="#5b3fd0" stroke-opacity=".35" stroke-width="2.5" stroke-linecap="round"/><circle cx="66" cy="50" r="8" fill="#fff"/><path d="M52 74c1.5-8 26.5-8 28 0z" fill="#fff"/></svg>';
// цвета досок на главной: квадрат градиентом, внутри белая иконка доски
// пастельные цвета — те же, что у обложек досок
const HUB_BPAL = ['#f4e3d7', '#dfeee3', '#e3e8f6', '#f6e8c8', '#efe0ef', '#dcecf0', '#f3dede'];
// значки категорий сейва: настоящие 3D-рендеры (static/ico), подбираются по названию категории
const HUB_COV = ['#f4e3d7', '#dfeee3', '#e3e8f6', '#f6e8c8', '#efe0ef', '#dcecf0', '#f3dede'];
const INBOX_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M3 13l2.5-7.5A2 2 0 0 1 7.4 4h9.2a2 2 0 0 1 1.9 1.5L21 13"/><path d="M3 13v5a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5h-5l-1.5 2.5h-5L8 13z"/></svg>';
const ALL_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><rect x="3" y="3" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="2"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2"/></svg>';
async function hub() {
  const [boardsAll, catsAll] = await Promise.all([api('/boards').catch(() => []), api('/categories').catch(() => [])]);
  const boards = boardsAll.filter(b => (b.status || 'work') === 'work').slice(0, 4);
  // лента сейва: входящие, все материалы и все категории, листается вправо
  const letter = name => esc((name || '?').trim().charAt(0).toUpperCase());
  // значок категории по её названию; для остальных категорий — объёмная папка
  const catKey = name => {
    const n = (name || '').toLowerCase();
    if (/смотр|видео|фильм|кино|сериал/.test(n)) return 'eye';
    if (/чит|книг|стать|текст/.test(n)) return 'book';
    if (/мест|карт|адрес|путеш|гео/.test(n)) return 'pin';
    if (/инстр|сервис|софт/.test(n)) return 'tool';
    if (/референс|образ|дизайн|визуал|фото/.test(n)) return 'gem';
    if (/иде|мысл/.test(n)) return 'bulb';
    if (/куп|покуп|товар|магазин|шоп|заказ/.test(n)) return 'bag';
    return 'folder';
  };
  const slider = catsAll.map(c => `<div class="htw"><button class="htile hcat" data-go="#/cat/${encodeURIComponent(c.slug)}" aria-label="${esc(c.name)}"><img src="/static/ico/${catKey(c.name)}.png?v=2" alt="" draggable="false"></button><span class="htile-l">${esc(c.name)}</span></div>`).join('');
  const tile = (go, bg, ic, label) => `<div class="htw"><button class="htile" style="--c:${bg}" data-go="${go}" aria-label="${label}">${ic}</button><span class="htile-l">${label}</span></div>`;
  $('#app').innerHTML = `<div class="titlerow"><div class="brand">Приложения</div></div>
    <section class="hsec">
      <div class="hrow">${tile('#/inbox', '#e7edff', `<span class="hi-flat">${INBOX_SVG}</span>`, 'Входящие')}${tile('#/calendar', '#eef3ff', '<img src="/static/ico/app-calendar.png?v=1" alt="" draggable="false">', 'Календарь')}${tile('#/kanban', '#e7f6ee', '<img src="/static/ico/app-boards.png?v=1" alt="" draggable="false">', 'Доски')}${tile('#/home', '#fff0f3', '<img src="/static/ico/app-safe.png?v=1" alt="" draggable="false">', 'Сейв')}${tile('#/crm', '#f3f0ff', '<img src="/static/ico/app-crm.png?v=1" alt="" draggable="false">', 'CRM')}</div>
    </section>
    <section class="hsec"><button class="hsec-h hsec-link" data-go="#/kanban">Доски<span class="hsec-chev">›</span></button>
      <div class="hrow">${boards.map(b => { const p = HUB_BPAL[b.id % HUB_BPAL.length]; return `<div class="htw"><button class="htile hboard" style="--c1:${p}" data-go="#/board/${b.id}" aria-label="${esc(b.name)}"><span class="hb-n">${esc(b.name)}</span><span class="hb-c">${b.count || 0}</span></button></div>`; }).join('') || '<div class="hempty">Пока нет досок</div>'}</div>
    </section>
    <section class="hsec"><div class="hsec-h">Сейф</div>
      <div class="hslider">${slider}</div>
    </section>`;
  document.querySelectorAll('[data-go]').forEach(t => t.onclick = () => { location.hash = t.dataset.go; });
}

/* ---------- канбан: список досок ---------- */
// статусы досок: цвета как у меток SAVE
const BSTATUS = {
  work: {label: 'В работе', bg: '#e6f0ff', tc: '#2f4bb0'},
  pause: {label: 'Пауза', bg: '#fff4d6', tc: '#8a6100'},
  archive: {label: 'Архив', bg: '#eeeef1', tc: '#5b5f6b'},
};

function openStatus(bid, cur) {
  sheet(`<button class="sheet-x" id="sx" aria-label="Закрыть">${XICON}</button>
    <div class="sheet-body hub-body">
      <div class="kp-title">Статус доски</div>
      ${Object.entries(BSTATUS).map(([k, v]) => `<button class="srow${k === cur ? ' on' : ''}" data-st="${k}"><span class="bstatus" style="--sb:${v.bg};--st:${v.tc}">${v.label}</span>${k === cur ? '<span class="srowchk">✓</span>' : ''}</button>`).join('')}
    </div>`, 'hub-sheet');
  $('#sx').onclick = closeSheet;
  document.querySelectorAll('[data-st]').forEach(b => b.onclick = async () => {
    $('#sheet-root').innerHTML = '';
    await api('/boards/' + bid, {method: 'PATCH', body: {status: b.dataset.st}});
    boards();
  });
}

// список досок в духе Notion: плитки; в работе сверху, пауза и архив — ниже под подписью
const BGROUPS = [['work', 'В работе'], ['pause', 'На паузе'], ['archive', 'Архив']];
async function boards() {
  const list = await api('/boards');
  // обложка плитки: цвет выбирается по номеру доски, чтобы плитки различались
  const BCOV = ['#f4e3d7', '#dfeee3', '#e3e8f6', '#f6e8c8', '#efe0ef', '#dcecf0', '#f3dede'];
  const tile = b => {
    const s = b.status || 'work';
    const st = BSTATUS[s];
    const p = HUB_BPAL[b.id % HUB_BPAL.length];
    return `<div class="bcard sq${s === 'work' ? '' : ' off'}" style="--c1:${p}" data-open="${b.id}">
      <button class="bstatus" data-stb="${b.id}" data-cur="${s}" style="--sb:${st.bg};--st:${st.tc}">${st.label}</button>
      <span class="hb-c">${b.count || 0}</span>
      <span class="hb-n">${esc(b.name)}</span>
      <button class="rb del bdel" data-delb="${b.id}" aria-label="Удалить доску">${XICON}</button>
    </div>`;
  };
  // активные — плиткой вниз; пауза и архив — в карусели (сервер отдаёт паузу раньше архива)
  const active = list.filter(b => (b.status || 'work') === 'work');
  const rest = list.filter(b => (b.status || 'work') !== 'work');
  $('#app').classList.remove('kfull'); // ширина меняется в ту же секунду, что и страница — без промежуточного скачка
  $('#app').innerHTML = `<div class="titlerow"><div class="brand">Доски</div></div>
    <section class="ypanel"><div class="ypanel-h">Активные <span class="ypanel-n">${active.length}</span></div>
      <div class="bgrid">${active.map(tile).join('')}
        <button class="bcard badd" id="addboard"><span class="badd-ic">${PLUS_ICON}</span><span>Новая доска</span></button></div>
    </section>
    ${rest.length ? `<section class="ypanel"><div class="ypanel-h">На паузе и в архиве <span class="ypanel-n">${rest.length}</span></div>
      <div class="bgrid bcar">${rest.map(tile).join('')}</div></section>` : ''}`;
  $('#addboard').onclick = newBoard;
  document.querySelectorAll('[data-open]').forEach(r => r.onclick = e => {
    if (e.target.closest('[data-delb], [data-stb]')) return;
    location.hash = '#/board/' + r.dataset.open;
  });
  document.querySelectorAll('[data-stb]').forEach(b => b.onclick = e => {
    e.stopPropagation();
    openStatus(+b.dataset.stb, b.dataset.cur);
  });
  document.querySelectorAll('[data-delb]').forEach(b => b.onclick = async e => {
    e.stopPropagation();
    if (!confirm('Удалить доску вместе со всеми колонками и карточками?')) return;
    await api('/boards/' + b.dataset.delb, {method: 'DELETE'});
    boards();
  });
}

function newBoard() {
  sheet(`<button class="sheet-x" id="sx" aria-label="Закрыть">${XICON}</button>
    <div class="sheet-body kp-body">
      <div class="kp-title">Новая доска</div>
      <input class="in-text" id="bname" placeholder="Название доски" maxlength="120">
      <div class="btnrow"><div class="left"></div><button class="savebtn dirty" id="bsave">Создать</button></div>
    </div>`);
  $('#sx').onclick = closeSheet;
  $('#bname').focus();
  const go = async () => {
    const v = $('#bname').value.trim();
    if (!v) return;
    const b = await api('/boards', {method: 'POST', body: {name: v}});
    $('#sheet-root').innerHTML = '';
    location.hash = '#/board/' + b.id;
  };
  $('#bsave').onclick = go;
  $('#bname').onkeydown = e => { if (e.key === 'Enter') go(); };
}

// поле для ввода прямо на месте элемента: Enter сохраняет, Esc или пустое поле отменяет
function inlineEdit(el, value, onSave, onCancel, placeholder = '') {
  // поле растёт вниз: длинный текст переносится по словам и весь виден, ничего не уходит наверх
  const inp = document.createElement('textarea');
  inp.className = 'kin kin-area';
  inp.rows = 1;
  inp.value = value;
  inp.placeholder = placeholder;
  inp.maxLength = 200;
  const grow = () => { inp.style.height = 'auto'; inp.style.height = inp.scrollHeight + 'px'; };
  el.replaceWith(inp);
  grow();
  inp.focus();
  inp.select();
  let done = false;
  const finish = async save => {
    if (done) return;
    done = true;
    const v = inp.value.replace(/\s*\n\s*/g, ' ').trim();
    if (save && v && v !== value) await onSave(v); else onCancel();
  };
  inp.oninput = grow;
  inp.onkeydown = e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); finish(true); }
    else if (e.key === 'Escape') finish(false);
  };
  inp.onblur = () => finish(true);
}

/* ---------- канбан: одна доска ---------- */
let curBoard = null;
// цвет тега: пастельный, из названия (одинаковый при каждом показе, у каждого тега свой, не серый)
const tagColor = name => {
  let h = 0;
  for (const ch of String(name)) h = (h * 31 + ch.codePointAt(0)) % 360;
  return {bg: `hsl(${h} 85% 91%)`, tc: `hsl(${h} 50% 26%)`, bd: `hsl(${h} 70% 78%)`};
};

// дата и время карточки для доски: «13 ноя · 14:00–15:30»
const SHORT_MON = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
const cardDateText = c => {
  if (!c.due_date) return '';
  const [, m, d] = c.due_date.split('-').map(Number);
  let t = `${d} ${SHORT_MON[m - 1]}`;
  if (c.due_time) {
    t += ' · ' + c.due_time;
    if (c.duration_min) { const [h, mi] = c.due_time.split(':').map(Number); const e = h * 60 + mi + c.duration_min; t += '–' + String(Math.floor(e / 60) % 24).padStart(2, '0') + ':' + String(e % 60).padStart(2, '0'); }
  }
  return t;
};

// просрочка: срок прошёл, а карточка не в колонке «Готово»; снимается сменой даты или переносом в «Готово»
const isOverdue = (due, colName = '') => !!due && due < dkey(nowMsk()) && !/готов/i.test(colName || '');
const odDateLabel = due => { const [, m, d] = due.split('-').map(Number); return `${d} ${MONTHS_GEN_SHORT[m - 1]}`; };
const MONTHS_GEN_SHORT = ['янв.', 'февр.', 'мар.', 'апр.', 'мая', 'июн.', 'июл.', 'авг.', 'сент.', 'окт.', 'нояб.', 'дек.'];
// карточка доски: заголовок, дата и теги
const NOTE_ICON = '<svg class="kc-doc" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/></svg>';
// приоритеты: 3, 2, 1 — значки; 0 — «пустой», то есть без приоритета (не выводится на карточке)
const KB_PRIO = {3: {t: '!!!', bg: '#ffe1e1', tc: '#b42318', bd: '#f5b5b5'}, 2: {t: '!!', bg: '#fff3c4', tc: '#8a6100', bd: '#f3dc85'}, 1: {t: '!', bg: '#dfeafe', tc: '#2f4bb0', bd: '#b5ccf5'}, 0: {t: '—', bg: '#f2f2f4', tc: '#6b6b74', bd: '#e3e3e8'}};
const cardHtml = (c, colName = '') => {
  const dt = cardDateText(c);
  const od = isOverdue(c.due_date, colName);
  const dateChip = dt ? `<span class="kc-tag kc-date${od ? ' od' : ''}">${esc(dt)}</span>` : '';
  const tags = (c.tags || []).map(t => { const k = tagColor(t); return `<span class="kc-tag" style="background:${k.bg};color:${k.tc}">${esc(t)}</span>`; }).join('');
  const prioChip = c.priority > 0 ? `<span class="kc-tag kc-prio" style="background:${KB_PRIO[c.priority].bg};color:${KB_PRIO[c.priority].tc}">${KB_PRIO[c.priority].t}</span>` : '';
  const row = prioChip + dateChip + tags;
  const hasNote = !!(c.note || '').trim(); // значок «есть заметка», как в Notion
  return `<div class="kcard${od ? ' od' : ''}" data-card="${c.id}"><div class="kct${c.title ? '' : ' ph'}">${hasNote ? NOTE_ICON : ''}${esc(c.title || 'Без названия')}</div>${row ? `<div class="kc-tags">${row}</div>` : ''}</div>`;
};

async function board(bid) {
  curBoard = bid;
  const b = await api('/boards/' + bid);
  tabTitle(b.name);
  const cols = b.columns.map(col => `<div class="kcol${/готов/i.test(col.name) ? ' kdone' : ''}" data-col="${col.id}">
      <div class="kch"><span class="kcname"><span class="kcn" data-rencol="${col.id}" title="Нажмите, чтобы переименовать">${esc(col.name)}</span><span class="kcnt">${col.cards.length}</span></span>
        <button class="rb del" data-delcol="${col.id}" aria-label="Удалить колонку">${XICON}</button></div>
      <div class="kcards">${col.cards.map(c => cardHtml(c, col.name)).join('')}</div>
      <button class="kadd" data-addcard="${col.id}">+ Добавить карточку</button>
    </div>`).join('');
  $('#app').classList.remove('kfull'); // ширина меняется в ту же секунду, что и страница — без промежуточного скачка
  const hlStrip = `<div class="hl-strip" id="hlstrip">${(b.links || []).map(hlItem).join('')}<div class="hl-item hl-fixed"><button class="hl-tile hl-add" id="hladd" aria-label="Добавить ссылку">${PLUS_ICON}</button><div class="hl-name">Добавить</div></div></div>`;
  $('#app').innerHTML = `<div class="titlerow"><div class="kbtitle" id="kbname" title="Нажмите, чтобы переименовать">${esc(b.name)}</div>
      <div class="tr-actions"><button class="iconbtn" id="kball" aria-label="Все доски" title="Все доски">${HOME_ICON}</button>
      <button class="iconbtn" id="kfull" aria-label="Во всю ширину" title="${isFull(bid) ? 'Вернуть' : 'Во всю ширину'}">${isFull(bid) ? RESTORE_ICON : FULL_ICON}</button></div></div>
    ${hlStrip}
    <div class="kcols">${cols}<div class="kcol kaddcol"><button class="kadd" id="addcol">+ Колонка</button></div></div>`;
  $('#kball').onclick = () => { location.hash = '#/kanban'; };
  const linkById = id => (b.links || []).find(x => x.id === id);
  $('#hladd').onclick = () => openLink(null);
  document.querySelectorAll('[data-hl-open]').forEach(el => el.onclick = () => { if (hlSuppress) return; const l = linkById(+el.dataset.hlOpen); if (l) window.open(l.url, '_blank', 'noopener'); });
  bindHlDrag();
  document.querySelectorAll('[data-hl-edit]').forEach(el => el.onclick = e => { e.stopPropagation(); openLink(linkById(+el.dataset.hlEdit)); });
  $('#app').classList.toggle('kfull', isFull(bid));
  $('#kfull').onclick = () => {
    const v = !isFull(bid);
    setFull(bid, v);
    $('#app').classList.toggle('kfull', v);
    $('#kfull').innerHTML = v ? RESTORE_ICON : FULL_ICON;
    $('#kfull').title = v ? 'Вернуть' : 'Во всю ширину';
    $('#kfull').setAttribute('aria-label', v ? 'Вернуть' : 'Во всю ширину');
  };
  $('#kbname').onclick = () => inlineEdit($('#kbname'), b.name,
    async v => { await api('/boards/' + bid, {method: 'PATCH', body: {name: v}}); board(bid); },
    () => board(bid), 'Название доски');
  $('#addcol').onclick = () => inlineEdit($('#addcol'), '',
    async v => { await api('/boards/' + bid + '/columns', {method: 'POST', body: {name: v}}); board(bid); },
    () => board(bid), 'Название колонки');
  document.querySelectorAll('[data-rencol]').forEach(s => s.onclick = () => { if (!suppressClick) inlineEdit(s, s.textContent,
    async v => { await api('/columns/' + s.dataset.rencol, {method: 'PATCH', body: {name: v}}); board(bid); },
    () => board(bid)); });
  document.querySelectorAll('[data-delcol]').forEach(x => x.onclick = async () => {
    if (!confirm('Удалить колонку вместе с карточками?')) return;
    await api('/columns/' + x.dataset.delcol, {method: 'DELETE'});
    board(bid);
  });
  document.querySelectorAll('[data-addcard]').forEach(x => x.onclick = () => inlineEdit(x, '',
    async v => { await api('/columns/' + x.dataset.addcard + '/cards', {method: 'POST', body: {title: v}}); board(bid); },
    () => board(bid), 'Заголовок карточки'));
  document.querySelectorAll('[data-card]').forEach(el => el.onclick = () => { if (!suppressClick) openCard(+el.dataset.card); });
  bindDrag();
  bindColDrag();
}

/* ---------- перенос колонок: за заголовок колонки ---------- */
let colDrag = null;

function bindColDrag() {
  document.querySelectorAll('.kch').forEach(h => h.onpointerdown = e => {
    if (e.target.closest('button')) return;
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    colDrag = {col: h.closest('.kcol'), x0: e.clientX, y0: e.clientY, started: false};
    window.addEventListener('pointermove', onColMove);
    window.addEventListener('pointerup', onColUp);
    window.addEventListener('pointercancel', onColUp);
  });
}

function onColMove(e) {
  if (!colDrag) return;
  if (!colDrag.started) {
    if (Math.hypot(e.clientX - colDrag.x0, e.clientY - colDrag.y0) < 6) return;
    startColDrag(e);
  }
  e.preventDefault();
  colDrag.tx = e.clientX - colDrag.sx;
  colDrag.ty = e.clientY - colDrag.sy;
  const kc = document.querySelector('.kcols');
  if (kc) {
    const r = kc.getBoundingClientRect();
    if (e.clientX > r.right - 70) kc.scrollLeft += 14;
    if (e.clientX < r.left + 70) kc.scrollLeft -= 14;
  }
  placeColumn(e.clientX);
}

function startColDrag(e) {
  const r = colDrag.col.getBoundingClientRect();
  colDrag.started = true;
  colDrag.sx = e.clientX - r.left;
  colDrag.sy = e.clientY - r.top;
  const ph = document.createElement('div');
  ph.className = 'kcolph';
  ph.style.width = r.width + 'px';
  ph.style.height = r.height + 'px';
  colDrag.col.replaceWith(ph);
  colDrag.ph = ph;
  const g = colDrag.col.cloneNode(true);
  g.classList.add('kghost', 'kcolghost');
  g.style.width = r.width + 'px';
  document.body.appendChild(g);
  colDrag.ghost = g;
  colDrag.cx = r.left; colDrag.cy = r.top;
  colDrag.tx = colDrag.cx; colDrag.ty = colDrag.cy;
  document.body.classList.add('kdragging');
  const follow = () => {
    if (!colDrag || !colDrag.ghost) return;
    colDrag.cx += (colDrag.tx - colDrag.cx) * 0.35;
    colDrag.cy += (colDrag.ty - colDrag.cy) * 0.35;
    colDrag.ghost.style.transform = `translate(${colDrag.cx}px, ${colDrag.cy}px) rotate(1.5deg)`;
    colDrag.raf = requestAnimationFrame(follow);
  };
  follow();
}

// место колонки: по середине колонок слева направо
function placeColumn(x) {
  const box = document.querySelector('.kcols');
  if (!box) return;
  let before = null;
  for (const c of box.querySelectorAll('.kcol[data-col]')) {
    const r = c.getBoundingClientRect();
    if (x < r.left + r.width / 2) { before = c; break; }
  }
  if (before) {
    if (colDrag.ph.nextElementSibling !== before) box.insertBefore(colDrag.ph, before);
  } else {
    const add = box.querySelector('.kaddcol');
    if (add) box.insertBefore(colDrag.ph, add); else box.appendChild(colDrag.ph);
  }
}

async function onColUp() {
  window.removeEventListener('pointermove', onColMove);
  window.removeEventListener('pointerup', onColUp);
  window.removeEventListener('pointercancel', onColUp);
  const d = colDrag;
  colDrag = null;
  if (!d || !d.started) return;
  cancelAnimationFrame(d.raf);
  suppressClick = true;
  setTimeout(() => { suppressClick = false; }, 300);
  d.ghost.remove();
  document.body.classList.remove('kdragging');
  d.ph.replaceWith(d.col);
  const ids = [...document.querySelectorAll('.kcol[data-col]')].map(c => +c.dataset.col);
  try {
    await api('/boards/' + curBoard + '/columns/order', {method: 'POST', body: {ids}});
  } catch (err) {
    alert(err.message);
    board(curBoard);
  }
}

/* ---------- перенос карточек между колонками ---------- */
let suppressClick = false, drag = null;

function bindDrag() {
  document.querySelectorAll('.kcard').forEach(el => el.onpointerdown = e => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    drag = {el, x0: e.clientX, y0: e.clientY, started: false, ph: null, ghost: null, sx: 0, sy: 0, cx: 0, cy: 0, tx: 0, ty: 0, raf: 0};
    window.addEventListener('pointermove', onDragMove);
    window.addEventListener('pointerup', onDragUp);
    window.addEventListener('pointercancel', onDragUp);
  });
}

function onDragMove(e) {
  if (!drag) return;
  if (!drag.started) {
    if (Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) < 6) return;
    startDrag(e);
  }
  e.preventDefault();
  drag.tx = e.clientX - drag.sx;
  drag.ty = e.clientY - drag.sy;
  // край экрана — прокрутка досок и страницы
  const kc = document.querySelector('.kcols');
  if (kc) {
    const r = kc.getBoundingClientRect();
    if (e.clientX > r.right - 70) kc.scrollLeft += 14;
    if (e.clientX < r.left + 70) kc.scrollLeft -= 14;
  }
  if (e.clientY < 90) window.scrollBy(0, -12);
  if (e.clientY > window.innerHeight - 90) window.scrollBy(0, 12);
  const under = document.elementFromPoint(e.clientX, e.clientY);
  const col = under && under.closest('.kcol[data-col]');
  if (col) placeInColumn(col, e.clientY);
}

function startDrag(e) {
  const r = drag.el.getBoundingClientRect();
  drag.started = true;
  drag.sx = e.clientX - r.left;
  drag.sy = e.clientY - r.top;
  drag.cx = r.left; drag.cy = r.top;
  const ph = document.createElement('div');
  ph.className = 'kph';
  ph.style.height = r.height + 'px';
  drag.el.replaceWith(ph);
  drag.ph = ph;
  const g = drag.el.cloneNode(true);
  g.classList.add('kghost');
  g.style.width = r.width + 'px';
  document.body.appendChild(g);
  drag.ghost = g;
  document.body.classList.add('kdragging');
  const follow = () => {
    if (!drag || !drag.ghost) return;
    drag.cx += (drag.tx - drag.cx) * 0.35;   // мягкое следование за пальцем
    drag.cy += (drag.ty - drag.cy) * 0.35;
    drag.ghost.style.transform = `translate(${drag.cx}px, ${drag.cy}px) rotate(2deg)`;
    drag.raf = requestAnimationFrame(follow);
  };
  drag.tx = drag.cx; drag.ty = drag.cy;
  follow();
}

// место карточки: между карточками колонки, по их середине
function placeInColumn(col, y) {
  const box = col.querySelector('.kcards');
  if (!box) return;
  const cards = [...box.querySelectorAll('.kcard')];
  let before = null;
  for (const c of cards) {
    const r = c.getBoundingClientRect();
    if (y < r.top + r.height / 2) { before = c; break; }
  }
  if (before) {
    if (drag.ph.nextElementSibling !== before) box.insertBefore(drag.ph, before);
  } else if (box.lastElementChild !== drag.ph) {
    box.appendChild(drag.ph);
  }
}

// пересчёт счётчиков колонок по карточкам на экране
const refreshColCounts = () => {
  document.querySelectorAll('.kcol[data-col]').forEach(c => {
    const el = c.querySelector('.kcnt');
    if (el) el.textContent = c.querySelectorAll('.kcard').length;
  });
};

async function onDragUp() {
  window.removeEventListener('pointermove', onDragMove);
  window.removeEventListener('pointerup', onDragUp);
  window.removeEventListener('pointercancel', onDragUp);
  const d = drag;
  drag = null;
  if (!d || !d.started) return;
  cancelAnimationFrame(d.raf);
  suppressClick = true;
  setTimeout(() => { suppressClick = false; }, 300);
  d.ghost.remove();
  document.body.classList.remove('kdragging');
  d.ph.replaceWith(d.el);
  refreshColCounts();
  const columns = [...document.querySelectorAll('.kcol[data-col]')].map(c => ({
    id: +c.dataset.col,
    cards: [...c.querySelectorAll('.kcard')].map(k => +k.dataset.card),
  }));
  try {
    await api('/boards/' + curBoard + '/order', {method: 'POST', body: {columns}});
  } catch (err) {
    alert(err.message);
    board(curBoard);
  }
}

// ссылки в тексте становятся кликабельными (безопасно: сначала экранируем текст)
function linkify(text) {
  return esc(text || '').replace(/(https?:\/\/[^\s<]+)/g, u => `<a href="${u}" target="_blank" rel="noopener">${u}</a>`);
}

// ----- заметка: один редактируемый блок; строки: обычные, «## » заголовок, «- » список, «[ ] » / «[x] » чекбоксы -----
const textOf = el => (el ? (el.textContent || '') : '').replace(/​/g, '').replace(/ /g, ' ');

// разметка в тексте заметки: **жирный**, *курсив*, __подчёркнутый__ (ссылки — как раньше)
function fmtHtml(s) {
  const re = /\*\*(?=\S)([\s\S]+?)(?<=\S)\*\*|__(?=\S)([\s\S]+?)(?<=\S)__|\*(?=\S)([\s\S]+?)(?<=\S)\*/g;
  let out = '', last = 0, m;
  while ((m = re.exec(s))) {
    out += linkify(s.slice(last, m.index));
    if (m[1] !== undefined) out += `<b>${fmtHtml(m[1])}</b>`;
    else if (m[2] !== undefined) out += `<u>${fmtHtml(m[2])}</u>`;
    else out += `<i>${fmtHtml(m[3])}</i>`;
    last = re.lastIndex;
  }
  return out + linkify(s.slice(last));
}

function lineHtml(kind, text, checked, level = 0) {
  // пустая строка держит каретку: нулевой символ вместо <br>
  const body = fmtHtml(text || '') || '​';
  if (kind === 'check') return `<div class="kline kcheck${checked ? ' done' : ''}" data-lvl="${level}" style="margin-left:${level * 24}px"><span class="kcb" contenteditable="false" role="checkbox" aria-checked="${checked ? 'true' : 'false'}"></span><span class="kct">${body}</span></div>`;
  if (kind === 'h' || kind === 'h1' || kind === 'h2' || kind === 'h3') return `<div class="kh kh${kind === 'h1' ? 1 : kind === 'h3' ? 3 : 2}">${body}</div>`;
  if (kind === 'bul') return `<div class="kline kbul" data-lvl="${level}" style="margin-left:${level * 24}px">${body}</div>`;
  if (kind === 'num') return `<div class="kline knum" data-lvl="${level}" data-n="1" style="margin-left:${level * 24}px">${body}</div>`;
  if (kind === 'hr') return '<div class="kdiv" contenteditable="false"><hr class="kb-hr"></div>';
  return `<div class="kline">${body}</div>`;
}

function createLine(kind, text, checked = false, level = 0) {
  const t = document.createElement('template');
  t.innerHTML = lineHtml(kind, text, checked, level).trim();
  return t.content.firstElementChild;
}

function renderNoteEdit(text) {
  return (text || '').split('\n').map(line => {
    const m = line.match(/^( *)\[( |x|X)\] ?(.*)$/);
    if (m) return lineHtml('check', m[3], m[2] !== ' ', Math.min(6, Math.floor(m[1].length / 2)));
    const b = line.match(/^( *)- (.*)$/);
    if (b) return lineHtml('bul', b[2], false, Math.min(6, Math.floor(b[1].length / 2)));
    const nm = line.match(/^( *)\d+\. (.*)$/);
    if (nm) return lineHtml('num', nm[2], false, Math.min(6, Math.floor(nm[1].length / 2)));
    const h = line.match(/^(#{1,3}) (.*)$/);
    if (h) return lineHtml(h[1].length === 1 ? 'h1' : h[1].length === 3 ? 'h3' : 'h2', h[2]);
    if (line === '---') return lineHtml('hr');
    if (line === '[subs]') return subsSection(null, NOTE_ROOT, NOTE_KID);
    return lineHtml('plain', line);
  }).join('');
}

// текст строки с разметкой: жирный, курсив, подчёркнутый — обратно в **, *, __
function fmtOf(node) {
  if (!node) return '';
  if (node.nodeType === 3) return (node.textContent || '').replace(/​/g, '').replace(/ /g, ' ');
  if (node.nodeType !== 1 || node.classList.contains('kcb')) return '';
  const inner = [...node.childNodes].map(fmtOf).join('');
  const tag = node.tagName;
  const mark = (open, close) => {
    // пробелы по краям выносим за маркер, иначе разметка не разберётся обратно
    const m = inner.match(/^(\s*)([\s\S]*?)(\s*)$/);
    return m[2] ? m[1] + open + m[2] + close + m[3] : inner;
  };
  if (tag === 'B' || tag === 'STRONG') return mark('**', '**');
  if (tag === 'I' || tag === 'EM') return mark('*', '*');
  if (tag === 'U') return mark('__', '__');
  return inner;
}

// нумерация пунктов: вложенные уровни считаются отдельно, любая другая строка начинает счёт заново
function renumber(root) {
  let cnt = [];
  [...root.children].forEach(el => {
    if (!el.classList || !el.classList.contains('knum')) { cnt = []; return; }
    const lvl = +(el.dataset.lvl || 0);
    cnt.length = lvl + 1;
    cnt[lvl] = (cnt[lvl] || 0) + 1;
    el.dataset.n = cnt[lvl];
  });
}

// текст заметки из блока: по строкам
function readNote(root) {
  return [...root.childNodes].map(node => {
    if (node.nodeType === 3) return node.textContent;
    const el = node;
    if (el.classList && el.classList.contains('kcheck')) return '  '.repeat(+(el.dataset.lvl || 0)) + `[${el.classList.contains('done') ? 'x' : ' '}] ${fmtOf(el.querySelector('.kct') || el)}`;
    if (el.classList && el.classList.contains('kh')) return '#'.repeat(el.classList.contains('kh1') ? 1 : el.classList.contains('kh3') ? 3 : 2) + ' ' + fmtOf(el);
    if (el.classList && el.classList.contains('kbul')) return '  '.repeat(+(el.dataset.lvl || 0)) + '- ' + fmtOf(el);
    if (el.classList && el.classList.contains('knum')) return '  '.repeat(+(el.dataset.lvl || 0)) + `${el.dataset.n || 1}. ` + fmtOf(el);
    if (el.classList && el.classList.contains('kdiv')) return '---';
    if (el.classList && el.classList.contains('kt-sec')) return '[subs]';
    return fmtOf(el);
  }).join('\n');
}

// текст, попавший в пункт мимо его текста (курсор стоял на уровне строки), переносим в текст пункта
function fixStrayText(root) {
  root.querySelectorAll('.kcheck').forEach(row => {
    const stray = [...row.childNodes].filter(x => x.nodeType === 3 && x.textContent.length);
    const kct = row.querySelector('.kct');
    if (!stray.length || !kct) return;
    stray.forEach(x => kct.appendChild(x));
    caretEnd(row);
  });
}

function caretStart(el) {
  const target = el.classList.contains('kcheck') ? el.querySelector('.kct') : el;
  const r = document.createRange();
  r.setStart(target, 0);
  r.collapse(true);
  const s = getSelection();
  s.removeAllRanges();
  s.addRange(r);
}

function caretEnd(el) {
  const target = el.classList.contains('kcheck') ? el.querySelector('.kct') : el;
  // ставим каретку внутрь последнего текстового узла: на границе элемента она не рисуется
  const w = document.createTreeWalker(target, NodeFilter.SHOW_TEXT);
  let last = null;
  while (w.nextNode()) last = w.currentNode;
  const r = document.createRange();
  if (last) r.setStart(last, last.length); else r.setStart(target, 0);
  r.collapse(true);
  const s = getSelection();
  s.removeAllRanges();
  s.addRange(r);
}

// ----- подзадачи, как в Тудуисте: секция «Подзадачи» в заметке и окна подзадач без предела глубины -----
let NOTE_ROOT = [];      // подзадачи верхнего уровня открытой карточки (сводка)
let NOTE_KID = null;     // карточка, в заметке которой сейчас работаем
const subDate = d => (d ? d.split('-').reverse().join('.') : '');
const KT_UP = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 14l6-6 6 6"/></svg>';
const KT_DOWN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 10l6 6 6-6"/></svg>';
const KT_DOTS = '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg>';

// кружок прогресса: сколько подзадач выполнено
const ktRing = (done, total) => {
  const p = total ? done / total : 0;
  const len = 2 * Math.PI * 6.5;
  return `<svg class="kt-ring" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6.5" fill="none" stroke="#d4d4da" stroke-width="1.6"/><circle cx="8" cy="8" r="6.5" fill="none" stroke="#3fa975" stroke-width="1.6" stroke-dasharray="${(p * len).toFixed(2)} ${len.toFixed(2)}" transform="rotate(-90 8 8)"/></svg>`;
};

// строка подзадачи в секции: кружок, название, описание, дата и счётчик
function subRowHtml(x) {
  const meta = [x.due_date ? `<span class="kt-date">${subDate(x.due_date)}</span>` : '', x.total ? `<span class="kt-cnt">${x.done_count}/${x.total}</span>` : ''].join('');
  return `<div class="kt-row${x.done ? ' done' : ''}" data-row="${x.id}">
    <span class="kt-circle${x.done ? ' on' : ''}" data-tog="${x.id}" role="checkbox" aria-checked="${x.done ? 'true' : 'false'}"></span>
    <div class="kt-main"><div class="kt-title" data-open-sub="${x.id}">${esc(x.title || 'Без названия')}</div>
      ${x.desc ? `<div class="kt-desc">${esc(x.desc)}</div>` : ''}
      ${meta ? `<div class="kt-meta">${meta}</div>` : ''}</div></div>`;
}

// секция «Подзадачи»: в карточке (parent пустой) и внутри подзадачи (parent — её id)
function subsSection(parent, list, kid, showDone = false) {
  const total = list.length, done = list.filter(x => x.done).length;
  return `<div class="kt-sec${showDone ? ' show-done' : ''}" contenteditable="false" data-subs="1" data-parent="${parent ?? ''}" data-kid="${kid}">
    <div class="kt-sec-h">${ktRing(done, total)}<span class="kt-sec-t">Подзадачи</span>${total ? `<span class="kt-sec-n">${done}/${total}</span>` : ''}
      ${done ? `<button class="kt-showdone" type="button">${showDone ? 'Скрыть выполненные' : 'Показать выполненные'}</button>` : ''}</div>
    <div class="kt-rows">${list.map(subRowHtml).join('')}</div>
    <div class="kt-add" role="button" tabindex="0"><span class="kt-plus">+</span><span>Добавить подзадачу</span></div>
  </div>`;
}

// перечитать список подзадач секции и заменить секцию (без перерисовки всего окна)
async function refreshSection(sec) {
  const parent = sec.dataset.parent ? +sec.dataset.parent : null;
  const kid = +sec.dataset.kid;
  const show = sec.classList.contains('show-done');
  let list;
  if (parent === null) { const c = await api('/cards/' + kid); list = c.root_subs; NOTE_ROOT = list; }
  else { list = (await api('/subs/' + parent)).children; }
  const t = document.createElement('template');
  t.innerHTML = subsSection(parent, list, kid, show).trim();
  sec.replaceWith(t.content.firstElementChild);
}

// клики по секции: галочка, название, показать выполненные, добавить
document.addEventListener('click', async e => {
  const tog = e.target.closest && e.target.closest('.kt-circle[data-tog]');
  if (tog) {
    e.preventDefault();
    const sec = tog.closest('.kt-sec'), id = +tog.dataset.tog;
    const cur = await api('/subs/' + id);
    await api('/subs/' + id, {method: 'PATCH', body: {done: !cur.done}});
    await refreshSection(sec);
    return;
  }
  const open = e.target.closest && e.target.closest('[data-open-sub]');
  if (open) { e.preventDefault(); openSubWin(+open.dataset.openSub, +open.closest('.kt-sec').dataset.kid); return; }
  const sd = e.target.closest && e.target.closest('.kt-showdone');
  if (sd) { const sec = sd.closest('.kt-sec'); sec.classList.toggle('show-done'); await refreshSection(sec); return; }
  const add = e.target.closest && e.target.closest('.kt-add');
  if (add && !add.querySelector('input')) {
    const sec = add.closest('.kt-sec');
    add.innerHTML = '<input class="kt-new" placeholder="Название подзадачи">';
    const inp = add.querySelector('input');
    inp.focus();
    inp.onkeydown = async ev => {
      if (ev.key === 'Escape') { await refreshSection(sec); return; }
      if (ev.key !== 'Enter') return;
      const v = inp.value.trim();
      if (!v) return;
      const parent = sec.dataset.parent ? +sec.dataset.parent : null;
      await api(`/cards/${sec.dataset.kid}/subs`, {method: 'POST', body: {title: v, parent_id: parent}});
      await refreshSection(sec);
    };
    inp.onblur = () => setTimeout(() => { if (add.isConnected && !add.querySelector('input').value.trim()) refreshSection(sec); }, 150);
  }
});

// окно подзадачи — как карточка доски: сверху хлебные крошки и кнопки, ниже название, дата, заметка, подзадачи
async function openSubWin(sid, kid) {
  if (beforeClose) { const f = beforeClose; beforeClose = null; await f(); }
  const s = await api('/subs/' + sid);
  const crumbs = s.crumbs.map((c, i) => {
    if (i === s.crumbs.length - 1) return `<span class="kt-cur">${esc(c.title)}</span>`;
    const attr = c.kind === 'board' ? `data-crumb-board="${c.board_id}"` : c.kind === 'card' ? `data-crumb-card="${c.card_id}"` : `data-crumb-sub="${c.id}"`;
    return `<button class="kt-crumb" ${attr}>${esc(c.title)}</button>`;
  }).join('<span class="kt-sep">/</span>');
  sheet(`<div class="sheet-body kb-card ks-win">
      <div class="kb-top"><div class="kt-crumbs">${crumbs}</div>
        <div class="kb-tools">
          ${s.prev_id ? `<button class="kb-ib" data-nav-sub="${s.prev_id}" data-kid="${kid}" aria-label="Предыдущая подзадача">${KT_UP}</button>` : ''}
          ${s.next_id ? `<button class="kb-ib" data-nav-sub="${s.next_id}" data-kid="${kid}" aria-label="Следующая подзадача">${KT_DOWN}</button>` : ''}
          <button class="kb-ib" id="ksmore" aria-label="Действия">${KT_DOTS}</button>
          <button class="kb-ib" id="sx" aria-label="Закрыть">${XICON}</button>
          <div class="kb-menu" id="ksmenu" hidden><button class="kb-mi bad" id="ksdel">Удалить подзадачу</button></div>
        </div></div>
      <div class="kb-body">
        <div class="kt-head"><span class="kt-circle big${s.done ? ' on' : ''}" id="ksdone" role="checkbox" aria-checked="${s.done ? 'true' : 'false'}"></span>
          <textarea class="kt-title-in" id="kstitle" rows="1" placeholder="Название">${esc(s.title)}</textarea></div>
        <div class="kb-props"><div class="kb-prop"><div class="kb-pl"><span>Дата</span></div><div class="kb-pv"><input type="date" class="kt-date-in" id="ksdate" value="${s.due_date || ''}"></div></div></div>
        <hr class="kb-hr">
        <textarea class="kb-note ks-note" id="ksnote" placeholder="Заметка">${esc(s.note)}</textarea>
        <div class="kt-secwrap">${subsSection(sid, s.children, kid)}</div>
      </div></div>`, 'card-sheet ks-sheet');

  // заметка сохраняется сама; при уходе из поля — тоже
  let noteTimer = null;
  const note = $('#ksnote');
  const saveNote = async () => {
    clearTimeout(noteTimer);
    if (note.dataset.dirty) { delete note.dataset.dirty; await api('/subs/' + sid, {method: 'PATCH', body: {note: note.value}}); }
  };
  autosize(note);
  note.oninput = () => { autosize(note); note.dataset.dirty = '1'; clearTimeout(noteTimer); noteTimer = setTimeout(saveNote, 500); };
  note.onblur = saveNote;
  const title = $('#kstitle');
  const grow = () => { title.style.height = 'auto'; title.style.height = title.scrollHeight + 'px'; };
  grow();
  title.oninput = grow;
  title.onchange = async () => {
    const v = title.value.trim();
    if (!v) { title.value = s.title; grow(); return; }
    await api('/subs/' + sid, {method: 'PATCH', body: {title: v}});
  };
  title.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); title.blur(); } };
  $('#ksdate').onchange = async () => { await api('/subs/' + sid, {method: 'PATCH', body: {due_date: $('#ksdate').value || ''}}); };
  $('#ksdone').onclick = async () => {
    await saveNote();
    await api('/subs/' + sid, {method: 'PATCH', body: {done: !s.done}});
    openSubWin(sid, kid);
  };
  // назад: на уровень выше; из верхнего уровня — к карточке
  const parent = s.crumbs[s.crumbs.length - 2];
  const goBack = () => (parent && parent.kind === 'sub' ? openSubWin(parent.id, kid) : openCard(kid));
  $('#sx').onclick = closeSheet;
  $('#ov').onclick = e => { if (e.target.id === 'ov') goBack(); };
  document.querySelectorAll('[data-crumb-sub]').forEach(b => b.onclick = () => openSubWin(+b.dataset.crumbSub, kid));
  document.querySelectorAll('[data-crumb-card]').forEach(b => b.onclick = () => openCard(+b.dataset.crumbCard));
  document.querySelectorAll('[data-crumb-board]').forEach(b => b.onclick = async () => { await closeSheet(); location.hash = '#/board/' + b.dataset.crumbBoard; });
  document.querySelectorAll('[data-nav-sub]').forEach(b => b.onclick = () => openSubWin(+b.dataset.navSub, kid));
  $('#ksmore').onclick = e => { e.stopPropagation(); $('#ksmenu').hidden = !$('#ksmenu').hidden; };
  $('#ksdel').onclick = async () => {
    if (!confirm('Удалить подзадачу вместе с вложенными?')) return;
    await api('/subs/' + sid, {method: 'DELETE'});
    goBack();
  };
}

// окно карточки: заголовок и заметка
async function openCard(kid) {
  const c = await api('/cards/' + kid);
  NOTE_ROOT = c.root_subs || [];
  NOTE_KID = kid;
  const bd = await api('/boards/' + c.board_id);
  let boardTags = bd.tags || [], cardTags = c.tags || [], cols = bd.columns || [], curCol = c.column_id;
  let timer = null, dirty = false;
  let prio = c.priority || null;
  const DOTS = '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg>';
  sheet(`<div class="sheet-body kb-card">
      <div class="kb-top">
        <span class="kb-saved" id="kbs">Сохранено</span>
        <div class="kb-tools">
          <button class="kb-ib" id="kbmore" aria-label="Действия">${DOTS}</button>
          <button class="kb-ib" id="sx" aria-label="Закрыть">${XICON}</button>
          <div class="kb-menu" id="kbmenu" hidden><button class="kb-mi" id="kbfull">На весь экран</button><button class="kb-mi bad" id="kbdel">Удалить карточку</button></div>
        </div>
      </div>
      <div class="kb-body"><div class="kb-title" id="kbt" contenteditable="true" spellcheck="false" data-ph="Заголовок">${linkify((c.title || '').replace(/\s+/g, ' '))}</div>
      <div class="kb-props">
        <div class="kb-prop"><div class="kb-pl"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="8"/><path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor"/></svg><span>Статус</span></div><div class="kb-pv" id="kbcols"></div></div>
        <div class="kb-prop"><div class="kb-pl"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 21V4M5 4h11l-2 4 2 4H5"/></svg><span>Приоритет</span></div><div class="kb-pv" id="kbprio"></div></div>
        <div class="kb-prop"><div class="kb-pl"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9-9-9z"/><circle cx="8" cy="8" r="1.4"/></svg><span>Теги</span></div><div class="kb-pv" id="kbtags"></div></div>
        <div class="kb-prop"><div class="kb-pl"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg><span>Дата</span></div><div class="kb-pv" id="kbdate"></div></div>
      </div>
      <hr class="kb-hr">
      <div class="kb-note kb-edit" id="kbn" contenteditable="true" spellcheck="false">${renderNoteEdit(c.note)}</div></div>
    </div>`, 'card-sheet');
  const t = $('#kbt'), n = $('#kbn');
  renumber(n);
  // теги: список доски, отмеченные — у карточки
  // поля карточки — выбор во всплывающем окне, как в Notion: сверху выбранное, ниже варианты с ручкой «⠿»
  const PRIO_NAME = {3: 'Высокий', 2: 'Средний', 1: 'Низкий', 0: 'Без приоритета'};
  const GRIP_SVG = '<svg viewBox="0 0 10 16" aria-hidden="true"><circle cx="2.5" cy="2.5" r="1.3"/><circle cx="7.5" cy="2.5" r="1.3"/><circle cx="2.5" cy="8" r="1.3"/><circle cx="7.5" cy="8" r="1.3"/><circle cx="2.5" cy="13.5" r="1.3"/><circle cx="7.5" cy="13.5" r="1.3"/></svg>';
  const tagStyle = name => { const k = tagColor(name); return `--tb:${k.bg};--tt:${k.tc}`; };
  // статусы цветом: открыто — жёлтый, в работе — синий, готово — зелёный; остальные — серые
  const colKind = name => /открыт/i.test(name) ? 'y' : /работ/i.test(name) ? 'b' : /готов/i.test(name) ? 'g' : '';
  const chipCol = name => `<span class="kbp-chip${colKind(name) ? ' st-' + colKind(name) : ''}">${esc(name)}</span>`;
  const chipTag = name => `<span class="kbp-chip" style="${tagStyle(name)}">${esc(name)}</span>`;
  const chipPrio = p => `<span class="kbp-chip" style="--tb:${KB_PRIO[p].bg};--tt:${KB_PRIO[p].tc}">${KB_PRIO[p].t}</span>`;
  const rowHtml = (id, chip, grip, label = '', more = false) => `<div class="kbp-row" data-id="${esc(String(id))}">${grip ? `<button class="kbp-grip" tabindex="-1" aria-label="Перенести">${GRIP_SVG}</button>` : ''}<button class="kbp-opt">${chip}${label}</button>${more ? `<button class="kbp-more" aria-label="Действия">${DOTS}</button>` : ''}</div>`;

  const kbpClose = () => {
    document.querySelectorAll('.kbp-pop,.kbp-sub').forEach(n => n.remove());
    document.removeEventListener('mousedown', kbpOutside, true);
  };
  const kbpOutside = e => {
    if (e.target.closest && e.target.closest('.kbp-pop,.kbp-sub,.kb-pv')) return;
    kbpClose();
  };
  const kbpPlace = (p, r) => {
    p.style.left = Math.max(12, Math.min(r.left, innerWidth - p.offsetWidth - 12)) + 'px';
    p.style.top = Math.min(r.bottom + 4, innerHeight - p.offsetHeight - 12) + 'px';
  };
  const kbpOpen = (anchor, html, bind) => {
    kbpClose();
    const p = document.createElement('div');
    p.className = 'kbp-pop';
    p.innerHTML = html;
    document.body.appendChild(p);
    kbpPlace(p, anchor.getBoundingClientRect());
    bind(p);
    document.addEventListener('mousedown', kbpOutside, true);
  };
  const kbpPlaceSide = (p, r, side) => {
    const w = p.offsetWidth, h = p.offsetHeight;
    let left = side === 'right' && r.right + 6 + w <= innerWidth - 12 ? r.right + 6 : r.left - w - 6;
    p.style.left = Math.max(12, Math.min(left, innerWidth - w - 12)) + 'px';
    p.style.top = Math.max(12, Math.min(r.top - 4, innerHeight - h - 12)) + 'px';
  };
  const kbpSub = (anchor, html, bind, side = 'right') => {
    document.querySelectorAll('.kbp-sub').forEach(n => n.remove());
    const s = document.createElement('div');
    s.className = 'kbp-sub';
    s.innerHTML = html;
    document.body.appendChild(s);
    kbpPlaceSide(s, anchor.getBoundingClientRect(), side);
    bind(s);
  };

  // сохранить новый порядок: статусы — колонки доски, теги — список тегов доски
  const saveOrder = async (kind, ids) => {
    try {
      if (kind === 'col') {
        await api(`/boards/${c.board_id}/columns/order`, {method: 'POST', body: {ids: ids.map(Number)}});
        cols = ids.map(id => cols.find(x => x.id === +id)).filter(Boolean);
      } else {
        const b2 = await api('/boards/' + c.board_id, {method: 'PATCH', body: {tags: ids}});
        boardTags = b2.tags;
      }
    } catch (e) { alert(e.message); }
  };
  // ручка «⠿»: клик — меню, перетаскивание — новый порядок
  const bindGrip = (row, kind) => {
    const g = row.querySelector('.kbp-grip');
    if (!g) return;
    g.onpointerdown = e => {
      if (e.button !== 0) return;
      e.preventDefault();
      const list = row.parentElement, y0 = e.clientY;
      let moved = false;
      const move = ev => {
        if (!moved && Math.abs(ev.clientY - y0) < 4) return;
        moved = true;
        row.classList.add('kbp-drag');
        const others = [...list.querySelectorAll('.kbp-row')].filter(r => r !== row);
        const after = others.find(r => { const b = r.getBoundingClientRect(); return ev.clientY < b.top + b.height / 2; });
        if (after) list.insertBefore(row, after); else list.appendChild(row);
      };
      const up = () => {
        document.removeEventListener('pointermove', move);
        document.removeEventListener('pointerup', up);
        row.classList.remove('kbp-drag');
        if (moved) saveOrder(kind, [...list.querySelectorAll('.kbp-row')].map(r => r.dataset.id));
      };
      document.addEventListener('pointermove', move);
      document.addEventListener('pointerup', up);
    };
  };
  // меню «⋯» справа от строки: имя (переименовать по Enter) и удаление тега; у статуса — только имя
  const showRowMenu = (row, kind) => {
    const id = row.dataset.id;
    const isTag = kind === 'tag';
    const cur = isTag ? id : (cols.find(x => x.id === +id)?.name || '');
    const trash = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M9 7V4.5h6V7M6.5 7l1 12.5h9l1-12.5M10 11v5M14 11v5"/></svg>';
    kbpSub(row.querySelector('.kbp-more'), `<div class="kbp-mhd"><input class="kbp-mname" value="${esc(cur)}" maxlength="${isTag ? 40 : 80}" aria-label="Название"></div>`
      + (isTag ? `<button class="kbp-mi bad" data-act="delete">${trash}Удалить</button>` : ''), s => {
      const inp = s.querySelector('.kbp-mname');
      inp.focus(); inp.select();
      let fin = false;
      const save = async () => {
        if (fin) return;
        const v = inp.value.trim();
        if (!v || v === cur) return;
        fin = true;
        if (isTag) { await renameTag(cur, v); renderTags(); openTagsPop($('#kbnewtag')?.value || ''); }
        else { await renameCol(id, v); renderCols(); openColsPop(); }
      };
      inp.onkeydown = e => {
        if (e.key === 'Enter') { e.preventDefault(); save(); }
        if (e.key === 'Escape') { fin = true; s.remove(); }
      };
      inp.onblur = () => save();
      s.querySelector('[data-act="delete"]')?.addEventListener('click', () => { fin = true; deleteTag(id); });
    });
  };
  const bindMore = (row, kind) => {
    const m = row.querySelector('.kbp-more');
    if (m) m.onclick = e => { e.stopPropagation(); showRowMenu(row, kind); };
  };

  // теги
  const renderTags = () => {
    const box = $('#kbtags');
    box.innerHTML = cardTags.length ? cardTags.map(chipTag).join(' ') : '<span class="kbp-ph">Пусто</span>';
    box.onclick = () => openTagsPop('');
  };
  const focusTagInput = () => { const i = document.querySelector('#kbnewtag'); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } };
  const setCardTags = async (next, q = '') => {
    cardTags = next; renderTags(); openTagsPop(q); focusTagInput();
    try { const r = await api('/cards/' + kid, {method: 'PATCH', body: {tags: cardTags}}); cardTags = r.tags; renderTags(); }
    catch (e) { alert(e.message); }
  };
  const createTag = async name => {
    if (!boardTags.includes(name)) {
      try { const b2 = await api('/boards/' + c.board_id, {method: 'PATCH', body: {tags: [...boardTags, name]}}); boardTags = b2.tags; }
      catch (e) { alert(e.message); return; }
    }
    setCardTags(cardTags.includes(name) ? cardTags : [...cardTags, name]);
  };
  const deleteTag = async name => {
    try {
      const b2 = await api('/boards/' + c.board_id, {method: 'PATCH', body: {tags: boardTags.filter(x => x !== name)}});
      boardTags = b2.tags;
      cardTags = cardTags.filter(x => x !== name);
    } catch (e) { alert(e.message); }
    renderTags(); openTagsPop($('#kbnewtag')?.value || '');
  };
  const renameTag = async (oldName, nu) => {
    try {
      const r = await api(`/boards/${c.board_id}/tags/rename`, {method: 'POST', body: {old: oldName, new: nu}});
      boardTags = r.tags;
      cardTags = [...new Set(cardTags.map(x => x === oldName ? nu : x))];
    } catch (e) { alert(e.message); }
  };
  const openTagsPop = (q = '') => {
    const box = $('#kbtags');
    const term = q.trim().toLowerCase();
    const shown = boardTags.filter(x => !term || x.toLowerCase().includes(term));
    const exact = boardTags.some(x => x.toLowerCase() === term);
    const sel = cardTags.map(x => `<span class="kbp-chip" style="${tagStyle(x)}">${esc(x)}<button class="kbp-rm" data-rm="${esc(x)}" aria-label="Убрать">×</button></span>`).join('');
    const html = `<div class="kbp-top"><div class="kbp-sel">${sel}<input class="kbp-in" id="kbnewtag" value="${esc(q)}" maxlength="40" placeholder="${cardTags.length ? '' : 'Поиск или новый тег'}"></div></div>`
      + '<div class="kbp-cap">Выберите вариант или создайте новый</div>'
      + `<div class="kbp-list">${shown.map(x => rowHtml(x, chipTag(x), true, '', true)).join('')}</div>`
      + (term && !exact ? `<button class="kbp-create" data-create="1">Создать тег «${esc(q.trim())}»</button>` : '');
    kbpOpen(box, html, p => {
      const inp = p.querySelector('#kbnewtag');
      inp.oninput = () => { openTagsPop(inp.value); focusTagInput(); };
      inp.onkeydown = e => {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        const name = inp.value.trim();
        if (!name) return;
        const hit = boardTags.find(x => x.toLowerCase() === name.toLowerCase());
        if (hit) { if (!cardTags.includes(hit)) setCardTags([...cardTags, hit]); }
        else createTag(name);
      };
      p.querySelectorAll('.kbp-row').forEach(row => {
        row.querySelector('.kbp-opt').onclick = () => {
          const name = row.dataset.id;
          setCardTags(cardTags.includes(name) ? cardTags.filter(x => x !== name) : [...cardTags, name], inp.value);
        };
        bindGrip(row, 'tag');
        bindMore(row, 'tag');
      });
      p.querySelectorAll('[data-rm]').forEach(b => b.onclick = () => setCardTags(cardTags.filter(x => x !== b.dataset.rm), inp.value));
      const cr = p.querySelector('[data-create]');
      if (cr) cr.onclick = () => createTag(inp.value.trim());
    });
  };
  renderTags();
  const grow = el => { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; };
  grow(t);
  const flush = async () => {
    clearTimeout(timer); timer = null;
    if (!dirty) return;
    dirty = false;
    try {
      await api('/cards/' + kid, {method: 'PATCH', body: {title: titleText(), note: readNote(n)}});
      const s = $('#kbs'); if (s) s.textContent = 'Сохранено';
    } catch (e) { alert(e.message); }
  };
  const queue = () => {
    renumber(n);
    dirty = true;
    const s = $('#kbs'); if (s) s.textContent = 'Сохраняю…';
    clearTimeout(timer); timer = setTimeout(flush, 500);
  };
  const titleText = () => t.textContent.replace(/\s+/g, ' ').trim().slice(0, 200);
  t.oninput = () => { if (!t.textContent) t.innerHTML = ''; grow(t); queue(); };
  t.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); n.focus(); } });
  t.addEventListener('paste', e => { e.preventDefault(); document.execCommand('insertText', false, (e.clipboardData.getData('text/plain') || '').replace(/\s*\n\s*/g, ' ')); });
  t.addEventListener('click', e => { const a = e.target.closest('a'); if (a) { e.preventDefault(); window.open(a.href, '_blank', 'noopener'); } });
  t.addEventListener('blur', () => { t.innerHTML = linkify(titleText()); });

  // статус: текущая колонка — плашка; варианты — колонки доски (перенос ручкой, переименование в меню)
  const moveTo = async id => {
    kbpClose();
    if (id === curCol) return;
    curCol = id; renderCols(); renderDate();
    try {
      await api('/cards/' + kid, {method: 'PATCH', body: {column_id: id}});
      // карточка на доске под окном переезжает в новую колонку, счётчики меняются сразу
      const el = document.querySelector(`.kcard[data-card="${kid}"]`);
      const target = document.querySelector(`.kcol[data-col="${id}"] .kcards`);
      if (el && target) { target.appendChild(el); refreshColCounts(); }
    } catch (e) { alert(e.message); }
  };
  const renameCol = async (id, nu) => {
    const col = cols.find(x => x.id === +id);
    if (!col) return;
    try { await api('/columns/' + id, {method: 'PATCH', body: {name: nu}}); col.name = nu; }
    catch (e) { alert(e.message); }
  };
  const renderCols = () => {
    const box = $('#kbcols');
    const cur = cols.find(x => x.id === curCol);
    box.innerHTML = cur ? chipCol(cur.name) : '<span class="kbp-ph">Пусто</span>';
    box.onclick = () => openColsPop();
  };
  const openColsPop = () => {
    const box = $('#kbcols');
    const cur = cols.find(x => x.id === curCol);
    const html = `<div class="kbp-top"><div class="kbp-sel">${cur ? chipCol(cur.name) : ''}</div></div>`
      + '<div class="kbp-cap">Выберите статус</div>'
      + `<div class="kbp-list">${cols.map(col => rowHtml(col.id, chipCol(col.name), true, '', true)).join('')}</div>`;
    kbpOpen(box, html, p => p.querySelectorAll('.kbp-row').forEach(row => {
      row.querySelector('.kbp-opt').onclick = () => moveTo(+row.dataset.id);
      bindGrip(row, 'col');
      bindMore(row, 'col');
    }));
  };
  renderCols();

  // приоритет: одно значение из четырёх; ручки нет — уровни фиксированы
  const renderPrio = () => {
    const box = $('#kbprio');
    const cur = prio || 0;
    box.innerHTML = cur ? `${chipPrio(cur)}<span class="kbp-name">${PRIO_NAME[cur]}</span>` : '<span class="kbp-ph">Пусто</span>';
    box.onclick = () => openPrioPop();
  };
  const openPrioPop = () => {
    const box = $('#kbprio');
    const cur = prio || 0;
    const html = `<div class="kbp-top"><div class="kbp-sel">${cur ? chipPrio(cur) : ''}</div></div>`
      + '<div class="kbp-cap">Выберите приоритет</div>'
      + `<div class="kbp-list">${[3, 2, 1, 0].map(p => rowHtml(p, chipPrio(p), false, `<span class="kbp-lb">${PRIO_NAME[p]}</span>`)).join('')}</div>`;
    kbpOpen(box, html, p => p.querySelectorAll('.kbp-row').forEach(row => row.querySelector('.kbp-opt').onclick = async () => {
      const v = +row.dataset.id;
      kbpClose();
      prio = v || null;
      renderPrio();
      syncBoardPrio(prio);
      try { await api('/cards/' + kid, {method: 'PATCH', body: {priority: prio}}); }
      catch (e) { alert(e.message); }
    }));
  };
  renderPrio();

  // значок на карточке доски под окном меняется сразу
  const syncBoardPrio = p => {
    const el = document.querySelector(`.kcard[data-card="${kid}"]`);
    if (!el) return;
    el.querySelectorAll('.kc-prio').forEach(x => x.remove());
    if (!p) return;
    const chip = document.createElement('span');
    chip.className = 'kc-tag kc-prio';
    chip.style.cssText = `background:${KB_PRIO[p].bg};color:${KB_PRIO[p].tc}`;
    chip.textContent = KB_PRIO[p].t;
    let row = el.querySelector('.kc-tags');
    if (!row) { row = document.createElement('div'); row.className = 'kc-tags'; el.appendChild(row); }
    row.prepend(chip);
  };
  renderPrio();

  // дата: мини-календарь, неделя с понедельника, дни по-русски
  const MONTHS_RU = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
  const MONTHS_GEN = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  const WD_RU = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];
  const keyOf = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  let dueDate = c.due_date || null, dueTime = c.due_time || null, dueDur = c.duration_min || null, cal = null, calOff = null, calPaint = null;
  const DUR = [[15, '15 мин'], [30, '30 мин'], [45, '45 мин'], [60, '1 ч'], [90, '1 ч 30 мин'], [120, '2 ч'], [180, '3 ч'], [240, '4 ч']];
  const closeCal = () => {
    calPaint = null;
    if (cal) { cal.remove(); cal = null; }
    if (calOff) { document.removeEventListener('mousedown', calOff); calOff = null; }
  };
  const renderDate = () => {
    let txt = 'Добавить дату';
    if (dueDate) {
      const [y, m, d] = dueDate.split('-').map(Number);
      txt = `${d} ${MONTHS_GEN[m - 1]} ${y}`;
      if (dueTime) {
        const [h, mi] = dueTime.split(':').map(Number);
        txt += ', ' + dueTime;
        if (dueDur) { const e = h * 60 + mi + dueDur; txt += '–' + String(Math.floor(e / 60) % 24).padStart(2, '0') + ':' + String(e % 60).padStart(2, '0'); }
      }
    }
    const curName = (cols.find(x => x.id === curCol) || {}).name || '';
    $('#kbdate').innerHTML = `<button class="kb-dv${dueDate ? ' on' : ''}${isOverdue(dueDate, curName) ? ' od' : ''}" id="kbdv">${txt}</button>`;
    $('#kbdv').onclick = e => { e.stopPropagation(); openCal(); };
  };
  const setDate = async val => {
    dueDate = val;
    if (!val) { dueTime = null; dueDur = null; }
    renderDate();
    if (calPaint) calPaint();
    try { await api('/cards/' + kid, {method: 'PATCH', body: {due_date: val}}); }
    catch (e) { alert(e.message); }
  };
  const setTime = async val => {
    dueTime = val;
    if (!val) dueDur = null;
    renderDate();
    if (cal) { const d = cal.querySelector('#kbdur'); if (d) d.disabled = !(dueDate && dueTime); }
    try { await api('/cards/' + kid, {method: 'PATCH', body: {due_time: val}}); }
    catch (e) { alert(e.message); }
  };
  const setDur = async val => {
    dueDur = val;
    renderDate();
    try { await api('/cards/' + kid, {method: 'PATCH', body: {duration_min: val}}); }
    catch (e) { alert(e.message); }
  };
  const openCal = () => {
    if (cal) { closeCal(); return; }
    const base = dueDate ? new Date(dueDate + 'T00:00:00') : nowMsk();
    let view = new Date(base.getFullYear(), base.getMonth(), 1);
    cal = document.createElement('div');
    cal.className = 'kb-cal';
    const paint = () => {
      const y = view.getFullYear(), mo = view.getMonth();
      const lead = (new Date(y, mo, 1).getDay() + 6) % 7;
      const days = new Date(y, mo + 1, 0).getDate();
      const tkey = keyOf(nowMsk());
      let cells = '';
      for (let i = 0; i < lead; i++) cells += '<span></span>';
      for (let d = 1; d <= days; d++) {
        const key = `${y}-${String(mo + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        cells += `<button class="kb-cd${key === dueDate ? ' sel' : ''}${key === tkey ? ' today' : ''}" data-k="${key}">${d}</button>`;
      }
      const dis = dueDate ? '' : ' disabled';
      cal.innerHTML = `<div class="kb-cal-h"><button class="kb-ib" data-nav="-1" aria-label="Назад">‹</button><span>${MONTHS_RU[mo]} ${y}</span><button class="kb-ib" data-nav="1" aria-label="Вперёд">›</button></div>`
        + `<div class="kb-cal-w">${WD_RU.map(w => `<span>${w}</span>`).join('')}</div>`
        + `<div class="kb-cal-g">${cells}</div>`
        + `<div class="kb-cal-t"><span class="kb-cal-tl">Время</span><span class="kb-tpair" id="kbtwrap"><input class="kb-tin" id="kbth" inputmode="numeric" maxlength="2" placeholder="ЧЧ" value="${dueTime ? dueTime.split(':')[0] : ''}"${dis}><span>:</span><input class="kb-tin" id="kbtm" inputmode="numeric" maxlength="2" placeholder="ММ" value="${dueTime ? dueTime.split(':')[1] : ''}"${dis}></span>`
        + `<select id="kbdur"${dueDate && dueTime ? '' : ' disabled'}><option value="">Длительность</option>${DUR.map(([v, l]) => `<option value="${v}"${dueDur === v ? ' selected' : ''}>${l}</option>`).join('')}</select></div>`
        + `<div class="kb-cal-f"><button class="kb-mi" data-clear="1">Очистить дату</button></div>`;
      const tH = cal.querySelector('#kbth'), tM = cal.querySelector('#kbtm'), tWrap = cal.querySelector('#kbtwrap'), dSel = cal.querySelector('#kbdur');
      // часы и минуты — два окошка: печатаете часы, как хотите, и сами переходите к минутам после двух цифр
      const onlyDigits = el => { el.value = el.value.replace(/\D/g, '').slice(0, 2); };
      tH.oninput = () => { onlyDigits(tH); if (tH.value.length === 2) { tM.focus(); tM.select(); } };
      tM.oninput = () => onlyDigits(tM);
      tH.onfocus = () => tH.select();
      tM.onfocus = () => tM.select();
      const commitTime = () => {
        const hs = tH.value, ms = tM.value;
        if (!hs && !ms) { setTime(null); return; }
        const h = +(hs || 0), m = +(ms || 0);
        if (h > 23 || m > 59) { tH.value = dueTime ? dueTime.split(':')[0] : ''; tM.value = dueTime ? dueTime.split(':')[1] : ''; return; }
        const val = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        tH.value = val.slice(0, 2); tM.value = val.slice(3);
        setTime(val);
      };
      tWrap.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); commitTime(); (e.target).blur(); } });
      tWrap.addEventListener('focusout', e => { if (!tWrap.contains(e.relatedTarget)) commitTime(); });
      dSel.onchange = () => setDur(dSel.value ? +dSel.value : null);
      cal.querySelectorAll('[data-nav]').forEach(b => b.onclick = e => { e.stopPropagation(); view = new Date(y, mo + +b.dataset.nav, 1); paint(); });
      cal.querySelectorAll('[data-k]').forEach(b => b.onclick = e => { e.stopPropagation(); setDate(b.dataset.k); });
      cal.querySelector('[data-clear]').onclick = e => { e.stopPropagation(); setDate(null); };
    };
    calPaint = paint;
    document.body.appendChild(cal);
    const r = $('#kbdv').getBoundingClientRect();
    cal.style.left = Math.max(8, r.left) + 'px';
    cal.style.top = (r.bottom + 6) + 'px';
    paint();
    calOff = e => { if (cal && !cal.contains(e.target) && !(e.target.closest && e.target.closest('#kbdv'))) closeCal(); };
    document.addEventListener('mousedown', calOff);
  };
  renderDate();

  // «/» — меню блоков как в Notion: открывается сразу, фильтруется вводом, выбирается стрелками и Enter
  // порядок — как в меню: текст, заголовки 1–3, чекбокс, список; первые три — самые частые
  const SL_ICON = {
    text: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 6h16M4 12h16M4 18h10"/></svg>',
    hr: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 12h16"/></svg>',
    sub: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="3.5" width="8" height="8" rx="2.2"/><path d="M5.8 7.5l1.4 1.4L10 6.4"/><path d="M14 8h6.5M14 14.5h6.5M3.5 19.5h17"/></svg>',
    h1: '<span class="sl-tx">H1</span>',
    h2: '<span class="sl-tx">H2</span>',
    h3: '<span class="sl-tx">H3</span>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="3.5" width="17" height="17" rx="4"/><path d="M8 12.5l2.7 2.7L16 9.5"/></svg>',
    bul: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="5" cy="7" r="1.1" fill="currentColor"/><circle cx="5" cy="12" r="1.1" fill="currentColor"/><circle cx="5" cy="17" r="1.1" fill="currentColor"/><path d="M10 7h10M10 12h10M10 17h10"/></svg>',
    num: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6.5l1.5-1v5M3.8 11.5h2.8M4 16.2c0-1.4 2.8-1.6 2.8.1 0 1-1.3 1.2-2.8 2.4h2.8"/><path d="M10 7h10M10 12h10M10 17h10"/></svg>',
    del: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9 7V4.5h6V7M6.5 7l1 12.5h9l1-12.5"/></svg>',
  };
  const SLASH = [
    {label: 'Текст', kind: 'text', kw: 'text plain обычный'},
    {label: 'Заголовок 1', kind: 'h1', kw: 'h1 заголовок'},
    {label: 'Заголовок 2', kind: 'h2', kw: 'h2 заголовок'},
    {label: 'Заголовок 3', kind: 'h3', kw: 'h3 заголовок'},
    {label: 'Чекбокс', kind: 'check', kw: 'чекбокс check задача'},
    {label: 'Подзадачи', kind: 'sub', kw: 'подзадачи подзадача subtask todo вложенная'},
    {label: 'Список', kind: 'bul', kw: 'список bullet'},
    {label: 'Нумерованный список', kind: 'num', kw: 'нумерованный список numbered 1. цифры'},
    {label: 'Разделитель', kind: 'hr', kw: 'разделитель линия hr ---'},
  ];
  // сколько раз выбран каждый блок — по нему выбираются «часто используемые»
  const slUse = () => { try { return JSON.parse(localStorage.getItem('sl_use') || '{}'); } catch (e) { return {}; } };
  let menu = null, slashNode = null, slashStart = 0, slashEnd = 0, slashItems = [], slashSel = 0, slashRect = null, slashOut = null;
  const closeSlash = () => {
    if (menu) menu.remove();
    if (slashOut) document.removeEventListener('mousedown', slashOut, true);
    slashOut = null; menu = null; slashNode = null; slashItems = []; slashRect = null;
  };
  const paintSlash = () => {
    if (!menu) return;
    [...menu.querySelectorAll('.sl-item')].forEach((b, i) => b.classList.toggle('on', i === slashSel));
  };
  // меню открывается под строкой; если снизу не влезает — над строкой
  const placeSlash = () => {
    if (!menu || !slashRect) return;
    const h = menu.offsetHeight, below = slashRect.bottom + 6;
    const top = below + h > window.innerHeight - 8 ? Math.max(8, slashRect.top - h - 6) : below;
    menu.style.top = top + 'px';
  };
  const slBtn = (it, i) => `<button class="sl-item" data-i="${i}"><span class="sl-ic">${SL_ICON[it.kind]}</span><span class="sl-lb">${it.label}</span></button>`;
  const renderSlash = q => {
    const ql = q.toLowerCase();
    const found = SLASH.filter(it => (it.label + ' ' + it.kw).toLowerCase().includes(ql));
    slashSel = 0;
    if (!found.length) { closeSlash(); return; }
    let html;
    if (ql) {
      slashItems = found;
      html = found.map((it, i) => slBtn(it, i)).join('');
    } else {
      // сверху до трёх самых частых, линия, затем все блоки
      const u = slUse();
      const freq = SLASH.map((it, i) => ({it, i, c: u[it.kind] || 0}))
        .sort((a, b) => b.c - a.c || a.i - b.i).slice(0, 3).map(x => x.it);
      slashItems = [...freq, ...SLASH];
      html = freq.map((it, i) => slBtn(it, i)).join('') + '<div class="sl-sep"></div>'
        + SLASH.map((it, i) => slBtn(it, freq.length + i)).join('');
    }
    menu.innerHTML = html;
    paintSlash();
    placeSlash();
  };
  const openSlash = (node, start, end, q) => {
    closeSlash();
    slashNode = node; slashStart = start; slashEnd = end;
    let ln = node;
    while (ln && ln.parentNode !== n) ln = ln.parentNode;
    const rc = (ln || node.parentNode).getBoundingClientRect();
    slashRect = rc;
    menu = document.createElement('div');
    menu.className = 'slash sl-note';
    menu.style.left = Math.max(8, rc.left) + 'px';
    menu.style.top = (rc.bottom + 6) + 'px';
    menu.onmousedown = e => {
      const btn = e.target.closest('[data-i]');
      if (!btn) return;
      e.preventDefault();
      chooseSlash(slashItems[+btn.dataset.i].kind);
    };
    menu.onmousemove = e => {
      const btn = e.target.closest('[data-i]');
      if (!btn || +btn.dataset.i === slashSel) return;
      slashSel = +btn.dataset.i; paintSlash();
    };
    document.body.appendChild(menu);
    // клик вне меню закрывает его, как всплывающее окно
    slashOut = e => { if (menu && !menu.contains(e.target)) closeSlash(); };
    document.addEventListener('mousedown', slashOut, true);
    renderSlash(q);
  };
  const chooseSlash = kind => {
    if (!slashNode || !slashNode.isConnected) { closeSlash(); return; }
    const u = slUse(); u[kind] = (u[kind] || 0) + 1;
    try { localStorage.setItem('sl_use', JSON.stringify(u)); } catch (e) {}
    const txt = slashNode.textContent;
    slashNode.textContent = txt.slice(0, slashStart) + txt.slice(slashEnd);
    let el = slashNode;
    while (el && el.parentNode !== n) el = el.parentNode;
    closeSlash();
    if (!el) return;
    const text = textOf(el.classList.contains('kcheck') ? el.querySelector('.kct') : el).trim();
    if (kind === 'hr') {
      // разделитель: строка с текстом остаётся ниже него, каретка — в ней
      const hr = createLine('hr'), p = createLine('plain', text);
      n.replaceChild(hr, el); hr.after(p);
      caretEnd(p); queue();
      return;
    }
    if (kind === 'sub') {
      // секция «Подзадачи» — одна на заметку
      if (!n.querySelector('.kt-sec')) {
        const t = document.createElement('template');
        t.innerHTML = subsSection(null, NOTE_ROOT, kid).trim();
        const sec = t.content.firstElementChild;
        if (text) el.after(sec); else n.replaceChild(sec, el);
        queue();
      } else if (!text) { n.removeChild(el); queue(); }
      return;
    }
    const nl = createLine(kind === 'text' ? 'plain' : kind, text);
    n.replaceChild(nl, el);
    caretEnd(nl);
    queue();
  };

  n.oninput = () => {
    fixStrayText(n);
    queue();
    const s = getSelection();
    if (!s.rangeCount || !s.getRangeAt(0).collapsed) { closeSlash(); return; }
    const r = s.getRangeAt(0);
    const node = r.startContainer;
    if (node.nodeType === 3) {
      // нулевой символ пустой строки в проверку не берём
      const before = node.textContent.slice(0, r.startOffset).replace(/​/g, '');
      const m = before.match(/(?:^|\s)\/([^\s/]*)$/);
      if (m) {
        const start = r.startOffset - (m[1].length + 1);
        if (menu && slashNode === node) { slashStart = start; slashEnd = r.startOffset; renderSlash(m[1]); }
        else openSlash(node, start, r.startOffset, m[1]);
        return;
      }
    }
    closeSlash();
  };
  n.addEventListener('keydown', e => {
    // Ctrl/Cmd+B, I, U — жирный, курсив, подчёркнутый; сохраняются в тексте заметки
    if ((e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey) {
      const cmd = { b: 'bold', i: 'italic', u: 'underline' }[e.key.toLowerCase()];
      if (cmd) { e.preventDefault(); document.execCommand(cmd); queue(); return; }
    }
    // печать в пункте списка всегда идёт в его текст: курсор, стоявший на уровне строки, переводим внутрь
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
      const sc = getSelection();
      let rowEl = sc.rangeCount ? sc.anchorNode : null;
      while (rowEl && rowEl.parentNode !== n) rowEl = rowEl.parentNode;
      if (rowEl && rowEl.classList && rowEl.classList.contains('kcheck')) {
        const kct = rowEl.querySelector('.kct');
        if (kct && !kct.contains(sc.anchorNode)) caretEnd(rowEl);
      }
    }
    if (menu) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); slashSel = (slashSel + (e.key === 'ArrowDown' ? 1 : -1) + slashItems.length) % slashItems.length; paintSlash(); return; }
      if (e.key === 'Enter') { e.preventDefault(); chooseSlash(slashItems[slashSel].kind); return; }
      if (e.key === 'Escape') { closeSlash(); return; }
    }
    if (e.key === 'Escape') { closeSlash(); return; }
    if (e.key === 'Tab') {
      const s0 = getSelection();
      if (!s0.rangeCount) return;
      let ln = s0.anchorNode;
      while (ln && ln.parentNode !== n) ln = ln.parentNode;
      if (!ln || !ln.classList || !(ln.classList.contains('kcheck') || ln.classList.contains('kbul') || ln.classList.contains('knum'))) return;
      e.preventDefault();
      const lvl = Math.max(0, Math.min(6, +(ln.dataset.lvl || 0) + (e.shiftKey ? -1 : 1)));
      ln.dataset.lvl = lvl;
      ln.style.marginLeft = (lvl * 24) + 'px';
      queue();
      return;
    }
    // Backspace / Delete на пустом пункте списка — пункт удаляется сразу, одним нажатием
    if (e.key === 'Backspace' || e.key === 'Delete') {
      const s0 = getSelection();
      if (!s0.rangeCount) return;
      let row = s0.anchorNode;
      while (row && row.parentNode !== n) row = row.parentNode;
      if (!row || !row.classList || !row.classList.contains('kcheck')) return;
      if (textOf(row.querySelector('.kct')).trim() !== '') return;
      e.preventDefault();
      const prev = row.previousElementSibling, next = row.nextElementSibling;
      if (!prev && !next) {
        const plain = createLine('plain', '');
        n.replaceChild(plain, row);
        caretStart(plain);
      } else {
        row.remove();
        caretEnd(prev || next);
      }
      queue();
      return;
    }
    if (e.key !== 'Enter' || e.shiftKey) return;
    const s = getSelection();
    if (!s.rangeCount) return;
    let el = s.anchorNode;
    while (el && el.parentNode !== n) el = el.parentNode;
    if (!el || !el.classList) return;
    const isCheck = el.classList.contains('kcheck'), isBul = el.classList.contains('kbul'), isNum = el.classList.contains('knum');
    if (!isCheck && !isBul && !isNum) return;
    e.preventDefault();
    const text = isCheck ? textOf(el.querySelector('.kct')) : textOf(el);
    if (text.trim() === '') {
      // пустой пункт + Enter — список заканчивается, строка становится обычной
      const plain = createLine('plain', '');
      n.replaceChild(plain, el);
      caretEnd(plain);
    } else {
      // Enter делит пункт по курсору: текст справа от курсора переезжает в новый пункт
      const body = isCheck ? el.querySelector('.kct') : el;
      const r0 = s.getRangeAt(0);
      const cut = document.createRange();
      if (body.contains(r0.startContainer)) cut.setStart(r0.startContainer, r0.startOffset);
      else cut.setStart(body, 0);
      cut.setEnd(body, body.childNodes.length);
      const rest = [...cut.extractContents().childNodes].map(fmtOf).join('');
      const nl = createLine(isCheck ? 'check' : isBul ? 'bul' : 'num', rest, false, +(el.dataset.lvl || 0));
      el.after(nl);
      caretStart(nl);
    }
    queue();
  });
  // квадрат: одно нажатие — одно переключение; фокус и каретку не трогаем
  n.addEventListener('mousedown', e => {
    const box = e.target.closest && e.target.closest('.kcb');
    if (!box) return;
    e.preventDefault();
    const done = box.closest('.kcheck').classList.toggle('done');
    box.setAttribute('aria-checked', done ? 'true' : 'false');
    queue();
  });
  // ссылки открываются по нажатию, даже в режиме редактирования
  n.addEventListener('click', e => {
    const a = e.target.closest('a');
    if (a) { e.preventDefault(); window.open(a.href, '_blank', 'noopener'); }
  });
  // при выходе из поля ссылки, набранные вручную, становятся кликабельными
  n.onblur = async () => {
    closeSlash();
    await flush();
    const pos = n.scrollTop;
    n.innerHTML = renderNoteEdit(readNote(n));
    n.scrollTop = pos;
  };

  // копирование и вставка внутри заметки сохраняют заголовки, чекбоксы, списки и уровни вложенности
  const noteClip = (e, cut) => {
    const s = getSelection();
    if (!s.rangeCount || s.isCollapsed || !n.contains(s.anchorNode)) return;
    const wrap = document.createElement('div');
    wrap.appendChild(s.getRangeAt(0).cloneContents());
    const txt = readNote(wrap);
    e.clipboardData.setData('application/x-save-note', txt);
    e.clipboardData.setData('text/plain', txt);
    e.preventDefault();
    if (cut) { s.deleteFromDocument(); queue(); }
  };
  n.addEventListener('copy', e => noteClip(e, false));
  n.addEventListener('cut', e => noteClip(e, true));
  const pasteNote = (text, structured) => {
    const s0 = getSelection();
    if (s0.rangeCount && !s0.isCollapsed) s0.deleteFromDocument();
    const tpl = document.createElement('template');
    tpl.innerHTML = structured ? renderNoteEdit(text) : text.split('\n').map(l => lineHtml('plain', l)).join('');
    const nodes = [...tpl.content.childNodes];
    if (!nodes.length) return;
    let anchor = s0.rangeCount ? s0.anchorNode : null;
    while (anchor && anchor.parentNode !== n) anchor = anchor.parentNode;
    const textLine = el => !!el && el.nodeType === 1 && (el.classList.contains('kline') || el.classList.contains('kh'));
    const plainLine = el => textLine(el) && !['kcheck', 'kbul', 'knum', 'kh'].some(c => el.classList.contains(c));
    // первая строка вливается в текст прямо по каретке, без переноса на новую строку
    if (textLine(anchor) && plainLine(nodes[0])) {
      const first = nodes.shift();
      if (textOf(first).trim()) document.execCommand('insertHTML', false, first.innerHTML);
      if (!nodes.length) { queue(); return; }
    }
    const seq = [...nodes];
    let focusNode = seq[seq.length - 1];
    if (focusNode.classList.contains('kdiv')) { focusNode = createLine('plain', ''); seq.push(focusNode); }
    // текст строки справа от каретки уходит в отдельную строку после вставки
    let tail = '';
    const rr = getSelection().rangeCount ? getSelection().getRangeAt(0) : null;
    if (textLine(anchor) && rr && anchor.contains(rr.endContainer)) {
      const tr = document.createRange();
      tr.setStart(rr.endContainer, rr.endOffset);
      tr.setEnd(anchor, anchor.childNodes.length);
      tail = [...tr.extractContents().childNodes].map(fmtOf).join('');
    }
    if (tail) seq.push(createLine('plain', tail));
    if (anchor && plainLine(anchor) && textOf(anchor).trim() === '') anchor.replaceWith(...seq);
    else if (anchor) { let p = anchor; seq.forEach(x => { p.after(x); p = x; }); }
    else n.append(...seq);
    queue();
    caretEnd(focusNode);
  };
  n.addEventListener('paste', e => {
    const dt = e.clipboardData;
    if (!dt) return;
    const own = dt.getData('application/x-save-note');
    e.preventDefault();
    if (own) pasteNote(own, true);
    else pasteNote(dt.getData('text/plain') || '', false);
  });

  // «+» и ручка слева от строки: «+» добавляет строку под ней; ручка переносит строку или открывает её меню
  const GRIP = '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="6" r="1.6"/><circle cx="15" cy="6" r="1.6"/><circle cx="9" cy="12" r="1.6"/><circle cx="15" cy="12" r="1.6"/><circle cx="9" cy="18" r="1.6"/><circle cx="15" cy="18" r="1.6"/></svg>';
  const PLUS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>';
  const gut = document.createElement('div');
  gut.className = 'kgut';
  gut.innerHTML = `<button class="kg-add" title="Добавить строку" aria-label="Добавить строку">${PLUS}</button><button class="kg-grip" title="Перетащить" aria-label="Перетащить">${GRIP}</button>`;
  n.parentNode.appendChild(gut);
  let gutLine = null, drag = null, gutOver = false, gutTimer = null;
  const gutShow = () => { clearTimeout(gutTimer); gut.classList.add('on'); };
  // кнопки гаснут не сразу: пока курсор идёт к ним, они остаются на месте
  const gutHide = () => {
    clearTimeout(gutTimer);
    gutTimer = setTimeout(() => { if (!drag && !gutOver) gut.classList.remove('on'); }, 260);
  };
  const GB = 26; // размер кнопки; область нажатия такая же
  const showGut = line => {
    gutLine = line;
    const br = n.parentNode.getBoundingClientRect(), lr = line.getBoundingClientRect();
    // центр первой строки текста: высота строки из стиля этого блока (у заголовков она своя)
    const lh = parseFloat(getComputedStyle(line).lineHeight) || lr.height;
    gut.style.left = (lr.left - br.left - (GB * 2 + 6)) + 'px';
    gut.style.top = (lr.top - br.top + Math.min(lh, lr.height) / 2 - GB / 2) + 'px';
    gutShow();
  };
  const lineAt = el => { let x = el; while (x && x.parentNode !== n) x = x.parentNode; return x && x.nodeType === 1 ? x : null; };
  n.addEventListener('mousemove', e => {
    if (drag) return;
    // левее текста заметки ручка не переключается: к «+» можно идти через строки, не теряя её
    if (e.clientX < n.getBoundingClientRect().left) return;
    const l = lineAt(e.target);
    if (l && l !== gutLine) showGut(l);
  });
  n.addEventListener('mouseleave', () => { if (!drag) gutHide(); });
  gut.addEventListener('mouseenter', () => { gutOver = true; gutShow(); });
  gut.addEventListener('mouseleave', () => { gutOver = false; if (!drag) gutHide(); });
  // кнопки не должны уводить фокус из заметки: иначе она перерисуется и строка пропадёт
  gut.addEventListener('mousedown', e => e.preventDefault());
  gut.querySelector('.kg-add').onclick = () => {
    if (!gutLine) return;
    const nl = createLine('plain', '');
    gutLine.after(nl);
    caretStart(nl); queue(); showGut(nl);
  };

  // меню строки: по клику на ручку, пункт «Удалить» убирает строку целиком
  let lmenu = null;
  const closeLineMenu = () => {
    if (lmenu) lmenu.remove();
    lmenu = null;
    document.removeEventListener('mousedown', lmenuOut, true);
    document.removeEventListener('keydown', lmenuKey, true);
  };
  const lmenuOut = e => { if (lmenu && !lmenu.contains(e.target)) closeLineMenu(); };
  const lmenuKey = e => { if (e.key === 'Escape') closeLineMenu(); };
  const textLine = el => !!el && (el.classList.contains('kline') || el.classList.contains('kh'));
  const removeLine = line => {
    const prev = line.previousElementSibling, next = line.nextElementSibling;
    line.remove();
    if (!n.children.length) n.appendChild(createLine('plain', ''));
    gutLine = null;
    gut.classList.remove('on');
    const to = prev || next || n.firstElementChild;
    if (to && textLine(to)) caretEnd(to);
    queue();
  };
  const lineMenu = line => {
    closeLineMenu();
    lmenu = document.createElement('div');
    lmenu.className = 'slash sl-note';
    lmenu.innerHTML = `<button class="sl-item sl-del"><span class="sl-ic">${SL_ICON.del}</span><span class="sl-lb">Удалить</span></button>`;
    document.body.appendChild(lmenu);
    const r = gut.getBoundingClientRect();
    lmenu.style.left = Math.max(8, r.left) + 'px';
    lmenu.style.top = (r.bottom + 4) + 'px';
    lmenu.querySelector('.sl-del').onmousedown = e => { e.preventDefault(); closeLineMenu(); removeLine(line); };
    document.addEventListener('mousedown', lmenuOut, true);
    document.addEventListener('keydown', lmenuKey, true);
  };

  // соседние строки плавно уступают место перетаскиваемой; сама она не анимируется
  const FLIP_MS = 240;
  const flipMove = mutate => {
    const kids = [...n.children];
    const before = new Map(kids.map(k => [k, k.getBoundingClientRect().top]));
    mutate();
    renumber(n);
    kids.forEach(k => {
      if (k === drag) return;
      const dy = before.get(k) - k.getBoundingClientRect().top;
      if (dy && k.animate) k.animate([{transform: `translateY(${dy}px)`}, {transform: 'translateY(0)'}], {duration: FLIP_MS, easing: 'cubic-bezier(.22,.8,.3,1)'});
    });
  };
  // ближайший прокручиваемый предок заметки: у его края страница подкручивается сама
  const scrollHost = () => {
    let x = n.parentNode;
    while (x && x !== document.body) {
      if (/(auto|scroll)/.test(getComputedStyle(x).overflowY) && x.scrollHeight > x.clientHeight) return x;
      x = x.parentNode;
    }
    return null;
  };
  gut.querySelector('.kg-grip').addEventListener('pointerdown', e => {
    if (!gutLine) return;
    e.preventDefault();
    const line0 = gutLine, r0 = line0.getBoundingClientRect();
    const sx = e.clientX, sy = e.clientY, offX = sx - r0.left, offY = sy - r0.top;
    const sc = scrollHost();
    let started = false, ghost = null, gx = 0, gy = 0, tx = 0, ty = 0, raf = 0, lastY = sy;
    // призрак строки следует за курсором с небольшой инерцией
    const ghostLoop = () => {
      gx += (tx - gx) * 0.3;
      gy += (ty - gy) * 0.3;
      if (ghost) ghost.style.transform = `translate(${gx}px, ${gy}px)`;
      if (sc) {
        const r = sc.getBoundingClientRect();
        if (lastY < r.top + 60) sc.scrollTop -= 8;
        else if (lastY > r.bottom - 60) sc.scrollTop += 8;
      }
      raf = requestAnimationFrame(ghostLoop);
    };
    const onMove = ev => {
      lastY = ev.clientY;
      if (!started) {
        if (Math.abs(ev.clientX - sx) + Math.abs(ev.clientY - sy) < 5) return;
        started = true;
        closeLineMenu();
        drag = line0;
        // призрак — копия строки в той же оболочке, что и заметка, чтобы стили совпадали
        ghost = document.createElement('div');
        ghost.className = 'card-sheet note-ghost';
        ghost.style.left = r0.left + 'px';
        ghost.style.top = r0.top + 'px';
        ghost.style.width = r0.width + 'px';
        const inner = document.createElement('div');
        inner.className = 'kb-note kb-edit';
        inner.appendChild(line0.cloneNode(true));
        ghost.appendChild(inner);
        document.body.appendChild(ghost);
        drag.classList.add('kdrag');
        gut.classList.remove('on');
        document.body.style.userSelect = 'none';
        raf = requestAnimationFrame(ghostLoop);
      }
      tx = ev.clientX - offX - r0.left;
      ty = ev.clientY - offY - r0.top;
      const others = [...n.children].filter(c => c !== drag);
      let ref = null;
      for (const c of others) { const r = c.getBoundingClientRect(); if (ev.clientY < r.top + r.height / 2) { ref = c; break; } }
      const cur = drag.nextElementSibling;
      if (ref ? cur === ref : !cur) return;
      flipMove(() => { if (ref) n.insertBefore(drag, ref); else n.appendChild(drag); });
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      if (!started) { lineMenu(line0); return; }
      cancelAnimationFrame(raf);
      document.body.style.userSelect = '';
      drag.classList.remove('kdrag');
      // призрак долетает до своего места и исчезает
      const dr = drag.getBoundingClientRect();
      const from = `translate(${gx}px, ${gy}px)`, to = `translate(${dr.left - r0.left}px, ${dr.top - r0.top}px)`;
      const fly = ghost.animate([{transform: from}, {transform: to}], {duration: 200, easing: 'cubic-bezier(.22,.8,.3,1)'});
      fly.onfinish = () => ghost.remove();
      drag = null;
      showGut(line0);
      queue();
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  });

  beforeClose = async () => { closeCal(); await flush(); };
  $('#sx').onclick = closeSheet;
  const actMenu = $('#kbmenu');
  $('#kbmore').onclick = e => { e.stopPropagation(); actMenu.hidden = !actMenu.hidden; };
  document.addEventListener('click', function hideMenu(e) {
    if (!$('#kbmenu')) { document.removeEventListener('click', hideMenu); return; }
    if (!actMenu.contains(e.target)) actMenu.hidden = true;
  });
  // «На весь экран» живёт в меню «⋯»: окно карточки растягивается на всю страницу
  const sheetEl = document.querySelector('.card-sheet');
  const fullBtn = $('#kbfull');
  const syncFull = () => { fullBtn.textContent = sheetEl?.classList.contains('kb-full') ? 'Свернуть окно' : 'На весь экран'; };
  fullBtn.onclick = () => { sheetEl?.classList.toggle('kb-full'); actMenu.hidden = true; syncFull(); };
  syncFull();
  $('#kbdel').onclick = async () => {
    if (!confirm('Удалить карточку?')) return;
    beforeClose = null; clearTimeout(timer); dirty = false;
    await api('/cards/' + kid, {method: 'DELETE'});
    closeSheet();
  };
}

/* ---------- календарь: все карточки с датой из всех досок ---------- */
const CAL_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>';
const dkey = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const weekStartOf = d => { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; };
const shiftDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const WD_FULL = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];
const WD_SHORT = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];
const MON_RU = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
const MON_GEN = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
let calMode = +(localStorage.getItem('cal_mode') || 7);   // 7 — неделя, 31 — месяц
let calAnchor = nowMsk();
let calShift = 0; // режим 7 дней: сдвиг в неделях от текущей (0 — от сегодня до конца недели)
let calHidden = new Set(JSON.parse(localStorage.getItem('cal_hidden') || '[]'));
let calItems = [], calBoards = [], calMenu = null, calOverdue = [];

function calDays() {
  // режим 7 дней: первая колонка — «Просрочено»; без сдвига — от сегодня до конца недели (воскресенье),
  // стрелки переключают недели по 7 дней (понедельник — воскресенье)
  if (calMode === 7) {
    const t0 = shiftDays(nowMsk(), 0);
    const wd = (t0.getDay() + 6) % 7; // понедельник = 0
    if (calShift === 0) return Array.from({length: 7 - wd}, (_, i) => shiftDays(t0, i));
    const mon = shiftDays(t0, -wd + 7 * calShift);
    return Array.from({length: 7}, (_, i) => shiftDays(mon, i));
  }
  const s0 = weekStartOf(new Date(calAnchor.getFullYear(), calAnchor.getMonth(), 1));
  return Array.from({length: 42}, (_, i) => shiftDays(s0, i));
}

async function calendarPage() {
  $('#app').classList.add('kfull'); // календарь всегда во всю ширину
  const days = calDays();
  const todayK = dkey(nowMsk());
  const [items, boards, od] = await Promise.all([
    api(`/calendar?frm=${dkey(days[0])}&to=${dkey(days[days.length - 1])}&today=${todayK}`),
    api('/boards'),
    api(`/overdue?today=${todayK}`),
  ]);
  calItems = items; calBoards = boards; calOverdue = od;
  paintCal();
}

function paintCal() {
  const days = calDays();
  const todayKey = dkey(nowMsk());
  const byDay = {};
  calItems.filter(it => !calHidden.has(it.board_id)).forEach(it => { (byDay[it.due_date] ||= []).push(it); });
  // карточка задачи — как карточка доски: заголовок, время и метка доски
  // withDate — карточка в колонке «Просрочено»: у неё сверху красная дата, когда срок вышел
  const cardHtml = (it, withDate = false) => {
    if (it.kind === 'crm') return crmCalItem(it, true, withDate);
    const k = tagColor(it.board_name);
    const time = it.due_time ? `<span class="kc-tag kc-date${it.overdue ? ' od' : ''}">${esc(it.due_time)}</span>` : '';
    const dtag = withDate ? `<span class="kc-tag kc-date od">${esc(odDateLabel(it.due_date))}</span>` : '';
    return `<div class="kcard cal-card${it.overdue ? ' od' : ''}" data-card="${it.id}"><div class="kct">${esc(it.title || 'Без названия')}</div><div class="kc-tags">${dtag}${time}<span class="kc-tag" style="background:${k.bg};color:${k.tc}">${esc(it.board_name)}</span></div></div>`;
  };
  const wd = d => (d.getDay() + 6) % 7;
  const cardMini = it => {
    if (it.kind === 'crm') return crmCalItem(it, false);
    const k = tagColor(it.board_name);
    const time = it.due_time ? `<span class="cal-t">${esc(it.due_time)}</span>` : '';
    return `<div class="cal-item cal-card${it.overdue ? ' od' : ''}" data-card="${it.id}">${time}<span class="cal-title">${esc(it.title || 'Без названия')}</span><span class="kc-tag" style="background:${k.bg};color:${k.tc}">${esc(it.board_name)}</span></div>`;
  };
  let body;
  if (calMode === 7) {
    const odItems = calOverdue.filter(it => !calHidden.has(it.board_id));
    const odCol = `<div class="kcol cal-col cal-od"><div class="kch"><span class="kcname"><span class="kcn cal-od-t">Просрочено</span><span class="kcnt">${odItems.length}</span></span></div><div class="kcards">${odItems.length ? odItems.map(it => cardHtml(it, true)).join('') : '<div class="cal-od-empty">Просроченных нет</div>'}</div></div>`;
    const cols = odCol + days.map(d => {
      const k = dkey(d);
      const items = (byDay[k] || []).map(it => cardHtml(it)).join('');
      const sub = `${d.getDate()} ${MON_GEN[d.getMonth()]} ’${String(d.getFullYear()).slice(2)}`;
      return `<div class="kcol cal-col${k === todayKey ? ' today' : ''}" data-day="${k}"><div class="kch"><span class="kcname"><span class="kcn">${WD_FULL[wd(d)]}</span><span class="kcnt">${sub}</span></span></div><div class="kcards">${items}</div></div>`;
    }).join('');
    body = `<div class="kcols cal-strip">${cols}</div>`;
  } else {
    const heads = WD_SHORT.map(w => `<div class="cal-dh">${w}</div>`).join('');
    const cells = days.map(d => {
      const k = dkey(d);
      const cls = ['cal-day', k === todayKey ? 'today' : '', d.getMonth() !== calAnchor.getMonth() ? 'other' : ''].join(' ');
      return `<div class="${cls}" data-day="${k}"><div class="cal-dn">${d.getDate()}</div><div class="kcards">${(byDay[k] || []).map(cardMini).join('')}</div></div>`;
    }).join('');
    body = `<div class="cal-grid mo">${heads}${cells}</div>`;
  }
  const range = calMode === 7
    ? `${days[0].getDate()} ${MON_GEN[days[0].getMonth()]} – ${days[days.length - 1].getDate()} ${MON_GEN[days[days.length - 1].getMonth()]} ’${String(days[days.length - 1].getFullYear()).slice(2)}`
    : `${MON_RU[calAnchor.getMonth()]} ’${String(calAnchor.getFullYear()).slice(2)}`;
  $('#app').innerHTML = `<div class="titlerow cal-head"><div class="brand">Календарь</div>
      <div class="cal-tools">
        <div class="cal-seg"><button data-m="7" class="${calMode === 7 ? 'on' : ''}">7</button><button data-m="31" class="${calMode === 31 ? 'on' : ''}">31</button></div>
        <div class="cal-nav-grp"><button class="cal-nav" id="calprev" aria-label="Назад"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6"/></svg></button>
        <button class="cal-today" id="caltoday">Сегодня</button>
        <button class="cal-nav" id="calnext" aria-label="Вперёд"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg></button></div>
        <button class="cal-filter" id="calfilter">Доски</button>
      </div></div>
    <div class="cal-range">${range}</div>
    ${body}`;
  document.querySelectorAll('.cal-seg [data-m]').forEach(b => b.onclick = () => {
    calMode = +b.dataset.m; localStorage.setItem('cal_mode', calMode); calendarPage();
  });
  const step = n => { if (calMode === 7) calShift += n; else calAnchor = new Date(calAnchor.getFullYear(), calAnchor.getMonth() + n, 1); calendarPage(); };
  $('#calprev').onclick = () => step(-1);
  $('#calnext').onclick = () => step(1);
  $('#caltoday').onclick = () => { calAnchor = nowMsk(); calShift = 0; calendarPage(); };
  $('#calfilter').onclick = e => { e.stopPropagation(); openCalMenu(); };
  document.querySelectorAll('.cal-card').forEach(el => { el.onclick = () => { if (!calDragging) openCard(+el.dataset.card); }; });
  document.querySelectorAll('.cal-crm').forEach(el => { el.onclick = () => { location.hash = el.dataset.href; }; });
  bindCalDrag();
}
let calDragging = false;
let calDrag = null;

// перенос карточки — как на доске: призрак за курсором, серый прямоугольник на месте будущего дня
function bindCalDrag() {
  document.querySelectorAll('.cal-card').forEach(el => el.onpointerdown = e => {
    if (el.closest('.cal-od')) return; // просроченные переносятся через свою дату, не колонкой
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    calDrag = {el, id: +el.dataset.card, x0: e.clientX, y0: e.clientY, started: false, ph: null, ghost: null, sx: 0, sy: 0, cx: 0, cy: 0, tx: 0, ty: 0, raf: 0};
    window.addEventListener('pointermove', calMove);
    window.addEventListener('pointerup', calUp);
    window.addEventListener('pointercancel', calUp);
  });
}

function calMove(e) {
  if (!calDrag) return;
  if (!calDrag.started) {
    if (Math.hypot(e.clientX - calDrag.x0, e.clientY - calDrag.y0) < 6) return;
    calStart(e);
  }
  e.preventDefault();
  calDrag.tx = e.clientX - calDrag.sx;
  calDrag.ty = e.clientY - calDrag.sy;
  const strip = document.querySelector('.cal-strip');
  if (strip) {
    const r = strip.getBoundingClientRect();
    if (e.clientX > r.right - 70) strip.scrollLeft += 14;
    if (e.clientX < r.left + 70) strip.scrollLeft -= 14;
  }
  if (e.clientY < 90) window.scrollBy(0, -12);
  if (e.clientY > window.innerHeight - 90) window.scrollBy(0, 12);
  const under = document.elementFromPoint(e.clientX, e.clientY);
  const col = under && under.closest('.kcol[data-day], .cal-day[data-day]');
  if (col) calPlace(col, e.clientY);
}

function calStart(e) {
  const r = calDrag.el.getBoundingClientRect();
  calDrag.started = true;
  calDragging = true;
  calDrag.sx = e.clientX - r.left;
  calDrag.sy = e.clientY - r.top;
  calDrag.cx = r.left; calDrag.cy = r.top;
  const ph = document.createElement('div');
  ph.className = 'kph';
  ph.style.height = r.height + 'px';
  calDrag.el.replaceWith(ph);
  calDrag.ph = ph;
  const g = calDrag.el.cloneNode(true);
  g.classList.add('kghost');
  g.style.width = r.width + 'px';
  document.body.appendChild(g);
  calDrag.ghost = g;
  document.body.classList.add('kdragging');
  const follow = () => {
    if (!calDrag || !calDrag.ghost) return;
    calDrag.cx += (calDrag.tx - calDrag.cx) * 0.35;
    calDrag.cy += (calDrag.ty - calDrag.cy) * 0.35;
    calDrag.ghost.style.transform = `translate(${calDrag.cx}px, ${calDrag.cy}px) rotate(2deg)`;
    calDrag.raf = requestAnimationFrame(follow);
  };
  calDrag.tx = calDrag.cx; calDrag.ty = calDrag.cy;
  follow();
}

// место карточки в колонке дня: между карточками, по их середине
function calPlace(col, y) {
  const box = col.querySelector('.kcards');
  if (!box) return;
  let before = null;
  for (const c of box.querySelectorAll('.kcard')) {
    const r = c.getBoundingClientRect();
    if (y < r.top + r.height / 2) { before = c; break; }
  }
  if (before) {
    if (calDrag.ph.nextElementSibling !== before) box.insertBefore(calDrag.ph, before);
  } else if (box.lastElementChild !== calDrag.ph) {
    box.appendChild(calDrag.ph);
  }
}

async function calUp() {
  window.removeEventListener('pointermove', calMove);
  window.removeEventListener('pointerup', calUp);
  window.removeEventListener('pointercancel', calUp);
  const d = calDrag;
  calDrag = null;
  if (!d || !d.started) return;
  cancelAnimationFrame(d.raf);
  setTimeout(() => { calDragging = false; }, 300);
  d.ghost.remove();
  document.body.classList.remove('kdragging');
  d.ph.replaceWith(d.el); // карточка встаёт на место серого прямоугольника
  const col = d.el.closest('.kcol[data-day], .cal-day[data-day]');
  const key = col ? col.dataset.day : null;
  const it = calItems.find(x => x.id === d.id);
  if (!key || !it || it.due_date === key) return;
  it.due_date = key; // данные меняем сразу, без перезагрузки календаря
  try { await api('/cards/' + d.id, {method: 'PATCH', body: {due_date: key}}); }
  catch (err) { alert(err.message); calendarPage(); }
}

function renderCalMenu() {
  if (!calMenu) return;
  calMenu.innerHTML = '<div class="sl-head">Доски в календаре</div>' + (calBoards.length
    ? calBoards.map(b => {
        const on = !calHidden.has(b.id);
        const k = tagColor(b.name);
        const st = on ? ` style="background:${k.bg};border-color:${k.bd};color:${k.tc}"` : '';
        return `<button class="sl-item" data-b="${b.id}"><span class="cal-box${on ? ' on' : ''}"${st}>✓</span><span class="sl-lb">${esc(b.name)}</span></button>`;
      }).join('')
    : '<div class="sl-head">Досок пока нет</div>');
}
function closeCalMenu() {
  if (calMenu) { calMenu.remove(); calMenu = null; }
}
function openCalMenu() {
  if (calMenu) { closeCalMenu(); return; }
  const btn = $('#calfilter');
  calMenu = document.createElement('div');
  calMenu.className = 'slash cal-menu';
  const r = btn.getBoundingClientRect();
  calMenu.style.left = Math.max(8, r.right - 260) + 'px';
  calMenu.style.top = (r.bottom + 6) + 'px';
  calMenu.onmousedown = e => {
    e.stopPropagation(); // меню перерисуется; внешний клик его не должен закрыть
    const row = e.target.closest('[data-b]');
    if (!row) return;
    e.preventDefault();
    const id = +row.dataset.b;
    calHidden.has(id) ? calHidden.delete(id) : calHidden.add(id);
    localStorage.setItem('cal_hidden', JSON.stringify([...calHidden]));
    renderCalMenu();
    paintCal();
  };
  document.body.appendChild(calMenu);
  renderCalMenu();
  document.addEventListener('mousedown', function off(e) {
    if (!calMenu) { document.removeEventListener('mousedown', off); return; }
    if (!calMenu.contains(e.target) && !(e.target.closest && e.target.closest('#calfilter'))) { closeCalMenu(); document.removeEventListener('mousedown', off); }
  });
}

/* ---------- ссылки-«хайлайты» над доской ---------- */
const HL_DOC = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/></svg>';
const HL_LINK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/></svg>';
const HL_SHEET = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 10h16M4 15h16M10 4v16"/></svg>';
const HL_FOLDER = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>';
// файлы Google: документ — синий, таблица — зелёный, папка Drive — жёлтый; картинку страницы не показываем
const gKind = url => {
  const u = url || '';
  if (/^https?:\/\/docs\.google\.com\/document\//.test(u)) return {bg: '#e3eeff', tc: '#2f4bb0', icon: HL_DOC};
  if (/^https?:\/\/docs\.google\.com\/spreadsheets\//.test(u)) return {bg: '#e3f6ea', tc: '#2f6446', icon: HL_SHEET};
  if (/^https?:\/\/drive\.google\.com\/drive\/(u\/\d+\/)?folders\//.test(u)) return {bg: '#fff6d6', tc: '#8a6100', icon: HL_FOLDER};
  return null;
};
const hlItem = l => {
  const k = tagColor(l.host);
  const g = gKind(l.url);
  const media = g
    ? `<span class="hl-ic">${g.icon}</span>`
    : l.thumb
      ? `<img class="hl-img" src="${esc(l.thumb)}" alt="">`
      : `<span class="hl-ic">${/docs\.google|drive\.google/.test(l.url) ? HL_DOC : HL_LINK}</span>`;
  const c = g || k;
  return `<div class="hl-item" data-hl-item="${l.id}"><button class="hl-tile" data-hl-open="${l.id}" style="--hb:${c.bg};--ht:${c.tc}" title="${esc(l.url)}">${media}</button><button class="hl-pen" data-hl-edit="${l.id}" aria-label="Изменить ссылку">${PEN}</button><div class="hl-name" title="${esc(l.label)}">${esc(l.label)}</div></div>`;
};

// окно ссылки: адрес и комментарий; адрес сохраняется при выходе из поля, комментарий — по паузе в наборе
function openLink(l) {
  let lid = l ? l.id : null;
  let timer = null;
  sheet(`<div class="sheet-body hl-body">
      <div class="hl-top"><button class="hl-open" id="hlopen">Открыть</button><button class="iconbtn" id="sx" aria-label="Закрыть">${XICON}</button></div>
      ${l && l.thumb ? `<img class="hl-cover" src="${esc(l.thumb)}" alt="">` : ''}
      <label class="hl-lb" for="hlurl">Ссылка</label>
      <input class="hl-in" id="hlurl" placeholder="https://" value="${esc(l ? l.url : '')}">
      <label class="hl-lb" for="hlname">Название</label>
      <input class="hl-in" id="hlname" placeholder="Как назвать на доске" value="${esc(l ? l.name : '')}">
      <label class="hl-lb" for="hlcom">Комментарий</label>
      <textarea class="hl-ta" id="hlcom" placeholder="Комментарий к ссылке">${esc(l ? l.comment : '')}</textarea>
      <div class="hl-foot"><button class="hl-del" id="hldel"${lid == null ? ' hidden' : ''}>Удалить ссылку</button><span class="kb-saved" id="hlsaved"></span></div>
    </div>`, 'hl-sheet');
  $('#sx').onclick = closeSheet;
  const urlIn = $('#hlurl'), nameIn = $('#hlname'), com = $('#hlcom');
  const setSaved = t => { const s = $('#hlsaved'); if (s) s.textContent = t; };
  const saveName = async () => {
    if (lid == null) return;
    try { await api(`/links/${lid}`, {method: 'PATCH', body: {name: nameIn.value.trim()}}); setSaved('Сохранено'); }
    catch (e) { alert(e.message); }
  };
  $('#hlopen').onclick = () => { const u = urlIn.value.trim(); if (u) window.open(/^https?:\/\//.test(u) ? u : 'https://' + u, '_blank', 'noopener'); };
  urlIn.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); urlIn.blur(); } };
  urlIn.onchange = async () => {
    const u = urlIn.value.trim();
    if (!u) return;
    setSaved('Сохраняю…');
    try {
      const r = lid == null
        ? await api(`/boards/${curBoard}/links`, {method: 'POST', body: {url: u}})
        : await api(`/links/${lid}`, {method: 'PATCH', body: {url: u}});
      lid = r.id;
      urlIn.value = r.url;
      $('#hldel').hidden = false;
      if (nameIn.value.trim()) await saveName();
      else setSaved('Сохранено');
    } catch (e) { setSaved(''); alert(e.message); }
  };
  nameIn.onchange = saveName;
  nameIn.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); nameIn.blur(); } };
  const saveComment = async () => {
    if (lid == null) return;
    try { await api(`/links/${lid}`, {method: 'PATCH', body: {comment: com.value}}); setSaved('Сохранено'); }
    catch (e) { alert(e.message); }
  };
  com.oninput = () => { setSaved('Сохраняю…'); clearTimeout(timer); timer = setTimeout(saveComment, 500); };
  beforeClose = async () => { clearTimeout(timer); await saveComment(); };
  $('#hldel').onclick = async () => {
    if (lid == null || !confirm('Удалить ссылку?')) return;
    try { await api(`/links/${lid}`, {method: 'DELETE'}); } catch (e) { alert(e.message); return; }
    beforeClose = null;
    closeSheet();
  };
  setTimeout(() => (lid == null ? urlIn : nameIn).focus(), 0);
}

/* ---------- перетаскивание ссылок-«хайлайтов» влево и вправо ---------- */
let hlDrag = null, hlSuppress = false;
function bindHlDrag() {
  document.querySelectorAll('.hl-item[data-hl-item] .hl-tile').forEach(el => {
    el.ondragstart = e => e.preventDefault(); // иначе браузер запускает своё перетаскивание картинки и отменяет наше
    el.onpointerdown = e => {
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      hlDrag = {el: el.closest('.hl-item'), x0: e.clientX, y0: e.clientY, started: false, ph: null, ghost: null, sx: 0, sy: 0, cx: 0, cy: 0, tx: 0, ty: 0, raf: 0, orig: [], target: 0};
      window.addEventListener('pointermove', hlMove);
      window.addEventListener('pointerup', hlUp);
      window.addEventListener('pointercancel', hlUp);
    };
  });
}
function hlIds() { return [...document.querySelectorAll('#hlstrip .hl-item[data-hl-item]')].map(x => +x.dataset.hlItem); }
function hlMove(e) {
  if (!hlDrag) return;
  if (!hlDrag.started) {
    if (Math.hypot(e.clientX - hlDrag.x0, e.clientY - hlDrag.y0) < 6) return;
    hlStart(e);
  }
  e.preventDefault();
  hlDrag.tx = e.clientX - hlDrag.sx;
  hlDrag.ty = e.clientY - hlDrag.sy;
  const strip = $('#hlstrip');
  const r = strip.getBoundingClientRect();
  if (e.clientX > r.right - 60) strip.scrollLeft += 12;
  if (e.clientX < r.left + 60) strip.scrollLeft -= 12;
  hlPlace(e.clientX, e.clientY);
}
function hlStart(e) {
  const r = hlDrag.el.getBoundingClientRect();
  hlDrag.started = true;
  hlDrag.mark = hlDrag.el; // исходное место
  hlSuppress = true;
  hlDrag.orig = hlIds();
  hlDrag.sx = e.clientX - r.left;
  hlDrag.sy = e.clientY - r.top;
  hlDrag.cx = r.left; hlDrag.cy = r.top;
  hlDrag.el.style.visibility = 'hidden'; // на месте остаётся пустое место, карточка летит целиком
  const g = hlDrag.el.cloneNode(true);
  g.classList.add('hl-ghost');
  g.style.visibility = 'visible';
  g.style.width = r.width + 'px';
  g.style.height = r.height + 'px';
  document.body.appendChild(g);
  hlDrag.ghost = g;
  const ph = document.createElement('div');
  ph.className = 'hl-ph hl-ph-fixed';
  document.body.appendChild(ph);
  hlDrag.ph = ph;
  document.body.classList.add('kdragging');
  $('#hlstrip').classList.add('hl-dragging');
  const follow = () => {
    if (!hlDrag || !hlDrag.ghost) return;
    hlDrag.cx += (hlDrag.tx - hlDrag.cx) * 0.35;
    hlDrag.cy += (hlDrag.ty - hlDrag.cy) * 0.35;
    hlDrag.ghost.style.transform = `translate(${hlDrag.cx}px, ${hlDrag.cy}px) rotate(2deg)`;
    hlDrag.raf = requestAnimationFrame(follow);
  };
  hlDrag.tx = hlDrag.cx; hlDrag.ty = hlDrag.cy;
  follow();
  hlPlace(e.clientX, e.clientY);
}
// метка остаётся на месте, пока курсор внутри её контура; переходит, только когда курсор вышел за контур и попал на другую карточку
function hlPlace(x, y) {
  const d = hlDrag;
  const inside = r => x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
  const addEl = document.querySelector('#hladd');
  const rectOf = el => (el ? el.querySelector('.hl-tile') : addEl).getBoundingClientRect();
  if (!inside(rectOf(d.mark))) {
    const items = [...document.querySelectorAll('#hlstrip .hl-item[data-hl-item]')];
    const hit = items.find(it => inside(it.querySelector('.hl-tile').getBoundingClientRect()));
    if (hit) d.mark = hit;
    else if (inside(addEl.getBoundingClientRect())) d.mark = null;
  }
  const r = rectOf(d.mark);
  d.ph.style.left = r.left + 'px';
  d.ph.style.top = r.top + 'px';
  d.ph.style.width = r.width + 'px';
  d.ph.style.height = r.height + 'px';
}
async function hlUp() {
  window.removeEventListener('pointermove', hlMove);
  window.removeEventListener('pointerup', hlUp);
  window.removeEventListener('pointercancel', hlUp);
  const d = hlDrag;
  hlDrag = null;
  if (!d || !d.started) return;
  cancelAnimationFrame(d.raf);
  setTimeout(() => { hlSuppress = false; }, 300);
  d.ghost.remove();
  d.ph.remove();
  document.body.classList.remove('kdragging');
  $('#hlstrip').classList.remove('hl-dragging');
  d.el.style.visibility = '';
  // ставим ссылку на новое место вместе с её подписью
  const strip = $('#hlstrip');
  if (d.mark !== d.el) {
    // карточка садится на место, где стоит метка: при переносе вправо — после метки, влево — перед ней
    const all = [...strip.querySelectorAll('.hl-item[data-hl-item]')];
    if (!d.mark) strip.insertBefore(d.el, strip.querySelector('.hl-fixed'));
    else if (all.indexOf(d.mark) > all.indexOf(d.el)) strip.insertBefore(d.el, d.mark.nextSibling);
    else strip.insertBefore(d.el, d.mark);
  }
  const ids = hlIds();
  if (ids.join() === d.orig.join()) return;
  try { await api(`/boards/${curBoard}/links/order`, {method: 'POST', body: {ids}}); }
  catch (err) { alert(err.message); board(curBoard); }
}

/* ---------- старт ---------- */
async function start() {
  try { cats = await api('/categories'); } catch { return; }
  setHubButton(true);
  route();
}
window.addEventListener('hashchange', route);
start();
