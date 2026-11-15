// Sortier-Kern des Datei-Organizers byte-gleich nach assets/sortierkern/ holen (Klaus 15.11.2026). Nie von Hand ändern:
// Änderungen am Kern gehören in den Datei-Organizer (lib/ → scripts/kern-js.mjs → kern-js/), danach hier neu ziehen.
// Kopiert wird nur, was siebe.js (Einordnung) und erkennen.js brauchen, samt allen Importen.
//   node tools/sortierkern-nachziehen.mjs [<datei-organizer>]   holen und Pin schreiben (Standard ../Datei-Organizer)
//   node tools/sortierkern-nachziehen.mjs --pruefen             nur prüfen, ob die Dateien zum Pin passen (Teil von npm test)
import { readFileSync, writeFileSync, mkdirSync, readdirSync, rmSync, existsSync } from "node:fs";
import { join, resolve } from "node:path"; import { createHash } from "node:crypto"; import { execFileSync } from "node:child_process";
const PB = new URL("..", import.meta.url).pathname, ZIEL = join(PB, "assets/sortierkern"), PIN = join(ZIEL, "HERKUNFT.json");
const sha = (b) => createHash("sha256").update(b).digest("hex");
const EINSTIEG = ["siebe.js", "erkennen.js"];

if (process.argv.includes("--pruefen")) {
  if (!existsSync(PIN)) { console.log("Sortier-Kern: kein Pin"); process.exit(1); }
  const pin = JSON.parse(readFileSync(PIN, "utf8")), da = readdirSync(ZIEL).filter((f) => f.endsWith(".js")).sort();
  const fehler = [];
  if (JSON.stringify(da) !== JSON.stringify(Object.keys(pin.dateien).sort())) fehler.push(`Dateien weichen ab: ${da.join(", ")}`);
  for (const [f, h] of Object.entries(pin.dateien)) if (!existsSync(join(ZIEL, f)) || sha(readFileSync(join(ZIEL, f))) !== h) fehler.push(`${f} weicht vom Pin ab`);
  if (fehler.length) { console.log("Sortier-Kern ROT:\n  " + fehler.join("\n  ") + "\n  → node tools/sortierkern-nachziehen.mjs"); process.exit(1); }
  console.log(`Sortier-Kern: ${da.length} Dateien byte-gleich mit Datei-Organizer ${pin.commit.slice(0, 7)}`); process.exit(0);
}

const DO = resolve(process.argv[2] || join(PB, "../Datei-Organizer")), QUELLE = join(DO, "kern-js");
const herkunft = JSON.parse(readFileSync(join(QUELLE, "HERKUNFT.json"), "utf8"));
const noetig = new Set(), offen = [...EINSTIEG];
while (offen.length) {
  const f = offen.pop(); if (noetig.has(f)) continue; noetig.add(f);
  const t = readFileSync(join(QUELLE, f), "utf8");
  for (const m of t.matchAll(/(?:from|import)\s*\(?\s*["']\.\/([^"']+\.js)["']/g)) offen.push(m[1]);
}
const liste = [...noetig].sort(), dateien = {};
for (const f of liste) { const b = readFileSync(join(QUELLE, f)); if (sha(b) !== herkunft.dateien[f]) throw new Error(`${f} passt nicht zu kern-js/HERKUNFT.json im Datei-Organizer – dort erst node scripts/kern-js.mjs`); dateien[f] = sha(b); }
const git = (...a) => execFileSync("git", a, { cwd: DO, encoding: "utf8" }).trim();
const commit = git("rev-parse", "HEAD"), sauber = git("status", "--porcelain", "--", "kern-js", "lib") === "";
if (!sauber) throw new Error("kern-js/ oder lib/ im Datei-Organizer hat ungesicherte Änderungen – erst committen");
rmSync(ZIEL, { recursive: true, force: true }); mkdirSync(ZIEL, { recursive: true });
for (const f of liste) writeFileSync(join(ZIEL, f), readFileSync(join(QUELLE, f)));
writeFileSync(PIN, JSON.stringify({ quelle: "lausiklauskn-png/Datei-Organizer kern-js/", commit, werkzeug: "tools/sortierkern-nachziehen.mjs", hinweis: "Nie von Hand ändern. Kern im Datei-Organizer pflegen, dann neu ziehen.", dateien }, null, 1) + "\n");
console.log(`Sortier-Kern: ${liste.length} Dateien von Datei-Organizer ${commit.slice(0, 7)} geholt`);
