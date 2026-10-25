// Real raster decoding and result DOM; native PDF transport is simulated here.
// Android's existing native PDF suite checks the actual PdfRenderer separately.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {chromium} from 'playwright-core';
const source=resolve('www/native-result-previews.js'),css=resolve('www/result-previews.css');
let browser,count=0;
const ok=(name,value)=>{assert.ok(value,name);console.log('✓ '+name);count++;};
try{
  const index=await readFile('www/index.html','utf8');
  ok('The built app wires one result-preview module and stylesheet',
    (index.match(/src="native-result-previews\.js"/g)||[]).length===1&&(index.match(/href="result-previews\.css"/g)||[]).length===1);
  browser=await chromium.launch({executablePath:process.env.CB_CHROMIUM||'/usr/bin/chromium',args:['--no-sandbox']});
  const page=await browser.newPage({viewport:{width:800,height:600}}),errors=[],external=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.route('**/*',route=>{external.push(route.request().url());return route.abort();});
  await page.setContent('<!doctype html><html lang="de" data-pb-theme="klarblau"><head><style>body{margin:0;font:16px Arial}#results{padding:8px;margin:0;list-style:none}.card{padding:8px;margin:0 0 8px;border:1px solid #ddd}.h{display:flex;gap:10px;align-items:flex-start}.h>div{min-width:0}.fname{font-weight:bold}.path{overflow-wrap:anywhere}.snip{margin-top:8px}.native-file-viewer[hidden],.panel:not(.on){display:none}.explorer-row,.explorer-dir{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;margin:8px;padding:12px;border:1px solid #ddd}.explorer-row strong{display:block;overflow-wrap:anywhere}.explorer-meta{font-size:12px;overflow-wrap:anywhere}</style></head><body><main id="panel-search" class="panel on"><ul id="results"></ul></main><main id="panel-explorer" class="panel"><div id="explorerFiles"></div></main></body></html>');
  await page.addStyleTag({path:css});
  await page.evaluate(()=>{
    window.CATALOG=[];window.SESSION_FILES=new Map();window.fixtureCalls=[];window.fixtureKinds=new Map();window.fixtureFiles=new Map();window.fixtureOriginals=new Map();window.fixtureImages=new Map();
    window.fixtureOpen=0;window.fixtureMaxOpen=0;window.fixtureNext=0;window.fixtureHold=false;window.fixtureFailure=false;window.fixtureResolveCount=0;
    const canvas=document.createElement('canvas');canvas.width=32;canvas.height=16;const ctx=canvas.getContext('2d');ctx.fillStyle='#135e97';ctx.fillRect(0,0,32,16);ctx.fillStyle='#f8db6b';ctx.fillRect(16,0,16,16);window.fixturePng=canvas.toDataURL('image/png').split(',')[1];
    const nativeCreate=URL.createObjectURL.bind(URL),nativeRevoke=URL.revokeObjectURL.bind(URL);window.fixtureURLs=new Map();window.fixtureMaxURLs=0;window.fixtureRevoked=0;
    URL.createObjectURL=blob=>{const url=nativeCreate(blob);fixtureURLs.set(url,blob.size);fixtureMaxURLs=Math.max(fixtureMaxURLs,fixtureURLs.size);return url;};
    URL.revokeObjectURL=url=>{if(fixtureURLs.delete(url))fixtureRevoked++;nativeRevoke(url);};
    const pageResult=()=>({data:fixturePng,width:320,height:450});
    window.Capacitor={Plugins:{ProFiles:{
      async originalInfo(args){fixtureCalls.push({method:'originalInfo',args});return fixtureOriginals.get(args.hash)||{missing:true};},
      async openPdf(args){fixtureCalls.push({method:'openPdf',args});fixtureOpen++;fixtureMaxOpen=Math.max(fixtureMaxOpen,fixtureOpen);return{id:'preview-'+(++fixtureNext),pages:3};},
      async pdfPage(args){fixtureCalls.push({method:'pdfPage',args});if(fixtureFailure)throw new Error('Unsupported local PDF');if(fixtureHold)return new Promise(resolve=>window.fixtureRelease=()=>resolve(pageResult()));await new Promise(resolve=>setTimeout(resolve,25));return pageResult();},
      async closePdf(args){fixtureCalls.push({method:'closePdf',args});fixtureOpen--;return{ok:true};}
    }}};
    window.PBOriginals={statusFor:hash=>fixtureKinds.get(hash)||'missing',async resolve(rec){fixtureResolveCount++;return fixtureFiles.get(rec.hash)||null;}};
    window.fixtureOpened=[];window.openFile=hash=>fixtureOpened.push(hash);
    window.fixtureRecord=(suffix,kind='pdf',availability='local',extra={})=>{
      const hash=suffix.toString(16).padStart(64,'0'),rec={hash,name:'Preview '+suffix+(kind==='pdf'?'.pdf':'.png'),path:'Folder/Preview '+suffix+(kind==='pdf'?'.pdf':'.png'),type:kind==='pdf'?'application/pdf':'image/png',size:1200,snippet:'',...extra};
      fixtureKinds.set(hash,availability);fixtureOriginals.set(hash,{hash,size:rec.size,name:rec.name,type:rec.type});return rec;
    };
    window.fixtureRender=records=>{
      CATALOG=records;const root=document.getElementById('results');root.replaceChildren();
      for(const rec of records){const card=document.createElement('li');card.className='card';card.dataset.hash=rec.hash;const head=document.createElement('div');head.className='h';const body=document.createElement('div');const name=document.createElement('div');name.className='fname';name.textContent=rec.name;const path=document.createElement('div');path.className='path';path.textContent=rec.path;const category=document.createElement('span');category.className='cat';category.textContent='Dokument';body.append(name,path,category);head.append(body);if(rec.thumb){const image=document.createElement('img');image.className='thumbimg';image.src=rec.thumb;head.prepend(image);}card.append(head);if(rec.snippet){const snip=document.createElement('div');snip.className='snip';snip.textContent=rec.snippet;card.append(snip);}root.append(card);}
    };
    window.fixtureExplorerRender=records=>{
      CATALOG=records;const root=document.getElementById('explorerFiles');root.replaceChildren();
      for(const rec of records){const row=document.createElement('article');row.className='explorer-row';row.dataset.hash=rec.hash;row.dataset.kind=rec.mail?'mail':rec.path.startsWith('Mail-Anhang/')?'attach':rec.type.startsWith('image/')?'photo':'doc';const info=document.createElement('div'),name=document.createElement('strong'),meta=document.createElement('div');name.textContent=rec.name;meta.className='explorer-meta';meta.textContent=rec.path;info.append(name,meta);const open=document.createElement('button');open.textContent='Öffnen';open.onclick=()=>openFile(rec.hash);row.append(info,open);root.append(row);}
    };
    window.fixtureNavigate=view=>{document.getElementById('panel-search').classList.toggle('on',view==='search');document.getElementById('panel-explorer').classList.toggle('on',view==='explorer');};
  });
  await page.addScriptTag({path:resolve('www/native-record-status.js')});
  await page.addScriptTag({path:source});
  await page.evaluate(()=>fixtureRender([fixtureRecord(1,'pdf','local',{snippet:'<< /Title <FEFF0053006900630068006500720065>'})]));
  await page.locator('.pb-result-preview[data-state="ready"] img').waitFor();
  await page.waitForFunction(()=>document.querySelector('.pb-result-preview-image')?.naturalWidth>0);
  ok('Visible PDF requests only its first page by native hash, with a small width and a closed session',await page.evaluate(()=>{
    const open=fixtureCalls.find(c=>c.method==='openPdf'),page=fixtureCalls.find(c=>c.method==='pdfPage');return open&&Object.keys(open.args).join()==='hash'&&page.args.page===0&&page.args.width===320&&fixtureCalls.filter(c=>c.method==='closePdf').length===1&&fixtureOpen===0;
  }));
  ok('Raw PDF title/UTF-16 hex is hidden without altering saved text or snippet DOM',await page.evaluate(()=>CATALOG[0].snippet==='<< /Title <FEFF0053006900630068006500720065>'&&document.querySelector('.snip').textContent===CATALOG[0].snippet&&getComputedStyle(document.querySelector('.snip')).display==='none'));
  await page.locator('.pb-result-preview').click();ok('Clicking the thumbnail retains the real existing Open handler',await page.evaluate(()=>fixtureOpened[0]===CATALOG[0].hash));
  const initialOpen=await page.evaluate(()=>fixtureCalls.filter(c=>c.method==='openPdf').length);
  await page.evaluate(()=>{const rec=CATALOG[0];fixtureRender([rec]);});await page.locator('.pb-result-preview[data-state="ready"] img').waitFor();
  ok('A result redraw reuses the cached thumbnail without reopening or rereading the PDF',await page.evaluate(()=>fixtureCalls.filter(c=>c.method==='openPdf').length)===initialOpen);
  await page.evaluate(()=>{
    const rec=fixtureRecord(2,'image','session',{snippet:'Ein normaler lesbarer Bildtext.'}),data=Uint8Array.from(atob(fixturePng),c=>c.charCodeAt(0));
    SESSION_FILES.set(rec.hash,new File([data],rec.name,{type:'image/png'}));fixtureRender([rec]);
  });await page.locator('.pb-result-preview[data-state="ready"] img').waitFor();await page.waitForFunction(()=>document.querySelector('.pb-result-preview-image')?.naturalWidth===32);
  ok('A real PNG session file is decoded and thumbnailed locally; normal text remains visible',await page.evaluate(()=>document.querySelector('.pb-result-preview-image').naturalHeight===16&&getComputedStyle(document.querySelector('.snip')).display!=='none'&&fixtureResolveCount===0));
  const beforeCached=await page.evaluate(()=>fixtureCalls.length);
  await page.evaluate(()=>fixtureRender([fixtureRecord(3,'image','missing',{thumb:'data:image/png;base64,'+fixturePng,snippet:'Ein bestehender Vorschaustand.'})]));await page.locator('.pb-result-preview[data-state="ready"] img').waitFor();
  ok('An already stored thumbnail remains useful even when its original is absent, without fetching bytes',await page.evaluate(()=>fixtureCalls.length)===beforeCached);
  await page.evaluate(()=>fixtureRender([fixtureRecord(4,'pdf','missing',{snippet:'/Subtype /Image /BitsPerComponent 8 /Width 1754 /Height 629 JFIF ICC_PROFILE\u0000\u0001\u0002'})]));await page.locator('.pb-result-preview[data-state="missing"]').waitFor();
  ok('A missing scanned PDF gets an honest compact placeholder, not a fake image or binary dump',await page.locator('.pb-result-preview img').count()===0&&await page.locator('.snip').isHidden()&&await page.evaluate(()=>fixtureCalls.length)===beforeCached);
  await page.waitForTimeout(120);ok('Unavailable originals do not create a hot retry loop',await page.evaluate(()=>fixtureCalls.length)===beforeCached);
  const beforeLargePdf=await page.evaluate(()=>fixtureCalls.length);
  await page.evaluate(()=>{
    const rec=fixtureRecord(5,'pdf','local',{size:16*1024*1024+1});fixtureRender([rec]);
  });await page.locator('.pb-result-preview[data-state="unavailable"]').waitFor();
  ok('A known-large catalog PDF starts neither a native metadata probe nor an automatic PDF open',await page.evaluate(()=>fixtureCalls.length)===beforeLargePdf);
  const beforeMisleadingSize=await page.evaluate(()=>fixtureCalls.length);
  await page.evaluate(()=>{const rec=fixtureRecord(55,'pdf','local',{size:1200});fixtureOriginals.set(rec.hash,{hash:rec.hash,size:16*1024*1024+1,name:rec.name,type:rec.type});fixtureRender([rec]);});
  await page.locator('.pb-result-preview[data-state="unavailable"]').waitFor();
  ok('A small catalog hint cannot bypass the actual native 16 MiB limit',await page.evaluate(before=>{const calls=fixtureCalls.slice(before);return calls.length===1&&calls[0].method==='originalInfo';},beforeMisleadingSize));
  const beforeLargeImage=await page.evaluate(()=>fixtureResolveCount);
  await page.evaluate(()=>fixtureRender([fixtureRecord(6,'image','local',{size:2*1024*1024+1})]));await page.locator('.pb-result-preview[data-state="unavailable"]').waitFor();
  ok('Oversized image metadata prevents a whole-image bridge read',await page.evaluate(()=>fixtureResolveCount)===beforeLargeImage);
  await page.evaluate(()=>{
    const rec=fixtureRecord(7,'pdf','local'),viewer=document.createElement('section');viewer.className='native-file-viewer';viewer.hidden=false;document.body.append(viewer);fixtureRender([rec]);
  });await page.waitForTimeout(120);
  ok('Background result previews do not compete with an open file viewer',await page.evaluate(()=>fixtureCalls.filter(c=>c.method==='openPdf').length)===initialOpen);
  await page.evaluate(()=>document.querySelector('.native-file-viewer').hidden=true);await page.locator('.pb-result-preview[data-state="ready"] img').waitFor();
  ok('Closing the viewer resumes the visible result preview',await page.evaluate(()=>fixtureCalls.filter(c=>c.method==='openPdf').length)===initialOpen+1);
  await page.evaluate(()=>{document.querySelector('.native-file-viewer').remove();const rec=fixtureRecord(8,'pdf','local');fixtureRender([rec]);document.querySelector('.card').style.marginTop='2500px';});
  await page.waitForTimeout(120);const beforeScroll=await page.evaluate(()=>fixtureCalls.filter(c=>c.method==='openPdf').length);
  await page.locator('.card').scrollIntoViewIfNeeded();await page.locator('.pb-result-preview[data-state="ready"] img').waitFor();
  ok('Offscreen records load only after scrolling them into view',await page.evaluate(()=>fixtureCalls.filter(c=>c.method==='openPdf').length)===beforeScroll+1);
  await page.evaluate(()=>{window.scrollTo(0,0);fixtureFailure=true;fixtureRender([fixtureRecord(9,'pdf','local')]);});await page.locator('.pb-result-preview[data-state="unavailable"]').waitFor();
  const afterFailure=await page.evaluate(()=>fixtureCalls.filter(c=>c.method==='openPdf').length);await page.waitForTimeout(120);
  ok('Rendering failure closes its native session and does not repeatedly retry at idle',await page.evaluate(afterFailure=>fixtureCalls.filter(c=>c.method==='openPdf').length===afterFailure&&fixtureOpen===0,afterFailure));
  await page.evaluate(()=>{fixtureFailure=false;fixtureHold=true;fixtureRender([fixtureRecord(10,'pdf','local')]);});await page.waitForFunction(()=>typeof fixtureRelease==='function');
  await page.evaluate(()=>{window.dispatchEvent(new PageTransitionEvent('pagehide'));fixtureRelease();});await page.waitForFunction(()=>fixtureOpen===0);
  ok('Suspending during a render closes that session, cancels its result and revokes cached object URLs',await page.evaluate(()=>fixtureURLs.size===0&&fixtureRevoked>0&&document.querySelector('.pb-result-preview').dataset.state==='idle'));
  await page.evaluate(()=>{fixtureHold=false;window.dispatchEvent(new PageTransitionEvent('pageshow'));});await page.locator('.pb-result-preview[data-state="ready"] img').waitFor();
  ok('The same result can safely reload after returning to the page',true);
  for(let n=20;n<40;n++){
    await page.evaluate(n=>fixtureRender([fixtureRecord(n,'pdf','local')]),n);await page.locator('.pb-result-preview[data-state="ready"] img').waitFor();
  }
  ok('Many different results stay within the bounded thumbnail cache and one native render at a time',await page.evaluate(()=>fixtureURLs.size<=16&&fixtureMaxURLs<=16&&fixtureMaxOpen===1&&[...fixtureURLs.values()].reduce((a,b)=>a+b,0)<=6*1024*1024));
  await page.setViewportSize({width:320,height:600});
  ok('The thumbnail keeps a compact fixed footprint at phone width',await page.locator('.pb-result-preview').evaluate(node=>{const r=node.getBoundingClientRect();return r.width===56&&r.height===64;}));
  await page.setViewportSize({width:800,height:600});
  const cachedResult=await page.evaluate(()=>({hash:CATALOG[0].hash,url:document.querySelector('#results .pb-result-preview img').src,opens:fixtureCalls.filter(c=>c.method==='openPdf').length}));
  await page.evaluate(()=>{fixtureExplorerRender([CATALOG[0]]);fixtureNavigate('explorer');});
  await page.locator('#explorerFiles .pb-result-preview[data-state="ready"] img').waitFor();
  ok('Switching from search to an Explorer file reuses the exact same cached page without reopening the PDF',await page.evaluate(cached=>document.querySelector('#explorerFiles .pb-result-preview img').src===cached.url&&fixtureCalls.filter(c=>c.method==='openPdf').length===cached.opens,cachedResult));
  await page.locator('#explorerFiles .pb-result-preview').click();
  ok('Explorer thumbnails preserve the existing original-opening action',await page.evaluate(hash=>fixtureOpened.at(-1)===hash,cachedResult.hash));
  await page.evaluate(()=>document.getElementById('panel-search').classList.add('on'));
  await page.locator('#results .pb-result-preview[data-state="ready"] img').waitFor();
  ok('Overlapping visible search and Explorer rows retain one cached URL and one render lane',await page.evaluate(cached=>{
    const a=document.querySelector('#results .pb-result-preview img'),b=document.querySelector('#explorerFiles .pb-result-preview img');
    return a.src===b.src&&a.src===cached.url&&fixtureCalls.filter(c=>c.method==='openPdf').length===cached.opens&&fixtureMaxOpen===1;
  },cachedResult));
  await page.evaluate(()=>fixtureNavigate('explorer'));
  await page.evaluate(()=>{const rec=CATALOG[0];SESSION_FILES.set(rec.hash,new File(['session bytes'],rec.name));window.dispatchEvent(new Event('pb-originals-change'));});
  await page.waitForFunction(()=>document.querySelector('#explorerFiles .pb-result-preview').dataset.original==='local');
  ok('Thumbnail availability uses the shared adapter, including local-before-session precedence',await page.evaluate(()=>PBRecordStatus.availability(CATALOG[0]).key==='local'&&document.querySelector('#explorerFiles .pb-result-preview').dataset.original==='local'));
  await page.evaluate(()=>{const rec=CATALOG[0];SESSION_FILES.delete(rec.hash);fixtureKinds.set(rec.hash,'missing');window.dispatchEvent(new Event('pb-originals-change'));});
  await page.waitForFunction(()=>document.querySelector('#explorerFiles .pb-result-preview').dataset.original==='missing');
  ok('A cached rendered page remains a preview when its original disappears, with explicit label and line indicator',await page.locator('#explorerFiles .pb-result-preview img').count()===1&&await page.locator('#explorerFiles .pb-result-preview-source').count()===1&&await page.locator('#explorerFiles .pb-result-preview').getAttribute('aria-label').then(text=>text.includes('Miniaturvorschau')&&text.includes('Original fehlt'))&&await page.evaluate(()=>PBRecordStatus.availability(CATALOG[0]).key==='missing'));
  const beforeExplorerImage=await page.evaluate(()=>fixtureCalls.length);
  await page.evaluate(()=>{
    const image=fixtureRecord(101,'image','missing',{thumb:'data:image/png;base64,'+fixturePng,path:'Mail-Anhang/Anna/Foto.png'});
    const mail=fixtureRecord(102,'pdf','missing',{mail:{from:'Anna'},name:'Mail with image.pdf'});fixtureExplorerRender([image,mail]);
    const dir=document.createElement('article');dir.className='explorer-dir';dir.dataset.hash=image.hash;dir.textContent='Fotos und Bilder';document.getElementById('explorerFiles').append(dir);
    const vault=document.createElement('article');vault.className='explorer-row native-vault-row';vault.dataset.hash=image.hash;vault.innerHTML='<div><strong>Stored provider attachment</strong><div class="explorer-meta">Different vault data source</div></div>';document.getElementById('explorerFiles').append(vault);
  });await page.locator('#explorerFiles .explorer-row[data-kind="attach"] .pb-result-preview[data-state="ready"] img').waitFor();
  ok('Imported image attachments use their saved thumbnail in Explorer without reading an original',await page.evaluate(()=>fixtureCalls.length)===beforeExplorerImage&&await page.locator('#explorerFiles .explorer-row[data-kind="attach"] .pb-result-preview').getAttribute('title').then(text=>text.includes('Gespeicherte Vorschau')&&text.includes('Original fehlt')));
  ok('Folders, mail containers and separate vault rows do not acquire invented catalog-file previews',await page.locator('#explorerFiles .explorer-dir .pb-result-preview,#explorerFiles [data-kind="mail"] .pb-result-preview,#explorerFiles .native-vault-row .pb-result-preview').count()===0);
  await page.evaluate(()=>{
    const row=document.querySelector('#explorerFiles [data-kind="attach"]'),host=row.querySelector(':scope>div'),badge=document.createElement('button');badge.className='pb-check-badge';badge.dataset.check='missing';badge.textContent='Original fehlt · nicht prüfbar';window.fixtureMissingBadge=badge;host.append(badge,PBRecordStatus.render(CATALOG[0]));
  });
  const attachHost=page.locator('#explorerFiles [data-kind="attach"]>div');
  ok('An Explorer missing-check badge hides only the duplicate direct missing-availability text',await attachHost.locator(':scope>.pb-check-badge[data-check="missing"]').isVisible()&&await attachHost.locator(':scope>.pb-record-availability[data-original="missing"]').isHidden()&&await page.evaluate(()=>fixtureMissingBadge.isConnected&&PBRecordStatus.availability(CATALOG[0]).key==='missing'));
  await page.evaluate(()=>{fixtureMissingBadge.dataset.check='partial';fixtureMissingBadge.textContent='Teilweise geprüft';});
  ok('A historical partial check and missing-original fact remain separately visible',await attachHost.locator(':scope>.pb-check-badge[data-check="partial"]').isVisible()&&await attachHost.locator(':scope>.pb-record-availability[data-original="missing"]').isVisible());
  await page.evaluate(()=>{
    fixtureKinds.set(CATALOG[0].hash,'local');const host=document.querySelector('#explorerFiles [data-kind="attach"]>div');host.querySelector(':scope>.pb-record-availability').replaceWith(PBRecordStatus.render(CATALOG[0]));window.dispatchEvent(new Event('pb-originals-change'));
  });
  await page.waitForFunction(()=>document.querySelector('#explorerFiles [data-kind="attach"] .pb-result-preview').dataset.original==='local');
  ok('Restored local availability stays visible and correct while retaining the historical check node',await attachHost.locator(':scope>.pb-record-availability[data-original="local"]').isVisible()&&await page.evaluate(()=>fixtureMissingBadge.isConnected&&PBRecordStatus.availability(CATALOG[0]).key==='local')&&await attachHost.locator('.pb-result-preview-source').count()===0);
  await page.evaluate(()=>{fixtureKinds.set(CATALOG[0].hash,'missing');const host=document.querySelector('#explorerFiles [data-kind="attach"]>div');host.querySelector(':scope>.pb-record-availability').replaceWith(PBRecordStatus.render(CATALOG[0]));window.dispatchEvent(new Event('pb-originals-change'));});
  for(const lang of ['en','ru','pl']){
    await page.evaluate(lang=>document.documentElement.lang=lang,lang);
    await page.waitForFunction(()=>document.querySelector('#explorerFiles .pb-result-preview').getAttribute('aria-label').includes(PBRecordStatus.availability(CATALOG[0]).label));
  }
  ok('Shared missing-original labels stay translated in English, Russian and Polish',true);
  await page.evaluate(()=>{document.documentElement.lang='de';const rec=CATALOG[0];fixtureRender([rec]);fixtureNavigate('search');});await page.locator('#results .pb-result-preview[data-state="ready"] img').waitFor();
  ok('Returning to search gives the same cached-only availability and indicator',await page.locator('#results .pb-result-preview').getAttribute('aria-label').then(text=>text.includes('Gespeicherte Vorschau')&&text.includes('Original fehlt'))&&await page.locator('#results .pb-result-preview-source').count()===1);
  await page.evaluate(()=>{fixtureHold=true;delete window.fixtureRelease;fixtureRender([fixtureRecord(201,'pdf','local')]);fixtureExplorerRender([CATALOG[0]]);fixtureNavigate('search');});
  await page.waitForFunction(()=>typeof fixtureRelease==='function');
  await page.evaluate(()=>{fixtureNavigate('explorer');fixtureHold=false;fixtureRelease();});await page.locator('#explorerFiles .pb-result-preview[data-state="ready"] img').waitFor();
  ok('Changing views during an in-flight PDF finishes one session and shares its page with the new visible view',await page.evaluate(()=>fixtureCalls.filter(c=>c.method==='openPdf'&&c.args.hash===CATALOG[0].hash).length===1&&fixtureOpen===0&&fixtureMaxOpen===1));
  await page.evaluate(()=>{fixtureHold=true;delete window.fixtureRelease;fixtureRender([fixtureRecord(202,'pdf','local')]);document.getElementById('explorerFiles').replaceChildren();fixtureNavigate('search');});
  await page.waitForFunction(()=>typeof fixtureRelease==='function');
  await page.evaluate(()=>{PBResultPreviews.dispose();fixtureRelease();});await page.waitForFunction(()=>fixtureOpen===0);
  ok('Disposal releases every generated object URL',await page.evaluate(()=>fixtureURLs.size===0&&fixtureOpen===0));
  ok('A late native page response after disposal creates no thumbnail URL or stale image',await page.evaluate(()=>document.querySelector('#results .pb-result-preview img')===null&&fixtureURLs.size===0));
  ok('No original/mail network request or runtime error was introduced',external.length===0&&errors.length===0||console.error({external,errors}));
  console.log(`${count} result-preview checks passed (real DOM/raster; simulated native PDF transport).`);
}finally{await browser?.close();}
