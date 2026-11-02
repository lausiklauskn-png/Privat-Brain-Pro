# Freiwillige Zusammenarbeit mit Familienakte und den Pro-Apps

Bauabschnitt vom 2026-11-02, aufbauend auf dem dauerhaften Eingang aus PR #123
(Merge `268d104`). Der Gesamtauftrag einschließlich Workflow-Gegenstelle,
Familienakte-Geräte-/Modellwahl, Transport und App-Updates ist noch offen.
Das Geschenk-HTML folgt erst nach dem vollständigen Bau.

In **Einstellungen → Tresor & Ablage → Zusammenarbeit mit Pro-Apps** lässt sich
auf Android und Windows ein gemeinsamer Pro-Tresor auswählen, öffnen und sperren.
Die eigene Private-Brain-Ablage muss dafür weder eingerichtet noch umgezogen
werden. Einzug der eigenen Ablage bleibt eine separate ausdrückliche Wahl.
Passwörter und gemerkte Schlüssel bleiben in der nativen Schicht: Android
Keystore beziehungsweise Windows DPAPI. Die PWA bietet diesen nativen Weg nicht an.

**Eingang prüfen und übernehmen** nimmt ausgewählte Dateien aus dem gemeinsamen
Eingangsfach über den normalen Datei-/Mailimport auf. Die Grenze beträgt 20 MiB
je Datei. Native Originalbytes werden erneut gelesen und geprüft; erst nach
abgeschlossenem Katalogimport und gespeicherter Quittung schreibt die App die
kanonische Empfängermarke. Fehler und Abbrüche lassen die Quelle offen.
Wiederholen nach Neustart erzeugt keinen zweiten Katalogeintrag.

In der geöffneten Datei führt **An Pro-App …** zur Auswahl von Familienakte Pro,
Workflow PDF Pro oder BookLedgerPro. Workflow nimmt PDF/Bilder, BookLedger
zusätzlich EML, Familienakte die durch ihren Eingang unterstützten Dateien an.
Der Ausgang erhält vor dem Schreiben eine stabile Kennung. Offene Übergaben
lassen sich in den Einstellungen erneut senden. **Weitergegeben – Übernahme offen**
wird erst nach **Bestätigungen prüfen** und einer tatsächlich vorhandenen
Empfängermarke zu **Im Eingang der Ziel-App**. Endgültige Einordnung in eine Akte
oder Buchung wird damit nicht behauptet. Originale und gemeinsame Quellen bleiben
bestehen; veränderte Rückgaben erhalten neue Kennungen mit Bezug zur Quelle.

Die kleine lokale Tabelle `proUebergaben` ergänzt die bestehende Datenbank durch
Versionsanhebung 1 → 2; Datenbankname, Katalog und Ordner bleiben erhalten.
Quittungen werden in die bestehende verschlüsselte Katalogsicherung aufgenommen.
Wiederherstellung prüft Verträge und abgeleitete Kennungen und ergänzt sie in einer
Transaktion; widersprüchliche vorhandene Quittungen werden nicht überschrieben.
Kein Tresorpasswort oder Hauptschlüssel gehört in diese Metadaten.

## Umsetzung und Prüfgrenzen

- `ProVerbund.java` ist der gemeinsame Android-/Windows-Adapter des bereits
  gepinnten Pakets `de.familyprojekt.tresor`. Kein neues Verschlüsselungsformat.
- `ProTresorordner` verwendet bestehende SAF-Freigaben; `DesktopProTresor` ergänzt
  dieselben Vorgänge hinter der privaten Windows-Prozessbrücke. Ersatz eines
  ausgewählten Ordners und fremde Tresorkennungen werden abgewiesen.
- Browserprobe: 34 Fälle mit echter IndexedDB und gewöhnlichem Import, darunter
  Datenbankupgrade, Neustart, volle/fehlende Ablage, Transaktionsabbruch,
  veränderte Bytes/Verträge, zweiter Tresor, Quellbezug, Sicherung und Rücknavigation.
  Native Datei-/Dialogschnittstellen sind dort ausdrücklich Testadapter.
- Sechs absichtliche Fehler in Wegwerfkopien müssen durch die zugehörigen
  Verhaltensprüfungen auffallen: vorgezogener Schreibabschluss, vorzeitige
  Empfängermarke, Sitzungsdatei statt frischer Speicherprüfung, Zustellung als
  Bestätigung, fehlende Sicherungsquittungen, Überschreiben bei Wiederherstellung.
- Windows-Java-Engine: 113 bestehende Fälle plus 15 Fälle mit tatsächlichem
  kanonischen Familienakte-Akteur, Originalspeicher und Neustart. Der Test der
  unabhängigen App-Ablage läuft in einem frischen Prozess.
- Neu ergänzt: Android-Instrumentierung mit echtem SAF, Keystore und FPT1;
  Abnahme in der installierten Windows-App einschließlich nativer Dialoge,
  tatsächlicher Rückgabe und DPAPI-Erhalt nach Neustart/Neuinstallation.
  Diese Plattformprüfungen müssen vor der Übernahme vollständig bestehen.

Der lokale vollständige Webbau wird in dieser Cloud durch HTTP 403 beim bestehenden
Anleitungsvideo blockiert. Gezielte Browserproben verwenden die erzeugten Dateien
und vorhandenen lokalen Adapter; das ist kein vollständiger Paketnachweis. Der
reguläre GitHub-Bau lädt und prüft das vollständige Paket. Keine echte zweite APK,
kein physisches Tablet/USB-/SD-Laufwerk und kein Nutzer-Windows-Gerät sind mit
Java-Gegenakteuren oder Browseradaptern nachgewiesen. Es gibt hier noch keinen
neuen App-Release.
