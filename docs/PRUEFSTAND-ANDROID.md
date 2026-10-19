# Prüfstand Android – 2026-10-19

## Erfolgreich

- Vollständiges `npm test`: alle 38 verketteten Befehle erfolgreich abgeschlossen.
  Die darin enthaltenen Provider-/Modellproben sind teilweise simuliert und
  beweisen keine echte Mailanmeldung oder echte Modellqualität.
- 26 Prüfungen des tatsächlich gepackten nativen Webteils: Import, Suche,
  Katalogerhalt nach Neuladen, Navigation, drei Breiten, vier Sprachen, Themes,
  kein PWA-Service-Worker und keine unbehandelten Browserfehler.
- 14 Maildiensttests erfolgreich, keine übersprungenen Tests.
- Drift-Guard: 21 Module bytegleich.
- Acht Designvergleiche, 16 Screenshots: ausgewählte bestehende Schriften,
  Farben, Rundungen und Abstände unverändert.
- `assembleDebug lintDebug` und extern signiertes `assemblePreview lintPreview`
  erfolgreich. Vorschau-Lint: 0 Fehler, 6 Warnungen (vorwiegend geerbte Ressourcen
  und fehlende monochrome Icons; das originale farbige 3D-Icon bleibt erhalten).
- APK-Signatur mit `apksigner` geprüft; App-Kennung `.pro.preview`, Version
  `0.1.0-preview.1-test`, Android 7+ (API 24), Ziel-API 36, kein Debug-Flag.
- Produktionsabhängigkeiten laut `npm audit --omit=dev`: keine bekannten Lücken.
- GitHub-Workflows mit actionlint geprüft.
- Eigener nativer Instrumentierungstest mit `:app:assembleDebugAndroidTest`
  erfolgreich kompiliert. Dieser Test ist dadurch noch nicht ausgeführt.

## Native Ausführung noch nicht bestätigt

Die signierte APK wurde im Android-15-Emulator installiert (`adb install`: Success).
Das Startkommando wurde akzeptiert (`am start -W`: Status ok). Danach stürzte
WebView 124 im Renderer mit SIGTRAP ab; die App wurde vom WebView-Abbruch mit
beendet. Eine sichtbare funktionsfähige App-Oberfläche wurde nicht bestätigt.

Die Cloud hat kein `/dev/kvm`. Der Software-Emulator zeigte währenddessen auch
Abstürze von Bluetooth und ANRs mehrerer Systemdienste. Die unabhängige vorinstallierte
WebView-Kontroll-App zeigte den Dialog „Process system isn't responding“.
Das belegt einen gestörten Testlauf; es beweist nicht, dass die App auf einem echten
Gerät fehlerfrei funktioniert, und isoliert den Rendererfehler noch nicht vollständig.

Ein GitHub-Actions-Job `native-smoke` ist für einen hardwarebeschleunigten Emulator
eingerichtet. Er prüft echte gepackte Oberfläche, Suchnavigation und den nativen
Java-Bridge-Aufruf. Releases verlangen einen erfolgreichen Starttest desselben
Commits. Der Actions-Lauf konnte wegen blockiertem `api.github.com` hier noch nicht
abgerufen werden. Kein PR, Merge oder Release wird als erfolgreich behauptet.

## Artefakte und Grenzen

Lokal unter `/workspace/artifacts`: signierte APK, SHA256SUMS, Signaturprüfung,
APK-Metadaten und Prüfprotokolle. Signiermaterial bleibt ausschließlich außerhalb
des Repositories; langfristiges Backup und Produktionssignierung sind nicht bestätigt.

Noch nicht umgesetzt: direkte native Mailanbindung, Keystore für Mailkonten,
dauerhafte Geräteordner, Benachrichtigungen/Hintergrundabruf, Updateprüfung und
lokales e5-Modell. Keine vollständige Funktionsgleichheit behaupten. Tablet/DeX,
echte Konten und tatsächliche Update-/Migrationsprobe bleiben offen.

PWA-Checkout wurde nicht verändert. Code ist auf dem Zweig `android-grundversion`
gesichert. Zur Fortsetzung: vorbereitete Netzfreigabe `api.github.com` in den
Umgebungseinstellungen übernehmen, dann API-Zugriff und Actions-Ergebnisse prüfen,
Native-Startfehler weiter untersuchen und erst nach erfolgreicher Prüfung veröffentlichen.


## Icon-Aktualisierung

Vorschau 0.1.0-preview.2 (versionCode 2) verwendet die ausdrücklich beauftragte
helle Pro-Icon-Variante bei gleichem 3D-Bubble-Motiv. Kopf- und Android-Icon
sowie 192-/512-Pixel-Exporte sind konsistent. Diese Änderung behebt oder bestätigt
den zuvor beschriebenen nativen Starttest nicht.
