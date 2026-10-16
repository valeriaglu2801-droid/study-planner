/* Экран «Сегодня»: план дня, шкала, быстрый ввод, шаблоны, .ics */
(() => {
  const App = window.App;
  const { esc, icon, fmt, plural, pad } = App;
  const PPM = 0.95; // пикселей на минуту
  const $ = id => document.getElementById(id);
  const val = id => $(id).value;

  /* ---------- раскладка пересекающихся блоков по колонкам ---------- */
  function lanes(bl) {
    const out = {}; let cluster = [], end = -1;
    const flush = () => {
      const ends = [];
      cluster.forEach(b => {
        let i = ends.findIndex(e => e <= b.start); if (i < 0) { i = ends.length; ends.push(0); }
        ends[i] = b.start + b.dur; out[b.id] = { lane: i };
      });
      cluster.forEach(b => { out[b.id].cols = ends.length; });
    };
    bl.forEach(b => { if (b.start >= end) { flush(); cluster = []; } cluster.push(b); end = Math.max(end, b.start + b.dur); });
    flush();
    return out;
  }

  function strip(blocks, T0) {
    const span = 1440 - T0;
    const segs = blocks.map((b, i) => `<i style="left:${(b.start - T0) / span * 100}%;width:${Math.max(b.dur / span * 100, 1)}%;background:var(--c-${b.type});box-shadow:inset 0 0 0 1.5px var(--k-${b.type});animation-delay:${i * 40}ms"></i>`).join('');
    return `<div class="strip">${segs}</div><div class="strip-lbl"><span>${fmt(T0)}</span><span>12:00</span><span>18:00</span><span>24:00</span></div>`;
  }

  function timeline(k, blocks, isToday) {
    const { wake, bed } = App.dayBounds(k);
    const minStart = blocks.length ? Math.min(...blocks.map(b => b.start)) : 1e9;
    const T0 = Math.floor(Math.min(360, minStart, wake) / 60) * 60;
    const H = (1440 - T0) * PPM;
    let hrs = '';
    for (let m = T0; m < 1440; m += 60) hrs += `<div class="hr" style="top:${(m - T0) * PPM}px"><span>${fmt(m)}</span></div>`;
    let sleep = '';
    if (wake > T0) sleep += `<div class="sleep" style="top:0;height:${(wake - T0) * PPM}px"></div>`;
    if (bed < 1440) sleep += `<div class="sleep" style="top:${(bed - T0) * PPM}px;height:${(1440 - bed) * PPM}px"></div>`;
    const ln = lanes(blocks);
    const items = blocks.map((b, i) => {
      const { lane, cols } = ln[b.id];
      const h = Math.max(b.dur * PPM, 26) - 2;
      const sj = b.type === 'study' && b.subjectId ? App.subj(b.subjectId) : (b.type === 'english' ? App.subj('eng') : null);
      const done = App.isStudyType(b.type) && App.blockDone(b);
      const short = h < 44;
      const time = `${fmt(b.start)}–${fmt(b.start + b.dur)}`;
      return `<button class="blk t-${b.type}${short ? ' short' : ''}${done ? ' done' : ''}" data-act="editBlock" data-id="${b.id}"
        style="top:${(b.start - T0) * PPM + 1}px;height:${h}px;left:calc(${lane / cols * 100}% + 3px);width:calc(${100 / cols}% - 6px);${sj ? `--sc:${sj.color};` : ''}animation-delay:${i * 35}ms">
        <b>${done ? icon('check') : ''}${esc(App.blockTitle(b))}</b><span>${time}${short ? '' : ' · ' + App.dur(b.dur)}</span></button>`;
    }).join('');
    const nowM = App.nowMin();
    const now = isToday && nowM >= T0 ? `<div class="now" style="top:${(nowM - T0) * PPM}px"></div>` : '';
    return { T0, html: `<div class="tl" style="height:${H}px">${sleep}${hrs}${items}${now}</div>` };
  }

  /* ---------- экран ---------- */
  App.views.today = () => {
    const k = App.ui.date || (App.ui.date = App.todayKey());
    const todayK = App.todayKey(), isToday = k === todayK, past = k < todayK;
    const blocks = App.dayBlocks(k).slice().sort((a, b) => a.start - b.start || a.dur - b.dur);
    const min = App.minFor(k), planned = App.plannedUnits(k), done = App.doneUnits(k);
    const total = Math.max(min, planned, done);
    let pips = '';
    for (let i = 0; i < total; i++) {
      const st = i < done ? 'done' : i < planned ? 'plan' : 'empty';
      pips += `<span class="pip ${st}" style="--i:${i}">${st === 'done' ? icon('check') : ''}</span>`;
    }
    let note = '';
    if (past) {
      note = done >= min ? `<div class="note ok">${icon('check', 'sm')}<div>Минимум дня был выполнен: ${done} из ${min}.</div></div>`
        : `<div class="note info">${icon('info', 'sm')}<div>В этот день засчитано ${done} из ${min} блоков.</div></div>`;
    } else if (isToday && done >= min) {
      note = `<div class="note ok">${icon('check', 'sm')}<div><b>Минимум дня выполнен.</b> Всё, что сверху, уже бонус.</div></div>`;
    } else if (planned < min) {
      const need = min - planned;
      note = `<div class="note warn">${icon('bell', 'sm')}<div><b>Пока ${planned} из ${min}.</b> Добавь ещё ${need} ${plural(need, ['учебный блок', 'учебных блока', 'учебных блоков'])}. Минимум держит весь остальной план. Хватит и самого лёгкого предмета.</div></div>`;
    } else {
      note = `<div class="note ok">${icon('check', 'sm')}<div>Минимум в плане. Осталось его выполнить.</div></div>`;
    }
    const shortOnes = blocks.filter(b => App.isStudyType(b.type) && b.dur < 50);
    const shortNote = shortOnes.length ? `<div class="note info">${icon('info', 'sm')}<div>Блок короче 50 минут не засчитывается в прогресс. Таких блоков: ${shortOnes.length}.</div></div>` : '';
    const sample = blocks.some(b => b.sample) ? `<div class="note info">${icon('spark', 'sm')}<div class="grow"><b>Это пример дня.</b> Посмотри, как всё выглядит, потом удали.<div style="margin-top:8px"><button class="btn sm" data-act="removeSample">Удалить пример</button></div></div></div>` : '';

    const tl = timeline(k, blocks, isToday);
    const typesUsed = App.TYPE_ORDER.map(t => `<span><i style="background:var(--c-${t})"></i>${App.TYPES[t].name}</span>`).join('');
    const eyebrow = isToday ? 'Сегодня' : past ? 'Прошедший день' : 'Другой день';

    const habits = App.state.habits.map(h => {
      const on = App.habitDone(h.id, k), st = App.habitStreak(h.id);
      return `<button class="habit" data-act="habitToggle" data-id="${h.id}" aria-pressed="${on}"><span class="check ${on ? 'on' : ''}">${icon('check')}</span><span class="grow">${esc(h.title)}</span>${st ? `<span class="pill ${on ? 'ok' : ''}">${icon('flame', 'sm')} ${st} ${plural(st, ['день', 'дня', 'дней'])}</span>` : ''}</button>`;
    }).join('');

    return `
    <header class="top">
      <div><div class="eyebrow">${eyebrow}</div><h1>${esc(App.dateLabel(k))}</h1></div>
      <button class="iconbtn" data-act="openMore" aria-label="Ещё: настройки и инструкция">${icon('sliders')}</button>
    </header>

    <div class="daynav">
      <button class="iconbtn" data-act="dayPrev" aria-label="Предыдущий день">${icon('left')}</button>
      <input type="date" value="${k}" data-change="pickDay" aria-label="Выбрать дату">
      <button class="iconbtn" data-act="dayNext" aria-label="Следующий день">${icon('right')}</button>
      ${isToday ? '' : '<button class="chip on" data-act="dayToday">Сегодня</button>'}
    </div>

    ${sample}

    <section class="card mincard">
      <div class="row between">
        <div>
          <div class="small muted" style="font-weight:650">Учебные блоки ${App.isWeekend(k) ? '(выходной)' : '(будни)'}</div>
          <div class="big">${planned}<small> / ${min}</small></div>
          <div class="tiny muted" style="margin-top:4px">запланировано / минимум</div>
        </div>
        <span class="pill ok">выполнено ${done}</span>
      </div>
      <div class="pips">${pips}</div>
      ${note}${shortNote}
    </section>

    <section class="card">
      <div class="row between"><h2>Каждый день</h2><button class="btn sm" data-act="habitsEdit">Изменить</button></div>
      <div class="small muted" style="margin-top:-4px">Задачи без времени: сделай в любой момент дня и отметь.</div>
      <div>${habits || '<div class="empty">Пока ничего нет. Нажми «Изменить» и добавь первую задачу.</div>'}</div>
    </section>

    <div class="actions">
      <button class="btn primary" data-act="addBlock">${icon('plus', 'sm')} Добавить блок</button>
      <button class="btn" data-act="quickPlan">${icon('spark', 'sm')} Быстрый ввод</button>
    </div>

    <section class="card tl-card">
      <div class="row between" style="padding:0 6px"><h2>План дня</h2><span class="small muted">${blocks.length ? blocks.length + ' ' + plural(blocks.length, ['блок', 'блока', 'блоков']) : ''}</span></div>
      ${blocks.length ? `<div style="padding:0 6px">${strip(blocks, tl.T0)}</div>` : ''}
      ${blocks.length ? '' : `<div class="empty">День пока пустой.<br>Добавь блоки или напиши список задач в «Быстром вводе», и они сами встанут в свободное время.</div>`}
      ${tl.html}
      <div class="legend" style="padding:0 6px">${typesUsed}</div>
    </section>

    <div class="actions">
      <button class="btn" data-act="tplSheet">${icon('copy', 'sm')} Шаблоны</button>
      <button class="btn" data-act="icsSheet">${icon('cal-plus', 'sm')} В Календарь</button>
      <button class="btn ghost full" data-act="clearDay" ${blocks.length ? '' : 'disabled'}>${icon('trash', 'sm')} Очистить день</button>
    </div>`;
  };

  /* ---------- навигация по дням ---------- */
  const setDate = k => { App.ui.date = k; App.render(); };
  Object.assign(App.actions, {
    dayPrev: () => setDate(App.addDays(App.ui.date, -1)),
    dayNext: () => setDate(App.addDays(App.ui.date, 1)),
    dayToday: () => setDate(App.todayKey()),
    pickDay: el => { if (el.value) setDate(el.value); },
    removeSample: () => { App.removeSample(); App.toast('Пример удалён'); App.render(); },
    clearDay: () => {
      if (!confirm('Убрать все блоки этого дня?')) return;
      App.setDayBlocks(App.ui.date, []); App.render();
    }
  });

  /* ---------- окно блока ---------- */
  // Окно работает либо с выбранным днём, либо с расписанием недели (App.ui.bsTarget)
  const tgt = () => App.ui.bsTarget || { kind: 'day' };
  const isWeek = () => tgt().kind === 'week';
  const getList = () => isWeek() ? (App.state.weekly[tgt().dow] || []) : App.dayBlocks(App.ui.date);
  const putList = list => {
    if (isWeek()) { App.state.weekly[tgt().dow] = list; App.weeklyChanged(); }
    else App.setDayBlocks(App.ui.date, list);
  };
  function lastSubject() {
    const s = App.state.sessions[App.state.sessions.length - 1];
    return s && s.subjectId !== 'eng' ? s.subjectId : 'soc';
  }

  function blockSheet(b, preset) {
    const k = App.ui.date, isNew = !b, wk = isWeek();
    const cur = b ? { ...b } : { type: (preset && preset.type) || 'study', dur: preset && preset.dur, subjectId: (preset && preset.subjectId) || lastSubject(), title: '' };
    if (!cur.dur) cur.dur = App.DEFAULT_DUR[cur.type];
    if (isNew) {
      const slot = wk ? null : App.findSlot(k, cur.dur, App.planFrom(k));
      cur.start = preset && preset.start != null ? preset.start : (slot != null ? slot : (wk ? 540 : App.dayBounds(k).wake));
    }
    App.ui.bs = { id: b ? b.id : null, type: cur.type, durTouched: !isNew };
    const subjOpts = App.state.subjects.filter(s => s.id !== 'eng').map(s => `<option value="${s.id}" ${cur.subjectId === s.id ? 'selected' : ''}>${esc(s.name)}</option>`).join('');
    const chips = App.TYPE_ORDER.map(t => `<button class="chip ${cur.type === t ? 'on' : ''}" data-act="bsType" data-type="${t}">${App.TYPES[t].name}</button>`).join('');
    const durChips = [25, 50, 90, 120, 150].map(m => `<button class="chip" data-act="bsDur" data-v="${m}">${m}</button>`).join('');
    const canStart = !wk && !isNew && App.isStudyType(cur.type) && k === App.todayKey();
    App.sheet(`
      <h2>${isNew ? 'Новый блок' : 'Блок'}${wk ? ' · ' + App.WD[tgt().dow].toLowerCase() + ', каждую неделю' : ''}</h2>
      <div class="chips" id="bsTypes">${chips}</div>
      <label class="field" id="bsSubjRow" ${cur.type === 'study' ? '' : 'hidden'}><span>Предмет</span><select id="bsSubj">${subjOpts}</select></label>
      <label class="field"><span>Название (необязательно)</span><input type="text" id="bsTitle" value="${esc(cur.title || '')}" placeholder="например: конспект, тема 5" maxlength="60"></label>
      <div class="cols2">
        <label class="field"><span>Начало</span><input type="time" id="bsStart" value="${fmt(Math.min(cur.start, 1439))}" step="300" data-input="bsHint"></label>
        <label class="field"><span>Длительность, мин</span><input type="number" id="bsDur" value="${cur.dur}" min="5" max="720" step="5" inputmode="numeric" data-input="bsHint"></label>
      </div>
      <div class="chips">${durChips}</div>
      <div id="bsHint" class="small muted"></div>
      <div class="btnrow">
        ${isNew ? '' : `<button class="btn danger" data-act="bsDelete" aria-label="Удалить блок">${icon('trash', 'sm')}</button>`}
        <button class="btn primary" data-act="bsSave" style="flex:3">Сохранить</button>
      </div>
      ${!wk && !isNew ? `<button class="btn block" data-act="bsRepeat">${icon('copy', 'sm')} Повторять каждую неделю</button>` : ''}
      ${canStart ? `<button class="btn block" data-act="startFromBlock" data-id="${b.id}">${icon('play', 'sm')} Начать этот блок на таймере</button>` : ''}
    `, () => updateHint());
  }

  function updateHint() {
    const el = $('bsHint'); if (!el || !$('bsStart')) return;
    const bs = App.ui.bs, start = App.toMin(val('bsStart') || '0:00'), dur = parseInt(val('bsDur'), 10) || 0;
    let t = dur ? `Закончится в ${fmt(Math.min(start + dur, 1440))}.` : '';
    if (start + dur > 1440) t += ' Блок обрежется по полуночи.';
    if (App.isStudyType(bs.type) && dur && dur < 50) t += ' Меньше 50 минут: в прогресс не засчитается.';
    const clash = getList().filter(b => b.id !== bs.id && start < b.start + b.dur && start + dur > b.start);
    if (clash.length) t += ` Пересекается с «${App.blockTitle(clash[0])}».`;
    el.textContent = t;
  }

  Object.assign(App.actions, {
    addBlock: () => { App.ui.bsTarget = null; blockSheet(null); },
    editBlock: el => { App.ui.bsTarget = null; const b = App.dayBlocks(App.ui.date).find(x => x.id === el.dataset.id); if (b) blockSheet(b); },
    bsType: el => {
      const bs = App.ui.bs; bs.type = el.dataset.type;
      document.querySelectorAll('#bsTypes .chip').forEach(c => c.classList.toggle('on', c.dataset.type === bs.type));
      $('bsSubjRow').hidden = bs.type !== 'study';
      if (!bs.durTouched) $('bsDur').value = App.DEFAULT_DUR[bs.type];
      updateHint();
    },
    bsDur: el => { App.ui.bs.durTouched = true; $('bsDur').value = el.dataset.v; updateHint(); },
    bsHint: () => { App.ui.bs.durTouched = true; updateHint(); },
    bsSave: () => {
      const bs = App.ui.bs, k = App.ui.date;
      if (!val('bsStart')) return App.toast('Укажи время начала');
      const start = App.toMin(val('bsStart'));
      let dur = parseInt(val('bsDur'), 10);
      if (!dur || dur < 5) return App.toast('Длительность — от 5 минут');
      if (start + dur > 1440) dur = 1440 - start;
      if (dur < 5) return App.toast('Блок не помещается в сутки');
      const data = {
        type: bs.type, start, dur, title: val('bsTitle').trim(),
        subjectId: bs.type === 'study' ? val('bsSubj') : bs.type === 'english' ? 'eng' : null
      };
      const blocks = getList().slice();
      if (bs.id) { const i = blocks.findIndex(b => b.id === bs.id); if (i >= 0) Object.assign(blocks[i], data); }
      else blocks.push({ id: App.uid(), ...data });
      putList(blocks); App.closeSheet(); App.render();
    },
    bsDelete: () => {
      const id = App.ui.bs.id;
      putList(getList().filter(b => b.id !== id)); App.closeSheet(); App.render();
    },
    bsRepeat: () => {
      const b = App.dayBlocks(App.ui.date).find(x => x.id === App.ui.bs.id); if (!b) return;
      if (App.state.days[App.ui.date].auto) return App.toast('Этот блок уже взят из расписания недели');
      const dow = App.parseKey(App.ui.date).getDay(), list = (App.state.weekly[dow] || []).slice();
      list.push({ id: App.uid(), type: b.type, subjectId: b.subjectId, title: b.title, start: b.start, dur: b.dur });
      App.state.weekly[dow] = list; App.weeklyChanged();
      App.closeSheet(); App.render();
      App.toast('Блок добавлен в расписание: теперь он будет каждую неделю в этот день');
    },
    startFromBlock: el => {
      const b = App.dayBlocks(App.ui.date).find(x => x.id === el.dataset.id); if (!b) return;
      App.ui.timerSel = { subjectId: b.type === 'english' ? 'eng' : b.subjectId, blockId: b.id };
      App.closeSheet(); App.go('timer');
    }
  });

  App.blockSheet = blockSheet;

  /* ---------- ежедневные задачи ---------- */
  const habitSheet = () => {
    const rows = App.state.habits.map(h => `<div class="li"><div class="grow">${esc(h.title)}</div><button class="xbtn" data-act="habitDel" data-id="${h.id}" aria-label="Удалить задачу">${icon('trash', 'sm')}</button></div>`).join('');
    App.sheet(`
      <h2>Задачи на каждый день</h2>
      <p class="small muted">Это дела без времени: сделала в любой момент и отметила. Серия считает дни подряд.</p>
      <div class="list">${rows || '<div class="small muted">Список пуст.</div>'}</div>
      <form class="row" data-submit="habitAdd"><input type="text" name="t" placeholder="Например: чтение 20 минут" maxlength="60" autocomplete="off" style="flex:1"><button class="btn primary" style="padding:0 16px" aria-label="Добавить">${icon('plus')}</button></form>
      <button class="btn block" data-act="closeSheet">Готово</button>`);
  };
  Object.assign(App.actions, {
    habitToggle: el => {
      const k = App.ui.date, L = App.state.habitLog;
      L[k] = L[k] || {}; if (L[k][el.dataset.id]) delete L[k][el.dataset.id]; else L[k][el.dataset.id] = true;
      App.save(); App.render();
    },
    habitsEdit: () => habitSheet(),
    habitAdd: form => {
      const v = form.elements.t.value.trim(); if (!v) return;
      App.state.habits.push({ id: App.uid(), title: v }); App.save(); habitSheet(); App.render();
      setTimeout(() => { const i = document.querySelector('form[data-submit="habitAdd"] input'); if (i) i.focus(); }, 30);
    },
    habitDel: el => {
      if (!confirm('Удалить эту задачу? Отметки по ней тоже исчезнут.')) return;
      App.state.habits = App.state.habits.filter(h => h.id !== el.dataset.id); App.save(); habitSheet(); App.render();
    }
  });

  /* ---------- быстрый ввод ---------- */
  const ALIASES = { soc: ['соц'], pol: ['полит'], phil: ['филос'], math: ['матем', 'матан', 'алгебр', 'геометр'], ukr: ['укр'], eng: ['англ', 'english', 'eng'] };
  const matchSubject = w => { w = w.toLowerCase(); return Object.keys(ALIASES).find(id => ALIASES[id].some(a => w.startsWith(a))) || null; };

  function parseLine(raw) {
    let s = raw.trim().replace(/^[\-–—•*·]+\s*/, '');
    if (!s) return null;
    let count = 1, dur = null, m;
    if ((m = s.match(/(\d+)\s*[x×*хХ]\s*(\d+)/iu))) { count = Math.min(+m[1], 8); dur = +m[2]; s = s.replace(m[0], ' '); }
    else if ((m = s.match(/(\d+(?:[.,]\d+)?)\s*(?:часа|часов|час|ч|h)(?![\p{L}])(?:\s*(\d+)\s*(?:минут\p{L}*|мин|м)?)?/iu))) {
      dur = Math.round(parseFloat(m[1].replace(',', '.')) * 60 + (m[2] ? +m[2] : 0)); s = s.replace(m[0], ' ');
    } else if ((m = s.match(/(\d+)\s*(?:минут\p{L}*|мин|м|min)?(?![\p{L}\d])/iu))) { dur = +m[1]; s = s.replace(m[0], ' '); }
    const name = s.replace(/[,:;]+/g, ' ').replace(/\s+/g, ' ').trim();
    if (!name && !dur) return null;
    const t = name.toLowerCase(), words = name.split(' ').filter(Boolean), first = (words[0] || '').toLowerCase();
    let type = 'custom', subjectId = null, title = name;
    const sid = matchSubject(first);
    if (sid) { type = sid === 'eng' ? 'english' : 'study'; subjectId = sid; title = words.slice(1).join(' '); }
    else if (/^(зал|трен|gym|спорт|фитнес)/.test(first)) { type = 'gym'; title = ''; }
    else if (/^(пара|пары|лекц|семинар|урок)/.test(first)) { type = 'class'; title = name; }
    else if (/(отдых|прогул|тикток|tiktok|кино|сериал|безделье|релакс|перерыв|обед|ужин|завтрак)/.test(t)) { type = 'rest'; title = name; }
    if (!dur) dur = App.DEFAULT_DUR[type];
    dur = Math.max(5, Math.min(dur, 720));
    return { type, subjectId, title, dur, count };
  }
  const parseQuick = text => text.split(/\n|;/).map(parseLine).filter(Boolean);

  function previewHTML(items) {
    if (!items.length) return '<div class="small muted">Пример: «Социология 100», «математика 2x50», «английский», «прогулка 30», «зал 2ч».</div>';
    return `<div class="list">${items.map(it => `<div class="li"><span class="pill" style="background:var(--c-${it.type});color:var(--k-${it.type})">${App.TYPES[it.type].name}</span><div class="grow">${esc(it.type === 'study' ? App.subj(it.subjectId).name + (it.title ? ' · ' + it.title : '') : it.type === 'english' ? 'Английский' + (it.title ? ' · ' + it.title : '') : it.title || App.TYPES[it.type].name)}</div><b class="nowrap">${it.count > 1 ? it.count + ' × ' : ''}${it.dur} м</b></div>`).join('')}</div>`;
  }

  App.actions.quickPlan = () => {
    const k = App.ui.date, from = App.planFrom(k);
    App.sheet(`
      <h2>Быстрый ввод</h2>
      <p class="small muted">Напиши задачи по одной в строке и длительность. Я расставлю их по свободному времени, между блоками оставлю 10 минут, а уже вписанные пары и зал обойду.</p>
      <label class="field"><span>Задачи</span><textarea id="qpText" data-input="qpPreview" placeholder="Социология 100&#10;Математика 2x50&#10;Английский&#10;Прогулка 30" autocapitalize="sentences"></textarea></label>
      <label class="field"><span>Начинать расстановку с</span><input type="time" id="qpStart" value="${fmt(Math.min(Math.ceil(from / 5) * 5, 1439))}" step="300"></label>
      <div id="qpPrev">${previewHTML([])}</div>
      <button class="btn primary big" data-act="qpGo">Расставить по дню</button>
    `, s => { const t = s.querySelector('#qpText'); setTimeout(() => t.focus(), 250); });
  };
  App.actions.qpPreview = () => { $('qpPrev').innerHTML = previewHTML(parseQuick(val('qpText'))); };
  App.actions.qpGo = () => {
    const items = parseQuick(val('qpText'));
    if (!items.length) return App.toast('Напиши хотя бы одну задачу');
    const k = App.ui.date; let cursor = App.toMin(val('qpStart') || '08:00');
    const placed = [], lost = [];
    items.forEach(it => {
      for (let c = 0; c < it.count; c++) {
        const slot = App.findSlot(k, it.dur, cursor, placed);
        if (slot == null) { lost.push(it); continue; }
        placed.push({ id: App.uid(), type: it.type, subjectId: it.subjectId, title: it.title, start: slot, dur: it.dur });
        cursor = slot + it.dur;
      }
    });
    App.setDayBlocks(k, App.dayBlocks(k).concat(placed));
    App.closeSheet(); App.render();
    App.toast(lost.length ? `Расставлено: ${placed.length}. Не поместилось: ${lost.length}. Освободи время или продли день.` : `Готово: расставлено ${placed.length}`);
  };

  /* ---------- шаблоны ---------- */
  App.actions.tplSheet = () => {
    const k = App.ui.date, T = App.state.templates;
    const list = T.length ? T.map(t => `
      <div class="li">
        <div class="grow"><b>${esc(t.name)}</b><div class="tiny muted">${t.blocks.length} ${plural(t.blocks.length, ['блок', 'блока', 'блоков'])}</div></div>
        <button class="btn sm" data-act="tplApply" data-id="${t.id}" data-mode="add">Добавить</button>
        <button class="btn sm primary" data-act="tplApply" data-id="${t.id}" data-mode="replace">Заменить</button>
        <button class="xbtn" data-act="tplDel" data-id="${t.id}" aria-label="Удалить шаблон">${icon('x', 'sm')}</button>
      </div>`).join('') : '<div class="small muted">Шаблонов пока нет. Собери хороший день и сохрани его ниже.</div>';
    App.sheet(`
      <h2>Шаблоны дней</h2>
      <label class="field"><span>Применить к дню</span><input type="date" id="tplDate" value="${k}"></label>
      <div class="list">${list}</div>
      <div class="note info">${icon('info', 'sm')}<div>«Добавить» докладывает блоки к тому, что уже есть. «Заменить» сначала очищает день.</div></div>
      <label class="field"><span>Сохранить день ${esc(App.dateLabel(k))} как шаблон</span><input type="text" id="tplName" placeholder="Название, например: Будний с залом" maxlength="40"></label>
      <button class="btn primary block" data-act="tplSave" ${App.dayBlocks(k).length ? '' : 'disabled'}>Сохранить шаблон</button>
    `);
  };
  App.actions.tplSave = () => {
    const name = val('tplName').trim() || 'Шаблон ' + (App.state.templates.length + 1);
    const blocks = App.dayBlocks(App.ui.date).map(b => ({ type: b.type, subjectId: b.subjectId, title: b.title, start: b.start, dur: b.dur }));
    App.state.templates.push({ id: App.uid(), name, blocks }); App.save();
    App.toast('Шаблон сохранён'); App.actions.tplSheet();
  };
  App.actions.tplApply = el => {
    const t = App.state.templates.find(x => x.id === el.dataset.id); if (!t) return;
    const k = val('tplDate') || App.ui.date;
    const nb = t.blocks.map(b => ({ id: App.uid(), ...b }));
    App.setDayBlocks(k, el.dataset.mode === 'replace' ? nb : App.dayBlocks(k).concat(nb));
    App.ui.date = k; App.closeSheet(); App.render(); App.toast(`Шаблон применён к дню ${App.dateLabel(k)}`);
  };
  App.actions.tplDel = el => {
    if (!confirm('Удалить шаблон?')) return;
    App.state.templates = App.state.templates.filter(t => t.id !== el.dataset.id); App.save(); App.actions.tplSheet();
  };

  /* ---------- календарь (.ics) ---------- */
  const icsEsc = s => String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
  function fold(line) {
    const enc = new TextEncoder(); if (enc.encode(line).length <= 75) return line;
    let out = '', cur = '', bytes = 0, max = 75;
    for (const ch of line) {
      const n = enc.encode(ch).length;
      if (bytes + n > max) { out += cur + '\r\n '; cur = ''; bytes = 0; max = 74; }
      cur += ch; bytes += n;
    }
    return out + cur;
  }
  const local = (k, min) => {
    const d = App.parseKey(k); d.setMinutes(min);
    return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
  };

  App.buildICS = (k, endAlerts) => {
    const L = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Uchoba//RU', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'X-WR-CALNAME:Учёба'];
    const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const alarm = (text, trigger) => ['BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:' + icsEsc(text), 'TRIGGER:' + trigger, 'END:VALARM'];
    let events = 0;
    App.dayBlocks(k).slice().sort((a, b) => a.start - b.start).forEach(b => {
      const title = App.blockTitle(b), end = b.start + b.dur;
      const ev = ['BEGIN:VEVENT', `UID:${b.id}-${k}@uchoba.app`, `DTSTAMP:${stamp}`, `DTSTART:${local(k, b.start)}`, `DTEND:${local(k, end)}`,
        'SUMMARY:' + icsEsc(title), 'DESCRIPTION:' + icsEsc(App.TYPES[b.type].name + ' · ' + App.dur(b.dur)), 'STATUS:CONFIRMED'];
      if (b.type === 'study' || b.type === 'english' || b.type === 'rest' || b.type === 'custom') ev.push(...alarm('Начало: ' + title, 'PT0S'));
      else if (b.type === 'class') ev.push(...alarm('Скоро пара', '-PT10M'));
      ev.push('END:VEVENT'); L.push(...ev); events++;
      if (endAlerts && (b.type === 'study' || b.type === 'english' || b.type === 'rest')) {
        L.push('BEGIN:VEVENT', `UID:${b.id}-${k}-end@uchoba.app`, `DTSTAMP:${stamp}`, `DTSTART:${local(k, end)}`, `DTEND:${local(k, end + 5)}`,
          'SUMMARY:' + icsEsc('Конец: ' + title), 'TRANSP:TRANSPARENT', ...alarm('Конец блока: ' + title, 'PT0S'), 'END:VEVENT');
      }
    });
    L.push('END:VCALENDAR');
    return { text: L.map(fold).join('\r\n') + '\r\n', events };
  };

  const icsFile = k => {
    const { text, events } = App.buildICS(k, App.state.settings.endAlerts);
    return { events, blob: new Blob([text], { type: 'text/calendar;charset=utf-8' }), name: `uchoba-${k}.ics` };
  };

  App.actions.icsSheet = () => {
    const k = App.ui.date, n = App.dayBlocks(k).length;
    App.sheet(`
      <h2>День в Календарь iPhone</h2>
      <p class="muted">Блоки дня ${esc(App.dateLabel(k))} (${n}) превратятся в события. Оповещения придут на начало и конец учебных блоков и отдыха, перед парой за 10 минут. Для зала оповещений нет.</p>
      <label class="switch"><span>Отдельное напоминание о конце блока<div class="tiny muted">В календаре появится короткое событие «Конец: …» на 5 минут. Так оповещение надёжнее всего доходит на iPhone.</div></span>
        <input type="checkbox" data-change="icsEnd" ${App.state.settings.endAlerts ? 'checked' : ''}></label>
      <button class="btn primary big" data-act="icsShare" ${n ? '' : 'disabled'}>${icon('cal-plus')} Отправить в Календарь</button>
      <button class="btn ghost block" data-act="icsDownload" ${n ? '' : 'disabled'}>Просто скачать файл .ics</button>
      <div class="small muted">Откроется меню «Поделиться»: выбери «Календарь» или «Сохранить в Файлы», затем открой файл и нажми «Добавить все». Подробнее в разделе «Как настроить».</div>
    `);
  };
  App.actions.icsEnd = el => { App.state.settings.endAlerts = el.checked; App.save(); };
  App.actions.icsShare = async () => {
    const f = icsFile(App.ui.date);
    const r = await App.shareFile(f.blob, f.name, 'text/calendar');
    if (r === 'download') App.toast('Файл скачан. Открой его, чтобы добавить события в Календарь');
  };
  App.actions.icsDownload = async () => {
    const f = icsFile(App.ui.date);
    await App.shareFile(f.blob, f.name, 'text/calendar', false);
    App.toast('Файл скачан');
  };

  /* ---------- вспомогательное для других экранов ---------- */
  App.addBlockToday = (b) => {
    const k = App.todayKey(), slot = App.findSlot(k, b.dur, App.planFrom(k));
    if (slot == null) return false;
    App.setDayBlocks(k, App.dayBlocks(k).concat({ id: App.uid(), ...b, start: slot }));
    return true;
  };
})();
