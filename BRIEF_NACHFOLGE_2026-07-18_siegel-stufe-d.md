# BRIEF an die Nachfolge-Sitzung — Stufe D: Selbst-signierendes Siegel (+ Feinschliff)

**Datum:** 2026-07-18 · **Repo:** Privat-Brain · **Branch:** `claude/knotennetz-widget-vollumfang-65inou`
**Freibrief gilt** (siehe `CLAUDE.md` § Selbst-Merge/Plan-vor-Code). **Kein PII, offline-first,
`npm test` = Beweis, Klaus' Browser-Sichttest bleibt.**

---

## 0. Was in DIESER Sitzung fertig wurde (Stufen A–C, gemergt/PR)

Das „Mit dem Knotennetz verbinden"-Werkzeug ist jetzt **funktions-gleich zum Referenz-Widget**
(Sage/family), in **Private-Brain-Optik** (theme-anpassend, schlanke `.pbnet-mini`-Knöpfe),
an **beiden** Orten: schwebender 🌐-Knopf **und** fester Tab „🌐 Netz" (`#pbNetTabMount`).
**Eine** Implementierung (`modules/net-widget.js`), zwei Mounts.

- **Stufe A** — `modules/20_schluessel_safe.js` + `21_spracheingabe.js` **byte-1:1** aus Sage
  geholt (Drift-Guard wacht), in `index.html` + `sw.js` (Cache v26) geladen.
- **Stufe B** — netzweite Frage nach Bedeutung (🔎 Antwort holen: `discover` → Modul 04
  `rankCardsByQuery` → besten Knoten automatisch `askNode`) + 🎤 Mikrofon (Modul 21, fail-soft);
  Raum-Karten je Knoten: Verwandt-Score-Badge · 🤝 Andocken (`handshakeCard`) · ❓ gezielt fragen
  (`askNode`) · ↗ App öffnen (Spore-Endpoint) · 🧬 nur-verwandte-Filter; 💬 Antworten an/aus
  (`enableAnswering`/`disableAnswering`); 📬 Briefkasten voll (abholen (N)/offene nochmal
  fragen/leeren); 🙋 Nur neu anmelden (`announce`) neben 🧹 Aufräumen. **Bug behoben:**
  `askNode`-Ergebnis wird aus `res.results` gelesen (vorher `res.hits` → nie Treffer).
  `rendezvous-init.js` auf Modus-A-Init + `createIdentity` + `prepareCorpus` verschlankt.
- **Stufe C** — 🧠 KI-Richter (opt-in/BYOK, Default aus): bewertet Antworten nach Bedeutung
  (Modul 04 `hybridMatch`); Anbieter-Dropdown EU-gefiltert, **EU zuerst** (Mistral Default,
  🇪🇺 nur-EU Default an; andere wählbar wenn aus — Klaus' Entscheid 2026-07-18); BYOK-Feld +
  🔑 Schlüssel holen ↗; 🔒 im Tresor merken / 🔓 entsperren über **Modul 20** `putSecret/getSecret`
  (kein Klartext at rest). Vorwahl persistiert, **Schlüssel nie**.

**Tests:** `e2e-netwidget` (13, konsolidiert) · `e2e-netwidget-b` (18) · `e2e-netwidget-c` (20) ·
`e2e-modules-2021` (7) · `e2e-relay` nachgezogen. **Voller `npm test` grün (27 Suiten).**
Kern-Module 04/05/05b/20/21/23 **byte-1:1**; `PROVIDER_MIN_MATCH` (0.80) + Andock-Riegel
unberührt; DB-Suffix `privatbrain` unverändert.

> **EHRLICH:** Live-Cross-Knoten (sehen/fragen/antworten/andocken) **und** der Live-KI-Aufruf
> mit echtem Schlüssel sind **nur am Tablet beweisbar**. Headless beweist Mount/Verdrahtung/
> Theme/Tresor-Krypto/fail-soft. **Wartet auf Klaus' Browser-Lauf** (auf der live-deployten
> `main` nach dem Merge — Hard-Reload Strg+Umschalt+R).

---

## 1. Ziel dieser Sitzung: Stufe D — das Siegel

Nach Skill **`status-leiste-siegel`** (Pflichtlektüre!) das **selbst-signierende SBKIM-Siegel**
in Private-Brain-Optik bauen. **Kein Badge allein** — der Skill verlangt BEIDES:

1. **Status-Lampen-Leiste** (Flying-Widget Modul 17 — LEBT/VERKEHR/FREMD/SIEGEL) + Wächter
   (Modul 15 Membran) + Bronze/Gold (Modul 16). Prüfen, ob Modul 15/16/17 schon vorliegen —
   falls nicht: **byte-1:1 aus Sage holen** (wie Stufe A), Drift-Guard-Einträge ergänzen,
   in `index.html`/`sw.js` laden.
2. **PFLICHT-INHALT des Siegel-Modals** — das Andock-Werkzeug, allen voran der **ANDOCK-WIZARD**
   als eigenes Modal-Modul (🔑 eigene Identität & Spore erzeugen/verwalten: Identität · Spore
   signieren+Download · verschlüsseltes Backup · Wiederherstellen · Identitäts-Wechsler), dazu
   ✍ Semantik-Beschreibung → Spore neu signieren, 🛡 Schutz-Block + Erklär-Overlay, ⛨ fremden
   Knoten andocken. **NICHT** mit Modul 19 (Onboarding-Vorlage ohne Krypto) verwechseln.

**Design-Leitplanken (unverändert):** Private-Brain-Optik, hell/dunkel-anpassend, schlanke
Knöpfe (`.pbnet-mini`), fail-soft & Fremdnutzer-Brille, Empfangsmodus (nutzer-ausgelöst).

## 2. Optionaler Feinschliff (kleiner, wenn Zeit / vor D)

- Der bestehende `#sbkim-rdv-out` wurde aus dem Netz-Tab entfernt; `createIdentity`-Textschritte
  laufen jetzt nur über den Modell-%-Balken (Event). Falls Klaus die Textschritte vermisst:
  `createIdentity` an das `out()` des aktiven Werkzeugs koppeln (kleine Politur).
- Prüfen, ob eine `install` von `sw.js` v26 sauber greift (Klaus' Hard-Reload-Sichttest).

## 3. Datenverträge / Flächen (nur benutzen, NICHT umbauen)

- **Modul 23** (`window.SbkimRendezvous`): `connectAndAnnounce/announce/discover({listenMs})/
  askNode(card,text)/enableAnswering/disableAnswering/fetchAnswers(qids,{waitMs})/
  repairAndReconnect/handshakeCard/relatednessForCards/rankCardsByQuery`.
- **Modul 04** (`window.SbkimMatch`): `hybridMatch(query,cands,{apiKey,provider,euOnly,model})`
  (verdicts `{label,anchorId,passt,score,sicherheit,begruendung}`; `available:false` = fail-soft
  ohne Key) · `relatedness` · `_meta.hybridProviders` (`[{id,label,region}]`).
- **Modul 20** (`window.SbkimSafe`): `putSecret(name,val,pw,{hint?})/getSecret(name,pw)/
  hasSecret/removeSecret/getSecretHint` + `open/createVault/unlock/lock/hasVault`.
- **Modul 21** (`window.SbkimSpeech`): `makeBrowserRecognizer({lang,onResult,onError,onEnd})`.
- **TABU:** Kern-Module 01/02/03/04/05/05b/20/21/23 **byte-1:1** (Drift-Guard). Kein
  `PROTOCOL_VERSION`/`DB_VERSION`-Bump, `PROVIDER_MIN_MATCH` unberührt. DB-Suffix `privatbrain`.

## 4. Akzeptanzkriterien

- `npm test` grün (Drift-Guard inkl. evtl. neuer Module 15/16/17 byte-1:1 + alle e2e).
- Je Stufe/Feature eine **e2e-Suite** (Mount/Öffnen/Funktion/Theme/fail-soft), in die Kette
  (`package.json`) aufgenommen. **Theme-Test** (Muster: `tools/e2e-netwidget.mjs`).
- Netz-Tab UND Flying-Widget beide funktionsfähig. Knopf-Größen schlank.
- **Ehrlich:** kein „grün" ohne Klaus' Browser-Lauf.

## 5. Pflichtlektüre VOR dem Bau (Reihenfolge)

1. `CLAUDE.md` (Verfassung, Freibrief, DB-Suffix, Design-Vorgabe).
2. Dieser Brief + der Vorgänger `BRIEF_NACHFOLGE_2026-07-18_netzwerkzeug-voll.md`.
3. **Skill `status-leiste-siegel`** (Pflicht-Inhalt des Siegel-Modals).
4. `Sage-Protokol/src/modules/` — 15_membran · 16_siegel · 17_floating_widget (+ Andock-Wizard-
   Modul, siehe Skill) als Funktions-/Kopier-Referenz.
5. `modules/net-widget.js` + `modules/rendezvous-init.js` + der Netz-Tab in `index.html`
   (`#panel-net`, `#pbNetTabMount`).

## 6. Offene Fragen an Klaus (vor größerem Bau kurz zeigen)

- Siegel **im Netz-Werkzeug** verankern (eigener Abschnitt) oder als **eigene Karte/Panel**?
- Lampen-Leiste: als Teil des schwebenden 🌐-Knopfs oder eigenes kleines Flieger-Widget (Modul 17)?
- Sollen Module 15/16/17 byte-1:1 geholt werden (wie Sage), oder reicht ein nativer Private-Brain-
  Nachbau des Siegel-Modals (kein Drift-Guard, aber weniger 1:1)?

## 7. Abschluss-Befehl (Brief-Kette reißt nie ab)

Am Sitzungsende: Stand fortschreiben, **neuen** Brief `BRIEF_NACHFOLGE_<datum>_<thema>.md` anlegen
(Stand · geplant · gebaut · Datenverträge · Akzeptanz · Reihenfolge · offene Fragen), diesen Brief
**vollständig als Codeblock im Chat** ausgeben, Pflichtlektüre + diesen Abschluss-Befehl wiederholen.
Getestete, abgegrenzte, nicht-zweifelhafte PRs selbst mergen (Freibrief).
