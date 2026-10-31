// tools/native/test-netzbrief.mjs — Pro-Umbau 14 A2 (Klaus 2026-10-31: „Herr Meier am Ende wird nicht gefunden“).
// Prüft ohne Browser den Netz-Korpus von Private Brain Pro gegen das ECHTE Modul 04 (modules/04_match.js, byte-1:1):
//   1 ein Eintrag ohne Vektor oder mit Liste statt Float32Array ließ bis 1.0.44 JEDE Antwort leer (validateCorpus wirft) — jetzt nicht
//   2 der Vergleichstext trägt das Briefende: „Hans Meier“ nur am Ende eines langen Textes wird gefunden
//   3 nach dem Einschalten liest Modul 04 den Katalog live (neue Datei ohne Aus/An)
// Der Katalog-Code wird aus index.html gelesen (passageText … __CB_getCorpus), nicht nachgebaut. Rückgabe 0 grün · 1 ROT.
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const W = new URL('../../', import.meta.url);
let gruen = 0, rot = 0;
const ok = (n, c, i) => { if (c) { gruen++; console.log('  ✓ ' + n); } else { rot++; console.log('  ✗ ROT: ' + n + (i ? '  — ' + i : '')); } };
const html = readFileSync(new URL('index.html', W), 'utf8');
const a = html.indexOf('function passageText(r)'), e = html.indexOf('async function embedBackfill');
ok('Katalog-Code in index.html gefunden', a > 0 && e > a);
const ctx = { Float32Array, Array, WeakMap, String, setTimeout, console };
ctx.window = ctx; vm.createContext(ctx);
vm.runInContext(readFileSync(new URL('modules/04_match.js', W), 'utf8'), ctx);
vm.runInContext('const SNIPPET_LEN = 600; var CATALOG = [];\n' + html.slice(a, e) + '\nthis.__setCat = (c) => { CATALOG = c; }; this.textEnde = textEnde;', ctx);
const vec = (s) => { const v = new Float32Array(384); for (const w of String(s).toLowerCase().match(/[a-zäöüß0-9]{3,}/g) || []) { let h = 7; for (const c of w) h = (h * 31 + c.charCodeAt(0)) >>> 0; v[h % 384] += 1; } const n = Math.hypot(...v) || 1; return v.map((x) => x / n); };
ctx.SbkimEmbedding = { embedQuery: async (s) => vec(s) };
const fuell = Array.from({ length: 30 }, (_, i) => `Absatz ${i + 1}: Wir bestätigen den Eingang Ihrer Unterlagen.`).join(' ');
const brief = 'Sehr geehrte Damen und Herren, ' + fuell + ' Mit freundlichen Grüßen Hans Meier';
const rec = (name, text, mit = true) => ({ hash: 'h-' + name, name, snippet: text.slice(0, 600), ende: ctx.textEnde(text), evec: mit ? Array.from(vec(name + '. ' + text.slice(0, 600))) : null });
const cat = [rec('Schreiben-2026-09.pdf', brief), rec('Rechnung-1.pdf', 'Rechnung Nr. 1 ' + fuell), rec('Foto.jpg', 'Urlaub am Meer', false)];
ctx.__setCat(cat);
ok('Selbst-Riegel: „Meier“ steht hinter den ersten 600 Zeichen (dort endete der Katalogtext)', brief.indexOf('Meier') > 600);
const k = ctx.__CB_getCorpus();
ok('Korpus: nur Einträge mit Vektor, jeder als Float32Array(384)', k.length === 2 && k.every((x) => x.passageVec instanceof Float32Array && x.passageVec.length === 384), String(k.length));
ok('Korpus: Antwort trägt nur den Dateinamen (label), der Text bleibt zum Vergleichen', k.every((x) => x.label === x.label.replace(/ … .*/, '') && !/Meier/.test(x.label)));
ctx.SbkimMatch.setLocalCorpus(k);
let h = []; let fehler = '';
try { h = await ctx.SbkimMatch.queryLocal('Brief von Herrn Hans Meier', 3, { hybrid: true, exclude: true }); } catch (x) { fehler = x.name + ': ' + x.message; }
ok('Modul 04 wirft nicht (vorher InvalidCorpusError bei jeder Frage)', !fehler, fehler);
ok('„Brief von Herrn Hans Meier“ → das Schreiben, dessen Name nur am Ende steht', h.length > 0 && h[0].anchorId === 'h-Schreiben-2026-09.pdf', JSON.stringify(h));
const alt = { ...cat[0] }; delete alt.ende; alt.mailBody = brief; ctx.__setCat([alt]);
ok('Ältere Mail ohne gemerktes Ende: das Ende kommt aus dem Mailtext', /Hans Meier/.test(ctx.__CB_getCorpus()[0].text));
// 3 — live nach dem Einschalten (rendezvous-init.js)
const ri = readFileSync(new URL('modules/rendezvous-init.js', W), 'utf8');
ok('Nach dem Einschalten bekommt Modul 04 den Provider selbst (live, ohne Aus/An)', /m\.setLocalCorpus\(liveCorpus\)/.test(ri) && /function prepareCorpus\(\) \{\s*var k = liveCorpus\(\);\s*setTimeout/.test(ri));
ctx.__setCat(cat); ctx.SbkimMatch.setLocalCorpus(() => ctx.__CB_getCorpus());
cat.push(rec('Angebot-Gartenbau.pdf', 'Angebot über Heckenschnitt. Mit freundlichen Grüßen Otto Schmidt Gartenbau'));
const h2 = await ctx.SbkimMatch.queryLocal('Otto Schmidt Gartenbau', 3, { hybrid: true });
ok('Neue Datei im Katalog → sofort gefunden', h2.length > 0 && h2[0].anchorId === 'h-Angebot-Gartenbau.pdf', JSON.stringify(h2));
console.log(`\n${gruen} grün · ${rot} ROT`);
process.exitCode = rot ? 1 : 0;
