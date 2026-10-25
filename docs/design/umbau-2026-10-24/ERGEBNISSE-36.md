# Gemeinsame Dateivorschau und öffentliche Version 1.0.36

Stand: 25.10.2026, Umsetzung und Prüfung laufen. Ziel ist die öffentliche
Version **1.0.36** für Android und Windows, ohne Probeversions- oder Prerelease-
Kennzeichnung. Android-VersionCode 36 und die bisherige technische App-Identität
bleiben erhalten, damit vorhandene Installationen aktualisiert werden können.
Die historische Android .35 bleibt unverändert veröffentlicht. Der Abschluss
wird erst nach beiden tatsächlichen öffentlichen Downloads und den vollständigen
Plattform- und Updateprüfungen bestätigt.

## Suche und Explorer

Bilder und PDFs erhalten auch in den Dateizeilen des Explorers kleine lokale
Vorschauen. Das gilt ebenso für Kategorieansichten und in den Katalog importierte
Mail-Anhänge. Suche und Explorer verwenden denselben Inhaltsfingerabdruck,
denselben begrenzten Vorschaucache und dieselbe Quelle für den Dateistatus.
Dateinamen werden nicht zur Zuordnung verwendet.

Eine gespeicherte Miniatur kann noch vorhanden sein, wenn die vollständige Datei
nicht erreichbar ist. Sie bleibt sichtbar; ein kleines Liniensymbol sowie die
Beschriftung bei Mauszeiger, Tastaturfokus und Vorlesen benennen den Originalstatus.
Die Miniatur ändert weder eine Meldung „Original fehlt“ noch einen Prüfbericht.
Das Öffnen geht in beiden Ansichten über denselben Dateiweg.

Die gemeinsame Warteschlange verarbeitet nur sichtbare Dateizeilen, eine nach
der anderen. Vorhandene Miniaturen lösen keinen Originalabruf aus. Grenzen aus
.35 bleiben: 16 Vorschauen, 6 MiB Cache, neue Bildvorschau nur bis 2 MiB/12 Megapixel,
PDF-Vorschau nur über die native erste Seite mit bestätigtem Original bis 16 MiB.
Beim Dateibetrachter pausiert die Vorschau; versteckte Ansichten starten keine
neuen Aufträge. OCR, gespeicherter Suchtext und Originaldateien bleiben unverändert.

Ordner und reine Mailcontainer bekommen keine irreführende Dateivorschau.
Die getrennte Liste direkt aus dem verschlüsselten Postfachspeicher besitzt
keinen Kataloghash und wird nicht allein anhand eines ähnlichen Namens zugeordnet.

## Miniatur, App-Datei und SD-Ablage

Die Untersuchung des Nutzerbefunds unterscheidet drei Speicherwege:

- App-Originalspeicher: vollständige importierte Bytes unter ihrem SHA-256.
- Verschlüsselter Speicherordner: kann vollständige Originalkopien enthalten;
  fehlende App-Dateien werden beim bewussten Öffnen daraus wiederhergestellt.
- Zusätzlicher Ablageordner: erhält auf Wunsch weitere Kopien. Der vorhandene
  Weg „Ordner durchsuchen“ findet passende Dateien anhand des Inhaltsfingerabdrucks;
  beim Anzeigen einer Liste wird dieser Ordner nicht automatisch durchsucht.

Die Katalogminiatur ist davon getrennt. Die Screenshots belegen deshalb keinen
Verlust durch zwei Kopien. Der Wiederimport „1 schon vorher da“ zählt einen bereits
bekannten Katalogeintrag: Die native Originalspeicherung erfolgt vorher trotzdem.
Eine Diagnose mit tatsächlich ausgeführtem Dateiimport und simulierter nativer
Ablage bestätigt bytegenaue Wiederherstellung, einen Katalogeintrag und sofortigen
lokalen Status in beiden Ansichten, auch nach einem Neustart. Das ist keine
Fernprüfung der Dateien auf Klaus' SD-Karte.

## Windows

Windows wird von der veröffentlichten .29 auf die öffentliche Version 1.0.36 gebracht. App-Kennung,
Installationsziel pro Benutzer, Datenpfade und Passwortformat bleiben erhalten.
Die neue Installationsprobe verwendet den gepinnten öffentlichen .29-Installer,
prüft die Überinstallation, Originalbytes, Katalog, Einstellungen, verschlüsselte
Sicherung und Entsperren nach Kaltstart. Ein Ergebnis wird erst nach dem tatsächlichen
Windows-Lauf eingetragen. Der Installer bleibt wie bisher unsigniert.

## Prüfstand

Die endgültigen CI-Läufe, Downloadgrößen, Prüfsummen und Updatebelege werden nach
der tatsächlichen Veröffentlichung ergänzt. Physisches Samsung Tab S6/DeX und
reale SD-Zugriffe können hier nicht vermessen werden. Der V3-Vergleich bleibt eine
Designreferenz; sein separates Repository und die 22 geschützten Module bleiben
unverändert.
