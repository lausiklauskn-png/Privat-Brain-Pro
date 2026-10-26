# Forschung Sitzung 1 (2026-10-26)

Erkenntnisse, die nächste Sitzungen Zeit sparen.

1. **Ein Webteil, drei Fassungen.** Pro: `prepare-web.mjs` → `www/`. Windows kopiert `www/` nach `windows/dist`
   (`windows/tools/build-web.mjs`), die PWA wird aus `www/` gemacht (`prepare-pages.mjs`). V3 ist gleich aufgebaut.
   Alles, was in `native/`, `assets/` oder in den Bau-Anpassungen (`adapt-search.mjs`, `v3-prerender.mjs`) geändert
   wird, gilt für Android, Windows und PWA zugleich.
2. **`index.html` nicht anfassen (Pro).** Pro passt das geerbte HTML nur beim Bauen an (`adapt-search.mjs`; jede
   Ersetzung wirft, wenn ihr Anker fehlt). V3 macht das in `v3-prerender.mjs` (`swap`). Laufzeit-Umbauten gehören in
   eigene Skripte (`native/*.js` bzw. `assets/v3-*.js`).
3. **Neue Dateien erst `git add`, dann bauen.** `prepare-web.mjs` nimmt `assets/` über `git ls-files`. Eine
   ungetrackte Datei fehlt sonst still im Bau (so beim ersten V3-Versuch mit `v3-dupes.js`).
4. **Pro-`native/`-Dateien** müssen in `prepare-web.mjs` zweimal eingetragen werden: im `<script>`-Einschub und in
   der Kopierliste.
5. **V3 hat kein `window.PBIcons`**, Pro schon. Darum zeichnet V3 Symbole selbst (`trashIcon()` in `v3-dupes.js`).
6. **CSS-Rang:** `panes-layout.css` wird nach `design-layout.css` geladen. Gleich spezifische Regeln für die
   Mail-Ordnerleiste verlieren. Darum `.mail-layout > .mail-folders`.
7. **Globale Funktionen der alten Seite** (`renderDupes`, `dupSel`, `dupeGroups`, `locsOf`, `dupKey`) sind aus
   anderen klassischen Skripten erreichbar. `window.renderDupes` lässt sich umhüllen, die Seite ruft die Hülle auf.
8. **Lokaler Bau in dieser Umgebung:** Node 24 über `/opt/nvm` (`nvm install 24`); das Anleitungsvideo über einen
   Lade-Haken ersetzen, weil `lausiklauskn-png.github.io` gesperrt ist. Chromium: `CB_CHROMIUM=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome`.
9. **Prüfung der Pages-Fassung braucht frisches `www/`.** `test-pages.mjs` ruft `prepare-pages.mjs` selbst auf.
   Lief es vorher schon, fehlt der Anker, und die Prüfung bricht ab.
10. **V3 kennt den gesperrten „Workflow PDF Pro“ nicht.** Die Werkzeugliste von V3 ist älter als die von Pro (ohne
    `workflowpdfpro`, ohne BookLedgerPro, ohne App-Start). Angleichen in Sitzung 6.
