# Postfach nach Sende-Prüfer und Gegenprobe

Auftrag: das Mailprogramm-Layout und die Ordner-/Bedienfunktionen des Sende-Prüfers
in Private Brain integrieren; zusätzlich den Code überprüfen und Gegenproben fahren.

## Umsetzung

Ergänzender Postfach-Reiter neben Suche, Hinzufügen und Explorer. Die lokale Mailablage
verwendet vorhandene Katalogeinträge, keine zweite Kopie des Sende-Prüfer-Postfachs.
Keine neue DB-Version, keine Änderung am `privatbrain`-Namensraum. Ordner sind
Metadaten: Eingang, Entwürfe, Postausgang, Gesendet, Archiv, Spam, Papierkorb,
Exportiert sowie eigene Ordner. Eigene Ordner verwenden `pb_mail_folders`.
Draft-Art und Ablageort bleiben getrennt, wie in der Vorlage.

Lesen und Verfassen, Antworten und Weiterleiten, Anhänge, Auswahlaktionen,
Rückgängig beim Verschieben, Sterne, Lesestatus und Wiederherstellung aus Papierkorb.
Endgültiges Löschen entfernt nur Katalogeinträge; Dateien bleiben liegen. Ein
Rohtext-Cache kann gelöschte Einträge nicht mehr ausgeben. Bekannte fehlende Anhänge
verhindern den Export. Fehlende Originalquellen führen zu einer ausdrücklichen
Rückfrage, bevor nur gespeicherter Text ohne Originalanhänge verwendet wird.

Verfügbare Originalmails werden vollständig gelesen, auch wenn der Suchkatalog
nur einen gekürzten Mailtext enthält. `.eml`-Export ist MIME, UTF-8/Base64,
adressiert, mit `X-Unsent: 1` und bytegleichen verfügbaren Anhängen. **Kein Versand.**
Postausgang bedeutet Vormerkung; Exportiert wird nicht als Gesendet ausgegeben.

## Wiederverwendung und Grenzen

Unverändert aus `Sende-Pruefer`, Stand `5ec235db45a0e9830d42724524ef37a63474de99`:
`modules/25_pseudonym.js`, `assets/pruefer.js`, `assets/pruefer-formate.js`,
`assets/pruefer-anhang.js`. In Private Brain liegen alle vier unter `modules/` und
sind per SHA-256 im Drift-Guard gepinnt. Der schon vorhandene Mailprüfer ist identisch.
Die app-eigene Oberfläche übernimmt das Drei-Spalten-Modell, die Petrol-Akzente und
Glas-Knöpfe; CSS ist auf den Mailbereich beschränkt und folgt Private-Brain-Themes.
Eigene Beschriftungen DE/EN/RU/PL; Originalbefunde der Prüfer können Deutsch bleiben.
Auf kleinen Touch-Displays Liste/Lesen mit Zurück; kein Doppelklick erforderlich.

Prüfen ist weder Virenscan noch Beweis für Schadensfreiheit. OCR-/PDF-Text-Engines
werden nicht still aus dem Netz geladen; ohne passende lokale Werkzeuge werden
Teilprüfungen als ungeprüft ausgewiesen. Mail-HTML und Anhänge werden nicht ausgeführt.
Die Pseudonymisierung ersetzt erkannte Angaben und Namen aus Kopfzeilen/manueller
Liste. Eine indirekte Identifizierung bleibt möglich, daher die sichtbare Vorschau.
KI-Aufrufe sind nutzergetriggert, ohne Anhänge; Namen-Zuordnung bleibt lokal.
Ein Google-Schlüssel darf nicht an Mistral geschickt werden. Mistral wird im Browser-
Test simuliert. Kopieren erlaubt den Weg über ein vorhandenes KI-Abo.

Gmail-OAuth, IMAP/SMTP-Synchronisation, tatsächlicher Versand und serverseitige
Spam-Aktionen benötigen weiterhin den separat geplanten Kontozugriff/Begleitdienst.
Es wurden keine Kontodaten angefordert und keine echten Mails versendet.

## Prüfung und Folgearbeit

Gemessen: vollständiges `npm test` mit 37 Prüfskripten, Rückgabe 0; danach die
Postfach-Probe um den echten Datei-Auswahldialog ergänzt, erneut 42 Prüfungen grün.
Workspace-Probe 44 grün. Gegenprobe: 8 gefangen, 0 durchgerutscht, 0 aus falschem
Grund, beide Ausgangsproben zuvor grün. Tests verwenden fiktive Daten und gestellte
Providerantworten, kein echter Mailversand und keine echten Zugangsdaten.

`npm test` enthält die neue `tools/e2e-mail-workspace.mjs`. Sie prüft echte
Browseraktionen, Clipboard und abgefangene Provider-Payloads, MIME-Rückimport,
Anhänge, lange Mails, lokale Ordner und Beständigkeit, Entwurfsverlust,
Header-Injektion sowie Layout bei 320/768/1280 px. Der Sichttest am echten Tablet
und native Ordnerdialog bleiben Klaus vorbehalten.

`python3 tools/gegenprobe-mail-workspace.py` startet mit grünen Ausgangsproben und
kopiert für jeden Fehler einen eigenen Wegwerf-Checkout. Gegenprüfungen: Klartext
an die KI, falscher Versandstatus, verlorener Entwurf, verlorene Platzhalterzuordnung,
falsche Dateibytes, Überschreiben bei Namenskollision, falscher Schlüsselanbieter und
Header-Injektion. Ein Fehler gilt nur mit passender Assertion als erkannt, nicht
durch einen beliebigen Syntax-/Startfehler. Ergebnislogs liegen unter `/tmp/`.

Cache v85 gegen zuvor v84. Freibrief für Commit, eigenen PR und selbstständigen Merge
nach erfolgreichen Prüfungen gilt weiter. Git-Push funktioniert; GitHub-API-Zugriff
war bisher durch die Netzwerkfreigabe blockiert. `api.github.com` ist im Entwurf
vorbereitet. Vor PR/Merge tatsächlichen Zugriff erneut prüfen und keine erfolgreiche
Veröffentlichung behaupten, solange sie nicht erfolgt ist.
