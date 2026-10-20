package de.familyprojekt.privatebrain.pro;

import java.util.Locale;
import javax.mail.internet.InternetAddress;

/** Google treats these two consumer-mail domains as aliases. Do not merge other identities. */
final class GmailIdentity {
    static String key(String email) {
        if(email==null)return "";
        String lower=email.toLowerCase(Locale.ROOT);
        return lower.endsWith("@googlemail.com")?lower.substring(0,lower.length()-15)+"@gmail.com":lower;
    }
    static boolean same(String first,String second){return first!=null&&second!=null&&!first.isEmpty()&&key(first).equals(key(second));}
    static String checked(String email)throws MailFailure {
        try{
            MailAccount.header(email,254);InternetAddress address=new InternetAddress(email,true);address.validate();
            if(!email.equals(address.getAddress())||!email.contains("@"))throw new IllegalArgumentException();return email;
        }catch(Exception error){throw new MailFailure("GMAIL_ACCOUNT_UNAVAILABLE");}
    }
}
