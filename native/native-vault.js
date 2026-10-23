/* Storage location (tablet or SD card) with the user's own password.
   The password is typed only into Android's native dialog; this page never sees it.
   Mail attachments are streamed by Android into the folder and only referenced here. */
(() => {
  'use strict';
  const api = window.Capacitor?.Plugins?.ProVault;
  if (typeof api?.state !== 'function') return;
  const words = {
    title: ['🔐 Speicherort und Verschlüsselung', '🔐 Storage location and encryption', '🔐 Место хранения и шифрование', '🔐 Miejsce zapisu i szyfrowanie'],
    help: ['Lege fest, wo Private Brain Pro deine Daten ablegt: auf dem Tablet oder auf der SD-Karte. Mail-Anhänge (bis 1 GB je Datei), geöffnete Mails, Konten, Entwürfe, Originale und eine Sicherung des Katalogs liegen dort verschlüsselt mit deinem eigenen Passwort. Mit dem Ordner und dem Passwort holst du alles auf einem neuen Gerät zurück.', 'Choose where Private Brain Pro keeps your data: on the tablet or on the SD card. Email attachments (up to 1 GB each), opened emails, accounts, drafts, originals and a catalog backup are stored there, encrypted with your own password. With the folder and the password you can restore everything on a new device.', 'Выберите, где Private Brain Pro хранит данные: на планшете или на SD-карте. Вложения (до 1 ГБ каждое), открытые письма, аккаунты, черновики, оригиналы и резервная копия каталога хранятся там, зашифрованные вашим паролем. С папкой и паролем всё восстанавливается на новом устройстве.', 'Wybierz, gdzie Private Brain Pro przechowuje dane: na tablecie lub karcie SD. Załączniki (do 1 GB każdy), otwarte wiadomości, konta, szkice, oryginały i kopia katalogu są tam zaszyfrowane Twoim hasłem. Z folderem i hasłem przywrócisz wszystko na nowym urządzeniu.'],
    choose: ['Speicherort wählen', 'Choose storage location', 'Выбрать место', 'Wybierz miejsce'],
    change: ['Anderen Speicherort wählen', 'Choose another location', 'Выбрать другое место', 'Wybierz inne miejsce'],
    openExisting: ['Vorhandenen Ordner öffnen', 'Open existing folder', 'Открыть существующую папку', 'Otwórz istniejący folder'],
    unlock: ['🔓 Entsperren', '🔓 Unlock', '🔓 Разблокировать', '🔓 Odblokuj'],
    lock: ['🔒 Auf diesem Gerät sperren', '🔒 Lock on this device', '🔒 Заблокировать на устройстве', '🔒 Zablokuj na tym urządzeniu'],
    migrate: ['Vorhandene Daten übernehmen', 'Move existing data', 'Перенести имеющиеся данные', 'Przenieś istniejące dane'],
    backupNow: ['Jetzt sichern', 'Back up now', 'Сохранить сейчас', 'Zapisz teraz'],
    none: ['Noch kein Speicherort gewählt. Mail-Anhänge bleiben bis dahin beim alten Weg (höchstens 5 MB, nur zur Ansicht).', 'No storage location chosen yet. Until then email attachments use the old way (up to 5 MB, view only).', 'Место ещё не выбрано. До этого вложения работают по-старому (до 5 МБ, только просмотр).', 'Nie wybrano miejsca. Do tego czasu załączniki działają po staremu (do 5 MB, tylko podgląd).'],
    device: ['Tablet (interner Speicher)', 'Tablet (internal storage)', 'Планшет (внутренняя память)', 'Tablet (pamięć wewnętrzna)'],
    sdcard: ['SD-Karte', 'SD card', 'SD-карта', 'Karta SD'],
    removable: ['Wechselspeicher', 'Removable storage', 'Съёмный носитель', 'Nośnik wymienny'],
    other: ['anderer Ort', 'other location', 'другое место', 'inne miejsce'],
    unlocked: ['verschlüsselt · entsperrt', 'encrypted · unlocked', 'зашифровано · разблокировано', 'zaszyfrowane · odblokowane'],
    locked: ['verschlüsselt · gesperrt – zum Benutzen entsperren', 'encrypted · locked – unlock to use', 'зашифровано · заблокировано — разблокируйте', 'zaszyfrowane · zablokowane – odblokuj'],
    unreachable: ['Ordner nicht erreichbar. SD-Karte eingesteckt? Sonst den Ordner erneut öffnen.', 'Folder unavailable. Is the SD card inserted? Otherwise open the folder again.', 'Папка недоступна. Вставлена ли SD-карта? Иначе откройте папку снова.', 'Folder niedostępny. Czy karta SD jest włożona? W przeciwnym razie otwórz folder ponownie.'],
    remembered: ['Android hält den Ordner auf diesem Gerät entsperrt.', 'Android keeps the folder unlocked on this device.', 'Android держит папку разблокированной на этом устройстве.', 'Android trzyma folder odblokowany na tym urządzeniu.'],
    attachments: ['Mail-Anhänge', 'Email attachments', 'Вложения', 'Załączniki'],
    lastBackup: ['Katalog gesichert', 'Catalog backed up', 'Каталог сохранён', 'Katalog zapisany'],
    backingUp: ['Katalog wird gesichert …', 'Backing up catalog …', 'Сохранение каталога …', 'Zapisywanie katalogu …'],
    backupFailed: ['Katalogsicherung fehlgeschlagen. Ordner prüfen; der Katalog auf dem Gerät bleibt unverändert.', 'Catalog backup failed. Check the folder; the catalog on this device is unchanged.', 'Не удалось сохранить каталог. Проверьте папку; каталог на устройстве не изменён.', 'Nie udało się zapisać katalogu. Sprawdź folder; katalog na urządzeniu bez zmian.'],
    where: ['Wo sollen deine Daten liegen?', 'Where should your data be stored?', 'Где хранить данные?', 'Gdzie przechowywać dane?'],
    whereHelp: ['Android öffnet gleich die Ordnerauswahl. Lege dort einen neuen Ordner an (zum Beispiel „Private Brain“) und wähle ihn. Auf einer SD-Karte bleiben die Daten auch erhalten, wenn das Tablet kaputtgeht – vorausgesetzt, die Karte ist als mobiler Speicher eingerichtet, nicht als interner Speicher. Die Wahl lädt nichts ins Internet.', 'Android will open the folder picker. Create a new folder there (for example “Private Brain”) and select it. On an SD card your data survives a broken tablet – provided the card is set up as portable storage, not as internal storage. Choosing uploads nothing.', 'Android откроет выбор папки. Создайте новую папку (например «Private Brain») и выберите её. На SD-карте данные сохранятся даже при поломке планшета — если карта настроена как съёмный носитель, а не как внутренняя память. Ничего не загружается в интернет.', 'Android otworzy wybór folderu. Utwórz nowy folder (np. „Private Brain”) i wybierz go. Na karcie SD dane przetrwają awarię tabletu – o ile karta jest skonfigurowana jako pamięć przenośna, nie wewnętrzna. Nic nie jest wysyłane do internetu.'],
    otherFolder: ['Anderer Ordner …', 'Other folder …', 'Другая папка …', 'Inny folder …'],
    noCard: ['Keine SD-Karte als mobiler Speicher erkannt. Ist die Karte als interner Speicher eingerichtet, gehört sie fest zu diesem Tablet.', 'No SD card detected as portable storage. If the card is set up as internal storage, it belongs to this tablet only.', 'SD-карта как съёмный носитель не найдена. Если карта настроена как внутренняя память, она привязана к этому планшету.', 'Nie wykryto karty SD jako pamięci przenośnej. Jeśli karta jest pamięcią wewnętrzną, należy tylko do tego tabletu.'],
    cancel: ['Abbrechen', 'Cancel', 'Отмена', 'Anuluj'],
    askMigrate: ['Sollen die bisher in der App gespeicherten Originale, Konten und Entwürfe jetzt zusätzlich verschlüsselt in den Ordner kopiert werden? In der App bleibt alles erhalten.', 'Copy the originals, accounts and drafts stored in the app so far into the folder as well (encrypted)? Everything stays in the app too.', 'Скопировать сохранённые в приложении оригиналы, аккаунты и черновики в папку (зашифрованно)? В приложении всё останется.', 'Skopiować dotychczasowe oryginały, konta i szkice do folderu (zaszyfrowane)? W aplikacji wszystko zostaje.'],
    migrating: ['Daten werden in den Ordner übernommen …', 'Moving data into the folder …', 'Перенос данных в папку …', 'Przenoszenie danych do folderu …'],
    migrated: ['In den Ordner übernommen: Originale ', 'Copied into the folder: originals ', 'Перенесено в папку: оригиналы ', 'Przeniesiono do folderu: oryginały '],
    restored: ['Wiederhergestellt: Konten ', 'Restored: accounts ', 'Восстановлено: аккаунты ', 'Przywrócono: konta '],
    restoredRecords: [', Entwürfe/Versandstatus ', ', drafts/send status ', ', черновики/статусы ', ', szkice/stany '],
    restoredCatalog: [', Katalogeinträge ', ', catalog entries ', ', записи каталога ', ', wpisy katalogu '],
    restoreNote: ['Originale kommen beim Öffnen aus dem Ordner zurück. Google-Konten brauchen auf dem neuen Gerät eine neue Freigabe.', 'Originals return from the folder when opened. Google accounts need a new authorization on the new device.', 'Оригиналы возвращаются из папки при открытии. Для Google нужно новое разрешение.', 'Oryginały wracają z folderu przy otwarciu. Konta Google wymagają ponownej autoryzacji.'],
    inStore: ['📎 Anhänge aus dem Postfach im Speicherort', '📎 Mailbox attachments in the storage folder', '📎 Вложения из почты в хранилище', '📎 Załączniki ze skrzynki w magazynie'],
    folderName: ['📎 Mail-Anhänge', '📎 Email attachments', '📎 Вложения', '📎 Załączniki'],
    clear: ['🗑 Ganzen Ordner leeren', '🗑 Empty whole folder', '🗑 Очистить папку', '🗑 Opróżnij folder'],
    clearAsk: ['Alle {n} Mail-Anhänge ({size}) endgültig aus dem Ordner löschen? Die Mails bleiben; sie zeigen danach „Anhang gelöscht“. Beim Mailanbieter bleiben die Anhänge erhalten.', 'Permanently delete all {n} email attachments ({size}) from the folder? The emails stay and show “Attachment deleted”. Your provider keeps the attachments.', 'Удалить все {n} вложений ({size}) из папки навсегда? Письма останутся с пометкой «Вложение удалено». У провайдера вложения сохранятся.', 'Trwale usunąć wszystkie {n} załączników ({size}) z folderu? Wiadomości zostaną z dopiskiem „Załącznik usunięty”. U dostawcy załączniki pozostaną.'],
    cleared: ['Ordner geleert: {n} Anhänge gelöscht.', 'Folder emptied: {n} attachments deleted.', 'Папка очищена: удалено вложений {n}.', 'Folder opróżniony: usunięto {n} załączników.'],
    emptyFolder: ['Noch keine Mail-Anhänge im Ordner. Beim Öffnen einer Mail landen ihre Anhänge hier.', 'No email attachments in the folder yet. Opening an email stores its attachments here.', 'Вложений пока нет. При открытии письма вложения попадают сюда.', 'Brak załączników. Otwarcie wiadomości zapisuje tu jej załączniki.'],
    lockedFolder: ['Der Ordner ist gesperrt.', 'The folder is locked.', 'Папка заблокирована.', 'Folder jest zablokowany.'],
    view: ['Ansehen', 'View', 'Просмотр', 'Podgląd'],
    handOut: ['Öffnen mit …', 'Open with …', 'Открыть в …', 'Otwórz w …'],
    handOutAsk: ['Die Datei wird entschlüsselt an eine andere App übergeben und verlässt damit den geschützten Ordner. Fortfahren?', 'The file will be decrypted and handed to another app, leaving the protected folder. Continue?', 'Файл будет расшифрован и передан другому приложению, покинув защищённую папку. Продолжить?', 'Plik zostanie odszyfrowany i przekazany innej aplikacji, opuszczając chroniony folder. Kontynuować?'],
    tooBigView: ['Für die Ansicht in der App zu groß (über 64 MB). „Öffnen mit …“ gibt die Datei an eine andere App.', 'Too large to view in the app (over 64 MB). “Open with …” hands it to another app.', 'Слишком велик для просмотра (более 64 МБ). «Открыть в …» передаёт файл другому приложению.', 'Za duży do podglądu (ponad 64 MB). „Otwórz w …” przekazuje plik innej aplikacji.'],
    inFolder: ['im Anhang-Ordner', 'in attachment folder', 'в папке вложений', 'w folderze załączników'],
    deleted: ['Anhang gelöscht', 'Attachment deleted', 'Вложение удалено', 'Załącznik usunięty'],
    reload: ['Erneut vom Anbieter laden', 'Load again from provider', 'Загрузить снова у провайдера', 'Pobierz ponownie od dostawcy'],
    tooLarge: ['über 1 GB – nur beim Anbieter', 'over 1 GB – provider only', 'больше 1 ГБ — только у провайдера', 'ponad 1 GB – tylko u dostawcy'],
    failed: ['nicht vollständig übertragen – Mail später erneut öffnen', 'not completely transferred – open the email again later', 'передано не полностью — откройте письмо позже', 'nie przesłano w całości – otwórz wiadomość później'],
    unchecked: ['liegt verschlüsselt im Anhang-Ordner; nicht im Browser geprüft (Prüfen im Ordner folgt in einem späteren Schritt)', 'stored encrypted in the attachment folder; not checked in the browser (checking inside the folder follows later)', 'хранится зашифрованно в папке; в браузере не проверено (проверка в папке будет позже)', 'zapisany w folderze; nie sprawdzono w przeglądarce (sprawdzanie w folderze później)'],
    from: ['Von', 'From', 'От', 'Od'],
    mail: ['Mail', 'Email', 'Письмо', 'Wiadomość'],
    forwardSkipped: ['Anhänge aus dem Ordner über zusammen 5 MB werden nicht mitgesendet.', 'Folder attachments over 5 MB in total are not sent along.', 'Вложения из папки более 5 МБ суммарно не отправляются.', 'Załączniki z folderu powyżej 5 MB łącznie nie są wysyłane.'],
    limits: ['Wichtig zu wissen', 'Good to know', 'Важно знать', 'Warto wiedzieć'],
    limitList: [['Passwort vergessen = Daten im Ordner verloren. Niemand kann es zurücksetzen.', 'SD-Karten gehen auch kaputt: gelegentlich eine zweite Kopie des Ordners anlegen (z. B. auf einen Rechner oder eine zweite Karte).', 'Die SD-Karte muss als mobiler Speicher eingerichtet sein. Als interner Speicher eingerichtet gehört sie fest zum Tablet.', 'Beim Abruf liegt eine große Mail kurz im privaten App-Speicher, bevor ihre Anhänge verschlüsselt im Ordner landen.', 'Senden großer Anhänge ist noch nicht möglich; Anbieter erlauben meist 25–50 MB.', '„Öffnen mit …“ gibt eine entschlüsselte Kopie an eine andere App weiter.'], ['Forgotten password = data in the folder is lost. Nobody can reset it.', 'SD cards fail too: make a second copy of the folder now and then (e.g. on a computer or a second card).', 'The SD card must be set up as portable storage. Set up as internal storage it belongs to this tablet only.', 'While downloading, a large email briefly sits in private app storage before its attachments are stored encrypted in the folder.', 'Sending large attachments is not available yet; providers usually allow 25–50 MB.', '“Open with …” hands a decrypted copy to another app.'], ['Забытый пароль = данные в папке потеряны. Сбросить его нельзя.', 'SD-карты тоже ломаются: иногда делайте вторую копию папки.', 'SD-карта должна быть настроена как съёмный носитель.', 'При загрузке большое письмо ненадолго лежит в памяти приложения, затем вложения шифруются в папку.', 'Отправка больших вложений пока невозможна; провайдеры обычно допускают 25–50 МБ.', '«Открыть в …» передаёт расшифрованную копию другому приложению.'], ['Zapomniane hasło = dane w folderze utracone. Nikt go nie zresetuje.', 'Karty SD też się psują: czasem zrób drugą kopię folderu.', 'Karta SD musi być skonfigurowana jako pamięć przenośna.', 'Podczas pobierania duża wiadomość krótko leży w pamięci aplikacji, potem załączniki są szyfrowane w folderze.', 'Wysyłanie dużych załączników nie jest jeszcze możliwe; dostawcy zwykle pozwalają na 25–50 MB.', '„Otwórz w …” przekazuje odszyfrowaną kopię innej aplikacji.']],
    intake: ['Speicherort', 'Storage', 'Хранилище', 'Miejsce'],
    settings: ['Einstellungen', 'Settings', 'Настройки', 'Ustawienia']
  };
  const errors = {
    VAULT_LOCKED: ['Der Speicherort ist gesperrt. Bitte entsperren.', 'The storage location is locked. Please unlock.', 'Хранилище заблокировано. Разблокируйте.', 'Miejsce zapisu jest zablokowane. Odblokuj.'],
    VAULT_FOLDER_UNAVAILABLE: ['Der Ordner ist nicht erreichbar. SD-Karte eingesteckt? Sonst den Ordner erneut öffnen.', 'The folder is unavailable. Is the SD card inserted? Otherwise open the folder again.', 'Папка недоступна. Вставлена ли SD-карта?', 'Folder niedostępny. Czy karta SD jest włożona?'],
    VAULT_DAMAGED: ['Eine Datei im Ordner ist beschädigt oder wurde verändert. Sie wurde nicht verwendet.', 'A file in the folder is damaged or was changed. It was not used.', 'Файл в папке повреждён или изменён. Он не использован.', 'Plik w folderze jest uszkodzony lub zmieniony. Nie użyto go.'],
    STORAGE_FULL: ['Nicht genug freier Speicher für diese Mail. Platz schaffen oder einen anderen Speicherort wählen.', 'Not enough free storage for this email. Free up space or choose another location.', 'Недостаточно места для письма.', 'Za mało miejsca na tę wiadomość.'],
    ATTACHMENT_DELETED: ['Der Anhang wurde aus dem Ordner gelöscht.', 'The attachment was deleted from the folder.', 'Вложение удалено из папки.', 'Załącznik usunięto z folderu.'],
    VAULT_BUSY: ['Der Ordner ist gerade beschäftigt. Bitte gleich noch einmal.', 'The folder is busy. Please try again shortly.', 'Папка занята. Повторите позже.', 'Folder jest zajęty. Spróbuj ponownie.'],
    VAULT_UNAVAILABLE: ['Der Speicherort ist nicht verfügbar. Es wurden keine Daten zurückgesetzt.', 'The storage location is unavailable. No data was reset.', 'Хранилище недоступно. Данные не сброшены.', 'Miejsce zapisu niedostępne. Dane nie zostały zresetowane.']
  };
  if(window.Capacitor?.getPlatform?.()==='windows'){
    Object.assign(words,{"help": ["Wähle einen Ordner auf diesem Rechner oder einem angeschlossenen Laufwerk. Mail-Anhänge, geöffnete Mails, Konten, Entwürfe, Originale und Katalogsicherungen werden dort mit deinem Passwort verschlüsselt. Mit Ordner und Passwort kannst du sie auf einem anderen Gerät wiederherstellen.", "Choose a folder on this computer or an attached drive. Email attachments, opened emails, accounts, drafts, originals and catalog backups are encrypted there with your password. Use the folder and password to restore them on another device.", "Выберите папку на компьютере или подключённом диске. Вложения, открытые письма, аккаунты, черновики, оригиналы и копии каталога шифруются вашим паролем. Папка и пароль позволяют восстановить их на другом устройстве.", "Wybierz folder na komputerze lub podłączonym dysku. Załączniki, otwarte wiadomości, konta, szkice, oryginały i kopie katalogu są szyfrowane Twoim hasłem. Folder i hasło pozwalają przywrócić je na innym urządzeniu."], "device": ["Rechner / gewähltes Laufwerk", "Computer / selected drive", "Компьютер / выбранный диск", "Komputer / wybrany dysk"], "remembered": ["Windows hält den Ordner für dieses Benutzerkonto entsperrt.", "Windows keeps the folder unlocked for this user account.", "Windows оставляет папку открытой для этого пользователя.", "Windows zachowuje odblokowanie dla tego użytkownika."], "whereHelp": ["Wähle im Windows-Dialog einen eigenen Ordner. Für eine Sicherung außerhalb dieses Rechners eignet sich ein angeschlossenes Laufwerk. Die Auswahl lädt nichts ins Internet.", "Choose your own folder in the Windows dialog. An attached drive can keep a backup outside this computer. Choosing uploads nothing.", "Выберите папку в диалоге Windows. Подключённый диск может хранить копию вне компьютера. Ничего не загружается в интернет.", "Wybierz folder w oknie Windows. Podłączony dysk może przechować kopię poza komputerem. Nic nie jest wysyłane do internetu."], "unreachable": ["Ordner nicht erreichbar. Prüfe das Laufwerk und öffne denselben Ordner erneut.", "Folder unavailable. Check the drive and reopen the same folder.", "Папка недоступна. Проверьте диск и откройте ту же папку снова.", "Folder niedostępny. Sprawdź dysk i ponownie otwórz ten sam folder."]});
    words.limitList=words.limitList.map((items,language)=>items.filter((_,i)=>i!==2).map((value,i)=>i===1?words.whereHelp[language]:value));
  }
  const lang = () => Math.max(0, ['de', 'en', 'ru', 'pl'].indexOf(document.documentElement.lang));
  const t = key => (words[key] || errors[key] || [key])[lang()];
  const make = (tag, text, cls) => { const e = document.createElement(tag); if (text != null) e.textContent = text; if (cls) e.className = cls; return e; };
  const size = n => fmtKB(Number(n) || 0);
  const b64 = bytes => { let value = ''; for (let n = 0; n < bytes.length; n += 8192) value += String.fromCharCode(...bytes.subarray(n, n + 8192)); return btoa(value); };
  const unb64 = value => Uint8Array.from(atob(value), c => c.charCodeAt(0));
  const errorText = error => t(Object.hasOwn(errors, error?.code) ? error.code : Object.hasOwn(errors, error?.message) ? error.message : 'VAULT_UNAVAILABLE');
  let state = { configured: false }, problem = '', note = '', busy = false, lastBackup = 0, backupTimer = 0, backingUp = false, backupAgain = false;

  // ---------- settings card ----------
  const card = make('div', null, 'note native-vault'); card.id = 'vaultPlace';
  const heading = make('h3'), help = make('p', null, 'hint'), status = make('p', null, 'native-vault-status');
  status.setAttribute('role', 'status'); status.id = 'vaultStatus';
  const row = make('div', null, 'btnrow'); row.style.justifyContent = 'flex-start';
  const buttons = {};
  for (const key of ['choose', 'openExisting', 'unlock', 'lock', 'migrate', 'backupNow']) {
    const b = make('button', null, key === 'choose' ? 'primary' : 'ghost'); b.type = 'button'; b.id = 'vault-' + key; buttons[key] = b; row.append(b);
  }
  const details = make('details', null, 'native-vault-limits'), summary = make('summary'), list = make('ul');
  details.append(summary, list);
  card.append(heading, help, status, row, details);
  const settings = document.getElementById('panel-settings');
  settings?.prepend(card);
  // A single line on "Dateien hinzufügen" shows where new copies go.
  const line = make('p', null, 'native-vault-line'); line.id = 'vaultLine';
  const lineText = make('span'), lineButton = make('button', null, 'ghost'); lineButton.type = 'button';
  line.append(lineText, lineButton);
  document.getElementById('libraryStatus')?.after(line);
  lineButton.onclick = () => window.PBWorkspace?.navigate('settings');

  function place() {
    if (!state.configured) return '';
    return t(state.location === 'sdcard' ? 'sdcard' : state.location === 'device' ? 'device' : state.location === 'removable' ? 'removable' : 'other') + (state.folder ? ' · „' + state.folder + '“' : '');
  }
  function render() {
    heading.textContent = t('title'); help.textContent = t('help'); summary.textContent = t('limits');
    list.replaceChildren(...words.limitList[lang()].map(s => make('li', s)));
    for (const [key, b] of Object.entries(buttons)) b.textContent = t(key === 'choose' && state.configured ? 'change' : key);
    buttons.unlock.hidden = !state.configured || state.unlocked;
    buttons.lock.hidden = buttons.migrate.hidden = buttons.backupNow.hidden = !state.configured || !state.unlocked;
    for (const b of Object.values(buttons)) b.disabled = busy;
    let text = state.configured ? place() + ' · ' + t(state.unlocked ? 'unlocked' : 'locked') : t('none');
    if (state.configured && state.unlocked) {
      if (state.reachable === false) text += ' · ' + t('unreachable');
      else text += ' · ' + t('attachments') + ': ' + (state.attachments || 0) + ' (' + size(state.attachmentBytes) + ')';
      if (state.remembered) text += ' · ' + t('remembered');
      if (backingUp) text += ' · ' + t('backingUp');
      else if (lastBackup) text += ' · ' + t('lastBackup') + ' ' + new Date(lastBackup).toLocaleTimeString(document.documentElement.lang);
    }
    status.textContent = [text, note, problem].filter(Boolean).join(' · ');
    lineText.textContent = '🔐 ' + t('intake') + ': ' + (state.configured ? place() + ' · ' + t(state.unlocked ? 'unlocked' : 'locked') : t('none')) + ' ';
    lineButton.textContent = t('settings');
    window.PBWorkspace?.refresh?.();
  }
  async function refresh() {
    try { state = await api.state(); if (state.problem) problem = errorText({ code: state.problem }); }
    catch (error) { problem = errorText(error); }
    render();
  }
  async function act(fn) {
    if (busy) return; busy = true; problem = ''; note = ''; render();
    try { await fn(); } catch (error) { problem = errorText(error); }
    finally { busy = false; await refresh(); }
  }
  const native = () => ({ language: document.documentElement.lang, dark: document.documentElement.dataset.theme === 'dunkel' });

  // ---------- choosing tablet or SD card ----------
  async function chooseVolume() {
    if (window.Capacitor?.getPlatform?.() === 'windows') return { volume: '' };
    let volumes = [];
    try { volumes = (await api.volumes()).items || []; } catch { /* Generic picker remains. */ }
    return new Promise(resolve => {
      const dialog = make('dialog', null, 'live-dialog native-vault-where');
      const title = make('h2', t('where')), info = make('p', t('whereHelp'));
      dialog.append(title, info);
      let chosen = null;
      const add = (label, volume, primary) => { const b = make('button', label, primary ? 'primary' : 'ghost'); b.type = 'button'; b.onclick = () => { chosen = { volume }; dialog.close(); }; dialog.append(b); };
      const cards = volumes.filter(v => v.removable);
      for (const v of volumes.filter(v => v.primary)) add('📱 ' + t('device'), v.id, !cards.length);
      for (const v of cards) add('💾 ' + t('sdcard') + (v.label ? ' – ' + v.label : ''), v.id, true);
      if (!cards.length) dialog.append(make('p', t('noCard'), 'hint'));
      add('📁 ' + t('otherFolder'), '', false);
      const cancel = make('button', t('cancel'), 'ghost'); cancel.type = 'button'; cancel.onclick = () => dialog.close(); dialog.append(cancel);
      document.body.append(dialog);
      dialog.addEventListener('close', () => { dialog.remove(); resolve(chosen); }, { once: true });
      dialog.showModal();
    });
  }
  async function afterChoice(result) {
    if (!result || result.cancelled) return;
    state = result.state || state;
    if (result.created) {
      if (confirm(t('askMigrate'))) {
        note = t('migrating'); render();
        const moved = await api.migrate();
        note = t('migrated') + moved.originals;
      }
      await backup(true);
    } else if (result.opened) {
      const restored = result.restored || {};
      const entries = await restoreCatalog();
      note = t('restored') + (restored.accounts || 0) + t('restoredRecords') + (restored.records || 0) + t('restoredCatalog') + entries + '. ' + t('restoreNote');
      window.PBMailAccounts?.reload?.();
    }
  }
  buttons.choose.onclick = () => act(async () => { const where = await chooseVolume(); if (where) await afterChoice(await api.choose({ ...native(), volume: where.volume })); });
  buttons.openExisting.onclick = () => act(async () => afterChoice(await api.choose({ ...native(), volume: '' })));
  buttons.unlock.onclick = () => act(unlock);
  buttons.lock.onclick = () => act(async () => { await flush(); await api.lock(); });
  buttons.migrate.onclick = () => act(async () => { note = t('migrating'); render(); const moved = await api.migrate(); note = t('migrated') + moved.originals; });
  buttons.backupNow.onclick = () => act(async () => { await api.backupMail(); await backup(true); });
  async function unlock() {
    const result = await api.unlock(native());
    if (result?.state) state = result.state;
    return Boolean(result?.unlocked);
  }

  // ---------- catalog backup (debounced, encrypted by Android) ----------
  function snapshot() {
    const catalog = CATALOG.map(record => { const { evec, ...rest } = record; return rest; });
    let saved = null; try { saved = localStorage.getItem('cb_saved'); } catch { /* optional */ }
    return JSON.stringify({ app: 'private-brain-pro', v: 1, created: Date.now(), catalog, saved });
  }
  async function backup(now = false) {
    if (!state.configured || !state.unlocked || typeof CATALOG === 'undefined') return;
    if (backingUp) { backupAgain = true; return; }
    backingUp = true; if (now) render();
    let ticket = '';
    try {
      const bytes = new TextEncoder().encode(snapshot());
      ticket = (await api.catalogBegin()).ticket;
      for (let offset = 0; offset < bytes.length; offset += 262144)
        await api.catalogAppend({ ticket, offset, data: b64(bytes.subarray(offset, offset + 262144)) });
      await api.catalogFinish({ ticket }); ticket = '';
      lastBackup = Date.now();
      if (problem === t('backupFailed')) problem = '';
    } catch (error) {
      if (ticket) await api.catalogAbort({ ticket }).catch(() => {});
      problem = t('backupFailed');
    } finally {
      backingUp = false; render();
      if (backupAgain) { backupAgain = false; schedule(); }
    }
  }
  function schedule() { if (!state.configured || !state.unlocked) return; clearTimeout(backupTimer); backupTimer = setTimeout(() => backup(), 5000); }
  async function flush() { if (backupTimer) { clearTimeout(backupTimer); backupTimer = 0; await backup(); } }
  // Every catalog change (import, tags, deletion, mail) schedules one bundled backup.
  for (const name of ['idbPut', 'idbDelete', 'idbClear']) {
    const original = window[name];
    if (typeof original !== 'function') continue;
    window[name] = function (store, ...rest) { const result = original.call(this, store, ...rest); if (store === 'catalog') Promise.resolve(result).then(schedule, () => {}); return result; };
  }
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') void flush(); });
  async function restoreCatalog() {
    const info = await api.catalogInfo();
    if (!info.exists) return 0;
    const parts = [];
    for (let offset = 0; offset < info.size; offset += 262144) parts.push(unb64((await api.catalogRead({ version: info.version, offset })).data));
    const data = JSON.parse(new TextDecoder().decode(await new Blob(parts).arrayBuffer()));
    if (data?.app !== 'private-brain-pro' || !Array.isArray(data.catalog)) throw new Error('VAULT_DAMAGED');
    let added = 0;
    // Merge only: entries already on this device are never replaced.
    for (const record of data.catalog) {
      if (!record || typeof record.hash !== 'string' || HASHSET.has(record.hash)) continue;
      record.tags = record.tags || []; record.dupes = record.dupes || [];
      if (!record.tf) record.tf = termFreq(tokens((record.name || '') + ' ' + (record.snippet || '')));
      if (!record.vector) record.vector = buildVector(tokens((record.name || '') + ' ' + (record.snippet || '')));
      await idbPut('catalog', record); CATALOG.push(record); HASHSET.add(record.hash); added++;
    }
    try { if (data.saved && !localStorage.getItem('cb_saved')) localStorage.setItem('cb_saved', data.saved); } catch { /* optional */ }
    rebuildIndex(); populateFilterSelects(); refreshAll();
    return added;
  }

  // ---------- attachments: explorer folder ----------
  const FOLDER = ':mail-attachments';
  let items = [], itemsLoaded = false;
  async function loadItems() {
    if (!state.configured || !state.unlocked) { items = []; return; }
    try { items = (await api.attachments()).items || []; } catch (error) { problem = errorText(error); items = []; }
    finally { itemsLoaded = true; }
  }
  async function bytesOf(entry) {
    const parts = [];
    for (let offset = 0; offset < entry.size; offset += 262144) parts.push(unb64((await api.readAttachment({ id: entry.ref || entry.id, offset })).data));
    return parts;
  }
  async function view(entry) {
    if (entry.size > 64 * 1024 * 1024) { alert(t('tooBigView')); return; }
    const parts = await bytesOf(entry);
    const file = new File(parts, entry.name, { type: entry.type || 'application/octet-stream' });
    if (file.size !== entry.size) throw new Error('VAULT_DAMAGED');
    // The viewer's own "Open with …" must warn as well: mark the origin.
    Object.defineProperty(file, 'pbVaultId', { value: entry.ref || entry.id });
    window.showBlob(file, { name: entry.name });
  }
  async function handOut(id, share = false) {
    if (!confirm(t('handOutAsk'))) return;
    await api.openAttachment({ id, share });
  }
  function rowFor(entry) {
    const row = make('article', null, 'explorer-row native-vault-row');
    const info = make('div'), name = make('strong', '📎 ' + entry.name), meta = make('div', null, 'explorer-meta');
    const date = Number(entry.date) ? new Date(Number(entry.date)).toLocaleDateString(document.documentElement.lang) : '';
    meta.textContent = [size(entry.size), entry.subject ? t('mail') + ': ' + entry.subject : '', entry.from ? t('from') + ': ' + entry.from : '', date].filter(Boolean).join(' · ');
    info.append(name, meta);
    const viewButton = make('button', t('view'), 'ghost'), out = make('button', t('handOut'), 'ghost');
    viewButton.type = out.type = 'button';
    viewButton.onclick = () => view(entry).catch(error => alert(errorText(error)));
    out.onclick = () => handOut(entry.id).catch(error => alert(errorText(error)));
    row.append(info, viewButton, out);
    if (window.PBCheck) info.append(PBCheck.vaultBadge(entry));
    if (window.PBSchutz && entry.sha256) info.append(PBSchutz.attachmentStatus(entry, { handOut: () => handOut(entry.id, true).catch(error => alert(errorText(error))) }));
    return row;
  }
  // The explorer (assets/workspace.js) puts these attachments under the mail they came with, in one tree with the
  // attachments of imported email files (Klaus 2026-10-22: "Mail-Anhänge und Anhänge aus E-Mails sind zweimal dasselbe").
  window.PBExplorerExtra = {
    items() {
      if (!state.configured || !state.unlocked) return [];
      if (!itemsLoaded) { itemsLoaded = true; void loadItems().then(() => window.PBWorkspace.refresh()); }
      return items;
    },
    row: rowFor,
    head(target) {
      if (!state.configured || !state.unlocked || !items.length) return;
      const total = items.reduce((s, e) => s + (e.size || 0), 0);
      const head = make('div', null, 'native-vault-head');
      const sumLine = make('span', t('inStore') + ': ' + items.length + ' · ' + size(total));
      const clear = make('button', t('clear'), 'ghost native-vault-clear'); clear.type = 'button'; clear.disabled = busy;
      clear.onclick = () => act(async () => {
        if (!confirm(t('clearAsk').replace('{n}', items.length).replace('{size}', size(total)))) return;
        const result = await api.clearAttachments();
        note = t('cleared').replace('{n}', result.removed);
        await loadItems(); window.PBWorkspace.refresh();
      });
      head.append(sumLine, clear);
      if (window.PBCheck) {
        const open = PBCheck.vaultOpen(items), all = make('button', open ? PBCheck.words('all') + PBCheck.words('allOpen').replace('{n}', open) : PBCheck.words('allNone'), 'ghost pb-check-all-button');
        all.type = 'button'; all.disabled = !open || busy;
        all.onclick = () => PBCheck.checkVaultAll(items, all, () => window.PBWorkspace.refresh());
        head.append(all);
      }
      target.append(head);
      if (note || problem) target.append(make('p', [note, problem].filter(Boolean).join(' · '), 'hint'));
    },
    lockedRow(target) {
      if (!state.configured || state.unlocked) return;
      const p = make('p', t('lockedFolder') + ' ', 'explorer-empty native-vault-locked'), b = make('button', t('unlock'), 'ghost'); b.type = 'button';
      b.onclick = () => act(async () => { if (await unlock()) { await loadItems(); window.PBWorkspace.refresh(); } });
      p.append(b); target.append(p);
    }
  };

  // ---------- attachments inside an opened mail ----------
  window.PBVault = {
    active: () => Boolean(state.configured),
    text: t,
    handOut,
    attachmentRow(a, reload) {
      const box = make('p', null, 'native-vault-attachment');
      const label = make('span', '📎 ' + a.name + ' · ');
      box.append(label);
      if (a.stored && a.ref) {
        label.textContent += size(a.size) + ' · ' + t('inFolder') + ' ';
        const v = make('button', t('view'), 'mail-button'), o = make('button', t('handOut'), 'mail-button');
        v.type = o.type = 'button';
        v.onclick = () => view(a).catch(error => alert(errorText(error)));
        o.onclick = () => handOut(a.ref).catch(error => alert(errorText(error)));
        box.append(v, o);
        if (window.PBSchutz) box.append(PBSchutz.attachmentStatus(a, { handOut: () => handOut(a.ref, true).catch(error => alert(errorText(error))) }));
      } else if (a.deleted) {
        label.textContent += t('deleted') + ' ';
        const r = make('button', t('reload'), 'mail-button'); r.type = 'button'; r.onclick = () => reload?.(); box.append(r);
      } else if (a.tooLarge) label.textContent += t('tooLarge');
      else if (a.failed) label.textContent += t('failed');
      itemsLoaded = false;
      return box;
    },
    uncheckedText: () => t('unchecked'),
    // A catalog entry whose original is missing may be the same file as an attachment kept here (same fingerprint).
    async findByHash(hash) { if (!state.configured || !state.unlocked) return null; if (!itemsLoaded) await loadItems(); return items.find(e => e.sha256 === hash && e.size <= 256 * 1024 * 1024) || null; },
    // 🛡 The check reads the bytes from the folder (decrypted by Android) only for the check itself.
    async bytes(entry) { const parts = await bytesOf(entry); const all = new Uint8Array(parts.reduce((n, p) => n + p.length, 0)); let at = 0; for (const p of parts) { all.set(p, at); at += p.length; } return all; },
    /** Folder attachments are read back for forwarding only within the device sending limit. */
    async forwardable(list, limit) {
      const out = []; let total = 0, skipped = false;
      for (const a of list || []) {
        if (!a.ref) { if (a.data) out.push(a); continue; }
        if (!a.stored || total + a.size > limit) { skipped = true; continue; }
        const parts = [];
        for (let offset = 0; offset < a.size; offset += 262144) parts.push((await api.readAttachment({ id: a.ref, offset })).data);
        const bytes = new Uint8Array(await new Blob(parts.map(unb64)).arrayBuffer());
        total += bytes.length; out.push({ name: a.name, type: a.type, data: b64(bytes) });
      }
      if (skipped) alert(t('forwardSkipped'));
      return out;
    },
    unlock,
    refresh,
    backup: () => backup(true)
  };
  new MutationObserver(render).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  render();
  void refresh().then(() => { if (state.configured && state.unlocked) void loadItems().then(() => window.PBWorkspace?.refresh?.()); });
})();
