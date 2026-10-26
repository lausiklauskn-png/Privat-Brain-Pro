# Sitzung 6 – Zielordner echt bearbeiten (Punkt 6b)

**Diese Sitzung ist Sitzung 6.** Sag Klaus zu Beginn: „Wir sind in Sitzung 6.“ Punkt **6b** der
[Sammlung](docs/design/aenderungen-2026-10-26/SAMMLUNG.md), für alle sechs Varianten (Pro + V3, je Android/Windows/PWA).

## Ausgangsstand

Sitzung 5 (3D-Knöpfe, Kategorien mit Ordnerbaum) liegt als Entwurfs-PRs vor (Pro #PR-PRO, V3 #PR-V3) und wartet auf Klaus' Wort;
prüfen, ob sie inzwischen auf main sind. Frisch von `origin/main` abzweigen. Android/Windows/PWA bleiben auf den veröffentlichten
Ständen (Pro 1.0.38, V3 3.0.0-preview.7), **nichts veröffentlichen ohne Klaus' Wort.**
Rückblick: [Abschluss Sitzung 5](docs/design/aenderungen-2026-10-26/ABSCHLUSS-SITZUNG-05.md),
[Forschung 1–5](docs/design/aenderungen-2026-10-26/FORSCHUNG-SITZUNG-05.md).

Was es schon gibt: `native/pb-zielordner.js` (= V3 `assets/pb-zielordner.js`) zeigt nach „In neuen Ordner kopieren…“ den echten
Zielordner als Baum. Es liest den `FileSystemDirectoryHandle`, den `startReorg` (in `index.html`) über `showDirectoryPicker`
bekommen hat, und merkt ihn sich **nicht** über das Schließen hinaus. In der Android-WebView gibt es `showDirectoryPicker`
nicht; dort steht heute ein Hinweis auf diese Sitzung.

## Zuerst lesen

1. Sammlung, Punkt **6b** (Klaus 2026-10-26: „mit hinein, richtiger Bau“), und die Grenzen dort.
2. Abschluss und Forschung Sitzung 5 (Fangphase, umwickelter Picker, gestellter Ordnerzugriff in Probe und Bilder-Skript).
3. `docs/SPEICHERORT-UND-TRESOR.md` und `native/native-vault.js` (Pro): wie die Android-App heute über die Ordnerauswahl
   (`ProVaultPlugin`, SAF/`DocumentFile`) in einen Ordner schreibt – der Zielordner soll denselben Weg nehmen, nicht einen zweiten.
4. `docs/ORDNERBAUM-PRUEFSTAND-PAPIERKORB.md` (Explorer-Baum, Bedienung am Handy und breit).

## Aufgabe

1. **Zielordner merken.** Der zuletzt gewählte Zielordner bleibt bekannt (PWA: Handle in IndexedDB, beim nächsten Öffnen
   `queryPermission`/`requestPermission`; Android: SAF-Baum-URI mit dauerhafter Freigabe über den vorhandenen Plugin-Weg; Windows:
   messen, ob WebView2 `showDirectoryPicker` hat, sonst Tauri-Dateizugriff). Auf der Kategorien-Seite steht er als Baum,
   auch ohne neues Kopieren („Zielordner öffnen“).
2. **Im Baum arbeiten wie im Explorer:** auswählen (Kästchen, Mehrfachauswahl), löschen (**nur nach Bestätigung**, Zahl und
   Namen in der Frage), verschieben und kopieren/einfügen zwischen Ordnern des Zielordners, neue Ordner anlegen, umbenennen.
   **Jede Änderung geschieht echt im Ordner auf dem Gerät**, und der Baum zeigt danach den gelesenen Stand, nicht den erhofften.
3. **Grenzen fest:** nur innerhalb des zugeordneten Zielordners (kein Weg nach oben, keine fremden Pfade); Originale und Katalog
   bleiben unberührt (Katalog-Einträge zeigen weiter auf die Originale, nie auf die Kopien); keine stillen Wiederholungen bei
   Fehlern, Fehler stehen im Baum beim Eintrag.
4. **PWA ohne Ordnerzugriff** (Firefox, Safari): ehrlich „nicht möglich“ mit dem Satz „Diese Funktion gibt es in der App für
   Android und Windows“ und den Download-Links der eigenen App (Pro → Pro-Releases, V3 → V3-Releases).
5. Feste Regeln: gemeinsamer Webteil byte-gleich (`pb-zielordner.js` erweitern, `cmp` nach jeder Änderung), native Brücken eng und
   nur für den Zielordner, keine Emojis, flache Knöpfe, Hinweise ohne Kasten, ⓘ anfangs offen und gemerkt, Vorher-nachher-Bilder.

## Prüfen

- Neue Probe `test-zielordner` (Pro, V3) mit gestelltem Ordnerzugriff (Muster aus `test-design-26`, Sitzung 5): anlegen,
  umbenennen, verschieben, kopieren, löschen mit Bestätigung, Abbruch ändert nichts, Fehler sichtbar, nichts außerhalb des
  Zielordners, Katalog unverändert; Gegenprobe (Sabotage → benannte rote Zeile). Android: ein nativer Fall im Prüfstand
  (`tools/native/`-Androidprobe) für den SAF-Weg.
- `test-design-26`, `test-categories`, `test-overview`, `test-themes` (V3) bleiben grün; beide `test:native-web` vollständig
  (mit `PB_FILM_SOURCE` auf dem lokalen Filmklon ist auch `test-filme` grün).

## Am Ende

`ABSCHLUSS-SITZUNG-06.md`, `FORSCHUNG-SITZUNG-06.md`, Sammlung nachtragen (6b → erledigt; Sitzungsplan),
`BRIEF_SITZUNG-07_….md` (10a Video in V3 · 10b Mycel-Netz in V3 · 10d Siegel schweben/heften/ausblenden · 9e Freigaben prüfen ·
Workflow PDF Pro in V3), CLAUDE.md-Anker in Pro und V3.
