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
    close: ['← Zurück zum Postfach', '← Back to mailbox', '← Назад к почте', '← Wróć do poczty'],
    title: ['Alle Konten', 'All accounts', 'Все аккаунты', 'Wszystkie konta'],
    fetch: ['📥 Alle Konten abrufen und einordnen', '📥 Fetch and sort all accounts', '📥 Загрузить и упорядочить все аккаунты', '📥 Pobierz i uporządkuj wszystkie konta'],
    refresh: ['📥 Jetzt aktualisieren', '📥 Update now', '📥 Обновить сейчас', '📥 Aktualizuj teraz'],
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
    senders: ['👤 Nach Absender', '👤 By sender', '👤 По отправителю', '👤 Według nadawcy'],
    newest: ['↕ Neueste oben', '↕ Newest first', '↕ Сначала новые', '↕ Najnowsze u góry'],
    oldest: ['↕ Älteste oben', '↕ Oldest first', '↕ Сначала старые', '↕ Najstarsze u góry'],
    back: ['← Alle Absender', '← All senders', '← Все отправители', '← Wszyscy nadawcy'],
    backList: ['← Zurück', '← Back', '← Назад', '← Wstecz'],
    empty: ['Keine Mails gefunden.', 'No emails found.', 'Писем не найдено.', 'Nie znaleziono wiadomości.'],
    provider: ['Beim Anbieter öffnen', 'Open with provider', 'Открыть у провайдера', 'Otwórz u dostawcy'],
    attachments: ['📎 Anhang beim Anbieter', '📎 Attachment at provider', '📎 Вложение у провайдера', '📎 Załącznik u dostawcy'],
    newsletter: ['📰 Newsletter', '📰 Newsletter', '📰 Рассылка', '📰 Newsletter'],
    account: ['Konto', 'Account', 'Аккаунт', 'Konto'],
    folder: ['Ordner', 'Folder', 'Папка', 'Folder'],
    textMissing: ['Der Text ist zu groß oder nur als Bild vorhanden. Beim Anbieter öffnen.', 'The text is too large or only an image. Open with provider.', 'Текст слишком большой или только картинка. Откройте у провайдера.', 'Tekst jest za duży lub tylko jako obraz. Otwórz u dostawcy.'],
    dupesTitle: ['✉️ Mails, die doppelt sein könnten', '✉️ Emails that may be duplicates', '✉️ Письма, которые могут повторяться', '✉️ Wiadomości, które mogą się powtarzać'],
    dupesHelp: ['Gleicher Absender und Betreff, aber anderer Text und keine Mail-Kennung. Nichts wurde überschrieben. Bitte entscheiden:', 'Same sender and subject, but different text and no message ID. Nothing was overwritten. Please decide:', 'Тот же отправитель и тема, но другой текст и нет идентификатора. Ничего не перезаписано. Решите:', 'Ten sam nadawca i temat, ale inny tekst i brak identyfikatora. Nic nie nadpisano. Zdecyduj:'],
    same: ['Gleich – zusammenlegen', 'Same – merge', 'Одинаковые – объединить', 'Takie same – połącz'],
    different: ['Verschieden – beide behalten', 'Different – keep both', 'Разные – оставить оба', 'Różne – zachowaj oba'],
    merged: ['Zusammengelegt. Ihre Markierungen bleiben erhalten.', 'Merged. Your marks are kept.', 'Объединено. Ваши отметки сохранены.', 'Połączono. Twoje oznaczenia zostały zachowane.'],
    kept: ['Beide bleiben erhalten.', 'Both are kept.', 'Оба сохранены.', 'Oba zachowane.'],
    unnamed: ['(ohne Absender)', '(no sender)', '(без отправителя)', '(bez nadawcy)'],
    noSubject: ['(kein Betreff)', '(no subject)', '(без темы)', '(bez tematu)']
  };
  const t = key => (labels[key] || [key])[Math.max(0, languages.indexOf(document.documentElement.lang.slice(0, 2)))] || labels[key]?.[0] || key;
  const DAY = 864e5, YEAR = 365 * DAY, INTERVAL = 30 * 60 * 1000;
  const KEYS = { since: 'pb_mail_index_since', state: 'pb_mail_index_state', view: 'pb_mail_index_view', last: 'pb_mail_index_last' };
  function load(key, fallback) { try { const v = JSON.parse(localStorage.getItem(key)); return v ?? fallback; } catch { return fallback; } }
  function store(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* Preference only. */ } }
  const view = Object.assign({ mode: 'senders', order: 'newest' }, load(KEYS.view, {}));
  if (!['senders', 'list'].includes(view.mode)) view.mode = 'senders';
  if (!['newest', 'oldest'].includes(view.order)) view.order = 'newest';

  // ---------- helpers ----------
  const many = n => n + ' ' + t(n === 1 ? 'mail' : 'mails');
  const fold = s => String(s || '').toLocaleLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ß/g, 'ss');
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
      return (doc.body?.innerText || doc.body?.textContent || '').replace(/[ \t ]+/g, ' ').replace(/\n\s*\n\s*\n+/g, '\n\n').trim();
    } catch { return ''; }
  }
  const locKey = (account, folder, validity, uid) => account + '\n' + folder + '\n' + validity + '\n' + uid;
  const hashText = async text => sha256(new TextEncoder().encode(text).buffer);
  const indexed = () => CATALOG.filter(r => r.mailIndex && r.mail);
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
  /** Overwrite in place: server facts change, the user's own marks and folders stay. */
  function overwrite(rec, item, body, loc, accountEmail) {
    const before = JSON.stringify([rec.name, rec.mail?.from, rec.date, rec.mailSeen, rec.mailFlagged, rec.mailList, rec.mailBody?.length, rec.mailRemotes]);
    rec.name = (item.subject || rec.name || t('noSubject')).slice(0, 140);
    rec.mail = { ...(rec.mail || {}), from: item.from || rec.mail?.from || '', subject: item.subject || rec.mail?.subject || '', date: item.date ? new Date(item.date).toUTCString() : rec.mail?.date || '' };
    if (!rec.mail.to) rec.mail.to = accountEmail || '';
    if (item.date) rec.date = item.date;
    rec.mailIndex = 1; rec.mailSeen = Boolean(item.seen); rec.mailFlagged = Boolean(item.flagged);
    rec.mailList = Boolean(item.list || item.bulk); rec.mailMessageId = item.messageId || rec.mailMessageId || '';
    if (body) { rec.mailHasAttachments = Boolean(body.attachments); const text = body.text || htmlToText(body.html); if (text && text.length >= (rec.mailBody || '').length) { rec.mailBody = text.slice(0, 8000); rec.size = text.length; } }
    if (rec.mailBody == null) rec.mailBody = '';
    addLocation(rec, loc); rec.tags = rec.tags || []; rec.dupes = rec.dupes || [];
    const changed = before !== JSON.stringify([rec.name, rec.mail?.from, rec.date, rec.mailSeen, rec.mailFlagged, rec.mailList, rec.mailBody?.length, rec.mailRemotes]);
    if (changed) textFields(rec);
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
    addLocation(rec, loc); textFields(rec);
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
    const ctx = { known: new Map(), byId: new Map(), twins: new Map(), legacy: new Map(), count: 0, since: load(KEYS.since, 0) };
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
    })().finally(() => { running = null; progressText = stopRequested ? t('stopped') : ''; rebuildIndex(); refreshAll(); draw(); drawDupes(); });
    return running;
  }
  function progress(text) { progressText = text; if (status) status.textContent = text; }
  function autoRun() {
    if (running || document.visibilityState !== 'visible' || !load(KEYS.last, null)) return;
    sync(true).catch(() => {});
  }

  // ---------- view ----------
  const panel = document.createElement('section'); panel.className = 'mail-app mail-all'; panel.hidden = true; panel.id = 'pb-mail-all';
  let status = null, selectedSender = null, openRecord = null, query = '';
  host.append(panel);
  function show(on) {
    panel.hidden = !on; host.classList.toggle('mail-all-open', on);
    if (on) { draw(); panel.scrollTop = 0; }
  }
  /** First entry of the mailbox folder bar; costs no extra row on a phone. */
  function entry() {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'mail-folder'; b.dataset.mailAll = 'open';
    b.setAttribute('aria-current', 'false'); b.append(t('open'), el('small', '', String(indexed().length || '')));
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
      el('span', 'mail-preview', senderName(r.mail.from) + ' · ' + (r.mailBody || '').replace(/\s+/g, ' ').slice(0, 80)),
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
    const marks = el('p', 'mail-muted'); marks.textContent = [r.mailList ? t('newsletter') : '', r.mailHasAttachments ? t('attachments') : ''].filter(Boolean).join(' · ');
    if (marks.textContent) box.append(marks);
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
    const head = el('div', 'mail-head'), last = load(KEYS.last, null);
    head.append(button(t('close'), () => show(false), 'mail-back'), el('h2', '', t('title')));
    if (running) head.append(button(t('stop'), () => { stopRequested = true; progress(t('stopped')); }));
    else head.append(button(last ? t('refresh') : t('fetch'), () => sync(false), 'mail-primary'));
    const tools = el('details', 'mail-account-tools'), summary = el('summary', 'mail-button', t('more')), menu = el('div', 'mail-account-menu');
    menu.append(button(t('older'), () => { tools.open = false; store(KEYS.since, (load(KEYS.since, 0) || Date.now() - YEAR) - YEAR); sync(false); }));
    tools.append(summary, menu); if (!running) head.append(tools);
    panel.append(head);
    status = el('p', 'mail-notice'); status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite');
    const all = indexed(), since = load(KEYS.since, 0);
    status.textContent = running ? progressText : [progressText, lastProblem, last ? t('last') + ' ' + fmtTime(last.at) + ' · ' + all.length + ' ' + t('mails') + ' · ' + last.accounts + ' ' + t('accounts') + (since ? ' · ' + t('since') + ' ' + fmtDate(since) : '') : t('never')].filter(Boolean).join(' · ');
    panel.append(status);
    if (!last && !all.length) { panel.append(el('p', 'mail-muted', t('intro'))); return; }
    const search = el('input'); search.type = 'search'; search.placeholder = t('search'); search.setAttribute('aria-label', t('search')); search.value = query; search.dataset.mailAll = 'search';
    search.oninput = () => { query = search.value; selectedSender = query ? null : selectedSender; openRecord = null; draw(); };
    const switches = el('div', 'mail-list-actions mail-all-switch');
    const modeList = button(t('list'), () => { view.mode = 'list'; selectedSender = null; openRecord = null; store(KEYS.view, view); draw(); });
    const modeSenders = button(t('senders'), () => { view.mode = 'senders'; openRecord = null; store(KEYS.view, view); draw(); });
    modeList.setAttribute('aria-pressed', String(view.mode === 'list')); modeSenders.setAttribute('aria-pressed', String(view.mode === 'senders'));
    const order = button(view.order === 'newest' ? t('newest') : t('oldest'), () => { view.order = view.order === 'newest' ? 'oldest' : 'newest'; store(KEYS.view, view); draw(); });
    order.dataset.mailAll = 'order';
    switches.append(modeList, modeSenders, order);
    panel.append(search, switches);
    if (keepFocus) { search.focus(); try { search.setSelectionRange(caret, caret); } catch { /* Not every input supports it. */ } }
    const current = openRecord && all.find(r => r.hash === openRecord);
    if (current) { panel.append(drawReader(current)); return; }
    const mails = all.filter(matches).sort(byOrder);
    const list = el('div', 'mail-all-list');
    if (query.trim()) panel.append(el('p', 'mail-count', mails.length + ' ' + t('hits')));
    if (view.mode === 'senders' && !query.trim()) {
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
    const pairs = indexed().filter(r => r.mailDupeOf && !r.mailDupeChecked).map(r => [CATALOG.find(x => x.hash === r.mailDupeOf), r]).filter(p => p[0]);
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
  window.PBMailIndex = { entry, sync, stop: () => { stopRequested = true; }, show, running: () => Boolean(running), senderAddress, senderName };
})();
