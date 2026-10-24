# Texterkennung für Android .33

Stand 24.10.2026: **als .33 veröffentlicht**. [Signierte Update-APK](https://github.com/lausiklauskn-png/Privat-Brain-Pro/releases/download/v1.0.0-preview.33/Private-Brain-Pro-1.0.0-preview.33.apk).
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
- 56 echte native Android-Tests auf dem freigegebenen main-Quellstand ohne
  Fehler oder Skips bestanden, einschließlich mehrsprachiger Rastertexte,
  Scan-PDF und Suche bei gesperrten Dokument- und Worker-Netzwerkladewegen.
- Die CI zeigte zusätzlich einen sporadischen Mail-Kopfzeilenbefund. Ein zweiter
  Startabruf nach einer bereits abgeschlossenen Aktualisierung konnte die
  Bedienelemente während der Prüfung austauschen. Dieser unnötige Doppelabruf
  wird unterdrückt; alte gespeicherte Daten und die regelmäßige Aktualisierung
  behalten ihren vorgesehenen Abruf. Zehn Gegenproben mit virtueller Uhr
  bestanden, einschließlich rückwärts verstellter Gerätezeit sowie alter und
  zukünftiger gespeicherter Abrufzeitpunkte.
- Vollständige Websuite und native Browsersuite bestanden; Dateiprüfung 29,
  Postfachindex 69 und Zeitplan zehn Fälle bestanden. Alle 14 Prüfungen des
  PR-Quellstands `e5d234d87cd504c3abf510985329bc0a29aeee6e` erfolgreich;
  PR #79 übernommen, Release-Quelle `457b20e08193a8383761ab2542dcd145f6f34b56`.
- Alle elf main-Prüfungen erfolgreich: Android `40121619660` (Versuch 2),
  Windows `40121619637`, Signierung `40121619642`, Pages `40121619198`.
  Der Firefox-Paketdownload erforderte einen einzelnen Job-Neustart; der echte
  native Testjob `120954221526` bestand bereits im ersten Versuch.
- Release [40123045873](https://github.com/lausiklauskn-png/Privat-Brain-Pro/actions/runs/40123045873)
  vollständig erfolgreich: Build `120958544681`, signiertes Update .32 → .33
  `120962044067`, Veröffentlichung `120962607507`. Seed, Baseline und Verify bestanden.
- Öffentliche APK unabhängig geladen: **18.618.467 Bytes**, SHA-256
  `56020cf2e362d1b575ebd7472b9d9d10af5a1330b03b8390c3378e1534e3e5ab`. Prüfsumme, API-Asset-Digest,
  Tag/Quelle und veröffentlichter Signaturbericht stimmen. 39 OCR-Dateien gegen
  Größe und SHA-256, 29 Lizenztexte, 27 native Dateien, drei Mail-/Explorerressourcen,
  OCR-Verdrahtung, Unicode-Suchaufteilung und 22 Kanon-Module geprüft.
  Der lokale Downloadprüfer kontrolliert den Signaturbericht; er ersetzt keinen
  eigenständigen kryptographischen APK-Signaturlauf. Die Release-Pipeline führte
  die Signatur- und tatsächliche signierte Updateprüfung aus.
  [Maschinenlesbarer Nachweis](android-preview33-pruefung.json).

Die Leistung auf Klaus' Samsung Galaxy Tab S6 und physisches Samsung DeX wurden
nicht gemessen. [Bedienung und Grenzen](../../NATIVE-TEXTERKENNUNG.md).
