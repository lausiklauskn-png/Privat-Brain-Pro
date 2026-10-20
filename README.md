# Private Brain Pro

Eigenständige Pro-App mit lokaler Suche, Dateiimport, Katalog und Postfach.
**Aktuell: .16 — [Android-APK herunterladen](https://github.com/lausiklauskn-png/Privat-Brain-Pro/releases/download/v0.1.0-preview.16/Private-Brain-Pro-0.1.0-preview.16.apk).** Über die vorhandene App
installieren; Paket und Signatur bleiben erhalten. Die Navigation zeigt kleine
Namen rechts neben Symbolen und passt sich zusammen mit Suche und Filtern an
schmale und breite Fenster an.

Die Oberfläche ist in Chromium, Firefox und WebKit für 280 bis 1920 Pixel und
vier Sprachen geprüft. Installierbar ist derzeit Android; es gibt noch keine
native iOS-/Windows-/macOS-/Linux-Ausgabe. Browser-Engine-Prüfungen ersetzen
keine Tests auf echten Geräten. Die ursprüngliche PWA im Repository `Privat-Brain`
bleibt unabhängig und unverändert.

Mailverbindungen laufen direkt vom Gerät. Anbieter und OAuth-Grenzen:
[Native Mail](docs/NATIVE-MAIL-ARCHITEKTUR.md). Die Regelprüfer sind kein
vollständiger Virenscanner. Modellgewichte fehlen noch; echte e5-Modellqualität
ist nicht nachgewiesen. [Bedienung und Plattformgrenzen](docs/BESCHRIFTUNGEN-UND-ORDNER.md),
[Prüfstand](docs/PRUEFSTAND-ANDROID.md#veröffentlichte-version-16--2026-10-20),
[synthetische Ansichten](docs/design/compact16/README.md).

Hell/Dunkel, DE/EN/RU/PL und die geschützten Prüfmodule bleiben erhalten.
Die Prüfmodule werden bytegleich mitgeführt; die Pro-Icons haben auf Nutzerwunsch
einen hellen Hintergrund.

## Entwicklung ohne eigenen PC

GitHub Actions prüft den Code und erstellt Android-Build-Artefakte. Der Ablauf
„Signierte Android-Testversion oder stabile Version“ veröffentlicht nach manuellem
Start oder einem Vorschau-Versions-Tag und nur mit dem sicher in GitHub
hinterlegten bisherigen Signierschlüssel. Kein automatisches Verteilen jedes
Commits. [Gemeinsamer Veröffentlichungsweg für Claude und Codex](docs/VEROEFFENTLICHEN.md),
[Android-Build und Signierung](docs/ANDROID.md).

Für eine Build-Umgebung mit Node 22+, JDK 21 und Android SDK 36:

```bash
npm ci --ignore-scripts
npm ci --prefix mail-service --ignore-scripts
export CB_CHROMIUM=/usr/bin/chromium
export WFPDF_KLON=tests/fixtures/Workflow-PDF
npm test
npm test --prefix mail-service
npm run sync:android
npm run test:native-web
cd android
./gradlew --no-daemon --max-workers=2 testDebugUnitTest assembleDebug lintDebug
```

`www/` und die Android-Webressourcen werden aus einer ausdrücklichen Liste
öffentlicher Dateien erzeugt; Repository, Mailserver, lokale Daten und Schlüssel
werden nicht pauschal in die App gepackt. Native Assets aktualisiert Android,
kein PWA-Service-Worker. Für Release-Builds Web-Debugging deaktiviert, Klartext-HTTP
und beliebige Navigation mit Plugin-Zugriff nicht freigegeben. Der Mailadapter erlaubt benannte Konto-/Postfachoperationen; Dateizugriff ist auf ausdrücklich freigegebene Originale und Android-SAF-Ordner begrenzt.

Herkunft: [Ausgangsbasis](docs/PRO-AUSGANGSBASIS.md).
Vorherige PWA-Dokumentation: [PWA-README](docs/PWA-README.md).
Rechte: [LICENSE](LICENSE), [RECHTE.md](RECHTE.md).
Capacitor: MIT, Lizenztext im nativen Webpaket. JavaMail/Activation: unveränderte
Originaltexte und Quellverweise unter `assets/licenses/mail.html`. Historische PDF-Testbibliotheken
liegen mit Lizenzen getrennt unter `tests/fixtures/Workflow-PDF` und werden nicht
in die App gepackt.
