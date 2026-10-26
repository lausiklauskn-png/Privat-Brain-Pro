# Forschung Sitzung 3 (2026-10-26)

Ergänzt [Forschung Sitzung 1](FORSCHUNG-SITZUNG-01.md) und [Sitzung 2](FORSCHUNG-SITZUNG-02.md).

1. **Gemeinsame Dateien jetzt drei.** Byte-gleich in beiden Repos: `pb-arrange.js`/`.css` (Pro `native/`,
   V3 `assets/`), `native/native-help.js` + `native/help-layout.css` und `native/native-protect.js` (beide
   `native/`). Nach jeder Änderung `cmp` gegen das andere Repo.
2. **Das ⓘ merkt sich den Zustand** unter `pb_help_open_v1` (Schlüssel je Erklärung, z. B. `tresor`, `catalog`,
   `reorg`, `dupes-intro`). Ohne Eintrag ist die Erklärung offen. Wer eine neue Erklärung anschließt, nimmt einen
   neuen Schlüssel; `card`/`staticCard` (mit Überschrift) oder `bare` (ohne Überschrift, das ⓘ geht in eine
   vorhandene Knopfzeile).
3. **Ältere Proben** prüften „Hilfe anfangs zu“. `test-help` (Pro) startet jetzt mit gemerktem Zustand „zu“ (per
   `addInitScript`) und prüft weiter dieselben Abläufe; die neue Regel „anfangs offen, gemerkt“ prüft
   `test-design-26` in beiden Repos.
4. **V3 nutzt Pros ⓘ, aber nicht Pros Reihenfolge der Einstellungen.** `settingsOrder` läuft nur ohne
   `html.v3` (die Klasse steht in V3 schon im ausgelieferten HTML). V3s alte „?“-Knöpfe bei „Dateien hinzufügen“
   entfallen, wenn `window.PBHelp` da ist; die V3-CSS-Regel, die die Texte versteckte, gilt nur noch ohne
   `html.pb-help-ready`.
5. **Zwei Tresore.** `#tresorNote`/`#vaultNote`/`#vaultList` gehören zum Browser-Tresor (Modul 20, „Tresor —
   Verschlüsselung“), `#vaultPlace` ist der native Speicherort mit eigenem Entsperren. Der „Tresor-Inhalt“ gehört
   zum ersten; er steht jetzt in `#tresorNote` unter den Knöpfen, `#vaultNote` ist versteckt. Der Satz „oben
   entsperren“ stammt aus `index.html` und ist unverändert.
6. **Schutz-Block nur in den Apps.** `#schutzPlace` entsteht nur mit `Capacitor.Plugins.ProProtect`. Für eine
   Probe reicht ein kleiner Platzhalter mit `state/update/setAuto/setKey/checkHashes/checkUrls/virusTotal`
   (`test-design-26`, Abschnitt 9b).
7. **Pro entfernt die Kategorien-Einleitung** (`native-overview.js`), V3 zeigt sie; dort steht ihr ⓘ jetzt in der
   Leiste mit dem Anordnungs-Knopf (`.pb-order-bar` aus Sitzung 2).
