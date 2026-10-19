# Originalansicht und volle App-Fensterfläche

Auftrag 2026-10-19: ursprüngliches Mail-Layout einschließlich Bildern/Werbung und
volle Seitenfläche für Postfach, Explorer und die übrigen Seiten. Bestehende
Farben, Schriften, Rundungen, Hell/Dunkel und helles 3D-Pro-Icon beibehalten.

Ausgangspunkt: Pro e9d9a809973929eae4e84336e3b7749525dbf917.
Referenz geprüft: Sende-Pruefer 5ec235db45a0e9830d42724524ef37a63474de99,
sende-pruefer.html, Raster `.app`, Ordner/Liste/Lesen mit eigenen Scrollflächen.
Dessen bestehende Textansicht allein ersetzt keine HTML-Maildarstellung; der
isolierte HTML-Renderer ist app-eigener neuer Code. Die geschützten Module wurden
nicht verändert. Der Rechteinhaber beauftragte die Übernahme der Gestaltung;
keine zusätzlichen fremden Bibliotheken oder veränderten Prüfer übernommen.

`vorher-postfach-1280.png` zeigt die bisherige schmale Textansicht. Die
Nachher-Aufnahmen zeigen dieselbe synthetische native Kontoverbindung und eine
künstliche HTML-Werbemail mit Tabelle, Farbe und eingebettetem Bild. Kein echtes
Mailkonto, keine persönlichen Daten. 320/768/1280/1920 Pixel, zusätzlich Dunkel.
Die automatische Probe lädt das externe Testbild über einen lokalen Playwright-
Antwort-Stub; der Bildabruf geht nicht zu einem echten Absender. Für diese
Interzeption laufen srcdoc-Frames im selben Chromium-Prozess; DOM-Ursprungs-
und Sandboxregeln bleiben aktiv. Die zusätzliche Android-Instrumentierung
prüft die Grenze mit der unveränderten Standard-WebView separat.

Automatisch geprüft: volle Fensterbreite, Fensterhöhe, kein globales Scrollen,
getrennte Postfachbereiche im breiten Fenster, erreichbare Nachricht im schmalen
Fenster, ursprüngliche Tabellenfarbe/Schriftfarbe, CID-Auflösung, externe Bilder
abschaltbar, keine aktiven Mail-Ressourcen und kein Skript-/App-Ursprungszugriff.
`PB_CAPTURE_DESIGN=1 npm run test:native-web` erzeugt die Aufnahmen neu.
Tablet/DeX-Sichttest der fertigen APK durch den Nutzer folgt.
