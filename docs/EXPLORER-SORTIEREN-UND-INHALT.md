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
