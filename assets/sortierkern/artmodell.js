// Erzeugt aus Datei-Organizer lib/artmodell.ts (scripts/kern-js.mjs). Nicht von Hand ändern.
import { ARTMODELL } from "./artmodell-daten.js";
const STOPP = new Set("der die das und oder f\xFCr von vom mit bei den dem des ein eine einer eines einem einen ist sind wird wurde werden auf aus zum zur nach bis \xFCber unter ihre ihr ihrem ihren ihres wir sie uns unser unsere unserer bitte danke vielen dank gmbh kg ohg ag mbh tel telefon fax mail www http https iban bic bank blz str stra\xDFe strasse weg platz allee ring nr seite datum eur euro".split(" "));
function artMerkmale(text) {
  const zeilen = text.split(/\r?\n/).map((z) => z.trim()).filter(Boolean);
  const w = (s) => (s.toLowerCase().match(/[a-zäöüß]{3,}/g) || []).filter((x) => !STOPP.has(x));
  const m = /* @__PURE__ */ new Set();
  const an = zeilen.findIndex((z) => /^(sehr geehrte|liebe|lieber|hallo|guten tag|moin)/i.test(z));
  const kopfEnde = an > 0 ? an : Math.min(12, zeilen.length);
  const kopf = w(zeilen.slice(0, kopfEnde).join(" ")), rumpf = w(zeilen.slice(kopfEnde).join(" "));
  const betr = zeilen.filter((z) => /^(betreff|betr\.|re:|aw:|wg\.|subject)/i.test(z));
  if (an > 0) betr.push(...zeilen.slice(Math.max(0, an - 2), an));
  for (const x of kopf) m.add("k:" + x);
  for (const x of w(betr.join(" "))) m.add("b:" + x);
  for (const x of [...kopf, ...rumpf]) m.add("t:" + x);
  for (const x of w(zeilen.slice(-6).join(" "))) m.add("e:" + x);
  if (an >= 0) m.add("x:anrede");
  if (/^(von|from):/im.test(text)) m.add("x:mail");
  if (/(?<![\d,.])19(?:[.,]0{1,2})?\s?%/.test(text)) m.add("x:19");
  if (/(?<![\d,.])7(?:[.,]0{1,2})?\s?%/.test(text)) m.add("x:7");
  if (/\d+[.,]\d{2}\s*(€|eur)/i.test(text)) m.add("x:betrag");
  if (zeilen.length < 15) m.add("x:kurz");
  else if (zeilen.length > 60) m.add("x:lang");
  return [...m];
}
function artVorhersage(text, modell = ARTMODELL) {
  const ms = artMerkmale(text), s = new Array(modell.klassen.length).fill(0), treffer = [];
  for (const f of ms) {
    const g = modell.gewichte[f];
    if (!g) continue;
    treffer.push(f);
    for (let i = 0; i < g.length; i += 2) s[g[i]] += g[i + 1];
  }
  if (treffer.length < 2) return void 0;
  let a = 0;
  for (let k = 1; k < s.length; k++) if (s[k] > s[a]) a = k;
  let b = a ? 0 : 1;
  for (let k = 0; k < s.length; k++) if (k !== a && s[k] > s[b]) b = k;
  const anteil = (f) => {
    const g = modell.gewichte[f];
    for (let i = 0; i < g.length; i += 2) if (g[i] === a) return g[i + 1];
    return 0;
  };
  const grund = treffer.filter((f) => !f.startsWith("e:")).map((f) => [f, anteil(f)]).sort((x, y) => y[1] - x[1]).slice(0, 3).filter(([, v]) => v > 0).map(([f]) => f.slice(2));
  return { wert: modell.klassen[a], zweites: modell.klassen[b], abstand: s[a] - s[b], grund };
}
const ARTMODELL_VOR_REGEL = 8;
const ARTMODELL_MIN = 2;
const ARTMODELL_SICHER = 25;
export {
  ARTMODELL_MIN,
  ARTMODELL_SICHER,
  ARTMODELL_VOR_REGEL,
  artMerkmale,
  artVorhersage
};
