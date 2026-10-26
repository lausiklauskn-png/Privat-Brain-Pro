# Abschluss Sitzung 2 (2026-10-26) – Explorer-Werkzeugzeile und Anordnung

Punkte **3** und **2** der [Sammlung](SAMMLUNG.md), dazu Klaus' Nachtrag **11** aus dieser Sitzung. Gilt für alle
sechs Varianten: Android, Windows und PWA einer App kommen aus demselben gebauten Webteil.

## Umgesetzt

| Punkt | Was | Pro | V3 |
|---|---|---|---|
| 3a | ⌂ „Alle Dateien“ ist eine **Auswahl**: Alle Dateien · E-Mails · PDF · Dokumente · Fotos und Bilder · Notizen, mit Anzahl. Sie zeigt immer, was gerade zu sehen ist (auch eine Ebene tiefer, auch Kategorien) | ✔ | ✔ |
| 3b | „Dateiliste filtern“ → Lupe im Feld, blass „Suche“ | ✔ | ✔ |
| 3c | Sortieren zeigt die Wahl auf dem Knopf: **D ↓** (Datum, neueste oben), N, G, T mit ↑/↓; Bedeutung im Tooltip und unten im Menü | ✔ | ✔ (vorher langes Auswahlfeld; „Typ“ neu) |
| 3d | Reihenfolge: Auswahl · Anordnung · Suche · Sortieren · auch im Inhalt · Prüfstand | ✔ | ✔ |
| 3e | Der kleine ↑ entfällt. Rückweg über den Pfad „Alle Dateien › E-Mails › …“; auch Kategorien und PDF haben jetzt diesen Pfad. Auf oberster Ebene steht der Pfad nicht doppelt | ✔ | ✔ |
| 2 | **Ein Anordnungs-Knopf** (Liniensymbol) in Explorer, Postfach und Kategorien (V3: Katalog), in jeder Fenstergröße: Nebeneinander · Übereinander · Ordnerbaum (Postfach: Ordner) anzeigen · Alle Ordner einklappen. Gemerkt je Ansicht | ✔ | ✔ |
| 2 | Spaltenaufteilung ziehbar auch im geteilten Bildschirm, wenn „nebeneinander“ gewählt ist; übereinander mit ziehbarer Trennlinie (Doppelklick setzt zurück) | ✔ (`native-panes.js` folgt der Wahl) | ✔ (`SPLITS` folgt der Wahl) |
| 2 | Kategorien: auf Wunsch Ordnerbaum Kategorie ▸ Dateien; ein Tipp auf eine Datei zeigt sie im Explorer | ✔ | ✔ |
| 11 | Dateizeilen: „Öffnen“ schmal auf Höhe des Namens; Prüfhinweis ohne Kasten (antippbarer Text, öffnet weiter den Bericht); kleinere Schrift | ✔ | ✔ |
| 11 | Handy/schmal: alle Knöpfe der Leiste in **einer** Zeile, Suchfeld darunter in voller Breite; „auch im Inhalt“ → „Inhalt“, Prüfstand nur Schild (Wortlaut im Tooltip) | ✔ | ✔ |

Solange niemand eine Anordnung wählt, bleibt die bisherige Anordnung der App (Pro: im Hochformat eine Spalte,
V3: ab 651 px nebeneinander). Wer wählt, bekommt genau das – auch am Handy.

**Wo:** eine gemeinsame Datei `pb-arrange.js`/`pb-arrange.css`, byte-gleich in Pro `native/` und V3 `assets/`.
Dazu je Repo `assets/workspace.js` (PDF-Ansicht, Pfad als Rückweg bei Ansichten, `explorerSections`/
`explorerSection`, „Suche“; V3 zusätzlich Sortieren nach Typ). Pro: `native-panes.js`, `prepare-web.mjs`;
`native/native-sort.js` und `sort-layout.css` entfallen (in `pb-arrange.*` aufgegangen). V3: `index.html` lädt die
Dateien, `sw.js` Vorrat `private-brain-v94` → **v95** (gegen `origin/main` geprüft), `v3-ui.js` (`SPLITS`).

Bilder vorher/nachher: [bilder-sitzung-2/](bilder-sitzung-2/) (`*-vorher-*`, `*-nachher-*`, Menüs, über-/nebeneinander,
Postfach übereinander, Kategorien-Baum; je Pro und V3).

## Geprüft (lokal, 2026-10-26)

- `tools/native/test-design-26.mjs` in beiden Repos um 27 Prüfungen zu Punkt 2 und 3 erweitert: **Pro 40 grün,
  V3 39 grün** (Leistenreihenfolge, versteckter ↑/⌂/◨, Lupe und „Suche“, „D ↓“/„N ↑“/„T ↑“ mit Tooltip,
  Ansichtswahl mit PDF und Pfad zurück, Anordnungs-Knopf bei 1000×800, 1000×1300 und 412×900 in Explorer,
  Postfach und Kategorien, nebeneinander/übereinander im hohen Fenster, Einklappen, Baum aus, Postfach nebeneinander,
  Kategorien-Baum, Wahl nach Neustart je Ansicht erhalten).
- **Gegenprobe** im gebauten `www/` (danach zurückgesetzt), alle vier gefangen: Auswahl/Sortieren nicht in die Leiste
  gesetzt → „toolbar order“ rot; Baum im hohen Fenster nicht erzwungen → „nebeneinander“ rot; Wahl nicht gespeichert
  → „kept after a restart“ rot; Pfeil verkehrt → „D ↓“ rot.
- **Pro `test:native-web` vollständig: 47 von 48 grün**, darunter test-web 126, test-first-paint 38, test-panes 55,
  test-compact-controls 60, test-compact-network 38, test-folders-layout 71, test-mail-index 69, test-explorer-order
  40, test-explorer-kinds 46, test-categories 21, test-overview 27. Rot nur `test-filme` (siehe Grenzen).
- **V3 `test:native-web` vollständig plus test-v3-ui und test-v3-identity: alle grün außer `test-filme`**, darunter
  test-web 105, test-v3-ui 43, test-compact-network 32, test-folders-layout 37, test-mail-index 61,
  test-explorer-order 19, test-explorer-kinds 27, test-categories 21.
- Angepasste Proben (absichtliche Änderung, nicht abgeschwächt): test-explorer-order (Knopf zeigt „D ↓“ statt
  „Sortieren“; V3 neu auf den Knopf statt aufs Auswahlfeld), test-explorer-kinds („↑“ → Pfad, ⌂ → Auswahl, ◨ →
  Anordnungs-Menü), test-categories (⌂ → Auswahl), test-panes (◨ → Anordnungs-Menü), test-overview (Pfad
  „Alle Dateien › Kategorie“).
- Unterwegs gefunden und behoben: Endlosschleife beim offenen Menü (Forschung 6), 4-px-Sprung in „Alle Konten“
  (Forschung 7), Mail-Kopf in V3 1 px zu hoch (Forschung 8), leere Kategorie-Ansicht in V3 (Forschung 3).

## Grenzen, ehrlich

- Lokal ohne Anleitungsvideo gebaut (Pages-Host gesperrt); darum scheitert `test-filme` hier – genauso auf dem
  unveränderten Stand. Die CI baut mit Video.
- Pros `tools/e2e-workspace.mjs` (rohe PWA-Seite, Teil von `npm test`) bricht hier mit „Target page … has been
  closed“ ab, auch auf dem unveränderten Stand (mit `git stash` gegengeprüft); dieselbe Erscheinung wie in V3
  (Sitzung 1). Ursache nicht gefunden.
- Postfach nur mit simulierten Konten geprüft, kein echtes Mailkonto. Ordner „einklappen“ im Postfach betrifft
  „Weitere Ordner“ des Anbieters; ohne solche Ordner ist der Eintrag ausgegraut.
- In V3 bricht die Hauptleiste (Dateien, Explorer, Mail …) am Handy weiterhin in zwei Zeilen um; nicht Teil dieser
  Punkte, im Brief für Sitzung 3 vermerkt. Suchergebnis-Karten haben noch den alten „↗ Öffnen“-Knopf.
- Nicht gemessen: Tablet S6/DeX, Windows-Gerät, echte Android-App. **Nichts veröffentlicht.**
