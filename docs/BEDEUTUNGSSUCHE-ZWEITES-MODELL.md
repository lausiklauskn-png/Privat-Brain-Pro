# Zweites Bedeutungs-Modell für die Suche in der App (Pro-Umbau 5, Schritt 2)

Klaus 2026-10-28: „unabhängig vom Mycel ein zweites Embedding-Modell … ein größeres Modell für die Bedeutungssuche
innerhalb der App“. Grundlage ist der Lernlauf aus PR #111 (Fingerabdrücke und Messung in
`tools/native/meaning-models.json`, Lauf 40758382311) und der Gerätecheck `native/pro-geraet.js`.

## Bedienung

Einstellungen → direkt unter „Modell für die Bedeutungssuche“ steht der Kasten **„Größeres Modell für die Suche in der
App“** (Erklärung hinter ⓘ, zu Beginn zu).

1. **Stufe wählen:** „Aus“ (Vorgabe), „Mittel“ (multilingual-e5-base, 768 Werte, etwa 301 MB mit Bibliothek) oder „Groß“
   (multilingual-e5-large, 1024 Werte, etwa 571 MB). Neben jeder Stufe steht das Urteil des Gerätechecks
   (passt / knapp / nicht empfohlen) und bei der größten passenden „empfohlen“, darunter die gemessenen Werte des Geräts.
   Wählen lädt nichts.
2. **„Modell laden“** (der eine farbige Knopf): erst der Gerätecheck (bei „nicht empfohlen“ fragt die App ausdrücklich
   nach), dann lädt Android bzw. Windows die Dateien selbst in den App-Speicher (`meaning-mittel/`, `meaning-gross/`):
   zuerst von family-projekt.de, sonst Hugging Face (Bibliothek jsDelivr, sonst unpkg), jede Datei mit festem SHA-256 und
   fester Größe. Balken mit MB, Prozent und Quelle; „Abbrechen“; nach einer Unterbrechung geht es dort weiter.
3. **„Einordnen (N)“**: erst auf diesen Tipp rechnet die App jede Datei des Katalogs einmal mit dem größeren Modell neu,
   immer vier Texte auf einmal, als Hintergrundaufgabe (Android: Mitteilung mit Stand und „Abbrechen“). Abbrechen hält
   nach dem laufenden Schritt an; „Einordnen“ macht später nur mit dem Rest weiter.
4. Sind **alle** Dateien eingeordnet, nutzt die Suche das größere Modell („Aktiv: …“). Kommen Dateien dazu oder ändert sich
   ein Text (z. B. eigene Worte zu einem Bild), zählt der Kasten sie und bietet wieder „Einordnen (N)“ an; bis dahin sucht
   die App wie bisher mit dem kleinen Modell.
5. „Modell entfernen“ (nach Rückfrage) löscht die Dateien der Stufe und ihre eingeordneten Werte.

Nichts startet von selbst: weder Laden noch Einordnen. Das Modell selbst startet erst bei der ersten Bedeutungssuche
nach einem App-Start (nicht beim Öffnen der App), mit demselben Absturzschutz wie die anderen Modelle (endet die Ansicht
beim Start, startet es nicht wieder von selbst; „Erneut starten“).

## Was getrennt bleibt

- **Mycel, Siegel und Modul 03** bleiben unverändert beim kleinen Modell (e5-small, 384 Werte). Modul 03 ist nicht
  angefasst (Drift-Guard).
- Die Werte des größeren Modells liegen in einer **eigenen Ablage** (IndexedDB `pb_meaning_v1`, eine Tabelle je Stufe,
  mit Modell-Revision und Textschlüssel), nie am Katalog-Eintrag und nie neben den 384er-Werten `evec`. Die Suche
  vergleicht eine Frage des größeren Modells nur mit Werten desselben Modells (`ecoOf`/`ecoVec`, im Bau in die
  `index.html` gesetzt: `tools/native/adapt-meaning.mjs`); fehlt auch nur ein Eintrag, gilt wieder Modul 03.
- e5-Rollen: Texte als „passage: …“, Fragen als „query: …“.
- Die Werte sind nicht in der Katalog-Sicherung (wie `evec`); nach einer Wiederherstellung einmal „Einordnen“.

## Technik

| Teil | Datei |
|---|---|
| Fingerabdrücke, Größen, Quellen | `tools/native/meaning-models.json` (im Bau als `meaning-models.json`) |
| Android-Schalter | `ProMeaningPlugin.java` (Stufen `mittel`/`gross`, ein Laden zur Zeit), Leser `ProSemanticPlugin.meaningEntries` |
| Android-Adressen | `BundledLibrary` (`/models/Xenova/multilingual-e5-base/`, `-large/`; Hugging-Face-Adressen nie aus der Ansicht), `MainActivity` |
| Windows | `DesktopModel.meaning`, `DesktopService` (`ProMeaning`, `modelAsset`), `resources.rs` (Ordner `meaning-*`), `contracts.json`, `capacitor-tauri.js`, `prepare-runtime.mjs` |
| Seite | `native/native-meaning.js` (Kasten, eigener Worker, Ablage, Einordnen, `PBMeaning.frage/bereit`) |

## Proben

- `node tools/native/test-meaning.mjs` (in `npm run test:native-web`): 34 Proben gegen den gebauten Webteil; gestellt sind
  nur die Brücken und die Rechnung beider Modelle (Modul 03 ordnet die Probefrage absichtlich dem falschen Text zu, das
  größere Modell dem richtigen, mit verschiedener Lage der Werte – so zeigt die Trefferreihenfolge, welches Modell gilt).
- `node tools/native/gegenprobe-meaning.mjs`: 12 Fehler je in einer Wegwerf-Kopie (Haken fehlt, halb eingeordnet genutzt,
  ohne „passage: “/„query: “, Einordnen von selbst, Werte am Eintrag, ohne Hintergrundaufgabe, Abbrechen überhört, Start
  beim App-Start, ohne Absturzschutz, Entfernen lässt Werte liegen, ohne Gerätecheck) plus Kontrolle.
- Windows-Engine (`windows/engine/test.mjs`): Stufen, Größen, ungültige Stufe, Absturzschutz je Stufe, keine Datei vor dem
  Laden, ohne Pin-Datei `NO_PINS`. Android: `BundledLibraryTest.meaningModelStagesHaveTheirOwnFolders`.

## Grenzen (ehrlich)

- **Nicht gemessen:** das echte e5-base/e5-large in der App (im Behälter kein Netz; gemessen nur im Lernlauf im Chromium
  des GitHub-Runners), nicht am Tablet, nicht unter Windows auf Klaus' Rechner. Ob Android eine 2,3-GB-Spitze (Groß) in der
  WebView durchhält, ist offen – dafür der Gerätecheck und der Absturzschutz.
- **Ob das größere Modell besser findet, ist nicht gezeigt:** die kleine Trefferprobe des Lernlaufs fand in allen Stufen
  10/10. Die Gewichte der Suche (`eco*7`, Schwelle 0,72) sind die für e5-small; für e5-base/-large übernommen, nicht neu
  abgestimmt.
- Einordnen braucht Zeit: gemessen 144 ms (Mittel) bzw. 470 ms (Groß) je Abschnitt im Runner; auf dem Tablet langsamer.
- Die Bibliothek (≈ 19 MB) wird je Stufe in deren Ordner geladen, auch wenn ein anderes Modell sie schon hat.
- Die Größen im Gerätecheck (`pro-geraet.js`: 282/552 MB) sind die reinen Modelldateien ohne Bibliothek; `pro-geraet.js`
  ist ein gepinnter gemeinsamer Baustein und bleibt hier unverändert.
- In der PWA gibt es den Kasten nicht (keine `ProMeaning`-Brücke).
