/* Availability is independent of a saved check result. This adapter reads only
   known in-memory state: rendering a row never fetches a mail or restores a file. */
(() => {
  'use strict';
  const languages = ['de', 'en', 'ru', 'pl'];
  const words = {
    local: ['Lokale Kopie', 'Local copy', 'Локальная копия', 'Kopia lokalna'],
    localDetail: ['Eine Kopie ist im App-Speicher registriert. Beim Öffnen werden ihre Bytes und ihr Fingerabdruck geprüft.', 'A copy is registered in app storage. Its bytes and fingerprint are verified when opened.', 'Копия зарегистрирована в хранилище приложения. Байты и отпечаток проверяются при открытии.', 'Kopia jest zarejestrowana w pamięci aplikacji. Bajty i odcisk są sprawdzane przy otwarciu.'],
    session: ['In dieser Sitzung verfügbar', 'Available in this session', 'Доступно в этом сеансе', 'Dostępne w tej sesji'],
    sessionDetail: ['Die Originaldatei ist im Arbeitsspeicher verfügbar. Das bestätigt keine dauerhafte Ablage.', 'The original file is available in memory. This does not confirm permanent storage.', 'Оригинальный файл доступен в памяти. Это не подтверждает постоянное хранение.', 'Oryginalny plik jest dostępny w pamięci. Nie potwierdza to trwałego zapisu.'],
    source: ['Quelle verknüpft', 'Source linked', 'Источник связан', 'Źródło powiązane'],
    sourceDetail: ['Ein Quellordner ist verknüpft. Zugriff und Datei werden erst beim Öffnen geprüft.', 'A source folder is linked. Access and the file are checked only when opened.', 'Папка-источник связана. Доступ и файл проверяются при открытии.', 'Folder źródłowy jest powiązany. Dostęp i plik są sprawdzane przy otwarciu.'],
    provider: ['Mailquelle verknüpft', 'Email source linked', 'Почтовый источник связан', 'Źródło poczty powiązane'],
    providerDetail: ['Ein Verweis auf das Anbieter-Postfach ist gespeichert. Original und Anhänge sind damit nicht als lokale Dateien bestätigt; der Zugriff erfolgt erst auf ausdrücklichen Wunsch.', 'A reference to the provider mailbox is saved. This does not confirm local original or attachment files; access starts only when requested.', 'Сохранена ссылка на почту провайдера. Локальные оригинал и вложения не подтверждены; доступ начинается только по запросу.', 'Zapisano odwołanie do poczty dostawcy. Nie potwierdza to lokalnego oryginału ani załączników; dostęp następuje tylko na żądanie.'],
    text: ['Gespeicherter Mailtext', 'Stored email text', 'Сохранённый текст письма', 'Zapisany tekst wiadomości'],
    textDetail: ['Gespeichert sind Mailtext oder Mailangaben. Das bestätigt kein vollständiges Mailoriginal und keine gespeicherten Anhänge.', 'Email text or message details are stored. This does not confirm a complete original email or stored attachments.', 'Сохранены текст или сведения о письме. Полный оригинал и сохранённые вложения этим не подтверждаются.', 'Zapisano tekst lub dane wiadomości. Nie potwierdza to pełnego oryginału ani zapisanych załączników.'],
    missing: ['Original fehlt', 'Original missing', 'Нет оригинала', 'Brak oryginału'],
    missingDetail: ['Auf diesem Gerät ist keine Originalkopie bekannt. Katalog und frühere Prüfberichte bleiben erhalten.', 'No original copy is known on this device. The catalog and earlier check reports are preserved.', 'На устройстве нет известной копии оригинала. Каталог и прежние отчёты сохранены.', 'Na urządzeniu nie ma znanej kopii oryginału. Katalog i wcześniejsze raporty pozostają.'],
    unknown: ['Verfügbarkeit wird ermittelt', 'Checking availability', 'Проверяется доступность', 'Sprawdzanie dostępności'],
    unknownDetail: ['Die Liste lokaler Originale ist noch nicht geladen. Es wird keine fehlende Datei behauptet.', 'The list of local originals has not loaded yet. No file is being declared missing.', 'Список локальных оригиналов ещё не загружен. Отсутствие файла не утверждается.', 'Lista lokalnych oryginałów nie jest jeszcze załadowana. Brak pliku nie został stwierdzony.'],
    unavailable: ['Original derzeit nicht lesbar', 'Original currently unreadable', 'Оригинал сейчас недоступен', 'Oryginał obecnie niedostępny'],
    unavailableDetail: ['Die Verfügbarkeit konnte nicht bestätigt werden. Es wurden keine Daten gelöscht; ein früherer Prüfbericht bestätigt keinen aktuellen Dateizugriff.', 'Availability could not be confirmed. No data was deleted; an earlier check report does not confirm current file access.', 'Доступность не удалось подтвердить. Данные не удалены; прежний отчёт не подтверждает текущий доступ к файлу.', 'Nie potwierdzono dostępności. Nie usunięto danych; wcześniejszy raport nie potwierdza obecnego dostępu do pliku.']
  };
  const text = key => words[key][Math.max(0, languages.indexOf(String(document.documentElement.lang || 'de').slice(0, 2)))];
  // The native mailbox locator requires these fields. A partial/foreign catalog
  // object is not evidence that an explicit provider-opening path exists.
  const hasProvider = rec => [...(Array.isArray(rec.mailRemotes) ? rec.mailRemotes : []), rec.mailRemote].some(ref =>
    ref && typeof ref.account === 'string' && ref.account.length > 0 &&
    typeof ref.folder === 'string' && ref.folder.length > 0 &&
    typeof ref.validity === 'string' && /^[0-9]{1,10}$/.test(ref.validity) &&
    Number.isSafeInteger(ref.uid) && ref.uid >= 1 && ref.uid <= 4294967295);
  function availability(rec) {
    let key = 'unknown';
    if (rec) {
      const nativeStatus = window.PBOriginals?.statusFor?.(rec.hash);
      if (nativeStatus === 'local' || (!nativeStatus && window.PBOriginals?.stored?.has(rec.hash))) key = 'local';
      else if (typeof SESSION_FILES !== 'undefined' && SESSION_FILES.has(rec.hash)) key = 'session';
      else if (rec.mail) key = hasProvider(rec) ? 'provider' : 'text';
      else if (nativeStatus === 'unavailable') key = 'unavailable';
      else if (rec.localSource?.dirId || rec.dirId) key = 'source';
      else if (window.PBOriginals) key = nativeStatus || (window.PBOriginals.snapshot?.().error ? 'unavailable' : window.PBOriginals.snapshot?.().ready ? 'missing' : 'unknown');
      else key = 'missing';
    }
    return { key, label: text(key), detail: text(key + 'Detail') };
  }
  function render(rec) {
    const state = availability(rec), span = document.createElement('span');
    span.className = 'pb-record-availability'; span.dataset.original = state.key;
    span.textContent = state.label; span.title = state.detail;
    return span;
  }
  window.PBRecordStatus = Object.freeze({ availability, render });
})();
