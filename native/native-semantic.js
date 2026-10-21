/* Switch for the meaning model (Klaus 2026-10-21: "Schalter … Laden des Modells direkt aus der App …
   von meinem Server"). Android loads the files (Klaus' server first, then Hugging Face; every file
   checked against its fixed fingerprint) into app storage; Modul 03 then reads them as local
   addresses. The model starts only when it is complete, and not again by itself when the view
   ended while it was starting (for example out of memory). Loaded in <head>, before Modul 03. */
(() => {
  'use strict';
  const plugin = window.Capacitor?.Plugins?.ProSemantic;
  if (!plugin) return;
  // Modul 03 reads the model from the app's own address; the files there come from the switch.
  window.SBKIM_MODEL_ROOT = '/models/';
  const W = {
    de: { title: '🧠 Modell für die Bedeutungssuche', load: 'Modell laden', cancel: 'Abbrechen', remove: 'Modell entfernen', retry: 'Erneut starten',
      none: 'Noch nicht geladen. Einmal etwa {mb} MB, am besten im WLAN. Danach ohne Internet.',
      partial: 'Teilweise geladen ({done} von {mb} MB). „Modell laden“ macht dort weiter.',
      loading: 'Wird geladen: {done} von {mb} MB · {source}', checking: 'Wird geprüft …',
      ready: 'Geladen und geprüft ({mb} MB). Startet beim Öffnen der App.', active: 'Aktiv: die Suche versteht Bedeutung.',
      starting: 'Modell startet …', startFailed: 'Das Modell ist da, startete aber nicht. Die Suche nutzt Stichworte.',
      crashed: 'Beim letzten Start des Modells wurde die Ansicht beendet (vermutlich zu wenig Speicher). Es startet deshalb nicht von selbst.',
      offline: 'Die App ist vom Internet getrennt. Zum Laden die Lampe oben auf Grün stellen.',
      space: 'Zu wenig freier Speicher auf dem Gerät.', failed: 'Laden hat nicht geklappt: {why}. Nochmal „Modell laden“ tippen, es geht dort weiter.',
      confirmRemove: 'Modell vom Gerät entfernen? Die Suche nutzt dann wieder Stichworte. Es kann jederzeit neu geladen werden.' },
    en: { title: '🧠 Model for meaning search', load: 'Load model', cancel: 'Cancel', remove: 'Remove model', retry: 'Start again',
      none: 'Not loaded yet. About {mb} MB once, ideally on Wi-Fi. Works without internet afterwards.',
      partial: 'Partly loaded ({done} of {mb} MB). “Load model” continues there.',
      loading: 'Loading: {done} of {mb} MB · {source}', checking: 'Checking …',
      ready: 'Loaded and checked ({mb} MB). Starts when the app opens.', active: 'Active: search understands meaning.',
      starting: 'Model is starting …', startFailed: 'The model is there but did not start. Search uses keywords.',
      crashed: 'The view ended while the model was starting last time (probably not enough memory). It will not start by itself.',
      offline: 'The app is cut off from the internet. Turn the lamp at the top green to load.',
      space: 'Not enough free storage on the device.', failed: 'Loading failed: {why}. Tap “Load model” again, it continues there.',
      confirmRemove: 'Remove the model from the device? Search goes back to keywords. It can be loaded again any time.' },
    ru: { title: '🧠 Модель для поиска по смыслу', load: 'Загрузить модель', cancel: 'Отмена', remove: 'Удалить модель', retry: 'Запустить снова',
      none: 'Ещё не загружена. Один раз около {mb} МБ, лучше по Wi-Fi. Потом работает без интернета.',
      partial: 'Загружено частично ({done} из {mb} МБ). «Загрузить модель» продолжит.',
      loading: 'Загрузка: {done} из {mb} МБ · {source}', checking: 'Проверка …',
      ready: 'Загружена и проверена ({mb} МБ). Запускается при открытии приложения.', active: 'Активна: поиск понимает смысл.',
      starting: 'Модель запускается …', startFailed: 'Модель есть, но не запустилась. Поиск по ключевым словам.',
      crashed: 'При последнем запуске модели окно закрылось (вероятно, мало памяти). Сама она больше не запускается.',
      offline: 'Приложение отключено от интернета. Для загрузки переключите лампу вверху на зелёный.',
      space: 'Недостаточно свободной памяти.', failed: 'Загрузка не удалась: {why}. Нажмите «Загрузить модель» ещё раз.',
      confirmRemove: 'Удалить модель с устройства? Поиск снова будет по ключевым словам.' },
    pl: { title: '🧠 Model do wyszukiwania znaczeniowego', load: 'Pobierz model', cancel: 'Anuluj', remove: 'Usuń model', retry: 'Uruchom ponownie',
      none: 'Jeszcze nie pobrany. Jednorazowo około {mb} MB, najlepiej przez Wi-Fi. Potem działa bez internetu.',
      partial: 'Pobrano częściowo ({done} z {mb} MB). „Pobierz model” kontynuuje.',
      loading: 'Pobieranie: {done} z {mb} MB · {source}', checking: 'Sprawdzanie …',
      ready: 'Pobrany i sprawdzony ({mb} MB). Uruchamia się przy otwarciu aplikacji.', active: 'Aktywny: wyszukiwanie rozumie znaczenie.',
      starting: 'Model się uruchamia …', startFailed: 'Model jest, ale się nie uruchomił. Wyszukiwanie po słowach.',
      crashed: 'Przy ostatnim uruchomieniu modelu widok został zamknięty (prawdopodobnie za mało pamięci). Nie uruchomi się sam.',
      offline: 'Aplikacja jest odłączona od internetu. Aby pobrać, przełącz lampkę u góry na zielono.',
      space: 'Za mało wolnego miejsca.', failed: 'Pobieranie nie powiodło się: {why}. Stuknij „Pobierz model” ponownie.',
      confirmRemove: 'Usunąć model z urządzenia? Wyszukiwanie wróci do słów kluczowych.' }
  };
  const t = (k, v = {}) => ((W[document.documentElement.lang] || W.de)[k] || W.de[k]).replace(/\{(\w+)\}/g, (_, n) => v[n] ?? '');
  const mb = n => String(Math.round((n || 0) / 1048576));
  let state = { installed: false, running: false, present: 0, total: 0, crashes: 0 };
  let live = null, message = '', phase = '';   // phase: '' | 'starting' | 'active' | 'startFailed'

  function panel() {
    let box = document.getElementById('pb-semantic');
    if (box) return box;
    const anchor = document.getElementById('embFlag')?.closest('p');
    if (!anchor) return null;
    box = document.createElement('div');
    box.id = 'pb-semantic'; box.className = 'pb-semantic';
    box.innerHTML = '<b data-s="title"></b><div class="pb-semantic-bar" hidden><span></span></div><p data-s="text" role="status"></p>'
      + '<div class="pb-semantic-actions"><button type="button" data-semantic="load"></button><button type="button" data-semantic="cancel" hidden></button>'
      + '<button type="button" data-semantic="retry" hidden></button><button type="button" data-semantic="remove" hidden></button></div>';
    anchor.after(box);
    box.addEventListener('click', event => {
      const action = event.target.closest('[data-semantic]')?.dataset.semantic;
      if (action === 'load') load();
      else if (action === 'cancel') plugin.cancel().catch(() => {});
      else if (action === 'retry') retry();
      else if (action === 'remove') remove();
    });
    return box;
  }

  function render() {
    const box = panel(); if (!box) return;
    const q = s => box.querySelector(s), btn = n => q(`[data-semantic="${n}"]`);
    q('[data-s="title"]').textContent = t('title');
    btn('load').textContent = t('load'); btn('cancel').textContent = t('cancel');
    btn('retry').textContent = t('retry'); btn('remove').textContent = t('remove');
    const total = state.total || 0, running = state.running || !!live;
    let text;
    if (message) text = message;
    else if (running && live) text = live.done >= total ? t('checking') : t('loading', { done: mb(live.done), mb: mb(total), source: live.source || '' });
    else if (state.installed && state.crashes > 0) text = t('crashed');
    else if (state.installed && phase) text = t(phase);
    else if (state.installed) text = t('ready', { mb: mb(total) });
    else if (state.present > 0) text = t('partial', { done: mb(state.present), mb: mb(total) });
    else text = t('none', { mb: mb(total) });
    q('[data-s="text"]').textContent = text;
    const bar = q('.pb-semantic-bar'), done = running && live ? live.done : state.present;
    bar.hidden = state.installed || !(running || state.present > 0);
    bar.firstElementChild.style.width = total ? `${Math.min(100, done / total * 100).toFixed(1)}%` : '0';
    btn('load').hidden = state.installed || running;
    btn('cancel').hidden = !running;
    btn('retry').hidden = !(state.installed && (state.crashes > 0 || phase === 'startFailed'));
    btn('remove').hidden = running || !(state.installed || state.present > 0);
    box.dataset.state = running ? 'loading' : state.installed ? (state.crashes > 0 ? 'crashed' : phase || 'ready') : state.present > 0 ? 'partial' : 'none';
  }

  async function refresh() { try { state = await plugin.getState(); } catch {} render(); }

  plugin.addListener?.('progress', p => { live = p; render(); });

  async function load() {
    message = ''; live = { done: state.present, total: state.total, source: '' }; render();
    try {
      state = await plugin.install(); live = null; render();
      if (state.installed) startModel();
    } catch (error) {
      live = null;
      const code = error?.code || '';
      message = code === 'CANCELLED' ? '' : code === 'APP_OFFLINE' ? t('offline') : code === 'NO_SPACE' ? t('space') : t('failed', { why: error?.message || code || '?' });
      await refresh();
    }
  }

  async function remove() {
    if (!confirm(t('confirmRemove'))) return;
    message = ''; phase = '';
    try { state = await plugin.remove(); } catch {}
    render();
  }

  async function retry() { message = ''; try { state = await plugin.clearCrash(); } catch {} startModel(); }

  // The app's own start function (index.html initEmbedding), handed over by start().
  let starter = null;
  async function startModel() {
    if (!starter || !state.installed || state.crashes > 0) return render();
    phase = 'starting'; render();
    try { await plugin.markLoading(); } catch {}
    try { await starter(); } catch {}
    const ready = !!window.SbkimEmbedding?.isReady?.();
    phase = ready ? 'active' : 'startFailed';
    try { state = await plugin.markLoaded(); } catch {}
    render();
  }

  window.PBSemantic = {
    /** Called by the app instead of starting the model directly. */
    async start(initEmbedding) {
      starter = initEmbedding;
      await refresh();
      if (state.installed && state.crashes === 0) return startModel();
      // Not loaded (or stopped after a crash): the search stays on keywords, without waiting.
      try { if (typeof EMBED === 'object') { EMBED.tried = true; renderEmbFlag(); } } catch {}
    },
    refresh, get state() { return state; }
  };
  const boot = () => refresh();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true }); else boot();
  new MutationObserver(render).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
})();
