# Private Brain Pro 1.0.54 veröffentlicht (Android und Windows)

Klaus' Wort 16.11.2026 auf die Frage „PR #150 übernehmen und als 1.0.54 für Android, Windows und PWA ausgeben?“: Ja; danach
„mach weiter mit 1.0.54“. Inhalt (PR #150, Generalprüfung nach 1.0.53: zehn Rollen, 80 Befunde, alle gegengeprüft): Einlesen mit
Warteschlange, späte Modell-Antwort holt nach × keine alten Treffer zurück, Trefferzeile und -karte in vier Sprachen, „auch gesucht
als“ nur bei Nicht-Wörtern; Mail: Postfach steht mit gespeichertem Konto von selbst da, „Gesendet.“ mit Weg zurück, Stern/Gelesen
lassen die Mail offen, ein Tipp in den Papierkorb, „An Familienakte“ behält nicht übergebene Mails markiert; Kopf am Handy: Pfeile an
der Hauptleiste, Update-Fähnchen frei; Kategorien zählen gleich; Einstellungen nach Themen in vier Sprachen; „Entsperren“ als
Hauptknopf. Quelle main `eeab3306b72c0122c5afab9c23e13d0916701e85`.

- [Android-Update](https://github.com/lausiklauskn-png/Privat-Brain-Pro/releases/download/v1.0.54/Private-Brain-Pro-1.0.54.apk):
  61.513.092 Bytes, SHA-256 `32258b7d1dcc26c6f02256559dd7890197c56532d46a1eceb7dce445b3ed81d5`, Code 54. Über die vorhandene App installieren.
- [Windows-Setup](https://github.com/lausiklauskn-png/Privat-Brain-Pro/releases/download/windows-v1.0.54/Private-Brain-Pro-Windows-1.0.54-x64-setup.exe):
  101.817.680 Bytes, SHA-256 `334e2198a262f111c3ddfdb41a433091876ea702ff3ff8afed905000104d3b15` (unsigniert wie bisher).
- PWA über Pages (Lauf auf main grün): https://lausiklauskn-png.github.io/Privat-Brain-Pro/

## Nachweise

- PR #150 auf `6c63137` (Stand mit Version 1.0.54): alle Prüfungen grün. Davor: `validate` einmal rot an `test-explorer-kinds`
  (Warnsymbol im Baum wurde geprüft, bevor die Symbolleiste es gesetzt hatte; lokal neunmal grün; die Probe wartet jetzt bis zu
  10 s und prüft dann unverändert) und `native-smoke` einmal rot, weil Maven Central den Bau mit 429 abwies (kein Test lief;
  Wiederholung grün).
- Main-CI auf `eeab330`: Android und Web 43869971010, Windows 43869971015 (Updateprobe 1.0.41 → 1.0.54), Signierung 43869971007,
  Pages 43869971005 – grün.
- Android-Veröffentlichung 43873684486 (`channel=public`, Tag `v1.0.54`; Jobs build, signed-upgrade, publish) erfolgreich.
- Windows-Veröffentlichung 43873689664 (Tag `windows-v1.0.54`) erfolgreich.
- Beide Downloads ohne Anmeldung geladen: Größe und SHA-256 gleich `SHA256SUMS` und gleich den Angaben der Release-Dateien.
- In der APK bytegleich mit main: `native-ueberall.js`, `native-semantic.js`, `assets/such-frage.js`, `assets/live-mail.js`.
- Laut veröffentlichter `ANDROID-IDENTITY.json` (Angabe des Release-Laufs, nicht selbst aus der APK gelesen): versionName 1.0.54,
  versionCode 54, Paket `de.familyprojekt.privatebrain.pro.preview`, Zertifikat `362ee70d…74fa80`.

## Nicht geprüft

Tablet, Handy, Windows-PC, echte Mail-Konten, echter Tresor. Signatur der APK und `.aab` nicht selbst nachgeprüft. Russische und
polnische Texte nicht von Muttersprachlern gelesen. Diese Veröffentlichung nicht erneut auslösen; nächste Fassung 1.0.55.
