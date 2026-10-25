# So veröffentlicht jede Sitzung (Claude oder Codex)

Android und Windows 1.0.37 sind veröffentlicht. Die gebaute PWA ist unter
[PWA öffnen](https://lausiklauskn-png.github.io/Privat-Brain-Pro/) erreichbar; der Pages-Workflow muss das vorbereitete
`www` veröffentlichen. Seine vier öffentlichen Kontroll-Dateien werden erst nach
Deployment gegen die Build-Hashes und dieselbe Generation geprüft. Eine erfolgreiche
Deployment-API-Antwort allein ist kein Inhaltsnachweis. [Aktueller Nachweis](design/umbau-2026-10-24/pwa-1.0.37-pruefung.json).

Stand: 2026-10-25. Die öffentliche Version 1.0.37 aktualisiert die bestehende
App. Die technische Kennung `de.familyprojekt.privatebrain.pro.preview` und genau
der bisherige Signierer bleiben erhalten. [Historische Schlüsselwiederherstellung](UEBERGABE-VORSCHAU-17.md).

Originaler Zertifikats-Pin:

`362ee70d28da9c4b51e37057c3519a3e6eb2c679059dfb9f56b4003f9374fa80`

## Einmalige sichere Einrichtung

Der vorhandene App-Signierschlüssel wird nach dem Vorbild Workflow-PDF-Pro
**ausschließlich verschlüsselt** im Repository gesichert. Build und Signierung
für `public` verwenden `PB_SIGNING_UNLOCK` in der bisherigen Identitätsumgebung
`android-preview`; sie verlässt GitHub Actions nicht. Der öffentliche Publishjob
benötigt getrennt die geschützte Freigabe von `android-production`. Es werden keine
Secrets kopiert und keine Freigaberegeln durch die Kanalbenennung entfernt. [Einzelschritte, Originalschlüssel-Suche und sicherer
Einweg-Import](SIGNIERUNG-UND-GITHUB.md).

Die Originalidentität wurde unverändert wiedergefunden und über PR #37/#38
verschlüsselt auf main gesichert. Der Identitätsworkflow auf main war erfolgreich
([39482529491](https://github.com/lausiklauskn-png/Privat-Brain-Pro/actions/runs/39482529491)).
Eine lokale Kopie oder Kenntnis der Passwörter ist für Veröffentlichungen nicht
mehr erforderlich. Keinen neuen Vorschau-Schlüssel erzeugen.

Das Repo enthält nach dem erfolgreichen Import `signing/android-release.enc.json`
(AES-256-GCM, Keystore samt beiden Passwörtern und Alias verschlüsselt) und den
öffentlichen Zertifikats-Pin. Release und Import verwenden ausschließlich
Actions. Beide Sitzungen benötigen für weitere Veröffentlichungen nur Push-
Recht; Environment-/Tag-Schutz und gegebenenfalls Reviewer bleiben verbindlich.
Die drei Workflowkanäle sind getrennt zu behandeln:

| Kanal | Zweck und Identität |
|---|---|
| `public` | Öffentliches stabiles Update der vorhandenen `.preview`-App, ursprünglicher Signierer, Tag wie `v1.0.37`, GitHub `prerelease=false`, signierte Updateprobe verpflichtend. Build/Signierung in `android-preview`; erst Publish wird in `android-production` freigegeben. |
| `test` | Historische Prereleaseausgaben derselben App mit `v…-preview.N`; ursprünglicher Signierer und signierte Updateprobe, Umgebung `android-preview`. |
| `stable` | Separates `.pro`-Produktionspaket mit anderer Kennung und eigener geprüfter Identität; kein Update der vorhandenen App. Seine Signierkonfiguration wird durch den Originalschlüssel für `public` nicht bereitgestellt. |

Der technische Name der Bauvariante `preview` bleibt für `public` erhalten. Die
veröffentlichte App heißt Private Brain Pro und hat keinen Probeversionszusatz.

## Jede weitere öffentliche Aktualisierung

1. `versionCode` und `versionName` in `android/app/build.gradle` erhöhen; den
   bestehenden Paketnamen und Signierer erhalten.
2. PR erstellen, vollständige CI einschließlich `native-smoke` abwarten und mergen.
3. Die fachlichen Prüfungen desselben tatsächlichen main-Quellstands erfolgreich
   abschließen. Keine Tags auf einen ungeprüften oder anderen Quellstand verschieben.
4. **Signierte Android-Veröffentlichung** auf `main` mit `channel=public`, dem zur
   `versionName` passenden neuen Tag (z. B. `v1.0.37`) und dem geprüften vollständigen
   `source_commit` starten. `dry_run=true` erzeugt nur einen prüfbaren Bau.
5. APK-Signatur, ursprüngliche Identität, steigenden VersionCode und echte signierte
   Überinstallation ohne Deinstallation bestehen lassen. Erst danach den getrennten
   öffentlichen Publishjob freigeben. Die Veröffentlichung ist kein Prerelease.
6. Öffentliche APK, `SHA256SUMS`, `SIGNATUR.txt` und `ANDROID-IDENTITY.json` unabhängig
   herunterladen und gegen Quelle/Identität/Digests prüfen. Run, Updatebeleg,
   Downloadlink und SHA-256 in Prüfstand und Sitzungsanker festhalten.

Historische `test`-Ausgaben können weiterhin den bisherigen `v…-preview.N`-Tagweg
nutzen. Der separate Kanal `stable` gehört zu einer anderen Paketidentität und
ist nicht der Aktualisierungsweg dieser vorhandenen Installation.

Der Ablauf verweigert einen Commit außerhalb der main-Historie, fehlenden grünen
nativen Starttest, abweichenden Versionsnamen, falsches Zertifikat, falsche
Paketkennung, Debug-Flag, falschen Appnamen oder eine nicht erhöhte Versionsnummer.
Die vorherige passende Veröffentlichung wird heruntergeladen und ihre tatsächliche
Paketkennung, Version und Signatur geprüft. Öffentliche Ausgaben tragen zusätzlich
`ANDROID-IDENTITY.json`; eine andere Paketlinie oder ein anderer Signierer darf
nicht als Baseline gewählt werden. Ältere Prereleases werden anhand der APK geprüft. Im frischen Emulator werden diese APK und die neue APK **ohne
Deinstallation dazwischen** installiert. Die getrennte, mit demselben Schlüssel
signierte Instrumentierungs-APK prüft synthetische verschlüsselte Kontodaten,
IndexedDB-Katalog, Sprache, Offline-Kaltstart, die neue Speicherort-Einstellung
und die echte Android-Ordnerauswahl. Sie wird niemals als Release-Datei verteilt.
Das ist keine Messung an Klaus' Tablet und kein echter Mailanbieter-Test.

Die Veröffentlichung verwendet zuerst einen Entwurf mit allen Dateien. Nach dem
Öffentlichschalten wird der öffentliche APK-Download bytegleich verglichen; die
Prüfsumme steht in der Laufzusammenfassung und in `SHA256SUMS`. Ein Fehler dieser
Nachkontrolle lässt den Lauf fehlschlagen; eine schon veröffentlichte Version wird
nicht automatisch gelöscht oder überschrieben.

## Manueller Probelauf und unveränderte .17

`workflow_dispatch` bleibt für Klaus in Actions verfügbar. `dry_run=true` führt
Signierung und Updateprobe aus, lässt die Veröffentlichung aus. Für einen
historischen, unveränderten main-Stand kann `source_commit` dessen vollen SHA
enthalten; `tag` muss zu dessen `versionName` passen. So lässt sich .17 aus
`eb800faf25676055a19a49eea83d0ba158e896ec` bauen, auch nachdem der neue Workflow
auf main gemergt wurde. Ohne diese Angabe gilt der ausgewählte Workflow-Commit.
Ein vorhandener Tag muss auf denselben Quellcommit zeigen.

**Wichtig für .17:** Ein neu hinzugefügter Tag-Auslöser wirkt nicht rückwirkend
auf einen Tag, dessen Commit noch die alte Workflow-Datei ohne Tag-Auslöser trägt.
Für genau `eb800fa` deshalb den neuen Workflow manuell mit `source_commit`
verwenden. Spätere Versionen können den normalen Tag-Weg nutzen.

## Warum derselbe App-Signierschlüssel?

Android verlangt für ein Update denselben Signierer. Mehrere gleichzeitige
Signierer lösen das nicht: Die bestehende Installation akzeptiert dadurch keine
beliebigen neuen Schlüssel. Ein späterer Wechsel wäre nur geordnet, etwa über
APK Signature Scheme v3 mit einer gültigen Signaturabfolge („key rotation“) und
dem alten privaten Schlüssel möglich. Ohne den alten Schlüssel lässt sich die
bestehende Installation nicht verlustfrei als gleich signiertes Update fortsetzen.

Aus einer APK kann das öffentliche Zertifikat gelesen werden, **nicht** der
private Schlüssel. Das fehlerhafte Secret oder eine verlorene Sitzungsdatei lässt
sich dadurch nicht ersetzen. Keinen neuen Vorschau-Schlüssel erzeugen.

## Historische Signierfehler und Wiederherstellung

Der ursprüngliche .17-Lauf `39461965718` scheiterte beim Lesen des Keystores
(„Tag number over 30 is not supported“). Die spätere Diagnose `39467301186`
meldete alle vier alten Secrets als nicht verfügbar. Der neue verschlüsselte
Weg ersetzt diese fehlerhafte Übergabe, kann den fehlenden privaten Schlüssel
aber nicht rekonstruieren. Der Original-Import und der anschließende Identitätsworkflow auf main sind
erfolgreich. Die tatsächliche signierte Updateprobe wird im jeweiligen
Veröffentlichungslauf gesondert nachgewiesen.
