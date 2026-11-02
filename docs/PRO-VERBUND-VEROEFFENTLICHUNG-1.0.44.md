# Private Brain Pro 1.0.44 veröffentlicht

Android und Windows sind seit dem 2. November 2026 aus dem geprüften Quellstand
`1da44dee7171d2f998a06047e8c05c181752c320` verfügbar. Klaus hat den Familienakte-Verbund,
die geprüften Übernahmen und die Veröffentlichungen einschließlich Windows freigegeben.

- [Android-Update](https://github.com/lausiklauskn-png/Privat-Brain-Pro/releases/download/v1.0.44/Private-Brain-Pro-1.0.44.apk):
  61.060.619 Bytes, SHA-256 `3a48c70d94cdced23cc8a0c270108f4aef9f16e329e62a6bf23b90a5052f53cc`.
- [Windows-x64-Setup](https://github.com/lausiklauskn-png/Privat-Brain-Pro/releases/download/windows-v1.0.44/Private-Brain-Pro-Windows-1.0.44-x64-setup.exe):
  101.319.804 Bytes, SHA-256 `686c02c7fcf6eaec699d95d98410a4855c3a7fa3b9c8ce757599d5be1ade32c7`.

Die freiwillige Zusammenarbeit mit Familienakte, Workflow PDF Pro und BookLedgerPro
nutzt den vorhandenen gemeinsamen Tresor. Originale bleiben erhalten; erst die dauerhaft
aufnehmende App bestätigt den Eingang. Bedienung: [Pro-Verbund](PRO-VERBUND-NATIV.md).
Die eigene Private-Brain-Ablage bleibt eine separate Wahl. PWA und alte Varianten werden
nicht mit dem nativen Tresoranschluss gleichgesetzt.

## Nachweise

- Main-Android `41423423436`, Main-Windows `41423423431` und Signierprüfung `41423423425` bestanden.
- [Android-Veröffentlichung 41508739185](https://github.com/lausiklauskn-png/Privat-Brain-Pro/actions/runs/41508739185)
  bestand einschließlich der signierten Updateprobe mit vorhandenen Daten, Sprache,
  Offline-Kaltstart und Speicherort. Die öffentliche APK wurde anschließend anonym
  heruntergeladen; Größe und SHA-256 stimmen mit dem veröffentlichten Asset überein.
- [Windows-Veröffentlichung 41508795969](https://github.com/lausiklauskn-png/Privat-Brain-Pro/actions/runs/41508795969)
  übernimmt den bereits installierten und abgenommenen Produktionsinstaller unverändert.
  Die CI hat die öffentlichen Dateien erneut geladen und ihre Prüfsummen verglichen.
  Das Setup bleibt wie bisher unsigniert und enthält keinen Prüfendpunkt.
- [Paar-Abnahme in Familienakte 41506243317](https://github.com/lausiklauskn-png/Meine-Familienakte/actions/runs/41506243317):
  Android-Job `125488987065` und Windows-Job `125490024310` bestanden jeweils sechs
  Prüfabschnitte mit zwei tatsächlich installierten Apps: kalter/warmer Eingang,
  zwei Originale, Wiederholung, Neustart, Rückgabe und echte Empfängermarken.
  Die Android-Probe lief unter API 35, Windows auf GitHub-CI. Aktivierte Prüfzugänge
  der Probe sind kein Bestandteil der veröffentlichten Auslieferungsfassungen.
  Partner-Pin `326dc3d4ba1c709c0f818247e01bfb383c063ad3` und veröffentlichter Mergecommit
  haben denselben Git-Baum `928fe3f40b230469052c1df25503405cc52ddec9`.

[Maschinenlesbarer Veröffentlichungsnachweis](PRO-VERBUND-VEROEFFENTLICHUNG-1.0.44.json).
Persönliche Tablets, SD-/USB-Laufwerke, Scanner und der Nutzer-PC werden anschließend
mit den Familienakte-Praxisbögen geprüft. Der Gesamtabschluss und das Geschenk gehören
zum übergreifenden Familienakte-Auftrag; dieser Nachweis schließt dessen andere Arbeiten
nicht vorzeitig ab. Diese bereits veröffentlichten Versionen nicht erneut auslösen.
