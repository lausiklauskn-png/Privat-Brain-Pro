# Dauerhafter Teileingang – Bauabschnitt vom 2. November 2026

Android und Windows behalten erfolgreich kopierte, noch nicht übernommene Dateien
im privaten Ordner `shared-in`. Dateibytes und eine abgeschlossene Beschreibung
werden vor der Aufnahme in die Warteschlange geschrieben. Ein Neustart stellt
Kennung, Name, Typ und Größe wieder her. Beschädigte oder unvollständige Dateien
werden nicht als erfolgreich übernommen gemeldet. Grenzen: 30 wartende Dateien,
200 MiB je nativer Quelle und insgesamt 512 MiB einschließlich unvollständiger Kopien.

Die normale Importfunktion bestätigt eine geteilte Datei erst nach abgeschlossenem
Katalogschreiben und erneutem Lesen der nativen Originalkopie mit SHA-256-Prüfung.
Eine Datei im Sitzungsspeicher ist kein Speichernachweis. Mailimport und ausgewählte
Anhänge benutzen denselben Weg; Fehler bei Katalogschreibvorgängen werden nicht
mehr zu einer erfolgreichen Mailübernahme. Die rohe E-Mail-Datei ist auch nach
Neustart über ihre gespeicherte Originalkennung erreichbar.

Unter „Dateien hinzufügen“ bleiben abgewiesene oder fehlgeschlagene Dateien sichtbar.
„Erneut versuchen“ benutzt dieselben wartenden Quellen. „Aus Eingang entfernen“
verlangt eine ausdrückliche Bestätigung und entfernt nur diese Eingangskopie.
Die Quelle in der sendenden App bleibt erhalten. Ohne passenden Rückkanal ist
Androids Teilen-Auswahl weiterhin kein Nachweis der Übernahme in Private Brain.

Dieser Abschnitt ergänzt den kanonischen Tresorstand aus Workflow PDF Pro
`f3569f0d835fb31194b94dab6eb0eb4af7cfc51a` mit dem gemeinsamen Übergabevertrag und
`eingang-private-brain`. Die eigenständige Bedienung der Pro-Hin-/Rückwege und
der Windows-Anschluss des gemeinsamen Tresors sind damit noch nicht abgeschlossen.
Keine neue Appversion oder Geschenkdatei wird mit diesem Abschnitt ausgeliefert.

Prüfstand vor der CI: 10 Java-Eingangsfälle, 31 Browserfälle mit echtem Katalogimport
und ausdrücklich simulierten nativen APIs, vier erkannte absichtliche Verfälschungen,
113 Windows-Engine-Fälle auf echten temporären Dateien; Betriebssystemschutz ist
dabei ein Testanbieter. Die vorhandenen Original-/Fortschritts-/Tresoroberflächen
bestehen mit 21/6/38 Fällen. Die gesamte Web-Suite deckte außerdem einen nach
verweigerter Freigabe gesperrt bleibenden Auswahlknopf auf; nach Korrektur bestehen
52 Ablage-, 46 Postfach- und 37 Live-Mail-Fälle. Der vollständige lokale Paketbau
ist durch den gesperrten Download des gepinnten Anleitungsvideos begrenzt; die
Import-Browserproben verwenden die davor erzeugte Oberfläche ohne dieses Video.
Vollständige native Pakete und installierte Windows-App werden separat in CI geprüft.
Kein Test auf Klaus' physischem Gerät wird daraus abgeleitet.
