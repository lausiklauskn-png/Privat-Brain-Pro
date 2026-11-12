# Plan: Microsoft-Konten (Outlook, Hotmail, Microsoft 365) in Private Brain Pro

Stand 12.11.2026, Fassung 1.0.48. Klaus' Auftrag: Microsoft-Konten in Private Brain Pro anmelden können. **Nichts davon ist
gebaut.** Heute öffnet „Outlook / Microsoft 365“ nur den Einrichtungsplan (`MailProvider.MICROSOFT`, `ready()` = false), und die
App lässt absichtlich kein Microsoft-Passwort zu. Ein Passwort würde auch nichts nützen: Microsoft hat die Anmeldung mit
Benutzername und Passwort für IMAP/SMTP abgeschaltet. Es geht nur mit einer eigenen App-Registrierung in Microsoft Entra
(OAuth). Die technischen Vorgaben stehen schon in `docs/MAIL-ANBIETER.md` › „Microsoft für die nächste Sitzung vorbereiten“;
dieser Plan ordnet sie in zwei Teile.

## Teil A – Registrierung in Entra (Klaus, beim Termin bei Jens, etwa 15 Minuten)

Gemeinsam mit dem Familienakte-Termin (`Meine-Familienakte/docs/PLAN_2026-11-12_MICROSOFT-MAIL-ENTRA.md`). Es wird **dasselbe
kostenlose Azure-Konto** benutzt (das „Standardverzeichnis“ vom 05.11.), aber eine **eigene** Registrierung: Private Brain
spricht IMAP/SMTP und braucht andere Rechte und andere Rücksprung-Adressen als die Familienakte. Kosten: keine.

1. https://entra.microsoft.com mit dem Konto vom 05.11. öffnen (oben rechts „Standardverzeichnis“).
2. **Identität › Anwendungen › App-Registrierungen › Neue Registrierung**
   - Name: **Private Brain Pro**
   - Unterstützte Kontotypen: **Konten in einem beliebigen Organisationsverzeichnis und persönliche Microsoft-Konten**
   - Umleitungs-URI: jetzt **leer** lassen → **Registrieren**.
3. **Übersicht:** die **Anwendungs-ID (Client-ID)** abschreiben oder fotografieren. Sie ist öffentlich und darf an Claude.
4. **Authentifizierung › Plattform hinzufügen › Android:**
   - Paketname: `de.familyprojekt.privatebrain.pro.preview` (so heißt die ausgegebene APK)
   - Signaturhash: `FKFZpibKD9h6sKC/nVXDm9SmMaQ=`
   - **Konfigurieren**. Entra zeigt danach eine Umleitungs-URI (`msauth://…`) – abfotografieren.
5. **Authentifizierung › Plattform hinzufügen › Mobile und Desktopanwendungen:** eigene URI `http://localhost` → Speichern.
   Darunter **„Öffentliche Clientflows zulassen“ = Ja** → Speichern. (Für Windows.)
6. **API-Berechtigungen › Berechtigung hinzufügen › „Von meiner Organisation verwendete APIs“ bzw. „Microsoft-APIs“:**
   - **Office 365 Exchange Online** › Delegierte Berechtigungen: `IMAP.AccessAsUser.All` und `SMTP.Send`
     (findet das Portal „Office 365 Exchange Online“ nicht, bei **Microsoft Graph** nach `IMAP.AccessAsUser.All` und
     `SMTP.Send` suchen – Microsoft führt sie an beiden Stellen).
   - Microsoft Graph › Delegierte Berechtigungen: `offline_access`, `openid`, `email` (sind oft schon da).
   - Keine Administratorzustimmung, **kein** Geheimnis unter „Zertifikate & Geheimnisse“.
7. Kontrolle: Übersicht, Android-Plattform und Berechtigungsliste abfotografieren; die Bilder (ohne Passwörter) und die
   Anwendungs-ID an Claude.

**Erfolg:** Es gibt zwei Registrierungen, „Familienakte“ (`7a36668e-…`) und „Private Brain Pro“ (neue ID).

⚠ Der Signaturhash gehört zur Signatur der **ausgegebenen** Vorschau-APK (aus `docs/MAIL-ANBIETER.md`, dort mit SHA1
`14:A1:59:…:31:A4`). Die Bausitzung prüft ihn vor dem ersten Lauf noch einmal gegen die echte APK (`apksigner verify
--print-certs`); stimmt er nicht, wird in Entra der richtige nachgetragen. Debug-Bauten (`.preview.debug`) haben einen anderen
Hash und brauchen einen eigenen Eintrag, falls sie angemeldet werden sollen.

## Teil B – Einbau in Private Brain Pro (Bausitzung, nach Teil A)

Ziel: „Outlook / Microsoft 365“ wird ein Anbieter wie Google – Konto wählen, bei Microsoft anmelden, Mails abrufen, ausdrücklich
ausgelöst senden. Gleiche Bauart wie der vorhandene Google-Weg, damit nichts Zweites entsteht.

| | Google heute | Microsoft neu |
|---|---|---|
| Anmeldung Android | `GmailAuthorization` (Play-Dienste) | Microsoft-Anmeldung im Browser-Tab (Custom Tabs, PKCE) mit der `msauth://`-Umleitung aus Teil A; MSAL nur, wenn es ohne großen Zusatz geht – Entscheidung in der Bausitzung nach Größe/Lizenz |
| Anmeldung Windows | `DesktopOAuth` (Loopback 127.0.0.1) | derselbe `DesktopOAuth`-Weg mit Microsoft-Endpunkten (`login.microsoftonline.com/common/oauth2/v2.0/...`), Rücksprung `http://localhost:<Port>` |
| Zugang aufbewahren | `GmailTokenCache` (Keystore / Windows-Schutz) | gleiche Ablage, getrennt nach Anbieter und Konto |
| Abruf | IMAP mit XOAUTH2 | IMAP `outlook.office365.com:993` (TLS) mit XOAUTH2 |
| Versand | SMTP mit XOAUTH2 | SMTP `smtp.office365.com:587` **STARTTLS** mit XOAUTH2 – neuer, geprüfter Weg; die 465-Vorlage nicht einfach kopieren |

Schritte:

1. Anwendungs-ID aus Teil A eintragen (öffentlich, z. B. in `MailProvider`/Konfiguration; kein Geheimnis im Code).
2. `MailProvider.MICROSOFT` freischalten (`ready()`), Server und Rechte setzen, Einrichtungsplan-Text durch den echten
   Anmeldeweg ersetzen (DE/EN/RU/PL).
3. Anmeldung Android und Windows wie oben; Token-Erneuerung (`offline_access`); Abbrechen und Zurück ohne Reste.
4. `MailEngine`: XOAUTH2 für Microsoft wie bei Gmail; SMTP-STARTTLS 587 mit Hostnamenprüfung, **kein** unverschlüsselter
   Rückfall. Unklarer Versand wird nie von selbst wiederholt (bestehende Regel).
5. Proben: Anbieterwahl, gestellte Anmeldung, XOAUTH2-Zeile, STARTTLS-Weg, Sperre gegen Passwort-Eingabe bleibt für
   Microsoft bestehen, Kontentrennung Google/Microsoft, Gegenprobe. Vorhandene Mail-Proben (`test-mail-device` usw.) grün.
6. Am Gerät mit einem echten Outlook.com-Konto: anmelden, Abruf, Mail an sich selbst senden, „Gesendete Elemente“, nach
   Neustart ohne neue Anmeldung weiter abrufen. Danach Firmenkonto nur, wenn eines da ist (Firmen können IMAP/SMTP AUTH
   sperren; dann braucht es deren Administrator).
7. Neue Fassung (1.0.49 oder höher; vorher die tatsächlichen Releases prüfen) **nur mit Klaus' Wort**.

## Grenzen

- Firmen-/Schulkonten: ohne **verifizierten Herausgeber** (MPN-ID) darf der Nutzer oft nicht selbst zustimmen; private
  Outlook.com-/Hotmail-Konten betrifft das nicht.
- Die Anmeldung mit Microsoft zeigt anfangs „nicht verifizierter Herausgeber“; das ist bei privaten Konten zu bestätigen.
- PWA (Browser): kein IMAP – Microsoft-Konten nur in Android und Windows.

## Startauftrag für die Bausitzung (nach Teil A)

```
Private Brain Pro: Microsoft-Konten (Outlook/Hotmail/Microsoft 365) anmelden. Lies CLAUDE.md, docs/MAIL-ANBIETER.md und
docs/PLAN_2026-11-12_MICROSOFT-KONTEN.md. Die Registrierung in Entra ist erledigt; die Anwendungs-ID und die Fotos gebe ich
dir. Baue Teil B (Android und Windows), Proben grün, PR. Prüfe zuerst den Signaturhash der ausgegebenen APK gegen Entra.
Keine Fassung ausgeben ohne mein Wort.
```
