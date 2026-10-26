import {cp,mkdir,readFile,rm,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
const windows=fileURLToPath(new URL('../',import.meta.url)),root=join(windows,'..'),runtime=join(windows,'runtime');
if(process.platform!=='win32')throw Error('The bundled Windows runtime must be built on Windows.');
execFileSync(process.execPath,[join(windows,'engine/build.mjs')],{stdio:'inherit'});
await rm(runtime,{recursive:true,force:true});await mkdir(join(runtime,'engine'),{recursive:true});
for(const name of ['classes','lib','shared-source.json'])await cp(join(windows,'engine/build',name),join(runtime,'engine',name),{recursive:true});
for(const [from,to] of [['windows/gmail-desktop.json','gmail-desktop.json'],['tools/native/semantic-model.json','semantic-model.json'],['tools/native/caption-model.json','caption-model.json']])await cp(join(root,from),join(runtime,to));
execFileSync(join(process.env.JAVA_HOME,'bin/jlink.exe'),['--add-modules','java.base,java.logging,java.desktop,java.naming,java.security.sasl,jdk.crypto.ec,jdk.charsets','--strip-debug','--no-header-files','--no-man-pages','--compress=2','--output',join(runtime,'jre')],{stdio:'inherit'});
execFileSync('python',[join(windows,'tools/licenses.py')],{cwd:root,stdio:'inherit'});
// ICO permits an unchanged PNG image. No redraw or image service is needed.
const png=await readFile(join(root,'icon-192.png'));
if(png.readUInt32BE(16)!==192||png.readUInt32BE(20)!==192)throw Error('Review Windows icon dimensions.');
const header=Buffer.alloc(22);header.writeUInt16LE(1,2);header.writeUInt16LE(1,4);header[6]=192;header[7]=192;header.writeUInt16LE(1,10);header.writeUInt16LE(32,12);header.writeUInt32LE(png.length,14);header.writeUInt32LE(22,18);
await mkdir(join(windows,'src-tauri/icons'),{recursive:true});await writeFile(join(windows,'src-tauri/icons/icon.ico'),Buffer.concat([header,png]));
console.log('Private Windows runtime prepared; no Java installation required on the recipient computer.');
