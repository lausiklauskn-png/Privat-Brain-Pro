# Abschluss Sitzung 3 (2026-10-26) – ⓘ-Klapptexte und Einstellungen

Punkte **7, 9a, 9b, 9d** der [Sammlung](SAMMLUNG.md). Gilt für alle sechs Varianten (gemeinsamer Webteil je App).

## Umgesetzt

| Punkt | Was | Pro | V3 |
|---|---|---|---|
| 7 | Jeder Erklärtext ist ein Klapper mit ⓘ: ein Tipp schließt, ein zweiter öffnet. Der Zustand bleibt gespeichert, auch nach Neustart; wer nie etwas einstellt, sieht ihn **offen** | ✔ (vorher anfangs zu, nicht gemerkt) | ✔ (neu; ersetzt die „?“-Knöpfe bei Dateien hinzufügen) |
| 7 | Kategorien: „Neu ordnen – Kopie in einen neuen Ordner …“ mit ⓘ; V3s „Ein Vorschlag, wie deine Dateien …“ mit ⓘ in der Leiste neben dem Anordnungs-Knopf | ✔ | ✔ |
| 7 | Doppelte: V3s langer Erklärtext oben mit ⓘ in der Knopfzeile (Pro hatte schon ein ⓘ) | – | ✔ |
| 9a | Pros ⓘ rechts an jedem Einstellungsblock, jetzt auch in V3; V3 behält seine Reihenfolge der Blöcke | ✔ | ✔ |
| 9b | „Schutz vor Viren, Spam und Betrug“: Erklärung, „Wichtig zu wissen“ (u. a. „Kein vollständiger Virenscanner“), Hinweis zur Virenscanner-App und **„Abgelegt in …“ als Letztes** hinter ⓘ. Sichtbar bleiben Listenstand und Bedienteile. Die 🔑-Emojis in den Schlüssel-Knöpfen entfallen | ✔ | ✔ |
| 9d | „Tresor-Inhalt“ steht im Block „Tresor — Verschlüsselung“ direkt unter Einrichten/Entsperren/Sperren; der getrennte Kasten unten entfällt | ✔ | ✔ |

**Wo:** `native/native-help.js` + `native/help-layout.css` und `native/native-protect.js`, jetzt **byte-gleich in
beiden Repos** (V3 lädt `native-help.js` neu über `tools/native/prepare-web.mjs`). V3: `assets/v3-ui.js` (alte
„?“ nur noch ohne gemeinsames ⓘ), `assets/v3-ui.css`.

Bilder vorher/nachher: [bilder-sitzung-3/](bilder-sitzung-3/) (Einstellungen ganz, Schutz-Block mit nachgestellter
Geräteseite, Kategorien, Doppelte; je Pro und V3).

## Geprüft (lokal, 2026-10-26)

- `test-design-26` um 10 Prüfungen erweitert: **Pro 49 grün, V3 48 grün** (ⓘ anfangs offen und ohne Emoji, ein
  Tipp schließt, nach Neustart bleibt zu zu und offen offen, zweiter Tipp öffnet, „Neu ordnen“ mit ⓘ,
  Tresor-Inhalt im Tresor-Block, Schutz: „Abgelegt in“ und „Kein vollständiger Virenscanner“ nur im ⓘ, Wichtiges
  zuerst, „Abgelegt in“ zuletzt, Bedienteile sichtbar).
- **Gegenprobe**, alle vier gefangen: ⓘ anfangs zu → „open the first time“ rot; Zustand nicht gespeichert →
  „after a restart“ rot; Tresor-Inhalt nicht verschoben → 9d rot; „Abgelegt in“ außerhalb des ⓘ → 9b rot.
- `test:native-web` vollständig: **Pro 47 von 48 grün, V3 alle grün außer `test-filme`** (lokal ohne Video, auch
  vorher rot). Darunter test-help 114, test-protect 40, test-web 126 / 105, test-v3-ui 43, test-folders-layout 71 / 37.
- Angepasste Proben (Absicht, nicht abgeschwächt): `test-help` und `test-folders-layout` starten mit gemerktem
  Zustand „zu“ und prüfen dieselben Abläufe; `test-help` prüft den Schutz-Inhalt im ⓘ statt eines eigenen
  „Wichtig zu wissen“-Klappers; V3 `test-v3-ui` und `test-folders-layout` prüfen ⓘ statt „?“.

## Grenzen, ehrlich

- „Anfangs offen“ macht die Einstellungen beim ersten Öffnen so lang wie vorher; erst Zuklappen spart Platz. So
  hat Klaus es festgelegt (Punkt 7); die Sammlung vermerkte „Widerspruch offen“.
- Der Satz „Tresor gesperrt — oben entsperren …“ kommt aus `index.html` und blieb; er steht jetzt direkt unter
  den Knöpfen.
- Pro entfernt die Kategorien-Einleitung schon länger; dort gibt es darum kein ⓘ dafür.
- Schutz-Block nur mit nachgestellter Geräteseite geprüft; kein echtes Gerät. Nichts veröffentlicht.

## Neu von Klaus in dieser Sitzung

Punkte 12–14 (Bilder verstehen überall, Bild in eigenen Worten, Bildersuche in Workflow PDF; Name
„Bildbeschreibung“) sind in der Sammlung eingetragen und auf Klaus' Wunsch **Sitzung 4**. Der Sitzungsplan ist
entsprechend verschoben.

## Nachtrag: keine Emojis

Klaus zeigte danach V3s Katalog mit 📦 ✉️ 📄 🖼️ 📝 und 🔀: „Es sollen eine praktische Nutzer-App werden und kein
Bilderbuch.“ Jetzt überall Strichgrafiken:

- **V3** (`assets/v3-ui.js`/`.css`): Katalog-Kacheln, „Neu ordnen“, Explorer-Baum, -Zeilen und -Pfad, leere
  Ansichten (Katalog, Doppelte), alle Einstellungsknöpfe und -überschriften, Hinweise (Emoji nur entfernt), Tooltips
  und Bildschirmleser-Namen ohne Emoji. Neue Liniensymbole: Kiste, Notiz, Person, Mischen, Katalog, Beleg, Sprechblase,
  Diagramm, Präsentation, Entsperren, Herunterladen, Warnung, Labor, Netzwerk, Siegel, Tipp.
- **Beide** (`native/native-tools.js`, `native-license.js`, `native-mycel.js`): ☰-Menü „Mycel-Netz“ und
  „Werkzeuge“ ohne 🌐/🧰, die Schlösser vor gesperrten Werkzeugen (Menü und Freischalt-Liste) als Strich-Schloss.
- Beim Bau gefunden: V3s Regel `button.v3-ic{display:inline-flex!important}` hätte versteckte Knöpfe sichtbar
  gemacht („Siegel wieder zeigen“); sie gilt jetzt nur für `:not([hidden])`. Gefangen von `test-mycel`.
- Prüfung: sichtbare Emojis im ☰-Menü, in der Leiste und in allen Einstellungen (aufgeklappt) gezählt – in beiden
  Apps keins mehr (nur ↗ und ©, keine Bildzeichen). `test-tools`, `test-mycel` angepasst (Strich-Schloss statt 🔒,
  „Mycel-Netz“ ohne 🌐).
- Weitere Stellen: Doppelte-Liste (📦 vor jedem Namen, beide Apps), Mikrofon beim Zuhören (V3 rot statt 🔴),
  Diktier-Knöpfe in V3, Tooltips und Bildschirmleser-Namen in Pro („Hilfe zu 🔒 Tresor“, „🔒 gesperrt“,
  „📁 Ordner verbinden“, „🌐 Mycel-Fenster öffnen“).
- **Neuer Wächter** in `test-design-26` (beide Repos): in Leiste, ☰-Menü und allen acht Ansichten (Erklärungen
  aufgeklappt, Katalog mit PDF, Mail, Bild, Notiz) darf kein sichtbares Bildzeichen stehen, auch nicht in Tooltips
  oder `aria-label`. Ausgenommen: nur für Bildschirmleser versteckter Text, ↗/©, die byte-gleichen Kanon-Module
  von Siegel/Mycel. Gegenprobe: 🔒 im Menü zurück → rot. Pro 52, V3 51 grün.
- Angepasste ältere V3-Proben (`test-explorer-kinds`, `test-categories`, `test-speech`, `test-mycel`,
  `test-tools`): vergleichen jetzt die Wörter und prüfen das Strichsymbol.
