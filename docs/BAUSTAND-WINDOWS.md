# Windows-Bau von Private Brain Pro

Auftrag von Klaus am 23.10.2026: V28 prüfen, Fehler beheben, eine zusätzliche
Windows-Version bauen. Tauri 2/WebView2 und unsigniertes NSIS-Setup pro Benutzer
wie bei Workflow PDF Pro. Dieser Eintrag ist Bauplanung, noch kein fertiger Installer.

## Ausgangspunkt und erneute Prüfung von V28

Veröffentlicht: `v1.0.0-preview.28`, Quelle
`8dae28113f7fa19a4446406f492e0c307c4ef0cb`. Öffentliche APK unabhängig geladen:
7.446.584 Bytes, SHA-256
`a8a4de0e884c2849257b8c10895d9c2dd9199d6b453bc24a588c6b92d424a647`.
SHA256SUMS, ZIP-Integrität und APK-v2-Signatur bestätigt; Zertifikat entspricht
unverändert `362ee70d28da9c4b51e37057c3519a3e6eb2c679059dfb9f56b4003f9374fa80`.
Paket `de.familyprojekt.privatebrain.pro.preview`, VersionCode 28, versionName
`1.0.0-preview.28`, compile/target SDK 36. Explorer-Prüfung, Mailordner, Werkzeuge
und Freischaltung der APK bytegleich mit dem veröffentlichten Quellstand verglichen.

PR #67 behebt falsche IndexedDB-Erfolgsmeldungen, verschluckte Importfehler und
vorzeitig als wiederhergestellt markierte Katalogeinträge. Ganze vorhandene
Browserkette, 28 native Browser-Skripte und 14 Maildienst-Tests lokal bestanden.
[CI 39860548123](https://github.com/lausiklauskn-png/Privat-Brain-Pro/actions/runs/39860548123)
ist vollständig grün: Firefox, WebKit, vollständige Web-/JVM-/Build-/Lintprüfung,
Android-Neustartprobe und native App-Prüfungen. Keine Abnahme auf Klaus' Tablet.

## Bauplan

1. Dieselbe lokal gebündelte Oberfläche und alle geschützten Module übernehmen;
   Tauri-Brücke für die vorhandenen zwölf Geräteplugins. Windows-spezifische
   Dialoge bleiben außerhalb der Hauptseite; Passwörter und Kontodaten werden nur
   im eigenen, getrennten Dialogfenster eingegeben.
2. Bewährten Mail-/Kryptografiekern wiederverwenden. Postfach-/MIME-Verhalten,
   Versandzustände und PBV1 sollen nicht durch unabhängige Neuimplementierungen
   auseinanderlaufen. Die Desktop-Laufzeit wird mitgeliefert, keine zusätzliche
   Installation beim Nutzer vorausgesetzt. Windows-Dateizugriff und DPAPI sind
   eigene Plattformadapter; keine Android-Keystore-Dateien übernehmen.
3. Echte Dateisystem-/Kryptografie-/Protokolltests und Android-Gegenproben; danach
   installierte Windows-App mit WebView2 prüfen: Import, Originale, Ordnerbaum,
   Postfach, Tresor, Offline-Schalter, Werkzeuge, Neustart und Neuinstallation.
4. Erst nach vollständiger Abnahme einen fertigen Installer behaupten. Eine
   veröffentlichte Android-Korrektur erhält eine neue Buildnummer; .28 niemals
   überschreiben. Vorgesehen ist die gemeinsame Folgelinie .29.

## Geräteverträge (alle zunächst offen)

| Plugin | Windows-Umsetzung/Nachweis |
|---|---|
| ProDevice | Windows und tatsächliche Version melden |
| ProFiles | geprüfte Originalkopien, Blockübergaben, Speichern/Öffnen, PDF-Seiten |
| ProFolders | ausdrückliche Ordnerwahl, kontrolliertes rekursives Lesen |
| ProVault | PBV1-kompatibler Ordner, Passwort, Merken über DPAPI, Migration/Sicherung |
| ProMail | alle Anbieterrollen und .28-Aktionen, direkte TLS-Verbindungen, keine unklaren Neuversände |
| ProLinks | registrierte externe Links nur ausdrücklich im Standardbrowser |
| ProNetwork | app-eigene Verbindungen sperren/abbrechen, lokale Arbeit erhalten |
| ProProtect | gleiche Listen-/Fingerprint-Verträge, sichere native Schlüssel, Windows-Scannerübergabe |
| ProSemantic | gepinnte Dateien laden/abbrechen/fortsetzen, Modell lokal/offline bereitstellen |
| ProSpeech | Windows-Spracherkennung prüfen, echte Verfügbarkeit und Grenzen benennen |
| ProShare | Öffnen mit/Zweitstart; keine nicht vorhandene Windows-Teilen-Zielregistrierung behaupten |
| ProUpdates | Windows-Kanal, geprüfter Release-Link, manuelle Installation |

Gmail verwendet den von Klaus bestätigten Desktop-OAuth-Client im bestehenden
Google-Projekt (`windows/gmail-desktop.json`, ausschließlich öffentliche ID).
Ein Empfänger benötigt keinen eigenen OAuth-Client, meldet sich aber mit seinem
eigenen Google-Konto an. Testnutzer-/Verifizierungsstand des Google-Projekts und
eine tatsächliche Google-Anmeldung sind noch zu prüfen. Keine Client-Secrets
oder Tokens im Repository. Microsoft bleibt wie in Androids V28 eine
benannte, noch nicht eingerichtete Anbieteranbindung.

## Grenzen und Freigaben

Noch kein Windows-Bau-/Installationsnachweis. Kein eigener PC beim Nutzer
vorausgesetzt. Keine Apple-Arbeiten oder kostenpflichtige Signierung.
Die Übernahme in main ist seit der automatischen Freigabeablehnung offen;
Entwürfe und Installer zuerst konkret fertigstellen, dann explizit freigeben.

## Tatsächlich implementierter Zwischenstand

`windows/engine/build.mjs` erzeugt den Desktop-Kern aus 17 vorhandenen
Android-Quelldateien, davon 11 bytegleich. Protokoll- und Kryptografiekern werden
nicht separat nachgebaut. Explizite Adapter ersetzen Android-Dateizugriff,
HTML-Textextraktion und Gerätespeicherung. Jede Quelldatei und das erzeugte
Ergebnis stehen mit SHA-256 im Baubeleg. Abhängigkeiten sind mit SHA-256 gepinnt.
Die Java-Laufzeit wird beim Windows-Bau mitgeliefert.

34 Prüfungen auf realen Dateien bestanden: verschlüsselte Gerätespeicherung mit
ausdrücklichem Testprovider, Erhalt bei Schreib-/Schutzfehlern, portable Ordner
zwischen zwei getrennten Geräten, falsches Passwort ohne Dateiänderung,
Originalwiederherstellung, beschädigte Sicherungen, PBV1-Blockgrenzen und AAD,
unklarer SMTP-Versand ohne Wiederholung nach Neustart, Abbruch echter Sockets,
PKCE/Loopback einschließlich falschem State, Gmail-Alias, Token-Erneuerung und
Abbruch. Dies ist noch kein Test von Windows-DPAPI oder echtem Google-Zugriff.

Tauri-Host mit privatem Kindprozessprotokoll, DPAPI-Adapter, getrenntem
Passwort-/Kontodialog und den vorhandenen Geräteverträgen ist angelegt.
Windows-CI baut zunächst einen klar benannten Prüfbau. Noch offen: native
Baufehler/Abnahme, fehlende Adapter (Ordner, PDF, Schutz, Modell, Sprache,
Teilen und Updates), vollständige Postfach-Gegenprobe, Herkunft/Framegrenzen,
Installer/Neustart/Neuinstallation und Auslieferungsbau ohne Prüfzugang.

Klaus' Menübefund ist für beide Pro-Plattformen korrigiert: kein zweiter
Pinnwand-Zugang; Werkzeuge freischalten zeigt eine senkrechte Liste mit ganzen
Namen und nur Schloss-Symbolen. 62 Werkzeugfälle bestanden, einschließlich
aller vier Sprachen und Breiten 320/360/1280/2560. Screenshots unter
`docs/design/werkzeuge/`. Im aktuellen Quellstand von Privat-Brain (reine PWA)
existiert der Freischaltkasten nicht. Die Darstellung stammt aus der gemeinsam
für Android und Windows gebündelten Pro-Oberfläche.
