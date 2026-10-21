# Schutz vor Viren, Spam und Betrug (Bauabschnitt 5, in Vorschau .19)

In Vorschau .19 seit 2026-10-21 veröffentlicht: [APK herunterladen](https://github.com/lausiklauskn-png/Privat-Brain-Pro/releases/download/v0.1.0-preview.19/Private-Brain-Pro-0.1.0-preview.19.apk). Vollständige Main-CI 39570196725 und Release 39575223652 mit signierter .18→.19-Updateprobe erfolgreich. [Prüfsumme und alle Belege](PRUEFSTAND-ANDROID.md#veröffentlichte-version-19--2026-10-21). Die nachfolgenden Anbieter-, Geräte- und Lizenzgrenzen bleiben bestehen.

Stand der Funktionsbeschreibung 2026-10-20. Auftrag: [Brief Abschnitt 5](BRIEF_2026-10-20_speicherort-quarantaene-suche-sicherheit.md#bauabschnitt-5-vorbereitung-für-viren--spam--und-scam-schutz).
Nutzer 2026-10-20: *„… mit automatischer Aktualisierung von Virendateien … auch Spam-Schutz …
Listen mit in den Ordner, der auf der SD-Karte ist … Nichts soll auf den Hauptspeicher des
Tablets gehen, sondern alles in die Ordner, die dafür vorgesehen sind, mit Benennung.“*

## Was gebaut ist

Eine **Prüfstelle** (`native/native-protect.js`, `window.PBSchutz`) mit fünf Einschüben.
Jeder nennt Namen, Version und Stand seiner Daten. Ergebnisse heißen ausschließlich
„Befund“, „Hinweis“, „unauffällig laut …“, „unbekannt“ oder „nicht geprüft“, **nie
„virenfrei“** (eine Probe bewacht das).

| Einschub | was | Netz | wo die Daten liegen |
|---|---|---|---|
| Regeln für Spam und Betrug | Mailkopf und Text: SPF/DKIM/DMARC des Anbieters, Spam-Kennzeichen des Anbieters, Antwortadresse ≠ Absender, Firmenname ohne passende Adresse, ähnlich aussehende Adresse, ungewöhnliche Schriftzeichen, Link zeigt X führt nach Y, Link auf Zahlenadresse, Kurzlink, „@“-Trick, Druck + Daten-/Geldforderung (erst ab zwei Arten), ausführbare Anhänge, doppelte Endung | nein | im Programm |
| Liste bekannter Schaddateien (MalwareBazaar, abuse.ch) | SHA-256 jedes Anhangs, jeder eingelesenen Datei | nur zum Aktualisieren | `Private Brain/Schutzlisten/Schaddateien-MalwareBazaar-<n>.pbv` |
| Liste gefährlicher Links (URLhaus, abuse.ch) | Links der geöffneten Mail: genaue Adresse = Befund, Server mit Schadlinks = Hinweis (große Plattformen wie GitHub/Google Drive ausgenommen) | nur zum Aktualisieren | `…/Gefaehrliche-Links-URLhaus-<n>.pbv`, `…/Gefaehrliche-Server-URLhaus-<n>.pbv` |
| VirusTotal | nur der Fingerabdruck, nur auf Tipp, mit Rückfrage; Ergebnis „N von M Scannern melden etwas“ | ja, auf Tipp | Schlüssel in `…/Zugangsschluessel-<n>.pbv` |
| Virenscanner-App | „Mit Virenscanner-App prüfen“ teilt den Anhang nach Warnung an eine installierte App | je nach App | – |

`Stand-<n>.pbv` hält Abrufzeiten, Anzahl, Fehler und den Schalter „automatisch“.

**Alles im gewählten Speicherort-Ordner** (Tablet oder SD-Karte), verschlüsselt im
Format PBV1 wie Abschnitt 1, lesbare Dateinamen. Abrufe gehen vom Anbieter in den
Arbeitsspeicher und von dort verschlüsselt in den Ordner; **nichts** wird im App-Speicher
des Tablets abgelegt (Emulatorprobe vergleicht App-Speicher vorher/nachher). Ohne
Speicherort werden keine Listen geladen; die Regeln laufen trotzdem.

## Automatische Aktualisierung

- Beim Start, beim Zurückkehren in die App und stündlich fragt die Seite Android;
  Android entscheidet, was fällig ist.
- Neue Einträge (letzte 48 h bei MalwareBazaar) alle 12 Stunden, werden zur
  vorhandenen Liste **hinzugefügt**. Die große Gesamtliste alle 30 Tage, automatisch
  **nur im WLAN** (Berechtigung `ACCESS_NETWORK_STATE`); „Jetzt aktualisieren“ lädt sie
  auch mobil. URLhaus wird jedes Mal **ersetzt**, damit abgeschaltete Adressen
  herausfallen.
- Achtet auf den Internetschalter der App. Fehlschlag: alte Liste bleibt, neuer Versuch
  frühestens nach 3 Stunden. Beschädigte neueste Fassung: vorherige wird benutzt.
- Je Liste höchstens 5 Mio. Einträge, Abruf höchstens 256 MB.

## Zugangsschlüssel

abuse.ch verlangt seit 2025 einen persönlichen, kostenlosen **Auth-Key** (Konto auf
auth.abuse.ch); der Schlüssel steht im Pfad der Export-Adresse
(`https://mb-api.abuse.ch/v2/files/exports/<KEY>/recent.csv`, URLhaus entsprechend auf
`urlhaus-api.abuse.ch`). VirusTotal braucht einen eigenen API-Schlüssel.
Beide werden **nur im Android-Dialog** eingegeben und liegen verschlüsselt im Ordner;
die Seite erfährt nur „Schlüssel gespeichert ja/nein“. „Schlüssel holen“ öffnet die
Anmeldeseite im Browser.

## Benannte Grenzen

- **Kein vollständiger Virenscanner.** Listen erkennen nur bekannte Dateien/Adressen;
  neue Schadsoftware nicht. Die Regeln geben Hinweise, keine Urteile.
- Gespeichert werden die ersten 64 Bit jedes SHA-256 (Fehltreffer bei einigen Millionen
  Einträgen unter 1 : 10¹²).
- **Nicht am echten Anbieter gemessen:** die Seiten von abuse.ch und VirusTotal sind aus
  dem Bau-Behälter gesperrt. Pfad `recent.csv` ist aus der Anbieter-Doku; der Name der
  Gesamtliste `full.csv.zip` ist **nicht belegt** – antwortet der Anbieter mit 404, wird
  das vermerkt und die Liste wächst nur aus den 48-Stunden-Lieferungen.
- **Lizenz für Verkauf ungeklärt:** abuse.ch ist für nicht-gewerbliche Nutzung frei;
  gewerblich laut Dritten über ein Abo bei Spamhaus. Die kostenlose VirusTotal-Schnittstelle
  ist nicht für gewerbliche Produkte und erlaubt wenige Abfragen pro Minute.
- Regeln nur für geöffnete Mails, nicht schon in der Mailliste. Texte im Katalog werden
  (noch) nicht mit den Betrugsregeln geprüft; eingelesene Dateien schon über „Alles prüfen“.
- Kein ClamAV/YARA auf dem Gerät (Größe, GPL, Rechenzeit) – bleibt offen.
- Am Tablet nicht gemessen.

## Prüfung – getrennt nach Art

| Art | Was | Ergebnis |
|---|---|---|
| JVM `ProtectionListTest`, `VaultCodeTest` | Listen aus Text/CSV, überlange Zeilen, Adress-Normalisierung (IDN, Ports, „@“), geteilte Plattformen, Format mit Manipulationserkennung, Obergrenze | lokal 9/9 |
| JVM-Nachbau `NativeProtectTest` mit Arbeitsspeicher-Ordner (nur lokal) | Schlüssel, Abruf, Plan, WLAN, Schalter, Fehler, Rückfall, VirusTotal | 5/5; Gegenprobe 7 Sabotagen, 7 gefangen (3 Fälle zuerst falsch gebaut, nachgezogen) |
| Simulation `tools/native/test-protect.mjs` | Karte, Auto-Aktualisierung (nicht bei gesperrtem Ordner), kein Schlüsselfeld, Phishing-Mail mit 9 Befunden/Hinweisen, keine Fehlalarme bei echter Telekom-/DPD-Mail, VirusTotal nur Fingerabdruck, Hilfs-App mit Warnung, Explorer, „Alles prüfen“, nie „virenfrei“, Sprache | 34/34; Gegenprobe 8 Sabotagen, 8 gefangen (ein Fall zuerst toter Anker, nachgezogen) |
| Android-Emulator `NativeProtectTest` | echter Ordner (SAF-Testanbieter), echter Schlüsselspeicher; Anbieter gestellt: Dateien in `Schutzlisten/` mit Namen, App-Speicher unverändert, Schlüssel nicht lesbar, Plan/WLAN/Schalter/Wiederholung, gesperrt, beschädigte Fassung, VirusTotal | siehe PR/CI |
| Tablet, echter Anbieter | – | **nicht gemessen** |
