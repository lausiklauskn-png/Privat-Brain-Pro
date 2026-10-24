/* Selected originals are copied into private native storage before catalog import succeeds. */
(() => {
  'use strict';
  const files=window.Capacitor?.Plugins?.ProFiles;
  if(typeof files?.beginImport!=='function')return;
  const stored=new Set(),cache=new Map(),chunk=256*1024,observed=new Map();
  let originalsReady=false,originalsError=false;
  const changed=()=>window.dispatchEvent(new Event('pb-originals-change'));
  // A loaded metadata list is not a byte-integrity check. Observed read failures
  // are kept separate from a missing entry; no extra native reads are made here.
  function statusFor(hash){
    if(observed.has(hash))return observed.get(hash);
    if(stored.has(hash))return 'local';
    return originalsError?'unavailable':originalsReady?'missing':'unknown';
  }
  const words={
    de:['Original erneut auswählen','Die Vorschau ist vorhanden, aber die Originaldatei fehlt. Wähle dieselbe Datei erneut aus. Der Katalog bleibt erhalten.','Datei auswählen','Abbrechen','Diese Datei passt nicht zum Original. Bitte dieselbe Originaldatei auswählen.','Original konnte nicht gespeichert oder gelesen werden. Prüfe den freien Speicher und versuche es erneut.','Dauerhafte Originalkopien in dieser App. Die Quelldateien bleiben unverändert. Ältere fehlende Originale kannst du erneut auswählen.','Lokale Kopie'],
    en:['Select original again','The preview is available but the original file is missing. Select the same file again. The catalog is preserved.','Select file','Cancel','This file does not match the original. Select the same original file.','Unable to save or read the original. Check free storage and try again.','Original copies are stored permanently in this app. Source files stay unchanged. You can select older missing originals again.','Local copy'],
    ru:['Выбрать оригинал снова','Предпросмотр есть, но оригинальный файл недоступен. Выберите тот же файл снова. Каталог сохранится.','Выбрать файл','Отмена','Этот файл не совпадает с оригиналом. Выберите тот же оригинальный файл.','Не удалось сохранить или прочитать оригинал. Проверьте свободное место и повторите.','Копии оригиналов сохраняются в приложении. Исходные файлы не меняются. Недоступные оригиналы можно выбрать снова.','Локальная копия'],
    pl:['Wybierz oryginał ponownie','Podgląd jest dostępny, ale brakuje oryginalnego pliku. Wybierz ten sam plik ponownie. Katalog zostaje zachowany.','Wybierz plik','Anuluj','Ten plik nie pasuje do oryginału. Wybierz ten sam plik.','Nie można zapisać lub odczytać oryginału. Sprawdź wolne miejsce i spróbuj ponownie.','Kopie oryginałów pozostają w aplikacji. Pliki źródłowe są niezmienione. Brakujące oryginały można wybrać ponownie.','Kopia lokalna']
  };
  // Klaus 2026-10-22: "woher soll der Nutzer wissen, welches die Originaldatei war?" The app looks itself first
  // (mail attachments in the chosen folder, by fingerprint), then names the file and lets a whole folder be searched.
  const more={
    de:['„{name}“ ist im Katalog, aber die Datei selbst ist auf diesem Gerät nicht gespeichert. Das passiert bei Dateien, die früher eingelesen oder aus einer Katalog-Sicherung zurückgeholt wurden.','Woher: {path}','📁 Ordner durchsuchen','Wähle den Ordner, in dem deine Dateien liegen, zum Beispiel „Download“. Die App erkennt alle fehlenden Originale an ihrem Fingerabdruck und holt sie zurück. Im Ordner wird nichts verändert.','{n} fehlende Originale wiedergefunden.','In diesem Ordner war keines der fehlenden Originale.','Kam als Anhang einer E-Mail: die E-Mail-Datei (.mbox/.eml) noch einmal einlesen, dann sind die Anhänge wieder da.','Wird gesucht … {i} / {n}','Original im Ordner „Mail-Anhänge“ gefunden und wiederhergestellt.'],
    en:['"{name}" is in the catalog, but the file itself is not stored on this device. This happens with files added earlier or restored from a catalog backup.','From: {path}','📁 Search a folder','Choose the folder where your files are, for example "Download". The app recognises every missing original by its fingerprint and brings it back. Nothing in the folder is changed.','{n} missing originals found again.','None of the missing originals was in this folder.','Came as an email attachment: read the email file (.mbox/.eml) again and the attachments are back.','Searching … {i} / {n}','Original found in the "Email attachments" folder and restored.'],
    ru:['«{name}» есть в каталоге, но самого файла на устройстве нет. Так бывает с файлами, добавленными раньше или восстановленными из резервной копии каталога.','Откуда: {path}','📁 Искать в папке','Выберите папку с вашими файлами, например «Download». Приложение узнаёт все недостающие оригиналы по отпечатку и возвращает их. В папке ничего не меняется.','Найдено недостающих оригиналов: {n}.','В этой папке недостающих оригиналов нет.','Пришёл как вложение письма: снова загрузите файл письма (.mbox/.eml), и вложения вернутся.','Поиск … {i} / {n}','Оригинал найден в папке «Вложения» и восстановлен.'],
    pl:['„{name}” jest w katalogu, ale sam plik nie jest zapisany na tym urządzeniu. Tak bywa z plikami dodanymi wcześniej lub przywróconymi z kopii katalogu.','Skąd: {path}','📁 Przeszukaj folder','Wybierz folder z plikami, np. „Download”. Aplikacja rozpozna brakujące oryginały po odcisku i je przywróci. W folderze nic się nie zmienia.','Odnaleziono brakujące oryginały: {n}.','W tym folderze nie było brakujących oryginałów.','Przyszedł jako załącznik e-maila: wczytaj ponownie plik e-maila (.mbox/.eml), a załączniki wrócą.','Szukanie … {i} / {n}','Oryginał znaleziony w folderze „Załączniki” i przywrócony.']
  };
  const m=(i,v={})=>{let x=(more[document.documentElement.lang]||more.de)[i];for(const k in v)x=x.split('{'+k+'}').join(v[k]);return x;};
  const t=i=>(words[document.documentElement.lang]||words.de)[i];
  const b64=bytes=>{let value='';for(let n=0;n<bytes.length;n+=8192)value+=String.fromCharCode(...bytes.subarray(n,n+8192));return btoa(value);};
  function mark(file,hash){Object.defineProperty(file,'pbOriginalHash',{value:hash,configurable:true});return file;}
  async function save(file){
    const hash=await sha256(await file.arrayBuffer());
    let ticket;
    try{
      const result=await files.beginImport({hash,size:file.size,name:file.name,type:file.type});ticket=result.ticket;
      if(!result.stored){
        window.PBImportStep?.(0,0);
        for(let offset=0;offset<file.size;offset+=chunk){
          const bytes=new Uint8Array(await file.slice(offset,offset+chunk).arrayBuffer());
          await files.appendImport({ticket,offset,data:b64(bytes)});
          window.PBImportStep?.(0.4*Math.min(1,(offset+chunk)/file.size),0);   // the copy is the first 40 % of a file
        }
        await files.finishImport({ticket});
      }
      stored.add(hash);observed.delete(hash);mark(file,hash);changed();return hash;
    }catch(error){if(ticket)await files.abortImport({ticket}).catch(()=>{});throw new Error(t(5));}
  }
  const oldResolve=window.resolveFile,oldOpen=window.openFile,oldLightbox=window.openLightbox;
  async function readOriginal(r){
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
  async function resolve(r){
    const before=statusFor(r.hash);
    try{
      const file=await readOriginal(r);
      if(file){observed.delete(r.hash);if(statusFor(r.hash)!==before)changed();}
      else{stored.delete(r.hash);observed.set(r.hash,'missing');changed();}
      return file;
    }catch(error){
      stored.delete(r.hash);cache.delete(r.hash);observed.set(r.hash,'unavailable');changed();throw error;
    }
  }
  const make=(tag,text)=>{const e=document.createElement(tag);if(text)e.textContent=text;return e;};
  const missingRecords=()=>CATALOG.filter(x=>!x.mail&&!x.mailIndex&&!stored.has(x.hash)&&!SESSION_FILES.has(x.hash));
  // Mail attachments kept in the chosen folder carry the same fingerprint: bring the original back from there.
  async function fromVault(r){
    const vault=window.PBVault;if(!vault?.findByHash)return null;
    const entry=await vault.findByHash(r.hash).catch(()=>null);if(!entry)return null;
    const bytes=await vault.bytes(entry);const file=mark(new File([bytes],r.name||entry.name,{type:entry.type||''}),r.hash);
    if(await sha256(await file.arrayBuffer())!==r.hash)return null;
    await save(file);return file;
  }
  // One folder for all missing originals: only files of a matching size are read, matched by fingerprint.
  async function searchFolder(status){
    const folders=window.Capacitor?.Plugins?.ProFolders;if(typeof folders?.chooseSource!=='function')return 0;
    const missing=new Map();for(const x of missingRecords())missing.set(x.hash,x);
    const sizes=new Set([...missing.values()].map(x=>x.size));let found=0;
    try{
      const selected=await folders.chooseSource();if(selected?.cancelled||!Array.isArray(selected?.items))return null;
      const candidates=selected.items.filter(item=>sizes.has(item.size));let i=0;
      for(const item of candidates){
        status.textContent=m(7,{i:++i,n:candidates.length});
        const parts=[];for(let offset=0;offset<item.size;offset+=256*1024){const res=await folders.readSource({id:item.id,offset});parts.push(Uint8Array.from(atob(res.data),c=>c.charCodeAt(0)));}
        const file=new File(parts,item.name,{type:item.type});const hash=await sha256(await file.arrayBuffer());
        if(!missing.has(hash))continue;
        await save(file);missing.delete(hash);found++;
      }
    }finally{await folders.finishSource().catch(()=>{});}
    window.PBWorkspace.refresh();return found;
  }
  function reconnect(r,error=false){
    const dialog=make('dialog');dialog.className='live-dialog native-original-reconnect';
    const path=String(r.path||r.name||'');
    const title=make('h2',t(0)),help=make('p',m(0,{name:r.name||path})),from=make('p',m(1,{path})),status=make('p',error?t(5):'');status.setAttribute('role','status');from.className='hint';
    const mailHint=path.split('/').includes('Mail-Anhang')?make('p',m(6)):null;
    const search=make('button',m(2)),searchHelp=make('p',m(3));search.type='button';searchHelp.className='hint';
    search.onclick=async()=>{search.disabled=true;status.textContent='';
      try{const n=await searchFolder(status);if(n===null){status.textContent='';return;}status.textContent=n?m(4,{n}):m(5);
        if(n&&stored.has(r.hash)&&dialog.open){dialog.close();window.openFile(r.hash);}}
      catch{status.textContent=t(5);}finally{search.disabled=false;}};
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
    dialog.append(title,help,from,...(mailHint?[mailHint]:[]),search,searchHelp,status,select,cancel,input);document.body.append(dialog);
    dialog.addEventListener('close',()=>dialog.remove());dialog.showModal();
  }
  window.resolveFile=resolve;
  window.openFile=async hash=>{
    const r=CATALOG.find(r=>r.hash===hash);if(!r)return;
    if(r.mailBody!=null)return oldOpen(hash);
    const index=history.state?.pbNative?.index;
    try{
      let file=await resolve(r);if(history.state?.pbNative?.index!==index)return;
      if(!file){file=await fromVault(r).catch(()=>null);if(file){window.PBWorkspace.refresh();if(typeof toast==='function')toast(m(8),5000);}}
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
    if(window.PBFolders){window.PBFolders.refresh();return;}
    for(const id of ['chooseLibrary','pauseLibrary']){const e=document.getElementById(id);if(e)e.hidden=true;}
  }
  window.PBOriginals={stored,resolve,reconnect,searchFolder,missingRecords,notice,statusFor,snapshot:()=>Object.freeze({ready:originalsReady,error:originalsError}),label:()=>t(7),async storeItem(item){const hash=await save(item.file);if(window.PBFolders)await window.PBFolders.copy(hash,item.file.name);return item;}};
  new MutationObserver(notice).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  files.listOriginals().then(result=>{
    if(!Array.isArray(result?.items)||result.items.some(hash=>typeof hash!=='string'||!/^[a-f0-9]{64}$/.test(hash)))throw new Error('Original list unavailable');
    for(const hash of result.items)stored.add(hash);originalsReady=true;originalsError=false;changed();window.PBWorkspace.refresh();
  }).catch(()=>{originalsReady=false;originalsError=true;changed();});
  notice();
})();
