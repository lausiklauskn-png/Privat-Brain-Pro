import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {chromium} from 'playwright-core';
const server=createServer(async(req,res)=>{
 if(req.url==='/native-mail-view.js'){res.setHeader('content-type','text/javascript');res.end(await readFile('native/native-mail-view.js'));return;}
 res.setHeader('content-type','text/html');res.end('<!doctype html><html lang="de"><body><script src="native-mail-view.js"></script></body></html>');
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
let browser,count=0;const ok=(label,value)=>{assert.ok(value,label);console.log('✓ '+label);count++;};
try{
 browser=await chromium.launch({executablePath:process.env.CB_CHROMIUM||'/usr/bin/chromium',args:['--no-sandbox']});
 const page=await browser.newPage(),url=`http://127.0.0.1:${server.address().port}`,opened=[],prepared=[],errors=[];
 page.on('pageerror',e=>errors.push(e.message));await page.route('**/*',r=>r.request().url().startsWith(url)?r.continue():r.abort());
 await page.exposeFunction('openNative',({url})=>{opened.push(url);if(url.includes('failure'))throw new Error('no browser');return{ok:true};});
 await page.exposeFunction('prepareNative',({urls})=>{prepared.push(...urls);return{tickets:urls.map(()=>randomUUID())};});
 await page.addInitScript(()=>{window.Capacitor={Plugins:{ProLinks:{open:window.openNative,prepare:window.prepareNative}}};});
 await page.goto(url);await page.waitForFunction(()=>window.PBMailView);
 await page.evaluate(()=>document.body.append(PBMailView.render({text:'See https://example.com/a(b). Then https://other.example.org/end). Not javascript:alert(1) or https://localhost/private or https://user:secret@example.com/.'})));
 ok('Plain text creates only public HTTP(S) links',await page.locator('.mail-text a').count()===2);
 ok('Balanced parentheses remain part of the original URL',await page.locator('.mail-text a').first().getAttribute('href')==='https://example.com/a(b)');
 ok('No browser opens while displaying mail',opened.length===0);
 await page.locator('.mail-text a').first().evaluate(e=>e.click());ok('Synthetic clicks cannot open a browser',opened.length===0);
 await page.locator('.mail-text a').first().click();ok('Explicit text link click invokes the native browser',opened[0]==='https://example.com/a(b)');
 await page.evaluate(()=>document.body.append(PBMailView.render({text:'https://failure.example.org/'})));
 await page.locator('.mail-text a').last().click();await page.locator('[role=status]').waitFor();
 ok('Missing browser is reported without leaving mail',await page.locator('[role=status]').textContent().then(t=>t.includes('Link konnte nicht')));
 await page.evaluate(()=>document.body.append(PBMailView.render({html:'<p><a href="https://example.com/offer?q=1&amp;x=2">Offer</a><a href="intent://bad">Bad</a></p><script>parent.executed=true</script><form><button>Submit</button></form>'})));
 await page.waitForFunction(()=>document.querySelector('.mail-html')?.dataset.linksReady==='true');
 const doc=await page.locator('.mail-html').getAttribute('srcdoc');
 ok('HTML links use registered opaque routes',doc.includes('/_pb_mail_link/')&&prepared.includes('https://example.com/offer?q=1&x=2'));
 ok('Mail HTML keeps an empty sandbox and script-blocking CSP',await page.locator('.mail-html').getAttribute('sandbox')===''&&doc.includes("script-src 'none'")&&!doc.includes('<script>')&&!doc.includes('<form>'));
 ok('Active URL schemes cannot become browser routes',!doc.includes('intent://'));
 ok('Mail layout never triggers an automatic browser request',opened.length===2&&!await page.evaluate(()=>window.executed));
 ok('No renderer runtime errors',errors.length===0);
 console.log(`${count} mail link checks passed (native browser intent checked on Android).`);
}finally{await browser?.close();await new Promise(r=>server.close(r));}
