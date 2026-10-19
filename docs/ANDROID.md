# Android-Grundversion

## Varianten und Daten

- `debug`: Entwicklung, Kennung `de.familyprojekt.privatebrain.pro.preview.debug`.
  Debugsignierung; keine dauerhafte öffentliche Update-Linie.
- `preview`: installierbare, extern signierte Testversion, Kennung
  `de.familyprojekt.privatebrain.pro.preview`. Kein Web-Debugging.
- `release`: spätere stabile App, Kennung `de.familyprojekt.privatebrain.pro`.

Test und stabil sind getrennte Installationen und übernehmen einander nicht
automatisch die Daten. Für Updates innerhalb einer Linie müssen Kennung und
Signierschlüssel gleich bleiben und `versionCode` steigen. Der Katalog liegt im
privaten WebView-Speicher. Updates löschen ihn nicht absichtlich; eine tatsächliche
Update-/Migrationsprobe auf Android steht noch aus. Deinstallieren löscht Appdaten.
Die Daten einer Browser-PWA werden nicht automatisch in die native App übernommen.
Android-Backup ist zunächst ausgeschaltet, damit spätere Kontogeheimnisse nicht
unbeabsichtigt in Gerätesicherungen gelangen. Vor Produktionsreife ist ein explizites,
verschlüsseltes Sicherungs- und Wiederherstellungskonzept erforderlich.

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

Manueller Ablauf **Signierte Android-Testversion oder stabile Version** auf `main`:
`test` + Tag passend zur `versionName` (z. B. `v0.1.0-preview.1`). Die APK wird als
GitHub-Prerelease bereitgestellt, mit überprüfter Signatur und SHA-256. Stabile Tags
haben keinen Vorschauzusatz. `versionName` und `versionCode` vor jeder neuen Version
anpassen. Produktion baut zusätzlich ein AAB zur Vorbereitung auf Google Play;
keine Store-Veröffentlichung und keine Kostenfreigabe sind damit verbunden.

Bei direkter APK-Installation bestätigt der Nutzer Androids Installationsdialog und
gegebenenfalls die Freigabe der Download-App. Noch kein Updateprüfer implementiert:
öffentliche/verifizierte Update-Metadaten und private GitHub-Repositories müssen
zuerst sauber getrennt werden. Keine Zugriffstokens in eine APK einbetten.

## Nächste native Schritte

1. Storage Access Framework und dauerhafte lokale Kopien über eine enge Plugin-API.
2. Mailadapter für Telekom/Hetzner direkt vom Gerät, mehrere Konten und Keystore.
3. Persistente Versandwarteschlange; unklarer SMTP-Ausgang nie automatisch erneut senden.
4. Anhänge/Ordner/Entwürfe und Betriebssystem-Hintergrundarbeit tatsächlich am Gerät testen.
5. Gmail OAuth über Systembrowser/PKCE vorbereiten, ohne Client-Geheimnis im Paket.
6. Modell und Laufzeit lokal bündeln und offline prüfen; Modell-/Fremdlizenzen erhalten.
7. Updates, Datenmigration, sichere Sicherung und Wiederherstellung prüfen.

Die nativen Schnittstellen sind plattformgebunden implementiert; gemeinsame
Oberfläche und unveränderte Prüfmodule bleiben für spätere iOS-Adapter verwendbar.

## Aktueller Prüfstand

Der gepackte Webteil besteht 26 eigene Browserprüfungen. Acht visuelle Vergleiche
(16 Screenshots in [design](design/README.md)) bestätigen die ausgewählten
bestehenden Schrift-, Farb-, Rundungs- und Abstandsregeln. Android-Debugbuild und
Lint liefen erfolgreich. Das ist kein Nachweis für echte Mailanmeldung,
Modellqualität, Benachrichtigungen oder vollständige Funktionsgleichheit.


## Native Startprüfung vor Release

Der Job `native-smoke` verwendet einen hardwarebeschleunigten Android-35-Emulator
und führt `:app:connectedDebugAndroidTest` aus. Der Test prüft die echte gepackte
Seite, Navigation und Java-Bridge. Die Release-Pipeline verlangt einen erfolgreichen
Starttest desselben Commits. Lokaler Prüfstand und noch offene Ausführung:
[PRUEFSTAND-ANDROID.md](PRUEFSTAND-ANDROID.md). Ohne KVM den lokalen Software-Emulator
nicht als verlässlichen Ersatz für diesen Test betrachten.
