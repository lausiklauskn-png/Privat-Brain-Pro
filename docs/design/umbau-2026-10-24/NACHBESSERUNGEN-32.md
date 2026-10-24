# Nachbesserungen nach Klaus' Test von .31

Stand: .32 in Arbeit, noch kein neuer veröffentlichter APK-Download.

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

## Prüfstand während der Arbeit

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
- Android-/Windows-Bau und der echte Android-Test für die unabhängige
  Teilen-Warteschlange müssen vor Veröffentlichung vollständig bestehen.

Die Browser nutzen nachgebildete Gerätebrücken. Ein eigener physischer Test auf
Klaus' Tab S6 beziehungsweise in Samsung DeX wird damit nicht behauptet.
