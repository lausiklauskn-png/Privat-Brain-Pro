// Private Brain alt (CATS/suggestCategory aus index.html, unverändert herausgelesen) gegen Sortier-Kern (kern-js, siebe bis Stufe 5).
// Soll = Mehrheit der Einordner je Feld (SOLL.json oder ERWARTUNG/ZWEITER/DRITTER). Aufruf: node messen-pb-kern.mjs <do-repo> <stapel> <pb-repo>
import { readFileSync, existsSync, readdirSync } from "node:fs"; import { join, resolve } from "node:path"; import vm from "node:vm";
const DO = resolve(process.argv[2]), S = resolve(process.argv[3]), PB = resolve(process.argv[4]);
const { siebe } = await import(join(DO, "kern-js/siebe.js")); const { wilson, mcnemar } = await import(join(DO, "scripts/statistik.mjs"));
const html = readFileSync(join(PB, "index.html"), "utf8");
const stueck = (a, e) => { const i = html.indexOf(a), j = html.indexOf(e, i); if (i < 0 || j < 0) throw new Error(a); return html.slice(i, j); };
const ctx = {}; vm.createContext(ctx);
vm.runInContext([stueck("function extOf(name){", "\n"), stueck("function fold(s){", "\n}\n") + "\n}", stueck("const CATS = [", "function catIcon"), "this.suggestCategory = suggestCategory;"].join("\n"), ctx);
const lese = (p) => JSON.parse(readFileSync(p, "utf8"));
let quellen;
if (existsSync(join(S, "SOLL.json"))) quellen = [new Map(lese(join(S, "SOLL.json")).dateien.map((x) => [x.datei, x]))];
else quellen = ["ERWARTUNG.json", "ZWEITER.json", "DRITTER.json"].filter((f) => existsSync(join(S, f))).map((f) => new Map(lese(join(S, f)).dateien.map((x) => [x.datei, x])));
const feldVon = (x, f) => x ? (f === "bereich" ? x.bereich ?? x.kategorie : x[f]) ?? "" : undefined;
const mehr = (d, f) => { const v = quellen.map((m) => feldVon(m.get(d), f)).filter((v) => v !== undefined); if (quellen.length === 1) return v[0]; const z = {}; v.forEach((x) => z[x] = (z[x] || 0) + 1); const t = Object.entries(z).find(([, n]) => n >= 2); return t ? t[0] : null; };
const norm = (s) => String(s || "").toLowerCase().replace(/\b(gmbh|ag|kg|e\.?\s?v|gbr|ohg|mbh|co|eg|se|ug)\b/g, "").replace(/[^a-z0-9äöüß]/g, "");
const PB_AUS_KERN = { Rechnung: "Rechnung", Vertrag: "Vertrag", Kündigung: "Vertrag", "Angebot/Werbung": "Angebot" };
const GLEICH = { Rechnung: "Rechnung", Vertrag: "Vertrag", Kündigung: "Vertrag", "Angebot/Werbung": "Angebot" };
const z = { art3: { alt: [0, 0], neu: [0, 0], b: 0, c: 0 }, falschAlsDrei: { alt: 0, neu: 0, n: 0 }, rechnung: { alt: [0, 0, 0], neu: [0, 0, 0] }, artAlle: [0, 0], bereich: [0, 0], absender: [0, 0], frist: [0, 0] };
for (const datei of quellen[0].keys()) {
  if (!existsSync(join(S, datei))) continue;
  const text = readFileSync(join(S, datei), "utf8"), name = datei.replace(/\.txt$/, ".pdf");
  const alt = ctx.suggestCategory(name, text);
  const d = siebe({ pfad: name, name, art: "pdf", groesse: text.length, geaendert: 0, kopfText: text.slice(0, 1500), volltext: text, felder: {}, stufe: 1 }, 5);
  const f = d.felder, neuArt = f.schriftstueck?.wert, neuPb = PB_AUS_KERN[neuArt] || "(andere)";
  const sArt = mehr(datei, "schriftstueck");
  if (sArt) {
    z.artAlle[1]++; if (neuArt === sArt) z.artAlle[0]++;
    if (GLEICH[sArt]) { const okA = alt === GLEICH[sArt], okN = neuPb === GLEICH[sArt]; z.art3.alt[1]++; z.art3.neu[1]++; if (okA) z.art3.alt[0]++; if (okN) z.art3.neu[0]++; if (okA && !okN) z.art3.b++; if (okN && !okA) z.art3.c++; }
    else { z.falschAlsDrei.n++; if (Object.values(GLEICH).includes(alt)) z.falschAlsDrei.alt++; if (Object.values(GLEICH).includes(neuPb)) z.falschAlsDrei.neu++; }
    // Rechnung: [richtig gefunden, Soll-Rechnungen, als Rechnung vorgeschlagen]
    for (const [k, w] of [["alt", alt], ["neu", neuPb]]) { if (sArt === "Rechnung") { z.rechnung[k][1]++; if (w === "Rechnung") z.rechnung[k][0]++; } if (w === "Rechnung") z.rechnung[k][2]++; }
  }
  const sb = mehr(datei, "bereich"); if (sb) { z.bereich[1]++; if (f.kategorie?.wert === sb) z.bereich[0]++; }
  const sa = mehr(datei, "absender"); if (sa) { z.absender[1]++; const a = f.absender?.wert; if (a && a !== "unbekannt" && (norm(a).includes(norm(sa)) || norm(sa).includes(norm(a))) && norm(a).length > 2) z.absender[0]++; }
  const sf = mehr(datei, "frist"); if (sf !== null && sf !== undefined) { z.frist[1]++; if ((f.frist?.wert && f.frist.wert !== "keine Frist" ? f.frist.wert : "") === (sf || "")) z.frist[0]++; }
}
const p = ([a, b]) => { const w = wilson(a, b) || [0, 0]; return `${a}/${b} = ${(100 * a / b).toFixed(1)} % (${Math.round(100 * w[0])}–${Math.round(100 * w[1])} %)`; };
console.log(`\n${S.split("/").pop()} · ${quellen.length === 1 ? "SOLL (Mehrheit E1–E3)" : quellen.length + " Einordner, Mehrheit"}`);
console.log(`Art Rechnung/Vertrag/Angebot  alt ${p(z.art3.alt)} · neu ${p(z.art3.neu)} · nur alt ${z.art3.b}, nur neu ${z.art3.c}, McNemar p=${mcnemar(z.art3.b, z.art3.c).toFixed(4)}`);
console.log(`andere Art fälschlich als eine der drei  alt ${z.falschAlsDrei.alt}/${z.falschAlsDrei.n} · neu ${z.falschAlsDrei.neu}/${z.falschAlsDrei.n}`);
console.log(`Rechnung gefunden  alt ${z.rechnung.alt[0]}/${z.rechnung.alt[1]} (vorgeschlagen ${z.rechnung.alt[2]}) · neu ${z.rechnung.neu[0]}/${z.rechnung.neu[1]} (vorgeschlagen ${z.rechnung.neu[2]})`);
console.log(`nur Kern: Art (alle Arten) ${p(z.artAlle)} · Bereich ${p(z.bereich)} · Absender ${p(z.absender)} · Frist ${p(z.frist)}   (alt: keines dieser Felder)`);
