# Designänderungen – Sammlung (2026-10-26)

Klaus: erst sammeln, dann gemeinsam umsetzen. Nur Design, Funktionen bleiben.
Je Punkt nennt Klaus, zu welcher Variante er gehört.

Sechs Varianten:

| Kürzel | Variante | Repo |
|---|---|---|
| Pro-A | Private Brain Pro · Android | Privat-Brain-Pro |
| Pro-W | Private Brain Pro · Windows | Privat-Brain-Pro |
| Pro-P | Private Brain Pro · PWA („Private Brain“) | Privat-Brain-Pro |
| V3-A | Private Brain Pro V3 · Android | Privat-Brain-Pro-V3 |
| V3-W | Private Brain Pro V3 · Windows | Privat-Brain-Pro-V3 |
| V3-P | Private Brain Pro V3 · PWA | Privat-Brain-Pro-V3 |

## Punkte

| Nr. | Wo (Seite) | Was ändern | Varianten | Stand |
|---|---|---|---|---|
| 1 | Suche (Startseite) | Die Kacheln „12 E-Mails · 19 Dateien · 9 lokal verknüpft“ (über dem Suchfeld) ohne Kästen als schlichte Schrift in die Zeile von „Katalog: 31 Dateien · Prüfstand“ legen. Eine einzige Zeile: E-Mails · Dateien · lokal verknüpft · Katalog · Prüfstand. Schrift klein genug, dass alles in eine Reihe passt. Nichts doppelt anzeigen. V3: gleiche Zeile (dort fehlen die Zähler bisher; „Alle geprüft“ steht allein) – sinngemäß anpassen. Bild: `punkt-01-suche-zaehler.jpg` (links V3, rechts Pro) | alle 6 | gesammelt |
| 2 | Explorer und weitere Ansichten | Anordnung wählbar machen. V3 hat im Explorer ↑ (nach oben), ⌂ (Gesamtansicht) und die Spaltenaufteilung mit ziehbarer Trennlinie (`assets/v3-ui.js`, SPLITS); Pro 1.0.38 hat neben dem Haus keine Spaltenführung. Ziel: in jeder Ansicht eine Wahl der Anordnung: Gesamtansicht (⌂), nebeneinander geteilt (Querformat), übereinander geteilt (Hochformat), drei Spalten. Pro bekommt die Spaltenführung wie V3, beide bekommen die Wahl. Im Bild: V3 zeigt ↑ ⌂ ◨ (Spaltenknopf) und links den Ordnerbaum mit ⊟; Pro zeigt nur ↑ ⌂, die Liste läuft über die ganze Breite. Bild: `punkt-02-explorer-anordnung.jpg` (links V3, rechts Pro). Offen: welche Ansichten genau (Explorer, Dateien, Mail, Kategorien …) | alle 6 | gesammelt |
| 3 | Explorer, Werkzeugzeile | (a) ⌂ „Alle Dateien“ wird eine Auswahl, die zeigt, was gerade gezeigt wird: Alle Dateien · E-Mails · PDF · Dokumente · Bilder … (b) „Dateiliste filtern“ → nur Lupe + Eingabefeld, kein Text (höchstens blass „Suche“). (c) Sortieren zeigt sichtbar, wonach sortiert ist: Kürzel D (Datum) · N (Name) · G (Größe) · T (Typ) plus Pfeil ↑/↓ (z. B. „D ↓“ = neueste oben); die Bedeutung steht in der Erklärung (i/Tooltip) beim Sortieren. (d) Reihenfolge: Auswahl (⌂ ▾) · Lupe/Feld · Sortieren · auch im Inhalt · Prüfstand. (e) Den kleinen ↑ vorne weglassen. Hinweis: ↑ ist heute „eine Ordnerebene höher“ (auf oberster Ebene gesperrt, daher das Verbotsschild am Zeiger) – der Rückweg muss dann über den anklickbaren Pfad („Alle Dateien › E-Mails › …“) gehen | alle 6 (zu bestätigen) | gesammelt |
