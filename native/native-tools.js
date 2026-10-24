/* 🧰 Tools in the app menu (Klaus 2026-10-22: "Pinnwand, Such-Tool, Datei-Post, Kim-Sync … mit hinein … Dateien
   herunterladen und auch einfügen können bei Private Brain Pro"). Bundled tools open in a full window inside the app
   (same local origin, so they work without the PWA address); each one is locked until an unlock code allows it
   (native/native-license.js). A file a tool "downloads" is caught here and offered to Private Brain Pro: it then goes
   through the same import and check as "Dateien hinzufügen". Licensed links open the original hosted tools;
   Workflow PDF Pro launches its installed native app. Private tool sources are not copied into this APK. */
(() => {
  'use strict';
  const license = window.PBLicense;
  if (!license) return;
  const windows = window.Capacitor?.getPlatform?.() === 'windows';
  // Bundled tool pages (tools/native/apps.json → www/<dir>/).
  const PAGES = { pinnwand: 'kimboard/index.html', suche: 'kimseek/index.html' };
  const LINKS = {
    fpvideo: 'https://lausiklauskn-png.github.io/Family-Projekt.de-Video/',
    kimsync: 'https://lausiklauskn-png.github.io/Kim-sync/',
    dateipost: 'https://dateien.family-projekt.de/',
    bookledgerpro: 'https://lausiklauskn-png.github.io/BookLedgerPro/'
  };
  const APPLICATIONS = Object.freeze({workflowpdfpro:Object.freeze({
    android:'https://github.com/lausiklauskn-png/Workflow-PDF-Pro/releases/download/v1.0.3/Workflow-PDF-Pro-1.0.3.apk',
    releases:'https://github.com/lausiklauskn-png/Workflow-PDF-Pro/releases'
  })});
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
    nativeApp: ['öffnet das Originalprogramm', 'opens the original application', 'откроется исходное приложение', 'otwiera oryginalny program'],
    appMissing: ['Workflow PDF Pro ist auf diesem Gerät noch nicht installiert.', 'Workflow PDF Pro is not installed on this device yet.', 'Workflow PDF Pro ещё не установлено на этом устройстве.', 'Workflow PDF Pro nie jest jeszcze zainstalowany na tym urządzeniu.'],
    appVersions: ['Die offizielle Downloadseite enthält die verfügbaren Ausgaben von Workflow PDF Pro.', 'The official download page lists the available Workflow PDF Pro editions.', 'На официальной странице загрузки доступны версии Workflow PDF Pro.', 'Oficjalna strona pobierania zawiera dostępne wersje Workflow PDF Pro.'],
    install: ['Installieren', 'Install', 'Установить', 'Zainstaluj'],
    downloads: ['Downloadseite öffnen', 'Open download page', 'Открыть страницу загрузки', 'Otwórz stronę pobierania'],
    close: ['Schließen', 'Close', 'Закрыть', 'Zamknij'],
    openFailed: ['Das Werkzeug konnte nicht geöffnet werden. Bitte erneut versuchen.', 'The tool could not be opened. Please try again.', 'Не удалось открыть инструмент. Повторите попытку.', 'Nie udało się otworzyć narzędzia. Spróbuj ponownie.']
  };
  const t = k => (W[k] || [k])[li()] || W[k][0];
  const make = (tag, text, cls) => { const e = document.createElement(tag); if (text) e.textContent = text; if (cls) e.className = cls; return e; };

  // ---------- the tool window ----------
  let frameBox = null, applicationDialog = null, launching = false;
  function close() { frameBox?.remove(); frameBox = null; document.documentElement.classList.remove('pb-tool-open'); }
  function closeMenu() { document.querySelector('.native-options')?.removeAttribute('open'); }
  async function openLink(id, url) {
    if (!license.unlocked(id)) return goUnlock();
    const links = window.Capacitor?.Plugins?.ProLinks;
    if (typeof links?.open !== 'function') throw new Error('LINK_UNAVAILABLE');
    await links.open({url});
    closeMenu();
  }
  function applicationNotice(tool, {download, android = false, failed = false} = {}) {
    applicationDialog?.close();
    const dialog = make('dialog', null, 'live-dialog pb-tool-application');
    applicationDialog = dialog; dialog.dataset.tool = tool.id;
    const title = make('h3', license.toolName(tool)); title.id = 'pb-tool-application-title';
    dialog.setAttribute('aria-labelledby', title.id);
    const status = make('p', failed ? t('openFailed') : t(android ? 'appMissing' : 'appVersions'));
    status.setAttribute('role', 'status'); dialog.append(title, status);
    if (download) {
      const install = make('button', t(android ? 'install' : 'downloads')); install.type = 'button'; install.dataset.toolDownload = '';
      install.onclick = async () => {
        if (!license.unlocked(tool.id)) { dialog.close(); goUnlock(); return; }
        install.disabled = true;
        try { await openLink(tool.id, download); dialog.close(); }
        catch { status.textContent = t('openFailed'); }
        finally { install.disabled = false; }
      };
      dialog.append(install);
    }
    const dismiss = make('button', t('close'), 'ghost'); dismiss.type = 'button'; dismiss.onclick = () => dialog.close();
    dialog.append(dismiss); dialog.addEventListener('close', () => { dialog.remove(); if (applicationDialog === dialog) applicationDialog = null; });
    document.body.append(dialog); closeMenu(); dialog.showModal();
  }
  async function openApplication(tool) {
    const application = APPLICATIONS[tool.id], links = window.Capacitor?.Plugins?.ProLinks;
    const android = window.Capacitor?.getPlatform?.() === 'android';
    if (android && typeof links?.openApplication === 'function') {
      const result = await links.openApplication({tool:tool.id});
      if (!license.unlocked(tool.id)) return;
      if (result?.installed === true) { closeMenu(); return; }
      if (result?.installed !== false) throw new Error('TOOL_UNAVAILABLE');
      applicationNotice(tool, {download:application.android, android:true});
    } else applicationNotice(tool, {download:application.releases});
  }
  async function openTool(id) {
    const tool = license.TOOLS.find(x => x.id === id);
    if (!tool) return;
    if (!license.unlocked(id)) { alert(t('lockedAsk')); goUnlock(); return; }
    if (APPLICATIONS[id] || LINKS[id]) {
      if (launching) return;
      launching = true;
      try { if (APPLICATIONS[id]) await openApplication(tool); else await openLink(id, LINKS[id]); }
      catch { if (license.unlocked(id)) applicationNotice(tool, {failed:true}); }
      finally { launching = false; }
      return;
    }
    if (!PAGES[id]) return;
    close();
    frameBox = make('div', null, 'pb-tool-frame'); frameBox.dataset.tool = id;
    const bar = make('div', null, 'pb-tool-bar');
    const back = make('button', t('back'), 'ghost'); back.type = 'button'; back.onclick = close;
    const title = make('strong'); title.append(license.toolIcon(tool), ' ' + license.toolName(tool));
    bar.append(back, title);
    const frame = make('iframe'); frame.title = license.toolName(tool);
    if (windows) {
      frame.dataset.nonce = crypto.randomUUID();
      frame.src = 'https://pbtool.localhost/' + PAGES[id] + '#pb-tool=' + frame.dataset.nonce;
    } else frame.src = PAGES[id];
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
    // Program icons stay separate from the functional toolbar's line symbols.
    const entries = license.TOOLS.map(tool => ({ ...tool, name: license.toolName(tool) }));
    for (const e of entries) {
      const ready = Boolean(PAGES[e.id] || LINKS[e.id] || APPLICATIONS[e.id]), open = license.unlocked(e.id);
      const b = make('button', null, 'ghost pb-tools-item');
      b.append(make('span', open ? '' : '🔒', 'pb-tools-lock'), license.toolIcon(e), make('span', e.name + (ready ? (LINKS[e.id] ? ' ↗' : '') : ' · ' + t('soon')), 'pb-tools-name'));
      b.type = 'button'; b.dataset.tool = e.id; b.dataset.open = String(open); b.disabled = !ready && open;
      if (LINKS[e.id]) b.title = t('link');
      else if (APPLICATIONS[e.id]) b.title = t('nativeApp');
      b.onclick = () => { void openTool(e.id); };
      rows.push(b);
    }
    box.replaceChildren(...rows);
  }
  addEventListener('pb:license', () => { if (frameBox && !license.unlocked(frameBox.dataset.tool)) close(); if (applicationDialog && !license.unlocked(applicationDialog.dataset.tool)) applicationDialog.close(); paint(); });
  // Windows tools have their own origin and cannot access app storage or native
  // adapters. Only the currently open, licensed frame may offer a file.
  addEventListener('message', event => {
    if (!windows || event.origin !== 'https://pbtool.localhost') return;
    const frame = frameBox?.querySelector('iframe'), data = event.data;
    if (!frame || event.source !== frame.contentWindow || !data || data.nonce !== frame.dataset.nonce) return;
    const id = frameBox.dataset.tool, open = license.unlocked(id);
    if (data.kind === 'pb-tool-authorize') {
      frame.contentWindow.postMessage({ kind: 'pb-tool-authorized', nonce: frame.dataset.nonce, allowed: open }, event.origin);
      return;
    }
    if (!open) { close(); return; }
    if (data.kind === 'pb-tool-file' && data.bytes instanceof ArrayBuffer && data.bytes.byteLength <= 80 * 1024 * 1024 && typeof data.name === 'string' && data.name.length <= 1024) {
      const name = data.name.replace(/[\/\\\p{Cc}\p{Cf}]/gu, '_') || 'file';
      offer(new File([data.bytes], name, { type: typeof data.type === 'string' && data.type.length <= 256 ? data.type : '' }), license.TOOLS.find(tool => tool.id === id));
    }
  });
  new MutationObserver(paint).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  const wait = setInterval(() => { if (document.querySelector('.native-options-panel')) { clearInterval(wait); paint(); } }, 200);

  document.addEventListener('keydown', event => { if (event.key === 'Escape' && frameBox) close(); });

  window.PBTools = { open: openTool, close, offer, PAGES, LINKS, APPLICATIONS };
})();
