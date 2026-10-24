# Eigenständiger Designumbau · 24.10.2026

**Android .30 ist veröffentlicht:** [APK über die vorhandene App installieren](https://github.com/lausiklauskn-png/Privat-Brain-Pro/releases/download/v1.0.0-preview.30/Private-Brain-Pro-1.0.0-preview.30.apk).
Quelle: `a81d33ba2048ff6ea646a79f7a311c1e9661e1b7`, [übernommener PR #76](https://github.com/lausiklauskn-png/Privat-Brain-Pro/pull/76).

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

## Weitere konkrete Vorschläge

Der nächste App-Schritt setzt die getrennte Darstellung von Original und
Prüfung um: [Bedienung, Umfang und technische Grenzen](STATUS-ORIGINALE-PRUEFUNG.md).
Die Veröffentlichung von .31 wird nach abgeschlossenen Abnahmen hier nachgetragen.
Klaus hat anschließend [DeX, Hochformat, Spracheingabe und Mailübersetzung](ERWEITERUNGEN-NATIVE-BEDIENUNG.md)
als weitere native Anforderungen ergänzt; der .31-Endstand umfasst diese Fortsetzung.

1. **Gemischte Sammlung über vorhandene Tags:** zusammengehörige Mails und Dateien
   unter einem Vorgang finden. Eigene Ansichtsadapter statt den Explorer mit allen
   Index-Mails zu fluten; zunächst keine neue Datenmigration.
2. **Original und Prüfung getrennt anzeigen:** „Lokal verfügbar“, „Nur im Katalog“
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
