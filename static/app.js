const SRC = {instagram: 'Instagram', youtube: 'YouTube', telegram: 'Telegram', tiktok: 'TikTok', litres: 'Литрес', kinopoisk: 'Кинопоиск', web: 'Сайт'};
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
  return `<div class="row" data-url="${esc(i.url)}">${coverHtml(i, 'thumb')}<div class="mid"><div class="t">${esc(titleOf(i))}</div><div class="m"><span>${esc(meta)}</span><button class="rb pen" data-id="${i.id}" aria-label="Открыть карточку">${PEN}</button></div>${tags}</div><button class="rb del" data-id="${i.id}" aria-label="Удалить">${XICON}</button></div>`;
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
    if (e.target.closest('.rb, .eyechip, .more-d')) return;
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
  const tilesHtml = tile('#/inbox', INBOX_STYLE, INBOX_ICON, inbox.count, 'Входящие')
    + tile('#/all', ALL_STYLE, TILES_ICON, me.total, 'Все') + catTiles;
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
    ${active === 'inbox' ? pasteHtml() : ''}
    <input class="search" id="q" placeholder="Поиск" style="display:${q || wantSearch ? 'block' : 'none'}" value="${esc(q)}">
    ${withTags ? '<div class="tags" id="tags"></div>' : ''}
    <div class="list${viewMode === 'tiles' ? ' grid' : ''}" id="list"></div>${nav(active)}`;
  bindPaste();
  $('#vbtn').onclick = toggleView;
  $('#hbtn').onclick = () => { location.hash = '#/home'; };
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

async function route() {
  const [view, ...rest] = (location.hash.slice(2) || 'hub').split('/');
  const arg = decodeURIComponent(rest.join('/'));
  pollLeft = view === 'home' ? 6 : pollLeft;
  if (view === 'hub') return hub();
  if (view === 'kanban') return boards();
  if (view === 'calendar') return calendarPage();
  if (view === 'board') return board(+arg);
  const map = {inbox: ['Входящие', {inbox: 1}], all: ['Все материалы', {}]};
  if (view === 'cat') {
    const c = cats.find(x => x.slug === arg);
    return listView(c ? c.name : 'Категория', {category: arg}, 'all', true);
  }
  if (view === 'tag') return listView('#' + arg, {tag: arg}, 'all');
  if (map[view]) return listView(map[view][0], map[view][1], view, view === 'all' || view === 'inbox');
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
  const boards = await api('/boards').catch(() => []);
  const gc = await api('/gcal/status').catch(() => ({configured: false, connected: false}));
  if (hubMenu) return;
  const app = (go, icon, label) => `<button class="hm-app" data-go="${go}"><span class="hm-ic">${icon}</span><span class="hm-lb">${esc(label)}</span></button>`;
  const m = document.createElement('div');
  m.className = 'hubmenu';
  m.innerHTML = `<div class="hm-grid">${app('#/hub', GRID_ICON, 'Хаб')}${app('#/calendar', CAL_SVG, 'Календарь')}${app('#/home', APP_ICON_SAVE, 'Сейв')}${app('#/kanban', KB_ICON, 'Доски')}</div>`
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
      <button class="hubrow" data-go="#/kanban"><span class="hubic">${KB_ICON}</span><span class="hubtxt"><b>Доски</b><i>Доски и задачи</i></span></button>
    </div>`, 'hub-sheet');
  $('#sx').onclick = closeSheet;
  document.querySelectorAll('.hubrow').forEach(r => r.onclick = () => {
    $('#sheet-root').innerHTML = '';
    location.hash = r.dataset.go;
  });
}

/* ---------- хаб приложений ---------- */
function hub() {
  $('#app').classList.remove('kfull'); // ширина меняется в ту же секунду, что и страница — без промежуточного скачка
  $('#app').innerHTML = `<div class="titlerow"><div class="brand">Приложения</div></div>
    <div class="tiles apps">
      <button class="tile" style="--c:#e7f6ee;--tc:#2f6446" data-go="#/kanban"><div class="ic">${KB_ICON}</div><div class="tf"><div class="l2">Доски</div><div class="l">Доски и задачи</div></div></button>
      <button class="tile" style="--c:#fff0f3;--tc:#c1173f" data-go="#/home"><div class="ic">${APP_ICON_SAVE}</div><div class="tf"><div class="l2">Сейв</div><div class="l">Закладки</div></div></button>
    </div>`;
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

// вид досок: строки или плитки; выбор запоминается отдельно от закладок
let boardView = (() => { try { return localStorage.getItem('kb_view') === 'tiles' ? 'tiles' : 'list'; } catch { return 'list'; } })();

async function boards() {
  const list = await api('/boards');
  const tiles = boardView === 'tiles';
  const item = b => tiles
    ? `<div class="tile kbt" data-open="${b.id}" style="--c:#f5f5f7;--tc:#222"><div class="ic">${KB_ICON}</div><div class="tf"><div class="n">${b.count}</div><div class="l">${esc(b.name)}</div></div><button class="rb del" data-delb="${b.id}" aria-label="Удалить доску">${XICON}</button><button class="bstatus kbst" data-stb="${b.id}" data-cur="${b.status || 'work'}" style="--sb:${BSTATUS[b.status || 'work'].bg};--st:${BSTATUS[b.status || 'work'].tc}">${BSTATUS[b.status || 'work'].label}</button></div>`
    : `<div class="brow" data-open="${b.id}"><div class="bname">${esc(b.name)}</div><button class="bstatus" data-stb="${b.id}" data-cur="${b.status || 'work'}" style="--sb:${BSTATUS[b.status || 'work'].bg};--st:${BSTATUS[b.status || 'work'].tc}">${BSTATUS[b.status || 'work'].label}</button><div class="bcount">${b.count}</div><button class="rb del" data-delb="${b.id}" aria-label="Удалить доску">${XICON}</button></div>`;
  // справа вверху: плюс (новая доска) и переключатель вида
  $('#app').classList.remove('kfull'); // ширина меняется в ту же секунду, что и страница — без промежуточного скачка
  $('#app').innerHTML = `<div class="titlerow"><div class="brand">Доски</div>
      <div class="tr-actions"><button class="iconbtn" id="addboard" aria-label="Новая доска" title="Новая доска">${PLUS_ICON}</button>
      <button class="iconbtn" id="kbview" aria-label="Вид досок" title="${tiles ? 'Строки' : 'Плитки'}">${tiles ? TILES_ICON : LIST_ICON}</button></div></div>
    <div class="${tiles ? 'blist tgrid' : 'blist'}">${list.length ? list.map(item).join('') : '<div class="empty">Пока нет досок. Нажмите + справа вверху.</div>'}</div>`;
  $('#kbview').onclick = () => {
    boardView = boardView === 'tiles' ? 'list' : 'tiles';
    try { localStorage.setItem('kb_view', boardView); } catch {}
    boards();
  };
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
  const inp = document.createElement('input');
  inp.className = 'kin';
  inp.value = value;
  inp.placeholder = placeholder;
  inp.maxLength = 200;
  el.replaceWith(inp);
  inp.focus();
  inp.select();
  let done = false;
  const finish = async save => {
    if (done) return;
    done = true;
    const v = inp.value.trim();
    if (save && v && v !== value) await onSave(v); else onCancel();
  };
  inp.onkeydown = e => {
    if (e.key === 'Enter') { e.preventDefault(); finish(true); }
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

// карточка доски: заголовок, дата и теги
const cardHtml = c => {
  const dt = cardDateText(c);
  const dateChip = dt ? `<span class="kc-tag kc-date">${esc(dt)}</span>` : '';
  const tags = (c.tags || []).map(t => { const k = tagColor(t); return `<span class="kc-tag" style="background:${k.bg};color:${k.tc}">${esc(t)}</span>`; }).join('');
  const row = dateChip + tags;
  return `<div class="kcard" data-card="${c.id}"><div class="kct${c.title ? '' : ' ph'}">${esc(c.title || 'Без названия')}</div>${row ? `<div class="kc-tags">${row}</div>` : ''}</div>`;
};

async function board(bid) {
  curBoard = bid;
  const b = await api('/boards/' + bid);
  const cols = b.columns.map(col => `<div class="kcol${/готов/i.test(col.name) ? ' kdone' : ''}" data-col="${col.id}">
      <div class="kch"><span class="kcname"><span class="kcn" data-rencol="${col.id}" title="Нажмите, чтобы переименовать">${esc(col.name)}</span><span class="kcnt">${col.cards.length}</span></span>
        <button class="rb del" data-delcol="${col.id}" aria-label="Удалить колонку">${XICON}</button></div>
      <div class="kcards">${col.cards.map(cardHtml).join('')}</div>
      <button class="kadd" data-addcard="${col.id}">+ Добавить карточку</button>
    </div>`).join('');
  $('#app').classList.remove('kfull'); // ширина меняется в ту же секунду, что и страница — без промежуточного скачка
  $('#app').innerHTML = `<div class="titlerow"><div class="kbtitle" id="kbname" title="Нажмите, чтобы переименовать">${esc(b.name)}</div>
      <div class="tr-actions"><button class="iconbtn" id="kball" aria-label="Все доски" title="Все доски">${HOME_ICON}</button>
      <button class="iconbtn" id="kfull" aria-label="Во всю ширину" title="${isFull(bid) ? 'Вернуть' : 'Во всю ширину'}">${isFull(bid) ? RESTORE_ICON : FULL_ICON}</button></div></div>
    <div class="kcols">${cols}<div class="kcol kaddcol"><button class="kadd" id="addcol">+ Колонка</button></div></div>`;
  $('#kball').onclick = () => { location.hash = '#/kanban'; };
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

function lineHtml(kind, text, checked, level = 0) {
  // пустая строка держит каретку: нулевой символ вместо <br>
  const body = linkify(text) || '​';
  if (kind === 'check') return `<div class="kline kcheck${checked ? ' done' : ''}" data-lvl="${level}" style="margin-left:${level * 24}px"><span class="kcb" contenteditable="false" role="checkbox" aria-checked="${checked ? 'true' : 'false'}"></span><span class="kct">${body}</span></div>`;
  if (kind === 'h') return `<div class="kh">${body}</div>`;
  if (kind === 'bul') return `<div class="kline kbul">${body}</div>`;
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
    if (line.startsWith('## ')) return lineHtml('h', line.slice(3));
    if (line.startsWith('- ')) return lineHtml('bul', line.slice(2));
    return lineHtml('plain', line);
  }).join('');
}

// текст заметки из блока: по строкам
function readNote(root) {
  return [...root.childNodes].map(node => {
    if (node.nodeType === 3) return node.textContent;
    const el = node;
    if (el.classList && el.classList.contains('kcheck')) return '  '.repeat(+(el.dataset.lvl || 0)) + `[${el.classList.contains('done') ? 'x' : ' '}] ${textOf(el.querySelector('.kct'))}`;
    if (el.classList && el.classList.contains('kh')) return '## ' + textOf(el);
    if (el.classList && el.classList.contains('kbul')) return '- ' + textOf(el);
    return textOf(el);
  }).join('\n');
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

// окно карточки: заголовок и заметка
async function openCard(kid) {
  const c = await api('/cards/' + kid);
  const bd = await api('/boards/' + c.board_id);
  let boardTags = bd.tags || [], cardTags = c.tags || [], cols = bd.columns || [], curCol = c.column_id;
  let timer = null, dirty = false;
  const DOTS = '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg>';
  sheet(`<div class="sheet-body kb-card">
      <div class="kb-top">
        <span class="kb-saved" id="kbs">Сохранено</span>
        <div class="kb-tools">
          <button class="kb-ib" id="kbmore" aria-label="Действия">${DOTS}</button>
          <button class="kb-ib" id="sx" aria-label="Закрыть">${XICON}</button>
          <div class="kb-menu" id="kbmenu" hidden><button class="kb-mi bad" id="kbdel">Удалить карточку</button></div>
        </div>
      </div>
      <div class="kb-body"><div class="kb-title" id="kbt" contenteditable="true" spellcheck="false" data-ph="Заголовок">${linkify((c.title || '').replace(/\s+/g, ' '))}</div>
      <div class="kb-props">
        <div class="kb-prop"><div class="kb-pl"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9-9-9z"/><circle cx="8" cy="8" r="1.4"/></svg><span>Теги</span></div><div class="kb-pv" id="kbtags"></div></div>
        <div class="kb-prop"><div class="kb-pl"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="8"/><path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor"/></svg><span>Статус</span></div><div class="kb-pv" id="kbcols"></div></div>
        <div class="kb-prop"><div class="kb-pl"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg><span>Дата</span></div><div class="kb-pv" id="kbdate"></div></div>
      </div>
      <hr class="kb-hr">
      <div class="kb-note kb-edit" id="kbn" contenteditable="true" spellcheck="false">${renderNoteEdit(c.note)}</div></div>
    </div>`, 'card-sheet');
  const t = $('#kbt'), n = $('#kbn');
  // теги: список доски, отмеченные — у карточки
  const renderTags = () => {
    const box = $('#kbtags');
    box.innerHTML = boardTags.map(x => { const k = tagColor(x); return `<button class="kb-tag${cardTags.includes(x) ? ' on' : ''}" style="--tb:${k.bg};--tt:${k.tc};--tbd:${k.bd}" data-tag="${esc(x)}">${esc(x)}</button>`; }).join('')
      + '<button class="kb-tag add" id="kbaddtag">+ тег</button>';
    box.querySelectorAll('[data-tag]').forEach(b => b.onclick = async () => {
      const name = b.dataset.tag;
      cardTags = cardTags.includes(name) ? cardTags.filter(x => x !== name) : [...cardTags, name];
      renderTags();
      try { const r = await api('/cards/' + kid, {method: 'PATCH', body: {tags: cardTags}}); cardTags = r.tags; renderTags(); }
      catch (e) { alert(e.message); }
    });
    $('#kbaddtag').onclick = () => {
      $('#kbaddtag').outerHTML = '<input class="kb-tag-in" id="kbnewtag" placeholder="Новый тег" maxlength="40">';
      const inp = $('#kbnewtag'); inp.focus();
      inp.onblur = () => renderTags();
      inp.onkeydown = async e => {
        if (e.key === 'Escape') { inp.onblur = null; renderTags(); return; }
        if (e.key !== 'Enter') return;
        const name = inp.value.trim();
        inp.onblur = null;
        if (!name) { renderTags(); return; }
        try {
          const b2 = await api('/boards/' + c.board_id, {method: 'PATCH', body: {tags: [...boardTags, name]}});
          boardTags = b2.tags;
          const k2 = await api('/cards/' + kid, {method: 'PATCH', body: {tags: [...cardTags, name]}});
          cardTags = k2.tags;
        } catch (err) { alert(err.message); }
        renderTags();
      };
    };
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
    dirty = true;
    const s = $('#kbs'); if (s) s.textContent = 'Сохраняю…';
    clearTimeout(timer); timer = setTimeout(flush, 500);
  };
  const titleText = () => t.textContent.replace(/\s+/g, ' ').trim().slice(0, 200);
  t.oninput = () => { if (!t.textContent) t.innerHTML = ''; queue(); };
  t.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); n.focus(); } });
  t.addEventListener('paste', e => { e.preventDefault(); document.execCommand('insertText', false, (e.clipboardData.getData('text/plain') || '').replace(/\s*\n\s*/g, ' ')); });
  t.addEventListener('click', e => { const a = e.target.closest('a'); if (a) { e.preventDefault(); window.open(a.href, '_blank', 'noopener'); } });
  t.addEventListener('blur', () => { t.innerHTML = linkify(titleText()); });

  // колонки доски: текущая — чёрным; «Готово» всегда зелёная; клик переносит карточку
  const renderCols = () => {
    const box = $('#kbcols');
    box.innerHTML = cols.map(col => {
      const done = /готов/i.test(col.name);
      return `<button class="kb-col${done ? ' done' : ''}${col.id === curCol ? ' on' : ''}" data-col="${col.id}">${esc(col.name)}</button>`;
    }).join('');
    box.querySelectorAll('[data-col]').forEach(b => b.onclick = async () => {
      const id = +b.dataset.col;
      if (id === curCol) return;
      curCol = id; renderCols();
      try {
        await api('/cards/' + kid, {method: 'PATCH', body: {column_id: id}});
        // карточка на доске под окном переезжает в новую колонку, счётчики меняются сразу
        const el = document.querySelector(`.kcard[data-card="${kid}"]`);
        const target = document.querySelector(`.kcol[data-col="${id}"] .kcards`);
        if (el && target) { target.appendChild(el); refreshColCounts(); }
      }
      catch (e) { alert(e.message); }
    });
  };
  renderCols();

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
    $('#kbdate').innerHTML = `<button class="kb-dv${dueDate ? ' on' : ''}" id="kbdv">${txt}</button>`;
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
    const base = dueDate ? new Date(dueDate + 'T00:00:00') : new Date();
    let view = new Date(base.getFullYear(), base.getMonth(), 1);
    cal = document.createElement('div');
    cal.className = 'kb-cal';
    const paint = () => {
      const y = view.getFullYear(), mo = view.getMonth();
      const lead = (new Date(y, mo, 1).getDay() + 6) % 7;
      const days = new Date(y, mo + 1, 0).getDate();
      const tkey = keyOf(new Date());
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
  const SL_ICON = {
    h: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 5v14M13 5v14M5 12h8M17 9v10M17 9h3"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="3.5" width="17" height="17" rx="4"/><path d="M8 12.5l2.7 2.7L16 9.5"/></svg>',
    bul: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="5" cy="7" r="1.1" fill="currentColor"/><circle cx="5" cy="12" r="1.1" fill="currentColor"/><circle cx="5" cy="17" r="1.1" fill="currentColor"/><path d="M10 7h10M10 12h10M10 17h10"/></svg>',
  };
  const SLASH = [
    {label: 'Заголовок', kind: 'h', sc: '##'},
    {label: 'Чекбокс', kind: 'check', sc: '[]'},
    {label: 'Список', kind: 'bul', sc: '-'},
  ];
  let menu = null, slashNode = null, slashStart = 0, slashEnd = 0, slashItems = [], slashSel = 0;
  const closeSlash = () => { if (menu) menu.remove(); menu = null; slashNode = null; slashItems = []; };
  const paintSlash = () => {
    if (!menu) return;
    [...menu.querySelectorAll('.sl-item')].forEach((b, i) => b.classList.toggle('on', i === slashSel));
  };
  const renderSlash = q => {
    const ql = q.toLowerCase();
    slashItems = SLASH.filter(it => it.label.toLowerCase().includes(ql));
    slashSel = 0;
    if (!slashItems.length) { closeSlash(); return; }
    menu.innerHTML = '<div class="sl-head">Блоки</div>' + slashItems.map((it, i) =>
      `<button class="sl-item" data-i="${i}"><span class="sl-ic">${SL_ICON[it.kind]}</span><span class="sl-lb">${it.label}</span><span class="sl-sc">${it.sc}</span></button>`).join('');
    paintSlash();
  };
  const openSlash = (node, start, end, q) => {
    closeSlash();
    slashNode = node; slashStart = start; slashEnd = end;
    let ln = node;
    while (ln && ln.parentNode !== n) ln = ln.parentNode;
    const rc = (ln || node.parentNode).getBoundingClientRect();
    menu = document.createElement('div');
    menu.className = 'slash';
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
    renderSlash(q);
  };
  const chooseSlash = kind => {
    if (!slashNode || !slashNode.isConnected) { closeSlash(); return; }
    const txt = slashNode.textContent;
    slashNode.textContent = txt.slice(0, slashStart) + txt.slice(slashEnd);
    let el = slashNode;
    while (el && el.parentNode !== n) el = el.parentNode;
    closeSlash();
    if (!el) return;
    const text = textOf(el.classList.contains('kcheck') ? el.querySelector('.kct') : el).trim();
    const nl = createLine(kind, text);
    n.replaceChild(nl, el);
    caretEnd(nl);
    queue();
  };

  n.oninput = () => {
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
      if (!ln || !ln.classList || !ln.classList.contains('kcheck')) return;
      e.preventDefault();
      const lvl = Math.max(0, Math.min(6, +(ln.dataset.lvl || 0) + (e.shiftKey ? -1 : 1)));
      ln.dataset.lvl = lvl;
      ln.style.marginLeft = (lvl * 24) + 'px';
      queue();
      return;
    }
    if (e.key !== 'Enter' || e.shiftKey) return;
    const s = getSelection();
    if (!s.rangeCount) return;
    let el = s.anchorNode;
    while (el && el.parentNode !== n) el = el.parentNode;
    if (!el || !el.classList) return;
    const isCheck = el.classList.contains('kcheck'), isBul = el.classList.contains('kbul');
    if (!isCheck && !isBul) return;
    e.preventDefault();
    const text = isCheck ? textOf(el.querySelector('.kct')) : textOf(el);
    if (text.trim() === '') {
      // пустой пункт + Enter — список заканчивается, строка становится обычной
      const plain = createLine('plain', '');
      n.replaceChild(plain, el);
      caretEnd(plain);
    } else {
      const nl = createLine(isCheck ? 'check' : 'bul', '', false, isCheck ? +(el.dataset.lvl || 0) : 0);
      el.after(nl);
      caretEnd(nl);
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

  beforeClose = async () => { closeCal(); await flush(); };
  $('#sx').onclick = closeSheet;
  const actMenu = $('#kbmenu');
  $('#kbmore').onclick = e => { e.stopPropagation(); actMenu.hidden = !actMenu.hidden; };
  document.addEventListener('click', function hideMenu(e) {
    if (!$('#kbmenu')) { document.removeEventListener('click', hideMenu); return; }
    if (!actMenu.contains(e.target)) actMenu.hidden = true;
  });
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
let calAnchor = new Date();
let calHidden = new Set(JSON.parse(localStorage.getItem('cal_hidden') || '[]'));
let calItems = [], calBoards = [], calMenu = null;

function calDays() {
  if (calMode === 7) { const s = weekStartOf(calAnchor); return Array.from({length: 7}, (_, i) => shiftDays(s, i)); }
  const first = new Date(calAnchor.getFullYear(), calAnchor.getMonth(), 1);
  const n = new Date(calAnchor.getFullYear(), calAnchor.getMonth() + 1, 0).getDate();
  return Array.from({length: n}, (_, i) => shiftDays(first, i));
}

async function calendarPage() {
  $('#app').classList.add('kfull'); // календарь всегда во всю ширину
  const days = calDays();
  const [items, boards] = await Promise.all([
    api(`/calendar?frm=${dkey(days[0])}&to=${dkey(days[days.length - 1])}`),
    api('/boards'),
  ]);
  calItems = items; calBoards = boards;
  paintCal();
}

function paintCal() {
  const days = calDays();
  const todayKey = dkey(new Date());
  const byDay = {};
  calItems.filter(it => !calHidden.has(it.board_id)).forEach(it => { (byDay[it.due_date] ||= []).push(it); });
  // карточка задачи — как карточка доски: заголовок, время и метка доски
  const cardHtml = it => {
    const k = tagColor(it.board_name);
    const time = it.due_time ? `<span class="kc-tag kc-date">${esc(it.due_time)}</span>` : '';
    return `<div class="kcard cal-card" draggable="true" data-card="${it.id}"><div class="kct">${esc(it.title || 'Без названия')}</div><div class="kc-tags">${time}<span class="kc-tag" style="background:${k.bg};color:${k.tc}">${esc(it.board_name)}</span></div></div>`;
  };
  const wd = d => (d.getDay() + 6) % 7;
  const cols = days.map(d => {
    const k = dkey(d);
    const items = (byDay[k] || []).map(cardHtml).join('');
    const name = calMode === 7 ? WD_FULL[wd(d)] : `${d.getDate()} ${SHORT_MON[d.getMonth()]}`;
    const sub = calMode === 7 ? `${d.getDate()} ${SHORT_MON[d.getMonth()]} ’${String(d.getFullYear()).slice(2)}` : WD_SHORT[wd(d)];
    return `<div class="kcol cal-col${k === todayKey ? ' today' : ''}" data-day="${k}"><div class="kch"><span class="kcname"><span class="kcn">${name}</span><span class="kcnt">${sub}</span></span></div><div class="kcards">${items}</div></div>`;
  }).join('');
  const range = calMode === 7
    ? `${days[0].getDate()} ${MON_GEN[days[0].getMonth()]} – ${days[6].getDate()} ${MON_GEN[days[6].getMonth()]} ${days[6].getFullYear()}`
    : `${MON_RU[calAnchor.getMonth()]} ${calAnchor.getFullYear()}`;
  $('#app').innerHTML = `<div class="titlerow cal-head"><div class="brand">Календарь</div>
      <div class="cal-tools">
        <div class="cal-seg"><button data-m="7" class="${calMode === 7 ? 'on' : ''}">7</button><button data-m="31" class="${calMode === 31 ? 'on' : ''}">31</button></div>
        <button class="cal-nav" id="calprev" aria-label="Назад">‹</button>
        <button class="cal-today" id="caltoday">Сегодня</button>
        <button class="cal-nav" id="calnext" aria-label="Вперёд">›</button>
        <button class="cal-filter" id="calfilter">Доски</button>
      </div></div>
    <div class="cal-range">${range}</div>
    <div class="kcols cal-strip">${cols}</div>`;
  document.querySelectorAll('.cal-seg [data-m]').forEach(b => b.onclick = () => {
    calMode = +b.dataset.m; localStorage.setItem('cal_mode', calMode); calendarPage();
  });
  const step = n => { calAnchor = calMode === 7 ? shiftDays(calAnchor, 7 * n) : new Date(calAnchor.getFullYear(), calAnchor.getMonth() + n, 1); calendarPage(); };
  $('#calprev').onclick = () => step(-1);
  $('#calnext').onclick = () => step(1);
  $('#caltoday').onclick = () => { calAnchor = new Date(); calendarPage(); };
  $('#calfilter').onclick = e => { e.stopPropagation(); openCalMenu(); };
  document.querySelectorAll('.cal-card').forEach(el => {
    el.onclick = () => { if (!calDragging) openCard(+el.dataset.card); };
    el.ondragstart = e => { calDragging = true; e.dataTransfer.setData('text/plain', el.dataset.card); e.dataTransfer.effectAllowed = 'move'; };
    el.ondragend = () => { setTimeout(() => { calDragging = false; }, 0); };
  });
  document.querySelectorAll('.kcol[data-day]').forEach(col => {
    col.ondragover = e => { e.preventDefault(); col.classList.add('drop'); };
    col.ondragleave = () => col.classList.remove('drop');
    col.ondrop = async e => {
      e.preventDefault();
      col.classList.remove('drop');
      const id = +e.dataTransfer.getData('text/plain');
      const key = col.dataset.day;
      const it = calItems.find(x => x.id === id);
      if (!it || it.due_date === key) return;
      try { await api('/cards/' + id, {method: 'PATCH', body: {due_date: key}}); }
      catch (err) { alert(err.message); }
      calendarPage();
    };
  });
}
let calDragging = false;

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

/* ---------- старт ---------- */
async function start() {
  try { cats = await api('/categories'); } catch { return; }
  setHubButton(true);
  route();
}
window.addEventListener('hashchange', route);
start();
