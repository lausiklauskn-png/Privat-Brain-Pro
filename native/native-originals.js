/* Selected originals are copied into private native storage before catalog import succeeds. */
(() => {
  'use strict';
  const files=window.Capacitor?.Plugins?.ProFiles;
  if(typeof files?.beginImport!=='function')return;
  const stored=new Set(),cache=new Map(),chunk=256*1024;
  const words={
    de:['Original erneut auswählen','Die Vorschau ist vorhanden, aber die Originaldatei fehlt. Wähle dieselbe Datei erneut aus. Der Katalog bleibt erhalten.','Datei auswählen','Abbrechen','Diese Datei passt nicht zum Original. Bitte dieselbe Originaldatei auswählen.','Original konnte nicht gespeichert oder gelesen werden. Prüfe den freien Speicher und versuche es erneut.','Dauerhafte Originalkopien in dieser App. Die Quelldateien bleiben unverändert. Ältere fehlende Originale kannst du erneut auswählen.','Lokale Kopie'],
    en:['Select original again','The preview is available but the original file is missing. Select the same file again. The catalog is preserved.','Select file','Cancel','This file does not match the original. Select the same original file.','Unable to save or read the original. Check free storage and try again.','Original copies are stored permanently in this app. Source files stay unchanged. You can select older missing originals again.','Local copy'],
    ru:['Выбрать оригинал снова','Предпросмотр есть, но оригинальный файл недоступен. Выберите тот же файл снова. Каталог сохранится.','Выбрать файл','Отмена','Этот файл не совпадает с оригиналом. Выберите тот же оригинальный файл.','Не удалось сохранить или прочитать оригинал. Проверьте свободное место и повторите.','Копии оригиналов сохраняются в приложении. Исходные файлы не меняются. Недоступные оригиналы можно выбрать снова.','Локальная копия'],
    pl:['Wybierz oryginał ponownie','Podgląd jest dostępny, ale brakuje oryginalnego pliku. Wybierz ten sam plik ponownie. Katalog zostaje zachowany.','Wybierz plik','Anuluj','Ten plik nie pasuje do oryginału. Wybierz ten sam plik.','Nie można zapisać lub odczytać oryginału. Sprawdź wolne miejsce i spróbuj ponownie.','Kopie oryginałów pozostają w aplikacji. Pliki źródłowe są niezmienione. Brakujące oryginały można wybrać ponownie.','Kopia lokalna']
  };
  const t=i=>(words[document.documentElement.lang]||words.de)[i];
  const b64=bytes=>{let value='';for(let n=0;n<bytes.length;n+=8192)value+=String.fromCharCode(...bytes.subarray(n,n+8192));return btoa(value);};
  function mark(file,hash){Object.defineProperty(file,'pbOriginalHash',{value:hash,configurable:true});return file;}
  async function save(file){
    const hash=await sha256(await file.arrayBuffer());
    let ticket;
    try{
      const result=await files.beginImport({hash,size:file.size,name:file.name,type:file.type});ticket=result.ticket;
      if(!result.stored){
        for(let offset=0;offset<file.size;offset+=chunk){
          const bytes=new Uint8Array(await file.slice(offset,offset+chunk).arrayBuffer());
          await files.appendImport({ticket,offset,data:b64(bytes)});
        }
        await files.finishImport({ticket});
      }
      stored.add(hash);mark(file,hash);return hash;
    }catch(error){if(ticket)await files.abortImport({ticket}).catch(()=>{});throw new Error(t(5));}
  }
  const oldResolve=window.resolveFile,oldOpen=window.openFile,oldLightbox=window.openLightbox;
  async function resolve(r){
    if(SESSION_FILES.has(r.hash))return SESSION_FILES.get(r.hash);
    if(cache.has(r.hash))return cache.get(r.hash);
    const info=await files.originalInfo({hash:r.hash});
    if(info.missing)return oldResolve(r);
    if(info.hash!==r.hash||!Number.isSafeInteger(info.size)||info.size<0||info.size>256*1024*1024)throw new Error(t(5));
    const parts=[];
    for(let offset=0;offset<info.size;offset+=chunk){
      const result=await files.readOriginal({hash:r.hash,offset});
      const bytes=Uint8Array.from(atob(result.data),c=>c.charCodeAt(0));
      if(bytes.length!==Math.min(chunk,info.size-offset))throw new Error(t(5));parts.push(bytes);
    }
    const file=mark(new File(parts,r.name||info.name,{type:info.type}),r.hash);
    if(await sha256(await file.arrayBuffer())!==r.hash)throw new Error(t(5));
    cache.set(r.hash,file);if(cache.size>4)cache.delete(cache.keys().next().value);stored.add(r.hash);return file;
  }
  const make=(tag,text)=>{const e=document.createElement(tag);if(text)e.textContent=text;return e;};
  function reconnect(r,error=false){
    const dialog=make('dialog');dialog.className='live-dialog native-original-reconnect';
    const title=make('h2',t(0)),help=make('p',t(1)),status=make('p',error?t(5):'');status.setAttribute('role','status');
    const select=make('button',t(2)),cancel=make('button',t(3)),input=make('input');input.type='file';input.hidden=true;
    select.type=cancel.type='button';cancel.onclick=()=>dialog.close();select.onclick=()=>input.click();
    input.onchange=async()=>{
      const file=input.files[0];if(!file)return;select.disabled=true;status.textContent='';
      try{
        if(await sha256(await file.arrayBuffer())!==r.hash){status.textContent=t(4);return;}
        await save(file);SESSION_FILES.set(r.hash,file);window.PBWorkspace.refresh();
        if(dialog.isConnected&&dialog.open){dialog.close();showBlob(file,r);}
      }catch{status.textContent=t(5);}
      finally{select.disabled=false;input.value='';}
    };
    dialog.append(title,help,status,select,cancel,input);document.body.append(dialog);
    dialog.addEventListener('close',()=>dialog.remove());dialog.showModal();
  }
  window.resolveFile=resolve;
  window.openFile=async hash=>{
    const r=CATALOG.find(r=>r.hash===hash);if(!r)return;
    if(r.mailBody!=null)return oldOpen(hash);
    const index=history.state?.pbNative?.index;
    try{
      const file=await resolve(r);if(history.state?.pbNative?.index!==index)return;
      if(file)return showBlob(file,r);reconnect(r);
    }catch{reconnect(r,true);}
  };
  window.openLightbox=async hash=>{
    await oldLightbox(hash);
    if(document.querySelector('#lightboxBg.on')){
      const open=document.querySelector('#lightboxOpen');open.style.display='';open.onclick=()=>window.openFile(hash);
    }
  };
  function notice(){
    const status=document.querySelector('#libraryStatus');if(status)status.textContent=t(6);
    for(const id of ['chooseLibrary','pauseLibrary']){const e=document.getElementById(id);if(e)e.hidden=true;}
  }
  window.PBOriginals={stored,resolve,reconnect,notice,label:()=>t(7),async storeItem(item){await save(item.file);return item;}};
  new MutationObserver(notice).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  files.listOriginals().then(result=>{for(const hash of result.items)stored.add(hash);window.PBWorkspace.refresh();}).catch(()=>{});
  notice();
})();
