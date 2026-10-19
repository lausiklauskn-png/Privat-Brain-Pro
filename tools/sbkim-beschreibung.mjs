/* Die Bedeutungs-Beschreibung — was darin stehen MUSS, und dass beide Wege
 * zur Spore denselben Text tragen.
 *
 * WARUM ES DIESE PROBE GIBT (Befund 2026-09-10, gemessen an allen 21 Knoten).
 * Im Mycel-Mitschnitt standen die Zahlen nebeneinander:
 *
 *   Kim-Bell            82 Zeichen   0.874864   nennt SBKIM · Mycel · Knoten
 *   SB-KIMTool-Point    61 Zeichen   0.865795   nennt SBKIM · Mycel · Knoten
 *   Muster Werbetechnik 421 Zeichen  0.793613   nennt das Protokoll NICHT
 *
 * ⚠ LÄNGE ENTSCHEIDET NICHT, DER INHALT TUT ES. Zweiundachtzig Zeichen schlagen
 * vierhunderteinundzwanzig, wenn die zwei Sätze vom Protokoll handeln und die
 * vierhundert nicht. Eine Prüfung auf die ZAHL misst Umfang und keinen Inhalt —
 * genau daran ist es in Kim Hub Company vorbeigegangen (1851 Zeichen ohne Namen
 * und ohne Zweck gingen durch). Gemessen wird deshalb jede Sache EINZELN, mit
 * eigenem Namen in der roten Zeile, und gemessen wird der BEGRIFF, nicht die
 * Formulierung: ein Wächter, der einen Satz festnagelt, verbietet das nächste
 * Richtigstellen.
 *
 * ⚠ UND ZWEI WEGE ZUR SPORE RECHNEN SONST ZWEI VEKTOREN. Das Verbinden-Fenster
 * und der Andock-Wizard im Siegel tragen den Text je einmal; laufen sie
 * auseinander, hat derselbe Knoten zwei Bedeutungen, je nachdem welchen Weg der
 * Nutzer nimmt. Gemessen an Mixarium am 2026-09-10 — dort war es wirklich so.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const WURZEL = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
let gruen = 0, rot = 0;
const ok = (was, b, hinweis) => {
  if (b) { gruen++; console.log("  ✓", was); }
  else { rot++; console.log("  ✗ ROT:", was, hinweis ? "→ " + hinweis : ""); }
};

function finde(endung) {
  const treffer = [];
  (function geh(d) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      if (e.name === "node_modules" || e.name === ".git") continue;
      const p = path.join(d, e.name);
      if (e.isDirectory()) geh(p);
      else if (endung.some((x) => e.name === x)) treffer.push(p);
    }
  })(WURZEL);
  return treffer;
}

const siegel = finde(["siegel-inhalt.js"])[0];
/* ⚠ SEIT A18 (2026-09-14) LIEGT DER WIZARD-CODE IN EINER EIGENEN DATEI. Die
   Waechter darunter messen den ABLAUF, nicht die Identitaet — sie sind deshalb
   MITGEZOGEN worden statt geloescht. Wer einen Waechter beim Umzug wegwirft,
   nimmt seine Zusicherung mit. Vertrag: Sage-Protokol/docs/INTERFACES.md 11.9. */
const wizard = finde(["sbkim-andock-wizard.js"])[0];
const glue = finde(["rendezvous-init.js", "sbkim-init.js"])[0];
ok("das Siegel und der app-eigene Klebstoff liegen beide da", !!siegel && !!glue,
   `siegel=${siegel} glue=${glue}`);
ok("… und die Kanon-Datei mit dem Wizard liegt daneben", !!wizard, `wizard=${wizard}`);
if (!siegel || !glue) { console.log(`\n${gruen} grün, ${rot} ROT`); process.exit(1); }

const sTxt = fs.readFileSync(siegel, "utf8");
const wTxt = wizard ? fs.readFileSync(wizard, "utf8") : "";
const gTxt = fs.readFileSync(glue, "utf8");

/* Der Text wird aus dem Siegel gelesen, nicht abgeschrieben — eine zweite
   Fassung in der Probe liefe mit der ersten auseinander. */
const m = sTxt.match(/domainDescription:\s*"((?:[^"\\]|\\.)*)"/);
ok("das Siegel trägt eine Bedeutungs-Beschreibung", !!m);
const text = m ? JSON.parse('"' + m[1] + '"') : "";

/* Jede Sache EINZELN — mit eigenem Namen in der roten Zeile. */
for (const [was, muster] of [
  ["SBKIM", /SBKIM/],
  ["Mycel", /Mycel/],
  ["Knoten", /Knoten/],
  ["Sage-Protokol als Herkunft der Spezifikation", /Sage-Protokol/],
  ["die eigene Identität (Spore)", /Spore/],
]) ok(`die Beschreibung nennt ${was}`, muster.test(text));

/* Die Domäne bleibt VORN — der Protokoll-Absatz ist die Zugabe, nicht der
   Anfang. Wer ihn nach vorn zieht, macht aus einer Boutique einen Knoten, der
   nebenbei Kleider hat. (Und Modul 03 schneidet bei 512 Tokens ab: was hinten
   steht, fällt zuerst weg.) */
ok("… und die Domäne steht VOR dem Protokoll-Absatz",
   text.indexOf("SBKIM") > 120, `SBKIM steht an Stelle ${text.indexOf("SBKIM")}`);

/* Zwei Wege, ein Text. */
ok("der app-eigene Klebstoff trägt WORTGLEICH denselben Text", gTxt.includes(text));

/* Der Vorschlag der App gewinnt — sonst bekommt, wer neu signiert, den alten
   Text zurück, und die bessere Beschreibung wirkt nie.
   ⚠ Gemessen wird der BLOCK, nicht die Datei: `ta.value = WIZ.domainDescription`
   steht danach ein zweites Mal im Rückhol-Knopf, und ein freier Fund dort
   bliebe grün, wenn die Vorbelegung fehlte (so ist es in Kim Hub Company
   durchgerutscht). */
const von = wTxt.indexOf("ta.value = c.domainDescription");
const bis = wTxt.indexOf("ta.addEventListener(\"input\"");
const block = von > 0 && bis > von ? wTxt.slice(von, bis) : "";
ok("der Vorschlag der App wird NICHT mehr still von der Spore überschrieben",
   !!block && !/ta\.value = sp\.domainDescription/.test(block));
ok("… und eine Zeile nennt, welcher der beiden Texte im Feld steht",
   /data-woher/.test(wTxt) && /semantik-herkunft/.test(wTxt));
ok("… und ein Knopf holt den zuletzt signierten Text zurück",
   /semantik-eigener-text/.test(wTxt) && /abweichend/.test(wTxt));
/* Die Gegenrichtung: der Knopf steht nur bei ABWEICHUNG da. Einer, der immer
   dasteht, ist bald einer, den niemand mehr liest. */
ok("… und er steht nur da, wenn der signierte Text wirklich abweicht",
   /zurueck\.hidden = true;/.test(wTxt) && /if \(!abweichend\) return;/.test(wTxt));

console.log(`\n${gruen} grün, ${rot} ROT`);
process.exit(rot ? 1 : 0);
