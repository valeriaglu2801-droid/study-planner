/* Данные: хранение, подсчёты, резервная копия */
(() => {
  const App = window.App;
  const KEY = 'uchoba.v1';
  const WORK_MS = 50 * 60000;
  App.WORK_MS = WORK_MS;

  App.TYPES = {
    class: { name: 'Пара' }, study: { name: 'Учёба' }, english: { name: 'Английский' },
    gym: { name: 'Зал' }, rest: { name: 'Отдых' }, custom: { name: 'Своё' }
  };
  App.TYPE_ORDER = ['class', 'study', 'english', 'gym', 'rest', 'custom'];
  App.DEFAULT_DUR = { class: 90, study: 50, english: 50, gym: 140, rest: 30, custom: 30 };
  App.isStudyType = t => t === 'study' || t === 'english';

  const SUBJECTS = [
    ['soc', 'Социология', '#f4a6c0', 5],
    ['pol', 'Политология', '#ffbf7a', 5],
    ['phil', 'Философия', '#b9a6f4', 3],
    ['math', 'Математика', '#7cc7e8', 5],
    ['ukr', 'Украинский язык', '#8fd6a5', 2],
    ['eng', 'Английский', '#f2d36b', 6]
  ];

  // Постоянное расписание пар: ключ — день недели (0 = воскресенье). Выходные пустые.
  const defaultWeekly = () => {
    const b = (start, dur, title) => ({ id: App.uid(), type: 'class', subjectId: null, title, start: App.toMin(start), dur });
    return {
      0: [], 6: [],
      1: [b('11:40', 80, 'Английский'), b('15:00', 80, 'Политология')],
      2: [b('08:30', 80, 'Вышмат · лекция'), b('10:00', 80, 'Вышмат · семинар')],
      3: [b('13:30', 80, 'Социология')],
      4: [b('11:30', 90, 'Украинский язык')],
      5: [b('10:00', 80, 'Социология'), b('11:40', 80, 'Английский')]
    };
  };

  App.defaultState = () => ({
    version: 1,
    seeded: false,
    sampleDay: null,
    settings: {
      minWeekday: 4, minWeekend: 3,
      wakeWd: '08:00', bedWd: '23:30', wakeWe: '11:00', bedWe: '00:30',
      breakMin: 10, sound: true, runShortcut: true, shortcutName: 'Deep Work',
      endAlerts: true, lastBackup: null, weeklyFrom: '2026-10-16'
    },
    subjects: SUBJECTS.map(([id, name, color, norm]) => ({ id, name, color, examDate: '2026-12-10', goal: '', norm, topics: [] })),
    days: {}, templates: [], sessions: [],
    timer: { phase: 'idle' },
    english: { words: [] },
    weekly: defaultWeekly(),
    weeklyInit: true
  });

  const migrate = raw => {
    const d = App.defaultState();
    const s = Object.assign({}, d, raw);
    s.settings = Object.assign({}, d.settings, raw.settings || {});
    s.english = Object.assign({}, d.english, raw.english || {});
    s.timer = raw.timer && raw.timer.phase ? raw.timer : { phase: 'idle' };
    ['days'].forEach(k => { if (!s[k] || typeof s[k] !== 'object') s[k] = {}; });
    ['templates', 'sessions'].forEach(k => { if (!Array.isArray(s[k])) s[k] = []; });
    if (!Array.isArray(s.subjects) || !s.subjects.length) s.subjects = d.subjects;
    d.subjects.forEach(ds => { if (!s.subjects.find(x => x.id === ds.id)) s.subjects.push(ds); });
    s.subjects.forEach(x => { x.topics = Array.isArray(x.topics) ? x.topics : []; });
    if (!s.weekly || typeof s.weekly !== 'object') s.weekly = d.weekly;
    if (!raw.weeklyInit) {
      // старые данные с примером дня: убираем пример, дальше дни собираются из расписания недели
      Object.keys(s.days).forEach(k => {
        const day = s.days[k]; if (!day || !Array.isArray(day.blocks)) { delete s.days[k]; return; }
        day.blocks = day.blocks.filter(x => !x.sample);
        if (!day.blocks.length) delete s.days[k];
      });
      s.sampleDay = null; s.weekly = d.weekly; s.weeklyInit = true;
    }
    return s;
  };

  App.load = () => {
    let raw = null;
    try { raw = JSON.parse(localStorage.getItem(KEY)); } catch (e) { /* пусто */ }
    App.state = raw && raw.subjects ? migrate(raw) : App.defaultState();
    App.state.seeded = true; App.save();
  };
  App.save = () => {
    try { localStorage.setItem(KEY, JSON.stringify(App.state)); App.storageFailed = false; }
    catch (e) { if (!App.storageFailed) App.toast('Не удалось сохранить: память браузера недоступна'); App.storageFailed = true; }
  };

  App.seedSample = () => {
    const k = App.todayKey();
    const mk = (type, start, dur, subjectId, title) => ({ id: App.uid(), type, start: App.toMin(start), dur, subjectId: subjectId || null, title: title || '', sample: true });
    App.state.days[k] = { blocks: [
      mk('class', '09:30', 90, null, 'Пара'),
      mk('study', '11:30', 50, 'soc'),
      mk('study', '12:30', 50, 'pol'),
      mk('rest', '13:30', 45, null, 'Обед и прогулка'),
      mk('english', '14:30', 50, 'eng', 'словарь + грамматика'),
      mk('study', '15:30', 50, 'math'),
      mk('gym', '16:45', 140),
      mk('study', '19:45', 50, 'phil'),
      mk('rest', '21:00', 60, null, 'Сериал')
    ] };
    App.state.sampleDay = k;
  };
  App.removeSample = () => {
    Object.values(App.state.days).forEach(d => { d.blocks = d.blocks.filter(b => !b.sample); });
    App.state.sampleDay = null; App.save();
  };

  /* ----- Выборки ----- */
  App.subj = id => App.state.subjects.find(s => s.id === id);
  // День берётся из расписания недели один раз, потом живёт сам по себе (его можно править).
  App.dayBlocks = k => {
    const d = App.state.days[k];
    if (d) return d.blocks;
    if (k >= App.state.settings.weeklyFrom) {
      const w = App.state.weekly[App.parseKey(k).getDay()] || [];
      if (w.length) {
        const blocks = w.map(b => ({ ...b, id: App.uid() }));
        App.state.days[k] = { blocks, auto: true }; App.save();
        return blocks;
      }
    }
    return [];
  };
  App.setDayBlocks = (k, blocks) => { App.state.days[k] = { blocks, auto: false }; App.save(); };
  // Расписание недели изменилось: будущие дни, которые ты не правила вручную, пересоберутся
  App.weeklyChanged = () => {
    const t = App.todayKey();
    Object.keys(App.state.days).forEach(k => { if (App.state.days[k].auto && k >= t) delete App.state.days[k]; });
    App.save();
  };
  App.minFor = k => App.isWeekend(k) ? App.state.settings.minWeekend : App.state.settings.minWeekday;
  App.blockUnits = b => App.isStudyType(b.type) ? Math.floor(b.dur / 50) : 0;
  App.plannedUnits = k => App.dayBlocks(k).reduce((n, b) => n + App.blockUnits(b), 0);
  App.sessionsOn = k => App.state.sessions.filter(s => s.date === k);
  App.doneUnits = k => App.sessionsOn(k).filter(s => s.counted).reduce((n, s) => n + Math.floor(s.ms / WORK_MS), 0);
  App.blockDone = b => App.state.sessions.some(s => s.blockId === b.id && s.counted);
  App.weekMs = (subjectId, monday) => {
    const end = App.addDays(monday, 6);
    return App.state.sessions.filter(s => s.counted && s.subjectId === subjectId && s.date >= monday && s.date <= end).reduce((n, s) => n + s.ms, 0);
  };
  App.totalMs = subjectId => App.state.sessions.filter(s => s.counted && (!subjectId || s.subjectId === subjectId)).reduce((n, s) => n + s.ms, 0);

  App.dayBounds = k => {
    const s = App.state.settings, we = App.isWeekend(k);
    const wake = App.toMin(we ? s.wakeWe : s.wakeWd);
    let bed = App.toMin(we ? s.bedWe : s.bedWd);
    if (bed <= wake) bed += 1440;
    return { wake, bed: Math.min(bed, 1440) };
  };

  App.blockTitle = b => {
    const sj = b.subjectId && App.subj(b.subjectId);
    if (b.type === 'study') return (sj ? sj.name : 'Учёба') + (b.title ? ' · ' + b.title : '');
    if (b.type === 'english') return 'Английский' + (b.title ? ' · ' + b.title : '');
    return b.title || App.TYPES[b.type].name;
  };

  App.metDates = () => {
    const by = {};
    App.state.sessions.forEach(s => { if (s.counted) by[s.date] = (by[s.date] || 0) + Math.floor(s.ms / WORK_MS); });
    return Object.keys(by).filter(k => by[k] >= App.minFor(k)).sort();
  };
  App.streak = () => {
    const met = new Set(App.metDates());
    let k = App.todayKey(), n = 0;
    if (!met.has(k)) k = App.addDays(k, -1);
    while (met.has(k)) { n++; k = App.addDays(k, -1); }
    return n;
  };
  App.bestStreak = () => {
    const met = App.metDates(); let best = 0, run = 0, prev = null;
    met.forEach(k => { run = prev && App.diffDays(prev, k) === 1 ? run + 1 : 1; best = Math.max(best, run); prev = k; });
    return best;
  };

  /* ----- Поиск свободного окна для блока ----- */
  const GAP = 10;
  App.findSlot = (k, dur, from, extra = []) => {
    const { bed } = App.dayBounds(k);
    const blocks = App.dayBlocks(k).concat(extra);
    for (let s = Math.ceil(from / 5) * 5; s + dur <= bed; s += 5) {
      if (blocks.every(b => s + dur + GAP <= b.start || s >= b.start + b.dur + GAP)) return s;
    }
    return null;
  };
  App.planFrom = k => {
    const { wake } = App.dayBounds(k);
    return k === App.todayKey() ? Math.max(wake, App.nowMin() + 5) : wake;
  };

  /* ----- Резервная копия ----- */
  App.exportBackup = async () => {
    const blob = new Blob([JSON.stringify(App.state, null, 2)], { type: 'application/json' });
    const r = await App.shareFile(blob, `uchoba-backup-${App.todayKey()}.json`, 'application/json');
    if (r !== 'cancel') {
      App.state.settings.lastBackup = Date.now(); App.save();
      App.toast(r === 'shared' ? 'Копия отправлена. Сохрани её в «Файлы»' : 'Файл копии скачан');
      App.render();
    }
  };
  App.importBackup = file => {
    const fr = new FileReader();
    fr.onload = () => {
      try {
        const data = JSON.parse(fr.result);
        if (!data || !Array.isArray(data.subjects) || typeof data.days !== 'object') throw new Error('bad');
        if (!confirm('Заменить все данные в приложении данными из файла? Текущие данные будут потеряны.')) return;
        App.state = migrate(data); App.state.seeded = true; App.save();
        App.ui.date = null; App.ui.timerSel = null;
        App.toast('Данные восстановлены'); App.render();
      } catch (e) { App.toast('Это не похоже на файл резервной копии'); }
    };
    fr.readAsText(file);
  };
})();
