# So veröffentlicht jede Sitzung (Claude oder Codex)

Stand: 2026-10-20. [Übergabe zur Schlüsselwiederherstellung](UEBERGABE-VORSCHAU-17.md). Die Vorschau behält die Paketkennung
`de.familyprojekt.privatebrain.pro.preview` und genau den bisherigen Signierer:

`362ee70d28da9c4b51e37057c3519a3e6eb2c679059dfb9f56b4003f9374fa80`

## Einmalige sichere Einrichtung

Der **vorhandene** Vorschau-Keystore gehört in GitHub unter diesem Repository →
Settings → Environments → `android-preview` → Environment secrets. Er gehört
nicht in eine eingecheckte Datei, einen Anhang, einen Sitzungsbericht oder ein Log.
Es werden vier Secrets benötigt:

- `ANDROID_KEYSTORE_BASE64`: unveränderte Schlüsseldatei, einmal Base64-kodiert,
  eine Zeile ohne Kopf-/Fußzeilen (`base64 -w0 private-brain.jks` unter Linux).
- `ANDROID_KEYSTORE_PASSWORD`: Passwort dieser Schlüsseldatei.
- `ANDROID_KEY_ALIAS`: vorhandener Alias des Vorschau-Schlüssels.
- `ANDROID_KEY_PASSWORD`: Passwort dieses privaten Schlüssels.

JKS und PKCS12 sind zulässig. Vor dem Hinterlegen müssen Datei und Alias mit
`keytool` lesbar sein und das obige Zertifikat liefern. Keine Passwortwerte in
Befehlszeilen, Chat, Git oder Logs eintragen. Die kodierte Datei ist genauso
geheim wie das Original. Eine getrennte, sichere **Offline-Sicherung** von
Keystore, Alias und Passwörtern für Klaus aufbewahren und die Wiederherstellbarkeit
prüfen. Ein GitHub-Secret lässt sich nach dem Speichern nicht wieder auslesen.

Der Signierschlüssel bleibt bei der Veröffentlichung in GitHub Actions. Sitzungen
mit Push-Recht benötigen keine lokale Schlüsselkopie. Repository-/Environment-
Regeln und gegebenenfalls Freigaben gelten weiterhin; Schreibrecht allein umgeht
keine geschützten Tags oder Environment-Reviewer.

## Jede weitere Vorschau

1. `versionCode` und `versionName` in `android/app/build.gradle` erhöhen.
2. PR erstellen, vollständige CI einschließlich `native-smoke` abwarten, mergen.
3. Auch den erfolgreichen `native-smoke` des tatsächlichen main-Commits abwarten.
4. Den Tag `v0.1.0-preview.N` exakt auf diesen main-Commit setzen und pushen.
5. `android-release.yml` signiert, prüft und veröffentlicht erst nach erfolgreicher
   Updateprobe als Pre-Release. Kein Signierschlüssel wird aus der Sitzung gesendet.
6. Release-Lauf, Updateprobe, APK-Link und öffentlich nachgeprüfte SHA-256 in
   `docs/PRUEFSTAND-ANDROID.md` und im oberen Anker von `CLAUDE.md` nachtragen.

Der Ablauf verweigert einen Commit außerhalb der main-Historie, fehlenden grünen
nativen Starttest, abweichenden Versionsnamen, falsches Zertifikat, falsche
Paketkennung, Debug-Flag, falschen Appnamen oder eine nicht erhöhte Versionsnummer.
Die vorherige veröffentlichte Vorschau wird heruntergeladen und ihre Signatur
geprüft. Im frischen Emulator werden diese APK und die neue APK **ohne
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

## Warum nur ein Vorschau-Schlüssel?

Android verlangt für ein Update denselben Signierer. Mehrere gleichzeitige
Signierer lösen das nicht: Die bestehende Installation akzeptiert dadurch keine
beliebigen neuen Schlüssel. Ein späterer Wechsel wäre nur geordnet, etwa über
APK Signature Scheme v3 mit einer gültigen Signaturabfolge („key rotation“) und
dem alten privaten Schlüssel möglich. Ohne den alten Schlüssel lässt sich die
bestehende Vorschau nicht verlustfrei als gleich signiertes Update fortsetzen.

Aus einer APK kann das öffentliche Zertifikat gelesen werden, **nicht** der
private Schlüssel. Das fehlerhafte Secret oder eine verlorene Sitzungsdatei lässt
sich dadurch nicht ersetzen. Keinen neuen Vorschau-Schlüssel erzeugen.

## Noch zu bestätigender Ausgangsstand

Der Nutzer meldete für .17 einen Fehler beim Lesen des GitHub-Keystores
(Lauf `39461965718`, „Tag number over 30 is not supported“). Das beweist allein
noch keine bestimmte Ursache wie doppelte Kodierung. Die Wiederherstellung der
vier Secrets und ein erfolgreicher signierter Lauf sind erforderlich. Ein
vorbereiteter Workflow oder bestandene Webprüfungen belegen dies nicht.
