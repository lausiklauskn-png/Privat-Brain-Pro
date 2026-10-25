# Gemeinsame Dateivorschau und öffentliche Version 1.0.36

Diese Seite dokumentiert die unverändert veröffentlichte 1.0.36.
Aktuell: [Startkorrektur 1.0.37 mit Android, Windows und PWA](STARTDARSTELLUNG-37.md).

Stand: 25.10.2026, **Android und Windows 1.0.36 sind veröffentlicht**.
[Signierte Update-APK](https://github.com/lausiklauskn-png/Privat-Brain-Pro/releases/download/v1.0.36/Private-Brain-Pro-1.0.36.apk) · [Windows-x64-Setup](https://github.com/lausiklauskn-png/Privat-Brain-Pro/releases/download/windows-v1.0.36/Private-Brain-Pro-Windows-1.0.36-x64-setup.exe).
Die vorherige Android .35 bleibt unverändert veröffentlicht.

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
Sicherung und Entsperren nach Kaltstart. Diese tatsächliche Updateprobe ist
bestanden; der Installer bleibt wie bisher unsigniert.

## Prüfstand

- Quelle `a1bd98f40b0186c5a9a148dbd04d19979e6262c4`, PR #82 übernommen; Android-VersionCode 36, ursprüngliche Kennung und Signatur erhalten.
- Elf fachliche main-Prüfungen und separater Windows-Anforderungscheck erfolgreich: [android](https://github.com/lausiklauskn-png/Privat-Brain-Pro/actions/runs/40195090154), [windows](https://github.com/lausiklauskn-png/Privat-Brain-Pro/actions/runs/40195090159), [signing](https://github.com/lausiklauskn-png/Privat-Brain-Pro/actions/runs/40195090179), [pages](https://github.com/lausiklauskn-png/Privat-Brain-Pro/actions/runs/40195089234).
- [60 native Fälle](https://github.com/lausiklauskn-png/Privat-Brain-Pro/actions/runs/40195090154/job/121174098673) ohne Fehler oder Skips.
- Android-Release [40196553168](https://github.com/lausiklauskn-png/Privat-Brain-Pro/actions/runs/40196553168) vollständig erfolgreich: Build `121178509345`, signiertes Update .35 → 1.0.36 `121180739384`, Veröffentlichung `121181249305`. Seed/Baseline/Verify bestanden.
- Öffentliche APK unabhängig geladen: **18.671.196 Bytes**, SHA-256 `e32b9975c8c3b67749d182b79c618b92bc1741240d67e1ba3743aab9cbdaa9ad`. API-Digests, Tag/Quelle, öffentliche Identitätsquittung und ursprüngliche Zertifikatskennung im veröffentlichten Signaturbericht stimmen. Die kryptographische Signatur- und installierte Updateprüfung lief in CI; der lokale Prüfer vergleicht Bericht und Bytes.
- 44 native Dateien einschließlich des vorhandenen `native.js`-Versionsadapters, drei Mail-/Explorerressourcen, 39 OCR-Dateien, 29 OCR-Lizenztexte und 22 geschützte Module gegen Quelle/Pins geprüft.
- Die gebündelte Impressums-/Datenschutzseite entspricht ebenfalls der Quelle; veraltete Probeversions- und Browser-only-Aussagen sind entfernt.
- Gepackte native Startseite entspricht dem separat browsergeprüften Stand: `415f0c2abe9f5bf76e4fb321f48caa6ba769e9fced437a859ec39dd3fd11cc24`.
- Windows 1.0.36 ist zusätzlich veröffentlicht: [Setup](https://github.com/lausiklauskn-png/Privat-Brain-Pro/releases/download/windows-v1.0.36/Private-Brain-Pro-Windows-1.0.36-x64-setup.exe), echte installierte Übernahme .29 → 1.0.36 geprüft; der Installer bleibt unsigniert.

Physisches Samsung DeX, Klaus' Tab S6 und reale SD-Zugriffe bleiben ungemessen.

Quelle `a1bd98f40b0186c5a9a148dbd04d19979e6262c4`, PR #82 übernommen. [Windows-x64-Setup](https://github.com/lausiklauskn-png/Privat-Brain-Pro/releases/download/windows-v1.0.36/Private-Brain-Pro-Windows-1.0.36-x64-setup.exe)
über die vorhandene Installation installieren; Kennung `de.familyprojekt.privatebrain.pro`,
Installationsziel pro Benutzer, Datenpfade und Passwortformat bleiben erhalten.

- [Windows-main 40195090159](https://github.com/lausiklauskn-png/Privat-Brain-Pro/actions/runs/40195090159/job/121174098778) erfolgreich: Grundfunktionen, Neustart/Neuinstallation, echte Produktionsüberinstallation .29 → 1.0.36 und abschließende normale Installation ohne Prüfzugang.
- Die Updateprobe bestätigt vollständige Originalbytes, Katalog/Tags, RU-/Dunkel-Einstellung, Offlinezustand, PBV1-Katalogsicherung, DPAPI-Merken und Passwort-Entsperren nach Kaltstart. Zwischen alter und neuer Installation wurden die Testdaten nicht zurückgesetzt.
- Release [40196030462](https://github.com/lausiklauskn-png/Privat-Brain-Pro/actions/runs/40196030462) erfolgreich: Prüfung `121176929493`, Veröffentlichung `121177007769`. Der bereits abgenommene Installer wird unverändert veröffentlicht.
- Öffentlicher Download unabhängig geprüft: **58.666.597 Bytes**, SHA-256 `138bf5e8b4635e12bd87c70148c54539684c36fc130b7693913c8e4397bde091`. API-Asset-Digests, veröffentlichte Prüfsummen, Tag/Quelle und Bauquittung stimmen.
- Alle 24 ursprünglichen und erzeugten Java-Fingerabdrücke sowie fünf Abhängigkeiten gegen denselben Quellstand geprüft. Ausdrückliche Plattformadapter werden als solche geprüft und nicht fälschlich als bytegleich behauptet.
- Windows x64, NSIS pro Benutzer, `signing=unsigned`, `testEndpoint=false`. Keine Authenticode-Signatur behauptet; die lokale Byteprüfung führt den Installer nicht aus. Die tatsächliche Installation lief auf dem GitHub-Windows-Runner.

Klaus' eigener Windows-Rechner, gesprochenes Diktat und physisches Samsung DeX
gehören nicht zu diesen Nachweisen. [Maschinenlesbarer Nachweis](windows-1.0.36-pruefung.json).

[Android-Nachweis](android-1.0.36-pruefung.json),
[Windows-Nachweis](windows-1.0.36-pruefung.json).
Der V3-Vergleich bleibt eine Designreferenz; sein separates Repository und die
22 geschützten Module bleiben unverändert.
