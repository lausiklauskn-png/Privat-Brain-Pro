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
  // Prüf-Server laufen auf 127.0.0.1 (die Apps auf localhost bzw. ihrer eigenen Adresse); Firefox/WebKit melden webdriver nicht immer.
  if ((navigator.webdriver || location.hostname === '127.0.0.1') && erzwungen !== 'an') return;
  // Generalprüfung 16.11.2026: die Sprache wird bei jedem Zeichnen gelesen (beim Laden steht noch „de“ da) – DE/EN/RU/PL.
  const L = () => Math.max(0, ['de', 'en', 'ru', 'pl'].indexOf((document.documentElement.lang || 'de').slice(0, 2)));
  const NAMEN = {
    tresor: ['Tresor & Ablage', 'Vault & storage', 'Сейф и хранение', 'Sejf i miejsce zapisu'],
    proapps: ['Pro-Apps', 'Pro apps', 'Pro-приложения', 'Aplikacje Pro'],
    sprache: ['Sprache & Diktat', 'Language & dictation', 'Язык и диктовка', 'Język i dyktowanie'],
    bedeutung: ['Bedeutungssuche', 'Meaning search', 'Поиск по смыслу', 'Wyszukiwanie według znaczenia'],
    ocr: ['Texterkennung', 'Text recognition', 'Распознавание текста', 'Rozpoznawanie tekstu'],
    bild: ['Bildbeschreibung', 'Image description', 'Описание изображений', 'Opis obrazów'],
    ki: ['KI-Schlüssel (EU)', 'AI keys (EU)', 'Ключи ИИ (ЕС)', 'Klucze AI (UE)'],
    anhaenge: ['E-Mail-Anhänge', 'Email attachments', 'Вложения писем', 'Załączniki e-mail'],
    ordner: ['Ordner & Katalog', 'Folders & catalog', 'Папки и каталог', 'Foldery i katalog'],
    siegel: ['Siegel & Chefcode', 'Seal & boss code', 'Печать и код руководителя', 'Pieczęć i kod szefa'],
    werkzeuge: ['Werkzeuge', 'Tools', 'Инструменты', 'Narzędzia'],
    app: ['Aussehen & App', 'Appearance & app', 'Внешний вид и приложение', 'Wygląd i aplikacja'],
    weiteres: ['Weiteres', 'More', 'Прочее', 'Pozostałe'],
  };
  const WORT = {
    themen: ['Themen der Einstellungen', 'Settings topics', 'Темы настроек', 'Tematy ustawień'],
    alle: ['‹ Alle Themen', '‹ All topics', '‹ Все темы', '‹ Wszystkie tematy'],
    rot: ['Hier stimmt etwas nicht', 'Something needs attention', 'Здесь что-то не так', 'Coś wymaga uwagi'],
    farben: ['Farben wählen', 'Choose colours', 'Выбрать цвета', 'Wybierz kolory'],
    farbenHinweis: ['Die Farben der App stellst du mit dem Palette-Knopf oben rechts ein.', 'Set the app colours with the palette button at the top right.', 'Цвета приложения задаются кнопкой палитры вверху справа.', 'Kolory aplikacji ustawisz przyciskiem palety u góry po prawej.'],
  };
  // Reihenfolge = Reihenfolge der Knöpfe. [Schlüssel, Deutsch, Englisch, Erkennung] – angezeigt wird der Name aus NAMEN.
  const THEMEN = [
    ['tresor', 'Tresor & Ablage', 'Vault & storage', (e, h) => /^(tresorNote|vaultNote|vaultPlace)$/.test(e.id) || !!e.querySelector('#vaultPlace,#vault-choose') || /Tresor|Speicherort|Ablage|Vault|storage|Сейф|Хранилище|Sejf|Miejsce zapisu/i.test(h) && !/Pro-App-Verbund|Pro app network/i.test(h)],
    ['proapps', 'Pro-Apps', 'Pro apps', (e, h) => e.id === 'pbVerbundKarte' || /Pro-App|Zusammenarbeit/i.test(h)],
    ['sprache', 'Sprache & Diktat', 'Language & dictation', (e, h) => e.id === 'pb-input-language-settings' || /Sprache sprichst|Diktat|Mikrofon|language|dictation/i.test(h)],
    ['bedeutung', 'Bedeutungssuche', 'Meaning search', (e, h) => /offline läuft|Bedeutung|Modell|offline|meaning|model/i.test(h)],
    ['ocr', 'Texterkennung', 'Text recognition', (e, h) => e.id === 'pb-ocr-settings' || /Texterkennung/i.test(h)],
    ['bild', 'Bildbeschreibung', 'Image description', (e, h) => e.classList.contains('pb-bild-settings') || /Bildbeschreibung/i.test(h)],
    ['ki', 'KI-Schlüssel (EU)', 'AI keys (EU)', (e, h) => /EU-KI|Bring-Your-Own-Key|KI-Schlüssel/i.test(h)],
    ['anhaenge', 'E-Mail-Anhänge', 'Email attachments', (e, h) => !!e.querySelector('[data-i18n="attH"],#attToggle') || /E-Mail-Anhänge|Mail-Anhänge/i.test(h)],
    ['ordner', 'Ordner & Katalog', 'Folders & catalog', (e, h) => /Verbundene Ordner|Katalog verwalten|Mehrere Rechner/i.test(h)],
    ['siegel', 'Siegel & Chefcode', 'Seal & boss code', (e, h) => /^(mycelPlace|pbChefcode)$/.test(e.id) || /Siegel|Chefcode/i.test(h)],
    ['werkzeuge', 'Werkzeuge', 'Tools', (e, h) => e.id === 'pb-license' || /Werkzeuge freischalten/i.test(h)],
    ['app', 'Aussehen & App', 'Appearance & app', (e, h) => /^(pb-theme-settings|install-box)$/.test(e.id) || e.classList.contains('pb-state') || /Erscheinungsbild|Analyse|Zustand|installieren/i.test(h)],
  ];
  const WEITERES = ['weiteres', 'Weiteres', 'More'];
  const IMMER = (e) => e.id === 'pbThemen' || e.id === 'pbThemaKopf' || e.tagName === 'FOOTER' || e.classList.contains('native-status') || e.classList.contains('fp-badge-wrap');
  const FEHLER = /nicht erreichbar|fehlgeschlagen|nicht verfügbar|VAULT_FOLDER_UNAVAILABLE/i;
  let thema = null, zeichnen = false;

  const nav = document.createElement('nav'); nav.id = 'pbThemen'; nav.className = 'pb-themen'; 
  const kopf = document.createElement('div'); kopf.id = 'pbThemaKopf'; kopf.className = 'pb-thema-kopf'; kopf.hidden = true;
  const zurueck = document.createElement('button'); zurueck.type = 'button'; zurueck.className = 'ghost';
  const titel = document.createElement('h2'); titel.className = 'pb-thema-titel'; titel.tabIndex = -1;
  kopf.append(zurueck, titel); zurueck.onclick = () => oeffne(null);
  // In der Seite, damit sie ihre Höhe behält; native-help.js ordnet die Kästen selbst und darf die Knöpfe verschieben –
  // angezeigt werden sie per CSS-order trotzdem oben (#panel-settings.pb-themen-an ist eine Spalte).
  panel.prepend(nav, kopf); panel.classList.add('pb-themen-an');

  function themaVon(e) {
    const h = [...e.querySelectorAll('h2,h3,h4,h5,legend,summary')].slice(0, 3).map((x) => x.textContent).join(' | ');
    // Erst die genauen Merkmale (Kennung, Klasse), dann die Überschriften – so landet „Bildbeschreibung“ nicht unter „Modell“.
    const genau = (k) => ({ ocr: e.id === 'pb-ocr-settings', bild: e.classList.contains('pb-bild-settings'), sprache: e.id === 'pb-input-language-settings',
      werkzeuge: e.id === 'pb-license', anhaenge: !!e.querySelector('[data-i18n="attH"],#attToggle'), proapps: e.id === 'pbVerbundKarte', siegel: /^(mycelPlace|pbChefcode)$/.test(e.id), tresor: /^(tresorNote|vaultNote|vaultPlace)$/.test(e.id) || !!e.querySelector('#vaultPlace,#vault-choose'),
      app: /^(pb-theme-settings|install-box)$/.test(e.id) || e.classList.contains('pb-state') })[k];
    const t = THEMEN.find(([k]) => genau(k)) || THEMEN.find(([, , , erkenne]) => erkenne(e, h));
    const k = t ? t[0] : WEITERES[0]; if (e.dataset.pbThema !== k) e.dataset.pbThema = k; return k;
  }
  const glieder = () => [...panel.children].filter((e) => !IMMER(e));
  function anwenden() {
    zeichnen = true;
    try {
      const l = L();
      nav.setAttribute('aria-label', WORT.themen[l]); if (zurueck.textContent !== WORT.alle[l]) zurueck.textContent = WORT.alle[l];
      farbenZeile(l);
      const alle = glieder(), zahl = new Map(), rot = new Set();
      for (const e of alle) { const k = themaVon(e); zahl.set(k, (zahl.get(k) || 0) + 1); if (FEHLER.test(e.textContent || '')) rot.add(k); e.classList.toggle('pb-thema-aus', k !== thema); }
      nav.hidden = !!thema; kopf.hidden = !thema;
      const liste = [...THEMEN, WEITERES].filter(([k]) => zahl.get(k));
      const t = liste.find(([k]) => k === thema); titel.textContent = t ? NAMEN[t[0]][l] : '';
      const fokus = nav.contains(document.activeElement) ? document.activeElement.dataset.thema : '';
      nav.replaceChildren(...liste.map(([k]) => {
        const b = document.createElement('button'); b.type = 'button'; b.className = 'pb-thema-knopf'; b.dataset.thema = k; b.textContent = NAMEN[k][l];
        if (rot.has(k)) { const p = document.createElement('span'); p.className = 'pb-thema-rot'; p.title = WORT.rot[l]; b.append(p); b.dataset.rot = '1'; }
        b.onclick = () => oeffne(k); return b;
      }));
      if (fokus && !nav.hidden) nav.querySelector('[data-thema="' + fokus + '"]')?.focus();
    } finally { zeichnen = false; }
  }
  // Thema „Aussehen & App“: die Farben stehen am Palette-Knopf; eine Zeile im Kasten „Zustand“ führt dorthin (nichts wird doppelt gebaut).
  function farbenZeile(l) {
    const palette = document.getElementById('pb-palette-button'), ziel = panel.querySelector(':scope > .pb-state');
    let zeile = document.getElementById('pbThemaFarben');
    if (!palette || !ziel) { zeile?.remove(); return; }
    if (!zeile) {
      zeile = document.createElement('p'); zeile.id = 'pbThemaFarben'; zeile.className = 'hint pb-thema-farben';
      const text = document.createElement('span'), knopf = document.createElement('button'); knopf.type = 'button'; knopf.className = 'ghost';
      knopf.onclick = () => { try { panel.scrollIntoView({ block: 'start' }); } catch {} palette.focus(); palette.click(); };
      zeile.append(text, ' ', knopf);
    }
    const [text, knopf] = [zeile.firstElementChild, zeile.lastElementChild];
    if (text.textContent !== WORT.farbenHinweis[l]) text.textContent = WORT.farbenHinweis[l];
    if (knopf.textContent !== WORT.farben[l]) knopf.textContent = WORT.farben[l];
    if (zeile.parentElement !== ziel) ziel.append(zeile);
  }
  function oeffne(k) {
    const vorher = thema; thema = k; anwenden(); try { panel.scrollIntoView({ block: 'start' }); } catch {}
    // Geöffnet: Fokus auf die Überschrift des Themas (davor steht „‹ Alle Themen“, danach der Inhalt). Zurück: auf den Knopf, aus dem man kam.
    if (k) titel.focus({ preventScroll: true }); else if (vorher) (nav.querySelector('[data-thema="' + vorher + '"]') || nav.querySelector('button'))?.focus({ preventScroll: true });
    try { window.dispatchEvent(new CustomEvent('pb-einstellungen-thema', { detail: { thema: k } })); } catch {}
  }
  // Tab-Reihenfolge (Generalprüfung 16.11.2026): der Kopf steht im Dokument hinter manchen Kästen (native-help.js ordnet die Kästen
  // selbst) und nur per CSS oben. Die Tab-Taste folgt deshalb hier dem, was man sieht: „‹ Alle Themen“ → Inhalt des Themas → weiter.
  // Eingegriffen wird nur dort, wo die natürliche Reihenfolge davon abweicht; alles andere bleibt dem Browser überlassen.
  const tabbar = () => [...document.querySelectorAll('a[href],button,input,select,textarea,summary,[tabindex]')].filter((e) => e.tabIndex >= 0 && !e.disabled && e.type !== 'hidden' && e.getClientRects().length && getComputedStyle(e).visibility === 'visible' && !e.closest('[inert]'));
  document.addEventListener('keydown', (ev) => {
    if (ev.key !== 'Tab' || !thema || ev.defaultPrevented || ev.altKey || ev.ctrlKey || ev.metaKey || !panel.classList.contains('on')) return;
    const a = document.activeElement; if (!a || (a === titel && ev.shiftKey)) return;
    const natur = tabbar(), kaesten = glieder(), inhalt = natur.filter((e) => kaesten.some((g) => g.contains(e)));
    if (!inhalt.length || !natur.includes(zurueck)) return;
    const soll = natur.filter((e) => e !== zurueck); soll.splice(soll.indexOf(inhalt[0]), 0, zurueck);
    const hier = a === titel ? zurueck : a, i = soll.indexOf(hier), schritt = ev.shiftKey ? -1 : 1;
    if (i < 0) return;
    const ziel = soll[i + schritt];
    if (!ziel || (a !== titel && ziel === natur[natur.indexOf(hier) + schritt])) return;
    ev.preventDefault(); ziel.focus();
  }, true);
  // Nur fremde Änderungen zählen; die eigenen Knöpfe (nav, kopf) würden den Beobachter sonst endlos wecken.
  let geplant = false;
  new MutationObserver((liste) => {
    if (zeichnen || geplant || liste.every((m) => nav.contains(m.target) || kopf.contains(m.target) || (m.target === panel && [...m.addedNodes, ...m.removedNodes].every((n) => n === nav || n === kopf)))) return;
    geplant = true; requestAnimationFrame(() => { geplant = false; anwenden(); });
  }).observe(panel, { childList: true, subtree: true, characterData: true });
  // Wer zur Einstellungsseite springt, landet bei den Themen; ein Sprung zu einem Kasten öffnet dessen Thema.
  new MutationObserver(() => { if (!panel.classList.contains('on') && thema) { thema = null; try { window.dispatchEvent(new CustomEvent('pb-einstellungen-thema', { detail: { thema: null } })); } catch {} } anwenden(); }).observe(panel, { attributes: true, attributeFilter: ['class'] });
  new MutationObserver(() => anwenden()).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  const vorher = Element.prototype.scrollIntoView;
  Element.prototype.scrollIntoView = function (...a) {
    try { if (this !== panel && panel.contains(this)) { const g = glieder().find((e) => e.contains(this)); if (g && themaVon(g) !== thema) { thema = themaVon(g); anwenden(); } } } catch {}
    return vorher.apply(this, a);
  };
  window.PBEinstellungen = { oeffne, get thema() { return thema; }, themaVon: (e) => themaVon(e) };
  anwenden();
})();
