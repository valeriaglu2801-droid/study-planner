/* Deep Work таймер. Время считается по меткам (Date.now), а не по числу «тиков»,
   поэтому сворачивание приложения и блокировка экрана его не сбивают. */
(() => {
  const App = window.App;
  const { esc, icon, fmt } = App;
  const WORK = App.WORK_MS;
  const C = 2 * Math.PI * 96;
  const T = App.timer = {};
  const st = () => App.state.timer;

  /* ---------- состояние ---------- */
  T.info = () => {
    const t = st(), now = Date.now();
    if (!t || t.phase === 'idle') return { phase: 'idle' };
    if (t.phase === 'work') {
      const seg = t.endsAt - t.startedAt;
      return { phase: 'work', remaining: Math.max(0, t.endsAt - now), seg, elapsed: t.carriedMs + Math.min(now - t.startedAt, seg) };
    }
    if (t.phase === 'workdone') return { phase: 'workdone', remaining: 0, elapsed: t.finalMs };
    return { phase: 'break', remaining: Math.max(0, t.endsAt - now), seg: t.endsAt - t.startedAt };
  };

  const record = ms => {
    const t = st(), S = App.state;
    const s = { id: t.sessionId, subjectId: t.subjectId, blockId: t.blockId || null, date: App.dkey(new Date(t.firstStart)), start: t.firstStart, ms, counted: ms >= WORK };
    const i = S.sessions.findIndex(x => x.id === t.sessionId);
    if (i >= 0) S.sessions[i] = s; else S.sessions.push(s);
  };

  const finishWork = at => {
    const t = st(), ms = t.carriedMs + (at - t.startedAt);
    t.finalMs = ms; t.phase = 'workdone'; record(ms); App.save();
  };

  const openShortcut = () => {
    const s = App.state.settings;
    if (!s.runShortcut || !App.isIOS()) return;
    const a = document.createElement('a');
    a.href = 'shortcuts://run-shortcut?name=' + encodeURIComponent(s.shortcutName || 'Deep Work');
    document.body.appendChild(a); a.click(); a.remove();
  };

  T.start = (subjectId, blockId) => {
    const now = Date.now();
    App.state.timer = { phase: 'work', startedAt: now, endsAt: now + WORK, carriedMs: 0, firstStart: now, subjectId, blockId: blockId || null, sessionId: App.uid() };
    App.ui.timerSel = null;
    App.save(); App.render();
    openShortcut(); // сначала сохраняем таймер, потом уходим в «Команды»
  };

  T.extend = min => {
    const t = st(), now = Date.now(), ms = min * 60000;
    if (t.phase === 'work') { t.endsAt += ms; }
    else if (t.phase === 'workdone') { t.carriedMs = t.finalMs; t.startedAt = now; t.endsAt = now + ms; t.phase = 'work'; }
    else return;
    App.save(); App.render();
  };

  T.stop = () => {
    const t = st(); if (t.phase !== 'work') return;
    const now = Date.now(), ms = t.carriedMs + (now - t.startedAt);
    if (ms < 60000) { App.state.timer = { phase: 'idle' }; App.save(); App.render(); App.toast('Таймер отменён'); return; }
    finishWork(now); App.render();
  };

  T.startBreak = () => {
    const t = st(), now = Date.now();
    App.state.timer = { phase: 'break', startedAt: now, endsAt: now + App.state.settings.breakMin * 60000, subjectId: t.subjectId };
    App.save(); App.render();
  };
  T.reset = () => { App.state.timer = { phase: 'idle' }; App.save(); App.render(); };

  /* Переход состояний по времени. Возвращает true, если что-то поменялось. */
  T.reconcile = () => {
    const t = st(), now = Date.now(); if (!t) return false;
    if (t.phase === 'work' && now >= t.endsAt) {
      const recent = now - t.endsAt < 8000;
      finishWork(t.endsAt);
      if (recent && App.state.settings.sound) App.audio.chime();
      App.toast(t.finalMs >= WORK ? 'Блок завершён и засчитан' : 'Блок завершён');
      return true;
    }
    if (t.phase === 'break' && now >= t.endsAt) {
      const recent = now - t.endsAt < 8000;
      App.state.timer = { phase: 'idle' }; App.save();
      if (recent && App.state.settings.sound) App.audio.chime();
      App.toast('Перерыв окончен. Пора за следующий блок');
      return true;
    }
    return false;
  };

  /* ---------- отображение ---------- */
  const clock = ms => {
    const s = Math.ceil(ms / 1000), h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), r = s % 60;
    return h ? `${h}:${App.pad(m)}:${App.pad(r)}` : `${App.pad(m)}:${App.pad(r)}`;
  };
  const clockAt = ts => { const d = new Date(ts); return `${App.pad(d.getHours())}:${App.pad(d.getMinutes())}`; };

  T.paint = () => {
    const i = T.info(), arc = document.getElementById('ringArc'), tm = document.getElementById('tTime');
    if (!arc || !tm) return;
    if (i.phase === 'work' || i.phase === 'break') {
      tm.textContent = clock(i.remaining);
      arc.style.strokeDashoffset = C * (1 - Math.min(1, i.remaining / i.seg));
    }
  };

  T.pill = () => {
    const el = document.getElementById('timerPill'), i = T.info();
    const show = (i.phase === 'work' || i.phase === 'break') && App.ui.tab !== 'timer';
    el.hidden = !show; if (!show) return;
    el.className = 'timer-pill' + (i.phase === 'break' ? ' brk' : '');
    el.innerHTML = `${icon(i.phase === 'break' ? 'moon' : 'timer', 'sm')}<span>${i.phase === 'break' ? 'Перерыв' : 'Фокус'} ${clock(i.remaining)}</span>`;
  };

  T.suggest = () => {
    const k = App.todayKey(), now = App.nowMin();
    const nb = App.dayBlocks(k).filter(b => App.isStudyType(b.type) && !App.blockDone(b) && b.start + b.dur > now).sort((a, b) => a.start - b.start)[0];
    if (nb) return { subjectId: nb.type === 'english' ? 'eng' : nb.subjectId, blockId: nb.id, planned: nb };
    const last = App.state.sessions[App.state.sessions.length - 1];
    return { subjectId: (last && last.subjectId) || 'soc', blockId: null };
  };

  App.views.timer = () => {
    const i = T.info(), S = App.state, t = st();
    const k = App.todayKey(), done = App.doneUnits(k), min = App.minFor(k);
    const sel = App.ui.timerSel || (App.ui.timerSel = T.suggest());
    const subjId = i.phase === 'idle' ? sel.subjectId : t.subjectId;
    const sj = App.subj(subjId) || S.subjects[0];
    const ext = `<div class="row wrap" style="justify-content:center;gap:8px">${[10, 25, 50].map(m => `<button class="chip" data-act="tExtend" data-m="${m}">${icon('plus', 'sm')} ${m} мин</button>`).join('')}</div>`;

    let ring = '', ctl = '';
    if (i.phase === 'idle') {
      const planned = sel.planned ? `<div class="small muted" style="text-align:center">По плану: <b>${esc(App.blockTitle(sel.planned))}</b> в ${fmt(sel.planned.start)}</div>` : '';
      ring = ringHTML('idle', 'Deep Work', '50:00', 'минимум засчитывается за 50 минут', 0);
      ctl = `
        <div class="subjpick">${S.subjects.map(s => `<button class="chip ${s.id === subjId ? 'on' : ''}" style="--dc:${s.color}" data-act="tSubject" data-id="${s.id}"><span class="dot"></span>${esc(s.name)}</button>`).join('')}</div>
        ${planned}
        <button class="btn primary big" data-act="tStart">${icon('play')} Начать блок · 50 мин</button>
        <p class="small muted" style="text-align:center">${S.settings.runShortcut && App.isIOS() ? `Откроется команда «${esc(S.settings.shortcutName)}» (режим «Фокусирование»), потом пойдёт таймер.` : 'Таймер пойдёт сразу. Команду Фокусирования можно включить в «Ещё» → «Настройки».'}</p>`;
    } else if (i.phase === 'work') {
      ring = ringHTML('work', 'Фокус · ' + sj.name, clock(i.remaining), 'закончится в ' + clockAt(t.endsAt), C * (1 - i.remaining / i.seg));
      ctl = `<div class="small muted" style="text-align:center">Продлить можно сколько угодно. Всё сверх 50 минут тоже считается.</div>${ext}
        <button class="btn ghost block" data-act="tStop">${icon('stop', 'sm')} Завершить досрочно</button>`;
    } else if (i.phase === 'workdone') {
      const counted = t.finalMs >= WORK;
      ring = ringHTML('done pulse', counted ? 'Засчитано' : 'Не засчитано', App.dur(Math.round(t.finalMs / 60000)), sj.name, 0);
      ctl = `${counted ? '' : `<div class="note warn">${icon('info', 'sm')}<div>Блок короче 50 минут не идёт в прогресс. Продли его до 50 или начни новый.</div></div>`}
        <button class="btn primary big" data-act="tBreak">${icon('moon')} Перерыв ${S.settings.breakMin} мин</button>
        <div class="small muted" style="text-align:center">Или продли блок, если идёт хорошо:</div>${ext}
        <button class="btn ghost block" data-act="tReset">Закрыть без перерыва</button>`;
    } else {
      ring = ringHTML('brk', 'Перерыв', clock(i.remaining), 'отойди от экрана, попей воды', C * (1 - i.remaining / i.seg));
      ctl = `<button class="btn block" data-act="tReset">Пропустить перерыв</button>`;
    }

    const today = App.sessionsOn(k).slice().sort((a, b) => b.start - a.start);
    const pips = Array.from({ length: Math.max(min, done) }, (_, n) => `<span class="pip ${n < done ? 'done' : 'empty'}" style="--i:${n}">${n < done ? icon('check') : ''}</span>`).join('');
    const list = today.length ? today.map(s => {
      const x = App.subj(s.subjectId);
      return `<div class="sess"><span class="dot" style="--dc:${x ? x.color : '#999'}"></span><div class="grow">${esc(x ? x.name : '—')}</div><span class="muted small">${clockAt(s.start)} · ${App.dur(Math.round(s.ms / 60000))}</span>${s.counted ? `<span class="pill ok">${icon('check', 'sm')}</span>` : '<span class="pill warn">не засчитан</span>'}</div>`;
    }).join('') : '<div class="small muted">Пока ни одного блока. Первый — самый трудный, дальше легче.</div>';

    return `
    <header class="top"><div><div class="eyebrow">Deep Work</div><h1>Таймер</h1></div>
      <button class="iconbtn" data-act="openMore" aria-label="Ещё">${icon('sliders')}</button></header>
    <section class="card stack" style="padding-top:20px">${ring}${ctl}</section>
    <section class="card">
      <div class="row between"><h2>Блоки сегодня</h2><span class="pill ${done >= min ? 'ok' : ''}">${done} из ${min}</span></div>
      <div class="pips">${pips}</div>
      <div>${list}</div>
    </section>`;
  };

  function ringHTML(cls, phase, time, sub, offset) {
    return `<div class="ringwrap ${cls}"><svg class="ring" viewBox="0 0 220 220" aria-hidden="true">
      <circle class="trk" cx="110" cy="110" r="96"/>
      <circle id="ringArc" class="arc" cx="110" cy="110" r="96" transform="rotate(-90 110 110)" style="stroke-dasharray:${C};stroke-dashoffset:${offset}"/></svg>
      <div class="ringtxt"><div class="tphase">${esc(phase)}</div><div class="ttime" id="tTime">${esc(time)}</div><div class="tsub">${esc(sub)}</div></div></div>`;
  }

  Object.assign(App.actions, {
    tSubject: el => { App.ui.timerSel = { subjectId: el.dataset.id, blockId: null }; App.render(); },
    tStart: () => {
      App.audio.unlock();
      const sel = App.ui.timerSel || T.suggest();
      T.start(sel.subjectId, sel.blockId);
    },
    tExtend: el => T.extend(+el.dataset.m),
    tStop: () => {
      const i = T.info();
      if (i.elapsed < WORK && !confirm('Прошло меньше 50 минут. Такой блок не засчитается в прогресс. Завершить?')) return;
      T.stop();
    },
    tBreak: () => T.startBreak(),
    tReset: () => T.reset()
  });
})();
