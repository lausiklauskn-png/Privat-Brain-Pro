# Brief für die nächste Sitzung: Private Brain Pro für Windows (2026-10-22)

**Auftrag von Klaus (2026-10-22):** „Wenn du mit 27 fertig bist, mach bitte einen Nachfolgebrief für die nächste
Sitzung für den Bau der Windows-Version.“ Gebaut wird **in diesem Repo** (Privat-Brain-Pro) von einer neuen
Claude-Code-Sitzung. Workflow PDF Pro hat den Weg schon gemacht (Tauri 2, unsignierte Setup.exe, veröffentlicht
als `windows-v1.0.3`). Daran orientieren, nicht blind kopieren.

Klaus ist kein Programmierer, bedient meist einhändig am Handy, hat keinen eigenen Windows-Bau-PC und kann keine
PRs öffnen. Ergebnisse bekommt er als **Link**. Antworten an ihn auf Deutsch, kurze einfache Sätze.

## 1. Zuerst lesen

1. `CLAUDE.md` (Anker oben, dann „Was hier leicht kaputtgeht“, „Pro-App: Stand 2026-10-19“).
2. `docs/ANDROID.md`, `docs/NATIVE-MAIL-ARCHITEKTUR.md`, `docs/SPEICHERORT-UND-TRESOR.md`,
   `docs/TRESOR-ERSATZSCHLUESSEL.md`, `docs/SCHUTZ-VIREN-SPAM-BETRUG.md`, `docs/BEDEUTUNGSSUCHE-UND-LADEBALKEN.md`,
   `docs/WERKZEUGE-UND-FREISCHALTUNG.md`, `docs/ORIGINALE-LINKS-GMAIL.md`, `docs/MAIL-ANBIETER.md`.
3. `docs/SIGNIERUNG-UND-GITHUB.md` und `docs/VEROEFFENTLICHEN.md` (Release nur per `workflow_dispatch` auf Klaus'
   ausdrückliche Bitte, Prüfsummen, unabhängiger Download).
4. **Vorbild im Nachbar-Repo** `lausiklauskn-png/Workflow-PDF-Pro` (mit `add_repo` lesend holen):
   `BRIEF_NACHFOLGE_2026-10-21_WINDOWS.md`, `BRIEF_ABSCHLUSS_2026-10-22_WINDOWS.md`,
   `docs/portierung/BAUSTAND-WINDOWS.md`, `windows/` (Tauri-Host, `windows/bridge/capacitor-tauri.js`,
   `windows/core` in Rust, NSIS-Installer), `.github/workflows/windows-app.yml` und `windows-release.yml`.

## 2. Ausgangsstand (geprüft am 2026-10-22)

- Android **0.1.0-preview.27** (VersionCode 27) ist der aktuelle Stand; Paket `de.familyprojekt.privatebrain.pro`,
  Vorschau-Signatur nur in Actions (`PB_SIGNING_UNLOCK`, nie neu erzeugen, Klaus' Ersatzkopie liegt in seinem
  Termux-Tresor `pbpro-freigabe-neu.age`).
- Windows hat **noch keinen Code**: kein Host, keine Workflows, kein Installer. Für Windows gibt es heute nur die
  PWA Private Brain (`https://lausiklauskn-png.github.io/Privat-Brain/`) im Browser.
- Die Weboberfläche entsteht mit `tools/native/prepare-web.mjs` nach `www/` (Capacitor 8.5.3, Ursprung
  `https://localhost`, CSP als Meta, kein Service Worker in der App). Die Gerätefunktionen hängen in `native/*.js`
  an **12 Capacitor-Plugins** in `android/app/src/main/java/de/familyprojekt/privatebrain/pro/`.
- Geschützte Module (`modules/01,02,03,04,05,05b,23,noble-secp256k1`, Modul 25, die Prüfer, `reinigung.js`,
  `installieren.js`, 16/17/23-UI) bleiben byte-1:1. Drift-Guard muss grün bleiben.

## 3. Entscheidung, die schon gefallen ist (Klaus bei Workflow PDF Pro, gilt sinngemäß)

- Host **Tauri 2** mit WebView2. Electron nur als Rückfall, wenn eine Messung zeigt, dass WebView2 etwas nicht trägt;
  dann Klaus fragen, nicht still wechseln.
- Installer **NSIS-Setup.exe**, pro Benutzer, ohne Administratorrechte, **unsigniert**. Kein kostenpflichtiges
  Signierkonto, kein selbstsigniertes Zertifikat. Updates zunächst manuell (neue Setup.exe darüber installieren).
- Klaus nach dem Plan fragen, ob das für Private Brain Pro genauso gelten soll (Plan-vor-Code). Empfehlung: ja.

## 4. Was Windows nachbauen muss (Plugin für Plugin)

Ziel ist derselbe Funktionsumfang wie Android .27. Was unter Windows nicht geht, steht als **benannte Grenze** im
Baustand, nicht still weggelassen. Die Brücke (wie `capacitor-tauri.js`) stellt dieselbe Plugin-Schnittstelle bereit,
damit `native/*.js` **unverändert** laufen.

| Android-Plugin | Aufgabe | Windows-Weg (Vorschlag) |
|---|---|---|
| `ProMail` (+ `MailEngine`, `MailIndex`, `MailOutbox`, `EncryptedMailStore`, `Unsubscribe`) | IMAP/SMTP direkt vom Gerät, Ordner, Sammel-Aktionen, Index aller Konten, Abmelden | Rust (`async-imap`/`lettre` o. ä.) im Host; dieselben Routen und Fehlerarten (`MailFailure`). **Unklaren SMTP-Ausgang nie automatisch wiederholen.** Passwörter nur im eigenen Fenster, Ablage über DPAPI |
| Gmail (`GmailAuthorization`, `GmailTokenCache` …) | OAuth + XOAUTH2 | Android nutzt Google Play Services. Unter Windows braucht es einen **OAuth-Client vom Typ „Desktop“** mit Loopback-Rückruf (PKCE). Den legt Klaus in seinem vorhandenen Google-Cloud-Projekt an; **keine Geheimnisse im Chat**, kein neues Projekt |
| `ProVault` (+ `Vault`, `VaultCrypto`) | Speicherort mit Passwort, Format PBV1, Anhänge bis 1 GiB gestreamt, Katalogsicherung | Ordnerwahl (Rechner, USB, SD); **gleiches Format PBV1**, Gegenprobe Android ⟷ Windows wie in Workflow PDF Pro (`windows/core/compat`). Passwort nur im nativen Fenster |
| `ProFiles`, `ProFolders` (+ `OriginalFileStore`, `PdfPreviewStore`, `FolderStore`) | Originalkopien, Ordner einlesen, Öffnen mit anderer App, PDF-Vorschau | Systemdialoge, Kopie mit Prüfsummenvergleich, Standard-App über Shell; keine beliebigen Pfade aus der Seite |
| `ProShare` (+ `ShareInbox`) | Teilen an die App | NSIS kennt kein Teilen-Ziel; „Öffnen mit“ über `OpenWithProgids` und Zweitstart (eine Instanz) wie Workflow PDF Pro. Teilen-Ziel nur mit MSIX: als Grenze nennen |
| `ProSpeech` | 🎤 über Androids Sprachfenster | WebView2 hat keine verlässliche Spracherkennung. Prüfen: `Windows.Media.SpeechRecognition` (offline-Sprachpakete) oder als Grenze nennen. **Messen, nicht annehmen** |
| `ProLinks` | Links im Standardbrowser | Shell-Open, nur `https:`/`mailto:` |
| `ProNetwork` (+ `AppNetwork`, `AppSocketFactory`) | App-Internetschalter, Lampe | im Host alle eigenen Verbindungen sperren; WebView2-Anfragen über `WebResourceRequested` begrenzen |
| `ProProtect` (+ `Protection`, `ProtectionList`) | Listen abuse.ch, VirusTotal-Fingerabdruck, Übergabe an Scanner | Listen verschlüsselt im Speicherort `Schutzlisten/`; Übergabe an den Windows-Defender-Scan (`MpCmdRun -Scan -ScanType 3 -File`) prüfen. **Nie „virenfrei“ schreiben** |
| `ProSemantic` (+ `SemanticModel`, `BundledLibrary`) | e5-Modell ~155 MB auf Schalter laden, SHA-256 je Datei | gleicher Ablauf, Ablage unter `%LOCALAPPDATA%`; Modul 03 bleibt byte-1:1 |
| `ProUpdates` (+ `UpdatePolicy`) | Versionsprüfung auf Knopfdruck | Windows-Release-Tag `windows-vX` abfragen, Link zur Setup.exe; kein stiller Installer |
| `ProDevice` | Geräteangaben | Plattform „Windows“ melden (die Updateseite zeigt die Plattform) |
| Freischalt-Codes, Werkzeuge | `native/native-license.js`, `native-tools.js` | laufen im WebView unverändert; Studio-Schlüssel bleibt im `localStorage` des Geräts |

Dazu: Kennung `de.familyprojekt.privatebrain.pro` (eigene feste Windows-Kennung), Arbeitsdaten unter
`%LOCALAPPDATA%\de.familyprojekt.privatebrain.pro`, Hauptfenster `https://tauri.localhost`; Datenbank-Schublade
`privatbrain` nicht ändern. Version 0.1.0-preview.N passend zu Android, Windows-Tag `windows-v0.1.0-preview.N`.

## 5. Prüfen und veröffentlichen (auf GitHub, nicht lokal)

- Workflow mit `runs-on: windows-latest`: bauen, still installieren, starten, Grundfälle gegen WebView2
  (Dateien hinzufügen mit Prüfung, Explorer, Suche, Speicherort anlegen/sperren/öffnen, Katalogsicherung,
  Mail mit gestelltem IMAP/SMTP wie `tools/native/test-mail-device.mjs`), Neustart, Deinstallation, Neuinstallation
  mit Datenerhalt. Linux-Teil: `cargo test` und die PBV1-Gegenprobe.
- Release nur auf Klaus' Bitte per `workflow_dispatch` von einem geprüften `main`-Commit; Setup.exe plus SHA-256;
  danach **unabhängig herunterladen** und vergleichen.
- Der Windows-Runner ist **kein** echter Rechner von Klaus: „Am Windows-PC nicht gemessen“, bis er es bestätigt.

## 6. Danach

- Link für Klaus: direkter Download der Setup.exe plus Hinweis SmartScreen („Weitere Informationen“ →
  „Trotzdem ausführen“).
- Geschenkseite „Alle meine Apps“ (Claude-Artefakt aus der .27-Sitzung, Link in Klaus' Unterhaltung) bekommt bei
  Private Brain Pro unter „Windows“ den Download statt „kommt bald“. Updateseite
  `https://claude.ai/artifact/DY4mXc3ymT4iENCXyzFp6C` um eine Windows-Kachel ergänzen.
- `CLAUDE.md`-Anker, Baustand `docs/BAUSTAND-WINDOWS.md`, `README.md` nachziehen.

## Nicht tun

- Android-Dateien, Paketkennung oder Signieridentität ändern; `PB_SIGNING_UNLOCK` ersetzen.
- Geschützte Module abwandeln; die PWA im Repo Privat-Brain anfassen.
- Ein Konto, ein Zertifikat oder einen Schlüssel ungefragt anlegen; Geheimnisse in Git, Logs oder Chat.
- „Von Microsoft geprüft“ oder „virenfrei“ schreiben.
