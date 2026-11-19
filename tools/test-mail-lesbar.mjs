// Probe (Klaus 19.11.2026): reine HTML-Mails zeigten im Explorer den <style>-Inhalt als Text.
// mailLesbar in index.html entfernt beim Anzeigen nur eindeutiges CSS; gewöhnlicher Text bleibt, wie er ist.
import fs from 'node:fs';
import vm from 'node:vm';
const src = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const start = src.indexOf('function mailLesbar'), end = src.indexOf('\n}\n', start) + 2;
if (start < 0) { console.error('ROT  mailLesbar fehlt in index.html'); process.exit(1); }
const ctx = {}; vm.runInNewContext(src.slice(start, end) + ';this.mailLesbar=mailLesbar;', ctx);
let rot = 0;
const ok = (name, cond) => { console.log((cond ? 'grün ' : 'ROT  ') + name); if (!cond) rot++; };
const news = 'Kleinanzeigen body{margin:0;padding:0} table,td{mso-table-lspace:0pt} @media only screen and (max-width:600px){.x{width:100%!important} .y td{display:block}} @font-face{font-family:\'Open\';src:url(https://a.b/c.woff) format(\'woff\')}\n\nHallo Klaus,\nneue Anzeigen für dich.\n￼\nViele Grüße';
ok('Newsletter: Gestaltungsregeln weg, Text bleibt', ctx.mailLesbar(news) === 'Hallo Klaus,\nneue Anzeigen für dich.\n\nViele Grüße');
ok('OpenAI-Muster: #outlook/.ExternalClass weg', ctx.mailLesbar('Mehr Nutzungskontingent\n#outlook a{padding:0;} .ExternalClass{width:100%;}\nDu hast jetzt mehr.') === 'Mehr Nutzungskontingent\n\nDu hast jetzt mehr.');
const plain = 'Ganz normaler Text.\n\nMit Absatz.';
ok('Text ohne Klammern bleibt unverändert', ctx.mailLesbar(plain) === plain);
const keep = 'Platzhalter {Name} bleibt, Zeit {12:30} bleibt, Code if (a) { b(); } bleibt.';
ok('Klammern ohne CSS bleiben', ctx.mailLesbar(keep) === keep);
ok('leer und null', ctx.mailLesbar('') === '' && ctx.mailLesbar(null) === '');
const t0 = Date.now(); ctx.mailLesbar('x{a:b} '.repeat(3000) + 'Ende'); ctx.mailLesbar('Text '.repeat(2000) + '{');
ok('schnell bei langen Texten', Date.now() - t0 < 1000);
console.log(rot ? rot + ' ROT' : 'alle grün'); process.exit(rot ? 1 : 0);
