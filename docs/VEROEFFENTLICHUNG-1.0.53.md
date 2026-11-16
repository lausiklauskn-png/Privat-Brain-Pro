# Private Brain Pro 1.0.53 veröffentlicht (Android und Windows)

Klaus' Wort 16.11.2026: „Wenn du fertig bist, kannst du selbstständig mergen und die App online stellen. Und die anderen Varianten
PWA und Windows nachziehen.“ – danach „Da erteile ich ihn hiermit.“ Inhalt (PR #148, Gerätetest 1.0.52, Ja zu V1–V8):
Startseite mit einer Suche und einer Trefferliste, getrennt Diktiertes wird zusammengezogen, Modell startet erst bei „Bedeutung“,
Hinzufügen mit einer Ablagefläche und „Gerade hinzugefügt“, Vorschlag „Kategorie anlegen?“ zeigt die gemeinten Dateien, Mail
(Liste/Absender bei Suche, „Nichts aufzuräumen“, „Link öffnen“, Mail sofort und Anhänge danach, „An Familienakte“ in der Liste mit
Vorsortierung), ⓘ anfangs geschlossen, Kachel „+ Neuer Ordner“, Einlesen in der gemeinsamen Ladezeile. Enthält PR #147.
Quelle main `8067054a1791d7de68199592aae5600ff0d17df0`.

- [Android-Update](https://github.com/lausiklauskn-png/Privat-Brain-Pro/releases/download/v1.0.53/Private-Brain-Pro-1.0.53.apk):
  61.496.004 Bytes, SHA-256 `a6a1d1284f07756b81f28cfbdabfa6d95afe78ebb26fedddba12c9f0d6c26ca8`, Code 53. Über die vorhandene App installieren.
- [Windows-Setup](https://github.com/lausiklauskn-png/Privat-Brain-Pro/releases/download/windows-v1.0.53/Private-Brain-Pro-Windows-1.0.53-x64-setup.exe):
  101.801.957 Bytes, SHA-256 `265584a38fc04d4297761f8df51a377919dbcc34b373bd623f97b6bdbfc864ff` (unsigniert wie bisher).
- PWA über Pages (Lauf auf main grün): https://lausiklauskn-png.github.io/Privat-Brain-Pro/

## Nachweise

- PR #148 auf `ce96518` (Stand mit Version 1.0.53): alle Prüfungen grün. Davor rot und behoben: `test-caption-model` und `test-meaning`
  (erwarteten ⓘ offen bzw. Modellstart beim Öffnen), `test-einstellungen-themen` (Sprachauswahl rutschte bei geschlossenem ⓘ neben die
  Überschrift). Windows-Job im ersten Lauf rot an „test-only empty publisher list is read“ (`windows/pruefung/installed.mjs`,
  unveränderter Code, Ursache nicht geklärt), im zweiten Lauf grün.
- Main-CI auf `8067054`: Android und Web 43839379415, Windows 43839379363 (Updateprobe 1.0.41 → 1.0.53), Signierung 43839379419,
  Pages 43839379445 – grün.
- Android-Veröffentlichung 43843064335 (`channel=public`, Tag `v1.0.53`, signiertes Update) erfolgreich.
- Windows-Veröffentlichung 43843069585 erfolgreich (Installer aus der Abnahme 43839379363 übernommen).
- Beide Dateien anonym geladen; Größe und SHA-256 gleich `SHA256SUMS`. `native-ueberall.js`, `native-semantic.js` und
  `assets/such-frage.js` in der APK bytegleich mit main.

Nicht geprüft: Tablet, Windows-PC, echte Konten, echter Tresor. Die Vorsortierung zu „An Familienakte“ wirkt erst, wenn die
Familienakte ihr Gegenstück trägt (dort PR #199, geplant für 2.28.71); bis dahin erscheint die Begleitdatei dort als zweite kleine Datei
im Eingang. Diese Version nicht erneut auslösen; nächste Fassung 1.0.54.
