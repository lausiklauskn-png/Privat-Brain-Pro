/* 🔑 Unlock codes for the tools (Klaus 2026-10-22: "die Freigabe für diese Tools soll mit einem Schlüssel passieren …
   jemand, der mir das Passwort abkauft oder den Schlüssel, der kann diese Tools benutzen und öffnen").
   Klaus' choice: one code per buyer, checked without internet.
   - The publisher (Klaus) makes a key pair in the "Herausgeber-Studio" on his own device. The secret half is stored only
     there, encrypted with his password (PBKDF2-SHA256 600 000 → AES-256-GCM). It is never in the app for buyers, in Git
     or in a chat. The public half goes into native/license-keys.json; then every copy of the app recognises his codes.
   - A code is "PBK1.<data>.<signature>": data = {v, id, n (buyer), t (tools), d (date)}, signed with BIP-340 Schnorr
     (modules/noble-secp256k1.js, the same as everywhere in the SBKIM network) over SHA-256("PBK1.<data>").
   - Until his public key is in the app, a device trusts only its own studio key (so Klaus can try it out).
     Honest limit: an app on someone else's device can be taken apart; this is a clear lock for normal buyers. */
(() => {
  'use strict';
  const TOOLS = [
    { id: 'pinnwand', icon: '📌', name: ['Pinnwand', 'Pin board', 'Доска', 'Tablica'] },
    { id: 'suche', icon: '🔎', name: ['Such-Tool', 'Search tool', 'Поиск', 'Wyszukiwarka'] },
    { id: 'kimsync', icon: '💬', name: ['Kim-Sync', 'Kim-Sync', 'Kim-Sync', 'Kim-Sync'] },
    { id: 'dateipost', icon: '📦', name: ['Datei-Post', 'File post', 'Почта файлов', 'Poczta plików'] },
    { id: 'sendepruefer', icon: '✉️', name: ['Sende-Prüfer', 'Send checker', 'Проверка отправки', 'Kontrola wysyłki'] },
    { id: 'auslieferung', icon: '🚚', name: ['Auslieferungsprüfer', 'Delivery checker', 'Проверка доставки', 'Kontrola dostawy'] },
    { id: 'inandout', icon: '📒', name: ['In-and-Out-Book', 'In-and-Out-Book', 'In-and-Out-Book', 'In-and-Out-Book'] },
    { id: 'fpvideo', icon: '🎬', name: ['FP-Videos', 'FP videos', 'FP-видео', 'Filmy FP'] }
  ];
  const L = ['de', 'en', 'ru', 'pl'];
  const li = () => Math.max(0, L.indexOf(String(document.documentElement.lang || 'de').slice(0, 2)));
  const W = {
    box: ['🔑 Werkzeuge freischalten', '🔑 Unlock tools', '🔑 Открыть инструменты', '🔑 Odblokuj narzędzia'],
    boxHelp: ['Mit einem Freischalt-Code öffnen sich die Werkzeuge im App-Menü (☰). Den Code bekommst du vom Herausgeber. Die Prüfung läuft ohne Internet.', 'An unlock code opens the tools in the app menu (☰). You get the code from the publisher. It is checked without internet.', 'Код открывает инструменты в меню (☰). Код выдаёт издатель. Проверка без интернета.', 'Kod odblokowuje narzędzia w menu (☰). Kod otrzymasz od wydawcy. Sprawdzanie bez internetu.'],
    code: ['Freischalt-Code', 'Unlock code', 'Код', 'Kod'],
    unlock: ['Freischalten', 'Unlock', 'Открыть', 'Odblokuj'],
    unlocked: ['✓ frei', '✓ open', '✓ открыт', '✓ odblokowane'],
    locked: ['🔒 gesperrt', '🔒 locked', '🔒 закрыт', '🔒 zablokowane'],
    ok: ['✓ Freigeschaltet: ', '✓ Unlocked: ', '✓ Открыто: ', '✓ Odblokowano: '],
    for: [' (für {n})', ' (for {n})', ' (для {n})', ' (dla {n})'],
    bad: ['Dieser Code passt nicht. Bitte genau so einfügen, wie du ihn bekommen hast.', 'This code does not fit. Please paste it exactly as you received it.', 'Код не подходит. Вставьте его точно как получили.', 'Ten kod nie pasuje. Wklej go dokładnie tak, jak go otrzymałeś.'],
    foreign: ['Dieser Code ist echt, aber nicht vom Herausgeber dieser App.', 'This code is genuine but not from the publisher of this app.', 'Код настоящий, но не от издателя этого приложения.', 'Ten kod jest prawdziwy, ale nie od wydawcy tej aplikacji.'],
    owner: ['Auf diesem Gerät liegt der Herausgeber-Schlüssel: alle Werkzeuge sind frei.', 'This device holds the publisher key: all tools are open.', 'На этом устройстве ключ издателя: все инструменты открыты.', 'To urządzenie ma klucz wydawcy: wszystkie narzędzia są otwarte.'],
    studio: ['🛠 Herausgeber-Studio', '🛠 Publisher studio', '🛠 Студия издателя', '🛠 Studio wydawcy'],
    studioHelp: ['Nur für den Herausgeber. Hier entstehen die Codes für Käufer. Der geheime Schlüssel bleibt verschlüsselt auf diesem Gerät.', 'For the publisher only. Codes for buyers are made here. The secret key stays encrypted on this device.', 'Только для издателя. Здесь создаются коды. Секретный ключ остаётся зашифрованным на устройстве.', 'Tylko dla wydawcy. Tu powstają kody. Tajny klucz zostaje zaszyfrowany na urządzeniu.'],
    pw: ['Studio-Passwort (mindestens 8 Zeichen)', 'Studio password (at least 8 characters)', 'Пароль студии (не менее 8 символов)', 'Hasło studia (co najmniej 8 znaków)'],
    pw2: ['Passwort wiederholen', 'Repeat password', 'Повторите пароль', 'Powtórz hasło'],
    makeKey: ['Schlüssel anlegen', 'Create key', 'Создать ключ', 'Utwórz klucz'],
    pwShort: ['Das Passwort braucht mindestens 8 Zeichen, beide Felder gleich.', 'The password needs at least 8 characters, both fields the same.', 'Пароль: не менее 8 символов, оба поля одинаковы.', 'Hasło: co najmniej 8 znaków, oba pola takie same.'],
    pwWrong: ['Falsches Studio-Passwort.', 'Wrong studio password.', 'Неверный пароль студии.', 'Błędne hasło studia.'],
    pub: ['Öffentlicher Schlüssel (nicht geheim, darf in die App):', 'Public key (not secret, may go into the app):', 'Открытый ключ (не секретный):', 'Klucz publiczny (nie jest tajny):'],
    pubTodo: ['Schick diesen öffentlichen Schlüssel an Claude. Dann erkennt jede App deine Codes. Bis dahin gelten sie nur auf diesem Gerät.', 'Send this public key to Claude. Then every app recognises your codes. Until then they only count on this device.', 'Отправьте этот открытый ключ Claude. До этого коды действуют только на этом устройстве.', 'Wyślij ten klucz publiczny do Claude. Do tego czasu kody działają tylko na tym urządzeniu.'],
    pubKnown: ['✓ Dieser Schlüssel steht in der App: alle Käufer-Apps erkennen deine Codes.', '✓ This key is in the app: every buyer app recognises your codes.', '✓ Ключ в приложении: все копии узнают коды.', '✓ Klucz jest w aplikacji: każda kopia rozpozna kody.'],
    copy: ['Kopieren', 'Copy', 'Копировать', 'Kopiuj'],
    copied: ['Kopiert.', 'Copied.', 'Скопировано.', 'Skopiowano.'],
    share: ['Teilen', 'Share', 'Поделиться', 'Udostępnij'],
    buyer: ['Für wen? (Name des Käufers)', 'For whom? (buyer name)', 'Для кого? (имя покупателя)', 'Dla kogo? (nazwa kupującego)'],
    which: ['Welche Werkzeuge?', 'Which tools?', 'Какие инструменты?', 'Które narzędzia?'],
    makeCode: ['Code erstellen', 'Create code', 'Создать код', 'Utwórz kod'],
    needTools: ['Bitte Namen eintragen und mindestens ein Werkzeug wählen.', 'Please enter a name and choose at least one tool.', 'Введите имя и выберите инструмент.', 'Wpisz nazwę i wybierz narzędzie.'],
    made: ['Code für {n} — per Mail oder Nachricht schicken:', 'Code for {n} — send it by mail or message:', 'Код для {n} — отправьте письмом:', 'Kod dla {n} — wyślij e-mailem:'],
    log: ['Erstellte Codes', 'Codes created', 'Созданные коды', 'Utworzone kody'],
    backup: ['Schlüssel-Sicherung kopieren', 'Copy key backup', 'Копировать резервную копию ключа', 'Kopiuj kopię klucza'],
    backupHelp: ['Die Sicherung ist mit deinem Studio-Passwort verschlüsselt. Bewahre sie gut auf (z. B. im Tresor). Ohne sie und ohne dieses Gerät kannst du keine neuen Codes machen.', 'The backup is encrypted with your studio password. Keep it safe (e.g. in the vault). Without it and without this device you cannot make new codes.', 'Копия зашифрована паролем студии. Храните её надёжно.', 'Kopia jest zaszyfrowana hasłem studia. Przechowuj ją bezpiecznie.'],
    restore: ['Schlüssel aus Sicherung holen', 'Restore key from backup', 'Восстановить ключ из копии', 'Przywróć klucz z kopii'],
    restoreBad: ['Diese Sicherung passt nicht oder das Passwort stimmt nicht.', 'This backup does not fit or the password is wrong.', 'Копия не подходит или пароль неверен.', 'Kopia nie pasuje lub hasło jest błędne.'],
    restored: ['✓ Schlüssel zurückgeholt.', '✓ Key restored.', '✓ Ключ восстановлен.', '✓ Klucz przywrócony.'],
    limit: ['Ehrlich: Eine App auf fremden Geräten lässt sich mit Fachwissen auseinandernehmen. Für normale Käufer ist das eine klare Sperre. Ein weitergegebener Code trägt den Namen dessen, für den er gemacht wurde.', 'Honestly: an app on someone else\'s device can be taken apart with expertise. For normal buyers this is a clear lock. A passed-on code carries the name of whom it was made for.', 'Честно: приложение можно разобрать. Для обычных покупателей это надёжный замок. Переданный код несёт имя владельца.', 'Szczerze: aplikację da się rozebrać. Dla zwykłych kupujących to wyraźna blokada. Przekazany kod nosi imię właściciela.'],
    removeCode: ['Code entfernen', 'Remove code', 'Удалить код', 'Usuń kod'],
    removeAsk: ['Diesen Code von diesem Gerät entfernen? Die Werkzeuge werden wieder gesperrt.', 'Remove this code from this device? The tools will be locked again.', 'Удалить код? Инструменты снова закроются.', 'Usunąć kod? Narzędzia zostaną zablokowane.']
  };
  const t = (k, v = {}) => { let s = (W[k] || [k])[li()] || W[k][0]; for (const x in v) s = s.split('{' + x + '}').join(v[x]); return s; };
  const toolName = tool => tool.name[li()] || tool.name[0];

  // ---------- encoding and crypto ----------
  const enc = new TextEncoder(), dec = new TextDecoder();
  const b64u = bytes => { let s = ''; for (const b of bytes) s += String.fromCharCode(b); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
  const unb64u = text => { const s = atob(String(text).replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((String(text).length + 3) % 4)); return Uint8Array.from(s, c => c.charCodeAt(0)); };
  const hex = bytes => [...bytes].map(b => b.toString(16).padStart(2, '0')).join('');
  const unhex = text => Uint8Array.from(String(text).match(/../g) || [], h => parseInt(h, 16));
  const sha = async bytes => new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));
  let nobleP = null;
  const noble = () => (nobleP ||= import(new URL('modules/noble-secp256k1.js', document.baseURI).href));
  async function wrapKey(password, salt) {
    const base = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: 600000 }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  }
  async function seal(secret, password) {
    const salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: enc.encode('pb-studio-v1') }, await wrapKey(password, salt), secret));
    return { v: 1, salt: b64u(salt), iv: b64u(iv), ct: b64u(ct) };
  }
  async function open(box, password) {
    const key = await wrapKey(password, unb64u(box.salt));
    return new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64u(box.iv), additionalData: enc.encode('pb-studio-v1') }, key, unb64u(box.ct)));
  }

  // ---------- trusted publishers and stored codes ----------
  let publishers = [];
  const ready = fetch('license-keys.json').then(r => r.ok ? r.json() : { publishers: [] }).catch(() => ({ publishers: [] }))
    .then(data => { publishers = (data.publishers || []).map(p => String(p.key || '').toLowerCase()).filter(k => /^[0-9a-f]{64}$/.test(k)); });
  const get = (k, d) => { try { return JSON.parse(localStorage.getItem(k) || 'null') ?? d; } catch { return d; } };
  const put = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* private mode */ } };
  const STUDIO = 'pb_studio_v1', CODES = 'pb_license_codes', LOG = 'pb_studio_log';
  const studio = () => get(STUDIO, null);
  function trusted() {
    const own = studio()?.pub;
    // Until the publisher key is in the app, a device trusts only its own studio key (honest preview limit).
    return publishers.length ? publishers : (own ? [own] : []);
  }
  const isOwner = () => { const own = studio()?.pub; return Boolean(own && trusted().includes(own)); };
  async function check(code) {
    const m = /^PBK1\.([A-Za-z0-9_-]+)\.([A-Za-z0-9_-]+)$/.exec(String(code || '').replace(/\s+/g, ''));
    if (!m) return { ok: false, why: 'bad' };
    let data;
    try { data = JSON.parse(dec.decode(unb64u(m[1]))); } catch { return { ok: false, why: 'bad' }; }
    if (data?.v !== 1 || !Array.isArray(data.t) || !data.id) return { ok: false, why: 'bad' };
    const msg = await sha(enc.encode('PBK1.' + m[1])), sig = unb64u(m[2]);
    const { schnorr } = await noble();
    for (const key of trusted()) { try { if (await schnorr.verify(sig, msg, key)) return { ok: true, data, code: 'PBK1.' + m[1] + '.' + m[2] }; } catch { /* next key */ } }
    // Genuine but signed by someone else? (any valid signature needs a key; we can only say "not ours")
    return { ok: false, why: 'foreign' };
  }
  let open_ = new Set();
  async function refresh() {
    await ready;
    const next = new Set();
    if (isOwner()) for (const tool of TOOLS) next.add(tool.id);
    for (const code of get(CODES, [])) { const r = await check(code).catch(() => null); if (r?.ok) for (const id of r.data.t) next.add(id); }
    open_ = next; dispatchEvent(new CustomEvent('pb:license')); paint();
    return open_;
  }
  const unlocked = id => open_.has(id);
  async function addCode(code) {
    const r = await check(code);
    if (!r.ok) return r;
    const codes = get(CODES, []); if (!codes.includes(r.code)) { codes.push(r.code); put(CODES, codes); }
    await refresh(); return r;
  }

  // ---------- studio ----------
  async function createKey(password) {
    const { schnorr, utils } = await noble();
    const secret = utils.randomPrivateKey(), pub = hex(await schnorr.getPublicKey(secret));
    put(STUDIO, { ...(await seal(secret, password)), pub, made: Date.now() });
    secret.fill(0); await refresh(); return pub;
  }
  async function makeCode(password, buyer, tools) {
    const box = studio(); if (!box) throw new Error('no studio');
    let secret;
    try { secret = await open(box, password); } catch { throw new Error('password'); }
    const { schnorr } = await noble();
    const data = { v: 1, id: hex(crypto.getRandomValues(new Uint8Array(6))), n: String(buyer).trim().slice(0, 80), t: tools, d: new Date().toISOString().slice(0, 10) };
    const body = b64u(enc.encode(JSON.stringify(data)));
    const sig = await schnorr.sign(await sha(enc.encode('PBK1.' + body)), secret);
    secret.fill(0);
    const code = 'PBK1.' + body + '.' + b64u(sig);
    const log = get(LOG, []); log.unshift({ id: data.id, n: data.n, t: tools, d: data.d }); put(LOG, log.slice(0, 500));
    return { code, data };
  }
  const backupText = () => { const box = studio(); return box ? 'PBSTUDIO1.' + b64u(enc.encode(JSON.stringify(box))) : ''; };
  async function restoreBackup(text, password) {
    const m = /^PBSTUDIO1\.([A-Za-z0-9_-]+)$/.exec(String(text || '').replace(/\s+/g, ''));
    if (!m) throw new Error('bad');
    const box = JSON.parse(dec.decode(unb64u(m[1])));
    const secret = await open(box, password);   // throws on a wrong password
    const { schnorr } = await noble();
    if (hex(await schnorr.getPublicKey(secret)) !== box.pub) throw new Error('bad');
    secret.fill(0); put(STUDIO, box); await refresh();
  }

  // ---------- settings box ----------
  const make = (tag, text, cls) => { const e = document.createElement(tag); if (text) e.textContent = text; if (cls) e.className = cls; return e; };
  const button = (text, onclick, cls = 'ghost') => { const b = make('button', text, cls); b.type = 'button'; b.onclick = onclick; return b; };
  const say = (node, text) => { node.textContent = text; };
  async function copy(text, status) { try { await navigator.clipboard.writeText(text); say(status, t('copied')); } catch { say(status, text); } }
  let box = null;
  function paint() {
    const settings = document.getElementById('panel-settings'); if (!settings) return;
    if (!box) { box = make('div', null, 'note pb-license'); box.id = 'pb-license'; (document.getElementById('install-box') || settings.lastElementChild)?.before(box); }
    const status = make('p', null, 'hint'); status.setAttribute('role', 'status'); status.dataset.licenseStatus = '';
    const list = make('ul', null, 'pb-license-tools');
    for (const tool of TOOLS) { const li = make('li'); li.dataset.tool = tool.id; li.dataset.open = String(unlocked(tool.id)); li.append(make('span', tool.icon + ' ' + toolName(tool)), make('b', unlocked(tool.id) ? t('unlocked') : t('locked'))); list.append(li); }
    const field = make('textarea'); field.id = 'pbLicenseCode'; field.rows = 2; field.dataset.noDictate = '1'; field.placeholder = 'PBK1.…'; field.setAttribute('aria-label', t('code'));
    const go = button(t('unlock'), async () => {
      go.disabled = true;
      try {
        const r = await addCode(field.value);
        if (r.ok) { field.value = ''; say(document.querySelector('[data-license-status]'), t('ok') + r.data.t.map(id => toolName(TOOLS.find(x => x.id === id) || { name: [id] })).join(', ') + (r.data.n ? t('for', { n: r.data.n }) : '')); }
        else say(status, t(r.why));
      } finally { go.disabled = false; }
    }, 'pb-license-go');
    box.replaceChildren(make('h3', t('box')), make('p', t('boxHelp')), list);
    if (isOwner()) box.append(make('p', t('owner'), 'hint pb-license-owner'));
    const lab = make('label', null, 'field'); lab.append(make('span', t('code')), field);
    box.append(lab, go, status);
    const codes = get(CODES, []);
    if (codes.length) {
      const d = make('details'); d.append(make('summary', '🧾 ' + codes.length));
      for (const c of codes) d.append(make('p', c.slice(0, 18) + '…', 'hint'), button(t('removeCode'), () => { if (!confirm(t('removeAsk'))) return; put(CODES, get(CODES, []).filter(x => x !== c)); void refresh(); }));
      box.append(d);
    }
    box.append(studioPart(), make('p', t('limit'), 'hint pb-license-limit'));
  }
  function studioPart() {
    const d = make('details', null, 'pb-studio'); d.id = 'pb-studio';
    d.append(make('summary', t('studio')), make('p', t('studioHelp'), 'hint'));
    const status = make('p', null, 'hint'); status.setAttribute('role', 'status'); status.dataset.studioStatus = '';
    const pw = make('input'); pw.type = 'password'; pw.autocomplete = 'new-password'; pw.placeholder = t('pw'); pw.setAttribute('aria-label', t('pw')); pw.dataset.studioPw = '';
    const s = studio();
    if (!s) {
      const pw2 = make('input'); pw2.type = 'password'; pw2.autocomplete = 'new-password'; pw2.placeholder = t('pw2'); pw2.setAttribute('aria-label', t('pw2')); pw2.dataset.studioPw2 = '';
      const mk = button(t('makeKey'), async () => {
        if (pw.value.length < 8 || pw.value !== pw2.value) { say(status, t('pwShort')); return; }
        mk.disabled = true; try { await createKey(pw.value); document.getElementById('pb-studio').open = true; } finally { mk.disabled = false; }
      }, 'pb-studio-make-key');
      const restore = make('details'); const text = make('textarea'); text.rows = 2; text.dataset.noDictate = '1'; text.placeholder = 'PBSTUDIO1.…'; text.dataset.studioBackup = '';
      const rp = make('input'); rp.type = 'password'; rp.placeholder = t('pw'); rp.setAttribute('aria-label', t('pw'));
      restore.append(make('summary', t('restore')), text, rp, button(t('restore'), async () => { try { await restoreBackup(text.value, rp.value); document.getElementById('pb-studio').open = true; say(document.querySelector('[data-studio-status]'), t('restored')); } catch { say(status, t('restoreBad')); } }));
      d.append(pw, pw2, mk, status, restore);
      return d;
    }
    const pubLine = make('p', null, 'pb-studio-pub'); pubLine.append(make('span', t('pub') + ' '), make('code', s.pub));
    const pubStatus = make('p', null, 'hint');
    d.append(pubLine, button(t('copy'), () => copy(s.pub, pubStatus)), make('p', publishers.includes(s.pub) ? t('pubKnown') : t('pubTodo'), 'hint pb-studio-pub-note'), pubStatus);
    const name = make('input'); name.placeholder = t('buyer'); name.setAttribute('aria-label', t('buyer')); name.dataset.studioBuyer = '';
    const picks = make('fieldset', null, 'pb-studio-tools'); picks.append(make('legend', t('which')));
    for (const tool of TOOLS) { const l = make('label'); const c = make('input'); c.type = 'checkbox'; c.value = tool.id; l.append(c, document.createTextNode(' ' + tool.icon + ' ' + toolName(tool))); picks.append(l); }
    const out = make('div', null, 'pb-studio-out');
    const mk = button(t('makeCode'), async () => {
      const tools = [...picks.querySelectorAll('input:checked')].map(c => c.value);
      if (!name.value.trim() || !tools.length) { say(status, t('needTools')); return; }
      mk.disabled = true; say(status, '');
      try {
        const { code, data } = await makeCode(pw.value, name.value, tools);
        const area = make('textarea'); area.readOnly = true; area.rows = 3; area.value = code; area.dataset.studioCode = '';
        const st = make('p', null, 'hint');
        out.replaceChildren(make('p', t('made', { n: data.n })), area, button(t('copy'), () => copy(code, st)),
          ...(navigator.share ? [button(t('share'), () => navigator.share({ text: code }).catch(() => {}))] : []), st);
      } catch (error) { say(status, error.message === 'password' ? t('pwWrong') : String(error.message || error)); }
      finally { mk.disabled = false; }
    }, 'pb-studio-make-code');
    d.append(name, picks, pw, mk, status, out);
    const log = get(LOG, []);
    if (log.length) { const l = make('details'); l.append(make('summary', t('log') + ' (' + log.length + ')')); const ul = make('ul'); for (const e of log) ul.append(make('li', e.d + ' · ' + e.n + ' · ' + e.t.join(', '))); l.append(ul); d.append(l); }
    const bst = make('p', null, 'hint');
    d.append(button(t('backup'), () => copy(backupText(), bst)), make('p', t('backupHelp'), 'hint'), bst);
    return d;
  }
  new MutationObserver(() => { box = null; document.getElementById('pb-license')?.remove(); paint(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });

  window.PBLicense = { TOOLS, toolName, unlocked, refresh, addCode, check, isOwner, createKey, makeCode, backupText, restoreBackup, words: t, ready };
  void refresh();
})();
