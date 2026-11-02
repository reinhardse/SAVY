/* ---------- CRM: воронка сделок, контакты, компании ----------
   Отдельный файл поверх app.js: использует api, sheet, esc, $, XICON, PLUS_ICON, HL_DOC. */

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
  trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg>',
  send: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12l16-8-6 16-2-6z"/></svg>',
  link: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/></svg>',
};

const crmPlural = (n, one, few, many) => {
  const m = Math.abs(n) % 100, d = m % 10;
  if (m > 10 && m < 20) return many;
  if (d > 1 && d < 5) return few;
  if (d === 1) return one;
  return many;
};
const money = n => (n || 0).toLocaleString('ru-RU') + ' ₽';
const fmtDate = iso => (iso ? iso.split('-').reverse().join('.') : '');
const fmtStamp = iso => {
  const d = new Date(iso);
  return d.toLocaleString('ru-RU', {day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'});
};
const crmDebounce = (fn, ms = 220) => { let t = null; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
let crmReturn = null; // куда вернуться из окна сделки (карточка контакта или компании)

/* ---------- каркас: слева меню разделов, справа содержимое ---------- */
function crmShell(active, inner) {
  $('#app').classList.add('kfull');
  $('#app').innerHTML = `<div class="crm">
    <div class="crm-nav" role="navigation" aria-label="CRM">
      <div class="crm-nav-t">CRM</div>
      <a class="crm-nav-i${active === 'pipe' ? ' on' : ''}" href="#/crm"><span class="crm-nav-ic">${CRM_ICO.funnel}</span>Воронка</a>
      <a class="crm-nav-i${active === 'contacts' ? ' on' : ''}" href="#/crm/contacts"><span class="crm-nav-ic">${CRM_ICO.user}</span>Контакты</a>
      <a class="crm-nav-i${active === 'companies' ? ' on' : ''}" href="#/crm/companies"><span class="crm-nav-ic">${CRM_ICO.building}</span>Компании</a>
    </div>
    <div class="crm-main">${inner}</div>
  </div>`;
}

/* ---------- воронка ---------- */
const crmWho = d => [d.contacts.map(c => c.name).join(', '), d.companies.map(c => c.name).join(', ')];

function crmDealCard(d) {
  const [who, comp] = crmWho(d);
  return `<div class="crm-deal" data-deal="${d.id}">
    <div class="crm-deal-top"><span class="crm-deal-who">${esc(who)}${comp ? `<span class="crm-deal-comp">${who ? ', ' : ''}${esc(comp)}</span>` : ''}</span><span class="crm-deal-date">${fmtDate(d.created_at)}</span></div>
    <div class="crm-deal-title">${esc(d.title)}</div>
    <div class="crm-deal-foot"><span class="crm-deal-sum">${d.amount ? money(d.amount) : ''}</span></div>
  </div>`;
}

function crmStageCol(s) {
  const ui = crmStage(s.key);
  const n = s.deals.length;
  return `<div class="crm-col" data-stage="${s.key}">
    <div class="crm-col-h" style="--sc:${ui.c}">
      <div class="crm-col-t">${esc(s.name)}</div>
      <div class="crm-col-s">${n} ${crmPlural(n, 'сделка', 'сделки', 'сделок')}: ${money(s.sum)}</div>
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
      <div class="crm-sum">${all} ${crmPlural(all, 'сделка', 'сделки', 'сделок')}: <b>${money(total)}</b></div>
      <button class="crm-newbtn" id="crmnew">${PLUS_ICON}<span>Новая сделка</span></button>
    </div>
    <div class="crm-cols">${data.stages.map(crmStageCol).join('')}</div>`);
  document.querySelectorAll('[data-deal]').forEach(el => el.onclick = () => { crmReturn = null; location.hash = '#/crm/deal/' + el.dataset.deal; });
  document.querySelectorAll('[data-quick]').forEach(box => {
    const btn = box.querySelector('.crm-quick-btn');
    btn.onclick = () => {
      box.innerHTML = '<input class="crm-quick-in" placeholder="Название сделки" maxlength="200">';
      const inp = box.querySelector('input');
      inp.focus();
      let done = false;
      const finish = async (save) => {
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

/* ---------- сообщения сделки: лента справа, как в мессенджере ---------- */
function crmMsgsHtml(msgs) {
  return msgs.map(m => `<div class="crm-msg"><div class="crm-bub">${esc(m.text).replace(/\n/g, '<br>')}</div><div class="crm-msg-t">${fmtStamp(m.created_at)}</div></div>`).join('')
    || '<div class="crm-msgs-empty">Пока нет сообщений</div>';
}

/* ---------- ссылки сделки: контакты и компании, выбор из базы с поиском ---------- */
function crmEntChips(kind, items) {
  return items.map(x => `<span class="crm-ent"><button class="crm-ent-n" data-open-${kind}="${x.id}">${esc(x.name)}</button><button class="crm-ent-x" data-unlink-${kind}="${x.id}" aria-label="Убрать">${XICON}</button></span>`).join('');
}

function crmBindPicker(box, kind, onLink, onUnlink, onOpen, repaint) {
  box.querySelectorAll(`[data-open-${kind}]`).forEach(b => b.onclick = () => onOpen(+b.dataset[`open${kind[0].toUpperCase() + kind.slice(1)}`]));
  box.querySelectorAll(`[data-unlink-${kind}]`).forEach(b => b.onclick = () => onUnlink(+b.dataset[`unlink${kind[0].toUpperCase() + kind.slice(1)}`]));
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
      const linked = new Set([...box.querySelectorAll(`[data-unlink-${kind}]`)].map(b => +b.dataset[`unlink${kind[0].toUpperCase() + kind.slice(1)}`]));
      const free = rows.filter(r => !linked.has(r.id)).slice(0, 8);
      const create = q ? `<button class="crm-drop-i crm-drop-new" data-create="1">+ Создать «${esc(q)}»</button>` : '';
      drop.innerHTML = free.map(r => `<button class="crm-drop-i" data-pick="${r.id}">${esc(r.name)}${r.companies ? `<span class="crm-drop-sub">${esc(r.companies.map(c => c.name).join(', '))}</span>` : ''}</button>`).join('') + create;
      drop.querySelectorAll('[data-pick]').forEach(b => b.onmousedown = e => { e.preventDefault(); onLink(+b.dataset.pick); });
      const c = drop.querySelector('[data-create]');
      if (c) c.onmousedown = e => { e.preventDefault(); onLink(null, q); };
    }, 180);
    inp.oninput = search;
    search();
    // уход из поля без выбора — возвращаем кнопку «+»
    inp.onblur = () => setTimeout(() => { if (box.contains(inp)) repaint(); }, 150);
    inp.onkeydown = e => { if (e.key === 'Escape') repaint(); };
  };
}


/* ---------- окно сделки ---------- */
async function crmOpenDeal(id) {
  let d;
  try { d = await api(`/crm/deals/${id}`); }
  catch (e) { alert(e.message); location.hash = '#/crm'; return; }

  const paint = () => {
    const ui = crmStage(d.stage);
    $('#crmprops').innerHTML = `
      <div class="crm-prop"><div class="crm-pl">${CRM_ICO.funnel}<span>Воронка</span></div>
        <div class="crm-pv">${CRM_STAGES_UI.map(s => `<button class="crm-chip${s.key === d.stage ? ' on' : ''}" style="--cc:${s.c}" data-stage="${s.key}">${esc(s.name)}</button>`).join('')}</div></div>
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
    // этапы
    $('#crmprops').querySelectorAll('[data-stage]').forEach(b => b.onclick = async () => {
      d.stage = b.dataset.stage; paint();
      try { await api(`/crm/deals/${d.id}`, {method: 'PATCH', body: {stage: d.stage}}); } catch (e) { alert(e.message); }
    });
    // формат: повторный клик снимает
    $('#crmprops').querySelectorAll('[data-fmt]').forEach(b => b.onclick = async () => {
      const f = b.dataset.fmt;
      d.format = d.format === f ? null : f; paint();
      try { await api(`/crm/deals/${d.id}`, {method: 'PATCH', body: {format: d.format}}); } catch (e) { alert(e.message); }
    });
    // бюджет: сохраняем при уходе из поля
    const amt = $('#crmamt');
    amt.oninput = () => { amt.value = amt.value.replace(/\D/g, '') ? (+amt.value.replace(/\D/g, '')).toLocaleString('ru-RU') : ''; };
    amt.onblur = async () => {
      const n = +(amt.value.replace(/\D/g, '')) || 0;
      if (n === d.amount) return;
      d.amount = n;
      try { await api(`/crm/deals/${d.id}`, {method: 'PATCH', body: {amount: n}}); crmSaved(); } catch (e) { alert(e.message); }
    };
    // ссылка на документы
    const docs = $('#crmdocs');
    docs.onblur = async () => {
      const v = docs.value.trim();
      if (v === (d.documents_url || '')) return;
      d.documents_url = v || null;
      try { await api(`/crm/deals/${d.id}`, {method: 'PATCH', body: {documents_url: v}}); crmSaved(); paint(); } catch (e) { alert(e.message); }
    };
    // связи: контакты и компании
    crmBindPicker($('#crmlk-contacts'), 'contacts', linkContact, unlinkContact, openContactCard, paint);
    crmBindPicker($('#crmlk-companies'), 'companies', linkCompany, unlinkCompany, openCompanyCard, paint);
  };

  const refreshLinks = async () => { d = await api(`/crm/deals/${d.id}`); paint(); };
  const linkContact = async (cid, newName) => {
    try {
      if (cid == null) { const c = await api('/crm/contacts', {method: 'POST', body: crmSplitName(newName)}); cid = c.id; }
      await api(`/crm/deals/${d.id}/contacts`, {method: 'POST', body: {id: cid}});
      await refreshLinks();
    } catch (e) { alert(e.message); }
  };
  const unlinkContact = async cid => { try { await api(`/crm/deals/${d.id}/contacts/${cid}`, {method: 'DELETE'}); await refreshLinks(); } catch (e) { alert(e.message); } };
  const linkCompany = async (kid, newName) => {
    try {
      if (kid == null) { const k = await api('/crm/companies', {method: 'POST', body: {name: newName}}); kid = k.id; }
      await api(`/crm/deals/${d.id}/companies`, {method: 'POST', body: {id: kid}});
      await refreshLinks();
    } catch (e) { alert(e.message); }
  };
  const unlinkCompany = async kid => { try { await api(`/crm/deals/${d.id}/companies/${kid}`, {method: 'DELETE'}); await refreshLinks(); } catch (e) { alert(e.message); } };

  sheet(`<div class="crm-dsheet">
    <div class="crm-dleft">
      <div class="crm-dtop">
        <span class="kb-saved" id="crmsaved">Сохранено</span>
        <div class="kb-tools">
          <button class="kb-ib" id="crmdel" aria-label="Удалить сделку">${CRM_ICO.trash}</button>
          <button class="kb-ib" id="sx" aria-label="Закрыть">${XICON}</button>
        </div>
      </div>
      <div class="crm-dbody">
        <div class="kb-title crm-dtitle" id="crmtitle" contenteditable="true" spellcheck="false" data-ph="Название сделки">${esc(d.title && d.title !== 'Без названия' ? d.title : '')}</div>
        <div class="crm-props" id="crmprops"></div>
      </div>
    </div>
    <div class="crm-dright">
      <div class="crm-chat-h">Сообщения</div>
      <div class="crm-msgs" id="crmmsgs">${crmMsgsHtml(d.messages)}</div>
      <div class="crm-compose">
        <textarea id="crmmsg" rows="1" placeholder="Напишите сообщение…"></textarea>
        <button class="crm-send" id="crmsend" aria-label="Отправить">${CRM_ICO.send}</button>
      </div>
    </div>
  </div>`, 'card-sheet crm-sheet');

  $('#sx').onclick = closeSheet;
  // возврат: закрытие окна ведёт в воронку или туда, откуда открыли сделку
  const back = crmReturn || '#/crm';
  crmReturn = null;
  beforeClose = async () => { location.hash = back; };

  paint();
  const msgs = $('#crmmsgs');
  msgs.scrollTop = msgs.scrollHeight;

  // название: сохраняем при уходе из поля
  const t = $('#crmtitle');
  t.onblur = async () => {
    const v = t.textContent.replace(/\s+/g, ' ').trim();
    if (v === (d.title === 'Без названия' ? '' : d.title)) return;
    d.title = v || 'Без названия';
    try { await api(`/crm/deals/${d.id}`, {method: 'PATCH', body: {title: v}}); crmSaved(); } catch (e) { alert(e.message); }
  };
  t.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); t.blur(); } };

  $('#crmdel').onclick = async () => {
    if (!confirm('Удалить сделку?')) return;
    try { await api(`/crm/deals/${d.id}`, {method: 'DELETE'}); } catch (e) { alert(e.message); }
    beforeClose = null;
    location.hash = back;
    closeSheet();
  };

  // сообщения
  const ta = $('#crmmsg');
  const send = async () => {
    const text = ta.value.trim();
    if (!text) return;
    ta.value = '';
    try {
      const m = await api(`/crm/deals/${d.id}/messages`, {method: 'POST', body: {text}});
      d.messages.push(m);
      $('#crmmsgs').innerHTML = crmMsgsHtml(d.messages);
      $('#crmmsgs').scrollTop = $('#crmmsgs').scrollHeight;
    } catch (e) { alert(e.message); }
    ta.focus();
  };
  $('#crmsend').onclick = send;
  ta.onkeydown = e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } };
}

// подсказка «сохранено» в окне сделки
function crmSaved() {
  const s = $('#crmsaved');
  if (s) { s.textContent = 'Сохранено'; s.classList.remove('busy'); }
}

// «Имя Фамилия» → поля контакта
function crmSplitName(text) {
  const parts = String(text || '').trim().split(/\s+/);
  return {first_name: parts[0] || '', last_name: parts.slice(1).join(' ')};
}

const openContactCard = id => { location.hash = '#/crm/contact/' + id; };
const openCompanyCard = id => { location.hash = '#/crm/company/' + id; };

/* ---------- списки: контакты и компании ---------- */
async function crmContactsList() {
  crmShell('contacts', `<div class="crm-head">
      <div class="crm-sum">Контакты</div>
      <div class="crm-headr"><input class="crm-search" id="crmq" placeholder="Поиск контакта"><button class="crm-newbtn" id="crmnewc">${PLUS_ICON}<span>Добавить контакт</span></button></div>
    </div>
    <div class="crm-table" id="crmtable"></div>`);
  const paint = async () => {
    const q = $('#crmq').value.trim();
    const rows = await api('/crm/contacts?q=' + encodeURIComponent(q));
    $('#crmtable').innerHTML = `<div class="crm-row crm-row-h crm-cols-c"><div>Наименование</div><div>Компания</div><div>Телефон</div><div>Email</div></div>`
      + (rows.map(r => `<div class="crm-row crm-cols-c" data-go="#/crm/contact/${r.id}">
          <div class="crm-cell-n">${esc(r.name)}</div>
          <div class="crm-cell-m">${esc(r.companies.map(c => c.name).join(', '))}</div>
          <div class="crm-cell-m">${esc(r.phone || '')}</div>
          <div class="crm-cell-m">${esc(r.email || '')}</div></div>`).join('') || '<div class="empty">Контактов пока нет</div>');
    document.querySelectorAll('#crmtable [data-go]').forEach(el => el.onclick = () => { location.hash = el.dataset.go; });
  };
  $('#crmq').oninput = crmDebounce(paint, 200);
  $('#crmnewc').onclick = async () => {
    try { const c = await api('/crm/contacts', {method: 'POST', body: {}}); location.hash = '#/crm/contact/' + c.id; }
    catch (e) { alert(e.message); }
  };
  paint();
}

async function crmCompaniesList() {
  crmShell('companies', `<div class="crm-head">
      <div class="crm-sum">Компании</div>
      <div class="crm-headr"><input class="crm-search" id="crmq" placeholder="Поиск компании"><button class="crm-newbtn" id="crmnewk">${PLUS_ICON}<span>Добавить компанию</span></button></div>
    </div>
    <div class="crm-table" id="crmtable"></div>`);
  const paint = async () => {
    const q = $('#crmq').value.trim();
    const rows = await api('/crm/companies?q=' + encodeURIComponent(q));
    $('#crmtable').innerHTML = `<div class="crm-row crm-row-h crm-cols-k"><div>Наименование</div><div>Карточка компании</div></div>`
      + (rows.map(r => `<div class="crm-row crm-cols-k" data-go="#/crm/company/${r.id}">
          <div class="crm-cell-n">${esc(r.name)}</div>
          <div class="crm-cell-m">${r.card_url ? esc(r.card_url.replace(/^https?:\/\//, '')) : ''}</div></div>`).join('') || '<div class="empty">Компаний пока нет</div>');
    document.querySelectorAll('#crmtable [data-go]').forEach(el => el.onclick = () => { location.hash = el.dataset.go; });
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
      <div class="crm-grp-h ${cls}"><span>${title}</span><span>${money(sum)}</span></div>
      ${list.length ? list.map(d => `<div class="crm-drow" data-deal-go="${d.id}"><span class="crm-drow-t">${esc(d.title)}</span><span class="crm-drow-s">${money(d.amount)}</span></div>`).join('') : '<div class="crm-drow-empty">Нет сделок</div>'}
    </div>`;
  return block('Успешные', 'ok', g.won, g.sums.won)
    + block('Потерянные', 'lost', g.lost, g.sums.lost)
    + block('В работе', 'act', g.active, g.sums.active);
}

function crmBindDealGo() {
  document.querySelectorAll('[data-deal-go]').forEach(el => el.onclick = () => {
    crmReturn = location.hash;
    location.hash = '#/crm/deal/' + el.dataset.dealGo;
  });
}

/* ---------- карточка контакта ---------- */
async function crmContact(id) {
  const c = await api('/crm/contacts/' + id);
  const field = (label, key, placeholder = '') => `<div class="crm-prop"><div class="crm-pl"><span>${label}</span></div>
      <div class="crm-pv"><input class="crm-in crm-wide" data-f="${key}" value="${esc(c[key] || '')}" placeholder="${placeholder}"></div></div>`;
  crmShell('contacts', `<div class="crm-card">
      <button class="crm-back" data-go="#/crm/contacts">← Контакты</button>
      <div class="crm-card-t" id="crmname">${esc(c.name)}</div>
      <div class="crm-props">
        ${field('Имя', 'first_name')}${field('Фамилия', 'last_name')}${field('Отчество', 'middle_name')}
        ${field('Телефон', 'phone', '+7…')}${field('Почта', 'email', 'name@mail.ru')}${field('Телеграм', 'telegram', '@username')}
        ${field('Должность', 'position')}${field('Город', 'city')}
        <div class="crm-prop"><div class="crm-pl"><span>Компании</span></div>
          <div class="crm-pv crm-links" id="crmlk-companies">${crmEntChips('companies', c.companies)}<button class="crm-add-btn" data-add-companies="1">+ компанию</button></div></div>
      </div>
      <div class="crm-sec-t">Сделки</div>
      <div class="crm-groups">${crmDealGroups(c.deals)}</div>
    </div>`);
  document.querySelectorAll('[data-go]').forEach(el => el.onclick = () => { location.hash = el.dataset.go; });
  document.querySelectorAll('[data-f]').forEach(inp => inp.onchange = async () => {
    try {
      const upd = await api('/crm/contacts/' + id, {method: 'PATCH', body: {[inp.dataset.f]: inp.value}});
      if (['first_name', 'last_name'].includes(inp.dataset.f)) $('#crmname').textContent = upd.name;
    } catch (e) { alert(e.message); }
  });
  const relink = async ids => {
    try { await api('/crm/contacts/' + id, {method: 'PATCH', body: {company_ids: ids}}); crmContact(id); }
    catch (e) { alert(e.message); }
  };
  crmBindPicker($('#crmlk-companies'), 'companies',
    async (kid, name) => {
      if (kid == null) kid = (await api('/crm/companies', {method: 'POST', body: {name}})).id;
      relink([...c.companies.map(x => x.id), kid]);
    },
    kid => relink(c.companies.map(x => x.id).filter(x => x !== kid)),
    openCompanyCard,
    () => crmContact(id));
  crmBindDealGo();
}

/* ---------- карточка компании ---------- */
async function crmCompany(id) {
  const k = await api('/crm/companies/' + id);
  crmShell('companies', `<div class="crm-card">
      <button class="crm-back" data-go="#/crm/companies">← Компании</button>
      <div class="crm-card-t" id="crmname">${esc(k.name)}</div>
      <div class="crm-props">
        <div class="crm-prop"><div class="crm-pl"><span>Название</span></div>
          <div class="crm-pv"><input class="crm-in crm-wide" id="crmnm" value="${esc(k.name)}"></div></div>
        <div class="crm-prop"><div class="crm-pl"><span>Карточка компании</span></div>
          <div class="crm-pv crm-docs"><input class="crm-in crm-url" id="crmcu" placeholder="Ссылка на Google Диск" value="${esc(k.card_url || '')}">${k.card_url ? `<a class="crm-open" href="${esc(k.card_url)}" target="_blank" rel="noopener">Открыть</a>` : ''}</div></div>
        <div class="crm-prop"><div class="crm-pl"><span>Контакты</span></div>
          <div class="crm-pv crm-links" id="crmlk-contacts">${crmEntChips('contacts', k.contacts)}<button class="crm-add-btn" data-add-contacts="1">+ контакт</button></div></div>
      </div>
      <div class="crm-sec-t">Сделки</div>
      <div class="crm-groups">${crmDealGroups(k.deals)}</div>
    </div>`);
  document.querySelectorAll('[data-go]').forEach(el => el.onclick = () => { location.hash = el.dataset.go; });
  $('#crmnm').onchange = async () => {
    try { const u = await api('/crm/companies/' + id, {method: 'PATCH', body: {name: $('#crmnm').value}}); $('#crmname').textContent = u.name; }
    catch (e) { alert(e.message); }
  };
  $('#crmcu').onchange = async () => {
    try { await api('/crm/companies/' + id, {method: 'PATCH', body: {card_url: $('#crmcu').value}}); crmCompany(id); }
    catch (e) { alert(e.message); }
  };
  // контакт привязывается к компании через карточку контакта
  const relinkContact = async (cid, newName) => {
    try {
      if (cid == null) { const c = await api('/crm/contacts', {method: 'POST', body: crmSplitName(newName)}); cid = c.id; }
      const cur = await api('/crm/contacts/' + cid);
      await api('/crm/contacts/' + cid, {method: 'PATCH', body: {company_ids: [...cur.companies.map(x => x.id), id]}});
      crmCompany(id);
    } catch (e) { alert(e.message); }
  };
  const unlinkContact = async cid => {
    try {
      const cur = await api('/crm/contacts/' + cid);
      await api('/crm/contacts/' + cid, {method: 'PATCH', body: {company_ids: cur.companies.map(x => x.id).filter(x => x !== id)}});
      crmCompany(id);
    } catch (e) { alert(e.message); }
  };
  crmBindPicker($('#crmlk-contacts'), 'contacts', relinkContact, unlinkContact, openContactCard, () => crmCompany(id));
  crmBindDealGo();
}

/* ---------- маршруты CRM ---------- */
function crmRoute(parts) {
  const [sec, id] = parts;
  if (sec === 'contacts') return crmContactsList();
  if (sec === 'companies') return crmCompaniesList();
  if (sec === 'contact') return crmContact(+id);
  if (sec === 'company') return crmCompany(+id);
  if (sec === 'deal') {
    // воронка остаётся на фоне, окно сделки поверх
    return crmPipeline().then(() => crmOpenDeal(+id));
  }
  return crmPipeline();
}
