# Werbefilm „Private Brain Pro: die App baut sich zusammen“

**Eine Fassung (Klaus 2026-10-25):** 1:45, 1920×1080, 30 Bilder/s, H.264 High (Level 4.1, yuv420p), AAC 48 kHz Stereo
192 kbit/s, `+faststart`. Kein Hochkant, keine zweite Musikfassung mehr.

**Neu aufgenommen am 2026-10-25 im neuen Design** (Android .35, Umbau aus PR #76–#81): Liniensymbole, Suche mit Schalter
„Bedeutung“ und Sprachkürzel, Explorer-Baum, Postfach mit „Alle Konten“ und „Übersetzen“, Siegel mit ★ in der Kugel.
Ablauf, Schnitt, Texte und Effekte sind unverändert; nur die Seitenbilder kommen aus der neuen Oberfläche, die
Beschriftungen (`CALLS`), Hand und Prüf-Strahl zeigen auf die neuen Stellen.

**Ton:** Die Musikdateien liegen nicht im Repo. Weil die Zeitleiste gleich blieb,
liegt unter den neuen Bildern die fertige Tonspur des Films vom 2026-10-23 (DJ-Mix samt Geräuschen, aus FP Video
`private-brain-pro-film`, SHA-256 geprüft): `node mix.mjs --ton=<alter-film.mp4>`. Die leisen Einrast-Klicks der
Suchseite liegen deshalb an den alten Stellen (die neue Seite hat mehr Teile); hörbar ist das kaum.

Früher (2026-10-23): quer und hochkant auf FP Video, Siegel korrigiert (PR #73). Diese Fassungen werden ersetzt.

## Inhalt (Klaus' Wünsche)

- Die App „besteht erst aus vielen Teilen“: der Seitengrund als **bunte 3D-Puzzleteile** (Gedankenfarben, Tiefe aus drei
  Ebenen), die beim Einrasten zur echten App werden; danach fliegen Knöpfe, Texte und Karten in Schwüngen herbei.
  Beim Landen feuern **Nervenzellen** (verzweigte Fäden), **Synapsen** verbinden frisch gelandete Teile, kleine
  **Beschriftungen** mit geschwungener Linie erklären, was entsteht. „Zack“: Aufblitzen, welliger Ring, fertige Seite.
- Reihenfolge: Suche (mit Workflow-PDF-Finger), Explorer, Postfach, Schutz-Prüfung mit Stempel; Ring der fertigen Seiten;
  Wasser und Tresor („Keine Cloud“); echte Bilder aus dem Family-Projekt-Film (Zahl „25 Apps“ verdeckt durch „Eine
  wachsende Familie von Apps“); Werkzeuge im Orbit; Geräte Android/Windows; „Deine Daten. Dein Gerät. Deine Kontrolle.“; „Einlesen. Prüfen.
  Finden.“; Schluss mit Logo und family-projekt.de.
- **Musik als DJ-Mix:** Family Projekt (F-Dur, 128 BPM) 0:00–0:37, „Risk“ aus dem Sicherheitsfilm (E-Dur, 117,5 BPM →
  +1 Halbton, auf 128 BPM) 0:37–1:00, Family Projekt 1:00–1:15 (die Family-Projekt-Bilder laufen auf ihrer Musik),
  „Friends“ aus dem Workflow-PDF-Erklärvideo (C-Dur, 112,3 BPM → 128) 1:15–1:30, Family Projekt 1:30–1:45.
  Überblenden je zwei Takte. Tempo und Tonart mit librosa gemessen. Dazu eigene Geräusche (Einrasten, Zack, Stempel).
  Die Musikdateien liegen **nicht** im Repo; sie kommen aus den Videos der Family-Projekt-Videoseite und Workfloh-PDF-Page.

## Neu bauen

0. `npm ci && npm run build:web` (baut `www/`; mit Node 22 hinter dem Proxy die 8 OCR-Dateien aus
   `tools/native/ocr-assets.json` vorher mit curl nach `.cache/ocr/pinned/<sha256>` legen, der Bau prüft sie). Bilder, Hilfsbilder und Ergebnis bleiben außerhalb von Git (`.gitignore`).
1. `aufnahme.mjs <www> bilder` nimmt die App mit erfundenen Beispieldaten auf (je Seite Voll- und Skelettbild,
   `teile.json` mit den Lagen aller Teile), 1440×810. Die Originale der Beispieldateien kommen aus
   `../handbuchvideo/beispiel/` und liegen „im App-Speicher“ (nachgestellt), damit die Karten „Lokale Kopie“ und echte
   Vorschauen zeigen. Für das Handy-Bild: `W=390 H=834 PRE=handy- node aufnahme.mjs <www> <ordner>`, davon
   `handy-postfach.png` nach `bilder/`. Zugeklappte Menüs (Deckkraft 0 an einem Elternteil) zählen nicht als Teile.
2. `film.html` zeichnet jedes Bild aus `render(t)`; `schnitt.mjs --standbilder=…` für Probebilder,
   `schnitt.mjs --film [--von --bis --weiter=1]` für alle Bilder (in vier Teilen parallel gut 25 Minuten).
3. `mix.mjs --ton=<datei>` legt eine fertige Tonspur unter die Bilder (so am 2026-10-25). Ohne `--ton` mischt `mix.mjs`
   Musik und Geräusche selbst und baut das MP4. Neben `film.html` werden erwartet: `assets/` (Logo und Hand aus
   `../handbuchvideo/`, Werkzeug-Symbole aus `native/tool-icons/`, Family-Projekt-Bilder `fp/m<Musik-Bild>.jpg` = Bild
   675–2024 des FP-Werbevideos `werbevideo-67s`, mit ffmpeg herausgezogen), für den eigenen Mix außerdem `fp/musik.m4a`,
   `musik/neu-befehle-quer.wav`, `musik/workfloh-pdf-quer.wav`.

⚠ Grenzen: am Tablet nicht angesehen; die App läuft im Browser mit nachgestellten Android-Teilen (Mail, Speicher, Version); in den Musikstücken aus den fertigen Filmen stecken deren eigene leise Geräusche.
