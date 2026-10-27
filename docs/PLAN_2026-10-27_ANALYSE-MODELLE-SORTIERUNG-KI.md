# Plan 2026-10-27: Analyse-Werkzeug, Modelle je Rechner, Vorsortierung, lokale KI

**Auftrag (Klaus 2026-10-27):** Plan festhalten, nichts davon bauen ohne Klaus' Wort. Gilt für alle
Varianten (Pro und V3, je Android, Windows, PWA), soweit das Gerät es trägt. Reihenfolge der
Abschnitte = vorgeschlagene Bau-Reihenfolge.

Leitlinien, die für alle Teile gelten:

- **Schlanke App.** Große Bausteine (Sprachmodell, Embedding-Modell, Texterkennung, LLM) sind
  nicht im Installer, sondern werden **je Gerät** aus dem Netz geladen, nach Bestätigung, mit
  festem Fingerabdruck (SHA-256, wie heute `semantic-model.json`). Jederzeit entfernbar oder
  wechselbar. Kein Download ohne Zustimmung, große nur im WLAN.
- **Erst messen, dann vorschlagen.** Vor jeder Modellwahl misst die App auf genau diesem Gerät:
  Arbeitsspeicher, Prozessorkerne, Grafikkarte und deren Speicher (wo lesbar), freier Speicherplatz
  und einen kurzen Probe-Durchlauf. Daraus folgt ein Vorschlag „Klein / Mittel / Groß“ mit
  Downloadgröße und erwarteter Wartezeit. Gemessene Werte bleiben auf dem Gerät.
- **Liest nur · schlägt vor · bewegt nichts.** Originale bleiben unangetastet; Löschen und
  Verschieben nur nach ausdrücklicher Bestätigung mit Vorschau.
- **Ehrlich zur Hardware.** Auf dem Tablet sagt die App klar, was dort nicht geht.

## 1. Analyse-Werkzeug (wie läuft die App, wo hakt es)

**Ziel:** Später sehen, wo Menschen mit der App kämpfen: was lange dauert, wo etwas abbricht, wo
mehrfach geklickt wird, bis ein Ziel erreicht ist. Zur Verbesserung der App.

**Was es aufzeichnet (nur Funktionsweise):**

- Dauer von App-Schritten: Start bis bedienbar, Seitenwechsel, Suche bis Treffer, Öffnen einer Mail,
  Laden eines Modells, Einlese-Schritte (nur Dauer und Erfolg, nicht welche Datei).
- Abbrüche und Fehler: Hochladen abgebrochen, Modell lädt nicht (z. B. die gelbe Lampe),
  Mail-Abruf scheitert, Fehlermeldungen der App (Fehlercode, nicht Inhalt).
- Mühe beim Bedienen: mehrfaches Tippen auf denselben Knopf in kurzer Zeit, Hin- und Herspringen
  zwischen Seiten, „Zurück“ direkt nach einem Schritt, Dialoge, die abgebrochen werden.
- Geräteumfeld grob: Variante, Version, Betriebssystem, Fensterbreite, Sprache.

**Was es nie aufzeichnet:** Dateinamen, Dateiinhalte, Mailtexte, Adressen, Suchbegriffe,
Eingaben, Passwörter, Gerätekennungen. Knöpfe werden über ihre feste Kennung erfasst
(z. B. `explorer.sort`), nicht über ihren Text.

**Wo es bleibt:** nur auf dem Gerät, verschlüsselt im Speicherort wie die übrigen Daten, mit
festem Höchstumfang (Ringpuffer). **Kein Netz.** Weitergabe nur, wenn Klaus (oder ein Tester) in
den Einstellungen „Bericht ansehen“ öffnet und ihn selbst als Datei speichert oder teilt.
Abschaltbar, sichtbar in den Einstellungen.

**Grundlage vorhanden:** `index.html` hat ein Diagnose-Protokoll (`pb_diag_log`, 250 Einträge,
Fehler-Haken) für Einlesen und Modellstart. Daraus wird ein gemeinsames Modul (`pb-analyse.js`,
byte-gleich in Pro und V3) mit festen Ereignisnamen; die nativen Teile (Android, Windows) melden
ihre Dauern über dieselbe Schnittstelle.

**Bericht in der App:** „Was hat gedauert“ (langsamste Schritte mit Median), „Wo ist es
abgebrochen“, „Wo wurde mehrfach geklickt“. Schlicht, ohne Emojis.

**Prüfung:** Probe, die nach typischen Abläufen den Puffer liest und belegt, dass kein Dateiname,
kein Suchwort und kein Mailtext darin steht (Gegenprobe: ein eingeschmuggelter Name muss rot werden).

## 2. Diktat: Whisper lokal, Größe je Rechner

**Anlass:** Die Windows-Spracherkennung (SAPI) ist mittelmäßig und langsam.

- Whisper (frei verfügbar, mehrsprachig, etwa 99 Sprachen; DE/EN/RU/PL und die übrigen
  Diktatsprachen der App eingeschlossen), lokal über whisper.cpp in der Windows-App.
- Stufen (Größen ungefähr): `base` ~150 MB, `small` ~470 MB, `large-v3-turbo` ~550 MB bis 1,5 GB,
  auf sehr starken Rechnern auch `large-v3`. Auswahl nach Messung.
- Die Diktatsprache der App wird Whisper mitgegeben (zuverlässiger als Raten).
- Pausen-Erkennung vor Whisper, damit bei Stille keine Wörter erfunden werden.
- Die Mikrofonwahl (1.0.40) bleibt; SAPI bleibt als Rückfall ohne Download.
- Vergleichsprobe für Klaus: eigene Sätze in allen vier Sprachen, Stufen nebeneinander.
- Android: erst nach Klaus' Tablet-Test entscheiden (Googles Erkennung ist meist schon gut).

## 3. Bedeutungssuche: größere Embedding-Modelle auf starken Rechnern

- Heute `multilingual-e5-small` (118 MB). Auf starken Rechnern zur Wahl: `multilingual-e5-base`
  (~280 MB) oder `multilingual-e5-large` (~560 MB, verkleinert).
- Nach einem Wechsel muss der Katalog einmal neu berechnet werden (Werte verschiedener Modelle
  passen nicht zusammen): im Hintergrund, mit Fortschritt, abbrechbar; bis dahin sucht das alte.
- **Offener Fehler aus Klaus' Test (2026-10-27):** In einer App (vermutlich Pro, Windows) blieb die
  Lampe beim Embedding-Modell gelb mit „Embedding-Modell kann nicht geladen werden“, obwohl eine
  andere App (vermutlich Sage) es geladen hatte; außerdem wich der Aufbau in einer Windows-Fassung
  vom Sage-Protokoll ab, und in einer App ließ sich über das Siegel keine Identität erzeugen.
  Vor Abschnitt 3 klären: welche App, Abgleich mit dem Sage-Kanon, Probe für jede Variante.

## 4. Vorsortierung beim Hochladen

**Ziel:** Dateien landen beim Hochladen schon im passenden Ordner, z. B. „Rechnungen › Absender X“,
„Krankenakten“, „Reparaturen“. Die Bedeutungssuche kann dann zuerst im passenden Ordner suchen:
schneller und genauer.

- Der Text jeder Datei wird gelesen (vorhandene lokale Texterkennung für Scans und Bilder).
- Erkennung aus mehreren Hinweisen zusammen: Absender/Firma, typische Wörter (Rechnungsnummer,
  Diagnose, Kostenvoranschlag), Beträge, Daten, dazu die Bedeutung (Embedding).
- Ein Vorschlag mit Begründung („Rechnung, weil: Rechnungsnummer, Betrag, Absender X“);
  bei Unsicherheit „Ungeordnet“ statt Raten.
- Korrekturen lernt die App für ähnliche Dateien (Stufe 5 im Fahrplan: Ordnen aus Korrekturen,
  ohne Training, über die nächsten Nachbarn).
- Ordner sind Katalog-Ordner; Kopien in echte Ordner nur auf Wunsch (wie heute Kategorien).
- Grundlage vorhanden: Kategorien-Vorschlag (A4) und Zielordner (Sitzung 5/6).

## 5. Lokale KI und Auftragsfeld

**Ziel:** Ein Eingabefeld, in dem man der KI Aufgaben gibt: Text ausfüllen, Dateien ordnen,
Dateien löschen, Mail-Ordner importieren, exportieren oder löschen und Ähnliches.

- **Rechner-Prüfung zuerst** (siehe Leitlinien). Ergebnis z. B. „lokal bis 8B-Modell flüssig“ oder
  auf dem Tablet „lokal nicht möglich, nur Anbieter-Weg“.
- **Drei Wege, wählbar und kombinierbar:**
  1. **Lokal:** frei verfügbare Modelle (Llama, Mistral, Qwen, Gemma) in passender Größe und
     Verkleinerung, geladen von Hugging Face o. Ä., mit Fingerabdruck, laufen ohne Netz.
  2. **Eigener Rechner im Netz:** z. B. Klaus' Server mit eigenem Modell, über eine Adresse.
  3. **Abo oder Schlüssel:** Claude, Mistral (EU) und andere. Text vorher über Modul 25 bereinigt
     wie heute bei „KI beim Schreiben“.
- **Wichtig:** Claude gibt es nicht zum Herunterladen, auch nicht verkleinert; nur über Anthropic
  (Abo/API).
- **Feste Werkzeuge statt freiem Zugriff:** Die KI ruft nur App-Werkzeuge auf (Suchen, Ordnen,
  Ausfüllen, Mail-Import/-Export, Löschen). Jeder Schritt wird angezeigt; Löschen und
  Verschieben nur nach ausdrücklicher Bestätigung mit Vorschau. Versteckte Anweisungen in Dateien
  und Mails werden wie heute erkannt und nicht ausgeführt (Prüfliste, Modul 04/25).
- **Grundgerüst in allen Varianten**, Modelle je Gerät nachgeladen. So bleiben Updates (auch
  Windows) wie bisher möglich.
- Anbieterliste und Leistungswerte werden aus einer gepflegten, signierten Liste gelesen, nicht
  frei aus dem Internet zusammengesucht.

## Vorgeschlagene Reihenfolge

1. Analyse-Werkzeug (klein, hilft bei allem Weiteren und beim Fehler aus Abschnitt 3).
2. Fehler gelbe Lampe / Siegel-Identität klären.
3. Rechner-Prüfung als gemeinsamer Baustein.
4. Whisper-Diktat unter Windows.
5. Vorsortierung beim Hochladen.
6. Größere Embedding-Modelle.
7. Lokale KI mit Auftragsfeld (zuerst nur Vorschläge, dann Werkzeuge mit Bestätigung).

Jeder Schritt in einer eigenen Sitzung, mit Probe und Gegenprobe; Veröffentlichung nur auf Klaus' Wort.
