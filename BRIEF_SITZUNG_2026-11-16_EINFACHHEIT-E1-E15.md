# Brief für die nächste Sitzung: Einfachheit (E1–E15)

Klaus 16.11.2026: „Ich möchte vor allen Dingen die Einfachheit geklärt haben. Das möchte ich auf jeden Fall im neuen Bau, in der
neuen Sitzung machen.“ Grundsatz wie beim Datei-Organizer: **einfach ist genial, aber keine Funktion darf verloren gehen.**

## Ausgangslage

- Private Brain Pro **1.0.54** ist der Stand nach der Generalprüfung (PR #150; Nachweis `docs/VEROEFFENTLICHUNG-1.0.54.md`).
- Generalprüfung 16.11.: zehn Rollen, 80 Befunde, jeder von einem zweiten Prüfer gegengeprüft und bestätigt. Alle Befunde mit Beleg,
  Vorschlag und Gegenprüfung: `docs/design/generalpruefung-1.0.53/befunde.json` (Rollen: neuling, mail, ordnung, schmal, tastatur,
  datenweg, sprachen, fehlerjagd, vereinfacher, einstellungen).
- In 1.0.54 behoben: die echten Fehler und die großen Bedien-Hürden (Liste im obersten Absatz von `CLAUDE.md`).
- **Offen und Auftrag dieser Sitzung:** die Aufbau-Punkte E1–E15. Klaus hat zu jedem schon geantwortet (Tabelle). Grundregel von
  Klaus: „Immer Ja zum Vorschlag“, solange er nicht Nein sagt.

## Abhakliste mit Klaus' Antworten

| Nr. | Heute | Vorschlag | Klaus 16.11. |
|---|---|---|---|
| E1 | Kategorien an vier Stellen, jede zeigt etwas anderes | ein Ort für Kategorien, die anderen Stellen springen dorthin | Ja |
| E2 | derselbe Ordner in „Dateien“ dreimal zur Wahl (Ansichtswahl, Baum, Ordnerkarte) | ein Weg bleibt | Weglassen; die Sitzung entscheidet, **wenn nichts anderes verletzt wird (auch nicht die Sortierung)** |
| E3 | dieselbe Datei hat in „Suche“ und „Dateien“ verschiedene Knöpfe (Löschen, Tresor, KI, Tag nur in der Suche) | überall dieselbe Knopfreihe | Ja |
| E4 | fünf Wörter: teilen, weitergeben, übergeben, ablegen, „An Pro-App“ | ein Wort | Ja, das Wort ist **„Teilen“** (kurz, vom Handy bekannt) |
| E5 | drei Namen: Pro-Tresor, Tresorordner, Tresor | ein Name | **„Pro-Tresor“**. Wichtig: Ort und Name werden beim Speichern **von selbst** eingesetzt, damit niemand den falschen Ort wählt |
| E6 | drei Knöpfe zum Weitergeben einer Mail, jedes Ziel mit anderem Ablauf | ein Knopf mit Zielwahl, überall gleicher Ablauf | Ja (Knopf „Teilen“ → Familienakte, BookLedgerPro, andere App) |
| E7 | Aussehen an drei Orten (Palette, Mond im ☰-Menü, Thema „Aussehen & App“ ohne Aussehen) | ein Ort | Ja; **Mond und Sonne kommen mit hinein** |
| E8 | Sprache an drei Orten, zwei Knöpfe „DE“ mit verschiedener Bedeutung | App-Sprache und Diktatsprache klar benannt, beide im Thema „Sprache & Diktat“ | Ja |
| E9 | Update an drei Stellen mit zwei Wegen | ein Weg (Versionsnummer/Fähnchen), der Kasten zeigt nur den Stand | Ja |
| E10 | Dateien/Explorer, Mail/Postfach, „Ablage“ für zwei Ordner, SBKIM/Mycel | je Sache ein Wort | Ja („Dateien“, nicht einmal „Dateien“ und einmal „Explorer“) |
| E11 | Startseite sagt dem Neuling nicht, was er tun soll | geführter Einstieg | **Klaus' Idee:** Überschrift „Was möchtest du tun?“, darunter das Icon mit den Bubbles; jede Bubble ist ein erster Weg (Datei einlesen · E-Mail einrichten und lesen · Dokument scannen · sortieren), ein Tipp führt direkt dorthin; bei Bedarf mehr Bubbles. Die Leiste oben bleibt. |
| E12 | Einstellungen: Themenwechsel kostet zwei Tipps | Themenliste bleibt am breiten Schirm links stehen | Ja |
| E13 | Eingang, „Bestätigungen prüfen“, „Erneut weitergeben“ ohne Rückmeldung; Fehler nur gezählt | jeder Tipp sagt, was geschah, und nennt den Grund | Ja |
| E14 | ganze Einstellungs-Kästen, Meldungen, Rückfragen in EN/RU/PL noch deutsch | übersetzen | Ja |
| E15 | Tastatur/Vorlesen: Platz geht nach dem Öffnen verloren, Knöpfe ohne Namen | Fokus bleibt, Knöpfe bekommen Namen | Ja |

Außerdem von Klaus entschieden (schon in 1.0.54): Hauptleiste am Handy bleibt beim **Pfeil** (keine Symbol-Leiste); „Abbrechen“ beim
Einlesen nimmt auch wartende Dateien heraus; nach „Postfach schließen“ öffnet es bis zum nächsten Start nicht von selbst.

## Reihenfolge (Empfehlung)

1. **Wörter zuerst:** E4, E5, E10 – in allen vier Sprachen; danach sind die anderen Punkte leichter. Vorsicht: gepinnte Bausteine
   (`native/pro-*.js`, `modules/`, Verbund-Karte) tragen eigene Wörter und werden nicht hier geändert.
2. **Dateien und Kategorien:** E1, E2, E3.
3. **Teilen:** E6 mit E13. Der Tresor-Weg bleibt technisch wie er ist (`familienakte-uebergabe/1`, Begleitdatei); nur Knopf, Zielwahl
   und Rückmeldungen werden eins. BookLedgerPro nicht still auf den Übergabe-Weg umbauen (20-MiB-Grenze, Empfänger liest dort nicht).
4. **Einstellungen:** E7, E8, E9, E12.
5. **Start:** E11.
6. **Fleiß:** E14, E15.

## So vorgehen

- Zuerst **eine HTML-Vorschau** mit Vorher-Nachher-Bildern zu E1–E13 (Muster `docs/design/geraetetest-1.0.52/vorschau.html`), darin
  je Punkt Klaus' Antwort aus der Tabelle und, wo die Sitzung entscheidet (E2, E11 zwei Varianten: Bubbles nur am Anfang oder
  dauerhaft klein), der konkrete Vorschlag. Klaus bestätigt; dann bauen.
- In Stücken bauen, je Stück Probe vorher rot/nachher grün und Gegenprobe. Für E2/E3 vorher im Prüfbrowser messen, dass jeder Weg
  und jede Aktion nachher noch erreichbar ist (Liste der Aktionen je Datei vorher/nachher).
- Sichtbare Texte DE/EN/RU/PL, keine Emojis, Knöpfe flach, Farbthemen bleiben.
- Kein Zugriff auf Klaus' echte Mail-Konten; nur gestellte Brücken.
- `git stash` nie in parallelen Arbeitskopien (gemeinsamer Stapel). Im Behälter bricht `npm run build:web` bei der OCR-Beschaffung ab
  – Nachzug wie in `CLAUDE.md` beschrieben.
- Veröffentlichen nur mit Klaus' Wort (nächste Fassung 1.0.55). Forschung und Stunden nur nach Kimhub.

## Noch offen aus dieser Sitzung

- Nichts davon am Gerät geprüft (Tablet, Handy, Windows-PC, echtes Konto, echter Tresor).
- Russische und polnische Texte von 1.0.53/1.0.54 hat kein Muttersprachler gelesen.
- V3-Repo nicht nachgezogen (`native-help.js`, `pb-bildbeschreibung.js` sind dort noch die alte Fassung).
- Tresor-Fach `profile` (Workflow PDF Pro #77) fehlt in Private Brain Pro.
- Familienakte: Gegenstück der Vorsortierung ist PR #199 dort; Ausgabe 2.28.71 macht die Datei-Organizer-Sitzung
  (Abgleich: `BRIEF_ABGLEICH_2026-11-16_PRIVATE-BRAIN-PRO.md` auf main der Familienakte).

## Startauftrag

```
Repo lausiklauskn-png/Privat-Brain-Pro, Zweig der Sitzung von origin/main.
Zuerst lesen: CLAUDE.md (oberste zwei Absätze), BRIEF_SITZUNG_2026-11-16_EINFACHHEIT-E1-E15.md,
docs/design/generalpruefung-1.0.53/befunde.json (Belege zu den Punkten).
Stand: 1.0.54 veröffentlicht. Auftrag: Einfachheit, Punkte E1–E15 mit Klaus' Antworten aus dem Brief
(„Teilen“, „Pro-Tresor“, Startseite „Was möchtest du tun?“ mit Bubbles). Keine Funktion darf verloren gehen.
Schritt 1: eine HTML-Vorschau mit Vorher-Nachher zu E1–E13, Klaus bestätigt.
Schritt 2: bauen in der Reihenfolge des Briefs, je Stück Probe (vorher rot, nachher grün) und Gegenprobe.
Veröffentlichen nur mit Klaus' Wort (1.0.55). Forschung und Stunden am Ende nur nach Kimhub.
```
