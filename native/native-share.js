/* Shared files stay in the durable native inbox until the ordinary import confirms its stored bytes and catalog. */
(() => {
  'use strict';
  const plugin=window.Capacitor?.Plugins?.ProShare;
  if(!plugin||typeof plugin.pending!=='function')return;
  const FILE_LIMIT=80*1024*1024,MAIL=/\.(eml|mbox)$/i;
  const WORDS={
    de:['{n} geteilte Datei(en) werden eingelesen …','{n} geteilte Datei(en) dauerhaft gespeichert.','{n} Datei(en) über 80 MB wurden nicht eingelesen.','Eine geteilte Datei konnte nicht gelesen oder gespeichert werden.','Noch nicht übernommene Dateien','{n} Datei(en) bleiben im Eingang. Nach Beheben des Problems erneut versuchen.','Erneut versuchen','Aus Eingang entfernen','Nur die Eingangskopie von „{name}“ entfernen? Diese Datei wurde noch nicht als übernommen bestätigt.','Die Eingangskopie konnte nicht entfernt werden.'],
    en:['Reading {n} shared file(s) …','{n} shared file(s) saved permanently.','{n} file(s) above 80 MB were not imported.','A shared file could not be read or saved.','Files awaiting import','{n} file(s) remain in the inbox. Fix the problem, then retry.','Retry','Remove from inbox','Remove only the inbox copy of “{name}”? This file has not been confirmed as imported.','The inbox copy could not be removed.'],
    ru:['Читаю общие файлы: {n} …','Файлы сохранены постоянно: {n}.','Файлы больше 80 МБ не импортированы: {n}.','Не удалось прочитать или сохранить общий файл.','Файлы, ожидающие импорта','В очереди осталось файлов: {n}. Устраните проблему и повторите.','Повторить','Убрать из очереди','Удалить только копию «{name}» из очереди? Импорт этого файла ещё не подтверждён.','Не удалось удалить копию из очереди.'],
    pl:['Wczytywanie udostępnionych plików: {n} …','Pliki zapisane na stałe: {n}.','Nie wczytano plików powyżej 80 MB: {n}.','Nie można odczytać lub zapisać udostępnionego pliku.','Pliki oczekujące na import','W kolejce pozostało plików: {n}. Rozwiąż problem i spróbuj ponownie.','Spróbuj ponownie','Usuń z kolejki','Usunąć tylko kopię „{name}” z kolejki? Import tego pliku nie został jeszcze potwierdzony.','Nie można usunąć kopii z kolejki.']
  };
  const say=(i,n,name='')=>(WORDS[document.documentElement.lang]||WORDS.de)[i].replace('{n}',String(n)).replace('{name}',name);
  const note=message=>window.toast?.(message,6000);
  const ready=()=>typeof window.signBatch==='function'&&window.PBWorkspace&&typeof db!=='undefined'&&db;
  function bytes(base64){const raw=atob(base64),out=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)out[i]=raw.charCodeAt(i);return out;}
  async function readItem(item){
    if(!Number.isSafeInteger(item.size)||item.size<0||item.size>200*1024*1024)throw Error('size');
    const parts=[];let offset=0;
    for(;;){const {data}=await plugin.read({id:item.id,offset});if(!data)break;
      const chunk=bytes(data);parts.push(chunk);offset+=chunk.length;if(offset>item.size)throw Error('size');}
    if(offset!==item.size)throw Error('size');
    return new File(parts,item.name,{type:item.mime||'application/octet-stream',lastModified:Date.now()});
  }
  let running=false,again=false,lastItems=[],unavailable=0;
  function render(){
    const host=document.querySelector('#panel-intake');if(!host)return;
    let panel=document.querySelector('#native-share-pending');
    if(!panel){panel=document.createElement('section');panel.id='native-share-pending';panel.className='note';host.append(panel);}
    panel.replaceChildren();panel.hidden=!lastItems.length&&!unavailable;if(panel.hidden)return;
    const make=(tag,text)=>{const el=document.createElement(tag);el.textContent=text;return el;};
    panel.append(make('h3',say(4)),make('p',lastItems.length?say(5,lastItems.length):say(3)));
    const retry=make('button',say(6));retry.type='button';retry.disabled=running;retry.onclick=()=>collect();panel.append(retry);
    const list=document.createElement('ul');
    for(const item of lastItems){const row=make('li',item.name+' '),discard=make('button',say(7));discard.type='button';discard.disabled=running;
      discard.onclick=async()=>{if(!window.confirm(say(8,0,item.name)))return;discard.disabled=true;
        try{await plugin.done({id:item.id});const pending=await plugin.pending();lastItems=pending.items||[];unavailable=pending.refused||0;}
        catch{note(say(9));}finally{render();}};
      row.append(discard);list.append(row);
    }
    panel.append(list);
  }
  async function waitForImport(){while(typeof signing!=='undefined'&&signing)await new Promise(resolve=>setTimeout(resolve,120));}
  async function collect(){
    if(running){again=true;return;}running=true;render();
    try{
      do{
        again=false;await waitForImport();
        const {items=[],refused=0}=await plugin.pending();lastItems=items;unavailable=refused;
        let missing=refused,accepted=0;
        const take=items.filter(i=>i.size<=FILE_LIMIT||MAIL.test(i.name)),tooBig=items.length-take.length,entries=[];
        if(take.length)note(say(0,take.length));
        for(const item of take){try{entries.push({file:await readItem(item),path:item.name,dirId:null,nativeId:item.id});}catch{missing++;}}
        if(entries.length){
          await waitForImport();window.PBWorkspace.navigate?.('intake');
          const receipts=await window.signBatch(entries,{durable:true});
          const done=new Set();
          for(const receipt of Array.isArray(receipts)?receipts:[]){
            const entry=entries[receipt.index];
            if(!entry||done.has(entry.nativeId)||receipt.sha256!==await sha256(await entry.file.arrayBuffer()))continue;
            try{await plugin.done({id:entry.nativeId});done.add(entry.nativeId);accepted++;}catch{missing++;}
          }
          missing+=entries.length-accepted;
        }
        const pending=await plugin.pending();lastItems=pending.items||[];unavailable=pending.refused||0;
        const messages=[];if(accepted)messages.push(say(1,accepted));if(tooBig)messages.push(say(2,tooBig));if(missing)messages.push(say(3));if(lastItems.length)messages.push(say(5,lastItems.length));
        if(messages.length)note(messages.join(' '));
      }while(again);
    }catch{note(say(3));}
    finally{running=false;render();}
  }
  plugin.addListener?.('shared',()=>{if(ready())collect();});
  new MutationObserver(render).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  const start=()=>{if(ready())collect();else setTimeout(start,300);};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
  window.PBShare={collect};
})();
