# 🤖 KI beim Schreiben einer Mail (Klaus 2026-10-21, für .23)

## Was Klaus wollte

- *„Ich verfasse eine E-Mail in Private Brain Pro und danach möchte ich diese E-Mail gegenlesen lassen auf
  Rechtschreibfehler von einer KI … oder Text von KI vorgeben lassen über einen API-Key … oder Direktlink über mein Abo.“*
- *„Dazu muss eine Anonymisierung stattfinden … aus der gesendeten und der wiederverwendeten E-Mail und der neu
  geschriebenen E-Mail.“*
- *„Texte, die nicht deutlich erkannt werden können, … genau definiert werden. Zum Beispiel Namen, die ich dann einfüge.“*

## Befund vorher

Den Bereich „Was die KI sieht“ gab es nur beim **Lesen** im lokalen Postfach (`assets/mail-workspace.js`). Beim
**Verfassen** und **Antworten** im Postfach mit echten Konten (`assets/live-mail.js`) gab es keinen KI-Weg.

## Wie es jetzt ist

Im Schreiben-Fenster steht **🤖 KI** (`native/native-mail-ai.js`). Es öffnet:

| | |
|---|---|
| Gegenlesen | Rechtschreibung, Grammatik, Zeichensetzung; Inhalt, Ton und Zitat bleiben. |
| Entwurf schreiben lassen | Kurz sagen, was in die Mail soll. Ist eine alte Mail zitiert, schreibt die KI eine Antwort darauf. |
| Das sieht die KI | Der verdeckte Text, genau so, wie er hinausgeht. |
| Mit Mistral (EU) senden | Mit dem Schlüssel aus den Einstellungen; vorher eine Rückfrage mit der Zahl der verdeckten Angaben. |
| Verdeckten Text kopieren | Für das eigene Abo (ChatGPT, Le Chat …): Auftrag und verdeckter Text in die Zwischenablage, die Antwort zurück ins Feld einfügen. |
| In die Mail übernehmen | Die Platzhalter werden wieder durch die echten Angaben ersetzt; **Rückgängig** stellt die Mail wieder her. |

**Verdeckt wird** (Modul 25, byte-1:1, dazu der App-Teil):
- neuer Text, zitierte oder weitergeleitete Mail und Betreff;
- E-Mail-Adressen, Telefonnummern, IBAN, Beträge, Rechnungsnummern, Daten, Schlüssel (Modul 25);
- Telefonnummern mit Leerzeichen oder Schrägstrich („0171 1234567“, „+49 30 / 123456“), die Modul 25 nicht erkennt;
- Namen aus An, Cc und Bcc, aus „Am … schrieb …“- und „Von:/An:“-Zeilen im Zitat, und „Max Muster“, wenn eine
  Adresse wie `max.muster@…` vorkommt;
- **was Klaus selbst festlegt:** eine Liste „Diese Wörter zusätzlich verdecken“, Vorschläge zum Antippen (Namen nach
  „Herr/Frau“, in Begrüßung und Grußformel) und **„Markierten Text verdecken“** für etwas, das in der Mail markiert ist.

**Bevor etwas hinausgeht:** Kein Klartext aus der Zuordnung darf mehr im verdeckten Text stehen, sonst wird nichts
gesendet. Steht im Text eine Anweisung an eine KI (etwa in einer zitierten fremden Mail), hält die App einmal an
(`KiReinigung`, wie bei der Datei-KI). Anhänge gehen nie an die KI. Die Zuordnung Platzhalter → Klartext bleibt im Gerät.

## Grenzen

- Was kein festes Muster hat (Straße, Ort, „die Chefin in Kiel“), bleibt stehen, bis es in der Liste steht oder markiert wird.
  Deshalb zeigt die App immer, was die KI sieht.
- Die Liste gilt für die offene Mail; sie wird nicht gespeichert.
- Direkt geht nur Mistral (EU). Andere KIs über „Kopieren“ und „Einfügen“.
- Die KI kann einen Platzhalter verändern oder weglassen; dann bleibt er im Text stehen. Vor dem Senden lesen.
- Echte KI und Tablet nicht gemessen.

## Nachweise

- `tools/native/test-mail-ai.mjs` (18 Prüfungen, Mistral gestellt): Knopf, Verdeckung von Namen aus An und Zitat,
  Adresse, IBAN, Telefon, Betreff; Straße und Ort bleiben bis zum Festlegen; Vorschlag antippen, eigenes Wort,
  markierter Text; ohne Schlüssel keine Anfrage; genau eine Anfrage ohne echte Angaben; Rückweg mit echten Angaben,
  Betreff, Rückgängig; Kopieren verdeckt; Anweisung an eine KI im Zitat hält an, Abbrechen sendet nichts.
- Gegenprobe von Hand an der gebauten Kopie: ohne Namen aus den Feldern, ohne Halt bei KI-Anweisung, ohne Rückweg,
  ohne Telefon-Ergänzung → je gefangen.
