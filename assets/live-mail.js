/* Optional private IMAP/SMTP service. Credentials never enter browser storage. */
(function () {
  "use strict";
  const host = document.getElementById("mailWorkspace"),
    local = host.querySelector(".mail-app");
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
      "Nachricht katalogisieren",
      "Catalog message",
      "Добавить письмо в каталог",
      "Kataloguj wiadomość",
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
    send: ["Jetzt senden", "Send now", "Отправить", "Wyślij teraz"],
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
  const T = (k) =>
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
  const bar = el("div", "mail-head"),
    connect = btn("connect", setup),
    switcher = btn("remote", () => switchMode(true)),
    localButton = btn("local", () => switchMode(false));
  switcher.hidden = true;
  localButton.hidden = true;
  bar.append(connect, switcher, localButton);
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
      await loadFolders();
    });
  head.append(
    accountSelect,
    btn("refresh", () => loadFolders()),
    btn("compose", () => compose()),
    btn("account", () => setupAccount()),
    btn("disconnect", disconnect),
    btn("removeAccount", async () => {
      if (!leave() || !account || !confirm(T("removeConfirm"))) return;
      await api("/accounts/" + account, null, "DELETE");
      accounts = await api("/accounts");
      await accountList();
    }),
  );
  layout.append(nav, list, reader);
  app.append(head, notice, layout);
  function btn(key, fn) {
    const b = el("button", "mail-button", T(key));
    b.type = "button";
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
    app.inert = true;
    app.setAttribute("aria-busy", "true");
    try {
      await fn();
    } catch (e) {
      notice.textContent = T("error") + " " + e.message;
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
      busy = false;
      app.inert = false;
      app.removeAttribute("aria-busy");
    }
  }
  async function api(path, body, method) {
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
  function setup() {
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
    if (account) await loadFolders();
    else setupAccount();
  }
  function setupAccount() {
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
    local.hidden = false;
    connect.hidden = false;
    switcher.hidden = true;
    localButton.hidden = true;
  }
  async function loadFolders() {
    if (!leave()) return;
    draft = null;
    dirty = false;
    folders = await api(prefix() + "/folders");
    if (!folders.some((f) => f.path === folder))
      folder =
        folders.find((f) => f.path === "INBOX")?.path ||
        folders[0]?.path ||
        "INBOX";
    drawFolders();
    await loadList();
  }
  function drawFolders() {
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
    const page = await api(
      prefix() +
        "/messages?folder=" +
        encodeURIComponent(folder) +
        (more && next ? "&before=" + next : ""),
    );
    validity = page.validity;
    items = more ? [...items, ...page.items] : page.items;
    next = page.next;
    current = null;
    mail = null;
    app.dataset.view = "list";
    reader.replaceChildren();
    notice.textContent =
      accounts.find((a) => a.id === account)?.email + " · " + folder;
    drawList();
  }
  function drawList() {
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
      b.textContent =
        (item.flags.includes("\\Flagged") ? "★ " : "") +
        item.subject +
        " · " +
        item.from;
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
    current = item;
    mail = await fetchMail(item);
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
    actions.append(
      btn("reply", () =>
        compose({
          to: mail.replyTo || item.from,
          inReplyTo: mail.messageId,
          subject: "Re: " + mail.subject,
          text: "\n\n---\n" + mail.text,
        }),
      ),
      btn("forward", () =>
        compose({
          subject: "Fwd: " + mail.subject,
          text: mail.from + "\n" + mail.text,
          attachments: mail.attachments,
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
      const f = folders.find((f) => f.specialUse === use);
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
        btn("compose", () =>
          compose({
            to: mail.to,
            cc: mail.cc,
            bcc: mail.bcc || "",
            subject: mail.subject,
            text: mail.text,
            attachments: mail.attachments,
          }),
        ),
      );
    if (folders.find((f) => f.path === folder)?.specialUse === "\\Trash")
      actions.append(
        btn("remove", () =>
          confirm(T("remove") + "?") ? action("delete") : null,
        ),
      );
    actions.append(
      btn("download", () =>
        downloadBlob(
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
      btn("catalogOne", () => catalogOne(mail, current)),
    );
    reader.append(actions, el("pre", "mail-text", mail.text));
    for (const a of mail.attachments) {
      const b = btn("download", () =>
        downloadBlob(
          new Blob([attachmentBytes(a)], { type: "application/octet-stream" }),
          a.name,
        ),
      );
      b.textContent = "↓ " + a.name;
      delete b.dataset.liveText;
      reader.append(b);
    }
    const report = el("div", "mail-report");
    reader.append(report);
    await checks(mail, report);
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
    for (const [key, label] of [
      ["to", T("to")],
      ["cc", "Cc"],
      ["bcc", "Bcc"],
      ["subject", T("subject")],
      ["text", T("body")],
    ]) {
      const input = field(
        reader,
        label,
        draft[key],
        key === "text" ? "textarea" : "text",
      );
      input.id = "pb-live-" + key;
      input.oninput = () => {
        draft[key] = input.value;
        dirty = true;
      };
    }
    const attach = field(reader, T("attach"), "", "file");
    attach.multiple = true;
    attach.onchange = () =>
      run(async () => {
        let total = draft.attachments.reduce(
          (s, a) => s + attachmentBytes(a).length,
          0,
        );
        for (const file of attach.files) {
          total += file.size;
          if (total > 25 * 1024 * 1024) throw new Error("25 MB");
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
      actions = el("div", "mail-reader-actions");
    actions.append(
      btn("check", () => checks(draft, report)),
      btn("draft", async () => {
        await api(prefix() + "/draft", draft);
        dirty = false;
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
        notice.textContent = "SMTP · " + data.status;
      }),
    );
    reader.append(actions, report);
  }
  new MutationObserver(() => {
    for (const b of host.querySelectorAll("[data-live-text]"))
      b.textContent = T(b.dataset.liveText);
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
