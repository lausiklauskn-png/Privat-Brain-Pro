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
- **Musik** sucht Klaus selbst aus (Pixabay, <https://pixabay.com/de/music/>). Die Datei kommt **nie** ins Repo.

```bash
# Repo: npm install (playwright-core), www gebaut; Werbefilm-Video und effekte.wav unter ../film/ (siehe docs/film/README.md)
CB_CHROMIUM=/pfad/chrome node aufnahme.mjs          # --probe: nur Anfang bis Suchen · --dev: nur Standbilder
node schnitt.mjs quer                               # App-Teil mit Klicks
MUSIK=/pfad/titel.mp3 node zusammen.mjs             # ohne MUSIK: …-ohne-musik.mp4
```
