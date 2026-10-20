# Anbietervorlagen — 2026-10-20

## Native Auswahl in Vorschau .12 (in Prüfung)

Der Nutzer wünscht mehrere bekannte Anbieter statt manueller Servereingabe.
Der native Kontodialog enthält sieben verbindbare Vorlagen und einen deutlich
gekennzeichneten Microsoft-Einrichtungsplan. Microsoft ist **noch nicht verbunden**;
laut Nutzer existiert bislang keine eigene Microsoft-Entra-Appregistrierung.
Er bestätigt deshalb zunächst die weiteren Anbieter und die Vorbereitung von Microsoft.
Keine Client-ID eines fremden Produkts verwenden und keinen Passwort-Fallback anbieten.

| Anbieter | IMAP, TLS 993 | SMTP, TLS 465 | Anmeldung/Voraussetzung |
| --- | --- | --- | --- |
| Telekom / T-Online | secureimap.t-online.de | securesmtp.t-online.de | Separates Passwort für E-Mail-Programme |
| Hetzner | mail.your-server.de (editierbar) | mail.your-server.de (editierbar) | Postfachpasswort; tatsächliche Server aus Hetzner übernehmen |
| Google / Gmail | imap.gmail.com | smtp.gmail.com | Bestehende native Google-Freigabe, einschließlich Googlemail-Adresse |
| WEB.DE | imap.web.de | smtp.web.de | POP3/IMAP im Anbieterpostfach aktivieren; bei 2FA App-Passwort |
| GMX | imap.gmx.net | mail.gmx.net | POP3/IMAP aktivieren; bei 2FA App-Passwort |
| Yahoo Mail | imap.mail.yahoo.com | smtp.mail.yahoo.com | Vom Anbieter erzeugtes App-Passwort; dessen Erstellung muss für das Konto verfügbar sein |
| 1&1 / IONOS | imap.ionos.de | smtp.ionos.de | IONOS-Postfachpasswort; gilt für IONOS Mail, **nicht** Microsoft 365 über IONOS |

Die feste Vorlage trägt Server ein und sperrt ihre Änderung. Der native Validator
prüft dieselbe zentrale Vorlage vor dem Verbindungsaufbau; ein bekannter Provider
kann keine Zugangsdaten an einen abweichenden Host senden. Neue feste Vorlagen
verwenden die volle E-Mail-Adresse als Benutzernamen. Hetzner behält die eigene
Server-/Benutzereingabe. Bestehende gespeicherte Anbieterkennungen und das
Kontenschema bleiben unverändert; neue Kennungen ergänzen nur die erlaubte Liste.
Keine Zugangsdaten gelangen in JavaScript, Browserablagen oder Protokolle.

Bei jeder Anbieterwahl werden Passwort, abweichender Benutzername und alter
Status gelöscht. Während einer laufenden Prüfung sind Auswahl und Eingaben
gesperrt; ein Fehler gibt das Formular wieder frei. Bereits abgebrochene, noch
wartende Prüfungen öffnen keine Verbindung. Konten werden weiterhin erst nach
bestätigter Anmeldung an beiden Servern gespeichert; die Prüfung sendet keine Mail.
Vorhandene Mailkonten, Geräteentwürfe und Versandversuche bleiben erhalten.

Die Erweiterung gilt für den Android-Kontodialog. Der optionale separate private
HTTPS-Maildienst und die unabhängige PWA wurden nicht erweitert oder verändert.

## Microsoft für die nächste Sitzung vorbereiten

Der Eintrag „Outlook / Microsoft 365“ blendet Passwort-/Serverfelder aus und öffnet
nur einen vier-sprachigen Einrichtungsplan. Er speichert kein Microsoft-Konto,
startet keinen Passwortlogin und behauptet keine fertige OAuth-Anbindung.
Eine Registrierung allein wird diese APK noch nicht für Microsoft freischalten.

Konkreter nächster Arbeitsauftrag nach der Registrierung:

1. In einem eigenen Microsoft-Entra-Verzeichnis eine App **Private Brain Pro**
   registrieren. Zugriff/Rechte zur Appregistrierung müssen vorhanden sein.
   Falls die Konsole nur ein kostenpflichtiges Angebot/Abonnement anbietet,
   nicht selbst buchen; mit dem Nutzer bzw. seiner Administration klären.
2. Für persönliche Outlook-/Hotmail-/Live-Konten **und** Firmenkonten die Zielgruppe
   „Konten in einem beliebigen Organisationsverzeichnis und persönliche
   Microsoft-Konten“ vorsehen. Die öffentliche Anwendungs-/Client-ID genügt zur
   Identifikation; keine Client-Secrets oder Zugriffstokens im Chat anfordern.
3. Für die native Android-Anmeldung Paket `de.familyprojekt.privatebrain.pro.preview`
   und den öffentlichen SHA1-Zertifikathash im von Microsoft verlangten Format
   registrieren. SHA1 hex:
   `14:A1:59:A6:26:CA:0F:D8:7A:B0:A0:BF:9D:55:C3:9B:D4:A6:31:A4`.
   SHA1 base64: `FKFZpibKD9h6sKC/nVXDm9SmMaQ=`.
   Redirect ausschließlich nach Vorgabe des tatsächlich gewählten Microsoft-SDKs;
   keine geratenen Callback-URLs freigeben. Kein eingebautes Client-Secret.
4. Native Microsoft-Freigabe und Token-Erneuerung implementieren und prüfen.
   Vorgesehene delegierte Exchange-Online-Berechtigungen für den direkten Weg:
   `https://outlook.office.com/IMAP.AccessAsUser.All`,
   `https://outlook.office.com/SMTP.Send`, bei Bedarf `offline_access`.
   Anmeldung/Token vom Google-Weg und vom JavaScript trennen; native sichere Ablage,
   feste HTTPS-Endpunkte, Kontentrennung und Abbrechen/Zurück testen.
5. Der Microsoft-Transport benötigt neben IMAP/TLS 993 den verifizierten
   SMTP-STARTTLS-Weg auf 587 (Outlook/Exchange-Online-Server gemäß Anbieter prüfen).
   Die vorhandene SMTP/TLS-465-Vorlage darf dafür nicht einfach kopiert werden.
   TLS und Hostnamenprüfung bleiben zwingend, kein unverschlüsselter Fallback.
   Firmen können IMAP oder SMTP AUTH grundsätzlich bzw. per Postfach sperren;
   eine Registrierung ersetzt keine erforderliche Administratorfreigabe.
6. Anschließend echte Kontoauswahl, Abruf, ausdrücklich ausgelösten Versand,
   Rückgabe und erneuerte Freigabe am Gerät bestätigen. Bestehende Konten und
   unklare Versandversuche dabei nicht entfernen oder automatisch wiederholen.

Offizielle Ausgangspunkte (in dieser Cloud durch die Domainrichtlinie nicht
abrufbar, daher nicht als aktuell vollständig abgeglichen ausgeben):
[WEB.DE](https://hilfe.web.de/pop-imap/imap/imap-serverdaten.html),
[GMX](https://hilfe.gmx.net/pop-imap/imap/imap-serverdaten.html),
[Yahoo](https://help.yahoo.com/kb/SLN4075.html),
[IONOS E-Mail-Hilfe](https://www.ionos.de/hilfe/e-mail/),
[Microsoft-Appregistrierung](https://learn.microsoft.com/en-us/entra/identity-platform/quickstart-register-app),
[Exchange-OAuth für IMAP/SMTP](https://learn.microsoft.com/en-us/exchange/client-developer/legacy-protocols/how-to-authenticate-an-imap-pop-smtp-application-by-using-oauth).
Keine gesperrten Zielhosts über Proxys umgehen. Bei abweichenden aktuellen
Anbietervorgaben die Vorlage nach geprüfter Quelle anpassen.

## Prüfumfang

Die vorhandenen Browser-, Googlemail-, Original-/PDF- und Versandprüfungen bleiben
verbindlich. Neue Android-Fälle prüfen alle sieben Anbieter im verschlüsselten
Tresor nach Wiederöffnung samt erhaltenem Entwurf, Passwortfreiheit der öffentlichen
Kontodaten, unveränderten alten Hetzner-Datensatz, abgelehnte Host-/Benutzer-
Umleitung und die technische Sperre vor Microsoft-Passwortverbindungen.
Der echte Kontodialog prüft Anbieterwechsel, gesetzte/gesperrte Server, gelöschte
Passwörter, Wiederbedienbarkeit nach Eingabefehler und den Microsoft-Einrichtungsplan.
Die Probe sendet keine Mail und meldet sich bei keinem echten Anbieter an.
Veröffentlichung erst nach vollständiger CI und signierter Updateprobe.
