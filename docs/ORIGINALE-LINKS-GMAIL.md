# Originaldateien, Mail-Links und Gmail — Vorschau .8

Stand: 2026-10-20. Diese Änderungen betreffen ausschließlich die native Pro-App.
Die bestehende PWA bleibt unverändert. Die zuvor bestätigte Telekom-Anmeldung,
das Postfachlayout und die Rücknavigation bleiben Ausgangsbasis.

## Originaldateien

Ursache des gemeldeten Fehlers: In Android gab es bislang nur die Sitzungskopie
und eine Katalogvorschau. Der Browser-Ordnerzugriff steht dort nicht dauerhaft
zur Verfügung. Eine Vorschau ist kein Original.

Neue Importe erhalten vor erfolgreicher Katalogisierung eine unveränderte Kopie
im privaten Android-App-Speicher. Die App prüft Größe und SHA-256, schreibt in
begrenzten Blöcken und veröffentlicht erst vollständig bestätigte Dateien.
Die Quelldatei bleibt unverändert. Der Katalog behält seine bisherigen Kennungen;
eine Datenbankmigration oder ein Zurücksetzen ist nicht erforderlich.

Bei älteren Einträgen ohne Original erscheint „Original erneut auswählen“.
Nur dieselbe Datei mit passender Prüfsumme kann den vorhandenen Eintrag wieder
verbinden. Falsche Auswahl und Abbrechen verändern den Katalog nicht.
Beschädigte gespeicherte Kopien werden als Fehler gemeldet; eine automatische
Reparatur beschädigter Kopien ist nicht Bestandteil dieser Version.

Grenzen: 256 MiB je Original, insgesamt 2 GiB. Die App benötigt zusätzlichen
freien Speicher. Abgebrochene Importe werden beim gemeldeten Fehler verworfen;
bei hartem Prozessabbruch können unvollständige Staging-Dateien Speicher belegen.
Beim Aktualisieren bleiben App-Daten erhalten. Deinstallieren oder „Daten löschen“
entfernt private Kopien und Konten; diese Ablage ersetzt kein externes Backup.

## Links aus E-Mails

In Textansichten öffnet ein ausdrücklicher Klick den nativen Browserweg.
HTML-Mails behalten ihren skriptfreien Sandbox-Frame mit restriktiver CSP. Zulässige HTTP(S)-Adressen werden nativ gegen kurzlebige opaque
Kennungen registriert; die WebView übergibt nur bei tatsächlicher Benutzergeste
an Android `ACTION_VIEW` / `CATEGORY_BROWSABLE`. Nur registrierte native Brokerlinks
erhalten `target="_top"` und die eng begrenzte Sandboxfreigabe
`allow-top-navigation-by-user-activation`: HTTP-Navigation innerhalb eines Frames
wird in Android WebView nicht zuverlässig an den Navigationscallback gemeldet.
Die native Brücke konsumiert den Brokeraufruf vor einer App-Navigation; ohne echte
Geste bleibt der Browser geschlossen. Die Mail bleibt im Postfach.
Keine automatischen Browseraufrufe, keine Skript-, Popup- oder Origin-Freigabe.
Aktive Schemata, Gerätepfade, lokale/numerische Hosts und Benutzerinformationen
in URLs sind gesperrt. Android kann je nach Standardzuordnung eine passende
App statt eines Browsers anbieten. Ein fehlender Browser wird gemeldet.

## Gmail: implementierter Weg und externe Voraussetzung

„Konto hinzufügen“ bietet zusätzlich „Google / Gmail“. Die Anmeldung läuft
nativ über Google Play services AuthorizationClient 22.0.0. Ein Google-Passwort,
Client-Secret oder Dienst-Token wird nicht in der App abgefragt. Google verwaltet
die Erneuerung der Berechtigung. Kurzlebige Zugriffstokens bleiben nativ im RAM;
sie werden weder an JavaScript gegeben noch in den Kontentresor geschrieben.

IMAP: `imap.gmail.com:993`; SMTP: `smtp.gmail.com:465`, geprüfte TLS-Verbindungen
und ausschließlich XOAUTH2 für Google. Telekom und Hetzner behalten ihren
bisherigen Passwortweg. Abgelaufene/widerrufene Berechtigung erfordert erneute
Google-Anmeldung über „Konto hinzufügen → Google / Gmail“. Ein vorhandenes
Google-Konto wird dabei anhand der Adresse wiederverwendet; Kennung, Entwürfe
und Versandnachweise bleiben bestehen. Ein unklarer Versand wird nie automatisch
wiederholt. Google-Mail benötigt den weitreichenden Scope `https://mail.google.com/`
und für die Kontozuordnung `https://www.googleapis.com/auth/userinfo.email`.

**Echte Google-Anmeldung noch nicht nachgewiesen.** Im verfügbaren Umfeld gibt es
kein bestätigtes Google-Cloud-Projekt und keinen registrierten Android-OAuth-Client.
Die Emulatorprüfungen verwenden ausschließlich synthetische Konten und Tokens;
sie bestätigen keinen produktiven Google-Zugang.

Zur Aktivierung ist im eigenen Google-Cloud-Projekt ein Android-OAuth-Client für
die tatsächlich installierte Vorschau zu registrieren:

- Paket: `de.familyprojekt.privatebrain.pro.preview`
- Öffentlicher Signatur-Fingerabdruck SHA-1:
  `14:A1:59:A6:26:CA:0F:D8:7A:B0:A0:BF:9D:55:C3:9B:D4:A6:31:A4`
- OAuth-Zustimmungsbildschirm/Audience und eigene Testnutzer einrichten; die
  angeforderten Scopes müssen freigegeben sein. Google kann eine zusätzliche
  Prüfung für diese eingeschränkten Gmail-Berechtigungen verlangen. Eine interne
  Testkonfiguration ist keine allgemeine Freigabe für beliebige Nutzer.
- Es wird kein Web-Client-Secret in Android eingebaut. Für einen späteren
  Produktionsschlüssel/Google-Play-Signatur ist ein passender eigener Client nötig.

Offizielle Referenzen (in dieser Cloud derzeit durch die Domainrichtlinie
nicht abrufbar; nicht als aktuell vollständig abgeglichen ausgeben):
[AuthorizationClient](https://developers.google.com/identity/authorization/android/authorize-access),
[Gmail XOAUTH2](https://developers.google.com/workspace/gmail/imap/xoauth2-protocol),
[OAuth-Prüfung](https://support.google.com/cloud/answer/9110914).
Die verwendeten Klassen/Methoden und Lizenzangabe wurden an Googles tatsächlich
heruntergeladenem Maven-Artefakt 22.0.0 geprüft. Offizielle Doku-Domains wurden
als additive Cloud-Konfigurationsänderung gespeichert; wirksam erst nach
Prüfen/Speichern/Veröffentlichen der Umgebung. Keine Netzsperre umgehen.

## Prüfungen und noch offene Geräteprobe

Browserprüfungen decken Originale nach simuliertem Neustart, Hash-Vergleich,
fehlende/falsche Wiederzuordnung, Speicherfehler, Rückweg und Linkdarstellung ab.
Android-Instrumentierung prüft physische Dateispeicherung/FileProvider,
benutzergesteuerten Browser-Intent, Google-Auswahl ohne Passwort sowie echte
XOAUTH2-Protokollanmeldung gegen synthetische lokale TLS-Server. Dazu kommen
bestehende Web-, Drift-, Mail-, Tresor-, Versand- und Rücknavigationstests.
Ausführungsnachweise und veröffentlichte APK erst nach erfolgreichem CI ergänzen.

Am Tablet danach prüfen: neue Datei importieren, App neu starten, Original öffnen;
altes Original passend erneut auswählen; Newsletterlink öffnen und ins Postfach
zurückwechseln; Telekom weiter abrufen. Google erst nach eigener OAuth-Einrichtung
mit echtem Konto testen. Vollständige Funktionsgleichheit ist nicht bestätigt.
