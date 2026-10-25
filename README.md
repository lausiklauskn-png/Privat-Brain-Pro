# Private Brain Pro

Eigenständige Pro-App mit lokaler Suche, Dateiimport, Katalog und Postfach.
**[Android .35 als Update herunterladen](https://github.com/lausiklauskn-png/Privat-Brain-Pro/releases/download/v1.0.0-preview.35/Private-Brain-Pro-1.0.0-preview.35.apk).
[Windows .29 veröffentlicht](https://github.com/lausiklauskn-png/Privat-Brain-Pro/releases/tag/windows-v1.0.0-preview.29).**
Android .35 strafft Trefferkarten mit lokalen Bild-/PDF-Vorschauen und einer
kompakten Typ-/Tag-/Pfadzeile. Der ganze Pfad erscheint bei Hover, Fokus oder Tippen.
Das Suchintro entfällt, Maus-/DeX-Buttons bleiben auch in schmalen Fenstern flach,
und zusätzliche Ablagekopien lassen sich im gespeicherten Ordner wieder einschalten.
[Bedienung und Grenzen](docs/design/umbau-2026-10-24/ERGEBNISSE-35.md).
Android .34 schafft mehr Platz für Suchtreffer: direkte Hauptbereiche,
Farbpalette, Sprachcode, kurze Infohilfen und kompakte Einstellungen.
Unter Android ab Version 10 lassen sich tatsächliche Dateikopien nach
Ordnerfreigabe, Inhaltsprüfung und konkreter Bestätigung bereinigen;
mindestens eine erneut geprüfte Kopie bleibt erhalten.
[Bedienung und Grenzen](docs/design/umbau-2026-10-24/SUCHE-34.md),
[Werkzeugzugänge](docs/design/umbau-2026-10-24/WERKZEUGE-34.md).
Android .33 ergänzt echte lokale Texterkennung für Bilder und gescannte
PDF-Seiten in Deutsch, Englisch, Russisch und Polnisch. Erkannter Text steht
Suche und Inhaltsprüfung zur Verfügung; vorhandene Originale lassen sich über
„Erneut prüfen“ ergänzen. OCR-Laufzeit und Sprachdaten sind enthalten, ohne
KI-Schlüssel oder Dokumentübertragung. [Bedienung und Grenzen](docs/NATIVE-TEXTERKENNUNG.md).
Android .32 ergänzt einheitliche Liniensymbole, verstellbare Datei-/Mailbereiche,
Erklärungen hinter Info-Buttons und sofortige Wartepunkte. Öffnen und Teilen
wartet nicht mehr hinter PDF-Seitenberechnungen; gespeicherte PDFs vermeiden eine
unnötige vollständige Bridgekopie. [Bedienung und Nachweise](docs/design/umbau-2026-10-24/NACHBESSERUNGEN-32.md).
Automatische lokale Mailübersetzung (DE/EN/RU/PL), unabhängige Eingabesprache,
Mikrofone und automatisches Telefon-/Tablet-Hochformat aus .31 bleiben erhalten.
Eine Messung auf einem echten Samsung-DeX-Gerät steht aus.
[Übersetzung einrichten](docs/NATIVE-LOKALE-UEBERSETZUNG.md).
Themenwahl: **Farbpalette neben dem Einstellungszahnrad**.
[Umbau, Vorschläge und Prüfnachweise](docs/design/umbau-2026-10-24/README.md).
Windows-Download, Installation und Übergabe an Claude Code:
[Geschenkpaket für Windows](docs/GESCHENKPAKET-WINDOWS.md).
Android über die vorhandene App
installieren; Paket und Signatur bleiben erhalten. Die Navigation zeigt kleine
Namen rechts neben Symbolen und passt sich zusammen mit Suche und Filtern an
schmale und breite Fenster an. Die fünf Ersatzschlüssel des unteren Tresors lassen sich jetzt im Android-Dateidialog sichern; drei davon ermöglichen die Wiederherstellung. Das getrennte Tablet-/SD-Speicherort-Passwort gehört nicht dazu. [Bedienung und Grenzen](docs/TRESOR-ERSATZSCHLUESSEL.md).

Vorschau .19 ergänzt die [Schutz-Prüfstelle für Viren, Spam und Betrug](docs/SCHUTZ-VIREN-SPAM-BETRUG.md). Regeln und bekannte Listen liefern Hinweise; die dort beschriebenen Grenzen gelten.

Die Oberfläche ist in Chromium, Firefox und WebKit für 280 bis 1920 Pixel und
vier Sprachen geprüft. Android und der neue native Windows-Host sind vorhanden;
es gibt keine native iOS-/macOS-/Linux-Ausgabe. Browser-Engine-Prüfungen ersetzen
keine Tests auf echten Geräten. Die ursprüngliche PWA im Repository `Privat-Brain`
bleibt unabhängig und unverändert.

Mailverbindungen laufen direkt vom Gerät. Anbieter und OAuth-Grenzen:
[Native Mail](docs/NATIVE-MAIL-ARCHITEKTUR.md). Die Regelprüfer sind kein
vollständiger Virenscanner. Das e5-Modell kann ausdrücklich heruntergeladen werden;
die lokale Offline-Suche ist im installierten Windows-Programm geprüft.
[Bedienung und Plattformgrenzen](docs/BESCHRIFTUNGEN-UND-ORDNER.md),
[Prüfstand](docs/PRUEFSTAND-ANDROID.md),
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
