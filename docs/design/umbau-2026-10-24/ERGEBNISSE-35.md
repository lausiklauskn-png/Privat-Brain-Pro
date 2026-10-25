# Trefferansicht und Kopierschalter für Android .35

Stand 25.10.2026: **als .35 veröffentlicht**. [Signierte Update-APK](https://github.com/lausiklauskn-png/Privat-Brain-Pro/releases/download/v1.0.0-preview.35/Private-Brain-Pro-1.0.0-preview.35.apk).
Klaus' neue Bilder zeigen die native .34-App in breiten, halben und schmalen
Samsung-DeX-Fenstern. Dieser Auftrag setzt die dort sichtbaren Korrekturen um;
die bisherigen .34-Prüfnachweise bleiben als Historie erhalten.

## Bedienauftrag

- Die Überschrift „Was möchtest du finden?“ und die Einführung darunter
  entfallen vollständig, auch bei leerem Suchfeld. Sprachcode und einzelner
  Bedeutungsschalter bleiben direkt an der Suche.
- Typ, Tags einschließlich „+ Tag“ und Herkunft/Pfad werden zu einer kompakten
  Metadatenzeile. Lange Pfade bleiben am Anfang und Ende erkennbar und werden
  in der Mitte gekürzt. Der vollständige Pfad ist über Maus, Tastaturfokus und
  Antippen erreichbar und wieder schließbar.
- Wiederholte Angaben wie „Original fehlt“ erscheinen nicht mehrfach.
  „Lokale Kopie“ braucht keinen dauerhaften eigenen Platz in der Aktionszeile;
  erforderliche Verfügbarkeitsdetails gehören zur Herkunft. Schutzbefund,
  Teilprüfung und tatsächliche Öffnungsverfügbarkeit bleiben erkennbar.
- Verfügbare Bilder erhalten eine lokale Miniatur; PDFs eine Vorschau ihrer
  ersten Seite. Das Beispiel „Scan 22.10.2026, 03_49.pdf“ ist ein PDF mit
  eingebettetem Bild. PDF-Syntax wie „/Subtype /Image“ oder hexadezimale
  Metadaten ist keine lesbare Textvorschau und soll dort nicht stehen.
  Fehlt eine lesbare Datei, darf keine vermeintliche Vorschau erzeugt werden.
- Maus-/DeX-Steuerungen bleiben bei breiten, halben, gedrittelten und
  aufrechten Fenstern gleichmäßig kompakt: 32 Pixel bei vorhandenem feinen
  Zeigegerät. Touch-only behält 44-Pixel-Bedienflächen. Eine geringere
  Fensterbreite soll die Buttons nicht plötzlich höher machen.
- „Kopieren ausschalten“ wird ein umkehrbarer Schalter. Der gespeicherte
  Ablageordner bleibt erhalten; Einschalten prüft dessen Zugriff und aktiviert
  zusätzliche Ablagekopien wieder. Abbruch oder fehlende Rechte dürfen keine
  erfolgreiche Aktivierung vortäuschen. Die dauerhaften verschlüsselten
  App-Originalkopien bleiben von diesem Schalter getrennt.

## Daten und Umsetzung

Die Vorschau verwendet lokale verfügbare Dateien. Sie startet weder eine neue
OCR noch eine erneute Katalogisierung und verändert gespeicherten Suchtext oder
Originaldateien nicht. Nur lesbare Vorschautexte sollen sichtbar bleiben.
Vorschauen werden bedarfsgesteuert geladen, damit viele Treffer nicht sämtliche
PDF-Seiten oder Dateiinhalte gleichzeitig über die native Bridge übertragen.

Die native Anpassung wird beim App-Bau erzeugt; der ursprüngliche
`index.html`-Stand und die geschützten Prüfmodule werden nicht umgeschrieben.
Android und der Windows-Host erhalten denselben zusätzlichen Resume-Vertrag
für bereits konfigurierte Ablageordner. Das ist keine neue Windows-Veröffentlichung.

## Abnahme und Veröffentlichung

Der gemeinsame lokale Build ist geprüft: 58 Größen-/Pointerprüfungen, 27
Trefferkarten-, 21 Vorschau- und 71 Ablageprüfungen bestanden. Hinzu kommen
95 Desktop-Engineprüfungen sowie die bestehenden Darstellungs-/Funktionsläufe,
unter anderem 263 adaptive Ansichten, 101 Themen-, 116 Hilfe- und 91 Statusfälle.
Eine unabhängige Sichtprüfung der 1280- und 600-Pixel-Ansichten fand keine
überlappenden oder abgeschnittenen Bedienelemente.

Automatische PDF-Vorschauen sind auf tatsächlich bestätigte lokale Originale
bis 16 MiB begrenzt. Für ältere Bilder ohne vorhandene Miniatur gelten 2 MiB
und 12 Megapixel vor dem Decodieren. Größere Dateien bleiben über Öffnen
verfügbar. Ein einzelner Vorschauauftrag und maximal 16 Cacheeinträge mit
zusammen 6 MiB begrenzen die Hintergrundarbeit.

Die folgenden Abschlussnachweise beziehen sich ausschließlich auf
`d5635b7af9614757b36e3157023d5b68008ddb7a`:

- Alle elf main-Prüfungen desselben Quellstands erfolgreich: [Android/Web 40170769470](https://github.com/lausiklauskn-png/Privat-Brain-Pro/actions/runs/40170769470), [Windows 40170769501](https://github.com/lausiklauskn-png/Privat-Brain-Pro/actions/runs/40170769501), [Signierung 40170769520](https://github.com/lausiklauskn-png/Privat-Brain-Pro/actions/runs/40170769520) und [Pages 40170769001](https://github.com/lausiklauskn-png/Privat-Brain-Pro/actions/runs/40170769001).
- [60 native Fälle](https://github.com/lausiklauskn-png/Privat-Brain-Pro/actions/runs/40170769470/job/121100956974) ohne Fehler oder Skips, einschließlich der
  Ablagebrücke. Browserprüfungen nachgebildeter Brücken bleiben davon getrennt.
- Release [40171548476](https://github.com/lausiklauskn-png/Privat-Brain-Pro/actions/runs/40171548476) vollständig erfolgreich: Build `121103242068`,
  signiertes Update .34 → .35 `121105250707`, Veröffentlichung `121105679398`.
  Seed, Baseline und Verify bestanden.
- Öffentliche APK unabhängig geladen: **18.667.332 Bytes**, SHA-256 `59f0c3793e8bb0f5c2920de9250562e2445f31a36515740ecd96887fae5d067b`.
  Prüfsumme, API-Asset-Digest, exakter Tag/Quellstand und ursprüngliche
  Zertifikatskennung im veröffentlichten Signaturbericht stimmen. Dieser lokale
  Prüfer kontrolliert den Bericht samt Digest; die kryptographische Signatur-
  und installierte Updateprüfung lief in der Pipeline.
- 43 native Dateien, drei Mail-/Explorerressourcen, 39 OCR-Dateien,
  29 OCR-Lizenztexte und 22 Kanon-Module gegen Quelle beziehungsweise Pins geprüft.
  Neue Vorschau-/Kartenmodule sind verdrahtet, das Suchintro fehlt. Native
  Resume-Brückendeklaration und Ordnersymbole wurden geprüft; deren Verhalten
  bleibt durch den nativen Testjob belegt, nicht durch den Bytevergleich allein.
- Gepackte native Startseite stimmt mit dem separat browsergeprüften Stand überein:
  `415f0c2abe9f5bf76e4fb321f48caa6ba769e9fced437a859ec39dd3fd11cc24`.
- Einmaliger Dispatcher [40171535071](https://github.com/lausiklauskn-png/Privat-Brain-Pro/actions/runs/40171535071) forderte den Release an; er ist vom eigentlichen Release-Lauf getrennt.

[Maschinenlesbarer Download- und Quellnachweis](android-preview35-pruefung.json).

Der vorhandene Freibrief umfasst Umsetzung, Merge und Veröffentlichung des
geprüften Updates; keine erneute Freigabe verlangen. Eine Messung am physischen
Samsung Galaxy Tab S6 oder seinem DeX-System bleibt davon getrennt.
