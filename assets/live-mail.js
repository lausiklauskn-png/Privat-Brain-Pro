/* Optional private IMAP/SMTP service. Credentials never enter browser storage. */
(function () {
  "use strict";
  const host = document.getElementById("mailWorkspace"),
    local = host.querySelector(".mail-app");
  const native = window.PBMailDevice || null;
  const shared = native ? window.PBMailUI : null;
  const S = key => shared.text(key);
  const words = {
    serviceHelp: [
      "Privater HTTPS-Mail-Dienst auf deinem Server/NAS. Dienst-Schlüssel nur für diese Sitzung.",
      "Private HTTPS mail service on your server/NAS. Service key for this session only.",
      "Личный почтовый HTTPS-сервис на вашем сервере/NAS. Ключ только для этого сеанса.",
      "Prywatna usługa HTTPS na twoim serwerze/NAS. Klucz tylko na tę sesję.",
    ],
    serviceAddress: [
      "HTTPS-Adresse des privaten Dienstes",
      "Private service HTTPS address",
      "HTTPS-адрес личного сервиса",
      "Adres HTTPS prywatnej usługi",
    ],
    serviceKey: [
      "Dienst-Schlüssel",
      "Service key",
      "Ключ сервиса",
      "Klucz usługi",
    ],
    email: ["E-Mail-Adresse", "Email address", "Адрес почты", "Adres e-mail"],
    user: [
      "Benutzername (leer = E-Mail-Adresse)",
      "Username (blank = email address)",
      "Имя пользователя (пусто = адрес почты)",
      "Użytkownik (puste = adres e-mail)",
    ],
    password: [
      "Mail-Passwort",
      "Mail password",
      "Пароль почты",
      "Hasło poczty",
    ],
    accountHelp: [
      "Telekom: separates Passwort für E-Mail-Programme. Hetzner: Servernamen beim Anbieter prüfen. Zugangsdaten werden verschlüsselt auf deinem privaten Dienst gespeichert.",
      "Telekom: separate password for email apps. Hetzner: check server names with your provider. Credentials are stored encrypted on your private service.",
      "Telekom: отдельный пароль для почтовых программ. Hetzner: проверьте имена серверов у провайдера. Данные хранятся зашифрованными в личном сервисе.",
      "Telekom: osobne hasło dla programów pocztowych. Hetzner: sprawdź serwery u dostawcy. Dane są zaszyfrowane w prywatnej usłudze.",
    ],
    catalogConfirm: [
      "Nachrichten dieser Seite lokal katalogisieren? Texte bleiben auf diesem Gerät.",
      "Catalog this page locally? Texts stay on this device.",
      "Добавить страницу в локальный каталог? Тексты останутся на устройстве.",
      "Katalogować tę stronę lokalnie? Teksty pozostają na urządzeniu.",
    ],
    removeConfirm: [
      "Nur die Kontoverbindung entfernen? E-Mails beim Anbieter bleiben erhalten.",
      "Remove only this account connection? Provider emails are preserved.",
      "Удалить только подключение? Письма у провайдера сохранятся.",
      "Usunąć tylko połączenie konta? Poczta u dostawcy pozostanie.",
    ],
    catalogOne: [
      "In Katalog",
      "Add to catalog",
      "В каталог",
      "Do katalogu",
    ],
    renewPassword: [
      "Passwort erneuern",
      "Renew password",
      "Обновить пароль",
      "Odnów hasło",
    ],
    renewed: [
      "Neues Passwort gespeichert. Die Ordner werden neu geladen.",
      "New password saved. Folders are reloading.",
      "Новый пароль сохранён. Папки загружаются заново.",
      "Nowe hasło zapisane. Foldery są wczytywane ponownie.",
    ],
    removeAccount: [
      "Kontoverbindung entfernen",
      "Remove account connection",
      "Удалить подключение",
      "Usuń połączenie konta",
    ],
    connect: [
      "Mailkonto verbinden",
      "Connect mail account",
      "Подключить почту",
      "Połącz konto",
    ],
    disconnect: [
      "Dienst trennen",
      "Disconnect service",
      "Отключить сервис",
      "Rozłącz usługę",
    ],
    remote: [
      "Server-Postfach",
      "Server mailbox",
      "Почта сервера",
      "Poczta serwera",
    ],
    local: ["Lokale Mails", "Local mail", "Локальная почта", "Poczta lokalna"],
    refresh: ["Aktualisieren", "Refresh", "Обновить", "Odśwież"],
    compose: ["Verfassen", "Compose", "Написать", "Napisz"],
    send: ["Senden", "Send", "Отправить", "Wyślij"],
    copyRecipients: ["Cc / Bcc", "Cc / Bcc", "Копия / скрытая копия", "DW / UDW"],
    cc: ["Cc", "Cc", "Копия", "DW"],
    bcc: ["Bcc", "Bcc", "Скрытая копия", "UDW"],
    draft: [
      "Server-Entwurf speichern",
      "Save server draft",
      "Сохранить черновик",
      "Zapisz szkic na serwerze",
    ],
    reply: ["Antworten", "Reply", "Ответить", "Odpowiedz"],
    forward: ["Weiterleiten", "Forward", "Переслать", "Przekaż"],
    read: [
      "Gelesen / ungelesen",
      "Read / unread",
      "Прочитано / не прочитано",
      "Przeczytane / nieprzeczytane",
    ],
    star: [
      "Stern umschalten",
      "Toggle star",
      "Отметить звездой",
      "Przełącz gwiazdkę",
    ],
    // Generalprüfung 16.11.2026: die Knöpfe sagen, was der Tipp tut (vorher „Gelesen / ungelesen“, „Stern umschalten“).
    markRead: ["Als gelesen markieren", "Mark as read", "Отметить как прочитанное", "Oznacz jako przeczytane"],
    markUnread: ["Als ungelesen markieren", "Mark as unread", "Отметить как непрочитанное", "Oznacz jako nieprzeczytane"],
    starOn: ["Stern setzen", "Add star", "Поставить звезду", "Dodaj gwiazdkę"],
    starOff: ["Stern entfernen", "Remove star", "Снять звезду", "Usuń gwiazdkę"],
    // Nach dem Senden: ein klarer Satz; die Liste steht wieder da. Es wird nie von selbst noch einmal gesendet.
    sentDone: ["Gesendet.", "Sent.", "Отправлено.", "Wysłano."],
    trash: ["In Papierkorb", "Move to trash", "В корзину", "Do kosza"],
    spam: ["Als Spam", "Mark as spam", "В спам", "Oznacz jako spam"],
    moreFolders: ["Weitere Ordner", "More folders", "Другие папки", "Więcej folderów"],
    viewOnly: ["Ansicht", "view", "вид", "widok"],
    viewHint: ["Sammelansicht des Anbieters: zeigt dieselben Mails wie andere Ordner noch einmal.", "Provider view: shows the same mails as other folders once more.", "Сборный вид провайдера: те же письма ещё раз.", "Widok dostawcy: te same wiadomości jeszcze raz."],
    restore: ["♻ Wiederherstellen", "♻ Restore", "♻ Восстановить", "♻ Przywróć"],
    notSpam: ["✓ Kein Spam", "✓ Not spam", "✓ Не спам", "✓ To nie spam"],
    archive: ["Archivieren", "Archive", "В архив", "Archiwizuj"],
    remove: [
      "Endgültig löschen",
      "Delete permanently",
      "Удалить навсегда",
      "Usuń trwale",
    ],
    move: ["Verschieben", "Move", "Переместить", "Przenieś"],
    folder: ["Neuer Ordner", "New folder", "Новая папка", "Nowy folder"],
    more: [
      "Weitere Nachrichten",
      "More messages",
      "Ещё письма",
      "Więcej wiadomości",
    ],
    catalog: [
      "Diese Seite katalogisieren",
      "Catalog this page",
      "Добавить страницу в каталог",
      "Kataloguj tę stronę",
    ],
    cancel: ["Abbrechen", "Cancel", "Отмена", "Anuluj"],
    save: ["Verbinden", "Connect", "Подключить", "Połącz"],
    account: [
      "Konto hinzufügen",
      "Add account",
      "Добавить аккаунт",
      "Dodaj konto",
    ],
    check: ["Prüfung", "Checks", "Проверка", "Kontrola"],
    attachmentChecking: ["wird geprüft …", "being checked …", "проверяется …", "sprawdzanie …"],
    limit: [
      "Regelprüfung, kein Virenscanner. Anhänge können ungeprüfte Inhalte enthalten.",
      "Rule checks, not antivirus. Attachments may contain unchecked content.",
      "Проверка правил, не антивирус. Вложения могут содержать непроверенное.",
      "Kontrola reguł, nie antywirus. Załączniki mogą zawierać niesprawdzone treści.",
    ],
    risk: [
      "Befunde oder ungeprüfte Anhänge. Trotzdem senden?",
      "Findings or unchecked attachments. Send anyway?",
      "Есть находки или непроверенные вложения. Отправить?",
      "Wykryto problemy lub niesprawdzone załączniki. Wysłać?",
    ],
    confirm: [
      "Diese Nachricht jetzt wirklich versenden?",
      "Send this message now?",
      "Отправить это письмо сейчас?",
      "Wysłać tę wiadomość teraz?",
    ],
    discard: [
      "Nicht gespeicherten Entwurf verwerfen?",
      "Discard unsaved draft?",
      "Удалить несохранённый черновик?",
      "Odrzucić niezapisany szkic?",
    ],
    sent: [
      "Mailserver hat die Nachricht angenommen.",
      "Mail server accepted the message.",
      "Почтовый сервер принял письмо.",
      "Serwer pocztowy przyjął wiadomość.",
    ],
    back: [
      "← Nachrichtenliste",
      "← Message list",
      "← Список писем",
      "← Lista wiadomości",
    ],
    error: [
      "Aktion fehlgeschlagen.",
      "Action failed.",
      "Ошибка действия.",
      "Działanie nie powiodło się.",
    ],
    from: ["Von", "From", "От", "Od"],
    to: ["An", "To", "Кому", "Do"],
    subject: ["Betreff", "Subject", "Тема", "Temat"],
    body: ["Nachricht", "Message", "Сообщение", "Wiadomość"],
    attach: ["Anhänge", "Attachments", "Вложения", "Załączniki"],
    download: [
      "Original herunterladen",
      "Download original",
      "Скачать оригинал",
      "Pobierz oryginał",
    ],
    bookledger: [
      "An BookLedgerPro teilen",
      "Share with BookLedgerPro",
      "Передать в BookLedgerPro",
      "Udostępnij do BookLedgerPro",
    ],
    bookledgerFallback: [
      "Teilen ist hier nicht möglich – die Mail wurde als .eml gespeichert. In BookLedgerPro unter „Belege“ hochladen.",
      "Sharing is not available here – the mail was saved as .eml. Upload it in BookLedgerPro under “Receipts”.",
      "Передача здесь недоступна – письмо сохранено как .eml. Загрузите его в BookLedgerPro в разделе «Документы».",
      "Udostępnianie nie jest tu możliwe – wiadomość zapisano jako .eml. Wgraj ją w BookLedgerPro w „Dowodach”.",
    ],
    familienakte: [
      "An Familienakte teilen",
      "Share with Familienakte",
      "Передать в Familienakte",
      "Udostępnij do Familienakte",
    ],
    familienakteFallback: [
      "Teilen ist hier nicht möglich – die Mail wurde als .eml gespeichert. In der Familienakte in der Eingangszentrale hineinziehen; die Anhänge löst sie dort heraus.",
      "Sharing is not available here – the mail was saved as .eml. Drop it into the Familienakte inbox; it extracts the attachments there.",
      "Передача здесь недоступна – письмо сохранено как .eml. Перетащите его во входящие Familienakte; вложения будут извлечены там.",
      "Udostępnianie nie jest tu możliwe – wiadomość zapisano jako .eml. Przeciągnij ją do skrzynki odbiorczej Familienakte; tam zostaną wyodrębnione załączniki.",
    ],
    // Klaus 16.11.2026: markierte Mails aus der Liste an die Familienakte (nur in der App mit Pro-Tresor).
    familienakteList: ["An Familienakte", "To Familienakte", "В Familienakte", "Do Familienakte"],
    famMax: [
      "Höchstens 20 Mails auf einmal an die Familienakte – markiert sind {n}. Bitte weniger markieren.",
      "At most 20 emails at once to Familienakte – {n} are selected. Please select fewer.",
      "Не более 20 писем за раз в Familienakte – выбрано {n}. Выберите меньше.",
      "Najwyżej 20 wiadomości naraz do Familienakte – zaznaczono {n}. Zaznacz mniej.",
    ],
    famProgress: [
      "Mail {i} von {n} an die Familienakte …",
      "Email {i} of {n} to Familienakte …",
      "Письмо {i} из {n} в Familienakte …",
      "Wiadomość {i} z {n} do Familienakte …",
    ],
    famClosed: [
      "Nichts übergeben: Der Pro-Tresor ist nicht offen.",
      "Nothing passed on: the Pro vault is not open.",
      "Ничего не передано: сейф Pro не открыт.",
      "Nic nie przekazano: sejf Pro nie jest otwarty.",
    ],
    famDone: [
      "An die Familienakte übergeben: {a} von {n}.",
      "Passed on to Familienakte: {a} of {n}.",
      "Передано в Familienakte: {a} из {n}.",
      "Przekazano do Familienakte: {a} z {n}.",
    ],
    famKnown: [
      "Schon früher übergeben, nicht noch einmal geschickt: {s}.",
      "Already passed on earlier, not sent again: {s}.",
      "Уже переданы раньше, повторно не отправлены: {s}.",
      "Przekazane już wcześniej, nie wysłano ponownie: {s}.",
    ],
    famNoSort: [
      "Mail übergeben, Vorsortierung nicht: {v}.",
      "Email passed on, pre-sorting not: {v}.",
      "Письмо передано, предварительная сортировка — нет: {v}.",
      "Wiadomość przekazana, wstępne sortowanie nie: {v}.",
    ],
    famFindings: [
      "Bei {r} davon steht etwas im Prüfbericht der Anhänge – Mail öffnen und ansehen.",
      "For {r} of them the attachment check report has an entry – open the email and look.",
      "У {r} из них есть запись в отчёте о проверке вложений – откройте письмо и посмотрите.",
      "Dla {r} z nich raport kontroli załączników zawiera wpis – otwórz wiadomość i sprawdź.",
    ],
    famFailed: ["Nicht übergeben: {f}", "Not passed on: {f}", "Не передано: {f}", "Nie przekazano: {f}"],
    famWhyLoad: ["beim Anbieter nicht ladbar", "could not be loaded from the provider", "не удалось загрузить у провайдера", "nie udało się pobrać od dostawcy"],
    famWhyLarge: ["größer als 20 MiB", "larger than 20 MiB", "больше 20 МиБ", "ponad 20 MiB"],
    famWhyCheck: ["Anhänge nicht geprüft", "attachments not checked", "вложения не проверены", "załączniki niesprawdzone"],
    famWhyVault: ["Pro-Tresor nicht offen", "Pro vault not open", "сейф Pro не открыт", "sejf Pro nie jest otwarty"],
    famWhyOther: ["Übergabe fehlgeschlagen", "handover failed", "передача не удалась", "przekazanie nie powiodło się"],
    // Klaus 22.11.2026: „Alle Konten“ als drittes Konto im Postfach.
    allAccounts: ["Alle Konten", "All accounts", "Все аккаунты", "Wszystkie konta"],
    allTools: ["Werkzeuge", "Tools", "Инструменты", "Narzędzia"],
    allSenders: ["Nach Absender", "By sender", "По отправителям", "Według nadawcy"],
    allClean: ["Aufräumen", "Clean up", "Уборка", "Porządki"],
    allNotYet: ["Noch nicht abgerufen – der erste Abruf läuft.", "Not fetched yet – the first fetch is running.", "Ещё не загружено – идёт первая загрузка.", "Jeszcze nie pobrano – trwa pierwsze pobieranie."],
    allRunning: ["Wird abgerufen …", "Fetching …", "Загрузка …", "Pobieranie …"],
    allSkipped: ["nicht verschoben (dieser Ordner gehört zu einem anderen Konto oder fehlt dort)", "not moved (this folder belongs to another account or is missing there)", "не перемещено (папка принадлежит другому аккаунту или отсутствует)", "nie przeniesiono (folder należy do innego konta lub go brak)"],
    allGone: ["Diese Mail liegt dort nicht mehr. Die Liste ist aktualisiert.", "This email is no longer there. The list is updated.", "Этого письма там больше нет. Список обновлён.", "Tej wiadomości już tam nie ma. Lista została zaktualizowana."],
    files: ["Anhang", "attachment", "вложение", "załącznik"],
    filesMany: ["Anhänge", "attachments", "вложения", "załączniki"],
    filter: [
      "Ordner filtern",
      "Filter folder",
      "Фильтр папки",
      "Filtruj folder",
    ],
  };
  const T = (k) => native?.text(k) ||
    (words[k] || [k])[
      Math.max(
        0,
        ["de", "en", "ru", "pl"].indexOf(
          document.documentElement.lang.slice(0, 2),
        ),
      )
    ] || k;
  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  };
  let base = "",
    token = "",
    accounts = [],
    account = "",
    folders = [],
    folder = "INBOX",
    validity = "",
    items = [],
    next = null,
    current = null,
    mail = null,
    draft = null,
    dirty = false,
    busy = false;
  let viewKey = 'inbox', lastAccount = '', savedCache = [], folderMap = new Map(), entries = [], filterText = '', foldersReady = false;
  let copyRecipientsOpen = false;
  // Klaus 22.11.2026: „Alle Konten“ ist ein drittes Konto in der Auswahl – dieselbe Ordnerspalte, Liste, Leseansicht und
  // Anordnung wie ein einzelnes Konto. Die Liste kommt aus dem Index (alle Ordner aller Konten, native-mail-index.js);
  // jede Aktion geht an das Konto, dem die Mail gehört, je Konto in einem Auftrag.
  const ALL = "*", CHOICE = "pb_mail_account_choice";
  let allMode = false, allFolders = {};
  const allAllowed = () => Boolean(native && window.PBMailIndex && accounts.length > 1);
  const keyOf = (item) => allMode && !item.local ? item.account + "\n" + item.folder + "\n" + item.uid : item.uid;
  const choice = (value) => { try { if (value === undefined) return localStorage.getItem(CHOICE); localStorage.setItem(CHOICE, value); } catch { /* preference only */ } return null; };
  const DOTS = ["#2563eb", "#c2410c", "#15803d", "#7c3aed", "#0e7490", "#b91c1c"];
  const dotColor = (id) => DOTS[Math.max(0, accounts.findIndex((a) => a.id === id)) % DOTS.length];
  // Klaus 22.11.2026: die Liste zeigt erst wenige Mails, „Weitere laden“ holt die nächsten (wie im Postfach der Telekom).
  const PAGE_SHOW = 15;
  let shownCount = PAGE_SHOW;
  const selected = new Set(), totals = new Map();
  const bar = el("div", "mail-head"),
    connect = btn("connect", setup),
    switcher = btn("remote", () => switchMode(true)),
    localButton = btn("local", () => switchMode(false));
  switcher.hidden = true;
  localButton.hidden = true;
  bar.append(connect, switcher, localButton);
  const nativeNotice = native ? el("p", "mail-notice") : null;
  if (nativeNotice) { nativeNotice.setAttribute("role", "alert"); bar.append(nativeNotice); }
  host.prepend(bar);
  const app = el("div", "mail-app live-mail");
  app.hidden = true;
  app.dataset.view = "list";
  host.append(app);
  const head = el("div", "mail-head"),
    accountSelect = el("select"),
    notice = el("p", "mail-notice"),
    layout = el("div", "mail-layout"),
    nav = el("nav", "mail-folders"),
    list = el("section", "mail-list"),
    reader = el("section", "mail-reader");
  reader.id = "pb-live-reader";
  notice.setAttribute("role", "status"); // Hinweiszeile über der Liste: wird vorgelesen, wenn sich ihr Text ändert
  accountSelect.setAttribute("aria-label", "Mailkonto");
  accountSelect.onchange = () =>
    run(async () => {
      if (!leave()) {
        accountSelect.value = allMode ? ALL : account;
        return;
      }
      if (accountSelect.value === ALL) return enterAll(true);
      leaveAll();
      account = accountSelect.value;
      choice(account);
      renewVisible();
      if (native) switchMode(true);
      await loadFolders();
    });
  const accountTools = native ? el("div", "mail-app mail-head mail-account-bar") : head;
  accountTools.append(
    accountSelect,
    btn("refresh", () => (allMode ? startAllSync() : loadFolders())),
    btn("compose", () => compose()),
    btn("account", () => setupAccount()),
    ...(native ? [btn("saved", () => savedItems())] : []),
    btn("disconnect", disconnect),
    // Klaus 19.11.2026: nach einem neuen Passwort beim Anbieter (Telekom: „Passwort für E-Mail-Programme“) nur das Passwort ersetzen,
    // statt das Konto neu anzulegen – Kennung, Ordner und gemerkte Mails bleiben dem Konto zugeordnet. Nur Geräte-Konten mit Passwort.
    ...(native && native.renewPassword ? [btn("renewPassword", async () => {
      if (!leave() || !account) return;
      const renewed = await native.renewPassword(account);
      if (!renewed) return;
      accounts = await native.accounts();
      await loadFolders();
      notice.textContent = T("renewed");
    })] : []),
    btn("removeAccount", async () => {
      if (!leave() || !account || !confirm(T("removeConfirm"))) return;
      await api("/accounts/" + account, null, "DELETE");
      dirty = false;
      draft = null;
      accounts = await api("/accounts");
      await accountList();
    }),
  );
  if (native) {
    const tools = el("details", "mail-account-tools"), summary = el("summary", "mail-button", T("tools")), menu = el("div", "mail-account-menu");
    summary.dataset.liveText = "tools";
    tools.append(summary, menu);
    for (const key of ["account", "saved", "renewPassword", "disconnect", "removeAccount"].filter(k => accountTools.querySelector('[data-live-text="' + k + '"]')))
      menu.append(accountTools.querySelector('[data-live-text="' + key + '"]'));
    menu.append(localButton);
    menu.addEventListener("click", event => { if (event.target.closest("button")) tools.open = false; });
    accountTools.append(tools);
    document.addEventListener("click", event => { if (!tools.contains(event.target)) tools.open = false; });
  }
  if (native) {
    const heading = el('h2', '', S('mail')); heading.dataset.sharedText = 'mail';
    const composeButton = accountTools.querySelector('[data-live-text="compose"]');
    composeButton.classList.add('mail-primary');
    const importButton = el('button','mail-button',S('import')); importButton.type='button'; importButton.dataset.sharedText='import';
    importButton.onclick=()=>{if(leave()){dirty=false;draft=null;shared.importMail();}};
    head.append(heading,composeButton,importButton);
    accountTools.hidden=true; host.insertBefore(accountTools,app);
    const catalog = btn('catalog',catalogPage); accountTools.querySelector('.mail-account-menu').append(catalog);
    nav.setAttribute('aria-label',S('mail'));
  }
  layout.append(nav, list, reader);
  app.append(head, notice, layout);
  function btn(key, fn) {
    const b = el("button", "mail-button", T(key));
    b.type = "button";
    if (key === "back") b.classList.add("mail-back");
    b.dataset.liveText = key;
    b.onclick = () => run(fn);
    return b;
  }
  function leave() {
    return !dirty || confirm(T("discard"));
  }
  /** „Passwort erneuern“ nur bei Konten mit Passwort (nicht bei Google, das sich über die Google-Anmeldung erneuert). */
  function renewVisible() {
    const b = app.parentNode?.querySelector?.('[data-live-text="renewPassword"]') || document.querySelector('[data-live-text="renewPassword"]');
    const current = accounts.find((a) => a.id === account);
    if (b) b.hidden = allMode || !account || (!!current && (current.authType || "password") !== "password");
    // Was nur ein einzelnes Konto betrifft, steht unter „Alle Konten“ nicht im Menü.
    for (const key of ["saved", "removeAccount", "catalog"]) {
      const x = document.querySelector('.mail-account-menu [data-live-text="' + key + '"]');
      if (x) x.hidden = allMode;
    }
  }
  // Klaus 16.11.2026: jede geöffnete Mail hat eine Nummer; ein Prüfergebnis gilt nur, solange seine Mail noch offen ist.
  let openTicket = 0;
  /** The opened mail leaves the reader: its attachment checks stop and write nothing any more. */
  function endChecks() {
    openTicket++;
    delete reader.dataset.mailChecking;
  }
  async function run(fn) {
    if (busy) return false;
    busy = true;
    let ok = false;
    if (nativeNotice) nativeNotice.textContent = "";
    delete notice.dataset.mailResult;
    app.inert = true;
    if (native) accountTools.inert = true;
    app.setAttribute("aria-busy", "true");
    try {
      await fn();
      ok = true;
    } catch (e) {
      notice.textContent = T("error") + " " + e.message;
      if (nativeNotice) nativeNotice.textContent = e.message;
      const d = host.querySelector("dialog[open] form");
      if (d) {
        let error = d.querySelector("[role=alert]");
        if (!error) {
          error = el("p", "mail-notice");
          error.setAttribute("role", "alert");
          d.append(error);
        }
        error.textContent = e.message;
      }
    } finally {
      native?.progress?.('idle');
      busy = false;
      app.inert = false;
      if (native) accountTools.inert = false;
      app.removeAttribute("aria-busy");
    }
    return ok;
  }
  async function api(path, body, method) {
    if (native) return native.request(path, body, method);
    const r = await fetch(base + "/api/mail" + path, {
      method: method || (body ? "POST" : "GET"),
      headers: {
        Authorization: "Bearer " + token,
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      cache: "no-store",
      credentials: "omit",
      redirect: "error",
      signal: AbortSignal.timeout(120000),
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || r.status);
    return data;
  }
  const prefix = () => "/" + encodeURIComponent(account);
  const query = () =>
    "?folder=" +
    encodeURIComponent(folder) +
    "&validity=" +
    encodeURIComponent(validity);
  function switchMode(on) {
    if (!leave()) return;
    dirty = false;
    local.hidden = on;
    app.hidden = !on;
    switcher.hidden = on || !token;
    localButton.hidden = !on;
  }
  function field(form, label, value = "", type = "text") {
    const l = el("label", "", label),
      i = el(type === "textarea" ? "textarea" : "input");
    if (type !== "textarea") i.type = type;
    i.value = value;
    l.append(i);
    form.append(l);
    return i;
  }
  function dialog(title) {
    const d = el("dialog", "mail-app live-dialog"),
      form = el("form");
    form.method = "dialog";
    form.append(el("h3", "", title));
    d.append(form);
    host.append(d);
    d.addEventListener("close", () => d.remove());
    d.showModal();
    return { d, form };
  }
  // Generalprüfung 16.11.2026: ist schon ein Konto gespeichert, steht das Postfach beim Öffnen des Reiters Mail von selbst da
  // (vorher ein Extra-Tipp auf den Briefumschlag). Gefragt werden nur die gespeicherten Konten; ohne Konto bleibt alles wie
  // bisher. Der Internetschalter gilt weiter: getrennt lehnt die App den Abruf ab und sagt das. Wer das Postfach selbst
  // schließt („Postfach schließen“), bekommt es bis zum nächsten App-Start nicht von selbst wieder.
  let autoOpen = Boolean(native);
  async function openSaved() {
    const idle = () => autoOpen && !busy && app.hidden && !token;
    if (!idle()) return;
    let found = [];
    try { found = await native.accounts(); } catch { return; } // Kontenablage nicht lesbar: der Knopf bleibt, dort steht der Grund
    if (!found.length || !idle()) return;
    autoOpen = false;
    await run(async () => {
      accounts = found;
      base = native.base;
      token = "device";
      connect.hidden = true;
      switchMode(true);
      await accountList();
    });
  }
  if (native) {
    const mailPanel = document.getElementById("panel-mail");
    const whenShown = () => { if (mailPanel?.classList.contains("on")) void openSaved(); };
    if (mailPanel) new MutationObserver(whenShown).observe(mailPanel, { attributes: true, attributeFilter: ["class"] });
    whenShown();
  }
  async function setup() {
    if (native) {
      accounts = await native.accounts();
      if (!accounts.length) {
        const added = await native.addAccount();
        if (!added) return;
        accounts = await native.accounts();
        account = added.id;
      }
      base = native.base;
      token = "device";
      connect.hidden = true;
      switchMode(true);
      await accountList();
      return;
    }
    const { d, form } = dialog(T("connect"));
    form.append(el("p", "mail-muted", T("serviceHelp")));
    const url = field(
        form,
        T("serviceAddress"),
        localStorage.getItem("pb_mail_service_url") || location.origin,
        "url",
      ),
      key = field(form, T("serviceKey"), "", "password");
    key.autocomplete = "off";
    form.append(btn("cancel", () => d.close()));
    const submit = el("button", "mail-button", T("save"));
    submit.type = "submit";
    form.append(submit);
    form.onsubmit = (e) => {
      e.preventDefault();
      run(async () => {
        const u = new URL(url.value);
        if (
          u.protocol !== "https:" ||
          u.username ||
          u.password ||
          u.search ||
          u.hash ||
          u.pathname !== "/"
        )
          throw new Error("HTTPS-Ursprung ohne Pfad erforderlich.");
        base = u.origin;
        token = key.value;
        try {
          accounts = await api("/accounts");
        } catch (e) {
          token = "";
          throw e;
        }
        localStorage.setItem("pb_mail_service_url", base);
        d.close();
        connect.hidden = true;
        switchMode(true);
        await accountList();
      });
    };
  }
  function accountOptions() {
    accountSelect.replaceChildren(
      ...(allAllowed() ? [new Option(T("allAccounts"), ALL)] : []),
      ...accounts.map((a) => new Option(a.email, a.id)),
    );
  }
  async function accountList() {
    accountOptions();
    if (!accounts.some((a) => a.id === account))
      account = accounts[0]?.id || "";
    // Beim Start kann das Postfach schon stehen, bevor native-mail-index.js geladen ist: kurz auf den Index warten.
    for (let i = 0; native && !window.PBMailIndex && accounts.length > 1 && choice() === ALL && i < 50; i++) await new Promise((r) => setTimeout(r, 100));
    accountOptions();
    if (allAllowed() && (allMode || choice() === ALL)) {
      if (native) accountTools.hidden = false;
      return enterAll(true);
    }
    leaveAll();
    accountSelect.value = account;
    if (native) accountTools.hidden = !account;
    renewVisible();
    if (account) await loadFolders();
    else if (native) disconnect();
    else setupAccount();
  }
  async function setupAccount() {
    if (native) {
      const added = await native.addAccount();
      if (!added) return;
      accounts = await native.accounts();
      account = added.id;
      await accountList();
      return;
    }
    const { d, form } = dialog(T("account")),
      provider = el("select");
    provider.append(
      new Option("Hetzner", "hetzner"),
      new Option("Telekom / T-Online", "telekom"),
    );
    form.append(provider);
    const email = field(
        form,
        T("email"),
        accounts.length ? "" : "info@family-projekt.de",
        "email",
      ),
      user = field(form, T("user")),
      password = field(form, T("password"), "", "password");
    password.autocomplete = "new-password";
    const imap = field(form, "IMAP (TLS · 993)", "mail.your-server.de"),
      smtp = field(form, "SMTP (TLS · 465)", "mail.your-server.de");
    provider.onchange = () => {
      imap.value =
        provider.value === "telekom"
          ? "secureimap.t-online.de"
          : "mail.your-server.de";
      smtp.value =
        provider.value === "telekom"
          ? "securesmtp.t-online.de"
          : "mail.your-server.de";
    };
    form.append(el("p", "mail-muted", T("accountHelp")));
    form.append(btn("cancel", () => d.close()));
    const submit = el("button", "mail-button", T("save"));
    submit.type = "submit";
    form.append(submit);
    form.onsubmit = (e) => {
      e.preventDefault();
      run(async () => {
        const a = await api("/accounts", {
          provider: provider.value,
          email: email.value,
          user: user.value,
          password: password.value,
          imap: imap.value,
          smtp: smtp.value,
        });
        password.value = "";
        d.close();
        accounts = await api("/accounts");
        account = a.id;
        await accountList();
      });
    };
  }
  function disconnect() {
    if (!leave()) return;
    autoOpen = false;
    endChecks();
    token = "";
    accounts = [];
    mail = null;
    items = [];
    draft = null;
    dirty = false;
    reader.replaceChildren();
    list.replaceChildren();
    nav.replaceChildren();
    app.hidden = true;
    if (native) { accountTools.hidden=true; lastAccount=""; totals.clear(); selected.clear(); }
    local.hidden = false;
    connect.hidden = false;
    switcher.hidden = true;
    localButton.hidden = true;
  }
  async function savedItems() {
    if (!native || !leave()) return;
    dirty = false;
    draft = null;
    const records = await native.saved(account);
    app.dataset.view = "reader";
    reader.replaceChildren(btn("back", () => { app.dataset.view = "list"; }), el("h3", "", T("saved")));
    if (!records.length) reader.append(el("p", "mail-muted", T("emptySaved")));
    for (const record of records) {
      const row = el("div", "mail-report");
      const status = el("p", "", T(record.status === "draft" ? "draftStatus" : record.status));
      status.dataset.nativeStatus = record.status === "draft" ? "draftStatus" : record.status;
      row.append(el("strong", "", record.subject), el("p", "mail-muted", record.to), status);
      if (["draft", "queued"].includes(record.status)) row.append(btn("restore", async () => compose(await native.savedDraft(account, record.id))));
      reader.append(row);
    }
  }
  function folderTitle(path) { return (entries.find(entry=>entry.id===viewKey&&entry.path===path)||entries.find(entry=>entry.remote&&entry.path===path))?.name || path; }
  function roleFolder(flag) {
    const role = {'\\Trash':'trash','\\Junk':'spam','\\Archive':'archive','\\Drafts':'draft','\\Sent':'sent'}[flag];
    return native ? folderMap.get(role) : folders.find(f=>f.specialUse===flag);
  }
  function updateEntries() {
    const resolved = PBMailFolders.resolve(folders); folderMap=resolved.roles;
    entries=shared.standard.map(id=>({id,name:S(id),path:folderMap.get(id)?.path || '@'+id,remote:folderMap.has(id)}));
    entries.push(...resolved.custom.map(f=>({id:'provider:'+f.path,name:f.name,path:f.path,remote:true})));
  }
  function historyRows() {
    if(viewKey==='draft')return savedCache.filter(r=>r.status==='draft');
    if(viewKey==='outbox')return savedCache.filter(r=>!['draft','sent'].includes(r.status));
    if(viewKey==='sent'&&!entries.find(entry=>entry.id===viewKey)?.remote)return savedCache.filter(r=>r.status==='sent');
    return [];
  }
  function folderCount(entry) {
    if(entry.id==='outbox')return savedCache.filter(r=>!['draft','sent'].includes(r.status)).length;
    if(entry.id==='exported')return shared.exportedEntries().length;
    if(!foldersReady)return entry.id==='draft'?savedCache.filter(r=>r.status==='draft').length+'+':'–';
    const localDrafts=entry.id==='draft'?savedCache.filter(r=>r.status==='draft').length:0;
    if(totals.has(entry.id))return totals.get(entry.id)+localDrafts;
    if(entry.remote)return localDrafts?localDrafts+'+':'–';
    if(entry.id==='sent')return savedCache.filter(r=>r.status==='sent').length;
    return localDrafts;
  }
  function leaveAll() {
    if (!allMode) return;
    allMode = false; lastAccount = ""; window.PBMailIndex?.unmount?.(); renewVisible();
  }
  async function enterAll(asked = false) {
    if (!asked && !leave()) return;
    allMode = true; choice(ALL);
    accountSelect.value = ALL;
    if (lastAccount !== ALL) { lastAccount = ALL; viewKey = "inbox"; }
    renewVisible();
    if (native) switchMode(true);
    await loadAllFolders();
    if (!PBMailIndex.synced()) startAllSync();
  }
  /** Fetches all accounts into the index in the background; the list follows by itself when it is done. */
  function startAllSync() {
    if (!PBMailIndex.running()) void PBMailIndex.sync(false).catch(() => {});
    notice.textContent = T("allAccounts") + " · " + T("allRunning");
  }
  async function savedAll() {
    const out = [];
    for (const a of accounts) { try { for (const r of await native.saved(a.id)) out.push({ ...r, account: a.id }); } catch { /* this account's local records are unreadable right now */ } }
    return out;
  }
  async function loadAllFolders() {
    draft = null; dirty = false; endChecks();
    current = null; mail = null; items = []; validity = ""; next = null; selected.clear(); filterText = "";
    PBMailIndex.unmount(); list.replaceChildren(); reader.replaceChildren(el("p", "mail-muted", S("choose")));
    accountTools.querySelector("[data-live-text=catalog]").disabled = true;
    allFolders = PBMailIndex.folderInfo();
    savedCache = await savedAll();
    const known = accounts.filter((a) => allFolders[a.id]);
    const roleCount = (role) => { let sum = null; for (const a of known) for (const f of allFolders[a.id].list) if (f.role === role && Number.isSafeInteger(f.total)) sum = (sum || 0) + f.total; return sum; };
    totals.clear();
    entries = shared.standard.map((id) => ({ id, name: S(id), path: "@all:" + id, remote: known.some((a) => allFolders[a.id].list.some((f) => f.role === id)) }));
    for (const e of entries) { const n = roleCount(e.id); if (n != null) totals.set(e.id, n); }
    for (const a of known) for (const f of allFolders[a.id].list) {
      if (f.role || f.collection) continue;
      const id = "provider:" + a.id + "\n" + f.path;
      entries.push({ id, name: a.email + " · " + f.name, path: "@acc:" + a.id + "\n" + f.path, remote: true, account: a.id, real: f.path });
      if (Number.isSafeInteger(f.total)) totals.set(id, f.total);
    }
    foldersReady = true;
    if (!entries.some((e) => e.id === viewKey) && !String(viewKey).startsWith("tool:")) viewKey = "inbox";
    folder = entries.find((e) => e.id === viewKey)?.path || "@all:inbox";
    drawFolders();
    if (String(viewKey).startsWith("tool:")) return showTool(viewKey.slice(5));
    await loadList();
  }
  /** Turns one place of the index into a row of the list. */
  function placeItem({ rec, loc }) {
    const files = rec.mailFiles || [];
    return { uid: loc.uid, account: loc.account, email: loc.email, folder: loc.folder, validity: loc.validity, role: loc.role || "",
      subject: rec.name || "", from: rec.mail?.from || "", date: rec.date || "", hash: rec.hash, messageId: rec.mailMessageId || "",
      flags: [...(rec.mailSeen ? ["\\Seen"] : []), ...(rec.mailFlagged ? ["\\Flagged"] : [])], files, attachments: Boolean(rec.mailHasAttachments || files.length),
      size: files.reduce((n, f) => n + (f.size || 0), 0) };
  }
  async function loadAllList(more = false) {
    endChecks();
    if (more) { shownCount += PAGE_SHOW; drawList(); prefetch(); return; }
    current = null; mail = null; selected.clear(); filterText = ""; shownCount = PAGE_SHOW; app.dataset.view = "list";
    PBMailIndex.unmount(); list.replaceChildren(); reader.replaceChildren(el("p", "mail-muted", S("choose")));
    const entry = entries.find((e) => e.id === viewKey);
    if (["outbox", "draft", "sent"].includes(viewKey)) savedCache = await savedAll();
    if (viewKey === "exported") items = shared.exportedEntries().map((r) => ({ uid: r.hash, local: true, subject: r.name, from: r.mail.from || "", flags: r.mailRead ? ["\\Seen"] : [], date: r.date }));
    else if (viewKey === "outbox" || !entry) items = [];
    else items = PBMailIndex.places(entry.account ? { account: entry.account, path: entry.real } : { role: entry.id }).map(placeItem);
    validity = ""; next = null;
    notice.textContent = T("allAccounts") + " · " + (entry?.name || "") + (PBMailIndex.synced() ? "" : " · " + T("allNotYet"));
    drawFolders(); drawList();
    list.scrollTop = 0; listPlace = 0;
    prefetch();
  }
  /** „Nach Absender“ and „Aufräumen“ of the index stand in the list pane, the opened mail on the right. */
  function showTool(mode) {
    current = null; mail = null; selected.clear(); items = []; app.dataset.view = "list";
    reader.replaceChildren(el("p", "mail-muted", S("choose")));
    notice.textContent = T("allAccounts") + " · " + T(mode === "clean" ? "allClean" : "allSenders");
    PBMailIndex.mount(list, mode);
  }
  /** One move target for one account: a role ("@role:spam") or a folder of exactly this account ("@acc:<id>\n<path>"). */
  function resolveTarget(acc, target) {
    if (target.startsWith("@role:")) return (allFolders[acc]?.list || []).find((f) => f.role === target.slice(6))?.path || null;
    if (target.startsWith("@acc:")) { const at = target.indexOf("\n"); return target.slice(5, at) === acc ? target.slice(at + 1) : null; }
    return null;
  }
  /** Mails of several accounts: one call (and one connection) per account and folder, as in the single account. */
  async function allBatch(type, target) {
    const chosen = items.filter((item) => !item.local && selected.has(keyOf(item)));
    if (!chosen.length) return;
    if (!leave() || (type === "delete" && !confirm(T("remove") + " (" + chosen.length + ")?"))) return;
    const groups = new Map();
    for (const item of chosen) { const k = item.account + "\n" + item.folder + "\n" + item.validity; if (!groups.has(k)) groups.set(k, []); groups.get(k).push(item); }
    const done = [], touched = new Set();
    let failed = null, skipped = 0;
    for (const group of groups.values()) {
      const { account: acc, folder: from, validity: val } = group[0];
      const dest = type === "move" ? resolveTarget(acc, target) : null;
      if (type === "move" && (!dest || dest === from)) { skipped += group.length; continue; }
      try {
        for (let i = 0; i < group.length; i += 200) {
          const part = group.slice(i, i + 200);
          await api("/" + encodeURIComponent(acc) + "/messages/batch/action", { folder: from, validity: val, action: type, uids: part.map((x) => x.uid), ...(dest ? { target: dest } : {}) });
          done.push(...part);
        }
        touched.add(acc);
      } catch (error) { failed = error; }
    }
    if (done.length) await PBMailIndex.forget(done.map((x) => ({ account: x.account, folder: x.folder, uid: x.uid })));
    if (touched.size) void PBMailIndex.sync(true, [...touched]).catch(() => {}); // the new places on the server
    await loadList();
    if (skipped) notice.textContent += " · " + skipped + " " + T("allSkipped");
    if (failed) throw failed;
  }
  /** The opened mail works exactly like in its own account: its folders, roles and validity. */
  function useItemAccount(item) {
    account = item.account; folder = item.folder; validity = item.validity;
    folders = (allFolders[account]?.list || []).map((f) => ({ ...f }));
    folderMap = PBMailFolders.resolve(folders).roles;
  }
  // Klaus 22.11.2026: die Mails der gezeigten Seite werden samt Anhängen gleich im Hintergrund geholt – einzeln, nacheinander,
  // erst nach einer kleinen Pause (keine Wartepunkte nach einem Tipp). Mit Speicherort landen sie dort verschlüsselt; sonst
  // liegen höchstens 30 im Arbeitsspeicher. Gelesen wird nur (der Ordner ist schreibgeschützt geöffnet), nichts gilt als gelesen.
  const PREFETCH_MAX = 20 * 1024 * 1024, prefetched = new Map();
  let prefetchRound = 0;
  const placeKey = (acc, f, val, uid) => acc + "\n" + f + "\n" + val + "\n" + uid;
  async function prefetch() {
    // Proben schalten das Vorausladen ab, wenn sie die Aufrufe an den Anbieter genau zählen (window.pbMailPrefetch = false).
    if (!native || window.pbMailPrefetch === false) return;
    const round = ++prefetchRound;
    await new Promise((r) => setTimeout(r, 2500));
    const page = items.filter((i) => !i.local).slice(0, shownCount);
    const at = { account, folder, validity };
    for (const item of page) {
      if (round !== prefetchRound || app.hidden || document.visibilityState !== "visible") return;
      const ctx = allMode ? item : at;
      const k = placeKey(ctx.account, ctx.folder, ctx.validity, item.uid);
      if (prefetched.has(k) || (item.size && item.size > PREFETCH_MAX)) continue;
      try {
        const data = await api("/" + encodeURIComponent(ctx.account) + "/messages/" + item.uid + "?folder=" + encodeURIComponent(ctx.folder) + "&validity=" + encodeURIComponent(ctx.validity));
        if (round !== prefetchRound) return;
        prefetched.set(k, data);
        while (prefetched.size > 30) prefetched.delete(prefetched.keys().next().value);
      } catch { return; } // offline, account gone …: no further tries in this round
    }
  }
  async function loadFolders() {
    if (!leave()) return;
    if (allMode) return loadAllFolders();
    draft=null; dirty=false; endChecks();
    if(native){current=null;mail=null;items=[];validity='';next=null;selected.clear();list.replaceChildren();reader.replaceChildren(el('p','mail-muted',S('choose')));accountTools.querySelector('[data-live-text=catalog]').disabled=true;}
    if(native&&lastAccount!==account) {
      // Clear account-bound server state before the first await, including failure paths.
      lastAccount=account;viewKey='inbox';folder='INBOX';folders=[];savedCache=[];foldersReady=false;
      totals.clear();selected.clear();folderMap.clear();entries=[];items=[];current=null;mail=null;validity='';next=null;filterText='';
      nav.replaceChildren();list.replaceChildren();reader.replaceChildren(el('p','mail-muted',S('choose')));
      notice.textContent=accounts.find(a=>a.id===account)?.email||'';app.dataset.view='list';
      accountTools.querySelector('[data-live-text=catalog]').disabled=true;
      savedCache=await native.saved(account);updateEntries();drawFolders();
    }
    folders=await api(prefix()+'/folders');
    if(native) {
      foldersReady=true;
      savedCache=await native.saved(account); updateEntries(); serverTotals();
      const entry=entries.find(e=>e.id===viewKey)||entries[0];viewKey=entry.id;folder=entry.path;
    } else if(!folders.some(f=>f.path===folder))folder=folders.find(f=>f.path==='INBOX')?.path||folders[0]?.path||'INBOX';
    drawFolders();await loadList();
  }
  // Klaus 2026-10-22: the numbers next to the folders come from the server (IMAP STATUS), for every folder,
  // so a mail moved to the trash or to spam - here or elsewhere - shows up there at once.
  function serverTotals() {
    for (const entry of entries) {
      const f = folders.find(x => x.path === entry.path);
      if (f && Number.isSafeInteger(f.total) && f.total >= 0) totals.set(entry.id, f.total);
    }
  }
  async function refreshCounts() {
    if (!native || allMode) return;
    try { folders = await api(prefix() + '/folders'); updateEntries(); serverTotals(); drawFolders(); } catch { /* the list itself is already fresh */ }
  }
  function drawFolders() {
    if (native) {
      nav.replaceChildren();
      const overview=allMode?null:window.PBMailIndex?.entry?.();if(overview)nav.append(overview);
      // Klaus 2026-10-22: providers differ (Google has many more folders than Telekom). The standard folders stay the
      // same for every account; the provider's own folders sit below under "Weitere Ordner", closed by default.
      const own=entries.filter(entry=>entry.id.startsWith('provider:'));
      let moreOpen=false;try{moreOpen=localStorage.getItem('pb_mail_more_open')==='1';}catch{}
      if(own.some(entry=>entry.id===viewKey))moreOpen=true;
      for(const entry of entries) {
        if(entry===own[0]){
          const more=el('button','mail-button mail-more-folders',(moreOpen?'▾ ':'▸ ')+T('moreFolders')+' ('+own.length+')');more.type='button';
          more.dataset.liveMore='1';more.setAttribute('aria-expanded',String(moreOpen));
          more.onclick=()=>{try{localStorage.setItem('pb_mail_more_open',moreOpen?'0':'1');}catch{}drawFolders();};
          nav.append(more);
        }
        if(own.includes(entry)&&!moreOpen)continue;
        const view=folders.find(f=>f.path===entry.path)?.collection;
        const button=shared.folderButton(entry.id,entry.name+(view?' · '+T('viewOnly'):''),folderCount(entry),viewKey===entry.id,()=>run(async()=>{
          if(!leave())return;dirty=false;draft=null;viewKey=entry.id;folder=entry.path;drawFolders();await loadList();
        }));
        button.dataset.liveFolder=entry.path;if(view){button.dataset.collection='1';button.title=T('viewHint');}nav.append(button);
      }
      if(allMode){
        // Klaus 22.11.2026: die Werkzeuge der bisherigen Seite „Alle Konten“ stehen unten in der Ordnerspalte.
        const group=el('p','mail-folder-group',T('allTools'));group.dataset.liveText='allTools';nav.append(group);
        for(const mode of ['senders','clean']){
          const id='tool:'+mode,count=PBMailIndex.count(mode);
          const tool=shared.folderButton(id,T(mode==='clean'?'allClean':'allSenders'),count||'',viewKey===id,()=>run(async()=>{
            if(!leave())return;dirty=false;draft=null;endChecks();viewKey=id;drawFolders();showTool(mode);
          }));
          tool.dataset.mailTool=mode;nav.append(tool);
        }
        return;
      }
      const button=btn('folder',async()=>{const name=window.PBTextPrompt?await PBTextPrompt.ask(T('folder')):prompt(T('folder'));if(name){await api(prefix()+'/folders',{name});await loadFolders();}});
      nav.append(button);return;
    }
    nav.replaceChildren();
    for (const f of folders) {
      const b = btn("remote", async () => {
        if (!leave()) return;
        dirty = false;
        draft = null;
        folder = f.path;
        drawFolders();
        await loadList();
      });
      b.textContent = f.name;
      delete b.dataset.liveText;
      b.dataset.liveFolder = f.path;
      b.classList.add("mail-folder");
      b.setAttribute("aria-current", String(folder === f.path));
      nav.append(b);
    }
    nav.append(
      btn("folder", async () => {
        const name = window.PBTextPrompt ? await PBTextPrompt.ask(T("folder")) : prompt(T("folder"));
        if (name) {
          await api(prefix() + "/folders", { name });
          await loadFolders();
        }
      }),
    );
  }
  async function loadList(more = false) {
    if (allMode) return loadAllList(more);
    endChecks();
    if (native && more && shownCount < items.length) { shownCount += PAGE_SHOW; drawList(); prefetch(); return; }
    if (native) shownCount = more ? shownCount + PAGE_SHOW : PAGE_SHOW;
    if(native&&!more){current=null;mail=null;items=[];validity='';selected.clear();list.replaceChildren();reader.replaceChildren(el('p','mail-muted',S('choose')));}
    if(native&&!foldersReady&&!['outbox','draft','exported'].includes(viewKey))throw new Error(T('foldersUnavailable'));
    let page;
    if(native && !entries.find(entry=>entry.id===viewKey)?.remote) {
      page={validity:'',items:[],next:null,total:0};
      savedCache=await native.saved(account);
      if(viewKey==='exported')page.items=shared.exportedEntries().map(r=>({uid:r.hash,local:true,subject:r.name,from:r.mail.from||'',flags:r.mailRead?['\\Seen']:[],date:r.date}));
    } else page=await api(prefix()+'/messages?folder='+encodeURIComponent(folder)+(more&&next?'&before='+next:''));
    validity=page.validity;items=more?[...items,...page.items]:page.items;next=page.next;current=null;mail=null;
    selected.clear();filterText='';app.dataset.view='list';
    reader.replaceChildren(...(native?[el('p','mail-muted',S('choose'))]:[]));
    notice.textContent=accounts.find(a=>a.id===account)?.email+' · '+(native?folderTitle(folder):folder);
    if(native) {
      if(Number.isSafeInteger(page.total)&&page.total>=0)totals.set(viewKey,page.total);
      if(!entries.find(entry=>entry.id===viewKey)?.remote&&!['outbox','draft','sent','exported'].includes(viewKey))notice.textContent+=' · '+T('folderUnavailable');
      drawFolders();
    }
    const place=list.scrollTop;
    if(native)famProbe(true);
    drawList();
    // Ein Ordnerwechsel beginnt oben; „Weitere laden“ bleibt, wo es war.
    list.scrollTop=more?place:0;listPlace=list.scrollTop;
    if(native)accountTools.querySelector('[data-live-text=catalog]').disabled=!entries.find(e=>e.id===viewKey)?.remote||!items.length;
    if(native)prefetch();
  }
  async function batchAction(type,target) {
    if(allMode)return allBatch(type,target);
    const chosen=items.filter(item=>!item.local&&selected.has(item.uid));if(!chosen.length)return;
    if(!leave()||(type==='delete'&&!confirm(T('remove')+' ('+chosen.length+')?')))return;
    const context={account,folder,validity};let failed=null;
    try{
      // On the device: all chosen mails in one call and one connection (in steps of 200), not one login per mail.
      if(native)for(let i=0;i<chosen.length;i+=200)await api('/'+encodeURIComponent(context.account)+'/messages/batch/action',{folder:context.folder,validity:context.validity,action:type,uids:chosen.slice(i,i+200).map(item=>item.uid),...(target?{target}:{})});
      else for(const item of chosen)await api('/'+encodeURIComponent(context.account)+'/messages/'+item.uid+'/action',{folder:context.folder,validity:context.validity,action:type,...(target?{target}:{})});
    }
    catch(error){failed=error;}
    finally{await loadList();await refreshCounts();}
    if(failed)throw failed;
  }
  // Klaus 16.11.2026: die Liste bleibt beim Neuzeichnen an ihrer Stelle; nur ein Ordnerwechsel (loadList) beginnt oben.
  let listPlace = 0;
  /** The opened row stays fully inside the list. Only the list itself is moved, never the page. */
  function showCurrentRow() {
    const row = list.querySelector('[data-live-uid][aria-current="true"]')?.closest(".mail-item");
    if (!row || !list.clientHeight) return;
    const frame = list.getBoundingClientRect(), box = row.getBoundingClientRect();
    if (box.top < frame.top) list.scrollTop -= frame.top - box.top;
    else if (box.bottom > frame.bottom) list.scrollTop += Math.min(box.bottom - frame.bottom, box.top - frame.top);
    listPlace = list.scrollTop;
  }
  /** Back from a mail on a narrow screen: the list was hidden meanwhile and stands where it was again. */
  function backToList() {
    app.dataset.view = "list";
    list.scrollTop = listPlace;
    showCurrentRow();
  }
  function drawNativeList() {
    if (allMode && String(viewKey).startsWith("tool:")) return; // the index draws its own tool there
    const place = list.scrollTop;
    list.replaceChildren();
    const search=el('input');search.type='search';search.placeholder=S('filter');search.setAttribute('aria-label',S('filter'));search.value=filterText;
    const actions=el('div','mail-list-actions'), rows=el('div'), count=el('p','mail-count');
    const all=el('button','mail-button',S('all')), trash=el('button','mail-button',S('delete')), move=el('select');
    // „An Familienakte“: nur mit Pro-Tresor sichtbar; das Liniensymbol setzt native-toolbar.js, der Name steht in title/aria-label.
    const fam=el('button','mail-button',T('familienakteList'));fam.type='button';fam.dataset.nativeSelection='familienakte';fam.hidden=!famVault;fam.onclick=()=>run(batchFamilienakte);famProbe();
    all.type=trash.type='button';all.disabled=!items.some(item=>!item.local);all.dataset.nativeSelection='all';trash.dataset.nativeSelection='trash';
    move.setAttribute('aria-label',S('move'));
    if(allMode){
      // Mehrere Konten: die gemeinsamen Ordner nach ihrer Rolle; die eigenen Ordner eines Anbieters gelten nur für Mails seines Kontos.
      move.append(new Option(S('move'),''),...['inbox','archive','spam','trash'].filter(r=>r!==viewKey).map(r=>new Option(S(r),'@role:'+r)),
        ...entries.filter(e=>e.account&&e.id!==viewKey).map(e=>new Option(e.name,'@acc:'+e.account+'\n'+e.real)));
    } else move.append(new Option(S('move'),''),...folders.filter(f=>f.path!==folder).map(f=>new Option(folderTitle(f.path),f.path)));
    const filtered=()=>items.filter(item=>(item.subject+' '+item.from+' '+(item.email||'')).toLocaleLowerCase().includes(filterText.toLocaleLowerCase()));
    const page=()=>filtered().slice(0,shownCount);
    const isTrash=allMode?viewKey==='trash':folderMap.get('trash')?.path===folder, trashFolder=allMode?{path:'@role:trash'}:folderMap.get('trash');
    const isSpam=allMode?viewKey==='spam':folderMap.get('spam')?.path===folder, spamFolder=allMode?{path:'@role:spam'}:folderMap.get('spam'), inbox=allMode?'@role:inbox':folderMap.get('inbox')?.path||'INBOX';
    if(isTrash)trash.textContent=T('remove');
    // In the trash: put back into the inbox; in spam: "not spam"; elsewhere: mark as spam (Klaus 2026-10-22).
    const back=el('button','mail-button',T(isTrash?'restore':isSpam?'notSpam':'spam'));back.type='button';back.dataset.nativeSelection=isTrash?'restore':isSpam?'notspam':'spam';
    const backTarget=isTrash||isSpam?inbox:spamFolder?.path;
    back.hidden=!backTarget||backTarget===folder;
    back.onclick=()=>run(()=>batchAction('move',backTarget));
    function selection(){count.textContent=selected.size+' '+S('selected');trash.disabled=!selected.size||(isTrash?false:!trashFolder);back.disabled=!selected.size;fam.disabled=!selected.size;move.disabled=!selected.size;}
    all.onclick=()=>{const candidates=page().filter(item=>!item.local),on=candidates.some(item=>!selected.has(keyOf(item)));for(const item of candidates)on?selected.add(keyOf(item)):selected.delete(keyOf(item));drawNativeList();};
    trash.onclick=()=>run(()=>batchAction(isTrash?'delete':'move',isTrash?null:trashFolder.path));
    move.onchange=()=>{const target=move.value;move.value='';if(target)run(()=>batchAction('move',target));};
    function drawRows(){
      rows.replaceChildren();
      for(const record of historyRows().filter(record=>(record.subject+' '+record.to).toLocaleLowerCase().includes(filterText.toLocaleLowerCase())).slice(0,shownCount)) {
        const row=el('div','mail-item'), button=el('button');button.type='button';button.dataset.nativeSaved=record.id;
        const status=el('span','mail-preview',T(record.status==='draft'?'draftStatus':record.status));status.dataset.nativeStatus=record.status==='draft'?'draftStatus':record.status;
        button.append(el('span','mail-avatar','✉'),el('span','mail-subject',record.subject),status);button.onclick=()=>run(()=>showSavedRecord(record));row.append(el('span'),button);rows.append(row);
      }
      for(const item of page()) {
        const row=el('div','mail-item'+(!item.flags.includes('\\Seen')?' unread':'')),check=el('input'),button=el('button');
        check.type='checkbox';check.checked=selected.has(keyOf(item));check.disabled=Boolean(item.local);check.setAttribute('aria-label',item.subject);
        check.onchange=()=>{check.checked?selected.add(keyOf(item)):selected.delete(keyOf(item));selection();};
        button.type='button';button.dataset.liveUid=item.uid;button.setAttribute('aria-current',String(Boolean(current)&&keyOf(current)===keyOf(item)));
        const preview=el('span','mail-preview',item.from);
        if(allMode&&!item.local){
          // Jede Mail trägt ihr Konto: Farbpunkt und Adresse; dazu, wie viele Anhänge sie hat.
          button.dataset.liveAccount=item.account;
          const dot=el('i','mail-account-dot');dot.style.background=dotColor(item.account);dot.setAttribute('aria-hidden','true');
          const tag=el('span','mail-account-tag');tag.append(dot,item.email||'');
          if(item.attachments){const n=item.files.length;const f=el('span','mail-files',' · '+(n?n+' ':'')+T(n===1?'files':'filesMany'));f.title=item.files.map(x=>x.name).filter(Boolean).join(', ');tag.append(f);}
          preview.append(tag);
        }
        button.append(el('span','mail-avatar',(item.from||item.subject||'?').slice(0,1).toUpperCase()),el('span','mail-subject',(item.flags.includes('\\Flagged')?'★ ':'')+item.subject),preview,el('time','mail-date',item.date?new Date(item.date).toLocaleString(document.documentElement.lang,{dateStyle:'short',timeStyle:'short'}):''));
        button.onclick=()=>run(async()=>{if(item.local){if(!leave())return;switchMode(false);await shared.openMessage(item.uid);}else{selected.clear();await open(item);}});
        row.append(check,button);rows.append(row);
      }
      if(!rows.childElementCount)rows.append(el('p','mail-muted',S('empty')));
    }
    // Klaus 22.11.2026: „Weitere laden“ zeigt die nächsten Mails; erst wenn alle geladenen zu sehen sind, fragt es den Server.
    const moreButton=()=>{list.querySelector(':scope>[data-live-text=more]')?.remove();if(next||filtered().length>shownCount||historyRows().length>shownCount)list.append(btn('more',()=>loadList(true)));};
    search.oninput=()=>{filterText=search.value;selected.clear();drawRows();selection();moreButton();};
    actions.append(all,trash,back,fam,move);list.append(search,actions,count,rows);drawRows();selection();
    moreButton();
    list.scrollTop=place;
  }
  async function showSavedRecord(record) {
    if(!leave())return;dirty=false;draft=null;app.dataset.view='reader';
    const status=el('p','',T(record.status==='draft'?'draftStatus':record.status));status.dataset.nativeStatus=record.status==='draft'?'draftStatus':record.status;
    reader.replaceChildren(btn('back',()=>{app.dataset.view='list';}),el('h3','',record.subject),el('p','mail-muted',record.to),status);
    if(['draft','queued'].includes(record.status))reader.append(btn('restore',async()=>{if(record.account)account=record.account;compose(await native.savedDraft(account,record.id));}));
  }
  function drawList() {
    if (native) return drawNativeList();
    const place = list.scrollTop;
    list.replaceChildren();
    const filter = el("input");
    filter.type = "search";
    filter.placeholder = T("filter");
    filter.setAttribute("aria-label", T("filter"));
    const rows = el("div");
    filter.oninput = () => {
      for (const row of rows.children)
        row.hidden = !row.textContent
          .toLowerCase()
          .includes(filter.value.toLowerCase());
    };
    list.append(filter, btn("catalog", catalogPage));
    for (const item of items) {
      const row = el(
          "div",
          "mail-item" + (!item.flags.includes("\\Seen") ? " unread" : ""),
        ),
        b = btn("remote", () => open(item));
      b.replaceChildren(
        el("strong", "mail-subject", (item.flags.includes("\\Flagged") ? "★ " : "") + item.subject),
        el("span", "mail-preview", item.from),
        el("time", "mail-date", item.date ? new Date(item.date).toLocaleString(document.documentElement.lang, {dateStyle:"short", timeStyle:"short"}) : ""),
      );
      delete b.dataset.liveText;
      b.dataset.liveUid = item.uid;
      row.style.display = "block";
      row.append(b);
      rows.append(row);
    }
    list.append(rows);
    if (next) list.append(btn("more", () => loadList(true)));
    list.scrollTop = place;
  }
  // Klaus 16.11.2026: Mails aus der Liste an die Familienakte, ohne sie zu öffnen. Jede wird wie beim Öffnen vom Anbieter geholt,
  // ihre Anhänge werden geprüft (dieselbe Regel wie beim Knopf in der geöffneten Mail), dann geht die .eml samt Vorsortierung
  // über den Pro-Tresor. Der Tresor wird einmal gefragt, nicht je Mail; was schon übergeben ist, wird nicht noch einmal geschickt.
  const FAM_MAX = 20;
  let famVault = false, famProbed = 0;
  function famProbe(force) {
    if (!native?.familienakteTresor || (!force && Date.now() - famProbed < 2000)) return;
    famProbed = Date.now();
    native.familienakteTresor().then((z) => {
      famVault = z?.vorhanden === true;
      const b = list.querySelector('[data-native-selection="familienakte"]');
      if (b) b.hidden = !famVault;
    }, () => {});
  }
  const fill = (key, values) => T(key).replace(/\{(\w)\}/g, (_, k) => String(values[k]));
  const emlNameOf = (subject) =>
    ((subject || "mail").replace(/[\\/:*?"<>|\x00-\x1f]/g, "_").trim().slice(0, 80) || "mail") + ".eml";
  const messageAt = (at) =>
    api("/" + encodeURIComponent(at.account) + "/messages/" + at.uid + "?folder=" + encodeURIComponent(at.folder) + "&validity=" + encodeURIComponent(at.validity));
  /** The whole mail of one provider place; a renumbered folder is found again by the Message-ID. */
  async function fetchAt(ref) {
    let at = { account: ref.account, folder: ref.folder, validity: ref.validity, uid: ref.uid };
    try { return { at, data: await messageAt(at) }; }
    catch (error) {
      const found = ref.messageId && native.locate ? await native.locate({ account: ref.account, folder: ref.folder, messageId: ref.messageId }) : null;
      if (!found?.uid) throw error;
      at = { ...at, validity: found.validity, uid: found.uid };
      return { at, data: await messageAt(at) };
    }
  }
  /** refs: [{account, folder, validity, uid, messageId?, date?}] → numbers and one sentence (text). */
  async function handToFamilienakte(refs) {
    const n = refs.length, sum = { n, uebergeben: 0, schon: 0, ohneSortierung: 0, befund: 0, fehler: 0, gruende: {}, offen: [], text: "" };
    if (!n) return sum;
    if (n > FAM_MAX) { sum.zuViele = true; sum.text = fill("famMax", { n }); return sum; }
    if (!native?.familienakteOeffnen || !(await native.familienakteOeffnen())) { sum.geschlossen = true; sum.text = T("famClosed"); return sum; }
    let i = 0, locked = false;
    // offen: die Mails, die nicht übergeben wurden – die Liste lässt genau sie markiert.
    const failed = (grund) => { sum.fehler++; sum.gruende[grund] = (sum.gruende[grund] || 0) + 1; sum.offen.push(refs[i]); };
    const job = window.PBActivity?.start({ label: () => fill("famProgress", { i: Math.min(i + 1, n), n }), percent: () => (i / n) * 100 });
    try {
      await job?.ready;
      for (const ref of refs) {
        job?.update({});
        if (locked) { failed("gesperrt"); i++; continue; }
        let got = null;
        try { got = await fetchAt(ref); } catch { failed("laden"); i++; continue; }
        const data = got.data;
        let risky = false, result = null;
        try {
          result = await native.shareFamilienakte(got.at, {
            name: emlNameOf(data.subject),
            sourceBase64: data.sourceBase64 || "",
            mail: { from: data.from || "", subject: data.subject || "", date: data.date || ref.date || "", text: data.text || "" },
            still: true,
            // Only for a mail that really goes out; an error in the check keeps the mail here.
            pruefen: async () => { risky = await checkAttachments(data, el("div")); return true; },
          });
        } catch { result = null; }
        if (result?.ergebnis === "uebergeben") {
          sum.uebergeben++;
          if (result.begleit === "nein") sum.ohneSortierung++;
          if (risky) sum.befund++;
        } else if (result?.ergebnis === "schon") sum.schon++;
        else {
          failed(result?.grund || "fehler");
          if (result?.grund === "gesperrt") locked = true;
        }
        i++;
      }
    } finally { job?.finish(); }
    const why = { laden: "famWhyLoad", zuGross: "famWhyLarge", ungeprueft: "famWhyCheck", gesperrt: "famWhyVault" };
    sum.text = [
      fill("famDone", { a: sum.uebergeben, n }),
      sum.schon ? fill("famKnown", { s: sum.schon }) : "",
      sum.ohneSortierung ? fill("famNoSort", { v: sum.ohneSortierung }) : "",
      sum.befund ? fill("famFindings", { r: sum.befund }) : "",
      sum.fehler ? fill("famFailed", { f: sum.fehler }) + " (" + Object.entries(sum.gruende).map(([g, c]) => c + " " + T(why[g] || "famWhyOther")).join(", ") + ")." : "",
    ].filter(Boolean).join(" ");
    return sum;
  }
  async function batchFamilienakte() {
    const chosen = items.filter((item) => !item.local && selected.has(item.uid));
    if (!chosen.length) return;
    const sum = await handToFamilienakte(chosen.map((item) => ({ account, folder, validity, uid: item.uid, date: item.date })));
    // Generalprüfung 16.11.2026: das Ergebnis steht einmal da (Hinweiszeile über der Liste, nicht zusätzlich als Fenster zum
    // Wegtippen). Was nicht übergeben wurde, bleibt markiert – ein zweiter Tipp auf „An Familienakte“ genügt.
    notice.textContent = sum.text;
    notice.dataset.mailResult = sum.fehler || sum.zuViele || sum.geschlossen ? "offen" : "fertig";
    if (!sum.zuViele && !sum.geschlossen) {
      const open = new Set(sum.offen.map((ref) => ref.uid));
      for (const uid of [...selected]) if (!open.has(uid)) selected.delete(uid);
      drawNativeList();
    }
    notice.scrollIntoView?.({ block: "nearest" });
  }
  async function fetchMail(item) {
    const k = placeKey(account, folder, validity, item.uid);
    if (prefetched.has(k)) { const data = prefetched.get(k); prefetched.delete(k); return data; }
    return api(prefix() + "/messages/" + item.uid + query());
  }
  async function catalogOne(data, item) {
    const msg = PBMail.parseEml(data.raw);
    msg.body = data.text;
    await PBMail.addEntry(msg, null);
    const key =
      (msg.from || "") +
      "|" +
      (msg.subject || "") +
      "|" +
      (msg.date || "") +
      "|" +
      (msg.body || "").slice(0, 4000);
    const hash = await sha256(new TextEncoder().encode(key).buffer);
    const rec = CATALOG.find((r) => r.hash === hash);
    if (rec && item) {
      rec.mailRemote = { base, account, folder, validity, uid: item.uid };
      await idbPut("catalog", rec);
    }
    rebuildIndex();
    refreshAll();
  }
  async function catalogPage() {
    if (!confirm(items.length + " · " + T("catalogConfirm"))) return;
    for (const item of items) await catalogOne(await fetchMail(item), item);
    notice.textContent = "✓ " + items.length + " · " + T("catalog");
  }
  async function action(type, target) {
    await api(prefix() + "/messages/" + current.uid + "/action", {
      folder,
      validity,
      action: type,
      target,
    });
    if (allMode && (type === "move" || type === "delete")) {
      await PBMailIndex.forget([{ account, folder, uid: current.uid }]);
      void PBMailIndex.sync(true, [account]).catch(() => {});
    }
    await loadList();
    await refreshCounts();
  }
  // Generalprüfung 16.11.2026: Stern und Gelesen/ungelesen lassen die Mail offen. Nur ihre Zeile in der Liste und die beiden
  // Knöpfe ändern sich; die Liste wird nicht neu geholt (Suchwort, Häkchen und nachgeladene Mails bleiben).
  let relabelFlags = null;
  async function flag(item, type) {
    await api(prefix() + "/messages/" + item.uid + "/action", { folder, validity, action: type });
    if (allMode) await PBMailIndex.setFlags(account, folder, item.uid, type === "read" || type === "unread" ? { seen: type === "read" } : { flagged: type === "star" });
    const name = type === "read" || type === "unread" ? "\\Seen" : "\\Flagged";
    item.flags = type === "read" || type === "star" ? [...new Set([...item.flags, name])] : item.flags.filter((f) => f !== name);
    const row = [...list.querySelectorAll("[data-live-uid]")].find((b) => b.dataset.liveUid === String(item.uid));
    if (row) {
      row.closest(".mail-item")?.classList.toggle("unread", !item.flags.includes("\\Seen"));
      const subject = row.querySelector(".mail-subject");
      if (subject) subject.textContent = (item.flags.includes("\\Flagged") ? "★ " : "") + item.subject;
    }
    relabelFlags?.();
  }
  function attachmentBytes(a) {
    return Uint8Array.from(atob(a.data), (c) => c.charCodeAt(0));
  }
  /** Rule check of the message itself: fast, no reading of attachments. Returns true when something was found. */
  function checkText(data, container) {
    container.replaceChildren(
      el("strong", "", T("check")),
      el("p", "", T("limit")),
    );
    let risky = false;
    const report = window.PrueferMail?.pruefeMail(
      data.raw ||
        "From: " +
          (accounts.find((a) => a.id === account)?.email || "") +
          "\nTo: " +
          (data.to || "") +
          "\nSubject: " +
          (data.subject || "") +
          "\n\n" +
          data.text,
    );
    if (!report) risky = true;
    for (const finding of report?.stellen || []) {
      risky = true;
      container.append(el("p", "", finding.kennung + " · " + finding.satz));
    }
    return risky;
  }
  /** One attachment: its report lines and whether it counts as risky (findings, unchecked parts, check failed). */
  async function checkAttachment(a) {
    const lines = [];
    let risky = false;
    // Android folder mode: the bytes stay encrypted in the chosen folder, not in this page.
    if (!a.data && window.PBVault) {
      // 🛡 Klaus 2026-10-22: attachments in the folder are checked too (native/native-check.js).
      const checked = window.PBCheck && a.stored && a.ref ? await PBCheck.checkVault(a).catch(() => null) : null;
      if (!checked) return { risky: true, lines: [el("p", "", a.name + " · " + PBVault.uncheckedText())] };
      if (checked.funde.length || checked.ungeprueft) risky = true;
      return { risky, lines: [PBCheck.line(a.name, checked, a)] };
    }
    let result;
    try {
      const bytes = attachmentBytes(a);
      result = await (window.PBOCR
        ? PBOCR.analyze(a.name, bytes)
        : PrueferAnhang.pruefe(a.name, bytes));
    } catch {
      risky = true;
    }
    if (
      !result ||
      result.befunde.length ||
      result.textUngeprueft ||
      result.bildUngeprueft
    )
      risky = true;
    lines.push(
      el(
        "p",
        "",
        a.name +
          " · " +
          (result?.befunde
            .map((f) => f.kennung + ": " + f.satz)
            .join(" · ") || "–"),
      ),
    );
    for (const hint of result?.hinweise || []) lines.push(el("p", "", hint));
    if (result?.textUngeprueft || result?.bildUngeprueft)
      lines.push(el("p", "", result.ungeprueftSatz || T("limit")));
    return { risky, lines };
  }
  /** Attachments one after the other. `later` (opened mail): stale() stops as soon as another mail is shown, so a late
      result is never written into it; done(a) is called once the result of this attachment stands in the report. */
  async function checkAttachments(data, container, later) {
    let risky = false;
    for (const a of data.attachments || []) {
      if (later?.stale()) break;
      const result = await checkAttachment(a);
      if (later?.stale()) break;
      if (result.risky) risky = true;
      container.append(...result.lines);
      later?.done(a);
    }
    return risky;
  }
  async function checks(data, container) {
    const text = checkText(data, container);
    return (await checkAttachments(data, container)) || text;
  }
  async function open(item) {
    if (!leave()) return;
    endChecks();
    const ticket = openTicket;
    draft = null;
    dirty = false;
    current = null;
    mail = null;
    reader.replaceChildren(el("p", "mail-muted", native ? S("choose") : T("body")));
    if (allMode) useItemAccount(item);
    native?.progress?.('download');
    try { mail = await fetchMail(item); }
    catch (error) {
      // Im Index gemerkt, beim Anbieter aber nicht mehr da (anderswo verschoben oder gelöscht): Platz vergessen, Liste neu.
      if (!allMode || !/MESSAGE_MISSING|FOLDER_CHANGED/.test(String(error?.code || "") + " " + String(error?.message || error))) throw error;
      await PBMailIndex.forget([{ account: item.account, folder: item.folder, uid: item.uid }]);
      await loadList();
      notice.textContent = T("allGone");
      return;
    }
    native?.progress?.('prepare');
    current = item;
    await api(prefix() + "/messages/" + item.uid + "/action", {
      folder,
      validity,
      action: "read",
    });
    item.flags = [...new Set([...item.flags, "\\Seen"])];
    if (allMode) void PBMailIndex.setFlags(item.account, item.folder, item.uid, { seen: true });
    listPlace = list.scrollTop;
    drawList();
    showCurrentRow();
    app.dataset.view = "reader";
    reader.replaceChildren(
      btn("back", () => {
        if (leave()) backToList();
      }),
      el("h3", "", mail.subject),
      el("p", "mail-muted", mail.from + " → " + mail.to),
    );
    // Klaus 15.11.2026: Speicherort nicht erreichbar → Mail direkt vom Server gezeigt, nicht gesichert. Das wird gesagt.
    if (mail.vaultUnavailable) reader.append(el("p", "mail-muted mail-vault-hint", ({de:"Diese Mail ist nur angezeigt, nicht im Speicherort gesichert: Die App erreicht den Ordner gerade nicht. Einstellungen › Tresor & Ablage › „Vorhandenen Ordner öffnen“ stellt den Zugriff wieder her.",en:"This email is only shown, not saved to your storage location: the app cannot reach the folder right now. Settings › Vault & storage › “Open existing folder” restores access."})[(document.documentElement.lang||"de").slice(0,2)==="en"?"en":"de"]));
    const actions = el("div", "mail-reader-actions");
    const catalogButton = btn("catalogOne", () => catalogOne(mail, current));
    catalogButton.dataset.mailCaption = "true";
    actions.append(
      btn("reply", () =>
        compose({
          to: mail.replyTo || item.from,
          inReplyTo: mail.messageId,
          subject: "Re: " + mail.subject,
          text: "\n\n---\n" + mail.text,
        }),
      ),
      btn("forward", async () =>
        compose({
          subject: "Fwd: " + mail.subject,
          text: mail.from + "\n" + mail.text,
          attachments: window.PBVault ? await PBVault.forwardable(mail.attachments, native?.attachmentLimit || 25 * 1024 * 1024) : mail.attachments,
        }),
      ),
      btn("read", () =>
        flag(item, item.flags.includes("\\Seen") ? "unread" : "read"),
      ),
      btn("star", () =>
        flag(item, item.flags.includes("\\Flagged") ? "unstar" : "star"),
      ),
    );
    const flagText = (key, text) => {
      const b = actions.querySelector('[data-live-text="' + key + '"]');
      if (b && (b.querySelector(":scope > .compact-label") || b).textContent !== text) b.textContent = text;
    };
    relabelFlags = () => {
      flagText("read", T(item.flags.includes("\\Seen") ? "markUnread" : "markRead"));
      flagText("star", T(item.flags.includes("\\Flagged") ? "starOff" : "starOn"));
    };
    relabelFlags();
    for (const [key, use] of [
      ["trash", "\\Trash"],
      ["spam", "\\Junk"],
      ["archive", "\\Archive"],
    ]) {
      const f = roleFolder(use);
      if (f && f.path !== folder)
        actions.append(btn(key, () => action("move", f.path)));
    }
    const move = el("select");
    move.setAttribute("aria-label", T("move"));
    move.append(
      new Option(T("move"), ""),
      ...folders
        .filter((f) => f.path !== folder)
        .map((f) => new Option(native && !allMode ? folderTitle(f.path) : f.name, f.path)), // dieselben Namen wie in der Liste
    );
    move.onchange = () =>
      run(() => (move.value ? action("move", move.value) : null));
    actions.append(move);
    if (folders.find((f) => f.path === folder)?.specialUse === "\\Drafts")
      actions.append(
        btn("compose", async () =>
          compose({
            to: mail.to,
            cc: mail.cc,
            bcc: mail.bcc || "",
            subject: mail.subject,
            text: mail.text,
            attachments: window.PBVault ? await PBVault.forwardable(mail.attachments, native?.attachmentLimit || 25 * 1024 * 1024) : mail.attachments,
          }),
        ),
      );
    const inbox = (native ? folderMap.get("inbox")?.path : null) || "INBOX";
    if ((roleFolder("\\Trash")?.path === folder || roleFolder("\\Junk")?.path === folder) && inbox !== folder)
      actions.append(btn(roleFolder("\\Trash")?.path === folder ? "restore" : "notSpam", () => action("move", inbox)));
    if (roleFolder("\\Trash")?.path === folder)
      actions.append(
        btn("remove", () =>
          confirm(T("remove") + "?") ? action("delete") : null,
        ),
      );
    // The original message as one .eml blob — for saving and for sharing (BookLedgerPro reads .eml, Klaus 2026-10-26).
    const emlBlob = () =>
      new Blob(
        [
          mail.sourceBase64
            ? Uint8Array.from(atob(mail.sourceBase64), (c) =>
                c.charCodeAt(0),
              )
            : mail.raw,
        ],
        { type: "message/rfc822" },
      );
    const emlName = () =>
      ((mail.subject || "mail").replace(/[\\/:*?"<>|\x00-\x1f]/g, "_").trim().slice(0, 80) || "mail") + ".eml";
    // Share with BookLedgerPro: natively the same system chooser as "share / save original" (BookLedgerPro is listed
    // there once installed); in the browser the Web Share API with the .eml file; otherwise a download plus the hint.
    async function shareBookLedger() {
      // Pro-App mit Tresorordner (Schritt D2): wahlweise ins Fach „Eingang-BookLedgerPro“; sonst wie bisher teilen.
      if (native) return native.shareBookLedger
        ? native.shareBookLedger({account,folder,validity,uid:item.uid}, {name: emlName(), datum: new Date(item.date || mail.date || 0).getTime() || 0, auszug: String(mail.text || "").slice(0, 1000)})
        : native.openOriginal({account,folder,validity,uid:item.uid,name:emlName()});
      const file = new File([emlBlob()], emlName(), { type: "message/rfc822" });
      if (navigator.canShare?.({ files: [file] })) {
        try { await navigator.share({ files: [file], title: mail.subject || "" }); return; }
        catch (e) { if (e?.name === "AbortError") return; }
      }
      downloadBlob(emlBlob(), emlName());
      alert(T("bookledgerFallback"));
    }
    // Share with Familienakte (Klaus 2026-11-09): the raw .eml with its attachments. In the Pro app with an open
    // shared Pro vault it goes into the inbox "Eingang-Familienakte" (contract familienakte-uebergabe/1, at most
    // 20 MiB, native-pro-verbund.js); without the vault the system chooser; in the browser Web Share or a download.
    async function shareFamilienakte() {
      // Kopf und Text gehen mit, damit die Vorsortierung auch ohne Katalog-Eintrag gebaut werden kann.
      const meta = { name: emlName(), sourceBase64: mail.sourceBase64 || "", mail: { from: mail.from || "", subject: mail.subject || "", date: mail.date || item.date || "", text: mail.text || "" } };
      if (native) return native.shareFamilienakte
        ? native.shareFamilienakte({account,folder,validity,uid:item.uid}, meta)
        : native.openOriginal({account,folder,validity,uid:item.uid,name:emlName()});
      const file = new File([emlBlob()], emlName(), { type: "message/rfc822" });
      if (navigator.canShare?.({ files: [file] })) {
        try { await navigator.share({ files: [file], title: mail.subject || "" }); return; }
        catch (e) { if (e?.name === "AbortError") return; }
      }
      downloadBlob(emlBlob(), emlName());
      alert(T("familienakteFallback"));
    }
    const familienakteButton = btn("familienakte", shareFamilienakte);
    familienakteButton.dataset.mailFamilienakte = "";
    actions.append(
      btn("download", () =>
        native ? native.openOriginal({account,folder,validity,uid:item.uid,name:emlName()}) : downloadBlob(emlBlob(), emlName()),
      ),
      btn("bookledger", shareBookLedger),
      familienakteButton,
      catalogButton,
    );
    if (native) {
      const tools = el("details", "mail-message-tools"), summary = el("summary", "mail-button", T("messageTools")), menu = el("div", "mail-message-menu");
      summary.dataset.liveText = "messageTools";
      // Generalprüfung 16.11.2026: „In Papierkorb“ bleibt neben Antworten/Weiterleiten sichtbar (1 Tipp statt 2). Es bleibt der
      // Papierkorb des Anbieters; dort lässt sich die Mail zurückholen.
      const trashNow = actions.querySelector(':scope > [data-live-text="trash"]');
      for (const node of [...actions.children].slice(2)) if (node !== catalogButton && node !== trashNow) menu.append(node);
      if (trashNow) actions.children[1].after(trashNow);
      menu.addEventListener("click", event => { if (event.target.closest("button")) tools.open = false; });
      tools.append(summary, menu); actions.append(tools);
    }
    // Protection hints (rules, lists) stand between the actions and the message itself.
    reader.append(actions, ...(window.PBSchutz ? [PBSchutz.mailPanel(mail)] : []), window.PBMailView ? PBMailView.render(mail) : el("pre", "mail-text", mail.text));
    if (window.PBMailTranslation) PBMailTranslation.mount({host:reader,actions,source:async()=>({subject:mail.subject || item.subject || '',from:mail.from,to:mail.to,cc:mail.cc,text:mail.text || ''})});
    // Klaus 16.11.2026: Kopf und Text stehen sofort da; die Anhänge werden danach einzeln geprüft. Bis das Ergebnis eines
    // Anhangs da ist, lässt er sich nicht öffnen oder herausgeben (vorher war dafür die ganze Mail gesperrt), und solange
    // nicht alle geprüft sind, bleiben die Wege gesperrt, die die Mail samt Anhängen weitergeben.
    const waiting = new Map(), opened = mail;
    const hold = (nodes, on) => {
      for (const node of nodes) {
        node.inert = on; // also covers buttons that are added to a row later
        for (const b of node.matches("button") ? [node] : node.querySelectorAll("button")) b.disabled = on;
      }
    };
    const handsOut = ["forward", "download", "bookledger", "familienakte", ...(folders.find((f) => f.path === folder)?.specialUse === "\\Drafts" ? ["compose"] : [])]
      .map((key) => actions.querySelector('[data-live-text="' + key + '"]')).filter(Boolean);
    for (const [index, a] of mail.attachments.entries()) {
      if (a.inline) { waiting.set(a, null); continue; } // Still present in raw MIME and attachment checks.
      const nodes = [];
      if (!a.data && window.PBVault) {
        nodes.push(PBVault.attachmentRow(a, () => run(async () => {
          await native.forgetMessage({ account, folder, validity, uid: item.uid });
          await open(item);
        })));
      } else {
        const b = btn("download", () =>
          native ? native.openAttachment({account,folder,validity,uid:item.uid,index}) : downloadBlob(
            new Blob([attachmentBytes(a)], { type: "application/octet-stream" }),
            a.name,
          ),
        );
        b.textContent = "↓ " + a.name;
        delete b.dataset.liveText;
        nodes.push(b);
        if (window.PBSchutz) nodes.push(PBSchutz.attachmentStatus(a));
      }
      const wait = el("p", "mail-muted mail-attachment-wait", a.name + " · "), state = el("span", "", T("attachmentChecking"));
      wait.dataset.mailAttachmentWait = ""; wait.setAttribute("role", "status");
      state.dataset.liveText = "attachmentChecking"; wait.append(state);
      hold(nodes, true);
      waiting.set(a, { nodes, wait });
      reader.append(...nodes, wait);
    }
    const report = el(native ? "details" : "div", "mail-report"), findings = el("div");
    if (native) report.append(el("summary", "", T("check")));
    report.append(findings);
    reader.append(report);
    native?.progress?.('checking');
    // Yield once so WebView can paint the real check phase before local parsing.
    if(native)await new Promise(resolve=>requestAnimationFrame(()=>setTimeout(resolve,0)));
    let risky = checkText(mail, findings);
    if (!mail.attachments.length) { report.dataset.risky = String(risky); return; }
    hold(handsOut, true);
    reader.dataset.mailChecking = "true";
    const stale = () => ticket !== openTicket || mail !== opened;
    const release = (a) => {
      const entry = waiting.get(a);
      waiting.delete(a);
      if (entry) { entry.wait.remove(); hold(entry.nodes, false); }
    };
    // Not awaited: the mail is usable from here on. The checks themselves are the same as before.
    void checkAttachments(mail, findings, { stale, done: release })
      .then((found) => { risky = risky || found; }, (error) => { risky = true; if (!stale()) notice.textContent = T("error") + " " + error.message; })
      .finally(() => {
        if (stale()) return; // another mail is shown: nothing of this one is written any more
        for (const a of [...waiting.keys()]) release(a);
        hold(handsOut, false);
        report.dataset.risky = String(risky);
        delete reader.dataset.mailChecking;
      });
  }
  function compose(source = {}) {
    if (!leave()) return;
    endChecks();
    draft = {
      submission: crypto.randomUUID(),
      to: "",
      cc: "",
      bcc: "",
      subject: "",
      text: "",
      attachments: [],
      ...source,
    };
    dirty = Boolean(
      source.text || source.subject || source.attachments?.length,
    );
    copyRecipientsOpen = Boolean(draft.cc || draft.bcc);
    renderComposer();
  }
  function renderComposer() {
    app.dataset.view = "reader";
    reader.replaceChildren(
      btn("back", () => {
        if (leave()) {
          draft = null;
          dirty = false;
          app.dataset.view = "list";
        }
      }),
    );
    if (allMode && accounts.length > 1) {
      // Unter „Alle Konten“: Antworten gehen vom Konto der Mail aus; eine neue Mail fragt, von welchem Konto.
      if (!accounts.some((a) => a.id === account)) account = accounts[0].id;
      const from = el("label", "mail-muted", T("from") + ": "), pick = el("select");
      pick.append(...accounts.map((a) => new Option(a.email, a.id)));
      pick.value = account; pick.dataset.mailFrom = "";
      pick.onchange = () => { account = pick.value; };
      from.append(pick); reader.append(from);
    } else reader.append(
      el(
        "p",
        "mail-muted",
        T("from") + ": " + accounts.find((a) => a.id === account)?.email,
      ),
    );
    const copyFields = el("details", "mail-copy-fields"),
      copySummary = el("summary", "", T("copyRecipients"));
    copySummary.dataset.liveText = "copyRecipients";
    copyFields.open = copyRecipientsOpen;
    copyFields.ontoggle = () => { copyRecipientsOpen = copyFields.open; };
    copyFields.append(copySummary);
    for (const [key, label] of [
      ["to", T("to")],
      ["cc", T("cc")],
      ["bcc", T("bcc")],
      ["subject", T("subject")],
      ["text", T("body")],
    ]) {
      const input = field(
        key === "cc" || key === "bcc" ? copyFields : reader,
        label,
        draft[key],
        key === "text" ? "textarea" : "text",
      );
      input.id = "pb-live-" + key;
      input.parentElement.dataset.liveField = key === "text" ? "body" : key;
      input.oninput = () => {
        draft[key] = input.value;
        dirty = true;
      };
      if (key === "to") reader.append(copyFields);
    }
    const attach = field(reader, T("attach"), "", "file");
    attach.parentElement.hidden = true;
    attach.multiple = true;
    attach.onchange = () =>
      run(async () => {
        let total = draft.attachments.reduce(
          (s, a) => s + attachmentBytes(a).length,
          0,
        );
        for (const file of attach.files) {
          total += file.size;
          if (total > (native?.attachmentLimit || 25 * 1024 * 1024)) throw new Error(native ? T("nativeLimit") : "25 MB");
          const bytes = new Uint8Array(await file.arrayBuffer());
          let str = "";
          for (let i = 0; i < bytes.length; i += 32768)
            str += String.fromCharCode(...bytes.subarray(i, i + 32768));
          draft.attachments.push({
            name: file.name,
            type: file.type,
            data: btoa(str),
          });
        }
        dirty = true;
        renderComposer();
      });
    for (const a of draft.attachments) {
      const row = el("p", "mail-muted", a.name);
      row.append(
        btn("remove", () => {
          draft.attachments = draft.attachments.filter((x) => x !== a);
          dirty = true;
          renderComposer();
        }),
      );
      reader.append(row);
    }
    const report = el("div", "mail-report"),
      actions = el("div", "mail-reader-actions mail-compose-actions");
    actions.append(
      btn("check", () => checks(draft, report)),
      btn("draft", async () => {
        await api(prefix() + "/draft", draft);
        dirty = false;
        if (native) { savedCache=allMode?await savedAll():await native.saved(account);drawFolders(); }
        notice.textContent = "✓ " + T("draft");
      }),
      btn("send", async () => {
        if (!draft.to && !draft.cc && !draft.bcc) throw new Error(T("to"));
        const risky = await checks(draft, report);
        if (risky && !confirm(T("risk"))) return;
        if (!confirm(T("confirm"))) return;
        const data = await api(prefix() + "/send", draft);
        dirty = false;
        // Generalprüfung 16.11.2026: nach dem Senden keine Sackgasse. Angenommen → ein klarer Satz und die Nachrichtenliste
        // steht wieder da; sonst bleibt die Meldung stehen, mit dem Weg zurück darüber. „Zurück“ zeigt nur die Liste –
        // gesendet wird dabei nie noch einmal (der Entwurf ist verworfen).
        const toList = () => btn("back", () => { app.dataset.view = "list"; });
        let sentText = "";
        if (data.status === "sent") {
          const to = [draft.to, draft.cc, draft.bcc].filter(Boolean).join(", ");
          sentText = T("sentDone") + (to ? " " + T("to") + ": " + to + "." : "") + (data.notice ? " " + data.notice : "");
          draft = null;
          reader.replaceChildren(toList(), el("p", "mail-notice", sentText));
          app.dataset.view = "list";
        } else {
          draft = null;
          reader.replaceChildren(
            toList(),
            el(
              "p",
              "mail-notice",
              data.notice ||
                "Angenommen: " +
                  data.accepted?.join(", ") +
                  " · Abgelehnt: " +
                  data.rejected?.join(", "),
            ),
          );
        }
        if (native) { savedCache=allMode?await savedAll():await native.saved(account);drawFolders(); }
        // Die Hinweiszeile sagt den Stand in Worten (in der App z. B. „Versand unklar – nicht erneut senden“), nicht „SMTP · uncertain“.
        notice.textContent = sentText || native?.text(data.status) || "SMTP · " + data.status;
        if (sentText) notice.dataset.mailResult = "fertig"; // gut lesbar, wie das Ergebnis von „An Familienakte“
      }),
    );
    const sendButton = actions.querySelector('[data-live-text="send"]');
    sendButton.classList.add("mail-primary");
    const attachButton = btn("attach", () => attach.click());
    actions.prepend(sendButton, attachButton);
    for (const button of actions.children) button.dataset.mailCaption = "true";
    const backButton = reader.querySelector(":scope > .mail-back");
    if (backButton) actions.prepend(backButton);
    reader.prepend(actions);
    reader.append(report);
  }
  new MutationObserver(() => {
    for (const b of host.querySelectorAll("[data-live-text]"))
      b.textContent = T(b.dataset.liveText);
    if (current) relabelFlags?.();
    for (const label of reader.querySelectorAll("[data-live-field]"))
      label.firstChild.nodeValue = T(label.dataset.liveField);
    if(native) {
      for(const node of host.querySelectorAll('[data-shared-text]'))node.textContent=S(node.dataset.sharedText);
      updateEntries();drawFolders();drawList();
      if(!current&&!draft&&!reader.querySelector('[data-native-status]')&&!reader.querySelector('[data-live-text=restore]'))reader.replaceChildren(el('p','mail-muted',S('choose')));
      if(allMode&&!draft)notice.textContent=T("allAccounts")+" · "+(String(viewKey).startsWith("tool:")?T(viewKey==="tool:clean"?"allClean":"allSenders"):entries.find(e=>e.id===viewKey)?.name||"");
      else if(account&&!draft&&!reader.querySelector("[data-native-status]"))notice.textContent=accounts.find(a=>a.id===account)?.email+" · "+folderTitle(folder);
    }
    for (const status of host.querySelectorAll("[data-native-status]")) status.textContent = T(status.dataset.nativeStatus);
  }).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["lang"],
  });
  window.addEventListener("beforeunload", (e) => {
    if (dirty) {
      e.preventDefault();
      e.returnValue = "";
    }
  });
  // Generalprüfung 16.11.2026: solange Mails angehakt sind, holt der Abruf alle 60 Sekunden die Liste nicht neu – sonst wären
  // die Häkchen (auch die der nicht übergebenen Mails) und der Satz darüber nach spätestens einer Minute still weg.
  function autoRefresh() {
    if (
      !busy &&
      !app.hidden &&
      !draft &&
      !current &&
      !selected.size &&
      document.visibilityState === "visible" &&
      (account || allMode) &&
      !(allMode && String(viewKey).startsWith("tool:"))
    )
      return run(() => loadList());
    return Promise.resolve(false);
  }
  // A finished fetch of the index refreshes "Alle Konten" – folder numbers and list – when nothing is open or ticked.
  window.addEventListener("pb:mail-index", () => {
    if (!allMode || busy || app.hidden || draft || current || selected.size || String(viewKey).startsWith("tool:")) return;
    void run(() => loadAllFolders());
  });
  setInterval(autoRefresh, 60000);
  window.PBLiveMail = {
    disconnect,
    autoRefresh,
    /** „Alle Konten“ in the folder bar of a single account: the mailbox switches to all accounts (old page with one account). */
    async showAll() {
      if (!native) return;
      for (let i = 0; busy && i < 50; i++) await new Promise((r) => setTimeout(r, 200));
      if (!allAllowed()) { window.PBMailIndex?.show?.(true); return; }
      await run(() => enterAll());
    },
    /** Opens a mail of the index in the reader of "Alle Konten" (used by „Nach Absender“ and „Aufräumen“). */
    async openInAll(ref) {
      if (!native || !allMode) return false;
      for (let i = 0; busy && i < 50; i++) await new Promise((r) => setTimeout(r, 200));
      let shown = false;
      const ok = await run(async () => {
        const hit = PBMailIndex.places({ account: ref.account, path: ref.folder }).find((p) => p.loc.uid === ref.uid);
        const item = hit ? placeItem(hit) : { ...ref, subject: "", from: "", flags: [], files: [] };
        await open(item);
        shown = !!current;
      });
      return ok && shown;
    },
    /** Hands mails of any connected account to Familienakte without opening them (used by "Alle Konten"). Null while the mailbox is busy. */
    async familienakte(refs) {
      if (!native) return null;
      for (let i = 0; busy && i < 50; i++) await new Promise((r) => setTimeout(r, 200));
      let sum = null;
      await run(async () => { sum = await handToFamilienakte(refs); });
      return sum;
    },
    familienakteTresor: async () => (native?.familienakteTresor ? native.familienakteTresor() : { vorhanden: false, offen: false }),
    /** Opens one mail of any connected account in the device mailbox (used by "Alle Konten"). */
    /** Resolves true when the mail is open, false otherwise (the reason stands in the mailbox notice). */
    async openRemote(ref) {
      if (!native) return false;
      // Läuft gerade der Abruf alle 60 Sekunden, kurz warten statt still nichts zu tun.
      for (let i = 0; busy && i < 50; i++) await new Promise((r) => setTimeout(r, 200));
      let shown = false;
      const ok = await run(async () => {
        if (!leave()) return;
        accounts = await native.accounts();
        if (!accounts.some((a) => a.id === ref.account)) throw new Error(native.text("ACCOUNT_MISSING"));
        base = native.base; token = "device"; connect.hidden = true;
        switchMode(true);
        leaveAll(); accountOptions();
        account = ref.account; accountSelect.value = account; accountTools.hidden = false; choice(account);
        await loadFolders();
        // Klaus 15.11.2026: „Beim Anbieter öffnen“ tat nichts. Nach dem Kontowechsel wurde die Liste nur neu geladen, wenn der
        // Ordner wechselte – der alte Ordnerstand passte dann nicht. Jetzt immer frisch laden; hat der Anbieter den Ordner neu
        // nummeriert, wird die Mail über ihre Message-ID wiedergefunden.
        const entry = entries.find((e) => e.path === ref.folder);
        if (!entry) throw new Error(native.text("FOLDER_CHANGED"));
        viewKey = entry.id; folder = entry.path; drawFolders(); await loadList();
        let uid = ref.uid;
        if (validity !== ref.validity) {
          const found = ref.messageId && native.locate ? await native.locate({ account, folder, messageId: ref.messageId }) : null;
          if (!found?.uid) throw new Error(native.text("FOLDER_CHANGED"));
          uid = found.uid;
        }
        const item = items.find((i) => i.uid === uid) || { uid, subject: ref.subject || "", from: ref.from || "", flags: [], date: ref.date || "" };
        await open(item);
        shown = !!current;
      });
      return ok && shown;
    },
    async getRaw(ref) {
      if (
        !token ||
        ref.base !== base ||
        !accounts.some((a) => a.id === ref.account)
      )
        return null;
      const data = await api(
        "/" +
          encodeURIComponent(ref.account) +
          "/messages/" +
          ref.uid +
          "?folder=" +
          encodeURIComponent(ref.folder) +
          "&validity=" +
          encodeURIComponent(ref.validity),
      );
      return data.raw;
    },
  };
})();
