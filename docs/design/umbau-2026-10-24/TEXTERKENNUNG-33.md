# Texterkennung für Android .33

Stand 24.10.2026: **in Umsetzung und Prüfung, noch nicht veröffentlicht**.
Klaus meldet in der nativen App, dass Text in Bildern und eingescannten Seiten
nicht gelesen wurde. Sein Auftrag ist die eingebaute Texterkennung; der
bestehende Freibrief umfasst die eigenständige Umsetzung und geprüfte
Veröffentlichung als signiertes Update.

## Ziel und Umsetzung

Text aus neu importierten Bildern und Scan-PDFs wird lokal gelesen und sowohl
für die Suche als auch für die vorhandene Inhaltsprüfung verwendet. Vorhandene
Dateien lassen sich mit **„Erneut prüfen“** ausdrücklich nachbearbeiten, wenn das
Original auf dem Gerät verfügbar ist. Originalbytes und frühere Befunde bleiben
geschützt; fehlgeschlagene oder leere Erkennung löscht keinen vorhandenen
Suchtext. Die geschützten Kanon-Module werden nicht geändert.

Die fehlende Nutzlast wird vollständig eingepackt: Tesseract.js 7.0.0,
Tesseract.js-core 7.0.0 und `tessdata_fast` für DE/EN/RU/PL. LSTM mit OEM 1,
portable-, SIMD- und relaxed-SIMD-Varianten; die passende Variante wählt die
Laufzeit. Worker und Sprachdaten kommen aus `vendor/tesseract/`, ohne
Cloudzugang, KI-Schlüssel, Laufzeit-CDN oder verpflichtenden Browser-TextDetector.
Ein gemeinsam genutzter Worker verarbeitet die Aufträge nacheinander und wird
bei Abbruch, Fristablauf oder nach Leerlauf freigegeben.

`tools/native/ocr-assets.json` beschreibt **39 Dateien mit 26.315.914 Bytes**,
zuzüglich des eingepackten Manifests. Der Build-Downloader
`tools/native/fetch-ocr-assets.mjs` prüft feste Größen und SHA-256, für die
npm-Archive zusätzlich SHA-512-SRI und für die Sprachdaten Git-Blob-Fingerabdrücke.
Die Modelle sind auf Revision `87416418657359cb625c412a48b6e1d6d41c29bd`
festgelegt. Fehlende oder abweichende Pflichtdateien brechen den Build ab.
Original-Lizenzen und Herkunft stehen unter `native/ocr-licenses/`; die App
liefert die nötigen Lizenztexte und `ocr-notices.html` mit.

## Bewusste Grenzen

Höchstens 10 Scan-Seiten je PDF, 64 MiB Dateigröße, 40 Millionen Bildpunkte
beziehungsweise 16.000 Pixel pro Bildkante; OCR-Arbeitskopien höchstens
3.000 Pixel Kante. Die Frist beträgt 90 Sekunden je Lesedurchgang, nicht je
gesamtem mehrseitigem Dokument. Fortschritt und Abbruch bleiben sichtbar.
Unsichere Zeilen unter 60 Prozent, ungelesene Seiten, Ressourcenlimits und
Fehler bleiben als teilweise oder ungeprüft ausgewiesen. Nach einem
unterbrochenen Lauf wird keine automatische Wiederholung gestartet.

## Tatsächlicher Prüfstand

- Asset-Fixture erstellt und alle 39 Ausgabedateien unabhängig auf Größe und
  SHA-256 geprüft; npm-SRI und Modellherkunft ebenfalls geprüft.
- Ein echter Download über den vorgegebenen Umgebungsproxy bestanden;
  Symlink-Ausgaben wurden abgewiesen, ihr externes Ziel blieb unverändert.
- Alle 29 im Quellrepo aufbewahrten Original-Lizenztexte gegen ihre Pins
  geprüft; alle lokalen Links der OCR-Lizenzseite aufgelöst.
- 44 echte OCR-Browserprüfungen bestanden: tatsächliches Tesseract-WASM und
  alle vier Sprachmodelle, Bilder und zweitseitige Scan-PDFs, Import und Suche,
  bestehende Dateien ausdrücklich neu indexieren, Rasteranweisungen auch in
  einem E-Mail-Anhang, unveränderte Originalbytes, Abbruch und erneuter Start.
  Ein gezielt ausgelöster Workerfehler und ein simulierter Prozessabbruch
  löschen keine früheren Befunde; unsichere oder begrenzte Bereiche bleiben offen.
- Vollständige bisherige Websuite und übrige native Browsersuite bestanden.
  Die abschließende Android-/Windows-CI und die signierte Updateprobe sind
  **noch in Prüfung**. Hier wird noch kein veröffentlichter .33-Download behauptet.
  Ergebnisse ergänzt der abschließende Release-Nachweis.

Die Leistung auf Klaus' Samsung Galaxy Tab S6 und physisches Samsung DeX wurden
nicht gemessen. [Bedienung und Grenzen](../../NATIVE-TEXTERKENNUNG.md).
