/* Общие утилиты: даты, иконки, окна, тосты, звук, отправка файлов */
(() => {
  const App = window.App = {
    actions: {}, views: {}, after: {},
    ui: { tab: 'today', date: null, subjectId: null, topicFilter: 'all', wordFilter: 'all', weekOffset: 0, timerSel: null },
    state: null
  };

  const pad = n => String(n).padStart(2, '0');
  const WD = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
  const WDS = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];
  const MON = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];

  const parseKey = k => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
  const dkey = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  Object.assign(App, {
    pad, WD, WDS, MON, parseKey, dkey,
    uid: () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4),
    esc: s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])),
    todayKey: () => dkey(new Date()),
    addDays: (k, n) => { const d = parseKey(k); d.setDate(d.getDate() + n); return dkey(d); },
    isWeekend: k => { const w = parseKey(k).getDay(); return w === 0 || w === 6; },
    mondayOf: k => { const d = parseKey(k); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return dkey(d); },
    diffDays: (a, b) => Math.round((parseKey(b) - parseKey(a)) / 864e5),
    nowMin: () => { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); },
    fmt: min => { min = Math.round(min); return pad(Math.floor(min / 60)) + ':' + pad(min % 60); },
    toMin: hhmm => { const [h, m] = String(hhmm).split(':').map(Number); return (h || 0) * 60 + (m || 0); },
    plural: (n, f) => { n = Math.abs(n); const a = n % 10, b = n % 100; if (b >= 11 && b <= 14) return f[2]; if (a === 1) return f[0]; if (a >= 2 && a <= 4) return f[1]; return f[2]; },
    dur: min => { min = Math.round(min); const h = Math.floor(min / 60), m = min % 60; return h ? (m ? `${h} ч ${m} м` : `${h} ч`) : `${m} м`; },
    hours: ms => { const h = ms / 3600000; return (Math.round(h * 10) / 10).toString().replace('.', ',') + ' ч'; },
    dateLabel: k => { const d = parseKey(k); return `${WD[d.getDay()]}, ${d.getDate()} ${MON[d.getMonth()]}`; },
    dateLong: k => { const d = parseKey(k); return `${d.getDate()} ${MON[d.getMonth()]} ${d.getFullYear()}`; },
    icon: (name, cls = '') => `<svg class="i ${cls}" aria-hidden="true"><use href="#i-${name}"/></svg>`,
    isIOS: () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  });

  /* ----- Окна (bottom sheet) ----- */
  const root = () => document.getElementById('sheetRoot');
  App.sheet = (html, mount) => {
    root().innerHTML = `<div class="scrim" data-act="closeSheet"></div><div class="sheet" role="dialog" aria-modal="true"><div class="grab"></div>${html}</div>`;
    document.body.classList.add('noscroll');
    if (mount) mount(root().querySelector('.sheet'));
  };
  App.closeSheet = () => { root().innerHTML = ''; document.body.classList.remove('noscroll'); };
  App.sheetOpen = () => !!root().firstChild;
  App.actions.closeSheet = () => App.closeSheet();

  /* ----- Тост ----- */
  let toastT;
  App.toast = msg => {
    const el = document.getElementById('toast');
    el.textContent = msg; el.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('show'), 3200);
  };

  /* ----- Звук (Web Audio, работает только при открытом приложении) ----- */
  App.audio = {
    ctx: null,
    unlock() {
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        if (!this.ctx) this.ctx = new AC();
        if (this.ctx.state !== 'running') this.ctx.resume();
      } catch (e) { /* без звука */ }
    },
    chime() {
      try {
        this.unlock();
        const c = this.ctx; if (!c) return;
        const t0 = c.currentTime + 0.05;
        [659.25, 783.99, 1046.5, 783.99, 1046.5].forEach((f, i) => {
          const o = c.createOscillator(), g = c.createGain();
          o.type = 'sine'; o.frequency.value = f;
          const t = t0 + i * 0.28;
          g.gain.setValueAtTime(0.0001, t);
          g.gain.exponentialRampToValueAtTime(0.35, t + 0.03);
          g.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
          o.connect(g).connect(c.destination); o.start(t); o.stop(t + 0.75);
        });
      } catch (e) { /* без звука */ }
    }
  };

  /* ----- Отправка файла: Поделиться → иначе скачивание ----- */
  App.shareFile = async (blob, name, type, preferShare = true) => {
    if (preferShare && navigator.canShare && window.File) {
      try {
        const file = new File([blob], name, { type });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: name });
          return 'shared';
        }
      } catch (e) {
        if (e && e.name === 'AbortError') return 'cancel';
      }
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
    return 'download';
  };
})();
