# Forschung Sitzung 4 (2026-10-26)

Ergänzt [Forschung Sitzung 1](FORSCHUNG-SITZUNG-01.md), [2](FORSCHUNG-SITZUNG-02.md) und [3](FORSCHUNG-SITZUNG-03.md).

1. **Messen, wo das Netz offen ist.** Der Behälter erreicht weder jsDelivr noch Hugging Face. Pins, Größen und
   Arbeitsspeicher des Bildmodells kommen aus einem GitHub-Lauf (`caption-model-pins.yml`: `fetch-caption-model.mjs --learn`
   schreibt `CAPTION-PIN`/`CAPTION-TOTAL`, `measure-caption-model.mjs` lässt das echte Modell im Chromium laufen und liest
   den Prozess-RSS mit `ps`). `workflow_dispatch` über die API gab 404 für einen Workflow, der nur auf dem Zweig liegt –
   darum zusätzlich `push: paths:` auf seine eigenen Dateien.
2. **Zweites Modell über dieselbe Maschine.** `ProCaptionPlugin` ist `ProSemanticPlugin` mit anderem Ordner, anderen
   Prefs und anderer Pin-Datei; `ProSemanticPlugin.entries(String)` ist dafür herausgelöst. `BundledLibrary.respond(assets,
   url, SemanticModel...)` beantwortet jsDelivr und `https://localhost/models/<id>/` für beide. Windows: `DesktopModel(state,
   manifest, dir, event, pathFn)`, Slice-Anker für `windows/engine/build.mjs` unverändert gelassen.
3. **Globale Funktionen aus `index.html` lassen sich umwickeln.** `rebuildIndex`, `passageText`, `bestCaption`, `idbPut`,
   `passesFilter`, `filterActive`, `search`, `loadCaptionScript`, `openLightbox`, `showBlob` sind Funktionsdeklarationen,
   also zuweisbare globale Bindungen. `pb-bildbeschreibung.js` ersetzt sie durch Hüllen, die das Original aufrufen – so
   bleibt `index.html` unangetastet, `e2e-caption` und die Bau-Anker gelten weiter.
4. **Nichts in den Suchkasten legen.** Der Pro-Suchkasten ist am Desktop ein Flex-Wrap, unter 650 px ein Grid mit festen
   Spalten. Ein offener Hilfetext darin machte den Kasten am Desktop 90 px hoch und fiel am Handy in eine 32-px-Spalte
   (gemessen: 2 500 px hoch). Schalter, ⓘ und Erklärung stehen jetzt in einer eigenen Zeile **nach** dem Kasten
   (`#pb-bild-row`); V3s Kasten ist von sich aus 50 px, die Probe misst darum „nichts von mir im Kasten, einzeilig“.
5. **Workflow-PDF: Nähte hineinreichen.** `WFP.Bild.init({S, EINST, einstSpeichern, DB, dialog, toast, neu, sprechen,
   micSprache})` – das Modul kennt app.js nicht, ist in Node prüfbar und hat genau fünf Haken in `app.js`: Suchfelder
   (`concat(bildFelder(d))`), Filter (`&& bildFilter(d)`), `kartenBinden` → `karten(g)`, `oeffneDok` → `editor(d)`,
   `ladeBibliothek` → `nachziehen()`. `DB` ist auf der Seite `WFP.DB`, nicht global.
6. **TDZ-Falle beim Lauf.** `const lauf = B._lauf = (async () => { … alleBeschreiben(lauf) … })()`: ist das Modell schon
   da, läuft der Rumpf synchron bis zum ersten `await` und liest `lauf`, bevor die Zuweisung steht („Cannot access 'lauf'
   before initialization“). Erster Befehl im Rumpf ist jetzt `await Promise.resolve()`. Gefunden von der Probe
   (Nachziehen neuer Fotos), nicht vom Nachdenken.
7. **Eine Zeile statt zwei.** Schalter + ⓘ + „Fotos beschreiben lassen“ stehen in Workflow-PDF in **einer** Flex-Zeile
   (`#bildZeilen`), die Erklärung darunter. Mit zwei Zeilen lagen die Karten in `tests/teilen.mjs` bei 900 px Höhe in der
   60-px-Rollzone des Ziehens (`ziehRollen`), und die Seite rollte beim Mauszug weg; die Probe hat dort jetzt 1100 px
   Höhe (mehr Fenster, nicht weniger Prüfung).
8. **Proben sollen rot werden, nicht sterben.** Drei Wartepunkte (Filterliste, Namenssuche, Fehlerzustand) liefen bei
   einer Sabotage in `waitForFunction`-Zeitabläufe statt in eine benannte rote Zeile → „aus falschem Grund“. Muster:
   `waitForFunction(…, {timeout: 8000}).catch(() => {})`, dann die Zusicherung mit Namen und Befund.
9. **Tote Sabotage erkennen.** „Riegel vor der Schleife entfernen“ fing nichts, weil `alleBeschreiben` denselben Riegel am
   Schleifenanfang hat. Sabotiert wird jetzt das Abbrechen selbst (`B._lauf = null` weg) – das fängt die Zeile „auch nach
   dem Ende des Ladens bleibt es aus“.
10. **Übersetzungsschlüssel mit Zahlen.** `sprache.js` macht `<span data-kein-ue>` zu `<n>…</n>`, der Schlüssel trägt `{}`:
    `Bildmodell wird geladen: ${nm(mb)} von ${nm(gesamt)} MB` → „Bildmodell wird geladen: {} von {} MB“. Zahlen nie nackt in
    übersetzte Sätze, sonst fehlt der Eintrag bei jeder Zahl. Toasts ebenso.
11. **Playwright 1.56 sucht Chromium 1194**, installiert ist 1243. Symlinks `/opt/pw-browsers/chromium*-1194 → …-1243` und
    darin `chrome-linux/chrome` bzw. `chrome-linux/headless_shell` auf die neuen Pfade; danach läuft `npm test` von
    Workflow-PDF ohne `executablePath`. Ohne das war `tests/e2e.mjs` nach 4 Proben tot (kein Code-Fehler).
12. **`setInputFiles` mischt keine Pfade und Puffer** – entweder alles als `{name, mimeType, buffer}` oder alles als Pfad.
13. **Arbeitsverzeichnis springt.** Zwischen Befehlen (und in Verbundbefehlen) wechselt die Shell das Verzeichnis zurück;
    `cp -r www …` landete leer. Immer absolute Pfade und `git -C`.
14. **Workflow-PDF-Pro zieht den Kern bytegleich**: `upstream/workflow-pdf` ist eine Kopie der Workflow-PDF-Dateien
    (`git ls-files`), `docs/portierung/QUELLDATEIEN-SHA256.json` trägt Commit und SHA je Datei (Skript wie
    `tools/onboarding/inventar.py`, nur mit Pfaden als Argumente), `verify-upstream` prüft; Anker `app.js?v=…` in
    `tools/native/prepare-web.mjs` (zweimal) und `windows/tools/build-web.mjs`. Jede Cache-Erhöhung im Kern = neue
    Webversion (`tests/version.mjs`) = neue App-Version in sieben Dateien (`build.gradle`, `package.json`+lock,
    `windows/package.json`+lock, `tauri.conf.json`, `Cargo.toml`+lock).
