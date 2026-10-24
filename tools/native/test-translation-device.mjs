// Exercise the real isolated worker and bridge. The default tiny pipeline fixture
// tests contracts and cancellation; TRANSLATION_REAL_MODELS_DIR additionally runs
// actual pinned Marian/ONNX inference with all browser requests kept local.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {chromium} from 'playwright-core';
const root=resolve('www'),origin='https://localhost/',realRoot=process.env.TRANSLATION_REAL_MODELS_DIR&&resolve(process.env.TRANSLATION_REAL_MODELS_DIR);
const types={'.html':'text/html','.js':'text/javascript','.json':'application/json','.wasm':'application/wasm','.onnx':'application/octet-stream'};
const ok=(name,value)=>{assert.ok(value,name);console.log('✓ '+name);count++;};
let browser,count=0;
const libraryFixture=`export const env={backends:{onnx:{wasm:{}}}};
export async function pipeline(task,model,options){
  self.postMessage({type:'fixture-init',task,model,local:env.allowLocalModels,remote:env.allowRemoteModels,cache:env.useBrowserCache,threads:env.backends.onnx.wasm.numThreads,wasm:env.backends.onnx.wasm.wasmPaths});
  const run=async(text,options)=>{
    self.postMessage({type:'fixture-call',model,text});
    if(text.includes('WORKER_WAIT'))await new Promise(()=>{});
    if(text.includes('NETWORK_ATTEMPT'))await fetch('https://forbidden.invalid/translate',{method:'POST',body:text});
    if(text.includes('MODEL_FAIL'))throw new Error('synthetic failure');
    return[{translation_text:model.split('/').pop()+': '+text}];
  };
  run.tokenizer=text=>({input_ids:{dims:[1,Array.from(text).length+2]}});
  run.dispose=async()=>self.postMessage({type:'fixture-disposed',model});return run;
}`;
async function fixture(real=false){
  const context=await browser.newContext(),page=await context.newPage(),requests=[],external=[],errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await context.route('**/*',async route=>{
    const address=route.request().url();requests.push(address);
    if(!address.startsWith(origin)){external.push(address);return route.abort();}
    const path=new URL(address).pathname;
    if(path==='/')return route.fulfill({contentType:'text/html; charset=utf-8',body:'<!doctype html><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src \'self\'; script-src \'self\' \'unsafe-inline\' \'wasm-unsafe-eval\'; worker-src \'self\'; connect-src \'self\'"><script src="native-translation-device.js"></script>'});
    if(path==='/pb-translation/lib/transformers.min.js'&&!real)return route.fulfill({contentType:'text/javascript',body:libraryFixture});
    const local=path.startsWith('/pb-translation/')&&real?resolve(realRoot,'.'+path.slice('/pb-translation'.length)):resolve(root,'.'+path);
    if(!local.startsWith((path.startsWith('/pb-translation/')&&real?realRoot:root)+'/'))return route.abort();
    try{return route.fulfill({contentType:types[extname(local)]||'application/octet-stream',body:await readFile(local)});}catch{return route.fulfill({status:404,body:''});}
  });
  await page.addInitScript(()=>{
    window.fixtureCalls=[];window.fixtureWorkerEvents=[];window.fixtureCreated=0;window.fixtureTerminated=0;window.fixtureReady=false;window.fixtureBlocked=false;
    const NativeWorker=window.Worker;
    window.Worker=class extends NativeWorker{
      constructor(...args){super(...args);window.fixtureCreated++;this.addEventListener('message',event=>fixtureWorkerEvents.push(event.data));}
      terminate(){window.fixtureTerminated++;return super.terminate();}
    };
    const ids={'de-en':'Xenova/opus-mt-de-en','en-de':'Xenova/opus-mt-en-de','ru-en':'Xenova/opus-mt-ru-en','en-ru':'Xenova/opus-mt-en-ru','pl-en':'Xenova/opus-mt-pl-en','en-pl':'Xenova/opus-mt-en-mul'};
    const route=({source,target})=>source===target?[]:(source==='en'||target==='en'?[source+'-'+target]:[source+'-en','en-'+target]).map(key=>({key,id:ids[key]}));
    const record=(method,args)=>fixtureCalls.push({method,args});
    window.Capacitor={Plugins:{ProTranslation:{
      async status(args={}){record('status',args);return{available:true,ready:fixtureReady,blocked:fixtureBlocked,languages:['de','en','ru','pl'],route:args.source?route(args):[],total:100,present:fixtureReady?100:0};},
      async download(args){record('download',args);fixtureReady=true;return{ready:true};},
      async cancel(){record('cancel',{});},
      async markLoading(args){record('markLoading',args);if(fixtureBlocked)throw Object.assign(new Error('blocked'),{code:'MODEL_BLOCKED'});},
      async markFinished(args){record('markFinished',args);},
      async clearCrash(){record('clearCrash',{});fixtureBlocked=false;}
    }}};
  });
  await page.goto(origin);await page.waitForFunction(()=>window.PBTranslationDevice);
  return{context,page,requests,external,errors};
}
async function resultCode(page,args){return page.evaluate(async args=>{try{await PBTranslationDevice.translate(args);return'no-error';}catch(error){return error.code;}},args);}
try{
  browser=await chromium.launch({executablePath:process.env.CB_CHROMIUM||'/usr/bin/chromium',args:['--no-sandbox']});
  let{context,page,requests,external,errors}=await fixture();
  ok('Loading the local bridge never starts a download, model or native call',await page.evaluate(()=>fixtureCalls.length===0&&fixtureCreated===0));
  for(const[language,text]of[
    ['de','Guten Tag, bitte prüfen Sie die Rechnung für unsere Besprechung. Wir werden die Unterlagen mit freundlichen Grüßen an Ihre Firma schicken.'],
    ['en','Hello, please review the invoice for our meeting. We will send you the documents tomorrow and this is the address for your reply.'],
    ['ru','Здравствуйте, пожалуйста проверьте счет для нашей встречи. Мы отправим письмо и документы на ваш адрес. Спасибо за помощь.'],
    ['pl','Dzień dobry, proszę sprawdzić naszą fakturę oraz wiadomość. Spotkanie będzie jutro i dziękuję za odpowiedź dla naszej firmy.'],
    ['und','Bank transfer 12345.'],['und','Merhaba, toplantı yarın yapılacak. Lütfen belgeleri gönderebilir misiniz? Çok teşekkür ederim.'],
    ['und','The invoice and our meeting are tomorrow. Пожалуйста отправьте счет для встречи, спасибо за письмо.']
  ]){const detected=await page.evaluate(async text=>(await PBTranslationDevice.identify({text})).language,text);ok('Conservative local language identification: '+language+' (got '+detected+')',detected===language);}
  ok('Language identification does not fetch or load any model',await page.evaluate(()=>fixtureCalls.length===0&&fixtureCreated===0)&&requests.every(url=>!url.includes('/pb-translation/')));
  const pair={source:'de',target:'pl'};
  const state=await page.evaluate(args=>PBTranslationDevice.status(args),pair);
  ok('A non-English pair declares the two English-pivot legs',state.ready===false&&state.route.map(item=>item.key).join(',')==='de-en,en-pl');
  ok('Status and a missing-model translation never silently download',await resultCode(page,{text:'Private sentence',...pair})==='TRANSLATION_MODELS_MISSING'&&await page.evaluate(()=>fixtureCalls.every(call=>call.method==='status')&&fixtureCreated===0));
  await page.evaluate(args=>PBTranslationDevice.download(args),pair);
  ok('Only the explicit preparation API requests a native model download',await page.evaluate(()=>fixtureCalls.filter(call=>call.method==='download').length===1));
  const text='Private sentence for the local worker.';
  const output=await page.evaluate(args=>PBTranslationDevice.translate(args),{text,...pair});
  ok('The second pivot leg uses the actual Polish target token',output.source==='de'&&output.target==='pl'&&output.text.includes('opus-mt-en-mul: >>pol<< ')&&output.text.includes(text));
  ok('Each translation leg disposes its pipeline and terminates its worker',await page.evaluate(()=>fixtureCreated===2&&fixtureTerminated===2&&fixtureWorkerEvents.filter(event=>event.type==='fixture-disposed').length===2));
  ok('Translation config is local only, uncached, single-threaded and independent of embeddings',await page.evaluate(()=>fixtureWorkerEvents.filter(event=>event.type==='fixture-init').every(event=>event.task==='translation'&&event.local===true&&event.remote===false&&event.cache===false&&event.threads===1&&event.wasm==='https://localhost/pb-translation/lib/')));
  ok('Raw mail text is never passed to native download or crash-marker operations',await page.evaluate(text=>!JSON.stringify(fixtureCalls).includes(text),text));
  ok('Crash markers are unique per leg and completed with matching IDs',await page.evaluate(()=>{const starts=fixtureCalls.filter(call=>call.method==='markLoading'),ends=fixtureCalls.filter(call=>call.method==='markFinished');return starts.length===2&&new Set(starts.map(call=>call.args.id)).size===2&&starts.every(start=>ends.some(end=>end.args.id===start.args.id&&end.args.failed===false));}));
  const callsBefore=await page.evaluate(()=>fixtureCalls.length);
  ok('Same-language translation returns the original without loading a model',(await page.evaluate(args=>PBTranslationDevice.translate(args),{source:'de',target:'de',text})).text===text&&await page.evaluate(()=>fixtureCalls.length)===callsBefore);
  ok('Unsupported and oversized requests fail before touching a model',await resultCode(page,{source:'de',target:'ar',text})==='TRANSLATION_UNSUPPORTED'&&await resultCode(page,{source:'de',target:'en',text:'x'.repeat(40001)})==='TRANSLATION_BAD_TEXT');
  const long='Die vollständige Nachricht bleibt erhalten. '.repeat(80)+'END_OF_MESSAGE';
  const longResult=await page.evaluate(args=>PBTranslationDevice.translate(args),{source:'de',target:'en',text:long});
  ok('Long text is processed in bounded chunks through its final marker',longResult.text.includes('END_OF_MESSAGE')&&await page.evaluate(()=>fixtureWorkerEvents.filter(event=>event.type==='fixture-call').length>3));
  await page.evaluate(()=>{fixtureBlocked=true;});
  const modelsBefore=await page.evaluate(()=>fixtureCreated);
  ok('A recorded model crash prevents automatic worker restart',await resultCode(page,{source:'de',target:'en',text})==='TRANSLATION_BLOCKED'&&await page.evaluate(()=>fixtureCreated)===modelsBefore);
  await page.evaluate(()=>PBTranslationDevice.clearCrash());
  ok('Only explicit recovery clears the crash guard',await page.evaluate(()=>!fixtureBlocked&&fixtureCalls.filter(call=>call.method==='clearCrash').length===1));
  ok('An attempted remote translation request is blocked inside the worker',await resultCode(page,{source:'de',target:'en',text:'NETWORK_ATTEMPT private test text'})==='TRANSLATION_FAILED'&&external.length===0&&!requests.some(url=>url.includes('forbidden.invalid')));
  await page.evaluate(()=>{window.fixturePending=PBTranslationDevice.translate({source:'de',target:'en',text:'WORKER_WAIT local text'}).then(()=> 'unexpected-success',error=>error.code);});
  await page.waitForFunction(()=>fixtureWorkerEvents.some(event=>event.type==='fixture-call'&&event.text.includes('WORKER_WAIT')));
  await page.evaluate(()=>PBTranslationDevice.cancel());
  ok('Leaving an active translation cancels its worker without returning stale text',await page.evaluate(()=>fixturePending)==='TRANSLATION_CANCELLED');
  await page.waitForFunction(()=>fixtureCalls.some(call=>call.method==='markFinished'&&call.args.failed===false&&call.args.id===fixtureCalls.filter(call=>call.method==='markLoading').at(-1).args.id));
  ok('Deliberate cancellation does not record a model crash',await page.evaluate(()=>fixtureCalls.filter(call=>call.method==='markFinished').at(-1).args.failed===false));
  ok('Bridge and actual worker paths raise no unhandled app errors or external requests',errors.length===0&&external.length===0);
  await context.close();
  if(realRoot){
    const manifest=JSON.parse(await readFile('tools/native/translation-models.json','utf8'));
    for(const[name,digest]of Object.entries(manifest.library.files)){
      const bytes=await readFile(resolve(realRoot,'lib',name));assert.equal(createHash('sha256').update(bytes).digest('hex'),digest,'Pinned library '+name);
    }
    for(const[name,file]of Object.entries(manifest.models['de-en'].files)){
      const bytes=await readFile(resolve(realRoot,'models',manifest.models['de-en'].id,name));assert.equal(bytes.length,file.size);assert.equal(createHash('sha256').update(bytes).digest('hex'),file.sha256,'Pinned model '+name);
    }
    ({context,page,requests,external,errors}=await fixture(true));
    await page.evaluate(()=>{fixtureReady=true;});
    const translated=await page.evaluate(()=>PBTranslationDevice.translate({source:'de',target:'en',text:'Die Katze sitzt auf dem Tisch.'}));
    ok('Real pinned Marian/ONNX inference produces English cat/table text',/cat/i.test(translated.text)&&/table/i.test(translated.text)&&translated.text!=='Die Katze sitzt auf dem Tisch.');
    ok('Real model inference reads only the local allowlisted asset paths',external.length===0&&requests.some(url=>url.includes('encoder_model_quantized.onnx'))&&requests.some(url=>url.includes('decoder_model_merged_quantized.onnx'))&&requests.every(url=>url.startsWith(origin)));
    ok('Real model inference returns without unhandled errors and releases its worker',errors.length===0&&await page.evaluate(()=>fixtureCreated===1&&fixtureTerminated===1));
    await context.close();
  }
  console.log(`${count} translation-device checks passed (${realRoot?'includes real pinned Marian inference':'real workers with tiny pipeline fixture; no model-quality claim'}).`);
}finally{await browser?.close();}
