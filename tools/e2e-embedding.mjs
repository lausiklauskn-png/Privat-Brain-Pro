// Proof for the meaning-model ADAPTER (Teil A). The real e5 model can't load in this
// sandbox (jsdelivr + HuggingFace are blocked), so we inject a deterministic stub
// embedder via window.__CB_EMBED_STUB__ and prove the evec-ranking path:
// a cross-language MEANING hit that the lexical/synonym path cannot reach.
import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { readFile, writeFile, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, extname } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const EXEC = process.env.CB_CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const MIME = { '.html':'text/html','.json':'application/json','.js':'text/javascript','.png':'image/png' };
const server = createServer(async (req,res)=>{ try{ let p=decodeURIComponent(req.url.split('?')[0]); if(p==='/')p='/index.html';
  const b=await readFile(join(ROOT,p)); res.writeHead(200,{'content-type':MIME[extname(p)]||'application/octet-stream'}); res.end(b);
} catch{ res.writeHead(404); res.end('nf'); }});
await new Promise(r=>server.listen(0,r));
const PORT=server.address().port;

const dir = await mkdtemp(join(tmpdir(),'cbe-'));
// "Wagen" = concept car, but the query will be English "vehicle" — no shared token,
// and the app's synonym map does NOT bridge vehicle->wagen. Only MEANING can match it.
await writeFile(join(dir,'akte_4499.txt'), 'Schwarzer Wagen frisch lackiert, Radstand 2820 mm, bearbeitet.');
await writeFile(join(dir,'einkauf.txt'), 'Milch, Brot, Kaffee und Butter.');
await writeFile(join(dir,'miete.txt'), 'Mietvertrag Laufzeit zwei Jahre Kaltmiete.');
const files=['akte_4499.txt','einkauf.txt','miete.txt'].map(f=>join(dir,f));

const browser = await chromium.launch({executablePath:EXEC, args:['--no-sandbox']});
const ctx = await browser.newContext();
// deterministic stub embedder injected BEFORE any page script; embedder() prefers it.
await ctx.addInitScript(() => {
  const CONCEPTS = [
    ['auto','car','vehicle','fahrzeug','kfz','wagen','cabrio','pkw','lackiert','radstand'],
    ['rechnung','invoice','betrag','zahlung','faktura','beleg'],
    ['vertrag','contract','miete','mietvertrag','laufzeit'],
    ['milch','brot','kaffee','einkauf','butter'],
  ];
  function embed(text){
    const low=String(text||'').toLowerCase(); const v=new Float32Array(384);
    CONCEPTS.forEach((grp,i)=>{ if(grp.some(w=>low.includes(w))) v[i]=1; });
    let n=0; for(let i=0;i<v.length;i++) n+=v[i]*v[i]; n=Math.sqrt(n)||1;
    for(let i=0;i<v.length;i++) v[i]/=n; return v;
  }
  window.__CB_EMBED_STUB__ = {
    isReady(){ return true; },
    embedQuery(t){ return Promise.resolve(embed(t)); },
    embedPassage(t){ return Promise.resolve(embed(t)); },
    embedPassageBatch(a){ return Promise.resolve(a.map(embed)); },
  };
});
const page = await ctx.newPage();
page.on('pageerror', e=>console.error('PAGE ERROR:', e.message));
await page.goto(`http://127.0.0.1:${PORT}/index.html`, {waitUntil:'load'});
let pass=0, fail=0; const ok=(n,c,x='')=>{(c?pass++:fail++);console.log(`${c?'✅':'❌'} ${n}${x?'  '+x:''}`);};

await page.setInputFiles('#fileInput', files);
await page.waitForFunction(()=>document.querySelector('#stFiles')&&document.querySelector('#stFiles').textContent==='3',{timeout:15000});
ok('3 Dateien signiert', (await page.textContent('#stFiles'))==='3');

// model flag shows active (stub)
await page.click('.tab[data-tab="settings"]');
const embFlag = await page.textContent('#embFlag');
ok('Bedeutungs-Modell als aktiv angezeigt', /aktiv/i.test(embFlag), `("${embFlag}")`);
await page.click('.tab[data-tab="search"]');

// give the background backfill a moment to embed the passages
await page.waitForTimeout(400);

// CONTROL: lexical/synonym path cannot bridge "vehicle" -> "Wagen".
// Prove it by turning the stub OFF would be complex; instead assert the semantic
// hit AND that its reason cites the model (only the evec path produces that).
await page.click('#mode button[data-m="mean"]');
await page.fill('#q','vehicle'); await page.waitForTimeout(300);
const hits = await page.$$eval('#results .card .fname', els=>els.map(e=>e.textContent.trim()));
ok('Cross-Language-Bedeutung: „vehicle" findet den „Wagen"-Akt', hits.some(t=>/akte_4499/.test(t)), `[${hits.join(' | ')}]`);
ok('Bedeutungs-Treffer steht oben', hits[0] && /akte_4499/.test(hits[0]), `top=${hits[0]||'—'}`);
const why = await page.$$eval('#results .why', els=>els.map(e=>e.textContent));
ok('Begründung nennt das Modell', why.some(t=>/Modell/.test(t)), `[${(why[0]||'').slice(0,80)}]`);
ok('Unpassendes bleibt draußen (Einkauf nicht oben)', !/einkauf/.test(hits[0]||''), `top=${hits[0]||'—'}`);

// second concept: "contract" (EN) -> Mietvertrag (DE), also meaning-only
await page.fill('#q','rental contract'); await page.waitForTimeout(300);
const h2 = await page.$$eval('#results .card .fname', els=>els.map(e=>e.textContent.trim()));
ok('„rental contract" findet den Mietvertrag (Bedeutung)', h2.some(t=>/miete/.test(t)), `[${h2.join(' | ')}]`);

await browser.close(); server.close();
console.log(`\n${pass} bestanden, ${fail} fehlgeschlagen`);
if(fail) process.exit(1);
