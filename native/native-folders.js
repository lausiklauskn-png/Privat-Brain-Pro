/* Android SAF: explicit folder choices remain usable even when the explanation is hidden. */
(() => {
  'use strict';
  const api=window.Capacitor?.Plugins?.ProFolders;if(typeof api?.chooseSource!=='function')return;
  const words={
    de:['Ablageordner wählen','Ablageordner ändern','Kopieren ausschalten','Ordner verbinden','Originale bleiben unverändert. Neue Importe erhalten zusätzliche Kopien im gewählten Ablageordner. Ein Ordnerwechsel gilt für zukünftige Kopien; vorhandene Dateien bleiben erhalten.','Dauerhafte Originalkopien in dieser App.','Zusätzliche Kopien in: ','Ordnerauswahl auf deinem Gerät','Android fragt gleich nach dem Ordnerzugriff. Wähle nur den gewünschten Ordner. Diese Auswahl lädt keine Dateien ins Internet.','Nicht mehr zeigen','Weiter zur Ordnerauswahl','Abbrechen','Ordner konnte nicht geöffnet oder beschrieben werden. Bitte erneut wählen und die Android-Freigabe prüfen. Bereits importierte Dateien bleiben erhalten.','Der Ordner ist zu groß: höchstens 2.000 Dateien, 80 MiB je Datei, 512 MiB insgesamt und 8 Unterordnerebenen pro Import. Wähle einen kleineren Unterordner.','Ordner wird eingelesen …','Der Ordner enthält keine importierbaren Dateien.','Quellordner werden eingelesen; die App behält lokale Kopien. Deine Quelldateien bleiben unverändert.'],
    en:['Choose library folder','Change library folder','Turn off copying','Connect folder','Your files stay on your device. Source folders are read only; originals are never changed or moved. The selected library receives additional copies of new imports. Previously stored files remain available when changing folders.','Original copies are stored permanently in this app.','Additional copies in: ','Folder selection on your device','Android will ask for folder access. Select only the folder you want. This selection does not upload files to the internet.',"Don't show again",'Continue to folder selection','Cancel','Unable to read or write the folder. Select it again and check Android permissions. Previously imported files are preserved.','Folder too large: at most 2,000 files, 80 MiB per file, 512 MiB total and 8 subfolder levels per import. Select a smaller subfolder.','Reading folder …','This folder contains no importable files.','Source folders are read into local app copies. Your source files remain unchanged.'],
    ru:['Выбрать папку копий','Изменить папку копий','Отключить копирование','Подключить папку','Файлы остаются на устройстве. Исходные папки только читаются; оригиналы не изменяются и не перемещаются. В выбранную папку сохраняются дополнительные копии новых импортов. Ранее сохранённые файлы остаются доступны при смене папки.','Копии оригиналов сохраняются в приложении.','Дополнительные копии в: ','Выбор папки на устройстве','Android запросит доступ к папке. Выберите нужную папку. Этот выбор не загружает файлы в интернет.','Больше не показывать','Перейти к выбору папки','Отмена','Не удалось прочитать папку или записать копию. Выберите снова и проверьте разрешения Android. Импортированные файлы сохранены.','Слишком большая папка: до 2000 файлов, 80 МиБ на файл, 512 МиБ всего и 8 уровней вложенности. Выберите меньшую подпапку.','Чтение папки …','В папке нет файлов для импорта.','Папки читаются в локальные копии приложения. Исходные файлы не меняются.'],
    pl:['Wybierz folder kopii','Zmień folder kopii','Wyłącz kopiowanie','Połącz folder','Pliki zostają na urządzeniu. Foldery źródłowe są tylko odczytywane; oryginały nie są zmieniane ani przenoszone. Wybrany folder otrzymuje dodatkowe kopie nowych importów. Zapisane pliki pozostają dostępne po zmianie folderu.','Kopie oryginałów pozostają w aplikacji.','Dodatkowe kopie w: ','Wybór folderu na urządzeniu','Android poprosi o dostęp do folderu. Wybierz żądany folder. Ten wybór nie wysyła plików do internetu.','Nie pokazuj ponownie','Przejdź do wyboru folderu','Anuluj','Nie można odczytać folderu lub zapisać kopii. Wybierz ponownie i sprawdź uprawnienia Android. Zaimportowane pliki pozostają.','Za duży folder: do 2000 plików, 80 MiB na plik, 512 MiB łącznie i 8 poziomów podfolderów. Wybierz mniejszy podfolder.','Odczytywanie folderu …','Folder nie zawiera plików do importu.','Foldery źródłowe są odczytywane do lokalnych kopii aplikacji. Oryginały pozostają niezmienione.']
  };
  if(window.Capacitor?.getPlatform?.()==='windows'){
    const adapted=[["Windows öffnet die Ordnerauswahl. Wähle nur den gewünschten Ordner. Die Auswahl lädt nichts ins Internet.", "Ordner nicht erreichbar oder nicht beschreibbar. Prüfe das Laufwerk und wähle ihn erneut. Importierte Dateien bleiben erhalten."], ["Windows opens the folder picker. Select only the folder you want. This uploads nothing.", "Folder unavailable or not writable. Check the drive and select it again. Imported files are preserved."], ["Windows откроет выбор папки. Выберите нужную папку. Ничего не загружается в интернет.", "Папка недоступна или закрыта для записи. Проверьте диск и выберите снова. Импортированные файлы сохранены."], ["Windows otworzy wybór folderu. Wybierz żądany folder. Nic nie jest wysyłane do internetu.", "Folder niedostępny lub bez prawa zapisu. Sprawdź dysk i wybierz ponownie. Zaimportowane pliki pozostają."]];['de','en','ru','pl'].forEach((lang,i)=>{words[lang][8]=adapted[i][0];words[lang][12]=adapted[i][1];});
  }
  const t=i=>(words[document.documentElement.lang]||words.de)[i];
  const choose=document.getElementById('chooseLibrary'),pause=document.getElementById('pauseLibrary'),connect=document.getElementById('pickDir'),status=document.getElementById('libraryStatus');
  let state={enabled:false,name:''},busy=false,problem='',reading='';
  function refresh(){
    choose.hidden=pause.hidden=connect.hidden=false;
    // The PWA bootstrap hides this when showDirectoryPicker is absent in WebView.
    // Native SAF is independent of that browser feature detection.
    connect.style.display='';choose.disabled=pause.disabled=connect.disabled=busy||Boolean(signing);
    pause.disabled=busy||Boolean(signing)||!state.enabled;
    for(const [node,key] of [[choose,state.name?1:0],[pause,2],[connect,3]]){node.textContent=t(key);node.title=t(key);}
    document.querySelector('[data-ws=libraryHelp]').textContent=t(4);
    document.getElementById('fsHint').textContent=t(16);
    status.textContent=(reading?t(14)+' '+reading+' ':'')+(problem?problem+' ':'')+t(5)+(state.enabled?' '+t(6)+state.name:'');
  }
  function hint(){
    if(localStorage.getItem('pb_fs_ok')==='1')return Promise.resolve(true);
    return new Promise(resolve=>{
      const dialog=document.createElement('dialog');dialog.className='live-dialog native-folder-consent';
      const title=document.createElement('h2'),help=document.createElement('p'),label=document.createElement('label'),check=document.createElement('input'),go=document.createElement('button'),cancel=document.createElement('button');
      title.textContent=t(7);help.textContent=t(8);check.type='checkbox';check.id='fsNoShow';label.append(check,document.createTextNode(' '+t(9)));go.type=cancel.type='button';go.textContent=t(10);cancel.textContent=t(11);go.id='fsGo';let accepted=false;
      go.onclick=()=>{accepted=true;if(check.checked)localStorage.setItem('pb_fs_ok','1');dialog.close();};cancel.onclick=()=>dialog.close();
      dialog.append(title,help,label,go,cancel);document.body.append(dialog);dialog.addEventListener('close',()=>{dialog.remove();resolve(accepted);},{once:true});dialog.showModal();
    });
  }
  async function pick(library){
    if(busy||signing)return;busy=true;problem='';refresh();
    try{
      if(!await hint())return;
      const selected=await api[library?'chooseLibrary':'chooseSource']();if(selected?.cancelled)return;
      if(library){state=selected;return;}
      if(!Array.isArray(selected?.items))throw new Error();
      if(!selected.items.length){problem=t(15);return;}
      cancelReq=false;let index=0;
      // Transfer/process one file at a time, not an entire picture folder in WebView memory.
      for(const item of selected.items){
        if(cancelReq)break;reading=(++index)+' / '+selected.items.length;refresh();
        if(!Number.isSafeInteger(item.size)||item.size<0||item.size>80*1024*1024)throw new Error();
        const parts=[];for(let offset=0;offset<item.size;offset+=256*1024){const result=await api.readSource({id:item.id,offset});const bytes=Uint8Array.from(atob(result.data),c=>c.charCodeAt(0));if(bytes.length!==Math.min(256*1024,item.size-offset))throw new Error();parts.push(bytes);}
        if(cancelReq)break;
        const file=new File(parts,item.name,{type:item.type});await signBatch([{file,path:item.path,dirId:null}]);
        // The verified native copy remains available through PBOriginals.resolve().
        if(file.pbOriginalHash)SESSION_FILES.delete(file.pbOriginalHash);
      }
    }catch(error){problem=t(error?.code==='FOLDER_LIMIT'?13:12);}
    finally{await api.finishSource().catch(()=>{});busy=false;reading='';refresh();}
  }
  for(const [node,action]of [[choose,()=>pick(true)],[connect,()=>pick(false)],[pause,async()=>{if(busy||signing)return;busy=true;problem='';refresh();try{state=await api.pause();}catch{problem=t(12);}finally{busy=false;refresh();}}]]){
    node.addEventListener('click',event=>{event.preventDefault();event.stopImmediatePropagation();action();},true);
  }
  window.PBFolders={refresh,async copy(hash,name){try{await api.copyOriginal({hash,name});}catch{problem=t(12);refresh();throw new Error(problem);}}};
  // Browser handles cannot represent Android SAF grants; the native copy operation checks access.
  window.PBWorkspace.prepareImport=async()=>true;
  const browserHint=window.renderFsHint;
  window.renderFsHint=()=>{browserHint?.();refresh();};
  new MutationObserver(refresh).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  api.state().then(value=>{state=value;refresh();}).catch(()=>{problem=t(12);refresh();});refresh();
})();
