/* Klaus 2026-10-21: "rechts ist Platz". On first start the round Siegel sits in the top bar on
   the right, just before the arrows and ☰, instead of the canon's lower corner. Runs before
   Modul 17 reads its saved place; once Klaus drags it, his place wins (the key then exists). */
(() => {
  'use strict';
  try {
    const seg = (location.pathname || '').replace(/^\/+/, '').split('/')[0];
    const key = 'sbkim_widget_position__' + (seg || 'root');
    // The native header keeps the internet lamp and ← → ☰ on the right (about 138–148 px), so
    // 152 px from the edge keeps the Siegel clear of them. Version .20 seeded 128 (before the lamp);
    // that exact untouched seed moves along, any place Klaus chose himself stays.
    const gap = 152, old = 128;
    const saved = localStorage.getItem(key);
    const seed = () => localStorage.setItem(key, JSON.stringify({ corner: null, offsetX: 16, offsetY: 16, x: null, y: null, oben: { seite: 'rechts', abstand: gap } }));
    if (!saved) seed();
    else { const v = JSON.parse(saved); if (v?.oben?.seite === 'rechts' && v.oben.abstand === old && v.x == null && v.y == null) seed(); }
  } catch { /* Without storage the canon default stays. */ }
})();
