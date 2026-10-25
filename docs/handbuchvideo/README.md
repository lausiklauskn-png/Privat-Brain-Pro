# Handbuchvideo Private Brain Pro

Klaus: *„ein Erklärvideo … genauso wie Workflow PDF … mit dem Finger“*, *„alle Hauptteile“*,
*„Elemente aus dem Video von Private Brain, wo es sich zusammensetzt … als Start“*.

**Eine Fassung (Klaus 2026-10-25):** quer, 3:43, 1920×1080, 30 Bilder/s, H.264 High (Level 4.1, yuv420p), AAC 48 kHz
Stereo 192 kbit/s, `+faststart`. Kein Hochkant, keine zweite Musikfassung mehr.

## Stand 2026-10-25: neu aufgenommen im neuen Design (Android .35)

- **Aufbau:** 0–22,4 s der Puzzle-Aufbau aus dem neuen Werbefilm (`docs/film/`), dann die echte App (`www/`) im
  Tablet-Rahmen der Bühne `buehne.html`. Die Comic-Hand tippt echte Knöpfe, unten ein Erklärband, links das Kapitel.
- **Kapitel:** Dateien hinzufügen · Suchen (Schalter „Bedeutung“, Mikrofon, Sprachkürzel) · Explorer · Prüfen ·
  Postfach (Lesen, **Übersetzen** auf dem Gerät, **Spalten ziehen**, Alle Konten) · Privat (Speicherort, Internet-Lampe) ·
  Werkzeuge (☰, vier Sprachen, **vier Farbthemen** Klarblau/Graphit/Petrol/Nachtblau statt Hell/Dunkel) · Schluss.
- **Daten:** alles erfunden (`beispiel/`, Konten `jens@` und `familie@example.invalid`). Android-Teile sind im Browser
  nachgestellt (ProMail, ProVault, ProNetwork, ProDevice in `aufnahme.mjs`); geprüft am Gerät ist damit nichts.
  Die Texterkennung läuft echt (Tesseract im `www`-Bau); bei den Fotos meldet die Prüfung deshalb ehrlich „Teilweise geprüft“.
- **Schnitt beim Einlesen:** Lesen, Texterkennung und Prüfung der sechs Beispieldateien dauern im Browser fast eine
  Minute. Diese Wartezeit wird nicht aufgenommen (`schnitte` in `zeiten.json`, `schnitt.mjs` schneidet sie heraus).
- **Ton:** Die Musik (♪1 „Inspiring“ → „City Travel“) liegt nicht im Repo. Unter dem neuen Video liegt die fertige Tonspur
  des Handbuchs vom 2026-10-23 (FP Video `private-brain-pro-handbuch`, SHA-256 geprüft), darüber die neuen Tipp- und
  Puzzle-Geräusche. Weil das neue Video 28 s länger ist, wiederholt `zusammen.mjs` ab 2:56 ein Stück „City Travel“ in
  ganzen Takten (15 Takte, weich überblendet). Die Geräusche des Puzzle-Anfangs stammen aus der alten Tonspur.

```bash
# Repo: npm ci && npm run build:web; neuer Werbefilm fertig (docs/film/)
CB_CHROMIUM=/pfad/chrome node aufnahme.mjs          # --dev: nur Standbilder an den Szenenenden
node schnitt.mjs quer                               # App-Teil mit Klicks, ohne Musik
FILMVIDEO=/pfad/private-brain-pro-film.mp4 TON=/pfad/altes-handbuch.mp4 SCHNITT=176 \
  AUS=private-brain-pro-handbuch.mp4 node zusammen.mjs
# ohne TON wie früher: MUSIK=/pfad/titel.mp3 node zusammen.mjs (Musik sucht Klaus selbst aus, nie ins Repo)
```

## Regeln, die bleiben

- Ausgabe immer **yuv420p, H.264 High**: eine frühere Fassung war yuv444p und zeigte auf Handys nur Ton.
- Seitenwechsel: erst Zoom auf den Knopf, dann setzt sich die neue Seite aus Puzzleteilen zusammen (`ARTEN` in `buehne.html`).
- Beim Heranzoomen blendet die Bühne die Kapitelzeile aus.
- Keine Worte wie „in Heimarbeit gebaut“ (Klaus 2026-10-23).
- Sonnenuntergänge in `beispiel/` hat Klaus mit ChatGPT erzeugen lassen (2026-10-23).

⚠ Grenzen: am Tablet nicht angesehen. Auf Englisch übersetzt die App einen Teil der Einstellungen noch nicht (sichtbar im
Kapitel Werkzeuge). Ob die Takt-Wiederholung in der Musik ganz sauber auf dem Schlag liegt, ist nur am Spektrum
geprüft, nicht angehört.

Früher (2026-10-23): quer 3:15 in zwei Musikfassungen und hochkant 2:51 (`--hoch`, `beispiel-hoch/`, `HOCH=1`). Diese
Fassungen werden ersetzt; die Hochkant-Werkzeuge sind noch da, aber nicht neu geprüft.
