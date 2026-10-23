import {readFile,writeFile,mkdir,readdir,rm} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {join,delimiter} from 'node:path';
const here=fileURLToPath(new URL('.',import.meta.url));
const root=join(here,'../..'),build=join(here,'build'),generated=join(build,'source');
const source=join(root,'android/app/src/main/java/de/familyprojekt/privatebrain/pro');
const hash=b=>createHash('sha256').update(b).digest('hex');
await mkdir(join(build,'lib'),{recursive:true});
const deps=JSON.parse(await readFile(join(here,'dependencies.json'),'utf8')).dependencies;
for(const dep of deps){
  const path=join(build,'lib',`${dep.name}-${dep.version}.jar`);
  let bytes=await readFile(path).catch(()=>null);
  if(!bytes||hash(bytes)!==dep.sha256){
    const response=await fetch(dep.url);if(!response.ok)throw Error('Dependency download failed: '+dep.name);
    bytes=Buffer.from(await response.arrayBuffer());
    if(hash(bytes)!==dep.sha256)throw Error('Dependency hash mismatch: '+dep.name);
    await writeFile(path,bytes);
  }
}
await rm(generated,{recursive:true,force:true});await mkdir(generated,{recursive:true});
const receipt=[];
const names=['VaultCrypto','MailAccount','MailProvider','MailFailure','GmailIdentity','GmailUserInfo','MailOutbox','MailIndex','AppSocketFactory','Unsubscribe','ProtectionList','Protection','SemanticModel','MailEngine','MailMime','AppNetwork','OriginalFileStore','Vault','BrowserLinks','ShareInbox','PortableNames','UpdatePolicy'];
for(const name of names){
  const original=await readFile(join(source,name+'.java'),'utf8');let text=original;
  // Explicit platform imports only. Protocol and crypto bodies stay shared.
  text=text.replace(/^import android\.[^;]+;\r?\n/gm,'');
  text=text.replace(/\bContext\b/g,'DesktopState').replace(/\bSharedPreferences\b/g,'DesktopState.Preferences');
  if(name==='MailMime')text=text.replaceAll('Html.fromHtml(bodies.html, Html.FROM_HTML_MODE_LEGACY).toString()','DesktopHtml.text(bodies.html)');
  if(name==='OriginalFileStore'){
    const guards=[
      ['hash(hash); return new File(root, hash);','hash(hash); File directory=new File(root, hash); DesktopFiles.noLinks(directory.toPath()); return directory;'],
      ['File directory = directory(hash), data = new File(directory, "data");','File directory = directory(hash), data = new File(directory, "data"); DesktopFiles.noLinks(data.toPath()); DesktopFiles.noLinks(new File(directory,"metadata.json").toPath());'],
      ['JSONArray items = new JSONArray(); File[] directories = root.listFiles();','DesktopFiles.noLinks(root.toPath()); JSONArray items = new JSONArray(); File[] directories = root.listFiles();'],
      ['private static long used(File directory) {','private static long used(File directory) throws IOException { DesktopFiles.noLinks(directory.toPath());'],
      ['for (File child : children) total += child.isDirectory() ? used(child) : child.length();','for (File child : children) { DesktopFiles.noLinks(child.toPath()); total += child.isDirectory() ? used(child) : child.length(); }'],
      ['if (item == null) throw new IOException("INVALID_IMPORT"); return item;','if (item == null) throw new IOException("INVALID_IMPORT"); DesktopFiles.noLinks(item.directory.toPath()); DesktopFiles.noLinks(new File(item.directory,"data").toPath()); DesktopFiles.noLinks(new File(item.directory,"metadata.json").toPath()); return item;'],
      ['Pending item = pending.remove(ticket); if (item == null) return;','Pending item = pending.remove(ticket); if (item == null) return; try { DesktopFiles.noLinks(item.directory.toPath()); DesktopFiles.noLinks(new File(item.directory,"data").toPath()); DesktopFiles.noLinks(new File(item.directory,"metadata.json").toPath()); } catch(IOException unavailable) { return; }'],
      ['static String digest(File file) throws Exception {','static String digest(File file) throws Exception { DesktopFiles.noLinks(file.toPath());']
    ];
    for(const [before,after]of guards){if(!text.includes(before))throw Error('Review shared original filesystem boundary');text=text.replace(before,after);}
  }
  if(name==='BrowserLinks'){
    const start=text.indexOf('    static synchronized String resolve(');if(start<0)throw Error('Review mail link boundary');
    text=text.slice(0,start)+'    static synchronized String resolve(String value) {\n        try { URI uri=new URI(value); if(!"https".equals(uri.getScheme())||!"tauri.localhost".equals(uri.getAuthority())||uri.getQuery()!=null||uri.getFragment()!=null||!uri.getPath().startsWith(PREFIX))return null; return links.get(uri.getPath().substring(PREFIX.length())); } catch(Exception error) { return null; }\n    }\n}\n';
  }
  if(name==='Protection'){
    const a=text.indexOf('    static Protection create('),b=text.indexOf('    // Package-private:',a);
    if(a<0||b<0)throw Error('Review shared protection platform factory');
    text=text.slice(0,a)+'    static Protection create(DesktopState context) { return new Protection(store(Vault.get(context)), url -> (HttpURLConnection) url.openConnection(), System::currentTimeMillis, () -> context.metered.getAsBoolean(), "https://mb-api.abuse.ch", "https://urlhaus-api.abuse.ch", "https://www.virustotal.com"); }\n\n'+text.slice(b);
    text=text.replace('ProMailPlugin.code(error)','DesktopErrors.code(error)');
  }
  if(name==='Vault'){
    function replaceSection(start,end,body){const a=text.indexOf(start),b=text.indexOf(end,a+start.length);if(a<0||b<0)throw Error('Review shared Vault platform section: '+start);text=text.slice(0,a)+body+text.slice(b);}
    text=text.replace('private final ContentResolver resolver;','').replace('resolver = context.getContentResolver();','');
    text=text.replace('DocumentsContract.Document.MIME_TYPE_DIR','"vnd.android.document/directory"');
    replaceSection('    // ---------- Storage Access Framework ----------','    /** Pending encrypted write.',await readFile(join(here,'adapters/vault-files.java'),'utf8'));
    replaceSection('    private SecretKey deviceKey(', '    private void install(',await readFile(join(here,'adapters/vault-remember.java'),'utf8'));
    replaceSection('    static String location(', '    /** Returns the existing vault folder',
      '    static String location(DesktopState context, String tree) { return "device"; }\n    private String displayName(String tree, String id) { return java.nio.file.Path.of(id).getFileName().toString(); }\n');
    replaceSection('    long free() {','    // ---------- Account/draft snapshot ----------',
      '    long free() { try { bind(); return java.nio.file.Files.getFileStore(path(rootId)).getUsableSpace(); } catch (Exception error) { return -1; } }\n\n');
    text=text.replace(/\bUri\b/g,'String').replace('String.parse(prefs().getString("tree", ""))','prefs().getString("tree", "")');
    text=text.replaceAll('DocumentsContract.getTreeDocumentId(chosen)','chosen');
    text=text.replace('resolver.openOutputStream(doc(p.id), "w")','openSink(p.id)');
    text=text.replace('MailMime.filename(entry.getString("name"))','DesktopNames.safe(MailMime.filename(entry.getString("name")))');
  }
  if(/\bandroid\.|\bDocumentsContract\b|\bresolver\b/.test(text.replaceAll('vnd.android.document/directory','directory')))throw Error('Unadapted platform reference: '+name);
  await writeFile(join(generated,name+'.java'),text);
  receipt.push({path:'android/app/src/main/java/de/familyprojekt/privatebrain/pro/'+name+'.java',sha256:hash(original),generatedSha256:hash(text),byteIdentical:text===original});
}
// The same pinned-model manifest parser and URL expansion as Android.
const pinsOriginal=await readFile(join(source,'ProSemanticPlugin.java'),'utf8');
const pinsStart=pinsOriginal.indexOf('        JSONObject pins ='),pinsEnd=pinsOriginal.indexOf('    private static SharedPreferences prefs(');
if(pinsStart<0||pinsEnd<pinsStart)throw Error('Review shared semantic pin parser');
const pinsSource='package de.familyprojekt.privatebrain.pro;\nimport java.util.*;\nimport org.json.*;\nfinal class SemanticPins {\n    static List<SemanticModel.Entry> entries(java.nio.file.Path path) throws Exception {\n        String text=java.nio.file.Files.readString(path);\n'+pinsOriginal.slice(pinsStart,pinsEnd)+'}\n';
await writeFile(join(generated,'SemanticPins.java'),pinsSource);
receipt.push({path:'android/app/src/main/java/de/familyprojekt/privatebrain/pro/ProSemanticPlugin.java#entries',sha256:hash(pinsOriginal),generatedSha256:hash(pinsSource),byteIdentical:false});
// Keep exact library/model routing rules shared with Android (including /dist/).
const routesOriginal=await readFile(join(source,'BundledLibrary.java'),'utf8');
const routesStart=routesOriginal.indexOf('    static final String PREFIX ='),routesEnd=routesOriginal.indexOf('    private static Map<String, String> headers()');
if(routesStart<0||routesEnd<routesStart)throw Error('Review shared bundled asset routes');
const routesSource='package de.familyprojekt.privatebrain.pro;\nimport java.util.*;\nfinal class BundledRoutes {\n'+routesOriginal.slice(routesStart,routesEnd).replace('https://localhost/models/','https://tauri.localhost/models/')+'}\n';
await writeFile(join(generated,'BundledRoutes.java'),routesSource);
receipt.push({path:'android/app/src/main/java/de/familyprojekt/privatebrain/pro/BundledLibrary.java#routes',sha256:hash(routesOriginal),generatedSha256:hash(routesSource),byteIdentical:false});
const config=JSON.parse(await readFile(join(here,'../src-tauri/tauri.conf.json'),'utf8'));
const match=/^(\d+)\.(\d+)\.(\d+)-preview\.(\d+)$/.exec(config.version);
if(!match)throw Error('Review Windows version metadata');
await writeFile(join(generated,'DesktopBuild.java'),`package de.familyprojekt.privatebrain.pro; final class DesktopBuild { static final String VERSION=${JSON.stringify(config.version)}; static final int CODE=${Number(match[4])}; }`);
const files=(await readdir(join(here,'src'))).filter(n=>n.endsWith('.java')).map(n=>join(here,'src',n));
await rm(join(build,'classes'),{recursive:true,force:true});
await mkdir(join(build,'classes'),{recursive:true});
const libraries=deps.map(d=>join(build,'lib',`${d.name}-${d.version}.jar`)).join(delimiter);
const args=['-m','jdk.compiler/com.sun.tools.javac.Main','-source','21','-target','21','-encoding','UTF-8','-cp',libraries,'-d',join(build,'classes'),...names.map(n=>join(generated,n+'.java')),join(generated,'SemanticPins.java'),join(generated,'BundledRoutes.java'),join(generated,'DesktopBuild.java'),...files];
execFileSync('java',args,{stdio:'inherit'});
await writeFile(join(build,'shared-source.json'),JSON.stringify({sources:receipt,dependencies:deps},null,2)+'\n');
console.log(`${receipt.length} shared Android sources compiled for Windows (${receipt.filter(x=>x.byteIdentical).length} byte-identical).`);
export const classpath=[join(build,'classes'),join(build,'lib','*')].join(delimiter);
