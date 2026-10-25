# Neue Oberfläche ab dem ersten sichtbaren Bild

Stand 25.10.2026: Umsetzung und Prüfungen für 1.0.37 laufen. Die bisherige
öffentliche Android-/Windows-Version 1.0.36 bleibt unverändert verfügbar.

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
CI-Läufe, Veröffentlichungen und öffentliche Downloadbelege werden erst nach
ihrem tatsächlichen Abschluss ergänzt. Physisches Samsung DeX und Klaus' Tab S6
sind damit noch nicht direkt vermessen.
