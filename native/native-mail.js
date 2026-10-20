/* Android adapter: only named native operations; no service token or credential form. */
(() => {
  'use strict';
  const plugin = window.Capacitor?.Plugins?.ProMail;
  if (!plugin) return;
  const languages = ['de', 'en', 'ru', 'pl'];
  const labels = {
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
    nativeLimit: ['Android-Testversion: Anhänge zusammen höchstens 5 MB, vollständige Nachricht höchstens 8 MB.', 'Android test build: attachments up to 5 MB total, complete message up to 8 MB.', 'Тестовая версия: вложения до 5 МБ суммарно, письмо до 8 МБ.', 'Wersja testowa: załączniki łącznie do 5 MB, całe wiadomości do 8 MB.'],
    oversized: ['Nachricht über 8 MB – bitte beim Anbieter öffnen', 'Message over 8 MB – open with provider', 'Письмо больше 8 МБ — откройте у провайдера', 'Wiadomość powyżej 8 MB — otwórz u dostawcy'],
    detailsPending: ['Details beim Öffnen laden', 'Load details when opening', 'Загрузить сведения при открытии', 'Pobierz szczegóły przy otwarciu'],
    download: ['Original teilen / sichern', 'Share / save original', 'Поделиться / сохранить оригинал', 'Udostępnij / zapisz oryginał']
  };
  const messages = {
    GMAIL_AUTH_REQUIRED: ['Google-Anmeldung erneut erforderlich. Über „Konto hinzufügen“ Google wählen; das bestehende Konto bleibt erhalten.', 'Google authorization required again. Choose Google in Add account; the existing account is preserved.', 'Нужна повторная авторизация Google. Выберите Google через добавление аккаунта; существующий аккаунт сохранится.', 'Wymagana ponowna autoryzacja Google. Wybierz Google przy dodawaniu konta; istniejące konto zostaje zachowane.'],
    GMAIL_CONFIGURATION_REQUIRED: ['Google-Anmeldung ist für diese Test-App noch nicht freigeschaltet.', 'Google authorization is not enabled for this test app yet.', 'Вход Google ещё не настроен для этой тестовой версии.', 'Logowanie Google nie jest skonfigurowane dla tej wersji testowej.'],
    AUTH_FAILED: ['Anmeldung fehlgeschlagen. Telekom benötigt das separate Passwort für E-Mail-Programme.', 'Login failed. Telekom requires the separate password for email apps.', 'Ошибка входа. Telekom требует отдельный пароль для почтовых программ.', 'Logowanie nieudane. Telekom wymaga osobnego hasła pocztowego.'],
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
    ACCOUNT_LIMIT: ['Höchstens 20 Konten in dieser Testversion.', 'Up to 20 accounts in this test build.', 'До 20 аккаунтов в тестовой версии.', 'Do 20 kont w wersji testowej.']
  };
  function text(key) {
    const values = labels[key] || messages[key];
    return values?.[Math.max(0, languages.indexOf(document.documentElement.lang))] || null;
  }
  async function invoke(method, args = {}) {
    try { return await plugin[method](args); }
    catch (error) {
      if (error?.code === 'CANCELLED') return null;
      throw new Error(text(error?.code) || text('CONNECTION_FAILED'));
    }
  }
  window.PBMailDevice = {
    base: 'android:private-brain-pro',
    attachmentLimit: 5 * 1024 * 1024,
    text,
    accounts: async () => (await invoke('accounts')).items,
    addAccount: () => invoke('addAccount', {language:document.documentElement.lang, dark:document.documentElement.dataset.theme === 'dunkel'}),
    saved: async account => (await invoke('saved', {account})).items,
    savedDraft: (account,id) => invoke('savedDraft',{account,id}),
    openAttachment: args => invoke('openAttachment', args),
    openOriginal: args => invoke('openOriginal', args),
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
        return verb === 'GET' ? result.items : result;
      }
      if (parts.length === 2 && ['draft','send'].includes(kind) && verb === 'POST') {
        const result = await invoke(kind === 'draft' ? 'saveDraft' : 'send',{account,draft:body});
        if (result?.noticeCode) result.notice = text(result.noticeCode);
        return result;
      }
      const params = {account, folder:url.searchParams.get('folder') || body?.folder || 'INBOX', validity:url.searchParams.get('validity') || body?.validity};
      if (kind === 'messages' && parts.length === 2 && verb === 'GET') {
        const result = await invoke('messages',{...params,before:Number(url.searchParams.get('before')) || 0});
        for (const item of result.items) if (!item.subject && item.detailsPending) item.subject = text('detailsPending');
        return result;
      }
      if (kind === 'messages' && parts.length === 3 && verb === 'GET') return invoke('message',{...params,uid:Number(parts[2])});
      if (kind === 'messages' && parts.length === 4 && parts[3] === 'action' && verb === 'POST') return invoke('action',{...params,...body,uid:Number(parts[2])});
      throw new Error(text('INVALID_INPUT'));
    }
  };
})();
