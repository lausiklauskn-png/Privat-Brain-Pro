# Prüfstand Android – 2026-10-20

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


## Einheitliche Postfachansicht – Vorschau .6 (2026-10-20)

Lokales und verbundenes Postfach verwenden dieselben übersetzten Beschriftungen,
Ordnerknöpfe und Symbole, dieselbe Überschrift und Primäraktion. Posteingang,
Entwürfe, Postausgang, Gesendet, Archiv, Spam, Papierkorb und Exportiert bleiben
in gleicher Reihenfolge sichtbar. Eigene Anbieterordner kommen zusätzlich hinzu.
Suchfeld, Auswahl und Verschiebeleiste bleiben erhalten. [Synthetischer
Vorher/Nachher-Vergleich](design/mail-preview6/README.md). Die HTML-/CID-
Originaldarstellung und die vollständige Fensternutzung aus .5 bleiben erhalten.

Anbieterrollen haben Vorrang vor eindeutigen Namenszuordnungen; tatsächliche IMAP-
Pfade und UIDs ändern sich nicht. Mehrdeutige oder fehlende Zuordnungen werden
nicht durch automatische Ordneränderungen ersetzt. Geräteentwürfe, Versand-
versuche und lokale Exporte sind ausdrücklich keine vorgetäuschten IMAP-Ordner.
Anbieterordner mit Namen wie `@outbox` bleiben getrennt von Geräteansichten.
Fehlgeschlagene Ordner- oder Nachrichtenabrufe entfernen veraltete Mailaktionen.

Vollständiger [CI-Lauf 39339695794](https://github.com/lausiklauskn-png/Privat-Brain-Pro/actions/runs/39339695794)
für HEAD `c841f4ececd107f07c3ba0810bf355e3369e0484`: erfolgreich.
38 vorhandene npm-Prüfbefehle, 57 native Webprüfungen, **72 Mail-Oberflächenproben**,
14 Maildiensttests, Java-Tests, Android-Build/Lint sowie **10 Android-Tests ohne
Fehler oder übersprungene Fälle**. Oberflächenproben simulieren den nativen
Transport; Android-Instrumentierung prüft darunter Standard-WebView-Isolation,
MIME-Erhalt und die bestehende TLS-/Keystore-/SMTP-Absicherung. Keine echten
Zugangsdaten in den Proben. 21 geschützte Module bleiben bytegleich.

PR #7 zusammengeführt als `ac1b89a92db8bad1a8907cab5e1c66bb3402f2f4`, gleicher Git-Baum wie der geprüfte HEAD.
Paketkennung `de.familyprojekt.privatebrain.pro.preview`, VersionCode 6,
VersionName `0.1.0-preview.6-test`, API 24+, Ziel 36, kein Debug-Flag.
Vorschau-Zertifikat unverändert:
`362ee70d28da9c4b51e37057c3519a3e6eb2c679059dfb9f56b4003f9374fa80`.
APK-SHA256:
`d85386067e730de68d163c7c888d3ca4568202e4427ba62ce17b1d744f9dc27a`.
Aktuelle gepackte Webdateien bytegleich im signierten APK; keine persönlichen
Dateien, Schlüssel oder synthetischen Designaufnahmen im Webpaket.

[Vorschau .6](https://github.com/lausiklauskn-png/Privat-Brain-Pro/releases/tag/v0.1.0-preview.6)
veröffentlicht nach erfolgreicher [signierter Updateprobe und Upload 39340860823](https://github.com/lausiklauskn-png/Privat-Brain-Pro/actions/runs/39340860823).
Originale öffentliche .5-APK installiert, Englisch gewählt, .6 ohne Deinstallation
mit `adb install -r` installiert; Sprache erhalten, App gestartet, echter nativer
Kontodialog geöffnet und abgebrochen. Das prüft keine bereits gespeicherten
Kontogeheimnisse oder persönlichen Dokumente. Neue Darstellung, mehrere reale
Konten und Samsung-/DeX-Verhalten bleiben am Nutzergerät zu prüfen.

Direkter öffentlicher Download am 2026-10-20 geprüft: HTTP 200, 4 977 080 Bytes,
identischer SHA256 und bytegleich zur lokal signierten APK. Als Update über die
bestehende Test-App installieren; nicht deinstallieren. Die unabhängige PWA
bleibt sauber auf `0ac93cd845a93cb67b37b0f4c60726eaed9ed492`.


## Verlässliche Dateinavigation – Vorschau .7 (2026-10-20)

Der Nutzer meldet einen fehlenden Rückweg aus importierten Bildern/Originaldateien.
Native Dateiöffnung führt jetzt in eine eigene Ansicht statt auf eine Blob-Adresse
im Hauptfenster. Sichtbare Zurück-/Vorwärts-Knöpfe, AndroidX-Zurück, Maus und
Tastatur verwenden einen gemeinsamen Verlauf für App-Seiten, Explorerordner,
Großansicht und Originalansicht. Explorerzustand wird beim Zurück erhalten.
PDF/Office öffnen ausdrücklich über eine passende Android-App; der interne
Rückweg bleibt bestehen. [Verhalten und Grenzen](RUECKNAVIGATION.md).

Vollständiger [CI-Lauf 39342179484](https://github.com/lausiklauskn-png/Privat-Brain-Pro/actions/runs/39342179484)
für HEAD `ffa6d3304b1e9555fcc73d8ce56915b80c8f32f1` erfolgreich: alle
38 bestehenden npm-Prüfbefehle, 57 native Web-, 72 Mail- und **22 Navigationsproben**,
14 Maildiensttests, Java-Tests, Android-Build/Lint sowie **11 Android-Tests ohne
Fehler oder Überspringen**. Die zusätzliche native Probe öffnet zwölf Dateiansichten
und geht über den tatsächlichen Android-Dispatcher zwölfmal zurück. Ein im
WebView gespeicherter Testwert bleibt erhalten; kein App-Neuladen als Rückweg.
Auch der parallele [Push-Lauf 39342135954](https://github.com/lausiklauskn-png/Privat-Brain-Pro/actions/runs/39342135954)
bestand. Die 21 geschützten Module bleiben bytegleich.

PR #9 nach erfolgreicher vollständiger CI zusammengeführt als `b3287a2b00ea1b654fbdfb746668c28a1e88ddeb`,
gleicher Git-Baum wie der geprüfte HEAD. Signiertes Paket
`de.familyprojekt.privatebrain.pro.preview`, VersionCode 7,
VersionName `0.1.0-preview.7-test`, API 24+, Ziel 36, kein Debug-Flag.
Zertifikat unverändert:
`362ee70d28da9c4b51e37057c3519a3e6eb2c679059dfb9f56b4003f9374fa80`.
Aktuelles gepacktes Webpaket bytegleich im APK, keine persönlichen Dateien,
Signierschlüssel oder Testmaterialien enthalten. APK-SHA256:
`7be2711ce2550a004244c49f819fb874486f6e04147e4c05c51fdad1068df483`.

Veröffentlicht: [Vorschau .7](https://github.com/lausiklauskn-png/Privat-Brain-Pro/releases/tag/v0.1.0-preview.7)
nach erfolgreicher [signierter Updateprobe und Upload 39343904505](https://github.com/lausiklauskn-png/Privat-Brain-Pro/actions/runs/39343904505).
Die originale öffentliche .6-APK wird installiert, Englisch gewählt, .7 ohne
Deinstallation darüber installiert. Sprache, App-Start und echte native Kontomaske
mit Abbrechen sind bestätigt. Zusätzlich: Explorer öffnen, sichtbares Zurück zum
Postfach, echtes Android-Zurück zur Suche. Die Probe verwendet keine echten
Mailzugangsdaten, persönlichen Dokumente oder vorhandenen Kontogeheimnisse.

Direkter öffentlicher Download am 2026-10-20: HTTP 200, 4 982 784 Bytes,
identischer SHA256 und bytegleich zur lokal signierten Datei. Nutzergerät,
Samsung-DeX-Eingaben und externe PDF-/Office-Apps zusätzlich prüfen. Keine
vollständige Anbieter-, Dokument- oder Kontenmigrationsprüfung daraus ableiten.
Als Update installieren, nicht deinstallieren. Original-PWA weiterhin sauber auf
`0ac93cd845a93cb67b37b0f4c60726eaed9ed492`.

Der erste Veröffentlichungslauf 39343336492 bestand Installation/Start und
Kontodialog, scheiterte jedoch am UI-Automator-Lokator des Explorer-Eingabehinweises.
Die Probe verlangt jetzt den sichtbaren leeren Explorer-Inhalt und verwirft alte
Fensterabbilder bei einem vorübergehend fehlenden Accessibility-Root. APK,
Anwendungsquelle und die elf erfolgreich ausgeführten Android-Tests wurden dafür
nicht geändert. Erst der vollständig erfolgreiche Folgelauf veröffentlicht.


### Neue Nutzerrückmeldung zu Originalbildern (2026-10-20)

Vergrößern und Zurück funktionieren nach Nutzerangabe auf dem Tablet. „Original
öffnen“ scheitert dagegen mit der Meldung, dass das Original nicht erreichbar/der
Ordner nicht verbunden sei und der Katalogeintrag bleibe. Fehler noch offen; die
Ursache wurde am Gerät nicht festgestellt. Eine gespeicherte Vorschau kann die
Großansicht ermöglichen, ohne dass das Original verfügbar ist. Die bestandenen
Sitzungs-/Rücknavigationstests beweisen keine dauerhafte Dateiberechtigung oder
Erhaltung von Originalkopien über Neustart und Update. Diagnose, geeigneter
nativer Originalzugriff und Wiederzuordnung fehlender Quellen sind als zusätzlicher
Auftrag neben Gmail im [Nachfolgebrief](../BRIEF_NACHFOLGE_2026-10-20_gmail.md)
hinterlegt. In diesem Nachtrag wird keine neue APK oder Reparatur behauptet.


### Neue Nutzerrückmeldung zu E-Mail-Links (2026-10-20)

Der Nutzer meldet zusätzlich, dass Links aus E-Mails nicht geöffnet beziehungsweise
nicht im Browser geöffnet werden können. Noch keine Gerätediagnose oder Reparatur.
Die bestandenen HTML-/Sandboxproben belegen keinen Browserstart bei Linkbetätigung.
Sichere explizite Browserübergabe, Erhalt der Nachricht beim Zurück und negative
Schema-/Skriptproben sind im [Nachfolgebrief](../BRIEF_NACHFOLGE_2026-10-20_gmail.md)
als dritter Auftrag neben Originalbildern und Gmail ergänzt. In diesem Nachtrag
wurde ausschließlich dokumentiert; keine neue APK veröffentlicht.

## Veröffentlicht: Vorschau .8 — 2026-10-20

[APK .8 herunterladen](https://github.com/lausiklauskn-png/Privat-Brain-Pro/releases/download/v0.1.0-preview.8/Private-Brain-Pro-0.1.0-preview.8.apk).
Über die vorhandene App installieren und **Aktualisieren** wählen, nicht deinstallieren.
Originale und Konten liegen im privaten App-Speicher; Deinstallation/Daten löschen
entfernt diese Daten. Beim normalen Update bleiben sie erhalten.

- App-Quellstand: `484b5dde3d0ad0a488f2a003f098f59069ed0867` (PR #14), identischer
  Git-Baum wie geprüfter HEAD `57126939358445940b5f225de401480646382888`.
- APK: 5.550.462 Bytes; Paket `de.familyprojekt.privatebrain.pro.preview`,
  VersionCode 8, `0.1.0-preview.8-test`, kein Debug-Flag.
- SHA-256: `bc3704395b7709ed1d2a2e88358f0b719c26a2e1e466afb02e27e1264b4a6a0f`.
- Vorschau-Zertifikat unverändert: SHA-256
  `362ee70d28da9c4b51e37057c3519a3e6eb2c679059dfb9f56b4003f9374fa80`.
- [Vollständige CI 39351614148](https://github.com/lausiklauskn-png/Privat-Brain-Pro/actions/runs/39351614148):
  Web-/Drift-Kette, 177 native Browserproben (57 + 72 + 22 + 14 + 12), 14 Diensttests,
  Android-Build/Lint und **19 native Android-Tests ohne Fehler oder Überspringen**.
- [Signierte Updateprobe .7 → .8, 39352342121](https://github.com/lausiklauskn-png/Privat-Brain-Pro/actions/runs/39352342121):
  tatsächliches `adb install -r`, Sprache EN erhalten, native Kontomaske geöffnet und
  abgebrochen, sichtbares Zurück und Android-Zurück erfolgreich. Keine echten Konten
  oder Dokumentmigration in dieser Updateprobe; getrennte native Tresor-/Dateiproben
  prüfen synthetischen Bestandserhalt.
- [Veröffentlichung 39352837471](https://github.com/lausiklauskn-png/Privat-Brain-Pro/actions/runs/39352837471)
  verlangt beide erfolgreichen, exakt gepinnten Nachweise sowie passende APK-Signatur,
  Prüfsumme, Paketkennung und denselben Quellbaum. Öffentlicher Download anschließend
  HTTP 200; Bytezahl, SHA-256 und Bytevergleich mit signierter Datei stimmen überein.

Neue Originalimporte bleiben nach Neustart erreichbar. Ältere fehlende Originale
lassen sich mit derselben Datei hashgeprüft wieder zuordnen. HTML-/Text-Mail-Links
öffnen nach echtem Klick den Android-Browserweg; Skript- und Origin-Sperren bleiben
aktiv. Speichergrenzen und Sicherheitsgrenzen: [ORIGINALE-LINKS-GMAIL.md](ORIGINALE-LINKS-GMAIL.md).

Gmail-Autorisierung/XOAUTH2 ist implementiert, **ein echter Google-Login ist noch
nicht bestätigt**. Der Nutzer hat bisher kein Google-Cloud-Projekt eingerichtet.
Als nächsten Schritt eigenes Projekt „Private Brain Pro“, Zustimmungsbildschirm,
Testnutzer und Android-OAuth-Client für das Vorschau-Paket/Zertifikat einrichten.
Keine Passwörter, Tokens oder Client-Secrets im Chat anfordern. Keine kostenpflichtigen
Dienste oder öffentliche Store-Veröffentlichung ohne gesonderte Abstimmung.

Ein paralleler Kontrolllauf 39351619966 bestand zunächst 18/19 Fälle und erreichte
beim Google-Dialog nach „Abbrechen“ einmal das erwartete JavaScript-Abbruchsignal
nicht. Derselbe Quellstand bestand im vollständigen Push-Lauf alle 19 Fälle.
Die gezielte Wiederholung desselben Stands (Versuch 2 von 39351619966) besteht
alle 19 Fälle ohne Fehler oder Überspringen. Die Ursache des einzelnen vorherigen
Abbruchproblems ist nicht nachgewiesen; Google-Auswahl und Abbrechen am Tablet
zusätzlich prüfen. Nicht als bestätigten produktiven Gmail-Betrieb ausgeben.

Am Tablet als Nächstes: neue Datei importieren → App neu starten → Original öffnen;
altes fehlendes Original passend erneut auswählen; Link in Newsletter öffnen und
zum Postfach zurückkehren; vorhandenes Telekom-/Hetzner-Konto weiter prüfen.
Google-Auswahl und Abbrechen zusätzlich am Gerät prüfen. Die unabhängige PWA
`Privat-Brain` blieb unverändert; die geschützten Module bleiben bytegleich.

## Veröffentlichte Vorschau .9 — 2026-10-20

[APK .9 herunterladen](https://github.com/lausiklauskn-png/Privat-Brain-Pro/releases/download/v0.1.0-preview.9/Private-Brain-Pro-0.1.0-preview.9.apk).
Über die vorhandene Test-App installieren: **Aktualisieren, nicht deinstallieren**.
Paket `de.familyprojekt.privatebrain.pro.preview`, VersionCode 9,
`0.1.0-preview.9-test`, min24/target36, kein Debug-Flag. Größe 5.554.259 Bytes,
SHA-256 `f26f374857372ea2cf0518026e4a418db65dc5399ce9fd3ad20b5904acd498f1`.
Vorschau-Zertifikat unverändert:
`362ee70d28da9c4b51e37057c3519a3e6eb2c679059dfb9f56b4003f9374fa80`.

- Quell-HEAD `4800c044b859dec5ca5c44fb415ec7be15ee5708`.
  [Vollständige CI 39354700156](https://github.com/lausiklauskn-png/Privat-Brain-Pro/actions/runs/39354700156)
  und paralleler [PR-Lauf 39354747517](https://github.com/lausiklauskn-png/Privat-Brain-Pro/actions/runs/39354747517)
  bestanden: 38 bestehende npm-Prüfbefehle, 189 native Browserproben,
  14 Maildiensttests, Java-/Android-Build und Lint sowie **23 native
  Instrumentierungsfälle ohne Fehler oder Überspringen**. Darunter echte
  PDF-Seiten mit Scan-Bitmaps, unveränderte Bytes, Dateiname/MIME/Lesefreigaben,
  WebView-PDF und Android Zurück. Vorschau-Lint: 0 Fehler, 8 Warnungen in
  Bestandsressourcen/-code; keine neue PDF-/Cache-Warnung.
- [PR16](https://github.com/lausiklauskn-png/Privat-Brain-Pro/pull/16)
  nach erfolgreicher vollständiger CI zusammengeführt:
  `613c8c7d5aaeb61bff909a48f6b292962ddfb56e`.
  Git-Baum exakt identisch mit dem geprüften Quellstand.
- [Signierte Updateprobe .8 → .9, 39354882781, Versuch 2](https://github.com/lausiklauskn-png/Privat-Brain-Pro/actions/runs/39354882781/attempts/2)
  bestand: tatsächliches `adb install -r`, erhaltene englische Einstellung,
  native Kontomaske/Abbrechen sowie sichtbarer und Android-Zurück-Weg.
  Versuch 1 scheiterte vor App-Ausführung am SDK-Download
  „Android Emulator: Error on ZipFile unknown archive“. Der frische Runner
  konnte das offizielle Paket laden. Kein App-Fehler daraus abgeleitet.
- [Veröffentlichung 39355744841](https://github.com/lausiklauskn-png/Privat-Brain-Pro/actions/runs/39355744841)
  verlangte beide erfolgreichen Nachweise, identische Bäume, Paketversion,
  APK-Hash und Zertifikat. Öffentlicher Download: HTTP200, Größe und SHA-256
  stimmen; heruntergeladene APK bytegleich mit der signierten Datei.

PDF-Seitenanzeige einschließlich Scans, Zoom, „Öffnen mit …“ und „Teilen …“
(auch Rechtsklick) sind enthalten. Workfloh PDF erscheint nur bei passender
Registrierung auf dem Gerät. Geschützte/defekte PDFs können externe Anzeige
benötigen. Tatsächlicher Workfloh-Empfang und Samsung-DeX-Eingaben bleiben
am Tablet zu prüfen. Die unabhängige PWA und 21 geschützte Module blieben
unverändert; kein Datenbankschema geändert.

Die gemeldete Google-Auswahlschleife ist **am Nutzergerät noch nicht erklärt
oder als behoben bestätigt**. Ein unnötiger erneuter Autorisierungsaufruf nach
erfolgreicher Zustimmung wurde durch kontogebundene, maximal 120 Sekunden gültige
native RAM-Wiederverwendung beseitigt. Kein Token in JavaScript, Dateien oder
Logs. Echte Google-Zustimmung und Gmail-IMAP/SMTP weiterhin unbestätigt;
Google-Cloud-Projekt/Android-OAuth-Client und Testnutzer müssen geklärt werden.
Telekom-Konto und lokale Daten behalten, keinen privaten Dienst-Token neu erzeugen.
Details: [PDF-Ansicht und Google](PDF-ANSICHT-UND-GOOGLE.md).
