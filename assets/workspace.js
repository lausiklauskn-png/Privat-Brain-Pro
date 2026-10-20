/* App-owned workspace: three main pages, on-device library, catalog explorer.
   File bytes are written only to a user-selected directory, never to GitHub.
   IndexedDB retains directory handles and the existing catalog, not the copies. */
(function () {
  'use strict';
  const el = id => document.getElementById(id);
  const words = {
    search:['🔎 Suche','🔎 Search','🔎 Поиск','🔎 Szukaj'],backSearch:['← Zur Suche','← Back to search','← К поиску','← Do wyszukiwania'],add:['📥 Dateien hinzufügen','📥 Add files','📥 Добавить файлы','📥 Dodaj pliki'],explorer:['📁 Explorer','📁 Explorer','📁 Проводник','📁 Eksplorator'],
    library:['Deine lokale Ablage','Your local library','Локальная папка','Folder lokalny'],
    libraryHelp:['Wähle einen separaten Ordner auf deinem Gerät. Neue Dateien werden dort als Kopie gespeichert; die Originale bleiben erhalten. Der Explorer öffnet die Kopien aus diesem Ordner.','Choose a separate folder on your device. New files are saved there as copies; originals are preserved. Explorer opens the copies from that folder.','Выберите отдельную папку на устройстве. Новые файлы сохраняются туда как копии; оригиналы остаются. Проводник открывает копии из этой папки.','Wybierz osobny folder na urządzeniu. Nowe pliki są tam zapisywane jako kopie; oryginały pozostają. Eksplorator otwiera kopie z tego folderu.'],
    choose:['Ablageordner wählen','Choose library folder','Выбрать папку','Wybierz folder'],pause:['Kopieren ausschalten','Turn off copying','Отключить копирование','Wyłącz kopiowanie'],
    copyFolder:['📁 Ordner in Ablage kopieren','📁 Copy folder to library','📁 Копировать папку','📁 Kopiuj folder do biblioteki'],linkFolder:['📁 Ordner verbinden','📁 Connect folder','📁 Подключить папку','📁 Połącz folder'],
    up:['↑ Übergeordneter Ordner','↑ Parent folder','↑ На уровень выше','↑ Folder nadrzędny'],all:['Alle Dateien','All files','Все файлы','Wszystkie pliki'],byName:['Name A–Z','Name A–Z','Имя А–Я','Nazwa A–Z'],byDate:['Neueste zuerst','Newest first','Сначала новые','Najnowsze'],bySize:['Größe','Size','Размер','Rozmiar'],
    find:['Was möchtest du finden?','What would you like to find?','Что вы хотите найти?','Co chcesz znaleźć?'],findHelp:['Durchsuche E-Mails, Dokumente und Bilder gemeinsam nach ihrer Bedeutung.','Search emails, documents and images together by meaning.','Ищите письма, документы и изображения вместе по смыслу.','Szukaj wiadomości, dokumentów i obrazów według znaczenia.'],
    noFolder:['Noch kein Ablageordner gewählt. Einzeln gewählte Dateien sind nur in dieser Sitzung verfügbar. Für dauerhaften Zugriff einen Ordner verbinden oder einen Ablageordner wählen.','No library folder selected. Individually selected files are available for this session only. Connect a folder or choose a library for lasting access.','Папка не выбрана. Отдельно выбранные файлы доступны только в этом сеансе. Подключите папку для постоянного доступа.','Nie wybrano folderu. Wybrane pliki są dostępne tylko w tej sesji. Połącz folder, aby zachować dostęp.'],
    unsupported:['Dieser Browser unterstützt keine direkte Ordnerablage. Dateiimport und Suche funktionieren; Dateien müssen nach einem Neustart erneut ausgewählt werden. Für lokale Ordner Chrome oder Edge auf einem unterstützten Desktop verwenden.','This browser does not support direct folder storage. File import and search work; select files again after restarting. For local folders use Chrome or Edge on a supported desktop.','Браузер не поддерживает прямую запись в папку. Импорт и поиск работают; после перезапуска выберите файлы снова. Для папок используйте Chrome или Edge на поддерживаемом компьютере.','Przeglądarka nie obsługuje zapisu do folderu. Import i wyszukiwanie działają; po ponownym uruchomieniu wybierz pliki jeszcze raz. Dostęp do folderów wymaga obsługiwanej przeglądarki Chrome lub Edge na komputerze.'],
    active:['Kopienablage aktiv','Copy storage active','Сохранение копий включено','Zapis kopii włączony'],open:['Öffnen','Open','Открыть','Otwórz'],local:['Lokale Datei','Local file','Локальный файл','Plik lokalny'],session:['Nur diese Sitzung','This session only','Только этот сеанс','Tylko ta sesja'],catalog:['Katalog / Mailtext','Catalog / email text','Каталог / текст письма','Katalog / treść wiadomości'],
    empty:['Keine Dateien in dieser Ansicht. Füge Dateien hinzu oder wähle einen anderen Ordner.','No files in this view. Add files or choose another folder.','В этом разделе нет файлов. Добавьте файлы или выберите другую папку.','Brak plików. Dodaj pliki lub wybierz inny folder.'],filter:['Dateiliste filtern','Filter files','Фильтр файлов','Filtruj pliki'],
    permission:['Bitte gib den Zugriff auf den Ablageordner frei. Es wurde nichts kopiert.','Please grant access to the library folder. Nothing was copied.','Разрешите доступ к папке. Ничего не скопировано.','Zezwól na dostęp do folderu. Nic nie skopiowano.'],
    unavailable:['Datei nicht erreichbar. Prüfe den Ordner und seine Freigabe. Der Katalogeintrag bleibt erhalten.','File unavailable. Check the folder and permission. The catalog entry is preserved.','Файл недоступен. Проверьте папку и разрешение. Запись в каталоге сохранена.','Plik niedostępny. Sprawdź folder i uprawnienia. Wpis w katalogu pozostaje.'],
    emails:['E-Mails','Emails','Письма','Wiadomości'],documents:['Dateien','Files','Файлы','Pliki'],stored:['lokal verknüpft','linked locally','локальные ссылки','powiązane lokalnie']
  };
  function text(key) { return (words[key] || [key])[Math.max(0,['de','en','ru','pl'].indexOf(document.documentElement.lang.slice(0,2)))] || key; }
  const pages=new Set([...document.querySelectorAll('.tab[data-tab]')].map(t=>t.dataset.tab));
  function syncNavigation(){
    const searching=el('panel-search').classList.contains('on'), key=searching?'search':'backSearch';
    const tab=document.querySelector('[data-tab="search"]');tab.textContent=text(key);
    document.querySelectorAll('.tab[data-tab]').forEach(t=>t.setAttribute('aria-current',el('panel-'+t.dataset.tab)?.classList.contains('on')?'page':'false'));
  }
  function navigate(page,{record=true,replace=false}={}){
    if(!pages.has(page))page='search';
    if(record && window.PBNavigation)return window.PBNavigation.navigate(page);
    document.querySelectorAll('.panel').forEach(p=>p.classList.toggle('on',p.id==='panel-'+page));
    document.querySelectorAll('.tab[data-tab]').forEach(t=>t.classList.toggle('on',t.dataset.tab===page));
    if(record){
      const url=location.pathname+location.search+(page==='search'?'':'#'+page);
      if(replace || url!==location.pathname+location.search+location.hash)history[replace?'replaceState':'pushState']({pbPage:page},'',url);
    }
    syncNavigation();
  }
  let folderPath = '', library = null, ready = null;
  let libraryId = localStorage.getItem('pb_library_id');
  async function permission(handle, mode) {
    if (!handle.queryPermission) return true; // e.g. browser-owned test directory
    if (await handle.queryPermission({mode}) === 'granted') return true;
    return await handle.requestPermission({mode}) === 'granted';
  }
  async function restore() {
    if (!db) return;
    const saved = libraryId ? await idbGet('dirs', libraryId) : null;
    if (saved && saved.handle && localStorage.getItem('pb_library_enabled') === '1') library = saved.handle;
    refresh();
  }
  async function chooseLibrary() {
    if (!window.showDirectoryPicker || signing) return;
    try {
      const handle = await window.showDirectoryPicker({mode:'readwrite',id:'private-brain-library'});
      // Commit permission binding before enabling copy mode. Never silently fall back.
      const nextId = 'library_'+crypto.randomUUID();
      await idbPut('dirs',{id:nextId,name:handle.name,handle,added:Date.now()});
      libraryId=nextId; library = handle; DIR_HANDLES.set(libraryId,handle);
      localStorage.setItem('pb_library_id',libraryId);
      localStorage.setItem('pb_library_enabled','1'); refreshAll();
    } catch (e) { if (e.name !== 'AbortError') toast(text('permission')); }
  }
  async function prepareImport() {
    if (ready) await ready;
    if (!library) {
      if(localStorage.getItem('pb_library_enabled')==='1'){toast(text('permission'),6000);return false;}
      return true;
    }
    try { if (await permission(library,'readwrite')) return true; } catch (_) {}
    toast(text('permission'),6000); return false;
  }
  async function storeItem(item) {
    if(window.PBOriginals)return window.PBOriginals.storeItem(item);
    return navigator.locks ? navigator.locks.request('private-brain-local-library-write',()=>writeItem(item)) : writeItem(item);
  }
  async function writeItem(item) {
    if (!library || item.dirId === libraryId) return item;
    // Preserve source subfolders, reject traversal, never overwrite a file.
    const pieces = String(item.path || item.file.name).split('/').filter(Boolean);
    if (pieces.some(p => p === '.' || p === '..' || /[\\\0]/.test(p))) throw new Error('Invalid relative path');
    const name = pieces.pop() || item.file.name;
    let dir = library;
    for (const piece of pieces) dir = await dir.getDirectoryHandle(piece,{create:true});
    const dot = name.lastIndexOf('.'), base = dot>0 ? name.slice(0,dot) : name, ext = dot>0 ? name.slice(dot) : '';
    let target = name;
    // A repeated import reuses a byte-identical copy instead of accumulating copies.
    for (let n=0;;n++) {
      target = n ? base+' ('+n+')'+ext : name;
      try {
        const existing = await dir.getFileHandle(target);
        const old = await existing.getFile();
        if (old.size === item.file.size && await sha256(await old.arrayBuffer()) === await sha256(await item.file.arrayBuffer()))
          return {...item,path:[library.name,...pieces,target].join('/'),dirId:libraryId};
      } catch (e) { if (e.name === 'NotFoundError') break; throw e; }
    }
    const dest = await dir.getFileHandle(target,{create:true});
    let writer;
    try { writer = await dest.createWritable(); await writer.write(item.file); await writer.close(); }
    catch (e) { if(writer) await writer.abort().catch(()=>{}); await dir.removeEntry(target).catch(()=>{}); throw e; }
    return {...item,path:[library.name,...pieces,target].join('/'),dirId:libraryId};
  }
  function entries() {
    const out=[];
    for (const r of CATALOG) {
      const locs = r.localSource ? [r.localSource] : [{path:r.path || r.name,dirId:r.dirId},...(r.dupes||[])];
      for (const loc of locs) out.push({r,path:loc.path||r.name,dirId:loc.dirId});
    }
    return out;
  }
  async function openEntry(entry) {
    if(window.PBOriginals)return openFile(entry.r.hash);
    if (!entry.dirId) return openFile(entry.r.hash);
    try {
      const handle = DIR_HANDLES.get(entry.dirId) || (await idbGet('dirs',entry.dirId))?.handle;
      if (!handle || !await permission(handle,'read')) throw new Error('Permission');
      const file = await getByPath(handle,entry.path);
      showBlob(file,{...entry.r,name:file.name});
    } catch (_) { toast(text('unavailable'),6000); }
  }
  function button(label, action) { const b=document.createElement('button');b.type='button';b.className='ghost';b.textContent=label;b.onclick=action;return b; }
  function explorerState(){return {path:folderPath,filter:el('explorerFilter').value,sort:el('explorerSort').value};}
  function restoreExplorer(state){
    folderPath=String(state?.path||'');el('explorerFilter').value=String(state?.filter||'');
    el('explorerSort').value=['name','date','size'].includes(state?.sort)?state.sort:'name';renderExplorer();
  }
  function openFolder(path,{clear=false}={}){
    if(window.PBNavigation)return window.PBNavigation.folder(path,clear);
    folderPath=path;if(clear)el('explorerFilter').value='';renderExplorer();
  }
  function renderExplorer() {
    const all=entries(), tree=el('explorerTree'), files=el('explorerFiles');
    tree.replaceChildren(); files.replaceChildren();
    tree.append(button('📁 '+text('all'),()=>openFolder('')));
    const folders = new Set();
    for (const e of all) { const parts=e.path.split('/'); parts.pop(); for(let i=1;i<=parts.length;i++) folders.add(parts.slice(0,i).join('/')); }
    for(const path of [...folders].sort((a,b)=>a.localeCompare(b))) {
      const b=button('📁 '+path,()=>openFolder(path));
      b.setAttribute('aria-current',path===folderPath?'location':'false');tree.append(b);
    }
    el('explorerPath').textContent=folderPath || text('all');
    el('explorerUp').disabled=!folderPath;
    const filter=el('explorerFilter').value.toLocaleLowerCase();
    const visible=all.filter(e=>(!folderPath || e.path.startsWith(folderPath+'/')) && (e.r.name+' '+e.path).toLocaleLowerCase().includes(filter));
    const sort=el('explorerSort').value;
    visible.sort((a,b)=>sort==='date'?b.r.date-a.r.date:sort==='size'?b.r.size-a.r.size:a.r.name.localeCompare(b.r.name));
    for (const e of visible) {
      const row=document.createElement('article');row.className='explorer-row';
      const info=document.createElement('div'), name=document.createElement('strong'), meta=document.createElement('div');
      name.textContent=(e.r.mail?'✉️ ':'📄 ')+(e.dirId && !e.r.mail?e.path.split('/').pop():e.r.name);meta.className='explorer-meta';
      meta.textContent=e.path+' · '+fmtKB(e.r.size||0)+' · '+(window.PBOriginals?.stored.has(e.r.hash)?PBOriginals.label():e.dirId?text('local'):SESSION_FILES.has(e.r.hash)?text('session'):text('catalog'));
      info.append(name,meta);row.append(info,button(text('open'),()=>openEntry(e)));files.append(row);
    }
    if(!visible.length){const p=document.createElement('p');p.className='explorer-empty';p.textContent=text('empty');files.append(p);}
  }
  function refresh() {
    if(library && !DIR_HANDLES.has(libraryId)) {library=null;localStorage.setItem('pb_library_enabled','0');}
    for (const node of document.querySelectorAll('[data-ws]')) node.textContent=text(node.dataset.ws);
    el('explorerFilter').placeholder=text('filter');el('explorerFilter').setAttribute('aria-label',text('filter'));
    syncNavigation();
    el('chooseLibrary').disabled=!window.showDirectoryPicker || signing;
    el('pauseLibrary').disabled=!library || signing;
    el('pickDir').textContent=text(library?'copyFolder':'linkFolder');
    el('pickDir').title=text(library?'copyFolder':'linkFolder');
    el('libraryStatus').textContent=library?text('active')+': '+library.name:window.showDirectoryPicker?text('noFolder'):text('unsupported');
    el('searchMailCount').textContent=CATALOG.filter(r=>r.mail).length+' '+text('emails');
    el('searchDocCount').textContent=CATALOG.filter(r=>!r.mail).length+' '+text('documents');
    el('searchLocalCount').textContent=entries().filter(e=>e.dirId || SESSION_FILES.has(e.r.hash) || window.PBOriginals?.stored.has(e.r.hash)).length+' '+text('stored');
    renderExplorer();
    window.PBOriginals?.notice();
  }
  el('chooseLibrary').onclick=chooseLibrary;
  el('pauseLibrary').onclick=()=>{if(signing)return;library=null;localStorage.setItem('pb_library_enabled','0');refresh();};
  el('explorerFilter').oninput=renderExplorer;el('explorerSort').onchange=renderExplorer;
  el('explorerHome').onclick=()=>openFolder('',{clear:true});
  el('explorerUp').onclick=()=>openFolder(folderPath.split('/').slice(0,-1).join('/'));
  new MutationObserver(refresh).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  new MutationObserver(syncNavigation).observe(el('panel-search'),{attributes:true,attributeFilter:['class']});
  window.addEventListener('popstate',()=>navigate(location.hash.slice(1)||'search',{record:false}));
  window.addEventListener('hashchange',()=>navigate(location.hash.slice(1)||'search',{record:false}));
  window.PBWorkspace={prepareImport,storeItem,refresh,navigate,explorerState,restoreExplorer};
  navigate(location.hash.slice(1)||'search',{replace:true});
  const wait=setInterval(()=>{if(db){clearInterval(wait);ready=restore().catch(()=>refresh());}},50);
  refresh();
})();
