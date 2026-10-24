// Real native DOM and activity module. Synthetic long actions test feedback and
// ownership, not device throughput or a successful native share-sheet handoff.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {chromium} from 'playwright-core';
const root=resolve(process.env.PB_ACTIVITY_TEST_ROOT||'www'),origin='https://localhost/';
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.png':'image/png','.woff2':'font/woff2','.svg':'image/svg+xml'};
let browser,count=0;
const ok=(name,value)=>{assert.ok(value,name);console.log('✓ '+name);count++;};
try{
  browser=await chromium.launch({executablePath:process.env.CB_CHROMIUM||'/usr/bin/chromium',args:['--no-sandbox']});
  const page=await browser.newPage({viewport:{width:1280,height:800}}),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.route('**/*',async route=>{
    const address=route.request().url();if(!address.startsWith(origin))return route.fulfill({status:404,body:''});
    const path=resolve(root,'.'+new URL(address).pathname.replace(/\/$/,'/index.html'));
    if(!path.startsWith(root+'/'))return route.abort();
    try{return route.fulfill({contentType:types[extname(path)]||'application/octet-stream',body:await readFile(path)});}catch{return route.fulfill({status:404,body:''});}
  });
  await page.addInitScript(()=>{
    const nativeFrame=window.requestAnimationFrame.bind(window);
    window.fixtureActivityFrames=0;window.fixtureIdleCallers=[];
    window.requestAnimationFrame=callback=>{const stack=new Error().stack;if(stack.includes('/native-activity.js')){fixtureActivityFrames++;if(window.fixtureMeasureIdle&&fixtureIdleCallers.length<20)fixtureIdleCallers.push(stack);}return nativeFrame(callback);};
    let progress;
    window.Capacitor={Plugins:{ProDevice:{async getInfo(){return{versionName:'activity-fixture'};}},ProSemantic:{
      async getState(){return{installed:false,running:false,present:0,total:100*1048576,crashes:0};},
      addListener(name,listener){if(name==='progress')progress=listener;return{remove(){}};}
    }}};
    window.fixtureMeaningProgress=value=>progress?.(value);
  });
  await page.goto(origin);await page.waitForFunction(()=>window.PBActivity&&window.PBWorkspace);
  ok('Idle app reserves no activity row and starts no spinner action',await page.locator('#pb-activity:visible').count()===0);
  await page.evaluate(()=>{
    const viewer=document.createElement('section');viewer.className='native-file-viewer';viewer.id='activity-viewer';
    const head=document.createElement('div');head.className='native-file-head';
    const button=document.createElement('button');button.id='activity-target';button.textContent='Teilen';button.setAttribute('aria-busy','false');
    const other=document.createElement('button');other.id='activity-other';other.textContent='Zurück';other.onclick=()=>{window.fixtureOtherClicks=(window.fixtureOtherClicks||0)+1;};
    head.append(button,other);viewer.append(head);document.body.append(viewer);
    window.fixtureFrame=false;requestAnimationFrame(()=>{fixtureFrame=true;});
    window.fixtureToken=PBActivity.start({label:'Teilen wird vorbereitet …',target:button});
    window.fixtureImmediate={busy:button.getAttribute('aria-busy'),text:document.querySelector('#pb-activity').textContent,parent:document.querySelector('#pb-activity').parentElement.className};
    window.fixturePaintReady=false;fixtureToken.ready.then(()=>{fixturePaintReady=true;});
  });
  ok('Click-time feedback exists synchronously before a slow action begins',await page.evaluate(()=>fixtureImmediate.busy==='true'&&fixtureImmediate.text==='Teilen wird vorbereitet …'));
  ok('Viewer activity stays visible in the viewer head',await page.evaluate(()=>fixtureImmediate.parent==='native-file-head')&&await page.locator('#pb-activity').isVisible());
  await page.waitForFunction(()=>fixturePaintReady);
  ok('ready yields a rendering opportunity before expensive work',await page.evaluate(()=>fixtureFrame));
  ok('Status is polite and atomic while the target announces busy',await page.locator('#pb-activity').getAttribute('aria-live')==='polite'&&await page.locator('#pb-activity').getAttribute('aria-atomic')==='true'&&await page.locator('#activity-target').getAttribute('aria-busy')==='true');
  ok('The existing button label and children are not rewritten',await page.locator('#activity-target').textContent()==='Teilen'&&await page.locator('#activity-target > *').count()===0);
  const dot=page.locator('#pb-activity .pb-activity-dots');
  ok('Feedback uses three simple dots and a CSS rotation',await dot.locator('i').count()===3&&await dot.evaluate(node=>getComputedStyle(node).animationName)==='pb-activity-turn');
  await dot.evaluate(node=>{window.fixtureTransform=getComputedStyle(node).transform;});
  await page.waitForFunction(()=>getComputedStyle(document.querySelector('#pb-activity .pb-activity-dots')).transform!==fixtureTransform);
  ok('The visible dots actually move while the async action waits',true);
  await page.locator('#activity-other').click();
  ok('Another control remains usable without an overlay or focus trap',await page.evaluate(()=>fixtureOtherClicks===1));
  await page.evaluate(()=>{window.fixtureSecond=PBActivity.start({label:'Zweiter Auftrag …',target:document.getElementById('activity-target')});fixtureToken.finish();});
  ok('Finishing an earlier job cannot clear a newer job on the same target',await page.locator('#activity-target').getAttribute('aria-busy')==='true'&&(await page.locator('#pb-activity').textContent())==='Zweiter Auftrag …');
  await page.evaluate(()=>{fixtureSecond.finish();fixtureSecond.finish();});
  ok('Final completion is idempotent and restores the previous busy attribute',await page.locator('#activity-target').getAttribute('aria-busy')==='false'&&!(await page.locator('#activity-target').getAttribute('class')||'').includes('pb-activity-target')&&!await page.locator('#pb-activity').isVisible());
  ok('Completion invents no success or error message',await page.locator('#pb-activity').textContent()==='');
  await page.evaluate(()=>{
    const button=document.getElementById('activity-target');
    window.fixtureFirst=PBActivity.start({label:'Erster Auftrag …',target:button});
    window.fixtureOther=PBActivity.start({label:'Anderer Auftrag …',target:document.getElementById('activity-other')});
    fixtureOther.finish();
  });
  ok('Independent targets retain their own busy state and remaining activity text',await page.locator('#activity-target').getAttribute('aria-busy')==='true'&&await page.locator('#activity-other').getAttribute('aria-busy')===null&&(await page.locator('#pb-activity').textContent())==='Erster Auftrag …');
  await page.evaluate(()=>{document.getElementById('activity-viewer').remove();fixtureFirst.finish();});
  ok('A detached target can finish safely without leaving feedback visible',await page.locator('#pb-activity:visible').count()===0);
  const failed=await page.evaluate(async()=>{try{await PBActivity.run({label:'Wird vorbereitet …'},async()=>{throw new Error('fixture rejected');});return false;}catch(error){return error.message==='fixture rejected';}});
  ok('run preserves a real rejection and always ends activity',failed&&await page.locator('#pb-activity:visible').count()===0);
  await page.evaluate(()=>{window.fixtureTranslated=PBActivity.start({label:()=>({de:'Bitte warten …',en:'Please wait …',ru:'Подождите …',pl:'Proszę czekać …'}[document.documentElement.lang]||'Bitte warten …')});});
  for(const[locale,text]of[['en','Please wait …'],['ru','Подождите …'],['pl','Proszę czekać …'],['de','Bitte warten …']]){
    await page.evaluate(locale=>{document.documentElement.lang=locale;},locale);await page.locator('#pb-activity .pb-activity-text',{hasText:text}).waitFor();
    ok('Ongoing activity follows the interface language: '+locale,await page.locator('#pb-activity .pb-activity-text').textContent()===text);
  }
  await page.emulateMedia({reducedMotion:'reduce'});
  ok('Reduced-motion preference leaves static dots and readable status',await page.locator('#pb-activity .pb-activity-dots').evaluate(node=>getComputedStyle(node).animationName)==='none'&&await page.locator('#pb-activity .pb-activity-text').isVisible());
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.evaluate(()=>{fixtureTranslated.finish();window.fixtureLiteral=PBActivity.start({label:'<img src="private-invalid">'});});
  ok('Activity labels are literal text and cannot inject markup',await page.locator('#pb-activity img').count()===0&&(await page.locator('#pb-activity').textContent()).includes('<img'));
  await page.evaluate(()=>{fixtureLiteral.finish();PBWorkspace.navigate('intake');const prog=document.getElementById('prog');window.fixtureFill=document.getElementById('barFill');fixtureFill.style.width='43%';document.getElementById('progCur').textContent='Datei · Text wird gelesen …';document.getElementById('progCount').textContent='0 / 2';prog.classList.add('on');});
  await page.locator('#prog > .pb-progress-busy').waitFor({state:'visible'});
  ok('Import uses moving dots while preserving the real counter and phase',await page.locator('#progCount').textContent()==='0 / 2'&&await page.locator('#progCur').textContent()==='Datei · Text wird gelesen …');
  ok('The old import bar is hidden visually but its measured DOM stays intact',await page.locator('#prog > .bar').evaluate(node=>getComputedStyle(node).display)==='none'&&await page.evaluate(()=>document.getElementById('barFill')===fixtureFill&&fixtureFill.style.width==='43%'));
  ok('The import cancel button remains available',await page.locator('#cancelSign').isVisible()&&await page.locator('#cancelSign').isEnabled());
  await page.evaluate(()=>{document.getElementById('prog').classList.remove('on');window.dispatchEvent(new CustomEvent('pb:caption-progress',{detail:{status:'progress',file:'decoder_model_merged_quantized.onnx',progress:43,loaded:65200000,total:151300000}}));});
  await page.locator('#capProgWrap > .pb-progress-busy').waitFor({state:'visible'});
  ok('Model download shows dots and keeps its genuine percentage text',await page.locator('#capProgText').textContent().then(text=>text.includes('43 %')&&text.includes('decoder_model_merged_quantized.onnx'))&&await page.locator('#capProgWrap > .capbar').evaluate(node=>getComputedStyle(node).display)==='none');
  await page.evaluate(()=>{window.dispatchEvent(new CustomEvent('pb:caption-progress',{detail:{status:'ready'}}));});
  await page.locator('#capProgWrap > .pb-progress-busy').waitFor({state:'hidden'});
  ok('Actual model-ready event stops its dots without fabricating readiness',await page.locator('#capProgText').textContent()==='Bild-Modell bereit ✓');
  await page.evaluate(()=>{window.dispatchEvent(new CustomEvent('pb:caption-progress',{detail:{status:'progress',file:'config.json',progress:10}}));document.getElementById('capStatus').textContent='Bild-Beschreiber: Modell konnte nicht starten (fixture)';});
  await page.locator('#capProgWrap > .pb-progress-busy').waitFor({state:'hidden'});
  ok('A model failure stops busy movement and preserves its error text',await page.locator('#capStatus').textContent()==='Bild-Beschreiber: Modell konnte nicht starten (fixture)');
  await page.evaluate(()=>{PBWorkspace.navigate('settings');fixtureMeaningProgress({done:42*1048576,total:100*1048576,source:'fixture-public'});});
  await page.locator('#pb-semantic > .pb-progress-busy').waitFor({state:'visible'});
  ok('Meaning-model activity gets the same dots while keeping actual size text',await page.locator('#pb-semantic [data-s=text]').textContent().then(text=>text.includes('42')&&text.includes('100'))&&await page.locator('#pb-semantic > .pb-semantic-bar').evaluate(node=>getComputedStyle(node).display)==='none');
  await page.evaluate(()=>{document.getElementById('pb-semantic').dataset.state='ready';});
  await page.locator('#pb-semantic > .pb-progress-busy').waitFor({state:'hidden'});
  ok('Inactive model status has no perpetually moving dots',true);
  await page.evaluate(()=>{
    const host=document.createElement('div');host.id='activity-progress-fixtures';
    const mail=document.createElement('aside');mail.className='native-mail-progress';mail.hidden=false;const info=document.createElement('p');info.textContent='Eine wichtige Meldung bleibt sichtbar';mail.append(info);
    const translation=document.createElement('section');translation.className='pb-mail-translation';const target=document.createElement('select');target.dataset.mailTranslate='target';target.disabled=true;translation.append(target);host.append(mail,translation);document.querySelector('#panel-settings').append(host);
  });
  await page.locator('#activity-progress-fixtures .native-mail-progress > .pb-progress-busy').waitFor({state:'visible'});
  await page.locator('#activity-progress-fixtures .pb-mail-translation > .pb-progress-busy').waitFor({state:'visible'});
  ok('Existing mail loading and translation states receive consistent feedback',await page.locator('#activity-progress-fixtures .native-mail-progress p').isVisible());
  await page.evaluate(()=>{document.querySelector('#activity-progress-fixtures .native-mail-progress').hidden=true;document.querySelector('#activity-progress-fixtures select').disabled=false;});
  await page.locator('#activity-progress-fixtures .pb-mail-translation > .pb-progress-busy').waitFor({state:'hidden'});
  ok('Finishing mail actions removes their activity indicators',await page.locator('#activity-progress-fixtures .native-mail-progress > .pb-progress-busy').isHidden());
  const idle=await page.evaluate(async()=>{
    const frames=count=>new Promise(resolve=>{const next=()=>{if(--count<=0)resolve();else requestAnimationFrame(next);};requestAnimationFrame(next);});
    await frames(2);const before=fixtureActivityFrames,mutations=[];
    const observer=new MutationObserver(records=>{for(const item of records)if(mutations.length<40)mutations.push({type:item.type,id:item.target.id||'',attribute:item.attributeName,old:item.oldValue,value:item.attributeName?item.target.getAttribute(item.attributeName):null});});
    observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeOldValue:true,attributeFilter:['class','hidden','data-state','disabled']});
    fixtureIdleCallers=[];window.fixtureMeasureIdle=true;await frames(5);window.fixtureMeasureIdle=false;observer.disconnect();
    return{frames:fixtureActivityFrames-before,callers:fixtureIdleCallers,mutations};
  });
  const idleFrames=idle.frames;
  if(idleFrames>1)console.error('Idle activity diagnostic: '+JSON.stringify(idle));
  ok('Idle feedback has no continuously scheduled JavaScript animation loop',idleFrames<=1);
  const redundantHelpWrites=await page.evaluate(async()=>{
    const records=[],observer=new MutationObserver(mutations=>{for(const item of mutations)if(
      item.attributeName==='hidden'&&['pb-intake-heading','pb-theme-settings'].includes(item.target.id)||
      item.attributeName==='class'&&item.target.matches('summary[data-pb-help-details]'))records.push({id:item.target.id||'',attribute:item.attributeName,old:item.oldValue,value:item.target.getAttribute(item.attributeName)});});
    observer.observe(document.body,{subtree:true,attributes:true,attributeOldValue:true,attributeFilter:['class','hidden']});
    PBHelp.refresh();PBHelp.refresh();PBHelp.refresh();await Promise.resolve();observer.disconnect();return records;
  });
  ok('Unchanged help refreshes do not wake activity through redundant hidden or class writes',redundantHelpWrites.length===0||console.error(redundantHelpWrites));
  const diagnosticWrites=await page.evaluate(async()=>{
    const records=[],observer=new MutationObserver(mutations=>{for(const item of mutations)records.push({id:item.target.id||'',attribute:item.attributeName,old:item.oldValue,value:item.target.getAttribute(item.attributeName)});});
    observer.observe(document.body,{subtree:true,attributes:true,attributeOldValue:true,attributeFilter:['class','hidden']});
    // renderDiag periodically updates these real nodes, even while hidden.
    // Its observers must not rewrite unchanged chrome and schedule another wave.
    document.getElementById('diagLog').textContent+='\nSynthetic late diagnostic entry';
    document.getElementById('diagMem').textContent='Synthetic memory update';
    await new Promise(resolve=>{let left=5;const frame=()=>{if(--left)requestAnimationFrame(frame);else resolve();};requestAnimationFrame(frame);});
    observer.disconnect();return records;
  });
  ok('A late diagnostic update does not rewrite unchanged toolbar or help classes and visibility',diagnosticWrites.length===0||console.error(diagnosticWrites));
  ok('No unhandled app errors occur across overlap, failures and progress changes',errors.length===0||console.log(errors));
  console.log(`${count} activity feedback checks passed (real DOM/CSS; synthetic asynchronous work, not a physical-device speed claim).`);
}finally{await browser?.close();}
