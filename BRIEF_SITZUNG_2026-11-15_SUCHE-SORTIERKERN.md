# Brief an die nächste Sitzung Private Brain Pro: Sortier-Kern einbauen, Dokumente wirklich finden (Klaus 15.11.2026)

Geschrieben aus der Sitzung „rekursive Verbesserung des Sortier-Kerns“ (Datei-Organizer). Grundlage: Klaus' Bilder vom Tablet
(Private Brain Pro 1.0.49, Explorer, 15.11. 13:35) und ein Blick in den Code auf `main` (`f371aed`). Nichts davon ist gebaut.

## Was Klaus erlebt hat (seine Worte sinngemäß)

1. Rechnungen von **Anthropic** werden nicht gefunden, obwohl er den Absender eingibt. Unter Kategorien steht „Rechnung (2)“ –
   das sind genau die zwei Anthropic-Belege (`Receipt-2817-…pdf`, `Invoice-KAA4SLWV-0081.pdf`).
2. Tippt er oben „ich suche alle Rechnungen von anthropic“ (in der Ansicht „Rechnung“): **„Keine Dateien in dieser Ansicht.“**
3. „Rechnung“ erscheint oben nur, solange links die Kategorie angeklickt ist; klickt er sie weg, ist der Filter weg. Tippt er oben
   „Rechnung“ selbst ein, findet er sie trotzdem nicht.
4. Er möchte: oben eingeben, was er sucht, und es finden – mit Wort- **und** Bedeutungssuche; Dokumente aus derselben Quelle oder zum
   selben Thema zusammen („Anthropic alles zusammen, Rechnungen eines anderen Absenders zusammen“); per Klick auf „PDF“ o. ä. eingrenzen.
5. Ein E-Mail-Programm allein reicht ihm nicht: Dokumente aus Mails und eingefügte Dateien sollen eine **Verbindung zur Familienakte**
   haben und genauso gut sortiert sein.
6. **Sortier-Kern wie im Datei-Organizer/der Familienakte, in derselben Qualität**, der E-Mails und Inhalte sortiert.

## Ursachen im Code (gefunden, nicht behoben)

- **Explorer-Suche ist ein wörtliches UND über Name und Pfad** (`assets/workspace.js`, `explorerMatch`): jedes Wort muss vorkommen.
  „ich“, „suche“, „alle“, „von“ stehen in keinem Namen → nichts. Kein Wegfall von Füllwörtern, keine Grundform („Rechnungen“ ≠
  „Rechnung“), keine Übersetzung („Rechnung“ steht nicht in „Receipt…“/„Invoice…“).
- **Die Kategorie zählt nicht als Suchtext.** `explorerMatch` sieht nur `r.name + path` (und mit Haken „auch im Inhalt“ den Text).
  Darum findet „Rechnung“ oben die Rechnungen nicht, obwohl sie als „Rechnung“ einsortiert sind.
- **Kategorie und Suchfeld sind zwei getrennte Zustände** (`folderPath = "category:Rechnung"` gegen `explorerFilter`). Wer die
  Kategorie verlässt, verliert den Filter; das Suchfeld weiß nichts davon.
- **„auch im Inhalt“ ist ab Werk aus.** Den Absender einer Rechnung findet man oft nur im Text oder in der Mail.
- **Einsortierung ist eine eigene, kleine Regelliste** (`index.html`, `CATS`/`suggestCategory`): elf Kategorien, die Art und Format
  mischen („Rechnung“, „Vertrag“, „Foto/Bild“, „Dokument“, „Code“ …). Absender, Bereich (Fach), Frist und Person gibt es nicht. Die
  Gegenwörter (`beispiel`, `muster`, `report`, `bericht`, `vorlage` …) können echte Rechnungen ausschließen.
- **Die Bedeutungssuche (Lupe)** ist ein anderer Weg (Modul 03/04) als das Suchfeld im Explorer – beide wissen nichts voneinander.

## Private Brain und Familienakte im Vergleich (nur Dokumente finden und sortieren)

| | Familienakte | Private Brain Pro heute |
| --- | --- | --- |
| Einsortieren | **Sortier-Kern** des Datei-Organizers, byte-gleich mit Pin (`lib/sortierkern/`): 18 Fächer der Fachregel, Art (16), Absender, Frist, Person; gelerntes Art-Modell, gelernte Absender- und Frist-Wahl (15.11.: an zwei unabhängigen Welten gesichert besser) | eigene Regelliste `CATS` (11 gemischte Kategorien), kein Absender, kein Fach, keine Frist |
| Suche oben | `lib/family-search-text.ts`: Alltagswörter, Monate, Daten, UND, Synonyme; Treffer als Zeilen nach Art | Explorer: wörtliches UND über Name/Pfad; Lupe: Bedeutungssuche getrennt |
| Zusammenhang | Personen, Organisationen, Vorgänge, Fristen | Ordnerbaum nach Mail-Absender (gut!), Kategorien, Doppelte |
| Austausch | Fach `familienakte` / `eingang-familienakte` im Pro-Tresor | „An Familienakte teilen“ (Mail als `.eml` über den Tresor, `familienakte-uebergabe/1`) – nur Mails, keine Einordnung mit |
| Verschlüsselung | Akte im Pro-Tresor (PBV1, AES-GCM) | Originale nur verschlüsselt, wenn der Speicherort/Tresor eingerichtet ist; sonst „Lokale Kopie“ im App-Speicher (so auf Klaus' Bild). **Bitte am Gerät klären und ihm genau sagen, was wo liegt.** |

Klaus will **ähnlich, aber nicht gleich**: Private Brain bleibt Postfach und Wissensspeicher (Mails, Anhänge, Notizen, Bedeutungssuche);
beim Einordnen und Finden soll es dieselbe Qualität haben wie die Familienakte, und was dort landet, soll an die Familienakte gehen
können – mit derselben Einordnung.

## Vorschlag (erst als Vorschau zeigen, Klaus sagt Ja je Punkt)

1. **Sortier-Kern einbauen statt `CATS`** – byte-gleich mit Pin wie in BookLedgerPro (`tools/sortierkern-nachziehen.mjs`, JavaScript aus
   Datei-Organizer `kern-js/`, nie von Hand ändern). Jede Datei bekommt Fach, Art, Absender, Frist, Person; Mails den Absender aus
   „Von:“. Bestehende Kategorien zuerst parallel anzeigen, dann ablösen. Vorher **messen**: Datei-Organizer-Stapel mit drei Einordnern
   (z. B. `pruefstapel-stadt-4`, verbraucht, nur als Abgleich) durch Private Brains Einlesen schicken, alt (`CATS`) gegen neu.
2. **Ein Suchfeld für alles:** Füllwörter weg („ich suche alle … von“), Grundformen und ein kleines Wörterbuch (Rechnung ↔ Invoice/
   Receipt/Quittung), **Kategorie, Art, Absender und Fach zählen als Suchtext**, „auch im Inhalt“ ab Werk an (oder automatisch, wenn der
   Name nichts findet). Gute Vorlage: `lib/family-search-text.ts` der Familienakte. „Rechnungen von Anthropic“ muss die zwei Belege finden.
3. **Kategorie und Suchfeld zusammen:** Ein Klick links setzt ein sichtbares Kästchen im Suchfeld („Rechnung ×“); weitere Wörter grenzen
   ein; das Kästchen bleibt, bis man es wegklickt. Dasselbe für „PDF“, „E-Mail“, Absender.
4. **Zusammen, was zusammengehört:** Sichten „nach Absender“ (Anthropic alles zusammen), „nach Fach“, „nach Art“ – aus dem Kern, nichts
   verschoben. Der Absender-Baum der Mails bleibt.
5. **Bedeutungssuche und Wortsuche auf einer Ergebnisliste** (wie „Überall suchen“): erst sichere Worttreffer, darunter „ähnlich nach
   Bedeutung“; derselbe Filter (Kästchen) gilt für beide.
6. **An die Familienakte geben – mit Einordnung:** nicht nur die `.eml`, auch Anhänge und eingefügte Dateien, samt Fach/Art/Absender/Frist
   aus dem Kern (Feld im Übergabeformat), damit die Familienakte nichts neu raten muss.
7. **Ehrlich zur Verschlüsselung:** im Kasten „Tresor & Ablage“ in einem Satz sagen, ob die Originale gerade verschlüsselt im Tresor oder
   nur als lokale Kopie liegen.

## Proben, die es braucht

- „Rechnung“, „Rechnungen“, „rechnungen von anthropic“, „ich suche alle Rechnungen von Anthropic“, „Invoice“ → die zwei Belege;
  Kategorie anklicken → Kästchen im Suchfeld; wegklicken → wieder alle.
- Messung des Kerns in Private Brain gegen `CATS` an einem Stapel mit drei Einordnern (Bereich, Art, Absender, Frist), einmal, Zahlen mit Spanne.
- Bestehende Proben (`npm test`, `test-pro-bedienung`, `test-ueberall` …) grün; Drift-Guard der byte-1:1-Module unberührt.

## Grenzen

- Ich habe nur den Code gelesen, nicht am Gerät nachgestellt. Ob Klaus' Originale gerade im Tresor liegen, ist ungeklärt.
- Der Sortier-Kern ist auf deutsche Haushaltspost trainiert; englische Belege (Anthropic „Receipt“/„Invoice“) und Mails sind dort
  seltener – nach dem Einbau eigens prüfen.

## Startauftrag zum Einfügen

```
Repo: lausiklauskn-png/Privat-Brain-Pro, eigener Zweig von origin/main.
Zuerst lesen: CLAUDE.md, BRIEF_SITZUNG_2026-11-15_SUCHE-SORTIERKERN.md (Ursachen, Vergleich mit der Familienakte, Vorschlag 1–7).
Auftrag (Klaus 15.11.): Private Brain soll Dokumente so finden und einordnen wie die Familienakte – Sortier-Kern des Datei-Organizers
byte-gleich mit Pin einbauen (wie BookLedgerPro tools/sortierkern-nachziehen.mjs), ein Suchfeld für alles (Füllwörter, Grundformen,
Rechnung↔Invoice, Kategorie/Absender als Suchtext, Kategorie als Kästchen im Suchfeld), Wort- und Bedeutungssuche in einer Liste,
Übergabe an die Familienakte mit Einordnung.
Erste Schritte: 1) Ursachen am Code bestätigen (assets/workspace.js explorerMatch, index.html CATS/suggestCategory). 2) Vorschau (HTML)
der Punkte 1–7 für Klaus, Ja je Punkt abwarten. 3) Kern vor dem Einbau messen (alt CATS gegen neu, Stapel mit drei Einordnern aus dem
Datei-Organizer). 4) Bauen, Proben „Rechnungen von Anthropic“ usw.
Nicht: nichts veröffentlichen ohne Klaus' Wort; byte-1:1-Module und Drift-Guard nicht anfassen; keine echten Daten ins Repo.
```
