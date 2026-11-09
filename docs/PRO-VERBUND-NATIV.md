# Freiwillige Zusammenarbeit mit Familienakte und den Pro-Apps

Seit dem 2. November 2026 in **Private Brain Pro 1.0.44** auf Android und Windows
veröffentlicht, aufbauend auf PR #123 und #124.
[Downloads und tatsächliche Plattform-/Paar-Nachweise](PRO-VERBUND-VEROEFFENTLICHUNG-1.0.44.md).
Der übergreifende Familienakte-Abschluss und das Geschenk folgen getrennt nach dem Gesamtbau.

In **Einstellungen → Tresor & Ablage → Zusammenarbeit mit Pro-Apps** lässt sich
auf Android und Windows ein gemeinsamer Pro-Tresor auswählen, öffnen und sperren.
Die eigene Private-Brain-Ablage muss dafür weder eingerichtet noch umgezogen
werden. Einzug der eigenen Ablage bleibt eine separate ausdrückliche Wahl.
Passwörter und gemerkte Schlüssel bleiben in der nativen Schicht: Android
Keystore beziehungsweise Windows DPAPI. Die PWA bietet diesen nativen Weg nicht an.

**Eingang prüfen und übernehmen** nimmt ausgewählte Dateien aus dem gemeinsamen
Eingangsfach über den normalen Datei-/Mailimport auf. Die Grenze beträgt 20 MiB
je Datei. Native Originalbytes werden erneut gelesen und geprüft; erst nach
abgeschlossenem Katalogimport und gespeicherter Quittung schreibt die App die
kanonische Empfängermarke. Fehler und Abbrüche lassen die Quelle offen.
Wiederholen nach Neustart erzeugt keinen zweiten Katalogeintrag.

In der geöffneten Datei führt **An Pro-App …** zur Auswahl von Familienakte Pro,
Workflow PDF Pro oder BookLedgerPro. Workflow nimmt PDF/Bilder, BookLedger
zusätzlich EML, Familienakte die durch ihren Eingang unterstützten Dateien an.
Der Ausgang erhält vor dem Schreiben eine stabile Kennung. Offene Übergaben
lassen sich in den Einstellungen erneut senden. **Weitergegeben – Übernahme offen**
wird erst nach **Bestätigungen prüfen** und einer tatsächlich vorhandenen
Empfängermarke zu **Im Eingang der Ziel-App**. Endgültige Einordnung in eine Akte
oder Buchung wird damit nicht behauptet. Originale und gemeinsame Quellen bleiben
bestehen; veränderte Rückgaben erhalten neue Kennungen mit Bezug zur Quelle.

Die kleine lokale Tabelle `proUebergaben` ergänzt die bestehende Datenbank durch
Versionsanhebung 1 → 2; Datenbankname, Katalog und Ordner bleiben erhalten.
Quittungen werden in die bestehende verschlüsselte Katalogsicherung aufgenommen.
Wiederherstellung prüft Verträge und abgeleitete Kennungen und ergänzt sie in einer
Transaktion; widersprüchliche vorhandene Quittungen werden nicht überschrieben.
Kein Tresorpasswort oder Hauptschlüssel gehört in diese Metadaten.

## Mail mit Anhängen an die Familienakte (Klaus 2026-11-09, Zweig, nicht veröffentlicht)

Bisher kam eine Mail mit PDF-Anhang nur über Androids Teilen-Auswahl in die Familienakte; über den
gemeinsamen Pro-Tresor ging aus dem Datei-Fenster nur der Mailtext als `.txt`. Jetzt:

- **Geöffnete Mail → Nachrichtenaktionen → „An Familienakte teilen“** (neben „An BookLedgerPro teilen“,
  `assets/live-mail.js`, Strichsymbol wie dort). Mit offenem Pro-Tresor geht die **unveränderte `.eml`**
  (MIME mit eingebetteten Anhängen) über den kanonischen Übergabeweg `tresorUebergabe` / Vertrag
  `familienakte-uebergabe/1` ins Fach `eingang-familienakte` (`PBProVerbund.mailAnFamilienakte` in
  `native/native-pro-verbund.js`). Die Quelle kommt aus der geladenen Nachricht (`sourceBase64`) oder, im
  Ordnermodus, neu vom Anbieter über die neue Brückenmethode `ProMail.original` (Android
  `ProMailPlugin.original`, Windows `DesktopService` „original“, `windows/bridge/contracts.json`).
- **Gesperrter Tresor:** erst fragen („Entsperren und weitergeben“ · „Normal teilen“ · „Abbrechen“), nie still.
  **Kein Tresor verbunden:** eine kurze Zeile, dann Androids Teilen-Auswahl mit der `.eml`. Browser: Web Share,
  sonst Download mit Hinweis.
- **Grenze 20 MiB** mit eigener Meldung (der Abruf vom Anbieter endet ohnehin bei 8 MB).
- **Datei-Fenster → „An Pro-App …“ → Familienakte Pro:** ist der Eintrag eine katalogisierte Mail, geht die echte
  `.eml` (`PBProVerbund.mailEml`: Anbieter über die App, sonst die eingelesene `.eml`-Datei); nur wenn keine
  Quelle erreichbar ist, wie bisher der Text.
- Der geteilte Dateiname folgt dem Betreff (`openOriginal` mit `name`, bereinigt; vorher `mail-<id>-mail.eml`).

**Empfang in der Familienakte** (gelesen in `Meine-Familienakte`, nicht geändert): der Vertrag kennt keine
Typ-Liste; `proUebergabePruefen` verlangt nur gleichen Namen, gleichen Typ (`message/rfc822`), ≤ 20 MiB und die
Prüfsumme. „Pro-Eingang prüfen“ → „In Familienakte-Eingang aufnehmen“ legt die `.eml` in die Eingangszentrale;
dort erkennt `lib/central-intake.ts` sie als „E-Mail (.eml)“ und löst die Anhänge auf Knopfdruck heraus
(`extractEmlAttachments`).

Proben: `tools/native/test-pro-verbund.mjs` 42 (neu 8) · `test-mail-device.mjs` 84 (neu 3) ·
`gegenprobe-pro-verbund.mjs` 9/9 (neu 3). Nicht am Gerät, nicht mit echter Familienakte im selben Tresor.

## Umsetzung und Prüfgrenzen

- `ProVerbund.java` ist der gemeinsame Android-/Windows-Adapter des bereits
  gepinnten Pakets `de.familyprojekt.tresor`. Kein neues Verschlüsselungsformat.
- `ProTresorordner` verwendet bestehende SAF-Freigaben; `DesktopProTresor` ergänzt
  dieselben Vorgänge hinter der privaten Windows-Prozessbrücke. Ersatz eines
  ausgewählten Ordners und fremde Tresorkennungen werden abgewiesen.
- Browserprobe: 34 Fälle mit echter IndexedDB und gewöhnlichem Import, darunter
  Datenbankupgrade, Neustart, volle/fehlende Ablage, Transaktionsabbruch,
  veränderte Bytes/Verträge, zweiter Tresor, Quellbezug, Sicherung und Rücknavigation.
  Native Datei-/Dialogschnittstellen sind dort ausdrücklich Testadapter.
- Sechs absichtliche Fehler in Wegwerfkopien müssen durch die zugehörigen
  Verhaltensprüfungen auffallen: vorgezogener Schreibabschluss, vorzeitige
  Empfängermarke, Sitzungsdatei statt frischer Speicherprüfung, Zustellung als
  Bestätigung, fehlende Sicherungsquittungen, Überschreiben bei Wiederherstellung.
- Windows-Java-Engine: 113 bestehende Fälle plus 15 Fälle mit tatsächlichem
  kanonischen Familienakte-Akteur, Originalspeicher und Neustart. Der Test der
  unabhängigen App-Ablage läuft in einem frischen Prozess.
- Neu ergänzt: Android-Instrumentierung mit echtem SAF, Keystore und FPT1;
  Abnahme in der installierten Windows-App einschließlich nativer Dialoge,
  tatsächlicher Rückgabe und DPAPI-Erhalt nach Neustart/Neuinstallation.
  Diese Plattformprüfungen sind auf dem veröffentlichten main-Stand bestanden.

Der lokale vollständige Webbau wird in dieser Cloud durch HTTP 403 beim bestehenden
Anleitungsvideo blockiert. Gezielte Browserproben verwenden die erzeugten Dateien
und vorhandenen lokalen Adapter; das ist kein vollständiger Paketnachweis. Der
reguläre GitHub-Bau lädt und prüft das vollständige Paket. Zusätzlich bestanden
die tatsächlichen Zwei-App-Proben mit Familienakte auf Android API 35 und Windows,
je sechs Prüfabschnitte. Das sind installierte Prüfbuilds auf CI, kein physisches
Tablet/USB-/SD-Laufwerk und kein Nutzer-Windows-PC. Die Auslieferungsfassungen
1.0.44 sind separat geprüft und veröffentlicht, siehe den Nachweis oben.
