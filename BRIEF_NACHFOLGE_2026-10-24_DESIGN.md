# Nachfolgebrief 2026-10-24: Private Brain Pro modern gestalten

## Klaus' Auftrag (2026-10-24, wörtlich)

> „Es geht jetzt um die Verbesserung des Designs und der Funktionsbutton innerhalb von Private Brain. Sieht noch sehr
> unmodern aus. Zu viele Icons, nicht Icons, sondern Emojis mit Mannequins im Köpfen und Lupen. Wir orientieren uns
> jetzt an modernem Design wie Outlook oder anderen."

Klaus schickt dazu Vorbild-Bilder; sie stehen unten unter **Vorbilder** und liegen in `docs/design/vorbild-2026-10-24/`.

## Ziel in einem Satz

Ruhige, moderne Oberfläche wie Outlook: einheitliche **Linien-Symbole statt Emojis**, wenige, klar beschriftete
Knöpfe, ordentliche Abstände und eine klare Rangordnung. Was die App kann, bleibt gleich: gleiche Funktionen,
gleiche Daten, gleiche vier Sprachen.

## Ist-Zustand (gemessen 2026-10-24 auf main `28ed114`)

- **885 Emoji-Stellen in 25 Dateien** (ohne die byte-1:1-Module). Am häufigsten: → 76 · ✓ 75 · ⚠ 62 · 🛡 61 · ← 35 · 📁 34 · 🔒 32 ·
  🔑 27 · ↕ 26 · 🗑 25 · 📎 24 · 🌐 23 · ✉ 21 · ⚡ 16 · 📥 14 · 🔓 14 · 🧩 14 · 🛠 13 · 📰 13 · 🔗 10 · 🔎 10 · 🧠 10 · 🤖 9 · 🔐 9 · 🔏 8 · 🎤 7 · 👥 4 …
- Am meisten Emojis haben: `index.html` (192) · `native/native-mail-index.js` (128) · `assets/sbkim-andock-wizard.js` (96, Kanon, siehe
  unten) · `assets/workspace.js` (93) · `native/native-license.js` (85) · `native/native-check.js` (69) · `native/native-vault.js` (31) ·
  `native/native-tools.js` (30) · `native/native-mycel.js` (28) · `native/native-protect.js` (24) · `assets/live-mail.js` (20).
- **Es gibt schon einen kleinen Satz Linien-Symbole:** `native/native-toolbar.js`, Objekt `paths` + `icon(key)` (24×24, nur Striche):
  search, intake, explorer, mail, dash, order, dupes, settings, back, next, refresh, compose, more, menu, reply, forward, trash, all,
  view, images, up, home, close, share, external, moon, archive, star, read, save. Die Kopfleiste und die Navigation nutzen ihn
  schon, deshalb sieht die oberste Zeile ordentlich aus und alles darunter nicht.
- Bilder des Ist-Zustands (Beispieldaten, Siegel schon korrigiert): `docs/design/ist-2026-10-24/`
  `breit-*.jpg` (1440 px) und `handy-*.jpg` (412 px) für suche · explorer · postfach · mail-offen · einlesen · einstellungen.

## Leitplanken (gelten weiter, nicht verhandelbar ohne Klaus)

1. **Knöpfe flach** (Klaus 2026-10-21): etwa 28 px, ohne Schatten, unsichtbare Tippfläche 7 px darüber und darunter, beim Antippen ×1,12.
   Neue Knöpfe nicht größer bauen. Symbole statt Wörter nur, wo allgemein bekannt (Lupe, Zahnrad, ☰, ⟳); sonst Symbol **und** kurzes Wort.
2. **Vier Sprachen** DE · EN · RU · PL, **Hell und Dunkel**. Jede neue Beschriftung in allen vier Sprachen.
3. **Byte-1:1-Module bleiben unverändert** (Drift-Guard): `modules/*` (u. a. 16 Siegel, 17 Widget, 23-UI Mycel), `assets/sbkim-andock-wizard.js`,
   `assets/installieren.js`, Modul 25 und die Prüfer. Ihre Emojis lassen sich nur über **app-eigenes CSS** verbergen oder umgestalten
   (wie beim Siegel in `native/native.css`), nie in der Datei selbst. Will Klaus dort etwas anders, wird es in Sage gepflegt.
4. **Eine Quelle für Symbole:** den vorhandenen Satz in `native/native-toolbar.js` zu einem gemeinsamen Modul ausbauen (z. B.
   `native/native-icons.js`, `PBIcon(name)`), nicht pro Datei eigene SVGs. Offline, kein CDN. Wird ein fertiger Satz übernommen
   (z. B. Lucide, ISC-Lizenz), dann nur die benutzten Symbole als Kopie mit Lizenzvermerk in `THIRD_PARTY`.
5. **Tests prüfen oft Texte mit Emojis** (z. B. `test-mycel.mjs`: „🌐 Mycel-Netz“, „🔏 Siegel wieder zeigen“). Wer ein Emoji ersetzt, zieht
   die Probe im selben Commit nach und lässt sie **rot werden, wenn das Alte zurückkommt** (Gegenprobe), statt sie nur anzupassen.
6. **Bedeutung nicht verlieren:** ✓ ⚠ ✗ sind Befunde (Prüfung, Schutz). Sie werden zu kleinen farbigen Marken mit Symbol **und** Text
   (Farbe nie allein), nicht ersatzlos gestrichen. Nie „virenfrei“ schreiben.
7. **Plan vor Code:** Klaus bekommt zuerst eine Musterseite (Vorher/Nachher-Bild) zum Absegnen, dann wird Seite für Seite umgebaut.
   Freigabe von Releases nur auf seine ausdrückliche Bitte.
8. Am Tablet misst nur Klaus. Bis dahin: „ungeprüft am Gerät“.

## Vorbilder (Klaus' Bilder)

_Die Bilder folgen; sie werden hier eingetragen, je mit einem Satz, was daran zum Vorbild taugt._

## Vorschlag für den Ablauf

| Schritt | Inhalt | Ergebnis für Klaus |
|---|---|---|
| 0 | Vorbilder auswerten: Farben, Schrift, Abstände, Kopfleiste, Liste/Lesebereich (Outlook) | eine Seite „So soll es aussehen“ mit 3–5 Regeln |
| 1 | Symbolsatz: alle gebrauchten Begriffe sammeln (Tabelle Emoji → Symbol → Wort), fehlende Symbole zeichnen oder übernehmen | Tabelle zum Abhaken |
| 2 | **Musterseite Mail** (Outlook ist das Vorbild): Ordnerliste, Mail-Liste, Lesebereich, Werkzeugleiste | Vorher/Nachher bei 412 · 768 · 1280 px, hell + dunkel |
| 3 | Nach Klaus' Ja: Suche · Explorer · Dateien hinzufügen · Einstellungen · ☰-Menü/Werkzeuge · Dialoge (Prüfbericht, Tresor, Freischalten) | je Seite ein Vorher/Nachher-Bild |
| 4 | Befund-Marken (✓ ⚠ ✗) einheitlich, Siegel/Mycel nur per CSS | Bilder der Marken in allen Zuständen |
| 5 | Proben: Emoji-Wächter (keine Emojis mehr in den umgebauten Dateien, außer bewusst erlaubten), Sprachen, Breiten 320–1280, kein Querlaufen, Kontrast | `npm run test:native-web` grün, Gegenprobe gefangen |

## Was diese Sitzung hinterlässt (2026-10-23/24)

- **Siegel korrigiert** (PR #73, auf main): ★ in der Kugel, kein Wort „SIEGEL“ ab 600 px. Probe in `tools/native/test-mycel.mjs`.
  **Noch in keiner veröffentlichten App** (Android bleibt .28, Windows .29), erst mit dem nächsten Release.
- **Videos** neu aufgenommen (Siegel korrigiert), nur Full HD auf FP Video (Family-Projekt.de-Video #23):
  Werbefilm quer + hochkant, Handbuch quer ♪1/♪2, Handbuch hochkant (Corporate Uplifting). Bauanleitungen `docs/film/`,
  `docs/handbuchvideo/`. Der hochkant-Werbefilm ist der Querfilm mittig auf dunklem Grund, kein eigener Aufbau.
- **FP Video:** `--anlauf` (erste Teile 2 · 4 · 8 MB) für schnellen Start (#21); Wächter gegen stehende Leitung, Fortschritt im Teil (#22).
  ⚠ Die Kopie von `abspielen-kern.js` in **family-project** hat den Wächter noch nicht (Depot hier nicht erreichbar).
- **Geschenkseite** für Jens kompakt, nur Querformat Full HD: `https://claude.ai/artifact/XPEQpCH7axafiTRB7y1RB7` (Version 10),
  Quelle `docs/geschenk/geschenk-jens.html`.
- **CI:** zwei Ausfälle waren Runner-Fehler (Windows-Werkzeugübergabe einmal, Android-SDK „Error on ZipFile unknown archive“
  zweimal); auf demselben Commit je grün nachgewiesen.

## Lehren dieser Sitzung

- **Ein Kanon-Modul kann im eigenen Umbau Reste zeigen**, die der Kanon nur bei schmalen Fenstern ausblendet (Wort „SIEGEL“ ab 600 px).
  Probe deshalb über mehrere Breiten (360–1280), nicht nur am Handy.
- **Ein `fetch` ohne Frist wartet ewig**, wenn die Leitung steht. Lange Downloads brauchen einen Stillstands-Wächter und
  Fortschritt innerhalb des Teils.
- **Ein abgebrochener Werkzeuglauf hinterlässt halbe Zustände** (FP Video: ein Video halb neu zerlegt). Vor dem Weitermachen alle
  Einträge gegen ihre Prüfsummen rechnen, dann gezielt zurücksetzen.
- **Vor dem Zusammenführen prüfen, ob der Zweig den neuesten main enthält** (`git merge-base --is-ancestor origin/main HEAD`);
  ein veraltetes `origin/main` hätte die Hänger-Reparatur wieder entfernt.
- **Alte Ton-Markendateien** (`toene-*.json` früherer Fassungen) mischen sich in neue Filme; beim Neubau nur die aktuellen verwenden.
