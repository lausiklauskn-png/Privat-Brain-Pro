# Private Brain Pro — Sitzungs-Anker

**Übergabe 2026-10-23:** Geschenkbox für Jens nur noch mit Private Brain Pro und Workflow PDF Pro (Android + Windows,
ohne iOS/PWA), `https://claude.ai/artifact/XPEQpCH7axafiTRB7y1RB7`, Quelle `docs/geschenk/geschenk-jens.html`. Private Brain
Pro Windows **1.0.29 veröffentlicht** (`windows-v1.0.0-preview.29`, Lauf 39920396303, Setup.exe SHA-256 `55d5728a…eab52e97`,
unabhängig geprüft). Desktop-OAuth-Client
„Private Brain Pro Windows“ im Projekt `privat-brain-pro` angelegt. [Brief](BRIEF_UEBERGABE_2026-10-23_GESCHENK.md).

**Windows-Freigabe 23.10.2026:** Klaus beauftragt die Übernahme von PR #69 mit
allen nötigen Voraussetzungen und die Veröffentlichung zum Herunterladen für
ein Geschenkpaket durch Claude Code. #69 enthält die gemeinsamen Korrekturen
aus #67. Windows- und Android-Abnahme auf `079433d` vollständig grün
(39885843960 / 39885843963). Anleitung und feste Downloadpfade:
[Geschenkpaket für Windows](docs/GESCHENKPAKET-WINDOWS.md). Die Veröffentlichung
verlangt erneut beide grünen main-Ketten; kein Android-Release zusätzlich auslösen.

**Aktueller Auftrag 23.10.2026:** Klaus beauftragt die erneute Prüfung der
veröffentlichten V28, Fehlerkorrekturen und eine zusätzliche Windows-Version.
`AGENTS.md` und `docs/BAUSTAND-WINDOWS.md` sind der aktuelle Anker. Die Windows-
Erweiterung baut auf der veröffentlichten V28 mit den geprüften Korrekturen auf.

**Vorschau .28 veröffentlicht (2026-10-22), in der App „v1.0.28“.** [APK .28](https://github.com/lausiklauskn-png/Privat-Brain-Pro/releases/download/v1.0.0-preview.28/Private-Brain-Pro-1.0.0-preview.28.apk) über die vorhandene App installieren; daneben `.aab`.
PR #66, VersionCode 28, Tag `v1.0.0-preview.28`, Quelle main `8dae28113f7fa19a4446406f492e0c307c4ef0cb` (Main-CI 39857714825: native-smoke grün). Release-Lauf 39859560733: Signatur, Updateprobe .27 → .28, Veröffentlichung.
APK SHA-256 `a8a4de0e…d424a647` (7.446.584 Bytes), AAB `dcd69685…6055641b9` (7.267.253 Bytes), unabhängig geladen, gleich SHA256SUMS.
Geschenk- und Updateseite auf .28 umgestellt. Tablet nicht gemessen.

**Inhalt .28 (Klaus 2026-10-22):** Explorer als echter Ordnerbaum (E-Mails › Absender ›
Mail › Anhänge, jede Datei einmal; Handy eine Ebene mit Pfad, breit Baum ▸/▾ mit ⊟), ehrlicher Prüfstand („⊘ Original
fehlt · nicht prüfbar“, Zeile über alle Dateien, „Originale suchen“), Prüfbericht in einfachen Worten. Mail: Löschen in
den Papierkorb des Anbieters, ♻ Wiederherstellen, ✓ Kein Spam, Spam in den Spam-Ordner, Zahlen vom Server (STATUS),
Anbieter-Ordner unter „▸ Weitere Ordner“ (`MailEngine.moveTo`, Java nur in CI gebaut). ☰-Menü mit eigenen App-Symbolen
(`native/tool-icons/`). Freischalt-Kasten schlicht; **Herausgeber-Studio erst nach langem Druck (1,5 s) auf „© 2026“
unten in den Einstellungen**, wie bei den anderen Studios; Käuferfeld „Pseudonym“. Version **v1.0.28** klein neben dem Namen (`versionName` 1.0.0-preview.28,
Code 28). [Ordnerbaum/Prüfstand/Papierkorb](docs/ORDNERBAUM-PRUEFSTAND-PAPIERKORB.md),
[Werkzeuge](docs/WERKZEUGE-UND-FREISCHALTUNG.md).

**Vorschau .27 veröffentlicht (2026-10-22).** [APK .27](https://github.com/lausiklauskn-png/Privat-Brain-Pro/releases/download/v0.1.0-preview.27/Private-Brain-Pro-0.1.0-preview.27.apk) über die vorhandene App installieren; daneben `.aab`.
PR #64, VersionCode 27, Quelle main `7530505d08f8409498972061e4a66295993340ad` (Main-CI 39807480053 Versuch 2 grün inkl. native-smoke; Versuch 1 hing in „Browser-Engine installieren“ für WebKit). Release-Lauf 39818777974: Signatur, Updateprobe .26 → .27, Veröffentlichung.
APK SHA-256 `8011f622…5bc52a9c` (7.375.750 Bytes), AAB `dde15fd6…00744481b` (7.195.337 Bytes), gleich SHA256SUMS.
Enthält: 🧠 Passwort-Probe und 🧩 Ersatzschlüssel fürs Studio. Tablet nicht gemessen. Lehre: ein Neustart der Main-CI setzt
`native-smoke` zurück, der Release-Gate verlangt es grün; erst nach dem Neustart-Lauf veröffentlichen.
Geschenkseite für Jens mit allen Apps: `https://claude.ai/artifact/XPEQpCH7axafiTRB7y1RB7`. Nächste Sitzung: [Windows](BRIEF_NACHFOLGE_2026-10-22_WINDOWS.md).

**Vorschau .26 veröffentlicht (2026-10-22).** [APK .26](https://github.com/lausiklauskn-png/Privat-Brain-Pro/releases/download/v0.1.0-preview.26/Private-Brain-Pro-0.1.0-preview.26.apk) über die vorhandene App installieren; daneben `.aab`.
PR #63, VersionCode 26, Quelle main `e21b286ff9773580505fd4665f7405ede67a6855` (Main-CI 39801158046 grün inkl. native-smoke). Release-Lauf 39803351849: Signatur, Updateprobe .25 → .26, Veröffentlichung.
APK SHA-256 `824497dd…af4de30b` (7.372.114 Bytes), AAB `24757fe7…dd937c4ca` (7.191.695 Bytes), gleich SHA256SUMS.
Enthält: ☰ Werkzeuge (Pinnwand, Such-Tool), Freischalt-Codes mit Herausgeber-Studio, neues hellgraues Logo. Tablet nicht gemessen.

**🧠 Passwort-Probe und 🧩 Ersatzschlüssel fürs Studio (Klaus 2026-10-22, für .27):** etwa alle 28 Tage fragt die App
auf Klaus' Gerät nach dem Studio-Passwort (nur prüfen, nichts ins Netz); „Jetzt zur Probe eingeben“ im Studio. Der
Studio-Schlüssel lässt sich in 5 Teile `JT3v5-…` teilen (JasonLib), 3 holen ihn mit neuem Passwort zurück, nur passend
zum vorhandenen Schlüssel. Klaus' Termux-Tresore (`pbpro-`/`wfpdf-freigabe-neu.age`, age -p, neu verschlüsselt
2026-10-22, offene Kopien entfernt) bewahren `PB_SIGNING_UNLOCK`/`WF_PDF_SIGNING_UNLOCK`; nie neu erzeugen.
[Details](docs/WERKZEUGE-UND-FREISCHALTUNG.md#herausgeber-studio-nur-klaus).

**Vorschau .25 veröffentlicht (2026-10-22).** [APK .25](https://github.com/lausiklauskn-png/Privat-Brain-Pro/releases/download/v0.1.0-preview.25/Private-Brain-Pro-0.1.0-preview.25.apk) über die vorhandene App installieren; daneben `.aab`.
PR #60–#62, VersionCode 25, Quelle main `edf76aa70d30a98ba5bbfdc327544dd7b2264378` (Main-CI grün inkl. native-smoke). Release-Lauf 39773902642: Signatur, Updateprobe .24 → .25, Veröffentlichung.
APK SHA-256 `09e37ee1…b985b4a735` (6.220.958 Bytes), AAB `b26970bb…58754e7d` (6.034.985 Bytes), gleich SHA256SUMS.
Enthält: Prüfung beim Hinzufügen mit Befund je Datei, Marken, „Alle prüfen“, Mail-Anhänge im Speicherort geprüft
(`native/native-check.js`), pdf.js unter `vendor/pdfjs/`, Explorer nach Art, Originale wiederfinden, 🎤 in Textfeldern,
Google-Vision-Knöpfe, Diagnose versteckt (7 Tipps auf die Versionszeile). Text in Bildern noch ungeprüft. Tablet nicht gemessen.

**Logo neu (Klaus 2026-10-22, für .26):** wie Workflow PDF Pro: außen hellgrau `#a3a6ad`, zur Mitte weicher heller
Verlauf, ohne gemalten Rahmen; 3D-Motiv unverändert. Vorlage `artwork/private-brain-pro-grey.png`, gebaut von
`tools/native/icon/make-pro-icon.py` aus `private-brain-pro-light.png`; Größen über `export-pro-icons.mjs`. Adaptives Icon:
Hintergrund `#a3a6ad`, Vordergrund `inset 13%`. Grenze: feiner heller Glasrand (1–2 px) um die Kugeln.

**🧰 Werkzeuge und 🔑 Freischalt-Codes (Klaus 2026-10-22, nach .25):** ☰ → Werkzeuge; Pinnwand (Kimboard) und Such-Tool
(Kimseek) laufen im App-Fenster, Dateien daraus gehen ins Einlesen. Freigabe je Käufer per signiertem Code aus dem
Herausgeber-Studio; Klaus' öffentlicher Schlüssel fehlt noch in `native/license-keys.json`. Tools nur über
`tools/native/vendor-apps.mjs` kopieren, nie in `apps/` von Hand ändern. [Details](docs/WERKZEUGE-UND-FREISCHALTUNG.md).

**Vorschau .24 veröffentlicht (2026-10-22).** [APK .24](https://github.com/lausiklauskn-png/Privat-Brain-Pro/releases/download/v0.1.0-preview.24/Private-Brain-Pro-0.1.0-preview.24.apk) über die vorhandene App installieren, nicht deinstallieren; daneben `.aab` für Google Play.
PR #58, VersionCode 24, Quelle main `18a2edc38c42b4562c169603437cc4e5e8dcec22` (Main-CI 39711900162 grün inkl. native-smoke). Release-Lauf 39714226568: Signatur, Updateprobe .23 → .24, Veröffentlichung.
APK SHA-256 `ac255ddd…caf8d21f` (5.791.582 Bytes), AAB `f10fe265…293548fe` (5.605.275 Bytes), beide gleich SHA256SUMS. Neu: Links „Mistral-/Google-Schlüssel holen“ neben dem KI-Schlüssel (`native/native-keys.js`). Tablet nicht gemessen.

**Klaus' Test .23 am Tablet (2026-10-22), Reparaturen für .24:** Modell laden klappt am Tablet. 🎤: die WebView meldet
`webkitSpeechRecognition`, verweigert es aber („Mikrofon nicht verfügbar oder abgelehnt“) → in der App immer Androids
Sprachfenster (`native-speech.js`). Mehrere Mails löschen/verschieben dauerte Minuten (je Mail eine Anmeldung) → ein
Aufruf, eine Verbindung (`MailEngine.actions`, Route `messages/batch/action`, je 200). „Bedeutungssuche“ führt, solange
das Modell fehlt, direkt zum Schalter in den Einstellungen. Gmail: „Löschen“ verschiebt in den Ordner mit `\\Trash`
(Gmails Papierkorb); ob Klaus' 50 Mails dort liegen, ist am Gerät noch zu sehen. Probe-IMAP-Server kann kein MOVE:
Sammel-Verschieben nur im Browser-Test geprüft.

**Vorschau .23 veröffentlicht (2026-10-21).** [APK .23](https://github.com/lausiklauskn-png/Privat-Brain-Pro/releases/download/v0.1.0-preview.23/Private-Brain-Pro-0.1.0-preview.23.apk) über die vorhandene App installieren, nicht deinstallieren; daneben `Private-Brain-Pro-0.1.0-preview.23.aab` für Google Play.
PR #56, VersionCode 23, Quelle main `8ee68c64ada630f63d7ca450be16faf265e87e2b` (Main-CI 39661901310 grün inkl. native-smoke mit echtem Modell-Download und Offline-Start). Release-Lauf 39664148878: Signatur, Updateprobe .22 → .23, Veröffentlichung.
APK SHA-256 `bc4d52ad…cf19be3` (5.788.208 Bytes), AAB `97aeddaa…1dda5192` (5.601.799 Bytes), beide gleich SHA256SUMS. Tablet nicht gemessen.

**Bedeutungs-Modell per Schalter, App Bundle (Klaus 2026-10-21, für .23):** Einstellungen → „🧠 Modell für die
Bedeutungssuche“ lädt ~155 MB nativ in den App-Speicher (zuerst `family-projekt.de/models/`, sonst Hugging Face;
Bibliothek jsDelivr/unpkg; jede Datei per SHA-256 aus `semantic-model.json`), Weitermachen nach Abbruch, Entfernen.
`SemanticModel`, `ProSemanticPlugin`, `native/native-semantic.js`; Modul 03 byte-1:1 über `/models/`. Endet die WebView,
öffnet die App neu und startet das Modell nicht von selbst wieder. Jeder Release trägt zusätzlich ein signiertes
App Bundle `.aab` (gleiches Zertifikat wie die APK, Paket `…pro.preview`) für Google Play.
[Details](docs/BEDEUTUNGSSUCHE-UND-LADEBALKEN.md#stand-für-23-laden-per-schalter-klaus-2026-10-21).

**🤖 KI beim Schreiben (Klaus 2026-10-21, für .23):** Im Schreiben-Fenster gegenlesen oder Entwurf schreiben lassen,
per Mistral-Schlüssel (EU) oder Kopieren fürs eigene Abo. Vorher verdeckt Modul 25 neuen Text, Zitat und Betreff, dazu
Namen aus An/Cc/Bcc und Zitatzeilen, Telefon mit Leerzeichen und alles, was Klaus festlegt (Liste, Vorschläge, markierter
Text). Vorschau „Das sieht die KI“, Halt bei KI-Anweisung, Rückweg mit Rückgängig. `native/native-mail-ai.js`.
[Details](docs/KI-BEIM-SCHREIBEN.md).

**Bedeutungs-Modell fest in der App, Ladebalken in Schritten (Klaus 2026-10-21, für .22):** Das Modell lud in der
Pro-App nie (CSP sperrte jsDelivr). Jetzt bringt der Bau e5-small (118 MB) und transformers.js 2.17.2 mit
(`tools/native/fetch-semantic-model.mjs`, Fingerabdrücke in `semantic-model.json`, auf GitHub streng);
`BundledLibrary` beantwortet Modul 03s jsDelivr-Adresse aus dem APK, Modul 03 bleibt byte-1:1. Einlesen zeigt den Stand
innerhalb einer Datei (`PBImportStep`). **In .22 noch aus** (`enabled: false`): im Emulator stürzte die App beim Laden des Modells ab; Lösung für .23. [Details](docs/BEDEUTUNGSSUCHE-UND-LADEBALKEN.md).

**Teilen an Private Brain Pro (Klaus 2026-10-21, für .22):** Die App steht in Androids Teilen-Liste
(`ACTION_SEND`/`SEND_MULTIPLE`, `ProSharePlugin`, `ShareInbox`, `native/native-share.js`). Geteilte Dateien gehen
durch denselben Import wie „Dateien hinzufügen“ (`signBatch`, 80 MB je Datei, Mail-Exporte bis 200 MB), Text ohne
Datei wird eine Textdatei. Nur `content://` der sendenden App. Tablet nicht gemessen. [Details](docs/TEILEN-EMPFANG.md).

**Vorschau .22 veröffentlicht (2026-10-21).** [APK .22](https://github.com/lausiklauskn-png/Privat-Brain-Pro/releases/download/v0.1.0-preview.22/Private-Brain-Pro-0.1.0-preview.22.apk) über die vorhandene App installieren, nicht deinstallieren.
Enthält PR #54 (Teilen, Ladebalken in Schritten, KI beim Schreiben), VersionCode 22, Quelle main `64046085730fa56992678e1c5091e2382f360465` (Main-CI 39640944240 grün inkl. native-smoke).
Release-Lauf 39643202428 erfolgreich: Signatur, Updateprobe .21 → .22, Veröffentlichung. Unabhängiger Download: SHA-256 `479abec09a686d9ec46231ec60ea21754054e4f301559b2d2a67aac4e5bd3fa5`, 5.774.747 Bytes, gleich SHA256SUMS.
Bedeutungs-Modell **nicht** enthalten (aus; für .23: Laden per Schalter aus der App, zuerst Klaus' Server, sonst Hugging Face, plus Absturz klären). Tablet nicht gemessen.

**Vorschau .21 veröffentlicht (2026-10-21).** [APK .21](https://github.com/lausiklauskn-png/Privat-Brain-Pro/releases/download/v0.1.0-preview.21/Private-Brain-Pro-0.1.0-preview.21.apk) über die vorhandene App installieren, nicht deinstallieren.
Enthält PR #53 (Newsletter abmelden, Internet-Lampe, Android-Spracheingabe, ein „Datei auswählen“), VersionCode 21, Quelle main `114989a05e37a7261fbd88a98a97fbdeea29686d` (Main-CI 39627948087 grün inkl. native-smoke).
Release-Lauf 39630287203 (workflow_dispatch, auf Klaus' Bitte) erfolgreich: Signatur, Updateprobe .20 → .21, Veröffentlichung.
Unabhängiger Download: SHA-256 `552fa8d53a026cc339ee1fb4074aaed04d611ae1d15008e333e329d770a98b38`, 5.759.643 Bytes, gleich SHA256SUMS. Teilen an Private Brain Pro **nicht** enthalten (.22). Tablet nicht gemessen.

**Vorschau .20 veröffentlicht (2026-10-21).** [APK .20](https://github.com/lausiklauskn-png/Privat-Brain-Pro/releases/download/v0.1.0-preview.20/Private-Brain-Pro-0.1.0-preview.20.apk) über die vorhandene App installieren, nicht deinstallieren.
Enthält PR #48–#52 (Alle Konten, Aufräumen, Explorer ↕/Inhalt, Kategorien, flache Knöpfe, rundes Siegel mit Mycel), VersionCode 20, Quelle main `ca2e4dccf39599b65f4de70848ef8bc6595f0e07` (Main-CI 39609980272 grün inkl. native-smoke).
Release-Lauf 39613483028 (workflow_dispatch mit `source_commit`, von dieser Claude-Sitzung auf Klaus' ausdrückliche Bitte gestartet; der Tag-Push war gesperrt) erfolgreich: Signatur, Updateprobe .19 → .20, Veröffentlichung.
Unabhängiger Download: SHA-256 `936649e6faa6eb23af07ed2fa7b5cdef4e884d13f0de68fcb3b1eca2a5c33d14`, 5.749.114 Bytes, gleich SHA256SUMS. Newsletter-Abmelden (PR #53) **nicht** enthalten. Tablet nicht gemessen.

**Mikrofon, Internet-Lampe, Dateiwahl (Klaus 2026-10-21):** 🎤 in der Suche nutzt in der Pro-App das Sprach-Fenster von
Android (`ProSpeechPlugin`, `native/native-speech.js`), nur der erkannte Text kommt zurück. Kleine Lampe oben vor ← → ☰:
grün = Internet erlaubt, rot = getrennt, Tippen schaltet, Hinweis beim Darüberfahren; Menü-Schalter bleibt. Siegel-Start
jetzt 152 px vom Rand (unberührter .20-Startplatz rückt mit). „Original erneut auswählen“ zeigt nur einen Knopf.
405 beim Teilen an Workflow PDF liegt beim Empfänger → Codex-Brief. [Details](docs/MIKROFON-LAMPE-DATEIWAHL.md).

**Newsletter abmelden (Klaus 2026-10-21):** unsichtbares `List-Unsubscribe` (+ RFC 8058 One-Click) wird gelesen; in „🧹 Aufräumen“ ⚡ direkt, ✉ Abmelde-Mail **nur nach Bestätigung**, 🌐 Webseite. Selbst abmelden nur mit Freigabe und nur ⚡ für „Ist Werbung“-Absender; bei Betrugsverdacht nie. [Details](docs/AUFRAEUMEN-NEWSLETTER.md#newsletter-abmelden-klaus-2026-10-21).

**Siegel und Mycel (Klaus 2026-10-21):** nur der **runde Siegel-Knopf** schwebt (Modul 17, byte-1:1), am Knopf
ziehen, oben an der Kopfleiste rastet er ein (`data-sbkim-leiste`), ✕ blendet aus, Rückweg in Einstellungen. Das
**Mycel** ist das Kanon-Fenster `23_rendezvous_ui.js` (byte-1:1, gepinnt) statt `net-widget.js` und öffnet sich **aus
dem Siegel-Fenster** (eigene Pille ausgeblendet, „nicht so viel Platz verschwenden“). Lampen nicht angezeigt. Glue
`native/native-mycel.js`, Probe `tools/native/test-mycel.mjs`. Eigene Identität „Private Brain Pro“ noch offen.
[Bedienung, Abweichungen, Grenzen](docs/SIEGEL-UND-MYCEL.md).

**Knöpfe flach halten (Klaus 2026-10-21):** „flach wie bei Notion, aber nicht ganz so flach, gut lesbar“ – damit
Mails und Dokumente Platz haben, auch am Handy. **Überall** in der Pro-App etwa 28 px, ohne Schatten; unsichtbare
Tippfläche 7 px darüber/darunter (hinter Nachbarn), beim Antippen wächst der Knopf (×1,12). Symbole statt Wörter, wo
allgemein bekannt: Lupe, Zahnrad, ☰ fürs App-Menü, ⟳ fürs Aktualisieren. Neue Knöpfe nicht größer bauen. [Details](docs/EXPLORER-SORTIEREN-UND-INHALT.md#flache-knöpfe-klaus-2026-10-21).

**Ordnen, Sortieren, Suchen (2026-10-21): Plan freigegeben, Grundlage + A1–A4 gebaut, noch keine Vorschau.**
A4: Kategorien per Vorschlag im Explorer (nur Ansicht): [Kategorien](docs/KATEGORIEN-VORSCHLAG.md).
A3: Explorer neueste oben, ↕, „🔎 auch im Inhalt“: [Explorer](docs/EXPLORER-SORTIEREN-UND-INHALT.md).
Nachfolge: [Brief](docs/BRIEF_2026-10-21_nachfolge-ordnen-sortieren-suchen.md). Klaus: GitHub-Kommentare nicht beobachten; CI selbst prüfen.
A2 „🧹 Aufräumen“: Newsletter nach Ablaufdatum, Papierkorb des Anbieters + Rückgängig (`locate` über Message-ID),
Freigabe je Absender, Stern/„Ist wichtig“/zurückgeholte Mails nie automatisch: [Aufräumen](docs/AUFRAEUMEN-NEWSLETTER.md).
Mail → „👥 Alle Konten“: Kopfzeilen und Text aller Konten (12 Monate, keine Anhänge, nur lesen),
Überschreiben statt Doppeln über `Message-ID`, unsichere Zwillinge in „Doppelte“, Bündel nach
Absender (↕), Wortsuche über alle Konten; automatisch beim Öffnen und alle 30 Minuten.
`MailIndex`/`index`/`indexText`, `native/native-mail-index.js`. Echte Konten/Tablet nicht gemessen.
Nächste Abschnitte A5 (Scanner-Übergabe) und A6:
[Plan](docs/PLAN_2026-10-21_ordnen-sortieren-suchen.md), [Bedienung/Grenzen](docs/ALLE-KONTEN-UND-ABSENDER.md).

**Vorschau .19 veröffentlicht (2026-10-21), Nachfolgeversion von .18.**
[APK .19](https://github.com/lausiklauskn-png/Privat-Brain-Pro/releases/download/v0.1.0-preview.19/Private-Brain-Pro-0.1.0-preview.19.apk) über die vorhandene App installieren, nicht deinstallieren.
Tag `v0.1.0-preview.19` exakt auf main-Commit `418ff2eeced686af8145aecd2d5e82a746a25f18`, VersionCode 19. Enthält PR #44 (Schutz-Prüfstelle) und PR #46 (Versionsnummer), einschließlich der Reparaturen aus .18.
Vollständige Main-CI 39570196725 einschließlich native-smoke grün: 46 Android-Fälle ohne Fehler/Überspringen, 34 Schutz-Simulationen und 18 Ersatzschlüssel-Gegenproben. Release 39575223652: Signatur/Metadaten 119138967179, signiertes Update **.18 → .19** 119141943511 und Veröffentlichung 119142938424 erfolgreich. Daten, Sprache, Offline-Kaltstart, Speicherort-Einstellung und Android-Ordnerauswahl erhalten/geprüft.
Öffentlicher Download im Release-Job mit `cmp` bytegleich zum signierten Artefakt. Zusätzlicher unabhängiger Download stimmt in SHA-256 und Größe mit SHA256SUMS und GitHub-Assetdaten überein; die ausgelieferten Dateien `native-protect.js` und `native-recovery.js` stimmen bytegleich mit der Quelle überein.
SHA-256: `b5851f24eee940078f1cd5805e64e0eb5482ab4d3cdf8e3d83f216ffef6d6604` (5.667.836 Bytes). Originalsignierer ausschließlich in Actions; `PB_SIGNING_UNLOCK` behalten. PWA und geschützte Module unverändert.
Die Schutz-Prüfstelle ist enthalten, bleibt aber ein begrenzter Schutz anhand von Regeln/Listen. Echte Anbieterzugänge und Klaus' Tablet wurden nicht getestet; die dokumentierten Anbieter-/Lizenzgrenzen bleiben bestehen.
[Bedienung und Grenzen](docs/SCHUTZ-VIREN-SPAM-BETRUG.md), [Prüfstand](docs/PRUEFSTAND-ANDROID.md#veröffentlichte-version-19--2026-10-21).

**Vorschau .18 veröffentlicht (2026-10-21): Ersatzschlüssel repariert.**
[APK .18](https://github.com/lausiklauskn-png/Privat-Brain-Pro/releases/download/v0.1.0-preview.18/Private-Brain-Pro-0.1.0-preview.18.apk) über die vorhandene App installieren, nicht deinstallieren.
Unterer Tresor: echte Android-Dateisicherung der fünf Anteile; Einrichtung erst nach erfolgreichem Export und Bestätigung. Abbruch/Fehler, Passwortwechsel und verspätete Antworten nach Schließen abgesichert. Drei Anteile stellen dessen Passwort wieder her, nicht das getrennte Tablet-/SD-Speicherort-Passwort.
Quelle/Tag `090503e1b4115e0e9bea07359d637b47de0e10e6` (`v0.1.0-preview.18`, Code 18); vollständige Quell-CI 39508996409 mit 41 Android-Fällen und Identitätsprüfung 39508996281 grün. Release 39510666137: signiertes .17→.18-Update 118933109306 und Veröffentlichung 118933930393 erfolgreich.
SHA-256: `6258bbb6d340b0e2404ff02c294bf011f4824b2cbfea5b6487ed8c102f803fa9` (5.637.591 Bytes). Der Release-Job hat den öffentlichen APK-Download mit `cmp` bytegleich zum signierten Artefakt geprüft. Der zusätzliche unabhängige Download stimmt in SHA-256 und Größe mit den veröffentlichten Prüfsummen und GitHub-Assetdaten überein.
Release-Werkzeuge von `235c7b124267e06e3d16fdb550d22cb7c147e2f6` (PR #45, CI 39508757517 mit tatsächlichen Activity-Neustarts in allen drei Phasen). Enthalten: Export-, VaultCode- und Navigationsreparatur; PR #44 **nicht** in dieser APK. Zum .18-Release blieb die Schutzfunktion auf main vorbereitet. PWA/geschützte Module und Originalsignierer unverändert.
[Bedienung/Prüfgrenzen](docs/TRESOR-ERSATZSCHLUESSEL.md), [Release-Nachweis](docs/PRUEFSTAND-ANDROID.md#veröffentlichte-version-18--2026-10-21). Keine Messung an Klaus' Tablet. `PB_SIGNING_UNLOCK` behalten.

**Bauabschnitt 5 in Vorschau .19 veröffentlicht (2026-10-21): Schutz vor Viren, Spam, Betrug.**
Prüfstelle `native/native-protect.js` (`PBSchutz`) mit Einschüben: Regeln für Spam/Betrug
(ohne Netz), MalwareBazaar-/URLhaus-Listen (abuse.ch, persönlicher Auth-Key), VirusTotal
nur Fingerabdruck auf Tipp, Übergabe an Virenscanner-App. Listen, Stand und Schlüssel
**nur** verschlüsselt im Speicherort-Ordner unter `Schutzlisten/` mit lesbaren Namen,
nie im App-Speicher (`Protection`/`ProtectionList`/`ProProtectPlugin`). Automatisch alle
12 h, Gesamtliste nur im WLAN, Internetschalter beachtet. Nie „virenfrei“ schreiben.
Anbieter nicht erreichbar gemessen, Lizenz für Verkauf offen, Tablet nicht gemessen.
[Bedienung, Grenzen, Nachweise](docs/SCHUTZ-VIREN-SPAM-BETRUG.md).

**Vorschau .17 veröffentlicht (2026-10-20).**
[APK .17](https://github.com/lausiklauskn-png/Privat-Brain-Pro/releases/download/v0.1.0-preview.17/Private-Brain-Pro-0.1.0-preview.17.apk)
über die vorhandene .16 installieren, nicht deinstallieren. Unveränderter Tag
`v0.1.0-preview.17` auf `39e8fae98671870962e70d5263416acd21502e37`;
vollständige Main-CI 39482528010 und Identitätsprüfung 39482529491 grün.
Release 39484440521, Versuch 2: signiertes Update .16 → .17 (Job 118867063256)
mit Daten, Sprache, Offline-Kaltstart, Speicherort-Einstellung und Android-Ordnerauswahl
bestanden; Veröffentlichung 118868309640 erfolgreich. Öffentlicher Download mit
`cmp` bytegleich zum ursprünglichen signierten Artefakt geprüft (5.634.429 Bytes).
SHA-256: `859c0b16c3517527a21deff909767e572603f7818e2c5ce9e8424dfa3ade097c`.
Der erste Versuch scheiterte schon beim .16-Start an einem WebView-Antworttimeout;
unveränderte APKs und Probe bestanden im Diagnoselauf 39491051454 und im Release-Wiederanlauf.
Keine belegte tiefere Ursache und kein geänderter App-Code; keine Prüfung abgeschwächt.
Originalsignierer bleibt ausschließlich verschlüsselt auf main; Freigabe nur in Actions.
Die alten vier Signier-Secrets sind nach Release und Downloadprüfung zur Löschung
freigegeben, wurden von dieser Sitzung aber nicht gelöscht. `PB_SIGNING_UNLOCK` behalten.
[Prüfstand](docs/PRUEFSTAND-ANDROID.md#veröffentlichte-version-17--2026-10-20),
[Release-Ablauf](docs/VEROEFFENTLICHEN.md), [Signierung](docs/SIGNIERUNG-UND-GITHUB.md).
PWA und geschützte Drift-Guard-Module unverändert. Noch keine Messung an Klaus' Tablet.

**Bauabschnitt 1 (Vorschau .17, 2026-10-20): eigener Speicherort mit Passwort.**
Einstellungen → „🔐 Speicherort und Verschlüsselung“: Tablet oder SD-Karte über die
Android-Ordnerauswahl, Passwort nur im nativen Dialog (PBKDF2 600k → AES-256-GCM,
Format PBV1, `VaultCrypto`/`Vault`/`ProVaultPlugin`, Seite `native/native-vault.js`).
Mail-Anhänge bis 1 GiB je Datei werden von Android stückweise in `Anhänge/` gestreamt,
nie durch die WebView; geöffnete Mails, Konten/Entwürfe, Originale und Katalogsicherung
liegen verschlüsselt im Ordner; „Vorhandenen Ordner öffnen“ stellt auf neuem Gerät
wieder her (nur ergänzen, nie überschreiben). Explorer „📎 Mail-Anhänge“ mit „Ganzen
Ordner leeren“ → Mails zeigen „Anhang gelöscht“. Ohne Speicherort bleibt .16-Verhalten.
Prüfen im Ordner, VirusTotal, Senden großer Anhänge, Passwortwechsel: noch offen.
Am Tablet nicht gemessen. [Bedienung, Format, Grenzen, Nachweise](docs/SPEICHERORT-UND-TRESOR.md).

**Private Brain Pro .16 veröffentlicht:** kleinere Navigationsnamen stehen direkt
rechts neben den Symbolen, auch auf dem Handy. Alle acht Ansichten bleiben sichtbar;
bei wenig Platz oder größerer Schrift verteilen sie sich auf flache Zeilen. Suche,
Zähler und Filter sind kompakter; beide Suchmodi passen vollständig in schmale
Fenster. Keine animierten Buttonbreiten beim Fensterwechsel. Tooltips, Zahnrad,
Statuslampen, Ordnerauswahl und App-Internetschalter bleiben erhalten.
[APK .16](https://github.com/lausiklauskn-png/Privat-Brain-Pro/releases/download/v0.1.0-preview.16/Private-Brain-Pro-0.1.0-preview.16.apk) über die vorhandene App installieren, nicht deinstallieren.
Anwendungscommit `0b7fef62a989be4200c1372df8c229ae7253d6c8` (PR31), Quelle `4d668e9ef122060f9b1d96deab52f6515ae4b61e`;
vollständige CI 39443580790 und 39443590674 bestanden: 319 native
Browser-Gegenproben plus je 101 in Firefox/WebKit, 37 Android-Fälle ohne
Fehler/Überspringen, Web-/Mail-Suiten, Unit, Build und Lint. Signiertes Update
.15 → .16 39443727118 mit erhaltener Sprache, Offline-Kaltstart und erneutem
Einschalten sowie wiederholter Android-Ordnerauswahl bestanden. Veröffentlichung
39445984706; öffentlicher Download bytegleich geprüft.
[Bedienung/Grenzen](docs/BESCHRIFTUNGEN-UND-ORDNER.md),
[Bilder](docs/design/compact16/README.md),
[Nachweis](docs/PRUEFSTAND-ANDROID.md#veröffentlichte-version-16--2026-10-20).
Plattformen: Oberflächentests in Chromium, Firefox und WebKit unter Linux;
keine echten iOS-/Windows-/macOS-/Samsung-/DeX-Gerätetests. Installierbar ist
weiterhin Android. Native iOS-/Desktop-Ausgaben und deren Geräteadapter fehlen.
Die unabhängige PWA bleibt unberührt. Google-Konto/Client nicht neu registrieren.
Der getrennte Speicher-/Quarantäne-/Modell-Auftrag bleibt offen.

**Private Brain Pro .15 veröffentlicht:** kurze Namen in der Navigation, sichtbare
Tooltips, kleinere anklickbare Dashboard-Kacheln und ein echtes Zahnrad.
Alle acht Ansichten bleiben direkt sichtbar, auf dem Handy in zwei flachen Zeilen.
Android-Ordnerauswahl bleibt nach „Nicht mehr zeigen“, Abbrechen und Neustart
bedienbar. Neue zusätzliche Ablagekopien werden geprüft und überschreiben keine
vorhandenen Dateien; alte Originalkopien/Katalogeinträge bleiben beim Wechsel.
Die großen Hinweisboxen stehen klein unter dem Einwurf. Der Mail-Ladehinweis
unterscheidet Abruf, Ansicht und tatsächliche Regelprüfung; kein vollständiger
Virenscanner. [APK .15](https://github.com/lausiklauskn-png/Privat-Brain-Pro/releases/download/v0.1.0-preview.15/Private-Brain-Pro-0.1.0-preview.15.apk) über die bestehende App installieren, nicht deinstallieren.
Anwendungscommit `161e9156d46b9b36007cedc322881d124f802ed2` (PR29), vollständige CI 39436653702
mit 275 Browser- und 37 Android-Fällen bestanden. Signiertes Update .14 → .15
39437954389 einschließlich echter Android-Ordnerauswahl nach ausgeblendetem
Hinweis, Offline-Kaltstart und erneutem Einschalten bestanden. Veröffentlichung
39438829136, öffentlicher Download bytegleich geprüft.
[Bedienung/Grenzen](docs/BESCHRIFTUNGEN-UND-ORDNER.md),
[Bilder](docs/design/compact15/README.md),
[Nachweis](docs/PRUEFSTAND-ANDROID.md#veröffentlichte-version-15--2026-10-20).
Die Zusatzablage ist noch keine passwortverschlüsselte externe Ablage. Keine
automatische Ordnersynchronisierung; Wechsel gilt für zukünftige Kopien.
Der getrennte Speicher-/Quarantäne-/Modell-Auftrag bleibt offen. Mailfunktion am
Gerät wurde vom Nutzer bereits bestätigt; keine neue Google-Registrierung nötig.

**Private Brain Pro .14 veröffentlicht:** kompakte Symbolleisten und echter
App-Internetschalter im App-Menü, in beide Richtungen und nach Neustart erhalten.
[APK .14](https://github.com/lausiklauskn-png/Privat-Brain-Pro/releases/download/v0.1.0-preview.14/Private-Brain-Pro-0.1.0-preview.14.apk) über die vorhandene App installieren, nicht deinstallieren.
Anwendungscommit `31a27eeba707cad4f4752ceccfd3c0e0b49a50e1` (PR27), vollständige CI 39425363587
mit 231 Browser- und 34 Android-Fällen erfolgreich. Signiertes Update .13 → .14
39425723720 einschließlich Offline-Kaltstart und erneutem Einschalten bestanden.
Veröffentlichung 39427132118, öffentlicher Download bytegleich geprüft.
[Bedienung](docs/KOMPAKTE-ANSICHT-UND-OFFLINE.md),
[Nachweis](docs/PRUEFSTAND-ANDROID.md#veröffentlichte-version-14--2026-10-20).

**Neuer Stand .14:** Kompakte Symbolleisten nach Outlook-Vorbild, auch in der
Handyansicht. Offline-Informationshinweis entfernt. Echten App-Internetschalter im
App-Menü in beide Richtungen implementiert; Konten/Entwürfe und Betriebssystemnetz
unverändert lassen, niemals automatisch Mails erneut senden. Details und Grenzen:
[Kompakte Ansicht und Offline](docs/KOMPAKTE-ANSICHT-UND-OFFLINE.md).

**Private Brain Pro .13 veröffentlicht**, ohne „Test“ im Appnamen.
[APK .13](https://github.com/lausiklauskn-png/Privat-Brain-Pro/releases/download/v0.1.0-preview.13/Private-Brain-Pro-0.1.0-preview.13.apk) über die bestehende App installieren, nicht deinstallieren.
Anwendungscommit `a5440d3bb01977a762f4e40ab2c170a8f14c37e6` (PR24), vollständige CI 39415063064
mit 31 Android-Fällen erfolgreich; signiertes Update .12 → .13 39415186477
mit Pro-Namen, erhaltener Spracheinstellung und Rückwegen bestanden.
Veröffentlichung 39416838139, öffentlicher Download bytegleich geprüft.
Google-Branding bereits Pro laut Nutzerbildern; vorhandener Client und Testnutzer
bleiben gültig. [Name und Google](docs/APP-NAME.md),
[Nachweis](docs/PRUEFSTAND-ANDROID.md#veröffentlichte-version-13--2026-10-20).

**Nutzerauftrag ab Version .13:** App sichtbar **Private Brain Pro**, ohne „Test“.
Paketkennung und Signatur unverändert lassen, bestehende App aktualisieren.
Google-Branding heißt laut Bildern bereits Pro; keine neue Registrierung nötig.
Google-Testnutzerstatus nicht automatisch auf Produktion umstellen.
[Name, Installation und Google](docs/APP-NAME.md).

**Vorheriger Stand, 2026-10-20: Vorschau .12 mit sieben Anbietervorlagen veröffentlicht.**
.12 enthält sieben native Vorlagen und erhält die Googlemail-/Kontowechsel-Reparatur
aus .11. 31 native Fälle und signiertes Update .11→.12 bestanden.
Der Nutzer hat ein gespeichertes Google-Konto und eigene Serverordner gezeigt;
Nachrichtenabruf und Versand am Gerät sind weiterhin offen. Nicht pauschal ein
neues Google-Projekt oder Konto anlegen lassen. Neu: WEB.DE, GMX, Yahoo und IONOS
sind als native Vorlagen verfügbar; Microsoft mangels eigener Registrierung zunächst
nur vorbereiten, ohne Passwortlogin oder behauptete fertige Verbindung.
[Anbietervorlagen/Microsoft](docs/MAIL-ANBIETER.md),
[Google-Diagnose](docs/GMAIL-RUECKGABE-DIAGNOSE.md),
[Prüfstand](docs/PRUEFSTAND-ANDROID.md#veröffentlichte-vorschau-12--2026-10-20),
[Übergabe](BRIEF_NACHFOLGE_2026-10-20_gmail.md). Ältere Zwischenstände unten historisch.

**Nächster Auftrag (2026-10-20):** eigener Speicherort (SD-Karte/Tablet, Passwort-verschlüsselt), Quarantäne für Mail-Anhänge bis 1 GB, Bedeutungssuche mit Modell im APK, Sicherheitspaket, Mycel/Siegel nach aktuellem Kanon (oben verankern, minimieren, ausblenden) mit eigener Identität, Vorbereitung Viren-/Spam-/Scam-Schutz (Scanner-Schnittstelle) — Stand .16 abgeglichen — [Brief](docs/BRIEF_2026-10-20_speicherort-quarantaene-suche-sicherheit.md). Nutzer 2026-10-20: Mailabruf und -versand funktionieren am Gerät in jede Richtung, auch mit Anhang.

**Kurz-Verfassung.** Netzweites steht in **Sage-Protokol**; hier steht nur, was eine
Sitzung wissen muss, **bevor** sie hier etwas anfasst.

## Was dieses Repo ist

**Private Brain** ist Klaus' **fokussiertes Zusammenführungs-Repo** (Entscheid 2026-07-16):
hier läuft alles zusammen, was ein **privates, offline betriebenes „zweites Gehirn"** ausmacht.

- **Die Box / der private Raum:** eine offline-fähige PWA, durch die man einmal **alle eigenen
  Daten** (Mails, Dokumente, Fotos, Notizen) laufen lässt. Sie liest jede Datei **einmal**,
  **signiert** sie, behält nur einen winzigen **Bedeutungs-Katalog** (Vektor + Steckbrief +
  Zeiger aufs Original) und lässt die **Originale unangetastet**. Danach: **semantische,
  kombinierende Suche** über gemischte Daten. Drei Vertrauens-Säulen: *liest nur · schlägt vor ·
  bewegt nichts.*
- **Herkunft:** das lauffähige Fundament ist **byte-kopiert aus Company-Brain** (v0.1) und für
  die **Privatperson** umgewidmet. Company-Brain und alle anderen Repos **bleiben unangetastet** —
  nur Private Brain wird gebündelt/gebaut.
- **Zugleich ein SBKIM-Endknoten:** eigene Identität, DB-Schublade `sbkim_privatbrain`,
  optionale server-lose Verbindung (Modul 23), Standard **aus** (offline-first).
- **Positionierung:** *„kein großes Unternehmen dahinter, in Heimarbeit gebaut"* — der
  Vertrauens-Keil für Menschen, die den großen Namen (Microsoft & Co.) nicht mehr trauen.

## Sprache, Befehle, Design

Seit dem Umbau vom 2026-10-19 sind Suche (Startseite), Dateien hinzufügen und Explorer
die drei Hauptseiten. Gemeinsame Navigation und lokale Kopienablage stehen in
`assets/workspace.js`/`.css`. Das bestehende Design und die vier Sprachen bleiben
verbindlich. Kopien werden nur nach Wahl eines lokalen Ablageordners geschrieben;
Browser ohne Ordner-API dürfen keinen dauerhaften Gerätezugriff vortäuschen.
Details und Prüfgrenzen: `docs/BRIEF_2026-10-19_suche-ablage-explorer.md`.

Das ergänzende **Postfach** verwendet den Sende-Prüfer-Aufbau in
`assets/mail-workspace.js`/`.css`. Modul 25 und die neuen Anhang-/Format-/HTML-Prüfer
sind bytegleich kopiert und gepinnt; nie hier abwandeln. Lokale Ordner sind keine
IMAP-Ordner, Export ist kein Versand, Vormerken kein Senden. Die zusätzliche optionale
Anbindung in `assets/live-mail.js`/`mail-service/` spricht dagegen echte IMAP-/SMTP-Server
über einen privaten HTTPS-Dienst an (Hetzner, Telekom). Sie ist opt-in, ohne Konten
standardmäßig getrennt; Kontozugangsdaten niemals in Git, localStorage oder Logs.
Betrieb und Grenzen: `docs/MAIL-DIENST.md`. Nach unklarem Versandresultat niemals
automatisch wiederholen; die serverseitige Kennung bleibt dauerhaft gespeichert. Beim KI-Weg nur den
verdeckten Text und ausschließlich den Schlüssel des ausgewählten Anbieters
weitergeben; die Zuordnung bleibt lokal. Gegenprobe:
`python3 tools/gegenprobe-mail-workspace.py` (nur Wegwerfkopien).

- Doku auf **Deutsch**, Code-Bezeichner auf **Englisch**. Datum `YYYY-MM-DD`.
- **UI-Sprachen:** Deutsch · English · Русский · Polski (DE/EN/RU/PL).

```bash
npm install     # einmalig: playwright-core (Chromium ist im Environment vorhanden)
npm test        # Beweis: Drift-Guard (8 Module byte-1:1) + 6 headless e2e-Suiten
npm run serve   # python3 -m http.server 8000  → http://localhost:8000/
```

## Design-Vorgabe (Klaus 2026-07-16)

- **Optik angelehnt an das Warenwirtschafts-Dashboard** von Perfect-Skin-Fashion
  (`warehouse.html`) + die Design-Sprache von Alis-Moderaum: dunkle Karten, KPI-Kacheln
  (`.tile`, Regenbogen-Kante), Emoji-Tab-Leiste, Status-Pills, `data-theme` am `<html>`.
- **Nur** Hell/Dunkel-Umschalter (zwei Themes) **+ Hard-Reload-Knopf** — kein weiterer
  Design-Umbau ohne Auftrag.
- **Warenwirtschaft als Ordnungs-Metapher:** jede Datei = ein „Artikel" (Pfad, Kategorie,
  Status neu/gepflegt/archiviert, Tags), jede Sortier-/Pflege-Aktion = ein **Journal**-Eintrag.

## Was hier leicht kaputtgeht

- **Kopieren, nicht klonen.** Die byte-1:1 übernommenen Module
  (`modules/01,02,03,04,05,05b,23,noble-secp256k1`) werden **nicht abgewandelt** — der
  Drift-Guard (`tools/drift-guard.mjs`, Teil von `npm test`) wacht per SHA-256.
  Reift ein Modul, wird es **in Sage gepflegt und neu kopiert**. App-eigener Klebstoff
  (`rendezvous-init.js`, `index.html`) ist frei.
- **DB-Suffix `privatbrain` nie ändern** — geteilter Origin auf GitHub Pages, sonst
  kollidiert der Datenbestand mit Geschwister-Apps.
- **Der Gerätename** wird vom app-eigenen Glue ins Verbinden-Panel gehängt — hier
  `rendezvous-init.js`, **nie** in eine byte-kopierte Panel-Datei.
  Regel: [NETZWEIT § 2](https://github.com/lausiklauskn-png/Sage-Protokol/blob/main/docs/NETZWEIT.md).
- **Echte Krypto.** AES-256-GCM / PBKDF2-SHA256 600k (WebCrypto), Ed25519
  (`node:crypto`). Das semantische Modell ist bis zu Klaus' Browser-Lauf klar als
  Stub markiert, wo nötig.
- **Offline.** Keine CDNs, keine Laufzeit-Abhängigkeiten im Browser. Fremde Origins
  (bewusst freigeschaltete EU-KI) nur nutzer-ausgelöst.

## Stufen-Fahrplan (Klaus 2026-07-16, alle bestätigt)

| Stufe | Was | Stand |
|---|---|---|
| 0 | Fundament aus Company-Brain kopiert + umgewidmet + Dashboard-Optik + DE/EN/RU/PL + Hell/Dunkel + Hard-Reload | in Arbeit |
| 1 | Verschlüsselung des Katalogs/privater Texte (JasonLib-Tresor / Modul 20) | geplant |
| 2 | **Mail-Import** (Gmail-Takeout `.mbox`/`.eml`, offline) — der Unterschied zu NAS | geplant |
| 3 | Bild-Verstehen-Stufe (Bild→Text→Sinn, Late-Fusion; Florence-2 via Transformers.js) | geplant |
| 4 | Kombinierende Mehrschritt-Suche (Urlaub → ähnliche Orte → Reisebüro-Angebot) | geplant |
| 5 | Selbstlernende Sortierung aus Korrekturen (Classification-by-Retrieval, kein Training) | geplant |
| 6 | Optionale Freunde-Verbindung server-los (Modul 23, Default aus) | geplant |
| 7 | Später: echte Offline-Box (lokales Relais + lokales Modell + lokaler Richter-Slot) | geplant |

## Test & Ehrlichkeit über den Zustand

- **Headless `npm test`** bestätigt die Motor-Logik — unser Beweis.
- Die **App** ist erst „grün", wenn **Klaus sie im Browser angesehen** hat. Solange das
  aussteht: ehrlich **„ungeprüft, wartet auf Klaus' Browser-Lauf"**.
- **Hard-Reload** nach jedem Pull — Service-Worker und HTTP-Cache sind hartnäckig.
- **Plan-vor-Code:** erst Pflichtlektüre, dann ein kurzer Plan an Klaus, bevor größere
  Bauten starten. Gibt Klaus ausdrücklich einen Freibrief, entfällt das im
  freigegebenen Umfang. **Keine stillen Workarounds.**

## Branch

Entwicklung auf dem **für die Sitzung vorgegebenen Branch** (steht im ersten Prompt).
Ein Commit pro abgegrenzter Aufgabe, sprechende Nachricht auf Deutsch.

> Bis 2026-08-22 stand hier ein fest verdrahteter Branch-Name aus einer alten
> Sitzung. Er stand gegen den Branch, den die Sitzung tatsächlich vorgegeben
> bekommt — wer der Datei folgte, pushte ins Leere.

---

## 🌐 DAS MYCEL-FENSTER SPRICHT DEUTSCH UND ENGLISCH (Klaus 2026-09-16)

Klaus: *„Private Brain soll zweisprachig werden … der Zweisprach-Modus für Mycel
und für das Siegel."*

**Das Siegel war schon zweisprachig.** `modules/16_siegel.js` ist byte-1:1 aus Sage
und trägt seit dem Modul-15/16-Rollout eine eigene `TEXTE.en` — ebenso 15 und 17.
Nachgemessen, nicht angenommen:

| Modul | byte-1:1 mit Sage | eigene EN-Tabelle |
|---|---|---|
| 15 Membran · 16 Siegel · 17 Widget | ✔ | ✔ |
| 23 Rendezvous | ✔ | — (trägt keine Anzeigetexte) |

**Offen war das Mycel-Fenster** — `modules/net-widget.js`, 838 Zeilen app-eigener
Klebstoff, **null** Übersetzungs-Treffer. Es trägt jetzt dieselbe Mechanik:
schlüssellos, der deutsche Satz IST der Schlüssel, **98 Einträge**.

⚠ **WARUM EINE EIGENE TABELLE.** Die Kanon-Module sind byte-1:1-Kopien, ihre `TEXTE`
sind modul-intern. Modul 16 hat aus demselben Grund eine eigene. Dieses Fenster ist
app-eigen — seine Sätze gehören ihm.

### ⚠ DER FUND, AUF DEN ES ANKAM: das Panel wird beim LADEN gebaut, nicht beim Öffnen

`T()` wirkt in dem Augenblick, in dem ein Text **entsteht**. Wer danach die Sprache
umschaltet, bekommt die alten Sätze. **Gemessen im echten Browser:** mit
`<html lang="en">` nach dem Laden stand das Fenster **vollständig auf Deutsch** —
obwohl Tabelle und `T()` tadellos waren.

⚠ **EIN WÄCHTER AUF DIE TABELLE HÄTTE DAS NICHT GESEHEN.** Er liest den Quelltext;
hier ging es um den Schirm. Gefunden hat es die **Browser-Hälfte** der Probe.

**Was jetzt gilt:** ein `MutationObserver` auf `<html lang>` mountet das Fenster über
**dieselbe** `mountFlying()` neu. Ein zweiter Nachtrage-Weg wäre eine zweite Fassung
derselben Beschriftungen, und zwei Fassungen laufen auseinander. Getippte Frage und
Gerätename werden gerettet; Auf/Zu, Lage und Erklär-Zustand liegen im `localStorage`,
die Verbindung lebt in Modul 23 — nichts davon wird angefasst.

### ⚠ UND DIE RETTUNG HAT PROMPT EINEN DEUTSCHEN SATZ ZURÜCKGEHOLT

Die gerettete Statuszeile ist selbst übersetzt. Wörtlich hinübergereicht stand
„Noch nicht verbunden." mitten in der englischen Oberfläche — **genau die halb
übersetzte Tafel**, gegen die alles hier gebaut ist. Gefangen hat es der Wächter
„KEIN deutscher Tabellen-Satz bleibt stehen", nicht das Nachdenken. Sie wird jetzt
erst **nach Deutsch normalisiert** (`nachDeutsch()`) und dann neu übersetzt — das
trägt **beide** Richtungen.

⚠ **BENANNTE GRENZE:** eine Zeile aus Bruchstücken **und** einem Knoten-Namen
(`✓ Antwort von „Kimboard" — siehe unten.`) steht in keiner Tabelle und behält ihren
Wortlaut bis zur nächsten Aktion. Sie zu zerlegen hieße raten.

⚠ **BENANNTE GRENZE: die App kennt VIER Sprachen, der Kanon zwei.** Bei `lang="ru"`
und `lang="pl"` fällt das Fenster — wie Modul 15 und 16 — fail-soft auf **Deutsch**
zurück, nicht auf Englisch. Das ist die Entscheidung des Kanons; sie hier anders zu
treffen hieße, dass das Fenster etwas anderes spricht als das Siegel daneben.
**In beide Richtungen bewacht.**

### ⚠ Zwei Fehler im eigenen WERKZEUG, keiner im Code

| Was | warum es nichts maß |
|---|---|
| `[^,]*` im Umschließ-Muster | **die Klasse überspringt Zeilenumbrüche.** Ein gieriger Treffer verschluckte mehrere Zeilen und übersprang die Stellen darin — 14 Beschriftungen blieben unübersetzt, darunter der ganze Erklär-Absatz des Fensters. Gefangen hat es der Verwaisten-Wächter |
| die Anker-Prüfung der Gegenprobe | sie zählte den Anker **nach** dem Eingriff. Ein Ersatztext darf den Anker enthalten (Einfügungen tun das) — zwei tadellose Fälle meldeten sich als „toter Anker". Gemessen wird jetzt, **ob sich die Datei wirklich geändert hat** (PWA-Toolpoint-Lehre) |

### Geprüft

```bash
node tools/e2e-netwidget-sprache.mjs          # echter Browser, DE · EN · EN→DE · RU
bash tools/gegenprobe-netwidget-sprache.sh    # Wegwerf-Kopie, node_modules verwiesen
```

Zuletzt gemessen (2026-09-16): **17 grün · 0 rot** · Gegenprobe **9 gefangen ·
0 durchgerutscht · 0 aus falschem Grund · 0 tote Anker**. Beide Rückgabewerte
**direkt** gelesen, nicht hinter einer Pipe.

✅ **`npm test` LÄUFT SEIT DEM 2026-10-13 WIEDER BIS ZUM ENDE.** Hier stand:
*„`tools/e2e-siegel.mjs` hat vier vorbestehende Rote (Andock-Wizard-Injektion) … die
Kette hängt an `&&`, deshalb laufen die drei Proben dahinter gar nicht."*

**Die Ursache lag in der Probe, nicht im Code.** Seit A18 (#87, 2026-09-14) legt der
Kanon-Wizard (`assets/sbkim-andock-wizard.js`) seine Elemente als `sbkim-si-*` an.
#87 hat in der Probe nur das Präfix der vier Schritte (`sbwiz-`) nachgezogen; die fünf
Element-Kennungen (`pb-ident-open`, `pb-semantik-block`, `pb-semantik-resign`,
`pb-schutz-block`, `pb-ident-wizard`) blieben stehen. Der Wizard war da, die Probe sah
ihn nicht. *Ein Umzug macht jeden Wächter tot, der auf die alte Stelle zeigt.*

Gemessen: `e2e-siegel` **16 bestanden · 0 fehlgeschlagen**. Von Hand gegengeprüft in
einer Wegwerf-Kopie: ohne die Wizard-Zeile werden genau die vier Zeilen rot, ohne den
Semantik-Block nur dessen eine. `npm test` gibt **0** zurück; die drei Pinnwand-Proben
laufen mit (57 · 21 · 15 grün) — direkt gelesen, nicht hinter einer Pipe.

⚠ **Cache-Bump:** `net-widget.js` steht im Vorrat von `sw.js` → `CACHE` v63 → **v64**,
**gegen `origin/main` geprüft**, nicht gegen die eigene Datei (NETZWEIT § 3a: zwei
Sitzungen haben schon einmal dieselbe Nummer vergeben).

## Netzweit — gilt in jedem Repo, steht in Sage

Freibrief zum Selbst-Mergen · Gerätename im Verbinden-Panel · frisch von
`origin/main` vor jeder Arbeit · Ton (Klaus ist kein Programmierer: Deutsch,
Einzelschritte, keine Terminal-Kommandos wo ein Knopf reicht) · kein PII ·
Ehrlichkeit: **[`Sage-Protokol/docs/NETZWEIT.md`](https://github.com/lausiklauskn-png/Sage-Protokol/blob/main/docs/NETZWEIT.md)**

Verbindliche Verträge: **[`INTERFACES.md`](https://github.com/lausiklauskn-png/Sage-Protokol/blob/main/docs/INTERFACES.md)**. Die Fallen beim
Abzweigen und Veröffentlichen: **[`LEHREN.md`](https://github.com/lausiklauskn-png/Sage-Protokol/blob/main/docs/LEHREN.md)**.

```bash
git fetch origin --quiet && git checkout -B <branch> origin/main
git push -u origin refs/heads/<branch>:refs/heads/<branch>
git diff --stat origin/main origin/<branch>     # leer = der PR wäre leer
```

> Die alte Fassung dieser Datei steht vollständig in
> [`docs/archiv/CLAUDE-2026-08-22.md`](docs/archiv/CLAUDE-2026-08-22.md).


## 🛡 Prüfliste vor dem KI-Richter (Sage Bau 04.J, 2026-10-14)

Modul 04 kommt neu aus dem Kanon (Sage #1082). Der Richter prüft die Suchfrage und jede fremde Antwort mit der Prüfliste (`pruefer-mail.js`). Fehlt die Liste, läuft er nicht. Eine Antwort, in der eine Anweisung an eine KI steht, geht nicht an die KI. Sie bekommt „gefahr“ und `ausgeschlossen: "ki-anweisung"`.
`modules/pruefer-mail.js` ist neu. Die Datei ist byte-1:1 und im Drift-Guard gepinnt; `index.html` lädt sie direkt nach 04, und sie steht im Vorrat. Gemessen: `npm test` Rückgabe 0; im Browser ist `prueflisteGeladen` true. ✅ Das Mycel-Fenster ist seit Sitzung 2 gemessen (Abschnitt unten). Hier stand: *„Im Code nachgesehen, nicht im Browser gefahren: das Mycel-Fenster zeigt einen ausgeschlossenen Treffer mit ⚠️ (sicherheit „gefahr“) und der Begründung.“* Cache v70. Am Tablet nicht gemessen.

## 🧽 Reinigung und Prüfung vor der KI (Klaus 2026-10-14, Sitzung 2 von 4)

Vorbild sind Workflow PDF #112/#113 und die Rezeptbücher (Klaus' Antworten dort: „Seiten als Bild“, „einmal anhalten“).
Privat-Brain hat **vier eigene KI-Wege**. Bis hierher ging dort alles ungeprüft hinaus:

| Weg | vorher | jetzt |
|---|---|---|
| 🖼 Bild-Beschreibung (Mistral pixtral) · Mistral OCR · Google Vision | ein Foto bis 1024 px ging als **Original** hinaus, samt EXIF/GPS | immer **neu gezeichnet** (`KiReinigung.bildOhneMeta`); klappt das nicht, geht **nichts** hinaus |
| PDF ohne Textebene → Mistral OCR (beim Einlesen) | das **ganze PDF roh** | Seiten mit pdf.js gezeichnet (300 dpi), versteckter Text in der Kopie zugedeckt, Bilder hinaus; **einmal anhalten je Einlese-Lauf** („Ohne ihn senden“/„Abbrechen“), Vermerk `kiEntfernt` am Eintrag |
| 🔗 KI zu einer Datei (Mistral Chat) | Datei-Text ungeprüft | PDF-Text aus pdf.js **ohne** versteckte Stücke (Halt „Versteckten Text gefunden“); Anweisung an eine KI im Text → **einmal anhalten** („Trotzdem senden“/„Abbrechen“); Systemkanal nennt den Text DATEN |
| 📌 Pinnwand-Richter (Fragen/Antworten von Fremden) | ungeprüft | Block `RICHTER-PRÜFUNG` wie Kimboard #150: ohne Liste kein Richter, Frage mit Anweisung wird nicht gesendet, Antwort mit Anweisung steht mit „⚠ nicht an die KI“ da |

Dazu im **Mycel-Fenster**: ein Treffer, den Modul 04 ausschließt, steht jetzt ausdrücklich mit „⚠ nicht an die KI“ und Begründung da (vorher nur ⚠️), DE/EN in der Tabelle.

- `modules/reinigung.js` ist **byte-1:1 aus Workflow PDF** (`assets/reinigung.js`, gepinnt im Drift-Guard). `modules/ki-reinigung.js` ist app-eigener Klebstoff und steht **identisch in Company-Brain** — dort pflegen heißt hier nachziehen.
- pdf.js kommt von `/Workflow-PDF/vendor/pdfjs/` (dieselbe Adresse wie bei den Rezeptbüchern). Lädt es nicht, geht kein PDF an Mistral OCR, und das 🔗-Fenster sagt „versteckter Text im PDF wurde nicht geprüft“.
- ⚠ **Benannte Grenzen:** nur die ersten 10 Seiten · Text über einem Foto/über sichtbarer Schrift bleibt · schräger Text wird nicht beurteilt · die Prüfliste sucht feste Wendungen · Halt-Texte nur DE/EN (RU/PL zeigen Deutsch) · der Mail-Import hat keinen eigenen KI-Weg (seine Anhänge gehen durch denselben `readContent`).
- Probe `tools/e2e-ki-reinigung.mjs` (in `npm test`, KI gestellt, braucht den Workflow-PDF-Klon, `WFPDF_KLON`; ohne → Rückgabe 2) · Gegenprobe `node tools/gegenprobe-ki-reinigung.mjs` (Wegwerf-Kopie; `NUR_ANKER=1`, `NUR_FALL=…`).
- ⚠ Beim Bau gefunden, nicht im Code, sondern in der Probe: ein PDF aus pdf-lib liest der eigene Extraktor nicht — es ging deshalb beim Einlesen an die Texterkennung, und der Halt wartete auf einen Tipp. Das ist richtiges Verhalten; die Probe liest das PDF für den 🔗-Fall ohne Schlüssel ein.
- Gemessen 2026-10-14: `e2e-ki-reinigung` **42 grün · 0 ROT**, `npm test` Rückgabe 0. Gegenprobe (15 Fälle, Wegwerf-Kopie): erster voller Lauf **14 gefangen · 1 durchgerutscht** — „Pinnwand schickt alle Antworten“. Der Wächter dazu las nur den Quelltext, und die Zeile `gesendet.map(…)` blieb bei der Sabotage stehen: **blind**. Ersetzt durch einen Aufruf von `judgeView` in Node mit gestelltem Richter; der Fall danach einzeln: **gefangen**. Company-Brains eigene Verdrahtung: 5 Fälle von Hand in einer Kopie, **5 gefangen**.
- ⚠ Nicht gemessen: am Tablet, mit echten Dokumenten, mit echter KI.
- Cache v71.

### ✅ „Versteckter Text im Seitenbild zugedeckt“ ist bewacht (Sitzung 5, 2026-10-14)

Hier stand als benannte Grenze: *„kein Gegenprobe-Fall für „versteckter Text wird im Seitenbild zugedeckt“ (weißer Text auf Weiß sieht zugedeckt gleich aus).“* Der Satz stimmt für weißen Text. Gemessen wird deshalb an der **winzigen, dunklen** Schrift (1 pt schwarz) aus Fall B: im Seitenbild, das an Mistral OCR geht, zählt die Probe an genau deren Stelle die dunklen Bildpunkte. Ein Selbst-Riegel zeichnet dieselbe Seite ohne Zudecken; dort müssen es mehr als 3 sein, sonst misst die Zeile nichts.
Gemessen: ohne Zudecken 19 dunkle Bildpunkte, gesendet 0. Gegenprobe-Fall `B: versteckter Text bleibt im Seitenbild` nimmt `R.zudecken` weg und wird **gefangen** (gesendet 20). `e2e-ki-reinigung` 44 grün · 0 ROT. Weißer Text auf Weiß bleibt so unmessbar wie vorher; das ist jetzt eine Grenze der Messung, nicht mehr eine Lücke im Schutz.

## ⬇ Installieren-Knopf (2026-10-18, Klaus: „unter Einstellungen, Installier-Button hinten“)

`assets/installieren.js` ist byte-1:1 aus Sage-Protokol (SHA-256 `e0644084…c3`) — nie hier abwandeln. Der Knopf steht im
Reiter ⚙️ Einstellungen im letzten Kasten `#install-box` hinten (`data-in`); als installierte App verschwinden Knopf und
Kasten. Überschrift und Satz tragen `installH`/`installP` (DE, EN; RU und PL fallen auf Deutsch zurück). ⚠ `data-i18n`
nie an den Kasten selbst: `applyI18n` setzt `innerHTML` und nähme den Knopf weg. Der Knopf spricht DE/EN nach `<html lang>`.
Im Vorrat (`?v=1`), Cache v82. Gemessen im Browser: sichtbar als letztes Element (auch nach Umschalten auf EN), als App weg,
Meldung lesbar, `getInstallabilityErrors` leer, App-Id `/index.html` (kein `id` im Manifest). `npm test` grün (mit
`WFPDF_KLON`). Am Tablet nicht gemessen.

## ⬇ Installieren auch oben in der Kopfleiste (Klaus 2026-10-18)

Klaus: *„da, wo der Installationsbutton in den Einstellungen zu finden ist, vermutet keiner, dass er die App installieren
kann … setze den Installationsbutton oben in die Navi-Leiste zusätzlich.“* Dieselbe Datei `assets/installieren.js`
(unverändert, Sage `e0644084…c3`) setzt jetzt zwei Knöpfe: `data-vor="install-platz"` in der Kopfleiste vor 🌙 und
weiter `data-in="#install-box"` in den Einstellungen. Als installierte App sind beide weg.
`#install-platz` (gleiche Klasse `iconbtn`, unsichtbar) hält den Platz frei, bis der Knopf davor steht; danach und als App
blendet CSS ihn aus. Bis 760 px nur ⬇ (Name im title/aria-label), bis 400 px rückt `.tools` enger (gap 5 px, Sprachknöpfe
6 px, Symbolknöpfe 34 px). Gemessen im Browser (Kopfhöhe vorher → nachher): 320 px 251 → 241 · 360 px 205 → 202 ·
412 px 205 → 205 · 1280 px 75 → 75, kein Querlaufen, CLS wie vorher; als App beide weg; Tipp ohne Angebot → Meldung
(Kontrast 4,9); `getInstallabilityErrors` leer. Ohne die enge Leiste bekam 360 px eine zweite Reihe (205 → 251).
Cache `private-brain-v83`. `npm test` grün (mit `WFPDF_KLON`). ⚠ Am Tablet nicht gemessen.

## Pro-App: Stand 2026-10-19

Dieses Repository ist jetzt **Privat-Brain-Pro**, die unabhängig kopierte Grundlage
für die native App. Die vorherigen Abschnitte dokumentieren das geerbte Webprojekt;
die PWA im anderen Repository bleibt unangetastet. Android/Capacitor-Konfiguration
liegt unter `android/` und `capacitor.config.json`; `npm run sync:android` erzeugt
nur das explizit ausgewählte öffentliche Webpaket. Details: `docs/ANDROID.md`.
Geschützte Module bleiben unverändert. Native Brücken nur für notwendige, eng
begrenzte Operationen und nur für den lokalen App-Ursprung zulassen.

Freibrief des Nutzers gilt: selbstständig implementieren, prüfen, committen und bei
erfolgreichen relevanten Prüfungen zusammenführen. Nicht nach einer bloßen
Ankündigung stoppen; nur konkrete externe Voraussetzungen erfordern seine Aktion.
Kein eigener Desktop-PC beim Nutzer voraussetzen. Keine Geheimnisse oder
Signierschlüssel in Git oder Chat; Produktion und Vorschau getrennt signieren.


## Helles Pro-Icon (Nutzerwunsch 2026-10-19)

Der Nutzer hat ausdrücklich eine helle Pro-Variante des Icons beauftragt: glänzende
3D-Bubbles und Leuchtverbindungen beibehalten, grauen Hintergrund durch helles
Elfenbein ersetzen. Das betrifft Header-, App- und Installationsicons ausschließlich
in diesem Pro-Repository. Die ältere Regel „Original-Icons nie überschreiben“ wird
für diese gewünschte Pro-Ableitung entsprechend konkretisiert; die PWA bleibt
unverändert. Vorlage: `artwork/private-brain-pro-light.png`, technische Größenexporte
über `node tools/native/export-pro-icons.mjs`. Adaptive Android-Icons verwenden
auch außerhalb des Motivs den hellen Hintergrund. Bestehenden Hell-/Dunkelmodus
der Oberfläche weiterhin erhalten.

## Native Mailarbeit für Vorschau .4 (2026-10-19)

`ProMail` ist der enge Android-Adapter, `native/native-mail.js` bindet ihn vor dem
bestehenden `assets/live-mail.js` ein. Passwörter nur im nativen Dialog; keine
Dienst-Token für direkte Geräteverbindungen. Konten/Entwürfe/Versandnachweise
AES-GCM/Keystore, keine stillen Ersatzschlüssel. Unklaren SMTP-Ausgang niemals
automatisch wiederholen. Die .2-APK hat noch den alten Serverdialog. Stand und
Prüfgrenzen: `docs/NATIVE-MAIL-ARCHITEKTUR.md`, `docs/PRUEFSTAND-ANDROID.md`.

## Veröffentlicht: direkte Geräte-Mail in Vorschau .4

PR #3 ist zusammengeführt, App-Quellstand a3f6051d8946c411449936bf59a1c86e12435fdc.
Test-APK v0.1.0-preview.4 ist öffentlich; kein Dienst-Token/Termux für native Mail.
Vollständige CI 39323175775 und signierte Updateprobe 39324803227 bestanden.
Telekom-Anmeldung und Abruf sind inzwischen vom Nutzer bestätigt. Details und
Prüfsumme: `docs/PRUEFSTAND-ANDROID.md`. Vorschau-Schlüssel außerhalb von Git;
Langzeitbackup/Produktion weiterhin gesondert absichern, keine Geheimnisse erfragen.


## Originalansicht und Fensterfläche (Nutzerwunsch 2026-10-19)

Der Nutzer bestätigt direkte Telekom-Anmeldung und Nachrichtenabruf in .4.
In .5: Original-HTML/CID-Bilder getrennt von Katalogtext, ausschließlich im
skriptfreien Sandbox-Frame mit eigener CSP. Original-MIME und Keystoreformat
bleiben unverändert. Keine `allow-scripts`-/`allow-same-origin`-Freigaben für Mail.
Externe HTTPS-Bilder auf ausdrücklichen Nutzerwunsch sichtbar, abschaltbar.
Das native Fensterlayout füllt alle Seiten ohne 1040-px-Grenze. Postfach und
Explorer besitzen scrollbare Bereiche wie Sende-Pruefer; OS-Fensterknöpfe bleiben.
Kontowerkzeuge im Menü „Weitere Aktionen“, rechtliche Fußtexte in Einstellungen.
Schutzmodule/Original-PWA unverändert. Prüfnachweise: docs/design/mail-preview5/.


## Veröffentlicht: Vorschau .5

Signierte Originalansicht-/Fensterlayout-APK v0.1.0-preview.5 ist öffentlich.
Quellstand 3ce818c0c4f02813ec925b665d55a3743af051b0, derselbe Git-Baum wie
vollständig geprüfter f327154c8d8e78214858bc131c85097053500828. CI 39331444809:
10 Android-Fälle ohne Fehler/Überspringen. Signierte .4→.5-Updateprobe und Upload
39332888607 erfolgreich; direkter Download HTTP 200 und SHA256 geprüft.
Bestehende App aktualisieren, nicht deinstallieren. Echter Telekom-Abruf bestätigt;
neue HTML-Ansicht und Update mit gespeicherten Konten durch Nutzer noch prüfen.


## Verbindliches gemeinsames Postfach (2026-10-20)

Nutzer: Die lokale Ansicht ist auch nach Aktivierung eines Kontos verbindlich.
Standardnamen/Symbole/Reihenfolge, Titel und Primärknöpfe werden gemeinsam über
PBMailUI gepflegt. `native-mail-folders.js` ordnet ausschließlich die Darstellung
zu; IMAP-Pfade nie übersetzen/umbenennen. Keine Löschrechte aus Anzeigenamen
ableiten. Postausgang = gespeicherte Geräte-Versandversuche, Entwürfe zusätzlich
lokal; kein unklarer Neuversand. Datenformat/Keystore unverändert. Details unter
docs/design/mail-preview6/. Geschützte Module/Original-PWA weiterhin unverändert.


Vorschau .6 am 2026-10-20 veröffentlicht: gemeinsames Postfach vor/nach Kontoaktivierung,
72 native Mail-Bedienproben und 10 Android-Tests bestanden.
Signierte Updateprobe .5 → .6 und öffentlicher Download geprüft;
[Prüfnachweis](docs/PRUEFSTAND-ANDROID.md),
[APK](https://github.com/lausiklauskn-png/Privat-Brain-Pro/releases/download/v0.1.0-preview.6/Private-Brain-Pro-0.1.0-preview.6.apk).
Über die bestehende Test-App installieren, nicht deinstallieren.

## Verlässlicher Rückweg aus Dateien (2026-10-20)

Native Dateiöffnung nie über `window.open(blobURL)` im Hauptfenster. Die interne
Dateiansicht und History liegen in `native/native-navigation.js`; AndroidX-Zurück
ruft denselben Weg auf. Mindestens zwölf Datei-/Seiten-Rückschritte prüfen.
Explorerzustand beim Zurück erhalten; Eingabe-Backspace nicht abfangen. PDF/Office
nur ausdrücklich über den engen ProFiles-FileProvider-Weg öffnen; kein beliebiger
Dateipfad, keine Originaländerung. Konten, Datenformate und PWA unverändert.
Details: docs/RUECKNAVIGATION.md.


Vorschau .7 veröffentlicht: Rückweg aus Bildern/Dateien, 22 Navigationsproben und
11 Android-Tests einschließlich zwölf echter Rückschritte bestanden. Vollständige
CI 39342179484, signierte Updateprobe .6 → .7 mit sichtbarem und Android-Zurück
39343904505 erfolgreich; öffentlicher APK-Download geprüft.
[APK .7](https://github.com/lausiklauskn-png/Privat-Brain-Pro/releases/download/v0.1.0-preview.7/Private-Brain-Pro-0.1.0-preview.7.apk).
Bestehende App aktualisieren, nicht deinstallieren. Grenzen/Nachweise in
`docs/RUECKNAVIGATION.md` und `docs/PRUEFSTAND-ANDROID.md`.

## Nächste Sitzung: Google/Gmail (2026-10-20)

Arbeitsauftrag und tatsächlicher Stand stehen in
[BRIEF_NACHFOLGE_2026-10-20_gmail.md](BRIEF_NACHFOLGE_2026-10-20_gmail.md).
Gmail/OAuth ist noch nicht implementiert. Neben Telekom/Hetzner ergänzen;
Postfachgestaltung, Original-Mails, Rücknavigation und bestehende Konten erhalten.

Zusätzlicher Auftrag derselben Folgesitzung: Nutzer bestätigt Bildvergrößerung
und Zurück, meldet aber bei „Original öffnen“: „Original nicht erreichbar (Ordner
nicht verbunden). Der Katalog-Eintrag bleibt.“ Diagnose/Behebung und dauerhaften
Originalzugriff prüfen; Vorschau nicht als Original ausgeben. Im Nachfolgebrief
ergänzt. Gmail-Auftrag bleibt bestehen; Fehler bislang nicht behoben.

Weiterer Folgeauftrag: Links aus E-Mails öffnen nach Nutzerrückmeldung nicht im
Browser. Sichere ausdrückliche Browserübergabe prüfen/implementieren, ohne die
Mail-Sandbox oder Skriptsperre aufzuheben. Details im Nachfolgebrief. Insgesamt
drei Aufträge: Originalbilder, Mail-Links, Gmail; Reparaturen noch offen.


## Fortschreibung 2026-10-20: Arbeiten an Vorschau .8

Die drei Folgeaufträge sind jetzt in Implementierung: dauerhafte native Originalkopien
mit Wiederzuordnung älterer Dateien, explizite Browserübergabe aus Text-/HTML-Mail
und native Gmail-Autorisierung/XOAUTH2. Aktuelle Architektur, Grenzen und nötige
Google-Cloud-Konfiguration: [docs/ORIGINALE-LINKS-GMAIL.md](docs/ORIGINALE-LINKS-GMAIL.md).
Frühere „noch nicht implementiert“-Aussagen beschreiben den Ausgangsstand.
Noch keine echte Google-Anmeldung oder neue veröffentlichte APK behaupten; erst
aktuelle CI-/Release-Nachweise prüfen. Bestehende Konten und die PWA erhalten.

## Vorschau .8 veröffentlicht (2026-10-20)

App-Quellstand `484b5dde3d0ad0a488f2a003f098f59069ed0867`, PR #14.
CI 39351614148: 19 Android-Tests und sämtliche Web-/Mailprüfungen bestanden.
Signiertes Update .7 → .8: 39352342121; Veröffentlichung: 39352837471.
Öffentlicher APK-Download bytegleich geprüft. Details/Prüfsumme:
[docs/PRUEFSTAND-ANDROID.md](docs/PRUEFSTAND-ANDROID.md).

Native Originalkopien und Wiederzuordnung älterer fehlender Originale implementiert.
Mail-Links verwenden registrierte Brokeradressen und echte Benutzergesten; nur dafür
`allow-top-navigation-by-user-activation`, keine Skript-/Origin-/Popup-Freigabe.
Gmail-Autorisierung/XOAUTH2 implementiert; echte Anmeldung mangels eigenem
Google-Cloud-Projekt noch unbestätigt. Projekt/OAuth-Client jetzt mit Nutzer einrichten;
keine Geheimnisse im Chat anfordern. Der parallele Kontrolllauf 39351619966 zeigte
einmal ein fehlendes JavaScript-Abbruchsignal im Google-Dialog; Versuch 2 besteht
alle 19 Fälle. Ursache nicht nachgewiesen, am Tablet zusätzlich prüfen. Siehe Prüfstand und Nachfolgebrief, keine vollständige
Gmail-Funktionsgleichheit behaupten. PWA und geschützte Module unverändert.

## Googlemail und Kontowechsel — Vorschau .11 veröffentlicht

Neuester Gerätebefund: Google-Konto gespeichert, danach null/items-Fehler;
Testnachricht weiterhin unversandt. Googlemail-Schreibweise bei Systemkontenauswahl
und bestätigter Wiederanmeldung erhalten, kanonische Domain nur für Vergleich/Cache/
XOAUTH2-Benutzernamen. Nur ausdrückliches Abbrechen der Kontomaske darf im JS-Adapter
null liefern. Keine alten Nachrichten/UIDs/Zähler unter einem anderen Konto zeigen.
Lokale Entwürfe und unklare Versandversuche nicht automatisch senden oder neu anlegen.
Details: [Google-Diagnose](docs/GMAIL-RUECKGABE-DIAGNOSE.md).


Vorschau .11 veröffentlicht: Anwendungscommit `83cb8e3c7072c2af2c5d5e0e5f9b329464be9796`,
CI 39364267954 mit 28 nativen Fällen ohne Fehler/Überspringen, signiertes Update
.10 → .11 39364425049, Veröffentlichung 39365299765. Öffentlicher Download bytegleich.
[APK .11](https://github.com/lausiklauskn-png/Privat-Brain-Pro/releases/download/v0.1.0-preview.11/Private-Brain-Pro-0.1.0-preview.11.apk).
Über bestehende Installation aktualisieren. Nächster echter Geräteversuch:
vorhandenes Googlemail-Konto erneut freigeben, Abruf und ausdrücklich ausgelösten
Versand prüfen. Google-Cloud-Projekt/Client bereits eingerichtet; akzeptierten
Gmail-Testnutzereintrag bestehen lassen. Konto nicht entfernen, nicht automatisch
neu senden. Aktueller [Nachweis](docs/PRUEFSTAND-ANDROID.md#veröffentlichte-vorschau-11--2026-10-20).

## Erweiterte Anbieterauswahl — Vorschau .12 veröffentlicht

Auf Nutzerauftrag sind WEB.DE, GMX, Yahoo und 1&1/IONOS als native Vorlagen ergänzt.
Telekom, Hetzner und Google/Googlemail bleiben erhalten. Microsoft hat laut Nutzer
noch keine eigene Entra-Registrierung; zunächst weitere Anbieter und Microsoft-
Vorbereitung bestätigt. Microsoft-Auswahl öffnet nur einen Einrichtungsplan und
verbindet kein Konto. Kein Microsoft-Passwortweg vortäuschen. Zentrale Vorlagen,
Prüfgrenzen und konkrete nächste OAuth-Schritte: [MAIL-ANBIETER](docs/MAIL-ANBIETER.md).


Vorschau .12 veröffentlicht: Anwendungscommit `4fb2a9a3f2be196fb259cc43a2f77c1f7ab4cf7e`,
CI 39412237956/39412342209 mit 31 nativen Fällen erfolgreich; signiertes Update
.11 → .12 39413230433, Veröffentlichung 39413729351, öffentlicher Download bytegleich.
Die zuerst am Knopf-Großtext gescheiterte Probe 39412634782 betraf nur den Prüfer;
dessen Vergleich wurde korrigiert, dieselbe APK erneut vollständig geprüft.
[APK .12](https://github.com/lausiklauskn-png/Privat-Brain-Pro/releases/download/v0.1.0-preview.12/Private-Brain-Pro-0.1.0-preview.12.apk),
[Nachweis](docs/PRUEFSTAND-ANDROID.md#veröffentlichte-vorschau-12--2026-10-20).
Über bestehende App aktualisieren. Für Microsoft gilt weiterhin: Registrierung
und anschließende OAuth-/STARTTLS-Integration fehlen; nur Einrichtungsplan aktiv.
