const STATUS = {new: 'Новое', planned: 'В планах', in_progress: 'В процессе', done: 'Завершено', archived: 'Архив'};
const SRC = {instagram: 'Instagram', youtube: 'YouTube', telegram: 'Telegram', tiktok: 'TikTok', web: 'Сайт'};
const TYPE = {video: 'Видео', article: 'Статья', book: 'Книга', place: 'Место', product: 'Товар', image: 'Изображение', note: 'Заметка', other: 'Материал'};
const NAV = [['home', 'Главная', '⌂'], ['inbox', 'Входящие', '✉'], ['all', 'Все', '☰'], ['fav', 'Избранное', '★'], ['archive', 'Архив', '▤']];
let cats = [], q = '', pollLeft = 0, listParams = {}, searchTimer = null;

const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const hostOf = u => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return u; } };

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
  $('#app').innerHTML = `<form class="login" id="lf"><h1>MY LIBRARY</h1>
    <input class="in-text" type="password" id="pw" placeholder="Пароль" autofocus>
    <div class="err" id="le"></div><button class="btn pri">Войти</button></form>`;
  $('#lf').onsubmit = async e => {
    e.preventDefault();
    try { await api('/login', {method: 'POST', body: {password: $('#pw').value}}); await start(); }
    catch (err) { if (err.message !== '401') $('#le').textContent = err.message; else $('#le').textContent = 'Неверный пароль'; }
  };
}

/* ---------- каркас ---------- */
function nav(active) {
  return `<nav><div class="in">${NAV.map(([k, l, ic]) => `<a href="#/${k}" class="${k === active ? 'on' : ''}"><b>${ic}</b>${l}</a>`).join('')}</div></nav>
  <button class="fab" id="add" aria-label="Добавить">+</button>`;
}

function row(i) {
  const title = i.title || hostOf(i.url);
  const thumb = i.thumb ? `<img class="thumb" src="${esc(i.thumb)}" loading="lazy" alt="">` : `<div class="thumb">${esc((SRC[i.source] || '?')[0])}</div>`;
  const cat = cats.find(c => c.slug === i.category);
  const meta = [SRC[i.source], TYPE[i.content_type], cat && cat.name].filter(Boolean).join(' · ');
  const wait = i.meta_state === 'pending' ? ' · собираю данные…' : '';
  const badge = i.status === 'new' ? '<span class="badge new">Новое</span>' : i.status !== 'archived' ? `<span class="badge">${STATUS[i.status]}</span>` : '';
  return `<div class="row" data-id="${i.id}">${thumb}<div class="mid"><div class="t">${esc(title)}</div><div class="m">${esc(meta + wait)}</div></div>${badge}</div>`;
}

function bindRows() {
  document.querySelectorAll('.row').forEach(el => el.onclick = () => openItem(+el.dataset.id));
}

/* ---------- экраны ---------- */
async function home() {
  const [me, items] = await Promise.all([api('/me'), api('/items?limit=6')]);
  cats = me.categories;
  const icons = {watch: '▶', read: '📖', ideas: '💡', places: '📍', buy: '🛍'};
  $('#app').innerHTML = `<h1>MY LIBRARY</h1>
    <div class="hero"><div class="big">${me.total}</div><div class="sub">Материалов в библиотеке</div>
      <span class="pill">${me.new} новых</span><span class="pill">${me.done} завершено</span></div>
    <div class="tiles">${me.categories.map(c => `<button class="tile" style="--c:${esc(c.color)}" data-slug="${esc(c.slug)}">
      <div>${icons[c.slug] || '•'}</div><div class="n">${c.count}</div><div class="l">${esc(c.name)}</div></button>`).join('')}</div>
    <h2>Последние сохранения</h2>
    <div class="list">${items.length ? items.map(row).join('') : '<div class="empty">Пока пусто. Нажмите «+», чтобы добавить ссылку.</div>'}</div>${nav('home')}`;
  document.querySelectorAll('.tile').forEach(t => t.onclick = () => { location.hash = '#/cat/' + t.dataset.slug; });
  bindRows(); bindAdd(); schedulePoll(items);
}

async function listView(title, params, active) {
  listParams = params;
  $('#app').innerHTML = `<h1>${esc(title)}</h1>
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
    const title = it.title || hostOf(it.url);
    const statuses = ['new', 'planned', 'in_progress', 'done'];
    sheet(`${it.thumb ? `<img class="cover" src="${esc(it.thumb)}" alt="">` : ''}
      <h3>${esc(title)}</h3>
      <p class="desc">${esc([SRC[it.source], TYPE[it.content_type], it.author].filter(Boolean).join(' · '))}</p>
      ${it.description ? `<p class="desc">${esc(it.description)}</p>` : ''}
      ${it.meta_state === 'failed' ? '<p class="hint">Название и обложку получить не удалось — можно задать название вручную ниже.</p>' : ''}
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
