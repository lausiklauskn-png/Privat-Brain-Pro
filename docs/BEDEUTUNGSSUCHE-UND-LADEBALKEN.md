# Bedeutungssuche mit Modell in der App, Ladebalken beim Einlesen (Klaus 2026-10-21)

## Was Klaus gemeldet hat

- *„Der Ladebalken bei der Bedeutungssuche läuft nur zack mit einmal durch, aber nicht schrittweise während des
  Ladens bei Private Brain Pro.“*
- *„Und beim Laden/Import einer Datei arbeitet der Ladebalken nicht in Schritten, sondern zeigt nur an, wenn er
  fertig ist.“*
- Entscheid auf die Rückfrage: **„Ja, Modell fest einbauen“**.

## Befund

- **Bedeutungssuche:** In der Pro-App lud das Modell nie. Modul 03 (byte-1:1 aus dem Kanon) holt transformers.js von
  `cdn.jsdelivr.net`; die Sicherheitsregel der App (CSP, `script-src 'self'`) sperrt das. `models/` enthielt nur
  `PLATZHALTER.md`. Der Balken zeigte also kein Laden, die Suche lief nur über Stichworte.
- **Einlesen:** Der Balken rückte erst nach jeder **ganzen** Datei vor. Bei einer Datei ging er von 0 auf 100 %.

## Stand für .22: Modell vorbereitet, aber noch aus

Der erste Bau mit Modell (148,3 MB im Paket) lief im Android-Emulator in einen Absturz: `NativeSemanticTest`
endete mit „Instrumentation run failed due to Process crashed“, ohne Fehlermeldung (Lauf 39637009672, API 35,
2560 MB RAM). Vermutlich reicht der Speicher der WebView beim Laden des 118-MB-Modells nicht; belegt ist das nicht.
Damit .22 mit Teilen, Ladebalken und KI-Knopf erscheinen kann, steht `"enabled": false` in
`tools/native/semantic-model.json`: der Bau lädt das Modell nicht, `NativeSemanticTest` ist bis dahin herausgenommen.
Die Bedeutungssuche bleibt in .22 wie bisher bei Stichworten. Alles andere unten ist gebaut und geprüft.

## Stand für .23: Laden per Schalter (Klaus 2026-10-21)

Klaus: *„Kannst du nicht einen Schalter einbauen, der das Laden des Modells direkt aus der App startet? … von meinem
Server … oder von der entsprechenden Seite.“* Das Modell kommt deshalb nicht mehr ins APK (es bleibt etwa 6 MB groß),
sondern wird auf Wunsch geladen.

| | |
|---|---|
| Bedienung | Einstellungen → „🧠 Modell für die Bedeutungssuche“ → **Modell laden** (einmal etwa 155 MB, am besten im WLAN). Balken mit „x von 155 MB“ und Quelle, **Abbrechen**, später **Modell entfernen** (mit Rückfrage). Danach ohne Internet. |
| Quellen | Modell zuerst `https://family-projekt.de/models/Xenova/multilingual-e5-small/…`, sonst Hugging Face (Revision `761b726`). transformers.js 2.17.2 von jsDelivr, sonst unpkg. Jede Datei nur mit dem Fingerabdruck aus `tools/native/semantic-model.json`; passt er nicht, wird die nächste Quelle gefragt. |
| Ablage | Android lädt in den App-Speicher (`files/semantic/`), nicht die WebView. Nach einem Abbruch geht es an derselben Stelle weiter. Der Internetschalter der App stoppt das Laden. |
| Start | Modul 03 bleibt byte-1:1. Die App setzt `SBKIM_MODEL_ROOT` auf `/models/` und beantwortet diese Adresse und die jsDelivr-Adresse aus dem App-Speicher (`BundledLibrary`). Das Modell startet erst, wenn alle Dateien geprüft da sind. |
| Absturzschutz | Endet der WebView-Prozess (`onRenderProcessGone`), öffnet sich die App neu, statt zu schließen. Geschah das während des Modellstarts, startet das Modell nicht mehr von selbst; der Schalter sagt es und bietet **Erneut starten**. |

## Wie es gebaut ist

| | |
|---|---|
| Modell | `Xenova/multilingual-e5-small` (dasselbe wie im Kanon, sonst passen die Vektoren im Mycel nicht) liegt in der App unter `models/`. transformers.js 2.17.2 und seine Rechenbibliothek (WASM) liegen unter `vendor/transformers-2.17.2/`. |
| Wie Modul 03 es findet | Modul 03 bleibt unverändert. Es fragt zuerst `/models/…/config.json` und nimmt dann das Modell aus der App. Seine feste jsDelivr-Adresse beantwortet die App selbst (`BundledLibrary`, vor dem Internetschalter); unter dieser Adresse geht nichts ins Netz, fremde Dateien bekommen 404. |
| Prüfung beim Bau | `tools/native/fetch-semantic-model.mjs` lädt die Dateien einmal (npm, Hugging Face) und prüft jede gegen `tools/native/semantic-model.json` (npm-Integrität und SHA-256). Auf GitHub bricht der Bau ab, wenn eine Datei fehlt oder nicht passt, sobald alle Werte eingetragen sind. |
| Einlesen | Der Balken zeigt jetzt den Stand **innerhalb** der Datei: Kopie ablegen (in Stücken, bis 40 %), Text lesen, signieren; daneben steht der Schritt („Heizung.txt · Text wird gelesen …“). |

## Grenzen

- Die App wird deutlich größer. Gemessen im GitHub-Bau 39635608482 (Dateien, vor dem Packen):
  Modell `onnx/model_quantized.onnx` 118,3 MB · Wörterbuch `tokenizer.json` 17,1 MB · Rechenbibliothek
  `ort-wasm-simd.wasm` 10,0 MB und `ort-wasm.wasm` 9,2 MB · `transformers.min.js` 0,9 MB · zusammen etwa 155 MB.
  Die APK-Größe steht nach dem Bau im Prüfstand.
- Die Modell-Fingerabdrücke stammen aus diesem ersten Download (Revision `761b726…` bei Hugging Face): erstes
  Vertrauen. Seitdem bricht jeder Bau ab, wenn eine Datei davon abweicht. Die Bibliothek ist zusätzlich über die
  npm-Integrität festgelegt.
- Lädt das Modell aus der App, geht das schnell. Der Modell-Balken kann deshalb auch weiterhin rasch durchlaufen;
  das ist dann echtes, schnelles Laden.
- Das Modell rechnet auf dem Gerät; ältere Tablets brauchen für das erste Einordnen vieler Dateien Zeit.
- Am Tablet nicht gemessen.

## Nachweise (.23)

- `SemanticModelTest` (6 JVM-Tests): zweite Quelle bei Serverfehler und falscher Datei, Weitermachen mit `Range` nach
  Abbruch, eine Datei mit fremdem Fingerabdruck wird nie übernommen, geänderte Pins heißen „nicht geladen“, Entfernen,
  Internetschalter, sichere Pfade. `BundledLibraryTest` +1 für die Modell-Adressen.
- `tools/native/test-semantic.mjs` (14 Prüfungen im Browser, Stellvertreter für Android und Modul 03).
- `NativeSemanticTest` (Android-Emulator): echter Download, dann App vom Internet getrennt, Modul 03 lädt aus dem
  App-Speicher (`local`, `/models/`), 384 Dimensionen, Zahnarzt näher als Wetter. Endet die WebView, nennt der Test den
  Grund; der Lauf schreibt dann das Android-Protokoll (Speicher, Absturz) mit.

## Nachweise (.22)

- `tools/native/test-import-progress.mjs` (6 Prüfungen): bei einer Datei mindestens vier Zwischenstände, nur
  vorwärts, Ende 100 %, alle drei Schritte genannt. Gegenprobe mit dem alten Code: die erste Prüfung wird rot.
- `NativeSemanticTest` (Android, echte App, kein Stellvertreter): App vom Internet getrennt, Modul 03 lädt das
  Modell aus der App (`getModelSource() === "local"`), 384 Dimensionen, „Rechnung vom Zahnarzt“ liegt näher an einer
  Zahnarztrechnung als an einem Wetterbericht; danach wird das Internet wieder erlaubt.
- `BundledLibraryTest` (3 JVM-Tests): leere Adresse = Paket-Eintrag, nur die drei mitgelieferten Dateien, andere
  Adressen und andere Versionen werden nicht beantwortet.
