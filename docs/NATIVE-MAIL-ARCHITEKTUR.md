# Direkte Mailanbindung auf Android

Stand 2026-10-19: direkte Mail seit Vorschau .4, Originalansicht und Fensterlayout in .5. Die ältere
Vorschau .2 verwendet noch den privaten HTTPS-Maildienst.
Der Nutzer hat direkte Telekom-Anmeldung und Nachrichtenabruf auf seinem Tablet
bestätigt. Hetzner und tatsächlicher Versand/Anhangsaustausch bleiben gesondert zu prüfen.
Simulation, Android-Instrumentierung und echte Anbieteranmeldung werden getrennt
im [Prüfstand](PRUEFSTAND-ANDROID.md) ausgewiesen.

## Gemeinsame Oberfläche, native Verbindung

Capacitor liefert die bestehende Oberfläche lokal aus. `native/native-mail.js`
übersetzt die benannten Postfachoperationen aus `assets/live-mail.js` in `ProMail`.
Die WebView bekommt keinen allgemeinen Socket-/HTTP-Proxy. Nur in der nativen App
ersetzt dieser Adapter den Serverdialog; die unabhängige PWA und `mail-service/`
werden nicht verändert oder als Server in die APK eingebaut.

Android erfasst Passwörter in einem nativen Dialog. Die JavaScript-Brücke erhält
nur öffentliche Kontodaten und Kontokennungen. Konten, lokale Entwürfe und
Versandnachweise liegen als atomar geschriebene AES-256-GCM-Dateien im privaten
`noBackupFilesDir`. Der zufällige Schlüssel bleibt nicht exportierbar im Android
Keystore. Dateiname und App-Kennung sind authentifiziert. Bei Manipulation oder
Schlüsselverlust gibt es einen Fehler und keinen leeren Ersatzbestand.
Android-Backup und Bridge-Debugprotokolle sind deaktiviert. Ein geprüftes,
verschlüsseltes Sicherungs-/Wiederherstellungskonzept steht noch aus.

`MailEngine` nutzt JavaMail für Android, keine eigene IMAP-/MIME-Implementierung.
IMAPS läuft mit TLS auf 993, SMTPS mit TLS auf 465, Systemvertrauen und zwingender
Hostnamenprüfung. Es gibt keine Zertifikatsausnahme. Verbindungen laufen seriell
auf einem Hintergrundthread mit Zeitgrenzen. „Verbinden und prüfen“ verlangt
wirkliche IMAP- und SMTP-Anmeldung; dabei wird keine Testnachricht versandt.
Telekom verwendet `secureimap.t-online.de` und `securesmtp.t-online.de` sowie das
separate Passwort für E-Mail-Programme. Bei Hetzner sind die passenden Servernamen
nativ einstellbar. Die Telekom-IP-Sperre des bisherigen privaten Servers sagt
nichts über die neue Verbindung vom Gerät aus aus. Dienst-Token und Termux
werden für diese direkte Verbindung nicht benötigt.

## Bereits implementierter Umfang

- Bis zu 20 Konten, native Erfassung und lokales Entfernen der Zugangsdaten.
- Ordnerliste, Seiten mit höchstens 50 Nachrichten, UIDVALIDITY/UID statt
  veränderlicher Nachrichtennummern. Vollständige Nachricht höchstens 8 MiB,
  Anhänge zusammen 5 MiB, Text 1 MiB, begrenzte MIME-Tiefe und Teilezahl.
- Lesen, Antworten, Weiterleiten, SMTP-Versand und Anhänge über die vorhandene
  Postfachoberfläche. Native Anhänge werden über einen engen FileProvider und
  ausdrückliche Android-Appauswahl geöffnet; Original-EML ist teilbar/sicherbar.
- Gelesen/Ungelesen, Markieren, Ordner anlegen. Verschieben verlangt IMAP MOVE;
  endgültiges Löschen verlangt den bestätigten Papierkorb und UIDPLUS. Kein
  pauschales EXPUNGE und kein möglicherweise destruktiver Ersatzweg.
- Lokale verschlüsselte Entwürfe und dauerhafter Versandstatus. Entwürfe werden
  noch nicht mit dem Entwürfe-Ordner des Anbieters synchronisiert.

Die geschützten Text-, Format-, HTML- und Anhangsprüfer bleiben bytegleich und
laufen im vorhandenen Postfach weiter. Ab Vorschau .5 werden Text für Suche/Antworten,
Original-HTML für die Ansicht und unveränderte MIME-Bytes getrennt gehalten.
`native/native-mail-view.js` stellt HTML in einem `srcdoc`-Frame ohne Sandbox-
Freigaben dar: keine Skripte, gleicher Ursprung, Formulare, Popups oder App-Brücke.
Eine zusätzliche CSP sperrt Skripte, Verbindungen, Frames und Objekte. Eine HTML-
Positivliste entfernt aktive Elemente/Ereignisse und unsichere Links; Formatierung,
Tabellen, Farben und Inline-Stile bleiben innerhalb dieses Rahmens erhalten.
CID-Rasterbilder werden aus MIME-Teilen als Datenbilder eingebettet. Externe
HTTPS-Bilder werden beim Öffnen geladen (dadurch kann der Absender den Abruf
bemerken); „Externe Bilder ausblenden“ speichert die Wahl für folgende Mails.
Eingebettete Bilder bleiben dann sichtbar. HTTP-Bilder werden nicht geladen;
Skripte, aktive Formulare, SVG, externe Stylesheets/Schriften bleiben gesperrt.
Das ist eine geschützte Originaldarstellung, keine pixelgenaue Browser-Ausführung
beliebiger HTML-Mails. Das Original zum Teilen/Sichern wird nie aus der bereinigten
Darstellung rekonstruiert. Der optionale alte HTTPS-Dienstpfad erhält weiterhin
seine bestehende Textansicht. Diese Prüfungen sind kein vollständiger
Virenscanner. Ein zusätzlicher Malware-Dienst müsste vertrauliche Anhänge und
Datenschutz gesondert berücksichtigen.

## Versand ohne automatische Wiederholung

Vor der Verbindung werden Kennung, unveränderlicher Entwurf und MIME-Kopie
verschlüsselt gespeichert. Nur der Zustand „noch nicht übermittelt“ darf nach
fehlgeschlagener Verbindung ausdrücklich erneut versucht werden. Unmittelbar vor
SMTP DATA wird „sendet“ dauerhaft geschrieben. Ab dann führt ein Abbruch zum
Zustand „unklar“; auch nach App-Neustart wird dieselbe Kennung nicht erneut gesendet.
Eine Message-ID allein ist kein Schutz vor doppelter Annahme beim Anbieter.

Erst nach bestätigter SMTP-Annahme wird eine Gesendet-Kopie per IMAP versucht.
Scheitert sie, bleibt SMTP als angenommen vermerkt; die App fordert zum Prüfen
auf und wiederholt den Versand nicht. SMTP-Annahme ist keine Zustellgarantie.
Ein anderer Inhalt unter derselben Versandkennung wird abgewiesen.

## Grenzen und nächste Schritte

Hintergrundabruf, Push-/Android-Benachrichtigungen, Gmail OAuth/PKCE, iOS-Keychain-
und Mailadapter, Provider-Entwurfssynchronisierung und dauerhafte Geräteordner
stehen aus. Empfangen/Versenden erfolgen zunächst bei geöffneter App. Das lokale
Postfach bleibt auch ohne Verbindung erhalten; vorhandene Such-/Dateifunktionen
werden nicht als vollständig gleichwertig mit der PWA behauptet.

Lokale verschlüsselte Maildateien sind zunächst auf 256 MiB begrenzt, ohne stille
Löschung alter Inhalte. Eine komfortable Aufräum-/Exportfunktion fehlt noch.
Kontolöschung behält Entwürfe und Versandnachweise unter der alten Kontokennung;
ein neu angelegtes Konto bekommt eine neue Kennung. Diese alten lokalen Inhalte
sind dann noch nicht wieder über die Oberfläche zuzuordnen. Konten deshalb in
dieser Testversion nicht als Mittel zum Zurücksetzen von Versandzuständen löschen.
Unklare Versuche nur beim Anbieter prüfen, niemals blind nochmals senden.
Temporär freigegebene Anhangskopien liegen im privaten Cache, werden nach 24 Stunden
bei späterem Öffnen bereinigt und sind insgesamt auf 32 MiB begrenzt.

Hetzner-Anmeldung, tatsächlicher SMTP-Versand, Anhänge mit externen Android-Apps, mehrere reale
Konten, DeX-Tastatur/Touch und Updates mit bereits gespeicherten Konten müssen am
Gerät geprüft werden. Der Nutzer gibt seine Kontogeheimnisse ausschließlich in der
App ein, niemals in Chat, Git oder Terminalausgaben.

## Bibliotheken und Rechte

`com.sun.mail:android-mail:1.6.8` und `android-activation:1.6.8` sind ausdrücklich
für Android paketierte JavaMail-/Activation-Bibliotheken. Die Releaseversion wurde
statt einer aktuellen Angus-Meilensteinversion gewählt; weitere Pflege und
Sicherheitsaktualisierungen sind laufend zu bewerten. Die Binärdateien wurden von
Maven Central bezogen und per SHA-256 geprüft:

| Bibliothek | SHA-256 |
|---|---|
| android-mail | `aac196787ecb4381329dad849c6f48275c74fb462f41a3f1613fcb722e6b643c` |
| android-activation | `d52c1844688c890b761271a00a87af55bd924fc7c4ef05a6bef36772c50a288d` |

Originale LICENSE/NOTICE je Komponente bleiben unverändert in `assets/licenses/`
und im Paket. EPL 2.0 beziehungsweise die alternative GPL-2.0 mit Classpath-
Ausnahme sind dort vollständig enthalten; die eigene App-Lizenz überschreibt sie
nicht. Die In-App-Seite `assets/licenses/mail.html` enthält beide Zuordnungen,
Originaltexte und die exakten Quellarchiv-Links. Nur byteidentische doppelte
META-INF-Texte werden im Android-Paket zusammengeführt. Das Projekt veröffentlicht
keine modifizierte Fassung dieser Bibliotheken.
