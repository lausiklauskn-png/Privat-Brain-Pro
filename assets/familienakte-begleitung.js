/* Einordnung für die Familienakte (Klaus 15.11.2026, Punkt 6): Was Private Brain an die Familienakte gibt, trägt die Einordnung
   des Sortier-Kerns und die eigene Kategorie mit – als Begleitdatei „familienakte-uebergabe.json“ im Vertrag
   familienakte-uebergabe/1, den die Familienakte schon liest (lib/uebergabe-vorschlaege.ts: lebensbereich, dokumentart, vorgang,
   hinweis; alles nur Vorschläge, wirksam erst nach Prüfung dort). Die Unterteilung im Eingang der Familienakte (E-Mail,
   Anhang, Datei, Foto und darunter die Kategorie) steht in „vorgang“. Reine Funktionen, ohne Seite prüfbar. */
(function (wurzel) {
  'use strict';
  const NAME = 'familienakte-uebergabe.json';
  const sauber = (s, max) => String(s || '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
  /** Herkunft für die Unterteilung: E-Mail, Mail-Anhang, Foto oder Datei. */
  function herkunft(r) {
    if (r.mail || String(r.ext || '').toLowerCase() === 'eml') return 'E-Mail';
    if (r.fromMail || /(^|\/)Mail-Anhang\//.test(String(r.path || ''))) return 'Mail-Anhang';
    if (/^image\//.test(String(r.type || '')) || /^(png|jpe?g|webp|gif|heic|tiff?)$/i.test(String(r.ext || ''))) return 'Foto';
    return 'Datei';
  }
  /** Ein Eintrag der Begleitdatei. name = Dateiname, unter dem die Datei übergeben wird; sha256 = deren Prüfsumme (optional). */
  function eintrag(r, name, sha256) {
    const k = r.kern || {}, art = (wurzel.PBSuchFrage ? wurzel.PBSuchFrage.artVon(r) : k.art) || '';
    const kategorie = r.eigeneKategorie || (art && art !== 'Unklar' ? art.replace('/Werbung', '') : '');
    const hinweis = [k.absender && 'Absender: ' + k.absender, k.frist && 'Frist: ' + k.frist, k.betrag && 'Betrag: ' + k.betrag, k.person && 'Betrifft: ' + k.person,
      r.eigeneKategorie && 'Eigene Kategorie in Private Brain: ' + r.eigeneKategorie].filter(Boolean).join(' · ');
    const e = { name: sauber(name, 255) };
    if (/^[a-f0-9]{64}$/.test(sha256 || '')) e.sha256 = sha256;
    if (k.bereich) e.lebensbereich = sauber(k.bereich, 100);
    if (art && art !== 'Unklar') e.dokumentart = sauber(art, 100);
    e.vorgang = sauber(herkunft(r) + (kategorie ? ' › ' + kategorie : ''), 100);
    if (hinweis) e.hinweis = sauber(hinweis, 1000);
    return e;
  }
  /** Begleitdatei für bis zu 30 Dateien: [{ r, name, sha256 }]. Ergebnis: { name, text } oder null. */
  function begleitdatei(liste) {
    const dateien = (liste || []).slice(0, 30).map((x) => eintrag(x.r, x.name, x.sha256)).filter((e) => e.name);
    if (!dateien.length) return null;
    return { name: NAME, text: JSON.stringify({ vertrag: 'familienakte-uebergabe/1', quelle: 'Private Brain Pro', dateien }, null, 1) };
  }
  wurzel.PBFamilienakteBegleitung = { NAME, herkunft, eintrag, begleitdatei };
})(typeof window !== 'undefined' ? window : globalThis);
