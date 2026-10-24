# Designpaket: Themen, Symbole und Anschlussstellen

Stand: 24.10.2026. **Vorbereitet, noch nicht in die App eingebaut.**
Die vier positiv bewerteten Themen und die kompakte Bedienung bleiben Grundlage.
Der Satz ist eigens gezeichnet; keine Fremdbibliothek und kein Netzabruf.

## Verwendung und Regeln

- `tokens.css` setzt ausschließlich Variablen unter `.pb-design`; Themen über
  `data-pb-theme="klarblau|graphit|petrol|nachtblau"`. Kein globaler App-Umbau.
- `icons.svg`: 29 sprachneutrale IDs, `viewBox="0 0 24 24"`, 1,75 px Striche.
  Beim späteren einmaligen Einfügen des Sprites verwendet ein Button z. B.
  `<svg aria-hidden="true" focusable="false"><use href="#pb-send"/></svg>`.
  Die konsumierende Oberfläche setzt ebenfalls `fill:none;stroke:currentColor;`
  und die Strichstärke am SVG. Beim externen Sprite entsprechend `icons.svg#pb-send`.
- Icon und sichtbarer Aktionsname gehören zusammen. Nur allgemein bekannte
  Suche/Zahnrad können rein bildlich sein, mit zugänglichem Namen und Hilfetext.
- Ein unbekannter Schlüssel lässt **den Text sichtbar**. Kein Ersatz durch ein
  Dreipunktsymbol und kein stilles Ausblenden der Aktion.
- `pb-check` steht für Prüfen/Prüfergebnis; ein Ergebnis erhält zusätzlich Text.
  „Geprüft“ bedeutet nur den tatsächlich ausgeführten Umfang, niemals „virenfrei“.
- Senden zeigt einen **Umschlag mit Richtungspfeil** und das Wort „Senden“.
- Sichtbare Buttonhöhe 28 px, Touch-Ziel mindestens 44 px. Die konsumierende
  Oberfläche reserviert die größere Trefferfläche ohne Überlappung mit Nachbarn.
- Primärfarbe für Auswahl und wichtigste Aktion. Verfügbarkeit und Prüfstand
  bleiben getrennte Informationen; Farbe wird jeweils durch Text/Symbol ergänzt.
- Einbau übersetzt neue Namen nach DE/EN/RU/PL; diese Tabelle benennt die deutsche
  Ausgangsbeschriftung. Vorhandene Event-Handler, Datenfelder und Modulverträge bleiben.
- Theme-Farben allein ersetzen keine Fokus-, Tastatur-, Touch- oder Geräteprüfung.

## Aktionszuordnung

| Begriff | Symbol-ID | Kurzes Label | Vorhandene Anschlussstelle / Status |
|---|---|---|---|
| Suche | `pb-search` | Finden | `native/native-toolbar.js`: Seite `search`; `index.html`: Suchfeld |
| Dokument | `pb-file` | Dokument | `assets/workspace.js`: Explorerzeile; kein eigener Aktionsknopf |
| Ordner / Ablage | `pb-folder` | Dateien | `native/native-toolbar.js`: Seite `explorer` |
| Mailbereich | `pb-mail` | E-Mails | `native/native-toolbar.js`: Seite `mail` |
| Import | `pb-import` | Hinzufügen | `native/native-toolbar.js`: `import` / `intake` |
| Neue Zuordnung | `pb-add` | Hinzufügen | vorhandener Dateieinstieg; freie gemischte Sammlung ist Vorschlag |
| Einstellungen | `pb-settings` | Einstellungen | `native/native-toolbar.js`: `settings` |
| Rückweg | `pb-back` | Zurück | `native/native-toolbar.js`: `back`, native Navigation |
| Vorwärts | `pb-forward` | Vorwärts | `native/native-toolbar.js`: `next`, native Navigation |
| Postfach aktualisieren | `pb-refresh` | Aktualisieren | `native/native-toolbar.js`: `refresh` |
| Mail verfassen | `pb-edit` | Neue Nachricht | `assets/live-mail.js`: `compose` |
| Antworten | `pb-reply` | Antworten | `assets/live-mail.js`: `reply` |
| Mail weiterleiten | `pb-forward-mail` | Weiterleiten | `assets/live-mail.js`: `forward` |
| In Papierkorb | `pb-trash` | Papierkorb | `trash`, `delete`; endgültiges Löschen bleibt separate beschriftete Aktion |
| Archivieren | `pb-archive` | Archivieren | `assets/live-mail.js`: `archive` |
| Kategorie / Zuordnung | `pb-tag` | Zuordnen | Tags im `index.html`; `native/native-categories.js`; gemischte Ansicht vorgeschlagen |
| Entwurf sichern | `pb-save` | Entwurf speichern | `assets/live-mail.js`: `draft` / `save` |
| Nachricht prüfen | `pb-check` | Prüfen | `assets/live-mail.js`: `check`; fehlt derzeit in der `keys`-Zuordnung |
| Befund / Warnung | `pb-warning` | Hinweis prüfen | `native/native-check.js`, `native/native-protect.js`; Textbewertung erhalten |
| Zusatzinformation | `pb-info` | Details | erklärende Texte zu Original-/Prüfstatus; Inhalt beibehalten |
| Quelle verknüpfen | `pb-link` | Quelle zuordnen | `native/native-originals.js`: Original erneut zuordnen |
| Quelle fehlt | `pb-unlink` | Original fehlt | `native/native-originals.js`; Zustand, kein Erfolgsversprechen |
| Kopie ausgeben | `pb-download` | Herunterladen | `native/native-toolbar.js`: `download`; fachlich vom Import getrennt |
| Dialog schließen | `pb-close` | Schließen | `cancel`, Dialogschließen; Fokus an Auslöser zurückgeben |
| App-Menü | `pb-menu` | Weitere Bereiche | vorhandenes App-Menü; einzelne Einträge mit Name und passendem Symbol |
| Ergebnisfilter | `pb-filter` | Filtern | `index.html`, `assets/workspace.js`: Such-/Explorerfilter |
| Geschützte Ablage | `pb-lock` | Speicherort | `native/native-vault.js`; kein Ersatz für tatsächlichen Sperrstatus |
| Lesedarstellung | `pb-eye` | Ansicht | `native/native-toolbar.js`: `view`; konkrete Ansichtsart beschriften |
| Versand | `pb-send` | Senden | `assets/live-mail.js`: `send`; ersetzt fachlich falsches `external` |

## Vor dem Anschluss

Den Satz einmal im App-eigenen Symbolmodul einbinden; nicht je Seite neu kopieren.
Werkzeugsymbole unter `native/tool-icons/` bleiben eigene Marken. Kanon-Module
werden nicht verändert. Erst die Musterseite Mail mit Breiten, vier Sprachen,
Fokus und fehlenden Symbolschlüsseln prüfen; dann die weiteren Ansichten anschließen.
