(() => {
  'use strict';
  const $=id=>document.getElementById(id),invoke=window.__TAURI_INTERNALS__.invoke;
  const token=window.__PB_DIALOG_SESSION;delete window.__PB_DIALOG_SESSION;
  const W={
    de:['Abbrechen','Weiter','Speicherort verschlüsseln','Ordner öffnen','Ordner entsperren','Mailkonto verbinden','Passwort','Passwort wiederholen','Ohne dieses Passwort sind die Daten im Ordner verloren. Niemand kann es wiederherstellen.','Auf diesem Windows-Benutzerkonto entsperrt halten','Passwörter stimmen nicht überein oder sind kürzer als 10 Zeichen.','Anbieter','Benutzername'],
    en:['Cancel','Continue','Encrypt storage folder','Open folder','Unlock folder','Connect mail account','Password','Repeat password','Without this password, the data in this folder is lost. Nobody can recover it.','Keep unlocked for this Windows user','Passwords do not match or have fewer than 10 characters.','Provider','Username'],
    ru:['Отмена','Продолжить','Зашифровать хранилище','Открыть папку','Разблокировать папку','Подключить почту','Пароль','Повторите пароль','Без этого пароля данные в папке будут потеряны. Никто не сможет их восстановить.','Оставить открытым для этого пользователя Windows','Пароли не совпадают или короче 10 символов.','Провайдер','Имя пользователя'],
    pl:['Anuluj','Dalej','Zaszyfruj miejsce zapisu','Otwórz folder','Odblokuj folder','Połącz konto pocztowe','Hasło','Powtórz hasło','Bez tego hasła dane w folderze zostaną utracone. Nikt nie może ich odzyskać.','Zachowaj odblokowanie dla tego użytkownika Windows','Hasła są różne lub mają mniej niż 10 znaków.','Dostawca','Nazwa użytkownika']
  };
  let config={},words=W.de;
  const call=(action,fields)=>invoke('pb_dialog',{action,fields:fields||null},{headers:{'x-pb-session':token}});
  function provider(){
    const id=$('provider').value,gmail=id==='gmail',template=config.providers?.find(p=>p.id===id);
    const ready=template?.ready===true,language=Math.max(0,['de','en','ru','pl'].indexOf(config.language));
    $('account-fields').hidden=$('password-label').hidden=gmail||!ready;$('submit').disabled=!ready;
    $('user-label').hidden=!template?.customUser;
    $('imap').value=template?.imap||'';$('smtp').value=template?.smtp||'';
    $('imap').readOnly=$('smtp').readOnly=!template?.editable;
    $('help').textContent=ready?template.help[language]:template?.plan?.[language]||'';
  }
  $('cancel').onclick=()=>call('cancel');
  addEventListener('keydown',e=>{if(e.key==='Escape')void call('cancel');});
  $('provider').onchange=provider;
  $('remove').onclick=()=>{if(config.kind==='key')void call('submit',{password:''});};
  $('form').onsubmit=async e=>{
    e.preventDefault();$('status').textContent='';let fields;
    if(config.kind==='speech')return;
    if(config.kind==='account'){
      const gmail=$('provider').value==='gmail';
      if(!gmail&&(!$('email').value||!$('password').value)){$('email').reportValidity();$('password').focus();return;}
      fields={provider:$('provider').value,email:$('email').value.trim(),user:$('user').value.trim()||$('email').value.trim(),imap:$('imap').value,smtp:$('smtp').value,password:$('password').value};
    }else{
      const password=$('password').value,repeat=$('repeat').value;
      if(config.mode==='create'&&(password.length<10||password!==repeat||!$('notice').checked)){$('status').textContent=words[10];return;}
      fields={password,repeat,notice:$('notice').checked,remember:$('remember').checked};
    }
    $('submit').disabled=true;
    try{await call('submit',fields);$('password').value=$('repeat').value='';}catch{$('submit').disabled=false;}
  };
  void call('config').then(value=>{
    config=value;words=W[value.language]||W.de;document.documentElement.lang=value.language||'de';
    if(value.kind==='speech'){
      $('title').textContent=({de:'Sprechen Sie jetzt',en:'Speak now',ru:'Говорите',pl:'Mów teraz'}[value.language]||'Speak now');
      $('help').textContent=({de:'Lokale Windows-Spracherkennung. Ende nach einem Satz oder spätestens einer Minute.',en:'Local Windows speech recognition. Ends after one phrase or at most one minute.',ru:'Локальное распознавание Windows: одна фраза, не дольше минуты.',pl:'Lokalne rozpoznawanie Windows: jedna fraza, maksymalnie minuta.'}[value.language]||'Local Windows speech recognition.');
      // Klaus 2026-10-27: say which microphone is listening, never leave it to chance unseen.
      const mic=typeof value.microphone==='string'&&value.microphone?value.microphone:({de:'Windows-Standardmikrofon',en:'Windows default microphone',ru:'Микрофон Windows по умолчанию',pl:'Domyślny mikrofon Windows'}[value.language]||'Windows default microphone');
      $('help').textContent+=' '+({de:'Mikrofon: ',en:'Microphone: ',ru:'Микрофон: ',pl:'Mikrofon: '}[value.language]||'Microphone: ')+mic;
      $('account').hidden=false;$('provider').closest('label').hidden=true;$('account-fields').hidden=true;
      for(const id of ['password-label','repeat-label','notice-label','remember-label','submit'])$(id).hidden=true;
      $('cancel').textContent=words[0];return;
    }
    for(const [id,index] of [['cancel',0],['submit',1],['password-caption',6],['repeat-caption',7],['notice-caption',8],['remember-caption',9],['provider-label',11]])$(id).textContent=words[index];
    $('user-caption').textContent=words[12];
    $('email-caption').textContent=({de:'E-Mail-Adresse',en:'Email address',ru:'Адрес эл. почты',pl:'Adres e-mail'}[value.language]||'Email address');
    $('account').hidden=value.kind!=='account';
    $('remove').hidden=value.kind!=='key';
    if(value.kind==='key'){
      $('password-caption').textContent=({de:'Schlüssel',en:'Key',ru:'Ключ',pl:'Klucz'}[value.language]||'Key');
      $('remove').textContent=({de:'Entfernen',en:'Remove',ru:'Удалить',pl:'Usuń'}[value.language]||'Remove');
    }
    const create=value.kind==='password'&&value.mode==='create';
    $('repeat-label').hidden=$('notice-label').hidden=!create;$('remember-label').hidden=value.kind!=='password';
    $('title').textContent=value.kind==='key'?({de:'Schutzanbieter-Schlüssel',en:'Protection provider key',ru:'Ключ сервиса защиты',pl:'Klucz usługi ochrony'}[value.language]||'Protection provider key')+' · '+value.service:value.kind==='account'?words[5]:words[{create:2,open:3,unlock:4}[value.mode]||4];
    if(value.kind==='account'){
      $('provider').replaceChildren(...(value.providers||[]).map(p=>{const option=document.createElement('option');option.value=p.id;option.textContent=p.label;return option;}));
      provider();$('provider').focus();
    }else $('password').focus();
  });
})();
