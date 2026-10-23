import {classpath} from './build.mjs';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {join,delimiter} from 'node:path';
import {readFile,writeFile,rm} from 'node:fs/promises';
const here=fileURLToPath(new URL('.',import.meta.url));
const deps=JSON.parse(await readFile(join(here,'dependencies.json'),'utf8')).dependencies;
const compileClasspath=[join(here,'build/classes'),...deps.map(d=>join(here,'build/lib',`${d.name}-${d.version}.jar`))].join(delimiter);
let server=await readFile(join(here,'../../android/app/src/androidTest/java/de/familyprojekt/privatebrain/pro/TestMailTlsServer.java'),'utf8');
server=server.replace(/^import android\.[^;]+;\r?\n/gm,'').replaceAll('android.util.Base64','Base64');
const start=server.indexOf('        KeyPairGenerator generator ='),end=server.indexOf('        X509KeyManager manager =',start);
if(start<0||end<0)throw Error('Review shared TLS fixture key adapter');
server=server.slice(0,start)+`        KeyStore keys=KeyStore.getInstance("PKCS12");
        try(java.io.InputStream input=java.nio.file.Files.newInputStream(java.nio.file.Path.of(System.getProperty("pb.test.key")))){keys.load(input,"pb-test-only".toCharArray());}
        PrivateKey key=(PrivateKey)keys.getKey("localhost","pb-test-only".toCharArray());
        X509Certificate certificate=(X509Certificate)keys.getCertificate("localhost");
`+server.slice(end);
const cleanup='        KeyStore keys = KeyStore.getInstance("AndroidKeyStore"); keys.load(null); keys.deleteEntry(alias);';
if(!server.includes(cleanup))throw Error('Review TLS fixture cleanup');server=server.replace(cleanup,'');
await writeFile(join(here,'build/source/TestMailTlsServer.java'),server);
const key=join(here,'build/test-only-tls.p12');await rm(key,{force:true});
execFileSync('java',['-m','java.base/sun.security.tools.keytool.Main','-genkeypair','-alias','localhost','-keyalg','EC','-groupname','secp256r1','-dname','CN=localhost','-validity','2','-storetype','PKCS12','-keystore',key,'-storepass','pb-test-only','-keypass','pb-test-only','-ext','SAN=dns:localhost'],{stdio:'pipe'});
execFileSync('java',['-m','jdk.compiler/com.sun.tools.javac.Main','-source','21','-target','21','-encoding','UTF-8','-cp',compileClasspath,'-d',join(here,'build/classes'),join(here,'build/source/TestMailTlsServer.java'),join(here,'tests/EngineTests.java')],{stdio:'inherit'});
try{execFileSync('java',['-Dpb.test.key='+key,'-cp',classpath,'de.familyprojekt.privatebrain.pro.EngineTests',join(here,'../..')],{stdio:'inherit'});}
finally{await rm(key,{force:true});}
