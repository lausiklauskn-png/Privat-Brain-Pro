# Auftrag für die nächste Sitzung – „Alle Konten“ wie ein Postfach, V3 nachziehen, Themen aus V3

Aufgeschrieben am 22.11.2026 am Ende der Sitzung „Baum dichter / Vollbild / Ausgaben“ (Private Akte 0.9.8, Datei-Organizer 0.4.25).
Klaus' Auftrag vom 22.11., 15:36, mit zwei Bildern vom Tablet (Private Brain Pro 1.0.57). Die Bilder liegen nicht im Repo, weil darauf
echte Mails und Namen zu sehen sind. Sie sind hier nur beschrieben.

## Was Klaus will (seine Worte, gekürzt)

> „Unter E-Mail die Darstellungsweise: wenn ich unter ‚Alle Konten‘ gehe, ist eine andere Darstellungsweise als die erwünschte, wo ich in
> den drei Feldern einstellen kann: nebeneinander, übereinander, Ordner anzeigen, alle Ordner einklappen. Diese Einstellung hätte ich gerne
> und die Ansicht genau wie auf der linken Seite – Eingang, Entwürfe, Postausgang, Gesendet –, alle geordnet nach diesen Kriterien, weil ich
> das bei den einzelnen Konten aufrufen kann, also auch bei allen Konten. Und die Funktionen genauso, z. B. Spam – ich will alle Konten
> anschauen und auch einzelne entsprechend einordnen.“
>
> „Alles, was du in Private Brain V3 nachziehen kannst, ziehst du bitte in Private Brain V3 nach, weil diese App auch veröffentlicht wird
> (PWA Toolpoint, family-projekt.de). Also V3 genauso wie Private Brain Pro machen – in der jeweiligen Variante PWA, APK und Windows.“
>
> „Und du holst bitte aus V3 die Einstellung für die Themen mit hinüber in Private Brain Pro (1.0.57). Nur die, die bei Pro nicht drin sind.“

## Was die Bilder zeigen

1. **Einzelnes Konto (gewünscht):** drei Spalten. Links die Ordner mit Zahlen: Alle Konten, Posteingang, Entwürfe, Postausgang, Gesendet,
   Archiv, Spam, Papierkorb, Exportiert, „Weitere Ordner (13)“ (Ordner des Anbieters). In der Mitte die Liste mit Suchfeld, Mikrofon,
   „alle auswählen“, Papierkorb, „Als Spam“, Teilen, „Verschieben nach …“, Haken je Zeile. Rechts die geöffnete Mail mit Antworten,
   Weiterleiten, Löschen, „In Katalog“, „Nachrichtenaktionen“, „Übersetzen“, Bilder und dem Schutz-Hinweis. Oben rechts das Menü für die
   Anordnung: „Nebeneinander“, „Übereinander“, „Ordner anzeigen“, „Alle Ordner einklappen“.
2. **„Alle Konten“ (heute):** eine eigene, ganz breite Seite mit „← Zurück“, „In allen Mails suchen“, Knöpfen „Liste“, „Absender“,
   „Aufräumen“, „Neueste“, darunter z. B. ein Absender mit seinen Mails. Keine Ordnerspalte, kein Lesebereich, kein Anordnungs-Menü,
   kein „Als Spam“/„Verschieben nach …“ an der Liste.

## Aufgabe 1 – „Alle Konten“ als drittes Postfach-Konto anzeigen (Private Brain Pro)

- „Alle Konten“ zeigt dieselbe Oberfläche wie ein einzelnes Konto: Ordnerspalte (Posteingang, Entwürfe, Postausgang, Gesendet, Archiv,
  Spam, Papierkorb, Exportiert) mit zusammengezählten Zahlen aller Konten, Liste in der Mitte, Mail rechts, dasselbe Anordnungs-Menü
  (die gemerkte Wahl gilt auch hier).
- In der Liste steht bei jeder Mail, zu welchem Konto sie gehört (kleiner Hinweis, z. B. die Adresse oder eine Farbe).
- Alle Aktionen wie im einzelnen Konto: Löschen (Papierkorb des Anbieters), „Als Spam“, „Kein Spam“, Wiederherstellen, „Verschieben nach …“,
  Stern/Gelesen, Antworten/Weiterleiten (vom richtigen Konto aus), „In Katalog“, Übersetzen. Jede Aktion geht an das Konto, dem die Mail
  gehört. Sammelaktionen über mehrere Konten verteilen sich je Konto (eine Verbindung je Konto, wie `MailEngine.actions`).
- Die bisherigen Werkzeuge von „Alle Konten“ (Absender-Bündel, Aufräumen, Doppelte, Suche über alle Konten) bleiben erhalten, nur nicht
  mehr als eigene Seite – sinnvoll in die Leiste der Liste oder hinter „Nachrichtenaktionen“/„Weitere Aktionen“ legen.
- **Zuerst nachsehen:** woher die Ordner-Rolle kommt (IMAP-Sonderkennungen `\Sent`, `\Drafts`, `\Trash`, `\Junk`, `native-mail-folders.js`),
  ob der Index von „Alle Konten“ (`MailIndex`, `native/native-mail-index.js`, `ProMail.index`/`indexText`) heute nur den Posteingang
  merkt und welche Felder er je Mail hat (Konto, Ordner, UID, Message-ID). Wahrscheinlich ist es einfacher, die Ordner je Konto beim
  Öffnen live abzufragen und zusammenzuführen (wie die Einzelansicht), und den Index nur für die Suche über alle Konten zu behalten.
  Entscheidung in der Sitzung treffen und im Brief festhalten.
- Gilt für Android und Windows (gleiche Brücke, `windows/bridge/contracts.json`). Proben erweitern (`tools/native/test-mail-device.mjs`
  u. a.), Gegenprobe. Erst eine **Vorschau** (HTML-Bild) zeigen, Klaus sagt Ja, dann bauen.

## Aufgabe 2 – Themen aus V3 nach Pro

- V3 hat wählbare Themen in `assets/themes.css`/`assets/themes.js` (Knopf hinter dem Zahnrad, lädt früh im `<head>`; Probe
  `tools/native/test-themes.mjs`). Nachsehen, welche Themen dort sind, die Pro (Palette-Knopf, vier Themen seit .30) nicht hat, und **nur
  diese** in Pro ergänzen. Lesbarkeit in jedem neuen Thema messen (Kontrast-Probe, `test-design-26`); keine Emojis.

## Aufgabe 3 – V3 auf den Stand von Pro bringen (PWA, APK, Windows)

- V3 (Repo `Privat-Brain-Pro-V3`) steht laut CLAUDE.md bei 3.0.0-preview.9 (nicht veröffentlicht; zuletzt veröffentlicht preview.8 am
  26.10.). Pro ist inzwischen bei 1.0.57. Alles, was seitdem in Pro dazukam und in V3 passt, nachziehen – samt Aufgabe 1.
- V3 hat eine eigene Identität (Paket `de.familyprojekt.privatebrain.v3`, Name „Private Brain V3 Pro“, eigener Signierschlüssel
  `V3_SIGNING_UNLOCK`, eigener Update-Kanal `v3-android-…`, Pages-Bau `tools/native/prepare-pages.mjs`, Wächter
  `tools/native/test-v3-identity.mjs`). Beim Übernehmen nichts davon überschreiben. Gemeinsame Bausteine nur über die vorhandenen
  Nachzieh-Werkzeuge (`tools/native/pro-bausteine-nachziehen.mjs`, Pins), nie von Hand.
- Zuerst eine Liste machen: welche Dateien sich unterscheiden, was davon Pro-Neuerung ist und was V3-Eigenart (Design), und daraus die
  Reihenfolge. Diese Liste Klaus kurz zeigen.
- Veröffentlichen (PWA über Pages, APK, Windows) erst mit Klaus' Wort.

## Nebenbei aus dieser Sitzung

- **Update von 1.0.56 auf 1.0.57 am Tablet (22.11.):** Tipp auf das Fähnchen „Update 1.0.57“ zeigte keine Prozentzahl, das Fenster
  (Samsung-Pop-up-Ansicht) wurde grau und fror ein. Der Release und seine Prüfsumme waren in Ordnung; Klaus hat 1.0.57 danach installiert
  (zweites Bild zeigt v1.0.57). Vermutung, nicht belegt: fehlende Erlaubnis „Unbekannte Apps installieren“ – `ProUpdatesPlugin.install`
  öffnet dann aus einem Hintergrund-Faden die Einstellungsseite, die im Pop-up-Fenster dahinter aufgehen kann. Bei Gelegenheit: vor dem
  Öffnen der Einstellung eine Meldung zeigen und den Aufruf auf den UI-Faden legen; Klaus fragen, ob es im Vollbild ging.

## Startauftrag

```
Lies CLAUDE.md und BRIEF_SITZUNG_2026-11-23_ALLE-KONTEN-V3-THEMEN.md im Repo Privat-Brain-Pro.
Hol das Repo Privat-Brain-Pro-V3 dazu. Reihenfolge:
1. Aufgabe 1 („Alle Konten“ wie ein Postfach) in Private Brain Pro: erst nachsehen, dann eine Vorschau für Klaus, nach seinem Ja bauen,
   Proben, PR, zusammenführen.
2. Aufgabe 2 (nur die fehlenden Themen aus V3 nach Pro).
3. Aufgabe 3 (V3 auf den Stand von Pro, mit Aufgabe 1 und den Themen): erst die Liste der Unterschiede zeigen, dann nachziehen.
Veröffentlichen (Pro 1.0.58, V3 als PWA/APK/Windows) nur mit Klaus' Wort. Am Ende Abschlussbrief mit Startauftrag.
```
