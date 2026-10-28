# Hintergrundaufgabe aller Pro-Apps (Pro-Umbau 4, 2026-10-28)

Leitfaden § 3 (`BookLedgerPro/docs/design/LEITFADEN-PRO-APPS-BEDIENUNG.md`): „Prüfen, Einordnen, Sichern laufen im Hintergrund …
in der Android-App als native Hintergrundaufgabe.“ Bis hierher musste die App dabei offen bleiben.

## Was es ist
- **Gerechnet wird weiter in der Seite** (WebView). Neu ist ein Android-**Vordergrund-Dienst** (`ProHintergrundDienst`, Art „dataSync“),
  der läuft, solange mindestens eine lange Aufgabe läuft. Er zeigt eine ruhige Mitteilung **„Läuft im Hintergrund“** bzw. den Titel der
  Aufgabe („Sicherung läuft“, „Prüfen läuft“, „Einordnen läuft“, „Bildbeschreibung läuft“) mit Stand („Dokument 3 von 40“), Balken und
  **„Abbrechen“**. Ein Tipp auf die Mitteilung öffnet die App.
- Solange etwas läuft, behält die WebView ihre Priorität (`setRendererPriorityPolicy(IMPORTANT, false)`); danach wieder wie vorher
  (Android darf sie abwerten, wenn sie nicht zu sehen ist).
- Capacitor hält die WebView beim Wechsel in den Hintergrund nicht an (`KeepRunning` ist an, nachgelesen in `Bridge.onPause`). Was ohne
  Dienst geschah: Android konnte den App-Prozess oder den Darstellungsprozess der WebView beenden, sobald die App nicht zu sehen war.

## Gemeinsame Dateien (Quelle: Private Brain Pro, byte-gleich kopiert)
| Datei | Was |
|---|---|
| `native/pro-hintergrund.js` | JS-Hülle `window.ProHintergrund`: `beginnen({art, titel, text})` → `{stand(text,i,n), ende(), signal, geschuetzt}`, `lauf(angaben, arbeit)` |
| `android/…/de/familyprojekt/hintergrund/ProHintergrundPlugin.java` | Capacitor-Plugin `ProHintergrund` (beginnen, stand, ende, aufraeumen, zustand, erlauben) |
| `android/…/de/familyprojekt/hintergrund/ProHintergrundDienst.java` | Vordergrund-Dienst mit Mitteilung |

Gepinnt mit den Bedien-Bausteinen in `native/pro-bedienung-herkunft.json` (Fassung 2, `pfade` nennt alle fünf Dateien).
Pflege: hier ändern → `node tools/native/pro-bedienung-pins.mjs --schreiben` → in Workflow PDF Pro und BookLedgerPro
`node tools/native/bedienung-nachziehen.mjs --quelle ../Privat-Brain-Pro`. Jede App trägt selbst ein: `<service …ProHintergrundDienst…
foregroundServiceType="dataSync">`, die Rechte `FOREGROUND_SERVICE`, `FOREGROUND_SERVICE_DATA_SYNC`, `POST_NOTIFICATIONS` und
`registerPlugin(de.familyprojekt.hintergrund.ProHintergrundPlugin.class)` in der `MainActivity`.

## Regeln, die im Code stehen
- **Nie `stopService`:** stünde der Dienst noch vor `startForeground`, beendete Android die App. Der Dienst hält selbst an, sobald keine
  Aufgabe mehr da ist (auch wenn sie schon fertig war, bevor er stand).
- **Start aus dem Hintergrund** ist ab Android 12 meist verboten → die Aufgabe läuft trotzdem, `geschuetzt` ist dann `false` (nichts wird
  vorgetäuscht).
- **Mitteilungs-Erlaubnis** (Android 13+): gefragt wird einmal je Installation und **nur, wenn die Aufgabe direkt aus einem Tipp kommt**;
  unter Gerätetests (Instrumentierung) nie. Ohne Erlaubnis läuft der Dienst trotzdem; Android zeigt ihn dann nur in der Aufgabenliste.
- **Stand höchstens einmal je Sekunde** an Android (der letzte gewinnt), die Mitteilung flackert sonst.
- **Seite neu geladen:** beim Laden räumt die Hülle alte Aufgaben ab (`aufraeumen`) — eine alte Seite meldet nie ein Ende.
- **App aus der Liste gewischt** (`onTaskRemoved`) und **6-h-Grenze von „dataSync“** (Android 15, `onTimeout`): alles hält an,
  die Seite bekommt „abbruch“.

## Wer was anmeldet
| App | Aufgabe | „Abbrechen“ in der Mitteilung |
|---|---|---|
| Private Brain Pro | „Alle prüfen“ (Dateien und Mail-Anhänge, `native-check.js`) | hält nach der laufenden Datei an |
| Private Brain Pro | Einordnen (jede Bedeutungs-Rechnung für Dateien/Mails, nicht die Suchfrage; `native-semantic.js`), Ende 3 s nach der letzten Rechnung | nimmt nur den Schutz weg (60 s Ruhe); die Einlese-Schleifen der App lassen sich von hier nicht sicher anhalten |
| Workflow PDF Pro | Sicherung erstellen/zurückholen (`native-sicherung.js`) | wie der Knopf „Abbrechen“ im Fenster |
| Workflow PDF Pro | „Alle prüfen“, „N gewählte prüfen“, Einordnen, Bildbeschreibung (`native-hintergrund.js`, Blick je Sekunde auf den Kern) | Prüfen hält nach dem laufenden Dokument; Einordnen wartet wieder auf „Einordnen“; Bildbeschreibung schaltet aus (wie „Abbrechen“ des Kerns) |
| BookLedgerPro | automatische Sicherung ins Fach, Einordnen der Belege | siehe BookLedgerPro `CLAUDE.md` „Pro-Umbau 4“ |

## Gemessen / nicht gemessen
- Gemessen im Chromium des Behälters mit **gestellter** Android-Brücke: `tools/native/test-pro-bedienung.mjs` (33, davon 11 zur Hülle und zum
  Java-Text), hier `tools/native/test-hintergrund.mjs` (9), in Workflow PDF Pro `tools/native/test-hintergrund-dienst.mjs`. Gegenproben je
  rot. Java mit `javac` gegen Platzhalter der Android-/Capacitor-Klassen übersetzt; gebaut wird es erst in der CI.
- ⚠ **Nicht gemessen:** ein echtes Gerät. Ob die Mitteilung am Tablet erscheint, ob Android die App mit Dienst im Hintergrund wirklich
  weiterrechnen lässt (Hersteller-Energiesparen, Samsung „App schlafen legen“) und wie Timer in einer verborgenen WebView gedrosselt
  werden, ist offen.
