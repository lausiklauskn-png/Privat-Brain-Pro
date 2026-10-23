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
- **Windows-Fassung von Private Brain Pro veröffentlicht** (in der App „1.0.29“). Codex' PR #69 auf `main`
  (`7e6fbfd821c6c105661ff638045f6b41e1ffb75b`), beide main-Ketten grün (Windows 39918739441, Android 39918739332).
  `windows-release.yml` Lauf 39920396303 auf Klaus' Auftrag (`docs/GESCHENKPAKET-WINDOWS.md`): Tag
  `windows-v1.0.0-preview.29`, [Setup.exe](https://github.com/lausiklauskn-png/Privat-Brain-Pro/releases/download/windows-v1.0.0-preview.29/Private-Brain-Pro-Windows-1.0.0-preview.29-x64-setup.exe)
  48.562.317 Bytes, SHA-256 `55d5728a4623e079ac0303442c6ff94fe77c35621f1c935c0342d1cfeab52e97`. Unabhängig geladen:
  `SHA256SUMS` alle OK; `windows-build.json` Version, Installer, x64, unsigned, `testEndpoint` false und sha256 passen.
  Kein neuer Android-Release. Am Windows-PC nicht gemessen.
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
| Private Brain Pro | 1.0.28, [APK](https://github.com/lausiklauskn-png/Privat-Brain-Pro/releases/download/v1.0.0-preview.28/Private-Brain-Pro-1.0.0-preview.28.apk) | 1.0.29, [Setup.exe](https://github.com/lausiklauskn-png/Privat-Brain-Pro/releases/download/windows-v1.0.0-preview.29/Private-Brain-Pro-Windows-1.0.0-preview.29-x64-setup.exe) |
| Workflow PDF Pro | 1.0.3, [APK](https://github.com/lausiklauskn-png/Workflow-PDF-Pro/releases/download/v1.0.3/Workflow-PDF-Pro-1.0.3.apk) | 1.0.3, [Setup.exe](https://github.com/lausiklauskn-png/Workflow-PDF-Pro/releases/download/windows-v1.0.3/Workflow-PDF-Pro-Windows-1.0.3-Setup.exe) |

- Darunter Hinweise: Play Protect kurz pausieren (Android), SmartScreen „Weitere Informationen“ → „Trotzdem ausführen“
  (Windows), Daten bleiben auf dem Gerät. Die PWAs (Private Brain, Workflow PDF) und iOS sind auf Klaus' Wunsch nicht mehr
  in der Box. Eine Spalte, am Handy stapeln sich Knopf und Zeile (ab 440 px), Hell und Dunkel.

### Filme in der Box (Klaus 2026-10-23: „alle drei Links zu den Videos“)

Abschnitt „Filme über die Apps“ mit drei Kacheln, jede öffnet die Family-Projekt-Videoseite
(`https://lausiklauskn-png.github.io/Family-Projekt.de-Video/abspielen.html?id=<kennung>`):
`private-brain-pro-film` (neu, siehe unten), `workfloh-pdf-erklaervideo-quer`, `workfloh-pdf-versteckte-befehle`.

### Pflege

Bei neuen Versionen beider Apps Versionsnummer und Link in `docs/geschenk/geschenk-jens.html` nachziehen, mit dem
Artifact-Werkzeug auf dieselbe Adresse veröffentlichen (`url` = XPEQpCH7axafiTRB7y1RB7) und den Download vorher einmal
unabhängig laden und gegen die veröffentlichten Prüfsummen prüfen. Kein Link auf Actions-Artefakte.

## Nicht tun

- Releases nur auf Klaus' ausdrückliche Bitte (die Windows-Veröffentlichung 1.0.29 hatte er über `docs/GESCHENKPAKET-WINDOWS.md` beauftragt).
- `PB_SIGNING_UNLOCK`/`WF_PDF_SIGNING_UNLOCK` neu erzeugen; ein Google-Projekt oder einen weiteren Client anlegen.
- „von Google/Microsoft geprüft“ oder „virenfrei“ schreiben.
