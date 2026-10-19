# Ausgangsbasis der Pro-App

Kopiert am 2026-10-19 aus `lausiklauskn-png/Privat-Brain`, Commit `0ac93cd845a93cb67b37b0f4c60726eaed9ed492`.

Nur versionierte Dateien wurden übernommen, ohne Git-Historie, node_modules, lokale Konfiguration, private Maildaten oder Zugangsdaten. Die ursprüngliche Pro-README bleibt erhalten; die PWA-README liegt unter `docs/PWA-README.md`. Lizenzen und unveränderte Prüfmodule bleiben erhalten. Die PWA wurde nicht verändert.

Dies ist die Web-Ausgangsbasis, noch keine native Android-App. Die übernommenen Funktionen und bekannten Einschränkungen bleiben bestehen; Kopieren behebt keine Quellcodefehler. Modellgewichte sind noch nicht enthalten. Der Mailzugriff benötigt weiterhin den optionalen privaten Dienst, bis die direkte native Mailkomponente implementiert ist.

Die übernommenen GitHub-Workflows testen den Maildienst beziehungsweise laden auf manuelle Anforderung ein Modell. Sie bauen oder signieren keine Android-App. Der historische Modell-Workflow ist laut seinem Kommentar wegen der GitHub-Dateigrößengrenze nicht für den normalen Modellimport geeignet. Nicht ungeprüft ausführen.

Für die nächste Entwicklung gelten der Übergabebrief des Nutzers und CLAUDE.md: vorhandenes Design und Original-Icons erhalten; DE/EN/RU/PL und Suchstartseite bewahren; geschützte Module nur bytegleich wiederverwenden. PWA und Pro-App unabhängig halten.
