# Private Brain Pro 1.0.52 veröffentlicht (Android und Windows)

Klaus' Wort 15.11.2026: „Ja, bitte die Fassung herausgeben, ich prüfe dann weiter.“ Inhalt (PR #144, Gerätetest 1.0.51):
Suche auf der ersten Seite wartet nicht mehr aufs Modell, „Alle Konten“ öffnet Mails ganz beim Anbieter (mit Anhängen),
„Beim Anbieter öffnen“ robuster, Ladeanzeige überall (kreisende Punkte, Prozent und Balken wo bekannt).
Quelle main `899e8db6ad59652b3baf57d9612f8aaf8886e812`.

- [Android-Update](https://github.com/lausiklauskn-png/Privat-Brain-Pro/releases/download/v1.0.52/Private-Brain-Pro-1.0.52.apk):
  61.469.740 Bytes, SHA-256 `203d0a618bc7f1d3122a71041ac59f256abf6b2b354fa718b3bc0eadb6e04f6c`, Code 52. Über die vorhandene App installieren.
- [Windows-Setup](https://github.com/lausiklauskn-png/Privat-Brain-Pro/releases/download/windows-v1.0.52/Private-Brain-Pro-Windows-1.0.52-x64-setup.exe):
  101.777.357 Bytes, SHA-256 `19d1b0f460f5b46bd4f98fd31ec2cc2d54f0710eec65a0d183ef9b93f085c778` (unsigniert wie bisher).

## Nachweise

- PR #144 auf `82d97de`: alle Prüfungen grün. Davor rot und behoben: `test-meaning` (Suche umging das zweite Modell),
  `test-explorer-kinds` (Probe maß das Nachordnen des Sortier-Kerns), einmal Maven Central 429 (Infrastruktur).
- Main-CI auf `899e8db`: Android und Web 43764025955, Windows 43764025964 (Updateprobe 1.0.41 → 1.0.52), Signierung 43764025961, Pages 43764025957 – grün.
- Android-Veröffentlichung 43765703278 (`channel=public`, Tag `v1.0.52`, signiertes Update) erfolgreich.
- Windows-Veröffentlichung 43765705937 erfolgreich.
- Beide Dateien anonym geladen; SHA-256 gleich `SHA256SUMS`. `native-activity.js` in der APK bytegleich mit main.

Nicht geprüft: Tablet, Windows-PC, echte Konten. Diese Version nicht erneut auslösen; nächste Fassung 1.0.53.
