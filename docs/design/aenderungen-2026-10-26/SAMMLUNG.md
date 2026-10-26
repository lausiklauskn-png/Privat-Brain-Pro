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
| 2 | Explorer und weitere Ansichten | Anordnung wählbar machen. V3 hat im Explorer ↑ (nach oben), ⌂ (Gesamtansicht) und die Spaltenaufteilung mit ziehbarer Trennlinie (`assets/v3-ui.js`, SPLITS); Pro 1.0.38 hat neben dem Haus keine Spaltenführung. Ziel: in jeder Ansicht eine Wahl der Anordnung: Gesamtansicht (⌂), nebeneinander geteilt (Querformat), übereinander geteilt (Hochformat), drei Spalten. Pro bekommt die Spaltenführung wie V3, beide bekommen die Wahl. Im Bild: V3 zeigt ↑ ⌂ ◨ (Spaltenknopf) und links den Ordnerbaum mit ⊟; Pro zeigt nur ↑ ⌂, die Liste läuft über die ganze Breite. Bild: `punkt-02-explorer-anordnung.jpg` (links V3, rechts Pro). Präzisiert (Klaus): In Pro erscheint Ordnerbaum ein-/ausblenden nur im Vollbild, nicht im geteilten Bildschirm und vermutlich nicht am Handy. Soll wie in V3 in jeder Fenstergröße sichtbar sein und umfassen: Ansicht nebeneinander, Ansicht übereinander, Ordnerbaum ein-/ausblenden, alle Ordner auf einmal einklappen (⊟). Gilt für alle Ansichten mit Ordnern (Explorer, Postfach/Mailordner, Kategorien u. a.), in allen 6 Varianten (Klaus bestätigt). Form: ein einziger kleiner Knopf (wie ◨ in V3), der die vier Wahlmöglichkeiten anbietet – passt auch in schmale Fenster | alle 6 | gesammelt |
| 3 | Explorer, Werkzeugzeile | (a) ⌂ „Alle Dateien“ wird eine Auswahl, die zeigt, was gerade gezeigt wird: Alle Dateien · E-Mails · PDF · Dokumente · Bilder … (b) „Dateiliste filtern“ → nur Lupe + Eingabefeld, kein Text (höchstens blass „Suche“). (c) Sortieren zeigt sichtbar, wonach sortiert ist: Kürzel D (Datum) · N (Name) · G (Größe) · T (Typ) plus Pfeil ↑/↓ (z. B. „D ↓“ = neueste oben); die Bedeutung steht in der Erklärung (i/Tooltip) beim Sortieren. (d) Reihenfolge: Auswahl (⌂ ▾) · Lupe/Feld · Sortieren · auch im Inhalt · Prüfstand. (e) Den kleinen ↑ vorne weglassen. Hinweis: ↑ ist heute „eine Ordnerebene höher“ (auf oberster Ebene gesperrt, daher das Verbotsschild am Zeiger) – der Rückweg muss dann über den anklickbaren Pfad („Alle Dateien › E-Mails › …“) gehen. Bild `punkt-03-sortieren.jpg`: Pro-Knopf heißt nur „Sortieren“, die Wahl (Datum · Neueste oben) sieht man erst im geöffneten Menü; V3 zeigt „Datum: neueste zuerst“ als Auswahl, aber lang. Ziel: kurz und sichtbar, z. B. „⇅ D ↓“ | alle 6 (zu bestätigen) | gesammelt |
| 4 | Mail, Ordnerleiste im schmalen Format (Handy/geteilter Bildschirm) | Anzeigefehler in Pro 1.0.38: Die Mailordner springen in eine waagerechte Leiste oben (…sgang · Gesendet · Archiv · Spam · Papierkorb · Exportiert). Am rechten Ende liegen „Weitere Ordner“ und „Neuer Ordner“ übereinander, die Schrift überdeckt sich (Bild: „W Neuer / C Ordner“); links ist „Posteingang“ abgeschnitten. Ziel: nichts überlappt, nichts abgeschnitten; Knöpfe sauber am Ende oder im ⋯-Menü. Bild: `punkt-04-mail-ordnerleiste.jpg` (links V3, rechts Pro). V3 im Handyformat mitprüfen | Pro-A · Pro-W · Pro-P (V3 prüfen) | gesammelt |
| 5 | Übersicht, Katalog-Kacheln oben (anklickbar) | Den farbigen Streifen links an den Kacheln entfernen. Stattdessen echte 3D-Knöpfe wie die großen Knöpfe auf Family-Projekt: Farbverlauf passend zum gewählten Thema, leichter Glanz/Schimmer, dezentes Wackeln bzw. kleine Bewegung beim Zeigen/Antippen. Etwas kleiner als heute (am Handy sonst nur ~4 große Kacheln sichtbar). Alles dezent: Text muss deutlich lesbar bleiben, es ist eine Arbeits-App. „Weniger Bewegung“ des Systems beachten. Vorbild Family-Projekt vor dem Bau ansehen | zu klären | gesammelt |
