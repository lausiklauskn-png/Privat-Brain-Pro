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

## Wie es jetzt ist

| | |
|---|---|
| Modell | `Xenova/multilingual-e5-small` (dasselbe wie im Kanon, sonst passen die Vektoren im Mycel nicht) liegt in der App unter `models/`. transformers.js 2.17.2 und seine Rechenbibliothek (WASM) liegen unter `vendor/transformers-2.17.2/`. |
| Wie Modul 03 es findet | Modul 03 bleibt unverändert. Es fragt zuerst `/models/…/config.json` und nimmt dann das Modell aus der App. Seine feste jsDelivr-Adresse beantwortet die App selbst (`BundledLibrary`, vor dem Internetschalter); unter dieser Adresse geht nichts ins Netz, fremde Dateien bekommen 404. |
| Prüfung beim Bau | `tools/native/fetch-semantic-model.mjs` lädt die Dateien einmal (npm, Hugging Face) und prüft jede gegen `tools/native/semantic-model.json` (npm-Integrität und SHA-256). Auf GitHub bricht der Bau ab, wenn eine Datei fehlt oder nicht passt, sobald alle Werte eingetragen sind. |
| Einlesen | Der Balken zeigt jetzt den Stand **innerhalb** der Datei: Kopie ablegen (in Stücken, bis 40 %), Text lesen, signieren; daneben steht der Schritt („Heizung.txt · Text wird gelesen …“). |

## Grenzen

- Die App wird deutlich größer (Modell, Wörterbuch und Rechenbibliothek, siehe Prüfstand für die gemessene Größe).
- Lädt das Modell aus der App, geht das schnell. Der Modell-Balken kann deshalb auch weiterhin rasch durchlaufen;
  das ist dann echtes, schnelles Laden.
- Das Modell rechnet auf dem Gerät; ältere Tablets brauchen für das erste Einordnen vieler Dateien Zeit.
- Am Tablet nicht gemessen.

## Nachweise

- `tools/native/test-import-progress.mjs` (6 Prüfungen): bei einer Datei mindestens vier Zwischenstände, nur
  vorwärts, Ende 100 %, alle drei Schritte genannt. Gegenprobe mit dem alten Code: die erste Prüfung wird rot.
- `BundledLibraryTest` (3 JVM-Tests): leere Adresse = Paket-Eintrag, nur die drei mitgelieferten Dateien, andere
  Adressen und andere Versionen werden nicht beantwortet.
