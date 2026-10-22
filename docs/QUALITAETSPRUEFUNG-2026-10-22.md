# Qualitätsprüfung der bestehenden Pro-App

Ausgangspunkt: main `8dae28113f7fa19a4446406f492e0c307c4ef0cb` (Entwicklung .28),
zuletzt veröffentlichte Android-Vorschau bei Beginn der Prüfung .27.
Ein Windows-Host ist noch nicht gebaut; der vorhandene Windows-Brief ist ein
Bauauftrag für eine Folgesitzung, kein Installer. Die separate PWA liegt im
Repository Privat-Brain. iOS von Workflow PDF Pro ist auf Klaus' Wunsch geparkt.

## Behobene Speicherfehler

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
