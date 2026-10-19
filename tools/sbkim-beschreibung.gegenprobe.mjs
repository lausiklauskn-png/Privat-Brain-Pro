/* Gegenprobe zu `sbkim-beschreibung.smoke.mjs`.
 *
 * Ein Wächter ohne Gegenprobe ist nur ein grüner Haken. Jeder Fall hier baut
 * genau einen Fehler ein, der in diesem Netz schon passiert ist — und jeder
 * MUSS die Probe umwerfen.
 *
 * ⚠ GEPRÜFT WIRD DIE ROTE ZEILE, NICHT „rot ja/nein". Ein Fall, der die Probe
 * an einer FREMDEN Zusicherung umwirft, sieht sonst wie ein Treffer aus und
 * beweist nichts über den gemeinten Wächter (Befund mycel-karte, 2026-09-10).
 * Jeder Fall trägt deshalb ein `trifft`-Muster, und ein Absturz zählt als
 * NICHT gefangen — sonst sieht ein Fehler im Prüfwerkzeug wie ein blinder
 * Wächter aus, und man sucht am falschen Ende.
 *
 * Alles wird am Ende zurückgeschrieben, auch bei Abbruch (finally).
 */
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const WURZEL = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
function finde(namen) {
  const t = [];
  (function geh(d) {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      if (e.name === "node_modules" || e.name === ".git") continue;
      const p = path.join(d, e.name);
      if (e.isDirectory()) geh(p);
      else if (namen.includes(e.name)) t.push(p);
    }
  })(WURZEL);
  return t;
}
const SIEGEL = finde(["siegel-inhalt.js"])[0];
/* ⚠ VIERTE DATEI SEIT A18: der Wizard-Code. Drei Faelle unten zielen dorthin.
   Wer sie nicht mitzieht, bekommt einen TOTEN ANKER — der Fall meldet sich als
   „nicht gefangen", obwohl der Waechter tadellos ist. */
const WIZARD = finde(["sbkim-andock-wizard.js"])[0];
const GLUE = finde(["rendezvous-init.js", "sbkim-init.js"])[0];
const PROBE = finde(["sbkim-beschreibung.smoke.mjs", "sbkim-beschreibung.mjs"])[0];
const sicher = { [SIEGEL]: readFileSync(SIEGEL, "utf8"), [GLUE]: readFileSync(GLUE, "utf8"),
                 [WIZARD]: readFileSync(WIZARD, "utf8") };

function roteZeilen() {
  try { execFileSync(process.execPath, [PROBE], { cwd: WURZEL, stdio: "pipe" }); return []; }
  catch (e) {
    return String(e.stdout || "").split("\n").filter((z) => z.includes("✗ ROT"));
  }
}

const FAELLE = [
  { was: "SBKIM verschwindet aus der Beschreibung",
    trifft: /nennt SBKIM/,
    bauen: () => { for (const f of [SIEGEL, GLUE]) writeFileSync(f, sicher[f].replaceAll("SBKIM", "XKIM"), "utf8"); } },
  /* ⚠ DIESER FALL WAR BEIM ERSTEN LAUF BLIND — und es lag an IHM, nicht am
     Wächter: er ersetzte nur „SBKIM-Mycel", und das Wort steht in der
     Schlagwort-Zeile ein zweites Mal. Eine Sabotage muss genau das treffen,
     was der Wächter misst (Kimhubs siebte Art). */
  { was: "das Mycel wird nicht mehr genannt",
    trifft: /nennt Mycel/,
    bauen: () => { for (const f of [SIEGEL, GLUE]) writeFileSync(f, sicher[f].replaceAll("Mycel", "Verbund"), "utf8"); } },
  { was: "der Knoten wird nicht mehr genannt",
    trifft: /nennt Knoten/,
    bauen: () => { for (const f of [SIEGEL, GLUE]) writeFileSync(f, sicher[f].replaceAll("Knoten", "Station"), "utf8"); } },
  { was: "Sage-Protokol als Herkunft fällt weg",
    trifft: /Sage-Protokol/,
    bauen: () => { for (const f of [SIEGEL, GLUE]) writeFileSync(f, sicher[f].replaceAll("Sage-Protokol", "Handbuch"), "utf8"); } },
  { was: "der Protokoll-Absatz rutscht nach VORN (die Domäne verliert ihren Platz)",
    trifft: /Domäne steht VOR/,
    bauen: () => {
      const m = sicher[SIEGEL].match(/domainDescription:\s*"((?:[^"\\]|\\.)*)"/);
      const t = JSON.parse('"' + m[1] + '"');
      const i = t.indexOf(" Diese App ist zugleich");
      const gedreht = (t.slice(i).trim() + " " + t.slice(0, i).trim());
      const lit = JSON.stringify(gedreht);
      for (const f of [SIEGEL, GLUE])
        writeFileSync(f, sicher[f].replace(/domainDescription:\s*"(?:[^"\\]|\\.)*"/, "domainDescription: " + lit)
                                  .replace(/(var [A-Z_]*DESCRIPTION\s*=\s*)"(?:[^"\\]|\\.)*"/, "$1" + lit), "utf8");
    } },
  { was: "die zwei Wege zur Spore tragen verschiedenen Text",
    trifft: /WORTGLEICH/,
    bauen: () => writeFileSync(GLUE, sicher[GLUE].replace("Diese App ist zugleich", "Diese Anwendung ist zugleich"), "utf8") },
  { was: "die gespeicherte Spore überschreibt den Vorschlag der App wieder still",
    trifft: /still von der Spore überschrieben/,
    bauen: () => writeFileSync(WIZARD, sicher[WIZARD].replace(
      /* ⚠ Anker beim A18-Umzug mitgewandert: im Kanon heisst die
         Konfiguration `c`, nicht `WIZ`. */
      'ta.value = c.domainDescription || "";\n',
      'ta.value = c.domainDescription || "";\n    try { window.SbkimSpore.getOwnSpore().then(function (s) { ta.value = sp.domainDescription; }); } catch (e) {}\n    /* ⚠ WELCHER TEXT'), "utf8") },
  { was: "die Zeile, die die Herkunft nennt, fällt weg",
    trifft: /welcher der beiden Texte im Feld steht/,
    bauen: () => writeFileSync(WIZARD, sicher[WIZARD].replaceAll("data-woher", "data-x"), "utf8") },
  { was: "der Rückhol-Knopf steht IMMER da, nicht nur bei Abweichung",
    trifft: /nur da, wenn der signierte Text wirklich abweicht/,
    bauen: () => writeFileSync(WIZARD, sicher[WIZARD].replace("if (!abweichend) return;", "if (false) return;"), "utf8") },
];

let gefangen = 0, durch = 0, falsch = 0, tot = 0;
try {
  for (const f of FAELLE) {
    for (const d of [SIEGEL, GLUE, WIZARD]) writeFileSync(d, sicher[d], "utf8");
    f.bauen();
    const geaendert = [SIEGEL, GLUE, WIZARD].some((d) => readFileSync(d, "utf8") !== sicher[d]);
    if (!geaendert) { tot++; console.log("  ⚠ ANKER NICHT GEFUNDEN:", f.was); continue; }
    const zeilen = roteZeilen();
    if (!zeilen.length) { durch++; console.log("  ✗ NICHT GEFANGEN:", f.was); }
    else if (!zeilen.some((z) => f.trifft.test(z))) {
      falsch++; console.log("  ⚠ AUS DEM FALSCHEN GRUND:", f.was, "→", zeilen[0].trim());
    } else { gefangen++; console.log("  ✓ gefangen:", f.was); }
  }
} finally {
  for (const d of [SIEGEL, GLUE, WIZARD]) writeFileSync(d, sicher[d], "utf8");
}
console.log(`\n${gefangen} gefangen · ${durch} durchgerutscht · ${falsch} aus dem falschen Grund · ${tot} tote Anker`);
process.exit(durch || falsch || tot ? 1 : 0);
