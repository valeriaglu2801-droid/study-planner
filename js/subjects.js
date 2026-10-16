/* Предметы: экзамены, цели, нормы, темы */
(() => {
  const App = window.App;
  const { esc, icon, plural } = App;
  const STATUS = { none: 'не начато', learning: 'учу', done: 'выучено' };
  const NEXT = { none: 'learning', learning: 'done', done: 'none' };
  const $ = id => document.getElementById(id);

  const daysText = k => {
    const n = App.diffDays(App.todayKey(), k);
    if (n < 0) return 'экзамен прошёл';
    if (n === 0) return 'экзамен сегодня';
    return `${n} ${plural(n, ['день', 'дня', 'дней'])} до экзамена`;
  };
  const topicStats = s => {
    const total = s.topics.length, done = s.topics.filter(t => t.status === 'done').length;
    return { total, done, pct: total ? Math.round(done / total * 100) : 0 };
  };
  App.topicStats = topicStats;
  App.subjDaysText = daysText;
  const monday = () => App.mondayOf(App.todayKey());

  function list() {
    const S = App.state, mon = monday();
    const norm = S.subjects.reduce((n, s) => n + s.norm, 0);
    const nextExam = S.subjects.map(s => s.examDate).filter(d => d >= App.todayKey()).sort()[0];
    const cards = S.subjects.map(s => {
      const ts = topicStats(s), wk = App.weekMs(s.id, mon), target = s.norm * WORK_MIN * 60000;
      const pct = target ? Math.min(100, wk / target * 100) : 0;
      return `<button class="subj" data-act="openSubject" data-id="${s.id}" style="--dc:${s.color}">
        <div class="row between"><div class="row"><span class="dot" style="width:14px;height:14px"></span><h3>${esc(s.name)}</h3></div>${icon('right', 'sm')}</div>
        <div class="small muted" style="margin:4px 0 10px 24px">${daysText(s.examDate)} · ${App.dateLong(s.examDate)}</div>
        <div class="bar thin" style="--bc:${s.color};--w:${pct}%"><i></i></div>
        <div class="row between small muted" style="margin-top:6px"><span>на этой неделе ${App.hours(wk)} из ${App.hours(target)}</span><span>${ts.total ? `темы ${ts.done}/${ts.total}` : 'тем пока нет'}</span></div>
      </button>`;
    }).join('');
    return `
    <header class="top"><div><div class="eyebrow">Подготовка к экзаменам</div><h1>Предметы</h1></div>
      <button class="iconbtn" data-act="openMore" aria-label="Ещё">${icon('sliders')}</button></header>
    <section class="card">
      <div class="row between">
        <div><div class="small muted" style="font-weight:650">Ближайший экзамен</div><div class="big-num">${nextExam ? Math.max(0, App.diffDays(App.todayKey(), nextExam)) : '—'}<small style="font-size:16px;color:var(--ink3);font-weight:650"> ${nextExam ? plural(App.diffDays(App.todayKey(), nextExam), ['день', 'дня', 'дней']) : ''}</small></div></div>
        <div style="text-align:right"><div class="small muted" style="font-weight:650">Норма в неделю</div><div style="font-weight:800;font-size:20px">${norm} ${plural(norm, ['блок', 'блока', 'блоков'])}</div><div class="tiny muted">≈ ${App.hours(norm * WORK_MIN * 60000)}</div></div>
      </div>
    </section>
    <div>${cards}</div>`;
  }
  const WORK_MIN = 50;

  function detail(s) {
    const ts = topicStats(s), mon = monday(), wk = App.weekMs(s.id, mon), target = s.norm * WORK_MIN * 60000;
    const f = App.ui.topicFilter;
    const cnt = { all: s.topics.length, none: 0, learning: 0, done: 0 };
    s.topics.forEach(t => cnt[t.status]++);
    const shown = s.topics.filter(t => f === 'all' || t.status === f);
    const filters = [['all', 'Все'], ['none', 'Не начато'], ['learning', 'Учу'], ['done', 'Выучено']].map(([id, n]) => `<button class="chip ${f === id ? 'on' : ''}" data-act="topicFilter" data-f="${id}">${n} ${cnt[id]}</button>`).join('');
    const rows = shown.map(t => `<div class="topic st-${t.status}">
        <button class="stbtn ${t.status}" data-act="cycleTopic" data-id="${t.id}" aria-label="Статус темы: ${STATUS[t.status]}">${t.status === 'done' ? icon('check') : ''}${STATUS[t.status]}</button>
        <span class="tt" data-act="renameTopic" data-id="${t.id}">${esc(t.title)}</span>
        <button class="xbtn" data-act="delTopic" data-id="${t.id}" aria-label="Удалить тему">${icon('x', 'sm')}</button></div>`).join('');
    return `
    <header class="top">
      <button class="iconbtn" data-act="closeSubject" aria-label="Назад">${icon('left')}</button>
      <div class="grow"><div class="eyebrow" style="color:var(--ink2)">${daysText(s.examDate)}</div><h1 style="display:flex;align-items:center;gap:10px"><span class="dot" style="--dc:${s.color};width:16px;height:16px"></span>${esc(s.name)}</h1></div>
    </header>

    <section class="card">
      <label class="field"><span>Дата экзамена</span><input type="date" value="${s.examDate}" data-change="setExam"></label>
      <label class="field"><span>Цель</span><textarea data-change="setGoal" placeholder="Например: сдать на 90+, разобраться в темах 1–10" maxlength="300">${esc(s.goal)}</textarea></label>
      <div class="row between">
        <div><div style="font-weight:650">Норма в неделю</div><div class="small muted">блоков по 50 мин ≈ ${App.hours(s.norm * WORK_MIN * 60000)}</div></div>
        <div class="stepper"><button data-act="normDec" aria-label="Меньше">−</button><b>${s.norm}</b><button data-act="normInc" aria-label="Больше">+</button></div>
      </div>
      <div><div class="bar" style="--bc:${s.color};--w:${target ? Math.min(100, wk / target * 100) : 0}%"><i></i></div>
        <div class="small muted" style="margin-top:6px">На этой неделе: ${App.hours(wk)} из ${App.hours(target)}</div></div>
    </section>

    ${s.id === 'eng' ? `<button class="btn block" data-act="go" data-tab="english">${icon('chat', 'sm')} Открыть раздел «Английский»</button>` : ''}

    <section class="card">
      <div class="row between"><h2>Темы</h2><span class="pill ${ts.pct === 100 && ts.total ? 'ok' : ''}">${ts.done} из ${ts.total} · ${ts.pct}%</span></div>
      <div class="bar" style="--bc:var(--ok);--w:${ts.pct}%"><i></i></div>
      <form class="row" data-submit="addTopic"><input type="text" name="t" placeholder="Новая тема" autocomplete="off" enterkeyhint="done" style="flex:1"><button class="btn primary" style="padding:0 16px" aria-label="Добавить тему">${icon('plus')}</button></form>
      <button class="btn sm" data-act="pasteTopics">${icon('copy', 'sm')} Вставить список тем</button>
      ${s.topics.length ? `<div class="chips">${filters}</div>` : ''}
      <div>${rows || `<div class="empty">${s.topics.length ? 'В этом фильтре пусто.' : 'Тем пока нет. Добавь по одной или вставь весь список из программы экзамена.'}</div>`}</div>
    </section>`;
  }

  App.views.subjects = () => {
    const s = App.ui.subjectId && App.subj(App.ui.subjectId);
    return s ? detail(s) : list();
  };

  const cur = () => App.subj(App.ui.subjectId);
  const save = (re = true) => { App.save(); if (re) App.render(); };

  Object.assign(App.actions, {
    openSubject: el => { App.ui.subjectId = el.dataset.id; App.ui.topicFilter = 'all'; App.render(); window.scrollTo(0, 0); },
    closeSubject: () => { App.ui.subjectId = null; App.render(); },
    setExam: el => { if (el.value) { cur().examDate = el.value; save(); } },
    setGoal: el => { cur().goal = el.value.trim(); save(false); App.toast('Цель сохранена'); },
    normInc: () => { const s = cur(); s.norm = Math.min(20, s.norm + 1); save(); },
    normDec: () => { const s = cur(); s.norm = Math.max(0, s.norm - 1); save(); },
    topicFilter: el => { App.ui.topicFilter = el.dataset.f; App.render(); },
    cycleTopic: el => { const t = cur().topics.find(x => x.id === el.dataset.id); if (t) { t.status = NEXT[t.status]; save(); } },
    delTopic: el => { const s = cur(); s.topics = s.topics.filter(x => x.id !== el.dataset.id); save(); },
    renameTopic: el => {
      const t = cur().topics.find(x => x.id === el.dataset.id); if (!t) return;
      const n = prompt('Название темы', t.title);
      if (n && n.trim()) { t.title = n.trim(); save(); }
    },
    addTopic: form => {
      const v = form.elements.t.value.trim(); if (!v) return;
      cur().topics.push({ id: App.uid(), title: v, status: 'none' }); save();
      setTimeout(() => { const i = document.querySelector('form[data-submit="addTopic"] input'); if (i) i.focus(); }, 30);
    },
    pasteTopics: () => App.sheet(`
      <h2>Вставить список тем</h2>
      <p class="small muted">Каждая тема с новой строки. Номера и маркеры в начале строк я уберу сам.</p>
      <label class="field"><textarea id="ptText" style="min-height:180px" placeholder="1. Предмет социологии&#10;2. Классики социологии&#10;3. Социальная структура"></textarea></label>
      <button class="btn primary big" data-act="ptGo">Добавить темы</button>`, s => setTimeout(() => s.querySelector('#ptText').focus(), 250)),
    ptGo: () => {
      const lines = $('ptText').value.split(/\r?\n/).map(l => l.replace(/^\s*(?:\d+\s*[.)]|[-–—•*·])\s*/, '').trim()).filter(Boolean);
      if (!lines.length) return App.toast('Список пуст');
      const s = cur(), have = new Set(s.topics.map(t => t.title.toLowerCase()));
      let n = 0;
      lines.forEach(l => { if (!have.has(l.toLowerCase())) { s.topics.push({ id: App.uid(), title: l, status: 'none' }); have.add(l.toLowerCase()); n++; } });
      App.closeSheet(); save(); App.toast(`Добавлено тем: ${n}`);
    }
  });
})();
