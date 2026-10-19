# ZUSATZ-BRIEF an die Nachfolge-Sitzung — Datei-Import, Galerie/Vorschau, Verschlüsselung + KI-Lesen

**Datum:** 2026-07-18 · **Repo:** Privat-Brain · **Branch:** `claude/knotennetz-widget-vollumfang-65inou`
**Freibrief gilt** (CLAUDE.md § Selbst-Merge/Plan-vor-Code). **Kein PII, offline-first, `npm test` = Beweis,
Klaus' Browser-Sichttest bleibt.**

---

## 0. Kontext / Klaus' Wunsch (2026-07-18)

Das Netz-Werkzeug („Mit dem Knotennetz verbinden") ist fertig und live bestätigt (A–C + Fenster-
Minimieren/Schließen + Ziehgriff-Fix, PRs #32/#33/#34 gemergt). **Nächstes Thema (Klaus):** die
**Importierung von Bildern, Videos und anderen Dateien** verbessern — mit kleiner Vorschau + Groß-
Vorschau beim Klick, **so wie in Mein-Rezeptbuch** (die Food-Bilder-Abteilung, viele Bilder „schön
gepackt" importieren). Danach: **weitere Dateiformate lesbar machen und verschlüsseln**, um sie später
**besser mit KI zu lesen** (eigene KI oder eine drübergelaufene KI) — **nach Passwort-Freigabe**.

## 1. WAS SCHON EINGEBAUT IST (geprüft im Code 2026-07-18 — nicht doppelt bauen!)

Private Brain hat den Rezeptbuch-Bild-Weg **bereits**:

- **Import viele Dateien + ganze Ordner:** Drop-Zone `#drop` + `#fileInput multiple` + `showDirectoryPicker`/
  DnD (`index.html` ~Z. 348–358, 1408 f.). Mail-Import separat (`#mailInput`, .mbox/.eml).
- **Kleine Vorschau (Thumbnail):** pro Bild `rec.thumb` = **320 px, 82 %** komprimiert (Canvas→JPEG,
  „exakt das MR-Rezept"), angezeigt als `.thumbimg` 64 px in der Trefferkarte (Z. 240–241, 1339–1343).
- **Groß-Vorschau beim Klick (Lightbox/Vollbild):** `#lightboxBg`/`#lightboxImg` (bis 94vw/78vh) mit
  Knöpfen „↗ Original öffnen · 🧠 Neu beschreiben · 🗑 Löschen · ✕ Schließen" (Z. 243–249, 333–338).
  `rec.preview` = **1024 px, 82 %** fürs Vollbild. **Wiedersehen heilt** fehlende Vorschauen (Z. 1307 ff.).
- **Gepackte Galerie je Kategorie:** die Kategorie-Gruppen rendern als Grid
  `repeat(auto-fill,minmax(150px,1fr))` (`.groups`, Z. 270; Kategorie-Album Z. 1748 ff.) — „Foto" ist
  damit schon eine gepackte Bild-Wand.
- **Dazu:** Mistral-Bildbeschreibung opt-in (`pb-caption.js`), Browser-OCR, PDF-Lesen
  (`image_url`/`document_url`, Z. 2033 f.), Löschen mit Wahl, EXIF (`e2e-exif`).
- **Tests dazu vorhanden:** `e2e-thumb.mjs`, `e2e-features.mjs`, `e2e-eudesc.mjs`, `e2e-delchoice.mjs`,
  `e2e-mailattach.mjs`.

**Fazit:** Bild-Import + kleine + große Vorschau **wie Rezeptbuch = erledigt.** Nicht neu bauen —
**darauf aufbauen.**

## 2. WAS FEHLT / VERBESSERT WERDEN KANN (das ist die Arbeit)

Vorschlag in Stufen — je eigener Commit/PR, `npm test` grün, je eine e2e-Suite:

**Stufe I — eigene „Foto/Alben"-Ansicht + Swipe (Klaus-Entscheid 2026-07-18):**
- **Eigene „Foto/Alben"-Ansicht** bauen (nutzerfreundlicher als die Trefferliste — Klaus' Bild:
  Fotos als Fotos durchblättern, „30 Bilder schön gepackt", unabhängig von einer Suche). Eigener
  Tab/Bereich, **gepacktes Raster** (Masonry/Grid) aller Bilder, optional nach Ordner/Datum/Kategorie
  gruppiert. Nutzt `rec.thumb`.
- **Swipe in die Vollbild-Ansicht** einbauen (◀ ▶ / Wischen) — EIN Mechanismus, der **überall**
  greift (Album UND Trefferliste): Lightbox blättert durch die aktuelle Liste (`rec.preview`/`rec.thumb`).
  So bekommt Klaus beides, geführt vom Album.

**Stufe II — Video-Import (neu):**
- Video (`video/*`, mp4/webm/mov) als eigener Typ: **Poster-Frame** als Thumbnail (per `<video>` +
  Canvas ein Standbild ziehen), Groß-Vorschau spielt das Video ab (`<video controls>` in der Lightbox),
  „↗ Original öffnen". Kein Transkodieren, offline. Fail-soft, wenn der Codec nicht spielt.
- Kein Modell-Zwang: der Steckbrief kommt aus Dateiname/Ordner (+ später optional KI-Beschreibung).

**Stufe III — Weitere Formate lesbar machen:**
- Office/Text-Formate zu durchsuchbarem Text (offline, ohne CDN wo möglich): `.txt/.md/.csv` direkt;
  `.docx`/`.xlsx`/`.pptx` sind ZIP → via `DecompressionStream` entpacken + XML-Text ziehen (Muster wie
  der bestehende Mail-/ZIP-Weg). Ehrlich markieren, was nicht geht. Bild/Handschrift → Text bleibt OCR/
  Mistral (Modul 24 in Sage, falls Rollout gewünscht — dann byte-1:1 + Drift-Guard).

**Stufe IV — Verschlüsselung + KI-Lesen nach Passwort-Freigabe (Klaus' Kern-Wunsch + Entscheide 2026-07-18):**
- **EIN app-weiter Schlüssel, Shamir-gesichert (Klaus 2026-07-18):** die ganze App wird über **ein**
  Master-Passwort ver-/entschlüsselt, mit **Shamir-Recovery** falls das Passwort verloren geht. Modul 20
  Safe kann das bereits: `createVault(password)` legt den Vault an und gibt **Shamir-Anteile** zurück
  (Default 2-von-3), `recoverPassword(shares)` stellt es wieder her, `unlock/lock/hasVault`. Also den
  App-weiten Safe als **einen** Vault nutzen (kein Passwort pro Datei).
- **Auch die Vorschau-Bilder verschlüsseln (Klaus 2026-07-18):** nicht nur Steckbrief/Snippet, sondern
  **auch `thumb`/`preview`** at rest verschlüsseln (AES-256-GCM/PBKDF2 600k über den Safe). Folge (klar
  benennen): die **Foto/Alben-Ansicht ist erst nach dem Entsperren sichtbar** — vorher Platzhalter/Schloss.
  App startet trotzdem normal (offline-first), Entsperren **auf Abruf**.
- **⚠️ KI liest den Klartext VORERST NICHT (Klaus 2026-07-18, ausdrücklich):** Stufe IV baut zunächst
  **nur** die Verschlüsselung — app-weiter Safe + Master-Passwort + Shamir-Recovery + verschlüsselte
  Felder (inkl. `thumb`/`preview`). Das **KI-Klartext-Lesen bleibt bewusst deaktiviert** und wird **erst
  später auf Klaus' ausdrückliche Freigabe** hinzugeschaltet. Also **kein** Klartext-Versand an eine KI in
  diesem Bau — nicht heimlich vorbauen.
- **Später (nach Klaus' Freigabe) — KI-Lesen: mehrere Anbieter, EU als Standard aber abwählbar:** wenn
  freigegeben, darf **nach** Passwort-Entsperrung der Klartext an die **gewählte KI**. **Mehrere Anbieter**
  wählbar, **EU als Default** (Mistral, „🇪🇺 nur EU" vorbelegt an), aber der EU-Default ist **abwählbar**
  (dann auch Nicht-EU) — exakt die Anbieter-/Schlüssel-Mechanik aus dem Netz-Werkzeug Stufe C
  (`SbkimMatch.hybridMatch` / `HYBRID_PROVIDERS`, BYOK, Tresor). **Strikt opt-in, nutzer-ausgelöst,** klar
  benannt, was an welchen Anbieter geht. Nichts verlässt das Gerät ohne diese bewusste Freigabe.

## 3. Datenverträge / Flächen (nur benutzen, NICHT umbauen)

- **Katalog-Satz** `CATALOG[]`: `{hash,name,path,type,ext,date,size,snippet,summary,category,vector,evec,
  tf,tags,dirId, thumb?, preview?}` (index.html ~Z. 700, 2270). `type`/`ext` steuern Bild/PDF/…; ergänze
  `video` konsistent.
- **Bild-Helfer** `imgDataUrl(file, maxPx, quality)` (Canvas→JPEG) — Muster für den Video-Poster.
- **Modul 20** (`window.SbkimSafe`): `putSecret/getSecret/hasSecret/removeSecret` — für die Feld-
  Verschlüsselung. **Kein Klartext at rest.**
- **Modul 04** (`window.SbkimMatch`): `hybridMatch(query,cands,{apiKey,provider,euOnly})` — die KI-Lese/
  Bewertungs-Fläche (EU-Politik gilt). **PROVIDER_MIN_MATCH (0.80) + Andock-Riegel unberührt.**
- **TABU:** Kern-Module 01/02/03/04/05/05b/20/21/23 **byte-1:1** (Drift-Guard). Kein
  `PROTOCOL_VERSION`/`DB_VERSION`-Bump ohne Not. **DB-Suffix `privatbrain` nie ändern.** Bei Shell-/
  Modul-Änderung `sw.js`-Cache hochzählen (aktuell **v28**).

## 4. Akzeptanzkriterien

- `npm test` grün (Drift-Guard + alle e2e). Je Stufe **eine e2e-Suite** (Import/Thumbnail/Lightbox-Swipe/
  Video-Poster/Format-Text/Verschlüsselung-Round-Trip/fail-soft), in `package.json` aufgenommen.
- **Fail-soft & Fremdnutzer-Brille:** ohne Modul/Schlüssel/Codec bleibt die App voll nutzbar; klar
  benannt, was fehlt und was (bei KI) wohin geht.
- **Ehrlich:** Live-Bild/Video/KI nur am Tablet beweisbar — kein „grün" ohne Klaus' Browser-Lauf.

## 5. Reihenfolge-Vorschlag

I (Galerie-Swipe) → II (Video) → III (Formate) → IV (Verschlüsselung + KI-Lesen). I–III sind reine
App-Features (schnell, sichtbar); IV ist sicherheits-sensibel → **vor größerem Bau kurz Plan an Klaus**
(Was wird verschlüsselt, wann geht welcher Klartext an welche KI). Der Rest läuft unter Freibrief.

## 6. Pflichtlektüre VOR dem Bau (Reihenfolge)

1. `CLAUDE.md` (Verfassung, Freibrief, DB-Suffix, Design-Vorgabe, Stufen-Fahrplan 1/3).
2. Dieser Brief + `BRIEF_NACHFOLGE_2026-07-18_siegel-stufe-d.md` (Siegel bleibt separat) +
   `BRIEF_NACHFOLGE_2026-07-18_netzwerkzeug-voll.md`.
3. In `index.html` die Bild-Wege: `imgDataUrl`, `#lightboxBg`/Lightbox-Handler, Kategorie-Album
   (`.groups`), Import (`#drop`/`#fileInput`/DirectoryPicker), `pb-caption.js`.
4. `README.md` (Stand Import/OCR/EU-KI) + `modules/20_schluessel_safe.js` (Verschlüsselung) +
   `modules/04_match.js` (`hybridMatch`, EU-Politik).

## 7. Klaus' Entscheidungen (2026-07-18) — schon geklärt, NICHT neu fragen

- **Galerie:** eigene **„Foto/Alben"-Ansicht** (nutzerfreundlicher als die Trefferliste) + **Swipe in
  der Vollbild-Ansicht** als EIN Mechanismus, der auch in der Trefferliste greift. → Stufe I.
- **Verschlüsselung:** **auch die Vorschau-Bilder** (`thumb`/`preview`) verschlüsseln, nicht nur Texte.
  **EIN app-weiter Schlüssel** (ein Master-Passwort für die ganze App), **mit Shamir gesichert** falls
  das Passwort verloren geht (Modul 20 `createVault`→Anteile / `recoverPassword`). → Stufe IV.
- **KI-Lesen:** **mehrere Anbieter**, **EU als Standard** (vorbelegt), aber der EU-Default ist
  **abwählbar** (dann auch Nicht-EU). → Stufe IV.
- **⚠️ KI liest den Klartext VORERST NICHT:** Stufe IV baut nur die Verschlüsselung; das KI-Klartext-
  Lesen bleibt **deaktiviert**, bis Klaus es später ausdrücklich freigibt. → nicht vorbauen.
- **Zeitpunkt:** **Stufen I–IV sind für die nächsten Sitzungen** (Klaus 2026-07-18) — dieser Brief ist
  die Vorbereitung, heute wird davon nichts gebaut.

**Rest-Vorbehalt Stufe IV (sicherheits-sensibel):** trotz geklärter Richtung vor dem Bau kurz den
konkreten **Plan** zeigen (welche Felder wann verschlüsselt/entschlüsselt werden) — dann unter Freibrief
umsetzen. Das KI-Klartext-Lesen ist **kein** Teil dieses Baus.

## 8. Abschluss-Befehl (Brief-Kette reißt nie ab)

Am Sitzungsende: Stand fortschreiben, **neuen** Brief `BRIEF_NACHFOLGE_<datum>_<thema>.md` anlegen
(Stand · geplant · gebaut · Datenverträge · Akzeptanz · Reihenfolge · offene Fragen), **vollständig als
Codeblock im Chat** ausgeben, Pflichtlektüre + diesen Abschluss-Befehl wiederholen. Getestete,
abgegrenzte, nicht-zweifelhafte PRs selbst mergen (Freibrief).
