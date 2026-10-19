// Proof for the compressed paths: FlateDecode PDF + real .docx (ZIP/deflate-raw).
import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { readFile, writeFile, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, extname } from 'node:path';
import { deflateSync, deflateRawSync, crc32 } from 'node:zlib';

const ROOT = new URL('..', import.meta.url).pathname;
const EXEC = process.env.CB_CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const MIME = { '.html':'text/html', '.json':'application/json', '.js':'text/javascript', '.png':'image/png' };
const server = createServer(async (req, res) => {
  try { let p = decodeURIComponent(req.url.split('?')[0]); if (p==='/') p='/index.html';
    const buf = await readFile(join(ROOT, p));
    res.writeHead(200,{'content-type':MIME[extname(p)]||'application/octet-stream'}); res.end(buf);
  } catch { res.writeHead(404); res.end('nf'); }
});
await new Promise(r=>server.listen(0,r));
const PORT = server.address().port;

const dir = await mkdtemp(join(tmpdir(),'cb2-'));

// --- FlateDecode PDF ---
const content = Buffer.from('BT /F1 12 Tf 72 800 Td (Vertrag Mietvertrag Wohnung Kaltmiete 850 Euro Laufzeit) Tj ET');
const zc = deflateSync(content); // zlib -> "deflate"
const parts = [];
const push = s => parts.push(Buffer.isBuffer(s)?s:Buffer.from(s,'latin1'));
push('%PDF-1.5\n');
push('1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n');
push('2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n');
push('3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 595 842]/Contents 4 0 R>>endobj\n');
push(`4 0 obj<</Length ${zc.length}/Filter/FlateDecode>>\nstream\n`);
push(zc); push('\nendstream endobj\n');
push('trailer<</Root 1 0 R>>\n%%EOF');
await writeFile(join(dir,'vertrag_komprimiert.pdf'), Buffer.concat(parts));

// --- real .docx (ZIP with deflate-raw members + central directory) ---
function zip(entries){ // entries: [{name, data}]
  const chunks=[]; const central=[]; let offset=0;
  for(const e of entries){
    const nameBuf = Buffer.from(e.name,'utf8');
    const comp = deflateRawSync(e.data);
    const crc = crc32(e.data)>>>0;
    const lfh = Buffer.alloc(30);
    lfh.writeUInt32LE(0x04034b50,0); lfh.writeUInt16LE(20,4); lfh.writeUInt16LE(0,6);
    lfh.writeUInt16LE(8,8); lfh.writeUInt16LE(0,10); lfh.writeUInt16LE(0,12);
    lfh.writeUInt32LE(crc,14); lfh.writeUInt32LE(comp.length,18); lfh.writeUInt32LE(e.data.length,22);
    lfh.writeUInt16LE(nameBuf.length,26); lfh.writeUInt16LE(0,28);
    chunks.push(lfh, nameBuf, comp);
    const cdh = Buffer.alloc(46);
    cdh.writeUInt32LE(0x02014b50,0); cdh.writeUInt16LE(20,4); cdh.writeUInt16LE(20,6);
    cdh.writeUInt16LE(0,8); cdh.writeUInt16LE(8,10); cdh.writeUInt16LE(0,12); cdh.writeUInt16LE(0,14);
    cdh.writeUInt32LE(crc,16); cdh.writeUInt32LE(comp.length,20); cdh.writeUInt32LE(e.data.length,24);
    cdh.writeUInt16LE(nameBuf.length,28); cdh.writeUInt32LE(offset,42);
    central.push(cdh, nameBuf);
    offset += lfh.length + nameBuf.length + comp.length;
  }
  const cdStart = offset; let cdLen=0;
  for(const c of central) cdLen += c.length;
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50,0); eocd.writeUInt16LE(entries.length,8); eocd.writeUInt16LE(entries.length,10);
  eocd.writeUInt32LE(cdLen,12); eocd.writeUInt32LE(cdStart,16);
  return Buffer.concat([...chunks, ...central, eocd]);
}
const docXml = '<?xml version="1.0"?><w:document xmlns:w="x"><w:body>'
  +'<w:p><w:r><w:t>Angebot Kundendienst Wartung Klimaanlage Preis 320 Euro</w:t></w:r></w:p>'
  +'</w:body></w:document>';
const docx = zip([
  {name:'[Content_Types].xml', data:Buffer.from('<?xml version="1.0"?><Types/>')},
  {name:'word/document.xml', data:Buffer.from(docXml,'utf8')},
]);
await writeFile(join(dir,'kundenanfrage.docx'), docx);

const files=[join(dir,'vertrag_komprimiert.pdf'), join(dir,'kundenanfrage.docx')];

const browser = await chromium.launch({executablePath:EXEC, args:['--no-sandbox']});
const page = await browser.newPage();
page.on('pageerror', e=>console.error('PAGE ERROR:', e.message));
await page.goto(`http://127.0.0.1:${PORT}/index.html`, {waitUntil:'load'});
let pass=0, fail=0; const ok=(n,c,x='')=>{(c?pass++:fail++);console.log(`${c?'✅':'❌'} ${n}${x?'  '+x:''}`);};

await page.setInputFiles('#fileInput', files);
await page.waitForFunction(()=>document.querySelector('#stFiles')&&document.querySelector('#stFiles').textContent==='2',{timeout:15000});
ok('2 komprimierte Dateien signiert', (await page.textContent('#stFiles'))==='2');

async function mean(q){ await page.click('#mode button[data-m="mean"]'); await page.fill('#q',q); await page.waitForTimeout(120);
  return page.$$eval('#results .card .fname', els=>els.map(e=>e.textContent.trim())); }

const p1 = await mean('mietvertrag laufzeit kaltmiete');
ok('FlateDecode-PDF (zlib) entpackt & Text auffindbar', p1.some(t=>/vertrag_komprimiert/.test(t)), `[${p1.join(' | ')}]`);
const p2 = await mean('wartung klimaanlage angebot');
ok('DOCX (ZIP/deflate-raw) entpackt & Text auffindbar', p2.some(t=>/kundenanfrage\.docx/.test(t)), `[${p2.join(' | ')}]`);

await browser.close(); server.close();
console.log(`\n${pass} bestanden, ${fail} fehlgeschlagen`);
if(fail) process.exit(1);
