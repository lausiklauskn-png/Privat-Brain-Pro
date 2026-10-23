// Real private stdio process, including asynchronous protection callbacks.
import {spawn} from 'node:child_process';
import {mkdtemp,mkdir,copyFile,rm,writeFile} from 'node:fs/promises';
import {createInterface} from 'node:readline';
import {tmpdir} from 'node:os';
import {join,resolve,delimiter} from 'node:path';
import {randomBytes,createCipheriv,createDecipheriv} from 'node:crypto';
import assert from 'node:assert/strict';
const root=resolve(import.meta.dirname,'../..'),test=await mkdtemp(join(tmpdir(),'pb-protocol-'));
const java=process.argv[2]||'java',runtime=process.argv[3];
const resources=runtime||join(test,'runtime');await mkdir(resources,{recursive:true});
if(!runtime){await copyFile(join(root,'windows/gmail-desktop.json'),join(resources,'gmail-desktop.json'));await copyFile(join(root,'tools/native/semantic-model.json'),join(resources,'semantic-model.json'));}
const classes=runtime?join(runtime,'engine/classes'):join(root,'windows/engine/build/classes'),lib=runtime?join(runtime,'engine/lib/*'):join(root,'windows/engine/build/lib/*');
const child=spawn(java,['-cp',[classes,lib].join(delimiter),'de.familyprojekt.privatebrain.pro.EngineMain',join(test,'data'),resources],{stdio:['pipe','pipe','pipe'],windowsHide:true});
const exited=new Promise(resolve=>child.once('exit',resolve));
const pending=new Map(),key=randomBytes(32),events=[];let next=0;
const send=value=>child.stdin.write(JSON.stringify(value)+'\n');
let diagnostic='';child.stderr.on('data',bytes=>{diagnostic=(diagnostic+bytes).slice(-8192);});
createInterface({input:child.stdout}).on('line',line=>{
  const value=JSON.parse(line);
  if(value.host){
    assert.ok(['protect','unprotect','metered'].includes(value.method));
    if(value.method==='metered'){send({replyTo:value.host,result:{metered:true}});return;}
    const bytes=Buffer.from(value.options.data,'base64'),aad=Buffer.from(value.options.binding);let result;
    if(value.method==='protect'){const iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',key,iv);cipher.setAAD(aad);result=Buffer.concat([iv,cipher.update(bytes),cipher.final(),cipher.getAuthTag()]);}
    else{const decipher=createDecipheriv('aes-256-gcm',key,bytes.subarray(0,12));decipher.setAAD(aad);decipher.setAuthTag(bytes.subarray(-16));result=Buffer.concat([decipher.update(bytes.subarray(12,-16)),decipher.final()]);}
    send({replyTo:value.host,result:{data:result.toString('base64')}});
  }else if(value.id){const reply=pending.get(value.id);pending.delete(value.id);value.error?reply.reject(Error(value.error)):reply.resolve(value.result);}
  else if(value.event)events.push(value.event);
});
const call=(plugin,method,options={})=>new Promise((resolve,reject)=>{const id=String(++next);pending.set(id,{resolve,reject});send({id,plugin,method,options});});
const deadline=setTimeout(()=>{console.error('Engine stdio timeout. '+diagnostic);child.kill();process.exitCode=1;for(const reply of pending.values())reply.reject(Error('Engine protocol timeout'));},15000);
try{
  assert.equal((await call('ProDevice','getInfo')).platform,'windows');
  assert.equal((await call('ProNetwork','setOffline',{offline:true})).offline,true);
  assert.equal((await call('ProNetwork','getState')).offline,true);
  const file=join(test,'share-proof.txt');await writeFile(file,'Private protocol share proof');
  await call('DesktopInternal','receive',{paths:[file]});
  assert.ok(events.includes('ProShare:shared'),'incoming files must emit the shared event expected by the common frontend');
  console.log('PASS real child stdio startup, protection callback and response dispatch');
}finally{clearTimeout(deadline);child.stdin.end();await exited;await rm(test,{recursive:true,force:true});}
