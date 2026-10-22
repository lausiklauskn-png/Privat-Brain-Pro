/* 🛡 Check every file for hidden content (Klaus 2026-10-22: "ich sehe überhaupt nicht, ob sie geprüft wurde.
   Ich habe den Eindruck, sie wird gar nicht geprüft."). The checker core is modules/pruefer-anhang.js
   (byte-1:1, the same as Sende-Prüfer and Workflow PDF). This glue gives it the PDF reader bundled with the
   app, checks each file while it is added, keeps the result at the catalog entry and shows it:
   a mark at every file (search, catalog, explorer) and a report on tap.
   Nothing is removed or changed; a finding is marked, not deleted. Never "virenfrei": this is no virus scan.
   Text inside images needs the text recognition, which is not in the app yet: that part says "not checked". */
(() => {
  'use strict';
  const PDFJS = 'vendor/pdfjs/';
  window.KI_REINIGUNG_PDFJS = '/' + PDFJS;   // the KI path (Reinigung) reads PDFs with the same local reader
  const LIMIT = 64 * 1024 * 1024;
  // Same split as Workflow PDF (assets/eingang.js): these are findings, everything else is information.
  const WARN = ['KI-ANWEISUNG', 'PDF-KI-ANWEISUNG', 'BILD-KI-ANWEISUNG', 'PDF-VERSTECKTER-TEXT', 'VERSTECKTER-TEXT',
    'BILD-LSB-VERDACHT', 'PDF-ANHANG', 'ANHANG-PROGRAMM', 'ANHANG-TARNUNG'];
  const L = ['de', 'en', 'ru', 'pl'];
  const W = {
    'KI-ANWEISUNG': ['Anweisung an eine KI im Text', 'Instruction to an AI in the text', 'Указание для ИИ в тексте', 'Polecenie dla AI w tekście'],
    'PDF-KI-ANWEISUNG': ['Anweisung an eine KI im Text', 'Instruction to an AI in the text', 'Указание для ИИ в тексте', 'Polecenie dla AI w tekście'],
    'BILD-KI-ANWEISUNG': ['Anweisung an eine KI im Bild', 'Instruction to an AI in the image', 'Указание для ИИ на изображении', 'Polecenie dla AI na obrazie'],
    'PDF-VERSTECKTER-TEXT': ['Unsichtbarer Text im PDF', 'Invisible text in the PDF', 'Невидимый текст в PDF', 'Niewidoczny tekst w PDF'],
    'VERSTECKTER-TEXT': ['Unsichtbarer Text', 'Invisible text', 'Невидимый текст', 'Niewidoczny tekst'],
    'BILD-LSB-VERDACHT': ['Verdacht: versteckter Text in den Bildpunkten', 'Suspicion: text hidden in the pixels', 'Подозрение: текст спрятан в пикселях', 'Podejrzenie: tekst ukryty w pikselach'],
    'PDF-ANHANG': ['Im PDF steckt eine weitere Datei', 'Another file is inside the PDF', 'Внутри PDF есть другой файл', 'W PDF jest inny plik'],
    'ANHANG-PROGRAMM': ['Das ist ein Programm', 'This is a program', 'Это программа', 'To jest program'],
    'ANHANG-TARNUNG': ['Die Endung passt nicht zum Inhalt', 'The file ending does not match the content', 'Расширение не соответствует содержимому', 'Rozszerzenie nie pasuje do zawartości'],
    clean: ['✓ Geprüft · kein Fund', '✓ Checked · nothing found', '✓ Проверено · ничего', '✓ Sprawdzono · brak'],
    found: ['⚠ Fund: ', '⚠ Found: ', '⚠ Найдено: ', '⚠ Znaleziono: '],
    partly: ['◐ Teilweise geprüft', '◐ Partly checked', '◐ Проверено частично', '◐ Sprawdzono częściowo'],
    open: ['○ Noch nicht geprüft · jetzt prüfen', '○ Not checked yet · check now', '○ Ещё не проверено · проверить', '○ Jeszcze nie sprawdzono · sprawdź'],
    running: ['🛡 Wird geprüft …', '🛡 Checking …', '🛡 Проверяется …', '🛡 Sprawdzanie …'],
    report: ['🛡 Prüfbericht', '🛡 Check report', '🛡 Отчёт проверки', '🛡 Raport sprawdzenia'],
    findings: ['Gefunden', 'Found', 'Найдено', 'Znaleziono'],
    none: ['Nichts gefunden, was täuschen soll: keine Anweisung an eine KI, kein unsichtbarer Text, keine Tarnung.', 'Nothing found that is meant to deceive: no instruction to an AI, no invisible text, no disguise.', 'Ничего обманного: нет указаний для ИИ, нет невидимого текста, нет маскировки.', 'Nic, co miałoby zwodzić: brak poleceń dla AI, niewidocznego tekstu, maskowania.'],
    whatNow: ['Was jetzt tun: die Datei nicht an eine KI geben und beim Absender nachfragen, ob sie so gemeint ist. Die Datei bleibt unverändert.', 'What to do: do not give the file to an AI and ask the sender whether it is meant this way. The file stays unchanged.', 'Что делать: не передавать файл ИИ и спросить отправителя. Файл не изменён.', 'Co zrobić: nie dawać pliku AI i zapytać nadawcę. Plik pozostaje bez zmian.'],
    info: ['Was sonst in der Datei steht (keine Gefahr)', 'What else is in the file (no danger)', 'Что ещё в файле (не опасно)', 'Co jeszcze jest w pliku (bez zagrożenia)'],
    notes: ['Was nicht geprüft werden konnte', 'What could not be checked', 'Что не удалось проверить', 'Czego nie dało się sprawdzić'],
    imageText: ['Text in Bildern wird noch nicht gelesen: die Texterkennung fehlt in der App (kommt per Schalter).', 'Text in images is not read yet: the text recognition is not in the app (coming as a switch).', 'Текст на изображениях пока не читается: нет распознавания текста.', 'Tekst na obrazach nie jest jeszcze czytany: brak rozpoznawania tekstu.'],
    when: ['Geprüft am ', 'Checked on ', 'Проверено ', 'Sprawdzono '],
    noVirus: ['Das ist keine Virenprüfung.', 'This is not a virus scan.', 'Это не проверка на вирусы.', 'To nie jest skanowanie antywirusowe.'],
    again: ['Erneut prüfen', 'Check again', 'Проверить снова', 'Sprawdź ponownie'],
    close: ['Schließen', 'Close', 'Закрыть', 'Zamknij'],
    missing: ['Die Datei selbst fehlt auf diesem Gerät, darum kann sie nicht geprüft werden.', 'The file itself is missing on this device, so it cannot be checked.', 'Самого файла нет на устройстве, проверить нельзя.', 'Brak samego pliku na urządzeniu, nie można sprawdzić.'],
    tooBig: ['Zu groß für die Prüfung (über 64 MB).', 'Too large to check (over 64 MB).', 'Слишком большой для проверки (более 64 МБ).', 'Za duży do sprawdzenia (ponad 64 MB).'],
    failed: ['Die Prüfung ist abgebrochen: ', 'The check stopped: ', 'Проверка прервана: ', 'Sprawdzanie przerwane: '],
    sumHead: ['🛡 Geprüft:', '🛡 Checked:', '🛡 Проверено:', '🛡 Sprawdzono:'],
    sumClean: [' ohne Fund', ' nothing found', ' без находок', ' bez znalezisk'],
    sumFound: [' mit Fund', ' with a finding', ' с находками', ' ze znaleziskiem'],
    sumPartly: [' teilweise', ' partly', ' частично', ' częściowo'],
    sumShow: ['Funde ansehen', 'Show findings', 'Показать находки', 'Pokaż znaleziska'],
    all: ['🛡 Alle prüfen', '🛡 Check all', '🛡 Проверить все', '🛡 Sprawdź wszystkie'],
    allOpen: [' ({n} offen)', ' ({n} open)', ' ({n} не проверено)', ' ({n} do sprawdzenia)'],
    allNone: ['🛡 Alle geprüft', '🛡 All checked', '🛡 Всё проверено', '🛡 Wszystko sprawdzone'],
    allRun: ['🛡 Prüfe {i} / {n} …', '🛡 Checking {i} / {n} …', '🛡 Проверка {i} / {n} …', '🛡 Sprawdzanie {i} / {n} …'],
    allDone: ['🛡 Alle geprüft', '🛡 All checked', '🛡 Всё проверено', '🛡 Wszystko sprawdzone'],
    allMissing: [' · {n} ohne Original auf diesem Gerät (nicht prüfbar)', ' · {n} without original on this device (cannot be checked)', ' · {n} без оригинала на устройстве', ' · {n} bez oryginału na urządzeniu'],
    allList: ['Mit Fund:', 'With a finding:', 'С находками:', 'Ze znaleziskiem:'],
    mailPart: ['Geprüft wurde der Text der E-Mail. Anhänge stehen als eigene Dateien da.', 'The text of the email was checked. Attachments are listed as their own files.', 'Проверен текст письма. Вложения — отдельные файлы.', 'Sprawdzono tekst e-maila. Załączniki są osobnymi plikami.'],
    throwAway: ['Wegwerfen (fragt vorher)', 'Throw away (asks first)', 'Удалить (спросит)', 'Wyrzuć (zapyta)'],
    inconspicuous: ['unauffällig', 'inconspicuous', 'без замечаний', 'bez zastrzeżeń'],
    germanOnly: ['Die Einzelheiten der Funde stehen auf Deutsch.', 'Details of the findings are in German.', 'Подробности находок — на немецком.', 'Szczegóły znalezisk są po niemiecku.']
  };
  const t = k => { const v = W[k]; if (!v) return k; return v[Math.max(0, L.indexOf(String(document.documentElement.lang || 'de').slice(0, 2)))] || v[0]; };

  let ready = null;
  function core() {
    if (ready) return ready;
    ready = (async () => {
      const A = window.PrueferAnhang;
      if (!A) throw new Error('checker missing');
      A.pfade({ pdfjs: PDFJS });
      return A;
    })();
    ready.catch(() => { ready = null; });
    return ready;
  }
  function stateOf(result) {
    if (!result) return 'open';
    if (result.funde && result.funde.length) return 'found';
    if (result.ungeprueft) return 'partly';
    return 'clean';
  }
  async function checkBytes(name, bytes) {
    const A = await core();
    const r = await A.pruefe(name, bytes);
    const funde = [], angaben = [];
    for (const b of r.befunde || []) (WARN.includes(b.kennung) ? funde : angaben).push({ k: b.kennung, satz: String(b.satz || '').slice(0, 400) });
    const hinweise = (r.hinweise || []).map(h => String(h).slice(0, 300));
    return { zeit: Date.now(), funde, angaben: angaben.slice(0, 30), hinweise: hinweise.slice(0, 12),
      ungeprueft: Boolean(r.textUngeprueft || r.bildUngeprueft), bild: Boolean(r.bildUngeprueft) };
  }
  const running = new Set();
  async function checkFile(file, rec) {
    if (!rec || running.has(rec.hash)) return rec?.pruefung;
    running.add(rec.hash); paint();
    try {
      if (file.size > LIMIT) rec.pruefung = { zeit: Date.now(), funde: [], angaben: [], hinweise: [t('tooBig')], ungeprueft: true };
      else rec.pruefung = await checkBytes(rec.name || file.name, new Uint8Array(await file.arrayBuffer()));
    } catch (error) {
      rec.pruefung = { zeit: Date.now(), funde: [], angaben: [], hinweise: [t('failed') + String(error?.message || error).slice(0, 120)], ungeprueft: true };
    } finally { running.delete(rec.hash); }
    try { await idbPut('catalog', rec); } catch { /* the result still shows until restart */ }
    paint();
    return rec.pruefung;
  }
  // Saved emails: their text goes through the mail checker of the same core (modules/pruefer-mail.js).
  async function checkMail(rec) {
    const M = window.PrueferMail; if (!M) throw new Error('mail checker missing');
    const m = rec.mail || {};
    const raw = 'From: ' + (m.from || '') + '\nTo: ' + (m.to || '') + '\nSubject: ' + (m.subject || rec.name || '') + '\n\n' + (rec.mailBody || rec.snippet || '');
    const r = M.pruefeMail(raw) || { stellen: [], hinweise: [] };
    const funde = [], angaben = [];
    for (const b of r.stellen || []) (WARN.includes(b.kennung) ? funde : angaben).push({ k: b.kennung, satz: String(b.satz || '').slice(0, 400) });
    rec.pruefung = { zeit: Date.now(), funde, angaben: angaben.slice(0, 30), hinweise: [t('mailPart')], ungeprueft: false, mail: true };
    try { await idbPut('catalog', rec); } catch { /* shown until restart */ }
    paint(); return rec.pruefung;
  }
  async function fileOf(rec) { try { return await window.resolveFile?.(rec) || null; } catch { return null; } }
  async function checkRecord(rec, quiet = false) {
    if (rec.mail) return checkMail(rec);
    let file = null;
    file = await fileOf(rec);
    if (!file) { if (!quiet) alert(t('missing')); return null; }
    return checkFile(file, rec);
  }

  // The catalog text of a PDF comes from the same reader (before: raw PDF bytes such as "/Subtype /Image …").
  const originalExtract = window.extractPdf;
  if (typeof originalExtract === 'function') {
    window.extractPdf = async function (u8) {
      try {
        if (!window.pdfjsLib) await new Promise((ok, no) => { const s = document.createElement('script'); s.src = PDFJS + 'pdf.min.js'; s.onload = ok; s.onerror = no; document.head.append(s); });
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS + 'pdf.worker.min.js';
        const doc = await window.pdfjsLib.getDocument({ data: u8.slice(0), isEvalSupported: false }).promise;
        const parts = [];
        for (let n = 1; n <= Math.min(doc.numPages, 60); n++) {
          const content = await (await doc.getPage(n)).getTextContent();
          parts.push(content.items.map(i => i.str + (i.hasEOL ? '\n' : ' ')).join(''));
        }
        const text = cleanText(parts.join('\n'));
        if (text.replace(/\s/g, '').length >= 12) return text;
      } catch { /* fall back to the app's own reader */ }
      return originalExtract.apply(this, arguments);
    };
  }

  // Every file is checked while it is added (also mail attachments and files shared to the app).
  const originalSign = window.signFile;
  if (typeof originalSign === 'function') {
    window.signFile = async function (file, path, dirId) {
      const result = await originalSign.apply(this, arguments);
      try {
        const rec = result?.rec || CATALOG.find(r => r.hash === result?.hash);
        if (rec && !rec.mail && !rec.pruefung) await checkFile(file, rec);
      } catch { /* the import itself must not fail because of the check */ }
      return result;
    };
  }

  // Emails read from .mbox/.eml are checked right after they are added.
  const mailImport = window.PBMail?.importFile;
  if (typeof mailImport === 'function') {
    window.PBMail.importFile = async function () {
      const added = await mailImport.apply(this, arguments);
      for (const rec of CATALOG) if (rec.mail && !rec.mailIndex && !rec.pruefung) { try { await checkMail(rec); } catch { /* stays "not checked" */ } }
      return added;
    };
  }

  // 🛡 Alle prüfen: every entry without a result, one after the other; the files themselves stay unchanged.
  const openOnes = () => CATALOG.filter(r => !r.mailIndex && !r.pruefung);
  let allBusy = false;
  async function checkAll(button) {
    if (allBusy) return; allBusy = true;
    const todo = openOnes(); let missing = 0, i = 0;
    try {
      for (const rec of todo) {
        button.textContent = t('allRun').replace('{i}', ++i).replace('{n}', todo.length);
        if (rec.pruefung) continue;
        try { if (!await checkRecord(rec, true)) missing++; } catch { missing++; }
        if (i % 3 === 0) await new Promise(r => setTimeout(r));
      }
    } finally { allBusy = false; allButtons(); }
    const found = todo.filter(r => stateOf(r.pruefung) === 'found');
    const dialog = make('dialog', null, 'live-dialog pb-check-report pb-check-all');
    const head = make('p', t('allDone') + ': ' + (todo.length - missing) + ' · ⚠ ' + found.length + t('sumFound') + (missing ? t('allMissing').replace('{n}', missing) : ''));
    dialog.append(make('h2', t('report')), head);
    if (found.length) {
      dialog.append(make('h3', t('allList')));
      const ul = make('ul', null, 'pb-check-found');
      for (const rec of found) { const li = make('li'); const b = make('button', '⚠ ' + rec.name + ' — ' + t(rec.pruefung.funde[0].k), 'ghost'); b.type = 'button'; b.onclick = () => { dialog.close(); report(rec); }; li.append(b); ul.append(li); }
      dialog.append(ul);
    }
    const close = make('button', t('close')); close.type = 'button'; close.onclick = () => dialog.close();
    dialog.append(make('p', t('noVirus'), 'hint'), close); document.body.append(dialog);
    dialog.addEventListener('close', () => dialog.remove()); dialog.showModal();
  }
  function allButtons() {
    const n = openOnes().length;
    for (const spot of [document.querySelector('.explorer-toolbar'), document.getElementById('corpusInfo')?.parentElement]) {
      if (!spot) continue;
      let b = spot.querySelector(':scope > .pb-check-all-button');
      if (!b) { b = make('button', '', 'ghost pb-check-all-button'); b.type = 'button'; b.onclick = () => checkAll(b); spot.append(b); }
      if (!allBusy) { const text = n ? t('all') + t('allOpen').replace('{n}', n) : t('allNone'); if (b.textContent !== text) b.textContent = text; if (b.disabled !== !n) b.disabled = !n; }
    }
  }

  const make = (tag, text, cls) => { const e = document.createElement(tag); if (text) e.textContent = text; if (cls) e.className = cls; return e; };
  function badgeText(rec) {
    if (running.has(rec.hash)) return t('running');
    const s = stateOf(rec.pruefung);
    if (s === 'found') return t('found') + t(rec.pruefung.funde[0].k);
    return t(s);
  }
  function badge(rec) {
    const b = make('button', badgeText(rec), 'pb-check-badge');
    b.type = 'button'; b.dataset.check = running.has(rec.hash) ? 'running' : stateOf(rec.pruefung); b.dataset.hash = rec.hash;
    b.onclick = event => { event.stopPropagation(); if (stateOf(rec.pruefung) === 'open') void checkRecord(rec).then(r => { if (r) report(rec); }); else report(rec); };
    return b;
  }
  function report(rec) {
    if (!rec.pruefung) return;
    show(rec.name, rec.pruefung, async () => { rec.pruefung = null; return checkRecord(rec); }, rec.hash);
  }
  function show(name, r, recheck, hash) {
    const dialog = make('dialog', null, 'live-dialog pb-check-report'); if (hash) dialog.dataset.hash = hash;
    dialog.append(make('h2', t('report')), make('p', name, 'pb-check-name'));
    if (r.funde.length) {
      dialog.append(make('h3', '⚠ ' + t('findings')));
      const list = make('ul', null, 'pb-check-found');
      for (const f of r.funde) { const li = make('li'); li.append(make('b', t(f.k)), document.createTextNode(' — ' + f.satz)); li.dataset.k = f.k; list.append(li); }
      dialog.append(list, make('p', t('whatNow'), 'pb-check-whatnow'));
    } else dialog.append(make('p', '✓ ' + t('none'), 'pb-check-clean'));
    const notes = [...r.hinweise.filter(h => /NICHT|ungeprüft|nicht geprüft|nicht erreichbar|nicht gelesen/i.test(h))];
    if (r.bild) notes.unshift(t('imageText'));
    if (notes.length) { dialog.append(make('h3', t('notes'))); const ul = make('ul', null, 'pb-check-notes'); for (const n of notes) ul.append(make('li', n)); dialog.append(ul); }
    if (r.angaben.length) {
      const d = make('details', null, 'pb-check-info'); d.append(make('summary', t('info')));
      const ul = make('ul'); for (const a of r.angaben) ul.append(make('li', a.k + ': ' + a.satz)); d.append(ul); dialog.append(d);
    }
    const foot = make('p', t('when') + new Date(r.zeit).toLocaleString(document.documentElement.lang) + ' · ' + t('noVirus') + (document.documentElement.lang.startsWith('de') ? '' : ' ' + t('germanOnly')), 'hint');
    const again = make('button', t('again'), 'ghost'), close = make('button', t('close'));
    again.type = close.type = 'button';
    again.onclick = async () => { again.disabled = true; dialog.close(); const next = await recheck(); if (next) show(name, next, recheck, hash); };
    close.onclick = () => dialog.close();
    const row = make('div', null, 'btnrow'); row.append(again, close);
    dialog.append(foot, row); document.body.append(dialog);
    dialog.addEventListener('close', () => dialog.remove()); dialog.showModal();
  }

  // Marks next to every file: search results and catalog cards (".openBtn[data-hash]") and explorer rows.
  let painting = false;
  function paint() {
    if (painting) return; painting = true;
    requestAnimationFrame(() => {
      painting = false;
      allButtons();
      for (const li of document.querySelectorAll('.pb-check-entrance li[data-hash]')) if (!CATALOG.some(r => r.hash === li.dataset.hash)) li.remove();
      const spots = [...document.querySelectorAll('.openBtn[data-hash]')].map(b => ({ hash: b.dataset.hash, after: b }))
        .concat([...document.querySelectorAll('.explorer-row[data-hash]')].map(row => ({ hash: row.dataset.hash, after: row.querySelector('.explorer-meta') })));
      for (const spot of spots) {
        const rec = CATALOG.find(r => r.hash === spot.hash);
        if (!rec || rec.mailIndex || !spot.after) continue;
        const host = spot.after.parentElement;
        const old = host.querySelector(':scope > .pb-check-badge');
        const text = badgeText(rec);
        if (old && old.textContent === text) continue;
        const fresh = badge(rec);
        if (old) old.replaceWith(fresh); else spot.after.after(fresh);
      }
    });
  }
  new MutationObserver(paint).observe(document.body, { childList: true, subtree: true });
  new MutationObserver(paint).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });

  // The note after "Dateien hinzufügen" (assets/workspace.js) asks for one line about the check.
  function summary(hashes) {
    const recs = [...new Set(hashes)].map(h => CATALOG.find(r => r.hash === h)).filter(r => r && r.pruefung);
    if (!recs.length) return null;
    const count = { clean: 0, found: 0, partly: 0 };
    for (const r of recs) count[stateOf(r.pruefung)]++;
    const line = make('p', null, 'pb-check-summary'); line.dataset.check = count.found ? 'found' : count.partly ? 'partly' : 'clean';
    const parts = [];
    if (count.found) parts.push('⚠ ' + count.found + t('sumFound'));
    if (count.clean) parts.push('✓ ' + count.clean + t('sumClean'));
    if (count.partly) parts.push('◐ ' + count.partly + t('sumPartly'));
    line.append(make('span', t('sumHead') + ' ' + parts.join(' · ')));
    const worst = recs.find(r => stateOf(r.pruefung) === 'found') || recs.find(r => stateOf(r.pruefung) === 'partly');
    if (worst) { const b = make('button', '→ ' + (count.found ? t('sumShow') : t('report')), 'ghost'); b.type = 'button'; b.dataset.checkShow = worst.hash; b.onclick = () => report(worst); line.append(b); }
    // Klaus 2026-10-22: right at the entrance, file by file: findings first, keep or throw away at once.
    const block = make('div', null, 'pb-check-entrance'); block.append(line);
    const item = rec => {
      const li = make('li'); li.dataset.hash = rec.hash; li.dataset.check = stateOf(rec.pruefung);
      const s = stateOf(rec.pruefung);
      li.append(make('span', (s === 'found' ? '⚠ ' : s === 'partly' ? '◐ ' : '✓ ') + rec.name + (s === 'found' ? ' — ' + t(rec.pruefung.funde[0].k) : s === 'partly' ? ' — ' + t('partly').slice(2) : '')));
      const open = make('button', t('report').slice(3), 'ghost'); open.type = 'button'; open.onclick = () => report(rec);
      const del = make('button', '🗑', 'ghost delBtn'); del.type = 'button'; del.dataset.hash = rec.hash; del.title = del.ariaLabel = t('throwAway');
      li.append(open, del); return li;
    };
    const order = { found: 0, partly: 1, clean: 2 };
    const notable = recs.filter(r => stateOf(r.pruefung) !== 'clean').sort((a, b) => order[stateOf(a.pruefung)] - order[stateOf(b.pruefung)]);
    if (notable.length) { const ul = make('ul', null, 'pb-check-entrance-list'); for (const r of notable) ul.append(item(r)); block.append(ul); }
    const clean = recs.filter(r => stateOf(r.pruefung) === 'clean');
    if (clean.length) {
      const d = make('details', null, 'pb-check-entrance-clean'); d.append(make('summary', '✓ ' + clean.length + ' ' + t('inconspicuous')));
      const ul = make('ul', null, 'pb-check-entrance-list'); for (const r of clean) ul.append(item(r)); d.append(ul); block.append(d);
    }
    return block;
  }

  // Mail attachments kept in the chosen folder: checked from their bytes, results remembered by fingerprint.
  const VAULT_KEY = 'pb_check_vault';
  function vaultMemory() { try { return JSON.parse(localStorage.getItem(VAULT_KEY) || '{}'); } catch { return {}; } }
  function remember(sha, result) {
    try { const m = vaultMemory(); m[sha] = result; const keys = Object.keys(m); if (keys.length > 300) for (const k of keys.sort((a, b) => m[a].zeit - m[b].zeit).slice(0, keys.length - 300)) delete m[k]; localStorage.setItem(VAULT_KEY, JSON.stringify(m)); } catch { /* only a convenience */ }
  }
  async function checkVault(entry, force = false) {
    const sha = entry.sha256 || entry.ref || entry.id;
    if (!force && sha && vaultMemory()[sha]) return vaultMemory()[sha];
    let result;
    if (entry.size > LIMIT) result = { zeit: Date.now(), funde: [], angaben: [], hinweise: [t('tooBig')], ungeprueft: true };
    else result = await checkBytes(entry.name, await window.PBVault.bytes(entry));
    if (sha) remember(sha, result);
    return result;
  }
  function textOf(result) { const s = stateOf(result); return s === 'found' ? t('found') + t(result.funde[0].k) : t(s); }
  function line(name, result, entry) {
    const p = make('p', null, 'pb-check-line'); p.dataset.check = stateOf(result);
    p.append(make('span', name + ' · '));
    const b = make('button', textOf(result), 'pb-check-badge'); b.type = 'button'; b.dataset.check = stateOf(result);
    b.onclick = () => show(name, result, () => checkVault(entry, true));
    p.append(b); return p;
  }
  // 🛡 Alle prüfen in the folder "Mail-Anhänge": every attachment without a remembered result.
  async function checkVaultAll(entries, button, done) {
    const todo = entries.filter(e => !vaultMemory()[e.sha256 || e.ref || e.id]); let i = 0;
    button.disabled = true;
    try { for (const e of todo) { button.textContent = t('allRun').replace('{i}', ++i).replace('{n}', todo.length); try { await checkVault(e); } catch { /* named as not checked */ } } }
    finally { button.disabled = false; done?.(); }
  }
  const vaultOpen = entries => entries.filter(e => !vaultMemory()[e.sha256 || e.ref || e.id]).length;
  function vaultBadge(entry) {
    const known = vaultMemory()[entry.sha256 || entry.ref || entry.id];
    const b = make('button', known ? textOf(known) : t('open'), 'pb-check-badge'); b.type = 'button'; b.dataset.check = known ? stateOf(known) : 'open';
    b.onclick = async () => {
      b.textContent = t('running'); b.dataset.check = 'running';
      try { const r = known || await checkVault(entry); b.textContent = textOf(r); b.dataset.check = stateOf(r); show(entry.name, r, () => checkVault(entry, true)); }
      catch (error) { b.textContent = t('failed') + String(error?.message || error).slice(0, 60); b.dataset.check = 'partly'; }
    };
    return b;
  }

  window.PBCheck = { checkAll, checkMail, checkVault, checkVaultAll, vaultOpen, line, vaultBadge, show, checkBytes, checkFile, checkRecord, report, summary, stateOf, badgeText, words: t };
})();
