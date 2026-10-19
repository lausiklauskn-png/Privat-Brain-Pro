# Private Brain Pro – Android

Eigenständige native Pro-App auf Basis der bestehenden Private-Brain-Oberfläche.
Die ursprüngliche PWA bleibt unabhängig im Repository `Privat-Brain` bestehen.

**Stand: Erste signierte Android-Grundversion 0.1.0-preview.2 veröffentlicht.**
[Test-APK herunterladen](https://github.com/lausiklauskn-png/Privat-Brain-Pro/releases/download/v0.1.0-preview.2/Private-Brain-Pro-0.1.0-preview.2.apk).
Suche, Dateiimport, Katalog und Postfachoberfläche
werden lokal mit Capacitor ausgeliefert. Direkte native IMAP-/SMTP-Verbindungen,
Keystore für Mailkonten, dauerhafter Geräteordnerzugriff und Hintergrundabruf sind
noch nicht implementiert. Kein Anspruch auf vollständige Funktionsgleichheit.
Die vorhandenen Mailprüfer sind kein Virenscanner.
Der native Starttest einschließlich Java-Brücke ist im hardwarebeschleunigten
GitHub-Emulator bestanden. Der Sichttest am Tablet steht aus; der historische lokale
Software-Emulatorfehler ist im [Prüfstand](docs/PRUEFSTAND-ANDROID.md) dokumentiert. Modellgewichte fehlen noch;
Stichwortsuche ist verfügbar, echte e5-Modellqualität ist nicht nachgewiesen.

Das bestehende Design, Hell/Dunkel, DE/EN/RU/PL und die 3D-Bubbles bleiben erhalten. Die Pro-Icons erhalten auf ausdrücklichen
Nutzerwunsch einen hellen Hintergrund; das unterscheidet sie von der PWA.
Die geschützten Prüfmodule werden bytegleich mitgeführt.

Die nächste Vorschau 0.1.0-preview.3 ergänzt eine manuell ausgelöste Versionsprüfung
in den Einstellungen; sie wird separat getestet und veröffentlicht. Die Planung
für direkten Mailzugriff steht in [Native Mail](docs/NATIVE-MAIL-ARCHITEKTUR.md).

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
./gradlew --no-daemon --max-workers=2 testDebugUnitTest assembleDebug lintDebug
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
