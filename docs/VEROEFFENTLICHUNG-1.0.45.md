# Private Brain Pro 1.0.45 veröffentlicht (nur Android)

Klaus hat am 3. November 2026 neue Test-Versionen fürs Tablet freigegeben („Ja zu 1 und 2“).
Android 1.0.45 (Code 45) ist seit dem 4. November 2026 aus dem geprüften main-Stand
`7d6035f4118f2a2918f3c80b37c4c384d2a49015` verfügbar. Enthalten ist der Tresor-Plan aus PR #126
(Ersatzschlüssel nicht neben den Tresor, einheitliche Ordnerwahl, Hilfe „Wo liegt was?“).

- [Android-Update](https://github.com/lausiklauskn-png/Privat-Brain-Pro/releases/download/v1.0.45/Private-Brain-Pro-1.0.45.apk):
  61.068.501 Bytes, SHA-256 `fbed7652e094c9e57e1ee895e14bf49d5bda19593502a4e263cf996e36b8d1b7`.
  Über die vorhandene App installieren, nicht deinstallieren.
- Paketkennung `de.familyprojekt.privatebrain.pro.preview`, Originalzertifikat
  `362ee70d28da9c4b51e37057c3519a3e6eb2c679059dfb9f56b4003f9374fa80` (laut `ANDROID-IDENTITY.json`).
- Windows wurde **nicht** veröffentlicht; veröffentlicht bleibt Windows 1.0.44. Die Windows-Metadaten
  und die Windows-Updateprobe (1.0.41 → 1.0.45) sind nur nachgezogen, damit main-CI grün bleibt.

## Nachweise

- Versions-PR #127; im PR scheiterte `shared-engine` einmal am Zeitlimit des PDF-Renderers
  (`PDF_UNAVAILABLE` nach 30 s, gleicher Code auf main zuvor grün), Wiederholung grün, danach `windows` grün.
- Main-CI auf `7d6035f`: alle zehn Prüfungen grün, einschließlich `native-smoke`, `shared-engine`, `windows`.
- [Android-Veröffentlichung 41746092281](https://github.com/lausiklauskn-png/Privat-Brain-Pro/actions/runs/41746092281)
  (`channel=public`, Tag `v1.0.45`): Bau/Signierung, signierte Updateprobe (Überinstallation ohne
  Deinstallation im Emulator, Ausgangsfassung die letzte öffentliche, also 1.0.44) und Veröffentlichung erfolgreich.
  Release ist kein Prerelease und kein Entwurf.
- Öffentliche APK, `SHA256SUMS` und `ANDROID-IDENTITY.json` unabhängig anonym geladen: Größe und SHA-256
  stimmen mit `SHA256SUMS`, dem GitHub-Asset-Digest und `ANDROID-IDENTITY.json` überein; Quellcommit und
  Version passen.

Nicht geprüft: Klaus' Tablet, SD-Karte, echte Mailkonten. Diese Version nicht erneut auslösen.
