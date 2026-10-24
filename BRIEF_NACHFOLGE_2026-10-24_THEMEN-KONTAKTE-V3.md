# Nachfolgebrief 2026-10-24: Themen, Kontakte mit Gesichtern, WhatsApp, V3

Dieser Brief ist der Plan für die nächsten Sitzungen. Er baut auf dem
[Designbrief](BRIEF_NACHFOLGE_2026-10-24_DESIGN.md) und auf Codex' Abgleich
[Ziel, Funktionen, Designstand](docs/ZIEL-FUNKTIONEN-DESIGNSTAND-2026-10-24.md) (PR #76) auf.

## Klaus' Auftrag (2026-10-24, sinngemäß)

1. Alle vier Entwürfe von Claude sind gut: **als wechselbare Themen, mit einem Knopf**.
2. Einen **Nachfolgebrief mit Plan** ins Repo legen, lesbar für andere Sitzungen:
   Verlinkung zu WhatsApp, Übernahme der WhatsApp-Statusbilder für bestehende Kontakte und das Übrige aus dieser Sitzung.
3. Den Plan **mit Codex' Plan abgleichen**.
4. Neues Repo **Privat-Brain-Pro-V3** (`https://lausiklauskn-png.github.io/Privat-Brain-Pro-V3/`):
   > „Es geht hier um eine 1:1 Kopie, die du mit dem neuen Design, den neuen Funktionen in Private Brain Pro V3
   > übernimmst. Du … baust nicht gleichzeitig an demselben Repo wie Codex. Codex macht das separat. Du baust Private
   > Brain Pro V3 eigenständig … und schaust bitte nach, ob die Funktionen, die Codex jetzt neu hinzugefügt hat, mit
   > übernehmen kannst, auch in das Design … so modern, wie Codex gerade baut. Du kannst etwas abweichen vom Design.
   > Deswegen ist es V3-Variante.“

## Aufteilung der Repos (verbindlich ab 2026-10-24)

| Repo | Wer baut | Was |
|---|---|---|
| **Privat-Brain-Pro** | **Codex** | App-Ziel, Funktionen, eigener Designweg (PR #76). Claude baut hier **nicht** am Code; nur Entwürfe und dieser Brief liegen hier (PR #75). |
| **Privat-Brain-Pro-V3** | **Claude** | 1:1-Kopie von Pro main `30c11ea` (ohne `signing/` und ohne Release-/Signier-Abläufe), darauf das neue Design Seite für Seite. Neue Funktionen aus Pro werden von Zeit zu Zeit herübergeholt und ins V3-Design gesetzt. |

Abgleich: Wer in V3 weiterbaut, liest zuerst Pros neueste Doku und offene Codex-PRs und notiert hier, was übernommen wurde.

## Stand nach dieser Sitzung

### Erledigt in V3: vier Themen mit Knopf (Schritt T0)

- **Knopf:** Malpalette als Strichsymbol **direkt hinter dem Zahnrad** in der Navigationszeile. Rechts oben ist der
  Platz des Siegels (`native/native-seal-place.js`, 152 px vom Rand); dort hätte der Knopf unter dem Siegel gelegen.
- **Auswahl:** Bisher · Klar · Petrol warm · Schiefer kompakt · Weich und luftig, mit Farbprobe und Haken, DE/EN/RU/PL.
  „Bisher“ ist das heutige Aussehen und bleibt **Standard, bis Klaus ein Standard-Thema wählt**.
- **Hell/Dunkel** bleibt der eigene Schalter im ☰-Menü und wirkt in jedem Thema (je Thema eigene Dunkelfarben).
- **Wahl bleibt** nach Neustart (`localStorage` `pb-look`); das Thema wird im `<head>` gesetzt, bevor etwas gezeichnet wird.
- **Was ein Thema ändert:** Farben, Rundungen, Schatten, Verlauf im Hintergrund, Schrift (Systemschrift, nichts aus dem
  Netz), die eigenen Petrol-Werte der Mail-Seite, flache Mail-Knöpfe ohne Glas, Vollton nur am Hauptknopf.
- **Was ein Thema noch nicht ändert:** den Aufbau. Emojis, die zweizeilige Leiste, lange Kontoadressen, die Zeile
  „… · Posteingang“ und Wortbrüche bleiben bis Schritt T1/T2 (unten). Die Anordnung bleibt beim Wechsel gleich,
  wie Codex es festhält.
- Dateien (V3): `assets/themes.css`, `assets/themes.js`, direkt in `index.html` eingebunden; so wirken die Themen auch auf
  der Web-Adresse, nicht nur in der Android-App. `prepare-web.mjs` setzt `native.css` davor. Service-Worker-Vorrat `v92`.
- Probe (V3): `tools/native/test-themes.mjs` (39 Prüfungen, in `npm run test:native-web`), u. a. Akzent je Thema hell/dunkel,
  Mail-Seite folgt, nur der Hauptknopf voll, 412 px ohne Querlaufen und frei vom Siegel, Neustart, vier Sprachen,
  unbekannter gespeicherter Wert fällt auf „Bisher“ zurück. Bilder: `PB_CAPTURE_DESIGN=1` →
  `docs/design/themen-2026-10-24/` in V3 (Mail-Seite, erfundene Daten).
- Einmal zur Probe auch in Pro gebaut: dort lief die ganze Kette `npm run test:native-web` grün. Danach wieder aus Pro
  entfernt, weil Pro Codex' Repo ist.
- **Ungeprüft am Gerät.** In keiner veröffentlichten App (Android .28, Windows .29). Kein Release ohne Klaus' Bitte.

## Abgleich mit Codex (PR #76)

| Thema | Codex | Claude | Ergebnis |
|---|---|---|---|
| Rolle von Outlook | Anregung und Vergleich, **keine Kopiervorlage**; eigene Gestaltung nach App-Zweck | Entwürfe hießen „wie Outlook“ | **Codex' Fassung gilt** (Klaus' Klarstellung). Die Entwürfe übernehmen Ordnungsprinzipien, keine Optik 1:1. |
| Themen | Klarblau, Graphit, Petrol, Nachtblau (Nachtblau nur dunkel) | Klar, Petrol warm, Schiefer kompakt, Weich und luftig, **jedes hell + dunkel** | Klarblau ≈ Klar, Petrol ≈ Petrol warm, Graphit ≈ Schiefer, Nachtblau ≈ Klar dunkel. Neu ist nur „Weich und luftig“. Eingebaut sind Claudes vier; Codex' Farbwerte bleiben in `vorschau.html` als Vergleich. |
| Standard-Thema | Empfehlung Klarblau, Nachtblau als dunkle Wahl | keins gesetzt | **Offen, Klaus entscheidet.** Bis dahin „Bisher“. |
| Reihenfolge | erst Weg **Sammeln → zuordnen → finden → Original öffnen** klären, dann Design Seite für Seite | Musterseite Mail zuerst | **Zusammengeführt:** Themen (T0) sind unabhängig und schon da. Der Umbau Seite für Seite (T2–T4) beginnt bei den Stellen dieses Wegs: Mail mit Anhang → Original → Prüfstand. |
| Senden-Symbol | mit „Brief abschicken, kein Papierflugzeug“ abgleichen | Brief mit Pfeil gezeichnet (`sent` im Entwurf) | Brief mit Pfeil wird das Senden-Symbol. |
| „Zusammenführen“ | in der Vorschau nur Demo, erst Bedeutung festlegen | nicht entworfen | Kein Bauauftrag, erst mit Klaus klären. |
| Kontaktfotos | eigener, noch zu prüfender Abschnitt | Plan K1–K4 unten | Gleiche Linie: erst Machbarkeit am Gerät, dann Bild. |

## Plan

Jeder Schritt: eigener Commit, eigene Probe mit Gegenprobe (die Probe muss rot werden, wenn das Alte zurückkommt),
vier Sprachen, hell und dunkel, alle vier Themen, Breiten 320–1280 ohne Querlaufen. Byte-1:1-Module bleiben unverändert.

### Design

| Schritt | Inhalt | Ergebnis für Klaus |
|---|---|---|
| T0 ✅ | Themen-Schicht und Knopf | erledigt, siehe oben |
| T1 | **Ein Symbolsatz** `native/native-icons.js` (`PBIcon(name)`) aus den Pfaden in `native-toolbar.js` und dem Entwurf (u. a. inbox, draft, outbox, sent = Brief mit Pfeil, spam, shield, move, flag, envOpen, users, clip, filter, sort, dicke Punkte ⋯). Tabelle Emoji → Symbol → Wort zum Abhaken. | Tabelle |
| T2 | **Musterseite Mail umbauen:** Bedienleiste oben in **einer Zeile** (Neue E-Mail als einziger Vollton-Knopf, dann Löschen, Archivieren, Verschieben, Spam, Antworten, Weiterleiten, Gelesen, Kennzeichnen, ⟳, ⋯), keine Wortbrüche (`white-space:nowrap`, Wörter am Handy als Hinweistext), **kurze Kontonamen** (T-Online, Gmail, WEB.DE, GMX, Yahoo, IONOS; Rest: Domain ohne Endung), Zeile „… · Posteingang“ entfällt, Ordnerspalte mit Mindestbreite, Befund als Marke „Symbol + Text“. Am Handy: Konto- und Ordner-Chip, Leiste nur mit Symbolen. | Vorher/Nachher 412 · 768 · 1280, je Thema |
| T3 | **Weg zum Original (Codex' Priorität):** in Mail-Anhang, Explorer und Suche klar zeigen „Original da · Original fehlt · nur Katalog/Mailtext · noch nicht geprüft“ als Marken. | Bilder der Marken |
| T4 | Suche · Explorer · Dateien hinzufügen · Einstellungen (drei Spalten wie die Referenz) · ☰-Menü (eigene Tool-Symbole bleiben) · Dialoge | je Seite Vorher/Nachher |
| T5 | Emoji-Wächter für umgebaute Dateien, Siegel/Mycel nur per CSS | Probe grün, Gegenprobe gefangen |

### Kontakte mit Gesichtern und WhatsApp (Klaus' Zusatzwunsch)

| Schritt | Inhalt | Grenze |
|---|---|---|
| K1 | **Foto aus dem Android-Adressbuch** in der Mail-Liste statt Buchstabenkreis. Neues Plugin `ProContacts` (`ContactsContract`), Berechtigung `READ_CONTACTS` erst auf Klaus' Tipp. Abgleich über die Absender-Adresse (googlemail = gmail). Ohne Foto oder ohne Erlaubnis: Buchstabenkreis wie bisher. Zuordnung und Vorschaubilder nur auf dem Gerät, verschlüsselt wie die übrigen Daten. | Android-Code, nur in CI baubar, Test am Tablet nötig. Windows: Buchstabenkreis. |
| K2 | **„In WhatsApp schreiben“:** Hat der Kontakt einen WhatsApp-Eintrag im Adressbuch (Kontotyp `com.whatsapp`), steht im Lesebereich und auf der Kontaktkarte ein Knopf, der `https://wa.me/<Nummer>` über die vorhandene sichere Browser-Übergabe öffnet. Ohne WhatsApp kein Knopf. | Nummer kommt aus dem Adressbuch, nicht aus der Mail. |
| K3 | **WhatsApp-Profil- und Statusbilder:** Klaus wünscht „aktualisierte Statusfotos“ für bestehende Kontakte. ⚠ **WhatsApp gibt Profil- und Statusbilder nach bisherigem Wissen nicht an andere Apps heraus**; es gibt keine offene Schnittstelle, und WhatsApps eigener Speicher ist für andere Apps gesperrt. Mitlesen über Benachrichtigungen oder Bildschirm wäre gegen WhatsApps Regeln und unzuverlässig, deshalb **nicht bauen**. | Muss Klaus **vor** dem Bau so gesagt bekommen, keine stille Ersatzlösung. |
| K3a | Was ehrlich geht, **zur Wahl für Klaus:** (a) das Foto, das im Android-Adressbuch steht (K1). (b) **Foto von Hand zuordnen:** ein Bild an Private Brain Pro teilen (Teilen-Empfang gibt es schon) → „Als Kontaktfoto für …“, nur lokal und verschlüsselt. (c) Aus der App das Android-Adressbuch zum Bearbeiten öffnen, damit Klaus dort ein Foto setzt; dann sehen es alle Apps. Kein automatisches Nachladen neuer Statusbilder. | Klaus entscheidet (a), (b), (c) oder Kombination. |
| K4 | Proben mit gestelltem Plugin (Foto da / kein Foto / keine Erlaubnis / WhatsApp da / nicht da), Gegenprobe, Android-Instrumentierung in CI. | Tablet: nur Klaus misst. |

Reihenfolge: T1 → T2 → K1/K2 (eigener Bauabschnitt nach der Musterseite) → T3 → T4 → T5. K3a erst nach Klaus' Wahl.

## Klaus' Antworten (2026-10-24)

1. Standard-Thema: **Klar**.
2. Kontaktfotos: **a (Adressbuch) und b (von Hand)**, nicht c.
3. V3 wird eine **eigene App**.

Umsetzung in V3: `BRIEF_NACHFOLGE_2026-10-24_V3-START.md` im Repo Privat-Brain-Pro-V3.

## Privat-Brain-Pro-V3: Stand und nächste Schritte

- Repo `lausiklauskn-png/Privat-Brain-Pro-V3`, angelegt 2026-10-24. Erster Commit: Kopie von Pro main `30c11ea`.
- Weggelassen: `signing/` und die Abläufe `android-release`, `windows-release`, `windows-gift-package`,
  `signing-identity`, `signing-tests`. Paketkennung noch wie Pro; vor einer installierbaren V3 eigene Kennung nötig (Frage 3).
- Enthalten: alle Designvorschläge (Claudes `mail-entwuerfe.html` mit Bildern, Codex' `vorschau.html`), die Themen (T0),
  dieser Brief und Codex' Abgleich.
- **Von Codex übernehmen (Funktionen und Gestaltung):** Codex' Vorschau ordnet die App nach dem Zweck in vier Bereiche
  **Finden · Dateien · Mail · Schreiben**, mit ruhigen Karten-Containern, Aktionsgruppen, kleinen Kategorienmarken und
  Verfügbarkeit des Originals. V3 nimmt diese Container-Ordnung in T2–T4 auf, mit den eigenen Themen. Neue Funktionen
  aus Pro-PRs (Stand 2026-10-24: #76 ist nur Doku, keine neue Funktion) werden geholt, sobald sie in Pro main sind.
- Nie Signier-Material, Schlüssel oder echte Daten nach V3 kopieren.

## Lehren dieser Sitzung

- **Feste Plätze anderer Elemente prüfen, bevor ein Knopf dazukommt:** Das Siegel rastet 152 px vom rechten Rand ein und
  hätte den neuen Knopf verdeckt. Gefunden hat es die Probe (Klick abgefangen), nicht das Ansehen.
- **Übergänge abwarten:** `body` blendet seinen Hintergrund in 0,4 s über; gleich danach gemessen zeigte er noch die alte Farbe.
- **Eine gleich starke Regel weiter unten überschreibt still:** Eine allgemeine `:root[data-look]`-Zeile am Ende hätte den
  Verlauf der Themen wieder abgeschaltet.
