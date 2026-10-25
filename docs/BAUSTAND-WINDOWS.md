# Windows 1.0.37 veröffentlicht — 2026-10-25

Quelle `015c9a1266a64f44a1896ead56349094c64e2f9a`, PR #85 übernommen. [Windows-x64-Setup](https://github.com/lausiklauskn-png/Privat-Brain-Pro/releases/download/windows-v1.0.37/Private-Brain-Pro-Windows-1.0.37-x64-setup.exe) über
die vorhandene App installieren. Kennung, Datenpfade und Passwortformat bleiben erhalten.

- [Windows-main 40222186337](https://github.com/lausiklauskn-png/Privat-Brain-Pro/actions/runs/40222186337/job/121255957350) erfolgreich: installierte Grundfunktionen, Neustart/Neuinstallation, echtes öffentliches 1.0.36-Setup → 1.0.37 mit erhaltenen Daten und abschließender normaler Produktionsstart ohne Prüfzugang.
- Originalbytes, Katalog/Tags, RU-/Dunkelwahl, Offlinezustand, PBV1-Katalog, DPAPI-Merken und Passwortentsperren nach Kaltstart sind in der tatsächlichen Updateprobe bestätigt. Zwischen alter und neuer App wurden die synthetischen Daten nicht gelöscht.
- Release [40224745892](https://github.com/lausiklauskn-png/Privat-Brain-Pro/actions/runs/40224745892) erfolgreich: Prüfung `121263625158`, Veröffentlichung `121263688060`. Der abgenommene Installer wurde unverändert veröffentlicht.
- Öffentlicher Download unabhängig geprüft: 58.666.944 Bytes, SHA-256 `8452d322b2ebbbc8ef9de11ab548a61f0e129d94503354812db1abdc4ca4b71a`. API-Digests, veröffentlichte Prüfsummen, Tag/Quelle und Bauquittung stimmen; alle 24 ursprünglichen/erzeugten Java-Fingerabdrücke und fünf Abhängigkeiten gegen Quelle geprüft.
- Windows x64, NSIS pro Benutzer, weiterhin unsigniert, kein Prüfendpunkt. Der lokale Byteprüfer führt das Setup nicht aus und extrahiert nicht dessen UI; die Prerender-Bauverdrahtung wurde gegen die Quelle geprüft. Tatsächliche Installation lief im Windows-CI-Runner.

[Windows-Nachweis](design/umbau-2026-10-24/windows-1.0.37-pruefung.json).
Klaus' eigener Windows-PC und physisches Samsung DeX wurden damit nicht geprüft.

---

# Historisch: Windows 1.0.36 veröffentlicht — 2026-10-25

Quelle `a1bd98f40b0186c5a9a148dbd04d19979e6262c4`, PR #82 übernommen. [Windows-x64-Setup](https://github.com/lausiklauskn-png/Privat-Brain-Pro/releases/download/windows-v1.0.36/Private-Brain-Pro-Windows-1.0.36-x64-setup.exe)
über die vorhandene Installation installieren; Kennung `de.familyprojekt.privatebrain.pro`,
Installationsziel pro Benutzer, Datenpfade und Passwortformat bleiben erhalten.

- [Windows-main 40195090159](https://github.com/lausiklauskn-png/Privat-Brain-Pro/actions/runs/40195090159/job/121174098778) erfolgreich: Grundfunktionen, Neustart/Neuinstallation, echte Produktionsüberinstallation .29 → 1.0.36 und abschließende normale Installation ohne Prüfzugang.
- Die Updateprobe bestätigt vollständige Originalbytes, Katalog/Tags, RU-/Dunkel-Einstellung, Offlinezustand, PBV1-Katalogsicherung, DPAPI-Merken und Passwort-Entsperren nach Kaltstart. Zwischen alter und neuer Installation wurden die Testdaten nicht zurückgesetzt.
- Release [40196030462](https://github.com/lausiklauskn-png/Privat-Brain-Pro/actions/runs/40196030462) erfolgreich: Prüfung `121176929493`, Veröffentlichung `121177007769`. Der bereits abgenommene Installer wird unverändert veröffentlicht.
- Öffentlicher Download unabhängig geprüft: **58.666.597 Bytes**, SHA-256 `138bf5e8b4635e12bd87c70148c54539684c36fc130b7693913c8e4397bde091`. API-Asset-Digests, veröffentlichte Prüfsummen, Tag/Quelle und Bauquittung stimmen.
- Alle 24 ursprünglichen und erzeugten Java-Fingerabdrücke sowie fünf Abhängigkeiten gegen denselben Quellstand geprüft. Ausdrückliche Plattformadapter werden als solche geprüft und nicht fälschlich als bytegleich behauptet.
- Windows x64, NSIS pro Benutzer, `signing=unsigned`, `testEndpoint=false`. Keine Authenticode-Signatur behauptet; die lokale Byteprüfung führt den Installer nicht aus. Die tatsächliche Installation lief auf dem GitHub-Windows-Runner.

Klaus' eigener Windows-Rechner, gesprochenes Diktat und physisches Samsung DeX
gehören nicht zu diesen Nachweisen. [Maschinenlesbarer Nachweis](design/umbau-2026-10-24/windows-1.0.36-pruefung.json).

---

# Historischer Windows-Bau von Private Brain Pro

Stand: 2026-10-23. Klaus hat die erneute Prüfung der veröffentlichten V28,
Fehlerkorrekturen und eine zusätzliche native Windows-Version beauftragt.
iOS bleibt für später zurückgestellt. Klaus hat jetzt ausdrücklich die Übernahme
von #69 und die Windows-Veröffentlichung für ein Geschenkpaket beauftragt.
Die vollständige Windows-Abnahme 39885843960 und Android-Abnahme 39885843963
sind auf `079433d` grün; vor Veröffentlichung werden sie auf main erneut verlangt.
Die Veröffentlichung ist inzwischen abgeschlossen:
[`windows-v1.0.0-preview.29`](https://github.com/lausiklauskn-png/Privat-Brain-Pro/releases/tag/windows-v1.0.0-preview.29),
Quelle `7e6fbfd821c6c105661ff638045f6b41e1ffb75b`, Release 39920396303 grün.
Windows-main 39918739441 und Android-main 39918739332 vollständig grün.
Installer: 48.562.317 Bytes, SHA-256
`55d5728a4623e079ac0303442c6ff94fe77c35621f1c935c0342d1cfeab52e97`.
Der öffentliche Download wurde unabhängig erneut geladen und geprüft.
Feste Downloadpfade und Übergabe: [Geschenkpaket](GESCHENKPAKET-WINDOWS.md).

## V28 und gemeinsame Korrekturen

Ausgangspunkt: `v1.0.0-preview.28`, Quelle
`8dae28113f7fa19a4446406f492e0c307c4ef0cb`. APK unabhängig geladen:
7.446.584 Bytes, SHA-256
`a8a4de0e884c2849257b8c10895d9c2dd9199d6b453bc24a588c6b92d424a647`.
ZIP, veröffentlichte Prüfsumme, Metadaten und APK-v2-Signatur bestätigt.
Unveränderter Signierer:
`362ee70d28da9c4b51e37057c3519a3e6eb2c679059dfb9f56b4003f9374fa80`.
Paket `de.familyprojekt.privatebrain.pro.preview`, VersionCode 28.

[Entwurf #67](https://github.com/lausiklauskn-png/Privat-Brain-Pro/pull/67)
behebt verfrühte IndexedDB-Erfolgsmeldungen, verschluckte Importfehler,
vorzeitig markierte Katalogwiederherstellung und beschädigte Sicherungen.
Die vollständige Android-/Web-CI auf `f009aab` ist grün
([39867480481](https://github.com/lausiklauskn-png/Privat-Brain-Pro/actions/runs/39867480481)).
Der anschließende Dateinamen-Fix `36e043c` ist ebenfalls vollständig geprüft:
NFC, vollständige Unicode-Zeichen, erhaltene Dateiendungen, portable Längen.
Die ursprünglichen MIME-/Übergabe-Regeln scheiterten an den neuen Gegenproben.

Klaus' Menübefund ist korrigiert: nur ein lizenzierter Pinnwand-Zugang.
„Werkzeuge freischalten“ zeigt einzelne Zeilen mit ganzen Namen und Schloss,
ohne zusätzliches sichtbares „gesperrt“. 62 reale Browserfälle bestanden,
einschließlich vier Sprachen und 320/360/1280/2560 Pixeln.
Screenshots: `docs/design/werkzeuge/`. Im reinen PWA-Repo Privat-Brain existiert
dieser Freischaltkasten nicht; er gehört zur gemeinsamen Pro-Oberfläche.

## Architektur und vorhandener Code

[Entwurf #69](https://github.com/lausiklauskn-png/Privat-Brain-Pro/pull/69),
Branch `codex/windows-native-host`, auf dem Android-Korrekturzweig aufgebaut.
Tauri 2, WebView2, NSIS pro Benutzer, unsigniert. Dieselbe lokale Pro-Oberfläche
und dieselben 22 geschützten Module, weiterhin bytegleich.

Der Bau übernimmt 24 Android-Quellabschnitte, davon 14 bytegleich. Mail-, MIME-,
Outbox-, Schutzlisten-, Modell- und PBV1-Algorithmen werden nicht unabhängig
nachgebaut. Explizite Plattformadapter ersetzen Android-Dateizugriff,
HTML-Textextraktion, Geräteablage und Browserlinks. SHA-256 von Quelle und
Bauergebnis steht in `windows/engine/build/shared-source.json`.

Die Modell-Dateien werden über `https://pbmodel.localhost/models/` direkt aus
lokalen, geprüften Dateien gestreamt. Es gibt dafür keinen Server oder neuen
Netzwerkdienst. Der eigene Ursprung verhindert, dass Tauri/Wrys asynchroner
App-Datei-Responder die Modellantwort mit `index.html` überschreibt. Dieses
Verhalten ist mit HTTP-Status, Inhaltstyp und SHA-256 im installierten Programm
belegt: Bibliothek und WASM stimmten, die frühere Modelladresse lieferte HTML.
Die reinen Routingregeln werden weiterhin aus Androids `BundledLibrary` übernommen.

Eine private Java-21-Laufzeit wird mitgeliefert; beim Empfänger ist keine
Java-Installation nötig. Windows-DPAPI schützt Gerätegeheimnisse. Der portable
Ordner verwendet weiterhin das gemeinsame PBV1-Format und das Benutzerpasswort.
Kein stiller Reset, kein Ersatz verlorener Schlüssel. Originale werden geprüft
kopiert; Quelldateien bleiben erhalten. Native Zugangsdaten werden in einem
getrennten Fenster eingegeben. IPC verlangt eine private Sitzungsberechtigung;
Werkzeuge besitzen einen eigenen Origin ohne diese Berechtigung.

| Vertrag | Implementierung und verbleibender Nachweis |
|---|---|
| ProDevice | Windows und beim Bau abgeleitete tatsächliche Version |
| ProFiles | Originale, Blöcke, Prüfsummen, Export, Öffnen mit, Ersatzschlüssel; PDF je Dokument in eigenem begrenztem Prozess |
| ProFolders | ausdrückliche Ordnerwahl, persistente Ablage, begrenztes rekursives Lesen, geprüfte zusätzliche Kopien |
| ProVault | gemeinsames PBV1, eigener Passwortdialog, DPAPI-Merken, Migration, Mail-/Katalog-/Originalsicherung |
| ProMail | gemeinsamer direkter TLS-Kern, Ordner/Aktionen/Entwürfe/Index, Originale/Anhänge, native Kontoeingabe; Vorlagen aus Android |
| ProLinks | registrierte Mail-Links und ausdrückliche Übergabe an den Systembrowser |
| ProNetwork | eigene native Verbindungen abbrechen; WebView2-Filter einschließlich Worker; offene Browsertransporte in Hauptseite und Frames schließen |
| ProProtect | gemeinsamer Schutzkern, verschlüsselte Schlüssel/Listen; ausdrücklicher Defender-Scan einer geprüften Exportkopie |
| ProSemantic | gemeinsame Pins, Laden/Abbruch/Fortsetzen, Hashprüfung, lokale Modell-/Bibliotheksantworten; reale Offline-Abnahme bestanden |
| ProSpeech | lokale Windows-SAPI-Schnittstelle, eigenes Aufnahmefenster und Abbruch; fehlende Sprache/Mikrofon wird ausdrücklich gemeldet |
| ProShare | Öffnen mit, Zweitstart und geprüfte Importwarteschlange; kein registriertes Windows-Teilen-Ziel behauptet |
| ProUpdates | eigener `windows-v…`-Kanal, fester Repository-/Installerpfad, manueller Browserdownload; kein APK und kein stiller Installer |

Gmail nutzt den bestätigten Desktop-OAuth-Client (`windows/gmail-desktop.json`,
ausschließlich öffentliche ID), PKCE S256 und einen zufälligen Loopback-Rückruf
im Standardbrowser. Empfänger melden sich mit ihrem eigenen Google-Konto an;
sie brauchen normalerweise keinen eigenen OAuth-Client. Live-Google-Anmeldung,
Testnutzer-/Verifizierungsstand und reale Anbieterzugänge sind nicht geprüft.
Microsoft bleibt wie in V28 eine ausdrücklich benannte, noch nicht eingerichtete
Anbindung. Es werden keine Konten oder kostenpflichtigen Zertifikate angelegt.

## Tatsächliche Prüfbelege

90 lokale Kernfälle auf echten Dateien bestanden, mit ausdrücklich benanntem
Testprovider für OS-Verschlüsselung. Darunter PBV1 zwischen getrennten Geräten,
Schreib-/Schutzfehler, falsches Passwort, beschädigte Sicherungen, ein zeitweise
verschwundener Speicherort ohne Reset, Unicode-Dateien, Exportkollisionen,
Loopback-PKCE, Token-Erneuerung, Sockets und echte TLS-IMAP-/SMTP-Protokolle.
Die TLS-Testserver stammen aus Androids Instrumentierung; nur die temporäre
Testzertifikat-Ablage wird angepasst. Kein Produktionsschlüssel wird erzeugt.
Ein SMTP-Verbindungsabbruch nach DATA bleibt auch nach erneutem Öffnen unklar
und wird nicht automatisch erneut gesendet. Bcc erscheint nicht im Versandtext.

Acht reale Browserverbindungsfälle auf Hauptseite und fremdem Frame bestanden.
Die Windows-API-Signaturen für SAPI und Defender wurden für das Windows-Ziel
kompiliert. Androids gemeinsame UI-Gegenproben bleiben grün: Werkzeuge 62,
Tresor 34, Schutz 34, Spracheingabe 11; diese simulieren die Android-Plugins und
beweisen keine echte Mikrofonaufnahme.

Windows-Runner: NSIS-Bau und Installation vorhanden. Der Fehler beim Start des
Kerns im installierten Verzeichnis wurde behoben. Im installierten Programm
bestanden Geräteangaben, private IPC-Sperre, realer Import/Readback, Passwortdialog,
verschlüsselter Ordner, Katalog, PDF-Prozess, Offline-Zustand und Werkzeug-Origin
([Lauf 39877532392](https://github.com/lausiklauskn-png/Privat-Brain-Pro/actions/runs/39877532392)).
Dieser Lauf ist insgesamt rot: die Spracheingabe-Gegenprobe traf auf ein sofort
schließendes „nicht verfügbar“-Fenster. Der Test wurde korrigiert; die vollständige
Kette wird erneut ausgeführt. **Keinen fertigen Installer aus diesem Lauf anbieten.**

Werkzeugübergabe, Freigabeentzug, Kontovorlagen, Dateiexport, Ersatzschlüsseldatei
und native Schutzschlüssel haben inzwischen im installierten Programm bestanden.
Die Ereignisbezeichnung für Zweitstart-Dateien wurde an den gemeinsamen
`shared`-Vertrag angeglichen; der echte Kindprozesstest scheiterte zuvor daran.

Die korrigierte Modellauslieferung ist im installierten WebView2 nachgewiesen
([39882927441](https://github.com/lausiklauskn-png/Privat-Brain-Pro/actions/runs/39882927441)):
Bibliothek, WASM und Modellkonfiguration tragen die erwarteten SHA-256-Werte;
e5 läuft offline mit 384 Dimensionen und ordnet die Zahnarztrechnung näher als
den Wetterbericht ein. Ein absichtlich beendeter Renderer wird wieder geöffnet;
der gespeicherte Schutz verhindert den automatischen Modell-Neustart. Zweitstart
mit echtem Unicode-Dateipfad ist ebenfalls bestanden. 91 Kernfälle liefen unter
Windows einschließlich echter NTFS-Verknüpfung; 90 unter Linux.
Der dort gemeldete Seitenfehler war eine zu früh angewandte Windows-Übersetzung;
die Reihenfolge ist korrigiert und in allen vier Sprachen geprüft.
[39884701359](https://github.com/lausiklauskn-png/Privat-Brain-Pro/actions/runs/39884701359)
besteht die gesamte installierte Funktions-, Offline-Modell-, Rendererabbruch-,
Neustart-/DPAPI-/Neuinstallationskette ohne unbehandelte Seitenfehler. Der separate
Produktionsbau startet mit bereitem Kern ohne Debugzugang. Dessen abschließende
Deinstallationsprobe sah bislang nur auf das Ende des NSIS-Startprozesses;
sie wartet jetzt begrenzt auf die tatsächlich entfernten Dateien und Registrierung.
Der vollständige Lauf einschließlich dieses Abschlusses muss grün sein.

Gemeinsamer Dateiimport: Während eines laufenden Imports eintreffende Dateien
bleiben in der nativen Warteschlange. Die Gegenprobe scheiterte am alten Stand;
jetzt bestehen zwölf Fälle, darunter ein während des Lesens gestarteter Import.
Diese Korrektur liegt ebenfalls im Android-Audit-PR #67.

Die endgültige Abnahme auf `079433d` ist vollständig bestanden:
[Windows 39885843960](https://github.com/lausiklauskn-png/Privat-Brain-Pro/actions/runs/39885843960)
und [Android 39885843963](https://github.com/lausiklauskn-png/Privat-Brain-Pro/actions/runs/39885843963).
48 installierte Windows-Prüfungen ohne unbehandelte Seitenfehler; der gesonderte
Produktionsbau ohne Prüfzugang wurde installiert, gestartet und deinstalliert.
Programmdateien/Registrierung entfernt, Nutzerdaten erhalten. Android: 51 native
Fälle ohne Fehler oder Überspringen. #67 separat auf `fbc7f2d` vollständig grün
([39885734482](https://github.com/lausiklauskn-png/Privat-Brain-Pro/actions/runs/39885734482)).
Für die Veröffentlichung werden beide main-Ketten erneut ausgeführt und der
dort abgenommene Installer unverändert mit Prüfsummen übernommen.
Eine gesprochene Aufnahme und Klaus' eigener Windows-PC sind nicht gemessen.
Defender verwendet die Windows-Einstellungen; eine mögliche Cloud-Prüfung wird
vor der Übergabe benannt. „Virenfrei“ wird nicht behauptet.

## Veröffentlichung

Gemeinsamer Quellstand für die Abnahme: `1.0.0-preview.29`, Android-Code 29.
Windows .29 ist veröffentlicht; Android .28 wurde nicht überschrieben.
Release nur von geprüftem main, nach ausdrücklicher Freigabe, mit ursprünglicher
Android-Signieridentität, Prüfsummen und unabhängigem Downloadvergleich.

Historisch hat die automatische Freigabeprüfung eine main-Übernahme des PWA-PRs #123 im
Nachbarrepo abgelehnt: Die Auditfreigabe umfasst keinen ausdrücklichen
Produktionsmerge. Das wird nicht umgangen. Alle konkreten Ergebnisse zuerst
fertigstellen; main-Übernahmen und Veröffentlichungen anschließend gesammelt
mit Klaus freigeben. Die nötige Freigabe für den Windows-Gesamtstand #69 liegt
jetzt vor. Andere PWA-/Android-Veröffentlichungen sind davon nicht umfasst.
Keine iOS-Arbeiten und kein Private-Brain-iOS-Nachfolgebrief.
