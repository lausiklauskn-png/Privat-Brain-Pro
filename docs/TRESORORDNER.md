# Tresorordner in Private Brain Pro (Schritt D2, Klaus 2026-10-27)

Der gemeinsame Ordner aller Pro-Apps (Private Brain Pro, Workflow PDF Pro, BookLedgerPro) mit **einem Passwort** und **einem
Ersatzschlüssel**. Die Ordnerschicht ist das Paket `de.familyprojekt.tresor`, gepflegt in **Workflow PDF Pro** (Format und Regeln:
`Workflow-PDF-Pro/docs/TRESORORDNER.md`), hier byte-gleich kopiert: `node tools/native/tresor-nachziehen.mjs --quelle ../workflow-pdf-pro`
(Pins in `native/tresor-herkunft.json`, nie von Hand ändern; die Prüfung läuft am Anfang von `npm run test:native-web`).

## Was die App damit tut

| | Wo | Wie |
|---|---|---|
| Einziehen | Einstellungen → Kasten **„Speicherort und Verschlüsselung“** → Abschnitt „Gemeinsamer Tresorordner“ (nur bei entsperrtem Speicherort) | **„In den Tresorordner einziehen …“** → Androids Ordnerwahl → gewählt wird die Ebene **über** „Private Brain“. Passt nur, wenn darin genau dieser Tresor liegt (gleiche Kennung in `Private Brain/tresor.json`) — eine Kopie also auch. Dann das Passwort **im Android-Fenster** (anlegen oder öffnen), `fachEinziehen("private-brain", Datenschlüssel)`. |
| Probe | Dateien-App | Ordner „Private Brain“ in einen neuen Ordner „Tresor-Probe“ **kopieren**, dort einziehen, mit BookLedgerPro öffnen. Private Brain Pro schreibt dabei weiter in den echten Ordner. |
| Rückweg | Dateien-App | `tresorordner.json` und `Tresorordner/` neben „Private Brain“ löschen (und ggf. `Eingang-BookLedgerPro/`) = Ausgangszustand. „Private Brain/“ wird nie angefasst. |
| Inhaltsverzeichnis | automatisch | aus dem Katalog: Name, Art, Datum, Größe, SHA-256 (wenn der Katalog ihn als Kennung hat), Pfad, **Kurzfassung ≤ 1000 Zeichen** (nie der ganze Mailtext), `verschluesselung: "app"` — die Dateien bleiben in Private Brains eigenem Format (HMAC-Namen), andere Apps zeigen nur die Zeile. Geschrieben nach dem Einzug, auf Knopfdruck und beim Verlassen der App (höchstens alle 2 Minuten), nur bei einer Änderung. |
| Rechnungsmails | Mail → „An BookLedgerPro teilen“ | Ist der Tresorordner offen und passt: Frage **„In den Tresorordner legen“** / „Teilen …“. Die `.eml` holt Android selbst vom Server/Speicher (`ProMail.tresorMailAblegen`) und legt sie verschlüsselt im gemeinsamen Format nach `Eingang-BookLedgerPro/Mails/`; BookLedgerPro sieht sie dort im Eingang und übernimmt sie mit Marke (die Datei bleibt). Ohne Tresorordner: wie bisher Androids Teilen-Liste. |

Teile: `TresorEinzug.java` (rein, JVM-Probe), `ProTresorordner.java` (Freigabe, Android-Schlüsselspeicher, ein Exemplar für beide
Plugins), `ProVaultPlugin` (`tresorZustand`, `tresorEinziehen`, `tresorVerzeichnis`, `tresorSperren`, Passwort-Fenster),
`ProMailPlugin.tresorMailAblegen`, `Vault.tresorId()/tresorSchluessel()` (Kopie, nur nativ), `native/native-tresorordner.js`,
`native-mail.js` (`shareBookLedger`), eine Zeile in `assets/live-mail.js` (Cache `private-brain-v93`). Schutzmodule (Drift-Guard) unverändert.

## Proben (gemessen 2026-10-27 im Behälter)

```bash
node tools/native/tresor-nachziehen.mjs        # Paket byte-gleich mit Workflow PDF Pro 5009c95
# JVM ohne Gradle (CI: testDebugUnitTest): TresorEinzugTest 4 grün (LANG=C.UTF-8 wegen „Anhänge“)
CB_CHROMIUM=… node tools/native/test-tresorordner.mjs                  # 21 grün
TRESOR_JARS=… CB_CHROMIUM=… node tools/native/gegenprobe-tresorordner.mjs   # 12 gefangen · 0 durchgerutscht · 2 Kontrollen grün
```

Erste Gegenprobe: 11 gefangen, 1 durchgerutscht („Hintergrund schreibt in fremden Ordner“ — die Browser-Probe prüfte den
Hintergrund nicht); Probe ergänzt, danach gefangen. Unverändert grün: `drift-guard` 22 · `test-web` 126 · `test-mail-device` 81 ·
`test-vault` 34 · `test-share` 12 · `test-design-26` 71 · `e2e-live-mail` 37.

## Grenzen (benannt)

- Das Android-Plugin ist hier nicht übersetzt (kein SDK) — gebaut und gelintet in GitHub, **nicht im Emulator, nicht am Tablet, nicht
  an Klaus' SD-Karte**. `www/` entstand ohne OCR-Beschaffung (Netz gesperrt), die übrigen Dateien von Hand nachgelegt.
- Windows: kein Einzug (die Engine übersetzt eine feste Liste ohne das Paket; Windows-Sitzung). PWA: bewusst ohne Tresorordner.
- Das Inhaltsverzeichnis geht als eine Nachricht über die Brücke; bei sehr großem Katalog (Zehntausende Mails) ungemessen langsam.
- Eine zweimal abgelegte Mail ist zweimal im Eingang (nie löschen); BookLedgerPro erkennt Doppel am SHA-256.
