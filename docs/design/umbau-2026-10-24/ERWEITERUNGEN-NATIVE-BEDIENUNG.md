# Ergänzter Auftrag für die native App

Klaus hat am 24.10.2026 während der laufenden Arbeiten zusätzlich beauftragt:

1. **Samsung Galaxy DeX unter Android** berücksichtigen. Die Windows-Ausgabe
   ist ein eigener Host; sie ist kein Nachweis für die APK unter DeX.
2. **Hochformat automatisch umstellen**, auch auf Tablets und in einem hohen
   DeX-Fenster. Ein Arbeitsbereich statt drei Mailspalten; Eingaben, Entwürfe,
   Dateipfad und Filter müssen erhalten bleiben.
3. **Such-/Diktatsprache ausdrücklich wählen**, direkt an der Suche und in
   Einstellungen, unabhängig von der Oberflächen- oder Gerätesprache.
4. **Mikrofone an Texteingaben**, einschließlich Mailtext, Betreff, Empfänger,
   Cc/Bcc, Such- und Filterfeldern sowie gewöhnlichen Texteingabedialogen.
5. **Mailübersetzung unter dem Original**, automatisch beim Lesen in der
   gewählten Zielsprache. Vorrangig Deutsch, Englisch, Russisch und Polnisch.
   Ein kleines lokales Übersetzungsmodell prüfen; vorhandene Anonymisierung
   und Mistral beziehungsweise ein eigenes KI-Abo als Alternativen erhalten.

## Technisch festgestellter Ausgangspunkt

Die APK hat keine feste Ausrichtung. Größe, Bildschirmdichte, Tastatur und
Fensterwechsel sind bereits im Android-Lebenszyklus berücksichtigt. Die
Größenänderung wird jetzt ausdrücklich im Manifest erlaubt; `colorMode` kommt
für DeX-Konfigurationswechsel hinzu. Die bisherigen Breitenregeln ließen ein
Tablet mit 1024 × 1366 Pixeln im Hochformat dreispaltig. Die ergänzte
Hochformatregel richtet sich nach dem App-Fenster und verändert nur das Layout.

Die vorhandene Bedeutungssuche verwendet **multilingual-e5-small**. Ihre
mehrsprachigen Vektoren benötigen keine an die Oberfläche gekoppelte
Sprachumschaltung. Die neue Auswahl steuert tatsächlich die Diktatsprache sowie
Sprache und Schreibrichtung der Eingabefelder; Suchtext und Embedding-Präfixe
bleiben unverändert. Die geerbte ASCII-Begrenzung der Stichwort-Tokenisierung
ist eine getrennte Baustelle; sie wird nicht durch einen wirkungslosen
„Embedding-Sprachschalter“ verdeckt.

Die bisherige native Spracheingabe versorgte die Hauptsuche und mehrzeilige
Textfelder. Sie wird um einzeilige Textfelder, dynamisch entstehende Mailfelder
und bearbeitbare Texte erweitert. Eingaben werden an der gewählten Stelle
eingefügt; verspätete Antworten dürfen keine anderen oder bereits entfernten
Felder verändern. Passwort-, Ersatzschlüssel- und technische Zahlenfelder
werden nicht als gewöhnliche Diktatfelder behandelt.

## Übersetzungsweg und erhaltene Daten

Originaltext und MIME-Daten bleiben erhalten. Die Übersetzung ist ein eigener,
gekennzeichneter Textblock darunter. Die automatische lokale Erstübersetzung
ist ein neuer Ablauf; das Rezeptbuch zeigt bereits gespeicherte Übersetzungen
automatisch an, fordert neue Übersetzungen aber über eine eigene Aktion an.

Der vorhandene Verdeckungsweg bleibt für eine bewusst gewählte externe KI
maßgeblich: `SbkimPseudonym`, Namens-/Telefonerkennung, Textprüfung, Vorschau und
lokale Rückzuordnung. Ein Kopierweg für ChatGPT, Claude oder Codex behauptet
keine direkte Anbindung an diese Dienste. Anhänge werden dafür nicht geladen.

Für lokale Modelle gelten dieselben Internetregeln wie bisher: ausdrückliches
erstmaliges Laden, feste Quellen und Prüfsummen sowie Abbruch über den
App-Internetschalter. Danach dürfen Erkennung und Übersetzung beim Öffnen der
Mail ohne Textübertragung an einen Server laufen. Lokale Modelle werden erst
als verfügbar angezeigt, wenn sie tatsächlich vorhanden und geprüft sind.

## Prüfstand während der Umsetzung

- Adaptive Browserprobe: **263 Fälle bestanden**, elf Fensterformate und vier
  Themen; Telefon/Tablet im Hochformat und DeX-artige Querformatfenster bis 2560
  Pixeln. Entwurf, Cc/Bcc, Suche, Pfad, Mausziele und Tastaturwege erhalten.
- Spracheinstellung: **30 Fälle bestanden**, einschließlich tatsächlicher
  Diktat-Locale bei abweichender Oberfläche und unverändertem kyrillischem
  Suchtext am Embedding-Adapter.
- Erweiterte Mikrofone: **27 Fälle bestanden**, einschließlich gespeicherten
  Mailentwürfen und verspäteten Antworten. Geräte-Spracheingabe wird dabei
  simuliert.
- Texteingabedialoge: **26 Fälle bestanden**, einschließlich paralleler
  Tagänderungen, fehlgeschlagener Speicherung und erneutem Versuch.
- Mailübersetzungsansicht: **52 Fälle bestanden**, automatische lokale Anzeige, bewusster Download,
  Maskierung und Rückzuordnung sowie Schließen/Navigieren mit verspäteten
  Antworten werden im Browser geprüft. Geräte-/KI-Transporte sind dort
  nachgebildet; die echte Modellinferenz wird zusätzlich separat verlangt.
- Neue Android-Drehungsprobe: Hochformat → Querformat → Hochformat mit derselben
  Activity/WebView und erhaltener Suchanfrage. Ausführung erfolgt in der CI.
- Übersetzungsmodelle, native Offline-Inferenz und der gesamte Endstand müssen
  vor einer Veröffentlichung noch abgenommen werden.

Eine tatsächliche Prüfung auf Klaus' Samsung-DeX-Gerät und seinem Tablet wird
dadurch nicht behauptet.

Quellen: [Samsung-DeX-Optimierung](https://developer.samsung.com/samsung-dex/modify-optimizing.html),
[Android-Fenstermodus](https://developer.android.com/develop/adaptive-apps/guides/support-desktop-windowing),
[multilingual-e5-small-Modellkarte](https://huggingface.co/intfloat/multilingual-e5-small/raw/main/README.md),
[Rezeptbuch-Übersetzungsansicht](https://github.com/lausiklauskn-png/Mein-Rezeptbuch/blob/400b65f9f248f1938fa86b941797bbfd1ca3c4dd/QC_MeinRezb_24_04_26.html#L15156).
