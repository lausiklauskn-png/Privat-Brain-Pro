# Private Brain Pro — laufender Auftrag

- Klaus hat am 23.10.2026 ausdrücklich beauftragt: veröffentlichte V28 erneut in
  die Qualitätsprüfung einbeziehen, geprüfte Fehler beheben und zusätzlich eine
  Windows-Version bauen. Selbstständig umsetzen; keine neue Grundsatzfreigabe
  für den Windows-Bau verlangen. Es soll Android und Windows geben.
- Zuerst `CLAUDE.md`, `BRIEF_NACHFOLGE_2026-10-22_WINDOWS.md` und
  `docs/BAUSTAND-WINDOWS.md` lesen. Der ursprüngliche Windows-Brief ist der Plan;
  der aktuelle Nutzerauftrag gibt dessen Umsetzung frei.
- Ausgangspunkt V28: `8dae28113f7fa19a4446406f492e0c307c4ef0cb`, veröffentlichte
  Version `1.0.0-preview.28`, VersionCode 28. Qualitätskorrekturen aus PR #67:
  `fe0fdd401196b5c004c3258abfcac25f3dc14cd8`; dessen gesamte Android-/Engine-CI
  39860548123 ist grün. Windows baut auf diesem korrigierten Stand auf.
- Gleiche App-Oberfläche, unveränderte geschützte Module und dieselben Mail-/Tresor-
  Verträge. Tauri 2/WebView2, NSIS pro Benutzer, unsigniert wie Workflow PDF Pro.
  Keine fremden Schlüssel oder Identitäten übernehmen; Android-Identität erhalten.
- Aktueller Quellstand für Android und Windows: `1.0.0-preview.29`, Android-Code
  29; noch unveröffentlicht. Originale Android-Identität unverändert. Der finale
  Windows-Bau muss ohne `messprobe` entstehen und installiert geprüft werden.
- Geschützte Kanon-Module bleiben bytegleich; `node tools/drift-guard.mjs` muss
  grün bleiben. `native/*.js` sind gemeinsam: Android bei Änderungen mitprüfen.
- Kein eigener Windows-Bau-PC bei Klaus voraussetzen. GitHub-Windows-Runner ist
  der Bau-/Prüfrechner, kein Nachweis auf Klaus' Hardware. Kein fertiges Produkt
  behaupten, bevor native Adapter und installierte App geprüft sind.
- Unklare SMTP-Ergebnisse niemals automatisch wiederholen. Kein stiller Reset,
  kein Erfolg vor abgeschlossenem Schreiben. Passwörter nur im nativen Dialog;
  keine Plattform-Zugangsdaten auslesen oder übertragen. Kostenpflichtige Konten
  und Zertifikate sind nicht beauftragt.
- iOS von Workflow PDF Pro ist als Vorbereitung für später zurückgestellt:
  kein Apple-Gerät, derzeit keine jährliche Mitgliedschaft. Keinen Private-Brain-
  iOS-Nachfolgebrief vor dessen vollständigem Abschluss erstellen.
- Die automatische Freigabeprüfung hat die versuchte Übernahme des geprüften
  PWA-PRs #123 im Nachbarrepo Privat-Brain in main abgelehnt, weil keine explizite
  Merge-Freigabe vorliegt. Nicht umgehen. Code, Tests, Entwurf-PRs und Windows-
  Installer vollständig vorbereiten; konkrete Übernahmen/Veröffentlichungen
  danach mit Klaus freigeben. Kein Release allein durch Versions-Tag auslösen.
- Bestehenden Checkout und Branch `codex/windows-native-host` verwenden.
  Keine Änderungen verwerfen; keine Worktrees ohne ausdrücklichen Auftrag.
