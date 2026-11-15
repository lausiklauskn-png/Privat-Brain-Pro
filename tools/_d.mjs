import {createServer} from 'node:http';import {readFile} from 'node:fs/promises';import {resolve,extname} from 'node:path';import {chromium} from 'playwright-core';
const root=resolve('www');const T={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json'};
const s=createServer(async(q,r)=>{const pth=new URL(q.url,'http://l').pathname.replace(/\/$/,'/index.html');let d;try{d=await readFile(resolve(root,'.'+pth));}catch{return r.writeHead(404).end();}r.writeHead(200,{'content-type':T[extname(pth)]||'application/octet-stream'}).end(d);});
await new Promise(x=>s.listen(0,'127.0.0.1',x));const u=`http://127.0.0.1:${s.address().port}/`;
const b=await chromium.launch({executablePath:process.env.CB_CHROMIUM,args:['--no-sandbox']});const p=await b.newPage();
await p.route('**/*',x=>x.request().url().startsWith(u)?x.continue():x.abort());await p.goto(u);await p.waitForTimeout(2500);
console.log(await p.evaluate(()=>[...document.querySelector('#panel-settings').children].map(c=>(c.id||c.className.slice(0,25))+'='+c.dataset.pbThema).join('\n')));
await b.close();s.close();
