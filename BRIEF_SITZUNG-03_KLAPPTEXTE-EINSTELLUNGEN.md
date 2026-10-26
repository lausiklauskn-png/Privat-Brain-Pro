# Sitzung 3 – ⓘ-Klapptexte überall und Einstellungen aufräumen

**Diese Sitzung ist Sitzung 3.** Klaus zählt die Sitzungen fortlaufend. Sag ihm zu Beginn: „Wir sind in Sitzung 3.“
Am Ende stehen ein Abschluss, Forschungseinträge, der Brief für Sitzung 4 und die nachgezogenen CLAUDE.md-Anker in
beiden Repos.

## Zuerst lesen

1. [Sammlung mit Sitzungsplan](docs/design/aenderungen-2026-10-26/SAMMLUNG.md), Punkte **7, 9a, 9b, 9d** und der
   Nachtrag **11**, mit Bildern (`punkt-06-kategorien.jpg`, `punkt-09-einstellungen.jpg`).
2. [Abschluss Sitzung 2](docs/design/aenderungen-2026-10-26/ABSCHLUSS-SITZUNG-02.md) und
   [Forschung Sitzung 2](docs/design/aenderungen-2026-10-26/FORSCHUNG-SITZUNG-02.md), dazu
   [Forschung Sitzung 1](docs/design/aenderungen-2026-10-26/FORSCHUNG-SITZUNG-01.md) (lokaler Bau: Node 24,
   Video-Platzhalter, Chromium-Pfad, `git add` vor dem Bauen).

## Feste Regeln (Klaus 2026-10-26)

- Jeder Punkt gilt für **alle sechs Varianten** (Pro und V3, je Android, Windows, PWA). Beide Repos ändern, im
  gemeinsamen Webteil, keine Nachträge für später.
- Kein Code an Pros `index.html`; Anpassungen über `tools/native/adapt-search.mjs` oder Skripte in `native/`. In V3
  über `tools/native/v3-prerender.mjs` oder `assets/v3-*.js`. Was in beiden Apps gleich ist, als **eine** Datei in
  beide Repos legen (Vorbild `pb-arrange.js`).
- Keine Emojis in Knöpfen; flache Liniensymbole, kurze Wörter, ~28–32 px. **Neu aus Sitzung 2:** Hinweise ohne
  Kasten; ein antippbarer Hinweis ist ein schmaler Textknopf. Kleinere Schrift ist erlaubt. Am Handy keine Knöpfe
  übereinander stapeln.
- **Nicht veröffentlichen** ohne Klaus' ausdrückliches Wort. Vorher-nachher-Bilder zeigen.
- Branch: der für die Sitzung vorgegebene, frisch von `origin/main`, falls der PR von Sitzung 2 übernommen ist.

## Punkt 7 – ⓘ-Klapptexte überall

- Jeder Erklärtext wird ein Klapper mit ⓘ (einheitlich ⓘ, auch wo V3 heute „?“ zeigt). Ein Tipp öffnet, ein zweiter
  schließt. Der Zustand bleibt gespeichert, auch nach Neustart. Wer nie etwas einstellt, sieht ihn **offen**.
- Beispiele: Kategorien „Neu ordnen – Kopie in einen neuen Ordner …“, V3 zusätzlich „Ein Vorschlag, wie deine
  Dateien …“; Doppelte (V3s langer Text oben).
- Vorbild ist Pros ⓘ in den Einstellungen (`native/native-help.js`, `help-layout.css`). Prüfen, ob sich das als
  gemeinsame Datei für beide Apps eignet.

## Punkt 9a/9b/9d – Einstellungen

- **9a:** Pros ⓘ-Klappknopf rechts am Block in V3 übernehmen. Was Klaus gut findet, bleibt: Offline-Anzeige,
  Texterkennung, Tresor-/Verschlüsselungs-Info, optionale Teile.
- **9b:** „Schutz vor Viren, Spam, Betrug“: „abgelegt in …“ und „kein vollständiger Virenscanner …“ hinter ⓘ.
  Sichtbar bleiben nur die Bedienteile. Im ⓘ zuerst das Wichtige für den Nutzer, „abgelegt in“ darunter.
- **9d:** Getrennten Block „Tresor-Inhalt“ in „Speicherort und Verschlüsselung“ einbauen: dort sperren/entsperren
  und nach dem Entsperren gleich darunter den Inhalt sehen. Kein getrennter Kasten unten.

## Nachtrag 11 prüfen

In Sitzung 2 sind die Explorer-Dateizeilen flach geworden („Öffnen“ schmal auf Höhe des Namens, Prüfhinweis ohne
Kasten, `pb-arrange.css`). Prüfen, wo dasselbe Muster sonst noch fett ist (Suchergebnis-Karten „↗ Öffnen“,
Kategorien-Karten, Doppelte) und mit Klaus abstimmen, ob es dort gleich werden soll. In V3 bricht die Hauptleiste
am Handy in zwei Zeilen um; Klaus' Hinweis „keine Knöpfe übereinander“ betraf den Explorer – dort nachfragen.

## Prüfen

- `tools/native/test-design-26.mjs` (beide Repos) um die Punkte dieser Sitzung erweitern, mit Gegenprobe.
- Vorhandene Proben: test-help, test-web, test-first-paint (Pro); test-v3-ui, test-web (V3); `test:native-web`
  in beiden ganz laufen lassen.
- Bilder bei 1000×800, 1000×1300 und 412×900.

## Am Ende

`ABSCHLUSS-SITZUNG-03.md` und `FORSCHUNG-SITZUNG-03.md` neben die Sammlung, Stand in der Sammlung eintragen,
`BRIEF_SITZUNG-04_…md` (Punkte 5 und 6a) schreiben und beide CLAUDE.md-Anker oben nachziehen.
