# Übergabebrief (2026-10-23): Stand der Apps und Geschenkbox für Jens

Klaus ist kein Programmierer, bedient meist einhändig am Handy und bekommt Ergebnisse als **Link**. Antworten auf
Deutsch, kurze einfache Sätze, Einzelschritte. Keine Passwörter, Tokens oder Client-Secrets im Chat oder in Git.

## Fortschrittseinträge (was seit dem Windows-Brief vom 2026-10-22 geschah)

- **Private Brain Pro .28 veröffentlicht** (in der App „v1.0.28“, Tag `v1.0.0-preview.28`, VersionCode 28, PR #66, #68).
  Inhalt und Prüfsummen: Anker in `CLAUDE.md`, Bedienung in `docs/ORDNERBAUM-PRUEFSTAND-PAPIERKORB.md` und
  `docs/WERKZEUGE-UND-FREISCHALTUNG.md`. Herausgeber-Studio öffnet sich per **langem Druck (1,5 s) auf „© 2026“** unten
  in den Einstellungen (Klaus: wie bei den anderen Studios, nicht fünfmal tippen).
- **Google-OAuth-Client „Desktop-App“ angelegt** (Klaus, 2026-10-23), Name „Private Brain Pro Windows“, im bestehenden
  Projekt „Privat Brain Pro“ (`privat-brain-pro`), neben dem Android-Client. Die **öffentliche Client-ID** hat Klaus an
  Codex gegeben; sie steht nicht in diesem Repo. Wiederfinden: <https://console.cloud.google.com/auth/clients?project=privat-brain-pro>.
  Den Clientschlüssel nie erfragen oder speichern. Google nennt Minuten bis Stunden, bis neue Einstellungen wirken.
- **Windows-Fassung von Private Brain Pro: gebaut, noch nicht veröffentlicht.** PR #69 (`codex/windows-native-host`,
  Codex, Entwurf), Version 1.0.0-preview.29, Tauri 2, unsignierte NSIS-Setup.exe. „Bau und Abnahme“ 39885843960 und
  Android-Prüfungen auf `079433d` grün. Es gibt **noch keinen Release-Tag** und damit keinen öffentlichen Download.
- **PR #67** (`codex/quality-audit-2026-10-22`, Codex) ist offen: „V28 prüfen: Speicherfehler, beschädigte Sicherungen
  und Werkzeugansicht korrigieren“. Vor dem nächsten Android-Release mit Codex abstimmen, wer was zusammenführt.
- **Workflow PDF Pro:** Android **1.0.3** (`v1.0.3`) und Windows **1.0.3** (`windows-v1.0.3`) veröffentlicht. iOS wird
  in einer anderen Sitzung gebaut.

## Geschenkbox für Jens („Ein Geschenk von Klaus“)

Klaus 2026-10-23: *„die beiden Apps, Private Brain Pro und Workflow PDF Pro rein, in allen Varianten, die wir bisher
haben, außer iOS … übersichtlich … auch für das Handyformat“*.

- Seite: <https://claude.ai/artifact/XPEQpCH7axafiTRB7y1RB7> (Claude-Artefakt, privat; teilen macht Klaus selbst über das
  Teilen-Menü der Seite). Quelle mit eingebetteten Logos: `docs/geschenk/geschenk-jens.html`.
- Inhalt (Stand 2026-10-23): Kopf „Kleines Geschenk von Klaus / Für Jens“, je App eine Karte mit Logo und je Gerät eine
  Zeile mit Knopf „Laden“:

| App | Android | Windows |
|---|---|---|
| Private Brain Pro | 1.0.28, [APK](https://github.com/lausiklauskn-png/Privat-Brain-Pro/releases/download/v1.0.0-preview.28/Private-Brain-Pro-1.0.0-preview.28.apk) | **„kommt in Kürze“**, noch kein Link |
| Workflow PDF Pro | 1.0.3, [APK](https://github.com/lausiklauskn-png/Workflow-PDF-Pro/releases/download/v1.0.3/Workflow-PDF-Pro-1.0.3.apk) | 1.0.3, [Setup.exe](https://github.com/lausiklauskn-png/Workflow-PDF-Pro/releases/download/windows-v1.0.3/Workflow-PDF-Pro-Windows-1.0.3-Setup.exe) |

- Darunter Hinweise: Play Protect kurz pausieren (Android), SmartScreen „Weitere Informationen“ → „Trotzdem ausführen“
  (Windows), Daten bleiben auf dem Gerät. Die PWAs (Private Brain, Workflow PDF) und iOS sind auf Klaus' Wunsch nicht mehr
  in der Box. Eine Spalte, am Handy stapeln sich Knopf und Zeile (ab 440 px), Hell und Dunkel.

### Nächster Schritt: Windows-Download von Private Brain Pro eintragen

1. Erst wenn Codex (oder Klaus' Auftrag) die Windows-Fassung **veröffentlicht** hat: Release-Tag und genaue Setup-Datei
   aus den Releases von `Privat-Brain-Pro` lesen, Download einmal unabhängig laden und mit der veröffentlichten Prüfsumme
   vergleichen. Kein Link auf Actions-Artefakte (die brauchen ein GitHub-Konto).
2. In `docs/geschenk/geschenk-jens.html` die Zeile „Windows … kommt in Kürze“ bei Private Brain Pro ersetzen durch eine
   Zeile wie bei Workflow PDF Pro Windows (Chip „✓ installierbar“, Version, Knopf „Laden“, Satz zur Installation pro
   Benutzer ohne Administratorrechte). Wenn danach nichts mehr „kommt in Kürze“ ist, den Chip auch aus der Legende oben
   nehmen.
3. Mit dem Artifact-Werkzeug auf dieselbe Adresse veröffentlichen (`url` = XPEQpCH7axafiTRB7y1RB7), dann Klaus den
   Link schicken. Die Updateseite <https://claude.ai/artifact/DY4mXc3ymT4iENCXyzFp6C> bekommt dieselbe Windows-Kachel.
4. Bei neuen Android-Versionen beider Apps Versionsnummer und Link in beiden Seiten nachziehen.

## Nicht tun

- PR #69 oder #67 von Codex ungefragt zusammenführen oder veröffentlichen; Releases nur auf Klaus' ausdrückliche Bitte.
- `PB_SIGNING_UNLOCK`/`WF_PDF_SIGNING_UNLOCK` neu erzeugen; ein Google-Projekt oder einen weiteren Client anlegen.
- „von Google/Microsoft geprüft“ oder „virenfrei“ schreiben.
