# Abschluss Sitzung 4 (2026-10-26) – Bildbeschreibung

Punkte **12, 13, 14** der [Sammlung](SAMMLUNG.md). Gilt für alle sechs Varianten (Pro + V3, je Android/Windows/PWA)
**und** für Workflow-PDF (PWA) und Workflow-PDF-Pro (Android/Windows). Kurzer Name überall: **„Bildbeschreibung“**.

## Zuerst die Zahlen, die Klaus wollte (gemessen, nicht geschätzt)

Lernlauf im Prüfrechner von GitHub ([Lauf 40327837624](https://github.com/lausiklauskn-png/Privat-Brain-Pro/actions/runs/40327837624),
Chromium 156), Modell `Xenova/vit-gpt2-image-captioning` mit transformers.js 2.17.2, Stand `215b4edc…`:

| Was | Gemessen |
|---|---|
| Download einmalig | **255,9 MB** (Modell 248,2 MB + Bibliothek 20,1 MB, 268.302.883 Bytes) |
| Laden bis bereit | 3,1 s |
| Je Bild | 3,2 s (erstes), 2,9 s (zweites) |
| JavaScript-Speicher | 169 MB beim Laden, 33 MB danach |
| Arbeitsspeicher des Browserprozesses in der Spitze | **1,2 GB** (1217 MB) |

Die Zahlen stehen **vorher** in den Einstellungen (Pro/V3) bzw. im Dialog (Workflow-PDF). **Nicht am Tablet gemessen.**
Ein Tablet mit wenig Arbeitsspeicher kann beim Beschreiben an seine Grenze kommen; dafür bleibt der Absturzschutz
(nach einem Absturz startet das Modell nicht von selbst wieder, „Erneut starten“ bewusst).

## Umgesetzt

| Punkt | Was | Pro | V3 | Workflow-PDF | Workflow-PDF-Pro |
|---|---|---|---|---|---|
| 12 | Bildmodell per Schalter in den **App-Speicher**, jede Datei mit SHA-256-Fingerabdruck, Weitermachen nach Abbruch, Entfernen; auch ohne Bedeutungs-Modell. Android `ProCaptionPlugin` + `BundledLibrary` (beantwortet die Modelladresse aus dem App-Speicher), Windows `DesktopModel` für zwei Modelle + `resources.rs` | ✔ | ✔ | — (PWA: Modell aus dem Netz in den Browser-Vorrat, Balken mit MB, ehrlicher Dialog) | ✔ über den Kern (Browser-Vorrat der WebView) |
| 12 | Einstellungen: Block „Bildbeschreibung“, Schalter „Fotos vom Modell beschreiben lassen“, Kasten Laden/Abbrechen/Erneut/Entfernen mit Stand; in den Apps keine Modell-/Server-Felder mehr | ✔ | ✔ | Leiste unter der Suche: „Fotos beschreiben lassen“ → Dialog (jsDelivr, family-projekt.de, sonst Hugging Face; 256 MB; 1,2 GB) | ✔ |
| 13 | **Feld „Bildbeschreibung“** an jedem Bild: Suchergebnis, Explorer, Lightbox, Dateiansicht. Eigene Worte tippen oder diktieren (Apps: Android-/Windows-Diktat; PWA: Browser-Erkennung), getrennt vom Modell gespeichert (`userCaption` / `caption`), beide in Wort- **und** Bedeutungssuche | ✔ | ✔ | Feld an jeder Foto-Karte und im Editor (`d.bild.eigen` / `d.bild.modell`), Mikrofon über `assets/sprechen.js`; Wortsuche mit Fundzeile „Bildbeschreibung“ / „… vom Modell“ | ✔ |
| 14 | **Schalter „Bildbeschreibung“** in der Suche: eigene flache Zeile direkt unter dem Suchkasten (der Kasten bleibt 38 px), ⓘ anfangs offen, gemerkt (`pb_help_open_v1`) | ✔ | ✔ | Schalter + ⓘ + Modell-Knopf in **einer** Zeile unter der Suche, Erklärung darunter (`wfpdf_hilfe_v1`); Schalter an = nur beschriebene Fotos | ✔ |
| Regel | Keine Emojis, Liniensymbole, flache Knöpfe (28 px Maus / 40–44 px Finger), Hinweise ohne Kasten | ✔ | ✔ | ✔ | ✔ |

**Wo:** Pro `native/pb-bildbeschreibung.js`/`.css` = V3 `assets/pb-bildbeschreibung.js`/`.css` (**byte-gleich**, V3 im Vorrat Cache v96),
`tools/native/caption-model.json` (Pins, Größen, Messung), `tools/native/fetch-caption-model.mjs`, `measure-caption-model.mjs`,
`.github/workflows/caption-model-pins.yml` (Lernlauf). Workflow-PDF `assets/bildbeschreibung.js` + Nähte in `app.js`
(Suche, Filter, Karten, Editor, `ladeBibliothek` → Nachziehen), Version **1.1.3**, Cache **v108**. Workflow-PDF-Pro:
Kern bytegleich in `upstream/workflow-pdf`, Anker `app.js?v=71`, Version **1.0.5**, Android-Buildnummer **6**.

Bilder vorher/nachher: [bilder-sitzung-4/](bilder-sitzung-4/) (Suche 1280 px, Handy 390 px, Einstellungen; je Pro und V3;
Workflow-PDF Bibliothek, Handy, Dialog).

## Geprüft (lokal, 2026-10-26)

- **Pro:** `test-caption-model` **34 grün** (ProCaption und Modell gestellt: Riegel vor dem Laden, Balken, Beschreibung
  am Eintrag, Feld nur am Bild, eigene Worte gespeichert/indexiert/gesucht, Schalter, ⓘ, Explorer, Lightbox, Neustart,
  Absturz/Erneut, Entfernen, offline, EN), `test-design-26` **56 grün** (Sitzung 4: flaches Feld ohne Emoji, Schalter,
  eigene Worte gesucht), `test-web` 126, `e2e-caption` 18, Windows-Engine 101. `test:native-web` **1938 grün bis
  `test-filme`** (lokal ohne Video, bekannt), `test-design-26` danach einzeln grün.
- **V3:** `test-caption-model` **34 grün**, `test-design-26` **55**, `test-web` 105, `e2e-caption` 18, Windows-Engine 94; Kette **977 grün
  bis `test-filme`**, danach `test-v3-identity` 21 und `test-design-26` 55 einzeln grün.
- **Gegenprobe Pro** (Wegwerf-Kopien von `www`): eigene Worte nicht im Index → „Own words are in the search index“ rot ·
  Schalter wirkungslos → „Switch on without a search word“ rot · kein Riegel vor dem Modell → „Without the model the
  page does not start describing“ rot. Der zweite Fall lief zuerst in einen Zeitablauf statt in eine rote Zeile; die
  Probe meldet ihn jetzt mit Namen.
- **Workflow-PDF:** `tests/bildbeschreibung.mjs` **50 grün** (in `npm test`); Gegenprobe `tests/gegenprobe_bildbeschreibung.mjs`
  **14 Fälle, 14 gefangen, 0 durchgerutscht, 0 aus falschem Grund, 0 tote Anker** (darunter: eigene Worte nicht gesucht,
  Schalter tut nichts, Feld auch am PDF, Modell lädt ohne Wahl, Worte nicht gespeichert, ⓘ nicht gemerkt, Zahlen im Dialog
  fehlen, Fundzeile ohne Namen, neues Foto nicht beschrieben, nach Neuladen noch einmal beschrieben, Emoji, Abbrechen
  wirkungslos, Fehler verschluckt, Modul nicht im Vorrat). Zwei Fälle liefen zuerst in einen Zeitablauf, einer war eine
  tote Sabotage (zwei Riegel deckten einander) – alle drei nachgezogen. `npm test` vollständig grün (33 Proben), nachdem
  `tests/teilen.mjs` für den Mauszug mehr Fensterhöhe bekommen hat (die Karten lagen in der 60-px-Rollzone des Ziehens).
- **Workflow-PDF-Pro:** `verify-upstream` 0 Abweichungen (Kern `3bf07ab`, 200 Dateien), `test:native-web` 33 bestanden.

## Grenzen, ehrlich

- **Nicht am Tablet gemessen:** weder Laden noch Beschreiben; 1,2 GB Arbeitsspeicher sind ein Risiko für kleine Geräte.
- Das Modell schreibt **Englisch** („a beach with palm trees“). Der Mistral-Weg (Deutsch, Cloud, Schlüssel) bleibt in
  Pro/V3 getrennt wählbar; Workflow-PDF hat nur das Gerätemodell.
- „Das Modell schulen“ heißt hier: die eigenen Worte stehen neben der Modellbeschreibung und werden mit gesucht. Ein
  echtes Nachtrainieren ist ein eigener, größerer Schritt (mit Klaus besprechen).
- Workflow-PDF: beschrieben werden **Fotos** (Quelle `foto`, `zuschnitt`) über ihr Vorschaubild (260 px); PDF-Seiten
  nicht. Die eigenen Worte zählen in der Wortsuche, **nicht** in der Bedeutungssuche (die ordnet nur Seitentext und
  Felder ein). „Abbrechen“ hält Anzeige und Beschreiben an; den laufenden Abruf von transformers.js kann die PWA nicht
  stoppen, was ganz geladen ist, bleibt im Browser-Vorrat (das steht im Dialog). Erst der eigene Server
  (family-projekt.de), sonst Hugging Face – ob das Modell dort liegt, ist nicht geprüft (Netz im Behälter gesperrt).
- PWA von Pro/V3 (Browser ohne Capacitor): weiter Laden aus dem Netz wie bisher, jetzt mit den gemessenen Zahlen im Text.
- **Nichts veröffentlicht.** Alle vier Repos auf dem Zweig `ccr-2068cf6c-0u3a7n`, Entwurfs-PRs: Pro #89, V3 #24,
  Workflow-PDF #134, Workflow-PDF-Pro #26. Übernahme nur auf Klaus' Wort.
