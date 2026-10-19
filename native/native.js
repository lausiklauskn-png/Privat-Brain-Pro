(async () => {
  'use strict';
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
  try {
    const device = await window.Capacitor?.Plugins?.ProDevice?.getInfo();
    if (device) version = ` · ${device.versionName}`;
  } catch { /* Browser smoke tests have no Android bridge. */ }
  function render() {
    const t = text[document.documentElement.lang] || text.de;
    status.textContent = `${t[0]}${version}. ${t[1]}`;
  }
  new MutationObserver(render).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  render();
})();
