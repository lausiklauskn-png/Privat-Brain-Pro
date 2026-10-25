# Neue Oberfläche ab dem ersten sichtbaren Bild

Stand 25.10.2026: **Android und Windows 1.0.37 sowie die gebaute PWA sind veröffentlicht.**
[Android-Update-APK](https://github.com/lausiklauskn-png/Privat-Brain-Pro/releases/download/v1.0.37/Private-Brain-Pro-1.0.37.apk) · [Windows-x64-Setup](https://github.com/lausiklauskn-png/Privat-Brain-Pro/releases/download/windows-v1.0.37/Private-Brain-Pro-Windows-1.0.37-x64-setup.exe) · [PWA öffnen / installieren](https://lausiklauskn-png.github.io/Privat-Brain-Pro/).
Die vorherige 1.0.36 und ihre Nachweise bleiben unverändert erhalten.

Klaus meldet, dass beim Öffnen kurz die alte Oberfläche erscheint, bevor die
neue darüber aufgebaut wird. Der Fehler ist im Browser nachgestellt: Beim
ersten Paint waren die neuen Theme-Attribute, die kompakte Leiste und die
aufbereiteten Hilfebereiche noch nicht vorhanden. Die Startskripte bauten sie
erst später auf. Der Service Worker ist in den nativen Apps nicht beteiligt.

V3 liefert dafür ein geprüftes Vorbild im unveränderlichen Quellstand
`cde49174d7e0803d8ea08a2ad33bb8a7cbeb8a48`: Die ausgelieferte HTML-Datei enthält
bereits die fertige Oberfläche. Das separate V3-Repository bleibt unverändert.

## Umsetzung

- Der Bau schreibt die Pro-Leiste mit sieben Hauptwegen, Zahnrad, Palette,
  Liniensymbolen, Menü und Suchsprachchip unmittelbar ins HTML. Symbole,
  Beschriftungen und angebotene Sprachen stammen aus den eigenen Runtimequellen.
- Ein gültiges Standardthema steht schon im HTML. Der frühe Bootstrap liest die
  gespeicherte Farbwahl vor dem ersten Paint, ohne Einstellungen zu überschreiben.
- Navigation, Palette, Sprachwahl und Versionsanzeige binden ihre Funktionen an
  die vorhandenen Elemente. Übersetzungen erhalten Symbole und Beschriftungshüllen.
- Alte Suchanleitungen erscheinen weder beim ersten Paint noch nach dem Laden
  eines vorhandenen Katalogs erneut. Tatsächliche Trefferangaben bleiben erhalten.
- Die PWA erhält einen eigenen geprüften Bau mit unveränderter Installations-
  identität. Ein nach Pfad abgegrenzter Service Worker hält vollständige
  Dateigenerationen bereit. Fremde App-Caches und gespeicherte Nutzerdaten bleiben
  erhalten. GitHub Pages muss die gebaute Fassung veröffentlichen.

Es wird keine Abdeckung über die alte Ansicht gelegt. Der erste sichtbare
App-Bereich enthält bereits die neue Darstellung. Das Laden von Modellen,
Konten oder Dateien hält diesen Aufbau nicht auf.

## Nachweise

Die neue Regression prüft eine sichtbare moderne Oberfläche bei vollständig
abgeschaltetem JavaScript und einen absichtlich verzögerten Start auf schmalen
und breiten Fenstern. Sie prüft außerdem gespeicherte Farben, unveränderte
Elemente, funktionierende Navigation und den Erhalt von Katalog und Einstellungen.
Vorhandene Bedienungs-, Plattform- und installierte Updateprüfungen bleiben nötig.

Windows wird mit dem echten öffentlichen Installer 1.0.36 auf 1.0.37 aktualisiert;
Android behält Paketkennung, ursprünglichen Signierer und Versionsfortschritt.
13 reguläre main-Checks; die Anforderung erfolgte separat auf geprüften Dispatcherbranches (13 tatsächliche Sourcechecks; bestätigter Legacy-Übergang); zwei Windows-Veröffentlichungschecks sind getrennt gebunden.
60 native Fälle ohne Fehler/Skips und 38 Start-/Übernahmeprüfungen
sind erfolgreich. Android-Release [40225104221](https://github.com/lausiklauskn-png/Privat-Brain-Pro/actions/runs/40225104221), Windows-Release
[40224745892](https://github.com/lausiklauskn-png/Privat-Brain-Pro/actions/runs/40224745892); Android: signierte Updateprobe mit Seed/Baseline/Verify bestanden;
Windows: echte Aktualisierung 1.0.36 → 1.0.37 bestanden.
Die öffentlichen APK-/Setup-Bytes wurden unabhängig heruntergeladen und geprüft.
Der [Pages-Deployjob](https://github.com/lausiklauskn-png/Privat-Brain-Pro/actions/runs/40222186331/job/121258534134) bestätigt vier tatsächlich ausgelieferte
PWA-Dateien gegen die geprüften Hashes, Quelle `015c9a1266a64f44a1896ead56349094c64e2f9a` und dieselbe Generation
`691368c910961ae3ab643606eb096bfea4237047063a79ee4bfae8110ac19a44`. Native HTML-Prüfsumme `7ede3ac7f11e90ca9242bfca60918742cbe0cc3c8002d27b1d6d58a909fd18ed`
und vorbereitete PWA-HTML-Prüfsumme `08833ad54adb64b83e45058397d3d1a03245e53b76c0a93d9bba1a9dfd4c385d`
sind ausdrücklich getrennte Belege.

[Android](android-1.0.37-pruefung.json), [Windows](windows-1.0.37-pruefung.json),
[PWA](pwa-1.0.37-pruefung.json). Physisches Samsung DeX und Klaus' Tab S6 sowie
reale Gerätegeschwindigkeit sind damit noch nicht direkt vermessen.
