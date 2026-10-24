# Private Brain Pro – technische Vorbereitung des Designumbaus

Stand: 24.10.2026. Vorbereitung anhand des vorhandenen Codes; keine Produktänderung, kein Release und keine neue Geräte-/Livekontoabnahme.
Maßstab: `docs/ZIEL-FUNKTIONEN-DESIGNSTAND-2026-10-24.md`, `BRIEF_NACHFOLGE_2026-10-24_DESIGN.md`, AGENTS/CLAUDE. Outlook liefert Anregungen; Aufbau und Begriffe folgen Private Brains Aufgabe.

## 1. Reihenfolge und Grenzen

Zuerst eine Musterseite **Mail** mit Lesen und Schreiben sowie nachvollziehbarem Weg zum Anhang/Original. Danach Finden → Dateien → Hinzufügen → Einstellungen.
Jede Phase bekommt einen eigenen kleinen Commit/Entwurf; Datenzugriffe und Darstellungsänderungen getrennt halten. Bei Rücknahme einer Phase müssen bestehende Einträge weiter lesbar bleiben.
Geschützte Module bleiben bytegleich. Keine neue automatische Vervollständigung von Index-Mails, kein Hintergrunddownload aller Anhänge, keine Datenmigration für reine Gestaltung.
Bestehende Konten, Entwürfe, SMTP-Status, Original-IDs, Tresorformate und vier Sprachen erhalten. Tool-Markenbilder bleiben erhalten; Bedienelemente nutzen einheitliche Liniensymbole.

## 2. Funktion → neue Stelle → Anschlussstelle → Regression

| Vorhandene Funktion | Neue Stelle/Verhalten | Bestehende Datei und Anschlussstelle | Konkrete Regression/Abnahme |
|---|---|---|---|
| Hauptnavigation und Rückweg | Finden, Dateien, Mail als klare Hauptwege; Hinzufügen als Aktion; Einstellungen erkennbar erreichbar | `index.html` `.main-pages/.workspace-tools`; `native/native-toolbar.js` `enhance/decorate`; `assets/workspace.js` `navigate`; `native/native-navigation.js` | Suchfrage, Explorerpfad, Scrollposition und Browser-/Geräte-Zurück bleiben erhalten; kein zweiter Verlaufspfad |
| Kontowahl, Abrufen, Verfassen | Eine Mail-Aktionszeile; kurzer Kontoname, vollständige Adresse im Kontowähler/zugänglichen Namen | `assets/live-mail.js` `accountTools/accountList`, `native/native-toolbar.js` Kontoleisten-Zusammenführung | Zwei gleichnamige Anbieter unterscheidbar; Kontowechsel entfernt alte Auswahl, Nachrichten und Zähler; keine neue Anmeldung nur durch Umordnung |
| Antworten, Weiterleiten, Ablage, Verschieben | Kontextuelle obere Aktionsgruppe; „In Katalog“ als vorhandenen Ablauf sichtbar machen; seltene Aktionen in benanntem Menü | `assets/live-mail.js` `open`, `catalogOne`, `action`; `assets/mail-workspace.js` `drawReader`, `move` | Lokale Katalogaktion bleibt von Server-Verschieben unterscheidbar; Papierkorb/Rückgängig und Anhangsbezug bleiben erhalten |
| Schreiben/Senden/Entwurf/Anhang | Obere Zeile: Brief-Symbol + „Senden“ primär, Anhang, Entwurf speichern, Schreibhilfe; Cc/Bcc aufklappbar | `assets/live-mail.js` `renderComposer`, bestehende `#pb-live-*`, `data-live-text`; `native/native-mail-ai.js` `attach`; lokal `assets/mail-workspace.js` `drawReader` | Verborgene Cc/Bcc-Werte bleiben im Entwurf; Auswahl/Datei-Anhänge und KI-Pseudonymisierung bleiben gleich; kein zweites Send-Event |
| Symbole und Hinweise | Gemeinsamer lokaler Symbolsatz; unbekannter Schlüssel zeigt Text statt Dreipunkten; Dreipunkt nur für tatsächliches Menü | `native/native-toolbar.js` `paths/icon`, `keys`, `decorate`; vorgeschlagen `native/native-icons.js`; `tools/native/prepare-web.mjs` Assetliste | Alle Aktionsschlüssel abdecken, insbesondere `check`, `attach`, `restore`, `notSpam`; sichtbare Namen für mehrdeutige Aktionen; Tastatur/Touch funktionieren |
| Themen/Farben und Dichte | Gleiche Anordnung in Klarblau/Graphit/Petrol/Nachtblau; neutrale Flächen, Akzent für Auswahl/Hauptaktion | `index.html` CSS-Variablen/Themenschalter; `native/native.css`; `assets/workspace.css`; `assets/mail-workspace.css` | Bestehenden Dunkelvertrag `data-theme=dunkel` erhalten; tagsüber fehlt das Attribut (`applyTheme`, Wert `tag`); neues Palettenmerkmal separat, native Dialoge folgen weiterhin dem Hell-/Dunkelzustand |
| Finden, Tags, gespeicherte Suche | Gemeinsame Trefferliste mit Herkunft, Verfügbarkeit und eindeutigem Öffnen; Filter bleiben bedienbar | `index.html` `search`, `multiHopSearch`, `tagsHtml/addTag/removeTag`, `loadSaved/saveSaved`, `importMerge`; `native/native-semantic.js` | Mail- und Dateitreffer bleiben auffindbar; Modell fehlt/lädt/Fehler ehrlich; Import fremder Kataloge erzeugt keine erfundenen Originale |
| Dateien, Originale, Prüfbericht | Baum/Liste und Detailbereich; getrennte Marken für verfügbaren Inhalt, Original und Prüfung | `assets/workspace.js` `entries/buildModel/openEntry`; `native/native-originals.js` `resolve/reconnect`; `native/native-check.js` `stateFor/report` | Index-Mail nicht versehentlich als lokal gespeicherte MIME-Datei öffnen; fehlend/gesperrt/ungeprüft getrennt; Hashfehler stoppen das Öffnen |
| Gemischte Zuordnung | Vorläufige Sammlung als gespeicherte Ansicht nach gemeinsamem Tag über Mail- und Dateieinträge | `CATALOG`, `r.tags`, `cb_saved`; neuer Ansichtsadapter neben `assets/workspace.js`; `native/native-mail-index.js` `textFields/overwrite`; `native/native-categories.js` | Keine Änderung der Explorer-Ausblendregel als Nebenwirkung; Tags über Indexaktualisierung, Katalogmerge und Sicherung erhalten; Aufnahme/Entfernung verändert keine Originaldatei |
| Hinzufügen und Einstellungen | Klarer Importfortschritt; Einstellungen in ruhige Gruppen (Darstellung, Speicher/Sicherung, Mail, Suche, Schutz) | `index.html` Import/Settings; `assets/workspace.js` `prepareImport/storeItem/importSummary`; `native/native-vault.js`; `native/native-semantic.js` | Erfolg erst nach Original- und Katalogschreiben; Abbruch/volle Ablage wiederholbar; Geräte-/Tresorpasswörter und Studiozugang bleiben getrennt |

## 3. Bestehende Symbol- und Layoutprobleme gezielt beheben

- `native/native-toolbar.js:41` verwendet für unbekannte Namen `paths.more`; `keys:125–126` kennt etwa „Prüfen“ nicht. Diesen Ersatz fachlich beseitigen, ohne Ereignishandler neu anzulegen.
- `decorate` versteckt derzeit Texte über `.compact-label`; eine neue Variante „Symbol + Wort“ ergänzen, statt alle Knöpfe pauschal als 36-px-Quadrate zu behandeln (`native/native.css:136–138`).
- Die Kontoleiste wird bereits nachträglich in den Mailkopf verschoben (`enhance:152–158`); diesen Mechanismus nicht zusätzlich duplizieren. Erst DOM-Struktur konsolidieren, danach überholte CSS-Regeln abbauen.
- Der Composer hängt Aktionen nach den Feldern/Anhängen an (`assets/live-mail.js:1078–1194`). Vorhandene Aktionselemente umsetzen oder einmal erzeugen, nicht zweite Send-/Speicherknöpfe mit separater Logik bauen.
- Viele aufeinanderfolgende Media-Queries in `native/native.css:195–299,476–499` überschreiben sich. Pro bearbeiteter Komponente eine abschließende Regelgruppe festlegen und alte gleichwirkende Regeln entfernen; kein weiteres globales `!important`-Paket anhängen.
- Kleine sichtbare Knöpfe gemäß bisherigem Wunsch erhalten; Tippbereiche müssen sich tatsächlich treffen lassen und dürfen Nachbarn nicht überlappen. Anordnung/Hit-Test mit grobem Zeiger prüfen; Vergrößerung ×1,12 und reduzierte Bewegung berücksichtigen.

## 4. Zustandsmodell für die Darstellung (abgeleitet, zunächst nicht neu speichern)

Vier getrennte Aussagen anzeigen; neue Bezeichner unten sind ein UI-Modell, keine bereits vorhandenen Backend-Enums.

| Achse | Vorgeschlagene Aussage | Ableitung und Grenze |
|---|---|---|
| Herkunft | Mailindex / manuell eingelesen / native Kopie / fremder Katalog; mehrere können zutreffen | `mailIndex`, `mailLegacy`, `origin`, `localSource`, Mail-/Anhangsbezug; vorhandene native Kopie über Adapter belegen, nicht aus Kategorie/Dateiendung raten |
| Verfügbarer Inhalt | Original / Mailtext / Katalog-Steckbrief | Mailindex enthält Text, standardmäßig zwölf Monate, höchstens 8.000 Zeichen, keine Anhänge; `mailBody` ist kein Beleg vollständiger MIME-Daten |
| Originalverfügbarkeit | lokal vorhanden / Speicherort gesperrt / beim Anbieter abrufbar / fehlt / noch nicht ermittelt | `PBOriginals.stored`, `ProFiles.originalInfo`, Tresorzustand/Dateireferenz, `mailRemotes`; „beim Anbieter abrufbar“ ist ein angebotener Weg, keine garantierte aktuelle Erreichbarkeit |
| Prüfung | läuft / Befund / teilweise / ohne Befund im geprüften Bereich / noch nicht geprüft / nicht prüfbar | `PBCheck.stateFor`: `running/found/partly/clean/open/missing`; Prüfbereich und Zeitpunkt aus `rec.pruefung` ergänzen, keine pauschale Sicherheitszusage |

`PBCheck.stateFor` ist kein Verfügbarkeitsbeweis: vorhandene `pruefung` hat Vorrang; `canCheck` ist auch für Index-Mails wahr. Eine Textprüfung kann neben „Original nicht lokal“ stehen. `checkMail` prüft rekonstruierten Text; selbst `clean` muss dann „Mailtext geprüft“ heißen, nie „vollständige Mail samt Anhängen geprüft“.
`PBCheck.vaultState` beschreibt einen gespeicherten Prüfstand, nicht Entsperrung oder aktuelle Lesbarkeit des Speicherorts. „Original fehlt“ und „Speicher gesperrt“ dürfen sich nicht gegenseitig ersetzen.
Bei `mailIndex` ist `hash` ein Hash über Message-ID/Textschlüssel (`native/native-mail-index.js:191–195`), kein Fingerabdruck der originalen MIME-Datei. Keine Hashgleichheit verschiedener Entitätstypen erfinden.
Originalprüfung weiter erst beim tatsächlichen Lesen; native `resolve` verifiziert Bytes gegen SHA-256. In der Liste nicht zum bloßen Anzeigen sämtliche Dateien laden.
Ein ausdrücklicher Knopf kann vorhandene `openRemote`, `resolve` oder `reconnect` aufrufen; Auswahl einer Mail oder einer Sammlung löst keine neue Vollarchivierung aus.

## 5. Sammlungen: kleiner Einstieg auf bestehenden Daten

Zuerst fachlich festhalten: **Sammlung = virtuelle Zuordnung**, Entfernung entfernt nur Zuordnung; eine Datei/Mail darf in mehreren Sammlungen stehen. PDF-Merge bleibt außerhalb dieses Ablaufs.
MVP-Vorschlag: benannter Tag + gespeicherter Tagfilter. Bestehendes `r.tags` trägt die Mitgliedschaft; `cb_saved` kann bis zu 20 gespeicherte Suchansichten mit Name/Filter tragen. „In Sammlung“ ist bis zur funktionalen Umsetzung ein Entwurf.
Vor Umsetzung klären: Sind Sammlungen exakt gemeinsam benutzte Tags oder sollen Name/Umbenennen/Mitgliedschaft unabhängig von Tags sein? Im zweiten Fall wäre eine eigene ID/Metadatenablage erforderlich; diese erst mit begründeter Versionierung/Export-/Sicherungsstrategie ergänzen.
Eine gemischte Ansicht über `CATALOG` ergänzen; `assets/workspace.js:130–137` und `native/native-categories.js:64–66` blenden Index-Mails absichtlich aus. Bestehenden Explorer und die fünf Themenlisten unverändert lassen, bis ihr Verhalten gezielt übernommen wird.
Indexaktualisierung erhält eigene Tags (`overwrite`), Katalogmerge vereinigt sie. Für gespeicherte Sammlungen erst Zuordnung von fremdem Katalog/Originalquelle sichtbar machen, nicht automatisch Dateien nachladen.
Vor neuer Tag-Oberfläche `addTag/removeTag` härten: Erfolg erst nach `idbPut`; Schreibfehler heute nicht weiter verschlucken. Bei Fehler alten Zustand und Auswahl erhalten; Sammelzuordnung muss Teilerfolg pro Eintrag benennen können.
Noch keine neue Datenmigration nötig. Zusätzliche Persistenz nur für Anforderungen, die vorhandene Tags/gespeicherte Filter nachweislich nicht tragen; kein zweiter Mitgliedschaftsbestand neben `r.tags` ohne Grund.

## 6. Kleine, rücknehmbare Phasen

1. **Muster Mail, ohne Funktionsumbau:** Vorher/Nachher für Liste, Lesen, Schreiben; Hell/Dunkel und vier Paletten, echte Zustandsbeispiele mit synthetischen Daten. Labels/Ein-Zeilen-Prioritäten und Brief-Senden festlegen.
2. **Gemeinsame Symbole und Farbvariablen:** vorhandene SVGs extrahieren, vollständige Zuordnung, Text-Fallback, sichtbare Aktionsnamen; Ladereihenfolge in `tools/native/prepare-web.mjs` ergänzen. Bestehende Ereignisse/Datenformate beibehalten.
3. **Mail produktnah umbauen:** jeweils Kontokopf → Leseaktionen → Composer in getrennten Änderungen; Konto-/Menü-/MIME-/SMTP-Verträge unverändert. Lokale und native Mailansicht beide abnehmen.
4. **Statusdarstellung:** abgeleiteten Adapter für Herkunft/Inhalt/Original/Prüfung ergänzen und erst in Mail, dann Treffern/Dateien verwenden; keine Änderung der Prüfalgorithmen oder automatische Nachladeaufträge.
5. **Finden → Dateien → Hinzufügen → Einstellungen:** pro Seite eigene Änderung mit Prüfung des Hauptweges und Rücknahme ohne Migration; keinen Austausch aller Oberflächen auf einmal.
6. **Gemischte Sammlung nach fachlicher Festlegung:** zuerst gespeicherter Tagfilter, dann gezielte Aufnahme/Entfernung und Fehlerrückmeldung; Rücknahme entfernt die neue Ansicht, bestehende Tags bleiben nutzbar.
7. **Ergänzende Dialoge/Werkzeuge:** Prüfbericht, Speicher/Sicherung, Mycel/Siegel nur mit app-eigenen Anpassungen; Kontaktfotos bleiben eigener späterer Geräteabschnitt. Abschlussabnahme ohne neuen Releaseauftrag.

## 7. Bestehende Prüfstellen und gezielte Ergänzungen

| Änderung | Bereits vorhandene Prüfdateien | Gezielte Ergänzung statt bloßer Textanpassung |
|---|---|---|
| Symbole, Navigation, Responsive | `tools/native/test-compact-network.mjs`, `test-folders-layout.mjs`, `test-navigation.mjs`, `test-web.mjs`; `tools/e2e-workspace.mjs` | Bekannte Aktion zeigt nie Ersatz-Dreipunkt; sichtbares Senden mit Brief, kein Papierflugzeug; Tab/Enter/Escape, Fokus und Zurück; keine abgeschnittenen Aktionswörter |
| Lesen/Schreiben/Senden | `tools/native/test-mail-device.mjs`, `test-mail-accounts.mjs`, `test-mail-ai.mjs`, `test-mail-links.mjs`; `tools/e2e-mail-workspace.mjs`, `e2e-live-mail.mjs` | Cc/Bcc klappen ohne Datenverlust; Speichern bleibt Fehlerfall; ein Klick erzeugt genau einen Sendversuch; unklarer Versand bleibt unklar nach Abruf/Neustart |
| Original und Prüfstand | `tools/native/test-originals.mjs`, `test-originals-find.mjs`, `test-check.mjs`, `test-vault.mjs` | Lokales Original/Mailtext/fremder Katalog × ungeprüft/teilweise/Befund; gesperrter Speicher; fehlendes Original; falscher Hash; kein falsches Grün nach erneutem Öffnen |
| Finden/Organisation/Sammlung | `tools/native/test-mail-index.mjs`, `test-categories.mjs`, `test-semantic.mjs`, `test-explorer-kinds.mjs`, `test-explorer-order.mjs`; `tools/e2e-advanced.mjs`, `e2e-features.mjs`, `e2e-embedding.mjs` | Gemischter Tagfilter, Index-Update erhält Tags, Speicherung schlägt fehl, Mailindex ohne Anhänge, Katalogmerge ohne Original; keine Erweiterung des Abrufzeitraums durch Ansichtwechsel |
| Hinzufügen/geschützte Oberflächen | `tools/native/test-import-progress.mjs`, `test-share.mjs`, `test-mycel.mjs`, `test-tools.mjs`; `tools/test-storage-commit.mjs`, `tools/drift-guard.mjs` | Original- oder Katalogschreiben fehlschlägt, während Import neue Datei; geschütztes Modul unverändert; explizit verbotene Emojis kehren in bearbeiteter UI nicht zurück |

Alle verkürzten `test-…mjs`-Namen in dieser Tabelle liegen unter `tools/native/`; alle verkürzten `e2e-…mjs`-Namen unter `tools/`. Die genannten Bestandsdateien sind vorhanden; 412 px muss in den bisherigen Responsive-Matrizen gezielt ergänzt werden.
Matrix: **DE/EN/RU/PL × Hell/Dunkel × 320/412/768/1280/1920 px**, Muster Mail zusätzlich in allen vier Paletten. Längste übersetzte Beschriftung, lange Ordnernamen/Adressen und 200 % Textvergrößerung aufnehmen.
Grobe Zeiger/Touch (ein Finger, kein Hover erforderlich), Maus und Tastatur testen; keine horizontale Seitenüberbreite, Wortbrüche oder verdeckte Hauptaktion. Bei 320 px niedrig priorisierte Aktionen in ein benanntes Menü statt drei gestapelter Leisten.
Bei geänderten Emoji-Textproben zugängliche Namen und tatsächliches Verhalten prüfen; eine Gegenprobe muss die falsche Zuordnung/das verschwundene Wort erkennen. Keine Prüfassertion allein löschen, um neue Bilder grün zu bekommen.
Nach Produktänderungen relevante Einzelproben; am Ende `npm run test:native-web`, passende Web-/Speicherproben und Drift-Guard. Gemeinsame native Änderungen müssen Android und Windows in ihren bestehenden Abnahmen durchlaufen.
Diese Vorbereitung führt keine dieser Laufzeitprüfungen aus. Browserproben mit gestelltem Transport belegen keine echte Kontoanmeldung oder Livesendung; Tabletprüfung bleibt Klaus' tatsächlicher Geräteabnahme vorbehalten.

## 8. Nicht verletzbare Zustandsregeln

- Erfolgsmeldung erst nach abgeschlossener Schreiboperation; Fehler/Teilerfolg zeigen, alte Daten und nutzbaren Rückweg erhalten.
- SMTP-Status unklar bleibt unklar; niemals automatisch erneut senden, durch Neuzeichnen/Sprachwechsel neuen Entwurf erzeugen oder fehlenden Nachweis als Erfolg ausgeben.
- Kein stiller Original-/Tresorreset, kein Ersatzschlüssel, keine Verwechslung von Vorschau und Original. Gesperrte/fehlende Ablage stoppt erforderliche Schreibwege.
- „Ohne Befund“ gilt nur für tatsächlich geprüfte Daten; Teilprüfung/fehlende Originale/ungeprüfte Anhänge benennen. Keine Aussage „virenfrei“.
- Katalog-/Tag-/Ansichtsoperationen bewegen, löschen oder vereinen keine Quelldateien. Serveraktionen bleiben ausdrücklich erkennbare eigene Aktionen.
