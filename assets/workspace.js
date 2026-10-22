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
    up:['↑ Übergeordneter Ordner','↑ Parent folder','↑ На уровень выше','↑ Folder nadrzędny'],all:['Alle Dateien','All files','Все файлы','Wszystkie pliki'],byName:['Name','Name','Имя','Nazwa'],byDate:['Datum','Date','Дата','Data'],bySize:['Größe','Size','Размер','Rozmiar'],orderName:['↕ A → Z','↕ A → Z','↕ А → Я','↕ A → Z'],orderNameR:['↕ Z → A','↕ Z → A','↕ Я → А','↕ Z → A'],orderDate:['↕ Neueste oben','↕ Newest first','↕ Сначала новые','↕ Najnowsze u góry'],orderDateR:['↕ Älteste oben','↕ Oldest first','↕ Сначала старые','↕ Najstarsze u góry'],orderSize:['↕ Größte oben','↕ Largest first','↕ Сначала большие','↕ Największe u góry'],orderSizeR:['↕ Kleinste oben','↕ Smallest first','↕ Сначала маленькие','↕ Najmniejsze u góry'],inContent:['🔎 auch im Inhalt','🔎 also in content','🔎 также в содержимом','🔎 także w treści'],
    find:['Was möchtest du finden?','What would you like to find?','Что вы хотите найти?','Co chcesz znaleźć?'],findHelp:['Durchsuche E-Mails, Dokumente und Bilder gemeinsam nach ihrer Bedeutung.','Search emails, documents and images together by meaning.','Ищите письма, документы и изображения вместе по смыслу.','Szukaj wiadomości, dokumentów i obrazów według znaczenia.'],
    noFolder:['Noch kein Ablageordner gewählt. Einzeln gewählte Dateien sind nur in dieser Sitzung verfügbar. Für dauerhaften Zugriff einen Ordner verbinden oder einen Ablageordner wählen.','No library folder selected. Individually selected files are available for this session only. Connect a folder or choose a library for lasting access.','Папка не выбрана. Отдельно выбранные файлы доступны только в этом сеансе. Подключите папку для постоянного доступа.','Nie wybrano folderu. Wybrane pliki są dostępne tylko w tej sesji. Połącz folder, aby zachować dostęp.'],
    unsupported:['Dieser Browser unterstützt keine direkte Ordnerablage. Dateiimport und Suche funktionieren; Dateien müssen nach einem Neustart erneut ausgewählt werden. Für lokale Ordner Chrome oder Edge auf einem unterstützten Desktop verwenden.','This browser does not support direct folder storage. File import and search work; select files again after restarting. For local folders use Chrome or Edge on a supported desktop.','Браузер не поддерживает прямую запись в папку. Импорт и поиск работают; после перезапуска выберите файлы снова. Для папок используйте Chrome или Edge на поддерживаемом компьютере.','Przeglądarka nie obsługuje zapisu do folderu. Import i wyszukiwanie działają; po ponownym uruchomieniu wybierz pliki jeszcze raz. Dostęp do folderów wymaga obsługiwanej przeglądarki Chrome lub Edge na komputerze.'],
    active:['Kopienablage aktiv','Copy storage active','Сохранение копий включено','Zapis kopii włączony'],open:['Öffnen','Open','Открыть','Otwórz'],local:['Lokale Datei','Local file','Локальный файл','Plik lokalny'],session:['Nur diese Sitzung','This session only','Только этот сеанс','Tylko ta sesja'],catalog:['Katalog / Mailtext','Catalog / email text','Каталог / текст письма','Katalog / treść wiadomości'],
    empty:['Keine Dateien in dieser Ansicht. Füge Dateien hinzu oder wähle einen anderen Ordner.','No files in this view. Add files or choose another folder.','В этом разделе нет файлов. Добавьте файлы или выберите другую папку.','Brak plików. Dodaj pliki lub wybierz inny folder.'],filter:['Dateiliste filtern','Filter files','Фильтр файлов','Filtruj pliki'],
    permission:['Bitte gib den Zugriff auf den Ablageordner frei. Es wurde nichts kopiert.','Please grant access to the library folder. Nothing was copied.','Разрешите доступ к папке. Ничего не скопировано.','Zezwól na dostęp do folderu. Nic nie skopiowano.'],
    unavailable:['Datei nicht erreichbar. Prüfe den Ordner und seine Freigabe. Der Katalogeintrag bleibt erhalten.','File unavailable. Check the folder and permission. The catalog entry is preserved.','Файл недоступен. Проверьте папку и разрешение. Запись в каталоге сохранена.','Plik niedostępny. Sprawdź folder i uprawnienia. Wpis w katalogu pozostaje.'],
    emails:['E-Mails','Emails','Письма','Wiadomości'],
    // Klaus 2026-10-22: "nicht eindeutig zugeordnet" · "er sagt nicht, wo er die hingeladen hat".
    kind_mail:['E-Mails','Emails','Письма','Wiadomości'],kind_doc:['Dokumente','Documents','Документы','Dokumenty'],
    kind_photo:['Fotos und Bilder','Photos and images','Фото и изображения','Zdjęcia i obrazy'],kind_note:['Notizen','Notes','Заметки','Notatki'],
    kind_attach:['Anhänge aus E-Mails','Attachments from emails','Вложения из писем','Załączniki z e-maili'],
    byKind:['Nach Art','By type','По типу','Według rodzaju'],folders:['Ordner','Folders','Папки','Foldery'],
    mailFolder:['Gespeicherte E-Mails','Saved emails','Сохранённые письма','Zapisane e-maile'],
    unknownSender:['Absender unbekannt','Unknown sender','Отправитель неизвестен','Nieznany nadawca'],
    fromMail:['aus der E-Mail von','from the email of','из письма от','z e-maila od'],
    doneNew:['✓ Fertig. So ist es eingeordnet:','✓ Done. This is where it went:','✓ Готово. Вот куда это попало:','✓ Gotowe. Tu trafiło:'],
    doneKnown:['schon vorher da','already there','уже было','już było'],
    showIn:['Im Explorer zeigen','Show in Explorer','Показать в проводнике','Pokaż w eksploratorze'],
    doneClose:['Hinweis schließen','Close note','Закрыть','Zamknij'],documents:['Dateien','Files','Файлы','Pliki'],stored:['lokal verknüpft','linked locally','локальные ссылки','powiązane lokalnie']
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
    if (saved && saved.handle && localStorage.getItem('pb_library_enabled') === '1') {
      // Boot fills DIR_HANDLES a moment later; register the handle now so refresh() does not
      // take the not-yet-listed folder for a removed one and switch the library off.
      library = saved.handle; DIR_HANDLES.set(libraryId, saved.handle);
    }
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
      // Mails from "Alle Konten" have their own view; thousands of them would swamp the explorer.
      if (r.mailIndex && !r.mailLegacy) continue;
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
  // Newest on top by default; ↕ turns any order around; the content switch also searches the file text.
  let explorerReverse=false;
  const orderBox=document.createElement('span');orderBox.className='explorer-order';
  const orderButton=document.createElement('button');orderButton.type='button';orderButton.className='ghost';orderButton.id='explorerOrder';
  const contentLabel=document.createElement('label');contentLabel.className='explorer-content';
  const contentBox=document.createElement('input');contentBox.type='checkbox';contentBox.id='explorerContent';
  const contentText=document.createElement('span');contentLabel.append(contentBox,contentText);orderBox.append(orderButton,contentLabel);
  el('explorerSort').after(orderBox);
  if(!el('explorerSort').dataset.chosen)el('explorerSort').value='date';
  function orderLabel(){const k={name:'orderName',date:'orderDate',size:'orderSize'}[el('explorerSort').value]||'orderDate';orderButton.textContent=text(k+(explorerReverse?'R':''));orderButton.setAttribute('aria-pressed',String(explorerReverse));contentText.textContent=text('inContent');}
  orderButton.onclick=()=>{explorerReverse=!explorerReverse;renderExplorer();};
  contentBox.onchange=()=>renderExplorer();
  function explorerState(){return {path:folderPath,filter:el('explorerFilter').value,sort:el('explorerSort').value,reverse:explorerReverse,content:contentBox.checked};}
  function restoreExplorer(state){
    folderPath=String(state?.path||'');el('explorerFilter').value=String(state?.filter||'');
    el('explorerSort').value=['name','date','size'].includes(state?.sort)?state.sort:'date';
    explorerReverse=state?.reverse===true;contentBox.checked=state?.content===true;renderExplorer();
  }
  const foldText=s=>String(s||'').toLocaleLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ß/g,'ss');
  function explorerMatch(e,words){
    if(!words.length)return true;
    const name=foldText(e.r.name+' '+e.path);
    if(words.every(w=>name.includes(w)))return true;
    if(!contentBox.checked)return false;
    const body=foldText([e.r.snippet,e.r.summary,e.r.mailBody,e.r.ocrText,e.r.caption].filter(Boolean).join(' '));
    const stems=e.r.tf||{};
    return words.every(w=>body.includes(w)||(typeof stem==='function'&&Object.hasOwn(stems,stem(w))));
  }
  function openFolder(path,{clear=false}={}){
    if(window.PBNavigation)return window.PBNavigation.folder(path,clear);
    folderPath=path;if(clear)el('explorerFilter').value='';renderExplorer();
  }
  // What kind an entry is, so the explorer and the import note can say where a file is.
  const KINDS=[['mail','✉️'],['doc','📄'],['photo','🖼️'],['note','📝'],['attach','📎']];
  const kindIcon=k=>(KINDS.find(x=>x[0]===k)||KINDS[1])[1];
  const ATTACH_DIR='Mail-Anhang', MAIL_DIR='Mail';
  function attachSender(path){const p=String(path||'').split('/'),i=p.indexOf(ATTACH_DIR);return i>=0&&p.length>i+2?p[i+1]:'';}
  function kindOf(r,path){
    if(r.mail)return 'mail';
    if(String(path||r.path||'').split('/').includes(ATTACH_DIR))return 'attach';
    const n=String(r.name||'');
    if(/\.(png|jpe?g|webp|gif|bmp|tiff?|heic|heif)$/i.test(n)||String(r.type||'').startsWith('image/'))return 'photo';
    if(/\.(txt|md|markdown|rtf)$/i.test(n)||r.category==='Text/Notiz')return 'note';
    return 'doc';
  }
  function senderLabel(seg){const s=String(seg||'').replace(/\s+/g,' ').trim();return '👤 '+(!s||s==='?'?text('unknownSender'):s);}
  function folderLabel(path){
    const p=path.split('/'),seg=p[p.length-1],parent=p[p.length-2];
    if(seg===MAIL_DIR&&p.length===1)return '✉️ '+text('mailFolder');
    if(seg===ATTACH_DIR)return '📎 '+text('kind_attach');
    if((parent===MAIL_DIR&&p.length===2)||parent===ATTACH_DIR)return senderLabel(seg);
    return '📁 '+seg;
  }
  function heading(label){const h=document.createElement('p');h.className='explorer-tree-head';h.textContent=label;return h;}
  function showKind(key){
    const path='kind:'+key;
    if(window.PBNavigation)return window.PBNavigation.folder(path,true);
    navigate('explorer');openFolder(path,true);
  }
  // After "Dateien hinzufügen": say where the files went, with one tap to get there.
  function importSummary(list){
    let box=el('pbImportDone');
    if(!box){box=document.createElement('div');box.id='pbImportDone';box.className='pb-import-done';box.setAttribute('role','status');el('prog')?.after(box);}
    box.replaceChildren();
    const counts=new Map();
    for(const item of list||[]){const c=counts.get(item.kind)||{fresh:0,known:0};item.known?c.known++:c.fresh++;counts.set(item.kind,c);}
    if(!counts.size){box.hidden=true;return;}
    box.hidden=false;box.append(heading(text('doneNew')));
    for(const [key,icon] of KINDS){
      const c=counts.get(key);if(!c)continue;
      const line=document.createElement('p');line.dataset.kind=key;
      const label=document.createElement('span');
      label.textContent=icon+' '+text('kind_'+key)+': '+(c.fresh+c.known)+(c.known?' ('+c.known+' '+text('doneKnown')+')':'');
      const go=button('→ '+text('showIn'),()=>showKind(key));go.dataset.show=key;
      line.append(label,go);box.append(line);
    }
    const close=button('✕',()=>{box.hidden=true;});close.className='ghost pb-import-close';close.title=close.ariaLabel=text('doneClose');
    box.append(close);
  }
  function renderExplorer() {
    const all=entries(), tree=el('explorerTree'), files=el('explorerFiles');
    tree.replaceChildren(); files.replaceChildren();
    tree.append(button('📁 '+text('all'),()=>openFolder('')));
    // By type first: these are the places a new person looks for a file.
    const kindCount=new Map(),seenKind=new Set();
    for(const e of all){if(seenKind.has(e.r.hash))continue;seenKind.add(e.r.hash);const k=kindOf(e.r,e.path);kindCount.set(k,(kindCount.get(k)||0)+1);}
    if(kindCount.size)tree.append(heading(text('byKind')));
    for(const [key,icon] of KINDS){
      const n=kindCount.get(key);if(!n)continue;
      const b=button(icon+' '+text('kind_'+key)+' ('+n+')',()=>openFolder('kind:'+key));b.dataset.kind=key;
      b.setAttribute('aria-current',folderPath==='kind:'+key?'location':'false');tree.append(b);
    }
    // Real folders, nested, with readable names: "Mail" holds saved emails by sender, "Mail-Anhang" the attachments.
    const folders = new Map();
    for (const e of all) { const parts=e.path.split('/'); parts.pop(); for(let i=1;i<=parts.length;i++){const f=parts.slice(0,i).join('/');folders.set(f,(folders.get(f)||0)+1);} }
    if(folders.size)tree.append(heading(text('folders')));
    for(const [path,n] of [...folders].sort((a,b)=>a[0].localeCompare(b[0]))) {
      const b=button(folderLabel(path)+' ('+n+')',()=>openFolder(path));
      b.dataset.path=path;b.title=path;b.classList.add('explorer-folder');b.style.setProperty('--depth',String(path.split('/').length-1));
      b.setAttribute('aria-current',path===folderPath?'location':'false');tree.append(b);
    }
    // App-specific folders (Android: encrypted mail attachments) render their own contents.
    // Categories (native): views over the catalog, nothing is moved. Path "topic:<key>".
    const topics=window.PBExplorerTopics, views=topics?.views()||[];
    for(const v of views){const b=button(v.label+' ('+v.count+')',()=>openFolder('topic:'+v.key));b.dataset.topic=v.key;b.setAttribute('aria-current',folderPath==='topic:'+v.key?'location':'false');tree.append(b);}
    const view=folderPath.startsWith('topic:')?views.find(v=>'topic:'+v.key===folderPath):null;
    const extra=window.PBExplorerExtra;
    extra?.tree(tree,folderPath,openFolder,button);
    if(extra?.owns(folderPath)){el('explorerPath').textContent=extra.label();el('explorerUp').disabled=false;extra.files(files,el('explorerFilter').value,el('explorerSort').value);return;}
    const kindView=folderPath.startsWith('kind:')?folderPath.slice(5):'';
    el('explorerPath').textContent=view?view.label:kindView?kindIcon(kindView)+' '+text('kind_'+kindView):folderPath?folderPath.split('/').map((x,i,a)=>folderLabel(a.slice(0,i+1).join('/'))).join(' › '):text('all');
    el('explorerUp').disabled=!folderPath;
    orderLabel();
    if(!folderPath)topics?.notice(files);
    if(view)topics.head(files,view.key);
    const words=foldText(el('explorerFilter').value).split(/\s+/).filter(Boolean);
    const seen=new Set();
    const visible=view?all.filter(e=>!seen.has(e.r.hash)&&seen.add(e.r.hash)&&view.match(e.r)&&explorerMatch(e,words))
      :kindView?all.filter(e=>!seen.has(e.r.hash)&&kindOf(e.r,e.path)===kindView&&seen.add(e.r.hash)&&explorerMatch(e,words))
      :all.filter(e=>(!folderPath || e.path.startsWith(folderPath+'/')) && explorerMatch(e,words));
    const sort=el('explorerSort').value, flip=explorerReverse?-1:1;
    visible.sort((a,b)=>flip*(sort==='date'?(b.r.date||0)-(a.r.date||0):sort==='size'?(b.r.size||0)-(a.r.size||0):a.r.name.localeCompare(b.r.name)));
    for (const e of visible) {
      const row=document.createElement('article');row.className='explorer-row';
      const info=document.createElement('div'), name=document.createElement('strong'), meta=document.createElement('div');
      const kind=kindOf(e.r,e.path),sender=kind==='attach'?attachSender(e.path):'';row.dataset.kind=kind;
      name.textContent=kindIcon(kind)+' '+(e.dirId && !e.r.mail?e.path.split('/').pop():e.r.name);meta.className='explorer-meta';
      meta.textContent=(kind==='attach'?'📎 '+text('fromMail')+' '+senderLabel(sender).slice(3)+' · ':'')+e.path+' · '+fmtKB(e.r.size||0)+' · '+(window.PBOriginals?.stored.has(e.r.hash)?PBOriginals.label():e.dirId?text('local'):SESSION_FILES.has(e.r.hash)?text('session'):text('catalog'));
      info.append(name,meta);row.append(info,button(text('open'),()=>openEntry(e)));if(view)row.append(topics.rowTool(e.r,view.key));files.append(row);
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
  el('explorerFilter').oninput=renderExplorer;el('explorerSort').onchange=()=>{el('explorerSort').dataset.chosen='1';explorerReverse=false;renderExplorer();};
  el('explorerHome').onclick=()=>openFolder('',{clear:true});
  el('explorerUp').onclick=()=>openFolder(folderPath.split('/').slice(0,-1).join('/'));
  new MutationObserver(refresh).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  new MutationObserver(syncNavigation).observe(el('panel-search'),{attributes:true,attributeFilter:['class']});
  window.addEventListener('popstate',()=>navigate(location.hash.slice(1)||'search',{record:false}));
  window.addEventListener('hashchange',()=>navigate(location.hash.slice(1)||'search',{record:false}));
  window.PBWorkspace={prepareImport,storeItem,refresh,navigate,explorerState,restoreExplorer,kindOf,importSummary,showKind};
  navigate(location.hash.slice(1)||'search',{replace:true});
  const wait=setInterval(()=>{if(db){clearInterval(wait);ready=restore().catch(()=>refresh());}},50);
  refresh();
})();
