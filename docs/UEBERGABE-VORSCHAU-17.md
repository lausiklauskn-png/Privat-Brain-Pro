# Übergabe an die Sitzung mit dem bisherigen Vorschau-Keystore

2026-10-20 · Repository `lausiklauskn-png/Privat-Brain-Pro`

## Was noch gebraucht wird

Die ursprüngliche Schlüsseldatei finden, mit der die veröffentlichten Vorschauen
bis .16 signiert wurden. Erwartetes öffentliches Zertifikat (SHA-256):

`362ee70d28da9c4b51e37057c3519a3e6eb2c679059dfb9f56b4003f9374fa80`

Keinen Ersatzschlüssel erzeugen, keine Paketkennung ändern. Aus der veröffentlichten
APK lässt sich der private Schlüssel nicht zurückgewinnen.

Die Datei samt Alias und Passwörtern **dauerhaft in GitHub hinterlegen**, im
Repository unter Settings → Environments → `android-preview` → Environment secrets:
`ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`,
`ANDROID_KEY_PASSWORD`. Base64 genau einmal, eine Zeile ohne Kopf-/Fußzeilen.
JKS oder PKCS12 unverändert lassen. Werte niemals in Git, Chat oder Logs ausgeben.
Eine getrennte sichere Offline-Sicherung für Klaus ermöglichen; GitHub-Secrets
sind nach dem Speichern nicht wieder auslesbar. Die Sitzung darf nicht die einzige
verbleibende Ablage sein.

## Aktuell belegter Stand

- Anwendungsstand für .17 bleibt genau
  `eb800faf25676055a19a49eea83d0ba158e896ec` (versionCode 17).
- CI `39458924438` ist laut GitHub-API erfolgreich auf genau diesem Commit.
- Öffentliche .16 heruntergeladen und Signatur bestätigt. Ihre APK-SHA-256 ist
  `2e3e6b4d6e8e8307648359b55fca12b5cc205940e78406eeca3f28e5da010eab`.
- Ursprünglicher Release-Lauf `39461965718` scheiterte im APK-Build.
- Neuer sicherer Probelauf `39465502932` mit unverändertem .17-Quellstand und
  `dry_run=true` scheiterte bereits bei „Vorhandenen Signierschlüssel laden und
  Alias prüfen“. Keine signierte Updateprobe und keine Veröffentlichung.
- Zugriff dieser Integration auf GitHub-Environment-Secrets: HTTP 403
  „Resource not accessible by integration“. Die allgemeinen Repository-Rechte
  und ein erfolgreicher Workflow-Start ändern diese getrennte Beschränkung nicht.

- Präzisere Diagnose `39467024662`: Mindestens eines der vier Signier-Secrets
  fehlt im Job. `android-preview` hat laut API keine Freigabe- oder Branchregeln.
  Zunächst die vier Secret-Einträge und deren Verfügbarkeit wiederherstellen.
  Der Workflow diagnostiziert danach gegebenenfalls eine einzelne zusätzliche
  Base64-Schicht innerhalb GitHubs, mit zwingender Zertifikats-/Privatschlüsselprüfung.
- Der Job `upgrade-probe-smoke` in Lauf `39465837921` bestand mit der Debug-App;
  der Gesamtlauf wurde später durch einen Folgecommit abgebrochen. Das bestätigt
  die Instrumentierung, keinen signierten .16→.17-Versionswechsel.

- Diagnose `39467301186` benennt inzwischen **alle vier** oben genannten Secrets
  als im Job nicht verfügbar. Das ist der konkrete aktuelle Blocker. Ihr Fehlen
  ist von der älteren Meldung über eine unlesbare Datei zu unterscheiden.

## Gemeinsamer Veröffentlichungsweg

[PR #35](https://github.com/lausiklauskn-png/Privat-Brain-Pro/pull/35) ergänzt den
Tag-Auslöser, verbindliche Signatur-/Paket-/Versionsprüfungen und einen eigenen
Emulatorjob für das signierte Update vor der Veröffentlichung. Die neue
Instrumentierung hat außerdem eine unabhängige Debug-Funktionsprobe in der CI.
Lokale Web-/Mailtests, Android-Debug-Build/Lint, 8 Unit-Tests und die Kompilation
der Instrumentierung sind bestanden. Den aktuellen PR-/CI-/Merge-Stand vor dem
Fortsetzen neu prüfen; Vorbereitung bedeutet noch keine erfolgreiche Freigabe.

Nach korrekter Hinterlegung zuerst einen Probelauf von `android-release.yml`
starten: Kanal `test`, Tag `v0.1.0-preview.17`,
`source_commit=eb800faf25676055a19a49eea83d0ba158e896ec`, `dry_run=true`.
Er muss die gelesene Signatur, das signierte Update .16→.17 und die Erhaltung von
Sprache, Daten und synthetischem Konto im Offline-Kaltstart bestätigen.
Dann denselben Ablauf mit `dry_run=false` veröffentlichen lassen. Vorher PR #35
und dessen CI prüfen/mergen. Ein Tag direkt auf `eb800fa` verwendet noch den alten
Workflow ohne Tag-Auslöser; für genau diesen historischen Stand manuell starten.

Erst nach erfolgreicher Veröffentlichung die .17-Prüfsumme, APK-URL, Lauf-ID und
Updateprobe in `docs/PRUEFSTAND-ANDROID.md` und im oberen `CLAUDE.md`-Anker belegen.
Am Tablet ist Bauabschnitt 1 weiterhin nicht gemessen. Geschützte Module und die
unabhängige PWA bleiben unangetastet.

[Ausführliche Anleitung](VEROEFFENTLICHEN.md)
