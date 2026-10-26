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
| 2 | Explorer und weitere Ansichten | Anordnung wählbar machen. V3 hat im Explorer ↑ (nach oben), ⌂ (Gesamtansicht) und die Spaltenaufteilung mit ziehbarer Trennlinie (`assets/v3-ui.js`, SPLITS); Pro 1.0.38 hat neben dem Haus keine Spaltenführung. Ziel: in jeder Ansicht eine Wahl der Anordnung: Gesamtansicht (⌂), nebeneinander geteilt (Querformat), übereinander geteilt (Hochformat), drei Spalten. Pro bekommt die Spaltenführung wie V3, beide bekommen die Wahl. Offen: welche Ansichten genau (Explorer, Dateien, Mail, Kategorien …) | alle 6 | gesammelt |
