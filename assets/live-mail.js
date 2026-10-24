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
  accountSelect.setAttribute("aria-label", "Mailkonto");
  accountSelect.onchange = () =>
    run(async () => {
      if (!leave()) {
        accountSelect.value = account;
        return;
      }
      account = accountSelect.value;
      if (native) switchMode(true);
      await loadFolders();
    });
  const accountTools = native ? el("div", "mail-app mail-head mail-account-bar") : head;
  accountTools.append(
    accountSelect,
    btn("refresh", () => loadFolders()),
    btn("compose", () => compose()),
    btn("account", () => setupAccount()),
    ...(native ? [btn("saved", () => savedItems())] : []),
    btn("disconnect", disconnect),
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
    for (const key of ["account", "saved", "disconnect", "removeAccount"])
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
  async function run(fn) {
    if (busy) return;
    busy = true;
    if (nativeNotice) nativeNotice.textContent = "";
    app.inert = true;
    if (native) accountTools.inert = true;
    app.setAttribute("aria-busy", "true");
    try {
      await fn();
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
  async function accountList() {
    accountSelect.replaceChildren(
      ...accounts.map((a) => new Option(a.email, a.id)),
    );
    if (!accounts.some((a) => a.id === account))
      account = accounts[0]?.id || "";
    accountSelect.value = account;
    if (native) accountTools.hidden = !account;
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
  async function loadFolders() {
    if (!leave()) return;
    draft=null; dirty=false;
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
    if (!native) return;
    try { folders = await api(prefix() + '/folders'); updateEntries(); serverTotals(); drawFolders(); } catch { /* the list itself is already fresh */ }
  }
  function drawFolders() {
    if (native) {
      nav.replaceChildren();
      const overview=window.PBMailIndex?.entry?.();if(overview)nav.append(overview);
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
      const button=btn('folder',async()=>{const name=prompt(T('folder'));if(name){await api(prefix()+'/folders',{name});await loadFolders();}});
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
        const name = prompt(T("folder"));
        if (name) {
          await api(prefix() + "/folders", { name });
          await loadFolders();
        }
      }),
    );
  }
  async function loadList(more = false) {
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
    drawList();
    if(native)accountTools.querySelector('[data-live-text=catalog]').disabled=!entries.find(e=>e.id===viewKey)?.remote||!items.length;
  }
  async function batchAction(type,target) {
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
  function drawNativeList() {
    list.replaceChildren();
    const search=el('input');search.type='search';search.placeholder=S('filter');search.setAttribute('aria-label',S('filter'));search.value=filterText;
    const actions=el('div','mail-list-actions'), rows=el('div'), count=el('p','mail-count');
    const all=el('button','mail-button',S('all')), trash=el('button','mail-button',S('delete')), move=el('select');
    all.type=trash.type='button';all.disabled=!items.some(item=>!item.local);all.dataset.nativeSelection='all';trash.dataset.nativeSelection='trash';
    move.setAttribute('aria-label',S('move'));move.append(new Option(S('move'),''),...folders.filter(f=>f.path!==folder).map(f=>new Option(folderTitle(f.path),f.path)));
    const filtered=()=>items.filter(item=>(item.subject+' '+item.from).toLocaleLowerCase().includes(filterText.toLocaleLowerCase()));
    const isTrash=folderMap.get('trash')?.path===folder, trashFolder=folderMap.get('trash');
    const isSpam=folderMap.get('spam')?.path===folder, spamFolder=folderMap.get('spam'), inbox=folderMap.get('inbox')?.path||'INBOX';
    if(isTrash)trash.textContent=T('remove');
    // In the trash: put back into the inbox; in spam: "not spam"; elsewhere: mark as spam (Klaus 2026-10-22).
    const back=el('button','mail-button',T(isTrash?'restore':isSpam?'notSpam':'spam'));back.type='button';back.dataset.nativeSelection=isTrash?'restore':isSpam?'notspam':'spam';
    const backTarget=isTrash||isSpam?inbox:spamFolder?.path;
    back.hidden=!backTarget||backTarget===folder;
    back.onclick=()=>run(()=>batchAction('move',backTarget));
    function selection(){count.textContent=selected.size+' '+S('selected');trash.disabled=!selected.size||(isTrash?false:!trashFolder);back.disabled=!selected.size;move.disabled=!selected.size;}
    all.onclick=()=>{const candidates=filtered().filter(item=>!item.local),on=candidates.some(item=>!selected.has(item.uid));for(const item of candidates)on?selected.add(item.uid):selected.delete(item.uid);drawNativeList();};
    trash.onclick=()=>run(()=>batchAction(isTrash?'delete':'move',isTrash?null:trashFolder.path));
    move.onchange=()=>{const target=move.value;move.value='';if(target)run(()=>batchAction('move',target));};
    function drawRows(){
      rows.replaceChildren();
      for(const record of historyRows().filter(record=>(record.subject+' '+record.to).toLocaleLowerCase().includes(filterText.toLocaleLowerCase()))) {
        const row=el('div','mail-item'), button=el('button');button.type='button';button.dataset.nativeSaved=record.id;
        const status=el('span','mail-preview',T(record.status==='draft'?'draftStatus':record.status));status.dataset.nativeStatus=record.status==='draft'?'draftStatus':record.status;
        button.append(el('span','mail-avatar','✉'),el('span','mail-subject',record.subject),status);button.onclick=()=>run(()=>showSavedRecord(record));row.append(el('span'),button);rows.append(row);
      }
      for(const item of filtered()) {
        const row=el('div','mail-item'+(!item.flags.includes('\\Seen')?' unread':'')),check=el('input'),button=el('button');
        check.type='checkbox';check.checked=selected.has(item.uid);check.disabled=Boolean(item.local);check.setAttribute('aria-label',item.subject);
        check.onchange=()=>{check.checked?selected.add(item.uid):selected.delete(item.uid);selection();};
        button.type='button';button.dataset.liveUid=item.uid;button.setAttribute('aria-current',String(current?.uid===item.uid));
        button.append(el('span','mail-avatar',(item.from||item.subject||'?').slice(0,1).toUpperCase()),el('span','mail-subject',(item.flags.includes('\\Flagged')?'★ ':'')+item.subject),el('span','mail-preview',item.from),el('time','mail-date',item.date?new Date(item.date).toLocaleString(document.documentElement.lang,{dateStyle:'short',timeStyle:'short'}):''));
        button.onclick=()=>run(async()=>{if(item.local){if(!leave())return;switchMode(false);await shared.openMessage(item.uid);}else{selected.clear();await open(item);}});
        row.append(check,button);rows.append(row);
      }
      if(!rows.childElementCount)rows.append(el('p','mail-muted',S('empty')));
    }
    search.oninput=()=>{filterText=search.value;selected.clear();drawRows();selection();};
    actions.append(all,trash,back,move);list.append(search,actions,count,rows);drawRows();selection();
    if(next)list.append(btn('more',()=>loadList(true)));
  }
  async function showSavedRecord(record) {
    if(!leave())return;dirty=false;draft=null;app.dataset.view='reader';
    const status=el('p','',T(record.status==='draft'?'draftStatus':record.status));status.dataset.nativeStatus=record.status==='draft'?'draftStatus':record.status;
    reader.replaceChildren(btn('back',()=>{app.dataset.view='list';}),el('h3','',record.subject),el('p','mail-muted',record.to),status);
    if(['draft','queued'].includes(record.status))reader.append(btn('restore',async()=>compose(await native.savedDraft(account,record.id))));
  }
  function drawList() {
    if (native) return drawNativeList();
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
  }
  async function fetchMail(item) {
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
    await loadList();
    await refreshCounts();
  }
  function attachmentBytes(a) {
    return Uint8Array.from(atob(a.data), (c) => c.charCodeAt(0));
  }
  async function checks(data, container) {
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
    for (const a of data.attachments || []) {
      // Android folder mode: the bytes stay encrypted in the chosen folder, not in this page.
      if (!a.data && window.PBVault) {
        // 🛡 Klaus 2026-10-22: attachments in the folder are checked too (native/native-check.js).
        const checked = window.PBCheck && a.stored && a.ref ? await PBCheck.checkVault(a).catch(() => null) : null;
        if (!checked) {
          risky = true;
          container.append(el("p", "", a.name + " · " + PBVault.uncheckedText()));
          continue;
        }
        if (checked.funde.length || checked.ungeprueft) risky = true;
        container.append(PBCheck.line(a.name, checked, a));
        continue;
      }
      let result;
      try {
        result = await PrueferAnhang.pruefe(a.name, attachmentBytes(a));
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
      container.append(
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
      for (const hint of result?.hinweise || [])
        container.append(el("p", "", hint));
      if (result?.textUngeprueft || result?.bildUngeprueft)
        container.append(el("p", "", result.ungeprueftSatz || T("limit")));
    }
    return risky;
  }
  async function open(item) {
    if (!leave()) return;
    draft = null;
    dirty = false;
    current = null;
    mail = null;
    reader.replaceChildren(el("p", "mail-muted", native ? S("choose") : T("body")));
    native?.progress?.('download');
    mail = await fetchMail(item);
    native?.progress?.('prepare');
    current = item;
    await api(prefix() + "/messages/" + item.uid + "/action", {
      folder,
      validity,
      action: "read",
    });
    item.flags = [...new Set([...item.flags, "\\Seen"])];
    drawList();
    app.dataset.view = "reader";
    reader.replaceChildren(
      btn("back", () => {
        if (leave()) app.dataset.view = "list";
      }),
      el("h3", "", mail.subject),
      el("p", "mail-muted", mail.from + " → " + mail.to),
    );
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
        action(item.flags.includes("\\Seen") ? "unread" : "read"),
      ),
      btn("star", () =>
        action(item.flags.includes("\\Flagged") ? "unstar" : "star"),
      ),
    );
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
        .map((f) => new Option(f.name, f.path)),
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
    actions.append(
      btn("download", () =>
        native ? native.openOriginal({account,folder,validity,uid:item.uid}) : downloadBlob(
          new Blob(
            [
              mail.sourceBase64
                ? Uint8Array.from(atob(mail.sourceBase64), (c) =>
                    c.charCodeAt(0),
                  )
                : mail.raw,
            ],
            { type: "message/rfc822" },
          ),
          "mail.eml",
        ),
      ),
      catalogButton,
    );
    if (native) {
      const tools = el("details", "mail-message-tools"), summary = el("summary", "mail-button", T("messageTools")), menu = el("div", "mail-message-menu");
      summary.dataset.liveText = "messageTools";
      for (const node of [...actions.children].slice(2)) if (node !== catalogButton) menu.append(node);
      menu.addEventListener("click", event => { if (event.target.closest("button")) tools.open = false; });
      tools.append(summary, menu); actions.append(tools);
    }
    // Protection hints (rules, lists) stand between the actions and the message itself.
    reader.append(actions, ...(window.PBSchutz ? [PBSchutz.mailPanel(mail)] : []), window.PBMailView ? PBMailView.render(mail) : el("pre", "mail-text", mail.text));
    for (const [index, a] of mail.attachments.entries()) {
      if (a.inline) continue; // Still present in raw MIME and attachment checks.
      if (!a.data && window.PBVault) {
        reader.append(PBVault.attachmentRow(a, () => run(async () => {
          await native.forgetMessage({ account, folder, validity, uid: item.uid });
          await open(item);
        })));
        continue;
      }
      const b = btn("download", () =>
        native ? native.openAttachment({account,folder,validity,uid:item.uid,index}) : downloadBlob(
          new Blob([attachmentBytes(a)], { type: "application/octet-stream" }),
          a.name,
        ),
      );
      b.textContent = "↓ " + a.name;
      delete b.dataset.liveText;
      reader.append(b);
      if (window.PBSchutz) reader.append(PBSchutz.attachmentStatus(a));
    }
    const report = el(native ? "details" : "div", "mail-report"), findings = el("div");
    if (native) report.append(el("summary", "", T("check")));
    report.append(findings);
    reader.append(report);
    native?.progress?.('checking');
    // Yield once so WebView can paint the real check phase before local parsing.
    if(native)await new Promise(resolve=>requestAnimationFrame(()=>setTimeout(resolve,0)));
    await checks(mail, findings);
  }
  function compose(source = {}) {
    if (!leave()) return;
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
    reader.append(
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
        if (native) { savedCache=await native.saved(account);drawFolders(); }
        notice.textContent = "✓ " + T("draft");
      }),
      btn("send", async () => {
        if (!draft.to && !draft.cc && !draft.bcc) throw new Error(T("to"));
        const risky = await checks(draft, report);
        if (risky && !confirm(T("risk"))) return;
        if (!confirm(T("confirm"))) return;
        const data = await api(prefix() + "/send", draft);
        dirty = false;
        if (data.status === "sent") {
          draft = null;
          reader.replaceChildren(
            el(
              "p",
              "mail-notice",
              T("sent") + (data.notice ? " " + data.notice : ""),
            ),
          );
        } else {
          draft = null;
          reader.replaceChildren(
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
        if (native) { savedCache=await native.saved(account);drawFolders(); }
        notice.textContent = "SMTP · " + data.status;
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
    for (const label of reader.querySelectorAll("[data-live-field]"))
      label.firstChild.nodeValue = T(label.dataset.liveField);
    if(native) {
      for(const node of host.querySelectorAll('[data-shared-text]'))node.textContent=S(node.dataset.sharedText);
      updateEntries();drawFolders();drawList();
      if(!current&&!draft&&!reader.querySelector('[data-native-status]')&&!reader.querySelector('[data-live-text=restore]'))reader.replaceChildren(el('p','mail-muted',S('choose')));
      if(account&&!draft&&!reader.querySelector("[data-native-status]"))notice.textContent=accounts.find(a=>a.id===account)?.email+" · "+folderTitle(folder);
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
  setInterval(() => {
    if (
      !busy &&
      !app.hidden &&
      !draft &&
      !current &&
      document.visibilityState === "visible" &&
      account
    )
      run(() => loadList());
  }, 60000);
  window.PBLiveMail = {
    disconnect,
    /** Opens one mail of any connected account in the device mailbox (used by "Alle Konten"). */
    openRemote(ref) {
      if (!native) return Promise.resolve();
      return run(async () => {
        if (!leave()) return;
        accounts = await native.accounts();
        if (!accounts.some((a) => a.id === ref.account)) throw new Error(native.text("ACCOUNT_MISSING"));
        base = native.base; token = "device"; connect.hidden = true;
        switchMode(true);
        accountSelect.replaceChildren(...accounts.map((a) => new Option(a.email, a.id)));
        account = ref.account; accountSelect.value = account; accountTools.hidden = false;
        await loadFolders();
        const entry = entries.find((e) => e.path === ref.folder);
        if (entry && entry.path !== folder) { viewKey = entry.id; folder = entry.path; drawFolders(); await loadList(); }
        if (folder !== ref.folder || validity !== ref.validity) throw new Error(native.text("FOLDER_CHANGED"));
        const item = items.find((i) => i.uid === ref.uid) || { uid: ref.uid, subject: ref.subject || "", from: ref.from || "", flags: [], date: ref.date || "" };
        await open(item);
      });
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
