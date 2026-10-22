(() => {
  'use strict';
  const $=id=>document.getElementById(id),invoke=window.__TAURI_INTERNALS__.invoke;
  const W={
    de:['Abbrechen','Weiter','Speicherort verschlüsseln','Ordner öffnen','Ordner entsperren','Mailkonto verbinden','Passwort','Passwort wiederholen','Ohne dieses Passwort sind die Daten im Ordner verloren. Niemand kann es wiederherstellen.','Auf diesem Windows-Benutzerkonto entsperrt halten','Passwörter stimmen nicht überein oder sind kürzer als 10 Zeichen.','Anbieter','Benutzername'],
    en:['Cancel','Continue','Encrypt storage folder','Open folder','Unlock folder','Connect mail account','Password','Repeat password','Without this password, the data in this folder is lost. Nobody can recover it.','Keep unlocked for this Windows user','Passwords do not match or have fewer than 10 characters.','Provider','Username'],
    ru:['Отмена','Продолжить','Зашифровать хранилище','Открыть папку','Разблокировать папку','Подключить почту','Пароль','Повторите пароль','Без этого пароля данные в папке будут потеряны. Никто не сможет их восстановить.','Оставить открытым для этого пользователя Windows','Пароли не совпадают или короче 10 символов.','Провайдер','Имя пользователя'],
    pl:['Anuluj','Dalej','Zaszyfruj miejsce zapisu','Otwórz folder','Odblokuj folder','Połącz konto pocztowe','Hasło','Powtórz hasło','Bez tego hasła dane w folderze zostaną utracone. Nikt nie może ich odzyskać.','Zachowaj odblokowanie dla tego użytkownika Windows','Hasła są różne lub mają mniej niż 10 znaków.','Dostawca','Nazwa użytkownika']
  };
  const providers={telekom:['secureimap.t-online.de','securesmtp.t-online.de'],hetzner:['mail.your-server.de','mail.your-server.de'],gmail:['imap.gmail.com','smtp.gmail.com'],webde:['imap.web.de','smtp.web.de'],gmx:['imap.gmx.net','mail.gmx.net'],yahoo:['imap.mail.yahoo.com','smtp.mail.yahoo.com'],ionos:['imap.ionos.de','smtp.ionos.de']};
  let config={},words=W.de;
  const call=(action,fields)=>invoke('pb_dialog',{action,fields:fields||null});
  function provider(){
    const id=$('provider').value,gmail=id==='gmail';
    $('account-fields').hidden=gmail;$('password-label').hidden=gmail;
    $('user-label').hidden=!['telekom','hetzner'].includes(id);
    $('imap').value=providers[id][0];$('smtp').value=providers[id][1];
    $('imap').readOnly=$('smtp').readOnly=id!=='hetzner';
    $('help').textContent=gmail?({de:'Google öffnet sich im Standardbrowser. Hier kein Google-Passwort eingeben.',en:'Google opens in your default browser. Do not enter your Google password here.',ru:'Google откроется в обычном браузере. Не вводите пароль Google здесь.',pl:'Google otworzy się w domyślnej przeglądarce. Nie wpisuj tu hasła Google.'}[config.language]||'Google sign-in uses your browser.'):
      id==='telekom'?({de:'Das separate Passwort für E-Mail-Programme verwenden.',en:'Use the separate password for email apps.',ru:'Используйте отдельный пароль для почтовых программ.',pl:'Użyj osobnego hasła dla programów pocztowych.'}[config.language]||'Use your email-app password.') : '';
  }
  $('cancel').onclick=()=>call('cancel');
  addEventListener('keydown',e=>{if(e.key==='Escape')void call('cancel');});
  $('provider').onchange=provider;
  $('form').onsubmit=async e=>{
    e.preventDefault();$('status').textContent='';let fields;
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
    for(const [id,index] of [['cancel',0],['submit',1],['password-caption',6],['repeat-caption',7],['notice-caption',8],['remember-caption',9],['provider-label',11]])$(id).textContent=words[index];
    $('account').hidden=value.kind!=='account';
    const create=value.kind==='password'&&value.mode==='create';
    $('repeat-label').hidden=$('notice-label').hidden=!create;$('remember-label').hidden=value.kind!=='password';
    $('title').textContent=value.kind==='account'?words[5]:words[{create:2,open:3,unlock:4}[value.mode]||4];
    if(value.kind==='account'){provider();$('provider').focus();}else $('password').focus();
  });
})();
