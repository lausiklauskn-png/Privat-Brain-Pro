// Beweis Stufe 3a: Bild verstehen ohne Text. Ein Foto OHNE lesbaren Text wird über
// EXIF (Aufnahme-Datum · Kamera · GPS-Ort) trotzdem nach Bedeutung auffindbar.
// Baut ein echtes JPEG mit EXIF-APP1 (little-endian: Make/Model/DateTimeOriginal/GPS),
// signiert es und sucht danach. captionImage-Steckplatz ist fail-soft (ohne Modell leer).
import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, extname } from 'node:path';
const ROOT = new URL('..', import.meta.url).pathname;
const EXEC = process.env.CB_CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const MIME = { '.html':'text/html','.json':'application/json','.js':'text/javascript','.png':'image/png','.woff2':'font/woff2' };
const server = createServer(async (req,res)=>{ try{ let p=decodeURIComponent(req.url.split('?')[0]); if(p==='/')p='/index.html';
  const b=await readFile(join(ROOT,p)); res.writeHead(200,{'content-type':MIME[extname(p)]||'application/octet-stream'}); res.end(b);
} catch{ res.writeHead(404); res.end('nf'); }});
await new Promise(r=>server.listen(0,r));
const PORT=server.address().port;

// --- EXIF-JPEG-Bauer (little-endian) ---
function buildExifJpeg(){
  // TIFF-Datenpool ab "II". Wir bauen IFD0 + EXIF-IFD + GPS-IFD + Datenbereich.
  const chunks=[]; let cursor=0;
  const pushStr = s => { const b=Buffer.from(s+'\0','latin1'); chunks.push(b); const off=cursor; cursor+=b.length; if(cursor%2) { chunks.push(Buffer.from([0])); cursor++; } return off; };
  const pushRat = arr => { const b=Buffer.alloc(arr.length*8); arr.forEach((r,i)=>{ b.writeUInt32LE(r[0],i*8); b.writeUInt32LE(r[1],i*8+4); }); chunks.push(b); const off=cursor; cursor+=b.length; return off; };
  // Header (8 Byte) + drei IFDs; deren Größe kennen wir vorab, um Daten dahinter zu legen.
  const ifd0Entries=4, exifEntries=5, gpsEntries=5;
  const ifd0Size = 2+ifd0Entries*12+4;
  const exifSize = 2+exifEntries*12+4;
  const gpsSize  = 2+gpsEntries*12+4;
  const ifd0Off = 8;
  const exifOff = ifd0Off+ifd0Size;
  const gpsOff  = exifOff+exifSize;
  cursor = gpsOff+gpsSize; // Datenbereich beginnt nach den IFDs
  // Datenwerte anlegen
  const makeOff = pushStr('TestMake');
  const modelOff = pushStr('PB-Cam 100');
  const dateOff = pushStr('2019:06:03 10:00:00');
  const latOff = pushRat([[52,1],[31,1],[0,1]]);   // 52°31'0" N (Berlin)
  const lonOff = pushRat([[13,1],[24,1],[0,1]]);   // 13°24'0" E
  const fnumOff = pushRat([[28,10]]);              // Blende f/2.8
  const expOff  = pushRat([[1,250]]);              // 1/250 s
  const focOff  = pushRat([[50,1]]);               // 50 mm
  const dataBuf = Buffer.concat(chunks);
  // TIFF zusammensetzen
  const tiff = Buffer.alloc(gpsOff+gpsSize+dataBuf.length);
  tiff.write('II',0,'latin1'); tiff.writeUInt16LE(42,2); tiff.writeUInt32LE(ifd0Off,4);
  function writeIFD(base, entries, next){
    tiff.writeUInt16LE(entries.length, base);
    entries.forEach((e,i)=>{ const o=base+2+i*12;
      tiff.writeUInt16LE(e.tag,o); tiff.writeUInt16LE(e.type,o+2); tiff.writeUInt32LE(e.count,o+4);
      if(e.inline!=null) tiff.writeUInt32LE(e.inline,o+8); else tiff.writeUInt32LE(e.off,o+8);
    });
    tiff.writeUInt32LE(next, base+2+entries.length*12);
  }
  writeIFD(ifd0Off, [
    {tag:0x010F,type:2,count:9,off:makeOff},    // Make ASCII "TestMake\0"
    {tag:0x0110,type:2,count:11,off:modelOff},  // Model
    {tag:0x8769,type:4,count:1,inline:exifOff}, // Exif-IFD-Zeiger
    {tag:0x8825,type:4,count:1,inline:gpsOff},  // GPS-IFD-Zeiger
  ], 0);
  writeIFD(exifOff, [
    {tag:0x829A,type:5,count:1,off:expOff},      // ExposureTime 1/250
    {tag:0x829D,type:5,count:1,off:fnumOff},     // FNumber f/2.8
    {tag:0x8827,type:3,count:1,inline:400},      // ISO 400 (SHORT inline)
    {tag:0x9003,type:2,count:20,off:dateOff},    // DateTimeOriginal
    {tag:0x920A,type:5,count:1,off:focOff},      // FocalLength 50mm
  ], 0);
  writeIFD(gpsOff, [
    {tag:0x0001,type:2,count:2,inline:0x004E},  // GPSLatitudeRef "N" (ASCII inline: 'N',0)
    {tag:0x0002,type:5,count:3,off:latOff},     // GPSLatitude
    {tag:0x0003,type:2,count:2,inline:0x0045},  // GPSLongitudeRef "E"
    {tag:0x0004,type:5,count:3,off:lonOff},     // GPSLongitude
    {tag:0x0000,type:1,count:4,inline:0x02030000}, // GPSVersionID (Füller)
  ], 0);
  dataBuf.copy(tiff, gpsOff+gpsSize);
  // JPEG-Rahmen: FFD8 + APP1(FFE1, "Exif\0\0"+TIFF) + minimaler Rest + FFD9
  const exifHeader = Buffer.from('Exif\0\0','latin1');
  const app1Payload = Buffer.concat([exifHeader, tiff]);
  const app1 = Buffer.alloc(4+app1Payload.length);
  app1[0]=0xFF; app1[1]=0xE1; app1.writeUInt16BE(app1Payload.length+2, 2); // Segmentlänge (big-endian, inkl. Längenfeld)
  app1Payload.copy(app1,4);
  return Buffer.concat([Buffer.from([0xFF,0xD8]), app1, Buffer.from([0xFF,0xD9])]);
}

const jpg = buildExifJpeg();

const browser = await chromium.launch({executablePath:EXEC, args:['--no-sandbox']});
const page = await browser.newPage();
const errors=[]; page.on('pageerror', e=>errors.push(e.message));
await page.goto(`http://127.0.0.1:${PORT}/index.html`, {waitUntil:'load'});
await page.waitForTimeout(400);
let pass=0, fail=0; const ok=(n,c,x='')=>{(c?pass++:fail++);console.log(`${c?'✅':'❌'} ${n}${x?'  ('+x+')':''}`);};

// 1) readExif zieht Datum/Kamera/GPS
const ex = await page.evaluate((arr)=> readExif(new Uint8Array(arr)), [...jpg]);
ok('EXIF: Aufnahme-Datum normalisiert', ex && ex.dateTaken==='2019-06-03', ex&&ex.dateTaken);
ok('EXIF: Kamera (Make/Model)', ex && /TestMake/.test(ex.make||'') && /PB-Cam/.test(ex.model||''), ex&&(ex.make+' '+ex.model));
ok('EXIF: GPS ~ Berlin (52.5, 13.4)', ex && Math.abs(ex.lat-52.5167)<0.05 && Math.abs(ex.lon-13.4)<0.05, ex&&(ex.lat?.toFixed(3)+', '+ex.lon?.toFixed(3)));
ok('EXIF: Foto-Einstellungen (Blende f/2.8 · 1/250 s · ISO 400 · 50 mm)',
   ex && Math.abs(ex.fNumber-2.8)<0.05 && Math.abs(ex.exposure-1/250)<1e-4 && ex.iso===400 && Math.round(ex.focalLen)===50,
   ex&&('f/'+ex.fNumber+' '+ex.exposure+' ISO'+ex.iso+' '+ex.focalLen+'mm'));

// 2) describeImage verschmilzt zu Text + ehrlicher via-Herkunft, captionImage-Steckplatz leer
const d = await page.evaluate(async (arr)=>{
  const u8=new Uint8Array(arr); const f=new File([u8],"IMG_0007.jpg",{type:"image/jpeg"});
  const r = await describeImage(f, u8.buffer);
  return { text:r.text, via:r.via, capType: typeof window.PB_CAPTION };
}, [...jpg]);
ok('Fusion-Text enthält Datum + Ort', /2019-06-03/.test(d.text) && /Aufnahmeort/.test(d.text), d.text.slice(0,60));
ok('Fusion-Text enthält Blende + Schärfentiefe-Hinweis (beide Begriffe)', /Blende f\/2\.8/.test(d.text) && /Schärfentiefe/.test(d.text) && /Tiefenschärfe/.test(d.text), (d.text.match(/Foto-Einstellungen:[^]*?(?=$)/)||[''])[0].slice(0,90));
ok('via nennt die Spezialisten inkl. Einstellungen', /Bild ·/.test(d.via) && /Datum/.test(d.via) && /Ort/.test(d.via) && /Einstellungen/.test(d.via), d.via);
ok('captionImage-Steckplatz ohne Modell -> fail-soft (nicht verdrahtet)', d.capType==='undefined', 'PB_CAPTION='+d.capType);

// 3) Signieren -> Foto ist per Bedeutung (Datum) auffindbar, Kategorie Foto/Bild
const s = await page.evaluate(async (arr)=>{
  const u8=new Uint8Array(arr); const f=new File([u8],"IMG_0007.jpg",{type:"image/jpeg"});
  const res = await signFile(f, "IMG_0007.jpg", null);
  const rec = CATALOG.find(x=>x.hash===res.hash);
  return { cat: rec&&rec.category, snippetHasDate: rec&&/2019-06-03/.test(rec.snippet||''), via: rec&&rec.via };
}, [...jpg]);
ok('Signiertes Foto: Kategorie Foto/Bild', s.cat==='Foto/Bild', s.cat);
ok('Signiertes Foto: Datum steht im Steckbrief (auffindbar)', s.snippetHasDate===true, s.via);

ok('Keine Seiten-Fehler', errors.length===0, errors.join('; ').slice(0,160));
console.log(`\n${pass} bestanden, ${fail} fehlgeschlagen`);
await browser.close(); server.close(); process.exit(fail?1:0);
