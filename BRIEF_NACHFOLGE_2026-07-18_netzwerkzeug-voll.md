# BRIEF an die Nachfolge-Sitzung — „Mit dem Knotennetz verbinden" in VOLLEM Umfang (+ Siegel)

**Datum:** 2026-07-18 · **Repo:** Privat-Brain · **Branch:** `claude/private-brain-offline-hub-hz1evw`
**Freibrief gilt** (siehe `CLAUDE.md` § Selbst-Merge/Plan-vor-Code). **Kein PII, offline-first,
`npm test` = Beweis, Klaus' Browser-Sichttest bleibt.**

---

## 0. Das Ziel in einem Satz

Baue das **„Mit dem Knotennetz verbinden"-Werkzeug** in Private Brain **funktions-gleich zu
Sage-Protokol / family-project** (dem reifen Referenz-Widget), aber **im Design von Private
Brain** (hell/dunkel-anpassend, **schlanke** Knöpfe) — und ergänze danach das **selbst-
signierende Siegel mit Andock**. Klaus hat beide Screenshots (Sage-Widget links, Private-Brain-
Widget rechts) zum 1:1-Vergleich geliefert.

---

## 1. Der 1:1-Bauplan — wo er liegt (Klaus' Frage: „Finde diesen Bauplan")

Der Bauplan ist **kein einzelnes Dokument**, sondern drei kanonische **Skills** + das
**Referenz-Modul** in Sage. Zusammen sind sie der 1:1-Plan:

| Baustein | Quelle (Sage-Protokol = Quelle der Wahrheit) |
|---|---|
| **Netz-Anmeldung / Identität / Rendezvous** | Skill **`saubere-netz-anmeldung`** + `src/modules/23_rendezvous.js` (API) |
| **Siegel + Andock-Wizard + Status-Lampen** | Skill **`status-leiste-siegel`** (Pflicht-Inhalt des Siegel-Modals!) |
| **Verschlüsselter KI-Schlüssel-Tresor** | Skill **`verschluesselter-schluessel-tresor`** + `src/modules/20_schluessel_safe.js` |
| **Das komplette Widget-UI (alle Knöpfe)** | `Sage-Protokol/src/modules/23_rendezvous_ui.js` — **die 1:1-Funktions-Referenz** |
| **KI-Richter (Bewertung nach Bedeutung)** | `Sage-Protokol/src/modules/04_match.js` → `hybridMatch` / `HYBRID_PROVIDERS` / `relatedness` |
| **Mikrofon (Frage sprechen)** | `Sage-Protokol/src/modules/21_spracheingabe.js` |

> **Wichtig:** `23_rendezvous_ui.js` ist **fest dunkel** und **byte-1:1** (Drift-Guard) — es darf
> **nicht** verändert werden. Es dient als **Funktions-Vorlage**, NICHT zum Einbauen. Gebaut wird
> in Private Brains **eigenem, nativem** `modules/net-widget.js` (theme-anpassend), das schon steht.

---

## 2. Stand HEUTE (was schon da ist)

- `modules/net-widget.js` — **natives, theme-anpassendes** Flying-Widget (🌐-Knopf + Panel aus
  Private-Brain-CSS-Variablen). Kann heute: **Verbinden · Wer ist im Raum? · Antwortrecht an ·
  Aufräumen & neu anmelden · pro-Knoten „Fragen" · 📬 Briefkasten** (offene Fragen + `fetchAnswers`
  + Badge). Verschiebbar, Position gemerkt, Modell-Ladebalken. (PR #28)
- Fester Tab **🌐 Netz** mit demselben Kern-Werkzeug (PR #26).
- „Wer ist im Raum?"-Lesefenster auf **12 s** verlängert (PR #27, behob „niemand im Raum").
- Modul 04 (KI-Richter `hybridMatch`), 03/05/05b/23 vorhanden. **Modul 20 + 21 FEHLEN** noch.

---

## 3. Was FEHLT (aus Klaus' 1:1-Vergleich der Screenshots)

Das Referenz-Widget (Sage/family) hat, was Private Brain noch **nicht** hat:

1. **Netz-weite Frage nach Bedeutung** — Textfeld „Frage nach Bedeutung, z. B. Kuchen…" +
   **🔎 Antwort holen** + **🎤 Mikrofon**. Beispiel Klaus: *„ich suche Rezepte, wer kann helfen?"*
   → das Werkzeug sucht im Raum den **best-passenden Knoten** und fragt ihn automatisch
   (Referenz: `onAutoAsk` = `discover()` → besten Knoten ranken → `askNode`). **Nicht nur an EINEN
   Knoten**, sondern „wer im Raum kann das?".
2. **KI-Richter: an/aus** + **Anbieter-Dropdown** (Claude/Anthropic, Gemini, OpenRouter, **EU**:
   Mistral … — EU-Politik-gefiltert) + **KI-Schlüssel-Feld** (BYOK). Bewertet Antworten nach
   **Bedeutung** (Modul 04 `hybridMatch`).
3. **🔑 Schlüssel holen ↗** (Direktlink zur Schlüsselseite des Anbieters) + **🔒 im Tresor merken /
   🔓 Tresor entsperren** (KI-Schlüssel verschlüsselt sichern → **Modul 20 Safe**, Skill
   `verschluesselter-schluessel-tresor`).
4. **Antworten: an/aus** (Antwortrecht-Umschalter — habe ich als „Antwortrecht an", muss echter
   an/aus-Toggle werden).
5. **📬 Antworten abholen (N)** mit Zähler · **💬 offene nochmal fragen** · **🗑 leeren** — die volle
   Briefkasten-Bedienung (habe ich teils).
6. **🧬 nur verwandte: an/aus** — Verwandtschafts-Filter im Raum (Modul 04 `relatedness`, reine
   Anzeige, gatet nichts).
7. **Mehrere Aufräum-Werkzeuge:** **🙋 Nur neu anmelden** (`announce`) **zusätzlich** zu
   **🧹 Aufräumen & neu anmelden** (`repairAndReconnect`; optional `newIdentity:true` als Notfall).
8. **Pro Knoten im Raum:** Verwandt-Score („🧬 verwandt 0.32"/„verbunden 0.29") · **🤝 Andocken**
   (`handshakeCard`) · **❓ gezielt fragen** (`askNode`) · **↗ App öffnen** (Endpoint der Spore).
9. **(Optional, Sage-Seite) Siegel** — das gold-umrandete Selbst-Signier-Siegel oben +
   Status-Lampen; Skill `status-leiste-siegel` (eigene Stufe, siehe unten).

---

## 4. Design-Leitplanken (Klaus ausdrücklich)

- **Private-Brain-Optik, hell/dunkel-anpassend BLEIBT** — durchgehend App-CSS-Variablen
  (`--card/--ink/--line/--acc/--field/--mut`), **keine** fest-dunklen Farben. Klaus 2026-07-18
  ausdrücklich bestätigt: *„das Design-Thema für Private Brain soll bleiben"* — das native,
  theme-anpassende Widget ist richtig, nicht das fest-dunkle Fremd-Panel.
- **SCHLANKE Knöpfe — NICHT zu dick/groß** (Klaus 2026-07-18, wörtlich: *„die Knöpfe auf Private
  bezogen sind zu dick, aber die anderen [Sage/family] sind in Ordnung von der Größe"*). Das war
  ausdrücklich **„in den Brief für die nächste Sitzung, nicht für jetzt"** — also hier bauen, nicht
  vorher. Private Brains Standard-Knopf ist `padding:11px 16px` — **zu fett** für die vielen kleinen
  Umschalter. → Eine **Mini-Knopf-Klasse** (z. B. `.pbnet-mini`, `padding:6px 12px; font-size:.78rem;
  box-shadow:none`) für alle Umschalter/Sekundär-Knöpfe; nur die **Haupt-Aktion** „Verbinden &
  anmelden" darf `.primary` bleiben. An der **Referenz-Größe** aus Sage orientieren
  (dort `padding:6px 12px`, `.72rem`). **Gilt für ALLE Knöpfe im Widget UND im Netz-Tab.**
- **Fail-soft & Fremdnutzer-Brille:** fehlt Modul 20/21/Schlüssel/Mikrofon → Feature degradiert
  **still**, App bleibt voll nutzbar, klarer Hinweis was fehlt. **Empfangsmodus** bleibt
  (nutzer-ausgelöst, kein Auto-Connect, kein Dauer-Piepser).

---

## 5. Vorgeschlagene Stufen (je eigener Commit/PR, `npm test` grün)

**Stufe A — Bausteine holen (byte-1:1 aus Sage):**
`modules/20_schluessel_safe.js` + `modules/21_spracheingabe.js` byte-1:1 aus
`Sage-Protokol/src/modules/` kopieren, in `index.html` + `sw.js`-SHELL laden (Cache hochzählen),
**Drift-Guard-Einträge** (SHA-256) ergänzen. Smoke: laden ohne Fehler.

**Stufe B — Netz-weite Frage + Mikrofon + Raum-Aktionen** (in `net-widget.js` UND Netz-Tab):
- Textfeld „Frage nach Bedeutung…" + **🔎 Antwort holen** = `discover()` → best-Knoten ranken
  (Modul 04) → `askNode`. + **🎤** (Modul 21 `SbkimSpeech`, fail-soft).
- Pro Raum-Knoten: **🤝 Andocken** (`handshakeCard`), **❓ gezielt fragen** (`askNode`),
  **↗ App öffnen** (`card.spore.endpoint`), **Verwandt-Score** + **🧬 nur verwandte**-Filter
  (Modul 04 `relatedness`).
- **🙋 Nur neu anmelden** (`announce`) neben **🧹 Aufräumen** (`repairAndReconnect`).
- Briefkasten voll: **📬 Antworten abholen (N)** · **💬 offene nochmal fragen** · **🗑 leeren**.
- **Antworten: an/aus** echter Toggle (`enableAnswering`).

**Stufe C — KI-Richter + Schlüssel-Tresor:**
- **🧠 KI-Richter: an/aus** + **Anbieter-Dropdown** (aus Modul 04 `HYBRID_PROVIDERS`, EU-Politik-
  gefiltert) + **Schlüssel-Feld** (BYOK, RAM-only default).
- **🔑 Schlüssel holen ↗** (Anbieter-Link) + **🔒 im Tresor merken / 🔓 entsperren**
  (Modul 20 `SbkimSafe`, Skill `verschluesselter-schluessel-tresor` — **kein Klartext-Speicher**).
- Antworten werden **nach Bedeutung** bewertet (`hybridMatch`), nur wenn an + Schlüssel da.

**Stufe D — Siegel (eigene Sitzung, größer):**
Nach Skill **`status-leiste-siegel`**: selbst-signierendes SBKIM-Siegel (Bronze/Gold) + der
**PFLICHT-Inhalt** des Siegel-Modals (Andock-Wizard: eigene Identität/Spore erzeugen · signieren ·
verschlüsseltes Backup · Wiederherstellen · Identitäts-Wechsler · fremden Knoten andocken) +
Status-Lampen. In Private-Brain-Optik. **Eigener Brief/Stufe** — nicht mit B/C mischen.

---

## 6. Datenverträge / genutzte Flächen (nur benutzen, NICHT umbauen)

- **Modul 23** (`window.SbkimRendezvous`, nach Modus-A-Init bereits mit `createIdentity`/
  `prepareCorpus` konfiguriert): `connectAndAnnounce()` · `announce()` · `discover({listenMs:12000})` ·
  `askNode(card,text)` · `enableAnswering()` · `fetchAnswers(qids,{waitMs})` ·
  `repairAndReconnect({newIdentity?})` · `handshakeCard(card)`.
- **Modul 04** (`window.SbkimMatch`): `hybridMatch` (KI-Richter, Anbieter/EU) · `relatedness`
  (Verwandt-Score) · `HYBRID_PROVIDERS`.
- **Modul 20** (`window.SbkimSafe`, nach Stufe A): `open/createVault/unlock/lock/hasVault` — für den
  KI-Schlüssel. **Kein Klartext** in localStorage/IndexedDB.
- **Modul 21** (`window.SbkimSpeech`, nach Stufe A): `makeBrowserRecognizer`/`startRecording` — Mic.
- **TABU:** Kern-Module 01/02/03/04/05/05b/23/20/21 bleiben **byte-1:1** (Drift-Guard). Kein
  `PROTOCOL_VERSION`/`DB_VERSION`-Bump, `PROVIDER_MIN_MATCH` (0.80-Andock-Riegel) unangetastet.
  DB-Suffix bleibt `privatbrain`.

---

## 7. Akzeptanzkriterien

- `npm test` **grün** (Drift-Guard inkl. neuer Module 20/21 byte-1:1 + alle e2e).
- Je Stufe eine **e2e-Suite** (Mount/Öffnen/Funktion vorhanden/fail-soft offline), in die Kette
  aufgenommen. **Theme-Test:** Panel folgt hell/dunkel (Muster: `tools/e2e-netwidget.mjs`).
- **Knopf-Größen schlank** (Sicht-Vergleich mit den Referenz-Screenshots; Mini-Klasse genutzt).
- Netz-Tab UND Flying-Widget bleiben beide funktionsfähig (Klaus: „den ganzen Ordner lassen").
- **Ehrlich:** Live-Cross-Knoten (sehen/fragen/antworten/andocken) ist **nur am Tablet beweisbar** —
  headless beweist Mount/Funktion/Theme/fail-soft. Nie „grün" ohne Klaus' Browser-Lauf.

---

## 8. Pflichtlektüre VOR dem Bau (Reihenfolge)

1. `CLAUDE.md` (diese Verfassung, Freibrief, DB-Suffix, Design-Vorgabe).
2. Dieser Brief.
3. **Skills:** `saubere-netz-anmeldung` · `verschluesselter-schluessel-tresor` ·
   (für Stufe D) `status-leiste-siegel`.
4. `Sage-Protokol/src/modules/23_rendezvous_ui.js` (Funktions-Vorlage) + `23_rendezvous.js` (API) +
   `04_match.js` (KI-Richter) + `20_schluessel_safe.js` + `21_spracheingabe.js`.
5. `modules/net-widget.js` + `modules/rendezvous-init.js` (der jetzige Stand) + der Netz-Tab in
   `index.html` (`#panel-net`).

## 9. Offene Fragen an Klaus (vor größerem Bau kurz zeigen)

- **Reihenfolge/Umfang:** alle Stufen A–C in einer Sitzung, oder gestaffelt (A → B → C → später D)?
- **KI-Richter-Anbieter:** dieselbe Liste wie Sage (Claude/Gemini/OpenRouter/Mistral-EU) — passt das,
  oder für Private Brain nur EU-Anbieter als Default?
- **Siegel (Stufe D):** jetzt schon mitplanen oder erst nach A–C?

## 10. Abschluss-Befehl (Brief-Kette reißt nie ab)

Am Sitzungsende: `PULS.md`/Stand fortschreiben, **neuen** Brief `BRIEF_NACHFOLGE_<datum>_<thema>.md`
anlegen (Stand · geplant · gebaut · Datenverträge · Akzeptanz · Reihenfolge · offene Fragen),
diesen Brief **vollständig als Codeblock im Chat** ausgeben, Pflichtlektüre + diesen Abschluss-Befehl
wiederholen. Getestete, abgegrenzte, nicht-zweifelhafte PRs selbst mergen (Freibrief).
