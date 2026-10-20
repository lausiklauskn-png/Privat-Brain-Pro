> Ab Version .15 zeigt die Navigation zusätzlich kurze Namen und eigene sichtbare
> Tooltips. [Beschriftungen und Ordnerauswahl](BESCHRIFTUNGEN-UND-ORDNER.md).
> Das hier beschriebene App-Offlineverhalten bleibt gültig.

# Kompakte Ansicht und App-Internetschalter — Version .14

Auf Nutzerwunsch orientiert sich die Bedienung am Aufbau von Outlook: flache
Symbolleisten, Aktionen hinter „…“ und mehr Fläche für Nachrichten. Farben,
Schriften und Name Private Brain Pro bleiben erhalten. Das gilt auch für die
obere App-Navigation, für lokale und verbundene Postfächer und den Explorer.

## Bedienung

- Suche, Dateien, Explorer und Postfach: Symbole in einer flachen Reihe.
- Zusätzliche Ansichten auf kleinen Fenstern: **… → Übersicht / Katalog / Doppelte /
  Einstellungen**. Auf breiten Fenstern bleiben diese Symbole direkt sichtbar.
- **App-Menü** rechts oben: Sprache, Hell/Dunkel, Neu laden, Mycel und Pinnwand
  sowie der Internetschalter. Kein grüner Offline-Informationshinweis mehr.
- Kontowahl, Aktualisieren, Kontoaktionen, Verfassen und Import: eine schmale Zeile.
  Antworten, Weiterleiten, Nachrichtenaktionen und Original-/Text-/Bildansicht
  verwenden ebenfalls Symbole. Ordnernamen, Mailbetreff und Dateinamen bleiben lesbar.
- Symbole haben übersetzte native Hover-Tooltips und zugängliche Namen. Auf Touch
  öffnen die Menüs lesbare Aktionsnamen. Die üblichen Aktionen sind mindestens
  36×36 CSS-Pixel groß, auf Touch 40×40; die kompakten Statuslampen mindestens
  24×36. Escape schließt die neuen Menüs und stellt den Fokus am Öffner wieder her.
- Die vorhandenen LEBT-/VERKEHR-/FREMD-Lampen und das Siegel sitzen in der Leiste.
  Ihre Zustände und Dialoge stammen unverändert aus den bisherigen Modulen.
  Für den nativen lokalen Ursprung wird nur die app-eigene Startkonfiguration
  im gepackten Webteil ergänzt; die geschützten Module bleiben bytegleich.

## Internet nur für diese App aus- und einschalten

**App-Menü → App vom Internet trennen** sperrt den Internetzugriff von Private
Brain Pro. Derselbe Schalter heißt danach **Internetzugriff wieder erlauben**.
Die Auswahl bleibt nach einem Neustart erhalten. Standard bei der erstmaligen
Installation dieser Funktion ist erlaubter Internetzugriff, damit bestehende
Postfächer weiterhin benutzt werden können.

Der Schalter verändert weder WLAN/Mobilfunk noch andere Apps. Er entfernt keine
Konten, widerruft keine Google-Zustimmung und löscht keine Dokumente, Katalogeinträge,
Entwürfe oder Versandzustände. Lokale Suche, Originale, PDFs, Kontoübersicht und
Geräteentwürfe bleiben nutzbar. Bewusstes Öffnen/Teilen in eine andere App bleibt
möglich; deren eigener Internetzugriff wird nicht verändert.

Die Sperre greift in beiden App-Schichten: WebView-Netzwerkladen und externe
Ressourcenanfragen, Browser-Fetch/XHR/WebSocket/EventSource/WebRTC/Beacon sowie
native Mail-, Google-Identitäts- und Updateaufrufe. Laufende Browserverbindungen
und native Mail-Sockets werden geschlossen; lokale App-Assets bleiben aus dem
APK-Paket lesbar. Der native Transport verwendet weiterhin die bisherige TLS-
Zertifikats- und Hostnamenprüfung. Kein alternativer ungesicherter Transport.

Wird eine SMTP-Übertragung unterbrochen, kann ihre Annahme beim Anbieter unklar
sein. Die bestehende dauerhafte Versandquittung bleibt dann „unklar“. Einschalten
des Internetzugriffs startet keinen automatischen Mailversand und wiederholt keine
Übertragung. Wiederholungen müssen wie bisher gezielt vom Nutzer geprüft werden.

## Prüfung und Grenzen

20 Browserprüfungen ergänzen die bestehenden Proben: kleine Touch-Fenster ab
320×640, eine Kontenzeile, mindestens 300 px Lesebereich, Navigation ohne globalen
Überlauf, vier Sprachen, Tooltipnamen, Tastaturmenüs, sichtbare echte Statuslampen,
Unterbrechen laufender Streams/Sockets, Wiederanlauf und Erhalt lokaler Daten.
Die Netzwerkschnittstelle ist dort simuliert; zusätzliche Android-Fälle prüfen
reale Socket-Unterbrechung vor einem neuen Verbindungsaufbau, Erhalt verschlüsselter
Konten/Entwürfe, keine Wiederholung eines unklaren Versands und Neustart der echten
WebView im Offlinezustand samt erneutem Einschalten. Keine echten Providerkonten
oder echten Nachrichten werden für die Prüfungen verwendet.

[Ansichten mit synthetischen Nachrichten](design/compact14/README.md),
[Veröffentlichungsnachweis](PRUEFSTAND-ANDROID.md).


## Veröffentlichung

[APK .14](https://github.com/lausiklauskn-png/Privat-Brain-Pro/releases/download/v0.1.0-preview.14/Private-Brain-Pro-0.1.0-preview.14.apk) ist veröffentlicht. Vollständige CI 39425363587,
34 Android-Fälle und signiertes Update .13 → .14 39425723720 bestanden.
[Nachweis und genaue Pins](PRUEFSTAND-ANDROID.md#veröffentlichte-version-14--2026-10-20).
