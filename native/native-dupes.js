/* Physical duplicate cleanup uses a fresh writable SAF selection, never catalog paths. */
(() => {
  'use strict';
  const panel=document.getElementById('panel-dupes');if(!panel)return;
  const api=window.Capacitor?.Plugins?.ProDuplicates;
  const supported=typeof api?.chooseFolder==='function'&&typeof api?.deleteSelected==='function';
  const words={
    de:{title:'Doppelte Dateien',choose:'Ordner prüfen',again:'Anderen Ordner prüfen',help:'Hilfe zur Ordnerbereinigung',info:'Wähle einen Ordner mit Lese- und Schreibzugriff. Nur identische Dateiinhalte werden zusammengefasst. Gelöscht wird erst nach deiner Auswahl und Bestätigung; mindestens eine erneut geprüfte Kopie je Gruppe bleibt erhalten. App-Originale und Katalogverweise werden dadurch nicht entfernt.',limits:'Pro Prüfung: bis zu 2.000 Dateien, 80 MiB je Datei, 512 MiB insgesamt und 8 Unterordnerebenen. Übersprungene oder unlesbare Bereiche bleiben ausdrücklich ungeprüft.',unsupported:'Die Ordnerbereinigung ist in dieser Ausgabe nicht verfügbar.',catalog:'Katalogverweise',catalogInfo:'Gespeicherte Verweise bereinigen. Diese Aktion löscht keine Dateien vom Gerät.',catalogRemove:'Verweise entfernen',extra:'Alle außer je einer auswählen',clear:'Auswahl leeren',remove:'Ausgewählte Dateien löschen',cancel:'Abbrechen',scan:'Dateien werden geprüft',deleting:'Auswahl wird geprüft und gelöscht',files:'Dateien',checked:'geprüft',skipped:'übersprungen',incomplete:'Prüfung unvollständig',cancelled:'Abgebrochen',empty:'Keine doppelten Dateien im geprüften Bereich.',selected:'ausgewählt',keeper:'Mindestens eine Kopie bleibt erhalten.',review:'Dateien wirklich löschen?',reviewInfo:'Diese ausgewählten Dateien werden im freigegebenen Ordner gelöscht. Mindestens eine erneut geprüfte Kopie je Gruppe bleibt erhalten.',confirm:'Dateien löschen',removed:'Dateien entfernt',failed:'Löschung nicht bestätigt',error:'Ordner konnte nicht geprüft oder bereinigt werden. Wähle ihn erneut und prüfe den Zugriff.',changed:'Einige Löschungen konnten nicht bestätigt werden. Dateien können geändert, nicht erreichbar oder nicht beschreibbar sein. Prüfe den Ordner erneut.',noSelection:'Wähle die zu löschenden Kopien aus.',copies:'identische Kopien',progress:'Fortschritt'},
    en:{title:'Duplicate files',choose:'Check folder',again:'Check another folder',help:'Folder cleanup help',info:'Choose a folder with read and write access. Only identical file contents are grouped. Files are deleted only after your selection and confirmation; at least one freshly verified copy in each group remains. App originals and catalog references are kept.',limits:'Each check covers up to 2,000 files, 80 MiB per file, 512 MiB total and 8 subfolder levels. Skipped or unreadable areas remain unchecked.',unsupported:'Folder cleanup is unavailable in this edition.',catalog:'Catalog references',catalogInfo:'Clean up saved references. This action does not delete files from the device.',catalogRemove:'Remove references',extra:'Select all except one per group',clear:'Clear selection',remove:'Delete selected files',cancel:'Cancel',scan:'Checking files',deleting:'Verifying and deleting selection',files:'files',checked:'checked',skipped:'skipped',incomplete:'Check incomplete',cancelled:'Cancelled',empty:'No duplicate files in the checked area.',selected:'selected',keeper:'At least one copy is kept.',review:'Delete these files?',reviewInfo:'These selected files will be deleted from the permitted folder. At least one freshly verified copy in each group remains.',confirm:'Delete files',removed:'files removed',failed:'deletion unconfirmed',error:'Unable to check or clean up the folder. Select it again and check access.',changed:'Some deletions could not be confirmed. Files may have changed or be unavailable or read only. Check the folder again.',noSelection:'Select copies to delete.',copies:'identical copies',progress:'Progress'},
    ru:{title:'Дубликаты файлов',choose:'Проверить папку',again:'Проверить другую папку',help:'Справка по очистке папки',info:'Выберите папку с доступом для чтения и записи. Группируются только одинаковые данные. Удаление выполняется после выбора и подтверждения; в каждой группе остаётся хотя бы одна заново проверенная копия. Оригиналы приложения и ссылки каталога сохраняются.',limits:'Одна проверка: до 2000 файлов, 80 МиБ на файл, 512 МиБ всего и 8 уровней папок. Пропущенные и недоступные области остаются непроверенными.',unsupported:'В этой версии очистка папки недоступна.',catalog:'Ссылки каталога',catalogInfo:'Удаление сохранённых ссылок. Файлы на устройстве не удаляются.',catalogRemove:'Удалить ссылки',extra:'Выбрать все, кроме одной копии',clear:'Снять выбор',remove:'Удалить выбранные файлы',cancel:'Отмена',scan:'Проверка файлов',deleting:'Проверка и удаление выбранного',files:'файлов',checked:'проверено',skipped:'пропущено',incomplete:'Проверка неполная',cancelled:'Отменено',empty:'В проверенной области дубликатов нет.',selected:'выбрано',keeper:'Хотя бы одна копия сохраняется.',review:'Удалить эти файлы?',reviewInfo:'Выбранные файлы будут удалены из разрешённой папки. В каждой группе останется хотя бы одна заново проверенная копия.',confirm:'Удалить файлы',removed:'файлов удалено',failed:'удаление не подтверждено',error:'Не удалось проверить или очистить папку. Выберите её снова и проверьте доступ.',changed:'Часть файлов удалить не удалось. Возможно, они изменены, недоступны или защищены от записи. Проверьте папку снова.',noSelection:'Выберите копии для удаления.',copies:'одинаковых копий',progress:'Ход проверки'},
    pl:{title:'Duplikaty plików',choose:'Sprawdź folder',again:'Sprawdź inny folder',help:'Pomoc oczyszczania folderu',info:'Wybierz folder z prawem odczytu i zapisu. Grupowane są tylko identyczne treści plików. Usunięcie nastąpi po wyborze i potwierdzeniu; w każdej grupie zostanie co najmniej jedna ponownie sprawdzona kopia. Oryginały aplikacji i odwołania katalogu pozostają.',limits:'Jedna kontrola: do 2000 plików, 80 MiB na plik, 512 MiB łącznie i 8 poziomów podfolderów. Pominięte i nieczytelne obszary pozostają niesprawdzone.',unsupported:'Oczyszczanie folderu jest niedostępne w tej wersji.',catalog:'Odwołania katalogu',catalogInfo:'Usuwanie zapisanych odwołań. Ta czynność nie usuwa plików z urządzenia.',catalogRemove:'Usuń odwołania',extra:'Wybierz wszystkie oprócz jednej kopii',clear:'Wyczyść wybór',remove:'Usuń wybrane pliki',cancel:'Anuluj',scan:'Sprawdzanie plików',deleting:'Sprawdzanie i usuwanie wyboru',files:'plików',checked:'sprawdzono',skipped:'pominięto',incomplete:'Kontrola niepełna',cancelled:'Anulowano',empty:'Brak duplikatów w sprawdzonym obszarze.',selected:'wybrano',keeper:'Co najmniej jedna kopia pozostaje.',review:'Usunąć te pliki?',reviewInfo:'Wybrane pliki zostaną usunięte z udostępnionego folderu. W każdej grupie pozostanie co najmniej jedna ponownie sprawdzona kopia.',confirm:'Usuń pliki',removed:'plików usunięto',failed:'usunięcie niepotwierdzone',error:'Nie można sprawdzić lub oczyścić folderu. Wybierz go ponownie i sprawdź dostęp.',changed:'Niektórych plików nie można usunąć. Mogły się zmienić, być niedostępne lub tylko do odczytu. Sprawdź folder ponownie.',noSelection:'Wybierz kopie do usunięcia.',copies:'identycznych kopii',progress:'Postęp'}
  };
  const t=key=>(words[document.documentElement.lang]||words.de)[key];
  const make=(tag,cls)=>{const e=document.createElement(tag);if(cls)e.className=cls;return e;};
  const number=n=>Number.isFinite(n)&&n>=0?n:0;
  const bytes=n=>{n=number(n);return n<1024?n+' B':n<1048576?(n/1024).toFixed(1)+' KiB':(n/1048576).toFixed(1)+' MiB';};
  const catalog=make('details','pb-dup-catalog'),catalogTitle=make('summary');catalog.id='pbDuplicateCatalog';catalog.append(catalogTitle);
  // Uncertain mail pairs require a visible reconciliation decision, not catalog cleanup.
  const mailReview=panel.querySelector(':scope>#pb-mail-dupes');mailReview?.remove();
  const catalogBody=make('div','pb-dup-catalog-body');while(panel.firstChild)catalogBody.append(panel.firstChild);catalog.append(catalogBody);
  const card=make('section','pb-dup-physical');card.id='pbDuplicateCleanup';
  const heading=make('div','pb-dup-heading'),title=make('h2'),help=make('details','pb-dup-help'),helpTitle=make('summary'),info=make('p'),limits=make('p');helpTitle.append(window.PBIcons?.create('info')||document.createTextNode('i'));help.append(helpTitle,info,limits);heading.append(title,help);
  const actions=make('div','pb-dup-actions'),choose=make('button','primary'),cancel=make('button','ghost');choose.id='pbDupChoose';cancel.id='pbDupCancel';choose.type=cancel.type='button';actions.append(choose,cancel);
  const status=make('p','pb-dup-status');status.id='pbDupStatus';status.setAttribute('role','status');status.setAttribute('aria-live','polite');
  const list=make('div','pb-dup-groups');list.id='pbDupGroups';
  const selection=make('div','pb-dup-actions pb-dup-selection'),extra=make('button','ghost'),clear=make('button','ghost'),remove=make('button','pb-dup-danger'),selectedLabel=make('span','pb-dup-selected');extra.id='pbDupExtra';clear.id='pbDupClear';remove.id='pbDupDelete';extra.type=clear.type=remove.type='button';selection.append(extra,clear,selectedLabel,remove);
  card.append(heading,actions,status,list,selection);panel.append(card,catalog);if(mailReview)panel.append(mailReview);
  let scan=null,selected=new Set(),busy=false,phase='',note='',pollTimer=null,polling=false,lastProgress=null;
  const groups=()=>scan?.groups||[];
  const copies=()=>groups().flatMap(group=>group.copies);
  function progressText(p){
    if(phase==='delete')return t('deleting')+' · '+t('removed')+': '+number(p?.deletedFiles);
    const counts=number(p?.scannedFiles)+' '+t('files')+' '+t('checked')+' · '+bytes(p?.scannedBytes);
    return t('scan')+' · '+counts;
  }
  function updateSelection(){
    const all=copies(),chosen=all.filter(copy=>selected.has(copy.id)),total=chosen.reduce((n,copy)=>n+copy.size,0);
    selectedLabel.textContent=chosen.length+' '+t('selected')+' · '+bytes(total);
    remove.disabled=busy||!chosen.length;clear.disabled=busy||!chosen.length;extra.disabled=busy||!groups().length;
    selection.hidden=!groups().length;
    list.querySelectorAll('input[type=checkbox]').forEach(check=>{
      const group=groups().find(g=>g.copies.some(c=>c.id===check.dataset.id));
      const count=group?.copies.filter(c=>selected.has(c.id)).length||0;
      const copy=group.copies.find(c=>c.id===check.dataset.id);
      check.checked=selected.has(check.dataset.id);check.disabled=busy||copy.deletable===false||(!check.checked&&count>=group.copies.length-1);
    });
  }
  function render(){
    title.textContent=t('title');info.textContent=t('info');limits.textContent=t('limits');helpTitle.setAttribute('aria-label',t('help'));helpTitle.title=t('help');catalogTitle.textContent=t('catalog');
    const oldInfo=catalogBody.querySelector(':scope > p');if(oldInfo)oldInfo.textContent=t('catalogInfo');
    const oldRemove=document.getElementById('dupRemove');if(oldRemove)oldRemove.textContent=t('catalogRemove');
    choose.textContent=scan?t('again'):t('choose');choose.disabled=busy;choose.hidden=!supported;cancel.textContent=t('cancel');cancel.hidden=!busy;cancel.disabled=false;
    extra.textContent=t('extra');clear.textContent=t('clear');remove.textContent=t('remove');
    status.classList.toggle('pb-dup-waiting',busy);status.textContent=!supported?t('unsupported'):busy?progressText(lastProgress):note;
    list.replaceChildren();
    for(const group of groups()){
      const section=make('section','pb-dup-group'),label=make('h3');label.textContent=group.copies.length+' '+t('copies')+' · '+bytes(group.size);section.append(label);
      for(const copy of group.copies){
        const row=make('label','pb-dup-copy'),check=make('input'),text=make('span','pb-dup-copy-text'),name=make('strong'),path=make('span');check.type='checkbox';check.dataset.id=copy.id;name.textContent=copy.name;path.textContent=copy.path;check.setAttribute('aria-label',copy.path);
        check.addEventListener('change',()=>{if(check.checked)selected.add(copy.id);else selected.delete(copy.id);updateSelection();});text.append(name,path);row.append(check,text);section.append(row);
      }
      const keep=make('p','pb-dup-keeper');keep.textContent=t('keeper');section.append(keep);list.append(section);
    }
    if(scan&&!groups().length){const empty=make('p','pb-dup-empty');empty.textContent=t('empty');list.append(empty);}
    updateSelection();
  }
  function stopPolling(){if(pollTimer)clearInterval(pollTimer);pollTimer=null;}
  function startPolling(){
    stopPolling();lastProgress=null;
    const tick=async()=>{if(polling||!busy||typeof api.progress!=='function')return;polling=true;try{lastProgress=await api.progress();if(busy)status.textContent=progressText(lastProgress);}catch{}finally{polling=false;}};
    pollTimer=setInterval(tick,400);tick();
  }
  function acceptScan(value){
    if(!value||typeof value.session!=='string'||!Array.isArray(value.groups))throw new Error('Invalid scan');
    const seen=new Set();
    for(const group of value.groups){
      if(!Array.isArray(group.copies)||group.copies.length<2||!Number.isSafeInteger(group.size)||group.size<0)throw new Error('Invalid copies');
      for(const copy of group.copies){if(typeof copy.id!=='string'||!copy.id||seen.has(copy.id)||typeof copy.name!=='string'||typeof copy.path!=='string'||!Number.isSafeInteger(copy.size)||copy.size!==group.size)throw new Error('Invalid copy');seen.add(copy.id);}
    }
    return value;
  }
  choose.addEventListener('click',async()=>{
    if(busy||!supported)return;busy=true;phase='scan';note='';selected.clear();scan=null;render();startPolling();
    try{
      const value=await api.chooseFolder();
      if(value?.cancelled&&!Array.isArray(value.groups)){note=t('cancelled');return;}
      scan=acceptScan(value);
      const partial=Boolean(scan.partial||scan.cancelled||number(scan.skippedFiles)||(Array.isArray(scan.errors)&&scan.errors.length));
      note=(scan.cancelled?t('cancelled')+' · ':'')+(partial?t('incomplete')+' · ':'')+number(scan.scannedFiles)+' '+t('files')+' '+t('checked')+' · '+bytes(scan.scannedBytes)+(number(scan.skippedFiles)?' · '+number(scan.skippedFiles)+' '+t('skipped'):'');
    }catch{note=t('error');scan=null;}
    finally{busy=false;stopPolling();render();}
  });
  cancel.addEventListener('click',async()=>{if(!busy)return;cancel.disabled=true;try{await api.cancel();}catch{};});
  extra.addEventListener('click',()=>{if(busy)return;selected.clear();for(const group of groups()){const keeper=group.copies.find(copy=>copy.deletable===false)||group.copies[0];for(const copy of group.copies)if(copy!==keeper&&copy.deletable!==false)selected.add(copy.id);}updateSelection();});
  clear.addEventListener('click',()=>{selected.clear();updateSelection();});
  function review(chosen){
    return new Promise(resolve=>{
      const dialog=make('dialog','live-dialog pb-dup-review'),h=make('h2'),p=make('p'),summary=make('strong'),ul=make('ul'),buttons=make('div','pb-dup-actions'),back=make('button','ghost'),confirm=make('button','pb-dup-danger');dialog.id='pbDupReview';h.textContent=t('review');p.textContent=t('reviewInfo');summary.textContent=chosen.length+' '+t('files')+' · '+bytes(chosen.reduce((n,c)=>n+c.size,0));
      for(const copy of chosen){const li=make('li');li.textContent=copy.path+' · '+bytes(copy.size);ul.append(li);}
      h.id='pbDupReviewTitle';p.id='pbDupReviewInfo';dialog.setAttribute('aria-labelledby',h.id);dialog.setAttribute('aria-describedby',p.id);
      back.type=confirm.type='button';back.textContent=t('cancel');confirm.textContent=t('confirm');confirm.id='pbDupConfirm';let accepted=false;
      back.onclick=()=>dialog.close();confirm.onclick=()=>{accepted=true;dialog.close();};buttons.append(back,confirm);dialog.append(h,p,summary,ul,buttons);document.body.append(dialog);
      dialog.addEventListener('close',()=>{dialog.remove();resolve(accepted);},{once:true});dialog.showModal();back.focus();
    });
  }
  remove.addEventListener('click',async()=>{
    if(busy||!scan)return;const chosen=copies().filter(c=>selected.has(c.id));if(!chosen.length){note=t('noSelection');render();return;}
    if(!await review(chosen))return;
    busy=true;phase='delete';note='';render();startPolling();
    try{
      const result=await api.deleteSelected({session:scan.session,ids:chosen.map(c=>c.id),confirmed:true});
      if(!Array.isArray(result?.deleted)||!Array.isArray(result?.failures))throw new Error('Invalid deletion result');
      const allowed=new Set(chosen.map(c=>c.id)),deleted=new Set(result.deleted.filter(c=>allowed.has(c.id)).map(c=>c.id));
      const removedBytes=chosen.filter(c=>deleted.has(c.id)).reduce((n,c)=>n+c.size,0);
      scan.groups=groups().map(group=>({...group,copies:group.copies.filter(c=>!deleted.has(c.id))})).filter(group=>group.copies.length>1);
      const failed=chosen.length-deleted.size;
      note=(result.cancelled?t('cancelled')+' · ':'')+t('removed')+': '+deleted.size+' · '+bytes(removedBytes)+(failed?' · '+t('failed')+': '+failed+'. '+t('changed'):'');
      selected.clear();
    }catch{note=t('error');selected.clear();}
    finally{busy=false;stopPolling();render();}
  });
  new MutationObserver(()=>render()).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  window.PBDuplicates={refresh:render};render();
})();
