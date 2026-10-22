/* Runs first in every bundled tool page (Klaus 2026-10-22). The page only works inside Private Brain Pro's tool
   window and only when its unlock code is there; otherwise it goes back to the app. Tools do not register their own
   service worker inside the app (the app's files come from Android, as for Private Brain Pro itself). */
(() => {
  'use strict';
  try { if (window.ServiceWorkerContainer) ServiceWorkerContainer.prototype.register = function () { return Promise.reject(new Error('no service worker inside the app')); }; } catch { /* nothing to stop */ }
  let ok = false;
  try { ok = window.parent !== window && Boolean(window.parent.PBLicense?.unlocked(window.PB_TOOL_ID)); } catch { ok = false; }
  if (!ok) { try { window.stop(); } catch { /* old engine */ } document.documentElement.replaceChildren(); (window.parent !== window ? window.parent : window).location.replace(new URL('../index.html', location.href).href); }
})();
