# Ordnerbaum, ehrlicher Prüfstand, Papierkorb und Spam, Versionsnummer (Klaus 2026-10-22, für .28)

Klaus: *„Mail-Anhänge und Anhänge aus E-Mails sind zweimal dasselbe. Irritiert mich … 0 Befund und dann 13 können nicht
gelesen werden? … Könnten wir den Ordnerbaum so aufbauen wie einen richtigen Explorer-Ordnerbaum“* und *„Ja, bau das
alles in .28 ein.“* Dazu zur Mail: *„Werden beim Löschen nicht in Papierkorb verschoben … wiederherstellen … als Spam
kennzeichne, müssen sie auch in den Spam-Ordner wandern … bei allen E-Mail-Konten“* und zur Version: *„Die App-Version
muss immer sichtbar irgendwo stehen … nicht Vorschau, bitte eine echte App-Nummer“*.

## A · Explorer als Ordnerbaum (`assets/workspace.js`, `native/native-vault.js`)

- Wurzel **„Alle Dateien“**, darunter **E-Mails › 👤 Absender › Mail › Anhänge**, Dokumente, Fotos und Notizen nach ihrem
  Herkunftsordner. Jede Datei steht **einmal**. „Mail-Anhänge“ und „Anhänge aus E-Mails“ gibt es nicht mehr getrennt:
  Anhänge aus dem Postfach im Speicherort (Tresor) hängen unter ihrer Mail (gleicher Absender und Betreff), sonst unter
  einer eigenen Mail-Zeile; der Knopf „Ganzen Ordner leeren“ steht oben bei „E-Mails“.
- Ein Anhang kennt seine Mail (`fromMail` = Fingerabdruck der Mail, ab .28 beim Einlesen gesetzt). Ältere Anhänge ohne
  diese Angabe gehen zur einzigen Mail desselben Absenders, sonst in **„📎 Anhänge, Mail nicht zugeordnet“** mit dem
  Hinweis, die Mail neu einzulesen. Nichts wird verschoben oder gelöscht; es ist nur die Ansicht.
- **Handy (bis 760 px):** eine Ebene auf einmal, darüber der Pfad zum Antippen (`Alle Dateien › E-Mails › …`), ← geht
  eine Ebene hoch. **Breit:** Baum links mit ▸/▾, ⊟ „Alle zuklappen“, ◧/◨ blendet den Baum aus, Tastatur ←/→ klappt.
  Was offen war, merkt die App (`pb_explorer_open`, `pb_explorer_tree_hidden`).
- Jede Zeile zeigt kurz: Absender oder Ordner · Größe · Datum · Ablage. Ordner zeigen Anzahl und Befunde.

## B · Ehrlicher Prüfstand (`native/native-check.js`)

- Kann eine Datei nicht geprüft werden, weil das Original fehlt (kein Ordner verbunden, keine Kopie), steht
  **„⊘ Original fehlt · nicht prüfbar“** statt „jetzt prüfen“. Ein Tipp darauf führt zu „Original erneut auswählen“.
- „Alle prüfen“ prüft nur, was prüfbar ist. Danach und auf Tipp auf **„🛡 Prüfstand“** steht eine Zeile über **alle**
  Dateien: Befund · teilweise geprüft · unauffällig · ohne Original · noch offen. Befunde stehen als Liste darunter,
  dazu **„Originale suchen“** (Ordner neu verbinden).
- Nie „virenfrei“: „unauffällig“ heißt nur, dass die Regeln nichts gefunden haben.

## C · Prüfbericht in einfachen Worten

- Oben ein Satz, was das Ergebnis heißt; bei „teilweise geprüft“ in einfachen Worten warum (zu viele Seiten, versteckter
  Text, Texterkennung nicht möglich, gepackte Datei, zu groß, Lesefehler). Die Fachangaben des Prüfkerns stehen
  zugeklappt unter „Details“. Der Prüfkern selbst (byte-1:1) bleibt unverändert.

## Mail: Papierkorb, Spam, Wiederherstellen, Zahlen vom Server

- **Löschen verschiebt in den Papierkorb des Anbieters** (Ordner mit `\Trash` oder ein üblicher Name: Papierkorb,
  Trash, Deleted, Gelöschte Elemente …), bei allen Konten. Endgültig löschen gibt es nur **im** Papierkorb.
- **♻ Wiederherstellen** im Papierkorb, **✓ Kein Spam** im Spam-Ordner: zurück in den Posteingang, auch für mehrere
  Mails auf einmal. **Spam** verschiebt in den Spam-Ordner (Spam, Junk, Junk-E-Mail, Spamverdacht, Unerwünscht …).
- **Zahlen kommen vom Server:** beim Laden der Ordner fragt die App je Ordner (bis 80) Anzahl und Ungelesene ab
  (IMAP STATUS) und nach jeder Aktion neu. Mails, die woanders in den Papierkorb gelegt wurden, stehen dort, sobald der
  Ordner geöffnet wird.
- **Weitere Ordner:** die gewohnten Ordner bleiben für alle Konten gleich. Eigene Ordner des Anbieters (Google hat viele)
  stehen unter **„▸ Weitere Ordner“**, zuerst zugeklappt. Googles Sammelansichten (Alle Nachrichten, Markiert, Wichtig)
  tragen „· Ansicht“, denn eine Mail liegt dort nicht wirklich.
- Technik: `MailEngine.moveTo` nutzt IMAP MOVE, sonst Kopie + gelöscht markieren + Löschen nur dieser Mails (UIDPLUS).
  Kann der Server beides nicht, meldet die App das, statt still zu löschen (`MOVE_UNSUPPORTED`).

## Versionsnummer

- Klein neben „Private Brain Pro“ in der Kopfzeile, auf jeder Seite: **v1.0.28**. Ein Tipp führt zu „Auf Updates prüfen“.
- Intern bleibt `versionName` `1.0.0-preview.28` (die Release-Prüfung verlangt die Form `vX.Y.Z-preview.N`); gezeigt wird
  `v<Haupt>.<Neben>.<N>`. Ab .28 beginnt die Hauptnummer bei 1, damit es nicht wie eine Vorschau klingt.

## Prüfung

- `tools/native/test-explorer-kinds.mjs`, `test-check.mjs`, `test-navigation.mjs`, `test-vault.mjs`,
  `test-mail-device.mjs` (gestelltes Mail-Plugin mit Papierkorb/Spam und Zahlen), `test-tools.mjs`,
  `tools/e2e-mailattach.mjs`, `tools/e2e-workspace.mjs`.
- ⚠ Die Oberfläche (Knöpfe, Ziele, Zahlen) ist mit gestelltem Android-Teil geprüft. Die Java-Seite (`moveTo` mit MOVE
  oder Kopie + Löschen, STATUS-Zahlen) wird in CI nur gebaut, nicht gegen einen IMAP-Server gefahren.
- ⚠ Nicht gemessen: echte Konten (Telekom, Google) mit Papierkorb/Spam, das Tablet.
