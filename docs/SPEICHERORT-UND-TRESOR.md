# Speicherort und Verschlüsselung (Bauabschnitt 1, Vorschau .17)

Stand 2026-10-20. Auftrag: [Brief Abschnitt 1](BRIEF_2026-10-20_speicherort-quarantaene-suche-sicherheit.md#bauabschnitt-1-wichtigster-eigener-speicherort--quarantäne-für-mail-anhänge).

## Bedienung

**⚙️ Einstellungen → „🔐 Speicherort und Verschlüsselung“** (erste Karte).

1. **Speicherort wählen** → „📱 Tablet“ oder „💾 SD-Karte“ (ab Android 10 öffnet
   die Ordnerauswahl gleich auf diesem Speicher) oder „Anderer Ordner …“.
2. In der Android-Ordnerauswahl einen neuen Ordner anlegen (z. B. „Private Brain“)
   und wählen. Ein leerer Ordner „Private Brain“ wird direkt benutzt, sonst legt die
   App darin den Unterordner „Private Brain“ an.
3. Im **Android-Dialog** (nicht in der Webseite) das Passwort zweimal eingeben,
   mindestens 10 Zeichen, den Hinweis „Passwort vergessen = Daten verloren“ bestätigen.
   „Auf diesem Gerät entsperrt halten“ ist vorgewählt (Android-Schlüsselspeicher).
4. Rückfrage „Vorhandene Daten übernehmen?“: bisherige App-Originale, Konten und
   Entwürfe werden zusätzlich verschlüsselt in den Ordner kopiert. In der App bleibt alles.

**Neues Gerät:** App installieren → Einstellungen → **„Vorhandenen Ordner öffnen“** →
Ordner der SD-Karte wählen → Passwort. Konten, Entwürfe/Versandstatus und Katalog
kommen zurück (nur ergänzt, nie überschrieben). Originale werden beim Öffnen aus dem
Ordner zurückgeholt und am Fingerabdruck geprüft. Google-Konten brauchen eine neue
Freigabe (Zugriffsfreigaben werden nicht gesichert).

**Sperren:** „Auf diesem Gerät sperren“ vergisst den Schlüssel; der Ordner bleibt
unverändert. Beim nächsten Öffnen einer Mail fragt Android einmal nach dem Passwort.

**Explorer → „📎 Mail-Anhänge“:** Name, Größe, Betreff der Mail, Absender, Datum.
„Ansehen“ zeigt die Datei in der App (bis 64 MB; PDF wie bisher bis 16 MB).
„Öffnen mit …“ warnt vorher, dass eine entschlüsselte Kopie an eine andere App geht;
das gilt auch für „Öffnen mit/Teilen“ im Dateibetrachter. **„🗑 Ganzen Ordner leeren“**
fragt mit Anzahl und Größe; danach zeigen die Mails „Anhang gelöscht“ mit
„Erneut vom Anbieter laden“. Beim Anbieter bleiben die Anhänge erhalten.

Ohne gewählten Speicherort bleibt alles wie in .16 (Anhänge höchstens 5 MB, ganze Mail 8 MB).

## Ordneraufbau

```
<gewählter Ordner>/Private Brain/
  tresor.json   Format, Kennung, PBKDF2-HMAC-SHA256 600 000 Runden, Salz,
                mit dem Passwortschlüssel verpackter Datenschlüssel – kein Passwort, kein Klartextschlüssel
  Mails/        <Name>.pbv  je geöffnete Mail (Kopf, Text, HTML, Verweise auf Anhänge)
                konten-<n>.pbv  Konten, Entwürfe, Versandnachweise (letzte 3 Fassungen)
  Anhänge/      <zufällige Kennung>.pbv  je Anhang, bis 1 GiB
                verzeichnis-<n>.pbv  Anhangsverzeichnis (Mail, Absender, Datum, Prüfsumme)
  Originale/    <Name>.pbv  „Dateien hinzufügen“ + verzeichnis-<n>.pbv
  Katalog/      katalog-<n>.pbv  Katalogsicherung (letzte 3 Fassungen)
```

Dateinamen verraten weder Mails noch Fingerabdrücke der Originale (HMAC mit einem aus
dem Datenschlüssel abgeleiteten Namensschlüssel).

**Dateiformat PBV1** (`VaultCrypto.java`): Kopf mit zufälligem Dateischlüssel, verpackt
mit dem Datenschlüssel; danach AES-256-GCM-Stücke à 256 KiB. Jedes Stück bindet Kopf,
logischen Namen, Stücknummer und „letztes Stück“. Vertauschen von Dateien oder
Stücken, Abschneiden am Ende und jede Bitänderung werden erkannt („beschädigt oder
verändert“, nicht angezeigt). Ist die neueste Katalog-/Verzeichnisfassung beschädigt,
gilt die vorherige.

## Wie Anhänge fließen

Ist ein Speicherort gewählt, lädt Android eine geöffnete Mail (bis 1,5 GiB) in den
privaten App-Zwischenspeicher, liest sie von dort ohne sie ganz in den Speicher zu
laden (`SharedFileInputStream`) und streamt jeden Anhang verschlüsselt in `Anhänge/`.
Danach wird die Zwischendatei gelöscht. Die Webseite erhält nur Verweise
(`ref`, Name, Größe, Prüfsumme), keine Bytes. Kleine Inline-Bilder der HTML-Ansicht
(zusammen bis 5 MB) bleiben wie bisher in der Ansicht. Einmal geöffnete Mails kommen
danach aus dem Ordner, auch offline. Vor dem Abruf wird der freie Platz am App-Speicher
und – wo Android ihn verrät – am Speicherort geprüft.

Beim **Weiterleiten** und **Entwurf öffnen** werden Ordner-Anhänge bis zur bisherigen
Sendegrenze (5 MB zusammen) zurückgelesen; größere werden mit Hinweis weggelassen.

## Katalogsicherung

Jede Katalogänderung (Einlesen, Schlagworte, Löschen, Mail-Katalog) löst nach 5 s
eine gebündelte Sicherung aus, außerdem beim Wechsel in den Hintergrund und über
„Jetzt sichern“. Gesichert werden alle Katalogeinträge samt Kategorie, Schlagworten,
Pfaden, Vorschaubildern und Stichwort-Vektoren sowie gespeicherte Suchen; die
Modell-Vektoren (`evec`) nicht, sie werden neu gerechnet.

## Benannte Grenzen

- Passwort vergessen = Daten im Ordner verloren.
- SD-Karte muss als **mobiler Speicher** eingerichtet sein. Als interner Speicher
  eingerichtet erscheint sie wie Tablet-Speicher und ist an das Tablet gebunden; das
  lässt sich aus der App nicht unterscheiden, deshalb steht es als Hinweis da.
- SD-Karten gehen auch kaputt: gelegentlich eine zweite Kopie des Ordners anlegen.
- Während des Abrufs liegt eine große Mail kurz unverschlüsselt im privaten
  App-Zwischenspeicher (nicht für andere Apps lesbar), bis die Anhänge im Ordner sind.
- Originale liegen weiterhin auch im App-Speicher (bis 256 MB je Datei); der Ordner
  ist die zusätzliche verschlüsselte Kopie. Die unverschlüsselte Zusatzablage aus .15
  bleibt davon unberührt.
- Keine automatische Ordnersynchronisierung. „Anderen Speicherort wählen“ richtet
  einen neuen Ordner ein; der alte bleibt unverändert liegen.
- Ist die SD-Karte gezogen, öffnen sich Mails nicht (Meldung „Speicherort nicht erreichbar“); Mailliste, Konten und Katalog bleiben benutzbar.
- Senden großer Anhänge fehlt noch (Anbieter meist 25–50 MB).
- Prüfen im Ordner (Prüfkern, VirusTotal) ist **nicht** Teil dieses Schritts: Ordner-
  Anhänge stehen im Prüfbericht als „nicht im Browser geprüft“.
- Passwort ändern ist noch nicht eingebaut (das Format erlaubt es: nur `tresor.json`
  müsste neu verpackt werden).
- Die Original-Mail („Original teilen / sichern“) bleibt wie bisher bis 8 MB.

## Prüfung — getrennt nach Art

| Art | Was | Ergebnis |
| --- | --- | --- |
| JVM-Einheitstest `VaultCryptoTest` | PBKDF2 gegen RFC-7914-Vektoren und die Plattform, NFC-Passwort, Stückgrenzen, falscher Schlüssel, vertauschte Namen, Bitänderung, Abschneiden, vertauschte Stücke, Größengrenze | lokal 5/5 grün; läuft in der CI mit `testDebugUnitTest` |
| Übersetzung lokal | alle geänderten Java-Dateien gegen Android 14 (`android-all`), Capacitor/AndroidX nur als Platzhalter | fehlerfrei; ersetzt nicht den Gradle-Bau |
| Simulation `tools/native/test-vault.mjs` | Chromium, Android-Brücken gestellt: Karte, Tablet/SD-Wahl, kein Passwortfeld in der Seite, Übernahme, Katalogsicherung ohne Klick und ohne `evec`, Mail mit Ordner-Anhängen, Ansehen, Warnung vor „Öffnen mit“, Leeren, „Anhang gelöscht“, erneut laden, Sperren/Entsperren, Wiederherstellen auf zweitem Gerät ohne Doppelte, Sprache | 30 grün; Gegenprobe 8 Sabotagen, 8 gefangen (zuerst 2 durchgerutscht, Prüfungen nachgezogen) |
| Android-Emulator `NativeVaultTest` | echtes Speicherzugriffs-Framework (lokaler Testanbieter), echter Schlüsselspeicher: Einrichten, falsches/kurzes Passwort, zerlegtes Umlaut-Passwort, Wiederherstellen auf „neuem Gerät“, Katalog, Konten, Original zurück, Sperren/Merken, 40-MB-Anhang gestreamt, Wiederverwendung, Manipulation erkannt, Leeren → „gelöscht“, 1-GiB-Grenze ohne Reste, beschädigte neueste Sicherung | siehe PR/CI |
| Tablet | echte SD-Karte, echte Mail mit großem Anhang, Wiederherstellung auf zweitem Gerät | **nicht gemessen** – wartet auf den Nutzer |
