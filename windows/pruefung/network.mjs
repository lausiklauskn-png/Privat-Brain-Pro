import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {chromium} from 'playwright-core';
const servers=[],sockets=new Set();let browser;
let streams=0,closedStreams=0,ws=0,closedWs=0,checks=0;
const ok=(name,value)=>{assert.ok(value,name);checks++;console.log('PASS '+name);};
async function server(handler){const s=createServer(handler);servers.push(s);await new Promise(r=>s.listen(0,'127.0.0.1',r));return{server:s,url:'http://127.0.0.1:'+s.address().port};}
try{
  const remote=await server((req,res)=>{
    res.setHeader('access-control-allow-origin','*');
    if(req.url==='/held'){streams++;res.writeHead(200,{'content-type':'text/plain'});res.write('start\n');const timer=setInterval(()=>res.write('still streaming\n'),30);res.on('close',()=>{clearInterval(timer);closedStreams++;});}
    else res.end('available');
  });
  remote.server.on('upgrade',(request,socket)=>{
    sockets.add(socket);ws++;
    const accept=createHash('sha1').update(request.headers['sec-websocket-key']+'258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
    socket.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: '+accept+'\r\n\r\n');
    socket.on('data',bytes=>{if((bytes[0]&15)===8)socket.end(Buffer.from([0x88,0]));});
    socket.on('close',()=>{sockets.delete(socket);closedWs++;});
  });
  const child=await server((req,res)=>res.end('<!doctype html><title>Isolated tool frame</title>'));
  const app=await server((req,res)=>res.end('<!doctype html><title>App</title>'));
  browser=await chromium.launch(process.platform==='win32'?{channel:'msedge',headless:true}:{executablePath:process.env.CB_CHROMIUM||'/usr/bin/chromium',args:['--no-sandbox']});
  const context=await browser.newContext();await context.addInitScript(await readFile(new URL('../bridge/network-frames.js',import.meta.url),'utf8'));
  const page=await context.newPage();await page.goto(app.url);
  ok('browser gate starts closed before native state is known',await page.evaluate(async url=>fetch(url).then(()=>false,error=>error.message==='APP_OFFLINE'),remote.url));
  await page.evaluate(()=>dispatchEvent(new CustomEvent('pb-host-network',{detail:{offline:false}})));
  ok('native permission enables a real remote request',await page.evaluate(async url=>(await fetch(url)).ok,remote.url));
  await page.evaluate(url=>{const frame=document.createElement('iframe');frame.src=url;document.body.append(frame);},child.url);
  const frame=await page.waitForEvent('framenavigated',{predicate:f=>f.url().startsWith(child.url),timeout:5000}).catch(()=>page.frames().find(f=>f.url().startsWith(child.url)));
  assert.ok(frame,'isolated frame exists');
  await page.waitForTimeout(100);
  const hold=async target=>target.evaluate(async({http,ws})=>{
    class AppSocket extends WebSocket{}
    window.socket=new AppSocket(ws);await new Promise((resolve,reject)=>{socket.onopen=resolve;socket.onerror=reject;});
    window.stopped=false;void fetch(http+'/held').then(response=>response.text()).catch(()=>window.stopped=true);
    return socket instanceof AppSocket;
  },{http:remote.url,ws:remote.url.replace('http:','ws:')+'/socket'});
  ok('wrapped sockets preserve native subclass behavior',await hold(page)&&await hold(frame));
  await page.waitForTimeout(150);ok('main and isolated frame have real active streams and sockets',streams===2&&ws===2&&closedStreams===0&&closedWs===0);
  await page.evaluate(()=>dispatchEvent(new CustomEvent('pb-host-network',{detail:{offline:true}})));
  await page.waitForFunction(()=>window.stopped&&socket.readyState===WebSocket.CLOSED);
  await frame.waitForFunction(()=>window.stopped&&socket.readyState===WebSocket.CLOSED);
  for(let i=0;i<40&&(closedStreams!==2||closedWs!==2);i++)await page.waitForTimeout(25);
  ok('internet-off closes actual main/frame HTTP bodies and WebSocket connections',closedStreams===2&&closedWs===2);
  ok('local app and tool assets remain readable while offline',await page.evaluate(async url=>(await fetch(url)).ok,app.url)&&await frame.evaluate(async url=>(await fetch(url)).ok,child.url));
  ok('isolated frame blocks new remote requests while offline',await frame.evaluate(async url=>fetch(url).then(()=>false,error=>error.message==='APP_OFFLINE'),remote.url));
  await page.evaluate(()=>dispatchEvent(new CustomEvent('pb-host-network',{detail:{offline:false}})));await page.waitForTimeout(50);
  ok('native permission restores access in isolated frames',await frame.evaluate(async url=>(await fetch(url)).ok,remote.url));
  console.log(checks+' browser network checks passed with real loopback transports.');
}finally{await browser?.close();for(const socket of sockets)socket.destroy();for(const s of servers){s.closeAllConnections();await new Promise(r=>s.close(r));}}
