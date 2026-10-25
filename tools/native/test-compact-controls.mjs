// A DeX split window keeps mouse density; touch-only windows keep touch targets.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {chromium} from 'playwright-core';
import {navigateTo} from './test-navigation-helper.mjs';

const root=resolve('www'),types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.woff2':'font/woff2','.svg':'image/svg+xml'};
const server=createServer(async(req,res)=>{
  const path=resolve(root,'.'+new URL(req.url,'http://local').pathname.replace(/\/$/,'/index.html'));
  if(!path.startsWith(root+sep))return res.writeHead(403).end();
  try{const bytes=await readFile(path);res.writeHead(200,{'content-type':types[extname(path)]||'application/octet-stream'}).end(bytes);}catch{res.writeHead(404).end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin=`http://127.0.0.1:${server.address().port}/`;
let browser,count=0;
const ok=(name,value,diagnostic)=>{assert.ok(value,name+(diagnostic?' '+JSON.stringify(diagnostic):''));console.log('✓ '+name);count++;};
const settle=page=>page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
async function fixture(touch){
  const context=await browser.newContext({viewport:{width:1600,height:900},hasTouch:touch}),page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.route('**/*',route=>route.request().url().startsWith(origin)?route.continue():route.abort());
  await page.addInitScript(()=>{
    window.Capacitor={isNativePlatform:()=>true,Plugins:{ProDevice:{async getInfo(){return{versionName:'compact-fixture'};}},ProFiles:{
      async listOriginals(){return{items:[]};},async beginImport(){throw new Error('No import in density fixture');},
      async openPdf(){return{id:'density-pdf',pages:2};},
      async pdfPage(){return{data:'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6r9sAAAAASUVORK5CYII=',width:1,height:1};},
      async closePdf(){return{ok:true};},async open(){return{ok:true};},async share(){return{ok:true};}
    }}};
  });
  await page.goto(origin);await page.waitForFunction(()=>document.readyState==='complete'&&window.PBWorkspace&&window.PBCheck&&window.PBPDF&&typeof db!=='undefined'&&db);
  await page.evaluate(async()=>{
    const name='Compact result.txt',words=tokens(name),record={hash:'c'.repeat(64),name,path:'Mail-Anhang/Max Muster/A long source folder/Compact result.txt',type:'text/plain',ext:'txt',date:1,size:42,snippet:'Readable compact sample',summary:'Readable compact sample',category:'Dokument',tags:[],dupes:[],dirId:null,nameTokens:words,vector:buildVector(words),tf:termFreq(words),pruefung:{zeit:1,funde:[],angaben:[],hinweise:[],ungeprueft:true}};
    await idbPut('catalog',record);CATALOG.push(record);HASHSET.add(record.hash);rebuildIndex();refreshAll();
  });
  await navigateTo(page,'search');await page.locator('#q').fill('Compact');await page.locator('#results .card').waitFor();
  return{context,page,errors};
}
async function geometry(page,selectors){
  return page.evaluate(selectors=>{
    const fine=matchMedia('(any-pointer:fine)').matches,target=fine?32:44;
    const controls=[...document.querySelectorAll(selectors)].map(node=>{const r=node.getBoundingClientRect(),style=getComputedStyle(node);return{id:node.id,class:node.className,label:node.getAttribute('aria-label')||node.textContent.trim(),height:r.height,width:r.width,minHeight:style.minHeight,cssHeight:style.height,padding:style.padding,lineHeight:style.lineHeight};}).filter(r=>r.width>0&&r.height>0);
    const open=document.querySelector('#results .openBtn');let openDiagnostic=null;
    if(open&&open.getBoundingClientRect().height>target+1){
      const style=getComputedStyle(open),properties=['display','box-sizing','height','min-height','max-height','block-size','min-block-size','max-block-size','font','font-size','line-height','padding','padding-block','padding-top','padding-bottom','align-self','align-items','vertical-align'];
      const matching=[];
      function inspect(rules,source,conditions=[]){for(const rule of rules){
        if(rule.type===CSSRule.MEDIA_RULE&&!matchMedia(rule.conditionText).matches)continue;
        if(rule.selectorText&&rule.style){let matches=false;try{matches=open.matches(rule.selectorText);}catch{}if(matches){const declarations={};for(const name of properties){const value=rule.style.getPropertyValue(name);if(value)declarations[name]=value+(rule.style.getPropertyPriority(name)?' !important':'');}if(Object.keys(declarations).length)matching.push({source,selector:rule.selectorText,conditions,declarations});}}
        if(rule.cssRules)inspect(rule.cssRules,source,rule.conditionText?[...conditions,rule.conditionText]:conditions);
      }}
      for(const sheet of document.styleSheets){try{inspect(sheet.cssRules,sheet.href?new URL(sheet.href).pathname:'inline');}catch{}}
      openDiagnostic={inline:open.getAttribute('style'),html:open.innerHTML,rect:open.getBoundingClientRect().toJSON(),computed:Object.fromEntries(properties.map(name=>[name,style.getPropertyValue(name)])),children:[...open.children].map(node=>({tag:node.tagName,class:node.getAttribute('class'),rect:node.getBoundingClientRect().toJSON(),height:getComputedStyle(node).height,lineHeight:getComputedStyle(node).lineHeight})),matching};
    }
    return{fine,target,controls,pageOverflow:document.documentElement.scrollWidth>innerWidth+1,openDiagnostic};
  },selectors);
}
function sizesFit(sample){return sample.controls.length>0&&sample.controls.every(control=>control.height>=sample.target-.1&&control.height<=sample.target+1)&&!sample.pageOverflow;}
try{
  browser=await chromium.launch({executablePath:process.env.CB_CHROMIUM||'/usr/bin/chromium',args:['--no-sandbox']});
  for(const touch of[false,true]){
    const {context,page,errors}=await fixture(touch);
    try{
      const viewports=touch?[[320,700],[768,1024]]:[[1600,900],[1000,900],[800,900],[600,900],[420,900],[600,1000]];
      for(const[width,height]of viewports){
        await page.setViewportSize({width,height});await navigateTo(page,'search');await settle(page);
        const search=await geometry(page,'.main-pages>.tab,.native-toolbar-quick>button,#panel-search #mic,#panel-search #mode button,#pb-search-language,#panel-search .filterbar>select,#panel-search .filterbar>button,#results .cardbtns>button,#results .pb-result-meta button,#results .pb-result-meta [role=button]');
        ok(`${touch?'Touch':'Mouse'} ${width}x${height}: pointer is genuinely ${touch?'coarse-only':'fine'}`,search.fine===!touch,search);
        ok(`${touch?'Touch':'Mouse'} ${width}x${height}: search, result actions and navigation retain ${search.target}px height`,sizesFit(search),search);
        ok(`${width}x${height}: no welcome block returns in search`,await page.locator('.search-welcome,[data-ws=find],[data-ws=findHelp]').count()===0);
        await page.locator('#pb-palette-button').click();await settle(page);
        const palette=await geometry(page,'#pb-palette [data-pb-palette-choice]');
        ok(`${width}x${height}: palette choices use the same ${palette.target}px profile`,sizesFit(palette),palette);await page.keyboard.press('Escape');
        await navigateTo(page,'intake');await settle(page);
        const intake=await geometry(page,'#chooseLibrary,#pauseLibrary,#pickDir,#pickFiles,#pickMail,#panel-intake .pb-help-toggle');
        ok(`${width}x${height}: import buttons and info targets use the same ${intake.target}px profile`,sizesFit(intake),intake);
        await navigateTo(page,'explorer');await page.locator('#pb-explorer-sort>summary').click();await settle(page);
        const explorer=await geometry(page,'.explorer-toolbar>button,.explorer-toolbar .pb-text-mic,#pb-explorer-sort>summary,#pb-explorer-sort-popup button');
        ok(`${width}x${height}: Sort and Explorer controls use the same ${explorer.target}px profile`,sizesFit(explorer),explorer);await page.keyboard.press('Escape');
        await page.evaluate(()=>{const file=new File(['synthetic PDF bridge fixture'],'Compact.pdf',{type:'application/pdf'});Object.defineProperty(file,'pbOriginalHash',{value:'b'.repeat(64)});showBlob(file,{name:file.name});});
        await page.waitForFunction(()=>{const image=document.querySelector('.native-pdf-page');return image&&!image.hidden&&image.complete&&image.naturalWidth===1;});await settle(page);
        const viewer=await geometry(page,'.native-file-head>button,.native-pdf-toolbar>button,.native-pdf-toolbar>select');
        ok(`${width}x${height}: viewer and PDF controls use the same ${viewer.target}px profile`,sizesFit(viewer),viewer);
        await page.locator('.native-file-head>button').first().click();
      }
      ok(`${touch?'Touch':'Mouse'} density checks produce no app errors`,errors.length===0,errors);
    }finally{await context.close();}
  }
  console.log(`${count} compact-control checks passed (actual pointer emulation and DOM; no physical DeX speed claim).`);
}finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
