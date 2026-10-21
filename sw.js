/* Private Brain — Service Worker (offline App-Schale, cache-first).
   Fremde Origins werden durchgereicht (z. B. bewusst freigeschaltete EU-KI). */
const CACHE = "private-brain-v90";

/* ⚠ NUR EIGENE VORRAETE AUFRAEUMEN — `caches` gehoert dem URSPRUNG, nicht dem
 * Pfad. Auf lausiklauskn-png.github.io liegen rund zwanzig Apps; ein Filter,
 * der nur "ist nicht meiner" fragt, laesst ALLE fremden durch und loescht sie.
 * Gemessen am 2026-09-08 an zwei echten Apps
 * (Sage-Protokol/tests/vorrat_wirkung.mjs). Praefix ABGELESEN aus der
 * Vorrat-Konstante, nicht geraten. Muster aus Tomys-Hub/bookledger/sw.js.
 * Es muss BEIDES tun: fremde stehen lassen UND eigene alte weiter wegraeumen. */
const VORRAT_PRAEFIX = "private-brain-";
const SHELL = [
  "./",
  "./index.html",
  "./assets/workspace.js",
  "./assets/workspace.css",
  "./assets/mail-workspace.js",
  "./assets/live-mail.js",
  "./assets/mail-workspace.css",
  "./modules/25_pseudonym.js",
  "./modules/pruefer.js",
  "./modules/pruefer-formate.js",
  "./modules/pruefer-anhang.js",
  "./app-manifest.json",
  "./assets/brain-emoji.svg",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-192.png?v=3d",
  "./icon-512.png?v=3d",
  "./catalog-emblem.png",
  "./impressum.html",
  "./modules/jasonlib.js",
  "./assets/fonts/Prata-400-latin.woff2",
  "./assets/fonts/Prata-400-cyrillic.woff2",
  "./assets/fonts/Lato-300-latin.woff2",
  "./assets/fonts/Lato-400-latin.woff2",
  "./assets/fonts/Lato-400-latin-ext.woff2",
  "./assets/fonts/Lato-700-latin.woff2",
  "./assets/fonts/OpenSans-400-cyrillic.woff2",
  "./assets/fonts/OpenSans-400-latin.woff2",
  "./modules/01_storage.js",
  "./modules/02_spore.js",
  "./modules/03_embedding.js",
  "./modules/04_match.js",
  "./modules/pruefer-mail.js",
  "./modules/reinigung.js",
  "./modules/ki-reinigung.js",
  "./modules/05_anastomose.js",
  "./modules/05b_nostr_relay.js",
  "./modules/noble-secp256k1.js",
  "./modules/23_rendezvous.js",
  "./modules/20_schluessel_safe.js",
  "./modules/21_spracheingabe.js",
  "./modules/07_apoptose.js",
  "./modules/15_membran.js",
  "./modules/16_siegel.js",
  "./modules/17_floating_widget.js",
  "./modules/rendezvous-init.js",
  "./modules/23_rendezvous_ui.js",
  "./modules/pinnwand-widget.js",
  "./modules/dm_crypto.js",
  "./assets/schutz-init.js",
  "./assets/siegel-inhalt.js",
  "./assets/sbkim-andock-wizard.js",
  "./assets/installieren.js?v=1",
  "./sicherheit.html"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith(VORRAT_PRAEFIX) && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // Nur eigene Origin cachen; alles Fremde (EU-KI etc.) direkt durchreichen.
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/mail")) return;
  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (res && res.ok && res.type === "basic") {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
      }
      return res;
    }).catch(() => caches.match("./index.html")))
  );
});
