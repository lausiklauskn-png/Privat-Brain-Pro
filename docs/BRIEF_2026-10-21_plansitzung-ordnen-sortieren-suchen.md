# Brief für die nächste Sitzung: Plansitzung „Ordnen, Sortieren, Suchen“ (2026-10-21)

**Art der Sitzung: zuerst nur planen, nichts bauen.** Klaus möchte vorher mit dir
abgleichen, wie Ordnerstruktur, Suche und Sortierung aussehen sollen. Erst wenn er
dem Plan zugestimmt hat, wird gebaut.

## Ausgangslage (gemessen am 2026-10-21)

- **Vorschau .19** (Virenschutz aus PR #44, Version 19 aus PR #46) liegt freigegeben
  auf main `418ff2eeced686af8145aecd2d5e82a746a25f18`. Veröffentlicht hat sie
  **Codex**, weil diese Claude-Sitzung keine Tags pushen und keinen
  Arbeitsablauf starten darf (403). Vor jeder Aussage zu .19 im Release und in
  `docs/PRUEFSTAND-ANDROID.md` nachsehen, ob die Veröffentlichung
  wirklich durchgelaufen ist.
- **Benutzerhandbuch**: PR #47, Entwurf, bleibt offen und wird ergänzt
  (`native/handbuch-de.js`, `native/native-manual.js`, Probe
  `tools/native/test-manual.mjs`). Vorschau für Klaus:
  https://claude.ai/artifact/DDPa76a9yuK85Y9D8bXtBG
  Neue Funktionen bekommen dort ihr Kapitel.
- **Was es schon gibt** (im Code nachgesehen):
  - Explorer: Filterfeld und Sortierung nach Name, Datum oder Größe;
    das Datum nur absteigend, eine Umkehrung fehlt
    (`assets/workspace.js`, `explorerSort`).
  - Postfach: Textfilter über Betreff, Text und Absender, immer neueste zuerst
    (`assets/mail-workspace.js`, `visible()`); keine Bündelung nach Absender,
    keine eigene Bedeutungssuche.
  - Spam- und Betrugsregeln sowie Listen aus der Prüfstelle (`native/native-protect.js`) erkennen
    gefährliche Mails, aber keine Werbung oder Newsletter.
  - Die übergeordnete Bedeutungssuche über alle Dokumente gibt es; das Modell im
    APK ist weiterhin offen (Brief 2026-10-20).

## Klaus' Wünsche, wörtlich zusammengefasst

1. **Mails mit wenigen Klicks sortieren:** alle Mails eines Absenders in einen
   Ordner oder ein Bündel, darin nach Datum.
2. **Eigene Suche im Postfach**: Wortsuche **und** Bedeutungssuche nur in den
   Mails, ohne die Suche über alle Dokumente.
3. **Aussortieren mit Vorschlägen:** nützlich gegen unnütz. Reine Werbung ganz
   entfernen. Bei Newslettern und Werbung (Beispiele Aldi, Y-Food) **nur den
   aktuellsten behalten, ältere automatisch löschen.** Leicht einzurichten,
   schnell zu löschen.
4. **Eingefügte Dateien** (Gehaltsabrechnungen, Krankenakten, Rechnungen):
   neueste oben, umkehrbar, Inhaltssuche.
5. **Neue Kategorien automatisch**, z. B. „Rechnungen“ sammeln sich von selbst.
6. **Zusammenarbeit mit Workflow PDF Pro:** Klaus scannt Papier mit einem
   Scanner (noch zu kaufen) in Workflow PDF Pro ein, das PDF geht von dort
   automatisch an Private Brain Pro. Workflow PDF Pro wird parallel als native
   App gebaut (Repo `workflow-pdf-pro`).

## Fragen, die die Plansitzung mit Klaus klären muss

Einzeln stellen, mit Empfehlung, ein Schritt je Frage:

- Absender-Bündel als **echte IMAP-Ordner** auf dem Server oder nur als
  **Ansicht in der App**? Regel bisher: lokale Ordner sind keine IMAP-Ordner,
  IMAP-Pfade werden nie umbenannt. Ein Verschieben auf dem Server wäre neu.
- „Löschen“ heißt: in den Papierkorb des Anbieters, endgültig, oder erst lokal
  ausblenden? Wie lange bleibt ein Rückweg?
- Automatisches Löschen alter Newsletter: nur nach einer einmaligen Bestätigung je
  Absender, mit sichtbarer Liste und Rückgängig. Nie still im Hintergrund.
- Wie erkennt die App Werbung und Newsletter? Kopfzeile `List-Unsubscribe`,
  Absenderregeln, lokale Bedeutungssuche, oder Klaus' eigene Markierungen
  (lernende Sortierung aus Korrekturen, Stufe 5 im Fahrplan)?
- Automatische Kategorien: Vorschlag mit einem Tipp bestätigen oder ohne
  Rückfrage anlegen?
- Übergabe Workflow PDF Pro → Private Brain Pro: Android-Teilen, gemeinsamer
  Speicherort-Ordner auf SD oder Tablet, oder eigene Schnittstelle? Signatur
  und Speicherort-Verschlüsselung dürfen dabei nicht umgangen werden.
- Reihenfolge der Bauabschnitte und welcher zuerst in eine Vorschau kommt.

## Verbindlich, was auch immer geplant wird

- **Klaus ist kein Programmierer** und bedient meist einhändig: Deutsch,
  Einzelschritte, keine Befehle für ihn, wo ein Knopf reicht. Er kann keine PRs
  öffnen; Vorschauen gibt es als Link (Artifact).
- Bewegt nichts ohne Zustimmung, löscht nichts ohne Rückweg, kein unklarer
  Mailversand, keine Kontodaten in Git oder Logs.
- Speicherort und Schutzlisten bleiben verschlüsselt im gewählten Ordner, nicht im
  App-Speicher. Nie „virenfrei“ schreiben.
- Geschützte Module und die PWA bleiben unverändert. `PB_SIGNING_UNLOCK` behalten.
- Codex arbeitet parallel am selben Projekt (Signierung, Veröffentlichung,
  Workflow PDF Pro). Abstimmung über Klaus und die gemeinsamen Dokumente
  `docs/VEROEFFENTLICHEN.md` und `docs/SIGNIERUNG-UND-GITHUB.md`. Vor jeder
  Arbeit `git fetch` und auf `origin/main` abzweigen.

## Erwartetes Ergebnis der Plansitzung

Ein kurzer Plan in Bauabschnitten, je mit: was Klaus sieht, wo er tippt,
was nicht passiert (Grenzen), wie geprüft wird. Klaus' Zustimmung abwarten.
Danach das Handbuch (PR #47) um die geplanten Kapitel ergänzen.
