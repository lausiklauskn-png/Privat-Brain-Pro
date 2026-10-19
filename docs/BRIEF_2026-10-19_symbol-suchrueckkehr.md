# Flaches Symbol und Rückkehr zur Suchstartseite

Klaus hat das bestehende Layout im Original angesehen und für gut befunden.
Deshalb bleibt es erhalten. Ergänzt werden nur die gewünschten Symbole und die
eindeutige Navigation zwischen Suchstartseite, Import, Explorer und Postfach.

Das neue eigene Emoji-Symbol hat genau vier flache Kreise: einen großen goldenen
Kreis und drei kleinere Außenkreise, unterschiedlich groß und unregelmäßig verteilt.
Keine Schatten oder Verläufe im Symbol. Die Kopfzeile und der leere Katalogbereich
enthalten Inline-SVG statt externer Bilder. Das verhindert leere Bildrahmen auch
in Vorschauen, die relative Bildpfade nicht laden. Quelle: `assets/brain-emoji.svg`.
`npm run icons` rendert daraus die PWA-PNGs und das Katalogemblem, offline in Chromium.
Der alte Generator bleibt als historische Datei erhalten und wird nicht aufgerufen.

Nur die Suchstartseite enthält die globale Bedeutungssuche. Auf anderen Ansichten
führen Kopfknopf und Such-Navigationsknopf als „← Zur Suche“ direkt dorthin zurück.
Import ist ausdrücklich die Seite zum Hinzufügen/Kopieren/Katalogisieren. Die
Suchfrage bleibt beim Wechsel erhalten. Hash-Routen wie `#intake` und `#explorer`
stellen beim Neuladen dieselbe Ansicht wieder her; Browser-Zurück/Vorwärts funktioniert.
Explorer-/Postfachfilter bleiben lokale Listenfilter, keine zusätzliche globale Suche.

Cache v86 gegen `origin/main` v85. Die gezielte Workspace-Probe enthält zusätzlich
Symbol-, Rückkehr- und History-Prüfungen: 49 Checks grün. Tabletbreiten und Hell/Dunkel
bleiben in der Probe. Die gesamte bestehende Regression ist mit Rückgabewert 0 bestanden (einschließlich
49 Workspace- und 42 Postfach-Prüfungen).
Freibrief für Commit, eigenen PR und Merge gilt weiterhin; Klaus' Sichtprüfung des
bisherigen Layouts wurde ausdrücklich bestätigt. Die neuen kleinen Ergänzungen
können danach auf der Live-Seite angesehen werden.
