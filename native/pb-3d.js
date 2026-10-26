/* 3D-Knöpfe (Klaus 2026-10-26, Sitzung 5, Punkte 5 und 6a). Dieselbe Datei in Pro (native/) und V3 (assets/).
   Kennzeichnet die vier Katalog-Kacheln der Übersicht und die Kategorie-Kacheln als Knöpfe (Klasse pb-3d,
   Aussehen in pb-3d.css) und lässt Glanz und Neigung dem Zeiger folgen. Vorbild: wireHoloButtons() auf
   family-projekt.de (assets/app.js); dort bis 9°, hier dezent 3°. Mit dem Finger gibt es nur ein kurzes
   Eindrücken. Bei „weniger Bewegung“ (prefers-reduced-motion) bleibt alles still; der Glanz bleibt. */
(() => {
  'use strict';
  if (window.PB3D) return;
  const SELECTOR = '#panel-dash .tile, #groups > .grp, .pb-overview-topics > .groups > .grp';
  const MAX_TILT = 3;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const still = () => motion.matches;
  const VARS = ['--pb-mx', '--pb-my', '--pb-rx', '--pb-ry'];
  function mark() {
    for (const node of document.querySelectorAll(SELECTOR)) if (!node.classList.contains('pb-3d')) node.classList.add('pb-3d');
  }
  function reset(node) {
    for (const name of VARS) node.style.removeProperty(name);
    node.classList.remove('pb-3d-press');
  }
  const button = event => event.target?.closest?.('.pb-3d') || null;
  // Glanz und Neigung folgen Maus und Stift; ein Finger neigt nichts (er verdeckt den Knopf ohnehin).
  document.addEventListener('pointermove', event => {
    const node = button(event); if (!node || still() || event.pointerType === 'touch') return;
    const box = node.getBoundingClientRect(); if (!box.width || !box.height) return;
    const px = Math.min(1, Math.max(0, (event.clientX - box.left) / box.width));
    const py = Math.min(1, Math.max(0, (event.clientY - box.top) / box.height));
    node.style.setProperty('--pb-mx', (px * 100).toFixed(1) + '%');
    node.style.setProperty('--pb-my', (py * 100).toFixed(1) + '%');
    node.style.setProperty('--pb-ry', ((px - .5) * 2 * MAX_TILT).toFixed(2) + 'deg');
    node.style.setProperty('--pb-rx', (-(py - .5) * 2 * MAX_TILT).toFixed(2) + 'deg');
  }, { passive: true });
  document.addEventListener('pointerout', event => {
    const node = button(event); if (node && !(event.relatedTarget && node.contains(event.relatedTarget))) reset(node);
  }, { passive: true });
  document.addEventListener('pointerdown', event => {
    const node = button(event); if (node && !still()) node.classList.add('pb-3d-press');
  }, { passive: true });
  for (const type of ['pointerup', 'pointercancel']) document.addEventListener(type, event => {
    const node = button(event); if (node) node.classList.remove('pb-3d-press');
  }, { passive: true });
  // Pro macht die Übersichts-Kacheln beim Start zu Knöpfen, die Kategorien werden bei jedem Katalogstand neu gebaut.
  let pending = false;
  const schedule = () => { if (pending) return; pending = true; queueMicrotask(() => { pending = false; mark(); }); };
  const start = () => { mark(); new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true }); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true }); else start();
  window.PB3D = Object.freeze({ mark, selector: SELECTOR, maxTilt: MAX_TILT, reduced: still });
})();
