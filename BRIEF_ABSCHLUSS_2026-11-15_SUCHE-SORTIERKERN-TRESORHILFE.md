# Abschlussbrief 15.11.2026: Suche mit Sortier-Kern, eigene Kategorien, Einstellungen nach Themen, Tresor-Hilfe

Zweig `ccr-ade42157-vnxn18`, Entwurf PR #142. **Nichts veröffentlicht, nichts am Gerät geprüft.** Grundlage:
`BRIEF_SITZUNG_2026-11-15_SUCHE-SORTIERKERN.md` und Klaus' Antworten in den Vorschauen (`docs/design/…-2026-11-15/vorschau.html`).

## Was gebaut ist (mit Klaus' Ja je Punkt)

| Punkt | Was | Wo |
| --- | --- | --- |
| Suche 1 | Sortier-Kern byte-gleich mit Pin (Datei-Organizer `70eb44b`, 14 Dateien, 1,8 MB); jede Datei/Mail bekommt `rec.kern` (Art, Absender, Bereich, Frist, Person, Betrag, Datum), auch Altbestand (Nachordnen im Hintergrund). Alte Kategorie bleibt daneben; ist der Kern unsicher und sagt `CATS` Rechnung/Vertrag/Angebot, gilt die alte. | `tools/sortierkern-nachziehen.mjs`, `assets/sortierkern/`, `assets/sortierkern-anschluss.js` |
| Suche 2–5, Frage-Weg | Ein Suchfeld: Füllwörter weg, Einzahl (beste oben) / Mehrzahl (alle, nach Absender gruppiert), Wörterbuch Rechnung↔Invoice/Receipt…, Kästchen für Art/Absender/Monat/Jahr/Bereich/eigene Kategorie, Inhalt von selbst, Sortierung nach Absender/Bereich/Art mit Gruppen, „Ähnlich nach Bedeutung“ darunter. Kästchen stehen **in einer Zeile unter dem Feld** (im Feld hätten sie die Anordnung der Pro-App gestört). | `assets/such-frage.js`, `assets/workspace.js`, `native/pb-arrange.js` (Menü um drei Schlüssel erweitert) |
| Suche 3 (Zusatz) | Eigene Kategorien („Versicherung“), Frage „Alles von <Absender>?“, Regel lösbar, links mit Zahl. Regeln nur auf diesem Gerät (localStorage), Kategorie am Katalog-Eintrag. | `assets/eigene-kategorien.js` |
| Suche 6 | Begleitdatei `familienakte-uebergabe.json` (Bereich, Art, Herkunft › Kategorie, Absender/Frist) – gegen den echten Leser der Familienakte geprüft. **Über den Tresor kommt sie noch nicht an** (siehe Auftrag Familienakte). | `assets/familienakte-begleitung.js`, `tools/test-familienakte-begleitung.mjs` |
| Mail-Fehler 1.0.50 | Mail geht auch bei nicht erreichbarem Speicherort auf (direkt vom Server, nur im Arbeitsspeicher, Hinweis im Lesefenster). Ursache am Gerät: alter Ablageordner gelöscht; Klaus hat neu eingerichtet (`Family_Projekt_de/Private Brain`, Tresor verbunden). | `MailEngine.java`, `assets/live-mail.js` |
| Einstellungen D, A, B, C | Themen-Knöpfe statt langer Seite (roter Punkt bei Fehler); Sprache/Mikrofon/„Mikrofone suchen“ in einer Reihe, Satz „Diktat folgt …“ weg; Pro-Apps: Erklärung hinter i, seltene Knöpfe hinter „Mehr“; Verschlüsselung in einer Reihe. | `assets/einstellungen-themen.js`, `native/native-microphone.js`, `native/native-pro-verbund.js`, `assets/workspace.css` |
| SBKIM | „Mycel“ → „SBKIM“ in den Texten der App, Knopf „Siegel & Chefcode“. | `native/native-mycel.js`, `-semantic.js`, `-meaning.js` |
| Tresor-Hilfe 1–5, 7 | Gegenprobe des Ordnerbaums (Karte · Erlaubnis · Ordner · Kennung · ein Baum), Satz mit „Beheben ›“, Reparatur in einem Zug (`tresorEinrichten` mit `reparatur` – Android prüft selbst, dass der alte Ordner fehlt), geführte Schritte, Knopf „Tresor-Hilfe“ mit „Wo liegt was?“ und Landkarte. | `native/native-tresor-hilfe.js`, `ProVaultPlugin.java` (`diagnose`) |

## Messungen

- Kern vor dem Einbau, `pruefstapel-stadt-4` (200 Stücke, drei Einordner): Art Rechnung/Vertrag/Angebot alt 7/45 → Kern 38/45 (McNemar p < 0,001);
  Rechnungen erkannt 2/25 → 23/25; Bereich 79 %, Absender 84 %, Frist 94 % (alt: keine). Englische Rechnungen erst nach Datei-Organizer #39.
- Datei-Organizer #39 (englische Rechnungen): 16 deutsche Stapel (2.892 Stücke) unverändert; Kern-Proben 158 grün, Gegenprobe 3/3. Gemergt (Freibrief dort).
- Such-Proben (`tools/messen-suche.mjs`, 50 Fragen, vor der Messung geschrieben, erfundener Bestand): alt Name/Pfad 8, alt + Inhalt 20,
  neu ohne Kern 37 (29 falsche Treffer), neu mit Kern **43** (1 falscher). Erster Lauf 40, danach nur allgemeine Nachbesserungen.
  Eigener Bestand → eher zu hoch. Offene Fehlschläge: „stadtwerke“ (Kontoauszüge nur im Text), „handyrechnung“, „Versicherung“
  (Wort ist zugleich Absender-Wort), „Newsletter“ (Angebot/Werbung zusammen), zwei fragwürdige Soll-Werte (Ostsee, Abschlag Strom).

## Proben

Neu: `e2e-sortierkern` 33, `test-einstellungen-themen` 13, `test-tresor-hilfe` 16, `test-familienakte-begleitung` 8, `messen-suche`,
`sortierkern-nachziehen --pruefen` – alle in `npm test` bzw. `test:native-web`. Angepasst an Klaus' Ja: `test-explorer-order`,
`test-overview`, `test-design-26`, `test-microphone`, `test-tresor-plan`, `test-tresor-ein-schritt`, `test-mycel`, `test-meaning`.
CI auf PR #142 grün bis `bb4ba0c` (danach laufen neue Läufe). Lokal nicht laufend: `e2e-ki-reinigung` (WFPDF_KLON fehlt),
`e2e-workspace` (Browser schließt beim Neuladen, auch auf `main`).

## Grenzen (ehrlich)

- Nichts am Tablet: Nachordnen bei großem Katalog (Dauer), Themen-Knöpfe am Handy, Tresor-Hilfe mit echter SD-Karte, `diagnose` und
  `reparatur` in Java nur am Quelltext geprüft (Übersetzung in der CI).
- Themen in den Einstellungen: alte Browser-Proben (Playwright, `navigator.webdriver`) sehen weiter alle Kästen; nur
  `test-einstellungen-themen`/`test-tresor-hilfe` schalten die Themen ein. Am Gerät gilt immer: Themen.
- `native/pb-arrange.js` ist mit V3 byte-gleich gewesen; die Erweiterung (drei Sortier-Schlüssel) muss in V3 nachgezogen werden.
- „Mycel“ bleibt in Byte-Kopien anderer Quellen: Modul 16/17/23-UI (Sage), `pro-chefcode.js`/`pro-ueberall.js` (Bedien-Bausteine),
  `pro-verbund.html` (BookLedgerPro), Knotenbeschreibung der Spore (`assets/siegel-inhalt.js`, `modules/rendezvous-init.js` – Protokoll-Daten, Probe `sbkim-beschreibung`).

## Aufträge für die nächsten Sitzungen

1. **Familienakte** (eigene Sitzung, Klaus' Ja): Übergabe über den Tresor mit Einordnung annehmen – optionales Feld `vorschlag`
   (lebensbereich, dokumentart, vorgang, hinweis) im Vertrag `familienakte-uebergabe/1` (dort `lib/pro-verbund-vertrag.ts`,
   `app/pro-uebergabe.ts`, Java `de.familyprojekt.tresor.Uebergaben`) und im Eingang nach `vorgang` unterteilen. Danach hier `send()` um das Feld ergänzen.
   Dazu: Sortier-Kern dort auf Datei-Organizer `70eb44b` nachziehen (englische Rechnungen).
2. **Sage**: „Mycel“ → „SBKIM“ in Modul 16/17/23-UI und in der Knotenbeschreibung entscheiden; danach hier neu kopieren.
3. **Bedien-Bausteine / BookLedgerPro / V3**: „Mycel“ in `pro-chefcode.js`, `pro-ueberall.js`, `pro-verbund.html`; `pb-arrange.js` in V3 nachziehen.
4. **Tresor-Hilfe in den anderen Pro-Apps** (Punkt 6, Klaus Ja): als gemeinsamer Baustein, je App eigene Sitzung.
5. **Am Gerät**: Suche „Rechnungen von Anthropic“, eigene Kategorie, Themen-Knöpfe, Tresor-Hilfe (Fall „Ordner fehlt“ mit einem Testordner).

## Stundennachweis

Sitzung 15.11.2026, etwa 12:45–15:30 (rund 2 ¾ Stunden), Claude allein, mit Rückfragen an Klaus.

## Startauftrag

```
Repo: lausiklauskn-png/Privat-Brain-Pro, Zweig von origin/main (oder PR #142, falls noch offen).
Zuerst lesen: CLAUDE.md, BRIEF_ABSCHLUSS_2026-11-15_SUCHE-SORTIERKERN-TRESORHILFE.md.
Stand: Suche mit Sortier-Kern, eigene Kategorien, Einstellungen nach Themen, Tresor-Hilfe gebaut (PR #142), nicht veröffentlicht, nicht am Gerät.
Nächster Schritt: Klaus' Gerätetest abwarten; Befunde beheben. Veröffentlichen nur mit Klaus' Wort (nächste Fassung 1.0.51).
Die Übergabe mit Einordnung über den Tresor braucht zuerst eine Sitzung in der Familienakte (Auftrag 1 im Brief).
```
