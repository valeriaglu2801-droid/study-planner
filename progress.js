/* Прогресс: неделя, серия, графики */
(() => {
  const App = window.App;
  const { esc, icon, plural } = App;

  App.views.progress = () => {
    const S = App.state, today = App.todayKey();
    const off = App.ui.weekOffset;
    const mon = App.addDays(App.mondayOf(today), off * 7), sun = App.addDays(mon, 6);
    const norm = S.subjects.reduce((n, s) => n + s.norm, 0) * 50 * 60000;
    const rows = S.subjects.map(s => {
      const wk = App.weekMs(s.id, mon), target = s.norm * 50 * 60000, ts = App.topicStats(s);
      return { s, wk, target, ts, ratio: target ? wk / target : 1, total: App.totalMs(s.id) };
    });
    const weekTotal = rows.reduce((n, r) => n + r.wk, 0);
    const streak = App.streak(), best = App.bestStreak();
    const allMs = App.totalMs();

    /* итог недели */
    const lastDay = off === 0 ? today : sun;
    let daysMet = 0, daysCount = 0;
    for (let d = mon; d <= lastDay; d = App.addDays(d, 1)) { daysCount++; if (App.doneUnits(d) >= App.minFor(d)) daysMet++; }
    const weekOver = off < 0;
    const pct = norm ? weekTotal / norm : 0;
    const lag = rows.filter(r => r.target).sort((a, b) => a.ratio - b.ratio)[0];
    const top = rows.slice().sort((a, b) => b.wk - a.wk)[0];
    let verdict;
    if (pct >= 1) verdict = ['ok', 'Норма недели закрыта. Так держать.'];
    else if (pct >= 0.7) verdict = ['info', `Почти. Не хватило ${App.hours(norm - weekTotal)}${weekOver ? '. Следующую неделю начни сразу с плотного дня.' : '. Ещё можно добить в ближайшие дни.'}`];
    else if (weekTotal === 0) verdict = ['info', weekOver ? 'На этой неделе блоков не засчитано.' : 'Неделя ещё не началась по учёбе. Один блок прямо сейчас всё запустит.'];
    else verdict = ['warn', `Пока ${Math.round(pct * 100)}% нормы. Это не приговор, но ${weekOver ? 'следующей неделе нужна плотность: по одному дополнительному блоку в день' : 'сейчас лучше добавить по одному блоку в день, чтобы догнать'}.`];

    /* 14 дней */
    const days = Array.from({ length: 14 }, (_, i) => App.addDays(today, i - 13));
    const maxU = Math.max(6, ...days.map(d => App.doneUnits(d)), ...days.map(d => App.minFor(d)));
    const cols = days.map((d, i) => {
      const u = App.doneUnits(d), m = App.minFor(d), h = u ? Math.max(8, u / maxU * 100) : 0;
      return `<div class="c" title="${d}: ${u} из ${m}"><div class="m" style="bottom:${m / maxU * 100}%"></div><div class="b ${u >= m ? 'met' : u ? '' : 'zero'}" style="--h:${h}%;animation-delay:${i * 30}ms"></div></div>`;
    }).join('');
    const lbls = days.map(d => `<span class="${d === today ? 'today' : ''}">${App.parseKey(d).getDate()}</span>`).join('');

    const bars = rows.map(r => `<div class="hbar">
      <div class="meta"><b><span class="dot" style="--dc:${r.s.color}"></span>${esc(r.s.name)}</b><span class="muted small">${App.hours(r.wk)} из ${App.hours(r.target)}</span></div>
      <div class="bar" style="--bc:${r.s.color};--w:${Math.min(100, r.ratio * 100)}%"><i></i></div></div>`).join('');

    const topics = rows.map(r => `<div class="hbar">
      <div class="meta"><b><span class="dot" style="--dc:${r.s.color}"></span>${esc(r.s.name)}</b><span class="muted small">${r.ts.total ? `${r.ts.done} из ${r.ts.total} тем · ${r.ts.pct}%` : 'тем нет'} · всего ${App.hours(r.total)}</span></div>
      <div class="bar thin" style="--bc:var(--ok);--w:${r.ts.pct}%"><i></i></div></div>`).join('');

    const weekLabel = `${App.parseKey(mon).getDate()} ${App.MON[App.parseKey(mon).getMonth()]} – ${App.parseKey(sun).getDate()} ${App.MON[App.parseKey(sun).getMonth()]}`;

    return `
    <header class="top"><div><div class="eyebrow">Твой путь к экзаменам</div><h1>Прогресс</h1></div>
      <button class="iconbtn" data-act="openMore" aria-label="Ещё">${icon('sliders')}</button></header>

    <div class="stats">
      <div class="stat flame"><div class="lbl">Серия дней с минимумом</div><div class="val">${icon('flame')}${streak} <small>${plural(streak, ['день', 'дня', 'дней'])}</small></div><div class="tiny muted" style="margin-top:6px">рекорд: ${best}</div></div>
      <div class="stat"><div class="lbl">Всего часов учёбы</div><div class="val">${App.hours(allMs).replace(' ч', '')} <small>ч</small></div><div class="tiny muted" style="margin-top:6px">только засчитанные блоки</div></div>
    </div>

    <div class="row between"><div class="seg"><button class="${off === 0 ? 'on' : ''}" data-act="weekSet" data-o="0">Эта неделя</button><button class="${off === -1 ? 'on' : ''}" data-act="weekSet" data-o="-1">Прошлая</button></div><span class="small muted">${weekLabel}</span></div>

    <section class="card">
      <h2>Итог недели</h2>
      <div class="row between"><div class="big-num">${App.hours(weekTotal).replace(' ч', '')}<small style="font-size:16px;color:var(--ink3);font-weight:650"> ч из ${App.hours(norm).replace(' ч', '')}</small></div><span class="pill ${pct >= 1 ? 'ok' : pct >= .7 ? '' : 'warn'}">${Math.round(pct * 100)}%</span></div>
      <div class="bar" style="--w:${Math.min(100, pct * 100)}%"><i></i></div>
      <div class="note ${verdict[0]}">${icon(verdict[0] === 'ok' ? 'check' : 'info', 'sm')}<div>${verdict[1]}</div></div>
      <div class="small muted">Дней с выполненным минимумом: <b style="color:var(--ink)">${daysMet} из ${daysCount}</b>${weekTotal && top.wk ? ` · больше всего времени: <b style="color:var(--ink)">${esc(top.s.name)}</b>` : ''}${weekTotal && lag && lag.ratio < 0.5 ? ` · сильнее всего отстаёт: <b style="color:var(--ink)">${esc(lag.s.name)}</b>` : ''}</div>
    </section>

    <section class="card"><h2>Часы за неделю и норма</h2><div>${bars}</div></section>

    <section class="card">
      <div class="row between"><h2>Блоки по дням</h2><span class="tiny muted">пунктир — минимум</span></div>
      <div class="cols14">${cols}</div><div class="cols14-lbl">${lbls}</div>
    </section>

    <section class="card"><h2>Темы и всего часов</h2><div>${topics}</div></section>`;
  };

  App.actions.weekSet = el => { App.ui.weekOffset = +el.dataset.o; App.render(); };
})();
