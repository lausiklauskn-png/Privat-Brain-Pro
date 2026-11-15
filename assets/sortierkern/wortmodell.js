// Erzeugt aus Datei-Organizer lib/wortmodell.ts (scripts/kern-js.mjs). Nicht von Hand ändern.
import { WORTMODELL_ART, WORTMODELL_BEREICH } from "./wortmodell-daten.js";
import { artVorhersage, ARTMODELL_MIN, ARTMODELL_SICHER, ARTMODELL_VOR_REGEL } from "./artmodell.js";
const STOPP = new Set("der die das und oder f\xFCr von vom mit bei den dem des ein eine einer eines einem einen ist sind wird wurde werden auf aus zum zur nach bis \xFCber unter ihre ihr ihrem ihren ihres wir sie uns unser unsere unserer bitte danke vielen dank gmbh kg ohg ag mbh inh inhaber inhaberin tel telefon fax mail www http https iban bic bank konto blz str stra\xDFe strasse weg platz allee ring nr no seite datum eur euro betrag summe gesamt netto brutto mwst ust umsatzsteuer steuernummer ustidnr idnr usb".split(" "));
function merkmale(text) {
  const w = (text.toLowerCase().match(/[a-zäöüß]{3,}/g) || []).filter((x) => !STOPP.has(x)), m = new Set(w);
  for (let i = 0; i + 1 < w.length; i++) m.add(w[i] + " " + w[i + 1]);
  if (/(?<![\d,.])19(?:[.,]0{1,2})?\s?%/.test(text)) m.add("\xA7satz19");
  if (/(?<![\d,.])7(?:[.,]0{1,2})?\s?%/.test(text)) m.add("\xA7satz7");
  return [...m];
}
function vorhersage(modell, ms) {
  const s = modell.vorab.slice(), treffer = [];
  for (const f of ms) {
    const g = modell.gewichte[f];
    if (!g) continue;
    treffer.push(f);
    for (let i = 0; i < g.length; i += 2) s[g[i]] += g[i + 1];
  }
  if (!treffer.length) return void 0;
  let a = 0;
  for (let i = 1; i < s.length; i++) if (s[i] > s[a]) a = i;
  let b = -1;
  for (let i = 0; i < s.length; i++) if (i !== a && (b < 0 || s[i] > s[b])) b = i;
  const wert = (f) => {
    const g = modell.gewichte[f];
    for (let i = 0; i < g.length; i += 2) if (g[i] === a) return g[i + 1];
    return 0;
  };
  const grund = treffer.map((f) => [f, wert(f)]).sort((x, y) => y[1] - x[1]).slice(0, 3).filter(([, v]) => v > 0).map(([f]) => f);
  return { wert: modell.konten[a], zweites: modell.konten[b], abstand: s[a] - s[b], grund };
}
const MODELL_VOR_REGEL = 8;
const MODELL_SICHER = 10;
const wortmodellSchalter = { an: true };
function mitModell(regel, modell, text) {
  if (!wortmodellSchalter.an) return regel;
  const v = vorhersage(modell, merkmale(text));
  if (!v || v.grund.length < 2 || v.wert === "Archiv") return regel;
  const wort = v.grund.length ? `gelernte W\xF6rter: ${v.grund.map((g) => `\u201E${g}\u201C`).join(", ")}` : "gelerntes Wortmodell";
  if (regel?.sicher && regel.wert === v.wert) return regel;
  if (v.abstand >= MODELL_VOR_REGEL || !regel?.sicher)
    return { wert: v.wert, sicher: v.abstand >= MODELL_SICHER, grund: v.abstand >= MODELL_VOR_REGEL ? wort : `${wort} (knapp vor \u201E${v.zweites}\u201C)`, quelle: "regel" };
  return regel;
}
const bereichMitModell = (regel, text) => mitModell(regel, WORTMODELL_BEREICH, text);
function englischerText(text) {
  const t = text.slice(0, 3e3).toLowerCase(), z = (r) => (t.match(r) || []).length;
  const en = z(/\b(the|and|you|your|of|for|from|to|is|are|this|with|amount|paid|due|date|total)\b/g), de = z(/\b(der|die|das|und|sie|ihr|ihre|ist|nicht|mit|für|von|zu|den|dem|bitte|wir)\b/g);
  return en >= 4 && en > 2 * de;
}
function artMitModell(regel, text) {
  if (!wortmodellSchalter.an) return regel;
  if (regel?.sicher && englischerText(text)) return regel;
  const v = artVorhersage(text);
  if (!v) return regel;
  if (regel?.sicher && regel.wert === v.wert) return regel;
  if (!regel?.sicher && v.abstand >= ARTMODELL_MIN || v.abstand >= ARTMODELL_VOR_REGEL) {
    const wort = v.grund.length ? `gelernt: ${v.grund.map((g) => `\u201E${g}\u201C`).join(", ")}` : "gelerntes Art-Modell";
    return { wert: v.wert, sicher: v.abstand >= ARTMODELL_SICHER, grund: v.abstand >= ARTMODELL_SICHER ? wort : `${wort} (knapp vor \u201E${v.zweites}\u201C)`, quelle: "regel" };
  }
  return regel;
}
const artMitWortmodell = (regel, text) => mitModell(regel, WORTMODELL_ART, text);
export {
  MODELL_SICHER,
  MODELL_VOR_REGEL,
  artMitModell,
  artMitWortmodell,
  bereichMitModell,
  englischerText,
  merkmale,
  mitModell,
  vorhersage,
  wortmodellSchalter
};
