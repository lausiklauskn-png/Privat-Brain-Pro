# Private Brain

## Arbeitsbereiche

- **Suche** ist die Startseite. Die vorhandene Bedeutungssuche und das Embedding-Modell
  durchsuchen den gemeinsamen Katalog aus E-Mails, Dokumenten und Bildern. Treffer
  erscheinen darunter als Karten. Der einmalige Suchknopf in der Hauptnavigation führt von jeder Ansicht
  zurück zur Suche; die Suchfrage bleibt beim Seitenwechsel erhalten.
  Auf anderen Seiten heißt dieser Knopf ausdrücklich **← Zur Suche**.
  Browser-Zurück/Vorwärts und direkte Ansichten wie `#intake` oder `#explorer`
  stellen die jeweilige Seite wieder her; nur die Suchstartseite trägt das Suchfeld.
- **Dateien hinzufügen** enthält Datei-/Mailimport, Ordnerverbindung und die lokale
  Kopienablage. Mit **Ablageordner wählen** einen separaten Ordner auf dem eigenen Gerät
  freigeben. Danach werden neue Importe zuerst dorthin kopiert und anschließend
  katalogisiert. Gleicher Name mit anderem Inhalt erhält einen Namenszusatz; vorhandene
  Dateien werden nicht überschrieben. **Kopieren ausschalten** beendet diesen Modus.
- **Explorer** zeigt die katalogisierten Dateien mit Ordnernavigation, Dateifilter,
  Sortierung und **Öffnen**. Bei verbundenen Ordnern und gespeicherten Kopien liest er
  die Datei erneut aus dem lokalen Ordner. Der Katalog enthält Verweise und Steckbriefe;
  die Kopien werden weder in die HTML-Datei noch in GitHub geschrieben.
- **Postfach** ergänzt diese drei Datei-Ansichten mit dem Aufbau des Sende-Prüfers:
  Ordner links, Nachrichtenliste in der Mitte und Lese-/Schreibbereich rechts. Auf
  kleinen Touch-Bildschirmen wechseln Liste und Nachricht mit einem Zurück-Knopf.
  Eingang, Entwürfe, Postausgang, Gesendet, Archiv, Spam, Papierkorb, Exportiert und
  eigene Ordner sind lokale Ansichten desselben Katalogs. Antworten, Weiterleiten
  samt verfügbaren Anhängen, Auswahl/Verschieben, Rückgängig, Sterne, Lesestatus und
  Entwürfe funktionieren lokal. Löschen verändert keine Datei im Geräteordner.

**Mailversand:** Es ist weiterhin kein Gmail-/IMAP-/SMTP-Konto verbunden. Der
Postausgang ist eine lokale Vormerkung; **Exportiert** ist ausdrücklich nicht
**Gesendet**. „Entwurf als .eml übergeben“ erzeugt eine adressierte MIME-Datei mit
`X-Unsent: 1`; diese im vorhandenen Mailprogramm öffnen und dort versenden. Eine
fehlende Originalquelle wird beim Prüfen benannt und vor einem reinen Textexport
ausdrücklich abgefragt. Fehlende bekannte Anhänge verhindern den Export.

**Prüfung und KI:** Der Mail- und Anhangsprüfer sowie die Pseudonymisierung stammen
unverändert aus `Sende-Pruefer` (Modul 25 und drei Prüfdateien, SHA-256 im
Drift-Guard). Die Prüfungen sind Regel-/Strukturprüfungen, kein Virenscanner. Ohne
lokal verfügbare OCR-/PDF-Text-Werkzeuge bleiben entsprechende Inhalte ausdrücklich
ungeprüft. Die Mailansicht führt keine Anhänge und kein Mail-HTML aus und lädt keine
enthaltenen Bilder oder Links nach. Die KI-Vorschau verdeckt erkannte Angaben;
Namen werden aus Kopfzeilen und eigener Liste übernommen, indirekte Angaben können
stehen bleiben. Manuell prüfen. Kopieren oder Mistral nur bei Klick, ohne Anhänge;
für Mistral wird ausschließlich ein als Mistral konfigurierter Schlüssel verwendet.
Die Platzhalterzuordnung bleibt auf dem Gerät. Provideraufrufe sind in Tests
simuliert; echte Konten und echter Versand sind damit nicht nachgewiesen.

Übersicht, Kategorien, Doppelte und Einstellungen bleiben als ergänzende Werkzeuge
erreichbar. Hell/Dunkel und die bisherigen vier Oberflächensprachen bleiben erhalten.

Die Kopfzeile und die Desktop-/PWA-Icons verwenden wieder das originale 3D-Symbol
(`icon-192.png`, `icon-512.png`). Diese gestalteten Bilder werden nicht neu generiert.
Der Leerzustand behält das flache Vier-Bubble-Symbol als Inline-SVG.
`npm run icons` rendert nur dessen Katalogemblem; die originalen App-Icons bleiben erhalten.
Der historische Generator `tools/make-icons.mjs` wird weiterhin nicht verwendet.

**Tablet und Desktop:** Die Oberfläche ist für Touch und schmale Bildschirme ausgelegt.
Direkte, dauerhafte Verknüpfungen mit frei gewählten Geräteordnern benötigen die
File System Access API, üblicherweise Chrome/Edge auf unterstützten Desktop-Systemen.
Fehlt sie (insbesondere Safari auf iPad/iPhone), bleiben Import, Suche und Sitzungsansicht
nutzbar; die Oberfläche kennzeichnet die Einschränkung. Einzeln gewählte Dateien müssen
nach einem Neustart erneut ausgewählt werden. Es gibt keinen stillen Ersatz durch einen
Upload oder eine als Geräteordner ausgegebene Browserablage. Auch unterstützte Browser
können beim erneuten Öffnen die Ordnerfreigabe erneut verlangen.

Neue Browser-Probe: `CB_CHROMIUM=/usr/bin/chromium node tools/e2e-workspace.mjs`.
Sie prüft Navigation und Überlauf bei 320/768/1280 px, Kopierinhalt, Namenskollisionen,
erneuten Import, E-Mail-/Dokumentsuche, Wiederherstellung, Ordnerwechsel, verweigerte
Freigaben, fehlende Dateien und den Rückfall ohne Ordner-API. Für den Ordnerdialog
verwendet die Probe echte browserverwaltete Verzeichnishandles statt eines nativen
Systemdialogs. Ein Sichttest am echten Tablet und der native Ordnerdialog bleiben offen.

Postfach-Probe: `CB_CHROMIUM=/usr/bin/chromium node tools/e2e-mail-workspace.mjs`.
Gegenprobe: `python3 tools/gegenprobe-mail-workspace.py` verändert ausschließlich
Wegwerfkopien und verlangt den passenden Verhaltensfehler; ein beliebiger Absturz
zählt nicht als gefangene Mutation. Der echte Checkout bleibt unverändert.

Ein **offline, vertrauensstarker Kasten**, der das **Datenchaos einer Firma oder
Person** nach **Bedeutung** durchsuchbar und nutzbar macht — ohne dass Originaldateien
bewegt, verändert oder verloren gehen.

> Wirf deine Dateien hinein → der Kasten liest jede einmal, merkt sich ihre Bedeutung,
> und du findest alles wieder — nach Sinn, nicht nach Dateinamen. Die Originale bleiben
> unangetastet.

## ▶ Die App (Probeversion v0.1 — gebaut 2026-07-15)

Die erste **Probeversion** ist gebaut: eine schlanke, offline-fähige **Browser-PWA**
(eine `index.html`, keine externen Abhängigkeiten). Sie setzt genau den Fluss aus
[`BRIEF_PROBEVERSION.md`](BRIEF_PROBEVERSION.md) um:

**Einwurf → Signieren (mit Fortschritt) → virtuelle Ordnung → Suche mit Umschalter
„Namenssuche ↔ Bedeutungssuche“ — Treffer mit Begründung.**

| Datei | Zweck |
|---|---|
| `index.html` | Die ganze App (offline, installierbar, alles inline) |
| `app-manifest.json`, `sw.js`, `icon-*.png` | PWA-Grundausstattung (installierbar, offline) |
| `impressum.html` | Datenschutz & Impressum (ohne PII) |
| `tools/e2e-test.mjs`, `tools/e2e-compressed.mjs` | Headless-Beweis (echte Chromium-Läufe) |
| `tools/make-brain-icons.mjs` | Flaches Vier-Bubble-Symbol als PWA-Icons rendern (Chromium) |

### Was sie kann (alles offline, ohne Cloud-Pflicht)

- **Echtes Bedeutungs-Modell (neu):** ein neuronales, mehrsprachiges Modell
  (`Xenova/multilingual-e5-small`, Modul 03 aus dem SBKIM-Baukasten, byte-1:1) versteht
  **Synonyme, Umschreibung und Sprachen** — „vehicle“ findet den „Wagen“, „rental contract“
  den „Mietvertrag“. **Selbst gehostet** (Gewichte im eigenen Origin, per GitHub-Action geholt);
  solange das Modell lädt/fehlt, greift der **Stichwort-Rückfall**. Das ist der Unterschied zu
  Metadaten-/Spalten-Sortierung: *Verstehen statt Stichwort.*
- **Zerstörungsfrei:** „Ordner verbinden“ (File System Access API) merkt sich nur einen
  **Zeiger** auf den Ordner — **kein Kopieren, kein Verschieben, kein Löschen**. Fallback:
  „Dateien wählen“ (nur diese Sitzung). Öffnen liest das Original über den Zeiger neu.
- **Signieren einmal je Datei:** SHA-256-Fingerabdruck (Dedupe) · Text aus
  **Text-/PDF-/Office-Dateien** (PDF `FlateDecode` und `.docx/.xlsx/.pptx` werden im
  Browser über `DecompressionStream` entpackt) · **Bild-OCR** über die Browser-Texterkennung,
  wo das Gerät sie mitbringt · Bedeutungs-Vektor + Steckbrief + Kategorie-Vorschlag.
- **Bedeutungssuche:** Cosinus-Vorfilter + BM25 + kleine Synonym-Brücke → Treffer **mit
  Begründung** (welches Wort wo traf: Name / Inhalt / aus Bild-Text) + Schnipsel + „Öffnen“.
  Suche in **Millisekunden**.
- **Virtuelle Ordnung:** aufgeräumte Gruppen (Rechnung / Vertrag / Foto / …) — **nur
  Vorschlag**, es wird nichts bewegt.
- **Doppelte-Finder:** gleicher Inhalt an mehreren Stellen (per Fingerabdruck erkannt,
  auch bei anderem Namen — typisch bei mehreren Arbeitsplätzen). **Freiwillige Auswahl**,
  „alle außer je einer" auf einen Klick. Entfernt nur den **Katalog-Eintrag**, nie eine Datei.
- **Ordner aus der App entfernen:** verbundene Ordner werden in den Einstellungen gelistet
  und lassen sich trennen (Einträge raus, Dateien unberührt).
- **Sprachsuche (🎤):** Suchfeld per Mikrofon diktieren (Browser-Spracherkennung, fail-soft).
- **Optionale EU-KI (BYOK):** standardmäßig **aus**. Bild-Texterkennung wahlweise über
  **Mistral OCR (EU)** oder **Google Cloud Vision (EU-Endpunkt)** — nur wenn du bewusst
  einen eigenen Schlüssel hinterlegst; „Nur-EU"-Schalter erzwingt Datenhoheit.
- **Filter & Sortierung:** nach Kategorie, Typ, Zeitraum, Tag filtern; nach Relevanz/Datum/
  Größe/Name sortieren. Leere Suche + Filter = **Stöber-Modus**.
- **Tags & gespeicherte Suchen:** eigene Schlagworte an Dateien; häufige Suchen als Knopf.
- **Mehrere Rechner:** Katalog **vollständig sichern** und auf einem anderen Gerät
  **zusammenführen** → eine durchsuchbare Gesamtsicht. Es reisen nur Steckbriefe, keine Dateien.
- **🌐 Mit Kollegen verbinden (live, server-los) — optional, Standard aus:** über ein „dummes"
  Relais treffen sich mehrere Rechner in einem gemeinsamen Raum und fragen sich **gegenseitig
  die Kataloge live ab** (Modul 23 aus dem SBKIM-Baukasten, byte-1:1). Nur **Fragen und Antworten**
  reisen, **keine Dateien**. Eigene, stabile Identität pro Gerät (`dbSuffix=privatbrain`);
  „🧹 Aufräumen & neu anmelden" heilt Alt-Zustände. Der antwortende Tab muss vorn/wach sein.
- **🧠 KI pro Datei (opt-in):** einen Beleg/ein PDF per **Mistral (EU)** zusammenfassen oder
  gezielt befragen — Datei-Text geht nur bei Klick an die EU-KI.
- **🔀 Neu ordnen (zerstörungsfrei):** legt **Kopien** nach Schema (Kategorie/Jahr/Typ) in einen
  **neuen, leeren Zielordner** (File System Access). Originale bleiben; Rückgängig = Ordner löschen.
  Ein Manifest dokumentiert jede Kopie.

### Ausprobieren

Offline im Browser: `python3 -m http.server 8000` im Ordner starten, dann
`http://localhost:8000/` öffnen (Chrome für „Ordner verbinden“). Oder als GitHub-Pages-
Seite installieren.

### Beweis (headless)

`npm test` fährt die **echte App** in Chromium hoch, signiert echte Dateien und prüft:
Bedeutung schlägt Name, PDF-/DOCX-Text wird gefunden, Dedupe/Doppelte-Finder greift,
Filter/Tags/gespeicherte Suchen, Mehr-Rechner-Merge, Suche < 1 s. Zuletzt grün:
**Drift-Guard + 8 + 3 + 10 + 14 + 7 Prüfungen bestanden (2026-07-15)**.

**Das Bedeutungs-Modell selbst hosten:** GitHub → **Actions → „Embedding-Modell ins Repo
holen" → Run workflow** — das holt die Gewichte (~30 MB) und committet sie unter
`models/…`. Danach lädt die App das Modell aus dem eigenen Origin.

**Ehrlich, nur per Browser/CI prüfbar (nicht headless):** das **echte e5-Modell**
(transformers.js/HuggingFace sind in der Bau-Sandbox gesperrt → die Adapter-/Rang-Logik
ist mit einem eingespritzten Stub bewiesen, die echte Modell-Qualität zeigt sich im Browser
bzw. nach dem Action-Lauf), die **Kopie-in-neuen-Ordner**-Aktion und die **KI-pro-Datei**.
Alle fail-soft. Klaus' Browser-Sichttest am Tablet steht aus.

**„Mit Kollegen verbinden" (Modul 23):** das Relais ist `wss://` und in der Bau-Sandbox
**nicht erreichbar** (wie im ganzen SBKIM-Ökosystem) → headless ist nur die **fail-soft-
Verdrahtung** bewiesen (`e2e-relay.mjs`: Stack lädt, eigene Identität `privatbrain`, Knöpfe,
sauberes Degradieren offline, keine Fehler). Die **echte Live-Suche zwischen zwei Rechnern**
muss Klaus im Browser auf **zwei Geräten** bestätigen — bis dahin „ungeprüft".

## Drei Vertrauens-Säulen

1. **Arbeitet an einer Kopie / liest nur** → Original unantastbar.
2. **Schlägt vor — du bestätigst** → nichts wird eigenmächtig gelöscht.
3. **Sortiert virtuell — bewegt nichts** → keine feste Verlinkung bricht.

## Dokumente

- **[`KONZEPT.md`](KONZEPT.md)** — Vision, wie es technisch läuft, Vergleich zum Markt,
  Kasten-vs-Software, Kosten-Nutzen + Marktanalyse.
- **[`BRIEF_PROBEVERSION.md`](BRIEF_PROBEVERSION.md)** — Anschlussbrief: der Bauauftrag für
  diese Probeversion.

---

*Stand 2026-07-15 · Probeversion v0.1 gebaut. Privat.*

---

## Rechte

Rechteinhaber ist Klaus Nitzsche. Welche Lizenz gilt und welche Rolle die
KI-Werkzeuge hatten, steht in [`RECHTE.md`](RECHTE.md); der Lizenztext in
[`LICENSE`](LICENSE).

## Echte Mailkonten (optional)

Hetzner und Telekom/T-Online können über den privaten IMAP-/SMTP-Dienst auf einem
eigenen Server/NAS verbunden werden. Die GitHub-Pages-App allein ist kein Mailserver.
Einrichtung, Funktionen und Prüfgrenzen: [Mail-Dienst](docs/MAIL-DIENST.md).
Die Kontozugangsdaten gehören ausschließlich in die dortige Einrichtung, nie ins Repository.
