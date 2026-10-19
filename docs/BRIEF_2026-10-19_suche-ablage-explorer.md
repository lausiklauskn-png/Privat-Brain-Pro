# Suche, lokale Ablage und Explorer

Validierung: vollständiges `npm test` mit 36 Prüfskripten und Rückgabe 0;
nach Ergänzung der Hell/Dunkel-Prüfung die gezielte Workspace-Probe nochmals
ausgeführt: 44 Prüfungen bestanden. Navigation bei 320/768/1280 px,
lokale Schreib-/Lesepfade, Fehlerfälle und vorhandene Regressionen geprüft.

Auftrag: drei Hauptseiten, Suche zuerst und überall erreichbar, lokale Dateikopien
statt Originalen im Repository; vorhandenes Design und Bedienung für Tablet/Desktop.

Gebaut: Navigation mit Suche, Dateien hinzufügen und Explorer. Die bisherigen
Zusatzwerkzeuge bleiben erreichbar. `assets/workspace.js` verbindet Kopienablage,
Ordnerverweise und Explorer mit dem bestehenden Such-/Importmotor. Einstellungen und
Verzeichnishandles nutzen den bestehenden Store `dirs`; keine DB-Versionsänderung.
Jeder Ablageordner bekommt eine eigene Kennung, damit ein Ordnerwechsel frühere
Verweise erhält. Kopieren ist ausdrücklich gewählt, ohne Überschreiben; Lesezugriff
bleibt über Handles. Eine fehlende Datei bleibt fehlend und wird nicht durch ihren
Katalogtext ersetzt. Bibliotheks-Bytes liegen außerhalb des Repositories auf dem Gerät.

Offline-Vorrat: neue app-eigene JS-/CSS-Dateien; Cache v84, gegen origin/main v83
geprüft. Die bytegleichen Kernmodule bleiben unverändert. Eigene Browser-Probe in
`tools/e2e-workspace.mjs`, Bestandteil von `npm test`.

Grenzen: iPad/Safari und weitere Browser ohne externe Ordner-API erlauben keinen
dauerhaften Zugriff auf einen frei gewählten Geräteordner aus dieser PWA. Import und
Suche bleiben möglich; Originalzugriff nach Neustart benötigt erneute Dateiauswahl.
Der automatisierte Ordnerdialog liefert reale browserverwaltete Handles; native
Systemdialoge und die Bedienung am echten Tablet sind nicht dadurch bewiesen.
Das Embedding-Modell wird weiter vom bestehenden Motor verwaltet; ohne verfügbare
Gewichte gilt dessen vorhandener Rückfall. Die E-Mail-Serveranbindung ist nicht Teil
dieses Oberflächenumbaus und bleibt eine nachfolgende Aufgabe.

Sende-Pruefer bleibt als Referenz separat und unverändert. Für die spätere Mail-Seite
sollen dessen Pseudonymisierung und Prüfabläufe wiederverwendet werden; IMAP/SMTP,
Gmail-OAuth und echte Malwareprüfung sind weiterhin zusätzliche Arbeit.

Freibrief: Klaus hat Commit, eigenen Pull Request und selbstständiges Mergen nach
Prüfung in dieser Sitzung ausdrücklich beauftragt. Vor Live-Freigabe tatsächliche
Testergebnisse und GitHub-Berechtigungen prüfen. Der Browser-Sichttest bleibt Klaus
vorbehalten; der Freibrief ersetzt ihn nicht. Folgeaufgaben dürfen denselben Freibrief
innerhalb des autorisierten Umfangs nutzen.
