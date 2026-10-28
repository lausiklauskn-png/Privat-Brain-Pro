/* Keine Web-Reste in der Pro-App (Leitfaden § 4, Klaus 2026-10-28).
   Die Oberfläche kommt aus der Web-Fassung, deren Sätze „Browser“, „Speicher dauerhaft“ usw. sagen. In der App stimmt das nicht:
   dort ist es Android bzw. das Gerät. Diese Schicht ersetzt nur in der App feste Wendungen in sichtbarem Text, Titel und Platzhalter
   (Postfach und Mails ausgenommen – dort heißt „im Browser öffnen“ wirklich Browser) und blendet reine Browser-Knöpfe aus.
   In der PWA (gleiches Bündel) tut sie nichts. */
(() => {
  'use strict';
  // Nur in der App: dort gibt es die Ablage-Brücke (wie native-vault.js). Die PWA aus demselben Bündel hat sie nicht.
  if (window.PBOhneWeb || typeof window.Capacitor?.Plugins?.ProVault?.state !== 'function') return;
  // Reihenfolge zählt: die längere Wendung zuerst.
  const ERSATZ = {
    de: [['nur in diesem Browser', 'nur auf diesem Gerät'], ['in diesem Browser', 'auf diesem Gerät'], ['Alles läuft in diesem Browser', 'Alles läuft auf diesem Gerät'],
      ['dein Browser', 'Android'], ['Dein Browser', 'Android'], ['Kopie im Browser', 'Kopie in der App'], ['im Browser', 'auf dem Gerät'],
      ['Browser-Texterkennung', 'Texterkennung auf dem Gerät'], ['Bietet der Browser', 'Bietet Android'], ['kann der Browser', 'kann die App'], ['Der Browser', 'Die App'], ['der Browser', 'die App']],
    en: [['only in this browser', 'only on this device'], ['in this browser', 'on this device'], ['your browser', 'Android'], ['Your browser', 'Android'],
      ['copy in the browser', 'copy in the app'], ['in the browser', 'on the device'], ['the browser', 'the app'], ['The browser', 'The app']],
    ru: [['только в этом браузере', 'только на этом устройстве'], ['в этом браузере', 'на этом устройстве'], ['ваш браузер', 'Android'], ['Ваш браузер', 'Android'],
      ['в браузере', 'на устройстве'], ['браузер', 'приложение']],
    pl: [['tylko w tej przeglądarce', 'tylko na tym urządzeniu'], ['w tej przeglądarce', 'na tym urządzeniu'], ['Twoja przeglądarka', 'Android'],
      ['twoja przeglądarka', 'Android'], ['w przeglądarce', 'na urządzeniu'], ['przeglądarka', 'aplikacja']]
  };
  // Reine Browser-Bedienung, die es in der App nicht gibt (Android hält den Speicher der App ohnehin dauerhaft).
  const AUSBLENDEN = ['#btnPersist', '#install-box', '#install-platz', '#installieren'];
  const ZEILE_AUSBLENDEN = ['stPersist'];   // „Speicher dauerhaft“ samt Beschriftung
  // [data-i18n="capP"]: die Bildbeschreibung hat in der App ihren eigenen App-Text (pb-bildbeschreibung.js, ProCaption) und setzt ihn
  // bei jeder Auffrischung neu – eine Ersetzung hier gäbe ein Hin und Her.
  const NIE = '#panel-mail, #mailWorkspace, .live-mail, [id^="sbkim-"], [class^="sbkim-"], script, style, textarea, input, [contenteditable="true"], #diagLog, [data-i18n="capP"]';
  const liste = () => ERSATZ[String(document.documentElement.lang || 'de').slice(0, 2)] || ERSATZ.de;
  const tausch = v => { let r = v; for (const [a, b] of liste()) if (r.includes(a)) r = r.split(a).join(b); return r; };
  const textKnoten = n => { const e = n.parentElement; if (!e || e.closest(NIE)) return; const neu = tausch(n.nodeValue); if (neu !== n.nodeValue) n.nodeValue = neu; };
  const attribute = e => { if (e.closest(NIE)) return; for (const a of ['title', 'placeholder', 'aria-label']) { const v = e.getAttribute(a); if (v) { const neu = tausch(v); if (neu !== v) e.setAttribute(a, neu); } } };
  function ausblenden() {
    for (const s of AUSBLENDEN) for (const e of document.querySelectorAll(s)) if (!e.hidden) e.hidden = true;
    for (const id of ZEILE_AUSBLENDEN) { const v = document.getElementById(id), k = v?.previousElementSibling; for (const e of [v, k]) if (e && !e.hidden) e.hidden = true; }
  }
  function durchgehen(wurzel) {
    if (!wurzel) return;
    if (wurzel.nodeType === Node.TEXT_NODE) return textKnoten(wurzel);
    if (wurzel.nodeType !== Node.ELEMENT_NODE) return;
    attribute(wurzel);
    const w = document.createTreeWalker(wurzel, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT); let n;
    while ((n = w.nextNode())) { if (n.nodeType === Node.TEXT_NODE) textKnoten(n); else attribute(n); }
  }
  function alles() { ausblenden(); durchgehen(document.body); }
  const beobachter = new MutationObserver(liste_ => {
    for (const m of liste_) {
      if (m.type === 'characterData') textKnoten(m.target);
      else if (m.type === 'attributes') attribute(m.target);
      else for (const n of m.addedNodes) durchgehen(n);
    }
    ausblenden();
  });
  function start() {
    alles();
    beobachter.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['title', 'placeholder', 'aria-label'] });
    new MutationObserver(alles).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true }); else start();
  window.PBOhneWeb = Object.freeze({ tausch, alles });
})();
