# Sitzung 5 – 3D-Knöpfe in der Übersicht, Kategorien mit Ordnerbaum-Vorschau

**Diese Sitzung ist Sitzung 5.** Sag Klaus zu Beginn: „Wir sind in Sitzung 5.“ Punkte **5** und **6a** der
[Sammlung](docs/design/aenderungen-2026-10-26/SAMMLUNG.md), für alle sechs Varianten (Pro + V3, je Android/Windows/PWA).

## Ausgangsstand

Sitzung 4 (Bildbeschreibung) liegt auf dem Zweig `ccr-2068cf6c-0u3a7n` in vier Repos mit Entwurfs-PRs: Pro #89,
V3 #24, Workflow-PDF #134, Workflow-PDF-Pro #26. **Nichts davon ist übernommen oder
veröffentlicht** – nur auf Klaus' Wort. Sind die PRs bei Sitzungsbeginn auf main: frisch von `origin/main` abzweigen.
Sind sie es nicht: Klaus fragen, ob Sitzung 5 auf dem Sitzungs-4-Zweig aufsetzen oder warten soll (sonst gibt es später
Konflikte in `pb-bildbeschreibung.*`, `native-help.js`, `test-design-26`).
Rückblick: [Abschluss Sitzung 4](docs/design/aenderungen-2026-10-26/ABSCHLUSS-SITZUNG-04.md),
[Forschung 1–4](docs/design/aenderungen-2026-10-26/FORSCHUNG-SITZUNG-04.md).

## Zuerst lesen

1. Sammlung, Punkte **5** und **6a** (und 6b, der in Sitzung 6 folgt – nichts davon vorziehen).
2. Abschluss Sitzung 3 (ⓘ-Mechanik `PBHelp`, keine Emojis) und Forschung 3/4 (gemeinsame Dateien, Wächter gegen Emojis,
   Suchkasten nicht anfassen).
3. Das Vorbild: die großen Knöpfe auf **Family-Projekt** (Farbverlauf zum Thema, leichter Glanz, kleine Bewegung beim
   Zeigen). Vor dem Bau ansehen; „weniger Bewegung“ des Systems beachten.

## Aufgabe

1. **Punkt 5 – Übersicht, Katalog-Kacheln oben.** Den farbigen Streifen links entfernen. Stattdessen echte 3D-Knöpfe:
   Farbverlauf passend zum gewählten Thema (alle vier Themen prüfen), leichter Glanz, dezentes Wackeln bzw. kleine
   Bewegung beim Zeigen/Antippen, bei `prefers-reduced-motion` keine. Etwas kleiner als heute (am Handy sind sonst nur
   ~4 Kacheln sichtbar). Text deutlich lesbar – Arbeits-App. Betrifft die vier Kacheln Einträge im Katalog · Kategorien ·
   Katalog-Größe · Doppelte Inhalte; beide Apps haben heute den Streifen. Bild: `punkt-05-uebersicht-kacheln.jpg`.
2. **Punkt 6a – Kategorien (V3: Katalog).** Die Kategorie-Kacheln oben (Dokument · E-Mail · Foto/Bild · Text/Notiz) als
   dieselben 3D-Knöpfe. „Vorschau ansehen“ zeigt die künftige Ordnerstruktur **direkt darunter** als Ordnerbaum (kein
   eigenes Fenster). Nach „In neuen Ordner kopieren“ zeigt dieselbe Stelle den echten Zielordner als Baum (was wirklich
   kopiert wurde). Klaus' Frage beantworten: Unterschied Kategorien ↔ Übersicht ↔ Explorer auf der Seite klar machen
   (ein Satz hinter ⓘ, kein Kasten). Bild: `punkt-06-kategorien.jpg`.
3. Feste Regeln wie bisher: gemeinsamer Webteil (eine Datei byte-gleich in beiden Repos, `cmp` nach jeder Änderung),
   keine Emojis, flach außer den 3D-Knöpfen selbst, Hinweise ohne Kasten, ⓘ anfangs offen und gemerkt,
   Vorher-nachher-Bilder, nichts veröffentlichen ohne Klaus' Wort.

## Prüfen

- `test-design-26` (Pro, V3) um Punkt 5/6a erweitern (Streifen weg, Verlauf aus dem Thema, Bewegung aus bei „weniger
  Bewegung“, Kontrast des Textes, Vorschau als Baum unter den Kacheln), mit Gegenprobe (Sabotage → benannte rote Zeile).
- `test-overview`, `test-categories`, `test-themes` (V3) bleiben grün; beide `test:native-web` vollständig (`test-filme`
  ist lokal ohne Video rot, bekannt).

## Am Ende

`ABSCHLUSS-SITZUNG-05.md`, `FORSCHUNG-SITZUNG-05.md`, Sammlung nachtragen (5, 6a → erledigt; Sitzungsplan),
`BRIEF_SITZUNG-06_…md` (Punkt 6b: Zielordner echt bearbeiten), CLAUDE.md-Anker in Pro und V3.
