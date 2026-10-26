# Abschluss 2026-10-26 abends – Sitzung 5 veröffentlicht, Workflow PDF Pro 1.0.5 (Claude)

Eine Claude-Sitzung hat Sitzung 5 (3D-Knöpfe, Kategorien mit Ordnerbaum) gebaut und auf Klaus' Wort
(„kannst die PRs merken und dann in die anderen Varianten übertragen und in das Geschenk“) übernommen und veröffentlicht;
danach auf sein Wort auch Workflow PDF Pro 1.0.5 („wenn das die aktuellste ist, muss die raus“). Alles ist auf main,
alle Zweige `ccr-2068cf6c-0u3a7n` stehen wieder auf main. **Nichts mehr offen außer der Geschenkseite** (siehe unten).

## Veröffentlicht (alle Downloads unabhängig geladen, Größe und SHA-256 gleich den Prüfsummen)

| App | Fassung | Android | Windows | Unterlage |
|---|---|---|---|---|
| Private Brain Pro | 1.0.39 | [APK](https://github.com/lausiklauskn-png/Privat-Brain-Pro/releases/download/v1.0.39/Private-Brain-Pro-1.0.39.apk) 60.926.381 B `c776d549…` | [Setup](https://github.com/lausiklauskn-png/Privat-Brain-Pro/releases/download/windows-v1.0.39/Private-Brain-Pro-Windows-1.0.39-x64-setup.exe) 101.205.944 B `3a579d3f…` | [Veröffentlichung Sitzung 5](docs/design/aenderungen-2026-10-26/VEROEFFENTLICHUNG-SITZUNG-05.md) |
| Private Brain V3 Pro | 3.0.0-preview.8 | [APK](https://github.com/lausiklauskn-png/Privat-Brain-Pro-V3/releases/download/v3-android-3.0.0-preview.8/Private-Brain-V3-Pro-3.0.0-preview.8.apk) 49.714.329 B `89df481e…` | [Setup](https://github.com/lausiklauskn-png/Privat-Brain-Pro-V3/releases/download/v3-windows-3.0.0-preview.8/Private-Brain-V3-Pro-Windows-3.0.0-preview.8-x64-setup.exe) 91.425.392 B `80e2381c…` | ebenda |
| Workflow PDF Pro | 1.0.5 | [APK](https://github.com/lausiklauskn-png/Workflow-PDF-Pro/releases/download/v1.0.5/Workflow-PDF-Pro-1.0.5.apk) 83.147.148 B `c9b8e67e…` | [Setup](https://github.com/lausiklauskn-png/Workflow-PDF-Pro/releases/download/windows-v1.0.5/Workflow-PDF-Pro-Windows-1.0.5-Setup.exe) 15.866.577 B `7e4e9195…` | [Produktstand](https://github.com/lausiklauskn-png/Workflow-PDF-Pro/blob/main/docs/PRODUKTSTAND.md) |

PWAs: Pro, V3 und Workflow PDF (1.1.3) über GitHub Pages aus denselben main-Ständen.

## PRs dieses Abends (alle nach grüner CI selbst übernommen, Freibrief für Anker)

Pro #92 (Sitzung 5), #93 (Anker/Veröffentlichung), #94 (Geschenk-Quelle) · V3 #26 (Sitzung 5), #27 (Anker) ·
Workflow-PDF-Pro #28 (Anker, Produktstand, README-Links 1.0.5).

## Geschenk für Jens – bewusst nicht veröffentlicht

- Im Repo (`docs/geschenk/geschenk-jens.html`, main `4d848a1`) steht die neue Fassung: alle drei Apps auf dem heutigen Stand,
  je App ein Kasten „Neu in dieser Fassung“ (Bildbeschreibung, 3D-Knöpfe, Ordnerbaum, ⓘ-Erklärungen; Workflow PDF Pro:
  Bildbeschreibung, Direktstart, Worker-Schonung), Workflow PDF Pro 1.0.5 (83 MB / 16 MB), Stand 26.10.2026.
- Das Artefakt `https://claude.ai/artifact/XPEQpCH7axafiTRB7y1RB7` steht noch auf **Fassung 24** (Workflow PDF Pro dort 1.0.3,
  ohne „Neu“-Kästen). Klaus hat die Veröffentlichung zurückgestellt: die andere Sitzung arbeitet an einer V3-Verbesserung
  (V3 PR #28 „Webfassung startet schneller“); danach „keine Veröffentlichung nötig“ (Klaus, 2026-10-26 abends).
- Wer die Seite später veröffentlicht: Repo-Datei nehmen, V3-Stand prüfen (neue App-Nummer? dann Links und Größen), ein Satz
  in den V3-„Neu“-Kasten, dann als neue Fassung desselben Artefakts veröffentlichen.

## Grenzen, ehrlich

- Nichts am Tablet oder an Klaus' Rechner gemessen; die Windows-Setups sind unsigniert.
- Das Bildmodell (256 MB, 1,2 GB Arbeitsspeicher im Prüfrechner) ist in keinem Paket; ob ein Tablet es trägt, ist offen.
- Drei CI-Eigenheiten sind benannt, nicht behoben: hängende WebKit-Jobs, Emulator-Launcher-Flocke, Windows-Release-Tor bei
  Unterlagen-Commits ([Forschung](docs/design/aenderungen-2026-10-26/FORSCHUNG-SITZUNG-05.md), Punkte 14–18).

## Nächste Sitzung

Sitzung 6 (6b Zielordner echt bearbeiten) nach [Brief](BRIEF_SITZUNG-06_ZIELORDNER-BEARBEITEN.md); frisch von `origin/main`
abzweigen. Nichts ohne Klaus' Wort veröffentlichen.
