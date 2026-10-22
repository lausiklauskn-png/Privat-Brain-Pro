/* Android adapter: only named native operations; no service token or credential form. */
(() => {
  'use strict';
  const plugin = window.Capacitor?.Plugins?.ProMail;
  if (!plugin) return;
  const languages = ['de', 'en', 'ru', 'pl'];
  const labels = {
    loadingDownload:['E-Mail wird vom Anbieter geladen …','Downloading email from the provider …','Загрузка письма у провайдера …','Pobieranie wiadomości od dostawcy …'],
    loadingPrepare:['E-Mail wird für die Ansicht vorbereitet …','Preparing email for display …','Подготовка письма к просмотру …','Przygotowywanie widoku wiadomości …'],
    loadingCheck:['Nachricht und Anhänge werden auf verdächtige Inhalte geprüft …','Checking message and attachments for suspicious content …','Проверка письма и вложений на подозрительное содержимое …','Sprawdzanie wiadomości i załączników pod kątem podejrzanej treści …'],
    loadingWhy:['Warum dauert das?','Why does this take time?','Почему это занимает время?','Dlaczego to trwa?'],
    loadingExplain:['Zuerst werden Nachricht und Anhänge vom Anbieter übertragen. Danach bereinigt die App die Anzeige und prüft Mailtext und Anhänge anhand von Regeln auf verdächtige Inhalte. Große Anhänge, die Verbindung und die Prüfungen können Zeit benötigen. Das ist kein vollständiger Virenscanner. Befunde und ungeprüfte Bereiche stehen im Prüfbericht unter der Nachricht.','First the message and attachments are transferred from the provider. The app then sanitizes the display and checks message text and attachments for suspicious content using rules. Large attachments, the connection and checks can take time. This is not a full antivirus scan. Findings and unchecked content are listed in the check report below the message.','Сначала письмо и вложения загружаются у провайдера. Затем приложение очищает отображение и проверяет текст и вложения по правилам. Вложения, соединение и проверки могут требовать времени. Это не полноценный антивирус. Находки и непроверенные области указаны в отчёте под письмом.','Najpierw wiadomość i załączniki są pobierane od dostawcy. Następnie aplikacja oczyszcza widok i sprawdza tekst oraz załączniki według reguł. Duże załączniki, połączenie i kontrole mogą wymagać czasu. To nie jest pełny skan antywirusowy. Wyniki i niesprawdzone obszary są w raporcie pod wiadomością.'],
    foldersUnavailable: ['Die Serverordner sind noch nicht geladen. Bitte aktualisieren; gespeicherte Entwürfe und Versandversuche bleiben verfügbar.', 'Server folders are not loaded yet. Refresh; saved drafts and send attempts remain available.', 'Папки сервера ещё не загружены. Обновите список; сохранённые черновики и отправки доступны.', 'Foldery serwera nie zostały wczytane. Odśwież; zapisane szkice i próby wysłania pozostają dostępne.'],
    folderUnavailable: ["Dieser Ordner ist beim Anbieter noch nicht vorhanden.", "This folder does not exist with the provider yet.", "Этой папки ещё нет у провайдера.", "Ten folder nie istnieje jeszcze u dostawcy."],
    messageTools: ["Nachrichtenaktionen", "Message actions", "Действия с письмом", "Działania wiadomości"],
    tools: ["Weitere Aktionen", "More actions", "Другие действия", "Więcej działań"],
    remote: ['Geräte-Postfach', 'Device mailbox', 'Почта на устройстве', 'Poczta na urządzeniu'],
    disconnect: ['Postfach schließen', 'Close mailbox', 'Закрыть почту', 'Zamknij pocztę'],
    draft: ['Entwurf auf Gerät speichern', 'Save draft on device', 'Сохранить черновик на устройстве', 'Zapisz szkic na urządzeniu'],
    draftStatus: ['Entwurf', 'Draft', 'Черновик', 'Szkic'],
    saved: ['Entwürfe und Versandstatus', 'Drafts and send status', 'Черновики и отправка', 'Szkice i stan wysyłki'],
    restore: ['Entwurf öffnen', 'Open draft', 'Открыть черновик', 'Otwórz szkic'],
    queued: ['Noch nicht übermittelt', 'Not submitted yet', 'Ещё не отправлено', 'Jeszcze nie wysłano'],
    sending: ['Versand unklar – beim Anbieter prüfen', 'Send result unclear – check with provider', 'Отправка не подтверждена — проверьте у провайдера', 'Wynik nieznany — sprawdź u dostawcy'],
    uncertain: ['Versand unklar – nicht erneut senden', 'Send result unclear – do not resend', 'Отправка не подтверждена — не отправляйте повторно', 'Wynik nieznany — nie wysyłaj ponownie'],
    sent: ['SMTP hat die Nachricht angenommen', 'SMTP accepted the message', 'SMTP принял письмо', 'SMTP przyjął wiadomość'],
    emptySaved: ['Keine gespeicherten Entwürfe oder Versandversuche.', 'No saved drafts or send attempts.', 'Нет сохранённых черновиков или отправок.', 'Brak zapisanych szkiców lub prób wysłania.'],
    nativeLimit: ['Anhänge zusammen höchstens 5 MB, vollständige Nachricht höchstens 8 MB.', 'Attachments up to 5 MB total, complete message up to 8 MB.', 'Вложения до 5 МБ суммарно, письмо до 8 МБ.', 'Załączniki łącznie do 5 MB, całe wiadomości do 8 MB.'],
    oversized: ['Nachricht über 8 MB – bitte beim Anbieter öffnen', 'Message over 8 MB – open with provider', 'Письмо больше 8 МБ — откройте у провайдера', 'Wiadomość powyżej 8 MB — otwórz u dostawcy'],
    detailsPending: ['Details beim Öffnen laden', 'Load details when opening', 'Загрузить сведения при открытии', 'Pobierz szczegóły przy otwarciu'],
    download: ['Original teilen / sichern', 'Share / save original', 'Поделиться / сохранить оригинал', 'Udostępnij / zapisz oryginał']
  };
  const messages = {
    APP_OFFLINE: ['Die App ist vom Internet getrennt. Im App-Menü den Internetzugriff wieder erlauben.', 'The app is disconnected from the internet. Allow internet access again in the app menu.', 'Приложение отключено от интернета. Разрешите доступ в меню приложения.', 'Aplikacja jest odłączona od internetu. Zezwól na dostęp w menu aplikacji.'],
    BRIDGE_RESPONSE_INVALID: ['Die App hat keine gültige Postfachantwort erhalten. Bitte aktualisieren.', 'The app received no valid mailbox response. Please refresh.', 'Приложение не получило корректный ответ почты. Обновите список.', 'Aplikacja nie otrzymała poprawnej odpowiedzi poczty. Odśwież.'],
    CANCELLED: ['Der Postfachaufruf wurde abgebrochen. Bitte erneut versuchen.', 'The mailbox operation was cancelled. Please try again.', 'Почтовая операция прервана. Повторите попытку.', 'Operacja pocztowa anulowana. Spróbuj ponownie.'],
    GMAIL_SCOPE_MISSING: ["Google hat den erforderlichen Mail-Zugriff nicht freigegeben. Mail-Berechtigung und Testnutzer prüfen.", "Google has not granted mail access. Check mail permission and test users.", "Google не разрешил доступ к почте. Проверьте разрешение и тестовых пользователей.", "Google nie przyznał dostępu do poczty. Sprawdź uprawnienia i użytkowników testowych."],
    GMAIL_ACCOUNT_UNAVAILABLE: ["Google-Freigabe erhalten, aber die zugehörige E-Mail-Adresse konnte nicht sicher ermittelt werden. Internetverbindung prüfen.", "Google authorization received, but the account email could not be verified. Check your connection.", "Разрешение Google получено, но адрес аккаунта не удалось подтвердить. Проверьте подключение.", "Otrzymano zgodę Google, ale nie potwierdzono adresu konta. Sprawdź połączenie."],
    GMAIL_ACCOUNT_MISMATCH: ["Google hat ein anderes Konto zurückgegeben. Bitte das bereits verbundene Google-Konto auswählen.", "Google returned a different account. Select the Google account already connected.", "Google вернул другой аккаунт. Выберите ранее подключённый аккаунт.", "Google zwrócił inne konto. Wybierz wcześniej połączone konto Google."],
    GMAIL_TOKEN_MISSING: ["Google hat keine nutzbare Zugriffsfreigabe zurückgegeben.", "Google did not return a usable access grant.", "Google не вернул действительное разрешение доступа.", "Google nie zwrócił działającego uprawnienia dostępu."],
    GMAIL_TOKEN_REJECTED: ["Google hat die erhaltene Zugriffsfreigabe abgelehnt. Erneute Zustimmung erforderlich.", "Google rejected the access grant. Authorize again.", "Google отклонил разрешение доступа. Требуется новое согласие.", "Google odrzucił uprawnienie dostępu. Wymagana ponowna zgoda."],
    GMAIL_CONSENT_REQUIRED: ["Google benötigt noch deine ausdrückliche Zustimmung zum Mail-Zugriff.", "Google still needs your explicit consent to mail access.", "Google ещё требуется ваше согласие на доступ к почте.", "Google nadal wymaga wyraźnej zgody na dostęp do poczty."],
    GMAIL_IMAP_AUTH_FAILED: ["Google-Zustimmung erhalten; Gmail hat die Anmeldung am Posteingangsserver abgelehnt.", "Google consent received; Gmail rejected the IMAP login.", "Согласие Google получено, но Gmail отклонил вход IMAP.", "Otrzymano zgodę Google, ale Gmail odrzucił logowanie IMAP."],
    GMAIL_SMTP_AUTH_FAILED: ["Google-Zustimmung erhalten; Gmail hat die Anmeldung am Versandserver abgelehnt. Es wurde keine Nachricht gesendet.", "Google consent received; Gmail rejected the SMTP login. No message was sent.", "Согласие Google получено, но Gmail отклонил вход SMTP. Письмо не отправлено.", "Otrzymano zgodę Google, ale Gmail odrzucił logowanie SMTP. Nie wysłano wiadomości."],
    NETWORK_FAILED: ["Die Google-Verbindung ist fehlgeschlagen. Internetverbindung prüfen.", "Google connection failed. Check your internet connection.", "Не удалось подключиться к Google. Проверьте интернет.", "Nie udało się połączyć z Google. Sprawdź internet."],
    GMAIL_AUTH_REQUIRED: ['Google-Anmeldung erneut erforderlich. Über „Konto hinzufügen“ Google wählen; das bestehende Konto bleibt erhalten.', 'Google authorization required again. Choose Google in Add account; the existing account is preserved.', 'Нужна повторная авторизация Google. Выберите Google через добавление аккаунта; существующий аккаунт сохранится.', 'Wymagana ponowna autoryzacja Google. Wybierz Google przy dodawaniu konta; istniejące konto zostaje zachowane.'],
    GMAIL_CONFIGURATION_REQUIRED: ['Google-Anmeldung ist für diese App noch nicht freigeschaltet.', 'Google authorization is not enabled for this app yet.', 'Вход Google ещё не настроен для этого приложения.', 'Logowanie Google nie jest skonfigurowane dla tej aplikacji.'],
    AUTH_FAILED: ['Anmeldung fehlgeschlagen. Anbieter-Einstellungen und Passwort für E-Mail-Programme prüfen.', 'Login failed. Check provider settings and your password for email apps.', 'Ошибка входа. Проверьте настройки провайдера и пароль для почтовых программ.', 'Logowanie nieudane. Sprawdź ustawienia dostawcy i hasło dla programów pocztowych.'],
    TLS_FAILED: ['TLS-Zertifikat nicht bestätigt. Bitte Servernamen prüfen.', 'TLS certificate not verified. Check server names.', 'TLS-сертификат не подтверждён. Проверьте серверы.', 'Certyfikat TLS niepotwierdzony. Sprawdź serwery.'],
    CONNECTION_FAILED: ['Verbindung fehlgeschlagen. Internet und Servernamen prüfen.', 'Connection failed. Check internet and server names.', 'Нет подключения. Проверьте интернет и серверы.', 'Brak połączenia. Sprawdź internet i serwery.'],
    VAULT_UNAVAILABLE: ['Sichere Kontenablage nicht verfügbar. Bestehende Daten wurden nicht zurückgesetzt.', 'Secure account storage unavailable. Existing data was not reset.', 'Защищённое хранилище недоступно. Данные не сброшены.', 'Bezpieczna pamięć niedostępna. Dane nie zostały zresetowane.'],
    ACCOUNT_MISSING: ['Kontoverbindung fehlt. Bitte das Postfach erneut öffnen.', 'Account connection missing. Reopen the mailbox.', 'Подключение отсутствует. Откройте почту заново.', 'Brak połączenia konta. Otwórz pocztę ponownie.'],
    FOLDER_CHANGED: ['Ordner wurde neu aufgebaut. Bitte aktualisieren.', 'Folder was rebuilt. Please refresh.', 'Папка изменена. Обновите список.', 'Folder został przebudowany. Odśwież.'],
    FOLDER_FAILED: ['Ordner konnte beim Anbieter nicht geändert werden. Bitte aktualisieren und Berechtigungen prüfen.', 'Unable to change the provider folder. Refresh and check permissions.', 'Не удалось изменить папку у провайдера. Обновите список и проверьте права.', 'Nie można zmienić folderu u dostawcy. Odśwież i sprawdź uprawnienia.'],
    INVALID_MESSAGE: ['Nachrichtenformat konnte nicht gelesen werden. Bitte im Anbieter-Postfach prüfen.', 'Unable to read the message format. Check provider webmail.', 'Не удалось прочитать формат письма. Проверьте в веб-почте.', 'Nie można odczytać formatu wiadomości. Sprawdź w poczcie WWW.'],
    INVALID_INPUT: ['Bitte Eingaben prüfen.', 'Please check your entries.', 'Проверьте введённые данные.', 'Sprawdź wprowadzone dane.'],
    MESSAGE_MISSING: ['Nachricht oder Entwurf nicht mehr vorhanden. Bitte aktualisieren.', 'Message or draft no longer available. Refresh.', 'Письмо или черновик недоступны. Обновите список.', 'Wiadomość lub szkic niedostępne. Odśwież.'],
    MESSAGE_TOO_LARGE: labels.nativeLimit,
    SEND_UNCERTAIN: ['Versand unklar. Beim Anbieter und im Gesendet-Ordner prüfen. Kein automatischer Neuversand.', 'Send result unclear. Check with your provider and Sent folder. No automatic resend.', 'Отправка не подтверждена. Проверьте у провайдера и в отправленных. Автоповтора нет.', 'Wynik wysyłki nieznany. Sprawdź u dostawcy i w wysłanych. Bez automatycznego ponawiania.'],
    SEND_CHANGED: ['Dieser Versandversuch gehört zu einem unveränderlichen Entwurf. Versandstatus prüfen; Änderungen als neue Nachricht verfassen.', 'This send attempt belongs to an immutable draft. Check its status; compose edits as a new message.', 'Эта попытка связана с неизменяемым черновиком. Проверьте статус; изменения оформите новым письмом.', 'Próba dotyczy niezmiennego szkicu. Sprawdź stan; zmiany utwórz jako nową wiadomość.'],
    SENT_COPY_UNCONFIRMED: ['SMTP hat angenommen. Die Gesendet-Kopie ist nicht bestätigt; bitte nicht nochmals senden.', 'SMTP accepted the message. Sent copy is unconfirmed; do not resend.', 'SMTP принял письмо. Копия в отправленных не подтверждена; не отправляйте повторно.', 'SMTP przyjął wiadomość. Kopia w wysłanych niepotwierdzona; nie wysyłaj ponownie.'],
    MOVE_UNSUPPORTED: ['Dieser Server unterstützt kein sicheres direktes Verschieben. Bitte Anbieter-Webmail verwenden.', 'This server does not support safe direct moves. Use provider webmail.', 'Сервер не поддерживает безопасное перемещение. Используйте веб-почту.', 'Serwer nie obsługuje bezpiecznego przenoszenia. Użyj poczty WWW.'],
    DELETE_UNSUPPORTED: ['Endgültiges Löschen nur im bestätigten Papierkorb und mit gezieltem Server-Löschen möglich.', 'Permanent deletion requires the confirmed Trash folder and targeted server deletion.', 'Удаление возможно только в подтверждённой корзине с адресным удалением на сервере.', 'Trwałe usunięcie wymaga potwierdzonego kosza i precyzyjnego usuwania na serwerze.'],
    FILE_UNAVAILABLE: ['Anhang konnte nicht bereitgestellt werden. Gerätespeicher prüfen oder später erneut versuchen.', 'Attachment unavailable. Check device storage or try again later.', 'Вложение недоступно. Проверьте память или повторите позже.', 'Załącznik niedostępny. Sprawdź pamięć lub spróbuj później.'],
    ACCOUNT_LIMIT: ['Höchstens 20 Konten in dieser App.', 'Up to 20 accounts in this app.', 'До 20 аккаунтов в приложении.', 'Do 20 kont w aplikacji.'],
    VAULT_LOCKED: ['Der Speicherort ist gesperrt. Bitte entsperren; die Mail wurde nicht geladen.', 'The storage location is locked. Please unlock; the email was not loaded.', 'Хранилище заблокировано. Разблокируйте; письмо не загружено.', 'Miejsce zapisu jest zablokowane. Odblokuj; wiadomości nie wczytano.'],
    VAULT_FOLDER_UNAVAILABLE: ['Der Speicherort ist nicht erreichbar. SD-Karte eingesteckt? Sonst in den Einstellungen den Ordner erneut öffnen.', 'The storage location is unavailable. Is the SD card inserted? Otherwise open the folder again in Settings.', 'Хранилище недоступно. Вставлена ли SD-карта? Иначе откройте папку снова в настройках.', 'Miejsce zapisu niedostępne. Czy karta SD jest włożona? W przeciwnym razie otwórz folder ponownie w ustawieniach.'],
    VAULT_DAMAGED: ['Eine Datei im Speicherort ist beschädigt oder wurde verändert und wurde nicht verwendet.', 'A file in the storage location is damaged or was changed and was not used.', 'Файл в хранилище повреждён или изменён и не использован.', 'Plik w miejscu zapisu jest uszkodzony lub zmieniony i nie został użyty.'],
    STORAGE_FULL: ['Nicht genug freier Speicher für diese Mail. Platz schaffen oder einen anderen Speicherort wählen.', 'Not enough free storage for this email. Free up space or choose another location.', 'Недостаточно места для этого письма. Освободите место или выберите другое хранилище.', 'Za mało miejsca na tę wiadomość. Zwolnij miejsce lub wybierz inne miejsce zapisu.']
  };
  function text(key) {
    const values = labels[key] || messages[key];
    return values?.[Math.max(0, languages.indexOf(document.documentElement.lang))] || null;
  }
  async function invoke(method, args = {}, retried = false) {
    try {
      const result=await plugin[method](args);
      if(!result||typeof result!=='object'||Array.isArray(result))throw {code:'BRIDGE_RESPONSE_INVALID'};
      return result;
    }
    catch (error) {
      if (error?.code === 'CANCELLED' && method === 'addAccount') return null;
      // Folder mode: ask once for the folder password (native dialog), then repeat the same request.
      if (error?.code === 'VAULT_LOCKED' && !retried && window.PBVault && await window.PBVault.unlock().catch(() => false)) return invoke(method, args, true);
      const known=Object.hasOwn(messages,error?.code);
      throw new Error((known?text(error.code):text('CONNECTION_FAILED'))+(known?' ('+error.code+')':''));
    }
  }
  function withItems(result) {
    if(!Array.isArray(result.items)||result.items.some(item=>!item||typeof item!=='object'||Array.isArray(item)))throw new Error(text('BRIDGE_RESPONSE_INVALID'));
    return result;
  }
  const progressBox=document.createElement('aside');progressBox.className='native-mail-progress';progressBox.hidden=true;
  const progressStatus=document.createElement('p');progressStatus.setAttribute('role','status');progressStatus.setAttribute('aria-live','polite');
  const progressDetails=document.createElement('details'),progressSummary=document.createElement('summary'),progressExplanation=document.createElement('p');
  progressDetails.append(progressSummary,progressExplanation);progressBox.append(progressStatus,progressDetails);document.getElementById('mailWorkspace').prepend(progressBox);
  let progressStage='idle';
  function progress(stage){progressStage=stage;progressBox.hidden=stage==='idle';progressStatus.textContent=stage==='idle'?'':text({download:'loadingDownload',prepare:'loadingPrepare',checking:'loadingCheck'}[stage]);progressSummary.textContent=text('loadingWhy');progressExplanation.textContent=text('loadingExplain');}
  new MutationObserver(()=>progress(progressStage)).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  window.PBMailDevice = {
    progress,
    base: 'android:private-brain-pro',
    attachmentLimit: 5 * 1024 * 1024,
    text,
    accounts: async () => withItems(await invoke('accounts')).items,
    addAccount: () => invoke('addAccount', {language:document.documentElement.lang, dark:document.documentElement.dataset.theme === 'dunkel'}),
    saved: async account => withItems(await invoke('saved', {account})).items,
    savedDraft: (account,id) => invoke('savedDraft',{account,id}),
    openAttachment: args => invoke('openAttachment', args),
    openOriginal: args => invoke('openOriginal', args),
    forgetMessage: args => invoke('forgetMessage', args),
    // Sorting index for all accounts: headers since a date, then readable text of a few mails.
    index: async args => {
      const result = withItems(await invoke('index', args));
      if (typeof result.validity !== 'string' || !/^[0-9]{1,10}$/.test(result.validity) || !(result.next === null || Number.isSafeInteger(result.next))) throw new Error(text('BRIDGE_RESPONSE_INVALID'));
      for (const item of result.items) if (!Number.isSafeInteger(item.uid) || item.uid < 1 || typeof item.subject !== 'string' || typeof item.from !== 'string' || typeof item.messageId !== 'string' || typeof item.date !== 'number') throw new Error(text('BRIDGE_RESPONSE_INVALID'));
      // Hidden unsubscribe field (older app builds send nothing): only a bounded string and a real boolean pass.
      for (const item of result.items) { item.unsubscribe = typeof item.unsubscribe === 'string' ? item.unsubscribe.slice(0, 3000) : ''; item.oneClick = item.oneClick === true; }
      return result;
    },
    // One-click newsletter unsubscribe (RFC 8058): Android sends a single POST, nothing else.
    unsubscribe: async url => {
      if (typeof url !== 'string' || !/^https:\/\//i.test(url) || url.length > 1500) throw new Error(text('INVALID_INPUT'));
      const result = await invoke('unsubscribe', {url});
      if (typeof result?.ok !== 'boolean' || !Number.isSafeInteger(result.status)) throw new Error(text('BRIDGE_RESPONSE_INVALID'));
      return result;
    },
    locate: async args => {
      const result = await invoke('locate', args);
      if (typeof result.validity !== 'string' || !/^[0-9]{1,10}$/.test(result.validity) || !(result.uid === null || (Number.isSafeInteger(result.uid) && result.uid > 0))) throw new Error(text('BRIDGE_RESPONSE_INVALID'));
      return result;
    },
    indexText: async args => {
      const result = withItems(await invoke('indexText', args));
      for (const item of result.items) if (!Number.isSafeInteger(item.uid) || typeof item.text !== 'string' || typeof item.html !== 'string') throw new Error(text('BRIDGE_RESPONSE_INVALID'));
      return result;
    },
    async request(path, body, method) {
      const url = new URL(path, 'https://mail.invalid');
      const verb = method || (body ? 'POST' : 'GET');
      if (url.origin !== 'https://mail.invalid') throw new Error(text('INVALID_INPUT'));
      if (url.pathname === '/accounts' && verb === 'GET') return this.accounts();
      const parts = url.pathname.split('/').filter(Boolean).map(decodeURIComponent);
      if (parts[0] === 'accounts' && parts.length === 2 && verb === 'DELETE') return invoke('removeAccount',{account:parts[1]});
      const account = parts[0], kind = parts[1];
      if (parts.length === 2 && kind === 'folders' && ['GET','POST'].includes(verb)) {
        const result = await invoke(verb === 'POST' ? 'createFolder' : 'folders', {account,...(body || {})});
        return verb === 'GET' ? withItems(result).items : result;
      }
      if (parts.length === 2 && ['draft','send'].includes(kind) && verb === 'POST') {
        const result = await invoke(kind === 'draft' ? 'saveDraft' : 'send',{account,draft:body});
        if (result?.noticeCode) result.notice = text(result.noticeCode);
        return result;
      }
      const params = {account, folder:url.searchParams.get('folder') || body?.folder || 'INBOX', validity:url.searchParams.get('validity') || body?.validity};
      if (kind === 'messages' && parts.length === 2 && verb === 'GET') {
        const result = withItems(await invoke('messages',{...params,before:Number(url.searchParams.get('before')) || 0}));
        for (const item of result.items) if (!item.subject && item.detailsPending) item.subject = text('detailsPending');
        return result;
      }
      if (kind === 'messages' && parts.length === 3 && verb === 'GET') return invoke('message',{...params,uid:Number(parts[2])});
      // Many mails at once over one connection (POST /messages/batch/action {uids:[…]}).
      if (kind === 'messages' && parts.length === 4 && parts[2] === 'batch' && parts[3] === 'action' && verb === 'POST') return invoke('actions',{...params,...body});
      if (kind === 'messages' && parts.length === 4 && parts[3] === 'action' && verb === 'POST') return invoke('action',{...params,...body,uid:Number(parts[2])});
      throw new Error(text('INVALID_INPUT'));
    }
  };
})();
