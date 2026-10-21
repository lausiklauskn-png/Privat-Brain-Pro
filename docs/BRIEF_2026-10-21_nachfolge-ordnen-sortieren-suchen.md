# Brief für die Nachfolgesitzung: „Ordnen, Sortieren, Suchen“ weiterbauen (2026-10-21)

**Art der Sitzung: weiterbauen.** Der Plan ist von Klaus freigegeben („Ja.“, 2026-10-21).
Er hat zusätzlich gesagt: Kommentare auf GitHub müssen nicht beobachtet werden („es meldet
sich sowieso keiner“). CI-Ergebnisse selbst nachsehen; der Freibrief zum Zusammenführen gilt
bei grünen relevanten Prüfungen (CLAUDE.md, „Pro-App: Stand 2026-10-19“).

## Pflichtlektüre

1. `CLAUDE.md` (oben die neuesten Stände).
2. [Plan mit Klaus' Entscheidungen](PLAN_2026-10-21_ordnen-sortieren-suchen.md)
3. [Alle Konten und Absender (Grundlage + A1)](ALLE-KONTEN-UND-ABSENDER.md)
4. [Aufräumen nach Ablaufdatum (A2)](AUFRAEUMEN-NEWSLETTER.md)
5. Der ursprüngliche Brief der Plansitzung liegt auf Zweig `ccr-1b365b80-fw60yy` (PR #47,
   Benutzerhandbuch), nicht auf main.

## Stand

| Abschnitt | Stand |
|---|---|
| Grundlage: alle Konten, 12 Monate, automatisch, Überschreiben statt Doppeln | gebaut, CI grün (inkl. native-smoke) |
| A1: Bündel nach Absender, ↕, Wortsuche über alle Konten | gebaut, CI grün |
| A2: Newsletter nach Ablaufdatum, Papierkorb + Rückgängig, Ist Werbung/wichtig | gebaut, lokal grün; CI siehe PR #48 |
| A3: Dateien neueste oben/umkehrbar, Inhaltssuche; „Alle Konten“-Mails nicht im Explorer | gebaut, lokal grün |
| Flache Knöpfe (Klaus 2026-10-21) im Postfach, Alle Konten, Explorer-↕ | gebaut; Regel oben in CLAUDE.md |
| A4: Kategorien per Vorschlag (Rechnungen, Gehalt, Gesundheit, Verträge, Versicherung) | offen |
| A5: Übergabe aus Workflow PDF Pro über Android-Teilen (`ACTION_SEND`, nur PDF) | offen, Sendeseite baut Codex |
| A6: Bedeutungssuche nur in Mails | offen, wartet auf Modell im APK |
| Kapitel im Benutzerhandbuch (PR #47) für Grundlage, A1, A2 | offen (anderer Zweig) |
| Vorschau-Version mit diesem Stand | offen: Versionsnummer + Release macht Codex oder Klaus |

PR #48 (`ccr-a5329481-bs8emi`) enthält Plan, Grundlage, A1 und A2. Ist er beim Lesen noch
offen und die CI grün, zusammenführen; sonst zuerst die CI reparieren.

## Wo was liegt

- Nativ: `MailIndex.java` (Kopf + Text, keine Android-Klassen), `MailEngine.index/indexText/locate`,
  `ProMailPlugin` (`index`, `indexText`, `locate`), Ordner melden `collection`.
- Brücke: `native/native-mail.js` prüft die Antworten von `index`, `indexText`, `locate`.
- Logik und Ansicht: `native/native-mail-index.js` (Abruf, Überschreiben, Bündel, Suche,
  Doppelte, Aufräumen), `native/native-mail-expiry.js` (Datum lesen, rein).
- „Beim Anbieter öffnen“: `PBLiveMail.openRemote` in `assets/live-mail.js`; der Eintrag
  „👥 Alle Konten“ steht über `drawFolders()` am Anfang der Ordnerleiste.
- Proben: `tools/native/test-mail-expiry.mjs` (rein), `tools/native/test-mail-index.mjs`
  (Browser, simulierte Brücke, `PB_CAPTURE_DESIGN=1` für Bilder in `docs/design/alle-konten/`),
  `NativeMailIndexTest.java` (Emulator). Alle in `npm run test:native-web` bzw. native-smoke.
- Vorschau-Seite für Klaus mit Bildern: https://claude.ai/artifact/1L62h22wBoB9F1tfKtXqMN

## Was beim Bau gelernt wurde

- **Eine zurückgeholte Mail nie wieder automatisch verschieben** (`mailKeep`): sonst holt
  Klaus sie zurück und die Automatik legt sie beim nächsten Abruf wieder weg.
- **Eine Mail ohne `Message-ID` wird nie verschoben**, denn nur über die Kennung findet
  „Rückgängig“ sie im Papierkorb wieder.
- Eigene Zeile über dem Postfach kostet am Handy Platz: `test-compact-network` verlangt bei
  320 px mindestens 300 px für die Mail. Deshalb steht „Alle Konten“ in der Ordnerleiste.
- Hintergrundabrufe zeichnen die Ansicht neu. Messungen in Proben in **einem** `evaluate`,
  nicht über Locator plus Messung, sonst misst man abgehängte Knöpfe.
- Testdaten wirken nach: Ein Stern aus einer früheren Prüfung schützte später genau die Mail,
  die das Aufräumen verschieben sollte. Vor jedem Block den Zustand ausdrücklich setzen.
- Das Werkzeug `Write` hat `̀`-Escapes als echte Zeichen geschrieben. Funktioniert,
  ist aber unlesbar. Nach dem Schreiben mit `grep 'u0300'` prüfen.
- In dieser Umgebung: Google-Downloads (Android-SDK) sind gesperrt (403), Maven Central geht
  (mit Wiederholung bei 429). Java-Teile ohne Android-Klassen lassen sich mit JavaMail 1.6.8 aus
  Maven Central auf einem normalen JDK prüfen; den Rest prüft die CI. Kein `gh`; GitHub über
  die MCP-Werkzeuge. Diese Sitzungen dürfen keine Tags pushen und keinen Release starten.

## Nächste Schritte (Vorschlag, mit Klaus abgestimmt laut Plan)

1. PR #48 zusammenführen, sobald die CI grün ist. Codex oder Klaus um eine Vorschau bitten.
   Die Versionsnummer wird in einem eigenen kleinen PR erhöht (wie PR #46).
2. Klaus fragen, ob die flachen Knöpfe auch im übrigen App-Rahmen (Kopfleiste, Einstellungen,
   Dateien hinzufügen) gelten sollen; bisher nur Postfach, „Alle Konten“, Explorer-↕.
3. A4: Kategorien per Vorschlag, nur Ansicht, „Gehört nicht hierher“ lernt.
4. Handbuch-Kapitel in PR #47 nachtragen.
5. Am Gerät zu prüfen (Klaus): echter Erstabruf mit allen Konten, Dauer, „Beim Anbieter öffnen“,
   Papierkorb und Rückgängig bei Telekom und Google.

## Verbindlich

Klaus ist kein Programmierer, bedient meist einhändig, kann keine PRs öffnen; Vorschauen als
Link. Nichts löschen oder verschieben ohne Zustimmung und Rückweg. Speicherort und
Schutzlisten bleiben verschlüsselt im gewählten Ordner. Nie „virenfrei“ schreiben. Geschützte
Module und die PWA bleiben unverändert. Vor jeder Arbeit `git fetch` und von `origin/main`
abzweigen.
