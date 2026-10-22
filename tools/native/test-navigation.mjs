import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {chromium} from 'playwright-core';
async function clickControl(page,selector) {
  const control=page.locator(selector);
  if(!await control.isVisible())await control.locator('xpath=ancestor::details[1]').locator(':scope>summary').click();
  await control.click();
}
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
  let popups=0;page.on('popup',()=>popups++);page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',r=>r.request().url().startsWith(url)?r.continue():r.abort());
  await page.addInitScript(()=>{window.openedFiles=[];window.Capacitor={Plugins:{ProFiles:{async open(args){window.openedFiles.push(args);}}}};});
  await page.goto(url);await page.waitForFunction(()=>window.PBNavigation&&typeof db!=='undefined'&&db);
  const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6r9sAAAAASUVORK5CYII=','base64');
  await page.setInputFiles('#fileInput',[{name:'navigation-image.png',mimeType:'image/png',buffer:png},{name:'navigation-note.txt',mimeType:'text/plain',buffer:Buffer.from('Original local text <script>window.injection=true</script>')}]);
  await page.waitForFunction(()=>CATALOG.length===2);
  await page.evaluate(()=>{window.imageHash=CATALOG.find(r=>r.name==='navigation-image.png').hash;window.noteHash=CATALOG.find(r=>r.name==='navigation-note.txt').hash;CATALOG.find(r=>r.hash===imageHash).path='Root/Photos/Deep/navigation-image.png';PBWorkspace.refresh();});
  await page.click('[data-tab=explorer]');
  await page.locator('#explorerTree button[data-path="Root/Photos/Deep"]').click();
  await page.fill('#explorerFilter','navigation-image');
  await page.evaluate(()=>openFile(imageHash));
  await page.locator('.native-file-image').waitFor();
  ok('Imported original opens inside app without popup or blob navigation',page.url().startsWith(url)&&!page.url().startsWith('blob:')&&popups===0);
  ok('Original image bytes available in viewer',await page.locator('.native-file-image').evaluate(img=>img.complete&&img.naturalWidth===1));
  await page.click('.native-file-head button:first-child');await page.locator('.native-file-viewer').waitFor({state:'hidden'});
  ok('Visible Back restores folder, filter and catalog',await page.evaluate(()=>PBWorkspace.explorerState().path==='Root/Photos/Deep'&&PBWorkspace.explorerState().filter==='navigation-image'&&CATALOG.length===2));
  await page.keyboard.press('Alt+ArrowRight');await page.locator('.native-file-image').waitFor();
  ok('Forward reopens the original image',await page.locator('.native-file-image').isVisible());
  await page.keyboard.press('Escape');await page.locator('.native-file-viewer').waitFor({state:'hidden'});
  await page.evaluate(()=>openFile(noteHash));await page.locator('.native-file-text').waitFor();
  ok('Text remains literal and cannot execute HTML',await page.locator('.native-file-text').textContent().then(t=>t.includes('<script>'))&&!await page.evaluate(()=>window.injection));
  await page.keyboard.press('Alt+ArrowLeft');await page.locator('.native-file-viewer').waitFor({state:'hidden'});
  await page.evaluate(()=>{const file=new File(['missing'],'missing.txt',{type:'text/plain'});file.text=async()=>{throw new Error('unavailable');};showBlob(file);});
  await page.getByText('Datei konnte nicht geöffnet werden.',{exact:true}).waitFor();
  await page.keyboard.press('Escape');await page.locator('.native-file-viewer').waitFor({state:'hidden'});
  ok('Unreadable file retains a working Back button',await page.locator('#explorerFiles').isVisible());
  await page.evaluate(()=>{const file=new File(['slow'],'slow.txt',{type:'text/plain'});file.text=()=>new Promise(r=>window.finishFileRead=r);showBlob(file);});
  await page.getByText('Datei wird geladen …',{exact:true}).waitFor();
  await page.keyboard.press('Escape');await page.locator('.native-file-viewer').waitFor({state:'hidden'});
  await page.evaluate(()=>finishFileRead('late read'));
  ok('Late file read cannot reopen a closed viewer',await page.locator('.native-file-viewer').isHidden());
  await page.evaluate(()=>openLightbox(imageHash));await page.locator('#lightboxBg.on').waitFor();
  await page.click('#lightboxOpen');await page.locator('.native-file-image').waitFor();
  await page.goBack();await page.locator('.native-file-viewer').waitFor({state:'hidden'});
  ok('Browser Back from original returns to enlarged preview',await page.locator('#lightboxBg').evaluate(e=>e.classList.contains('on')));
  await page.keyboard.press('Escape');await page.locator('#lightboxBg.on').waitFor({state:'hidden'});
  ok('Second Back closes preview and leaves app usable',await page.locator('#explorerFiles').isVisible());
  await page.evaluate(()=>showBlob(new File(['%PDF-1.4'],'sample.pdf',{type:'application/pdf'}),{name:'sample.pdf'}));
  await page.locator('.native-file-viewer').waitFor();await page.getByRole('button',{name:'Öffnen mit …'}).click();
  await page.waitForFunction(()=>openedFiles.length===1);
  ok('Unsupported document opens only through explicit native chooser',await page.evaluate(()=>openedFiles[0].name==='sample.pdf'&&atob(openedFiles[0].data)==='%PDF-1.4')&&page.url().startsWith(url));
  await page.keyboard.press('Escape');await page.locator('.native-file-viewer').waitFor({state:'hidden'});
  // Each distinct file view is a real history entry; no six-step artificial cap.
  for(let i=0;i<12;i++){
    await page.evaluate(i=>showBlob(new File(['Step '+i],'step-'+i+'.txt',{type:'text/plain'}),{name:'step-'+i+'.txt'}),i);
    await page.waitForFunction(i=>document.querySelector('.native-file-text')?.textContent==='Step '+i,i);
  }
  for(let i=10;i>=0;i--){
    await page.keyboard.press('Alt+ArrowLeft');
    await page.waitForFunction(i=>document.querySelector('.native-file-text')?.textContent==='Step '+i,i);
  }
  await page.keyboard.press('Alt+ArrowLeft');await page.locator('.native-file-viewer').waitFor({state:'hidden'});
  ok('Twelve consecutive Back steps return through file views to Explorer',await page.locator('#explorerFiles').isVisible());
  await page.evaluate(()=>{for(let i=0;i<12;i++)PBWorkspace.navigate(i%2?'settings':'search');});
  for(let i=10;i>=0;i--){await page.evaluate(()=>PBNavigation.back());await page.waitForFunction(i=>document.querySelector('.panel.on').id===(i%2?'panel-settings':'panel-search'),i);}
  await page.evaluate(()=>PBNavigation.back());await page.waitForFunction(()=>document.querySelector('#panel-explorer').classList.contains('on'));
  ok('Twelve page-history steps use the same Back path',await page.locator('#explorerFiles').isVisible());
  await page.fill('#explorerFilter','abc');await page.keyboard.press('Backspace');
  ok('Backspace in an input edits without navigating',await page.inputValue('#explorerFilter')==='ab'&&await page.locator('#explorerFiles').isVisible());
  await page.evaluate(()=>showBlob(new File(['mouse'],'mouse.txt',{type:'text/plain'})));
  await page.locator('.native-file-text').waitFor();await page.evaluate(()=>window.dispatchEvent(new MouseEvent('mousedown',{button:3,cancelable:true})));
  await page.locator('.native-file-viewer').waitFor({state:'hidden'});ok('Mouse Back closes file view',true);
  for(const [lang,word] of [['en','← Back'],['ru','← Назад'],['pl','← Wstecz'],['de','← Zurück']]){
    await clickControl(page,`[data-lang=${lang}]`);ok(lang+': navigation follows app language',await page.locator('.native-navigation button').first().textContent()===word);
  }
  for(const width of [320,768,1920]){
    await page.setViewportSize({width,height:900});await page.evaluate(()=>showBlob(new File(['width'],'width.txt',{type:'text/plain'})));await page.locator('.native-file-text').waitFor();
    ok(width+'px: Back remains visible with no page overflow',await page.locator('.native-file-head button').first().isVisible()&&await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    await page.keyboard.press('Escape');await page.locator('.native-file-viewer').waitFor({state:'hidden'});
  }
  ok('No popup, reload, private network call or runtime error',popups===0&&errors.length===0&&await page.evaluate(()=>CATALOG.length===2));
  console.log(`${count} navigation checks passed (browser UI; Android Back tested separately).`);
}finally{await browser?.close();await new Promise(r=>server.close(r));}
