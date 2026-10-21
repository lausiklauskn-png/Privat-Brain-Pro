# Teilen an Private Brain Pro (Klaus 2026-10-21)

## Was Klaus wollte

- *„Bright Brain sollte ja auch [in der Teilen-Liste stehen]“* — Private Brain Pro tauchte beim Teilen nicht auf,
  obwohl es installiert war.
- Auftrag: *„Übernimm du den 405-Fehler, und baue Teilen für .22 ein.“*

## Wie es jetzt ist

| | Bedienung |
|---|---|
| Teilen-Liste | In jeder App, die teilen kann (Dateien, Galerie, Mail, Workflow PDF Pro …), steht jetzt **Private Brain Pro**. |
| Was ankommt | Dateien jeder Art, auch mehrere auf einmal (bis 30). Geteilter Text ohne Datei wird eine kleine Textdatei „Geteilter Text.txt“ (mit Betreff als Name, wenn es einen gibt). |
| Was dann passiert | Die App öffnet „Dateien hinzufügen“ und liest die Dateien wie dort ein: Katalog, Signatur, Prüfung. Die Meldung „Fertig · … neu signiert“ ist dieselbe. |
| Grenzen | Wie bei „Dateien hinzufügen“ höchstens 80 MB je Datei; Mail-Exporte (`.eml`, `.mbox`) ohne diese Grenze, aber höchstens 200 MB. Zu große Dateien werden nicht übernommen, und die App sagt das. |

## Wie es gebaut ist

- `ProSharePlugin` (Android) nimmt `ACTION_SEND` und `ACTION_SEND_MULTIPLE` entgegen, beim Start und während die App
  offen ist. Gelesen werden nur `content://`-Adressen, die die sendende App freigegeben hat; `file://`-Pfade und der
  eigene Dateianbieter der App werden abgewiesen.
- `ShareInbox` legt jede Datei einmal in einen privaten Ordner im App-Cache (`shared-in`), ohne Pfade von außen,
  mit bereinigtem Namen und geprüftem Dateityp. Nach dem Einlesen wird sie gelöscht; Reste vom letzten Start auch.
- `native/native-share.js` liest die Dateien stückweise (256 KiB) und gibt sie an `signBatch`, denselben Weg wie
  „Dateien hinzufügen“. Nichts geht ins Netz.

## Grenzen

- Am Tablet nicht gemessen, auch nicht mit echten Apps wie Galerie, Mail oder Workflow PDF Pro.
- Sehr große Dateien liegen beim Einlesen kurz doppelt vor (Kopie im App-Cache und im Speicher der Seite).
- Eine geteilte Internetadresse wird als Textdatei abgelegt, nicht als Lesezeichen.

## Nachweise

- `tools/native/test-share.mjs` (8 Prüfungen, Android-Teilen gestellt): zwei Dateien kommen über den normalen
  Import an, eine Datei über einem Stück kommt vollständig an, eine Datei über 80 MB wird nicht gelesen, jede
  Datei wird danach freigegeben, die App zeigt „Dateien hinzufügen“, ein zweites Teilen bei offener App kommt an,
  eine nicht angekommene Datei wird gemeldet.
- Gegenprobe von Hand an der gebauten Kopie: ohne Freigabe, ohne Meldung, ohne 80-MB-Grenze → je gefangen.
- `ShareInboxTest` (5 JVM-Tests): Namen ohne Ordner und Steuerzeichen, Dateityp geprüft, stückweise lesen und
  löschen, zu große Datei hinterlässt nichts, fremde Kennung und negativer Versatz abgewiesen.
