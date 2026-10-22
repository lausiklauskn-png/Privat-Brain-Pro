/* 🔑 Unlock codes for the tools (Klaus 2026-10-22: "die Freigabe für diese Tools soll mit einem Schlüssel passieren …
   jemand, der mir das Passwort abkauft oder den Schlüssel, der kann diese Tools benutzen und öffnen").
   Klaus' choice: one code per buyer, checked without internet.
   - The publisher (Klaus) makes a key pair in the "Herausgeber-Studio" on his own device. The secret half is stored only
     there, encrypted with his password (PBKDF2-SHA256 600 000 → AES-256-GCM). It is never in the app for buyers, in Git
     or in a chat. The public half goes into native/license-keys.json; then every copy of the app recognises his codes.
   - A code is "PBK1.<data>.<signature>": data = {v, id, n (buyer), t (tools), d (date)}, signed with BIP-340 Schnorr
     (modules/noble-secp256k1.js, the same as everywhere in the SBKIM network) over SHA-256("PBK1.<data>").
   - Until his public key is in the app, a device trusts only its own studio key (so Klaus can try it out).
     Built with care to the best of our knowledge; a clear lock for normal buyers.
   Klaus 2026-10-22: the visible box stays plain (tools, code field, button). The studio opens only after a long press
   (1.5 s) on the © at the bottom of the settings page; the buyer is named by the pseudonym given at payment. */
(() => {
  'use strict';
  const TOOLS = [
    { id: 'pinnwand', img: 'tool-icons/pinnwand.png', icon: '📌', name: ['Pinnwand', 'Pin board', 'Доска', 'Tablica'] },
    { id: 'suche', img: 'tool-icons/suche.png', icon: '🔎', name: ['Such-Tool', 'Search tool', 'Поиск', 'Wyszukiwarka'] },
    { id: 'kimsync', img: 'tool-icons/kimsync.png', icon: '💬', name: ['Kim-Sync', 'Kim-Sync', 'Kim-Sync', 'Kim-Sync'] },
    { id: 'dateipost', img: 'tool-icons/dateipost.svg', icon: '📦', name: ['Datei-Post', 'File post', 'Почта файлов', 'Poczta plików'] },
    { id: 'sendepruefer', img: 'tool-icons/sendepruefer.png', icon: '✉️', name: ['Sende-Prüfer', 'Send checker', 'Проверка отправки', 'Kontrola wysyłki'] },
    { id: 'auslieferung', img: 'tool-icons/auslieferung.png', icon: '🚚', name: ['Auslieferungsprüfer', 'Delivery checker', 'Проверка доставки', 'Kontrola dostawy'] },
    { id: 'inandout', img: 'tool-icons/inandout.png', icon: '📒', name: ['In-and-Out-Book', 'In-and-Out-Book', 'In-and-Out-Book', 'In-and-Out-Book'] },
    { id: 'fpvideo', img: 'tool-icons/fpvideo.png', icon: '🎬', name: ['FP-Videos', 'FP videos', 'FP-видео', 'Filmy FP'] }
  ];
  const L = ['de', 'en', 'ru', 'pl'];
  const li = () => Math.max(0, L.indexOf(String(document.documentElement.lang || 'de').slice(0, 2)));
  const W = {
    box: ['🔑 Werkzeuge freischalten', '🔑 Unlock tools', '🔑 Открыть инструменты', '🔑 Odblokuj narzędzia'],
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
    buyer: ['Pseudonym des Käufers (wie beim Kauf angegeben)', 'Buyer\'s pseudonym (as given at purchase)', 'Псевдоним покупателя (как при покупке)', 'Pseudonim kupującego (jak przy zakupie)'],
    studioShown: ['🛠 Herausgeber-Studio eingeblendet', '🛠 Publisher studio shown', '🛠 Студия издателя показана', '🛠 Studio wydawcy widoczne'],
    studioHidden: ['🛠 Herausgeber-Studio ausgeblendet', '🛠 Publisher studio hidden', '🛠 Студия издателя скрыта', '🛠 Studio wydawcy ukryte'],
    which: ['Welche Werkzeuge?', 'Which tools?', 'Какие инструменты?', 'Które narzędzia?'],
    makeCode: ['Code erstellen', 'Create code', 'Создать код', 'Utwórz kod'],
    needTools: ['Bitte Pseudonym eintragen und mindestens ein Werkzeug wählen.', 'Please enter a pseudonym and choose at least one tool.', 'Введите имя и выберите инструмент.', 'Wpisz nazwę i wybierz narzędzie.'],
    made: ['Code für {n} — per Mail oder Nachricht schicken:', 'Code for {n} — send it by mail or message:', 'Код для {n} — отправьте письмом:', 'Kod dla {n} — wyślij e-mailem:'],
    log: ['Erstellte Codes', 'Codes created', 'Созданные коды', 'Utworzone kody'],
    backup: ['Schlüssel-Sicherung kopieren', 'Copy key backup', 'Копировать резервную копию ключа', 'Kopiuj kopię klucza'],
    backupHelp: ['Die Sicherung ist mit deinem Studio-Passwort verschlüsselt. Bewahre sie gut auf (z. B. im Tresor). Ohne sie und ohne dieses Gerät kannst du keine neuen Codes machen.', 'The backup is encrypted with your studio password. Keep it safe (e.g. in the vault). Without it and without this device you cannot make new codes.', 'Копия зашифрована паролем студии. Храните её надёжно.', 'Kopia jest zaszyfrowana hasłem studia. Przechowuj ją bezpiecznie.'],
    restore: ['Schlüssel aus Sicherung holen', 'Restore key from backup', 'Восстановить ключ из копии', 'Przywróć klucz z kopii'],
    restoreBad: ['Diese Sicherung passt nicht oder das Passwort stimmt nicht.', 'This backup does not fit or the password is wrong.', 'Копия не подходит или пароль неверен.', 'Kopia nie pasuje lub hasło jest błędne.'],
    restored: ['✓ Schlüssel zurückgeholt.', '✓ Key restored.', '✓ Ключ восстановлен.', '✓ Klucz przywrócony.'],
    probeHead: ['🧠 Kennst du dein Studio-Passwort noch?', '🧠 Do you still know your studio password?', '🧠 Помните пароль студии?', '🧠 Pamiętasz hasło studia?'],
    probeHelp: ['Einmal zur Probe eingeben. So bleibt es im Kopf. Es geht nichts ins Netz.', 'Enter it once as a check, so it stays in your head. Nothing goes online.', 'Введите для проверки. Ничего не уходит в сеть.', 'Wpisz dla sprawdzenia. Nic nie trafia do sieci.'],
    probeCheck: ['Prüfen', 'Check', 'Проверить', 'Sprawdź'],
    probeLater: ['Später', 'Later', 'Позже', 'Później'],
    probeOk: ['✓ Richtig. Die nächste Probe kommt in 4 Wochen.', '✓ Correct. The next check comes in 4 weeks.', '✓ Верно. Следующая проверка через 4 недели.', '✓ Dobrze. Następne sprawdzenie za 4 tygodnie.'],
    probeBad: ['✗ Das war nicht richtig. Solange du die Schlüssel-Sicherung oder 3 Ersatzschlüssel hast, kannst du ein neues Passwort setzen: Einstellungen, unten lange auf © drücken, dann Studio → „Passwort vergessen?“.', '✗ That was not right. As long as you have the key backup or 3 spare keys you can set a new password: Settings, long-press © at the bottom, then studio → "Forgot the password?".', '✗ Неверно. С копией или 3 запасными ключами можно задать новый пароль.', '✗ Niepoprawne. Z kopią lub 3 kluczami zapasowymi ustawisz nowe hasło.'],
    probeNext: ['Nächste Passwort-Probe: ', 'Next password check: ', 'Следующая проверка: ', 'Następne sprawdzenie: '],
    probeNow: ['Jetzt zur Probe eingeben', 'Check it now', 'Проверить сейчас', 'Sprawdź teraz'],
    sharesMake: ['🧩 Ersatzschlüssel erstellen (3 von 5)', '🧩 Create spare keys (3 of 5)', '🧩 Создать запасные ключи (3 из 5)', '🧩 Utwórz klucze zapasowe (3 z 5)'],
    sharesHelp: ['Der Studio-Schlüssel wird in 5 Teile geteilt. 3 beliebige Teile holen ihn zurück, auch ohne Passwort. 1 oder 2 Teile allein sind wertlos. Verteile sie an getrennte Orte: z. B. eine E-Mail an dich selbst, dein privates Schlüssel-Tresor-Repo, Papier zu Hause, ein Familienmitglied, ein USB-Stick. Nie alle an einen Ort.', 'The studio key is split into 5 parts. Any 3 bring it back, even without the password. 1 or 2 parts alone are worthless. Keep them in separate places: e.g. an email to yourself, your private key-vault repo, paper at home, a family member, a USB stick. Never all in one place.', 'Ключ делится на 5 частей; любые 3 восстанавливают его. 1–2 части бесполезны. Храните раздельно.', 'Klucz dzieli się na 5 części; dowolne 3 go przywracają. 1–2 części są bezwartościowe. Przechowuj osobno.'],
    sharePart: ['Teil {i} von 5', 'Part {i} of 5', 'Часть {i} из 5', 'Część {i} z 5'],
    sharesDone: ['Ich habe die 5 Teile an getrennten Orten abgelegt', 'I have put the 5 parts in separate places', 'Я разложил 5 частей по разным местам', 'Umieściłem 5 części w różnych miejscach'],
    sharesMade: ['🧩 Ersatzschlüssel erstellt am ', '🧩 Spare keys created on ', '🧩 Запасные ключи созданы ', '🧩 Klucze zapasowe utworzone '],
    sharesNone: ['🧩 Noch keine Ersatzschlüssel. Empfohlen, damit ein vergessenes Passwort kein Verlust ist.', '🧩 No spare keys yet. Recommended, so a forgotten password is not a loss.', '🧩 Запасных ключей нет. Рекомендуется.', '🧩 Brak kluczy zapasowych. Zalecane.'],
    forgot: ['Passwort vergessen? Mit 3 Ersatzschlüsseln ein neues setzen', 'Forgot the password? Set a new one with 3 spare keys', 'Забыли пароль? Новый с 3 запасными ключами', 'Zapomniałeś hasła? Ustaw nowe z 3 kluczami'],
    fromShares: ['Mit 3 Ersatzschlüsseln zurückholen', 'Restore with 3 spare keys', 'Восстановить 3 запасными ключами', 'Przywróć 3 kluczami zapasowymi'],
    shareField: ['Ersatzschlüssel {i} (JT3v5-…)', 'Spare key {i} (JT3v5-…)', 'Запасной ключ {i}', 'Klucz zapasowy {i}'],
    newPw: ['Neues Studio-Passwort (mindestens 8 Zeichen)', 'New studio password (at least 8 characters)', 'Новый пароль студии', 'Nowe hasło studia'],
    sharesBad: ['Diese Teile passen nicht zusammen oder nicht zu diesem Studio-Schlüssel: ', 'These parts do not fit together or not to this studio key: ', 'Части не подходят: ', 'Części nie pasują: '],
    sharesRestored: ['✓ Studio-Schlüssel zurückgeholt, neues Passwort gesetzt. Am besten gleich neue Ersatzschlüssel erstellen.', '✓ Studio key restored, new password set. Best create new spare keys now.', '✓ Ключ восстановлен, пароль задан.', '✓ Klucz przywrócony, nowe hasło ustawione.'],
    close: ['Schließen', 'Close', 'Закрыть', 'Zamknij'],
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
    setTimeout(askProbe, 1500);   // the studio password is asked now and then (probe, Klaus 2026-10-22)
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
    put(PROBE, { next: Date.now() + PROBE_DAYS * 864e5 });
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
    secret.fill(0); put(STUDIO, box); put(PROBE, { next: Date.now() + PROBE_DAYS * 864e5 }); await refresh();
  }

  // ---------- 🧠 password check now and then, 🧩 spare keys 3 of 5 (Klaus 2026-10-22, for .27) ----------
  const PROBE = 'pb_studio_probe', SHARES = 'pb_studio_shares', PROBE_DAYS = 28;
  const probeDue = () => Boolean(studio()) && Date.now() >= (get(PROBE, {}).next || 0);
  async function probe(password) {
    const box = studio(); if (!box) return false;
    let ok = false;
    try { const secret = await open(box, password); secret.fill(0); ok = true; } catch { ok = false; }
    put(PROBE, { ...get(PROBE, {}), last: Date.now(), ok, next: ok ? Date.now() + PROBE_DAYS * 864e5 : Date.now() });
    return ok;
  }
  async function makeShares(password) {
    const box = studio(); if (!box) throw new Error('no studio');
    let secret; try { secret = await open(box, password); } catch { throw new Error('password'); }
    if (!window.JasonLib?.splitSecret) throw new Error('JasonLib missing');
    const result = await window.JasonLib.splitSecret(hex(secret)); secret.fill(0);
    put(SHARES, { made: Date.now(), fp: result.fingerprint, pub: box.pub });
    return result.shares;
  }
  // Three parts give the secret key back; it is sealed again with a new password. On a device that already holds a studio
  // key, the parts must belong to that very key (same public key), so nobody replaces it with their own.
  async function restoreFromShares(parts, password) {
    const hexKey = await window.JasonLib.combineShares(parts.filter(Boolean));
    if (!/^[0-9a-f]{64}$/.test(hexKey)) throw new Error('not a studio key');
    const secret = unhex(hexKey), { schnorr } = await noble(), pub = hex(await schnorr.getPublicKey(secret));
    const own = studio()?.pub;
    if (own && own !== pub) { secret.fill(0); throw new Error('other key'); }
    put(STUDIO, { ...(await seal(secret, password)), pub, made: studio()?.made || Date.now() });
    secret.fill(0); put(PROBE, { next: Date.now() + PROBE_DAYS * 864e5, last: Date.now(), ok: true }); await refresh();
    return pub;
  }
  let probeAsked = false;
  function askProbe() {
    if (probeAsked || !probeDue() || document.querySelector('dialog.pb-studio-probe')) return;
    probeAsked = true;
    const dialog = make('dialog', null, 'live-dialog pb-studio-probe');
    const pw = make('input'); pw.type = 'password'; pw.autocomplete = 'current-password'; pw.placeholder = t('pw'); pw.setAttribute('aria-label', t('pw'));
    const status = make('p', null, 'hint'); status.setAttribute('role', 'status');
    const check = button(t('probeCheck'), async () => {
      check.disabled = true;
      const ok = await probe(pw.value); pw.value = '';
      status.textContent = ok ? t('probeOk') : t('probeBad'); status.dataset.ok = String(ok);
      check.disabled = false; if (ok) { check.hidden = true; later.textContent = t('close'); }
      paint();
    }, 'pb-studio-probe-check');
    const later = button(t('probeLater'), () => dialog.close());
    dialog.append(make('h2', t('probeHead')), make('p', t('probeHelp')), pw, check, later, status);
    document.body.append(dialog); dialog.addEventListener('close', () => dialog.remove()); dialog.showModal();
  }
  function sharesBlock(withPassword) {
    // Five fields for the parts; withPassword: the device has no studio key yet, or the password is forgotten.
    const wrap = make('div', null, 'pb-studio-shares-in');
    const fields = [1, 2, 3, 4, 5].map(i => { const f = make('textarea'); f.rows = 1; f.dataset.noDictate = '1'; f.placeholder = t('shareField', { i }); f.setAttribute('aria-label', t('shareField', { i })); f.dataset.sharePart = String(i); return f; });
    const np = make('input'); np.type = 'password'; np.autocomplete = 'new-password'; np.placeholder = t('newPw'); np.setAttribute('aria-label', t('newPw'));
    const np2 = make('input'); np2.type = 'password'; np2.autocomplete = 'new-password'; np2.placeholder = t('pw2'); np2.setAttribute('aria-label', t('pw2'));
    const status = make('p', null, 'hint'); status.setAttribute('role', 'status');
    const go = button(t('fromShares'), async () => {
      if (np.value.length < 8 || np.value !== np2.value) { status.textContent = t('pwShort'); return; }
      go.disabled = true;
      try { await restoreFromShares(fields.map(f => f.value.trim()), np.value); document.getElementById('pb-studio').open = true; say(document.querySelector('[data-studio-status]'), t('sharesRestored')); }
      catch (error) { status.textContent = t('sharesBad') + String(error?.message || error).slice(0, 140); }
      finally { go.disabled = false; }
    }, 'pb-studio-from-shares');
    wrap.append(...fields, np, np2, go, status);
    return wrap;
  }

  // ---------- settings box ----------
  const make = (tag, text, cls) => { const e = document.createElement(tag); if (text) e.textContent = text; if (cls) e.className = cls; return e; };
  const button = (text, onclick, cls = 'ghost') => { const b = make('button', text, cls); b.type = 'button'; b.onclick = onclick; return b; };
  const say = (node, text) => { node.textContent = text; };
  // The tool's own icon (copied from its app); the emoji stays as the fallback when the picture cannot load.
  function toolIcon(tool) {
    if (!tool.img) return make('span', tool.icon, 'pb-tool-icon');
    const img = make('img', null, 'pb-tool-icon'); img.src = tool.img; img.alt = ''; img.width = img.height = 20; img.decoding = 'async';
    img.onerror = () => img.replaceWith(make('span', tool.icon, 'pb-tool-icon'));
    return img;
  }
  // 🛠 The studio is hidden; a long press on the © at the bottom of the settings page shows it (and hides it again).
  const SHOWN = 'pb_studio_visible', LONG_MS = 1500;
  const studioShown = () => { try { return localStorage.getItem(SHOWN) === '1'; } catch { return false; } };
  function copyrightMark() {
    const footer = document.querySelector('#panel-settings footer') || document.querySelector('footer');
    if (!footer || footer.querySelector('.pb-copyright')) return;
    const mark = make('span', '© 2026', 'pb-copyright'); mark.id = 'pbCopyright';
    // Klaus 2026-10-22: like the other studios (PWA Toolpoint, family-projekt.de, Kimboard, Sage) a LONG PRESS of 1.5 s
    // on the ©; moving the finger more than 10 px cancels, so scrolling over the footer never opens it.
    let timer = null, sx = 0, sy = 0, fired = false;
    const stop = () => { if (timer) { clearTimeout(timer); timer = null; } };
    const toggle = () => {
      try { localStorage.setItem(SHOWN, studioShown() ? '0' : '1'); } catch { /* stays as it is */ }
      paint();
      if (typeof window.toast === 'function') window.toast(studioShown() ? t('studioShown') : t('studioHidden'));
      if (studioShown()) document.getElementById('pb-studio')?.scrollIntoView({ block: 'center' });
    };
    mark.addEventListener('pointerdown', ev => { sx = ev.clientX; sy = ev.clientY; stop(); fired = false; timer = setTimeout(() => { timer = null; fired = true; toggle(); }, LONG_MS); });
    mark.addEventListener('pointermove', ev => { if (timer && (Math.abs(ev.clientX - sx) > 10 || Math.abs(ev.clientY - sy) > 10)) stop(); });
    for (const n of ['pointerup', 'pointercancel', 'pointerleave']) mark.addEventListener(n, stop);
    mark.addEventListener('click', ev => { if (fired) { ev.preventDefault(); fired = false; } }, true);
    mark.addEventListener('contextmenu', ev => { if (timer || fired) ev.preventDefault(); });
    footer.append(' ', mark);
  }
  async function copy(text, status) { try { await navigator.clipboard.writeText(text); say(status, t('copied')); } catch { say(status, text); } }
  let box = null;
  function paint() {
    const settings = document.getElementById('panel-settings'); if (!settings) return;
    copyrightMark();
    if (!box) { box = make('div', null, 'note pb-license'); box.id = 'pb-license'; (document.getElementById('install-box') || settings.lastElementChild)?.before(box); }
    const status = make('p', null, 'hint'); status.setAttribute('role', 'status'); status.dataset.licenseStatus = '';
    const list = make('ul', null, 'pb-license-tools');
    for (const tool of TOOLS) {
      const li = make('li'), open = unlocked(tool.id);
      li.dataset.tool = tool.id; li.dataset.open = String(open);
      const status = make('b', open ? '🔓' : '🔒');
      status.title = open ? t('unlocked') : t('locked');
      status.setAttribute('aria-label', status.title);
      li.append(toolIcon(tool), make('span', toolName(tool), 'pb-license-name'), status); list.append(li);
    }
    const field = make('textarea'); field.id = 'pbLicenseCode'; field.rows = 2; field.dataset.noDictate = '1'; field.placeholder = 'PBK1.…'; field.setAttribute('aria-label', t('code'));
    const go = button(t('unlock'), async () => {
      go.disabled = true;
      try {
        const r = await addCode(field.value);
        if (r.ok) { field.value = ''; say(document.querySelector('[data-license-status]'), t('ok') + r.data.t.map(id => toolName(TOOLS.find(x => x.id === id) || { name: [id] })).join(', ') + (r.data.n ? t('for', { n: r.data.n }) : '')); }
        else say(status, t(r.why));
      } finally { go.disabled = false; }
    }, 'pb-license-go');
    box.replaceChildren(make('h3', t('box')), list);
    if (isOwner() && studioShown()) box.append(make('p', t('owner'), 'hint pb-license-owner'));
    const lab = make('label', null, 'field'); lab.append(make('span', t('code')), field);
    box.append(lab, go, status);
    const codes = get(CODES, []);
    if (codes.length) {
      const d = make('details'); d.append(make('summary', '🧾 ' + codes.length));
      for (const c of codes) d.append(make('p', c.slice(0, 18) + '…', 'hint'), button(t('removeCode'), () => { if (!confirm(t('removeAsk'))) return; put(CODES, get(CODES, []).filter(x => x !== c)); void refresh(); }));
      box.append(d);
    }
    if (studioShown()) box.append(studioPart());
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
      const fromShares = make('details'); fromShares.append(make('summary', t('fromShares')), sharesBlock(true));
      d.append(pw, pw2, mk, status, restore, fromShares);
      return d;
    }
    const pubLine = make('p', null, 'pb-studio-pub'); pubLine.append(make('span', t('pub') + ' '), make('code', s.pub));
    const pubStatus = make('p', null, 'hint');
    d.append(pubLine, button(t('copy'), () => copy(s.pub, pubStatus)), make('p', publishers.includes(s.pub) ? t('pubKnown') : t('pubTodo'), 'hint pb-studio-pub-note'), pubStatus);
    const name = make('input'); name.placeholder = t('buyer'); name.setAttribute('aria-label', t('buyer')); name.dataset.studioBuyer = '';
    const picks = make('fieldset', null, 'pb-studio-tools'); picks.append(make('legend', t('which')));
    for (const tool of TOOLS) { const l = make('label'); const c = make('input'); c.type = 'checkbox'; c.value = tool.id; l.append(c, toolIcon(tool), document.createTextNode(' ' + toolName(tool))); picks.append(l); }
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
    // 🧩 spare keys
    const info = get(SHARES, null);
    const sharesBox = make('div', null, 'pb-studio-shares');
    sharesBox.append(make('p', info && info.pub === s.pub ? t('sharesMade') + new Date(info.made).toLocaleDateString(document.documentElement.lang) : t('sharesNone'), 'hint pb-studio-shares-state'));
    const shareOut = make('div', null, 'pb-studio-shares-out');
    const mkShares = button(t('sharesMake'), async () => {
      mkShares.disabled = true; say(status, '');
      try {
        const parts = await makeShares(pw.value);
        const rows = parts.map((part, i) => { const area = make('textarea'); area.readOnly = true; area.rows = 2; area.value = part; area.dataset.sharePart = String(i + 1); const st = make('p', null, 'hint');
          const row = make('div', null, 'pb-studio-share'); row.append(make('b', t('sharePart', { i: i + 1 })), area, button(t('copy'), () => copy(part, st)), ...(navigator.share ? [button(t('share'), () => navigator.share({ text: part }).catch(() => {}))] : []), st); return row; });
        const done = make('label'); const c = make('input'); c.type = 'checkbox'; c.onchange = () => { if (c.checked) { shareOut.replaceChildren(make('p', '✓ ' + t('sharesDone'), 'hint')); paint(); } };
        done.append(c, document.createTextNode(' ' + t('sharesDone')));
        shareOut.replaceChildren(...rows, done);
      } catch (error) { say(status, error.message === 'password' ? t('pwWrong') : String(error.message || error)); }
      finally { mkShares.disabled = false; }
    }, 'pb-studio-make-shares');
    sharesBox.append(make('p', t('sharesHelp'), 'hint'), mkShares, shareOut);
    // 🧠 password check
    const pr = get(PROBE, {});
    const probeLine = make('p', pr.next ? t('probeNext') + new Date(pr.next).toLocaleDateString(document.documentElement.lang) : '', 'hint pb-studio-probe-next');
    const probeNow = button(t('probeNow'), () => { probeAsked = false; put(PROBE, { ...get(PROBE, {}), next: 0 }); askProbe(); }, 'pb-studio-probe-now');
    const forgot = make('details', null, 'pb-studio-forgot'); forgot.append(make('summary', t('forgot')), sharesBlock(true));
    d.append(sharesBox, probeLine, probeNow, forgot);
    return d;
  }
  new MutationObserver(() => { box = null; document.getElementById('pb-license')?.remove(); paint(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });

  window.PBLicense = { toolIcon, studioShown, probe, probeDue, makeShares, restoreFromShares, TOOLS, toolName, unlocked, refresh, addCode, check, isOwner, createKey, makeCode, backupText, restoreBackup, words: t, ready };
  void refresh();
})();
