# Private Brain Pro 1.0.51 veröffentlicht (Android und Windows)

Klaus' Wort 15.11.2026: „Bitte herausgeben.“ Inhalt: Suche mit Sortier-Kern, eigene Kategorien, Einstellungen nach Themen,
Tresor-Hilfe, SBKIM statt Mycel, Mail öffnet auch ohne erreichbaren Speicherort (PR #142,
`BRIEF_ABSCHLUSS_2026-11-15_SUCHE-SORTIERKERN-TRESORHILFE.md`). Quelle main `aad58a8e697dcae7a8c820a1842a39172324bb30`.

- [Android-Update](https://github.com/lausiklauskn-png/Privat-Brain-Pro/releases/download/v1.0.51/Private-Brain-Pro-1.0.51.apk):
  61.467.072 Bytes, SHA-256 `454f6141a22ec9c67f38f71c7a600af70acf7587d4f8395864f7d382898e4c24`, Code 51. Über die vorhandene App installieren.
- [Windows-Setup](https://github.com/lausiklauskn-png/Privat-Brain-Pro/releases/download/windows-v1.0.51/Private-Brain-Pro-Windows-1.0.51-x64-setup.exe):
  101.779.309 Bytes, SHA-256 `20cdd0fd32737e1c7471c6db65400b304098f0e2e5f87459f56146e17d06a574` (unsigniert wie bisher).

## Nachweise

- PR #142 auf `7d930c3`: alle 15 Prüfungen grün (Android/Web, native-smoke, Android-Update-Probe, Windows, Firefox, WebKit, Signierung).
- Main-CI auf `aad58a8`: Android und Web 43749148221, Windows 43749148196 (Updateprobe 1.0.41 → 1.0.51), Signierung 43749148215, Pages 43749148202 – grün.
- Android-Veröffentlichung 43751018477 (`channel=public`, Tag `v1.0.51`, signiertes Update) erfolgreich.
- Windows-Veröffentlichung 43751021115 erfolgreich (übernimmt den in der main-Abnahme geprüften Installer).
- Beide Dateien anonym geladen; SHA-256 gleich `SHA256SUMS` am jeweiligen Release. In der APK bytegleich mit main geprüft:
  `assets/einstellungen-themen.js`, `assets/such-frage.js`, `native-tresor-hilfe.js`.

Nicht geprüft: Tablet, Windows-PC, Themen-Knöpfe und Tresor-Hilfe am Gerät. Diese Version nicht erneut auslösen; nächste Fassung 1.0.52.
