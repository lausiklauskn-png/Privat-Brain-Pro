# Private Brain Pro — laufender Auftrag

Der Auftrag vom 25.10.2026 läuft weiter: Klaus verlangt eine öffentliche
Veröffentlichung als **1.0.36**, keine Probeversion mehr. Android und Windows
bekommen die Tags `v1.0.36` und `windows-v1.0.36`, ohne Prerelease-Kennzeichnung.
Android-VersionCode 36, bisherige Paketkennung und ursprünglicher Signierer
bleiben für die Aktualisierung vorhandener Installationen erhalten. Der technische
Paketbestandteil `.preview` benennt keine weitere Probeausgabe für den Nutzer.
Android .35 bleibt unverändert veröffentlicht; Windows wird von .29 aktualisiert.
Das Update vereinheitlicht Bild-/PDF-Miniaturen und Originalstatus in Suche,
Explorer und Kategorien anhand desselben Inhalts-Hashs. Eine Miniatur bestätigt
keinen Zugriff auf die vollständige Datei. App-Originale, verschlüsselter
Speicherordner und zusätzliche Ablagekopien bleiben getrennt zu prüfen.
Erst nach beiden tatsächlich geprüften öffentlichen Downloads abschließen.
Der bestehende Freibrief für Umsetzung, Merge und Veröffentlichung gilt weiter;
keine erneute Rückfrage und keine Umbenennung der technischen App-Identität.

- Android .35 ist veröffentlicht (25.10.2026): [Update-APK](https://github.com/lausiklauskn-png/Privat-Brain-Pro/releases/download/v1.0.0-preview.35/Private-Brain-Pro-1.0.0-preview.35.apk),
  VersionCode 35, Quelle `d5635b7af9614757b36e3157023d5b68008ddb7a`, PR #81 übernommen.
  Suchintro vollständig entfernt; lokale Bild-/PDF-Vorschauen, kompakte Typ-/Tag-/
  Pfadzeile und vollständiger Pfad per Hover/Fokus/Tippen. Wiederholte Herkunfts-
  und Fehlstatus entfallen; Schutz und tatsächliche Öffnungsverfügbarkeit bleiben.
  Maus/DeX behält bei allen Fensterbreiten und Orientierungen 32-Pixel-Steuerungen,
  Touch-only 44 Pixel. Zusätzliche Ablagekopien lassen sich im gespeicherten Ordner
  nach Zugriffsprüfung wieder einschalten; App-Originalkopien bleiben getrennt.
  Vorschauen verändern Originale und gespeicherten Suchtext nicht und starten keine OCR.
  Alle elf Prüfungen desselben main-Quellstands erfolgreich: Android `40170769470`,
  Windows `40170769501`, Signierung `40170769520`, Pages `40170769001`.
  60 native Fälle ohne Fehler/Skips, Job `121100956974`; Release `40171548476`
  mit signiertem Update .34 → .35, Seed/Baseline/Verify und Veröffentlichung erfolgreich.
  Öffentlicher Download unabhängig geprüft: 18.667.332 Bytes,
  SHA-256 `59f0c3793e8bb0f5c2920de9250562e2445f31a36515740ecd96887fae5d067b`.
  [Bedienung](docs/design/umbau-2026-10-24/ERGEBNISSE-35.md),
  [Download- und Quellnachweis](docs/design/umbau-2026-10-24/android-preview35-pruefung.json).
  Veröffentlichung erledigt; nicht erneut auslösen. Physisches Samsung DeX/Tab S6
  und reale Reaktionszeiten bleiben ungemessen; Windows-Download bleibt .29.
  Der vorhandene Freibrief gilt weiter; keine erneute Merge-/Release-Freigabe verlangen.

- Android .34 ist veröffentlicht (24.10.2026): [Update-APK](https://github.com/lausiklauskn-png/Privat-Brain-Pro/releases/download/v1.0.0-preview.34/Private-Brain-Pro-1.0.0-preview.34.apk),
  VersionCode 34, Quelle `1fe0f684ec3b6c7e645c55387ec698f8e96204fb`, PR #80 übernommen.
  Kompakte Suche mit einem Bedeutungsschalter, sieben direkte Hauptwege,
  Farbpalette und Sprachcode; echte Einstellungen stehen vor gewöhnlichen
  Erklärungen hinter Linien-i. Flachere Maus-/DeX-Steuerungen, 44-Pixel-Ziele für
  Touch/Hochformat, kompakte Importhilfe und ein gemeinsames Sortiermenü.
  Android ab Version 10 kann nach neuer Ordnerfreigabe, SHA-256-Inhaltsprüfung und
  konkreter Bestätigung Dateikopien bereinigen; mindestens eine unmittelbar erneut
  geprüfte Kopie bleibt erhalten. Katalogverweise und App-Originalkopien bleiben
  getrennt. Der physische Löschweg fehlt unter Windows.
  Vier Werkzeugzugänge hinter der vorhandenen Freigabe: natives Workflow PDF Pro mit festem Paket
  und ausdrücklichem Installationsweg, Kim-Sync, Datei-Post und BookLedgerPro im Browser.
  Menüsperre schützt App-Zugänge, keine externen Programme/Webseiten. Studio-AES/
  Schnorr unverändert; öffentlicher Herausgeber-Schlüssel fehlt weiterhin,
  Käufergerätefreischaltung offen. Externe HTTPS-Proben waren durch Netzrichtlinie
  blockiert; keine aktuelle Erreichbarkeit behaupten. Lokale OCR aus .33 bleibt
  enthalten; V3-Repo und geschützte Module bleiben erhalten.
  Alle elf main-Prüfungen erfolgreich: Android `40141502607`, Windows
  `40141502613`, Signierung `40141502616`, Pages `40141502059`.
  60 native Fälle ohne Fehler/Skips, nativer Job `121014024355`.
  Release `40142276521` erfolgreich; signiertes Update .33 → .34 mit Seed/Baseline/Verify
  bestanden. Öffentlicher Download unabhängig geprüft: 18.655.798 Bytes,
  SHA-256 `0c71eb60fd5a5a607189df2adeb7fdde1c616617a19315b6da3c1e164cfda0b6`.
  [Bedienung](docs/design/umbau-2026-10-24/SUCHE-34.md), [Werkzeuggrenzen](docs/design/umbau-2026-10-24/WERKZEUGE-34.md),
  [Download- und Quellnachweis](docs/design/umbau-2026-10-24/android-preview34-pruefung.json).
  Veröffentlichung erledigt; nicht erneut auslösen. Physisches Samsung DeX/Tab S6
  und reale Reaktionszeiten sind nicht gemessen. Windows-Download bleibt .29.
  Der dokumentierte Freibrief für die beauftragte Umsetzung gilt weiterhin;
  keine neue Merge-/Release-Freigabe verlangen.

- Android .33 ist veröffentlicht (24.10.2026): [Update-APK](https://github.com/lausiklauskn-png/Privat-Brain-Pro/releases/download/v1.0.0-preview.33/Private-Brain-Pro-1.0.0-preview.33.apk),
  VersionCode 33, Quelle `457b20e08193a8383761ab2542dcd145f6f34b56`, PR #79 übernommen.
  Echte lokale OCR mit Tesseract.js 7.0.0 und DE/EN/RU/PL für Bilder/Scan-PDFs,
  Suche und Prüfung; kyrillische Stichwortsuche und bewusstes „Erneut prüfen“
  vorhandener Originale. Keine stille Cloudübertragung oder Massen-Neuindizierung.
  Unsichere, ungelesene oder abgebrochene Bereiche bleiben teilweise/ungeprüft.
  [Bedienung](docs/NATIVE-TEXTERKENNUNG.md), [Umfang](docs/design/umbau-2026-10-24/TEXTERKENNUNG-33.md).
  Android-main `40121619660` (Versuch 2), Windows `40121619637`, Signierung
  `40121619642` und Pages `40121619198` erfolgreich; alle elf main-Prüfungen grün.
  56 native Tests ohne Fehler/Skips auf main, darunter echte OCR mit beiden
  gesperrten Netzwerkladewegen. Firefox-Paketinstallation benötigte einen
  einzelnen Job-Neustart; der native Testjob `120954221526` bestand in Versuch 1.
  Release `40123045873` vollständig erfolgreich, signiertes Update .32 → .33
  mit Seed/Baseline/Verify bestanden. Öffentlicher Download unabhängig geprüft:
  18.618.467 Bytes, SHA-256 `56020cf2e362d1b575ebd7472b9d9d10af5a1330b03b8390c3378e1534e3e5ab`.
  39 OCR-Dateien (26.315.914 Bytes) gegen Pins, 29 Lizenztexte, 27 native Dateien,
  drei Mail-/Explorerressourcen und 22 Kanon-Module gegen Quelle geprüft;
  OCR-Verdrahtung und Unicode-Suchaufteilung bestätigt.
  [Nachweis](docs/design/umbau-2026-10-24/android-preview33-pruefung.json).
  Veröffentlichung erledigt; nicht erneut auslösen. Physisches Samsung DeX/Tab S6
  und dessen Reaktionszeiten sind nicht gemessen. Windows-Download bleibt .29.
  Der dokumentierte Freibrief gilt; keine erneute Merge-/Release-Freigabe für
  bereits beauftragte Umsetzung verlangen.

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
- Android ist bei `1.0.0-preview.35`, Code 35 veröffentlicht; die Windows-Ausgabe
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
