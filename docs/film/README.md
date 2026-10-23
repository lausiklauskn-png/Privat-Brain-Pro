# Werbefilm „Private Brain Pro: die App baut sich zusammen“ (Klaus 2026-10-23)

1:45, 1920×1080, 30 Bilder/s. Auf der Family-Projekt-Videoseite (Stand 2026-10-23, Family-Projekt.de-Video #23):
[quer abspielen](https://lausiklauskn-png.github.io/Family-Projekt.de-Video/abspielen.html?id=private-brain-pro-film) ·
[quer laden](https://lausiklauskn-png.github.io/Family-Projekt.de-Video/index.html?laden=private-brain-pro-film) ·
[hochkant](https://lausiklauskn-png.github.io/Family-Projekt.de-Video/abspielen.html?id=private-brain-pro-film-hoch).
Nur noch Full HD (Klaus: „nur die besten Varianten“); die 720p-Fassung ist von der Seite genommen.
**Hochkant:** derselbe Film mittig (Ränder links/rechts je 140 px abgeschnitten) auf dunklem Grund aus dem ersten
Filmbild, darüber Logo, „Private Brain Pro“, „Dein privates zweites Gehirn“, darunter „Suchen · Ordnen · Prüfen“ und
family-projekt.de (ffmpeg, kein eigener Aufbau). **Siegel** (Klaus 2026-10-23): Bilder neu aufgenommen, ★ in der Kugel.

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

1. `aufnahme.mjs <www> bilder` nimmt die App mit erfundenen Beispieldaten auf (je Seite Voll- und Skelettbild,
   `teile.json` mit den Lagen aller Teile).
2. `film.html` zeichnet jedes Bild aus `render(t)`; `schnitt.mjs --standbilder=…` für Probebilder,
   `schnitt.mjs --film [--von --bis --weiter=1]` für alle Bilder (in vier Teilen parallel gut 25 Minuten).
3. `mix.mjs` mischt Musik und Geräusche und baut das MP4. Neben `film.html` werden erwartet: `assets/` (Logo,
   Werkzeug-Symbole, Hand aus Workflow PDF, Family-Projekt-Bilder `fp/m<Musik-Bild>.jpg`), `fp/musik.m4a`,
   `musik/neu-befehle-quer.wav`, `musik/workfloh-pdf-quer.wav`.

⚠ Grenzen: am Tablet nicht angesehen; in den Musikstücken aus den fertigen Filmen stecken deren eigene leise Geräusche.
