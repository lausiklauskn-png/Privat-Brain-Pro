# Mikrofon fürs Diktat wählen (Windows, Android, PWA) – 2026-10-27

**Auftrag (Klaus 2026-10-27):** In der Windows-Fassung reagierte das Diktat nicht auf
ein bestimmtes Mikrofon, sondern „auf alle Mikrofone, die auf dem Rechner installiert
sind“. Die App soll ein bestimmtes Mikrofon zugeordnet bekommen, statt es dem Zufall zu
überlassen.

## Ursache

`windows/src-tauri/src/speech.rs` nahm bisher immer das Gerät, das Windows in diesem
Augenblick als **Standard-Aufnahmegerät** führt (`GetDefaultTokenId`). Dieses Standardgerät
wechselt Windows selbst, etwa wenn sich ein Bluetooth-Headset verbindet oder ein
USB-Mikrofon eingesteckt wird. Für die App sah das aus, als höre sie „irgendwo“ zu.

## Was jetzt gilt

- **Einstellungen → Such- und Diktatsprache → „Mikrofon fürs Diktat“** (nur Windows):
  Auswahl „Windows-Standard (wechselt mit Windows)“ oder ein bestimmtes Gerät aus der
  Liste, die Windows meldet. Knopf „Neu suchen“; die Liste wird auch beim Zurückkehren
  ins Fenster neu gelesen.
- Hinter dem Gerätenamen steht, wie es laut Namen verbunden ist: **Bluetooth**,
  **USB-Kabel**, **Funk/WLAN** oder **eingebaut oder Klinke**. Das ist ein Hinweis aus dem
  Namen, keine Messung; Windows meldet die Verbindungsart hier nicht gesondert. Ein
  Mikrofon „per WLAN“ erscheint in Windows nur über einen Treiber/eine App als gewöhnliches
  Aufnahmegerät und ist dann ebenso wählbar.
- Mit fester Wahl hört das Diktat **nur auf dieses Gerät** (SAPI `SetInput` mit genau
  diesem Gerät). Das Sprechfenster nennt das Mikrofon, über das gerade zugehört wird.
- Steckt man ein Gerät um und Windows vergibt eine neue Kennung, findet die App es über den
  eindeutigen Namen wieder. Gibt es zwei Geräte mit gleichem Namen, wird nicht geraten.
- Ist das gewählte Mikrofon **nicht verbunden**, sagt die App das mit Namen und fügt nichts
  ein. **Kein stiller Rückfall** auf ein anderes Mikrofon.
- Ohne Wahl verhält sich alles wie bisher.
- Gespeichert wird nur Kennung und Name des Geräts (`localStorage` `pb_microphone_v1`).
  Kein Ton geht durch die Seite oder ins Netz.

## Android (Klaus 2026-10-27, nach dem Windows-Test: „lief sehr zufriedenstellend“)

- Gleiche Einstellung. Android meldet die Verbindungsart selbst: **Mikrofon im Gerät**, **Kabel**, **USB-Kabel**,
  **Bluetooth** (`AudioManager.getDevices`, `ProSpeechPlugin.inputs`). Mehrere eingebaute Mikrofone zählen als eines.
- Die App **nimmt weiter nichts selbst auf** und fragt nach **keiner Mikrofon-Berechtigung**. Sie stellt nur Androids
  Audio-Weiche auf das gewählte Gerät, solange Androids Sprachfenster zuhört, und stellt sie danach zurück:
  ab Android 12 `setCommunicationDevice`, davor für Bluetooth `startBluetoothSco`. Dafür steht im Manifest nur
  `MODIFY_AUDIO_SETTINGS` (ohne Rückfrage an den Nutzer).
- Deshalb sagt die Statuszeile ehrlich „Diktat wird an dieses Mikrofon geleitet“. Ob Androids Spracherkennung der
  Weiche folgt, entscheidet das Gerät; das zeigt erst der Test am Tablet.
- Fehlt das gewählte Mikrofon: Meldung mit Namen, kein Diktat über ein anderes Gerät.

## PWA (Browser)

- Chrome und Edge ab Version 135 nehmen ein bestimmtes Mikrofon als Audiospur für ihre Spracherkennung an
  ([Chrome 135](https://developer.chrome.com/release-notes/135)). Die App reicht das gewählte Mikrofon dort hinein,
  bei der Suche und bei der Bildbeschreibung, ohne die gemeinsamen Dateien zu ändern.
- Gerätenamen zeigt der Browser erst nach der Mikrofon-Freigabe: „Neu suchen“ fragt einmal danach.
- Ältere oder andere Browser: Die Einstellung sagt das klar und bietet keine Wahl an; dort gilt das im Browser
  eingestellte Mikrofon. Nichts wird still umgestellt.
- ⚠ Ob Chrome **auf Android** die Spur annimmt, ist nicht belegt (die Ankündigung nennt den Desktop). Prüfen am Tablet.

## Geprüft

- `cargo check --target x86_64-pc-windows-msvc` im Behälter: übersetzt ohne Fehler
  (nur Typprüfung, kein Lauf unter Windows).
- `rustc --test src/speech.rs`: 4 Fälle der Geräteauswahl grün (Kennung, neuer Name nach
  Umstecken, doppelter Name, abgestecktes Gerät).
- `node tools/native/test-microphone.mjs`: 16 grün (Geräteliste und Erkenner simuliert); mit Android und PWA
  jetzt 30 grün. Gegenproben: PWA ohne Audiospur → rot; Android ohne Übergabe der Wahl → rot.
  Gegenprobe in der Wegwerf-Kopie `www/`: ohne Übergabe der Wahl → rot; mit stillem
  Rückfall → rot.
- `test-speech` 27 grün, `test-input-language` 40 grün.

⚠ **Nicht gemessen:** an echten Mikrofonen unter Windows, mit Bluetooth-Headsets, nach
Umstecken an echter Hardware. V3 (anderes Repo) hat dieselbe Windows-Spracherkennung und
bekommt die Änderung erst auf Klaus' Wort.

## Veröffentlicht: Windows 1.0.40 (2026-10-27, Klaus' Wort)

[Windows-Setup 1.0.40](https://github.com/lausiklauskn-png/Privat-Brain-Pro/releases/download/windows-v1.0.40/Private-Brain-Pro-Windows-1.0.40-x64-setup.exe)
über die vorhandene App installieren. „Nach Update suchen“ in einer installierten 1.0.39 findet es ebenfalls.
Quelle main `aae5013dabd8251051a8d731104dc64fba723b98` (PR #97), Windows-Abnahme 40531337324 mit echter
Updateprobe 1.0.39 → 1.0.40, Release-Lauf 40541743653. Setup 101.191.212 Bytes, SHA-256
`a11d4f177b924f765f204b895a5bec91b9025ee70197e1f58d790bb8e2c62546`, unabhängig geladen und gleich `SHA256SUMS`.
Android-Lauf auf main: Versuch 1 rot an der Mycel-Probe „Verbinden fail-soft offline“ (inhaltsgleicher PR-Stand
dort grün), einmal neu gestartet, Versuch 2 grün. Keine Android-Veröffentlichung. Nicht erneut auslösen.

## Veröffentlicht: Android 1.0.40 und PWA (2026-10-27, Klaus' Wort)

[Android-APK 1.0.40](https://github.com/lausiklauskn-png/Privat-Brain-Pro/releases/download/v1.0.40/Private-Brain-Pro-1.0.40.apk)
über die vorhandene App installieren. Quelle main `595cd754d4df2f54271a841b320d23f8e258d2da` (PR #99),
main-CI Android 40567456817 und Windows 40567456855 grün, Release-Lauf 40569926227 mit signiertem Update
1.0.39 → 1.0.40. APK 60.935.065 Bytes, SHA-256 `c247297c65b93c8c3b115435c738df6f9212fd8f73fd58aacc152102b2215a04`,
Code 40, unabhängig geladen und gleich `SHA256SUMS`; `native-microphone.js` in der APK bytegleich mit der Quelle.
PWA über Pages vom selben Stand. Windows bleibt 1.0.40 vom Quellstand `aae5013`. Nicht erneut auslösen.
