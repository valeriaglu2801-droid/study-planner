/* Запуск: навигация, отрисовка, события, сервис-воркер */
(() => {
  const App = window.App;
  const TABS = ['today', 'timer', 'subjects', 'english', 'progress'];

  App.render = (animate = false) => {
    const view = document.getElementById('view');
    const tab = App.ui.tab;
    view.innerHTML = `<div class="screen${animate ? ' enter' : ''}">${App.views[tab]()}</div>`;
    document.querySelectorAll('#nav button').forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
    if (App.after[tab]) App.after[tab]();
    if (tab === 'timer') App.timer.paint();
    App.timer.pill();
  };

  App.go = tab => {
    const same = tab === App.ui.tab;
    App.ui.tab = tab;
    App.render(!same); window.scrollTo(0, 0);
  };
  App.actions.go = el => {
    if (el.dataset.tab === 'subjects' && App.ui.tab === 'subjects') App.ui.subjectId = null;
    App.go(el.dataset.tab);
  };

  /* ---------- события (делегирование) ---------- */
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-act]'); if (!el) return;
    const fn = App.actions[el.dataset.act];
    if (fn) fn(el, e);
  });
  document.addEventListener('change', e => {
    const el = e.target.closest('[data-change]'); if (!el) return;
    const fn = App.actions[el.dataset.change]; if (fn) fn(el, e);
  });
  document.addEventListener('input', e => {
    const el = e.target.closest('[data-input]'); if (!el) return;
    const fn = App.actions[el.dataset.input]; if (fn) fn(el, e);
  });
  document.addEventListener('submit', e => {
    const f = e.target.closest('form[data-submit]'); if (!f) return;
    e.preventDefault();
    const fn = App.actions[f.dataset.submit]; if (fn) fn(f, e);
  });
  // iOS разрешает звук только после касания: «будим» аудио при любом нажатии
  document.addEventListener('pointerdown', () => App.audio.unlock(), { passive: true });

  /* ---------- тик: только обновление экрана, время берётся из меток ---------- */
  const tick = () => {
    const changed = App.timer.reconcile();
    if (changed) { if (!App.sheetOpen()) App.render(); else App.timer.pill(); return; }
    if (App.ui.tab === 'timer') App.timer.paint();
    App.timer.pill();
  };
  setInterval(tick, 250);

  let stamp = App.todayKey();
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;
    App.audio.unlock();
    const now = App.todayKey();
    if (now !== stamp) { if (App.ui.date === stamp) App.ui.date = now; stamp = now; }
    App.timer.reconcile();
    if (!App.sheetOpen()) App.render();
  });

  /* ---------- старт ---------- */
  App.load();
  App.ui.date = App.todayKey();
  App.timer.reconcile();
  App.render(true);
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }
})();
