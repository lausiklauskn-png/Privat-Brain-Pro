# Private Brain Pro für Windows — Übergabe an Claude Code

**Windows .29 ist veröffentlicht.** PR #69 und #67 sind übernommen; Quelle
`7e6fbfd821c6c105661ff638045f6b41e1ffb75b`, Release 39920396303 erfolgreich.
Der Installer wurde öffentlich heruntergeladen und geprüft: 48.562.317 Bytes,
SHA-256 `55d5728a4623e079ac0303442c6ff94fe77c35621f1c935c0342d1cfeab52e97`.

Klaus hat am 23.10.2026 die Übernahme von PR #69 und die Veröffentlichung für
ein Geschenkpaket beauftragt. #69 enthält die gemeinsamen Fehlerkorrekturen
aus #67. Diese Übergabe ist für die Windows-Version; Android bleibt daneben
erhalten, ein neuer Android-Release wird hierdurch nicht gestartet.

## Fester Veröffentlichungsstand

- Repository: `lausiklauskn-png/Privat-Brain-Pro`
- Windows-Version: `1.0.0-preview.29` (Anzeige in der App: `1.0.29`)
- Release-Tag: `windows-v1.0.0-preview.29`
- [Release mit allen Dateien](https://github.com/lausiklauskn-png/Privat-Brain-Pro/releases/tag/windows-v1.0.0-preview.29)
- [Windows-Installer](https://github.com/lausiklauskn-png/Privat-Brain-Pro/releases/download/windows-v1.0.0-preview.29/Private-Brain-Pro-Windows-1.0.0-preview.29-x64-setup.exe)
- [SHA256SUMS](https://github.com/lausiklauskn-png/Privat-Brain-Pro/releases/download/windows-v1.0.0-preview.29/SHA256SUMS)
- [Bau- und Versionsbeleg](https://github.com/lausiklauskn-png/Privat-Brain-Pro/releases/download/windows-v1.0.0-preview.29/windows-build.json)
- [Herkunft des gemeinsamen Kerns](https://github.com/lausiklauskn-png/Privat-Brain-Pro/releases/download/windows-v1.0.0-preview.29/shared-source.json)
- [Geschenkpaket (ZIP)](https://github.com/lausiklauskn-png/Privat-Brain-Pro/releases/download/windows-v1.0.0-preview.29/Private-Brain-Pro-Windows-1.0.0-preview.29-Geschenkpaket.zip)
- [Übergabe als herunterladbare Datei](https://github.com/lausiklauskn-png/Privat-Brain-Pro/releases/download/windows-v1.0.0-preview.29/GESCHENK-WINDOWS-CLAUDE-CODE.md)
- [Prüfsummen des Geschenkpakets](https://github.com/lausiklauskn-png/Privat-Brain-Pro/releases/download/windows-v1.0.0-preview.29/GESCHENK-SHA256SUMS)

Die vier Originaldateien sind veröffentlicht. Das zusätzliche ZIP und die Übergabe
werden über den unten beschriebenen manuellen Geschenkablauf ergänzt.
Nur die Dateien dieses festen Tags verwenden; nicht den neuesten Android-Release
oder ein vorübergehendes Actions-Artefakt als Windows-Download einsetzen.

## Was zum Funktionieren mitkommt

Windows 10/11, 64 Bit (x64). Das NSIS-Setup installiert pro Benutzer und enthält
die private Java-21-Laufzeit und die App-Ressourcen. Keine separate Java-Installation
und kein Entwicklerwerkzeug sind nötig. Microsoft WebView2 wird benötigt;
fehlt die Laufzeit, lädt das Setup sie über Microsoft nach. Dann ist für die
Erstinstallation Internet nötig. Die Exe ist bewusst unsigniert; Windows kann
auf den unbekannten Herausgeber hinweisen. Keine Signatur oder Zertifizierung
im Geschenktext behaupten.

Zum Installieren die Setup.exe ausführen; zum Aktualisieren die neue Setup.exe
über die bestehende Installation installieren. Nutzerdaten gehören dem Empfänger
und bleiben bei Deinstallation erhalten. Der portable verschlüsselte Ordner nutzt
PBV1 wie Android; Ordnerpasswort und Sicherungen selbst aufbewahren.

Der Empfänger richtet eigene Postfächer und einen eigenen Speicherort ein.
Gmail verwendet den App-Desktop-Client und die Browseranmeldung; normalerweise
ist kein eigener OAuth-Client nötig. Googles Testnutzer-/Verifizierungsregeln
gelten weiterhin. Microsoft-Mail ist noch nicht eingerichtet. Zusätzliche
Werkzeuge lassen sich mit einem passenden Freischaltcode von Klaus freigeben.
Für die lokale Bedeutungssuche das Modell einmal in der App herunterladen.
Spracherkennung braucht Mikrofon und ein passendes Windows-Sprachpaket.

## Auftrag fürs Geschenkpaket

1. Den Installer und die drei Belegdateien von den festen Links herunterladen.
2. Alle Einträge aus `SHA256SUMS` prüfen. Zusätzlich müssen `version`, `installer`,
   `architecture` (`x64`), `signing` (`unsigned`) und `testEndpoint` (`false`) aus
   `windows-build.json` passen. Dessen `sha256` muss dem Installer entsprechen.
3. Den Installer unverändert ins Geschenk aufnehmen, zusammen mit einer kurzen
   Installationsanleitung und den Prüfsummen. Keine Android-APK als Windows-App
   beschriften und die Exe nicht mit einem anderen Installer umverpacken.
4. Im Geschenk nur veröffentlichte App-Dateien verwenden. Keine persönlichen
   Postfächer, Tresore, privaten Herausgeber- oder Kontoschlüssel von Klaus beilegen.
5. Downloadlinks, Versionsnummer und geprüfte SHA-256 im Geschenk festhalten.

Alternativ das fertige Geschenk-ZIP und `GESCHENK-SHA256SUMS` laden, prüfen und
unverändert ins Geschenk übernehmen. Das ZIP enthält dieselbe Setup.exe,
Anleitung, App-Lizenz, Urheberschaft und beide Herkunfts-/Baubelege.

## Geschenkdateien manuell ergänzen

Der direkte Release-Upload aus der Codex-Umgebung wird auf uploads.github.com
mit HTTP 401 abgewiesen; kein neues Konto und keine Zugangsdaten sind nötig.
Der manuelle Ablauf `.github/workflows/windows-gift-package.yml` verwendet die
vorhandene GitHub-Actions-Berechtigung und ausschließlich den veröffentlichten,
bereits abgenommenen Installer. Er baut keine App und ändert keine Originaldatei.
Tag und vollständigen Quellcommit oben angeben. Das Paket ist bytegleich
wiederholbar; vorhandene gleichnamige Dateien werden nur verglichen, nie ersetzt.
Nach dem Upload werden alle drei zusätzlichen öffentlichen Downloads verglichen.

Der Windows-Release wird aus beiden erfolgreich geprüften main-Ketten übernommen,
ohne den dort abgenommenen Installer neu zu bauen. Anschließend wird der öffentliche
Download unabhängig bytegleich verglichen. Die vorherige Abnahme auf `079433d`
bestand vollständige Windows- und Android-Prüfungen, inklusive Offline-Modell,
echtem Zweitstart, Rendererabbruch, Neustart, DPAPI und Neuinstallation.
Live-Google/Anbieterzugänge, gesprochene Aufnahme und Klaus' eigener Rechner
gehören nicht zu den automatischen Nachweisen.
