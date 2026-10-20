# Beschriftungen und Ordnerauswahl

Stand 2026-10-20, technische Version 0.1.0-preview.16.

Die obere Navigation zeigt kleinere kurze Namen direkt rechts neben den Symbolen,
auch auf dem Handy. Die Knöpfe sind 36 Pixel hoch. Alle acht Ansichten bleiben
direkt sichtbar. Abhängig von Fensterbreite, Sprache und Schriftgröße verteilen
sie sich auf flache Zeilen, jeweils mit Symbol und kurzem Namen. Sehr schmale
Fenster erhalten zusätzliche Zeilen statt abgeschnittener Namen. Auf breiten
Fenstern stehen die Ansichten gemeinsam in einer Zeile. Einstellungen
und App-Menü haben ein Zahnrad; der Themewechsel behält das Mondsymbol.

Alle kompakten Symbolknöpfe zeigen einen eigenen sichtbaren Tooltip bei Mauszeiger
oder Tastaturfokus. Escape blendet ihn aus. Die Mailknöpfe für Text-/Originalansicht
und externe Bilder erklären die jeweils nächste Aktion. Bedienung und Tooltips
folgen Deutsch, Englisch, Russisch und Polnisch.

Das Dashboard verwendet kleine Kacheln. Katalogeinträge öffnen den Explorer mit
allen Dateien; Kategorien öffnen die vorhandene Kategorienübersicht; doppelte
Inhalte öffnen die Duplikatansicht. Die Kataloggröße bleibt eine Information.
Die drei großen Einwurf-Hinweisboxen stehen als kurzer Hinweis unter dem Einwurf.

## Fensterbreiten und Betriebssysteme

Die Suche hat eine kleinere Überschrift und kompakte Zähler. In schmalen Fenstern
stehen Suchfeld und Mikrofon nebeneinander; darunter passen beide vollständigen
Suchmodus-Namen in die Breite. Filter verteilen sich auf zwei Spalten. Die Seiten
scrollen senkrecht; Bedienelemente dürfen nicht hinter einem abgeschnittenen
rechten Rand verschwinden. Bildschirmränder mit Aussparungen werden berücksichtigt.
Die Oberfläche verwendet dieselben SVG-Symbole statt betriebssystemabhängiger
Emoji für die Navigation; Maus und Tastatur zeigen Tooltips, Touch bleibt bedienbar.

Die Browser-Prüfung umfasst 280, 320, 390, 650, 768, 1.000, 1.280 und 1.920 Pixel,
alle acht Ansichten und vier Sprachen mit vergrößerter Schrift. Die CI führt sie
zusätzlich in Firefox und WebKit aus; Chromium deckt die Engine von Chrome/Edge
und Android-WebView ab. Engine-Prüfungen unter Linux sind keine Tests auf echten
iPhones, Macs oder Windows-Geräten. Installierbar ist derzeit die Android-APK;
es gibt noch keine native iOS-, Windows-, macOS- oder Linux-Ausgabe. Geräte-Mail,
Keystore und Ordnerfreigaben besitzen aktuell Android-Adapter. Die eigenständige
PWA wird durch diese Änderung nicht verändert.

## Ordner am Android-Gerät

„Ordner verbinden“ öffnet Androids Ordnerauswahl bei jedem Klick. „Nicht mehr
zeigen“ überspringt ausschließlich die Erklärung davor. Abbrechen verändert weder
Katalog noch Ablage. Ein anderer Quellordner kann anschließend erneut ausgewählt
werden. Die Auswahl liest die Dateien einmal ein und behält geprüfte Originalkopien
im privaten App-Speicher; sie ist keine laufende Ordnersynchronisierung.

„Ablageordner wählen/ändern“ wählt einen zusätzlichen Kopienordner über Androids
Storage Access Framework. Neue Importe erhalten dort eine zusätzliche, nach dem
Schreiben geprüfte Kopie. Vorhandene Dateien werden nicht überschrieben; bei
gleichem Namen entstehen nummerierte Kopien. Die Wahl bleibt nach Neustart erhalten.
Ein Wechsel betrifft zukünftige Kopien; bestehende Originalkopien und Katalogeinträge
werden nicht verschoben oder gelöscht. „Kopieren ausschalten“ beendet nur die
zusätzlichen Kopien; private Originalkopien bleiben verfügbar. Frühere Importe
werden nicht automatisch in den neu gewählten Ordner übertragen.

Bei verlorener Freigabe oder Schreibfehler bleibt der bisherige Katalog bestehen.
Der fehlgeschlagene neue Import wird nicht als erfolgreich eingetragen. Den
Ablageordner erneut wählen oder zusätzliche Kopien ausschalten. Abgebrochene
Kopien werden nur dann gelöscht, wenn die App sie bei diesem Versuch neu angelegt
hat. Originale und bestehende Dateien bleiben unangetastet.

Ein Ordnerimport ist auf 2.000 Dateien, 80 MiB pro Datei, 512 MiB insgesamt und
acht Unterordnerebenen begrenzt. Bei Überschreitung wird vor dem Import abgebrochen;
einen kleineren Unterordner wählen. Dateien werden einzeln übertragen und
verarbeitet. Ein Zielordner kann nur über die Android-Auswahl freigegeben werden;
die Weboberfläche kann keine beliebige URI oder einen Gerätepfad übergeben.
Die zusätzliche Ablage ist noch keine passwortverschlüsselte externe Ablage aus
dem gesonderten Speicher-/Quarantäneauftrag.

## Ladehinweis für E-Mails

Die Anzeige unterscheidet das tatsächliche Laden beim Anbieter, das Vorbereiten
der Ansicht und die bestehende Regelprüfung von Nachrichtentext und Anhängen.
„Warum dauert das?“ erklärt Übertragung, große Anhänge, bereinigte Ansicht und
Prüfungen. Die App behauptet keinen vollständigen Virenscan. Befunde und ungeprüfte
Inhalte stehen weiter im aufklappbaren Prüfbericht unter der Nachricht. Bei Fehler
oder Abschluss verschwindet der laufende Hinweis. Original-MIME und Anhänge werden
für diese Anzeige nicht verändert. Es wird kein neuer Sicherheitsdienst kontaktiert.

Der vorhandene App-Internetschalter, Mycel, Konten und Google-Registrierung werden
von dieser Änderung nicht umgestellt. Nur die native Android-Ausgabe wird angepasst;
die unabhängige PWA bleibt unberührt. Bilder: [kompakte Ansicht](design/compact15/README.md).

[APK .15](https://github.com/lausiklauskn-png/Privat-Brain-Pro/releases/download/v0.1.0-preview.15/Private-Brain-Pro-0.1.0-preview.15.apk) über die vorhandene App installieren.
[Veröffentlichungsnachweis](PRUEFSTAND-ANDROID.md#veröffentlichte-version-15--2026-10-20).
