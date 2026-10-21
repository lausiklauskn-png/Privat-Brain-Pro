/* Klaus 2026-10-21: "rechts ist Platz". On first start the round Siegel sits in the top bar on
   the right, just before the arrows and ☰, instead of the canon's lower corner. Runs before
   Modul 17 reads its saved place; once Klaus drags it, his place wins (the key then exists). */
(() => {
  'use strict';
  try {
    const seg = (location.pathname || '').replace(/^\/+/, '').split('/')[0];
    const key = 'sbkim_widget_position__' + (seg || 'root');
    // The native header keeps only ← → ☰ on the right (118–126 px), so 128 px from the edge keeps
    // the Siegel clear of them at every width and clear of the title from 360 px up. At 320 px the
    // gap between title and arrows is only 26 px; there the Siegel touches the title's end.
    const gap = 128;
    if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify({ corner: null, offsetX: 16, offsetY: 16, x: null, y: null, oben: { seite: 'rechts', abstand: gap } }));
  } catch { /* Without storage the canon default stays. */ }
})();
