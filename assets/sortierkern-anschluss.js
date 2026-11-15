// Anschluss des Sortier-Kerns (Datei-Organizer, byte-gleich unter assets/sortierkern/, nie von Hand ändern) an den Katalog
// von Private Brain (Klaus 15.11.2026, Punkt 1). Jede Datei und jede Mail bekommt rec.kern = Art, Absender, Bereich, Frist,
// Person, Betrag, Datum. Gerechnet wird im Hintergrund in kleinen Portionen, auch für schon Eingelesenes; Originale bleiben
// unberührt, nur der Katalog-Eintrag wird ergänzt. Die alte Kategorie (rec.category) bleibt daneben stehen.
import { siebe } from "./sortierkern/siebe.js";
import { absenderName } from "./sortierkern/eml.js";

const PORTION = 15;
let fassung = "kern";
try { const h = await fetch(new URL("./sortierkern/HERKUNFT.json", import.meta.url)).then((r) => r.json()); fassung = String(h.commit || "kern").slice(0, 12); } catch {}

const isoAus = (v) => { const d = new Date(typeof v === "number" ? v : String(v || "")); return isNaN(d) ? undefined : d.toISOString().slice(0, 10); };
const wert = (w) => (w && w.wert && w.wert !== "unbekannt" && w.wert !== "Unklar" && w.wert !== "keine Frist" ? String(w.wert) : "");

/** Text eines Katalog-Eintrags, so weit der Katalog ihn kennt (Anfang, Ende, Mailtext, Texterkennung, Bildbeschreibung). */
export function textVon(r) {
  return [r.snippet, r.mailBody && !String(r.snippet || "").includes(String(r.mailBody).slice(0, 80)) ? r.mailBody : "", r.ende, r.ocrText, r.caption]
    .filter(Boolean).join("\n").slice(0, 24000);
}

/** Einordnung eines Eintrags. mutter = Mail, aus der ein Anhang stammt (für den Absender, wenn der Anhang keinen sicheren hat). */
export function felder(r, mutter) {
  const text = textVon(r), name = String(r.name || "datei");
  const mail = r.mail && (r.mail.from || r.mail.subject) ? r.mail : null;
  const bild = /^image\//.test(String(r.type || "")) || /^(png|jpe?g|webp|gif|bmp|tiff?|heic)$/i.test(String(r.ext || ""));
  const d = siebe({
    pfad: String(r.path || name), name, art: bild ? "bild" : mail ? "mail" : "pdf", groesse: Number(r.size) || text.length || 1, geaendert: Number(r.date) || 0,
    kopfText: text.slice(0, 1500), volltext: text, felder: {}, stufe: 1,
    ...(mail ? { email: { von: String(mail.from || ""), betreff: String(mail.subject || ""), datum: isoAus(mail.date) } } : {}),
  }, 5);
  const f = d.felder;
  let absender = wert(f.absender), absenderSicher = !!f.absender?.sicher;
  if ((!absender || !absenderSicher) && mutter?.mail?.from) { absender = absenderName(String(mutter.mail.from)); absenderSicher = true; }
  return {
    v: fassung, art: wert(f.schriftstueck), artSicher: !!f.schriftstueck?.sicher, bereich: wert(f.kategorie), bereichSicher: !!f.kategorie?.sicher,
    absender, absenderSicher, frist: wert(f.frist), person: wert(f.betrifft), betrag: wert(f.betrag), datum: wert(f.datum),
  };
}

let laeuft = false, kette = Promise.resolve(0);
/** Alle Einträge ohne (aktuelle) Einordnung nachordnen. Läuft schon ein Durchgang, folgt dieser danach. Gibt die Zahl der geänderten Einträge zurück. */
export function nachordnen(wahl = {}) { kette = kette.then(() => durchgang(wahl), () => durchgang(wahl)); return kette; }
async function durchgang({ alle = false } = {}) {
  if (typeof CATALOG === "undefined") return 0;
  laeuft = true; let n = 0;
  try {
    const nachHash = new Map(CATALOG.map((r) => [r.hash, r]));
    const offen = CATALOG.filter((r) => alle || !r.kern || r.kern.v !== fassung);
    for (let i = 0; i < offen.length; i += PORTION) {
      for (const r of offen.slice(i, i + PORTION)) {
        try { r.kern = felder(r, r.fromMail ? nachHash.get(r.fromMail) : null); n++; if (typeof idbPut === "function") await idbPut("catalog", r); } catch (e) { r.kern = { v: fassung, fehler: String(e && e.message || e).slice(0, 120) }; }
      }
      await new Promise((ok) => (window.requestIdleCallback ? requestIdleCallback(ok, { timeout: 200 }) : setTimeout(ok, 0)));
    }
  } finally { laeuft = false; }
  if (n) window.dispatchEvent(new CustomEvent("pb-kern-geordnet", { detail: { n } }));
  return n;
}

window.PBSortierkern = { felder, nachordnen, textVon, get fassung() { return fassung; } };
// Neu Eingelesenes wird beim nächsten Durchgang mitgeordnet; ohne neue Einträge kostet der Durchgang nur einen Blick in den Katalog.
let bekannt = -1;
setInterval(() => { if (typeof CATALOG !== "undefined" && CATALOG.length !== bekannt && !laeuft) { bekannt = CATALOG.length; nachordnen(); } }, 3000);
setTimeout(() => nachordnen(), 800);
