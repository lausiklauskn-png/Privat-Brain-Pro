# BRIEF an die Nachfolge-Sitzung — Signierung / ID / Spore + Siegel (Private Brain + restliche Repos)

**Datum:** 2026-07-19 · **Repo (Start):** Privat-Brain · **Branch:** `claude/semantik-krypto-fortsetzung-yuskz5`
**Freibrief gilt** (CLAUDE.md § Selbst-Merge/Plan-vor-Code, netzweit). **Kein PII, offline-first,
`npm test` = Beweis, kein privater Schlüssel ins Repo, Klaus' Browser-Sichttest bleibt.**

---

## 0. Deine Aufgabe in einem Satz

Die **eigene SBKIM-Identität + Spore (v0.2) für Private Brain erzeugen und signieren** (das Repo hat
**noch keine** `sbkim/`-Identität), das **Siegel signieren** (Bronze→Gold), und danach die **noch
fehlenden Repos** auf eine gültige **v0.2-Live-Spore** bringen (A10-Operator-Schritt). „So viel
sind's nicht mehr" (Klaus).

**Natur der Aufgabe:** Das ist ein **Operator-Schritt** — die eigentliche Signatur läuft mit Klaus'
**privatem Schlüssel im Browser** (nicht headless erzeugbar; der Schlüssel darf NIE ins Repo). Deine
Rolle: Klaus **Schritt für Schritt** durch das Andock-/Siegel-Werkzeug führen (Einzelschritte, er ist
kein Programmierer), dann die von ihm **heruntergeladenen Dateien** (`spore.json`, `status.json`)
committen + `NETZ-STAND`/`status.json` nachziehen.

---

## 1. 📌 MERKLISTE — offene Browser-Sichttests (nur Klaus, nicht headless ersetzbar)

Diese laufen auf der **live-deployten** Seite (nach Hard-Reload / 🔄-Knopf). Alle Motor-/UI-/Krypto-
Logik ist headless bewiesen; es fehlt Klaus' echter Blick am Tablet/Handy:

- [ ] **1:1-Anruf (Ton + Video) im Privat-Modus — ZWEI Geräte** (SW v39). Der Wunsch-Test von Klaus
      (2026-07-19, bewusst später). Ablauf: beide Geräte 📌 Pinnwand öffnen → sich **gegenseitig als
      Kontakt** freigeben (Absender-Name antippen) → Flieger offen lassen → Gerät A: 👤 Kontakte →
      **📹 Video**/**📞 Ton** → Gerät B **klingelt** → Annehmen → Kamera/Mikro erlauben. (Ohne TURN
      können strenge NAT/Mobilfunk scheitern → optional coturn auf Hetzner, Gerüst liegt.)
- [ ] Pinnwand-Flieger allgemein: ⛶ Vollbild, 🔄 Hard-Reload, KI-Richter-Dropdown inkl. **WebLLM**
      (Modell laden), Modell-Fächer + „dein Gerät hat ~X GB"-Hinweis.
- [ ] **🏢 Intern-Modus** (eigenes Firmen-Brett): auf zwei Geräten gleicher Firmen-Name + Gruppen-
      Passwort → dasselbe interne Brett; öffentlich zeigt es NICHT.
- [ ] Netz-Flieger (🌐): ein Klick → volles Panel, `–`/`✕` schließt, 💬 Erklärung.

---

## 2. Stand — was DIESE Sitzung (2026-07-19) erledigt hat (alles gemergt auf `main`)

Private Brain „Mit dem Netz verbinden" + Pinnwand als PB-native Flieger, komplett im PB-Theme
(hell/dunkel), Kernmodule byte-1:1 (Drift-Guard 15/15), DB-Suffix `privatbrain`, `npm test` je grün:

- **#42/#43** Netz-Flieger: alter Netz-Tab entfernt → nur der schwebende 🌐-Flieger; ein Klick auf →
  volles Panel, `–`/`✕` schließen, 💬-Erklärung; Gerätename ins Panel.
- **#44** Pinnwand als PB-nativer 📌-Flieger (Brett über eigenes Nostr-Brett `sbkim-privatbrain-brett`,
  Bedeutungs-Sortierung Modul 03, DM-Krypto B7 `dm_crypto.js`, Gerätename).
- **#45** ⛶ Vollbild + 🔄 Hard-Reload + KI-Richter-Dropdown mit interner **WebLLM** + Cloud (Claude/
  Gemini/OpenRouter).
- **#46** WebLLM-Modell-Fächer mit **Systemvoraussetzungen** (RAM je Modell) + „dein Gerät hat ~X GB"-
  Hinweis + ehrliche ~8B-Grenze; **Hetzner-Mirror als schlafendes Gerüst** (Default = Gratis-CDN,
  Klaus-Entscheid „beim Gratis-CDN bleiben").
- **#47** Kanal-Umschalter **🌐 Öffentlich · 🏢 Intern** (eigenes Firmen-Brett: Gruppen-Name → eigener
  Tag `sbkim-intern-<sha256-16>`, Gruppen-Passwort symmetrisch). „🔒 Privat an" bleibt orthogonal.
- **#48** **1:1 verschlüsselter Anruf (Ton + Video)** im Privat-Modus: WebRTC (E2E DTLS-SRTP),
  Signaling server-los über das Relais, pro Kontakt verschlüsselt (dm_crypto); Klingel-UI; STUN-Default
  + TURN-Gerüst (`sbkim_pinnwand_ice_privatbrain`). SW v39.

Ergebnis: drei Ebenen (öffentlich/intern/privat) + Anruf + WebLLM/Cloud-Richter, alles server-los.

---

## 3. NÄCHSTE AUFGABE — Signierung / ID / Spore + Siegel

### 3a. Private Brain: eigene Identität + Spore v0.2 + Siegel (ZUERST)

**Befund:** Private Brain hat **noch keine** `sbkim/`-Identität/Spore (`sbkim/` fehlt, keine
`status.json`). Der **Siegel-/Andock-Wizard** ist aber vorhanden: `assets/siegel-inhalt.js` (Bausteine:
Identität erzeugen · Spore signieren · **Spore neu signieren** · Backup · Wiederherstellen · Siegel) +
`modules/16_siegel.js`. DB-Suffix ist `privatbrain` (via `window.SBKIM_DB_SUFFIX`).

**Ablauf (Operator, Klaus' Browser — du führst Schritt für Schritt):**
1. Vorab prüfen: setzt die Seite `window.SBKIM_DB_SUFFIX="privatbrain"` **vor** dem ersten SBKIM-Script?
   (Skill `saubere-netz-anmeldung` — sonst landet die Identität im geteilten Topf `sbkim`.) Wenn nicht
   sauber, erst das richten.
2. Siegel öffnen → **Identität erzeugen** (Ed25519, in Schublade `sbkim_privatbrain`). **Backup** des
   privaten Schlüssels (verschlüsselt) sichern lassen — Schlüssel bleibt bei Klaus, NIE ins Repo.
3. **Semantik-Beschreibung** (Domäne „privates zweites Gehirn / Bedeutungs-Suche über eigene Daten,
   offline") eintragen → **Spore signieren** (v0.2, mit Satz-Schnipseln `embedSnippets`, echter
   e5-`domainVector`). Ergebnis: `spore.json` (+ ggf. `status.json`) herunterladen.
4. Dateien nach `Privat-Brain/sbkim/spore.json` (+ `status.json`) legen, committen, pushen. Prüfen:
   `protocolVersion: "0.2"`, reziprok verifizierbar (`npm run verify`-Äquivalent / Smoke, falls vorhanden).
5. **Siegel** Bronze sichtbar; nach erstem etablierten Handshake **Gold** (Aspekt „Mycel-Verbindung").
6. `status.json` `pingStatus`/nodeId nachziehen; Sage `sbkim/NETZ-STAND.md` um Private Brain ergänzen.

### 3b. Restliche Repos: Live-Spore auf v0.2 neu signieren (A10-Operator-Schritt)

Der **Code** für Spore v0.2 (Modul 02/03 `embedSnippets`, PROTOCOL_VERSION 0.2) + der Andock-Wizard
(„✍ Semantik → Spore neu signieren") liegen netzweit (Sage-Plan A10). **Offen** ist nur die
**Neu-Signatur der LIVE-Sporen** je Knoten mit dem privaten Schlüssel (Klaus' Browser). Bis dahin
tragen manche committete `spore.json` noch `0.1` (handshake-kompatibel, sanfter Übergang).

**Vorgehen für die Folge-Sitzung:**
1. **Karte machen:** pro Knoten die committete `sbkim/spore.json` (bzw. repo-eigener Pfad) prüfen —
   `protocolVersion` 0.1 vs 0.2. Quelle/Überblick: `Sage-Protokol/docs/PLAN_SEMANTIK_KRYPTO.md` §A10
   + `Sage-Protokol/sbkim/NETZ-STAND.md` + jeweilige `status.json`.
2. Für jeden Knoten, der noch 0.1 trägt: Klaus im Browser den App-Knopf **„✍ Semantik → Spore neu
   signieren"** ausführen lassen (lädt Modell, bettet Satz-Schnipsel ein, signiert v0.2) → neue
   `spore.json` committen. Bekannte v0.2-fertige: **Sage** (`nysOZE3V…`), **SB-KIMTool-Point**
   (`CyunQNDR…`). Der Rest = die „noch fehlenden".
3. Reihenfolge klein halten (Einzelschritte pro Knoten, je ein Commit); nach jedem Knoten kurz
   `NETZ-STAND` + `status.json` nachziehen.

**Wichtige Grenzen/Regeln:** privater Schlüssel NIE ins Repo/Chat; DB-Suffix je App eindeutig
(Skill `saubere-netz-anmeldung`); `PROVIDER_MIN_MATCH`/0.80-Riegel unberührt; 0.1↔0.2 ist sanft
(gleiche Hauptversion → handshake-kompatibel), also kein Bruch, wenn ein Knoten noch 0.1 trägt.

---

## 4. Pflichtlektüre VOR dem Start (Reihenfolge)

1. `CLAUDE.md` (Verfassung, Freibrief, DB-Suffix `privatbrain`, Design-Vorgabe).
2. Dieser Brief.
3. Skills: **`saubere-netz-anmeldung`** · **`status-leiste-siegel`** (Siegel + Andock-Wizard-Pflichtinhalt)
   · `verschluesselter-schluessel-tresor`.
4. `Sage-Protokol/docs/PLAN_SEMANTIK_KRYPTO.md` §A6/A10 (Spore v0.2 + Operator-Schritt) +
   `Sage-Protokol/sbkim/NETZ-STAND.md`.
5. Private Brain: `assets/siegel-inhalt.js` (Wizard) + `modules/02_spore.js`/`03_embedding.js` (nur lesen,
   byte-1:1) + `modules/16_siegel.js`.

## 5. Abschluss-Befehl (Brief-Kette reißt nie ab)

Am Sitzungsende: Stand fortschreiben, neuen `BRIEF_NACHFOLGE_<datum>_<thema>.md` anlegen (Stand ·
getan · offen · Merkliste · nächste Schritte), diesen **vollständig als Codeblock im Chat** ausgeben,
Pflichtlektüre + diesen Abschluss-Befehl wiederholen. Getestete, abgegrenzte PRs selbst mergen
(Freibrief); Operator-Ergebnisse (spore.json/status.json) nach Klaus' Browser-Lauf committen.
