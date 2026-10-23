/* Protection against malware, spam and scams: one checking point, several providers.
   Every provider names itself, its version and the date of its data. Results are
   "Befund", "Hinweis", "unauffällig laut <Name>", "unbekannt" or "nicht geprüft" –
   never "virenfrei". Lists live encrypted in the chosen storage folder (Android);
   the rules for spam and scams run on the device without internet. */
(() => {
  'use strict';
  const api = window.Capacitor?.Plugins?.ProProtect;
  const links = window.Capacitor?.Plugins?.ProLinks;
  if(window.Capacitor?.getPlatform?.()==='windows'){
    W.helper=['Microsoft Defender unter Windows','Microsoft Defender on Windows','Microsoft Defender в Windows','Microsoft Defender w Windows'];
    W.noFolder=['Erst einen Speicherort wählen (oben). Die Listen werden verschlüsselt nur im gewählten Ordner abgelegt.','Choose a storage location first (above). Lists are stored encrypted only in the selected folder.','Сначала выберите место хранения (выше). Списки хранятся зашифрованно только в выбранной папке.','Najpierw wybierz miejsce zapisu (wyżej). Listy są szyfrowane i zapisywane tylko w wybranym folderze.'];
    W.helperInfo=['Eine entschlüsselte Kopie wird nach Bestätigung an Defender übergeben. Es gelten die Windows-Einstellungen, einschließlich möglicher Cloud-Prüfung.','After confirmation, a decrypted copy is passed to Defender. Windows settings apply, including possible cloud checking.','После подтверждения расшифрованная копия передаётся Defender. Действуют настройки Windows, включая возможную проверку в облаке.','Po potwierdzeniu odszyfrowana kopia trafia do Defendera. Obowiązują ustawienia Windows, w tym możliwa kontrola w chmurze.'];
  }
  const lang = () => Math.max(0, ['de', 'en', 'ru', 'pl'].indexOf(document.documentElement.lang));
  const W = {
    title: ['🛡 Schutz vor Viren, Spam und Betrug', '🛡 Protection against malware, spam and scams', '🛡 Защита от вирусов, спама и мошенничества', '🛡 Ochrona przed wirusami, spamem i oszustwami'],
    help: ['Mails, Anhänge und Links werden auf dem Gerät mit Regeln und Listen geprüft. Das ist kein vollständiger Virenscanner: Ein Treffer ist ein Warnzeichen, kein Treffer ist keine Garantie. Die Listen liegen verschlüsselt in deinem Speicherort-Ordner (Unterordner „Schutzlisten“) und werden automatisch aktualisiert, solange das Internet der App eingeschaltet ist.',
      'Emails, attachments and links are checked on the device with rules and lists. This is not a complete virus scanner: a hit is a warning sign, no hit is no guarantee. The lists are stored encrypted in your storage folder (subfolder “Schutzlisten”) and update automatically while the app’s internet is switched on.',
      'Письма, вложения и ссылки проверяются на устройстве по правилам и спискам. Это не полноценный антивирус: совпадение — предупреждение, отсутствие совпадения — не гарантия. Списки хранятся зашифрованно в вашей папке (подпапка «Schutzlisten») и обновляются автоматически, пока интернет приложения включён.',
      'Wiadomości, załączniki i linki są sprawdzane na urządzeniu regułami i listami. To nie jest pełny antywirus: trafienie to sygnał ostrzegawczy, brak trafienia nie jest gwarancją. Listy są zaszyfrowane w Twoim folderze (podfolder „Schutzlisten”) i aktualizują się automatycznie, gdy internet aplikacji jest włączony.'],
    rules: ['Regeln für Spam und Betrug', 'Rules for spam and scams', 'Правила против спама и мошенничества', 'Reguły przeciw spamowi i oszustwom'],
    rulesInfo: ['auf dem Gerät, ohne Internet, immer aktiv', 'on the device, no internet, always on', 'на устройстве, без интернета, всегда включено', 'na urządzeniu, bez internetu, zawsze aktywne'],
    malware: ['Liste bekannter Schaddateien (MalwareBazaar, abuse.ch)', 'List of known malware files (MalwareBazaar, abuse.ch)', 'Список известных вредоносных файлов (MalwareBazaar, abuse.ch)', 'Lista znanych szkodliwych plików (MalwareBazaar, abuse.ch)'],
    linksList: ['Liste gefährlicher Links (URLhaus, abuse.ch)', 'List of dangerous links (URLhaus, abuse.ch)', 'Список опасных ссылок (URLhaus, abuse.ch)', 'Lista niebezpiecznych linków (URLhaus, abuse.ch)'],
    vt: ['VirusTotal (Fingerabdruck, auf Tipp)', 'VirusTotal (fingerprint, on tap)', 'VirusTotal (отпечаток, по нажатию)', 'VirusTotal (odcisk, po dotknięciu)'],
    helper: ['Virenscanner-App auf dem Tablet', 'Virus scanner app on the tablet', 'Антивирус на планшете', 'Aplikacja antywirusowa na tablecie'],
    helperInfo: ['„Mit Virenscanner-App prüfen“ gibt einen Anhang an eine installierte App weiter. Die Datei verlässt dabei den geschützten Ordner.', '“Check with virus scanner app” hands an attachment to an installed app. The file leaves the protected folder.', '«Проверить антивирусом» передаёт вложение установленному приложению. Файл покидает защищённую папку.', '„Sprawdź aplikacją antywirusową” przekazuje załącznik zainstalowanej aplikacji. Plik opuszcza chroniony folder.'],
    entries: ['Einträge', 'entries', 'записей', 'wpisów'],
    servers: ['Server', 'servers', 'серверов', 'serwerów'],
    stand: ['Stand', 'as of', 'по состоянию на', 'stan na'],
    never: ['noch nicht geladen', 'not loaded yet', 'ещё не загружено', 'jeszcze nie pobrano'],
    keySet: ['Schlüssel gespeichert', 'key stored', 'ключ сохранён', 'klucz zapisany'],
    keyMissing: ['kein Schlüssel', 'no key', 'нет ключа', 'brak klucza'],
    auto: ['Listen automatisch aktualisieren (große Gesamtliste nur im WLAN)', 'Update lists automatically (large complete list on Wi-Fi only)', 'Обновлять списки автоматически (полный список только по Wi-Fi)', 'Aktualizuj listy automatycznie (pełna lista tylko przez Wi-Fi)'],
    updateNow: ['Jetzt aktualisieren', 'Update now', 'Обновить сейчас', 'Aktualizuj teraz'],
    updating: ['Listen werden geladen …', 'Loading lists …', 'Загрузка списков …', 'Pobieranie list …'],
    keyAbuse: ['🔑 abuse.ch-Schlüssel', '🔑 abuse.ch key', '🔑 ключ abuse.ch', '🔑 klucz abuse.ch'],
    keyVt: ['🔑 VirusTotal-Schlüssel', '🔑 VirusTotal key', '🔑 ключ VirusTotal', '🔑 klucz VirusTotal'],
    getAbuse: ['Schlüssel bei abuse.ch holen', 'Get key at abuse.ch', 'Получить ключ на abuse.ch', 'Pobierz klucz z abuse.ch'],
    getVt: ['Schlüssel bei VirusTotal holen', 'Get key at VirusTotal', 'Получить ключ на VirusTotal', 'Pobierz klucz z VirusTotal'],
    checkAll: ['Alles prüfen', 'Check everything', 'Проверить всё', 'Sprawdź wszystko'],
    checkAllDone: ['Geprüft: {n} Dateien gegen die Liste bekannter Schaddateien. Treffer: {hits}.', 'Checked: {n} files against the list of known malware. Hits: {hits}.', 'Проверено файлов: {n}. Совпадений: {hits}.', 'Sprawdzono plików: {n}. Trafienia: {hits}.'],
    noFolder: ['Erst einen Speicherort wählen (oben). Die Listen werden nur dort abgelegt, nicht im Tablet-Speicher.', 'Choose a storage location first (above). Lists are stored only there, not in tablet storage.', 'Сначала выберите место хранения (выше). Списки хранятся только там.', 'Najpierw wybierz miejsce zapisu (wyżej). Listy są zapisywane tylko tam.'],
    locked: ['Speicherort gesperrt – zum Prüfen mit Listen entsperren.', 'Storage location locked – unlock to check with lists.', 'Хранилище заблокировано — разблокируйте для проверки.', 'Miejsce zapisu zablokowane – odblokuj, aby sprawdzać listami.'],
    offline: ['Internet der App ist aus: keine Aktualisierung.', 'App internet is off: no updates.', 'Интернет приложения выключен: обновления нет.', 'Internet aplikacji wyłączony: brak aktualizacji.'],
    where: ['Abgelegt in', 'Stored in', 'Хранится в', 'Zapisane w'],
    limits: ['Wichtig zu wissen', 'Good to know', 'Важно знать', 'Warto wiedzieć'],
    limitList: [[
      'Kein vollständiger Virenscanner. Geprüft wird gegen Listen bekannter Schaddateien und Links und mit festen Regeln; neue Schadsoftware erkennt das nicht.',
      'abuse.ch verlangt seit 2025 einen persönlichen, kostenlosen Schlüssel. Für den Einsatz in einer verkauften App kann ein bezahltes Abo (Spamhaus) nötig sein.',
      'VirusTotal bekommt nur den Fingerabdruck (SHA-256), nie die Datei. Die kostenlose Schnittstelle ist nicht für gewerbliche Produkte gedacht und erlaubt wenige Abfragen pro Minute.',
      'Die Regeln für Spam und Betrug geben Hinweise, keine Urteile. Echte Mails können auffallen, betrügerische unauffällig sein.',
      'Die große Gesamtliste (einige MB) lädt automatisch nur im WLAN; neue Einträge kommen alle 12 Stunden dazu.'
    ], [
      'Not a complete virus scanner. Checks use lists of known malware files and links and fixed rules; new malware is not detected.',
      'Since 2025 abuse.ch requires a personal, free key. Use in an app that is sold may require a paid subscription (Spamhaus).',
      'VirusTotal receives only the fingerprint (SHA-256), never the file. The free interface is not meant for commercial products and allows few requests per minute.',
      'The spam and scam rules give hints, not verdicts. Genuine emails can be flagged, fraudulent ones can pass.',
      'The large complete list (a few MB) loads automatically only on Wi-Fi; new entries are added every 12 hours.'
    ], [
      'Не полноценный антивирус. Проверка по спискам известных вредоносных файлов и ссылок и по правилам; новое вредоносное ПО не распознаётся.',
      'С 2025 года abuse.ch требует личный бесплатный ключ. Для продаваемого приложения может понадобиться платная подписка (Spamhaus).',
      'VirusTotal получает только отпечаток (SHA-256), никогда сам файл. Бесплатный интерфейс не предназначен для коммерческих продуктов.',
      'Правила дают подсказки, а не приговоры.',
      'Полный список загружается автоматически только по Wi-Fi; новые записи добавляются каждые 12 часов.'
    ], [
      'To nie jest pełny antywirus. Sprawdzanie listami znanych szkodliwych plików i linków oraz stałymi regułami; nowe szkodliwe oprogramowanie nie jest wykrywane.',
      'Od 2025 r. abuse.ch wymaga osobistego, bezpłatnego klucza. W sprzedawanej aplikacji może być potrzebna płatna subskrypcja (Spamhaus).',
      'VirusTotal otrzymuje tylko odcisk (SHA-256), nigdy plik. Bezpłatny interfejs nie jest przeznaczony do produktów komercyjnych.',
      'Reguły dają wskazówki, nie wyroki.',
      'Pełna lista pobiera się automatycznie tylko przez Wi-Fi; nowe wpisy co 12 godzin.'
    ]],
    // mail panel
    panel: ['🛡 Schutz', '🛡 Protection', '🛡 Защита', '🛡 Ochrona'],
    nothing: ['nichts aufgefallen', 'nothing noticed', 'ничего не замечено', 'nic nie zauważono'],
    hints: ['Hinweise', 'hints', 'подсказки', 'wskazówki'],
    findings: ['Befund', 'finding', 'находка', 'trafienie'],
    checking: ['wird geprüft …', 'checking …', 'проверка …', 'sprawdzanie …'],
    unremarkable: ['unauffällig laut', 'unremarkable according to', 'без замечаний по', 'bez uwag według'],
    notChecked: ['nicht geprüft', 'not checked', 'не проверено', 'nie sprawdzono'],
    unknown: ['unbekannt', 'unknown', 'неизвестно', 'nieznany'],
    listed: ['steht in der Liste bekannter Schaddateien (MalwareBazaar). Nicht öffnen.', 'is on the list of known malware (MalwareBazaar). Do not open.', 'в списке известных вредоносных файлов (MalwareBazaar). Не открывать.', 'jest na liście znanych szkodliwych plików (MalwareBazaar). Nie otwieraj.'],
    linkListed: ['Link steht in der URLhaus-Liste gefährlicher Adressen:', 'Link is on the URLhaus list of dangerous addresses:', 'Ссылка в списке опасных адресов URLhaus:', 'Link jest na liście niebezpiecznych adresów URLhaus:'],
    serverListed: ['Link führt auf einen Server, auf dem zuletzt Schadsoftware lag:', 'Link leads to a server that recently hosted malware:', 'Ссылка ведёт на сервер, где недавно было вредоносное ПО:', 'Link prowadzi do serwera, na którym ostatnio było złośliwe oprogramowanie:'],
    vtAsk: ['VirusTotal fragen', 'Ask VirusTotal', 'Спросить VirusTotal', 'Zapytaj VirusTotal'],
    vtAskInfo: ['Nur der Fingerabdruck (SHA-256) der Datei geht an VirusTotal, nicht die Datei. Fortfahren?', 'Only the file’s fingerprint (SHA-256) is sent to VirusTotal, not the file. Continue?', 'В VirusTotal отправляется только отпечаток (SHA-256), не файл. Продолжить?', 'Do VirusTotal trafia tylko odcisk (SHA-256), nie plik. Kontynuować?'],
    vtResult: ['VirusTotal: {m} von {t} Scannern melden etwas', 'VirusTotal: {m} of {t} scanners report something', 'VirusTotal: {m} из {t} сканеров что-то нашли', 'VirusTotal: {m} z {t} skanerów coś zgłasza'],
    vtUnknown: ['VirusTotal kennt diese Datei nicht (das heißt nicht, dass sie harmlos ist).', 'VirusTotal does not know this file (that does not mean it is harmless).', 'VirusTotal не знает этот файл (это не значит, что он безопасен).', 'VirusTotal nie zna tego pliku (to nie znaczy, że jest bezpieczny).'],
    vtNotAnalysed: ['VirusTotal kennt die Datei, hat aber kein Prüfergebnis.', 'VirusTotal knows the file but has no scan result.', 'VirusTotal знает файл, но без результата проверки.', 'VirusTotal zna plik, ale nie ma wyniku.'],
    helperButton: ['Mit Virenscanner-App prüfen', 'Check with virus scanner app', 'Проверить антивирусом', 'Sprawdź aplikacją antywirusową'],
    // rule findings
    'auth-fail': ['Der Mailanbieter konnte den Absender nicht bestätigen (SPF/DKIM/DMARC fehlgeschlagen).', 'The mail provider could not confirm the sender (SPF/DKIM/DMARC failed).', 'Почтовый сервис не подтвердил отправителя (SPF/DKIM/DMARC).', 'Dostawca poczty nie potwierdził nadawcy (SPF/DKIM/DMARC).'],
    'provider-spam': ['Der Mailanbieter stuft die Mail selbst als Spam ein.', 'The mail provider itself classifies this email as spam.', 'Почтовый сервис сам считает письмо спамом.', 'Dostawca poczty sam uznaje wiadomość za spam.'],
    'reply-other': ['Antworten gehen an eine andere Adresse als die des Absenders:', 'Replies go to a different address than the sender’s:', 'Ответы уходят на другой адрес, чем у отправителя:', 'Odpowiedzi trafiają na inny adres niż nadawcy:'],
    'brand-mismatch': ['Der Name nennt eine bekannte Firma, die Adresse gehört nicht dazu:', 'The name mentions a well-known company, the address does not belong to it:', 'Имя называет известную компанию, а адрес ей не принадлежит:', 'Nazwa wskazuje znaną firmę, ale adres do niej nie należy:'],
    'name-address': ['Im Absendernamen steht eine andere Adresse als die echte:', 'The sender name shows a different address than the real one:', 'В имени отправителя другой адрес, чем настоящий:', 'Nazwa nadawcy pokazuje inny adres niż prawdziwy:'],
    lookalike: ['Die Absenderadresse ähnelt einer bekannten Adresse, ist es aber nicht:', 'The sender address resembles a known address but is not it:', 'Адрес похож на известный, но им не является:', 'Adres przypomina znany, ale nim nie jest:'],
    punycode: ['Die Absenderadresse enthält ungewöhnliche Schriftzeichen (kann eine bekannte Adresse nachahmen):', 'The sender address contains unusual characters (may imitate a known address):', 'Адрес содержит необычные символы (может подражать известному):', 'Adres zawiera nietypowe znaki (może naśladować znany):'],
    'link-mismatch': ['Ein Link zeigt eine Adresse an, führt aber woandershin:', 'A link shows one address but leads elsewhere:', 'Ссылка показывает один адрес, а ведёт на другой:', 'Link pokazuje jeden adres, a prowadzi gdzie indziej:'],
    'link-ip': ['Ein Link führt auf eine reine Zahlenadresse statt auf einen Namen:', 'A link leads to a bare number address instead of a name:', 'Ссылка ведёт на числовой адрес вместо имени:', 'Link prowadzi na adres liczbowy zamiast nazwy:'],
    'link-short': ['Ein Link ist verkürzt, das Ziel ist nicht sichtbar:', 'A link is shortened, its target is hidden:', 'Ссылка сокращена, цель не видна:', 'Link jest skrócony, cel jest ukryty:'],
    'link-at': ['Ein Link versteckt sein Ziel hinter einem „@“:', 'A link hides its target behind an “@”:', 'Ссылка прячет цель за «@»:', 'Link ukrywa cel za „@”:'],
    pressure: ['Die Mail setzt unter Druck und verlangt Daten oder Geld:', 'The email applies pressure and asks for data or money:', 'Письмо давит и требует данные или деньги:', 'Wiadomość wywiera presję i żąda danych lub pieniędzy:'],
    'attachment-danger': ['Anhang mit einem Dateityp, der Programme ausführen kann:', 'Attachment with a file type that can run programs:', 'Вложение с типом файла, который может запускать программы:', 'Załącznik z typem pliku, który może uruchamiać programy:'],
    'attachment-double': ['Anhang mit doppelter Dateiendung (tarnt ein Programm als Dokument):', 'Attachment with a double extension (disguises a program as a document):', 'Вложение с двойным расширением (маскирует программу):', 'Załącznik z podwójnym rozszerzeniem (maskuje program):'],
    urgency: ['Zeitdruck', 'urgency', 'срочность', 'presja czasu'],
    threat: ['Kontosperre/Bestätigung', 'account threat/verification', 'блокировка/подтверждение', 'blokada/weryfikacja'],
    secrets: ['Passwort/PIN/Karte', 'password/PIN/card', 'пароль/PIN/карта', 'hasło/PIN/karta'],
    money: ['Gewinn/Geld', 'prize/money', 'выигрыш/деньги', 'wygrana/pieniądze'],
    errors: { KEY_REQUIRED: ['Schlüssel fehlt', 'key missing', 'нет ключа', 'brak klucza'], KEY_REJECTED: ['Schlüssel abgelehnt', 'key rejected', 'ключ отклонён', 'klucz odrzucony'],
      KEY_INVALID: ['Schlüssel ungültig', 'key invalid', 'ключ недействителен', 'klucz nieprawidłowy'],
      LIST_NOT_FOUND: ['Liste beim Anbieter nicht gefunden', 'list not found at provider', 'список не найден', 'lista nie znaleziona'],
      RATE_LIMITED: ['zu viele Abfragen, später erneut', 'too many requests, try later', 'слишком много запросов', 'za dużo zapytań'],
      DOWNLOAD_FAILED: ['Abruf fehlgeschlagen, später erneut', 'download failed, try later', 'загрузка не удалась', 'pobieranie nie powiodło się'],
      LIST_TOO_LARGE: ['Liste zu groß', 'list too large', 'список слишком большой', 'lista za duża'],
      APP_OFFLINE: ['Internet der App ist aus', 'app internet is off', 'интернет приложения выключен', 'internet aplikacji wyłączony'],
      VAULT_LOCKED: ['Speicherort gesperrt', 'storage locked', 'хранилище заблокировано', 'miejsce zablokowane'],
      VAULT_FOLDER_UNAVAILABLE: ['Ordner nicht erreichbar', 'folder unavailable', 'папка недоступна', 'folder niedostępny'],
      VAULT_DAMAGED: ['Liste beschädigt, vorherige Fassung verwendet', 'list damaged, previous version used', 'список повреждён', 'lista uszkodzona'],
      VAULT_BUSY: ['läuft bereits', 'already running', 'уже выполняется', 'już trwa'],
      UNAVAILABLE: ['nicht verfügbar', 'unavailable', 'недоступно', 'niedostępne'] }
  };
  const t = key => (W[key] || [key])[lang()];
  const err = code => (W.errors[code] || W.errors.UNAVAILABLE)[lang()];
  const codeOf = error => String(error?.code || error?.message || 'UNAVAILABLE').match(/[A-Z][A-Z_]{3,}/)?.[0] || 'UNAVAILABLE';
  const make = (tag, text, cls) => { const e = document.createElement(tag); if (text != null) e.textContent = text; if (cls) e.className = cls; return e; };
  const date = ms => ms ? new Date(Number(ms)).toLocaleString(document.documentElement.lang, { dateStyle: 'short', timeStyle: 'short' }) : '';
  const hex = buffer => [...new Uint8Array(buffer)].map(b => b.toString(16).padStart(2, '0')).join('');

  // ---------- rules for spam and scams (no network) ----------
  const BRANDS = { paypal: ['paypal.com', 'paypal.de'], amazon: ['amazon.de', 'amazon.com'], sparkasse: ['sparkasse.de'],
    commerzbank: ['commerzbank.de'], 'deutsche bank': ['db.com', 'deutsche-bank.de'], postbank: ['postbank.de'], comdirect: ['comdirect.de'], n26: ['n26.com'],
    dhl: ['dhl.de', 'dhl.com'], dpd: ['dpd.de', 'dpd.com'], hermes: ['myhermes.de', 'hermesworld.com'], telekom: ['telekom.de', 't-online.de'],
    vodafone: ['vodafone.de'], netflix: ['netflix.com'], apple: ['apple.com', 'icloud.com'], microsoft: ['microsoft.com', 'outlook.com', 'live.com'],
    google: ['google.com', 'gmail.com', 'googlemail.com'], ebay: ['ebay.de', 'ebay.com'], elster: ['elster.de'], finanzamt: ['elster.de'] };
  const SHORTENERS = ['bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'ow.ly', 'is.gd', 'cutt.ly', 'rebrand.ly', 'shorturl.at', 'tiny.cc', 'buff.ly', 'rb.gy', 's.id'];
  const DANGEROUS = ['exe', 'scr', 'com', 'pif', 'bat', 'cmd', 'js', 'jse', 'vbs', 'vbe', 'wsf', 'wsh', 'hta', 'msi', 'ps1', 'lnk', 'iso', 'img', 'vhd', 'vhdx', 'jar', 'apk', 'docm', 'xlsm', 'pptm', 'dotm', 'xlam', 'reg', 'cpl'];
  const DOCS = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png', 'txt', 'rtf', 'odt', 'zip'];
  const PHRASES = {
    urgency: /\b(sofort|umgehend|dringend|unverzüglich|innerhalb von (24|48) stunden|letzte (mahnung|warnung|aufforderung)|heute noch|urgent|immediately|within (24|48) hours|final (notice|warning)|act now|срочно|немедленно|w ciągu (24|48) godzin|pilne|natychmiast)\b/i,
    threat: /(konto (wurde |wird )?(gesperrt|eingeschränkt|deaktiviert)|bestätigen sie ihre|verifizieren sie|daten (aktualisieren|bestätigen)|ungewöhnliche aktivität|sicherheitsüberprüfung|account (has been |will be )?(suspended|locked|limited|disabled)|verify your (account|identity)|confirm your (account|details|identity)|unusual activity|аккаунт (заблокирован|будет заблокирован)|подтвердите|konto (zostało |zostanie )?zablokowane|zweryfikuj)/i,
    secrets: /\b(passwort|kennwort|pin|tan|kreditkarte|kartennummer|sicherheitscode|cvv|password|credit card|card number|security code|пароль|кредитн|hasło|karta kredytowa)\b/i,
    money: /(gewinn|gewonnen|erbschaft|bitcoin|krypto|gutschein|geschenkkarte|lotterie|western union|überweisen sie|you have won|lottery|inheritance|gift card|crypto|wire transfer|выигрыш|наследство|wygrał|spadek|karta podarunkowa)/i
  };
  function headers(raw) {
    const block = String(raw || '').split(/\r?\n\r?\n/)[0] || '';
    const out = [];
    for (const line of block.split(/\r?\n/)) {
      if (/^[ \t]/.test(line) && out.length) out[out.length - 1][1] += ' ' + line.trim();
      else { const i = line.indexOf(':'); if (i > 0) out.push([line.slice(0, i).trim().toLowerCase(), line.slice(i + 1).trim()]); }
    }
    return out;
  }
  const addressOf = value => (String(value || '').match(/<([^<>@\s]+@[^<>\s]+)>/) || String(value || '').match(/([^\s<>"',;]+@[^\s<>"',;]+)/) || [])[1]?.toLowerCase() || '';
  const nameOf = value => String(value || '').replace(/<[^>]*>/, '').replace(/["']/g, '').trim();
  const domainOf = address => address.split('@')[1]?.replace(/\.$/, '') || '';
  // Registrable domain, approximately: the last two labels, three for "co.uk"-style suffixes.
  const base = domain => { const p = domain.split('.'); return p.length > 2 && /^(co|com|org|net|gov|ac|or|ne)$/.test(p[p.length - 2]) && p[p.length - 1].length === 2 ? p.slice(-3).join('.') : p.slice(-2).join('.'); };
  function distance(a, b) {
    if (Math.abs(a.length - b.length) > 2) return 3;
    const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
    for (let j = 1; j <= b.length; j++) d[0][j] = j;
    for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return d[a.length][b.length];
  }
  function hostOf(url) { try { const u = new URL(url); return /^https?:$/.test(u.protocol) ? u.hostname.toLowerCase().replace(/\.$/, '') : ''; } catch { return ''; } }
  /** Links with their visible text: from the HTML (parsed inertly, never rendered here) and the plain text. */
  function linksOf(mail) {
    const found = [];
    if (mail.html) {
      const doc = new DOMParser().parseFromString(String(mail.html), 'text/html');
      for (const a of doc.querySelectorAll('a[href]')) found.push({ href: a.getAttribute('href') || '', text: (a.textContent || '').trim().slice(0, 300) });
    }
    for (const m of String(mail.text || '').matchAll(/https?:\/\/[^\s<>"'\u0000-\u001f]+/gi)) found.push({ href: m[0].replace(/[.,;!?)\]]+$/, ''), text: '' });
    const seen = new Set();
    return found.filter(l => /^https?:/i.test(l.href) && !seen.has(l.href + '|' + l.text) && seen.add(l.href + '|' + l.text)).slice(0, 500);
  }
  function rules(mail) {
    const items = [], add = (code, detail = '') => { if (!items.some(i => i.code === code && i.detail === detail)) items.push({ code, detail }); };
    const head = headers(mail.raw), get = name => head.filter(h => h[0] === name).map(h => h[1]);
    // Only the first Authentication-Results counts: it is added by the receiving provider.
    const auth = (get('authentication-results')[0] || '').toLowerCase();
    if (/\bdmarc=fail\b/.test(auth) || (/\bspf=(fail|softfail)\b/.test(auth) && !/\bdkim=pass\b/.test(auth))) add('auth-fail');
    if (get('x-spam-flag').some(v => /yes/i.test(v)) || get('x-spam-status').some(v => /^yes/i.test(v))) add('provider-spam');
    const fromRaw = get('from')[0] || mail.from || '', from = addressOf(fromRaw), fromDomain = domainOf(from), name = nameOf(fromRaw).toLowerCase();
    const reply = addressOf(get('reply-to')[0] || mail.replyTo || '');
    if (from && reply && base(domainOf(reply)) !== base(fromDomain)) add('reply-other', reply);
    const shown = addressOf(name);
    if (shown && shown !== from) add('name-address', shown + ' ≠ ' + from);
    if (fromDomain) {
      for (const [brand, domains] of Object.entries(BRANDS)) {
        if (new RegExp('\\b' + brand + '\\b').test(name) && !domains.some(d => base(fromDomain) === base(d)) && !base(fromDomain).includes(brand.replace(/\s/g, '')))
          add('brand-mismatch', nameOf(fromRaw) + ' · ' + fromDomain);
      }
      // Look-alikes ("paypa1.com"): short names differ by design (dpd/dhl), so the allowed
      // difference grows with the length, and every known domain itself is exempt.
      const own = base(fromDomain), known = Object.values(BRANDS).flat();
      if (!known.includes(own)) for (const d of known) {
        const allowed = d.length >= 10 ? 2 : d.length >= 7 ? 1 : 0;
        if (allowed && own.split('.').pop() === d.split('.').pop() && distance(own, d) <= allowed) add('lookalike', own + ' ~ ' + d);
      }
      if (fromDomain.split('.').some(p => p.startsWith('xn--')) || /[^\x00-\x7f]/.test(fromDomain)) add('punycode', fromDomain);
    }
    for (const link of linksOf(mail)) {
      const host = hostOf(link.href);
      if (!host) continue;
      if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host.startsWith('[')) add('link-ip', host);
      if (SHORTENERS.includes(host)) add('link-short', host);
      try { if (new URL(link.href).username) add('link-at', host); } catch { /* not a URL */ }
      const shownHost = (link.text.match(/(?:https?:\/\/)?((?:[a-z0-9-]+\.)+[a-z]{2,})/i) || [])[1]?.toLowerCase();
      if (shownHost && base(shownHost) !== base(host)) add('link-mismatch', shownHost + ' → ' + host);
    }
    const words = (mail.subject || '') + '\n' + String(mail.text || '').slice(0, 20000);
    const hits = Object.keys(PHRASES).filter(k => PHRASES[k].test(words));
    // One category alone is everyday mail ("Ihr Passwort wurde geändert"); two or more is the scam pattern.
    if (hits.length >= 2) add('pressure', hits.map(t).join(' · '));
    for (const a of mail.attachments || []) {
      const parts = String(a.name || '').toLowerCase().split('.');
      const ext = parts.length > 1 ? parts.pop() : '';
      if (DANGEROUS.includes(ext)) add(parts.length > 1 && DOCS.includes(parts[parts.length - 1]) ? 'attachment-double' : 'attachment-danger', a.name);
    }
    return { provider: 'rules', name: t('rules'), version: '1', state: items.length ? 'hinweis' : 'unauffaellig', items };
  }

  // ---------- providers backed by Android ----------
  let status = null;
  async function refreshState() { if (!api) return null; try { status = await api.state(); } catch { status = null; } return status; }
  async function digestOf(a) {
    if (a.sha256 && /^[0-9a-f]{64}$/i.test(a.sha256)) return a.sha256.toLowerCase();
    if (!a.data) return '';
    const bytes = Uint8Array.from(atob(a.data), c => c.charCodeAt(0));
    return hex(await crypto.subtle.digest('SHA-256', bytes));
  }
  function unavailable() {
    if (!api) return t('notChecked');
    if (!status?.configured) return t('notChecked') + ' – ' + t('noFolder');
    if (!status.unlocked) return t('notChecked') + ' – ' + t('locked');
    return t('notChecked') + ' – ' + (status.malware?.problem ? err(status.malware.problem) : t('never'));
  }
  async function checkFiles(list) {
    const digests = await Promise.all(list.map(a => digestOf(a).catch(() => '')));
    const wanted = digests.filter(Boolean);
    if (!api || !wanted.length) return list.map(() => ({ state: 'nicht-geprueft', text: t('notChecked') }));
    await refreshState();
    let result;
    try { result = await api.checkHashes({ items: wanted }); }
    catch (error) { return list.map(() => ({ state: 'nicht-geprueft', text: t('notChecked') + ' – ' + err(codeOf(error)) })); }
    const listed = new Map(result.items.map(i => [i.sha256, i.listed]));
    const stand = status?.malware?.updated ? ' (' + t('stand') + ' ' + date(status.malware.updated) + ')' : '';
    return digests.map(d => !d ? { state: 'nicht-geprueft', text: t('notChecked') }
      : !result.available ? { state: 'nicht-geprueft', text: unavailable() }
      : listed.get(d) ? { state: 'befund', text: t('listed'), sha256: d }
      : { state: 'unauffaellig', text: t('unremarkable') + ' MalwareBazaar' + stand, sha256: d });
  }
  async function checkLinks(mail) {
    const all = [...new Set(linksOf(mail).map(l => l.href))];
    if (!api || !all.length) return { state: all.length ? 'nicht-geprueft' : 'unauffaellig', items: [] };
    try {
      const result = await api.checkUrls({ items: all });
      if (!result.available) return { state: 'nicht-geprueft', items: [], text: unavailable().replace(t('notChecked'), t('linksList') + ': ' + t('notChecked')) };
      const items = [];
      for (const i of result.items) {
        if (i.listed) items.push({ code: 'link-listed', state: 'befund', detail: i.url });
        else if (i.serverListed) items.push({ code: 'server-listed', state: 'hinweis', detail: i.host });
      }
      return { state: items.some(i => i.state === 'befund') ? 'befund' : items.length ? 'hinweis' : 'unauffaellig', items };
    } catch (error) { return { state: 'nicht-geprueft', items: [], text: t('linksList') + ': ' + t('notChecked') + ' – ' + err(codeOf(error)) }; }
  }

  // ---------- mail panel ----------
  function itemText(item) {
    if (item.code === 'link-listed') return t('linkListed') + ' ' + item.detail;
    if (item.code === 'server-listed') return t('serverListed') + ' ' + item.detail;
    return t(item.code) + (item.detail ? ' ' + item.detail : '');
  }
  function mailPanel(mail) {
    const box = make('details', null, 'pb-schutz-mail'), summary = make('summary'), list = make('ul');
    box.dataset.state = 'checking'; box.append(summary, list);
    const ruleResult = rules(mail);
    const render = (linkResult, fileResults) => {
      const items = [...ruleResult.items.map(i => ({ ...i, state: 'hinweis' })), ...(linkResult?.items || [])];
      const files = (fileResults || []).filter(f => f.state === 'befund');
      const bad = items.filter(i => i.state === 'befund').length + files.length, hints = items.filter(i => i.state === 'hinweis').length;
      box.dataset.state = bad ? 'befund' : hints ? 'hinweis' : linkResult ? 'unauffaellig' : 'checking';
      summary.textContent = t('panel') + ': ' + (bad ? bad + ' ' + t('findings') + (hints ? ' · ' : '') : '') + (hints ? hints + ' ' + t('hints') : '') + (!bad && !hints ? (linkResult ? t('nothing') : t('checking')) : '');
      list.replaceChildren(...items.map(i => { const li = make('li', itemText(i)); li.dataset.state = i.state; li.dataset.code = i.code; return li; }),
        ...files.map(f => { const li = make('li', '📎 ' + f.name + ' ' + t('listed')); li.dataset.state = 'befund'; return li; }));
      const sources = make('li', null, 'pb-schutz-sources');
      sources.textContent = [t('rules') + ' (' + t('rulesInfo') + ')', linkResult?.text || (linkResult && api ? t('linksList') + (status?.links?.updated ? ' · ' + t('stand') + ' ' + date(status.links.updated) : '') : '')].filter(Boolean).join(' · ');
      list.append(sources);
      if (bad) box.open = true;
    };
    render(null, null);
    void (async () => {
      const attachments = (mail.attachments || []).filter(a => !a.inline);
      const [linkResult, fileResults] = await Promise.all([checkLinks(mail), checkFiles(attachments)]);
      fileResults.forEach((f, i) => { f.name = attachments[i]?.name; });
      render(linkResult, fileResults);
    })();
    return box;
  }

  // ---------- attachments: status, VirusTotal, helper app ----------
  function attachmentStatus(a, { handOut } = {}) {
    const box = make('span', null, 'pb-schutz-file');
    const label = make('span', t('checking')); label.dataset.state = 'checking';
    box.append(label);
    void checkFiles([a]).then(([r]) => {
      label.textContent = '🛡 ' + r.text; label.dataset.state = r.state;
      if (!api || !r.sha256 && !a.sha256 && !a.data) return;
      const vt = make('button', t('vtAsk'), 'mail-button pb-schutz-vt'); vt.type = 'button';
      vt.onclick = async () => {
        if (!confirm(t('vtAskInfo'))) return;
        vt.disabled = true;
        try {
          const res = await api.virusTotal({ sha256: r.sha256 || await digestOf(a) });
          label.textContent = '🛡 ' + (!res.known ? t('vtUnknown') : !res.analysed ? t('vtNotAnalysed')
            : t('vtResult').replace('{m}', res.malicious + res.suspicious).replace('{t}', res.total) + (res.date ? ' (' + date(res.date) + ')' : ''));
          label.dataset.state = res.known && res.analysed ? (res.malicious + res.suspicious > 0 ? 'befund' : 'unauffaellig') : 'unbekannt';
        } catch (error) {
          const code = codeOf(error);
          label.textContent = '🛡 VirusTotal: ' + err(code); label.dataset.state = 'nicht-geprueft';
          if (code === 'KEY_REQUIRED') await setKey('virustotal');
        } finally { vt.disabled = false; }
      };
      box.append(vt);
      if (handOut) {
        const helper = make('button', t('helperButton'), 'mail-button pb-schutz-helper'); helper.type = 'button';
        if(window.Capacitor?.getPlatform?.()==='windows'){
          helper.textContent='Microsoft Defender';
          helper.onclick=async()=>{
            const translations={
              de:['Eine entschlüsselte Kopie an Microsoft Defender übergeben? Defender verwendet die Windows-Einstellungen, einschließlich möglicher Cloud-Prüfung.','Prüfung beendet. Defender meldet keinen Befund. Das ist keine Garantie.','Defender meldet einen Befund oder Prüfungsfehler. Prüfe die Datei in Windows-Sicherheit.','Defender-Prüfung nicht verfügbar oder fehlgeschlagen. Die Datei ist ungeprüft.'],
              en:['Send a decrypted copy to Microsoft Defender? Defender uses your Windows settings, including possible cloud checking.','Scan completed. Defender reports no finding. This is no guarantee.','Defender reports a finding or scan error. Check the file in Windows Security.','Defender scan unavailable or failed. The file remains unchecked.'],
              ru:['Передать расшифрованную копию Microsoft Defender? Он использует настройки Windows, включая возможную проверку в облаке.','Проверка завершена. Defender не сообщает об угрозах. Это не гарантия.','Defender сообщает об угрозе или ошибке. Проверьте файл в безопасности Windows.','Defender недоступен или проверка не удалась. Файл не проверен.'],
              pl:['Przekazać odszyfrowaną kopię do Microsoft Defender? Używa on ustawień Windows, w tym możliwej kontroli w chmurze.','Skan zakończony. Defender nie zgłasza zagrożenia. To nie jest gwarancja.','Defender zgłasza zagrożenie lub błąd. Sprawdź plik w Zabezpieczeniach Windows.','Defender niedostępny lub skan nieudany. Plik pozostaje niesprawdzony.']
            };const messages=translations[document.documentElement.lang]||translations.en;
            if(!confirm(messages[0]))return;helper.disabled=true;
            try{
              const options=a.ref||a.id?{vaultRef:a.ref||a.id}:a.data?{name:a.name,data:a.data}:{hash:a.sha256};
              const result=await Capacitor.Plugins.ProFiles.scan(options);
              label.textContent=messages[result.status==='completed'?1:result.status==='attention'?2:3];label.dataset.state=result.status==='completed'?'unauffaellig':'nicht-geprueft';
            }catch{label.textContent=messages[3];label.dataset.state='nicht-geprueft';}
            finally{helper.disabled=false;}
          };
        }else helper.onclick = () => handOut(); box.append(helper);
      }
    });
    return box;
  }

  // ---------- settings card ----------
  let card = null, busy = false, message = '';
  const native = () => ({ language: document.documentElement.lang, dark: document.documentElement.dataset.theme === 'dunkel' });
  async function setKey(service) {
    const result = await api.setKey({ service, ...native() });
    if (result?.state) status = result.state;
    if (result?.saved && service === 'abusech') await update(true);
    renderCard();
    return result;
  }
  async function update(force) {
    if (!api || busy) return;
    if (!force) { const s = await refreshState(); if (!s?.configured || !s.unlocked || s.auto === false || s.offline) return; }
    busy = true; message = force ? t('updating') : ''; renderCard();
    try { const r = await api.update({ force }); message = r.skipped && force ? err(r.skipped) : ''; }
    catch (error) { message = err(codeOf(error)); }
    finally { busy = false; await refreshState(); renderCard(); }
  }
  async function checkAll() {
    const files = [];
    try { for (const e of (await window.Capacitor.Plugins.ProVault.attachments()).items || []) if (e.sha256) files.push({ name: e.name, sha256: e.sha256 }); } catch { /* folder locked */ }
    if (typeof CATALOG !== 'undefined') for (const r of CATALOG) if (r.ext !== 'eml' && /^[0-9a-f]{64}$/i.test(r.hash || '')) files.push({ name: r.name, sha256: r.hash });
    const results = await checkFiles(files);
    const hits = results.map((r, i) => r.state === 'befund' ? files[i].name : '').filter(Boolean);
    message = t('checkAllDone').replace('{n}', files.length).replace('{hits}', hits.length ? hits.join(', ') : '0');
    if (results.length && results.every(r => r.state === 'nicht-geprueft')) message += ' · ' + results[0].text;
    renderCard();
  }
  function line(label, value, state) { const p = make('p', null, 'pb-schutz-line'); p.append(make('strong', label + ': '), make('span', value)); if (state) p.dataset.state = state; return p; }
  function renderCard() {
    if (!card) return;
    const s = status || {};
    const heading = make('h3', t('title')), help = make('p', t('help'), 'hint');
    const rows = [line(t('rules'), t('rulesInfo'), 'ok')];
    const listInfo = (part, extra) => {
      if (!s.configured) return t('noFolder');
      if (!s.unlocked) return t('locked');
      const p = s[part] || {};
      return [p.updated ? t('stand') + ' ' + date(p.updated) + ' · ' + (p.count || 0) + ' ' + t('entries') + (extra && p[extra] != null ? ' · ' + p[extra] + ' ' + t('servers') : '') : t('never'), p.problem ? err(p.problem) : ''].filter(Boolean).join(' · ');
    };
    rows.push(line(t('malware'), listInfo('malware'), s.malware?.problem ? 'problem' : s.malware?.updated ? 'ok' : ''));
    rows.push(line(t('linksList'), listInfo('links', 'servers'), s.links?.problem ? 'problem' : s.links?.updated ? 'ok' : ''));
    rows.push(line(t('vt'), s.keys?.virustotal ? t('keySet') : t('keyMissing')));
    rows.push(line(t('helper'), t('helperInfo')));
    if (s.offline) rows.push(make('p', t('offline'), 'hint'));
    const controls = make('div', null, 'btnrow'); controls.style.justifyContent = 'flex-start';
    const auto = make('label', null, 'pb-schutz-auto'), box = make('input'); box.type = 'checkbox'; box.id = 'schutz-auto';
    box.checked = s.auto !== false; box.disabled = !s.configured || !s.unlocked || busy;
    box.onchange = async () => { try { status = await api.setAuto({ value: box.checked }); } catch (error) { message = err(codeOf(error)); } renderCard(); if (box.checked) void update(false); };
    auto.append(box, document.createTextNode(' ' + t('auto')));
    const button = (id, label, fn, primary) => { const b = make('button', label, primary ? 'primary' : 'ghost'); b.type = 'button'; b.id = id; b.disabled = busy || !s.configured || !s.unlocked; b.onclick = () => fn().catch(error => { message = err(codeOf(error)); renderCard(); }); return b; };
    controls.append(button('schutz-update', t('updateNow'), () => update(true), true),
      button('schutz-key-abuse', t('keyAbuse') + (s.keys?.abusech ? ' ✓' : ''), () => setKey('abusech')),
      button('schutz-key-vt', t('keyVt') + (s.keys?.virustotal ? ' ✓' : ''), () => setKey('virustotal')),
      button('schutz-check-all', t('checkAll'), checkAll));
    const getters = make('div', null, 'btnrow'); getters.style.justifyContent = 'flex-start';
    for (const [id, label, url] of [['schutz-get-abuse', t('getAbuse'), 'https://auth.abuse.ch/'], ['schutz-get-vt', t('getVt'), 'https://www.virustotal.com/gui/join-us']]) {
      const b = make('button', '↗ ' + label, 'ghost'); b.type = 'button'; b.id = id;
      b.onclick = event => { if (event.isTrusted) void links?.open?.({ url }); };
      b.hidden = typeof links?.open !== 'function'; getters.append(b);
    }
    const where = s.configured && s.unlocked ? line(t('where'), '„' + (s.folder || 'Schutzlisten') + '“: ' + ((s.files || []).map(f => f.name).join(', ') || '–')) : null;
    const status_ = make('p', [busy ? t('updating') : '', message].filter(Boolean).join(' · '), 'native-vault-status'); status_.id = 'schutzStatus'; status_.setAttribute('role', 'status');
    const details = make('details', null, 'native-vault-limits'), summary = make('summary', t('limits')), list = make('ul');
    list.append(...W.limitList[lang()].map(x => make('li', x))); details.append(summary, list);
    card.replaceChildren(heading, help, ...rows, auto, controls, getters, ...(where ? [where] : []), status_, details);
  }
  function mountCard() {
    if (!api || card) return;
    const settings = document.getElementById('panel-settings');
    if (!settings) return;
    card = make('div', null, 'note native-vault pb-schutz-card'); card.id = 'schutzPlace';
    const vault = document.getElementById('vaultPlace');
    vault ? vault.after(card) : settings.prepend(card);
    renderCard();
  }

  window.PBSchutz = {
    /** Scanner interface: each provider names itself, its version and the date of its data. */
    providers() {
      return [
        { id: 'rules', name: t('rules'), version: '1', data: t('rulesInfo'), network: false },
        { id: 'malwarebazaar', name: t('malware'), version: '1', data: status?.malware?.updated || 0, network: 'update' },
        { id: 'urlhaus', name: t('linksList'), version: '1', data: status?.links?.updated || 0, network: 'update' },
        { id: 'virustotal', name: t('vt'), version: 'v3', data: 0, network: 'on-tap' },
        { id: 'helper-app', name: t('helper'), version: '-', data: 0, network: 'depends' }
      ];
    },
    rules, linksOf, mailPanel, attachmentStatus, checkFiles, checkLinks, update, refresh: async () => { await refreshState(); renderCard(); },
    text: t
  };

  mountCard();
  new MutationObserver(renderCard).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  if (api) {
    // Automatic updates: at start, when the app returns to the foreground, and hourly while open.
    // Android decides what is due (every 12 hours; the complete list only on Wi-Fi).
    const tick = () => { void update(false).then(() => renderCard()); };
    void refreshState().then(renderCard);
    setTimeout(tick, 3000);
    setInterval(tick, 60 * 60 * 1000);
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') tick(); });
  }
})();
