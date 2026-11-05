/* ---------- CRM: воронка сделок, контакты, компании, сообщения и задачи ----------
   Отдельный файл поверх app.js: использует api, sheet, closeSheet, beforeClose, esc, $, tagColor, XICON, PLUS_ICON. */

// цвет этапа: «успешно» и «потеряно» фиксированы, остальные берут цвет по порядку
const CRM_PALETTE = ['#9fc4f5', '#f3e08a', '#f2b8b8', '#c7cdd8', '#d6c4f5', '#b9e3e0', '#f5cfa8'];
const CRM_KIND_COLOR = {won: '#9ed9ae', lost: '#c9c9cf'};
const CRM_KIND_NAME = {work: 'В работе', won: 'Успешная', lost: 'Потерянная'};
const crmColor = (st, i) => CRM_KIND_COLOR[st.kind] || CRM_PALETTE[Math.max(i, 0) % CRM_PALETTE.length];

// воронки для бокового меню и открытая сейчас
let crmFunnels = [];
let crmCurFunnel = null;
let crmFocusNext = null;  // что выделить после перерисовки: {kind: 'title'} или {kind: 'stage', id}
async function crmLoadFunnels() { crmFunnels = (await api('/crm/funnels')).funnels; }

const CRM_ICO = {
  funnel: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M3 5h18l-7 8.5V19l-4 2v-7.5z"/></svg>',
  user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5"/></svg>',
  building: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M9 7h2M13 7h2M9 11h2M13 11h2M10 21v-4h4v4"/></svg>',
  rub: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M7 4h6a4 4 0 0 1 0 8H7zM5 12h8M5 15h8M9 4v16"/></svg>',
  dot: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="8"/><path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor"/></svg>',
  link: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/></svg>',
  trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg>',
  send: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12l16-8-6 16-2-6z"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>',
  dots: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg>',
  chev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 9l6 6 6-6"/></svg>',
  back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6"/></svg>',
};

const crmPlural = (n, one, few, many) => {
  const m = Math.abs(n) % 100, d = m % 10;
  if (m > 10 && m < 20) return many;
  if (d > 1 && d < 5) return few;
  if (d === 1) return one;
  return many;
};
const crmMoney = n => (n || 0).toLocaleString('ru-RU') + ' ₽';
const crmDate = iso => (iso ? iso.split('-').reverse().join('.') : '');
const crmStamp = iso => new Date(iso).toLocaleString('ru-RU', {day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'});
const crmDebounce = (fn, ms = 220) => { let t = null; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
const crmToday = () => { const d = nowMsk(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const crmCap = s => s.charAt(0).toUpperCase() + s.slice(1);
const crmInitials = name => String(name || '?').trim().split(/\s+/).slice(0, 2).map(w => w[0] || '').join('').toUpperCase() || '?';
const crmAvatar = (name, cls = '') => {
  const k = tagColor(name || '?');
  return `<span class="crm-av ${cls}" style="background:${k.bg};color:${k.tc}">${esc(crmInitials(name))}</span>`;
};

// окна поверх друг друга: закрытие верхнего возвращает предыдущее
let crmStack = [];      // окна под текущим: {fn, kind} — как их заново открыть
let crmCurrent = null;  // функция, которая открывает текущее окно
let crmCurKind = null;  // вид текущего окна: deal | contact | company
let crmReturn = null;   // куда вернуться из окна сделки, открытого со страницы
const CRM_KIND_BACK = {deal: 'К сделке', contact: 'К контакту', company: 'К компании'};

// kind — вид окна, которое открываем
function crmOpenWin(kind, fn) {
  if (crmCurrent) crmStack.push({fn: crmCurrent, kind: crmCurKind});
  crmCurrent = fn;
  crmCurKind = kind;
  return fn();
}
// «назад»: возвращаемся к предыдущему окну, остальные остаются
function crmCloseWin() {
  if (crmStack.length) {
    const prev = crmStack.pop();
    crmCurrent = prev.fn;
    crmCurKind = prev.kind;
    return prev.fn();
  }
  return crmCloseAll();
}
// крестик: закрываем всё и возвращаемся на страницу (воронка, список, задачи)
function crmCloseAll() {
  crmStack = []; crmCurrent = null; crmCurKind = null;
  // адрес окна не должен снова открыть его: возвращаемся к разделу
  const h = location.hash;
  const page = /^#\/crm\/(deal|contact|company)\//.test(h)
    ? (h.startsWith('#/crm/deal/') ? '#/crm' : h.startsWith('#/crm/contact/') ? '#/crm/contacts' : '#/crm/companies')
    : null;
  if (page && page !== h) location.hash = page;
  return closeSheet();
}
// подпись кнопки «назад» — к какому окну вернёмся
const crmBackBtn = () => {
  if (!crmStack.length) return '';
  const top = crmStack[crmStack.length - 1];
  return `<button class="crm-backwin" id="crmback" aria-label="${CRM_KIND_BACK[top.kind] || 'Назад'}">${CRM_ICO.back}<span>${CRM_KIND_BACK[top.kind] || 'Назад'}</span></button>`;
};
// клик за пределами окна: закрывается только текущее окно, остальные остаются
function crmOverlay() {
  const ov = $('#ov');
  if (ov) ov.onclick = e => { if (e.target.id === 'ov') crmCloseOutside(); };
}
// клик мимо окна: возвращаемся к окну, с которого начата цепочка (например, к сделке), а не на шаг назад;
// если окно одно — закрываем всё и возвращаемся на страницу
function crmCloseOutside() {
  if (crmStack.length) {
    const root = crmStack[0];
    crmStack = [];
    crmCurrent = root.fn;
    crmCurKind = root.kind;
    return root.fn();
  }
  return crmCloseAll();
}
// клик мимо меню сообщения — меню закрывается
document.addEventListener('click', e => {
  if (!e.target.closest('.crm-msg-acts')) document.querySelectorAll('[data-msg-menu],[data-task-menu]').forEach(m => { m.hidden = true; });
});

/* ---------- каркас: слева меню разделов, справа содержимое ---------- */
function crmShell(active, inner, narrow = false, fid = null) {
  crmStack = []; crmCurrent = null;
  crmMenuClose();
  $('#app').classList.add('kfull');
  const funnels = crmFunnels.map(f => `<a class="crm-fnav-i${f.id === fid ? ' on' : ''}" data-fid="${f.id}" href="#/crm/funnel/${f.id}"><span>${esc(f.title)}</span></a>`).join('');
  $('#app').innerHTML = `<div class="crm">
    <div class="crm-nav" role="navigation" aria-label="CRM">
      <div class="crm-nav-t">CRM</div>
      <a class="crm-nav-i${active === 'pipe' ? ' on' : ''}" href="#/crm"><span class="crm-nav-ic">${CRM_ICO.funnel}</span>Воронки</a>
      <div class="crm-fnav">${funnels}<button class="crm-fnav-add" id="crmfnadd">${PLUS_ICON}<span>Новая воронка</span></button></div>
      <a class="crm-nav-i${active === 'tasks' ? ' on' : ''}" href="#/crm/tasks"><span class="crm-nav-ic">${CRM_ICO.check}</span>Задачи</a>
      <a class="crm-nav-i${active === 'contacts' ? ' on' : ''}" href="#/crm/contacts"><span class="crm-nav-ic">${CRM_ICO.user}</span>Контакты</a>
      <a class="crm-nav-i${active === 'companies' ? ' on' : ''}" href="#/crm/companies"><span class="crm-nav-ic">${CRM_ICO.building}</span>Компании</a>
    </div>
    <div class="crm-main${narrow ? ' narrow' : ''}">${inner}</div>
  </div>`;
  const add = $('#crmfnadd');
  if (add) add.onclick = crmNewFunnel;
}

/* ---------- воронка ---------- */
const crmWho = d => [d.contacts.map(c => c.name).join(', '), d.companies.map(c => c.name).join(', ')];

function crmDealCard(d) {
  const [who, comp] = crmWho(d);
  return `<div class="crm-deal" data-deal="${d.id}" data-amount="${d.amount || 0}">
    <div class="crm-deal-top"><span class="crm-deal-who">${esc(who)}${comp ? `<span class="crm-deal-comp">${who ? ', ' : ''}${esc(comp)}</span>` : ''}</span><span class="crm-deal-date">${crmDate(d.created_at)}</span></div>
    <div class="crm-deal-title">${esc(d.title)}</div>
    ${d.amount || d.open_tasks ? `<div class="crm-deal-foot">${d.amount ? `<span class="kc-tag">${crmMoney(d.amount)}</span>` : ''}${d.open_tasks ? `<span class="crm-task-badge" title="Незакрытых задач: ${d.open_tasks}">${CRM_ICO.clock}${d.open_tasks}</span>` : ''}</div>` : ''}
  </div>`;
}

function crmStageCol(s, i) {
  const n = s.deals.length;
  return `<div class="crm-col" data-stage="${s.id}">
    <div class="crm-col-h" style="--sc:${crmColor(s, i)}">
      <div class="crm-col-t" contenteditable="true" spellcheck="false" data-sname="${s.id}" data-old="${esc(s.name)}" data-ph="Название этапа">${esc(s.name)}</div>
      <button class="crm-col-del" data-sdel="${s.id}" aria-label="Удалить этап">${XICON}</button>
      <div class="crm-col-s">${n} ${crmPlural(n, 'сделка', 'сделки', 'сделок')}: ${crmMoney(s.sum)}</div>
    </div>
    <div class="crm-col-b">
      ${i === 0 ? `<div class="crm-quick" data-quick="${s.id}"><button class="crm-quick-btn">Быстрое добавление</button></div>` : ''}
      ${s.deals.map(crmDealCard).join('')}
    </div>
  </div>`;
}

// редактируемое название: Enter или уход из поля сохраняет, Esc возвращает прежнее
function crmEditable(el, save) {
  el.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); el.blur(); }
    if (e.key === 'Escape') { el.dataset.cancel = '1'; el.blur(); }
  });
  el.addEventListener('paste', e => {
    e.preventDefault();
    document.execCommand('insertText', false, (e.clipboardData.getData('text/plain') || '').replace(/\s+/g, ' '));
  });
  el.addEventListener('blur', () => {
    const cancel = el.dataset.cancel;
    delete el.dataset.cancel;
    const v = el.textContent.replace(/\s+/g, ' ').trim();
    if (cancel || !v || v === el.dataset.old) { el.textContent = el.dataset.old; return; }
    el.dataset.old = v;
    el.textContent = v;
    save(v);
  });
}
function crmSelectAll(el) {
  const r = document.createRange();
  r.selectNodeContents(el);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(r);
}

// плавающее меню под кнопкой: повторный клик по той же кнопке закрывает его
let crmMenuEl = null, crmMenuFor = null;
function crmMenuClose() {
  if (crmMenuEl) crmMenuEl.remove();
  crmMenuEl = null; crmMenuFor = null;
  document.removeEventListener('pointerdown', crmMenuOut, true);
}
function crmMenuOut(e) {
  if (e.target.closest('.crm-fmenu') || (crmMenuFor && crmMenuFor.contains(e.target))) return;
  crmMenuClose();
}
// items: {label, act, on, danger, disabled} или {sep: true}; pick(act) — выбранный пункт
function crmMenu(anchor, items, pick) {
  if (crmMenuFor === anchor) return crmMenuClose();
  crmMenuClose();
  const menu = document.createElement('div');
  menu.className = 'crm-fmenu';
  menu.innerHTML = items.map((it, i) => it.sep ? '<div class="crm-fmenu-sep"></div>'
    : `<button class="crm-fmenu-i${it.danger ? ' danger' : ''}${it.on ? ' on' : ''}" data-i="${i}"${it.disabled ? ' disabled' : ''}><span>${esc(it.label)}</span>${it.on ? CRM_ICO.check : ''}</button>`).join('');
  document.body.appendChild(menu);
  const r = anchor.getBoundingClientRect();
  const w = menu.offsetWidth;
  menu.style.top = (r.bottom + 6) + 'px';
  menu.style.left = Math.max(8, Math.min(r.right - w, window.innerWidth - w - 8)) + 'px';
  menu.onclick = e => {
    const b = e.target.closest('[data-i]');
    if (!b || b.disabled) return;
    const act = items[+b.dataset.i].act;
    crmMenuClose();
    pick(act);
  };
  crmMenuEl = menu;
  crmMenuFor = anchor;
  setTimeout(() => document.addEventListener('pointerdown', crmMenuOut, true), 0);
}

async function crmNewFunnel() {
  try {
    const f = await api('/crm/funnels', {method: 'POST', body: {title: 'Новая воронка'}});
    crmFocusNext = {kind: 'title'};
    location.hash = '#/crm/funnel/' + f.id;
  } catch (e) { alert(e.message); }
}

function crmNoFunnels() {
  crmCurFunnel = null;
  crmShell('pipe', `<div class="crm-empty"><div class="crm-empty-t">Воронок пока нет</div>
    <button class="crm-newbtn" id="crmfirst">${PLUS_ICON}<span>Создать воронку</span></button></div>`);
  $('#crmfirst').onclick = crmNewFunnel;
}

// удаление этапа: его сделки уходят в соседний этап слева (а у первого — справа)
async function crmStageDelete(fid, b, s) {
  const idx = b.stages.findIndex(x => x.id === s.id);
  if (b.stages.length === 1) return alert('В воронке должен остаться хотя бы один этап');
  const next = b.stages[idx - 1] || b.stages[idx + 1];
  const q = s.deals.length
    ? `Сделки этапа «${s.name}» (${s.deals.length}) перейдут в «${next.name}». Удалить этап?`
    : `Удалить этап «${s.name}»?`;
  if (!confirm(q)) return;
  try { await api(`/crm/stages/${s.id}`, {method: 'DELETE'}); }
  catch (err) { alert(err.message); }
  crmPipeline(fid);
}

// перестановка этапов: тянем заголовок колонки, соседи сдвигаются с анимацией, как хайлайты
function crmStageDrag(e, col) {
  if (e.button !== 0 && e.pointerType === 'mouse') return;
  if (e.target.closest('.crm-col-del')) return;
  const row = col.parentElement;
  const cols = () => [...row.querySelectorAll(':scope > .crm-col[data-stage]')];
  const order = () => cols().map(c => c.dataset.stage).join(',');
  const start = order();
  const x0 = e.clientX;
  let moved = false, base = 0;
  const onMove = ev => {
    const dx = ev.clientX - x0;
    if (!moved) {
      if (Math.abs(dx) < 6) return;
      moved = true;
      col.classList.add('crm-col-drag');
      document.body.classList.add('kdragging');
    }
    const r = col.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const others = cols().filter(c => c !== col);
    // сколько соседей осталось левее центра колонки — её новое место
    const idx = others.filter(c => { const q = c.getBoundingClientRect(); return q.left + q.width / 2 < cx; }).length;
    if (idx !== cols().indexOf(col)) {
      const before = new Map(cols().map(c => [c, c.getBoundingClientRect().left]));
      const oldL = r.left;
      if (others[idx]) row.insertBefore(col, others[idx]);
      else others[others.length - 1].after(col);
      base += oldL - col.getBoundingClientRect().left;
      cols().forEach(c => {
        if (c === col) return;
        const shift = before.get(c) - c.getBoundingClientRect().left;
        if (shift && c.animate) c.animate([{transform: `translateX(${shift}px)`}, {transform: 'translateX(0)'}],
          {duration: 180, easing: 'cubic-bezier(.2,.7,.2,1)'});
      });
    }
    col.style.transform = `translateX(${dx + base}px)`;
  };
  const onUp = () => {
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    window.removeEventListener('pointercancel', onUp);
    if (!moved) return;
    const t = col.style.transform;
    col.classList.remove('crm-col-drag');
    document.body.classList.remove('kdragging');
    col.style.transform = '';
    col.animate([{transform: t}, {transform: 'translateX(0)'}], {duration: 180, easing: 'cubic-bezier(.2,.7,.2,1)'});
    crmSuppress = true;
    setTimeout(() => { crmSuppress = false; }, 300);
    if (order() !== start) {
      api(`/crm/funnels/${crmCurFunnel}/stage-order`, {method: 'POST', body: {ids: cols().map(c => +c.dataset.stage)}})
        .catch(err => { alert(err.message); crmPipeline(crmCurFunnel); });
    }
  };
  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', onUp);
  window.addEventListener('pointercancel', onUp);
}

async function crmPipeline(fid) {
  let b;
  try { b = await api(`/crm/funnels/${fid}/board`); }
  catch (e) { alert(e.message); location.hash = '#/crm'; return; }
  crmCurFunnel = fid;
  tabTitle(b.title);
  const all = b.stages.reduce((a, s) => a + s.deals.length, 0);
  const total = b.stages.reduce((a, s) => a + s.sum, 0);
  crmShell('pipe', `<div class="crm-fhead">
      <div class="crm-ftitle" id="crmftitle" contenteditable="true" spellcheck="false" data-old="${esc(b.title)}" data-ph="Название воронки">${esc(b.title)}</div>
      <button class="crm-col-more crm-fmore" id="crmfmore" aria-label="Действия с воронкой">${CRM_ICO.dots}</button>
    </div>
    <div class="crm-head">
      <div class="crm-sum">${all} ${crmPlural(all, 'сделка', 'сделки', 'сделок')}: <b>${crmMoney(total)}</b></div>
    </div>
    <div class="crm-cols">${b.stages.map(crmStageCol).join('')}<button class="crm-addstage" id="crmaddstage">${PLUS_ICON}<span>Новый этап</span></button></div>`, false, fid);

  crmEditable($('#crmftitle'), async v => {
    try { await api(`/crm/funnels/${fid}`, {method: 'PATCH', body: {title: v}}); }
    catch (e) { alert(e.message); }
    const f = crmFunnels.find(x => x.id === fid);
    if (f) f.title = v;
    tabTitle(v);
    const nav = document.querySelector(`.crm-fnav-i[data-fid="${fid}"] span`);
    if (nav) nav.textContent = v;
  });
  $('#crmfmore').onclick = e => crmMenu(e.currentTarget, [{label: 'Удалить воронку', act: 'del', danger: true}], async act => {
    if (act !== 'del') return;
    if (!confirm(`Удалить воронку «${b.title}»?`)) return;
    try { await api(`/crm/funnels/${fid}`, {method: 'DELETE'}); }
    catch (err) { alert(err.message); return; }
    await crmLoadFunnels();
    location.hash = crmFunnels.length ? '#/crm/funnel/' + crmFunnels[0].id : '#/crm';
  });

  document.querySelectorAll('[data-deal]').forEach(el => el.onclick = () => {
    if (crmSuppress) return;
    crmReturn = location.hash; // из окна сделки вернёмся в эту же воронку
    location.hash = '#/crm/deal/' + el.dataset.deal;
  });
  crmBindDrag();
  document.querySelectorAll('[data-sname]').forEach(el => crmEditable(el, async v => {
    try { await api(`/crm/stages/${el.dataset.sname}`, {method: 'PATCH', body: {name: v}}); }
    catch (e) { alert(e.message); }
  }));
  document.querySelectorAll('[data-sdel]').forEach(btn => btn.onclick = () => {
    crmStageDelete(fid, b, b.stages.find(x => x.id === +btn.dataset.sdel));
  });
  document.querySelectorAll('.crm-col-h').forEach(h => h.onpointerdown = e => crmStageDrag(e, h.closest('.crm-col')));
  $('#crmaddstage').onclick = async () => {
    try {
      const st = await api(`/crm/funnels/${fid}/stages`, {method: 'POST', body: {name: 'Новый этап', kind: 'work'}});
      crmFocusNext = {kind: 'stage', id: st.id};
      crmPipeline(fid);
    } catch (e) { alert(e.message); }
  };
  document.querySelectorAll('[data-quick]').forEach(box => {
    box.querySelector('.crm-quick-btn').onclick = () => {
      box.innerHTML = '<input class="crm-quick-in" placeholder="Название сделки" maxlength="200">';
      const inp = box.querySelector('input');
      inp.focus();
      let done = false;
      const finish = async save => {
        if (done) return;
        done = true;
        const title = inp.value.trim();
        if (!save || !title) return crmPipeline(fid);
        try { await api('/crm/deals', {method: 'POST', body: {title, stage_id: +box.dataset.quick}}); }
        catch (e) { alert(e.message); }
        crmPipeline(fid);
      };
      inp.onkeydown = e => { if (e.key === 'Enter') finish(true); if (e.key === 'Escape') finish(false); };
      inp.onblur = () => finish(true);
    };
  });

  // выделяем то, что только что создали
  if (crmFocusNext) {
    const f = crmFocusNext;
    crmFocusNext = null;
    const el = f.kind === 'title' ? $('#crmftitle') : document.querySelector(`[data-sname="${f.id}"]`);
    if (el) { el.focus(); crmSelectAll(el); }
  }
}

/* ---------- окно: слева содержимое, справа сообщения и задачи (одинаково у сделки, контакта, компании) ---------- */
function crmWin(left, mode, tools = '') {
  return `<div class="crm-win${mode === 'page' ? ' page' : ''}">
    <div class="crm-left">${mode === 'sheet' ? crmSheetTop(tools) : ''}${left}</div>
    <div class="crm-right">
      <div class="crm-feedwrap"><div class="crm-msgs" id="crmmsgs"></div></div>
      <div class="crm-compose" id="crmcompose">
        <div class="crm-ta-wrap">
          <textarea id="crmmsg" rows="1" placeholder="Напишите сообщение…"></textarea>
          <span class="crm-ph" id="crmph" hidden>Что нужно сделать</span>
        </div>
        <div class="crm-tf-row" id="crmtfrow" hidden>
          <input type="date" class="crm-tf-date" id="crmtfdate" value="${crmToday()}">
          <input type="time" class="crm-tf-time" id="crmtftime" aria-label="Время">
        </div>
        <div class="crm-compose-bar">
          <button class="crm-addtask" id="crmaddtask">+ задача</button>
          <button class="crm-send" id="crmsend" aria-label="Отправить сообщение">${CRM_ICO.send}<span>Отправить</span></button>
        </div>
      </div>
    </div>
  </div>`;
}

const crmSheetTop = (tools = '') => `<div class="crm-dtop"><span class="kb-saved" id="crmsaved">Сохранено</span>
  <div class="kb-tools">${crmBackBtn()}${tools}<button class="kb-ib" id="sx" aria-label="Закрыть">${XICON}</button></div></div>`;

// подсказка «сохранено» в окне
function crmSaved() {
  const s = $('#crmsaved');
  if (s) s.textContent = 'Сохранено';
}

/* ---------- лента: сообщения и задачи ---------- */
function crmTaskHtml(t) {
  const when = [crmDate(t.due_date), t.due_time].filter(Boolean).join(' · ');
  const done = t.status === 'done';
  const overdue = !done && t.due_date < crmToday();
  const ext = t.owner && t.owner !== 'deal';
  return `<div class="crm-task${done ? ' done' : ' open'}${overdue ? ' overdue' : ''}${ext ? ' ext' : ''}" data-task="${t.id}">
    <span class="crm-msg-acts crm-task-acts"><button class="crm-msg-more" data-task-more="${t.id}" aria-label="Действия">${CRM_ICO.dots}</button><span class="crm-msg-menu" data-task-menu="${t.id}" hidden><button data-task-edit="${t.id}">Изменить</button><button class="danger" data-task-del="${t.id}">Удалить</button></span></span>
    <div class="crm-task-top"><span class="crm-task-chk">${done ? CRM_ICO.check : ''}</span>
      <div class="crm-task-main"><div class="crm-task-t">${esc(t.title)}</div></div></div>
    ${done ? `<div class="crm-task-res"><span class="crm-task-resl">Итог</span>${esc(t.result).replace(/\n/g, '<br>')}</div>
      <div class="crm-task-m crm-task-stamp">Выполнено ${t.done_at ? crmStamp(t.done_at) : ''}</div>` : ''}
    <div class="crm-task-act">
      ${done ? '' : `<button class="crm-task-done" data-task-done="${t.id}">Выполнено</button>`}
      <span class="crm-task-meta${overdue ? ' red' : ''}">${t.from ? `${esc(t.from)} · ` : ''}${when}</span>
    </div>
    <div class="crm-task-cf" data-task-cf="${t.id}" hidden>
      <textarea placeholder="Итог: что сделано" rows="2"></textarea>
      <div class="crm-task-cf-row"><button class="crm-task-save">Сохранить итог</button><button class="crm-task-cancel">Отмена</button></div>
    </div>
    <div class="crm-task-ed" data-task-ed="${t.id}" hidden>
      <textarea class="crm-tf-title" data-ed-title rows="1" placeholder="Что нужно сделать">${esc(t.title)}</textarea>
      <div class="crm-tf-row">
        <input type="date" class="crm-tf-date" data-ed-date value="${t.due_date}">
        <input type="time" class="crm-tf-time" data-ed-time value="${t.due_time || ''}" aria-label="Время">
      </div>
      ${done ? `<textarea data-ed-result rows="2" placeholder="Итог">${esc(t.result)}</textarea>` : ''}
      <div class="crm-task-cf-row"><button class="crm-task-save" data-ed-save="${t.id}">Сохранить</button><button class="crm-task-cancel" data-ed-cancel="${t.id}">Отмена</button></div>
    </div>
  </div>`;
}

function crmItemsHtml(items) {
  return items.map(i => i.kind === 'task'
    ? crmTaskHtml(i)
    : `<div class="crm-msg${i.owner && i.owner !== 'deal' ? ' ext' : ''}" data-msg="${i.id}">
        <div class="crm-bub"><span class="crm-msg-acts"><button class="crm-msg-more" data-msg-more="${i.id}" aria-label="Действия">${CRM_ICO.dots}</button><span class="crm-msg-menu" data-msg-menu="${i.id}" hidden><button data-msg-edit="${i.id}">Изменить</button><button class="danger" data-msg-del="${i.id}">Удалить</button></span></span>${esc(i.text).replace(/\n/g, '<br>')}<span class="crm-bub-t">${i.from ? `<span class="crm-msg-from">${esc(i.from)} · </span>` : ''}${crmStamp(i.created_at)}</span></div>
        <div class="crm-msg-ed" data-msg-ed="${i.id}" hidden><textarea rows="2">${esc(i.text)}</textarea>
          <div class="crm-task-cf-row"><button class="crm-task-save" data-msg-save="${i.id}">Сохранить</button><button class="crm-task-cancel" data-msg-cancel="${i.id}">Отмена</button></div></div>
      </div>`
  ).join('') || '<div class="crm-msgs-empty">Пока нет сообщений и задач</div>';
}

// kind: deals | contacts | companies — кому принадлежит лента
// поля ввода в окнах CRM растут по содержимому: лента над ними уменьшается
const crmGrowField = el => { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; };
document.addEventListener('input', e => { if (e.target.tagName === 'TEXTAREA' && e.target.closest('.crm-win')) crmGrowField(e.target); });
document.addEventListener('focusin', e => { if (e.target.tagName === 'TEXTAREA' && e.target.closest('.crm-win')) crmGrowField(e.target); });

function crmBindFeed(kind, oid, items) {
  let list = items;
  const box = $('#crmmsgs');
  // размытие верха ленты — только когда лента прокручена: первое сообщение при открытии читается полностью
  box.addEventListener('scroll', () => box.parentElement.classList.toggle('scrolled', box.scrollTop > 4));
  const render = () => {
    box.innerHTML = crmItemsHtml(list);
    stickTasks();
    bindTasks();
    box.scrollTop = box.scrollHeight;
    const pb = box.closest('.crm-pop-body');
    if (pb) pb.scrollTop = pb.scrollHeight;
  };
  // невыполненные задачи стоят на своём месте в ленте; когда их проскроллили вверх, они прилипают к верху,
  // пока лента не вернётся к их месту. Несколько прилипших встают одна под другой
  const stickTasks = () => {
    let off = 0;
    box.querySelectorAll('.crm-task.open').forEach(el => { el.style.top = off + 'px'; off += el.offsetHeight + 8; });
  };
  const closeMenus = () => document.querySelectorAll('[data-msg-menu],[data-task-menu]').forEach(m => { m.hidden = true; });
  const bindTasks = () => {
    const card = id => document.querySelector(`[data-task="${id}"]`);
    document.querySelectorAll('[data-task-more]').forEach(b => b.onclick = e => {
      e.stopPropagation();
      const menu = document.querySelector(`[data-task-menu="${b.dataset.taskMore}"]`);
      const open = menu.hidden;
      closeMenus();
      menu.hidden = !open;
    });
    const showOnly = (id, panel) => {
      const c = card(id);
      setTimeout(stickTasks, 0);
      c.querySelector('.crm-task-act').hidden = panel !== 'act';
      c.querySelector(`[data-task-cf="${id}"]`).hidden = panel !== 'cf';
      c.querySelector(`[data-task-ed="${id}"]`).hidden = panel !== 'ed';
    };
    document.querySelectorAll('[data-task-done]').forEach(b => b.onclick = () => {
      const id = +b.dataset.taskDone;
      showOnly(id, 'cf');
      card(id).querySelector('[data-task-cf] textarea').focus();
    });
    document.querySelectorAll('[data-task-cf]').forEach(cf => {
      const id = +cf.dataset.taskCf;
      cf.querySelector('.crm-task-cancel').onclick = () => showOnly(id, 'act');
      cf.querySelector('.crm-task-save').onclick = async () => {
        const result = cf.querySelector('textarea').value.trim();
        if (!result) { cf.querySelector('textarea').focus(); return; }
        try {
          const upd = await api(`/crm/tasks/${id}/complete`, {method: 'POST', body: {result}});
          list = list.map(i => i.kind === 'task' && i.id === id ? {...i, ...upd} : i);
          render();
        } catch (e) { alert(e.message); }
      };
    });
    document.querySelectorAll('[data-task-edit]').forEach(b => b.onclick = () => { closeMenus(); showOnly(+b.dataset.taskEdit, 'ed'); });
    document.querySelectorAll('[data-ed-cancel]').forEach(b => b.onclick = () => showOnly(+b.dataset.edCancel, 'act'));
    const msgEl = id => document.querySelector(`[data-msg="${id}"]`);
    const msgView = (id, editing) => {
      const el = msgEl(id);
      el.querySelector('.crm-bub').hidden = editing;
      el.querySelector(`[data-msg-ed="${id}"]`).hidden = !editing;
      if (editing) el.querySelector('[data-msg-ed] textarea').focus();
    };
    document.querySelectorAll('[data-msg-more]').forEach(b => b.onclick = e => {
      e.stopPropagation();
      const menu = document.querySelector(`[data-msg-menu="${b.dataset.msgMore}"]`);
      const open = menu.hidden;
      closeMenus();
      menu.hidden = !open;
    });
    document.querySelectorAll('[data-msg-edit]').forEach(b => b.onclick = () => {
      closeMenus();
      msgView(+b.dataset.msgEdit, true);
    });
    document.querySelectorAll('[data-msg-cancel]').forEach(b => b.onclick = () => msgView(+b.dataset.msgCancel, false));
    document.querySelectorAll('[data-msg-save]').forEach(b => b.onclick = async () => {
      const id = +b.dataset.msgSave;
      const text = msgEl(id).querySelector('[data-msg-ed] textarea').value.trim();
      if (!text) { msgEl(id).querySelector('[data-msg-ed] textarea').focus(); return; }
      try {
        const upd = await api(`/crm/messages/${id}`, {method: 'PATCH', body: {text}});
        list = list.map(i => i.kind === 'message' && i.id === id ? {...i, ...upd} : i);
        render();
      } catch (e) { alert(e.message); }
    });
    document.querySelectorAll('[data-msg-del]').forEach(b => b.onclick = async () => {
      const id = +b.dataset.msgDel;
      if (!confirm('Удалить сообщение?')) return;
      try {
        await api(`/crm/messages/${id}`, {method: 'DELETE'});
        list = list.filter(i => !(i.kind === 'message' && i.id === id));
        render();
      } catch (e) { alert(e.message); }
    });
    document.querySelectorAll('[data-ed-save]').forEach(b => b.onclick = async () => {
      const id = +b.dataset.edSave;
      const c = card(id);
      const body = {
        title: c.querySelector('[data-ed-title]').value.trim(),
        due_date: c.querySelector('[data-ed-date]').value,
        due_time: c.querySelector('[data-ed-time]').value || '',
      };
      const res = c.querySelector('[data-ed-result]');
      if (res) body.result = res.value.trim();
      if (!body.title) { c.querySelector('[data-ed-title]').focus(); return; }
      if (!body.due_date) { c.querySelector('[data-ed-date]').focus(); return; }
      try {
        const upd = await api(`/crm/tasks/${id}`, {method: 'PATCH', body});
        list = list.map(i => i.kind === 'task' && i.id === id ? {...i, ...upd} : i);
        render();
      } catch (e) { alert(e.message); }
    });
    document.querySelectorAll('[data-task-del]').forEach(b => b.onclick = async () => {
      const id = +b.dataset.taskDel;
      if (!confirm('Удалить задачу?')) return;
      try {
        await api(`/crm/tasks/${id}`, {method: 'DELETE'});
        list = list.filter(i => !(i.kind === 'task' && i.id === id));
        render();
      } catch (e) { alert(e.message); }
    });
  };
  render();

  // одно поле ввода: обычное сообщение или, после «+ задача», название задачи с датой и временем под ним
  const compose = $('#crmcompose'), ta = $('#crmmsg'), tfrow = $('#crmtfrow'), addBtn = $('#crmaddtask'), sendBtn = $('#crmsend');
  const ph = $('#crmph');
  const crmGrow = el => { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; };
  let taskMode = false;
  const setTaskMode = on => {
    taskMode = on;
    compose.classList.toggle('task-mode', on);
    tfrow.hidden = !on;
    addBtn.classList.toggle('on', on);
    addBtn.textContent = on ? 'Отмена' : '+ задача';
    ta.placeholder = on ? '' : 'Напишите сообщение…';
    // подсказка задачи: синяя полоса пробегает слева направо по самому тексту
    ph.hidden = !on || !!ta.value;
    if (on) { ph.style.animation = 'none'; void ph.offsetWidth; ph.style.animation = ''; }
    sendBtn.querySelector('span').textContent = on ? 'Добавить' : 'Отправить';
    if (on) ta.focus();
    crmGrow(ta);
  };
  addBtn.onclick = () => setTaskMode(!taskMode);
  const addTask = async () => {
    const title = ta.value.trim();
    const due = $('#crmtfdate').value;
    const time = $('#crmtftime').value;
    if (!title) { ta.focus(); return; }
    if (!due) { $('#crmtfdate').focus(); return; }
    try {
      const task = await api(`/crm/${kind}/${oid}/tasks`, {method: 'POST', body: {title, due_date: due, due_time: time || null}});
      list = [...list, task];
      ta.value = '';
      $('#crmtftime').value = '';
      setTaskMode(false);
      render();
    } catch (e) { alert(e.message); }
  };
  ta.oninput = () => { crmGrow(ta); ph.hidden = !taskMode || !!ta.value; };
  const send = async () => {
    if (taskMode) return addTask();
    const text = ta.value.trim();
    if (!text) return;
    ta.value = '';
    crmGrow(ta);
    ph.hidden = true;
    try {
      const m = await api(`/crm/${kind}/${oid}/messages`, {method: 'POST', body: {text}});
      list = [...list, m];
      render();
    } catch (e) { alert(e.message); }
    ta.focus();
  };
  sendBtn.onclick = send;
  ta.onkeydown = e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); return; }
    if (e.key === 'Escape' && taskMode) setTaskMode(false);
  };
  document.querySelectorAll('[data-ed-title]').forEach(el => { el.oninput = () => crmGrow(el); });
}

/* ---------- ссылки: контакты и компании, выбор из базы с поиском ---------- */
const crmCapKind = kind => crmCap(kind);
// длинное название — в одну строку: лишние имя и отчество сводятся к инициалам («ИП Мурадян М. А.»); полное — в подсказке
function crmShortName(name) {
  const w = String(name || '').trim().split(/\s+/);
  if (w.length <= 3) return name;
  return [...w.slice(0, 2), ...w.slice(2).map(x => x.charAt(0) + '.')].join(' ');
}
function crmEntChips(kind, items) {
  return items.map(x => `<span class="crm-ent"><button class="crm-ent-n" data-open-${kind}="${x.id}" title="${esc(x.name)}">${esc(x.name)}</button><button class="crm-ent-x" data-unlink-${kind}="${x.id}" aria-label="Убрать">${XICON}</button></span>`).join('');
}

function crmBindPicker(box, kind, onLink, onUnlink, onOpen, repaint) {
  const K = crmCapKind(kind);
  box.querySelectorAll(`[data-open-${kind}]`).forEach(b => b.onclick = () => onOpen(+b.dataset[`open${K}`]));
  box.querySelectorAll(`[data-unlink-${kind}]`).forEach(b => b.onclick = () => onUnlink(+b.dataset[`unlink${K}`]));
  const add = box.querySelector(`[data-add-${kind}]`);
  if (!add) return;
  add.onclick = () => {
    add.outerHTML = `<span class="crm-picker"><input class="crm-picker-in" placeholder="${kind === 'contacts' ? 'Имя или телефон' : 'Название компании'}"><div class="crm-drop"></div></span>`;
    const inp = box.querySelector('.crm-picker-in');
    const drop = box.querySelector('.crm-drop');
    inp.focus();
    const search = crmDebounce(async () => {
      const q = inp.value.trim();
      const rows = await api(`/crm/${kind}?q=${encodeURIComponent(q)}`);
      const linked = new Set([...box.querySelectorAll(`[data-unlink-${kind}]`)].map(b => +b.dataset[`unlink${K}`]));
      const free = rows.filter(r => !linked.has(r.id)).slice(0, 8);
      const create = q ? `<button class="crm-drop-i crm-drop-new" data-create="1">+ Создать «${esc(q)}»</button>` : '';
      drop.innerHTML = free.map(r => `<button class="crm-drop-i" data-pick="${r.id}">${esc(r.name)}${r.companies && r.companies.length ? `<span class="crm-drop-sub">${esc(r.companies.map(c => c.name).join(', '))}</span>` : ''}</button>`).join('') + create;
      drop.querySelectorAll('[data-pick]').forEach(b => b.onmousedown = e => { e.preventDefault(); onLink(+b.dataset.pick); });
      const c = drop.querySelector('[data-create]');
      if (c) c.onmousedown = e => { e.preventDefault(); onLink(null, q); };
    }, 180);
    inp.oninput = search;
    search();
    inp.onblur = () => setTimeout(() => { if (box.contains(inp)) repaint(); }, 150);
    inp.onkeydown = e => { if (e.key === 'Escape') repaint(); };
  };
}

/* ---------- перенос сделок между этапами: как карточки на досках ---------- */
let crmDrag = null, crmSuppress = false;

function crmBindDrag() {
  document.querySelectorAll('.crm-deal').forEach(el => el.onpointerdown = e => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    crmDrag = {el, x0: e.clientX, y0: e.clientY, started: false, ph: null, ghost: null, sx: 0, sy: 0, cx: 0, cy: 0, tx: 0, ty: 0, raf: 0};
    window.addEventListener('pointermove', crmDragMove);
    window.addEventListener('pointerup', crmDragUp);
    window.addEventListener('pointercancel', crmDragUp);
  });
}

function crmDragMove(e) {
  if (!crmDrag) return;
  if (!crmDrag.started) {
    if (Math.hypot(e.clientX - crmDrag.x0, e.clientY - crmDrag.y0) < 6) return;
    crmDragStart(e);
  }
  e.preventDefault();
  crmDrag.tx = e.clientX - crmDrag.sx;
  crmDrag.ty = e.clientY - crmDrag.sy;
  // край экрана — прокрутка колонок и страницы
  const cols = document.querySelector('.crm-cols');
  if (cols) {
    const r = cols.getBoundingClientRect();
    if (e.clientX > r.right - 70) cols.scrollLeft += 14;
    if (e.clientX < r.left + 70) cols.scrollLeft -= 14;
  }
  if (e.clientY < 90) window.scrollBy(0, -12);
  if (e.clientY > window.innerHeight - 90) window.scrollBy(0, 12);
  const under = document.elementFromPoint(e.clientX, e.clientY);
  const col = under && under.closest('.crm-col[data-stage]');
  if (col) crmPlaceInCol(col, e.clientY);
}

function crmDragStart(e) {
  const r = crmDrag.el.getBoundingClientRect();
  crmDrag.started = true;
  crmDrag.sx = e.clientX - r.left;
  crmDrag.sy = e.clientY - r.top;
  crmDrag.cx = r.left; crmDrag.cy = r.top;
  const ph = document.createElement('div');
  ph.className = 'kph';
  ph.style.height = r.height + 'px';
  crmDrag.el.replaceWith(ph);
  crmDrag.ph = ph;
  const g = crmDrag.el.cloneNode(true);
  g.classList.add('kghost');
  g.style.width = r.width + 'px';
  document.body.appendChild(g);
  crmDrag.ghost = g;
  document.body.classList.add('kdragging');
  const follow = () => {
    if (!crmDrag || !crmDrag.ghost) return;
    crmDrag.cx += (crmDrag.tx - crmDrag.cx) * 0.35;   // мягкое следование за курсором
    crmDrag.cy += (crmDrag.ty - crmDrag.cy) * 0.35;
    crmDrag.ghost.style.transform = `translate(${crmDrag.cx}px, ${crmDrag.cy}px) rotate(2deg)`;
    crmDrag.raf = requestAnimationFrame(follow);
  };
  crmDrag.tx = crmDrag.cx; crmDrag.ty = crmDrag.cy;
  follow();
}

// место карточки: между карточками колонки, по их середине
function crmPlaceInCol(col, y) {
  const box = col.querySelector('.crm-col-b');
  if (!box) return;
  const cards = [...box.querySelectorAll('.crm-deal')];
  let before = null;
  for (const c of cards) {
    const r = c.getBoundingClientRect();
    if (y < r.top + r.height / 2) { before = c; break; }
  }
  if (before) {
    if (crmDrag.ph.nextElementSibling !== before) box.insertBefore(crmDrag.ph, before);
  } else if (box.lastElementChild !== crmDrag.ph) {
    box.appendChild(crmDrag.ph);
  }
}

// счётчики и суммы колонок и всей воронки — по карточкам на экране
function crmRefreshCounts() {
  let all = 0, total = 0;
  document.querySelectorAll('.crm-col[data-stage]').forEach(c => {
    const cards = [...c.querySelectorAll('.crm-deal')];
    const sum = cards.reduce((a, x) => a + (+x.dataset.amount || 0), 0);
    all += cards.length; total += sum;
    const sEl = c.querySelector('.crm-col-s');
    if (sEl) sEl.textContent = `${cards.length} ${crmPlural(cards.length, 'сделка', 'сделки', 'сделок')}: ${crmMoney(sum)}`;
  });
  const head = document.querySelector('.crm-sum');
  if (head) head.innerHTML = `${all} ${crmPlural(all, 'сделка', 'сделки', 'сделок')}: <b>${crmMoney(total)}</b>`;
}

async function crmDragUp() {
  window.removeEventListener('pointermove', crmDragMove);
  window.removeEventListener('pointerup', crmDragUp);
  window.removeEventListener('pointercancel', crmDragUp);
  const d = crmDrag;
  crmDrag = null;
  if (!d || !d.started) return;
  cancelAnimationFrame(d.raf);
  crmSuppress = true;
  setTimeout(() => { crmSuppress = false; }, 300);
  d.ghost.remove();
  document.body.classList.remove('kdragging');
  d.ph.replaceWith(d.el);
  crmRefreshCounts();
  const columns = [...document.querySelectorAll('.crm-col[data-stage]')].map(c => ({
    stage_id: +c.dataset.stage,
    ids: [...c.querySelectorAll('.crm-deal')].map(x => +x.dataset.deal),
  }));
  try { await api('/crm/pipeline/order', {method: 'POST', body: {columns}}); }
  catch (err) { alert(err.message); crmPipeline(crmCurFunnel); }
}

/* ---------- окно сделки ---------- */
async function crmOpenDeal(id) {
  let d;
  try { d = await api(`/crm/deals/${id}`); }
  catch (e) { alert(e.message); location.hash = '#/crm'; return; }
  const back = crmReturn || (location.hash.startsWith('#/crm/deal/') ? '#/crm' : location.hash);
  crmReturn = null;

  const saveDeal = async body => {
    try { await api(`/crm/deals/${d.id}`, {method: 'PATCH', body}); crmSaved(); }
    catch (e) { alert(e.message); }
  };
  const refreshLinks = async () => { d = await api(`/crm/deals/${d.id}`); paint(); };
  const linkContact = async (cid, newName) => {
    try {
      if (cid == null) cid = (await api('/crm/contacts', {method: 'POST', body: crmSplitName(newName)})).id;
      await api(`/crm/deals/${d.id}/contacts`, {method: 'POST', body: {id: cid}});
      await refreshLinks();
    } catch (e) { alert(e.message); }
  };
  const unlinkContact = async cid => { try { await api(`/crm/deals/${d.id}/contacts/${cid}`, {method: 'DELETE'}); await refreshLinks(); } catch (e) { alert(e.message); } };
  const linkCompany = async (kid, newName) => {
    try {
      if (kid == null) kid = (await api('/crm/companies', {method: 'POST', body: {name: newName}})).id;
      await api(`/crm/deals/${d.id}/companies`, {method: 'POST', body: {id: kid}});
      await refreshLinks();
    } catch (e) { alert(e.message); }
  };
  const unlinkCompany = async kid => { try { await api(`/crm/deals/${d.id}/companies/${kid}`, {method: 'DELETE'}); await refreshLinks(); } catch (e) { alert(e.message); } };

  const paint = () => {
    const stages = d.stages || [];
    const si = Math.max(stages.findIndex(s => s.id === d.stage), 0);
    const cur = stages[si] || {name: '—', kind: 'work'};
    $('#crmprops').innerHTML = `
      <div class="crm-prop"><div class="crm-pl">${CRM_ICO.funnel}<span>Этап</span></div>
        <div class="crm-pv"><div class="crm-dd" id="crmdd">
          <button class="crm-dd-b" id="crmddb"><span class="crm-dot" style="--sc:${crmColor(cur, si)}"></span><span>${esc(cur.name)}</span><span class="crm-caret">${CRM_ICO.chev}</span></button>
          <div class="crm-dd-m" id="crmddm" hidden>${stages.map((s, i) => `<button class="crm-dd-i${s.id === d.stage ? ' on' : ''}" data-stage="${s.id}"><span class="crm-dot" style="--sc:${crmColor(s, i)}"></span>${esc(s.name)}</button>`).join('')}</div>
        </div></div></div>
      <div class="crm-prop"><div class="crm-pl">${CRM_ICO.rub}<span>Бюджет</span></div>
        <div class="crm-pv"><input class="crm-in crm-amount" id="crmamt" inputmode="numeric" placeholder="Не указан" value="${d.amount ? d.amount.toLocaleString('ru-RU') : ''}"><span class="crm-unit">₽</span></div></div>
      <div class="crm-prop"><div class="crm-pl">${CRM_ICO.dot}<span>Формат</span></div>
        <div class="crm-pv">
          <button class="crm-chip crm-fmt-white${d.format === 'white' ? ' on' : ''}" data-fmt="white">Белый</button>
          <button class="crm-chip crm-fmt-black${d.format === 'black' ? ' on' : ''}" data-fmt="black">Чёрный</button>
        </div></div>
      <div class="crm-prop"><div class="crm-pl">${CRM_ICO.link}<span>Документы</span></div>
        <div class="crm-pv crm-docs">${crmLinkField('crmdocs', d.documents_url, 'Вставить ссылку')}</div></div>
      <div class="crm-prop"><div class="crm-pl">${CRM_ICO.user}<span>Контакты</span></div>
        <div class="crm-pv crm-links" id="crmlk-contacts">${crmEntChips('contacts', d.contacts)}<button class="crm-add-btn" data-add-contacts="1">+ контакт</button></div></div>
      <div class="crm-prop"><div class="crm-pl">${CRM_ICO.building}<span>Компании</span></div>
        <div class="crm-pv crm-links" id="crmlk-companies">${crmEntChips('companies', d.companies)}<button class="crm-add-btn" data-add-companies="1">+ компанию</button></div></div>`;

    // этап: выпадающий список
    $('#crmddb').onclick = e => { e.stopPropagation(); $('#crmddm').hidden = !$('#crmddm').hidden; };
    $('#crmdd').querySelectorAll('[data-stage]').forEach(b => b.onclick = async e => {
      e.stopPropagation();
      d.stage = +b.dataset.stage; paint();
      await saveDeal({stage_id: d.stage});
    });
    // формат: повторный клик снимает
    $('#crmprops').querySelectorAll('[data-fmt]').forEach(b => b.onclick = async () => {
      const f = b.dataset.fmt;
      d.format = d.format === f ? null : f; paint();
      await saveDeal({format: d.format});
    });
    // бюджет: сохраняем при уходе из поля
    const amt = $('#crmamt');
    // ширина поля — по длине суммы, знак рубля стоит сразу за ней
    // пустое поле — по длине подсказки «Не указан», чтобы она не обрезалась
    const fitAmt = () => { amt.style.width = Math.max(amt.placeholder.length, amt.value.length) + 2 + 'ch'; };
    fitAmt();
    amt.oninput = () => { const v = amt.value.replace(/\D/g, ''); amt.value = v ? (+v).toLocaleString('ru-RU') : ''; fitAmt(); };
    amt.onblur = async () => {
      const n = +(amt.value.replace(/\D/g, '')) || 0;
      if (n === (d.amount || 0)) return;
      d.amount = n;
      await saveDeal({amount: n});
    };
    // ссылка на документы
    const docs = $('#crmdocs');
    docs.onblur = async () => {
      const v = docs.value.trim();
      if (v === (d.documents_url || '')) return;
      d.documents_url = v || null;
      await saveDeal({documents_url: v});
      paint();
    };
    // связи: контакты и компании открываются окном поверх
    crmBindPicker($('#crmlk-contacts'), 'contacts', linkContact, unlinkContact,
      id => crmOpenWin('contact', () => crmContactView(id, 'sheet')), paint);
    crmBindPicker($('#crmlk-companies'), 'companies', linkCompany, unlinkCompany,
      id => crmOpenWin('company', () => crmCompanyView(id, 'sheet')), paint);
  };

  const left = `<div class="crm-body">
      <div class="crm-dtitle" id="crmtitle" contenteditable="true" spellcheck="false" data-ph="Название сделки">${esc(d.title && d.title !== 'Без названия' ? d.title : '')}</div>
      <div class="crm-props" id="crmprops"></div>
    </div>`;
  sheet(`<div class="crm-win-box">${crmWin(left, 'sheet', `<button class="kb-ib" id="crmdel" aria-label="Удалить сделку">${CRM_ICO.trash}</button>`)}</div>`,
    'crm-sheet crm-dwin');
  crmOverlay();

  $('#sx').onclick = crmCloseAll;
  if ($('#crmback')) $('#crmback').onclick = crmCloseWin;
  beforeClose = async () => { location.hash = back; };
  paint();

  // название: сохраняем при уходе из поля
  const t = $('#crmtitle');
  t.onblur = async () => {
    const v = t.textContent.replace(/\s+/g, ' ').trim();
    if (v === (d.title === 'Без названия' ? '' : d.title)) return;
    d.title = v || 'Без названия';
    await saveDeal({title: v});
  };
  t.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); t.blur(); } };

  $('#crmdel').onclick = async () => {
    if (!confirm('Удалить сделку?')) return;
    try { await api(`/crm/deals/${d.id}`, {method: 'DELETE'}); } catch (e) { alert(e.message); }
    crmStack = []; crmCurrent = null;
    beforeClose = null;
    location.hash = back;
    closeSheet();
  };

  crmBindFeed('deals', d.id, d.items);
}

// «Имя Фамилия» → поля контакта
function crmSplitName(text) {
  const parts = String(text || '').trim().split(/\s+/);
  return {first_name: parts[0] || '', last_name: parts.slice(1).join(' ')};
}

/* ---------- списки: контакты и компании — карточки в стиле сейва ---------- */
async function crmContactsList() {
  crmShell('contacts', `<div class="titlerow crm-titlerow"><div class="brand">Контакты</div>
      <div class="tr-actions"><input class="crm-search" id="crmq" placeholder="Поиск контакта"><button class="iconbtn" id="crmnewc" aria-label="Добавить контакт" title="Добавить контакт">${PLUS_ICON}</button></div></div>
    <div class="crm-list" id="crmtable"></div>`, true);
  const paint = async () => {
    const q = $('#crmq').value.trim();
    const rows = await api('/crm/contacts?q=' + encodeURIComponent(q));
    $('#crmtable').innerHTML = rows.map(r => `<div class="crm-li" data-go="#/crm/contact/${r.id}">
        ${crmAvatar(r.name)}
        <div class="crm-li-main"><div class="crm-li-t">${esc(r.name)}</div>
          <div class="crm-li-s">${esc([r.companies.map(c => c.name).join(', '), r.position].filter(Boolean).join(' · '))}</div></div>
        <div class="crm-li-r">${esc(r.phone || r.email || '')}</div>
      </div>`).join('') || '<div class="empty">Контактов пока нет</div>';
    document.querySelectorAll('#crmtable [data-go]').forEach(el => el.onclick = () => crmOpenHref(el.dataset.go));
  };
  $('#crmq').oninput = crmDebounce(paint, 200);
  $('#crmnewc').onclick = async () => {
    try { const c = await api('/crm/contacts', {method: 'POST', body: {}}); location.hash = '#/crm/contact/' + c.id; }
    catch (e) { alert(e.message); }
  };
  paint();
}

async function crmCompaniesList() {
  crmShell('companies', `<div class="titlerow crm-titlerow"><div class="brand">Компании</div>
      <div class="tr-actions"><input class="crm-search" id="crmq" placeholder="Поиск компании"><button class="iconbtn" id="crmnewk" aria-label="Добавить компанию" title="Добавить компанию">${PLUS_ICON}</button></div></div>
    <div class="crm-list" id="crmtable"></div>`, true);
  const paint = async () => {
    const q = $('#crmq').value.trim();
    const rows = await api('/crm/companies?q=' + encodeURIComponent(q));
    $('#crmtable').innerHTML = rows.map(r => `<div class="crm-li" data-go="#/crm/company/${r.id}">
        <span class="crm-av crm-av-ic">${CRM_ICO.building}</span>
        <div class="crm-li-main"><div class="crm-li-t">${esc(r.name)}</div>
          <div class="crm-li-s">${r.card_url ? esc(r.card_url.replace(/^https?:\/\//, '')) : 'Нет карточки'}</div></div>
      </div>`).join('') || '<div class="empty">Компаний пока нет</div>';
    document.querySelectorAll('#crmtable [data-go]').forEach(el => el.onclick = () => crmOpenHref(el.dataset.go));
  };
  $('#crmq').oninput = crmDebounce(paint, 200);
  $('#crmnewk').onclick = async () => {
    try { const k = await api('/crm/companies', {method: 'POST', body: {name: ''}}); location.hash = '#/crm/company/' + k.id; }
    catch (e) { alert(e.message); }
  };
  paint();
}

/* ---------- блоки сделок: успешные, потерянные, в работе — с суммами ---------- */
function crmDealGroups(g) {
  const block = (title, cls, list, sum) => `<div class="crm-grp">
      <div class="crm-grp-h ${cls}"><span>${title}</span><span>${crmMoney(sum)}</span></div>
      ${list.length ? list.map(d => `<div class="crm-drow" data-deal-go="${d.id}"><span class="crm-drow-t">${esc(d.title)}</span><span class="crm-drow-s">${crmMoney(d.amount)}</span></div>`).join('') : '<div class="crm-drow-empty">Нет сделок</div>'}
    </div>`;
  return block('В работе', 'act', g.active, g.sums.active)
    + block('Успешные', 'ok', g.won, g.sums.won)
    + block('Потерянные', 'lost', g.lost, g.sums.lost);
}

function crmBindDealGroups(mode) {
  document.querySelectorAll('[data-deal-go]').forEach(el => el.onclick = () => {
    const id = +el.dataset.dealGo;
    if (mode === 'sheet') return crmOpenWin('deal', () => crmOpenDeal(id));
    crmReturn = location.hash;
    location.hash = '#/crm/deal/' + id;
  });
}

// формы под лентой: задача и сообщение (одинаково во всех окнах)
function crmFormsHtml() {
  return `<div class="crm-tf" id="crmtf" hidden>
        <textarea class="crm-tf-title" id="crmtftitle" rows="1" placeholder="Что нужно сделать"></textarea>
        <div class="crm-tf-row">
          <input type="date" class="crm-tf-date" id="crmtfdate" value="${crmToday()}">
          <input type="time" class="crm-tf-time" id="crmtftime" aria-label="Время">
          <button class="crm-tf-ok" id="crmtfok">Добавить</button>
          <button class="crm-tf-x" id="crmtfx" aria-label="Отмена">${XICON}</button>
        </div>
      </div>
      <div class="crm-compose">
        <textarea id="crmmsg" rows="1" placeholder="Напишите сообщение…"></textarea>
        <div class="crm-compose-bar">
          <button class="crm-addtask" id="crmaddtask">+ задача</button>
          <button class="crm-send" id="crmsend" aria-label="Отправить сообщение">${CRM_ICO.send}<span>Отправить</span></button>
        </div>
      </div>`;
}

// контакт и компания: то же окно, что у сделки — слева сведения, справа сообщения и задачи
function crmShowPerson(kind, mode, title, back, left, tools = '') {
  sheet(`<div class="crm-win-box">${crmWin(left, 'sheet', tools)}</div>`, 'crm-sheet crm-dwin');
  crmOverlay();
  // вкладки: «Основное» и «Сделки», переключаются без перерисовки
  document.querySelectorAll('.crm-tab').forEach(b => b.onclick = () => {
    document.querySelectorAll('.crm-tab').forEach(x => x.classList.toggle('on', x === b));
    document.querySelectorAll('[data-panel]').forEach(p => { p.hidden = p.dataset.panel !== b.dataset.tab; });
  });
  $('#sx').onclick = crmCloseAll;
  if ($('#crmback')) $('#crmback').onclick = crmCloseWin;
}

// удалить контакт или компанию из их окна: сообщения и задачи тоже уходят
async function crmDeletePerson(kind, id, name) {
  const what = kind === 'contact' ? 'контакт' : 'компанию';
  if (!confirm(`Удалить ${what} «${name}»? Его сообщения и задачи тоже удалятся.`)) return;
  try { await api(`/crm/${kind === 'contact' ? 'contacts' : 'companies'}/${id}`, {method: 'DELETE'}); }
  catch (e) { alert(e.message); return; }
  crmCloseAll();
  if (kind === 'contact') crmContactsList(); else crmCompaniesList();
}
const crmDelBtn = (what) => `<button class="kb-ib crm-del-p" id="crmdelp" aria-label="Удалить ${what}" title="Удалить ${what}">${CRM_ICO.trash}</button>`;

// открыть окно по ссылке из списка или раздела «Задачи»: поверх текущей страницы
function crmOpenHref(h) {
  const m = String(h).match(/^#\/crm\/(deal|contact|company)\/(\d+)$/);
  if (!m) return;
  const id = +m[2];
  if (m[1] === 'deal') return crmOpenWin('deal', () => crmOpenDeal(id));
  if (m[1] === 'contact') return crmOpenWin('contact', () => crmContactView(id, 'sheet'));
  return crmOpenWin('company', () => crmCompanyView(id, 'sheet'));
}

/* ---------- карточка контакта ---------- */
// ссылка для «Открыть»: без протокола добавляем https://
const crmHref = v => (/^https?:\/\//i.test(v) ? v : 'https://' + v);

// поле-ссылка: значение — подчёркнутая серая ссылка (открывается в новой вкладке); карандаш — изменить
function crmLinkField(id, value, placeholder, attrs = '') {
  const clear = value ? `<button class="crm-edit crm-clear" type="button" data-clear-link="${id}" aria-label="Удалить ссылку">✕</button>` : '';
  const edit = `<span class="crm-linkedit" data-linkedit="${id}"${value ? ' hidden' : ''}><input class="crm-in crm-url" id="${id}" ${attrs} placeholder="${placeholder}" value="${esc(value || '')}">${clear}</span>`;
  if (!value) return edit;
  return `<span class="crm-linkrow" data-linkrow="${id}"><a class="crm-alink" href="${esc(crmHref(value))}" target="_blank" rel="noopener">${esc(value)}</a><button class="crm-edit" type="button" data-edit-link="${id}" aria-label="Изменить">✎</button></span>${edit}`;
}
// карандаш: показываем поле ввода; уход из поля без изменений — снова ссылка
document.addEventListener('click', e => {
  const b = e.target.closest && e.target.closest('[data-edit-link]');
  if (b) {
    const id = b.dataset.editLink;
    const row = document.querySelector(`[data-linkrow="${id}"]`), edit = document.querySelector(`[data-linkedit="${id}"]`), inp = document.getElementById(id);
    if (row) row.hidden = true;
    if (edit) edit.hidden = false;
    if (inp) inp.focus();
    return;
  }
  const c = e.target.closest && e.target.closest('[data-clear-link]');
  if (c) {
    // удалить ссылку: очищаем поле и сохраняем — как при уходе из поля
    const inp = document.getElementById(c.dataset.clearLink);
    if (!inp) return;
    inp.value = '';
    inp.dispatchEvent(new Event('change', {bubbles: true}));
    inp.blur();
  }
});
// кнопка «удалить» не должна уводить фокус раньше клика
document.addEventListener('mousedown', e => { if (e.target.closest && e.target.closest('[data-clear-link]')) e.preventDefault(); });
document.addEventListener('focusout', e => {
  const inp = e.target;
  if (!inp.classList || !inp.classList.contains('crm-url') || !inp.id) return;
  setTimeout(() => {
    if (document.activeElement === inp || !inp.isConnected || !inp.value.trim()) return;
    const row = document.querySelector(`[data-linkrow="${inp.id}"]`), edit = document.querySelector(`[data-linkedit="${inp.id}"]`);
    if (row) { row.hidden = false; if (edit) edit.hidden = true; }
  }, 200);
});

const crmTabsBar = () => '<div class="crm-tabs"><button class="crm-tab on" data-tab="info">Основное</button><button class="crm-tab" data-tab="deals">Сделки</button></div>';

// несколько телефонов или почт: первая строка — основная, «+» добавляет строку ниже
function crmMultiField(label, key, values, placeholder) {
  const list = values && values.length ? values : [''];
  const rows = list.map((v, i) => `<div class="crm-mrow"><input class="crm-in crm-wide" value="${esc(v)}" placeholder="${i ? '' : placeholder}">${i === list.length - 1 ? `<button class="crm-plus-x" data-mplus="${key}" type="button" aria-label="Добавить: ${esc(label)}">+</button>` : ''}</div>`).join('');
  return `<div class="crm-prop"><div class="crm-pl"><span>${label}</span></div><div class="crm-pv crm-multi" data-mwrap="${key}">${rows}</div></div>`;
}

function crmBindMulti(path) {
  document.querySelectorAll('[data-mwrap]').forEach(wrap => {
    const key = wrap.dataset.mwrap;
    const save = async () => {
      const vals = [...wrap.querySelectorAll('input')].map(i => i.value.trim()).filter(Boolean);
      try { await api(path, {method: 'PATCH', body: {[key]: vals}}); }
      catch (e) { alert(e.message); }
    };
    wrap.addEventListener('change', e => { if (e.target.tagName === 'INPUT') save(); });
    wrap.addEventListener('click', e => {
      const b = e.target.closest('[data-mplus]');
      if (!b) return;
      const row = document.createElement('div');
      row.className = 'crm-mrow';
      row.innerHTML = `<input class="crm-in crm-wide"><button class="crm-plus-x" data-mplus="${key}" type="button" aria-label="Добавить">+</button>`;
      b.remove();
      wrap.appendChild(row);
      row.querySelector('input').focus();
    });
  });
}

async function crmContactView(id, mode) {
  const c = await api('/crm/contacts/' + id);
  const refresh = () => crmContactView(id, mode);
  const field = (label, key, placeholder = '') => `<div class="crm-prop"><div class="crm-pl"><span>${label}</span></div>
      <div class="crm-pv"><input class="crm-in crm-wide" data-f="${key}" value="${esc(c[key] || '')}" placeholder="${placeholder}"></div></div>`;
  const siteRow = `<div class="crm-prop"><div class="crm-pl"><span>Сайт</span></div>
      <div class="crm-pv crm-docs">${crmLinkField('crmsite_c', c.website, 'example.ru', 'data-f="website"')}</div></div>`;
  const left = `<div class="crm-body">
      <div class="crm-head-p">${crmAvatar(c.name, 'lg')}<div><div class="crm-card-t" id="crmname">${esc(c.name)}</div>
        <div class="crm-sub">${esc([c.position, c.city].filter(Boolean).join(' · ')) || 'Контакт'}</div></div></div>
      ${crmTabsBar()}
      <div class="crm-panel" data-panel="info"><div class="crm-props">
        ${field('Имя', 'first_name')}${field('Фамилия', 'last_name')}${field('Отчество', 'middle_name')}${siteRow}
        ${crmMultiField('Телефон', 'phones', c.phones, '+7…')}${crmMultiField('Почта', 'emails', c.emails, 'name@mail.ru')}${field('Телеграм', 'telegram', '@username')}
        ${field('Должность', 'position')}${field('Город', 'city')}
        <div class="crm-prop"><div class="crm-pl"><span>Компании</span></div>
          <div class="crm-pv crm-links" id="crmlk-companies">${crmEntChips('companies', c.companies)}<button class="crm-add-btn" data-add-companies="1">+ компанию</button></div></div>
      </div></div>
      <div class="crm-panel" data-panel="deals" hidden><div class="crm-groups">${crmDealGroups(c.deals)}</div></div>
    </div>`;
  crmShowPerson('contacts', mode, c.name, '#/crm/contacts', left, crmDelBtn('контакт'));
  $('#crmdelp').onclick = () => crmDeletePerson('contact', id, c.name);
  crmBindMulti('/crm/contacts/' + id);
  document.querySelectorAll('[data-f]').forEach(inp => inp.onchange = async () => {
    try {
      const upd = await api('/crm/contacts/' + id, {method: 'PATCH', body: {[inp.dataset.f]: inp.value}});
      if (['first_name', 'last_name'].includes(inp.dataset.f)) $('#crmname').textContent = upd.name;
      if (inp.dataset.f === 'website') refresh();
    } catch (e) { alert(e.message); }
  });
  const relink = async ids => {
    try { await api('/crm/contacts/' + id, {method: 'PATCH', body: {company_ids: ids}}); refresh(); }
    catch (e) { alert(e.message); }
  };
  crmBindPicker($('#crmlk-companies'), 'companies',
    async (kid, name) => {
      if (kid == null) kid = (await api('/crm/companies', {method: 'POST', body: {name}})).id;
      relink([...c.companies.map(x => x.id), kid]);
    },
    kid => relink(c.companies.map(x => x.id).filter(x => x !== kid)),
    kid => mode === 'sheet' ? crmOpenWin('company', () => crmCompanyView(kid, 'sheet')) : (location.hash = '#/crm/company/' + kid),
    refresh);
  crmBindDealGroups(mode);
  crmBindFeed('contacts', id, c.items);
}

/* ---------- карточка компании ---------- */
async function crmCompanyView(id, mode) {
  const k = await api('/crm/companies/' + id);
  const refresh = () => crmCompanyView(id, mode);
  const left = `<div class="crm-body">
      <div class="crm-head-p">${`<span class="crm-av lg crm-av-ic">${CRM_ICO.building}</span>`}<div><div class="crm-card-t" id="crmname">${esc(k.name)}</div>
        <div class="crm-sub">Компания</div></div></div>
      ${crmTabsBar()}
      <div class="crm-panel" data-panel="info"><div class="crm-props">
        <div class="crm-prop"><div class="crm-pl"><span>Название</span></div>
          <div class="crm-pv"><input class="crm-in crm-wide" id="crmnm" value="${esc(k.name)}"></div></div>
        <div class="crm-prop"><div class="crm-pl"><span>ИНН</span></div>
          <div class="crm-pv"><input class="crm-in crm-wide" id="crminn" inputmode="numeric" placeholder="10 или 12 цифр" value="${esc(k.inn || '')}"></div></div>
        <div class="crm-prop"><div class="crm-pl"><span>Сайт</span></div>
          <div class="crm-pv crm-docs">${crmLinkField('crmsite', k.website, 'example.ru')}</div></div>
        ${crmMultiField('Телефон', 'phones', k.phones, '+7…')}${crmMultiField('Почта', 'emails', k.emails, 'name@mail.ru')}
        <div class="crm-prop"><div class="crm-pl"><span>Карточка</span></div>
          <div class="crm-pv crm-docs">${crmLinkField('crmcu', k.card_url, 'Вставить ссылку')}</div></div>
        <div class="crm-prop"><div class="crm-pl"><span>Контакты</span></div>
          <div class="crm-pv crm-links" id="crmlk-contacts">${crmEntChips('contacts', k.contacts)}<button class="crm-add-btn" data-add-contacts="1">+ контакт</button></div></div>
      </div></div>
      <div class="crm-panel" data-panel="deals" hidden><div class="crm-groups">${crmDealGroups(k.deals)}</div></div>
    </div>`;
  crmShowPerson('companies', mode, k.name, '#/crm/companies', left, crmDelBtn('компанию'));
  $('#crmdelp').onclick = () => crmDeletePerson('company', id, k.name);
  crmBindMulti('/crm/companies/' + id);
  $('#crmnm').onchange = async () => {
    try { const u = await api('/crm/companies/' + id, {method: 'PATCH', body: {name: $('#crmnm').value}}); $('#crmname').textContent = u.name; }
    catch (e) { alert(e.message); }
  };
  $('#crminn').onchange = async () => {
    try { await api('/crm/companies/' + id, {method: 'PATCH', body: {inn: $('#crminn').value.replace(/\D/g, '')}}); refresh(); }
    catch (e) { alert(e.message); }
  };
  $('#crmsite').onchange = async () => {
    try { await api('/crm/companies/' + id, {method: 'PATCH', body: {website: $('#crmsite').value}}); refresh(); }
    catch (e) { alert(e.message); }
  };
  $('#crmcu').onchange = async () => {
    try { await api('/crm/companies/' + id, {method: 'PATCH', body: {card_url: $('#crmcu').value}}); refresh(); }
    catch (e) { alert(e.message); }
  };
  // контакт привязывается к компании через карточку контакта
  const relinkContact = async (cid, newName) => {
    try {
      if (cid == null) cid = (await api('/crm/contacts', {method: 'POST', body: crmSplitName(newName)})).id;
      const cur = await api('/crm/contacts/' + cid);
      await api('/crm/contacts/' + cid, {method: 'PATCH', body: {company_ids: [...cur.companies.map(x => x.id), id]}});
      refresh();
    } catch (e) { alert(e.message); }
  };
  const unlinkContact = async cid => {
    try {
      const cur = await api('/crm/contacts/' + cid);
      await api('/crm/contacts/' + cid, {method: 'PATCH', body: {company_ids: cur.companies.map(x => x.id).filter(x => x !== id)}});
      refresh();
    } catch (e) { alert(e.message); }
  };
  crmBindPicker($('#crmlk-contacts'), 'contacts', relinkContact, unlinkContact,
    cid => mode === 'sheet' ? crmOpenWin('contact', () => crmContactView(cid, 'sheet')) : (location.hash = '#/crm/contact/' + cid),
    refresh);
  crmBindDealGroups(mode);
  crmBindFeed('companies', id, k.items);
}

/* ---------- календарь: задача CRM — метка CRM и название владельца ---------- */
function crmCalItem(it, big, withDate = false) {
  const od = it.overdue ? ' od' : '';
  const time = it.due_time ? `<span class="${big ? 'kc-tag kc-date' + od : 'cal-t'}">${esc(it.due_time)}</span>` : '';
  const dtag = withDate ? `<span class="kc-tag kc-date od">${esc(odDateLabel(it.due_date))}</span>` : '';
  const tag = '<span class="kc-tag crm-cal-tag">CRM</span>';
  return big
    ? `<div class="kcard cal-crm${it.done ? ' done' : ''}${od}" data-href="${esc(it.href)}"><div class="kct">${esc(it.title)}</div><div class="kc-tags">${dtag}${time}${tag}</div><div class="cal-sub">${esc(it.owner_title)}</div></div>`
    : `<div class="cal-item cal-crm${it.done ? ' done' : ''}${od}" data-href="${esc(it.href)}">${time}<span class="cal-title">${esc(it.title)}</span>${tag}<span class="cal-sub">${esc(it.owner_title)}</span></div>`;
}

/* ---------- раздел «Задачи»: просроченные, сегодня, завтра, неделя, месяц, будущее ---------- */
async function crmTasksPage() {
  const all = await api('/crm/tasks');
  const open = all.filter(t => t.status === 'open');
  const today = crmToday();
  const diff = d => Math.round((new Date(d + 'T00:00:00') - new Date(today + 'T00:00:00')) / 864e5);
  const groups = [
    {name: 'Просроченные', cls: 'overdue', test: n => n < 0},
    {name: 'Задачи на сегодня', cls: 'today', test: n => n === 0},
    {name: 'Задачи на завтра', cls: 'tomorrow', test: n => n === 1},
    {name: 'Задачи на неделю', cls: 'week', test: n => n >= 2 && n <= 7},
    {name: 'Задачи на месяц', cls: 'month', test: n => n >= 8 && n <= 30},
    {name: 'Задачи на будущее', cls: 'future', test: n => n > 30},
  ];
  const cols = groups.map(g => ({...g, tasks: open.filter(t => g.test(diff(t.due_date)))}));
  const shown = cols.filter(c => c.cls !== 'overdue' || c.tasks.length);
  const card = t => {
    const overdue = t.due_date < today;
    const when = [crmDate(t.due_date), t.due_time].filter(Boolean).join(' ');
    // кто: контакты сделки или контакт; компания — в конце строки; название без повторов
    const who = t.names.join(', ');
    const comp = t.companies.join(', ');
    const line = [who, comp].filter(Boolean).join(', ') || t.owner_title;
    return `<div class="crm-tc${overdue ? ' overdue' : ''}" data-href="${esc(t.href)}">
      <div class="crm-tc-who">${esc(line)}</div>
      <div class="crm-tc-deal${t.deal_title ? '' : ' none'}">${esc(t.deal_title || 'Без сделки')}</div>
      <div class="crm-tc-when${overdue ? ' red' : ''}">${esc(when)}</div>
      <div class="crm-tc-what"><span class="crm-tc-ic">${CRM_ICO.check}</span><span>${esc(t.title)}</span></div>
    </div>`;
  };
  crmShell('tasks', `<div class="crm-tcols">${shown.map(c => `<div class="crm-tcol ${c.cls}">
      <div class="crm-col-h"><div class="crm-col-t">${c.name}</div><div class="crm-col-s">${c.tasks.length} ${crmPlural(c.tasks.length, 'задача', 'задачи', 'задач')}</div></div>
      <div class="crm-tcol-b">${c.tasks.map(card).join('') || '<div class="crm-tcol-empty">Пусто</div>'}</div>
    </div>`).join('')}</div>`);
  document.querySelectorAll('.crm-tc[data-href]').forEach(el => el.onclick = () => crmOpenHref(el.dataset.href));
}

/* ---------- маршруты CRM ---------- */
async function crmRoute(parts) {
  await crmLoadFunnels();
  const [sec, id] = parts;
  if (sec === 'tasks') return crmTasksPage();
  if (sec === 'contacts') return crmContactsList();
  if (sec === 'companies') return crmCompaniesList();
  // ссылка на контакт или компанию: раздел под окном, окно поверх
  if (sec === 'contact') return crmContactsList().then(() => crmOpenWin('contact', () => crmContactView(+id, 'sheet')));
  if (sec === 'company') return crmCompaniesList().then(() => crmOpenWin('company', () => crmCompanyView(+id, 'sheet')));
  if (sec === 'funnel') return crmPipeline(+id);
  if (sec === 'deal') {
    // воронка остаётся на фоне, окно сделки поверх
    let d;
    try { d = await api(`/crm/deals/${id}`); }
    catch (e) { alert(e.message); location.hash = '#/crm'; return; }
    await crmPipeline(d.pipeline_id);
    return crmOpenWin('deal', () => crmOpenDeal(+id));
  }
  // корень раздела: первая воронка, а если их нет — пустой экран
  if (crmFunnels.length) { location.hash = '#/crm/funnel/' + crmFunnels[0].id; return; }
  return crmNoFunnels();
}
