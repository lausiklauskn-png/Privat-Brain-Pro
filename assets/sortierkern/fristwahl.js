// Erzeugt aus Datei-Organizer lib/fristwahl.ts (scripts/kern-js.mjs). Nicht von Hand ändern.
import { datumeImText } from "./erkennen.js";
import { FRISTWAHL } from "./fristwahl-daten.js";
const KEINE = "\xA7keine";
const W = (s) => s.toLowerCase().match(/[a-zäöüß]{2,}/g) || [];
const HINWEISE = ["bis", "sp\xE4testens", "f\xE4llig", "zahlbar", "termin", "frist", "uhr", "bitte", "\xFCberweisen", "abgebucht", "lastschrift", "einzug", "widerspruch", "einspruch", "erinnerung", "mahnung", "r\xFCcksendung", "k\xFCndigungsfrist", "laufzeit", "g\xFCltig", "vertragsbeginn"];
function tageZwischen(a, b) {
  return Math.round((Date.parse(a) - Date.parse(b)) / 864e5);
}
function eimer(t) {
  return t < -30 ? "<-30" : t < 0 ? "<0" : t <= 7 ? "0-7" : t <= 21 ? "8-21" : t <= 45 ? "22-45" : t <= 120 ? "46-120" : t <= 400 ? "121-400" : ">400";
}
function fristBeispiele(text, regel, datum) {
  const t = text.replace(/\s+/g, " "), n = Math.max(1, t.length), alle = datumeImText(t), gesehen = /* @__PURE__ */ new Map();
  alle.forEach((d) => {
    const g = gesehen.get(d.iso);
    if (g) g.zahl++;
    else gesehen.set(d.iso, { ...d, zahl: 1 });
  });
  if (regel?.wert && /^\d{4}-\d{2}-\d{2}$/.test(regel.wert) && !gesehen.has(regel.wert)) gesehen.set(regel.wert, { iso: regel.wert, pos: -1, zahl: 0 });
  const sicherDatum = datum?.sicher && datum.wert ? datum.wert : void 0;
  const liste = [];
  let k = 0;
  for (const d of gesehen.values()) {
    const f = ["D"];
    if (d.pos >= 0) {
      const vor = W(t.slice(Math.max(0, d.pos - 70), d.pos)).slice(-5), nach = W(t.slice(d.pos + 6, d.pos + 50)).slice(0, 3);
      vor.forEach((x) => f.push("v:" + x));
      if (vor.length) f.push("v1:" + vor[vor.length - 1]);
      nach.forEach((x) => f.push("n:" + x));
      if (/^\S*\s*(?:\S+\s+)?(?:um\s+)?\d{1,2}[:.]\d{2}\s*(uhr)?/i.test(t.slice(d.pos + 6, d.pos + 30))) f.push("uhrzeit");
      if (/(montag|dienstag|mittwoch|donnerstag|freitag|samstag|sonntag|mo|di|mi|do|fr|sa|so)\.?,?\s*(den\s+)?$/i.test(t.slice(Math.max(0, d.pos - 15), d.pos))) f.push("wochentag");
      f.push("lage:" + Math.floor(5 * d.pos / n), "nr:" + Math.min(k, 4));
      if (k === gesehen.size - 1) f.push("letztes");
      if (d.zahl > 1) f.push("mehrfach");
    } else f.push("gerechnet");
    if (sicherDatum) f.push("rel:" + eimer(tageZwischen(d.iso, sicherDatum)));
    else f.push("rel:?");
    if (regel?.wert === d.iso) f.push("rf", "rf:" + regel.sicher);
    liste.push({ key: d.iso, f });
    k++;
  }
  const kf = ["K", "K:regel:" + (regel ? "ja" : "nein"), "K:n:" + Math.min(gesehen.size, 5)];
  const tw = new Set(W(t));
  for (const h of HINWEISE) if (tw.has(h)) kf.push("K:t:" + h);
  liste.push({ key: KEINE, f: kf });
  return liste;
}
function fristWaehlen(text, regel, datum, modell = FRISTWAHL) {
  let best, bs = -Infinity;
  for (const x of fristBeispiele(text, regel, datum)) {
    const s = x.f.reduce((a, y) => a + (modell.gewichte[y] || 0), 0);
    if (s > bs) {
      bs = s;
      best = x;
    }
  }
  if (!best || best.key === KEINE) return void 0;
  if (regel?.wert === best.key) return regel;
  return { wert: best.key, sicher: false, grund: "gelernte Wahl unter den Daten im Text", quelle: "regel" };
}
const FRIST_KEINE = KEINE;
export {
  FRIST_KEINE,
  fristBeispiele,
  fristWaehlen
};
