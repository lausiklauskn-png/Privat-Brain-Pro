# Abschluss Sitzung 5 (2026-10-26) – 3D-Knöpfe in der Übersicht, Kategorien mit Ordnerbaum

Punkte **5** und **6a** der [Sammlung](SAMMLUNG.md). Gilt für alle sechs Varianten (Pro + V3, je Android/Windows/PWA).
Klaus hat den Farbverlauf während des Baus gesehen und gebilligt („Sehr gut mit dem Farbverlauf so.“).

## Umgesetzt

| Punkt | Was | Pro | V3 |
|---|---|---|---|
| 5 | Die vier Katalog-Kacheln der Übersicht (Einträge im Katalog · Kategorien · Katalog-Größe · Doppelte Inhalte) sind **3D-Knöpfe**: der farbige Streifen links ist weg; eine Tönung aus dem gewählten Thema (`var(--acc)` über `var(--card)`, 150°, 16 % Deckung, in dunklen Themen 22 %), innen ein heller Schliff oben und ein dunkler unten, ein weicher Lichtfleck, der dem Zeiger folgt, und eine Neigung zum Zeiger von höchstens 3°. Mit dem Finger wird der Knopf kurz eingedrückt (Skalierung 0,985), nicht geneigt. Bei „weniger Bewegung“ des Systems keine Neigung und kein Eindrücken; Glanz und Rahmen bleiben | ✔ | ✔ |
| 5 | **Kleiner als bisher:** Polster 9/12 px (Handy 8/10 px), Zahl 1,35 rem statt der großen Kennzahl, Abstand 8 px; bei 1280 px höchstens 92 px hoch (gemessen, Probe). Vorher am Handy: vier große Kacheln füllten den Schirm | ✔ | ✔ |
| 5 | **Lesbar auf der Tönung:** Nebentexte und die grüne/rote Zahl liegen per `color-mix()` näher an der Textfarbe. Gemessener Kontrast (WCAG) in jedem Thema: Zahl in Textfarbe ≥ 8,1, grüne Zahl ≥ 4,4, rote Zahl ≥ 4,2 (groß und fett; Schwelle 4), Nebentexte ≥ 4,8. Zahlen je Thema stehen in der Probe-Ausgabe | ✔ (klarblau, graphit, petrol, nachtblau) | ✔ (Erdton, klar, petrol, schiefer, weich, dunkel) |
| 6a | Die Kategorie-Kacheln (Pro „Kategorien“, V3 „Katalog“) sind dieselben 3D-Knöpfe, in ihrem Raster | ✔ | ✔ |
| 6a | **„Vorschau ansehen“** zeigt die künftige Ordnerstruktur **direkt unter den Knöpfen** im Kasten „Neu ordnen“ als Ordnerbaum (Ordner mit Dateizahl, feine Führungslinien, Liniensymbole), **kein Fenster mehr**. Schema-Wechsel zeichnet den Baum neu; „Ausblenden“ nimmt ihn weg | ✔ | ✔ |
| 6a | **Nach „In neuen Ordner kopieren…“** steht an derselben Stelle der **echte Zielordner** als Baum: gelesen aus dem gewählten Ordner (bis 300 Einträge, 6 Ebenen tief; darüber „… und N weitere“), also was wirklich geschrieben wurde, samt `company-brain-neuordnung.json`. Der Kopierweg selbst ist unverändert (`startReorg` in `index.html`); das Skript liest nur mit, welcher Ordner gewählt wurde | ✔ | ✔ |
| 6a | **Klaus' Frage** (Kategorien ↔ Übersicht ↔ Explorer) beantwortet ein Satz hinter ⓘ oben auf der Seite, anfangs offen und gemerkt: „Übersicht zählt deine Dateien und Ordner. Explorer zeigt sie so, wie sie auf dem Gerät liegen. Kategorien ordnet dieselben Dateien nach Bedeutung – nur als Vorschlag, nichts wird verschoben.“ (DE/EN/RU/PL) | ✔ (neue Einleitung, ⓘ „categories-intro“) | ✔ (an die vorhandene Einleitung gehängt) |
| 6a | Ohne Ordnerzugriff des Browsers (kein `showDirectoryPicker`, z. B. Firefox oder die Android-WebView) sagt dieselbe Stelle, was fehlt, statt still zu bleiben: Chrome/Edge, auch als installierte App; in der Android-App kommt es mit dem nächsten Bau „Zielordner bearbeiten“ (Sitzung 6) | ✔ | ✔ |
| Regel | Keine Emojis (Liniensymbole), flach außer den 3D-Knöpfen, Hinweise ohne Kasten, ⓘ anfangs offen und gemerkt | ✔ | ✔ |

**Wo:** Pro `native/pb-3d.js`/`.css` und `native/pb-zielordner.js`/`.css` = V3 `assets/pb-3d.js`/`.css`, `assets/pb-zielordner.js`/`.css`
(**byte-gleich**, `cmp` geprüft). Pro bindet sie in `tools/native/prepare-web.mjs` ein (wie `pb-arrange`, `pb-bildbeschreibung`),
V3 in `index.html` und im Vorrat von `sw.js` (Cache **v97**). `index.html` ist in beiden Repos für Punkt 5/6a **unverändert**:
die Knöpfe bekommen ihre Klasse `pb-3d` vom Skript, die Vorschau-Knöpfe werden in der Fangphase abgefangen.

Bilder vorher/nachher: [bilder-sitzung-5/](bilder-sitzung-5/) – Übersicht (1280 px, Handy 390 px, je Thema: Pro klarblau/petrol/nachtblau,
V3 Erdton/petrol/schiefer), Kategorien mit Vorschau-Baum je Thema, `*-zielordner-nachher.png` mit dem Zielordner nach dem Kopieren
(gestellter Ordnerzugriff). „Vorher“ ist derselbe Bau ohne die vier neuen Dateien.

## Geprüft (lokal, 2026-10-26)

- **Pro:** `test-design-26` **71 grün** (Sitzung 5: vier Knöpfe ohne Streifen, Tönung aus `--acc` und innerer Schliff, ≤ 92 px, kein
  Emoji, Kontrast je Thema, Neigung ≤ 3° und Rücksetzen beim Verlassen, bei „weniger Bewegung“ nichts, Kategorie-Knöpfe, ⓘ-Satz,
  Vorschau als Baum ohne Fenster mit Ordnern und Zahlen, nach dem Kopieren der echte Zielordner (gestellter Ordnerzugriff),
  ohne Ordnerzugriff der Hinweis, keine Laufzeitfehler). `test-overview` 27, `test-categories` 21. **`test:native-web` vollständig:
  2019 grüne Zeilen, Rückgabe 0** – mit `PB_FILM_SOURCE` auf einem lokalen Klon des Film-Repos ist auch `test-filme` (12) grün.
- **V3:** `test-design-26` **70 grün**, `test-themes` 41, `test-categories` 21, `test-v3-ui` 43; **`test:native-web` vollständig:
  1077 grüne Zeilen, Rückgabe 0**.
- **Gegenprobe** (`tools/native/gegenprobe-sitzung-5.sh`, Wegwerf-Kopien von `www`, je Repo 12 Fälle): keine Neigung · Streifen zurück ·
  keine Tönung · Neigung trotz „weniger Bewegung“ · Neigung bleibt nach dem Verlassen · Vorschau wieder im Fenster · Zielordner
  nach dem Kopieren nicht gezeigt · ⓘ-Satz fehlt · Kategorien ohne 3D · ohne Ordnerzugriff still · Nebentext zu blass · Tönung
  nur in einem Thema. **Pro 12 gefangen · 0 durchgerutscht · 0 aus falschem Grund · 0 tote Anker. V3 12 gefangen · 0 · 0 · 0.** Jede rote Zeile trägt den Namen ihrer
  Zusicherung. Zwei Lehren beim Fahren: „keine Tönung“ meldete sich bei Pro zuerst „aus falschem Grund“, weil das Erwartungswort des Skripts
  („tint“) nicht aus dem Namen der Zusicherung („gradient“) stammte; „Tönung nur in einem Thema“ nahm bei V3 zuerst Pros Blau als feste Farbe
  und wurde darum schon von der Einzelthema-Zeile gefangen (richtig, aber nicht die gemeinte) – mit V3s Erdton-Akzent (`#b08d57`) fängt es die
  Themen-Schleife.
- **Eine blinde Messung gefunden und behoben:** die Kontrast-Rechnung der Probe las nur `rgb(…)`. Chromium meldet `color-mix()`
  als `color(srgb …)`; die Probe nahm dafür still Schwarz und maß 16,8 für Nebentexte, die in Wahrheit 5,9 (Pro) bzw. 5,0 (V3)
  haben. Jetzt liest sie beide Schreibweisen, und eine unlesbare Farbe wird NaN, also rot. Die echten Werte liegen über den
  Schwellen; die Tönung ist unverändert (Klaus' Wort).

## Grenzen, ehrlich

- **Nicht am Tablet gemessen:** Neigung und Glanz mit Maus/DeX, das Eindrücken mit dem Finger, die Lesbarkeit auf dem echten Schirm.
- **Kopieren braucht den Ordnerzugriff des Browsers** (File System Access API: Chrome, Edge, auch als installierte PWA). Das war
  schon vorher so (`startReorg` ruft `showDirectoryPicker`); neu ist, dass die Seite es sagt. In der **Android-WebView gibt es
  diese API nicht** – dort kommt der Zielordner mit Sitzung 6 (6b) über den nativen Ordnerzugriff. Ob die **Windows-App**
  (WebView2) `showDirectoryPicker` anbietet, ist nicht gemessen.
- Der Zielordner-Baum liest höchstens 300 Einträge und 6 Ebenen; mehr wird gezählt („… und N weitere“), nicht gezeigt.
- Der Baum nach dem Kopieren ist eine **Ansicht**. Bearbeiten (löschen, verschieben, neue Ordner) ist Punkt 6b, Sitzung 6.
- Die alte Vorschau im Fenster (`previewReorg`) bleibt im Code von `index.html`, wird aber nicht mehr aufgerufen.
- **Übernommen und veröffentlicht (Klaus' Wort, 2026-10-26).** PRs Pro #92 und V3 #26 auf main; Android und Windows beider Apps
  (Pro 1.0.39, V3 3.0.0-preview.8) und das Geschenk für Jens nachgezogen: [Veröffentlichung](VEROEFFENTLICHUNG-SITZUNG-05.md).
  Beim Übernehmen gefunden: V3s Webprobe `tools/e2e-advanced.mjs` erwartete nach „Vorschau ansehen“ noch das Fenster (jetzt
  der Baum); die Android-Updateprobe fiel einmal an einem hängenden Emulator-Launcher („Application Not Responding“) und war
  im Wiederholungslauf grün; Pros WebKit-Oberflächenjobs hingen wie bekannt in „Browser-Engine installieren“ (abgebrochen,
  einmal neu gestartet, grün).
