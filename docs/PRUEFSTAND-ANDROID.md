# Prüfstand Android – 2026-10-19

## Veröffentlichte Grundversion 0.1.0-preview.2

Quellstand `7f754aa68aea8a87698c6597c34062348f360cd2`, Tag
`v0.1.0-preview.2`, VersionCode 2. App-Kennung
`de.familyprojekt.privatebrain.pro.preview`, Android 7+ (API 24), Ziel-API 36,
kein Debug-Flag. Die unabhängige PWA wurde nicht verändert.

- Vollständiges `npm test`: alle 38 verketteten Befehle erfolgreich. Provider-
  und Modellproben sind teilweise simuliert; keine echte Mailanmeldung oder
  echte Modellqualität daraus ableiten.
- 26 Prüfungen des gepackten nativen Webteils bestanden: Import, Suche,
  Katalogerhalt, Navigation, drei Breiten, vier Sprachen, Themes, kein
  PWA-Service-Worker und keine unbehandelten Browserfehler.
- 14 Maildiensttests bestanden, keine übersprungenen Tests.
- Drift-Guard: 21 Module bytegleich. Acht Designvergleiche mit 16 Screenshots
  bestätigen ausgewählte Schrift-, Farb-, Rundungs- und Abstandsregeln.
- Android-Builds und Lint bestanden. Vorschau-Lint: 0 Fehler, 6 Warnungen,
  vorwiegend geerbte Ressourcen und fehlende monochrome Icons.
- Hardwarebeschleunigter nativer Android-Starttest einschließlich Oberfläche,
  Navigation und Java-Brücke erfolgreich: GitHub-Lauf
  [39290236708](https://github.com/lausiklauskn-png/Privat-Brain-Pro/actions/runs/39290236708).
  Ein XML-Wächter bestätigt die tatsächliche Ausführung des erwarteten Tests
  ohne Fehler oder Überspringen.
- Signierte APK und öffentliche Prüfnachweise veröffentlicht durch den gezielten
  [Release-Lauf 39292605836](https://github.com/lausiklauskn-png/Privat-Brain-Pro/actions/runs/39292605836).
  Direkter Download mit HTTP 200 und identischem SHA256 geprüft:
  `20c6f53adb8a3847c1d0d734380b0e0f0cb716e7decda89873894457c16e71a5`.
- Heller Pro-Icon-Hintergrund bei erhaltenem 3D-Bubble-Motiv: Kopf- und
  Launcher-Icon sowie 192-/512-Pixel-Exporte konsistent. Die PWA-Icons blieben
  unverändert. UI-Hell-/Dunkelmodus bleibt erhalten.

## Nächste Vorschau 0.1.0-preview.3

Die manuell ausgelöste Versionsprüfung ergänzt die Android-Schnittstelle und
Einstellungen. Test- und Stabilkanal bleiben getrennt. Der Browser wird nur durch
Antippen für den geprüften Download geöffnet; die App installiert kein Update selbst.

Lokal bestanden: 37 Prüfungen des gepackten Webteils, darunter kein automatischer
Netzaufruf, Anzeige einer neuen Version, ausdrücklicher Download, verständlicher
Verbindungsfehler, kein veralteter Downloadknopf nach einem Fehler und vier
Sprachen. Drei Java-Tests prüfen numerische Reihenfolge, Kanaltrennung und
Beschränkung auf die vorgesehenen APK-Dateien. Android-Debugbuild, Lint und
Kompilation des erweiterten Instrumentierungstests sind erfolgreich. Die native
Startprüfung verlangt nun zusätzlich die echte Update-Brücke und die Ablehnung
eines Downloads ohne vorherige erfolgreiche Prüfung. Dieser neue native Lauf
muss vor dem Merge in GitHub Actions erfolgreich sein.

Eine echte Updateprüfung über das Netz auf dem Tablet und die Installation
einer neuen APK über eine bestehende Installation sind noch nicht bestätigt.
Am Datenbankschema wurde für die Versionsprüfung nichts geändert.

## Historischer lokaler Software-Emulatorfehler

Der lokale Android-15-Emulator ohne `/dev/kvm` nahm Installation und Startkommando
an, danach stürzte WebView 124 im Renderer mit SIGTRAP ab. Parallel traten
Bluetooth-Abstürze und ANRs mehrerer Systemdienste auf. Auch eine unabhängige
WebView-Kontroll-App zeigte „Process system isn't responding“.

Dieser Lauf war gestört und ist kein Beweis für eine funktionsfähige Oberfläche.
Er ersetzt den inzwischen erfolgreichen KVM-CI-Test nicht. Der Software-Emulator
wurde beendet; die Veröffentlichung stützte sich auf die erfolgreiche native CI.

## Offene Funktionen und Signierung

Noch nicht umgesetzt: direkte native Mailanbindung, Keystore für Mailkonten,
dauerhafte Geräteordner, Benachrichtigungen/Hintergrundabruf und lokales e5-Modell.
Die aktuelle Suche hat ohne Modell einen Stichwort-Rückfall. Keine vollständige
Funktionsgleichheit behaupten. Tablet/DeX, echte Konten und die tatsächliche
Update-/Migrationsprobe bleiben gesondert zu prüfen.

Signiermaterial liegt ausschließlich außerhalb des Repositories. Ein dauerhaftes,
unabhängiges Backup samt Wiederherstellungsprobe und Produktionssignierung sind
noch nicht bestätigt. Die Vorschau ist eine eigene Testinstallation. Der direkte
Cloud-Upload an GitHub liefert trotz aktiver Netzfreigabe einen Anmeldefehler;
die erste Veröffentlichung erfolgte über GitHub Actions mit dessen kurzlebigem
Token und bereits signierter öffentlicher APK. Dabei wurde kein privater Schlüssel
hochgeladen. Der temporäre Veröffentlichungszweig wurde danach entfernt.
