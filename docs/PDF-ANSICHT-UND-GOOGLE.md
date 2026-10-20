# PDF-Ansicht, Öffnen/Teilen und Google-Rückkehr — 2026-10-20

## Auftrag und Umsetzung

PDFs einschließlich gescannter Bildseiten sollen im Original erreichbar sein;
zusätzlich werden „Öffnen mit …“ und „Teilen …“ gewünscht, insbesondere für
Workfloh PDF. Der native Dateibetrachter zeigt deshalb PDF-Seiten lokal über
Androids `PdfRenderer`, mit Seitenwechsel und Zoom. Er verwendet die vorhandene
Rücknavigation. Kein Upload in eine Webseite und keine Veränderung der Originaldatei.

Der Renderer hält höchstens zwei Sitzungen und zeigt jeweils eine Seite mit
höchstens 2048 Pixeln je Kante und vier Millionen Pixeln. Bis zu 10000 Seiten
werden akzeptiert. Geschützte oder beschädigte PDFs können die interne Vorschau
verhindern; Öffnen/Teilen und Zurück bleiben verfügbar. Der Betrachter führt
keine PDF-Skripte aus. Textauswahl, Formularbearbeitung und PDF-Linknavigation
sind keine Funktionen dieser Seitenvorschau.

„Öffnen mit …“ sendet `ACTION_VIEW`, „Teilen …“ sendet `ACTION_SEND` mit PDF-MIME,
Originaldateiname, `content://`-Adresse und ausschließlich Lesefreigabe. Die
unveränderten Originalbytes gehen an die ausdrücklich ausgewählte App. Beide
Befehle stehen auch in einem Rechtsklick-Menü und für andere Dateitypen bereit.
Ein Seitenfehler zeigt nicht das vorherige Bild unter einer falschen Seitennummer.
Späte native Antworten nach Zurück schließen ihre PDF-Sitzung wieder.

Die eingesehene Workfloh-PDF-Referenz bietet einen Web-Share-Target
`./teilen-empfang` und einen PDF-Dateihandler. Ob Android diese installierte PWA
im jeweiligen Dialog anzeigt, hängt von ihrer Registrierung auf dem Gerät ab.
Die Pro-App erzwingt kein bestimmtes Ziel. Ein Browser-Link allein überträgt
keine private Datei. Vorhandene Workflow-Prüfmodule bleiben unverändert; für die
Anzeige wird keine alte zusätzliche PDF-JavaScript-Bibliothek eingebaut.

## Google-Kontoauswahl kehrt wieder zurück

Der Nutzer meldet eine wiederkehrende Google-Kontoauswahl. Der Screenshot
beweist die native Auswahl, aber keine abgeschlossene Mail-Freigabe. Der konkrete
Grund auf dem Gerät ist noch nicht nachgewiesen. Die zuletzt bekannte Aussage
war, dass noch kein Google-Cloud-Projekt existiert; der aktuelle Einrichtungsstand
wurde erneut erfragt. Nicht als bestätigten produktiven Gmail-Zugang darstellen.

Im Quellcode wurde unabhängig davon ein unnötiger zweiter Autorisierungsschritt
gefunden: Der erfolgreiche Zustimmungsweg verwarf sein Access-Token; der sofortige
IMAP-/SMTP-Test forderte es erneut bei Google an. Nun wird eine geprüfte Freigabe
kontogebunden höchstens 120 Sekunden im nativen Arbeitsspeicher wiederverwendet.
Eine monotone Uhr begrenzt die Lebensdauer. Bei Ablehnung des Tokens und beim
Schließen wird der Cache verworfen. Keine Token in JavaScript, Dateien oder Logs.
Das verhindert diese zusätzlichen Anfragen, bestätigt aber nicht die Behebung
aller Ursachen des gemeldeten Auswahlproblems. Fehlertexte fordern nicht mehr
zum endlosen Wiederholen der Kontoauswahl auf.

Google-Cloud-Voraussetzungen einschließlich Paket und Zertifikat:
[Originale, Links und Gmail](ORIGINALE-LINKS-GMAIL.md#gmail-implementierter-weg-und-externe-voraussetzung).
Bestehende Telekom-/Hetzner-Konten, Kataloge und Originale weder löschen noch für
einen erneuten Google-Versuch neu anlegen. Kein neuer privater Dienst-Token nötig.

## Prüfungen

Neue Browserproben prüfen Seitenwechsel, Zoom, explizites Öffnen/Teilen,
Rechtsklick, Zurück und späte Antworten mit einem simulierten Bridge-Endpunkt.
Sie sind kein Nachweis für Android-PDF-Rendering. Neue Instrumentierungsfälle
prüfen zwei echte PDF-Seiten mit eingebetteten Scan-Bitmaps, Seiten-/Speichergrenzen,
unveränderte Bytes, Dateiname/MIME und Nur-Lesen-Intents sowie den echten
WebView-Bridge-Weg mit Android Zurück. Ein weiterer Fall prüft Ablauf,
Invalidierung und Kontentrennung des kurzlebigen Google-Token-Caches.

Die endgültigen Lauf- und Veröffentlichungsnachweise für Vorschau .9 stehen im
[Android-Prüfstand](PRUEFSTAND-ANDROID.md#veröffentlichte-vorschau-9--2026-10-20). Geräteversuch mit Workfloh PDF,
Samsung DeX und echter Google-Zustimmung bleibt gesondert erforderlich.
