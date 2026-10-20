> **Neuester Stand: Vorschau .10 veröffentlicht**, 2026-10-20.

## Neuer Folgeauftrag: weitere Anbieter und Microsoft vorbereiten (.12 in Prüfung)

Nutzer wünscht mehrere bekannte Anbieter. Vier native Vorlagen sind ergänzt:
WEB.DE, GMX, Yahoo Mail und 1&1/IONOS; mit Telekom, Hetzner und Google sieben
verbindbare Vorlagen. Passwörter beim Wechsel löschen, feste Server prüfen,
bestehende Konten/Entwürfe erhalten. Yahoo erfordert ein vom Anbieter erlaubtes
App-Passwort; WEB.DE/GMX brauchen aktivierten IMAP-Zugriff. IONOS Mail ist kein
Microsoft-365-Postfach über IONOS.

Auf Nachfrage bestätigt der Nutzer: **Noch keine Microsoft-Entra-Appregistrierung.**
Deshalb zunächst weitere Anbieter und Vorbereitung von Microsoft. Der Microsoft-
Eintrag erklärt den fehlenden Freigabeweg und öffnet nur einen Einrichtungsplan;
kein Microsoft-Konto wird gespeichert oder per Passwort verbunden. Registrierung
und anschließende native OAuth-/SMTP-STARTTLS-Implementierung stehen noch aus.
Konkreter Plan mit Paket/Zertifikat, Zielgruppe und delegierten Berechtigungen:
[MAIL-ANBIETER](docs/MAIL-ANBIETER.md#microsoft-für-die-nächste-sitzung-vorbereiten).
Keine fremden Client-IDs, Client-Secrets oder unbestätigten 465-Passwortvorlagen.
Die frühere Googlemail-Nachprüfung am Tablet bleibt parallel offen.

---

## Aktuell: Vorschau .11 veröffentlicht — 2026-10-20

Die folgenden älteren Abschnitte dokumentieren frühere Stände. Aktuell existieren
Google-Cloud-Projekt, externe OAuth-Grundkonfiguration und Android-Client für das
unveränderte Vorschau-Zertifikat. Der Nutzer hat den Mail-Scope und Identitäts-Scopes
konfiguriert; ein Gmail-Testnutzereintrag ist akzeptiert. Seine bisherige Adresse
verwendet Googlemail. Für dasselbe Konto sind beide Domain-Schreibweisen Aliase.
Keine Nutzeradresse, IP, Client-ID oder Freigabe aus Bildern ins Repository übernehmen.

Die neuesten Bilder zeigen ein gespeichertes Google-Konto und eigene Serverordner,
danach `Cannot read properties of null (reading 'items')`. Die sichtbare Testmail
ist „Noch nicht übermittelt“. Speichern setzt erfolgreiche IMAP-/SMTP-Anmeldung
voraus; echter Nachrichtenempfang/-versand ist dadurch noch nicht bestätigt.

[APK .11](https://github.com/lausiklauskn-png/Privat-Brain-Pro/releases/download/v0.1.0-preview.11/Private-Brain-Pro-0.1.0-preview.11.apk)
über die bestehende Test-App installieren, nicht deinstallieren. .11 erhält den
gewählten, gegen Googles Freigabe bestätigten Android-Kontonamen; die Gmail-
Normalisierung dient nur Vergleich, Cache und XOAUTH2-Benutzernamen. Erneute Freigabe
aktualisiert die Schreibweise unter derselben Kontenkennung samt erhaltenen Entwürfen.
Der Adapter schluckt keine abgebrochenen Leseaufrufe mehr als null, prüft Listenantworten
und entfernt alte Nachrichten/UIDs/Zähler vor dem Laden eines anderen Kontos.
Lokale Geräteentwürfe und Versandversuche bleiben bei Serverfehlern erreichbar.
Kein automatischer Neuversand.

Anwendungscommit `83cb8e3c7072c2af2c5d5e0e5f9b329464be9796` (PR20),
CI 39364267954/39364311623: 211 native Browserproben, 28 native Android-Fälle,
alle übrigen Web-/Dienst-/Buildprüfungen erfolgreich. Signiertes Update .10 → .11
39364425049; Veröffentlichung 39365299765. Öffentliche APK bytegleich geprüft,
SHA256 `3d0744b83ff6304f6509f4621c582178d016429ab86c0843454d13cf74601ca0`.
[Details](docs/PRUEFSTAND-ANDROID.md#veröffentlichte-vorschau-11--2026-10-20),
[Diagnose](docs/GMAIL-RUECKGABE-DIAGNOSE.md).

Nächster Geräteversuch: Weitere Aktionen → Konto hinzufügen → Google/Gmail →
Mit Google anmelden, bisheriges Googlemail-Konto in der Android-Auswahl wählen und
Google-Freigabe abschließen. Konto nicht entfernen, Cloud-Projekt nicht neu anlegen,
akzeptierten Gmail-Testnutzer behalten. Danach Posteingang aktualisieren; vorhandene
Testmail nur ausdrücklich senden, sofern ihr Status weiterhin „Noch nicht übermittelt“
lautet. Bei unklarem Versand erst beim Anbieter prüfen. Bei Fehlern genügt sichtbarer
Fehlercode; niemals Passwort, Token oder Gerätecode anfordern. Originalbilder/PDF,
Mail-Links und Rückwege aus den vorigen Vorschauen am Gerät weiter prüfen; keine
vollständige Samsung-/Anbieterprüfung aus Emulatorproben ableiten.

---
> [APK herunterladen](https://github.com/lausiklauskn-png/Privat-Brain-Pro/releases/download/v0.1.0-preview.10/Private-Brain-Pro-0.1.0-preview.10.apk),
> als Aktualisierung über die vorhandene Test-App installieren.
> 26 native Fälle und signiertes Update .9→.10 bestanden;
> [Nachweise](docs/PRUEFSTAND-ANDROID.md#veröffentlichte-vorschau-10--2026-10-20).
> Google-Projekt, Android-Client und Testnutzer sind inzwischen angelegt;
> drei Scopes wurden gezeigt. .9 scheiterte weiterhin mit allgemeinem Fehler.
> .10 behandelt fehlende SDK-Kontodaten und Domain-Aliase und zeigt genaue
> Fehlerstellen. Nächster Schritt: tatsächlicher Login am Tablet; gegebenenfalls
> den sicheren Fehlercode als Foto auswerten. Echten Gmail-Betrieb nicht behaupten.
> Keine Tokens/Passwörter anfordern, vorhandene Konten und Kataloge behalten.

> **Neu: Google-Einrichtung erfolgt, Gmail noch nicht verbunden.** Projekt,
> Android-Client, akzeptierter Gmail-Testnutzer und drei Scopes wurden in der
> Konsole gezeigt. Vorschau .9 meldet weiter einen allgemeinen Google-Fehler.
> [SDK-Rückgabe, Domain-Aliase und genauere Diagnose](docs/GMAIL-RUECKGABE-DIAGNOSE.md)
> beschreibt den aktuellen Reparaturstand und die weiterhin offene Geräteprüfung.
> Nicht erneut pauschal behaupten, es gebe noch kein Cloud-Projekt.

> **Neuester veröffentlichter Stand: Vorschau .9**, 2026-10-20.
> [Direkte APK](https://github.com/lausiklauskn-png/Privat-Brain-Pro/releases/download/v0.1.0-preview.9/Private-Brain-Pro-0.1.0-preview.9.apk).
> **Aktualisieren, nicht deinstallieren.** PDF-Seiten/Scans, Öffnen/Teilen und
> ein vermiedener erneuter Google-Autorisierungsaufruf sind enthalten.
> [Nachweise: 23 native Fälle, signiertes Update und Veröffentlichung](docs/PRUEFSTAND-ANDROID.md#veröffentlichte-vorschau-9--2026-10-20).
> Als Nächstes: Google-Cloud-Projekt und Android-OAuth-Client mit dem Nutzer
> im Tablet-Browser einrichten bzw. den aktuellen Stand klären. Echten Google-
> Login noch nicht behaupten. Die gemeldete Auswahlschleife bleibt am Gerät
> zu prüfen. Außerdem ein PDF intern öffnen/zurückgehen und an Workfloh PDF
> teilen/öffnen. Bestehendes Telekom-Konto und lokale Daten behalten.

> **Aktueller Zusatzauftrag, 2026-10-20:** PDF-Seitenansicht einschließlich Scans,
> Öffnen/Teilen an Workfloh PDF und andere Apps sowie gemeldete Google-Auswahlschleife.
> Umsetzung und offene Geräte-/Google-Prüfungen stehen in
> [PDF-Ansicht und Google](docs/PDF-ANSICHT-UND-GOOGLE.md). Die folgenden älteren
> Zwischenstände sind historisch; die dortige Aussage „Gmail nicht implementiert“
> ist seit Vorschau .8 überholt. Ein echter Gmail-Login bleibt unbestätigt.

# Nachfolgebrief: Private Brain Pro – Originalbilder, Mail-Links und Gmail

Stand: 2026-10-20. Dieser Brief ist der Arbeitsauftrag für die nächste Sitzung.

## Nächster Auftrag

**Drei Aufträge für die nächste Sitzung:** Originalbild-Zugriff reparieren,
E-Mail-Links im externen Browser öffnen können und Google/Gmail als weiteren
Mailanbieter ergänzen. Die Fehlerreparaturen ersetzen den Gmail-Auftrag nicht.

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
geöffnet werden; der interne Rückweg bleibt erhalten. Der Nutzer bestätigt jetzt
auf seinem Tablet das Vergrößern von Bildern und den Rückweg. **Das Öffnen der
Originalbilder funktioniert dort jedoch nicht**, siehe zusätzlichen Auftrag unten.
Diese Rückmeldung bestätigt nicht sämtliche zwölf Schritte auf dem Nutzergerät.

## Zusätzlicher Fehlerauftrag: Originalbilder nicht erreichbar

Nutzerrückmeldung vom 2026-10-20: Bilder lassen sich vergrößern, Zurück funktioniert.
Bei „Original öffnen“ kommt jedoch sinngemäß „Original ist nicht erreichbar oder
nicht verbunden; der Katalogeintrag bleibt“. Passende vorhandene Meldung im Code:
**„Original nicht erreichbar (Ordner nicht verbunden). Der Katalog-Eintrag bleibt.“**
Der Fehler ist noch nicht behoben; in dieser Übergabe wurde nur die Meldung dem
vorhandenen Code zugeordnet, keine Ursache am Nutzergerät nachgewiesen.

Arbeitsauftrag:

1. Den Weg Ergebnis/Explorer → Bildvorschau → „Original öffnen“ mit den tatsächlich
   importierten Dateiquellen untersuchen. `openFile`, `resolveFile`, `showBlob` und
   `openLightbox` in `index.html`, `SESSION_FILES`, `DIR_HANDLES`, Katalogpfade und
   `assets/workspace.js` sowie `native/native-navigation.js` prüfen. Die native
   Dateiansicht behebt den Rückweg, ersetzt aber keinen fehlenden Dateizugriff.
2. Unterscheiden zwischen Originaldatei, gespeicherter Vorschau/Thumbnail und
   reinem Katalogeintrag. Die Großansicht kann aus einer gespeicherten Vorschau
   stammen; ihr Funktionieren beweist nicht, dass die Originaldatei erreichbar ist.
3. Prüfen, ob das Original nur als Sitzungsdatei gehalten wurde und nach Neustart
   oder APK-Update fehlt, ob eine Ordnerfreigabe verloren ging oder ob Zuordnung/
   Pfadauflösung fehlschlägt. Das sind mögliche Ursachen, keine bereits festgestellte
   Diagnose. Android besitzt bislang keinen fertig implementierten dauerhaften
   Ordneradapter; Desktop-Dateihandles nicht als Android-Lösung voraussetzen.
4. Erforderlichenfalls einen dauerhaften nativen Zugriff über geeignete Android-
   Dateiauswahl mit dauerhaft gewährter URI-Berechtigung oder eine lokale App-Kopie
   umsetzen. Die passende Variante anhand des bestehenden Imports wählen. Keine
   allgemeinen Speicherrechte voraussetzen, keine Originale überschreiben oder
   verschieben. Katalog und vorhandene Konten/Dokumente bei Migration erhalten.
5. Bereits fehlende Originale über einen verständlichen Neuverbinden-/Datei-wieder-
   auswählen-Weg zuordnen, gegebenenfalls mit Inhalts-/Hashprüfung. Keine Bilddaten
   aus einer komprimierten Vorschau als angebliches Original ausgeben. Falls das
   Original nicht mehr vorhanden ist, diesen Zustand ehrlich erklären; Daten
   nicht erfinden, Katalog und Vorschau nicht als Fehlerbehandlung löschen.
6. Den vollständigen Ablauf nach echtem Dateiimport, App-Neustart und signiertem
   APK-Update testen: Großansicht, unverändertes Original öffnen, Zurück zur
   Vorschau und zurück zur vorherigen App-Ansicht. Verschiedene Originalquellen,
   verweigerte/entzogene Berechtigung und fehlende Datei berücksichtigen. Original-
   Bytes beziehungsweise Prüfsumme vergleichen, nicht nur ein sichtbares Bild.

Die bisherigen 22 Navigationsproben und der Android-Zurück-Test beweisen keinen
neustartfesten Zugriff auf zuvor ausgewählte Originaldateien. Dafür zusätzliche
gezielte Proben ergänzen. Anschließend eine neue signierte Update-APK bereitstellen;
vorhandene Installation nicht deinstallieren lassen. Bild-/Zurück-Design erhalten.

## Zusätzlicher Fehlerauftrag: E-Mail-Links im Browser öffnen

Weitere Nutzerrückmeldung vom 2026-10-20: Links aus E-Mails lassen sich nicht
öffnen beziehungsweise nicht im Browser öffnen. Konkrete Zieladressen oder eine
Fehlermeldung wurden nicht genannt. Fehler ist noch offen, am Nutzergerät nicht
diagnostiziert. Die Rückmeldung ergänzt die beiden anderen Arbeitsaufträge.

Arbeitsauftrag:

1. Linkbetätigung in der HTML-Originalansicht und der Textansicht prüfen:
   `native/native-mail-view.js`, vorhandene Mailrenderer, native WebView-
   Navigationsbehandlung und Android-Browserübergabe. Der aktuelle Originalrenderer
   erhält geprüfte HTTP(S)-Links, verwendet aber einen skriptfreien Sandbox-Frame;
   die Textansicht besteht derzeit aus wörtlichem Text. Das ist ein Codebefund,
   noch kein nachgewiesener Ablauf des vom Nutzer beobachteten Fehlers.
2. Explizites Antippen/Anklicken eines zulässigen Weblinks soll den externen
   Browser öffnen. Den URL-Übergabeweg aus vertrauenswürdigem App-/nativem Code
   umsetzen, nicht aus beliebigen Mail-Skripten. URL und erlaubtes Schema an der
   nativen Grenze erneut prüfen. Keine ungeprüften `javascript:`, `data:`, `file:`,
   `content:`- oder `intent:`-Adressen aus Nachrichten ausführen. Andere Linktypen
   wie `mailto:` getrennt und ausdrücklich bewerten.
3. Die bestehende Mail-Sandbox, Skriptsperre, Herkunftstrennung und geschützten
   Prüfer erhalten. Nicht zur Reparatur pauschal `allow-scripts`, `allow-same-origin`
   oder freie Navigation/Popups freigeben. Kein allgemeiner URL-/HTTP-Proxy oder
   Zugriff auf Gerätegeheimnisse für Mailinhalte. Die vorhandene reine
   APK-Downloadfreigabe nicht für beliebige Mailadressen zweckentfremden.
4. Keine automatische Browseröffnung beim Laden einer Mail, bei Bildabrufen oder
   durch fremde Nachrichtenereignisse. Der bewusste Linkklick muss die Öffnung
   auslösen. Die Mailansicht und ihre Auswahl bleiben erhalten; Zurück aus dem
   Browser führt wieder zur App. Fehlender Browser, ungültiger Link und
   abgebrochene Übergabe dürfen die App nicht festsetzen oder schließen.
5. Sichtbare Textlinks und verlinkte Newsletter-Bilder, lange URLs/Weiterleitungs-
   links und mehrere Links prüfen. Android-Touch, Maus/Tastatur in DeX und
   Rückkehr zur gleichen Nachricht testen. Automatisierte negative Proben für
   Skript-/Schema-Missbrauch und unbeabsichtigtes Öffnen ergänzen; tatsächlichen
   Browserstart auf Android gesondert nachweisen. Bestehende Originalbild-,
   Postfach- und Rücknavigationstests bleiben erhalten.

Keine persönlichen E-Mail-Links mit Anmelde-/Tracking-Tokens in Git oder Logs
übernehmen; synthetische Testlinks verwenden. Die bisher bestandenen Mail-
Darstellungs-/Sandboxtests bestätigen keinen funktionierenden Browserstart durch
Links. Nach Reparatur mit den anderen Änderungen eine signierte Update-APK und
klaren Prüfnachweis bereitstellen.

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


## Fortschreibung 2026-10-20: Arbeiten an Vorschau .8

Die drei Folgeaufträge sind jetzt in Implementierung: dauerhafte native Originalkopien
mit Wiederzuordnung älterer Dateien, explizite Browserübergabe aus Text-/HTML-Mail
und native Gmail-Autorisierung/XOAUTH2. Aktuelle Architektur, Grenzen und nötige
Google-Cloud-Konfiguration: [docs/ORIGINALE-LINKS-GMAIL.md](docs/ORIGINALE-LINKS-GMAIL.md).
Frühere „noch nicht implementiert“-Aussagen beschreiben den Ausgangsstand.
Noch keine echte Google-Anmeldung oder neue veröffentlichte APK behaupten; erst
aktuelle CI-/Release-Nachweise prüfen. Bestehende Konten und die PWA erhalten.

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
aktiv. Speichergrenzen und Sicherheitsgrenzen: `docs/ORIGINALE-LINKS-GMAIL.md`.

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
