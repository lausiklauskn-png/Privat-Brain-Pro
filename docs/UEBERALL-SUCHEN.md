# „Überall suchen“ in den Pro-Apps (Pro-Umbau 12, 2026-10-30)

Klaus m7 (Ja/Nein-Liste 2026-10-30): *„Dieselbe ‚Überall suchen‘-Bedienung kommt in alle drei Pro-Apps (gemeinsamer Baustein).“* Vorbild ist
BookLedgerPro 0.1.6 (`src/domain/ueberall.js`, `src/ui/views/sbkimsuche.js`).

## Was man sieht

Ein Kasten **„Überall suchen“** mit dem Satz *„Dokumente finden in allen deinen verbundenen Programmen.“* (Klaus' Wortlaut, m0), die längere
Erklärung hinter ⓘ (zu), ein farbiger Knopf **„Suchen“** und drei Haken:

| Haken | Woher | Vorgabe |
|---|---|---|
| diese App | Private Brain Pro: Katalog (Name, Pfad, Kurzfassung, Tags, Kategorie, Absender, Mailtext) · Workflow PDF Pro: Bibliothek (Name, Ordner, Seitentext) | an |
| Tresorordner (alle Pro-Apps) | Inhaltsverzeichnisse der **anderen** Fächer im gemeinsamen Tresorordner (Name, Art, Datum, Kurzfassung ≤ 1000 Zeichen), ohne Internet; das eigene Fach nicht (das ist schon „diese App“). Nur in der Android-App und nur bei offenem Tresorordner, sonst ein ruhiger Satz | an (Haken nur, wo die Brücke da ist) |
| Netz (andere Arbeitsplätze) | Modul 23 (`discover` + `askNode`), höchstens 5 Knoten; zurück kommen nur Titel | **aus** (Klaus m6: für alle da, jeder schaltet selbst) |

Die Liste ist nach Herkunft geordnet (diese App · je Fach · Netz), je Gruppe höchstens 25 Zeilen. Eine Zeile der eigenen App öffnet die Datei;
Zeilen anderer Apps sind nur Text mit dem Hinweis *„nur im Inhaltsverzeichnis – öffnen in …“* (die Dateien liegen dort im Format der anderen App).
Netz-Zeilen nennen den Knoten und „nicht bestätigt“, wenn der Knoten nicht bestätigt ist. Die gewählten Haken werden gemerkt (`pro_ueberall_quellen_v1`).

Suchfrage: dieselbe wie im Suchfeld der App (PB: `#q`, WPP: `#bibSuche`); Wortsuche wie in BookLedgerPro (UND über alle Wörter, Umlaute gefaltet,
Daten als JJJJMMTT, ab zwei Zeichen).

## Teile

| Datei | Wo gepflegt | Inhalt |
|---|---|---|
| `native/pro-ueberall.js`/`.css` | **hier** (Bedien-Bausteine Fassung 4, Pin `native/pro-bedienung-herkunft.json`) | Logik (Wortsuche, Fächer, Netz-Zeilen, Gruppen, Ablauf) + Kasten; Farben nur `--pro-*` → Design der jeweiligen App |
| `native/native-ueberall.js` | je App | was die App dazugibt: eigene Liste, Brücke, Öffnen |
| `ProVault.tresorFach` (PB) · `WorkflowVault.tresorFach` (WPP) | je App | liest `TresorOrdner.verzeichnis(fach)` — nur Zeilen, nie Dateien; gleiche Sperr-Regel wie Zustand/Eingang (von Hand gesperrt bleibt zu) |

Nachziehen in Workflow PDF Pro: `node tools/native/bedienung-nachziehen.mjs --quelle ../privat-brain-pro` (nimmt alle Pfade aus dem Pin).
BookLedgerPro behält vorerst seine eigene Fassung (`src/domain/ueberall.js`); beim nächsten Nachziehen dort kommen die Dateien mit, verdrahtet
sind sie dann noch nicht.

## Schriftgröße „A··A“ und Schriftzoom (Leitfaden § 1.8, im selben Umbau)

`ProBedienung.schriftKnopf()` (85–150 %, gemerkt `pro_schrift_v1`, wirkt beim Laden sofort); die Apps setzen Schriften in rem, Knöpfe bleiben
30 px. Android: `setTextZoom(100)` (die WebView übernahm Androids Systemschrift). PB: im ☰-Menü — in der Kopfleiste bliebe am Handy zwischen
Titel und ← → ☰ kein Platz für das Siegel (gemessen 6 px bei 360 px). WPP: vor dem Zahnrad, dazu die Version klein neben dem Namen.

## Proben (gemessen 2026-10-30 im Behälter)

- PB `tools/native/test-pro-bedienung.mjs` **63** (gilt byte-gleich auch in WPP) · `test-ueberall.mjs` **18** · `test-tresorordner.mjs` **38**.
- WPP `npm run test:native-web` **69/0** (neu `test-ueberall.mjs` 11).
- Gegenprobe (Wegwerf-Kopie, 5 Fehler eingebaut): eigenes Fach doppelt · Netz ohne Haken gefragt · fremde Zeilen als Knopf · gesperrt wirft bis zur
  Ansicht · Netz-Text als HTML — **5 gefangen, 0 durchgerutscht**.

## Grenzen (benannt)

- Nicht am Gerät, nicht am Tablet, kein echtes Relais, kein echter zweiter Arbeitsplatz. Die Java-Brücke ist hier nicht übersetzt (kein SDK),
  gebaut wird sie in GitHub.
- Windows und PWA haben keinen Tresorordner → nur „diese App“ und „Netz“.
- Die Tresor-Suche liest nur das Inhaltsverzeichnis (Name, Kurzfassung), nicht den ganzen Text in den Dateien anderer Apps.
- Was dieses Gerät dem Netz selbst antwortet, regelt weiter das Mycel jeder App. Den Chefcode gibt es seit Pro-Umbau 13 (Abschnitt unten).

## Chefcode (Pro-Umbau 13, 2026-10-30)

Klaus' Wort: *„Ja, Schritt 1+2“* · *„Chef legt fest, alle 3“*. Gemeinsamer Baustein `native/pro-chefcode.js` (hier gepflegt, Bedien-Bausteine
**Fassung 5**, byte-gleich nach Workflow PDF Pro und BookLedgerPro). Ein Kasten **„Chefcode“**: verdecktes Feld, „Übernehmen“, „Entfernen“, Zustand
(● Eigenes Netz mit Chefcode · Öffentliches Netz · ungültig), Erklärung hinter ⓘ.

- **Schritt 1 (alle drei Apps):** wer denselben Code eingibt, ist im selben eigenen Netz. Gebaut wird am Netz nichts Neues: Modul 23 (byte-1:1)
  kann es schon (`saveNetwork`/`applyNetwork`, Raum-Marke per SHA-256, Schlüssel per PBKDF2, Zettel AES-GCM; ungültig fällt nie still ins
  öffentliche Netz). Der Baustein normalisiert wie Modul 23 (Leerzeichen und Bindestriche weg, groß), verlangt mindestens 12 Buchstaben oder
  Ziffern, nimmt das Relais der vorhandenen Einstellung oder die Vorgabe von Modul 05b, leert danach das Feld (der Code steht nirgends im Bild)
  und schaltet das Antwortrecht im neuen Netz wieder ein, wenn die App vorher geantwortet hat (Modul 23 beendet den Lauscher beim Wechsel).
  Ein neuer Code ersetzt den alten sofort. Gespeichert wird er von Modul 23 im Speicher der App (`sbkim_netz_<Schublade>` im localStorage),
  nie in Dateien oder im Tresorordner.
- **Schritt 2 (nur BookLedgerPro, die einzige App mit begrenztem Antwort-Korpus):** Schalter „Mit Ausschnitt antworten“ — siehe BookLedgerPro.
- Ort in Private Brain Pro: Einstellungen, nach dem Mycel-Kasten (`native/native-chefcode.js`).
- `pro-ueberall.js` Fassung 2: Zeilen der App dürfen ein Feld `gruppe` tragen (eigene Gruppe direkt nach der App, z. B. BookLedgerPros
  „Angebotsplaner“), und `nachSuche(erg, frage)` ruft nach jeder Suche zurück (BookLedgerPros KI-Schalter).
- Probe `tools/native/test-chefcode.mjs` **20** (echtes Modul 23 im gebauten www/, kein Relais): öffentlich ab Werk, zu kurz/falsche Zeichen ändern
  nichts, gültiger Code → `_meta.network === 'eigen'`, gespeichert normalisiert, Code nirgends im Bild, Wechsel → neue Raum-Marke, Antwortrecht
  wieder an (nur wenn vorher an), Entfernen → öffentlich. Gegenprobe 3/3 gefangen (Feld nicht geleert · Mindestlänge 6 · Antwortrecht nicht
  wieder an); der zweite Fall rutschte zuerst durch (Modul 23 lehnt selbst ab), die Probe prüft jetzt den Satz des Bausteins und die Grenze 11/12.
- ⚠ Nicht gemessen: echtes Relais, zwei Arbeitsplätze mit demselben Code, am Gerät. Wer den Code hat, liest alles im Netz — er ist ein Schlüssel.
