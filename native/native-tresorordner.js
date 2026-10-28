/* Gemeinsamer Tresorordner aller Pro-Apps (Schritt D2, Klaus 2026-10-27) — wie D1 in Workflow PDF Pro.
   Nur in der Android-App mit der Brücke ProVault.tresor*; sonst tut diese Datei nichts. Der Knopf
   „In den Tresorordner einziehen“ steht im Kasten „Speicherort und Verschlüsselung“ (#vaultPlace), sichtbar nur bei
   entsperrtem Speicherort. Passwort und Schlüssel bleiben in Android. Das Inhaltsverzeichnis entsteht aus dem Katalog
   (Name, Art, Datum, Größe, Auszug ≤ 1000 Zeichen — nie der ganze Mailtext) und wird nur bei einer Änderung neu
   geschrieben (Java vergleicht). „An BookLedgerPro teilen“ fragt bei verbundenem Ordner, ob die Mail ins Fach
   „Eingang-BookLedgerPro“ soll; die .eml geht dabei nicht durch die Seite (ProMail.tresorMailAblegen). */
(() => {
  'use strict';
  const api = window.Capacitor?.Plugins?.ProVault;
  if (!api || typeof api.tresorZustand !== 'function') return;
  const words = {
    // Leitfaden § 2: „Tresor (alle Pro-Apps)“ – der gemeinsame Ordner über den Ablagen.
    title: ['Tresor (alle Pro-Apps)', 'Vault (all Pro apps)', 'Сейф (все Pro-приложения)', 'Sejf (wszystkie aplikacje Pro)'],
    noFilesApp: ['Keine Dateien-App gefunden, die Ordner zeigen kann. Pfad: ', 'No Files app found that can show folders. Path: ', 'Не найдено приложение «Файлы». Путь: ', 'Nie znaleziono aplikacji Pliki. Ścieżka: '],
    intro: ['Ein Ordner, ein Passwort und ein Ersatzschlüssel für alle Pro-Apps (Private Brain Pro, Workflow PDF Pro, BookLedgerPro). Gewählt wird der Ordner, in dem „Private Brain“ liegt – für eine Probe eine Kopie davon (mit der Dateien-App kopiert). Dort kommen nur „tresorordner.json“ und der Ordner „Tresorordner“ dazu; „Private Brain“ bleibt, wie es ist.',
      'One folder, one password and one recovery key for all Pro apps (Private Brain Pro, Workflow PDF Pro, BookLedgerPro). Choose the folder that contains “Private Brain” – for a trial, a copy of it (copied with the Files app). Only “tresorordner.json” and the folder “Tresorordner” are added there; “Private Brain” stays as it is.',
      'Одна папка, один пароль и один ключ восстановления для всех Pro-приложений (Private Brain Pro, Workflow PDF Pro, BookLedgerPro). Выберите папку, в которой лежит «Private Brain» – для пробы её копию (скопированную приложением «Файлы»). Туда добавятся только «tresorordner.json» и папка «Tresorordner»; «Private Brain» не изменится.',
      'Jeden folder, jedno hasło i jeden klucz zapasowy dla wszystkich aplikacji Pro (Private Brain Pro, Workflow PDF Pro, BookLedgerPro). Wybierz folder, w którym leży „Private Brain” – na próbę jego kopię (skopiowaną aplikacją Pliki). Dodane zostaną tylko „tresorordner.json” i folder „Tresorordner”; „Private Brain” pozostaje bez zmian.'],
    move: ['In den Tresorordner einziehen …', 'Move into the shared vault folder …', 'Перенести в общую папку …', 'Przenieś do wspólnego folderu …'],
    unlock: ['Tresorordner entsperren …', 'Unlock shared vault folder …', 'Разблокировать общую папку …', 'Odblokuj wspólny folder …'],
    other: ['Anderen Tresorordner wählen …', 'Choose another shared vault folder …', 'Выбрать другую общую папку …', 'Wybierz inny wspólny folder …'],
    write: ['Inhaltsverzeichnis jetzt schreiben', 'Write table of contents now', 'Записать оглавление сейчас', 'Zapisz spis treści teraz'],
    lock: ['Tresorordner sperren', 'Lock shared vault folder', 'Заблокировать общую папку', 'Zablokuj wspólny folder'],
    connected: ['Offen · verbunden mit: ', 'Open · connected to: ', 'Открыто · подключено к: ', 'Otwarty · połączono z: '],
    entries: [' · Einträge im Inhaltsverzeichnis: ', ' · entries in the table of contents: ', ' · записей в оглавлении: ', ' · wpisów w spisie: '],
    locked: ['Gesperrt. Zum Öffnen unten „Tresorordner entsperren“ tippen (Passwort des Tresorordners). Ordner: ', 'Locked. Tap “Unlock shared vault folder” below to open it (the folder’s password). Folder: ', 'Заблокировано. Нажмите ниже «Разблокировать общую папку» (пароль папки). Папка: ', 'Zablokowany. Stuknij poniżej „Odblokuj wspólny folder” (hasło folderu). Folder: '],
    away: ['Tresorordner nicht erreichbar (SD-Karte eingelegt?): ', 'Shared vault folder unavailable (SD card inserted?): ', 'Общая папка недоступна (вставлена SD-карта?): ', 'Wspólny folder niedostępny (karta SD włożona?): '],
    written: ['Inhaltsverzeichnis geschrieben und geprüft.', 'Table of contents written and verified.', 'Оглавление записано и проверено.', 'Spis treści zapisany i sprawdzony.'],
    same: ['Inhaltsverzeichnis ist aktuell.', 'Table of contents is up to date.', 'Оглавление актуально.', 'Spis treści jest aktualny.'],
    done: ['Eingezogen. Die anderen Pro-Apps sehen jetzt das Inhaltsverzeichnis.', 'Moved in. The other Pro apps now see the table of contents.', 'Перенесено. Другие Pro-приложения теперь видят оглавление.', 'Przeniesiono. Inne aplikacje Pro widzą teraz spis treści.'],
    askTitle: ['An BookLedgerPro', 'To BookLedgerPro', 'В BookLedgerPro', 'Do BookLedgerPro'],
    askText: ['Die Mail kann direkt in den Tresorordner (Fach „Eingang-BookLedgerPro“) gelegt werden. BookLedgerPro findet sie dort im Eingang. Oder wie bisher über Androids Teilen-Liste.', 'The email can go straight into the shared vault folder (compartment “Eingang-BookLedgerPro”), where BookLedgerPro finds it. Or share it via Android as before.', 'Письмо можно положить прямо в общую папку (раздел «Eingang-BookLedgerPro»), где его найдёт BookLedgerPro. Или передать через Android, как раньше.', 'Wiadomość można włożyć prosto do wspólnego folderu (przegródka „Eingang-BookLedgerPro”), gdzie znajdzie ją BookLedgerPro. Albo udostępnić przez Android jak dotąd.'],
    askLocked: ['Der Tresorordner ist gesperrt. Entsperren und die Mail ins Fach „Eingang-BookLedgerPro“ legen – oder normal über Androids Teilen-Liste?', 'The shared vault folder is locked. Unlock it and put the email into “Eingang-BookLedgerPro” – or share it normally via Android?', 'Общая папка заблокирована. Разблокировать и положить письмо в «Eingang-BookLedgerPro» – или поделиться обычным способом через Android?', 'Wspólny folder jest zablokowany. Odblokować i włożyć wiadomość do „Eingang-BookLedgerPro” – czy udostępnić zwyczajnie przez Android?'],
    unlockVault: ['Entsperren und hineinlegen', 'Unlock and put it in', 'Разблокировать и положить', 'Odblokuj i włóż'],
    shareNormal: ['Normal teilen …', 'Share normally …', 'Поделиться обычно …', 'Udostępnij zwyczajnie …'],
    toVault: ['In den Tresorordner legen', 'Put into the shared vault folder', 'Положить в общую папку', 'Włóż do wspólnego folderu'],
    share: ['Teilen …', 'Share …', 'Поделиться …', 'Udostępnij …'],
    cancel: ['Abbrechen', 'Cancel', 'Отмена', 'Anuluj'],
    stored: ['Im Tresorordner abgelegt: Eingang-BookLedgerPro/Mails', 'Stored in the shared vault folder: Eingang-BookLedgerPro/Mails', 'Сохранено в общей папке: Eingang-BookLedgerPro/Mails', 'Zapisano we wspólnym folderze: Eingang-BookLedgerPro/Mails'],
    TRESOR_ORDNER_OHNE_TRESOR: ['In diesem Ordner liegt kein „Private Brain“. Bitte den Ordner darüber wählen, in dem „Private Brain“ liegt. Nichts wurde verändert.', 'This folder does not contain “Private Brain”. Choose the folder above it. Nothing was changed.', 'В этой папке нет «Private Brain». Выберите папку уровнем выше. Ничего не изменено.', 'W tym folderze nie ma „Private Brain”. Wybierz folder wyżej. Nic nie zmieniono.'],
    TRESOR_ORDNER_IST_FACH: ['Das ist der Ordner „Private Brain“ selbst. Bitte die Ebene darüber wählen. Nichts wurde verändert.', 'This is the “Private Brain” folder itself. Choose the level above. Nothing was changed.', 'Это сама папка «Private Brain». Выберите уровень выше. Ничего не изменено.', 'To sam folder „Private Brain”. Wybierz poziom wyżej. Nic nie zmieniono.'],
    TRESOR_ORDNER_FREMDER_TRESOR: ['Dort liegt ein anderer Private-Brain-Tresor als der geöffnete. Nichts wurde verändert.', 'That folder holds a different Private Brain vault than the open one. Nothing was changed.', 'Там другое хранилище Private Brain, не открытое сейчас. Ничего не изменено.', 'Tam jest inny sejf Private Brain niż otwarty. Nic nie zmieniono.'],
    TRESOR_FACH_BELEGT: ['Im Tresorordner ist schon ein anderer Private-Brain-Tresor eingezogen. Nichts wurde verändert.', 'Another Private Brain vault has already moved into this folder. Nothing was changed.', 'В эту папку уже перенесено другое хранилище Private Brain. Ничего не изменено.', 'Do tego folderu przeniesiono już inny sejf Private Brain. Nic nie zmieniono.'],
    VAULT_LOCKED: ['Erst den Speicherort entsperren.', 'Unlock the storage location first.', 'Сначала разблокируйте хранилище.', 'Najpierw odblokuj miejsce zapisu.'],
    failed: ['Nicht geklappt. Nichts wurde verändert. Code: ', 'Did not work. Nothing was changed. Code: ', 'Не получилось. Ничего не изменено. Код: ', 'Nie udało się. Nic nie zmieniono. Kod: ']
  };
  const lang = () => Math.max(0, ['de', 'en', 'ru', 'pl'].indexOf(document.documentElement.lang));
  const t = key => words[key][lang()];
  const native = () => ({ language: document.documentElement.lang, dark: document.documentElement.dataset.theme === 'dunkel' });
  const message = error => { const code = String(error?.code || error?.message || ''); return words[code] ? t(code) : t('failed') + code; };
  const make = (tag, text, cls) => { const e = document.createElement(tag); if (text != null) e.textContent = text; if (cls) e.className = cls; return e; };
  const AUSZUG = 1000, ID = /^[A-Za-z0-9._-]{1,80}$/;
  let busy = false, last = 0, note = '';

  const kurz = s => { s = String(s || '').replace(/\s+/g, ' ').trim(); if (s.length <= AUSZUG) return s; return s.slice(0, /[\uD800-\uDBFF]/.test(s[AUSZUG - 1]) ? AUSZUG - 1 : AUSZUG); };
  /* Zeilen aus dem Katalog: nur Kurzfassung (snippet/summary), nie der ganze Mailtext (mailBody). */
  function zeilen(catalog) {
    const out = [];
    for (const r of Array.isArray(catalog) ? catalog : []) {
      if (!r || typeof r.hash !== 'string' || !ID.test(r.hash)) continue;
      let name = String(r.name || '').trim() || 'Eintrag';
      if (r.ext && !name.toLowerCase().endsWith('.' + String(r.ext).toLowerCase())) name += '.' + r.ext;
      const datum = typeof r.date === 'number' ? r.date : Date.parse(r.date || '') || 0;
      out.push({ id: r.hash, name: name.slice(0, 255), art: String(r.type || 'application/octet-stream').slice(0, 200), datum: Math.max(0, Math.round(datum) || 0),
        groesse: Math.max(0, Math.round(Number(r.size) || 0)), auszug: kurz(r.snippet || r.summary || ''),
        verweis: String(r.path || 'katalog/' + r.hash).slice(0, 1000), sha256: /^[a-f0-9]{64}$/.test(r.hash) ? r.hash : '' });
    }
    return out;
  }
  const katalog = () => (typeof CATALOG !== 'undefined' ? CATALOG : window.CATALOG) || [];
  /* Inhaltsverzeichnis schreiben, wenn der Tresorordner offen und dieser Tresor eingezogen ist. */
  async function aktualisieren(sofort = false) {
    if (busy) return null;
    if (!sofort && Date.now() - last < 120000) return null;
    busy = true;
    try {
      const z = await api.tresorZustand({});
      if (!(z.offen && z.eingezogen && z.pruefung === 'PASST')) return null;
      const r = await api.tresorVerzeichnis({ zeilen: zeilen(katalog()) });
      last = Date.now(); note = ''; return r;
    } catch (error) { note = message(error); if (sofort) throw error; return null; }
    finally { busy = false; }
  }

  // ---------- Abschnitt im Kasten „Speicherort und Verschlüsselung“ ----------
  const section = make('section', null, 'native-tresorordner'); section.id = 'tresorordner'; section.hidden = true;
  const h = make('h4'), line = make('p', null, 'hint'), info = make('p', null, 'native-vault-status'), box = make('div', null, 'btnrow');
  const ort = make('div', null, 'pro-ablage-zeile'); ort.id = 'tresorordnerOrt';
  line.id = 'tresorordnerZeile'; info.id = 'tresorordnerHinweis'; info.setAttribute('role', 'status'); box.style.justifyContent = 'flex-start';
  section.append(h, ort, line, info, box);
  function einsetzen() {
    const card = document.getElementById('vaultPlace');
    if (!card || section.isConnected) return Boolean(card);
    const details = card.querySelector('.native-vault-limits');
    card.insertBefore(section, details || null);
    return true;
  }
  function knopf(key, work, primary) {
    const b = make('button', t(key), primary ? 'primary' : 'ghost'); b.type = 'button'; b.dataset.tresor = key;
    b.onclick = () => void (async () => { if (section.dataset.busy) return; section.dataset.busy = '1'; try { await work(); } finally { delete section.dataset.busy; } })();
    box.append(b);
  }
  async function zeigen(keep) {
    if (!einsetzen()) return;
    let vault;
    try { vault = await api.state(); } catch { vault = {}; }
    if (!vault.configured || !vault.unlocked) { section.hidden = true; return; }
    let z;
    try { z = await api.tresorZustand({}); } catch (error) { section.hidden = false; line.textContent = message(error); return; }
    section.hidden = false; h.textContent = t('title'); box.replaceChildren(); info.textContent = keep ?? note;
    const zustand = z.eingezogen && z.offen && z.pruefung === 'PASST' ? 'verbunden' : z.gewaehlt && z.erreichbar === false ? 'fern'
      : z.gewaehlt && z.vorhanden && z.pruefung === 'PASST' && !z.offen ? 'gesperrt' : 'neu';
    section.dataset.zustand = zustand;
    const P = window.ProBedienung;
    const ortSig = [Boolean(P && z.gewaehlt), zustand, z.pfad, z.ordner, document.documentElement.lang, typeof api.ordnerOeffnen].join('|');
    if (ort.dataset.sig !== ortSig) { ort.dataset.sig = ortSig; ort.replaceChildren(); }
    if (P && z.gewaehlt && !ort.firstChild) {
      const pfad = z.pfad || z.ordner || '';
      const oeffnen = typeof api.ordnerOeffnen === 'function' ? async () => {
        let text = '';
        try { await api.ordnerOeffnen({ welcher: 'tresor' }); } catch (error) { text = error?.code === 'KEIN_DATEIEN_PROGRAMM' ? t('noFilesApp') + pfad : message(error); }
        if (text) info.textContent = text;
      } : null;
      const zeile = P.ordnerZeile(pfad, oeffnen); zeile.prepend(P.zustand(zustand === 'verbunden'));
      ort.append(zeile);
    }
    const einziehen = neu => async () => {
      let text = '';
      try {
        const r = await api.tresorEinziehen({ ...native(), ...(neu ? { neuWaehlen: true } : {}) });
        if (r?.abgebrochen) return;
        if (r?.eingezogenJetzt) { await aktualisieren(true); text = t('done'); note = ''; }
      } catch (error) { text = message(error); }
      await zeigen(text);
    };
    if (zustand === 'verbunden') {
      line.textContent = t('connected') + (z.ordner || '') + t('entries') + (z.eintraege ?? 0);
      knopf('write', async () => { let text = ''; try { const r = await aktualisieren(true); text = r ? t(r.geschrieben ? 'written' : 'same') : ''; } catch (error) { text = message(error); } await zeigen(text); });
      knopf('lock', async () => { let text = ''; try { await api.tresorSperren({}); } catch (error) { text = message(error); } await zeigen(text); });
      knopf('other', einziehen(true));
    } else if (zustand === 'gesperrt') {
      line.textContent = t('locked') + (z.ordner || '');
      knopf('unlock', einziehen(false), true); knopf('other', einziehen(true));
    } else if (zustand === 'fern') {
      line.textContent = t('away') + (z.ordner || '');
      knopf('other', einziehen(true));
    } else {
      line.textContent = t('intro');
      knopf('move', einziehen(false), true);
    }
  }
  // Der Kasten zeichnet seine Zeile bei jeder Änderung neu; dann auch diesen Abschnitt (gebündelt).
  let timer = 0;
  const später = () => { clearTimeout(timer); timer = setTimeout(() => void zeigen(), 150); };
  function beobachten() {
    const status = document.getElementById('vaultStatus');
    if (!status) return false;
    new MutationObserver(später).observe(status, { childList: true, characterData: true, subtree: true });
    new MutationObserver(später).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
    später();
    return true;
  }
  if (!beobachten()) document.addEventListener('DOMContentLoaded', beobachten, { once: true });

  // ---------- „An BookLedgerPro teilen“ mit verbundenem Tresorordner ----------
  function frage(gesperrt) {
    return new Promise(resolve => {
      const dialog = make('dialog', null, 'live-dialog native-tresorordner-frage'); dialog.id = 'tresorordnerFrage';
      dialog.dataset.gesperrt = gesperrt ? '1' : '';
      dialog.append(make('h2', t('askTitle')), make('p', t(gesperrt ? 'askLocked' : 'askText')));
      let wahl = null;
      const add = (key, value, primary) => { const b = make('button', t(key), primary ? 'primary' : 'ghost'); b.type = 'button'; b.dataset.wahl = value; b.onclick = () => { wahl = value; dialog.close(); }; dialog.append(b); };
      if (gesperrt) { add('unlockVault', 'entsperren', true); add('shareNormal', 'teilen', false); }
      else { add('toVault', 'tresor', true); add('share', 'teilen', false); }
      add('cancel', null, false);
      document.body.append(dialog);
      dialog.addEventListener('close', () => { dialog.remove(); resolve(wahl); }, { once: true });
      dialog.showModal();
    });
  }
  async function mailAnBookLedger(args, meta = {}) {
    const device = window.PBMailDevice;
    let z = null;
    try { z = await api.tresorZustand({}); } catch { /* ohne Ordner: teilen wie bisher */ }
    const verbunden = z?.offen && z.eingezogen && z.pruefung === 'PASST';
    // Tablet-Probe 2026-10-28: bei gesperrtem Ordner nahm das Teilen still den Android-Weg. Jetzt wird gefragt (Leitfaden § 5).
    const gesperrt = !verbunden && z?.gewaehlt && z.vorhanden && z.pruefung === 'PASST' && !z.offen;
    if (!verbunden && !gesperrt) return device.openOriginal(args);
    const wahl = await frage(gesperrt);
    if (wahl === 'teilen') return device.openOriginal(args);
    if (wahl !== 'tresor' && wahl !== 'entsperren') return { abgebrochen: true };
    try {
      if (wahl === 'entsperren') {
        const r = await api.tresorEinziehen({ ...native() });
        if (r?.abgebrochen || !r?.offen) return { abgebrochen: true };
        void zeigen();
      }
      const r = await device.tresorMailAblegen({ ...args, name: String(meta.name || 'mail.eml').slice(0, 255), datum: Math.max(0, Number(meta.datum) || 0), auszug: kurz(meta.auszug) });
      alert(t('stored'));
      return r;
    } catch (error) { alert(message(error)); return { fehler: true }; }
  }
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') void aktualisieren(); });
  setTimeout(() => void aktualisieren(), 60000);
  window.PBTresorordner = Object.freeze({ zeigen, aktualisieren, zeilen, mailAnBookLedger });
})();
