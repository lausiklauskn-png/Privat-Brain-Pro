# Aktueller Prüfstand: veröffentlichte .33 — 2026-10-24

[APK über die vorhandene App installieren](https://github.com/lausiklauskn-png/Privat-Brain-Pro/releases/download/v1.0.0-preview.33/Private-Brain-Pro-1.0.0-preview.33.apk).
PR #79 übernommen; Tag `v1.0.0-preview.33` zeigt exakt auf `457b20e08193a8383761ab2542dcd145f6f34b56`,
VersionCode 33, ursprüngliche Paketkennung und Signatur erhalten.

- Alle elf main-Prüfungen erfolgreich: Android-/Web-main
  [40121619660](https://github.com/lausiklauskn-png/Privat-Brain-Pro/actions/runs/40121619660)
  (Versuch 2), Windows-main [40121619637](https://github.com/lausiklauskn-png/Privat-Brain-Pro/actions/runs/40121619637),
  Signierung `40121619642` und Pages `40121619198`.
  Ein langsamer Firefox-Paketdownload benötigte einen einzelnen Job-Neustart;
  der native Testjob `120954221526` bestand bereits in Versuch 1.
- 56 native Android-Tests ohne Fehler/Skips, darunter tatsächliche Tesseract-
  Texterkennung aus DE/EN/RU/PL-Bildern, Scan-PDF und Suche mit beiden gesperrten
  Dokument-/Worker-Netzwerkladewegen. Originalbytes bleiben unverändert.
- Vollständige Web-/Native-Browsersuiten, 44 echte OCR-Fälle, 29 Dateiprüfungen,
  69 Postfachfälle und zehn Zeitplanfälle bestanden. Ungelesene, unsichere und
  abgebrochene Erkennung bleibt teilweise/ungeprüft; alte Befunde bleiben erhalten.
- Release [40123045873](https://github.com/lausiklauskn-png/Privat-Brain-Pro/actions/runs/40123045873)
  vollständig erfolgreich: Build `120958544681`, signiertes Update .32 → .33
  `120962044067`, Veröffentlichung `120962607507`. Seed, Baseline und Verify bestanden.
- Öffentliche APK unabhängig geladen: **18.618.467 Bytes**, SHA-256
  `56020cf2e362d1b575ebd7472b9d9d10af5a1330b03b8390c3378e1534e3e5ab`. SHA256SUMS, GitHub-Asset-Digest,
  Tag/Quelle und ursprüngliche Zertifikatskennung im veröffentlichten Signaturbericht
  stimmen. Der lokale Prüfer kontrolliert den Bericht und dessen Asset-Digest;
  die kryptographische Signatur- und installierte Updateprüfung lief in der Pipeline.
- 39 OCR-Dateien (26.315.914 Bytes) gegen Größen-/SHA-256-Pins geprüft; 29 Lizenztexte,
  27 native Dateien, drei Mail-/Explorerressourcen und 22 Kanon-Module bytegleich
  zur Quelle. OCR vor dem Prüfadapter, Stylesheet und Unicode-Suchaufteilung bestätigt.
- Physisches Samsung DeX, Klaus' Tab S6 und reale Reaktionszeiten sind nicht
  gemessen. Windows bleibt veröffentlicht bei .29; sein gemeinsamer Quellstand ist geprüft.

[Maschinenlesbarer Nachweis](design/umbau-2026-10-24/android-preview33-pruefung.json),
[Bedienung und Grenzen](NATIVE-TEXTERKENNUNG.md),
[technischer Umfang](design/umbau-2026-10-24/TEXTERKENNUNG-33.md).

---

# Veröffentlichte .32 — 2026-10-24

[APK über die vorhandene App installieren](https://github.com/lausiklauskn-png/Privat-Brain-Pro/releases/download/v1.0.0-preview.32/Private-Brain-Pro-1.0.0-preview.32.apk).
PR #78 übernommen; Tag `v1.0.0-preview.32` zeigt exakt auf `a4a2cd69a3caa7ad3c1a9eb332c7137504eb4608`,
VersionCode 32, ursprüngliche Paketkennung und Signatur erhalten.

- Android-/Web-main [40116256712](https://github.com/lausiklauskn-png/Privat-Brain-Pro/actions/runs/40116256712),
  Windows-main [40116256687](https://github.com/lausiklauskn-png/Privat-Brain-Pro/actions/runs/40116256687)
  und Signierung `40116256695` vollständig erfolgreich.
- 55 native Tests ohne Fehler/Skips. Neu: echter Teilen-Dialog und unveränderte
  schreibgeschützt freigegebene Datei trotz blockierter PDF-Warteschlange;
  manipulierte Originalbytes werden abgewiesen.
- Vollständige Web-/Native-Browsersuiten bestanden; verschiebbare Bereiche (55),
  Info-Erklärungen (48), Aktivitätsanzeige (33), Inhaltssymbole (46) und PDF-/
  Teilen-Oberfläche (23) geprüft. Sichtprüfung synthetischer Ansichten ergänzt
  die Funktionsproben; kein Hardwarebenchmark daraus abgeleitet.
- Release [40117059939](https://github.com/lausiklauskn-png/Privat-Brain-Pro/actions/runs/40117059939)
  vollständig erfolgreich: Build `120940415828`, signiertes Update .31 → .32
  `120942701808`, Veröffentlichung `120943212130`. Seed, Baseline und Verify bestanden.
- Öffentliche APK unabhängig geladen: **7.529.379 Bytes**, SHA-256
  `632aada11ed73f61618e737c3743768b2d4884c762ab1ea7f384c5e305c747b5`. Prüfsumme, GitHub-Asset-Digest,
  Signaturbericht und Release-Quellstand stimmen. 24 gepackte native Dateien
  und zwei Explorer-/Mailressourcen bytegleich zur Release-Quelle, Modellpins,
  neue Modulverdrahtung und native Warteschlange bestätigt.
- Physisches Samsung DeX, Klaus' Tab S6 und dessen Reaktionszeiten sind damit
  nicht als getestet behauptet. Windows bleibt veröffentlicht bei .29.

[Maschinenlesbarer Nachweis](design/umbau-2026-10-24/android-preview32-pruefung.json),
[Bedienung der Nachbesserungen](design/umbau-2026-10-24/NACHBESSERUNGEN-32.md).
OCR war nicht Inhalt von .32; sie ist anschließend als .33 veröffentlicht (oben).

---

# Veröffentlichte .31 — 2026-10-24

[APK über die vorhandene App installieren](https://github.com/lausiklauskn-png/Privat-Brain-Pro/releases/download/v1.0.0-preview.31/Private-Brain-Pro-1.0.0-preview.31.apk).
PR #77 übernommen; Tag `v1.0.0-preview.31` zeigt exakt auf `5c3cd2115a5abbf3d5daa50b126182f4d360001d`,
VersionCode 31, ursprüngliche Paketkennung und Signatur erhalten.

- Android-/Web-main [40106803209](https://github.com/lausiklauskn-png/Privat-Brain-Pro/actions/runs/40106803209),
  Windows-main [40106803287](https://github.com/lausiklauskn-png/Privat-Brain-Pro/actions/runs/40106803287)
  und Signierung `40106803132` vollständig erfolgreich.
- 54 native Tests ohne Fehler/Skips, einschließlich echter automatischer
  Marian-Übersetzung unter dem Original bei beiden aktiven nativen Internetsperren.
  Größenwechsel/Drehung erhält Activity, WebView und Suchanfrage.
- Release [40107514450](https://github.com/lausiklauskn-png/Privat-Brain-Pro/actions/runs/40107514450)
  vollständig erfolgreich: Build `120912168179`, signiertes Update .30 → .31
  `120915301804`, Veröffentlichung `120915749781`. Seed, Baseline und Verify bestanden.
- Öffentliche APK unabhängig geladen: **7.512.142 Bytes**, SHA-256
  `ba0f5a9bab788c1aac1b209f550811b00bb8bf86746791643e291f813bbd56b7`. Prüfsumme, GitHub-Asset-Digest und Release-Quellstand stimmen;
  elf gepackte UI-/Worker-/Lizenzdateien und Modellpins bytegleich zur Quelle,
  nativer Übersetzungsadapter im DEX.
- Physisches Samsung DeX, Klaus' Tablet und echte Mailanbieter sind damit nicht
  als getestet behauptet. Windows bleibt veröffentlicht bei .29.

[Maschinenlesbarer Nachweis](design/umbau-2026-10-24/android-preview31-pruefung.json),
[Bedienung der Übersetzung](NATIVE-LOKALE-UEBERSETZUNG.md).

---

> Vorschau .19 veröffentlicht (2026-10-21), einschließlich PR #44: signierte .18→.19-Updateprobe und öffentliche Downloadprüfung erfolgreich.
> Tag exakt auf `418ff2eeced686af8145aecd2d5e82a746a25f18`; APK-Link, SHA-256 und Lauf-IDs im Abschnitt .19 unten.

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

## Veröffentlichte Vorschau .10 — 2026-10-20

[APK .10 herunterladen](https://github.com/lausiklauskn-png/Privat-Brain-Pro/releases/download/v0.1.0-preview.10/Private-Brain-Pro-0.1.0-preview.10.apk).
**Aktualisieren, nicht deinstallieren.** Paket unverändert:
`de.familyprojekt.privatebrain.pro.preview`, VersionCode 10,
`0.1.0-preview.10-test`, min24/target36, kein Debug-Flag.
5.558.347 Bytes; APK-SHA256
`c8f8658f462ef96410a4ae85431665a59ee0567ce0b4499f610289ba6b137640`.
Zertifikat-SHA256 weiterhin
`362ee70d28da9c4b51e37057c3519a3e6eb2c679059dfb9f56b4003f9374fa80`;
der vorhandene Android-OAuth-Client passt weiterhin.

- Quell-HEAD `1caa9343025175a9909b98d8e11c8e6a4ff92bc1`.
  [Vollständige CI 39360742861](https://github.com/lausiklauskn-png/Privat-Brain-Pro/actions/runs/39360742861)
  und [paralleler PR-Lauf 39360795013](https://github.com/lausiklauskn-png/Privat-Brain-Pro/actions/runs/39360795013)
  erfolgreich. 38 bestehende npm-Prüfbefehle, 189 native Browserproben,
  14 Maildiensttests, Java-/Android-Build und Lint bestanden.
  **26 native Instrumentierungsfälle ohne Fehler oder Überspringen**,
  darunter drei neue Google-Grant-/Identitätsfälle. Vorschau-Lint:
  0 Fehler, 8 Warnungen aus Bestandsressourcen/-code.
- [PR18](https://github.com/lausiklauskn-png/Privat-Brain-Pro/pull/18)
  nach vollständiger erfolgreicher CI zusammengeführt:
  `6e3e8f7212985265c632afcb38039c59dea5261e`.
  Git-Baum exakt identisch mit dem geprüften Quell-HEAD.
- [Signierte Updateprobe .9 → .10, 39360896526](https://github.com/lausiklauskn-png/Privat-Brain-Pro/actions/runs/39360896526)
  erfolgreich: tatsächliches `adb install -r`, englische Einstellung bleibt
  erhalten, native Kontomaske/Abbrechen und sichtbarer/Android-Zurück-Weg.
  Die Probe verwendet keine echten Konten und prüft keine Dokumentmigration.
- [Veröffentlichung 39361820199](https://github.com/lausiklauskn-png/Privat-Brain-Pro/actions/runs/39361820199)
  verlangt erfolgreiche Quell-CI, identische Bäume und unabhängige Updateprobe
  derselben signierten APK, dazu Hash/Paket/Zertifikat. Öffentlicher Download
  mit HTTP200, Größe und Hash geprüft; bytegleich mit der signierten APK.

Der native Google-Rückweg behandelt fehlende Legacy-Kontodaten anhand einer
bestätigten Adresse vom festen Google-HTTPS-Userinfo-Endpunkt. Mail-Zustimmung,
Kontozuordnung und IMAP-/SMTP-Ablehnung bekommen getrennte sichere Fehlercodes
in vier Sprachen. Gmail-/Googlemail-Domain-Aliase erhalten Kontokennung und
Entwürfe. Keine freie URL, keine Redirects, keine abgeschaltete TLS-Prüfung,
keine Tokens in JavaScript/Dateien/Logs und kein automatischer Neuversand.
Details: [Google-Rückgabe/Diagnose](GMAIL-RUECKGABE-DIAGNOSE.md).

Der Nutzer hat die Google-Konsole inzwischen eingerichtet und .9 installiert;
die konkrete Ursache seiner .9-Ablehnung sowie ein echter Gmail-Login bleiben
unbestätigt. Der nächste Nachweis ist ein einzelner Anmeldeversuch am Tablet
mit .10 und gegebenenfalls Foto des neuen Fehlercodes. Nicht wieder pauschal
zur Neuerstellung von Projekt/Client/Testnutzer auffordern. Bestehende Konten
und Kataloge behalten. Die PWA und alle 21 geschützten Module sind unverändert.


## Veröffentlichte Vorschau .11 — 2026-10-20

[APK .11 herunterladen](https://github.com/lausiklauskn-png/Privat-Brain-Pro/releases/download/v0.1.0-preview.11/Private-Brain-Pro-0.1.0-preview.11.apk).
**Über die bestehende Test-App installieren, nicht deinstallieren.**
Paket `de.familyprojekt.privatebrain.pro.preview`, VersionCode 11,
`0.1.0-preview.11-test`, min24/target36, kein Debug-Flag.
5.560.619 Bytes; APK-SHA256
`3d0744b83ff6304f6509f4621c582178d016429ab86c0843454d13cf74601ca0`.
Zertifikat unverändert: SHA256
`362ee70d28da9c4b51e37057c3519a3e6eb2c679059dfb9f56b4003f9374fa80`.
Der vorhandene Android-OAuth-Client passt weiterhin.

- Geprüfter Quellstand `1321e10e7835e930e8cf56cb913d2175165f9e30`:
  [vollständige CI 39364267954](https://github.com/lausiklauskn-png/Privat-Brain-Pro/actions/runs/39364267954)
  und [parallele PR-CI 39364311623](https://github.com/lausiklauskn-png/Privat-Brain-Pro/actions/runs/39364311623)
  erfolgreich. 38 npm-Prüfbefehle, 211 native Browserproben
  (57 + 72 + 22 Konto-/Fehlerfälle + 22 Navigation + 14 Originale + 12 Links + 12 PDF),
  14 Maildiensttests, Android-Build und Lint erfolgreich.
  **28 native Instrumentierungsfälle ohne Fehler oder Überspringen**.
  Vorschau-Lint: 0 Fehler, 8 bestehende Warnungen.
- [PR20](https://github.com/lausiklauskn-png/Privat-Brain-Pro/pull/20)
  nach erfolgreicher CI zusammengeführt, Anwendungscommit
  `83cb8e3c7072c2af2c5d5e0e5f9b329464be9796`; Git-Baum exakt gleich dem geprüften
  Quellstand. Geschützte Module und unabhängige PWA unverändert.
- [Signierte Updateprobe .10 → .11, 39364425049](https://github.com/lausiklauskn-png/Privat-Brain-Pro/actions/runs/39364425049),
  Prüfcommit `4e5e59b847e9144fcfd0c7e6c0aebc913d5f5c9a`: erfolgreiches
  `adb install -r` derselben signierten APK, Englisch-Einstellung erhalten,
  native Kontomaske samt Abbrechen und sichtbarer/Android-Zurück-Weg geprüft.
  Keine echten Anbieterzugänge oder Dokumentmigration in dieser Updateprobe.
- [Veröffentlichung 39365299765](https://github.com/lausiklauskn-png/Privat-Brain-Pro/actions/runs/39365299765),
  Prüfcommit `c133a2c96a350f37c986090dc335e2af92185123`: exakt gepinnte CI- und
  Updatebelege, gleicher Anwendungsbaum, Zertifikat und APK-Hash verlangt.
  Öffentlicher Download danach HTTP 200, Größe und SHA256 korrekt, bytegleich
  mit der signierten Build-Datei.

Googlemail-Kontoname bleibt nach nativer Auswahl und bestätigter Wiederanmeldung
erhalten; vorhandene Kontenkennung und Entwürfe bleiben bestehen. Stille Google-
Abbrüche werden als erforderliche Zustimmung gemeldet. Der JS-Adapter verschluckt
nur das ausdrückliche Abbrechen der Kontoeinrichtung, prüft Listenantworten und
entfernt alte UID-/Reader-/Zählerzustände vor einem Kontowechsel. Gespeicherte
Geräteentwürfe und Versandversuche bleiben bei fehlgeschlagenem Serverzugriff
verfügbar. Kein automatischer Versand.

Die neuesten Gerätebilder belegen ein gespeichertes Google-Konto und geladene
Serverordner; die Kontospeicherung setzt IMAP-/SMTP-Authentifizierung voraus.
Der fotografierte Nachrichtenabruf scheiterte anschließend; echter Nachrichteneingang
und Versand sind weiterhin offen. Die Testmail ist noch nicht übermittelt.
Nächster Geräteschritt: .11 installieren, über Weitere Aktionen → Konto hinzufügen
Google/Gmail erneut wählen und das bisherige Android-Googlemail-Konto freigeben.
Bestehende Verbindung nicht entfernen. Der akzeptierte Gmail-Testnutzereintrag
in der Cloud-Konsole kann bleiben. Keine Passwörter, Tokens oder Secrets anfordern.


## Veröffentlichte Vorschau .12 — 2026-10-20

[APK .12 herunterladen](https://github.com/lausiklauskn-png/Privat-Brain-Pro/releases/download/v0.1.0-preview.12/Private-Brain-Pro-0.1.0-preview.12.apk).
**Über die bestehende Test-App installieren, nicht deinstallieren.**
Paket `de.familyprojekt.privatebrain.pro.preview`, VersionCode 12,
`0.1.0-preview.12-test`, min24/target36, kein Debug-Flag.
5.565.723 Bytes; APK-SHA256
`e2ef47acaa411d773cc703b9a4a48ba7747bccf088622131a6e00c87000766ed`.
Vorschau-Zertifikat weiterhin SHA256
`362ee70d28da9c4b51e37057c3519a3e6eb2c679059dfb9f56b4003f9374fa80`.
Vorhandene Google-Clientregistrierung bleibt passend.

- Quellstand `130b5f9347ae97e6e90368bf86c6323f8eb113dd`:
  [vollständige CI 39412237956](https://github.com/lausiklauskn-png/Privat-Brain-Pro/actions/runs/39412237956)
  und [parallele PR-CI 39412342209](https://github.com/lausiklauskn-png/Privat-Brain-Pro/actions/runs/39412342209)
  erfolgreich: 38 bestehende npm-Befehle, 211 native Browserproben,
  14 Maildiensttests, Android-Build/Lint und **31 native Instrumentierungsfälle
  ohne Fehler oder Überspringen**. Vorschau-Lint: 0 Fehler, 8 bestehende Warnungen.
  Die drei neuen Fälle prüfen sieben verschlüsselt gespeicherte Anbieter mit
  erhaltenem Entwurf nach Wiederöffnung, feste Host-/Benutzerbindung,
  Microsoft-Sperre vor Passwortlogin und den echten nativen Anbieterdialog.
- [PR22](https://github.com/lausiklauskn-png/Privat-Brain-Pro/pull/22) nach vollständiger
  CI und signierter Updateprobe zusammengeführt: Anwendungscommit
  `4fb2a9a3f2be196fb259cc43a2f77c1f7ab4cf7e`; Quellbaum exakt identisch mit dem
  geprüften HEAD. Unabhängige PWA und geschützte Module unverändert.
- [Signiertes Update .11 → .12, 39413230433](https://github.com/lausiklauskn-png/Privat-Brain-Pro/actions/runs/39413230433),
  Prüfcommit `0d6ff59ce910cc98a2174b82c867e5abc4b01c83`: tatsächlich dieselbe APK
  mittels `adb install -r` installiert, Englisch-Einstellung erhalten. Yahoo-
  Vorlage ausgewählt, Microsoft-Einrichtungsplan ohne Passwortfelder geöffnet,
  native Kontomaske/Abbrechen und sichtbarer sowie Android-Zurück-Weg geprüft.
  Keine echten Anbieterzugänge, Dokumentmigration oder Samsung-spezifische Prüfung.
- Die vorherige [Updateprobe 39412634782](https://github.com/lausiklauskn-png/Privat-Brain-Pro/actions/runs/39412634782)
  installierte erfolgreich, scheiterte aber beim Prüfer an Androids Großschreibung
  `SHOW SETUP PLAN` gegenüber erwartetem `Show setup plan`. Der dokumentierte
  Emulatorbaum zeigte die korrekte Microsoft-Auswahl. Nur der Prüfer wurde auf
  groß-/kleinschreibungsunabhängigen Textvergleich korrigiert; App und APK blieben
  unverändert. Die vollständige erneute Probe ist erfolgreich.
- [Veröffentlichung 39413729351](https://github.com/lausiklauskn-png/Privat-Brain-Pro/actions/runs/39413729351),
  Prüfcommit `8948b19630913a698b828a8940bb2936915390fb`: genaue CI-/Updatebelege,
  gleicher Quellbaum, Signatur und APK-Hash vor Veröffentlichung verlangt.
  Öffentlicher Download anschließend HTTP 200, korrekte Bytezahl/SHA256 und
  Bytevergleich mit der signierten Build-Datei erfolgreich.

Native Auswahl: Telekom, Hetzner, Google/Gmail, WEB.DE, GMX, Yahoo und 1&1/IONOS.
Vorgegebene Server, anbieterbezogene Hilfen und gelöschte Passwörter bei Wechsel.
Bestehende Konten und Geräteentwürfe bleiben erhalten; kein automatischer Versand.
Microsoft ist mangels eigener Registrierung und noch folgender OAuth-/STARTTLS-
Integration nur als klarer Einrichtungsplan enthalten. Anmeldung bei den neuen
Anbietern sowie Googlemail-Empfang/-Versand bleiben am Nutzergerät zu bestätigen.
Details und Microsoft-Arbeitsauftrag: [Anbietervorlagen](MAIL-ANBIETER.md).


## Veröffentlichte Version .13 — 2026-10-20

Die Android-App heißt **Private Brain Pro**, ohne „Test“. Android-Launcher und
Fenstertitel verwenden die bestehenden Pro-Ressourcen. Der native Packer passt
Überschrift/Seitentitel an; die PWA-Quelle und das separate PWA-Repo sind unverändert.
Hinweise in DE/EN/RU/PL sind neutral benannt, ohne Grenzwerte oder Anbieterfähigkeiten
zu ändern. Keine zusätzlichen Testfälle für die Textänderung: die bestehenden
Startprüfungen kontrollieren den Namen mit.

- Quellstand `56cb175c3da3bff149d1420ca61da874e642bd94`; Anwendungscommit
  `a5440d3bb01977a762f4e40ab2c170a8f14c37e6` (PR24), Quellbäume identisch.
- Vollständige [CI 39415063064](https://github.com/lausiklauskn-png/Privat-Brain-Pro/actions/runs/39415063064)
  erfolgreich: alle 38 Web-Befehle, 211 native Browserprüfungen, 14 Maildienstfälle,
  Android-Unitprüfungen, Build/Lint und 31 echte Instrumentierungsfälle ohne
  Fehler oder Überspringen. Lokal 211 Browserprüfungen und Android-Build/Unit/Lint
  erfolgreich; Vorschau-Lint 0 Fehler, 8 vorbestehende Warnungen.
- Erster Lauf [39415002739](https://github.com/lausiklauskn-png/Privat-Brain-Pro/actions/runs/39415002739)
  scheiterte beim unveränderten `tools/e2e-workspace.mjs:77` nach Neuladen am
  Warten auf den gespeicherten Ablageordner. Ursache nicht abschließend bestimmt;
  lokale gezielte Gegenprüfung 51/51 und vollständiger zweiter Lauf desselben
  Commits bestanden. Kein App-Code oder Prüfziel dafür geändert; Ausfall bleibt dokumentiert.
- [Signiertes Update .12 → .13 39415186477](https://github.com/lausiklauskn-png/Privat-Brain-Pro/actions/runs/39415186477)
  erfolgreich, Probecommit `ce640f14b21919d27336d81767e500feb97abe45`.
  Tatsächliche APK-Installation mit `adb install -r`, Pro-Name und erhaltener
  Spracheinstellung. Native Yahoo-Auswahl, Microsoft-Einrichtungsplan ohne
  Passwortfelder, Abbrechen und sichtbare/Android-Zurück-Wege bestanden.
- [Veröffentlichung 39416838139](https://github.com/lausiklauskn-png/Privat-Brain-Pro/actions/runs/39416838139)
  erfolgreich, Veröffentlichungscommit `ce4084ffb46d6504830d1742ba9aa6523d4840b5`.
  [Öffentlicher APK-Download](https://github.com/lausiklauskn-png/Privat-Brain-Pro/releases/download/v0.1.0-preview.13/Private-Brain-Pro-0.1.0-preview.13.apk)
  HTTP 200, 5.565.671 Bytes, SHA256
  `ceea91654c4697569ac632e8a3eea8a792dd491d9b3d0921d211b973025e08b4`; bytegleich mit der signierten geprüften APK.

Version `0.1.0-preview.13`, Code 13, ohne `-test`-Zusatz. Paket
`de.familyprojekt.privatebrain.pro.preview`, Zertifikat SHA256
`362ee70d28da9c4b51e37057c3519a3e6eb2c679059dfb9f56b4003f9374fa80`
und SHA1 `14:A1:59:A6:26:CA:0F:D8:7A:B0:A0:BF:9D:55:C3:9B:D4:A6:31:A4`
unverändert, kein Debug-Flag. Technischer Updatekanal bleibt Vorschau.

Keine echte Provideranmeldung, kein echter Versand, keine vollständige
Nutzerdatenmigration und kein Samsung-/DeX-Lauf mit dieser Version nachgewiesen.
Google-Projekt/Client passen weiter, Googlemail-Adresse behalten. Googles Test-
oder Produktionsstatus ist getrennt vom Appnamen und wurde nicht umgestellt.
[Anleitung](APP-NAME.md). Microsoft bleibt vorbereitet, noch ohne eigene Registrierung
oder fertige native Anmeldung.


## Veröffentlichte Version .14 — 2026-10-20

Kompakte Symbolleisten nach Outlook-Vorbild: Hauptseiten als Symbole, weitere
Ansichten auf kleinen Fenstern hinter „…“, Sprache/Anzeige/Mycel/Pinnwand im
App-Menü. Einzeilige Konto-/Mailaktionen, lesbare Ordner/Betreff/Dateinamen,
übersetzte Tooltips und zugängliche Namen. Der grüne Offline-Informationshinweis
entfällt. Die vorhandenen Statuslampen bleiben in der schmalen Leiste; nur die
app-eigene Startkonfiguration im gepackten Webteil akzeptiert zusätzlich den
nativen Ursprung. PWA-Quelle, anderes PWA-Repo und 21 geschützte Module unverändert.

Der zusätzliche Nutzerauftrag ist ein echter App-Internetschalter in beide
Richtungen, einschließlich persistentem Offlinezustand nach Neustart. WebView-
Ressourcen, Browsertransporte und native Mail-/Google-/Updateaufrufe werden
abgesichert; rohe Mail-Sockets vor dem Verbinden registriert und beim Abschalten
geschlossen. JavaMail verwendet weiterhin die bisherige TLS-/Hostnamenprüfung.
Konten, Geräteentwürfe, lokale Originale und Versandquittungen bleiben erhalten.
Keine WLAN- oder Betriebssystemumschaltung, kein automatischer Neuversand.

- Quellstand `93a6659d9b826d5a4211e0467898f66bf6ea2b71`; Anwendungscommit
  `31a27eeba707cad4f4752ceccfd3c0e0b49a50e1` (PR27), Quellbäume identisch.
  Der vorherige Brief aus PR26 bleibt erhalten.
- Vollständige [CI 39425363587](https://github.com/lausiklauskn-png/Privat-Brain-Pro/actions/runs/39425363587)
  erfolgreich: 38 Web-Befehle, 231 native Browserprüfungen (211 bisherige + 20
  kompakte Bedienungs-/Offlinefälle), 14 Maildienstfälle, Android-Unitprüfungen,
  Build/Lint und 34 echte Instrumentierungsfälle ohne Fehler/Überspringen.
  Drei neue native Fälle: aktiven Socket schließen und neue Verbindungen vor
  TCP-Aufbau sperren; verschlüsselte Konten/Entwürfe und unklare Versandquittung
  erhalten; echte WebView offline neu starten und Internet wieder erlauben.
- [Signiertes Update .13 → .14 39425723720](https://github.com/lausiklauskn-png/Privat-Brain-Pro/actions/runs/39425723720)
  erfolgreich, Probecommit `e3a3d52479d9759ae741b22b5130bffb4b29f24f`.
  Tatsächliche APK-Installation über .13, Pro-Name, erhaltene Spracheinstellung,
  Offline-Kaltstart, erneutes Erlauben des Internets, native Yahoo-Auswahl,
  Microsoft-Einrichtungsplan und sichtbare/Android-Zurück-Wege bestanden.
- [Veröffentlichung 39427132118](https://github.com/lausiklauskn-png/Privat-Brain-Pro/actions/runs/39427132118)
  erfolgreich, Veröffentlichungscommit `35d1f187fa1acfdcfbafb6782dae541296613a88`.
  [Öffentlicher APK-Download](https://github.com/lausiklauskn-png/Privat-Brain-Pro/releases/download/v0.1.0-preview.14/Private-Brain-Pro-0.1.0-preview.14.apk):
  HTTP 200, 5.576.269 Bytes, SHA256
  `93e731ef091b542b5cfe8ed5301a2a7627bdf6c1c90f5ad5d22f73041e68f1bd`; bytegleich mit der signierten geprüften APK.

Version `0.1.0-preview.14`, Code 14, Appname **Private Brain Pro**.
Paket `de.familyprojekt.privatebrain.pro.preview`, unverändertes Zertifikat SHA256
`362ee70d28da9c4b51e37057c3519a3e6eb2c679059dfb9f56b4003f9374fa80`,
SHA1 `14:A1:59:A6:26:CA:0F:D8:7A:B0:A0:BF:9D:55:C3:9B:D4:A6:31:A4`,
kein Debug-Flag. Bestehender Google-Client bleibt gültig.

Lokale Browser-/Build-/Unit-/Lintprüfungen bestanden. Kleine Touch-Fenster
320×640 und 390×640, Tablet/Desktop 768×900 und 1280×900 visuell geprüft;
mindestens 300 px Lesebereich im kleinen Fenster und einzeilige Kopfaktionen.
[Bilder](design/compact14/README.md), [Bedienung und Grenzen](KOMPAKTE-ANSICHT-UND-OFFLINE.md).
Kein echter Providerlogin/-versand, kein realer Samsung-/DeX-Lauf, keine vollständige
Nutzerdatenmigration mit Nutzerbestand nachgewiesen. Browser-Netzwerkantworten und
Konten synthetisch; native Socket-Abbruch-/Neustartprüfungen tatsächlich ausgeführt.


## Veröffentlichte Version .15 — 2026-10-20

Die Hauptnavigation ist wieder kurz beschriftet, neben den Symbolen bzw. auf dem
Handy darunter. Alle acht Ansichten bleiben direkt sichtbar, auf kleinen Fenstern
in zwei flachen Zeilen. Dashboard-Kacheln sind kleiner und öffnen Explorer, Kategorien und
Duplikate. Eigene sichtbare Tooltips reagieren auf Maus und Tastatur, einschließlich
zustandsabhängiger Mailansicht-/Bilderknöpfe. Einstellungen erhalten ein Zahnrad.
Die bestehenden Mailaktionen bleiben kompakt. Drei große Hinweisboxen stehen als
kurzer Hinweis unter dem Einwurf.

Androids Storage Access Framework ersetzt den dort nicht verfügbaren
Browser-Ordnerweg. „Nicht mehr zeigen“ beeinflusst nur die Erklärung. Quellordner
lassen sich erneut wählen und abbrechen; eine zusätzliche Kopienablage kann
gewechselt und nach Neustart weiterverwendet werden. Alte Dateien und Katalogeinträge
bleiben erhalten. Neue Kopien überschreiben keine vorhandenen Dateien und werden
nach dem Schreiben geprüft. Ordnertransfer verarbeitet eine Datei nach der anderen;
bei verweigerter Ablagefreigabe wird kein erfolgreicher Katalogimport vorgetäuscht.
Der Debug-Dokumentanbieter für die Proben ist durch MANAGE_DOCUMENTS geschützt
und in der signierten Vorschau-APK vollständig ausgeschlossen.

Der neue Mail-Ladehinweis zeigt tatsächlichen Abruf, Vorbereitung und die bestehende
Regelprüfung. „Warum dauert das?“ erklärt Übertragung, Anhänge und Prüfgrenzen.
Kein vollständiger Virenscan wird behauptet. Original-MIME und Anhänge bleiben
unverändert. Gepinnte 21 Module, unabhängige PWA, Mycel, App-Internetschalter und
Google-Client bleiben erhalten. Die PWA nutzt weiterhin ihren bestehenden Ablauf;
die Ladephasen werden nur bei vorhandenem nativen Adapter angezeigt.

- Geprüfter Quellstand `d8de7b1964671f37db55aa7fd0ba487aa8414dd6`, Anwendungscommit
  `161e9156d46b9b36007cedc322881d124f802ed2` (PR29), Quellbäume identisch.
- Vollständige [CI 39436653702](https://github.com/lausiklauskn-png/Privat-Brain-Pro/actions/runs/39436653702)
  und [parallele PR-CI 39436662132](https://github.com/lausiklauskn-png/Privat-Brain-Pro/actions/runs/39436662132)
  erfolgreich: 38 Web-Befehle, 275 native Browserfälle, 14 Maildienstfälle,
  Android-Unitprüfungen, Build/Lint und 37 Android-Fälle ohne Fehler/Überspringen.
  Neu: native Dokumentanbieter-Kopien und Wechsel, Fehler ohne Überschreiben,
  echte Android-Pickeraufrufe trotz ausgeblendetem Hinweis nach wiederholtem
  Abbrechen. Lokale Browser-/Unit-/Build-/Lintprüfungen ebenfalls bestanden.
- [Signiertes Update .14 → .15 39437954389](https://github.com/lausiklauskn-png/Privat-Brain-Pro/actions/runs/39437954389)
  erfolgreich, Probecommit `d21a43d57cf940fae7278ed45dc8fab5b9283180`. Sprache bleibt erhalten,
  Offline-Kaltstart und erneutes Einschalten, tatsächliche Android-Ordnerauswahl
  für Quelle und Ablage nach „Nicht mehr zeigen“, Abbrechen und Wiederholen,
  native Anbieterauswahl und Zurück-Wege bestanden. Der erste Probeaufbau
  39434750350 suchte vor der Sprachwahl fälschlich den englischen
  Namen im vorhandenen deutschen App-Menü. Das korrigierte Probeskript fand
  anschließend die alte Browser-Ausblendung des Android-Ordnerknopfs
  (39435263479). Diese Anwendungsstelle wurde korrigiert,
  um eine echte Gegenprobe ohne Browser-Ordner-API ergänzt und mit dem finalen
  Quellstand, erneuter vollständiger CI und signierter APK nochmals geprüft.
  Die nächste Probe (39436908728) bestand diese Schritte,
  erwartete aber im erweiterten Verlauf einen Zurück-Schritt zu wenig. Nur
  das Probeskript um den korrekt besuchten Einwurf-Schritt ergänzt; finale
  Anwendungsquelle und APK dabei unverändert.
- [Veröffentlichung 39438829136](https://github.com/lausiklauskn-png/Privat-Brain-Pro/actions/runs/39438829136)
  erfolgreich, Veröffentlichungscommit `dd93a8fd9ead0acc506b724c2b35617d46fe5e0d`.
  [Öffentlicher APK-Download](https://github.com/lausiklauskn-png/Privat-Brain-Pro/releases/download/v0.1.0-preview.15/Private-Brain-Pro-0.1.0-preview.15.apk): HTTP 200, 5.589.534 Bytes,
  SHA256 `fa5dc58be2856f75eba0048e297cf9053c0362700e9df0dcc3b4ba61464411b4`. Bytegleich mit der signierten geprüften APK.

Version `0.1.0-preview.15`, Code 15, Appname **Private Brain Pro**.
Paket `de.familyprojekt.privatebrain.pro.preview`, unverändertes Zertifikat SHA256
`362ee70d28da9c4b51e37057c3519a3e6eb2c679059dfb9f56b4003f9374fa80`,
SHA1 `14:A1:59:A6:26:CA:0F:D8:7A:B0:A0:BF:9D:55:C3:9B:D4:A6:31:A4`,
kein Debug-Flag. Google-Test-/Produktionsstatus nicht geändert.

320×640, 390×640, 768×900 und 1280×900 mit synthetischen Daten im Browser geprüft;
[Bilder](design/compact15/README.md), [Bedienung/Grenzen](BESCHRIFTUNGEN-UND-ORDNER.md).
Keine vollständige Nutzerdatenmigration, kein realer Samsung-/DeX-Lauf dieser
Version und kein echter Providerlogin/-versand in den automatischen Proben.
Die zusätzliche externe Kopienablage ist noch nicht passwortverschlüsselt und
verschiebt frühere Dateien nicht. Quelle wird einmal importiert, nicht fortlaufend
synchronisiert. Der eigenständige Speicher-/Quarantäneauftrag bleibt offen.


## Veröffentlichte Version .16 — 2026-10-20

[APK .16](https://github.com/lausiklauskn-png/Privat-Brain-Pro/releases/download/v0.1.0-preview.16/Private-Brain-Pro-0.1.0-preview.16.apk) (Private Brain Pro, Code 16), Paket
`de.familyprojekt.privatebrain.pro.preview`. Über .15 installieren, nicht deinstallieren.
Quelle `4d668e9ef122060f9b1d96deab52f6515ae4b61e`, PR31, Anwendungsmerge `0b7fef62a989be4200c1372df8c229ae7253d6c8`;
Quell- und Squash-Baum sind identisch. SHA-256 `2e3e6b4d6e8e8307648359b55fca12b5cc205940e78406eeca3f28e5da010eab`,
5,590,218 Bytes. Unverändertes Zertifikat SHA-256
`362ee70d28da9c4b51e37057c3519a3e6eb2c679059dfb9f56b4003f9374fa80`.
Keine Debug-Kennung und kein Debug-Dokumentanbieter in der APK.

Änderung: Namen rechts neben Symbolen, alle acht Ansichten direkt sichtbar,
flache Zeilen nach Breite/Sprache/Schriftgröße. Suche mit kleinerer Überschrift,
kompakten Zählern, vollständig sichtbaren Suchmodi und zweispaltigen Handyfiltern.
Innere Seitenbreite wird geprüft, statt lediglich globalen Überlauf zu verstecken.
Buttons animieren Größenwechsel nicht. Bestehende Mail-/Ordner-/Netzfunktionen
bleiben erhalten. [Bedienung und Plattformgrenzen](BESCHRIFTUNGEN-UND-ORDNER.md#fensterbreiten-und-betriebssysteme).

| Nachweis | Ergebnis |
| --- | --- |
| [Vollständige CI 39443580790](https://github.com/lausiklauskn-png/Privat-Brain-Pro/actions/runs/39443580790) | exakte Quelle, Web-/Mail-Suiten, 319 native Browser-Gegenproben, Unit, Build, Lint, 37 Android-Fälle ohne Fehler/Überspringen |
| [Parallele PR-CI 39443590674](https://github.com/lausiklauskn-png/Privat-Brain-Pro/actions/runs/39443590674) | dieselbe Quelle, ebenfalls vollständig bestanden |
| Browser-Engines in beiden CIs | Firefox und WebKit jeweils 101 Prüfungen; Chromium in der nativen Browsersuite |
| [Signiertes Update 39443727118](https://github.com/lausiklauskn-png/Privat-Brain-Pro/actions/runs/39443727118) | .15 → .16, Sprache erhalten, Offline-Kaltstart und erneutes Einschalten, echte Android-Ordnerauswahl nach ausgeblendetem Hinweis mehrfach geöffnet/abgebrochen, Anbieterauswahl und Rückwege |
| [Veröffentlichung 39445984706](https://github.com/lausiklauskn-png/Privat-Brain-Pro/actions/runs/39445984706) | nur exakt geprüfte/signierte APK hochgeladen |
| Öffentlicher Download | HTTP 200, Länge, SHA-256 und vollständiger Bytevergleich mit der signierten Update-APK bestanden |

Oberflächenbreiten: 280, 320, 390, 650, 768, 1000, 1280 und 1920 Pixel;
vier Sprachen und größere Schrift. Ausschließlich synthetische lokale Daten.
Engine-Prüfungen unter Linux belegen keine echten iOS-/Windows-/macOS-Geräte.
Android-Emulator ist kein Samsung-/DeX-Gerät. Installierbar bleibt die Android-APK;
native iOS-/Windows-/macOS-/Linux-Ausgaben sind noch nicht vorhanden. Die
unabhängige PWA und die Google-Registrierung bleiben unverändert.

## Historie: .17-Signierfehler vor Wiederherstellung (2026-10-20)

Geplanter unveränderter Quellstand `eb800faf25676055a19a49eea83d0ba158e896ec`,
versionCode 17, versionName `0.1.0-preview.17`. Laut übermitteltem Auftrag ist die
Quell-CI `39458924438` grün; der Release-Versuch `39461965718` scheiterte beim
Lesen des Keystores. Der erfolgreiche CI-Lauf und sein Quellcommit sowie der fehlgeschlagene
Release-Lauf wurden inzwischen über die GitHub-API bestätigt.

Der gemeinsame [Veröffentlichungsweg](VEROEFFENTLICHEN.md) wird vorbereitet.
Noch kein Nachweis für reparierte Secrets, signiertes Update .16 → .17,
Veröffentlichung oder bytegleichen öffentlichen .17-Download. Deshalb noch kein
Abschnitt „Veröffentlichte Version .17“ und keine erfundene APK-Prüfsumme.
Am Tablet ist Bauabschnitt 1 weiterhin nicht gemessen.

Neue Gegenprobe: [Release-Probelauf 39465502932](https://github.com/lausiklauskn-png/Privat-Brain-Pro/actions/runs/39465502932)
mit `dry_run=true` und genau dem .17-Quellcommit scheitert bereits im Schritt
„Vorhandenen Signierschlüssel laden und Alias prüfen“. Updateprobe und
Veröffentlichung wurden folgerichtig übersprungen. Die GitHub-Integration
verweigert den Zugriff auf Environment-Secrets mit HTTP 403.

Lokal bestanden: `npm test`, 14 Maildiensttests, alle nativen Websuiten
(einschließlich 30 Tresorproben mit simulierter Android-Brücke), Android-Debug-Build
und Lint, 8 Unit-Tests ohne Fehler oder Überspringen, Release-Kompilation und
Debug-Build der getrennten Update-Instrumentierung sowie `actionlint`. Die
öffentliche .16 wurde heruntergeladen und mit dem erwarteten Vorschau-Zertifikat
verifiziert; APK-SHA-256: `2e3e6b4d6e8e8307648359b55fca12b5cc205940e78406eeca3f28e5da010eab`.
Diese Erfolge ersetzen die noch fehlende signierte .16→.17-Updateprobe nicht.

Die unabhängige Debug-Funktionsprobe der Update-Instrumentierung bestand im
Job `upgrade-probe-smoke` von Lauf `39465837921`; dieser Lauf wurde später wegen
eines Folgecommits insgesamt abgebrochen. Das erfolgreiche Einzelergebnis bleibt
belegt und ist ausdrücklich keine signierte .16→.17-Probe.

Weitere Signierdiagnose `39467024662`: Mindestens ein erforderliches GitHub-Secret
fehlt im Job; der Ablauf bricht vor Prüfung des Schlüsseldateiformats ab. Das
Environment `android-preview` hat laut API keine Freigabe-/Branchschutzregeln.
Auch die Prüfung auf eine einzelne zusätzliche Base64-Schicht kann ohne die
erforderlichen Secrets nicht ausgeführt werden. Sechs lokale Positiv-/Negativfälle
mit einem temporären **Test**-Keystore bestanden; dabei wurde kein neuer
Vorschau-Schlüssel erzeugt und der echte Vorschau-Fingerabdruck bleibt fest gepinnt.


## Veröffentlichte Version .17 — 2026-10-20

Release-Tag `v0.1.0-preview.17` zeigt unverändert auf main-Commit
`39e8fae98671870962e70d5263416acd21502e37`. Anwendungscode gegenüber
`eb800faf25676055a19a49eea83d0ba158e896ec` unverändert. Vollständige
[Main-CI 39482528010](https://github.com/lausiklauskn-png/Privat-Brain-Pro/actions/runs/39482528010)
erfolgreich einschließlich Firefox, WebKit, Build/Lint und native-smoke.
Originalidentität in [39482529491](https://github.com/lausiklauskn-png/Privat-Brain-Pro/actions/runs/39482529491)
geprüft und ausschließlich verschlüsselt auf main gesichert.

[Release 39484440521, Versuch 2](https://github.com/lausiklauskn-png/Privat-Brain-Pro/actions/runs/39484440521/attempts/2)
erfolgreich: vorhandenen erfolgreichen Build wiederverwendet; kein neues
Schlüsselmaterial, kein neuer Tag und kein neuer APK-Build. Die ursprüngliche
APK ist mit dem Originalsignierer signiert (ein Zertifikat, SHA-256
`362ee70d28da9c4b51e37057c3519a3e6eb2c679059dfb9f56b4003f9374fa80`).
Paket `de.familyprojekt.privatebrain.pro.preview`, Name `Private Brain Pro`,
VersionCode 17 > 16, VersionName `0.1.0-preview.17`, nicht debuggable.

### Fehlerbefund und unveränderte Gegenprobe

Das heruntergeladene Artefakt `signed-upgrade-results` aus Versuch 1 enthält
in `seed.txt` ausschließlich `SIGNED_UPGRADE_FAIL: java.lang.AssertionError:
WebView response timed out`, über `UpgradeProbe.js:43`, `await:48`, `onStart:73`.
Auch das Jobprotokoll bestätigt: .16 und Instrumentierung installiert, dann
Timeout beim ersten WebView-JavaScript-Aufruf. Das Update auf .17 war noch
nicht ausgeführt. Keine belegte Aussage über einen Signatur- oder Migrationsfehler.

[Diagnoselauf 39491051454](https://github.com/lausiklauskn-png/Privat-Brain-Pro/actions/runs/39491051454)
benutzte dieselben drei Artefakt-APKs aus 39484440521 (alte App, neue App,
Instrumentierung) im frischen API-35-Emulator. Nur die Shell-Fehlerdiagnostik
wurde um Logcat, Activity-/WebView-Status, Fenster und Screenshot ergänzt;
Fehlerstatus und alle Prüfungen unverändert. Alle drei Phasen bestanden:
`SIGNED_UPGRADE_SEED_PASS`, `SIGNED_UPGRADE_BASELINE_PASS`,
`SIGNED_UPGRADE_VERIFY_PASS`. Der Timeout ließ sich nicht reproduzieren;
seine tiefere Ursache ist aus dem ersten Artefakt nicht belegbar. Keine
Timeout-Erhöhung, automatischen Testwiederholungen oder Änderungen am App-Code.

Danach nur die fehlgeschlagenen/abhängigen Jobs des ursprünglichen Releases
erneut gestartet. [Updatejob 118867063256](https://github.com/lausiklauskn-png/Privat-Brain-Pro/actions/runs/39484440521/job/118867063256)
mit der ursprünglichen Probe ebenfalls erfolgreich: alle drei PASS-Marker,
keine FAIL-Marker. Prüfung ohne Deinstallation: Sprache, localStorage,
IndexedDB-Katalog, verschlüsseltes synthetisches Konto, Offline-Kaltstart,
Speicherort-Einstellung und echter Android-Ordnerdialog mit Abbrechen.
Das bestätigt das signierte .16→.17-Update im Emulator, keine Messung an
Klaus' Tablet und keine echte Mailanbieter-Anmeldung.

### Veröffentlichung und öffentliche Downloadprüfung

[Publish-Job 118868309640](https://github.com/lausiklauskn-png/Privat-Brain-Pro/actions/runs/39484440521/job/118868309640)
erst nach erfolgreicher Updateprobe grün. Öffentliche Vorschau seit
2026-10-20, 22:28:50 Uhr Europe/Berlin.

[APK .17 herunterladen](https://github.com/lausiklauskn-png/Privat-Brain-Pro/releases/download/v0.1.0-preview.17/Private-Brain-Pro-0.1.0-preview.17.apk)
— 5.634.429 Bytes. Unabhängig über den öffentlichen Link heruntergeladen,
mit `cmp` bytegleich gegen `signed-release` aus dem ursprünglichen Build
geprüft. `sha256sum -c SHA256SUMS` auf dem Artefakt ebenfalls erfolgreich.

SHA-256: `859c0b16c3517527a21deff909767e572603f7818e2c5ce9e8424dfa3ade097c`.

Erst jetzt sind die alten vier `ANDROID_KEYSTORE_*`-/Alias-Secrets zur Löschung
freigegeben; diese Sitzung hat sie nicht gelöscht. `PB_SIGNING_UNLOCK` und die
verschlüsselte Identität samt Offline-Sicherung behalten. Keine Schlüssel oder
Passwörter lokal wiederhergestellt. PWA und geschützte Module unverändert.


## Veröffentlichte Version .18 — 2026-10-21

Veröffentlicht am 2026-10-20 um 22:56:53 UTC, entsprechend 2026-10-21 um 00:56:53 Uhr in Europe/Berlin.

[APK .18](https://github.com/lausiklauskn-png/Privat-Brain-Pro/releases/download/v0.1.0-preview.18/Private-Brain-Pro-0.1.0-preview.18.apk) über die vorhandene .17 installieren, nicht deinstallieren.
Quellcommit und Tag `v0.1.0-preview.18`: `090503e1b4115e0e9bea07359d637b47de0e10e6`, VersionCode 18.
Der Tag .17 bleibt unverändert auf `39e8fae98671870962e70d5263416acd21502e37`.

- Reparatur: Fünf Shamir-Ersatzschlüssel des unteren Tresors werden über Androids Dokumentdialog tatsächlich gespeichert. Abbruch/Schreibfehler sperren die Einrichtung; Wiederholung verwendet dieselben Anteile. Passwortwechsel und verspätete Antworten nach Schließen sind abgesichert. Die Schlüssel gelten nicht für das getrennte Tablet-/SD-Speicherort-Passwort.
- Enthalten sind auch die native VaultCode-Rekursionskorrektur und die Navigationskorrektur gegen übermäßiges `history.replaceState`. Die auf main vorbereitete Schutzfunktion aus PR #44 ist **nicht** in dieser Reparatur-APK enthalten; deren Code auf main bleibt erhalten. PWA und geschützte Drift-Guard-Module unverändert.
- Vollständige Quell-CI [39508996409](https://github.com/lausiklauskn-png/Privat-Brain-Pro/actions/runs/39508996409) auf demselben früheren main-Commit grün: Web/Mail, Chromium/Firefox/WebKit, Build/Lint/Unit und 41 Android-Fälle ohne Fehler/Überspringen. 18 gezielte Browser-Gegenproben prüfen echte Shamir-Erzeugung, alle zehn Dreierkombinationen, Ablehnung von zwei Anteilen und Wiederherstellung. Der Android-Test schreibt über die echte Java-Brücke und ContentResolver in eine isolierte Testdatei und stellt aus deren Anteilen den Tresor wieder her; der Dateidialog wird vom Testmonitor beantwortet. Keine Messung an Klaus' Tablet/SD-Karte. Identitätsprüfung 39508996281 grün.
- Release-Werkzeuge von main `235c7b124267e06e3d16fdb550d22cb7c147e2f6`: PR #45 bindet die Updateprobe nach Activity-Neustart an die aktuelle WebView. Das Fehlerartefakt von 39506966582 belegte eine Activity-Neuerstellung und Zugriffe der Probe auf eine zerstörte WebView. CI 39508757517 bestand inklusive aller drei erzwungenen Neustartphasen (`RECREATE_READY` und `PASS`) und 46 Android-Fällen. Keine Assertions, Fristen oder Datenerhaltungsbedingungen abgeschwächt; die zusätzlichen fünf Schutztests gehören zum Werkzeug-/main-Stand und nicht zum .18-Appumfang.
- Release [39510666137](https://github.com/lausiklauskn-png/Privat-Brain-Pro/actions/runs/39510666137), Build/Signatur/Metadaten 118930592157, signiertes Update **.17 → .18** 118933109306, Veröffentlichung 118933930393: alle erfolgreich. Geprüft wurden erhaltene Daten, Sprache, Offline-Kaltstart, Speicherort-Einstellung und Android-Ordnerauswahl. Originalsignierer ausschließlich in Actions, unveränderter Zertifikat-Pin.
- Der Release-Job hat den öffentlichen APK-Download mit `cmp` bytegleich zum signierten Artefakt geprüft. Der zusätzliche unabhängige Download stimmt in SHA-256 und Größe mit den veröffentlichten Prüfsummen und GitHub-Assetdaten überein. In dieser öffentlichen APK ist `native-recovery.js` bytegleich zur Quelle und die native Speichermethode vorhanden; `native-protect.js`/`ProProtectPlugin` aus PR #44 sind nicht enthalten.

SHA-256: `6258bbb6d340b0e2404ff02c294bf011f4824b2cbfea5b6487ed8c102f803fa9`

Größe: 5.637.591 Bytes

APK: https://github.com/lausiklauskn-png/Privat-Brain-Pro/releases/download/v0.1.0-preview.18/Private-Brain-Pro-0.1.0-preview.18.apk

[Bedienung und Prüfgrenzen](TRESOR-ERSATZSCHLUESSEL.md). Es wurden keine echten Nutzerpasswörter oder Ersatzschlüssel verwendet. `PB_SIGNING_UNLOCK` bleibt erforderlich; keine neue Signieridentität und keine weiteren Secret-Löschungen durch diese Sitzung.


## Veröffentlichte Version .19 — 2026-10-21

**Vorschau .19 veröffentlicht (2026-10-21), Nachfolgeversion von .18.**
[APK .19](https://github.com/lausiklauskn-png/Privat-Brain-Pro/releases/download/v0.1.0-preview.19/Private-Brain-Pro-0.1.0-preview.19.apk) über die vorhandene App installieren, nicht deinstallieren.
Tag `v0.1.0-preview.19` exakt auf main-Commit `418ff2eeced686af8145aecd2d5e82a746a25f18`, VersionCode 19. Enthält PR #44 (Schutz-Prüfstelle) und PR #46 (Versionsnummer), einschließlich der Reparaturen aus .18.
Vollständige Main-CI 39570196725 einschließlich native-smoke grün: 46 Android-Fälle ohne Fehler/Überspringen, 34 Schutz-Simulationen und 18 Ersatzschlüssel-Gegenproben. Release 39575223652: Signatur/Metadaten 119138967179, signiertes Update **.18 → .19** 119141943511 und Veröffentlichung 119142938424 erfolgreich. Daten, Sprache, Offline-Kaltstart, Speicherort-Einstellung und Android-Ordnerauswahl erhalten/geprüft.
Öffentlicher Download im Release-Job mit `cmp` bytegleich zum signierten Artefakt. Zusätzlicher unabhängiger Download stimmt in SHA-256 und Größe mit SHA256SUMS und GitHub-Assetdaten überein; die ausgelieferten Dateien `native-protect.js` und `native-recovery.js` stimmen bytegleich mit der Quelle überein.
SHA-256: `b5851f24eee940078f1cd5805e64e0eb5482ab4d3cdf8e3d83f216ffef6d6604` (5.667.836 Bytes). Originalsignierer ausschließlich in Actions; `PB_SIGNING_UNLOCK` behalten. PWA und geschützte Module unverändert.
Die Schutz-Prüfstelle ist enthalten, bleibt aber ein begrenzter Schutz anhand von Regeln/Listen. Echte Anbieterzugänge und Klaus' Tablet wurden nicht getestet; die dokumentierten Anbieter-/Lizenzgrenzen bleiben bestehen.
[Bedienung und Grenzen](SCHUTZ-VIREN-SPAM-BETRUG.md), [Prüfstand](PRUEFSTAND-ANDROID.md#veröffentlichte-version-19--2026-10-21).

Quell-CI: [39570196725](https://github.com/lausiklauskn-png/Privat-Brain-Pro/actions/runs/39570196725). Release: [39575223652](https://github.com/lausiklauskn-png/Privat-Brain-Pro/actions/runs/39575223652). Veröffentlichung UTC: `2026-10-21T09:22:25Z`.

Die Versions-Tags .17 und .18 wurden nicht verändert. Keine App-, Test-, Signier- oder Workflowänderung für diesen Release; anschließend nur die Veröffentlichungsbelege ergänzt.


## Veröffentlichte Version .24 — 2026-10-22

- **Inhalt:** PR #58 (Reparaturen nach Klaus' Test von .23 am Tablet: 🎤 immer über Androids Sprachfenster, mehrere Mails löschen/verschieben mit einer Verbindung je 200 Mails, „Bedeutungssuche“ führt ohne Modell zum Schalter in den Einstellungen, Links „Mistral-/Google-Schlüssel holen“ neben dem KI-Schlüssel), Quelle main `18a2edc38c42b4562c169603437cc4e5e8dcec22`, VersionCode 24.
- **Main-CI:** 39711900162 grün, einschließlich native-smoke.
- **Release-Lauf:** [39714226568](https://github.com/lausiklauskn-png/Privat-Brain-Pro/actions/runs/39714226568): Signatur, signiertes Update .23 → .24 ohne Deinstallation, Veröffentlichung.
- **Download:** unabhängig geladen und gegen `SHA256SUMS` geprüft:
  - APK SHA-256 `ac255dddd5755bf87c8e2be4798e6840e16f626c86477b36754d5728caf8d21f`, 5.791.582 Bytes.
  - App Bundle (.aab) SHA-256 `f10fe265bce8310e3b41519a7d639345efa4726810a8d41ca7513fc6293548fe`, 5.605.275 Bytes.
- **Nicht geprüft:** Messung an Klaus' Tablet, Sammel-Verschieben an einem echten IMAP-Server (der Probe-Server kann kein MOVE), ob Gmail die gelöschten Mails im Papierkorb zeigt.

## Veröffentlichte Version .23 — 2026-10-21

- **Inhalt:** PR #56 (Bedeutungs-Modell per Schalter laden, Absturzschutz, App Bundle, Ablageordner nach Neustart, ProProtect bei geschlossener Ansicht), Quelle main `8ee68c64ada630f63d7ca450be16faf265e87e2b`, VersionCode 23.
- **Main-CI:** 39661901310 grün, einschließlich native-smoke mit `NativeSemanticTest`: echter Download von `family-projekt.de` (155,5 MB in 21 s im Emulator), danach ohne Internet aus dem App-Speicher geladen, Bedeutung erkannt.
- **Release-Lauf:** [39664148878](https://github.com/lausiklauskn-png/Privat-Brain-Pro/actions/runs/39664148878): Signatur, signiertes Update .22 → .23 ohne Deinstallation, Veröffentlichung.
- **Download:** unabhängig geladen und gegen `SHA256SUMS` geprüft:
  - APK SHA-256 `bc4d52ad08e5953e5d3b8472c4e3bb11ada857b1d9120d1d16911296acf19be3`, 5.788.208 Bytes.
  - App Bundle (.aab, für Google Play, gleiches Zertifikat) SHA-256 `97aeddaac557c0e8e3dfa2b6b142e78b2567096f0db87c8eeaf4ba3f1dda5192`, 5.601.799 Bytes.
- **Nicht geprüft:** Messung an Klaus' Tablet, Speicherbedarf des Modells auf echten Geräten, Hochladen bei Google Play.

## Veröffentlichte Version .22 — 2026-10-21

- **Inhalt:** PR #54 (Teilen an Private Brain Pro, Ladebalken in Schritten beim Einlesen, 🤖 KI beim Schreiben mit Verdecken), Quelle main `64046085730fa56992678e1c5091e2382f360465`, VersionCode 22.
- **Main-CI:** 39640944240 grün, einschließlich native-smoke.
- **Release-Lauf:** [39643202428](https://github.com/lausiklauskn-png/Privat-Brain-Pro/actions/runs/39643202428).
  - Start über `workflow_dispatch` (auf Klaus' Bitte „Schick mir den Link, sobald .22 da ist“): channel `test`, tag `v0.1.0-preview.22`, `source_commit` wie oben.
  - Erfolgreich: Signatur und Metadaten, signiertes Update .21 → .22 ohne Deinstallation, Veröffentlichung als Pre-Release.
- **Download:** unabhängig geladen, SHA-256 `479abec09a686d9ec46231ec60ea21754054e4f301559b2d2a67aac4e5bd3fa5`, 5.774.747 Bytes. Beides stimmt mit `SHA256SUMS` und dem Digest des GitHub-Assets überein.
- **Nicht enthalten:** Bedeutungs-Modell in der App (`enabled: false`, Absturz im Emulator; Lösung für .23).
- **Nicht geprüft:** Messung an Klaus' Tablet, Teilen aus echten Apps, echte Mistral-Antwort.

## Veröffentlichte Version .21 — 2026-10-21

- **Inhalt:** PR #53 (Newsletter abmelden, Internet-Lampe, Spracheingabe über Android, ein „Datei auswählen“), Quelle main `114989a05e37a7261fbd88a98a97fbdeea29686d`, VersionCode 21.
- **Main-CI:** 39627948087 grün, einschließlich native-smoke.
- **Release-Lauf:** [39630287203](https://github.com/lausiklauskn-png/Privat-Brain-Pro/actions/runs/39630287203).
  - Start über `workflow_dispatch` (auf Klaus' Bitte „ich benötige die aktuelle Version zum Herunterladen“): channel `test`, tag `v0.1.0-preview.21`, `source_commit` wie oben.
  - Erfolgreich: Signatur und Metadaten, signiertes Update .20 → .21 ohne Deinstallation, Veröffentlichung als Pre-Release.
- **Download:** unabhängig geladen, SHA-256 `552fa8d53a026cc339ee1fb4074aaed04d611ae1d15008e333e329d770a98b38`, 5.759.643 Bytes. Beides stimmt mit `SHA256SUMS` und dem Digest des GitHub-Assets überein.
- **Nicht enthalten:** Teilen an Private Brain Pro (geplant für .22).
- **Nicht geprüft:** Messung an Klaus' Tablet, echtes Android-Sprachfenster, echte Mailanbieter.

## Veröffentlichte Version .20 — 2026-10-21

- **Inhalt:** PR #48–#52, Quelle main `ca2e4dccf39599b65f4de70848ef8bc6595f0e07`, VersionCode 20.
- **Main-CI:** 39609980272 grün, einschließlich native-smoke.
- **Release-Lauf:** [39613483028](https://github.com/lausiklauskn-png/Privat-Brain-Pro/actions/runs/39613483028).
  - Start über `workflow_dispatch`: channel `test`, tag `v0.1.0-preview.20`, `source_commit` wie oben.
  - Erfolgreich: Signatur und Metadaten, signiertes Update .19 → .20 ohne Deinstallation, Veröffentlichung als Pre-Release.
- **Download:** unabhängig geladen, SHA-256 `936649e6faa6eb23af07ed2fa7b5cdef4e884d13f0de68fcb3b1eca2a5c33d14`, 5.749.114 Bytes. Beides stimmt mit `SHA256SUMS` und dem Digest des GitHub-Assets überein.
- **Nicht enthalten:** PR #53 (Newsletter abmelden).
- **Nicht geprüft:** Messung an Klaus' Tablet und echte Mailanbieter.
