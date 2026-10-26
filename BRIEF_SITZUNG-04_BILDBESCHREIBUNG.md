# Sitzung 4 – Bildbeschreibung: Bilder verstehen überall, eigene Worte, Workflow PDF

**Diese Sitzung ist Sitzung 4.** Sag Klaus zu Beginn: „Wir sind in Sitzung 4.“ Klaus hat diese Punkte am
2026-10-26 vorgezogen („Bilder verstehen muss unbedingt mit rein, überall, in jede Version. Das ist genial … das,
was überall fehlt. In den Kameras.“). Die bisherige Sitzung 4 (3D-Knöpfe, Kategorien) ist jetzt Sitzung 5.

## Zuerst lesen

1. [Sammlung](docs/design/aenderungen-2026-10-26/SAMMLUNG.md), Punkte **12, 13, 14**.
2. [Abschluss Sitzung 3](docs/design/aenderungen-2026-10-26/ABSCHLUSS-SITZUNG-03.md), Forschung
   [Sitzung 1](docs/design/aenderungen-2026-10-26/FORSCHUNG-SITZUNG-01.md),
   [2](docs/design/aenderungen-2026-10-26/FORSCHUNG-SITZUNG-02.md),
   [3](docs/design/aenderungen-2026-10-26/FORSCHUNG-SITZUNG-03.md).
3. Ältere Unterlagen zur Bedeutungssuche: [docs/BEDEUTUNGSSUCHE-UND-LADEBALKEN.md](docs/BEDEUTUNGSSUCHE-UND-LADEBALKEN.md)
   (wie das Bedeutungs-Modell per Schalter in die App geladen wird, Absturz im Emulator 2026-10-21).

## Entschieden (Klaus 2026-10-26)

- Kurzer Name überall: **„Bildbeschreibung“**. Ein Schalter oder Filter in der Suche, kein langer Satz.
- Gilt für alle sechs Varianten (Pro, V3; je Android, Windows, PWA) **und Workflow PDF** (eigenes Repo).
- Feste Regeln wie bisher: gemeinsamer Webteil, keine Emojis in Knöpfen, flach, Hinweise ohne Kasten, ⓘ für
  Erklärungen (anfangs offen, gemerkt), nichts veröffentlichen ohne Klaus' Wort, Vorher-nachher-Bilder.

## Ist-Stand (geprüft 2026-10-26 im Code, nicht auf Geräten)

- Code: `pb-caption.js` (in Pro und V3 gleich). Lädt transformers.js 2.17.2 von jsDelivr und das Modell
  `Xenova/vit-gpt2-image-captioning`, zuerst aus `models/` (oder der eingetragenen Server-Adresse), sonst von
  Hugging Face. Schalter in den Einstellungen „Bilder verstehen (lokales Modell)“ (`capEnable`, `capModel`,
  `capServer`, `capEU` für Mistral), Code in `index.html` (`loadCaptionScript`, `captionImage`, `describeImage`,
  `captionBackfill` mit Absturzschutz und 120 s je Bild).
- **Android/Windows:** Die jsDelivr-Adresse beantwortet die App selbst (`BundledLibrary.java`, Windows
  `resources.rs`), aber nur, wenn die Bibliothek schon über den Bedeutungs-Schalter geladen wurde. Sonst gibt es
  still keine Beschreibung. Das Bildmodell selbst ist in keinem Bau enthalten.
- **PWA:** lädt von jsDelivr und Hugging Face; CSP erlaubt es. Ob es im Browser des Tablets tatsächlich läuft
  (Arbeitsspeicher, WASM), ist ungemessen.
- Die Beschreibung landet im Suchtext (`r.snippet`, dann `tokens`, `vector`, `tf`, `evec` neu); ein eigenes
  Feld `r.caption` gibt es nicht (nur `native-categories.js` liest es).
- Ein Feld für eigene Worte zu einer Datei gibt es nicht. Pros `native-speech.js` hängt das Mikrofon an jedes
  normale Eingabefeld; V3s ältere Fassung nur an `#q` und Textbereiche.
- Probe: `tools/e2e-caption.mjs` (Modell gestellt). Keine native Probe.

## Aufgabe

1. **Punkt 12 – überall lauffähig.** In Android und Windows das Bildmodell wie das Bedeutungs-Modell per
   Schalter in den App-Speicher laden (Fingerabdrücke festlegen, Weitermachen nach Abbruch, Entfernen), samt
   transformers.js, auch ohne Bedeutungs-Modell. In der PWA ehrlich anzeigen, was geladen wird. Absturzschutz
   behalten. Größe und Speicherbedarf vorher messen und Klaus nennen.
2. **Punkt 13 – eigene Worte.** Zu jedem Bild (Explorer, Suchergebnis, Vorschau) ein kurzes Feld
   „Bildbeschreibung“, tippen oder per Mikrofon. Eigene Worte als eigenes Feld am Katalogeintrag speichern
   (z. B. `r.userCaption`), in den Suchtext aufnehmen, Modellbeschreibung getrennt lassen. Ehrlich: „das Modell
   schulen“ heißt hier zunächst, dass die eigenen Worte mitgesucht werden; echtes Nachtrainieren ist ein eigener,
   größerer Schritt (mit Klaus besprechen).
3. **Bildbeschreibung in der Suche.** Ein kurzer Schalter oder Filter „Bildbeschreibung“, der Bilder nach
   Modell- und eigener Beschreibung findet.
4. **Punkt 14 – Workflow PDF.** Repo mit `add_repo` holen (Name bei Klaus erfragen, falls unklar), dort dieselbe
   Suche nach Bildbeschreibung einbauen. Erst den Aufbau von Workflow PDF lesen; nichts an dessen geschützten
   Modulen ändern.

## Prüfen

- `test-design-26` (Pro, V3) um die Bildbeschreibung erweitern, mit Gegenprobe; `e2e-caption` weiter grün.
- Native Ladeprobe für das Bildmodell nach Vorbild der Bedeutungs-Modell-Probe.
- Beide `test:native-web` vollständig.

## Am Ende

`ABSCHLUSS-SITZUNG-04.md`, `FORSCHUNG-SITZUNG-04.md`, Sammlung nachtragen, `BRIEF_SITZUNG-05_…md` (Punkte 5, 6a),
CLAUDE.md-Anker in beiden Repos (und in Workflow PDF, falls dort gearbeitet).
