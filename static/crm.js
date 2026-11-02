/* ---------- CRM: воронка сделок, контакты, компании, сообщения и задачи ----------
   Отдельный файл поверх app.js: использует api, sheet, closeSheet, beforeClose, esc, $, tagColor, XICON, PLUS_ICON. */

const CRM_STAGES_UI = [
  {key: 'new', name: 'Новая заявка', c: '#9fc4f5'},
  {key: 'later', name: 'Когда-нибудь', c: '#c7cdd8'},
  {key: 'talks', name: 'Переговоры', c: '#f3e08a'},
  {key: 'work', name: 'В работе', c: '#f2b8b8'},
  {key: 'won', name: 'Успешно', c: '#9ed9ae'},
  {key: 'lost', name: 'Закрыто и не реализовано', c: '#c9c9cf'},
];
const crmStage = k => CRM_STAGES_UI.find(s => s.key === k) || CRM_STAGES_UI[0];

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
const crmToday = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const crmCap = s => s.charAt(0).toUpperCase() + s.slice(1);
const crmInitials = name => String(name || '?').trim().split(/\s+/).slice(0, 2).map(w => w[0] || '').join('').toUpperCase() || '?';
const crmAvatar = (name, cls = '') => {
  const k = tagColor(name || '?');
  return `<span class="crm-av ${cls}" style="background:${k.bg};color:${k.tc}">${esc(crmInitials(name))}</span>`;
};

// окна поверх друг друга: закрытие верхнего возвращает предыдущее
let crmStack = [];     // функции, которые заново открывают окна под текущим
let crmCurrent = null; // функция, которая открывает текущее окно
let crmReturn = null;  // куда вернуться из окна сделки, открытого со страницы

function crmOpenWin(fn) {
  if (crmCurrent) crmStack.push(crmCurrent);
  crmCurrent = fn;
  return fn();
}
function crmCloseWin() {
  if (crmStack.length) {
    const prev = crmStack.pop();
    crmCurrent = prev;
    return prev();
  }
  crmCurrent = null;
  return closeSheet();
}

/* ---------- каркас: слева меню разделов, справа содержимое ---------- */
function crmShell(active, inner, narrow = false) {
  crmStack = []; crmCurrent = null;
  $('#app').classList.add('kfull');
  $('#app').innerHTML = `<div class="crm">
    <div class="crm-nav" role="navigation" aria-label="CRM">
      <div class="crm-nav-t">CRM</div>
      <a class="crm-nav-i${active === 'pipe' ? ' on' : ''}" href="#/crm"><span class="crm-nav-ic">${CRM_ICO.funnel}</span>Воронка</a>
      <a class="crm-nav-i${active === 'tasks' ? ' on' : ''}" href="#/crm/tasks"><span class="crm-nav-ic">${CRM_ICO.check}</span>Задачи</a>
      <a class="crm-nav-i${active === 'contacts' ? ' on' : ''}" href="#/crm/contacts"><span class="crm-nav-ic">${CRM_ICO.user}</span>Контакты</a>
      <a class="crm-nav-i${active === 'companies' ? ' on' : ''}" href="#/crm/companies"><span class="crm-nav-ic">${CRM_ICO.building}</span>Компании</a>
    </div>
    <div class="crm-main${narrow ? ' narrow' : ''}">${inner}</div>
  </div>`;
}

/* ---------- воронка ---------- */
const crmWho = d => [d.contacts.map(c => c.name).join(', '), d.companies.map(c => c.name).join(', ')];

function crmDealCard(d) {
  const [who, comp] = crmWho(d);
  return `<div class="crm-deal" data-deal="${d.id}">
    <div class="crm-deal-top"><span class="crm-deal-who">${esc(who)}${comp ? `<span class="crm-deal-comp">${who ? ', ' : ''}${esc(comp)}</span>` : ''}</span><span class="crm-deal-date">${crmDate(d.created_at)}</span></div>
    <div class="crm-deal-title">${esc(d.title)}</div>
    ${d.amount ? `<div class="crm-deal-foot"><span class="kc-tag">${crmMoney(d.amount)}</span></div>` : ''}
  </div>`;
}

function crmStageCol(s) {
  const n = s.deals.length;
  const ui = crmStage(s.key);
  return `<div class="crm-col" data-stage="${s.key}">
    <div class="crm-col-h" style="--sc:${ui.c}">
      <div class="crm-col-t">${esc(s.name)}</div>
      <div class="crm-col-s">${n} ${crmPlural(n, 'сделка', 'сделки', 'сделок')}: ${crmMoney(s.sum)}</div>
    </div>
    <div class="crm-col-b">
      <div class="crm-quick" data-quick="${s.key}"><button class="crm-quick-btn">Быстрое добавление</button></div>
      ${s.deals.map(crmDealCard).join('')}
    </div>
  </div>`;
}

async function crmPipeline() {
  const data = await api('/crm/pipeline');
  const all = data.stages.reduce((a, s) => a + s.deals.length, 0);
  const total = data.stages.reduce((a, s) => a + s.sum, 0);
  crmShell('pipe', `<div class="crm-head">
      <div class="crm-sum">${all} ${crmPlural(all, 'сделка', 'сделки', 'сделок')}: <b>${crmMoney(total)}</b></div>
      <button class="crm-newbtn" id="crmnew">${PLUS_ICON}<span>Новая сделка</span></button>
    </div>
    <div class="crm-cols">${data.stages.map(crmStageCol).join('')}</div>`);
  document.querySelectorAll('[data-deal]').forEach(el => el.onclick = () => { crmReturn = null; location.hash = '#/crm/deal/' + el.dataset.deal; });
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
        if (!save || !title) return crmPipeline();
        try { await api('/crm/deals', {method: 'POST', body: {title, stage: box.dataset.quick}}); }
        catch (e) { alert(e.message); }
        crmPipeline();
      };
      inp.onkeydown = e => { if (e.key === 'Enter') finish(true); if (e.key === 'Escape') finish(false); };
      inp.onblur = () => finish(true);
    };
  });
  $('#crmnew').onclick = async () => {
    try {
      const d = await api('/crm/deals', {method: 'POST', body: {title: '', stage: 'new'}});
      crmReturn = null;
      location.hash = '#/crm/deal/' + d.id;
    } catch (e) { alert(e.message); }
  };
}

/* ---------- окно: слева содержимое, справа сообщения и задачи (одинаково у сделки, контакта, компании) ---------- */
function crmWin(left, mode, tools = '') {
  return `<div class="crm-win${mode === 'page' ? ' page' : ''}">
    <div class="crm-left">${mode === 'sheet' ? crmSheetTop(tools) : ''}${left}</div>
    <div class="crm-right">
      <div class="crm-chat-h">Сообщения и задачи</div>
      <div class="crm-msgs" id="crmmsgs"></div>
      <div class="crm-tf" id="crmtf" hidden>
        <input class="crm-tf-title" id="crmtftitle" placeholder="Что нужно сделать">
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
      </div>
    </div>
  </div>`;
}

const crmSheetTop = (tools = '') => `<div class="crm-dtop"><span class="kb-saved" id="crmsaved">Сохранено</span>
  <div class="kb-tools">${tools}<button class="kb-ib" id="sx" aria-label="Закрыть">${XICON}</button></div></div>`;

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
  return `<div class="crm-task${done ? ' done' : ''}${overdue ? ' overdue' : ''}" data-task="${t.id}">
    <div class="crm-task-top"><span class="crm-task-chk">${done ? CRM_ICO.check : ''}</span>
      <div class="crm-task-main"><div class="crm-task-t">${esc(t.title)}</div><div class="crm-task-m${overdue ? ' red' : ''}">${when}</div></div></div>
    ${done ? `<div class="crm-task-res"><span class="crm-task-resl">Итог</span>${esc(t.result).replace(/\n/g, '<br>')}</div>
      <div class="crm-task-m crm-task-stamp">Выполнено ${t.done_at ? crmStamp(t.done_at) : ''}</div>` : ''}
    <div class="crm-task-act">
      ${done ? '' : `<button class="crm-task-done" data-task-done="${t.id}">Завершить</button>`}
      <button class="crm-task-link" data-task-edit="${t.id}">Изменить</button>
      <button class="crm-task-link danger" data-task-del="${t.id}">Удалить</button>
    </div>
    <div class="crm-task-cf" data-task-cf="${t.id}" hidden>
      <textarea placeholder="Итог: что сделано" rows="2"></textarea>
      <div class="crm-task-cf-row"><button class="crm-task-save">Сохранить итог</button><button class="crm-task-cancel">Отмена</button></div>
    </div>
    <div class="crm-task-ed" data-task-ed="${t.id}" hidden>
      <input class="crm-tf-title" data-ed-title value="${esc(t.title)}" placeholder="Что нужно сделать">
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
    : `<div class="crm-msg" data-msg="${i.id}">
        <div class="crm-bub">${esc(i.text).replace(/\n/g, '<br>')}</div>
        <div class="crm-msg-t">${crmStamp(i.created_at)}<span class="crm-msg-acts"><button class="crm-msg-link" data-msg-edit="${i.id}">Изменить</button><button class="crm-msg-link danger" data-msg-del="${i.id}">Удалить</button></span></div>
        <div class="crm-msg-ed" data-msg-ed="${i.id}" hidden><textarea rows="2">${esc(i.text)}</textarea>
          <div class="crm-task-cf-row"><button class="crm-task-save" data-msg-save="${i.id}">Сохранить</button><button class="crm-task-cancel" data-msg-cancel="${i.id}">Отмена</button></div></div>
      </div>`
  ).join('') || '<div class="crm-msgs-empty">Пока нет сообщений и задач</div>';
}

// kind: deals | contacts | companies — кому принадлежит лента
function crmBindFeed(kind, oid, items) {
  let list = items;
  const box = $('#crmmsgs');
  const render = () => {
    box.innerHTML = crmItemsHtml(list);
    bindTasks();
    box.scrollTop = box.scrollHeight;
    const pb = box.closest('.crm-pop-body');
    if (pb) pb.scrollTop = pb.scrollHeight;
  };
  const bindTasks = () => {
    const card = id => document.querySelector(`[data-task="${id}"]`);
    const showOnly = (id, panel) => {
      const c = card(id);
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
          list = list.map(i => i.kind === 'task' && i.id === id ? upd : i);
          render();
        } catch (e) { alert(e.message); }
      };
    });
    document.querySelectorAll('[data-task-edit]').forEach(b => b.onclick = () => showOnly(+b.dataset.taskEdit, 'ed'));
    document.querySelectorAll('[data-ed-cancel]').forEach(b => b.onclick = () => showOnly(+b.dataset.edCancel, 'act'));
    const msgEl = id => document.querySelector(`[data-msg="${id}"]`);
    const msgView = (id, editing) => {
      const el = msgEl(id);
      el.querySelector('.crm-bub').hidden = editing;
      el.querySelector('.crm-msg-t').hidden = editing;
      el.querySelector(`[data-msg-ed="${id}"]`).hidden = !editing;
      if (editing) el.querySelector('[data-msg-ed] textarea').focus();
    };
    document.querySelectorAll('[data-msg-edit]').forEach(b => b.onclick = () => msgView(+b.dataset.msgEdit, true));
    document.querySelectorAll('[data-msg-cancel]').forEach(b => b.onclick = () => msgView(+b.dataset.msgCancel, false));
    document.querySelectorAll('[data-msg-save]').forEach(b => b.onclick = async () => {
      const id = +b.dataset.msgSave;
      const text = msgEl(id).querySelector('[data-msg-ed] textarea').value.trim();
      if (!text) { msgEl(id).querySelector('[data-msg-ed] textarea').focus(); return; }
      try {
        const upd = await api(`/crm/messages/${id}`, {method: 'PATCH', body: {text}});
        list = list.map(i => i.kind === 'message' && i.id === id ? upd : i);
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
        list = list.map(i => i.kind === 'task' && i.id === id ? upd : i);
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

  // задача: форма над полем ввода, без отдельного окна
  const tf = $('#crmtf');
  $('#crmaddtask').onclick = () => {
    tf.hidden = !tf.hidden;
    if (!tf.hidden) $('#crmtftitle').focus();
  };
  $('#crmtfx').onclick = () => { tf.hidden = true; };
  const addTask = async () => {
    const title = $('#crmtftitle').value.trim();
    const due = $('#crmtfdate').value;
    const time = $('#crmtftime').value;
    if (!title) { $('#crmtftitle').focus(); return; }
    if (!due) { $('#crmtfdate').focus(); return; }
    try {
      const task = await api(`/crm/${kind}/${oid}/tasks`, {method: 'POST', body: {title, due_date: due, due_time: time || null}});
      list = [...list, task];
      $('#crmtftitle').value = '';
      $('#crmtftime').value = '';
      tf.hidden = true;
      render();
    } catch (e) { alert(e.message); }
  };
  $('#crmtfok').onclick = addTask;
  $('#crmtftitle').onkeydown = e => { if (e.key === 'Enter') addTask(); if (e.key === 'Escape') tf.hidden = true; };

  // сообщения
  const ta = $('#crmmsg');
  const send = async () => {
    const text = ta.value.trim();
    if (!text) return;
    ta.value = '';
    try {
      const m = await api(`/crm/${kind}/${oid}/messages`, {method: 'POST', body: {text}});
      list = [...list, m];
      render();
    } catch (e) { alert(e.message); }
    ta.focus();
  };
  $('#crmsend').onclick = send;
  ta.onkeydown = e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } };
}

/* ---------- ссылки: контакты и компании, выбор из базы с поиском ---------- */
const crmCapKind = kind => crmCap(kind);
function crmEntChips(kind, items) {
  return items.map(x => `<span class="crm-ent"><button class="crm-ent-n" data-open-${kind}="${x.id}">${esc(x.name)}</button><button class="crm-ent-x" data-unlink-${kind}="${x.id}" aria-label="Убрать">${XICON}</button></span>`).join('');
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
    const cur = crmStage(d.stage);
    $('#crmprops').innerHTML = `
      <div class="crm-prop"><div class="crm-pl">${CRM_ICO.funnel}<span>Воронка</span></div>
        <div class="crm-pv"><div class="crm-dd" id="crmdd">
          <button class="crm-dd-b" id="crmddb"><span class="crm-dot" style="--sc:${cur.c}"></span><span>${esc(cur.name)}</span><span class="crm-caret">${CRM_ICO.chev}</span></button>
          <div class="crm-dd-m" id="crmddm" hidden>${CRM_STAGES_UI.map(s => `<button class="crm-dd-i${s.key === d.stage ? ' on' : ''}" data-stage="${s.key}"><span class="crm-dot" style="--sc:${s.c}"></span>${esc(s.name)}</button>`).join('')}</div>
        </div></div></div>
      <div class="crm-prop"><div class="crm-pl">${CRM_ICO.rub}<span>Бюджет</span></div>
        <div class="crm-pv"><input class="crm-in crm-amount" id="crmamt" inputmode="numeric" placeholder="Не указан" value="${d.amount ? d.amount.toLocaleString('ru-RU') : ''}"><span class="crm-unit">₽</span></div></div>
      <div class="crm-prop"><div class="crm-pl">${CRM_ICO.dot}<span>Формат</span></div>
        <div class="crm-pv">
          <button class="crm-chip crm-fmt-white${d.format === 'white' ? ' on' : ''}" data-fmt="white">Белый</button>
          <button class="crm-chip crm-fmt-black${d.format === 'black' ? ' on' : ''}" data-fmt="black">Чёрный</button>
        </div></div>
      <div class="crm-prop"><div class="crm-pl">${CRM_ICO.link}<span>Документы</span></div>
        <div class="crm-pv crm-docs"><input class="crm-in crm-url" id="crmdocs" placeholder="Ссылка на Google Диск" value="${esc(d.documents_url || '')}">${d.documents_url ? `<a class="crm-open" href="${esc(d.documents_url)}" target="_blank" rel="noopener">Открыть</a>` : ''}</div></div>
      <div class="crm-prop"><div class="crm-pl">${CRM_ICO.user}<span>Контакты</span></div>
        <div class="crm-pv crm-links" id="crmlk-contacts">${crmEntChips('contacts', d.contacts)}<button class="crm-add-btn" data-add-contacts="1">+ контакт</button></div></div>
      <div class="crm-prop"><div class="crm-pl">${CRM_ICO.building}<span>Компании</span></div>
        <div class="crm-pv crm-links" id="crmlk-companies">${crmEntChips('companies', d.companies)}<button class="crm-add-btn" data-add-companies="1">+ компанию</button></div></div>`;

    // этап: выпадающий список
    $('#crmddb').onclick = e => { e.stopPropagation(); $('#crmddm').hidden = !$('#crmddm').hidden; };
    $('#crmdd').querySelectorAll('[data-stage]').forEach(b => b.onclick = async e => {
      e.stopPropagation();
      d.stage = b.dataset.stage; paint();
      await saveDeal({stage: d.stage});
    });
    // формат: повторный клик снимает
    $('#crmprops').querySelectorAll('[data-fmt]').forEach(b => b.onclick = async () => {
      const f = b.dataset.fmt;
      d.format = d.format === f ? null : f; paint();
      await saveDeal({format: d.format});
    });
    // бюджет: сохраняем при уходе из поля
    const amt = $('#crmamt');
    amt.oninput = () => { const v = amt.value.replace(/\D/g, ''); amt.value = v ? (+v).toLocaleString('ru-RU') : ''; };
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
      id => crmOpenWin(() => crmContactView(id, 'sheet')), paint);
    crmBindPicker($('#crmlk-companies'), 'companies', linkCompany, unlinkCompany,
      id => crmOpenWin(() => crmCompanyView(id, 'sheet')), paint);
  };

  const left = `<div class="crm-body">
      <div class="crm-dtitle" id="crmtitle" contenteditable="true" spellcheck="false" data-ph="Название сделки">${esc(d.title && d.title !== 'Без названия' ? d.title : '')}</div>
      <div class="crm-props" id="crmprops"></div>
    </div>`;
  sheet(`<div class="crm-win-box">${crmWin(left, 'sheet', `<button class="kb-ib" id="crmdel" aria-label="Удалить сделку">${CRM_ICO.trash}</button>`)}</div>`,
    'crm-sheet crm-dwin');

  $('#sx').onclick = crmCloseWin;
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
  return block('Успешные', 'ok', g.won, g.sums.won)
    + block('Потерянные', 'lost', g.lost, g.sums.lost)
    + block('В работе', 'act', g.active, g.sums.active);
}

function crmBindDealGroups(mode) {
  document.querySelectorAll('[data-deal-go]').forEach(el => el.onclick = () => {
    const id = +el.dataset.dealGo;
    if (mode === 'sheet') return crmOpenWin(() => crmOpenDeal(id));
    crmReturn = location.hash;
    location.hash = '#/crm/deal/' + id;
  });
}

// формы под лентой: задача и сообщение (одинаково во всех окнах)
function crmFormsHtml() {
  return `<div class="crm-tf" id="crmtf" hidden>
        <input class="crm-tf-title" id="crmtftitle" placeholder="Что нужно сделать">
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
function crmShowPerson(kind, mode, title, back, left) {
  sheet(`<div class="crm-win-box">${crmWin(left, 'sheet')}</div>`, 'crm-sheet crm-dwin');
  $('#sx').onclick = crmCloseWin;
}

// открыть окно по ссылке из списка или раздела «Задачи»: поверх текущей страницы
function crmOpenHref(h) {
  const m = String(h).match(/^#\/crm\/(deal|contact|company)\/(\d+)$/);
  if (!m) return;
  const id = +m[2];
  if (m[1] === 'deal') return crmOpenWin(() => crmOpenDeal(id));
  if (m[1] === 'contact') return crmOpenWin(() => crmContactView(id, 'sheet'));
  return crmOpenWin(() => crmCompanyView(id, 'sheet'));
}

/* ---------- карточка контакта ---------- */
async function crmContactView(id, mode) {
  const c = await api('/crm/contacts/' + id);
  const refresh = () => crmContactView(id, mode);
  const field = (label, key, placeholder = '') => `<div class="crm-prop"><div class="crm-pl"><span>${label}</span></div>
      <div class="crm-pv"><input class="crm-in crm-wide" data-f="${key}" value="${esc(c[key] || '')}" placeholder="${placeholder}"></div></div>`;
  const left = `<div class="crm-body">
      <div class="crm-head-p">${crmAvatar(c.name, 'lg')}<div><div class="crm-card-t" id="crmname">${esc(c.name)}</div>
        <div class="crm-sub">${esc([c.position, c.city].filter(Boolean).join(' · ')) || 'Контакт'}</div></div></div>
      <div class="crm-props">
        ${field('Имя', 'first_name')}${field('Фамилия', 'last_name')}${field('Отчество', 'middle_name')}
        ${field('Телефон', 'phone', '+7…')}${field('Почта', 'email', 'name@mail.ru')}${field('Телеграм', 'telegram', '@username')}
        ${field('Должность', 'position')}${field('Город', 'city')}
        <div class="crm-prop"><div class="crm-pl"><span>Компании</span></div>
          <div class="crm-pv crm-links" id="crmlk-companies">${crmEntChips('companies', c.companies)}<button class="crm-add-btn" data-add-companies="1">+ компанию</button></div></div>
      </div>
      <div class="crm-sec-t">Сделки</div>
      <div class="crm-groups">${crmDealGroups(c.deals)}</div>
    </div>`;
  crmShowPerson('contacts', mode, c.name, '#/crm/contacts', left);
  document.querySelectorAll('[data-f]').forEach(inp => inp.onchange = async () => {
    try {
      const upd = await api('/crm/contacts/' + id, {method: 'PATCH', body: {[inp.dataset.f]: inp.value}});
      if (['first_name', 'last_name'].includes(inp.dataset.f)) $('#crmname').textContent = upd.name;
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
    kid => mode === 'sheet' ? crmOpenWin(() => crmCompanyView(kid, 'sheet')) : (location.hash = '#/crm/company/' + kid),
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
      <div class="crm-props">
        <div class="crm-prop"><div class="crm-pl"><span>Название</span></div>
          <div class="crm-pv"><input class="crm-in crm-wide" id="crmnm" value="${esc(k.name)}"></div></div>
        <div class="crm-prop"><div class="crm-pl"><span>ИНН</span></div>
          <div class="crm-pv"><input class="crm-in crm-wide" id="crminn" inputmode="numeric" placeholder="10 или 12 цифр" value="${esc(k.inn || '')}"></div></div>
        <div class="crm-prop"><div class="crm-pl"><span>Карточка</span></div>
          <div class="crm-pv crm-docs"><input class="crm-in crm-url" id="crmcu" placeholder="Ссылка на Google Диск" value="${esc(k.card_url || '')}">${k.card_url ? `<a class="crm-open" href="${esc(k.card_url)}" target="_blank" rel="noopener">Открыть</a>` : ''}</div></div>
        <div class="crm-prop"><div class="crm-pl"><span>Контакты</span></div>
          <div class="crm-pv crm-links" id="crmlk-contacts">${crmEntChips('contacts', k.contacts)}<button class="crm-add-btn" data-add-contacts="1">+ контакт</button></div></div>
      </div>
      <div class="crm-sec-t">Сделки</div>
      <div class="crm-groups">${crmDealGroups(k.deals)}</div>
    </div>`;
  crmShowPerson('companies', mode, k.name, '#/crm/companies', left);
  $('#crmnm').onchange = async () => {
    try { const u = await api('/crm/companies/' + id, {method: 'PATCH', body: {name: $('#crmnm').value}}); $('#crmname').textContent = u.name; }
    catch (e) { alert(e.message); }
  };
  $('#crminn').onchange = async () => {
    try { await api('/crm/companies/' + id, {method: 'PATCH', body: {inn: $('#crminn').value.replace(/\D/g, '')}}); refresh(); }
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
    cid => mode === 'sheet' ? crmOpenWin(() => crmContactView(cid, 'sheet')) : (location.hash = '#/crm/contact/' + cid),
    refresh);
  crmBindDealGroups(mode);
  crmBindFeed('companies', id, k.items);
}

/* ---------- календарь: задача CRM — метка CRM и название владельца ---------- */
function crmCalItem(it, big) {
  const time = it.due_time ? `<span class="${big ? 'kc-tag kc-date' : 'cal-t'}">${esc(it.due_time)}</span>` : '';
  const tag = '<span class="kc-tag crm-cal-tag">CRM</span>';
  return big
    ? `<div class="kcard cal-crm${it.done ? ' done' : ''}" data-href="${esc(it.href)}"><div class="kct">${esc(it.title)}</div><div class="kc-tags">${time}${tag}</div><div class="cal-sub">${esc(it.owner_title)}</div></div>`
    : `<div class="cal-item cal-crm${it.done ? ' done' : ''}" data-href="${esc(it.href)}">${time}<span class="cal-title">${esc(it.title)}</span>${tag}<span class="cal-sub">${esc(it.owner_title)}</span></div>`;
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
function crmRoute(parts) {
  const [sec, id] = parts;
  if (sec === 'tasks') return crmTasksPage();
  if (sec === 'contacts') return crmContactsList();
  if (sec === 'companies') return crmCompaniesList();
  // ссылка на контакт или компанию: раздел под окном, окно поверх
  if (sec === 'contact') return crmContactsList().then(() => crmOpenWin(() => crmContactView(+id, 'sheet')));
  if (sec === 'company') return crmCompaniesList().then(() => crmOpenWin(() => crmCompanyView(+id, 'sheet')));
  if (sec === 'deal') {
    // воронка остаётся на фоне, окно сделки поверх
    return crmPipeline().then(() => crmOpenWin(() => crmOpenDeal(+id)));
  }
  return crmPipeline();
}
