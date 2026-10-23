# Handbuchvideo Private Brain Pro (Klaus 2026-10-23)

Klaus: *„ein Erklärvideo … genauso wie Workflow PDF … mit dem Finger“*, *„zwischen 2 und 3 Minuten … alle Hauptteile“*,
*„Elemente aus dem Video von Private Brain, wo es sich zusammensetzt … als Start“*.

- **Aufbau:** 0–22,4 s der Puzzle-Aufbau aus dem Werbefilm (`docs/film/`, mit dessen Effekten, ohne dessen Musik), dann
  die echte App (`www/`) im Tablet-Rahmen der Bühne `buehne.html` (aus Workfloh-PDF-Page `video/`, in Private-Brain-Farben).
  Die Comic-Hand tippt echte Knöpfe, unten ein Erklärband, links das Kapitel.
- **Kapitel:** Dateien hinzufügen · Suchen (Bedeutung, Name, 🎤) · Explorer · Prüfen · Postfach (Alle Konten) · Übersicht ·
  Privat (Speicherort, Internet-Lampe) · Werkzeuge (☰, vier Sprachen, Hell/Dunkel, Siegel) · Schluss. Länge 2:59.
- **Daten:** alles erfunden (`beispiel/`, Konten `jens@` und `familie@example.invalid`). Android-Teile sind im Browser
  nachgestellt (ProMail, ProVault, ProNetwork, ProDevice in `aufnahme.mjs`); geprüft am Gerät ist damit nichts.
- **Seitenwechsel** (Klaus 2026-10-23): erst Zoom auf den Knopf, damit man liest, was angetippt wird; dann setzt sich die neue
  Seite ruhig aus durchscheinenden Puzzleteilen in gedeckten App-Farben zusammen, jedes Mal anders (`ARTEN` in `buehne.html`).
  Wichtige Tipps zoomen vorher heran (`tippe(…, { lesen })`). Bühne grau-schiefer wie das Logo.
- **Länge 3:15**, zwei Fassungen auf der FP-Videoseite: `private-brain-pro-handbuch` (Inspiring → City Travel, Tempo 123,5 BPM
  und A-Dur angeglichen, Schläge übereinander) und `private-brain-pro-handbuch-uplifting` (Corporate Uplifting).
  `python3 musik.py <Videolänge>` baut beide Tonspuren.
- **Musik** sucht Klaus selbst aus (Pixabay, <https://pixabay.com/de/music/>). Die Datei kommt **nie** ins Repo.
- ⚠ Ausgabe immer **yuv420p, H.264 High**: die erste Fassung war yuv444p und zeigte auf Handys nur Ton (`zusammen.mjs`).
- **Stand 2026-10-23 (Siegel korrigiert, neu aufgenommen):** quer 3:15 in zwei Musikfassungen, hochkant 2:51 **nur** mit
  Corporate Uplifting (läuft dort am Stück, ohne Schnitt). Auf FP Video nur Full HD: `private-brain-pro-handbuch`,
  `private-brain-pro-handbuch-uplifting`, `private-brain-pro-handbuch-hoch-uplifting` (720p und Hochkant-Mix entfernt).
- **Hochkant** (`node aufnahme.mjs --hoch`, `HOCH=1 node zusammen.mjs`): Handy-Ansicht, Beispiele aus `beispiel-hoch/`,
  Puzzle-Anfang mittig mit weichem Rand; „Alle Konten“ und das Umschalten von Sprache/Hell-Dunkel fehlen dort
  (am Handy liegt das hinter der Ordnerliste bzw. das Menü schließt beim Umschalten). FP-Video: `private-brain-pro-handbuch-hoch`,
  `private-brain-pro-handbuch-hoch-uplifting`.
- Sonnenuntergänge in `beispiel/` und `beispiel-hoch/` hat Klaus mit ChatGPT erzeugen lassen (2026-10-23).
- Beim Heranzoomen blendet die Bühne die Kapitelzeile aus (sie lag sonst unter dem Bild).
- Keine Worte wie „in Heimarbeit gebaut“ (Klaus 2026-10-23: klingt beim Verkauf unprofessionell).

```bash
# Repo: npm install (playwright-core), www gebaut; Werbefilm-Video und effekte.wav unter ../film/ (siehe docs/film/README.md)
CB_CHROMIUM=/pfad/chrome node aufnahme.mjs          # --probe: nur Anfang bis Suchen · --dev: nur Standbilder
node schnitt.mjs quer                               # App-Teil mit Klicks
MUSIK=/pfad/titel.mp3 node zusammen.mjs             # ohne MUSIK: …-ohne-musik.mp4
```
