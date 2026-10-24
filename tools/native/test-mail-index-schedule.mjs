// Exercise the real mailbox scheduler with a virtual clock and synthetic native transport.
// No provider connection, fixed waits, or duplicate implementation of the scheduling rule.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {chromium} from 'playwright-core';

const root=resolve('www'),types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.woff2':'font/woff2','.json':'application/json'};
const server=createServer(async(req,res)=>{
  const path=resolve(root,'.'+new URL(req.url,'http://local').pathname.replace(/\/$/,'/index.html'));
  if(!path.startsWith(root+sep))return res.writeHead(403).end();
  try{const bytes=await readFile(path);res.writeHead(200,{'content-type':types[extname(path)]||'application/octet-stream'}).end(bytes);}
  catch{res.writeHead(404).end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin=`http://127.0.0.1:${server.address().port}/`,start=Date.parse('2026-10-24T12:00:00Z');
let browser,count=0;
const ok=(name,value)=>{assert.ok(value,name);console.log('✓ '+name);count++;};

async function fixture(lastAt){
  const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.route('**/*',route=>route.request().url().startsWith(origin)?route.continue():route.abort());
  await page.clock.install({time:new Date(start)});
  await page.clock.pauseAt(new Date(start));
  await page.addInitScript(({lastAt})=>{
    if(lastAt!==null)localStorage.setItem('pb_mail_index_last',JSON.stringify({at:lastAt,accounts:1}));
    window.__scheduleCalls=[];
    const account={id:'11111111-1111-4111-8111-111111111111',email:'timer@example.invalid',provider:'telekom'};
    const log=(method,args)=>window.__scheduleCalls.push({method,args});
    window.Capacitor={Plugins:{
      ProDevice:{async getInfo(){return{platform:'android',versionName:'schedule-fixture',nativeMail:true};}},
      ProMail:{
        async accounts(args){log('accounts',args);return{items:[account]};},
        async folders(args){log('folders',args);return{items:[{path:'INBOX',name:'INBOX',specialUse:'',collection:false}]};},
        async index(args){log('index',args);return{validity:'7',next:null,items:[{uid:7,messageId:'<timer@example.invalid>',from:'sender@example.invalid',subject:'Synthetic timer mail',date:Date.now()-86400000,size:50,seen:false,flagged:false,list:false,bulk:false}]};},
        async indexText(args){log('indexText',args);return{items:args.uids.map(uid=>({uid,text:'Synthetic timer mail body',html:'',attachments:false}))};},
        async saved(){return{items:[]};}
      }
    }};
  },{lastAt:lastAt??null});
  await page.goto(origin);
  await page.waitForFunction(()=>window.PBMailIndex&&window.PBMailDevice&&typeof db!=='undefined'&&db,null,{polling:25});
  return {page,errors};
}
const requests=page=>page.evaluate(()=>window.__scheduleCalls.filter(call=>call.method==='index').length);
async function finishAutomatic(page,expected){
  // Let asynchronous IndexedDB work complete normally after advancing only the
  // timer under test. The next scheduled refresh remains thirty minutes away.
  await page.clock.resume();
  await page.waitForFunction(expected=>!PBMailIndex.running()&&window.__scheduleCalls.filter(call=>call.method==='index').length===expected,expected,{polling:25});
}

try{
  browser=await chromium.launch({executablePath:process.env.CB_CHROMIUM||'/usr/bin/chromium',args:['--no-sandbox']});
  const manual=await fixture();
  await manual.page.evaluate(()=>PBMailIndex.sync());
  ok('Manual fetch reads and persists a real synthetic mailbox entry',await requests(manual.page)===1&&await manual.page.evaluate(()=>CATALOG.some(record=>record.mailIndex&&record.mailBody==='Synthetic timer mail body')));
  // A device-clock correction must not make an already completed startup fetch obsolete.
  await manual.page.clock.setSystemTime(new Date(start-86400000));
  await manual.page.clock.runFor(5000);
  ok('Startup timer does not repeat a successful manual fetch, even after a clock correction',await requests(manual.page)===1&&!await manual.page.evaluate(()=>PBMailIndex.running()));
  await manual.page.clock.fastForward(30*60*1000-5000);
  await finishAutomatic(manual.page,2);
  ok('The normal thirty-minute refresh still runs after the manual startup fetch',await requests(manual.page)===2);
  ok('Manual/startup/interval scenario has no runtime errors',manual.errors.length===0);
  await manual.page.close();

  for(const [label,lastAt] of [['older',start-86400000],['future',start+86400000]]){
    const cached=await fixture(lastAt);
    await cached.page.clock.runFor(4999);
    ok(`A cached ${label} timestamp does not start a fetch before the startup timer`,await requests(cached.page)===0);
    await cached.page.clock.runFor(1);
    await finishAutomatic(cached.page,1);
    ok(`A cached ${label} timestamp still permits the startup mailbox refresh`,await requests(cached.page)===1&&await cached.page.evaluate(()=>CATALOG.some(record=>record.mailIndex&&record.mailBody==='Synthetic timer mail body')));
    ok(`Cached ${label} startup has no runtime errors`,cached.errors.length===0);
    await cached.page.close();
  }
  console.log(`${count} mailbox scheduling checks passed (real scheduler, virtual clock, synthetic native transport).`);
}finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
