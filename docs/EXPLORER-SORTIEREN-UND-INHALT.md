# Explorer: neueste oben, umkehrbar, Suche im Inhalt (2026-10-21)

Bauabschnitt **A3** aus dem [Plan „Ordnen, Sortieren, Suchen“](PLAN_2026-10-21_ordnen-sortieren-suchen.md):
eingefügte Dateien wie Gehaltsabrechnungen, Arztbriefe und Rechnungen schnell finden.
Noch **nicht** in einer veröffentlichten Vorschau.

## Was Klaus sieht und wo er tippt

- **Explorer** zeigt jetzt von Anfang an **die neuesten Dateien oben** (Sortierung „Datum“).
- Daneben steht **↕ Neueste oben**. Ein Tipp dreht die Reihenfolge um („↕ Älteste oben“).
  Bei „Name“ heißt der Knopf „↕ A → Z“ bzw. „↕ Z → A“, bei „Größe“ „↕ Größte oben“ bzw.
  „↕ Kleinste oben“. Wer die Sortierung wechselt, beginnt in deren natürlicher Reihenfolge.
- **🔎 auch im Inhalt** (Häkchen): das Suchfeld findet dann auch Wörter im Text der Datei,
  zum Beispiel „Bandscheibe“ im Arztbrief oder „Lohnsteuer brutto“ in der Gehaltsabrechnung.
  Alle Wörter müssen vorkommen; Umlaute zählen nicht („zahlerstand“ findet „Zählerstand“).
- Zurück aus einer geöffneten Datei behält Ordner, Suchwort, Reihenfolge und Häkchen.
- Mails aus **👥 Alle Konten** stehen nicht mehr im Explorer; sie haben ihre eigene Ansicht.
  Vorher hätte der Erstabruf für jeden Absender einen eigenen Ordner angelegt und „Alle Dateien“
  mit Tausenden Mails gefüllt. Mails, die früher einzeln importiert wurden, bleiben sichtbar.

## Grenzen

- Gesucht wird im gespeicherten Katalogtext der Datei (Steckbrief, Zusammenfassung, erkannte
  Wörter). Ein Scan ohne Texterkennung wird nur über seinen Namen gefunden.
- Die Suche ist eine Wortsuche; Bedeutungssuche kommt mit A6.

## Prüfung (2026-10-21)

- `node tools/native/test-explorer-order.mjs`: **17 grün** (Standard neueste oben, ↕ für
  Datum, Name und Größe, Inhaltssuche, alle Wörter, Umlaute, Rückweg, Englisch, 360 px,
  Knopfgröße, „Alle Konten“-Mails nicht im Explorer).
- Die vorhandenen `test-navigation` (22) und `test-web` (102) bleiben grün.
- `tools/e2e-workspace.mjs` bricht hier in der Sitzung an zwei Stellen ab (gemeinsame Suche,
  Ordnerablage nach Neuladen). Ohne die Änderung bricht sie an denselben Stellen ab, die
  Ursache liegt also in dieser Umgebung. In der CI läuft sie vollständig.

# Flache Knöpfe (Klaus 2026-10-21)

Klaus: *„Die Button sollen flach sein, wie bei Notion … sie müssen nicht so dick sein …
damit die Übersichtlichkeit erhalten bleibt und die eigentlichen E-Mails oder Texte oder
Dokumente leichter zu finden sind … Sie müssen auch nicht ganz so flach sein wie die
Notion-Button. Müssen ja immer noch gut lesbar sein.“*

- Vorbild ist Workflow PDF (`assets/style.css`, Block „Handy: flachere Knöpfe“, 30–32 px).
- Im Postfach, in „Alle Konten“, im Aufräumen, im Doppelte-Kasten und beim ↕ im Explorer:
  **32 px hoch**, ohne 3D-Schatten, mit dünnem Rand, Schrift 0,88 rem. Der Hauptknopf bleibt
  farbig gefüllt. Mail-Zeilen in „Alle Konten“ sind 48 statt 60 px hoch.
- Am Handy stehen „Liste · Absender · Aufräumen · ↕“ in **einer** Zeile. Der ↕-Knopf zeigt
  dort nur den Pfeil; sein voller Name bleibt für Vorlesehilfen und Tooltip.
- Proben messen jetzt **30–36 px**: flach, aber gut zu treffen.
- **Obere Leiste** (Klaus 2026-10-21): „Suche“ und „Einstellungen“ ohne Wort, nur **Lupe** und
  **Zahnrad** (Name bleibt als Tooltip und für Vorlesehilfen); „Mail“ und die übrigen behalten
  ihr Wort. Das App-Menü oben rechts zeigt **☰** (drei Striche) statt eines zweiten Zahnrads.
  Klaus: „Striche sind besser.“ Die drei Punkte bleiben für „Weitere Ansichten/Aktionen“.
  Leistenknöpfe 32 px, auf Touch-Geräten 36 px (vorher 36/40).
- Gefunden beim Nachmessen: die einzeilige, wischbare Knopfreihe wurde in der Flex-Spalte
  zusammengedrückt (abgeschnittene Knöpfe). Behoben (`flex-shrink:0`); neue Prüfung
  „in einer Zeile und nicht abgeschnitten“, Gegenprobe ohne die Reparatur: **gefangen**.
- Nur in der Pro-App (`native/native.css`). Die PWA bleibt unverändert.
- Grenze: 32 px liegen unter der oft empfohlenen Tippfläche von 44 px. Das ist so gewollt;
  am Tablet ist das noch nicht gemessen.

## Zweite Runde (Klaus 2026-10-21): überall flach, wachsen unter dem Finger

Klaus: *„die Knöpfe sollen überall flach sein, vielleicht noch etwas flacher … wenn ich mit dem
Finger drauf gehe, können die Button größer werden … so treffe ich sie besser.“*

- **Alle Knöpfe der Pro-App** (Grundregel `button`/`.btn` in `native/native.css`, überstimmt
  `index.html`; die PWA bleibt unverändert): sichtbar etwa **28 px**, Innenabstand 3 px oben und unten,
  ohne Schatten. Leistenknöpfe 30 px, auf Touch-Geräten 32 px. Explorer-Felder 30 px.
- **Größere Tippfläche ohne mehr Platz:** Ein unsichtbarer Rand reicht 7 px über und unter jeden
  Knopf hinaus. Er liegt *hinter* allem anderen (`z-index:-1`) und greift deshalb nur in freien
  Lücken, nie über einem Nachbarknopf.
  - Erster Versuch ohne diese Sicherung: Im App-Menü fing der Rand eines Knopfs das Tippen auf den
    Knopf darüber ab (gefangen von `test-compact-network`).
  - Davor ragte der Rand auch 3 px zur Seite und machte die Suche bei 280 px seitlich schiebbar
    (gefangen von `test-web`). Jetzt reicht er nur nach oben und unten.
- **Wachsen beim Antippen:** Ein gedrückter Knopf wird um 12 % größer (mit der Maus darüber 4 %).
  Ganze Zeilen und Kacheln wachsen nicht, sie färben sich nur. Wer Bewegung abgeschaltet hat,
  sieht stattdessen einen Rahmen.
- **Aktualisieren** ist nur noch das Kreispfeil-Symbol ⟳ (zwei gegenläufige Pfeile), auch in der
  Werkzeugleiste des Postfachs. Der Name steht als Tooltip und für Vorlesehilfen da.
- **„Alle Konten“, Kopfzeile in einer Zeile:** „← Zurück“ (statt „← Zurück zum Postfach“), dann eine
  **Kontoauswahl**, die „Alle Konten“ oder die Adresse des gewählten Kontos zeigt, dann ⟳ und ⋯.
  Mit einem einzelnen Konto zeigen Liste, Absender, Suche und Aufräumen nur dessen Mails.
- Proben: `test-mail-index` **61 grün** (Kopf in einer Zeile, Kontoauswahl, ⟳ ohne Text,
  Tippfläche 7 px, Wachsen auf 1,12, „← Zurück“ einzeilig), `test-explorer-order` 17,
  ganze Reihe `test:native-web` grün. Bilder: `docs/design/flach/`, `docs/design/alle-konten/`.
