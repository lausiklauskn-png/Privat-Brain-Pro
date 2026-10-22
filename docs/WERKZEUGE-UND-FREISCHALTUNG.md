# Werkzeuge im App-Menü und Freischalt-Codes (Klaus 2026-10-22)

Klaus: *„Pinnwand, Such-Tool, Datei-Post und Kim-Sync … mit hinein … Dateien herunterladen und auch einfügen können
bei Private Brain Pro“* und *„die Freigabe für diese Tools soll mit einem Schlüssel passieren … jemand, der mir das
Passwort abkauft oder den Schlüssel, der kann diese Tools benutzen“*. Gewählt: **in der App mitgeliefert** und
**ein eigener Code je Käufer**.

## Bedienung

- **☰ → 🧰 Werkzeuge:** Pinnwand (Kimboard), Such-Tool (Kimseek), Kim-Sync, Datei-Post, Sende-Prüfer,
  Auslieferungsprüfer, In-and-Out-Book, FP-Videos, Workflow PDF (Link, frei). Gesperrte tragen 🔒; ein Tipp führt zu
  Einstellungen → „🔑 Werkzeuge freischalten“. Noch nicht eingebaute stehen mit „kommt bald“ da.
- **Werkzeug-Fenster:** öffnet das Tool im ganzen App-Fenster, „← Zurück zu Private Brain Pro“ schließt es.
- **Datei aus dem Werkzeug:** gibt ein Tool eine Datei heraus (Download), fragt die App „📥 In Private Brain übernehmen“.
  Die Datei geht durch dasselbe Einlesen wie „Dateien hinzufügen“ (Prüfung, Einordnung) unter `Werkzeuge/<Tool>/`.
- Auch das eingebaute **📌 Pinnwand-Fenster** öffnet sich nur mit Freigabe für „Pinnwand“.
- **Eigene Symbole (ab .28, Klaus 2026-10-22):** jedes Programm zeigt im Menü und im Freischalt-Kasten sein eigenes
  App-Symbol statt eines Emojis (`native/tool-icons/`, Quellen dort im README). Lädt ein Bild nicht, steht das Emoji da.
- **Schlichter Freischalt-Kasten (ab .28):** sichtbar sind nur die Werkzeuge (je eine Zeile: Symbol, Name, Stand),
  das Code-Feld und „Freischalten“. Keine Erklärsätze mehr.

## Herausgeber-Studio (nur Klaus)

**Versteckt (ab .28, Klaus 2026-10-22: „verborgen … 5 Klicks unten auf das Copyright-Zeichen“):** ganz unten in den
Einstellungen steht „© 2026“. **5× schnell darauf tippen** blendet das Studio ein (Meldung „🛠 Herausgeber-Studio
eingeblendet“), noch einmal 5× blendet es aus (`localStorage` `pb_studio_visible`). Ein Käufer sieht weder Studio noch
den Satz „Herausgeber-Schlüssel“. Die Passwort-Probe kommt trotzdem, denn sie hängt am Schlüssel, nicht an der Ansicht.

Einstellungen → 5× © → 🔑 Werkzeuge freischalten → 🛠 Herausgeber-Studio:
1. **Schlüssel anlegen** mit Studio-Passwort (mindestens 8 Zeichen). Der geheime Schlüssel liegt nur auf diesem Gerät,
   verschlüsselt (PBKDF2-SHA256 600 000 → AES-256-GCM, `localStorage` `pb_studio_v1`). Nie in Git, nie im Chat.
2. Den **öffentlichen Schlüssel** an Claude schicken. Er kommt in `native/license-keys.json` (nicht geheim). Ab der
   Version danach erkennt jede App die Codes.
3. **Code erstellen:** „Pseudonym des Käufers (wie beim Kauf angegeben)“, Werkzeuge ankreuzen, Studio-Passwort → `PBK1.<Daten>.<Unterschrift>`.
   Per Mail oder Nachricht schicken. Liste der erstellten Codes im Studio.
4. **Schlüssel-Sicherung kopieren** (`PBSTUDIO1.…`, mit dem Studio-Passwort verschlüsselt) und gut aufheben, z. B. im
   Tresor. „Schlüssel aus Sicherung holen“ stellt ihn auf einem neuen Gerät wieder her.
5. **🧠 Passwort-Probe (ab .27, Klaus 2026-10-22):** Etwa alle 28 Tage fragt die App beim Start „Kennst du dein
   Studio-Passwort noch?“ (nur auf einem Gerät mit Studio-Schlüssel, also nie bei Käufern). Richtig → nächste Probe in
   4 Wochen; falsch → Hinweis auf Sicherung/Ersatzschlüssel, beim nächsten Start wieder. Im Studio stehen das Datum der
   nächsten Probe und „Jetzt zur Probe eingeben“. Geprüft wird nur auf dem Gerät (`localStorage` `pb_studio_probe`).
6. **🧩 Ersatzschlüssel 3 von 5 (ab .27):** mit dem Studio-Passwort wird der geheime Schlüssel über JasonLib
   (`splitSecret`, Shamir) in 5 Teile `JT3v5-…` geteilt; 3 beliebige holen ihn zurück, auch ohne Passwort, 1–2 sind
   wertlos. Verteilen an getrennte Orte (Mail an sich selbst, privates Tresor-Repo, Papier, Familie, USB-Stick).
   „Passwort vergessen?“ im Studio bzw. „Mit 3 Ersatzschlüsseln zurückholen“ auf einem neuen Gerät: 3 Teile + neues
   Passwort. Liegt auf dem Gerät schon ein Studio-Schlüssel, müssen die Teile genau zu ihm gehören (gleicher
   öffentlicher Schlüssel), sonst wird nichts ersetzt. Gespeichert wird nur Datum und Fingerabdruck (`pb_studio_shares`),
   nie die Teile selbst.

## Technik

- `native/native-license.js` (`PBLicense`): Unterschrift BIP-340 Schnorr mit `modules/noble-secp256k1.js` (byte-1:1,
  dieselbe Datei wie im SBKIM-Netz) über SHA-256(`PBK1.<Daten>`). Daten `{v, id, n, t, d}`. Codes in `pb_license_codes`,
  bei jedem Start ohne Netz neu geprüft.
- Vertraut wird nur den Schlüsseln in `license-keys.json`. **Solange die Liste leer ist**, vertraut ein Gerät seinem
  eigenen Studio-Schlüssel (zum Ausprobieren); dann sind dort alle Werkzeuge frei. Steht Klaus' Schlüssel in der App,
  öffnet ein selbst angelegter Studio-Schlüssel nichts mehr (Probe).
- `native/native-tools.js` (`PBTools`): Menü, Werkzeug-Fenster (`iframe`, gleicher lokaler Ursprung), fängt
  `a[download]` mit `blob:`/`data:` ab (auch ohne Einhängen geklickt).
- `tools/native/apps.json` + `tools/native/vendor-apps.mjs`: Tools **unverändert** nach `apps/<dir>/` kopiert,
  Herkunft und SHA-256 jeder Datei in `apps/SOURCES.json`. Nur beim Verpacken (`prepare-web.mjs`) in `www/`: eigene
  CSP (mit `blob:`), `native/tool-gate.js` zuerst (kein eigener Service-Worker, läuft nur im App-Fenster mit Freigabe),
  Manifest-Link weg, `ALLOWED_ORIGINS` um `https://localhost`, pdf.js-Pfad von Modul 24 auf `/vendor/pdfjs/`.
- Probe `tools/native/test-tools.mjs` (43; ab .27 Passwort-Probe und Ersatzschlüssel; ab .28 eigene Symbole geladen, schlichter Kasten ohne Studio, keine abgeschnittenen Namen bei 360 px, 4× © nichts, 5× © Studio, Pseudonym-Feld, Käufer-App ohne Studio): Studio, falsches Passwort, Code, fremder Studio-Schlüssel, veränderter Code,
  Käufer-App, Neustart, echte Kimboard-/Kimseek-Seiten im Fenster, Datei-Übernahme, Seite außerhalb des Fensters.

## Grenzen (ehrlich)

- Eine App auf fremden Geräten lässt sich mit Fachwissen auseinandernehmen. Für normale Käufer ist es eine klare Sperre.
  Ein weitergegebener Code trägt das Pseudonym dessen, für den er gemacht wurde. Zurückziehen geht ohne Netz nicht.
  Der Satz stand bis .27 auch in der App; Klaus wollte ihn dort nicht (2026-10-22), hier bleibt er für uns.
- **Für die Verkaufsseite (Klaus 2026-10-22):** Käufer bitten, sich beim Bezahlen ein **Pseudonym** auszudenken und
  anzugeben. Genau das trägt Klaus im Studio ein; so steht kein echter Name im Code.
- Pinnwand, Such-Tool, Kim-Sync und Datei-Post brauchen für ihre eigentliche Arbeit Internet (Relais, Klaus' Server).
- Mikrofon in den Tools (Sprachnachricht, Spracheingabe) ist im App-Fenster nicht freigegeben; nicht gemessen.
- Optionale Teile, die eine fremde Adresse laden (Kimboard: freier KI-Richter über esm.run), sperrt die CSP.
- **Noch offen:** Kim-Sync (mit Datei hin und zurück), Datei-Post (Server muss `https://localhost` erlauben),
  Sende-Prüfer, Auslieferungsprüfer, In-and-Out-Book. FP-Videos und Workflow PDF als Link.
- Am Tablet nicht gemessen.
