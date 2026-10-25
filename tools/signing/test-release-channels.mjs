import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';

const root=fileURLToPath(new URL('../../',import.meta.url));
const android=await readFile(join(root,'.github/workflows/android-release.yml'),'utf8');
const windows=await readFile(join(root,'.github/workflows/windows-release.yml'),'utf8');
const certificate='362ee70d28da9c4b51e37057c3519a3e6eb2c679059dfb9f56b4003f9374fa80';
const applicationId='de.familyprojekt.privatebrain.pro.preview';
let fixture;
before(async()=>{fixture=await mkdtemp(join(tmpdir(),'pb-release-channels-'));});
after(async()=>{await rm(fixture,{recursive:true,force:true});});
function runFor(source,name){
  const start=source.indexOf('      - name: '+name+'\n');assert.ok(start>=0,name);
  const tail=source.slice(start),next=tail.indexOf('\n      - ',1);
  const step=next<0?tail:tail.slice(0,next);
  const match=/        run: \|\n([\s\S]*)/.exec(step);assert.ok(match,name+' run');
  return match[1].split('\n').map(line=>line.startsWith('          ')?line.slice(10):line).join('\n');
}
const signature=runFor(android,'Signatur, Paket, Name, Debug-Flag und Versionsfortschritt prüfen');
const pythonBlocks=[...signature.matchAll(/<<'PY'\n([\s\S]*?)\nPY(?:\n|$)/g)].map(match=>match[1]);
assert.equal(pythonBlocks.length,3,'receipt eligibility, previous APK digest, current receipt');
const env=values=>({PATH:process.env.PATH,...values});
function shell(script,values={}){return spawnSync('bash',['-c','set -euo pipefail\n'+script],{cwd:fixture,env:env(values),encoding:'utf8'});}

test('Releasekanäle akzeptieren nur ihre vorgesehenen Tags und lehnen unbekannte Kanäle ab',()=>{
  const source=runFor(android,'main-Zugehörigkeit, Tag und Quellcommit prüfen');
  assert.match(android,/default: public/);
  assert.ok(source.includes('channel="${REQUESTED_CHANNEL:-test}"'),'historical preview tag pushes retain the test fallback');
  const guard=source.slice(source.indexOf('case "$channel" in'),source.indexOf('\nesac')+5);
  assert.ok(guard.endsWith('esac'));
  for(const [channel,tag,accepted]of [
    ['test','v1.0.0-preview.35',true],['public','v1.0.36',true],['stable','v1.0.36',true],
    ['public','v1.0.0-preview.36',false],['test','v1.0.36',false],['stable','v1.0.0-preview.36',false],
    ['other','v1.0.36',false],['public','v1.0.36-rc.1',false],['public','v1.0.36/evil',false]
  ])assert.equal(shell(guard,{channel,tag}).status===0,accepted,channel+' '+tag);
});

test('Public baut dieselbe APK-/AAB-Identität und die Upgradeprobe wie bisherige Testupdates',async()=>{
  const build=runFor(android,'APK und Android App Bundle bauen');
  await writeFile(join(fixture,'gradlew'),'#!/bin/sh\nprintf "%s\\n" "$*"\n',{mode:0o700});
  for(const channel of ['test','public','stable']){
    const result=shell(build,{RELEASE_CHANNEL:channel,RUNNER_TEMP:fixture});assert.equal(result.status,0,result.stderr);
    if(channel==='stable'){
      assert.match(result.stdout,/assembleRelease bundleRelease lintRelease/);assert.doesNotMatch(result.stdout,/assemblePreview|upgrade-probe/);
    }else{
      assert.match(result.stdout,/assemblePreview bundlePreview lintPreview/);assert.match(result.stdout,/upgrade-probe.*assembleRelease/);
    }
  }
  const routing=signature.slice(signature.indexOf('variant=preview'),signature.indexOf('\nmkdir -p'))+'\nprintf "%s %s" "$variant" "$package"\n';
  for(const channel of ['test','public'])assert.equal(shell(routing,{RELEASE_CHANNEL:channel}).stdout,'preview '+applicationId);
  assert.equal(shell(routing,{RELEASE_CHANNEL:'stable'}).stdout,'release de.familyprojekt.privatebrain.pro');
});

test('Public behält Originalsignierung und erzwingt Produktionsfreigabe erst nach erfolgreichem Update',async()=>{
  assert.match(android,/options: \[test, public, stable\]/);
  assert.match(android,/environment: \$\{\{ inputs\.channel == 'stable' && 'android-production' \|\| 'android-preview' \}\}/);
  const mapping="RELEASE_CHANNEL: ${{ steps.source.outputs.channel == 'public' && 'test' || steps.source.outputs.channel }}";
  assert.equal(android.split(mapping).length-1,1,'only the signing CLI input maps public to the pinned identity policy');
  assert.ok(android.indexOf(mapping)<android.indexOf('APK und Android App Bundle bauen'));
  assert.match(android,/echo "channel=\$channel" >> "\$GITHUB_OUTPUT"/);
  assert.match(android,/if: steps\.source\.outputs\.channel == 'test' \|\| steps\.source\.outputs\.channel == 'public'/);
  assert.match(android,/signed-upgrade:[\s\S]*?if: needs\.build\.outputs\.channel == 'test' \|\| needs\.build\.outputs\.channel == 'public'/);
  const publish=android.slice(android.indexOf('\n  publish:'));
  assert.match(publish,/environment: \$\{\{ needs\.build\.outputs\.channel == 'test' && 'android-preview' \|\| 'android-production' \}\}/);
  assert.match(publish,/needs\.signed-upgrade\.result == 'success'/);
  assert.match(publish,/needs\.build\.outputs\.channel == 'stable' && needs\.signed-upgrade\.result == 'skipped'/);
  assert.doesNotMatch(publish,/channel == 'public' && needs\.signed-upgrade\.result == 'skipped'/);
  const cli=await readFile(join(root,'tools/signing/cli.mjs'),'utf8');
  assert.match(cli,/process\.env\.RELEASE_CHANNEL !== 'test'/,'the original identity CLI is not widened');
  assert.ok(signature.includes('expected='+certificate));
  assert.match(signature,/test "\$current" -gt "\$previous_code"/);
  assert.match(signature,/previous-signature\.txt.*\n.*test.*\n.*grep -c '\^Signer/);
});

test('Öffentliche Updatebaseline wird nach Paket, Originalsignierer und passender Receipt ausgewählt',async()=>{
  const base={schema:1,channel:'public',applicationId,certificateSha256:certificate,sourceCommit:'a'.repeat(40),tag:'v1.0.36',versionName:'1.0.36',versionCode:36,apk:'Private-Brain-Pro-1.0.36.apk',apkSha256:'b'.repeat(64)};
  for(const [name,patch,accepted,answer]of [
    ['same identity',{},true,'true'],['other production package',{applicationId:'de.familyprojekt.privatebrain.pro',channel:'stable'},true,'false'],
    ['wrong signer',{certificateSha256:'c'.repeat(64)},false,''],['wrong channel',{channel:'stable'},false,''],
    ['wrong tag',{tag:'v1.0.37'},false,''],['boolean code',{versionCode:true},false,''],
    ['invalid source',{sourceCommit:'main'},false,''],['invalid APK hash',{apkSha256:'invalid'},false,'']
  ]){
    const path=join(fixture,'identity.json');await writeFile(path,JSON.stringify({...base,...patch}));
    const result=spawnSync('python3',['-c',pythonBlocks[0],path,'v1.0.36',applicationId,certificate],{env:env({}),encoding:'utf8'});
    assert.equal(result.status===0,accepted,name);if(accepted)assert.equal(result.stdout.trim(),answer,name);
  }
});

test('Public37 bleibt Baseline vor späterem Legacy36; anderes Produktionspaket wird nie ausgewählt',async()=>{
  const start=signature.indexOf("previous=''"),last='test -n "$previous"';
  const selector=signature.slice(start,signature.indexOf(last,start)+last.length);
  assert.ok(selector.includes('previous_code_hint=0'));
  const directory=join(fixture,'baseline-selection');
  await mkdir(join(directory,'upgrade-inputs'),{recursive:true});
  const identities=join(directory,'identities');await mkdir(identities);
  const receipt=(tag,code,id=applicationId,cert=certificate)=>({schema:1,channel:id===applicationId?'public':'stable',applicationId:id,certificateSha256:cert,sourceCommit:'a'.repeat(40),tag,versionName:tag.slice(1),versionCode:code,apk:'Private-Brain-Pro-'+tag.slice(1)+'.apk',apkSha256:'b'.repeat(64)});
  const public37=receipt('v1.0.37',37),other=receipt('v9.0.0',999,'de.familyprojekt.privatebrain.pro','c'.repeat(64));
  for(const value of [public37,other])await writeFile(join(identities,value.tag+'.json'),JSON.stringify(value));
  const releases=[
    {tag_name:'v1.0.0-preview.36',published_at:'2026-10-29T00:00:00Z',draft:false,assets:[]},
    {tag_name:public37.tag,published_at:'2026-10-27T00:00:00Z',draft:false,assets:[{name:'ANDROID-IDENTITY.json'}]},
    {tag_name:other.tag,published_at:'2026-10-30T00:00:00Z',draft:false,assets:[{name:'ANDROID-IDENTITY.json'}]}
  ];
  await writeFile(join(directory,'releases.json'),JSON.stringify([releases]));
  const fakeGh='gh() { test "$1" = release; test "$2" = download; test "$4" = --pattern; test "$5" = ANDROID-IDENTITY.json; test "$6" = --dir; cp "$PB_MANIFEST_FIXTURES/$3.json" "$7/ANDROID-IDENTITY.json"; }\n';
  const run=(suffix='')=>spawnSync('bash',['-c','set -euo pipefail\n'+fakeGh+selector+suffix],{cwd:directory,env:env({RUNNER_TEMP:directory,PB_MANIFEST_FIXTURES:identities,package:applicationId,expected:certificate,RELEASE_CHANNEL:'public'}),encoding:'utf8'});
  let result=run('\nprintf "%s\\t%s" "$previous" "$previous_code_hint"');
  assert.equal(result.status,0,result.stderr);assert.equal(result.stdout,'v1.0.37\t37');
  assert.equal(JSON.parse(await readFile(join(directory,'upgrade-inputs/previous-identity.json'),'utf8')).applicationId,applicationId);
  const bad=receipt('v1.0.38',38,applicationId,'d'.repeat(64));await writeFile(join(identities,bad.tag+'.json'),JSON.stringify(bad));
  releases.push({tag_name:bad.tag,published_at:'2026-10-26T00:00:00Z',draft:false,assets:[{name:'ANDROID-IDENTITY.json'}]});
  await writeFile(join(directory,'releases.json'),JSON.stringify([releases]));
  assert.notEqual(run().status,0,'a higher candidate with the wrong signer fails closed rather than choosing an older baseline');
  releases.pop();releases.push({tag_name:'v1.0.0-preview.99',published_at:'2026-10-26T00:00:00Z',draft:false,assets:[]});
  await writeFile(join(directory,'releases.json'),JSON.stringify([releases]));
  const actualCodeGuard=signature.split('\n').find(line=>line.includes('test "$previous_code" = "$previous_code_hint"'));
  assert.ok(actualCodeGuard);
  result=run('\nprevious_code=98\n'+actualCodeGuard);
  assert.notEqual(result.status,0,'selected legacy code hint must match the APK badging, never fall back silently');
});

test('Öffentliche Identitätsreceipt bindet tatsächliche APK-Bytes und Identität beider stabilen Pakete',async()=>{
  await mkdir(join(fixture,'release-files'),{recursive:true});
  const data=Buffer.from('Only a synthetic receipt fixture; not an APK.');
  const apk=join(fixture,'release-files/Private-Brain-Pro-1.0.36.apk');await writeFile(apk,data);
  for(const [channel,id,cert]of [['public',applicationId,certificate],['stable','de.familyprojekt.privatebrain.pro','c'.repeat(64)]]){
    const result=spawnSync('python3',['-c',pythonBlocks[2]],{cwd:fixture,env:env({PB_PUBLIC_APK:apk,PB_PUBLIC_CODE:'36',PB_PUBLIC_ID:id,PB_PUBLIC_CERT:cert,RELEASE_CHANNEL:channel,RELEASE_TAG:'v1.0.36',SOURCE_SHA:'a'.repeat(40)}),encoding:'utf8'});
    assert.equal(result.status,0,result.stderr);
    assert.deepEqual(JSON.parse(await readFile(join(fixture,'release-files/ANDROID-IDENTITY.json'),'utf8')),
      {schema:1,channel,applicationId:id,certificateSha256:cert,sourceCommit:'a'.repeat(40),tag:'v1.0.36',versionName:'1.0.36',versionCode:36,apk:'Private-Brain-Pro-1.0.36.apk',apkSha256:createHash('sha256').update(data).digest('hex')});
  }
  assert.match(signature,/files=\(\.\/\*\.apk \.\/\*\.aab \.\/\*\.json\)/,'the public identity receipt is checksummed');
});

test('Windows akzeptiert stabile Tags nur mit Versionsfortschritt; öffentliche Releases sind kein Prerelease',async()=>{
  const gate=runFor(windows,'Aktuellen main, beide Abnahmen und unveränderten Installer verlangen');
  const tagGuard=gate.split('\n').find(line=>line.startsWith('[[ "$RELEASE_TAG" =~'));
  for(const [tag,accepted]of [['windows-v1.0.36',true],['windows-v1.0.0-preview.29',true],['windows-v01.0.36',false],['windows-v1.0.36-rc.1',false]])assert.equal(shell(tagGuard,{RELEASE_TAG:tag}).status===0,accepted,tag);
  const node=/node --input-type=module <<'NODE'\n([\s\S]*?)\nNODE/.exec(gate)?.[1];assert.ok(node);
  for(const [tag,old,accepted]of [['windows-v1.0.36','windows-v1.0.0-preview.29',true],['windows-v1.0.36','windows-v1.0.36',false],['windows-v1.0.36','windows-v1.0.37',false],['windows-v1.0.36','windows-v1.0.36-preview.1',true]]){
    await writeFile(join(fixture,'old-tags.txt'),old+'\n');
    const result=spawnSync(process.execPath,['--input-type=module','-e',node],{cwd:fixture,env:env({RELEASE_TAG:tag}),encoding:'utf8'});
    assert.equal(result.status===0,accepted,tag+' vs '+old);
  }
  const publish=runFor(windows,'Genau den abgenommenen Installer veröffentlichen und unabhängig vergleichen');
  const options=publish.slice(publish.indexOf('release_options='),publish.indexOf('\ngh release create'))+'\nprintf "%s" "${release_options[@]}"';
  assert.equal(shell(options,{RELEASE_TAG:'windows-v1.0.36'}).stdout,'--prerelease=false');
  assert.equal(shell(options,{RELEASE_TAG:'windows-v1.0.0-preview.29'}).stdout,'--prerelease');
  const androidPublish=runFor(android,'Geprüfte APK veröffentlichen und öffentlichen Download bytegleich prüfen');
  const androidOptions=androidPublish.slice(androidPublish.indexOf('options=()'),androidPublish.indexOf('\n# Draft first'))+'\nprintf "%s" "${options[@]}"';
  assert.equal(shell(androidOptions,{RELEASE_CHANNEL:'public'}).stdout,'--prerelease=false');
  assert.equal(shell(androidOptions,{RELEASE_CHANNEL:'test'}).stdout,'--prerelease');
});
