# Kompakte Bedienung und Ordnerbereinigung für Android .34

Stand 24.10.2026: **in Arbeit, noch nicht veröffentlicht**. Der öffentliche
[Update-Download bleibt .33](https://github.com/lausiklauskn-png/Privat-Brain-Pro/releases/download/v1.0.0-preview.33/Private-Brain-Pro-1.0.0-preview.33.apk).
Klaus' Screenshots zeigen die native App links und das separate V3-Repo rechts.
V3 dient als Referenz für Platzverbrauch und direkte Bedienung; sein Repo wird
nicht geändert. Die hier ausdrücklich gewählte Bedeutungssuche bleibt erhalten.
Der vorhandene Freibrief umfasst Umsetzung, Prüfung, Merge und signiertes Update.

## Suche und Dateiansicht

- Bei eingegebenem Suchtext verschwinden Begrüßungsüberschrift und Einführung
  vollständig aus dem Layout. Treffer erhalten dadurch tatsächlich mehr Höhe.
  Bei leerer Suche bleibt die Orientierung erreichbar; der Suchkasten selbst
  ist flacher und seine Aktionen bleiben auch auf schmalen Fenstern erreichbar.
- Ein einzelner kleiner Button zeigt **„Bedeutung“** und dahinter eine schlichte
  SVG-Lupe. Hervorhebung und `aria-pressed` zeigen An/Aus, der zugängliche Name
  bleibt „Bedeutungssuche“. Das zusätzliche Bedienwort „Namenssuche“ entfällt.
  Hinter dem einzeiligen Schalter steht kein weiteres Fragezeichen.
- Ein fehlendes Bedeutungsmodell wird im Hinweis benannt. Laden bleibt eine
  ausdrückliche Aktion in den Einstellungen. Der Suchschalter führt beim
  Betätigen nicht mehr automatisch dorthin.
- Der Kopf geöffneter Dateien zeigt Teilen als bekanntes Android-Liniensymbol
  aus drei Kreisen und Verbindungslinien. Tooltip und zugänglicher Name bleiben
  erhalten. „Öffnen mit…“ behält Text mit schlichtem externen Öffnen-Symbol.
  Bestehende Handler bleiben erhalten. Auf schmalen Fenstern darf die Kopfzeile
  zwei Zeilen nutzen; ein langer Dateititel bleibt einzeilig gekürzt.

## Direkte Wege, Darstellung und Hilfe

Sieben Hauptbereiche sind direkt erreichbar: **Suche, Hinzufügen, Dateien, Mail,
Übersicht, Kategorien und Doppelte**. Die Ansichten liegen nicht mehr versteckt
im Hamburger-Menü. Einstellungen sind als eigenes Zahnrad erreichbar. Daneben
öffnet die Farbpalette eine kompakte Auswahl der vorhandenen vier Pro-Themes;
der Wechsel wirkt sofort in der aktuellen Ansicht. Dafür ist kein Wechsel zur
Einstellungsseite nötig. Die Auswahl wird über die bestehende Theme-Funktion
gespeichert.

Die Suchsprache steht direkt in der Suchleiste als anklickbarer Code (z. B.
DE, EN oder RU). Die frühere zusätzliche „Ich spreche“-Zeile entfällt; alle elf
bisherigen Sprachen bleiben auswählbar und von der Oberflächensprache getrennt.
Breite Querformatfenster mit Maus erhalten ein flacheres 32-Pixel-Profil;
Touch- und Hochformatansichten behalten 44-Pixel-Ziele.

In Einstellungen stehen veränderbare Optionen zuerst. Gewöhnliche Erklärungen
liegen hinter einem einheitlichen Linien-i, auch nach Neuzeichnen der Schutzkarte.
Aktuelle Zustände, Warnungen und erforderliche Entscheidungen bleiben sichtbar.
Der große Themenwähler entfällt zugunsten der oberen Palette. Unverfügbare
Tresoraktionen bleiben tatsächlich verborgen; Gehirn-Emojis und weitere feste
App-Glyphen werden durch neutrale Liniengrafiken ersetzt.

Die zusätzliche große Überschrift „Dateien hinzufügen“ mit Symbol und der
zweite Importtitel entfallen; Info steht direkt bei den Importaktionen.
Der aktive Tab nennt bereits „Hinzufügen“. Allgemeine und doppelte
Importerklärungen liegen hinter Info und bleiben zunächst geschlossen.
Ordnerwahl, Importknöpfe, tatsächlicher Ablage- und Verschlüsselungszustand sowie
Fehler und Fortschritt bleiben sichtbar. In Übersicht und Kategorien entfallen
der Kasten „Dein privater Raum“ und die allgemeine Einführung. Hilfe zu Zahlen
steht hinter „i“; notwendige Hinweise für konkrete Aktionen werden nicht
versteckt.

Im Explorer gibt es einen Button **„Sortieren“**. Das zugehörige Menü vereint
Name, Datum, Größe, Typ und die jeweilige Richtung. Die bisherigen getrennten
Bedienelemente sind in der nativen Darstellung verborgen; Zustand und Sortierung
verwenden weiterhin den bestehenden Workspace. In der Mail-Schreibhilfe
bleiben Radioknöpfe neben ihren Texten. Optionen brechen als ganze Einheiten
um; Wörter werden nicht mitten in „Rechtschreibung“ zerlegt. Textfelder,
Mikrofone, Verdeckungsvorschau und bewusste KI-Aktionen bleiben erreichbar.

## Übersicht und Kategorien

Die Übersicht verwendet denselben Ordnerbestand wie der Explorer und zeigt
Dateianzahl und bekannte Dateigrößen. Fehlende Größen bleiben kenntlich;
Unterordner sind in ihren übergeordneten Ordnern enthalten. Lokale Originalkopien
werden getrennt gezählt. Noch nicht ermittelte oder nicht verfügbare Werte
werden nicht als null ausgegeben. Das ist **keine Messung des freien oder
insgesamt belegten Gerätespeichers**.

Ordner und Kategorien führen direkt zur passenden Exploreransicht. Zusätzliche
Themenansichten bleiben getrennt erreichbar. Das Anzeigen der Übersicht lädt
oder scannt keine Originalinhalte. Große Ordnerlisten beginnen mit 60 Einträgen
und können erweitert werden.

## Doppelte Dateien tatsächlich vom Speicher entfernen

Die neue Android-Ordnerbereinigung ist implementiert; ihre native Endabnahme
steht noch aus. Sie ist getrennt von der bisherigen Entfernung gespeicherter
Katalogverweise. Nur die neue Bereinigung kann ausgewählte echte Dateien aus
einem freigegebenen Ordner löschen.

1. **„Ordner prüfen“** öffnet eine neue Android-Ordnerauswahl mit Lese- und
   Schreibrecht. Alte, nur lesend verbundene Importordner werden nicht still
   beschreibbar gemacht. App-eigene Originalkopien und Katalogeinträge werden
   von diesem Weg nicht bereinigt.
2. Dateien werden tatsächlich gelesen und über SHA-256 nach identischem Inhalt
   gruppiert. Die Oberfläche erhält undurchsichtige Sitzungs-/Datei-IDs, keine
   frei verwendbaren Lösch-URIs. Ordnernamen und relative Dateipfade werden für
   die Auswahl angezeigt.
3. Anfangs ist nichts zum Löschen ausgewählt. Kopien können einzeln oder über
   „Alle außer je einer auswählen“ markiert werden. Der Bestätigungsdialog nennt
   die konkreten Pfade, Anzahl und bekannten Bytes.
4. Vor und während der Löschung werden Rechte, Dateinamen, Größen und Inhalt
   erneut geprüft. Mindestens eine unmarkierte, unmittelbar erneut geprüfte
   Kopie jeder betroffenen Gruppe muss erhalten bleiben. Unbekannte/veraltete
   IDs sowie geänderte oder nicht mehr beschreibbare Dateien werden abgewiesen.
5. Nur bestätigte Löschungen zählen als entfernt. Fehler, Abbruch und
   Teilergebnisse bleiben sichtbar; es gibt keine automatische Wiederholung
   unsicherer Löschungen. Eine erneute Ordnerprüfung stellt den aktuellen Stand
   fest.

Eine Prüfung umfasst bis zu 2.000 Dateien, 80 MiB je Datei, insgesamt 512 MiB
und acht Unterordnerebenen; zusätzlich begrenzt der Scanner die besuchten
Dokumenteinträge auf 4.000. Übersprungene, unlesbare oder nicht vollständig
geprüfte Bereiche werden ausdrücklich als unvollständig ausgewiesen.
Fortschritt und Abbruch bleiben erreichbar. Die Wiederholungsprüfung vor dem
Löschen benötigt zusätzliche Lesezeit. Android-Dokumentanbieter können Dateien
zwischen getrennten Lese- und Löschaufrufen verändern; die App kann dafür keine
anbieterübergreifende atomare Transaktion versprechen.

Ohne den nativen Android-Adapter, insbesondere unter Windows, wird die
Ordnerbereinigung als nicht verfügbar angezeigt. Die bisherige Katalogaktion
bleibt gesondert als **„Verweise entfernen“** erhalten und löscht keine Dateien
vom Gerät. Während der Entwicklung werden ausschließlich synthetische
Testdateien bereinigt, keine Benutzerdaten.

## Prüfung und Veröffentlichung

Die Fokusprüfungen decken den tatsächlichen An-/Aus-Schalter, Suchhöhe,
Dateikopf und Öffnen-/Teilen-Handler, direkte Navigation, Übersichtswerte und
Ordnerlinks, Sortierung, Palette sowie kompakte Import-/Mailhilfe ab. Vier
Oberflächensprachen und schmale, breite sowie kurze DeX-Fenster mit großer
Schrift gehören zur Darstellungsprüfung. Der gemeinsame Browserstand ist grün:
126 Web-, 37 Kompakt-/Netz-, 63 Ordnerlayout-, 101 Theme-, 116 Hilfe-,
128 Mail-Schreibhilfe-, 27 Übersicht-, 40 Sortier-, 40 Sprachwahl-, 24 Duplikatdialog- und
74 Werkzeugprüfungen. Zusätzlich bestanden Navigation, Anpassung an Hochformat,
Bedeutungsmodell-Schalter, Explorerarten, Originalstatus und Texteingaben sowie
52 gemeinsame Workspace-Prüfungen. Die Startseite ist für den späteren Vergleich
mit der öffentlichen APK per SHA-256 festgehalten:
`b2d2611d2d9de34e65b54b0c2b6f59150f070ee704dec102ee64c989731236ce`.

Ein neuer nativer Launcher-Test sowie drei Tests der physischen Bereinigung
sind für insgesamt **60 native Tests** vorgesehen. Die neuen Fälle verwenden
synthetische echte SAF-Dateien, darunter geänderte Inhalte, letzte Kopie,
verlorene Schreibrechte, ungültige IDs, Teilausfall, Abbruch und Ordnerauswahl.
Im ersten CI-Stand liefen 60 native Fälle; 59 bestanden, einschließlich aller
drei Bereinigungsfälle. Die Manifestquellenprüfung des Launcher-Tests wurde
auf die explizit installierte Ziel-APK umgestellt. Die vollständige Abnahme
des ergänzten Abschlussstands steht noch aus. Browserprüfungen nachgebildeter Brücken
ersetzen diese native Ausführung nicht.

Vor Veröffentlichung müssen die relevanten Android-/Windows- und
Signierungsprüfungen, das signierte Update .33 → .34 sowie der unabhängig
heruntergeladene öffentliche APK-Download bestätigt sein. Der Download wird
gegen Prüfsummen, ursprüngliche Signatur im veröffentlichten Prüfbericht,
exakte Quelle, gepackte UI-Dateien und den Digest der browsergeprüften nativen
Startseite geprüft. Hier werden noch keine Gesamtabnahme oder neue APK behauptet.

Die zusätzlichen [Werkzeugzugänge und Freischaltgrenzen](WERKZEUGE-34.md) bleiben
separat dokumentiert. Die lokale OCR für Bilder und Scan-PDFs aus .33 bleibt
erhalten, ebenso Originale und Prüfberichte. Physisches Samsung DeX und Klaus'
Galaxy Tab S6 sind weiterhin nicht gemessen. Windows bleibt als öffentlicher
Download bei .29.
