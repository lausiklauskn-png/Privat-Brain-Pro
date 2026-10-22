/* 🧰 Tools in the app menu (Klaus 2026-10-22: "Pinnwand, Such-Tool, Datei-Post, Kim-Sync … mit hinein … Dateien
   herunterladen und auch einfügen können bei Private Brain Pro"). Bundled tools open in a full window inside the app
   (same local origin, so they work without the PWA address); each one is locked until an unlock code allows it
   (native/native-license.js). A file a tool "downloads" is caught here and offered to Private Brain Pro: it then goes
   through the same import and check as "Dateien hinzufügen". Links (FP-Videos, Workflow PDF) open in the browser. */
(() => {
  'use strict';
  const license = window.PBLicense;
  if (!license) return;
  // Bundled tool pages (tools/native/apps.json → www/<dir>/); the others follow in later steps.
  const PAGES = { pinnwand: 'kimboard/index.html', suche: 'kimseek/index.html' };
  const LINKS = {
    fpvideo: 'https://lausiklauskn-png.github.io/Family-Projekt.de-Video/',
    workflowpdf: 'https://lausiklauskn-png.github.io/Workflow-PDF/'
  };
  const L = ['de', 'en', 'ru', 'pl'];
  const li = () => Math.max(0, L.indexOf(String(document.documentElement.lang || 'de').slice(0, 2)));
  const W = {
    head: ['🧰 Werkzeuge', '🧰 Tools', '🧰 Инструменты', '🧰 Narzędzia'],
    soon: ['kommt bald', 'coming soon', 'скоро', 'wkrótce'],
    lockedAsk: ['Dieses Werkzeug ist gesperrt. Den Freischalt-Code gibst du in den Einstellungen unter „🔑 Werkzeuge freischalten“ ein.', 'This tool is locked. Enter the unlock code in Settings under "🔑 Unlock tools".', 'Инструмент закрыт. Введите код в настройках: «🔑 Открыть инструменты».', 'Narzędzie zablokowane. Wpisz kod w Ustawieniach: „🔑 Odblokuj narzędzia”.'],
    back: ['← Zurück zu Private Brain Pro', '← Back to Private Brain Pro', '← Назад', '← Wróć'],
    take: ['📥 In Private Brain übernehmen', '📥 Add to Private Brain', '📥 В Private Brain', '📥 Do Private Brain'],
    shareIt: ['📤 Teilen', '📤 Share', '📤 Поделиться', '📤 Udostępnij'],
    cancel: ['Abbrechen', 'Cancel', 'Отмена', 'Anuluj'],
    gotFile: ['Das Werkzeug gibt eine Datei heraus:', 'The tool hands out a file:', 'Инструмент выдаёт файл:', 'Narzędzie wydaje plik:'],
    taken: ['✓ Übernommen. Die Prüfung und die Einordnung stehen unter „Dateien hinzufügen“.', '✓ Added. The check and where it went are shown under "Add files".', '✓ Добавлено. Проверка — в «Добавить файлы».', '✓ Dodano. Sprawdzenie w „Dodaj pliki”.'],
    tooBig: ['Zu groß zum Übernehmen (über 80 MB).', 'Too large to add (over 80 MB).', 'Слишком большой (более 80 МБ).', 'Za duży (ponad 80 MB).'],
    link: ['öffnet im Browser', 'opens in the browser', 'откроется в браузере', 'otwiera w przeglądarce'],
    workflowpdf: ['Workflow PDF', 'Workflow PDF', 'Workflow PDF', 'Workflow PDF']
  };
  const t = k => (W[k] || [k])[li()] || W[k][0];
  const make = (tag, text, cls) => { const e = document.createElement(tag); if (text) e.textContent = text; if (cls) e.className = cls; return e; };

  // ---------- the tool window ----------
  let frameBox = null;
  function close() { frameBox?.remove(); frameBox = null; document.documentElement.classList.remove('pb-tool-open'); }
  function openTool(id) {
    const tool = license.TOOLS.find(x => x.id === id);
    if (!license.unlocked(id)) { alert(t('lockedAsk')); goUnlock(); return; }
    if (LINKS[id]) { void window.Capacitor?.Plugins?.ProLinks?.open({ url: LINKS[id] }); return; }
    if (!PAGES[id]) return;
    close();
    frameBox = make('div', null, 'pb-tool-frame'); frameBox.dataset.tool = id;
    const bar = make('div', null, 'pb-tool-bar');
    const back = make('button', t('back'), 'ghost'); back.type = 'button'; back.onclick = close;
    const title = make('strong'); title.append(license.toolIcon(tool), ' ' + license.toolName(tool));
    bar.append(back, title);
    const frame = make('iframe'); frame.title = license.toolName(tool); frame.src = PAGES[id];
    frame.setAttribute('allow', 'clipboard-write');
    frame.addEventListener('load', () => watch(frame, tool));
    frameBox.append(bar, frame); document.body.append(frameBox);
    document.documentElement.classList.add('pb-tool-open');
  }
  function goUnlock() {
    window.PBWorkspace?.navigate?.('settings');
    const box = document.getElementById('pb-license'); box?.scrollIntoView({ block: 'center' });
    document.getElementById('pbLicenseCode')?.focus();
  }

  // ---------- files the tool hands out (a[download] with a blob:/data: address) ----------
  function watch(frame, tool) {
    let win, doc;
    try { win = frame.contentWindow; doc = frame.contentDocument; } catch { return; }
    if (!win || !doc) return;
    const catchIt = async anchor => {
      const href = anchor?.getAttribute?.('href') || '';
      if (!anchor?.hasAttribute?.('download') || !/^(blob:|data:)/.test(href)) return false;
      const name = anchor.getAttribute('download') || 'datei';
      try { const blob = await (await win.fetch(href)).blob(); offer(new File([blob], name, { type: blob.type }), tool); } catch { /* the tool keeps its own way */ }
      return true;
    };
    doc.addEventListener('click', event => {
      const a = event.target?.closest?.('a[download]');
      if (!a) return;
      if (/^(blob:|data:)/.test(a.getAttribute('href') || '')) { event.preventDefault(); void catchIt(a); }
    }, true);
    // Tools often create an anchor, click it and drop it without putting it into the page.
    const proto = win.HTMLAnchorElement.prototype, click = proto.click;
    proto.click = function () { if (this.hasAttribute('download') && /^(blob:|data:)/.test(this.getAttribute('href') || '')) { void catchIt(this); return; } return click.call(this); };
  }
  function offer(file, tool) {
    const dialog = make('dialog', null, 'live-dialog pb-tool-file');
    const status = make('p', null, 'hint'); status.setAttribute('role', 'status');
    const take = make('button', t('take')); take.type = 'button';
    take.onclick = async () => {
      if (file.size > 80 * 1024 * 1024) { status.textContent = t('tooBig'); return; }
      take.disabled = true; dialog.close(); close();
      window.PBWorkspace?.navigate?.('intake');
      await window.signBatch?.([{ file, path: 'Werkzeuge/' + license.toolName(tool) + '/' + file.name, dirId: null }]);
    };
    const share = make('button', t('shareIt'), 'ghost'); share.type = 'button';
    share.onclick = () => navigator.share?.({ files: [file] }).catch(() => {});
    const cancel = make('button', t('cancel'), 'ghost'); cancel.type = 'button'; cancel.onclick = () => dialog.close();
    dialog.append(make('p', t('gotFile')), make('p', file.name + ' · ' + Math.max(1, Math.round(file.size / 1024)) + ' KB', 'pb-tool-file-name'), take,
      ...(navigator.canShare?.({ files: [file] }) ? [share] : []), cancel, status);
    document.body.append(dialog); dialog.addEventListener('close', () => dialog.remove()); dialog.showModal();
  }

  // ---------- the menu (☰) ----------
  function paint() {
    const panel = document.querySelector('.native-options-panel'); if (!panel) return;
    let box = panel.querySelector(':scope > .pb-tools-menu');
    if (!box) { box = make('div', null, 'pb-tools-menu'); panel.append(box); }
    const rows = [make('p', t('head'), 'pb-tools-head')];
    // Klaus 2026-10-22: each program shows its own icon (copied from its app), not an emoji.
    const entries = [...license.TOOLS.map(tool => ({ ...tool, name: license.toolName(tool) })), { id: 'workflowpdf', img: 'tool-icons/workflowpdf.png', icon: '📄', name: t('workflowpdf'), free: true }];
    for (const e of entries) {
      const ready = Boolean(PAGES[e.id] || LINKS[e.id]), open = e.free || license.unlocked(e.id);
      const b = make('button', null, 'ghost pb-tools-item');
      b.append(make('span', open ? '' : '🔒', 'pb-tools-lock'), license.toolIcon(e), make('span', e.name + (ready ? (LINKS[e.id] ? ' ↗' : '') : ' · ' + t('soon')), 'pb-tools-name'));
      b.type = 'button'; b.dataset.tool = e.id; b.dataset.open = String(open); b.disabled = !ready && open;
      if (LINKS[e.id]) b.title = t('link');
      b.onclick = () => e.free ? window.Capacitor?.Plugins?.ProLinks?.open({ url: LINKS[e.id] }) : openTool(e.id);
      rows.push(b);
    }
    box.replaceChildren(...rows);
  }
  addEventListener('pb:license', paint);
  new MutationObserver(paint).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  const wait = setInterval(() => { if (document.querySelector('.native-options-panel')) { clearInterval(wait); paint(); } }, 200);

  // The built-in pin board (📌 in the menu) is a tool too (Klaus: "für das Öffnen von der Pinnwand … nur mit Passwort").
  document.addEventListener('click', event => {
    const pin = event.target.closest?.('#pbPinBtn');
    if (!pin || license.unlocked('pinnwand')) return;
    event.preventDefault(); event.stopImmediatePropagation(); alert(t('lockedAsk')); goUnlock();
  }, true);
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && frameBox) close(); });

  window.PBTools = { open: openTool, close, offer, PAGES, LINKS };
})();
