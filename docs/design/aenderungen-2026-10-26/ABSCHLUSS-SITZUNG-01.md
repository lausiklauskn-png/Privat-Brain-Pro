# Abschluss Sitzung 1 (2026-10-26) – Designumbau, einfache Punkte

Klaus hat zehn Design- und Funktionspunkte gesammelt ([Sammlung](SAMMLUNG.md)). Sie gelten für alle sechs
Varianten: Private Brain Pro und Private Brain V3 Pro, jeweils Android, Windows und PWA. Android, Windows und die PWA
einer App werden aus **demselben gebauten Webteil** (`www/`) erzeugt. Pro baut ihn mit `tools/native/prepare-web.mjs`,
Windows mit `windows/tools/build-web.mjs`, die PWA mit `prepare-pages.mjs`. Eine Änderung im Webteil kommt also in
alle drei Fassungen, Nachträge sind nicht nötig.

## Umgesetzt

| Punkt | Pro | V3 | Wo |
|---|---|---|---|
| 1 Zählerzeile: E-Mails · Dateien · lokal verknüpft · Katalog · Prüfstand in einer Zeile, schlichte Schrift | ✔ | ✔ | Pro `tools/native/adapt-search.mjs` + `native/design-layout.css`; V3 `tools/native/v3-prerender.mjs` + `assets/v3-ui.css` |
| 4 Mail-Ordnerleiste im hohen/schmalen Fenster: nichts überlappt, ab 600 px zweite Zeile statt Abschneiden | ✔ | hatte den Fehler nicht (Ordner als Spalte) | Pro `native/design-layout.css` |
| 8 Doppelte: ☐ Alle (zweiter Tipp = alle ab) · Auswahl · Entfernen (Papierkorb, kräftig); „Auswahl leeren“ entfällt; Rückfrage nur, wenn von einer Datei kein Verweis bliebe | ✔ (auch Ordnerbereinigung: ☐ Alle statt „Auswahl leeren“, Löschen) | ✔ | Pro `native/native-dupes.js` + `dupes-layout.css`; V3 neu `assets/v3-dupes.js` |
| 9c „Zustand — ehrlich“ → „Zustand“ mit Satz; „Katalog-Größe“ → „Speicher“ mit Füllbalken | ✔ | ✔ | gleiche Datei: Pro `native/native-state.js`, V3 `assets/v3-state.js` |
| 10c Workflow PDF: Browserfassung frei („Workflow PDF ↗“ unten im ☰), Pro-App bleibt gesperrt, Pro-App mit rotem Pro-Symbol | ✔ | freier Eintrag war schon da | Pro `native/native-tools.js`, `native-license.js`, `native/tool-icons/workflowpdfpro.png` (aus Workflow-PDF-Pro `windows/src-tauri/icons/128x128.png`) |

Bilder vorher/nachher: [bilder-sitzung-1/](bilder-sitzung-1/).

## Geprüft (lokal, 2026-10-26)

- Neue Probe `tools/native/test-design-26.mjs` in beiden Repos und in `test:native-web` eingetragen. Pro hat
  **13 Prüfungen grün**, V3 **12 grün** (in V3 darf „Weitere Ordner“ in der Ordnerspalte umbrechen).
- Gegenprobe von Hand im gebauten `www/`: Wird die Regel für Punkt 4 entfernt, wird „every folder is fully visible“
  rot. Wird die Rückfrage aus Punkt 8 entfernt, wird „removing every reference … asks first“ rot.
- Pro, unverändert grün: test-dupes-cleanup 25, test-overview 27, test-first-paint 38, test-check 29,
  test-folders-layout 71, test-panes 55, test-web 126, test-compact-controls 60, test-help 116. Dazu test-pages
  24 nach einem frischen `prepare-pages`.
- Pro test-tools: zwei Zeilen an Klaus' neue Entscheidung angepasst (freier Workflow-PDF-Eintrag statt „keiner“, 11
  statt 10 Einträge, Pro-Symbol). Danach **75 grün**.
- V3, unverändert grün: test-v3-ui 43, test-web 105, test-tools 62, test-themes 41, test-check 27,
  test-folders-layout 37, test-v3-identity 21, test-mail-device 79, test-navigation 22, test-pages 12, drift-guard 22,
  e2e-features 10, e2e-test 8.
- ⚠ V3 `tools/e2e-workspace.mjs` bricht hier ab („Target page … has been closed“). Das passiert genauso **ohne** die
  Änderungen dieser Sitzung (mit `git stash` gegengeprüft). Die Ursache ist nicht gefunden.
- ⚠ test-themes in V3 schreibt Bilder nach `docs/design/themen-2026-10-24/`. Die Dateien wurden zurückgesetzt, nicht
  mit abgegeben.
- V3-Vorrat `sw.js`: `private-brain-v93` → **v94**, gegen `origin/main` geprüft. `v3-dupes.js` und `v3-state.js`
  stehen im Vorrat.

## Grenzen, ehrlich

- Lokal ohne das Anleitungsvideo gebaut: Der Pages-Host ist hier gesperrt, darum ersetzte ein Platzhalter beim
  lokalen Bauen `bundleFilms`. Die CI baut mit Video.
- Der Pro-Bau braucht Node ≥ 24.5 für die OCR-Dateien hinter dem Proxy. Lokal lief er mit Node 24.22.
- Punkt 4 ist nachgestellt (Leiste mit „Weitere Ordner“ von Hand eingefügt), nicht mit einem echten Mailkonto.
- Der Speicher-Balken zeigt den Anteil am Platz, den das System der App zugesteht (`navigator.storage.estimate`),
  **nicht** den freien Platz des Geräts. So steht es auch im Tooltip.
- Nicht gemessen: Tablet S6/DeX, Windows-Gerät, echte Android-App. Nichts veröffentlicht.
