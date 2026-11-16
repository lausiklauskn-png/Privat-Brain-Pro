/* Eigene Kategorien (Klaus 15.11.2026, Punkt 3): „Versicherung“ oder was man selbst braucht. Mit einem Tipp an einer Datei
   zuordnen; danach fragt die App einmal „Alles von <Absender> künftig zu …?“. Ein Ja gilt auch für neue Dateien und Mails dieses
   Absenders und lässt sich jederzeit lösen. Eigene Kategorien gehen vor der Einordnung des Sortier-Kerns; sie stehen links mit
   Zahl und werden per Klick zum Kästchen im Suchfeld. Gespeichert wird am Katalog-Eintrag (r.eigeneKategorie, wandert mit der
   Katalogsicherung); die Regeln liegen im localStorage (pb_eigene_kategorien_v1), nur auf diesem Gerät. */
(function () {
  'use strict';
  const KEY = 'pb_eigene_kategorien_v1';
  const W = {
    de: { head: 'Eigene Kategorien', knopf: 'Kategorie', neu: 'Neue Kategorie …', name: 'Name der Kategorie', anlegen: 'Anlegen', keine: 'Keine eigene Kategorie',
      frage: 'Alles von „{a}“ künftig zu „{k}“?', ja: 'Ja, alles von diesem Absender', nur: 'Nur diese Datei', loesen: 'Regel für „{a}“ lösen', regel: 'nach Regel', abbrechen: 'Abbrechen' },
    en: { head: 'Own categories', knopf: 'Category', neu: 'New category …', name: 'Category name', anlegen: 'Create', keine: 'No own category',
      frage: 'Put everything from “{a}” into “{k}” from now on?', ja: 'Yes, everything from this sender', nur: 'Only this file', loesen: 'Remove rule for “{a}”', regel: 'by rule', abbrechen: 'Cancel' },
  };
  const t = (k) => (W[(document.documentElement.lang || 'de').slice(0, 2)] || W.de)[k] || W.de[k];
  const fold = (s) => String(s || '').toLocaleLowerCase('de').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ß/g, 'ss').trim();
  // „Nordlicht Labs, Inc“ (Beleg) und „Nordlicht Labs“ (Mail) sind derselbe Absender: Rechtsform und Satzzeichen zählen nicht.
  const schluessel = (s) => fold(s).replace(/\b(gmbh|mbh|ag|kg|eg|e\.?\s?v|inc|ltd|llc|pbc|corp|co|se|ug|ohg|gbr|kgaa)\b\.?/g, ' ').replace(/[^\p{L}\p{N}]+/gu, '');
  let stand = { kategorien: [], regeln: [] };
  try { const v = JSON.parse(localStorage.getItem(KEY) || 'null'); if (v && Array.isArray(v.kategorien)) stand = { kategorien: v.kategorien.filter(Boolean), regeln: Array.isArray(v.regeln) ? v.regeln : [] }; } catch {}
  const merken = () => { try { localStorage.setItem(KEY, JSON.stringify(stand)); } catch {} };
  const katalog = () => (typeof CATALOG !== 'undefined' ? CATALOG : []);
  const speichern = async (r) => { try { if (typeof idbPut === 'function') await idbPut('catalog', r); } catch {} };
  const nachHash = () => new Map(katalog().map((r) => [r.hash, r]));
  /** Absender eines Eintrags (Kern, Mail, bei Anhängen die Mail) – derselbe, nach dem die Suche gruppiert. */
  function absender(r, map) {
    const p = r.fromMail ? (map || nachHash()).get(r.fromMail) : null;
    const name = r.kern?.absender || (r.mail?.from && window.PBSuchFrage?.mailName(r.mail.from)) || p?.kern?.absender || (p?.mail?.from && window.PBSuchFrage?.mailName(p.mail.from)) || '';
    return String(name).trim();
  }
  /** Regeln anwenden: nur auf Einträge ohne eigene Wahl; eine von Hand gesetzte Kategorie bleibt immer. */
  async function regelnAnwenden() {
    const map = nachHash(); let n = 0;
    for (const r of katalog()) {
      if (r.eigeneKategorieQuelle === 'hand') continue;
      const a = schluessel(absender(r, map)), regel = a && stand.regeln.find((x) => schluessel(x.absender) === a);
      const soll = regel ? regel.kategorie : '';
      if ((r.eigeneKategorie || '') !== soll) { if (soll) { r.eigeneKategorie = soll; r.eigeneKategorieQuelle = 'regel'; } else { delete r.eigeneKategorie; delete r.eigeneKategorieQuelle; } await speichern(r); n++; }
    }
    return n;
  }
  const neuZeichnen = () => window.PBWorkspace?.renderExplorer?.();
  async function zuordnen(r, kat, row) {
    if (kat) { if (!stand.kategorien.includes(kat)) { stand.kategorien.push(kat); merken(); } r.eigeneKategorie = kat; r.eigeneKategorieQuelle = 'hand'; }
    else { delete r.eigeneKategorie; delete r.eigeneKategorieQuelle; }
    await speichern(r);
    const a = absender(r);
    if (kat && a && !stand.regeln.some((x) => schluessel(x.absender) === schluessel(a))) frage(row, r, a.replace(/,?\s*(inc|ltd|llc|pbc|gmbh|ag)\.?$/i, ''), kat); else neuZeichnen();
  }
  function frage(row, r, a, kat) {
    const box = document.createElement('div'); box.className = 'pb-eigene-frage'; box.setAttribute('role', 'group');
    const p = document.createElement('span'); p.textContent = t('frage').replace('{a}', a).replace('{k}', kat);
    const ja = knopf(t('ja'), async () => { stand.regeln.push({ absender: a, kategorie: kat }); merken(); await regelnAnwenden(); neuZeichnen(); });
    const nur = knopf(t('nur'), () => neuZeichnen());
    ja.className = 'primary'; box.append(p, ja, nur); row.after(box); ja.focus();
  }
  function knopf(text, tun) { const b = document.createElement('button'); b.type = 'button'; b.className = 'ghost'; b.textContent = text; b.onclick = tun; return b; }
  /** Werkzeug an einer Zeile: kleiner Knopf, darunter eine Auswahl (kein Fenster, keine Systemdialoge). */
  function zeile(row, r) {
    const b = knopf(r.eigeneKategorie ? r.eigeneKategorie : '+ ' + t('knopf'), () => menue(row, r));   // klein, „+ Kategorie“ (Klaus 16.11.2026, Punkt 15)
    b.classList.add('pb-eigene-knopf'); b.dataset.eigene = r.eigeneKategorie || ''; b.title = t('knopf') + (r.eigeneKategorieQuelle === 'regel' ? ' · ' + t('regel') : '');
    row.append(b);
  }
  function menue(row, r) {
    row.parentElement?.querySelectorAll('.pb-eigene-menue').forEach((m) => m.remove());
    const m = document.createElement('div'); m.className = 'pb-eigene-menue';
    for (const k of stand.kategorien) { const b = knopf(k, () => zuordnen(r, k, row)); if (k === r.eigeneKategorie) b.setAttribute('aria-pressed', 'true'); m.append(b); }
    const feld = document.createElement('input'); feld.type = 'text'; feld.placeholder = t('neu'); feld.setAttribute('aria-label', t('name')); feld.maxLength = 40; feld.className = 'pb-eigene-feld'; feld.id = 'pb-eigene-feld-' + String(r.hash).slice(0, 12);
    const neu = knopf(t('anlegen'), () => { const k = feld.value.trim().replace(/\s+/g, ' '); if (k) zuordnen(r, k, row); });
    feld.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') { ev.preventDefault(); neu.click(); } else if (ev.key === 'Escape') m.remove(); });
    m.append(feld, neu);
    if (r.eigeneKategorie) m.append(knopf(t('keine'), () => zuordnen(r, '', row)));
    const a = absender(r), regel = a && stand.regeln.find((x) => schluessel(x.absender) === schluessel(a));
    if (regel) m.append(knopf(t('loesen').replace('{a}', a), async () => { stand.regeln = stand.regeln.filter((x) => x !== regel); merken(); await regelnAnwenden(); neuZeichnen(); }));
    m.append(knopf(t('abbrechen'), () => m.remove()));
    row.after(m); (stand.kategorien.length ? m.querySelector('button') : feld).focus();
  }
  /** Linke Spalte: eigene Kategorien mit Zahl; Klick setzt das Kästchen „eigene“. */
  function baum(tree, heading, chips) {
    const zahl = new Map(); const seen = new Set();
    for (const r of katalog()) if (r.eigeneKategorie && !seen.has(r.hash) && seen.add(r.hash)) zahl.set(r.eigeneKategorie, (zahl.get(r.eigeneKategorie) || 0) + 1);
    const namen = [...new Set([...stand.kategorien, ...zahl.keys()])].sort((a, b) => a.localeCompare(b));
    if (!namen.length) return;
    tree.append(heading(t('head')));
    for (const k of namen) {
      const b = knopf(k + ' (' + (zahl.get(k) || 0) + ')', () => window.PBWorkspace?.addChip({ feld: 'eigene', wert: k, label: k }));
      b.dataset.eigeneKategorie = k; b.setAttribute('aria-current', (chips || []).some((c) => c.feld === 'eigene' && c.wert === k) ? 'location' : 'false'); tree.append(b);
    }
  }
  window.PBEigeneKategorien = { zeile, baum, regelnAnwenden, absender, get stand() { return JSON.parse(JSON.stringify(stand)); } };
  // Neu eingelesene oder neu eingeordnete Einträge bekommen die Regeln ab.
  addEventListener('pb-kern-geordnet', () => { if (stand.regeln.length) regelnAnwenden().then((n) => n && neuZeichnen()); });
})();
