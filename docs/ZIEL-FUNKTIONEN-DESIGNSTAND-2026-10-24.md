# Private Brain Pro: Ziel, Funktionen und erreichter Designstand

Stand: 24.10.2026. Abgleich mit Quellstand `30c11ea`, Konzept und vorhandenen
Bildaufnahmen; keine neue Prüfung an echten Geräten oder Mailkonten.

**Fortschritt danach:** Der erste native Designumbau wurde mit Klaus' Freibrief
umgesetzt und als signierte Android-Version .30 veröffentlicht. Die veröffentlichte
.31 ergänzt getrennte Original-/Prüfanzeigen, automatische lokale Mailübersetzung,
unabhängige Eingabesprache, Mikrofone und Tablet-/DeX-Hochformat. Die veröffentlichte
.32 ergänzt konsequente Liniensymbole, verstellbare Datei-/Mailbereiche, kurze
Erklärungen hinter Info-Buttons und sofortige Wartepunkte. Öffnen/Teilen läuft
unabhängig von PDF-Seitenberechnungen; unnötige vollständige Bridgekopien
verfügbarer PDFs entfallen. Die veröffentlichte .33 ergänzt lokale Texterkennung
für Bilder und Scans in DE/EN/RU/PL; gelesener Text ergänzt Suche und Prüfung,
vorhandene Originale lassen sich bewusst neu prüfen. OCR-Laufzeit und Sprachdaten
sind mitgeliefert; Originale bleiben unverändert und unlesbare Teile ausgewiesen. Der fachliche Abgleich unten beschreibt den Ausgangsstand. [Umsetzung und Release-Nachweise](design/umbau-2026-10-24/README.md).

## Wofür die App gebaut wurde

**Eigene Dateien, Bilder und Nachrichten in einem gemeinsamen Wissensbestand
sammeln, Zusammengehöriges ordnen und Inhalte nach ihrer Bedeutung wiederfinden
und öffnen können. Die Originale bleiben erhalten; die Datenhoheit bleibt beim Nutzer.**

Das ursprüngliche [Konzept](../KONZEPT.md) beschreibt dafür einen Bibliothekar mit
kleinem Katalog: einmal einlesen, Inhalt merken, virtuell ordnen, wiederfinden.
Die heutige Pro-App ergänzt lokale Originalkopien, echte Mailanbindung und
verschlüsselte Sicherung. Der früher erwogene Hardware-Kasten ist keine
Voraussetzung für diesen Softwareauftrag.

Die drei Leitplanken gelten weiter: Originale schützen; Änderungen nachvollziehbar
und unter Nutzerkontrolle halten; virtuelle Ordnung von physischem Verschieben trennen.

## Abgleich mit dem heutigen Angebot

| Aufgabe | Bereits erreicht | Lücke oder Grenze |
|---|---|---|
| Inhalte sammeln | Datei-/Ordnerimport, Mailimport, Teilen/Öffnen mit und gemeinsamer Katalog sind vorhanden. | Der kontenübergreifende Mailindex lädt keine Anhänge; ein Katalogtreffer bedeutet noch keine lokal verfügbare Originaldatei. |
| Bestände zusammenführen | Katalogimport ergänzt Einträge nach Fingerabdruck; gleiche Mails werden über ihre Message-ID zusammengefasst. | Das vereinigt Kataloge und Fundorte, verschmilzt keine PDFs oder Dateiinhalte. |
| Zusammengehöriges organisieren | Explorerbaum, Mail-/Anhangsbezug, Tags, Filter, Doppelte und vorgeschlagene Themenansichten sind vorhanden. | Die fünf Themenvorschläge beruhen auf Wortlisten. „Alle Konten“-Indexeinträge sind im Explorer und dessen Themenansichten ausgeblendet; manuell katalogisierte Mails können sichtbar bleiben. Eine frei benannte gemischte Akte aus Mails und Dokumenten ist bisher kein eigener durchgängiger Ablauf. |
| Nach Inhalt und Bedeutung finden | Gemeinsame Suche, Inhaltssuche, Filter und lokales e5-Modell sind vorhanden. | Das Bedeutungsmodell muss einmal ausdrücklich geladen werden; ohne Modell greift die Stichwortsuche. Der Mailindex speichert höchstens 8.000 Zeichen pro Nachricht und beginnt standardmäßig bei zwölf Monaten. |
| Originale wieder öffnen | Native Importe speichern geprüfte Originalkopien; vorhandene Dateien werden beim Öffnen geprüft und fehlende Originale lassen sich erneut zuordnen. | Alte oder fremde Kataloge können nur Steckbriefe enthalten. „Original fehlt“, „Katalog/Mailtext“ und „noch nicht geprüft“ müssen unterscheidbar bleiben. |
| Privat und offline arbeiten | Lokaler Katalog und Suche, verschlüsselter Speicherort, Sicherung und App-Internetschalter sind vorhanden. Android .28 und Windows .29 sind veröffentlicht. | Mailabruf/-versand, Modell-Erstdownload und bewusst gewählte Cloud-KI brauchen Netz. Ein durchsuchbarer Index ist keine vollständige Originalsicherung. |

**Bewertung:** Die wesentlichen Bausteine sind vorhanden. Die größte erkennbare
Lücke liegt im durchgängigen Weg **Sammeln → gemeinsam zuordnen → finden → Original
öffnen**. Einzelne Ansichten trennen heute Inhalte, die fachlich zusammengehören.
Mehr Menüs und Zusatzfunktionen lösen diese Lücke nicht von selbst.

Mail, Prüfberichte, Tresor und Sicherung unterstützen diesen Kern. Pinnwand,
Such-Tool, Mycel, Freischaltung und Studios sind ergänzende Bereiche und sollten
den täglichen Weg zu den eigenen Inhalten nicht dominieren. Kalender und Aufgaben
auf Referenzbildern sind keine zusätzliche Funktionsbeauftragung. Der bereits
dokumentierte Wunsch nach Kontaktfotos bleibt ein eigener, noch zu prüfender Abschnitt.

## Was im Design erreicht und festgehalten ist

- Klaus hat die vier ersten Entwürfe positiv bewertet: **Klarblau, Graphit, Petrol
  und Nachtblau**. Ein einzelnes endgültiges Thema wurde noch nicht gewählt;
  Klarblau als Standard und Nachtblau als dunkle Alternative waren eine Empfehlung.
- [Private klickbare Vorschau](https://private-brain-pro-design-20261024.tealsole66.chatgpt.site)
  mit Finden, Dateien, Mail und Schreiben; der
  [gesicherte erste HTML-Entwurf](design/entwuerfe-2026-10-24/vorschau.html)
  lässt sich auch ohne Netz öffnen. Er enthält ausschließlich Beispieldaten.
- Gemeinsame Richtung: ruhige neutrale Flächen, gezielte Akzentfarbe, einheitliche
  Liniensymbole, kurze erkennbare Aktionen, kompakte Zeilen und weniger gestapelte
  Leisten. Die Anordnung bleibt bei einem Themenwechsel gleich.
- **Klaus' Klarstellung: Outlook dient als Vergleich und Anregung; Private Brain
  Pro bekommt eine eigene Gestaltung und eine am App-Zweck orientierte Funktionsauswahl.**
- Die Vorschau ist ein Bedienungsentwurf, kein Nachweis eingebauter Funktionen.
  Besonders „Zusammenführen“ mehrerer Dokumente ist dort nur eine Demo. Für eine
  Umsetzung müssen Bedeutung und tatsächliche Funktion zuerst festgelegt werden.
  Das Senden-Symbol ist außerdem mit dem bestehenden Wunsch „Brief abschicken,
  kein Papierflugzeug“ aus dem [Designbrief](../BRIEF_NACHFOLGE_2026-10-24_DESIGN.md)
  abzugleichen. Die im HTML erwähnte ausstehende Bildsichtung gehört zum ersten Entwurfsstand.

## Bilder und nächste Reihenfolge

- [Ist-Zustand](design/ist-2026-10-24/): zwölf Aufnahmen, sechs Ansichten jeweils
  breit und am Handy. [Referenzen](design/vorbild-2026-10-24/): 15 Outlook-Bilder.
- Auf den Bildern belegt: viele gestapelte Bedienbereiche am Handy, wiederholte
  Dreipunktmenüs und gemischte Symbolstile. Positiv übertragbar sind klare
  Aktionsgruppen, kleine Kategorienmarken und verständliche Gruppierung.
- **Zuerst:** den Weg von Mail/Anhang oder Datei bis zum auffindbaren Original
  durchgängig klären; lokale Verfügbarkeit und Prüfstand deutlich zeigen.
- **Danach:** die gemeinsame Zuordnung über Tags/Kategorien beziehungsweise eine
  gemischte Sammlung konkret entwerfen; vorhandene Abläufe dabei berücksichtigen.
- **Dann:** die positiv bewertete Gestaltung Seite für Seite auf diese Abläufe
  anwenden. Anschließend hat Klaus ausdrücklich den Freibrief für die Umsetzung,
  selbstständige Übernahme der PRs und Veröffentlichung einer signierten
  Android-Update-APK gegeben. [Umsetzung und weitere Vorschläge](design/umbau-2026-10-24/README.md).

Quellen: [aktuelle Pro-README](../README.md), [Konzept](../KONZEPT.md),
[Mailindex und Grenzen](ALLE-KONTEN-UND-ABSENDER.md),
[Originale](ORIGINALE-LINKS-GMAIL.md), [Windows-Nachweise](BAUSTAND-WINDOWS.md);
Code: `assets/workspace.js` (`entries`), `native/native-mail-index.js`,
`native/native-categories.js`, `native/native-originals.js`,
`native/native-semantic.js`, `index.html` (`importMerge`, Suche).
Ältere PWA-/Ausgangsbasis-Dokumente beschreiben teilweise frühere Zustände.
