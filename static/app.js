const SRC = {instagram: 'Instagram', youtube: 'YouTube', telegram: 'Telegram', tiktok: 'TikTok', web: 'Сайт'};
const TYPE = {video: 'Видео', article: 'Статья', book: 'Книга', place: 'Место', product: 'Товар', image: 'Изображение', note: 'Заметка', other: 'Материал'};
const NAV = [['home', 'Главная', '⌂'], ['inbox', 'Входящие', '✉'], ['all', 'Все', '☰'], ['fav', 'Избранное', '★'], ['archive', 'Архив', '▤']];
// стили для стандартных категорий
const COL = {
  watch:  {bg: '#e9eafb', tc: '#3b3f9a', c1: '#6c7bff', c2: '#a3adff'},
  read:   {bg: '#e7f3ec', tc: '#2f6446', c1: '#3fa975', c2: '#8ad6ae'},
  ideas:  {bg: '#f8ebe0', tc: '#7a4f2e', c1: '#f08a3c', c2: '#f9c58f'},
  places: {bg: '#ece7f7', tc: '#5a4680', c1: '#8b6fe0', c2: '#c4b3f5'},
  buy:    {bg: '#fbe7f1', tc: '#8a3462', c1: '#e8609c', c2: '#f7a9cc'},
};
// стили для новых категорий: выбираются по названию-коду, чтобы цвет не менялся
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

let cats = [], q = '', pollLeft = 0, listParams = {}, searchTimer = null;

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
  $('#app').innerHTML = `<form class="login" id="lf"><div class="brand">SAVE</div>
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
  return `<nav><div class="in">${NAV.map(([k, l, ic]) => `<a href="#/${k}" class="${k === active ? 'on' : ''}"><b>${ic}</b>${l}</a>`).join('')}</div></nav>`;
}

function pasteHtml() {
  return `<div class="paste"><input id="paste" placeholder="Вставить ссылку" inputmode="url" autocapitalize="off"></div>`;
}

function bindPaste() {
  const inp = $('#paste');
  if (!inp) return;
  const go = async () => {
    const url = inp.value.trim();
    if (!url) return;
    inp.value = ''; inp.disabled = true;
    try {
      const r = await api('/items', {method: 'POST', body: {url}});
      pollLeft = 6;
      if (!r.created) alert('Эта ссылка уже в библиотеке');
      await openItem(r.item.id);
    } catch (err) { alert(err.message); }
    finally { inp.disabled = false; }
  };
  inp.onpaste = () => setTimeout(go, 0);
  inp.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); go(); } };
}

function row(i) {
  const cat = cats.find(c => c.slug === i.category);
  const wait = i.meta_state === 'pending' ? ' · собираю данные…' : '';
  const meta = [SRC[i.source], TYPE[i.content_type], cat && cat.name].filter(Boolean).join(' · ') + wait;
  const badge = i.status === 'new' ? '<span class="badge">Новое</span>' : '';
  return `<div class="row" data-url="${esc(i.url)}">${coverHtml(i, 'thumb')}<div class="mid"><div class="t">${esc(titleOf(i))}</div><div class="m">${esc(meta)}</div></div>${badge}<button class="edit" data-id="${i.id}" aria-label="Изменить">✎</button></div>`;
}

function bindRows() {
  document.querySelectorAll('.row').forEach(el => el.onclick = e => {
    if (e.target.closest('.edit')) return;
    window.open(el.dataset.url, '_blank', 'noopener');
  });
  document.querySelectorAll('.edit').forEach(b => b.onclick = e => { e.stopPropagation(); openItem(+b.dataset.id); });
}

/* ---------- экраны ---------- */
async function home() {
  const [me, items] = await Promise.all([api('/me'), api('/items?limit=6')]);
  cats = me.categories;
  $('#app').innerHTML = `<div class="brand">SAVE</div>
    <div class="hero"><div class="big">${me.total}</div><div class="sub">Материалов в библиотеке</div>
      <span class="pill">${me.new} новых</span><span class="pill">${me.done} прочитано</span></div>
    ${pasteHtml()}
    <div class="tiles">${me.categories.map(c => {
      const st = styleOf(c.slug);
      return `<button class="tile" style="--c:${st.bg};--tc:${st.tc}" data-slug="${esc(c.slug)}">
        <div class="ic">${ICONS[c.slug] || ''}</div><div class="n">${c.count}</div><div class="l">${esc(c.name)}</div></button>`;
    }).join('')}</div>
    <h2>Последние сохранения</h2>
    <div class="list">${items.length ? items.map(row).join('') : '<div class="empty">Пока пусто. Вставьте ссылку выше.</div>'}</div>${nav('home')}`;
  document.querySelectorAll('.tile').forEach(t => t.onclick = () => { location.hash = '#/cat/' + t.dataset.slug; });
  bindPaste(); bindRows(); schedulePoll(items);
}

async function listView(title, params, active) {
  listParams = params;
  $('#app').innerHTML = `<div class="brand">${esc(title)}</div>${pasteHtml()}
    ${params.category ? '<div class="tags" id="tags"></div>' : ''}
    <input class="search" id="q" placeholder="Поиск" value="${esc(q)}">
    <div class="list" id="list"></div>${nav(active)}`;
  $('#q').oninput = e => { q = e.target.value; clearTimeout(searchTimer); searchTimer = setTimeout(loadList, 250); };
  bindPaste();
  if (params.category) await loadTags();
  pollLeft = 6;
  await loadList();
}

// Теги раздела: появляются, когда у материалов раздела есть тег, и исчезают, когда тега не остаётся
async function loadTags() {
  const el = $('#tags');
  if (!el) return;
  const t = await api('/tags?category=' + encodeURIComponent(listParams.category));
  el.style.display = t.length ? '' : 'none';
  el.innerHTML = t.map(x => `<span class="tagchip ${listParams.tag === x.name ? 'on' : ''}" data-tag="${esc(x.name)}">#${esc(x.name)}</span>`).join('');
  el.querySelectorAll('[data-tag]').forEach(b => b.onclick = () => {
    if (listParams.tag === b.dataset.tag) delete listParams.tag; else listParams.tag = b.dataset.tag;
    loadTags(); loadList();
  });
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

/* ---------- карточка материала ---------- */
function closeSheet() { $('#sheet-root').innerHTML = ''; route(); }

function sheet(html) {
  $('#sheet-root').innerHTML = `<div class="overlay" id="ov"><div class="sheet">${html}</div></div>`;
  $('#ov').onclick = e => { if (e.target.id === 'ov') closeSheet(); };
}

async function openItem(id) {
  let it = await api('/items/' + id);
  const draw = () => {
    const catChips = cats.map(c => `<span class="chip ${it.category === c.slug ? 'on' : ''}" data-cat="${esc(c.slug)}">${esc(c.name)}<i class="x" data-del="${esc(c.slug)}" title="Удалить категорию">×</i></span>`).join('');
    const tagChips = it.tags.map(t => `<span class="tagchip on">#${esc(t)}<i class="x" data-rm="${esc(t)}">×</i></span>`).join('') + '<span class="tagchip add" id="addtag">+ тег</span>';
    sheet(`${coverHtml(it, 'cover')}
      <input class="title-in" id="ti" value="${esc(titleOf(it))}" placeholder="Название">
      <textarea class="desc-in" id="de" placeholder="Описание">${esc(it.description || '')}</textarea>
      ${it.meta_state === 'failed' ? '<p class="hint">Сайт не отдал название и картинку, поэтому они составлены из ссылки. Их можно поправить.</p>' : ''}
      <div class="lbl">Категория</div>
      <div class="chips" id="catbox">${catChips}<span class="chip ${!it.category ? 'on' : ''}" data-cat="">Без категории</span><span class="chip add" id="addcat">+ категория</span></div>
      <div class="lbl">Теги</div>
      <div class="chips" id="tagsbox">${tagChips}</div>
      <div class="btns">
        <a class="btn pri" href="${esc(it.url)}" target="_blank" rel="noopener">Открыть оригинал</a>
        <button class="btn bad" id="dl">Удалить</button></div>`);

    // название и описание сохраняются сами, когда поле теряет фокус
    $('#ti').onchange = async e => { it = await api('/items/' + id, {method: 'PATCH', body: {title: e.target.value.trim() || null}}); };
    $('#de').onchange = async e => { it = await api('/items/' + id, {method: 'PATCH', body: {description: e.target.value}}); };

    // категория: нажатие выбирает, крестик удаляет категорию целиком
    document.querySelectorAll('#catbox [data-cat]').forEach(el => el.onclick = async e => {
      if (e.target.dataset.del) {
        if (!confirm('Удалить категорию? Материалы останутся без категории.')) return;
        await api('/categories/' + e.target.dataset.del, {method: 'DELETE'});
        cats = await api('/categories');
        it = await api('/items/' + id);
        return draw();
      }
      it = await api('/items/' + id, {method: 'PATCH', body: {category: el.dataset.cat || null}});
      draw();
    });

    $('#addcat').onclick = () => {
      $('#addcat').outerHTML = '<input class="chip-in" id="newcat" placeholder="Название категории">';
      const inp = $('#newcat'); inp.focus();
      inp.onkeydown = async e => {
        if (e.key === 'Escape') return draw();
        if (e.key !== 'Enter') return;
        const name = inp.value.trim();
        if (!name) return;
        const c = await api('/categories', {method: 'POST', body: {name}});
        cats = await api('/categories');
        it = await api('/items/' + id, {method: 'PATCH', body: {category: c.slug}});
        draw();
      };
      inp.onblur = () => { if (!inp.value.trim()) draw(); };
    };

    // теги: добавляются плюсом, удаляются крестиком
    $('#addtag').onclick = () => {
      $('#addtag').outerHTML = '<input class="chip-in" id="newtag" placeholder="Тег">';
      const inp = $('#newtag'); inp.focus();
      inp.onkeydown = async e => {
        if (e.key === 'Escape') return draw();
        if (e.key !== 'Enter') return;
        const name = inp.value.trim().toLowerCase();
        if (!name) return;
        const tags = [...new Set([...it.tags, name])];
        it = await api('/items/' + id, {method: 'PATCH', body: {tags}});
        draw();
      };
      inp.onblur = () => { if (!inp.value.trim()) draw(); };
    };
    document.querySelectorAll('[data-rm]').forEach(el => el.onclick = async e => {
      e.stopPropagation();
      const tags = it.tags.filter(t => t !== el.dataset.rm);
      it = await api('/items/' + id, {method: 'PATCH', body: {tags}});
      draw();
    });

    $('#dl').onclick = async () => {
      if (!confirm('Удалить материал?')) return;
      await api('/items/' + id, {method: 'DELETE'});
      closeSheet();
    };
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
