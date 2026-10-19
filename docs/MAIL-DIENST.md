# Echtes Postfach auf dem privaten Server/NAS

Private Brain hat jetzt eine optionale Kontoverbindung für **Hetzner** und
**Telekom/T-Online**. Empfang erfolgt über IMAP mit TLS (993), Versand über SMTP
mit TLS (465). Beide Konten lassen sich gleichzeitig einrichten. Vorgesehenes
Hetzner-Konto: `info@family-projekt.de` (Schreibweise mit „k“).

## Was damit funktioniert

- Serverordner anzeigen und anlegen, Nachrichten seitenweise laden (50 pro Seite).
- Geöffnetes Postfach alle 60 Sekunden aktualisieren, solange keine Nachricht oder
  kein Entwurf geöffnet ist; zusätzlich Knopf „Aktualisieren“.
- Lesen als Klartext ohne externe Bilder oder ausgeführtes Mail-HTML; Original und
  Anhänge herunterladen. Antworten, Weiterleiten mit Anhängen, Cc/Bcc, eigene Anhänge.
- Gelesen/ungelesen und Sterne, Verschieben, Archiv, Spam und Papierkorb anhand der
  vom Anbieter gemeldeten Spezialordner; endgültig löschen nur im Papierkorb.
- Entwürfe auf dem Mailserver speichern, Nachrichten senden und Gesendet-Kopie ablegen.
  Ein gespeicherter/erneut bearbeiteter Entwurf wird als neue Kopie abgelegt.
- Text und Anhänge mit den bestehenden unveränderten Prüfmodulen prüfen; vor Versand
  Befunde/ungeprüfte Teile und anschließend den tatsächlichen Versand bestätigen.
- Einzelne Nachrichten oder eine geladene Seite ausdrücklich in den lokalen gemeinsamen
  Suchkatalog übernehmen. Der Filter im Postfach durchsucht nur die geladene Liste.
  Die globale Bedeutungssuche findet katalogisierte Mailtexte zusammen mit Dokumenten.

Die Regel-/Strukturprüfung ersetzt **keinen Virenscanner**. Es gibt keinen ClamAV-Dienst
und keine garantierte Schadsoftware-Erkennung. Auf Wunsch kann das separat ergänzt werden.
KI-Antworten und Pseudonymisierung bleiben im bisherigen lokalen Postfach verfügbar:
Nachricht katalogisieren und dort öffnen. Der neue Mail-Dienst sendet nichts an eine KI.

## Warum ein privater Dienst notwendig ist

Eine Browser-PWA kann nicht direkt IMAP/SMTP sprechen. GitHub Pages liefert die
Oberfläche aus, betreibt aber keinen Mailserver. Der kleine zusätzliche Dienst läuft
auf deinem eigenen Rechner/NAS/Server und spricht mit den vorhandenen Mailservern.
Er enthält auch die identische Private-Brain-Oberfläche. **Für das echte Postfach
öffnest/installierst du diese private HTTPS-Adresse**, nicht die GitHub-Pages-Adresse.
Dadurch funktionieren Tablet und Desktop ohne direkten Browserzugriff auf fremde
Mailserver oder Freigabe lokaler Geräteordner.

Ein vorhandenes **Hetzner-Mailpostfach** ist noch kein Server, auf dem dieser Dienst
laufen kann. Dafür braucht es Docker-fähiges NAS, einen eigenen Server oder eine VM.
Unterstützt werden die Linux-Architekturen des Node-/Caddy-Images (u. a. x86-64/ARM64).
Die Oberfläche läuft in aktuellen Browsern auf Android, iPadOS, Windows, macOS, Linux;
PWA-Installation und Geräteordnerzugriff bleiben browserabhängig.

## Einrichtung (einmal durch den Server-/NAS-Administrator)

1. Repository auf den privaten Host holen. Docker mit Compose muss vorhanden sein.
2. `mail-service/.env.example` als `mail-service/.env` kopieren. `MAIL_HOST` auf einen
   tatsächlich erreichbaren eigenen HTTPS-Hostnamen setzen. DNS und Router/Firewall
   müssen zum Server passen; Caddy benötigt für die mitgelieferte öffentliche
   Zertifikatseinrichtung die Ports 80/443. Bei einem bestehenden NAS-Reverse-Proxy
   dessen HTTPS-Zertifikat nutzen und den internen Dienst dorthinter betreiben;
   nicht unverschlüsselt ins Internet stellen.
3. Für `MAIL_TOKEN` einen zufälligen Schlüssel mit mindestens 32 Zeichen erstellen
   (z. B. Passwortmanager oder `openssl rand -hex 32`). Das ist **nicht** das
   Postfachpasswort. `.env` privat lassen, niemals in Git oder Chat kopieren.
4. Im Repository: `docker compose --env-file mail-service/.env -f mail-service/compose.yaml up -d --build`.
   Der Mail-Port ist nur im Docker-Netz verfügbar, Caddy bietet HTTPS an.
5. Private HTTPS-Adresse auf dem Tablet öffnen → **Postfach → Mailkonto verbinden**.
   Dieselbe HTTPS-Adresse und den Dienst-Schlüssel eingeben. Der Schlüssel bleibt nur
   im Arbeitsspeicher dieser Browser-Sitzung; nach Neuladen erneut eingeben.
6. **Hetzner** auswählen, Adresse und Mailpasswort eingeben. Standardserver ist
   `mail.your-server.de`; **im Hetzner-Kundenbereich für das konkrete Postfach prüfen**.
   Abweichende Hostnamen zuerst ausdrücklich in `MAIL_ALLOWED_HOSTS` freigeben und
   den Dienst neu starten. Die Oberfläche erlaubt keine beliebigen Serverziele.
7. Über **Konto hinzufügen** Telekom ergänzen. Hier ist das **separate Passwort für
   E-Mail-Programme** nötig; nicht automatisch das Telekom-Login-Passwort.
   Vorgaben: `secureimap.t-online.de` und `securesmtp.t-online.de`.
8. Ein Test an eine eigene zweite Adresse: empfangen, antworten, Anhang, Gesendet,
   Spam/Papierkorb und die Darstellung auf dem tatsächlichen Tablet prüfen.

Ohne Servereinrichtung und gültige Kontozugangsdaten ist nur das bestehende lokale
Postfach aktiv. Eine produktive Anmeldung oder Zustellung wurde in der Cloud-Sitzung
nicht durchgeführt. Die Veröffentlichung des Codes aktiviert keine Mailkonten.

## Daten und Schutz

- Kontodaten werden erst nach erfolgreicher IMAP- und SMTP-Anmeldung gespeichert.
  Auf dem privaten Host AES-256-GCM, eigener zufälliger Schlüssel, Dateien mit 0600.
  Schlüssel und verschlüsselte Konten liegen im privaten Docker-Volume `mail-data`:
  den **ganzen Datenträger und seine Backups schützen**. Der laufende Dienst muss
  Konten entschlüsseln können; das ist kein Schutz vor einem kompromittierten Server.
- HTTPS-Zertifikate werden geprüft, TLS-Fehler nicht übergangen. API verlangt einen
  Dienst-Schlüssel und den konfigurierten Browser-Ursprung. Keine offenen Relays:
  Absender ist immer das eingerichtete Konto. Private Dateien werden nicht ausgeliefert.
- Mail-API-Antworten sind `no-store` und vom Service Worker ausgeschlossen. Der Dienst
  speichert keine empfangenen Mailtexte dauerhaft. Nur ausdrücklich katalogisierte
  Texte landen im lokalen Browserkatalog; Löschungen am Server löschen diese Kopien nicht.
- Die Dienstverbindung trennen löscht den Schlüssel im Browser. „Kontoverbindung entfernen“
  oben neben „Dienst trennen“ entfernt nur die Kontoverbindung vom Dienst; Nachrichten
  beim Anbieter bleiben erhalten. Im Nachrichtenbereich bedeutet „Endgültig löschen“
  das endgültige Löschen einer Nachricht aus dem Server-Papierkorb.
- Jeder Versandversuch hat eine dauerhaft gespeicherte Kennung. Nach unklarem SMTP-Ergebnis
  wird derselbe Versuch nicht erneut ausgeführt, auch nach Neustart. Nach Teilannahme
  akzeptierte/abgelehnte Empfänger prüfen. SMTP-Annahme ist noch kein Zustellnachweis.
  Scheitert nur die Gesendet-Kopie, ausdrücklich **nicht nochmals senden**.
- Die unveränderte Offline-App funktioniert weiter. Die eigentliche Kontoverbindung
  benötigt Internet. IMAP UIDVALIDITY verhindert Aktionen auf inzwischen anderen Nachrichten.

## Entwicklung und Prüfungen

`npm ci --prefix mail-service` und `npm test --prefix mail-service` prüfen den Dienst.
Die SMTP-Probe führt einen echten lokalen SMTP-Dialog mit Nodemailer; IMAP wird dabei
als Anbieter-Testdouble gestellt. Keine realen Konten oder externen Nachrichten.
Browserprobe: `node tools/e2e-live-mail.mjs`. Bestehende Regression: `npm test`.
Der Dienst hat eine eigene, eingecheckte Lockdatei; kein zusätzliches Laufzeitpaket
wird von einem CDN in den Browser geladen.

Der private HTTPS-Ursprung hat einen **eigenen Browser-Datenbestand**. Ein Katalog der
bisherigen GitHub-Pages-App wandert nicht automatisch dorthin. Bei Bedarf dort zuerst
unter Einstellungen „Vollständig sichern (für anderen Rechner)“, dann in der privaten
App „Katalog zusammenführen…“. Geräteordner dort erneut auswählen; Berechtigungen
und Originaldateien werden durch den Katalogexport nicht übertragen.

Gegenprobe: `python3 tools/gegenprobe-live-mail.py` sabotiert ausschließlich temporäre
Kopien (Authentifizierung, Serverfreigabe, UIDVALIDITY und Doppelversandschutz) und
verlangt, dass jeweils die passende Verhaltensprüfung scheitert.


Private Checkouts können durch `umask 077` die Rechte 600/700 erhalten. Das Dockerfile
setzt deshalb im Image Leserechte für `/app`; der Dienst läuft weiterhin als `node`.
Der separate `/data`-Bereich mit Datenschlüssel und Kontodatei wird davon nicht
berührt. Die CI baut mit diesen restriktiven Quellrechten und prüft den echten
Containerstart mit schreibgeschütztem Dateisystem, HTTP-Zugriff und Schlüsselmodus 0600.
