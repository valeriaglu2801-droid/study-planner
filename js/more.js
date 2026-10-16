/* «Ещё»: настройки, инструкция «Как настроить», резервная копия */
(() => {
  const App = window.App;
  const { esc, icon } = App;
  const sub = () => App.ui.moreSub;

  const GUIDE = [
    ['Поставить приложение на экран «Домой»', `
      <ol>
        <li>Открой ссылку на приложение в <b>Safari</b> (не в Telegram и не в Instagram: там нужная кнопка не появится).</li>
        <li>Нажми кнопку <kbd>Поделиться</kbd>: квадратик со стрелкой вверх внизу экрана.</li>
        <li>Пролистай меню вниз и выбери <kbd>На экран «Домой»</kbd>.</li>
        <li>Нажми <kbd>Добавить</kbd> справа вверху. Иконка появится на экране.</li>
        <li>Дальше открывай приложение только с этой иконки. Так оно работает как обычное, без адресной строки и без интернета.</li>
      </ol>`],
    ['Режим «Фокусирование» Deep Work', `
      <ol>
        <li><kbd>Настройки</kbd> → <kbd>Фокусирование</kbd> → плюс справа вверху → <kbd>Свой</kbd>.</li>
        <li>Назови режим <b>Deep Work</b>, выбери цвет и значок → <kbd>Далее</kbd> → <kbd>Настроить фокусирование</kbd>.</li>
        <li><kbd>Люди</kbd> → <kbd>Уведомления от людей</kbd> → <kbd>Не уведомлять</kbd>. Если хочешь, чтобы близкие могли дозвониться в экстренном случае, разреши звонки от избранных.</li>
        <li><kbd>Приложения</kbd> → <kbd>Уведомления от приложений</kbd> → <kbd>Разрешить только</kbd> → плюс → добавь <b>Календарь</b>. Остальные приложения будут молчать, а Календарь позовёт тебя в конце блока.</li>
        <li><b>Свой экран «Домой» только с нужным.</b> Сначала собери страницу: зажми пустое место на экране «Домой» → нажми точки страниц внизу → сними галочки со страниц с соцсетями и играми (приложения не удалятся, страницы просто спрячутся). Лучше сделать отдельную страницу, где только это приложение, Календарь, Команды, Часы и Заметки.</li>
        <li>Вернись в режим: <kbd>Настроить экраны</kbd> → <kbd>Экран «Домой»</kbd> → <kbd>Выбрать страницы</kbd> → отметь свою учебную страницу.</li>
        <li>Там же: <kbd>Экран блокировки</kbd> выбери спокойный, а в параметрах включи <kbd>Скрывать значки уведомлений</kbd>.</li>
      </ol>
      <div class="tip">Названия пунктов в разных версиях iOS немного отличаются. Если не нашла точное слово, ищи похожее по смыслу.</div>`],
    ['Команда «Deep Work» (включает Фокусирование на 50 минут)', `
      <ol>
        <li>Открой приложение <b>Команды</b> → вкладка <kbd>Команды</kbd> → плюс справа вверху.</li>
        <li>Назови команду точно <b>Deep Work</b> (два слова с большой буквы, между ними пробел). По этому названию её находит приложение.</li>
        <li><kbd>Добавить действие</kbd> → в поиске набери «Дата» → выбери <kbd>Дата</kbd> (Текущая дата).</li>
        <li>Плюс → поиск «Скорректировать дату» → выбери его и поставь: <kbd>Добавить</kbd> <kbd>50</kbd> <kbd>минут</kbd>.</li>
        <li>Плюс → поиск «Фокусирование» → <kbd>Установить фокусирование</kbd> → <kbd>Включить</kbd> → фокусирование <kbd>Deep Work</kbd> → <kbd>До</kbd> → <kbd>Времени</kbd>. В поле времени выбери переменную <kbd>Скорректированная дата</kbd>.</li>
        <li>Нажми <kbd>Готово</kbd> и один раз запусти команду пальцем, чтобы разрешить ей доступ.</li>
        <li>Теперь кнопка <b>«Начать блок»</b> в таймере сама откроет эту команду. В первый раз iOS спросит, можно ли открыть «Команды»: нажми <kbd>Открыть</kbd>.</li>
        <li>Вернуться в приложение можно по стрелке «◀ Учёба» в левом верхнем углу экрана или с иконки.</li>
      </ol>
      <div class="tip">Если ты продлеваешь блок, Фокусирование выключится на 50-й минуте. Не хочется — поставь в команде не 50, а 90 минут, или запусти её снова.</div>`],
    ['Как работать за компьютером', `
      <ol>
        <li>Утром отправь план дня в Календарь (экран «Сегодня» → «В Календарь»).</li>
        <li>Нажми «Начать блок» в таймере, положи телефон экраном вниз и иди к компьютеру.</li>
        <li>Через 50 минут Календарь сам позовёт тебя: он разрешён в режиме Deep Work.</li>
        <li>Вернись к телефону, посмотри, что блок засчитан, и нажми «Перерыв».</li>
      </ol>
      <div class="tip"><b>В сложные дни клади телефон в другую комнату.</b> Это самый честный способ не залипнуть. Громкость и звук Календаря проверь заранее.</div>`],
    ['Календарь iPhone', `
      <ol>
        <li>Один раз создай отдельный календарь: <kbd>Календарь</kbd> → <kbd>Календари</kbd> → <kbd>Добавить календарь</kbd> → назови «Учёба». Так события всегда можно убрать вместе.</li>
        <li>Экран <b>Сегодня</b> → <kbd>В Календарь</kbd> → <kbd>Отправить в Календарь</kbd>.</li>
        <li>В меню «Поделиться» выбери <kbd>Календарь</kbd>. Если его там нет, выбери <kbd>Сохранить в Файлы</kbd>, потом открой файл и нажми <kbd>Добавить все</kbd>.</li>
        <li>Выбери календарь «Учёба» и подтверди.</li>
        <li>Оповещения приходят на начало и конец учебных блоков и отдыха. Для зала их нет.</li>
      </ol>
      <div class="tip">Перед отправкой проверь, что в Настройках → Уведомления → Календарь разрешены уведомления и звуки.</div>`],
    ['Резервная копия', `
      <ol>
        <li>Все данные хранятся только на твоём телефоне, в самом приложении.</li>
        <li>Раз в неделю: <kbd>Ещё</kbd> → <kbd>Резервная копия</kbd> → <kbd>Экспорт</kbd> → сохрани файл в «Файлы» (лучше в iCloud Drive).</li>
        <li>Если удалишь иконку с экрана «Домой», данные пропадут. Чтобы вернуть их, нажми <kbd>Импорт</kbd> и выбери сохранённый файл.</li>
      </ol>`]
  ];

  function menu() {
    const items = [
      ['week', 'today', 'Расписание недели', 'Пары, которые повторяются каждую неделю'],
      ['guide', 'info', 'Как настроить', 'Экран «Домой», Фокусирование, Команда, Календарь'],
      ['settings', 'sliders', 'Настройки', 'Минимум блоков, подъём и отбой, звук, Команда'],
      ['backup', 'down', 'Резервная копия', 'Экспорт и импорт данных']
    ].map(([id, ic, t, d]) => `<button class="item" data-act="moreOpen" data-sub="${id}"><span class="ic">${icon(ic)}</span><span class="grow"><div>${t}</div><div class="small muted" style="font-weight:500">${d}</div></span>${icon('right', 'sm')}</button>`).join('');
    return `<header class="top"><div><div class="eyebrow">Приложение</div><h1>Ещё</h1></div><button class="iconbtn" data-act="moreBack" aria-label="Закрыть">${icon('x')}</button></header><div class="menu">${items}</div>`;
  }

  const head = t => `<header class="top"><button class="iconbtn" data-act="moreOpen" data-sub="" aria-label="Назад">${icon('left')}</button><div class="grow"><h1>${t}</h1></div></header>`;

  function guide() {
    return `${head('Как настроить')}
      <div class="note info">${icon('info', 'sm')}<div>Если ты новичок, иди сверху вниз. Каждый шаг займёт несколько минут.</div></div>
      <div>${GUIDE.map(([t, b], i) => `<details class="step" ${i === 0 ? 'open' : ''}><summary><span class="num">${i + 1}</span>${t}</summary><div class="body">${b}</div></details>`).join('')}</div>`;
  }

  function week() {
    const order = [1, 2, 3, 4, 5, 6, 0];
    const cards = order.map(dow => {
      const list = (App.state.weekly[dow] || []).slice().sort((a, b) => a.start - b.start);
      const rows = list.map(b => `<button class="li" style="width:100%;text-align:left" data-act="weekEdit" data-dow="${dow}" data-id="${b.id}">
          <span class="pill" style="background:var(--c-${b.type});color:var(--k-${b.type})">${App.TYPES[b.type].name}</span>
          <span class="grow">${esc(App.blockTitle(b))}</span><b class="nowrap">${App.fmt(b.start)}–${App.fmt(b.start + b.dur)}</b></button>`).join('');
      return `<section class="card"><div class="row between"><h2>${App.WD[dow]}</h2><button class="btn sm" data-act="weekAdd" data-dow="${dow}">${icon('plus', 'sm')} Добавить</button></div>
        <div class="list">${rows || '<div class="small muted">Пусто. Сюда можно вписать повторяющиеся занятия.</div>'}</div></section>`;
    }).join('');
    return `${head('Расписание недели')}
      <div class="note info">${icon('info', 'sm')}<div>Эти занятия сами появляются в каждой неделе, начиная с 16 октября. Нажми на занятие, чтобы изменить время или убрать. Изменения применятся ко всем будущим дням, которые ты не правила вручную. Чтобы изменить только один день, открой его на экране «Сегодня».</div></div>
      ${cards}`;
  }

  function settings() {
    const s = App.state.settings;
    const stp = (key, v, a, b) => `<div class="stepper"><button data-act="setNum" data-k="${key}" data-d="-1" aria-label="Меньше">−</button><b>${v}</b><button data-act="setNum" data-k="${key}" data-d="1" aria-label="Больше">+</button></div>`;
    const tm = (key, label) => `<label class="field"><span>${label}</span><input type="time" value="${s[key]}" data-change="setTime" data-k="${key}"></label>`;
    return `${head('Настройки')}
    <section class="card">
      <h2>Минимум учебных блоков в день</h2>
      <div class="row between"><span>Будни</span>${stp('minWeekday', s.minWeekday)}</div>
      <div class="row between"><span>Выходные</span>${stp('minWeekend', s.minWeekend)}</div>
      <div class="small muted">Блок = 50 минут. От этого числа зависят предупреждения, серия дней и итог недели.</div>
    </section>
    <section class="card">
      <h2>Режим дня</h2>
      <div class="cols2">${tm('wakeWd', 'Подъём в будни')}${tm('bedWd', 'Отбой в будни')}</div>
      <div class="cols2">${tm('wakeWe', 'Подъём в выходные')}${tm('bedWe', 'Отбой в выходные')}</div>
      <div class="small muted">«Быстрый ввод» расставляет задачи только между подъёмом и отбоем (максимум до полуночи).</div>
    </section>
    <section class="card">
      <h2>Таймер</h2>
      <div class="row between"><span>Перерыв, минут</span>${stp('breakMin', s.breakMin)}</div>
      <label class="switch"><span>Звук в конце блока<div class="tiny muted">Играет только пока приложение открыто</div></span><input type="checkbox" data-change="setBool" data-k="sound" ${s.sound ? 'checked' : ''}></label>
      <button class="btn sm" data-act="testSound">${icon('sound', 'sm')} Проверить звук</button>
      <label class="switch"><span>Запускать команду Фокусирования<div class="tiny muted">Только на iPhone, при нажатии «Начать блок»</div></span><input type="checkbox" data-change="setBool" data-k="runShortcut" ${s.runShortcut ? 'checked' : ''}></label>
      <label class="field"><span>Название команды в «Командах»</span><input type="text" value="${esc(s.shortcutName)}" data-change="setText" data-k="shortcutName" maxlength="40"></label>
    </section>`;
  }

  function backup() {
    const s = App.state.settings, has = Object.keys(App.state.days).length || App.state.sessions.length;
    return `${head('Резервная копия')}
    <section class="card">
      <p>Данные живут только на этом телефоне. Сохраняй копию раз в неделю.</p>
      <div class="small muted">${s.lastBackup ? 'Последняя копия: ' + new Date(s.lastBackup).toLocaleString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }) : 'Копий ещё не было.'}</div>
      <button class="btn primary big" data-act="doExport">${icon('down')} Экспорт резервной копии</button>
      <label class="btn big block" style="cursor:pointer">${icon('up')} Импорт из файла<input type="file" accept=".json,application/json" data-change="doImport" hidden></label>
    </section>
    <section class="card">
      <h2>Служебное</h2>
      <button class="btn ghost block" data-act="removeSample" ${App.state.sampleDay ? '' : 'disabled'}>Удалить пример дня</button>
      <button class="btn danger block" data-act="resetAll">Стереть все данные</button>
    </section>`;
  }

  App.views.more = () => sub() === 'week' ? week() : sub() === 'guide' ? guide() : sub() === 'settings' ? settings() : sub() === 'backup' ? backup() : menu();

  Object.assign(App.actions, {
    openMore: () => { App.ui.prevTab = App.ui.tab === 'more' ? App.ui.prevTab : App.ui.tab; App.ui.moreSub = null; App.go('more'); },
    moreOpen: el => { App.ui.moreSub = el.dataset.sub || null; App.render(); window.scrollTo(0, 0); },
    moreBack: () => { App.ui.moreSub = null; App.go(App.ui.prevTab || 'today'); },
    weekAdd: el => { App.ui.bsTarget = { kind: 'week', dow: +el.dataset.dow }; App.blockSheet(null, { type: 'class' }); },
    weekEdit: el => {
      const dow = +el.dataset.dow; App.ui.bsTarget = { kind: 'week', dow };
      const b = (App.state.weekly[dow] || []).find(x => x.id === el.dataset.id); if (b) App.blockSheet(b);
    },
    setNum: el => {
      const lim = { minWeekday: [1, 12], minWeekend: [1, 12], breakMin: [3, 30] }[el.dataset.k];
      const s = App.state.settings, v = Math.max(lim[0], Math.min(lim[1], s[el.dataset.k] + +el.dataset.d));
      s[el.dataset.k] = v; App.save(); App.render();
    },
    setTime: el => { if (el.value) { App.state.settings[el.dataset.k] = el.value; App.save(); App.toast('Сохранено'); } },
    setBool: el => { App.state.settings[el.dataset.k] = el.checked; App.save(); },
    setText: el => { App.state.settings[el.dataset.k] = el.value.trim() || 'Deep Work'; App.save(); App.toast('Сохранено'); },
    testSound: () => { App.audio.unlock(); App.audio.chime(); },
    doExport: () => App.exportBackup(),
    doImport: el => { if (el.files[0]) App.importBackup(el.files[0]); el.value = ''; },
    resetAll: () => {
      if (!confirm('Стереть ВСЕ данные: план, предметы, темы, словарь, прогресс? Это нельзя отменить.')) return;
      if (!confirm('Точно стереть? Лучше сначала сделать резервную копию.')) return;
      try { localStorage.removeItem('uchoba.v1'); } catch (e) { /* пусто */ }
      location.reload();
    }
  });
})();
