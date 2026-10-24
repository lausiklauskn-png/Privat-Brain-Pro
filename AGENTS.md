# Private Brain Pro — laufender Auftrag

- Fortsetzung für Android .33 (24.10.2026): Klaus meldet fehlende Texterkennung
  in Bildern und eingescannten Seiten. Echte lokale OCR mitliefern und in
  Suche und Prüfung einbinden; DE/EN/RU/PL einschließlich kyrillischer Suche.
  Keine Cloudübertragung als stillen Ersatz. Originalbytes erhalten, unlesbare
  oder nur teilweise gelesene Seiten ehrlich kennzeichnen, langsame Geräte und
  Abbruch berücksichtigen. Umsetzung und echte Offlineprüfungen sind in Arbeit;
  .32 ist der aktuelle veröffentlichte Download. Bestehender Freibrief gilt für
  vollständige Prüfung, Merge und signiertes Update .32 → .33.

- Android .32 ist veröffentlicht: [Update-APK](https://github.com/lausiklauskn-png/Privat-Brain-Pro/releases/download/v1.0.0-preview.32/Private-Brain-Pro-1.0.0-preview.32.apk), VersionCode 32,
  Quelle `a4a2cd69a3caa7ad3c1a9eb332c7137504eb4608`, übernommener PR #78.
  Einheitliche sichtbare Liniensymbole, Briefsymbol neben Betreff, verstellbare
  Datei-/Mailbereiche, Info-Erklärungen, sofortige Wartepunkte und getrennte
  native Warteschlange für Öffnen/Teilen. [Bedienung](docs/design/umbau-2026-10-24/NACHBESSERUNGEN-32.md).
  Main Android `40116256712`, Windows `40116256687`, Signierung `40116256695`
  und Release `40117059939` vollständig grün. 55 native Tests ohne Fehler/Skips,
  einschließlich unabhängiger Teilen-Warteschlange mit echter Dateiprüfung.
  Signiertes Update .31 → .32 bestanden; öffentliche APK unabhängig geladen:
  7.529.379 Bytes, SHA-256 `632aada11ed73f61618e737c3743768b2d4884c762ab1ea7f384c5e305c747b5`.
  24 gepackte UI-/Worker-/Lizenzdateien und zwei Explorer-/Mailressourcen bytegleich,
  Modulverdrahtung, Modellpins und native Warteschlange geprüft.
  [Nachweis](docs/design/umbau-2026-10-24/android-preview32-pruefung.json).
  Nicht dieselbe Version erneut veröffentlichen. Physisches Samsung DeX/Tab S6
  ist weiterhin nicht geprüft; Windows bleibt als Download bei .29.

- Android .31 ist veröffentlicht: [Update-APK](https://github.com/lausiklauskn-png/Privat-Brain-Pro/releases/download/v1.0.0-preview.31/Private-Brain-Pro-1.0.0-preview.31.apk), VersionCode 31,
  Quelle `5c3cd2115a5abbf3d5daa50b126182f4d360001d`, übernommener PR #77.
  Main Android `40106803209`, Windows `40106803287`, Signierung `40106803132`
  und Release `40107514450` vollständig grün; 54 native Tests ohne Fehler/Skips,
  echte automatische Offlineübersetzung und signiertes Update .30 → .31 bestanden.
  Öffentliche APK unabhängig geladen: 7.512.142 Bytes, SHA-256
  `ba0f5a9bab788c1aac1b209f550811b00bb8bf86746791643e291f813bbd56b7`. Elf gepackte UI-/Worker-/Lizenzdateien und Modellpins bytegleich,
  nativer Übersetzungsadapter im DEX. [Nachweis](docs/design/umbau-2026-10-24/android-preview31-pruefung.json).
  Nicht dieselbe Version erneut veröffentlichen. Physisches Samsung DeX/Tablet
  ist weiterhin nicht geprüft; Windows bleibt als Download bei .29.

- Ergänzung im selben Chat am 24.10.2026: Samsung Galaxy DeX (Android, nicht
  Windows), automatische Handy-/Tablet-Hochformatansicht, unabhängige Such- und
  Diktatsprache, Mikrofone an Texteingaben und automatische Mailübersetzung
  unter dem Original. Lokales kleines Übersetzungsmodell bevorzugt prüfen;
  DE/EN/RU/PL, vorhandene Anonymisierung und bewusst wählbare KI-Alternativen
  beibehalten. [Auftrag, Befunde und Prüfstand](docs/design/umbau-2026-10-24/ERWEITERUNGEN-NATIVE-BEDIENUNG.md).
  Diese Arbeiten sind in PR #77 übernommen und als .31 veröffentlicht (oben).
  Die erledigte Veröffentlichung nicht erneut auslösen. Der Freibrief für die
  beauftragte Umsetzung bleibt dokumentiert.

- Fortsetzung 24.10.2026: Klaus beauftragt die eigenständige Weiterarbeit ohne
  weitere Rückfragen. Nächster abgegrenzter Schritt für Android .31: Original-
  verfügbarkeit und historischen Prüfstand getrennt zeigen, Mailtext-Prüfumfang
  und ungespeicherte Berichte ehrlich benennen. Kein automatisches Laden von
  Originalen/Anhängen durch die Anzeige. [Umfang](docs/design/umbau-2026-10-24/STATUS-ORIGINALE-PRUEFUNG.md).
  In .31 veröffentlicht; Nachweise oben. Vorhandene Release-Dateien nicht überschreiben.

- Neuer ausdrücklicher Freibrief von Klaus am 24.10.2026 in diesem Chat:
  den eigenständigen Designumbau umsetzen, nötige PRs und Commits selbstständig
  übernehmen, das Repo aktualisieren und die native Android-App als signierte
  Update-APK mit direktem Download veröffentlichen. Keine erneute Merge- oder
  Release-Freigabe verlangen. Paketkennung und ursprüngliche Signatur erhalten;
  vor Veröffentlichung Prüfungen und Updateprobe bestehen lassen. Die vier positiv
  bewerteten Designrichtungen bleiben Grundlage; Outlook ist Anregung, keine Kopie.
  Gemeinsame UI-Änderungen auch für Windows prüfen.
- Zuvor wurde Android .30 veröffentlicht: `v1.0.0-preview.30`, VersionCode 30, Quelle
  `a81d33ba2048ff6ea646a79f7a311c1e9661e1b7`; Release-Lauf `40094110986` grün,
  einschließlich ursprünglicher Signatur und Update .28 → .30. Android-/Web-main
  `40093195380`, Windows-main `40093195384` und Signierung `40093195392` grün.
  Öffentliche APK unabhängig geladen und SHA-256 bestätigt:
  `15f75701de03e3c70fb65132ec7c0e029e09266efe7c0eb988b4f4ab99dd1b88`.
  Die Veröffentlichung ist erledigt; nicht dieselbe Version erneut veröffentlichen.

- Windows ist veröffentlicht: `windows-v1.0.0-preview.29`, Quelle
  `7e6fbfd821c6c105661ff638045f6b41e1ffb75b`, erfolgreicher Release 39920396303.
  Windows-main-Abnahme 39918739441 und Android-main-Abnahme 39918739332 grün.
  Öffentlicher Installer unabhängig geladen und SHA-256 bestätigt:
  `55d5728a4623e079ac0303442c6ff94fe77c35621f1c935c0342d1cfeab52e97`.
  `docs/GESCHENKPAKET-WINDOWS.md` ist die Übergabe an Claude Code. Das zusätzliche
  ZIP wird über `windows-gift-package.yml` an denselben Release angehängt; der
  direkte Upload aus der Codex-Umgebung erhält bei uploads.github.com HTTP 401.
  Keine Zugangsdaten auslesen oder anfordern; die vorhandene Actions-Berechtigung
  benutzen. Der veröffentlichte Installer wird dabei nicht verändert/überschrieben.
- Neue ausdrückliche Freigabe von Klaus am 23.10.2026: PR #69 für die Windows-
  Version übernehmen und veröffentlichen, einschließlich notwendiger gemeinsamer
  Korrekturen aus #67. Feste öffentliche Downloads und eine Übergabe für Claude
  Code zum Geschenkpaket bereitstellen. Keine erneute Merge-/Release-Freigabe
  dafür verlangen. Andere Repositories und Android-Releases sind damit nicht
  zusätzlich zur Veröffentlichung freigegeben.
- Klaus hat am 23.10.2026 ausdrücklich beauftragt: veröffentlichte V28 erneut in
  die Qualitätsprüfung einbeziehen, geprüfte Fehler beheben und zusätzlich eine
  Windows-Version bauen. Selbstständig umsetzen; keine neue Grundsatzfreigabe
  für den Windows-Bau verlangen. Es soll Android und Windows geben.
- Zuerst `CLAUDE.md`, `BRIEF_NACHFOLGE_2026-10-22_WINDOWS.md` und
  `docs/BAUSTAND-WINDOWS.md` lesen. Der ursprüngliche Windows-Brief ist der Plan;
  der aktuelle Nutzerauftrag gibt dessen Umsetzung frei.
- Ausgangspunkt V28: `8dae28113f7fa19a4446406f492e0c307c4ef0cb`, veröffentlichte
  Version `1.0.0-preview.28`, VersionCode 28. Qualitätskorrekturen aus PR #67:
  zuletzt `fbc7f2d` (zusätzlich wartender Dateiimport); vorheriger Stand `36e043c`
  mit gesamter Android-/Engine-CI 39875720508 grün. Windows enthält diese Korrekturen.
- Gleiche App-Oberfläche, unveränderte geschützte Module und dieselben Mail-/Tresor-
  Verträge. Tauri 2/WebView2, NSIS pro Benutzer, unsigniert wie Workflow PDF Pro.
  Keine fremden Schlüssel oder Identitäten übernehmen; Android-Identität erhalten.
- Android ist bei `1.0.0-preview.32`, Code 32 veröffentlicht; die Windows-Ausgabe
  bleibt bei `.29`. Originale Android-Identität unverändert. Der finale
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
- Historisch: Die automatische Freigabeprüfung hat die versuchte Übernahme des geprüften
  PWA-PRs #123 im Nachbarrepo Privat-Brain in main abgelehnt, weil keine explizite
  Merge-Freigabe vorliegt. Nicht umgehen. Code, Tests, Entwurf-PRs und Windows-
  Installer vollständig vorbereiten; konkrete Übernahmen/Veröffentlichungen
  danach mit Klaus freigeben. Für den Windows-Gesamtstand #69 liegt diese Freigabe
  jetzt vor (oben). Kein Release allein durch Versions-Tag auslösen.
- Bestehenden Checkout weiterverwenden; im verwalteten Arbeitsraum heißt der
  Branch `work`. Keine Änderungen verwerfen; keine Worktrees ohne Auftrag.
