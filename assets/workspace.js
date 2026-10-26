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
    byType:['Typ','Type','Тип','Typ'],orderType:['↕ A → Z','↕ A → Z','↕ А → Я','↕ A → Z'],orderTypeR:['↕ Z → A','↕ Z → A','↕ Я → А','↕ Z → A'],
    find:['Was möchtest du finden?','What would you like to find?','Что вы хотите найти?','Co chcesz znaleźć?'],findHelp:['Durchsuche E-Mails, Dokumente und Bilder gemeinsam nach ihrer Bedeutung.','Search emails, documents and images together by meaning.','Ищите письма, документы и изображения вместе по смыслу.','Szukaj wiadomości, dokumentów i obrazów według znaczenia.'],
    noFolder:['Noch kein Ablageordner gewählt. Einzeln gewählte Dateien sind nur in dieser Sitzung verfügbar. Für dauerhaften Zugriff einen Ordner verbinden oder einen Ablageordner wählen.','No library folder selected. Individually selected files are available for this session only. Connect a folder or choose a library for lasting access.','Папка не выбрана. Отдельно выбранные файлы доступны только в этом сеансе. Подключите папку для постоянного доступа.','Nie wybrano folderu. Wybrane pliki są dostępne tylko w tej sesji. Połącz folder, aby zachować dostęp.'],
    unsupported:['Dieser Browser unterstützt keine direkte Ordnerablage. Dateiimport und Suche funktionieren; Dateien müssen nach einem Neustart erneut ausgewählt werden. Für lokale Ordner Chrome oder Edge auf einem unterstützten Desktop verwenden.','This browser does not support direct folder storage. File import and search work; select files again after restarting. For local folders use Chrome or Edge on a supported desktop.','Браузер не поддерживает прямую запись в папку. Импорт и поиск работают; после перезапуска выберите файлы снова. Для папок используйте Chrome или Edge на поддерживаемом компьютере.','Przeglądarka nie obsługuje zapisu do folderu. Import i wyszukiwanie działają; po ponownym uruchomieniu wybierz pliki jeszcze raz. Dostęp do folderów wymaga obsługiwanej przeglądarki Chrome lub Edge na komputerze.'],
    active:['Kopienablage aktiv','Copy storage active','Сохранение копий включено','Zapis kopii włączony'],open:['Öffnen','Open','Открыть','Otwórz'],local:['Lokale Datei','Local file','Локальный файл','Plik lokalny'],session:['Nur diese Sitzung','This session only','Только этот сеанс','Tylko ta sesja'],catalog:['Katalog / Mailtext','Catalog / email text','Каталог / текст письма','Katalog / treść wiadomości'],
    empty:['Keine Dateien in dieser Ansicht. Füge Dateien hinzu oder wähle einen anderen Ordner.','No files in this view. Add files or choose another folder.','В этом разделе нет файлов. Добавьте файлы или выберите другую папку.','Brak plików. Dodaj pliki lub wybierz inny folder.'],filter:['Dateiliste filtern','Filter files','Фильтр файлов','Filtruj pliki'],filterShort:['Suche','Search','Поиск','Szukaj'],pdf:['PDF','PDF','PDF','PDF'],
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
    looseAttach:['Anhänge, Mail nicht zugeordnet','Attachments, email not matched','Вложения без письма','Załączniki bez wiadomości'],
    looseHint:['Diese Anhänge wurden vor .28 eingelesen und wissen nicht, zu welcher Mail sie gehören. Lies die E-Mail-Datei (.mbox/.eml) noch einmal ein, dann stehen sie unter ihrer Mail und ihr Original ist wieder da.','These attachments were added before .28 and do not know their email. Add the email file (.mbox/.eml) once more and they move under their email, with their original back.','Эти вложения добавлены до .28. Добавьте файл письма ещё раз — они встанут под своё письмо.','Te załączniki dodano przed .28. Dodaj plik e-maila ponownie, a trafią pod swoją wiadomość.'],
    noSubject:['(kein Betreff)','(no subject)','(без темы)','(bez tematu)'],from:['von','from','от','od'],
    files:['Dateien','files','файлов','plików'],oneFile:['Datei','file','файл','plik'],withFind:['mit Fund','with a finding','с находкой','ze znaleziskiem'],
    partlyShort:['teilweise geprüft','partly checked','частично','częściowo'],noOriginal:['Original fehlt','original missing','нет оригинала','brak oryginału'],
    openShort:['noch nicht geprüft','not checked yet','не проверено','niesprawdzone'],
    accessUnconfirmed:['Zugriff unbestätigt','access unconfirmed','доступ не подтверждён','dostęp niepotwierdzony'],
    collapseAll:['Alle zuklappen','Collapse all','Свернуть всё','Zwiń wszystko'],collapse:['Zuklappen','Collapse','Свернуть','Zwiń'],expand:['Aufklappen','Expand','Развернуть','Rozwiń'],
    hideTree:['Ordnerbaum ausblenden','Hide folder tree','Скрыть дерево папок','Ukryj drzewo folderów'],showTree:['Ordnerbaum zeigen','Show folder tree','Показать дерево папок','Pokaż drzewo folderów'],
    openFolder:['Ordner öffnen','Open folder','Открыть папку','Otwórz folder'],categoriesHead:['Kategorien','Categories','Категории','Kategorie'],uncategorized:['Ohne Kategorie','Uncategorized','Без категории','Bez kategorii'],categoryHelp:['Kategorieansicht. Die Dateien bleiben an ihrem bisherigen Ort.','Category view. Files stay in their existing locations.','Вид по категории. Файлы остаются на своих местах.','Widok kategorii. Pliki pozostają w dotychczasowych miejscach.'],topicsHead:['Kategorien (Vorschlag)','Categories (suggestion)','Категории (предложение)','Kategorie (propozycja)'],
    doneClose:['Hinweis schließen','Close note','Закрыть','Zamknij'],documents:['Dateien','Files','Файлы','Pliki'],stored:['lokal verknüpft','linked locally','локальные ссылки','powiązane lokalnie']
  };
  function text(key) { return (words[key] || [key])[Math.max(0,['de','en','ru','pl'].indexOf(document.documentElement.lang.slice(0,2)))] || key; }
  function controlText(node,value) {
    // A built Pro shell already has its stroke icon and visual caption. Keep
    // those nodes when translating the original accessible label.
    const label=node.querySelector(':scope>.compact-label')||node;
    if(label.textContent!==value)label.textContent=value;
  }
  const pages=new Set([...document.querySelectorAll('.tab[data-tab]')].map(t=>t.dataset.tab));
  function syncSearchWelcome(){
    const welcome=document.querySelector('#panel-search .search-welcome');
    const hidden=Boolean(el('q').value.trim());
    if(welcome&&welcome.hidden!==hidden)welcome.hidden=hidden;
  }
  // Dictation and saved searches also set the query without an input event.
  // Update the introduction before the existing result renderer starts work.
  const renderSearch=window.renderResults;
  if(typeof renderSearch==='function')window.renderResults=function(){syncSearchWelcome();return renderSearch.apply(this,arguments);};
  function syncNavigation(){
    syncSearchWelcome();
    const searching=el('panel-search').classList.contains('on'), key=searching?'search':'backSearch';
    const tab=document.querySelector('[data-tab="search"]');controlText(tab,text(key));
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
  let folderPath = '', library = null, ready = null, revealSelectedPath = true;
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
  // Keep app decoration separate from names. Native Pro replaces only these
  // explicit slots; the independent PWA keeps its original text fallback.
  function iconText(target,key,glyph,label){
    const slot=document.createElement('span');slot.className='workspace-icon';slot.dataset.pbIcon=key;slot.setAttribute('aria-hidden','true');slot.textContent=glyph;
    target.replaceChildren(slot,document.createTextNode(' '+label));
  }
  // Newest on top by default; ↕ turns any order around; the content switch also searches the file text.
  let explorerReverse=false;
  const orderBox=document.createElement('span');orderBox.className='explorer-order';
  const orderButton=document.createElement('button');orderButton.type='button';orderButton.className='ghost';orderButton.id='explorerOrder';
  const contentLabel=document.createElement('label');contentLabel.className='explorer-content';
  const contentBox=document.createElement('input');contentBox.type='checkbox';contentBox.id='explorerContent';
  const contentText=document.createElement('span');contentLabel.append(contentBox,contentText);orderBox.append(orderButton,contentLabel);
  el('explorerSort').after(orderBox);
  const typeOption=document.createElement('option');typeOption.value='type';typeOption.dataset.ws='byType';typeOption.textContent=text('byType');el('explorerSort').append(typeOption);
  if(!el('explorerSort').dataset.chosen)el('explorerSort').value='date';
  function orderLabel(){const k={name:'orderName',date:'orderDate',size:'orderSize',type:'orderType'}[el('explorerSort').value]||'orderDate';orderButton.textContent=text(k+(explorerReverse?'R':''));orderButton.setAttribute('aria-pressed',String(explorerReverse));iconText(contentText,'search','🔎',text('inContent').replace(/^🔎\s*/,''));}
  orderButton.onclick=()=>{explorerReverse=!explorerReverse;renderExplorer();};
  contentBox.onchange=()=>renderExplorer();
  function explorerState(){return {path:folderPath,filter:el('explorerFilter').value,sort:el('explorerSort').value,reverse:explorerReverse,content:contentBox.checked};}
  function restoreExplorer(state){
    folderPath=String(state?.path||'');el('explorerFilter').value=String(state?.filter||'');
    revealSelectedPath=true;
    el('explorerSort').value=['name','date','size','type'].includes(state?.sort)?state.sort:'date';
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
    folderPath=path;revealSelectedPath=true;if(clear)el('explorerFilter').value='';renderExplorer();
  }
  // What kind an entry is, so the explorer and the import note can say where a file is.
  const KINDS=[['mail','✉️'],['doc','📄'],['photo','🖼️'],['note','📝'],['attach','📎']];
  const kindIcon=k=>(KINDS.find(x=>x[0]===k)||KINDS[1])[1];
  const kindKey=k=>({mail:'mail',doc:'file',photo:'images',note:'note',attach:'attach'}[k]||'file');
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
      iconText(label,kindKey(key),icon,text('kind_'+key)+': '+(c.fresh+c.known)+(c.known?' ('+c.known+' '+text('doneKnown')+')':''));
      const go=button('→ '+text('showIn'),()=>showKind(key));go.dataset.show=key;
      line.append(label,go);box.append(line);
    }
    // 🛡 One line about the check of these files (native/native-check.js), with the way to the findings.
    const checked=window.PBCheck?.summary((list||[]).map(x=>x.hash).filter(Boolean));if(checked)box.append(checked);
    const close=button('✕',()=>{box.hidden=true;});close.className='ghost pb-import-close';close.title=close.ariaLabel=text('doneClose');
    box.append(close);
  }
  // ---------- folder tree like a real explorer (Klaus 2026-10-22: "Alle Dateien … dann geht ein Ordnerbaum auf.
  // Dann steht da drin Mails, Dokumente, Fotos … welche gespeicherten E-Mails? Was ist in welchen E-Mails?") ----------
  // Every file stands exactly once: mails by sender, attachments under the mail they came with (also those kept in
  // the storage folder from the mailbox), documents/photos/notes under the folder they came from. Nothing is moved.
  // Wide window: tree on the left (▸ ▾ open and close, ⊟ closes all, the tree can be hidden); narrow: one level at a
  // time with a path to tap and ← one level up (like OneDrive and the phone's own Files app).
  const TREE_OPEN='pb_explorer_open', TREE_HIDDEN='pb_explorer_tree_hidden', TOP=KINDS.filter(k=>k[0]!=='attach');
  const keep={get(k,d){try{const v=JSON.parse(localStorage.getItem(k)||'null');return v==null?d:v;}catch{return d;}},put(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch{}}};
  let openNodes=new Set(keep.get(TREE_OPEN,['',...TOP.map(k=>'kind:'+k[0])]));
  let treeHidden=keep.get(TREE_HIDDEN,false)===true;
  const saveOpen=()=>keep.put(TREE_OPEN,[...openNodes]);
  const tidy=s=>String(s||'').replace(/[<>\/]/g,' ').replace(/\s+/g,' ').trim();
  // Saved mails keep 60 characters of the sender in their path, attachments 40: both are cut at 40 first.
  const senderKey=raw=>{const s=tidy(String(raw||'').slice(0,40));return s==='?'?'':s.toLocaleLowerCase();};
  function buildModel(all){
    const nodes=new Map(), shown=new Map();
    const node=(path,label,parent,extra)=>{let n=nodes.get(path);if(!n){n={path,label,parent,kids:[],files:[],vault:[],...(extra||{})};nodes.set(path,n);if(parent!=null)nodes.get(parent).kids.push(n);}return n;};
    node('','📁 '+text('all'),null,{iconKey:'folder',glyph:'📁'});
    for(const [k,icon] of TOP)node('kind:'+k,icon+' '+text('kind_'+k),'',{kind:k,iconKey:kindKey(k),glyph:icon});
    const seen=new Set(),list=[];
    for(const e of all){if(seen.has(e.r.hash))continue;seen.add(e.r.hash);list.push(e);}
    const senderNode=(key,label)=>{if(!shown.has(key))shown.set(key,label);return node('mail:'+key,'👤 '+(key?shown.get(key):text('unknownSender')),'kind:mail',{sender:key,iconKey:'person',glyph:'👤'});};
    const mailsOf=new Map(), mailByHash=new Map();
    for(const e of list){if(!e.r.mail)continue;const seg=e.path.split('/')[1]||e.r.mail.from||'';const key=senderKey(seg);
      mailByHash.set(e.r.hash,{e,key});if(!mailsOf.has(key))mailsOf.set(key,[]);mailsOf.get(key).push(e);senderNode(key,tidy(String(seg).slice(0,40)));}
    const mailNode=(m)=>node('msg:'+m.e.r.hash,'✉️ '+m.e.r.name,'mail:'+m.key,{mail:m.e,iconKey:'mail',glyph:'✉️'});
    const attachTo=new Map();
    for(const e of list){
      const kind=kindOf(e.r,e.path);
      if(kind==='mail')continue;
      if(kind==='attach'){
        const seg=attachSender(e.path),key=senderKey(seg);
        let m=e.r.fromMail&&mailByHash.get(e.r.fromMail);
        if(!m&&(mailsOf.get(key)||[]).length===1)m=mailByHash.get(mailsOf.get(key)[0].r.hash);
        if(m){mailNode(m).files.push(e);continue;}
        senderNode(key,tidy(seg));node('loose:'+key,'📎 '+text('looseAttach'),'mail:'+key,{loose:true,iconKey:'attach',glyph:'📎'}).files.push(e);continue;
      }
      const dir=e.path.split('/').slice(0,-1);let parent='kind:'+kind;
      for(let i=0;i<dir.length;i++){const p='dir:'+kind+':'+dir.slice(0,i+1).join('/');node(p,'📁 '+dir[i],parent,{dir:true,iconKey:'folder',glyph:'📁'});parent=p;}
      nodes.get(parent).files.push(e);
    }
    // Attachments kept in the storage folder from mails opened in the mailbox (native/native-vault.js).
    const vault=window.PBExplorerExtra?.items?.()||[];
    for(const v of vault){
      const key=senderKey(String(v.from||'').replace(/[<>\/]/g,' ').trim());
      senderNode(key,tidy(String(v.from||'').slice(0,40)));
      const match=(mailsOf.get(key)||[]).find(e=>(e.r.mail.subject||e.r.name)===v.subject);
      const n=match?mailNode(mailByHash.get(match.r.hash)):node('pmsg:'+key+'|'+(v.subject||''),'✉️ '+(v.subject||text('noSubject')),'mail:'+key,{postbox:true,iconKey:'mail',glyph:'✉️'});
      n.vault.push(v);
    }
    for(const [key,ms] of mailsOf)for(const e of ms){const n=nodes.get('msg:'+e.r.hash);if(n)n.files.unshift(e);else nodes.get('mail:'+key).files.push(e);}
    // Counts and check state, from the bottom up.
    const stateOf=e=>window.PBCheck?.stateFor?PBCheck.stateFor(e.r):'open';
    const vaultState=v=>window.PBCheck?.vaultState?PBCheck.vaultState(v):'open';
    const tally=n=>{const t={n:0,found:0,partly:0,missing:0,open:0,clean:0,unconfirmed:0};
      for(const e of n.files){
        t.n++;const state=stateOf(e),availability=window.PBRecordStatus?.availability(e.r).key;
        if(state!=='missing'||!availability)t[state]=(t[state]||0)+1;
        // A saved check result does not prove that its original is still here.
        if(availability==='missing')t.missing++;
        else if(['unknown','unavailable','source'].includes(availability))t.unconfirmed++;
      }
      for(const v of n.vault){t.n++;t[vaultState(v)]=(t[vaultState(v)]||0)+1;}
      for(const k of n.kids){const s=tally(k);for(const x in s)t[x]=(t[x]||0)+s[x];}
      n.tally=t;return t;};
    tally(nodes.get(''));
    for(const n of nodes.values())n.kids.sort((a,b)=>(a.loose?1:0)-(b.loose?1:0)||(a.path.startsWith('mail:')&&!a.sender?1:0)-(b.path.startsWith('mail:')&&!b.sender?1:0)||a.label.localeCompare(b.label));
    return nodes;
  }
  function allFiles(n){const out={files:[...n.files],vault:[...n.vault]};for(const k of n.kids){const s=allFiles(k);out.files.push(...s.files);out.vault.push(...s.vault);}return out;}
  // Use the same unique records as the explorer tree, rather than counting
  // duplicate source locations as additional files in the overview.
  function categoryViews(all){
    const groups=new Map(),seen=new Set();
    for(const entry of all){
      if(seen.has(entry.r.hash))continue;seen.add(entry.r.hash);
      const category=String(entry.r.category||'');
      if(!groups.has(category))groups.set(category,[]);groups.get(category).push(entry);
    }
    return [...groups].map(([category,list])=>({key:'category:'+encodeURIComponent(category),label:category||text('uncategorized'),category:true,count:list.length,files:list,match:r=>String(r.category||'')===category})).sort((a,b)=>a.label.localeCompare(b.label));
  }
  function overviewSummary(){
    const nodes=buildModel(entries()),root=nodes.get(''),all=allFiles(root);
    const sizeOf=value=>Number.isSafeInteger(value)&&value>=0?value:null;
    function sum(files,vault=[]){
      let bytes=0,unknownSizes=0,localCount=0,localBytes=0,localUnknownSizes=0;
      for(const entry of files){
        const size=sizeOf(entry.r.size);
        if(size!==null&&Number.isSafeInteger(bytes+size))bytes+=size;else unknownSizes++;
        const local=window.PBOriginals?.statusFor?.(entry.r.hash)==='local'||(!window.PBOriginals?.statusFor&&window.PBOriginals?.stored?.has(entry.r.hash));
        if(local){localCount++;if(size!==null&&Number.isSafeInteger(localBytes+size))localBytes+=size;else localUnknownSizes++;}
      }
      for(const entry of vault){const size=sizeOf(entry.size);if(size!==null&&Number.isSafeInteger(bytes+size))bytes+=size;else unknownSizes++;}
      return {count:files.length+vault.length,knownBytes:bytes,unknownSizes,localCount,localBytes,localUnknownSizes};
    }
    const cleanLabel=node=>{const prefix=(node.glyph||'')+' ';return node.glyph&&node.label.startsWith(prefix)?node.label.slice(prefix.length):node.label;};
    const folders=[];
    const walk=(node,depth)=>{for(const child of node.kids){if(child.tally.n){const contents=allFiles(child);folders.push({path:child.path,parent:child.parent,label:cleanLabel(child),icon:child.iconKey||'folder',depth,...sum(contents.files,contents.vault)});walk(child,depth+1);}}};
    walk(root,0);
    const categories=categoryViews(all.files).map(view=>({path:view.key,label:view.label,...sum(view.files)}));
    const topics=(window.PBExplorerTopics?.views?.()||[]).map(view=>{
      const definition=window.PBExplorerTopics.DEFS?.find(item=>item.key===view.key),prefix=definition?.icon+' ';
      return {path:'topic:'+view.key,label:prefix&&view.label.startsWith(prefix)?view.label.slice(prefix.length):view.label,...sum(all.files.filter(entry=>view.match(entry.r)))};
    });
    const snapshot=window.PBOriginals?.snapshot?.();
    return {total:sum(all.files,all.vault),folders,categories,topics,originalsReady:snapshot?.ready===true,originalsError:snapshot?.error===true};
  }
  function tallyText(t){
    const P=window.PBCheck?.words||(k=>k);
    const parts=[t.n+' '+text(t.n===1?'oneFile':'files')];
    if(t.found)parts.push('⚠ '+t.found+' '+text('withFind'));
    if(t.partly)parts.push('◐ '+t.partly+' '+text('partlyShort'));
    if(t.missing)parts.push('⊘ '+t.missing+' '+text('noOriginal'));
    if(t.unconfirmed)parts.push('○ '+t.unconfirmed+' '+text('accessUnconfirmed'));
    if(t.open)parts.push('○ '+t.open+' '+text('openShort'));
    return parts.join(' · ');
  }
  // Old saved places ("Mail/…", "kind:attach", the storage folder) open the nearest new folder.
  function resolvePath(nodes,path){
    if(nodes.has(path))return path;
    if(path===':mail-attachments'||path==='kind:attach'||path==='Mail'||path==='Mail-Anhang')return 'kind:mail';
    return '';
  }
  function chain(nodes,path){const out=[];for(let n=nodes.get(path);n;n=n.parent==null?null:nodes.get(n.parent))out.unshift(n);return out;}
  function nodeLabel(target,n,suffix=''){
    const prefix=n.glyph+' ',label=n.label.startsWith(prefix)?n.label.slice(prefix.length):n.label;
    iconText(target,n.iconKey||'folder',n.glyph||'📁',label+suffix);
  }
  function crumbs(nodes,path){
    const box=el('explorerPath');box.replaceChildren();
    const parts=chain(nodes,path);
    parts.forEach((n,i)=>{
      if(i){const s=document.createElement('span');s.className='explorer-crumb-sep';s.textContent=' › ';box.append(s);}
      if(i===parts.length-1){const s=document.createElement('span');s.className='explorer-crumb-here';nodeLabel(s,n);box.append(s);}
      else{const b=button('',()=>openFolder(n.path));nodeLabel(b,n);b.className='ghost explorer-crumb';box.append(b);}
    });
  }
  function treeView(nodes,tree){
    const head=document.createElement('div');head.className='explorer-tree-tools';
    const collapse=button('⊟',()=>{openNodes=new Set(['']);saveOpen();renderExplorer();});
    collapse.className='ghost explorer-collapse';collapse.title=collapse.ariaLabel=text('collapseAll');
    head.append(collapse);tree.append(head);
    const walk=(n,depth)=>{
      const row=document.createElement('div');row.className='explorer-node';row.style.setProperty('--depth',String(depth));
      const isOpen=openNodes.has(n.path);
      if(n.kids.length){const tw=button(isOpen?'▾':'▸',()=>{isOpen?openNodes.delete(n.path):openNodes.add(n.path);saveOpen();renderExplorer();});
        tw.className='ghost explorer-twisty';tw.dataset.toggle=n.path;tw.setAttribute('aria-expanded',String(isOpen));tw.title=tw.ariaLabel=text(isOpen?'collapse':'expand');row.append(tw);}
      else{const sp=document.createElement('span');sp.className='explorer-twisty-space';row.append(sp);}
      const b=button('',()=>{openNodes.add(n.path);saveOpen();openFolder(n.path);});nodeLabel(b,n,n.path?' ('+n.tally.n+')':'');
      b.dataset.path=n.path;b.classList.add('explorer-folder');if(n.kind)b.dataset.kind=n.kind;
      if(n.tally.found)b.dataset.found=String(n.tally.found);
      b.setAttribute('aria-current',n.path===folderPath?'location':'false');b.title=tallyText(n.tally);
      row.append(b);tree.append(row);
      if(isOpen)for(const k of n.kids)if(k.tally.n)walk(k,depth+1);
    };
    walk(nodes.get(''),0);
  }
  // Keys: ← closes or goes to the parent, → opens, Enter shows the folder (DeX keyboard).
  el('explorerTree').addEventListener('keydown',ev=>{
    const b=ev.target.closest?.('button.explorer-folder');if(!b)return;
    const p=b.dataset.path,tw=b.parentElement.querySelector('.explorer-twisty');
    if(ev.key==='ArrowRight'&&tw&&!openNodes.has(p)){openNodes.add(p);saveOpen();renderExplorer();ev.preventDefault();}
    else if(ev.key==='ArrowLeft'&&openNodes.has(p)&&tw){openNodes.delete(p);saveOpen();renderExplorer();ev.preventDefault();}
    else return;
    el('explorerTree').querySelector(`button.explorer-folder[data-path="${CSS.escape(p)}"]`)?.focus();
  });
  function folderRow(n){
    const row=document.createElement('article');row.className='explorer-dir';row.dataset.path=n.path;if(n.tally.found)row.dataset.found='1';
    const info=document.createElement('div'),name=document.createElement('strong'),meta=document.createElement('div');
    nodeLabel(name,n);meta.className='explorer-meta';meta.textContent=tallyText(n.tally);
    info.append(name,meta);
    const go=button('›',()=>{openNodes.add(n.path);saveOpen();openFolder(n.path);});go.className='ghost explorer-dir-open';go.title=go.ariaLabel=text('openFolder');
    row.append(info,go);row.onclick=ev=>{if(ev.target===row||info.contains(ev.target))go.click();};
    return row;
  }
  function fileRow(e,view){
    const row=document.createElement('article');row.className='explorer-row';row.dataset.hash=e.r.hash;
    const info=document.createElement('div'), name=document.createElement('strong'), meta=document.createElement('div');
    const kind=kindOf(e.r,e.path),sender=kind==='attach'?attachSender(e.path):'';row.dataset.kind=kind;
    iconText(name,kindKey(kind),kindIcon(kind),e.dirId && !e.r.mail?e.path.split('/').pop():e.r.name);meta.className='explorer-meta';
    const date=e.r.date?new Date(e.r.date).toLocaleDateString(document.documentElement.lang):'';
    const where=window.PBRecordStatus?'':window.PBOriginals?.stored.has(e.r.hash)?PBOriginals.label():e.dirId?text('local'):SESSION_FILES.has(e.r.hash)?text('session'):text('catalog');
    const from=kind==='attach'?'📎 '+text('fromMail')+' '+senderLabel(sender).slice(3):kind==='mail'?text('from')+' '+tidy(e.r.mail?.from||e.path.split('/')[1]||'?'):'';
    meta.textContent=[from,kind==='mail'||kind==='attach'?'':e.path.split('/').slice(0,-1).join('/'),fmtKB(e.r.size||0),date,where].filter(Boolean).join(' · ');
    info.append(name,meta);row.append(info,button(text('open'),()=>openEntry(e)));if(view&&!view.category)row.append(window.PBExplorerTopics.rowTool(e.r,view.key));
    return row;
  }
  let lastModel=null,currentView=null;
  // Klaus 2026-10-26 (Sitzung 2, Punkt 3): the explorer's choice of view also offers „PDF“; nothing is moved.
  const isPdf=r=>/\.pdf$/i.test(String(r.name||''))||String(r.type||'')==='application/pdf'||String(r.ext||'').replace(/^\./,'').toLowerCase()==='pdf';
  const PDF_VIEW={key:'type:pdf',get label(){return text('pdf');},category:true,filetype:true,match:r=>!r.mail&&isPdf(r)};
  // Everything, the kinds and PDF with their counts, and what is shown right now (for the choice in the toolbar).
  function explorerSections(){
    const all=entries(),nodes=lastModel||buildModel(all),seen=new Set();
    const pdf=all.filter(e=>!seen.has(e.r.hash)&&seen.add(e.r.hash)&&PDF_VIEW.match(e.r)).length;
    const kind=k=>({path:'kind:'+k,key:k,label:text('kind_'+k),count:nodes.get('kind:'+k)?.tally?.n||0});
    return [{path:'',key:'all',label:text('all'),count:nodes.get('')?.tally?.n||0},kind('mail'),{path:PDF_VIEW.key,key:'pdf',label:text('pdf'),count:pdf},kind('doc'),kind('photo'),kind('note')];
  }
  function explorerSection(){
    if(currentView)return {path:folderPath,key:currentView===PDF_VIEW?'pdf':'view',label:currentView.label,deep:false};
    const top=lastModel?chain(lastModel,folderPath)[1]:null;
    return top?.kind?{path:top.path,key:top.kind,label:text('kind_'+top.kind),deep:top.path!==folderPath}:{path:'',key:'all',label:text('all'),deep:false};
  }
  // A view (category, PDF) keeps a way back over the path: „Alle Dateien › PDF“.
  function viewCrumbs(nodes,label){
    const box=el('explorerPath'),back=button('',()=>openFolder(''));nodeLabel(back,nodes.get(''));back.className='ghost explorer-crumb';
    const sep=document.createElement('span');sep.className='explorer-crumb-sep';sep.textContent=' › ';
    const here=document.createElement('span');here.className='explorer-crumb-here';here.textContent=label;
    box.replaceChildren(back,sep,here);
  }
  function renderExplorer() {
    const all=entries(), tree=el('explorerTree'), files=el('explorerFiles');
    tree.replaceChildren(); files.replaceChildren();
    const nodes=buildModel(all);lastModel=nodes;
    const topics=window.PBExplorerTopics, views=topics?.views()||[], categories=categoryViews(all);
    const view=folderPath===PDF_VIEW.key?PDF_VIEW:folderPath.startsWith('topic:')?views.find(v=>'topic:'+v.key===folderPath):categories.find(v=>v.key===folderPath)||null;currentView=view||null;
    if(!view){const real=resolvePath(nodes,folderPath);if(real!==folderPath){folderPath=real;revealSelectedPath=true;}}
    const here=view?null:nodes.get(folderPath);
    if(here&&revealSelectedPath)for(const n of chain(nodes,folderPath))openNodes.add(n.path);
    revealSelectedPath=false;
    treeView(nodes,tree);
    // The existing catalog categories are direct explorer views as well.
    if(categories.length)tree.append(heading(text('categoriesHead')));
    for(const category of categories){const b=button('',()=>openFolder(category.key));iconText(b,'folder','📁',category.label+' ('+category.count+')');b.dataset.category=category.key;b.setAttribute('aria-current',folderPath===category.key?'location':'false');tree.append(b);}
    // Categories (native): views over the catalog, nothing is moved. Path "topic:<key>".
    if(views.length)tree.append(heading(text('topicsHead')));
    for(const v of views){const b=button(v.label+' ('+v.count+')',()=>openFolder('topic:'+v.key));b.dataset.topic=v.key;b.setAttribute('aria-current',folderPath==='topic:'+v.key?'location':'false');tree.append(b);}
    el('panel-explorer').classList.toggle('explorer-tree-hidden',treeHidden);
    let toggle=el('explorerTreeToggle');
    if(!toggle){toggle=button('',()=>{treeHidden=!treeHidden;keep.put(TREE_HIDDEN,treeHidden);renderExplorer();});toggle.id='explorerTreeToggle';el('explorerHome').after(toggle);}
    toggle.textContent=treeHidden?'◧':'◨';toggle.title=toggle.ariaLabel=text(treeHidden?'showTree':'hideTree');toggle.setAttribute('aria-pressed',String(!treeHidden));
    if(view)viewCrumbs(nodes,view.label);else crumbs(nodes,folderPath);
    el('explorerUp').disabled=!folderPath;
    orderLabel();
    if(!folderPath)topics?.notice(files);
    if(view&&!view.category)topics.head(files,view.key);
    else if(view&&!view.filetype){const help=document.createElement('p');help.className='hint';help.textContent=text('categoryHelp');files.append(help);}
    const words=foldText(el('explorerFilter').value).split(/\s+/).filter(Boolean);
    const sort=el('explorerSort').value, flip=explorerReverse?-1:1;
    const typeKey=r=>String(r.ext||String(r.name||'').match(/\.([^./]+)$/)?.[1]||r.type||'').replace(/^\./,'').trim().toLocaleLowerCase();
    const order=(a,b)=>flip*(sort==='date'?(b.r.date||0)-(a.r.date||0):sort==='size'?(b.r.size||0)-(a.r.size||0):sort==='type'?(typeKey(a.r).localeCompare(typeKey(b.r))||a.r.name.localeCompare(b.r.name)):a.r.name.localeCompare(b.r.name));
    const extra=window.PBExplorerExtra;
    if(here?.kind==='mail')extra?.head?.(files);
    // "Alle Dateien" holds everything; a search looks through the whole folder below; otherwise one level.
    let list, vaultList=[];
    if(view){const seen=new Set();list=all.filter(e=>!seen.has(e.r.hash)&&seen.add(e.r.hash)&&view.match(e.r)&&explorerMatch(e,words));}
    else if(!folderPath||words.length){const a=allFiles(here);list=a.files.filter(e=>explorerMatch(e,words));
      const needle=foldText(el('explorerFilter').value);vaultList=a.vault.filter(v=>!needle||foldText(v.name+' '+(v.subject||'')+' '+(v.from||'')).includes(needle));}
    else{list=[...here.files];vaultList=[...here.vault];}
    if(!view&&!words.length)for(const k of here.kids)if(k.tally.n)files.append(folderRow(k));
    if(here?.mail){list=list.filter(e=>e!==here.mail);files.append(fileRow(here.mail,null));}
    list.sort(order);
    for(const e of list)files.append(fileRow(e,view));
    if(extra?.row)for(const v of vaultList.sort((a,b)=>(Number(b.date)||b.stored||0)-(Number(a.date)||a.stored||0)))files.append(extra.row(v));
    if(here?.kind==='mail')extra?.lockedRow?.(files);
    if(here?.loose)files.append(Object.assign(document.createElement('p'),{className:'hint explorer-loose-hint',textContent:text('looseHint')}));
    if(!files.querySelector('.explorer-row,.explorer-dir,.native-vault-row,.native-vault-locked')){const p=document.createElement('p');p.className='explorer-empty';p.textContent=text('empty');files.append(p);}
  }
  function refresh() {
    if(library && !DIR_HANDLES.has(libraryId)) {library=null;localStorage.setItem('pb_library_enabled','0');}
    for (const node of document.querySelectorAll('[data-ws]')) controlText(node,text(node.dataset.ws));
    el('explorerFilter').placeholder=text('filterShort');el('explorerFilter').setAttribute('aria-label',text('filter'));
    syncNavigation();
    el('chooseLibrary').disabled=!window.showDirectoryPicker || signing;
    el('pauseLibrary').disabled=!library || signing;
    el('pickDir').textContent=text(library?'copyFolder':'linkFolder');
    el('pickDir').title=text(library?'copyFolder':'linkFolder');
    if(!window.PBFolders)el('libraryStatus').textContent=library?text('active')+': '+library.name:window.showDirectoryPicker?text('noFolder'):text('unsupported');
    el('searchMailCount').textContent=CATALOG.filter(r=>r.mail).length+' '+text('emails');
    el('searchDocCount').textContent=CATALOG.filter(r=>!r.mail).length+' '+text('documents');
    el('searchLocalCount').textContent=entries().filter(e=>e.dirId || SESSION_FILES.has(e.r.hash) || window.PBOriginals?.stored.has(e.r.hash)).length+' '+text('stored');
    renderExplorer();
    window.PBOriginals?.notice();
    window.dispatchEvent(new Event('pb-workspace-refresh'));
  }
  el('chooseLibrary').onclick=chooseLibrary;
  el('pauseLibrary').onclick=()=>{if(signing)return;library=null;localStorage.setItem('pb_library_enabled','0');refresh();};
  el('explorerFilter').oninput=renderExplorer;el('explorerSort').onchange=()=>{el('explorerSort').dataset.chosen='1';explorerReverse=false;renderExplorer();};
  el('explorerHome').onclick=()=>openFolder('',{clear:true});
  el('explorerUp').onclick=()=>openFolder(folderPath.startsWith('topic:')?'':lastModel?.get(folderPath)?.parent??'');
  new MutationObserver(refresh).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  new MutationObserver(syncNavigation).observe(el('panel-search'),{attributes:true,attributeFilter:['class']});
  window.addEventListener('popstate',()=>navigate(location.hash.slice(1)||'search',{record:false}));
  window.addEventListener('hashchange',()=>navigate(location.hash.slice(1)||'search',{record:false}));
  window.addEventListener('pb-originals-change',refresh);
  window.PBWorkspace={prepareImport,storeItem,refresh,navigate,explorerState,restoreExplorer,kindOf,importSummary,showKind,explorerSections,explorerSection,overview:overviewSummary};
  navigate(location.hash.slice(1)||'search',{replace:true});
  const wait=setInterval(()=>{if(db){clearInterval(wait);ready=restore().catch(()=>refresh());}},50);
  refresh();
})();
