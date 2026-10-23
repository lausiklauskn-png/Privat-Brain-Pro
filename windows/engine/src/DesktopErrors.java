package de.familyprojekt.privatebrain.pro;

final class DesktopErrors {
    static String code(Throwable error) {
        Throwable current=error;
        for(int i=0;i<15&&current!=null;i++){
            if(current instanceof AppNetwork.Blocked)return "APP_OFFLINE";
            if(current instanceof MailFailure)return ((MailFailure)current).code;
            if(current instanceof VaultCrypto.Failure)return current.getMessage();
            if(current instanceof javax.net.ssl.SSLException)return "TLS_FAILED";
            if(current instanceof javax.mail.AuthenticationFailedException)return "AUTH_FAILED";
            if(current instanceof SecurityException)return "VAULT_FOLDER_UNAVAILABLE";
            if(current instanceof java.security.GeneralSecurityException)return "VAULT_UNAVAILABLE";
            current=current.getCause()!=null?current.getCause():current instanceof javax.mail.MessagingException?((javax.mail.MessagingException)current).getNextException():null;
        }
        if(error instanceof org.json.JSONException||error instanceof IllegalArgumentException)return "INVALID_INPUT";
        String message=error.getMessage();
        if(message!=null&&message.matches("(VAULT|ORIGINAL|FILE|FOLDER|STORAGE|GMAIL|PDF|APP|SHARE|LINK|UPDATE|RECOVERY)_[A-Z_]+"))return message;
        return "CONNECTION_FAILED";
    }
}
