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
const PEN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/></svg>';
// глаз: серый по умолчанию, пастельная зелёная галочка, когда материал проработан
const EYE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="5"/><path d="M7 12c1.5-2.5 3.2-3.8 5-3.8s3.5 1.3 5 3.8c-1.5 2.5-3.2 3.8-5 3.8S8.5 14.5 7 12z"/><circle cx="12" cy="12" r="1.7"/></svg>';
const EYE_ON = '<svg viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="5" fill="#dcf2e5" stroke="#3fa975" stroke-width="1.8"/><path d="M7.5 12.5l3 3 6-6.5" stroke="#3fa975" stroke-width="2.2"/></svg>';

const EYE_C = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/></svg>';
const CHECK_C = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const eyeChip = (done, attrs) => `<span class="tagbadge eyechip ${done ? 'on' : ''}" ${attrs} title="Прочитано">${done ? CHECK_C : EYE_C}</span>`;

let cats = [], q = '', pollLeft = 0, listParams = {}, searchTimer = null, openSearch = false;

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
  $('#sheet-root').innerHTML = '';
  $('#app').innerHTML = `<form class="login" id="lf"><div class="brand logo">SAVE</div>
    <input class="in-text" type="password" id="pw" placeholder="Пароль" autofocus>
    <div class="err" id="le"></div><button class="btn pri">Войти</button></form>`;
  $('#lf').onsubmit = async e => {
    e.preventDefault();
    try { await api('/login', {method: 'POST', body: {password: $('#pw').value}}); await start(); }
    catch (err) { $('#le').textContent = err.message === '401' ? 'Неверный пароль' : err.message; }
  };
}

/* ---------- каркас ---------- */
function nav(active) {
  return `<nav><div class="in">${NAV.map(([k, l, ic]) => `<a href="#/${k}" class="${k === active ? 'on' : ''}"><b>${ic}</b><span>${l}</span></a>`).join('')}</div></nav>`;
}

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
  // описание: первые ~50 символов, дальше «…» — нажатие открывает карточку, чтобы дочитать
  const d = (i.description || '').replace(/\s+/g, ' ').trim();
  const short = d.length > 50 ? d.slice(0, 50).replace(/\s+\S*$/, '') : d;
  const desc = d ? `<div class="rdesc">${esc(short)}${d.length > 50 ? `<button class="more-d" data-id="${i.id}" aria-label="Дочитать">…</button>` : ''}</div>` : '';
  const tags = `${desc}<div class="tagline">${eye}${i.tags.map(t => `<span class="tagbadge">#${esc(t)}</span>`).join('')}</div>`;
  return `<div class="row" data-url="${esc(i.url)}">${coverHtml(i, 'thumb')}<div class="mid"><div class="t">${esc(titleOf(i))}</div><div class="m"><span>${esc(meta)}</span><button class="rb pen" data-id="${i.id}" aria-label="Открыть карточку">${PEN}</button></div>${tags}</div><button class="rb del" data-id="${i.id}" aria-label="Удалить">×</button></div>`;
}

// перерисовываем список только если что-то изменилось, иначе клик теряется между опросами
function paint(el, html) {
  if (el.dataset.h === html) return;
  if ($('#ov') && el.dataset.h !== undefined) return; // окно открыто: список обновится после закрытия
  el.innerHTML = html;
  el.dataset.h = html;
  bindRows();
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
  const [me, items, tags] = await Promise.all([api('/me'), api('/items?limit=15'), api('/tags')]);
  cats = me.categories;
  const listHtml = items.length ? items.map(row).join('') : '<div class="empty">Пока пусто. Вставьте ссылку выше.</div>';
  $('#app').innerHTML = `<div class="titlerow"><div class="brand logo">SAVE</div>
      <button class="iconbtn" id="hsbtn" aria-label="Поиск">${LOUPE}</button></div>
    <div class="hero"><div class="big">${me.total}</div><div class="sub">Материалов в библиотеке</div></div>
    ${pasteHtml()}
    ${tags.length ? `<div class="tags home-tags">${tags.map(t => `<span class="tagchip" data-alltag="${esc(t.name)}">#${esc(t.name)}</span>`).join('')}</div>` : ''}
    <div class="tiles">${me.categories.map(c => {
      const st = styleOf(c.slug);
      return `<button class="tile" style="--c:${st.bg};--tc:${st.tc}" data-slug="${esc(c.slug)}">
        <div class="ic">${ICONS[c.slug] || ''}</div><div class="n">${c.count}</div><div class="l">${esc(c.name)}</div></button>`;
    }).join('')}</div>
    <h2>Последние сохранения</h2>
    <div class="list" id="list">${listHtml}</div>${nav('home')}`;
  document.querySelectorAll('.tile').forEach(t => t.onclick = () => { location.hash = '#/cat/' + t.dataset.slug; });
  document.querySelectorAll('[data-alltag]').forEach(t => t.onclick = () => { location.hash = '#/tag/' + encodeURIComponent(t.dataset.alltag); });
  $('#hsbtn').onclick = () => { openSearch = true; if (location.hash === '#/all') route(); else location.hash = '#/all'; };
  bindPaste(); bindRows(); $('#list').dataset.h = listHtml;
  schedulePoll(items, homeList);
}

// на главной обновляем только список последних, без перерисовки всей страницы
async function homeList() {
  const items = await api('/items?limit=15');
  const el = $('#list');
  if (!el) return;
  paint(el, items.length ? items.map(row).join('') : '<div class="empty">Пока пусто. Вставьте ссылку выше.</div>');
  schedulePoll(items, homeList);
}

/* ---------- списки ---------- */
async function listView(title, params, active, withTags = false) {
  listParams = params;
  const wantSearch = openSearch; openSearch = false;
  $('#app').innerHTML = `<div class="titlerow"><div class="brand">${esc(title)}</div>
      <div class="tr-actions"><button class="iconbtn" id="bback" aria-label="Назад">${BACK}</button>
      <button class="iconbtn" id="sbtn" aria-label="Поиск">${LOUPE}</button></div></div>
    ${params.category || params.inbox ? '<div class="catsub" id="csub"></div>' : ''}
    ${active === 'inbox' ? pasteHtml() : ''}
    <input class="search" id="q" placeholder="Поиск" style="display:${q || wantSearch ? 'block' : 'none'}" value="${esc(q)}">
    ${withTags ? '<div class="tags" id="tags"></div>' : ''}
    <div class="list" id="list"></div>${nav(active)}`;
  bindPaste();
  $('#bback').onclick = () => { location.hash = '#/home'; };
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
  paint(el, items.length ? items.map(row).join('') : `<div class="empty">${empty}</div>`);
  schedulePoll(items, loadList);
}

function schedulePoll(items, fn) {
  if (items.some(i => i.meta_state === 'pending') && pollLeft-- > 0) setTimeout(fn || route, 2500);
}

async function route() {
  const [view, ...rest] = (location.hash.slice(2) || 'home').split('/');
  const arg = decodeURIComponent(rest.join('/'));
  pollLeft = view === 'home' ? 6 : pollLeft;
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
function closeSheet() { $('#sheet-root').innerHTML = ''; route(); }

function sheet(html) {
  let ov = $('#ov');
  if (!ov) {
    $('#sheet-root').innerHTML = `<div class="overlay" id="ov"><div class="sheet"></div></div>`;
    ov = $('#ov');
    ov.onclick = e => { if (e.target.id === 'ov') closeSheet(); };
  }
  const box = ov.querySelector('.sheet');
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
    const refreshBtn = it.thumb && it.title && it.meta_state === 'ok' && (it.source !== 'kinopoisk' || it.description) ? '' : '<button class="linkbtn" id="rf">Обновить данные</button>';
    sheet(`<button class="sheet-x" id="sx" aria-label="Закрыть">×</button>${coverHtml(it, 'cover')}
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

/* ---------- старт ---------- */
async function start() {
  try { cats = await api('/categories'); } catch { return; }
  route();
}
window.addEventListener('hashchange', route);
start();
