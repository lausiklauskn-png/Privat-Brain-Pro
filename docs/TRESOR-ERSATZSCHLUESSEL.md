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

## Veröffentlichung und Nachweis

Vorschau .18 ist seit 2026-10-21 veröffentlicht: [APK herunterladen](https://github.com/lausiklauskn-png/Privat-Brain-Pro/releases/download/v0.1.0-preview.18/Private-Brain-Pro-0.1.0-preview.18.apk). Über die vorhandene App installieren, nicht deinstallieren. Vollständige Quell-CI 39508996409 mit 41 tatsächlich ausgeführten Android-Fällen ohne Fehler/Überspringen; signiertes Update .17 → .18 und öffentlicher Download durch Release 39510666137 erfolgreich geprüft. Die vorbereitete Schutzfunktion aus PR #44 ist in dieser Reparatur-APK nicht enthalten.

SHA-256: `6258bbb6d340b0e2404ff02c294bf011f4824b2cbfea5b6487ed8c102f803fa9`. [Alle Lauf-IDs und Prüfgrenzen](PRUEFSTAND-ANDROID.md#veröffentlichte-version-18--2026-10-21).

## Nicht neben den Tresor (gemeinsamer Tresor-Plan, Klaus 2026-11-03)

Befund auf Klaus' SD-Karte (3.11.): `PRIVATE-BRAIN-ERSATZSCHLUESSEL.txt` lag im Klartext direkt im gemeinsamen
Tresor („Privat Brain Pro Hauptablageordner“, neben `tresorordner.json`). Wer die Karte hat, hätte damit alles.

Jetzt prüft Android nach „Speichern unter“, **bevor** etwas geschrieben wird, ob der gewählte Ort im Speicherort-Baum,
in „…/Private Brain“, im Baum des gemeinsamen Tresorordners oder direkt neben „Private Brain“ liegt
(`OrdnerWahl.imTresor`, `ProFilesPlugin.nebenTresor`). Dann wird nichts geschrieben, die eben von Android angelegte
**leere** Datei wieder entfernt (nur wenn sie 0 Byte hat) und die Seite zeigt „Nicht neben den Tresor legen“ mit
**„Anderen Ort wählen …“** (öffnet das Speichern erneut mit denselben fünf Schlüsseln) oder **„Abbrechen“**
(nichts gesichert, Einrichtung bleibt gesperrt). Der bisherige Ablauf (Einrichtung erst nach erfolgreichem Export
und Bestätigung) bleibt unverändert.

Grenze, ehrlich: erkennbar nur auf Tablet-Speicher und SD-Karte (Anbieter `com.android.externalstorage.documents`,
Kennung „Speicher:Pfad“). Bei „Downloads“, Cloud-Speichern und anderen Anbietern trägt die Kennung keinen Pfad; dort
warnt die App nicht. Die Warnung nennt das selbst. Windows prüft das nicht (eigener Speichern-Dialog).
Proben: `tools/native/test-tresor-plan.mjs` (JVM `OrdnerWahlTest` + Browser), Gegenprobe `tools/native/gegenprobe-tresor-plan.mjs`.
Die Datei auf Klaus' Karte wird von der App nicht angefasst – verschieben oder ausdrucken und löschen tut Klaus selbst.
