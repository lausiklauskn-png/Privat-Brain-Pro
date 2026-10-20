package de.familyprojekt.privatebrain.pro;

/** Explain the failing stage without provider responses, account names or credentials. */
final class GmailMessages {
    static String error(String code,int language){
        String[] message;
        switch(code){
            case "APP_OFFLINE":message=new String[]{"Die App ist vom Internet getrennt. Internetzugriff im App-Menü wieder erlauben.","The app is offline. Allow internet access in the app menu.","Приложение отключено от интернета. Разрешите доступ в меню.","Aplikacja jest odłączona od internetu. Zezwól na dostęp w menu."};break;
            case "CANCELLED":message=new String[]{"Google-Anmeldung abgebrochen.","Google sign-in cancelled.","Вход Google отменён.","Anulowano logowanie Google."};break;
            case "GMAIL_CONFIGURATION_REQUIRED":message=new String[]{"Google-Registrierung für Paket und App-Zertifikat prüfen.","Check Google's registration for this package and signing certificate.","Проверьте регистрацию пакета и сертификата приложения в Google.","Sprawdź rejestrację pakietu i certyfikatu aplikacji w Google."};break;
            case "GMAIL_SCOPE_MISSING":message=new String[]{"Google hat den erforderlichen Mail-Zugriff nicht freigegeben. Mail-Berechtigung und Testnutzer prüfen.","Google has not granted mail access. Check mail permission and test users.","Google не разрешил доступ к почте. Проверьте разрешение и тестовых пользователей.","Google nie przyznał dostępu do poczty. Sprawdź uprawnienia i użytkowników testowych."};break;
            case "GMAIL_ACCOUNT_UNAVAILABLE":message=new String[]{"Google-Freigabe erhalten, aber die zugehörige E-Mail-Adresse konnte nicht sicher ermittelt werden. Internetverbindung prüfen.","Google authorization received, but the account email could not be verified. Check your connection.","Разрешение Google получено, но адрес аккаунта не удалось подтвердить. Проверьте подключение.","Otrzymano zgodę Google, ale nie potwierdzono adresu konta. Sprawdź połączenie."};break;
            case "GMAIL_ACCOUNT_MISMATCH":message=new String[]{"Google hat ein anderes Konto zurückgegeben. Bitte das bereits verbundene Google-Konto auswählen.","Google returned a different account. Select the Google account already connected.","Google вернул другой аккаунт. Выберите ранее подключённый аккаунт.","Google zwrócił inne konto. Wybierz wcześniej połączone konto Google."};break;
            case "GMAIL_TOKEN_MISSING":message=new String[]{"Google hat keine nutzbare Zugriffsfreigabe zurückgegeben.","Google did not return a usable access grant.","Google не вернул действительное разрешение доступа.","Google nie zwrócił działającego uprawnienia dostępu."};break;
            case "GMAIL_TOKEN_REJECTED":message=new String[]{"Google hat die erhaltene Zugriffsfreigabe abgelehnt. Erneute Zustimmung erforderlich.","Google rejected the access grant. Authorize again.","Google отклонил разрешение доступа. Требуется новое согласие.","Google odrzucił uprawnienie dostępu. Wymagana ponowna zgoda."};break;
            case "GMAIL_CONSENT_REQUIRED":message=new String[]{"Google benötigt noch deine ausdrückliche Zustimmung zum Mail-Zugriff.","Google still needs your explicit consent to mail access.","Google ещё требуется ваше согласие на доступ к почте.","Google nadal wymaga wyraźnej zgody na dostęp do poczty."};break;
            case "GMAIL_IMAP_AUTH_FAILED":message=new String[]{"Google-Zustimmung erhalten; Gmail hat die Anmeldung am Posteingangsserver abgelehnt.","Google consent received; Gmail rejected the IMAP login.","Согласие Google получено, но Gmail отклонил вход IMAP.","Otrzymano zgodę Google, ale Gmail odrzucił logowanie IMAP."};break;
            case "GMAIL_SMTP_AUTH_FAILED":message=new String[]{"Google-Zustimmung erhalten; Gmail hat die Anmeldung am Versandserver abgelehnt. Es wurde keine Nachricht gesendet.","Google consent received; Gmail rejected the SMTP login. No message was sent.","Согласие Google получено, но Gmail отклонил вход SMTP. Письмо не отправлено.","Otrzymano zgodę Google, ale Gmail odrzucił logowanie SMTP. Nie wysłano wiadomości."};break;
            case "NETWORK_FAILED":message=new String[]{"Die Google-Verbindung ist fehlgeschlagen. Internetverbindung prüfen.","Google connection failed. Check your internet connection.","Не удалось подключиться к Google. Проверьте интернет.","Nie udało się połączyć z Google. Sprawdź internet."};break;
            default:message=new String[]{"Die Google-Verbindung konnte nicht bestätigt werden.","The Google connection could not be confirmed.","Не удалось подтвердить подключение Google.","Nie udało się potwierdzić połączenia Google."};
        }
        String suffix=code!=null&&code.matches("(?:GMAIL_[A-Z0-9_]{1,60}|NETWORK_FAILED|CANCELLED)")?" ("+code+")":"";
        return message[Math.max(0,Math.min(3,language))]+suffix;
    }
}
