# Sitzung 2 – Explorer-Werkzeugzeile und Anordnungs-Knopf

**Diese Sitzung ist Sitzung 2.** Klaus zählt die Sitzungen fortlaufend. Sag ihm zu Beginn: „Wir sind in Sitzung 2.“
Jede Sitzung bearbeitet ein bis zwei Punkte aus der
[Sammlung](docs/design/aenderungen-2026-10-26/SAMMLUNG.md). Am Ende stehen ein Abschluss, Forschungseinträge und
der Brief für Sitzung 3.

## Zuerst lesen

1. [Sammlung mit Sitzungsplan](docs/design/aenderungen-2026-10-26/SAMMLUNG.md), Punkte **2** und **3**, mit Bildern.
2. [Abschluss Sitzung 1](docs/design/aenderungen-2026-10-26/ABSCHLUSS-SITZUNG-01.md) und
   [Forschung Sitzung 1](https://github.com/lausiklauskn-png/Kimhub/blob/main/forschung/messungen/privat-brain-pro-designumbau-sitzung-01-2026-10-26.md). Dort steht, wie man hier lokal
   baut: Node 24, Video-Platzhalter, Chromium-Pfad, `git add` vor dem Bauen.

## Feste Regeln (Klaus 2026-10-26)

- **Jeder Punkt gilt für alle sechs Varianten:** Pro und V3, jeweils Android, Windows und PWA. Pro und V3 haben je
  ein Repo (`Privat-Brain-Pro`, `Privat-Brain-Pro-V3`). Beide werden geändert, keine Nachträge für später.
- Android, Windows und PWA einer App kommen aus demselben `www/`. Also immer im gemeinsamen Webteil ändern.
- Kein Code an `index.html` von Pro. Anpassen über die Bauschritte (`tools/native/adapt-search.mjs`) oder eigene
  Skripte unter `native/`. In V3 über `tools/native/v3-prerender.mjs` oder `assets/v3-*.js`.
- Keine Emojis in Knöpfen, sondern Liniensymbole und kurze Wörter. Flache Knöpfe (~28–32 px), dezent, gut lesbar.
- **Nicht veröffentlichen** ohne Klaus' ausdrückliches Wort. Vorher-nachher-Bilder zeigen.
- Branch in beiden Repos: der für die Sitzung vorgegebene. In Sitzung 1 war das
  `claude/private-brain-pro-design-tjlzap`, PR #87 in Pro. Ist dieser PR schon übernommen, frisch von `origin/main`
  neu abzweigen.

## Punkt 3 – Explorer-Werkzeugzeile

- ⌂ „Alle Dateien“ wird eine **Auswahl**: Alle Dateien · E-Mails · PDF · Dokumente · Bilder … Sie zeigt immer an,
  was gerade gezeigt wird.
- „Dateiliste filtern“ wird **nur 🔍 und ein Eingabefeld**, ohne Text, höchstens blass „Suche“.
- **Sortieren zeigt die Wahl auf dem Knopf:** Kürzel D (Datum), N (Name), G (Größe), T (Typ) plus ↑/↓, z. B. „D ↓“
  für neueste oben. Was die Kürzel bedeuten, steht im Tooltip bzw. in der Erklärung. Pro: Menü `native/native-sort.js`.
  V3: Auswahlfeld „Datum: neueste zuerst“.
- **Reihenfolge:** Auswahl (⌂ ▾) · Suche · Sortieren · auch im Inhalt · Prüfstand.
- **Kleinen ↑ vorne weglassen.** Er bedeutet heute „Ordnerebene höher“. Der Rückweg geht dann über den anklickbaren
  Pfad („Alle Dateien › E-Mails › …“).
- Code: `assets/workspace.js` (Explorer, `explorerFilter`, `explorerMatch`, `TREE_HIDDEN`, Zeile ~460 ff.), Pro
  `native/native-sort.js` und `native/native-toolbar.js` (Symbole), V3 `assets/v3-ui.js`.

## Punkt 2 – Anordnungs-Knopf in allen Ordneransichten

- **Ein kleiner Knopf** wie ◨ in V3, in **jeder Fenstergröße** sichtbar, auch im geteilten Bildschirm und am Handy.
- Er öffnet vier Wahlmöglichkeiten: **nebeneinander** · **übereinander** · **Ordnerbaum ein/aus** · **alle Ordner
  einklappen** (⊟).
- Gilt für alle Ansichten mit Ordnern: Explorer, Postfach (Mailordner), Kategorien.
- Die App merkt sich die Wahl, für jede Ansicht einzeln.
- Pro bekommt dazu die ziehbare Spaltenaufteilung von V3: Pro `native/native-panes.js` + `panes-layout.css`, V3
  `assets/v3-ui.js` (`SPLITS`, `columnSplitters`).
- Heute blendet Pro den Ordnerbaum im Hochformat ganz aus (`design-layout.css`, `@media(orientation:portrait)`:
  `#explorerTree, #explorerTreeToggle { display:none }`). Genau deshalb fehlt der Knopf im geteilten Bildschirm.

## Prüfen

- Die Probe `tools/native/test-design-26.mjs` (beide Repos) um Punkt 2 und 3 erweitern, mit Gegenprobe.
- Vorhandene Proben: test-panes, test-explorer-order, test-explorer-kinds, test-folders-layout, test-compact-controls,
  test-first-paint, test-web (Pro); test-v3-ui, test-web, test-folders-layout (V3).
- Bilder bei 1000×800, 1000×1300 (geteilter Bildschirm hoch) und 412×900.

## Am Ende

`ABSCHLUSS-SITZUNG-02.md` und Kimhub forschung/messungen/privat-brain-pro-designumbau-sitzung-02-2026-10-26.md neben die Sammlung legen, den Stand in der Sammlung
eintragen, `BRIEF_SITZUNG-03_…md` schreiben (Punkte 7, 9a, 9b, 9d) und beide CLAUDE.md-Anker oben nachziehen.
