import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {chromium} from 'playwright-core';
const root=resolve('www'),types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.woff2':'font/woff2','.json':'application/json'};
const server=createServer(async(req,res)=>{
  const path=resolve(root,'.'+new URL(req.url,'http://local').pathname.replace(/\/$/,'/index.html'));
  if(!path.startsWith(root+sep)){res.writeHead(403).end();return;}
  try{const bytes=await readFile(path);res.writeHead(200,{'content-type':types[extname(path)]||'application/octet-stream'}).end(bytes);}catch{res.writeHead(404).end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
let browser,count=0;const ok=(name,value)=>{assert.ok(value,name);console.log('✓ '+name);count++;};
try{
  browser=await chromium.launch({executablePath:process.env.CB_CHROMIUM||'/usr/bin/chromium',args:['--no-sandbox']});
  const page=await browser.newPage(),url=`http://127.0.0.1:${server.address().port}/`,errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.route('**/*',route=>route.request().url().startsWith(url)?route.continue():route.abort());
  await page.addInitScript(()=>{
    window.pdfCalls=[];window.openCalls=[];window.shareCalls=[];window.closedPdfs=[];window.originalByteReads=0;window.originalMetadataReads=0;
    window.activityCalls=[];
    window.Capacitor={Plugins:{ProFiles:{
      async listOriginals(){return{items:['a'.repeat(64)]};},async beginImport(){throw new Error('unused import');},
      async originalInfo(){originalMetadataReads++;throw new Error('redundant metadata read');},async readOriginal(){originalByteReads++;throw new Error('redundant byte read');},
      async openPdf(args){pdfCalls.push(args);if(window.failOriginal)throw Object.assign(new Error('missing original'),{code:'ORIGINAL_UNAVAILABLE'});if(window.failPreview)throw Object.assign(new Error('unsupported PDF preview'),{code:'PDF_PREVIEW_UNAVAILABLE'});if(window.deferPdf)return new Promise(resolve=>window.finishPdf=resolve);return {id:'fixture-session',pages:2};},
      async pdfPage(args){pdfCalls.push(args);if(window.failPdf)throw new Error('fixture failure');return {data:'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6r9sAAAAASUVORK5CYII=',width:1,height:1};},
      async closePdf(args){closedPdfs.push(args.id);},async open(args){openCalls.push(args);},async share(args){shareCalls.push(args);if(window.deferShare)return new Promise((resolve,reject)=>{window.finishShare=resolve;window.failShare=reject;});}
    }}};
  });
  await page.goto(url);await page.waitForFunction(()=>Boolean(window.PBPDF&&window.PBNavigation&&window.PBActivity&&window.PBOriginals?.snapshot().ready));
  await page.evaluate(()=>{const real=PBActivity;window.PBActivity={...real,start(options){const call={beforeNative:shareCalls.length+openCalls.length};activityCalls.push(call);const token=real.start(options);return{ready:token.ready,finish(){call.finished=true;token.finish();}};}};});
  await page.evaluate(()=>{PBWorkspace.navigate('explorer');window.fixture=new File(['fixture-pdf'],'Scanned pages.pdf',{type:'application/pdf'});Object.defineProperty(fixture,'pbOriginalHash',{value:'a'.repeat(64)});CATALOG=[{hash:'a'.repeat(64),name:fixture.name,size:80*1024*1024,type:'application/pdf'}];SESSION_FILES.clear();void openFile(CATALOG[0].hash);});
  const ready=async text=>{await page.waitForFunction(text=>{const image=document.querySelector('.native-pdf-page');return image&&!image.hidden&&image.complete&&image.naturalWidth===1&&document.querySelector('.native-pdf-toolbar span').textContent===text;},text);};
  await ready('Seite 1 von 2');
  ok('A known native PDF mounts its controls without a full metadata/byte bridge roundtrip',await page.evaluate(()=>originalMetadataReads===0&&originalByteReads===0&&SESSION_FILES.size===0));
  ok('PDF view requests stored original by hash without transferring a second file',await page.evaluate(()=>pdfCalls[0].hash==='a'.repeat(64)&&Object.keys(pdfCalls[0]).length===1));
  ok('No external app opens automatically',await page.evaluate(()=>openCalls.length===0&&shareCalls.length===0));
  await page.getByRole('button',{name:'Weiterblättern',exact:true}).click();await ready('Seite 2 von 2');
  ok('Next page renders and stops at final page',await page.getByRole('button',{name:'Weiterblättern',exact:true}).isDisabled()&&await page.evaluate(()=>pdfCalls.at(-1).page===1));
  await page.getByRole('button',{name:'Zurückblättern',exact:true}).click();await ready('Seite 1 von 2');
  ok('Previous page returns to first PDF page',await page.getByRole('button',{name:'Zurückblättern',exact:true}).isDisabled());
  await page.locator('.native-pdf-toolbar select').selectOption('2');await ready('Seite 1 von 2');
  ok('Zoom keeps page selection and enlarges the page',await page.locator('.native-pdf-page').evaluate(image=>image.style.width==='200%'));
  await page.getByRole('button',{name:'Öffnen mit …',exact:true}).click();await page.waitForFunction(()=>openCalls.length===1);
  await page.getByRole('button',{name:'Teilen …',exact:true}).click();await page.waitForFunction(()=>shareCalls.length===1);
  ok('Open and Share pass the same durable original only after explicit clicks',await page.evaluate(()=>JSON.stringify(openCalls[0])===JSON.stringify(shareCalls[0])&&shareCalls[0].hash==='a'.repeat(64)));
  await page.evaluate(()=>{window.deferShare=true;});
  await page.getByRole('button',{name:'Teilen …',exact:true}).click();await page.waitForFunction(()=>typeof finishShare==='function');
  ok('Share visibly enters busy state before a delayed native handoff and keeps the UI responsive',await page.evaluate(()=>document.querySelector('.native-file-head>[data-native-action=share]').disabled&&!document.querySelector('#pb-activity').hidden&&activityCalls.at(-1).beforeNative===2&&!activityCalls.at(-1).finished));
  await page.evaluate(()=>{document.querySelector('.native-file-head>[data-native-action=share]').click();});
  ok('A second click cannot start the same slow handoff again',await page.evaluate(()=>shareCalls.length===2));
  await page.evaluate(()=>{finishShare({ok:true});window.deferShare=false;});await page.getByRole('button',{name:'Teilen …',exact:true}).isEnabled();
  await page.waitForFunction(()=>activityCalls.at(-1).finished&& !document.querySelector('.native-file-head>[data-native-action=share]').disabled);
  ok('Native completion restores controls and closes only its own busy indicator',await page.evaluate(()=>activityCalls.at(-1).finished&&shareCalls.length===2));
  await page.evaluate(()=>{window.deferShare=true;window.failShare=null;});
  await page.getByRole('button',{name:'Teilen …',exact:true}).click();await page.waitForFunction(()=>typeof failShare==='function');
  await page.keyboard.press('Escape');await page.locator('.native-file-viewer').waitFor({state:'hidden'});
  await page.evaluate(()=>showBlob(fixture,{name:'Second reading.pdf'}));await ready('Seite 1 von 2');
  ok('A newer reader stays disabled while the preceding explicit handoff still settles',await page.getByRole('button',{name:'Teilen …',exact:true}).isDisabled());
  await page.evaluate(()=>{failShare(new Error('old share failure'));window.deferShare=false;});
  await page.waitForFunction(()=>activityCalls.at(-1).finished&& !document.querySelector('.native-file-head>[data-native-action=share]').disabled);
  ok('A late share failure cannot append an error to the newer reader',await page.locator('.native-file-title').textContent()==='Second reading.pdf'&&await page.locator('.native-file-body').textContent().then(text=>!text.includes('Datei konnte nicht geöffnet werden.')));
  await page.locator('.native-pdf-page').click({button:'right'});await page.getByRole('menu').waitFor();
  ok('Mouse context menu offers Open and Share',await page.getByRole('menuitem').count()===2);
  await page.keyboard.press('Escape');await page.getByRole('menu').waitFor({state:'hidden'});
  ok('First Back dismisses context menu and keeps the PDF open',await page.locator('.native-pdf-page').isVisible());
  await page.evaluate(()=>window.failPdf=true);await page.getByRole('button',{name:'Weiterblättern',exact:true}).click();
  await page.getByText('PDF kann nicht angezeigt werden. Nutze „Öffnen mit …“ oder „Teilen …“.',{exact:true}).waitFor();
  ok('Failed page does not mislabel the preceding image; Open and Share remain available',await page.locator('.native-pdf-page').isHidden()&&await page.getByRole('button',{name:'Teilen …',exact:true}).isEnabled());
  await page.keyboard.press('Escape');await page.locator('.native-file-viewer').waitFor({state:'hidden'});await page.waitForFunction(()=>closedPdfs.includes('fixture-session'));
  ok('Back closes PDF session and restores Explorer',await page.locator('#panel-explorer').isVisible());
  await page.evaluate(()=>{window.deferPdf=true;showBlob(fixture);});await page.waitForFunction(()=>typeof window.finishPdf==='function');
  await page.keyboard.press('Escape');await page.locator('.native-file-viewer').waitFor({state:'hidden'});
  await page.evaluate(()=>finishPdf({id:'late-session',pages:2}));await page.waitForFunction(()=>closedPdfs.includes('late-session'));
  ok('Late native PDF open closes its session without reopening the viewer',await page.locator('.native-file-viewer').isHidden());
  await page.evaluate(()=>{window.deferPdf=false;window.failOriginal=true;showBlob(fixture);});
  await page.getByRole('button',{name:'Original erneut auswählen',exact:true}).waitFor();
  ok('A failed native original check marks the copy unreadable without fetching or reimporting it',await page.evaluate(()=>PBOriginals.statusFor('a'.repeat(64))==='unavailable'&&originalByteReads===0&&originalMetadataReads===0));
  await page.getByRole('button',{name:'Original erneut auswählen',exact:true}).click();await page.locator('.native-original-reconnect').waitFor();
  ok('The optimized PDF path still offers explicit original recovery with the catalog intact',await page.evaluate(()=>CATALOG.length===1&&document.querySelector('.native-original-reconnect').textContent.includes('Scanned pages.pdf')));
  await page.evaluate(()=>{document.querySelector('.native-original-reconnect').close();window.failOriginal=false;window.failPdf=false;showBlob(fixture);});await ready('Seite 1 von 2');
  const beforeAbandoned=await page.evaluate(()=>shareCalls.length);
  await page.evaluate(()=>{document.querySelector('.native-file-head>[data-native-action=share]').click();PBNavigation.navigate('explorer');});
  await page.waitForFunction(()=>activityCalls.at(-1).finished&&document.querySelector('.native-file-viewer').hidden);
  ok('Leaving during the initial activity paint starts no delayed native share',await page.evaluate(()=>shareCalls.length)===beforeAbandoned);
  await page.evaluate(()=>{showBlob(fixture);window.originalArguments=PBPDF.arguments;window.finishArguments=null;});await ready('Seite 1 von 2');
  // Install the deferred encoder after the PDF itself has opened.
  await page.evaluate(()=>{PBPDF.arguments=()=>new Promise(resolve=>window.finishArguments=resolve);});
  await page.getByRole('button',{name:'Teilen …',exact:true}).click();await page.waitForFunction(()=>typeof finishArguments==='function');
  await page.evaluate(()=>{PBNavigation.navigate('explorer');finishArguments({hash:'a'.repeat(64)});PBPDF.arguments=window.originalArguments;});
  await page.waitForFunction(()=>activityCalls.at(-1).finished&&document.querySelector('.native-file-viewer').hidden);
  ok('Leaving during asynchronous file encoding starts no stale native share',await page.evaluate(()=>shareCalls.length)===beforeAbandoned);
  await page.evaluate(()=>{window.failPreview=true;const hash='c'.repeat(64);PBOriginals.stored.add(hash);showBlob(Object.freeze({name:'Unsupported PDF.pdf',size:100,type:'application/pdf',pbOriginalHash:hash}));});
  await page.locator('.native-pdf [role=status]').filter({hasText:'PDF kann nicht angezeigt werden.'}).waitFor();
  const previewState=await page.evaluate(()=>({availability:PBOriginals.statusFor('c'.repeat(64)),reconnectHidden:document.querySelector('.native-pdf>button').hidden,shareDisabled:document.querySelector('.native-file-head>[data-native-action=share]').disabled}));
  ok('A PDF preview-format failure keeps the verified local original and offers sharing, without false reconnect: '+JSON.stringify(previewState),previewState.availability==='local'&&previewState.reconnectHidden&&!previewState.shareDisabled);
  ok('No browser navigation or unhandled runtime errors',page.url().startsWith(url)&&errors.length===0);
  console.log(`${count} PDF UI checks passed (mock bridge; real PDF rendering tested on Android).`);
}finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
