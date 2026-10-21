# Mikrofon, Internet-Lampe, Dateiwahl (Klaus 2026-10-21)

## Was Klaus gemeldet hat

- *„In der nativen App für Private Pro ist das Mikrofon nicht verfügbar.“*
- *„Datei auswählen ist zweimal da. Jetzt weiß niemand, wo soll ich klicken.“* (Fenster „Original erneut auswählen“)
- *„Der Button App vom Internet trennen soll separat oben sein oder zumindest eine kleine Lampe haben … rot oder grün …
  wenn ich mit der Maus drauf gehe, soll da stehen … App vom Internet trennen … In den Einstellungen darf es bleiben.“*
- *„Beim Teilen kann ich nicht Workflow PDF anklicken … 405 Not Allowed.“*

## Wie es jetzt ist

| | Bedienung |
|---|---|
| 🎤 in der Suche | Die Android-WebView kennt keine Spracheingabe des Browsers. 🎤 öffnet jetzt das **Sprach-Fenster von Android** (`ProSpeechPlugin`, `native/native-speech.js`). Das Gesagte steht danach im Suchfeld, und die Suche läuft. Während Android zuhört, zeigt der Knopf 🔴. Abbrechen lässt das Suchfeld, wie es war. Sprache wie die App (DE/EN/RU/PL). |
| Internet-Lampe | Ein kleiner Punkt oben in der Kopfleiste, vor ← → ☰. **Grün:** die App darf ins Internet. **Rot:** die App ist getrennt. Tippen schaltet um. Mit der Maus darüber steht, was ein Tippen tut: „App vom Internet trennen“ oder „Internetzugriff wieder erlauben“. Der Schalter im App-Menü ☰ bleibt und zeigt immer dasselbe. |
| „Original erneut auswählen“ | nur noch **ein** Knopf „Datei auswählen“. Das unsichtbare Dateifeld wurde vom Dialog-Stil sichtbar gemacht und stand als zweiter Knopf da. |

## Grenzen

- **Das Sprach-Fenster gehört Android**, meist der Google-App. Die App bekommt nur den erkannten Text, sie nimmt
  selbst nichts auf und braucht keine Mikrofon-Erlaubnis. Ob die Erkennung ohne Internet geht, entscheidet Android
  (Offline-Sprachpaket). Ist die App getrennt, bittet sie Android, offline zu erkennen. Ein Zwang ist das nicht: der
  Sprachdienst ist eine eigene App und hält sich nicht an den Internetschalter von Private Brain Pro.
- Ohne eingerichtete Spracherkennung sagt die App das: „Auf diesem Gerät ist keine Spracherkennung eingerichtet.“
- Die 🎤-Knöpfe im **Mycel-Fenster** gehören zum Kanon (`23_rendezvous_ui.js`, byte-1:1) und bleiben, wie sie sind.
- **Siegel-Startplatz:** Die Lampe macht die rechte Gruppe 18 px breiter. Das Siegel startet deshalb 152 px statt 128 px
  vom rechten Rand. Wer .20 hat und das Siegel nie bewegt hat, dessen Siegel rückt mit; eine selbst gewählte Lage bleibt.
- **405 beim Teilen an Workflow PDF / Workflow PDF Pro** liegt in der **Empfänger-App**, nicht in Private Brain Pro.
  „405 Not Allowed“ ist die Antwort von GitHub Pages auf ein POST: das Teilen schickt die Datei per POST an die
  Teilen-Adresse von Workflow PDF, und dort fängt sie offenbar kein Service Worker ab. Diese Sitzung hat keinen
  Zugriff auf die Workflow-PDF-Repos; der Auftrag steht im [Codex-Brief](BRIEF_2026-10-21_codex-weiterarbeit.md).
- Am Tablet nicht gemessen; das echte Sprach-Fenster wurde nicht bedient.

## Nachweise

- `tools/native/test-speech.mjs` (7 Prüfungen, Android-Sprachfenster gestellt).
- `tools/native/test-compact-network.mjs`: Lampe grün mit Hinweis, Hover-Text, Tippen → rot, rot nach Neustart,
  Menü-Schalter → wieder grün.
- `tools/native/test-mycel.mjs`: Siegel frei von Titel und Lampe (360–1280 px), Startplatz aus .20 rückt mit.
- `tools/native/test-originals.mjs`: genau ein „Datei auswählen“, Dateifeld unsichtbar.
