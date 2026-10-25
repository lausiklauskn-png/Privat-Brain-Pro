# Eigenständiger Designumbau · 24.10.2026

**Aktuell: Android und Windows 1.0.37 sowie die gebaute PWA sind veröffentlicht.**
[Android-Update-APK](https://github.com/lausiklauskn-png/Privat-Brain-Pro/releases/download/v1.0.37/Private-Brain-Pro-1.0.37.apk) · [Windows-x64-Setup](https://github.com/lausiklauskn-png/Privat-Brain-Pro/releases/download/windows-v1.0.37/Private-Brain-Pro-Windows-1.0.37-x64-setup.exe) · [PWA öffnen / installieren](https://lausiklauskn-png.github.io/Privat-Brain-Pro/).
Gemeinsame Quelle `015c9a1266a64f44a1896ead56349094c64e2f9a`, [übernommener PR #85](https://github.com/lausiklauskn-png/Privat-Brain-Pro/pull/85).
[Startdarstellung und Grenzen](STARTDARSTELLUNG-37.md), [Android](android-1.0.37-pruefung.json),
[Windows](windows-1.0.37-pruefung.json), [PWA](pwa-1.0.37-pruefung.json).

## Vorheriger Stand 1.0.36

**Android und Windows 1.0.36 sind veröffentlicht:** [Update-APK](https://github.com/lausiklauskn-png/Privat-Brain-Pro/releases/download/v1.0.36/Private-Brain-Pro-1.0.36.apk) · [Windows-Setup](https://github.com/lausiklauskn-png/Privat-Brain-Pro/releases/download/windows-v1.0.36/Private-Brain-Pro-Windows-1.0.36-x64-setup.exe).
Gemeinsame Quelle: `a1bd98f40b0186c5a9a148dbd04d19979e6262c4`, [übernommener PR #82](https://github.com/lausiklauskn-png/Privat-Brain-Pro/pull/82).

Die vier positiv bewerteten Farbwelten bleiben Grundlage. Klaus hat anschließend
die selbstständige Umsetzung, PR-Übernahmen und die Veröffentlichung einer
signierten Android-Update-APK ausdrücklich freigegeben.

## Erster umgesetzter App-Schritt (.30)

- Vier dauerhaft wählbare Themen: Klarblau, Graphit, Petrol und Nachtblau;
  Einstellung in DE/EN/RU/PL, vorhandener Hell/Dunkel-Schalter bleibt nutzbar.
- Ruhige Flächen, moderne serifenlose Schrift, gezielte Akzentfarbe und flache
  Bedienelemente für die native Oberfläche.
- Vier Hauptwege oben; Übersicht, Katalog, Doppelte und Einstellungen über das
  vorhandene App-Menü. Alle bisherigen Ansichten und Navigationsziele bleiben erhalten.
- Gemeinsame Liniensymbole; „Prüfen“ und „Senden“ haben passende eigene Symbole.
  Unbekannte Aktionen behalten einen lesbaren Namen. Versand: Umschlag mit Pfeil.
- „Senden“ als beschriftete Hauptaktion oben; Cc/Bcc einklappbar, Inhalte bleiben
  beim Neuzeichnen, Sprachwechsel und Speichern erhalten. „In Katalog“ direkt erreichbar.
- Paketkennung, Signatur, Originalablage, Katalog, SMTP-Ablauf und geschützte
  Module bleiben erhalten. Android-VersionCode 30; Update über die vorhandene App.

## Zweiter umgesetzter App-Schritt (.31)

- Originalverfügbarkeit und historischer Prüfbericht getrennt darstellen;
  [Bedienung, Prüfumfang und Grenzen](STATUS-ORIGINALE-PRUEFUNG.md).
- Automatische lokale Mailübersetzung unter dem Original, DE/EN/RU/PL.
  Benötigte Sprachmodelle einmal ausdrücklich laden; danach ohne KI-Schlüssel
  und ohne Mailübertragung an einen Server. [Bedienung](../../NATIVE-LOKALE-UEBERSETZUNG.md).
- Eingabe-/Diktatsprache direkt an der Suche und in Einstellungen unabhängig
  wählen; Mikrofone an gewöhnlichen Textfeldern und Texteingabedialogen.
- Einzelne Arbeitsspalte im Hochformat auch auf Tablets und hohen DeX-Fenstern,
  erhaltene Entwürfe, Suchanfrage, Pfad und Filter.
- Android-main und Windows-main vollständig grün; 54 native Tests ohne Fehler
  oder Skips, einschließlich echter automatischer Offlineübersetzung. Signiertes
  Update .30 → .31 und unabhängiger öffentlicher APK-Download bestanden.
  [Release 40107514450](https://github.com/lausiklauskn-png/Privat-Brain-Pro/actions/runs/40107514450),
  [Download- und Quellnachweis](android-preview31-pruefung.json).

[Ergänzter Auftrag, Befunde und Prüfgrenzen](ERWEITERUNGEN-NATIVE-BEDIENUNG.md).
Eine tatsächliche Prüfung auf Klaus' Samsung-DeX-Gerät steht noch aus.

## Dritter umgesetzter App-Schritt (.32)

- Einheitliche Liniensymbole auch in Dateibaum, Pfadnavigation, Gruppen und
  Mailansichten; Briefsymbol und Betreff stehen in derselben Zeile.
- Datei-/Mailbereiche per Maus, Touch oder Tastatur verbreitern oder verkleinern;
  Breiten werden gespeichert. Kleine Fenster und Hochformat bleiben einspaltig.
- Längere Erklärungen über Info-Buttons öffnen; Fortschritt und Fehler bleiben
  sichtbar. Drehende Punkte zeigen die laufende Vorbereitung sofort an.
- Gespeicherte PDFs vermeiden eine vollständige Bridgekopie. Öffnen und Teilen
  laufen unabhängig von der nativen PDF-Seitenberechnung; Originalintegrität
  und nur lesbare Dateifreigabe bleiben geprüft.
- Android-/Windows-main und Signierung vollständig erfolgreich, 55 native Tests
  ohne Fehler oder Skips. Signiertes Update .31 → .32 und unabhängiger Download
  bestanden. [Bedienung und Prüfstand](NACHBESSERUNGEN-32.md),
  [Download- und Quellnachweis](android-preview32-pruefung.json),
  [Release 40117059939](https://github.com/lausiklauskn-png/Privat-Brain-Pro/actions/runs/40117059939).

## Vierter umgesetzter App-Schritt (.33)

- Echte lokale Texterkennung für Bilder und gescannte PDF-Seiten in DE/EN/RU/PL;
  gelesener Text steht der Suche und der vorhandenen Inhaltsprüfung zur Verfügung.
  OCR-Laufzeit und Sprachdaten sind enthalten, ohne KI-Schlüssel oder Übertragung.
- „Erneut prüfen“ ergänzt den Suchtext bereits gespeicherter verfügbarer Originale;
  keine ungefragte Verarbeitung des gesamten Bestands. Kyrillische Stichwortsuche
  funktioniert auch ohne Bedeutungsmodell. Originalbytes bleiben unverändert.
- Fortschritt, Abbruch und Grenzen sichtbar; maximal zehn Scan-Seiten je PDF.
  Ungelesene, unsichere oder abgebrochene Bereiche bleiben teilweise/ungeprüft.
- Vollständige Web-/Native-Browsersuiten, 44 echte OCR-Fälle und 56 native Android-
  Tests ohne Fehler/Skips bestanden; Android-/Windows-main und Signierung grün.
  Signiertes Update .32 → .33 und unabhängiger öffentlicher Download bestanden.
  [Bedienung](../../NATIVE-TEXTERKENNUNG.md), [Umfang und Prüfstand](TEXTERKENNUNG-33.md),
  [Download- und Quellnachweis](android-preview33-pruefung.json),
  [Release 40123045873](https://github.com/lausiklauskn-png/Privat-Brain-Pro/actions/runs/40123045873).

Die OCR gehört zum Funktionsumfang von .33; historische .32-Nachweise bleiben erhalten.

## Fünfter umgesetzter App-Schritt (.34)

- Kompakte Suche mit einem Bedeutungsschalter, sieben direkte Hauptwege,
  sofort wirksame Farbpalette und Sprachcode. Einstellungen stehen vor
  gewöhnlichen Erklärungen hinter Linien-i; Importhilfe und Sortiermenü sind kompakt.
- Android ab Version 10 kann nach neuer Ordnerfreigabe, Inhaltsprüfung und
  konkreter Bestätigung Dateikopien bereinigen. Mindestens eine erneut geprüfte
  Kopie bleibt erhalten; Katalogverweise und App-Originalkopien bleiben getrennt.
- Originalzugänge zu Workflow PDF Pro, Kim-Sync, Datei-Post und BookLedgerPro.
  Die Menüsperre schützt die App-Zugänge; Käufergerätefreischaltung bleibt mangels
  öffentlichem Herausgeber-Schlüssel offen.
- Android-/Windows-main und Signierung erfolgreich; 60 native Fälle ohne
  Fehler/Skips. Signiertes Update .33 → .34 und unabhängiger öffentlicher Download bestanden.
  [Bedienung und Prüfstand](SUCHE-34.md), [Werkzeuggrenzen](WERKZEUGE-34.md),
  [Download- und Quellnachweis](android-preview34-pruefung.json),
  [Release 40142276521](https://github.com/lausiklauskn-png/Privat-Brain-Pro/actions/runs/40142276521).

## Sechster umgesetzter App-Schritt (.35)

- Suchintro entfernt; lokale Bild-/PDF-Vorschauen und kompakte Typ-/Tag-/Pfadzeile
  mit aufklappbarem vollständigem Pfad. Doppelte Herkunfts-/Fehlstatus entfallen.
- Maus-/DeX-Steuerungen bleiben auch in halben, gedrittelten und aufrechten
  Fenstern kompakt; Touch-only behält größere Bedienflächen.
- Zusätzliche Ablagekopien lassen sich im erhaltenen Ordner wieder einschalten;
  Schreibzugriff wird vor der Aktivierung geprüft. App-Originalkopien bleiben getrennt.
- Alle elf main-Prüfungen, 60 native Fälle, signiertes Update .34 → .35 und
  unabhängiger öffentlicher Download erfolgreich.
  [Bedienung und Grenzen](ERGEBNISSE-35.md),
  [Download- und Quellnachweis](android-preview35-pruefung.json),
  [Release 40171548476](https://github.com/lausiklauskn-png/Privat-Brain-Pro/actions/runs/40171548476).

## Siebter umgesetzter App-Schritt (1.0.36)

- Dieselben kleinen Bild-/PDF-Vorschauen in Suche, Explorer und Kategorien;
  gemeinsame hashbasierte Zuordnung, Warteschlange und begrenzter Cache.
- Miniatur und vollständige Originaldatei klar unterscheiden; nur tatsächlich
  doppelte Fehlanzeigen entfallen. Wiederimport bekannter Inhalte speichert
  fehlende vollständige Bytes erneut und erhält einen Katalogeintrag.
- Android: signiertes Update .35 → 1.0.36. Windows: echte Produktionsüberinstallation
  .29 → 1.0.36 mit erhaltenen Daten, verschlüsselter Sicherung und Passwortprüfung.
- Beide öffentlichen Downloads unabhängig gegen Prüfsummen und Quelle geprüft.
  [Bedienung und Grenzen](ERGEBNISSE-36.md),
  [Android-Nachweis](android-1.0.36-pruefung.json),
  [Windows-Nachweis](windows-1.0.36-pruefung.json).

## Stand der weiteren Funktionsvorschläge

1. **Gemischte Sammlung über vorhandene Tags:** zusammengehörige Mails und Dateien
   unter einem Vorgang finden. Eigene Ansichtsadapter statt den Explorer mit allen
   Index-Mails zu fluten; zunächst keine neue Datenmigration.
2. **Original und Prüfung getrennt anzeigen (.31 umgesetzt):** „Lokal verfügbar“, „Nur im Katalog“
   und „Original fehlt“ beschreiben die Verfügbarkeit. Daneben stehen Prüfstand,
   Zeitpunkt und Umfang. Ein geprüfter Mailtext beweist keine geprüften Anhänge.
3. **Den vollständigen Weg sichtbar machen:** Mail → Anhang ablegen → Zuordnen →
   Finden → Original. Speicherung muss abgeschlossen sein, bevor Erfolg angezeigt wird.

Diese drei Abläufe sind in der [weiterentwickelten Vorschau](vorschau.html)
durchspielbar. Die Sammlung und simulierte Dateiablage sind dort ausdrücklich
Funktionsvorschläge mit Beispieldaten, keine zusätzlich eingebauten App-Funktionen.
Es gibt keine PDF-Verschmelzung. Outlook liefert Anregungen, keine Kopiervorlage.

## Vorbereitung und Nachweise

- [Technische Anschlussstellen, Phasen und Regressionen](UMBAUPLAN-TECHNIK.md).
- [Symbolzuordnung](design-kit/SYMBOLZUORDNUNG.md),
  [eigenständiges SVG-Set](design-kit/icons.svg),
  [Token-Referenz](design-kit/tokens.css), [Referenzblatt](design-kit/kit.html).
- [Vorschauprüfung](vorschau-qa.json): 81 Layoutprüfungen, sieben Szenarien,
  keine JavaScript-Fehler oder externen Anfragen.
- Für die echte App bestanden: neue Themenprobe (33 Fälle), bestehende Web-/Mail-/Native-
  Prüfungen sowie Android-/Web-main (`40093195380`), Windows-main (`40093195384`)
  und Signierungsprüfung (`40093195392`).
- [Release-Lauf 40094110986](https://github.com/lausiklauskn-png/Privat-Brain-Pro/actions/runs/40094110986):
  Signatur, Paketkennung, Version und signiertes Update .28 → .30 bestanden.
- Öffentliche APK unabhängig heruntergeladen: **7.461.797 Bytes**, SHA-256
  `15f75701de03e3c70fb65132ec7c0e029e09266efe7c0eb988b4f4ab99dd1b88`;
  bytegleich mit den veröffentlichten Prüfsummen und dem GitHub-Asset-Digest.

Der Bau und die CI prüfen die Software. Bedienung auf Klaus' eigenem Tablet ist
damit noch nicht gemessen. Der Release enthält die konkreten App-Änderungen oben;
weitere fachliche Vorschläge können anschließend einzeln umgesetzt werden.
