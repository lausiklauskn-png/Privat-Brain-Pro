# Forschung Sitzung 5 (2026-10-26)

Ergänzt [Forschung Sitzung 1](FORSCHUNG-SITZUNG-01.md), [2](FORSCHUNG-SITZUNG-02.md), [3](FORSCHUNG-SITZUNG-03.md) und
[4](FORSCHUNG-SITZUNG-04.md).

1. **Gegen ältere Regeln ankommen, ohne `index.html` anzufassen.** Pro hält die Kacheln mit `.tile:hover { transform: none
   !important }` still, und `html[data-pb-theme] .tile` setzt Farben mit höherer Spezifität. Die gemeinsame Datei gewinnt mit
   `:is(#panel-dash .tile, #groups > .grp, …).pb-3d` (Id-Spezifität über `:is()`) und für die Neigung mit eigenem `!important`.
   So bleibt `index.html` in beiden Repos für Punkt 5/6a unverändert; nur Pros `prepare-web.mjs` und V3s `index.html`/`sw.js`
   binden die vier Dateien ein.
2. **In Ruhe ist `transform` keine `none`.** `perspective(600px) rotateX(0) rotateY(0)` ergibt eine 3D-Matrix. „Nach dem
   Verlassen zurückgesetzt“ misst die Probe darum als „gleich wie der unberührte Nachbar“, nicht als `none`. Bei „weniger
   Bewegung“ ist es `none`, dort steht die Regel `transform: none !important`.
3. **Chromium meldet `color-mix()` als `color(srgb r g b)`.** Die Kontrast-Rechnung der Probe las nur `rgba?(…)`, nahm sonst
   `0,0,0` und maß für die gemischten Farben den Kontrast von Schwarz: 16,8, mehr als die reine Textfarbe (13,0) – ein Wert,
   der nicht sein kann, und erst beim Lesen der Zahlen aufgefallen ist, nicht beim grünen Haken. Jetzt liest sie beide
   Schreibweisen (Anteile 0–1 mal 255), und eine unlesbare Farbe wird `NaN` statt Schwarz, damit ein Vergleich rot wird. Lehre:
   **eine Probe, die bei Unlesbarem einen „sicheren“ Wert annimmt, ist blind** – sie muss sterben oder rot werden.
4. **Alle Themen ohne Neuladen messen.** `native-theme.js` setzt `data-pb-theme` (und für nachtblau `data-theme="dunkel"`),
   `themes.js` setzt `data-look`. Die Probe setzt die Attribute direkt am `<html>`, misst, und stellt den Stand danach wieder her;
   `--acc` kommt je Thema aus einem Fühler-Element (`span` mit `color: var(--acc)`), nicht aus einer Tabelle.
5. **Fangphase statt Umbau.** `#reorgPreview` und `#reorgStart` haben ihre Zuhörer in `index.html` (`previewReorg`, `startReorg`).
   Ein Zuhörer in der Fangphase mit `stopImmediatePropagation` ersetzt das Fenster durch den Baum, ohne die Funktionen zu
   ändern. Für den Zielordner nach dem Kopieren wird `window.showDirectoryPicker` **vorübergehend umwickelt**: `startReorg`
   wählt den Ordner wie bisher, das Skript merkt sich den gewählten `handle` und liest ihn danach (`handle.values()`), dann
   wird die Original-Funktion zurückgesetzt (auch bei Fehler, `finally`).
6. **Die ⓘ-Mechanik nimmt neue Hinweise von selbst.** In Pro hatte die Kategorien-Seite keine Einleitung mehr (Sitzung 3 nahm
   sie weg). Ein neues `p.hint` vor `#groups` wird von `native-help.js` beim nächsten `refresh` als `categories-intro` mit ⓘ
   versehen, anfangs offen und gemerkt – ohne Änderung an `native-help.js`. V3 hat seine Einleitung behalten; dort hängt der
   Satz als `span.pb-cats-why` daran.
7. **Die letzte rote Zeile war die Probe, nicht das Merkmal.** `':scope>li .pb-zo-name'` (Nachfahre) sammelte auch die Namen der
   Dateien in den Unterlisten, der sortierte Vergleich der Ordnernamen passte nie. Mit `':scope>li>.pb-zo-node>.pb-zo-name'`
   (Kinder) stimmt er. Zuerst die Zusicherung auseinandernehmen (jeden Teil einzeln ausgeben), bevor man das Merkmal verdächtigt.
8. **V3s `prepare-web.mjs` kopiert nur verfolgte Dateien** (`git ls-files`): neue Dateien in `assets/` fehlen im Bau, bis sie
   `git add` sind. Pro kopiert nach Liste in `prepare-web.mjs`.
9. **`test-filme` ist lokal grün, wenn der Film da ist.** Mit `PB_FILM_SOURCE=<lokaler Klon von Family-Projekt.de-Video>` baut
   `bundleFilms` ohne Netz; damit laufen beide `test:native-web`-Ketten vollständig durch (Pro 2019, V3 1077 grüne Zeilen).
   Bisher stand „lokal ohne Video rot, bekannt“ – das gilt nur ohne den Klon.
10. **Finger neigt nicht.** `pointerType === 'touch'` setzt keine Neigung (der Finger verdeckt den Knopf ohnehin), sondern nur
    `pb-3d-press`. „Weniger Bewegung“ wird doppelt beachtet: `matchMedia` im Skript (keine Variablen) und `@media` im CSS
    (`transform: none !important`), damit auch ein später gesetzter Zustand still bleibt.
11. **Gegenprobe-Harnisch:** „aus falschem Grund“ kam einmal nur vom Erwartungswort des Skripts („tint“ statt „gradient“), nicht
    von der Probe. Das Erwartungswort muss aus dem Namen der Zusicherung stammen, nicht aus dem Kopf.
12. **Bilder vom Zielordner ohne echten Ordner:** ein gestellter `FileSystemDirectoryHandle` (`values()`, `keys()`, `getFileHandle`
    mit `createWritable`, `getDirectoryHandle`) reicht für `startReorg` und den Baum. Dasselbe Muster trägt die Probe und das
    Bilder-Skript; in Sitzung 6 wird es die Grundlage für das Bearbeiten.
