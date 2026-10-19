# Private Brain Pro – Android

Eigenständige native Pro-App auf Basis der bestehenden Private-Brain-Oberfläche.
Die ursprüngliche PWA bleibt unabhängig im Repository `Privat-Brain` bestehen.

**Stand: Android-Grundversion im Aufbau, noch keine funktional freigegebene Testversion.** Suche, Dateiimport, Katalog und Postfachoberfläche
werden lokal mit Capacitor ausgeliefert. Direkte native IMAP-/SMTP-Verbindungen,
Keystore für Mailkonten, dauerhafter Geräteordnerzugriff und Hintergrundabruf sind
noch nicht implementiert. Kein Anspruch auf vollständige Funktionsgleichheit.
Die vorhandenen Mailprüfer sind kein Virenscanner.
Der native Starttest im lokalen Software-Emulator scheiterte im WebView-Renderer;
eine zuverlässige Hardware-/Geräteprüfung steht noch aus. Siehe [Prüfstand](docs/PRUEFSTAND-ANDROID.md). Modellgewichte fehlen noch;
Stichwortsuche ist verfügbar, echte e5-Modellqualität ist nicht nachgewiesen.

Das bestehende Design, Hell/Dunkel, DE/EN/RU/PL und die Original-Icons bleiben erhalten.
Die geschützten Prüfmodule werden bytegleich mitgeführt.

## Entwicklung ohne eigenen PC

GitHub Actions prüft den Code und erstellt Android-Build-Artefakte. Der Ablauf
„Signierte Android-Testversion oder stabile Version“ veröffentlicht nur nach
manuellem Start und mit sicher hinterlegtem Signierschlüssel. Kein automatisches
Verteilen jedes Commits. Details: [Android-Build und Signierung](docs/ANDROID.md).

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
./gradlew --no-daemon --max-workers=2 assembleDebug lintDebug
```

`www/` und die Android-Webressourcen werden aus einer ausdrücklichen Liste
öffentlicher Dateien erzeugt; Repository, Mailserver, lokale Daten und Schlüssel
werden nicht pauschal in die App gepackt. Native Assets aktualisiert Android,
kein PWA-Service-Worker. Für Release-Builds Web-Debugging deaktiviert, Klartext-HTTP
und beliebige Navigation mit Plugin-Zugriff nicht freigegeben. Es gibt noch keinen
privilegierten Mail- oder Dateizugriffs-Adapter.

Herkunft: [Ausgangsbasis](docs/PRO-AUSGANGSBASIS.md).
Vorherige PWA-Dokumentation: [PWA-README](docs/PWA-README.md).
Rechte: [LICENSE](LICENSE), [RECHTE.md](RECHTE.md).
Capacitor: MIT, Lizenztext im nativen Webpaket. Historische PDF-Testbibliotheken
liegen mit Lizenzen getrennt unter `tests/fixtures/Workflow-PDF` und werden nicht
in die App gepackt.
