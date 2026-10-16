/* Английский: ротация навыков, идеи для A2→B1, мини-словарик, карточки */
(() => {
  const App = window.App;
  const { esc, icon, plural } = App;
  const $ = id => document.getElementById(id);

  const SKILLS = {
    vocab: { name: 'Словарь', short: 'Слова', ideas: [
      'Выбери тему (еда, транспорт, здоровье, работа) и выпиши 15–20 слов с переводом в словарик ниже.',
      'Пройди карточками слова, которые ещё не запомнила: 10 минут, потом ещё раз только ошибки.',
      'Составь по одному предложению с каждым из 8 новых слов. Скажи вслух и запиши.',
      'Выучи 5 фразовых глаголов (get up, look for, turn on, give up, find out) и придумай по предложению к каждому.',
      'Найди антонимы и синонимы к 10 прилагательным (big, happy, easy…) и запиши пары.',
      'Запоминай слова целыми словосочетаниями: depend on, interested in, good at, afraid of.'
    ] },
    grammar: { name: 'Грамматика', short: 'Грамм.', ideas: [
      'Present Simple и Present Continuous: сделай 10 упражнений, потом напиши 5 своих предложений о сегодняшнем дне.',
      'Past Simple: таблица из 15 глаголов (правильные и неправильные) и 5 предложений о вчерашнем дне.',
      'Артикли a / an / the и some / any / much / many: упражнения, потом разбор своих ошибок.',
      'Сравнительная и превосходная степень: опиши 5 пар предметов (bigger than, the most expensive…).',
      'Модальные can / must / should / have to: 8 предложений о правилах в твоей жизни.',
      'Present Perfect (ever, never, already, yet): задай себе 10 вопросов и ответь письменно.',
      'First conditional (If it rains, I will…): 6 предложений про ближайшую неделю.'
    ] },
    listen: { name: 'Аудирование', short: 'Слух', ideas: [
      'Послушай выпуск для уровня A2–B1 (например, 6 Minute English от BBC): сначала с субтитрами, потом без.',
      'Диктант: включи короткий фрагмент, ставь на паузу после каждой фразы и записывай. Проверь по тексту.',
      'Шэдоуинг: повторяй за диктором фразу за фразой с той же интонацией, 10 минут.',
      'Выбери песню на английском, найди текст и заполни пропуски на слух.',
      'Короткое видео на YouTube с английскими субтитрами: выпиши 5 новых слов и добавь в словарик.',
      'Послушай диалог дважды: первый раз на общий смысл, второй на детали. Запиши 3 факта.'
    ] },
    speak: { name: 'Говорение', short: 'Речь', ideas: [
      'Запиши голосовое на 2 минуты о своём дне, послушай и найди 3 ошибки или паузы.',
      'Открой любое фото и скажи 10 предложений о том, что на нём.',
      'Ответь вслух на 5 вопросов: What did you do yesterday? What is your favourite food? What are your plans for the weekend?',
      'Разыграй диалог в кафе, магазине или у врача: обе роли сама.',
      'Сделай 5 мини-рассказов по 30 секунд: моя семья, мой город, моё хобби, моя учёба, моя мечта.',
      'Прочитай вслух короткий текст, запиши себя и проверь произношение трудных слов.'
    ] }
  };
  const PLAN = { 1: ['vocab'], 2: ['grammar'], 3: ['listen'], 4: ['speak'], 5: ['vocab', 'grammar'], 6: ['listen', 'speak'], 0: [] };
  const planLabel = d => PLAN[d].length ? PLAN[d].map(s => SKILLS[s].name).join(' + ') : 'выходной';

  const pick = (arr, seed, n) => Array.from({ length: n }, (_, i) => arr[(seed + i) % arr.length]);
  const seedOf = k => { const d = App.parseKey(k); return Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 864e5) + d.getFullYear(); };
  const engDone = k => App.sessionsOn(k).some(s => s.subjectId === 'eng' && s.counted);

  App.views.english = () => {
    const S = App.state, k = App.todayKey(), dow = App.parseKey(k).getDay(), skills = PLAN[dow];
    const seed = seedOf(k);
    const perSkill = skills.length > 1 ? 2 : 3;
    const timeSplit = skills.length > 1 ? ` · по ${50 / skills.length} мин` : ' · 50 мин';

    let today;
    if (!skills.length) {
      today = `<section class="card skillcard"><div class="eyebrow" style="color:var(--k-english)">Сегодня · воскресенье</div><h2>Выходной от английского</h2>
        <p>Отдыхай. Если захочется чего-то лёгкого, послушай английскую песню или посмотри серию с субтитрами 15 минут. Это необязательно.</p></section>`;
    } else {
      const blocks = skills.map(sk => `<div class="stack"><h3>${SKILLS[sk].name}</h3>${pick(SKILLS[sk].ideas, seed, perSkill).map((t, i) => `<div class="idea"><span class="n">${i + 1}</span><div>${esc(t)}</div></div>`).join('')}</div>`).join('<hr style="border:0;border-top:1px solid rgba(0,0,0,.08);margin:14px 0">');
      today = `<section class="card skillcard">
        <div class="row between"><div><div class="eyebrow" style="color:var(--k-english)">Сегодня · ${App.WD[dow].toLowerCase()}</div><h2>${planLabel(dow)}</h2><div class="small muted" style="margin-top:2px">${timeSplit.replace(' · ', '')}</div></div>${engDone(k) ? `<span class="pill ok">${icon('check', 'sm')} сделано</span>` : ''}</div>
        ${blocks}
        <div class="actions"><button class="btn primary" data-act="engStart">${icon('play', 'sm')} Начать 50 мин</button><button class="btn" data-act="engPlan">${icon('plus', 'sm')} В план дня</button></div>
      </section>`;
    }

    const mon = App.mondayOf(k);
    const week = Array.from({ length: 7 }, (_, i) => {
      const dk = App.addDays(mon, i), d = App.parseKey(dk).getDay();
      return `<div class="wd ${dk === k ? 'today' : ''}">${engDone(dk) ? `<span class="tick">${icon('check')}</span>` : ''}<b>${App.WDS[d]}</b>${PLAN[d].length ? PLAN[d].map(s => SKILLS[s].short).join('<br>') : 'отдых'}</div>`;
    }).join('');
    const wk = App.weekMs('eng', mon), subj = App.subj('eng'), target = subj.norm * 50 * 60000;

    const W = S.english.words, f = App.ui.wordFilter;
    const learned = W.filter(w => w.learned).length;
    const shown = W.filter(w => f === 'all' || (f === 'learned' ? w.learned : !w.learned)).slice().reverse();
    const rows = shown.map(w => `<div class="word ${w.learned ? 'learned' : ''}">
      <button class="check ${w.learned ? 'on' : ''}" data-act="wordToggle" data-id="${w.id}" aria-label="${w.learned ? 'Вернуть в изучаемые' : 'Отметить: запомнила'}">${icon('check')}</button>
      <div class="w"><b>${esc(w.en)}</b><span class="muted small">${esc(w.ru)}</span></div>
      <button class="xbtn" data-act="wordDel" data-id="${w.id}" aria-label="Удалить слово">${icon('x', 'sm')}</button></div>`).join('');
    const fchips = [['all', 'Все', W.length], ['new', 'Учу', W.length - learned], ['learned', 'Запомнила', learned]].map(([id, n, c]) => `<button class="chip ${f === id ? 'on' : ''}" data-act="wordFilter" data-f="${id}">${n} ${c}</button>`).join('');

    return `
    <header class="top"><div><div class="eyebrow">Уровень A2 → B1</div><h1>Английский</h1></div>
      <button class="iconbtn" data-act="openMore" aria-label="Ещё">${icon('sliders')}</button></header>
    ${today}
    <section class="card">
      <h2>Неделя английского</h2>
      <div class="weekrow">${week}</div>
      <div><div class="bar" style="--bc:${subj.color};--w:${target ? Math.min(100, wk / target * 100) : 0}%"><i></i></div>
        <div class="small muted" style="margin-top:6px">На этой неделе ${App.hours(wk)} из ${App.hours(target)}</div></div>
    </section>
    <section class="card">
      <div class="row between"><h2>Мини-словарик</h2><span class="pill ${learned ? 'ok' : ''}">запомнила ${learned} из ${W.length}</span></div>
      <form class="stack" data-submit="addWord">
        <div class="cols2"><input type="text" name="en" placeholder="Слово" autocomplete="off" autocapitalize="none" autocorrect="off"><input type="text" name="ru" placeholder="Перевод" autocomplete="off"></div>
        <button class="btn primary block">${icon('plus', 'sm')} Добавить слово</button>
      </form>
      ${W.length ? `<div class="row wrap"><div class="chips grow">${fchips}</div></div>
        <button class="btn block" data-act="flash" ${W.length - learned ? '' : 'disabled'}>${icon('spark', 'sm')} Повторить карточками</button>` : ''}
      <div>${rows || `<div class="empty">${W.length ? 'Здесь пока пусто.' : 'Слов пока нет. Добавляй сюда всё новое, что встретишь.'}</div>`}</div>
    </section>`;
  };

  Object.assign(App.actions, {
    engStart: () => { App.ui.timerSel = { subjectId: 'eng', blockId: null }; App.go('timer'); },
    engPlan: () => {
      const dow = App.parseKey(App.todayKey()).getDay(), title = PLAN[dow].length ? planLabel(dow).toLowerCase() : '';
      const ok = App.addBlockToday({ type: 'english', subjectId: 'eng', title, dur: 50 });
      App.toast(ok ? 'Английский добавлен в план на сегодня' : 'Сегодня не нашлось свободных 50 минут');
    },
    addWord: form => {
      const en = form.elements.en.value.trim(), ru = form.elements.ru.value.trim();
      if (!en || !ru) return App.toast('Впиши слово и перевод');
      App.state.english.words.push({ id: App.uid(), en, ru, learned: false, added: Date.now() });
      App.save(); App.render();
      setTimeout(() => { const i = document.querySelector('form[data-submit="addWord"] input'); if (i) i.focus(); }, 30);
    },
    wordToggle: el => { const w = App.state.english.words.find(x => x.id === el.dataset.id); if (w) { w.learned = !w.learned; App.save(); App.render(); } },
    wordDel: el => { App.state.english.words = App.state.english.words.filter(x => x.id !== el.dataset.id); App.save(); App.render(); },
    wordFilter: el => { App.ui.wordFilter = el.dataset.f; App.render(); },

    flash: () => {
      const queue = App.state.english.words.filter(w => !w.learned).sort(() => Math.random() - 0.5);
      if (!queue.length) return;
      const card = { q: queue, shown: false, total: queue.length, known: 0 };
      const draw = () => {
        const box = $('flashBox'); if (!box) return;
        if (!card.q.length) {
          box.innerHTML = `<div class="flash" style="cursor:default">Готово!<small>Запомнила: ${card.known} из ${card.total}</small></div><button class="btn primary big" data-act="closeSheet">Закрыть</button>`;
          App.save(); App.render(); return;
        }
        const w = card.q[0];
        box.innerHTML = `<div class="tiny muted" style="text-align:center">Осталось ${card.q.length}</div>
          <div class="flash" data-act="flipCard">${esc(card.shown ? w.ru : w.en)}<small>${card.shown ? esc(w.en) : 'нажми, чтобы увидеть перевод'}</small></div>
          <div class="btnrow"><button class="btn" data-act="cardAgain">Ещё раз</button><button class="btn primary" data-act="cardKnow">Помню</button></div>`;
      };
      App.flashCard = { card, draw };
      App.sheet(`<h2>Карточки</h2><div id="flashBox" class="stack"></div>`, draw);
    },
    flipCard: () => { App.flashCard.card.shown = !App.flashCard.card.shown; App.flashCard.draw(); },
    cardAgain: () => { const c = App.flashCard.card; c.q.push(c.q.shift()); c.shown = false; App.flashCard.draw(); },
    cardKnow: () => { const c = App.flashCard.card, w = c.q.shift(); w.learned = true; c.known++; c.shown = false; App.flashCard.draw(); }
  });
})();
