# Android-Grundversion

Aktuelle öffentliche Version **1.0.37**: [Update-APK](https://github.com/lausiklauskn-png/Privat-Brain-Pro/releases/download/v1.0.37/Private-Brain-Pro-1.0.37.apk).
[Startkorrektur und Grenzen](design/umbau-2026-10-24/STARTDARSTELLUNG-37.md),
[öffentlicher Nachweis](design/umbau-2026-10-24/android-1.0.37-pruefung.json).

## Varianten, Veröffentlichungskanäle und Daten

Die öffentliche Version 1.0.37 aktualisiert die bereits installierte Android-App.
Der technische Paketname bleibt `de.familyprojekt.privatebrain.pro.preview`;
er ist kein Produktzusatz und wird für die Daten- und Updatekompatibilität erhalten.

- `debug`: Entwicklungsbau mit `de.familyprojekt.privatebrain.pro.preview.debug`;
  Debugsignierung, kein öffentlicher Nutzerupdatekanal.
- `preview`: technische Bauvariante für die vorhandene App mit unveränderter Kennung
  `de.familyprojekt.privatebrain.pro.preview` und ursprünglichem Signierer.
  Daraus stammen historische `test`-Ausgaben und die öffentliche `public`-Ausgabe.
- `release`: separates Produktionspaket `de.familyprojekt.privatebrain.pro` für den
  Workflowkanal `stable`. Es ersetzt die vorhandene App nicht und braucht eine
  eigene geprüfte Signieridentität; deren Einrichtung wird hier nicht behauptet.

Für ein Update müssen Paketkennung und Signierer gleich bleiben und `versionCode`
steigen. Die signierte Updateprobe ist im [Prüfstand](PRUEFSTAND-ANDROID.md)
dokumentiert. Die beiden Paketkennungen sind getrennte Installationen; eine
Übernahme zwischen ihnen geschieht nicht automatisch. Der Katalog liegt im privaten
WebView-Speicher. Deinstallieren löscht Appdaten; ein Update wird über die vorhandene
Installation installiert. Eine vollständige Prüfung von Klaus' realen Nutzerdaten
auf dem Tablet bleibt von den synthetischen CI-Belegen getrennt.

Daten einer Browser-PWA werden nicht automatisch in die native App übernommen.
Android-Backup ist ausgeschaltet, damit Kontogeheimnisse nicht unbeabsichtigt in
Gerätesicherungen gelangen. Die App besitzt einen eigenen verschlüsselten
Speicherordner und Katalogsicherungen; [Einrichtung und Wiederherstellung](SPEICHERORT-UND-TRESOR.md).

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

Der Ablauf **Signierte Android-Veröffentlichung** besitzt drei ausdrücklich
getrennte Kanäle:

| Kanal | App-Identität und Veröffentlichung |
|---|---|
| `public` | Stabiles öffentliches Update der vorhandenen `.preview`-Paketkennung, z. B. `v1.0.37`, ursprünglicher Signierer, verpflichtende signierte Updateprobe und GitHub-Release ohne Prerelease-Kennzeichnung. |
| `test` | Historische Prerelease-Updateausgaben derselben Paketkennung mit `v…-preview.N`; ebenfalls ursprünglicher Signierer und signierte Updateprobe. |
| `stable` | Separates Produktionspaket `.pro` mit anderer Identität. Kein Update der bestehenden `.preview`-App; eigene geprüfte Signierkonfiguration erforderlich. |

`public` baut und signiert in der bisherigen Identitätsumgebung `android-preview`.
Der Originalschlüssel bleibt dort; es werden keine Secrets kopiert. Erst der
Veröffentlichungsjob benötigt die geschützte Freigabe von `android-production`.
Damit liegen APK und bestandene Updateprobe vor einer möglichen Freigabeprüfung
bereits konkret vor. `test` bleibt bei `android-preview`; der getrennte Kanal
`stable` behält seine eigene Produktionskonfiguration.

Der bisherige Originalschlüssel ist ausschließlich verschlüsselt im Repository
gesichert. Seine Freigabe `PB_SIGNING_UNLOCK` bleibt im zuständigen GitHub-
Environment. Schlüsselwerte gehören niemals in Chat, Checkout oder Commit;
keinen neuen App-Signierschlüssel für ein Update erzeugen.
[Signieridentität und gesicherter Veröffentlichungsweg](VEROEFFENTLICHEN.md).

Öffentliche Updates werden auf `main` manuell mit `channel=public`, passendem
`tag` wie `v1.0.37` und optionalem vollständigem `source_commit` gestartet.
`dry_run=true` baut, signiert und prüft, veröffentlicht aber nichts. Automatische
Vorschau-Versions-Tags bleiben dem historischen `test`-Kanal vorbehalten.
Vor jedem neuen Release `versionName` und `versionCode` anpassen; alle fachlichen
Prüfungen und die signierte Updateprobe müssen bestehen.

Der öffentliche Release enthält `ANDROID-IDENTITY.json` mit Paketkennung,
Signierer-Pin, Quellcommit, Version, APK-Dateiname und APK-SHA-256. Die Baseline-
Auswahl prüft diese Identität und bei älteren Ausgaben die tatsächliche APK,
statt einen gleich benannten Release einer anderen Paketlinie zu übernehmen.
Der Workflow erstellt gegebenenfalls zusätzlich ein App Bundle; dadurch werden
weder eine Store-Veröffentlichung noch Kosten freigegeben.

Bei direkter APK-Installation bestätigt der Nutzer Androids Installationsdialog und
gegebenenfalls die Freigabe der Download-App.

Seit Vorschau 0.1.0-preview.4 steht unter Einstellungen „Auf Updates
prüfen“. Die Prüfung läuft nur nach Antippen, verbindet das Gerät mit der öffentlichen
GitHub-Release-API und überträgt keine Dokumente, Mailkonten oder Zugriffstokens.
GitHub sieht dabei technisch die Netzwerkadresse des Geräts. Offline und bei
API-Limits erscheint eine verständliche Meldung; die App bleibt nutzbar.

Die native Schnittstelle vergleicht numerische Versionen innerhalb der installierten
Paketlinie. Historische `-preview.N`-Angebote werden nur berücksichtigt, solange
auch die installierte Version noch eine solche Versionskennung hat. Nach dem
Wechsel auf 1.0.36 werden keine Prereleases mehr angeboten, auch nicht mit einer
höheren Hauptversion. Entwürfe und unpassende Veröffentlichungsflags werden verworfen.

Öffentliche Angebote benötigen `ANDROID-IDENTITY.json` mit passendem Paket,
installiertem einzelnen Signierer, Tag/Versionsname, ausdrücklich höherem
VersionCode, erwartetem APK-Namen und vollständiger SHA-256-Angabe. Ein vorhandener
GitHub-Assetdigest muss dazu passen. Die APK-Bytes werden dabei nicht vorab geladen.
`public` gehört zur bisherigen
`.preview`-Paketkennung; das separate `stable`-Paket `.pro` ersetzt sie nicht.
Die Quittung ist auf 16 KiB und feste GitHub-Releaseadressen begrenzt.

Die bereits veröffentlichte Android .35 erkennt die neuen öffentlichen Tags noch
nicht. Für die erste Aktualisierung auf 1.0.36 den oben verlinkten APK-Download
verwenden und über die vorhandene App installieren. Danach unterstützt die neue
Version die öffentlichen Folgeupdates.
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

Quelle `015c9a1266a64f44a1896ead56349094c64e2f9a`: 60 native Fälle ohne Fehler/Skips sowie
38 gezielte Start-/Laufzeitübernahmeprüfungen erfolgreich.
Android: signierte Updateprobe mit Seed/Baseline/Verify bestanden. Der öffentliche APK-Bytevergleich ist
bestanden. [Vollständiger aktueller Prüfstand](PRUEFSTAND-ANDROID.md).
Die Browserprüfung ersetzt keine Messung auf Klaus' Samsung-Gerät.

### Historischer Grundbau

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

Aktueller [APK-Download (1.0.37)](https://github.com/lausiklauskn-png/Privat-Brain-Pro/releases/download/v1.0.37/Private-Brain-Pro-1.0.37.apk).
Über die vorhandene App installieren, ohne sie zu deinstallieren.
Postfach → Mailkonto verbinden → Telekom / T-Online oder Hetzner.
Die E-Mail-Adresse und das separate Passwort für E-Mail-Programme nur im nativen
Dialog eingeben. Bei gleichem Benutzernamen darf dieses Feld leer bleiben.
Die vorgegebenen Telekom-Server sind IMAPS 993 und SMTPS 465. Bei Hetzner die
zum eigenen Konto gehörenden Servernamen verwenden.

Erst Empfang und eine kleine Testmail an die eigene Adresse prüfen. Bei unklarem
Versand beim Anbieter nachsehen; nicht blind nochmals senden. App-Geheimnisse
niemals in Chat oder Repository schreiben.
