# Private Brain — Sitzungs-Anker

**Kurz-Verfassung.** Netzweites steht in **Sage-Protokol**; hier steht nur, was eine
Sitzung wissen muss, **bevor** sie hier etwas anfasst.

## Was dieses Repo ist

**Private Brain** ist Klaus' **fokussiertes Zusammenführungs-Repo** (Entscheid 2026-07-16):
hier läuft alles zusammen, was ein **privates, offline betriebenes „zweites Gehirn"** ausmacht.

- **Die Box / der private Raum:** eine offline-fähige PWA, durch die man einmal **alle eigenen
  Daten** (Mails, Dokumente, Fotos, Notizen) laufen lässt. Sie liest jede Datei **einmal**,
  **signiert** sie, behält nur einen winzigen **Bedeutungs-Katalog** (Vektor + Steckbrief +
  Zeiger aufs Original) und lässt die **Originale unangetastet**. Danach: **semantische,
  kombinierende Suche** über gemischte Daten. Drei Vertrauens-Säulen: *liest nur · schlägt vor ·
  bewegt nichts.*
- **Herkunft:** das lauffähige Fundament ist **byte-kopiert aus Company-Brain** (v0.1) und für
  die **Privatperson** umgewidmet. Company-Brain und alle anderen Repos **bleiben unangetastet** —
  nur Private Brain wird gebündelt/gebaut.
- **Zugleich ein SBKIM-Endknoten:** eigene Identität, DB-Schublade `sbkim_privatbrain`,
  optionale server-lose Verbindung (Modul 23), Standard **aus** (offline-first).
- **Positionierung:** *„kein großes Unternehmen dahinter, in Heimarbeit gebaut"* — der
  Vertrauens-Keil für Menschen, die den großen Namen (Microsoft & Co.) nicht mehr trauen.

## Sprache, Befehle, Design

Seit dem Umbau vom 2026-10-19 sind Suche (Startseite), Dateien hinzufügen und Explorer
die drei Hauptseiten. Gemeinsame Navigation und lokale Kopienablage stehen in
`assets/workspace.js`/`.css`. Das bestehende Design und die vier Sprachen bleiben
verbindlich. Kopien werden nur nach Wahl eines lokalen Ablageordners geschrieben;
Browser ohne Ordner-API dürfen keinen dauerhaften Gerätezugriff vortäuschen.
Details und Prüfgrenzen: `docs/BRIEF_2026-10-19_suche-ablage-explorer.md`.

Das ergänzende **Postfach** verwendet den Sende-Prüfer-Aufbau in
`assets/mail-workspace.js`/`.css`. Modul 25 und die neuen Anhang-/Format-/HTML-Prüfer
sind bytegleich kopiert und gepinnt; nie hier abwandeln. Lokale Ordner sind keine
IMAP-Ordner, Export ist kein Versand, Vormerken kein Senden. Die zusätzliche optionale
Anbindung in `assets/live-mail.js`/`mail-service/` spricht dagegen echte IMAP-/SMTP-Server
über einen privaten HTTPS-Dienst an (Hetzner, Telekom). Sie ist opt-in, ohne Konten
standardmäßig getrennt; Kontozugangsdaten niemals in Git, localStorage oder Logs.
Betrieb und Grenzen: `docs/MAIL-DIENST.md`. Nach unklarem Versandresultat niemals
automatisch wiederholen; die serverseitige Kennung bleibt dauerhaft gespeichert. Beim KI-Weg nur den
verdeckten Text und ausschließlich den Schlüssel des ausgewählten Anbieters
weitergeben; die Zuordnung bleibt lokal. Gegenprobe:
`python3 tools/gegenprobe-mail-workspace.py` (nur Wegwerfkopien).

- Doku auf **Deutsch**, Code-Bezeichner auf **Englisch**. Datum `YYYY-MM-DD`.
- **UI-Sprachen:** Deutsch · English · Русский · Polski (DE/EN/RU/PL).

```bash
npm install     # einmalig: playwright-core (Chromium ist im Environment vorhanden)
npm test        # Beweis: Drift-Guard (8 Module byte-1:1) + 6 headless e2e-Suiten
npm run serve   # python3 -m http.server 8000  → http://localhost:8000/
```

## Design-Vorgabe (Klaus 2026-07-16)

- **Optik angelehnt an das Warenwirtschafts-Dashboard** von Perfect-Skin-Fashion
  (`warehouse.html`) + die Design-Sprache von Alis-Moderaum: dunkle Karten, KPI-Kacheln
  (`.tile`, Regenbogen-Kante), Emoji-Tab-Leiste, Status-Pills, `data-theme` am `<html>`.
- **Nur** Hell/Dunkel-Umschalter (zwei Themes) **+ Hard-Reload-Knopf** — kein weiterer
  Design-Umbau ohne Auftrag.
- **Warenwirtschaft als Ordnungs-Metapher:** jede Datei = ein „Artikel" (Pfad, Kategorie,
  Status neu/gepflegt/archiviert, Tags), jede Sortier-/Pflege-Aktion = ein **Journal**-Eintrag.

## Was hier leicht kaputtgeht

- **Kopieren, nicht klonen.** Die byte-1:1 übernommenen Module
  (`modules/01,02,03,04,05,05b,23,noble-secp256k1`) werden **nicht abgewandelt** — der
  Drift-Guard (`tools/drift-guard.mjs`, Teil von `npm test`) wacht per SHA-256.
  Reift ein Modul, wird es **in Sage gepflegt und neu kopiert**. App-eigener Klebstoff
  (`rendezvous-init.js`, `index.html`) ist frei.
- **DB-Suffix `privatbrain` nie ändern** — geteilter Origin auf GitHub Pages, sonst
  kollidiert der Datenbestand mit Geschwister-Apps.
- **Der Gerätename** wird vom app-eigenen Glue ins Verbinden-Panel gehängt — hier
  `rendezvous-init.js`, **nie** in eine byte-kopierte Panel-Datei.
  Regel: [NETZWEIT § 2](https://github.com/lausiklauskn-png/Sage-Protokol/blob/main/docs/NETZWEIT.md).
- **Echte Krypto.** AES-256-GCM / PBKDF2-SHA256 600k (WebCrypto), Ed25519
  (`node:crypto`). Das semantische Modell ist bis zu Klaus' Browser-Lauf klar als
  Stub markiert, wo nötig.
- **Offline.** Keine CDNs, keine Laufzeit-Abhängigkeiten im Browser. Fremde Origins
  (bewusst freigeschaltete EU-KI) nur nutzer-ausgelöst.

## Stufen-Fahrplan (Klaus 2026-07-16, alle bestätigt)

| Stufe | Was | Stand |
|---|---|---|
| 0 | Fundament aus Company-Brain kopiert + umgewidmet + Dashboard-Optik + DE/EN/RU/PL + Hell/Dunkel + Hard-Reload | in Arbeit |
| 1 | Verschlüsselung des Katalogs/privater Texte (JasonLib-Tresor / Modul 20) | geplant |
| 2 | **Mail-Import** (Gmail-Takeout `.mbox`/`.eml`, offline) — der Unterschied zu NAS | geplant |
| 3 | Bild-Verstehen-Stufe (Bild→Text→Sinn, Late-Fusion; Florence-2 via Transformers.js) | geplant |
| 4 | Kombinierende Mehrschritt-Suche (Urlaub → ähnliche Orte → Reisebüro-Angebot) | geplant |
| 5 | Selbstlernende Sortierung aus Korrekturen (Classification-by-Retrieval, kein Training) | geplant |
| 6 | Optionale Freunde-Verbindung server-los (Modul 23, Default aus) | geplant |
| 7 | Später: echte Offline-Box (lokales Relais + lokales Modell + lokaler Richter-Slot) | geplant |

## Test & Ehrlichkeit über den Zustand

- **Headless `npm test`** bestätigt die Motor-Logik — unser Beweis.
- Die **App** ist erst „grün", wenn **Klaus sie im Browser angesehen** hat. Solange das
  aussteht: ehrlich **„ungeprüft, wartet auf Klaus' Browser-Lauf"**.
- **Hard-Reload** nach jedem Pull — Service-Worker und HTTP-Cache sind hartnäckig.
- **Plan-vor-Code:** erst Pflichtlektüre, dann ein kurzer Plan an Klaus, bevor größere
  Bauten starten. Gibt Klaus ausdrücklich einen Freibrief, entfällt das im
  freigegebenen Umfang. **Keine stillen Workarounds.**

## Branch

Entwicklung auf dem **für die Sitzung vorgegebenen Branch** (steht im ersten Prompt).
Ein Commit pro abgegrenzter Aufgabe, sprechende Nachricht auf Deutsch.

> Bis 2026-08-22 stand hier ein fest verdrahteter Branch-Name aus einer alten
> Sitzung. Er stand gegen den Branch, den die Sitzung tatsächlich vorgegeben
> bekommt — wer der Datei folgte, pushte ins Leere.

---

## 🌐 DAS MYCEL-FENSTER SPRICHT DEUTSCH UND ENGLISCH (Klaus 2026-09-16)

Klaus: *„Private Brain soll zweisprachig werden … der Zweisprach-Modus für Mycel
und für das Siegel."*

**Das Siegel war schon zweisprachig.** `modules/16_siegel.js` ist byte-1:1 aus Sage
und trägt seit dem Modul-15/16-Rollout eine eigene `TEXTE.en` — ebenso 15 und 17.
Nachgemessen, nicht angenommen:

| Modul | byte-1:1 mit Sage | eigene EN-Tabelle |
|---|---|---|
| 15 Membran · 16 Siegel · 17 Widget | ✔ | ✔ |
| 23 Rendezvous | ✔ | — (trägt keine Anzeigetexte) |

**Offen war das Mycel-Fenster** — `modules/net-widget.js`, 838 Zeilen app-eigener
Klebstoff, **null** Übersetzungs-Treffer. Es trägt jetzt dieselbe Mechanik:
schlüssellos, der deutsche Satz IST der Schlüssel, **98 Einträge**.

⚠ **WARUM EINE EIGENE TABELLE.** Die Kanon-Module sind byte-1:1-Kopien, ihre `TEXTE`
sind modul-intern. Modul 16 hat aus demselben Grund eine eigene. Dieses Fenster ist
app-eigen — seine Sätze gehören ihm.

### ⚠ DER FUND, AUF DEN ES ANKAM: das Panel wird beim LADEN gebaut, nicht beim Öffnen

`T()` wirkt in dem Augenblick, in dem ein Text **entsteht**. Wer danach die Sprache
umschaltet, bekommt die alten Sätze. **Gemessen im echten Browser:** mit
`<html lang="en">` nach dem Laden stand das Fenster **vollständig auf Deutsch** —
obwohl Tabelle und `T()` tadellos waren.

⚠ **EIN WÄCHTER AUF DIE TABELLE HÄTTE DAS NICHT GESEHEN.** Er liest den Quelltext;
hier ging es um den Schirm. Gefunden hat es die **Browser-Hälfte** der Probe.

**Was jetzt gilt:** ein `MutationObserver` auf `<html lang>` mountet das Fenster über
**dieselbe** `mountFlying()` neu. Ein zweiter Nachtrage-Weg wäre eine zweite Fassung
derselben Beschriftungen, und zwei Fassungen laufen auseinander. Getippte Frage und
Gerätename werden gerettet; Auf/Zu, Lage und Erklär-Zustand liegen im `localStorage`,
die Verbindung lebt in Modul 23 — nichts davon wird angefasst.

### ⚠ UND DIE RETTUNG HAT PROMPT EINEN DEUTSCHEN SATZ ZURÜCKGEHOLT

Die gerettete Statuszeile ist selbst übersetzt. Wörtlich hinübergereicht stand
„Noch nicht verbunden." mitten in der englischen Oberfläche — **genau die halb
übersetzte Tafel**, gegen die alles hier gebaut ist. Gefangen hat es der Wächter
„KEIN deutscher Tabellen-Satz bleibt stehen", nicht das Nachdenken. Sie wird jetzt
erst **nach Deutsch normalisiert** (`nachDeutsch()`) und dann neu übersetzt — das
trägt **beide** Richtungen.

⚠ **BENANNTE GRENZE:** eine Zeile aus Bruchstücken **und** einem Knoten-Namen
(`✓ Antwort von „Kimboard" — siehe unten.`) steht in keiner Tabelle und behält ihren
Wortlaut bis zur nächsten Aktion. Sie zu zerlegen hieße raten.

⚠ **BENANNTE GRENZE: die App kennt VIER Sprachen, der Kanon zwei.** Bei `lang="ru"`
und `lang="pl"` fällt das Fenster — wie Modul 15 und 16 — fail-soft auf **Deutsch**
zurück, nicht auf Englisch. Das ist die Entscheidung des Kanons; sie hier anders zu
treffen hieße, dass das Fenster etwas anderes spricht als das Siegel daneben.
**In beide Richtungen bewacht.**

### ⚠ Zwei Fehler im eigenen WERKZEUG, keiner im Code

| Was | warum es nichts maß |
|---|---|
| `[^,]*` im Umschließ-Muster | **die Klasse überspringt Zeilenumbrüche.** Ein gieriger Treffer verschluckte mehrere Zeilen und übersprang die Stellen darin — 14 Beschriftungen blieben unübersetzt, darunter der ganze Erklär-Absatz des Fensters. Gefangen hat es der Verwaisten-Wächter |
| die Anker-Prüfung der Gegenprobe | sie zählte den Anker **nach** dem Eingriff. Ein Ersatztext darf den Anker enthalten (Einfügungen tun das) — zwei tadellose Fälle meldeten sich als „toter Anker". Gemessen wird jetzt, **ob sich die Datei wirklich geändert hat** (PWA-Toolpoint-Lehre) |

### Geprüft

```bash
node tools/e2e-netwidget-sprache.mjs          # echter Browser, DE · EN · EN→DE · RU
bash tools/gegenprobe-netwidget-sprache.sh    # Wegwerf-Kopie, node_modules verwiesen
```

Zuletzt gemessen (2026-09-16): **17 grün · 0 rot** · Gegenprobe **9 gefangen ·
0 durchgerutscht · 0 aus falschem Grund · 0 tote Anker**. Beide Rückgabewerte
**direkt** gelesen, nicht hinter einer Pipe.

✅ **`npm test` LÄUFT SEIT DEM 2026-10-13 WIEDER BIS ZUM ENDE.** Hier stand:
*„`tools/e2e-siegel.mjs` hat vier vorbestehende Rote (Andock-Wizard-Injektion) … die
Kette hängt an `&&`, deshalb laufen die drei Proben dahinter gar nicht."*

**Die Ursache lag in der Probe, nicht im Code.** Seit A18 (#87, 2026-09-14) legt der
Kanon-Wizard (`assets/sbkim-andock-wizard.js`) seine Elemente als `sbkim-si-*` an.
#87 hat in der Probe nur das Präfix der vier Schritte (`sbwiz-`) nachgezogen; die fünf
Element-Kennungen (`pb-ident-open`, `pb-semantik-block`, `pb-semantik-resign`,
`pb-schutz-block`, `pb-ident-wizard`) blieben stehen. Der Wizard war da, die Probe sah
ihn nicht. *Ein Umzug macht jeden Wächter tot, der auf die alte Stelle zeigt.*

Gemessen: `e2e-siegel` **16 bestanden · 0 fehlgeschlagen**. Von Hand gegengeprüft in
einer Wegwerf-Kopie: ohne die Wizard-Zeile werden genau die vier Zeilen rot, ohne den
Semantik-Block nur dessen eine. `npm test` gibt **0** zurück; die drei Pinnwand-Proben
laufen mit (57 · 21 · 15 grün) — direkt gelesen, nicht hinter einer Pipe.

⚠ **Cache-Bump:** `net-widget.js` steht im Vorrat von `sw.js` → `CACHE` v63 → **v64**,
**gegen `origin/main` geprüft**, nicht gegen die eigene Datei (NETZWEIT § 3a: zwei
Sitzungen haben schon einmal dieselbe Nummer vergeben).

## Netzweit — gilt in jedem Repo, steht in Sage

Freibrief zum Selbst-Mergen · Gerätename im Verbinden-Panel · frisch von
`origin/main` vor jeder Arbeit · Ton (Klaus ist kein Programmierer: Deutsch,
Einzelschritte, keine Terminal-Kommandos wo ein Knopf reicht) · kein PII ·
Ehrlichkeit: **[`Sage-Protokol/docs/NETZWEIT.md`](https://github.com/lausiklauskn-png/Sage-Protokol/blob/main/docs/NETZWEIT.md)**

Verbindliche Verträge: **[`INTERFACES.md`](https://github.com/lausiklauskn-png/Sage-Protokol/blob/main/docs/INTERFACES.md)**. Die Fallen beim
Abzweigen und Veröffentlichen: **[`LEHREN.md`](https://github.com/lausiklauskn-png/Sage-Protokol/blob/main/docs/LEHREN.md)**.

```bash
git fetch origin --quiet && git checkout -B <branch> origin/main
git push -u origin refs/heads/<branch>:refs/heads/<branch>
git diff --stat origin/main origin/<branch>     # leer = der PR wäre leer
```

> Die alte Fassung dieser Datei steht vollständig in
> [`docs/archiv/CLAUDE-2026-08-22.md`](docs/archiv/CLAUDE-2026-08-22.md).


## 🛡 Prüfliste vor dem KI-Richter (Sage Bau 04.J, 2026-10-14)

Modul 04 kommt neu aus dem Kanon (Sage #1082). Der Richter prüft die Suchfrage und jede fremde Antwort mit der Prüfliste (`pruefer-mail.js`). Fehlt die Liste, läuft er nicht. Eine Antwort, in der eine Anweisung an eine KI steht, geht nicht an die KI. Sie bekommt „gefahr“ und `ausgeschlossen: "ki-anweisung"`.
`modules/pruefer-mail.js` ist neu. Die Datei ist byte-1:1 und im Drift-Guard gepinnt; `index.html` lädt sie direkt nach 04, und sie steht im Vorrat. Gemessen: `npm test` Rückgabe 0; im Browser ist `prueflisteGeladen` true. ✅ Das Mycel-Fenster ist seit Sitzung 2 gemessen (Abschnitt unten). Hier stand: *„Im Code nachgesehen, nicht im Browser gefahren: das Mycel-Fenster zeigt einen ausgeschlossenen Treffer mit ⚠️ (sicherheit „gefahr“) und der Begründung.“* Cache v70. Am Tablet nicht gemessen.

## 🧽 Reinigung und Prüfung vor der KI (Klaus 2026-10-14, Sitzung 2 von 4)

Vorbild sind Workflow PDF #112/#113 und die Rezeptbücher (Klaus' Antworten dort: „Seiten als Bild“, „einmal anhalten“).
Privat-Brain hat **vier eigene KI-Wege**. Bis hierher ging dort alles ungeprüft hinaus:

| Weg | vorher | jetzt |
|---|---|---|
| 🖼 Bild-Beschreibung (Mistral pixtral) · Mistral OCR · Google Vision | ein Foto bis 1024 px ging als **Original** hinaus, samt EXIF/GPS | immer **neu gezeichnet** (`KiReinigung.bildOhneMeta`); klappt das nicht, geht **nichts** hinaus |
| PDF ohne Textebene → Mistral OCR (beim Einlesen) | das **ganze PDF roh** | Seiten mit pdf.js gezeichnet (300 dpi), versteckter Text in der Kopie zugedeckt, Bilder hinaus; **einmal anhalten je Einlese-Lauf** („Ohne ihn senden“/„Abbrechen“), Vermerk `kiEntfernt` am Eintrag |
| 🔗 KI zu einer Datei (Mistral Chat) | Datei-Text ungeprüft | PDF-Text aus pdf.js **ohne** versteckte Stücke (Halt „Versteckten Text gefunden“); Anweisung an eine KI im Text → **einmal anhalten** („Trotzdem senden“/„Abbrechen“); Systemkanal nennt den Text DATEN |
| 📌 Pinnwand-Richter (Fragen/Antworten von Fremden) | ungeprüft | Block `RICHTER-PRÜFUNG` wie Kimboard #150: ohne Liste kein Richter, Frage mit Anweisung wird nicht gesendet, Antwort mit Anweisung steht mit „⚠ nicht an die KI“ da |

Dazu im **Mycel-Fenster**: ein Treffer, den Modul 04 ausschließt, steht jetzt ausdrücklich mit „⚠ nicht an die KI“ und Begründung da (vorher nur ⚠️), DE/EN in der Tabelle.

- `modules/reinigung.js` ist **byte-1:1 aus Workflow PDF** (`assets/reinigung.js`, gepinnt im Drift-Guard). `modules/ki-reinigung.js` ist app-eigener Klebstoff und steht **identisch in Company-Brain** — dort pflegen heißt hier nachziehen.
- pdf.js kommt von `/Workflow-PDF/vendor/pdfjs/` (dieselbe Adresse wie bei den Rezeptbüchern). Lädt es nicht, geht kein PDF an Mistral OCR, und das 🔗-Fenster sagt „versteckter Text im PDF wurde nicht geprüft“.
- ⚠ **Benannte Grenzen:** nur die ersten 10 Seiten · Text über einem Foto/über sichtbarer Schrift bleibt · schräger Text wird nicht beurteilt · die Prüfliste sucht feste Wendungen · Halt-Texte nur DE/EN (RU/PL zeigen Deutsch) · der Mail-Import hat keinen eigenen KI-Weg (seine Anhänge gehen durch denselben `readContent`).
- Probe `tools/e2e-ki-reinigung.mjs` (in `npm test`, KI gestellt, braucht den Workflow-PDF-Klon, `WFPDF_KLON`; ohne → Rückgabe 2) · Gegenprobe `node tools/gegenprobe-ki-reinigung.mjs` (Wegwerf-Kopie; `NUR_ANKER=1`, `NUR_FALL=…`).
- ⚠ Beim Bau gefunden, nicht im Code, sondern in der Probe: ein PDF aus pdf-lib liest der eigene Extraktor nicht — es ging deshalb beim Einlesen an die Texterkennung, und der Halt wartete auf einen Tipp. Das ist richtiges Verhalten; die Probe liest das PDF für den 🔗-Fall ohne Schlüssel ein.
- Gemessen 2026-10-14: `e2e-ki-reinigung` **42 grün · 0 ROT**, `npm test` Rückgabe 0. Gegenprobe (15 Fälle, Wegwerf-Kopie): erster voller Lauf **14 gefangen · 1 durchgerutscht** — „Pinnwand schickt alle Antworten“. Der Wächter dazu las nur den Quelltext, und die Zeile `gesendet.map(…)` blieb bei der Sabotage stehen: **blind**. Ersetzt durch einen Aufruf von `judgeView` in Node mit gestelltem Richter; der Fall danach einzeln: **gefangen**. Company-Brains eigene Verdrahtung: 5 Fälle von Hand in einer Kopie, **5 gefangen**.
- ⚠ Nicht gemessen: am Tablet, mit echten Dokumenten, mit echter KI.
- Cache v71.

### ✅ „Versteckter Text im Seitenbild zugedeckt“ ist bewacht (Sitzung 5, 2026-10-14)

Hier stand als benannte Grenze: *„kein Gegenprobe-Fall für „versteckter Text wird im Seitenbild zugedeckt“ (weißer Text auf Weiß sieht zugedeckt gleich aus).“* Der Satz stimmt für weißen Text. Gemessen wird deshalb an der **winzigen, dunklen** Schrift (1 pt schwarz) aus Fall B: im Seitenbild, das an Mistral OCR geht, zählt die Probe an genau deren Stelle die dunklen Bildpunkte. Ein Selbst-Riegel zeichnet dieselbe Seite ohne Zudecken; dort müssen es mehr als 3 sein, sonst misst die Zeile nichts.
Gemessen: ohne Zudecken 19 dunkle Bildpunkte, gesendet 0. Gegenprobe-Fall `B: versteckter Text bleibt im Seitenbild` nimmt `R.zudecken` weg und wird **gefangen** (gesendet 20). `e2e-ki-reinigung` 44 grün · 0 ROT. Weißer Text auf Weiß bleibt so unmessbar wie vorher; das ist jetzt eine Grenze der Messung, nicht mehr eine Lücke im Schutz.

## ⬇ Installieren-Knopf (2026-10-18, Klaus: „unter Einstellungen, Installier-Button hinten“)

`assets/installieren.js` ist byte-1:1 aus Sage-Protokol (SHA-256 `e0644084…c3`) — nie hier abwandeln. Der Knopf steht im
Reiter ⚙️ Einstellungen im letzten Kasten `#install-box` hinten (`data-in`); als installierte App verschwinden Knopf und
Kasten. Überschrift und Satz tragen `installH`/`installP` (DE, EN; RU und PL fallen auf Deutsch zurück). ⚠ `data-i18n`
nie an den Kasten selbst: `applyI18n` setzt `innerHTML` und nähme den Knopf weg. Der Knopf spricht DE/EN nach `<html lang>`.
Im Vorrat (`?v=1`), Cache v82. Gemessen im Browser: sichtbar als letztes Element (auch nach Umschalten auf EN), als App weg,
Meldung lesbar, `getInstallabilityErrors` leer, App-Id `/index.html` (kein `id` im Manifest). `npm test` grün (mit
`WFPDF_KLON`). Am Tablet nicht gemessen.

## ⬇ Installieren auch oben in der Kopfleiste (Klaus 2026-10-18)

Klaus: *„da, wo der Installationsbutton in den Einstellungen zu finden ist, vermutet keiner, dass er die App installieren
kann … setze den Installationsbutton oben in die Navi-Leiste zusätzlich.“* Dieselbe Datei `assets/installieren.js`
(unverändert, Sage `e0644084…c3`) setzt jetzt zwei Knöpfe: `data-vor="install-platz"` in der Kopfleiste vor 🌙 und
weiter `data-in="#install-box"` in den Einstellungen. Als installierte App sind beide weg.
`#install-platz` (gleiche Klasse `iconbtn`, unsichtbar) hält den Platz frei, bis der Knopf davor steht; danach und als App
blendet CSS ihn aus. Bis 760 px nur ⬇ (Name im title/aria-label), bis 400 px rückt `.tools` enger (gap 5 px, Sprachknöpfe
6 px, Symbolknöpfe 34 px). Gemessen im Browser (Kopfhöhe vorher → nachher): 320 px 251 → 241 · 360 px 205 → 202 ·
412 px 205 → 205 · 1280 px 75 → 75, kein Querlaufen, CLS wie vorher; als App beide weg; Tipp ohne Angebot → Meldung
(Kontrast 4,9); `getInstallabilityErrors` leer. Ohne die enge Leiste bekam 360 px eine zweite Reihe (205 → 251).
Cache `private-brain-v83`. `npm test` grün (mit `WFPDF_KLON`). ⚠ Am Tablet nicht gemessen.

## Pro-App: Stand 2026-10-19

Dieses Repository ist jetzt **Privat-Brain-Pro**, die unabhängig kopierte Grundlage
für die native App. Die vorherigen Abschnitte dokumentieren das geerbte Webprojekt;
die PWA im anderen Repository bleibt unangetastet. Android/Capacitor-Konfiguration
liegt unter `android/` und `capacitor.config.json`; `npm run sync:android` erzeugt
nur das explizit ausgewählte öffentliche Webpaket. Details: `docs/ANDROID.md`.
Geschützte Module bleiben unverändert. Native Brücken nur für notwendige, eng
begrenzte Operationen und nur für den lokalen App-Ursprung zulassen.

Freibrief des Nutzers gilt: selbstständig implementieren, prüfen, committen und bei
erfolgreichen relevanten Prüfungen zusammenführen. Nicht nach einer bloßen
Ankündigung stoppen; nur konkrete externe Voraussetzungen erfordern seine Aktion.
Kein eigener Desktop-PC beim Nutzer voraussetzen. Keine Geheimnisse oder
Signierschlüssel in Git oder Chat; Produktion und Vorschau getrennt signieren.


## Helles Pro-Icon (Nutzerwunsch 2026-10-19)

Der Nutzer hat ausdrücklich eine helle Pro-Variante des Icons beauftragt: glänzende
3D-Bubbles und Leuchtverbindungen beibehalten, grauen Hintergrund durch helles
Elfenbein ersetzen. Das betrifft Header-, App- und Installationsicons ausschließlich
in diesem Pro-Repository. Die ältere Regel „Original-Icons nie überschreiben“ wird
für diese gewünschte Pro-Ableitung entsprechend konkretisiert; die PWA bleibt
unverändert. Vorlage: `artwork/private-brain-pro-light.png`, technische Größenexporte
über `node tools/native/export-pro-icons.mjs`. Adaptive Android-Icons verwenden
auch außerhalb des Motivs den hellen Hintergrund. Bestehenden Hell-/Dunkelmodus
der Oberfläche weiterhin erhalten.

## Native Mailarbeit für Vorschau .4 (2026-10-19)

`ProMail` ist der enge Android-Adapter, `native/native-mail.js` bindet ihn vor dem
bestehenden `assets/live-mail.js` ein. Passwörter nur im nativen Dialog; keine
Dienst-Token für direkte Geräteverbindungen. Konten/Entwürfe/Versandnachweise
AES-GCM/Keystore, keine stillen Ersatzschlüssel. Unklaren SMTP-Ausgang niemals
automatisch wiederholen. Die .2-APK hat noch den alten Serverdialog. Stand und
Prüfgrenzen: `docs/NATIVE-MAIL-ARCHITEKTUR.md`, `docs/PRUEFSTAND-ANDROID.md`.

## Veröffentlicht: direkte Geräte-Mail in Vorschau .4

PR #3 ist zusammengeführt, App-Quellstand a3f6051d8946c411449936bf59a1c86e12435fdc.
Test-APK v0.1.0-preview.4 ist öffentlich; kein Dienst-Token/Termux für native Mail.
Vollständige CI 39323175775 und signierte Updateprobe 39324803227 bestanden.
Telekom-Anmeldung und Abruf sind inzwischen vom Nutzer bestätigt. Details und
Prüfsumme: `docs/PRUEFSTAND-ANDROID.md`. Vorschau-Schlüssel außerhalb von Git;
Langzeitbackup/Produktion weiterhin gesondert absichern, keine Geheimnisse erfragen.


## Originalansicht und Fensterfläche (Nutzerwunsch 2026-10-19)

Der Nutzer bestätigt direkte Telekom-Anmeldung und Nachrichtenabruf in .4.
In .5: Original-HTML/CID-Bilder getrennt von Katalogtext, ausschließlich im
skriptfreien Sandbox-Frame mit eigener CSP. Original-MIME und Keystoreformat
bleiben unverändert. Keine `allow-scripts`-/`allow-same-origin`-Freigaben für Mail.
Externe HTTPS-Bilder auf ausdrücklichen Nutzerwunsch sichtbar, abschaltbar.
Das native Fensterlayout füllt alle Seiten ohne 1040-px-Grenze. Postfach und
Explorer besitzen scrollbare Bereiche wie Sende-Pruefer; OS-Fensterknöpfe bleiben.
Kontowerkzeuge im Menü „Weitere Aktionen“, rechtliche Fußtexte in Einstellungen.
Schutzmodule/Original-PWA unverändert. Prüfnachweise: docs/design/mail-preview5/.


## Veröffentlicht: Vorschau .5

Signierte Originalansicht-/Fensterlayout-APK v0.1.0-preview.5 ist öffentlich.
Quellstand 3ce818c0c4f02813ec925b665d55a3743af051b0, derselbe Git-Baum wie
vollständig geprüfter f327154c8d8e78214858bc131c85097053500828. CI 39331444809:
10 Android-Fälle ohne Fehler/Überspringen. Signierte .4→.5-Updateprobe und Upload
39332888607 erfolgreich; direkter Download HTTP 200 und SHA256 geprüft.
Bestehende App aktualisieren, nicht deinstallieren. Echter Telekom-Abruf bestätigt;
neue HTML-Ansicht und Update mit gespeicherten Konten durch Nutzer noch prüfen.
