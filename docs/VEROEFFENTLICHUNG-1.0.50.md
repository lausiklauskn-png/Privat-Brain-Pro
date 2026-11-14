# Private Brain Pro 1.0.50 veröffentlicht (Android und Windows)

Klaus' Freibrief vom 13. November 2026 („selbstständig veröffentlichen“), Auftrag 14.11.: Versionsnummer soll nur das Update laden,
nicht zusätzlich die Einstellungen öffnen. Quelle main `349ba60babcdd51c5539a20b394844a9ce534893` (PR #139, Inhalt #138).

- [Android-Update](https://github.com/lausiklauskn-png/Privat-Brain-Pro/releases/download/v1.0.50/Private-Brain-Pro-1.0.50.apk):
  61.112.679 Bytes, SHA-256 `4e307d3afc133ae3bdd30b7560395b2324e2f48361d431a56eec020279bef193`. Über die vorhandene App installieren.
- [Windows-Setup](https://github.com/lausiklauskn-png/Privat-Brain-Pro/releases/download/windows-v1.0.50/Private-Brain-Pro-Windows-1.0.50-x64-setup.exe):
  101.398.377 Bytes, SHA-256 `a26e7a6b6cd01827add536ff8d8599cddcecdbe8f7e330c762688232353a448f` (unsigniert wie bisher).

## Nachweise

- Main-CI auf `349ba60`: Android und Web 43569950157, Windows 43569950203 (Updateprobe 1.0.41 → 1.0.50), Signierung, Pages – grün.
- Im PR war die Windows-Updateprobe zuerst rot: sie erwartete noch Code 49 (beim Hochzählen übersehen), behoben in `c8a2503`.
- Android-Veröffentlichung 43572330443 (`channel=public`, Tag `v1.0.50`, signiertes Update) erfolgreich.
- Windows-Veröffentlichung 43572327943 erfolgreich (erster Start 43571070552 brach ab, weil die Android-Prüfung auf main noch lief).
- Beide Dateien anonym geladen; SHA-256 gleich `SHA256SUMS` am jeweiligen Release.

Nicht geprüft: Tablet, Windows-PC, direktes Laden über die Versionsnummer gegen den echten Release. Diese Version nicht erneut auslösen.
