# Ersatzschlüssel des Tresors unter Android

Die fünf Shamir-Ersatzschlüssel des Bereichs **Tresor — Verschlüsselung**
stellen mit drei beliebigen zusammengehörigen Anteilen dessen Passwort wieder her.
Sie gelten **nicht** für das getrennte Passwort unter **Speicherort und
Verschlüsselung** (Tablet/SD-Karte). Dessen Wiederherstellungsgrenzen bleiben
in `SPEICHERORT-UND-TRESOR.md` beschrieben.

## Reparatur für Vorschau .18

Der bisherige Dialog erzeugte die fünf Anteile, blendete danach aber nur einen
Downloadknopf ein. Der Download verwendete eine Blob-URL mit HTML-`download`;
der Android-WebView fehlte dafür eine Speicheranbindung. Der vorhandene
PWA-Bedientest bestätigte bisher nur die Sichtbarkeit der Sicherungsoption,
nicht das tatsächliche Herunterladen und Wiederverwenden ihrer Datei.

Im nativen Paket öffnet **Ersatzschlüssel erzeugen & sichern** jetzt nach der
Erzeugung den Android-Dialog **Speichern unter** (`ACTION_CREATE_DOCUMENT`).
Dort einen lokalen Speicherort und Dateinamen bestätigen. Erst wenn Schreiben
und Schließen der Datei erfolgreich waren, wird die Bestätigung der Sicherung
freigegeben. Die Datei enthält alle fünf Anteile; diese anschließend getrennt
und sicher aufbewahren. Drei Anteile reichen zum Wiederherstellen des Passworts.
Die Schlüssel nicht im Chat oder in Screenshots teilen.

Bei Abbruch oder Schreibfehler bleiben Sicherungsbestätigung und Einrichtung
gesperrt; **Ersatzschlüssel herunterladen** versucht das Speichern derselben
Anteile erneut. Eine Passwortänderung verwirft die alten Anteile im offenen
Einrichtungsdialog und verlangt neue Erzeugung und Sicherung.

Der Export schreibt nur in die vom Nutzer gewählte Dokument-URI. Es werden
keine Schlüssel-Cachedateien, allgemeinen Speicherrechte oder dauerhaften
URI-Freigaben angelegt. Die native Exportkopie im RAM wird danach gelöscht;
Capacitor-Protokollierung bleibt deaktiviert. Passwörter und Anteile werden
nicht in localStorage oder Protokolle geschrieben. Die bestehende
Shamir-/Verschlüsselungsimplementierung und die unabhängige PWA sind unverändert;
die Anpassung erfolgt ausschließlich beim Erzeugen des nativen Webpakets.

## Prüfungen

`node tools/native/test-recovery.mjs` prüft mit synthetischem Passwort und
simulierter Dokumentanbindung echte Shamir-Erzeugung, alle zehn Dreierkombinationen,
Ablehnung von zwei Anteilen, Abbruch, Schreibfehler, unveränderte Anteile beim
Wiederholen, Passwortwechsel und tatsächliche Tresor-Wiederherstellung aus den
exportierten Anteilen. Keine echten Nutzerpasswörter oder Schlüssel nötig.

Der Android-Test
`NativeStartupTest.recoveryKeysRequireACompletedDocumentSaveAndCanRecoverTheVault`
prüft die echte Java-Brücke, das Speicher-Intent, Abbruch und Wiederholung sowie
die wirklich geschriebene Datei über Androids ContentResolver. Der Dateidialog
wird dabei durch einen Instrumentierungsmonitor beantwortet; als gewählte
Dokument-URI dient ein isolierter Testdatei-Provider. Aus den gespeicherten
Anteilen wird der konfigurierte Tresor wieder entsperrt. Das ist kein Test an
Klaus' Tablet oder an dessen SD-Karte. Der Ergebniswächter verlangt die tatsächliche
Ausführung dieses Falls; fehlende/übersprungene Tests zählen nicht als Erfolg.
