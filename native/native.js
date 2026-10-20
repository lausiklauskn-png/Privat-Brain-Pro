(async () => {
  'use strict';
  // Keep legal/site links reachable in Settings without a second page below the app window.
  const settingsPage = document.querySelector('#panel-settings');
  for (const node of document.querySelectorAll('.wrap>footer,body>.fp-badge-wrap')) settingsPage?.append(node);
  const text = {
    de: ['Android-Testversion', 'Direkte Mailverbindung und dauerhafter Ordnerzugriff werden noch ergänzt.'],
    en: ['Android test version', 'Direct mail and persistent folder access are still being added.'],
    ru: ['Тестовая версия Android', 'Прямая почта и постоянный доступ к папкам ещё разрабатываются.'],
    pl: ['Wersja testowa Android', 'Bezpośrednia poczta i trwały dostęp do folderów są w przygotowaniu.']
  };
  const status = document.createElement('p');
  status.className = 'native-status';
  status.setAttribute('role', 'status');
  const settings = document.querySelector('#install-box');
  if (settings) settings.after(status);
  let version = '';
  let nativeMail = false;
  try {
    const device = await window.Capacitor?.Plugins?.ProDevice?.getInfo();
    if (device) { version = ` · ${device.versionName}`; nativeMail = device.nativeMail === true; }
  } catch { /* Browser smoke tests have no Android bridge. */ }
  function render() {
    const t = text[document.documentElement.lang] || text.de;
    const mailNotice = {
      de: 'Direkte Mailverbindung auf diesem Gerät. Dauerhafter Ordnerzugriff und Hintergrundabruf folgen noch.',
      en: 'Direct mail on this device. Persistent folder access and background sync are still being added.',
      ru: 'Прямая почта на устройстве. Постоянный доступ к папкам и фоновая синхронизация ещё разрабатываются.',
      pl: 'Bezpośrednia poczta na urządzeniu. Trwały dostęp do folderów i synchronizacja w tle są w przygotowaniu.'
    };
    status.textContent = `${t[0]}${version}. ${nativeMail ? (mailNotice[document.documentElement.lang] || mailNotice.de) : t[1]}`;
  }
  new MutationObserver(render).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  render();
  if (nativeMail) {
    const licenses = document.createElement('a');
    licenses.href = 'assets/licenses/mail.html';
    licenses.textContent = 'JavaMail / Activation / Google · Lizenzen / Licenses';
    status.after(licenses);
  }

  const updates = window.Capacitor?.Plugins?.ProUpdates;
  if (!updates || !settings) return;
  const words = {
    de: ['Auf Updates prüfen', 'Prüft öffentliche GitHub-Veröffentlichungen. Dabei wird eine Verbindung zu GitHub aufgebaut.', 'Prüfung läuft …', 'Du verwendest die aktuelle verfügbare Version.', 'Neue Test-/App-Version: ', 'APK herunterladen', 'Updateprüfung derzeit nicht möglich. Prüfe deine Verbindung und versuche es später erneut.', 'Für diese Entwicklungsversion ist keine Updateprüfung verfügbar.', 'Der Download konnte nicht geöffnet werden. Bitte versuche es erneut.'],
    en: ['Check for updates', 'Checks public GitHub releases. This connects to GitHub.', 'Checking …', 'You have the latest available version.', 'New app version: ', 'Download APK', 'Unable to check for updates. Check your connection and try again later.', 'Updates are unavailable for this development build.', 'Unable to open the download. Please try again.'],
    ru: ['Проверить обновления', 'Проверяет общедоступные выпуски GitHub с подключением к GitHub.', 'Проверка …', 'Установлена последняя доступная версия.', 'Новая версия приложения: ', 'Скачать APK', 'Не удалось проверить обновления. Проверьте подключение и повторите позже.', 'Для этой версии для разработки проверка недоступна.', 'Не удалось открыть загрузку. Повторите попытку.'],
    pl: ['Sprawdź aktualizacje', 'Sprawdza publiczne wydania GitHub. Łączy się przy tym z GitHub.', 'Sprawdzanie …', 'Używasz najnowszej dostępnej wersji.', 'Nowa wersja aplikacji: ', 'Pobierz APK', 'Nie można sprawdzić aktualizacji. Sprawdź połączenie i spróbuj później.', 'Ta wersja deweloperska nie obsługuje aktualizacji.', 'Nie można otworzyć pobierania. Spróbuj ponownie.']
  };
  const box = document.createElement('div');
  box.className = 'native-updates note';
  const check = document.createElement('button');
  check.type = 'button';
  check.id = 'native-update-check';
  const download = document.createElement('button');
  download.type = 'button';
  download.id = 'native-update-download';
  download.className = 'primary';
  const message = document.createElement('p');
  message.setAttribute('role', 'status');
  message.setAttribute('aria-live', 'polite');
  let state = 'idle', busy = false, latest = '';
  function renderUpdates() {
    const t = words[document.documentElement.lang] || words.de;
    check.textContent = t[0];
    check.disabled = busy;
    download.textContent = t[5];
    download.hidden = state !== 'available' && state !== 'openError';
    download.disabled = busy;
    message.textContent = state === 'available' ? t[4] + latest :
      t[{idle:1, checking:2, current:3, error:6, unsupported:7, openError:8}[state]];
  }
  check.addEventListener('click', async () => {
    if (busy) return;
    busy = true;
    state = 'checking';
    renderUpdates();
    try {
      const result = await updates.check();
      state = ['current', 'available', 'unsupported'].includes(result?.status) ? result.status : 'error';
      latest = typeof result?.version === 'string' ? result.version : '';
    } catch { state = 'error'; }
    finally { busy = false; renderUpdates(); }
  });
  download.addEventListener('click', async () => {
    if (busy) return;
    busy = true;
    renderUpdates();
    try { await updates.openDownload(); }
    catch { state = 'openError'; }
    finally { busy = false; renderUpdates(); }
  });
  box.append(check, download, message);
  status.after(box);
  new MutationObserver(renderUpdates).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  renderUpdates();
})();
