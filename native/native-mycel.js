/* Siegel and Mycel in the native app (Klaus 2026-10-21).
   Klaus: "nur die Symbole … das Mycel in das Siegel mit hineinpacken … nicht so viel Platz
   verschwenden." So only the round Siegel (Modul 17, byte-1:1) floats; drag it to the top bar
   and it snaps in, its small ✕ hides it. Tapping it opens the Siegel window, which here gets a
   "🌐 Mycel-Netz" button for the Mycel window (Modul 23-UI, byte-1:1, its own pill hidden).
   The canon brings no way back after ✕, so Settings gets one; the app menu opens the Mycel too.
   Deviation from the canon, asked for by Klaus: 17 and 23-UI are separate pills there.
   Klaus 27.11.2026: „das Siegel … pack es bitte bei Einstellungen mit rein. Und auch überall da, wo es noch auftaucht,
   es erfüllt seine Funktion im Hintergrund.“ The round Siegel no longer floats (it lay under the DeX window bar and
   stood in the way on the phone). Modul 17 and 16 still run unchanged in the background; Settings opens the Siegel
   window and the SBKIM window. */
(() => {
  'use strict';
  const words = {
    de: { title: 'Siegel und SBKIM', help: 'Das Siegel prüft die App still im Hintergrund. Hier siehst du, was es geprüft hat. Im SBKIM-Fenster verbindest du die Pro-Apps im Mycel, wenn du das möchtest.', seal: 'Siegel öffnen', net: 'SBKIM-Fenster öffnen', menu: 'SBKIM-Netz' },
    en: { title: 'Seal and SBKIM', help: 'The seal quietly checks the app in the background. Here you see what it checked. In the SBKIM window you connect the Pro apps in the mycel, if you want to.', seal: 'Open seal', net: 'Open SBKIM window', menu: 'SBKIM network' },
    ru: { title: 'Печать и SBKIM', help: 'Печать тихо проверяет приложение в фоне. Здесь видно, что она проверила. В окне SBKIM можно связать Pro-приложения в мицелий.', seal: 'Открыть печать', net: 'Открыть окно SBKIM', menu: 'Сеть SBKIM' },
    pl: { title: 'Pieczęć i SBKIM', help: 'Pieczęć cicho sprawdza aplikację w tle. Tutaj widać, co sprawdziła. W oknie SBKIM połączysz aplikacje Pro w grzybni, jeśli chcesz.', seal: 'Otwórz pieczęć', net: 'Otwórz okno SBKIM', menu: 'Sieć SBKIM' }
  };
  const t = key => (words[document.documentElement.lang] || words.de)[key];
  const make = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };
  const net = () => window.SbkimRendezvousUI;
  // The floating Siegel stays out of sight everywhere; its checks keep running (CSS only, nothing stored).
  const hiddenStyle = make('style'); hiddenStyle.id = 'pb-seal-in-settings';
  hiddenStyle.textContent = '#sbkim-widget{display:none!important}';
  (document.head || document.documentElement).append(hiddenStyle);
  /** Opens the Siegel window (Modul 16) through its badge; the badge lives in the hidden widget. */
  function showSeal() {
    const badge = document.getElementById('sbkim-siegel-badge') || document.getElementById('sbkim-widget-slot-siegel');
    try { badge?.click(); } catch (e) { console.warn('[PrivateBrain] Siegel nicht geöffnet:', e); }
    draw();
  }
  function openNet() { try { net()?.show(); } catch (e) { console.warn('[PrivateBrain] Mycel-Fenster nicht geöffnet:', e); } }

  // Write only real changes: the page watches its own DOM, and a rewrite would wake it again.
  const set = (node, text) => { if (node.textContent !== text) node.textContent = text; };
  let box, title, help, sealButton, netButton, menuButton;
  function draw() {
    if (box) {
      set(title, t('title')); set(help, t('help')); set(sealButton, t('seal')); set(netButton, t('net'));
      sealButton.hidden = !document.getElementById('sbkim-siegel-badge') && !document.getElementById('sbkim-widget-slot-siegel');
      netButton.hidden = !net();
    }
    if (menuButton) { set(menuButton, t('menu')); menuButton.title = t('net').replace(/\p{Extended_Pictographic}\uFE0F?\s*/gu, ''); menuButton.hidden = !net(); }
  }
  function mount() {
    const settings = document.getElementById('panel-settings');
    if (settings && !box) {
      box = make('div', 'note native-mycel'); box.id = 'mycelPlace';
      title = make('h3'); help = make('p', 'hint');
      sealButton = make('button', 'ghost'); sealButton.type = 'button'; sealButton.dataset.mycelSeal = '1'; sealButton.onclick = showSeal;
      netButton = make('button', 'ghost'); netButton.type = 'button'; netButton.dataset.mycelOpen = '1'; netButton.onclick = openNet;
      const row = make('div', 'btnrow'); row.append(sealButton, netButton);
      box.append(title, help, row);
      const install = document.getElementById('install-box');
      install ? install.before(box) : settings.append(box);
    }
    const panel = document.querySelector('.native-options-panel');
    if (panel && !menuButton) {
      menuButton = make('button', 'ghost native-mycel-menu'); menuButton.type = 'button'; menuButton.onclick = openNet;
      panel.prepend(menuButton);
    }
    draw();
  }
  // The round Siegel is all slot, and the canon starts no drag on a slot. The slot therefore lets
  // the pointer through to the pill (draggable), and a tap without movement opens it here.
  let press = null;
  document.addEventListener('pointerdown', e => { const w = e.target.closest?.('#sbkim-widget'); press = w && e.target === w ? { x: e.clientX, y: e.clientY } : null; }, true);
  document.addEventListener('pointerup', e => {
    if (!press) return; const moved = Math.hypot(e.clientX - press.x, e.clientY - press.y) > 5; press = null;
    if (!moved) document.getElementById('sbkim-widget-slot-siegel')?.click();
  }, true);
  // The Siegel window carries the way into the Mycel.
  function sealWindow() {
    const modal = document.getElementById('sbkim-siegel-modal');
    const dialog = modal?.querySelector('[role="dialog"]');
    if (!dialog || !net()) return;
    let row = dialog.querySelector('.native-mycel-in-seal');
    if (!row) {
      row = make('div', 'native-mycel-in-seal'); const b = make('button', 'ghost'); b.type = 'button'; b.dataset.mycelFromSeal = '1';
      b.onclick = () => { [...dialog.querySelectorAll('button')].find(x => x.textContent.trim() === '✕')?.click(); openNet(); };
      row.append(b);
      const head = dialog.querySelector('#sbkim-siegel-modal-title')?.parentElement;
      head && head !== dialog ? head.after(row) : dialog.prepend(row);
    }
    if (row.firstChild.textContent !== t('menu')) row.firstChild.textContent = t('menu');
  }
  // Watch only for the Siegel window to appear or be rebuilt, not for every change on the page.
  let sealQueued = false;
  new MutationObserver(() => { if (sealQueued) return; sealQueued = true; queueMicrotask(() => { sealQueued = false; if (document.getElementById('sbkim-siegel-modal')) sealWindow(); }); })
    .observe(document.body, { childList: true, subtree: true });
  // The Siegel hides via a class on its own element; re-check whenever Settings or the menu opens.
  document.addEventListener('click', () => setTimeout(draw, 0), true);
  new MutationObserver(draw).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
  // native-toolbar.js builds the app menu after this file; mount the menu entry once it exists.
  const wait = new MutationObserver(() => { if (document.querySelector('.native-options-panel')) { mount(); if (menuButton) wait.disconnect(); } });
  wait.observe(document.body, { childList: true, subtree: true });
  window.PBMycel = { showSeal, openNet };
})();
