# Siegel und Mycel in der Pro-App (2026-10-21)

## Was Klaus wollte

- *„bringe das Siegel … oben neben den Text Private Brain Pro … wegklicken mit X … Genauso wie das
  Myzel … Da, wo ich es hinbringe, soll es einrasten."*
- Freigabe des Plans: *„Ja, so bauen"* (Siegel und Mycel nach Kanon).
- Danach: *„mach einfach nur die Symbole dafür … für das Siegel das runde Button"*.
- Und: *„Du kannst auch das Mycel in das Siegel mit hineinpacken … ich klicke auf das Siegel und dann
  ist das Mycel damit drin … nicht so viel Platz zu verschwenden."*

## Wie es jetzt ist

| | Bedienung |
|---|---|
| 🔏 Siegel | ein **runder Knopf** mit einem kleinen ✕ am Rand. Am Knopf selbst ziehen. Lässt man ihn oben an der Kopfleiste los, rastet er dort ein, links oder rechts, je nachdem wo er losgelassen wurde. Die Lage bleibt nach dem Neustart. Kurz tippen öffnet das Siegel-Fenster. |
| ✕ am Siegel | blendet es aus, auch nach dem Neustart. Zurück: **Einstellungen → „🔏 Siegel und 🌐 Mycel“ → „🔏 Siegel wieder zeigen“**. Der Knopf steht nur da, solange das Siegel ausgeblendet ist. |
| 🌐 Mycel | keine eigene Pille mehr. Es öffnet sich aus dem **Siegel-Fenster** („🌐 Mycel-Netz“ unter der Überschrift), aus dem App-Menü ☰ und aus den Einstellungen. „–“ und „✕“ schließen es. |

Das Mycel-Fenster ist jetzt das des Kanons, `modules/23_rendezvous_ui.js`, byte-1:1 aus
Sage-Protokol, im Drift-Guard gepinnt (`66b2c6b9…`). Es ersetzt das frühere app-eigene
`modules/net-widget.js`. Es hat Verbinden, „Wer ist im Raum?“, Frage nach Bedeutung mit 🎤,
Briefkasten, „Antworten an/aus“ und KI-Richter. Das Gerätename-Feld setzt weiter
`modules/rendezvous-init.js` hinein (NETZWEIT § 2).

## Abweichungen vom Kanon, auf Klaus' Wunsch

Die Module 17 und 23-UI sind unverändert. Geändert ist nur die Anzeige der App,
in `native/native.css` und `native/native-mycel.js`.

- Im Kanon sind Siegel und Mycel zwei getrennte Pillen. Hier ist die 🌐-Pille ausgeblendet.
  Das Mycel öffnet sich aus dem Siegel-Fenster, das dafür einen Knopf bekommt.
- Die Statuslampen (lebt · Verkehr · fremd) und „−“ werden nicht angezeigt. Sie bleiben in der Seite,
  denn Membran (Modul 15) und Siegel (Modul 16) lesen sie.
- Der Kanon startet das Ziehen nie auf einer Lampe, und das runde Siegel ist ganz Lampe. Deshalb
  lässt der Siegel-Knopf den Finger zur Pille durch. Die App öffnet das Siegel-Fenster selbst, wenn
  der Finger sich nicht bewegt hat (weniger als 5 px).

## Grenzen

- **Die Lampen sind nicht mehr zu sehen.** Ob die Membran gerade fremden Verkehr meldet, zeigt die
  Pro-App so nicht mehr auf einen Blick.
- **Sprachwechsel:** Das Mycel-Fenster baut sich beim Start in der eingestellten Sprache auf (DE/EN,
  RU und PL fallen wie im Kanon auf Deutsch zurück). Nach einem Wechsel der Sprache spricht es erst
  nach dem nächsten Start die neue.
- **„✕“ am Mycel-Fenster** gilt laut Kanon nur bis zum Neuladen. Da hier keine Pille steht, schließt
  es einfach das Fenster.
- **Andocken nur oben:** Der Kanon kennt eine einzige Andockstelle, die Kopfleiste
  (`data-sbkim-leiste`). Woanders bleibt das Siegel frei liegen, wo es losgelassen wurde.
- **Kennzeichnung „⚠ nicht an die KI“:** Das alte Fenster hatte dafür eine eigene Marke. Das
  Kanon-Fenster schreibt die Begründung des Richters unter den Treffer: „Anweisung an eine KI im
  Text — nicht an die KI gegeben.“ Der Schutz selbst liegt in Modul 04 und ist unverändert.
- **Eigene Identität „Private Brain Pro“** (Brief 2026-10-20, Abschnitt 4, Punkt 3) ist noch offen:
  Name, Endpunkt und Spore sind weiter die der PWA.
- Am Tablet nicht gemessen, kein echter Knotenkontakt.

## Nachweise

- `tools/native/test-mycel.mjs`, 31 Prüfungen mit den echten Kanon-Modulen und ohne Netz, in
  `npm run test:native-web`. Bild: `docs/design/siegel-mycel/oben-eingerastet.png`
  (`PB_CAPTURE_DESIGN=1`).
- Gegenprobe von Hand an Wegwerf-Kopien von `www/`, 2026-10-21. Gefangen wurden diese Fehler:
  - kein Mycel-Knopf im Siegel
  - Siegel nicht ziehbar
  - „Siegel wieder zeigen“ immer sichtbar
  - Lampen wieder sichtbar
  - Glue startet die 23-UI nicht

  Nicht gefangen wurde „Mycel-Pille wieder sichtbar“, wenn nur eine der beiden Ausblend-Regeln
  wegfällt. Die Pille ist doppelt ausgeblendet, durch ihre eigene Regel und durch den ausgeblendeten
  Platz in der Kopfleiste. Fallen beide weg, wird der Fehler gefangen.
- Angepasst wurden `tools/e2e-relay.mjs`, `tools/e2e-pinnwand.mjs`, Abschnitt E von
  `tools/e2e-ki-reinigung.mjs` (jetzt der echte Richter direkt) mit seinem Gegenprobe-Fall und
  `tools/native/test-compact-network.mjs`.
- Entfernt wurden die vier Proben `e2e-netwidget*.mjs` und `gegenprobe-netwidget-sprache.sh`. Sie
  prüften das abgelöste Fenster, ihren Platz nimmt `test-mycel.mjs` ein.
