# Forschung Sitzung 2 (2026-10-26)

Erkenntnisse, die nächste Sitzungen Zeit sparen. Ergänzt [Forschung Sitzung 1](FORSCHUNG-SITZUNG-01.md).

1. **Eine Datei für beide Apps.** `pb-arrange.js`/`.css` liegen byte-gleich in Pro (`native/`) und V3 (`assets/`).
   Sie hängen nur an `window.PBWorkspace` (`explorerState`, `restoreExplorer`, neu `explorerSections`,
   `explorerSection`), an IDs aus `index.html` und an `window.PBIcons` (nur Pro; V3 nimmt die eigenen Pfade der
   Datei). Nach einer Änderung immer beide Kopien angleichen: `cmp native/pb-arrange.js ../privat-brain-pro-v3/assets/pb-arrange.js`.
2. **Einbinden.** Pro: `tools/native/prepare-web.mjs` (Link im `<head>`, Skript am Ende von `<body>`, Kopierliste).
   V3: `index.html` mit `defer` im Kopf (läuft nach allen Skripten am Ende von `<body>`), Datei im Vorrat von `sw.js`
   (Cache-Nummer hoch, gegen `origin/main` prüfen).
3. **`assets/workspace.js` ist in Pro und V3 nicht gleich.** V3 hat kein `nodeLabel`, keine `categoryViews`, kein
   `pb-workspace-refresh` (jetzt nachgerüstet) und sortierte ohne „Typ“ (jetzt mit). Wer dort etwas ändert, prüft
   beide Fassungen einzeln; ein Fehler in `renderExplorer` lässt die Dateiliste still leer (so in V3 beim ersten
   Versuch mit `nodeLabel`).
4. **Alte Knöpfe nicht löschen, sondern verstecken.** `#explorerUp`, `#explorerHome`, `#explorerTreeToggle`,
   `#explorerSort` halten Zustand und werden von anderen Skripten benutzt. Die neue Leiste versteckt sie per CSS
   (`.pb-explorer-bar`) und schaltet den Ordnerbaum über einen Klick auf den versteckten `#explorerTreeToggle`.
5. **Anordnung nur, wenn gewählt.** Ohne Wahl bleibt die bisherige Anordnung der jeweiligen App (Pro: Querformat
   > 650 px nebeneinander, sonst eine Spalte). Erst eine Wahl setzt `data-pb-arrange` am Layout; Pros
   `native-panes.js` und V3s `SPLITS` in `v3-ui.js` richten sich dann danach statt nach der Fensterbreite.
   Gespeichert unter `pb_arrange_v1` je Ansicht (`explorer`, `mail`, `order`). `PBArrange.reset(name)` setzt zurück.
6. **MutationObserver-Schleifen.** Ein Beobachter, der die eigene Leiste samt Untermenüs beobachtet und dabei das
   offene Menü neu füllt, weckt sich endlos: Die Seite hängt, Playwright meldet nur „performing click action“.
   Änderungen in `.pb-pop-menu` werden deshalb übergangen.
7. **Hintergrundarbeit verschiebt fremde Ansichten.** Solange die Explorer-Leiste auch bei verstecktem Explorer
   rechnete, verschob ein Hintergrundabgleich von „Alle Konten“ die Leseposition um 4 px
   (`test-mail-index`). Jetzt arbeitet sie nur bei sichtbarem Explorer und holt beim Zeigen nach.
8. **Kopfzeile im Postfach.** Ein 44-px-Knopf macht V3s Mail-Kopf 1 px höher als erlaubt (`test-compact-network`,
   ≤ 52 px). Im Mail-Kopf übernimmt der Anordnungs-Knopf die Höhe der Nachbarn.
9. **Kategorien ohne Umbau des Panels.** `#panel-order` wird von `native-overview.js` über `:scope>p.hint`
   angesprochen; Knoten dürfen dort nicht verschoben werden. Der Ordnerbaum steht deshalb nebeneinander absolut
   positioniert links, der übrige Inhalt rückt mit `margin-left` ein.
10. **Probe wartet aufs Menü.** Das Ansicht-Menü füllt sich erst beim `toggle`-Ereignis; Proben müssen auf einen
    Eintrag warten (`waitForSelector`), sonst lesen sie ein leeres Menü.
11. **Testdaten können täuschen.** Die Testmail in `test-design-26` trägt `type:'application/pdf'`. Eine E-Mail
    ist nie „PDF“; die PDF-Ansicht schließt Mails deshalb aus.
12. **`test-filme` scheitert lokal auch ohne Änderung**, weil der Film-Platzhalter keine `filme.json` erzeugt
    (gegen den unveränderten Bau gegengeprüft). Die CI baut mit Video.
