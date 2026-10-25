/* Klaus 2026-10-25: der Film-Knopf (assets/filme.js, byte-gleich mit Privat-Brain-Pro-V3) gehört in die
   Navigationsleiste neben das Zahnrad. Rechts in der Kopfleiste schwebt das Siegel und würde ihn verdecken.
   Läuft nach filme.js (gleiches DOMContentLoaded, später angemeldet), rückt nur diesen einen Knopf um und gibt
   ihm die Maße von Zahnrad und Farbknopf: Finger 44 px, Maus/DeX 32 px. */
(() => {
  'use strict';
  const css = 'html .native-toolbar-quick>#pbFilme{display:inline-flex;flex:none;align-items:center;justify-content:center;'
    + 'width:44px!important;min-width:44px!important;height:44px!important;min-height:44px!important;padding:0!important}'
    + 'html .native-toolbar-quick>#pbFilme>svg{width:20px;height:20px;flex:none}'
    + '@media(any-pointer:fine){html .native-toolbar-quick>#pbFilme{width:32px!important;min-width:32px!important;height:32px!important;min-height:32px!important}}';
  function place() {
    const button = document.getElementById('pbFilme');
    const settings = document.querySelector('.native-toolbar-quick [data-tab="settings"]');
    if (!button || !settings) return;
    if (!document.getElementById('pbFilmeNative')) {
      const style = document.createElement('style'); style.id = 'pbFilmeNative'; style.textContent = css; document.head.append(style);
    }
    if (button.previousElementSibling !== settings) settings.after(button);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', place, { once: true }); else place();
})();
