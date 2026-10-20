# Nachfolgebrief: Private Brain Pro – Google/Gmail ergänzen

Stand: 2026-10-20. Dieser Brief ist der Arbeitsauftrag für die nächste Sitzung.

## Nächster Auftrag

Google/Gmail als weiteren Mailanbieter neben Telekom/T-Online und Hetzner in der
nativen Android-App ergänzen. Der Nutzer möchte ein Google-Mailkonto hinzufügen,
E-Mails direkt auf seinem Gerät empfangen und versenden und zwischen seinen
Konten wechseln können. Kein eigener Private-Brain-Server, kein Dienst-Token und
kein Termux für die Mailanmeldung. Zunächst Android; spätere iOS-Unterstützung
architektonisch weiter ermöglichen.

Der Nutzer arbeitet ausschließlich auf einem Android-Tablet, auch mit Samsung
DeX, und hat keine Programmiererfahrung. Verständliches Deutsch verwenden,
notwendige Bedienhandlungen Schritt für Schritt erklären. Zusammengehörige
Terminalbefehle nur bei Bedarf in einem gemeinsamen kopierbaren Block liefern.

## Repositories und verbindliche Vorgaben

- Entwicklung ausschließlich in `lausiklauskn-png/Privat-Brain-Pro`.
- `lausiklauskn-png/Privat-Brain` ist die unabhängige PWA und bleibt unverändert.
- `lausiklauskn-png/Sende-Pruefer` ist die Design-/Postfachreferenz.
- Zuerst tatsächlichen Repository-, Umgebungs- und Anweisungsstand prüfen:
  `CLAUDE.md`, gegebenenfalls `AGENTS.md`, Lizenzbedingungen und Dokumentation.
  Frühere Umgebungsprobleme oder Prüfergebnisse nicht ungeprüft übernehmen.
- Die 21 durch den Drift-Guard geschützten Module bleiben bytegleich. Neue Logik
  ausschließlich im dafür vorgesehenen App-/Adaptercode ergänzen.
- Freibrief gilt: selbstständig implementieren, testen, committen, PRs erstellen
  und nach erfolgreichen relevanten Prüfungen zusammenführen. Nicht bei jedem
  Schritt um Bestätigung bitten. Notwendige Nutzeraktionen konkret benennen und
  technische Vorarbeiten dafür vorher erledigen. Kein eigener Desktop-PC nötig.
- Test-APKs über GitHub Releases sind erlaubt. Öffentliche Store-Veröffentlichung,
  dafür erforderliche Konten und Kosten gesondert abstimmen.

## Tatsächlicher Ausgangsstand

Aktuelle veröffentlichte Testversion: **0.1.0-preview.7**, VersionCode 7.
[Release](https://github.com/lausiklauskn-png/Privat-Brain-Pro/releases/tag/v0.1.0-preview.7),
[APK](https://github.com/lausiklauskn-png/Privat-Brain-Pro/releases/download/v0.1.0-preview.7/Private-Brain-Pro-0.1.0-preview.7.apk).

App-Quellstand: `b3287a2b00ea1b654fbdfb746668c28a1e88ddeb` (PR #9).
Danach wurden nur Prüfnachweise ergänzt: `549d1b394577d1d15774507795625c751cf660a1`
(PR #10). Dieser Brief kommt als weitere Dokumentationsänderung hinzu.

Paket: `de.familyprojekt.privatebrain.pro.preview`. Android 7+ / API 24,
Ziel-API 36. APK: 4 982 784 Bytes, SHA-256:
`7be2711ce2550a004244c49f819fb874486f6e04147e4c05c51fdad1068df483`.
Öffentlicher Download mit HTTP 200, Prüfsumme und Bytevergleich bestätigt.

- Capacitor 8.5.3 liefert die vorhandene Oberfläche lokal aus.
- Direkte native IMAPS-/SMTPS-Verbindungen mit JavaMail für Android, nicht über
  den privaten HTTPS-Maildienst. Systemvertrauen und TLS-Hostnamenprüfung aktiv.
- `MailAccount` akzeptiert aktuell ausschließlich `telekom` und `hetzner` und
  verlangt ein Passwort. `MailEngine` meldet beide Verbindungen mit Passwort an.
  **Gmail/OAuth/XOAUTH2 sind noch nicht implementiert.** Ein zusätzlicher Name im
  Auswahlfeld allein genügt nicht.
- Mehrere Konten, native Kontomaske, verschlüsselte lokale Entwürfe und
  Versandnachweise vorhanden. Geheimnisse bleiben hinter der nativen Brücke.
- Zugangsdaten: AES-GCM und Android Keystore, private atomare Dateien; kein
  stiller Ersatz bei beschädigtem Bestand oder verlorenem Schlüssel.
- Unklarer SMTP-Versand darf niemals automatisch erneut gesendet werden.
- Nutzer hat direkte Telekom-Anmeldung und Nachrichtenabruf bestätigt. Echte
  Hetzner-Anmeldung und vollständige Versand-/Anhangsabläufe sind noch nicht
  umfassend vom Nutzer bestätigt. Keine vollständige Funktionsgleichheit behaupten.

## Design und Rücknavigation unbedingt erhalten

Das aktuelle Design ist verbindlich: Farben, Typografie, Flächen, Abstände,
Rundungen, Hell/Dunkel, DE/EN/RU/PL und helles Pro-Icon mit originalen 3D-Bubbles.
Kein allgemeines Redesign. Suche bleibt Startseite; keine doppelten Suchbuttons.
Alle Seiten nutzen die verfügbare Fensterfläche; OS-Fensterleiste bleibt erhalten.

Auch ein verbundenes Gmail-Konto verwendet dasselbe Postfach wie die lokale
Ansicht: Posteingang, Entwürfe, Postausgang, Gesendet, Archiv, Spam, Papierkorb,
Exportiert mit bestehenden Symbolen und Knöpfen. Anbieterordner zusätzlich
anzeigen; IMAP-Pfade niemals durch deutsche Anzeigenamen ersetzen. Bei Gmail
besondere Ordnerrollen und Label-/Ordnersemantik prüfen, einschließlich Archiv,
Alle Nachrichten und Papierkorb. Keine unbeabsichtigte endgültige Löschung.

HTML-Mails behalten ihre geschützte Originaldarstellung mit Formatierung und
Bildern. Original-MIME bleibt unverändert; die isolierte Mailansicht bekommt keine
Skripte, gleiche Herkunft oder Zugriff auf die App-Brücke. Text-/Anhangsprüfung
bleibt erhalten; sie ist kein vollständiger Virenscanner.

Vorschau .7 behebt fehlendes Zurück aus Bildern/Dateien: interne Dateiansicht,
sichtbares Zurück/Vorwärts, Android-Zurück, Maus und Tastatur, gemeinsamer Verlauf
für Seiten, Explorerordner, Bildvorschau und Originalansicht. Mindestens zwölf
Rückschritte sind geprüft. Niemals wieder `window.open(blobURL)` als nativen
Dateiweg verwenden. PDF/Office können ausdrücklich über eine andere Android-App
geöffnet werden; der interne Rückweg bleibt erhalten. Bestätigung der neuen
Navigation auf dem tatsächlichen Nutzergerät steht noch aus.

## Gmail: technische Arbeit für die nächste Sitzung

1. Aktuelle offizielle Google-Dokumentation für Android-Autorisierung lesen und
   einen unterstützten nativen Google-Anmelde-/Autorisierungsweg auswählen.
   Google-Passwort nicht in der App erfassen und keine Anmeldung in einer
   eingebetteten WebView. OAuth ist der vorgesehene Weg; ein App-Passwort ist
   keine Umsetzung der gewünschten Google-Anmeldung.
2. Bevorzugt prüfen, wie die bestehende direkte IMAP-/SMTP-Anbindung mit OAuth2
   und XOAUTH2 weiterverwendet werden kann. Bei diesem Weg grundsätzlich
   `imap.gmail.com:993` und `smtp.gmail.com:465` mit geprüftem TLS. Eine Gmail-API-
   Alternative nur mit nachvollziehbarer Begründung und dokumentierten Folgen
   für Funktionen, Berechtigungen und die serverfreie Architektur wählen.
3. Google-Cloud-Projekt, OAuth-Konfiguration, Einwilligungsbildschirm, benötigte
   Scopes, Testnutzer und Android-Client passend zu Paket und Signatur vorbereiten.
   Tatsächlich vorhandene Konfiguration zuerst ermitteln, nichts erfinden.
   Google-Regeln zu sensiblen/eingeschränkten Mail-Scopes, Testmodus, Ablauf und
   gegebenenfalls Verifizierung anhand aktueller offizieller Quellen prüfen.
   Für IMAP/SMTP ist insbesondere der weitreichende Mail-Scope zu bewerten.
   Benötigte Kontoaktionen des Nutzers verständlich erklären; Kosten vorher klären.
4. Anmeldung und Mail-Autorisierung unterscheiden. Tokenablauf, Erneuerung,
   Widerruf, fehlende Zustimmung, Abbrechen und erneute Autorisierung behandeln.
   Access-/Refresh-Tokens ausschließlich auf der nativen Seite verwalten und
   erforderlichenfalls verschlüsselt speichern. Keine Tokens in JavaScript,
   localStorage, Protokollen, Chat oder Repository; keine Client-Secrets im APK.
5. Kontomodell behutsam um die erforderliche Authentifizierungsart ergänzen.
   Bestehende Telekom-/Hetzner-Konten, Kontokennungen, Entwürfe und Versandstatus
   erhalten. Erforderliche Migrationen mit alten Beständen prüfen; keine
   Deinstallation und keine Kontolöschung als „Lösung“ verlangen.
6. Google-Konto im bestehenden Postfach anbieten, mehrere Anbieter parallel
   unterstützen und dieselbe Ordner-/Originalansicht benutzen. Kein separater
   Gmail-Bildschirm mit anderer Gestaltung.
7. Relevante Regressionen und OAuth-Fehlerfälle testen. Simulation, echter
   Android-Lauf und tatsächlicher Gmail-Kontentest klar auseinanderhalten.
   Anschließend signiertes APK-Update veröffentlichen, Update über .7 prüfen
   und den öffentlichen Download verifizieren. Nächste Versionsnummer anhand
   des tatsächlichen Repository-/Release-Stands wählen.

## Prüfstand und Arbeitsdateien

Vollständige [.7-CI 39342179484](https://github.com/lausiklauskn-png/Privat-Brain-Pro/actions/runs/39342179484)
bestanden: 38 npm-Prüfbefehle, 57 native Web-, 72 Mail- und 22 Navigationsproben,
14 Maildiensttests, Java-Tests, Android-Build/Lint und **11 Android-Tests ohne
Fehler/Überspringen**, darunter zwölf echte Android-Zurück-Schritte ohne Neuladung.
[Signiertes Update .6 → .7, Lauf 39343904505](https://github.com/lausiklauskn-png/Privat-Brain-Pro/actions/runs/39343904505)
bestanden: Sprachwahl erhalten, Start, native Kontomaske, sichtbares und Android-
Zurück. Das war keine Migration persönlicher Dokumente oder echter Mailkonten.
Ein erster Release-Prüflauf scheiterte am UI-Automator-Lokator eines Eingabehinweises;
der korrigierte Lauf bestand mit unveränderter APK. Details im Prüfstand.

Pflichtlektüre neben `CLAUDE.md`:
[Mailarchitektur](docs/NATIVE-MAIL-ARCHITEKTUR.md),
[Prüfstand](docs/PRUEFSTAND-ANDROID.md),
[Rücknavigation](docs/RUECKNAVIGATION.md),
[gemeinsames Postfach](docs/design/mail-preview6/README.md).

Wichtige Implementierung: `assets/live-mail.js`, `assets/mail-workspace.js`,
`assets/workspace.js`, `native/native-mail*.js`, `native/native-navigation.js`,
`native/native.css`; Java unter
`android/app/src/main/java/de/familyprojekt/privatebrain/pro/`:
`ProMailPlugin`, `MailAccount`, `MailEngine`, `EncryptedMailStore`, `MailOutbox`,
`MailMime`, `MainActivity`, `ProFilesPlugin`.
Build/Tests: `tools/native/prepare-web.mjs`, `test-web.mjs`, `test-mail-device.mjs`,
`test-navigation.mjs`, `run-instrumentation.sh`, `assert-instrumentation.py` und
`.github/workflows/android.yml`. Vorher `npm run sync:android` ausführen.

## Signierung und Umgebung

Vorhandenes Vorschau-Signiermaterial liegt außerhalb des Repositories. Verfügbarkeit
und richtige Signatur prüfen; keinen Ersatzschlüssel erzeugen, sonst funktioniert
kein Update. Vorschau und spätere Produktionssignierung getrennt halten.
Paket/Signatur sind auch für den Android-OAuth-Client relevant. Öffentlicher
Vorschau-Zertifikatsfingerabdruck SHA-256:
`362ee70d28da9c4b51e37057c3519a3e6eb2c679059dfb9f56b4003f9374fa80`.
Für Google benötigte weitere Fingerabdrücke aus dem tatsächlichen Zertifikat
ableiten; niemals private Schlüssel herausgeben.

In dieser Umgebung waren JDK 21, Android SDK/API 36 und Build Tools 35/36 eingerichtet.
GitHub Actions verwendete einen beschleunigten API-35-Emulator. Einrichtung in der
neuen Sitzung frisch prüfen. Direkter APK-Upload aus der Cloud lieferte früher
401; Veröffentlichungen gelangen über einen eng auf geprüfte Quelle und signierte
öffentliche APK begrenzten Actions-Lauf. Keine Signierschlüssel dafür hochladen.
Keine Netzfreigaben oder Anmeldedaten aus früheren Sitzungen als gegeben annehmen.

Passwörter, Tokens, Signierschlüssel und aktive Gerätecodes niemals im Chat
anfordern oder ins Repository aufnehmen. Nutzer gibt Geheimnisse ausschließlich
in den vorgesehenen vertrauenswürdigen Google-/Android-Dialogen ein.

Andere offene Themen bleiben getrennt: Hintergrundabruf/Benachrichtigungen,
dauerhafter Android-Ordnerzugriff, vollständiges lokales Embedding-Modell und
spätere iOS-/Desktop-Ausgaben. Sie sind nicht durch die Gmail-Ergänzung erledigt.
