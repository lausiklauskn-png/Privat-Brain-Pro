/* Bildbeschreibung – Sitzung 4 (Klaus 2026-10-26, Punkte 12–14 der Sammlung). Dieselbe Datei in Private Brain Pro
   (native/) und V3 (assets/) – nur gemeinsam ändern (cmp). Drei Dinge, alle am gemeinsamen Webteil, also in Android,
   Windows und PWA gleich:
   1. Eigene Worte: an jedem Bild (Suchergebnis, Explorer, Vorschau) ein kurzes Feld „Bildbeschreibung“, tippen oder
      einsprechen. Gespeichert als eigenes Feld r.userCaption – getrennt von der Beschreibung des Modells – und in den
      Suchtext aufgenommen (Stichwort- und Bedeutungssuche).
   2. Modell-Beschreibung getrennt gemerkt: was das Modell (oder Mistral) zu einem Bild sagt, steht weiter im Suchtext
      (r.snippet) und zusätzlich als r.caption – damit der Filter weiß, welche Bilder beschrieben sind.
   3. Suche: ein flacher Schalter „Bildbeschreibung“ zeigt nur beschriebene Bilder und sucht in beiden Beschreibungen.
   Dazu in den Apps der Schalter für das Bildmodell (ProCaption: laden, weitermachen, entfernen, Absturzschutz) und
   in der PWA ein ehrlicher Satz, was der Browser dafür aus dem Netz holt. Keine Emojis, Strichgrafiken. */
(() => {
  'use strict';
  if (window.PBBild) return;
  const MODEL = 'Xenova/vit-gpt2-image-captioning';
  const W = {
    de: { name: 'Bildbeschreibung', own: 'Eigene Worte zu diesem Bild', model: 'Vom Modell', saved: 'gespeichert',
      filterTip: 'Nur Bilder mit Bildbeschreibung zeigen und darin suchen', filterHelp: 'Findet Bilder nach dem, was das Modell erkannt hat, und nach deinen eigenen Worten. Ohne Suchwort stehen alle beschriebenen Bilder da.',
      appText: 'Beschreibt auf dem Gerät, was auf einem Foto zu sehen ist. Das Modell lädt die App einmal in ihren Speicher ({mb} MB), danach ohne Internet. Beim Beschreiben braucht es viel Arbeitsspeicher: gemessen {rss} MB im Browser eines Prüfrechners, am Tablet nicht gemessen. Eigene Worte brauchen kein Modell.',
      webText: 'Beschreibt im Browser, was auf einem Foto zu sehen ist. Der Browser lädt das Modell einmal von jsDelivr und Hugging Face ({mb} MB) und behält es. Beim Beschreiben braucht es viel Arbeitsspeicher: gemessen {rss} MB auf einem Prüfrechner, am Tablet nicht gemessen. Eigene Worte brauchen kein Modell.',
      switchLabel: 'Fotos vom Modell beschreiben lassen', load: 'Modell laden', cancel: 'Abbrechen', remove: 'Modell entfernen', retry: 'Erneut starten',
      none: 'Noch nicht geladen. Einmal etwa {mb} MB, am besten im WLAN. Danach ohne Internet.',
      partial: 'Teilweise geladen ({done} von {mb} MB). „Modell laden“ macht dort weiter.',
      loading: 'Wird geladen: {done} von {mb} MB · {source}', checking: 'Wird geprüft …',
      ready: 'Geladen und geprüft ({mb} MB). Mit dem Schalter oben beschreibt die App neue und wartende Fotos.',
      crashed: 'Beim letzten Start des Modells wurde die Ansicht beendet (vermutlich zu wenig Speicher). Es startet deshalb nicht von selbst.',
      offline: 'Die App ist vom Internet getrennt. Zum Laden die Lampe oben auf Grün stellen.',
      space: 'Zu wenig freier Speicher auf dem Gerät.', failed: 'Laden hat nicht geklappt: {why}. Nochmal „Modell laden“ tippen, es geht dort weiter.',
      noPins: 'Dieser Bau kennt die Fingerabdrücke des Modells nicht.',
      confirmRemove: 'Bildmodell vom Gerät entfernen? Eigene Worte bleiben. Es kann jederzeit neu geladen werden.',
      notLoaded: 'Das Bildmodell ist noch nicht geladen – unten „Modell laden“ tippen. Eigene Worte gehen immer.',
      dictate: 'Einsprechen', listening: 'Zuhören …', noMic: 'Spracheingabe kann dieser Browser nicht. Tippen geht immer.' },
    en: { name: 'Image description', own: 'Your own words for this image', model: 'From the model', saved: 'saved',
      filterTip: 'Show only images with a description and search in it', filterHelp: 'Finds images by what the model recognised and by your own words. Without a search word, every described image is listed.',
      appText: 'Describes on the device what a photo shows. The app loads the model once into its storage ({mb} MB), afterwards without internet. Describing needs a lot of memory: {rss} MB measured in the browser of a test machine, not measured on the tablet. Your own words need no model.',
      webText: 'Describes in the browser what a photo shows. The browser loads the model once from jsDelivr and Hugging Face ({mb} MB) and keeps it. Describing needs a lot of memory: {rss} MB measured on a test machine, not measured on the tablet. Your own words need no model.',
      switchLabel: 'Let the model describe photos', load: 'Load model', cancel: 'Cancel', remove: 'Remove model', retry: 'Start again',
      none: 'Not loaded yet. About {mb} MB once, ideally on Wi-Fi. Works without internet afterwards.',
      partial: 'Partly loaded ({done} of {mb} MB). “Load model” continues there.',
      loading: 'Loading: {done} of {mb} MB · {source}', checking: 'Checking …',
      ready: 'Loaded and checked ({mb} MB). With the switch above the app describes new and waiting photos.',
      crashed: 'The view ended while the model was starting last time (probably not enough memory). It will not start by itself.',
      offline: 'The app is cut off from the internet. Turn the lamp at the top green to load.',
      space: 'Not enough free storage on the device.', failed: 'Loading failed: {why}. Tap “Load model” again, it continues there.',
      noPins: 'This build does not know the model’s fingerprints.',
      confirmRemove: 'Remove the image model from the device? Your own words stay. It can be loaded again any time.',
      notLoaded: 'The image model is not loaded yet – tap “Load model” below. Your own words always work.',
      dictate: 'Dictate', listening: 'Listening …', noMic: 'This browser cannot do voice input. Typing always works.' },
    ru: { name: 'Описание изображения', own: 'Ваши слова об этом изображении', model: 'От модели', saved: 'сохранено',
      filterTip: 'Показывать только изображения с описанием и искать в нём', filterHelp: 'Находит изображения по тому, что распознала модель, и по вашим словам. Без слова поиска показаны все описанные изображения.',
      appText: 'Описывает на устройстве, что видно на фото. Приложение один раз загружает модель в своё хранилище ({mb} МБ), потом без интернета. Описание требует много памяти: измерено {rss} МБ в браузере тестовой машины, на планшете не измерено. Ваши слова модели не требуют.',
      webText: 'Описывает в браузере, что видно на фото. Браузер один раз загружает модель с jsDelivr и Hugging Face ({mb} МБ) и хранит её. Описание требует много памяти: измерено {rss} МБ на тестовой машине, на планшете не измерено. Ваши слова модели не требуют.',
      switchLabel: 'Описывать фото моделью', load: 'Загрузить модель', cancel: 'Отмена', remove: 'Удалить модель', retry: 'Запустить снова',
      none: 'Ещё не загружена. Один раз около {mb} МБ, лучше по Wi-Fi. Потом без интернета.',
      partial: 'Загружено частично ({done} из {mb} МБ). «Загрузить модель» продолжит.',
      loading: 'Загрузка: {done} из {mb} МБ · {source}', checking: 'Проверка …',
      ready: 'Загружена и проверена ({mb} МБ). С переключателем выше приложение описывает новые и ожидающие фото.',
      crashed: 'При последнем запуске модели окно закрылось (вероятно, мало памяти). Сама она больше не запускается.',
      offline: 'Приложение отключено от интернета. Для загрузки переключите лампу вверху на зелёный.',
      space: 'Недостаточно свободной памяти.', failed: 'Загрузка не удалась: {why}. Нажмите «Загрузить модель» ещё раз.',
      noPins: 'Эта сборка не знает отпечатков модели.',
      confirmRemove: 'Удалить модель изображений с устройства? Ваши слова останутся. Её можно загрузить снова.',
      notLoaded: 'Модель изображений ещё не загружена — нажмите «Загрузить модель» ниже. Ваши слова работают всегда.',
      dictate: 'Надиктовать', listening: 'Слушаю …', noMic: 'Этот браузер не умеет голосовой ввод. Ввод текста работает всегда.' },
    pl: { name: 'Opis obrazu', own: 'Twoje słowa do tego obrazu', model: 'Od modelu', saved: 'zapisano',
      filterTip: 'Pokaż tylko obrazy z opisem i szukaj w nim', filterHelp: 'Znajduje obrazy po tym, co rozpoznał model, i po Twoich słowach. Bez słowa wyszukiwania widać wszystkie opisane obrazy.',
      appText: 'Opisuje na urządzeniu, co widać na zdjęciu. Aplikacja pobiera model raz do swojej pamięci ({mb} MB), potem bez internetu. Opisywanie wymaga dużo pamięci: zmierzono {rss} MB w przeglądarce maszyny testowej, na tablecie nie zmierzono. Twoje słowa nie potrzebują modelu.',
      webText: 'Opisuje w przeglądarce, co widać na zdjęciu. Przeglądarka pobiera model raz z jsDelivr i Hugging Face ({mb} MB) i go zachowuje. Opisywanie wymaga dużo pamięci: zmierzono {rss} MB na maszynie testowej, na tablecie nie zmierzono. Twoje słowa nie potrzebują modelu.',
      switchLabel: 'Opisywać zdjęcia modelem', load: 'Pobierz model', cancel: 'Anuluj', remove: 'Usuń model', retry: 'Uruchom ponownie',
      none: 'Jeszcze nie pobrany. Jednorazowo około {mb} MB, najlepiej przez Wi-Fi. Potem bez internetu.',
      partial: 'Pobrano częściowo ({done} z {mb} MB). „Pobierz model” kontynuuje.',
      loading: 'Pobieranie: {done} z {mb} MB · {source}', checking: 'Sprawdzanie …',
      ready: 'Pobrany i sprawdzony ({mb} MB). Z przełącznikiem powyżej aplikacja opisuje nowe i oczekujące zdjęcia.',
      crashed: 'Przy ostatnim uruchomieniu modelu widok został zamknięty (prawdopodobnie za mało pamięci). Nie uruchomi się sam.',
      offline: 'Aplikacja jest odłączona od internetu. Aby pobrać, przełącz lampkę u góry na zielono.',
      space: 'Za mało wolnego miejsca.', failed: 'Pobieranie nie powiodło się: {why}. Stuknij „Pobierz model” ponownie.',
      noPins: 'Ta kompilacja nie zna odcisków modelu.',
      confirmRemove: 'Usunąć model obrazów z urządzenia? Twoje słowa zostają. Można go pobrać ponownie.',
      notLoaded: 'Model obrazów nie jest jeszcze pobrany – stuknij „Pobierz model” poniżej. Twoje słowa działają zawsze.',
      dictate: 'Dyktuj', listening: 'Słucham …', noMic: 'Ta przeglądarka nie obsługuje wprowadzania głosowego. Pisanie zawsze działa.' }
  };
  const lang = () => (String(document.documentElement.lang || 'de').slice(0, 2));
  const t = (k, v = {}) => ((W[lang()] || W.de)[k] || W.de[k]).replace(/\{(\w+)\}/g, (_, n) => v[n] ?? '');
  const mb = n => String(Math.round((n || 0) / 1048576));
  // Download size and memory from the learn run (tools/native/caption-model.json); until it is read, the measured values of 2026-10-26.
  let facts = { mb: 256, rss: 1217, total: 268302883 };
  fetch('caption-model.json').then(r => r.ok ? r.json() : null).then(j => {
    if (!j) return; const m = j.measured || {}; const total = (j.sizes ? Object.values(j.sizes).reduce((a, b) => a + (b || 0), 0) : 0) || facts.total;
    facts = { mb: Math.round(total / 1048576), rss: m.rendererRssPeakMB || facts.rss, total }; paintSettings(); renderPanel();
  }).catch(() => {});

  const catalog = () => (typeof CATALOG !== 'undefined' && Array.isArray(CATALOG)) ? CATALOG : [];
  const record = hash => catalog().find(r => r.hash === hash);
  const IMAGE = /^(png|jpe?g|webp|gif|bmp|tiff?|avif)$/i;
  const isImage = r => !!r && !r.mail && r.mailBody == null && (IMAGE.test(String(r.ext || '')) || /^image\//.test(String(r.type || '')));
  const described = r => !!r && !!(String(r.caption || '').trim() || String(r.userCaption || '').trim() || /Bild-Beschreibung/.test(String(r.via || '')));
  const fold = s => (typeof window.fold === 'function' ? window.fold(s) : String(s || '').toLowerCase());
  const toks = s => (typeof window.tokens === 'function' ? window.tokens(s) : String(s || '').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean));
  // Only write when the text changes: a repaint must not produce child-list mutations (test-help counts them after PBHelp.refresh()).
  const setText = (el, v) => { if (el && el.textContent !== v) el.textContent = v; };
  const svg = (d, size = 16) => { const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('aria-hidden', 'true'); s.setAttribute('focusable', 'false'); s.setAttribute('width', size); s.setAttribute('height', size); s.classList.add('pb-bild-icon'); const p = document.createElementNS(s.namespaceURI, 'path'); p.setAttribute('d', d); s.append(p); return s; };
  const ICON = { image: 'M3 3h18v18H3Z m1 14 5-6 4 4 3-3 5 5 M8 7h.1', mic: 'M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3Z M5 10v2a7 7 0 0 0 14 0v-2 M12 19v3m-4 0h8' };

  /* ---------- 1. The catalogue: own words in the index, the model's caption as its own field ---------- */
  const indexText = r => (String(r.name || '') + ' ').repeat(2) + ' ' + String(r.snippet || '') + ' ' + String(r.userCaption || '');
  const original = {};
  for (const name of ['rebuildIndex', 'passageText', 'passesFilter', 'filterActive', 'search', 'bestCaption', 'idbPut', 'loadCaptionScript']) original[name] = typeof window[name] === 'function' ? window[name] : null;
  if (original.rebuildIndex) window.rebuildIndex = function () {
    if (typeof buildVector === 'function' && typeof termFreq === 'function') for (const r of catalog()) if (String(r.userCaption || '').trim()) { const tk = toks(indexText(r)); r.vector = buildVector(tk); r.tf = termFreq(tk); }
    return original.rebuildIndex.apply(this, arguments);
  };
  // The meaning model embeds name, text and the own words (Klaus: the own words are searched with the image).
  if (original.passageText) window.passageText = r => ((r.name || '') + '. ' + (r.snippet || '') + (String(r.userCaption || '').trim() ? '. ' + r.userCaption : '')).slice(0, 1600);
  // What the model (or Mistral) said is remembered as r.caption, next to the search text it already joins.
  let pending = null;
  if (original.bestCaption) window.bestCaption = async function () { const bc = await original.bestCaption.apply(this, arguments); pending = bc && bc.text ? { text: bc.text, src: bc.src, at: Date.now() } : null; return bc; };
  if (original.idbPut) window.idbPut = function (store, val) {
    if (store === 'catalog' && pending && val && isImage(val) && /Bild-Beschreibung/.test(String(val.via || '')) && Date.now() - pending.at < 120000) {
      if (val.caption !== pending.text) { val.caption = pending.text; val.captionSrc = pending.src; }
      pending = null;
    }
    return original.idbPut.apply(this, arguments);
  };
  let saveTimer = 0;
  async function setOwn(hash, text) {
    const r = record(hash); if (!r) return false;
    const value = String(text || '').replace(/\s+/g, ' ').trim().slice(0, 500);
    if ((r.userCaption || '') === value) return true;
    if (value) r.userCaption = value; else delete r.userCaption;
    r.evec = null;                                   // the meaning model embeds the new text in its next backfill
    if (typeof rebuildIndex === 'function') rebuildIndex();
    try { if (typeof idbPut === 'function') await idbPut('catalog', r); } catch {}
    clearTimeout(saveTimer); saveTimer = setTimeout(() => { try { if (typeof embedBackfill === 'function') embedBackfill(); } catch {} }, 1500);
    for (const node of document.querySelectorAll(`.pb-bild[data-hash="${hash}"]`)) paintField(node, r);
    return true;
  }

  /* ---------- 3. The search: a flat switch „Bildbeschreibung“ ---------- */
  const STORE = 'pb_bild_filter_v1';
  let filterOn = false; try { filterOn = localStorage.getItem(STORE) === '1'; } catch {}
  const matchesOwn = (r, q, words) => { const hay = fold(String(r.caption || '') + ' ' + String(r.userCaption || '') + ' ' + String(r.snippet || '')); return (q && hay.includes(q)) || (words.length > 0 && words.every(w => hay.includes(w))); };
  if (original.passesFilter) window.passesFilter = function (r) { if (filterOn && !(isImage(r) && described(r))) return false; return original.passesFilter.apply(this, arguments); };
  if (original.filterActive) window.filterActive = function () { return original.filterActive.apply(this, arguments) || filterOn; };
  if (original.search) window.search = function (query, qe) {
    const hits = original.search.apply(this, arguments);
    if (!filterOn || (typeof MODE !== 'undefined' && MODE !== 'name')) return hits;
    // Name search with the switch on: the descriptions count like the name.
    const q = fold(String(query || '').trim()), words = toks(query), seen = new Set(hits.map(h => h.r.hash));
    for (const r of catalog()) if (!seen.has(r.hash) && isImage(r) && described(r) && matchesOwn(r, q, words)) hits.push({ r, score: 1.5, why: { name: true, terms: words.length ? words : [q] }, kind: 'name' });
    return hits.sort((a, b) => b.score - a.score || (b.r.date || 0) - (a.r.date || 0));
  };
  function setFilter(on) {
    filterOn = !!on; try { localStorage.setItem(STORE, filterOn ? '1' : '0'); } catch {}
    paintFilter();
    try { const q = document.getElementById('q'); if (typeof renderResults === 'function') renderResults(q ? q.value : ''); } catch {}
  }
  function paintFilter() {
    const b = document.getElementById('pb-bild-filter'); if (!b) return;
    b.setAttribute('aria-pressed', String(filterOn)); b.classList.toggle('on', filterOn);
    setText(b.querySelector('.pb-bild-filter-label'), t('name')); b.title = t('filterTip'); b.setAttribute('aria-label', t('filterTip'));
    const help = document.getElementById('pb-bild-filter-help'); if (help) setText(help, t('filterHelp'));
  }
  // The same ⓘ as everywhere (Sitzung 3): open the first time, remembered under pb_help_open_v1.
  const HELP = 'pb_help_open_v1', helpKey = 'bild-filter';
  const helpOpen = () => { try { const v = JSON.parse(localStorage.getItem(HELP) || 'null'); return v && typeof v[helpKey] === 'boolean' ? v[helpKey] : true; } catch { return true; } };
  const helpRemember = open => { try { const v = JSON.parse(localStorage.getItem(HELP) || 'null') || {}; v[helpKey] = !!open; localStorage.setItem(HELP, JSON.stringify(v)); } catch {} };
  function mountFilter() {
    const box = document.querySelector('#panel-search .searchbox'); if (!box || document.getElementById('pb-bild-filter')) return;
    const b = document.createElement('button'); b.type = 'button'; b.id = 'pb-bild-filter'; b.className = 'pb-bild-filter';
    b.append(svg(ICON.image), Object.assign(document.createElement('span'), { className: 'pb-bild-filter-label' }));
    b.addEventListener('click', () => setFilter(!filterOn));
    const info = document.createElement('button'); info.type = 'button'; info.className = 'pb-help-toggle pb-bild-help-toggle'; info.dataset.pbHelpToggle = helpKey;
    const circle = svg('M12 10v7m0-10v.01', 20); const c = document.createElementNS(circle.namespaceURI, 'circle'); c.setAttribute('cx', '12'); c.setAttribute('cy', '12'); c.setAttribute('r', '9'); circle.prepend(c); info.append(circle);
    const help = document.createElement('div'); help.id = 'pb-bild-filter-help'; help.className = 'pb-help-content pb-bild-help'; help.dataset.pbHelpContent = helpKey; help.setAttribute('role', 'region');
    info.setAttribute('aria-controls', help.id);
    const open = show => { help.hidden = !show; info.setAttribute('aria-expanded', String(show)); const w = { de: ['Hilfe anzeigen', 'Hilfe ausblenden'], en: ['Show help', 'Hide help'], ru: ['Показать справку', 'Скрыть справку'], pl: ['Pokaż pomoc', 'Ukryj pomoc'] }; info.title = (w[lang()] || w.de)[show ? 1 : 0]; info.setAttribute('aria-label', t('name') + ': ' + info.title); };
    info.addEventListener('click', () => { open(help.hidden); helpRemember(!help.hidden); });
    open(helpOpen());
    // Own flat row right under the search box: inside the box the open explanation made the box 90 px high on the
    // desktop and, in the phone grid, fell into a 32 px column (measured: 2 500 px high).
    const row = document.createElement('div'); row.id = 'pb-bild-row'; row.className = 'pb-bild-row';
    row.append(b, info, help);
    box.after(row);
    paintFilter();
  }

  /* ---------- 2. The field at every image: own words, typed or dictated ---------- */
  const drafts = new Map(), timers = new Map();
  function paintField(node, r) {
    setText(node.querySelector('.pb-bild-label-text'), t('name'));
    const model = node.querySelector('.pb-bild-model');
    const caption = String(r.caption || '').trim();
    model.hidden = !caption; setText(model, caption ? t('model') + ': ' + caption : '');
    const own = node.querySelector('.pb-bild-own');
    own.placeholder = t('own'); own.setAttribute('aria-label', t('name') + ' – ' + t('own'));
    const value = drafts.has(r.hash) ? drafts.get(r.hash) : String(r.userCaption || '');
    if (document.activeElement !== own && own.value !== value) own.value = value;
    const mic = node.querySelector('.pb-bild-mic'); if (mic) { mic.title = t('dictate'); mic.setAttribute('aria-label', t('dictate') + ': ' + t('name')); }
  }
  const nativeSpeech = () => !!(window.Capacitor?.Plugins?.ProSpeech);
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  function ownMic(field) {
    // The apps hang Android's or Windows' own dictation on every text field (native-speech.js). In the browser the page's
    // speech recognition is used when the browser has one; the audio goes to the browser's maker.
    if (nativeSpeech() || !Recognition) return null;
    const mic = document.createElement('button'); mic.type = 'button'; mic.className = 'pb-bild-mic'; mic.append(svg(ICON.mic));
    let rec = null;
    mic.addEventListener('click', event => {
      event.preventDefault(); event.stopPropagation();
      if (rec) { try { rec.stop(); } catch {} return; }
      try {
        rec = new Recognition(); rec.lang = { de: 'de-DE', en: 'en-US', ru: 'ru-RU', pl: 'pl-PL' }[lang()] || 'de-DE'; rec.interimResults = false; rec.maxAlternatives = 1;
        mic.setAttribute('aria-pressed', 'true'); mic.title = t('listening');
        rec.onresult = e => { const text = Array.from(e.results).map(x => x[0] && x[0].transcript).filter(Boolean).join(' ').trim(); if (!text) return; const sep = field.value && !/\s$/.test(field.value) ? ' ' : ''; field.value = (field.value + sep + text).slice(0, 500); field.dispatchEvent(new Event('input', { bubbles: true })); };
        rec.onerror = () => { if (typeof toast === 'function') toast(t('noMic')); };
        rec.onend = () => { rec = null; mic.removeAttribute('aria-pressed'); mic.title = t('dictate'); field.dispatchEvent(new Event('change', { bubbles: true })); };
        rec.start();
      } catch { rec = null; if (typeof toast === 'function') toast(t('noMic')); }
    });
    return mic;
  }
  function field(r, variant) {
    const node = document.createElement('div'); node.className = 'pb-bild pb-bild-' + variant; node.dataset.hash = r.hash;
    const label = document.createElement('span'); label.className = 'pb-bild-label'; label.append(svg(ICON.image, 14), Object.assign(document.createElement('span'), { className: 'pb-bild-label-text' }));
    const model = document.createElement('div'); model.className = 'pb-bild-model';
    const own = document.createElement('textarea'); own.className = 'pb-bild-own'; own.rows = 1; own.maxLength = 500; own.spellcheck = false; own.setAttribute('enterkeyhint', 'done');
    const state = document.createElement('span'); state.className = 'pb-bild-state'; state.setAttribute('role', 'status');
    const commit = () => { const hash = node.dataset.hash; clearTimeout(timers.get(hash)); drafts.delete(hash); setOwn(hash, own.value).then(ok => { if (ok) { state.textContent = t('saved'); setTimeout(() => { if (state.textContent === t('saved')) state.textContent = ''; }, 1800); } }); };
    own.addEventListener('input', () => { const hash = node.dataset.hash; drafts.set(hash, own.value); clearTimeout(timers.get(hash)); timers.set(hash, setTimeout(commit, 700)); });
    own.addEventListener('change', commit);
    own.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); own.blur(); } });
    for (const type of ['click', 'pointerdown', 'mousedown', 'touchstart']) node.addEventListener(type, e => e.stopPropagation());
    node.append(label, model, own);
    const mic = ownMic(own); if (mic) node.append(mic);
    node.append(state);
    paintField(node, r);
    return node;
  }
  function ensure(host, r, variant, before) {
    let node = host.querySelector(':scope > .pb-bild');
    if (node && node.dataset.hash !== r.hash) { node.remove(); node = null; }
    if (!node) { node = field(r, variant); if (before && before.parentElement === host) host.insertBefore(node, before); else host.append(node); }
    else paintField(node, r);
  }
  let lightboxHash = null, viewerHash = null;
  function wrapOpeners() {
    const lb = window.openLightbox;
    if (typeof lb === 'function' && !lb.pbBild) { const f = async function (hash) { lightboxHash = hash; return lb.apply(this, arguments); }; f.pbBild = true; window.openLightbox = f; }
    const sb = window.showBlob;
    if (typeof sb === 'function' && !sb.pbBild) { const f = function (file, r) { viewerHash = r && r.hash ? r.hash : null; return sb.apply(this, arguments); }; f.pbBild = true; window.showBlob = f; if (window.PBNavigation && window.PBNavigation.open === sb) window.PBNavigation.open = f; }
  }
  function equip() {
    wrapOpeners();
    for (const card of document.querySelectorAll('#results > .card[data-hash]')) {
      const r = record(card.dataset.hash); if (!r || !isImage(r)) continue;
      ensure(card, r, 'card', card.querySelector(':scope > .cardbtns'));
    }
    for (const row of document.querySelectorAll('#explorerFiles > .explorer-row[data-hash]')) {
      const r = record(row.dataset.hash); if (!r || !isImage(r)) continue;
      const info = row.firstElementChild; if (info && info.tagName === 'DIV') ensure(info, r, 'row');
    }
    const lightbox = document.getElementById('lightboxBg'), cap = document.getElementById('lightboxCap');
    if (lightbox && cap) {
      const r = lightbox.classList.contains('on') && lightboxHash ? record(lightboxHash) : null;
      if (r && isImage(r)) ensure(lightbox, r, 'view', cap.nextElementSibling); else lightbox.querySelector(':scope > .pb-bild')?.remove();
    }
    const body = document.querySelector('.native-file-viewer:not([hidden]) > .native-file-body');
    if (body) {
      const img = body.querySelector(':scope > .native-file-image');
      const title = document.getElementById('native-file-title')?.textContent || '';
      const r = img ? (viewerHash && record(viewerHash)) || catalog().find(x => isImage(x) && x.name === title) : null;
      if (r) ensure(body, r, 'view'); else body.querySelector(':scope > .pb-bild')?.remove();
    }
    mountFilter(); mountSettings();
  }

  /* ---------- 4. Settings: the block „Bildbeschreibung“, in the apps with the model switch ---------- */
  const plugin = window.Capacitor?.Plugins?.ProCaption;
  const isApp = !!plugin;
  const root = () => (window.Capacitor?.getPlatform?.() === 'windows' ? 'https://pbmodel.localhost/models/' : location.origin + '/models/');
  if (isApp) { try { localStorage.setItem('pb_caption_model', MODEL); localStorage.setItem('pb_caption_baseurl', root()); } catch {} }
  function mountSettings() {
    const toggle = document.getElementById('capEnable'); const box = toggle?.closest('.note'); if (!box) return;
    if (!box.classList.contains('pb-bild-settings')) {
      box.classList.add('pb-bild-settings');
      if (isApp) {
        for (const id of ['capModel', 'capServer']) { const label = document.getElementById(id)?.closest('label'); if (label) label.hidden = true; }
        const serverHint = box.querySelector('[data-i18n="capServerP"]'); if (serverHint) serverHint.hidden = true;
        const status = document.getElementById('capStatus'); if (status) status.hidden = true;
        const model = document.getElementById('capModel'), server = document.getElementById('capServer');
        if (model) model.value = MODEL; if (server) server.value = root();
        panel();
      }
    }
    paintSettings();
  }
  function paintSettings() {
    const toggle = document.getElementById('capEnable'); const box = toggle?.closest('.note'); if (!box) return;
    const h = box.querySelector('h3'); if (h && h.textContent !== t('name')) h.textContent = t('name');
    const p = box.querySelector('[data-i18n="capP"]'); if (p) { const text = t(isApp ? 'appText' : 'webText', { mb: facts.mb, rss: facts.rss }); if (p.textContent !== text) p.textContent = text; }
    const label = box.querySelector('label[for="capEnable"]'); if (label && label.textContent !== t('switchLabel')) label.textContent = t('switchLabel');
    const crash = document.getElementById('capCrashHint'); if (crash && isApp && !crash.hidden) crash.hidden = true;
  }

  /* ---------- 5. The model switch in the apps (ProCaption): load, continue, remove, crash guard ---------- */
  let state = { installed: false, running: false, present: 0, total: 0, crashes: 0 }, live = null, message = '', phase = '';
  let stateReady = Promise.resolve();
  const usable = () => state.installed && state.crashes === 0;
  function panel() {
    let box = document.getElementById('pb-bild-model'); if (box) return box;
    const anchor = document.getElementById('capEnable')?.closest('.switch'); if (!anchor) return null;
    box = document.createElement('div'); box.id = 'pb-bild-model'; box.className = 'pb-semantic pb-bild-panel';
    box.innerHTML = '<div class="pb-semantic-bar" hidden><span></span></div><p data-s="text" role="status"></p>'
      + '<div class="pb-semantic-actions"><button type="button" data-caption="load"></button><button type="button" data-caption="cancel" hidden></button>'
      + '<button type="button" data-caption="retry" hidden></button><button type="button" data-caption="remove" hidden></button></div>';
    anchor.after(box);
    box.addEventListener('click', event => {
      const action = event.target.closest('[data-caption]')?.dataset.caption;
      if (action === 'load') load(); else if (action === 'cancel') plugin.cancel().catch(() => {}); else if (action === 'retry') retry(); else if (action === 'remove') remove();
    });
    return box;
  }
  function renderPanel() {
    const box = isApp ? panel() : null; if (!box) return;
    const q = s => box.querySelector(s), btn = n => q(`[data-caption="${n}"]`);
    setText(btn('load'), t('load')); setText(btn('cancel'), t('cancel')); setText(btn('retry'), t('retry')); setText(btn('remove'), t('remove'));
    const total = state.total || facts.total, running = state.running || !!live;
    let text;
    if (message) text = message;
    else if (running && live) text = live.done >= total ? t('checking') : t('loading', { done: mb(live.done), mb: mb(total), source: live.source || '' });
    else if (state.installed && state.crashes > 0) text = t('crashed');
    else if (state.installed && phase === 'startFailed') text = t('failed', { why: 'Start' });
    else if (state.installed) text = t('ready', { mb: mb(total) });
    else if (state.present > 0) text = t('partial', { done: mb(state.present), mb: mb(total) });
    else text = t('none', { mb: mb(total) });
    setText(q('[data-s="text"]'), text);
    const bar = q('.pb-semantic-bar'), done = running && live ? live.done : state.present;
    bar.hidden = state.installed || !(running || state.present > 0);
    bar.firstElementChild.style.width = total ? `${Math.min(100, done / total * 100).toFixed(1)}%` : '0';
    btn('load').hidden = state.installed || running; btn('cancel').hidden = !running;
    btn('retry').hidden = !(state.installed && (state.crashes > 0 || phase === 'startFailed'));
    btn('remove').hidden = running || !(state.installed || state.present > 0);
    box.dataset.state = running ? 'loading' : state.installed ? (state.crashes > 0 ? 'crashed' : 'ready') : state.present > 0 ? 'partial' : 'none';
  }
  async function refresh() { try { state = await plugin.getState(); } catch {} renderPanel(); }
  async function load() {
    message = ''; live = { done: state.present, total: state.total, source: '' }; renderPanel();
    try {
      state = await plugin.install(); live = null; renderPanel();
      if (state.installed) afterInstall();
    } catch (error) {
      live = null; const code = error?.code || '';
      message = code === 'CANCELLED' ? '' : code === 'APP_OFFLINE' ? t('offline') : code === 'NO_SPACE' ? t('space') : code === 'NO_PINS' ? t('noPins') : t('failed', { why: error?.message || code || '?' });
      await refresh();
    }
  }
  async function remove() { if (!confirm(t('confirmRemove'))) return; message = ''; phase = ''; try { state = await plugin.remove(); } catch {} renderPanel(); }
  async function retry() { message = ''; phase = ''; try { state = await plugin.clearCrash(); } catch {} renderPanel(); afterInstall(); }
  function afterInstall() {
    // The switch above decides whether photos are described; a loaded model only makes it possible.
    const on = document.getElementById('capEnable')?.checked;
    if (on && typeof applyCaptionSetting === 'function') Promise.resolve(applyCaptionSetting()).then(() => { try { if (typeof captionBackfill === 'function') captionBackfill(); } catch {} }).catch(() => {});
  }
  if (isApp) {
    stateReady = refresh();
    plugin.addListener?.('progress', p => { live = p; renderPanel(); });
    // The page loads pb-caption.js only when the model is on the device and did not crash last time.
    if (original.loadCaptionScript) window.loadCaptionScript = async function () {
      await stateReady;
      if (!usable()) { if (typeof pbCaptionStatus === 'function') pbCaptionStatus(t('notLoaded')); throw new Error('caption model not loaded'); }
      const result = await original.loadCaptionScript.apply(this, arguments);
      const cap = window.PBCaption;
      if (cap && typeof cap.warmup === 'function' && !cap.warmup.pbBild) {
        const warm = cap.warmup;
        const guarded = async function () { phase = 'starting'; try { await plugin.markLoading(); } catch {} try { const out = await warm.apply(this, arguments); phase = ''; return out; } catch (e) { phase = 'startFailed'; throw e; } finally { try { state = await plugin.markLoaded(); } catch {} renderPanel(); } };
        guarded.pbBild = true; cap.warmup = guarded;
      }
      return result;
    };
  }

  /* ---------- start ---------- */
  let pendingPaint = false;
  const schedule = () => { if (pendingPaint) return; pendingPaint = true; requestAnimationFrame(() => { pendingPaint = false; equip(); }); };
  function start() {
    equip();
    new MutationObserver(records => { if (records.some(m => !(m.target.closest && m.target.closest('.pb-bild')))) schedule(); }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'hidden'] });
    new MutationObserver(() => { paintFilter(); paintSettings(); renderPanel(); for (const node of document.querySelectorAll('.pb-bild')) { const r = record(node.dataset.hash); if (r) paintField(node, r); } }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
    window.addEventListener('pb-workspace-refresh', schedule);
  }
  window.PBBild = Object.freeze({ setOwn, described, isImage, filter: setFilter, get filterOn() { return filterOn; }, get state() { return state; }, refresh: schedule, MODEL });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true }); else start();
})();
