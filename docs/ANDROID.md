# Android-Grundversion

## Varianten und Daten

- `debug`: Entwicklung, Kennung `de.familyprojekt.privatebrain.pro.preview.debug`.
  Debugsignierung; keine dauerhafte öffentliche Update-Linie.
- `preview`: installierbare, extern signierte App **Private Brain Pro**, Kennung
  `de.familyprojekt.privatebrain.pro.preview`. Kein Web-Debugging.
- `release`: spätere stabile App, Kennung `de.familyprojekt.privatebrain.pro`.

Vorschau- und stabile Update-Linie sind getrennte Installationen und übernehmen einander nicht
automatisch die Daten. Für Updates innerhalb einer Linie müssen Kennung und
Signierschlüssel gleich bleiben und `versionCode` steigen. Der Katalog liegt im
privaten WebView-Speicher. Updates löschen ihn nicht absichtlich; die signierte Updateprobe ist im
[Prüfstand](PRUEFSTAND-ANDROID.md) dokumentiert. Vollständige Nutzerdatenmigration
am Tablet bleibt gesondert zu prüfen. Deinstallieren löscht Appdaten.
Die Daten einer Browser-PWA werden nicht automatisch in die native App übernommen.
Android-Backup ist zunächst ausgeschaltet, damit spätere Kontogeheimnisse nicht
unbeabsichtigt in Gerätesicherungen gelangen. Vor Produktionsreife ist ein explizites,
verschlüsseltes Sicherungs- und Wiederherstellungskonzept erforderlich.

Ab Version .13 heißt die App ohne „Test“ **Private Brain Pro**. Die technische
Update-Linie bleibt erhalten. [Namensänderung und Google](APP-NAME.md).

## Build und Veröffentlichungen

JDK 21, Node 22+, Android SDK Plattform 36. Gradle 8.14.3 mit festem SHA-256,
Capacitor 8.5.3 und npm-Lockfiles. Erst `npm run sync:android`, dann im Verzeichnis
`android` bauen. SDK-Pfad lokal über `ANDROID_HOME` oder die ignorierte
`android/local.properties` konfigurieren. Schlüssel nie im Checkout ablegen.

GitHub: **Actions → Android und Web-Prüfungen** erzeugt pro Zweig ein Debug-Artefakt.
Es wird nicht als Nutzerupdate verteilt. Die vollständigen Browserproben nutzen
mitgelieferte öffentliche PDF-Testdateien und brauchen keinen Zugriff auf weitere
private Repositories.

Für verteilbare Testversionen: GitHub-Umgebung `android-preview`, später getrennt
`android-production`, mit folgenden **Secrets** (Werte niemals in Chat/Commit):

- `ANDROID_KEYSTORE_BASE64`
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEY_PASSWORD`

Der Schlüssel ist dauerhaft und unabhängig von der Cloud-Maschine sicher zu sichern;
vor öffentlicher Verteilung muss die Wiederherstellung geprüft sein. Für Produktion
keinen flüchtigen Debugschlüssel verwenden. Ein lokal erstellter Vorschau-Schlüssel
ist ausschließlich für Tests und kein nachgewiesenes langfristiges Backup.

Der Ablauf **Signierte Android-Testversion oder stabile Version** kann für
Vorschauen durch einen Versions-Tag auf einem geprüften main-Commit ausgelöst
werden. Signatur- und Versionsprüfung sowie signierte Emulator-Updateprobe müssen
vor der Veröffentlichung bestehen. [Vollständige Anleitung für beide Sitzungen](VEROEFFENTLICHEN.md).
Manueller Start auf `main` bleibt verfügbar:
`test` + Tag passend zur `versionName` (z. B. `v0.1.0-preview.1`). Die APK wird als
GitHub-Prerelease bereitgestellt, mit überprüfter Signatur und SHA-256. Stabile Tags
haben keinen Vorschauzusatz. `versionName` und `versionCode` vor jeder neuen Version
anpassen. Produktion baut zusätzlich ein AAB zur Vorbereitung auf Google Play;
keine Store-Veröffentlichung und keine Kostenfreigabe sind damit verbunden.

Bei direkter APK-Installation bestätigt der Nutzer Androids Installationsdialog und
gegebenenfalls die Freigabe der Download-App.

Seit Vorschau 0.1.0-preview.4 steht unter Einstellungen „Auf Updates
prüfen“. Die Prüfung läuft nur nach Antippen, verbindet das Gerät mit der öffentlichen
GitHub-Release-API und überträgt keine Dokumente, Mailkonten oder Zugriffstokens.
GitHub sieht dabei technisch die Netzwerkadresse des Geräts. Offline und bei
API-Limits erscheint eine verständliche Meldung; die App bleibt nutzbar.

Die native Schnittstelle vergleicht numerische Versions-Tags getrennt für
Vorschau und Produktion. Entwürfe und unpassende Kanäle werden ausgelassen.
Es werden die letzten 30 öffentlichen Releases betrachtet. Nur ein Release mit
passend benannter hochgeladener APK wird angeboten. Entwicklungsbuilds erhalten
keine Nutzerupdates. Der Download-Link wird fest aus Repository, geprüftem Tag und
erwartetem Dateinamen erzeugt; von der Webseite übergebene URLs werden ignoriert.
„APK herunterladen“ öffnet den Browser. Android verlangt weiterhin die Zustimmung
zur Installation und prüft die APK-Signatur. Die Versionsprüfung lädt und installiert
selbst keine APK und überprüft deren Inhalt daher nicht vorab. Release-Account und
Signierschlüssel bleiben sicherheitsrelevant. Ein privates Repository würde eine
andere Veröffentlichungsstrategie verlangen; keine GitHub-Tokens in die APK einbauen.

Die bereits veröffentlichte Vorschau 0.1.0-preview.2 besitzt diesen Knopf noch nicht.
Für den erstmaligen Wechsel auf eine neuere Version ist deren Download-Link nötig.

## Nächste native Schritte

1. Storage Access Framework und dauerhafte lokale Kopien über eine enge Plugin-API.
2. Implementierten Mailadapter für Telekom/Hetzner, mehrere Konten und Keystore am Gerät prüfen.
3. Persistente Versandzustände und vorhandene Entwürfe bei Updates am Gerät prüfen.
4. Anhänge/Ordner/Entwürfe und Betriebssystem-Hintergrundarbeit tatsächlich am Gerät testen.
5. Gmail OAuth über Systembrowser/PKCE vorbereiten, ohne Client-Geheimnis im Paket.
6. Modell und Laufzeit lokal bündeln und offline prüfen; Modell-/Fremdlizenzen erhalten.
7. Updates, Datenmigration, sichere Sicherung und Wiederherstellung prüfen.

Die nativen Schnittstellen sind plattformgebunden implementiert; gemeinsame
Oberfläche und unveränderte Prüfmodule bleiben für spätere iOS-Adapter verwendbar.

## Aktueller Prüfstand

Der bisherige gepackte Webteil besteht 37 eigene Browserprüfungen; der native
Mailadapter ergänzt 24 Oberflächenprüfungen mit simulierter Java-Brücke. Acht visuelle Vergleiche
(16 Screenshots in [design](design/README.md)) bestätigen die ausgewählten
bestehenden Schrift-, Farb-, Rundungs- und Abstandsregeln. Android-Debugbuild und
Lint liefen erfolgreich. Das ist kein Nachweis für echte Mailanmeldung,
Modellqualität, Benachrichtigungen oder vollständige Funktionsgleichheit.


## Native Startprüfung vor Release

Der Job `native-smoke` verwendet einen hardwarebeschleunigten Android-35-Emulator
und führt `:app:connectedDebugAndroidTest` aus. Der Test prüft die echte gepackte
Seite, Navigation und Java-Bridge. Die Release-Pipeline verlangt einen erfolgreichen
Starttest desselben Commits. Aktueller und historischer Prüfstand:
[PRUEFSTAND-ANDROID.md](PRUEFSTAND-ANDROID.md). Ohne KVM den lokalen Software-Emulator
nicht als verlässlichen Ersatz für diesen Test betrachten.


## Helles Pro-Icon

Auf Nutzerwunsch erhält nur die Pro-App einen hellen Icon-Hintergrund.
Die 3D-Bubbles und ihre Leuchtverbindungen bleiben das Motiv. Header-Icon,
192-/512-Pixel-Icons und Android-Launcher verwenden dieselbe Variante; auch
der adaptive Android-Hintergrund ist hell. Master unter
`artwork/private-brain-pro-light.png`, Größenexport über
`node tools/native/export-pro-icons.mjs`. Der Hell-/Dunkelmodus der Oberfläche
bleibt erhalten. Die PWA-Icons im anderen Repository bleiben unverändert.

## Direkte Mailanbindung ab Vorschau .4

Der bisherige Dienst-Token-Dialog entfällt in der nativen App. Zugangsdaten werden
in einem Android-Dialog erfasst und mit einem nicht exportierbaren Keystore-
Schlüssel verschlüsselt gespeichert. Hintergrundabruf und Gmail sind noch offen.
Details zu Versandzuständen, Größenlimits und Bibliotheksrechten:
[NATIVE-MAIL-ARCHITEKTUR.md](NATIVE-MAIL-ARCHITEKTUR.md).

## Erste direkte Geräte-Mail testen

Aktueller [APK-Download (.31)](https://github.com/lausiklauskn-png/Privat-Brain-Pro/releases/download/v1.0.0-preview.31/Private-Brain-Pro-1.0.0-preview.31.apk).
Über die vorhandene Test-App installieren, ohne sie zu deinstallieren.
Postfach → Mailkonto verbinden → Telekom / T-Online oder Hetzner.
Die E-Mail-Adresse und das separate Passwort für E-Mail-Programme nur im nativen
Dialog eingeben. Bei gleichem Benutzernamen darf dieses Feld leer bleiben.
Die vorgegebenen Telekom-Server sind IMAPS 993 und SMTPS 465. Bei Hetzner die
zum eigenen Konto gehörenden Servernamen verwenden.

Erst Empfang und eine kleine Testmail an die eigene Adresse prüfen. Bei unklarem
Versand beim Anbieter nachsehen; nicht blind nochmals senden. App-Geheimnisse
niemals in Chat oder Repository schreiben.
