# Aufräumen: Newsletter und Werbung nach Ablaufdatum (2026-10-21)

Bauabschnitt **A2** aus dem [Plan „Ordnen, Sortieren, Suchen“](PLAN_2026-10-21_ordnen-sortieren-suchen.md).
Klaus' Vorgabe: nicht „nur den neuesten behalten“, denn Angebote überschneiden sich. Entscheidend
ist, **ob das Angebot noch gilt**. Ein länger gültiges Angebot darf nie verschwinden.
Noch **nicht** in einer veröffentlichten Vorschau.

## Was Klaus sieht und wo er tippt

1. Mail → **👥 Alle Konten** → **🧹 Aufräumen**.
2. Oben steht je Absender mit abgelaufenen Angeboten **eine** Frage, zum Beispiel
   „ALDI SÜD: 2 abgelaufene Angebote. Künftig abgelaufene Angebote dieses Absenders selbst in
   den Papierkorb legen?“
   - **Ja, künftig selbst**: legt die abgelaufenen sofort in den Papierkorb des Anbieters und
     macht das nach jedem Abruf wieder (🤖 räumt selbst auf).
   - **Nein, ich lösche selbst**: die Frage kommt nicht wieder; nichts geschieht von selbst.
3. Darunter drei Listen:
   - **⌛ Abgelaufen** mit **Alle abgelaufenen in den Papierkorb** (eine Rückfrage).
   - **❓ Zum Prüfen (kein eindeutiges Datum)** mit **🗑 In den Papierkorb** je Mail. Hier
     landen auch reine Werbung ohne Datum und geschützte Mails.
   - **✅ Läuft noch** mit „gültig bis …“.
4. Nach jedem Verschieben steht oben **🗑 … in den Papierkorb gelegt · Rückgängig**.
   Unten in **↩ Zuletzt in den Papierkorb gelegt** stehen die letzten zehn Durchgänge, jeder mit
   **Rückgängig** (auch die automatischen).
5. In jeder Mail: **📰 Ist Werbung** (Absender kommt ins Aufräumen, auch ohne
   Newsletter-Kennzeichen) und **⭐ Ist wichtig** (Absender kommt nie ins Aufräumen).
   Beides gilt für alle Mails des Absenders, auch für künftige. Ein zweiter Tipp hebt es auf.
6. **🗑 In den Papierkorb** gibt es auch in jeder einzelnen Mail.

## Wie das Datum gelesen wird (`native/native-mail-expiry.js`)

- Nur Daten neben Signalwörtern zählen: „gültig bis“, „bis (zum)“, „nur noch bis“, „endet am“,
  „läuft bis“, „vom … bis …“, „20.10. – 26.10.“, „Aktionszeitraum“, „valid until“, „until“,
  „ends“, „expires“, „KW 43“/„Kalenderwoche 43“ (bis Sonntag dieser Woche).
- Formen: 26.10. · 26.10.26 · 26.10.2026 · 26. Oktober (2026) · October 26, 2026.
- Ohne Jahr gilt das Jahr der Mail; liegt das Datum mehr als 60 Tage vor der Mail, das nächste Jahr.
- Mehrere Angebote in einer Mail: **das späteste Ende zählt**.
- Unklar ist, was nicht sicher ist: kein Signalwort („Bestellung vom 19.10.“), nur ein Wochentag
  („nur bis Sonntag“), unmögliches Datum, ein Ende mehr als 7 Tage vor oder mehr als 400 Tage
  nach der Mail. Unklar heißt immer **„Zum Prüfen“**, nie automatisch.
- Abgelaufen ist ein Angebot erst **einen Tag nach** dem letzten Gültigkeitstag.

## Was nie von selbst in den Papierkorb kommt

- Mails ohne Freigabe des Absenders (Frage noch offen oder „Nein“).
- Mails ohne eindeutiges Datum.
- Mails mit Stern (beim Anbieter oder im Katalog) und Absender mit **⭐ Ist wichtig**.
- Mails ohne Kennung im Mailkopf (`Message-ID`): ohne sie gäbe es keinen sicheren Rückweg.
  Sie werden auch von Hand nicht verschoben.
- Mails, die schon einmal zurückgeholt wurden, ob über **Rückgängig** oder von Klaus selbst
  beim Anbieter. Von Hand bleibt Löschen möglich.
- Nichts wird endgültig gelöscht. Kein Abmelden vom Newsletter.

## Rückweg und Grenzen

- „Löschen“ heißt: **in den Papierkorb des Anbieters** (über `MOVE`). Erlaubt der Anbieter kein
  sicheres Verschieben, passiert nichts und die App nennt den Grund.
- **Rückgängig** sucht die Mail im Papierkorb an ihrer Kennung (`locate`, nur lesen) und
  verschiebt sie in ihren alten Ordner zurück. Hat der Anbieter den Papierkorb geleert,
  meldet die App „nicht mehr im Papierkorb“. Viele Anbieter leeren ihn nach etwa 30 Tagen.
- Eine Mail in zwei Konten wird in beiden Konten verschoben und in beiden zurückgeholt.
- Gibt es beim Anbieter keinen erkennbaren Papierkorb, wird nichts verschoben.
- Freigaben und Markierungen stehen an den Mail-Einträgen im Katalog. Er wird bei eingerichtetem
  Speicherort verschlüsselt im gewählten Ordner gesichert. Ein Eintrag im Papierkorb bleibt im
  Katalog, damit Freigabe und Rückweg erhalten bleiben; er wird nur nicht mehr angezeigt.
- Wörter wie „bis“ sind breit. Ein Lieferdatum („Lieferung bis 24.10.“) kann als Ende gelesen
  werden. Deshalb gilt immer das späteste Datum, und automatisch läuft nur mit Freigabe.
- Text in Bildern (Werbegrafik ohne Text) wird nicht gelesen → „Zum Prüfen“.
- Die Erkennung über Bedeutung kommt erst mit A6 (Modell im APK).
- Nicht gemessen: echte Anbieter (`MOVE`, Papierkorb-Namen, `SEARCH HEADER`), Klaus' Tablet.

## Prüfung (2026-10-21)

- `node tools/native/test-mail-expiry.mjs`: **24 grün** (Datumsformen, Überschneidung,
  Jahreswechsel, KW, Puffertag, unklare Fälle).
- `node tools/native/test-mail-index.mjs`: **55 grün**, davon 21 für das Aufräumen.
  Nichts wird ohne Entscheidung verschoben. Mit „Ja“ wird genau die abgelaufene Mail verschoben,
  laufendes Angebot und Stern-Mail bleiben. „Rückgängig“ holt sie über die Kennung zurück, ohne
  Kopie, und sie wird danach nicht wieder verschoben. Mit Freigabe wird nach dem Abruf
  automatisch aufgeräumt. Weiter geprüft: Rückholen beim Anbieter, „Ist wichtig“, „Ist Werbung“,
  Anbieter ohne `MOVE` und Mails ohne Kennung.
- Gegenprobe in Wegwerfkopien, 13 Eingriffe; am Ende 12 **gefangen**, der dreizehnte
  (Scrollposition) war kein Fehler, siehe unten. Dabei gefunden:
  - Zwei Fehler im Code:
    - Nach „Rückgängig“ verschob die Automatik dieselbe Mail sofort wieder.
    - Eine beim Anbieter zurückgeholte Mail wurde beim nächsten Abruf erneut verschoben.
    - Beides behoben (`mailKeep`).
  - Zwei blinde Prüfungen:
    - „Ist wichtig“ las die Liste, während eine Mail offen war.
    - „Einzelnes Datum“ nutzte ein Datum, das schon aus anderem Grund verworfen wird.
    - Beide sind verschärft.
  - Ein vermuteter Fehler war keiner: Die Scrollposition blieb auch ohne Ergänzung erhalten.
    Die Ergänzung ist wieder entfernt, die Prüfung bleibt als Wächter.
- Die Messung „Knöpfe groß genug“ wackelte einmal: Ein Hintergrundabruf zeichnete zwischen
  Finden und Messen neu. Sie misst jetzt in einem Schritt; danach 12 Läufe grün.
- Android: `locate` neu in `MailEngine`/`ProMailPlugin`; hier gegen JavaMail übersetzt.
  Der Test-IMAP-Server kann kein `SEARCH`, daher erst am Gerät oder in der CI-Übersetzung geprüft.
