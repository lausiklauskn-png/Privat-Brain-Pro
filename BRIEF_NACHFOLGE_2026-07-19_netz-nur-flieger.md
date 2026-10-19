# BRIEF an die Nachfolge-Sitzung — „Mit dem Netz verbinden": nur noch der Flieger

**Datum:** 2026-07-19 · **Repo:** Privat-Brain · **Branch:** `claude/semantik-krypto-fortsetzung-yuskz5`
**Freibrief gilt** (CLAUDE.md § Selbst-Merge/Plan-vor-Code). **Kein PII, offline-first,
`npm test` = Beweis, Klaus' Browser-Sichttest bleibt.**

---

## 0. Auslöser (Klaus 2026-07-19, mit Screenshot)

Klaus sah auf dem Tablet **„3x Netz"**: (1) den festen Tab „🌐 Netz" + sein Panel,
(2) die schwebende Blase „🌐 Netz", (3) die schwebende Leiste „🌐 Mit dem Knotennetz
verbinden ☐ ✕". Sein Auftrag wörtlich: **„alter Netz-Button weg und ‚Mit dem Netz
verbinden' aus Sage-Skill und Bauplan neu bauen mit Design von PB-Themen"** +
Wahl im Menü: **„Nur der Flieger"**.

## 1. Was gebaut wurde (diese Sitzung)

**Ergebnis: „Mit dem Netz verbinden" lebt jetzt AUSSCHLIESSLICH im schwebenden
🌐-Flieger** (`modules/net-widget.js`), in Private-Brain-Optik (hell/dunkel, schlanke
Knöpfe), dem Sage-Skill `saubere-netz-anmeldung` folgend (Identität/Spore/Anmelden
über `rendezvous-init.js` unverändert).

1. **Alter fester Netz-Tab + `#panel-net` entfernt** (`index.html`): Tab-Button weg,
   ganze Netz-Sektion weg (inkl. `#pbNetTabMount` und dem Pinnwand-„folgt"-Platzhalter).
2. **Flieger = EIN Ding zur Zeit** (`net-widget.js` `openPanel`/`closePanel`): Panel
   offen → Öffner-Blase (`#pbNetBtn`) versteckt; Panel zu → nur die Blase. Behebt die
   Doppel-Anzeige („3x Netz").
3. **`boot()` montiert nur noch `mountFlying()`** — `mountTab()` + `PBNetWidget.mountTab`
   entfernt; `rendezvous-init.js` ruft es nicht mehr.
4. **Gerätename-Feld in den Flieger verlegt** (war im gelöschten Tab): eigenes Feld
   im `buildTool` (Klasse `pbnet-gnfield`, damit es NICHT mit dem Frage-Feld
   `pbnet-field` kollidiert), speichert `sbkim_geraetename`, feuert
   `sbkim:geraetename-changed` → `rendezvous-init.js` re-konfiguriert `displayNodeName`.
   Der tote Wiring-Block in `index.html` ist entfernt.
5. **SW-Cache-Bust** `private-brain-v33` → **v34**.
6. **Tests angepasst** (Tab → Flieger): `e2e-netwidget.mjs` (kein Tab mehr +
   Gerätename im Flieger + Blase-XOR-Panel), `e2e-netwidget-b.mjs` (nur-Flieger-Checks),
   `e2e-relay.mjs` (Flieger statt Tab).

**TABU gewahrt:** Kernmodule (01/02/03/04/05/05b/23/…) **byte-1:1** (Drift-Guard 14/0),
`PROVIDER_MIN_MATCH`/0.80-Riegel + DB-Suffix `privatbrain` + PROTOCOL/DB_VERSION unberührt.

## 2. Beweis

`npm test` **komplett grün** (Drift-Guard 14 byte-identisch/0 abgewichen; alle e2e-Suiten
0 fehlgeschlagen). Insb. `e2e-netwidget` 24/24, `e2e-netwidget-b` 29/29, `e2e-relay` 9/9,
`e2e-netwidget-c` 20/20.

## 3. Offen / wartet auf Klaus (Browser-Sichttest — nicht ersetzbar)

- **Sichttest am Tablet:** nur noch EIN Netz-Zugang (der 🌐-Flieger); kein Tab, keine
  Doppel-Anzeige; Panel auf/zu zeigt Blase XOR Panel; Gerätename-Feld im Flieger tippbar,
  Name erscheint im Raum neben der Kennung. **Hard-Reload nach dem Deploy (SW v34).**
- **Stufe D Siegel** (bereits gebaut, #38) unberührt.
- Danach: reguläre Semantik-/Krypto-Liste (`Sage-Protokol/docs/PLAN_SEMANTIK_KRYPTO.md`)
  bzw. Privat-Brain-Stufenfahrplan (Stufe 1 Katalog-Verschlüsselung ff.).

## 4. Pflichtlektüre VOR dem nächsten Bau

1. `CLAUDE.md` (Verfassung, Freibrief, DB-Suffix, Design-Vorgabe).
2. Dieser Brief + `BRIEF_NACHFOLGE_2026-07-18_netzwerkzeug-voll.md` (der volle Bauplan).
3. Skills: `saubere-netz-anmeldung` · `geraetename` · `status-leiste-siegel` ·
   `verschluesselter-schluessel-tresor`.
4. `modules/net-widget.js` + `modules/rendezvous-init.js` (aktueller Stand).

## 5. Abschluss-Befehl (Brief-Kette reißt nie ab)

Am Sitzungsende: Stand/Brief fortschreiben, neuen `BRIEF_NACHFOLGE_<datum>_<thema>.md`
anlegen, vollständig als Codeblock im Chat ausgeben, Pflichtlektüre + diesen Befehl
wiederholen. Getestete, abgegrenzte PRs selbst mergen (Freibrief).
