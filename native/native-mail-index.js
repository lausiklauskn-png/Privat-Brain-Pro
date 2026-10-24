/* All accounts in one place: fetch headers and readable text of every connected account,
   file them into the catalog without duplicates, then show them by sender or as a list.
   Reads only. Nothing is moved, deleted or sent on the server; attachments are never loaded. */
(() => {
  'use strict';
  const device = window.PBMailDevice, shared = window.PBMailUI, host = document.getElementById('mailWorkspace');
  if (!device || !shared || !host || typeof CATALOG === 'undefined') return;
  const languages = ['de', 'en', 'ru', 'pl'];
  const labels = {
    open: ['👥 Alle Konten', '👥 All accounts', '👥 Все аккаунты', '👥 Wszystkie konta'],
    close: ['← Zurück', '← Back', '← Назад', '← Wstecz'],
    closeLong: ['Zurück zum Postfach', 'Back to mailbox', 'Назад к почте', 'Wróć do poczty'],
    chooseAccount: ['Konto wählen', 'Choose account', 'Выбрать аккаунт', 'Wybierz konto'],
    title: ['Alle Konten', 'All accounts', 'Все аккаунты', 'Wszystkie konta'],
    fetch: ['📥 Alle Konten abrufen und einordnen', '📥 Fetch and sort all accounts', '📥 Загрузить и упорядочить все аккаунты', '📥 Pobierz i uporządkuj wszystkie konta'],
    refresh: ['Jetzt aktualisieren', 'Update now', 'Обновить сейчас', 'Aktualizuj teraz'],
    stop: ['⏹ Anhalten', '⏹ Stop', '⏹ Остановить', '⏹ Zatrzymaj'],
    older: ['Ältere nachholen (weitere 12 Monate)', 'Fetch older (another 12 months)', 'Загрузить старше (ещё 12 месяцев)', 'Pobierz starsze (kolejne 12 miesięcy)'],
    more: ['Weitere Aktionen', 'More actions', 'Другие действия', 'Więcej działań'],
    intro: ['Holt Absender, Betreff und Text aller eingetragenen Konten der letzten 12 Monate. Anhänge werden nicht geladen. Auf dem Server wird nichts verschoben, gelöscht oder gesendet. Danach geht es von selbst: beim Öffnen und alle 30 Minuten, solange die App offen ist und ihr Internet an ist.',
      'Fetches sender, subject and text from every connected account for the last 12 months. Attachments are not downloaded. Nothing is moved, deleted or sent on the server. Afterwards it runs by itself: on opening and every 30 minutes while the app is open and its internet is on.',
      'Загружает отправителя, тему и текст всех подключённых аккаунтов за последние 12 месяцев. Вложения не загружаются. На сервере ничего не перемещается, не удаляется и не отправляется. Затем всё идёт само: при открытии и каждые 30 минут, пока приложение открыто и интернет включён.',
      'Pobiera nadawcę, temat i tekst ze wszystkich kont z ostatnich 12 miesięcy. Załączniki nie są pobierane. Na serwerze nic nie jest przenoszone, usuwane ani wysyłane. Potem działa samo: przy otwarciu i co 30 minut, gdy aplikacja jest otwarta i ma internet.'],
    never: ['Noch nicht abgerufen.', 'Not fetched yet.', 'Ещё не загружено.', 'Jeszcze nie pobrano.'],
    last: ['Zuletzt eingeordnet:', 'Last sorted:', 'Последнее упорядочивание:', 'Ostatnio uporządkowano:'],
    mails: ['Mails', 'emails', 'писем', 'wiadomości'],
    mail: ['Mail', 'email', 'письмо', 'wiadomość'],
    accounts: ['Konten', 'accounts', 'аккаунтов', 'kont'],
    since: ['ab', 'since', 'с', 'od'],
    running: ['Wird abgerufen …', 'Fetching …', 'Загрузка …', 'Pobieranie …'],
    stopped: ['Angehalten. Beim nächsten Abruf geht es dort weiter.', 'Stopped. The next run continues from here.', 'Остановлено. Следующая загрузка продолжит отсюда.', 'Zatrzymano. Następne pobieranie będzie kontynuowane.'],
    offline: ['Das App-Internet ist aus. Der Abruf wartet, bis es wieder an ist.', 'App internet is off. Fetching waits until it is on again.', 'Интернет приложения выключен. Загрузка ждёт.', 'Internet aplikacji jest wyłączony. Pobieranie czeka.'],
    failed: ['Nicht erreichbar, übersprungen:', 'Unavailable, skipped:', 'Недоступно, пропущено:', 'Niedostępne, pominięto:'],
    noAccounts: ['Noch kein Mailkonto eingetragen.', 'No mail account connected yet.', 'Почтовый аккаунт ещё не подключён.', 'Brak połączonego konta pocztowego.'],
    search: ['In allen Mails suchen', 'Search all emails', 'Поиск по всем письмам', 'Szukaj we wszystkich wiadomościach'],
    hits: ['Treffer', 'results', 'найдено', 'wyników'],
    list: ['📋 Liste', '📋 List', '📋 Список', '📋 Lista'],
    senders: ['👤 Absender', '👤 Senders', '👤 Отправители', '👤 Nadawcy'],
    newest: ['Neueste', 'Newest', 'Новые', 'Najnowsze'],
    oldest: ['Älteste', 'Oldest', 'Старые', 'Najstarsze'],
    newestLong: ['Neueste oben', 'Newest first', 'Сначала новые', 'Najnowsze u góry'],
    oldestLong: ['Älteste oben', 'Oldest first', 'Сначала старые', 'Najstarsze u góry'],
    back: ['← Alle Absender', '← All senders', '← Все отправители', '← Wszyscy nadawcy'],
    backList: ['← Zurück', '← Back', '← Назад', '← Wstecz'],
    empty: ['Keine Mails gefunden.', 'No emails found.', 'Писем не найдено.', 'Nie znaleziono wiadomości.'],
    provider: ['Beim Anbieter öffnen', 'Open with provider', 'Открыть у провайдера', 'Otwórz u dostawcy'],
    attachments: ['📎 Anhang beim Anbieter', '📎 Attachment at provider', '📎 Вложение у провайдера', '📎 Załącznik u dostawcy'],
    newsletter: ['📰 Newsletter', '📰 Newsletter', '📰 Рассылка', '📰 Newsletter'],
    account: ['Konto', 'Account', 'Аккаунт', 'Konto'],
    folder: ['Ordner', 'Folder', 'Папка', 'Folder'],
    textMissing: ['Der Text ist zu groß oder nur als Bild vorhanden. Beim Anbieter öffnen.', 'The text is too large or only an image. Open with provider.', 'Текст слишком большой или только картинка. Откройте у провайдера.', 'Tekst jest za duży lub tylko jako obraz. Otwórz u dostawcy.'],
    textScope: ['Gespeicherter Mailtext. Der Abruf liest höchstens 8.000 Zeichen je Mail; Original und Anhänge werden hier nicht geladen.', 'Stored email text. Fetching reads up to 8,000 characters per email; the original and attachments are not downloaded here.', 'Сохранённый текст письма. Загружается не более 8 000 символов на письмо; оригинал и вложения здесь не загружаются.', 'Zapisany tekst e-maila. Pobieranie odczytuje do 8 000 znaków na wiadomość; oryginał i załączniki nie są tu pobierane.'],
    dupesTitle: ['✉️ Mails, die doppelt sein könnten', '✉️ Emails that may be duplicates', '✉️ Письма, которые могут повторяться', '✉️ Wiadomości, które mogą się powtarzać'],
    dupesHelp: ['Gleicher Absender und Betreff, aber anderer Text und keine Mail-Kennung. Nichts wurde überschrieben. Bitte entscheiden:', 'Same sender and subject, but different text and no message ID. Nothing was overwritten. Please decide:', 'Тот же отправитель и тема, но другой текст и нет идентификатора. Ничего не перезаписано. Решите:', 'Ten sam nadawca i temat, ale inny tekst i brak identyfikatora. Nic nie nadpisano. Zdecyduj:'],
    same: ['Gleich – zusammenlegen', 'Same – merge', 'Одинаковые – объединить', 'Takie same – połącz'],
    different: ['Verschieden – beide behalten', 'Different – keep both', 'Разные – оставить оба', 'Różne – zachowaj oba'],
    merged: ['Zusammengelegt. Ihre Markierungen bleiben erhalten.', 'Merged. Your marks are kept.', 'Объединено. Ваши отметки сохранены.', 'Połączono. Twoje oznaczenia zostały zachowane.'],
    kept: ['Beide bleiben erhalten.', 'Both are kept.', 'Оба сохранены.', 'Oba zachowane.'],
    clean: ['🧹 Aufräumen', '🧹 Clean up', '🧹 Уборка', '🧹 Porządki'],
    cleanIntro: ['Newsletter und Werbung aller Konten. Abgelaufene Angebote können in den Papierkorb des Anbieters; dort lassen sie sich zurückholen, bis der Anbieter ihn leert. Ohne eindeutiges Datum wird nie von selbst gelöscht. Mails mit Stern und Absender mit „Ist wichtig“ bleiben immer.',
      'Newsletters and ads from all accounts. Expired offers can go to the provider\'s trash, where they can be restored until the provider empties it. Without a clear date nothing is deleted automatically. Starred mails and senders marked “Important” always stay.',
      'Рассылки и реклама всех аккаунтов. Истёкшие предложения можно переместить в корзину провайдера и восстановить, пока она не очищена. Без ясной даты ничего не удаляется автоматически. Письма со звездой и отправители «Важно» остаются всегда.',
      'Newslettery i reklamy ze wszystkich kont. Wygasłe oferty mogą trafić do kosza dostawcy i można je przywrócić, dopóki kosz nie zostanie opróżniony. Bez jasnej daty nic nie jest usuwane automatycznie. Wiadomości z gwiazdką i nadawcy „Ważne” zostają zawsze.'],
    expiredH: ['⌛ Abgelaufen', '⌛ Expired', '⌛ Истекли', '⌛ Wygasłe'],
    checkH: ['❓ Zum Prüfen (kein eindeutiges Datum)', '❓ To check (no clear date)', '❓ Проверить (нет ясной даты)', '❓ Do sprawdzenia (brak jasnej daty)'],
    runningH: ['✅ Läuft noch', '✅ Still running', '✅ Ещё действуют', '✅ Nadal aktualne'],
    trashedH: ['↩ Zuletzt in den Papierkorb gelegt', '↩ Recently moved to trash', '↩ Недавно в корзине', '↩ Ostatnio przeniesione do kosza'],
    trashAll: ['Alle abgelaufenen in den Papierkorb', 'Move all expired to trash', 'Все истёкшие в корзину', 'Wszystkie wygasłe do kosza'],
    trashOne: ['🗑 In den Papierkorb', '🗑 Move to trash', '🗑 В корзину', '🗑 Do kosza'],
    confirmTrash: ['Mails in den Papierkorb des Anbieters legen? Rückgängig bleibt möglich, bis der Anbieter den Papierkorb leert.', 'Move emails to the provider\'s trash? Undo stays possible until the provider empties the trash.', 'Переместить письма в корзину провайдера? Отмена возможна, пока корзина не очищена.', 'Przenieść wiadomości do kosza dostawcy? Cofnięcie jest możliwe, dopóki kosz nie zostanie opróżniony.'],
    ask: ['abgelaufene Angebote. Künftig abgelaufene Angebote dieses Absenders selbst in den Papierkorb legen?', 'expired offers. Move this sender\'s expired offers to trash automatically from now on?', 'истёкших предложений. Впредь перемещать истёкшие предложения этого отправителя в корзину автоматически?', 'wygasłych ofert. Odtąd automatycznie przenosić wygasłe oferty tego nadawcy do kosza?'],
    yesAuto: ['Ja, künftig selbst', 'Yes, from now on', 'Да, впредь сами', 'Tak, odtąd samo'],
    noAuto: ['Nein, ich lösche selbst', 'No, I delete myself', 'Нет, удаляю сам', 'Nie, usuwam sam'],
    autoOn: ['🤖 räumt selbst auf', '🤖 cleans up itself', '🤖 убирает само', '🤖 sprząta samo'],
    until: ['gültig bis', 'valid until', 'действует до', 'ważne do'],
    noDate: ['kein eindeutiges Datum', 'no clear date', 'нет ясной даты', 'brak jasnej daty'],
    protected: ['geschützt', 'protected', 'защищено', 'chronione'],
    isAd: ['📰 Ist Werbung', '📰 Is advertising', '📰 Это реклама', '📰 To reklama'],
    isImportant: ['⭐ Ist wichtig', '⭐ Is important', '⭐ Важно', '⭐ Ważne'],
    moved: ['in den Papierkorb gelegt', 'moved to trash', 'перемещено в корзину', 'przeniesiono do kosza'],
    automatic: ['automatisch', 'automatic', 'автоматически', 'automatycznie'],
    undo: ['Rückgängig', 'Undo', 'Отменить', 'Cofnij'],
    restored: ['zurückgeholt', 'restored', 'восстановлено', 'przywrócono'],
    gone: ['nicht mehr im Papierkorb', 'no longer in trash', 'уже нет в корзине', 'nie ma już w koszu'],
    noTrash: ['Kein Papierkorb beim Anbieter gefunden; nichts wurde verschoben.', 'No provider trash found; nothing was moved.', 'Корзина у провайдера не найдена; ничего не перемещено.', 'Nie znaleziono kosza u dostawcy; nic nie przeniesiono.'],
    noId: ['Ohne Mail-Kennung wird nicht verschoben (kein sicherer Rückweg).', 'Without a message ID nothing is moved (no safe way back).', 'Без идентификатора письмо не перемещается (нет надёжного возврата).', 'Bez identyfikatora nic nie jest przenoszone (brak bezpiecznego powrotu).'],
    unsubH: ['📭 Newsletter abmelden', '📭 Unsubscribe newsletters', '📭 Отписаться от рассылок', '📭 Wypisz się z newsletterów'],
    unsubIntro: ['Der Abmelde-Weg steht unsichtbar in der Mail. ⚡ direkt: die App meldet Sie selbst ab. ✉ per Mail: die App schickt nach Ihrer Bestätigung eine kurze Abmelde-Mail. 🌐 Webseite: die Abmelde-Seite öffnet sich, dort bestätigen Sie.', 'The unsubscribe way is hidden in the mail. ⚡ direct: the app unsubscribes for you. ✉ by mail: after you confirm, the app sends a short unsubscribe mail. 🌐 web page: the unsubscribe page opens and you confirm there.', 'Способ отписки скрыт в письме. ⚡ напрямую: приложение отпишет само. ✉ письмом: после подтверждения приложение отправит короткое письмо. 🌐 сайт: откроется страница отписки.', 'Sposób wypisania jest ukryty w mailu. ⚡ bezpośrednio: aplikacja wypisze sama. ✉ mailem: po potwierdzeniu aplikacja wyśle krótki mail. 🌐 strona: otworzy się strona wypisania.'],
    unsub: ['Abmelden', 'Unsubscribe', 'Отписаться', 'Wypisz się'],
    wayOne: ['⚡ direkt', '⚡ direct', '⚡ напрямую', '⚡ bezpośrednio'],
    wayMail: ['✉ per Mail', '✉ by mail', '✉ письмом', '✉ mailem'],
    wayPage: ['🌐 Webseite', '🌐 web page', '🌐 сайт', '🌐 strona'],
    unsubbed: ['abgemeldet am', 'unsubscribed on', 'отписка', 'wypisano'],
    unsubPage: ['Seite geöffnet – dort bestätigen', 'Page opened – confirm there', 'Страница открыта – подтвердите там', 'Strona otwarta – potwierdź tam'],
    unsubDone: ['✓ Erledigt', '✓ Done', '✓ Готово', '✓ Gotowe'],
    unsubOk: ['Abgemeldet.', 'Unsubscribed.', 'Отписка выполнена.', 'Wypisano.'],
    unsubFail: ['Der Versender hat die Abmeldung nicht bestätigt. Bitte über die Webseite abmelden.', 'The sender did not confirm. Please unsubscribe on the web page.', 'Отправитель не подтвердил. Отпишитесь на сайте.', 'Nadawca nie potwierdził. Wypisz się na stronie.'],
    unsubSuspect: ['⚠ Verdacht auf Spam oder Betrug – nicht abmelden, das bestätigt nur Ihre Adresse.', '⚠ Possible spam or fraud – do not unsubscribe, it only confirms your address.', '⚠ Подозрение на спам или мошенничество – не отписывайтесь, это лишь подтвердит адрес.', '⚠ Podejrzenie spamu lub oszustwa – nie wypisuj się, to tylko potwierdza adres.'],
    confirmUnsubMail: ['Abmelde-Mail jetzt senden an', 'Send unsubscribe mail now to', 'Отправить письмо об отписке на', 'Wysłać teraz mail wypisania do'],
    unsubNoWay: ['kein Abmelde-Weg gefunden', 'no unsubscribe way found', 'способ отписки не найден', 'nie znaleziono sposobu wypisania'],
    unsubAsk: ['Künftig Absender, die Sie als „📰 Ist Werbung“ markieren, selbst abmelden? Nur wo es direkt geht (⚡); Mails und Webseiten fragen weiter.', 'From now on, unsubscribe senders you mark as “📰 Is advertising” by yourself? Only where it works directly (⚡); mails and web pages still ask.', 'Впредь отписываться самостоятельно от отправителей с пометкой «📰 Это реклама»? Только где можно напрямую (⚡).', 'Odtąd samodzielnie wypisywać nadawców oznaczonych „📰 To reklama”? Tylko tam, gdzie da się bezpośrednio (⚡).'],
    unsubAutoYes: ['Ja, selbst abmelden', 'Yes, unsubscribe by itself', 'Да, отписываться самому', 'Tak, wypisuj sam'],
    unsubAutoNo: ['Nein, immer fragen', 'No, always ask', 'Нет, всегда спрашивать', 'Nie, zawsze pytaj'],
    unsubAutoOn: ['Werbe-Absender werden selbst abgemeldet (nur ⚡ direkt).', 'Advertising senders are unsubscribed by themselves (⚡ direct only).', 'От рекламных отправителей отписка автоматически (только ⚡).', 'Nadawcy reklam są wypisywani automatycznie (tylko ⚡).'],
    unsubAutoOff: ['Ausschalten', 'Turn off', 'Выключить', 'Wyłącz'],
    unsubStill: ['kommt weiter, obwohl abgemeldet am', 'still arriving although unsubscribed on', 'продолжает приходить после отписки', 'nadal przychodzi mimo wypisania'],
    unsubAgain: ['Nochmals abmelden', 'Unsubscribe again', 'Отписаться снова', 'Wypisz ponownie'],
    unnamed: ['(ohne Absender)', '(no sender)', '(без отправителя)', '(bez nadawcy)'],
    noSubject: ['(kein Betreff)', '(no subject)', '(без темы)', '(bez tematu)']
  };
  const t = key => (labels[key] || [key])[Math.max(0, languages.indexOf(document.documentElement.lang.slice(0, 2)))] || labels[key]?.[0] || key;
  const DAY = 864e5, YEAR = 365 * DAY, INTERVAL = 30 * 60 * 1000;
  const KEYS = { since: 'pb_mail_index_since', state: 'pb_mail_index_state', view: 'pb_mail_index_view', last: 'pb_mail_index_last', unsubAuto: 'pb_mail_unsub_auto' };
  function load(key, fallback) { try { const v = JSON.parse(localStorage.getItem(key)); return v ?? fallback; } catch { return fallback; } }
  function store(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* Preference only. */ } }
  const view = Object.assign({ mode: 'senders', order: 'newest', account: 'all' }, load(KEYS.view, {}));
  if (!['senders', 'list', 'clean'].includes(view.mode)) view.mode = 'senders';
  if (!['newest', 'oldest'].includes(view.order)) view.order = 'newest';

  // ---------- helpers ----------
  const many = n => n + ' ' + t(n === 1 ? 'mail' : 'mails');
  const fold = s => String(s || '').toLocaleLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ß/g, 'ss');
  function senderAddress(from) {
    const s = String(from || '').split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/)[0] || '';
    const m = s.match(/<([^<>\s]+@[^<>\s]+)>/) || s.match(/([^\s<>"',;]+@[^\s<>"',;]+)/);
    return (m ? m[1] : s).trim().toLocaleLowerCase();
  }
  function senderName(from) {
    const s = String(from || '').split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/)[0] || '';
    const name = s.replace(/<[^>]*>/, '').replace(/^["'\s]+|["'\s]+$/g, '').trim();
    return name && !name.includes('@') ? name : senderAddress(from) || t('unnamed');
  }
  function htmlToText(html) {
    if (!html) return '';
    try {
      // DOMParser documents are inert: no scripts run, no images or styles load.
      const doc = new DOMParser().parseFromString(String(html), 'text/html');
      for (const n of doc.querySelectorAll('script,style,head,noscript,template')) n.remove();
      return (doc.body?.innerText || doc.body?.textContent || '').replace(/[ \t\u00a0]+/g, ' ').replace(/\n\s*\n\s*\n+/g, '\n\n').trim();
    } catch { return ''; }
  }
  const locKey = (account, folder, validity, uid) => account + '\n' + folder + '\n' + validity + '\n' + uid;
  const hashText = async text => sha256(new TextEncoder().encode(text).buffer);
  const indexed = () => CATALOG.filter(r => r.mailIndex && r.mail);
  const visible = () => indexed().filter(r => !r.mailTrashed);
  // The header choice "Alle Konten" or one account narrows every list, search and clean-up view.
  const shown = () => view.account === 'all' ? visible() : visible().filter(r => (r.mailRemotes || []).some(l => l.account === view.account));
  function knownAccounts() { const map = new Map(); for (const r of indexed()) for (const l of r.mailRemotes || []) if (l.email && !map.has(l.account)) map.set(l.account, l.email); return map; }
  const SVG = 'http://www.w3.org/2000/svg';
  function refreshIcon() { const svg = document.createElementNS(SVG, 'svg'); svg.setAttribute('viewBox', '0 0 24 24'); svg.setAttribute('aria-hidden', 'true'); svg.classList.add('mail-all-icon'); const path = document.createElementNS(SVG, 'path'); path.setAttribute('d', 'M20 11a8 8 0 0 0-14.9-3.9M4 4v4h4M4 13a8 8 0 0 0 14.9 3.9M20 20v-4h-4'); svg.append(path); return svg; }
  function fmtDate(ms) { return ms ? new Date(ms).toLocaleDateString(document.documentElement.lang || 'de', { day: '2-digit', month: '2-digit', year: 'numeric' }) : ''; }
  function fmtTime(ms) { return ms ? new Date(ms).toLocaleString(document.documentElement.lang || 'de', { dateStyle: 'short', timeStyle: 'short' }) : ''; }

  // ---------- catalog records ----------
  function textFields(rec) {
    const text = [rec.name, 'Von: ' + (rec.mail.from || ''), 'An: ' + (rec.mail.to || ''), rec.mailBody].filter(Boolean).join('\n');
    const toks = tokens((rec.name + ' ').repeat(2) + ' ' + text);
    rec.vector = buildVector(toks); rec.tf = termFreq(toks); rec.snippet = text.slice(0, typeof SNIPPET_LEN !== 'undefined' ? SNIPPET_LEN : 600);
    rec.summary = summarize(rec.mailBody || ''); rec.nameTokens = tokens(rec.name); delete rec.evec;
  }
  function addLocation(rec, loc) {
    const list = (rec.mailRemotes || []).filter(x => !(x.account === loc.account && x.folder === loc.folder));
    list.push(loc); rec.mailRemotes = list.slice(-20);
    rec.mailRemote = { base: device.base, ...rec.mailRemotes[0] };
  }
  /** The hidden unsubscribe field, else a visible "abmelden" link from the text. Kept as found, never sent anywhere. */
  function unsubInfo(item, body, before) {
    const U = window.PBUnsub; if (!U) return before;
    const head = U.parse(item.unsubscribe || ''), page = body ? U.pageLink(body.html, body.text) : before?.page || '';
    const info = { https: head.https || before?.https || '', mailto: head.mailto || before?.mailto || '', oneClick: Boolean(item.oneClick && head.https) || Boolean(before?.oneClick && !item.unsubscribe), page: page || before?.page || '' };
    return info.https || info.mailto || info.page ? info : undefined;
  }
  /** Overwrite in place: server facts change, the user's own marks and folders stay. */
  function overwrite(rec, item, body, loc, accountEmail) {
    const checkedText = rec.pruefung?.mail ? JSON.stringify([rec.mail?.from || '', rec.mail?.to || '', rec.mail?.subject || rec.name || '', rec.mailBody || rec.snippet || '']) : null;
    const before = JSON.stringify([rec.name, rec.mail?.from, rec.mail?.to, rec.mail?.subject, rec.date, rec.mailSeen, rec.mailFlagged, rec.mailList, rec.mailBody, rec.mailRemotes]);
    rec.name = (item.subject || rec.name || t('noSubject')).slice(0, 140);
    rec.mail = { ...(rec.mail || {}), from: item.from || rec.mail?.from || '', subject: item.subject || rec.mail?.subject || '', date: item.date ? new Date(item.date).toUTCString() : rec.mail?.date || '' };
    if (!rec.mail.to) rec.mail.to = accountEmail || '';
    if (item.date) rec.date = item.date;
    rec.mailIndex = 1; rec.mailSeen = Boolean(item.seen); rec.mailFlagged = Boolean(item.flagged);
    rec.mailList = Boolean(item.list || item.bulk); rec.mailMessageId = item.messageId || rec.mailMessageId || '';
    const unsub = unsubInfo(item, body, rec.mailUnsub); if (unsub) rec.mailUnsub = unsub;
    if (body) { rec.mailHasAttachments = Boolean(body.attachments); const text = body.text || htmlToText(body.html); if (text && text.length >= (rec.mailBody || '').length) { rec.mailBody = text.slice(0, 8000); rec.size = text.length; } }
    if (rec.mailBody == null) rec.mailBody = '';
    addLocation(rec, loc); rec.tags = rec.tags || []; rec.dupes = rec.dupes || [];
    // Found again in a read folder: someone took it back out of the trash. Never move it by itself again.
    if (rec.mailTrashed) { delete rec.mailTrashed; rec.mailKeep = 1; }
    const changed = before !== JSON.stringify([rec.name, rec.mail?.from, rec.mail?.to, rec.mail?.subject, rec.date, rec.mailSeen, rec.mailFlagged, rec.mailList, rec.mailBody, rec.mailRemotes]);
    if (changed) textFields(rec);
    // Keep historical findings, but never present a check of an older text as the current one.
    if (checkedText !== null && checkedText !== JSON.stringify([rec.mail?.from || '', rec.mail?.to || '', rec.mail?.subject || rec.name || '', rec.mailBody || rec.snippet || ''])) rec.pruefung = { ...rec.pruefung, mailStale: true };
    return changed;
  }
  async function create(item, body, loc, accountEmail, ctx) {
    const text = (body?.text || htmlToText(body?.html) || '').slice(0, 8000);
    const subject = item.subject || '';
    const key = item.messageId ? 'mail-id:' + item.messageId : 'mail:' + (item.from || '') + '|' + subject + '|' + (item.date || '') + '|' + text.slice(0, 4000);
    const hash = await hashText(key);
    const existing = HASHSET.has(hash) && CATALOG.find(r => r.hash === hash);
    if (existing) { overwrite(existing, item, body, loc, accountEmail); return existing; }
    const name = (subject || t('noSubject')).slice(0, 140);
    const rec = { hash, name, path: 'Mail/' + senderName(item.from).replace(/[<>\/\\]/g, ' ').trim().slice(0, 60) + '/' + name.slice(0, 80),
      type: 'message/rfc822', ext: 'eml', date: item.date || Date.now(), size: text.length, via: 'Mail', category: 'E-Mail', dirId: null,
      dupes: [], tags: [], localSource: null, mailBody: text,
      mail: { from: item.from || '', to: accountEmail || '', cc: '', subject, date: item.date ? new Date(item.date).toUTCString() : '' },
      mailIndex: 1, mailMessageId: item.messageId || '', mailSeen: Boolean(item.seen), mailFlagged: Boolean(item.flagged),
      mailList: Boolean(item.list || item.bulk), mailHasAttachments: Boolean(body?.attachments) };
    const unsub = unsubInfo(item, body); if (unsub) rec.mailUnsub = unsub;
    addLocation(rec, loc); textFields(rec);
    const known = ctx.senders.get(senderAddress(item.from));
    if (known?.mark) rec.mailSenderMark = known.mark;
    if (known?.rule) rec.mailSenderRule = known.rule;
    if (!item.messageId) {
      // Without an identifier, a near twin is only flagged; the user decides in "Doppelte".
      const twin = (ctx.twins.get(twinKey(item.from, subject)) || []).find(r => r.hash !== hash && !r.mailDupeChecked && Math.abs((r.date || 0) - (item.date || 0)) <= DAY);
      if (twin) rec.mailDupeOf = twin.hash;
    }
    CATALOG.push(rec); HASHSET.add(hash); addTwin(ctx.twins, rec);
    return rec;
  }
  /** Same mail filed earlier without identifier (older "Katalogisieren"): adopt it instead of a copy. */
  function legacyTwin(item, ctx) {
    if (!item.date) return null;
    const found = (ctx.legacy.get(twinKey(item.from, item.subject)) || []).find(r => !r.mailMessageId && Math.abs((r.date || 0) - item.date) <= 120000);
    if (found) found.mailLegacy = 1;
    return found || null;
  }
  const twinKey = (from, subject) => senderAddress(from) + '\n' + fold(subject);
  function addTwin(map, rec) { const key = twinKey(rec.mail.from, rec.mail.subject || rec.name), list = map.get(key) || []; list.push(rec); map.set(key, list); }

  // ---------- sync ----------
  let running = null, stopRequested = false, lastProblem = '', progressText = '';
  async function folderState() { return load(KEYS.state, {}); }
  async function stateKey(account, path) { return (await hashText('state\n' + account + '\n' + path)).slice(0, 32); }
  function chooseFolders(folders) {
    const roles = window.PBMailFolders ? PBMailFolders.resolve(folders).roles : new Map();
    const skip = new Set(['trash', 'spam', 'draft', 'sent', 'outbox'].map(r => roles.get(r)?.path).filter(Boolean));
    return folders.filter(f => !f.collection && !skip.has(f.path) && !['\\Trash', '\\Junk', '\\Drafts', '\\Sent'].includes(f.specialUse))
      .sort((a, b) => (b.path === 'INBOX') - (a.path === 'INBOX'));
  }
  async function syncFolder(acc, folder, ctx, states) {
    const key = await stateKey(acc.id, folder.path), st = states[key] || {};
    let before = 0;
    while (!stopRequested) {
      const page = await device.index({ account: acc.id, folder: folder.path, since: ctx.since, before });
      if (st.validity !== page.validity) { st.validity = page.validity; st.complete = null; }
      const loc = uid => ({ account: acc.id, email: acc.email, folder: folder.path, validity: page.validity, uid });
      const need = [];
      let fresh = 0, changed = false;
      for (const item of page.items) {
        const known = ctx.known.get(locKey(acc.id, folder.path, page.validity, item.uid));
        if (known) { if (overwrite(known, item, null, loc(item.uid), acc.email)) { await idbPut('catalog', known); changed = true; } continue; }
        fresh++;
        const same = (item.messageId && ctx.byId.get(item.messageId)) || legacyTwin(item, ctx);
        // Already filed from another folder or account: one entry that knows both places.
        if (same && same.mailBody) { overwrite(same, item, null, loc(item.uid), acc.email); await idbPut('catalog', same); remember(same, ctx); changed = true; ctx.count++; }
        else need.push({ item, same });
      }
      for (let i = 0; i < need.length && !stopRequested; i += 10) {
        const batch = need.slice(i, i + 10);
        const result = await device.indexText({ account: acc.id, folder: folder.path, validity: page.validity, uids: batch.map(x => x.item.uid) });
        const texts = new Map(result.items.map(x => [x.uid, x]));
        for (const { item, same } of batch) {
          const body = texts.get(item.uid) || { text: '', html: '', attachments: false };
          let rec = same;
          if (rec) overwrite(rec, item, body, loc(item.uid), acc.email);
          else rec = await create(item, body, loc(item.uid), acc.email, ctx);
          await idbPut('catalog', rec); remember(rec, ctx); ctx.count++;
        }
        changed = true;
        progress(acc.email + ' · ' + (window.PBMailFolders ? folder.name : folder.path) + ' · ' + ctx.count + ' ' + t('mails'));
      }
      if (changed) { rebuildIndex(); refreshAll(); draw(); }
      if (stopRequested) break;
      // A folder read completely once only needs its newest page until a known mail appears.
      if (!fresh && st.complete != null && st.complete <= ctx.since) break;
      if (page.next == null) { st.complete = ctx.since; break; }
      before = page.next;
    }
    states[key] = st; store(KEYS.state, states);
  }
  function remember(rec, ctx) {
    for (const l of rec.mailRemotes || []) ctx.known.set(locKey(l.account, l.folder, l.validity, l.uid), rec);
    if (rec.mailMessageId) ctx.byId.set(rec.mailMessageId, rec);
  }
  function context() {
    const ctx = { known: new Map(), byId: new Map(), twins: new Map(), legacy: new Map(), senders: senderSettings(), count: 0, since: load(KEYS.since, 0) };
    if (!ctx.since) { ctx.since = Date.now() - YEAR; store(KEYS.since, ctx.since); }
    for (const r of CATALOG) {
      if (!r.mail) continue;
      if (r.mailIndex) { addTwin(ctx.twins, r); remember(r, ctx); }
      else if (r.mailBody != null && r.mailKind !== 'draft') addTwin(ctx.legacy, r);
    }
    return ctx;
  }
  async function sync(auto = false) {
    if (running) return running;
    stopRequested = false; lastProblem = ''; progressText = t('running'); draw();
    running = (async () => {
      const ctx = context(), states = await folderState(), failed = [];
      let accounts = [];
      try { accounts = await device.accounts(); } catch (error) { lastProblem = error.message; return; }
      for (const acc of accounts) {
        if (stopRequested) break;
        try {
          const folders = await device.request('/' + encodeURIComponent(acc.id) + '/folders');
          for (const folder of chooseFolders(folders)) { if (stopRequested) break; await syncFolder(acc, folder, ctx, states); }
        } catch (error) {
          if (/APP_OFFLINE/.test(error.message)) { lastProblem = t('offline'); break; }
          failed.push(acc.email);
        }
      }
      if (failed.length) lastProblem = t('failed') + ' ' + failed.join(', ');
      if (!stopRequested && accounts.length) store(KEYS.last, { at: Date.now(), accounts: accounts.length });
      if (!accounts.length && !auto) lastProblem = t('noAccounts');
      if (!stopRequested && accounts.length) {
        const due = sorted().expired.filter(r => r.mailSenderRule === 'auto');
        if (due.length) await trashRecords(due, 'auto');
        await autoUnsubscribe();
      }
    })().finally(() => { running = null; progressText = stopRequested ? t('stopped') : ''; rebuildIndex(); refreshAll(); draw(); drawDupes(); });
    return running;
  }
  function progress(text) { progressText = text; if (status) status.textContent = text; }
  function autoRun() {
    if (running || document.visibilityState !== 'visible' || !load(KEYS.last, null)) return;
    sync(true).catch(() => {});
  }

  // ---------- clean-up: expiry, trash, undo ----------
  const expiryCache = new WeakMap();
  function validUntil(r) {
    const key = (r.mailBody || '').length + '|' + r.date + '|' + r.name;
    const hit = expiryCache.get(r);
    if (hit?.key === key) return hit.value;
    const value = window.PBMailExpiry ? PBMailExpiry.find(r.name + '\n' + (r.mailBody || ''), r.date || Date.now()) : { until: null, sure: false, phrase: '' };
    expiryCache.set(r, { key, value }); return value;
  }
  function senderSettings() {
    const map = new Map();
    for (const r of indexed()) {
      const key = senderAddress(r.mail.from), s = map.get(key) || {};
      if (r.mailSenderMark) s.mark = r.mailSenderMark;
      if (r.mailSenderRule) s.rule = r.mailSenderRule;
      if (r.mailUnsubbed && (!s.unsubbed || r.mailUnsubbed.at > s.unsubbed.at)) s.unsubbed = r.mailUnsubbed;
      map.set(key, s);
    }
    return map;
  }
  /** Sets a mark or rule for one sender on all of its entries; new mails inherit it. */
  async function setSender(address, field, value) {
    for (const r of indexed().filter(x => senderAddress(x.mail.from) === address)) {
      if (value) r[field] = value; else delete r[field];
      await idbPut('catalog', r);
    }
  }
  const isNewsletter = r => (r.mailList || r.mailSenderMark === 'ad') && r.mailSenderMark !== 'important';
  // A mail Klaus took back out of the trash is never moved again by itself.
  const guarded = r => r.mailFlagged || r.mailStar || r.mailSenderMark === 'important' || r.mailKeep || !r.mailMessageId;
  function sorted() {
    const out = { expired: [], check: [], running: [] };
    for (const r of shown().filter(isNewsletter)) {
      const v = validUntil(r);
      if (!v.until) out.check.push(r);
      else if (PBMailExpiry.expired(v.until) && !guarded(r)) out.expired.push(r);
      else if (PBMailExpiry.expired(v.until)) out.check.push(r);
      else out.running.push(r);
    }
    for (const list of Object.values(out)) list.sort(byOrder);
    return out;
  }
  async function trashFolder(account, cache) {
    if (cache.has(account)) return cache.get(account);
    let path = null;
    try { const folders = await device.request('/' + encodeURIComponent(account) + '/folders'); path = window.PBMailFolders?.resolve(folders).roles.get('trash')?.path || null; }
    catch (error) { lastProblem = error.message; }
    cache.set(account, path); return path;
  }
  let lastRun = null;
  /** Moves mails into the provider's trash. Only mails with a Message-ID, so undo can find them again. */
  async function trashRecords(list, reason) {
    const run = { id: crypto.randomUUID(), at: Date.now(), reason }, cache = new Map();
    let moved = 0;
    for (const r of list) {
      if (!r.mailMessageId) { lastProblem = t('noId'); continue; }
      const places = [];
      for (const l of r.mailRemotes || []) {
        const trash = await trashFolder(l.account, cache);
        if (!trash) { lastProblem = t('noTrash'); continue; }
        if (l.folder === trash) continue;
        try {
          await device.request('/' + encodeURIComponent(l.account) + '/messages/' + l.uid + '/action', { folder: l.folder, validity: l.validity, action: 'move', target: trash });
          places.push({ account: l.account, email: l.email, from: l.folder, trash });
        } catch (error) { lastProblem = error.message; }
      }
      if (!places.length) continue;
      r.mailRemotes = (r.mailRemotes || []).filter(l => !places.some(p => p.account === l.account && p.from === l.folder));
      r.mailRemote = r.mailRemotes[0] ? { base: device.base, ...r.mailRemotes[0] } : null;
      r.mailTrashed = { run: run.id, at: run.at, reason, places };
      await idbPut('catalog', r); moved++;
    }
    if (moved) lastRun = { ...run, count: moved }; // the undo banner says it once
    rebuildIndex(); refreshAll(); draw();
    return moved;
  }
  async function undoRun(id) {
    let back = 0, gone = 0;
    for (const r of indexed().filter(x => x.mailTrashed?.run === id)) {
      let left = [];
      for (const p of r.mailTrashed.places) {
        try {
          const found = await device.locate({ account: p.account, folder: p.trash, messageId: r.mailMessageId });
          if (!found.uid) { gone++; continue; }
          await device.request('/' + encodeURIComponent(p.account) + '/messages/' + found.uid + '/action', { folder: p.trash, validity: found.validity, action: 'move', target: p.from });
          back++;
        } catch (error) { lastProblem = error.message; left.push(p); }
      }
      if (left.length) r.mailTrashed.places = left; else { delete r.mailTrashed; r.mailKeep = 1; }
      await idbPut('catalog', r);
    }
    if (lastRun?.id === id) lastRun = null;
    progressText = back + ' · ' + t('restored') + (gone ? ' · ' + gone + ' ' + t('gone') : '');
    rebuildIndex(); refreshAll(); draw();
    await sync(true).catch(() => {}); // the restored mails get their new place on the server
  }
  // ---------- unsubscribe: hidden field, one-click, mail, page ----------
  function suspect(r) {
    try { return Boolean(window.PBSchutz && window.PBUnsub?.suspicious(PBSchutz.rules({ from: r.mail?.from || '', subject: r.name || '', text: r.mailBody || '' }))); }
    catch { return false; }
  }
  function newestWay(mails) {
    for (const r of [...mails].sort((a, b) => (b.date || 0) - (a.date || 0))) { const w = window.PBUnsub?.way(r.mailUnsub); if (w) return { w, r }; }
    return null;
  }
  const wayLabel = w => t(w.kind === 'oneclick' ? 'wayOne' : w.kind === 'mail' ? 'wayMail' : 'wayPage');
  /** One sender, one way. Mails are only sent after a confirmation, pages only opened, nothing retried by itself. */
  async function unsubscribe(address, mails, auto = false) {
    const found = newestWay(mails); if (!found) return false;
    const { w, r } = found;
    if (mails.some(suspect)) { progressText = t('unsubSuspect'); draw(); return false; }
    let state = null;
    try {
      if (w.kind === 'oneclick') {
        if (typeof device.unsubscribe !== 'function') return false;
        const res = await device.unsubscribe(w.url);
        if (res.ok) state = { at: Date.now(), way: 'oneclick' }; else lastProblem = t('unsubFail');
      } else if (auto) return false;
      else if (w.kind === 'mail') {
        const account = (r.mailRemotes || [])[0]?.account;
        if (!account || !confirm(t('confirmUnsubMail') + ' ' + w.to + '?')) return false;
        await device.request('/' + encodeURIComponent(account) + '/send', { submission: crypto.randomUUID(), to: w.to, subject: w.subject, text: w.text, cc: '', bcc: '' }, 'POST');
        state = { at: Date.now(), way: 'mail', to: w.to };
      } else {
        const links = window.Capacitor?.Plugins?.ProLinks;
        if (typeof links?.open !== 'function') return false;
        await links.open({ url: w.url });
        state = { at: Date.now(), way: 'page', pending: true };
      }
    } catch (error) { lastProblem = /APP_OFFLINE/.test(error.message) ? t('offline') : error.message; }
    if (state) { await setSender(address, 'mailUnsubbed', state); if (state.way !== 'page') toast(t('unsubOk')); }
    draw(); return Boolean(state);
  }
  // After a sync: with Klaus' consent, senders marked "Ist Werbung" are unsubscribed where it works directly.
  async function autoUnsubscribe() {
    if (!load(KEYS.unsubAuto, false) || !window.PBUnsub) return;
    const bySender = new Map();
    for (const r of indexed()) if (r.mailSenderMark === 'ad' && !r.mailUnsubbed) { const a = senderAddress(r.mail.from); bySender.set(a, [...(bySender.get(a) || []), r]); }
    for (const [address, mails] of bySender) { if (stopRequested) break; if (newestWay(mails)?.w.kind === 'oneclick') await unsubscribe(address, mails, true); }
  }
  function drawUnsub(list) {
    const bySender = new Map(), settings = senderSettings();
    for (const r of shown().filter(isNewsletter)) { const a = senderAddress(r.mail.from); bySender.set(a, [...(bySender.get(a) || []), r]); }
    const rows = [...bySender].map(([address, mails]) => ({ address, mails, found: newestWay(mails), state: settings.get(address)?.unsubbed }))
      .sort((a, b) => Number(Boolean(a.state)) - Number(Boolean(b.state)) || b.mails.length - a.mails.length);
    if (!rows.length) return;
    const head = el('h3', 'mail-all-section', t('unsubH') + ' (' + rows.filter(x => !x.state).length + ')'); head.dataset.mailClean = 'unsubH'; list.append(head);
    list.append(el('p', 'mail-muted', t('unsubIntro')));
    const auto = load(KEYS.unsubAuto, null);
    if (auto === true) { const p = el('p', 'mail-muted', t('unsubAutoOn') + ' '); p.append(button(t('unsubAutoOff'), () => { store(KEYS.unsubAuto, false); draw(); })); p.dataset.mailUnsubAuto = 'on'; list.append(p); }
    else if (auto === null && rows.some(x => x.state && x.state.way !== 'page')) {
      const box = el('div', 'mail-report mail-all-ask'); box.dataset.mailUnsubAsk = '1';
      box.append(el('p', '', t('unsubAsk')), button(t('unsubAutoYes'), () => { store(KEYS.unsubAuto, true); draw(); autoUnsubscribe().then(draw); }, 'mail-primary'), button(t('unsubAutoNo'), () => { store(KEYS.unsubAuto, false); draw(); }));
      list.append(box);
    }
    for (const { address, mails, found, state } of rows.slice(0, 200)) {
      const row = el('div', 'mail-all-unsub'); row.dataset.mailUnsub = address;
      const newest = Math.max(...mails.map(m => m.date || 0));
      const info = [senderName(mails[0].mail.from), many(mails.length)];
      const still = state && newest > state.at + 14 * DAY && state.way !== 'page';
      if (still) info.push(t('unsubStill') + ' ' + fmtDate(state.at));
      else if (state?.pending) info.push(t('unsubPage'));
      else if (state) info.push(t('unsubbed') + ' ' + fmtDate(state.at));
      else info.push(found ? wayLabel(found.w) : t('unsubNoWay'));
      row.append(el('span', 'mail-all-unsub-name', info.join(' · ')));
      if (!found) { /* nothing to offer */ }
      else if (mails.some(suspect)) row.append(el('span', 'mail-muted', t('unsubSuspect')));
      else if (state?.pending) row.append(button(t('unsubDone'), async () => { await setSender(address, 'mailUnsubbed', { ...state, pending: false, at: Date.now() }); draw(); }));
      else if (!state || still) { const b = button(still ? t('unsubAgain') : t('unsub'), () => unsubscribe(address, mails), 'mail-primary'); b.dataset.mailUnsubGo = found.w.kind; row.append(b); }
      list.append(row);
    }
  }
  function runs() {
    const map = new Map();
    for (const r of indexed()) if (r.mailTrashed) { const x = map.get(r.mailTrashed.run) || { id: r.mailTrashed.run, at: r.mailTrashed.at, reason: r.mailTrashed.reason, count: 0 }; x.count++; map.set(x.id, x); }
    return [...map.values()].sort((a, b) => b.at - a.at).slice(0, 10);
  }
  function chip(r) {
    if (!isNewsletter(r)) return '';
    const v = validUntil(r);
    return v.until ? t('until') + ' ' + new Date(v.until).toLocaleDateString(document.documentElement.lang || 'de', { day: '2-digit', month: '2-digit' }) : t('noDate');
  }
  function drawClean(list) {
    const groupsBy = sorted(), settings = senderSettings();
    list.append(el('p', 'mail-muted', t('cleanIntro')));
    const asked = new Map();
    for (const r of groupsBy.expired) { const a = senderAddress(r.mail.from); if (!settings.get(a)?.rule) asked.set(a, [...(asked.get(a) || []), r]); }
    for (const [address, mails] of asked) {
      const box = el('div', 'mail-report mail-all-ask'); box.dataset.mailAsk = address;
      box.append(el('p', '', senderName(mails[0].mail.from) + ': ' + mails.length + ' ' + t('ask')));
      box.append(button(t('yesAuto'), async () => { await setSender(address, 'mailSenderRule', 'auto'); await trashRecords(mails, 'auto'); }, 'mail-primary'),
        button(t('noAuto'), async () => { await setSender(address, 'mailSenderRule', 'no'); draw(); }));
      list.append(box);
    }
    drawUnsub(list);
    const section = (key, mails, extra) => {
      const head = el('h3', 'mail-all-section', t(key) + ' (' + mails.length + ')'); head.dataset.mailClean = key; list.append(head);
      if (extra) list.append(extra);
      for (const r of mails.slice(0, 200)) {
        const wrap = el('div', 'mail-all-clean-row'); wrap.append(mailRow(r));
        if (key === 'checkH' && r.mailMessageId) wrap.append(button(t('trashOne'), async () => { if (confirm(t('confirmTrash'))) await trashRecords([r], 'manual'); }));
        list.append(wrap);
      }
    };
    section('expiredH', groupsBy.expired, groupsBy.expired.length ? button(t('trashAll'), async () => { if (confirm(groupsBy.expired.length + ' · ' + t('confirmTrash'))) await trashRecords(groupsBy.expired, 'manual'); }, 'mail-primary') : null);
    section('checkH', groupsBy.check);
    section('runningH', groupsBy.running);
    const past = runs();
    if (past.length) {
      list.append(el('h3', 'mail-all-section', t('trashedH')));
      for (const run of past) {
        const row = el('div', 'mail-all-run'); row.dataset.mailRun = run.id;
        row.append(el('span', '', fmtTime(run.at) + ' · ' + many(run.count) + (run.reason === 'auto' ? ' · ' + t('automatic') : '')), button(t('undo'), () => undoRun(run.id)));
        list.append(row);
      }
    }
  }

  // ---------- view ----------
  const panel = document.createElement('section'); panel.className = 'mail-app mail-all'; panel.hidden = true; panel.id = 'pb-mail-all';
  let status = null, selectedSender = null, openRecord = null, query = '';
  host.append(panel);
  function show(on) {
    panel.hidden = !on; host.classList.toggle('mail-all-open', on);
    if (on) { panel.scrollTop = 0; draw(); }
  }
  /** First entry of the mailbox folder bar; costs no extra row on a phone. */
  function entry() {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'mail-folder'; b.dataset.mailAll = 'open';
    b.setAttribute('aria-current', 'false'); b.append(t('open'), el('small', '', String(visible().length || '')));
    b.onclick = () => show(true); return b;
  }
  function button(text, fn, cls = '') {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'mail-button' + (cls ? ' ' + cls : ''); b.textContent = text;
    b.onclick = () => fn(); return b;
  }
  function el(tag, cls, text) { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
  function matches(r) {
    if (!query.trim()) return true;
    const hay = fold(r.name + ' ' + (r.mail.from || '') + ' ' + (r.mailBody || ''));
    return fold(query).split(/\s+/).filter(Boolean).every(word => hay.includes(word));
  }
  const byOrder = (a, b) => view.order === 'newest' ? (b.date || 0) - (a.date || 0) : (a.date || 0) - (b.date || 0);
  function groups(mails) {
    const map = new Map();
    for (const r of mails) {
      const key = senderAddress(r.mail.from) || '?';
      const g = map.get(key) || { key, name: senderName(r.mail.from), mails: [], newest: 0, list: false };
      g.mails.push(r); g.newest = Math.max(g.newest, r.date || 0); g.list = g.list || r.mailList; map.set(key, g);
    }
    return [...map.values()].sort((a, b) => view.order === 'newest' ? b.newest - a.newest : a.newest - b.newest);
  }
  function mailRow(r) {
    const row = el('div', 'mail-item' + (!r.mailSeen ? ' unread' : '')), b = el('button');
    b.type = 'button'; b.dataset.mailAllId = r.hash;
    b.append(el('span', 'mail-avatar', senderName(r.mail.from).slice(0, 1).toUpperCase()),
      el('span', 'mail-subject', (r.mailFlagged ? '★ ' : '') + (r.name || t('noSubject'))),
      el('span', 'mail-preview', [senderName(r.mail.from), chip(r), (r.mailBody || '').replace(/\s+/g, ' ').slice(0, 80)].filter(Boolean).join(' · ')),
      el('time', 'mail-date', fmtDate(r.date)));
    b.onclick = () => { openRecord = r.hash; draw(); };
    row.append(el('span'), b); return row;
  }
  function drawReader(r) {
    const box = el('div', 'mail-all-reader');
    box.append(button(t('backList'), () => { openRecord = null; draw(); }, 'mail-back'), el('h3', '', r.name || t('noSubject')),
      el('p', 'mail-muted', (r.mail.from || '') + ' · ' + fmtTime(r.date)));
    const where = (r.mailRemotes || []).map(l => (l.email || '') + ' · ' + l.folder).join(' | ');
    if (where) box.append(el('p', 'mail-muted', t('account') + ': ' + where));
    const marks = el('p', 'mail-muted'); marks.textContent = [r.mailList ? t('newsletter') : '', chip(r), guarded(r) && isNewsletter(r) ? t('protected') : '', r.mailSenderRule === 'auto' ? t('autoOn') : '', r.mailHasAttachments ? t('attachments') : ''].filter(Boolean).join(' · ');
    if (marks.textContent) box.append(marks);
    if (window.PBRecordStatus) {
      const state = el('div', 'pb-mail-index-status');
      state.dataset.hash = r.hash;
      state.append(PBRecordStatus.render(r));
      if (window.PBCheck?.badge) state.append(PBCheck.badge(r));
      state.append(el('p', 'hint pb-mail-index-scope', t('textScope')));
      box.append(state);
    }
    const address = senderAddress(r.mail.from), tools = el('div', 'mail-reader-actions');
    for (const [key, value] of [['isAd', 'ad'], ['isImportant', 'important']]) {
      const b = button(t(key), async () => { await setSender(address, 'mailSenderMark', r.mailSenderMark === value ? '' : value); draw(); });
      b.setAttribute('aria-pressed', String(r.mailSenderMark === value)); b.dataset.mailMark = value; tools.append(b);
    }
    const readerWay = isNewsletter(r) && window.PBUnsub?.way(r.mailUnsub);
    if (readerWay && !r.mailUnsubbed && !suspect(r)) { const b = button(t('unsub') + ' · ' + wayLabel(readerWay), () => unsubscribe(address, indexed().filter(x => senderAddress(x.mail.from) === address))); b.dataset.mailUnsubGo = readerWay.kind; tools.append(b); }
    else if (r.mailUnsubbed) tools.append(el('span', 'mail-muted', t('unsubbed') + ' ' + fmtDate(r.mailUnsubbed.at)));
    if (r.mailMessageId && r.mailRemotes?.length) tools.append(button(t('trashOne'), async () => { if (confirm(t('confirmTrash'))) { await trashRecords([r], 'manual'); openRecord = null; draw(); } }));
    box.append(tools);
    box.append(el('pre', 'mail-text', r.mailBody || t('textMissing')));
    if (window.PBLiveMail?.openRemote && r.mailRemotes?.length) box.append(button(t('provider'), async () => {
      const l = r.mailRemotes[0]; show(false);
      await PBLiveMail.openRemote({ account: l.account, folder: l.folder, validity: l.validity, uid: l.uid, subject: r.name, from: r.mail.from, date: r.date });
    }, 'mail-primary'));
    return box;
  }
  function draw() {
    for (const b of host.querySelectorAll('[data-mail-all=open]')) b.firstChild.nodeValue = t('open');
    if (panel.hidden) return;
    const keepFocus = document.activeElement?.dataset?.mailAll === 'search', caret = keepFocus ? document.activeElement.selectionStart : 0;
    panel.replaceChildren();
    const head = el('div', 'mail-head mail-all-head'), last = load(KEYS.last, null);
    const back = button(t('close'), () => show(false), 'mail-back'); back.title = t('closeLong'); back.setAttribute('aria-label', t('closeLong'));
    // One row: Zurück · Kontoauswahl (zeigt „Alle Konten“ oder die Adresse) · ⟳ · ⋯
    const accounts = knownAccounts(), pick = el('select', 'mail-all-account'); pick.setAttribute('aria-label', t('chooseAccount')); pick.dataset.mailAll = 'account';
    pick.append(new Option(t('title'), 'all'), ...[...accounts].map(([id, email]) => new Option(email, id)));
    if (view.account !== 'all' && !accounts.has(view.account)) view.account = 'all';
    pick.value = view.account; pick.onchange = () => { view.account = pick.value; selectedSender = null; openRecord = null; store(KEYS.view, view); draw(); };
    const title = el('h2', 'mail-all-title', t('title')); title.hidden = accounts.size > 0;
    head.append(back, title); if (accounts.size) head.append(pick);
    if (running) head.append(button(t('stop'), () => { stopRequested = true; progress(t('stopped')); }));
    else if (last) { const again = button('', () => sync(false), 'mail-all-refresh'); again.append(refreshIcon()); again.title = t('refresh'); again.setAttribute('aria-label', t('refresh')); again.dataset.mailAll = 'refresh'; head.append(again); }
    else head.append(button(t('fetch'), () => sync(false), 'mail-primary'));
    const tools = el('details', 'mail-account-tools'), summary = el('summary', 'mail-button', t('more')), menu = el('div', 'mail-account-menu');
    menu.append(button(t('older'), () => { tools.open = false; store(KEYS.since, (load(KEYS.since, 0) || Date.now() - YEAR) - YEAR); sync(false); }));
    tools.append(summary, menu); if (!running) head.append(tools);
    panel.append(head);
    status = el('p', 'mail-notice'); status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite');
    const all = shown(), since = load(KEYS.since, 0);
    status.textContent = running ? progressText : [progressText, lastProblem, last ? t('last') + ' ' + fmtTime(last.at) + ' · ' + all.length + ' ' + t('mails') + ' · ' + last.accounts + ' ' + t('accounts') + (since ? ' · ' + t('since') + ' ' + fmtDate(since) : '') : t('never')].filter(Boolean).join(' · ');
    panel.append(status);
    if (lastRun && !running) {
      const banner = el('div', 'mail-undo'); banner.dataset.mailUndo = lastRun.id;
      banner.append(el('span', '', '🗑 ' + many(lastRun.count) + ' ' + t('moved')), button(t('undo'), () => undoRun(lastRun.id)));
      panel.append(banner);
    }
    if (!last && !all.length) { panel.append(el('p', 'mail-muted', t('intro'))); return; }
    const search = el('input'); search.type = 'search'; search.placeholder = t('search'); search.setAttribute('aria-label', t('search')); search.value = query; search.dataset.mailAll = 'search';
    search.oninput = () => { query = search.value; selectedSender = query ? null : selectedSender; openRecord = null; draw(); };
    const switches = el('div', 'mail-list-actions mail-all-switch');
    const modeList = button(t('list'), () => { view.mode = 'list'; selectedSender = null; openRecord = null; store(KEYS.view, view); draw(); });
    const modeSenders = button(t('senders'), () => { view.mode = 'senders'; openRecord = null; store(KEYS.view, view); draw(); });
    const modeClean = button(t('clean'), () => { view.mode = 'clean'; selectedSender = null; openRecord = null; store(KEYS.view, view); draw(); });
    modeList.setAttribute('aria-pressed', String(view.mode === 'list')); modeSenders.setAttribute('aria-pressed', String(view.mode === 'senders')); modeClean.setAttribute('aria-pressed', String(view.mode === 'clean'));
    modeClean.dataset.mailAll = 'clean'; modeList.dataset.mailAll = 'list'; modeSenders.dataset.mailAll = 'senders';
    const order = button('↕ ', () => { view.order = view.order === 'newest' ? 'oldest' : 'newest'; store(KEYS.view, view); draw(); });
    // On a phone only the arrow shows; the full name stays for tooltips and screen readers.
    order.append(el('span', 'mail-all-order-label', view.order === 'newest' ? t('newest') : t('oldest')));
    order.dataset.mailAll = 'order'; order.title = view.order === 'newest' ? t('newestLong') : t('oldestLong'); order.setAttribute('aria-label', order.title);
    switches.append(modeList, modeSenders, modeClean, order);
    panel.append(search, switches);
    if (keepFocus) { search.focus(); try { search.setSelectionRange(caret, caret); } catch { /* Not every input supports it. */ } }
    const current = openRecord && all.find(r => r.hash === openRecord);
    if (current) { panel.append(drawReader(current)); return; }
    const mails = all.filter(matches).sort(byOrder);
    const list = el('div', 'mail-all-list');
    if (query.trim()) panel.append(el('p', 'mail-count', mails.length + ' ' + t('hits')));
    if (view.mode === 'clean' && !query.trim()) drawClean(list);
    else if (view.mode === 'senders' && !query.trim()) {
      const g = selectedSender && groups(mails).find(x => x.key === selectedSender);
      if (g) {
        list.append(button(t('back'), () => { selectedSender = null; draw(); }, 'mail-back'), el('h3', '', g.name), el('p', 'mail-muted', g.key + ' · ' + many(g.mails.length)));
        for (const r of g.mails.sort(byOrder)) list.append(mailRow(r));
      } else {
        for (const x of groups(mails)) {
          const row = el('div', 'mail-item'), b = el('button'); b.type = 'button'; b.dataset.mailSender = x.key;
          b.append(el('span', 'mail-avatar', x.name.slice(0, 1).toUpperCase()), el('span', 'mail-subject', (x.list ? '📰 ' : '') + x.name),
            el('span', 'mail-preview', x.key + ' · ' + many(x.mails.length)), el('time', 'mail-date', fmtDate(x.newest)));
          b.onclick = () => { selectedSender = x.key; draw(); };
          row.append(el('span', 'mail-count-badge', String(x.mails.length)), b); list.append(row);
        }
      }
    } else for (const r of mails.slice(0, 500)) list.append(mailRow(r));
    if (!list.childElementCount) list.append(el('p', 'mail-muted', t('empty')));
    panel.append(list);
  }

  // ---------- uncertain duplicates, shown in the "Doppelte" page ----------
  const dupesHost = document.getElementById('panel-dupes');
  const dupesBox = el('div', 'card mail-app mail-all-dupes'); dupesBox.id = 'pb-mail-dupes';
  if (dupesHost) dupesHost.append(dupesBox);
  function drawDupes() {
    if (!dupesHost) return;
    const pairs = visible().filter(r => r.mailDupeOf && !r.mailDupeChecked).map(r => [CATALOG.find(x => x.hash === r.mailDupeOf), r]).filter(p => p[0]);
    dupesBox.hidden = !pairs.length; dupesBox.replaceChildren();
    if (!pairs.length) return;
    dupesBox.append(el('div', 'fname', t('dupesTitle')), el('p', 'mail-muted', t('dupesHelp')));
    for (const [keep, other] of pairs) {
      const row = el('div', 'mail-all-dupe'); row.dataset.mailDupe = other.hash;
      row.append(el('strong', '', keep.name), el('p', 'mail-muted', senderName(keep.mail.from) + ' · ' + fmtTime(keep.date) + ' | ' + fmtTime(other.date)));
      row.append(button(t('same'), async () => {
        // Keep the older entry (it carries the user's marks), add the other's places, drop the twin.
        for (const l of other.mailRemotes || []) addLocation(keep, l);
        keep.tags = [...new Set([...(keep.tags || []), ...(other.tags || [])])];
        keep.mailStar = keep.mailStar || other.mailStar;
        await idbPut('catalog', keep); await idbDelete('catalog', other.hash);
        HASHSET.delete(other.hash); CATALOG = CATALOG.filter(r => r.hash !== other.hash);
        rebuildIndex(); refreshAll(); drawDupes(); toast(t('merged'));
      }), button(t('different'), async () => {
        other.mailDupeChecked = 1; await idbPut('catalog', other); drawDupes(); toast(t('kept'));
      }));
      dupesBox.append(row);
    }
  }
  function toast(text) { if (typeof window.toast === 'function') window.toast(text); else if (status) status.textContent = text; }

  new MutationObserver(() => { draw(); drawDupes(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  document.addEventListener('visibilitychange', () => { const last = load(KEYS.last, null); if (last && Date.now() - last.at > INTERVAL) autoRun(); });
  setInterval(autoRun, INTERVAL);
  setTimeout(autoRun, 5000);
  drawDupes();
  window.PBMailIndex = { entry, sync, trash: list => trashRecords(list, 'manual'), undo: undoRun, stop: () => { stopRequested = true; }, show, running: () => Boolean(running), senderAddress, senderName, unsubscribe: (address) => unsubscribe(address, indexed().filter(x => senderAddress(x.mail.from) === address)) };
})();
