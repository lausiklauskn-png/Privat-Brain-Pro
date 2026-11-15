/* Einstellungen nach Themen (Klaus 15.11.2026, Punkt D): Das Zahnrad zeigt zuerst nur Themen-Knöpfe; ein Tipp zeigt nur dieses
   Thema, „‹ Alle Themen“ führt zurück. Die vorhandenen Kästen bleiben, wie sie sind – sie werden nur ihrem Thema zugeordnet
   (an Kennung, Klasse oder Überschrift). Kästen, die andere Teile der App später einsetzen, ordnet ein Beobachter nach.
   Springt ein Teil der App per scrollIntoView zu einem Kasten, öffnet sich dessen Thema von selbst. Ein Thema, in dem gerade
   „nicht erreichbar“ oder ein Fehler steht, trägt einen roten Punkt. */
(function () {
  'use strict';
  const panel = document.getElementById('panel-settings');
  if (!panel || window.PBEinstellungen) return;
  // Ältere Browser-Proben (Playwright, navigator.webdriver) erwarten alle Kästen auf einer Seite; für sie bleibt es so,
  // außer eine Probe schaltet die Themen ausdrücklich ein (localStorage pb_einstellungen_themen = "an"). Am Gerät gilt immer: Themen.
  let erzwungen = ''; try { erzwungen = localStorage.getItem('pb_einstellungen_themen') || ''; } catch {}
  if (navigator.webdriver && erzwungen !== 'an') return;
  const L = (document.documentElement.lang || 'de').slice(0, 2) === 'en' ? 1 : 0;
  // Reihenfolge = Reihenfolge der Knöpfe. [Schlüssel, Deutsch, Englisch, Erkennung]
  const THEMEN = [
    ['tresor', 'Tresor & Ablage', 'Vault & storage', (e, h) => /^(tresorNote|vaultNote)$/.test(e.id) || /Tresor|Speicherort|Ablage/i.test(h) && !/Pro-App-Verbund/.test(h)],
    ['proapps', 'Pro-Apps', 'Pro apps', (e, h) => e.id === 'pbVerbundKarte' || /Pro-App|Zusammenarbeit/i.test(h)],
    ['sprache', 'Sprache & Diktat', 'Language & dictation', (e, h) => e.id === 'pb-input-language-settings' || /Sprache sprichst|Diktat|Mikrofon/i.test(h)],
    ['bedeutung', 'Bedeutungssuche', 'Meaning search', (e, h) => /offline läuft|Bedeutung|Modell/i.test(h)],
    ['ocr', 'Texterkennung', 'Text recognition', (e, h) => e.id === 'pb-ocr-settings' || /Texterkennung/i.test(h)],
    ['bild', 'Bildbeschreibung', 'Image description', (e, h) => e.classList.contains('pb-bild-settings') || /Bildbeschreibung/i.test(h)],
    ['ki', 'KI-Schlüssel (EU)', 'AI keys (EU)', (e, h) => /EU-KI|Bring-Your-Own-Key|KI-Schlüssel/i.test(h)],
    ['anhaenge', 'E-Mail-Anhänge', 'Email attachments', (e, h) => /E-Mail-Anhänge|Mail-Anhänge/i.test(h)],
    ['ordner', 'Ordner & Katalog', 'Folders & catalog', (e, h) => /Verbundene Ordner|Katalog verwalten|Mehrere Rechner/i.test(h)],
    ['siegel', 'Siegel & Chefcode', 'Seal & boss code', (e, h) => /^(mycelPlace|pbChefcode)$/.test(e.id) || /Siegel|Chefcode/i.test(h)],
    ['werkzeuge', 'Werkzeuge', 'Tools', (e, h) => e.id === 'pb-license' || /Werkzeuge freischalten/i.test(h)],
    ['app', 'Aussehen & App', 'Appearance & app', (e, h) => /^(pb-theme-settings|install-box)$/.test(e.id) || e.classList.contains('pb-state') || /Erscheinungsbild|Analyse|Zustand|installieren/i.test(h)],
  ];
  const WEITERES = ['weiteres', 'Weiteres', 'More'];
  const IMMER = (e) => e.id === 'pbThemen' || e.id === 'pbThemaKopf' || e.tagName === 'FOOTER' || e.classList.contains('native-status') || e.classList.contains('fp-badge-wrap');
  const FEHLER = /nicht erreichbar|fehlgeschlagen|nicht verfügbar|VAULT_FOLDER_UNAVAILABLE/i;
  let thema = null, zeichnen = false;

  const nav = document.createElement('nav'); nav.id = 'pbThemen'; nav.className = 'pb-themen'; nav.setAttribute('aria-label', ['Themen der Einstellungen', 'Settings topics'][L]);
  const kopf = document.createElement('div'); kopf.id = 'pbThemaKopf'; kopf.className = 'pb-thema-kopf'; kopf.hidden = true;
  const zurueck = document.createElement('button'); zurueck.type = 'button'; zurueck.className = 'ghost'; zurueck.textContent = ['‹ Alle Themen', '‹ All topics'][L];
  const titel = document.createElement('h2'); titel.className = 'pb-thema-titel';
  kopf.append(zurueck, titel); zurueck.onclick = () => oeffne(null);
  // Vor der Seite, nicht in ihr: native-help.js ordnet die Kästen der Seite selbst und würde die Knöpfe sonst verschieben.
  panel.before(nav, kopf);

  function themaVon(e) {
    const h = [...e.querySelectorAll('h2,h3,h4,h5,legend,summary')].slice(0, 3).map((x) => x.textContent).join(' | ');
    // Erst die genauen Merkmale (Kennung, Klasse), dann die Überschriften – so landet „Bildbeschreibung“ nicht unter „Modell“.
    const genau = (k) => ({ ocr: e.id === 'pb-ocr-settings', bild: e.classList.contains('pb-bild-settings'), sprache: e.id === 'pb-input-language-settings',
      werkzeuge: e.id === 'pb-license', proapps: e.id === 'pbVerbundKarte', siegel: /^(mycelPlace|pbChefcode)$/.test(e.id), tresor: /^(tresorNote|vaultNote)$/.test(e.id),
      app: /^(pb-theme-settings|install-box)$/.test(e.id) || e.classList.contains('pb-state') })[k];
    const t = THEMEN.find(([k]) => genau(k)) || THEMEN.find(([, , , erkenne]) => erkenne(e, h));
    const k = t ? t[0] : WEITERES[0]; if (e.dataset.pbThema !== k) e.dataset.pbThema = k; return k;
  }
  const glieder = () => [...panel.children].filter((e) => !IMMER(e));
  function anwenden() {
    zeichnen = true;
    try {
      const alle = glieder(), zahl = new Map(), rot = new Set();
      for (const e of alle) { const k = themaVon(e); zahl.set(k, (zahl.get(k) || 0) + 1); if (FEHLER.test(e.textContent || '')) rot.add(k); e.classList.toggle('pb-thema-aus', k !== thema); }
      const an = panel.classList.contains('on'); nav.hidden = !an || !!thema; kopf.hidden = !an || !thema;
      const liste = [...THEMEN, WEITERES].filter(([k]) => zahl.get(k));
      const t = liste.find(([k]) => k === thema); titel.textContent = t ? t[1 + L] : '';
      nav.replaceChildren(...liste.map(([k, de, en]) => {
        const b = document.createElement('button'); b.type = 'button'; b.className = 'pb-thema-knopf'; b.dataset.thema = k; b.textContent = [de, en][L];
        if (rot.has(k)) { const p = document.createElement('span'); p.className = 'pb-thema-rot'; p.title = ['Hier stimmt etwas nicht', 'Something needs attention'][L]; b.append(p); b.dataset.rot = '1'; }
        b.onclick = () => oeffne(k); return b;
      }));
    } finally { zeichnen = false; }
  }
  function oeffne(k) { thema = k; anwenden(); try { panel.scrollIntoView({ block: 'start' }); } catch {} if (k) zurueck.focus(); }
  // Nur fremde Änderungen zählen; die eigenen Knöpfe (nav, kopf) würden den Beobachter sonst endlos wecken.
  let geplant = false;
  new MutationObserver((liste) => {
    if (zeichnen || geplant) return;
    geplant = true; requestAnimationFrame(() => { geplant = false; anwenden(); });
  }).observe(panel, { childList: true, subtree: true, characterData: true });
  // Wer zur Einstellungsseite springt, landet bei den Themen; ein Sprung zu einem Kasten öffnet dessen Thema.
  new MutationObserver(() => { if (!panel.classList.contains('on')) thema = null; anwenden(); }).observe(panel, { attributes: true, attributeFilter: ['class'] });
  const vorher = Element.prototype.scrollIntoView;
  Element.prototype.scrollIntoView = function (...a) {
    try { if (this !== panel && panel.contains(this)) { const g = glieder().find((e) => e.contains(this)); if (g && themaVon(g) !== thema) { thema = themaVon(g); anwenden(); } } } catch {}
    return vorher.apply(this, a);
  };
  window.PBEinstellungen = { oeffne, get thema() { return thema; }, themaVon: (e) => themaVon(e) };
  anwenden();
})();
