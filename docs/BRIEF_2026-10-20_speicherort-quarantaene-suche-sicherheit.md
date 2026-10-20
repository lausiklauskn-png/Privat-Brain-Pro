# Brief: eigener Speicherort auf der SD-Karte, Quarantäne für Mail-Anhänge, Bedeutungssuche, Sicherheitspaket

Stand: 2026-10-20, **aktualisiert gegen `origin/main` 78e93b5 (Vorschau .16)** und gegen die vom Nutzer
gelieferte APK `Private-Brain-Pro-0.1.0-preview.16.apk`. Analyse-Sitzung, kein Code geändert.

**Abgleich APK ⟷ Repo (gemessen):** 74 Web-Dateien unter `assets/public/`; 73 byte-gleich mit
`origin/main`, eine verschieden: `assets/schutz-init.js` — der Bau (`tools/native/prepare-web.mjs`)
ergänzt `https://localhost` in `ALLOWED_ORIGINS`. Das ist gewollt. Die APK ist also aus diesem Repo gebaut.
Dieser Brief ist der Arbeitsauftrag für die folgenden Bau-Sitzungen in `lausiklauskn-png/Privat-Brain-Pro`.

## Erledigt seit dem letzten Brief

`BRIEF_NACHFOLGE_2026-10-20_gmail.md` ist abgearbeitet: Original öffnen und Mail-Links (#14),
PDF-Originale anzeigen (#16), Gmail (#16–#21), weitere Anbieter WEB.DE, GMX, Yahoo, IONOS (#22).
Nutzer 2026-10-20: *„Die E-Mails funktionieren … in jede Richtung, auch mit Anhang."* und, nach .16,
*„jetzt … die Google-Mail-Geschichte hat funktioniert und auch das Design wurde etwas angepasst."*
Der Antrag bei Google zur Freigabe der App läuft (Nutzerauskunft, nicht nachgeprüft).

Seit .13–.16 außerdem da (nicht neu bauen, darauf aufsetzen):
- **App-Offline-Schalter** (`AppNetwork.java`, `ProNetworkPlugin`, `native/native-network.js`): sperrt
  `fetch`, `WebSocket`, `EventSource`, `RTCPeerConnection` zu fremden Herkünften. Mycel braucht WebSocket —
  bei „offline" ist das Netz-Fenster bewusst tot und muss das **sagen**.
- **Ordnerauswahl über Android** (`FolderStore.java`, `ProFoldersPlugin`): `ACTION_OPEN_DOCUMENT_TREE`,
  `takePersistableUriPermission`, Bibliotheks-Kopien bis 80 MB je Datei / 512 MB je Lauf, **unverschlüsselt**.
  → Grundlage für den Speicherort in Abschnitt 1, nicht daneben neu bauen.
- Kompakte Symbolleisten und beschriftete Navigation (`native/native-toolbar.js`, #27–#31).

**Design:** Nutzer 2026-10-20: *„so wie der Aufbau in dieser Version ist, ist er vorerst gut … nicht
großartig davon abweichen, vorläufig."* Neue Teile fügen sich in .16 ein, kein Umbau.

## Verbindlich

- Nur in `Privat-Brain-Pro` arbeiten. `Privat-Brain` (PWA) bleibt unverändert.
- Die byte-1:1-Module (Drift-Guard) nicht abwandeln. Gemessen am 2026-10-20: alle Kanon-Module
  sind gleich mit Sage (`src/modules/`), dem Auslieferungsprüfer (`assets/pruefer*.js`) und
  Workflow PDF (`assets/reinigung.js`). Neue Logik nur im App-/Adaptercode.
- Freibrief: bauen, prüfen, mergen. Simulation, echter Android-Lauf und Nutzerprüfung am Gerät
  getrennt benennen. Am Tablet nicht Gemessenes als solches markieren.

---

## Bauabschnitt 1 (wichtigster): eigener Speicherort + Quarantäne für Mail-Anhänge

> **Stand 2026-10-20 (Vorschau .17):** Aufgaben 0–5 und 8 (Warnung vor „Öffnen mit …“)
> gebaut, siehe [SPEICHERORT-UND-TRESOR.md](SPEICHERORT-UND-TRESOR.md). Offen aus diesem
> Abschnitt: 6 (Prüfen im Ordner), 7 (VirusTotal), Senden großer Anhänge, Passwortwechsel.
> Am Tablet nicht gemessen.

### Nutzerwunsch (2026-10-20, wörtlich zusammengefasst)

*„Kriege ich mal von einem Rechtsanwalt ein Schreiben, dann ist das sehr wenig an Speicher"* —
Anhänge sollen nicht im Browser liegen, sondern **gleich in einen Ordner** gehen, der im Explorer
benannt ist; dort in Ruhe prüfen, einzeln ansehen, mit der Mail verknüpft; *„da verlässt auch
nichts den Ordner"*; bei Bedarf den ganzen Ordner löschen. **1 GB je Datei ist in Ordnung.**
*„Wichtig ist, dass ich den Platz des Ordners selber bestimmen kann … SD-Karte oder Hauptspeicher
… Falls der Rechner in die Brüche geht, habe ich immer noch meine SD-Karte … Alles soll auf die
SD-Karte gespeichert werden. Gleich von Beginn."* **Verschlüsselung mit eigenem Passwort: ja.**

### Ist-Stand (gemessen im Code)

| Stelle | Grenze |
|---|---|
| `MailMime.java` `MAX_RAW` | 8 MB je abgerufener Mail, ganz im Speicher gelesen |
| `MailMime.java` `MAX_ATTACHMENTS` | 5 MB Anhänge beim Senden |
| `EncryptedMailStore.java` | 24 MB je Mail, 256 MB gesamt, Schlüssel im **Android-Keystore** |
| `FolderStore.java` | gewählter Android-Ordner (SAF), 80 MB je Datei, 512 MB je Lauf, unverschlüsselt — schon dauerhaft gewählt |
| `OriginalFileStore.java` | 256 MB je Datei, 2 GB gesamt, `getFilesDir()/originals-v1`, 256-KB-Stücke, Prüfsumme, nach Fingerabdruck abgelegt — **nur für „Dateien hinzufügen", nicht für Mail-Anhänge** |

Anhänge laufen heute als base64 durch die Brücke in die WebView. Das ist der Grund der Grenze.

### Drei Fallen, die das Ziel „überlebt den Ausfall des Tablets" sonst verfehlen

1. **App-eigene Ordner (`getFilesDir`, auch `getExternalFilesDirs` auf der SD-Karte) werden beim
   Deinstallieren gelöscht.** → Ordner vom Nutzer über `ACTION_OPEN_DOCUMENT_TREE` wählen lassen,
   Zugriff mit `takePersistableUriPermission` dauerhaft halten.
2. **Ein Keystore-Schlüssel stirbt mit dem Gerät.** → Im gewählten Ordner mit einem Schlüssel aus
   dem **Passwort des Nutzers** verschlüsseln (PBKDF2/AES-GCM wie `schluesseltresor.js` /
   Sicherung in Workflow PDF und Sende-Prüfer; Salz und Parameter im Ordner ablegen). Das Passwort
   wird nie gespeichert. Ein Keystore-Schlüssel darf zusätzlich das entsperrte Passwort-Material
   auf **diesem** Gerät zwischenhalten (Komfort), aber nie der einzige Weg sein.
3. **Eine SD-Karte als „interner Speicher" (adoptiert) ist an das Tablet gebunden.** → In der App
   benennen: die Karte muss als **mobiler Speicher** eingerichtet sein. Prüfen, ob sich das aus der
   App erkennen lässt; sonst als Hinweis.

### Ordnerbau (Vorschlag)

```
<gewählter Ordner>/Private Brain/
  tresor.json     ← Salz, Parameter, Prüfwert (kein Schlüssel)
  Mails/          ← je Mail verschlüsselt (Text, Kopf, Verweise auf Anhänge)
  Anhänge/        ← je Datei verschlüsselt, bis 1 GB, nach Fingerabdruck
  Originale/      ← „Dateien hinzufügen"
  Katalog/        ← verschlüsselte Sicherung von Katalog, Kategorien, Ordnerstruktur
```

### Aufgaben

0. **Auf `FolderStore`/`ProFoldersPlugin` aufbauen:** dieselbe Ordnerauswahl, dauerhafte Freigabe schon da.
   Neu sind Verschlüsselung, Anhänge, Grenzen (1 GB) und der feste Ordnerbau.
1. **Erster Start / Einstellungen:** „Speicherort wählen" — Tablet oder SD-Karte (Ordnerauswahl),
   Passwort festlegen (zweimal, Mindestlänge), Warnung „Passwort vergessen = Daten verloren".
   Bestehende Daten aus `originals-v1` und `EncryptedMailStore` auf Wunsch hinüberziehen.
2. **Mail-Abruf streamt Anhänge** auf der Java-Seite direkt (verschlüsselt, stückweise) nach
   `Anhänge/`, ohne Umweg über die WebView. In der Mail bleibt ein Verweis
   (`📎 Name · Größe · im Anhang-Ordner`). Grenze **1 GB je Datei**, gesamt = freier Platz.
   Senden großer Anhänge ist ein eigener Schritt (Anbietergrenzen meist 25–50 MB) — benennen.
3. **Katalog überlebt:** Katalog/Kategorien/Ordnerstruktur liegen in der WebView-Datenbank, die
   Android nicht auf die Karte legen kann. → Nach jeder Änderung (gebündelt) verschlüsselte
   Sicherung nach `Katalog/`. Bedeutungs-Vektoren müssen nicht mit (werden neu gerechnet).
4. **Wiederherstellen auf neuem Gerät:** App installieren → „Vorhandenen Ordner öffnen" → Passwort
   → Mails, Anhänge, Originale, Katalog wieder da. Mit echter Probe: Ordner von Gerät A, leere App,
   Wiederherstellung, Vergleich.
5. **Explorer:** Ordner „📎 Mail-Anhänge" mit Mail, Absender, Datum; „Ganzen Ordner leeren" mit
   Rückfrage; Mails zeigen danach „Anhang gelöscht".
6. **Prüfen im Ordner** mit dem Prüfkern (Marke + Prüfbericht wie Workflow PDF), auf Knopfdruck.
   Große Dateien: der Kern liest am Stück — Grenze messen, darüber „teilweise geprüft" benennen.
7. **VirusTotal nur auf Tipp:** Standard nur der SHA-256 (Ergebnis „N von M Scannern melden etwas"
   oder „unbekannt", nie „virenfrei"). Hochladen nur mit Warnung, dass hochgeladene Dateien an Dritte
   gehen. Links aus Mails ebenso (nur die Adresse). ⚠ Nutzungsbedingungen und Schlüssel (eigener
   Schlüssel je Nutzer? Einsatz in einer verkauften App?) **vor dem Bau nachsehen**.
8. **Hinausgeben benennen:** „Öffnen mit …" und „Teilen" geben eine Datei aus dem geschützten
   Ordner frei — vorher sagen. Ansicht in der App (PDF als Seiten, Bild neu gezeichnet) bleibt drin.

⚠ Benannt: SD-Karten gehen auch kaputt (gelegentliche zweite Kopie empfehlen) · SD-Karte ist
langsamer · Microsoft-Einrichtung ist offen (#23), nicht Teil dieses Abschnitts.

---

## Bauabschnitt 2: Bedeutungssuche, die wirklich läuft

### Befund

**In der APK .16 bestätigt:** dieselbe CSP im `index.html`, `models/` nur `PLATZHALTER.md`.

- **Kein Modell wird geladen.** Modul 03 holt transformers.js per `import()` von
  `cdn.jsdelivr.net`. Die CSP aus `tools/native/prepare-web.mjs` erlaubt `script-src 'self'
  'unsafe-inline' 'wasm-unsafe-eval'` → gesperrt. Modell-Server (`family-projekt.de/models/`) und
  Hugging Face kommen nie zum Zug. Anzeige „lädt / Rückfall aktiv", tatsächlich nur Stichworte.
  `models/` enthält nur `PLATZHALTER.md`.
- **Je Datei ein Vektor aus Name + erste 600 Zeichen** (`SNIPPET_LEN = 600`, `passageText`
  `slice(0,1600)`). Nur dieser Anfang wird gespeichert. Die Wortsuche (BM25) zählt den ganzen Text.
- Die Proben ersetzen Modul 03 durch einen Stellvertreter und sehen das nicht.

### Nutzerentscheid (2026-10-20)

Modell **fest ins APK** (*„die App kann ruhig ein paar mehr Megabyte schlucken"*), Abschnitte
**bis etwa 2000 Zeichen** über das ganze Dokument, **ins Mycel nur ein kurzer Ausschnitt**.

### Aufgaben

1. **Größe messen** (multilingual-e5-small, quantisiert, plus transformers.js + WASM) und dem
   Nutzer nennen, bevor es eingebaut wird. Dann alles unter `www/` mitliefern, `env.localModelPath`
   auf die App, keine fremde Herkunft, CSP bleibt streng.
2. **Ganzer Text je Dokument** in einem eigenen Speicherfach (Vorbild Workflow PDF `texte`), mit
   Seite je Stück.
3. **Wortsuche Stufe 1** wie Workflow PDF (`assets/suche.js`): Umlaute angeglichen, Daten,
   Nummern, Fundstelle „Seite n · …".
4. **Abschnittsvektoren:** Stücke bis ~2000 Zeichen an Satzgrenzen mit Überlappung, je ein
   Vektor; das Modell schneidet bei 512 Wortteilen ab (Kommas und kleine Wörter zählen mit) —
   Stückgröße daran messen, nicht an Zeichen raten. Treffer springt an die Stelle.
5. **Mycel kurz halten:** `__CB_getCorpus` liefert weiter nur einen kurzen Ausschnitt, nicht die
   2000-Zeichen-Stücke. Eigener Wächter.
6. **Ehrliche Anzeige:** ohne Modell „Bedeutungssuche aus — nur Stichworte".
7. **Android-Probe ohne Stellvertreter:** das echte Modell lädt in der gepackten App.
8. Optional danach: „Mit KI verfeinern" nur auf Tipp, nur die besten Fundstellen, gereinigt und
   mit Modul 25 verdeckt.

---

## Bauabschnitt 3: Sicherheitspaket wie Workflow PDF / Auslieferungsprüfer

**In der APK .16 bestätigt:** kein pdf.js, keine Texterkennung im Paket.

1. **pdf.js fehlt im APK.** `modules/ki-reinigung.js` lädt `/Workflow-PDF/vendor/pdfjs/` — in der
   App (`https://localhost`) nicht vorhanden; pdf.js liegt nur unter `tests/fixtures/`. Folge:
   PDF ohne Textebene geht nicht an Mistral OCR, „🔗 KI zu einer Datei" prüft versteckten Text
   nicht. → pdf.js (und Tesseract) ins APK, `window.KI_REINIGUNG_PDFJS` setzen.
2. **`PrueferAnhang.pfade()` wird nirgends gesetzt** (auch in der PWA nicht). Seitentext, Text im
   Bild, blasser und unsichtbarer Text bleiben bei Mail-Anhängen immer „ungeprüft" → jede PDF/Bild-
   Mail löst die Warnung aus. → Pfade setzen.
3. **Keine Prüfung beim Einlesen** („Dateien hinzufügen"): versteckter Text gelangt in Katalog und
   Suche. → Marke + Prüfbericht wie Workflow PDF, Prüfen auf Knopfdruck. Passt zu Abschnitt 1.6.
4. **KI-Hilfe beim Schreiben:** heute nur an gespeicherten Mails (`drawReader`, Zweig `editing`
   endet vor dem KI-Kasten) und nur Mistral. → auch beim Verfassen; Anbieter, Halt vor dem
   Hinausgehen und Systemkanal wie Sende-Prüfer. Das Verdecken mit Modul 25 ist unabhängig vom
   Mailanbieter (Telekom, Google, Hetzner …).

## Bauabschnitt 4: Mycel und Siegel — aktueller Kanon, oben verankert, eigene Identität

### Nutzerwunsch (2026-10-20)

*„Das Mycel und auch das Siegel sind nicht aktuell im Private Brain und PBP. Sie sollen auch verankert
werden können oben, minimiert werden und auch weggeschaltet werden können, so wie das jetzt der Fall ist
bei den anderen Apps. Das soll dann auch in der nativen App möglich sein. Das prüfen wir noch, ob wir
damit einen Knoten einrichten können."*

### Befund (gemessen in Repo und APK .16)

- **Die Netz-Bausteine sind die alte Bauart.** PB/PBP tragen das app-eigene `modules/net-widget.js`
  plus Modul 17. Es fehlen `23_rendezvous_ui.js` (Netz-Fenster des Kanons: oben in einen
  Leisten-Platz andocken, zur Pille minimieren, „Ausblenden (kommt beim Neuladen zurück)", Netz-Box
  öffentlich/eigenes Netz) und `23b_netzverwaltung.js`. Verbindliche Liste:
  `Sage-Protokol/docs/PFLICHT_MODULE.md`. Vorbild für eine feste Leiste oben: Sende-Prüfer
  (`#netzleiste`, Lampen, `#siegel-platz`, `[data-sbkim-mycel-platz]`, am Handy nur Lampen zum Aufklappen).
- Die übrigen Kanon-Module (01 … 23, 16, 16b-Wizard, noble) sind byte-gleich mit Sage.
- **Identität ist die der PWA:** `sbkim/spore.json` (im APK) ist byte-gleich die signierte Spore der PWA
  (Name „Private Brain", Endpunkt `…github.io/Privat-Brain/`, deren Schlüssel). `assets/siegel-inhalt.js`
  und `modules/rendezvous-init.js` tragen `nodeName: "Private Brain"` und den PWA-Endpunkt;
  `_CR.repo` heißt `Privat-Brain`. Die App erzeugt am Gerät eine eigene Identität → Spore passt nicht.
- Membran: im APK seit dem Bau `https://localhost` erlaubt (siehe oben) — erledigt.

### Aufgaben

1. **Entscheiden mit dem Nutzer:** feste Leiste oben (Sende-Prüfer-Bauart, kein Modul 17) **oder**
   Flieger mit Andocken oben (23-UI + 17). Beide müssen *verankern · minimieren · ausblenden* können.
   Vorschlag: wie die übrigen aktuellen Apps des Netzes — vorher dort nachsehen, welche Bauart sie heute tragen.
2. `23_rendezvous_ui.js` (und `23b`, falls Pflicht) byte-1:1 aus Sage, Drift-Guard-Pin, `net-widget.js`
   ablösen oder auf den Kanon zurückführen; Gerätename weiter per Glue (`rendezvous-init.js`).
3. **Eigener Knoten:** Name „Private Brain Pro", eigener Endpunkt/Beschreibung, **keine** PWA-Spore im APK
   (`prepare-web.mjs` nimmt `sbkim/spore.json` heraus); erste Spore am Gerät im Andock-Wizard.
4. Mit dem **Offline-Schalter** zusammenspielen: offline → Lampen und Fenster sagen „App vom Internet
   getrennt", kein stilles Scheitern.
5. Im Design von .16 bleiben (Kopf-/Symbolleiste aus `native-toolbar.js`), DE/EN wie der Kanon.
6. **Am Gerät messen:** andocken, minimieren, ausblenden, Neuladen, ein echter Knoten-Kontakt.
   Ob PBP als Knoten erreichbar ist, solange die App im Hintergrund liegt, ist offen (Android stoppt
   WebViews im Hintergrund) — benennen, nicht versprechen.

## Bauabschnitt 5: Vorbereitung für Viren-, Spam- und Scam-Schutz

### Nutzerwunsch (2026-10-20)

*„Vorbereitung für Virenscans innerhalb der App … verschiedene Virenscanner oder auch Virenmodelle …
muss immer aktualisiert werden. Auch Datei, Schadsoftware, Spams, Schutz und auch Scam-Schutz … vielleicht
auch über eine Hilfs-App. Ein Link zu einer Hilfs-App."*

### Was ehrlich gilt (aus Wissen, vor dem Bau nachsehen)

- Android gibt einer App **keinen** Zugang zum Virenscanner des Systems oder eines anderen Herstellers.
  Ein Scan in der App braucht eine **eigene** Prüfmaschine mit eigener, aktualisierter Datenbank.
- Der vorhandene Prüfkern (Auslieferungsprüfer) findet Täuschung (versteckter Text, Makros, getarnte
  Programme, KI-Anweisungen) — **keine Viren**. So weiter benennen.

### Bauweise: eine Scanner-Schnittstelle, Anbieter als Einschübe

Erst die **Schnittstelle** bauen, dann Einschübe. Jeder Einschub meldet: Name, Version,
**Stand der Datenbank (Datum)**, Ergebnis `befund · unauffällig laut <Name> · unbekannt · nicht geprüft`
— nie „virenfrei". Läuft im Quarantäne-Ordner (Abschnitt 1), nur auf Tipp oder nach Wahl automatisch beim
Abruf; Aktualisieren der Datenbanken achtet auf den Offline-Schalter.

| Einschub | was | Netz | zu klären |
|---|---|---|---|
| Fingerabdruck-Listen auf dem Gerät | SHA-256 gegen bekannte Schaddateien (z. B. MalwareBazaar von abuse.ch) | nur zum Aktualisieren | Lizenz, Größe, Update-Takt |
| Signatur-/Regelscan auf dem Gerät | YARA-Regeln oder ClamAV-Signaturen | nur zum Aktualisieren | ClamAV ist GPL (Verkauf!), Datenbank groß; Rechenzeit am Tablet messen |
| VirusTotal / MetaDefender | Fingerabdruck an ~70 Scanner; Hochladen nur mit Warnung | ja, auf Tipp | Bedingungen, Schlüssel je Nutzer, Einsatz in verkaufter App |
| Link-/Phishing-Prüfung | Mail-Links gegen Listen (Google Safe Browsing / Web Risk, URLhaus, PhishTank) | ja, nur die Adresse | Safe Browsing ist für nicht-kommerziell; für Verkauf Web Risk (kostenpflichtig) |
| Spam-/Scam-Hinweise | eigene Regeln am Mailkopf: `Authentication-Results` (SPF/DKIM/DMARC des Anbieters), Absender ⟷ Antwortadresse, ähnliche Domains, Linktext ⟷ Ziel, Druck-/Geld-Wendungen | nein | als Hinweis, nie als Urteil; Teile stecken schon im Prüfkern |
| **Hilfs-App** | „Mit Virenscanner-App prüfen": Datei per Teilen/„Öffnen mit" an eine installierte App (z. B. eines bekannten AV-Herstellers) | je nach App | ⚠ Datei verlässt dabei die Quarantäne — vorher deutlich sagen; Link zum Store nur als Empfehlung |

Reihenfolge: Schnittstelle + Spam-/Scam-Hinweise (ohne Netz) → VirusTotal-Fingerabdruck → Link-Prüfung →
Geräte-Datenbank (nach Größen- und Lizenzklärung) → Hilfs-App-Übergabe.

---

## Reihenfolge

1. Abschnitt 1 (Speicherort, Verschlüsselung, Anhänge, Wiederherstellen) — Nutzer: „das Wichtigste".
2. Abschnitt 2 (Bedeutungssuche) — nach der Größenmessung.
3. Abschnitt 3 (Sicherheitspaket); 3.3 kann mit 1.6 zusammen gebaut werden.
4. Abschnitt 4 (Mycel/Siegel: Kanon 23-UI, oben verankert, eigene Identität).
5. Abschnitt 5 (Scanner-Schnittstelle, dann Einschübe) — braucht den Ordner aus Abschnitt 1.

## Offen / nicht gemessen

- Nichts davon am Tablet gemessen; diese Sitzung hat nur gelesen.
- Ob `family-projekt.de` die App-Herkunft beliefert, wurde aus dem Behälter nicht erreicht (403 der
  Sandbox) — mit Modell im APK nicht mehr nötig.
- Google-Freigabe der App: Antrag läuft. ⚠ Für Gmail-Zugriff fremder Nutzer verlangt Google
  (aus Wissen, nicht nachgesehen) eine Prüfung der App, teils kostenpflichtig — vor Veröffentlichung klären.
