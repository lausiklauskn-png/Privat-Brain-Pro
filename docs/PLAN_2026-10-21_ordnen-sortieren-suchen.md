# Plan „Ordnen, Sortieren, Suchen“ (2026-10-21)

**Stand: Plan, wartet auf Klaus' Zustimmung. Es wird noch nichts gebaut.**
Grundlage: [Brief der Plansitzung](BRIEF_2026-10-21_plansitzung-ordnen-sortieren-suchen.md)
(liegt auf Zweig `ccr-1b365b80-fw60yy`, PR #47).

## Vorab geprüft

- Vorschau .19 steht wirklich im Release: Tag `v0.1.0-preview.19` zeigt auf
  `418ff2eeced686af8145aecd2d5e82a746a25f18`, veröffentlicht 2026-10-21 09:22 UTC,
  APK 5.667.836 Bytes, SHA-256 `b5851f24…6604` (wie in CLAUDE.md).
- Ist-Stand im Code nachgesehen: Explorer sortiert Name/Datum/Größe, Datum nur absteigend
  (`assets/workspace.js`); Postfach filtert nur Text, immer neueste zuerst
  (`assets/mail-workspace.js`, `visible()`). Kein Auslesen von `List-Unsubscribe`.
  Kein Android-Teilen-Eingang (nur `MAIN/LAUNCHER` im Manifest).
- Der native Mail-Adapter kann heute auf dem Server: gelesen/ungelesen, Stern,
  Verschieben (nur wenn der Server `MOVE` kann) und endgültiges Löschen **nur im
  Papierkorb** (`MailEngine.action`). Ein Weg „in den Papierkorb und wieder zurück“
  fehlt noch.

## Klaus' Entscheidungen (2026-10-21)

| Frage | Entscheidung |
|---|---|
| Absender-Bündel | zuerst **nur Ansicht in der App**, später je Bündel ein Knopf „Als Ordner beim Anbieter anlegen“ |
| „Löschen“ | in den **Papierkorb des Anbieters**; dort Rückweg, solange der Anbieter ihn nicht leert; in der App sofort „Rückgängig“ |
| Newsletter aufräumen | **nach Gültigkeit**, nicht „nur den neuesten behalten“ (Klaus: Angebote überschneiden sich; ein länger gültiges Angebot darf nicht verschwinden). Gelöscht wird nur, was abgelaufen ist, plus 1 Tag Puffer. Ohne eindeutiges Datum nie automatisch, sondern „Zum Prüfen“. Einschalten einmal je Absender, jede Runde mit Rückgängig |
| Erkennung Werbung/Newsletter | Abmelde-Kennzeichen (`List-Unsubscribe`) **+** Klaus' eigene Markierungen **+** Bedeutungssuche (sobald das Modell im APK ist) |
| Kategorien | **Vorschlag, ein Tipp** zum Anlegen; danach sammeln sie sich selbst (nur Ansicht) |
| Scanner-Übergabe | Knopf **„An Private Brain“** in Workflow PDF Pro über Android-Teilen |
| Reihenfolge | **Postfach zuerst** |
| Konten | Suche, Bündel, Aufräumen und Kategorien gelten **für alle eingetragenen Konten zusammen** |
| Erstabruf | einmal alle Konten abrufen und einordnen, **letzte 12 Monate**; Älteres mit „Ältere nachholen“ |
| Danach | **automatisch beim Öffnen und alle 30 Minuten**, nur bei eingeschaltetem App-Internet |
| Doppelungen | eine schon vorhandene Mail wird beim erneuten Laden **überschrieben**, keine neue Fassung; unsichere Fälle in den Ordner **„Doppelte“** |

## Grundlage für alle Abschnitte: alle Konten, keine Doppelungen

- **Heute im Code:** eine Mail kommt nur auf ausdrückliches „In den Katalog“ in den Katalog.
  Ihr Kennzeichen ist ein Fingerabdruck aus Absender, Betreff, Datum und Text
  (`assets/live-mail.js`). Lädt man dieselbe Mail noch einmal, entsteht deshalb meist keine
  zweite. Ändert sich aber ein Zeichen, oder liegt dieselbe Mail in zwei Konten, kann es doch
  zwei Einträge geben.
- **Neu:** Erkannt wird zuerst an der Kennung im Mailkopf (`Message-ID`). Fehlt sie, gilt der
  bisherige Fingerabdruck. Ist eine Mail schon da, wird ihr Eintrag **überschrieben**.
  Klaus' eigene Markierungen bleiben dabei erhalten (Stern, „Ist Werbung“, „Ist wichtig“,
  Kategorie), ebenso die Originale im Speicherort-Ordner. Liegt dieselbe Mail in zwei Konten,
  bleibt es **ein** Eintrag, der beide Fundorte kennt.
- **Unsicher** (gleicher Betreff und Absender, Text weicht ab, keine Kennung): nichts wird
  überschrieben, beide kommen in den vorhandenen Ordner **„Doppelte“**, wo Klaus mit einem Tipp
  „Gleich – zusammenlegen“ oder „Verschieden – beide behalten“ wählt.
- **Erstabruf:** Knopf „📥 Alle Konten abrufen und einordnen“ mit Fortschritt je Konto
  (12 Monate). Danach von selbst beim Öffnen der App und alle 30 Minuten, nur bei eingeschaltetem
  App-Internet. Große Anhänge werden nicht automatisch geladen. Ein Konto, das gerade nicht
  erreichbar ist, wird übersprungen und gemeldet; die anderen laufen weiter.
- **Grenzen:** nur Lesen und Einordnen; Senden passiert nie automatisch. Ältere Mails als
  12 Monate erst nach „Ältere nachholen“. Alle 30 Minuten gilt, solange Android die App
  im Hintergrund nicht anhält (Energiesparen am Tablet kann das verzögern).
- **Prüfung:** Proben mit zwei Testkonten: dieselbe Mail zweimal laden → ein Eintrag,
  Markierungen erhalten; dieselbe Mail in beiden Konten → ein Eintrag; abweichender Text ohne
  Kennung → „Doppelte“; Konto offline → andere laufen weiter.

## Bauabschnitte

### A1 · Absender-Bündel und Postfach-Wortsuche

- **Klaus sieht:** oben im Postfach einen Umschalter „📋 Liste · 👤 Nach Absender“.
  Bei „Nach Absender“ je Absender eine Zeile (Name, Anzahl, Datum der neuesten Mail);
  ein Tipp öffnet das Bündel, darin neueste oben, ein Tipp auf „↕“ dreht die Reihenfolge.
  Das Suchfeld sucht nur in Mails (Betreff, Absender, Text) und zeigt die Trefferzahl.
- **Tippt:** Umschalter, Bündel, ↕. Die Wahl bleibt nach Neustart.
- **Grenzen:** reine Ansicht; auf dem Server bewegt sich nichts. Absender werden über die
  Adresse zusammengefasst (gleiche Firma mit zwei Adressen = zwei Bündel, bis A2-Markierung).
  Gesucht wird in bereits geladenen Mails, nicht im ganzen Serverpostfach.
- **Prüfung:** Browser-Proben im gemeinsamen Postfach (vor/nach Kontoaktivierung), DE/EN/RU/PL,
  schmale Handyansicht einhändig; Android-Fall im Emulator.

### A2 · Werbung und Newsletter mit Ablaufdatum

- **Klaus sieht:** an Newslettern ein Schild „📰 Newsletter“ und, wenn gefunden,
  „gültig bis 26.10.“. Neuer Bereich „🧹 Aufräumen“ mit drei Listen:
  „Abgelaufen“, „Zum Prüfen“ (kein eindeutiges Datum), „Läuft noch“.
  Pro Absender einmal die Frage „Aldi: abgelaufene Angebote künftig selbst in den
  Papierkorb legen?“ – Ja/Nein.
- **Tippt:** „Ist Werbung“ / „Ist wichtig“ an einer Mail (merkt sich die App für den Absender);
  „Alle abgelaufenen löschen“; nach jeder Runde „Rückgängig“.
- **Erkennung:** `List-Unsubscribe` im Mailkopf (beim Abruf nativ ausgelesen) und Klaus'
  Markierungen. Datum aus festen Mustern („gültig bis“, „vom … bis …“, „nur bis“,
  „Angebote der Woche KW 43“), Jahr aus dem Mail-Datum.
- **Was nie passiert:** kein Löschen ohne eindeutiges Datum; kein Löschen bei Absendern,
  die Klaus nicht freigegeben hat; nichts mit Stern; nichts, was als „wichtig“ markiert ist;
  nie endgültig löschen; kein Abmelden ohne Tipp. Ein Newsletter mit späterem Ablauf
  bleibt stehen, auch wenn schon ein neuer da ist.
- **Technik:** neuer nativer Schritt „in den Papierkorb verschieben“ und „zurückholen“
  (Herkunftsordner wird verschlüsselt im Speicherort gemerkt); bei Google über die Gmail-Schnittstelle.
  Server ohne `MOVE`: Kopieren + Markieren nur, wenn `UIDPLUS` da ist, sonst Meldung
  „Dieser Anbieter erlaubt das nicht“, nichts passiert. Freigaben und Protokoll liegen
  verschlüsselt im Speicherort-Ordner.
- **Grenzen:** Daten in Bildern (nur Werbegrafik ohne Text) werden nicht erkannt →
  „Zum Prüfen“. Der Rückweg im Papierkorb endet, wenn der Anbieter ihn leert (oft 30 Tage).
  Bedeutungssuche kommt erst mit A6 dazu.
- **Prüfung:** Datums-Proben mit vielen echten Wortlauten (auch Überschneidung zweier
  Wochenangebote), Gegenprobe „ohne Datum wird nichts gelöscht“, „Rückgängig holt zurück“,
  Android-Probe gegen einen Test-IMAP-Server. Echte Konten am Tablet: Klaus.

### A3 · Dateien: neueste oben, umkehrbar, Inhaltssuche

- **Klaus sieht:** im Explorer bei „Datum“ einen ↕-Knopf (neueste oben / älteste oben),
  Standard neueste oben. Das Suchfeld bekommt „🔎 auch im Inhalt“.
- **Grenzen:** Inhaltssuche nur über den gelesenen Text im Katalog (PDF mit Textebene,
  erkannter Text); Scans ohne Texterkennung finden nur über Namen.
- **Prüfung:** Browser-Proben Sortierung beide Richtungen, Rückweg erhält Sortierung.

### A4 · Kategorien per Vorschlag

- **Klaus sieht:** Hinweis „7 Dateien sehen wie Rechnungen aus – Kategorie anlegen?“ Ein Tipp.
  Danach im Explorer „🏷 Rechnungen“, neue passende Dateien kommen von selbst hinein.
  Erste Vorschläge: Rechnungen, Gehalt, Gesundheit, Verträge, Versicherung.
- **Grenzen:** nur Ansicht, Originale bleiben, wo sie sind. Erkennung zuerst über
  Wörter (Rechnungsnummer, Brutto/Netto, Diagnose …) und Klaus' Korrekturen; mit A6 genauer.
  Falsch einsortiert → „Gehört nicht hierher“, die App merkt es sich.
- **Prüfung:** Proben mit Beispieldateien je Kategorie, Gegenprobe „nichts wird bewegt“.

### A5 · Scanner-Übergabe aus Workflow PDF Pro

- **Klaus sieht:** in Workflow PDF Pro „An Private Brain senden“; Private Brain öffnet sich
  mit „1 PDF angekommen – aufnehmen?“ (Name, Seitenzahl).
- **Technik:** Android-Teilen (`ACTION_SEND`, nur `application/pdf`), Datei wird gelesen,
  geprüft (Prüfstelle), signiert und verschlüsselt im Speicherort-Ordner abgelegt.
  Ohne eingerichteten Speicherort: Hinweis, nichts wird gespeichert.
- **Abstimmung:** Codex baut die Senden-Seite in `workflow-pdf-pro`; die Absprache kommt in
  ein gemeinsames Dokument. Funktioniert auch mit jeder anderen App, die PDF teilt.
- **Grenzen:** Stapel = mehrere Dateien auf einmal (`SEND_MULTIPLE`) erst, wenn gewünscht.
- **Prüfung:** Android-Fall „PDF teilen → aufgenommen und verschlüsselt“, Abbruch-Fall.

### A6 · Bedeutungssuche im Postfach und für Kategorien

- Erst, wenn das Sprachmodell im APK ist (offener Auftrag vom 2026-10-20).
  Dann: Postfach-Suche „🧠 nach Bedeutung“ nur in Mails, bessere Newsletter-/Kategorie-Erkennung.

## Vorschauen

A1 als erste Vorschau-App, danach A2, dann A3+A4 zusammen, dann A5. Veröffentlichung
macht Codex oder Klaus (diese Sitzung darf keine Tags/Releases). Jeder Abschnitt bekommt
sein Kapitel im Benutzerhandbuch (PR #47). Nie „virenfrei“; PWA und geschützte Module
bleiben unverändert.
