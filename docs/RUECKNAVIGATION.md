# Dateiansicht und Zurück – Vorschau .7

Auftrag 2026-10-20: Nach dem Öffnen eines importierten Bildes oder Dokuments war
kein zuverlässiger Rückweg vorhanden; `showBlob` öffnete eine Blob-Adresse über
`window.open`. In Android konnte damit die App-Oberfläche samt Navigation fehlen.

Die native Ausgabe ersetzt diesen Weg durch `native/native-navigation.js`:

- Sichtbare Zurück-/Vorwärts-Knöpfe im Kopfbereich, zusätzlicher Zurück-Knopf in
  der Dateiansicht. Eine gemeinsame Browser-History-API für Seiten, Explorerordner,
  Bild-Großansicht und Original-Dateiansicht, ohne künstliche Zehn-Schritte-Grenze.
- Android-Zurück über den AndroidX-Dispatcher, Alt+Links/Alt+Rechts, Maus-Zurück,
  Escape bei offener Datei/Großansicht. Backspace bearbeitet Eingabefelder und
  navigiert nur außerhalb von Eingabefeldern zurück.
- Rückkehr zum gewählten Explorerordner einschließlich Filter, Sortierung und
  gespeicherter Scrollposition. An der Startposition führt Android-Zurück die App
  in den Hintergrund; keine automatische Löschung oder Neuerstellung von Konten.
- Bilder als passive Bilddarstellung und Textdateien bis 2 MiB als wörtlicher Text
  innerhalb der App. Keine Ausführung importierter HTML-/Skriptdateien. Die große
  Bildvorschau behält ihre bestehenden Original-/Beschreibung-/Löschwerkzeuge.
- Andere Formate (insbesondere PDF und Office) über „Mit anderer App öffnen“ und
  den nativen Android-Auswahldialog. Die interne Dateiseite bleibt darunter samt
  Zurück-Knopf erhalten. Keine direkte Blob-Navigation des Hauptfensters.

`ProFiles` nimmt nur ausdrücklich gewählte Dateibytes entgegen, keine beliebigen
Pfade. Für die externe Freigabe gelten 16 MiB pro Datei und 64 MiB Cache. Kopien
liegen in `cache/exports/files`, werden bei späterem Öffnen nach 24 Stunden
bereinigt und über den vorhandenen engen FileProvider nur zum Lesen freigegeben.
Keine allgemeinen Speicherberechtigungen oder Uploads. Die Originaldatei wird
nicht geändert. Ein Fehler beim Lesen oder Öffnen lässt den Rückweg verfügbar.

Dateien für Vorwärts-Schritte bleiben nur in der aktuellen Sitzung verfügbar;
die zwanzig zuletzt geöffneten Dateien werden im Speicher referenziert. Ältere
Dateieinträge oder ein Neustart dürfen erneut ausgewählt werden müssen, haben
aber weiterhin einen Zurück-Knopf. Dateibytes und Vorschauen werden nicht in
History, localStorage, Protokolle oder Git geschrieben. Konten-/Katalogschema und
Android-Keystoreformat ändern sich nicht.

Prüfung: `npm run test:native-web` verlangt zusätzlich die Dateinavigation mit
wirklich importierten Sitzungsdateien. Proben umfassen zwölf aufeinanderfolgende
Datei- und Seiten-Rückschritte, Explorerzustand, Browser-Back, Vorwärts, Tastatur,
Maus, vier Sprachen, drei Fensterbreiten, sichere Textdarstellung und späten/
fehlgeschlagenen Dateizugriff. Die Android-Instrumentierung verlangt zusätzlich
`fileViewerAndTwelveAndroidBackStepsKeepAppAlive`; zwölf Rückschritte müssen über
den tatsächlichen Android-Dispatcher ohne App-Neuladung funktionieren.

Ausführung und Release-Nachweise werden im [Prüfstand](PRUEFSTAND-ANDROID.md)
festgehalten. Externe PDF-/Office-Apps und Samsung-DeX-Maus/Tastatur sind zusätzlich
am Nutzergerät zu prüfen. Original-PWA und geschützte Module bleiben unverändert.
