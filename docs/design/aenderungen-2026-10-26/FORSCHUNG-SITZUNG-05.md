# Forschung Sitzung 5 (2026-10-26)

Ergänzt [Forschung Sitzung 1](FORSCHUNG-SITZUNG-01.md), [2](FORSCHUNG-SITZUNG-02.md), [3](FORSCHUNG-SITZUNG-03.md) und
[4](FORSCHUNG-SITZUNG-04.md).

1. **Gegen ältere Regeln ankommen, ohne `index.html` anzufassen.** Pro hält die Kacheln mit `.tile:hover { transform: none
   !important }` still, und `html[data-pb-theme] .tile` setzt Farben mit höherer Spezifität. Die gemeinsame Datei gewinnt mit
   `:is(#panel-dash .tile, #groups > .grp, …).pb-3d` (Id-Spezifität über `:is()`) und für die Neigung mit eigenem `!important`.
   So bleibt `index.html` in beiden Repos für Punkt 5/6a unverändert; nur Pros `prepare-web.mjs` und V3s `index.html`/`sw.js`
   binden die vier Dateien ein.
2. **In Ruhe ist `transform` keine `none`.** `perspective(600px) rotateX(0) rotateY(0)` ergibt eine 3D-Matrix. „Nach dem
   Verlassen zurückgesetzt“ misst die Probe darum als „gleich wie der unberührte Nachbar“, nicht als `none`. Bei „weniger
   Bewegung“ ist es `none`, dort steht die Regel `transform: none !important`.
3. **Chromium meldet `color-mix()` als `color(srgb r g b)`.** Die Kontrast-Rechnung der Probe las nur `rgba?(…)`, nahm sonst
   `0,0,0` und maß für die gemischten Farben den Kontrast von Schwarz: 16,8, mehr als die reine Textfarbe (13,0) – ein Wert,
   der nicht sein kann, und erst beim Lesen der Zahlen aufgefallen ist, nicht beim grünen Haken. Jetzt liest sie beide
   Schreibweisen (Anteile 0–1 mal 255), und eine unlesbare Farbe wird `NaN` statt Schwarz, damit ein Vergleich rot wird. Lehre:
   **eine Probe, die bei Unlesbarem einen „sicheren“ Wert annimmt, ist blind** – sie muss sterben oder rot werden.
4. **Alle Themen ohne Neuladen messen.** `native-theme.js` setzt `data-pb-theme` (und für nachtblau `data-theme="dunkel"`),
   `themes.js` setzt `data-look`. Die Probe setzt die Attribute direkt am `<html>`, misst, und stellt den Stand danach wieder her;
   `--acc` kommt je Thema aus einem Fühler-Element (`span` mit `color: var(--acc)`), nicht aus einer Tabelle.
5. **Fangphase statt Umbau.** `#reorgPreview` und `#reorgStart` haben ihre Zuhörer in `index.html` (`previewReorg`, `startReorg`).
   Ein Zuhörer in der Fangphase mit `stopImmediatePropagation` ersetzt das Fenster durch den Baum, ohne die Funktionen zu
   ändern. Für den Zielordner nach dem Kopieren wird `window.showDirectoryPicker` **vorübergehend umwickelt**: `startReorg`
   wählt den Ordner wie bisher, das Skript merkt sich den gewählten `handle` und liest ihn danach (`handle.values()`), dann
   wird die Original-Funktion zurückgesetzt (auch bei Fehler, `finally`).
6. **Die ⓘ-Mechanik nimmt neue Hinweise von selbst.** In Pro hatte die Kategorien-Seite keine Einleitung mehr (Sitzung 3 nahm
   sie weg). Ein neues `p.hint` vor `#groups` wird von `native-help.js` beim nächsten `refresh` als `categories-intro` mit ⓘ
   versehen, anfangs offen und gemerkt – ohne Änderung an `native-help.js`. V3 hat seine Einleitung behalten; dort hängt der
   Satz als `span.pb-cats-why` daran.
7. **Die letzte rote Zeile war die Probe, nicht das Merkmal.** `':scope>li .pb-zo-name'` (Nachfahre) sammelte auch die Namen der
   Dateien in den Unterlisten, der sortierte Vergleich der Ordnernamen passte nie. Mit `':scope>li>.pb-zo-node>.pb-zo-name'`
   (Kinder) stimmt er. Zuerst die Zusicherung auseinandernehmen (jeden Teil einzeln ausgeben), bevor man das Merkmal verdächtigt.
8. **V3s `prepare-web.mjs` kopiert nur verfolgte Dateien** (`git ls-files`): neue Dateien in `assets/` fehlen im Bau, bis sie
   `git add` sind. Pro kopiert nach Liste in `prepare-web.mjs`.
9. **`test-filme` ist lokal grün, wenn der Film da ist.** Mit `PB_FILM_SOURCE=<lokaler Klon von Family-Projekt.de-Video>` baut
   `bundleFilms` ohne Netz; damit laufen beide `test:native-web`-Ketten vollständig durch (Pro 2019, V3 1077 grüne Zeilen).
   Bisher stand „lokal ohne Video rot, bekannt“ – das gilt nur ohne den Klon.
10. **Finger neigt nicht.** `pointerType === 'touch'` setzt keine Neigung (der Finger verdeckt den Knopf ohnehin), sondern nur
    `pb-3d-press`. „Weniger Bewegung“ wird doppelt beachtet: `matchMedia` im Skript (keine Variablen) und `@media` im CSS
    (`transform: none !important`), damit auch ein später gesetzter Zustand still bleibt.
11. **Gegenprobe-Harnisch:** „aus falschem Grund“ kam einmal nur vom Erwartungswort des Skripts („tint“ statt „gradient“), nicht
    von der Probe. Das Erwartungswort muss aus dem Namen der Zusicherung stammen, nicht aus dem Kopf.
12. **Bilder vom Zielordner ohne echten Ordner:** ein gestellter `FileSystemDirectoryHandle` (`values()`, `keys()`, `getFileHandle`
    mit `createWritable`, `getDirectoryHandle`) reicht für `startReorg` und den Baum. Dasselbe Muster trägt die Probe und das
    Bilder-Skript; in Sitzung 6 wird es die Grundlage für das Bearbeiten.
13. **V3s PWA-Proben sehen die gemeinsamen Dateien, Pros nicht.** V3 bindet `assets/pb-zielordner.js` direkt in `index.html` ein,
    darum lief `tools/e2e-advanced.mjs` (in `npm test`, CI-Job `validate`) gegen den Baum statt gegen das Fenster und war auf dem
    PR rot; Pro bekommt die Dateien erst über `prepare-web.mjs` in `www/`, seine Webproben blieben unberührt. Wer eine
    gemeinsame Datei baut, fährt in V3 auch `npm test`, nicht nur `test:native-web`. Lokal fällt `e2e-workspace.mjs` im Behälter
    beim Neuladen mit offenem Ordnerzugriff um – auch mit dem main-Stand – und ist auf GitHub grün: Grenze des Behälters.
14. **Zwei Flocken, beide benannt:** die Android-Updateprobe fiel einmal an einem hängenden Emulator-Launcher (`Application Not
    Responding: com.android.launcher3`, „Android folder picker did not open“) und war im nächsten Lauf grün; Pros WebKit-Jobs
    hingen 25 Minuten in „Browser-Engine installieren“ (abbrechen, `rerun_failed_jobs`, grün in 90 s). Ein Abbruch braucht
    bis zu zwei Minuten, bevor GitHub den Neustart annimmt („This workflow is already running“).

## Nachtrag: Veröffentlichungsphase am Abend (Claude, 2026-10-26)

15. **Das Windows-Release-Tor prüft den exakt aktuellen main-Commit.** `windows-release.yml` (Workflow-PDF-Pro) verlangt einen
    grünen `windows-app.yml`-Lauf mit `head_sha == main`. Ein reiner Unterlagen-Commit (Anker #27) trifft die Pfadfilter von
    `windows-app.yml` nicht, also gab es auf dem aktuellen main keinen Bau – das Tor hätte abgelehnt. Lösung: `windows-app.yml`
    einmal per `workflow_dispatch` auf main starten (das Tor nimmt `push` oder `workflow_dispatch`), dann das Release. Android
    war davon nicht betroffen: `native-acceptance.yml` läuft bei jedem Push auf main.
16. **`workflow_dispatch` über die GitHub-API reicht; der Git-Brückenzweig `release-requests/…` war nicht nötig.** Alle sechs
    Release-Läufe dieses Abends (Pro Android/Windows, V3 Android/Windows, Workflow-PDF-Pro Android/Windows) wurden direkt mit
    `tag` + `commit` gestartet. Die Brücke bleibt für Sitzungen ohne Actions-Recht.
17. **Ein Zweig, der nach einem Squash-Merge nicht auf main zurückgesetzt wurde, blockiert den nächsten Push.** In
    Workflow-PDF-Pro stand `origin/ccr-2068cf6c-0u3a7n` noch auf dem Anker-Commit aus Sitzung 4 (als #27 squash-gemerged: gleicher
    Inhalt, anderer Commit, kein Vorfahr von main). Der neu von main gestartete Zweig war darum kein Fast-Forward, und
    `--force-with-lease` lehnt der Auto-Modus ab („Git Destructive“). Ohne Force ging es so: alten Remote-Stand per Merge
    einziehen, Konflikte in `CLAUDE.md`/`PRODUKTSTAND.md` mit `--ours` auflösen, `git diff e56d6b6 HEAD` leer, dann gewöhnlich
    pushen. Besser vermeiden: nach jedem Merge den Zweig sofort auf `origin/main` setzen und pushen (so in Pro und V3 geschehen).
18. **Die WebKit-Jobs hängen auch auf Markdown-only-Commits.** V3 #27 (eine Zeile `CLAUDE.md`) blieb in beiden Läufen über 30 min
    in „Responsive Oberfläche (webkit)“; Logs eines laufenden Jobs liefert die API nicht (404). Dasselbe Rezept wie in Punkt 14:
    beide Läufe abbrechen, bis `completed/cancelled` warten (hier 7 × 15 s), `rerun_failed_jobs`, grün. Das ist kein Befund
    dieses PRs, sondern der Playwright-WebKit-Installation im Runner; eine dauerhafte Lösung (Browser-Cache oder WebKit nur bei
    Web-Änderungen) steht noch aus.
19. **Der Shell-Arbeitsordner geht mitten im Befehl verloren.** Ein `cd /home/user/Privat-Brain-Pro && git add -A && git commit …`
    lief einmal im zuvor aktiven Repo (Workflow-PDF-Pro, „nothing to commit“), weil der Behälter den Ordner zwischen zwei
    Aufrufen zurückgesetzt hatte. Seitdem nur `git -C <Repo>` und absolute Pfade, auch bei `sed -i`.
20. **Größen im Geschenk sagen, was im Paket steckt.** Workflow PDF Pro Android ist 83 MB (Texterkennung und Scanner-Modell im
    APK), Windows nur 16 MB (lädt WebView2 nach, kein Modell); Private Brain Pro 61/101 MB, V3 50/91 MB (Bedeutungs- und
    Bildmodell teils im Paket). Das Bildmodell der Bildbeschreibung (256 MB) ist in keinem Paket, es kommt erst auf Knopfdruck
    in den Browser-Vorrat der App – der „Neu“-Kasten im Geschenk sagt das ausdrücklich.
21. **„Neu in dieser Fassung“ im Geschenk** (Klaus: „dass man gleich weiß, was neu ist“): ein Kasten je App in der Farbe der App
    (`.neu`, Rand `var(--tone)`), Titel in Versalien wie `.kind`, gemessen Hell `rgb(91,67,201)` auf Weiß und Dunkel
    `rgb(169,155,255)` auf `rgb(28,34,39)`; der alte Satz „Neu auf Android: …“ in der Pro-Beschreibung wurde zu einem gewöhnlichen
    Satz, damit nicht zwei „Neu“ konkurrieren. Nur im Repo (`docs/geschenk/geschenk-jens.html`, Pro #94); das Artefakt bleibt
    auf Fassung 24 (Workflow PDF Pro dort noch 1.0.3), weil Klaus die Veröffentlichung zurückgestellt hat.
22. **Codex' Prüf-Bot meldet auf jedem PR „Failed“ und „usage limits“.** Das sind keine Befunde, sondern das erschöpfte Kontingent;
    Klaus' Regel „GitHub-Kommentare nicht beobachten, CI selbst prüfen“ gilt. Vier PRs an diesem Abend, viermal dieselben zwei
    Kommentare, nie eine Zeile zum Inhalt.
