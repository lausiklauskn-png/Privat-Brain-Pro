/* Klaus 2026-10-27: on Windows the dictation followed whatever Windows treated
   as its default recording device at that moment (a Bluetooth headset that
   connects can take that over). Here one microphone can be chosen for the app.
   Only the device list and the choice are handled; no audio passes this page.
   A chosen but unplugged microphone is reported, never silently replaced. */
(() => {
  'use strict';
  if (window.PBMicrophone) return;
  const plugin = window.Capacitor?.Plugins?.ProSpeech;
  const windows = window.Capacitor?.getPlatform?.() === 'windows';
  if (!windows || typeof plugin?.inputs !== 'function') return;
  const KEY = 'pb_microphone_v1';
  const words = {
    de: {label:'Mikrofon fürs Diktat', standard:'Windows-Standard (wechselt mit Windows)', search:'Neu suchen',
      help:'Windows wechselt sein Standardmikrofon zum Beispiel, wenn sich ein Bluetooth-Headset verbindet. Mit einer festen Wahl hört das Diktat nur auf dieses eine Gerät.',
      fixed:'Diktat hört nur auf: {name}', follows:'Diktat folgt dem Windows-Standardmikrofon.',
      missing:'Nicht verbunden: {name}. Bitte anschließen oder hier ein anderes wählen.', away:'nicht verbunden',
      none:'Windows meldet kein Mikrofon.', failed:'Die Mikrofonliste konnte nicht gelesen werden.',
      unsaved:'Die Wahl gilt in dieser Sitzung; sie konnte nicht gespeichert werden.',
      kind:{bluetooth:'Bluetooth', usb:'USB-Kabel', radio:'Funk/WLAN', builtin:'eingebaut oder Klinke'}},
    en: {label:'Microphone for dictation', standard:'Windows default (changes with Windows)', search:'Search again',
      help:'Windows changes its default microphone, for example when a Bluetooth headset connects. With a fixed choice, dictation listens to this one device only.',
      fixed:'Dictation listens only to: {name}', follows:'Dictation follows the Windows default microphone.',
      missing:'Not connected: {name}. Plug it in or choose another one here.', away:'not connected',
      none:'Windows reports no microphone.', failed:'The microphone list could not be read.',
      unsaved:'The choice applies to this session; it could not be saved.',
      kind:{bluetooth:'Bluetooth', usb:'USB cable', radio:'wireless/Wi-Fi', builtin:'built-in or jack'}},
    ru: {label:'Микрофон для диктовки', standard:'По умолчанию Windows (меняется вместе с Windows)', search:'Искать снова',
      help:'Windows меняет микрофон по умолчанию, например при подключении Bluetooth-гарнитуры. При постоянном выборе диктовка слушает только это устройство.',
      fixed:'Диктовка слушает только: {name}', follows:'Диктовка следует микрофону Windows по умолчанию.',
      missing:'Не подключён: {name}. Подключите его или выберите другой здесь.', away:'не подключён',
      none:'Windows не сообщает ни одного микрофона.', failed:'Не удалось прочитать список микрофонов.',
      unsaved:'Выбор действует в этом сеансе; сохранить его не удалось.',
      kind:{bluetooth:'Bluetooth', usb:'USB-кабель', radio:'радио/Wi-Fi', builtin:'встроенный или разъём'}},
    pl: {label:'Mikrofon do dyktowania', standard:'Domyślny Windows (zmienia się z Windows)', search:'Szukaj ponownie',
      help:'Windows zmienia domyślny mikrofon, na przykład gdy połączy się zestaw Bluetooth. Przy stałym wyborze dyktowanie słucha tylko tego jednego urządzenia.',
      fixed:'Dyktowanie słucha tylko: {name}', follows:'Dyktowanie używa domyślnego mikrofonu Windows.',
      missing:'Nie podłączono: {name}. Podłącz go lub wybierz tu inny.', away:'nie podłączono',
      none:'Windows nie zgłasza żadnego mikrofonu.', failed:'Nie udało się odczytać listy mikrofonów.',
      unsaved:'Wybór obowiązuje w tej sesji; nie udało się go zapisać.',
      kind:{bluetooth:'Bluetooth', usb:'kabel USB', radio:'radio/Wi-Fi', builtin:'wbudowany lub gniazdo'}}
  };
  const copy = () => words[String(document.documentElement.lang || 'de').slice(0,2)] || words.de;
  // Windows names the way a device is connected only in its name; this is a hint, not a measurement.
  function kind(name) {
    const n = String(name || '');
    if (/bluetooth|hands-?free|freisprech|airpods|\bbt\b/i.test(n)) return 'bluetooth';
    if (/\busb\b/i.test(n)) return 'usb';
    if (/wireless|wi-?fi|wlan|\bfunk|2[.,]4\s*g/i.test(n)) return 'radio';
    if (/realtek|high definition|\bhd audio|intel|smart sound|array|internal|integriert|eingebaut|line in|mic in|klinke|jack/i.test(n)) return 'builtin';
    return '';
  }
  function read() {
    try { const v = JSON.parse(localStorage.getItem(KEY) || 'null'); if (v && typeof v.id === 'string' && typeof v.name === 'string' && v.name) return {id:v.id.slice(0,1024), name:v.name.slice(0,512)}; } catch {}
    return null;
  }
  let chosen = read(), items = null, state = 'idle', unsaved = false, loading = null;
  function save() {
    try { if (chosen) localStorage.setItem(KEY, JSON.stringify(chosen)); else localStorage.removeItem(KEY); unsaved = false; }
    catch { unsaved = true; }
  }
  function present() {
    if (!chosen || !items) return null;
    const byId = items.find(item => item.id === chosen.id);
    if (byId) return byId;
    const same = items.filter(item => item.name === chosen.name);
    return same.length === 1 ? same[0] : null;
  }
  async function load() {
    if (loading) return loading;
    state = 'loading';
    loading = (async () => {
      try {
        const result = await plugin.inputs();
        items = (Array.isArray(result?.items) ? result.items : [])
          .filter(item => typeof item?.id === 'string' && typeof item?.name === 'string' && item.id && item.name)
          .slice(0, 64).map(item => ({id:item.id, name:item.name, default:item.default === true}));
        state = 'ready';
        // A device that came back with a new id keeps the choice under its new id.
        const found = present();
        if (found && chosen && found.id !== chosen.id) { chosen = {id:found.id, name:found.name}; save(); }
      } catch { items = null; state = 'failed'; }
      finally { loading = null; paint(); }
    })();
    paint();
    return loading;
  }
  function option(value, text) { const o = document.createElement('option'); o.value = value; o.textContent = text; return o; }
  function setText(node, value) { if (node && node.textContent !== value) node.textContent = value; }
  function mount() {
    const host = document.getElementById('pb-input-language-settings');
    if (!host || document.getElementById('pb-microphone-setting')) return Boolean(host);
    const row = document.createElement('div'); row.className = 'pb-microphone-row'; row.id = 'pb-microphone-row';
    const label = document.createElement('label'); label.htmlFor = 'pb-microphone-setting'; label.dataset.microphoneCopy = 'label';
    const select = document.createElement('select'); select.id = 'pb-microphone-setting'; select.className = 'pb-microphone-select';
    const again = document.createElement('button'); again.type = 'button'; again.id = 'pb-microphone-search'; again.className = 'ghost compact-tool'; again.dataset.microphoneCopy = 'search';
    const status = document.createElement('p'); status.className = 'hint pb-microphone-status'; status.setAttribute('role','status');
    const controls = document.createElement('div'); controls.className = 'btnrow pb-microphone-controls'; controls.append(select, again);
    row.append(label, controls, status);
    const languageStatus = host.querySelector('.pb-input-language-status');
    if (languageStatus) languageStatus.after(row); else host.append(row);
    select.addEventListener('change', () => {
      if (!select.value) chosen = null;
      else if (select.value === 'missing') return;
      else { const item = items?.find(entry => entry.id === select.value); if (!item) return; chosen = {id:item.id, name:item.name}; }
      save(); paint();
    });
    again.addEventListener('click', () => { void load(); });
    return true;
  }
  function paint() {
    if (!mount()) return;
    const text = copy(), select = document.getElementById('pb-microphone-setting');
    for (const node of document.querySelectorAll('[data-microphone-copy]')) setText(node, text[node.dataset.microphoneCopy]);
    select.setAttribute('aria-label', text.label); if (select.title !== text.help) select.title = text.help;
    const found = present();
    const wanted = [['', text.standard]];
    for (const item of items || []) { const how = kind(item.name); wanted.push([item.id, item.name + (how ? ' · ' + text.kind[how] : '')]); }
    if (chosen && items && !found) wanted.push(['missing', chosen.name + ' (' + text.away + ')']);
    if (chosen && !items) wanted.push(['missing', chosen.name]);
    // Rebuild only when the list changed: no needless DOM mutations for the help observer.
    const same = select.options.length === wanted.length && wanted.every(([value, label], i) => select.options[i].value === value && select.options[i].textContent === label);
    if (!same) select.replaceChildren(...wanted.map(([value, label]) => option(value, label)));
    const value = !chosen ? '' : found ? found.id : 'missing';
    if (select.value !== value) select.value = value;
    select.disabled = state === 'loading';
    const status = document.querySelector('.pb-microphone-status');
    const line = unsaved ? text.unsaved
      : state === 'failed' ? text.failed
      : state === 'ready' && !items.length ? text.none
      : chosen && state === 'ready' && !found ? text.missing.replace('{name}', chosen.name)
      : chosen ? text.fixed.replace('{name}', chosen.name)
      : text.follows;
    setText(status, line);
  }
  window.PBMicrophone = Object.freeze({
    // What the dictation passes to the native recognizer; empty = Windows default.
    choice: () => chosen ? {input:chosen.id, inputName:chosen.name} : {},
    name: () => chosen?.name || '',
    refresh: load
  });
  let pending = false;
  const schedule = () => { if (pending) return; pending = true; requestAnimationFrame(() => { pending = false; paint(); }); };
  new MutationObserver(schedule).observe(document.documentElement, {attributes:true, attributeFilter:['lang']});
  const settings = document.getElementById('panel-settings');
  // The settings section is built by native-input-language.js; wait for it once, then stay quiet.
  if (!mount() && settings) {
    const wait = new MutationObserver(() => { if (mount()) { wait.disconnect(); paint(); } });
    wait.observe(settings, {childList:true});
  }
  window.addEventListener('focus', () => { if (state !== 'loading') void load(); });
  void load();
})();
