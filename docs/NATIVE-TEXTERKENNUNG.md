# Lokale Texterkennung in Private Brain Pro

Stand 24.10.2026: als Android .33 veröffentlicht. [Update-APK](https://github.com/lausiklauskn-png/Privat-Brain-Pro/releases/download/v1.0.0-preview.33/Private-Brain-Pro-1.0.0-preview.33.apk)
über die vorhandene App installieren; nicht deinstallieren. Vollständige Browser-,
Android-/Windows- und Release-Prüfungen einschließlich signiertem Update .32 → .33
bestanden. [Download- und Quellnachweis](design/umbau-2026-10-24/android-preview33-pruefung.json).
Ein physischer Test auf dem Samsung Galaxy Tab S6 oder in Samsung DeX und dessen
Reaktionszeiten sind damit nicht nachgewiesen.

Beim Hinzufügen liest die native App Text in Bildern und gescannten PDF-Seiten.
Der erkannte Text steht der Suche und der vorhandenen Inhaltsprüfung zur
Verfügung. Bei PDFs mit Textebene wird der vorhandene Text weiterhin direkt
gelesen. Die Originaldateien werden durch die Texterkennung nicht verändert.

Bereits gespeicherte Dateien werden nicht still im Hintergrund neu eingelesen.
Mit **„Erneut prüfen“** lässt sich ein vorhandenes, verfügbares Original bewusst
neu prüfen und sein Suchtext ergänzen. Ein früherer Bericht ohne Texterkennung
wird als solcher erklärt. Fehlt das Original, bleibt die Datei nicht prüfbar;
ein alter Bericht ersetzt keine neue Prüfung. Ein fehlgeschlagener oder leerer
OCR-Lauf überschreibt vorhandenen Suchtext nicht mit einem leeren Ergebnis.

## Offline und Sprachen

Tesseract.js 7.0.0 und Tesseract.js-core 7.0.0 verwenden lokale LSTM-Sprachdaten
für **Deutsch, Englisch, Russisch und Polnisch**. Engine und Sprachdaten sind
eingepackt. Die Texterkennung benötigt weder Internet noch einen KI-Schlüssel
und überträgt dafür keine Bilder oder Texte an einen Anbieter. Die vier
Erkennungssprachen sind gemeinsam verfügbar, unabhängig von der Gerätesprache.

Die OCR-Nutzlast umfasst **39 fest geprüfte Laufzeit-, Sprach- und Lizenzdateien
mit zusammen 26.315.914 Bytes**, zusätzlich das Prüfmanifest `ocr-assets.json`
und die Hilfeseite. Die Lizenzhinweise stehen in der App unter
`ocr-notices.html`; die Original-Lizenzen werden mitgeliefert.

## Fortschritt und Grenzen

- Fortschritt und **„Abbrechen“** bleiben während eines Laufs sichtbar.
  Nach einem unterbrochenen Lauf ist eine bewusste erneute Freigabe möglich;
  es gibt keine automatische Endlosschleife.
- Pro PDF werden höchstens **10 Seiten ohne Textebene** per OCR gelesen.
  Weitere ungelesene Seiten bleiben im Bericht ausdrücklich ungeprüft.
- Die Dateigrenze liegt bei **64 MiB**; große Bilder sind auf **40 Millionen
  Bildpunkte** beziehungsweise **16.000 Pixel pro Kante** begrenzt. Die
  Arbeitskopie wird auf höchstens 3.000 Pixel Kantenlänge reduziert.
- Ein Lesedurchgang hat höchstens **90 Sekunden** Zeit. Mehrere Seiten oder
  Kontrastdurchgänge können zusammen länger dauern.
- Unsichere Zeilen unter 60 Prozent Erkennungssicherheit, Fehler und
  ungelesene Bereiche führen zu **„teilweise“ beziehungsweise „ungeprüft“**.
  Ein leerer Scan oder ein Abbruch gilt nicht als vollständig geprüft.

Schlechte Scans, kleine Schriften und Handschrift können fehlerhaft erkannt
werden. Die Inhaltsprüfung ist weiterhin keine Virenprüfung.

Technischer Umfang und aktueller Prüfstand:
[Texterkennung für .33](design/umbau-2026-10-24/TEXTERKENNUNG-33.md).
