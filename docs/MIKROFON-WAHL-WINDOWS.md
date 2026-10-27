# Mikrofon fürs Diktat wählen (Windows) – 2026-10-27

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

## Android und PWA

- **Android** öffnet weiter sein eigenes Sprachfenster; dort wählt Android das Mikrofon.
  Die Einstellung erscheint dort nicht.
- **PWA (Browser):** Die Spracherkennung des Browsers nimmt immer das Mikrofon, das im
  Browser bzw. im System als Standard eingestellt ist; eine Seite kann es dafür nicht
  wählen. Klaus hat die PWA geprüft und dort kein Problem gesehen.

## Geprüft

- `cargo check --target x86_64-pc-windows-msvc` im Behälter: übersetzt ohne Fehler
  (nur Typprüfung, kein Lauf unter Windows).
- `rustc --test src/speech.rs`: 4 Fälle der Geräteauswahl grün (Kennung, neuer Name nach
  Umstecken, doppelter Name, abgestecktes Gerät).
- `node tools/native/test-microphone.mjs`: 16 grün (Geräteliste und Erkenner simuliert).
  Gegenprobe in der Wegwerf-Kopie `www/`: ohne Übergabe der Wahl → rot; mit stillem
  Rückfall → rot.
- `test-speech` 27 grün, `test-input-language` 40 grün.

⚠ **Nicht gemessen:** an echten Mikrofonen unter Windows, mit Bluetooth-Headsets, nach
Umstecken an echter Hardware. V3 (anderes Repo) hat dieselbe Windows-Spracherkennung und
bekommt die Änderung erst auf Klaus' Wort.
