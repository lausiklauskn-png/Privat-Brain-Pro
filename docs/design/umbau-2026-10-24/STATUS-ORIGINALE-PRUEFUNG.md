# Originalverfügbarkeit und Prüfbericht getrennt anzeigen

Nächster nativer Umbauschritt nach .30, vorbereitet für Android .31.
Die vier Farbthemen und die kompakte Navigation bleiben Grundlage.

## Was sich für die Bedienung ändert

In Suchtreffern, Katalog und Dateien steht die Verfügbarkeit unabhängig vom
Prüfbericht. Ein früher geprüfter Eintrag kann weiterhin seinen Befund zeigen,
während daneben „Original fehlt“ steht. Der Bericht enthält den Prüfzeitpunkt
und den aktuellen bekannten Verfügbarkeitsstand. Ein gescheiterter erneuter
Prüfversuch löscht den früheren Bericht nicht.

| Anzeige | Was sie tatsächlich aussagt |
|---|---|
| Lokale Kopie | Eine Kopie ist im App-Speicher registriert. Das tatsächliche Lesen und der Fingerabdruck werden weiterhin beim Öffnen geprüft. |
| In dieser Sitzung verfügbar | Die Datei liegt im Arbeitsspeicher; dauerhafte Speicherung wird damit nicht zugesagt. |
| Quelle verknüpft | Ein Quellverweis ist gespeichert. Aktuelle Zugriffsrechte und Lesbarkeit sind noch nicht bestätigt. |
| Mailquelle verknüpft | Ein ausdrücklicher Rückweg zur Mail ist gespeichert. Die Erreichbarkeit des Anbieters ist damit nicht geprüft. |
| Gespeicherter Mailtext | Text oder Angaben der Mail sind vorhanden. Das ist kein vollständiges MIME-Original und kein Nachweis gespeicherter Anhänge. |
| Original fehlt | Nach geladener Originalübersicht ist keine lokale Kopie oder anderweitige verfügbare Datei bekannt. |
| Verfügbarkeit wird ermittelt | Die lokale Originalübersicht ist noch nicht geladen. |
| Original derzeit nicht lesbar | Eine Auflistung oder ein tatsächlicher Leseversuch ist fehlgeschlagen. Das bedeutet nicht, dass die Datei sicher gelöscht wurde. |

Die Dateizählung trennt fehlende Originale und unbestätigten Zugriff ebenfalls
vom historischen Prüfstand. Die beiden Angaben können sich auf dieselbe Datei
beziehen; sie sind keine sich gegenseitig ausschließenden Gruppen.

## Mailtext und Anhänge

Die Leseansicht unter „Alle Konten“ nennt ihren Umfang: gespeicherter Mailtext,
beim Abruf höchstens 8.000 Zeichen je Nachricht. Original und Anhänge werden
dort nicht automatisch geladen. Der angebotene Prüfknopf prüft ausschließlich
diesen Text mit rekonstruierten Absender-, Empfänger- und Betreffangaben.
Der Bericht sagt ausdrücklich, dass Original-Header und Anhänge in dieser
Textprüfung nicht geprüft wurden.
Fehlt gespeicherter Mailtext, ist die Prüfung ausdrücklich nur teilweise;
vorhandene Absender- oder Betreffangaben ersetzen keinen gelesenen Mailtext.

Ändern sich die gespeicherten Angaben oder der geprüfte Text beim Indexupdate,
bleibt der alte Bericht als früherer Mailtext-Prüfstand erhalten. Eine erneute,
ausdrücklich ausgelöste Prüfung ersetzt ihn. Auch Änderungen gleich langer
Texte oder Betreffe müssen den Suchindex erneuern.
Kann der neue Bericht nicht gespeichert werden, bleibt er in der laufenden
Sitzung sichtbar und trägt den Hinweis „nicht gespeichert“. Nach einem Neustart
kann dann der zuvor gespeicherte Prüfstand zurückkehren; der Bericht benennt das.

## Technische Grenzen und Nachweis

- Der Adapter `native/native-record-status.js` leitet die Anzeige aus vorhandenem
  Zustand ab. Es gibt keine neue Datenbank, keine Bestandsmigration und keinen
  automatischen Abruf von Mailoriginalen oder Anhängen.
- Eine Listenanzeige ruft weder `originalInfo` noch die Datei-Lesefunktionen auf.
  `originalInfo` könnte im bisherigen nativen Adapter eine Wiederherstellung aus
  dem Speicherort auslösen; deshalb wäre es für reine Darstellung ungeeignet.
- Eine registrierte lokale App-Kopie bleibt unabhängig von einer gesperrten
  zusätzlichen Tresorablage. Ein gespeicherter Prüfbericht beweist keine
  Entsperrung und keine aktuelle Lesbarkeit.
- Die bestehenden Prüfalgorithmen und alle geschützten Module bleiben unverändert.
  Eine Prüfung auf bekannte Täuschungsmerkmale ist keine Virenfreiheitszusage.
- Gezielte Regressionen: `tools/native/test-record-status.mjs`,
  `test-mail-index.mjs`, `test-check.mjs`, `test-originals.mjs` und
  `test-originals-find.mjs`. Hinzu kommen die bestehenden Web-, Native-,
  Android- und Windows-Abnahmen vor einer Veröffentlichung.

Lokal bestanden: vollständige Web- und Native-Prüfkette; abschließend 63 neue
Statusfälle, 68 Mailindexfälle und 27 Prüfberichtfälle auf dem erneut erzeugten
Paket. Originalzugriff und Wiederfinden bestanden mit 15 und neun Fällen.
Alle 22 geschützten Module sind bytegleich. Diese Proben verwenden synthetische
Daten und gestellte Gerätebrücken; die Prüfalgorithmen selbst werden tatsächlich ausgeführt.

Die Bedienung auf Klaus' eigenem Tablet bleibt eine tatsächliche Geräteprobe;
automatische Tests werden nicht als solche ausgegeben.
