/* Klaus 2026-10-27: dictation followed whatever the system treated as its default
   recording device at that moment (a Bluetooth headset that connects can take that
   over). Here one microphone can be chosen for the app, in all three variants:
   - Windows: SAPI listens to exactly that device (ProSpeech.inputs/listen).
   - Android: the app records nothing; Android's audio routing is pointed at that
     device while the system speech dialog listens, then restored.
   - Browser/PWA: Chrome 135+ accepts the chosen microphone as an audio track.
   Only the device list and the choice are handled here; no audio passes this page
   except into the browser's own recognizer. A chosen but unplugged microphone is
   reported, never silently replaced. */
(() => {
  'use strict';
  if (window.PBMicrophone) return;
  const plugin = window.Capacitor?.Plugins?.ProSpeech;
  const platform = window.Capacitor?.getPlatform?.();
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const media = navigator.mediaDevices;
  // Chrome/Edge 135+ pass a MediaStreamTrack to SpeechRecognition.start (Chrome 135 release notes).
  function chromiumMajor() {
    const brands = navigator.userAgentData?.brands || [];
    const brand = brands.find(item => /^(Chromium|Google Chrome|Microsoft Edge)$/.test(item.brand));
    if (brand) return Number(brand.version) || 0;
    const match = /(?:Chrome|Chromium|Edg)\/(\d+)/.exec(navigator.userAgent || '');
    return match ? Number(match[1]) : 0;
  }
  const mode = (platform === 'windows' || platform === 'android') && typeof plugin?.inputs === 'function' ? platform
    : !window.Capacitor && typeof Recognition === 'function' ? 'web' : '';
  if (!mode) return;
  const webCapable = mode === 'web' && typeof media?.enumerateDevices === 'function' && typeof media?.getUserMedia === 'function' && chromiumMajor() >= 135;
  const KEY = 'pb_microphone_v1';
  const words = {
    de: {label:'Mikrofon fürs Diktat', search:'Neu suchen', away:'nicht verbunden', deviceMic:'Mikrofon im Gerät', unnamed:'Mikrofon',
      standard:{windows:'Windows-Standard (wechselt mit Windows)', android:'Android-Standard (Android wählt selbst)', web:'Browser-Standard (wie im Browser eingestellt)'},
      follows:{windows:'Diktat folgt dem Windows-Standardmikrofon.', android:'Diktat folgt der Wahl von Android.', web:'Diktat folgt dem im Browser eingestellten Mikrofon.'},
      fixed:{windows:'Diktat hört nur auf: {name}', android:'Diktat wird an dieses Mikrofon geleitet: {name}', web:'Diktat hört nur auf: {name}'},
      help:'Das System wechselt sein Standardmikrofon zum Beispiel, wenn sich ein Bluetooth-Headset verbindet. Mit einer festen Wahl nutzt das Diktat dieses eine Gerät.',
      missing:'Nicht verbunden: {name}. Bitte anschließen oder hier ein anderes wählen.',
      none:'Das Gerät meldet kein Mikrofon.', failed:'Die Mikrofonliste konnte nicht gelesen werden.',
      names:'Namen erscheinen nach der Mikrofon-Freigabe: „Neu suchen“ tippen.',
      unsupported:'Dieser Browser nimmt fürs Diktat immer das im Browser eingestellte Mikrofon. Eine feste Wahl geht in Chrome oder Edge ab Version 135 und in den Apps.',
      unsaved:'Die Wahl gilt in dieser Sitzung; sie konnte nicht gespeichert werden.',
      kind:{bluetooth:'Bluetooth', usb:'USB-Kabel', radio:'Funk/WLAN', builtin:'eingebaut oder Klinke', wired:'Kabel'}},
    en: {label:'Microphone for dictation', search:'Search again', away:'not connected', deviceMic:'Device microphone', unnamed:'Microphone',
      standard:{windows:'Windows default (changes with Windows)', android:'Android default (Android decides)', web:'Browser default (as set in the browser)'},
      follows:{windows:'Dictation follows the Windows default microphone.', android:'Dictation follows Android’s choice.', web:'Dictation follows the microphone set in the browser.'},
      fixed:{windows:'Dictation listens only to: {name}', android:'Dictation is routed to this microphone: {name}', web:'Dictation listens only to: {name}'},
      help:'The system changes its default microphone, for example when a Bluetooth headset connects. With a fixed choice, dictation uses this one device.',
      missing:'Not connected: {name}. Plug it in or choose another one here.',
      none:'The device reports no microphone.', failed:'The microphone list could not be read.',
      names:'Names appear after microphone access is allowed: tap “Search again”.',
      unsupported:'This browser always uses the microphone set in the browser for dictation. A fixed choice works in Chrome or Edge 135 and later and in the apps.',
      unsaved:'The choice applies to this session; it could not be saved.',
      kind:{bluetooth:'Bluetooth', usb:'USB cable', radio:'wireless/Wi-Fi', builtin:'built-in or jack', wired:'cable'}},
    ru: {label:'Микрофон для диктовки', search:'Искать снова', away:'не подключён', deviceMic:'Микрофон устройства', unnamed:'Микрофон',
      standard:{windows:'По умолчанию Windows (меняется вместе с Windows)', android:'По умолчанию Android (Android выбирает сам)', web:'По умолчанию браузера (как в браузере)'},
      follows:{windows:'Диктовка следует микрофону Windows по умолчанию.', android:'Диктовка следует выбору Android.', web:'Диктовка следует микрофону, выбранному в браузере.'},
      fixed:{windows:'Диктовка слушает только: {name}', android:'Диктовка направляется на этот микрофон: {name}', web:'Диктовка слушает только: {name}'},
      help:'Система меняет микрофон по умолчанию, например при подключении Bluetooth-гарнитуры. При постоянном выборе диктовка использует это устройство.',
      missing:'Не подключён: {name}. Подключите его или выберите другой здесь.',
      none:'Устройство не сообщает ни одного микрофона.', failed:'Не удалось прочитать список микрофонов.',
      names:'Названия появятся после разрешения доступа к микрофону: нажмите «Искать снова».',
      unsupported:'Этот браузер для диктовки всегда берёт микрофон из настроек браузера. Постоянный выбор работает в Chrome или Edge от версии 135 и в приложениях.',
      unsaved:'Выбор действует в этом сеансе; сохранить его не удалось.',
      kind:{bluetooth:'Bluetooth', usb:'USB-кабель', radio:'радио/Wi-Fi', builtin:'встроенный или разъём', wired:'кабель'}},
    pl: {label:'Mikrofon do dyktowania', search:'Szukaj ponownie', away:'nie podłączono', deviceMic:'Mikrofon urządzenia', unnamed:'Mikrofon',
      standard:{windows:'Domyślny Windows (zmienia się z Windows)', android:'Domyślny Android (Android wybiera sam)', web:'Domyślny przeglądarki (jak w przeglądarce)'},
      follows:{windows:'Dyktowanie używa domyślnego mikrofonu Windows.', android:'Dyktowanie używa wyboru Androida.', web:'Dyktowanie używa mikrofonu ustawionego w przeglądarce.'},
      fixed:{windows:'Dyktowanie słucha tylko: {name}', android:'Dyktowanie jest kierowane do tego mikrofonu: {name}', web:'Dyktowanie słucha tylko: {name}'},
      help:'System zmienia domyślny mikrofon, na przykład gdy połączy się zestaw Bluetooth. Przy stałym wyborze dyktowanie używa tego jednego urządzenia.',
      missing:'Nie podłączono: {name}. Podłącz go lub wybierz tu inny.',
      none:'Urządzenie nie zgłasza żadnego mikrofonu.', failed:'Nie udało się odczytać listy mikrofonów.',
      names:'Nazwy pojawią się po zezwoleniu na mikrofon: dotknij „Szukaj ponownie”.',
      unsupported:'Ta przeglądarka do dyktowania zawsze używa mikrofonu ustawionego w przeglądarce. Stały wybór działa w Chrome lub Edge od wersji 135 i w aplikacjach.',
      unsaved:'Wybór obowiązuje w tej sesji; nie udało się go zapisać.',
      kind:{bluetooth:'Bluetooth', usb:'kabel USB', radio:'radio/Wi-Fi', builtin:'wbudowany lub gniazdo', wired:'kabel'}}
  };
  const copy = () => words[String(document.documentElement.lang || 'de').slice(0,2)] || words.de;
  // Windows and the browser name the connection only in the device name: a hint, not a measurement.
  // Android reports the connection type itself (item.kind).
  function guess(name) {
    const n = String(name || '');
    if (/bluetooth|hands-?free|freisprech|airpods|\bbt\b/i.test(n)) return 'bluetooth';
    if (/\busb\b/i.test(n)) return 'usb';
    if (/wireless|wi-?fi|wlan|\bfunk|2[.,]4\s*g/i.test(n)) return 'radio';
    if (/realtek|high definition|\bhd audio|intel|smart sound|array|internal|integriert|eingebaut|line in|mic in|klinke|jack/i.test(n)) return 'builtin';
    return '';
  }
  const display = item => item.kind === 'builtin' && !item.name ? copy().deviceMic : item.name || copy().unnamed;
  function read() {
    try { const v = JSON.parse(localStorage.getItem(KEY) || 'null'); if (v && typeof v.id === 'string' && typeof v.name === 'string' && (v.id || v.name)) return {id:v.id.slice(0,1024), name:v.name.slice(0,512)}; } catch {}
    return null;
  }
  let chosen = read(), items = null, state = 'idle', unsaved = false, loading = null, unnamed = false;
  function save() {
    try { if (chosen) localStorage.setItem(KEY, JSON.stringify(chosen)); else localStorage.removeItem(KEY); unsaved = false; }
    catch { unsaved = true; }
  }
  function present() {
    if (!chosen || !items) return null;
    const byId = items.find(item => item.id === chosen.id);
    if (byId) return byId;
    const same = items.filter(item => chosen.name && item.name === chosen.name);
    return same.length === 1 ? same[0] : null;
  }
  async function webInputs(ask) {
    if (ask) { const stream = await media.getUserMedia({audio:true}); for (const track of stream.getTracks()) track.stop(); }
    const all = (await media.enumerateDevices()).filter(item => item.kind === 'audioinput');
    const fallback = all.find(item => item.deviceId === 'default');
    return all.filter(item => item.deviceId && item.deviceId !== 'default' && item.deviceId !== 'communications')
      .map(item => ({id:item.deviceId, name:item.label || '', default:!!fallback && fallback.groupId === item.groupId && !!item.groupId}));
  }
  async function load(ask = false) {
    if (mode === 'web' && !webCapable) { state = 'unsupported'; paint(); return; }
    if (loading) return loading;
    state = 'loading';
    loading = (async () => {
      try {
        const raw = mode === 'web' ? await webInputs(ask) : (await plugin.inputs())?.items;
        items = (Array.isArray(raw) ? raw : [])
          .filter(item => typeof item?.id === 'string' && item.id && typeof item?.name === 'string')
          .slice(0, 64).map(item => ({id:item.id, name:item.name, default:item.default === true, kind:typeof item.kind === 'string' ? item.kind : ''}));
        unnamed = mode === 'web' && items.some(item => !item.name);
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
    if (!host || document.getElementById('pb-microphone-row')) return Boolean(host);
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
      else { const item = items?.find(entry => entry.id === select.value); if (!item) return; chosen = {id:item.id, name:item.name || display(item)}; }
      save(); paint();
    });
    // In the browser a tap may ask for microphone access once, so the list shows real names.
    again.addEventListener('click', () => { void load(mode === 'web'); });
    return true;
  }
  function paint() {
    if (!mount()) return;
    const text = copy(), select = document.getElementById('pb-microphone-setting'), controls = select.parentElement;
    for (const node of document.querySelectorAll('[data-microphone-copy]')) setText(node, text[node.dataset.microphoneCopy]);
    select.setAttribute('aria-label', text.label); if (select.title !== text.help) select.title = text.help;
    const status = document.querySelector('.pb-microphone-status');
    const hide = state === 'unsupported';
    if (controls.hidden !== hide) controls.hidden = hide;
    if (hide) { setText(status, text.unsupported); return; }
    const found = present();
    const wanted = [['', text.standard[mode]]];
    for (const item of items || []) {
      const how = item.kind || guess(item.name);
      wanted.push([item.id, display(item) + (how && text.kind[how] && !(item.kind === 'builtin' && !item.name) ? ' · ' + text.kind[how] : '')]);
    }
    if (chosen && items && !found) wanted.push(['missing', chosen.name + ' (' + text.away + ')']);
    if (chosen && !items) wanted.push(['missing', chosen.name]);
    // Rebuild only when the list changed: no needless DOM mutations for the help observer.
    const same = select.options.length === wanted.length && wanted.every(([value, label], i) => select.options[i].value === value && select.options[i].textContent === label);
    if (!same) select.replaceChildren(...wanted.map(([value, label]) => option(value, label)));
    const value = !chosen ? '' : found ? found.id : 'missing';
    if (select.value !== value) select.value = value;
    select.disabled = state === 'loading';
    const line = unsaved ? text.unsaved
      : state === 'failed' ? text.failed
      : state === 'ready' && !items.length ? text.none
      : chosen && state === 'ready' && !found ? text.missing.replace('{name}', chosen.name)
      : chosen ? text.fixed[mode].replace('{name}', chosen.name)
      : unnamed ? text.names
      : text.follows[mode];
    setText(status, line);
  }
  const note = message => (typeof window.toast === 'function' ? window.toast(message) : alert(message));
  // Browser: every caller (search microphone, image description) creates its own recognizer.
  // The chosen device goes in as an audio track; a missing device stops the attempt.
  if (webCapable) {
    for (const Ctor of new Set([window.SpeechRecognition, window.webkitSpeechRecognition].filter(Boolean))) {
      const original = Ctor.prototype.start;
      if (typeof original !== 'function' || original.pbMicrophone) continue;
      const start = function (track) {
        if (track !== undefined || !chosen) return original.apply(this, arguments);
        const recognizer = this;
        const finish = (kind) => { try { recognizer.dispatchEvent(new Event(kind)); } catch {} };
        (async () => {
          if (!items) await load();
          const device = present();
          if (!device) { note(copy().missing.replace('{name}', chosen.name)); finish('end'); paint(); return; }
          let stream;
          try { stream = await media.getUserMedia({audio:{deviceId:{exact:device.id}}}); }
          catch (error) {
            if (/NotFound|Overconstrained/.test(error?.name || '')) note(copy().missing.replace('{name}', chosen.name));
            finish('error'); finish('end'); return;
          }
          const audio = stream.getAudioTracks()[0];
          recognizer.addEventListener('end', () => { for (const t of stream.getTracks()) t.stop(); }, {once:true});
          try { original.call(recognizer, audio); }
          catch { for (const t of stream.getTracks()) t.stop(); finish('error'); finish('end'); }
        })();
      };
      start.pbMicrophone = true;
      Ctor.prototype.start = start;
    }
  }
  window.PBMicrophone = Object.freeze({
    // What the native dictation passes on; empty = system default.
    choice: () => chosen && mode !== 'web' ? {input:chosen.id, inputName:chosen.name} : {},
    name: () => chosen?.name || '',
    refresh: () => load()
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
  media?.addEventListener?.('devicechange', () => { if (mode === 'web' && state !== 'loading') void load(); });
  void load();
})();
