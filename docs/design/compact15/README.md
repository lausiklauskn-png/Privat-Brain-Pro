# Beschriftete kompakte Ansicht

Synthetische Dateien, Konten und Nachrichten; keine Nutzerdaten. Stand 2026-10-20.

`import-*`, `dashboard-*` und `mail-*` zeigen die Ansichten bei 320, 390, 768 und
1280 CSS-Pixeln. Hauptansichten bleiben benannt, auf dem Handy unter dem Symbol.
Übersicht, Katalog, Doppelte und Einstellungen stehen auch auf dem Handy direkt
in einer zweiten flachen Zeile. Desktopansichten zeigen alle acht benannten Ansichten. Mailwerkzeuge bleiben kompakte Symbole mit sichtbaren
Tooltips. Die Kacheln des Dashboards sind kleiner und öffnen Dateien, Kategorien
und Duplikate. Die drei großen Hinweisboxen sind zu einem kleinen Hinweis unter
dem Einwurf zusammengefasst.

Bilder reproduzieren: `npm run sync:android`, dann
`PB_CAPTURE_DESIGN=1 node tools/native/test-folders-layout.mjs` und
`PB_CAPTURE_DESIGN=1 node tools/native/test-compact-network.mjs`.
Die Browserbilder simulieren die Android-Brücke. Native SAF-Proben prüfen
zusätzlich die lokale Dokumentanbieter-Schnittstelle, Kopien, Wechsel und
Abbrechen; ein Samsung-/DeX-Lauf bleibt am Gerät zu bestätigen.
