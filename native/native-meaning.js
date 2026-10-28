/* Zweites, größeres Bedeutungs-Modell nur für die Suche in der App (Pro-Umbau 5, Klaus 2026-10-28: „unabhängig vom
   Mycel ein zweites Embedding-Modell … ein größeres Modell für die Bedeutungssuche innerhalb der App“).

   - Stufen „Mittel“ (multilingual-e5-base, 768 Werte) und „Groß“ (multilingual-e5-large, 1024 Werte); welche passt, sagt
     der Gerätecheck (ProGeraet, bedeutungMittel/bedeutungGross). Gewählt wird hier, geladen erst auf „Modell laden“.
   - Laden nativ (ProMeaning): zuerst family-projekt.de, sonst Hugging Face, jede Datei per SHA-256 aus meaning-models.json.
   - „Einordnen“ (nur auf Tipp) rechnet den Katalog Datei für Datei mit dem zweiten Modell neu, als Hintergrundaufgabe
     (ProHintergrund), jederzeit abbrechbar. Die Vektoren liegen getrennt in einer eigenen Ablage (IndexedDB pb_meaning_v1,
     je Stufe eine Tabelle, mit Modell-Revision und Textschlüssel) — nie am Katalog-Eintrag, nie neben den 384er-Vektoren.
   - Die Suche nutzt sie nur, wenn das Modell geladen ist, läuft und JEDER Eintrag seinen Vektor hat; sonst bleibt alles
     bei Modul 03 wie bisher. Mycel, Siegel und Modul 03 bleiben unverändert beim kleinen Modell (e5-small).
   - e5 verlangt die Rollen „query: “ (Frage) und „passage: “ (Text). */
(() => {
  'use strict';
  const plugin = window.Capacitor?.Plugins?.ProMeaning;
  if (!plugin || window.PBMeaning) return;
  const STUFEN = ['mittel', 'gross'];
  const GERAET = { mittel: 'bedeutungMittel', gross: 'bedeutungGross' };
  const LIB = 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2';
  const ROOT = window.Capacitor?.getPlatform?.() === 'windows' ? 'https://pbmodel.localhost/models/' : location.origin + '/models/';
  const WAHL = 'pb_meaning_stufe_v1', DB = 'pb_meaning_v1';
  const W = {
    de: { title: 'Größeres Modell für die Suche in der App', aus: 'Aus', mittel: 'Mittel', gross: 'Groß', empfohlen: 'empfohlen',
      passt: 'passt', knapp: 'knapp', nein: 'nicht empfohlen',
      info: 'Zusätzlich zum Modell für Mycel und Siegel kann die Suche in dieser App ein größeres Modell nutzen: Mittel (multilingual-e5-base, etwa {mMb} MB) oder Groß (multilingual-e5-large, etwa {gMb} MB). Mycel, Siegel und andere Geräte bleiben beim kleinen Modell. Ob das größere Modell bei deinen Dateien besser findet, ist nicht gemessen: die kleine Probe im Lernlauf fand mit allen drei Stufen dieselben Treffer. Nach dem Laden „Einordnen“ tippen: dann rechnet die App jede Datei einmal neu, im Hintergrund, abbrechbar. Die Werte bleiben auf dem Gerät, getrennt vom kleinen Modell. Nichts startet von selbst.',
      offText: 'Aus: die Suche nutzt das Modell für Mycel und Siegel.',
      none: 'Noch nicht geladen. Einmal etwa {mb} MB, am besten im WLAN.', partial: 'Teilweise geladen ({done} von {mb} MB). „Modell laden“ macht dort weiter.',
      loading: 'Wird geladen: {done} von {mb} MB ({pct} %) · {source}', checking: 'Wird geprüft …',
      ready: 'Geladen und geprüft ({mb} MB).', starting: 'Modell startet …',
      startFailed: 'Das Modell ist da, startete aber nicht. Die Suche nutzt das kleine Modell.',
      crashed: 'Beim letzten Start des Modells wurde die Ansicht beendet (vermutlich zu wenig Speicher). Es startet deshalb nicht von selbst.',
      offen: '{n} von {m} Dateien eingeordnet. Bis alle eingeordnet sind, nutzt die Suche das kleine Modell.',
      aktiv: 'Aktiv: alle {m} Dateien eingeordnet, die Suche nutzt das größere Modell.',
      job: 'Einordnen: {i} von {n}', jobStop: 'Einordnen angehalten ({i} von {n}). „Einordnen“ macht dort weiter.', jobFehler: 'Einordnen nicht möglich: {why}',
      bgTitle: 'Einordnen (größeres Modell)', bgText: 'Bedeutung wird neu berechnet – du kannst weiterarbeiten',
      load: 'Modell laden', cancel: 'Abbrechen', remove: 'Modell entfernen', retry: 'Erneut starten', einordnen: 'Einordnen ({n})', stop: 'Einordnen anhalten',
      offline: 'Die App ist vom Internet getrennt. Zum Laden die Lampe oben auf Grün stellen.', space: 'Zu wenig freier Speicher auf dem Gerät.',
      busy: 'Es lädt gerade ein anderes Modell. Bitte warten.', failed: 'Laden hat nicht geklappt: {why}. Nochmal „Modell laden“ tippen, es geht dort weiter.',
      confirmRemove: 'Größeres Modell und seine eingeordneten Werte vom Gerät entfernen? Die Suche nutzt dann das kleine Modell.' },
    en: { title: 'Larger model for the search in the app', aus: 'Off', mittel: 'Medium', gross: 'Large', empfohlen: 'recommended',
      passt: 'fits', knapp: 'tight', nein: 'not recommended',
      info: 'Besides the model for Mycel and seal, the search in this app can use a larger model: Medium (multilingual-e5-base, about {mMb} MB) or Large (multilingual-e5-large, about {gMb} MB). Mycel, seal and other devices keep the small model. Whether the larger model finds better in your files is not measured: the small sample in the learning run found the same hits with all three levels. After loading, tap “Index”: the app computes every file once more, in the background, can be cancelled. The values stay on the device, apart from the small model. Nothing starts by itself.',
      offText: 'Off: search uses the model for Mycel and seal.',
      none: 'Not loaded yet. About {mb} MB once, ideally on Wi-Fi.', partial: 'Partly loaded ({done} of {mb} MB). “Load model” continues there.',
      loading: 'Loading: {done} of {mb} MB ({pct} %) · {source}', checking: 'Checking …',
      ready: 'Loaded and checked ({mb} MB).', starting: 'Model is starting …',
      startFailed: 'The model is there but did not start. Search uses the small model.',
      crashed: 'The view ended while the model was starting last time (probably not enough memory). It will not start by itself.',
      offen: '{n} of {m} files indexed. Until all are indexed, search uses the small model.',
      aktiv: 'Active: all {m} files indexed, search uses the larger model.',
      job: 'Indexing: {i} of {n}', jobStop: 'Indexing paused ({i} of {n}). “Index” continues there.', jobFehler: 'Indexing not possible: {why}',
      bgTitle: 'Indexing (larger model)', bgText: 'Computing meaning again – you can keep working',
      load: 'Load model', cancel: 'Cancel', remove: 'Remove model', retry: 'Start again', einordnen: 'Index ({n})', stop: 'Pause indexing',
      offline: 'The app is cut off from the internet. Turn the lamp at the top green to load.', space: 'Not enough free storage on the device.',
      busy: 'Another model is loading. Please wait.', failed: 'Loading failed: {why}. Tap “Load model” again, it continues there.',
      confirmRemove: 'Remove the larger model and its indexed values from the device? Search goes back to the small model.' },
    ru: { title: 'Большая модель для поиска в приложении', aus: 'Выкл.', mittel: 'Средняя', gross: 'Большая', empfohlen: 'рекомендуется',
      passt: 'подходит', knapp: 'на пределе', nein: 'не рекомендуется',
      info: 'Помимо модели для Mycel и печати, поиск в этом приложении может использовать большую модель: Средняя (multilingual-e5-base, около {mMb} МБ) или Большая (multilingual-e5-large, около {gMb} МБ). Mycel, печать и другие устройства остаются на малой модели. Находит ли большая модель лучше в ваших файлах, не измерено. После загрузки нажмите «Индексировать»: приложение заново обработает каждый файл в фоне, можно прервать. Значения остаются на устройстве. Само ничего не запускается.',
      offText: 'Выкл.: поиск использует модель для Mycel и печати.',
      none: 'Ещё не загружена. Один раз около {mb} МБ, лучше по Wi-Fi.', partial: 'Загружено частично ({done} из {mb} МБ). «Загрузить модель» продолжит.',
      loading: 'Загрузка: {done} из {mb} МБ ({pct} %) · {source}', checking: 'Проверка …',
      ready: 'Загружена и проверена ({mb} МБ).', starting: 'Модель запускается …',
      startFailed: 'Модель есть, но не запустилась. Поиск использует малую модель.',
      crashed: 'При последнем запуске модели окно закрылось (вероятно, мало памяти). Сама она больше не запускается.',
      offen: 'Проиндексировано {n} из {m} файлов. Пока не все, поиск использует малую модель.',
      aktiv: 'Активна: все {m} файлов проиндексированы, поиск использует большую модель.',
      job: 'Индексирование: {i} из {n}', jobStop: 'Индексирование приостановлено ({i} из {n}).', jobFehler: 'Индексирование невозможно: {why}',
      bgTitle: 'Индексирование (большая модель)', bgText: 'Смысл вычисляется заново – можно продолжать работу',
      load: 'Загрузить модель', cancel: 'Отмена', remove: 'Удалить модель', retry: 'Запустить снова', einordnen: 'Индексировать ({n})', stop: 'Приостановить',
      offline: 'Приложение отключено от интернета. Для загрузки переключите лампу вверху на зелёный.', space: 'Недостаточно свободной памяти.',
      busy: 'Сейчас загружается другая модель. Подождите.', failed: 'Загрузка не удалась: {why}. Нажмите «Загрузить модель» ещё раз.',
      confirmRemove: 'Удалить большую модель и её значения с устройства? Поиск вернётся к малой модели.' },
    pl: { title: 'Większy model do wyszukiwania w aplikacji', aus: 'Wył.', mittel: 'Średni', gross: 'Duży', empfohlen: 'zalecane',
      passt: 'pasuje', knapp: 'na granicy', nein: 'niezalecane',
      info: 'Oprócz modelu dla Mycel i pieczęci wyszukiwanie w tej aplikacji może używać większego modelu: Średni (multilingual-e5-base, około {mMb} MB) lub Duży (multilingual-e5-large, około {gMb} MB). Mycel, pieczęć i inne urządzenia zostają przy małym modelu. Czy większy model znajduje lepiej w twoich plikach, nie zmierzono. Po pobraniu stuknij „Indeksuj”: aplikacja przeliczy każdy plik jeszcze raz w tle, można przerwać. Wartości zostają na urządzeniu. Nic nie uruchamia się samo.',
      offText: 'Wył.: wyszukiwanie używa modelu dla Mycel i pieczęci.',
      none: 'Jeszcze nie pobrany. Jednorazowo około {mb} MB, najlepiej przez Wi-Fi.', partial: 'Pobrano częściowo ({done} z {mb} MB). „Pobierz model” kontynuuje.',
      loading: 'Pobieranie: {done} z {mb} MB ({pct} %) · {source}', checking: 'Sprawdzanie …',
      ready: 'Pobrany i sprawdzony ({mb} MB).', starting: 'Model się uruchamia …',
      startFailed: 'Model jest, ale się nie uruchomił. Wyszukiwanie używa małego modelu.',
      crashed: 'Przy ostatnim uruchomieniu modelu widok został zamknięty (prawdopodobnie za mało pamięci). Nie uruchomi się sam.',
      offen: 'Zindeksowano {n} z {m} plików. Do tego czasu wyszukiwanie używa małego modelu.',
      aktiv: 'Aktywny: wszystkie {m} pliki zindeksowane, wyszukiwanie używa większego modelu.',
      job: 'Indeksowanie: {i} z {n}', jobStop: 'Indeksowanie wstrzymane ({i} z {n}).', jobFehler: 'Indeksowanie niemożliwe: {why}',
      bgTitle: 'Indeksowanie (większy model)', bgText: 'Znaczenie jest liczone od nowa – możesz dalej pracować',
      load: 'Pobierz model', cancel: 'Anuluj', remove: 'Usuń model', retry: 'Uruchom ponownie', einordnen: 'Indeksuj ({n})', stop: 'Wstrzymaj',
      offline: 'Aplikacja jest odłączona od internetu. Aby pobrać, przełącz lampkę u góry na zielono.', space: 'Za mało wolnego miejsca.',
      busy: 'Pobierany jest inny model. Proszę czekać.', failed: 'Pobieranie nie powiodło się: {why}. Stuknij „Pobierz model” ponownie.',
      confirmRemove: 'Usunąć większy model i jego wartości z urządzenia? Wyszukiwanie wróci do małego modelu.' }
  };
  const t = (k, v = {}) => String(((W[document.documentElement.lang] || W.de)[k]) ?? W.de[k] ?? k).replace(/\{(\w+)\}/g, (_, n) => v[n] ?? '');
  const mb = n => String(Math.round((n || 0) / 1048576));

  // ---------- state ----------
  let pins = null;                                  // meaning-models.json (ids, revisions, sizes)
  let native = { stages: {}, running: '' };         // ProMeaning.getState()
  let live = null, message = '', geraet = null;
  let wahl = '';
  try { wahl = STUFEN.includes(localStorage.getItem(WAHL)) ? localStorage.getItem(WAHL) : ''; } catch { /* ohne Merken */ }
  const st = s => native.stages?.[s] || { installed: false, running: false, present: 0, total: 0, crashes: 0 };
  const modelId = s => pins?.models?.[s]?.id || (s === 'gross' ? 'Xenova/multilingual-e5-large' : 'Xenova/multilingual-e5-base');
  const revision = s => pins?.models?.[s]?.revision || '';
  const dim = s => pins?.models?.[s]?.dim || (s === 'gross' ? 1024 : 768);
  const pinBytes = s => { const m = pins?.models?.[s], l = pins?.library; if (!m) return 0; let n = 0; for (const v of Object.values(m.sizes || {})) n += v; for (const v of Object.values(l?.sizes || {})) n += v; return n; };
  const totalOf = s => st(s).total || pinBytes(s);

  // ---------- vector store (own IndexedDB, one table per stage) ----------
  let dbp = null;
  function db() {
    if (dbp) return dbp;
    dbp = new Promise((resolve, reject) => {
      const r = indexedDB.open(DB, 1);
      r.onupgradeneeded = () => { for (const s of STUFEN) if (!r.result.objectStoreNames.contains(s)) r.result.createObjectStore(s, { keyPath: 'h' }); };
      r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error);
    });
    return dbp;
  }
  async function tx(stage, mode, fn) {
    const d = await db();
    return new Promise((resolve, reject) => { const x = d.transaction(stage, mode), s = x.objectStore(stage); const out = fn(s); x.oncomplete = () => resolve(out?.result ?? out); x.onerror = () => reject(x.error); x.onabort = () => reject(x.error); });
  }
  const vectors = { stage: '', map: new Map() };   // hash → { t, m, v: Float32Array }
  async function loadVectors(stage) {
    vectors.stage = stage; vectors.map = new Map();
    if (!stage) return;
    try {
      const all = await tx(stage, 'readonly', s => s.getAll());
      if (vectors.stage !== stage) return;
      for (const row of all || []) if (row && row.v && row.v.length === dim(stage)) vectors.map.set(row.h, row);
    } catch { /* keine Ablage: nichts eingeordnet */ }
  }

  // ---------- which catalogue entries count, and the key of their text ----------
  const catalog = () => (typeof CATALOG !== 'undefined' && Array.isArray(CATALOG)) ? CATALOG : [];
  const passage = r => (typeof window.passageText === 'function' ? window.passageText(r) : ((r.name || '') + '. ' + (r.snippet || '')).slice(0, 1600));
  function key(text) { let h = 0x811c9dc5; for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return text.length + ':' + h.toString(16); }
  const counts = r => !!(r && (r.snippet || r.name));
  // The key of an entry's text, remembered per entry while its text stays the same (search and counting call this often).
  const keys = new WeakMap();
  function keyOf(r) { const p = passage(r), c = keys.get(r); if (c && c.p === p) return c.k; const k = key(p); keys.set(r, { p, k }); return k; }
  function vecOf(r) {
    const row = r && vectors.map.get(r.hash);
    if (!row || row.m !== revision(vectors.stage) || row.t !== keyOf(r)) return null;
    return row.v;
  }
  function stand() {
    let n = 0, m = 0;
    for (const r of catalog()) { if (!counts(r)) continue; m++; if (vecOf(r)) n++; }
    return { n, m, komplett: m > 0 && n === m };
  }

  // ---------- the model: a worker of its own (Modul 03 keeps its own worker and model) ----------
  let worker = null, workerStage = '', starting = null, phase = '', nextId = 0;
  const pending = new Map();
  function workerSource() {
    return [
      '"use strict";', 'let pipe=null;',
      'self.onmessage=async function(e){', '  const m=e.data; if(!m) return;',
      '  try{',
      '    if(m.type==="init"){ const T=await import(m.lib); const env=T.env; env.allowLocalModels=true; env.localModelPath=m.root; env.allowRemoteModels=false; env.useBrowserCache=false;',
      '      pipe=await T.pipeline("feature-extraction",m.id,{quantized:true}); self.postMessage({id:m.id2,ok:true}); return; }',
      '    if(m.type==="embed"){ const out=[]; for(const s of m.texts){ const r=await pipe(s,{pooling:"mean",normalize:true}); out.push(new Float32Array(r.data)); } self.postMessage({id:m.id2,ok:true,vecs:out}); }',
      '  }catch(err){ self.postMessage({id:m.id2,error:String((err&&err.message)||err)}); }',
      '};'
    ].join('\n');
  }
  function call(msg) {
    return new Promise((resolve, reject) => { const id2 = ++nextId; pending.set(id2, { resolve, reject }); worker.postMessage({ ...msg, id2 }); });
  }
  function stopWorker() {
    try { worker?.terminate(); } catch { /* weg */ }
    worker = null; workerStage = ''; phase = '';
    for (const p of pending.values()) p.reject(new Error('stopped')); pending.clear();
  }
  async function embed(texts) {
    const stub = window.__PB_MEANING_STUB__;
    if (stub) return (await stub.embed(texts, workerStage)).map(v => Float32Array.from(v));
    return (await call({ type: 'embed', texts })).vecs;
  }
  // Starts the chosen stage (guarded like the other models: a renderer end until markLoaded counts as a crash).
  function starten(stage) {
    if (workerStage === stage && phase === 'active') return Promise.resolve(true);
    if (starting) return starting;
    if (!st(stage).installed || st(stage).crashes > 0) return Promise.resolve(false);
    starting = (async () => {
      stopWorker(); workerStage = stage; phase = 'starting'; render();
      try { await plugin.markLoading({ stage }); } catch { /* weiter */ }
      let ok = false;
      try {
        if (window.__PB_MEANING_STUB__) { await window.__PB_MEANING_STUB__.init?.(stage); ok = true; }
        else {
          const url = URL.createObjectURL(new Blob([workerSource()], { type: 'text/javascript' }));
          worker = new Worker(url, { type: 'module' });
          worker.onmessage = e => { const p = pending.get(e.data?.id); if (!p) return; pending.delete(e.data.id); e.data.error ? p.reject(new Error(e.data.error)) : p.resolve(e.data); };
          worker.onerror = e => { for (const p of pending.values()) p.reject(new Error(e?.message || 'worker')); pending.clear(); };
          await call({ type: 'init', lib: LIB, root: ROOT, id: modelId(stage) });
          ok = true;
        }
      } catch { ok = false; }
      if (workerStage !== stage) return false;          // a newer choice took over
      phase = ok ? 'active' : 'startFailed';
      if (!ok) { try { worker?.terminate(); } catch {} worker = null; }
      try { native = await plugin.markLoaded({ stage }); } catch { /* weiter */ }
      render();
      if (ok) rerun();
      return ok;
    })().finally(() => { starting = null; });
    return starting;
  }
  function rerun() { try { const q = document.getElementById('q'); if (q && q.value.trim() && typeof renderResults === 'function') renderResults(q.value); } catch { /* ohne Suche */ } }

  const fragen = new Map();   // query vectors of the current stage (as embedQueryCached does for Modul 03)
  // ---------- Einordnen: on a tap only, file by file, as a background task ----------
  let job = null;   // { stage, i, n, abort: AbortController, task }
  async function einordnen() {
    const stage = wahl;
    if (!stage || job) return;
    message = '';
    const todo = catalog().filter(r => counts(r) && !vecOf(r));
    if (!todo.length) { render(); return; }
    job = { stage, i: 0, n: todo.length, abort: new AbortController(), task: null, ende: '' };
    render();
    if (!(await starten(stage))) { job = null; message = t('jobFehler', { why: t('startFailed') }); render(); return; }
    if (window.ProHintergrund) {
      try { job.task = await window.ProHintergrund.beginnen({ art: 'einordnen', titel: t('bgTitle'), text: t('bgText') }); job.task.signal.addEventListener('abort', () => job?.abort.abort(), { once: true }); } catch { job.task = null; }
    }
    const rev = revision(stage);
    try {
      for (let k = 0; k < todo.length; k += 4) {
        if (job.abort.signal.aborted || wahl !== stage) break;
        const batch = todo.slice(k, k + 4), texts = batch.map(r => passage(r));
        const vecs = await embed(texts.map(s => 'passage: ' + s));
        const rows = batch.map((r, j) => ({ h: r.hash, t: key(texts[j]), m: rev, v: vecs[j] })).filter(row => row.v && row.v.length === dim(stage));
        await tx(stage, 'readwrite', s => { for (const row of rows) s.put(row); });
        if (vectors.stage === stage) for (const row of rows) vectors.map.set(row.h, row);
        job.i = Math.min(todo.length, k + batch.length);
        job.task?.stand(t('job', { i: job.i, n: job.n }), job.i, job.n);
        render();
      }
      job.ende = job.i < job.n ? 'stop' : 'fertig';
    } catch (error) {
      job.ende = 'fehler'; message = t('jobFehler', { why: error?.message || '?' });
    } finally {
      const done = job; job = null; done.task?.ende();
      if (done.ende === 'stop') message = t('jobStop', { i: done.i, n: done.n });
      // Entries no longer in the catalogue: their values are dropped (only for the stage just indexed).
      try { const keep = new Set(catalog().map(r => r.hash)); const gone = [...vectors.map.keys()].filter(h => !keep.has(h)); if (gone.length && vectors.stage === done.stage) { await tx(done.stage, 'readwrite', s => { for (const h of gone) s.delete(h); }); for (const h of gone) vectors.map.delete(h); } } catch { /* nächstes Mal */ }
      render(); rerun();
    }
  }

  // ---------- download / remove ----------
  async function laden() {
    const stage = wahl; if (!stage) return;
    message = '';
    if (window.ProGeraet) { try { const v = await window.ProGeraet.vorDemLaden(GERAET[stage]); if (!v.weiter) { render(); return; } } catch { /* ohne Messung */ } }
    live = { stage, done: st(stage).present, total: totalOf(stage), source: '' }; render();
    try { native = await plugin.install({ stage }); live = null; }
    catch (error) {
      live = null; const code = error?.code || '';
      message = code === 'CANCELLED' ? '' : code === 'APP_OFFLINE' ? t('offline') : code === 'NO_SPACE' ? t('space') : code === 'BUSY' ? t('busy') : t('failed', { why: error?.message || code || '?' });
      await refresh(); return;
    }
    render();
  }
  async function entfernen() {
    const stage = wahl; if (!stage || !confirm(t('confirmRemove'))) return;
    if (job?.stage === stage) job.abort.abort();
    if (workerStage === stage) stopWorker();
    message = '';
    try { native = await plugin.remove({ stage }); } catch { /* Zustand neu lesen */ }
    try { await tx(stage, 'readwrite', s => s.clear()); } catch { /* leer */ }
    if (vectors.stage === stage) vectors.map = new Map();
    await refresh();
  }
  async function nochmal() { const stage = wahl; message = ''; try { native = await plugin.clearCrash({ stage }); } catch {} phase = ''; render(); }
  async function waehlen(stage) {
    if (stage === wahl) return;
    if (job) job.abort.abort();
    wahl = stage; message = ''; live = null;
    try { if (stage) localStorage.setItem(WAHL, stage); else localStorage.removeItem(WAHL); } catch { /* ohne Merken */ }
    if (workerStage && workerStage !== stage) stopWorker();
    await loadVectors(stage); render(); rerun();
  }

  // ---------- the box in Settings, under the model for Mycel/seal ----------
  let box = null;
  function el(tag, cls, text) { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
  function knopf(name, beiTipp) { const b = el('button', 'pro-knopf'); b.type = 'button'; b.dataset.meaning = name; b.addEventListener('click', beiTipp); return b; }
  function panel() {
    if (box?.isConnected) return box;
    const anchor = document.getElementById('pb-semantic') || document.getElementById('embFlag')?.closest('p');
    if (!anchor) return null;
    box = el('section', 'pb-semantic pb-meaning'); box.id = 'pb-meaning';
    const kopf = el('div', 'pro-kasten-kopf'), h = el('b', null); h.dataset.m = 'title'; kopf.append(h);
    let infoBox = el('p', 'pro-info-inhalt'); infoBox.dataset.m = 'info';
    if (window.ProBedienung?.info) { const i = window.ProBedienung.info('meaning-zweit', ''); kopf.append(i.knopf); infoBox = i.inhalt; infoBox.dataset.m = 'info'; }
    const wahlZeile = el('div', 'pb-meaning-wahl'); wahlZeile.setAttribute('role', 'radiogroup');
    for (const s of ['', ...STUFEN]) { const b = knopf('wahl-' + (s || 'aus'), () => waehlen(s)); b.dataset.stufe = s; b.setAttribute('role', 'radio'); wahlZeile.append(b); }
    const geraetZeile = el('p', 'pb-semantic-geraet'); geraetZeile.dataset.m = 'geraet';
    const bar = el('div', 'pb-semantic-bar'); bar.append(el('span')); bar.hidden = true;
    const text = el('p'); text.dataset.m = 'text'; text.setAttribute('role', 'status');
    const actions = el('div', 'pb-semantic-actions');
    actions.append(knopf('load', laden), knopf('cancel', () => plugin.cancel({ stage: wahl }).catch(() => {})), knopf('einordnen', einordnen),
      knopf('stop', () => job?.abort.abort()), knopf('retry', nochmal), knopf('remove', entfernen));
    box.append(kopf, infoBox, wahlZeile, geraetZeile, bar, text, actions);
    anchor.after(box);
    // The catalogue changes elsewhere (new files, changed texts): count again whenever the box comes into view.
    try { new IntersectionObserver(e => { if (e.some(x => x.isIntersecting)) render(); }).observe(box); } catch { /* ohne Beobachter */ }
    return box;
  }

  function urteilText(s) {
    if (!geraet || !window.ProGeraet) return '';
    const u = window.ProGeraet.urteil(geraet, GERAET[s]);
    return u?.stand && u.stand !== 'unbekannt' && u.stand !== 'geplant' ? t(u.stand) : '';
  }
  function empfehlung() {
    if (!geraet || !window.ProGeraet) return '';
    for (const s of ['gross', 'mittel']) if (window.ProGeraet.urteil(geraet, GERAET[s])?.stand === 'passt') return s;
    return '';
  }

  function render() {
    const b = panel(); if (!b) return;
    const q = s => b.querySelector(s), btn = n => q(`[data-meaning="${n}"]`);
    q('[data-m="title"]').textContent = t('title');
    const info = q('[data-m="info"]'); info.textContent = ''; info.append(el('p', null, t('info', { mMb: mb(pinBytes('mittel')), gMb: mb(pinBytes('gross')) })));
    const rat = empfehlung();
    for (const w of b.querySelectorAll('[data-stufe]')) {
      const s = w.dataset.stufe, u = s ? urteilText(s) : '';
      w.textContent = (s ? t(s) : t('aus')) + (u ? ' · ' + u : '') + (s && s === rat ? ' · ' + t('empfohlen') : '');
      w.setAttribute('aria-checked', String(s === wahl)); w.dataset.gewaehlt = s === wahl ? '1' : '0';
    }
    const g = q('[data-m="geraet"]'); g.textContent = geraet && window.ProGeraet ? window.ProGeraet.werteText(geraet) + ' – ' + window.ProGeraet.wort('stufe', { s: window.ProGeraet.wort(geraet.stufe) }) : ''; g.hidden = !g.textContent;
    const s = wahl, z = st(s), total = totalOf(s), running = !!s && (z.running || native.running === s || live?.stage === s);
    let text = '', state = 'aus', next = '';
    const visible = new Set();
    if (!s) text = t('offText');
    else if (message && !running && !job) { text = message; state = 'hinweis'; }
    if (s && !(message && !running && !job)) {
      if (running) { const done = live?.done ?? z.present; text = done >= total && total ? t('checking') : t('loading', { done: mb(done), mb: mb(total), pct: total ? Math.min(100, Math.round(done / total * 100)) : 0, source: live?.source || '' }); state = 'loading'; }
      else if (z.installed && z.crashes > 0) { text = t('crashed'); state = 'crashed'; }
      else if (z.installed && phase === 'startFailed' && workerStage === s && !job) { text = t('startFailed'); state = 'startFailed'; }
      else if (job) { text = t('job', { i: job.i, n: job.n }); state = 'einordnen'; }
      else if (z.installed) { const x = stand(); text = phase === 'starting' && workerStage === s ? t('starting') : x.komplett ? t('aktiv', { m: x.m }) : t('ready', { mb: mb(total) }) + ' ' + t('offen', { n: x.n, m: x.m }); state = x.komplett ? 'aktiv' : 'bereit'; }
      else if (z.present > 0) { text = t('partial', { done: mb(z.present), mb: mb(total) }); state = 'partial'; }
      else { text = t('none', { mb: mb(total) }); state = 'none'; }
    }
    if (s && message && (running || job)) text = message + ' ' + text;
    q('[data-m="text"]').textContent = text;
    // Bar: download (MB) or indexing (files).
    const bar = q('.pb-semantic-bar'); let frac = -1;
    if (running) frac = total ? (live?.done ?? z.present) / total : 0;
    else if (job) frac = job.n ? job.i / job.n : 0;
    else if (s && !z.installed && z.present > 0 && total) frac = z.present / total;
    bar.hidden = frac < 0; bar.firstElementChild.style.width = frac < 0 ? '0' : `${Math.min(100, frac * 100).toFixed(1)}%`;
    if (frac >= 0) { bar.setAttribute('role', 'progressbar'); bar.setAttribute('aria-valuenow', String(Math.round(frac * 100))); }
    // Buttons: exactly one coloured next step.
    if (s) {
      if (running) visible.add('cancel');
      else if (job) visible.add('stop');
      else if (z.installed && z.crashes > 0) { visible.add('retry'); next = 'retry'; }
      else if (z.installed) { const x = stand(); if (!x.komplett && x.m > 0) { visible.add('einordnen'); next = 'einordnen'; btn('einordnen').textContent = t('einordnen', { n: x.m - x.n }); } }
      else { visible.add('load'); next = 'load'; }
      if (!running && !job && (z.installed || z.present > 0)) visible.add('remove');
    }
    for (const n of ['load', 'cancel', 'einordnen', 'stop', 'retry', 'remove']) {
      const k = btn(n); if (n !== 'einordnen') k.textContent = t(n);
      k.hidden = !visible.has(n);
      if (n === next) k.dataset.proHaupt = ''; else delete k.dataset.proHaupt;
    }
    b.dataset.state = state; b.dataset.stufe = s;
  }

  async function refresh() { try { native = await plugin.getState(); } catch { /* alter Stand */ } render(); }
  plugin.addListener?.('progress', p => { if (!p || !STUFEN.includes(p.stage)) return; live = { ...p }; render(); });

  window.PBMeaning = Object.freeze({
    /** True when the search may use the second model. Starts the model on first use (not at app start). */
    bereit() {
      const s = wahl; if (!s || job) return false;
      const z = st(s); if (!z.installed || z.crashes > 0) return false;
      if (!stand().komplett) return false;
      if (workerStage === s && phase === 'active') return true;
      if (!(workerStage === s && phase === 'startFailed')) starten(s);
      return false;
    },
    /** Query vector of the second model with its record lookup, or null (then Modul 03 as before). */
    async frage(query) {
      if (!this.bereit()) return null;
      const stage = wahl, k = stage + '\n' + String(query || '').trim().toLowerCase();
      let v = fragen.get(k);
      if (!v) { v = (await embed(['query: ' + String(query || '')]))[0]; if (fragen.size > 50) fragen.clear(); if (v) fragen.set(k, v); }
      if (!v || v.length !== dim(stage) || wahl !== stage) return null;
      const out = Array.from(v);
      Object.defineProperty(out, 'pbMeaning', { value: r => (vectors.stage === stage ? vecOf(r) : null) });
      Object.defineProperty(out, 'pbMeaningStage', { value: stage });
      return out;
    },
    get wahl() { return wahl; }, waehlen, laden, einordnen, entfernen, stand, refresh,
    get job() { return job ? { stage: job.stage, i: job.i, n: job.n } : null; },
    anhalten() { job?.abort.abort(); }
  });

  async function boot() {
    try { const r = await fetch('meaning-models.json'); if (r.ok) pins = await r.json(); } catch { /* Größen kommen aus ProMeaning */ }
    await loadVectors(wahl);
    await refresh();
    if (window.ProGeraet) { try { geraet = await window.ProGeraet.messen(); } catch { geraet = null; } render(); }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true }); else boot();
  new MutationObserver(render).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  // The settings page is rebuilt by the app in places; re-attach the box when it went missing.
  new MutationObserver(() => { if (box && !box.isConnected && document.getElementById('pb-semantic')) render(); }).observe(document.body, { childList: true, subtree: true });
})();
