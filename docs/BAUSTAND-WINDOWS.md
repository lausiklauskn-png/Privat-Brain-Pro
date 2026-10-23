# Windows-Bau von Private Brain Pro

Stand: 2026-10-23. Klaus hat die erneute Prüfung der veröffentlichten V28,
Fehlerkorrekturen und eine zusätzliche native Windows-Version beauftragt.
iOS bleibt für später zurückgestellt. Dieser Baustand ist keine Freigabe eines
fertigen Windows-Produkts.

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
Der anschließende Dateinamen-Fix `36e043c` wird gesondert erneut geprüft:
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

Der Bau übernimmt 23 Android-Quellabschnitte, davon 14 bytegleich. Mail-, MIME-,
Outbox-, Schutzlisten-, Modell- und PBV1-Algorithmen werden nicht unabhängig
nachgebaut. Explizite Plattformadapter ersetzen Android-Dateizugriff,
HTML-Textextraktion, Geräteablage und Browserlinks. SHA-256 von Quelle und
Bauergebnis steht in `windows/engine/build/shared-source.json`.

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
| ProSemantic | gemeinsame Pins, Laden/Abbruch/Fortsetzen, Hashprüfung, lokale Modell-/Bibliotheksantworten; reale Offline-Abnahme läuft |
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

85 lokale Kernfälle auf echten Dateien bestanden, mit ausdrücklich benanntem
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

Noch abzuschließen: installierte Werkzeugübergabe/Freigabeentzug, reales Modell
mit Offline-Bedeutungssuche, vollständige Neustart-/DPAPI-/Neuinstallationskette,
abschließender Produktionsbau ohne Prüfzugang, Prüfsummen und Freigabe.
Eine gesprochene Aufnahme und Klaus' eigener Windows-PC sind nicht gemessen.
Defender verwendet die Windows-Einstellungen; eine mögliche Cloud-Prüfung wird
vor der Übergabe benannt. „Virenfrei“ wird nicht behauptet.

## Veröffentlichung

Vorgesehene gemeinsame Folgelinie: `1.0.0-preview.29`; Android ist noch unverändert
auf Code 28, bis die Abnahme abgeschlossen ist. .28 wird nicht überschrieben.
Release nur von geprüftem main, nach ausdrücklicher Freigabe, mit ursprünglicher
Android-Signieridentität, Prüfsummen und unabhängigem Downloadvergleich.

Die automatische Freigabeprüfung hat eine main-Übernahme des PWA-PRs #123 im
Nachbarrepo abgelehnt: Die Auditfreigabe umfasst keinen ausdrücklichen
Produktionsmerge. Das wird nicht umgangen. Alle konkreten Ergebnisse zuerst
fertigstellen; main-Übernahmen und Veröffentlichungen anschließend gesammelt
mit Klaus freigeben. Keine iOS-Arbeiten und kein Private-Brain-iOS-Nachfolgebrief.
