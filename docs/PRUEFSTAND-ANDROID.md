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

## Versionsprüfung (in Vorschau .4 enthalten)

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
eines Downloads ohne vorherige erfolgreiche Prüfung. Der native Lauf und die vollständigen Prüfungen waren vor Merge erfolgreich;
anschließend bestand auch [Main-Lauf 39295896679](https://github.com/lausiklauskn-png/Privat-Brain-Pro/actions/runs/39295896679).
Eine Vorschau .3 wurde nicht öffentlich verteilt.

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

Noch nicht umgesetzt: dauerhafte Geräteordner, Benachrichtigungen/Hintergrundabruf,
Gmail OAuth und lokales e5-Modell. Die neue direkte Mailanbindung samt Keystore
wird im folgenden Abschnitt getrennt ausgewiesen.
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

## Veröffentlichte direkte Mailanbindung 0.1.0-preview.4

Vorschau .2 wurde nach Rückmeldung des Nutzers auf dem Samsung-Tablet installiert
und gestartet; die gezeigte Mailmaske verlangt noch den privaten HTTPS-Dienst.
Das belegt keinen nativen Telekom-Zugang. Der vom Nutzer übermittelte VirusTotal-
Bericht zur oben genannten .2-Prüfsumme meldet 0/67 Erkennungen, keine umfassende
Sicherheitsgarantie. Eine Play-Protect-Entscheidung steht aus.

Neue Implementierung: direkte IMAPS-/SMTPS-Verbindungen, native Kontenerfassung,
AES-GCM/Android-Keystore, lokale Entwürfe, persistente Versandnachweise und begrenzte
Anhangsfreigabe. [Architektur und Grenzen](NATIVE-MAIL-ARCHITEKTUR.md).

Lokal erfolgreich: Android-Debug-APK und Lint, Kompilation der Instrumentierung,
3 Java-Tests, 37 bestehende native Webprüfungen, 24 neue Mail-Oberflächenprüfungen
mit simulierter Brücke und 26 Regressionstests des bisherigen privaten Maildienst-
Adapters. Diese UI-Simulationen beweisen keine reale Anbieteranmeldung.

Die neue Android-Instrumentierung prüft Keystore-Wiederöffnung, manipulierte
verschlüsselte Dateien, fehlenden Schlüssel, MIME/Binäranhänge/Header-Injektion,
unvertrautes TLS, falschen Hostnamen, echte lokale IMAP-Anmeldung über Test-TLS,
SMTP-Annahme und Verbindungsabbruch nach DATA ohne Doppelversand. Der Testserver
und seine flüchtigen Schlüssel entstehen nur auf dem Testgerät. Produktion bleibt
beim Systemvertrauen; es werden keine realen Zugangsdaten verwendet.
Erfolgreich ausgeführt: vollständiger [CI-Lauf 39323175775](https://github.com/lausiklauskn-png/Privat-Brain-Pro/actions/runs/39323175775),
HEAD `b3d26637425c22c7b1615b455a7f308fd23d4116`: sämtliche Web-/Dienstprüfungen,
Build/Lint und **9 Android-Tests, 0 Fehler, 0 übersprungen**. Die zusätzliche
[gezielte Android-Gegenprobe 39323203611](https://github.com/lausiklauskn-png/Privat-Brain-Pro/actions/runs/39323203611) bestand ebenfalls.
Die ersten TLS-Fixture-Läufe scheiterten am nicht exportierbaren RSA-Serverschlüssel
des Emulators; der Testserver verwendet jetzt einen dort flüchtig erzeugten
ECDSA-Schlüssel. Die Produktions-Zertifikatsprüfung wurde dafür nicht gelockert.

PR #3 ist nach erfolgreicher vollständiger Prüfung zusammengeführt. Der Release-
Quellstand `a3f6051d8946c411449936bf59a1c86e12435fdc` hat exakt denselben
Git-Baum wie der geprüfte PR-HEAD. Vorschau 4 wurde aus diesem Stand neu gebaut.
Sämtliche ZIP-Einträge entsprechen dem vorher geprüften Paketinhalt; die APK-
Gesamtprüfsumme enthält auch die jeweils neu erzeugte Signatur.

Veröffentlichung und tatsächlicher Test der signierten APK im Android-35-Emulator:
[Release-Lauf 39324803227](https://github.com/lausiklauskn-png/Privat-Brain-Pro/actions/runs/39324803227), erfolgreich.
Installation von .2, Sprachwahl auf EN, Update mit .4 ohne Deinstallation,
erhaltene Sprachwahl sowie Öffnen/Abbrechen der echten nativen Kontomaske bestätigt.
Das beweist noch keine Übernahme bereits gespeicherter Mailkonten: .2 hatte keine
native Kontenablage. Direkter öffentlicher Download mit HTTP 200, 4.967.275 Bytes
und SHA-256 geprüft:
`0219c0afaa5500e99028a06ad415b81a159adbd2e62f7b901229a78f9929f950`.
Vorschau-Zertifikat, Paketkennung und freigegebene helle Pro-Icons bleiben gleich;
VersionCode 4, VersionName `0.1.0-preview.4-test`, kein Debug-Flag.

Noch nicht bestätigt: echte Telekom-/Hetzner-Anmeldung vom Nutzergerät, Empfang/
Versand/Anhänge mit realen Konten, Provider-Funktionen, DeX-Bedienung der nativen
Kontomaske und Update mit gespeicherten Mailkonten. Keine vollständige
Funktionsgleichheit oder vollständige Malware-Erkennung behaupten.

## Zusätzliche Stabilisierung der Dialogprüfung

Ein weiterer Lauf desselben App-Codes, 39323170161, bestand alle acht Mailtests,
scheiterte aber beim Starttest am Espresso-Fensterfokus: Der Standard-Root-Matcher
wartete auf das Hauptfenster, während der Kontodialog den Fokus hatte. Die Probe
verlangt jetzt ausdrücklich `isDialog()` bei Titelsuche, Passwortbeschriftung und
Abbrechen. Der Test wird weiterhin tatsächlich ausgeführt, nicht übersprungen.
Diese Änderung betrifft ausschließlich die Android-Instrumentierung; die
veröffentlichte APK und ihre Brücke bleiben bytegleich.

Die präzisierte Probe bestand im [Android-Lauf 39325034993](https://github.com/lausiklauskn-png/Privat-Brain-Pro/actions/runs/39325034993):
9 tatsächlich ausgeführte Tests, 0 Fehler, 0 übersprungen. Geprüfter Test-Quellstand
`d7d20fb03b43fab03dd6f52f8208f57e2ddc2ff8`; die zusätzliche Dokumentation wird nicht
in das Laufzeitpaket kopiert.


## Originalansicht und Fensterlayout – Vorschau .5

Der Nutzer bestätigt in .4 die direkte Telekom-Anmeldung und den Abruf echter
Nachrichten am Samsung-Tablet. Die übermittelten Bilder zeigen jedoch bislang
nur die Textdarstellung; tatsächlicher Versand und Anhangsaustausch sind dadurch
nicht bestätigt. Persönliche Nachrichten/Bildschirmfotos werden nicht eingecheckt.

Änderungen für .5: Original-HTML samt CID-Bildern in isolierter Ansicht, externe
HTTPS-Bilder abschaltbar, separate Textansicht. Original-MIME bleibt unverändert.
Betreff/Absender werden für alle 50 Listeneinträge als ENVELOPE geladen; die Größe
der gesamten Nachrichten begrenzt nicht mehr den Abruf der kleinen Metadaten.
Alle nativen Seiten füllen das Fenster. Postfach/Explorer besitzen eigene
Scrollbereiche; Konten-/Nachrichtenwerkzeuge sind platzsparend erreichbar.
Schmale Ansichten behalten eine vollständige Nachrichtenseite mit Rücknavigation.
OS-Titelleiste bleibt erhalten; keine Fullscreen-/Minimierungsfunktion hinzugefügt.

Vorher/Nachher und synthetische Sichtproben: [Designnachweise](design/mail-preview5/README.md).
Ergänzte Android-Instrumentierung verlangt unveränderte MIME-Bytes, HTML/CID-
Teile/Binäranhänge und die skriptfreie, fremde Herkunft der Mailansicht in der
Standard-WebView. Der XML-Wächter verlangt alle zehn Fälle ohne Überspringen.
Konten-/Keystoreformat und Paketkennung bleiben unverändert, VersionCode steigt
auf 5. Über die vorhandene Test-App installieren; nicht deinstallieren.
Die neue HTML-Darstellung und gespeicherte Telekom-Konten beim Update sind
zusätzlich auf dem Nutzergerät zu kontrollieren.


### Ausgeführte Prüfungen für .5

Vollständiger [CI-Lauf 39331444809](https://github.com/lausiklauskn-png/Privat-Brain-Pro/actions/runs/39331444809)
erfolgreich, geprüfter HEAD `f327154c8d8e78214858bc131c85097053500828`:
38 bestehende npm-Prüfbefehle, 57 native Webprüfungen, 48 Mail-Oberflächenproben,
14 Maildiensttests, Java-Tests, Android-Build/Lint und **10 Android-Tests ohne
Fehler oder übersprungene Fälle**. Darunter die echte Standard-WebView-Grenze
mit absichtlich nach der Bereinigung eingesetztem Skript sowie unveränderte
Original-MIME-Bytes mit HTML, Alternative-Text, CID-PNG und Binäranhang.
21 geschützte Module weiterhin bytegleich. Vorschau-Lint: 0 Fehler, 7 Warnungen.

PR #5 zusammengeführt: `3ce818c0c4f02813ec925b665d55a3743af051b0`, exakt
Git-Baum `eec1b8cc8a2f91cd366f52e681e98c7c4a1b89ef` wie der geprüfte HEAD.
Auch der parallele [Push-Lauf 39331439488](https://github.com/lausiklauskn-png/Privat-Brain-Pro/actions/runs/39331439488)
bestand. Sein erster Emulatorversuch brach beim Download des Systemimage-ZIP ab,
bevor die App gestartet wurde; die Wiederholung desselben Quellstands bestand.
Keine App- oder TLS-Prüfung wurde dafür abgeschwächt.

Signierte Vorschau: Paket `de.familyprojekt.privatebrain.pro.preview`, VersionCode 5,
VersionName `0.1.0-preview.5-test`, API 24+, Ziel 36, kein Debug-Flag. Zertifikat
SHA-256 unverändert: `362ee70d28da9c4b51e37057c3519a3e6eb2c679059dfb9f56b4003f9374fa80`.
APK-SHA256: `ebf3b0a515f05dc6e5f5695521643fcba05cb2016e0299fecd100676885f9417`.
Unveränderte Bibliotheks-LICENSE/NOTICE und aktuelle Laufzeitdateien im APK geprüft;
keine Schlüssel, Dienst-Daten oder Design-Testdateien im Webpaket.


Veröffentlicht: [Vorschau .5](https://github.com/lausiklauskn-png/Privat-Brain-Pro/releases/tag/v0.1.0-preview.5).
[Signierte Updateprobe und Upload 39332888607](https://github.com/lausiklauskn-png/Privat-Brain-Pro/actions/runs/39332888607)
erfolgreich: unveränderte .4-APK installiert, Englisch gewählt, .5 mit `adb install -r`
darüber installiert, Englisch erhalten, App gestartet und echten nativen Kontodialog
geöffnet/abgebrochen. Keine echten Kontozugangsdaten und kein SMTP-Versand in dieser
Probe. Konten-, Dokument- und Samsung-spezifische Migrationsproben daraus nicht ableiten.
Direkter öffentlicher APK-Download am 2026-10-19 mit HTTP 200 geprüft: 4 973 154 Bytes,
identischer SHA256 und bytegleich zur lokal geprüften, signierten Datei.

Die abschließende Dokumentationsänderung ergänzt Prüfnachweise und wartet bei
Bildaufnahmen auf den vorhandenen Theme-Übergang. Keine Laufzeitdatei der APK wird
geändert; 48 Mail-Oberflächenproben einschließlich neuer Aufnahmen erneut bestanden.
Die unabhängige PWA bleibt auf `0ac93cd845a93cb67b37b0f4c60726eaed9ed492` sauber.
