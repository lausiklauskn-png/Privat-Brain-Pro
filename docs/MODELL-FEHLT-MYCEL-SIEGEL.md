# Gelbe Lampe beim Embedding-Modell, Siegel-Identität (2026-10-27)

**Befund aus Klaus' Test (Windows):** Beim Suchen über das Mycel blieb die Lampe gelb, mit „Embedding-Modell
kann nicht geladen werden“, obwohl eine andere App (Sage) das Modell geladen hatte. In einer App ließ sich über das
Siegel keine Identität erzeugen.

## Ursache

- Mycel-Verbinden, „Wer ist im Raum?“, Fragen ans Netz und das Erzeugen der Siegel-Identität (Andock-Assistent)
  rufen das Kanon-Modul 03 direkt auf (`SbkimEmbedding.init`/`embedPassage`/…).
- In Private Brain Pro (Android und Windows) kommt das Modell aber **nur** über Einstellungen → „Modell für die
  Bedeutungssuche“ → „Modell laden“ auf das Gerät (118 MB, mit Fingerabdrücken). Direkt von Hugging Face lädt die
  App bewusst nicht (`resources.rs`: 404 „Use the native model download“).
- **Jede App hat ihren eigenen Speicher.** Dass Sage das Modell geladen hat, hilft Private Brain Pro nicht.
- War das Modell in Pro noch nicht geladen, scheiterten Mycel und Siegel mit einer Fehlermeldung, statt zum Laden
  zu führen. Beide Beobachtungen haben also dieselbe Wurzel.

## Was jetzt gilt (`native/native-semantic.js`)

- Die App legt beim Laden von Modul 03 eine Führung um dessen Aufrufe. Modul 03 selbst bleibt byte-1:1.
- Fehlt das Modell und **Sie** haben den Schritt ausgelöst (Klick auf „Verbinden“, „Identität erzeugen“ …):
  einmal die Frage „… braucht die App einmal das Modell …, etwa 118 MB. Jetzt laden?“. Mit „OK“ lädt sie mit
  Fortschritt (auch im Balken des Mycel-Fensters) und macht danach mit dem Schritt weiter.
- Mit „Abbrechen“ oder bei Aufrufen im Hintergrund (z. B. eine Frage aus dem Netz): keine Rückfrage, sondern die
  klare Meldung, dass das Modell fehlt und wo man es lädt.
- Ist das Modell geladen, ändert sich nichts.

## Geprüft

- `tools/native/test-semantic-guard.mjs`: 10 grün (ProSemantic und Modul 03 simuliert).
- Gegenproben: Führung entfernt → rot; Führung tut nichts → rot (Hintergrundfall).
- `test-semantic` 18, `test-mycel` 35, `test-speech` 27 weiter grün.

⚠ Nicht am Gerät gemessen. Welche App bei Klaus die Siegel-Identität nicht erzeugen konnte, ist nicht notiert;
Sage-Protokol, Workflow PDF und das SBKIM-Tool sind andere Repos und hier nicht geprüft.

## Veröffentlicht in 1.0.41 (2026-10-27)

Android und Windows 1.0.41 aus main `c4d0c5fd`, Release-Läufe 40592146491 (Android) und 40592142031 (Windows).
APK SHA-256 `92a2dd1b…41ac2d2`, Setup SHA-256 `1becda08…c297f62`, beide unabhängig geladen und gleich `SHA256SUMS`.
Die PWA bekommt den Stand über Pages.
