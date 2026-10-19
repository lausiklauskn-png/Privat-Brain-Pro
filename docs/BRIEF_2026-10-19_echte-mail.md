# Echte Mail-Anbindung: Hetzner und Telekom

Klaus hat die echte Einbettung mit Empfang/Versand und selbstständigen Commit/PR/Merge
beauftragt. Ziel: Tablet und Desktop, bestehendes Layout. Nach der zunächst gewünschten
Telekom-Anbindung wurde auch Hetzner für `info@family-projekt.de` genannt; beide Konten
werden berücksichtigt. Kein Passwort wurde angefordert oder eingecheckt.

Die optionale Oberfläche `assets/live-mail.js` ergänzt das lokale Postfach, der private
Dienst `mail-service/server.mjs` nutzt ImapFlow, Mailparser und Nodemailer. Die Anwendung
wird auch vom privaten Dienst ausgeliefert, damit der Tablet-Browser dort ohne fremden
Ursprung arbeitet. Der GitHub-Pages-Stand bleibt eine statische App. Betrieb mit HTTPS
über Docker Compose/Caddy oder vorhandenen privaten Reverse-Proxy: `docs/MAIL-DIENST.md`.

Funktionen: mehrere Konten, echte Serverordner, Seitennavigation, Lesen/Klartext und
Anhangdownload, Reply-To/Thread-Bezug, Weiterleiten, Serverentwürfe, Cc/Bcc/Anhänge,
SMTP-Versand und Gesendet-Kopie, Gelesen/Stern, Verschieben/Spam/Archiv/Papierkorb,
endgültiges Löschen im Papierkorb, ausdrücklich ausgelöste lokale Katalogübernahme.
Die unveränderten Prüfmodule werden beim Öffnen und vor dem Senden verwendet.
Kein Virenscanner; keine vollständige serverweite Text- oder Bedeutungssuche ohne
Katalogübernahme. Entwürfe speichern legt eine neue Kopie an. Kein Hintergrundabruf
bei geschlossener App. Das sind benannte Grenzen, keine produktiven Behauptungen.

Schutz: TLS-Zertifikatsprüfung, Mailhost-Freigabe, Token/Origin, AES-256-GCM-Kontodatei,
kein Browser-Passwortspeicher, API ohne Cache (auch Service Worker), UIDVALIDITY für
Nachrichtenaktionen. Absender wird ans Konto gebunden. SMTP-Teilannahme und unklarer
Status sind sichtbar; persistente Versandkennungen verhindern Wiederholung desselben
Versuchs auch nach Neustart. Fällt nur Gesendet-Append aus, darf nicht erneut gesendet
werden. Browser-HTML zeigt Mailinhalte nur als Text, keine Tracker.

Prüfungen bisher: 14 Dienstprüfungen inklusive tatsächlichem lokalen SMTP-Dialog,
26 Browserprüfungen (320/768/1280 px, Authentifizierung, Lesen, Antworten/Versand,
Anhänge, lokale Suche, Trennen, erneute Anmeldung), vier in Wegwerfkopien gefangene
Gegenproben. npm audit: keine gemeldeten Sicherheitslücken. Eigene Service-Lockdatei
und CI. Die alte lokale Postfachprobe ist nur in ihren Selektoren auf das lokale
Postfach eingegrenzt, ihre 42 Verhaltensprüfungen bleiben gleich.

Beim ersten Regression-Gesamtlauf waren alle bisherigen Suiten grün, die neue letzte
Browserprobe las die Spam-Anforderung vor Abschluss der asynchronen Aktion. Die Probe
wartet nun ausdrücklich auf das Ende der Aktion; zusätzlich wurde ein mehrdeutiger
Dialog-Selektor auf den Maildialog begrenzt. Der gezielte Nachlauf ist grün; der gesamte
abschließende Lauf `npm test` ist ebenfalls mit Rückgabewert 0 bestanden, einschließlich
49 Workspace-, 42 lokaler Postfach- und 26 neuer Live-Mail-Browserprüfungen.

Docker-Compose-Konfiguration ist valide. Der normale Image-Bau scheiterte hier am
Paketdownload innerhalb des Docker-Netzes (Registry ECONNREFUSED, npm-Exit-Handler).
Das ist kein grüner Build und wird nicht als solcher dargestellt. Alle 14 Diensttests bestehen auch im Node-22-Alpine-Container mit deaktiviertem
Außennetz (lokaler SMTP-Dialog über Loopback). Das ersetzt den fehlgeschlagenen
Image-Bau nicht. Produktiver Versand/Empfang ist ungeprüft: dafür
fehlen Bereitstellung auf Klaus' konkretem Host und dort eingerichtete Konten.
