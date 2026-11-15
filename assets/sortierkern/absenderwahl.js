// Erzeugt aus Datei-Organizer lib/absenderwahl.ts (scripts/kern-js.mjs). Nicht von Hand ändern.
import { englischesFeld, nameAusZeile, ocrRand } from "./erkennen.js";
import { ABSENDERWAHL } from "./absenderwahl-daten.js";
const norm = (s) => s == null || s === "" ? "" : String(s).toLowerCase().replace(/\b(gmbh|ag|e\.?\s?k\.?|kg|ohg|mbh|e\.?\s?v\.?|co\.?|&|und)\b/g, " ").replace(/[^a-zäöüß0-9]+/g, " ").trim();
const ADR = /\b\d{5}\b|postfach|straße|strasse|str\.|weg\s*\d|platz\s*\d|gasse|allee/i;
const US_ORT = /,\s*[A-Z]{2}\s+\d{5}(-\d{4})?\s*$/;
const IMPRESSUM = /\b(hrb|hra|amtsgericht|registergericht|ust-?id|steuernummer|geschäftsführ|vorstand|sitz der gesellschaft|bankverbindung)\b/i;
const GRUSS = /(grüße|grüßen|gruß|grüsse|hochachtungsvoll|herzlichst)/i;
function absenderKandidaten(text) {
  const zeilen = text.split(/\r?\n/).map((z) => z.trim()).filter(Boolean), n = zeilen.length, k = /* @__PURE__ */ new Map();
  zeilen.forEach((z, i) => {
    if (i >= 25 && i < n - 10) return;
    for (const fuss of [false, true]) {
      let c = "";
      try {
        c = nameAusZeile(ocrRand(z), fuss);
      } catch {
        c = "";
      }
      if (c && c.length >= 3 && c.length <= 80 && !englischesFeld(c) && !US_ORT.test(z)) {
        const key = norm(c);
        if (key && !k.has(key)) k.set(key, { wert: c, i, zeile: z, fuss });
      }
    }
  });
  return { zeilen, k };
}
function kandidatMerkmale(c, zeilen, regel) {
  const f = [], n = zeilen.length, i = c.i, z = c.zeile, w = c.wert;
  const oben = i < 25, pos = oben ? "o" + Math.min(i, 12) : "u" + Math.min(n - 1 - i, 9);
  f.push("pos:" + pos, "fuss:" + c.fuss);
  const woerter = w.toLowerCase().match(/[a-zäöüß]{3,}/g) || [];
  for (const t of woerter) f.push("w:" + t);
  if (woerter[0]) f.push("w0:" + woerter[0]);
  f.push("len:" + Math.min(w.split(/\s+/).length, 6));
  if (/\d/.test(w)) f.push("ziffer");
  if (w === w.toUpperCase() && /[A-ZÄÖÜ]{3}/.test(w)) f.push("gross");
  if (/^(herr|frau|herrn|familie|an)\b/i.test(z)) f.push("empf");
  if (/ - |·|\|/.test(z) && ADR.test(z)) f.push("zeileMitAdresse");
  if (ADR.test(zeilen[i + 1] || "") || ADR.test(zeilen[i + 2] || "")) f.push("adrDarunter");
  if (IMPRESSUM.test(z)) f.push("impressum");
  if (IMPRESSUM.test(zeilen.slice(Math.max(0, i - 2), i + 3).join(" "))) f.push("impressumNah");
  if (GRUSS.test(zeilen[i - 1] || "") || GRUSS.test(zeilen[i - 2] || "")) f.push("nachGruss");
  if (/^(betreff|betr|ihre?|unser|zur|zum|vom|nr|rechnung|mahnung|bescheid|kündigung)\b/i.test(w)) f.push("betreffartig");
  if (/^[A-ZÄÖÜ][a-zäöüß]+ [A-ZÄÖÜ][a-zäöüß]+$/.test(w)) f.push("personartig");
  if (regel.kopf && norm(regel.kopf.wert) === norm(w)) f.push("rk", "rk:" + regel.kopf.sicher);
  if (regel.gruss && norm(regel.gruss.wert) === norm(w)) f.push("rg", "rg:" + regel.gruss.sicher);
  if (!regel.kopf && !regel.gruss) f.push("keineRegel");
  if (oben && regel.kopf) f.push("pos+rk:" + pos);
  return f;
}
function absenderBeispiele(text, regel) {
  const { zeilen, k } = absenderKandidaten(text);
  for (const r of [regel.kopf, regel.gruss]) if (r?.wert && !k.has(norm(r.wert))) k.set(norm(r.wert), { wert: r.wert, i: 0, zeile: r.wert, fuss: false });
  return [...k.entries()].map(([key, c]) => ({ key, wert: c.wert, f: kandidatMerkmale(c, zeilen, regel) }));
}
function absenderWaehlen(text, regel, modell = ABSENDERWAHL) {
  const liste = absenderBeispiele(text, regel);
  let best, bs = -Infinity;
  for (const x of liste) {
    const s = x.f.reduce((a, y) => a + (modell.gewichte[y] || 0), 0);
    if (s > bs) {
      bs = s;
      best = x;
    }
  }
  if (!best) return void 0;
  return { wert: best.wert, sicher: false, grund: "gelernte Wahl unter den Zeilen des Schriftst\xFCcks", quelle: "regel" };
}
export {
  absenderBeispiele,
  absenderKandidaten,
  absenderWaehlen,
  kandidatMerkmale
};
