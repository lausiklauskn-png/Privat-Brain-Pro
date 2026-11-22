# Abschluss 22.11.2026 – „Alle Konten“ als Postfach, Themen aus V3, V3 Schritt 1 (Mail)

Sitzung nach `BRIEF_SITZUNG_2026-11-23_ALLE-KONTEN-V3-THEMEN.md`. Nichts veröffentlicht (keine APK, kein Windows-Setup).

## Erledigt

| Was | Wo | Stand |
|---|---|---|
| „Alle Konten“ als drittes Postfach-Konto (Klaus' Antwort auf die Vorschau: Index merkt alle Ordner und die Anhänge, Listen zu 15 mit „Weitere laden“, Anhänge der gezeigten Seite vorausladen) | Pro PR #158 | auf `main`, Version 1.0.58/58 |
| Vier Themen aus V3: Erdton, Petrol warm, Schiefer kompakt, Weich und luftig (Klaus: „alle vier“) | Pro PR #159 | auf `main` |
| Klon `privat-brain-pro` @ `8e082ae` in der Privaten Akte, Fassung 0.9.9 | Private-Akte PR #89 | offen – Zusammenführen veröffentlicht dort die Web-App, darum auf Klaus' Wort |
| V3 Schritt 1 „Mail“ (Alle Konten, Passwort erneuern, Telekom-Fenster, Mailtext, Postfach öffnet von selbst; V3-Eigenes bleibt) | V3 PR #35 | offen, CI läuft |

Vorschau und Bilder: `docs/design/alle-konten-1.0.58/` (vorschau.html, app-breit.png, app-handy.png, themen-aus-v3.png).

## Entscheidungen (Klaus 22.11.2026)

- „Alle Konten“: Index statt Live-Abfrage; alle Ordner (ohne Sammelansichten), Anhang-Angaben; Seiten zu 15; Vorausladen.
- Themen: alle vier aus V3.
- V3-Reihenfolge: Mail → Suche → Tresor und Ablage → Gerät (Texterkennung, Übersetzung, zweites Modell, Hintergrund), Windows jeweils mit.

## Offen

- **V3 Schritte 2–4** (Liste der Unterschiede in der Vorschau, Abschnitt 4): Suche (Sortier-Kern, `such-frage.js`, eigene Kategorien, Einstellungen nach Themen, Prüf-/Statusanzeige), Tresor und Ablage (Tresorordner, Tresor-Hilfe, Pro-Verbund, „An Familienakte“, `tresorMailAblegen`), Gerät. Dabei die in V3s `test-mail-index.mjs` eingeklammerten Prüfungen (PBRecordStatus, PBSuchFrage, PBMailTranslation, Familienakte) wieder voll laufen lassen.
- **Veröffentlichen** auf Klaus' Wort: Pro 1.0.58 (Android + Windows), V3 3.0.0-preview.9 (PWA, APK, Windows), Private Akte 0.9.9.
- **Update 1.0.56 → 1.0.57 fror im Pop-up-Fenster ein** (Nebenpunkt aus dem Auftrag): nicht angefasst. Vorschlag aus dem Auftrag gilt weiter (Meldung vor der Einstellung „Unbekannte Apps“, Aufruf auf den UI-Faden); Klaus fragen, ob es im Vollbild ging.
- Grenzen „Alle Konten“: anderswo gelöschte Mail fällt erst beim Öffnen aus der Liste; Ordnerzahlen vom letzten Abruf. Nicht am Gerät geprüft.

## Lehren

- Im Behälter: `build:web` bricht bei OCR/Film ab; danach `tool-icons`, OCR-Dateien und Modell-Pins von Hand nach `www/` kopieren. Nie ganze Ordner pauschal nach `www/` kopieren (`test-web` prüft, dass nur Laufzeit-Dateien drin sind).
- V3s `test-themes` schreibt Vorschau-Bilder neu – nach dem Lauf `git status` ansehen.
- Java-Tests ohne Android-SDK: `javax.mail` 1.6.2, JUnit 4.13.2 von Maven Central holen, `javac -encoding UTF-8`; Windows-Engine mit `LANG=C.UTF-8`.

## Startauftrag für die nächste Sitzung

```
Lies CLAUDE.md und BRIEF_ABSCHLUSS_2026-11-22_ALLE-KONTEN-THEMEN-V3-MAIL.md im Repo Privat-Brain-Pro.
Hol das Repo Privat-Brain-Pro-V3 dazu. Prüfe zuerst V3 PR #35 (CI) und führe ihn bei Grün zusammen.
Dann V3 Schritt 2 „Suche“ nach Pro nachziehen (gleiches Vorgehen: dreiwegig gegen 1c947a3, V3-Eigenes behalten,
Proben aus Pro übernehmen und an V3 anpassen), danach Schritt 3 „Tresor und Ablage“. Veröffentlichen nur mit Klaus' Wort.
```
