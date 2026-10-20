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
    window.pdfCalls=[];window.openCalls=[];window.shareCalls=[];window.closedPdfs=[];
    window.Capacitor={Plugins:{ProFiles:{
      async openPdf(args){pdfCalls.push(args);if(window.deferPdf)return new Promise(resolve=>window.finishPdf=resolve);return {id:'fixture-session',pages:2};},
      async pdfPage(args){pdfCalls.push(args);if(window.failPdf)throw new Error('fixture failure');return {data:'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6r9sAAAAASUVORK5CYII=',width:1,height:1};},
      async closePdf(args){closedPdfs.push(args.id);},async open(args){openCalls.push(args);},async share(args){shareCalls.push(args);}
    }}};
  });
  await page.goto(url);await page.waitForFunction(()=>Boolean(window.PBPDF&&window.PBNavigation));
  await page.evaluate(()=>{PBWorkspace.navigate('explorer');window.fixture=new File(['fixture-pdf'],'Scanned pages.pdf',{type:'application/pdf'});Object.defineProperty(fixture,'pbOriginalHash',{value:'a'.repeat(64)});showBlob(fixture);});
  const ready=async text=>{await page.waitForFunction(text=>{const image=document.querySelector('.native-pdf-page');return image&&!image.hidden&&image.complete&&image.naturalWidth===1&&document.querySelector('.native-pdf-toolbar span').textContent===text;},text);};
  await ready('Seite 1 von 2');
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
  ok('No browser navigation or unhandled runtime errors',page.url().startsWith(url)&&errors.length===0);
  console.log(`${count} PDF UI checks passed (mock bridge; real PDF rendering tested on Android).`);
}finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
