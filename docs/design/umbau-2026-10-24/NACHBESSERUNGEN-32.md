# Nachbesserungen nach Klaus' Test von .31

Stand: .32 veröffentlicht am 24.10.2026. [Signierte Update-APK](https://github.com/lausiklauskn-png/Privat-Brain-Pro/releases/download/v1.0.0-preview.32/Private-Brain-Pro-1.0.0-preview.32.apk)
über die vorhandene App installieren; nicht deinstallieren.

Klaus zeigt am 24.10.2026 die native .31 in Samsung DeX. In Dateibaum,
Pfadnavigation und Datei-/Mailgruppen sind bunte System-Emojis stehen geblieben.
Er wünscht verstellbare Container, eine gemeinsame Zeile für Briefsymbol und
Mailtitel sowie deutlich weniger Erklärungstext. Er meldet außerdem 10–15,
teils 30 Sekunden Wartezeit, besonders beim Teilen. Diese Zeit stammt aus seinem
Gerätetest; sie wird nicht als hier selbst gemessener Benchmark ausgegeben.

## Konkrete Änderungen

- System-Icons bekommen eigene SVG-Slots: Ordner, Dateien, Mail, Kontakte,
  Bilder und Prüfbefunde. Das originale Datenlabel bleibt erhalten, auch wenn
  ein Dateiname oder Betreff selbst ein Emoji enthält. Verborgene alte
  Dekorationszeichen dürfen vorhandene Übersetzungs-/Prüfverträge erhalten;
  sichtbar ist jeweils nur das einheitliche Liniensymbol.
- Briefsymbol und Betreff teilen sich eine Zeile. Dateibaum und Dateiliste
  sowie Mailordner, Mailliste und Lesebereich erhalten ziehbare Trennlinien.
  Maus, Touch, Pfeiltasten, Umschalt+Pfeil, Pos1/Ende und Escape beim Ziehen
  sind berücksichtigt; Doppelklick stellt die Standardbreite wieder her.
  Breiten werden lokal gespeichert und an die verfügbare Breite begrenzt.
  Hochformat und kleine Mailfenster zeigen eine einzelne Arbeitsfläche.
- Gewöhnliche Import-/Einstellungs-Erklärungen liegen hinter beschrifteten
  Info-Schaltflächen. Bestehende Texte, IDs, Übersetzungen und Listener bleiben
  erhalten. Fehler, Fortschritt, Datenübertragungsentscheidungen und tatsächliche
  Speicherwarnungen werden nicht pauschal versteckt.
- Wartepunkte und kurze Statusmeldungen erscheinen vor längeren Aktionen.
  Die Punkte drehen per CSS; es gibt keine zusätzliche permanente JavaScript-
  Animationsschleife. Messbarer Fortschritt und Abbrechen bleiben erreichbar.

## Bedienung

Die schmale Trennlinie zwischen zwei Bereichen mit der Maus oder dem Finger
ziehen. Doppelklick stellt die Standardbreite wieder her. Mit Tab lässt sich
die Trennlinie fokussieren; Pfeiltasten verstellen die Breite, Umschalt macht
größere Schritte. Escape bricht ein laufendes Ziehen ab.

Das Info-Symbol öffnet die Erklärung des jeweiligen Kastens; erneutes Anklicken
oder Escape schließt sie. Drehende Punkte bedeuten laufende Vorbereitung,
beispielsweise vor dem Android-Dialog zum Teilen. Sie melden keinen Versand-
oder Speichererfolg vor dessen tatsächlicher Bestätigung.

## Tatsächliche Ansatzpunkte für die Wartezeit

Gespeicherte PDFs wurden zuerst vollständig in 256-KiB-Stücken zur Oberfläche
zurückgelesen und dort gehasht, bevor der native PDF-Renderer dieselbe Datei
erneut öffnete. Der neue direkte Hash-Verweis vermeidet diese Bridge-Vollkopie.
Die native Auswahl prüft den Fingerabdruck weiterhin; ein kaputtes Original darf
dadurch nicht geöffnet oder geteilt werden. Formatfehler einer Vorschau sind
von fehlenden oder veränderten Originalen getrennt.

Öffnen und Teilen lagen außerdem in derselben nativen Warteschlange wie
PDF-Seitenberechnungen. Eine getrennte Hintergrundwarteschlange ermöglicht den
Systemdialog unabhängig davon. Schnelleres Abgeben bleibt an unveränderte
Originalbytes und einen nur lesbaren Provider gebunden. Verspätete Antworten
dürfen keinen inzwischen geschlossenen oder gewechselten Betrachter verändern.

## Abgeschlossener Prüfstand

- Verschiebbare Bereiche: 55 Browserfälle bestanden, echte Maus-/Touch-/
  Tastatureingaben, gespeicherte Breiten und erhaltene Entwürfe/Filter.
- Hilfefunktionen: 48 Browserfälle bestanden, einschließlich originaler
  Datei-/Ordneraktionen, Sprachen, Touch und sichtbarer Fehler.
- Aktivitätsanzeige: 33 Browserfälle bestanden, Paralleloperationen,
  Fehlerbereinigung, reduzierte Bewegung und unveränderte Fortschrittswerte.
- Symbolprüfung: 46 Fälle bestanden, darunter eigene Datenpräfixe, Briefsymbol
  auf der Betreffzeile, genau ein Überschriftssymbol und Sprachwechsel.
- PDF-/Teilen-Oberfläche: 23 Fälle bestanden, einschließlich sofortiger
  Bedienelemente ohne Bridge-Vollkopie und Abbruch vor verspäteten Aufrufen.
- Vollständige bestehende Websuite und native Browsersuite bestanden;
  Ordnerbedienung abschließend 57 Fälle, Hilfen 48 Fälle erneut grün.
- PR #78 übernommen; Quelle `a4a2cd69a3caa7ad3c1a9eb332c7137504eb4608`.
  Android-main [40116256712](https://github.com/lausiklauskn-png/Privat-Brain-Pro/actions/runs/40116256712),
  Windows-main [40116256687](https://github.com/lausiklauskn-png/Privat-Brain-Pro/actions/runs/40116256687)
  und Signierung `40116256695` vollständig erfolgreich.
- 55 native Android-Tests ohne Fehler oder Skips. Der neue Test blockiert die
  echte PDF-Warteschlange und prüft trotzdem erfolgreichen Teilen-Dialog und
  schreibgeschützte Originalbytes; ein verändertes Original wird abgewiesen.
- [Release 40117059939](https://github.com/lausiklauskn-png/Privat-Brain-Pro/actions/runs/40117059939)
  vollständig erfolgreich: Build `120940415828`, signiertes Update .31 → .32
  `120942701808` und Veröffentlichung `120943212130`. Seed, Baseline und Verify bestanden.
- Öffentliche APK unabhängig geladen: **7.529.379 Bytes**, SHA-256
  `632aada11ed73f61618e737c3743768b2d4884c762ab1ea7f384c5e305c747b5`. Prüfsummen, Asset-Digest,
  ursprüngliche Signatur und Release-Quelle stimmen. 24 gepackte native
  Dateien und zwei Explorer-/Mailressourcen bytegleich zur Release-Quelle;
  neue Modulverdrahtung und native Warteschlange geprüft.
  [Maschinenlesbarer Nachweis](android-preview32-pruefung.json).

Die Browser nutzen nachgebildete Gerätebrücken. Ein eigener physischer Test auf
Klaus' Tab S6 beziehungsweise in Samsung DeX wird damit nicht behauptet.
