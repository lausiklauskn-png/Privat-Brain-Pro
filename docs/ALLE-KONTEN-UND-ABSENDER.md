# Alle Konten, Absender-Bündel und Postfach-Suche (2026-10-21)

Bauabschnitt **Grundlage + A1** aus dem
[Plan „Ordnen, Sortieren, Suchen“](PLAN_2026-10-21_ordnen-sortieren-suchen.md), von Klaus
am 2026-10-21 freigegeben („Ja.“). Noch **nicht** in einer veröffentlichten Vorschau;
die nächste Vorschau macht Codex oder Klaus.

## Was Klaus sieht und wo er tippt

1. **✉️ Mail** öffnen. In der Ordnerleiste steht ganz vorn **👥 Alle Konten** (vor dem
   Posteingang). **← Zurück zum Postfach** führt zurück.
2. Beim ersten Mal: **📥 Alle Konten abrufen und einordnen**. Die Zeile darunter zeigt,
   welches Konto und welcher Ordner gerade dran ist und wie viele Mails schon eingeordnet sind.
   **⏹ Anhalten** hält an; der nächste Abruf macht dort weiter.
3. Danach geht es **von selbst**: beim Öffnen der App und alle 30 Minuten, solange die App
   offen ist und ihr Internetschalter an ist. Später heißt der Knopf **📥 Jetzt aktualisieren**.
4. **👤 Nach Absender** (Standard): je Absender eine Zeile mit Anzahl und Datum der neuesten
   Mail; 📰 kennzeichnet Absender mit Newsletter-Kennzeichen. Ein Tipp öffnet das Bündel,
   neueste Mail oben. **↕** dreht die Reihenfolge um. **📋 Liste** zeigt alle Mails nach Datum.
5. **In allen Mails suchen**: Wortsuche über Betreff, Absender und Text aller Konten.
   Alle eingegebenen Wörter müssen vorkommen; Groß-/Kleinschreibung und Umlaute zählen nicht
   („gultig“ findet „gültig“).
6. Eine Mail antippen zeigt ihren Text und die Konten, in denen sie liegt.
   **Beim Anbieter öffnen** öffnet genau diese Mail im gewohnten Postfach, mit Anhängen,
   Prüfbericht, Antworten und Weiterleiten.
7. **Weitere Aktionen → Ältere nachholen** holt weitere 12 Monate dazu.
8. **🧹 Doppelte**: Mails, die doppelt sein *könnten*, stehen dort im Kasten
   „✉️ Mails, die doppelt sein könnten“ mit **Gleich – zusammenlegen** oder
   **Verschieden – beide behalten**.

## Keine Doppelungen

- Erkannt wird eine Mail an ihrer Kennung im Mailkopf (`Message-ID`). Ist sie schon da, wird
  ihr Eintrag **überschrieben**: Betreff, Absender, Datum, gelesen/Stern vom Server, Text.
  **Erhalten bleiben** Klaus' eigene Angaben: Stern im Katalog, Schlagwörter, Kategorie,
  lokale Ordner und Originale.
- Dieselbe Mail in zwei Konten oder zwei Ordnern ist **ein** Eintrag, der beide Fundorte kennt.
- Eine Mail, die früher mit „Nachricht katalogisieren“ ohne Kennung abgelegt wurde
  (gleicher Absender, gleicher Betreff, Zeit bis 2 Minuten auseinander), wird übernommen
  statt kopiert und bleibt in der lokalen Ansicht sichtbar.
- **Unsicher** (keine Kennung, gleicher Absender und Betreff innerhalb eines Tages, anderer
  Text): nichts wird überschrieben; beide stehen in „Doppelte“, Klaus entscheidet.

## Was nicht passiert (Grenzen)

- **Nur lesen.** Auf dem Server wird nichts verschoben, gelöscht, als gelesen markiert
  (IMAP `peek`) oder gesendet. Aufräumen und Papierkorb kommen erst mit Abschnitt A2.
- **Anhänge werden nie geladen**, nur vermerkt („📎 Anhang beim Anbieter“).
  Textteile über 512 KB werden übersprungen; gespeichert werden höchstens 8.000 Zeichen Text
  je Mail. Die Suche findet nur, was in diesen Zeichen steht.
- Gelesen werden Posteingang, Archiv und eigene Ordner. **Nicht** gelesen: Papierkorb, Spam,
  Entwürfe, Gesendet sowie Gmail-Sammelansichten („Alle Nachrichten“, „Markiert“, „Wichtig“),
  weil sie dieselben Mails noch einmal enthalten.
- Der Zeitraum gilt ab dem **Eingangsdatum beim Anbieter** (IMAP `SINCE`, tagesgenau).
- „Alle 30 Minuten“ gilt nur, solange die App offen ist; Android kann eine App im
  Hintergrund anhalten. Ohne App-Internet wartet der Abruf und sagt das.
- Ein Konto, das nicht erreichbar ist, wird übersprungen und genannt; die anderen laufen weiter.
- Der Abruf und das gewohnte Postfach teilen sich einen nativen Arbeitsstrang. Während eines
  großen Erstabrufs kann das Öffnen einer Mail daher einige Sekunden warten.
- Wird ein eingeordneter Eintrag im Katalog gelöscht, kommt er beim nächsten Abruf wieder,
  solange die Mail beim Anbieter liegt. Wirklich löschen kommt mit A2 (Papierkorb + Rückgängig).
- Der Katalog liegt wie bisher in der App und wird bei eingerichtetem Speicherort automatisch
  verschlüsselt im gewählten Ordner gesichert (`native-vault.js`, `idbPut`-Wächter).
  Mailtexte gehen dabei nie an eine KI oder einen fremden Dienst.
- Absender werden nach Adresse gebündelt. Schreibt eine Firma von zwei Adressen, sind es
  zwei Bündel.
- Die Bedeutungssuche nur in Mails kommt mit A6, sobald das Modell im APK ist.
- Nicht gemessen: echte Konten, Klaus' Tablet, sehr große Postfächer (Tausende Mails).

## Technik

| Teil | Datei |
|---|---|
| Kopfzeilen und Text lesen, Anhänge überspringen (ohne Android-Klassen) | `android/.../MailIndex.java` |
| `index` (Kopfzeilen seit Datum, 100 je Seite) · `indexText` (Text für höchstens 10 Mails) · `collection` an Ordnern | `MailEngine.java`, `ProMailPlugin.java` |
| Antworten der Brücke prüfen | `native/native-mail.js` (`index`, `indexText`) |
| Abruf, Überschreiben, Bündel, Suche, Doppelte | `native/native-mail-index.js` |
| „Beim Anbieter öffnen“ | `assets/live-mail.js` (`PBLiveMail.openRemote`) |
| Lokale Ansicht ohne Index-Einträge | `assets/mail-workspace.js` (`allMails`) |

Stand je Ordner (UIDVALIDITY und „vollständig gelesen bis“) steht unter einem gehashten
Schlüssel in `localStorage`; Kontozugangsdaten und Mailinhalte stehen dort nicht.

## Prüfung

- `node tools/native/test-mail-index.mjs` (Teil von `npm run test:native-web`):
  **35 grün** am 2026-10-21, simulierte Brücke mit zwei Konten. Zwei Seiten Posteingang,
  dieselbe Mail in zwei Konten, alter Katalogeintrag, HTML-Mail mit Skript und fremdem Bild,
  unsicherer Zwilling, erneuter Abruf mit eigenem Stern, App-Internet aus, „Beim Anbieter
  öffnen“, Englisch, 360 px Breite.
- Gegenprobe von Hand in einer Wegwerfkopie von `www/native-mail-index.js`, sieben Eingriffe:
  Kennung ignoriert, Papierkorb/Spam mitgelesen, ↕ wirkungslos, Überschreiben löscht den
  Stern, Zwilling nicht gemeldet, jeder Lauf liest alles neu: **gefangen**.
  „Skripttext landet im Mailtext“ rutschte zuerst **durch**: die Probe prüfte nur auf `<`.
  Sie prüft jetzt auch den Skripttext; danach **gefangen**.
- Die vollständige Reihe `npm run test:native-web` lief danach grün (13 Proben), ebenso
  `tools/e2e-mail-workspace.mjs` (42) und `tools/e2e-live-mail.mjs` (26).
  Ein erster Entwurf mit eigener Knopfzeile über dem Postfach machte
  `test-compact-network` rot (bei 320 px blieben keine 300 px für die Mail). Deshalb steht
  der Eintrag jetzt in der Ordnerleiste; danach wieder grün.
- Ein Lauf der neuen Probe brach einmal ab, während gleichzeitig die ganze Reihe lief.
  Die Ursache ist nicht belegt. Danach 5 Läufe hintereinander und 3 Läufe mit Bildaufnahme grün.
- Bilder (Handy, 390 px, simulierte Daten): `docs/design/alle-konten/`
  (`PB_CAPTURE_DESIGN=1 node tools/native/test-mail-index.mjs`).
- Android-Test `NativeMailIndexTest` (4 Fälle: Newsletter-Kopf, ungewöhnliche Kennungen,
  Anhang übersprungen, große Textteile nicht geladen) läuft in `native-smoke` der CI.
  Dieselben Regeln hier zusätzlich auf einem normalen Java mit JavaMail 1.6.8 geprüft:
  16 Prüfungen grün. Das Android-SDK ließ sich in dieser Sitzung nicht laden
  (Google-Downloads gesperrt, HTTP 403); die vollständige Übersetzung prüft die CI.
- Der Test-IMAP-Server der Android-Tests kann nur Anmelden. `SEARCH`/`FETCH` gegen einen
  echten Server sind deshalb **nicht** automatisch geprüft, sondern erst am Gerät.
