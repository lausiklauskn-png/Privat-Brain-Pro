# Lokale Mailübersetzung in Private Brain Pro

Stand: Entwicklung für Vorschau .31. Die Freigabe erfordert einen erfolgreichen echten Android-Inferenztest; ein nachgebildeter JavaScript-Vertrag genügt dafür nicht.

Die Nachricht bleibt unverändert. Eine Übersetzung wird unter dem Original angezeigt. Zielsprache und Eingabesprache sind unabhängig von Androids Gerätesprache einstellbar. Deutsch, Englisch, Russisch und Polnisch werden durch spezialisierte OPUS-MT/Marian-Modelle unterstützt. Zwischen zwei nicht englischen Sprachen läuft die Übersetzung nacheinander über Englisch. EN→PL verwendet den tatsächlich verfügbaren Export `Xenova/opus-mt-en-mul` mit dessen festem Zieltoken `>>pol<< `.

## Modelle und Datenfluss

- Die App prüft beim Öffnen nur den lokalen Modellstatus. Fehlende Modelle werden ausschließlich über die sichtbare Downloadaktion geladen. `translate()` enthält keinen Modell-Download.
- Der native Downloader erhält nur Quell- und Zielsprache. Er lädt ausschließlich öffentliche, unveränderlich versionierte Dateien aus `tools/native/translation-models.json`, prüft Größe und SHA-256, setzt unterbrochene Downloads fort und reagiert auf Abbrechen und den App-Internetschalter.
- Runtime und Übersetzungsmodelle liegen getrennt vom Bedeutungsmodell. Eine Übersetzung erfordert keinen e5-Download. Der Speicherbedarf der ausgewählten Richtung wird vor dem Download angezeigt; alle Sprachen werden nicht pauschal heruntergeladen.
- Der Mailtext bleibt in einem eigenen lokalen Web Worker. Transformers.js 2.17.2 und ONNX-WASM werden über `https://localhost/pb-translation/` aus App-Speicher geliefert. Fehlende Dateien liefern lokal 404. Es gibt keinen Fernmodell-Fallback und keine gemeinsam veränderte Transformers-Konfiguration mit Modul 03.
- Ein Worker verwendet einen WASM-Thread. Bei einer Übersetzung über Englisch wird das erste Modell freigegeben, bevor die zweite Richtung startet. Jeder Auftrag erhält eine eigene Kennung. Abgebrochene oder ältere Ergebnisse dürfen keinen inzwischen geöffneten Leser ersetzen.
- Ein Rendererabbruch oder ein unterbrochener Prozess während der Inferenz sperrt den automatischen Neustart. Ein ausdrücklich gewählter neuer Versuch hebt diese Sperre auf.
- Lokal übersetzter Text wird weder an einen Übersetzungsserver noch an ein KI-Konto gesendet. Nur der explizite öffentliche Modelldownload benötigt Internet. Ein API-Schlüssel ist für die lokale Übersetzung nicht erforderlich.

Die native Android-Brücke heißt `ProTranslation`; die JavaScript-Schnittstelle heißt `PBTranslationDevice`. `status`, `download`, `translate`, `identify` und `cancel` bilden den öffentlichen Vertrag. Unter Windows wird keine lokale Fähigkeit vorgetäuscht, wenn kein entsprechender Backend vorhanden ist. Dort bleibt die bereits vorhandene, ausdrücklich gewählte Cloud-Übersetzung mit Anonymisierung nutzbar.

Android-WebView leitet auch Unterressourcen eines Dedicated Worker über den `ServiceWorkerClient` weiter. Der Standardclient von Capacitor kennt nur die APK-Dateien; ausschließlich im `WebViewClient` bereitgestellte, nachgeladene Modelle erreicht der Worker dadurch nicht. Beide Clients verwenden deshalb denselben lokalen Dateifilter und dieselbe App-Internetsperre. Für andere Dateien bleibt Capacitors lokaler Server zuständig. Die getrennten WebView- und Worker-Einstellungen zum Blockieren von Netzwerkzugriffen folgen weiterhin demselben Internetschalter. Dieser Plattformbefund erklärt den ersten fehlgeschlagenen Android-Inferenzlauf; der korrigierte Pfad muss durch einen neuen tatsächlichen Emulatorlauf bestätigt werden.

## Warum kein Google-ML-Kit-Download

ML Kit bietet kompakte Offline-Übersetzung, aber sein öffentlicher `RemoteModelManager` bietet keinen Abbruch eines laufenden Modell-Downloads. SDK-eigene Verbindungen könnten den appweiten Internetschalter umgehen. Der app-eigene Downloader erhält die bestehende Abbruchgarantie. Das ist eine technische Entscheidung für diesen App-Vertrag.

## Herkunft und Lizenzen

Die Modellgewichte stammen von Helsinki-NLP/OPUS-MT; die unveränderten, quantisierten ONNX-Exporte von Xenova. Die App beansprucht keine Urheberschaft an diesen Modellen. Jede Richtung enthält im Manifest zusätzlich Basis-Modell, Revision, Attribution und Lizenz. Die App-Lizenz ersetzt die Rechte der Komponenten nicht.

| Richtung | Basis-Modell | Lizenz |
|---|---|---|
| DE→EN | [Helsinki-NLP/opus-mt-de-en](https://huggingface.co/Helsinki-NLP/opus-mt-de-en) | Apache-2.0 |
| EN→DE | [Helsinki-NLP/opus-mt-en-de](https://huggingface.co/Helsinki-NLP/opus-mt-en-de) | CC-BY-4.0 |
| RU→EN | [Helsinki-NLP/opus-mt-ru-en](https://huggingface.co/Helsinki-NLP/opus-mt-ru-en) | CC-BY-4.0 |
| EN→RU | [Helsinki-NLP/opus-mt-en-ru](https://huggingface.co/Helsinki-NLP/opus-mt-en-ru) | Apache-2.0 |
| PL→EN | [Helsinki-NLP/opus-mt-pl-en](https://huggingface.co/Helsinki-NLP/opus-mt-pl-en) | Apache-2.0 |
| EN→PL | [Helsinki-NLP/opus-mt-en-mul](https://huggingface.co/Helsinki-NLP/opus-mt-en-mul) | Apache-2.0 |

[Apache-2.0](https://www.apache.org/licenses/LICENSE-2.0) und [CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/) erlauben kommerzielle Verwendung unter ihren jeweiligen Bedingungen. Die Modellkarten bleiben als Originalquellen verlinkt. Laufzeit: [Transformers.js 2.17.2](https://github.com/huggingface/transformers.js/tree/2.17.2), Apache-2.0; [ONNX Runtime](https://github.com/microsoft/onnxruntime), MIT.

## Nachweise vor der Freigabe

`TranslationModelsTest` prüft Sprachrouten, den echten EN→PL-Zieltoken, die Trennung vom Bedeutungsmodell, Dateifreigaben und Abbrechen vor dem Öffnen einer Verbindung. `NativeTranslationTest` lädt ausschließlich öffentliche DE→EN-Testdateien und schaltet das App-Internet vor dem Start aus. Anschließend öffnet er den tatsächlichen Mailübersetzungsleser mit synthetischem deutschem Text. Ohne Klick muss darunter eine sichtbare englische Übersetzung erscheinen; Original, Sprachwahl und Abfolge der Ansicht werden mitgeprüft. Dieser Test benötigt die tatsächlichen Modellgewichte und darf nicht übersprungen oder durch einen Echo-Stub ersetzt werden. Ein zweiter nativer Test prüft die Abbruchsperre und den ausdrücklich gewählten neuen Versuch.
