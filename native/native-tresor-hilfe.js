/* Tresor-Hilfe (Klaus 15.11.2026, Punkte 1–5 und 7; Vorschau docs/design/tresor-hilfe-2026-11-15/).
   Anlass: der alte Ablageordner war gelöscht, die App meldete nur „SD-Karte eingesteckt?“, Mails gingen nicht auf.
   1 Gegenprobe des Ordnerbaums (beim Start, beim Zurückholen der App, beim Öffnen der Einstellungen, einmal am Tag; nur lesen):
     Ablage da (ProVault.diagnose: Karte · Erlaubnis · Ordner · Kennung), gemeinsamer Tresor erreichbar, beide im selben Hauptordner.
   2 Fällt eine Probe durch: oben ein Satz, was los ist, und „Beheben ›“ (Fehlercode nur hinter „?“).
   3 Beheben: Reparatur in einem Zug über „Tresor einrichten – nur Speicher wählen“ mit reparatur:true (Android prüft selbst, dass die
     alte Ablage wirklich fehlt). Sichtbar nur: „Nichts geschieht ohne deinen Tipp. Kein Ersatzordner.“ – der Rest hinter „?“.
   4 Geführte Schritte: Thema öffnen, der nächste Knopf leuchtet, daneben eine Blase; antippen muss man selbst.
   5 Knopf „Tresor-Hilfe“ im Thema Tresor & Ablage: Zustand in drei Zeilen, „Wo liegt was?“ und die Landkarte darin. */
(() => {
  'use strict';
  const vault = window.Capacitor?.Plugins?.ProVault;
  if (!vault || typeof vault.diagnose !== 'function' || window.PBTresorHilfe) return;
  const W = {
    de: {
      karte: 'Die SD-Karte ist nicht eingesteckt. Mails gehen trotzdem auf, werden aber nicht gesichert.',
      erlaubnis: 'Android hat den Zugriff auf den Ablageordner zurückgenommen. Mails gehen trotzdem auf, werden aber nicht gesichert.',
      ordner: 'Der Ablageordner „{pfad}“ ist nicht mehr da (gelöscht oder umbenannt). Mails gehen trotzdem auf, werden aber nicht gesichert.',
      tresor: 'Der gemeinsame Tresor der Pro-Apps ist nicht erreichbar.',
      baum: 'Ablage und gemeinsamer Tresor liegen in zwei verschiedenen Ordnern.',
      beheben: 'Beheben ›', hilfe: 'Tresor-Hilfe', titel: 'Tresor-Hilfe', zu: 'Schließen',
      tipp: 'Nichts geschieht ohne deinen Tipp. Kein Ersatzordner.',
      mehr: 'Nichts wird gelöscht oder überschrieben. Der alte, nicht mehr vorhandene Ort wird erst vergessen, wenn der neue funktioniert. Ist der alte Ordner doch noch da und nur die Erlaubnis fehlte, wird er einfach wieder verbunden. Android lässt keine App ohne einen Tipp in der Ordnerwahl auf der Karte suchen.',
      weiter: 'Weiter zur Ordnerwahl', schritte: 'Schritt für Schritt', pruefen: 'Erneut prüfen',
      zeigeKarte: 'In der Ordnerwahl öffnet sich die SD-Karte. Tippe nur „Diesen Ordner verwenden“ – den Tresor darin sucht die App selbst, dann einmal das Tresor-Passwort.',
      zeigeErlaubnis: 'In der Ordnerwahl den Ordner „{pfad}“ wählen und „Zulassen“ tippen, dann das Passwort.',
      kartein: 'SD-Karte einstecken, dann „Erneut prüfen“.',
      fertig: 'Repariert: ', ablage: 'Ablage', gemeinsam: 'Gemeinsamer Tresor', einBaum: 'Ein Baum',
      inOrdnung: 'in Ordnung', fehlt: 'fehlt', getrennt: 'zwei Ordner', ohneTresor: 'nicht verbunden',
      wo: 'Wo liegt was?', karteVerbund: 'Landkarte der Pro-Apps', code: 'Fehlercode',
      s1: 'Hier tippen, dann auf der SD-Karte „Family_Projekt_de“ wählen.', s1erlaubnis: 'Hier tippen und den Ordner „{pfad}“ wieder freigeben.',
      s2: 'Hier tippen und denselben Ordner wählen, in dem „tresorordner.json“ liegt.', schritt: 'Schritt {n} von {m}', ende: 'Hilfe beenden'
    },
    en: {
      karte: 'The SD card is not inserted. Emails still open but are not saved.',
      erlaubnis: 'Android withdrew access to the storage folder. Emails still open but are not saved.',
      ordner: 'The storage folder “{pfad}” is gone (deleted or renamed). Emails still open but are not saved.',
      tresor: 'The shared vault of the Pro apps cannot be reached.', baum: 'Storage and shared vault are in two different folders.',
      beheben: 'Fix ›', hilfe: 'Vault help', titel: 'Vault help', zu: 'Close',
      tipp: 'Nothing happens without your tap. No substitute folder.',
      mehr: 'Nothing is deleted or overwritten. The old, missing location is only forgotten once the new one works. If the old folder is still there and only the permission was missing, it is simply reconnected. Android lets no app search the card without a tap in the folder picker.',
      weiter: 'Continue to folder picker', schritte: 'Step by step', pruefen: 'Check again',
      zeigeKarte: 'The folder picker opens on the SD card. Just tap “Use this folder” – the app finds the vault inside, then asks once for the vault password.',
      zeigeErlaubnis: 'In the folder picker choose “{pfad}” and tap “Allow”, then the password.',
      kartein: 'Insert the SD card, then “Check again”.',
      fertig: 'Fixed: ', ablage: 'Storage', gemeinsam: 'Shared vault', einBaum: 'One tree',
      inOrdnung: 'fine', fehlt: 'missing', getrennt: 'two folders', ohneTresor: 'not connected',
      wo: 'Where is what?', karteVerbund: 'Map of the Pro apps', code: 'Error code',
      s1: 'Tap here, then choose “Family_Projekt_de” on the SD card.', s1erlaubnis: 'Tap here and allow the folder “{pfad}” again.',
      s2: 'Tap here and choose the same folder that holds “tresorordner.json”.', schritt: 'Step {n} of {m}', ende: 'End help'
    }
  };
  const t = (k, v = {}) => String((W[(document.documentElement.lang || 'de').slice(0, 2)] || W.de)[k] ?? W.de[k]).replace(/\{(\w+)\}/g, (_, x) => v[x] ?? '');
  const make = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const knopf = (text, fn, cls = 'ghost') => { const b = make('button', cls, text); b.type = 'button'; b.onclick = fn; return b; };
  const optionen = () => ({ language: document.documentElement.lang, dark: document.documentElement.dataset.theme === 'dunkel' });
  let befund = null, laeuft = null, zuletzt = 0;

  /** Gegenprobe (Punkt 7): nur lesen. Ergebnis { fall, pfad, tresor, einBaum, ok }. */
  async function gegenprobe() {
    if (laeuft) return laeuft;
    laeuft = (async () => {
      let d = {}, z = {};
      try { d = await vault.diagnose(); } catch (e) { d = { fall: 'unbekannt', problem: String(e?.code || e?.message || '') }; }
      try { z = typeof vault.tresorZustand === 'function' ? await vault.tresorZustand({}) : {}; } catch { z = {}; }
      const ablagePfad = String(d.pfad || ''), tresorPfad = String(z.pfad || '').replace(/\/+$/, '');
      const einBaum = !z.gewaehlt || !ablagePfad || !tresorPfad ? null : ablagePfad === tresorPfad || ablagePfad.startsWith(tresorPfad + '/');
      const tresorOk = !z.gewaehlt ? null : z.erreichbar !== false;
      befund = { fall: d.fall || 'unbekannt', problem: d.problem || '', pfad: ablagePfad, volume: d.volume || '', tresor: tresorOk, tresorPfad, einBaum, zeit: Date.now() };
      befund.ok = ['ok', 'nicht-eingerichtet'].includes(befund.fall) && tresorOk !== false && einBaum !== false;
      zuletzt = Date.now(); zeichneBand(); window.dispatchEvent(new CustomEvent('pb-tresor-gegenprobe', { detail: befund }));
      return befund;
    })().finally(() => { laeuft = null; });
    return laeuft;
  }
  function satz(b) {
    if (['karte', 'erlaubnis', 'ordner'].includes(b.fall)) return t(b.fall, { pfad: b.pfad || '?' });
    if (b.tresor === false) return t('tresor');
    if (b.einBaum === false) return t('baum');
    return '';
  }
  // ---------- Punkt 2: Satz oben mit „Beheben ›“ ----------
  const band = make('div', 'pb-tresor-band'); band.id = 'pbTresorBand'; band.hidden = true; band.setAttribute('role', 'alert');
  function zeichneBand() {
    const text = befund && !befund.ok ? satz(befund) : '';
    band.hidden = !text; if (!text) return;
    const code = make('details', 'pb-tresor-code'); code.append(make('summary', null, '?'), make('span', null, t('code') + ': ' + (befund.problem || 'VAULT_FOLDER_UNAVAILABLE · ' + befund.fall)));
    band.replaceChildren(make('span', 'pb-tresor-satz', text), knopf(t('beheben'), beheben, 'primary'), code);
    if (!band.isConnected) (document.querySelector('main') || document.body).prepend(band);
  }
  // ---------- Punkt 3: Reparatur in einem Zug ----------
  function dialog(titel, ...inhalt) {
    const d = make('dialog', 'live-dialog pb-tresor-dialog'); d.dataset.tresorHilfe = '';
    d.append(make('h2', null, titel), ...inhalt);
    document.body.append(d); d.addEventListener('close', () => d.remove(), { once: true }); d.showModal(); return d;
  }
  async function beheben() {
    const b = befund || await gegenprobe();
    const status = make('p', 'pb-tresor-status'); status.setAttribute('role', 'status');
    const tipp = make('p', 'pb-tresor-tipp', t('tipp'));
    const mehr = make('details', 'pb-tresor-mehr'); mehr.append(make('summary', null, '?'), make('p', null, t('mehr')));
    const reihe = make('div', 'btnrow');
    const d = dialog(t('titel'), make('p', null, satz(b) || t('inOrdnung')), status, tipp, mehr, reihe);
    const schliessen = knopf(t('zu'), () => d.close());
    if (b.fall === 'karte') { status.textContent = t('kartein'); reihe.append(knopf(t('pruefen'), async () => { await gegenprobe(); d.close(); if (!befund.ok) beheben(); }, 'primary'), schliessen); return; }
    if (b.fall === 'erlaubnis') {
      status.textContent = t('zeigeErlaubnis', { pfad: b.pfad });
      reihe.append(knopf(t('weiter'), () => { d.close(); fuehren([{ thema: 'tresor', ziel: '#vault-openExisting', text: t('s1erlaubnis', { pfad: b.pfad }) }]); document.getElementById('vault-openExisting')?.click(); }, 'primary'), knopf(t('schritte'), () => { d.close(); fuehren(schritteFuer(b)); }), schliessen);
      return;
    }
    status.textContent = t('zeigeKarte');
    const los = knopf(t('weiter'), async () => {
      los.disabled = true;
      try {
        const r = await vault.tresorEinrichten({ ...optionen(), reparatur: true, volume: b.volume || '' });
        if (r?.abgebrochen) { los.disabled = false; return; }
        status.textContent = t('fertig') + (r?.hauptordner || r?.pfad || '');
        await window.PBTresorordner?.aktualisieren?.(true); await window.PBVault?.refresh?.(); await window.PBProVerbund?.render?.();
        await gegenprobe(); if (befund.ok) setTimeout(() => d.close(), 1200);
      } catch (e) { los.disabled = false; status.textContent = (window.PBOrdnerHinweis?.meldung?.(String(e?.code || e?.message || '')) || String(e?.message || e)); }
    }, 'primary');
    reihe.append(los, knopf(t('schritte'), () => { d.close(); fuehren(schritteFuer(b)); }), schliessen);
  }
  // ---------- Punkt 4: geführte Schritte ----------
  function schritteFuer(b) {
    const s = [];
    if (b.fall === 'erlaubnis') s.push({ thema: 'tresor', ziel: '#vault-openExisting', text: t('s1erlaubnis', { pfad: b.pfad }) });
    else if (b.fall !== 'ok') s.push({ thema: 'tresor', ziel: '#vault-choose', text: t('s1') });
    if (b.tresor === false || b.einBaum === false || b.fall !== 'ok') s.push({ thema: 'tresor', ziel: () => [...document.querySelectorAll('#pro-verbund button')].find((x) => /Anderen Ordner|Other folder|Pro-Tresor verbinden/i.test(x.textContent)), text: t('s2') });
    return s;
  }
  let fuehrung = null;
  function fuehren(schritte, n = 0) {
    fuehrung?.ende();
    if (!schritte.length || n >= schritte.length) return;
    const s = schritte[n];
    window.PBWorkspace?.navigate?.('settings'); window.PBEinstellungen?.oeffne?.(s.thema);
    requestAnimationFrame(() => {
      const ziel = typeof s.ziel === 'function' ? s.ziel() : document.querySelector(s.ziel);
      if (!ziel) return;
      ziel.classList.add('pb-tresor-leucht'); try { ziel.scrollIntoView({ block: 'center' }); } catch {}
      const blase = make('div', 'pb-tresor-blase'); blase.setAttribute('role', 'status');
      blase.append(make('small', null, t('schritt', { n: n + 1, m: schritte.length })), make('p', null, s.text), knopf(t('ende'), () => fuehrung?.ende()));
      ziel.after(blase);
      const weiter = () => { fuehrung?.ende(); setTimeout(() => fuehren(schritte, n + 1), 400); };
      ziel.addEventListener('click', weiter, { once: true });
      fuehrung = { ende() { ziel.classList.remove('pb-tresor-leucht'); ziel.removeEventListener('click', weiter); blase.remove(); fuehrung = null; } };
    });
  }
  // ---------- Punkt 5: Knopf „Tresor-Hilfe“ mit Zustand, „Wo liegt was?“ und Landkarte ----------
  function zeile(name, ok, text) { const z = make('div', 'pb-tresor-zeile' + (ok === false ? ' rot' : ok === null ? ' grau' : '')); z.append(make('span', 'pb-tresor-punkt'), make('b', null, name), make('span', null, text)); return z; }
  async function hilfeZeigen() {
    const b = await gegenprobe();
    const liste = make('div', 'pb-tresor-liste');
    liste.append(
      zeile(t('ablage'), ['ok', 'nicht-eingerichtet'].includes(b.fall) ? true : false, b.fall === 'ok' ? (b.pfad || t('inOrdnung')) : b.fall === 'nicht-eingerichtet' ? '—' : t('fehlt') + (b.pfad ? ': ' + b.pfad : '')),
      zeile(t('gemeinsam'), b.tresor, b.tresor === null ? t('ohneTresor') : b.tresor ? (b.tresorPfad || t('inOrdnung')) : t('fehlt')),
      zeile(t('einBaum'), b.einBaum, b.einBaum === null ? '—' : b.einBaum ? t('inOrdnung') : t('getrennt')));
    const reihe = make('div', 'btnrow');
    const d = dialog(t('titel'), liste, reihe);
    if (!b.ok) reihe.append(knopf(t('beheben'), () => { d.close(); beheben(); }, 'primary'));
    if (document.getElementById('woLiegtWasKnopf')) reihe.append(knopf(t('wo'), () => { d.close(); document.getElementById('woLiegtWasKnopf').click(); }));
    if (window.PBVerbundKarte?.zeigen) reihe.append(knopf(t('karteVerbund'), () => { d.close(); window.PBVerbundKarte.zeigen(); }));
    reihe.append(knopf(t('zu'), () => d.close()));
  }
  function knopfEinsetzen() {
    const alt = document.getElementById('woLiegtWasKnopf');
    if (!alt || document.getElementById('pbTresorHilfeKnopf')) return;
    const b = knopf(t('hilfe'), hilfeZeigen, 'primary'); b.id = 'pbTresorHilfeKnopf';
    alt.before(b); alt.classList.add('pb-tresor-alt');
  }
  new MutationObserver(() => knopfEinsetzen()).observe(document.body, { childList: true, subtree: true });
  knopfEinsetzen();
  // Wann geprüft wird: Start, Zurückholen der App, Öffnen der Einstellungen, einmal am Tag.
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && Date.now() - zuletzt > 60000) void gegenprobe(); });
  const einstellungen = document.getElementById('panel-settings');
  if (einstellungen) new MutationObserver(() => { if (einstellungen.classList.contains('on') && Date.now() - zuletzt > 10000) void gegenprobe(); }).observe(einstellungen, { attributes: true, attributeFilter: ['class'] });
  setInterval(() => { if (Date.now() - zuletzt > 864e5) void gegenprobe(); }, 36e5);
  setTimeout(() => void gegenprobe(), 1500);
  window.PBTresorHilfe = { gegenprobe, beheben, hilfeZeigen, fuehren, get befund() { return befund; } };
})();
