# BRIEF — Private Brain: Nachfolge-Sitzung (Stand 2026-07-17 Abend)

> Anschlussbrief für die **nächste** Sitzung. Freibrief gilt (siehe `CLAUDE.md` § Freibrief):
> selbstständig bauen + eigene PRs mergen, wenn getestet, abgegrenzt, nicht zweifelhaft.

## Pflichtlektüre vor der Arbeit (in dieser Reihenfolge)
1. `CLAUDE.md` — Verfassung (Ehrlichkeit, echte Krypto, `npm test`=Beweis, kein PII, offline,
   Selbst-Merge-Freibrief, Plan-vor-Code, DB-Suffix `privatbrain` nie ändern).
2. Dieser Brief (aktueller Stand + offene Vorschläge).
3. `KONZEPT.md` + `README.md` — Vision, Aufbau.
4. Der Code-Bereich der Scheibe, an der gebaut wird (`index.html`, `pb-caption.js`, `tools/*.mjs`).

## Was heute lief (2026-07-17) — alles gemergt, `npm test` grün (24 Suiten)
Stufen 0–4 stehen; heute kamen viele Feld-Fixes aus Klaus' echten Tablet-Tests dazu:

- **Bild-Verstehen (Stufe 3):** EXIF (Datum/Ort/Kamera **+ Foto-Einstellungen** Blende/ISO/
  Brennweite + Schärfentiefe-Hinweis). Late-Fusion (EXIF + OCR + Beschreibung).
- **Lokaler Bild-Beschreiber (Stufe 3b):** `pb-caption.js` (transformers.js, Modell same-origin
  ODER von eigenem Server). **Modell liegt auf Klaus' Hetzner** (`https://family-projekt.de/models/…`,
  Caddy + CORS). **Aber:** lokales Modell **stürzt auf dem Tablet ab** („Can't create a session" =
  zu wenig Speicher). → **Fehl-Zähler pausiert den Auto-Start** nach 2 Fehlschlägen.
- **Bessere Beschreibung per Mistral (EU):** opt-in Schalter, Modell **`pixtral-12b-2409`**
  (Mistrals echtes Seh-Modell — vorher `mistral-small` „sah" das Bild nicht → Messer = „Buch").
  **Das ist der Tablet-Weg** (lokales Modell zu schwer). Nur verkleinerte Arbeitskopie (max 1024 px)
  wird gesendet. „🧠 Neu beschreiben"-Knopf im Vollbild.
- **Drei getrennte KI-Modelle, automatisch nach Dateityp:** `mistral-ocr-latest` (Text aus Bild/
  Scan) · `pixtral-12b-2409` (Bild-Beschreibung) · `mistral-small-latest` (🧠 KI-Knopf, Text
  zusammenfassen). Getrennt + einzeln fail-soft.
- **Bild-Vorschau + Vollbild** (Muster Mein-Rezeptbuch): Thumb 320 px + Vorschau 1024 px/82 %,
  klickbar → Lightbox. In Suche UND Katalog. „Wiedersehen heilt" (erneut einwerfen ergänzt fehlende
  Vorschau). Bilder werden fürs Verstehen runtergerechnet (1024 px, nur RAM, Original unberührt).
- **Ladebalken** (voll breit, Datei·%·MB) + **🔬 Analyse-Diagnose** (Verlauf überlebt Abstürze,
  Kopieren/Leeren) — hat mehrere Fehler sichtbar gemacht.
- **Stufe 4 — kombinierende Mehrschritt-Suche:** Schalter „🔗 Verwandtes mitfinden".
- **Löschen mit Wahl:** 🗑 in Suche/Katalog/Vollbild → Dialog „nur aus Katalog / auch Original".
  Original stirbt nur auf ausdrückliche zweite Wahl (verbundener Ordner). „liest nur · bewegt nichts".
- **E-Mail-Anhänge auto-auspacken:** jeder Anhang (Bild/PDF/Office/Text) wird eigener Eintrag,
  Signaturen übersprungen. Schalter „📎 Anhänge automatisch mitlesen" (Standard an).

## Offene Vorschläge / nächste Schritte (priorisiert)

1. **Stufe 5 — Selbstlernende Sortierung** (der eigentliche Fahrplan-Punkt): aus Klaus'
   Korrekturen lernen (Classification-by-Retrieval / Prototypen über Embeddings, **kein
   Training**). Wenn Klaus einen Eintrag von Kategorie A nach B schiebt, merkt sich die Box das
   und sortiert Ähnliches künftig besser. Gut offline testbar.
2. **Stufe 1 — Katalog verschlüsseln:** `modules/jasonlib.js` (Tresor) ist da, aber der Katalog
   liegt noch unverschlüsselt in IndexedDB. Optionaler „Katalog-Safe" (Passwort → AES-GCM).
   Sicherheits-sensibel: erst Plan an Klaus.
3. **Kalibrierung der Beschreibung am Tablet:** prüfen, ob `pixtral-12b-2409` Klaus' Messer/
   Landschaften jetzt korrekt beschreibt. Falls Modell/Prompt nachjustieren nötig → eine Zeile.
   (Der 🔬-Verlauf ist das Werkzeug dafür.)
4. **Kleinere Bild-Beschreiber-Alternative fürs Tablet lokal (später/Stufe 7):** ein leichteres
   ONNX-Modell testen, das eine Session auf 1387-MB-Heap schafft — oder die echte Offline-Box.
5. **Optional:** Anhänge auch aus **inline** referenzierten Teilen; De-Dup-Anzeige bei
   Anhängen, die als Datei doppelt vorkommen.

## Datenverträge / Regeln, die bleiben
- Katalog-Eintrag: `{hash,name,path,ext,date,size,snippet,via,vector,tf,summary,category,dirId,
  nameTokens,dupes,tags,needsCap,thumb?,preview?,mail?,mailBody?}`.
- `via`-Herkunft ehrlich: „Bild · Datum + Kamera + Ort + Einstellungen [+ Bild-Beschreibung(…)]".
- Bild-Beschreiber-Modelle: lokal `pb_caption_model`/`pb_caption_baseurl`, EU-Schalter
  `pb_caption_eu`. Anhänge-Schalter `pb_mail_attach`. Diagnose `pb_diag_log`.
- Drift-Guard: `modules/01,02,03,04,05,05b,23,noble` byte-1:1 (nicht abwandeln).

## Befehle
```bash
npm test        # Beweis: Drift-Guard + 24 e2e-Suiten (Chromium headless)
npm run serve   # python3 -m http.server 8000
```

## Abschluss-Befehl (Brief-Kette — nie abreißen lassen)
Am Ende der nächsten Sitzung: Stand hier fortschreiben (oder neuen Brief), Pflichtlektüre +
diesen Abschluss-Befehl wiederholen, den vollständigen Brief als **Codeblock im Chat** ausgeben.
