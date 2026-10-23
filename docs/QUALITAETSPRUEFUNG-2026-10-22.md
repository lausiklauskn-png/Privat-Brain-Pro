# Qualitätsprüfung der bestehenden Pro-App

Ausgangspunkt: main `8dae28113f7fa19a4446406f492e0c307c4ef0cb`, inzwischen als
`v1.0.0-preview.28` veröffentlicht. Die öffentliche APK wurde erneut heruntergeladen:
SHA256SUMS, ZIP-Integrität, Paket/Version und ursprünglicher APK-v2-Signierer stimmen.
Der Windows-Bau ist seit Klaus' Auftrag vom 23.10.2026 ausdrücklich in Arbeit;
noch kein fertiger Installer. Die separate PWA liegt im
Repository Privat-Brain. iOS von Workflow PDF Pro ist auf Klaus' Wunsch geparkt.

## Behobene Speicherfehler

Zusätzliche Befunde vom 23.10.2026: Die alte schwebende Pinnwand erzeugte einen
zweiten Menüeintrag und reagierte vor der Klicksperre auf Zeigerereignisse. Im
nativen Bündel startet nur noch das freigeschaltete Werkzeug. Geschützte Module
und vorhandene Daten bleiben unverändert. 46 echte Werkzeug-/Freischaltungsfälle
bestanden; der neue Menüfall scheitert am ursprünglichen Stand.

Sind sämtliche Versionen eines Katalogs oder kleinen Tresordokuments beschädigt,
wurde bisher teilweise „nicht vorhanden“ gemeldet. Der gemeinsame Tresorkern
meldet nun `VAULT_DAMAGED`; eine intakte ältere Version bleibt der Rückfall.
Auf realen Desktop-Dateien vor dem Fix reproduziert und danach bestanden;
Android-Gegenprobe für den vollständig beschädigten Katalog ergänzt.

Die IndexedDB-Schreibhelfer meldeten bereits nach der einzelnen Anfrage Erfolg,
auch wenn die Transaktion danach abbrach. Katalogimporte schluckten Schreibfehler
und ergänzten trotzdem die Suche. Nun gilt erst transaction.oncomplete als Erfolg;
neue Einträge und Ergänzungen werden erst dann im Arbeitsspeicher übernommen.
Fehler werden sichtbar, bestehende Einträge bleiben erhalten, Wiederholen geht.

Beim Rückholen aus dem verschlüsselten Speicherordner wurden Katalog und
Deduplizierungsmenge vor dem Speichern ergänzt. Ein voller Speicher hinterließ so
einen nur scheinbar wiederhergestellten Eintrag, der den nächsten Versuch blockierte.
Auch hier wird jetzt zuerst gespeichert. Keine Änderung an PBV1, Android-Identität,
Version, Schlüsseln, geschützten Modulen oder Versandwegen.

## Nachweise

Sechs neue Gegenproben mit echter IndexedDB: Abbruch nach erfolgreicher Anfrage
bei put/delete/clear, fehlgeschlagener Import eines neuen Eintrags, fehlgeschlagene
Ergänzung und erfolgreiches Wiederholen samt Neustart. Die vorherige Fassung
scheitert an der falschen Erfolgsmeldung, die Korrektur besteht.

Die native Browserprobe `tools/native/test-vault.mjs` ergänzt einen Speicherfehler
beim Wiederherstellen und einen erfolgreichen zweiten Versuch mit Neustart:
34 Aussagen bestehen, native Plugins dabei ausdrücklich gestellt. Die vollständige
bestehende Browserkette ist zusätzlich ohne Fehler ausgeführt. Android-Java,
Emulator und Browser-Engines werden gesondert in der vorhandenen CI geprüft;
eine Browserprobe ist keine Abnahme auf Klaus' Gerät.

Keine Veröffentlichung durch diese Qualitätsprüfung starten. Parallel laufende
Veröffentlichungen und neue main-Commits anderer Sitzungen vor Übernahme prüfen.
