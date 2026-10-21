# Brief für Codex: dort weitermachen, wo die archivierte Sitzung aufhörte (2026-10-21)

Klaus: *„Die Verbindung zu Codex ist abgebrochen, die Arbeit wurde unterbrochen an Private Brain Pro …
dass er da nochmal anfangen soll, wo er aufgehört hat bei der letzten Sitzung, die ich archiviert habe.“*

Zusammengestellt von einer Claude-Sitzung aus GitHub (PRs, Kommentare, Branches, Workflow-Läufe,
Releases). Sie kann nur sehen, was gepusht ist.

## 1. Wo Codex in diesem Repo aufgehört hat (belegt)

- **Letzter Codex-Schritt:** Commit `ea8a44a` direkt auf main (2026-10-21 09:23 UTC), „Vorschau .19:
  signiertes Update und öffentliche APK dokumentieren“. CI 39576646240 und 39576646248 sind grün.
- **Vorschau .19 ist vollständig veröffentlicht:** Tag `v0.1.0-preview.19` auf `418ff2e`, Release-Lauf
  39575223652 ✅, die Updateprobe .18 → .19 hat bestanden, und die öffentliche APK ist bytegleich geprüft.
- **Offene Arbeit von Codex auf GitHub:** keine. Es gibt keinen offenen Codex-PR, keinen `codex/*`-Branch
  mit Inhalt, der nicht auf main ist, und keinen roten oder abgebrochenen Release-Lauf.
  - `codex/preview18-core-validation` liegt schon auf main, als .18-Tag.
  - Die übrigen `codex/*`-Branches gehören zu übernommenen PRs (#35–#41, #43, #45).
- **Nicht sichtbar:** Arbeit, die nie gepusht wurde, oder eine Sitzung in einem anderen Repo, etwa
  Workflow-PDF-Pro, auf das diese Sitzung keinen Zugriff hatte.
  → **Zuerst im eigenen Arbeitsstand nachsehen** (`git status`, `git stash list`, lokale Branches,
  ungepushte Commits), in Privat-Brain-Pro **und** in Workflow-PDF-Pro.

## 2. Was seit .19 auf main dazugekommen ist (von Claude, alles CI-grün)

| PR | Inhalt |
|---|---|
| #48 | Plan „Ordnen, Sortieren, Suchen“, „👥 Alle Konten“ (Index aller Konten, 12 Monate, Überschreiben statt Doppeln), A1 Absender-Bündel, A2 Aufräumen nach Ablaufdatum mit Rückgängig |
| #50 | A3 Explorer neueste oben/↕/Inhaltssuche, A4 Kategorien per Vorschlag, flache Knöpfe überall, obere Leiste platzsparend |
| #51 | Siegel als runder Knopf (Modul 17 byte-1:1, zieh- und einrastbar), Mycel = Kanon `23_rendezvous_ui.js` (byte-1:1, gepinnt) im Siegel-Fenster, `net-widget.js` entfernt |
| neu | Siegel beim ersten Start oben rechts, **Versionserhöhung auf .20** (`versionCode 20`, `0.1.0-preview.20`) |

Neue native Java-Teile: `MailIndex.java`, `MailEngine.index/indexText/locate`, `ProMailPlugin`
(`index`, `indexText`, `locate`). Neue Seiten-Dateien, die in `prepare-web.mjs` eingetragen sind:
- `native-mail-index.js`
- `native-mail-expiry.js`
- `native-categories.js`
- `native-mycel.js`
- `native-seal-place.js`

## 3. Dein Auftrag, in dieser Reihenfolge

1. **Ungepushte Arbeit der archivierten Sitzung sichern** (siehe 1.) und Klaus kurz sagen, was es war.
2. **Vorschau .20 veröffentlichen**, falls die Claude-Sitzung den Tag nicht setzen durfte. Claude-Sitzungen
   bekommen beim Tag-Push oder beim Release-Start bisher 403. Ablauf nach `docs/VEROEFFENTLICHEN.md`:
   - Auf main muss die Versionserhöhung .20 stehen.
   - Den grünen `native-smoke` des tatsächlichen main-Commits abwarten.
   - Den Tag `v0.1.0-preview.20` exakt auf diesen Commit setzen. `android-release.yml` macht dann
     Signatur, Updateprobe .19 → .20 und Veröffentlichung.
   - Danach `docs/PRUEFSTAND-ANDROID.md` und den oberen Anker in `CLAUDE.md` nachtragen, so wie in `ea8a44a`.
   - Schwerpunkt der Updateprobe: Bestehende Daten müssen bleiben. Ein Siegel, das jemand schon
     verschoben hat, bleibt, wo es war; die neue Startlage oben rechts gilt nur ohne gespeicherte Lage.
   - Neu sind die WebView-Schlüssel `mailRemotes`, `mailTrashed`, `mailKeep`, `pb_topics`,
     `sbkim_widget_position__root`. Das bisherige Kontoformat ist unverändert.
3. **Offene Punkte aus deinem Bereich**, nach Rücksprache mit Klaus:
   - Die alten vier Signier-Secrets sind zur Löschung freigegeben. Ob sie schon gelöscht sind, ist unbekannt.
     `PB_SIGNING_UNLOCK` behalten.
   - **A5:** In Workflow PDF Pro den Knopf „An Private Brain“ einbauen, über Android-Teilen
     (`ACTION_SEND`, nur PDF). Die Empfangsseite in Private Brain Pro ist noch nicht gebaut; sie wird
     abgestimmt, sobald die Sendeseite steht.
   - **405 beim Teilen an Workflow PDF (PWA) und Workflow PDF Pro (native)**, gemeldet von Klaus 2026-10-21:
     Android bietet die App im Teilen-Menü an, nach dem Tippen erscheint „405 Not Allowed“. Das ist die Antwort
     von GitHub Pages auf ein POST. Vermutung: das `share_target` im Manifest schickt per POST an eine Adresse,
     die kein Service Worker abfängt (SW nicht aktiv, falscher `scope` oder `action`, oder die Pro-App lädt
     dieselbe Adresse aus dem Netz). Bitte in beiden Workflow-PDF-Repos prüfen und reparieren; Private Brain Pro
     ist hier nur der Absender.
   - Die alten Inline-Befunde des Review-Bots auf PR #11–#21 sind ungeprüft. Seit etwa #26 meldet der
     Bot „Codex usage limits“. Beispiele:
     - #14 P1 „Stream large originals…“
     - #14 P2 „Revoke Gmail authorization when removing an account“
     - #16 P1 „Avoid loading the full stored PDF into the WebView“

     Prüfen, ob sie erledigt sind.
4. **Nicht anfassen:**
   - Modul 17 und 23-UI bleiben byte-1:1. Die Pro-Anzeige steckt nur in `native/native.css` und
     `native-mycel.js`.
   - Die PWA bleibt, wie sie ist.
   - Keinen neuen Vorschau-Schlüssel erzeugen.
   - PR #47 (Benutzerhandbuch, Entwurf, Claude) ist noch offen und liegt hinter main.

## 4. Verbindlich

- Klaus ist kein Programmierer und bedient meist einhändig. Er bekommt Vorschauen als Link.
- Nichts löschen oder verschieben ohne Zustimmung und Rückweg.
- Nie „virenfrei“ schreiben.
- Vor jeder Arbeit `git fetch` und von `origin/main` abzweigen.
- Am Tablet ist bisher nichts gemessen; das bleibt so stehen, bis Klaus es bestätigt.
