/* Voluntary transfers, one existing common vault, ordinary Private Brain import and durable receipts. */
(() => {
'use strict';
const api=window.Capacitor?.Plugins?.ProVault;if(typeof api?.tresorUebergabe!=='function')return;
const APP='private-brain',APPS=['familienakte','workflow-pdf-pro',APP,'bookledgerpro'],MAX=20*1024*1024;
const names={'familienakte':'Familienakte Pro','workflow-pdf-pro':'Workflow PDF Pro','private-brain':'Private Brain Pro','bookledgerpro':'BookLedgerPro'};
const W={
 de:['Zusammenarbeit mit Pro-Apps','Freiwillig verbinden: Nur ausgewählte Dateien gehen an die andere App. Die ursprüngliche Datei bleibt erhalten.','Pro-Tresor verbinden …','Anderen Ordner wählen …','Entsperren …','Sperren','Nicht verbunden','Verbunden: ','Gesperrt: ','Ordner nicht erreichbar: ','Eingang prüfen und übernehmen','Bestätigungen prüfen','Noch offen','Weitergegeben – Übernahme offen','Im Eingang der Ziel-App','An Pro-App …','Datei weitergeben','Ziel-App','Weitergeben','Abbrechen','Übergabe nicht abgeschlossen. Quelle und offene Übergabe bleiben erhalten.','Keine passende Datei oder höchstens 20 MiB überschritten.','Die Übergabedaten passen nicht zur Datei.','Diese Kennung gehört bereits zu einer anderen Fassung.','Bitte den zugehörigen Pro-Tresor entsperren.','Im Eingang aufgenommen: {n}. Offen: {f}.','Eigene Ablage zusätzlich einziehen','Ausgang','Datei: ','Eingang prüfen','Keine offenen Übergaben.'],
 en:['Work with Pro apps','Connect optionally: Only selected files go to the other app. The original file is preserved.','Connect Pro vault …','Choose another folder …','Unlock …','Lock','Not connected','Connected: ','Locked: ','Folder unavailable: ','Check and import inbox','Check confirmations','Pending','Passed on – awaiting acceptance','In the target app’s inbox','To Pro app …','Pass on file','Target app','Pass on','Cancel','Transfer not completed. Source and pending transfer are preserved.','Unsupported file or more than 20 MiB.','The transfer data does not match the file.','This identifier already belongs to a different version.','Unlock the matching Pro vault.','Imported: {n}. Still pending: {f}.','Also register own storage','Outbox','File: ','Check inbox','No pending transfers.'],
 ru:['Совместная работа Pro-приложений','Подключение добровольное: передаются только выбранные файлы. Оригинал сохраняется.','Подключить Pro-сейф …','Выбрать другую папку …','Разблокировать …','Заблокировать','Не подключено','Подключено: ','Заблокировано: ','Папка недоступна: ','Проверить и принять входящие','Проверить подтверждения','Ожидает','Передано — принятие не подтверждено','Во входящих приложения','В Pro-приложение …','Передать файл','Приложение-получатель','Передать','Отмена','Передача не завершена. Источник и ожидающая передача сохранены.','Неподходящий файл или больше 20 МиБ.','Данные передачи не соответствуют файлу.','Эта метка уже относится к другой версии.','Разблокируйте соответствующий Pro-сейф.','Принято: {n}. Ожидает: {f}.','Также подключить своё хранилище','Исходящие','Файл: ','Проверить входящие','Ожидающих передач нет.'],
 pl:['Współpraca aplikacji Pro','Połączenie dobrowolne: przekazywane są tylko wybrane pliki. Oryginał pozostaje.','Połącz sejf Pro …','Wybierz inny folder …','Odblokuj …','Zablokuj','Nie połączono','Połączono: ','Zablokowano: ','Folder niedostępny: ','Sprawdź i przyjmij pliki','Sprawdź potwierdzenia','Oczekuje','Przekazano — oczekuje na przyjęcie','W skrzynce aplikacji docelowej','Do aplikacji Pro …','Przekaż plik','Aplikacja docelowa','Przekaż','Anuluj','Nie ukończono przekazania. Źródło i oczekujące przekazanie pozostają.','Nieobsługiwany plik lub ponad 20 MiB.','Dane przekazania nie pasują do pliku.','Ten identyfikator należy już do innej wersji.','Odblokuj właściwy sejf Pro.','Przyjęto: {n}. Oczekuje: {f}.','Dodatkowo zarejestruj własny magazyn','Wysłane','Plik: ','Sprawdź skrzynkę','Brak oczekujących przekazań.']
};
const extra={de:['Schließen','Erneut weitergeben'],en:['Close','Pass on again'],ru:['Закрыть','Передать снова'],pl:['Zamknij','Przekaż ponownie']};
const more=i=>(extra[document.documentElement.lang]||extra.de)[i];
/* „Tresor einrichten – nur Speicher wählen“ (Klaus 2026-11-04): nur in der Android-App mit ProVault.tresorEinrichten. */
const EIN={
 de:{knopf:'Tresor einrichten – nur Speicher wählen …',info:'Speicher wählen (Gerät oder SD-Karte). Private Brain Pro findet den Tresor darin oder legt einen Hauptordner an. Ein Passwort für Tresor und Ablage.',fertig:'Tresor eingerichtet: ',TRESOR_ORDNER_UNTERORDNER:'Das ist ein Ordner im Tresor. Bitte den Speicher selbst wählen (Gerät oder SD-Karte). Nichts wurde verändert.',TRESOR_ORDNER_MEHRERE:'In diesem Speicher liegen mehrere Tresore. Bitte den richtigen Tresor-Ordner selbst wählen. Nichts wurde verändert.',TRESOR_NAME_BELEGT:'Ein Ordner mit diesem Namen liegt schon da und ist nicht leer. Bitte anderen Namen. Nichts wurde verändert.',VAULT_ANDERER_ORT:'Die Ablage von Private Brain Pro ist schon an einem anderen Ort eingerichtet. Sie zieht nicht still um. Nichts wurde verändert.',VAULT_FOLDER_IN_USE:'Im Tresor liegt ein Ordner „Private Brain“ mit fremden Dateien. Nichts wurde verändert.',TRESOR_ORDNER_FREMDER_TRESOR:'„Private Brain“ in diesem Tresor gehört nicht zu Private Brain Pro. Nichts wurde verändert.',TRESOR_ABLAGE_PASSWORT_ANDERS:'Das Passwort öffnet den Tresor, aber nicht die Ablage „Private Brain“ darin (älterer Stand mit eigenem Passwort). Nichts wurde verändert.'},
 en:{knopf:'Set up vault – just choose storage …',info:'Choose storage (device or SD card). Private Brain Pro finds the vault there or creates a main folder. One password for vault and storage.',fertig:'Vault set up: ',TRESOR_ORDNER_UNTERORDNER:'This is a folder inside the vault. Please choose the storage itself (device or SD card). Nothing was changed.',TRESOR_ORDNER_MEHRERE:'This storage holds several vaults. Please choose the right vault folder yourself. Nothing was changed.',TRESOR_NAME_BELEGT:'A folder with this name already exists and is not empty. Please choose another name. Nothing was changed.',VAULT_ANDERER_ORT:'Private Brain Pro’s storage is already set up elsewhere. It does not move silently. Nothing was changed.',VAULT_FOLDER_IN_USE:'The vault contains a folder “Private Brain” with other files. Nothing was changed.',TRESOR_ORDNER_FREMDER_TRESOR:'“Private Brain” in this vault does not belong to Private Brain Pro. Nothing was changed.',TRESOR_ABLAGE_PASSWORT_ANDERS:'The password opens the vault but not the “Private Brain” storage inside (older state with its own password). Nothing was changed.'},
 ru:{knopf:'Настроить сейф – только выбрать хранилище …',info:'Выберите хранилище (устройство или SD-карта). Private Brain Pro найдёт там сейф или создаст главную папку. Один пароль для сейфа и хранилища.',fertig:'Сейф настроен: ',TRESOR_ORDNER_UNTERORDNER:'Это папка внутри сейфа. Выберите само хранилище. Ничего не изменено.',TRESOR_ORDNER_MEHRERE:'В этом хранилище несколько сейфов. Выберите нужную папку сейфа. Ничего не изменено.',TRESOR_NAME_BELEGT:'Папка с этим именем уже есть и не пуста. Выберите другое имя. Ничего не изменено.',VAULT_ANDERER_ORT:'Хранилище Private Brain Pro уже настроено в другом месте и не переносится молча. Ничего не изменено.',VAULT_FOLDER_IN_USE:'В сейфе есть папка «Private Brain» с чужими файлами. Ничего не изменено.',TRESOR_ORDNER_FREMDER_TRESOR:'«Private Brain» в этом сейфе не принадлежит Private Brain Pro. Ничего не изменено.',TRESOR_ABLAGE_PASSWORT_ANDERS:'Пароль открывает сейф, но не хранилище «Private Brain» в нём. Ничего не изменено.'},
 pl:{knopf:'Skonfiguruj sejf – wybierz tylko pamięć …',info:'Wybierz pamięć (urządzenie lub kartę SD). Private Brain Pro znajdzie tam sejf albo utworzy folder główny. Jedno hasło dla sejfu i miejsca zapisu.',fertig:'Sejf skonfigurowany: ',TRESOR_ORDNER_UNTERORDNER:'To folder wewnątrz sejfu. Wybierz samą pamięć. Nic nie zmieniono.',TRESOR_ORDNER_MEHRERE:'W tej pamięci jest kilka sejfów. Wybierz właściwy folder sejfu. Nic nie zmieniono.',TRESOR_NAME_BELEGT:'Folder o tej nazwie już istnieje i nie jest pusty. Wybierz inną nazwę. Nic nie zmieniono.',VAULT_ANDERER_ORT:'Miejsce zapisu Private Brain Pro jest już skonfigurowane gdzie indziej i nie przenosi się po cichu. Nic nie zmieniono.',VAULT_FOLDER_IN_USE:'W sejfie jest folder „Private Brain” z obcymi plikami. Nic nie zmieniono.',TRESOR_ORDNER_FREMDER_TRESOR:'„Private Brain” w tym sejfie nie należy do Private Brain Pro. Nic nie zmieniono.',TRESOR_ABLAGE_PASSWORT_ANDERS:'Hasło otwiera sejf, ale nie miejsce „Private Brain” w nim. Nic nie zmieniono.'}
};
const ein=k=>(EIN[document.documentElement.lang]||EIN.de)[k];
const t=i=>(W[document.documentElement.lang]||W.de)[i],hash=async bytes=>sha256(bytes),textHash=value=>hash(new TextEncoder().encode(JSON.stringify(value)));
const make=(tag,text)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;return e;};
const options=()=>({language:document.documentElement.lang,dark:document.documentElement.dataset.theme==='dunkel'});
let busy=false,panel,note='',renderGeneration=0;
function contract(value,target){
 if(!value||value.vertrag!=='familienakte-uebergabe/1'||!APPS.includes(value.quelle)||!APPS.includes(value.ziel)||value.ziel!==target||
 !/^[A-Za-z0-9_.-]{1,160}$/.test(value.id||'')||['.','..'].includes(value.id)||!/^[A-Za-z0-9_.:-]{1,200}$/.test(value.dokumentId||'')||
 typeof value.name!=='string'||!value.name.length||value.name.length>255||typeof value.mime!=='string'||value.mime.length>200||
 !Number.isSafeInteger(value.groesse)||value.groesse<=0||value.groesse>MAX||!/^[a-f0-9]{64}$/.test(value.sha256||'')||
 (value.bezug!==undefined&&!/^[A-Za-z0-9_.-]{1,160}$/.test(value.bezug)))throw Error(t(22));
 return {vertrag:value.vertrag,id:value.id,quelle:value.quelle,ziel:value.ziel,dokumentId:value.dokumentId,name:value.name,mime:value.mime,groesse:value.groesse,sha256:value.sha256,...(value.bezug?{bezug:value.bezug}:{})};
}
async function active(id){const state=await api.tresorZustand({});if(!state.offen||!state.kennung||!state.uebergaben||id&&state.kennung!==id)throw Error(t(24));return state;}
async function change(id,fn){
 const database=db;return new Promise((resolve,reject)=>{const tx=database.transaction('proUebergaben','readwrite'),store=tx.objectStore('proUebergaben');let result,error;
 tx.oncomplete=()=>{window.dispatchEvent(new Event('pb-pro-receipts'));resolve(result);};tx.onabort=()=>reject(error||tx.error||Error(t(20)));tx.onerror=()=>{};
 store.get(id).onsuccess=e=>{try{if(db!==database)throw Error(t(24));result=fn(e.target.result);store.put(result);}catch(e){error=e;tx.abort();}};
 });
}
const receipts=()=>idbGetAll('proUebergaben');
async function reserve(kind,vaultId,m){
 const id=kind+'-'+await textHash([vaultId,m.quelle,m.id]);
 return change(id,old=>{if(old&&(JSON.stringify(old.vertrag)!==JSON.stringify(m)||old.vaultId!==vaultId))throw Error(t(23));return old||{id,kind,vaultId,vertrag:m,stand:'offen',date:Date.now()};});
}
async function receive(){
 const z=await active(),items=(await api.tresorUebergabe({aktion:'eingang',vaultId:z.kennung})).items||[];let imported=0,failed=0;
 for(const item of items){try{
  if(item.fehler)throw Error(t(22));const m=contract(item.vertrag,APP),r=await reserve('eingang',z.kennung,m);
  await active(z.kennung);
  const native=await api.tresorUebergabe({aktion:'lesen',vaultId:z.kennung,entryId:item.entryId});
  if(native.entryId!==item.entryId||native.originalHash!==m.sha256||JSON.stringify(contract(native.vertrag,APP))!==JSON.stringify(m))throw Error(t(22));
  const stored=await PBOriginals.verifyStored(m.sha256,m.groesse),file=new File([stored],m.name,{type:m.mime});
  const accepted=await signBatch([{file,path:m.name,dirId:null}],{durable:true});
  if(accepted?.length!==1||accepted[0].index!==0||accepted[0].sha256!==m.sha256)throw Error(t(20));
  await change(r.id,old=>{if(!old||JSON.stringify(old.vertrag)!==JSON.stringify(m))throw Error(t(23));return{...old,hashes:accepted[0].hashes,stand:'gespeichert'};});
  await active(z.kennung);const ack=await api.tresorUebergabe({aktion:'quittieren',vaultId:z.kennung,entryId:item.entryId,sha256:m.sha256});if(ack?.stand!=='im-eingang')throw Error(t(20));imported++;
 }catch{failed++;}}
 note=items.length?t(25).replace('{n}',String(imported)).replace('{f}',String(failed)):t(30);return{imported,failed};
}
async function send(file,recordHash,target){
 const z=await active();if(!file||!file.size||file.size>MAX||!['familienakte','workflow-pdf-pro','bookledgerpro'].includes(target))throw Error(t(21));
 const pdf=file.type==='application/pdf'||/\.pdf$/i.test(file.name),image=/^image\//.test(file.type);
 if(target==='workflow-pdf-pro'&&!pdf&&!image||target==='bookledgerpro'&&!pdf&&!image&&!/\.eml$/i.test(file.name))throw Error(t(21));
 const sha=await hash(await file.arrayBuffer()),history=(await receipts()).filter(r=>r.kind==='eingang'&&r.vaultId===z.kennung&&r.hashes?.includes(recordHash)).sort((a,b)=>b.date-a.date);
 const bezug=history[0]?.vertrag.id,dokumentId=recordHash||sha;
 const id='pb-'+await textHash([z.kennung,dokumentId,target,file.name,file.type,sha,bezug||'']);
 const m=contract({vertrag:'familienakte-uebergabe/1',id,quelle:APP,ziel:target,dokumentId,name:file.name,mime:file.type,groesse:file.size,sha256:sha,...(bezug?{bezug}:{})},target);
 const r=await reserve('ausgang',z.kennung,m);
 await PBOriginals.storeItem({file,path:file.name,dirId:null});return deliver(r);
}
async function deliver(r){
 const m=contract(r.vertrag,r.vertrag.ziel);await PBOriginals.verifyStored(m.sha256,m.groesse);await active(r.vaultId);
 const result=await api.tresorUebergabe({aktion:'senden',vaultId:r.vaultId,vertrag:m});
 if(!/^[A-Za-z0-9_.-]{1,160}$/.test(result?.id||'')||['.','..'].includes(result.id)||result.sha256!==m.sha256||result.groesse!==m.groesse||result.name!==m.name||result.art!==m.mime||result.schreiber!==APP)throw Error(t(22));
 return change(r.id,old=>{if(!old||JSON.stringify(old.vertrag)!==JSON.stringify(m)||old.vaultId!==r.vaultId)throw Error(t(23));return{...old,entryId:result.id,stand:old.stand==='im-eingang'?'im-eingang':'weitergegeben'};});
}
async function confirm(){const z=await active();for(const r of await receipts()){
 if(r.kind!=='ausgang'||r.vaultId!==z.kennung||!r.entryId||r.stand==='im-eingang')continue;
 const result=await api.tresorUebergabe({aktion:'stand',vaultId:z.kennung,ziel:r.vertrag.ziel,entryId:r.entryId});
 if(result?.bestaetigt===true)await change(r.id,old=>{if(old?.entryId!==r.entryId)throw Error(t(23));return{...old,stand:'im-eingang'};});
}}
async function work(fn){if(busy)return;busy=true;try{await render();await fn();}catch(error){note=t(20)+' '+String(error?.message||'');}finally{busy=false;await render().catch(()=>{});}}
function button(host,label,fn){const b=make('button',label);b.type='button';b.disabled=busy;b.onclick=()=>void work(fn);host.append(b);return b;}
async function render(){
 const generation=++renderGeneration,host=document.querySelector('#vaultPlace');if(!host||typeof db==='undefined'||!db)return;
 let z,own={},all;try{z=await api.tresorZustand({});if(z.offen)own=await api.state();all=await receipts();}catch{z={};all=[];note=t(20);}
 if(generation!==renderGeneration)return;
 if(!panel){panel=make('section');panel.id='pro-verbund';panel.className='note';host.append(panel);}
 panel.replaceChildren(make('h4',t(0)),make('p',t(1)+(window.PBOrdnerHinweis?' '+PBOrdnerHinweis.hinweis():'')));
 const status=make('p',z.erreichbar===false?t(9)+(z.ordner||''):z.offen?t(7)+(z.ordner||''):z.gewaehlt?t(8)+(z.ordner||''):t(6));status.setAttribute('role','status');panel.append(status);
 const row=make('div');row.className='btnrow';panel.append(row);
 const connect=async other=>{
  // Gemeinsamer Tresor-Plan (Klaus 2026-11-03): falsch gewählter Ordner → klare Meldung statt Code.
  try{const r=await api.tresorEinziehen({...options(),nurVerbinden:true,...(other?{neuWaehlen:true}:{})});if(!r?.abgebrochen)note='';}
  catch(error){const text=window.PBOrdnerHinweis?.meldung(String(error?.code||error?.message||''));if(!text)throw error;note=text;}
 };
 // Ein Schritt (Klaus 2026-11-04): ohne verbundenen Tresor zuerst „nur Speicher wählen“; der alte Weg bleibt daneben.
 if(!z.gewaehlt&&typeof api.tresorEinrichten==='function'){
  const b=button(row,ein('knopf'),async()=>{
   try{const r=await api.tresorEinrichten(options());if(r?.abgebrochen)return;note=ein('fertig')+(r?.pfad||r?.ordner||r?.hauptordner||'');await window.PBTresorordner?.aktualisieren(true);await window.PBVault?.refresh?.();}
   catch(error){const code=String(error?.code||error?.message||'');const text=(EIN[document.documentElement.lang]||EIN.de)[code]||window.PBOrdnerHinweis?.meldung(code);if(!text)throw error;note=text;}
  });
  b.className='primary';b.dataset.tresorEinrichten='';b.title=ein('info');
 }
 if(!z.offen)button(row,z.gewaehlt?t(4):t(2),()=>connect(false));
 if(z.gewaehlt)button(row,t(3),()=>connect(true));
 if(z.offen){button(row,t(5),()=>api.tresorSperren({}));button(row,t(10),receive);button(row,t(11),confirm);
 if(own.unlocked&&z.pruefung==='PASST'&&!z.eingezogen)button(row,t(26),async()=>{await api.tresorEinziehen(options());await window.PBTresorordner?.aktualisieren(true);});}
 const notice=make('p',note);notice.setAttribute('role','status');panel.append(notice);
 const out=all.filter(r=>r.kind==='ausgang'&&r.vaultId===z.kennung);
 if(out.length){panel.append(make('h5',t(27)));const list=make('ul');for(const r of out){const li=make('li',r.vertrag.name+' → '+names[r.vertrag.ziel]+': '+t(r.stand==='im-eingang'?14:r.stand==='weitergegeben'?13:12));li.style.overflowWrap='anywhere';if(z.offen&&r.stand!=='im-eingang')button(li,more(1),()=>deliver(r));list.append(li);}panel.append(list);}
}
function choose(entry){
 const dialog=make('dialog');dialog.className='live-dialog';dialog.append(make('h2',t(16)),make('p',t(28)+entry.name));
 const label=make('label',t(17)),select=make('select');for(const id of ['familienakte','workflow-pdf-pro','bookledgerpro']){const option=make('option',names[id]);option.value=id;select.append(option);}label.append(select);dialog.append(label);
 const status=make('p');status.setAttribute('role','status');dialog.append(status);
 const go=make('button',t(18)),cancel=make('button',t(19));go.type=cancel.type='button';dialog.append(go,cancel);cancel.onclick=()=>dialog.close();
 let sending=false;dialog.addEventListener('cancel',event=>{if(sending)event.preventDefault();});
 go.onclick=async()=>{if(sending)return;const target=select.value;sending=true;go.disabled=select.disabled=cancel.disabled=true;try{let file=entry.file;if(!(file instanceof File)){const stored=await PBOriginals.verifyStored(file.pbOriginalHash,file.size);file=new File([stored],file.name,{type:file.type});}
  await send(file,entry.recordHash,target);status.textContent=t(13);cancel.textContent=more(0);await render();}
 catch(error){status.textContent=t(20)+' '+String(error?.message||'');}finally{sending=false;go.disabled=select.disabled=cancel.disabled=false;}};
 document.body.append(dialog);dialog.addEventListener('close',()=>dialog.remove(),{once:true});dialog.showModal();
}
function viewer(host,entry){let b=host.querySelector('[data-pro-transfer]');if(!b){b=make('button');b.type='button';b.dataset.proTransfer='';host.append(b);}b.textContent=t(15);b.hidden=!entry;b.onclick=()=>entry&&choose(entry);}
// Backup contains only bounded receipts, never a vault key or original bytes. Merge all-or-nothing;
// an existing local receipt is authoritative and a conflicting identity aborts restoration.
async function restore(rows){
 if(!Array.isArray(rows))throw Error(t(22));const checked=[];
 for(const r of rows){
  if(!r||!['eingang','ausgang'].includes(r.kind)||!/^[-A-Za-z0-9]{1,160}$/.test(r.vaultId||'')||!Number.isSafeInteger(r.date)||r.date<0)throw Error(t(22));
  const m=contract(r.vertrag,r.kind==='eingang'?APP:r.vertrag?.ziel);
  if(r.kind==='ausgang'&&(m.quelle!==APP||m.ziel===APP))throw Error(t(22));
  const expected=r.kind+'-'+await textHash([r.vaultId,m.quelle,m.id]);
  if(r.id!==expected||!(r.kind==='eingang'?['offen','gespeichert']:['offen','weitergegeben','im-eingang']).includes(r.stand)||
   r.entryId!==undefined&&(!/^[A-Za-z0-9_.-]{1,160}$/.test(r.entryId)||['.','..'].includes(r.entryId))||
   r.hashes!==undefined&&(!Array.isArray(r.hashes)||r.hashes.length>10000||r.hashes.some(h=>!/^[a-f0-9]{64}$/.test(h))))throw Error(t(22));
  checked.push({id:expected,kind:r.kind,vaultId:r.vaultId,vertrag:m,stand:r.stand,date:r.date,...(r.hashes?{hashes:r.hashes}:{}),...(r.entryId?{entryId:r.entryId}:{})});
 }
 const database=db;await new Promise((resolve,reject)=>{
  const tx=database.transaction('proUebergaben','readwrite'),store=tx.objectStore('proUebergaben');let error;
  tx.oncomplete=resolve;tx.onabort=()=>reject(error||tx.error||Error(t(20)));tx.onerror=()=>{};
  for(const r of checked)store.get(r.id).onsuccess=e=>{try{
   const old=e.target.result;if(db!==database||old&&(JSON.stringify(old.vertrag)!==JSON.stringify(r.vertrag)||old.vaultId!==r.vaultId))throw Error(t(23));
   if(!old)store.add(r);
  }catch(e){error=e;tx.abort();}};
 });
 window.dispatchEvent(new Event('pb-pro-receipts'));
}
window.PBProVerbund={receive,send,confirm,render,viewer,contract,restore,receipts};
new MutationObserver(()=>void render()).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
const start=()=>{if(typeof db!=='undefined'&&db&&document.querySelector('#vaultPlace'))void render();else setTimeout(start,300);};start();
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')void render();});
})();
