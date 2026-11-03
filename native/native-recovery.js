/* Explicit Android document export for the legacy catalog vault's five recovery shares. */
(() => {
  'use strict';
  const words={
    scope:['Diese Ersatzschlüssel gelten nur für diesen Tresor, nicht für das Passwort des verschlüsselten Speicherorts.','These recovery keys apply only to this vault, not to the encrypted storage location password.','Эти ключи относятся только к этому сейфу, а не к паролю зашифрованного хранилища.','Te klucze dotyczą tylko tego sejfu, a nie hasła zaszyfrowanego miejsca przechowywania.'],
    saving:['5 Ersatzschlüssel erzeugt. Wähle jetzt eine Datei zum Speichern – nicht im Tresor-Ordner.','5 recovery keys generated. Choose where to save the file – not in the vault folder.','Созданы 5 запасных ключей. Выберите файл для сохранения – не в папке сейфа.','Wygenerowano 5 kluczy zapasowych. Wybierz plik do zapisania – nie w folderze sejfu.'],
    // Gemeinsamer Tresor-Plan (Klaus 2026-11-03): auf seiner SD-Karte lag die Datei im Klartext direkt im Tresor.
    besideTitle:['Nicht neben den Tresor legen','Do not store next to the vault','Не храните рядом с сейфом','Nie zapisuj obok sejfu'],
    besideText:['Dieser Ort liegt im Tresor-Ordner oder direkt daneben. Wer die Karte hat, hätte damit alles. Ausdrucken oder auf einem anderen Gerät/Stick aufbewahren. Es wurde nichts gespeichert.','This location is inside or right next to the vault folder. Whoever has the card would have everything. Print the keys or keep them on another device or USB stick. Nothing was saved.','Это место внутри папки сейфа или рядом с ней. У того, у кого карта, было бы всё. Распечатайте ключи или храните их на другом устройстве/флешке. Ничего не сохранено.','To miejsce jest w folderze sejfu lub tuż obok. Kto ma kartę, miałby wszystko. Wydrukuj klucze lub przechowuj je na innym urządzeniu/pendrivie. Nic nie zapisano.'],
    besideLimit:['Erkannt wird das nur auf dem Tablet-Speicher und der SD-Karte; bei Cloud- oder anderen Speichern achte selbst darauf.','This is only detected on tablet storage and the SD card; for cloud or other storage, check yourself.','Это распознаётся только во внутренней памяти и на SD-карте; для облака и других мест проверьте сами.','Rozpoznawane tylko w pamięci tabletu i na karcie SD; w chmurze i innych miejscach sprawdź sam.'],
    otherPlace:['Anderen Ort wählen …','Choose another place …','Выбрать другое место …','Wybierz inne miejsce …'],
    cancel:['Abbrechen','Cancel','Отмена','Anuluj'],
    beside:['Nicht gespeichert: der Ort lag im oder neben dem Tresor. Erneut herunterladen und einen anderen Ort wählen.','Not saved: the place was inside or next to the vault. Download again and choose another place.','Не сохранено: место было в сейфе или рядом. Скачайте снова и выберите другое место.','Nie zapisano: miejsce było w sejfie lub obok. Pobierz ponownie i wybierz inne miejsce.'],
    saved:['Alle 5 Ersatzschlüssel gespeichert. Bewahre sie getrennt auf und bestätige die Sicherung.','All 5 recovery keys saved. Store them separately and confirm the backup.','Все 5 ключей сохранены. Храните их отдельно и подтвердите сохранение.','Zapisano wszystkie 5 kluczy. Przechowuj je osobno i potwierdź zapis.'],
    cancelled:['Speichern abgebrochen. Die Schlüssel sind noch nicht gesichert. Erneut herunterladen.','Saving cancelled. The keys are not backed up yet. Download again.','Сохранение отменено. Ключи ещё не сохранены. Скачайте повторно.','Anulowano zapis. Klucze nie są zabezpieczone. Pobierz ponownie.'],
    failed:['Schlüssel konnten nicht gespeichert werden. Speicherort prüfen und erneut versuchen.','Unable to save recovery keys. Check the location and try again.','Не удалось сохранить ключи. Проверьте место сохранения и повторите.','Nie można zapisać kluczy. Sprawdź miejsce zapisu i spróbuj ponownie.'],
    changed:['Passwort geändert. Erzeuge und sichere neue Ersatzschlüssel.','Password changed. Generate and save new recovery keys.','Пароль изменён. Создайте и сохраните новые ключи.','Zmieniono hasło. Wygeneruj i zapisz nowe klucze.']
  };
  const text=key=>words[key][Math.max(0,['de','en','ru','pl'].indexOf(document.documentElement.lang))];
  /* Android meldet „nebenTresor“, wenn der gewählte Ort im Speicherort-/Tresor-Ordner oder direkt neben „Private Brain“
     liegt; dort wurde nichts geschrieben. Hier die Warnung mit „Anderen Ort wählen …“ und „Abbrechen“. */
  function warn(){
    return new Promise(resolve=>{
      const dialog=document.createElement('dialog');dialog.className='live-dialog';dialog.id='recoveryBesideVault';
      const h=document.createElement('h2'),p=document.createElement('p'),limit=document.createElement('p');
      h.textContent=text('besideTitle');p.textContent=text('besideText');limit.textContent=text('besideLimit');limit.className='hint';
      dialog.append(h,p,limit);let again=false;
      for(const [key,value] of [['otherPlace',true],['cancel',false]]){const b=document.createElement('button');b.type='button';b.textContent=text(key);b.dataset.wahl=key;b.className=value?'primary':'ghost';b.onclick=()=>{again=value;dialog.close();};dialog.append(b);}
      document.body.append(dialog);
      dialog.addEventListener('close',()=>{dialog.remove();resolve(again);},{once:true});
      dialog.showModal();
    });
  }
  window.PBRecoveryExport={
    text,
    async save(shares,name,heading){
      const api=window.Capacitor?.Plugins?.ProFiles;
      if(typeof api?.saveRecoveryKeys!=='function')throw new Error('RECOVERY_EXPORT_UNAVAILABLE');
      for(;;){
        const result=await api.saveRecoveryKeys({shares,name,heading});
        if(!result?.nebenTresor||!await warn())return result;
      }
    }
  };
})();
