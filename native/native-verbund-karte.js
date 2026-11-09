/* Pro-App-Verbund (Vorschau) – Klaus 2026-11-09: „die Karte in die Apps einbauen … als Vorschau … damit man sieht,
   aha, das könnte man noch machen“. Die Landkarte assets/pro-verbund.html ist byte-1:1 aus BookLedgerPro
   (Pin assets/pro-verbund.herkunft.json, Drift-Guard) und wird hier nie geändert.
   App-eigen: ein Kasten in den Einstellungen (vor „Als App installieren“), ein Knopf öffnet die Karte in einem
   Vollbild-Rahmen (<dialog> mit <iframe>, kein neues Fenster). Android-Zurück und Esc schließen ihn über den
   vorhandenen Weg in native-navigation.js (offene Dialoge zuerst). Die Karte selbst ist deutsch. */
(() => {
  'use strict';
  if (window.PBVerbundKarte) return;
  const T = {
    de: { titel: 'Pro-App-Verbund (Vorschau)', info: 'Wie Private Brain Pro mit BookLedgerPro, Workflow PDF Pro und der Familienakte zusammenarbeitet – Stand der Wege in Farben.', knopf: 'Karte ansehen', schliessen: 'Schließen', rahmen: 'Landkarte des Pro-App-Verbunds' },
    en: { titel: 'Pro app network (preview)', info: 'How Private Brain Pro works together with BookLedgerPro, Workflow PDF Pro and Familienakte – the state of each path in colours. The map itself is in German.', knopf: 'View map', schliessen: 'Close', rahmen: 'Map of the Pro app network' },
    ru: { titel: 'Связка Pro-приложений (предпросмотр)', info: 'Как Private Brain Pro работает вместе с BookLedgerPro, Workflow PDF Pro и Familienakte – состояние каждого пути цветом. Сама карта на немецком.', knopf: 'Открыть карту', schliessen: 'Закрыть', rahmen: 'Карта связки Pro-приложений' },
    pl: { titel: 'Współpraca aplikacji Pro (podgląd)', info: 'Jak Private Brain Pro współpracuje z BookLedgerPro, Workflow PDF Pro i Familienakte – stan każdej drogi w kolorach. Sama mapa jest po niemiecku.', knopf: 'Pokaż mapę', schliessen: 'Zamknij', rahmen: 'Mapa współpracy aplikacji Pro' }
  };
  const t = () => T[String(document.documentElement.lang || 'de').slice(0, 2)] || T.de;
  const SEITE = 'assets/pro-verbund.html';
  const css = '.pb-verbund-rahmen{width:100vw;height:100dvh;max-width:none;max-height:none;margin:0;padding:0;border:0;background:var(--bg,#fff);color:inherit;display:flex;flex-direction:column}'
    + '.pb-verbund-rahmen:not([open]){display:none}'
    + '.pb-verbund-kopf{display:flex;align-items:center;gap:8px;padding:6px 10px;border-bottom:1px solid var(--line,#ccc)}'
    + '.pb-verbund-kopf h2{flex:1;margin:0;font-size:1rem;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
    + '.pb-verbund-rahmen iframe{flex:1;width:100%;border:0;min-height:0;background:#fff}';

  function zeigen() {
    if (document.querySelector('.pb-verbund-rahmen')) return;
    const w = t();
    if (!document.getElementById('pbVerbundCss')) { const s = document.createElement('style'); s.id = 'pbVerbundCss'; s.textContent = css; document.head.append(s); }
    const d = document.createElement('dialog'); d.className = 'pb-verbund-rahmen'; d.setAttribute('aria-label', w.titel);
    const kopf = document.createElement('div'); kopf.className = 'pb-verbund-kopf';
    const h = document.createElement('h2'); h.textContent = w.titel;
    const zu = document.createElement('button'); zu.type = 'button'; zu.className = 'primary'; zu.dataset.verbundSchliessen = ''; zu.textContent = w.schliessen;
    zu.onclick = () => d.close();
    kopf.append(h, zu);
    const f = document.createElement('iframe'); f.src = SEITE; f.title = w.rahmen; f.dataset.verbundKarte = '';
    d.append(kopf, f);
    document.body.append(d);
    d.addEventListener('close', () => d.remove(), { once: true });
    d.showModal();
  }

  let kasten = null;
  function bauen() {
    const panel = document.getElementById('panel-settings');
    if (!panel || !window.ProBedienung) return false;
    const w = t();
    const k = ProBedienung.kasten('pb-verbund-karte', w.titel, { erklaerung: w.info });
    k.element.id = 'pbVerbundKarte'; k.element.classList.add('note');
    k.rumpf.append(ProBedienung.knopf(w.knopf, { name: 'verbund-karte', beiTipp: zeigen }));
    if (kasten?.isConnected) kasten.replaceWith(k.element);
    else { const install = document.getElementById('install-box'); install ? install.before(k.element) : panel.append(k.element); }
    kasten = k.element;
    return true;
  }
  const start = () => { if (!bauen()) setTimeout(start, 300); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true }); else start();
  new MutationObserver(() => { if (kasten) bauen(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  window.PBVerbundKarte = Object.freeze({ zeigen });
})();
