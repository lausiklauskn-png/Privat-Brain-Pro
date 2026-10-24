# Nachfolgebrief 2026-10-24: Private Brain Pro modern gestalten

## Aktuelle Klarstellung und erreichter Stand

Klaus hat die vier ersten Entwürfe (Klarblau, Graphit, Petrol, Nachtblau) positiv
bewertet und klargestellt: **Outlook ist Anregung und Vergleich, keine Kopiervorlage.**
Jetzt wird der App-Zweck mit den vorhandenen Funktionen abgeglichen. Maßstab ist
das Sammeln, gemeinsame Ordnen und Wiederfinden eigener Inhalte.
[Ergebnis, Grenzen und gesicherter Designstand](docs/ZIEL-FUNKTIONEN-DESIGNSTAND-2026-10-24.md).
Die folgenden ursprünglichen Vorbildformulierungen sind in diesem Sinn zu lesen.

## Klaus' Auftrag (2026-10-24, wörtlich)

> „Es geht jetzt um die Verbesserung des Designs und der Funktionsbutton innerhalb von Private Brain. Sieht noch sehr
> unmodern aus. Zu viele Icons, nicht Icons, sondern Emojis mit Mannequins im Köpfen und Lupen. Wir orientieren uns
> jetzt an modernem Design wie Outlook oder anderen."

Klaus' Vorbild-Bilder (Outlook im Web) stehen unten unter **Vorbilder** und liegen in `docs/design/vorbild-2026-10-24/`.

## Ziel in einem Satz

Eigenständige, ruhige und moderne Oberfläche für Private Brain Pro: einheitliche
**Linien-Symbole statt Emojis**, wenige klar beschriftete Knöpfe, ordentliche
Abstände und eine klare Rangordnung nach dem App-Zweck. Die vorhandenen Daten,
vier Sprachen und geschützten Module bleiben beim späteren Umbau erhalten.

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

## Vorbilder (Klaus' Bilder, 2026-10-24)

Klaus hat am Tablet (geteilter Bildschirm, je Fenster etwa 1000 px breit) Private Brain Pro links und Outlook im Web rechts
nebeneinander gestellt. Abgelegt ist **nur die Outlook-Seite** in `docs/design/vorbild-2026-10-24/`. Seine E-Mail-Adresse,
der Einmalcode, der Outlook-Kontoname und die Absender aus seinem Postfach sind verwischt oder abgeschnitten. Das Depot ist
öffentlich. Die Private-Brain-Seite seiner Bilder zeigt echte Post und liegt **nicht** im Depot; den Ist-Zustand zeigen die
Bilder mit Beispieldaten in `ist-2026-10-24/`.

| Bild | Was daran Vorbild ist |
|---|---|
| `15-mail-vollbild.jpg` | Werkzeugleiste als **ein abgerundeter Kasten** oben: „Neue E-Mail“ (einziger Vollton-Knopf, mit ⌄ für mehr) · Löschen · Archivieren · Melden · Verschieben in · Allen antworten · Gelesen/Ungelesen · Kennzeichnen. Linien-Symbol **und** kurzes Wort, alles in **einer Zeile**, Rest in „⋯“ |
| `01-mail-ansicht.jpg` | Reiter Datei · Startseite · Ansicht · Hilfe; Liste mit Reitern „Relevant/Sonstige“, Sortieren/Filtern als kleine Symbole; leerer Zustand mit ruhigem Bild und einem Satz |
| `02-datei-menue.jpg`, `03-neue-email-menue.jpg` | Ausklappmenüs: **Symbol + Wort je Zeile**, Trennlinien, Hinweistext beim Zeigen |
| `04`–`09` Einstellungen | Einstellungen als **großes Fenster mit drei Spalten**: Bereiche (Konto, Allgemein, E-Mail …) → Unterpunkte → Inhalt; oben „Einstellungen suchen“; Schalter, Auswahlfelder, blauer Hauptknopf „＋ … hinzufügen“ |
| `06-einstellungen-kategorien.jpg` | Kategorien als farbige **Umriss-Etiketten**, je Zeile ☆ ✎ 🗑 als Linien-Symbole |
| `10`, `11` Kalender | Kopf „Heute ‹ › Oktober 2026 ⌄“, viel Weißraum, nur der heutige Tag farbig |
| `12`, `13` Aufgaben | kleine Ausklapp-Karte „Gruppieren nach“; Hinweis-Blase für Erstbenutzer |
| `14-kontakte.jpg` | linke Liste mit Linien-Symbolen, ausgewählter Eintrag hell hinterlegt; leerer Zustand mit Bild, Satz und **einem** Knopf |

### Was Klaus dazu gesagt hat (2026-10-24, zusammengefasst)

1. **Einfache Strichsymbole** statt bildartiger Emojis, **selten Volltonfarben**. Für die Werkzeuge im ☰-Menü bleiben die
   **eigenen Tool-Symbole** (`native/tool-icons/`). Manche jetzigen Symbole sind gut, z. B. der **Brief**.
2. **Bedienleiste oben:** Wörter **kleiner**, damit alles in **eine Zeile** passt; die Leiste passt sich der Wortbreite an.
   **Keine Doppelzeilen und keine Wortbrüche** („Posteing-ang“, „Papierkor-b“, „Bedeutungssuc-he“ wie jetzt).
3. **Vollton nur für den aktiven Zustand oder den Hauptknopf**, sonst helle Farben. Nicht wie „70er, 80er, 90er“.
4. **Mehr Leben:** etwas mehr **Schatten und Verläufe** in den Flächen (wie Outlooks große Ansichten und leere Zustände).
5. **Aufteilung:** **knopfartige Container**, in denen die Knöpfe sitzen (nicht überall). Platz besser nutzen. Die Suche ist in Ordnung.
6. **Konto kurz statt langer Adresse** (z. B. „T-Online“ statt `name@t-online.de`); die Zeile „… · Posteingang“ entfällt,
   der markierte Ordner zeigt es schon.
7. **Bedienung oben statt an der Seite** und weniger doppelt: „Neue E-Mail“, Papierkorb, Verschieben und die übrigen Aktionen
   in **eine** Leiste oben, wie bei Outlook.
8. **Senden:** ein allgemein bekanntes Symbol „Brief abschicken“, **kein Papierflugzeug**.
9. **Pfeile** dürfen viel vorkommen; die **Punkte für Menüs (⋯) etwas dicker**.
10. **Beim Schreiben** stehen Symbole, die sich nicht erklären (leeres Kästchen, Kästchen mit Fenster, dreimal Punkte) →
    jedes bekommt ein Wort oder einen Hinweistext.

### Was die Bilder zusätzlich zeigen (aus dem Vergleich, nicht von Klaus gesagt)

- Bei etwa 1000 px Fensterbreite ist die **Ordnerspalte** von Private Brain zu schmal: Namen brechen mitten im Wort, Zahlen
  stapeln sich. In voller Breite (Klaus' Bild in ganzer Breite) stehen Name und Zahl sauber in einer Zeile. Ordnerspalte:
  Mindestbreite oder nur Symbol + Zahl, Name als Hinweistext.
- „Bedeutungssuche“ bricht im Umschalter um; „Verschieben nach …“ wird auf „Verschieb“ abgeschnitten.
- Die Kopfzeile von Private Brain trägt Symbol + Wort schon ordentlich; darunter beginnt der Bruch im Stil (Emojis, Vollton-Knöpfe,
  braune Fläche „Bedeutungssuche“).

## Zusatzwunsch: Kontakte mit Gesichtern, wie bei WhatsApp (Klaus 2026-10-24)

> „Kontaktlisten mit Gesichtern, nicht mit Buchstaben … wie bei WhatsApp … die Kontakte, die ich im WhatsApp habe, möchte ich
> auch in dem E-Mail-Programm als Kontakt angezeigt haben. Denn wenn von da eine E-Mail kommt, dann weiß ich, ah, das ist
> direkt von dem … Wo kein Kontaktfoto ist, brauche ich das auch nicht … aktualisierte Statusfotos."

Statt des Buchstabenkreises (A, N, B …) in der Mail-Liste soll das **Foto der Person** stehen, wenn eins da ist. Gibt es keins,
bleibt es wie jetzt.

**Was technisch geht (vor dem Bau am Gerät prüfen, nicht angenommen):**

- **Android-Adressbuch** (`ContactsContract`, Berechtigung `READ_CONTACTS`, erst auf Klaus' Tipp gefragt): Name, E-Mail-Adressen,
  Telefonnummern und das **Kontaktfoto**, das im Adressbuch steht. Abgleich über die **Absender-Adresse** der Mail. Das ist der
  verlässliche Weg.
- **WhatsApp** legt für seine Kontakte eigene Einträge im Android-Adressbuch an (Kontotyp `com.whatsapp`). Daran lässt sich
  erkennen, **ob jemand WhatsApp hat**, und ein Knopf „In WhatsApp schreiben“ kann den Chat öffnen (`https://wa.me/<Nummer>`).
- ⚠ **Die WhatsApp-Profil- und Statusfotos gibt WhatsApp nach bisherigem Wissen nicht an andere Apps heraus.** Es gibt dafür keine
  offene Schnittstelle. Sichtbar ist nur, was im Android-Adressbuch als Foto steht (von Klaus, Google oder dem Gerät gesetzt).
  „Immer das aktuelle Statusfoto“ ist damit sehr wahrscheinlich **nicht** machbar. Das muss Klaus **vor** dem Bau so gesagt
  bekommen, keine stille Ersatzlösung.
- Nur lesen, nichts ins Netz: Fotos und Zuordnung bleiben auf dem Gerät. Die Zuordnung „Adresse → Kontakt“ liegt verschlüsselt
  wie die übrigen Daten. Ohne Erlaubnis oder unter Windows: Buchstabenkreis wie bisher.
- Eigener Bauabschnitt **nach** der Musterseite Mail. Er ändert Android-Code (neues Plugin) und braucht deshalb Klaus' Test am Tablet.

## Vorschlag für den Ablauf

| Schritt | Inhalt | Ergebnis für Klaus |
|---|---|---|
| 0 | Vorbilder auswerten: Farben, Schrift, Abstände, Kopfleiste, Liste/Lesebereich (Outlook) | eine Seite „So soll es aussehen“ mit 3–5 Regeln |
| 1 | Symbolsatz: alle gebrauchten Begriffe sammeln (Tabelle Emoji → Symbol → Wort), fehlende Symbole zeichnen oder übernehmen | Tabelle zum Abhaken |
| 2 | **Musterseite Mail** (Outlook ist das Vorbild): Ordnerliste, Mail-Liste, Lesebereich, Werkzeugleiste | Vorher/Nachher bei 412 · 768 · 1280 px, hell + dunkel |
| 3 | Nach Klaus' Ja: Suche · Explorer · Dateien hinzufügen · Einstellungen · ☰-Menü/Werkzeuge · Dialoge (Prüfbericht, Tresor, Freischalten) | je Seite ein Vorher/Nachher-Bild |
| 4 | Befund-Marken (✓ ⚠ ✗) einheitlich, Siegel/Mycel nur per CSS | Bilder der Marken in allen Zuständen |
| 4b | Kontakte mit Gesichtern (Android-Adressbuch, WhatsApp-Knopf), siehe Zusatzwunsch | erst Machbarkeit am Gerät, dann Bild |
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
