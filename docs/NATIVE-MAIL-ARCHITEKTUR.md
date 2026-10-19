# Direkte Mailanbindung: nächste Implementierung

Stand 2026-10-19. Dies beschreibt den beschlossenen nächsten Aufbau, keine bereits
funktionsfähige Mailanbindung. Die veröffentlichte Vorschau enthält noch keinen
nativen IMAP-/SMTP-Client. Eine Anmeldung bei Telekom oder Hetzner wurde mit der
nativen App noch nicht geprüft.

## Wiederverwendung und Grenze zum Gerät

Capacitor bleibt geeignet: lokale Oberfläche und bestehende Katalog-/Prüfmodule
werden weiterverwendet. `assets/live-mail.js` spricht heute ausschließlich den
optionalen privaten HTTPS-Dienst an. Dessen Node-Abhängigkeiten und Express-Server
werden nicht in die APK eingebaut. Die existierenden Request-/Response-Formen aus
`mail-service/server.mjs` dienen als Referenz für einen engen nativen Mailadapter.
Ein frei aufrufbarer HTTP-/TCP-Proxy wird nicht in die WebView gegeben.

Die existierenden Text-, HTML-, Format- und Anhangsprüfer bleiben bytegleich unter
dem Drift-Guard. Empfangene Inhalte gelten weiter als fremde Daten. Anzeige und
Katalogisierung führen dieselben Prüfungen aus; HTML bleibt bereinigt, aktive
Inhalte und externe Bilder werden nicht automatisch nachgeladen. Diese Prüfungen
sind kein Virenscanner. Ein späterer Malware-Dienst benötigt eine gesonderte
Datenschutz-/Betriebsentscheidung, weil Anhänge vertrauliche Daten enthalten können.

## Erste echte Verbindung

Der erste native Mailbaustein erhält Kontoverwaltung, Anmeldungstest und lesenden
Ordner-/Nachrichtenabruf für Telekom und Hetzner. Der Postfachadapter erhält nur
Kontokennungen und normalisierte Nachrichten. Zugangsdaten werden über einen
nativen Dialog erfasst und nicht in localStorage, den Katalog oder Logs geschrieben.
Die native Ablage verschlüsselt Kontogeheimnisse mit einem nicht exportierbaren
Android-Keystore-Schlüssel; Fehler oder Schlüsselverlust dürfen keine Konten mit
leeren Ersatzwerten überschreiben. App-/Gerätesicherungen bleiben dafür gesperrt.
Zukünftiges iOS implementiert denselben Vertrag mit Keychain und eigener Mailkomponente.

IMAP nutzt zunächst TLS auf 993, SMTP zunächst implizites TLS auf 465. Der
System-Truststore und Hostnamenprüfung sind zwingend; keine „allen Zertifikaten
vertrauen“-Option. Optionales STARTTLS auf 587 darf nur mit verpflichtendem TLS
vor Anmeldung umgesetzt werden. Telekom-IP-Sperren des privaten Servers gelten
nicht als Beweis für eine Verbindung des Geräts. Echte Anbieterproben erfolgen erst
am Gerät mit vom Nutzer dort eingegebenen Daten.

Vor Wahl einer Mailbibliothek sind deren Android-Kompatibilität, Pflegezustand,
Abhängigkeiten und Lizenztexte zu prüfen. Keine handgeschriebene IMAP-/MIME-
Implementierung nur für einen schnellen Vorführtest. Verbindungen haben Grenzen
für Zeit, Nachrichtengröße, Anhänge und gleichzeitige Abrufe. UI und WebView dürfen
dadurch nicht blockieren. IMAP-Identität umfasst Konto, Ordner, UIDVALIDITY und UID.
Kontolöschung entfernt lokale Geheimnisse; sie löscht keine Provider-Nachrichten.

## Versand danach

Vor dem ersten SMTP-Versand wird eine persistente native Versandwarteschlange
eingeführt. Sie speichert einen unveränderlichen Entwurf, Anhangskopien und eine
Versandkennung, bevor der Netzvorgang beginnt. Zustände umfassen Entwurf, wartet,
sendet, bestätigt, unklar und fehlgeschlagen. Bei Abbruch nach möglicher Annahme
darf kein automatischer Neuversand folgen. Eine Message-ID allein verhindert
keinen Doppelversand beim SMTP-Anbieter. Der Nutzer muss einen unklaren Fall
prüfen und einen erneuten Versuch ausdrücklich auslösen. Auch ein Prozessabbruch
zwischen SMTP-Annahme und lokaler Bestätigung wird als unklar behandelt.

Erst danach folgen Antworten/Weiterleiten, Anhänge, Provider-Entwürfe,
Gelesen/Ungelesen, Archiv/Spam/Papierkorb und Ordneränderungen. Geräte-Dateien werden
über Betriebssystem-Auswahldialoge gelesen; für ausgehende Anhänge wird eine eigene
lokale Kopie mit expliziter Lebensdauer gehalten. Schlüssel und persönliche
Dateien gehören nicht in Git.

## Spätere Anbieter und Hintergrundbetrieb

Gmail erhält OAuth über den Systembrowser mit PKCE und passendem registriertem
Android-Client. Keine eingebetteten Client-Geheimnisse; Refresh-Tokens nur in der
nativen geschützten Ablage. Gmail-Freigaben und mögliche Prüfprozesse sind ein
gesonderter Arbeitsschritt.

Android-Hintergrundabruf und Benachrichtigungen werden mit Betriebssystem-Jobs und
angeforderten Berechtigungen umgesetzt. Keine ständige Erreichbarkeit trotz Doze
oder Energiesparen versprechen. Android und iOS erhalten jeweils passende Adapter.

## Nachweise vor Freigabe

Erforderlich sind Tests für falsche/abgelaufene Zertifikate, ungültige Zugangsdaten,
mehrere Konten, UIDVALIDITY-Wechsel, große/bösartige Nachrichten, Prozessende,
unklaren SMTP-Ausgang sowie APK-Update mit erhaltenen Konten und Dateikopien.
Provider-Simulationen werden getrennt von echten Geräteverbindungen berichtet.
Der bestehende private Maildienst und die unabhängige PWA bleiben unverändert.
