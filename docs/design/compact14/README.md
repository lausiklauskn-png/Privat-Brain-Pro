# Kompakte Symbolleisten — Version .14

Reale Browserbilder des gepackten Webteils, mit nativer Transportantwort simuliert,
am nativen Ursprung `https://localhost`. Ausschließlich synthetische Konten und
Nachrichten; keine Nutzerbilder oder echten E-Mails. Touch-Modus, Hellmodus.

| Fenster | Ansicht |
| --- | --- |
| 320×640 | [Postfach](mail-320.png) |
| 390×640 | [Postfach](mail-390.png) |
| 768×900 | [Postfach](mail-768.png) |
| 1280×900 | [Postfach](mail-1280.png) |

Die obere Navigation bleibt eine flache Symbolzeile, die Kontowahl samt Aktionen
bleibt in einer Zeile. Telefon: Ordner/Liste und Lesebereich wechseln; Desktop:
drei Spalten. Neuer Offline-Schalter im App-Menü statt grünem Informationshinweis.
Genaue Funktionen und Prüfgrenzen: [Kompakte Ansicht und Offline](../../KOMPAKTE-ANSICHT-UND-OFFLINE.md).

Neu erstellen: `npm run sync:android`, danach
`PB_CAPTURE_DESIGN=1 node tools/native/test-compact-network.mjs`.
