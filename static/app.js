const STATUS = {new: 'Новое', planned: 'В планах', in_progress: 'В процессе', done: 'Завершено', archived: 'Архив'};
const SRC = {instagram: 'Instagram', youtube: 'YouTube', telegram: 'Telegram', tiktok: 'TikTok', web: 'Сайт'};
const TYPE = {video: 'Видео', article: 'Статья', book: 'Книга', place: 'Место', product: 'Товар', image: 'Изображение', note: 'Заметка', other: 'Материал'};
const NAV = [['home', 'Главная', '⌂'], ['inbox', 'Входящие', '✉'], ['all', 'Все', '☰'], ['fav', 'Избранное', '★'], ['archive', 'Архив', '▤']];
// цвета плиток и запасных обложек: фон плитки, цвет текста, два цвета градиента обложки
const COL = {
  watch:  {bg: '#e9eafb', tc: '#3b3f9a', c1: '#6c7bff', c2: '#a3adff'},
  read:   {bg: '#e7f3ec', tc: '#2f6446', c1: '#3fa975', c2: '#8ad6ae'},
  ideas:  {bg: '#f8ebe0', tc: '#7a4f2e', c1: '#f08a3c', c2: '#f9c58f'},
  places: {bg: '#ece7f7', tc: '#5a4680', c1: '#8b6fe0', c2: '#c4b3f5'},
  buy:    {bg: '#fbe7f1', tc: '#8a3462', c1: '#e8609c', c2: '#f7a9cc'},
};
const DEF_COL = {c1: '#8e99ad', c2: '#c9d0dc'};
const ICONS = {
  watch: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M10 9l5 3-5 3z" fill="currentColor"/></svg>',
  read: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M2 5h7a3 3 0 0 1 3 3v12a2 2 0 0 0-2-2H2z"/><path d="M22 5h-7a3 3 0 0 0-3 3v12a2 2 0 0 1 2-2h8z"/></svg>',
  ideas: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/></svg>',
  places: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 21s-7-6.2-7-11.2A7 7 0 0 1 19 9.8C19 14.8 12 21 12 21z"/><circle cx="12" cy="10" r="2.6"/></svg>',
  buy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 7h14l-1.2 12.2a1 1 0 0 1-1 .8H7.2a1 1 0 0 1-1-.8z"/><path d="M9 7a3 3 0 0 1 6 0"/></svg>',
};

let cats = [], q = '', pollLeft = 0, listParams = {}, searchTimer = null;

const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const hostOf = u => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return u; } };

// Название: если сайт его не отдал, строим понятное из ссылки, а не просто домен
function titleOf(i) {
  if (i.title) return i.title;
  let u; try { u = new URL(i.url); } catch { return i.url; }
  if (i.source === 'instagram') {
    const m = u.pathname.match(/\/(reel|p|tv)\/([^/]+)/);
    return m ? `${m[1] === 'reel' ? 'Reel' : m[1] === 'tv' ? 'IGTV' : 'Публикация'} ${m[2]} · Instagram` : 'Публикация в Instagram';
  }
  if (i.source === 'youtube') return 'Видео на YouTube';
  const last = decodeURIComponent(u.pathname.split('/').filter(Boolean).pop() || '');
  const words = last.replace(/[-_]+/g, ' ').replace(/\.\w{2,5}$/, '').trim();
  return words ? `${words} · ${hostOf(i.url)}` : hostOf(i.url);
}

function colorOf(i) { return COL[i.category] || DEF_COL; }

// Обложка: настоящая картинка, а если её нет, сгенерированная из названия
function coverHtml(i, cls) {
  if (i.thumb) return `<img class="${cls}" src="${esc(i.thumb)}" loading="lazy" alt="">`;
  const c = colorOf(i);
  return `<div class="${cls} cover-gen" style="--c1:${c.c1};--c2:${c.c2}"><span>${esc(titleOf(i))}</span></div>`;
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
  $('#app').innerHTML = `<form class="login" id="lf"><div class="brand">MY LIBRARY</div>
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
  return `<nav><div class="in">${NAV.map(([k, l, ic]) => `<a href="#/${k}" class="${k === active ? 'on' : ''}"><b>${ic}</b>${l}</a>`).join('')}</div></nav>
  <button class="fab" id="add" aria-label="Добавить">+</button>`;
}

function row(i) {
  const cat = cats.find(c => c.slug === i.category);
  const meta = [SRC[i.source], TYPE[i.content_type], cat && cat.name].filter(Boolean).join(' · ');
  const wait = i.meta_state === 'pending' ? ' · собираю данные…' : '';
  const badge = i.status === 'new' ? '<span class="badge">Новое</span>'
    : i.status === 'done' ? '<span class="badge plain">✓</span>'
    : i.status !== 'archived' ? `<span class="badge plain">${STATUS[i.status]}</span>` : '';
  return `<div class="row" data-id="${i.id}">${coverHtml(i, 'thumb')}<div class="mid"><div class="t">${esc(titleOf(i))}</div><div class="m">${esc(meta + wait)}</div></div>${badge}</div>`;
}

function bindRows() {
  document.querySelectorAll('.row').forEach(el => el.onclick = () => openItem(+el.dataset.id));
}

/* ---------- экраны ---------- */
async function home() {
  const [me, items] = await Promise.all([api('/me'), api('/items?limit=6')]);
  cats = me.categories;
  $('#app').innerHTML = `<div class="brand">MY LIBRARY</div>
    <div class="hero"><div class="big">${me.total}</div><div class="sub">Материалов в библиотеке</div>
      <span class="pill">${me.new} новых</span><span class="pill">${me.done} прочитано</span></div>
    <div class="tiles">${me.categories.map(c => {
      const col = COL[c.slug] || {bg: '#f0f1f4', tc: '#333'};
      return `<button class="tile" style="--c:${col.bg};--tc:${col.tc}" data-slug="${esc(c.slug)}">
        <div class="ic">${ICONS[c.slug] || ''}</div><div class="n">${c.count}</div><div class="l">${esc(c.name)}</div></button>`;
    }).join('')}</div>
    <h2>Последние сохранения</h2>
    <div class="list">${items.length ? items.map(row).join('') : '<div class="empty">Пока пусто. Нажмите «+», чтобы добавить ссылку.</div>'}</div>${nav('home')}`;
  document.querySelectorAll('.tile').forEach(t => t.onclick = () => { location.hash = '#/cat/' + t.dataset.slug; });
  bindRows(); bindAdd(); schedulePoll(items);
}

async function listView(title, params, active) {
  listParams = params;
  $('#app').innerHTML = `<div class="brand">${esc(title)}</div>
    <input class="search" id="q" placeholder="Поиск" value="${esc(q)}">
    <div class="list" id="list"></div>${nav(active)}`;
  $('#q').oninput = e => { q = e.target.value; clearTimeout(searchTimer); searchTimer = setTimeout(loadList, 250); };
  bindAdd();
  pollLeft = 6;
  await loadList();
}

async function loadList() {
  const p = new URLSearchParams({...listParams, limit: 200});
  if (q) p.set('q', q);
  const items = await api('/items?' + p);
  const el = $('#list');
  if (!el) return;
  el.innerHTML = items.length ? items.map(row).join('') : `<div class="empty">${q ? 'Ничего не найдено' : 'Здесь пока пусто'}</div>`;
  bindRows(); schedulePoll(items, loadList);
}

function schedulePoll(items, fn) {
  if (items.some(i => i.meta_state === 'pending') && pollLeft-- > 0) setTimeout(fn || route, 2500);
}

async function route() {
  const [view, arg] = (location.hash.slice(2) || 'home').split('/');
  pollLeft = view === 'home' ? 6 : pollLeft;
  const map = {
    inbox: ['Входящие', {status: 'new'}], all: ['Все материалы', {}],
    fav: ['Избранное', {favorite: true}], archive: ['Архив', {status: 'archived'}],
  };
  if (view === 'cat') {
    const c = cats.find(x => x.slug === arg);
    return listView(c ? c.name : 'Категория', {category: arg}, 'all');
  }
  if (map[view]) return listView(map[view][0], map[view][1], view);
  return home();
}

/* ---------- окна ---------- */
function closeSheet() { $('#sheet-root').innerHTML = ''; route(); }

function sheet(html) {
  $('#sheet-root').innerHTML = `<div class="overlay" id="ov"><div class="sheet">${html}</div></div>`;
  $('#ov').onclick = e => { if (e.target.id === 'ov') closeSheet(); };
}

function bindAdd() { const b = $('#add'); if (b) b.onclick = openAdd; }

function openAdd() {
  sheet(`<h3>Добавить ссылку</h3>
    <input class="in-text" id="u" placeholder="Вставьте ссылку" inputmode="url" autocapitalize="off">
    <div class="lbl">Заметка (необязательно)</div><textarea id="n"></textarea>
    <div class="err" id="e"></div>
    <div class="btns"><button class="btn pri" id="save">Сохранить</button><button class="btn" id="cancel">Отмена</button></div>`);
  $('#u').focus();
  $('#cancel').onclick = closeSheet;
  $('#save').onclick = async () => {
    const url = $('#u').value.trim();
    if (!url) return;
    try {
      const r = await api('/items', {method: 'POST', body: {url, note: $('#n').value.trim() || null}});
      $('#sheet-root').innerHTML = '';
      pollLeft = 6;
      if (location.hash === '#/inbox') route(); else location.hash = '#/inbox';
      if (!r.created) alert('Эта ссылка уже в библиотеке');
    } catch (err) { $('#e').textContent = err.message; }
  };
}

async function openItem(id) {
  let it = await api('/items/' + id);
  const draw = () => {
    const statuses = ['new', 'planned', 'in_progress', 'done'];
    sheet(`${coverHtml(it, 'cover')}
      <h3>${esc(titleOf(it))}</h3>
      <p class="desc">${esc([SRC[it.source], TYPE[it.content_type], it.author].filter(Boolean).join(' · '))}</p>
      ${it.description ? `<p class="desc">${esc(it.description)}</p>` : ''}
      ${it.meta_state === 'failed' ? '<p class="hint">Сайт не отдал название и картинку. Введите название вручную ниже.</p>' : ''}
      <div class="lbl">Статус</div><div class="chips">${statuses.map(s => `<span class="chip ${it.status === s ? 'on' : ''}" data-st="${s}">${STATUS[s]}</span>`).join('')}</div>
      <div class="lbl">Категория</div><div class="chips">
        ${cats.map(c => `<span class="chip ${it.category === c.slug ? 'on' : ''}" data-cat="${esc(c.slug)}">${esc(c.name)}</span>`).join('')}
        <span class="chip ${!it.category ? 'on' : ''}" data-cat="">Без категории</span></div>
      <div class="lbl">Название</div><input class="in-text" id="ti" value="${esc(it.title || '')}" placeholder="Название">
      <div class="lbl">Заметка</div><textarea id="no">${esc(it.note)}</textarea>
      <div class="lbl">Теги (через запятую)</div><input class="in-text" id="tg" value="${esc(it.tags.join(', '))}">
      <div class="lbl">Добавлено</div><div class="hint">${new Date(it.created_at).toLocaleString('ru-RU')}</div>
      <div class="btns">
        <a class="btn pri" href="${esc(it.url)}" target="_blank" rel="noopener">Открыть оригинал</a>
        <button class="btn" id="fv">${it.is_favorite ? '★ В избранном' : '☆ В избранное'}</button>
        <button class="btn" id="sv">Сохранить</button>
        ${it.meta_state !== 'ok' ? '<button class="btn" id="rf">Обновить данные</button>' : ''}
        <button class="btn" id="ar">${it.status === 'archived' ? 'Из архива' : 'В архив'}</button>
        <button class="btn bad" id="dl">Удалить</button>
        <button class="btn" id="cl">Закрыть</button></div>`);
    document.querySelectorAll('[data-st]').forEach(el => el.onclick = async () => { it = await api('/items/' + id, {method: 'PATCH', body: {status: el.dataset.st}}); draw(); });
    document.querySelectorAll('[data-cat]').forEach(el => el.onclick = async () => { it = await api('/items/' + id, {method: 'PATCH', body: {category: el.dataset.cat || null}}); draw(); });
    $('#fv').onclick = async () => { it = await api('/items/' + id, {method: 'PATCH', body: {is_favorite: !it.is_favorite}}); draw(); };
    $('#sv').onclick = async () => {
      const tags = $('#tg').value.split(',').map(t => t.trim()).filter(Boolean);
      it = await api('/items/' + id, {method: 'PATCH', body: {note: $('#no').value, title: $('#ti').value.trim() || null, tags}}); draw();
    };
    const rf = $('#rf'); if (rf) rf.onclick = async () => { await api(`/items/${id}/refresh`, {method: 'POST'}); pollLeft = 6; closeSheet(); };
    $('#ar').onclick = async () => { await api('/items/' + id, {method: 'PATCH', body: {status: it.status === 'archived' ? 'planned' : 'archived'}}); closeSheet(); };
    $('#dl').onclick = async () => { if (confirm('Удалить материал?')) { await api('/items/' + id, {method: 'DELETE'}); closeSheet(); } };
    $('#cl').onclick = closeSheet;
  };
  draw();
}

/* ---------- старт ---------- */
async function start() {
  try { cats = await api('/categories'); } catch { return; }
  route();
}
window.addEventListener('hashchange', route);
start();
