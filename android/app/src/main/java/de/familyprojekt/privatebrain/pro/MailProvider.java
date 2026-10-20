package de.familyprojekt.privatebrain.pro;

/** Native account templates; server paths and existing stored provider IDs stay unchanged. */
enum MailProvider {
    TELEKOM("telekom", "Telekom / T-Online", "secureimap.t-online.de", "securesmtp.t-online.de", false),
    HETZNER("hetzner", "Hetzner", "mail.your-server.de", "mail.your-server.de", true),
    GOOGLE("gmail", "Google / Gmail", "imap.gmail.com", "smtp.gmail.com", false),
    WEBDE("webde", "WEB.DE", "imap.web.de", "smtp.web.de", false),
    GMX("gmx", "GMX", "imap.gmx.net", "mail.gmx.net", false),
    YAHOO("yahoo", "Yahoo Mail", "imap.mail.yahoo.com", "smtp.mail.yahoo.com", false),
    IONOS("ionos", "1&1 / IONOS", "imap.ionos.de", "smtp.ionos.de", false),
    MICROSOFT("microsoft", "Outlook / Microsoft 365", "", "", false);

    final String id, label, imap, smtp;
    final boolean editable;
    MailProvider(String id,String label,String imap,String smtp,boolean editable){
        this.id=id;this.label=label;this.imap=imap;this.smtp=smtp;this.editable=editable;
    }
    static MailProvider find(String id)throws MailFailure {
        for(MailProvider provider:values())if(provider.id.equals(id))return provider;
        throw new MailFailure("INVALID_INPUT");
    }
    boolean ready(){return this!=MICROSOFT;}
    boolean customUser(){return this==TELEKOM||this==HETZNER;}
    String help(int language){
        int lang=Math.max(0,Math.min(3,language));
        switch(this){
            case TELEKOM:return new String[]{"Telekom: Verwende das separate Passwort für E-Mail-Programme, nicht das Telekom-Login-Passwort.","Telekom: use the separate password for email apps, not your Telekom login password.","Telekom: используйте отдельный пароль для почтовых программ, а не пароль входа Telekom.","Telekom: użyj osobnego hasła dla programów pocztowych, nie hasła logowania Telekom."}[lang];
            case HETZNER:return new String[]{"Hetzner: E-Mail-Passwort verwenden und beide Servernamen aus deinem Hetzner-Postfach übernehmen.","Hetzner: use your mailbox password and both server names from your Hetzner account.","Hetzner: используйте пароль почты и оба адреса серверов из настроек Hetzner.","Hetzner: użyj hasła pocztowego i obu nazw serwerów z ustawień Hetzner."}[lang];
            case GOOGLE:return new String[]{"Google fragt dich selbst nach deiner Zustimmung. Dein Google-Passwort wird nicht in dieser App eingegeben.","Google asks for your consent. Your Google password is not entered in this app.","Google запросит ваше согласие. Пароль Google не вводится в этом приложении.","Google poprosi o zgodę. Hasła Google nie wpisuje się w tej aplikacji."}[lang];
            case WEBDE:case GMX:return new String[]{"Aktiviere POP3/IMAP in den Einstellungen deines Anbieter-Postfachs. Bei Zwei-Faktor-Anmeldung ein App-Passwort für E-Mail-Programme verwenden. Die vollständige E-Mail-Adresse ist der Benutzername.","Enable POP3/IMAP in your provider mailbox settings. With two-factor authentication, use an app password for email programs. Your full email address is the username.","Включите POP3/IMAP в настройках почты провайдера. При двухфакторном входе используйте пароль приложения. Имя пользователя — полный адрес почты.","Włącz POP3/IMAP w ustawieniach poczty dostawcy. Przy logowaniu dwuskładnikowym użyj hasła aplikacji. Użytkownikiem jest pełny adres e-mail."}[lang];
            case YAHOO:return new String[]{"Yahoo: Erstelle in der Yahoo-Kontosicherheit ein App-Passwort für diese E-Mail-App. Hier dieses App-Passwort eingeben, nicht dein normales Yahoo-Passwort. Der Anbieter muss die Erstellung erlauben.","Yahoo: generate an app password in Yahoo account security for this email app. Enter that app password here, not your regular Yahoo password. Your provider must allow app-password generation.","Yahoo: создайте пароль приложения в настройках безопасности Yahoo. Введите его здесь вместо обычного пароля Yahoo. Создание пароля должно быть разрешено провайдером.","Yahoo: utwórz hasło aplikacji w zabezpieczeniach konta Yahoo. Wpisz je tutaj zamiast zwykłego hasła Yahoo. Dostawca musi zezwalać na utworzenie hasła."}[lang];
            case IONOS:return new String[]{"1&1 / IONOS: Verwende das Passwort des IONOS-E-Mail-Postfachs und die vollständige E-Mail-Adresse. Diese Vorlage gilt für IONOS Mail, nicht für ein dort gebuchtes Microsoft-365-Postfach.","1&1 / IONOS: use your IONOS mailbox password and full email address. This template is for IONOS Mail, not Microsoft 365 purchased through IONOS.","1&1 / IONOS: используйте пароль почты IONOS и полный адрес. Шаблон предназначен для IONOS Mail, а не Microsoft 365, приобретённого через IONOS.","1&1 / IONOS: użyj hasła skrzynki IONOS i pełnego adresu e-mail. Szablon dotyczy IONOS Mail, nie Microsoft 365 kupionego przez IONOS."}[lang];
            default:return new String[]{"Microsoft benötigt eine eigene OAuth-Freigabe und App-Registrierung. Die Microsoft-Anmeldung ist noch nicht verfügbar. Hier kein Microsoft-Passwort eingeben; der Einrichtungsplan erklärt die nächsten Schritte.","Microsoft requires its own OAuth consent and app registration. Microsoft sign-in is not available yet. Do not enter a Microsoft password here; the setup plan explains the next steps.","Microsoft требует отдельного разрешения OAuth и регистрации приложения. Вход Microsoft пока недоступен. Не вводите пароль Microsoft; план настройки описывает дальнейшие шаги.","Microsoft wymaga osobnej zgody OAuth i rejestracji aplikacji. Logowanie Microsoft nie jest jeszcze dostępne. Nie wpisuj hasła Microsoft; plan konfiguracji opisuje kolejne kroki."}[lang];
        }
    }
    static String setupLabel(int language){return new String[]{"Einrichtungsplan anzeigen","Show setup plan","Показать план настройки","Pokaż plan konfiguracji"}[Math.max(0,Math.min(3,language))];}
    static String microsoftPlan(int language){return new String[]{
        "Die Microsoft-Anmeldung ist noch nicht freigeschaltet. Zuerst braucht Private Brain Pro eine eigene Registrierung in Microsoft Entra; anschließend ergänzen und prüfen wir die Anmeldung.\n\nVorgesehen sind private Outlook-/Hotmail-Konten und Microsoft-365-Firmenkonten. Firmen müssen den Zugriff gegebenenfalls erlauben.\n\nBis dahin kannst du die anderen Anbieter weiter verwenden. Es wird kein Microsoft-Konto verbunden und keine Nachricht gesendet. Die Anbindung folgt in einer weiteren App-Version.",
        "Microsoft sign-in is not enabled yet. Private Brain Pro first needs its own registration in Microsoft Entra; we then add and test the sign-in flow.\n\nPersonal Outlook/Hotmail and Microsoft 365 work accounts are planned. Organizations may need to allow access.\n\nYou can keep using the other providers. No Microsoft account is connected and no message is sent. The integration will follow in a later app version.",
        "Вход Microsoft ещё не настроен. Сначала Private Brain Pro нужна собственная регистрация в Microsoft Entra; затем мы добавим и проверим вход.\n\nПланируются личные аккаунты Outlook/Hotmail и рабочие Microsoft 365. Организации может потребоваться разрешить доступ.\n\nПока можно пользоваться другими провайдерами. Аккаунт Microsoft не подключается, письма не отправляются. Подключение будет добавлено в следующей версии приложения.",
        "Logowanie Microsoft nie jest jeszcze włączone. Private Brain Pro potrzebuje najpierw własnej rejestracji w Microsoft Entra; potem dodamy i przetestujemy logowanie.\n\nPlanowane są prywatne konta Outlook/Hotmail i firmowe Microsoft 365. Firma może wymagać zgody na dostęp.\n\nMożesz nadal korzystać z innych dostawców. Konto Microsoft nie jest łączone, wiadomość nie jest wysyłana. Integracja pojawi się w kolejnej wersji aplikacji."
    }[Math.max(0,Math.min(3,language))];}
}
