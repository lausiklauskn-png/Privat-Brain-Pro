# Veröffentlichung Sitzung 5 (2026-10-26)

Klaus (2026-10-26): „kannst die PRs merken und dann in die anderen Varianten übertragen und in das Geschenk. Jens.“
Übernommen: Pro #92 (main `e3f5c1190fc68a287c89b7665ab1c94cf9289e7b`), V3 #26 (main `969ed38ae66e09c2262ff45a302d28a7fbb14f87`),
beide nach grüner CI auf dem Kopf. Danach die vier Release-Abläufe aus main; jeder verlangt die grüne main-Kette desselben Commits.

| App | Fassung | Lauf | Datei | Bytes | SHA-256 |
|---|---|---|---|---|---|
| Private Brain Pro, Android | 1.0.39 (Code 39) | [40371549303](https://github.com/lausiklauskn-png/Privat-Brain-Pro/actions/runs/40371549303) | [APK](https://github.com/lausiklauskn-png/Privat-Brain-Pro/releases/download/v1.0.39/Private-Brain-Pro-1.0.39.apk) | 60.926.381 | `c776d549ac84a31351445c73c4f68dd94ac3a63af8d0cddb90a607d55f3a1a8c` |
| Private Brain Pro, Windows | 1.0.39 | [40371555575](https://github.com/lausiklauskn-png/Privat-Brain-Pro/actions/runs/40371555575) | [Setup](https://github.com/lausiklauskn-png/Privat-Brain-Pro/releases/download/windows-v1.0.39/Private-Brain-Pro-Windows-1.0.39-x64-setup.exe) | 101.205.944 | `3a579d3fca546ef3544d163e966b192c45c4170cb0de2b4d78ccce7ec670440d` |
| Private Brain V3 Pro, Android | 3.0.0-preview.8 (Code 8) | [40373235903](https://github.com/lausiklauskn-png/Privat-Brain-Pro-V3/actions/runs/40373235903) | [APK](https://github.com/lausiklauskn-png/Privat-Brain-Pro-V3/releases/download/v3-android-3.0.0-preview.8/Private-Brain-V3-Pro-3.0.0-preview.8.apk) | 49.714.329 | `89df481e2027803d7d8826d0d688155a36d1e090f9c123079e975f64d4c257cf` |
| Private Brain V3 Pro, Windows | 3.0.0-preview.8 | [40371604897](https://github.com/lausiklauskn-png/Privat-Brain-Pro-V3/actions/runs/40371604897) | [Setup](https://github.com/lausiklauskn-png/Privat-Brain-Pro-V3/releases/download/v3-windows-3.0.0-preview.8/Private-Brain-V3-Pro-Windows-3.0.0-preview.8-x64-setup.exe) | 91.425.392 | `80e2381c906729913de12cfc1c137bcc446478a05de6c5a419d58188df7b188d` |

- Alle vier Dateien in dieser Sitzung **unabhängig heruntergeladen**; Größe und SHA-256 stimmen mit `SHA256SUMS` der Releases
  und den Angaben der GitHub-API überein. Daneben liegen die `.aab` (Pro 60.567.292 B, V3 49.346.980 B).
- Pro Android: Kanal `public`, Tag `v1.0.39`, ursprünglicher Signierer, signierte Updateprobe 1.0.38 → 1.0.39 im Lauf.
  Pro Windows: derselbe geprüfte Installer der Windows-Abnahme 40369226371 (Updateprobe 1.0.38 → 1.0.39, Pin auf das
  veröffentlichte 1.0.38-Setup `bb8389aa…`, 101.119.348 B).
- main-Ketten: Pro android.yml 40369226517, windows-app.yml 40369226371, Signierung 40369226347, Pages 40369226391;
  V3 android.yml 40368268906, windows-app.yml 40368269850, Pages 40368269126 – alle grün.
- PWAs: Pro und V3 über GitHub Pages aus denselben main-Commits.
- **Geschenk für Jens:** Fassung 24 (`https://claude.ai/artifact/XPEQpCH7axafiTRB7y1RB7`): Pro 1.0.39 (61 MB / 101 MB), V3
  preview.8 (50 MB / 91 MB), Stand 26.10.2026; Quelle jetzt wieder im Repo (`docs/geschenk/geschenk-jens.html`). Workflow PDF
  Pro steht dort weiter mit 1.0.3 – 1.0.5 (Bildbeschreibung, Sitzung 4) ist nicht veröffentlicht, das war nicht Teil dieses Worts.
- ⚠ Nicht am Tablet und nicht an Klaus' Rechner gemessen. Der Windows-Installer ist wie bisher unsigniert.
- Beim Übernehmen: V3 `validate` war auf dem PR rot, weil `tools/e2e-advanced.mjs` nach „Vorschau ansehen“ noch das Fenster
  erwartete (nachgezogen, 15 grün); V3 `upgrade-probe-smoke` fiel einmal an einem hängenden Emulator-Launcher und war im
  Lauf des nächsten Kopfs grün; Pros WebKit-Oberflächenjobs hingen in „Browser-Engine installieren“ und waren nach Abbruch
  und einem Neustart in 90 s grün.
